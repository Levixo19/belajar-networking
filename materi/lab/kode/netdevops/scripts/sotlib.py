# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Model niat (intent) bersama untuk Lab 08.

Dua sumber data menghasilkan bentuk "raw" yang sama:
  - load_seed():    membaca sot/seed.yml (uji offline, CI tanpa NetBox)
  - load_netbox():  membaca NetBox lewat pynetbox (alur normal)

finalize() lalu mengubah raw menjadi model niat yang sudah diklasifikasi:
setiap interface diberi "kind" (loopback, p2p, lan, host, bridged), peer,
deskripsi, biaya OSPF, dan host diberi gateway. Semua skrip lain (render,
deploy, postcheck) hanya membaca model niat ini.
"""
from __future__ import annotations

import ipaddress
import os
import sys
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parent.parent
LAN_ROLES = {"users", "noc", "servers"}
ROUTER_PLATFORMS = {"frr"}
SWITCH_PLATFORMS = {"srlinux"}
HOST_PLATFORMS = {"linux"}


class SoTError(ValueError):
    """Data source of truth tidak konsisten (harus diperbaiki di NetBox)."""


def warn(msg: str) -> None:
    print(f"PERINGATAN: {msg}", file=sys.stderr)


# --------------------------------------------------------------------------
# Sumber 1: berkas seed
# --------------------------------------------------------------------------
def load_seed(path: Path | str = ROOT / "sot" / "seed.yml") -> dict[str, Any]:
    data = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    devices: dict[str, Any] = {}
    for name, dev in data["devices"].items():
        ifaces = []
        for ifname, attrs in (dev.get("interfaces") or {}).items():
            attrs = attrs or {}
            ifaces.append(
                {
                    "name": ifname,
                    "ip": attrs.get("ip"),
                    "mode": attrs.get("mode", "routed"),
                    "ospf_cost": attrs.get("ospf_cost"),
                    "enabled": attrs.get("enabled", True),
                }
            )
        devices[name] = {
            "role": dev["role"],
            "platform": dev["platform"],
            "device_type": dev["device_type"],
            "mgmt_interface": dev["mgmt"]["interface"],
            "mgmt_ip": dev["mgmt"]["ip"],
            "interfaces": ifaces,
        }
    links = [tuple(link) for link in data.get("links", [])]
    return {
        "site": data["site"],
        "ospf": data["ospf"],
        "prefixes": data["prefixes"],
        "devices": devices,
        "links": links,
    }


# --------------------------------------------------------------------------
# Sumber 2: NetBox
# --------------------------------------------------------------------------
def _get(obj: Any, *keys: str) -> Any:
    """Ambil atribut bertingkat dari Record pynetbox ATAU dict biasa."""
    for key in keys:
        if obj is None:
            return None
        obj = obj.get(key) if isinstance(obj, dict) else getattr(obj, key, None)
    return obj


def load_netbox(
    url: str | None = None,
    token: str | None = None,
    site_slug: str = "dc-jkt",
    seed_path: Path | str = ROOT / "sot" / "seed.yml",
) -> dict[str, Any]:
    import pynetbox  # diimpor di sini agar uji offline tidak butuh pynetbox

    url = url or os.environ.get("NETBOX_URL", "http://localhost:8000")
    token = token or os.environ.get("NETBOX_TOKEN")
    if not token:
        raise SystemExit("NETBOX_TOKEN belum di-set (lihat langkah 2 di lab).")
    nb = pynetbox.api(url, token=token)

    site = nb.dcim.sites.get(slug=site_slug)
    if site is None:
        raise SoTError(f"site '{site_slug}' tidak ada di NetBox; jalankan seed_netbox.py")

    # Parameter OSPF global bukan data inventaris, jadi tetap dibaca dari seed.
    seed = yaml.safe_load(Path(seed_path).read_text(encoding="utf-8"))

    known_roles = {r["slug"] for r in seed["prefix_roles"]}
    prefixes = []
    for p in nb.ipam.prefixes.all():
        role = _get(p, "role", "slug")
        if role in known_roles:
            prefixes.append(
                {"prefix": str(p.prefix), "role": role, "description": p.description or ""}
            )

    devices: dict[str, Any] = {}
    links: set[tuple[str, str]] = set()
    for d in nb.dcim.devices.filter(site_id=site.id):
        ips_by_iface: dict[int, list[str]] = {}
        for ip in nb.ipam.ip_addresses.filter(device_id=d.id):
            ips_by_iface.setdefault(ip.assigned_object_id, []).append(str(ip.address))

        primary = str(d.primary_ip4.address) if d.primary_ip4 else None
        mgmt_iface = None
        ifaces = []
        for i in nb.dcim.interfaces.filter(device_id=d.id):
            addrs = ips_by_iface.get(i.id, [])
            if primary and primary in addrs:
                mgmt_iface = i.name
                continue
            mode = _get(i, "mode", "value")
            ifaces.append(
                {
                    "name": i.name,
                    "ip": addrs[0] if addrs else None,
                    # Port SR Linux "bridged" disimpan di NetBox sebagai mode 802.1Q "access".
                    "mode": "bridged" if mode == "access" else "routed",
                    "ospf_cost": (i.custom_fields or {}).get("ospf_cost"),
                    "enabled": bool(i.enabled),
                }
            )
            for peer in getattr(i, "link_peers", None) or []:
                a = f"{d.name}:{i.name}"
                b = f"{_get(peer, 'device', 'name')}:{_get(peer, 'name')}"
                links.add(tuple(sorted((a, b))))  # type: ignore[arg-type]

        if not primary:
            raise SoTError(f"{d.name}: primary IPv4 (alamat manajemen) belum di-set")
        devices[d.name] = {
            "role": _get(d, "role", "slug"),
            "platform": _get(d, "platform", "slug"),
            "device_type": _get(d, "device_type", "slug"),
            "mgmt_interface": mgmt_iface,
            "mgmt_ip": primary,
            "interfaces": ifaces,
        }

    return {
        "site": {"name": site.name, "slug": site.slug},
        "ospf": seed["ospf"],
        "prefixes": prefixes,
        "devices": devices,
        "links": sorted(links),
    }


# --------------------------------------------------------------------------
# Klasifikasi dan validasi
# --------------------------------------------------------------------------
def finalize(raw: dict[str, Any]) -> dict[str, Any]:
    """Ubah data mentah menjadi model niat yang siap dirender."""
    nets = [
        (ipaddress.ip_network(p["prefix"]), p["role"], p.get("description", ""))
        for p in raw["prefixes"]
    ]

    def role_of(ip_cidr: str) -> str:
        addr = ipaddress.ip_interface(ip_cidr).ip
        # Prefix paling spesifik menang, sama seperti longest prefix match.
        matches = [(n, r) for n, r, _ in nets if addr in n]
        if not matches:
            raise SoTError(f"{ip_cidr} tidak berada di prefix mana pun di IPAM")
        return max(matches, key=lambda m: m[0].prefixlen)[1]

    peers: dict[str, str] = {}
    for a, b in raw["links"]:
        for x in (a, b):
            if x in peers:
                raise SoTError(f"interface {x} muncul di lebih dari satu kabel")
        peers[a], peers[b] = b, a

    seen_ips: dict[str, str] = {}
    devices: dict[str, Any] = {}
    for name in sorted(raw["devices"]):
        dev = raw["devices"][name]
        out_ifaces = []
        for i in sorted(dev["interfaces"], key=lambda x: _ifsort(x["name"])):
            key = f"{name}:{i['name']}"
            entry = {
                "name": i["name"],
                "ip": i["ip"],
                "enabled": i["enabled"],
                "peer": peers.get(key),
                "ospf_cost": None,
            }
            if i["mode"] == "bridged":
                entry["kind"] = "bridged"
            elif not i["ip"]:
                entry["kind"] = "unused"
            else:
                ip_only = str(ipaddress.ip_interface(i["ip"]).ip)
                if ip_only in seen_ips:
                    raise SoTError(f"IP {ip_only} dipakai ganda: {seen_ips[ip_only]} dan {key}")
                seen_ips[ip_only] = key
                role = role_of(i["ip"])
                if dev["platform"] in HOST_PLATFORMS:
                    entry["kind"] = "host"
                elif role == "loopback":
                    entry["kind"] = "loopback"
                elif role == "p2p":
                    entry["kind"] = "p2p"
                    entry["ospf_cost"] = i["ospf_cost"] or raw["ospf"]["default_cost"]
                elif role in LAN_ROLES:
                    entry["kind"] = "lan"
                else:
                    raise SoTError(f"{key}: peran prefix '{role}' tidak dikenal")
            if entry["peer"]:
                pdev, pif = entry["peer"].split(":", 1)
                entry["description"] = f"ke {pdev} {pif}"
            else:
                entry["description"] = ""
            out_ifaces.append(entry)

        devices[name] = {
            "name": name,
            "role": dev["role"],
            "platform": dev["platform"],
            "device_type": dev["device_type"],
            "mgmt_interface": dev["mgmt_interface"],
            "mgmt_ip": str(ipaddress.ip_interface(dev["mgmt_ip"]).ip),
            "interfaces": out_ifaces,
        }

    _check_p2p(devices)
    _fill_router_facts(devices)
    _fill_host_gateways(devices)
    return {
        "site": raw["site"],
        "ospf": raw["ospf"],
        "prefixes": sorted(
            ({"prefix": str(n), "role": r, "description": d} for n, r, d in nets),
            key=lambda p: ipaddress.ip_network(p["prefix"]),
        ),
        "devices": devices,
    }


def _ifsort(name: str) -> tuple:
    """Urutkan eth2 sebelum eth10, lo paling awal."""
    head = name.rstrip("0123456789/-")
    tail = name[len(head):]
    nums = tuple(int(x) for x in tail.replace("/", "-").split("-") if x.isdigit())
    return (0 if name == "lo" else 1, head, nums)


def _check_p2p(devices: dict[str, Any]) -> None:
    """Peringatkan (tidak menggagalkan) bila dua ujung /31 tidak satu subnet.

    Sengaja hanya peringatan: lab ini ingin menunjukkan bahwa peringatan
    mudah terlewat, sedangkan uji Batfish di CI tidak bisa diabaikan.
    """
    for dname, dev in devices.items():
        for i in dev["interfaces"]:
            if i["kind"] != "p2p" or not i["peer"]:
                continue
            pdev, pif = i["peer"].split(":", 1)
            other = next(
                (x for x in devices.get(pdev, {}).get("interfaces", []) if x["name"] == pif),
                None,
            )
            if not other or not other["ip"]:
                warn(f"{dname}:{i['name']} punya peer {i['peer']} tanpa alamat IP")
                continue
            if ipaddress.ip_interface(i["ip"]).network != ipaddress.ip_interface(other["ip"]).network:
                warn(f"{dname}:{i['name']} ({i['ip']}) dan {i['peer']} ({other['ip']}) beda subnet")


def _fill_router_facts(devices: dict[str, Any]) -> None:
    for dev in devices.values():
        if dev["platform"] not in ROUTER_PLATFORMS:
            continue
        loopbacks = [i for i in dev["interfaces"] if i["kind"] == "loopback"]
        if not loopbacks:
            raise SoTError(f"{dev['name']}: router wajib punya loopback (untuk router-id)")
        dev["router_id"] = str(ipaddress.ip_interface(loopbacks[0]["ip"]).ip)
        dev["lan_prefixes"] = sorted(
            {str(ipaddress.ip_interface(i["ip"]).network) for i in dev["interfaces"] if i["kind"] == "lan"},
            key=ipaddress.ip_network,
        )


def _fill_host_gateways(devices: dict[str, Any]) -> None:
    router_ips = [
        ipaddress.ip_interface(i["ip"])
        for d in devices.values()
        if d["platform"] in ROUTER_PLATFORMS
        for i in d["interfaces"]
        if i["kind"] == "lan"
    ]
    for dev in devices.values():
        if dev["platform"] not in HOST_PLATFORMS:
            continue
        for i in dev["interfaces"]:
            if i["kind"] != "host":
                continue
            net = ipaddress.ip_interface(i["ip"]).network
            gws = [str(r.ip) for r in router_ips if r.network == net]
            if not gws:
                raise SoTError(f"{dev['name']}:{i['name']} tidak punya gateway router di {net}")
            i["gateway"] = gws[0]


def resolve_roles(intent: dict[str, Any], roles: list[str] | str) -> list[str | None]:
    """Ubah daftar peran prefix (users, noc, ...) menjadi daftar CIDR."""
    if roles == "any":
        return [None]
    if isinstance(roles, str):
        roles = [roles]
    out = [p["prefix"] for p in intent["prefixes"] if p["role"] in roles]
    missing = set(roles) - {p["role"] for p in intent["prefixes"]}
    if missing:
        raise SoTError(f"peran prefix tidak dikenal di kebijakan: {sorted(missing)}")
    return out


def load_intent(source: str = "netbox", seed_path: Path | str | None = None) -> dict[str, Any]:
    seed_path = seed_path or ROOT / "sot" / "seed.yml"
    raw = load_seed(seed_path) if source == "seed" else load_netbox(seed_path=seed_path)
    return finalize(raw)

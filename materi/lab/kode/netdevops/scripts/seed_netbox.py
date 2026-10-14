#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Isi NetBox dari sot/seed.yml lewat REST API (pynetbox). Idempoten.

Menjalankan skrip ini dua kali tidak membuat data ganda: setiap objek dicari
dulu, baru dibuat bila belum ada. Ini prinsip yang sama dengan otomasi
konfigurasi perangkat: nyatakan keadaan akhir, bukan langkah.

Variabel lingkungan:
  NETBOX_URL    default http://localhost:8000
  NETBOX_TOKEN  token v2, bentuknya nbt_<key>.<token>
"""
from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

import pynetbox
import yaml

ROOT = Path(__file__).resolve().parent.parent
created: list[str] = []


def ensure(endpoint: Any, lookup: dict[str, Any], payload: dict[str, Any], label: str) -> Any:
    """Cari objek dengan filter `lookup`; bila tidak ada, buat dari `payload`."""
    obj = endpoint.get(**lookup)
    if obj is None:
        obj = endpoint.create(payload)
        created.append(label)
    return obj


def main() -> int:
    url = os.environ.get("NETBOX_URL", "http://localhost:8000")
    token = os.environ.get("NETBOX_TOKEN")
    if not token:
        print("NETBOX_TOKEN belum di-set.", file=sys.stderr)
        return 1
    nb = pynetbox.api(url, token=token)
    seed = yaml.safe_load((ROOT / "sot" / "seed.yml").read_text(encoding="utf-8"))

    site = ensure(nb.dcim.sites, {"slug": seed["site"]["slug"]}, {**seed["site"], "status": "active"}, "site")

    # Custom field untuk biaya OSPF per interface. NetBox 4.x memakai "object_types".
    ensure(
        nb.extras.custom_fields,
        {"name": "ospf_cost"},
        {
            "name": "ospf_cost",
            "label": "OSPF cost",
            "type": "integer",
            "object_types": ["dcim.interface"],
            "required": False,
        },
        "custom field ospf_cost",
    )

    roles = {}
    for r in seed["prefix_roles"]:
        roles[r["slug"]] = ensure(nb.ipam.roles, {"slug": r["slug"]}, r, f"role {r['slug']}")
    for p in seed["prefixes"]:
        ensure(
            nb.ipam.prefixes,
            {"prefix": p["prefix"]},
            {"prefix": p["prefix"], "role": roles[p["role"]].id, "description": p["description"], "status": "active"},
            f"prefix {p['prefix']}",
        )

    manufacturers, dtypes, droles, platforms = {}, {}, {}, {}
    for dt in seed["device_types"]:
        m = dt["manufacturer"]
        if m not in manufacturers:
            slug = m.lower().replace(" ", "-")
            manufacturers[m] = ensure(
                nb.dcim.manufacturers, {"slug": slug}, {"name": m, "slug": slug}, f"manufacturer {m}"
            )
        dtypes[dt["slug"]] = ensure(
            nb.dcim.device_types,
            {"slug": dt["slug"]},
            {"slug": dt["slug"], "model": dt["model"], "manufacturer": manufacturers[m].id},
            f"device type {dt['slug']}",
        )
    for r in seed["device_roles"]:
        droles[r["slug"]] = ensure(
            nb.dcim.device_roles, {"slug": r["slug"]}, r, f"device role {r['slug']}"
        )
    for p in seed["platforms"]:
        platforms[p["slug"]] = ensure(nb.dcim.platforms, {"slug": p["slug"]}, p, f"platform {p['slug']}")

    ifaces: dict[str, Any] = {}
    for name, dev in seed["devices"].items():
        d = ensure(
            nb.dcim.devices,
            {"name": name, "site_id": site.id},
            {
                "name": name,
                "site": site.id,
                "role": droles[dev["role"]].id,
                "device_type": dtypes[dev["device_type"]].id,
                "platform": platforms[dev["platform"]].id,
                "status": "active",
            },
            f"device {name}",
        )
        all_ifaces = {dev["mgmt"]["interface"]: {"ip": dev["mgmt"]["ip"], "mgmt": True}}
        all_ifaces.update(dev.get("interfaces") or {})
        for ifname, attrs in all_ifaces.items():
            attrs = attrs or {}
            payload: dict[str, Any] = {
                "type": "virtual" if ifname == "lo" else "1000base-t",
                "enabled": attrs.get("enabled", True),
                "mgmt_only": bool(attrs.get("mgmt")),
            }
            if attrs.get("mode") == "bridged":
                payload["mode"] = "access"
            if attrs.get("ospf_cost") is not None:
                payload["custom_fields"] = {"ospf_cost": attrs["ospf_cost"]}
            iface = ensure(
                nb.dcim.interfaces,
                {"device_id": d.id, "name": ifname},
                {"device": d.id, "name": ifname, **payload},
                f"interface {name}:{ifname}",
            )
            ifaces[f"{name}:{ifname}"] = iface
            if attrs.get("ip"):
                ip = ensure(
                    nb.ipam.ip_addresses,
                    {"address": attrs["ip"], "interface_id": iface.id},
                    {
                        "address": attrs["ip"],
                        "assigned_object_type": "dcim.interface",
                        "assigned_object_id": iface.id,
                        "status": "active",
                        **({"role": "loopback"} if ifname == "lo" else {}),
                    },
                    f"ip {attrs['ip']}",
                )
                if attrs.get("mgmt") and (d.primary_ip4 is None or d.primary_ip4.id != ip.id):
                    d.primary_ip4 = ip.id
                    d.save()
                    created.append(f"primary_ip4 {name}")

    for a, b in seed["links"]:
        ia, ib = ifaces[a], ifaces[b]
        ia = nb.dcim.interfaces.get(ia.id)  # segarkan, mungkin sudah punya kabel
        if ia.cable:
            continue
        nb.dcim.cables.create(
            {
                "a_terminations": [{"object_type": "dcim.interface", "object_id": ia.id}],
                "b_terminations": [{"object_type": "dcim.interface", "object_id": ib.id}],
                "status": "connected",
            }
        )
        created.append(f"cable {a} <-> {b}")

    print(f"Selesai. {len(created)} objek baru dibuat.")
    for c in created:
        print("  +", c)
    return 0


if __name__ == "__main__":
    sys.exit(main())

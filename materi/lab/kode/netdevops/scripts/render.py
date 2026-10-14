#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Render konfigurasi dari source of truth (NetBox + policy/) ke build/.

Keluaran (semuanya deterministik agar diff Git bersih):
  build/configs/<r>.frr.conf        konfigurasi FRR untuk deploy
  build/configs/<sw>.srl.cli        konfigurasi SR Linux (flat CLI) untuk deploy
  build/configs/<host>.iptables     firewall host untuk deploy
  build/batfish/                    snapshot Batfish (configs/, hosts/, iptables/)
  build/inventory/hosts.yaml        inventaris Nornir
  build/intent.json                 model niat, dipakai postcheck

Contoh:
  python scripts/render.py                    # dari NetBox (NETBOX_URL, NETBOX_TOKEN)
  python scripts/render.py --source seed      # offline dari sot/seed.yml
  python scripts/render.py --check            # gagal bila build/ tidak sama dengan hasil render
"""
from __future__ import annotations

import argparse
import difflib
import json
import shutil
import sys
import tempfile
from pathlib import Path
from typing import Any

import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sotlib import ROOT, SoTError, load_intent, resolve_roles

FRR_VERSION = "10.7.1"
MACVRF = "lan"
CLAB_PREFIX = "clab-netdevops"
GENERATED = ["configs", "batfish", "inventory", "intent.json"]
GROUP_BY_PLATFORM = {"frr": "frr", "srlinux": "srlinux", "linux": "linux_host"}


def jinja_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(ROOT / "templates"),
        trim_blocks=True,
        lstrip_blocks=True,
        keep_trailing_newline=True,
        undefined=StrictUndefined,
    )


def firewall_rules(intent: dict[str, Any], fw: dict[str, Any]) -> list[dict[str, Any]]:
    """Kembangkan aturan kebijakan menjadi satu baris iptables per (sumber, port)."""
    rules = []
    for rule in fw["rules"]:
        ports = rule.get("ports") or [None]
        for src in resolve_roles(intent, rule["from"]):
            for port in ports:
                rules.append({"name": rule["name"], "proto": rule["proto"], "src": src, "port": port})
    return rules


def batfish_router_file(dev: dict[str, Any], frr_text: str) -> str:
    """Bungkus frr.conf ke format 'cumulus_concatenated' yang dipahami Batfish.

    Urutannya: hostname, isi /etc/network/interfaces, penanda ports.conf,
    lalu frr.conf. Alamat IP cukup ada di frr.conf (zebra yang memasangnya).
    """
    lines = [dev["name"], "# This file describes the network interfaces", "auto lo", "iface lo inet loopback", ""]
    for i in dev["interfaces"]:
        if i["kind"] in ("p2p", "lan"):
            lines += [f"auto {i['name']}", f"iface {i['name']}", ""]
    lines += ["# ports.conf --", ""]
    return "\n".join(lines) + frr_text


def batfish_host_file(dev: dict[str, Any], has_iptables: bool) -> str:
    host_ifaces = {
        i["name"]: {"name": i["name"], "prefix": i["ip"], "gateway": i["gateway"]}
        for i in dev["interfaces"]
        if i["kind"] == "host"
    }
    doc: dict[str, Any] = {"hostname": dev["name"], "hostInterfaces": host_ifaces}
    if has_iptables:
        doc["iptablesFile"] = f"iptables/{dev['name']}.iptables"
    return json.dumps(doc, indent=2, sort_keys=True) + "\n"


def render_tree(intent: dict[str, Any], policy: dict[str, Any], out: Path) -> None:
    env = jinja_env()
    (out / "configs").mkdir(parents=True)
    for sub in ("configs", "hosts", "iptables"):
        (out / "batfish" / sub).mkdir(parents=True)
    (out / "inventory").mkdir(parents=True)

    hosts: dict[str, Any] = {}
    for name, dev in sorted(intent["devices"].items()):
        cfg_rel = None
        if dev["platform"] == "frr":
            text = env.get_template("frr.conf.j2").render(
                dev=dev, ospf=intent["ospf"], frr_version=FRR_VERSION
            )
            cfg_rel = f"configs/{name}.frr.conf"
            (out / cfg_rel).write_text(text, encoding="utf-8")
            (out / "batfish" / "configs" / f"{name}.cfg").write_text(
                batfish_router_file(dev, text), encoding="utf-8"
            )
        elif dev["platform"] == "srlinux":
            text = env.get_template("srlinux.cli.j2").render(dev=dev, site=intent["site"], macvrf=MACVRF)
            cfg_rel = f"configs/{name}.srl.cli"
            (out / cfg_rel).write_text(text, encoding="utf-8")
            # SR Linux tidak dimodelkan Batfish. Karena switch ini murni L2,
            # Batfish tetap bisa menyimpulkan adjacency L3 router<->host dari subnet.
        elif dev["platform"] == "linux":
            fw = policy.get(name)
            if fw:
                text = env.get_template("iptables.j2").render(fw=fw, rules=firewall_rules(intent, fw))
                cfg_rel = f"configs/{name}.iptables"
                (out / cfg_rel).write_text(text, encoding="utf-8")
                (out / "batfish" / "iptables" / f"{name}.iptables").write_text(text, encoding="utf-8")
            (out / "batfish" / "hosts" / f"{name}.json").write_text(
                batfish_host_file(dev, has_iptables=bool(fw)), encoding="utf-8"
            )
        else:
            raise SoTError(f"{name}: platform '{dev['platform']}' tidak didukung lab ini")

        hosts[name] = {
            "hostname": dev["mgmt_ip"],
            "groups": [GROUP_BY_PLATFORM[dev["platform"]]],
            "data": {
                "role": dev["role"],
                "nos": dev["platform"],
                "config": f"build/{cfg_rel}" if cfg_rel else None,
                "container": f"{CLAB_PREFIX}-{name}",
            },
        }

    header = "# Dihasilkan oleh scripts/render.py. JANGAN diedit manual.\n"
    (out / "inventory" / "hosts.yaml").write_text(
        header + yaml.safe_dump(hosts, sort_keys=True, default_flow_style=False), encoding="utf-8"
    )
    (out / "intent.json").write_text(json.dumps(intent, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def tree_files(base: Path) -> dict[str, str]:
    files = {}
    for name in GENERATED:
        p = base / name
        if p.is_file():
            files[name] = p.read_text(encoding="utf-8")
        elif p.is_dir():
            for f in sorted(p.rglob("*")):
                if f.is_file():
                    files[str(f.relative_to(base))] = f.read_text(encoding="utf-8")
    return files


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--source", choices=["netbox", "seed"], default="netbox")
    ap.add_argument("--seed", default=str(ROOT / "sot" / "seed.yml"))
    ap.add_argument("--policy", default=str(ROOT / "policy" / "firewall.yml"))
    ap.add_argument("--out", default=str(ROOT / "build"))
    ap.add_argument("--check", action="store_true", help="bandingkan saja, jangan menulis")
    args = ap.parse_args()

    try:
        intent = load_intent(args.source, args.seed)
        policy = yaml.safe_load(Path(args.policy).read_text(encoding="utf-8")) or {}
        with tempfile.TemporaryDirectory() as tmp:
            fresh = Path(tmp) / "build"
            render_tree(intent, policy, fresh)
            out = Path(args.out)
            if args.check:
                old, new = tree_files(out), tree_files(fresh)
                if old == new:
                    print("OK: build/ sesuai dengan source of truth")
                    return 0
                for path in sorted(set(old) | set(new)):
                    if old.get(path) != new.get(path):
                        sys.stdout.writelines(
                            difflib.unified_diff(
                                (old.get(path) or "").splitlines(keepends=True),
                                (new.get(path) or "").splitlines(keepends=True),
                                f"a/build/{path}",
                                f"b/build/{path}",
                            )
                        )
                print("GAGAL: build/ berbeda dari hasil render. Jalankan render.py lalu commit.")
                return 1
            out.mkdir(parents=True, exist_ok=True)
            for name in GENERATED:
                target = out / name
                if target.is_dir():
                    shutil.rmtree(target)
                elif target.exists():
                    target.unlink()
                src = fresh / name
                if src.is_dir():
                    shutil.copytree(src, target)
                else:
                    shutil.copy2(src, target)
    except SoTError as exc:
        print(f"SoT tidak konsisten: {exc}", file=sys.stderr)
        return 2
    n = len(intent["devices"])
    print(f"Render selesai: {n} perangkat -> {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

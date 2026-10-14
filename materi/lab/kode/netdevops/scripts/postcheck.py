#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Periksa kesehatan jaringan lab terhadap model niat (build/intent.json).

Memeriksa: tetangga OSPF Full per router, keberadaan semua prefix penting di
tabel routing, status port SR Linux, dan uji layanan dari host (docker exec).
Kode keluar 0 bila semua lolos, 1 bila ada yang gagal.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from nornir import InitNornir
from tasks import run_checks

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    os.chdir(ROOT)
    intent = json.loads(Path("build/intent.json").read_text(encoding="utf-8"))
    nr = InitNornir(config_file="nornir/config.yaml")
    if "srlinux" in nr.inventory.groups:
        nr.inventory.groups["srlinux"].password = os.environ.get("SRL_PASSWORD", "NokiaSrl1!")
    try:
        checks = run_checks(nr, intent)
    finally:
        nr.close_connections()
    bad = 0
    for c in checks:
        print(f"[{'OK ' if c['ok'] else 'GAGAL'}] {c['id']}: {c['detail']}")
        bad += not c["ok"]
    print(f"\n{len(checks) - bad}/{len(checks)} pemeriksaan lolos")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())

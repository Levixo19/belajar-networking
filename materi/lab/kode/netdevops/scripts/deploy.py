#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Deploy konfigurasi build/ ke lab dengan Nornir: canary, post-check, rollback.

Alur:
  1. pre-check: catat kondisi jaringan sebelum perubahan
  2. tahap canary: satu perangkat dulu, lalu post-check (tidak boleh ada regresi)
  3. tahap sisanya: semua perangkat lain, lalu post-check penuh
  4. bila post-check gagal: rollback semua perangkat yang sudah berubah

Contoh:
  python scripts/deploy.py --dry-run                 # tampilkan diff saja
  python scripts/deploy.py --dry-run --fail-on-diff  # deteksi drift (exit 4 bila ada)
  python scripts/deploy.py                           # terapkan, canary r4
  python scripts/deploy.py --canary none             # terapkan sekaligus (deploy pertama)
  python scripts/deploy.py --limit sw1,sw2           # hanya perangkat tertentu

Kode keluar: 0 sukses, 2 deploy gagal (sudah di-rollback), 3 post-check gagal
(sudah di-rollback), 4 drift terdeteksi, 5 masalah lama yang tidak disebabkan deploy ini.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from nornir import InitNornir
from tasks import RUN_ID, deploy_host, rollback_host, run_checks

ROOT = Path(__file__).resolve().parent.parent


def summarize(res: Any) -> list[dict[str, Any]]:
    rows = []
    for host, mr in sorted(res.items()):
        r = mr[0]
        rows.append(
            {
                "host": host,
                "failed": mr.failed,
                "changed": bool(r.changed),
                "diff": r.diff or "",
                "error": str(r.exception) if r.exception else "",
            }
        )
        status = "GAGAL" if mr.failed else ("BERUBAH" if r.changed else "tetap")
        print(f"\n=== {host}: {status}")
        if r.diff:
            print(r.diff)
        if mr.failed:
            print(r.exception or r.result)
    return rows


def show_checks(checks: list[dict[str, Any]], before: set[str] | None = None) -> None:
    for c in checks:
        mark = "OK " if c["ok"] else ("LAMA" if before is not None and c["id"] in before else "GAGAL")
        print(f"  [{mark}] {c['id']}: {c['detail']}")


def settle_checks(
    nr: Any, intent: dict[str, Any], timeout: int, good_enough: Callable[[list[dict[str, Any]]], bool]
) -> list[dict[str, Any]]:
    """Ulangi post-check sampai memenuhi syarat atau waktu habis.

    Protokol routing butuh waktu untuk konvergen (hello OSPF, pertukaran LSDB).
    Memeriksa sekali tepat setelah commit akan melaporkan "regresi" palsu.
    """
    deadline = time.monotonic() + timeout
    while True:
        checks = run_checks(nr, intent)
        if good_enough(checks) or time.monotonic() >= deadline:
            return checks
        print(f"  ... belum stabil, ulangi dalam 5 detik (sisa {int(deadline - time.monotonic())} detik)")
        time.sleep(5)


def rollback(nr: Any, names: list[str]) -> None:
    if not names:
        return
    print(f"\n>>> ROLLBACK: {', '.join(sorted(names))}")
    sub = nr.filter(filter_func=lambda h: h.name in names)
    res = sub.run(task=rollback_host, name="rollback")
    for host, mr in sorted(res.items()):
        print(f"  {host}: {'GAGAL ' + str(mr[0].exception) if mr.failed else mr[0].result}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true", help="tampilkan diff tanpa menerapkan")
    ap.add_argument("--fail-on-diff", action="store_true", help="exit 4 bila ada diff (deteksi drift)")
    ap.add_argument("--canary", default="r4", help="perangkat canary, atau 'none'")
    ap.add_argument("--limit", default="", help="daftar perangkat dipisah koma")
    ap.add_argument("--skip-postcheck", action="store_true")
    ap.add_argument("--settle", type=int, default=90, help="detik maksimum menunggu jaringan stabil")
    ap.add_argument("--no-rollback", action="store_true", help="jangan rollback otomatis (latihan troubleshooting)")
    ap.add_argument("--message", default=os.environ.get("GITHUB_SHA", "manual"), help="pesan commit/checkpoint")
    args = ap.parse_args()

    os.chdir(ROOT)
    intent = json.loads(Path("build/intent.json").read_text(encoding="utf-8"))
    nr = InitNornir(config_file="nornir/config.yaml")
    if "srlinux" in nr.inventory.groups:
        nr.inventory.groups["srlinux"].password = os.environ.get("SRL_PASSWORD", "NokiaSrl1!")

    targets = nr.filter(filter_func=lambda h: bool(h.get("config")))
    if args.limit:
        wanted = {x.strip() for x in args.limit.split(",") if x.strip()}
        targets = targets.filter(filter_func=lambda h: h.name in wanted)
    names = sorted(targets.inventory.hosts)
    if not names:
        print("Tidak ada perangkat yang cocok.")
        return 0

    canary = args.canary if args.canary in names else None
    stages = [("canary", [canary])] if canary else []
    stages.append(("sisanya", [n for n in names if n != canary]))

    report: dict[str, Any] = {"run_id": RUN_ID, "dry_run": args.dry_run, "stages": []}
    before: set[str] = set()
    do_checks = not args.dry_run and not args.skip_postcheck
    if do_checks:
        print(">>> PRE-CHECK")
        pre = run_checks(nr, intent)
        show_checks(pre)
        before = {c["id"] for c in pre if not c["ok"]}
        report["precheck"] = pre

    applied: list[str] = []
    any_diff = False
    exit_code = 0
    try:
        for label, members in stages:
            if not members:
                continue
            print(f"\n>>> TAHAP {label.upper()}: {', '.join(members)} ({'dry-run' if args.dry_run else 'terapkan'})")
            group = targets.filter(filter_func=lambda h, m=members: h.name in m)
            res = group.run(task=deploy_host, dry_run=args.dry_run, message=args.message, name=f"deploy {label}")
            rows = summarize(res)
            stage_report: dict[str, Any] = {"stage": label, "hosts": rows}
            report["stages"].append(stage_report)
            any_diff |= any(r["changed"] for r in rows)
            applied += [h for h in members if nr.inventory.hosts[h].data.get("_applied")]

            if res.failed:
                print("\nDeploy gagal di:", ", ".join(sorted(res.failed_hosts)))
                if not args.dry_run and not args.no_rollback:
                    rollback(nr, applied)
                exit_code = 2
                break

            if do_checks and applied:
                print(f"\n>>> POST-CHECK setelah tahap {label}")
                final = label == stages[-1][0]

                def good_enough(checks: list[dict[str, Any]], final: bool = final) -> bool:
                    failing_now = {c["id"] for c in checks if not c["ok"]}
                    return not failing_now if final else not (failing_now - before)

                post = settle_checks(nr, intent, args.settle, good_enough)
                show_checks(post, before)
                stage_report["postcheck"] = post
                failing = {c["id"] for c in post if not c["ok"]}
                regress = sorted(failing - before)
                if regress:
                    print(f"\nREGRESI: {', '.join(regress)}")
                    if args.no_rollback:
                        print("--no-rollback aktif: jaringan DIBIARKAN dalam kondisi ini.")
                    else:
                        rollback(nr, applied)
                    exit_code = 3
                    break
                if final and failing:
                    print("\nMasih ada pemeriksaan gagal, tetapi semuanya sudah gagal SEBELUM deploy.")
                    print("Rollback tidak akan menolong. Selidiki:", ", ".join(sorted(failing)))
                    exit_code = 5
    finally:
        nr.close_connections()
        reports = Path("build/reports")
        reports.mkdir(parents=True, exist_ok=True)
        report["finished"] = datetime.now(UTC).isoformat()
        report["exit_code"] = exit_code
        (reports / f"deploy-{RUN_ID}.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")

    if exit_code == 0 and args.dry_run and args.fail_on_diff and any_diff:
        print("\nDRIFT: perangkat tidak sama dengan build/ (lihat diff di atas).")
        return 4
    if exit_code == 0:
        print("\nSelesai tanpa masalah." if not args.dry_run else "\nDry-run selesai.")
    return exit_code


if __name__ == "__main__":
    sys.exit(main())

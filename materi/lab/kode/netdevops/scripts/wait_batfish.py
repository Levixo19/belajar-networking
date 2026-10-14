#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Tunggu sampai layanan Batfish siap menerima permintaan (dipakai di CI).

Batfish adalah aplikasi Java yang butuh puluhan detik untuk siap setelah
container mulai. Membuat Session sudah memanggil API layanan, jadi berhasilnya
Session() berarti layanan siap.
"""
from __future__ import annotations

import argparse
import os
import sys
import time


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default=os.environ.get("BATFISH_HOST", "localhost"))
    ap.add_argument("--timeout", type=int, default=300)
    args = ap.parse_args()

    from pybatfish.client.session import Session

    deadline = time.monotonic() + args.timeout
    last_err: Exception | None = None
    while time.monotonic() < deadline:
        try:
            Session(host=args.host)
            print(f"Batfish di {args.host} siap.")
            return 0
        except Exception as exc:
            last_err = exc
            time.sleep(5)
    print(f"Batfish tidak siap dalam {args.timeout} detik: {last_err}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())

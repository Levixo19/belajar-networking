# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Fixture pytest untuk uji Batfish Lab 08.

Variabel lingkungan:
  BATFISH_HOST   alamat layanan Batfish (default localhost)
  BF_SNAPSHOT    direktori snapshot kandidat (default build/batfish)
  BF_BASELINE    direktori snapshot pembanding, mis. hasil render cabang main.
                 Bila tidak di-set, uji differential dilewati.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
NETWORK = "netdevops-lab"


@pytest.fixture(scope="session")
def intent() -> dict:
    return json.loads((ROOT / "build" / "intent.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def bf():
    from pybatfish.client.session import Session

    snapshot = Path(os.environ.get("BF_SNAPSHOT", ROOT / "build" / "batfish"))
    session = Session(host=os.environ.get("BATFISH_HOST", "localhost"))
    session.set_network(NETWORK)
    session.init_snapshot(str(snapshot), name="candidate", overwrite=True)
    baseline = os.environ.get("BF_BASELINE")
    if baseline and Path(baseline).is_dir():
        session.init_snapshot(baseline, name="baseline", overwrite=True)
    session.set_snapshot("candidate")
    return session


@pytest.fixture(scope="session")
def has_baseline(bf) -> bool:
    return "baseline" in bf.list_snapshots()

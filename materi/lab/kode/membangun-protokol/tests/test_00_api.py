# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Starter dan referensi harus punya antarmuka publik yang sama persis, supaya uji yang
sama berlaku untuk keduanya. Uji ini selalu membandingkan kedua paket."""

import importlib
import inspect

import pytest

MODUL = ["soket", "rdt", "traceroute", "router", "dv"]


def _publik(mod):
    return {n: o for n, o in vars(mod).items()
            if not n.startswith("_") and getattr(o, "__module__", mod.__name__) == mod.__name__}


@pytest.mark.parametrize("nama", MODUL)
def test_antarmuka_starter_sama_dengan_referensi(nama):
    ref = importlib.import_module(f"referensi.{nama}")
    sta = importlib.import_module(f"starter.{nama}")
    p_ref, p_sta = _publik(ref), _publik(sta)
    assert set(p_ref) == set(p_sta)
    for n, o in p_ref.items():
        if inspect.isfunction(o):
            assert inspect.signature(o) == inspect.signature(p_sta[n]), n
        elif inspect.isclass(o):
            for m, f in vars(o).items():
                if inspect.isfunction(f) and (not m.startswith("_") or m == "__init__"):
                    assert m in vars(p_sta[n]), f"{n}.{m} hilang di starter"
                    assert inspect.signature(f) == inspect.signature(vars(p_sta[n])[m]), f"{n}.{m}"


@pytest.mark.parametrize("nama", MODUL)
def test_starter_masih_berisi_todo(nama):
    """Jaga agar tidak ada yang tak sengaja menyalin kunci jawaban ke starter."""
    sumber = inspect.getsource(importlib.import_module(f"starter.{nama}"))
    assert "NotImplementedError" in sumber and "TODO" in sumber

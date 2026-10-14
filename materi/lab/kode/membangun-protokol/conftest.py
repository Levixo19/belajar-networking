# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Konfigurasi pytest Lab 07.

Secara bawaan uji dijalankan terhadap kode REFERENSI (agar repositori selalu hijau).
Untuk menguji pekerjaan Anda sendiri:

    pytest --impl=starter                 # semua latihan
    pytest --impl=starter tests/test_71_soket.py
    LAB7_IMPL=starter pytest              # alternatif lewat variabel lingkungan
"""

import importlib
import os

import pytest


def pytest_addoption(parser):
    parser.addoption(
        "--impl", default=os.environ.get("LAB7_IMPL", "referensi"),
        choices=["referensi", "starter"],
        help="paket implementasi yang diuji (bawaan: referensi)",
    )


def pytest_report_header(config):
    return f"Lab 07 implementasi yang diuji: {config.getoption('--impl')}"


def _muat(request, nama):
    return importlib.import_module(f"{request.config.getoption('--impl')}.{nama}")


@pytest.fixture
def soket(request):
    return _muat(request, "soket")


@pytest.fixture
def rdt(request):
    return _muat(request, "rdt")


@pytest.fixture
def tr(request):
    return _muat(request, "traceroute")


@pytest.fixture
def router(request):
    return _muat(request, "router")


@pytest.fixture
def dv(request):
    return _muat(request, "dv")

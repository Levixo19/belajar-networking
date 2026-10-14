# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Uji Lab 7.3: traceroute buatan sendiri (mode simulasi, IP_RECVERR, dan raw)."""

import socket
import sys

import pytest

from umum.paket import (
    PROTO_ICMP, PROTO_TCP, PROTO_UDP, PaketICMP, PaketIPv4, buat_icmp_echo, buat_udp, kutipan_icmp,
)
from umum.penjejak import HopSimulasi, InfoICMP, PenjejakRaw, PenjejakRecverr, PenjejakSimulasi

TUJUAN = "203.0.113.5"


def _probe(port, tujuan=TUJUAN, proto=PROTO_UDP):
    isi = buat_udp(40000, port, b"lab07") if proto == PROTO_UDP else b"\x9c\x40" + port.to_bytes(2, "big") + b"\0" * 16
    return PaketIPv4("192.0.2.10", tujuan, proto, isi, ttl=1).ke_bytes()


def _icmp(dari, tipe, kode, kutipan):
    return PaketIPv4(dari, "192.0.2.10", PROTO_ICMP, PaketICMP(tipe, kode, isi=kutipan).ke_bytes()).ke_bytes()


# --- pengurai ---------------------------------------------------------------------

def test_urai_time_exceeded(tr):
    paket = _icmp("10.1.1.1", 11, 0, kutipan_icmp(_probe(33440)))
    assert tr.urai_balasan_icmp(paket) == InfoICMP("10.1.1.1", 11, 0, TUJUAN, 33440)


def test_urai_port_unreachable(tr):
    paket = _icmp(TUJUAN, 3, 3, kutipan_icmp(_probe(33500)))
    assert tr.urai_balasan_icmp(paket) == InfoICMP(TUJUAN, 3, 3, TUJUAN, 33500)


def test_urai_menolak_yang_bukan_balasan_probe(tr):
    echo = PaketIPv4("8.8.8.8", "192.0.2.10", PROTO_ICMP, buat_icmp_echo(1, 1, b"x", balasan=True)).ke_bytes()
    assert tr.urai_balasan_icmp(echo) is None                                     # echo reply
    assert tr.urai_balasan_icmp(_probe(1)) is None                                # bukan ICMP
    assert tr.urai_balasan_icmp(_icmp("10.1.1.1", 11, 0, kutipan_icmp(_probe(1, proto=PROTO_TCP)))) is None
    rusak = bytearray(_icmp("10.1.1.1", 11, 0, kutipan_icmp(_probe(2))))
    rusak[-1] ^= 0xFF                                                             # checksum ICMP salah
    assert tr.urai_balasan_icmp(bytes(rusak)) is None
    assert tr.urai_balasan_icmp(b"\x45\x00") is None                               # sampah
    assert tr.urai_balasan_icmp(_icmp("10.1.1.1", 11, 0, b"\x45\x00\x00")) is None  # kutipan terpotong


# --- algoritma traceroute (simulasi) ---------------------------------------------

JALUR = [
    HopSimulasi("192.168.1.1", 1.0),
    HopSimulasi("10.10.0.1", 5.0),
    HopSimulasi(None),                                    # router yang tidak menjawab
    HopSimulasi(["103.10.1.1", "103.10.1.5"], 12.0),      # ECMP
    HopSimulasi(TUJUAN, 20.0),
]


def test_traceroute_simulasi_lengkap(tr):
    sim = PenjejakSimulasi(JALUR, TUJUAN, seed=1)
    hop = tr.traceroute(sim, TUJUAN, maks_hop=30, timeout=1.0)
    assert len(hop) == 5
    assert [p.alamat for p in hop[0].probe] == ["192.168.1.1"] * 3
    assert hop[2].probe == [None, None, None]
    assert {p.alamat for p in hop[3].probe} <= {"103.10.1.1", "103.10.1.5"}
    assert all(p.tipe == 3 and p.kode == 3 and p.alamat == TUJUAN for p in hop[4].probe)
    assert 4.0 < hop[1].probe[0].rtt_ms < 6.0
    assert hop[4].sampai() and not hop[3].sampai()


def test_traceroute_berhenti_di_maks_hop_bila_tujuan_diam(tr):
    sim = PenjejakSimulasi(JALUR, TUJUAN, seed=1, tujuan_diam=True)
    hop = tr.traceroute(sim, TUJUAN, maks_hop=8, probe_per_hop=2, timeout=0.5)
    assert len(hop) == 8
    assert all(h.probe == [None, None] for h in hop[4:])


def test_traceroute_mengabaikan_icmp_tak_terkait(tr):
    sim = PenjejakSimulasi(JALUR, TUJUAN, seed=3, kebisingan=1.0)
    hop = tr.traceroute(sim, TUJUAN, timeout=1.0)
    assert len(hop) == 5
    assert all(p is None or p.alamat != "198.51.100.99" for h in hop for p in h.probe)


def test_balasan_terlambat_tidak_tertukar(tr):
    """Hop 2 menjawab dalam 1,5 detik, lebih lama dari timeout 1 detik. Balasannya tiba
    saat probe berikutnya sedang menunggu dan harus diabaikan (port tidak cocok)."""
    jalur = [HopSimulasi("10.0.0.1", 1.0), HopSimulasi("10.0.0.2", 1500.0), HopSimulasi(TUJUAN, 3.0)]
    hop = tr.traceroute(PenjejakSimulasi(jalur, TUJUAN, seed=2), TUJUAN, timeout=1.0)
    assert hop[1].probe == [None, None, None]
    assert all(p is not None and p.alamat == TUJUAN for p in hop[2].probe)


def test_unreachable_selain_port_juga_menghentikan(tr):
    sim = PenjejakSimulasi(JALUR, TUJUAN, seed=1, kode_tujuan=1)
    hop = tr.traceroute(sim, TUJUAN)
    assert len(hop) == 5 and hop[-1].probe[0].kode == 1
    assert "!H" in tr.format_hop(hop[-1])


def test_format_hop(tr):
    H, P = tr.Hop, tr.HasilProbe
    assert tr.format_hop(H(3, [P("10.0.0.1", 1.2345, 11, 0), P("10.0.0.1", 1.1, 11, 0), None])) == \
        " 3  10.0.0.1  1.234 ms  1.100 ms  *"
    assert tr.format_hop(H(4, [P("10.0.0.1", 2.0, 11, 0), P("10.0.0.9", 3.0, 11, 0), P("10.0.0.1", 4.0, 11, 0)])) == \
        " 4  10.0.0.1  2.000 ms  10.0.0.9  3.000 ms  10.0.0.1  4.000 ms"
    assert tr.format_hop(H(12, [None, None, None])) == "12  *  *  *"
    assert tr.format_hop(H(5, [P("192.0.2.1", 3.0, 3, 1)])) == " 5  192.0.2.1  3.000 ms !H"
    assert tr.format_hop(H(6, [P("192.0.2.1", 3.0, 3, 3)])) == " 6  192.0.2.1  3.000 ms"


# --- socket sungguhan ---------------------------------------------------------------

def _port_udp_bebas():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.mark.skipif(not sys.platform.startswith("linux"), reason="IP_RECVERR khusus Linux")
def test_recverr_ke_loopback_tanpa_root(tr):
    """Probe ke port UDP yang tertutup di 127.0.0.1: kernel membalas ICMP port
    unreachable yang kita baca dari antrean error socket, tanpa hak root."""
    p = PenjejakRecverr("127.0.0.1")
    try:
        port_awal = _port_udp_bebas() - 1
        hop = tr.traceroute(p, "127.0.0.1", maks_hop=5, probe_per_hop=2, timeout=1.0, port_awal=port_awal)
    finally:
        p.tutup()
    assert len(hop) == 1
    assert all(x is not None and x.alamat == "127.0.0.1" and (x.tipe, x.kode) == (3, 3) for x in hop[0].probe)


def test_raw_socket_bila_diizinkan(tr):
    try:
        p = PenjejakRaw("127.0.0.1")
    except PermissionError:
        pytest.skip("raw socket butuh root/CAP_NET_RAW; jalur tanpa root sudah diuji lewat IP_RECVERR")
    try:
        hop = tr.traceroute(p, "127.0.0.1", maks_hop=3, probe_per_hop=1, timeout=1.0,
                            port_awal=_port_udp_bebas() - 1)
    finally:
        p.tutup()
    assert hop[0].probe[0] is not None and hop[0].probe[0].tipe == 3

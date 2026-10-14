# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Uji Lab 7.4: router mini (LPM trie, ARP, TTL, ICMP) dengan paket sintetis.

Topologi:
                   eth0 10.0.0.1/24              eth1 172.16.0.1/30
    host H1 10.0.0.10 ----------- [ ROUTER ] ---------------- R2 172.16.0.2
                                      |  eth2 192.168.50.1/24
                                      +---- LAN 192.168.50.0/24
Rute statis: 0.0.0.0/0 via 172.16.0.2, 198.51.100.0/24 via 172.16.0.2,
             198.51.100.128/25 via 192.168.50.254
"""

import ipaddress
import random

import pytest

from umum.checksum import checksum_valid
from umum.paket import (
    ARP_REPLY, ARP_REQUEST, ETHERTYPE_ARP, ETHERTYPE_IPV4, MAC_BROADCAST, MAC_NOL, PROTO_ICMP, PROTO_UDP,
    FrameEthernet, PaketARP, PaketICMP, PaketIPv4, buat_icmp_echo, buat_udp, kutipan_icmp,
)

MAC_R = {"eth0": "02:00:00:00:00:01", "eth1": "02:00:00:00:00:02", "eth2": "02:00:00:00:00:03"}
MAC_H1 = "02:aa:00:00:00:10"
MAC_R2 = "02:bb:00:00:00:02"
MAC_LAN = "02:cc:00:00:00:fe"


@pytest.fixture
def r(router):
    A = router.Antarmuka
    rt = router.Router([
        A("eth0", MAC_R["eth0"], "10.0.0.1", 24),
        A("eth1", MAC_R["eth1"], "172.16.0.1", 30),
        A("eth2", MAC_R["eth2"], "192.168.50.1", 24),
    ])
    rt.tambah_rute("0.0.0.0/0", "172.16.0.2", "eth1")
    rt.tambah_rute("198.51.100.0/24", "172.16.0.2", "eth1")
    rt.tambah_rute("198.51.100.128/25", "192.168.50.254", "eth2")
    rt.arp.simpan("10.0.0.10", MAC_H1, 0.0)
    rt.arp.simpan("172.16.0.2", MAC_R2, 0.0)
    return rt


def _frame_ip(ip: PaketIPv4, ke=MAC_R["eth0"], dari=MAC_H1) -> bytes:
    return FrameEthernet(ke, dari, ETHERTYPE_IPV4, ip.ke_bytes()).ke_bytes()


def _udp(tujuan, ttl=64, sumber="10.0.0.10"):
    return PaketIPv4(sumber, tujuan, PROTO_UDP, buat_udp(5000, 53, b"tanya"), ttl=ttl, identifikasi=77)


def _satu(keluar):
    assert len(keluar) == 1, keluar
    nama, frame = keluar[0]
    return nama, FrameEthernet.dari_bytes(frame)


def _icmp_dari(eth):
    assert eth.tipe == ETHERTYPE_IPV4
    ip = PaketIPv4.dari_bytes(eth.muatan)
    assert ip.checksum_ok and ip.protokol == PROTO_ICMP
    icmp = PaketICMP.dari_bytes(ip.muatan)
    assert icmp.checksum_ok
    return ip, icmp


# --- trie -----------------------------------------------------------------------

def test_trie_dasar(router):
    t = router.TrieBiner()
    assert t.cari("1.2.3.4") is None
    t.sisip("10.0.0.0/8", "A")
    t.sisip("10.1.0.0/16", "B")
    t.sisip("10.1.2.3/32", "C")
    assert t.cari("10.9.9.9") == ("10.0.0.0/8", "A")
    assert t.cari("10.1.200.1") == ("10.1.0.0/16", "B")
    assert t.cari("10.1.2.3") == ("10.1.2.3/32", "C")
    assert t.cari("11.0.0.1") is None
    t.sisip("0.0.0.0/0", "default")
    assert t.cari("11.0.0.1") == ("0.0.0.0/0", "default")
    assert len(t) == 4
    t.sisip("10.1.0.0/16", "B2")                         # timpa, bukan tambah
    assert len(t) == 4 and t.cari("10.1.5.5")[1] == "B2"
    assert t.hapus("10.1.0.0/16") and not t.hapus("10.1.0.0/16")
    assert t.cari("10.1.5.5") == ("10.0.0.0/8", "A")
    assert not t.hapus("172.16.0.0/12")


def test_trie_menolak_prefix_dengan_bit_host(router):
    with pytest.raises(ValueError):
        router.TrieBiner().sisip("10.0.0.1/8", "x")


def test_trie_sama_dengan_pencarian_linear(router):
    rng = random.Random(144)
    t = router.TrieBiner()
    tabel = {}
    for _ in range(600):
        panjang = rng.choice([0, 8, 12, 16, 20, 22, 24, 25, 28, 30, 32])
        net = ipaddress.IPv4Network((rng.getrandbits(32), panjang), strict=False)
        if rng.random() < 0.5:    # buat prefix bersarang di dekat 10.0.0.0/8 agar banyak tumpang tindih
            net = ipaddress.IPv4Network(((10 << 24) | rng.getrandbits(24), max(panjang, 8)), strict=False)
        tabel[net] = str(net)
        t.sisip(str(net), str(net))
    for _ in range(3000):
        ip = ipaddress.IPv4Address(rng.choice([rng.getrandbits(32), (10 << 24) | rng.getrandbits(24)]))
        cocok = [n for n in tabel if ip in n]
        harap = max(cocok, key=lambda n: n.prefixlen) if cocok else None
        hasil = t.cari(str(ip))
        if harap is None:
            assert hasil is None
        else:
            assert hasil == (str(harap), str(harap))


# --- ARP ------------------------------------------------------------------------

def test_cache_arp_kedaluwarsa(router):
    c = router.CacheARP(umur=10.0)
    c.simpan("10.0.0.9", "02:00:00:00:00:09", 100.0)
    assert c.cari("10.0.0.9", 109.9) == "02:00:00:00:00:09"
    assert c.cari("10.0.0.9", 110.0) is None
    assert c.cari("10.0.0.8", 0.0) is None


def test_arp_request_untuk_router_dijawab(r):
    minta = PaketARP(ARP_REQUEST, "02:aa:00:00:00:99", "10.0.0.99", MAC_NOL, "10.0.0.1")
    nama, eth = _satu(r.terima_frame("eth0", FrameEthernet(MAC_BROADCAST, "02:aa:00:00:00:99", ETHERTYPE_ARP,
                                                              minta.ke_bytes()).ke_bytes(), 1.0))
    assert nama == "eth0" and eth.tujuan == "02:aa:00:00:00:99" and eth.sumber == MAC_R["eth0"]
    balas = PaketARP.dari_bytes(eth.muatan)
    assert balas == PaketARP(ARP_REPLY, MAC_R["eth0"], "10.0.0.1", "02:aa:00:00:00:99", "10.0.0.99")
    assert r.arp.cari("10.0.0.99", 1.0) == "02:aa:00:00:00:99"     # pengirim ikut dipelajari


def test_arp_request_untuk_ip_lain_diabaikan(r):
    minta = PaketARP(ARP_REQUEST, MAC_H1, "10.0.0.10", MAC_NOL, "10.0.0.77")
    assert r.terima_frame("eth0", FrameEthernet(MAC_BROADCAST, MAC_H1, ETHERTYPE_ARP, minta.ke_bytes()).ke_bytes(), 1.0) == []


def test_frame_untuk_mac_lain_dibuang(r):
    assert r.terima_frame("eth0", _frame_ip(_udp("172.16.0.2"), ke="02:00:00:00:99:99"), 1.0) == []


# --- penerusan ------------------------------------------------------------------

def test_meneruskan_dengan_ttl_turun_dan_checksum_baru(r):
    asli = _udp("8.8.8.8", ttl=64)
    nama, eth = _satu(r.terima_frame("eth0", _frame_ip(asli), 1.0))
    assert nama == "eth1"
    assert (eth.tujuan, eth.sumber) == (MAC_R2, MAC_R["eth1"])
    ip = PaketIPv4.dari_bytes(eth.muatan)
    assert ip.ttl == 63 and ip.checksum_ok
    assert (ip.sumber, ip.tujuan, ip.identifikasi, ip.muatan) == ("10.0.0.10", "8.8.8.8", 77, asli.muatan)


def test_longest_prefix_match_memilih_rute_paling_spesifik(r):
    r.arp.simpan("192.168.50.254", MAC_LAN, 0.0)
    nama, eth = _satu(r.terima_frame("eth0", _frame_ip(_udp("198.51.100.200")), 1.0))
    assert nama == "eth2" and eth.tujuan == MAC_LAN                  # /25 menang atas /24 dan /0
    nama, _ = _satu(r.terima_frame("eth0", _frame_ip(_udp("198.51.100.5")), 1.0))
    assert nama == "eth1"                                             # hanya /24 yang cocok


def test_checksum_ip_salah_dibuang(r):
    b = bytearray(_udp("8.8.8.8").ke_bytes())
    b[10] ^= 0x01
    frame = FrameEthernet(MAC_R["eth0"], MAC_H1, ETHERTYPE_IPV4, bytes(b)).ke_bytes()
    assert r.terima_frame("eth0", frame, 1.0) == []


def test_ttl_habis_menghasilkan_time_exceeded(r):
    asli = _udp("8.8.8.8", ttl=1)
    nama, eth = _satu(r.terima_frame("eth0", _frame_ip(asli), 1.0))
    assert nama == "eth0" and eth.tujuan == MAC_H1
    ip, icmp = _icmp_dari(eth)
    assert (ip.sumber, ip.tujuan) == ("10.0.0.1", "10.0.0.10")
    assert (icmp.tipe, icmp.kode) == (11, 0)
    assert icmp.isi == kutipan_icmp(asli.ke_bytes())                  # header asli + 8 byte


def test_tanpa_rute_menghasilkan_net_unreachable(router):
    rt = router.Router([router.Antarmuka("eth0", MAC_R["eth0"], "10.0.0.1", 24)])
    rt.arp.simpan("10.0.0.10", MAC_H1, 0.0)
    _, eth = _satu(rt.terima_frame("eth0", _frame_ip(_udp("8.8.8.8")), 1.0))
    _, icmp = _icmp_dari(eth)
    assert (icmp.tipe, icmp.kode) == (3, 0)


def test_tidak_membalas_icmp_error_dengan_icmp_error(r):
    error = PaketICMP(11, 0, isi=kutipan_icmp(_udp("1.1.1.1").ke_bytes())).ke_bytes()
    paket = PaketIPv4("10.0.0.10", "8.8.8.8", PROTO_ICMP, error, ttl=1)
    assert r.terima_frame("eth0", _frame_ip(paket), 1.0) == []


# --- paket untuk router sendiri ---------------------------------------------------

def test_ping_ke_router_dijawab(r):
    ping = PaketIPv4("10.0.0.10", "172.16.0.1", PROTO_ICMP, buat_icmp_echo(0x1234, 7, b"abcdefgh"))
    nama, eth = _satu(r.terima_frame("eth0", _frame_ip(ping), 1.0))
    assert nama == "eth0"
    ip, icmp = _icmp_dari(eth)
    assert (ip.sumber, ip.tujuan) == ("172.16.0.1", "10.0.0.10")
    assert (icmp.tipe, icmp.kode, icmp.sisa_header, icmp.isi) == (0, 0, b"\x12\x34\x00\x07", b"abcdefgh")


def test_udp_ke_router_port_unreachable(r):
    _, eth = _satu(r.terima_frame("eth0", _frame_ip(_udp("10.0.0.1")), 1.0))
    _, icmp = _icmp_dari(eth)
    assert (icmp.tipe, icmp.kode) == (3, 3)


# --- ARP miss: antre, minta, teruskan / menyerah ---------------------------------

def _arp_req_ke(eth):
    assert eth.tipe == ETHERTYPE_ARP and eth.tujuan == MAC_BROADCAST
    return PaketARP.dari_bytes(eth.muatan)


def test_arp_miss_antre_lalu_teruskan(r):
    nama, eth = _satu(r.terima_frame("eth0", _frame_ip(_udp("192.168.50.20")), 1.0))
    req = _arp_req_ke(eth)
    assert nama == "eth2" and req.operasi == ARP_REQUEST and req.ip_target == "192.168.50.20"
    assert (req.ip_pengirim, req.mac_pengirim) == ("192.168.50.1", MAC_R["eth2"])
    # Paket kedua ke tujuan yang sama tidak memicu ARP request baru.
    assert r.terima_frame("eth0", _frame_ip(_udp("192.168.50.20")), 1.2) == []
    balas = PaketARP(ARP_REPLY, "02:dd:00:00:00:20", "192.168.50.20", MAC_R["eth2"], "192.168.50.1")
    keluar = r.terima_frame("eth2", FrameEthernet(MAC_R["eth2"], "02:dd:00:00:00:20", ETHERTYPE_ARP,
                                                  balas.ke_bytes()).ke_bytes(), 1.5)
    assert len(keluar) == 2
    for nama, frame in keluar:
        eth = FrameEthernet.dari_bytes(frame)
        assert nama == "eth2" and eth.tujuan == "02:dd:00:00:00:20"
        assert PaketIPv4.dari_bytes(eth.muatan).ttl == 63
    assert r.tick(10.0) == []


def test_arp_tanpa_jawaban_menghasilkan_host_unreachable(r):
    asli = _udp("192.168.50.30")
    _satu(r.terima_frame("eth0", _frame_ip(asli), 0.0))               # ARP request ke-1
    assert r.tick(0.5) == []                                          # belum waktunya mengulang
    _, eth = _satu(r.tick(1.0))
    assert _arp_req_ke(eth).ip_target == "192.168.50.30"              # ke-2
    _, eth = _satu(r.tick(2.0))
    assert _arp_req_ke(eth).ip_target == "192.168.50.30"              # ke-3
    nama, eth = _satu(r.tick(3.0))                                    # menyerah
    assert nama == "eth0"
    ip, icmp = _icmp_dari(eth)
    assert ip.tujuan == "10.0.0.10" and (icmp.tipe, icmp.kode) == (3, 1)
    assert icmp.isi == kutipan_icmp(asli.ke_bytes())
    assert r.tick(10.0) == []


def test_semua_checksum_keluaran_valid(r):
    for paket in (_udp("8.8.8.8"), _udp("8.8.8.8", ttl=1), _udp("10.0.0.1")):
        for _, frame in r.terima_frame("eth0", _frame_ip(paket), 1.0):
            eth = FrameEthernet.dari_bytes(frame)
            ip = PaketIPv4.dari_bytes(eth.muatan)
            assert checksum_valid(eth.muatan[:20])
            if ip.protokol == PROTO_ICMP:
                assert checksum_valid(ip.muatan)

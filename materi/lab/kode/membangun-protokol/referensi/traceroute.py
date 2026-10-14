# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Lab 7.3 (REFERENSI): traceroute buatan sendiri (probe UDP + TTL + ICMP)."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from umum.paket import (
    ICMP_DEST_UNREACH, ICMP_TIME_EXCEEDED, PROTO_ICMP, PROTO_UDP, PaketICMP, PaketIPv4, urai_udp,
)
from umum.penjejak import InfoICMP

# Anotasi ala traceroute klasik untuk ICMP Destination Unreachable (tipe 3).
ANOTASI_UNREACH = {0: "!N", 1: "!H", 2: "!P", 3: "", 4: "!F", 9: "!X", 10: "!X", 13: "!X"}


@dataclass
class HasilProbe:
    alamat: str
    rtt_ms: float
    tipe: int
    kode: int


@dataclass
class Hop:
    ttl: int
    probe: list[Optional[HasilProbe]] = field(default_factory=list)  # None = tidak ada balasan (*)

    def sampai(self) -> bool:
        """Hop ini mengakhiri penjejakan bila ada balasan Destination Unreachable."""
        return any(p is not None and p.tipe == ICMP_DEST_UNREACH for p in self.probe)


def urai_balasan_icmp(paket: bytes) -> Optional[InfoICMP]:
    """Urai paket IPv4 mentah berisi ICMP error yang mengutip probe UDP kita.

    Kembalikan None untuk apa pun yang bukan balasan probe: bukan ICMP, checksum ICMP
    salah, tipe selain 3/11 (misalnya echo reply), kutipan bukan UDP, atau paket rusak.
    """
    try:
        luar = PaketIPv4.dari_bytes(paket)
        if luar.protokol != PROTO_ICMP:
            return None
        icmp = PaketICMP.dari_bytes(luar.muatan)
        if not icmp.checksum_ok or icmp.tipe not in (ICMP_TIME_EXCEEDED, ICMP_DEST_UNREACH):
            return None
        dalam = PaketIPv4.dari_bytes(icmp.isi)
        if dalam.protokol != PROTO_UDP:
            return None
        _, port_tujuan, _ = urai_udp(dalam.muatan)
    except ValueError:
        return None
    return InfoICMP(luar.sumber, icmp.tipe, icmp.kode, dalam.tujuan, port_tujuan)


def traceroute(penjejak, tujuan: str, maks_hop: int = 30, probe_per_hop: int = 3,
               timeout: float = 1.0, port_awal: int = 33434) -> list[Hop]:
    """Jalankan traceroute dengan `penjejak` (lihat umum/penjejak.py).

    Setiap probe memakai port tujuan unik, sehingga balasan bisa dicocokkan dengan
    probe-nya. Balasan yang tidak cocok (milik probe lama yang terlambat, milik proses
    lain, atau sampah) diabaikan sambil terus menunggu sampai batas waktu probe ini.
    """
    hasil: list[Hop] = []
    port = port_awal
    for ttl in range(1, maks_hop + 1):
        hop = Hop(ttl)
        for _ in range(probe_per_hop):
            port += 1
            t_kirim = penjejak.kirim_probe(ttl, port)
            batas = t_kirim + timeout
            jawaban: Optional[HasilProbe] = None
            while True:
                r = penjejak.terima(batas)
                if r is None:
                    break
                isi, t_terima = r
                info = isi if isinstance(isi, InfoICMP) else urai_balasan_icmp(isi)
                if info is None or info.port_tujuan_asli != port or info.tujuan_asli != tujuan:
                    continue
                jawaban = HasilProbe(info.alamat_pemberi, (t_terima - t_kirim) * 1000, info.tipe, info.kode)
                break
            hop.probe.append(jawaban)
        hasil.append(hop)
        if hop.sampai():
            break
    return hasil


def format_hop(hop: Hop) -> str:
    """Format satu baris seperti traceroute Linux, contoh:
    ' 3  10.0.0.1  1.234 ms  1.100 ms *' atau ' 5  192.0.2.1  3.000 ms !H'."""
    bagian = [f"{hop.ttl:2d}"]
    alamat_terakhir = None
    for p in hop.probe:
        if p is None:
            bagian.append("*")
            continue
        teks = f"{p.rtt_ms:.3f} ms"
        if p.alamat != alamat_terakhir:
            teks = f"{p.alamat}  {teks}"
            alamat_terakhir = p.alamat
        if p.tipe == ICMP_DEST_UNREACH:
            anotasi = ANOTASI_UNREACH.get(p.kode, f"!<{p.kode}>")
            if anotasi:
                teks += f" {anotasi}"
        bagian.append(teks)
    return "  ".join(bagian)

# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Lab 7.3 (STARTER): traceroute buatan sendiri (probe UDP + TTL + ICMP).

Penjejak (backend) sudah tersedia di umum/penjejak.py: simulasi, IP_RECVERR (Linux tanpa
root), dan raw socket (root). Anda menulis pengurai ICMP dan algoritmanya.
Uji: pytest --impl=starter tests/test_73_traceroute.py
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from umum.paket import (  # noqa: F401  (dipakai saat Anda mengisi TODO)
    ICMP_DEST_UNREACH, ICMP_TIME_EXCEEDED, PROTO_ICMP, PROTO_UDP, PaketICMP, PaketIPv4, urai_udp,
)
from umum.penjejak import InfoICMP

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
    """TODO 7.3a: urai paket IPv4 mentah yang membawa ICMP error.

    Langkah: PaketIPv4.dari_bytes (luar) -> protokol harus ICMP -> PaketICMP.dari_bytes
    -> checksum_ok dan tipe 11 atau 3 -> isi ICMP adalah KUTIPAN paket probe: urai lagi
    dengan PaketIPv4.dari_bytes -> protokol harus UDP -> urai_udp untuk port tujuan.
    Kembalikan InfoICMP(alamat_pemberi, tipe, kode, tujuan_asli, port_tujuan_asli).
    Apa pun yang gagal (termasuk ValueError dari pengurai) -> None.
    """
    raise NotImplementedError("TODO 7.3a: urai_balasan_icmp")


def traceroute(penjejak, tujuan: str, maks_hop: int = 30, probe_per_hop: int = 3,
               timeout: float = 1.0, port_awal: int = 33434) -> list[Hop]:
    """TODO 7.3b: untuk ttl = 1..maks_hop, kirim probe_per_hop probe.

      - setiap probe memakai port unik: port_awal + 1, + 2, ... (naik terus)
      - t_kirim = penjejak.kirim_probe(ttl, port); batas = t_kirim + timeout
      - ulangi penjejak.terima(batas) sampai None (catat None = '*') atau ketemu balasan
        yang COCOK: isi bisa bytes (urai dengan urai_balasan_icmp) atau sudah InfoICMP;
        cocok berarti port_tujuan_asli == port DAN tujuan_asli == tujuan
      - rtt_ms = (t_terima - t_kirim) * 1000
      - berhenti setelah hop yang hop.sampai() bernilai True
    """
    raise NotImplementedError("TODO 7.3b: traceroute")


def format_hop(hop: Hop) -> str:
    """TODO 7.3c: format seperti traceroute Linux. Contoh:
        ' 3  10.0.0.1  1.234 ms  1.100 ms  *'
        ' 4  10.0.0.1  2.000 ms  10.0.0.9  3.000 ms  10.0.0.1  4.000 ms'
        ' 5  192.0.2.1  3.000 ms !H'
    Nomor TTL lebar 2, bagian dipisah dua spasi, alamat ditulis bila berbeda dari
    alamat terakhir yang ditulis, anotasi dari ANOTASI_UNREACH untuk tipe 3."""
    raise NotImplementedError("TODO 7.3c: format_hop")

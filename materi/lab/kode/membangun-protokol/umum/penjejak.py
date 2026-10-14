# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Tiga "penjejak" (backend) untuk traceroute Lab 7.3.

Semua penjejak punya antarmuka yang sama:

    kirim_probe(ttl, port) -> float
        Kirim satu probe UDP ke (tujuan, port) dengan TTL tertentu. Kembalikan waktu kirim.
    terima(batas) -> tuple[bytes | InfoICMP, float] | None
        Tunggu balasan ICMP sampai waktu `batas`. Kembalikan (isi, waktu_terima), atau
        None bila batas waktu lewat. `isi` berupa paket IPv4 mentah (mode raw dan
        simulasi; Anda yang mengurainya) atau InfoICMP yang sudah diurai kernel (mode
        IP_RECVERR). Balasan yang datang BUKAN untuk probe terakhir mungkin muncul;
        kode traceroute Anda wajib mencocokkan port.

Mode:
  PenjejakRaw       socket raw ICMP; butuh root atau CAP_NET_RAW.
  PenjejakRecverr   tanpa root, khusus Linux: socket UDP biasa + IP_RECVERR, ICMP dibaca
                    dari antrean error socket (MSG_ERRQUEUE).
  PenjejakSimulasi  jaringan tiruan berwaktu virtual; deterministik, untuk uji otomatis.
"""

from __future__ import annotations

import heapq
import random
import select
import socket
import struct
import sys
import time
from dataclasses import dataclass, field
from typing import Optional, Sequence, Union

from umum.paket import (
    ICMP_DEST_UNREACH, ICMP_TIME_EXCEEDED, KODE_PORT_UNREACH, PROTO_ICMP, PROTO_UDP,
    PaketICMP, PaketIPv4, buat_udp, kutipan_icmp,
)

MUATAN_PROBE = b"lab07-traceroute"


@dataclass(frozen=True)
class InfoICMP:
    """Hasil penguraian balasan ICMP terhadap probe UDP."""
    alamat_pemberi: str        # siapa yang mengirim ICMP (router atau tujuan)
    tipe: int                  # 11 = time exceeded, 3 = destination unreachable
    kode: int
    tujuan_asli: str           # alamat tujuan probe asli (dari kutipan)
    port_tujuan_asli: int      # port tujuan UDP probe asli (dari kutipan)


Isi = Union[bytes, InfoICMP]


# --- Simulasi -------------------------------------------------------------------

@dataclass
class HopSimulasi:
    """Satu router di jalur. alamat=None berarti router diam (tidak pernah mengirim ICMP).
    alamat berupa list berarti ECMP: tiap probe bisa dijawab alamat yang berbeda."""
    alamat: Union[str, Sequence[str], None]
    rtt_ms: float = 1.0
    hilang: float = 0.0


@dataclass
class PenjejakSimulasi:
    jalur: list[HopSimulasi]           # hop terakhir = tujuan itu sendiri
    tujuan: str
    sumber: str = "192.0.2.10"
    seed: int = 0
    tujuan_diam: bool = False          # tujuan di balik firewall yang membuang probe
    kebisingan: float = 0.0            # peluang ICMP tak terkait ikut datang lebih dulu
    kode_tujuan: int = KODE_PORT_UNREACH
    _rng: random.Random = field(init=False, repr=False)
    _jam: float = field(default=0.0, init=False)
    _antrean: list = field(default_factory=list, init=False, repr=False)
    _n: int = field(default=0, init=False)

    def __post_init__(self):
        self._rng = random.Random(self.seed)

    def _kutipan(self, ttl: int, port: int) -> bytes:
        probe = PaketIPv4(self.sumber, self.tujuan, PROTO_UDP,
                          buat_udp(40000, port, MUATAN_PROBE), ttl=ttl).ke_bytes()
        return kutipan_icmp(probe)

    def _jadwalkan(self, saat: float, paket: bytes) -> None:
        self._n += 1
        heapq.heappush(self._antrean, (saat, self._n, paket))

    def kirim_probe(self, ttl: int, port: int) -> float:
        t = self._jam
        if self._rng.random() < self.kebisingan:
            # ICMP untuk probe orang lain (port berbeda) yang kebetulan datang duluan.
            icmp = PaketICMP(ICMP_TIME_EXCEEDED, 0, isi=self._kutipan(1, port + 5000)).ke_bytes()
            self._jadwalkan(t + 0.0001, PaketIPv4("198.51.100.99", self.sumber, PROTO_ICMP, icmp).ke_bytes())
        i = min(ttl, len(self.jalur)) - 1
        hop = self.jalur[i]
        sampai_tujuan = ttl >= len(self.jalur)
        if hop.alamat is None or self._rng.random() < hop.hilang or (sampai_tujuan and self.tujuan_diam):
            return t
        alamat = hop.alamat if isinstance(hop.alamat, str) else self._rng.choice(list(hop.alamat))
        if sampai_tujuan:
            icmp = PaketICMP(ICMP_DEST_UNREACH, self.kode_tujuan, isi=self._kutipan(1, port))
        else:
            icmp = PaketICMP(ICMP_TIME_EXCEEDED, 0, isi=self._kutipan(1, port))
        paket = PaketIPv4(alamat, self.sumber, PROTO_ICMP, icmp.ke_bytes(), ttl=64 - ttl).ke_bytes()
        rtt = hop.rtt_ms / 1000 * self._rng.uniform(0.9, 1.1)
        self._jadwalkan(t + rtt, paket)
        return t

    def terima(self, batas: float) -> Optional[tuple[Isi, float]]:
        if self._antrean and self._antrean[0][0] <= batas:
            saat, _, paket = heapq.heappop(self._antrean)
            self._jam = max(self._jam, saat)
            return paket, saat
        self._jam = max(self._jam, batas)
        return None

    def tutup(self) -> None:
        pass


# --- Linux tanpa root: IP_RECVERR -----------------------------------------------

IP_RECVERR = getattr(socket, "IP_RECVERR", 11)
MSG_ERRQUEUE = getattr(socket, "MSG_ERRQUEUE", 0x2000)
SO_EE_ORIGIN_ICMP = 2
# struct sock_extended_err { u32 ee_errno; u8 ee_origin, ee_type, ee_code, ee_pad;
#                            u32 ee_info; u32 ee_data; }  lalu sockaddr_in pengirim ICMP.
_EE = struct.Struct("=IBBBBII")


class PenjejakRecverr:
    """Traceroute tanpa hak root di Linux. Kernel menerima ICMP time exceeded/port
    unreachable untuk probe kita dan menaruhnya di antrean error socket."""

    def __init__(self, tujuan: str):
        if not sys.platform.startswith("linux"):
            raise OSError("IP_RECVERR hanya tersedia di Linux")
        self.tujuan = tujuan
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.setsockopt(socket.SOL_IP, IP_RECVERR, 1)

    def kirim_probe(self, ttl: int, port: int) -> float:
        self.sock.setsockopt(socket.SOL_IP, socket.IP_TTL, ttl)
        t = time.monotonic()
        self.sock.sendto(MUATAN_PROBE, (self.tujuan, port))
        return t

    def terima(self, batas: float) -> Optional[tuple[Isi, float]]:
        while True:
            sisa = batas - time.monotonic()
            if sisa <= 0:
                return None
            siap, _, _ = select.select([self.sock], [], [], sisa)
            if not siap:
                return None
            t = time.monotonic()
            try:
                _, anc, _, alamat = self.sock.recvmsg(512, 512, MSG_ERRQUEUE)
            except BlockingIOError:
                self.sock.recv(65535)  # data biasa (tujuan menjawab UDP); abaikan
                continue
            for level, tipe_cmsg, data in anc:
                if level != socket.SOL_IP or tipe_cmsg != IP_RECVERR or len(data) < _EE.size + 8:
                    continue
                _errno, asal, tipe, kode, _pad, _info, _data = _EE.unpack_from(data)
                if asal != SO_EE_ORIGIN_ICMP:
                    continue  # error lokal (misalnya EMSGSIZE), bukan dari jaringan
                ip_pemberi = socket.inet_ntoa(data[_EE.size + 4:_EE.size + 8])
                return InfoICMP(ip_pemberi, tipe, kode, alamat[0], alamat[1]), t

    def tutup(self) -> None:
        self.sock.close()


# --- Raw socket (root / CAP_NET_RAW) --------------------------------------------

class PenjejakRaw:
    """Probe dikirim lewat socket UDP biasa; balasan ICMP dibaca mentah lewat socket raw.
    Paket yang diterima memuat header IPv4 lengkap, jadi Anda yang mengurainya."""

    def __init__(self, tujuan: str):
        self.tujuan = tujuan
        self.sock_icmp = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_ICMP)
        self.sock_udp = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    def kirim_probe(self, ttl: int, port: int) -> float:
        self.sock_udp.setsockopt(socket.SOL_IP, socket.IP_TTL, ttl)
        t = time.monotonic()
        self.sock_udp.sendto(MUATAN_PROBE, (self.tujuan, port))
        return t

    def terima(self, batas: float) -> Optional[tuple[Isi, float]]:
        sisa = batas - time.monotonic()
        if sisa <= 0:
            return None
        siap, _, _ = select.select([self.sock_icmp], [], [], sisa)
        if not siap:
            return None
        paket, _ = self.sock_icmp.recvfrom(65535)
        return paket, time.monotonic()

    def tutup(self) -> None:
        self.sock_icmp.close()
        self.sock_udp.close()

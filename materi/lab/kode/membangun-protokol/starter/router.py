# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Lab 7.4 (STARTER): router mini IPv4 (LPM trie + ARP + TTL + ICMP).

Pembuat/pengurai format paket ada di umum/paket.py; Anda menulis logikanya.
Uji: pytest --impl=starter tests/test_74_router.py
"""

from __future__ import annotations

import ipaddress
from dataclasses import dataclass, field
from typing import Any, Optional

from umum.paket import (  # noqa: F401  (dipakai saat Anda mengisi TODO)
    ARP_REPLY, ARP_REQUEST, ETHERTYPE_ARP, ETHERTYPE_IPV4, ICMP_DEST_UNREACH, ICMP_ECHO_REPLY,
    ICMP_ECHO_REQUEST, ICMP_TIME_EXCEEDED, KODE_HOST_UNREACH, KODE_NET_UNREACH,
    KODE_PORT_UNREACH, KODE_PROTO_UNREACH, MAC_BROADCAST, MAC_NOL, PROTO_ICMP, PROTO_TCP,
    PROTO_UDP, FrameEthernet, PaketARP, PaketICMP, PaketIPv4, ip_ke_int, kutipan_icmp,
)

# Tipe ICMP yang termasuk pesan ERROR: jangan pernah membalas error dengan error (RFC 1122 3.2.2).
TIPE_ICMP_ERROR = {3, 4, 5, 11, 12}


# --- Longest prefix match -------------------------------------------------------

class _Simpul:
    __slots__ = ("anak", "ada", "nilai")

    def __init__(self):
        self.anak: list[Optional[_Simpul]] = [None, None]
        self.ada = False
        self.nilai: Any = None


def _urai_prefix(prefix: str) -> tuple[int, int]:
    """'10.1.0.0/16' -> (alamat 32 bit, 16). Bit host yang menyala -> ValueError."""
    jaringan = ipaddress.IPv4Network(prefix, strict=True)
    return int(jaringan.network_address), jaringan.prefixlen


class TrieBiner:
    """Trie biner: level ke-i memutuskan bit ke-i (dari kiri, bit = (alamat >> (31-i)) & 1).
    Prefix /n disimpan pada simpul di kedalaman n."""

    def __init__(self):
        self._akar = _Simpul()
        self._jumlah = 0

    def __len__(self) -> int:
        return self._jumlah

    def sisip(self, prefix: str, nilai: Any) -> None:
        """TODO 7.4a: telusuri/buat simpul sebanyak panjang prefix, tandai ada=True.
        Menimpa prefix yang sama tidak menambah jumlah."""
        raise NotImplementedError("TODO 7.4a: TrieBiner.sisip")

    def hapus(self, prefix: str) -> bool:
        """TODO 7.4a: hapus tanda pada simpul prefix. True bila ada yang dihapus."""
        raise NotImplementedError("TODO 7.4a: TrieBiner.hapus")

    def cari(self, ip: str) -> Optional[tuple[str, Any]]:
        """TODO 7.4b: telusuri bit-bit alamat dari akar, ingat simpul TERDALAM yang ada=True
        (termasuk akar untuk 0.0.0.0/0). Kembalikan (prefix sebagai string, nilai) atau None.
        Petunjuk: str(ipaddress.IPv4Network((alamat_int, panjang), strict=False))."""
        raise NotImplementedError("TODO 7.4b: TrieBiner.cari")


# --- ARP ------------------------------------------------------------------------

class CacheARP:
    def __init__(self, umur: float = 30.0):
        self.umur = umur
        self._isi: dict[str, tuple[str, float]] = {}

    def simpan(self, ip: str, mac: str, sekarang: float) -> None:
        """TODO 7.4c: simpan mac dengan waktu kedaluwarsa sekarang + umur."""
        raise NotImplementedError("TODO 7.4c: CacheARP.simpan")

    def cari(self, ip: str, sekarang: float) -> Optional[str]:
        """TODO 7.4c: kembalikan mac, atau None bila tidak ada / sudah kedaluwarsa
        (sekarang >= waktu kedaluwarsa; hapus entrinya)."""
        raise NotImplementedError("TODO 7.4c: CacheARP.cari")


# --- Router ---------------------------------------------------------------------

@dataclass
class Antarmuka:
    nama: str
    mac: str
    ip: str
    panjang_prefix: int

    @property
    def jaringan(self) -> str:
        return str(ipaddress.IPv4Network(f"{self.ip}/{self.panjang_prefix}", strict=False))


@dataclass
class Rute:
    prefix: str
    next_hop: Optional[str]   # None = jaringan terhubung langsung (connected)
    antarmuka: str


@dataclass
class _Menunggu:
    antarmuka: str
    paket: list[tuple[bytes, bytes, str]] = field(default_factory=list)  # (diteruskan, asli, masuk)
    terakhir_minta: float = 0.0
    jumlah_minta: int = 0


Keluaran = list[tuple[str, bytes]]   # (nama antarmuka keluar, frame Ethernet)


class Router:
    def __init__(self, antarmuka: list[Antarmuka], umur_arp: float = 30.0,
                 jeda_ulang_arp: float = 1.0, maks_permintaan_arp: int = 3):
        self.antarmuka = {a.nama: a for a in antarmuka}
        self.tabel = TrieBiner()
        self.arp = CacheARP(umur_arp)
        self.jeda_ulang_arp = jeda_ulang_arp
        self.maks_permintaan_arp = maks_permintaan_arp
        self._menunggu: dict[str, _Menunggu] = {}   # IP next hop -> paket yang menunggu ARP
        for a in antarmuka:
            self.tabel.sisip(a.jaringan, Rute(a.jaringan, None, a.nama))

    def tambah_rute(self, prefix: str, next_hop: Optional[str], antarmuka: str) -> None:
        self.tabel.sisip(prefix, Rute(prefix, next_hop, antarmuka))

    def _milik_saya(self, ip: str) -> bool:
        return any(a.ip == ip for a in self.antarmuka.values())

    def terima_frame(self, nama_antarmuka: str, frame: bytes, sekarang: float) -> Keluaran:
        """Sudah jadi: urai Ethernet, buang frame untuk MAC lain, lalu bagi ke ARP/IPv4."""
        masuk = self.antarmuka[nama_antarmuka]
        try:
            eth = FrameEthernet.dari_bytes(frame)
        except ValueError:
            return []
        if eth.tujuan not in (masuk.mac, MAC_BROADCAST):
            return []
        try:
            if eth.tipe == ETHERTYPE_ARP:
                return self._tangani_arp(masuk, PaketARP.dari_bytes(eth.muatan), sekarang)
            if eth.tipe == ETHERTYPE_IPV4:
                return self._tangani_ipv4(masuk, eth.muatan, sekarang)
        except ValueError:
            return []
        return []

    def _tangani_arp(self, masuk: Antarmuka, arp: PaketARP, sekarang: float) -> Keluaran:
        """TODO 7.4d: abaikan bila ip_target bukan IP antarmuka ini. Pelajari pengirim ke
        cache. Request -> balas ARP reply unicast. Lalu, bila ada paket yang menunggu
        IP pengirim ini (self._menunggu), kirim semuanya sekarang dan hapus antreannya."""
        raise NotImplementedError("TODO 7.4d: _tangani_arp")

    def _tangani_ipv4(self, masuk: Antarmuka, data: bytes, sekarang: float) -> Keluaran:
        """TODO 7.4e: urutan keputusan:
          1. checksum salah atau paket terpotong -> buang diam-diam
          2. tujuan = IP router -> self._untuk_saya
          3. TTL <= 1 -> ICMP time exceeded (11/0)
          4. tidak ada rute (LPM) -> ICMP destination unreachable net (3/0)
          5. TTL dikurangi 1, ke_bytes() menghitung ulang checksum, lalu _kirim_lewat
        Simpan `data` asli: kutipan ICMP harus memakai paket SEBELUM TTL diubah."""
        raise NotImplementedError("TODO 7.4e: _tangani_ipv4")

    def _untuk_saya(self, masuk: Antarmuka, ip: PaketIPv4, asli: bytes, sekarang: float) -> Keluaran:
        """TODO 7.4f: echo request -> echo reply (id, seq, data sama; sumber = IP yang
        di-ping); UDP/TCP -> port unreachable (3/3); protokol lain -> protocol unreachable (3/2)."""
        raise NotImplementedError("TODO 7.4f: _untuk_saya")

    def _kirim_lewat(self, rute: Rute, tujuan: str, paket: bytes, asli: bytes, nama_masuk: str,
                     sekarang: float) -> Keluaran:
        """TODO 7.4g: hop = next_hop rute, atau tujuan sendiri bila rute connected.
        MAC hop ada di cache -> kembalikan frame. Tidak ada -> antrekan (paket, asli,
        nama_masuk) di self._menunggu[hop]; kirim ARP request (self._minta_arp) HANYA
        bila ini antrean baru."""
        raise NotImplementedError("TODO 7.4g: _kirim_lewat")

    def _minta_arp(self, a: Antarmuka, hop: str, menunggu: _Menunggu, sekarang: float) -> tuple[str, bytes]:
        """Sudah jadi: catat waktu & jumlah permintaan, buat ARP request broadcast."""
        menunggu.terakhir_minta = sekarang
        menunggu.jumlah_minta += 1
        minta = PaketARP(ARP_REQUEST, a.mac, a.ip, MAC_NOL, hop)
        return (a.nama, FrameEthernet(MAC_BROADCAST, a.mac, ETHERTYPE_ARP, minta.ke_bytes()).ke_bytes())

    def _kirim_dari_router(self, ip: PaketIPv4, sekarang: float) -> Keluaran:
        """Sudah jadi: kirim paket buatan router (balasan ping, ICMP error) sesuai tabel."""
        cocok = self.tabel.cari(ip.tujuan)
        if cocok is None:
            return []
        b = ip.ke_bytes()
        return self._kirim_lewat(cocok[1], ip.tujuan, b, b, cocok[1].antarmuka, sekarang)

    def _icmp_error(self, masuk: Antarmuka, asli: bytes, tipe: int, kode: int, sekarang: float) -> Keluaran:
        """TODO 7.4h: buat ICMP error berisi kutipan_icmp(asli), sumber = IP antarmuka
        masuk, tujuan = sumber paket asli. JANGAN membuat error bila paket asli berasal
        dari router sendiri, atau paket asli sendiri adalah ICMP error (TIPE_ICMP_ERROR)."""
        raise NotImplementedError("TODO 7.4h: _icmp_error")

    def tick(self, sekarang: float) -> Keluaran:
        """TODO 7.4i: untuk setiap antrean ARP yang permintaan terakhirnya sudah
        >= jeda_ulang_arp detik lalu: bila jumlah_minta sudah mencapai maks, hapus antrean
        dan kirim ICMP host unreachable (3/1) untuk tiap paket; bila belum, minta ulang."""
        raise NotImplementedError("TODO 7.4i: tick")

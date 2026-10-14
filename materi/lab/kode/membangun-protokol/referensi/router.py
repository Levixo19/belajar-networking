# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Lab 7.4 (REFERENSI): router mini IPv4.

Komponen:
  TrieBiner  tabel forwarding dengan longest prefix match (trie biner, 1 bit per level)
  CacheARP   pemetaan IP -> MAC dengan masa berlaku
  Router     menerima frame Ethernet, menjawab ARP dan ping, meneruskan IPv4 (TTL turun,
             checksum dihitung ulang), dan membuat ICMP error (time exceeded,
             destination unreachable) sesuai RFC 792 dan RFC 1812.
"""

from __future__ import annotations

import ipaddress
from dataclasses import dataclass, field
from typing import Any, Optional

from umum.paket import (
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
    jaringan = ipaddress.IPv4Network(prefix, strict=True)
    return int(jaringan.network_address), jaringan.prefixlen


class TrieBiner:
    """Trie biner: level ke-i memutuskan bit ke-i (dari kiri) alamat. Prefix /n
    disimpan di simpul pada kedalaman n. Pencarian menelusuri bit alamat dan mengingat
    simpul terakhir yang menyimpan rute: itulah prefix terpanjang yang cocok."""

    def __init__(self):
        self._akar = _Simpul()
        self._jumlah = 0

    def __len__(self) -> int:
        return self._jumlah

    def sisip(self, prefix: str, nilai: Any) -> None:
        alamat, panjang = _urai_prefix(prefix)
        simpul = self._akar
        for i in range(panjang):
            bit = (alamat >> (31 - i)) & 1
            if simpul.anak[bit] is None:
                simpul.anak[bit] = _Simpul()
            simpul = simpul.anak[bit]
        if not simpul.ada:
            self._jumlah += 1
        simpul.ada, simpul.nilai = True, nilai

    def hapus(self, prefix: str) -> bool:
        alamat, panjang = _urai_prefix(prefix)
        simpul = self._akar
        for i in range(panjang):
            simpul = simpul.anak[(alamat >> (31 - i)) & 1]
            if simpul is None:
                return False
        if not simpul.ada:
            return False
        simpul.ada, simpul.nilai = False, None
        self._jumlah -= 1
        return True

    def cari(self, ip: str) -> Optional[tuple[str, Any]]:
        """Kembalikan (prefix, nilai) untuk prefix terpanjang yang memuat ip, atau None."""
        alamat = ip_ke_int(ip)
        simpul = self._akar
        terbaik: Optional[tuple[int, Any]] = (0, simpul.nilai) if simpul.ada else None
        for i in range(32):
            simpul = simpul.anak[(alamat >> (31 - i)) & 1]
            if simpul is None:
                break
            if simpul.ada:
                terbaik = (i + 1, simpul.nilai)
        if terbaik is None:
            return None
        panjang, nilai = terbaik
        jaringan = ipaddress.IPv4Network((alamat, panjang), strict=False)
        return str(jaringan), nilai


# --- ARP ------------------------------------------------------------------------

class CacheARP:
    def __init__(self, umur: float = 30.0):
        self.umur = umur
        self._isi: dict[str, tuple[str, float]] = {}

    def simpan(self, ip: str, mac: str, sekarang: float) -> None:
        self._isi[ip] = (mac, sekarang + self.umur)

    def cari(self, ip: str, sekarang: float) -> Optional[str]:
        entri = self._isi.get(ip)
        if entri is None:
            return None
        mac, kedaluwarsa = entri
        if sekarang >= kedaluwarsa:
            del self._isi[ip]
            return None
        return mac


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
        self._menunggu: dict[str, _Menunggu] = {}
        for a in antarmuka:
            self.tabel.sisip(a.jaringan, Rute(a.jaringan, None, a.nama))

    def tambah_rute(self, prefix: str, next_hop: Optional[str], antarmuka: str) -> None:
        self.tabel.sisip(prefix, Rute(prefix, next_hop, antarmuka))

    def _milik_saya(self, ip: str) -> bool:
        return any(a.ip == ip for a in self.antarmuka.values())

    # -- penerimaan --

    def terima_frame(self, nama_antarmuka: str, frame: bytes, sekarang: float) -> Keluaran:
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
        if arp.ip_target != masuk.ip:
            return []
        self.arp.simpan(arp.ip_pengirim, arp.mac_pengirim, sekarang)
        keluar: Keluaran = []
        if arp.operasi == ARP_REQUEST:
            balas = PaketARP(ARP_REPLY, masuk.mac, masuk.ip, arp.mac_pengirim, arp.ip_pengirim)
            keluar.append((masuk.nama, FrameEthernet(arp.mac_pengirim, masuk.mac, ETHERTYPE_ARP,
                                                     balas.ke_bytes()).ke_bytes()))
        menunggu = self._menunggu.pop(arp.ip_pengirim, None)
        if menunggu is not None:
            a = self.antarmuka[menunggu.antarmuka]
            for diteruskan, _, _ in menunggu.paket:
                keluar.append((a.nama, FrameEthernet(arp.mac_pengirim, a.mac, ETHERTYPE_IPV4, diteruskan).ke_bytes()))
        return keluar

    def _tangani_ipv4(self, masuk: Antarmuka, data: bytes, sekarang: float) -> Keluaran:
        ip = PaketIPv4.dari_bytes(data)
        if not ip.checksum_ok or ip.terpotong:
            return []
        if self._milik_saya(ip.tujuan):
            return self._untuk_saya(masuk, ip, data, sekarang)
        if ip.ttl <= 1:
            return self._icmp_error(masuk, data, ICMP_TIME_EXCEEDED, 0, sekarang)
        cocok = self.tabel.cari(ip.tujuan)
        if cocok is None:
            return self._icmp_error(masuk, data, ICMP_DEST_UNREACH, KODE_NET_UNREACH, sekarang)
        ip.ttl -= 1
        return self._kirim_lewat(cocok[1], ip.tujuan, ip.ke_bytes(), data, masuk.nama, sekarang)

    def _untuk_saya(self, masuk: Antarmuka, ip: PaketIPv4, asli: bytes, sekarang: float) -> Keluaran:
        if ip.protokol == PROTO_ICMP:
            icmp = PaketICMP.dari_bytes(ip.muatan)
            if icmp.checksum_ok and icmp.tipe == ICMP_ECHO_REQUEST:
                balas = PaketICMP(ICMP_ECHO_REPLY, 0, icmp.sisa_header, icmp.isi)
                return self._kirim_dari_router(PaketIPv4(ip.tujuan, ip.sumber, PROTO_ICMP, balas.ke_bytes()), sekarang)
            return []
        if ip.protokol in (PROTO_UDP, PROTO_TCP):
            return self._icmp_error(masuk, asli, ICMP_DEST_UNREACH, KODE_PORT_UNREACH, sekarang)
        return self._icmp_error(masuk, asli, ICMP_DEST_UNREACH, KODE_PROTO_UNREACH, sekarang)

    # -- pengiriman --

    def _kirim_lewat(self, rute: Rute, tujuan: str, paket: bytes, asli: bytes, nama_masuk: str,
                     sekarang: float) -> Keluaran:
        hop = rute.next_hop or tujuan
        a = self.antarmuka[rute.antarmuka]
        mac = self.arp.cari(hop, sekarang)
        if mac is not None:
            return [(a.nama, FrameEthernet(mac, a.mac, ETHERTYPE_IPV4, paket).ke_bytes())]
        menunggu = self._menunggu.get(hop)
        baru = menunggu is None
        if baru:
            menunggu = self._menunggu[hop] = _Menunggu(a.nama)
        menunggu.paket.append((paket, asli, nama_masuk))
        if baru:
            return [self._minta_arp(a, hop, menunggu, sekarang)]
        return []

    def _minta_arp(self, a: Antarmuka, hop: str, menunggu: _Menunggu, sekarang: float) -> tuple[str, bytes]:
        menunggu.terakhir_minta = sekarang
        menunggu.jumlah_minta += 1
        minta = PaketARP(ARP_REQUEST, a.mac, a.ip, MAC_NOL, hop)
        return (a.nama, FrameEthernet(MAC_BROADCAST, a.mac, ETHERTYPE_ARP, minta.ke_bytes()).ke_bytes())

    def _kirim_dari_router(self, ip: PaketIPv4, sekarang: float) -> Keluaran:
        cocok = self.tabel.cari(ip.tujuan)
        if cocok is None:
            return []
        b = ip.ke_bytes()
        return self._kirim_lewat(cocok[1], ip.tujuan, b, b, cocok[1].antarmuka, sekarang)

    def _icmp_error(self, masuk: Antarmuka, asli: bytes, tipe: int, kode: int, sekarang: float) -> Keluaran:
        ip = PaketIPv4.dari_bytes(asli)
        if self._milik_saya(ip.sumber):
            return []   # paket buatan router sendiri: tidak ada yang perlu diberi tahu
        if ip.protokol == PROTO_ICMP:
            try:
                if PaketICMP.dari_bytes(ip.muatan).tipe in TIPE_ICMP_ERROR:
                    return []
            except ValueError:
                return []
        icmp = PaketICMP(tipe, kode, b"\x00\x00\x00\x00", kutipan_icmp(asli))
        return self._kirim_dari_router(PaketIPv4(masuk.ip, ip.sumber, PROTO_ICMP, icmp.ke_bytes()), sekarang)

    # -- waktu --

    def tick(self, sekarang: float) -> Keluaran:
        """Panggil berkala: kirim ulang ARP request, atau menyerah setelah batas dan
        kirim ICMP host unreachable untuk setiap paket yang tertahan."""
        keluar: Keluaran = []
        for hop, m in list(self._menunggu.items()):
            if sekarang - m.terakhir_minta < self.jeda_ulang_arp:
                continue
            if m.jumlah_minta >= self.maks_permintaan_arp:
                del self._menunggu[hop]
                for _, asli, nama_masuk in m.paket:
                    keluar += self._icmp_error(self.antarmuka[nama_masuk], asli, ICMP_DEST_UNREACH,
                                               KODE_HOST_UNREACH, sekarang)
            else:
                keluar.append(self._minta_arp(self.antarmuka[m.antarmuka], hop, m, sekarang))
        return keluar

# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Pembuat dan pengurai format paket nyata: Ethernet II, ARP, IPv4, UDP, ICMP.

Semua format mengikuti RFC (IPv4: RFC 791, ICMP: RFC 792, UDP: RFC 768, ARP: RFC 826).
Modul ini sengaja disediakan lengkap supaya latihan Anda fokus pada LOGIKA protokol
(kapan membalas, ke mana meneruskan, ICMP apa yang dibuat), bukan pada struct.pack.
"""

from __future__ import annotations

import ipaddress
import struct
from dataclasses import dataclass, field

from umum.checksum import checksum_internet

ETHERTYPE_IPV4 = 0x0800
ETHERTYPE_ARP = 0x0806
MAC_BROADCAST = "ff:ff:ff:ff:ff:ff"
MAC_NOL = "00:00:00:00:00:00"

PROTO_ICMP = 1
PROTO_TCP = 6
PROTO_UDP = 17

ICMP_ECHO_REPLY = 0
ICMP_DEST_UNREACH = 3
ICMP_ECHO_REQUEST = 8
ICMP_TIME_EXCEEDED = 11

# Kode untuk ICMP Destination Unreachable (tipe 3)
KODE_NET_UNREACH = 0
KODE_HOST_UNREACH = 1
KODE_PROTO_UNREACH = 2
KODE_PORT_UNREACH = 3
KODE_ADMIN_PROHIBITED = 13

ARP_REQUEST = 1
ARP_REPLY = 2


# --- Alamat -------------------------------------------------------------------

def mac_ke_bytes(mac: str) -> bytes:
    return bytes(int(b, 16) for b in mac.split(":"))


def bytes_ke_mac(data: bytes) -> str:
    return ":".join(f"{b:02x}" for b in data)


def ip_ke_bytes(ip: str) -> bytes:
    return ipaddress.IPv4Address(ip).packed


def bytes_ke_ip(data: bytes) -> str:
    return str(ipaddress.IPv4Address(data))


def ip_ke_int(ip: str) -> int:
    return int(ipaddress.IPv4Address(ip))


def int_ke_ip(n: int) -> str:
    return str(ipaddress.IPv4Address(n))


# --- Ethernet II ----------------------------------------------------------------

@dataclass
class FrameEthernet:
    tujuan: str
    sumber: str
    tipe: int
    muatan: bytes

    def ke_bytes(self) -> bytes:
        return mac_ke_bytes(self.tujuan) + mac_ke_bytes(self.sumber) + struct.pack("!H", self.tipe) + self.muatan

    @classmethod
    def dari_bytes(cls, data: bytes) -> "FrameEthernet":
        if len(data) < 14:
            raise ValueError("frame Ethernet terlalu pendek")
        (tipe,) = struct.unpack("!H", data[12:14])
        return cls(bytes_ke_mac(data[0:6]), bytes_ke_mac(data[6:12]), tipe, data[14:])


# --- ARP (Ethernet + IPv4) ------------------------------------------------------

@dataclass
class PaketARP:
    operasi: int
    mac_pengirim: str
    ip_pengirim: str
    mac_target: str
    ip_target: str

    def ke_bytes(self) -> bytes:
        return (
            struct.pack("!HHBBH", 1, ETHERTYPE_IPV4, 6, 4, self.operasi)
            + mac_ke_bytes(self.mac_pengirim) + ip_ke_bytes(self.ip_pengirim)
            + mac_ke_bytes(self.mac_target) + ip_ke_bytes(self.ip_target)
        )

    @classmethod
    def dari_bytes(cls, data: bytes) -> "PaketARP":
        if len(data) < 28:
            raise ValueError("paket ARP terlalu pendek")
        htype, ptype, hlen, plen, op = struct.unpack("!HHBBH", data[:8])
        if (htype, ptype, hlen, plen) != (1, ETHERTYPE_IPV4, 6, 4):
            raise ValueError("hanya ARP Ethernet/IPv4 yang didukung")
        return cls(
            op,
            bytes_ke_mac(data[8:14]), bytes_ke_ip(data[14:18]),
            bytes_ke_mac(data[18:24]), bytes_ke_ip(data[24:28]),
        )


# --- IPv4 -----------------------------------------------------------------------

@dataclass
class PaketIPv4:
    sumber: str
    tujuan: str
    protokol: int
    muatan: bytes = b""
    ttl: int = 64
    identifikasi: int = 0
    tos: int = 0
    flags_fragmen: int = 0x4000  # bit DF menyala, offset 0
    opsi: bytes = b""
    # Diisi oleh dari_bytes(); diabaikan oleh ke_bytes() yang selalu menghitung ulang.
    checksum: int = field(default=0, compare=False)
    checksum_ok: bool = field(default=True, compare=False)
    terpotong: bool = field(default=False, compare=False)

    def header_bytes(self) -> bytes:
        if len(self.opsi) % 4:
            raise ValueError("panjang opsi IPv4 harus kelipatan 4")
        ihl = 5 + len(self.opsi) // 4
        total = ihl * 4 + len(self.muatan)
        tanpa_cs = struct.pack(
            "!BBHHHBBH4s4s",
            (4 << 4) | ihl, self.tos, total, self.identifikasi, self.flags_fragmen,
            self.ttl, self.protokol, 0, ip_ke_bytes(self.sumber), ip_ke_bytes(self.tujuan),
        ) + self.opsi
        cs = checksum_internet(tanpa_cs)
        return tanpa_cs[:10] + struct.pack("!H", cs) + tanpa_cs[12:]

    def ke_bytes(self) -> bytes:
        return self.header_bytes() + self.muatan

    @classmethod
    def dari_bytes(cls, data: bytes) -> "PaketIPv4":
        """Urai paket IPv4. Toleran terhadap paket terpotong (misalnya kutipan di dalam
        ICMP yang hanya memuat header + 8 byte pertama); lihat atribut `terpotong`."""
        if len(data) < 20:
            raise ValueError("paket IPv4 terlalu pendek")
        vihl, tos, total, ident, ff, ttl, proto, cs, src, dst = struct.unpack("!BBHHHBBH4s4s", data[:20])
        if vihl >> 4 != 4:
            raise ValueError("bukan IPv4")
        ihl = vihl & 0x0F
        if ihl < 5 or len(data) < ihl * 4:
            raise ValueError("IHL tidak sah")
        akhir = min(total, len(data))
        return cls(
            sumber=bytes_ke_ip(src), tujuan=bytes_ke_ip(dst), protokol=proto,
            muatan=data[ihl * 4:akhir], ttl=ttl, identifikasi=ident, tos=tos,
            flags_fragmen=ff, opsi=data[20:ihl * 4], checksum=cs,
            checksum_ok=checksum_internet(data[:ihl * 4]) == 0,
            terpotong=len(data) < total,
        )


# --- UDP ------------------------------------------------------------------------

def buat_udp(port_sumber: int, port_tujuan: int, muatan: bytes) -> bytes:
    """Segmen UDP dengan checksum 0 ("tidak dihitung", sah untuk IPv4 menurut RFC 768)."""
    return struct.pack("!HHHH", port_sumber, port_tujuan, 8 + len(muatan), 0) + muatan


def urai_udp(data: bytes) -> tuple[int, int, bytes]:
    """Kembalikan (port_sumber, port_tujuan, muatan). Toleran terhadap data terpotong."""
    if len(data) < 8:
        raise ValueError("segmen UDP terlalu pendek")
    sport, dport, panjang, _ = struct.unpack("!HHHH", data[:8])
    return sport, dport, data[8:panjang]


# --- ICMP -----------------------------------------------------------------------

@dataclass
class PaketICMP:
    tipe: int
    kode: int
    sisa_header: bytes = b"\x00\x00\x00\x00"  # 4 byte: id+seq (echo), unused (error), dst.
    isi: bytes = b""
    checksum_ok: bool = field(default=True, compare=False)

    def ke_bytes(self) -> bytes:
        tanpa_cs = struct.pack("!BBH", self.tipe, self.kode, 0) + self.sisa_header + self.isi
        cs = checksum_internet(tanpa_cs)
        return tanpa_cs[:2] + struct.pack("!H", cs) + tanpa_cs[4:]

    @classmethod
    def dari_bytes(cls, data: bytes) -> "PaketICMP":
        if len(data) < 8:
            raise ValueError("pesan ICMP terlalu pendek")
        tipe, kode, _ = struct.unpack("!BBH", data[:4])
        return cls(tipe, kode, data[4:8], data[8:], checksum_ok=checksum_internet(data) == 0)


def buat_icmp_echo(ident: int, seq: int, data: bytes = b"", balasan: bool = False) -> bytes:
    tipe = ICMP_ECHO_REPLY if balasan else ICMP_ECHO_REQUEST
    return PaketICMP(tipe, 0, struct.pack("!HH", ident, seq), data).ke_bytes()


def kutipan_icmp(paket_asli: bytes) -> bytes:
    """Bagian paket asli yang wajib dikutip pesan error ICMP (RFC 792):
    header IP lengkap ditambah 8 byte pertama muatannya."""
    ihl = (paket_asli[0] & 0x0F) * 4
    return paket_asli[:ihl + 8]

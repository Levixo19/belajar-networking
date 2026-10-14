# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Internet checksum (RFC 1071): jumlah one's complement 16 bit.

Dipakai oleh header IPv4, ICMP, UDP, TCP, dan oleh protokol buatan kita di Lab 7.2.
"""


def checksum_internet(data: bytes) -> int:
    """Hitung Internet checksum atas `data`.

    Langkah: pecah data menjadi kata 16 bit (big-endian, byte ganjil terakhir diberi
    padding nol), jumlahkan, lipat carry di atas bit ke-16 kembali ke bawah, lalu
    balik semua bitnya (one's complement).

    Sifat penting: bila checksum yang benar sudah tertulis di dalam data, menghitung
    checksum atas seluruh data (termasuk field checksum) menghasilkan 0.
    """
    if len(data) % 2:
        data += b"\x00"
    total = 0
    for i in range(0, len(data), 2):
        total += (data[i] << 8) | data[i + 1]
    while total >> 16:
        total = (total & 0xFFFF) + (total >> 16)
    return ~total & 0xFFFF


def checksum_valid(data: bytes) -> bool:
    """True bila `data` (yang field checksum-nya sudah terisi) lolos verifikasi."""
    return checksum_internet(data) == 0

# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Lab 7.2 (REFERENSI): transfer andal Go-Back-N dan Selective Repeat di atas kanal rusak.

Format paket (8 byte header, big-endian):

     0       1       2       3       4       5       6       7
    +-------+-------+-------+-------+-------+-------+-------+-------+
    | tipe  | cadang|      seq      |    panjang    |   checksum    |
    +-------+-------+-------+-------+-------+-------+-------+-------+
    | muatan (panjang byte) ...

tipe 0 = DATA, 1 = ACK. Checksum = Internet checksum atas header + muatan.
Makna seq pada ACK berbeda per protokol:
  - Go-Back-N: ACK kumulatif, seq = nomor paket BERIKUTNYA yang diharapkan (gaya TCP).
  - Selective Repeat: ACK individual, seq = nomor paket yang diterima.
"""

from __future__ import annotations

import struct
from dataclasses import dataclass
from typing import Optional

from umum.checksum import checksum_internet

TIPE_DATA = 0
TIPE_ACK = 1
_HEADER = struct.Struct("!BBHHH")
UKURAN_HEADER = _HEADER.size


@dataclass(frozen=True)
class Paket:
    tipe: int
    seq: int
    muatan: bytes = b""


def buat_paket(tipe: int, seq: int, muatan: bytes = b"") -> bytes:
    tanpa_cs = _HEADER.pack(tipe, 0, seq, len(muatan), 0) + muatan
    return tanpa_cs[:6] + struct.pack("!H", checksum_internet(tanpa_cs)) + tanpa_cs[8:]


def urai_paket(data: bytes) -> Optional[Paket]:
    """Kembalikan Paket, atau None bila paket rusak (terlalu pendek, panjang tidak cocok,
    tipe tidak dikenal, atau checksum gagal). Paket rusak diperlakukan seperti hilang."""
    if len(data) < UKURAN_HEADER:
        return None
    tipe, _, seq, panjang, _ = _HEADER.unpack(data[:UKURAN_HEADER])
    if panjang != len(data) - UKURAN_HEADER or tipe not in (TIPE_DATA, TIPE_ACK):
        return None
    if checksum_internet(data) != 0:
        return None
    return Paket(tipe, seq, data[UKURAN_HEADER:])


def periksa_jendela(protokol: str, jendela: int, ruang_seq: int) -> None:
    """Tolak ukuran jendela yang membuat nomor urut ambigu.

    Go-Back-N (jendela penerima 1): jendela <= ruang_seq - 1.
    Selective Repeat (jendela penerima = jendela pengirim): jendela <= ruang_seq / 2.
    """
    if ruang_seq < 2 or ruang_seq > 65536:
        raise ValueError("ruang_seq harus 2..65536 (field seq 16 bit)")
    if jendela < 1:
        raise ValueError("jendela minimal 1")
    if protokol == "gbn":
        batas = ruang_seq - 1
    elif protokol == "sr":
        batas = ruang_seq // 2
    else:
        raise ValueError("protokol harus 'gbn' atau 'sr'")
    if jendela > batas:
        raise ValueError(f"jendela {jendela} terlalu besar untuk {protokol.upper()} dengan "
                         f"ruang_seq {ruang_seq}; maksimum {batas}")


def utilisasi(jendela: int, ukuran_paket_byte: int, laju_bps: float, rtt: float) -> float:
    """Utilisasi pengirim tanpa kehilangan: U = min(1, N * (L/R) / (RTT + L/R)).

    Stop-and-wait adalah kasus N = 1.
    """
    t_kirim = ukuran_paket_byte * 8 / laju_bps
    return min(1.0, jendela * t_kirim / (rtt + t_kirim))


def _potong(data: bytes, mss: int) -> list[bytes]:
    if mss < 1:
        raise ValueError("mss minimal 1")
    return [data[i:i + mss] for i in range(0, len(data), mss)]


class PengirimGBN:
    """Pengirim Go-Back-N: satu timer untuk paket tertua; saat timeout kirim ulang SEMUA
    paket yang belum di-ACK. Stop-and-wait = PengirimGBN dengan jendela 1."""

    def __init__(self, data: bytes, jendela: int, ruang_seq: int = 256, mss: int = 1000,
                 rto: float = 0.2, periksa: bool = True):
        if periksa:
            periksa_jendela("gbn", jendela, ruang_seq)
        self.jendela = jendela
        self.ruang_seq = ruang_seq
        self.rto = rto
        self._potongan = _potong(data, mss)
        self._base = 0      # indeks absolut paket tertua yang belum di-ACK
        self._next = 0      # indeks absolut paket baru berikutnya
        self._timer: Optional[float] = None
        self.paket_dikirim = 0
        self.retransmisi = 0

    def _paket(self, i: int) -> bytes:
        self.paket_dikirim += 1
        return buat_paket(TIPE_DATA, i % self.ruang_seq, self._potongan[i])

    def kirim(self, sekarang: float) -> list[bytes]:
        keluar = []
        if self._timer is not None and sekarang >= self._timer:
            for i in range(self._base, self._next):
                keluar.append(self._paket(i))
                self.retransmisi += 1
            self._timer = sekarang + self.rto
        while self._next < len(self._potongan) and self._next - self._base < self.jendela:
            if self._next == self._base:
                self._timer = sekarang + self.rto
            keluar.append(self._paket(self._next))
            self._next += 1
        return keluar

    def terima(self, paket: bytes, sekarang: float) -> None:
        p = urai_paket(paket)
        if p is None or p.tipe != TIPE_ACK:
            return
        maju = (p.seq - self._base) % self.ruang_seq
        if 1 <= maju <= self._next - self._base:
            self._base += maju
            self._timer = None if self._base == self._next else sekarang + self.rto

    def tenggat(self) -> Optional[float]:
        return self._timer

    def selesai(self) -> bool:
        return self._base >= len(self._potongan)


class PenerimaGBN:
    """Penerima Go-Back-N: hanya menerima paket yang tepat diharapkan; paket lain dibuang
    dan dijawab dengan ACK kumulatif yang sama (duplicate ACK)."""

    def __init__(self, ruang_seq: int = 256):
        self.ruang_seq = ruang_seq
        self._harap = 0
        self._data = bytearray()

    def terima(self, paket: bytes, sekarang: float) -> list[bytes]:
        p = urai_paket(paket)
        if p is None or p.tipe != TIPE_DATA:
            return []
        if p.seq == self._harap:
            self._data += p.muatan
            self._harap = (self._harap + 1) % self.ruang_seq
        return [buat_paket(TIPE_ACK, self._harap)]

    def data(self) -> bytes:
        return bytes(self._data)


class PengirimSR:
    """Pengirim Selective Repeat: timer per paket; hanya paket yang timeout dikirim ulang."""

    def __init__(self, data: bytes, jendela: int, ruang_seq: int = 256, mss: int = 1000,
                 rto: float = 0.2, periksa: bool = True):
        if periksa:
            periksa_jendela("sr", jendela, ruang_seq)
        self.jendela = jendela
        self.ruang_seq = ruang_seq
        self.rto = rto
        self._potongan = _potong(data, mss)
        self._base = 0
        self._next = 0
        self._tenggat: dict[int, float] = {}   # indeks absolut -> batas waktu
        self._diack: set[int] = set()
        self.paket_dikirim = 0
        self.retransmisi = 0

    def _paket(self, i: int) -> bytes:
        self.paket_dikirim += 1
        return buat_paket(TIPE_DATA, i % self.ruang_seq, self._potongan[i])

    def kirim(self, sekarang: float) -> list[bytes]:
        keluar = []
        for i in sorted(self._tenggat):
            if self._tenggat[i] <= sekarang:
                keluar.append(self._paket(i))
                self.retransmisi += 1
                self._tenggat[i] = sekarang + self.rto
        while self._next < len(self._potongan) and self._next - self._base < self.jendela:
            keluar.append(self._paket(self._next))
            self._tenggat[self._next] = sekarang + self.rto
            self._next += 1
        return keluar

    def terima(self, paket: bytes, sekarang: float) -> None:
        p = urai_paket(paket)
        if p is None or p.tipe != TIPE_ACK:
            return
        d = (p.seq - self._base) % self.ruang_seq
        if d >= self._next - self._base:
            return  # ACK di luar jendela (basi atau ngawur)
        i = self._base + d
        if i in self._tenggat:
            del self._tenggat[i]
            self._diack.add(i)
        while self._base in self._diack:
            self._diack.remove(self._base)
            self._base += 1

    def tenggat(self) -> Optional[float]:
        return min(self._tenggat.values(), default=None)

    def selesai(self) -> bool:
        return self._base >= len(self._potongan)


class PenerimaSR:
    """Penerima Selective Repeat: menyangga paket di luar urutan di dalam jendela,
    menyerahkan data ke aplikasi hanya bila sudah berurutan, dan meng-ACK tiap paket."""

    def __init__(self, jendela: int, ruang_seq: int = 256, periksa: bool = True):
        if periksa:
            periksa_jendela("sr", jendela, ruang_seq)
        self.jendela = jendela
        self.ruang_seq = ruang_seq
        self._base = 0
        self._sangga: dict[int, bytes] = {}
        self._data = bytearray()

    def terima(self, paket: bytes, sekarang: float) -> list[bytes]:
        p = urai_paket(paket)
        if p is None or p.tipe != TIPE_DATA:
            return []
        d = (p.seq - self._base) % self.ruang_seq
        if d < self.jendela:
            self._sangga.setdefault(p.seq, p.muatan)
            while self._base in self._sangga:
                self._data += self._sangga.pop(self._base)
                self._base = (self._base + 1) % self.ruang_seq
            return [buat_paket(TIPE_ACK, p.seq)]
        if d >= self.ruang_seq - self.jendela:
            # Paket lama yang sudah diserahkan; ACK-nya mungkin hilang, jadi ACK lagi.
            return [buat_paket(TIPE_ACK, p.seq)]
        return []

    def data(self) -> bytes:
        return bytes(self._data)

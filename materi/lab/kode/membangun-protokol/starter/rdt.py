# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Lab 7.2 (STARTER): transfer andal Go-Back-N dan Selective Repeat di atas kanal rusak.

Format paket (8 byte header, big-endian), SUDAH disediakan lewat buat_paket/urai_paket:

     0       1       2       3       4       5       6       7
    +-------+-------+-------+-------+-------+-------+-------+-------+
    | tipe  | cadang|      seq      |    panjang    |   checksum    |
    +-------+-------+-------+-------+-------+-------+-------+-------+

Makna seq pada ACK:
  - Go-Back-N: ACK kumulatif, seq = nomor paket BERIKUTNYA yang diharapkan.
  - Selective Repeat: ACK individual, seq = nomor paket yang diterima.

Antarmuka sans-IO yang dipakai simulator (lihat umum/kanal.py):
    pengirim.kirim(sekarang) -> list[bytes]; pengirim.terima(paket, sekarang);
    pengirim.tenggat() -> float | None; pengirim.selesai() -> bool
    penerima.terima(paket, sekarang) -> list[bytes]; penerima.data() -> bytes

Petunjuk umum: simpan indeks ABSOLUT (0, 1, 2, ...) di pengirim dan hanya ubah ke
nomor urut di kabel dengan `i % ruang_seq`. Untuk menafsirkan nomor urut yang datang,
hitung jaraknya dari base: d = (seq - base) % ruang_seq.

Uji: pytest --impl=starter tests/test_72_rdt.py
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
    """Kembalikan Paket, atau None bila paket rusak. Paket rusak = paket hilang."""
    if len(data) < UKURAN_HEADER:
        return None
    tipe, _, seq, panjang, _ = _HEADER.unpack(data[:UKURAN_HEADER])
    if panjang != len(data) - UKURAN_HEADER or tipe not in (TIPE_DATA, TIPE_ACK):
        return None
    if checksum_internet(data) != 0:
        return None
    return Paket(tipe, seq, data[UKURAN_HEADER:])


def periksa_jendela(protokol: str, jendela: int, ruang_seq: int) -> None:
    """TODO 7.2a: lempar ValueError bila jendela tidak sah.
      - ruang_seq harus 2..65536; jendela minimal 1
      - "gbn": jendela <= ruang_seq - 1
      - "sr":  jendela <= ruang_seq // 2
      - protokol lain: ValueError
    """
    raise NotImplementedError("TODO 7.2a: periksa_jendela")


def utilisasi(jendela: int, ukuran_paket_byte: int, laju_bps: float, rtt: float) -> float:
    """TODO 7.2b: U = min(1, N * (L/R) / (RTT + L/R)), L dalam bit."""
    raise NotImplementedError("TODO 7.2b: utilisasi")


def _potong(data: bytes, mss: int) -> list[bytes]:
    if mss < 1:
        raise ValueError("mss minimal 1")
    return [data[i:i + mss] for i in range(0, len(data), mss)]


class PengirimGBN:
    """Go-Back-N. Stop-and-wait = jendela 1."""

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

    def kirim(self, sekarang: float) -> list[bytes]:
        """TODO 7.2c:
          1. Bila timer menyala dan sudah lewat: kirim ulang SEMUA paket base..next-1,
             lalu nyalakan ulang timer (sekarang + rto).
          2. Selama masih ada data dan (next - base) < jendela: kirim paket baru.
             Nyalakan timer bila paket ini satu-satunya yang belum di-ACK.
        """
        raise NotImplementedError("TODO 7.2c: PengirimGBN.kirim")

    def terima(self, paket: bytes, sekarang: float) -> None:
        """TODO 7.2c: abaikan paket rusak/bukan ACK. ACK kumulatif menggeser base sejauh
        maju = (ack - base) % ruang_seq, asalkan 1 <= maju <= jumlah paket yang belum
        di-ACK. Matikan timer bila semua sudah di-ACK, kalau tidak nyalakan ulang."""
        raise NotImplementedError("TODO 7.2c: PengirimGBN.terima")

    def tenggat(self) -> Optional[float]:
        return self._timer

    def selesai(self) -> bool:
        return self._base >= len(self._potongan)


class PenerimaGBN:
    def __init__(self, ruang_seq: int = 256):
        self.ruang_seq = ruang_seq
        self._harap = 0
        self._data = bytearray()

    def terima(self, paket: bytes, sekarang: float) -> list[bytes]:
        """TODO 7.2d: paket rusak -> []. Paket DATA dengan seq == harap: simpan muatan,
        majukan harap (modulo). Apa pun yang terjadi pada paket DATA yang utuh, balas
        dengan ACK kumulatif bernomor harap."""
        raise NotImplementedError("TODO 7.2d: PenerimaGBN.terima")

    def data(self) -> bytes:
        return bytes(self._data)


class PengirimSR:
    """Selective Repeat: timer per paket."""

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

    def kirim(self, sekarang: float) -> list[bytes]:
        """TODO 7.2e: kirim ulang HANYA paket yang tenggatnya lewat (perbarui tenggatnya),
        lalu kirim paket baru selama jendela masih muat."""
        raise NotImplementedError("TODO 7.2e: PengirimSR.kirim")

    def terima(self, paket: bytes, sekarang: float) -> None:
        """TODO 7.2e: ACK individual. d = (seq - base) % ruang_seq; abaikan bila d di luar
        paket yang sudah terkirim. Tandai paket base+d sudah di-ACK (hapus timernya), lalu
        geser base selama paket di base sudah di-ACK."""
        raise NotImplementedError("TODO 7.2e: PengirimSR.terima")

    def tenggat(self) -> Optional[float]:
        return min(self._tenggat.values(), default=None)

    def selesai(self) -> bool:
        return self._base >= len(self._potongan)


class PenerimaSR:
    def __init__(self, jendela: int, ruang_seq: int = 256, periksa: bool = True):
        if periksa:
            periksa_jendela("sr", jendela, ruang_seq)
        self.jendela = jendela
        self.ruang_seq = ruang_seq
        self._base = 0
        self._sangga: dict[int, bytes] = {}
        self._data = bytearray()

    def terima(self, paket: bytes, sekarang: float) -> list[bytes]:
        """TODO 7.2f: d = (seq - base) % ruang_seq.
          - d < jendela: sangga (jika belum ada), serahkan semua yang sudah berurutan
            mulai dari base, balas ACK(seq)
          - d >= ruang_seq - jendela: paket lama yang sudah diserahkan, balas ACK(seq) lagi
          - selain itu: abaikan
        """
        raise NotImplementedError("TODO 7.2f: PenerimaSR.terima")

    def data(self) -> bytes:
        return bytes(self._data)

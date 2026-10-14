# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Kanal rusak untuk Lab 7.2: simulasi berwaktu virtual dan adaptor UDP sungguhan.

Pengirim dan penerima yang Anda tulis bersifat "sans-IO": mereka tidak pernah memanggil
socket atau time.sleep sendiri. Mereka hanya:

    pengirim.kirim(sekarang)        -> list[bytes]  paket yang ingin dikirim saat ini
    pengirim.terima(paket, sekarang)                 dipanggil saat paket (ACK) tiba
    pengirim.tenggat()              -> float | None  kapan pengirim ingin dibangunkan lagi
    pengirim.selesai()              -> bool          semua data sudah di-ACK?
    penerima.terima(paket, sekarang) -> list[bytes]  paket balasan (ACK)
    penerima.data()                 -> bytes         data yang sudah diserahkan ke aplikasi

Karena itu kode yang sama bisa dijalankan di simulator berwaktu virtual (deterministik,
cepat, cocok untuk uji otomatis dan pengukuran) maupun di atas socket UDP sungguhan.
"""

from __future__ import annotations

import heapq
import random
import select
import socket
import time
from dataclasses import dataclass, field
from typing import Callable, Optional, Protocol

# aturan(indeks_paket, paket) -> True bila paket ini harus dibuang. Untuk skenario terskrip.
Aturan = Callable[[int, bytes], bool]


class Pengirim(Protocol):
    def kirim(self, sekarang: float) -> list[bytes]: ...
    def terima(self, paket: bytes, sekarang: float) -> None: ...
    def tenggat(self) -> Optional[float]: ...
    def selesai(self) -> bool: ...


class Penerima(Protocol):
    def terima(self, paket: bytes, sekarang: float) -> list[bytes]: ...
    def data(self) -> bytes: ...


@dataclass
class ProfilKanal:
    """Kerusakan satu arah kanal. Semua peluang bernilai 0..1."""
    hilang: float = 0.0          # paket dibuang
    duplikat: float = 0.0        # paket tiba dua kali
    korupsi: float = 0.0         # satu bit acak dibalik
    acak_urutan: float = 0.0     # paket diberi tunda tambahan sehingga bisa disalip
    tunda: float = 0.010         # tunda propagasi satu arah (detik)
    tunda_ekstra_maks: float = 0.020  # tunda tambahan maksimum untuk paket yang diacak
    laju_bps: Optional[float] = None  # kapasitas tautan; None = tak terbatas


@dataclass
class Statistik:
    dikirim: int = 0
    hilang: int = 0
    duplikat: int = 0
    korupsi: int = 0
    diacak: int = 0
    byte_dikirim: int = 0


def _balik_satu_bit(paket: bytes, rng: random.Random) -> bytes:
    if not paket:
        return paket
    b = bytearray(paket)
    i = rng.randrange(len(b) * 8)
    b[i // 8] ^= 1 << (i % 8)
    return bytes(b)


class Tautan:
    """Tautan satu arah dengan antrean tak terbatas, laju serialisasi, dan kerusakan acak."""

    def __init__(self, profil: ProfilKanal, rng: random.Random, aturan: Optional[Aturan] = None):
        self.profil = profil
        self.rng = rng
        self.aturan = aturan
        self.stat = Statistik()
        self._antrean: list[tuple[float, int, bytes]] = []
        self._bebas_pada = 0.0
        self._urutan = 0

    def kirim(self, paket: bytes, sekarang: float) -> None:
        p = self.profil
        indeks = self.stat.dikirim
        self.stat.dikirim += 1
        self.stat.byte_dikirim += len(paket)
        selesai_serialisasi = sekarang
        if p.laju_bps:
            mulai = max(sekarang, self._bebas_pada)
            selesai_serialisasi = mulai + len(paket) * 8 / p.laju_bps
            self._bebas_pada = selesai_serialisasi
        if (self.aturan and self.aturan(indeks, paket)) or self.rng.random() < p.hilang:
            self.stat.hilang += 1
            return
        salinan = [paket]
        if self.rng.random() < p.duplikat:
            self.stat.duplikat += 1
            salinan.append(paket)
        for k, isi in enumerate(salinan):
            if self.rng.random() < p.korupsi:
                self.stat.korupsi += 1
                isi = _balik_satu_bit(isi, self.rng)
            tiba = selesai_serialisasi + p.tunda + k * 1e-6
            if self.rng.random() < p.acak_urutan:
                self.stat.diacak += 1
                tiba += self.rng.uniform(0, p.tunda_ekstra_maks)
            self._urutan += 1
            heapq.heappush(self._antrean, (tiba, self._urutan, isi))

    def berikutnya(self) -> Optional[float]:
        return self._antrean[0][0] if self._antrean else None

    def ambil_yang_tiba(self, sekarang: float) -> list[bytes]:
        keluar = []
        while self._antrean and self._antrean[0][0] <= sekarang:
            keluar.append(heapq.heappop(self._antrean)[2])
        return keluar


@dataclass
class HasilTransfer:
    data_diterima: bytes
    selesai: bool
    waktu: float
    maju: Statistik = field(default_factory=Statistik)
    balik: Statistik = field(default_factory=Statistik)
    ukuran_data: int = 0

    @property
    def goodput_bps(self) -> float:
        """Laju data BERGUNA (byte aplikasi yang sampai dengan benar), bukan laju paket."""
        if not self.selesai or self.waktu <= 0:
            return 0.0
        return self.ukuran_data * 8 / self.waktu


def simulasikan(
    pengirim: Pengirim,
    penerima: Penerima,
    profil_maju: ProfilKanal,
    profil_balik: Optional[ProfilKanal] = None,
    seed: int = 0,
    aturan_maju: Optional[Aturan] = None,
    aturan_balik: Optional[Aturan] = None,
    batas_waktu: float = 600.0,
    maks_kejadian: int = 2_000_000,
    ukuran_data: Optional[int] = None,
) -> HasilTransfer:
    """Jalankan transfer dalam waktu virtual. Deterministik untuk seed yang sama."""
    rng = random.Random(seed)
    maju = Tautan(profil_maju, rng, aturan_maju)
    balik = Tautan(profil_balik if profil_balik is not None else ProfilKanal(tunda=profil_maju.tunda), rng, aturan_balik)
    t = 0.0
    kejadian = 0
    while t <= batas_waktu and kejadian < maks_kejadian:
        kejadian += 1
        for p in pengirim.kirim(t):
            maju.kirim(p, t)
        if pengirim.selesai():
            break
        kandidat = [x for x in (maju.berikutnya(), balik.berikutnya(), pengirim.tenggat()) if x is not None]
        if not kandidat:
            break  # macet: tidak ada paket di jalan dan pengirim tidak memasang timer
        t = max(t, min(kandidat))
        for p in maju.ambil_yang_tiba(t):
            for ack in penerima.terima(p, t):
                balik.kirim(ack, t)
        for ack in balik.ambil_yang_tiba(t):
            pengirim.terima(ack, t)
    return HasilTransfer(
        data_diterima=penerima.data(), selesai=pengirim.selesai(), waktu=t,
        maju=maju.stat, balik=balik.stat,
        ukuran_data=ukuran_data if ukuran_data is not None else len(penerima.data()),
    )


def jalankan_di_udp(
    pengirim: Pengirim,
    penerima: Penerima,
    profil: ProfilKanal,
    seed: int = 0,
    batas_detik: float = 10.0,
    ukuran_data: Optional[int] = None,
) -> HasilTransfer:
    """Jalankan pengirim/penerima yang sama di atas dua socket UDP di 127.0.0.1.

    Kerusakan disuntikkan di sisi kirim (sebelum sendto) memakai RNG ber-seed. Tunda
    dan pengacakan urutan dibuat dengan menahan paket di antrean sebelum dikirim. Waktu
    di sini waktu nyata (time.monotonic), jadi hasilnya sedikit bervariasi antarjalan.
    """
    rng = random.Random(seed)
    sock_a = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock_b = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    stat_maju, stat_balik = Statistik(), Statistik()
    try:
        sock_a.bind(("127.0.0.1", 0))
        sock_b.bind(("127.0.0.1", 0))
        alamat_a, alamat_b = sock_a.getsockname(), sock_b.getsockname()
        tertahan: list[tuple[float, int, socket.socket, tuple, bytes]] = []
        nomor = 0

        def jadwalkan(sock, tujuan, paket, sekarang, stat):
            nonlocal nomor
            stat.dikirim += 1
            stat.byte_dikirim += len(paket)
            if rng.random() < profil.hilang:
                stat.hilang += 1
                return
            salinan = [paket]
            if rng.random() < profil.duplikat:
                stat.duplikat += 1
                salinan.append(paket)
            for isi in salinan:
                if rng.random() < profil.korupsi:
                    stat.korupsi += 1
                    isi = _balik_satu_bit(isi, rng)
                lepas = sekarang + profil.tunda
                if rng.random() < profil.acak_urutan:
                    stat.diacak += 1
                    lepas += rng.uniform(0, profil.tunda_ekstra_maks)
                nomor += 1
                heapq.heappush(tertahan, (lepas, nomor, sock, tujuan, isi))

        t0 = time.monotonic()
        sekarang = 0.0
        while sekarang < batas_detik:
            sekarang = time.monotonic() - t0
            for p in pengirim.kirim(sekarang):
                jadwalkan(sock_a, alamat_b, p, sekarang, stat_maju)
            if pengirim.selesai():
                break
            while tertahan and tertahan[0][0] <= sekarang:
                _, _, s, tujuan, isi = heapq.heappop(tertahan)
                s.sendto(isi, tujuan)
            batas = [x for x in (tertahan[0][0] if tertahan else None, pengirim.tenggat()) if x is not None]
            tunggu = min(0.05, max(0.0, min(batas) - sekarang)) if batas else 0.05
            siap, _, _ = select.select([sock_a, sock_b], [], [], tunggu)
            sekarang = time.monotonic() - t0
            for s in siap:
                paket, _ = s.recvfrom(65535)
                if s is sock_b:
                    for ack in penerima.terima(paket, sekarang):
                        jadwalkan(sock_b, alamat_a, ack, sekarang, stat_balik)
                else:
                    pengirim.terima(paket, sekarang)
        return HasilTransfer(
            data_diterima=penerima.data(), selesai=pengirim.selesai(), waktu=sekarang,
            maju=stat_maju, balik=stat_balik,
            ukuran_data=ukuran_data if ukuran_data is not None else len(penerima.data()),
        )
    finally:
        sock_a.close()
        sock_b.close()

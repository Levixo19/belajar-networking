# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Lab 7.5 (REFERENSI): node distance-vector (Bellman-Ford terdistribusi).

Setiap node menyimpan vektor jarak TERAKHIR yang diiklankan tiap tetangga, lalu
menghitung ulang tabelnya:

    D_x(y) = min over tetangga v of ( c(x, v) + D_v(y) ),  dibatasi tak_hingga

Opsi pencegahan loop:
  split_horizon   jangan iklankan rute ke tetangga yang menjadi next hop rute itu
  poison_reverse  iklankan rute itu ke next hop-nya dengan biaya tak hingga (eksplisit)
"""

from __future__ import annotations

from typing import Optional


class NodeDV:
    def __init__(self, nama: str, split_horizon: bool = False, poison_reverse: bool = False,
                 tak_hingga: int = 16):
        self.nama = nama
        self.split_horizon = split_horizon
        self.poison_reverse = poison_reverse
        self.tak_hingga = tak_hingga
        self.tetangga: dict[str, int] = {}                 # nama tetangga -> biaya tautan
        self.vektor_tetangga: dict[str, dict[str, int]] = {}
        self.tabel: dict[str, tuple[int, Optional[str]]] = {nama: (0, None)}

    # -- perubahan topologi --

    def hubungkan(self, tetangga: str, biaya: int) -> bool:
        self.tetangga[tetangga] = biaya
        return self.hitung_ulang()

    def putuskan(self, tetangga: str) -> bool:
        self.tetangga.pop(tetangga, None)
        self.vektor_tetangga.pop(tetangga, None)
        return self.hitung_ulang()

    # -- pertukaran vektor --

    def buat_iklan(self, untuk: str) -> dict[str, int]:
        iklan: dict[str, int] = {}
        for tujuan, (biaya, next_hop) in self.tabel.items():
            if next_hop is not None and next_hop == untuk:
                if self.poison_reverse:
                    iklan[tujuan] = self.tak_hingga
                    continue
                if self.split_horizon:
                    continue
            iklan[tujuan] = biaya
        return iklan

    def terima_iklan(self, dari: str, iklan: dict[str, int]) -> bool:
        if dari not in self.tetangga:
            return False
        self.vektor_tetangga[dari] = dict(iklan)
        return self.hitung_ulang()

    def hitung_ulang(self) -> bool:
        """Hitung ulang seluruh tabel dari vektor tetangga. True bila tabel berubah.
        Tujuan yang pernah dikenal tetapi kini tak terjangkau disimpan dengan biaya
        tak hingga, sehingga ikut diiklankan (route poisoning)."""
        baru: dict[str, tuple[int, Optional[str]]] = {self.nama: (0, None)}
        tujuan_semua = set(self.tabel)
        for v in self.vektor_tetangga.values():
            tujuan_semua.update(v)
        tujuan_semua.discard(self.nama)
        for tujuan in sorted(tujuan_semua):
            terbaik: tuple[int, Optional[str]] = (self.tak_hingga, None)
            lama_nh = self.tabel.get(tujuan, (None, None))[1]
            for v in sorted(self.tetangga):
                d = self.vektor_tetangga.get(v, {}).get(tujuan)
                if d is None:
                    continue
                biaya = min(self.tak_hingga, self.tetangga[v] + d)
                if biaya < terbaik[0] or (biaya == terbaik[0] < self.tak_hingga and v == lama_nh):
                    terbaik = (biaya, v)
            if terbaik[0] >= self.tak_hingga:
                terbaik = (self.tak_hingga, None)
            baru[tujuan] = terbaik
        berubah = baru != self.tabel
        self.tabel = baru
        return berubah

    def biaya(self, tujuan: str) -> int:
        return self.tabel.get(tujuan, (self.tak_hingga, None))[0]

    def next_hop(self, tujuan: str) -> Optional[str]:
        return self.tabel.get(tujuan, (self.tak_hingga, None))[1]

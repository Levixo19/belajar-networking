# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Lab 7.5 (STARTER): node distance-vector (Bellman-Ford terdistribusi).

    D_x(y) = min over tetangga v of ( c(x, v) + D_v(y) ),  dibatasi tak_hingga

Simulator sinkron ada di umum/simdv.py. Uji: pytest --impl=starter tests/test_75_dv.py
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
        self.tabel: dict[str, tuple[int, Optional[str]]] = {nama: (0, None)}  # tujuan -> (biaya, next hop)

    def hubungkan(self, tetangga: str, biaya: int) -> bool:
        self.tetangga[tetangga] = biaya
        return self.hitung_ulang()

    def putuskan(self, tetangga: str) -> bool:
        """TODO 7.5a: lupakan tetangga dan vektornya, lalu hitung ulang."""
        raise NotImplementedError("TODO 7.5a: putuskan")

    def buat_iklan(self, untuk: str) -> dict[str, int]:
        """TODO 7.5b: vektor {tujuan: biaya} untuk tetangga `untuk`.
        Untuk rute yang next hop-nya == untuk:
          - poison_reverse: iklankan dengan biaya tak_hingga
          - split_horizon (tanpa poison): jangan iklankan sama sekali
        Rute lain (termasuk yang biayanya tak hingga) diiklankan apa adanya."""
        raise NotImplementedError("TODO 7.5b: buat_iklan")

    def terima_iklan(self, dari: str, iklan: dict[str, int]) -> bool:
        """TODO 7.5c: abaikan (False) bila `dari` bukan tetangga. Simpan salinan vektor
        sebagai vektor terbaru dari tetangga itu (menggantikan yang lama), lalu hitung ulang."""
        raise NotImplementedError("TODO 7.5c: terima_iklan")

    def hitung_ulang(self) -> bool:
        """TODO 7.5d: bangun tabel baru dari nol: diri sendiri (0, None); untuk setiap
        tujuan yang dikenal (di tabel lama atau di vektor tetangga mana pun), cari tetangga
        dengan c(x,v) + D_v(y) terkecil, dibatasi tak_hingga. Tak terjangkau ->
        (tak_hingga, None), JANGAN dihapus (agar diiklankan sebagai racun).
        Seri: utamakan next hop lama, lalu nama tetangga terkecil (iterasi terurut).
        Kembalikan True bila tabel berubah."""
        raise NotImplementedError("TODO 7.5d: hitung_ulang")

    def biaya(self, tujuan: str) -> int:
        return self.tabel.get(tujuan, (self.tak_hingga, None))[0]

    def next_hop(self, tujuan: str) -> Optional[str]:
        return self.tabel.get(tujuan, (self.tak_hingga, None))[1]

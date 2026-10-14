# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Simulator sinkron untuk distance-vector Lab 7.5.

Satu "ronde" = setiap node membuat iklan untuk setiap tetangganya berdasarkan keadaan
di AWAL ronde, lalu semua iklan dikirim sekaligus. Ini meniru pembaruan periodik RIP
yang kebetulan serempak, cukup untuk memperlihatkan count-to-infinity.
"""

from __future__ import annotations

from typing import Callable, Optional


class SimulasiDV:
    def __init__(self, nama_node: list[str], tautan: list[tuple[str, str, int]],
                 pabrik: Callable[[str], object]):
        """pabrik(nama) harus mengembalikan objek NodeDV (milik referensi atau starter)."""
        self.node = {n: pabrik(n) for n in nama_node}
        for a, b, biaya in tautan:
            self.node[a].hubungkan(b, biaya)
            self.node[b].hubungkan(a, biaya)

    def ronde(self) -> bool:
        iklan = {
            (n, t): node.buat_iklan(t)
            for n, node in sorted(self.node.items())
            for t in sorted(node.tetangga)
        }
        berubah = False
        for (dari, ke), isi in iklan.items():
            if self.node[ke].terima_iklan(dari, isi):
                berubah = True
        return berubah

    def jalankan(self, maks_ronde: int = 100,
                 amati: Optional[list[tuple[str, str]]] = None) -> tuple[int, bool, list[dict]]:
        """Jalankan sampai tidak ada tabel yang berubah. Kembalikan
        (jumlah_ronde, konvergen, riwayat). riwayat[i] memuat biaya rute yang diamati
        (pasangan (node, tujuan)) setelah ronde ke-(i+1)."""
        riwayat: list[dict] = []
        for r in range(1, maks_ronde + 1):
            berubah = self.ronde()
            if amati:
                riwayat.append({f"{n}->{t}": self.node[n].biaya(t) for n, t in amati})
            if not berubah:
                return r, True, riwayat
        return maks_ronde, False, riwayat

    def putuskan(self, a: str, b: str) -> None:
        self.node[a].putuskan(b)
        self.node[b].putuskan(a)

    def jalur(self, sumber: str, tujuan: str) -> Optional[list[str]]:
        """Ikuti next hop dari sumber ke tujuan. None bila tak terjangkau atau berputar."""
        jalur = [sumber]
        sekarang = sumber
        while sekarang != tujuan:
            nh = self.node[sekarang].next_hop(tujuan)
            if nh is None or nh in jalur:
                return None
            jalur.append(nh)
            sekarang = nh
        return jalur

    def tabel_teks(self) -> str:
        baris = []
        for n, node in sorted(self.node.items()):
            isi = ", ".join(
                f"{t}:{'inf' if b >= node.tak_hingga else b}" + (f" via {nh}" if nh else "")
                for t, (b, nh) in sorted(node.tabel.items()) if t != n
            )
            baris.append(f"{n}: {isi}")
        return "\n".join(baris)

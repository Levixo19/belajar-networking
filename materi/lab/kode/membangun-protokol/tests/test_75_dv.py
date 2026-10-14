# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Uji Lab 7.5: distance-vector, split horizon, poison reverse, count-to-infinity."""

import pytest

from umum.simdv import SimulasiDV

INF = 16


def _sim(dv, node, tautan, sh=False, pr=False):
    return SimulasiDV(node, tautan, lambda n: dv.NodeDV(n, split_horizon=sh, poison_reverse=pr, tak_hingga=INF))


# --- node tunggal -----------------------------------------------------------------

def test_bellman_ford_satu_node(dv):
    a = dv.NodeDV("A")
    a.hubungkan("B", 1)
    a.hubungkan("C", 5)
    a.terima_iklan("B", {"B": 0, "C": 1, "D": 7})
    a.terima_iklan("C", {"C": 0, "D": 1, "B": 1})
    assert (a.biaya("C"), a.next_hop("C")) == (2, "B")       # 1+1 lebih murah daripada 5
    assert (a.biaya("D"), a.next_hop("D")) == (6, "C")       # min(1+7, 5+1)
    assert a.biaya("A") == 0 and a.biaya("Z") == INF


def test_iklan_dari_bukan_tetangga_diabaikan(dv):
    a = dv.NodeDV("A")
    assert a.terima_iklan("X", {"X": 0, "Q": 1}) is False
    assert a.biaya("Q") == INF


def test_berita_buruk_dari_next_hop_tetap_dipakai(dv):
    """Bila next hop sendiri melaporkan biaya naik, node WAJIB ikut naik walaupun lebih
    buruk. Inilah yang memungkinkan count-to-infinity."""
    a = dv.NodeDV("A")
    a.hubungkan("B", 1)
    a.terima_iklan("B", {"B": 0, "C": 1})
    assert a.biaya("C") == 2
    assert a.terima_iklan("B", {"B": 0, "C": 9}) is True
    assert (a.biaya("C"), a.next_hop("C")) == (10, "B")


def test_biaya_dibatasi_tak_hingga(dv):
    a = dv.NodeDV("A")
    a.hubungkan("B", 3)
    a.terima_iklan("B", {"B": 0, "C": 15})
    assert a.biaya("C") == INF and a.next_hop("C") is None


@pytest.mark.parametrize("sh,pr,harap", [
    (False, False, {"A": 0, "B": 1, "C": 2}),
    (True, False, {"A": 0}),                       # B dan C dipelajari lewat B: tidak diiklankan ke B
    (False, True, {"A": 0, "B": INF, "C": INF}),   # ...atau diiklankan dengan biaya tak hingga
])
def test_buat_iklan_split_horizon_poison_reverse(dv, sh, pr, harap):
    b = dv.NodeDV("B", split_horizon=sh, poison_reverse=pr)
    b.hubungkan("A", 1)
    b.hubungkan("C", 1)
    b.terima_iklan("A", {"A": 0})
    b.terima_iklan("C", {"C": 0})
    a = dv.NodeDV("A", split_horizon=sh, poison_reverse=pr)
    a.hubungkan("B", 1)
    a.terima_iklan("B", b.buat_iklan("A"))
    assert a.buat_iklan("B") == harap
    assert a.buat_iklan("Z") == {"A": 0, "B": 1, "C": 2}   # ke tetangga lain selalu apa adanya


def test_putus_tautan_membuat_rute_tak_terjangkau(dv):
    a = dv.NodeDV("A")
    a.hubungkan("B", 1)
    a.terima_iklan("B", {"B": 0, "C": 1})
    a.putuskan("B")
    assert a.biaya("B") == INF and a.biaya("C") == INF
    assert a.buat_iklan("X")["C"] == INF                      # diracun, bukan dihapus diam-diam


# --- simulasi jaringan -------------------------------------------------------------

TOPO = (["A", "B", "C", "D", "E"],
        [("A", "B", 2), ("B", "C", 3), ("A", "D", 1), ("D", "C", 7), ("C", "E", 1), ("D", "E", 9)])


def test_konvergen_ke_jalur_terpendek(dv):
    sim = _sim(dv, *TOPO)
    _, konvergen, _ = sim.jalankan()
    assert konvergen
    assert sim.jalur("A", "E") == ["A", "B", "C", "E"] and sim.node["A"].biaya("E") == 6
    assert sim.jalur("D", "E") == ["D", "A", "B", "C", "E"] and sim.node["D"].biaya("E") == 7
    for x in TOPO[0]:
        for y in TOPO[0]:
            assert sim.node[x].biaya(y) == sim.node[y].biaya(x)   # tautan simetris


def test_berita_baik_cepat_menyebar(dv):
    sim = _sim(dv, *TOPO)
    sim.jalankan()
    sim.node["A"].hubungkan("E", 1)
    sim.node["E"].hubungkan("A", 1)
    ronde, konvergen, _ = sim.jalankan()
    assert konvergen and ronde <= 4
    assert sim.node["D"].biaya("E") == 2


LINIER = (["A", "B", "C"], [("A", "B", 1), ("B", "C", 1)])


def test_count_to_infinity_tanpa_pencegahan(dv):
    sim = _sim(dv, *LINIER)
    sim.jalankan()
    sim.putuskan("B", "C")
    ronde, konvergen, riwayat = sim.jalankan(amati=[("A", "C"), ("B", "C")])
    assert konvergen and ronde >= 12                       # menghitung pelan-pelan sampai 16
    biaya_a = [r["A->C"] for r in riwayat]
    assert biaya_a == sorted(biaya_a) and biaya_a[0] < 6 and biaya_a[-1] == INF
    assert sim.node["A"].biaya("C") == INF and sim.node["B"].biaya("C") == INF


@pytest.mark.parametrize("sh,pr", [(True, False), (False, True)])
def test_split_horizon_dan_poison_reverse_memperbaiki_kasus_linier(dv, sh, pr):
    sim = _sim(dv, *LINIER, sh=sh, pr=pr)
    sim.jalankan()
    sim.putuskan("B", "C")
    ronde, konvergen, riwayat = sim.jalankan(amati=[("A", "C")])
    assert konvergen and ronde <= 3
    assert all(r["A->C"] == INF for r in riwayat)


SEGITIGA = (["A", "B", "C", "D"], [("A", "B", 1), ("B", "C", 1), ("A", "C", 1), ("C", "D", 1)])


@pytest.mark.parametrize("sh,pr", [(False, False), (True, False), (False, True)])
def test_loop_tiga_node_tetap_menghitung_sampai_tak_hingga(dv, sh, pr):
    """Split horizon dan poison reverse hanya memutus loop DUA node. Pada segitiga
    A-B-C, rute palsu ke D berputar mengelilingi segitiga sampai biaya mencapai 16."""
    sim = _sim(dv, *SEGITIGA, sh=sh, pr=pr)
    sim.jalankan()
    sim.putuskan("C", "D")
    ronde, konvergen, riwayat = sim.jalankan(amati=[("A", "D"), ("B", "D"), ("C", "D")])
    assert konvergen and ronde >= 10
    maks_terbatas = max(v for r in riwayat for v in r.values() if v < INF)
    assert maks_terbatas >= 10                              # sempat "mengira" ada jalur sepanjang ini
    assert all(sim.node[n].biaya("D") == INF for n in "ABC")


def test_tak_hingga_lebih_kecil_mempercepat_konvergensi(dv):
    def ronde_dengan(tak_hingga):
        sim = SimulasiDV(*LINIER, lambda n: dv.NodeDV(n, tak_hingga=tak_hingga))
        sim.jalankan()
        sim.putuskan("B", "C")
        return sim.jalankan()[0]
    assert ronde_dengan(8) < ronde_dengan(16) < ronde_dengan(32)

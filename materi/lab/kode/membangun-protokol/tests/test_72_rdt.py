# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Uji Lab 7.2: Go-Back-N dan Selective Repeat di atas kanal rusak."""

import dataclasses
import random

import pytest

from umum.kanal import ProfilKanal, jalankan_di_udp, simulasikan

DATA = random.Random(2026).randbytes(60_000)
RUSAK = ProfilKanal(hilang=0.10, duplikat=0.05, korupsi=0.05, acak_urutan=0.10,
                    tunda=0.010, tunda_ekstra_maks=0.015, laju_bps=10e6)


def _gbn(rdt, data, jendela, **kw):
    ruang = kw.pop("ruang_seq", 256)
    return (rdt.PengirimGBN(data, jendela, ruang_seq=ruang, mss=kw.pop("mss", 1000), rto=kw.pop("rto", 0.1), **kw),
            rdt.PenerimaGBN(ruang_seq=ruang))


def _sr(rdt, data, jendela, periksa=True, **kw):
    ruang = kw.pop("ruang_seq", 256)
    return (rdt.PengirimSR(data, jendela, ruang_seq=ruang, mss=kw.pop("mss", 1000), rto=kw.pop("rto", 0.1), periksa=periksa),
            rdt.PenerimaSR(jendela, ruang_seq=ruang, periksa=periksa))


# --- paket dan checksum ---------------------------------------------------------

def test_paket_bolak_balik_dan_deteksi_korupsi(rdt):
    b = rdt.buat_paket(rdt.TIPE_DATA, 513, b"isi")
    p = rdt.urai_paket(b)
    assert (p.tipe, p.seq, p.muatan) == (rdt.TIPE_DATA, 513, b"isi")
    for i in range(len(b) * 8):                      # setiap 1-bit error harus terdeteksi
        rusak = bytearray(b)
        rusak[i // 8] ^= 1 << (i % 8)
        assert rdt.urai_paket(bytes(rusak)) is None
    assert rdt.urai_paket(b[:5]) is None


# --- batas jendela vs ruang nomor urut -----------------------------------------

@pytest.mark.parametrize("protokol,jendela,ruang,sah", [
    ("gbn", 7, 8, True), ("gbn", 8, 8, False),
    ("sr", 4, 8, True), ("sr", 5, 8, False),
    ("sr", 1, 2, True), ("gbn", 0, 8, False),
])
def test_periksa_jendela(rdt, protokol, jendela, ruang, sah):
    if sah:
        rdt.periksa_jendela(protokol, jendela, ruang)
    else:
        with pytest.raises(ValueError):
            rdt.periksa_jendela(protokol, jendela, ruang)


def test_konstruktor_menolak_jendela_terlalu_besar(rdt):
    with pytest.raises(ValueError):
        rdt.PengirimSR(b"x", 3, ruang_seq=4)
    with pytest.raises(ValueError):
        rdt.PengirimGBN(b"x", 4, ruang_seq=4)


def test_utilisasi_rumus(rdt):
    # Jakarta-Makassar: 1 Gbps, paket 1500 byte, RTT 20 ms
    u = rdt.utilisasi(1, 1500, 1e9, 0.020)
    assert u == pytest.approx(0.012e-3 / 20.012e-3)
    # BDP = 1 Gbps x 20 ms = 2,5 MB, kira-kira 1.668 paket: jendela 1.000 belum cukup.
    assert rdt.utilisasi(1000, 1500, 1e9, 0.020) == pytest.approx(0.5996, rel=1e-3)
    assert rdt.utilisasi(1700, 1500, 1e9, 0.020) == 1.0
    assert rdt.utilisasi(10, 1500, 1e9, 0.020) == pytest.approx(10 * u)


# --- kanal sempurna --------------------------------------------------------------

@pytest.mark.parametrize("buat", [_gbn, _sr])
def test_kanal_sempurna(rdt, buat):
    s, r = buat(rdt, DATA, 8)
    h = simulasikan(s, r, ProfilKanal(tunda=0.01, laju_bps=10e6), seed=1)
    assert h.selesai and h.data_diterima == DATA
    assert h.maju.dikirim == 60                     # tanpa retransmisi sama sekali


def test_data_kosong_langsung_selesai(rdt):
    s, r = _gbn(rdt, b"", 4)
    h = simulasikan(s, r, ProfilKanal())
    assert h.selesai and h.data_diterima == b""


def test_stop_and_wait_sesuai_rumus_utilisasi(rdt):
    """Jendela 1 = stop-and-wait. Goodput terukur harus cocok dengan rumus U x R."""
    prof = ProfilKanal(tunda=0.010, laju_bps=10e6)
    s, r = _gbn(rdt, DATA, 1)
    h = simulasikan(s, r, prof, seed=1, ukuran_data=len(DATA))
    assert h.data_diterima == DATA
    ukuran_paket = 1000 + 8
    teori = rdt.utilisasi(1, ukuran_paket, 10e6, 0.020) * 10e6 * 1000 / ukuran_paket
    assert h.goodput_bps == pytest.approx(teori, rel=0.02)


def test_pipelining_menaikkan_goodput(rdt):
    prof = ProfilKanal(tunda=0.010, laju_bps=10e6)
    goodput = []
    for w in (1, 4, 16):
        s, r = _gbn(rdt, DATA, w)
        goodput.append(simulasikan(s, r, prof, seed=1, ukuran_data=len(DATA)).goodput_bps)
    assert goodput[1] > 3.5 * goodput[0]
    assert goodput[2] > 3.0 * goodput[1]


# --- kanal rusak -----------------------------------------------------------------

@pytest.mark.parametrize("seed", range(5))
@pytest.mark.parametrize("buat", [_gbn, _sr])
def test_kanal_rusak_data_tetap_utuh(rdt, buat, seed):
    s, r = buat(rdt, DATA, 16)
    h = simulasikan(s, r, RUSAK, profil_balik=RUSAK, seed=seed)
    assert h.selesai, "transfer tidak selesai dalam batas waktu simulasi"
    assert h.data_diterima == DATA
    assert h.maju.hilang > 0 and h.maju.korupsi > 0 and h.maju.duplikat > 0 and h.maju.diacak > 0


def test_ruang_seq_kecil_benar_bila_kanal_fifo(rdt):
    """Aturan jendela vs ruang_seq hanya menjamin kebenaran bila kanal tidak mengacak urutan."""
    fifo = dataclasses.replace(RUSAK, acak_urutan=0.0)
    for seed in range(5):
        s, r = _gbn(rdt, DATA[:20_000], 7, ruang_seq=8)
        assert simulasikan(s, r, fifo, profil_balik=fifo, seed=seed).data_diterima == DATA[:20_000]
        s, r = _sr(rdt, DATA[:20_000], 4, ruang_seq=8)
        assert simulasikan(s, r, fifo, profil_balik=fifo, seed=seed).data_diterima == DATA[:20_000]


def test_pengacakan_urutan_butuh_ruang_seq_besar(rdt):
    """Dengan reordering, paket lama yang terlambat bisa muncul setelah nomor urut
    berputar. Ruang 8 nomor tidak cukup; ruang 256 nomor (jauh lebih lama berputar
    daripada tunda maksimum di kanal) aman. Ini alasan TCP memakai 32 bit dan MSL."""
    rusak_kecil = 0
    for seed in range(5):
        s, r = _gbn(rdt, DATA[:20_000], 7, ruang_seq=8)
        if simulasikan(s, r, RUSAK, profil_balik=RUSAK, seed=seed).data_diterima != DATA[:20_000]:
            rusak_kecil += 1
        s, r = _gbn(rdt, DATA[:20_000], 7, ruang_seq=256)
        assert simulasikan(s, r, RUSAK, profil_balik=RUSAK, seed=seed).data_diterima == DATA[:20_000]
    assert rusak_kecil >= 1


def test_sr_lebih_hemat_retransmisi_daripada_gbn(rdt):
    for seed in range(3):
        s1, r1 = _gbn(rdt, DATA, 32)
        h1 = simulasikan(s1, r1, RUSAK, profil_balik=RUSAK, seed=seed, ukuran_data=len(DATA))
        s2, r2 = _sr(rdt, DATA, 32)
        h2 = simulasikan(s2, r2, RUSAK, profil_balik=RUSAK, seed=seed, ukuran_data=len(DATA))
        assert h1.data_diterima == DATA and h2.data_diterima == DATA
        assert h2.maju.dikirim < 0.6 * h1.maju.dikirim
        assert h2.goodput_bps > h1.goodput_bps


def test_deterministik_untuk_seed_sama(rdt):
    hasil = []
    for _ in range(2):
        s, r = _sr(rdt, DATA, 16)
        h = simulasikan(s, r, RUSAK, profil_balik=RUSAK, seed=7)
        hasil.append((h.waktu, h.maju.dikirim, h.balik.dikirim))
    assert hasil[0] == hasil[1]


# --- jendela terlalu besar: kegagalan yang DIAM-DIAM ----------------------------

POTONGAN = b"AAAABBBBCCCCDDDDEEEEFFFFGGGGHHHH"


def test_sr_jendela_melebihi_setengah_ruang_seq_merusak_data(rdt):
    """ruang_seq 4, jendela 3. Tiga ACK pertama hilang; retransmisi paket lama 0 diterima
    penerima sebagai paket BARU bernomor 0 (yang seharusnya EEEE)."""
    s, r = _sr(rdt, POTONGAN, 3, periksa=False, ruang_seq=4, mss=4)
    h = simulasikan(s, r, ProfilKanal(tunda=0.01), aturan_balik=lambda i, p: i < 3)
    assert h.selesai                      # pengirim mengira semuanya beres...
    assert h.data_diterima != POTONGAN    # ...padahal data rusak
    assert h.data_diterima.startswith(b"AAAABBBBCCCCDDDDAAAA")


def test_sr_jendela_setengah_ruang_seq_aman(rdt):
    s, r = _sr(rdt, POTONGAN, 2, ruang_seq=4, mss=4)
    h = simulasikan(s, r, ProfilKanal(tunda=0.01), aturan_balik=lambda i, p: i < 2)
    assert h.data_diterima == POTONGAN


def test_gbn_jendela_sama_dengan_ruang_seq_menggandakan_data(rdt):
    s, r = _gbn(rdt, POTONGAN, 4, ruang_seq=4, mss=4, periksa=False)
    h = simulasikan(s, r, ProfilKanal(tunda=0.01), aturan_balik=lambda i, p: i < 4)
    assert h.data_diterima != POTONGAN
    assert h.data_diterima.startswith(b"AAAABBBBCCCCDDDDAAAA")


def test_gbn_jendela_ruang_seq_kurang_satu_aman(rdt):
    s, r = _gbn(rdt, POTONGAN, 3, ruang_seq=4, mss=4)
    h = simulasikan(s, r, ProfilKanal(tunda=0.01), aturan_balik=lambda i, p: i < 3)
    assert h.data_diterima == POTONGAN


# --- di atas socket UDP sungguhan ------------------------------------------------

@pytest.mark.parametrize("buat", [_gbn, _sr])
def test_di_atas_udp_sungguhan(rdt, buat):
    data = DATA[:30_000]
    prof = ProfilKanal(hilang=0.05, duplikat=0.02, korupsi=0.02, acak_urutan=0.05,
                       tunda=0.002, tunda_ekstra_maks=0.004)
    s, r = buat(rdt, data, 8, rto=0.03)
    h = jalankan_di_udp(s, r, prof, seed=3, batas_detik=20)
    assert h.selesai and h.data_diterima == data

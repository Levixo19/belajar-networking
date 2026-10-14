#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
"""Peluncur demo Lab 07. Contoh:

    python3 jalankan.py http example.com
    python3 jalankan.py rdt --hilang 0.05 --korupsi 0.01
    python3 jalankan.py rdt --udp
    python3 jalankan.py traceroute 1.1.1.1            # Linux tanpa root (IP_RECVERR)
    sudo python3 jalankan.py traceroute 1.1.1.1 --mode raw
    python3 jalankan.py traceroute --mode simulasi
    python3 jalankan.py dv --skenario segitiga --poison-reverse

Tambahkan --impl starter (sebelum nama subperintah) untuk menjalankan kode Anda sendiri.
"""

from __future__ import annotations

import argparse
import importlib
import random
import socket
import sys


def _impl(args, nama):
    return importlib.import_module(f"{args.impl}.{nama}")


def cmd_http(args):
    soket = _impl(args, "soket")
    r = soket.http_get(args.host, args.port, args.path)
    print(f"{r.versi} {r.status} {r.alasan}")
    for k, v in r.header.items():
        print(f"{k}: {v}")
    print(f"\n[{len(r.body)} byte body]")
    print(r.body[:300].decode("utf-8", "replace"))


def cmd_rdt(args):
    from umum.kanal import ProfilKanal, jalankan_di_udp, simulasikan
    rdt = _impl(args, "rdt")
    data = random.Random(args.seed).randbytes(args.ukuran)
    prof = ProfilKanal(hilang=args.hilang, duplikat=args.duplikat, korupsi=args.korupsi,
                       acak_urutan=args.acak, tunda=args.rtt / 2000, laju_bps=args.laju * 1e6)
    print(f"Data {args.ukuran} byte, RTT {args.rtt} ms, laju {args.laju} Mbps, "
          f"hilang {args.hilang}, duplikat {args.duplikat}, korupsi {args.korupsi}, acak {args.acak}")
    print(f"{'protokol':10} {'jendela':>7} {'teori U':>8} {'goodput':>12} {'paket':>7} {'retx':>6} {'benar':>6}")
    for nama in ("gbn", "sr"):
        for w in args.jendela:
            if nama == "gbn":
                s, r = rdt.PengirimGBN(data, w, mss=1000, rto=args.rto), rdt.PenerimaGBN()
            else:
                s, r = rdt.PengirimSR(data, w, mss=1000, rto=args.rto), rdt.PenerimaSR(w)
            if args.udp:
                h = jalankan_di_udp(s, r, ProfilKanal(hilang=args.hilang, duplikat=args.duplikat,
                                                      korupsi=args.korupsi, acak_urutan=args.acak,
                                                      tunda=args.rtt / 2000),
                                    seed=args.seed, batas_detik=60, ukuran_data=len(data))
            else:
                h = simulasikan(s, r, prof, profil_balik=prof, seed=args.seed, ukuran_data=len(data))
            u = rdt.utilisasi(w, 1008, args.laju * 1e6, args.rtt / 1000)
            label = "stop&wait" if (nama == "gbn" and w == 1) else nama.upper()
            print(f"{label:10} {w:>7} {u:>8.1%} {h.goodput_bps / 1e6:>8.3f} Mbps {s.paket_dikirim:>7} "
                  f"{s.retransmisi:>6} {str(h.data_diterima == data):>6}")


def cmd_traceroute(args):
    from umum.penjejak import HopSimulasi, PenjejakRaw, PenjejakRecverr, PenjejakSimulasi
    tr = _impl(args, "traceroute")
    if args.mode == "simulasi":
        tujuan = "203.0.113.5"
        p = PenjejakSimulasi([
            HopSimulasi("192.168.1.1", 1.2), HopSimulasi("10.20.0.1", 6.0), HopSimulasi(None),
            HopSimulasi(["103.28.0.1", "103.28.0.5"], 9.5), HopSimulasi("198.51.100.9", 21.0),
            HopSimulasi(tujuan, 22.0),
        ], tujuan, seed=args.seed, kebisingan=0.2)
    else:
        tujuan = socket.gethostbyname(args.tujuan)
        p = PenjejakRaw(tujuan) if args.mode == "raw" else PenjejakRecverr(tujuan)
    print(f"traceroute ke {args.tujuan or tujuan} ({tujuan}), maks {args.maks_hop} hop, mode {args.mode}")
    try:
        for hop in tr.traceroute(p, tujuan, maks_hop=args.maks_hop, timeout=args.timeout):
            print(tr.format_hop(hop))
    finally:
        p.tutup()


def cmd_dv(args):
    from umum.simdv import SimulasiDV
    dv = _impl(args, "dv")
    if args.skenario == "linier":
        node, tautan, putus, amati = ["A", "B", "C"], [("A", "B", 1), ("B", "C", 1)], ("B", "C"), \
            [("A", "C"), ("B", "C")]
    else:
        node, tautan, putus, amati = ["A", "B", "C", "D"], \
            [("A", "B", 1), ("B", "C", 1), ("A", "C", 1), ("C", "D", 1)], ("C", "D"), \
            [("A", "D"), ("B", "D"), ("C", "D")]
    sim = SimulasiDV(node, tautan, lambda n: dv.NodeDV(n, args.split_horizon, args.poison_reverse, args.tak_hingga))
    r, _, _ = sim.jalankan()
    print(f"Konvergen awal dalam {r} ronde:\n{sim.tabel_teks()}\n")
    print(f"Tautan {putus[0]}-{putus[1]} putus.")
    sim.putuskan(*putus)
    r, ok, riwayat = sim.jalankan(amati=amati)
    for i, baris in enumerate(riwayat, 1):
        print(f"ronde {i:2d}: " + "  ".join(f"{k}={'inf' if v >= args.tak_hingga else v}" for k, v in baris.items()))
    print(f"\n{'Konvergen' if ok else 'BELUM konvergen'} setelah {r} ronde:\n{sim.tabel_teks()}")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--impl", choices=["referensi", "starter"], default="referensi")
    sub = ap.add_subparsers(dest="cmd", required=True)

    h = sub.add_parser("http", help="GET HTTP/1.1 mentah")
    h.add_argument("host")
    h.add_argument("--port", type=int, default=80)
    h.add_argument("--path", default="/")
    h.set_defaults(f=cmd_http)

    r = sub.add_parser("rdt", help="ukur goodput stop-and-wait, GBN, SR")
    r.add_argument("--ukuran", type=int, default=300_000)
    r.add_argument("--rtt", type=float, default=20.0, help="ms")
    r.add_argument("--laju", type=float, default=10.0, help="Mbps")
    r.add_argument("--hilang", type=float, default=0.0)
    r.add_argument("--duplikat", type=float, default=0.0)
    r.add_argument("--korupsi", type=float, default=0.0)
    r.add_argument("--acak", type=float, default=0.0)
    r.add_argument("--rto", type=float, default=0.1)
    r.add_argument("--jendela", type=int, nargs="+", default=[1, 4, 16, 32, 64])
    r.add_argument("--seed", type=int, default=1)
    r.add_argument("--udp", action="store_true", help="pakai socket UDP sungguhan di 127.0.0.1")
    r.set_defaults(f=cmd_rdt)

    t = sub.add_parser("traceroute", help="traceroute buatan sendiri")
    t.add_argument("tujuan", nargs="?", default="")
    t.add_argument("--mode", choices=["recverr", "raw", "simulasi"], default="recverr")
    t.add_argument("--maks-hop", type=int, default=30)
    t.add_argument("--timeout", type=float, default=1.0)
    t.add_argument("--seed", type=int, default=1)
    t.set_defaults(f=cmd_traceroute)

    d = sub.add_parser("dv", help="simulasi distance-vector")
    d.add_argument("--skenario", choices=["linier", "segitiga"], default="linier")
    d.add_argument("--split-horizon", action="store_true")
    d.add_argument("--poison-reverse", action="store_true")
    d.add_argument("--tak-hingga", type=int, default=16)
    d.set_defaults(f=cmd_dv)

    args = ap.parse_args(argv)
    if args.cmd == "traceroute" and args.mode != "simulasi" and not args.tujuan:
        ap.error("traceroute butuh alamat tujuan (atau --mode simulasi)")
    args.f(args)


if __name__ == "__main__":
    sys.exit(main())

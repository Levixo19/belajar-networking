#!/bin/sh
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Uji TI-LFA di Lab 22.3a: putuskan link r1-r2 sambil ping loopback r2.
# Jalankan dari host setelah lab dideploy:  sudo sh uji-tilfa.sh
set -e
P=${LAB_PREFIX:-clab-sr-mpls}
v() { docker exec "$P-r1" vtysh -c "$1"; }

echo "== Sebelum gangguan: jalur utama dan backup TI-LFA ke r2 (10.0.0.2)"
v "show ip route 10.0.0.2/32"

echo "== Ping 500 paket (100 pps) dari loopback r1 ke r2, lalu putuskan eth1 di r1"
docker exec "$P-r1" sh -c 'ping -I 10.0.0.1 -i 0.01 -c 500 -q 10.0.0.2 > /tmp/ping.txt 2>&1 &'
sleep 1
docker exec "$P-r1" ip link set eth1 down
sleep 6
docker exec "$P-r1" tail -2 /tmp/ping.txt

echo "== Setelah konvergensi"
v "show isis route prefix-sid"

echo "== Pulihkan link"
docker exec "$P-r1" ip link set eth1 up
sleep 8
v "show isis neighbor"

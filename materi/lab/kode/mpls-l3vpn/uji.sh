#!/bin/sh
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Uji otomatis lab mpls-l3vpn. Jalankan setelah 'containerlab deploy'.
# Tunggu sekitar satu menit setelah deploy agar IS-IS, LDP, dan BGP konvergen.
# PREFIX bisa diganti bila nama kontainer Anda berbeda.

PREFIX=${PREFIX:-clab-mpls-l3vpn}
gagal=0

cek() { # deskripsi perintah...
    desc=$1; shift
    if "$@" >/dev/null 2>&1; then
        echo "LULUS  $desc"
    else
        echo "GAGAL  $desc"
        gagal=$((gagal + 1))
    fi
}

vty() { node=$1; shift; docker exec "$PREFIX-$node" vtysh -c "$*"; }

if [ ! -d /proc/sys/net/mpls ]; then
    echo "GAGAL  modul kernel mpls_router belum dimuat di host"
    echo "       jalankan: sudo modprobe mpls_router mpls_iptunnel"
    exit 1
fi

cek "p1 punya 2 tetangga LDP OPERATIONAL" \
    sh -c "[ \$(docker exec $PREFIX-p1 vtysh -c 'show mpls ldp neighbor' | grep -c OPERATIONAL) -eq 2 ]"
cek "pe1 punya label LDP untuk loopback pe2 (10.255.0.3/32)" \
    sh -c "docker exec $PREFIX-pe1 vtysh -c 'show mpls ldp binding' | grep '10.255.0.3/32' | grep -q yes"
cek "sesi VPNv4 pe1 <-> pe2 Established (kolom PfxRcd berupa angka)" \
    sh -c "docker exec $PREFIX-pe1 vtysh -c 'show bgp ipv4 vpn summary' | grep '^10.255.0.3' | awk '{print \$10}' | grep -Eq '^[0-9]+$'"
cek "VRF CUST-A di pe1 punya 192.168.2.0/24 berlabel" \
    sh -c "docker exec $PREFIX-pe1 vtysh -c 'show ip route vrf CUST-A 192.168.2.0/24' | grep -q label"
cek "VRF CUST-B di pe1 punya 192.168.2.0/24 berlabel" \
    sh -c "docker exec $PREFIX-pe1 vtysh -c 'show ip route vrf CUST-B 192.168.2.0/24' | grep -q label"
cek "p1 tidak punya rute pelanggan 192.168.0.0/16 (core bebas BGP)" \
    sh -c "! docker exec $PREFIX-p1 ip route | grep -q '^192\.168\.'"
cek "pelanggan A: ce1a 192.168.1.1 -> 192.168.2.1" \
    docker exec "$PREFIX-ce1a" ping -c 3 -W 1 -I 192.168.1.1 192.168.2.1
cek "pelanggan B: ce1b 192.168.1.1 -> 192.168.2.1" \
    docker exec "$PREFIX-ce1b" ping -c 3 -W 1 -I 192.168.1.1 192.168.2.1

echo
echo "Ringkasan label di pe1 (tabel MPLS FRR):"
vty pe1 "show mpls table"
echo "$gagal pemeriksaan gagal."
[ "$gagal" -eq 0 ]

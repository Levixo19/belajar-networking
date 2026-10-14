#!/bin/sh
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Pembungkus entrypoint untuk image quay.io/frrouting/frr di containerlab.
# Menunggu semua interface data (eth1..ethN) terpasang, menyetel sysctl
# MPLS/SRv6 di namespace jaringan kontainer, membuat VRF bila diminta,
# lalu menjalankan FRR seperti biasa.
#
# Variabel lingkungan (diset di file .clab.yml):
#   CLAB_INTFS  jumlah interface data (diisi otomatis oleh containerlab)
#   VRFS        daftar "nama:tabel:iface[,iface]" dipisah spasi, opsional
#   SRV6        "yes" untuk menyalakan seg6 dan membuat interface dummy sr0
#   DUMMIES     daftar nama interface dummy yang dibuat (mis. "cust0"), opsional

want=${CLAB_INTFS:-0}
i=0
while [ "$(ls /sys/class/net | grep -c '^eth[1-9]')" -lt "$want" ] && [ "$i" -lt 60 ]; do
    sleep 1
    i=$((i + 1))
done

sysctl -qw net.ipv4.ip_forward=1
sysctl -qw net.ipv6.conf.all.forwarding=1

# MPLS: tabel label kernel kosong (0) secara default; tanpa ini zebra gagal
# memasang LSP. Modul mpls_router harus sudah dimuat di host.
if [ -d /proc/sys/net/mpls ]; then
    sysctl -qw net.mpls.platform_labels=100000
    for f in /proc/sys/net/mpls/conf/*/input; do echo 1 > "$f"; done
else
    echo "PERINGATAN: /proc/sys/net/mpls tidak ada, jalankan 'sudo modprobe mpls_router mpls_iptunnel' di host" >&2
fi

if [ "$SRV6" = "yes" ]; then
    sysctl -qw net.ipv6.conf.all.seg6_enabled=1
    sysctl -qw net.ipv6.conf.default.seg6_enabled=1
    for f in /proc/sys/net/ipv6/conf/*/seg6_enabled; do echo 1 > "$f"; done
    sysctl -qw net.vrf.strict_mode=1 2>/dev/null
    ip link add sr0 type dummy 2>/dev/null
    ip link set sr0 up
fi

for d in $DUMMIES; do
    ip link add "$d" type dummy
    ip link set "$d" up
done

for spec in $VRFS; do
    name=$(echo "$spec" | cut -d: -f1)
    table=$(echo "$spec" | cut -d: -f2)
    ifaces=$(echo "$spec" | cut -d: -f3 | tr ',' ' ')
    ip link add "$name" type vrf table "$table"
    ip link set "$name" up
    for ifc in $ifaces; do ip link set "$ifc" master "$name"; done
done

exec /usr/lib/frr/docker-start

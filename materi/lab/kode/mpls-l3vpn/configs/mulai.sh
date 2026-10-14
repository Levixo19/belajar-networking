#!/bin/sh
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Entrypoint node lab mpls-l3vpn (modul 22-service-provider/01 dan 02).
# Menunggu interface data terpasang, menyiapkan kernel (forwarding, MPLS,
# VRF, LAN tiruan), lalu menjalankan FRR seperti entrypoint asli image.
#
# Variabel lingkungan (diset di mpls-l3vpn.clab.yml):
#   CLAB_INTFS   jumlah interface data, diisi otomatis oleh containerlab
#   MPLS_IFACES  interface yang menerima paket berlabel, mis. "eth1 eth2"
#   VRFS         "nama:tabel:iface[,iface] ..." untuk router PE
#   LAN          "yes" untuk membuat interface dummy lan0 (LAN tiruan) di router CE

want=${CLAB_INTFS:-0}
i=0
while [ "$(ls /sys/class/net | grep -c '^eth[1-9]')" -lt "$want" ] && [ "$i" -lt 60 ]; do
    sleep 1
    i=$((i + 1))
done

sysctl -qw net.ipv4.ip_forward=1

if [ -n "$MPLS_IFACES" ]; then
    if [ -d /proc/sys/net/mpls ]; then
        # Ukuran tabel label kernel. Default 0 berarti kernel menolak semua label.
        sysctl -qw net.mpls.platform_labels=100000
        for ifc in $MPLS_IFACES; do
            sysctl -qw "net.mpls.conf.$ifc.input=1"
        done
    else
        echo "PERINGATAN: /proc/sys/net/mpls tidak ada." >&2
        echo "Jalankan di host: sudo modprobe mpls_router mpls_iptunnel" >&2
    fi
fi

for spec in $VRFS; do
    name=$(echo "$spec" | cut -d: -f1)
    table=$(echo "$spec" | cut -d: -f2)
    ifaces=$(echo "$spec" | cut -d: -f3 | tr ',' ' ')
    ip link add "$name" type vrf table "$table"
    ip link set "$name" up
    for ifc in $ifaces; do
        ip link set "$ifc" master "$name"
    done
done

if [ -n "$LAN" ]; then
    ip link add lan0 type dummy
    ip link set lan0 up
fi

exec /usr/lib/frr/docker-start

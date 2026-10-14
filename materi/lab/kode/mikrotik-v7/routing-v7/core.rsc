# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Lab 19.8 (routing-v7) - CORE: router inti ISP lokal (AS 64500).
# Peran: route reflector iBGP untuk BR1 dan BR2, gateway LAN pelanggan,
# dan titik policy routing untuk pelanggan korporat.
# Diuji pada RouterOS 7.24.5 (CHR). Memerlukan RouterOS 7.20 atau lebih baru.

/system identity set name=CORE

/ip address
add address=10.255.0.3/32 interface=lo comment="loopback CORE"
add address=10.0.13.2/30 interface=ether2 comment="ke BR1 jalur-1"
add address=10.0.31.2/30 interface=ether3 comment="ke BR1 jalur-2 (ECMP)"
add address=10.0.23.2/30 interface=ether4 comment="ke BR2"
add address=203.0.113.1/26 interface=ether5 comment="LAN pelanggan rumahan"
add address=203.0.113.65/26 interface=ether6 comment="LAN pelanggan korporat"

/routing ospf instance
add name=ospf-isp version=2 router-id=10.255.0.3
/routing ospf area
add name=backbone area-id=0.0.0.0 instance=ospf-isp
/routing ospf interface-template
add area=backbone interfaces=ether2,ether3,ether4 type=ptp cost=10 \
    auth=sha256 auth-id=1 auth-key=RahasiaOSPF2026
add area=backbone networks=10.255.0.3/32 passive
add area=backbone networks=203.0.113.0/24 passive

# --- iBGP: CORE sebagai route reflector ---
/routing bgp instance
add name=bgp-isp as=64500 router-id=10.255.0.3 cluster-id=10.255.0.3
/routing bgp connection
add name=rr-br1 instance=bgp-isp remote.address=10.255.0.1 remote.as=64500 \
    local.address=10.255.0.3 local.role=ibgp-rr
add name=rr-br2 instance=bgp-isp remote.address=10.255.0.2 remote.as=64500 \
    local.address=10.255.0.3 local.role=ibgp-rr

# --- Policy routing: pelanggan korporat diarahkan ke BR2 ---
/routing table
add name=via-upb fib
/ip route
add dst-address=0.0.0.0/0 gateway=10.255.0.2@main routing-table=via-upb \
    target-scope=20 check-gateway=ping comment="rekursif ke loopback BR2 lewat OSPF"
/routing rule
add dst-address=203.0.113.0/24 action=lookup-only-in-table table=main \
    comment="tujuan internal tetap memakai tabel main"
add dst-address=10.0.0.0/8 action=lookup-only-in-table table=main
add src-address=203.0.113.64/26 action=lookup table=via-upb \
    comment="pelanggan korporat keluar lewat BR2"

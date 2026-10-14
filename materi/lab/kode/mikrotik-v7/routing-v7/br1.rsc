# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Lab 19.8 (routing-v7) - BR1: border router ISP lokal (AS 64500) ke UPA.
# UPA adalah jalur utama: rute dari UPA diberi local-pref 200.
# Diuji pada RouterOS 7.24.5 (CHR). Memerlukan RouterOS 7.20 atau lebih baru karena memakai menu
# /routing bgp instance; role BGP (RFC 9234) ditegakkan penuh sejak 7.21.

/system identity set name=BR1

/ip address
add address=10.255.0.1/32 interface=lo comment="loopback BR1"
add address=198.18.0.2/30 interface=ether2 comment="eBGP ke UPA"
add address=10.0.13.1/30 interface=ether3 comment="ke CORE jalur-1"
add address=10.0.31.1/30 interface=ether4 comment="ke CORE jalur-2 (ECMP)"

# --- OSPF: hanya membawa loopback dan link infrastruktur ---
/routing ospf instance
add name=ospf-isp version=2 router-id=10.255.0.1
/routing ospf area
add name=backbone area-id=0.0.0.0 instance=ospf-isp
/routing ospf interface-template
add area=backbone interfaces=ether3,ether4 type=ptp cost=10 \
    auth=sha256 auth-id=1 auth-key=RahasiaOSPF2026
add area=backbone networks=10.255.0.1/32 passive

# --- Prefiks milik sendiri dan pull-up route ---
/ip firewall address-list
add list=prefiks-kita address=203.0.113.0/24
/ip route
add dst-address=203.0.113.0/24 blackhole comment="pull-up route agregat /24"

# --- Routing filter ---
/routing filter rule
add chain=bogon rule="if (dst in 0.0.0.0/8 || dst in 10.0.0.0/8 || dst in 100.64.0.0/10 || dst in 127.0.0.0/8) { reject }"
add chain=bogon rule="if (dst in 169.254.0.0/16 || dst in 172.16.0.0/12 || dst in 192.168.0.0/16 || dst in 198.18.0.0/15) { reject }"
add chain=bogon rule="if (dst in 224.0.0.0/3) { reject }"
add chain=bogon rule="if (dst in 203.0.113.0/24) { reject }"
add chain=bogon rule="return"
add chain=upa-masuk rule="jump bogon"
add chain=upa-masuk rule="if (dst-len > 24) { reject }"
add chain=upa-masuk rule="set bgp-local-pref 200; append bgp-communities 64500:101; accept"
add chain=upa-keluar rule="if (dst == 203.0.113.0/24) { accept }"
add chain=upa-keluar rule="reject"

# --- BGP ---
/routing bgp instance
add name=bgp-isp as=64500 router-id=10.255.0.1
/routing bgp connection
add name=upa instance=bgp-isp remote.address=198.18.0.1 remote.as=64501 \
    local.role=ebgp-customer input.filter=upa-masuk output.filter-chain=upa-keluar \
    output.network=prefiks-kita input.limit-process-routes-ipv4=10000
add name=ibgp-core instance=bgp-isp remote.address=10.255.0.3 remote.as=64500 \
    local.address=10.255.0.1 local.role=ibgp nexthop-choice=force-self \
    output.default-originate=if-installed

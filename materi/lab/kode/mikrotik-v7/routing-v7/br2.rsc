# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Lab 19.8 (routing-v7) - BR2: border router ISP lokal (AS 64500) ke UPB.
# UPB adalah jalur cadangan: AS kita muncul 3 kali di AS_PATH ke UPB
# (bgp-path-prepend 3 = total 3 kemunculan, bukan 3 tambahan).
# Pelanggan korporat 203.0.113.64/26 dipaksa keluar lewat UPB (policy routing).
# Diuji pada RouterOS 7.24.5 (CHR). Memerlukan RouterOS 7.20 atau lebih baru karena memakai menu
# /routing bgp instance; role BGP (RFC 9234) ditegakkan penuh sejak 7.21.

/system identity set name=BR2

/ip address
add address=10.255.0.2/32 interface=lo comment="loopback BR2"
add address=198.18.0.6/30 interface=ether2 comment="eBGP ke UPB"
add address=10.0.23.1/30 interface=ether3 comment="ke CORE"

/routing ospf instance
add name=ospf-isp version=2 router-id=10.255.0.2
/routing ospf area
add name=backbone area-id=0.0.0.0 instance=ospf-isp
/routing ospf interface-template
add area=backbone interfaces=ether3 type=ptp cost=10 \
    auth=sha256 auth-id=1 auth-key=RahasiaOSPF2026
add area=backbone networks=10.255.0.2/32 passive

/ip firewall address-list
add list=prefiks-kita address=203.0.113.0/24
/ip route
add dst-address=203.0.113.0/24 blackhole comment="pull-up route agregat /24"

/routing filter rule
add chain=bogon rule="if (dst in 0.0.0.0/8 || dst in 10.0.0.0/8 || dst in 100.64.0.0/10 || dst in 127.0.0.0/8) { reject }"
add chain=bogon rule="if (dst in 169.254.0.0/16 || dst in 172.16.0.0/12 || dst in 192.168.0.0/16 || dst in 198.18.0.0/15) { reject }"
add chain=bogon rule="if (dst in 224.0.0.0/3) { reject }"
add chain=bogon rule="if (dst in 203.0.113.0/24) { reject }"
add chain=bogon rule="return"
add chain=upb-masuk rule="jump bogon"
add chain=upb-masuk rule="if (dst-len > 24) { reject }"
add chain=upb-masuk rule="append bgp-communities 64500:102; accept"
add chain=upb-keluar rule="if (dst == 203.0.113.0/24) { set bgp-path-prepend 3; accept }"
add chain=upb-keluar rule="reject"

/routing bgp instance
add name=bgp-isp as=64500 router-id=10.255.0.2
/routing bgp connection
add name=upb instance=bgp-isp remote.address=198.18.0.5 remote.as=64502 \
    local.role=ebgp-customer input.filter=upb-masuk output.filter-chain=upb-keluar \
    output.network=prefiks-kita input.limit-process-routes-ipv4=10000
add name=ibgp-core instance=bgp-isp remote.address=10.255.0.3 remote.as=64500 \
    local.address=10.255.0.2 local.role=ibgp nexthop-choice=force-self \
    output.default-originate=if-installed

# --- Policy routing: pelanggan korporat keluar lewat UPB ---
/routing table
add name=via-upb fib
/ip route
add dst-address=0.0.0.0/0 gateway=198.18.0.5 routing-table=via-upb \
    check-gateway=ping comment="jalur khusus pelanggan korporat"
/routing rule
add dst-address=203.0.113.0/24 action=lookup-only-in-table table=main \
    comment="tujuan internal tetap memakai tabel main"
add dst-address=10.0.0.0/8 action=lookup-only-in-table table=main
add src-address=203.0.113.64/26 action=lookup table=via-upb \
    comment="pelanggan korporat keluar lewat UPB"

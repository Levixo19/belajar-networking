# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Lab 19.8 (routing-v7) - UPA: simulasi upstream/transit A, AS 64501.
# Diuji pada RouterOS 7.24.5 (CHR). Memerlukan RouterOS 7.20 atau lebih baru karena memakai menu
# /routing bgp instance; role BGP (RFC 9234) ditegakkan penuh sejak 7.21.

/system identity set name=UPA

/interface bridge
add name=konten comment="simulasi jaringan konten milik UPA"

/ip address
add address=10.255.10.1/32 interface=lo comment="router-id UPA"
add address=198.18.0.1/30 interface=ether2 comment="eBGP ke BR1 (ISP lokal, pelanggan)"
add address=198.18.0.9/30 interface=ether3 comment="eBGP ke UPB (peer)"
add address=198.51.100.1/24 interface=konten

/ip firewall address-list
add list=bgp-out address=198.51.100.0/24

/routing bgp instance
add name=bgp-upa as=64501 router-id=10.255.10.1

/routing filter rule
add chain=ke-pelanggan rule="accept"
add chain=ke-peer rule="if (dst == 0.0.0.0/0) { reject }"
add chain=ke-peer rule="accept"

/routing bgp connection
add name=ke-br1 instance=bgp-upa remote.address=198.18.0.2 remote.as=64500 \
    local.role=ebgp-provider output.network=bgp-out output.default-originate=always \
    output.filter-chain=ke-pelanggan
add name=ke-upb instance=bgp-upa remote.address=198.18.0.10 remote.as=64502 \
    local.role=ebgp-peer output.network=bgp-out output.filter-chain=ke-peer

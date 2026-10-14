# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Lab 19.8 (routing-v7) - UPB: simulasi upstream/transit B, AS 64502.
# Diuji pada RouterOS 7.24.5 (CHR). Memerlukan RouterOS 7.20 atau lebih baru karena memakai menu
# /routing bgp instance; role BGP (RFC 9234) ditegakkan penuh sejak 7.21.

/system identity set name=UPB

/interface bridge
add name=konten comment="simulasi jaringan konten milik UPB"

/ip address
add address=10.255.20.1/32 interface=lo comment="router-id UPB"
add address=198.18.0.5/30 interface=ether2 comment="eBGP ke BR2 (ISP lokal, pelanggan)"
add address=198.18.0.10/30 interface=ether3 comment="eBGP ke UPA (peer)"
add address=192.0.2.1/24 interface=konten

/ip firewall address-list
add list=bgp-out address=192.0.2.0/24

/routing bgp instance
add name=bgp-upb as=64502 router-id=10.255.20.1

/routing filter rule
add chain=ke-pelanggan rule="accept"
add chain=ke-peer rule="if (dst == 0.0.0.0/0) { reject }"
add chain=ke-peer rule="accept"

/routing bgp connection
add name=ke-br2 instance=bgp-upb remote.address=198.18.0.6 remote.as=64500 \
    local.role=ebgp-provider output.network=bgp-out output.default-originate=always \
    output.filter-chain=ke-pelanggan
add name=ke-upa instance=bgp-upb remote.address=198.18.0.9 remote.as=64501 \
    local.role=ebgp-peer output.network=bgp-out output.filter-chain=ke-peer

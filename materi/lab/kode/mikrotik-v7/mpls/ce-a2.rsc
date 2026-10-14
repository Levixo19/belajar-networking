# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Lab 19.9 (mpls) - CE-A2: router pelanggan A, kantor cabang, AS 65100
# (AS sama dengan kantor pusat, sehingga PE memakai as-override).
# Diuji pada RouterOS 7.24.5 (CHR). Memerlukan RouterOS 7.20 atau lebih baru.

/system identity set name=CE-A2

/ip address
add address=172.16.12.2/30 interface=ether2 comment="ke PE2"
add address=192.168.2.1/24 interface=ether3 comment="LAN kantor cabang"

/ip firewall address-list
add list=lan-kami address=192.168.2.0/24

/routing bgp instance
add name=bgp-ce as=65100 router-id=192.168.2.1
/routing bgp connection
add name=ke-pe2 instance=bgp-ce remote.address=172.16.12.1 remote.as=65000 \
    local.role=ebgp output.network=lan-kami

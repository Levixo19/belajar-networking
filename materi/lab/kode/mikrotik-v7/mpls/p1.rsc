# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Lab 19.9 (mpls) - P1: router inti (LSR) backbone ISP lokal AS 65000.
# P1 hanya menjalankan OSPF dan LDP. Tidak ada BGP di sini (inti "BGP-free").
# Diuji pada RouterOS 7.24.5 (CHR).

/system identity set name=P1

/interface ethernet
set [find default-name=ether2] mtu=1530 comment="ke PE1, MTU dinaikkan untuk label MPLS"
set [find default-name=ether3] mtu=1530 comment="ke PE2, MTU dinaikkan untuk label MPLS"

/ip address
add address=10.255.255.2/32 interface=lo comment="loopback P1 (LSR-ID)"
add address=10.1.12.2/30 interface=ether2
add address=10.1.23.1/30 interface=ether3

/routing ospf instance
add name=ospf-core version=2 router-id=10.255.255.2
/routing ospf area
add name=backbone area-id=0.0.0.0 instance=ospf-core
/routing ospf interface-template
add area=backbone interfaces=ether2,ether3 type=ptp cost=10
add area=backbone networks=10.255.255.2/32 passive

/mpls ldp
add afi=ip lsr-id=10.255.255.2 transport-addresses=10.255.255.2
/mpls ldp interface
add interface=ether2
add interface=ether3
/mpls ldp advertise-filter
add prefix=10.255.255.0/24 advertise=yes comment="label hanya untuk loopback"
add prefix=0.0.0.0/0 advertise=no

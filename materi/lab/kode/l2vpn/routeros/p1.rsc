# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
# p1: router P MikroTik RouterOS v7 (diuji di CHR 7.24.5). Hanya OSPF + LDP + BFD.
/system identity set name=p1
/ip address add address=10.255.0.10/32 interface=lo
/ip address add address=10.1.1.1/31 interface=ether2
/ip address add address=10.1.2.1/31 interface=ether3
/ip address add address=10.1.3.1/31 interface=ether4
/routing ospf instance add name=CORE router-id=10.255.0.10
/routing ospf area add name=backbone area-id=0.0.0.0 instance=CORE
/routing ospf interface-template add area=backbone interfaces=ether2,ether3,ether4 type=ptp use-bfd=yes
/routing ospf interface-template add area=backbone interfaces=lo passive
/routing bfd configuration add interfaces=ether2,ether3,ether4 min-rx=100ms min-tx=100ms multiplier=3
/mpls ldp add afi=ip lsr-id=10.255.0.10 transport-addresses=10.255.0.10
/mpls ldp interface add interface=ether2
/mpls ldp interface add interface=ether3
/mpls ldp interface add interface=ether4

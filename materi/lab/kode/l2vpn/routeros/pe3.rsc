# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
# pe3: PE MikroTik RouterOS v7 (diuji di CHR 7.24.5). Core OSPF + LDP + BFD,
# layanan VPLS berbasis LDP (RFC 4762) untuk pelanggan B, port pelanggan = ether3.
/system identity set name=pe3
/ip address add address=10.255.0.3/32 interface=lo
/ip address add address=10.1.3.0/31 interface=ether2
/routing ospf instance add name=CORE router-id=10.255.0.3
/routing ospf area add name=backbone area-id=0.0.0.0 instance=CORE
/routing ospf interface-template add area=backbone interfaces=ether2 type=ptp use-bfd=yes
/routing ospf interface-template add area=backbone interfaces=lo passive
/routing bfd configuration add interfaces=ether2 min-rx=100ms min-tx=100ms multiplier=3
/mpls ldp add afi=ip lsr-id=10.255.0.3 transport-addresses=10.255.0.3
/mpls ldp interface add interface=ether2
# Satu bridge = satu broadcast domain pelanggan (VSI)
/interface bridge add name=br-pelanggan-b protocol-mode=none
/interface bridge port add bridge=br-pelanggan-b interface=ether3
# Full mesh pseudowire. bridge-horizon=1 = split horizon: frame dari satu PW
# tidak diteruskan ke PW lain (horizon sama), hanya ke port lokal.
/interface vpls add name=vpls-ke-pe1 peer=10.255.0.1 vpls-id=65000:100 bridge=br-pelanggan-b bridge-horizon=1
/interface vpls add name=vpls-ke-pe2 peer=10.255.0.2 vpls-id=65000:100 bridge=br-pelanggan-b bridge-horizon=1

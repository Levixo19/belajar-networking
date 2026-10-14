# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Lab 19.9 (mpls) - PE2: provider edge backbone ISP lokal AS 65000.
# Cermin dari PE1. Lihat komentar di pe1.rsc.
# Diuji pada RouterOS 7.24.5 (CHR). Memerlukan RouterOS 7.20 atau lebih baru.

/system identity set name=PE2

/interface ethernet
set [find default-name=ether2] mtu=1530 comment="ke P1, MTU dinaikkan untuk label MPLS"

/interface bridge
add name=b-lan comment="LAN pelanggan B (simulasi, di dalam VRF)"
add name=br-vpls-c protocol-mode=none comment="VPLS LDP pelanggan C"
add name=br-vpls-d protocol-mode=none comment="VPLS BGP pelanggan D"

/ip address
add address=10.255.255.3/32 interface=lo comment="loopback PE2 (LSR-ID)"
add address=10.1.23.2/30 interface=ether2

/routing ospf instance
add name=ospf-core version=2 router-id=10.255.255.3
/routing ospf area
add name=backbone area-id=0.0.0.0 instance=ospf-core
/routing ospf interface-template
add area=backbone interfaces=ether2 type=ptp cost=10
add area=backbone networks=10.255.255.3/32 passive

/mpls ldp
add afi=ip lsr-id=10.255.255.3 transport-addresses=10.255.255.3
/mpls ldp interface
add interface=ether2
/mpls ldp advertise-filter
add prefix=10.255.255.0/24 advertise=yes comment="label hanya untuk loopback"
add prefix=0.0.0.0/0 advertise=no

/ip vrf
add name=pelanggan-a interfaces=ether3
add name=pelanggan-b interfaces=b-lan
/ip address
add address=172.16.12.1/30 interface=ether3 comment="PE-CE ke CE-A2"
add address=192.168.2.1/24 interface=b-lan comment="sengaja sama dengan LAN CE-A2"

/routing bgp instance
add name=bgp-sp as=65000 router-id=10.255.255.3
/routing bgp connection
add name=ibgp-pe1 instance=bgp-sp remote.address=10.255.255.1 remote.as=65000 \
    local.address=10.255.255.3 local.role=ibgp afi=vpnv4,l2vpn
add name=ce-a2 instance=bgp-sp vrf=pelanggan-a remote.address=172.16.12.2 \
    remote.as=65100 local.role=ebgp output.as-override=yes \
    output.redistribute=bgp-mpls-vpn
/routing bgp vpn
add name=vpn-a instance=bgp-sp vrf=pelanggan-a route-distinguisher=10.255.255.3:100 \
    import.route-targets=65000:100 export.route-targets=65000:100 \
    export.redistribute=connected,bgp label-allocation-policy=per-vrf
add name=vpn-b instance=bgp-sp vrf=pelanggan-b route-distinguisher=10.255.255.3:200 \
    import.route-targets=65000:200 export.route-targets=65000:200 \
    export.redistribute=connected label-allocation-policy=per-vrf

/interface vpls
add name=vpls-c-pe1 peer=10.255.255.1 vpls-id=65000:300 disabled=no
/interface bridge port
add bridge=br-vpls-c interface=ether4
add bridge=br-vpls-c interface=vpls-c-pe1 horizon=1

/interface bridge port
add bridge=br-vpls-d interface=ether5
/routing bgp vpls
add name=vpls-d bridge=br-vpls-d bridge-horizon=1 rd=10.255.255.3:400 site-id=2 \
    import-route-targets=65000:400 export-route-targets=65000:400

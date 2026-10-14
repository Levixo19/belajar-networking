# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Lab 19.9 (mpls) - PE1: provider edge backbone ISP lokal AS 65000.
# Layanan: L3VPN pelanggan-a (PE-CE eBGP), L3VPN pelanggan-b (alamat tumpang
# tindih), VPLS LDP pelanggan C, VPLS BGP pelanggan D.
# Diuji pada RouterOS 7.24.5 (CHR). Memerlukan RouterOS 7.20 atau lebih baru.

/system identity set name=PE1

/interface ethernet
set [find default-name=ether2] mtu=1530 comment="ke P1, MTU dinaikkan untuk label MPLS"

/interface bridge
add name=b-lan comment="LAN pelanggan B (simulasi, di dalam VRF)"
add name=br-vpls-c protocol-mode=none comment="VPLS LDP pelanggan C"
add name=br-vpls-d protocol-mode=none comment="VPLS BGP pelanggan D"

/ip address
add address=10.255.255.1/32 interface=lo comment="loopback PE1 (LSR-ID)"
add address=10.1.12.1/30 interface=ether2

# --- IGP inti ---
/routing ospf instance
add name=ospf-core version=2 router-id=10.255.255.1
/routing ospf area
add name=backbone area-id=0.0.0.0 instance=ospf-core
/routing ospf interface-template
add area=backbone interfaces=ether2 type=ptp cost=10
add area=backbone networks=10.255.255.1/32 passive

# --- LDP ---
/mpls ldp
add afi=ip lsr-id=10.255.255.1 transport-addresses=10.255.255.1
/mpls ldp interface
add interface=ether2
/mpls ldp advertise-filter
add prefix=10.255.255.0/24 advertise=yes comment="label hanya untuk loopback"
add prefix=0.0.0.0/0 advertise=no

# --- VRF ---
/ip vrf
add name=pelanggan-a interfaces=ether3
add name=pelanggan-b interfaces=b-lan
/ip address
add address=172.16.11.1/30 interface=ether3 comment="PE-CE ke CE-A1"
add address=192.168.1.1/24 interface=b-lan comment="sengaja sama dengan LAN CE-A1"

# --- BGP: iBGP VPNv4 dan L2VPN ke PE2, eBGP PE-CE di VRF ---
/routing bgp instance
add name=bgp-sp as=65000 router-id=10.255.255.1
/routing bgp connection
add name=ibgp-pe2 instance=bgp-sp remote.address=10.255.255.3 remote.as=65000 \
    local.address=10.255.255.1 local.role=ibgp afi=vpnv4,l2vpn
add name=ce-a1 instance=bgp-sp vrf=pelanggan-a remote.address=172.16.11.2 \
    remote.as=65100 local.role=ebgp output.as-override=yes \
    output.redistribute=bgp-mpls-vpn
/routing bgp vpn
add name=vpn-a instance=bgp-sp vrf=pelanggan-a route-distinguisher=10.255.255.1:100 \
    import.route-targets=65000:100 export.route-targets=65000:100 \
    export.redistribute=connected,bgp label-allocation-policy=per-vrf
add name=vpn-b instance=bgp-sp vrf=pelanggan-b route-distinguisher=10.255.255.1:200 \
    import.route-targets=65000:200 export.route-targets=65000:200 \
    export.redistribute=connected label-allocation-policy=per-vrf

# --- VPLS LDP (pelanggan C, port ether4) ---
/interface vpls
add name=vpls-c-pe2 peer=10.255.255.3 vpls-id=65000:300 disabled=no
/interface bridge port
add bridge=br-vpls-c interface=ether4
add bridge=br-vpls-c interface=vpls-c-pe2 horizon=1

# --- VPLS BGP (pelanggan D, port ether5) ---
/interface bridge port
add bridge=br-vpls-d interface=ether5
/routing bgp vpls
add name=vpls-d bridge=br-vpls-d bridge-horizon=1 rd=10.255.255.1:400 site-id=1 \
    import-route-targets=65000:400 export-route-targets=65000:400

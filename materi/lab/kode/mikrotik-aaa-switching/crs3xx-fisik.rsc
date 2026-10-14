# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Contoh konfigurasi untuk PERANGKAT FISIK CRS3xx (mis. CRS326-24G-2S+) di
# jaringan RT-RW Net. BELUM DIUJI: CHR tidak punya menu /interface ethernet switch,
# jadi bagian switch chip di bawah hanya bisa dicoba di perangkat sungguhan.
# Sintaks mengikuti help.mikrotik.com (Bridging and Switching, Marvell Prestera
# switch chip features, L3 Hardware Offloading). Terapkan lewat port manajemen
# atau Safe Mode, karena vlan-filtering dan perubahan switch chip bisa memutus akses.
#
# Peta port:
#   sfp-sfpplus1  uplink ke router PPPoE/Hotspot (trunk VLAN 10,20,99)
#   ether1-ether20 pelanggan (VLAN 10), saling diisolasi
#   ether21-ether22 AP hotspot (VLAN 20)
#   ether24       port manajemen/laptop teknisi (VLAN 99)

/interface bridge add name=bridge1 vlan-filtering=no protocol-mode=rstp igmp-snooping=yes
/interface bridge port
add bridge=bridge1 interface=sfp-sfpplus1 frame-types=admit-only-vlan-tagged
:for i from=1 to=20 do={
  /interface bridge port add bridge=bridge1 interface=("ether" . $i) pvid=10 \
      frame-types=admit-only-untagged-and-priority-tagged edge=yes bpdu-guard=yes
}
/interface bridge port add bridge=bridge1 interface=ether21 pvid=20 frame-types=admit-only-untagged-and-priority-tagged
/interface bridge port add bridge=bridge1 interface=ether22 pvid=20 frame-types=admit-only-untagged-and-priority-tagged
/interface bridge port add bridge=bridge1 interface=ether24 pvid=99 frame-types=admit-only-untagged-and-priority-tagged

/interface bridge vlan
add bridge=bridge1 vlan-ids=10 tagged=sfp-sfpplus1 \
    untagged=ether1,ether2,ether3,ether4,ether5,ether6,ether7,ether8,ether9,ether10,ether11,ether12,ether13,ether14,ether15,ether16,ether17,ether18,ether19,ether20
add bridge=bridge1 vlan-ids=20 tagged=sfp-sfpplus1 untagged=ether21,ether22
add bridge=bridge1 vlan-ids=99 tagged=bridge1,sfp-sfpplus1 untagged=ether24

/interface vlan add name=vlan99 interface=bridge1 vlan-id=99
/ip address add address=10.99.99.10/24 interface=vlan99

# Isolasi pelanggan di switch chip (private VLAN): port pelanggan hanya boleh
# meneruskan ke uplink. Ini pengganti "horizon" yang mematikan offload.
:for i from=1 to=20 do={
  /interface ethernet switch port-isolation set ("ether" . $i) forwarding-override=sfp-sfpplus1
}

# Storm control 1% untuk broadcast & unknown unicast di port pelanggan
:for i from=1 to=20 do={
  /interface ethernet switch port set ("ether" . $i) storm-rate=1 \
      limit-broadcasts=yes limit-unknown-unicasts=yes
}

# ACL di switch chip: blokir DHCP server liar dari port pelanggan (UDP src 67)
/interface ethernet switch rule
add switch=switch1 ports=ether1,ether2,ether3,ether4,ether5,ether6,ether7,ether8,ether9,ether10,ether11,ether12,ether13,ether14,ether15,ether16,ether17,ether18,ether19,ether20 \
    mac-protocol=ip protocol=udp src-port=67 new-dst-ports="" comment="drop rogue DHCP"

# Pembatas sederhana di hardware: AP hotspot maksimal 200 Mbps masuk
/interface ethernet switch port set ether21 ingress-rate=200M
/interface ethernet switch port set ether22 ingress-rate=200M

# Port mirroring ke laptop teknisi untuk troubleshooting (matikan setelah selesai)
# /interface ethernet switch set switch1 mirror-target=ether23
# /interface ethernet switch port set sfp-sfpplus1 mirror-ingress=yes mirror-egress=yes

# Terakhir: aktifkan VLAN filtering, lalu periksa flag H di /interface bridge port print
/interface bridge set bridge1 vlan-filtering=yes

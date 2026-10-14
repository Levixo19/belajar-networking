# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Node SW1 untuk lab switching 19.11 (versi "bisa jalan di CHR").
# Semua fitur di sini adalah fitur bridge RouterOS sehingga bisa diuji di CHR,
# tetapi di CHR semuanya diproses CPU (tidak ada switch chip, tidak ada flag H).
# ether2+ether3 = LACP ke switch lain, ether4 = access VLAN 10, ether5 = access VLAN 20.
# Diuji di CHR 7.24.5.

/system identity set name=SW1

# 1. Bonding LACP (di CRS3xx mode ini bisa di-offload ke switch chip)
/interface bonding add name=bond-uplink mode=802.3ad slaves=ether2,ether3 \
    lacp-rate=1sec transmit-hash-policy=layer-2-and-3

# 2. Bridge tunggal, vlan-filtering MATI dulu selama membangun
/interface bridge add name=br-core vlan-filtering=no protocol-mode=rstp igmp-snooping=yes

/interface bridge port
add bridge=br-core interface=bond-uplink frame-types=admit-only-vlan-tagged
add bridge=br-core interface=ether4 pvid=10 frame-types=admit-only-untagged-and-priority-tagged \
    edge=yes bpdu-guard=yes
add bridge=br-core interface=ether5 pvid=20 frame-types=admit-only-untagged-and-priority-tagged \
    edge=yes bpdu-guard=yes

/interface bridge vlan
add bridge=br-core vlan-ids=10 tagged=bond-uplink untagged=ether4
add bridge=br-core vlan-ids=20 tagged=bond-uplink untagged=ether5
add bridge=br-core vlan-ids=99 tagged=br-core,bond-uplink

# 3. VLAN manajemen 99 untuk akses switch
/interface vlan add name=vlan99-mgmt interface=br-core vlan-id=99
/ip address add address=10.99.99.1/24 interface=vlan99-mgmt

# 4. Baru aktifkan vlan-filtering setelah semua di atas benar
/interface bridge set br-core vlan-filtering=yes

# 5. MSTP hanya bisa dipilih bila vlan-filtering=yes (RouterOS menolak sebelumnya).
#    VLAN 10 lewat instance 1, VLAN 20 lewat instance 2 (root berbeda)
/interface bridge set br-core protocol-mode=mstp region-name=RTRW-CORE region-revision=1
/interface bridge msti
add bridge=br-core identifier=1 vlan-mapping=10 priority=0x1000
add bridge=br-core identifier=2 vlan-mapping=20 priority=0x2000

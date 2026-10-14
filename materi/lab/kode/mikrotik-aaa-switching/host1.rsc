# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
# Node HOST1: "PC" pengujian. ether2 ke access VLAN 10, ether3 ke access VLAN 20.
/system identity set name=HOST1
/ip address add address=10.10.10.11/24 interface=ether2
/ip address add address=10.20.20.11/24 interface=ether3

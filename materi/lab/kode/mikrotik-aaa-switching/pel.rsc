# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Node PEL: berperan sebagai pelanggan. ether2 = modem PPPoE rumah,
# ether3 = laptop di kafe (DHCP + login hotspot). Diuji di CHR 7.24.5.

/system identity set name=PEL
/interface pppoe-client add name=pppoe-budi interface=ether2 service-name=rtrw \
    user=budi password=BudiRumah-01 add-default-route=no disabled=no
/ip dhcp-client add interface=ether3 add-default-route=no disabled=no

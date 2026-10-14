# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Node NAS: PPPoE server (ether3) dan Hotspot (ether4), semua user
# diautentikasi ke User Manager di 10.99.0.2. Diuji di CHR 7.24.5.

/system identity set name=NAS
/ip address add address=10.99.0.1/30 interface=ether2 comment="link RADIUS ke UM"

# 1. Klien RADIUS. timeout 1s sesuai saran dokumentasi User Manager
/radius add address=10.99.0.2 secret="Lab-Rahasia-RADIUS-2026" \
    service=ppp,hotspot src-address=10.99.0.1 timeout=1s comment="UM"
# 2. Terima CoA/Disconnect. Samakan port dengan coa-port di User Manager
/radius incoming set accept=yes port=3799

# 3. PPPoE server
/ip pool add name=pool-pppoe ranges=100.64.10.2-100.64.10.254
/ppp profile add name=prof-pppoe local-address=100.64.10.1 \
    dns-server=1.1.1.1,8.8.8.8 change-tcp-mss=yes only-one=yes
/ppp aaa set use-radius=yes accounting=yes interim-update=5m
/interface pppoe-server server add service-name=rtrw interface=ether3 \
    default-profile=prof-pppoe authentication=chap,mschap2 \
    one-session-per-host=yes disabled=no

# 4. Hotspot kafe di ether4
/ip address add address=10.5.50.1/24 interface=ether4
/ip pool add name=pool-hs ranges=10.5.50.10-10.5.50.250
/ip dhcp-server add name=dhcp-hs interface=ether4 address-pool=pool-hs lease-time=1h
/ip dhcp-server network add address=10.5.50.0/24 gateway=10.5.50.1 dns-server=10.5.50.1
/ip dns set allow-remote-requests=yes
/ip hotspot profile add name=hsprof-kafe hotspot-address=10.5.50.1 \
    dns-name=login.kafe.test login-by=http-chap,http-pap \
    use-radius=yes radius-accounting=yes radius-interim-update=5m
/ip hotspot user profile add name=hsup-kafe shared-users=1 \
    rate-limit=1M/3M idle-timeout=10m
/ip hotspot add name=hs-kafe interface=ether4 address-pool=pool-hs \
    profile=hsprof-kafe disabled=no
# Perangkat kasir dilewatkan tanpa login (IP binding)
/ip hotspot ip-binding add mac-address=02:00:00:00:0a:01 type=bypassed comment="kasir"
# Halaman pembayaran boleh dibuka sebelum login
/ip hotspot walled-garden add dst-host=*.bayar.test action=allow

/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade comment="uplink lab"

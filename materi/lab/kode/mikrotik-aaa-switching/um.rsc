# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Node UM: server RADIUS (User Manager v7) untuk lab 19.10.
# Prasyarat: paket user-manager-<versi>.npk sudah terpasang (unggah lalu reboot).
# Diuji di CHR 7.24.5. Impor dengan: /import file-name=um.rsc verbose=yes

/system identity set name=UM
/ip address add address=10.99.0.2/30 interface=ether2 comment="link RADIUS ke NAS"

# 1. Aktifkan User Manager dan model profile/limitation
/user-manager set enabled=yes use-profiles=yes

# 2. Daftarkan NAS (router yang boleh bertanya ke server ini)
/user-manager router add name=nas-rtrw address=10.99.0.1 \
    shared-secret="Lab-Rahasia-RADIUS-2026" coa-port=3799

# 3. Limitation: "aturan main" yang bisa dipakai ulang
/user-manager limitation
add name=lim-10m rate-limit-rx=3M rate-limit-tx=10M comment="PPPoE 10 Mbps"
add name=lim-voucher rate-limit-rx=1M rate-limit-tx=3M uptime-limit=2h \
    comment="voucher kafe 2 jam"
add name=lim-kuota-harian download-limit=2000000000 reset-counters-interval=daily \
    reset-counters-start-time="2026-01-01 00:00:00" comment="FUP 2 GB per hari"

# 4. Profile: "produk" yang dijual
/user-manager profile
add name=paket-10m name-for-users="Paket Rumah 10 Mbps" validity=30d \
    starts-when=assigned price=150000
add name=voucher-2jam name-for-users="Voucher 2 jam" validity=1d \
    starts-when=first-auth price=3000

# 5. Hubungkan profile dengan limitation
/user-manager profile-limitation
add profile=paket-10m limitation=lim-10m
add profile=paket-10m limitation=lim-kuota-harian
add profile=voucher-2jam limitation=lim-voucher

# 6. Group: atribut bersama. Mikrotik-Group memilih profil lokal di NAS.
/user-manager user group
add name=grp-pppoe outer-auths=pap,chap,mschap1,mschap2 \
    attributes=Framed-Pool:pool-pppoe
add name=grp-hotspot outer-auths=pap,chap attributes=Mikrotik-Group:hsup-kafe

# 7. Pelanggan PPPoE dan voucher hotspot
/user-manager user
add name=budi password=BudiRumah-01 group=grp-pppoe shared-users=1 comment="RT 03 rumah no 12"
add name=v001 password=kopi123 group=grp-hotspot shared-users=1 comment="voucher kafe"
/user-manager user-profile
add user=budi profile=paket-10m
add user=v001 profile=voucher-2jam

#!/bin/sh
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Uji konfigurasi FreeRADIUS di kontainer Alpine sekali pakai.
# Jalankan dari direktori ini:  sh uji-freeradius.sh
# Butuh podman atau docker. Diuji dengan FreeRADIUS 3.0.27 (Alpine 3.20).
set -e
ENGINE=${ENGINE:-podman}
$ENGINE run --rm -v "$PWD":/lab:Z docker.io/library/alpine:3.20 sh -c '
apk add -q freeradius freeradius-utils >/dev/null
cat /lab/clients-lab.conf >> /etc/raddb/clients.conf
# klien localhost bawaan dipakai radtest; samakan secret-nya untuk uji
sed -i "s/secret = testing123/secret = Lab-Rahasia-RADIUS-2026/" /etc/raddb/clients.conf
cat /lab/authorize-lab /etc/raddb/mods-config/files/authorize > /tmp/a
cp /tmp/a /etc/raddb/mods-config/files/authorize
radiusd -XC 2>&1 | tail -1
radiusd -f -l stdout >/tmp/radiusd.log 2>&1 &
sleep 3
echo "== PAP benar (harus Access-Accept + Mikrotik-Rate-Limit)"
radtest -t pap budi BudiRumah-01 127.0.0.1 0 Lab-Rahasia-RADIUS-2026 | grep -A4 Received
echo "== CHAP voucher (harus Access-Accept + Mikrotik-Group)"
radtest -t chap v002 teh456 127.0.0.1 0 Lab-Rahasia-RADIUS-2026 | grep -A3 Received
echo "== Password salah (harus Access-Reject)"
radtest budi salah 127.0.0.1 0 Lab-Rahasia-RADIUS-2026 | grep Received || true
'

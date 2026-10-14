# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Image route server untuk lab interkoneksi (modul 07-routing-lanjutan/11).
# BIRD 2 dari repositori Alpine 3.22 (paket bird2, versi 2.17.x).
# Bangun sekali sebelum deploy:
#   docker build -t lab-bird:2 rs/
FROM alpine:3.22
RUN apk add --no-cache bird2 iproute2 iputils
# -f: tetap di foreground (wajib untuk container), -c: berkas konfigurasi.
CMD ["bird", "-f", "-c", "/etc/bird/bird.conf", "-s", "/run/bird.ctl"]

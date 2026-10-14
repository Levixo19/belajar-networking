#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Alternatif tanpa containerlab: membangun topologi yang sama dengan jaringan
# bridge Docker biasa (cukup akun yang ada di grup "docker", tanpa sudo).
# Nama container sengaja sama dengan versi containerlab (clab-ixp-*), jadi
# semua perintah di modul berlaku untuk keduanya. Jangan jalankan keduanya
# bersamaan.
#
#   ./uji-tanpa-clab.sh up      # bangun dan jalankan
#   ./uji-tanpa-clab.sh down    # bongkar
set -euo pipefail
cd "$(dirname "$0")"

FRR_IMG=quay.io/frrouting/frr:10.4.1
RTR_IMG=rpki/stayrtr:v0.6.4
BIRD_IMG=lab-bird:2

up() {
  docker image inspect "$BIRD_IMG" >/dev/null 2>&1 || docker build -t "$BIRD_IMG" rs/

  # Docker memakai alamat .1 sebagai gateway setiap jaringan; lab tidak memakainya.
  docker network create --subnet 10.10.0.0/24 ixp-lan        >/dev/null
  docker network create --subnet 10.20.0.0/29 ixp-rpki-rs    >/dev/null
  docker network create --subnet 10.20.1.0/29 ixp-rpki-isp-a >/dev/null

  # label=disable: di host ber-SELinux (Fedora/RHEL) berkas bind-mount
  # tidak bisa dibaca container tanpa opsi ini atau relabel ":z".
  docker run -d --name clab-ixp-rpki --network ixp-rpki-rs --ip 10.20.0.3 \
    --security-opt label=disable \
    -v "$PWD/rpki:/data:ro" \
    "$RTR_IMG" -cache /data/vrps.json -checktime=false -refresh 10 -bind :8282 >/dev/null
  docker network connect --ip 10.20.1.3 ixp-rpki-isp-a clab-ixp-rpki

  docker run -d --name clab-ixp-rs --network ixp-lan --ip 10.10.0.10 \
    --security-opt label=disable \
    -v "$PWD/rs/bird.conf:/etc/bird/bird.conf:ro" "$BIRD_IMG" >/dev/null
  docker network connect --ip 10.20.0.2 ixp-rpki-rs clab-ixp-rs

  for n in a b; do
    ip_lan=10.10.0.1$([ "$n" = a ] && echo 1 || echo 2)
    docker run -d --name "clab-ixp-isp-$n" --privileged \
      --sysctl net.ipv4.ip_forward=1 \
      --network ixp-lan --ip "$ip_lan" \
      -v "$PWD/daemons:/etc/frr/daemons:ro" \
      -v "$PWD/vtysh.conf:/etc/frr/vtysh.conf:ro" \
      -v "$PWD/isp-$n/frr.conf:/etc/frr/frr.conf" \
      "$FRR_IMG" >/dev/null
  done
  docker network connect --ip 10.20.1.2 ixp-rpki-isp-a clab-ixp-isp-a
  echo "Lab berjalan. Tunggu 30-60 detik sampai sesi BGP dan RTR terbentuk."
}

down() {
  docker rm -f clab-ixp-rpki clab-ixp-rs clab-ixp-isp-a clab-ixp-isp-b >/dev/null 2>&1 || true
  docker network rm ixp-lan ixp-rpki-rs ixp-rpki-isp-a >/dev/null 2>&1 || true
  echo "Lab dibongkar."
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  *) echo "Pakai: $0 up|down" >&2; exit 1 ;;
esac

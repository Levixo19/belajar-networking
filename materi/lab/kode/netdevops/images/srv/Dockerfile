# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
#
# Server lab: network-multitool (MIT, srl-labs) sudah menjalankan nginx (80/443)
# dan dropbear SSH (22). Kita hanya menambah iptables agar firewall host bisa
# dikelola dari policy/firewall.yml.
#
# docker build -t netdevops/srv:local images/srv
FROM ghcr.io/srl-labs/network-multitool:v0.10.0
RUN apk add --no-cache iptables

# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
# Varian BGP-signaled VPLS (RFC 4761) untuk pe1 (diuji di CHR 7.24.5).
# Ulangi di pe2/pe3 dengan router-id, rd, site-id, dan daftar peer yang sesuai.
# Nonaktifkan dulu PW LDP agar tidak ada dua jalur ke pelanggan yang sama.
/interface vpls disable [find]
/routing bgp instance add name=bgp-core as=65000 router-id=10.255.0.1
/routing bgp connection add name=ibgp-pe2 instance=bgp-core remote.address=10.255.0.2 remote.as=65000 local.address=10.255.0.1 local.role=ibgp afi=l2vpn
/routing bgp connection add name=ibgp-pe3 instance=bgp-core remote.address=10.255.0.3 remote.as=65000 local.address=10.255.0.1 local.role=ibgp afi=l2vpn
/routing bgp vpls add name=pelanggan-b-bgp bridge=br-pelanggan-b bridge-horizon=1 rd=10.255.0.1:100 import-route-targets=65000:100 export-route-targets=65000:100 site-id=1

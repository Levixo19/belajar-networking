# SPDX-License-Identifier: MIT
# Copyright (c) 2026 Kontributor Belajar Networking
# ce1: perangkat pelanggan. IP dipasang di bridge dengan admin-mac unik karena
# VM CHR yang dijalankan QEMU tanpa opsi mac= mendapat MAC ethernet yang SAMA
# di setiap VM; dalam satu domain L2 hal itu membuat ARP gagal.
/system identity set name=ce1
/interface bridge add name=br-ce auto-mac=no admin-mac=02:00:00:00:0C:01 protocol-mode=none
/interface bridge port add bridge=br-ce interface=ether2
/ip address add address=192.168.100.1/24 interface=br-ce

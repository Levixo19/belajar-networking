# Kerangka kurikulum saat ini (judul modul dan subbab ##)

## 00-fondasi
- 00-fondasi/01-apa-itu-jaringan :: 00.1 — Apa Itu Jaringan Komputer
    Analogi: Jaringan Itu Sistem Pos | Definisi Formal | Mengapa Jaringan Dibuat: 5 Alasan Historis yang Masih Berlaku | Kosakata Dasar (Wajib Hafal) | Dua Model Komunikasi | Skala Jaringan | Istilah Berbasis Kepemilikan & Akses | Peran Perangkat Jaringan | PoE — Power over Ethernet | Kategori Lingkungan Jaringan | Praktik Pertama Anda
- 00-fondasi/02-bit-byte-biner :: 00.2 — Bit, Byte, Biner, dan Heksadesimal
    Kenapa Harus Biner? | Satuan Data | Sistem Bilangan | Konversi — Metode yang Dipakai Praktisi | Pangkat Dua — Tabel Wajib | Operasi Bitwise — Inti Subnetting | Bagaimana Bit Menjadi "Data" | Kesalahan Umum
- 00-fondasi/03-sinyal-bandwidth-latency :: 00.3 — Sinyal, Bandwidth, Latency, dan Metrik Kinerja
    Dari Bit ke Sinyal | Bandwidth, Throughput, Goodput | Latency dan Empat Komponennya | RTT, Jitter, Packet Loss | Bandwidth-Delay Product (BDP) — Konsep Penting yang Sering Dilewatkan | Duplex | Menghitung Waktu Transfer | MTU — Sekilas | Praktik | Kesalahan Umum
- 00-fondasi/04-sejarah-dan-standar :: 00.4 — Sejarah Internet dan Badan Standar
    Garis Waktu Singkat | Siapa yang Mengatur Internet? | RFC — Cara Membaca Standar Internet | Bagaimana Internet Terhubung Secara Ekonomi | Bagaimana Standar Baru Lahir (Studi Kasus: QUIC) | Praktik
- 00-fondasi/05-topologi :: 00.5 — Topologi Jaringan
    Topologi Fisik vs Topologi Logis | Topologi Dasar | Topologi Arsitektural (Yang Diuji di CCNA) | Redundansi dan Failure Domain | Memilih Topologi: Panduan Praktis | Praktik: Baca Topologi dari Jaringan Nyata | Kesalahan Umum

## 01-model-referensi
- 01-model-referensi/01-osi :: 01.1 — Model OSI
    Kenapa Ada Model Berlayer? | Tujuh Layer OSI | Layer 1 — Physical | Layer 2 — Data Link | Layer 3 — Network | Layer 4 — Transport | Layer 5 — Session | Layer 6 — Presentation | Layer 7 — Application | Perangkat Beroperasi di Layer Berapa? | OSI Sebagai Alat Troubleshooting | Batasan Model OSI di Dunia Nyata | Praktik: Melihat Semua Layer Sekaligus | Kesalahan Umum
- 01-model-referensi/02-tcp-ip :: 01.2 — Model TCP/IP
    Kenapa Ada Dua Model? | Model TCP/IP — Versi 4 Layer | Model TCP/IP — Versi 5 Layer (Hybrid) | Layer Demi Layer (TCP/IP) | Kenapa TCP/IP Menang | Hourglass Model | Istilah: Kapan Memakai Model Mana | Praktik: Melihat Kedua Model dalam Satu Paket | Kesalahan Umum
- 01-model-referensi/03-enkapsulasi :: 01.3 — Enkapsulasi dan Perjalanan Sebuah Paket
    Enkapsulasi: Amplop di Dalam Amplop | Proses Enkapsulasi di Pengirim | Dekapsulasi di Penerima | Yang Berubah dan Tidak Berubah di Setiap Hop | Perjalanan Lengkap: Mengetik `https://example.com` | Hitungan Waktu Nyata | Enkapsulasi Bertingkat (Tunneling) | Praktik: Buktikan Sendiri | Kesalahan Umum

## 02-layer-fisik
- 02-layer-fisik/01-media-transmisi :: 02.1 — Media Transmisi dan Gangguan Sinyal
    Tiga Jenis Media | Musuh Sinyal | SNR — Rasio Sinyal terhadap Derau | Desibel (dB) — Wajib Dipahami | Simplex, Half Duplex, Full Duplex | Baseband vs Broadband (Ulasan) | Membaca Nama Standar Ethernet | Praktik | Kesalahan Umum
- 02-layer-fisik/02-kabel-copper :: 02.2 — Kabel Tembaga: UTP, Kategori, Pinout, dan PoE
    Anatomi Kabel Twisted Pair | Jenis Pelindung (Shielding) | Kategori Kabel | Pinout: T568A dan T568B | Membuat dan Menguji Kabel | PoE — Power over Ethernet | Kabel Coaxial dan DAC | Kabel Terstruktur (Structured Cabling) | Praktik & Diagnosis
- 02-layer-fisik/03-fiber :: 02.3 — Serat Optik
    Cara Serat Optik Bekerja | Single-Mode vs Multimode | Konektor | Transceiver (Optik yang Dapat Dilepas) | Power Budget Optik — Perhitungan Wajib | Kebersihan Serat — Hal yang Paling Sering Diabaikan | Splicing dan Terminasi | WDM — Banyak Sinyal dalam Satu Serat | Troubleshooting Link Fiber
- 02-layer-fisik/04-encoding-modulasi :: 02.4 — Encoding dan Modulasi
    Masalah Dasar: Bagaimana Penerima Tahu Batas Antar-Bit? | Skema Encoding Dasar | Block Coding — Solusi Modern | Multi-Level Signaling — Lebih Banyak Bit per Simbol | Modulasi untuk Nirkabel | FEC — Forward Error Correction | Auto-Negotiation | Rangkuman Encoding per Standar | Praktik | Kesalahan Umum

## 03-data-link
- 03-data-link/01-ethernet-frame-mac :: 03.1 — Ethernet: Frame, MAC Address, dan Error
    Kenapa Ethernet Menang | Struktur Frame Ethernet | MAC Address | MTU dan Jumbo Frame | CSMA/CD dan Collision Domain | Duplex Mismatch — Diagnosis Lengkap | Membaca Interface Counters | Flow Control (Pause Frame) | MikroTik RouterOS
- 03-data-link/02-switching :: 03.2 — Cara Kerja Switch
    Lima Fungsi Dasar Switch | MAC Address Table (CAM Table) | Proses Forwarding Langkah demi Langkah | Aging | MAC Move dan MAC Flapping | Metode Switching | Arsitektur Hardware Switch | Layer 2 vs Layer 3 Switch | Praktik Lengkap | Kesalahan Umum | MikroTik RouterOS
- 03-data-link/03-vlan :: 03.3 — VLAN
    Masalah yang Dipecahkan VLAN | Jenis Port | 802.1Q — Tagging | Default VLAN, Native VLAN, Management VLAN | DTP — Dynamic Trunking Protocol | Inter-VLAN Routing | VTP — VLAN Trunking Protocol | Private VLAN (PVLAN) | Perintah Verifikasi & Troubleshooting | Desain VLAN yang Baik | Kesalahan Umum | MikroTik RouterOS
- 03-data-link/04-stp :: 03.4 — Spanning Tree Protocol (STP)
    Kenapa Loop Layer 2 Sangat Fatal | Ide Dasar STP | Empat Langkah Algoritma STP | Contoh Lengkap | Port State dan Timer (802.1D Klasik) | BPDU | RSTP — 802.1w | Varian STP | Fitur Perlindungan STP | Verifikasi dan Troubleshooting | Alternatif Modern untuk STP | MikroTik RouterOS
- 03-data-link/05-etherchannel :: 03.5 — EtherChannel / Link Aggregation
    Masalah yang Dipecahkan | Batasan Penting: Satu Aliran = Satu Link | Load Balancing Hash | Protokol Negosiasi | Syarat Konsistensi | Layer 2 vs Layer 3 EtherChannel | Verifikasi | Troubleshooting | MLAG / vPC / VSS / Stacking — Agregasi Lintas Chassis | Bonding di Linux | MikroTik RouterOS
- 03-data-link/06-discovery-dan-l2-lain :: 03.6 — CDP, LLDP, dan Protokol Layer 2 Lainnya
    CDP — Cisco Discovery Protocol | LLDP — Link Layer Discovery Protocol (IEEE 802.1AB) | PPP — Point-to-Point Protocol | Frame Relay dan ATM (Konteks Historis) | Protokol L2 Lain yang Perlu Dikenal | Praktik: Memetakan Jaringan dari Nol | MikroTik RouterOS

## 04-network-layer
- 04-network-layer/01-ipv4 :: 04.1 — IPv4: Alamat dan Header
    Kenapa Butuh Alamat Layer 3? | Struktur Alamat IPv4 | Tiga Alamat Khusus dalam Setiap Jaringan | Kelas Alamat (Classful) — Konteks Historis | Alamat Khusus dan Reserved | Jenis Komunikasi | Header IPv4 — Field demi Field | Praktik | Kesalahan Umum
- 04-network-layer/02-subnetting :: 04.2 — Subnetting
    Kenapa Subnetting | Cara Kerja: Meminjam Bit Host | Metode Magic Number (Cara Cepat) | Tabel Referensi yang Wajib Hafal | Menentukan Apakah Dua IP Satu Subnet | Menghitung Subnet ke-N | Menentukan Prefix dari Kebutuhan Host | Verifikasi dengan Alat | Kesalahan Umum
- 04-network-layer/03-vlsm-cidr :: 04.3 — VLSM, CIDR, Summarization, dan Wildcard Mask
    VLSM — Variable Length Subnet Mask | Aturan Emas VLSM: Alokasikan dari Besar ke Kecil | CIDR dan Summarization | Wildcard Mask | /30 vs /31 untuk Link Point-to-Point | Praktik | Kesalahan Umum
- 04-network-layer/04-arp-icmp :: 04.4 — ARP dan ICMP
    ARP — Address Resolution Protocol | ICMP — Internet Control Message Protocol | Ping — Cara Kerja Sesungguhnya | Traceroute — Cara Kerja Sesungguhnya | Path MTU Discovery | ICMP dan Keamanan | Praktik | Kesalahan Umum | MikroTik RouterOS
- 04-network-layer/05-routing-dasar :: 04.5 — Routing: Konsep Dasar
    Apa yang Dilakukan Router | Routing Table | Longest Prefix Match — Aturan Nomor Satu | Administrative Distance (AD) | Metric | Jenis-Jenis Rute | Static Route dengan Next Hop vs Exit Interface | Control Plane, Data Plane, Management Plane | Routing vs Switching vs Bridging | Masalah Routing yang Umum | Load Balancing | Praktik | Kesalahan Umum | MikroTik RouterOS

## 05-transport
- 05-transport/01-port-socket :: 05.1 — Port dan Socket
    Masalah yang Dipecahkan Layer 4 | Port Number | Socket dan 5-Tuple | Bagaimana Klien Memilih Port Sumber | Daftar Port yang Wajib Hafal | Membaca `ss` dan `netstat` | Menguji Port | Port Sumber dalam Praktik | Kesalahan Umum
- 05-transport/02-tcp :: 05.2 — TCP
    Apa yang Dijamin TCP | Header TCP | Three-Way Handshake | Transfer Data | Flow Control — Sliding Window | Retransmisi | Menutup Koneksi | State Machine TCP | MSS dan Interaksi dengan MTU | Analisis TCP di Wireshark | Tuning TCP di Linux
- 05-transport/03-udp-quic :: 05.3 — UDP dan QUIC
    UDP — User Datagram Protocol | Bahaya UDP: Amplification Attack | QUIC — Transport Modern | HTTP/3 | Praktik | Kapan Memilih Apa
- 05-transport/04-congestion-control :: 05.4 — Congestion Control, MTU, dan Bufferbloat
    Congestion Collapse — Masalah yang Harus Dicegah | Flow Control vs Congestion Control | Algoritma Klasik: Slow Start dan Congestion Avoidance | Reaksi terhadap Loss | ECN — Explicit Congestion Notification | Bufferbloat | MTU dan MSS — Masalah Praktis Terbesar | Praktik: Mengukur dan Menyetel | Kesalahan Umum

## 06-aplikasi
- 06-aplikasi/01-dns :: 06.1 — DNS
    Masalah yang Dipecahkan DNS | Struktur Namespace | Jenis Server DNS | Alur Resolusi Lengkap | Resource Record (RR) | Zone Transfer | DNSSEC | DNS Terenkripsi | `dig` — Alat Diagnostik DNS Utama | Membangun DNS Resolver Sendiri | Pola DNS Lanjutan | Troubleshooting DNS | MikroTik RouterOS
- 06-aplikasi/02-dhcp :: 06.2 — DHCP
    Masalah yang Dipecahkan | DORA — Empat Langkah | Lease dan Pembaruan | Opsi DHCP | DHCP Relay | Konfigurasi Server DHCP | Redundansi DHCP | DHCPv6 | Keamanan DHCP | Troubleshooting DHCP | MikroTik RouterOS
- 06-aplikasi/03-http :: 06.3 — HTTP dan Layanan Web
    Anatomi HTTP | Evolusi HTTP | Cookie, Sesi, dan CORS | REST dan JSON — Fondasi Otomasi Jaringan | WebSocket, SSE, dan gRPC | Proxy, Reverse Proxy, Load Balancer, CDN | Diagnostik HTTP | Kesalahan Umum
- 06-aplikasi/04-tls-pki :: 06.4 — TLS, Sertifikat, dan PKI
    Kriptografi Dasar yang Perlu Anda Tahu | TLS Handshake | Sertifikat X.509 | PKI dan ACME | Membaca dan Mendiagnosis Error TLS | TLS Inspection di Jaringan Perusahaan | Konfigurasi TLS yang Baik
- 06-aplikasi/05-layanan-lain :: 06.5 — Email, SSH, NTP, SNMP, Syslog, dan Layanan Infrastruktur
    Email | SSH | NTP — Sinkronisasi Waktu | SNMP — Monitoring Klasik | Syslog | FTP, TFTP, SFTP | Layanan Lain yang Perlu Dikenal | MikroTik RouterOS

## 07-routing-lanjutan
- 07-routing-lanjutan/01-static-routing :: 07.1 — Static Routing
    Kapan Static Route Adalah Pilihan yang Tepat | Sintaks Dasar | Recursive Lookup — Konsep yang Harus Dipahami | Exit Interface pada Link Multi-Access — Jangan Lakukan | Default Route | Floating Static Route — Failover Otomatis | IP SLA + Object Tracking — Failover yang Benar | IPv6 Static Route | Static Route di Linux | Troubleshooting Static Route | MikroTik RouterOS
- 07-routing-lanjutan/02-konsep-routing-dinamis :: 07.2 — Konsep Routing Dinamis
    Apa yang Dilakukan Protokol Routing Dinamis | Klasifikasi Protokol Routing | Distance Vector — "Routing by Rumor" | Link State — Setiap Router Punya Peta | Path Vector — BGP | Metrik | Konvergensi | Passive Interface | Autentikasi Protokol Routing | Memilih Protokol
- 07-routing-lanjutan/03-rip :: 07.3 — RIP
    Karakteristik RIP | RIPv1 vs RIPv2 vs RIPng | Konfigurasi | Kelemahan RIP
- 07-routing-lanjutan/04-ospf :: 07.4 — OSPF
    Karakteristik OSPF | Router ID | Neighbor Adjacency | Network Types | DR dan BDR | Cost dan Metrik | Konfigurasi OSPF | Area — Kunci Skalabilitas | LSA Types | Tipe Area Khusus | Virtual Link — Solusi Darurat | Tuning dan Optimasi | OSPFv3 (IPv6) | Troubleshooting OSPF | MikroTik RouterOS
- 07-routing-lanjutan/05-eigrp :: 07.5 — EIGRP
    Karakteristik EIGRP | Tiga Tabel EIGRP | DUAL — Successor dan Feasible Successor | Metrik Composite | Konfigurasi | Summarization | Stub Router | Unequal-Cost Load Balancing (Variance) | EIGRP untuk IPv6 | Verifikasi dan Troubleshooting
- 07-routing-lanjutan/06-bgp :: 07.6 — BGP
    Karakteristik BGP | eBGP vs iBGP | Neighbor State Machine | Path Attributes | Best Path Selection Algorithm | Konfigurasi Dasar | Route Reflector dan Confederation | Filtering dan Route-Map | Multihoming | Keamanan Routing Internet | BGP di Data Center | Verifikasi dan Troubleshooting | MikroTik RouterOS
- 07-routing-lanjutan/07-redistribusi-policy :: 07.7 — Redistribusi dan Routing Policy
    Kenapa Redistribusi Diperlukan | Sintaks Dasar | Seed Metric | Bahaya Redistribusi | Mitigasi: Tag, Filter, dan AD | Redistribusi Satu Arah — Lebih Aman | Route-Map — Bahasa Kebijakan Routing | Policy-Based Routing (PBR) | VRF-Lite
- 07-routing-lanjutan/08-fhrp :: 07.8 — First Hop Redundancy Protocol (FHRP)
    Masalah yang Dipecahkan | Perbandingan Protokol FHRP | HSRP | Interface Tracking — Bagian Terpenting | VRRP | GLBP — Load Balancing Bawaan | Load Balancing per VLAN | FHRP untuk IPv6 | Verifikasi dan Troubleshooting | Alternatif Modern | MikroTik RouterOS
- 07-routing-lanjutan/09-multicast :: 07.9 — Multicast
    Tiga Model Pengiriman | Alamat Multicast | IGMP — Bagaimana Host Berlangganan | IGMP Snooping — Wajib di Switch | PIM — Routing Multicast | Verifikasi dan Troubleshooting | Praktik di Linux

## 08-ipv6
- 08-ipv6/01-dasar-ipv6 :: 08.1 — Dasar IPv6
    Kenapa IPv6 | Format Alamat | Tipe Alamat | Interface ID | Header IPv6 | Fragmentasi di IPv6 | Konfigurasi Dasar | Kesalahan Umum | MikroTik RouterOS
- 08-ipv6/02-ndp-slaac-dhcpv6 :: 08.2 — NDP, SLAAC, dan DHCPv6
    NDP — Neighbor Discovery Protocol | Address Resolution — Pengganti ARP | DAD — Duplicate Address Detection | Router Advertisement — Jantung Konfigurasi IPv6 | SLAAC — Autokonfigurasi | DHCPv6 | Prefix Delegation (IA_PD) | First-Hop Security IPv6 | Troubleshooting | MikroTik RouterOS
- 08-ipv6/03-routing-transisi-ipv6 :: 08.3 — Routing IPv6 dan Strategi Transisi
    Routing IPv6 | Strategi Transisi | Dual Stack — Pendekatan yang Direkomendasikan | Tunneling | Translation | Strategi Migrasi Praktis | Keamanan IPv6 | Verifikasi Konektivitas IPv6 | MikroTik RouterOS

## 09-nat-acl-firewall
- 09-nat-acl-firewall/01-nat :: 09.1 — NAT
    Kenapa NAT Ada | Terminologi Cisco (Wajib untuk Ujian) | Jenis NAT | CGNAT | NAT Traversal | NAT dan Protokol Bermasalah | Verifikasi dan Troubleshooting | NAT dan IPv6
- 09-nat-acl-firewall/02-acl :: 09.2 — Access Control List (ACL)
    Apa Itu ACL | Cara Kerja: Top-Down dengan Implicit Deny | Jenis ACL di Cisco | Penempatan ACL | Membatasi Akses Manajemen (VTY) | Mengedit ACL dengan Aman | ACL untuk IPv6 | ACL di MikroTik RouterOS | ACL di Linux | Verifikasi dan Troubleshooting | Praktik Terbaik
- 09-nat-acl-firewall/03-firewall :: 09.3 — Firewall: Stateful, NGFW, dan IDS/IPS
    Evolusi Firewall | Stateful Inspection — Konsep Inti | Struktur Kebijakan Firewall | Firewall di MikroTik RouterOS | Zone-Based Firewall (Cisco IOS) | Linux: nftables | NGFW dan Fitur Lanjutan | Praktik Terbaik Firewall | Troubleshooting Firewall

## 10-wireless
- 10-wireless/01-rf-dasar :: 10.1 — Dasar Radio Frequency (RF)
    Gelombang Radio | Desibel — Wajib Dikuasai | SNR — Yang Sesungguhnya Menentukan Kecepatan | Band Frekuensi | Perilaku Gelombang RF | Antena | Link Budget — Perhitungan untuk Point-to-Point | Praktik Pengukuran
- 10-wireless/02-802-11 :: 10.2 — Standar 802.11 dan Cara Kerja Wi-Fi
    Generasi Wi-Fi | CSMA/CA — Akses Media Nirkabel | Kenapa Throughput Nyata Jauh Lebih Rendah | Frame 802.11 | Proses Koneksi Klien | MIMO dan Spatial Stream | Wi-Fi 6 (802.11ax) — Perubahan Paradigma | Wi-Fi 7 (802.11be) | Wi-Fi 8 (802.11bn) — Arah Masa Depan | Rate Adaptation dan MCS | Roaming | Verifikasi
- 10-wireless/03-keamanan-wireless :: 10.3 — Keamanan Wireless
    Kenapa Wireless Berbeda | Evolusi Keamanan Wi-Fi | WPA3 — Standar Saat Ini | Empat-Way Handshake (WPA2) | 802.1X / EAP — Autentikasi Enterprise | Serangan Wireless dan Mitigasi | Jaringan Tamu | Konfigurasi | Praktik Terbaik
- 10-wireless/04-desain-wlan :: 10.4 — Arsitektur dan Desain WLAN
    Arsitektur WLAN | Koneksi Fisik WLC dan AP (topik CCNA 2.7) | Site Survey | Coverage vs Capacity Design | Perencanaan Kanal | Wireless Bridging dan Mesh | CAPsMAN — Controller MikroTik | Troubleshooting Wireless

## 11-wan-vpn
- 11-wan-vpn/01-teknologi-wan :: 11.1 — Teknologi WAN
    Apa yang Membedakan WAN | Teknologi Akses (Last Mile) | Metro Ethernet | MPLS | SD-WAN | Teknologi WAN Warisan | Desain WAN | Optimasi WAN | MikroTik untuk WAN
- 11-wan-vpn/02-tunneling-vpn :: 11.2 — Tunneling dan VPN
    Konsep Tunnel | GRE — Generic Routing Encapsulation | IPsec | WireGuard — VPN Modern | DMVPN — Dynamic Multipoint VPN | Remote Access VPN | Troubleshooting VPN
- 11-wan-vpn/03-qos :: 11.3 — Quality of Service (QoS)
    Kenapa QoS Diperlukan | Tiga Model QoS | Marking | Queueing — Bagaimana Antrean Dilayani | Shaping vs Policing | Konfigurasi Cisco (MQC) | QoS di MikroTik | QoS di Linux (tc) | QoS Wireless (WMM) | Merancang Kebijakan QoS | Troubleshooting QoS

## 12-keamanan
- 12-keamanan/01-konsep-keamanan :: 12.1 — Konsep Dasar Keamanan Jaringan
    CIA Triad — Fondasi Semua Keamanan | Kosakata Wajib (Topik CCNA 5.1) | Prinsip Desain Keamanan | Threat Actor | Rekayasa Sosial — Serangan yang Menargetkan Manusia | Program Keamanan (Topik CCNA 5.2) | Kill Chain dan MITRE ATT&CK | Lateral Movement dan Segmentasi | Berpikir Seperti Penyerang | Kerangka Kepatuhan
- 12-keamanan/02-serangan-l2 :: 12.2 — Serangan Layer 2 dan Mitigasinya
    MAC Flooding / CAM Table Overflow | ARP Spoofing / ARP Poisoning | DHCP Attacks | IP Spoofing | VLAN Hopping | STP Attacks | CDP/LLDP Reconnaissance | Storm Control | Port Isolation | 802.1X — Kontrol Akses Berbasis Port | Checklist Hardening Layer 2
- 12-keamanan/03-serangan-l3-l7 :: 12.3 — Serangan Layer 3 sampai Layer 7
    IP Spoofing | Serangan Berbasis ICMP | Serangan TCP | Serangan DNS | DDoS | Man-in-the-Middle | Serangan Aplikasi Web | Reconnaissance | Serangan pada Protokol Routing | Malware dan C2
- 12-keamanan/04-aaa-identitas :: 12.4 — AAA dan Manajemen Identitas
    AAA — Tiga Pilar | Faktor Autentikasi | Kebijakan Password (Topik CCNA 5.4) | RADIUS vs TACACS+ | Privilege Level dan RBAC | 802.1X untuk Akses Jaringan | Manajemen Kredensial Perangkat | Identity Provider dan SSO | Privileged Access Management | Verifikasi dan Troubleshooting
- 12-keamanan/05-hardening-zero-trust :: 12.5 — Hardening Perangkat dan Zero Trust
    Hardening Perangkat Jaringan | Control Plane Protection | Manajemen Konfigurasi | Zero Trust Architecture | Mikrosegmentasi | SASE dan SSE | Segmentasi — Pendekatan Praktis | Monitoring dan Respons
- 12-keamanan/06-tools-keamanan :: 12.6 — Alat Keamanan Jaringan
    Kerangka Etika dan Legal | Discovery dan Scanning | Vulnerability Scanning | Analisis Trafik | Pengujian dan Simulasi | Alat Serangan (untuk Pengujian Berizin) | Deteksi dan Monitoring | Alat Audit dan Kepatuhan | Alat Bawaan MikroTik | Membangun Lab yang Aman

## 13-linux-networking
- 13-linux-networking/01-iproute2 :: 13.1 — iproute2: Perangkat Jaringan Linux Modern
    iproute2 Menggantikan net-tools | `ip link` — Interface (Layer 1/2) | `ip addr` — Alamat IP (Layer 3) | `ip route` — Routing | `ip neigh` — Tabel Tetangga (ARP/NDP) | `ip` untuk Diagnostik Lanjutan | `ethtool` — Kontrol Hardware NIC | Konfigurasi Persisten | sysctl — Tuning Kernel Network | Resolusi DNS di Linux | Troubleshooting Konektivitas — Alur Linux
- 13-linux-networking/02-virtual-networking :: 13.2 — Virtual Networking di Linux
    Network Namespace — Jaringan Terisolasi | veth — Kabel Virtual | Linux Bridge — Switch Virtual | Membangun Router Lengkap dengan Namespace | VLAN di Linux (802.1Q) | Bonding dan Teaming — Link Aggregation | macvlan dan ipvlan | TUN/TAP — Interface Virtual untuk VPN | Jenis Interface Virtual Lain | Membangun Firewall/NAT untuk Namespace | Menghubungkan Semua: Cara Docker Bekerja
- 13-linux-networking/03-nftables-firewall :: 13.3 — nftables: Firewall Linux Modern
    Arsitektur Netfilter | Struktur nftables | Firewall Lengkap — Contoh untuk Server | Perintah nftables | NAT dengan nftables | Connection Tracking (conntrack) | Fitur Lanjutan nftables | nftables untuk Router | iptables — Masih Anda Temui | Alternatif Frontend: firewalld dan UFW | Troubleshooting Firewall Linux
- 13-linux-networking/04-layanan-jaringan-linux :: 13.4 — Layanan Jaringan di Linux
    DNS Resolver: Unbound | DHCP Server: ISC Kea | Reverse Proxy dan Load Balancer | NTP: chrony | RADIUS: FreeRADIUS | Routing Daemon: FRRouting (FRR) | Monitoring Agent | Menjadikan Linux Router/Firewall Lengkap | Manajemen Layanan dengan systemd | Keamanan Layanan Linux

## 14-monitoring-troubleshooting
- 14-monitoring-troubleshooting/01-metodologi :: 14.1 — Metodologi Troubleshooting
    Kenapa Metodologi Penting | Metodologi CompTIA 7 Langkah | Tiga Pendekatan OSI | Menentukan Scope — Pertanyaan Kunci | Membedakan Gejala vs Penyebab | Baseline — Tahu Apa yang "Normal" | Isolasi Masalah — Teknik | Alur Diagnosis Universal | Menangani Masalah Intermiten | Dokumentasi dan RCA | Kesalahan Berpikir yang Umum
- 14-monitoring-troubleshooting/02-tools :: 14.2 — Alat Troubleshooting dan Cara Menafsirkannya
    ping — dan Cara Salah Menafsirkannya | traceroute / mtr — dan Salah Tafsir yang Fatal | DNS: dig / nslookup | Menguji Port dan Layanan | Melihat Socket: ss | tcpdump — Menangkap Paket | Wireshark — Analisis Mendalam | Uji Throughput: iperf3 | Perintah Cisco untuk Troubleshooting | Perintah MikroTik untuk Troubleshooting | Windows | Membangun Toolkit Diagnostik
- 14-monitoring-troubleshooting/03-observability :: 14.3 — Observability: Monitoring Proaktif
    Tiga Pilar Observability | SNMP — Polling Klasik | Streaming Telemetry — Pengganti Modern | Flow-Based Monitoring: NetFlow / IPFIX / sFlow | Syslog Terpusat | Metrik yang Harus Dipantau | Stack Monitoring Modern: Prometheus + Grafana | Menyusun Dashboard yang Bermakna | Alerting — Melakukannya dengan Benar | Capacity Planning | Monitoring Keamanan | Kesalahan Umum Monitoring
- 14-monitoring-troubleshooting/04-studi-kasus :: 14.4 — Studi Kasus Troubleshooting Nyata
    Kasus 1: "Internet Lambat" saat Ada yang Download | Kasus 2: Sebagian Situs Terbuka, Sebagian Menggantung | Kasus 3: PC Dapat IP 169.254.x.x | Kasus 4: Ping ke IP Berhasil, ke Nama Gagal | Kasus 5: Duplex Mismatch | Kasus 6: Broadcast Storm / Loop Layer 2 | Kasus 7: Asymmetric Routing Merusak Firewall | Kasus 8: DHCP Pool Habis | Kasus 9: Sticky Wi-Fi Client | Kasus 10: BGP Session Tidak ESTABLISHED | Kasus 11: NAT Exhaustion di Proxy | Kasus 12: Sertifikat TLS Kedaluwarsa | Kasus 13: VLAN Hilang di Trunk | Kasus 14: Congestion vs Loss | Kasus 15: "Internet Lambat" Tanpa Gejala Jelas | Pola Umum dari 15 Kasus

## 15-otomasi
- 15-otomasi/01-mengapa-otomasi :: 15.1 — Mengapa Otomasi dan Konsep SDN
    Kenapa Otomasi | Traditional vs Controller-Based Networking (CCNA 6.2) | SDN — Pemisahan Control Plane dan Data Plane (CCNA 6.3) | Implementasi SDN di Dunia Nyata | AI dan Machine Learning dalam Operasi Jaringan (CCNA 6.4) | Infrastructure as Code (IaC) | Deklaratif vs Imperatif | Perjalanan Otomasi — Bertahap | Keterampilan yang Dibutuhkan
- 15-otomasi/02-data-dan-api :: 15.2 — Format Data dan API Perangkat
    Format Data — Fondasi Otomasi | REST API (CCNA 6.5) | Model Interaksi Perangkat | NETCONF | RESTCONF | YANG — Model Data | gNMI dan Streaming Telemetry | Postman dan curl untuk Eksplorasi | Alur Kerja: Dari CLI ke API
- 15-otomasi/03-python-jaringan :: 15.3 — Python untuk Otomasi Jaringan
    Python Esensial untuk Network Engineer | Netmiko — SSH Multi-Vendor | NAPALM — Abstraksi Multi-Vendor | Scrapli dan ncclient | Jinja2 — Templating Konfigurasi | requests dan httpx — REST API | Nornir — Framework Orkestrasi | Contoh Lengkap: Backup + Audit | Scapy — Membuat dan Menganalisis Paket | pyATS/Genie — Testing dan Validasi Cisco | Praktik Terbaik Skrip Otomasi
- 15-otomasi/04-ansible-cicd :: 15.4 — Ansible, Terraform, dan CI/CD Jaringan
    Ansible — Otomasi Deklaratif | Terraform — Infrastructure as Code | NetBox — Source of Truth | Git untuk Jaringan | CI/CD untuk Jaringan | Praktik Aman Otomasi Perubahan | Membangun Lab Otomasi

## 16-datacenter-cloud-sdn
- 16-datacenter-cloud-sdn/01-desain-dc :: 16.1 — Desain Data Center & Arsitektur Spine-Leaf
    Kenapa Data Center Berbeda | Masalah STP di Data Center | Arsitektur Spine-Leaf (CCNA 1.2.c) | Underlay dan Overlay (CCNA 6.3) | Komponen dan Istilah DC | Fabric Terkelola: ACI dan Sejenisnya
- 16-datacenter-cloud-sdn/02-overlay-vxlan-evpn :: 16.2 — Overlay: VXLAN & EVPN
    Kenapa VLAN Tidak Cukup | VXLAN — L2 di Atas L3 | Masalah: Bagaimana VTEP Tahu ke Mana? | EVPN — Control Plane untuk VXLAN | Gambaran Utuh Fabric Modern
- 16-datacenter-cloud-sdn/03-storage-virtualisasi :: 16.3 — Jaringan Storage & Virtualisasi
    Virtualisasi Server (CCNA 1.12) | Container (CCNA 1.12) | VRF — Virtualisasi pada Router (CCNA 1.12) | Jaringan Storage: SAN vs NAS | Protokol SAN
- 16-datacenter-cloud-sdn/04-cloud-networking :: 16.4 — Jaringan Cloud
    Model Layanan Cloud | Jaringan Virtual Cloud (VPC / VNet) | Konektivitas ke Cloud | Layanan Jaringan Cloud Lain | Cloud vs On-Premises: Pertimbangan
- 16-datacenter-cloud-sdn/05-container-kubernetes :: 16.5 — Jaringan Container & Kubernetes
    Jaringan Docker | Model Jaringan Kubernetes | CNI — Container Network Interface | Service — Abstraksi Stabil | Ingress — Masuk dari Luar (L7) | Network Policy — Firewall untuk Pod | Gambaran Utuh
- 16-datacenter-cloud-sdn/06-sdn :: 16.6 — SDN & Controller-Based Networking
    Jaringan Tradisional vs Berbasis Controller (CCNA 6.2) | Pemisahan Control Plane & Data Plane (CCNA 6.3.a) | Underlay, Overlay, Fabric (CCNA 6.3) | Northbound & Southbound API (CCNA 6.3.b) | Contoh Platform Controller | AI/ML dalam Operasi Jaringan (CCNA 6.4) | Kenapa SDN & Otomasi Penting

## 17-desain-arsitektur
- 17-desain-arsitektur/01-prinsip-desain :: 17.1 — Prinsip Desain Jaringan
    Kenapa Desain Penting | Model Hierarkis Tiga-Tier (CCNA 1.2.b) | Model Dua-Tier / Collapsed Core (CCNA 1.2.a) | Spine-Leaf (CCNA 1.2.c) | Tipe Jaringan menurut Skala (CCNA 1.2.d, 1.2.e) | Prinsip Desain Kunci | Prinsip Keamanan dalam Desain
- 17-desain-arsitektur/02-desain-per-domain :: 17.2 — Desain per Domain
    Desain LAN Kampus | Desain WAN | Desain Data Center | Desain Wireless | Desain Keamanan (Defense in Depth) | Manajemen & Operasi dalam Desain
- 17-desain-arsitektur/03-perencanaan-dokumentasi :: 17.3 — Perencanaan IP, Penamaan & Dokumentasi
    Perencanaan Pengalamatan IP | Perencanaan VLAN | Konvensi Penamaan | Dokumentasi Jaringan | Standar & Kepatuhan (Konteks Indonesia)
- 17-desain-arsitektur/04-studi-kasus-desain :: 17.4 — Studi Kasus Desain End-to-End
    Metodologi Desain (PPDIOO) | Studi Kasus: PT Nusantara Jaya | Proses Berpikir Arsitek | Checklist Review Desain

## 18-karier-sertifikasi
- 18-karier-sertifikasi/01-peta-sertifikasi :: 18.1 — Peta Sertifikasi & Jalur Karier Jaringan
    Kenapa Sertifikasi? | Sertifikasi Vendor-Netral (Fondasi) | Jalur Cisco (Paling Berpengaruh) | Jalur Vendor Lain | Jalur Keamanan & Spesialisasi | Peran Karier Jaringan | Bagaimana Memilih
- 18-karier-sertifikasi/02-peta-ccna :: 18.2 — Peta Kurikulum ke CCNA 200-301 v1.1
    Tentang Ujian CCNA 200-301 | Domain 1.0 — Network Fundamentals (20%) | Domain 2.0 — Network Access (20%) | Domain 3.0 — IP Connectivity (25%) ★ terbesar | Domain 4.0 — IP Services (10%) | Domain 5.0 — Security Fundamentals (15%) | Domain 6.0 — Automation & Programmability (10%) | Strategi Persiapan
- 18-karier-sertifikasi/03-peta-networkplus :: 18.3 — Peta Kurikulum ke CompTIA Network+ N10-009
    Tentang Network+ N10-009 | CCNA vs Network+ | Domain 1.0 — Networking Concepts (23%) | Domain 2.0 — Network Implementation (20%) | Domain 3.0 — Network Operations (19%) | Domain 4.0 — Network Security (19%) | Domain 5.0 — Network Troubleshooting (19%) | Strategi Persiapan Network+
- 18-karier-sertifikasi/04-portofolio-interview :: 18.4 — Portofolio & Persiapan Wawancara
    Kenapa Portofolio Penting | Membangun Home Lab | Proyek Portofolio yang Baik | Blog / Dokumentasi Belajar | Persiapan Wawancara Teknis Jaringan | Tips Wawancara
- 18-karier-sertifikasi/05-peta-mikrotik :: 18.5 — Jalur Sertifikasi MikroTik (MTCNA & Lanjutan)
    Kenapa MikroTik Penting di Indonesia | Jalur Sertifikasi MikroTik | Isi MTCNA & Pemetaan ke Kurikulum | Skenario Praktik Khas Indonesia (RT-RW-Net) | Detail MikroTik di Kurikulum Ini

## 19-mikrotik
- 19-mikrotik/01-pengenalan-routeros :: 19.1 — Pengenalan MikroTik dan RouterOS
    Apa Itu MikroTik | Lini Produk | Cara Mengakses RouterOS | Struktur CLI RouterOS | Konfigurasi Awal Wajib | Interface | IP Address dan Routing Dasar | Padanan Istilah: Cisco ↔ MikroTik ↔ Linux | Safe Mode — Fitur Penyelamat | Sistem dan Pemeliharaan | Kesalahan Umum Pemula MikroTik
- 19-mikrotik/02-bridge-vlan-switching :: 19.2 — MikroTik: Bridge, VLAN & Switching
    Konsep Bridge di RouterOS | Hardware Offload (Switch Chip) | VLAN di RouterOS: Bridge VLAN Filtering | Inter-VLAN Routing di RouterOS | Tabel Padanan Istilah | STP di RouterOS
- 19-mikrotik/03-firewall-nat :: 19.3 — MikroTik: Firewall, NAT & Mangle
    Struktur Firewall RouterOS | Connection Tracking & Stateful Firewall | NAT di RouterOS | Address-List — Kelompok Dinamis | Mangle — Menandai untuk QoS & Routing | Proteksi Router (Best Practice Keamanan) | Tabel Padanan
- 19-mikrotik/04-qos-queue-hotspot :: 19.4 — MikroTik: QoS, Queue & Hotspot
    Manajemen Bandwidth di RouterOS | PCQ — Pembagian Adil Otomatis | Burst — Pengalaman "Cepat" | Queue Tree (Hierarkis) | Hotspot — Login Portal & Voucher | Skenario RT-RW-Net Menyeluruh
- 19-mikrotik/05-wireless-mikrotik :: 19.5 — MikroTik: Wireless (CAPsMAN & Konfigurasi)
    Wireless di RouterOS | Mode Wireless | Konfigurasi AP Dasar | Security Profile | CAPsMAN — Manajemen AP Terpusat | Fitur Wireless Khas MikroTik (ISP) | Tabel Padanan
- 19-mikrotik/06-vpn-tunnel :: 19.6 — MikroTik: VPN & Tunneling
    PPPoE — Inti Layanan ISP | IPsec — Site-to-Site VPN Aman | WireGuard — VPN Modern | EoIP — Ethernet over IP (Bridging Antar-Situs) | Panduan Memilih | Tabel Padanan
- 19-mikrotik/07-monitoring-scripting :: 19.7 — MikroTik: Monitoring, Tools & Scripting
    Tools Monitoring & Diagnostik Bawaan | Netwatch — Pemantauan Otomatis | Logging | SNMP & The Dude | Scripting RouterOS | Scheduler — Jalankan Otomatis | Otomasi Eksternal (Integrasi dengan Tahap 15) | Tabel Padanan

## 20-proyek-akhir
- 20-proyek-akhir/01-briefing-dan-aturan :: 20.1 — Briefing: Proyek Akhir Rantai Dingin
    Kenapa Bukan Ujian Pilihan Ganda | Dunia Cerita: PT Bahari Nusantara Segar | Berkas Masuk | Aturan Main | Sembilan Babak, Sembilan Bentuk Kerja | Yang Harus Ada di Akhir (Deliverable) | Empat Cara Menilai Diri Sendiri | Kesalahan Umum Peserta
- 20-proyek-akhir/02-babak-1-audit-warisan :: 20.2 — Babak 1: Audit Warisan (Forensik)
    Bentuk Kerja Babak Ini | Bukti A — Switch Akses HQ (`JKT-AC-SW03`) | Bukti B — Keluaran Perintah Pemeriksaan | Bukti C — MikroTik TPI-04 (`/export` disederhanakan) | Bukti D — Server Linux `jkt-nas01` (NAS + DNS + backup) | Bukti E — Wawancara Proses Kerja | Tugas Anda | Checksum Temuan | Rubrik Babak 1 (120 poin)
- 20-proyek-akhir/03-babak-2-sidang-arsitektur :: 20.3 — Babak 2: Sidang Arsitektur (Jadi Juri)
    Bentuk Kerja Babak Ini | Proposal A — "Cloud-First Nusantara" | Proposal B — "Enterprise Fabric" | Proposal C — "Paket Hemat Sekali Jalan" | Langkah 1 — Susun Matriks Kriteria (sebelum menilai) | Langkah 2 — Tulis Tiga Surat Penilaian | Langkah 3 — Rancang Sendiri | Rubrik Babak 2 (130 poin)
- 20-proyek-akhir/04-babak-3-teka-teki-alamat :: 20.4 — Babak 3: Teka-teki Alamat
    Bentuk Kerja Babak Ini | Ruang yang Anda Punya | Yang Harus Dimuat | Aturan Teka-teki | Yang Harus Dikeluarkan | Verifikasi Mandiri | Peringatan Jebakan | Rubrik Babak 3 (130 poin)
- 20-proyek-akhir/05-babak-4-bangun-di-lab :: 20.5 — Babak 4: Bangun di Lab & Uji Terima
    Bentuk Kerja Babak Ini | Topologi Minimum yang Mewakili | Kerangka Konfigurasi | Matriks Uji Terima | Uji Beban Ringan (opsional tapi disarankan) | Rubrik Babak 4 (150 poin)
- 20-proyek-akhir/06-babak-5-udara-dan-gudang-beku :: 20.6 — Babak 5: Udara & Gudang Beku
    Bentuk Kerja Babak Ini | Kondisi Lapangan | Hitungan Wajib | Checksum Hitungan | Keputusan Desain yang Harus Diambil | Rubrik Babak 5 (110 poin)
- 20-proyek-akhir/07-babak-6-tim-merah-tim-biru :: 20.7 — Babak 6: Tim Merah vs Tim Biru
    Bentuk Kerja Babak Ini | Sepuluh Kejadian | Yang Harus Dikeluarkan | Rubrik Babak 6 (130 poin)
- 20-proyek-akhir/08-babak-7-kode-yang-menjaga :: 20.8 — Babak 7: Kode yang Menjaga
    Bentuk Kerja Babak Ini | Bagian A — Sumber Kebenaran | Bagian B — Templat Konfigurasi | Bagian C — Playbook yang Aman Dijalankan Berulang | Bagian D — Audit Kepatuhan sebagai Kode | Bagian E — Alur CI | Bagian F — Observability sebagai Kode | Rubrik Babak 7 (120 poin)
- 20-proyek-akhir/09-babak-8-malam-panjang :: 20.9 — Babak 8: Malam Panjang
    Bentuk Kerja Babak Ini | Tiket 1 — 22:14 · Data suhu TPI-07 berhenti masuk | Tiket 2 — 22:40 · Kantor pabrik lambat, HMI kadang tidak merespons | Tiket 3 — 23:05 · VoIP antar-lokasi patah-patah, ERP normal | Tiket 4 — 01:20 · Delapan belas sensor cold storage 1 & 2 berhenti mengirim | Tiket 5 — 03:50 · Empat belas kamera mengirim koneksi keluar berulang | Setelah Pagi: Postmortem | Rubrik Babak 8 (140 poin)
- 20-proyek-akhir/10-babak-9-ruang-rapat :: 20.10 — Babak 9: Ruang Rapat
    Bentuk Kerja Babak Ini | Kejadian: Rapat Anggaran, Selasa Pagi | Daftar Harga Acuan (asumsi kasus, bukan harga pasar) | Yang Harus Dikeluarkan | Rubrik Babak 9 (100 poin)
- 20-proyek-akhir/11-sidang-akhir-dan-penilaian :: 20.11 — Sidang Akhir & Penilaian
    Bentuk Kerja Babak Ini | Empat Puluh Pertanyaan Sidang | Tantangan Mengajar | Penilaian Total | Peta Perbaikan | Setelah Lulus

## 21-ekosistem-profesi
- 21-ekosistem-profesi/01-peta-ekosistem :: 21.1 — Peta Ekosistem Profesi Jaringan
    Kenapa Jaringan Menjadi Pusat Gravitasi | Network Engineer vs Network Administrator: Garis Pemisahnya | Profil: Network Administrator | Profil: Network Engineer | Enam Rumpun Ekosistem dan Irisannya dengan Jaringan | Peta 32 Profesi dalam Satu Tabel | Pola Transisi Karier yang Umum | Cara Memilih Rumpun: Pertanyaan Refleksi Diri | Kerangka Kompetensi Rujukan | Konteks Pasar Kerja Indonesia
- 21-ekosistem-profesi/02-rumpun-infrastruktur :: 21.2 — Rumpun Infrastruktur: Jaringan, Telekomunikasi & Cloud
    Peta Rumpun Infrastruktur | Network Architect | Cloud Network Engineer | Wireless Network Engineer | Telecom Engineer | VoIP Engineer (Unified Communications) | Data Center Engineer | NOC Technician | Memilih Jalur dan Berpindah Antarprofesi
- 21-ekosistem-profesi/03-rumpun-keamanan :: 21.3 — Rumpun Keamanan Jaringan & Siber
    Peta Rumpun: Lima Peran, Satu Siklus | Fondasi Bersama: Kerangka, Regulasi, dan Etika | Network Security Engineer | Cybersecurity Analyst (SOC Analyst) | Penetration Tester | Security Architect | Incident Responder | Transisi dari Network Engineer/Administrator: Peta Praktis
- 21-ekosistem-profesi/04-rumpun-operasi-sistem-data :: 21.4 — Rumpun Administrasi Sistem & Data
    Peta Rumpun: Lapisan Tepat di Atas Jaringan | Bahasa Bersama Rumpun Ini | System Administrator | Database Administrator (DBA) | Storage Administrator | System Engineer | IT Operations Manager | Menyeberang dari Network Engineer atau Administrator: Peta Realistis | Jebakan Umum
- 21-ekosistem-profesi/05-rumpun-devops-sre :: 21.5 — Rumpun DevOps, SRE & Otomasi
    Kenapa Rumpun Ini Ada | Bahasa Bersama Rumpun Ini | DevOps Engineer | Site Reliability Engineer (SRE) | Cloud Infrastructure Engineer | Automation Engineer (Network Automation / NetDevOps) | Menyeberang dari Network Engineer: Peta Realistis | Jebakan Umum
- 21-ekosistem-profesi/06-rumpun-dukungan-lapangan :: 21.6 — Rumpun Dukungan Teknis & Lapangan
    Kenapa Rumpun Ini Penting | Tabel Perbandingan Empat Profesi | IT Support Technician (Helpdesk dan Desktop Support) | Field Network Technician (Teknisi Jaringan Lapangan dan FTTH) | Hardware Engineer (Perangkat Keras dan Elektronika) | IT Asset Manager (ITAM, SAM, HAM) | Jalur Nyata: dari Helpdesk atau Teknisi ke Network Administrator
- 21-ekosistem-profesi/07-rumpun-tata-kelola-konsultasi :: 21.7 — Rumpun Tata Kelola & Konsultasi
    Rumpun yang Bekerja dengan Dokumen, tapi Dokumennya tentang Paket | Bahasa Bersama: Kerangka dan Regulasi yang Akan Anda Temui | IT Consultant | IT Auditor | Disaster Recovery Specialist | Solution Architect | Scrum Master Infrastruktur | Kenapa Latar Belakang Jaringan Adalah Keunggulan di Rumpun Ini

## lab
- lab/00-setup-lab :: Lab 00 — Menyiapkan Lingkungan Lab
    Kenapa Lab Penting | Pilihan Platform Lab | Setup Cepat per Platform | Topologi Lab Standar | Cara Menggunakan Lab dalam Kurikulum | Verifikasi Setup Anda
- lab/01-lab-fondasi-switching :: Lab 01 — Fondasi & Switching
    Lab 1.1 — Alamat IP & Konektivitas Dasar | Lab 1.2 — VLAN & Access Port | Lab 1.3 — Trunk 802.1Q antar-Switch | Lab 1.4 — STP: Amati Root Bridge & Redundansi | Lab 1.5 — EtherChannel (LACP)
- lab/02-lab-routing :: Lab 02 — Routing
    Lab 2.1 — Static Routing & Default Route | Lab 2.2 — Floating Static (Backup Route) | Lab 2.3 — Inter-VLAN Routing (Router-on-a-Stick & SVI) | Lab 2.4 — OSPF Single-Area | Lab 2.5 — OSPF DR/BDR pada Segmen Broadcast | Lab 2.6 (Lanjutan) — BGP eBGP Dua AS
- lab/03-lab-ip-services :: Lab 03 — IP Services: DHCP, DNS, NAT, ACL
    Lab 3.1 — DHCP Server & Relay | Lab 3.2 — DNS Sederhana | Lab 3.3 — NAT/PAT ke "Internet" | Lab 3.4 — Standard & Extended ACL | Lab 3.5 — NTP & SSH (Manajemen Aman)
- lab/04-lab-keamanan-wireless :: Lab 04 — Keamanan L2 & Wireless
    Lab 4.1 — Port Security | Lab 4.2 — DHCP Snooping | Lab 4.3 — Dynamic ARP Inspection (DAI) | Lab 4.4 — WLAN via WLC (GUI) | Lab 4.5 — Hardening Perangkat (Checklist)
- lab/05-lab-linux-otomasi :: Lab 05 — Linux Networking & Otomasi
    Lab 5.1 — iproute2 Dasar | Lab 5.2 — Simulasi Topologi dengan Network Namespaces | Lab 5.3 — Bridge Linux (Switch Software) | Lab 5.4 — nftables Firewall | Lab 5.5 — Otomasi: Backup Config Multi-Perangkat (Python) | Lab 5.6 (Lanjutan) — Ansible Playbook
- lab/06-lab-mikrotik :: Lab 06 — MikroTik RouterOS End-to-End
    Lab 6.1 — Setup Awal & Keamanan Router | Lab 6.2 — Bridge, VLAN & Inter-VLAN | Lab 6.3 — NAT Internet + DHCP untuk Klien | Lab 6.4 — Bandwidth Management (Simple Queue + PCQ + Burst) | Lab 6.5 — PPPoE Server (Skenario ISP) | Lab 6.6 — Hotspot Voucher | Lab 6.7 — VPN Site-to-Site (WireGuard) + Monitoring

## referensi
- referensi/cheatsheet-cisco-ios :: Cheatsheet — Cisco IOS
    Mode & Navigasi | Verifikasi (show) — paling sering dipakai | Konfigurasi Dasar Perangkat | Interface & IP | Switching: VLAN & Trunk | STP & Keamanan L2 | EtherChannel | Routing | FHRP (HSRP) | IP Services | ACL | IPv6 (ringkas) | Troubleshooting
- referensi/cheatsheet-linux-network :: Cheatsheet — Linux Networking
    iproute2 (`ip`) — pengganti ifconfig/route/arp | Network Namespaces & Virtual (lab/container) | Konfigurasi Persisten | Diagnostik | Firewall — nftables (modern) | iptables (lama — masih umum) | Layanan (systemd) | FRR (routing — OSPF/BGP di Linux)
- referensi/cheatsheet-mikrotik :: Cheatsheet — MikroTik RouterOS
    Dasar & Navigasi | Manajemen & Keamanan Router | Interface & IP | Bridge, VLAN & Switching | Firewall & NAT | DHCP & DNS | QoS / Queue | PPPoE (ISP) | Hotspot | Wireless (paket lama) | VPN / Tunnel | Monitoring & Tools | Scripting & Scheduler
- referensi/daftar-port :: Daftar Port & Protokol Penting
    Port Paling Penting (HAFALKAN) | Email (ringkasan) | Autentikasi & Keamanan | Database & Aplikasi (umum) | Otomasi & Manajemen Jaringan | HTTP versi (untuk konteks) | Protokol Tanpa Port (Layer 3/4 langsung) | Cara Mengingat (CCNA)
- referensi/daftar-rfc-penting :: Daftar RFC & Standar Penting
    Arsitektur & Dasar Internet | Transport | Routing | IPv6 | Aplikasi & Layanan | Keamanan | Data Center & Overlay | QoS | Otomasi & Manajemen | Standar IEEE 802 (LAN/MAN) | NIST & Kerangka Keamanan | Regulasi Indonesia (konteks)
- referensi/glosarium :: Glosarium Jaringan
    A | B | C | D | E | F | G-H | I | L | M | N | O | P | Q-R | S | T | V | W-Z
- referensi/padanan-cisco-mikrotik-linux :: Padanan Istilah & Perintah: Cisco ↔ MikroTik ↔ Linux
    Konsep Fundamental | Alamat & Interface | Routing | NAT & Firewall | Switching & STP | Discovery & Manajemen | Diagnostik | VPN / Tunnel | Wireless | QoS
- referensi/soal-latihan :: Bank Soal Latihan
    Bagian A — Fondasi & Model (Tahap 0–1) | Bagian B — Layer Fisik & Data Link (Tahap 2–3) | Bagian C — IP & Subnetting (Tahap 4) | Bagian D — Transport & Aplikasi (Tahap 5–6) | Bagian E — Routing (Tahap 7) | Bagian F — Keamanan & IP Services (Tahap 9, 12) | Bagian G — Wireless, WAN, QoS (Tahap 10–11) | Bagian H — Otomasi, DC, Cloud (Tahap 15–16) | Bagian I — Troubleshooting (skenario terapan) | Bagian J — Campuran (tantangan) | Tips Mengerjakan Ujian
- referensi/sumber-belajar :: Sumber Belajar Lanjutan
    Sertifikasi — Silabus & Materi Resmi | Buku Rekomendasi | Lab & Praktik | Video & Kursus (verifikasi kualitas & tanggal) | Komunitas & Diskusi | Alat & Referensi Cepat | Observability & Monitoring (praktik) | Otomasi (praktik) | Cara Belajar Efektif (saran)
- referensi/tabel-subnetting :: Tabel Subnetting & Referensi Cepat
    Kekuatan 2 (hafalkan!) | Nilai Bit dalam Satu Oktet | Tabel Subnet Mask (IPv4) | Mask di Oktet Ketiga (subnet lebih besar dari /24) | Nilai Mask Tunggal → CIDR | Metode Cepat Subnetting | VLSM — Alokasi Efisien (contoh) | Alamat Khusus IPv4 | IPv6 Ringkas | Tabel Konversi Biner-Desimal-Hex (Cepat)

# Glosarium Jaringan

> Definisi ringkas istilah jaringan yang dipakai di kurikulum ini. Diurutkan alfabetis. Format: **Istilah** (kepanjangan) — definisi. Lihat modul terkait untuk detail.

---

## A

**AAA** (Authentication, Authorization, Accounting) — kerangka kontrol akses: siapa Anda, apa yang boleh, apa yang dilakukan. Via RADIUS/TACACS+.

**ACL** (Access Control List) — daftar aturan izin/tolak trafik berdasarkan kriteria (IP, port). Standard (sumber saja) vs extended (sumber+tujuan+port).

**AD** (Administrative Distance) — tingkat kepercayaan sumber rute (0=connected, 1=static, 90=EIGRP, 110=OSPF, 120=RIP, 20/200=BGP). AD terendah menang.

**Anycast** — satu alamat, banyak lokasi; paket ke lokasi terdekat. Dipakai DNS root, CDN.

**ARP** (Address Resolution Protocol) — memetakan IP ke MAC di jaringan lokal (IPv4). IPv6 memakai NDP.

**AS** (Autonomous System) — kumpulan jaringan di bawah satu administrasi, diidentifikasi ASN, unit routing BGP.

## B

**Bandwidth** — kapasitas maksimum kanal (bit/detik). Beda dari throughput (yang tercapai nyata).

**BDP** (Bandwidth-Delay Product) — bandwidth × RTT = data "di jalan"; menentukan ukuran window optimal.

**BGP** (Border Gateway Protocol) — protokol routing antar-AS ("routing internet"), path-vector, port TCP 179.

**BPDU** (Bridge Protocol Data Unit) — pesan STP antar-switch untuk mendeteksi loop & memilih root.

**Bridge** — perangkat/fungsi yang menyatukan segmen jadi satu broadcast domain L2 (switch software = bridge).

**Broadcast domain** — cakupan di mana broadcast L2 menyebar; dibatasi oleh router / dipisah oleh VLAN.

## C

**CAM table** — tabel MAC switch (Content-Addressable Memory); memetakan MAC ke port.

**CAPWAP** — protokol tunnel antara AP dan WLC (control & data plane wireless).

**CDN** (Content Delivery Network) — server cache tersebar dekat pengguna untuk konten cepat.

**CIDR** (Classless Inter-Domain Routing) — pengalamatan tanpa kelas dengan prefix /n; memungkinkan agregasi (supernetting).

**Collision domain** — cakupan di mana tabrakan bisa terjadi; tiap port switch = collision domain sendiri (full-duplex menghilangkannya).

**Control plane** — "otak" yang membangun tabel routing/kebijakan (vs data plane yang meneruskan).

## D

**Data plane** — "otot" yang meneruskan paket berdasarkan tabel dari control plane (juga: forwarding plane).

**DHCP** (Dynamic Host Configuration Protocol) — memberi IP/gateway/DNS otomatis. Proses DORA (Discover, Offer, Request, Ack).

**DMZ** (Demilitarized Zone) — zona terisolasi untuk server publik, memisahkannya dari jaringan internal.

**DNS** (Domain Name System) — menerjemahkan nama domain ke IP. Hierarkis, port 53.

**DR/BDR** (Designated/Backup Designated Router) — router terpilih di segmen broadcast OSPF untuk mengurangi flooding.

**Duplex** — full (kirim+terima bersamaan) vs half (bergantian). Mismatch = masalah performa umum.

## E

**ECMP** (Equal-Cost Multi-Path) — banyak jalur setara dipakai bersamaan (load balancing L3). Inti spine-leaf.

**EIGRP** — protokol routing Cisco, advanced distance-vector, metrik komposit, DUAL algorithm.

**Encapsulation** — membungkus data dengan header tiap layer saat turun stack (de-encapsulation = kebalikannya).

**EtherChannel** — menggabungkan beberapa link fisik jadi satu logis (LACP/PAgP); redundansi + bandwidth.

**EVPN** (Ethernet VPN) — control plane (via MP-BGP) untuk VXLAN; distribusi MAC/IP antar-VTEP.

## F

**FHRP** (First Hop Redundancy Protocol) — gateway redundan (HSRP, VRRP, GLBP); host tetap punya gateway saat satu router mati.

**FIB** (Forwarding Information Base) — tabel forwarding teroptimasi (dari RIB) yang dipakai data plane.

**Frame** — PDU Layer 2 (Ethernet). Berisi MAC sumber/tujuan + payload + FCS.

## G-H

**Gateway** — router yang menghubungkan jaringan lokal ke jaringan lain (default gateway = jalan keluar).

**GRE** (Generic Routing Encapsulation) — tunneling L3 sederhana, tanpa enkripsi (proto IP 47).

**HSRP** — FHRP Cisco; virtual IP/MAC dibagikan active/standby router.

**Hypervisor** — perangkat lunak yang menjalankan VM; Type 1 (bare-metal) / Type 2 (hosted).

## I

**ICMP** — protokol pesan kontrol/error L3 (ping, unreachable, TTL exceeded). Bukan TCP/UDP.

**IGP/EGP** — Interior (dalam AS: OSPF/EIGRP) vs Exterior (antar-AS: BGP) Gateway Protocol.

**Ingress (K8s)** — objek routing HTTP/HTTPS L7 ke Service di Kubernetes.

**IPsec** — suite enkripsi/autentikasi L3 untuk VPN (IKE, ESP, AH).

**IPv6** — pengalamatan 128-bit; menggantikan IPv4 yang habis. SLAAC, NDP, tanpa broadcast.

## L

**LACP** — protokol standar (802.3ad) negosiasi EtherChannel.

**Latency** — waktu tunda perjalanan paket (RTT = pulang-pergi).

**LLDP** — discovery tetangga standar (802.1AB); CDP adalah versi Cisco.

**Longest prefix match** — router memilih rute dengan prefix paling spesifik (mask terpanjang) yang cocok.

## M

**MAC address** — alamat fisik L2 48-bit unik per NIC.

**Mangle (MikroTik)** — menandai paket/koneksi untuk QoS/routing.

**MPLS** — Multiprotocol Label Switching; forwarding berbasis label, dasar L3VPN/traffic engineering.

**MTU** (Maximum Transmission Unit) — ukuran frame maksimum (Ethernet 1500; jumbo 9000).

**Multicast** — pengiriman ke grup penerima (IGMP/PIM); 224.0.0.0/4.

## N

**NAT/PAT** — Network/Port Address Translation; banyak IP privat berbagi IP publik (overload=PAT).

**NDP** (Neighbor Discovery Protocol) — pengganti ARP di IPv6 (juga SLAAC, router discovery).

**NetFlow/IPFIX** — ekspor data alur trafik untuk analisis/billing.

**NETCONF/RESTCONF/gNMI** — protokol manajemen jaringan programatik (YANG model); southbound SDN.

## O

**OSI model** — 7 layer referensi: Physical, Data Link, Network, Transport, Session, Presentation, Application.

**OSPF** — Open Shortest Path First; link-state IGP, algoritma Dijkstra, area, metrik cost.

**Overlay/Underlay** — jaringan virtual (VXLAN) di atas jaringan fisik (routing L3+ECMP).

## P

**PDU** (Protocol Data Unit) — unit data per layer: bit, frame, packet, segment.

**PoE** (Power over Ethernet) — daya listrik lewat kabel Ethernet (telepon IP, AP, kamera).

**PMTUD** (Path MTU Discovery) — menemukan MTU terkecil di jalur untuk hindari fragmentasi.

**Port (transport)** — pengenal aplikasi/socket (0-65535); well-known 0-1023.

## Q-R

**QoS** (Quality of Service) — prioritas trafik (klasifikasi, marking, queuing, shaping, policing).

**QUIC** — transport modern di atas UDP dengan enkripsi & multiplexing; dasar HTTP/3.

**RADIUS/TACACS+** — protokol AAA (RADIUS: UDP, gabung authn/authz; TACACS+: TCP, pisah, per-command).

**RIB** (Routing Information Base) — tabel routing lengkap (dari semua sumber) di control plane.

**RSTP** — Rapid STP (802.1w); konvergensi lebih cepat dari STP klasik.

**RTT** (Round-Trip Time) — waktu pulang-pergi paket.

## S

**SDN** (Software-Defined Networking) — pemisahan control/data plane; control plane terpusat (controller).

**SLAAC** — StateLess Address AutoConfiguration; host IPv6 membuat alamat sendiri via NDP.

**Socket** — kombinasi IP+port; endpoint komunikasi. 5-tuple = protokol+IP/port sumber+tujuan.

**Spine-leaf** — arsitektur DC: tiap leaf ke tiap spine, 2 hop, ECMP, untuk trafik east-west.

**STP** (Spanning Tree Protocol) — mencegah loop L2 dengan memblokir jalur redundan (802.1D).

**Subnet mask** — memisahkan porsi network & host dari IP; ditulis sebagai /n (CIDR).

**SVI** (Switched Virtual Interface) — interface VLAN L3 di switch (gateway inter-VLAN).

## T

**TCP/UDP** — Transmission Control (andal, connection-oriented) / User Datagram (cepat, connectionless).

**TLS** — enkripsi transport (HTTPS); TLS 1.3 modern. PKI + sertifikat.

**Trunk** — link switch yang membawa banyak VLAN (tagged 802.1Q).

**TTL** (Time To Live) — batas hop paket; dikurangi tiap router, 0 = di-drop (cegah loop tak hingga).

## V

**VLAN** (Virtual LAN) — segmentasi L2 logis; memisahkan broadcast domain di switch yang sama (802.1Q).

**VLSM** (Variable Length Subnet Mask) — subnet ukuran berbeda sesuai kebutuhan (efisiensi alamat).

**VPN** — Virtual Private Network; tunnel aman (IPsec/WireGuard/SSL) melintasi jaringan publik.

**VRF** (Virtual Routing and Forwarding) — banyak tabel routing terisolasi di satu router ("VLAN untuk L3").

**VTEP/VNI** — VXLAN Tunnel Endpoint / VXLAN Network Identifier (24-bit, 16 juta segmen).

**VXLAN** — membungkus L2 dalam UDP/IP untuk overlay DC (L2 di atas L3).

## W-Z

**WLC** (Wireless LAN Controller) — mengelola banyak AP terpusat (CAPWAP). MikroTik: CAPsMAN.

**WPA2/WPA3** — keamanan Wi-Fi; WPA3 (SAE) menggantikan WPA2 (PSK) yang lebih rentan.

**Wildcard mask** — kebalikan subnet mask (0=cocok, 1=abaikan); dipakai ACL & OSPF network.

**WireGuard** — VPN modern, sederhana, cepat, kriptografi kuat.

**Zero Trust** — model keamanan "jangan percaya, selalu verifikasi"; tidak ada kepercayaan berdasar lokasi jaringan.

---

> [!TIP]
> **Istilah tersering tertukar:** collision domain vs broadcast domain; AD vs metric; RIB vs FIB; bandwidth vs throughput; standard vs extended ACL; masquerade vs src-nat; input vs forward chain; coverage vs kapasitas (wireless).

**Lihat juga:** modul terkait tiap istilah, `referensi/daftar-rfc-penting.md`

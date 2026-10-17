# 18.2 Peta Kurikulum ke CCNA 200-301 v1.1

> **Prasyarat:** idealnya sudah mempelajari sebagian besar kurikulum
> **Tujuan:** Memetakan setiap topik blueprint CCNA 200-301 v1.1 ke modul kurikulum ini, sebagai panduan persiapan ujian.

---

## 1. Tentang Ujian CCNA 200-301

Ujian CCNA tetap bernomor **200-301**, tetapi isinya sedang berganti versi. Cisco menulis tanggalnya dengan tegas di halaman exam topics kedua versi: **hari terakhir menempuh v1.1 adalah 2 Februari 2027**, dan **hari pertama v2.0 adalah 3 Februari 2027**. Tidak ada masa tumpang tindih. Versi yang Anda hadapi ditentukan oleh tanggal ujian Anda, bukan oleh kapan Anda mulai belajar.

| | **v1.1** | **v2.0** |
|---|---|---|
| Masa uji | sampai **2 Februari 2027** | mulai **3 Februari 2027** |
| Nomor ujian | 200-301 | 200-301 (nomor tidak berubah) |
| Durasi | 120 menit | 120 menit |
| Biaya | US$300 atau Cisco Learning Credits | US$300 atau Cisco Learning Credits |
| Bahasa | Inggris dan Jepang | Inggris dan Jepang |
| Jenis soal | performance-based, pilihan ganda, drag-and-drop | sama; pengumuman Cisco menambahkan "practical skill assessments" |
| Jumlah soal | tidak dipublikasikan | tidak dipublikasikan |
| Nilai lulus | tidak dipublikasikan | tidak dipublikasikan |
| Domain | 6 | 5 |
| Bagian peta di bab ini | bagian 2 sampai 7 | bagian 8 sampai 12, perubahan di bagian 13 |

Semua angka di tabel itu diperiksa pada 17 Oktober 2026 di halaman exam topics v1.1 (`learningnetwork.cisco.com/s/ccna-exam-topics`), halaman exam topics v2.0 (`learningnetwork.cisco.com/s/ccna-v2-exam-topics`), dan PDF blueprint kedua versi; alamat lengkapnya ada di bagian Sumber. Untuk jumlah soal dan nilai lulus, Cisco tidak menerbitkan angka untuk versi mana pun. Angka seperti "sekitar 100 soal" atau "825 dari 1000" yang beredar di forum adalah perkiraan komunitas, jadi jangan menyusun strategi waktu di atasnya. v1.1 sendiri mulai diuji 20 Agustus 2024 sebagai revisi kecil yang menambah AI/ML dan manajemen berbasis cloud. Sertifikat CCNA berlaku 3 tahun dan bisa diperpanjang dengan lulus ujian lagi atau mengumpulkan 30 kredit CE.

**Enam domain & bobot v1.1:**

| Domain | Bobot | Modul utama |
|---|---|---|
| **1.0 Network Fundamentals** | **20%** | Tahap 0-5, 8, 10 |
| **2.0 Network Access** | **20%** | Tahap 3, 10 |
| **3.0 IP Connectivity** | **25%** | Tahap 4, 7 |
| **4.0 IP Services** | **10%** | Tahap 6, 9, 11, 14 |
| **5.0 Security Fundamentals** | **15%** | Tahap 9, 12, 10 |
| **6.0 Automation & Programmability** | **10%** | Tahap 15, 16 |

> [!WARNING]
> **Pilih peta sesuai tanggal ujian Anda.** v1.1 hanya bisa diambil sampai 2 Februari 2027; sejak 3 Februari 2027 yang tersedia hanya v2.0. Kalau ujian Anda jatuh sebelum atau tepat pada 2 Februari 2027, pakai bagian 2 sampai 7. Kalau sesudahnya, pakai bagian 8 sampai 12 dan baca bagian 13 untuk tahu apa yang berubah. Cisco sendiri menyarankan peserta yang sedang menyiapkan v1.1 untuk menyelesaikannya, bukan berhenti menunggu v2.0.

**Lima domain & bobot v2.0:**

| Domain v2.0 | Bobot | Modul utama |
|---|---|---|
| **1.0 Network Infrastructure and Connectivity** | **25%** | Tahap 2, 4, 6, 8, 10, 13, 14, 16 |
| **2.0 Switching and Network Access** | **25%** | Tahap 2, 3, 4, 10, 14 |
| **3.0 IP Routing** | **20%** | Tahap 4, 7, 8 |
| **4.0 Network Services and Security** | **20%** | Tahap 6, 8, 9, 11, 12 |
| **5.0 AI, and Network Operations and Management** | **10%** | Tahap 6, 14, 15, 16 (topik AI agentik dan prompt belum tercakup) |

Deskripsi resmi v2.0 juga menyebut bahwa peserta bisa diminta menilai keluaran dan rekomendasi dari AI agentik dan asisten jaringan digital untuk mendukung operasi dan troubleshooting. Kalimat ini tidak bernomor, tetapi tetap bagian dari apa yang diuji.

> [!TIP]
> **Bobot terbesar berbeda di kedua versi.** Di v1.1 yang terbesar adalah Domain 3.0 IP Connectivity (25%): routing, OSPF, static, komponen tabel routing; Domain 1.0 dan 2.0 masing-masing 20%. Di v2.0 dua domain sama-sama 25%, yaitu infrastruktur dan konektivitas serta switching dan akses, sedangkan routing turun ke 20%. Fokuskan waktu belajar sesuai bobot versi Anda, tetapi jangan abaikan domain kecil (domain otomasi atau AI tetap 10% di kedua versi).

---

## 2. v1.1 Domain 1.0: Network Fundamentals (20%)

| Topik v1.1 | Modul |
|---|---|
| 1.1 Peran komponen jaringan (router, switch L2/L3, NGFW/IPS, AP, controller, endpoint, server, **PoE**) | `00-fondasi/01`, `02-layer-fisik/02` (PoE), `12/03` (NGFW), `16/06` (controller) |
| 1.2 Arsitektur topologi (two-tier, three-tier, spine-leaf, WAN, SOHO, on-prem/cloud) | `00-fondasi/05`, `17/01`, `16/01`, `11/01`, `16/04` |
| 1.3 Interface & kabel (SMF, MMF, copper; shared vs P2P) | `02-layer-fisik/01-03` |
| 1.4 Masalah interface/kabel (collision, error, duplex/speed mismatch) | `02/02`, `03/02`, `14/02` |
| 1.5 TCP vs UDP | `05-transport/02-03` |
| 1.6 IPv4 addressing & subnetting | `04-network-layer/01-03` |
| 1.7 Private IPv4 | `04/01`, `09/01` (NAT) |
| 1.8 IPv6 addressing & prefix | `08-ipv6/01` |
| 1.9 Tipe alamat IPv6 (unicast global/ULA/link-local, anycast, multicast, EUI-64) | `08/01-02` |
| 1.10 Verifikasi IP di OS klien (Windows/Mac/Linux) | `04/04`, `13/01`, `14/02` |
| 1.11 Prinsip wireless (kanal non-overlap, SSID, RF, enkripsi) | `10-wireless/01-03` |
| 1.12 Virtualisasi (server, container, VRF) | `16/03`, `07/07` (VRF) |
| 1.13 Konsep switching (MAC learning/aging, frame switching/flooding, MAC table) | `03-data-link/02` |

---

## 3. v1.1 Domain 2.0: Network Access (20%)

| Topik v1.1 | Modul |
|---|---|
| 2.1 VLAN (access port data/voice, default VLAN, inter-VLAN) | `03-data-link/03` (inter-VLAN di bagian "Inter-VLAN Routing"), `lab/02` (Lab 2.3 Inter-VLAN Routing) |
| 2.2 Interswitch (trunk, 802.1Q, native VLAN) | `03/03` |
| 2.3 Discovery L2 (CDP, LLDP) | `03/06` |
| 2.4 EtherChannel L2/L3 (LACP) | `03/05` |
| 2.5 Rapid PVST+ STP (root port/bridge, state/role, PortFast, Root/Loop/BPDU guard/filter) | `03/04` |
| 2.6 Arsitektur wireless Cisco & mode AP | `10/04` |
| 2.7 Koneksi fisik WLAN (AP, WLC, access/trunk, LAG) | `10/04` |
| 2.8 Akses manajemen (Telnet, SSH, HTTP/S, console, TACACS+/RADIUS, cloud-managed) | `06/05` (SSH), `12/04` (AAA), `16/06` (cloud) |
| 2.9 GUI WLAN untuk konektivitas klien (WLAN, security, QoS, advanced) | `10/03-04` |

---

## 4. v1.1 Domain 3.0: IP Connectivity (25%) ★ terbesar

| Topik v1.1 | Modul |
|---|---|
| 3.1 Komponen tabel routing (kode protokol, prefix, mask, next-hop, **AD**, metric, gateway of last resort) | `04/05`, `07/02` |
| 3.2 Keputusan forwarding (longest prefix match, AD, metric) | `04/05`, `07/02` |
| 3.3 Static routing IPv4/IPv6 (default, network, host, floating static) | `07-routing-lanjutan/01`, `08/03` |
| 3.4 Single-area OSPFv2 (adjacency, P2P, broadcast DR/BDR, router ID) | `07/04` |
| 3.5 FHRP (tujuan, fungsi, konsep) | `07/08` |

> [!TIP]
> Ini domain terbesar. OSPF (3.4) dan komponen tabel routing + keputusan forwarding (3.1-3.2) adalah intinya, jadi kuasai betul. Static routing termasuk **floating static** (AD lebih tinggi untuk backup).

---

## 5. v1.1 Domain 4.0: IP Services (10%)

| Topik v1.1 | Modul |
|---|---|
| 4.1 Inside source NAT (static & pool) | `09-nat-acl-firewall/01` |
| 4.2 NTP (client/server) | `06/05` |
| 4.3 Peran DHCP & DNS | `06/01-02` |
| 4.4 SNMP | `06/05` (bagian SNMP), `14/03` |
| 4.5 Syslog (facility, severity) | `06/05` (bagian Syslog, termasuk facility), `14/03` |
| 4.6 DHCP client & relay | `06/02` |
| 4.7 Per-hop behavior QoS (klasifikasi, marking, queuing, congestion, policing, shaping) | `11-wan-vpn/03` |
| 4.8 SSH untuk remote access | `06/05`, `12/05` |
| 4.9 TFTP/FTP | `06/05` |

---

## 6. v1.1 Domain 5.0: Security Fundamentals (15%)

| Topik v1.1 | Modul |
|---|---|
| 5.1 Konsep keamanan (threat, vulnerability, exploit, mitigasi) | `12/01` |
| 5.2 Elemen program keamanan (awareness, training, kontrol akses fisik) | `12/01`, `12/05` |
| 5.3 Device access control (password lokal) | `12/04-05` |
| 5.4 Kebijakan password (manajemen, kompleksitas, MFA, sertifikat, biometrik) | `12/04` |
| 5.5 IPsec remote access & site-to-site VPN | `11/02` |
| 5.6 ACL | `09/02` |
| 5.7 Fitur keamanan L2 (DHCP snooping, DAI, port security) | `12/02` |
| 5.8 AAA (authentication, authorization, accounting) | `12/04` |
| 5.9 Protokol keamanan wireless (WPA, WPA2, WPA3) | `10/03` |
| 5.10 WLAN via GUI dengan WPA2 PSK | `10/03-04` |

---

## 7. v1.1 Domain 6.0: Automation & Programmability (10%)

| Topik v1.1 | Modul |
|---|---|
| 6.1 Dampak otomasi pada manajemen jaringan | `15/01` |
| 6.2 Tradisional vs controller-based | `16/06` |
| 6.3 SDN (control/data plane, overlay/underlay/fabric, NBI/SBI) | `16/06`, `16/01-02` |
| 6.4 AI (generatif & prediktif) & ML dalam operasi | `16/06` |
| 6.5 REST API (auth, CRUD, HTTP verb, encoding) | `06/03` (HTTP), `15/02` |
| 6.6 Configuration management (Ansible, Terraform) | `15/04` |
| 6.7 Komponen data JSON | `06/03`, `15/02` |

> [!WARNING]
> **Domain 6.0 sering diremehkan** karena "bukan jaringan tradisional", tetapi 10% bobot itu signifikan dan soalnya relatif mudah bila sudah paham konsep (JSON, REST, Ansible/Terraform, SDN). Jangan lewatkan "poin mudah" ini.

---

## 8. v2.0 Domain 1.0: Network Infrastructure and Connectivity (25%)

Mulai bagian ini, peta mengikuti blueprint **v2.0** (berlaku sejak 3 Februari 2027). Label topik di bawah adalah ringkasan kami; rumusan resminya ada di PDF Cisco. Kolom **Cakupan** jujur tentang seberapa jauh kurikulum ini menyiapkan setiap topik: *Tercakup*, *Sebagian* (ada bahan, tetapi ada bagian topik yang belum dibahas), atau **Celah** (belum ada bahannya).

| Topik v2.0 | Modul | Cakupan |
|---|---|---|
| 1.1 Mendiagnosis masalah interface dan kabel tembaga maupun fiber: collision, error, duplex dan speed tidak cocok, jarak, level sinyal, pinout, jenis kabel | `02/02` (bagian 4 pinout, 9 diagnosis), `02/03` (bagian 5 power budget, 10 troubleshooting fiber), `03/02`, `14/02` | Tercakup |
| 1.2 Peran dan fungsi hypervisor, mesin virtual, dan container | `16/03`, `16/05`, `13/02` | Tercakup |
| 1.3 Troubleshooting alamat IPv4: konfigurasi, cara alamat diberikan, subnetting, publik dan privat | `04/01-03`, `09/01`, `06/02`, `14/01` | Tercakup |
| 1.4 Troubleshooting alamat IPv6: konfigurasi, cara alamat diberikan, ukuran prefix (unicast dan modified EUI-64) | `08/01`, `08/02` (bagian 5 SLAAC, 9 troubleshooting) | Tercakup |
| 1.5 Prinsip wireless: pemilihan band dan kanal, karakteristik RF, protokol keamanan, penyebab interferensi | `10/01` (bagian 4 band, 5 perilaku RF), `10/04` (bagian 3 spectrum analysis, 5 perencanaan kanal), `10/03` | Tercakup |
| 1.6 Troubleshooting konektivitas klien kabel dan nirkabel di Windows, macOS, dan Linux: konfigurasi IP, keterjangkauan, parameter keamanan wireless | `04/04`, `13/01`, `14/02` (bagian 11 Windows), `10/01` (bagian 8 perintah klien di tiga OS) | Sebagian: perintahnya ada, tetapi belum ada alur diagnosis untuk klien yang gagal tersambung karena SSID, mode keamanan, atau kata sandi yang tidak cocok |
| 1.7 Troubleshooting DHCPv4 client, server, dan relay di perangkat IOS | `06/02` (bagian 5 relay, 6 server IOS, 10 troubleshooting), `lab/03` (Lab 3.1) | Tercakup |

> [!NOTE]
> Hampir setiap topik domain ini berpindah dari kata kerja "jelaskan" atau "konfigurasi dan verifikasi" di v1.1 ke "troubleshoot" dan "diagnosis" di v2.0. Membaca modulnya tidak cukup; kerjakan bagian troubleshooting di setiap modul dan studi kasus `14/04`.

---

## 9. v2.0 Domain 2.0: Switching and Network Access (25%)

| Topik v2.0 | Modul | Cakupan |
|---|---|---|
| 2.1 Konfigurasi sambungan switch ke switch dan switch ke router: interface fisik L2/L3, trunk 802.1Q, port-channel LACP L2/L3, SVI | `03/02` (routed port `no switchport`), `03/03` (bagian 3 802.1Q, 6 inter-VLAN dan SVI), `03/05`, `lab/01`, `lab/02` | Tercakup |
| 2.2 Atribut port akses untuk host di tepi jaringan (VLAN, PoE, port channel, LACP): desktop, printer, perangkat IoT; AP standalone dan berbasis controller; telepon VoIP; host tervirtualisasi; appliance jaringan | `03/03` (bagian 2 jenis port dan voice VLAN), `02/02` (bagian 6 PoE), `10/04` (bagian 2 koneksi AP dan WLC), `03/05`, `13/02`, `16/03` | Tercakup |
| 2.3 Memvalidasi ketepatan dokumentasi jaringan memakai CDP dan LLDP | `03/06` (bagian 6 memetakan jaringan dari nol), `17/03` (bagian 4 dokumentasi) | Tercakup |
| 2.4 Troubleshooting konektivitas dasar L2/L3 dan operasi perangkat dengan perintah `show` (termasuk log), ping, extended ping, traceroute, dan hasil packet capture | `04/04` (bagian 3 ping dan extended ping, 4 traceroute), `06/05` (bagian 5 `show logging`), `14/01`, `14/02` (bagian 6 tcpdump, 9 perintah Cisco termasuk `monitor capture`), `14/04` | Tercakup |
| 2.5 Konfigurasi Rapid PVST+: root port, root bridge primary/secondary, state dan role port, PortFast, root guard, loop guard, BPDU guard | `03/04` (bagian 7 RSTP, 8 Rapid PVST+, 9 fitur perlindungan), `lab/01` (Lab 1.4) | Tercakup |

> [!TIP]
> Topik 2.2 terlihat seperti daftar perangkat, padahal intinya satu pertanyaan: port ini harus access atau trunk, VLAN apa, perlu PoE atau tidak, dan perlu digabung LACP atau tidak? Telepon IP butuh voice VLAN dan PoE; AP berbasis controller cukup port access (kecuali FlexConnect yang butuh trunk); host tervirtualisasi biasanya butuh trunk karena banyak VM di banyak VLAN.

---

## 10. v2.0 Domain 3.0: IP Routing (20%)

| Topik v2.0 | Modul | Cakupan |
|---|---|---|
| 3.1 Membaca tabel routing untuk menentukan next hop sebuah paket: protokol, prefix/mask, administrative distance, metric, default route | `04/05`, `07/02` | Tercakup |
| 3.2 Troubleshooting static route IPv4 dan IPv6: default, network, host, floating static | `07/01`, `08/03` (bagian 1) | Tercakup |
| 3.3 Konfigurasi OSPFv2 single-area untuk IPv4 dan OSPFv3 untuk IPv6: adjacency (tanpa autentikasi), point-to-point, broadcast dengan pemilihan DR/BDR, router ID | `07/04`, `08/03` (bagian 1, subbagian OSPFv3), `lab/02` (Lab 2.4) | Tercakup; lab hanya berlatih OSPFv2, jadi ulangi Lab 2.4 dengan `ipv6 ospf 1 area 0` sendiri |
| 3.4 Membaca status operasional HSRP dan VRRP | `07/08` (bagian 3 HSRP, 5 VRRP, 9 verifikasi) | Tercakup |

> [!NOTE]
> Longest prefix match tidak lagi berdiri sebagai topik terpisah seperti 3.2 di v1.1. Ia tidak hilang: menentukan next hop dari tabel routing (3.1) mustahil tanpa itu.

---

## 11. v2.0 Domain 4.0: Network Services and Security (20%)

| Topik v2.0 | Modul | Cakupan |
|---|---|---|
| 4.1 Konfigurasi username lokal dan perangkat sebagai klien AAA (TACACS+ dan RADIUS) untuk akses manajemen | `12/04` (bagian 4 RADIUS vs TACACS+, 10 verifikasi), `12/05`, `06/05` (bagian 2 SSH) | Tercakup |
| 4.2 Mengelola berkas konfigurasi dan software perangkat lewat SFTP/SCP | `06/05` (bagian 6 FTP, TFTP, SFTP) | Sebagian: menyalin running-config ke server SCP ada; menyalakan server SCP di perangkat, memindahkan image IOS ke flash, dan memverifikasi berkasnya belum dibahas |
| 4.3 Konfigurasi NAT/PAT di router IOS XE | `09/01`, `lab/03` | Tercakup |
| 4.4 Mendiagnosis masalah record DNS (A, AAAA, CNAME, MX, NS, PTR) yang mengganggu akses ke host, aplikasi web, dan server mail lewat nama | `06/01` (bagian 5 resource record, 9 `dig`, 12 troubleshooting), `14/02` (bagian 3) | Tercakup |
| 4.5 IPsec remote access dan site-to-site VPN: protokol dan mode transport | `11/02` (bagian 3 IPsec: AH, ESP, transport dan tunnel mode, IKE; bagian 6 remote access) | Tercakup |
| 4.6 Konfigurasi ACL IPv4: standard, extended, bernomor, bernama | `09/02`, `lab/03` | Tercakup |
| 4.7 Fitur keamanan L2: DHCP snooping, dynamic ARP inspection, storm control, RA guard, port security | `12/02` (bagian 1 port security, 2 DAI, 3 DHCP snooping, 8 storm control), `08/02` (bagian 8 first-hop security IPv6, RA guard), `lab/04` | Tercakup |

---

## 12. v2.0 Domain 5.0: AI, and Network Operations and Management (10%)

| Topik v2.0 | Modul | Cakupan |
|---|---|---|
| 5.1 Peran AI agentik dalam operasi jaringan | `15/01` bagian 5 hanya membahas AI prediktif, AI generatif, AIOps, dan remediasi otomatis | **Celah** |
| 5.2 Memilih prompt untuk sistem AI generatif dalam operasi jaringan, dengan memperhatikan klasifikasi data, format keluaran, persona, dan instruksi | `15/01` bagian 5 (risiko data yang dikirim ke AI), `12/01` (klasifikasi data sebagai kontrol kerahasiaan) | **Celah**: komponen prompt belum diajarkan di mana pun |
| 5.3 Pendekatan manajemen jaringan: berbasis perangkat, berbasis cloud, berbasis controller, berbasis otomasi, dan infrastructure as code | `15/01` (bagian 2, 6 IaC), `16/06` (bagian 1, 5 termasuk Meraki), `15/04` (bagian 2 Terraform) | Tercakup |
| 5.4 Fungsi SNMP dalam operasi jaringan | `06/05` (bagian 4), `14/03` | Tercakup |
| 5.5 Memakai mekanisme manajemen konfigurasi seperti Ansible untuk menjalankan perintah | `15/04` (bagian 1, modul `ios_command`), `lab/05` (Lab 5.6) | Tercakup |
| 5.6 Membaca isi pesan syslog, level severity, dan facility | `06/05` (bagian 5), `14/03` | Tercakup |
| (deskripsi ujian) Menilai keluaran dan rekomendasi AI agentik serta asisten jaringan digital | `15/01` bagian 5 (peringatan untuk memverifikasi konfigurasi buatan AI) | Sebagian |

> [!CAUTION]
> **Jangan menganggap domain 5.0 v2.0 sama dengan domain 6.0 v1.1.** Bobotnya sama 10%, tetapi isinya bergeser: REST API, JSON, dan arsitektur SDN tidak lagi tercantum, digantikan AI agentik, penyusunan prompt, dan pendekatan manajemen jaringan. Dua topik AI itu belum punya modul di kurikulum ini, jadi untuk sementara pelajari dari Cisco U. dan bahan resmi Cisco yang disebut di bagian Sumber.

---

## 13. Dari v1.1 ke v2.0: Apa yang Berubah

Cisco menyebut v2.0 bukan rombakan total: fondasinya sama, tetapi kedalamannya berbeda, dengan penilaian praktik, keamanan yang tersebar di semua domain, AI, dan lebih banyak tugas troubleshooting. Pengumuman Cisco juga berjanji menerbitkan ringkasan topik yang baru. Saat bab ini diperiksa (17 Oktober 2026) ringkasan itu belum kami temukan, jadi daftar di bawah adalah bacaan kami sendiri atas dua PDF blueprint.

> [!IMPORTANT]
> "Tidak lagi tercantum" artinya tidak ada di daftar topik v2.0, **bukan** dijamin tidak keluar. Kedua PDF Cisco sama-sama menulis bahwa topik lain yang berkaitan bisa muncul di ujian. Konsep dasar seperti TCP vs UDP atau tabel MAC tetap dibutuhkan untuk menjawab soal troubleshooting.

**Baru atau dipertajam di v2.0:**

- Troubleshooting menjadi kata kerja utama: alamat IPv4 dan IPv6, klien di tiga OS, DHCPv4 di IOS, static route, DNS record, dan konektivitas L2/L3 dengan `show`, log, extended ping, traceroute, serta packet capture.
- Diagnosis kabel lebih rinci: fiber, jarak, level sinyal, dan pinout ikut disebut.
- Wireless: pemilihan band dan kanal serta penyebab interferensi.
- Switching: SVI, interface fisik L2/L3, port tepi untuk IoT, AP, telepon VoIP, host tervirtualisasi, dan appliance; Rapid PVST+ naik dari "interpretasi" ke "konfigurasi"; validasi dokumentasi dengan CDP/LLDP.
- Routing: OSPFv3 untuk IPv6; FHRP menjadi membaca status HSRP dan VRRP secara spesifik.
- Layanan dan keamanan: klien AAA (TACACS+/RADIUS), SFTP/SCP, NAT/PAT di IOS XE, enam jenis DNS record, mode transport IPsec, jenis-jenis ACL, storm control, dan RA guard.
- AI dan operasi: AI agentik, penyusunan prompt, pendekatan manajemen termasuk infrastructure as code, serta Ansible untuk menjalankan perintah.

**Tidak lagi tercantum di daftar v2.0 (dibanding v1.1):**

- Peran komponen jaringan (1.1) dan arsitektur topologi two-tier, three-tier, spine-leaf, WAN, SOHO (1.2).
- Perbandingan TCP dan UDP (1.5), konsep switching seperti MAC learning dan aging (1.13), VRF sebagai bagian virtualisasi (1.12).
- Tipe alamat IPv6 anycast dan multicast; v2.0 hanya menyebut unicast dan modified EUI-64.
- BPDU filter; v2.0 menyebut root guard, loop guard, dan BPDU guard saja.
- Arsitektur wireless Cisco dan mode AP (2.6), koneksi fisik WLC dan LAG (2.7), konfigurasi WLAN lewat GUI (2.9 dan 5.10).
- Daftar akses manajemen Telnet, HTTP/HTTPS, console (2.8); yang tersisa adalah username lokal dan klien AAA.
- NTP (4.2), QoS per-hop behavior (4.7), SSH sebagai topik tersendiri (4.8), TFTP/FTP (4.9) yang digantikan SFTP/SCP.
- Konsep keamanan, elemen program keamanan, dan kebijakan password (5.1, 5.2, 5.4).
- Arsitektur SDN dengan overlay, underlay, fabric, northbound dan southbound API (6.3); jaringan berbasis controller tetap ada sebagai salah satu pendekatan manajemen di 5.3.
- REST API (6.5) dan JSON (6.7); Terraform tidak lagi disebut namanya, tetapi infrastructure as code tetap ada.

**Bacaan tambahan bila Anda belajar dengan peta v1.1 lalu ujian v2.0:**

| Topik baru atau dipertajam | Modul yang perlu dibaca atau diulang |
|---|---|
| OSPFv3 | `08/03` bagian 1, lalu ulangi `lab/02` Lab 2.4 untuk IPv6 |
| HSRP dan VRRP, membaca status | `07/08` bagian 3, 5, dan 9 |
| Troubleshooting dengan log, extended ping, packet capture | `04/04` bagian 3, `06/05` bagian 5, `14/01`, `14/02` bagian 9, `14/04` |
| DHCPv4 server di IOS | `06/02` bagian 6 dan 10, `lab/03` Lab 3.1 |
| DNS record dan diagnosisnya | `06/01` bagian 5 dan 12 |
| Diagnosis kabel fiber dan level sinyal | `02/03` bagian 5 dan 10 |
| Pemilihan band, kanal, dan interferensi | `10/01` bagian 4 dan 5, `10/04` bagian 3 dan 5 |
| Klien AAA TACACS+/RADIUS | `12/04` bagian 4 dan 10 |
| SFTP/SCP | `06/05` bagian 6 (sebagian; lihat celah di bawah) |
| Mode transport IPsec | `11/02` bagian 3 |
| Storm control dan RA guard | `12/02` bagian 8, `08/02` bagian 8 |
| Pendekatan manajemen dan IaC | `15/01` bagian 2 dan 6, `16/06` bagian 5 |
| AI agentik dan prompt | belum ada modul (celah) |

**Celah kurikulum untuk v2.0**, ditulis terang supaya tidak ada yang mengira sudah siap:

1. **5.1 AI agentik** dalam operasi jaringan: belum ada bahan.
2. **5.2 Menyusun dan memilih prompt** (klasifikasi data, format keluaran, persona, instruksi): belum ada bahan.
3. **Menilai keluaran AI agentik dan asisten jaringan digital** (deskripsi ujian): hanya peringatan umum di `15/01` bagian 5.
4. **1.6 Parameter keamanan wireless di klien**: perintah tiga OS ada di `10/01` bagian 8, tetapi belum ada alur diagnosis klien yang gagal tersambung.
5. **4.2 SFTP/SCP**: belum ada praktik menyalakan server SCP di perangkat, memindahkan image IOS, dan memverifikasi berkas di flash.

---

## 14. Strategi Persiapan

```
1. Pelajari konsep (kurikulum ini) domain per domain, ikuti bobot.
2. Praktik LAB (lab/) — CCNA menguji konfigurasi & verifikasi, bukan hanya teori.
   Gunakan Packet Tracer (gratis dari Cisco) atau GNS3/CML.
3. Hafal yang perlu dihafal: AD default, port umum, tipe alamat IPv6,
   severity syslog, subnetting cepat.
4. Latih subnetting sampai CEPAT (soal simulasi berwaktu).
5. Kerjakan soal latihan & simulasi ujian (referensi/soal-latihan.md).
6. Fokus ekstra: OSPF, subnetting, VLAN/trunk, ACL, tabel routing.
```

> [!TIP]
> **CCNA menguji kemampuan praktik**, termasuk soal simulasi tempat Anda mengonfigurasi perangkat virtual. Packet Tracer (gratis) cukup untuk sebagian besar praktik CCNA. Jangan hanya membaca: konfigurasikan sendiri.

> [!WARNING]
> **Subnetting harus cepat dan otomatis.** Soal berwaktu tidak memberi waktu menghitung lambat. Latih sampai bisa menentukan subnet/host/range dalam hitungan detik (lihat `04-network-layer/02` dan `referensi/tabel-subnetting.md`).

> [!NOTE]
> **Untuk v2.0, geser porsi latihan ke troubleshooting.** Cisco menyebut v2.0 memuat penilaian keterampilan praktik dan lebih banyak tugas troubleshooting. Selain mengonfigurasi dari nol, latih kebalikannya: minta teman merusak satu hal di topologi lab Anda (VLAN salah, helper-address hilang, record DNS keliru, OSPF tidak adjacency), lalu temukan penyebabnya hanya dengan `show`, log, ping, traceroute, dan packet capture. Studi kasus `14/04` dan `referensi/soal-latihan.md` adalah bahan yang cocok untuk memulai.

---

## 15. Ringkasan

- CCNA 200-301 punya dua versi yang tidak tumpang tindih: **v1.1 sampai 2 Februari 2027**, **v2.0 mulai 3 Februari 2027**. Keduanya 120 menit, US$300, berbahasa Inggris dan Jepang; jumlah soal dan nilai lulus tidak dipublikasikan Cisco untuk versi mana pun.
- v1.1 (6 domain): **IP Connectivity 25%** (terbesar), Fundamentals & Access masing-masing 20%, Security 15%, IP Services & Automation masing-masing 10%. Peta topiknya di bagian 2 sampai 7.
- v2.0 (5 domain): Infrastructure and Connectivity 25%, Switching and Network Access 25%, IP Routing 20%, Network Services and Security 20%, AI and Operations 10%. Peta topiknya di bagian 8 sampai 12.
- v2.0 menambah atau mempertajam OSPFv3, status HSRP/VRRP, SFTP/SCP, DNS record, storm control, RA guard, AI agentik, dan prompt; ia tidak lagi mencantumkan REST API, JSON, NTP, QoS, TFTP/FTP, arsitektur SDN, dan GUI WLAN (bagian 13).
- **Celah kurikulum untuk v2.0**: AI agentik (5.1) dan penyusunan prompt (5.2) belum punya modul; menilai keluaran AI, parameter keamanan wireless di klien, dan SFTP/SCP baru tercakup sebagian.
- Fokus terbesar v1.1: OSPF, komponen & keputusan tabel routing, subnetting, VLAN/trunk, ACL. Di v2.0 tambahkan kemampuan troubleshooting di semua domain.
- **Jangan lewatkan domain 10%** (otomasi di v1.1, AI dan operasi di v2.0).
- Strategi: konsep (ikuti bobot versi Anda) + lab praktik (Packet Tracer) + hafalan kunci (AD, port, IPv6) + subnetting cepat + soal simulasi + latihan troubleshooting.

---

## 16. Latihan

1. Domain mana yang berbobot terbesar dan apa saja isinya?
2. Kenapa Domain 6.0 sebaiknya tidak diremehkan?
3. Kenapa praktik lab (bukan hanya membaca) penting untuk CCNA?
4. Sebutkan lima topik yang layak mendapat fokus ekstra dan di modul mana mempelajarinya.
5. Kenapa kecepatan subnetting kritis dalam ujian?
6. Ananda berencana menempuh CCNA pada 10 Februari 2027. Blueprint versi mana yang berlaku, bagian mana di bab ini yang ia pakai, dan apa risikonya bila ia tetap belajar dari peta v1.1?
7. Sebutkan tiga topik yang tercantum di v1.1 tetapi tidak lagi di daftar topik v2.0, dan tiga topik yang baru di v2.0 beserta modul kurikulum yang membahasnya. Kenapa topik yang "tidak lagi tercantum" tetap tidak boleh dibuang sama sekali?
8. Topik v2.0 mana saja yang belum atau baru sebagian tercakup kurikulum ini, dan bagaimana Anda menutup celah itu sebelum ujian?

<details>
<summary>Jawaban</summary>

1. **Domain 3.0, IP Connectivity (25%)**, adalah yang terbesar. Isinya: **3.1** interpretasi komponen tabel routing (kode protokol, prefix, network mask, next-hop, administrative distance, metric, gateway of last resort); **3.2** bagaimana router membuat keputusan forwarding secara default (longest prefix match, administrative distance, metric protokol); **3.3** konfigurasi dan verifikasi static routing IPv4 dan IPv6 (default route, network route, host route, floating static); **3.4** konfigurasi dan verifikasi single-area OSPFv2 (neighbor adjacency, point-to-point, broadcast dengan pemilihan DR/BDR, router ID); dan **3.5** tujuan, fungsi, dan konsep FHRP (first hop redundancy protocols seperti HSRP). Semuanya berpusat pada routing, fungsi inti Layer 3.

2. Karena meskipun **Domain 6.0 (Automation & Programmability) "hanya" 10%**, itu tetap porsi signifikan (sekitar 10% dari isi ujian) yang bisa menentukan lulus/tidak, dan soalnya relatif mudah bila konsepnya sudah dipahami: mengenali komponen JSON, karakteristik REST API (HTTP verb/CRUD/autentikasi/encoding), perbedaan jaringan tradisional vs controller-based, konsep SDN (pemisahan control/data plane, overlay/underlay/fabric, northbound/southbound API), peran AI/ML, dan kapabilitas Ansible/Terraform. Ini sebagian besar konseptual (bukan konfigurasi rumit), sehingga menjadi "poin mudah" yang sering ditinggalkan peserta yang hanya fokus pada routing/switching tradisional. Mengabaikannya berarti membuang poin yang mudah didapat. Kurikulum Tahap 15-16 menyiapkan domain ini.

3. Karena CCNA secara eksplisit menguji kemampuan konfigurasi dan verifikasi, selain pengetahuan teori. Ujian mencakup **soal simulasi (sim/simlet)** yang mengharuskan Anda benar-benar mengonfigurasi perangkat virtual (mis. menyiapkan VLAN/trunk, OSPF, ACL, atau NAT) dan memverifikasi hasilnya dengan perintah `show`. Banyak topik (subnetting, urutan perintah, output `show` yang harus diinterpretasi) hanya benar-benar melekat ketika Anda mengetiknya sendiri dan melihat hasilnya. Membaca saja meninggalkan celah: Anda mungkin "paham" konsep tetapi tidak tahu perintah persisnya, urutannya, atau cara membaca output verifikasi, padahal semuanya diuji. Alat seperti Packet Tracer (gratis dari Cisco) atau GNS3/CML memungkinkan latihan ini tanpa hardware.

4. (Lima dari) **(1) OSPF**: `07-routing-lanjutan/04` (domain terbesar, konsep adjacency/DR-BDR/router ID). **(2) Subnetting**: `04-network-layer/02` dan `03` (harus cepat dan otomatis). **(3) VLAN dan trunking/802.1Q**: `03-data-link/03` (inti Network Access). **(4) ACL**: `09-nat-acl-firewall/02` (keamanan dan filtering, sering muncul). **(5) Komponen dan keputusan tabel routing**: `04/05` dan `07/02` (longest prefix match, AD, metric). Tambahan yang layak fokus: STP/Rapid-PVST+ (`03/04`), NAT (`09/01`), dan IPv6 addressing (`08/01`).

5. Karena ujian berwaktu (120 menit; jumlah soal tidak dipublikasikan Cisco, perkiraan komunitas sekitar 100) dan sejumlah soal menuntut perhitungan subnetting (menentukan subnet, jumlah host, rentang alamat valid, alamat network/broadcast, atau memilih mask yang tepat). Jika Anda menghitung subnetting dengan lambat (mis. menggambar tabel biner penuh setiap kali), Anda akan kehabisan waktu dan tidak sempat mengerjakan soal lain, padahal soal subnetting sebenarnya adalah poin yang bisa dipastikan benar bila cepat. Menguasai teknik subnetting cepat (menghafal nilai blok/increment, kekuatan 2, dan metode cepat menentukan rentang) memungkinkan Anda menyelesaikan soal-soal ini dalam hitungan detik. Sisa waktunya bisa dipakai untuk soal simulasi dan analisis yang lebih memakan waktu. Latih hingga otomatis menggunakan `04-network-layer/02` dan `referensi/tabel-subnetting.md`.

6. Yang berlaku adalah **v2.0**, karena hari terakhir v1.1 adalah 2 Februari 2027 dan v2.0 diuji sejak 3 Februari 2027. Ananda memakai bagian 8 sampai 12 untuk peta topik, dan bagian 13 untuk tahu apa yang berubah. Risikonya bila tetap belajar dari peta v1.1: ia menghabiskan waktu pada topik yang tidak lagi tercantum (REST API, JSON, NTP, QoS, GUI WLAN), sementara topik baru seperti OSPFv3, membaca status HSRP dan VRRP, SFTP/SCP, DNS record, storm control, RA guard, AI agentik, dan penyusunan prompt terlewat. Bobotnya juga keliru: di v2.0 domain infrastruktur dan domain switching sama-sama 25%, bukan routing. Selain itu ia perlu menggeser cara belajar ke troubleshooting, karena hampir semua topik v2.0 memakai kata kerja "troubleshoot" atau "diagnosis".

7. Contoh topik v1.1 yang tidak lagi tercantum: **NTP** (4.2), **QoS per-hop behavior** (4.7), **REST API** (6.5) dan **JSON** (6.7); pilihan lain: TCP vs UDP, arsitektur topologi, GUI WLAN, arsitektur SDN, TFTP/FTP. Contoh topik baru di v2.0: **OSPFv3** untuk IPv6 (`08/03` bagian 1), **HSRP dan VRRP** sebagai status operasional (`07/08` bagian 3, 5, 9), **storm control** (`12/02` bagian 8) dan **RA guard** (`08/02` bagian 8), **DNS record** A, AAAA, CNAME, MX, NS, PTR (`06/01` bagian 5 dan 12), atau **SFTP/SCP** (`06/05` bagian 6). Topik yang tidak lagi tercantum tetap perlu dipahami karena dua alasan. Pertama, PDF Cisco sendiri menulis bahwa topik lain yang berkaitan bisa muncul di ujian. Kedua, banyak di antaranya adalah dasar untuk topik v2.0: troubleshooting konektivitas mustahil tanpa paham TCP vs UDP dan tabel MAC, dan membaca keluaran Ansible atau controller lebih mudah bila Anda mengenal JSON.

8. **Belum tercakup:** 5.1 peran AI agentik dalam operasi jaringan, dan 5.2 memilih prompt untuk AI generatif dengan memperhatikan klasifikasi data, format keluaran, persona, dan instruksi. **Baru sebagian:** menilai keluaran dan rekomendasi AI agentik atau asisten jaringan digital (hanya peringatan umum di `15/01` bagian 5); 1.6 parameter keamanan wireless di klien Windows, macOS, dan Linux (perintahnya ada di `10/01` bagian 8, tetapi belum ada alur diagnosis); dan 4.2 SFTP/SCP (menyalin konfigurasi ada di `06/05` bagian 6, tetapi menyalakan server SCP di perangkat, memindahkan image IOS, dan memverifikasi berkas belum). Cara menutupnya: untuk topik AI, pelajari bahan resmi Cisco U. yang dijanjikan Cisco untuk v2.0 dan baca ulang PDF blueprint agar tahu batas topiknya; latih menilai jawaban asisten AI dengan membandingkannya terhadap keluaran `show` yang Anda lihat sendiri, karena tugas ujian justru menemukan saat AI keliru. Untuk SFTP/SCP dan klien wireless, praktikkan langsung di lab: salin image dan konfigurasi lewat SCP lalu periksa dengan `dir flash:` dan `verify`, dan sengaja salahkan mode keamanan di profil Wi-Fi klien lalu diagnosis dengan `netsh wlan show interfaces`, perintah di macOS, atau `nmcli`/`iw` di Linux.

</details>

---

## 17. Sumber

Semua halaman Cisco di bawah diperiksa pada 17 Oktober 2026.

- Cisco, CCNA 200-301 v1.1 Exam Topics (PDF blueprint resmi), sumber pemetaan bagian 2 sampai 7: https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301-CCNA-v1.1.pdf
- Cisco, CCNA 200-301 v2.0 Exam Topics (PDF blueprint resmi), sumber pemetaan bagian 8 sampai 12 dan perbandingan bagian 13: https://learningcontent.cisco.com/documents/marketing/exam-topics/200-301_CCNA_v2.0_Exam_Topics_PDF.pdf
- Cisco Learning Network, halaman exam topics v1.1 (hari terakhir v1.1 dan hari pertama v2.0, biaya, durasi, bahasa, jenis soal): https://learningnetwork.cisco.com/s/ccna-exam-topics
- Cisco Learning Network, halaman exam topics v2.0 (hari pertama v2.0, biaya, durasi, bahasa, jenis soal, bobot domain): https://learningnetwork.cisco.com/s/ccna-v2-exam-topics
- Cisco Learning Network, Ryan Rose, "Steps to the Future: The Modern CCNA" (pengumuman v2.0, apa yang berbeda, penilaian praktik): https://learningnetwork.cisco.com/s/blogs/a0DQO00000616W92AI/steps-to-the-future-the-modern-ccna
- Cisco Blogs, Ryan Rose, "Stay on Track: Get Certified Before the CCNA Refresh", 1 Juli 2026 (jadwal transisi v1.1 ke v2.0): https://blogs.cisco.com/learning/stay-on-track-get-certified-before-the-ccna-refresh
- Cisco, halaman ujian CCNA (durasi, biaya, bahasa; per pemeriksaan masih menjelaskan domain v1.1): https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html
- Cisco Packet Tracer (gratis via Cisco Networking Academy)
- *CCNA 200-301 Official Cert Guide* (Wendell Odom, Cisco Press)
- `referensi/soal-latihan.md` (soal latihan kurikulum ini)

---

**Berikutnya:** `18-karier-sertifikasi/03-peta-networkplus.md`. Pemetaan ke CompTIA Network+ N10-009.

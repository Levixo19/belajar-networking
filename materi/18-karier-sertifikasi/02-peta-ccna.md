# 18.2 — Peta Kurikulum ke CCNA 200-301 v1.1

> **Prasyarat:** idealnya sudah mempelajari sebagian besar kurikulum
> **Tujuan:** Memetakan setiap topik blueprint CCNA 200-301 v1.1 ke modul kurikulum ini, sebagai panduan persiapan ujian.

---

## 1. Tentang Ujian CCNA 200-301

```
Durasi   : 120 menit
Format   : ~100-120 soal (pilihan ganda, drag-drop, simulasi/simlet)
Passing  : ~825/1000 (tidak dipublikasi resmi, bervariasi)
Berlaku  : 3 tahun
Versi    : v1.1 (berlaku sejak 2024) — menambah otomasi, AI/ML, keamanan
```

**Enam domain & bobot:**

| Domain | Bobot | Modul utama |
|---|---|---|
| **1.0 Network Fundamentals** | **20%** | Tahap 0–5, 8, 10 |
| **2.0 Network Access** | **20%** | Tahap 3, 10 |
| **3.0 IP Connectivity** | **25%** | Tahap 4, 7 |
| **4.0 IP Services** | **10%** | Tahap 6, 9, 11, 14 |
| **5.0 Security Fundamentals** | **15%** | Tahap 9, 12, 10 |
| **6.0 Automation & Programmability** | **10%** | Tahap 15, 16 |

💡 **Domain 3.0 (IP Connectivity, 25%) adalah bobot terbesar** — routing, OSPF, static, komponen tabel routing. Domain 1.0 dan 2.0 masing-masing 20%. Fokuskan waktu belajar sesuai bobot, tetapi jangan abaikan domain kecil (6.0 otomasi sering terlupa padahal 10%).

---

## 2. Domain 1.0 — Network Fundamentals (20%)

| Topik CCNA | Modul |
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

## 3. Domain 2.0 — Network Access (20%)

| Topik CCNA | Modul |
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

## 4. Domain 3.0 — IP Connectivity (25%) ★ terbesar

| Topik CCNA | Modul |
|---|---|
| 3.1 Komponen tabel routing (kode protokol, prefix, mask, next-hop, **AD**, metric, gateway of last resort) | `04/05`, `07/02` |
| 3.2 Keputusan forwarding (longest prefix match, AD, metric) | `04/05`, `07/02` |
| 3.3 Static routing IPv4/IPv6 (default, network, host, floating static) | `07-routing-lanjutan/01`, `08/03` |
| 3.4 Single-area OSPFv2 (adjacency, P2P, broadcast DR/BDR, router ID) | `07/04` |
| 3.5 FHRP (tujuan, fungsi, konsep) | `07/08` |

💡 Domain terbesar. **OSPF (3.4)** dan **komponen tabel routing + keputusan forwarding (3.1-3.2)** adalah inti — kuasai betul. Static routing termasuk **floating static** (AD lebih tinggi untuk backup).

---

## 5. Domain 4.0 — IP Services (10%)

| Topik CCNA | Modul |
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

## 6. Domain 5.0 — Security Fundamentals (15%)

| Topik CCNA | Modul |
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

## 7. Domain 6.0 — Automation & Programmability (10%)

| Topik CCNA | Modul |
|---|---|
| 6.1 Dampak otomasi pada manajemen jaringan | `15/01` |
| 6.2 Tradisional vs controller-based | `16/06` |
| 6.3 SDN (control/data plane, overlay/underlay/fabric, NBI/SBI) | `16/06`, `16/01-02` |
| 6.4 AI (generatif & prediktif) & ML dalam operasi | `16/06` |
| 6.5 REST API (auth, CRUD, HTTP verb, encoding) | `06/03` (HTTP), `15/02` |
| 6.6 Configuration management (Ansible, Terraform) | `15/04` |
| 6.7 Komponen data JSON | `06/03`, `15/02` |

⚠️ **Domain 6.0 sering diremehkan** karena "bukan jaringan tradisional", tetapi 10% bobot itu signifikan dan soalnya relatif mudah bila sudah paham konsep (JSON, REST, Ansible/Terraform, SDN). Jangan lewatkan — ini "poin mudah".

---

## 8. Strategi Persiapan

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

💡 **CCNA menguji kemampuan praktik**, termkasuk soal simulasi di mana Anda mengonfigurasi perangkat virtual. **Packet Tracer** (gratis) cukup untuk sebagian besar praktik CCNA. Jangan hanya membaca — konfigurasikan sendiri.

⚠️ **Subnetting harus cepat dan otomatis.** Soal berwaktu tidak memberi waktu menghitung lambat. Latih sampai bisa menentukan subnet/host/range dalam hitungan detik (lihat `04-network-layer/02` dan `referensi/tabel-subnetting.md`).

---

## 9. Ringkasan

- CCNA 200-301 v1.1: 120 menit, 6 domain. Bobot: **IP Connectivity 25%** (terbesar), Fundamentals & Access masing-masing 20%, Security 15%, IP Services & Automation masing-masing 10%.
- Setiap topik blueprint dipetakan ke modul kurikulum ini (tabel di atas) — gunakan sebagai checklist.
- Fokus terbesar: **OSPF, komponen & keputusan tabel routing, subnetting, VLAN/trunk, ACL**.
- **Jangan lewatkan Domain 6.0 (otomasi, 10%)** — poin relatif mudah.
- Strategi: konsep (ikuti bobot) + **lab praktik (Packet Tracer)** + hafalan kunci (AD, port, IPv6) + **subnetting cepat** + soal simulasi.
- CCNA menguji **praktik**, bukan hanya teori — konfigurasikan sendiri.

---

## 10. Latihan

1. Domain mana yang berbobot terbesar dan apa saja isinya?
2. Kenapa Domain 6.0 sebaiknya tidak diremehkan?
3. Kenapa praktik lab (bukan hanya membaca) penting untuk CCNA?
4. Sebutkan lima topik yang layak mendapat fokus ekstra dan di modul mana mempelajarinya.
5. Kenapa kecepatan subnetting kritis dalam ujian?

<details>
<summary>Jawaban</summary>

1. **Domain 3.0 — IP Connectivity (25%)** adalah yang terbesar. Isinya: **3.1** interpretasi komponen tabel routing (kode protokol, prefix, network mask, next-hop, administrative distance, metric, gateway of last resort); **3.2** bagaimana router membuat keputusan forwarding secara default (longest prefix match, administrative distance, metric protokol); **3.3** konfigurasi dan verifikasi static routing IPv4 dan IPv6 (default route, network route, host route, floating static); **3.4** konfigurasi dan verifikasi single-area OSPFv2 (neighbor adjacency, point-to-point, broadcast dengan pemilihan DR/BDR, router ID); dan **3.5** tujuan, fungsi, dan konsep FHRP (first hop redundancy protocols seperti HSRP). Intinya adalah **routing** — inti dari fungsi Layer 3.

2. Karena meskipun **Domain 6.0 (Automation & Programmability) "hanya" 10%**, itu tetap porsi signifikan (setara ~10-12 soal) yang bisa menentukan lulus/tidak, dan **soalnya relatif mudah** bila konsepnya sudah dipahami: mengenali komponen JSON, karakteristik REST API (HTTP verb/CRUD/autentikasi/encoding), perbedaan jaringan tradisional vs controller-based, konsep SDN (pemisahan control/data plane, overlay/underlay/fabric, northbound/southbound API), peran AI/ML, dan kapabilitas Ansible/Terraform. Ini sebagian besar **konseptual** (bukan konfigurasi rumit), sehingga menjadi "poin mudah" yang sering ditinggalkan peserta yang hanya fokus pada routing/switching tradisional. Mengabaikannya berarti membuang poin yang mudah didapat. Kurikulum Tahap 15–16 menyiapkan domain ini.

3. Karena **CCNA secara eksplisit menguji kemampuan konfigurasi dan verifikasi**, bukan hanya pengetahuan teori — ujian mencakup **soal simulasi (sim/simlet)** di mana Anda harus benar-benar mengonfigurasi perangkat virtual (mis. menyiapkan VLAN/trunk, OSPF, ACL, atau NAT) dan memverifikasi hasilnya dengan perintah `show`. Banyak topik (subnetting, urutan perintah, output `show` yang harus diinterpretasi) hanya benar-benar melekat ketika Anda **mengetiknya sendiri** dan melihat hasilnya. Membaca saja meninggalkan celah: Anda mungkin "paham" konsep tetapi tidak tahu perintah persisnya, urutannya, atau cara membaca output verifikasi — yang semuanya diuji. Alat seperti **Packet Tracer** (gratis dari Cisco) atau GNS3/CML memungkinkan latihan ini tanpa hardware.

4. (Lima dari) **(1) OSPF** — `07-routing-lanjutan/04` (domain terbesar, konsep adjacency/DR-BDR/router ID). **(2) Subnetting** — `04-network-layer/02` dan `03` (harus cepat dan otomatis). **(3) VLAN dan trunking/802.1Q** — `03-data-link/03` (inti Network Access). **(4) ACL** — `09-nat-acl-firewall/02` (keamanan dan filtering, sering muncul). **(5) Komponen dan keputusan tabel routing** — `04/05` dan `07/02` (longest prefix match, AD, metric). Tambahan yang layak fokus: STP/Rapid-PVST+ (`03/04`), NAT (`09/01`), dan IPv6 addressing (`08/01`).

5. Karena ujian **berwaktu (120 menit untuk ~100+ soal)** dan sejumlah soal menuntut perhitungan subnetting (menentukan subnet, jumlah host, rentang alamat valid, alamat network/broadcast, atau memilih mask yang tepat). Jika Anda menghitung subnetting dengan lambat (mis. menggambar tabel biner penuh setiap kali), Anda akan **kehabisan waktu** dan tidak sempat mengerjakan soal lain — padahal soal subnetting sebenarnya adalah poin yang bisa dipastikan benar bila cepat. Menguasai teknik subnetting cepat (menghafal nilai blok/increment, kekuatan 2, dan metode cepat menentukan rentang) memungkinkan Anda menyelesaikan soal-soal ini dalam hitungan detik, menyisakan waktu untuk soal simulasi dan analisis yang lebih memakan waktu. Latih hingga otomatis menggunakan `04-network-layer/02` dan `referensi/tabel-subnetting.md`.

</details>

---

## 11. Sumber

- Cisco CCNA 200-301 v1.1 Exam Topics (blueprint resmi) — sumber pemetaan di atas
- Cisco Packet Tracer (gratis via Cisco Networking Academy)
- *CCNA 200-301 Official Cert Guide* (Wendell Odom, Cisco Press)
- `referensi/soal-latihan.md` (soal latihan kurikulum ini)

---

**Berikutnya:** `18-karier-sertifikasi/03-peta-networkplus.md` — pemetaan ke CompTIA Network+ N10-009.

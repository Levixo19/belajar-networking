# 18.3 — Peta Kurikulum ke CompTIA Network+ N10-009

> **Prasyarat:** tidak ada
> **Tujuan:** Memetakan topik CompTIA Network+ (N10-009) ke modul kurikulum ini, sebagai panduan persiapan alternatif/pelengkap CCNA.

---

## 1. Tentang Network+ N10-009

```
Durasi   : 90 menit
Format   : max 90 soal (pilihan ganda + berbasis kinerja/PBQ)
Passing  : 720/900
Berlaku  : 3 tahun (CE — continuing education)
Sifat    : VENDOR-NETRAL (konsep umum, bukan CLI vendor tertentu)
Versi    : N10-009 (berlaku sejak Juni 2024)
```

**Lima domain & bobot:**

| Domain | Bobot | Modul utama |
|---|---|---|
| **1.0 Networking Concepts** | **23%** | Tahap 0–6, 8 |
| **2.0 Network Implementation** | **20%** | Tahap 3, 7, 10 |
| **3.0 Network Operations** | **19%** | Tahap 14, 17 |
| **4.0 Network Security** | **14%** | Tahap 12, 9 |
| **5.0 Network Troubleshooting** | **24%** | Tahap 14 |

Bobot di atas adalah bobot resmi CompTIA untuk N10-009 (23/20/19/14/24). Selalu cek ulang di halaman resmi [CompTIA Network+](https://www.comptia.org/en-us/certifications/network/) sebelum ujian, karena CompTIA bisa merevisinya.

💡 **Domain terbesar Network+ adalah Troubleshooting (24%)**, disusul Networking Concepts (23%). Security justru yang paling kecil (14%). Jadi bobotnya tidak merata: ujian ini paling berat di kemampuan mendiagnosis masalah, dan Tahap 14 kurikulum ini adalah bekal utamanya. Network+ juga **vendor-netral** — menguji konsep dan terminologi umum, bukan perintah CLI Cisco. Bagus sebagai fondasi pertama sebelum spesialisasi vendor.

---

## 2. CCNA vs Network+

| | **CCNA** | **Network+** |
|---|---|---|
| Sifat | Vendor (Cisco) | Vendor-netral |
| Kedalaman config | Dalam (CLI Cisco, simulasi) | Konsep (sedikit config) |
| Fokus | Implementasi & konfigurasi | Konsep, operasi, troubleshoot |
| Cocok untuk | Enterprise/Cisco shop | Fondasi umum, help desk, awal karier |
| Kesulitan | Lebih sulit (praktik) | Lebih mudah (konseptual) |

💡 **Banyak orang mengambil Network+ dulu** (fondasi netral, lebih mudah) **lalu CCNA** (kedalaman vendor). Keduanya saling melengkapi — kurikulum ini menyiapkan **keduanya** karena mengajarkan konsep (Network+) dan konfigurasi multi-platform (CCNA + MikroTik + Linux).

---

## 3. Domain 1.0 — Networking Concepts (23%)

| Topik N10-009 | Modul |
|---|---|
| Model OSI | `01-model-referensi/01` |
| Appliance, aplikasi, fungsi jaringan (router, switch, firewall, IDS/IPS, load balancer, proxy, dll) | `00-fondasi/01`, `12/03`, `16/04` |
| Arsitektur cloud & konektivitas (model layanan, VPC, konsep) | `16/04` |
| Konsep port & protokol umum (port, TCP/UDP) | `05-transport/01`, `referensi/daftar-port` |
| Traffic types (unicast, multicast, broadcast, anycast) | `04/01`, `07/09`, `08/01` |
| Transmission media & konektor (fiber, copper, wireless) | `02-layer-fisik/01-03`, `10/01` |
| Topologi jaringan (star, mesh, hybrid, spine-leaf, dll) | `00-fondasi/05`, `16/01` |
| IPv4 addressing (kelas, private/public, subnet, CIDR, APIPA) | `04-network-layer/01-03` |
| IPv6 addressing (tipe, SLAAC, dll) | `08-ipv6/01-02` |
| Layanan modern (SDN, SD-WAN, VXLAN, ZTA, SASE, IaC) | `16/06`, `11/01`, `16/02`, `12/05`, `15/04` |

---

## 4. Domain 2.0 — Network Implementation (20%)

| Topik N10-009 | Modul |
|---|---|
| Karakteristik perangkat routing/switching (VLAN, inter-VLAN, STP, trunk, LACP) | `03-data-link/02-05` |
| Protokol routing (static, OSPF, EIGRP, BGP, RIP) & konsep | `07-routing-lanjutan/01-07` |
| Teknologi routing (NAT, PAT, FHRP, VIP, subnet) | `09/01`, `07/08` |
| Wireless: standar, instalasi (802.11, kanal, band, antena, SSID) | `10-wireless/01-04` |
| Instalasi fisik: ruang MDF/IDF, patch panel, PoE | `02/02` |
| Daya & lingkungan, bagian dari objektif 2.4 (UPS, PDU, beban daya, suhu/kelembapan, ukuran rak & aliran udara, jenis pemadam api) | **Parsial.** UPS hanya disebut sebagai redundansi di `17/01` dan `17/04`; suhu, kelembapan, UPS, dan anggaran daya rak muncul sekilas di profil karier `21/02` (bagian Data Center Engineer). PDU dan jenis pemadam api (wet pipe, dry pipe, pre-action, clean agent) belum dibahas di kurikulum ini. Rencana: bagian baru "Instalasi Fisik & Lingkungan" di `02/02`. Sementara itu, pelajari dari buku persiapan Network+. |

---

## 5. Domain 3.0 — Network Operations (19%)

| Topik N10-009 | Modul |
|---|---|
| Dokumentasi (diagram fisik/logis, IPAM, baseline, SOP) | `17/03` |
| Kesehatan/monitoring (SNMP, flow, syslog, SIEM, baseline) | `14/03` |
| Ketersediaan tinggi (redundansi, SPOF, FHRP) | `17/01`, `07/08` |
| Disaster recovery, objektif 3.3 (RPO, RTO, MTTR, MTBF, hot/warm/cold site, backup full/incremental/differential, uji DR) | **Belum dibahas mendalam di kurikulum ini.** RPO, RTO, MTTR, dan backup 3-2-1 baru muncul di profil karier `21/04` (bagian 2.2–2.3) dan `21/07` (bagian Disaster Recovery Specialist), bukan di modul inti. MTBF, istilah hot/warm/cold site, dan jenis backup incremental/differential belum ada. Rencana: bagian baru "Disaster Recovery & Kontinuitas" di `17/02` atau modul baru `17/05`. |
| Konsep organisasi (change/config management, IaC) | `15/04` |
| Layanan jaringan (DHCP, DNS, NTP, dll) | `06-aplikasi/01-02`, `06/05` |

---

## 6. Domain 4.0 — Network Security (14%)

| Topik N10-009 | Modul |
|---|---|
| Konsep keamanan (CIA, AAA, Zero Trust, least privilege, defense in depth) | `12/01`, `12/04-05` |
| Serangan umum (DoS/DDoS, VLAN hopping, ARP spoofing, DNS poisoning, dll) | `12/02-03` |
| Hardening & mitigasi (segmentasi, ACL, port security, DAI, DHCP snooping) | `12/02`, `12/05`, `09/02` |
| Keamanan fisik & akses | `12/01`, `12/05` |
| Metode remote access (VPN, IPsec, SSH, RADIUS/TACACS+, ZTNA) | `11/02`, `12/04-05` |

---

## 7. Domain 5.0 — Network Troubleshooting (24%)

| Topik N10-009 | Modul |
|---|---|
| Metodologi troubleshooting (7 langkah CompTIA) | `14/01` |
| Masalah kabel & fisik (attenuation, crosstalk, duplex/speed, EMI) | `02/02`, `03/02`, `14/02` |
| Masalah jaringan (IP config, routing, VLAN, gateway, DNS, DHCP) | `14/02`, `14/04` |
| Tools (ping, traceroute, nslookup/dig, tcpdump, cable tester, dll) | `14/02`, `13/01` |
| Masalah wireless (interferensi, kanal, sinyal, roaming) | `10/01`, `10/04` |

💡 **Metodologi troubleshooting CompTIA (7 langkah)** sering diuji langsung: (1) identifikasi masalah, (2) buat teori kemungkinan penyebab, (3) uji teori, (4) buat rencana tindakan, (5) implementasi solusi, (6) verifikasi & tindakan pencegahan, (7) dokumentasikan. Lihat `14-monitoring-troubleshooting/01`.

---

## 8. Strategi Persiapan Network+

```
1. Kuasai KONSEP & TERMINOLOGI (bukan CLI vendor) — Network+ vendor-netral.
2. Hafal: port umum, standar kabel/wireless, model OSI per-layer,
   tipe serangan, tools & fungsinya.
3. Pahami metodologi troubleshooting 7 langkah (sering diuji).
4. Latih PBQ (performance-based questions) — skenario terapan.
5. Perhatikan istilah modern N10-009: SDN, SD-WAN, ZTA, SASE, IaC, VXLAN.
```

⚠️ **Network+ menekankan terminologi dan konsep**, bukan konfigurasi mendalam. Kalau Anda datang dari CCNA, tantangannya justru menghafal **istilah CompTIA yang spesifik** dan menjawab secara vendor-netral (mis. konsep umum "link aggregation", bukan "EtherChannel" Cisco).

---

## 9. Ringkasan

- Network+ N10-009: 90 menit, vendor-netral, 5 domain dengan bobot resmi **23/20/19/14/24**. Domain terbesar adalah **Troubleshooting (24%)**, yang terkecil Security (14%).
- Vs CCNA: Network+ lebih **konseptual & netral & mudah**; CCNA lebih **dalam, vendor Cisco, praktik**. Banyak ambil Network+ dulu.
- Kurikulum ini menyiapkan **keduanya** (konsep + config multi-platform).
- Domain: Concepts (OSI, IP, cloud, layanan modern), Implementation (routing/switching/wireless), Operations (dokumentasi, monitoring, HA), Security (CIA/ZTA/serangan/hardening), Troubleshooting (metodologi 7 langkah, tools).
- Fokus: **terminologi, konsep, metodologi troubleshooting 7 langkah, istilah modern (SDN/SASE/ZTA/IaC)**.

---

## 10. Latihan

1. Apa perbedaan utama Network+ dan CCNA, dan kenapa banyak orang mengambil Network+ dulu?
2. Domain mana yang bobotnya terbesar di Network+ N10-009, dan apa artinya untuk strategi belajar Anda?
3. Sebutkan 7 langkah metodologi troubleshooting CompTIA.
4. Apa tantangan bagi orang ber-CCNA yang mengambil Network+?
5. Sebutkan lima istilah modern yang ditekankan N10-009 dan di modul mana dipelajari.

<details>
<summary>Jawaban</summary>

1. **Perbedaan utama:** Network+ bersifat **vendor-netral** dan **konseptual** — menguji pemahaman konsep, terminologi, dan prinsip jaringan umum yang berlaku di semua vendor, dengan sedikit konfigurasi. CCNA bersifat **vendor-spesifik (Cisco)** dan **praktis** — menguji kemampuan mengonfigurasi dan memverifikasi perangkat Cisco lewat CLI, termasuk soal simulasi, dan lebih mendalam secara teknis. **Banyak orang mengambil Network+ dulu** karena: (a) sebagai fondasi vendor-netral, ia membangun pemahaman konsep yang transferable ke vendor mana pun; (b) lebih mudah/tidak menuntut penguasaan CLI mendalam, sehingga cocok sebagai langkah pertama bagi pemula total; (c) diakui luas untuk peran entry-level (help desk, teknisi); lalu **CCNA** menambahkan kedalaman dan keterampilan konfigurasi yang lebih dihargai untuk peran engineer di lingkungan enterprise/Cisco.

2. Domain terbesar adalah **5.0 Network Troubleshooting (24%)**, disusul **1.0 Networking Concepts (23%)**. Domain terkecil justru **4.0 Network Security (14%)**. Jadi bobot Network+ tidak merata, dan anggapan bahwa semua domain sekitar 19-20% itu keliru. Artinya untuk strategi belajar: hampir seperempat soal menguji kemampuan mendiagnosis masalah, jadi kuasai metodologi 7 langkah, tools (ping, traceroute, dig, tcpdump, cable tester), serta pola masalah kabel, IP, VLAN, DNS, DHCP, dan wireless di Tahap 14. Konsep dasar (OSI, IP, port, media) tetap wajib karena bobotnya hampir sama besar. Keamanan tetap perlu dipelajari, tetapi porsinya di ujian ini lebih kecil daripada di ujian keamanan khusus. Bandingkan dengan CCNA yang paling berat di **IP Connectivity (25%)**: CCNA menekankan konfigurasi routing, Network+ menekankan troubleshooting.

3. Tujuh langkah metodologi troubleshooting CompTIA: **(1) Identifikasi masalah** (kumpulkan informasi, gejala, cakupan; tanya pengguna; identifikasi perubahan). **(2) Buat teori kemungkinan penyebab** (mulai dari yang paling mungkin/sederhana; pertimbangkan pendekatan OSI). **(3) Uji teori untuk menentukan penyebab** (jika teori terkonfirmasi lanjut; jika tidak, buat teori baru atau eskalasi). **(4) Buat rencana tindakan** untuk menyelesaikan masalah dan identifikasi dampak potensial. **(5) Implementasikan solusi** (atau eskalasi bila perlu). **(6) Verifikasi fungsionalitas penuh sistem** dan, bila memungkinkan, terapkan **tindakan pencegahan**. **(7) Dokumentasikan** temuan, tindakan, dan hasil. Lihat `14-monitoring-troubleshooting/01`.

4. Tantangannya adalah **beralih dari pola pikir vendor-spesifik ke vendor-netral**. Orang ber-CCNA terbiasa dengan **terminologi dan cara Cisco** (mis. "EtherChannel", "HSRP", perintah IOS spesifik), sedangkan Network+ menggunakan **istilah generik/industri** (mis. "link aggregation", "FHRP" atau konsep gateway redundan secara umum) dan menanyakan konsep tanpa konteks vendor. Mereka harus **menghafal terminologi CompTIA yang spesifik** dan berhati-hati menjawab dengan konsep umum, bukan nama fitur Cisco. Selain itu Network+ mencakup **keluasan topik** (termasuk hal-hal seperti standar kabel detail, prosedur dokumentasi, dan istilah modern seperti SASE/ZTA) yang mungkin kurang ditekankan di CCNA, sehingga perlu mempelajari area-area tersebut meski konsep intinya sudah dikuasai. Ironisnya, bagian "mudah" (konsep) bisa terasa menjebak justru karena perbedaan istilah.

5. (Lima dari) **SDN (Software-Defined Networking)** — `16/06`; **SD-WAN** — `11/01`; **VXLAN** — `16/02`; **ZTA (Zero Trust Architecture)** — `12/05`; **SASE (Secure Access Service Edge)** — `12/05`; **IaC (Infrastructure as Code)** — `15/04`. N10-009 memperbarui silabus untuk menyertakan istilah-istilah jaringan modern ini, mencerminkan pergeseran industri ke jaringan yang terdefinisi-software, ter-overlay, dan terotomasi.

</details>

---

## 11. Sumber

- CompTIA Network+ N10-009 Exam Objectives (blueprint resmi)
- *CompTIA Network+ Study Guide* (Sybex) / Mike Meyers' All-in-One
- `14-monitoring-troubleshooting/01` (metodologi troubleshooting)

---

**Berikutnya:** `18-karier-sertifikasi/04-portofolio-interview.md` — membangun portofolio dan persiapan wawancara.

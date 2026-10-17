# 18.1 Peta Sertifikasi & Jalur Karier Jaringan

> **Prasyarat:** tidak ada (bisa dibaca kapan saja)
> **Tujuan:** Anda paham lanskap sertifikasi jaringan, jalur karier, dan bagaimana memilih yang tepat untuk tujuan Anda.

---

## 1. Kenapa Sertifikasi?

Sertifikasi tidak menggantikan pemahaman, tetapi berguna untuk:
- **Validasi** pengetahuan secara terstruktur & diakui industri.
- **Kurikulum**: memberi peta belajar yang jelas.
- **Pintu masuk**: banyak lowongan mensyaratkan/menyukai sertifikasi tertentu.
- **Kredibilitas**: terutama di awal karier atau saat pindah bidang.

> [!WARNING]
> **Sertifikasi tanpa pemahaman praktik = kertas kosong.** Pemberi kerja menguji apakah Anda benar-benar bisa. Kurikulum ini mengajarkan pemahaman; sertifikasi memvalidasinya. Kombinasikan dengan lab praktik (`lab/`) dan portofolio (`18.4`).

---

## 2. Sertifikasi Vendor-Netral (Fondasi)

Bagus untuk pemula karena mengajarkan konsep tanpa terikat satu vendor:

| Sertifikasi | Penerbit | Fokus | Level |
|---|---|---|---|
| **CompTIA Network+** (N10-009) | CompTIA | Fondasi jaringan umum | Pemula |
| **CompTIA Security+** (SY0-701) | CompTIA | Fondasi keamanan | Pemula |
| **CompTIA A+** (220-1201 & 220-1202) | CompTIA | IT dasar (hardware/OS) | Sangat pemula |

> [!TIP]
> **Network+ (N10-009)** adalah titik awal yang bagus jika Anda benar-benar baru: vendor-netral, konsep murni. Setelahnya, spesialisasi ke vendor (Cisco/lainnya). Peta detail Network+ ada di `18.3`.

---

## 3. Jalur Cisco (Paling Berpengaruh)

Cisco mendominasi pasar enterprise; sertifikasinya sangat dihargai:

```
Entry     : CCST (Cisco Certified Support Technician) — pemula
Associate : CCNA (200-301) ★ — fondasi wajib, sangat diakui
Professional: CCNP (Enterprise/Security/DataCenter/dll)
              — Core exam + Concentration exam
Expert    : CCIE (lab 8 jam!) — puncak, sangat prestisius
Architect : CCAr — level tertinggi (desain, sangat langka)
```

**Track CCNP/CCIE** (pilih spesialisasi): **Enterprise, Security, Data Center, Service Provider, Collaboration, Wireless, Automation**. Per 2026, jalur DevNet berganti nama menjadi **CCNA/CCNP/CCIE Automation**, CyberOps Associate menjadi **CCNA Cybersecurity**, dan wireless kembali menjadi jalur CCNP tersendiri.

> [!TIP]
> **CCNA adalah fondasi de-facto industri jaringan.** Kurikulum ini dipetakan langsung ke CCNA 200-301 v1.1, yang bisa diambil sampai 2 Februari 2027, dan ke v2.0 yang diuji mulai 3 Februari 2027 (lihat `18.2`, termasuk topik v2.0 yang belum tercakup). Setelah CCNA, pilih track CCNP sesuai minat (Enterprise umum, Security untuk keamanan, Automation untuk otomasi, dulu bernama DevNet).

---

## 4. Jalur Vendor Lain

| Vendor | Sertifikasi | Catatan |
|---|---|---|
| **MikroTik** | MTCNA → MTCRE/MTCWE/dll → MTCINE | Populer di ISP/RT-RW-Net Indonesia (lihat `18.5`) |
| **Juniper** | JNCIA → JNCIS → JNCIP → JNCIE | Kuat di service provider |
| **Aruba (HPE)** | ACA → ACP → ACE | Wireless/kampus |
| **Fortinet** | NSE 1-8 / FCA-FCX | Keamanan/firewall |
| **Palo Alto** | Sertifikasi berbasis peran (mis. Next-Generation Firewall Engineer, pengganti PCNSE) | NGFW |
| **AWS/Azure/GCP** | Cloud networking specialties | Cloud (lihat `16.4`) |
| **VMware** | VCP-NV (NSX) | Virtualisasi jaringan |

---

## 5. Jalur Keamanan & Spesialisasi

```
Keamanan umum : Security+ → CySA+ (CS0-004) → SecurityX (dulu CASP+) / (ISC)² SSCP → CISSP
Ofensif       : eJPT → PNPT / OSCP (praktik, sangat dihargai)
Cloud         : sertifikasi cloud + security masing-masing platform
Wireless      : CWNA → CWSP → CWNE (vendor-netral wireless)
Otomasi       : Cisco CCNA/CCNP Automation (dulu DevNet), Terraform Associate (004), Red Hat Ansible
```

---

## 6. Peran Karier Jaringan

```
Network Technician / Help Desk    → entry (dukungan, kabel, dasar)
Network Administrator             → kelola & pelihara jaringan
Network Engineer                  → desain, implementasi, troubleshoot lanjutan
Network Architect                 → desain arsitektur high-level
Security Engineer / Analyst       → keamanan jaringan (SOC, firewall, IDS)
NetDevOps / Automation Engineer   → otomasi (15), IaC, CI/CD jaringan
Cloud Network Engineer            → jaringan cloud/hybrid (16.4)
Wireless Engineer                 → desain & optimasi WLAN (10)
ISP/NOC Engineer                  → operator, BGP, MPLS (7, 11)
```

**Progresi umum:** Technician → Admin → Engineer → Senior/Specialist → Architect / Lead. Spesialisasi (keamanan, cloud, otomasi, wireless, SP) bercabang dari Engineer.

> [!TIP]
> **NetDevOps/Automation Engineer** adalah jalur dengan permintaan tinggi & berkembang, yang menggabungkan jaringan (kurikulum ini) dengan pemrograman/otomasi (`15`). Kombinasi skill ini langka & bernilai tinggi.

---

## 7. Bagaimana Memilih

```
Baru total & ingin fondasi netral   → Network+ (18.3)
Ingin kerja enterprise/umum         → CCNA (18.2) ★ rekomendasi utama
Kerja ISP/RT-RW-Net di Indonesia    → MTCNA + CCNA (18.5)
Tertarik keamanan                   → CCNA → Security+ → spesialis keamanan
Tertarik otomasi/cloud              → CCNA → CCNA Automation / cloud certs
Sudah berpengalaman, ingin naik     → CCNP track pilihan
```

> [!WARNING]
> **Nama dan kode sertifikasi berubah cepat.** Sepanjang 2025-2026 banyak yang berganti: DevNet menjadi CCNA/CCNP Automation, CyberOps Associate menjadi CCNA Cybersecurity, CASP+ menjadi SecurityX, CySA+ ke CS0-004, A+ ke 220-1201/1202, PCNSE digantikan sertifikasi berbasis peran, AWS SysOps menjadi CloudOps Engineer (SOA-C03), dan ITIL kini Version 5. CCNA sendiri berganti blueprint ke v2.0 pada 3 Februari 2027 dengan nomor ujian yang sama, 200-301. Selalu cek halaman resmi penerbit sebelum mendaftar ujian. Rincian per profesi, lengkap dengan sumbernya, ada di Tahap 21 (`21-ekosistem-profesi/01-peta-ekosistem`).

> [!WARNING]
> **Jangan mengejar terlalu banyak sertifikasi sekaligus.** Lebih baik satu sertifikasi dengan pemahaman & praktik solid daripada banyak "kertas" dangkal. Untuk kebanyakan orang, CCNA + portofolio praktik adalah kombinasi awal terkuat.

---

## 8. Ringkasan

- Sertifikasi memvalidasi & memandu, tetapi tidak menggantikan pemahaman + praktik + portofolio.
- **Vendor-netral fondasi**: CompTIA Network+ (N10-009), Security+.
- **Cisco** (paling berpengaruh): CCST → **CCNA** → CCNP (track) → CCIE → CCAr.
- **Vendor lain**: MikroTik (MTCNA, populer di Indonesia), Juniper, Aruba, Fortinet, Palo Alto, cloud.
- **Spesialisasi**: keamanan (Security+/OSCP/CISSP), wireless (CWNA), otomasi (CCNA/CCNP Automation), cloud.
- **Peran**: Technician → Admin → Engineer → Architect; cabang: security, NetDevOps, cloud, wireless, ISP/NOC.
- **NetDevOps** = permintaan tinggi (jaringan + otomasi).
- Rekomendasi umum: CCNA + portofolio praktik; ISP Indonesia: MTCNA + CCNA.

---

## 9. Latihan

1. Kenapa sertifikasi tanpa pemahaman praktik kurang bernilai?
2. Urutkan jenjang sertifikasi Cisco dari entry sampai puncak.
3. Untuk seseorang yang ingin bekerja di ISP/RT-RW-Net di Indonesia, kombinasi sertifikasi apa yang masuk akal dan kenapa?
4. Apa itu NetDevOps dan kenapa permintaannya tinggi?
5. Kenapa lebih baik fokus pada sedikit sertifikasi yang dalam daripada banyak yang dangkal?

<details>
<summary>Jawaban</summary>

1. Karena pemberi kerja pada akhirnya menguji kemampuan nyata, dan memiliki sertifikat saja tidak membuktikannya. Sertifikasi yang diperoleh dengan menghafal tanpa memahami atau mempraktikkan tidak akan bertahan di wawancara teknis (yang menanyakan skenario dan "kenapa") maupun di pekerjaan nyata (yang menuntut troubleshooting dan pengambilan keputusan di bawah tekanan). Sertifikasi paling bernilai ketika ia memvalidasi pemahaman yang benar-benar ada. Karena itu kombinasi idealnya adalah belajar konsep secara mendalam (seperti kurikulum ini), mempraktikkannya di lab, membangun portofolio, lalu memvalidasinya dengan sertifikasi. "Kertas" tanpa isi cepat terbongkar.

2. Cisco: **CCST** (Cisco Certified Support Technician, entry) → **CCNA** (Associate, 200-301) → **CCNP** (Professional: Core + Concentration exam, per track) → **CCIE** (Expert, dengan ujian lab praktik 8 jam) → **CCAr** (Architect: level tertinggi, fokus desain arsitektur, sangat langka).

3. **MTCNA (MikroTik Certified Network Associate) + CCNA** masuk akal. MTCNA, karena MikroTik sangat dominan di ISP kecil-menengah dan RT-RW-Net di Indonesia. Perangkat MikroTik (RouterOS) murah, kuat, dan banyak dipakai untuk routing, firewall, hotspot, bandwidth management, dan PPPoE di lingkungan ISP lokal; sertifikasi MTCNA memvalidasi kemampuan langsung pada perangkat yang akan dipakai sehari-hari. CCNA melengkapinya dengan fondasi konsep yang vendor-agnostik dan diakui luas (routing, switching, subnetting, keamanan), sehingga pemahaman Anda transferable dan kredibel di luar ekosistem MikroTik. CCNA juga membuka pintu ke pekerjaan enterprise. Bersama, keduanya memberi kombinasi "konsep kuat (CCNA) + keterampilan alat yang laku di pasar lokal (MTCNA)". Lihat `18.5` untuk peta MikroTik.

4. **NetDevOps** (atau Network Automation Engineering) adalah peran yang menggabungkan keahlian jaringan dengan praktik pengembangan software/DevOps: otomasi konfigurasi (Ansible), Infrastructure as Code (Terraform), skrip Python (Netmiko/NAPALM/Nornir), CI/CD untuk jaringan, source of truth (NetBox), dan API/telemetri. **Permintaannya tinggi** karena: (a) jaringan modern terlalu besar dan berubah terlalu cepat untuk dikelola manual per-perangkat, sehingga otomasi menjadi kebutuhan; (b) ini menggabungkan dua keahlian yang jarang dimiliki satu orang (jaringan mendalam + pemrograman), sehingga kandidat yang menguasainya langka dan bernilai; (c) tren industri (SDN, controller-based, cloud) semuanya mengarah ke jaringan yang programmable. Karena itu peran ini menawarkan prospek dan kompensasi yang menarik. Kurikulum ini mempersiapkannya lewat Tahap 15 (otomasi).

5. Karena kedalaman menghasilkan kemampuan nyata dan kredibilitas yang bertahan, sedangkan banyak sertifikasi dangkal hanya menghasilkan daftar "kertas" yang cepat terbongkar saat diuji. Satu sertifikasi seperti CCNA yang dipelajari dengan pemahaman mendalam dan praktik lab membuat Anda benar-benar mampu mendesain, mengonfigurasi, dan men-troubleshoot. Kemampuan itu terlihat di wawancara dan pekerjaan. Mengejar banyak sertifikasi sekaligus memecah fokus, mendorong penghafalan alih-alih pemahaman, menghabiskan waktu dan biaya, dan menghasilkan pengetahuan yang rapuh. Untuk kebanyakan orang di awal karier, satu sertifikasi fondasi yang solid (CCNA) + portofolio praktik nyata jauh lebih meyakinkan pemberi kerja daripada tumpukan sertifikat tanpa kedalaman. Kedalaman juga menjadi dasar yang kuat untuk menambah spesialisasi kemudian.

</details>

---

## 10. Sumber

- Cisco Certification tracks: https://www.cisco.com/site/us/en/learn/training-certifications/
- CompTIA: https://www.comptia.org/certifications
- MikroTik Training: https://mikrotik.com/training
- Situs vendor masing-masing untuk silabus terbaru

---

**Berikutnya:** `18-karier-sertifikasi/02-peta-ccna.md`. Pemetaan kurikulum ini ke blueprint CCNA 200-301.

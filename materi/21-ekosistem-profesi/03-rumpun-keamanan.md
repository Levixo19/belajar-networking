# 21.3 Rumpun Keamanan Jaringan & Siber

> **Prasyarat:** `09-nat-acl-firewall/03-firewall`, seluruh tahap `12-keamanan` (mulai `12-keamanan/01-konsep-keamanan` sampai `12-keamanan/06-tools-keamanan`), dan `18-karier-sertifikasi/01-peta-sertifikasi`
> **Tujuan:** Anda memahami apa yang benar-benar dikerjakan lima profesi keamanan (network security engineer, cybersecurity analyst, penetration tester, security architect, incident responder), sertifikasi dan regulasi yang berlaku per 2026, batas etika dan hukumnya di Indonesia, serta jalur realistis untuk masuk dari latar belakang jaringan.

---

## 1. Peta Rumpun: Lima Peran, Satu Siklus

Di lowongan kerja, kelima profesi ini sering ditulis dengan nama yang mirip ("Security Engineer", "Cyber Security Specialist", "Analis Keamanan Informasi"). Cara paling mudah membedakannya adalah melihat **kapan** mereka bekerja dalam siklus keamanan sebuah organisasi:

```
   MERANCANG            MEMBANGUN &          MENGUJI            MEMANTAU            MENANGANI
   (sebelum ada         MENJAGA              (mencari celah     (mencari tanda      (saat serangan
    sistem)             (setiap hari)         sebelum penjahat)  serangan)          terjadi)
 ┌──────────────┐   ┌────────────────┐   ┌───────────────┐   ┌──────────────┐   ┌──────────────┐
 │  Security    │──▶│ Network        │──▶│ Penetration   │──▶│ Cybersecurity│──▶│ Incident     │
 │  Architect   │   │ Security Eng.  │   │ Tester        │   │ Analyst (SOC)│   │ Responder    │
 └──────────────┘   └────────────────┘   └───────────────┘   └──────────────┘   └──────┬───────┘
        ▲                                                                              │
        └────────────────── pelajaran pascainsiden kembali ke desain ◀────────────────┘
```

Tabel berikut adalah ringkasan seluruh modul. Kembalilah ke sini setelah membaca tiap bagian.

| Aspek | Network Security Engineer | Cybersecurity Analyst | Penetration Tester | Security Architect | Incident Responder |
|---|---|---|---|---|---|
| Pertanyaan utama | "Apakah kontrol terpasang dan bekerja?" | "Apakah alert ini serangan sungguhan?" | "Seberapa jauh penyerang bisa masuk?" | "Kontrol apa yang seharusnya ada, dan kenapa?" | "Apa yang terjadi, seberapa luas, bagaimana menghentikannya?" |
| Sisi | Defensif (membangun) | Defensif (deteksi) | Ofensif terotorisasi | Defensif (desain) | Defensif (respons) |
| Jenjang masuk realistis | Menengah | Pemula | Menengah (ada posisi junior) | Senior | Menengah |
| Ukuran keberhasilan | Perubahan tanpa insiden, celah konfigurasi tertutup | Waktu triase, akurasi eskalasi | Kualitas temuan dan laporan | Risiko turun, desain diadopsi | Waktu kontainmen, kepatuhan pelaporan |
| Sertifikasi khas | Security+, CCNP Security, NSE 4, NGFW Engineer | Security+, CCNA Cybersecurity, CySA+, GCIA | PenTest+, OSCP+, PNPT, GPEN | CISSP, SecurityX, SABSA, CCSP | CySA+, GCIH, GCFA |
| Kerangka acuan | CIS Benchmark, zero trust | MITRE ATT&CK | OWASP, PTES, ATT&CK | NIST CSF 2.0, ISO/IEC 27001:2022 | NIST SP 800-61r3, Peraturan BSSN 1/2024 |
| Jarak dari network engineer | Paling dekat | Dekat | Sedang | Jauh (butuh pengalaman) | Sedang |

> [!TIP]
> Kalau Anda datang dari jaringan, **network security engineer** dan **SOC analyst** adalah pintu yang paling dekat. Pengetahuan ACL, NAT, VLAN, VPN, dan membaca paket langsung terpakai sejak hari pertama.

---

## 2. Fondasi Bersama: Kerangka, Regulasi, dan Etika

Kelima profesi berbicara dalam "bahasa" yang sama. Sebelum masuk ke tiap peran, kenali kerangka dan aturan yang akan muncul berulang kali di wawancara dan pekerjaan.

### 2.1 Kerangka kerja internasional

- **NIST Cybersecurity Framework (CSF) 2.0** (rilis Februari 2024). Enam fungsi: *Govern, Identify, Protect, Detect, Respond, Recover*. Fungsi *Govern* adalah tambahan di versi 2.0 dan menegaskan bahwa keamanan adalah urusan tata kelola, bukan sekadar teknis. Arsitek dan manajer memakai CSF untuk memetakan program keamanan.
- **NIST SP 800-61 Rev. 3** (April 2025) berjudul *Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile*. Dokumen ini menggantikan Rev. 2 (2012). Perbedaan pentingnya: respons insiden tidak lagi diperlakukan sebagai siklus terpisah, melainkan dipetakan ke fungsi-fungsi CSF 2.0. Banyak materi lama masih mengutip empat fase Rev. 2 (persiapan; deteksi dan analisis; kontainmen, eradikasi, dan pemulihan; aktivitas pascainsiden). Ketahui keduanya, tetapi sebutlah Rev. 3 sebagai acuan terkini.
- **MITRE ATT&CK**: katalog taktik dan teknik penyerang berdasarkan pengamatan nyata. Versi terkini per Oktober 2026 adalah v19 (rilis April 2026); rilis besar biasanya keluar dua kali setahun. Analis memakainya untuk memetakan deteksi, pentester untuk menyusun skenario, arsitek untuk mengukur cakupan kontrol.
- **OWASP Top 10:2025**: daftar risiko aplikasi web. Urutan 2025: A01 Broken Access Control, A02 Security Misconfiguration, A03 Software Supply Chain Failures, A04 Cryptographic Failures, A05 Injection, A06 Insecure Design, A07 Authentication Failures, A08 Software or Data Integrity Failures, A09 Logging & Alerting Failures, A10 Mishandling of Exceptional Conditions.
- **ISO/IEC 27001:2022**: standar sistem manajemen keamanan informasi (SMKI) yang sering diminta oleh bank, BUMN, dan pelanggan korporat dari penyedia layanan TI di Indonesia. Lampiran A versi 2022 berisi 93 kontrol dalam empat tema (organisasi, orang, fisik, teknologi).

### 2.2 Regulasi Indonesia yang wajib Anda kenal

| Regulasi | Isi yang relevan untuk praktisi |
|---|---|
| **Perpres 82/2022** tentang Pelindungan Infrastruktur Informasi Vital (IIV) | Menetapkan sektor IIV (antara lain administrasi pemerintahan, energi, transportasi, keuangan, kesehatan, TIK, pangan, pertahanan) dan mewajibkan penyelenggara IIV membentuk tim tanggap insiden siber (CSIRT). |
| **Perpres 47/2023** tentang Strategi Keamanan Siber Nasional dan Manajemen Krisis Siber | Acuan nasional; diturunkan antara lain ke Peraturan BSSN 2/2024 tentang Manajemen Krisis Siber. |
| **Peraturan BSSN 1/2024** tentang Pengelolaan Insiden Siber | Insiden berisiko tinggi dilaporkan TTIS (Tim Tanggap Insiden Siber) organisasi ke TTIS sektoral dengan tembusan ke TTIS nasional. Untuk insiden pada IIV: **paling lambat 1 x 24 jam** setelah ditemukan. Rencana tanggap insiden memuat tahapan persiapan, identifikasi, kontainmen, eradikasi, pemulihan, dan peningkatan berkelanjutan, serta disimulasikan paling sedikit sekali dalam dua tahun. |
| **UU 27/2022** tentang Pelindungan Data Pribadi (UU PDP), berlaku penuh sejak Oktober 2024 | Pasal 46: jika terjadi kegagalan pelindungan data pribadi, pengendali wajib memberi tahu subjek data dan lembaga **paling lambat 3 x 24 jam**, memuat data yang terungkap, kapan dan bagaimana, serta upaya penanganan. |
| **POJK 11/POJK.03/2022** (Penyelenggaraan TI oleh Bank Umum) dan **SEOJK 29/SEOJK.03/2022** (Ketahanan dan Keamanan Siber bagi Bank Umum) | Bank wajib menilai risiko inheren dan maturitas keamanan siber tiap tahun, melakukan pengujian berbasis kerentanan (dilanjutkan *penetration test*) dan pengujian berbasis skenario minimal setahun sekali. Notifikasi awal insiden ke OJK **paling lama 24 jam**, laporan lengkap **paling lama 5 hari kerja**. Unit keamanan siber harus **independen dari fungsi pengelola TI**. |
| **KUHP baru (UU 1/2023, sebagaimana diubah UU 1/2026)**, berlaku 2 Januari 2026, dan **UU ITE** (perubahan kedua: UU 1/2024) | Akses ilegal ke komputer atau sistem elektronik kini diatur di Pasal 332 KUHP. Mengakses dengan melanggar, menerobos, melampaui, atau menjebol sistem pengamanan diancam pidana penjara paling lama 8 tahun atau denda paling banyak kategori VI. Ketentuan UU ITE lain (misalnya mengubah atau merusak informasi elektronik) tetap relevan. |

> [!WARNING]
> Kata kuncinya adalah **"tanpa hak atau melawan hukum"**. Yang membedakan seorang penetration tester dari pelaku kejahatan bukan alatnya, melainkan **izin tertulis yang sah dari pemilik sistem** dan kepatuhan pada cakupan izin itu. Memindai IP kantor lain "sekadar iseng", menguji situs pemerintah tanpa program resmi, atau "membuktikan" celah aplikasi teman tanpa izin tertulis dapat menyeret Anda ke ranah pidana.

### 2.3 Jalur kompetensi Indonesia (SKKNI dan BNSP)

Standar Kompetensi Kerja Nasional Indonesia (SKKNI) yang relevan untuk rumpun ini, semuanya di kategori Informasi dan Komunikasi:

- **Kepmenaker 391/2020**: SKKNI bidang *Security Operations Center* (20 unit kompetensi, dari model operasional SOC sampai rekomendasi pascainsiden).
- **Kepmenaker 23/2022**: SKKNI bidang **Uji Keamanan Siber** (perencanaan, penilaian kerentanan, pengujian, sampai penyusunan laporan).
- **Kepmenaker 24/2022**: SKKNI bidang **Audit Keamanan Informasi**.
- **Kepmenaker 191/2024**: SKKNI bidang **Keamanan Informasi** (mencabut Kepmenaker 55/2015).

Sertifikasi kompetensi berbasis SKKNI diterbitkan oleh Lembaga Sertifikasi Profesi (LSP) berlisensi BNSP. **LSP BSSN** memperoleh lisensi BNSP pada 15 Februari 2023 untuk skema *Junior Penetration Tester*, *Asisten Auditor Keamanan Informasi*, dan *Level 1 SOC Analyst*, lalu pada 2024 menguji skema baru seperti *Level 2 SOC Analyst*, *Penetration Tester*, dan *Associate Digital Evidence First Responder*. Ketersediaan skema untuk peserta umum (bukan pegawai BSSN) dapat berubah, jadi cek langsung ke LSP terkait. Selain LSP BSSN, beberapa LSP perguruan tinggi dan LSP industri TIK juga membuka skema keamanan.

> [!TIP]
> Di instansi pemerintah dan BUMN, sertifikat BNSP kadang menjadi syarat administratif (misalnya untuk jabatan fungsional atau tender), sedangkan di perusahaan swasta dan multinasional, sertifikasi vendor dan internasional lebih sering dilihat. Banyak praktisi memegang keduanya.

---

## 3. Network Security Engineer

### 3.1 Apa yang sebenarnya dikerjakan

Bayangkan Anda network security engineer di sebuah bank umum menengah (KBMI 2) di Jakarta. Senin pagi:

- **08.30** Antrean tiket perubahan: tim aplikasi meminta akses dari subnet server aplikasi baru ke database di zona data, port TCP 1433. Anda tidak langsung membuka. Anda bertanya: dari host mana persisnya, untuk keperluan apa, sampai kapan. Lalu Anda menulis aturan seketat mungkin (sumber dan tujuan spesifik, bukan `any`), lengkap dengan nomor tiket di kolom komentar aturan.
- **10.00** Laporan pemindaian kerentanan bulanan masuk: firmware salah satu pasang firewall perimeter terkena CVE kritis dari vendor. Anda menyiapkan rencana pemutakhiran HA (unit pasif dulu, *failover*, lalu unit aktif) untuk jendela pemeliharaan Sabtu dini hari, dan menuliskan langkah *rollback*.
- **13.30** Rapat CAB (*Change Advisory Board*). Anda menjelaskan dampak perubahan kebijakan VPN akses jarak jauh: semua pengguna wajib MFA dan perangkat harus lolos pemeriksaan postur.
- **15.00** Analis SOC menghubungi Anda: ada lalu lintas keluar mencurigakan dari satu workstation ke IP luar negeri. Anda menarik log sesi firewall, memastikan aturan *egress* bekerja, lalu atas persetujuan insiden responder memblokir IP tujuan dan mengisolasi port switch workstation itu lewat NAC.
- **16.30** Peninjauan aturan triwulanan: Anda menemukan 37 aturan dengan *hit count* nol selama 90 hari. Anda menandainya untuk dikonfirmasi pemilik aplikasi sebelum dihapus.

Intinya: pekerjaan ini adalah **network engineering dengan kacamata risiko**. Anda membangun dan merawat kontrol (firewall, VPN, IPS, NAC, segmentasi), dan setiap perubahan Anda adalah keputusan keamanan.

### 3.2 Tanggung jawab dan ukuran keberhasilan

- Merancang dan mengelola kebijakan firewall/NGFW, segmentasi (VLAN, VRF, zona), VPN site-to-site dan akses jarak jauh, IPS, proxy atau SSE, dan NAC berbasis 802.1X.
- Hardening perangkat jaringan sesuai baseline (CIS Benchmark atau standar internal), manajemen patch firmware.
- Mendukung SOC dan insiden responder dengan log, visibilitas, dan tindakan pemblokiran.

KPI yang lazim: persentase perubahan sukses tanpa insiden; waktu penyelesaian permintaan akses sesuai SLA; jumlah aturan berisiko (`any-any`, aturan tanpa pemilik, aturan kedaluwarsa) yang turun dari triwulan ke triwulan; kepatuhan patch firmware sesuai tingkat keparahan (misalnya kritis dalam hitungan hari, bukan bulan); temuan audit atau pentest terkait konfigurasi jaringan yang ditutup tepat waktu.

### 3.3 Keahlian dan alat

**Teknis:** routing dan switching yang kuat, stateful firewall dan NGFW, NAT, IPsec dan SSL VPN, PKI dan sertifikat, AAA (RADIUS/TACACS+), 802.1X, IDS/IPS, dasar Linux, membaca paket di Wireshark, serta otomasi sederhana (Python, Ansible) untuk audit aturan.

**Non-teknis:** disiplin manajemen perubahan, menulis justifikasi aturan, berani berkata "tidak" dengan sopan kepada tim aplikasi, dan menjelaskan risiko kepada atasan non-teknis.

**Alat yang sering muncul di lowongan Indonesia:** Fortinet FortiGate dan FortiManager, Palo Alto Networks NGFW dan Panorama, Cisco Secure Firewall dan Cisco ISE, Check Point, MikroTik RouterOS (di ISP dan UMKM), nftables di Linux, Suricata, Wireshark, serta pemindai kerentanan seperti Tenable Nessus atau OpenVAS.

### 3.4 Sertifikasi per jenjang (status 2026)

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | CompTIA Security+ (SY0-701) | Versi V7 masih berlaku; CompTIA menyebut V8 diperkirakan rilis sekitar 17 November 2026. Sertifikat yang sudah Anda raih tetap berlaku tiga tahun. |
| Pemula | Fortinet NSE 4 (FortiOS) | Fortinet kembali memakai jenjang NSE 1 sampai 8; NSE 4 berfokus pada konfigurasi dan administrasi FortiOS. |
| Menengah | Cisco CCNP Security | Ujian inti SCOR 350-701 **v2.0** berlaku sejak 27 Agustus 2026 (menambah domain *Secure Service Edge*), ditambah satu ujian konsentrasi. Konsentrasi SVPN (300-730) dipensiunkan 26 Agustus 2026. |
| Menengah | Palo Alto Networks Next-Generation Firewall Engineer | Pengganti peran PCNSE yang sudah dipensiunkan; Palo Alto kini memakai sertifikasi berbasis peran. |
| Senior | CISSP (ISC2) | Butuh lima tahun pengalaman di minimal dua dari delapan domain. |
| Indonesia | Skema BNSP bidang keamanan informasi (SKKNI Kepmenaker 191/2024) | Cek LSP yang membuka skema sesuai peran Anda. |

### 3.5 Jalur masuk dan progresi

Jalur paling umum: **network administrator/engineer (1-3 tahun) → network security engineer**. Banyak orang menyeberang secara alami ketika diserahi tanggung jawab firewall. Jalur kedua: **NOC atau SOC L1 → network security engineer** setelah menguasai konfigurasi. Lulusan baru jarang langsung masuk posisi ini, kecuali di system integrator yang memberi pelatihan vendor.

Progresi: senior network security engineer → **security architect** atau **network architect**, atau ke jalur manajerial (kepala keamanan infrastruktur). Transisi balik ke network engineer sangat mudah karena fondasinya sama.

### 3.6 Pasar kerja Indonesia

Perekrut utama: **bank dan lembaga keuangan** (SEOJK 29/2022 menuntut kontrol dan pengujian yang terdokumentasi), **system integrator** dan mitra resmi vendor (Fortinet, Palo Alto, Cisco) yang membutuhkan engineer bersertifikat untuk proyek, **operator seluler dan ISP**, **BUMN** di sektor IIV (energi, transportasi, telekomunikasi), serta **penyedia layanan keamanan terkelola (MSSP)**.

### 3.7 Belajar dari kurikulum ini

`03-data-link/03-vlan` → `09-nat-acl-firewall/02-acl` → `09-nat-acl-firewall/03-firewall` → `11-wan-vpn/02-tunneling-vpn` → `12-keamanan/02-serangan-l2` → `12-keamanan/04-aaa-identitas` → `12-keamanan/05-hardening-zero-trust` → `13-linux-networking/03-nftables-firewall` → `lab/04-lab-keamanan-wireless` → `20-proyek-akhir/07-babak-6-tim-merah-tim-biru`

### 3.8 Proyek portofolio dan pertanyaan wawancara

**Proyek:**
1. Lab segmentasi bergaya zero trust di EVE-NG atau GNS3: firewall virtual (FortiGate VM atau pfSense) dengan zona pengguna, server, dan manajemen; setiap aturan punya justifikasi tertulis; log dikirim ke Wazuh atau Elastic.
2. Skrip Python yang membaca ekspor kebijakan firewall dan melaporkan aturan berisiko (`any` di sumber/tujuan/layanan, aturan tanpa komentar, aturan duplikat).
3. Dokumentasi pemutakhiran firmware pasangan HA lengkap dengan rencana uji dan *rollback*.

**Pertanyaan wawancara khas:**
- "Tim aplikasi minta dibukakan `any` ke server database karena 'aplikasinya sering ganti IP'. Apa jawaban Anda?"
- "Jelaskan perbedaan stateful firewall dan NGFW, dan kapan inspeksi TLS layak dipasang."
- "Bagaimana Anda menurunkan jumlah aturan firewall yang sudah menumpuk lima tahun tanpa merusak layanan?"

---

## 4. Cybersecurity Analyst (SOC Analyst)

### 4.1 Apa yang sebenarnya dikerjakan

Kebanyakan analis keamanan di Indonesia bekerja di **Security Operations Center (SOC)**, baik SOC internal bank dan BUMN maupun SOC milik MSSP yang melayani banyak klien. Pekerjaan diatur dalam *shift* (sering 24x7) dan berjenjang:

- **L1 (triase):** menerima alert dari SIEM dan EDR, memeriksa konteks, menutup *false positive* dengan catatan, dan mengeskalasi yang mencurigakan.
- **L2 (investigasi):** menggali lebih dalam, mengorelasikan banyak sumber log, menentukan cakupan, dan merekomendasikan tindakan.
- **L3 (threat hunting dan rekayasa deteksi):** mencari ancaman yang lolos dari aturan, menulis dan menyetel aturan deteksi.

Contoh satu shift malam L1 di MSSP Jakarta:

- **22.10** Alert "login gagal beruntun" pada akun VPN klien ritel. Anda memeriksa: 300 percobaan dari satu IP luar negeri ke 120 akun berbeda, lalu satu berhasil. Pola *password spraying* dengan satu login sukses. Anda **eskalasi ke L2** dengan ringkasan rapi: akun mana, jam berapa, IP sumber, apa yang sudah dicek.
- **23.40** Alert "eksekusi PowerShell terenkode" dari EDR. Setelah dicek, ternyata skrip inventaris resmi tim TI yang dijadwalkan. Anda menutupnya sebagai *benign*, lalu mengusulkan pengecualian yang **spesifik** (hash skrip dan host tertentu) ke L3, bukan mematikan aturannya.
- **02.15** Alert DNS: satu host menanyakan ratusan subdomain acak ke satu domain. Anda menandai kemungkinan *DNS tunneling* atau DGA, memeriksa reputasi domain di sumber intelijen ancaman, lalu eskalasi.
- **06.30** Serah terima shift: Anda menulis ringkasan kasus terbuka agar shift pagi tidak mengulang pekerjaan.

### 4.2 Tanggung jawab dan ukuran keberhasilan

Memantau, men-triase, menginvestigasi, mendokumentasikan, dan mengeskalasi. Di SOC yang matang, analis juga menyetel aturan deteksi dan menulis *playbook*.

KPI umum: **MTTD** (*mean time to detect*), waktu triase per alert terhadap SLA kontrak (MSSP biasanya punya SLA respons per tingkat keparahan), rasio *false positive*, akurasi eskalasi (berapa eskalasi yang memang insiden), kualitas catatan kasus, dan cakupan deteksi terhadap teknik MITRE ATT&CK yang relevan.

> [!WARNING]
> Jebakan terbesar SOC adalah **kelelahan alert**. Analis yang menutup alert secepat mungkin demi angka KPI justru berbahaya. Pemberi kerja yang baik menilai ketelitian, bukan hanya kecepatan.

### 4.3 Keahlian dan alat

**Teknis:** TCP/IP yang solid (Anda harus bisa membaca *handshake*, DNS, HTTP, TLS di tingkat paket), log Windows (Event ID penting seperti logon, pembuatan proses, pembuatan layanan), log Linux dan syslog, cara kerja malware secara konseptual, MITRE ATT&CK, bahasa kueri SIEM (SPL di Splunk, KQL di Microsoft Sentinel), dasar Python untuk otomasi kecil.

**Non-teknis:** menulis ringkas dan jelas, tetap tenang di shift malam, rasa ingin tahu ("kenapa host ini bicara ke sana jam 2 pagi?"), dan disiplin dokumentasi.

**Alat:** Splunk, Microsoft Sentinel, IBM QRadar, Elastic Security, Wazuh (populer di organisasi dengan anggaran terbatas), EDR seperti Microsoft Defender for Endpoint atau CrowdStrike Falcon, Suricata dan Zeek untuk sensor jaringan, MISP dan TheHive untuk intelijen ancaman dan manajemen kasus, VirusTotal untuk reputasi.

### 4.4 Sertifikasi per jenjang (status 2026)

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | CompTIA Security+ (SY0-701) | Fondasi paling umum di lowongan. |
| Pemula | Cisco CCNA Cybersecurity (ujian 200-201 CCNACBR v1.2) | Nama baru dari CyberOps Associate; ujiannya masih bernomor 200-201. Sangat cocok untuk SOC. |
| Pemula | ISC2 Certified in Cybersecurity (CC) | Tanpa syarat pengalaman, cocok untuk mahasiswa dan peralih karier. |
| Menengah | CompTIA CySA+ (CS0-004) | Versi V4 rilis 23 Juni 2026; ujian CS0-003 berbahasa Inggris pensiun 22 Desember 2026. CompTIA merekomendasikan sekitar 4 tahun pengalaman sebagai SOC atau vulnerability analyst. |
| Menengah | GIAC GCIA (kursus SANS SEC503) | Analisis lalu lintas dan IDS (Snort, Zeek). Mahal, tetapi sangat dihargai. |
| Menengah | Palo Alto Networks XSIAM Analyst atau Security Operations Professional | Relevan jika SOC Anda memakai platform Cortex. |
| Indonesia | LSP BSSN Level 1 dan Level 2 SOC Analyst; SKKNI SOC (Kepmenaker 391/2020) | Jalur kompetensi nasional. |

### 4.5 Jalur masuk dan progresi

Ini adalah **pintu masuk paling realistis** ke dunia keamanan bagi lulusan baru. Jalur yang sering terlihat: helpdesk, NOC technician, atau network administrator, lalu SOC L1. Program magang atau *graduate program* di bank dan MSSP juga sering merekrut SOC L1.

Progresi: L1 → L2 → L3 atau *threat hunter* / *detection engineer* → **incident responder**, *threat intelligence analyst*, atau SOC lead. Dari jaringan, nilai tambah Anda besar: banyak analis yang kuat di endpoint justru lemah membaca lalu lintas jaringan.

### 4.6 Pasar kerja Indonesia

Perekrut: **bank** (SEOJK 29/2022 mewajibkan kemampuan deteksi dan tim tanggap insiden), **MSSP dan penyedia SOC-as-a-service**, **operator telekomunikasi**, **BUMN** di sektor IIV (yang menurut Perpres 82/2022 wajib membentuk CSIRT), **instansi pemerintah** dan CSIRT pemerintah daerah, serta **startup fintech dan e-commerce** dengan basis pengguna besar.

### 4.7 Belajar dari kurikulum ini

`01-model-referensi/03-enkapsulasi` → `05-transport/02-tcp` → `06-aplikasi/01-dns` → `06-aplikasi/05-layanan-lain` → `12-keamanan/01-konsep-keamanan` → `12-keamanan/03-serangan-l3-l7` → `12-keamanan/06-tools-keamanan` → `14-monitoring-troubleshooting/03-observability` → `20-proyek-akhir/07-babak-6-tim-merah-tim-biru`

### 4.8 Proyek portofolio dan pertanyaan wawancara

**Proyek:**
1. *Home SOC*: Wazuh atau Elastic Security, ditambah sensor Suricata dan Zeek di depan lab Windows dan Linux. Tulis lima aturan deteksi, petakan masing-masing ke teknik ATT&CK, uji dengan simulasi yang aman (misalnya Atomic Red Team di lab tertutup), dan dokumentasikan hasilnya.
2. Analisis PCAP latihan publik (misalnya dari malware-traffic-analysis.net): buat laporan triase satu halaman berisi temuan, indikator, dan rekomendasi.
3. *Playbook* triase untuk tiga jenis alert umum (phishing, login mencurigakan, malware di endpoint) dalam format yang bisa dipakai L1.

**Pertanyaan wawancara khas:**
- "Ada alert login sukses dari Singapura untuk akun direktur yang biasanya login dari Surabaya. Apa yang Anda periksa, berurutan?"
- "Bagaimana membedakan *beaconing* malware dari aplikasi sah yang rutin *polling* ke server?"
- "Kapan Anda menutup alert sebagai *false positive*, dan apa yang Anda tulis di catatan kasus?"

---

## 5. Penetration Tester

### 5.1 Apa yang sebenarnya dikerjakan

Penetration tester (pentester) adalah **penguji keamanan yang disewa dan diberi izin tertulis** untuk mencari celah sebelum penjahat menemukannya. Bagian yang paling sering dibayangkan orang (menemukan celah) justru hanya sebagian. Satu proyek tipikal di sebuah konsultan keamanan Jakarta untuk klien bank digital, selama dua minggu:

- **Minggu 0 (sebelum mulai):** rapat *kick-off*. Klien dan konsultan menandatangani kontrak, NDA, dan **Rules of Engagement (RoE)**: daftar IP, domain, dan aplikasi yang boleh diuji; yang dikecualikan (misalnya sistem *core banking* produksi); jendela waktu pengujian; teknik yang dilarang (misalnya *denial of service*, rekayasa sosial ke nasabah); kontak darurat 24 jam; prosedur jika menemukan celah kritis atau tanda bahwa sistem **sudah** dibobol pihak lain.
- **Hari 1-3:** pengintaian dan pemetaan dalam cakupan, pemindaian kerentanan, dan memahami logika bisnis aplikasi.
- **Hari 4-8:** validasi temuan secara terkendali. Tujuannya membuktikan dampak dengan bukti minimal, bukan merusak. Satu temuan kritis (misalnya kontrol akses yang memungkinkan melihat data nasabah lain) **langsung dilaporkan ke kontak darurat**, tidak menunggu laporan akhir.
- **Hari 9-12:** menulis laporan: ringkasan eksekutif untuk direksi, rincian teknis untuk tim TI, tingkat risiko (misalnya dengan CVSS dan konteks bisnis), langkah reproduksi untuk tim internal, dan rekomendasi perbaikan.
- **Beberapa minggu kemudian:** *retest* untuk memastikan perbaikan efektif.

Untuk bank, pengujian ini bukan pilihan: SEOJK 29/2022 mengatur pengujian keamanan siber berbasis analisis kerentanan yang dilanjutkan *penetration test*, dan hasilnya dilaporkan ke OJK.

### 5.2 Etika dan legalitas: bagian yang tidak bisa ditawar

> [!WARNING]
> **Tanpa izin tertulis, tidak ada pentest.** Yang ada hanya akses ilegal. Pasal 332 KUHP (berlaku sejak 2 Januari 2026) mengancam akses ke sistem elektronik orang lain secara tanpa hak, termasuk dengan menjebol sistem pengamanan, dengan pidana penjara hingga 8 tahun. Niat baik tidak menggantikan izin.

Prinsip kerja yang harus menjadi kebiasaan:

1. **Izin dari pihak yang berwenang.** Tanda tangan harus dari pemilik sistem atau pejabat yang berwenang atas sistem itu, bukan sekadar staf TI yang "mengizinkan lisan". Jika aset berada di cloud atau hosting pihak ketiga, pastikan kebijakan penyedia tersebut juga dipatuhi.
2. **Patuhi cakupan secara harfiah.** IP di luar daftar, subdomain yang "kelihatannya milik klien", atau sistem pihak ketiga yang terhubung tidak boleh disentuh tanpa amandemen tertulis.
3. **Minimalkan dampak.** Ambil bukti secukupnya. Jangan mengunduh data pribadi massal untuk "membuktikan" celah; UU PDP berlaku juga untuk data yang Anda lihat saat pengujian.
4. **Kerahasiaan.** Temuan adalah informasi sangat sensitif. Simpan terenkripsi, bagikan hanya ke pihak yang ditunjuk, dan hapus sesuai kontrak.
5. **Hentikan dan laporkan** jika menemukan tanda pembobolan nyata oleh pihak lain. Itu sudah menjadi kasus insiden, bukan lagi pentest.
6. **Bug bounty dan pengungkapan kerentanan** hanya dalam program resmi yang menyebut cakupan dan aturan tertulis. Menemukan celah di luar program lalu meminta imbalan dapat dianggap pemerasan.

> [!TIP]
> Untuk belajar, gunakan lingkungan yang memang dibuat untuk diserang: lab pribadi, mesin sengaja rentan (OWASP Juice Shop, DVWA), atau platform latihan legal seperti Hack The Box, TryHackMe, dan OffSec Proving Grounds. Modul ini sengaja tidak memuat langkah eksploitasi; fokusnya pada metodologi, pelaporan, dan batas hukum.

### 5.3 Tanggung jawab dan ukuran keberhasilan

Merencanakan pengujian bersama klien, menjalankan pengujian dalam cakupan, mendokumentasikan bukti, menulis laporan, mempresentasikan temuan, dan melakukan *retest*. Pentester senior juga merancang skenario *red team* atau *purple team* bersama tim biru.

Ukuran keberhasilan: **kualitas temuan** (relevan, terbukti, tidak sekadar salinan hasil pemindai otomatis), kejelasan laporan (bisakah tim TI klien mereproduksi dan memperbaiki?), ketepatan waktu, nol insiden akibat pengujian, dan persentase temuan yang tertutup saat *retest*.

### 5.4 Keahlian dan alat

**Teknis:** jaringan dan protokol (Anda akan memindai subnet, membaca layanan, memahami TLS), Linux dan Windows, Active Directory, aplikasi web dan API (OWASP Top 10:2025), dasar kriptografi, scripting Python atau Bash, serta cloud dasar.

**Non-teknis:** **menulis laporan** adalah keahlian nomor satu yang membedakan pentester bayaran tinggi dari pemburu CTF. Presentasi ke direksi, etika, dan ketelitian administrasi (log aktivitas pengujian dengan cap waktu) sama pentingnya.

**Alat:** Kali Linux, Nmap, Burp Suite, ZAP, Nessus atau OpenVAS, Metasploit Framework, BloodHound (analisis jalur di Active Directory), Wireshark, serta alat pelaporan seperti Dradis atau SysReptor. Alat hanya mempercepat; metodologi (PTES, OWASP Web Security Testing Guide, ATT&CK) yang membuat hasilnya bisa dipertanggungjawabkan.

### 5.5 Sertifikasi per jenjang (status 2026)

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | EC-Council CEH (versi 13, "CEH AI") | Ujian pengetahuan 125 soal selama 4 jam; ujian praktik opsional 6 jam (20 tantangan) untuk tingkat CEH Master. Lebih menguji pengetahuan daripada keterampilan praktik, jadi lengkapi dengan portofolio. |
| Pemula | LSP BSSN Junior Penetration Tester (BNSP) | Berbasis SKKNI Uji Keamanan Siber (Kepmenaker 23/2022). |
| Menengah | CompTIA PenTest+ (PT0-003) | Rilis 17 Desember 2024; rekomendasi 3-4 tahun pengalaman. |
| Menengah | OffSec OSCP+ (kursus PEN-200) | Ujian praktik yang dihormati industri. Sejak 1 November 2024 lulusan baru menerima OSCP+ (berlaku 3 tahun, perlu diperbarui) sekaligus OSCP (seumur hidup). |
| Menengah | TCM Security PNPT | Ujian praktik 5 hari, 2 hari menulis laporan, lalu *debrief* langsung 15 menit di depan penilai. Menekankan OSINT, Active Directory, dan komunikasi. |
| Menengah | GIAC GPEN (kursus SANS SEC560) | Pentest jaringan perusahaan. |
| Indonesia | LSP BSSN Penetration Tester | Skema lanjutan yang diuji sejak 2024. |

### 5.6 Jalur masuk dan progresi

Jalur realistis: **network/system administrator atau SOC analyst (1-3 tahun) → junior pentester di konsultan**. Konsultan keamanan dan Big Four memang membuka posisi junior untuk lulusan baru, tetapi pelamar dengan portofolio (laporan latihan, *write-up* CTF, peringkat di platform latihan) dan satu sertifikasi praktik jauh lebih unggul.

Progresi: pentester → senior/lead pentester → *red team operator* atau manajer layanan *offensive security* → **security architect** atau **IT consultant** keamanan. Banyak pentester berpengalaman juga menyeberang ke tim internal sebagai *application security engineer*.

### 5.7 Pasar kerja Indonesia

Perekrut: **konsultan keamanan siber** lokal dan internasional, firma audit Big Four, **system integrator**, **bank** (tim internal yang melengkapi pengujian pihak ketiga), **startup fintech dan e-commerce**, serta lembaga pemerintah. Kebutuhan didorong regulasi (SEOJK 29/2022 untuk bank) dan audit ISO/IEC 27001.

### 5.8 Belajar dari kurikulum ini

`04-network-layer/02-subnetting` → `05-transport/01-port-socket` → `06-aplikasi/03-http` → `06-aplikasi/04-tls-pki` → `12-keamanan/02-serangan-l2` → `12-keamanan/03-serangan-l3-l7` → `12-keamanan/06-tools-keamanan` → `13-linux-networking/01-iproute2` → `15-otomasi/03-python-jaringan` → `20-proyek-akhir/07-babak-6-tim-merah-tim-biru`

### 5.9 Proyek portofolio dan pertanyaan wawancara

**Proyek:**
1. Laporan pentest profesional (format konsultan: ringkasan eksekutif, metodologi, temuan berperingkat, rekomendasi) terhadap lab sengaja rentan milik Anda sendiri, lengkap dengan **RoE tiruan** yang Anda tulis sendiri.
2. Kumpulan *write-up* mesin latihan yang sudah pensiun (*retired*) di platform legal, dengan fokus pada pelajaran defensif: "kontrol apa yang akan mencegah ini?"
3. Skrip Python kecil untuk merapikan hasil pemindaian menjadi tabel temuan yang siap masuk laporan.

**Pertanyaan wawancara khas:**
- "Di tengah pengujian Anda menemukan *web shell* yang bukan milik Anda di server klien. Apa yang Anda lakukan?"
- "Klien meminta Anda menguji satu subdomain tambahan lewat WhatsApp. Bagaimana Anda menanggapinya?"
- "Jelaskan satu temuan kritis kepada direktur yang tidak paham teknis dalam dua menit."

---

## 6. Security Architect

### 6.1 Apa yang sebenarnya dikerjakan

Security architect bekerja **sebelum** sistem dibangun, dan memastikan keputusan desain tidak menciptakan masalah yang mahal diperbaiki nanti. Contoh satu minggu di sebuah BUMN energi yang sedang memindahkan sebagian aplikasi ke cloud publik:

- **Senin:** sesi *threat modeling* bersama tim pengembang untuk aplikasi portal mitra baru. Anda memetakan aliran data, batas kepercayaan, dan ancaman (misalnya dengan metode STRIDE), lalu menetapkan kontrol wajib: autentikasi federasi dengan MFA, WAF, enkripsi data saat transit dan tersimpan, logging ke SIEM.
- **Selasa:** menulis *Architecture Decision Record* (ADR): mengapa akses administrator ke cloud wajib melalui *privileged access management* dan bukan VPN biasa. Anda mencantumkan alternatif yang ditolak beserta alasannya.
- **Rabu:** meninjau desain jaringan OT (*operational technology*) pembangkit bersama network architect: pemisahan zona IT dan OT, titik pemantauan, dan jalur akses vendor jarak jauh.
- **Kamis:** memetakan kontrol yang ada ke ISO/IEC 27001:2022 Lampiran A dan NIST CSF 2.0 untuk persiapan audit, serta ke kewajiban Perpres 82/2022 karena organisasi termasuk penyelenggara IIV.
- **Jumat:** presentasi ke komite risiko: tiga risiko arsitektur teratas, opsi mitigasi, perkiraan biaya, dan risiko residual yang perlu diterima secara formal oleh pemilik risiko.

### 6.2 Tanggung jawab dan ukuran keberhasilan

Menyusun arsitektur referensi dan standar keamanan (identitas, jaringan, data, cloud, aplikasi), meninjau desain proyek, *threat modeling*, memilih teknologi, mengelola pengecualian (*exception*) dan risiko residual, serta menjembatani bahasa teknis dan bahasa bisnis.

Ukuran keberhasilan: persentase proyek baru yang melewati tinjauan arsitektur keamanan sebelum produksi; jumlah temuan pentest atau audit yang akar masalahnya di desain (seharusnya turun); jumlah pengecualian aktif dan umurnya; adopsi arsitektur referensi oleh tim lain; serta skor maturitas (misalnya penilaian maturitas keamanan siber tahunan di bank sesuai SEOJK 29/2022).

### 6.3 Keahlian dan alat

**Teknis:** luas sekaligus cukup dalam. Jaringan dan segmentasi, zero trust, IAM dan federasi (SAML, OIDC), PKI dan kriptografi terapan, keamanan cloud (AWS, Azure, GCP) dan container, keamanan aplikasi, logging dan deteksi, serta pemahaman bagaimana serangan nyata berlangsung (ATT&CK).

**Non-teknis:** menulis dokumen desain yang dibaca orang, negosiasi, memahami anggaran dan prioritas bisnis, memfasilitasi lokakarya, serta mengakui bahwa tidak semua risiko harus dihapus; sebagian cukup diterima secara sadar.

**Alat:** diagram (draw.io, Visio, Archi untuk ArchiMate), alat *threat modeling* (OWASP Threat Dragon, Microsoft Threat Modeling Tool), CIS Benchmark, platform IAM (Microsoft Entra ID, Okta), manajemen rahasia (HashiCorp Vault), *cloud security posture management* (Microsoft Defender for Cloud, Wiz, Prisma Cloud), serta platform SSE/SASE.

### 6.4 Sertifikasi per jenjang (status 2026)

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Menengah | TOGAF Enterprise Architecture Foundation / Practitioner (The Open Group, TOGAF Standard 10th Edition) | Bahasa arsitektur enterprise; dibutuhkan saat bekerja bersama enterprise architect. |
| Menengah | SABSA Chartered Foundation (SCF) | Kerangka arsitektur keamanan berbasis risiko bisnis. Jenjang lanjut: SABSA Chartered Practitioner (SCP) dan Chartered Master (SCM). |
| Senior | ISC2 CISSP | Hampir selalu disebut di lowongan arsitek. Lima tahun pengalaman di minimal dua dari delapan domain; lulus ujian tanpa pengalaman cukup membuat Anda menjadi *Associate of ISC2* dengan enam tahun untuk memenuhinya. |
| Senior | CompTIA SecurityX (CAS-005) | Nama baru CASP+ sejak 17 Desember 2024; CAS-004 tidak tersedia lagi sejak 17 Juni 2025. Ditujukan untuk arsitek dan senior security engineer. |
| Senior | ISC2 CCSP | Keamanan cloud; enam domain dari arsitektur cloud sampai hukum dan kepatuhan. |
| Senior | Palo Alto Networks Network Security Architect | Relevan bila organisasi berstandar platform Palo Alto. |

### 6.5 Jalur masuk dan progresi

Ini **bukan posisi masuk**. Jalur umum: network security engineer, security engineer, atau pentester dengan 5-10 tahun pengalaman → security architect. Dari network engineer, jalurnya adalah network engineer → network security engineer → security architect, atau network architect yang memperdalam keamanan. Kunci transisinya adalah mulai ikut tinjauan desain dan menulis dokumen keputusan sejak masih engineer.

Progresi: principal/lead security architect → kepala arsitektur keamanan, CISO, atau konsultan senior. Arsitek juga sering berpindah lateral menjadi **solution architect** atau **IT consultant**.

### 6.6 Pasar kerja Indonesia

Perekrut: **bank besar dan grup keuangan**, **BUMN** di sektor IIV, **operator telekomunikasi**, **perusahaan teknologi dan startup** tahap lanjut, **konsultan** (termasuk Big Four), serta **system integrator** untuk posisi *presales security architect*. Michael Page dalam daftar pekerjaan bergaji tertinggi di Indonesia 2026 menempatkan *Cybersecurity Director* di urutan ketiga, sebuah indikasi bahwa jalur kepemimpinan keamanan, yang biasanya dilalui arsitek, dihargai tinggi.

### 6.7 Belajar dari kurikulum ini

`06-aplikasi/04-tls-pki` → `12-keamanan/01-konsep-keamanan` → `12-keamanan/04-aaa-identitas` → `12-keamanan/05-hardening-zero-trust` → `16-datacenter-cloud-sdn/04-cloud-networking` → `16-datacenter-cloud-sdn/05-container-kubernetes` → `17-desain-arsitektur/01-prinsip-desain` → `17-desain-arsitektur/02-desain-per-domain` → `17-desain-arsitektur/04-studi-kasus-desain` → `20-proyek-akhir/03-babak-2-sidang-arsitektur`

### 6.8 Proyek portofolio dan pertanyaan wawancara

**Proyek:**
1. Arsitektur referensi zero trust untuk bank fiktif: diagram, prinsip, kontrol per lapisan, dan tabel pemetaan ke NIST CSF 2.0 serta ISO/IEC 27001:2022 Lampiran A.
2. Tiga ADR untuk keputusan nyata (misalnya inspeksi TLS di perimeter, akses vendor jarak jauh, penyimpanan kunci enkripsi) lengkap dengan alternatif yang ditolak.
3. *Threat model* aplikasi sederhana (misalnya aplikasi absensi berbasis web) dengan STRIDE, daftar ancaman, dan kontrol terpilih.

**Pertanyaan wawancara khas:**
- "Direksi ingin semua karyawan bisa bekerja dari mana saja mulai bulan depan. Rancang arsitektur aksesnya dan sebutkan kompromi yang Anda terima."
- "Bagaimana Anda menolak desain dari tim yang sudah setengah jadi tanpa merusak hubungan kerja?"
- "Apa perbedaan arsitektur yang 'patuh' dan arsitektur yang 'aman'? Beri contoh dari regulasi Indonesia."

---

## 7. Incident Responder

### 7.1 Apa yang sebenarnya dikerjakan

Incident responder masuk ketika alert sudah terkonfirmasi sebagai insiden. Pekerjaannya menjawab empat pertanyaan secepat mungkin: **apa yang terjadi, seberapa luas, bagaimana menghentikannya, dan bagaimana memulihkan dengan aman.** Contoh insiden ransomware di sebuah perusahaan pembiayaan (diawasi OJK), Selasa:

- **03.20** SOC L2 mengeskalasi: puluhan file server berganti ekstensi dan EDR mendeteksi proses enkripsi massal. Anda menjadi *incident lead*.
- **03.35** Kontainmen awal: atas persetujuan manajer insiden, tim jaringan memutus segmen server terdampak dari jaringan lain dan memblokir koneksi keluar yang mencurigakan. Anda **tidak mematikan server** sembarangan karena bukti di memori bisa hilang; Anda meminta akuisisi memori dan disk dari dua host kunci terlebih dahulu.
- **05.00** Analisis cakupan: korelasi log VPN, Active Directory, dan EDR menunjukkan akun administrator yang dipakai penyerang masuk lewat VPN tanpa MFA tiga hari sebelumnya.
- **08.00** Rapat krisis dengan direksi, legal, dan komunikasi. Anda memaparkan fakta yang sudah pasti dan yang belum. Tim kepatuhan menyiapkan kewajiban pelaporan: ke OJK sesuai ketentuan bagi sektornya, dan bila ada data pribadi yang terungkap, pemberitahuan **3 x 24 jam** sesuai Pasal 46 UU PDP. Jika organisasi penyelenggara IIV, laporan ke TTIS sektoral paling lambat **1 x 24 jam** sesuai Peraturan BSSN 1/2024.
- **Hari 2-5:** eradikasi (reset kredensial, menutup jalur masuk, memastikan tidak ada *persistence*), pemulihan dari cadangan yang terverifikasi bersih, pemantauan ketat.
- **Minggu 2:** laporan pascainsiden tanpa menyalahkan individu: kronologi, akar masalah, apa yang berjalan baik, dan perbaikan konkret (misalnya MFA wajib untuk semua akses VPN).

### 7.2 Tanggung jawab dan ukuran keberhasilan

Menyusun dan menguji rencana tanggap insiden dan *playbook*, memimpin atau menjalankan penanganan, forensik digital tingkat dasar sampai lanjut, menjaga *chain of custody* bukti, berkoordinasi dengan legal, manajemen, regulator, dan pihak luar (CSIRT sektoral, penegak hukum), serta menjalankan latihan *tabletop*.

KPI umum: **waktu kontainmen** (*mean time to contain*), **MTTR** (*mean time to recover*), kepatuhan tenggat pelaporan regulasi (24 jam OJK untuk bank, 1 x 24 jam IIV, 3 x 24 jam UU PDP), persentase rekomendasi pascainsiden yang benar-benar diterapkan, dan frekuensi serta kualitas latihan simulasi (Peraturan BSSN 1/2024 mewajibkan simulasi minimal sekali dalam dua tahun bagi penyelenggara IIV; SEOJK 29/2022 mewajibkan pengujian berbasis skenario minimal setahun sekali bagi bank).

### 7.3 Keahlian dan alat

**Teknis:** forensik Windows dan Linux (artefak, timeline), forensik memori, analisis lalu lintas jaringan, log cloud, Active Directory, triase malware dasar, penulisan indikator (YARA, Sigma), serta pemahaman arsitektur jaringan untuk menentukan titik kontainmen yang tepat.

**Non-teknis:** tenang di bawah tekanan, memimpin rapat krisis, menulis kronologi yang akurat, memisahkan fakta dari dugaan, dan memahami kewajiban hukum serta pelaporan.

**Alat:** Velociraptor, KAPE, Volatility 3, FTK Imager, Timesketch, Wireshark dan Zeek, SIEM (Splunk, Sentinel, Elastic), EDR, TheHive untuk manajemen kasus, serta YARA.

### 7.4 Sertifikasi per jenjang (status 2026)

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula-menengah | CompTIA CySA+ (CS0-004) | Mencakup deteksi, analisis, dan respons. |
| Menengah | GIAC GCIH (kursus SANS SEC504) | Penanganan insiden dan teknik penyerang; 106 soal, 4 jam. Salah satu sertifikasi IR paling dikenal. |
| Menengah-senior | GIAC GCFA (kursus SANS FOR508) | Forensik lanjutan, respons insiden, dan *threat hunting*. |
| Senior | ISC2 CISSP | Untuk peran manajer insiden atau kepala CSIRT. |
| Indonesia | LSP BSSN Associate Digital Evidence First Responder; SKKNI SOC (Kepmenaker 391/2020) | Relevan untuk penanganan bukti digital dan kegiatan SOC. |

### 7.5 Jalur masuk dan progresi

Jalur khas: **SOC L1 → L2 → incident responder**, atau **system/network administrator** berpengalaman yang sering terlibat saat insiden lalu memperdalam forensik. Network engineer punya keunggulan nyata: dalam insiden, keputusan "segmen mana yang diputus, dan apa dampaknya ke layanan lain" adalah keputusan jaringan.

Progresi: senior IR → IR lead atau kepala CSIRT → manajer keamanan; atau ke **security architect** (membawa pelajaran insiden ke desain), atau ke **disaster recovery specialist** karena irisan besar di kelangsungan bisnis.

### 7.6 Pasar kerja Indonesia

Perekrut: **bank dan lembaga keuangan** (SEOJK 29/2022 mensyaratkan tim tanggap insiden yang dipimpin pejabat dari unit keamanan siber), **BUMN dan penyelenggara IIV** (wajib CSIRT menurut Perpres 82/2022), **instansi pemerintah** termasuk CSIRT sektoral dan pemerintah daerah di bawah koordinasi BSSN, **MSSP** yang menjual layanan *incident response retainer*, serta **konsultan forensik digital**.

### 7.7 Belajar dari kurikulum ini

`06-aplikasi/01-dns` → `06-aplikasi/05-layanan-lain` → `12-keamanan/03-serangan-l3-l7` → `12-keamanan/06-tools-keamanan` → `14-monitoring-troubleshooting/01-metodologi` → `14-monitoring-troubleshooting/02-tools` → `14-monitoring-troubleshooting/03-observability` → `20-proyek-akhir/02-babak-1-audit-warisan` → `20-proyek-akhir/09-babak-8-malam-panjang`

### 7.8 Proyek portofolio dan pertanyaan wawancara

**Proyek:**
1. Rencana tanggap insiden dan dua *playbook* (ransomware dan phishing yang berujung pengambilalihan akun) untuk perusahaan fiktif, mengacu ke NIST SP 800-61r3 dan Peraturan BSSN 1/2024, dengan tabel tenggat pelaporan (OJK, BSSN, UU PDP) dan matriks siapa memutuskan apa.
2. Investigasi lab: jalankan simulasi serangan aman di lab Anda sendiri, kumpulkan artefak dengan Velociraptor, susun timeline di Timesketch, dan tulis laporan pascainsiden.
3. Skenario latihan *tabletop* 90 menit lengkap dengan "suntikan" kejadian per 15 menit, untuk dipakai tim TI kantor atau kampus.

**Pertanyaan wawancara khas:**
- "Server keuangan terinfeksi. Manajer TI ingin langsung memformat ulang agar layanan cepat pulih. Apa saran Anda dan kenapa?"
- "Bagaimana Anda menentukan apakah sebuah insiden wajib dilaporkan ke regulator, dan kepada siapa?"
- "Ceritakan bagaimana Anda menjaga *chain of custody* untuk image disk."

---

## 8. Transisi dari Network Engineer/Administrator: Peta Praktis

Anda tidak memulai dari nol. Tabel ini memetakan keahlian jaringan yang sudah ada ke kebutuhan tiap peran:

| Yang sudah Anda kuasai | Dipakai sebagai | Yang perlu ditambah |
|---|---|---|
| ACL, NAT, firewall zona | Kebijakan NGFW, segmentasi (NSE) | Inspeksi aplikasi, IPS, manajemen aturan skala besar |
| Membaca paket dengan Wireshark | Investigasi alert jaringan (SOC, IR) | Log endpoint Windows, kueri SIEM |
| VPN IPsec, AAA, 802.1X | Akses jarak jauh aman, NAC (NSE, arsitek) | MFA, federasi identitas, zero trust |
| Subnetting, port, protokol | Pemetaan cakupan dan layanan (pentest) | Keamanan aplikasi web dan Active Directory |
| Desain topologi dan dokumentasi | Arsitektur keamanan, ADR | Threat modeling, kerangka risiko, regulasi |
| Troubleshooting bermetodologi | Investigasi insiden yang sistematis | Forensik, kewajiban pelaporan, komunikasi krisis |
| Syslog, SNMP, monitoring | Sumber log untuk SIEM | Rekayasa deteksi, ATT&CK |

Urutan yang realistis untuk seorang network administrator dengan 1-2 tahun pengalaman:

1. Kuasai tahap `12-keamanan` kurikulum ini sampai bisa menjelaskan setiap serangan beserta mitigasi dan cara mendeteksinya.
2. Ambil satu sertifikasi fondasi (Security+ atau CCNA Cybersecurity).
3. Minta tanggung jawab firewall atau VPN di tempat kerja sekarang, atau masuk SOC L1.
4. Bangun satu proyek portofolio dari bagian peran yang Anda incar.
5. Setelah 1-2 tahun, pilih spesialisasi: membangun (NSE), mendeteksi (SOC), menguji (pentest), atau menangani (IR). Arsitek datang belakangan.

> [!WARNING]
> Hindari jebakan "mengoleksi sertifikat". Pewawancara keamanan hampir selalu menanyakan skenario. Satu sertifikasi ditambah satu proyek yang bisa Anda ceritakan secara mendalam lebih meyakinkan daripada lima sertifikat tanpa cerita.

---

## 9. Latihan

1. Seorang teman yang baru lulus ingin menjadi penetration tester dan berencana "latihan" dengan memindai situs pemerintah daerahnya karena "toh hanya melihat, tidak merusak". Jelaskan kepadanya risiko hukum dan etikanya, lalu tawarkan tiga alternatif latihan yang legal.
2. Anda network administrator di sebuah bank perkreditan dan ingin pindah ke keamanan dalam 18 bulan. Susun rencana konkret: peran sasaran, sertifikasi, modul kurikulum, dan satu proyek portofolio. Jelaskan alasan pilihan Anda.
3. Sebuah bank umum mengalami insiden siber pukul 21.00 hari Jumat yang melibatkan data nasabah. Sebutkan kewajiban pelaporan yang mungkin berlaku beserta tenggatnya, dan siapa di organisasi yang biasanya mengoordinasikannya.
4. Di SOC, Anda menerima alert "PowerShell terenkode" yang ternyata skrip resmi tim TI. Rekan Anda mengusulkan mematikan aturan deteksinya agar tidak berisik. Apa usulan Anda yang lebih baik, dan mengapa?
5. Saat pentest, klien meminta lewat telepon agar Anda "sekalian" menguji aplikasi milik anak perusahaan yang tidak ada di RoE. Bagaimana Anda menanganinya secara profesional?
6. Bandingkan peran security architect dan network security engineer saat organisasi memutuskan menerapkan akses jarak jauh berbasis zero trust. Siapa mengerjakan apa?
7. Dalam insiden ransomware, manajer TI ingin segera mematikan semua server terdampak. Jelaskan pertimbangan Anda sebagai incident responder, termasuk soal bukti dan kontainmen.
8. Seorang rekrutan menyebut "Saya pegang CASP+ dan sedang mempersiapkan CySA+ CS0-003." Apa yang perlu Anda perbarui dari informasinya per akhir 2026, dan apakah sertifikatnya masih bernilai?

<details>
<summary>Jawaban</summary>

1. Akses ke sistem elektronik orang lain tanpa hak dapat dijerat Pasal 332 KUHP yang berlaku sejak 2 Januari 2026, dengan ancaman hingga 8 tahun penjara jika menjebol sistem pengamanan. Pemindaian tanpa izin juga bisa dianggap persiapan serangan, memicu alarm SOC instansi, dan dilaporkan ke BSSN atau polisi. Secara etika, pentester dibedakan dari penyerang oleh izin tertulis dan kepatuhan pada cakupan, bukan oleh niat. Alternatif legal: membangun lab sendiri (VM sengaja rentan seperti OWASP Juice Shop atau DVWA), memakai platform latihan seperti Hack The Box, TryHackMe, atau OffSec Proving Grounds, dan mengikuti program bug bounty atau pengungkapan kerentanan resmi yang mencantumkan cakupan tertulis.

2. Contoh rencana yang masuk akal: sasaran network security engineer (paling dekat dengan latar jaringan) dengan opsi SOC L1 sebagai pintu masuk. Bulan 1-4: tuntaskan `09-nat-acl-firewall/03-firewall`, tahap `12-keamanan`, dan `13-linux-networking/03-nftables-firewall`; lulus Security+ SY0-701 (atau V8 jika sudah rilis). Bulan 5-10: proyek lab segmentasi dengan firewall virtual dan logging ke Wazuh; ambil NSE 4 jika bank memakai Fortinet; minta dilibatkan dalam pengelolaan firewall di kantor. Bulan 11-18: perdalam VPN dan NAC, mulai belajar untuk CCNP Security (SCOR v2.0), lalu melamar posisi NSE atau security engineer di bank lain atau system integrator. Alasannya: memanfaatkan keahlian yang sudah ada, dan bank membutuhkan peran ini karena tuntutan POJK 11/2022 dan SEOJK 29/2022.

3. Ke OJK: notifikasi awal paling lama 24 jam setelah insiden diketahui dan laporan insiden lengkap paling lama 5 hari kerja (SEOJK 29/SEOJK.03/2022). Jika data pribadi terungkap: pemberitahuan tertulis kepada subjek data dan lembaga paling lambat 3 x 24 jam (Pasal 46 UU PDP), berisi data yang terungkap, kapan dan bagaimana, serta upaya penanganan. Karena keuangan termasuk sektor IIV, jika sistem yang terdampak termasuk IIV maka TTIS organisasi melapor ke TTIS sektoral dengan tembusan ke TTIS nasional paling lambat 1 x 24 jam (Peraturan BSSN 1/2024). Koordinasinya biasanya oleh unit keamanan siber (yang harus independen dari fungsi pengelola TI) bersama kepatuhan, legal, dan manajemen. Tenggat dihitung sejak insiden diketahui, jadi akhir pekan tidak menunda kewajiban.

4. Mematikan aturan membuat organisasi buta terhadap penyalahgunaan PowerShell oleh penyerang sungguhan, yang merupakan teknik umum di ATT&CK. Usulan yang lebih baik adalah pengecualian sempit: hanya untuk hash skrip tertentu, akun layanan tertentu, dan host atau jadwal tertentu, didokumentasikan dengan pemilik dan tanggal tinjauan. Aturan tetap aktif untuk semua kasus lain. Catat juga di kasus bahwa alert ditutup sebagai benign beserta buktinya, agar analis lain tidak mengulang investigasi.

5. Tolak dengan sopan untuk menguji sebelum ada amandemen tertulis. Jelaskan bahwa RoE adalah dasar hukum pengujian; aplikasi anak perusahaan mungkin badan hukum berbeda yang membutuhkan izin dari pejabat berwenangnya sendiri, mungkin berada di infrastruktur pihak ketiga, dan tidak tercakup asuransi atau kontrak. Tawarkan proses resmi: perubahan cakupan tertulis yang ditandatangani pihak berwenang, penyesuaian jadwal dan biaya, lalu dokumentasikan permintaan lisan itu di catatan proyek.

6. Security architect menentukan prinsip dan desain: model kepercayaan, syarat identitas (MFA, federasi), pemeriksaan postur perangkat, segmentasi aplikasi, kebutuhan logging, pemetaan ke kebijakan dan regulasi, serta menerima atau menolak kompromi. Network security engineer mengimplementasikan dan mengoperasikan: mengonfigurasi platform ZTNA/SSE atau VPN dengan pemeriksaan postur, kebijakan per aplikasi, integrasi dengan IdP dan NAC, uji coba, migrasi bertahap pengguna, pemantauan, dan *rollback*. Keduanya bekerja bersama saat uji coba untuk memastikan desain bisa dijalankan.

7. Mematikan server secara mendadak menghapus bukti di memori (proses, koneksi jaringan, kunci enkripsi yang mungkin masih ada) dan tidak otomatis menghentikan penyebaran. Kontainmen yang lebih tepat biasanya isolasi jaringan (memutus segmen atau mengisolasi host lewat EDR) sambil mengakuisisi memori dan disk dari host kunci. Keputusan tetap mempertimbangkan bisnis: jika enkripsi masih berjalan aktif dan isolasi tidak mungkin cepat, mematikan sebagian host bisa dibenarkan, asalkan dicatat. Prinsipnya: hentikan penyebaran, lindungi bukti, dokumentasikan setiap tindakan beserta waktunya.

8. CASP+ sudah berganti nama menjadi CompTIA SecurityX sejak 17 Desember 2024 dengan ujian CAS-005; pemegang CASP+ aktif otomatis menerima lencana SecurityX, jadi sertifikatnya tetap bernilai selama masih aktif (diperpanjang lewat program pendidikan berkelanjutan). Untuk CySA+, versi terbaru adalah CS0-004 (rilis 23 Juni 2026), sedangkan ujian CS0-003 berbahasa Inggris pensiun 22 Desember 2026. Sarankan ia mempertimbangkan CS0-004 bila jadwal ujiannya mendekati atau melewati tanggal itu, karena produk pembelajaran resmi CS0-003 berbahasa Inggris juga ditarik mulai 22 November 2026.

</details>

---

## 10. Sumber

- NIST Cybersecurity Framework 2.0: https://www.nist.gov/cyberframework
- NIST SP 800-61 Rev. 3, Incident Response Recommendations and Considerations for Cybersecurity Risk Management: https://csrc.nist.gov/pubs/sp/800/61/r3/final
- MITRE ATT&CK, riwayat versi: https://attack.mitre.org/resources/versions/
- OWASP Top 10:2025: https://owasp.org/Top10/2025/
- NICE Framework Work Roles (NICCS, CISA): https://niccs.cisa.gov/workforce-development/nice-framework/work-roles
- O*NET OnLine, Penetration Testers (15-1299.04) dan Information Security Engineers (15-1299.05): https://www.onetonline.org/link/summary/15-1299.04
- CompTIA Security+: https://www.comptia.org/en/certifications/security/
- CompTIA CySA+ V4 (CS0-004): https://www.comptia.org/en/certifications/cybersecurity-analyst/v4/
- CompTIA PenTest+ (PT0-003): https://www.comptia.org/en/certifications/pentest/
- CompTIA SecurityX (CAS-005): https://www.comptia.org/en/certifications/securityx/
- Cisco, ujian 200-201 CCNACBR (CCNA Cybersecurity): https://www.cisco.com/site/us/en/learn/training-certifications/exams/cbrops.html
- Cisco Learning Blog, Cisco Security Certification Updates (SCOR v2.0): https://blogs.cisco.com/learning/cisco-security-certification-updates-your-questions-answered
- Fortinet NSE Certification Program: https://www.fortinet.com/training-certification
- Palo Alto Networks Certification: https://www.paloaltonetworks.com/services/education/certification
- EC-Council Certified Ethical Hacker: https://www.eccouncil.org/train-certify/certified-ethical-hacker-ceh/
- OffSec, Everything you need to know about the OSCP+: https://www.offsec.com/blog/everything-you-need-to-know-about-the-oscp-plus/
- TCM Security, PNPT: https://certifications.tcm-sec.com/pnpt/
- GIAC GCIH: https://www.giac.org/certifications/certified-incident-handler-gcih/
- GIAC GCIA: https://www.giac.org/certifications/certified-intrusion-analyst-gcia/
- GIAC GPEN: https://www.giac.org/certifications/penetration-tester-gpen/
- GIAC GCFA: https://www.giac.org/certifications/certified-forensic-analyst-gcfa/
- ISC2 CISSP Experience Requirements: https://www.isc2.org/certifications/cissp/cissp-experience-requirements
- ISC2 CCSP: https://www.isc2.org/certifications/ccsp
- ISC2 Certified in Cybersecurity (CC): https://www.isc2.org/certifications/cc
- The SABSA Institute, Certification: https://sabsa.org/certification/
- The Open Group, TOGAF Certification Portfolio: https://www.opengroup.org/certifications/togaf
- OJK, Ringkasan SEOJK 29/SEOJK.03/2022 tentang Ketahanan dan Keamanan Siber bagi Bank Umum: https://www.ojk.go.id/id/regulasi/Documents/Pages/Ketahanan-dan-Keamanan-Siber-Bagi-Bank-Umum/RINGKASAN%20SEOJK%2029%20-%2003%20-%202022-1.pdf
- Peraturan BSSN Nomor 1 Tahun 2024 tentang Pengelolaan Insiden Siber: https://peraturan.go.id/files/peraturan-bssn-no-1-tahun-2024.pdf
- Peraturan BSSN Nomor 2 Tahun 2024 tentang Manajemen Krisis Siber: https://peraturan.go.id/files/peraturan-bssn-no-2-tahun-2024.pdf
- Perpres 47 Tahun 2023 tentang Strategi Keamanan Siber Nasional dan Manajemen Krisis Siber: https://peraturan.bpk.go.id/Details/255542
- Sekretariat Kabinet, Perpres 82/2022 tentang Pelindungan Infrastruktur Informasi Vital: https://setkab.go.id/presiden-terbitkan-perpres-82-2022-tentang-pelindungan-infrastruktur-informasi-vital/
- UU 27/2022 tentang Pelindungan Data Pribadi, Pasal 46: https://pasal.id/peraturan/uu/uu-no-27-tahun-2022/pasal-46
- Hukumonline Klinik, jerat hukum akses ilegal (Pasal 332 KUHP baru): https://www.hukumonline.com/klinik/a/hack-akun-instagram-orang-lain-ini-jerat-hukumnya-lt50c51cada600a/
- JDIH Kemnaker, Kepmenaker 391/2020 (SKKNI Security Operations Center): https://jdih.kemnaker.go.id/peraturan/detail/1991/keputusan-menteri-ketenagakerjaan-nomor-391-tahun-2020
- JDIH Kemnaker, Kepmenaker 23/2022 (SKKNI Uji Keamanan Siber): https://jdih.kemnaker.go.id/peraturan/detail/2231/keputusan-menteri-ketenagakerjaan-nomor-23-tahun-2022
- JDIH Kemnaker, Kepmenaker 24/2022 (SKKNI Audit Keamanan Informasi): https://jdih.kemnaker.go.id/peraturan/detail/2232/keputusan-menteri-ketenagakerjaan-nomor-24-tahun-2022
- JDIH Kemnaker, Kepmenaker 191/2024 (SKKNI Keamanan Informasi): https://jdih.kemnaker.go.id/peraturan/detail/2539/keputusan-menteri-ketenagakerjaan-nomor-191-tahun-2024
- Republika, LSP BSSN gelar uji kompetensi skema sertifikasi baru (2024): https://news.republika.co.id/berita/se7bry349/tingkatkan-kompetensi-sdm-lsp-bssn-gelar-uji-kompetensi-skema-sertifikasi-baru
- Michael Page Indonesia, Highest-paying jobs in Indonesia 2026: https://www.michaelpage.co.id/recruitment-expertise/market-insights/highest-paying-jobs-indonesia

---

**Berikutnya:** `21-ekosistem-profesi/04-rumpun-operasi-sistem-data`. Rumpun operasi sistem dan data: system administrator, database administrator, storage administrator, system engineer, dan IT operations manager.

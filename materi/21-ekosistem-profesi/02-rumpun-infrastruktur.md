# 21.2 — Rumpun Infrastruktur: Jaringan, Telekomunikasi & Cloud

> **Prasyarat:** sudah membaca modul 21.1 (rumpun inti: network engineer dan network administrator), serta paham dasar routing (`07-routing-lanjutan/04-ospf`, `07-routing-lanjutan/06-bgp`) dan desain (`17-desain-arsitektur/01-prinsip-desain`).
> **Tujuan:** Anda mengenal tujuh profesi di rumpun infrastruktur (network architect, cloud network engineer, wireless network engineer, telecom engineer, VoIP engineer, data center engineer, NOC technician): pekerjaan hariannya, ukuran keberhasilannya, sertifikasi terkini, jalur masuk di Indonesia, dan modul kurikulum yang harus Anda kuasai untuk masing-masing.

---

## 1. Peta Rumpun Infrastruktur

Network engineer dan network administrator (modul 21.1) adalah "dokter umum" jaringan. Rumpun infrastruktur berisi para spesialis: orang yang memilih satu lapisan atau satu domain lalu menggalinya sampai dalam. Ada yang hidup di frekuensi radio, ada yang hidup di ruang server berpendingin, ada yang hidup di konsol cloud, dan ada yang duduk di depan dinding layar monitoring pada pukul tiga pagi.

Yang menyatukan mereka: semuanya membangun atau menjaga **jalan** yang dilewati data. Jika jalan itu putus, semua aplikasi di atasnya ikut berhenti, tidak peduli seberapa bagus kodenya.

| Profesi | Fokus utama | Jenjang masuk realistis | Sertifikasi kunci (2026) | Tempat kerja khas di Indonesia |
|---|---|---|---|---|
| NOC Technician | Memantau, mendeteksi, eskalasi insiden 24/7 | Pemula | Network+ N10-009, CCNA 200-301 v1.1, MTCNA, ITIL Foundation | ISP, operator, data center, bank, managed service provider |
| Telecom Engineer | Jaringan operator: akses radio, transport, fiber, core IP | Pemula (lulusan teknik telekomunikasi) | HCIA/HCIP-Datacom, CCNP Service Provider, ETA FOI | Operator seluler, vendor (Huawei, Ericsson, Nokia, ZTE), penyedia menara dan fiber |
| Wireless Network Engineer | Survei, desain, dan operasi WLAN | Menengah | CWNA-110, CCNP Wireless, CWDP-305, CWSP-208, MTCWE | System integrator, kampus, hotel, mal, pabrik, WISP |
| VoIP Engineer | Telepon IP, SIP trunk, contact center, UC | Menengah | CCNP Collaboration, MS-721 | System integrator, bank, BPO/contact center, ITSP |
| Data Center Engineer | Fasilitas DC, kabel terstruktur, fabric spine-leaf | Menengah | CDCP, Uptime ATS/ATD, BICSI DCDC, CCNP Data Center | Penyedia colocation, bank, BUMN, hyperscaler, PDN |
| Cloud Network Engineer | VPC/VNet, konektivitas hybrid, IaC | Menengah | AZ-700, Google PCNE, AWS SAA-C03, AWS ANS-C01 (pensiun akhir 2026) | Startup, bank digital, perusahaan migrasi cloud, partner AWS/Azure/GCP |
| Network Architect | Desain menyeluruh, standar, keputusan teknologi | Senior | CCNP Enterprise, CCDE, CCIE Enterprise Infrastructure | Bank, BUMN, operator, system integrator besar, konsultan |

💡 **Baca tabel itu dari atas ke bawah sebagai satu lintasan yang mungkin.** Banyak orang memulai di NOC, pindah ke peran spesialis (wireless, telekomunikasi, data center, cloud, VoIP), lalu setelah bertahun-tahun pengalaman lintas domain naik menjadi arsitek. Itu bukan satu-satunya jalan, tetapi itu jalan yang paling sering terlihat di Indonesia.

⚠️ **Nama jabatan di lowongan Indonesia tidak seragam.** "Network Engineer" di satu ISP bisa berarti pekerjaan NOC, sementara "NOC Engineer" di operator lain bisa berarti engineer level 2 yang mengonfigurasi BGP. Selalu baca deskripsi tugasnya, bukan judulnya.

---

## 2. Network Architect

### 2.1 Apa yang sebenarnya dikerjakan

Arsitek jaringan jarang mengetik konfigurasi di produksi. Pekerjaannya adalah membuat keputusan yang akan dijalankan orang lain selama lima tahun ke depan, lalu mempertanggungjawabkannya.

Contoh satu hari di sebuah bank nasional:

- **08.30**: rapat dengan tim aplikasi yang akan memindahkan core banking ke data center kedua. Mereka bertanya, "Bisa aktif-aktif?" Arsitek menjawab dengan pertanyaan balik: berapa RPO dan RTO yang diminta, berapa latensi antar-DC, dan apakah database-nya sanggup replikasi sinkron di jarak itu.
- **10.00**: meninjau *High-Level Design* (HLD) dari system integrator untuk SD-WAN 400 kantor cabang. Ia menandai tiga hal: tidak ada rencana ketika kedua jalur internet cabang mati bersamaan, skema alamat IP bentrok dengan anak perusahaan, dan QoS untuk suara belum didefinisikan.
- **13.00**: menulis *Architecture Decision Record* (ADR): mengapa EVPN-VXLAN dipilih untuk fabric DC baru, alternatif apa yang ditolak, dan risikonya.
- **15.00**: presentasi ke komite TI: anggaran, fase migrasi, dan risiko kepatuhan (POJK, UU PDP, penempatan data).

### 2.2 Tanggung jawab dan ukuran keberhasilan

- Menyusun standar dan pola desain (kampus, WAN, DC, cloud, keamanan) yang konsisten antar-proyek.
- Memastikan desain memenuhi target ketersediaan. Contoh: target 99,99% berarti downtime maksimum sekitar 52,6 menit per tahun, dan desain harus bisa membuktikan bagaimana angka itu dicapai.
- Ukuran keberhasilan: jumlah insiden besar yang akar masalahnya adalah desain (semakin sedikit semakin baik), proyek yang lolos uji terima tanpa desain ulang, biaya total kepemilikan, dan seberapa cepat tim operasional bisa memahami serta menjalankan desainnya.

### 2.3 Keahlian dan alat

**Teknis:** routing lanjutan (BGP, OSPF, redistribusi), desain WAN dan SD-WAN, fabric DC, konektivitas cloud, segmentasi dan zero trust, perencanaan kapasitas, perencanaan alamat IPv4 dan IPv6.

**Non-teknis:** menulis dokumen yang dipahami orang non-teknis, negosiasi dengan vendor, menerjemahkan kebutuhan bisnis (RTO, RPO, SLA) menjadi keputusan teknis, dan berkata "tidak" dengan alasan yang kuat.

**Alat yang umum:** draw.io atau Microsoft Visio untuk diagram, NetBox sebagai *source of truth*, Cisco Modeling Labs atau Containerlab untuk validasi desain, Batfish untuk menganalisis konfigurasi sebelum diterapkan, Terraform untuk sisi cloud, serta konsol manajemen vendor seperti Cisco Catalyst Center, Arista CloudVision, atau FortiManager.

O*NET (basis data okupasi Departemen Tenaga Kerja AS) merangkum tugas arsitek jaringan sebagai merancang desain konseptual, logis, dan fisik, menyiapkan spesifikasi detail, merekomendasikan langkah keamanan, dan merencanakan pemulihan bencana. Daftar itu cocok dengan praktik di Indonesia.

### 2.4 Sertifikasi per jenjang

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Menengah | **CCNP Enterprise**: ujian inti 350-401 ENCOR + satu konsentrasi, idealnya **300-420 ENSLD** (desain) | Konsentrasi lain: ENARSI, ENSDWI, ENAUTO, ENCC, ENNA |
| Menengah | **AWS Certified Solutions Architect – Associate (SAA-C03)** | Arsitek modern harus paham cloud |
| Senior | **CCDE**: ujian tertulis 400-007 + ujian praktik 8 jam (v3.1) | Satu-satunya sertifikasi expert Cisco yang murni desain |
| Senior | **CCIE Enterprise Infrastructure**: 350-401 ENCOR + lab 8 jam (v1.1) | Bukti kedalaman implementasi |

**Jalur Indonesia:** SKKNI bidang Jaringan Komputer (Kepmenaker No. 321 Tahun 2016) memuat unit-unit perancangan jaringan, dan skema sertifikasi BNSP disediakan oleh Lembaga Sertifikasi Profesi (LSP) berlisensi. Untuk jabatan arsitek, sertifikat BNSP biasanya pelengkap, bukan penentu. Pengalaman proyek jauh lebih menentukan.

### 2.5 Jalur masuk dan progresi

Hampir tidak ada yang langsung menjadi arsitek. Jalur paling umum: network engineer → senior network engineer yang mulai menulis desain → arsitek. Setiap langkah biasanya memakan beberapa tahun dan lebih ditentukan oleh jenis proyek yang pernah Anda pegang daripada oleh lamanya bekerja. Transisi dari network engineer terasa paling mulus karena fondasinya sama. Yang perlu ditambah adalah keluasan (cloud, keamanan, aplikasi) dan kemampuan menulis.

Dari arsitek jaringan, langkah berikutnya biasanya **solution architect** (cakupan lebih luas dari jaringan), **security architect**, atau **IT consultant**.

### 2.6 Pasar kerja Indonesia

Perekrut utama: bank besar dan bank digital, BUMN (energi, logistik, telekomunikasi), operator seluler, system integrator besar yang memenangkan tender pemerintah dan korporasi, serta vendor jaringan (pre-sales architect). Di system integrator, peran ini sering bernama *pre-sales engineer* atau *solution architect* dan dekat dengan tim penjualan.

### 2.7 Belajar dari kurikulum ini

`07-routing-lanjutan/06-bgp` → `11-wan-vpn/01-teknologi-wan` → `12-keamanan/05-hardening-zero-trust` → `16-datacenter-cloud-sdn/01-desain-dc` → `16-datacenter-cloud-sdn/04-cloud-networking` → `17-desain-arsitektur/01-prinsip-desain` → `17-desain-arsitektur/02-desain-per-domain` → `17-desain-arsitektur/03-perencanaan-dokumentasi` → `17-desain-arsitektur/04-studi-kasus-desain` → `20-proyek-akhir/03-babak-2-sidang-arsitektur`.

### 2.8 Portofolio dan wawancara

**Proyek:**
1. Desain lengkap jaringan perusahaan fiktif 3 kantor + 1 DC + 1 region cloud: HLD, LLD, rencana IP, ADR untuk tiga keputusan besar, dan analisis titik gagal tunggal.
2. Uji desain di Containerlab dengan BGP dan OSPF, lalu tunjukkan hasil simulasi kegagalan (cabut satu link, matikan satu router) beserta waktu konvergensinya.
3. Tulisan perbandingan "SD-WAN vs MPLS untuk 200 cabang ritel di Indonesia" dengan perhitungan biaya kasar dan risikonya.

**Pertanyaan wawancara khas:**
- "Klien minta DC aktif-aktif antara Jakarta dan Batam. Apa saja pertanyaan Anda sebelum menjawab bisa atau tidak?"
- "Ceritakan desain Anda yang gagal di lapangan. Apa yang Anda ubah setelahnya?"
- "Bagaimana Anda meyakinkan direksi untuk membiayai redundansi yang selama tiga tahun terakhir tidak pernah 'terpakai'?"

---

## 3. Cloud Network Engineer

### 3.1 Apa yang sebenarnya dikerjakan

Cloud network engineer membangun jaringan yang tidak bisa Anda sentuh. Tidak ada kabel, tetapi masalahnya tetap sama: alamat yang bentrok, rute yang salah, firewall yang terlalu longgar, dan DNS yang tidak menjawab.

Contoh skenario di sebuah fintech yang memakai AWS region Jakarta dan Azure Indonesia Central:

- Pagi: tim aplikasi tidak bisa memanggil API pembayaran dari VPC baru. Engineer memeriksa VPC Flow Logs, menemukan tabel rute subnet privat belum mengarah ke Transit Gateway, lalu memperbaikinya melalui *pull request* Terraform, bukan lewat klik di konsol.
- Siang: merancang ruang alamat untuk 12 akun AWS dan 4 subscription Azure agar tidak tumpang tindih dengan jaringan kantor (10.0.0.0/8 yang sudah dipakai sembarangan sejak 2015).
- Sore: menyiapkan koneksi hybrid ke DC on-premise: sirkuit privat (Direct Connect atau ExpressRoute) sebagai jalur utama, VPN IPsec sebagai cadangan, BGP untuk memilih jalur.
- Menjelang pulang: meninjau tagihan. Biaya transfer data antar-zona dan NAT gateway naik 40% karena satu layanan berbicara lintas zona tanpa perlu.

### 3.2 Tanggung jawab dan ukuran keberhasilan

- Merancang dan memelihara topologi jaringan cloud (hub-and-spoke, transit, landing zone).
- Menjaga konektivitas hybrid dan multi-cloud.
- Menerapkan kontrol keamanan jaringan (security group, NSG, firewall cloud, private endpoint).
- **Ukuran:** waktu menyediakan jaringan untuk proyek baru (hari, bukan minggu), nol konflik alamat, persentase perubahan yang lewat IaC (idealnya mendekati 100%), ketersediaan konektivitas hybrid, dan biaya jaringan per bulan yang terkendali.

### 3.3 Keahlian dan alat

**Teknis:** subnetting dan CIDR (sangat sering dipakai), BGP untuk konektivitas hybrid, DNS (resolusi privat lintas VPC dan on-premise adalah sumber masalah klasik), VPN IPsec, firewall, Terraform, Python, Git, dasar Kubernetes networking.

**Non-teknis:** bekerja dengan tim DevOps dan pengembang yang berpikir dalam bentuk kode, membaca tagihan cloud, mendokumentasikan pola standar agar tim lain bisa swalayan.

**Alat:** AWS VPC, Transit Gateway, Direct Connect; Azure Virtual Network, Virtual WAN, ExpressRoute; Google Cloud VPC dan Cloud Interconnect; Terraform; Ansible; GitHub Actions atau GitLab CI; VPC Flow Logs dan Azure Network Watcher.

### 3.4 Sertifikasi per jenjang

| Jenjang | Sertifikasi | Status per Oktober 2026 |
|---|---|---|
| Pemula/menengah | **AWS Certified Solutions Architect – Associate (SAA-C03)** | Aktif |
| Menengah | **Microsoft Certified: Azure Network Engineer Associate (AZ-700)** | Aktif; diperpanjang gratis tiap 12 bulan lewat asesmen daring |
| Menengah/senior | **Google Cloud Professional Cloud Network Engineer** | Aktif; disarankan 3+ tahun pengalaman industri, termasuk 1+ tahun di Google Cloud |
| Menengah | **CCNP Enterprise** dengan konsentrasi **300-440 ENCC** (Designing and Implementing Secure Cloud Connectivity) | Aktif |
| Senior | **AWS Certified Advanced Networking – Specialty (ANS-C01)** | **Sedang dipensiunkan.** Hari terakhir ujian 31 Desember 2026, tanpa pengganti yang diumumkan |

⚠️ **Jangan memulai persiapan ANS-C01 sekarang kecuali Anda yakin bisa ujian sebelum 31 Desember 2026.** Sertifikasi yang sudah diraih tetap berlaku, tetapi AWS tidak akan menerbitkannya lagi setelah tanggal itu. Untuk jalur AWS, SAA-C03 ditambah pengalaman nyata membangun konektivitas hybrid adalah bukti yang lebih tahan lama.

**Jalur Indonesia:** program Digital Talent Scholarship (Komdigi) secara berkala membuka pelatihan bertema cloud dan jaringan bersama mitra penyedia cloud. Periksa jadwalnya di situs resmi DTS.

### 3.5 Jalur masuk dan progresi

Jalur paling mulus: network engineer yang sudah kuat di subnetting, BGP, dan VPN lalu belajar Terraform. Jalur lain: DevOps engineer atau cloud engineer yang menambah kedalaman jaringan. Yang pertama biasanya lebih cepat paham "kenapa", yang kedua lebih cepat paham "bagaimana mengotomasinya". Keduanya saling melengkapi.

Progresi: senior cloud network engineer → **network architect** atau **solution architect** (cloud). Peran lateral yang dekat: **cloud infrastructure engineer** dan **DevOps engineer**.

### 3.6 Pasar kerja Indonesia

Ketiga penyedia cloud besar kini punya region di Indonesia: Google Cloud (Jakarta), AWS (Asia Pacific, Jakarta), dan Microsoft Azure (Indonesia Central, diumumkan tersedia umum pada 2025 dengan tiga availability zone). Kehadiran region lokal membuat bank, perusahaan asuransi, dan instansi yang terikat aturan penempatan data lebih leluasa memindahkan beban kerja ke cloud, dan itu menciptakan kebutuhan engineer yang paham jaringan hybrid.

Perekrut: startup dan unicorn, bank digital, perusahaan e-commerce, konsultan dan partner resmi AWS/Azure/Google Cloud, serta perusahaan besar yang sedang migrasi.

### 3.7 Belajar dari kurikulum ini

`04-network-layer/03-vlsm-cidr` → `06-aplikasi/01-dns` → `07-routing-lanjutan/06-bgp` → `09-nat-acl-firewall/03-firewall` → `11-wan-vpn/02-tunneling-vpn` → `15-otomasi/04-ansible-cicd` → `16-datacenter-cloud-sdn/04-cloud-networking` → `16-datacenter-cloud-sdn/05-container-kubernetes`.

### 3.8 Portofolio dan wawancara

**Proyek:**
1. Terraform untuk landing zone sederhana: VPC hub, dua VPC spoke, Transit Gateway, dan aturan keamanan, lengkap dengan pipeline CI yang menjalankan `terraform plan` di setiap pull request. Hapus sumber dayanya setelah selesai agar tagihan tidak membengkak.
2. VPN IPsec dengan BGP antara router lab (MikroTik CHR atau VyOS) dan cloud, lalu demonstrasikan failover antara dua tunnel.
3. Rencana alamat IP multi-akun untuk perusahaan fiktif dengan 3 lingkungan (dev, staging, prod) di 2 cloud, tanpa tumpang tindih dengan jaringan kantor.

**Pertanyaan wawancara khas:**
- "Instance di subnet privat tidak bisa mengunduh pembaruan. Apa saja yang Anda periksa, berurutan?"
- "Kapan Anda memilih VPC peering, kapan Transit Gateway?"
- "Resolusi DNS privat dari kantor ke layanan di VPC gagal. Di mana biasanya masalahnya?"

---

## 4. Wireless Network Engineer

### 4.1 Apa yang sebenarnya dikerjakan

Wireless engineer bekerja di wilayah yang tidak terlihat: gelombang radio yang dipantulkan rak besi, diserap tubuh manusia, dan diganggu microwave di pantry. Pengguna hanya tahu satu hal: "Wi-Fi-nya lemot."

Contoh proyek di sebuah rumah sakit swasta di Surabaya:

- **Minggu 1**: survei prediktif di Ekahau dengan denah gedung, memasukkan material dinding (beton, kaca, dinding berlapis timbal di ruang radiologi), menentukan target: sinyal minimal -67 dBm di area klinis untuk aplikasi suara dan perangkat medis.
- **Minggu 3**: survei validasi di lapangan setelah AP terpasang. Ditemukan zona mati di lorong ICU karena pintu tahan api berbahan logam. Satu AP ditambah, dua AP digeser.
- **Minggu 4**: SSID terpisah untuk staf (WPA3-Enterprise, 802.1X), perangkat medis (VLAN tersendiri), dan tamu (terisolasi).
- **Bulan berikutnya**: tiket "Wi-Fi putus-putus di lantai 5". Analisis spektrum menunjukkan interferensi non-Wi-Fi di 2,4 GHz. Solusinya mendorong klien ke 5 GHz dan menyesuaikan kanal.

### 4.2 Tanggung jawab dan ukuran keberhasilan

- Survei situs (prediktif, pasif, aktif), desain cakupan dan kapasitas, pemilihan antena dan penempatan AP.
- Konfigurasi controller atau platform cloud, autentikasi 802.1X, segmentasi.
- Kepatuhan regulasi frekuensi dan batas daya pancar (EIRP) yang ditetapkan Komdigi.
- **Ukuran:** persentase area yang memenuhi target sinyal dan SNR, tingkat keberhasilan koneksi klien, waktu roaming (penting untuk telepon Wi-Fi), jumlah tiket terkait Wi-Fi per bulan, dan kepuasan pengguna.

### 4.3 Keahlian dan alat

**Teknis:** dasar RF (dBm, SNR, free space path loss, Fresnel zone), standar 802.11 (Wi-Fi 6, 6E, 7), perencanaan kanal, keamanan wireless (WPA3, 802.1X, EAP), RADIUS, VLAN, PoE, analisis paket 802.11.

**Non-teknis:** membaca denah arsitek, berkomunikasi dengan pemilik gedung dan kontraktor, menjelaskan kepada manajemen mengapa "tambah AP" bukan selalu solusi.

**Alat:** Ekahau AI Pro dan Sidekick untuk survei, Wireshark untuk analisis 802.11, controller dan platform seperti Cisco Catalyst 9800, HPE Aruba Networking Central, Juniper Mist, Ubiquiti UniFi, MikroTik CAPsMAN, serta server RADIUS (Cisco ISE, FreeRADIUS).

### 4.4 Sertifikasi per jenjang

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | **MTCNA** lalu **MTCWE** atau **MTCEWE** (MikroTik) | Relevan untuk WISP dan RT-RW-Net |
| Menengah | **CWNA (CWNA-110)** | Versi 110 rilis 29 September 2026; CWNA-109 masih bisa diujikan sampai 31 Desember 2026 |
| Menengah | **CCNP Wireless**: inti **350-101 WLCOR** + **300-110 WLSD** (desain) atau **300-120 WLSI** (implementasi) | Jalur baru Cisco, ujian mulai 19 Maret 2026 |
| Senior | **CWDP (CWDP-305)**, **CWSP (CWSP-208)**, **CWAP** | Ketiganya mensyaratkan CWNA yang masih berlaku |
| Expert | **CWNE**, **CCIE Wireless** | Untuk spesialis puncak |

💡 **Cisco mengembalikan jalur wireless yang mandiri pada 2026.** Sebelumnya, konsentrasi wireless (300-425 ENWLSD dan 300-430 ENWLSI) menumpang di CCNP Enterprise. Kini ada CCNP Wireless dengan ujian inti sendiri, dan menurut pengumuman Cisco, ENCOR tidak lagi mencakup konsep wireless. Jika Anda membaca buku persiapan lama, periksa kode ujiannya.

### 4.5 Jalur masuk dan progresi

Jalur khas: teknisi lapangan atau network administrator yang sering menangani AP → wireless engineer di system integrator → senior/desainer WLAN → **network architect**. Transisi dari network engineer cukup mudah untuk bagian kabel (VLAN, RADIUS, PoE), tetapi bagian RF butuh belajar ulang dari dasar dan, yang terpenting, jam terbang survei di lapangan.

### 4.6 Pasar kerja Indonesia

Perekrut: system integrator yang menangani kampus, rumah sakit, hotel, mal, dan pabrik; penyedia layanan Wi-Fi terkelola; WISP dan ISP lokal yang memakai link point-to-point; serta perusahaan dengan gudang besar (logistik, manufaktur) yang bergantung pada pemindai genggam berbasis Wi-Fi. Sertifikasi MikroTik sangat laku di pasar ISP lokal, sedangkan CWNP dan Cisco lebih dicari di proyek korporasi.

### 4.7 Belajar dari kurikulum ini

`02-layer-fisik/01-media-transmisi` → `10-wireless/01-rf-dasar` → `10-wireless/02-802-11` → `10-wireless/03-keamanan-wireless` → `12-keamanan/04-aaa-identitas` → `10-wireless/04-desain-wlan` → `19-mikrotik/05-wireless-mikrotik` → `lab/04-lab-keamanan-wireless` → `20-proyek-akhir/06-babak-5-udara-dan-gudang-beku`.

### 4.8 Portofolio dan wawancara

**Proyek:**
1. Survei rumah atau kos Anda dengan aplikasi survei gratis di laptop/ponsel, buat heatmap sebelum dan sesudah perbaikan kanal, lalu tulis laporannya seperti laporan klien.
2. Lab WPA3-Enterprise dengan FreeRADIUS dan VLAN dinamis per grup pengguna.
3. Perhitungan link budget untuk link point-to-point 5 km (antena, EIRP, Fresnel zone), lengkap dengan pemeriksaan batas regulasi.

**Pertanyaan wawancara khas:**
- "Sinyal kuat tetapi throughput rendah. Apa kemungkinan penyebabnya?"
- "Mengapa menambah AP bisa memperburuk kinerja?"
- "Bagaimana Anda mendesain Wi-Fi untuk aula 1.000 orang?"

---

## 5. Telecom Engineer

### 5.1 Apa yang sebenarnya dikerjakan

Telecom engineer bekerja di jaringan operator: jaringan yang melayani jutaan pelanggan, bukan satu kantor. Istilah "telecom engineer" sendiri adalah payung untuk beberapa spesialisasi:

- **RF/RAN engineer:** perencanaan dan optimasi jaringan akses radio 4G dan 5G (BTS, sektor antena, parameter handover).
- **Transport engineer:** microwave link, fiber backbone, DWDM, jaringan IP/MPLS yang mengangkut trafik dari BTS ke core.
- **Core network engineer:** inti jaringan seluler (EPC untuk 4G, 5G Core) dan core IP.
- **OSP/fiber engineer:** jaringan kabel luar (outside plant), termasuk FTTH.

Contoh minggu kerja seorang RF optimization engineer di vendor yang menangani jaringan operator di Jawa Barat:

- Senin: menganalisis KPI mingguan: *call drop rate*, *throughput* per sel, dan *availability*. Lima sel di sekitar kampus di Bandung mengalami kepadatan saat jam kuliah.
- Selasa: *drive test* bersama tim lapangan untuk memastikan masalah cakupan di jalan tol baru.
- Rabu: mengusulkan perubahan *tilt* antena dan parameter handover, mengajukan *change request*.
- Kamis: setelah perubahan, memverifikasi KPI di sistem OSS vendor.
- Jumat: rapat dengan tim transport karena salah satu link microwave ke BTS penuh (*utilization* di atas 80% di jam sibuk) sehingga perlu upgrade kapasitas atau migrasi ke fiber.

### 5.2 Tanggung jawab dan ukuran keberhasilan

- Perencanaan, rollout, integrasi, dan optimasi elemen jaringan.
- Menjaga kualitas layanan sesuai KPI operator dan standar regulator.
- **Ukuran:** ketersediaan jaringan (site availability), *call setup success rate*, *drop rate*, throughput pengguna, utilisasi link transport, waktu pemulihan gangguan fiber (MTTR), dan pencapaian target rollout (jumlah site per bulan).

### 5.3 Keahlian dan alat

**Teknis:** dasar sinyal dan modulasi, propagasi RF, fiber optik (redaman, splicing, pengukuran OTDR), IP/MPLS, BGP, QoS, dasar arsitektur 4G/5G, pemantauan kinerja.

**Non-teknis:** kerja lapangan (sering bepergian), koordinasi dengan subkontraktor, laporan KPI yang rapi, kesabaran dengan perizinan dan akses site.

**Alat:** perangkat ukur fiber (OTDR, power meter, fusion splicer), perangkat lunak *drive test* dan perencanaan RF, sistem OSS dan manajemen elemen dari vendor (Huawei, Ericsson, Nokia, ZTE), CLI router operator (Cisco IOS XR, Juniper Junos, Huawei VRP), Wireshark, dan GIS (QGIS) untuk peta jaringan.

### 5.4 Sertifikasi per jenjang

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | **HCIA-Datacom** (Huawei) | Relevan karena perangkat Huawei banyak dipakai operator di Indonesia |
| Pemula | **ETA Fiber Optics Installer (FOI)** atau **BICSI Installer 2, Optical Fiber (INSTF)** | Untuk jalur fiber/OSP |
| Menengah | **HCIP-Datacom** (Huawei) | Lanjutan IP untuk operator |
| Menengah | **CCNP Service Provider**: inti **350-501 SPCOR** + satu konsentrasi | Mencakup MPLS, segment routing, VPN layanan operator |
| Menengah | **MTCINE** (MikroTik) | BGP dan MPLS untuk ISP lokal |

Sertifikasi produk vendor (Ericsson, Nokia, ZTE) biasanya diberikan lewat pelatihan internal ketika Anda sudah bekerja di vendor atau operator. Untuk jalur kompetensi Indonesia, SKKNI bidang Jaringan Komputer (Kepmenaker 321/2016) berada di golongan pokok Telekomunikasi, dan skema BNSP terkait bisa Anda cek di LSP berlisensi.

### 5.5 Jalur masuk dan progresi

Jalur paling umum adalah lulusan S1/D3 Teknik Telekomunikasi atau Teknik Elektro yang masuk program *graduate* operator atau vendor, atau masuk lewat perusahaan subkontraktor (*managed service*, rollout). Di awal, Anda mungkin sering di lapangan: *site survey*, *drive test*, integrasi BTS.

Progresi: engineer → senior/specialist (RF, transport, core) → *solution architect* di vendor atau *network planning manager* di operator. Transisi ke **network engineer** di korporasi relatif mudah bagi transport/IP engineer. Sebaliknya, network engineer yang kuat di BGP dan MPLS sangat dicari di tim IP core operator.

### 5.6 Pasar kerja Indonesia

Peta pemainnya:

- **Operator seluler:** Telkomsel, Indosat Ooredoo Hutchison, dan XLSMART (hasil merger XL Axiata dan Smartfren yang efektif 16 April 2025).
- **Vendor perangkat dan managed service:** Huawei, Ericsson, Nokia, ZTE, beserta subkontraktornya.
- **Penyedia menara dan fiber**, serta ISP fixed broadband.
- **Proyek pemerintah:** BAKTI Komdigi mengelola Palapa Ring, jaringan tulang punggung serat optik sekitar 12.148 km (darat dan laut) yang dibagi menjadi paket Barat, Tengah, dan Timur dan menghubungkan 57 kabupaten/kota layanan.

Spektrum adalah bahan bakar pekerjaan RF. Pada Juli 2026 Komdigi menyelesaikan seleksi pita **700 MHz** dan **2,6 GHz**: Telkomsel, Indosat, dan XLSMART masing-masing memperoleh blok di kedua pita, dengan kewajiban perluasan 4G ke desa yang belum terlayani dan perluasan 5G. Setiap gelombang spektrum baru biasanya berarti gelombang proyek rollout, integrasi, dan optimasi, sehingga permintaan RF dan transport engineer ikut naik.

### 5.7 Belajar dari kurikulum ini

`00-fondasi/03-sinyal-bandwidth-latency` → `02-layer-fisik/01-media-transmisi` → `02-layer-fisik/03-fiber` → `02-layer-fisik/04-encoding-modulasi` → `10-wireless/01-rf-dasar` → `11-wan-vpn/01-teknologi-wan` → `07-routing-lanjutan/06-bgp` → `11-wan-vpn/03-qos` → `14-monitoring-troubleshooting/03-observability`.

### 5.8 Portofolio dan wawancara

**Proyek:**
1. Lab IP/MPLS sederhana (Containerlab atau GNS3) dengan L3VPN untuk dua "pelanggan" yang memakai alamat IP yang sama.
2. Perhitungan link budget fiber untuk jalur 40 km: redaman per km, jumlah sambungan, konektor, margin, lalu bandingkan dengan spesifikasi transceiver.
3. Analisis KPI dari dataset publik atau simulasi: buat dashboard throughput dan utilisasi per "sel", tandai sel yang perlu ditambah kapasitas.

**Pertanyaan wawancara khas:**
- "Hasil OTDR menunjukkan lonjakan redaman di 12,3 km. Apa langkah Anda?"
- "Mengapa operator memakai MPLS atau segment routing di backbone, bukan IP routing biasa?"
- "Pita 700 MHz dan 2,6 GHz cocok untuk kebutuhan apa, masing-masing?"

---

## 6. VoIP Engineer (Unified Communications)

### 6.1 Apa yang sebenarnya dikerjakan

VoIP engineer memastikan suara dan video sampai dengan jelas melalui jaringan data. Suara adalah aplikasi yang paling tidak sabar: telat 300 ms terasa janggal, kehilangan paket 2% terdengar seperti robot, dan satu salah konfigurasi NAT membuat telepon "berdering tetapi tidak ada suara".

Contoh hari di system integrator yang menangani contact center sebuah perusahaan asuransi di Jakarta:

- **09.00**: tiket dari supervisor: "pelanggan tidak mendengar agen, agen mendengar pelanggan". Itu gejala klasik *one-way audio*. Engineer mengambil capture, melihat bahwa SIP menyebut alamat IP privat di SDP, dan RTP dari arah pelanggan terbuang di firewall. Perbaikannya ada di konfigurasi NAT dan SBC.
- **11.00**: migrasi 200 extension dari PBX lama ke platform cloud. Menyusun rencana porting nomor dan rencana pembatalan.
- **14.00**: meninjau QoS di switch akses: VLAN suara, penandaan DSCP EF untuk RTP, dan antrean prioritas di link WAN cabang.
- **16.00**: melatih admin klien membaca laporan kualitas panggilan (MOS, jitter, packet loss).

### 6.2 Tanggung jawab dan ukuran keberhasilan

- Merancang dan mengoperasikan PBX/IP-PBX, SIP trunk ke penyedia, gateway, SBC, contact center, dan konferensi video.
- Menjaga kualitas suara end-to-end bersama tim jaringan.
- **Ukuran:** MOS rata-rata (target umum di atas 4,0), persentase panggilan dengan jitter dan loss di bawah ambang, *call completion rate*, MTTR tiket suara, serta ketersediaan layanan telepon (sering lebih ketat dari layanan TI lain karena terkait layanan pelanggan).

### 6.3 Keahlian dan alat

**Teknis:** SIP (RFC 3261), RTP/RTCP, codec (G.711, G.729, Opus), UDP dan dampak NAT, QoS (DSCP, antrean prioritas), VLAN suara dan PoE, DNS (SRV record), TLS/SRTP untuk enkripsi, dasar Linux.

**Non-teknis:** sabar dengan pengguna yang hanya bisa melaporkan "suaranya aneh", koordinasi dengan penyedia SIP trunk, dokumentasi *dial plan*.

**Alat:** Asterisk dan FreePBX (banyak dipakai UMKM dan BPO di Indonesia), Kamailio sebagai SIP proxy, Cisco Unified Communications Manager dan Webex Calling, Microsoft Teams Phone, telepon IP (Yealink, Grandstream), Wireshark (menu analisis VoIP), dan sngrep untuk melacak alur SIP di terminal.

### 6.4 Sertifikasi per jenjang

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | **CCNA (200-301 v1.1)** | Fondasi jaringan yang wajib untuk VoIP |
| Menengah | **CCNP Collaboration**: inti **350-801 CLCOR** + salah satu dari **300-815 CLACC**, **300-820 CLHCT**, **300-830 CLCCE** | Konsentrasi: call control on-premise, hybrid/cloud, atau contact center cloud |
| Menengah | **Microsoft 365 Certified: Collaboration Communications Systems Engineer Associate (MS-721)** | Menggantikan Teams Voice Engineer (MS-720) yang pensiun Juni 2023; perlu perpanjangan tiap 12 bulan |

⚠️ **Portofolio Cisco Collaboration berubah pada Februari 2026.** Beberapa ujian lama (misalnya 300-810 CLICA dan 300-835 CLAUTO) mencapai akhir masa berlaku, dan Cisco menambahkan fokus cloud dan hybrid. Selalu periksa daftar ujian di situs Cisco sebelum membeli materi belajar.

### 6.5 Jalur masuk dan progresi

Jalur masuk umum: network administrator atau IT support yang ditugasi mengurus PBX kantor, lalu mendalami SIP. Banyak juga yang mulai sebagai teknisi di distributor telepon IP. Progresi: UC engineer → UC architect atau **solution architect** di system integrator. Transisi ke/dari **network engineer** sangat alami karena banyak masalah suara ternyata masalah jaringan: QoS, NAT, MTU, atau firewall.

### 6.6 Pasar kerja Indonesia

Perekrut: system integrator yang menjual solusi Cisco, Avaya, Microsoft, atau platform lokal; perusahaan BPO dan contact center; bank dan asuransi dengan call center besar; penyedia layanan telepon internet (ITSP) dan penyedia SIP trunk; serta hotel dan rumah sakit. Tren yang terlihat adalah pergeseran dari PBX di lokasi ke telepon berbasis cloud, sehingga kemampuan integrasi (API, SSO, Teams/Webex) semakin bernilai.

### 6.7 Belajar dari kurikulum ini

`02-layer-fisik/02-kabel-copper` → `03-data-link/03-vlan` → `05-transport/03-udp-quic` → `06-aplikasi/02-dhcp` → `09-nat-acl-firewall/01-nat` → `11-wan-vpn/03-qos` → `13-linux-networking/04-layanan-jaringan-linux` → `14-monitoring-troubleshooting/02-tools`.

### 6.8 Portofolio dan wawancara

**Proyek:**
1. Bangun Asterisk/FreePBX di VM dengan dua softphone, satu IVR sederhana, dan rekaman alur SIP (sngrep) untuk panggilan sukses dan gagal.
2. Lab QoS: bandingkan kualitas panggilan (jitter, loss) di link yang disesaki trafik unduhan, sebelum dan sesudah antrean prioritas.
3. Dokumentasi pemecahan masalah *one-way audio* lengkap dengan capture Wireshark yang menunjukkan akar masalah NAT.

**Pertanyaan wawancara khas:**
- "Telepon berdering, diangkat, tetapi tidak ada suara dua arah. Di mana Anda mulai mencari?"
- "Mengapa suara harus diberi DSCP EF, dan di titik mana penandaan itu dipercaya?"
- "Berapa bandwidth yang Anda alokasikan untuk 30 panggilan G.711 serentak di link WAN, dan bagaimana menghitungnya?"

---

## 7. Data Center Engineer

### 7.1 Apa yang sebenarnya dikerjakan

Data center engineer menjaga "rumah" tempat server tinggal. Di beberapa perusahaan, peran ini dominan sisi fasilitas (listrik, pendingin, kabel, akses fisik). Di perusahaan lain, dominan sisi jaringan DC (fabric spine-leaf, EVPN-VXLAN, konektivitas storage). Engineer yang paling dicari paham keduanya, minimal cukup untuk berbicara dengan tim lain.

Contoh shift di penyedia colocation di Cikarang:

- **07.00**: serah terima shift. Catatan: satu unit pendingin presisi di hall 2 dalam perawatan terjadwal, beban dialihkan ke unit cadangan.
- **08.30**: *remote hands*: pelanggan bank minta pemasangan 4 server baru di rak mereka. Engineer memeriksa anggaran daya rak (berapa kW yang tersisa), memasang, mengatur kabel, melabeli sesuai standar, dan mengirim foto bukti.
- **11.00**: patroli: membaca suhu dan kelembapan, memeriksa status UPS dan baterai di DCIM.
- **14.00**: memasang cross-connect fiber antara pelanggan dan ISP di *meet-me room*, menguji dengan power meter, dan menutup tiket.
- **16.00**: rapat persiapan uji beban genset bulanan dan prosedur jika uji gagal.

### 7.2 Tanggung jawab dan ukuran keberhasilan

- Instalasi dan pemeliharaan rak, kabel terstruktur, cross-connect, dan perangkat jaringan DC.
- Pemantauan daya, pendingin, dan lingkungan; koordinasi perawatan fasilitas.
- Prosedur perubahan yang ketat (*Method of Procedure*/MOP).
- **Ukuran:** ketersediaan fasilitas sesuai SLA kontrak dengan pelanggan, nol insiden akibat kesalahan manusia, waktu penyelesaian permintaan *remote hands*, akurasi data aset dan kabel di DCIM, serta PUE (*Power Usage Effectiveness*).

### 7.3 Standar yang wajib Anda kenal

- **Uptime Institute Tier I sampai IV.** Tier I adalah kapasitas dasar, Tier II menambah komponen redundan, Tier III dapat dirawat tanpa mematikan beban (*concurrently maintainable*), dan Tier IV toleran terhadap kegagalan (*fault tolerant*). Uptime menerbitkan sertifikasi Tier untuk desain, fasilitas terbangun, dan keberlanjutan operasional.
- **ANSI/TIA-942.** Revisi terbarunya, **TIA-942-C**, terbit Mei 2024. Standar ini memakai peringkat Rated-1 sampai Rated-4 dan menilai subsistem telekomunikasi, arsitektur, listrik, dan mekanikal secara terpisah; peringkat keseluruhan mengikuti subsistem yang paling rendah.
- **Kabel terstruktur:** keluarga TIA-568 untuk tembaga dan fiber, serta praktik pelabelan dan dokumentasi.

💡 **Tier (Uptime) dan Rated (TIA-942) bukan hal yang sama**, walaupun konsepnya mirip. Di wawancara, menyebut keduanya dengan tepat langsung menunjukkan Anda pernah membaca standarnya, bukan hanya brosur pemasaran.

### 7.4 Keahlian dan alat

**Teknis:** kabel tembaga dan fiber (termasuk MPO untuk link 100G/400G), pengujian sertifikasi kabel, desain spine-leaf, EtherChannel/MLAG, VXLAN-EVPN, dasar virtualisasi dan storage, perhitungan daya dan pendingin per rak, otomasi dasar.

**Non-teknis:** disiplin prosedur (MOP, izin kerja, *lockout*), ketelitian dokumentasi, ketenangan saat insiden, bekerja dengan vendor fasilitas (listrik, HVAC).

**Alat:** DCIM (misalnya Schneider Electric EcoStruxure IT atau Sunbird dcTrack), NetBox untuk inventaris rak dan kabel, penguji kabel (Fluke Networks DSX), OTDR dan power meter optik, perangkat Cisco Nexus (NX-OS) atau Arista (EOS), VMware vSphere atau Proxmox, Ansible.

### 7.5 Sertifikasi per jenjang

| Jenjang | Sertifikasi | Penerbit | Catatan |
|---|---|---|---|
| Pemula | **BICSI Installer 2, Optical Fiber (INSTF)** atau **Installer 2, Copper (INSTC)** | BICSI | Untuk jalur kabel |
| Pemula/menengah | **Certified Data Centre Professional (CDCP)** | EPI (diakreditasi EXIN) | Kursus 2 hari, ujian 40 soal; berlaku 3 tahun |
| Menengah | **Accredited Tier Specialist (ATS)** | Uptime Institute | Untuk tim manajemen dan operasi DC |
| Menengah | **CCNP Data Center**: inti **350-601 DCCOR** + konsentrasi (DCID, DCIT, DCACI, DCNAUTO, atau DCAI) | Cisco | Sisi jaringan DC |
| Senior | **Accredited Tier Designer (ATD)** | Uptime Institute | Untuk insinyur desain fasilitas |
| Senior | **Data Center Design Consultant (DCDC)**, **RCDD** | BICSI | Desain infrastruktur ICT dan DC |

### 7.6 Jalur masuk dan progresi

Jalur masuk paling realistis: teknisi DC atau *remote hands* di penyedia colocation (pemula, kerja shift), atau teknisi kabel di kontraktor ICT. Dengan pengalaman beberapa tahun dan sertifikasi seperti CDCP atau ATS, Anda bisa naik ke DC engineer, lalu DC operations manager, atau beralih ke sisi jaringan DC dan akhirnya **network architect**. Network engineer yang pindah ke DC biasanya kuat di fabric tetapi perlu belajar fasilitas; teknisi fasilitas sebaliknya.

### 7.7 Pasar kerja Indonesia

Industri data center Indonesia sedang tumbuh cepat. Menurut asosiasi penyedia data center IDPRO, kapasitas nasional mencapai sekitar 520 MW per Juni 2026 dan diperkirakan mendekati 600 MW pada akhir 2026, didorong adopsi cloud, AI, digitalisasi pemerintah, perbankan, dan e-commerce.

Perekrut: penyedia colocation lokal dan global, hyperscaler yang membangun region, bank dan BUMN yang mengoperasikan DC sendiri, pengelola Pusat Data Nasional, serta kontraktor yang membangun fasilitas baru (fase konstruksi dan *commissioning* membutuhkan banyak engineer).

### 7.8 Belajar dari kurikulum ini

`02-layer-fisik/02-kabel-copper` → `02-layer-fisik/03-fiber` → `03-data-link/05-etherchannel` → `16-datacenter-cloud-sdn/01-desain-dc` → `16-datacenter-cloud-sdn/02-overlay-vxlan-evpn` → `16-datacenter-cloud-sdn/03-storage-virtualisasi` → `16-datacenter-cloud-sdn/06-sdn` → `15-otomasi/04-ansible-cicd` → `14-monitoring-troubleshooting/03-observability`.

### 7.9 Portofolio dan wawancara

**Proyek:**
1. Lab fabric spine-leaf (2 spine, 4 leaf) dengan EVPN-VXLAN di Containerlab, beserta dokumentasi skema penamaan dan alamat.
2. Model NetBox untuk satu hall DC fiktif: rak, perangkat, port, kabel, dan anggaran daya per rak; ekspor sebagai laporan.
3. Contoh MOP lengkap untuk penggantian switch ToR yang redundan tanpa downtime: prasyarat, langkah, titik verifikasi, dan rencana *rollback*.

**Pertanyaan wawancara khas:**
- "Apa beda Tier III dan Tier IV dari sudut pandang pekerjaan perawatan?"
- "Rak pelanggan sudah memakai 4,5 kW dari kontrak 5 kW, dan mereka mau menambah dua server. Apa yang Anda lakukan?"
- "Mengapa spine-leaf menggantikan desain tiga lapis (core-distribution-access) di DC modern?"

---

## 8. NOC Technician

### 8.1 Apa yang sebenarnya dikerjakan

Network Operations Center adalah ruang kendali: dinding layar berisi peta jaringan, grafik trafik, dan daftar alarm. NOC technician adalah orang pertama yang tahu ada masalah, sering sebelum pelanggan menelepon.

Contoh shift malam (22.00 sampai 07.00) di ISP regional:

- **22.05**: serah terima. Shift sore mencatat dua tiket terbuka: satu link pelanggan korporat flapping, satu perangkat OLT di Bekasi panas.
- **23.40**: alarm Zabbix: 140 pelanggan FTTH di satu area offline sekaligus. Pola ini menunjukkan masalah di hulu, bukan di rumah pelanggan. Technician memeriksa port OLT, melihat sinyal optik hilang, lalu membuka tiket gangguan kabel dan menghubungi tim lapangan sesuai matriks eskalasi.
- **00.10**: memperbarui status di kanal informasi pelanggan dan memberi tahu customer service agar tidak kewalahan.
- **02.30**: tim lapangan menemukan kabel putus terkena galian. Penyambungan selesai 04.15. Technician memverifikasi semua pelanggan kembali online, menutup tiket, dan mencatat kronologi untuk laporan insiden.
- **06.30**: menulis ringkasan shift: insiden, durasi, jumlah pelanggan terdampak, tindakan.

### 8.2 Tanggung jawab dan ukuran keberhasilan

- Memantau jaringan 24/7, menyaring alarm palsu dari alarm nyata.
- Triase awal dan pemecahan masalah level 1 (cek status, cek log, reset port sesuai prosedur).
- Eskalasi ke engineer level 2/3 atau tim lapangan sesuai prosedur.
- Mengelola tiket sesuai proses ITSM (insiden, masalah, perubahan).
- **Ukuran:** MTTD (*mean time to detect*), MTTA (waktu sampai alarm diakui), MTTR, persentase tiket yang diselesaikan di level 1, kepatuhan SLA respons, dan kualitas catatan tiket.

💡 **NOC yang baik bukan yang paling banyak menutup tiket, melainkan yang mengurangi kebisingan.** Jika Anda bisa mengusulkan perbaikan ambang alarm sehingga 300 alarm palsu per minggu menjadi 30, Anda sedang melakukan pekerjaan engineer, dan atasan Anda akan melihatnya.

### 8.3 Keahlian dan alat

**Teknis:** model OSI dan metodologi troubleshooting, ping/traceroute/mtr, SNMP dan syslog, membaca grafik trafik, dasar routing dan switching, dasar fiber (redaman, tanda-tanda putus), perintah dasar Cisco dan MikroTik, dasar Linux.

**Non-teknis:** komunikasi tertulis yang jelas di tiket, tenang di bawah tekanan, disiplin mengikuti prosedur, kesiapan kerja shift.

**Alat:** Zabbix, PRTG, LibreNMS, Grafana, The Dude/Winbox (MikroTik), Wireshark, sistem tiket (ServiceNow, Jira Service Management, atau buatan sendiri), PuTTY/SecureCRT, serta aplikasi pesan untuk koordinasi tim lapangan.

### 8.4 Sertifikasi per jenjang

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | **CompTIA Network+ (N10-009)** | Rilis Juni 2024; netral vendor |
| Pemula | **CCNA (200-301 v1.1)** | Paling dikenal perekrut |
| Pemula | **MTCNA** | Sangat relevan di ISP lokal |
| Pemula | **ITIL 4 Foundation** atau **ITIL Foundation (Version 5)** | PeopleCert merilis ITIL Version 5 pada Februari 2026; ITIL 4 masih tersedia berdampingan |

**Jalur Indonesia:** SKKNI bidang Jaringan Komputer (Kepmenaker 321/2016) memuat jenjang teknisi jaringan komputer, dan beberapa LSP menawarkan skema sertifikasi BNSP untuk teknisi atau administrator jaringan. Sertifikat BNSP sering menjadi nilai tambah untuk lulusan SMK dan D3, terutama saat melamar ke BUMN atau instansi pemerintah.

### 8.5 Jalur masuk dan progresi

Ini adalah pintu masuk paling realistis ke dunia jaringan profesional bagi lulusan SMK TKJ, D3, atau S1 tanpa pengalaman. Perekrut menerima pemula karena prosedurnya terdokumentasi dan ada engineer senior yang menjadi tempat eskalasi.

Progresi: NOC level 1 → NOC level 2 (mulai mengonfigurasi) → **network engineer** atau **network administrator**. Jalur lateral: **cybersecurity analyst** di SOC (pola kerjanya mirip: pemantauan, triase, eskalasi), atau **field network technician**. Berapa lama Anda bertahan di NOC sangat bergantung pada seberapa aktif Anda belajar di luar shift.

⚠️ **Risiko terbesar di NOC adalah terjebak.** Shift malam yang melelahkan bisa membuat Anda hanya "menjaga layar" selama bertahun-tahun. Gunakan jam tenang untuk lab, baca setiap laporan insiden engineer level 3, dan minta ikut proyek perubahan.

### 8.6 Pasar kerja Indonesia

Perekrut: ISP besar dan regional, operator seluler, penyedia data center, bank (NOC internal), managed service provider dan system integrator yang memantau jaringan banyak klien, serta penyedia layanan TI pemerintah. Lowongan NOC paling banyak ada di Jabodetabek, tetapi ISP regional di Jawa Tengah, Jawa Timur, Sumatra, dan Sulawesi juga rutin membuka posisi.

### 8.7 Belajar dari kurikulum ini

`00-fondasi/03-sinyal-bandwidth-latency` → `01-model-referensi/01-osi` → `04-network-layer/04-arp-icmp` → `06-aplikasi/05-layanan-lain` → `14-monitoring-troubleshooting/01-metodologi` → `14-monitoring-troubleshooting/02-tools` → `14-monitoring-troubleshooting/03-observability` → `14-monitoring-troubleshooting/04-studi-kasus` → `19-mikrotik/07-monitoring-scripting` → `20-proyek-akhir/09-babak-8-malam-panjang`.

### 8.8 Portofolio dan wawancara

**Proyek:**
1. Pasang Zabbix atau LibreNMS di VM, pantau 3 sampai 5 perangkat lab (router MikroTik CHR, switch virtual, server Linux) lewat SNMP, buat dashboard Grafana dan aturan alarm yang masuk akal.
2. Tulis tiga *runbook* NOC: "link pelanggan down", "CPU router di atas 90%", "banyak pelanggan FTTH offline di satu area", masing-masing dengan langkah cek, kriteria eskalasi, dan template pesan ke pelanggan.
3. Laporan insiden fiktif yang lengkap: kronologi bermenit-menit, dampak, akar masalah, tindakan pencegahan.

**Pertanyaan wawancara khas:**
- "Alarm menunjukkan 200 pelanggan offline sekaligus. Apa yang Anda lakukan di 10 menit pertama?"
- "Bagaimana membedakan masalah di sisi pelanggan dan masalah di jaringan kita?"
- "Anda melihat alarm yang Anda tidak pahami pukul 03.00 dan engineer on-call tidak menjawab. Apa langkah Anda?"

---

## 9. Memilih Jalur dan Berpindah Antarprofesi

### 9.1 Dari network engineer/administrator ke rumpun infrastruktur

| Dari | Ke | Yang sudah Anda punya | Yang perlu ditambah |
|---|---|---|---|
| Network administrator | NOC level 2 / network engineer | Operasi harian, troubleshooting | Routing dinamis, prosedur ITSM |
| Network engineer | Cloud network engineer | Subnetting, BGP, VPN, firewall | Terraform, Git, model jaringan cloud, membaca tagihan |
| Network engineer | Wireless network engineer | VLAN, RADIUS, PoE | Fisika RF, survei lapangan, analisis 802.11 |
| Network engineer | Data center engineer | Switching, EtherChannel | Fasilitas (daya, pendingin), standar TIA-942/Tier, disiplin MOP |
| Network engineer | VoIP engineer | QoS, NAT, VLAN | SIP, RTP, codec, platform PBX/UC |
| Network engineer (ISP) | Telecom engineer (IP core) | BGP, MPLS | Skala operator, arsitektur 4G/5G, transport optik |
| Spesialis mana pun | Network architect | Kedalaman satu domain | Keluasan lintas domain, menulis desain, komunikasi bisnis |

### 9.2 Tiga pertanyaan untuk memilih

1. **Anda lebih suka lapangan atau layar?** Telecom (RF, fiber), wireless, dan data center banyak kerja fisik. Cloud dan arsitektur hampir seluruhnya di depan layar.
2. **Anda tahan kerja shift?** NOC dan operasi DC biasanya 24/7. Itu cocok untuk sebagian orang di awal karier, tetapi rencanakan jalan keluarnya.
3. **Anda ingin dekat dengan kode atau dekat dengan perangkat?** Cloud network engineer menulis Terraform setiap hari. Data center engineer memegang kabel MPO setiap hari. Keduanya berharga, tetapi hari-harinya sangat berbeda.


---

## 10. Ringkasan

- Rumpun infrastruktur berisi spesialis yang membangun dan menjaga jalan data: **network architect, cloud network engineer, wireless network engineer, telecom engineer, VoIP engineer, data center engineer, dan NOC technician**.
- **NOC technician** adalah pintu masuk paling realistis bagi pemula. **Network architect** adalah puncak yang biasanya dicapai setelah pengalaman lintas domain.
- **Perubahan sertifikasi 2026 yang perlu Anda ingat:** CCNP Wireless kembali sebagai jalur mandiri (350-101 WLCOR), CWNA berganti ke CWNA-110, AWS Advanced Networking Specialty (ANS-C01) berhenti diujikan setelah 31 Desember 2026, PeopleCert meluncurkan ITIL Version 5, dan beberapa ujian Cisco Collaboration pensiun.
- **Standar data center** yang wajib dikenal: Uptime Institute Tier I sampai IV dan ANSI/TIA-942-C (Rated-1 sampai Rated-4).
- **Konteks Indonesia:** tiga operator seluler besar (Telkomsel, Indosat, XLSMART), Palapa Ring yang dikelola BAKTI Komdigi, seleksi spektrum 700 MHz dan 2,6 GHz pada 2026, region cloud lokal dari tiga hyperscaler, dan pertumbuhan kapasitas data center yang pesat.

---

## 11. Latihan

1. Anda NOC technician di ISP. Pukul 01.00, monitoring menunjukkan 85 pelanggan FTTH di satu kelurahan offline bersamaan, sementara pelanggan di kelurahan sebelah normal. Uraikan langkah Anda dalam 15 menit pertama, termasuk siapa yang Anda hubungi dan informasi apa yang Anda catat.
2. Seorang teman network engineer dengan CCNA dan pengalaman 3 tahun di system integrator ingin pindah ke cloud network engineer dalam 12 bulan. Ia berencana mengambil AWS Advanced Networking Specialty (ANS-C01) sebagai sertifikasi pertama. Apa saran Anda dan mengapa?
3. Sebuah hotel mengeluh Wi-Fi di ballroom lambat saat acara 800 tamu, padahal survei menunjukkan sinyal -55 dBm di seluruh ruangan. Jelaskan mengapa sinyal kuat tidak menjamin kinerja, dan apa yang akan Anda periksa.
4. Agen contact center melaporkan pelanggan tidak mendengar suara mereka, tetapi agen bisa mendengar pelanggan. Panggilan internal antaragen normal. Susun hipotesis dan urutan pemeriksaan Anda.
5. Manajemen meminta "data center Tier IV" untuk sistem internal yang menurut analisis bisnis boleh berhenti 8 jam per tahun. Bagaimana Anda menanggapi permintaan itu sebagai data center engineer atau arsitek?
6. Operator tempat Anda bekerja baru memperoleh blok spektrum 700 MHz dan 2,6 GHz. Jelaskan kepada tim manajemen non-teknis mengapa kedua pita itu dipakai untuk kebutuhan yang berbeda, dan pekerjaan apa yang akan muncul untuk tim RF dan transport.
7. Anda network engineer di bank dan ingin menjadi network architect dalam 3 sampai 4 tahun. Susun rencana pengembangan: sertifikasi, pengalaman proyek yang perlu Anda cari, dan bukti portofolio yang akan Anda kumpulkan.
8. Lulusan SMK TKJ bertanya profesi mana di rumpun ini yang paling realistis sebagai pekerjaan pertama dan bagaimana mempersiapkannya dalam 6 bulan dengan anggaran terbatas. Berikan jawaban yang konkret.

<details>
<summary>Jawaban</summary>

1. **Langkah 15 menit pertama:** (a) Akui alarm agar rekan tahu sedang ditangani, catat waktu deteksi. (b) Kenali pola: banyak pelanggan dalam satu area, area tetangga normal, berarti masalah ada di titik bersama di hulu (port OLT, splitter utama, atau kabel distribusi), bukan di rumah pelanggan. (c) Periksa OLT dan port PON terkait: status link, daya optik yang diterima, log alarm "loss of signal". Periksa juga apakah ada perubahan terjadwal malam itu. (d) Jika port hidup tetapi sinyal optik hilang, kemungkinan besar kabel putus. Buka tiket gangguan dengan prioritas sesuai jumlah pelanggan terdampak, lalu hubungi tim lapangan sesuai matriks eskalasi. Jika tidak ada respons dalam waktu yang ditetapkan, naik ke koordinator. (e) Beri tahu customer service dan, bila ada, perbarui halaman status agar pelanggan mendapat informasi. (f) Catat semua: waktu deteksi, waktu eskalasi, siapa yang dihubungi, data teknis (port, nilai daya optik), jumlah pelanggan. Catatan ini menjadi bahan laporan insiden dan perhitungan MTTR.

2. **Saran:** jangan memulai dengan ANS-C01. Pertama, sertifikasi itu sedang dipensiunkan: AWS menetapkan hari terakhir ujian 31 Desember 2026 tanpa pengganti yang diumumkan, sehingga investasi waktu belajarnya berisiko. Kedua, ujian itu ditujukan untuk orang yang sudah berpengalaman lama membangun jaringan AWS, bukan untuk yang baru beralih. Rencana yang lebih masuk akal: (a) AWS Solutions Architect Associate (SAA-C03) untuk memahami layanan AWS secara luas; (b) jika kantornya memakai Azure, AZ-700, atau Google Professional Cloud Network Engineer jika memakai GCP; (c) belajar Terraform dan Git; (d) membangun proyek portofolio: landing zone dengan Transit Gateway dan VPN BGP ke router lab. Pengalamannya di BGP dan VPN adalah modal yang sangat relevan, tinggal diterjemahkan ke model cloud.

3. **Sinyal kuat tidak sama dengan kapasitas.** Wi-Fi adalah media bersama: semua klien di satu kanal bergantian berbicara. Dengan 800 tamu (mungkin lebih dari 1.000 perangkat), masalahnya hampir pasti kapasitas dan kontensi, bukan cakupan. Yang diperiksa: (a) jumlah klien per AP dan per kanal, serta utilisasi kanal (*airtime*); (b) interferensi antar-AP di kanal yang sama (*co-channel interference*), terutama jika AP dipasang dengan daya tinggi sehingga saling "mendengar"; (c) proporsi klien di 2,4 GHz dibanding 5/6 GHz; (d) lebar kanal (kanal 80 MHz di ruangan padat justru mengurangi jumlah kanal yang bisa dipakai); (e) *data rate* minimum, karena klien lambat di *rate* rendah menghabiskan *airtime*; (f) kapasitas uplink AP dan internet hotel. Solusinya biasanya desain kapasitas: lebih banyak AP berdaya rendah dengan antena terarah, kanal lebih sempit, mendorong klien ke 5/6 GHz, dan membatasi *data rate* rendah.

4. **Gejala ini khas *one-way audio* akibat NAT/firewall.** Karena panggilan internal normal, platform PBX dan telepon agen kemungkinan sehat; masalahnya di jalur ke luar. Hipotesis: (a) SDP di pesan SIP berisi alamat IP privat, sehingga penyedia mengirim RTP ke alamat yang tidak bisa dijangkau; (b) firewall atau NAT tidak membuka port RTP untuk arah tertentu; (c) fitur SIP ALG di router mengubah pesan SIP secara salah; (d) konfigurasi SBC atau alamat publik eksternal di PBX keliru. Urutan pemeriksaan: ambil capture di sisi luar PBX/SBC, lihat alamat dan port di SDP, pastikan aliran RTP ada di kedua arah, periksa log firewall untuk paket RTP yang ditolak, periksa apakah SIP ALG aktif, lalu verifikasi pengaturan alamat eksternal di PBX atau SBC.

5. **Tanggapi dengan kebutuhan, bukan label.** Downtime yang diizinkan 8 jam per tahun setara ketersediaan sekitar 99,9%. Tier IV dirancang untuk toleran terhadap kegagalan dengan sistem yang terpisah secara fisik, sehingga biayanya jauh lebih tinggi dan melampaui kebutuhan. Tier III (dapat dirawat tanpa mematikan beban) atau bahkan kombinasi Tier II dengan replikasi ke lokasi kedua mungkin cukup. Langkahnya: (a) tegaskan RTO, RPO, dan dampak bisnis per jam; (b) bandingkan biaya tiap opsi (membangun sendiri, colocation bersertifikat Tier III, atau cloud); (c) ingatkan bahwa ketersediaan aplikasi juga ditentukan oleh jaringan, server, dan proses, bukan hanya fasilitas; (d) sajikan rekomendasi tertulis dengan risiko masing-masing opsi.

6. **Penjelasan untuk manajemen:** frekuensi rendah seperti 700 MHz merambat jauh dan menembus bangunan lebih baik, sehingga satu BTS bisa melayani wilayah luas. Itu cocok untuk menjangkau desa dan daerah jarang penduduk dengan jumlah menara lebih sedikit. Frekuensi 2,6 GHz jangkauannya lebih pendek tetapi lebarnya lebih besar, sehingga kapasitas datanya tinggi. Itu cocok untuk kota padat dan 5G. **Pekerjaan yang muncul:** tim RF merencanakan sel baru dan menyesuaikan sel lama (penempatan, tilt, parameter antarlapisan frekuensi), melakukan *drive test* dan optimasi; tim transport harus menambah kapasitas backhaul (upgrade microwave atau migrasi ke fiber) karena trafik per BTS naik; tim core dan IP menyesuaikan kapasitas. Ada juga kewajiban pembangunan dari regulator yang harus dipenuhi sesuai jadwal.

7. **Rencana contoh:** (a) **Sertifikasi:** CCNP Enterprise dengan konsentrasi ENSLD (desain) di tahun pertama, satu sertifikasi cloud tingkat associate (SAA-C03 atau AZ-700) di tahun kedua, lalu CCDE sebagai target jangka panjang. (b) **Pengalaman proyek:** minta terlibat dalam penyusunan HLD/LLD, bukan hanya implementasi; ambil proyek lintas domain (konektivitas DC ke cloud, segmentasi keamanan, SD-WAN); ikut rapat dengan tim aplikasi dan keamanan untuk memahami kebutuhan mereka; pelajari kepatuhan sektor keuangan (POJK, UU PDP). (c) **Portofolio:** kumpulkan dokumen desain yang sudah disamarkan, tulis ADR untuk keputusan yang pernah Anda usulkan, catat hasil terukur (misalnya waktu konvergensi berkurang, insiden turun), dan buat satu desain lengkap perusahaan fiktif yang bisa ditunjukkan di wawancara.

8. **Jawaban:** profesi paling realistis adalah **NOC technician** (atau teknisi lapangan ISP), karena perekrut menerima pemula, prosedurnya terdokumentasi, dan ada senior untuk eskalasi. Rencana 6 bulan dengan anggaran terbatas: bulan 1 sampai 2, kuasai fondasi kurikulum ini (tahap 00 sampai 06) dan latihan subnetting setiap hari; bulan 3, pelajari metodologi troubleshooting dan monitoring (tahap 14) sambil memasang Zabbix atau LibreNMS di laptop dengan MikroTik CHR gratis; bulan 4, lab MikroTik (tahap 19) dan ikut ujian MTCNA jika ada biaya, karena sangat dihargai ISP lokal; bulan 5, buat portofolio: dashboard monitoring, tiga runbook, satu laporan insiden fiktif, simpan di GitHub; bulan 6, latihan wawancara (pertanyaan skenario NOC) dan melamar ke ISP regional, managed service provider, dan penyedia data center.

</details>

---

## 12. Sumber

- Cisco: CCNP Enterprise: https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccnp-enterprise/index.html
- Cisco: CCIE Enterprise Infrastructure: https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccie-enterprise-infrastructure/index.html
- Cisco Learning Network: CCDE v3.1 Unified Exam Topics: https://learningnetwork.cisco.com/s/ccde-v3-1-unified-exam-topics
- Cisco Blogs: A Dedicated Wireless Certification Track Is on the Horizon: https://blogs.cisco.com/learning/a-dedicated-wireless-certification-track-is-on-the-horizon
- Cisco: CCNP Collaboration: https://www.cisco.com/site/us/en/learn/training-certifications/certifications/collaboration/ccnp-collaboration/index.html
- Cisco: CCNP Data Center Exams and Training: https://www.cisco.com/site/us/en/learn/training-certifications/certifications/datacenter/ccnp-data-center/exams-and-training.html
- Cisco: 350-501 SPCOR: https://www.cisco.com/site/us/en/learn/training-certifications/exams/spcor.html
- Cisco: CCNA 200-301: https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccna.html
- AWS Certified Advanced Networking – Specialty: https://aws.amazon.com/certification/certified-advanced-networking-specialty/
- AWS Certified Solutions Architect – Associate: https://aws.amazon.com/certification/certified-solutions-architect-associate/
- Microsoft Learn: Azure Network Engineer Associate (AZ-700): https://learn.microsoft.com/en-us/credentials/certifications/azure-network-engineer-associate/
- Microsoft Learn: Collaboration Communications Systems Engineer Associate (MS-721): https://learn.microsoft.com/en-us/credentials/certifications/m365-collaboration-communications-systems-engineer/
- Google Cloud: Professional Cloud Network Engineer: https://cloud.google.com/learn/certification/cloud-network-engineer
- CWNP: Certifications: https://www.cwnp.com/certifications
- CWNP: CWNA: https://www.cwnp.com/certifications/cwna
- CWNP: CWDP: https://www.cwnp.com/certifications/cwdp
- CWNP: CWSP: https://www.cwnp.com/certifications/cwsp
- MikroTik: Training and Certification: https://mikrotik.com/training/about
- CompTIA Network+: https://www.comptia.org/en-us/certifications/network/
- PeopleCert: ITIL Foundation (Version 5): https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1/itil-5-foundation-version-50-4154
- BICSI: Certification: https://www.bicsi.org/education-certification/certification
- ETA International: Fiber Optics and Data Cabling Certifications: https://www.etai.org/fiber_cabling.html
- Uptime Institute: Tier Classification System: https://uptimeinstitute.com/tiers
- Uptime Institute: Accredited Tier Specialist (ATS): https://ats.uptimeinstitute.com/education/accredited-tier-specialist-ats
- Uptime Institute: Accredited Tier Designer (ATD): https://atd.uptimeinstitute.com/education/accredited-tier-designer-atd
- TIA: TIA-942: https://tiaonline.org/products/tia-942/
- EPI: Certified Data Centre Professional (CDCP): https://epi-ap.com/cdcp
- O*NET OnLine: Computer Network Architects (15-1241.00): https://www.onetonline.org/link/summary/15-1241.00
- O*NET OnLine: Telecommunications Engineering Specialists (15-1241.01): https://www.onetonline.org/link/summary/15-1241.01
- O*NET OnLine: Computer Network Support Specialists (15-1231.00): https://www.onetonline.org/link/summary/15-1231.00
- SKKNI Kepmenaker No. 321 Tahun 2016, Bidang Jaringan Komputer (salinan di LSP Universitas Gunadarma): https://lsp.gunadarma.ac.id/media/skema/skkni/SKKNI_No._321-2016_NetworkAdministrator.pdf
- Selular.id: Komdigi Umumkan Hasil Seleksi Frekuensi 700 MHz dan 2,6 GHz (Juli 2026): https://selular.id/2026/07/komdigi-umumkan-hasil-seleksi-frekuensi-700-mhz-dan-26-ghz/
- detikInet: Dari Barat ke Timur, Segini Panjang Kabel Jaringan Internet Palapa Ring: https://inet.detik.com/telecommunication/d-7033747/dari-barat-timur-segini-panjang-kabel-jaringan-internet-palapa-ring
- Kontan: Kapasitas Data Center Indonesia Berpotensi Dekati 600 MW pada Akhir 2026: https://industri.kontan.co.id/news/kapasitas-data-center-indonesia-berpotensi-dekati-600-mw-pada-akhir-2026
- Smartfren: Media Note, Pemegang Saham XL Axiata dan Smartfren Setujui Merger XLSMART (2025): https://www.smartfren.com/app/uploads/2025/04/Media-Note-Pemegang-Saham-XL-Axiata-Smartfren-Setujui-Merger-XLSMART_2.pdf
- Microsoft News Center Indonesia: General Availability of Indonesia Central Cloud Region: https://news.microsoft.com/id-id/2025/04/15/general-availability-of-indonesia-central-cloud-region/
- RFC 3261: SIP: Session Initiation Protocol: https://www.rfc-editor.org/rfc/rfc3261

---

**Berikutnya:** `21-ekosistem-profesi/03-rumpun-keamanan` — profesi di rumpun keamanan: network security engineer, cybersecurity analyst, penetration tester, security architect, dan incident responder.

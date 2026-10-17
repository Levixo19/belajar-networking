# 21.1 Peta Ekosistem Profesi Jaringan

> **Prasyarat:** tidak ada yang wajib. Modul ini lebih bermakna jika Anda sudah membaca `18-karier-sertifikasi/01-peta-sertifikasi` dan `18-karier-sertifikasi/04-portofolio-interview`, serta mengenal dasar dari `00-fondasi/01-apa-itu-jaringan`.
> **Tujuan:** Anda bisa membedakan network engineer dan network administrator secara tegas, membaca peta 32 profesi di sekitar jaringan dalam 6 rumpun, merencanakan transisi karier yang realistis, dan memakai kerangka kompetensi resmi (NICE, SFIA, SKKNI, O*NET) untuk menilai diri sendiri.

---

## 1. Kenapa Jaringan Menjadi Pusat Gravitasi

Coba bayangkan satu pagi biasa di Jakarta. Pemilik warung kopi menerima pembayaran QRIS, karyawan bank membuka aplikasi core banking di kantor cabang, mahasiswa mengumpulkan tugas lewat LMS kampus, dan seorang developer melakukan `git push` ke server CI. Empat orang ini bekerja di dunia yang berbeda, tetapi semuanya berhenti di saat yang sama kalau satu hal gagal: jaringan.

Itulah alasan modul ini menyebut network engineer dan network administrator sebagai **pusat gravitasi** ekosistem TI. Bukan karena profesi jaringan lebih penting dari yang lain, tetapi karena tiga sifat yang tidak dimiliki domain lain dengan kadar yang sama.

**Pertama, ketergantungan.** Hampir setiap layanan TI adalah layanan jaringan. Database direplikasi lewat jaringan, storage diakses lewat iSCSI atau NFS, pengguna login lewat LDAP atau RADIUS, container saling bicara lewat overlay. Ketika jaringan bermasalah, tim lain ikut menganggur. Di banyak kantor ada lelucon lama: "Semua tiket akhirnya mampir ke meja tim jaringan." Kadang memang bukan salah jaringan, tetapi tim jaringanlah yang harus membuktikannya.

**Kedua, visibilitas.** Jaringan adalah satu-satunya tempat di mana semua lalu lintas lewat. Data flow, log firewall, dan tangkapan paket menjadi bahan baku bagi tim keamanan (deteksi serangan), tim SRE (diagnosis latensi), dan auditor (bukti segmentasi). Orang yang paham jaringan bisa "melihat" sistem dari posisi yang tidak dimiliki orang lain.

**Ketiga, bahasa bersama.** Istilah seperti DNS, TTL, MTU, latency, packet loss, TLS handshake, dan port dipakai developer, SRE, analis SOC, sampai konsultan. Siapa pun yang fasih dalam bahasa ini bisa berpindah rumpun lebih mudah. Karena itu, profesi jaringan sering menjadi batu loncatan ke profesi lain, dan sebaliknya banyak profesi lain diam-diam menuntut fondasi jaringan.

Skala kebutuhannya di Indonesia juga besar. Survei APJII 2025 mencatat pengguna internet Indonesia sekitar 229,43 juta orang, atau 80,66% dari populasi 284,43 juta. Di sisi penyedia, situs APJII per Oktober 2026 menampilkan 1.631 anggota APJII dan 4.442 pengguna Nomor PI (pemegang sumber daya alamat yang dikelola lewat IDNIC). Setiap organisasi itu, dari ISP kabupaten sampai operator besar, membutuhkan orang yang bisa mengonfigurasi router, menjaga BGP, dan memadamkan gangguan pukul dua pagi.

> [!TIP]
> Analogi yang membantu: jaringan adalah jalan raya, simpang, dan lampu lalu lintas sebuah kota. Profesi lain adalah penghuni gedung di sepanjang jalan itu. Penghuni bisa sangat ahli di gedungnya sendiri, tetapi kalau jalan macet total, tidak ada barang yang sampai. Network administrator adalah petugas yang menjaga lampu dan membuka simpang yang macet setiap hari. Network engineer adalah perencana yang memutuskan di mana jalan layang dibangun dan bagaimana arus dialihkan saat konstruksi.

---

## 2. Network Engineer vs Network Administrator: Garis Pemisahnya

Dua jabatan ini sering tertukar, bahkan di iklan lowongan. Ada perusahaan yang memasang judul "Network Engineer" padahal pekerjaannya memasang kabel dan mereset router pelanggan. Ada pula "Network Administrator" di bank yang ternyata merancang segmentasi data center. Karena itu, pegangan Anda bukan judul, melainkan **pertanyaan utama yang dijawab oleh pekerjaan itu**.

| Aspek | Network Administrator | Network Engineer |
|---|---|---|
| Pertanyaan utama | "Apakah jaringan berjalan baik hari ini?" | "Bagaimana seharusnya jaringan dibangun dan berubah?" |
| Horizon waktu | Jam dan hari: tiket, alarm, perubahan rutin | Minggu dan bulan: proyek, desain, migrasi |
| Artefak utama | Runbook, tiket, laporan uptime, backup konfigurasi, inventaris | Dokumen desain (HLD/LLD), rencana perubahan dan rollback, BoM, skrip otomasi |
| Kedalaman protokol | Menguasai operasi dan verifikasi (VLAN, STP, OSPF dasar, NAT, DHCP, Wi-Fi) | Memahami perilaku dan interaksi (OSPF multi-area, BGP policy, redistribusi, QoS, overlay) |
| Wewenang perubahan | Menjalankan perubahan standar yang sudah disetujui | Merancang perubahan non-standar dan menilai risikonya |
| Posisi dalam eskalasi | Lini pertama atau kedua untuk masalah jaringan | Lini kedua atau ketiga; tempat kasus "aneh" berakhir |
| Ukuran sukses | Uptime, MTTR, kepatuhan SLA tiket, backup lengkap | Proyek tepat waktu, change success rate, desain yang tahan gagal, utang teknis berkurang |
| Jenjang masuk realistis | Pemula (setelah 0-2 tahun pengalaman TI) | Menengah (umumnya setelah beberapa tahun sebagai admin, NOC, atau teknisi) |

Pemisahan ini bukan tembok. Di perusahaan kecil, satu orang memegang keduanya. Di operator besar, perbedaannya tajam sampai ke struktur organisasi: tim operasi (NOC dan administrator) terpisah dari tim engineering atau planning.

Kerangka resmi juga mengonfirmasi bahwa batasnya kabur:

- **O*NET** (basis data okupasi Departemen Tenaga Kerja AS) mencantumkan "Network Engineer" sebagai contoh judul di okupasi **15-1244.00 Network and Computer Systems Administrators** dan juga di **15-1241.01 Telecommunications Engineering Specialists**, bukan di 15-1241.00 Computer Network Architects. Artinya, di lapangan pun judul "engineer" sering melekat pada pekerjaan administrasi.
- **SKKNI bidang Jaringan Komputer** (Kepmenaker No. 321 Tahun 2016) membagi lingkup kerja menjadi tiga bidang: **perencanaan** (analisis dan perancangan), **implementasi** (pemasangan dan konfigurasi), dan **pemeliharaan** (mencari dan memperbaiki masalah). Network engineer berat di perencanaan dan implementasi; network administrator berat di implementasi dan pemeliharaan.
- **SFIA 9** memisahkan keterampilan **Network support (NTAS)**, yang didefinisikan pada level 1 sampai 5, dari **Network design (NTDS)**, yang didefinisikan pada level 2 sampai 6. Pola levelnya sudah bercerita: dukungan jaringan berhenti di level 5, sedangkan desain jaringan naik sampai level 6 (menetapkan kebijakan desain untuk organisasi).

> [!WARNING]
> Saat melamar, baca bagian "tanggung jawab" di iklan dan cocokkan dengan tabel di atas. Lowongan "Network Engineer" yang isinya "standby shift, instalasi ONT, laporan harian" adalah pekerjaan teknisi atau administrator. Itu tidak salah dan bisa menjadi pintu masuk yang baik, tetapi negosiasikan gaji dan ekspektasi berdasarkan isi pekerjaannya, bukan judulnya.

---

## 3. Profil: Network Administrator

### 3.1 Apa yang sebenarnya dikerjakan

Bayangkan Rina, network administrator di sebuah distributor farmasi di Surabaya dengan kantor pusat dan 25 cabang yang terhubung lewat VPN dan link MPLS dari dua operator.

- **07.30** Rina membuka dashboard Zabbix. Ada alarm semalam: link cabang Malang naik turun tiga kali antara pukul 01.00 dan 02.00. Ia mencatatnya dan membuka tiket ke operator dengan menyertakan grafik dan waktu kejadian.
- **08.15** Tiket dari bagian gudang: "Scanner barcode tidak bisa kirim data." Ia mengecek port switch gudang, menemukan port masuk VLAN yang salah setelah teknisi mengganti kabel kemarin, lalu memperbaikinya dan memperbarui catatan port.
- **10.00** Permintaan perubahan yang sudah disetujui: menambah SSID tamu untuk ruang rapat baru dengan VLAN terpisah dan pembatasan bandwidth. Ia mengikuti template standar, menguji dari laptop, lalu menutup tiket perubahan.
- **13.30** Pemeriksaan bulanan: memastikan backup konfigurasi otomatis semua router dan switch berjalan. Ia mencoba memulihkan satu konfigurasi ke perangkat lab untuk membuktikan backup benar-benar bisa dipakai.
- **15.00** Rapat singkat dengan tim server: aplikasi ERP terasa lambat di cabang. Rina membawa data utilisasi link dan latensi, sehingga diskusi berangkat dari angka, bukan dugaan.
- **16.30** Memperbarui diagram jaringan dan daftar alamat IP di NetBox setelah perubahan hari ini.

Tidak ada hari yang benar-benar sama, tetapi polanya jelas: **memantau, menanggapi, mengubah dengan aman, dan mendokumentasikan.**

### 3.2 Tanggung jawab dan ukuran keberhasilan

| Tanggung jawab | Ukuran keberhasilan yang umum |
|---|---|
| Menjaga ketersediaan jaringan | Availability per bulan (99,9% berarti batas sekitar 43 menit gangguan dalam 30 hari) |
| Menangani gangguan | MTTR (rata-rata waktu pemulihan), kepatuhan SLA respons dan penyelesaian tiket |
| Perubahan rutin | Persentase perubahan tanpa insiden susulan |
| Backup dan pemulihan | Persentase perangkat dengan backup terbaru; uji restore berkala berhasil |
| Keamanan dasar | Firmware sesuai baseline, akun dan password perangkat dikelola, ACL dan firewall sesuai kebijakan |
| Dokumentasi | Diagram, daftar IP, dan inventaris cocok dengan kondisi nyata |
| Kapasitas | Link yang melewati ambang utilisasi (misalnya 70%) dilaporkan sebelum menjadi keluhan |

### 3.3 Keahlian dan alat

**Teknis:** subnetting tanpa kalkulator, VLAN dan trunk, STP, routing statis dan OSPF dasar, NAT, DHCP, DNS, ACL dan aturan firewall, Wi-Fi (kanal, SSID, WPA2/WPA3), VPN site-to-site dan remote access, SNMP dan syslog, metodologi troubleshooting berlapis.

**Non-teknis:** disiplin mengikuti prosedur perubahan, menulis tiket dan laporan yang jelas, menjelaskan masalah teknis ke pengguna awam tanpa menggurui, tenang saat gangguan, dan tahu kapan harus eskalasi.

**Alat yang sering dipakai:** CLI Cisco IOS/IOS XE, MikroTik RouterOS (Winbox dan CLI), FortiGate, Zabbix atau LibreNMS untuk monitoring, Wireshark untuk analisis paket, Oxidized untuk backup konfigurasi otomatis, NetBox atau phpIPAM untuk dokumentasi IP dan inventaris, serta sistem tiket seperti Jira Service Management atau GLPI.

### 3.4 Sertifikasi per jenjang dan jalur kompetensi Indonesia

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | Cisco CCST Networking (100-150) | Ujian 50 menit, langkah pertama sebelum CCNA |
| Pemula | CompTIA Network+ (N10-009) | Vendor-netral; CompTIA menyarankan 9-12 bulan pengalaman sebagai junior network admin atau network support |
| Pemula | MikroTik MTCNA | Sangat relevan untuk ISP dan RT/RW net; sertifikat MikroTik berlaku 3 tahun |
| Pemula | Juniper JNCIA-Junos (JN0-106) | Berguna bila perusahaan memakai Juniper |
| Menengah | Cisco CCNA (200-301 v1.1) | Fondasi yang paling sering diminta lowongan enterprise |
| Menengah | CompTIA Security+ (SY0-701) | Versi baru SY0-801 dijadwalkan rilis 17 November 2026 |
| Indonesia | Sertifikasi okupasi Network Administrator (BNSP) | Diuji oleh LSP berlisensi BNSP dengan acuan SKKNI No. 321 Tahun 2016 |

Contoh nyata skema BNSP: skema okupasi Network Administrator milik LSP Universitas Gunadarma (disahkan 2020) mengemas 9 unit dari SKKNI 321/2016, antara lain Merancang Topologi Jaringan (J.611000.003.02), Mengkonfigurasi Routing pada Perangkat Jaringan antar Autonomous System (J.611000.014.02), Mengidentifikasi Sumber Kerusakan (J.611000.017.01), dan Melakukan Backup dan Restore Konfigurasi Perangkat Jaringan (J.611000.022.01). Setiap LSP dapat menyusun kemasan unit yang berbeda, jadi periksa skema LSP yang Anda tuju.

### 3.5 Jalur masuk, progresi, dan transisi

**Masuk:** jalur paling umum adalah dari helpdesk atau IT support, teknisi lapangan ISP, atau staf NOC. Lulusan SMK TKJ, D3, atau S1 juga bisa masuk langsung bila membawa MTCNA atau CCNA plus portofolio lab yang terdokumentasi.

**Progresi:** network administrator senior, lalu **network engineer** (rute paling alami), **network security engineer** (jika Anda senang mengurus firewall dan kebijakan akses), atau **IT operations manager** (jika Anda lebih tertarik mengelola orang, proses, dan SLA).

**Lateral:** system administrator (banyak irisan di DNS, DHCP, identitas), NOC technician, wireless network engineer.

Transisi ke network engineer biasanya terjadi ketika Anda mulai **dipercaya merancang perubahan**, bukan hanya menjalankannya. Tanda-tandanya: atasan meminta Anda menulis rencana migrasi, Anda menjadi orang yang dicari saat OSPF atau BGP berperilaku aneh, dan Anda mulai mengotomasi pekerjaan berulang.

### 3.6 Konteks pasar kerja Indonesia

Network administrator dicari hampir di semua sektor: perusahaan manufaktur dan distribusi dengan banyak cabang, rumah sakit, kampus dan sekolah, hotel, bank dan BPR, kantor pemerintah daerah, serta ISP lokal. Data gaji Jobstreet (di-refresh 1 Oktober 2026, dihitung dari rentang gaji yang dicantumkan pemberi kerja di iklan) menunjukkan rentang rata-rata bulanan Administrator Jaringan secara nasional **Rp 4,92 juta sampai Rp 6,325 juta**. Lokasi dengan rata-rata tertinggi di halaman yang sama adalah Jakarta Selatan (sekitar Rp 11 juta), diikuti beberapa kawasan tambang seperti Konawe Utara, Halmahera Selatan, dan Morowali (sekitar Rp 8,9 juta sampai Rp 9,1 juta). Pola ini masuk akal: lokasi industri terpencil membutuhkan orang yang mau tinggal di site dan mampu bekerja mandiri.

### 3.7 Belajar dari kurikulum ini

Kuasai modul berikut, kira-kira dalam urutan ini: `03-data-link/03-vlan`, `04-network-layer/02-subnetting`, `06-aplikasi/02-dhcp`, `06-aplikasi/05-layanan-lain`, `09-nat-acl-firewall/02-acl`, `10-wireless/02-802-11`, `14-monitoring-troubleshooting/01-metodologi`, `14-monitoring-troubleshooting/03-observability`, `17-desain-arsitektur/03-perencanaan-dokumentasi`, dan `19-mikrotik/03-firewall-nat`. Praktikkan di `lab/03-lab-ip-services` dan `lab/06-lab-mikrotik`.

### 3.8 Proyek portofolio dan pertanyaan wawancara

**Proyek:**

- Jaringan kantor tiga lantai di lab: VLAN per departemen, DHCP, ACL antar-VLAN, Wi-Fi tamu terisolasi, lengkap dengan diagram, daftar IP, dan runbook.
- Stack monitoring Zabbix atau LibreNMS untuk lima perangkat lab, ditambah backup konfigurasi otomatis dengan Oxidized dan bukti uji restore.
- Tiga laporan insiden simulasi (port salah VLAN, loop STP, DHCP habis) dengan timeline, akar masalah, dan tindakan pencegahan.

**Pertanyaan wawancara khas:**

- "Pengguna di lantai 3 tidak mendapat alamat IP, lantai lain normal. Apa langkah Anda, berurutan?"
- "Bagaimana Anda membuktikan backup konfigurasi benar-benar bisa dipakai saat darurat?"
- "Jelaskan perbedaan port access dan trunk, dan kapan native VLAN bisa menimbulkan masalah."

---

## 4. Profil: Network Engineer

### 4.1 Apa yang sebenarnya dikerjakan

Sekarang bayangkan Bagus, network engineer di sebuah system integrator di Jakarta. Kliennya bank daerah yang ingin memindahkan 40 kantor cabang dari link MPLS lama ke kombinasi broadband ganda dengan tunnel IPsec dan pengelolaan terpusat.

- **Senin pagi** Bagus menghadiri workshop kebutuhan dengan tim TI bank: aplikasi apa saja yang kritis, berapa toleransi gangguannya, dan aturan kepatuhan apa yang harus dipenuhi.
- **Selasa sampai Kamis** Ia menyusun dokumen desain: topologi hub-and-spoke dengan dua hub, skema pengalamatan, kebijakan routing (rute mana lewat link mana), QoS untuk aplikasi teller, dan kebutuhan logging untuk audit. Ia memodelkan desain di lab (Cisco CML atau EVE-NG) untuk menguji failover.
- **Jumat** Ia menulis rencana perubahan untuk pilot di tiga cabang: langkah demi langkah, uji verifikasi, dan **rencana rollback** jika gagal.
- **Sabtu pukul 22.00** Jendela perubahan. Bagus memimpin eksekusi pilot bersama teknisi lapangan dan admin bank. Satu cabang gagal membentuk tunnel karena MTU, ia menurunkan MSS, menguji ulang, lalu mencatat temuan ini untuk diterapkan di 37 cabang berikutnya.
- **Minggu berikutnya** Ia menulis template konfigurasi dan playbook Ansible supaya 37 cabang sisanya dipasang konsisten, lalu menyerahkan runbook operasional ke tim administrator bank.

Seorang network engineer di ISP atau operator akan punya cerita berbeda (peering BGP dengan upstream, kapasitas backbone, desain POP baru), tetapi polanya sama: **memahami kebutuhan, merancang, membuktikan di lab, mengubah dengan aman, lalu menyerahkan sesuatu yang bisa dioperasikan orang lain.**

### 4.2 Tanggung jawab dan ukuran keberhasilan

| Tanggung jawab | Ukuran keberhasilan yang umum |
|---|---|
| Desain dan arsitektur tingkat proyek | Desain lolos review, memenuhi target ketersediaan dan kapasitas |
| Implementasi dan migrasi | Proyek selesai sesuai jadwal; change success rate tinggi; tidak ada insiden besar akibat perubahan |
| Eskalasi tingkat lanjut | Waktu penyelesaian kasus lini ketiga; akar masalah ditemukan, bukan hanya gejala dipadamkan |
| Standardisasi | Template konfigurasi dan golden config dipakai luas; konfigurasi menyimpang berkurang |
| Otomasi | Jumlah pekerjaan manual berulang yang diganti skrip atau pipeline |
| Perencanaan kapasitas | Upgrade dilakukan sebelum utilisasi menjadi masalah |
| Transfer pengetahuan | Runbook dan pelatihan yang membuat tim operasi mandiri |

### 4.3 Keahlian dan alat

**Teknis:** semua keahlian administrator, ditambah OSPF multi-area dan BGP (atribut, policy, filtering), redistribusi, FHRP, QoS, VPN dan overlay (IPsec, GRE, VXLAN/EVPN), desain data center spine-leaf, jaringan cloud (VPC/VNet, routing hybrid), dasar keamanan (segmentasi, NGFW, zero trust), Python dan Ansible untuk otomasi, Git, serta kemampuan membaca dan menulis dokumen desain.

**Non-teknis:** menerjemahkan kebutuhan bisnis menjadi keputusan teknis, menilai risiko perubahan, menulis dengan jelas, mempresentasikan desain di depan klien atau komite perubahan, membimbing administrator junior, dan berani berkata "tidak" pada perubahan yang berbahaya.

**Alat yang sering dipakai:** Cisco IOS XE dan NX-OS, Juniper Junos, MikroTik RouterOS, FortiGate, Wireshark, Cisco CML atau EVE-NG, Containerlab, Ansible, Python (Netmiko, Nornir), NetBox sebagai sumber kebenaran, dan Git.

### 4.4 Sertifikasi per jenjang dan jalur kompetensi Indonesia

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | Cisco CCNA (200-301 v1.1) | Fondasi; Cisco tidak mensyaratkan prasyarat formal |
| Pemula | Juniper JNCIA-Junos (JN0-106) | Relevan di operator dan penyedia layanan |
| Menengah | Cisco CCNP Enterprise | Ujian inti 350-401 ENCOR ditambah satu ujian konsentrasi, misalnya 300-410 ENARSI (routing lanjutan) atau 300-420 ENSLD (desain) |
| Menengah | MikroTik MTCRE, lalu MTCINE | MTCINE mensyaratkan MTCRE; populer di ISP lokal |
| Menengah | Cisco CCNA Automation (200-901 CCNAAUTO) | Nama baru jalur otomasi Cisco (sebelumnya dikenal sebagai DevNet) |
| Menengah | Microsoft Certified: Azure Network Engineer Associate (AZ-700) | Untuk peran hybrid dan cloud; diperbarui gratis setiap 12 bulan |
| Senior | Cisco CCIE Enterprise Infrastructure | Ujian inti 350-401 ENCOR plus ujian lab 8 jam |
| Indonesia | Skema BNSP berbasis SKKNI 321/2016 | Unit perencanaan seperti J.611000.003.02 (topologi), J.611000.006.01 (keamanan), J.611000.007.02 (pemulihan), dan J.611000.024.01 (evaluasi pengembangan jaringan) |

Cisco juga memiliki jalur profesional khusus seperti CCNP Wireless, CCNP Service Provider, dan CCNP Data Center. Pilih setelah Anda tahu domain mana yang ingin didalami; jangan mengambil semuanya.

### 4.5 Jalur masuk, progresi, dan transisi

**Masuk:** sangat jarang langsung dari bangku kuliah, kecuali melalui program graduate atau management trainee di system integrator dan operator. Yang lebih umum adalah naik dari network administrator, NOC engineer, atau teknisi ISP setelah beberapa tahun, dengan CCNA dan bukti pernah menangani proyek.

**Progresi:** **network architect** (desain tingkat organisasi dan standar), **solution architect** (merancang solusi lintas domain, sering di sisi pre-sales), atau **site reliability engineer** (jika Anda tertarik pada keandalan layanan secara menyeluruh dan nyaman menulis kode).

**Lateral:** cloud network engineer, network security engineer, automation engineer, data center engineer, wireless network engineer. Semua ini adalah spesialisasi yang bercabang dari network engineer.

Transisi dari engineer ke architect terjadi ketika pertanyaan Anda bergeser dari "bagaimana mengonfigurasi ini" ke "kenapa kita butuh ini, berapa biayanya dalam lima tahun, dan apa risikonya bagi bisnis."

### 4.6 Konteks pasar kerja Indonesia

Perekrut utama network engineer adalah system integrator (yang melayani bank, BUMN, dan pemerintah), ISP dan operator seluler, penyedia data center, bank dan perusahaan keuangan yang mengelola jaringan sendiri, perusahaan teknologi dan startup dengan infrastruktur cloud, serta perusahaan tambang dan energi dengan banyak site terpencil. Data Jobstreet (di-refresh 1 Oktober 2026, dari rentang gaji di iklan lowongan) menunjukkan rentang rata-rata bulanan Insinyur Jaringan secara nasional **Rp 6 juta sampai Rp 9 juta**, dengan rata-rata tertinggi di halaman itu di Jakarta Barat (sekitar Rp 20 juta). Angka iklan cenderung mewakili posisi junior sampai menengah; posisi senior jarang mencantumkan gaji di iklan.

### 4.7 Belajar dari kurikulum ini

Setelah menguasai semua modul untuk administrator, lanjutkan ke: `04-network-layer/03-vlsm-cidr`, `07-routing-lanjutan/04-ospf`, `07-routing-lanjutan/06-bgp`, `07-routing-lanjutan/07-redistribusi-policy`, `09-nat-acl-firewall/03-firewall`, `11-wan-vpn/02-tunneling-vpn`, `11-wan-vpn/03-qos`, `14-monitoring-troubleshooting/04-studi-kasus`, `15-otomasi/03-python-jaringan`, `15-otomasi/04-ansible-cicd`, `16-datacenter-cloud-sdn/02-overlay-vxlan-evpn`, `17-desain-arsitektur/01-prinsip-desain`, dan `17-desain-arsitektur/04-studi-kasus-desain`. Proyek akhir `20-proyek-akhir/01-briefing-dan-aturan` adalah simulasi paling dekat dengan pekerjaan network engineer.

### 4.8 Proyek portofolio dan pertanyaan wawancara

**Proyek:**

- Lab multi-situs: OSPF di dalam, BGP ke dua ISP simulasi, failover yang diukur waktunya, lengkap dengan dokumen HLD dan LLD.
- Pipeline otomasi: NetBox sebagai sumber kebenaran, Ansible menghasilkan konfigurasi dari template, diuji otomatis di Containerlab sebelum diterapkan.
- Desain ulang jaringan perusahaan fiktif dengan 20 cabang: pilihan WAN, rencana migrasi bertahap, dan rencana rollback per tahap.

**Pertanyaan wawancara khas:**

- "Anda punya dua ISP dan trafik masuk menumpuk di satu link. Bagaimana Anda memengaruhi jalur trafik masuk dengan BGP?"
- "Rancang langkah migrasi OSPF dari satu area menjadi multi-area dengan gangguan seminimal mungkin."
- "Ceritakan perubahan yang pernah gagal. Apa yang Anda lakukan dalam 15 menit pertama, dan apa yang Anda ubah dalam proses sesudahnya?"

---

## 5. Enam Rumpun Ekosistem dan Irisannya dengan Jaringan

Di luar dua profesi inti, kurikulum ini memetakan 30 profesi lain ke dalam enam rumpun. Setiap rumpun punya **pertanyaan inti** yang berbeda dan **irisan** yang berbeda dengan jaringan.

| Rumpun | Pertanyaan inti | Irisan dengan jaringan |
|---|---|---|
| Infrastruktur | "Bagaimana konektivitas dibangun di domain khusus?" | Hampir total; ini adalah jaringan yang diperdalam ke cloud, wireless, telko, suara, data center, dan operasi NOC |
| Keamanan | "Bagaimana sistem dilindungi dan serangan dideteksi?" | Jaringan adalah medan pertempurannya: firewall, segmentasi, analisis lalu lintas, pemetaan jaringan saat pengujian |
| Operasi sistem & data | "Apakah server, database, dan storage melayani dengan baik?" | Bergantung pada DNS, NTP, identitas, jaringan storage, dan replikasi antarsitus |
| DevOps & SRE | "Bagaimana perangkat lunak dikirim dan dijaga tetap andal?" | Load balancer, jaringan container, IaC untuk jaringan cloud, diagnosis latensi |
| Dukungan & lapangan | "Apakah pengguna dan perangkat fisik berfungsi?" | Lapisan fisik, kabel dan fiber, perangkat akhir; pintu masuk paling umum ke karier jaringan |
| Tata kelola & konsultasi | "Apakah TI sesuai kebutuhan bisnis, aturan, dan risiko?" | Audit konfigurasi, rencana pemulihan bencana, desain solusi, pengelolaan proyek infrastruktur |

Sedikit penjelasan per rumpun:

**Infrastruktur.** Ini adalah "keluarga dekat" network engineer. Network architect menaikkan horizon desain ke tingkat organisasi. Cloud network engineer membawa konsep yang sama ke VPC, transit gateway, dan koneksi hybrid. Wireless engineer hidup di dunia RF dan survei lokasi. Telecom dan VoIP engineer mengurus transport operator dan layanan suara yang sangat sensitif terhadap jitter. Data center engineer menggabungkan jaringan spine-leaf dengan daya, pendinginan, dan rak. NOC technician adalah mata dan telinga yang memantau semuanya 24 jam.

**Keamanan.** Network security engineer adalah jembatan paling langsung dari jaringan ke keamanan. Analis keamanan siber (SOC) membaca log dan flow yang dihasilkan perangkat jaringan. Penetration tester memetakan jaringan sebelum mengeksploitasinya. Security architect merancang segmentasi dan zero trust. Incident responder perlu tahu cara mengisolasi segmen yang terinfeksi tanpa mematikan bisnis.

**Operasi sistem & data.** System administrator, DBA, storage administrator, system engineer, dan IT operations manager. Keluhan "aplikasi lambat" sering berada tepat di perbatasan server dan jaringan, sehingga kolaborasi rumpun ini dengan tim jaringan sangat intens.

**DevOps & SRE.** DevOps engineer, SRE, cloud infrastructure engineer, dan automation engineer. Rumpun ini menulis kode untuk infrastruktur. Mereka yang paham TCP, DNS, dan load balancing jauh lebih cepat menemukan akar masalah latensi dibanding yang hanya membaca metrik aplikasi.

**Dukungan & lapangan.** IT support technician, field network technician (misalnya teknisi instalasi FTTH), hardware engineer, dan IT asset manager. Banyak network engineer senior di Indonesia memulai dari sini: menarik kabel, menyambung fiber, mengganti modul SFP.

**Tata kelola & konsultasi.** IT consultant, IT auditor, disaster recovery specialist, solution architect, dan scrum master untuk tim infrastruktur. Mereka mungkin jarang mengetik perintah CLI, tetapi keputusan mereka (apa yang diaudit, berapa RTO, solusi apa yang dibeli) membentuk pekerjaan tim jaringan bertahun-tahun.

> [!TIP]
> Pola penting: semakin jauh sebuah rumpun dari "inti", semakin besar porsi pekerjaan non-teknis (komunikasi, analisis risiko, pengelolaan orang). Fondasi jaringan tidak hilang; ia berubah dari "keahlian utama" menjadi "keahlian pembeda".

---

## 6. Peta 32 Profesi dalam Satu Tabel

Tabel ini adalah peta ringkas. Profil lengkap setiap profesi ada di modul rumpun yang mengikuti modul ini. ID di kolom kedua dipakai konsisten di seluruh Tahap 21.

| No | ID | Profesi | Rumpun | Irisan utama dengan jaringan |
|---|---|---|---|---|
| 1 | `network-engineer` | Network Engineer | Inti | Desain, implementasi, eskalasi lanjut |
| 2 | `network-administrator` | Network Administrator | Inti | Operasi harian, perubahan rutin, troubleshooting |
| 3 | `network-architect` | Network Architect | Infrastruktur | Arsitektur dan standar jaringan organisasi |
| 4 | `cloud-network-engineer` | Cloud Network Engineer | Infrastruktur | VPC/VNet, hybrid, routing cloud |
| 5 | `wireless-network-engineer` | Wireless Network Engineer | Infrastruktur | RF, desain WLAN, survei lokasi |
| 6 | `telecom-engineer` | Telecommunication Engineer | Infrastruktur | Transport operator, fiber, backbone |
| 7 | `voip-engineer` | VoIP / Unified Communications Engineer | Infrastruktur | SIP, QoS, jitter, PBX |
| 8 | `data-center-engineer` | Data Center Engineer | Infrastruktur | Spine-leaf, kabel terstruktur, fasilitas |
| 9 | `noc-technician` | NOC Technician | Infrastruktur | Pemantauan 24 jam, triase, eskalasi |
| 10 | `network-security-engineer` | Network Security Engineer | Keamanan | Firewall, VPN, segmentasi, NAC |
| 11 | `cybersecurity-analyst` | Cybersecurity Analyst (SOC) | Keamanan | Log, flow, IDS, analisis paket |
| 12 | `penetration-tester` | Penetration Tester | Keamanan | Pemindaian, eksploitasi layanan jaringan |
| 13 | `security-architect` | Security Architect | Keamanan | Zero trust, desain segmentasi |
| 14 | `incident-responder` | Incident Responder | Keamanan | Isolasi segmen, bukti lalu lintas |
| 15 | `system-administrator` | System Administrator | Operasi | DNS, DHCP, identitas, server |
| 16 | `database-administrator` | Database Administrator | Operasi | Replikasi, latensi, koneksi aplikasi |
| 17 | `storage-administrator` | Storage Administrator | Operasi | iSCSI, NFS, SAN, backup lewat jaringan |
| 18 | `system-engineer` | System Engineer | Operasi | Virtualisasi, desain server dan jaringannya |
| 19 | `it-operations-manager` | IT Operations Manager | Operasi | SLA, proses insiden, koordinasi tim |
| 20 | `devops-engineer` | DevOps Engineer | DevOps & SRE | CI/CD, container, load balancer |
| 21 | `site-reliability-engineer` | Site Reliability Engineer | DevOps & SRE | SLO, latensi, diagnosis lintas lapisan |
| 22 | `cloud-infrastructure-engineer` | Cloud Infrastructure Engineer | DevOps & SRE | IaC, jaringan cloud, keamanan cloud |
| 23 | `automation-engineer` | (Network) Automation Engineer | DevOps & SRE | Python, Ansible, API perangkat |
| 24 | `it-support-technician` | IT Support Technician | Dukungan | Konektivitas pengguna, lapis 1 |
| 25 | `field-network-technician` | Field Network Technician | Dukungan | Kabel, fiber, instalasi perangkat |
| 26 | `hardware-engineer` | Hardware Engineer | Dukungan | Perangkat fisik, modul, perbaikan |
| 27 | `it-asset-manager` | IT Asset Manager | Dukungan | Inventaris perangkat dan lisensi |
| 28 | `it-consultant` | IT Consultant | Tata kelola | Asesmen dan rekomendasi infrastruktur |
| 29 | `it-auditor` | IT Auditor | Tata kelola | Audit konfigurasi dan kontrol akses |
| 30 | `disaster-recovery-specialist` | Disaster Recovery Specialist | Tata kelola | Link replikasi, RPO/RTO, failover situs |
| 31 | `solution-architect` | Solution Architect | Tata kelola | Desain solusi lintas domain, pre-sales |
| 32 | `scrum-master-infrastruktur` | Scrum Master (Tim Infrastruktur) | Tata kelola | Alur kerja proyek jaringan dan infrastruktur |

---

## 7. Pola Transisi Karier yang Umum

Karier jaringan jarang lurus, tetapi ada beberapa pola yang terus berulang. Durasi di bawah adalah **perkiraan kasar dari pola umum di industri**, bukan statistik resmi. Kecepatan Anda sangat bergantung pada lingkungan kerja: dua tahun di ISP yang sibuk bisa memberi pengalaman lebih banyak daripada lima tahun di kantor yang jaringannya jarang berubah.

### 7.1 Jalur klasik

```
IT Support / Helpdesk ──► NOC Technician ──► Network Administrator ──► Network Engineer
     (0-2 th)               (1-2 th)              (2-3 th)                  │
                                                                            ├──► Network / Solution Architect
                                                                            ├──► Site Reliability / Cloud Engineer
                                                                            └──► Network Security Engineer / Security Architect
```

| Langkah | Kenapa langkah ini masuk akal | Tanda Anda siap naik |
|---|---|---|
| IT support ke NOC | Anda sudah terbiasa dengan tiket, pengguna, dan tekanan; NOC menambah wawasan jaringan skala luas | Anda mulai lebih tertarik mencari tahu "kenapa jaringan lambat" daripada mengganti mouse |
| NOC ke network administrator | NOC melatih membaca alarm dan eskalasi; administrator diberi wewenang mengubah konfigurasi | Anda sering tahu solusinya sebelum engineer membalas eskalasi |
| Administrator ke engineer | Administrator menguasai operasi; engineer dipercaya merancang | Anda diminta menulis rencana perubahan dan desain kecil |
| Engineer ke architect | Engineer menguasai teknologi; architect menimbang biaya, risiko, dan arah bisnis | Anda lebih sering ditanya "sebaiknya kita pakai apa" daripada "bagaimana mengonfigurasi ini" |
| Engineer ke SRE atau cloud | Paham jaringan adalah keunggulan langka di tim yang mayoritas developer | Anda menikmati menulis kode dan berpikir dalam SLO |
| Engineer ke keamanan | Firewall, segmentasi, dan analisis lalu lintas sudah menjadi pekerjaan sehari-hari | Anda lebih tertarik "siapa yang boleh lewat" daripada "jalur mana yang tercepat" |

Satu patokan dari penerbit sertifikasi: CompTIA menyarankan 9 sampai 12 bulan pengalaman praktik sebagai junior network administrator atau network support technician sebelum mengambil Network+. Ini memberi gambaran bahwa bahkan sertifikasi tingkat dasar pun mengasumsikan pengalaman kerja nyata, bukan hanya belajar teori.

### 7.2 Jalur alternatif yang sering terlihat di Indonesia

- **Teknisi FTTH atau RT/RW net ke NOC ISP ke network engineer ISP.** Sangat umum di ISP regional. Kekuatan: Anda paham lapisan fisik dan perilaku pelanggan. Kelemahan yang perlu ditutup: BGP, desain, dan dokumentasi.
- **System administrator ke network engineer (atau sebaliknya).** Banyak perusahaan menengah menggabungkan dua peran ini. Kekuatan: pemahaman end-to-end dari aplikasi sampai kabel.
- **Network engineer ke automation engineer.** Jalur cepat bagi yang sudah nyaman dengan Python dan Git. Lihat Tahap 15 kurikulum ini.
- **Network engineer ke pre-sales atau solution architect di vendor dan system integrator.** Cocok bagi yang senang presentasi dan bertemu klien.
- **Network engineer ke IT auditor atau konsultan.** Cocok bagi yang senang menilai, menulis laporan, dan memahami regulasi.

### 7.3 Gambaran gaji sepanjang tangga

Halaman gaji Jobstreet (di-refresh 1 Oktober 2026) memberi gambaran kasar tangga di bawah ini. Semua angka adalah rata-rata bulanan nasional dari gaji yang dicantumkan di iklan lowongan.

| Peran (nama di Jobstreet) | Angka di Jobstreet |
|---|---|
| Teknisi Jaringan | Gaji bulanan biasa sekitar Rp 3,73 juta |
| Administrator Jaringan | Rentang rata-rata Rp 4,92 juta sampai Rp 6,325 juta |
| Insinyur Jaringan | Rentang rata-rata Rp 6 juta sampai Rp 9 juta |

> [!WARNING]
> Jangan memperlakukan angka di atas sebagai "harga pasar" Anda. Data berasal dari iklan yang mencantumkan gaji, yang cenderung didominasi posisi junior dan perusahaan menengah. Gaji sangat dipengaruhi kota, sektor (bank dan perusahaan tambang biasanya lebih tinggi), dan kemampuan negosiasi. Untuk posisi senior dan kepemimpinan, laporan gaji perusahaan rekrutmen lebih relevan. Sebagai gambaran plafon, Michael Page Indonesia dalam panduan gaji 2026 menyebut Cybersecurity Director di sektor teknologi dapat menerima sekitar Rp 200 juta per bulan.

---

## 8. Cara Memilih Rumpun: Pertanyaan Refleksi Diri

Sebelum memilih, jawab pertanyaan di bawah dengan jujur. Tidak ada jawaban benar; yang ada hanyalah kecocokan.

| Pertanyaan | Jika jawaban Anda... | Rumpun yang mungkin cocok |
|---|---|---|
| Saat sistem mati pukul dua pagi, apa yang Anda rasakan? | Tertantang, ingin langsung masuk dan memperbaiki | Inti, infrastruktur (NOC), operasi |
| | Ingin tahu siapa yang menyebabkannya dan bagaimana mencegahnya | Keamanan, tata kelola |
| Pekerjaan seperti apa yang membuat Anda lupa waktu? | Menggambar topologi dan menimbang pilihan desain | Infrastruktur (architect), tata kelola (solution architect) |
| | Menulis skrip yang menghapus pekerjaan manual | DevOps & SRE |
| | Memasang dan merapikan perangkat fisik | Dukungan & lapangan, data center |
| Seberapa nyaman Anda berbicara dengan orang non-teknis? | Sangat nyaman, bahkan menikmatinya | Tata kelola, dukungan, pre-sales |
| | Lebih suka bekerja dengan sistem daripada rapat | Infrastruktur, DevOps, keamanan ofensif |
| Apakah Anda siap kerja shift atau standby? | Ya, terutama di awal karier | NOC, operasi, ISP |
| | Tidak, butuh jam kerja teratur | Konsultasi, audit, beberapa peran engineering proyek |
| Bagaimana sikap Anda pada aturan dan dokumen? | Suka keteraturan, checklist, bukti | Audit, DR, ITSM, keamanan defensif |
| | Lebih suka bereksperimen dan membangun | Engineering, otomasi, DevOps |

> [!TIP]
> Jangan memilih hanya dari tabel. Lakukan **eksperimen 30 hari**: ambil satu proyek kecil dari rumpun yang Anda pertimbangkan (misalnya memasang Zabbix untuk rumpun infrastruktur, menulis playbook Ansible untuk DevOps, atau menganalisis PCAP serangan untuk keamanan). Perhatikan proyek mana yang membuat Anda ingin terus lanjut setelah jam belajar selesai. Itu sinyal yang lebih jujur daripada tren gaji.

> [!WARNING]
> Hindari memilih rumpun hanya karena sedang ramai dibicarakan. Keamanan siber dan cloud memang sedang naik daun, tetapi keduanya menuntut fondasi jaringan yang kuat. Orang yang melompat ke sana tanpa fondasi biasanya tersendat di tingkat menengah.

---

## 9. Kerangka Kompetensi Rujukan

Kerangka kompetensi adalah "kamus bersama" antara pencari kerja, pemberi kerja, dan lembaga pelatihan. Anda tidak perlu menghafalnya, tetapi tahu cara memakainya akan membantu saat menulis CV, menyusun rencana belajar, atau mengikuti uji kompetensi.

### 9.1 NICE Framework (NIST SP 800-181 Rev. 1)

NICE Workforce Framework for Cybersecurity diterbitkan NIST sebagai SP 800-181 revisi 1 pada November 2020. Isinya (Work Role Categories, Work Roles, Competency Areas, serta pernyataan Task, Knowledge, Skill atau TKS) diperbarui terpisah sebagai **NICE Framework Components**. Versi 2.0.0 memindahkan kategori Cyberspace Effects dan Cyberspace Intelligence ke DoD Cyber Workforce Framework, sehingga alat NICE Framework di situs NICCS (CISA) saat modul ini ditulis menampilkan 5 kategori dan 40 work role berdasarkan Components versi 2.2.0 (rilis April 2025).

Work role yang paling dekat dengan profesi inti adalah **Network Operations (IO-WRL-004)** di kategori Implementation and Operation: "Responsible for planning, implementing, and operating network services and systems, including hardware and virtual environments." Contoh task di dalamnya antara lain mendiagnosis masalah konektivitas (T0081), memasang atau mengganti hub, router, dan switch (T0126), memantau kapasitas dan kinerja jaringan (T0153), serta menyusun prosedur backup dan pemulihan jaringan (T1143). Work role tetangga yang relevan: Systems Administration, Technical Support, Infrastructure Support, dan Enterprise Architecture.

**Kapan dipakai:** saat Anda melamar ke organisasi yang memakai bahasa NICE (instansi pemerintah AS, perusahaan multinasional, program pelatihan keamanan), atau untuk memecah sebuah peran menjadi daftar task yang bisa Anda latih satu per satu.

### 9.2 SFIA 9

SFIA (Skills Framework for the Information Age) adalah kerangka keterampilan global untuk profesi digital. Versi 9 terbit 30 Oktober 2024 dan masih menjadi versi terkini; SFIA 10 secara tentatif direncanakan terbit antara kuartal 2 2027 dan kuartal 1 2028. SFIA memakai **tujuh level tanggung jawab**: Follow, Assist, Apply, Enable, Ensure/advise, Initiate/influence, dan Set strategy/inspire/mobilise.

Dua keterampilan inti untuk modul ini:

- **Network support (NTAS)**, "providing maintenance and support services for communications networks", didefinisikan pada level 1 sampai 5. Level 1 bekerja di bawah supervisi ketat; level 3 melakukan pemeliharaan secara mandiri dan mendiagnosis gangguan dengan alat khusus; level 5 memimpin operasi jaringan dan memastikan standar dukungan terpenuhi.
- **Network design (NTDS)**, merancang jaringan komunikasi sesuai kebutuhan bisnis, didefinisikan pada level 2 sampai 6. Level 4 merancang komponen jaringan dengan standar yang ada; level 5 menghasilkan arsitektur dan topologi untuk area tanggung jawabnya; level 6 menetapkan kebijakan dan standar desain jaringan organisasi.

**Kapan dipakai:** untuk menilai di level mana Anda sekarang dan apa yang membedakan level berikutnya. Network administrator yang matang biasanya kuat di NTAS level 3-4; network engineer kuat di NTAS level 4 dan NTDS level 4-5.

### 9.3 SKKNI dan sertifikasi BNSP

SKKNI (Standar Kompetensi Kerja Nasional Indonesia) ditetapkan lewat Keputusan Menteri Ketenagakerjaan. Uji kompetensinya dilaksanakan oleh LSP (Lembaga Sertifikasi Profesi) yang dilisensi BNSP. Tiga SKKNI yang paling relevan:

- **Kepmenaker No. 321 Tahun 2016**, SKKNI Kategori Informasi dan Komunikasi, Golongan Pokok Telekomunikasi, **Bidang Jaringan Komputer** (ditetapkan 24 November 2016, status berlaku). Standar ini memperbarui SKKNI bidang jaringan komputer yang dirumuskan tahun 2006 dan berisi 24 unit kompetensi berkode J.611000.001 sampai J.611000.024, mulai dari Mengumpulkan Kebutuhan Teknis Pengguna, Merancang Topologi dan Pengalamatan, Mengkonfigurasi Switch dan Routing (dalam satu AS maupun antar-AS), Mengatasi Serangan, sampai Mengevaluasi Jaringan Komputer untuk Pengembangan Masa Depan.
- **Kepmenaker No. 82 Tahun 2017**, SKKNI Golongan Pokok Aktivitas Jasa Informasi, **Bidang Administrasi Sistem** (ditetapkan 27 April 2017). Relevan untuk peran yang menggabungkan jaringan dan server.
- **Kepmenaker No. 22 Tahun 2019**, SKKNI Golongan Pokok Aktivitas Pemrograman, Konsultasi Komputer dan YBDI, Bidang Programming and Software Development, **Network and Infrastructure**, Operation and System Tools (ditetapkan 27 Februari 2019).

Di atas SKKNI ada **Peta Okupasi Nasional bidang TIK** yang diluncurkan Kementerian Kominfo pada 27 Juli 2017, berisi 125 okupasi dalam 14 area fungsi. Skema sertifikasi okupasi seperti Network Administrator merujuk pada SKKNI dan daftar unit okupasi dalam KKNI bidang TIK ini.

> [!TIP]
> Uji kompetensi BNSP menilai bukti per unit kompetensi. Jika Anda mendokumentasikan lab dan pekerjaan nyata (seperti yang dianjurkan di `18-karier-sertifikasi/04-portofolio-interview`), petakan setiap bukti ke kode unitnya. Misalnya, laporan lab backup dan restore konfigurasi menjadi bukti untuk J.611000.022.01.

### 9.4 O*NET

O*NET OnLine adalah basis data okupasi yang dikelola untuk Departemen Tenaga Kerja Amerika Serikat. Meski datanya tentang pasar kerja AS, deskripsi task, teknologi, dan "Job Zone" (tingkat persiapan) sangat berguna sebagai pembanding. Okupasi yang relevan:

| Kode | Okupasi | Job Zone | Catatan |
|---|---|---|---|
| 15-1244.00 | Network and Computer Systems Administrators | 3 (persiapan menengah) | Contoh judul mencakup Network Administrator dan Network Engineer |
| 15-1241.00 | Computer Network Architects | 4 (persiapan cukup besar) | Contoh judul mencakup WAN Engineer dan Wireless Network Engineer |
| 15-1241.01 | Telecommunications Engineering Specialists | 3 (persiapan menengah) | Contoh judul mencakup Network Engineer dan Infrastructure Engineer |
| 15-1231.00 | Computer Network Support Specialists | 4 (persiapan cukup besar) | Contoh judul mencakup Network Technician dan Network Support Specialist |

**Kapan dipakai:** untuk membaca daftar task dan teknologi yang biasa dipakai sebuah okupasi, lalu membandingkannya dengan pengalaman Anda.

### 9.5 Ringkasan cara memakai keempatnya

| Kerangka | Paling berguna untuk |
|---|---|
| NICE | Memecah peran menjadi task, terutama di sisi keamanan |
| SFIA | Menentukan level tanggung jawab dan arah naik level |
| SKKNI/BNSP | Sertifikasi kompetensi resmi di Indonesia dan rujukan kurikulum vokasi |
| O*NET | Membandingkan deskripsi pekerjaan dan teknologi yang dipakai |

---

## 10. Konteks Pasar Kerja Indonesia

Siapa saja yang merekrut orang jaringan di Indonesia, dan apa yang mereka cari?

| Jenis pemberi kerja | Yang biasanya dicari | Catatan |
|---|---|---|
| ISP regional dan RT/RW net | MikroTik, PPPoE, FTTH, BGP dasar, kesediaan shift | Pintu masuk paling terbuka; lebih dari 1.600 anggota APJII menunjukkan banyaknya penyelenggara |
| Operator seluler dan penyelenggara jaringan | IP/MPLS, transport, BGP, perencanaan kapasitas | Struktur tim besar dan terspesialisasi |
| System integrator | Multi-vendor, sertifikasi vendor, kemampuan menulis desain dan bertemu klien | Pengalaman proyek beragam dalam waktu singkat |
| Bank, asuransi, dan BUMN | Stabilitas, keamanan, dokumentasi, kepatuhan audit | Proses perubahan ketat; cocok bagi yang disiplin |
| Penyedia data center dan cloud | Spine-leaf, otomasi, operasi 24 jam | Tumbuh bersama kebutuhan hosting dan cloud lokal |
| Startup dan perusahaan teknologi | Cloud networking, IaC, kemampuan menulis kode | Peran jaringan sering dilebur ke tim platform atau SRE |
| Pemerintah, kampus, rumah sakit | Operasi jaringan kampus, Wi-Fi, keamanan dasar | Banyak posisi administrator; anggaran dan proses pengadaan memengaruhi teknologi |
| Tambang, energi, dan manufaktur di daerah | Kemandirian di site, jaringan industri, VSAT atau radio | Data Jobstreet menunjukkan rata-rata gaji administrator jaringan relatif tinggi di Konawe Utara, Halmahera, dan Morowali |

Tiga pengamatan praktis:

- **Kebutuhan tersebar, tidak hanya di Jakarta.** Penetrasi internet 80,66% (APJII 2025) berarti hampir setiap kabupaten punya penyelenggara layanan dan organisasi yang butuh jaringan. Namun, survei yang sama mencatat kontribusi Pulau Jawa sekitar 58,14% dari angka nasional, sehingga konsentrasi lowongan tetap paling padat di Jawa.
- **MikroTik dan Cisco hidup berdampingan.** ISP lokal dan UMKM banyak memakai MikroTik, sedangkan enterprise, bank, dan operator lebih sering memakai Cisco, Juniper, Fortinet, atau vendor besar lain. Menguasai keduanya (lihat `19-mikrotik/01-pengenalan-routeros` dan `referensi/padanan-cisco-mikrotik-linux`) memperluas pilihan Anda.
- **Bahasa Inggris teknis menjadi pembeda.** Dokumentasi vendor, RFC, forum, dan ujian sertifikasi hampir semuanya berbahasa Inggris. Anda tidak harus fasih berbicara, tetapi harus nyaman membaca.

---

## 11. Ringkasan

- Jaringan adalah **pusat gravitasi** ekosistem TI karena tiga hal: semua layanan bergantung padanya, ia melihat semua lalu lintas, dan bahasanya dipakai semua profesi lain.
- **Network administrator** menjawab "apakah jaringan berjalan baik hari ini" (operasi, perubahan rutin, troubleshooting, dokumentasi). **Network engineer** menjawab "bagaimana jaringan seharusnya dibangun dan berubah" (desain, migrasi, eskalasi lanjut, otomasi).
- Judul lowongan sering menyesatkan; O*NET sendiri menaruh judul "Network Engineer" di okupasi administrator. Baca isi tanggung jawabnya.
- Ekosistem dipetakan ke **6 rumpun** (infrastruktur, keamanan, operasi sistem & data, DevOps & SRE, dukungan & lapangan, tata kelola & konsultasi) dengan total **32 profesi**.
- Jalur klasik: IT support, NOC, network administrator, network engineer, lalu bercabang ke architect, SRE/cloud, atau keamanan. Durasi setiap langkah sangat bergantung pada lingkungan kerja.
- Pilih rumpun lewat refleksi diri dan eksperimen 30 hari, bukan hanya tren.
- Gunakan **NICE** (task), **SFIA** (level), **SKKNI/BNSP** (sertifikasi resmi Indonesia, terutama Kepmenaker 321/2016), dan **O*NET** (pembanding deskripsi kerja).
- Data Jobstreet Oktober 2026: Administrator Jaringan rata-rata Rp 4,92-6,325 juta, Insinyur Jaringan Rp 6-9 juta per bulan secara nasional; angka ini bias ke posisi junior dan menengah.

---

## 12. Latihan

1. Sebuah lowongan berjudul "Network Engineer" di ISP kota menengah mencantumkan tugas: standby shift malam, instalasi ONT di rumah pelanggan, laporan gangguan harian, dan reset perangkat pelanggan. Bagaimana Anda mengklasifikasikan pekerjaan ini, dan apa yang Anda lakukan dengan informasi itu saat melamar?
2. Anda network administrator di sebuah rumah sakit. Manajer TI meminta Anda "naik kelas" menjadi network engineer dalam dua tahun. Susun tiga perubahan konkret dalam cara Anda bekerja yang akan menunjukkan pergeseran itu.
3. Tim aplikasi mengeluh ERP lambat di cabang, tim server bilang server sehat, dan tim jaringan bilang link tidak penuh. Jelaskan kenapa situasi ini menggambarkan posisi jaringan sebagai "pusat gravitasi", dan data apa yang sebaiknya dibawa tim jaringan ke rapat.
4. Rekan Anda, teknisi FTTH dengan pengalaman dua tahun, ingin pindah ke keamanan siber karena mendengar gajinya tinggi. Apa saran Anda, dengan mempertimbangkan pola transisi dan fondasi yang dibutuhkan?
5. Anda ingin mengikuti uji kompetensi BNSP skema Network Administrator. Bagaimana Anda memanfaatkan SKKNI 321/2016 untuk mempersiapkan bukti, dan contoh dokumen lab apa yang cocok untuk unit J.611000.017.01 dan J.611000.022.01?
6. Dengan memakai SFIA, jelaskan perbedaan antara seseorang di Network support level 3 dan seseorang di Network design level 5. Mana yang lebih mungkin berjudul network administrator dan mana network engineer?
7. Seorang lulusan baru berkata, "Gaji network engineer di Jobstreet cuma Rp 6-9 juta, jadi kariernya mentok." Apa kelemahan kesimpulan ini?
8. Anda sedang bimbang antara rumpun DevOps & SRE dan rumpun infrastruktur. Rancang eksperimen 30 hari untuk menguji kecocokan Anda dengan keduanya.
9. Sebuah bank meminta Anda menyusun deskripsi jabatan network engineer yang tidak tumpang tindih dengan network administrator yang sudah ada. Tuliskan tiga tanggung jawab yang hanya milik engineer dan tiga yang tetap milik administrator.

<details>
<summary>Jawaban</summary>

1. Isi pekerjaannya adalah pekerjaan **teknisi lapangan dan NOC**, bukan network engineer menurut pembagian di modul ini. Tidak ada unsur desain, perencanaan perubahan non-standar, atau eskalasi lanjut. Itu tidak berarti lowongannya buruk: untuk pemula, ini pintu masuk yang bagus ke ISP. Yang perlu Anda lakukan adalah menilai gaji dan harapan berdasarkan isi pekerjaan (bandingkan dengan teknisi atau administrator, bukan engineer), menanyakan saat wawancara apakah ada jalur naik ke tim engineering, dan siapa yang mengerjakan konfigurasi core serta BGP. Dalam CV di masa depan, tuliskan tanggung jawab nyata Anda, bukan hanya judulnya, karena pewawancara berikutnya akan menilai isinya.

2. Contoh perubahan: pertama, mulai **menulis rencana perubahan** lengkap dengan langkah verifikasi dan rollback untuk setiap perubahan yang Anda kerjakan, bukan hanya mengeksekusi template. Kedua, **ambil satu proyek kecil yang butuh desain**, misalnya memisahkan jaringan perangkat medis ke segmen sendiri dengan aturan firewall yang terdokumentasi, lalu presentasikan desainnya ke manajer. Ketiga, **otomasi satu pekerjaan berulang**, misalnya skrip Python yang mengecek konsistensi VLAN di semua switch atau playbook backup. Ketiganya menggeser Anda dari "menjalankan" ke "merancang dan memperbaiki cara kerja", sesuai garis pemisah administrator dan engineer. Mengambil CCNA lalu memulai jalur CCNP Enterprise akan memperkuat bukti ini.

3. Situasi ini menunjukkan sifat **ketergantungan** dan **visibilitas**: semua tim bergantung pada jaringan, dan hanya jaringan yang melihat lalu lintas antara pengguna, server, dan aplikasi. Tim jaringan sering menjadi pihak yang harus membuktikan di mana masalahnya. Data yang sebaiknya dibawa: grafik utilisasi link cabang per interval singkat (bukan rata-rata harian yang menyembunyikan lonjakan), latensi dan packet loss antara cabang dan data center, hasil tangkapan paket yang menunjukkan waktu respons TCP versus waktu respons aplikasi, catatan retransmisi, dan perubahan apa pun di jalur itu dalam beberapa hari terakhir. Dengan data ini, diskusi berpindah dari saling menyalahkan ke analisis bersama.

4. Sarankan agar ia **tidak melompat langsung**, melainkan membangun jembatan. Pengalaman lapisan fisik dan pelanggan adalah modal, tetapi keamanan siber menuntut pemahaman TCP/IP, routing, firewall, dan analisis log. Jalur yang realistis: perkuat fondasi jaringan (Network+ atau CCNA, modul Tahap 4 sampai 9 dan Tahap 12 kurikulum ini), cari posisi NOC atau network administrator yang menyentuh firewall, lalu bergeser ke SOC analyst atau network security engineer. Ingatkan juga bahwa angka gaji tinggi di keamanan umumnya untuk posisi senior; posisi awal SOC sering berbasis shift dengan gaji yang tidak jauh dari peran jaringan pemula. Sarankan eksperimen 30 hari, misalnya menganalisis PCAP serangan, untuk menguji minatnya.

5. Unduh atau baca SKKNI 321/2016 dan skema LSP yang dituju, lalu buat tabel: kode unit, judul unit, kriteria unjuk kerja, dan bukti yang Anda miliki. Untuk **J.611000.017.01 Mengidentifikasi Sumber Kerusakan**, bukti yang cocok adalah laporan troubleshooting terstruktur: gejala, hipotesis, langkah pengujian per lapisan, temuan, dan perbaikan, misalnya studi kasus dari lab atau tiket nyata yang sudah disamarkan. Untuk **J.611000.022.01 Melakukan Backup dan Restore Konfigurasi Perangkat Jaringan**, bukti yang cocok adalah dokumentasi backup otomatis (misalnya Oxidized), jadwalnya, lokasi penyimpanan, serta tangkapan layar atau log saat Anda memulihkan konfigurasi ke perangkat uji dan memverifikasi hasilnya. Susun bukti ini rapi karena asesor menilai per unit.

6. **Network support level 3 (Apply)** bekerja mandiri dalam pemeliharaan jaringan, mendiagnosis gangguan dengan alat khusus, dan mengumpulkan data kinerja untuk perbaikan. Fokusnya menjaga jaringan yang sudah ada tetap sehat. **Network design level 5 (Ensure, advise)** menghasilkan arsitektur dan topologi untuk area tanggung jawabnya, menetapkan parameter desain sesuai kebutuhan bisnis, dan menilai risiko jaringan. Fokusnya membentuk jaringan. Yang pertama lebih mungkin berjudul network administrator, yang kedua network engineer senior atau bahkan menuju network architect.

7. Kelemahannya: pertama, data Jobstreet berasal dari **iklan yang mencantumkan gaji**, yang didominasi posisi junior dan menengah; posisi senior jarang mencantumkan angka. Kedua, itu **rata-rata nasional**; halaman yang sama menunjukkan rata-rata jauh lebih tinggi di lokasi tertentu seperti Jakarta Barat. Ketiga, angka itu mengabaikan **progresi**: network engineer bisa naik ke architect, solution architect, SRE, atau peran keamanan dan kepemimpinan yang berada di rentang jauh lebih tinggi. Keempat, gaji juga dipengaruhi sektor, sertifikasi, kemampuan bahasa Inggris, dan negosiasi. Kesimpulan yang lebih tepat: angka itu adalah titik awal, bukan plafon.

8. Contoh rancangan: minggu 1 dan 2 untuk infrastruktur, misalnya membangun lab dua router dengan OSPF dan BGP, memasang Zabbix, lalu mensimulasikan gangguan dan mencatat cara Anda menemukannya. Minggu 3 dan 4 untuk DevOps & SRE, misalnya membuat aplikasi web sederhana dalam container, menulis pipeline CI yang menjalankan tes, memasang load balancer, lalu mengukur latensi dan mendefinisikan SLO sederhana. Di akhir setiap minggu, catat: bagian mana yang membuat Anda ingin terus bekerja, bagian mana yang terasa seperti beban, dan berapa jam yang Anda habiskan tanpa disuruh. Bandingkan catatan itu di akhir 30 hari. Keduanya sama-sama memakai fondasi jaringan, jadi tidak ada usaha yang terbuang.

9. Contoh tanggung jawab yang hanya milik **engineer**: merancang dan mendokumentasikan arsitektur jaringan untuk proyek baru (HLD dan LLD); menilai risiko dan menyetujui secara teknis perubahan non-standar sebelum masuk komite perubahan; menjadi lini eskalasi ketiga dan melakukan analisis akar masalah untuk insiden besar. Contoh yang tetap milik **administrator**: memantau jaringan dan menindaklanjuti alarm setiap hari; menjalankan perubahan standar yang sudah disetujui, seperti menambah VLAN atau port akses sesuai template; menjaga backup konfigurasi, inventaris, dan dokumentasi tetap mutakhir. Garis pemisahnya adalah "merancang dan menilai" versus "mengoperasikan dan menjaga".

</details>

---

## 13. Sumber

- NIST SP 800-181 Rev. 1, Workforce Framework for Cybersecurity (NICE Framework) dan versi Components terkini: https://www.nist.gov/itl/applied-cybersecurity/nice/nice-framework-resource-center/nice-framework-current-versions
- NICCS (CISA), NICE Framework Tool: Work Role Network Operations (IO-WRL-004): https://niccs.cisa.gov/tools/nice-framework/work-role/network-operations
- NICCS (CISA), NICE Framework Components v2.0.0 Changes & Updates: https://niccs.cisa.gov/news-events/featured-stories/nice-framework-components-version-200-changes-updates
- SFIA 9, Network support (NTAS): https://sfia-online.org/en/skillcode/9/NTAS
- SFIA 9, Network design (NTDS): https://sfia-online.org/en/skillcode/9/NTDS
- SFIA 9, Levels of responsibility: https://sfia-online.org/en/sfia-9/responsibilities
- SFIA 10 (rencana dan konsultasi): https://sfia-online.org/en/sfia-10
- JDIH Kemnaker, Kepmenaker No. 321 Tahun 2016 (SKKNI Bidang Jaringan Komputer): https://jdih.kemnaker.go.id/peraturan/detail/1464/keputusan-menteri-ketenagakerjaan-nomor-321-tahun-2016
- JDIH Kemnaker, Kepmenaker No. 82 Tahun 2017 (SKKNI Bidang Administrasi Sistem): https://jdih.kemnaker.go.id/peraturan/detail/1489/keputusan-menaker-nomor-82-tahun-2017
- JDIH Kemnaker, Kepmenaker No. 22 Tahun 2019 (SKKNI Network and Infrastructure dan lainnya): https://jdih.kemnaker.go.id/peraturan/detail/2137/keputusan-menaker-nomor-22-tahun-2019
- Lampiran SKKNI No. 321 Tahun 2016 (salinan di LSP Universitas Gunadarma): https://lsp.gunadarma.ac.id/media/skema/skkni/SKKNI_No._321-2016_NetworkAdministrator.pdf
- LSP Universitas Gunadarma, Skema Sertifikasi Okupasi Network Administrator: https://lsp.gunadarma.ac.id/media/skema/Skema_Network_Administrator.pdf
- idEA, Peluncuran Peta Okupasi Nasional Bidang TIK: https://idea.or.id/artikel/peluncuran--peta-okupasi-nasional-bidang-tik?lang=en
- O*NET OnLine, 15-1244.00 Network and Computer Systems Administrators: https://www.onetonline.org/link/summary/15-1244.00
- O*NET OnLine, 15-1241.00 Computer Network Architects: https://www.onetonline.org/link/summary/15-1241.00
- O*NET OnLine, 15-1241.01 Telecommunications Engineering Specialists: https://www.onetonline.org/link/summary/15-1241.01
- O*NET OnLine, 15-1231.00 Computer Network Support Specialists: https://www.onetonline.org/link/summary/15-1231.00
- Cisco, daftar sertifikasi: https://www.cisco.com/site/us/en/learn/training-certifications/certifications/index.html
- Cisco, CCNA (200-301 v1.1): https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html
- Cisco, CCNP Enterprise: https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccnp-enterprise/index.html
- Cisco, CCIE Enterprise Infrastructure: https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccie-enterprise-infrastructure/index.html
- Cisco, ujian CCST Networking (100-150): https://www.cisco.com/site/us/en/learn/training-certifications/exams/ccst-networking.html
- Cisco, CCNA Automation: https://www.cisco.com/site/us/en/learn/training-certifications/certifications/automation/ccna-automation/index.html
- CompTIA Network+: https://www.comptia.org/en-us/certifications/network/
- CompTIA Security+ V8 (SY0-801): https://www.comptia.org/en/certifications/security/v8/
- MikroTik, program pelatihan dan sertifikasi: https://mikrotik.com/training/about
- Juniper, JNCIA-Junos: https://learningportal.juniper.net/juniper/user_activity_info.aspx?id=14354
- Microsoft Learn, Azure Network Engineer Associate (AZ-700): https://learn.microsoft.com/en-us/credentials/certifications/azure-network-engineer-associate/
- Kontan, Penetrasi Internet di Indonesia Capai 80,66% (survei APJII 2025): https://industri.kontan.co.id/news/penetrasi-internet-di-indonesia-capai-8066-pemerataan-masih-jadi-tantangan
- APJII, situs resmi (jumlah anggota dan pengguna Nomor PI): https://apjii.or.id/
- Jobstreet, Gaji Insinyur Jaringan di Indonesia: https://id.jobstreet.com/id/career-advice/role/network-engineer/salary
- Jobstreet, Gaji Administrator Jaringan di Indonesia: https://id.jobstreet.com/id/career-advice/role/network-administrator/salary
- Michael Page Indonesia, Highest Paying Jobs in Indonesia (Salary Guide 2026): https://www.michaelpage.co.id/recruitment-expertise/market-insights/highest-paying-jobs-indonesia

---

**Berikutnya:** `21-ekosistem-profesi/02-rumpun-infrastruktur`. Tujuh profesi yang memperdalam jaringan ke domain khusus: architect, cloud, wireless, telko, VoIP, data center, dan NOC.

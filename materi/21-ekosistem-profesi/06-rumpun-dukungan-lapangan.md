# 21.6 Rumpun Dukungan Teknis & Lapangan

> **Prasyarat:** `18-karier-sertifikasi/01-peta-sertifikasi`, `02-layer-fisik/02-kabel-copper`, `02-layer-fisik/03-fiber`, dan `14-monitoring-troubleshooting/01-metodologi`
> **Tujuan:** Anda memahami empat profesi di rumpun dukungan (IT support technician, field network technician, hardware engineer, IT asset manager): apa yang sebenarnya dikerjakan, cara mengukur keberhasilannya, sertifikasi yang masih berlaku per 2025-2026, jalur kompetensi Indonesia (SKKNI/BNSP, K3), dan jalur nyata dari helpdesk atau teknisi lapangan menuju network administrator.

---

## 1. Kenapa Rumpun Ini Penting

Kalau Anda bertanya kepada network engineer senior di Indonesia bagaimana mereka memulai karier, banyak jawabannya mirip: "Dulu saya IT support di kantor cabang", "Saya mulai sebagai teknisi pasang IndiHome", atau "Saya anak SMK TKJ yang magang di ISP lokal, kerjanya narik kabel." Rumpun dukungan teknis dan lapangan adalah **pintu masuk** yang paling sering dilewati orang, karena tiga hal:

1. **Syarat masuknya paling terjangkau.** Banyak lowongan teknisi dan helpdesk menerima lulusan SMK atau D3, dan yang dicari lebih dulu adalah kemampuan praktik serta sikap kerja, bukan gelar.
2. **Pekerjaannya memaksa Anda menyentuh semua layer.** Helpdesk memegang layer 7 (aplikasi, akun, email) sampai layer 1 (kabel lepas, port mati). Teknisi lapangan memegang layer 1 dan 2 secara fisik. Pengalaman ini yang membuat troubleshooting Anda kelak terasa "membumi".
3. **Data pasar kerjanya nyata dan besar.** Survei APJII 2025 mencatat pengguna internet Indonesia sekitar 229,4 juta jiwa atau 80,66% populasi. Setiap sambungan rumah, kantor, sekolah, dan menara butuh orang yang memasang, merawat, dan membantu penggunanya.

Rumpun ini juga punya sisi yang sering terlupakan: **perangkat dan aset**. Hardware engineer merancang, menguji, dan memperbaiki perangkat yang menjadi tulang punggung jaringan, sedangkan IT asset manager memastikan setiap laptop, switch, lisensi, dan modul SFP tercatat, terpakai dengan benar, dan dimusnahkan dengan aman di akhir umurnya.

> [!TIP]
> Anggap modul ini sebagai peta, bukan vonis. Banyak orang hanya singgah satu atau dua tahun di rumpun ini lalu naik ke administrator. Sebagian lain justru menetap dan menjadi ahli yang sangat dicari (misalnya spesialis fiber outside plant atau ITAM di perusahaan multinasional). Keduanya jalur yang sah.

---

## 2. Tabel Perbandingan Empat Profesi

| Aspek | IT Support Technician | Field Network Technician | Hardware Engineer | IT Asset Manager |
|---|---|---|---|---|
| Fokus utama | Pengguna dan perangkat akhir | Infrastruktur fisik jaringan (tembaga, fiber, perangkat CPE) | Desain, uji, dan perbaikan perangkat elektronik | Siklus hidup aset TI dan lisensi |
| Tempat kerja | Meja helpdesk, ruang kantor, remote | Jalan, tiang, gedung, rumah pelanggan, ruang server | Lab, pabrik, pusat servis | Kantor, gudang, data center (audit) |
| Posisi masuk realistis | Pemula | Pemula | Pemula (umumnya S1/D3 Teknik Elektro) | Menengah (biasanya dari support atau procurement) |
| Ukuran keberhasilan | SLA respons/penyelesaian, FCR, CSAT | Waktu pasang, tingkat gangguan ulang, redaman sesuai budget | Lolos uji prototipe, yield produksi, tingkat retur | Akurasi inventaris, kepatuhan lisensi, penghematan biaya |
| Sertifikasi kunci | CompTIA A+ (220-1201/1202), Google IT Support, HDI, ITIL Foundation | FOA CFOT/CFOS, BICSI Installer, BNSP (SKKNI 101/2018), lisensi K3 ketinggian | IPC J-STD-001 / IPC-A-610 (CIS), IPC CID | IAITAM CAMP/CHAMP/CSAM/CITAM, ITIL Foundation |
| Jalur Indonesia | SKKNI Computer Technical Support (Kepmenaker 285/2016) | SKKNI Instalasi Fiber Optik (Kepmenaker 101/2018), SKKNI Jaringan Komputer (321/2016) | Belum ditemukan skema langsung untuk desain hardware; K3 listrik relevan | Tidak ada SKKNI khusus ITAM yang ditemukan |
| Jarak ke network admin | Dekat (6-24 bulan dengan belajar terarah) | Dekat (sudah pegang L1/L2 dan CPE) | Sedang (beralih dari desain ke operasi) | Sedang (kuat di proses, perlu kedalaman teknis) |

Angka "6-24 bulan" di atas adalah rentang ilustrasi untuk perencanaan pribadi, bukan statistik. Kecepatan Anda sangat bergantung pada lingkungan kerja dan konsistensi belajar.

---

## 3. IT Support Technician (Helpdesk dan Desktop Support)

### 3.1 Apa yang sebenarnya dikerjakan

Bayangkan Anda IT support di kantor pusat sebuah perusahaan distribusi di Jakarta dengan 400 karyawan dan 12 cabang.

```
07.45  Cek dashboard tiket (mis. Jira Service Management atau GLPI).
       Ada 14 tiket baru semalam. Tiga berlabel P2 (prioritas tinggi).
08.10  Tiket P2: kasir cabang Bekasi tidak bisa login aplikasi POS.
       Remote via AnyDesk, ternyata jam Windows melenceng 9 menit
       sehingga autentikasi Kerberos gagal. Sinkronkan waktu ke server NTP,
       login berhasil. Tutup tiket, catat penyebab.
09.00  Onboarding 3 karyawan baru: buat akun di Active Directory/Entra ID,
       pasang laptop dengan image standar, daftarkan ke Intune,
       serahkan aset dengan berita acara (nomor aset ditempel).
10.30  "Internet lantai 3 lambat." Datang ke lokasi. Ternyata satu
       komputer menarik update besar dan satu access point
       terpasang di port switch yang terkunci 100 Mbps. Laporkan ke
       network admin (tier 2) dengan bukti: port, VLAN, hasil speedtest.
13.00  Ganti keyboard rusak, reset MFA direktur yang ganti HP.
14.00  Printer jaringan di gudang "offline". Cek: IP printer berubah
       karena dapat DHCP baru. Usulkan reservasi DHCP ke admin.
16.00  Perbarui artikel knowledge base: "Cara memperbaiki jam Windows
       yang menyebabkan gagal login". Tiket serupa minggu depan bisa
       diselesaikan tier 1 dalam 5 menit.
```

Perhatikan polanya: separuh pekerjaan adalah **jaringan dan identitas** (DHCP, NTP, VLAN, port switch, autentikasi), separuh lagi perangkat dan pengguna. Itulah sebabnya helpdesk adalah tempat belajar jaringan yang sangat baik bila Anda mau penasaran.

### 3.2 Tanggung jawab dan ukuran keberhasilan

Organisasi support biasanya disusun bertingkat:

```
Tier 0  Swalayan: portal, knowledge base, reset password mandiri
Tier 1  Service desk: terima tiket/telepon, diagnosis awal, solusi cepat
        (akun, printer, aplikasi kantor), eskalasi bila perlu
Tier 2  Desktop/field support dan admin spesialis: masalah yang butuh
        akses lebih tinggi atau kunjungan fisik (switch port, VLAN,
        reimage, perbaikan hardware)
Tier 3  Engineer/vendor: akar masalah, perubahan desain, bug produk
```

Kerangka yang paling banyak dipakai untuk mengatur ini adalah **ITIL**: insiden (memulihkan layanan secepatnya), permintaan layanan (akun baru, pinjam laptop), problem (mencari akar masalah insiden berulang), dan perubahan (change). Prioritas tiket biasanya dihitung dari **dampak x urgensi**.

Metrik yang biasa dipakai:

| Metrik | Arti | Contoh target internal |
|---|---|---|
| Waktu respons (SLA) | Tiket pertama kali ditangani | P1 dalam 15 menit |
| Waktu penyelesaian / MTTR | Rata-rata waktu sampai layanan pulih | P3 selesai dalam 1 hari kerja |
| First Contact Resolution (FCR) | Persentase selesai pada kontak pertama tanpa eskalasi | Ditentukan tiap organisasi |
| CSAT | Kepuasan pengguna setelah tiket ditutup | Survei 1-5 |
| Backlog dan reopen rate | Tiket menumpuk dan tiket yang dibuka ulang | Tren turun dari bulan ke bulan |

Angka di kolom target hanyalah contoh untuk menggambarkan bentuk SLA. Setiap organisasi menetapkan angka sendiri di dokumen SLA atau OLA mereka, jadi jangan menghafal angka, pahami cara membacanya.

> [!WARNING]
> Metrik bisa menyesatkan. Tim yang dikejar "tiket ditutup cepat" cenderung menutup tiket sebelum masalah benar-benar selesai, sehingga reopen rate naik. IT support yang baik menutup tiket dengan **bukti verifikasi** ("pengguna sudah mencoba login dan berhasil pukul 08.32").

### 3.3 Keahlian teknis, non-teknis, dan alat

**Teknis:** instalasi dan perbaikan Windows, macOS, dan dasar Linux; Active Directory dan Microsoft Entra ID (reset kata sandi, grup, MFA); manajemen perangkat (Intune); dasar jaringan (IP, DHCP, DNS, Wi-Fi, kabel UTP); printer jaringan; dasar keamanan (phishing, malware, enkripsi disk); skrip sederhana PowerShell.

**Non-teknis:** mendengarkan dan bertanya dengan sabar ke pengguna yang panik, menulis tiket dan artikel knowledge base yang bisa dibaca orang lain, mengelola waktu antar-tiket, dan tahu kapan harus eskalasi.

**Alat yang umum:** ServiceNow, Jira Service Management, atau GLPI (tiket); Microsoft Entra ID dan Active Directory; Microsoft Intune; AnyDesk atau TeamViewer (remote); PowerShell; Wireshark untuk kasus yang lebih dalam; tester kabel LAN sederhana.

### 3.4 Sertifikasi per jenjang (terkini per 2025-2026)

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Sangat awal | CompTIA Tech+ (FC0-U71) | Diluncurkan 16 Juli 2024, maksimum 70 soal, 60 menit, skor lulus 650 dari 900 |
| Pemula | **CompTIA A+ (Core 1 220-1201 dan Core 2 220-1202)** | Versi V15 diluncurkan 25 Maret 2025. Versi lama 220-1101/1102 (bahasa Inggris) pensiun 25 September 2025. Tiap ujian maksimum 90 soal, 90 menit; skor lulus Core 1 675 dan Core 2 700 (skala 900). CompTIA merekomendasikan pengalaman sekitar 12 bulan di peran IT support |
| Pemula | Google IT Support Professional Certificate | 5 kursus di Coursera, 3-6 bulan belajar mandiri. Lulusan yang juga lulus CompTIA A+ mendapat kredensial gabungan CompTIA dan Google |
| Pemula | HDI Customer Service Representative atau HDI Support Center Analyst | Sertifikasi berbasis peran dari HDI, fokus pada proses support center dan layanan pelanggan |
| Pemula | ITIL Foundation | PeopleCert kini menawarkan **ITIL Foundation (Version 5)** yang terbit 2026, sementara ITIL 4 Foundation masih tersedia. Menurut FAQ PeopleCert, rencana saat ini adalah semua modul ITIL 4 dihentikan pada 31 Desember 2027. Ujian Foundation: 40 soal pilihan ganda, 60 menit, lulus 65% |
| Menengah | Microsoft 365 Certified: Endpoint Administrator Associate (MD-102) | Fokus Intune, Autopilot, Entra ID. Perlu diperpanjang tiap 12 bulan (gratis lewat asesmen daring) |
| Menengah | HDI Desktop Advanced Support Technician, CompTIA Network+ (N10-009) | Network+ adalah jembatan paling jelas menuju network administrator |

**Jalur Indonesia:** Kemnaker menetapkan **SKKNI Bidang Computer Technical Support** lewat Kepmenaker Nomor 285 Tahun 2016 (8 November 2016, berstatus berlaku). SKKNI ini menjadi acuan skema sertifikasi di Lembaga Sertifikasi Profesi (LSP) yang berlisensi BNSP. Sebelum mendaftar, cek LSP dan jadwal uji kompetensinya di situs BNSP, dan pastikan skemanya memang mengacu ke SKKNI yang sesuai dengan pekerjaan Anda.

> [!TIP]
> Kalau anggaran terbatas, urutan yang masuk akal adalah: Google IT Support (atau materi gratis setara) untuk fondasi, lalu CompTIA A+ bila perusahaan target memang mensyaratkannya, lalu langsung ke Network+ atau CCNA. Jangan mengoleksi sertifikat level pemula terlalu banyak.

### 3.5 Jalur masuk dan progresi

**Masuk:** lulusan SMK TKJ/RPL, D3 atau S1 informatika, atau peralih karier yang sudah belajar mandiri. Pintu yang sering terbuka: staf IT di sekolah atau kampus, IT support di perusahaan outsourcing (penempatan di bank atau pabrik), helpdesk di penyedia layanan TI terkelola (managed service provider), dan IT support di startup.

**Progresi yang wajar:**

```
IT Support / Helpdesk (tier 1)
   -> Desktop/Field Support (tier 2)
      -> Network Administrator  atau  System Administrator
         -> Network Engineer / Systems Engineer
   (cabang lain: NOC Technician, Cybersecurity Analyst, IT Asset Manager)
```

**Transisi ke network administrator** paling mulus bila di tempat kerja Anda mulai "meminjam" tugas tier 2: membuat reservasi DHCP, memindahkan port ke VLAN yang benar, membaca log firewall, membantu backup konfigurasi switch. Minta akses baca (read-only) ke perangkat jaringan dan dokumentasikan setiap kali Anda membantu.

### 3.6 Konteks pasar kerja Indonesia

IT support direkrut oleh hampir semua jenis organisasi: bank (sering lewat vendor outsourcing), BUMN, rumah sakit, pabrik di kawasan industri (Cikarang, Karawang, Batam), sekolah dan kampus, kantor pemerintah, startup, dan system integrator yang menempatkan staf di klien. Jobstreet Indonesia (artikel kisaran gaji IT support, diperbarui Agustus 2026) menyebut lulusan baru umumnya mendapat sekitar Rp3-5 juta per bulan, pengalaman lebih dari lima tahun sekitar Rp8-12 juta, dan posisi level masuk di Jakarta bisa lebih dari Rp6 juta. Data ini dihimpun dari iklan lowongan, jadi gunakan sebagai gambaran kasar, bukan patokan pasti.

### 3.7 Belajar dari kurikulum ini

Kuasai modul berikut, kira-kira dalam urutan ini:

- `00-fondasi/01-apa-itu-jaringan` dan `01-model-referensi/01-osi` (bahasa bersama dengan tim jaringan)
- `02-layer-fisik/02-kabel-copper` (kabel, pinout, PoE)
- `04-network-layer/01-ipv4` dan `04-network-layer/02-subnetting`
- `06-aplikasi/01-dns` dan `06-aplikasi/02-dhcp` (dua penyebab tiket paling sering)
- `10-wireless/02-802-11`
- `12-keamanan/04-aaa-identitas`
- `14-monitoring-troubleshooting/01-metodologi` dan `14-monitoring-troubleshooting/02-tools`

### 3.8 Proyek portofolio dan pertanyaan wawancara

**Proyek portofolio:**
1. Bangun helpdesk mini dengan GLPI atau osTicket di VM: kategori tiket, matriks prioritas, SLA, dan 10 artikel knowledge base yang Anda tulis sendiri dari kasus nyata atau lab.
2. Lab domain kecil: Windows Server (versi evaluasi) dengan AD, DHCP, DNS, GPO pemetaan printer, plus satu klien. Dokumentasikan skenario "pengguna tidak bisa login" dengan tiga penyebab berbeda.
3. Skrip PowerShell yang mengumpulkan inventaris laptop (nomor seri, RAM, disk, versi OS) ke CSV. Proyek ini sekaligus menyentuh dunia ITAM.

**Pertanyaan wawancara khas:**
1. "Pengguna bilang internetnya mati. Apa langkah Anda?" (Mereka menilai urutan: satu orang atau banyak, kabel atau Wi-Fi, IP dan gateway, DNS, baru aplikasi.)
2. "Bagaimana Anda menangani pengguna senior yang marah dan menuntut didahulukan?" (Mereka menilai empati plus kepatuhan pada prioritas.)
3. "Apa beda insiden dan problem dalam ITIL?"

---

## 4. Field Network Technician (Teknisi Jaringan Lapangan dan FTTH)

### 4.1 Apa yang sebenarnya dikerjakan

Teknisi lapangan adalah orang yang membuat jaringan **benar-benar ada secara fisik**. Ada dua varian besar: teknisi **FTTH/akses** di operator atau ISP (pasang baru, perbaikan gangguan pelanggan, pemeliharaan ODP), dan teknisi **jaringan gedung** di system integrator (structured cabling, rak, patch panel, access point, CCTV IP).

Contoh satu hari teknisi FTTH mitra ISP di Bandung:

```
07.30  Briefing tim, cek K3: helm, sepatu safety, full body harness,
       tangga dalam kondisi baik. Ambil material (drop cable, ONT,
       konektor SC/APC, klem).
08.30  Work order pasang baru. Cek ODP terdekat: masih ada port kosong?
       Ukur daya optik di port ODP dengan optical power meter.
09.30  Tarik drop cable dari tiang ke rumah, rapikan, pasang roset.
       Pasang konektor (fast connector atau splice-on), ukur ulang daya
       di sisi pelanggan. Aktivasi ONT bersama tim NOC/provisioning.
       Tes kecepatan, foto bukti, minta tanda tangan pelanggan.
11.30  Tiket gangguan: 6 pelanggan di satu gang mati bersamaan.
       Polanya mengarah ke satu ODP atau kabel distribusi.
       Cek di lapangan: kabel distribusi tergores dan putus tersangkut
       truk. Lapor ke koordinator, minta tim splicing.
13.00  Tim splicing datang dengan fusion splicer dan OTDR. OTDR dari
       ODC menunjukkan event "end of fiber" di jarak yang cocok dengan
       titik putus. Sambung ulang, uji lagi: redaman sambungan wajar.
15.30  Perbaikan pelanggan bisnis: ONT menyala, tapi LOS merah. Konektor
       kotor. Bersihkan dengan pembersih konektor, cek dengan inspection
       scope, daya kembali normal.
17.00  Update semua work order di aplikasi lapangan, unggah foto,
       catat material terpakai (penting untuk audit aset!).
```

Untuk teknisi jaringan gedung, isi harinya lain: menarik kabel Cat6/Cat6A di plafon, terminasi di patch panel dan keystone, labeling, uji dengan cable certifier, merapikan rak, lalu menyerahkan hasil uji sebagai dokumen serah terima.

### 4.2 Tanggung jawab dan ukuran keberhasilan

- **Waktu pasang dan waktu perbaikan** sesuai SLA operator (biasanya dihitung dari tiket dibuka sampai layanan pulih).
- **Kualitas hasil:** daya optik pelanggan dalam rentang kerja ONT, redaman sambungan dan konektor sesuai batas desain, hasil uji kabel tembaga lolos kategori.
- **Gangguan ulang (repeat trouble):** pelanggan yang sama mengeluh lagi dalam beberapa hari menandakan pekerjaan pertama tidak tuntas.
- **Kepatuhan K3 dan dokumentasi:** foto, label, as-built drawing, pemakaian material.

**Angka acuan yang perlu Anda kenal:**

| Item | Nilai | Sumber |
|---|---|---|
| Rugi sambungan (splice) maksimum | 0,3 dB | TIA-568 (dikutip FOA) |
| Rugi pasangan konektor maksimum | 0,75 dB | TIA-568 (dikutip FOA) |
| Redaman fiber singlemode | 0,4 dB/km di 1310 nm dan 0,3 dB/km di 1550 nm (OSP); premises boleh lebih tinggi | TIA-568 (dikutip FOA) |
| Anggaran optik GPON kelas B+ | 28 dB | ITU-T G.984.2 |

Contoh hitung cepat: jalur GPON 5 km (1310 nm) dengan splitter 1:32, 4 sambungan, dan 4 pasang konektor. Fiber 5 x 0,4 = 2,0 dB; sambungan 4 x 0,3 = 1,2 dB; konektor 4 x 0,75 = 3,0 dB; splitter 1:32 kira-kira 17 dB (cek datasheet splitter Anda). Total sekitar 23 dB, masih di bawah 28 dB dengan margin sekitar 5 dB. Kalau teknisi menemukan pelanggan dengan rugi jauh di atas perkiraan ini, ada sambungan, tekukan, atau konektor yang bermasalah.

> [!WARNING]
> Nilai TIA di atas adalah **batas maksimum standar**, bukan target kerja. Banyak operator menetapkan target internal yang lebih ketat. Selalu ikuti spesifikasi teknis proyek atau operator tempat Anda bekerja.

**Standar kabel tembaga:** keluarga **ANSI/TIA-568** (revisi E). Bagian 568.2 mengatur kabel twisted-pair; revisi **568.2-E** dirilis TIA pada November 2024. Pola T568A dan T568B sama-sama sah; yang menentukan kualitas adalah konsistensi dalam satu instalasi dan hasil uji yang lolos. Detail pinout ada di `02-layer-fisik/02-kabel-copper`.

### 4.3 K3: keselamatan kerja di ketinggian dan listrik

Pekerjaan teknisi lapangan mengandung risiko yang **bisa membunuh**: jatuh dari tiang atau tangga, tersengat listrik dari kabel PLN di tiang yang sama, dan cedera mata karena sinar laser atau serpihan fiber.

- **Permenaker Nomor 9 Tahun 2016** tentang K3 dalam Pekerjaan pada Ketinggian mengatur perencanaan, prosedur kerja, alat pelindung diri, perangkat pelindung jatuh dan angkur, serta kompetensi tenaga kerja. Kategori tenaga kerja di Pasal 35: tenaga kerja bangunan tinggi tingkat 1 dan 2, serta tenaga kerja pada ketinggian tingkat 1, 2, dan 3. Tenaga kerja yang berwenang dibuktikan dengan **Lisensi K3** yang diterbitkan Direktur Jenderal dan berlaku 5 tahun (Pasal 33).
- **Permenaker Nomor 12 Tahun 2015** tentang K3 Listrik di Tempat Kerja (diubah dengan Permenaker 33/2015) relevan karena teknisi sering bekerja dekat instalasi listrik, panel, dan catu daya perangkat.
- **Keselamatan fiber:** jangan pernah menatap ujung konektor atau port yang mungkin aktif; gunakan power meter atau inspection scope. Serpihan fiber hasil cleaving dibuang ke wadah khusus, bukan ke lantai.

> [!WARNING]
> Jangan pernah naik tiang tanpa harness yang terkait ke angkur, dan jangan bekerja di tiang saat hujan petir. Tidak ada SLA yang sepadan dengan nyawa Anda. Perusahaan yang baik akan mendukung keputusan Anda menunda pekerjaan karena kondisi tidak aman.

### 4.4 Keahlian teknis, non-teknis, dan alat

**Teknis:** terminasi tembaga (RJ45, keystone, punch-down), structured cabling sesuai TIA-568, fiber (cleaving, fusion splicing, pemasangan konektor, manajemen tray), pengukuran (OPM, light source, VFL, OTDR), arsitektur GPON (OLT, ODC, ODP, splitter, ONT), konfigurasi dasar ONT dan router pelanggan (sering MikroTik di ISP lokal), dasar VLAN dan PPPoE, dasar Wi-Fi rumahan.

**Non-teknis:** disiplin K3, komunikasi dengan pelanggan di rumahnya sendiri (sopan, menjelaskan tanpa jargon), kerja tim di lapangan, dokumentasi foto dan as-built, kejujuran dalam pencatatan material.

**Alat:** fusion splicer, cleaver, OTDR, optical power meter dan light source, visual fault locator, fiber inspection scope, cable tester dan cable certifier untuk tembaga, crimping tool dan punch-down tool, Winbox untuk MikroTik, aplikasi work order milik operator.

### 4.5 Sertifikasi per jenjang dan jalur Indonesia

| Jenjang | Sertifikasi | Penerbit dan catatan |
|---|---|---|
| Pemula | Sertifikat kompetensi skema instalasi fiber optik | BNSP lewat LSP berlisensi, mengacu **SKKNI Instalasi Fiber Optik (Kepmenaker 101/2018, 25 Mei 2018)**. Unitnya mencakup antara lain perencanaan instalasi FTTH berdasarkan gambar, pemasangan kabel udara/tanam/duct, pengoperasian power meter, pemasangan konektor, dan penyambungan fusion |
| Pemula | Lisensi K3 bekerja pada ketinggian | Kemnaker, sesuai Permenaker 9/2016; tingkat menyesuaikan tugas |
| Pemula | Skema Teknisi Muda Jaringan Komputer | LSP berlisensi BNSP, mengacu **SKKNI Jaringan Komputer (Kepmenaker 321/2016)** |
| Pemula | FOA CFOT (Certified Fiber Optic Technician) | The Fiber Optic Association. Tanpa prasyarat formal, ujian 100 soal, lulus 70%. Program pelatihan wajib berisi praktik splicing, terminasi, dan pengujian |
| Pemula | BICSI Installer 1 (INST1) | Untuk yang baru mulai structured cabling; sertifikat tidak diperpanjang |
| Menengah | FOA CFOS/S (splicing), CFOS/T (testing), CFOS/H (FTTx), CFOS/O (outside plant) | Prasyarat CFOT. CFOS/O mensyaratkan pengalaman lapangan terdokumentasi |
| Menengah | BICSI Installer 2 Copper (INSTC) atau Installer 2 Optical Fiber (INSTF) | Fokus instalasi, terminasi, dan pengujian |
| Menengah | MikroTik MTCNA; CompTIA Network+ (N10-009) | Jembatan ke administrasi jaringan, lihat `18-karier-sertifikasi/05-peta-mikrotik` |
| Senior | BICSI Technician (TECH) | Diperpanjang tiap 3 tahun dengan minimal 18 jam CEC |

> [!TIP]
> Di Indonesia, sertifikat BNSP dan lisensi K3 sering lebih berpengaruh di tender proyek dan syarat mitra operator daripada sertifikat internasional. Sertifikat FOA atau BICSI menambah nilai bila Anda menyasar system integrator besar, data center, atau proyek dengan klien multinasional.

### 4.6 Jalur masuk dan progresi

**Masuk:** lulusan SMK (TKJ, Teknik Elektronika, Teknik Listrik) atau D3 Teknik Telekomunikasi paling sering masuk lewat perusahaan mitra operator, ISP regional, atau kontraktor jaringan. Banyak yang mulai sebagai helper (membantu teknisi senior) lalu dipercaya memegang splicer.

**Progresi:**

```
Helper / Teknisi pasang baru
   -> Teknisi gangguan / teknisi splicing & OTDR
      -> Team leader lapangan / waspang (pengawas lapangan)
         -> Telecom Engineer (perencanaan jaringan akses, desain FTTH)
   cabang: NOC Technician, Network Administrator ISP, Data Center Engineer
```

**Transisi ke network administrator:** teknisi FTTH sudah memegang separuh cerita, yaitu jalur fisik sampai ONT. Separuh lainnya ada di sisi logis: VLAN layanan, PPPoE, DHCP, routing ke upstream. Minta kesempatan duduk bersama tim NOC atau provisioning, pelajari kenapa ONT pelanggan diberi VLAN tertentu, dan bangun lab MikroTik di rumah. Banyak ISP lokal merekrut admin jaringan dari teknisi lapangannya sendiri karena mereka sudah paham topologi dan pelanggan.

### 4.7 Konteks pasar kerja Indonesia

Perekrut utama: operator dan grup operator (sejak 1 Juli 2023 IndiHome diintegrasikan ke Telkomsel dalam inisiatif fixed mobile convergence), anak usaha infrastruktur seperti Telkom Akses (berdiri 12 Desember 2012, fokus perencanaan, konstruksi, dan pemeliharaan jaringan akses fiber), ISP nasional dan regional, perusahaan penyedia jaringan fiber, kontraktor mitra operator, system integrator (structured cabling gedung dan data center), dan program pemerintah daerah. Data Jobstreet Indonesia (Oktober 2026) untuk peran "Teknisi Jaringan" menunjukkan rata-rata nasional sekitar Rp2,85-3,9 juta per bulan dari iklan lowongan, dengan rata-rata tertinggi di beberapa wilayah Jakarta sekitar Rp5,7 juta. Banyak posisi lapangan juga memberi uang lembur atau insentif per work order, yang tidak selalu tercermin di angka iklan.

> [!WARNING]
> Status kerja di lapangan beragam: karyawan tetap, kontrak, atau mitra dengan bayaran per pekerjaan. Tanyakan dengan jelas soal BPJS Ketenagakerjaan, asuransi kecelakaan kerja, dan siapa yang menyediakan APD sebelum menandatangani kontrak.

### 4.8 Belajar dari kurikulum ini

- `02-layer-fisik/01-media-transmisi`
- `02-layer-fisik/02-kabel-copper`
- `02-layer-fisik/03-fiber` (wajib dikuasai sampai bisa menghitung budget)
- `03-data-link/01-ethernet-frame-mac` dan `03-data-link/03-vlan`
- `10-wireless/01-rf-dasar` (untuk Wi-Fi pelanggan dan radio point-to-point)
- `11-wan-vpn/01-teknologi-wan` (posisi FTTH dan PON di peta WAN)
- `19-mikrotik/01-pengenalan-routeros`
- `14-monitoring-troubleshooting/01-metodologi`

### 4.9 Proyek portofolio dan pertanyaan wawancara

**Proyek portofolio:**
1. Dokumentasi structured cabling satu lantai (bisa rumah kos atau kantor kecil): denah, penomoran port dan label, foto rak sebelum dan sesudah, serta hasil uji kabel.
2. Lembar kerja perhitungan loss budget FTTH untuk satu klaster fiktif 64 pelanggan (OLT, ODC, ODP, splitter 1:8 dua tingkat), lengkap dengan asumsi dan margin.
3. Lab MikroTik: PPPoE server, VLAN per layanan, dan simulasi pelanggan, dihubungkan dengan pengalaman lapangan Anda.

**Pertanyaan wawancara khas:**
1. "ONT pelanggan LOS merah. Apa yang Anda cek, urut dari yang paling mungkin?"
2. "Hasil OTDR menunjukkan event reflektif besar di 1,2 km. Apa artinya dan apa langkah Anda?"
3. "Apa yang Anda lakukan kalau koordinator meminta naik tiang padahal harness Anda rusak?"

---

## 5. Hardware Engineer (Perangkat Keras dan Elektronika)

### 5.1 Apa yang sebenarnya dikerjakan

Istilah "hardware engineer" di Indonesia dipakai untuk dua pekerjaan yang cukup berbeda:

1. **Hardware design engineer:** merancang rangkaian dan PCB untuk perangkat (router, modul IoT, perangkat telekomunikasi, sistem kontrol), membuat prototipe, menguji, dan mendampingi produksi. Ini sejalan dengan definisi O*NET untuk Computer Hardware Engineers: merancang, mengembangkan, dan menguji perangkat, membuat dan menguji prototipe, serta menulis spesifikasi.
2. **Hardware/field service engineer:** mendiagnosis dan memperbaiki perangkat (server, switch, UPS, perangkat medis, mesin ATM), mengganti komponen, mengurus RMA ke vendor, dan memastikan perangkat kembali sesuai spesifikasi.

Contoh satu hari design engineer di perusahaan perangkat IoT di Bandung:

```
08.30  Stand-up dengan tim firmware: board revisi B sering reset
       saat modem 4G mengirim data.
09.00  Ukur dengan osiloskop: tegangan 3,3 V turun sesaat (brownout)
       ketika modul seluler menarik arus puncak. Dugaan: kapasitor
       bulk kurang dan jalur daya di PCB terlalu tipis.
11.00  Simulasi ringan di LTspice, revisi skematik di KiCad,
       tambah kapasitor dan lebarkan jalur.
13.30  Review desain dengan tim produksi (EMS): apakah komponen
       pengganti tersedia di pasar lokal? Bagaimana dampaknya pada
       TKDN dan biaya BOM?
15.00  Uji termal prototipe di dalam enclosure, catat suhu tiap komponen.
16.30  Tulis laporan uji dan perbarui dokumen spesifikasi di Git.
```

Hubungannya dengan jaringan: perangkat yang dirancang hampir selalu punya antarmuka Ethernet, Wi-Fi, atau seluler. Engineer yang paham PoE, sinyal diferensial, impedansi jalur, dan RF jauh lebih efektif.

### 5.2 Tanggung jawab dan ukuran keberhasilan

- **Desain:** prototipe lolos uji fungsi, uji termal, dan uji EMC; jumlah revisi board sampai siap produksi; biaya BOM sesuai target.
- **Produksi:** yield (persentase unit lolos uji di lini produksi), tingkat cacat solder, tingkat retur di lapangan.
- **Servis:** waktu perbaikan, tingkat "fixed first time", akurasi diagnosis sebelum klaim RMA.
- **Kepatuhan:** sertifikasi perangkat (di Indonesia, perangkat telekomunikasi harus bersertifikat sebelum diedarkan) dan pemenuhan TKDN untuk kategori tertentu. Misalnya, Permenkominfo 13/2021 menetapkan TKDN 35% untuk perangkat subscriber station 4G dan 5G. Aturan semacam ini bisa diperbarui, jadi selalu cek regulasi terbaru dari Komdigi dan Kemenperin.

### 5.3 Keahlian teknis, non-teknis, dan alat

**Teknis:** analisis rangkaian analog dan digital, catu daya (regulator, switching), desain PCB (aturan jalur, ground plane, impedansi), mikrokontroler dan antarmuka (UART, SPI, I2C, Ethernet PHY), dasar RF dan antena, penyolderan termasuk SMD dan rework, pembacaan datasheet, pemrograman C dan Python untuk otomasi pengujian.

**Non-teknis:** dokumentasi desain dan laporan uji yang rapi, kerja sama dengan tim firmware, produksi, dan pengadaan; ketelitian; kemampuan menjelaskan trade-off biaya versus keandalan kepada manajer produk.

**Alat:** KiCad atau Altium Designer, LTspice, osiloskop, multimeter, logic analyzer, catu daya laboratorium, solder station dan hot air rework, debugger JTAG/SWD, Git.

### 5.4 Sertifikasi per jenjang

Profesi ini lebih banyak dinilai dari ijazah (umumnya S1 atau D3 Teknik Elektro/Elektronika) dan portofolio desain daripada sertifikasi. Yang relevan:

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | IPC J-STD-001 CIS (Certified IPC Application Specialist) | Standar persyaratan sambungan solder. IPC berganti nama menjadi **Global Electronics Association** pada 2025, tetapi merek IPC tetap dipakai untuk standar dan sertifikasinya |
| Pemula | IPC-A-610 CIS | Kriteria penerimaan rakitan elektronik; berguna untuk QA produksi dan servis |
| Menengah | IPC CID (Certified Interconnect Designer) | Desain PCB tingkat dasar |
| Senior | IPC CID+ | Desain PCB tingkat lanjut |
| Pemula (jalur servis) | CompTIA A+ (220-1201/1202) | Relevan untuk hardware service di lingkungan TI |

**Jalur Indonesia:** saya belum menemukan skema BNSP yang langsung setara dengan "hardware design engineer". Untuk pekerjaan yang menyentuh instalasi listrik, pahami Permenaker 12/2015 tentang K3 Listrik. Jika Anda berasal dari jalur akademik, cek apakah LSP kampus Anda punya skema bidang elektronika.

### 5.5 Jalur masuk dan progresi

**Masuk:** fresh graduate Teknik Elektro sebagai junior hardware engineer, teknisi elektronika di pusat servis atau pabrik EMS, atau asisten laboratorium. Lulusan SMK Elektronika biasanya masuk sebagai teknisi produksi atau servis.

**Progresi:** junior hardware engineer, lalu hardware engineer, lalu senior/lead hardware engineer atau system engineer. Cabang ke solution architect (perangkat dan integrasi) atau ke data center engineer (sisi fasilitas dan perangkat keras skala besar).

**Transisi ke dan dari network engineer:** arah yang paling sering adalah dari hardware ke jaringan, misalnya hardware service engineer di vendor jaringan yang kemudian ikut mengonfigurasi perangkat yang ia perbaiki. Arah sebaliknya (network engineer menjadi hardware designer) jarang terjadi tanpa pendidikan elektronika formal. Network engineer yang paham hardware tetap punya keunggulan saat membaca datasheet transceiver, menganalisis masalah PoE, atau memilih perangkat untuk lingkungan panas dan lembap.

### 5.6 Konteks pasar kerja Indonesia

Perekrut meliputi BUMN elektronika dan pertahanan seperti PT Len Industri (berawal dari Lembaga Elektronika Nasional, menjadi BUMN pada 1991) dan PT INTI (berdiri 1974, sejarahnya di perangkat telekomunikasi), perusahaan EMS (Electronics Manufacturing Services) seperti PT Sat Nusapersada di Batam yang merakit dan menguji produk elektronik termasuk ponsel, produsen perangkat yang mengejar TKDN, startup IoT, vendor dan distributor perangkat jaringan (bagian RMA dan servis), serta pusat servis resmi. Untuk gaji, saya tidak menemukan data publik yang andal khusus "hardware engineer". Sebagai pembanding terdekat, Jobstreet Indonesia (Oktober 2026) mencatat rata-rata iklan untuk "Teknisi Elektronika" sekitar Rp4,75-6,35 juta per bulan; angka ini untuk teknisi, bukan design engineer.

### 5.7 Belajar dari kurikulum ini

- `00-fondasi/02-bit-byte-biner`
- `00-fondasi/03-sinyal-bandwidth-latency`
- `02-layer-fisik/01-media-transmisi`
- `02-layer-fisik/04-encoding-modulasi`
- `02-layer-fisik/02-kabel-copper` (terutama PoE)
- `03-data-link/01-ethernet-frame-mac`
- `10-wireless/01-rf-dasar`
- `15-otomasi/03-python-jaringan` (otomasi uji)
- `16-datacenter-cloud-sdn/01-desain-dc` (bila menyasar hardware data center)

### 5.8 Proyek portofolio dan pertanyaan wawancara

**Proyek portofolio:**
1. Desain PCB sederhana di KiCad: sensor suhu dengan mikrokontroler dan modul Ethernet atau Wi-Fi, lengkap dengan skematik, layout, BOM, dan foto board hasil cetak.
2. Laporan perbaikan perangkat: diagnosis switch atau router bekas yang mati (catu daya, kapasitor, flash), dengan foto, pengukuran, dan penjelasan akar masalah.
3. Rig uji otomatis dengan Python: menyalakan perangkat, membaca serial console, dan mencatat hasil uji ke CSV.

**Pertanyaan wawancara khas:**
1. "Board Anda reset saat modul radio mengirim data. Bagaimana Anda mencari penyebabnya?"
2. "Kapan Anda memilih regulator linear dan kapan switching?"
3. "Apa yang Anda periksa saat menerima laporan perangkat PoE yang tidak menyala di sebagian port switch?"

---

## 6. IT Asset Manager (ITAM, SAM, HAM)

### 6.1 Apa yang sebenarnya dikerjakan

IT asset management (ITAM) mengelola aset TI sepanjang siklus hidupnya agar nilainya optimal, risikonya terkendali, dan biayanya terlihat. Cabangnya: **HAM** (hardware asset management), **SAM** (software asset management, termasuk lisensi dan langganan cloud/SaaS), dan pemusnahan aset (IT asset disposition).

Siklus hidup yang Anda kelola:

```
Rencana -> Pengadaan -> Penerimaan & pencatatan -> Deploy/serah terima
   -> Pemakaian & pemeliharaan (garansi, kontrak support, pindah tangan)
      -> Refresh/penggantian -> Penarikan -> Sanitasi data -> Disposal/daur ulang
```

Contoh satu minggu IT asset manager di sebuah bank dengan 300 kantor cabang:

```
Senin   Rekonsiliasi: data CMDB vs hasil discovery (agen endpoint,
        SNMP/LLDP di jaringan). Ada 37 laptop "hilang" dari discovery
        lebih dari 60 hari. Kirim daftar ke koordinator cabang.
Selasa  Rapat dengan procurement: kontrak support 120 switch cabang
        habis 3 bulan lagi. Mana yang diperpanjang, mana yang sudah
        end-of-support dan sebaiknya diganti?
Rabu    Persiapan audit lisensi vendor perangkat lunak: cocokkan
        jumlah instalasi dengan hak lisensi (entitlement). Temukan
        kelebihan instalasi di satu divisi, ajukan remediasi.
Kamis   Penarikan 200 PC lama: pastikan data disanitasi sesuai prosedur
        (mengacu NIST SP 800-88), sertifikat pemusnahan dari vendor
        disposal, aset dihapus dari buku.
Jumat   Laporan bulanan: nilai aset, utilisasi lisensi, penghematan,
        temuan risiko (perangkat end-of-life yang masih di produksi).
```

### 6.2 Tanggung jawab dan ukuran keberhasilan

- **Akurasi inventaris:** persentase aset yang datanya cocok antara catatan dan kondisi fisik saat stock opname.
- **Kepatuhan lisensi:** tidak ada temuan kekurangan lisensi saat audit vendor; tidak ada pemborosan lisensi tak terpakai.
- **Penghematan biaya:** lisensi yang direklamasi, kontrak support yang dirasionalisasi, aset yang dipakai ulang.
- **Risiko:** jumlah perangkat end-of-support yang masih beroperasi, aset tanpa pemilik, dan pemusnahan yang terdokumentasi.
- **Kecepatan:** waktu dari permintaan perangkat sampai diserahkan ke pengguna.

### 6.3 Standar dan regulasi yang perlu dikenal

- **ISO/IEC 19770-1:2017** menetapkan persyaratan sistem manajemen ITAM (IT asset management system/ITAMS) dan bisa diterapkan pada semua jenis aset TI dan organisasi. Edisi 2017 ini adalah edisi ketiga dan masih berlaku. Bagian lain keluarga 19770 antara lain 19770-2 (software identification tag) dan 19770-3 (skema entitlement).
- **ISO/IEC 27001:2022** Annex A: kontrol 5.9 (inventaris informasi dan aset terkait) dan 7.14 (pemusnahan atau penggunaan ulang perangkat secara aman). Auditor keamanan akan menanyakan keduanya.
- **NIST SP 800-88 Rev. 2** (September 2025): pedoman sanitasi media yang menggantikan Rev. 1 tahun 2014.
- **Konteks Indonesia:** UU Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi membuat pemusnahan data di perangkat bekas menjadi isu hukum, bukan sekadar teknis. Untuk perbankan, POJK 11/POJK.03/2022 tentang Penyelenggaraan Teknologi Informasi oleh Bank Umum mengatur tata kelola TI, manajemen risiko, dan penggunaan penyedia jasa TI, yang semuanya membutuhkan data aset yang akurat.

### 6.4 Keahlian teknis, non-teknis, dan alat

**Teknis:** memahami model lisensi (per perangkat, per pengguna, per core, langganan), CMDB dan discovery, dasar jaringan untuk discovery (SNMP, LLDP/CDP, DHCP lease), Excel tingkat lanjut atau SQL, dasar skrip untuk rekonsiliasi data, pemahaman siklus hidup vendor (end-of-sale, end-of-support).

**Non-teknis:** negosiasi dengan vendor, koordinasi dengan procurement, keuangan, dan audit; ketelitian administrasi; kemampuan menyajikan data biaya dan risiko ke manajemen.

**Alat:** ServiceNow (modul HAM/SAM), Snipe-IT atau GLPI (open source), Lansweeper, Flexera One, Microsoft Intune, NetBox untuk aset jaringan dan rak, Power BI atau Excel, pemindai barcode/RFID.

### 6.5 Sertifikasi per jenjang

Sertifikasi ITAM yang paling dikenal berasal dari **IAITAM**, diselenggarakan antara lain melalui APMG International. Menurut APMG, ujiannya berformat pilihan ganda 100 soal, 3 jam, dengan nilai lulus 85%.

| Jenjang | Sertifikasi | Fokus |
|---|---|---|
| Pemula | ITIL Foundation (Version 5) atau ITIL 4 Foundation | Bahasa bersama ITSM, termasuk praktik IT asset management dan konfigurasi |
| Pemula | IAITAM CAMP (Certified Asset Management Professional) | Gambaran umum praktik ITAM |
| Menengah | IAITAM CHAMP (Certified Hardware Asset Management Professional) | Siklus hidup hardware |
| Menengah | IAITAM CSAM (Certified Software Asset Manager) | Lisensi, kepatuhan, kontrol biaya software |
| Menengah | IAITAM CITAD (Certified IT Asset Disposal) | Pemusnahan aset dan data |
| Senior | IAITAM CITAM (Certified IT Asset Manager) | Program ITAM strategis yang selaras dengan tujuan bisnis |

**Jalur Indonesia:** saya tidak menemukan SKKNI khusus ITAM. Di praktik, fungsi ini sering berada di bawah IT service management, IT governance, atau bagian umum (general affairs) yang bekerja sama dengan TI.

### 6.6 Jalur masuk dan progresi

**Masuk:** jarang ada lowongan "IT asset manager" untuk lulusan baru. Jalur yang realistis adalah dari IT support (yang sudah terbiasa serah terima laptop dan mencatat nomor seri), dari procurement TI, atau dari staf administrasi aset yang belajar teknis. Posisi awalnya biasanya "IT asset administrator" atau "IT asset analyst".

**Progresi:** IT asset analyst, lalu IT asset manager, lalu ITSM/IT operations manager, atau beralih ke IT auditor dan konsultan ITAM/lisensi.

**Hubungan dengan network engineer:** network engineer adalah pengguna utama data aset (perangkat apa, di rak mana, kontrak support sampai kapan, firmware versi berapa). Seorang network administrator yang rapi dokumentasinya (`17-desain-arsitektur/03-perencanaan-dokumentasi`) punya bekal besar untuk peran ITAM, dan sebaliknya IT asset manager yang paham jaringan bisa membangun discovery yang jauh lebih akurat.

### 6.7 Konteks pasar kerja Indonesia

Kebutuhan terbesar ada di organisasi dengan aset banyak dan regulasi ketat: bank dan lembaga keuangan, BUMN, operator telekomunikasi, perusahaan multinasional, pemerintahan, serta penyedia managed service dan leasing perangkat. Saya tidak menemukan data gaji publik yang dapat diverifikasi khusus untuk ITAM di Indonesia, sehingga modul ini tidak mencantumkan angka.

### 6.8 Belajar dari kurikulum ini

- `03-data-link/06-discovery-dan-l2-lain` (LLDP/CDP untuk discovery)
- `06-aplikasi/05-layanan-lain` (SNMP dan syslog)
- `12-keamanan/01-konsep-keamanan`
- `14-monitoring-troubleshooting/03-observability`
- `15-otomasi/02-data-dan-api`
- `15-otomasi/03-python-jaringan`
- `17-desain-arsitektur/03-perencanaan-dokumentasi`

### 6.9 Proyek portofolio dan pertanyaan wawancara

**Proyek portofolio:**
1. Pasang Snipe-IT atau GLPI, isi dengan 50 aset fiktif yang realistis (laptop, switch, lisensi), lengkap dengan alur check-out/check-in dan laporan aset yang garansinya habis dalam 90 hari.
2. Skrip Python yang menarik data LLDP/SNMP dari lab jaringan (lihat `lab/05-lab-linux-otomasi`) lalu membandingkannya dengan inventaris di NetBox, dan menandai selisihnya.
3. Dokumen prosedur pemusnahan aset satu halaman yang mengacu ke ISO/IEC 27001 A.7.14 dan NIST SP 800-88 Rev. 2, termasuk format berita acara.

**Pertanyaan wawancara khas:**
1. "Vendor perangkat lunak mengumumkan audit lisensi dalam 30 hari. Apa langkah Anda?"
2. "Data CMDB dan hasil discovery berbeda 15%. Bagaimana Anda menentukan mana yang benar?"
3. "Bagaimana Anda membuktikan bahwa 200 laptop yang dilelang sudah bersih dari data nasabah?"

---

## 7. Jalur Nyata: dari Helpdesk atau Teknisi ke Network Administrator

Bagian ini adalah rencana contoh, disusun dari pola umum yang terlihat pada jalur sertifikasi (A+ ke Network+ atau CCNA) dan kompetensi di SKKNI Jaringan Komputer. Sesuaikan dengan kondisi Anda.

**Langkah 1: Kuasai pekerjaan Anda sekarang, tapi dengan "kacamata jaringan" (bulan 0-6).**
Setiap tiket yang menyentuh jaringan, catat di jurnal pribadi: gejala, layer berapa, penyebab, perintah yang dipakai. Setelah enam bulan Anda punya puluhan studi kasus nyata. Pelajari `14-monitoring-troubleshooting/01-metodologi` dan terapkan.

**Langkah 2: Bangun fondasi yang terukur (bulan 3-12).**
Selesaikan tahap 00 sampai 06 kurikulum ini dan lab `lab/01-lab-fondasi-switching` sampai `lab/03-lab-ip-services`. Ambil satu sertifikasi jaringan: CompTIA Network+ (N10-009), CCNA 200-301 v1.1, atau MTCNA bila lingkungan Anda banyak MikroTik.

**Langkah 3: Minta tanggung jawab kecil di jaringan (bulan 6-18).**
Contoh yang realistis untuk diusulkan ke atasan:
- Memegang backup konfigurasi switch dan router (lihat `15-otomasi/03-python-jaringan`).
- Merapikan dokumentasi: IP plan, label port, diagram fisik.
- Menjadi orang pertama yang menangani tiket jaringan tier 2 di bawah supervisi network admin.
- Untuk teknisi FTTH: membantu tim provisioning mengaktifkan layanan dan memahami VLAN serta PPPoE pelanggan.

**Langkah 4: Ubah bukti menjadi posisi (bulan 12-24).**
Perbarui CV dengan hasil, bukan daftar tugas: "Menurunkan tiket printer offline di gudang dengan mengusulkan reservasi DHCP", "Mendokumentasikan 48 switch cabang dan label port". Lamar posisi network administrator atau NOC, di dalam perusahaan dulu (sering lebih mudah karena Anda sudah dikenal), lalu di luar.

```
Contoh jalur yang sering terlihat di Indonesia:

Teknisi FTTH mitra (1-2 th) ---> NOC ISP (1-2 th) ---> Network Admin ISP
IT Support kantor (1-2 th) ---> Network/System Admin internal
Helpdesk outsourcing bank -----> Tier 2 network support -----> Network Admin
```

> [!WARNING]
> Jebakan yang sering terjadi: terlalu nyaman di tier 1 karena pekerjaannya sudah dikuasai. Jika setelah dua tahun Anda belum pernah menyentuh konfigurasi perangkat jaringan sama sekali, sudah waktunya bicara dengan atasan atau mencari lingkungan yang memberi ruang belajar.

> [!TIP]
> Network administrator yang dulu bekerja di helpdesk atau di lapangan biasanya punya dua keunggulan yang sulit diajarkan: mereka tahu rasanya menjadi pengguna yang terdampak, dan mereka tahu kabel di dunia nyata tidak serapi diagram.

---

## 8. Ringkasan

- Rumpun dukungan adalah **pintu masuk** paling umum ke karier jaringan karena syarat masuknya terjangkau dan pekerjaannya menyentuh semua layer.
- **IT support technician**: tiket, SLA, tier 1/2/3, ITIL. Sertifikasi kunci: CompTIA A+ 220-1201/1202 (sejak Maret 2025), Google IT Support, HDI, ITIL Foundation (Version 5 terbit 2026; ITIL 4 direncanakan berakhir 31 Desember 2027). SKKNI Computer Technical Support (Kepmenaker 285/2016).
- **Field network technician**: structured cabling TIA-568 (568.2-E, 2024), fiber splicing, OTDR, FTTH/GPON, dan K3 (Permenaker 9/2016 untuk ketinggian, Permenaker 12/2015 untuk listrik). Sertifikasi: BNSP (SKKNI 101/2018), FOA CFOT/CFOS, BICSI Installer.
- **Hardware engineer**: desain dan perbaikan perangkat elektronik; dinilai dari ijazah dan portofolio, dengan sertifikasi IPC (CIS, CID) sebagai pelengkap.
- **IT asset manager**: siklus hidup aset dan lisensi, ISO/IEC 19770-1:2017, ISO/IEC 27001:2022 A.5.9 dan A.7.14, NIST SP 800-88 Rev. 2; sertifikasi IAITAM.
- Jalur ke network administrator butuh tiga hal: fondasi yang terukur (kurikulum dan satu sertifikasi jaringan), tanggung jawab kecil yang nyata di jaringan, dan bukti terdokumentasi.

---

## 9. Latihan

1. Anda IT support tier 1. Pukul 08.05 masuk tiga tiket: (a) direktur keuangan tidak bisa membuka email di HP, (b) seluruh lantai 2 tidak bisa mengakses aplikasi ERP, (c) karyawan baru minta dipasangi aplikasi desain. Urutkan penanganannya dan jelaskan alasannya dengan konsep dampak dan urgensi.
2. Tim Anda punya FCR 85% dan waktu penyelesaian rata-rata sangat cepat, tetapi reopen rate naik dua kali lipat dalam tiga bulan. Apa kemungkinan penyebabnya dan apa yang Anda usulkan?
3. Hitung perkiraan rugi total jalur GPON berikut dengan nilai maksimum TIA-568: fiber singlemode 8 km di 1310 nm, splitter 1:16 (anggap 14 dB), 5 sambungan, dan 4 pasang konektor. Apakah masih di bawah anggaran kelas B+? Berapa marginnya?
4. Pelanggan FTTH melapor internet sering putus sore hari. Daya optik di ONT normal saat Anda datang pagi hari. Susun langkah diagnosis yang masuk akal.
5. Koordinator meminta Anda segera memperbaiki kabel di tiang karena pelanggan korporat marah, padahal sedang hujan dan harness tim yang tersedia talinya terkelupas. Apa yang Anda lakukan, dan regulasi apa yang relevan?
6. Seorang teman lulusan Teknik Elektro bekerja di pusat servis perangkat jaringan dan ingin menjadi network engineer dalam dua tahun. Susun rencana singkat yang memanfaatkan latar belakang hardware-nya.
7. Hasil stock opname menunjukkan 120 switch tercatat di CMDB, tetapi discovery LLDP/SNMP hanya menemukan 104. Jelaskan kemungkinan penyebab selisih dan cara Anda menuntaskannya.
8. Perusahaan Anda akan melelang 150 laptop lama ke karyawan. Sebagai IT asset manager, apa saja yang harus dipastikan sebelum laptop keluar dari gedung?
9. Anda sudah satu setengah tahun di helpdesk outsourcing sebuah bank dan ingin menjadi network administrator. Pilih dua sertifikasi dan tiga modul kurikulum yang akan Anda prioritaskan, beserta alasannya.

<details>
<summary>Jawaban</summary>

1. Urutan yang wajar: **(b), lalu (a), lalu (c)**. Tiket (b) berdampak luas (seluruh lantai) dan urgensinya tinggi karena operasi bisnis terhenti, sehingga prioritasnya paling tinggi dan perlu segera dicek apakah masalahnya di jaringan (switch lantai 2, VLAN, gateway) atau di server ERP, lalu dieskalasi ke tier 2 bila perlu. Tiket (a) dampaknya satu orang, tetapi orangnya pengambil keputusan dan email bisa kritis, jadi urgensinya sedang-tinggi; banyak organisasi memberi perlakuan VIP, tetapi tetap tidak boleh mengalahkan gangguan yang melumpuhkan satu lantai. Tiket (c) adalah permintaan layanan (service request), bukan insiden, dan biasanya butuh persetujuan lisensi, jadi masuk antrean normal. Kuncinya: prioritas dihitung dari dampak dikali urgensi, bukan dari siapa yang paling keras mengeluh, dan semua keputusan dicatat di tiket.

2. Kemungkinan besar tiket ditutup sebelum masalah benar-benar selesai, misalnya karena insentif atau tekanan pada metrik waktu dan FCR. Bisa juga solusinya hanya mengatasi gejala (restart, reset) tanpa mencari akar masalah, sehingga insiden berulang. Usulan: wajibkan verifikasi dengan pengguna sebelum penutupan, pantau reopen rate sebagai metrik utama yang setara dengan FCR, analisis tiket berulang lewat proses problem management, dan perbarui knowledge base agar solusi permanen dipakai semua orang.

3. Fiber: 8 x 0,4 = 3,2 dB. Splitter: 14 dB. Sambungan: 5 x 0,3 = 1,5 dB. Konektor: 4 x 0,75 = 3,0 dB. Total sekitar **21,7 dB**. Anggaran GPON kelas B+ adalah 28 dB, jadi masih di bawahnya dengan margin sekitar **6,3 dB**. Margin ini penting untuk penuaan komponen, sambungan perbaikan di masa depan, dan konektor yang kotor. Ingat, nilai TIA adalah batas maksimum, jadi rugi nyata biasanya lebih kecil; pengukuran di lapangan tetap yang menentukan.

4. Pertama, kumpulkan data waktu: kapan persisnya putus, berapa lama, apakah tetangga di ODP yang sama mengalami hal serupa (minta log dari NOC atau riwayat status ONT di OLT). Jika banyak pelanggan di satu ODP terdampak bersamaan, curigai kabel distribusi atau ODP, misalnya konektor longgar yang memburuk saat suhu berubah. Jika hanya satu pelanggan, cek jalur drop cable (tekukan tajam, klem yang menjepit, kabel bergesekan dengan dahan yang bergoyang saat angin sore), bersihkan dan periksa konektor, ukur daya optik dan bandingkan dengan nilai historis. Jangan lupa sisi pelanggan: ONT kepanasan, adaptor daya lemah, atau Wi-Fi padat di sore hari yang terasa seperti "internet putus" padahal jalur optik baik. Dokumentasikan setiap temuan agar bila gangguan berulang, tim berikutnya tidak mulai dari nol.

5. Tolak naik tiang dengan sopan dan tegas, jelaskan bahwa APD tidak layak dan cuaca tidak aman, laporkan kondisi harness, dan usulkan langkah lain: informasikan perkiraan waktu ke pelanggan lewat koordinator, siapkan material agar perbaikan bisa langsung dilakukan begitu aman, atau minta harness pengganti. Regulasi yang relevan adalah **Permenaker 9/2016** tentang K3 dalam Pekerjaan pada Ketinggian, yang mewajibkan perencanaan, prosedur kerja aman, APD, perangkat pelindung jatuh dan angkur, serta tenaga kerja yang kompeten. Bila ada kabel listrik di tiang yang sama, **Permenaker 12/2015** tentang K3 Listrik juga relevan.

6. Contoh rencana: (a) Manfaatkan posisi sekarang, minta ikut konfigurasi awal perangkat setelah diperbaiki dan pelajari CLI-nya; (b) selesaikan tahap 01 sampai 07 kurikulum ini plus lab 01-03, lalu ambil CCNA 200-301 v1.1 atau Network+ N10-009 dalam 6-9 bulan pertama; (c) tonjolkan keunggulan hardware: kuasai PoE, transceiver optik, dan diagnosis fisik (`02-layer-fisik/02-kabel-copper`, `02-layer-fisik/03-fiber`), karena banyak network engineer lemah di sini; (d) buat portofolio yang menggabungkan keduanya, misalnya laporan diagnosis switch rusak plus konfigurasi pemulihannya di lab; (e) lamar posisi NOC, network support di vendor, atau network administrator di perusahaan yang memakai perangkat yang sama dengan yang biasa ia perbaiki.

7. Kemungkinan penyebab: switch sudah dicabut atau rusak tetapi belum dihapus dari CMDB; switch ada tetapi SNMP belum dikonfigurasi atau community/kredensial salah; LLDP dimatikan di sebagian perangkat; switch berada di segmen yang tidak terjangkau server discovery (ACL atau firewall); atau switch tidak terkelola (unmanaged) yang memang tidak bisa ditemukan lewat SNMP. Cara menuntaskan: buat daftar 16 selisih, cek riwayat tiket dan perubahan untuk masing-masing, verifikasi lewat sumber lain (tabel MAC dan ARP di switch distribusi, DHCP lease, log syslog), lalu konfirmasi fisik bila perlu. Hasilnya diperbaiki di CMDB, konfigurasi SNMP/LLDP distandarkan, dan proses perubahan diperbaiki agar setiap pencabutan perangkat juga memperbarui CMDB.

8. Pastikan: (a) data disanitasi dengan metode yang sesuai media dan sensitivitas data, mengacu ke **NIST SP 800-88 Rev. 2**, dan ada bukti atau laporan per perangkat (nomor seri); (b) laptop dikeluarkan dari manajemen perangkat (Intune/MDM) dan akun terkait, serta fitur pelacak dan enkripsi ditangani dengan benar agar pembeli tidak terkunci; (c) lisensi perangkat lunak berbayar dicabut atau direklamasi, karena lisensi perusahaan tidak boleh ikut terjual; (d) aset dihapus dari buku dan CMDB dengan berita acara; (e) proses sesuai kebijakan internal dan kontrol **ISO/IEC 27001:2022 A.7.14**, serta memperhatikan kewajiban pelindungan data pribadi menurut **UU 27/2022**. Untuk bank, proses ini juga harus bisa dipertanggungjawabkan saat audit.

9. Contoh jawaban: Sertifikasi **CompTIA Network+ (N10-009)** atau **CCNA 200-301 v1.1** sebagai bukti fondasi jaringan, ditambah **ITIL Foundation** bila belum punya, karena bank sangat berorientasi proses dan change management. Modul prioritas: `03-data-link/03-vlan` (segmentasi cabang dan kantor pusat), `09-nat-acl-firewall/02-acl` (bank sangat ketat soal akses), dan `14-monitoring-troubleshooting/02-tools` (bukti yang rapi saat eskalasi). Alasannya: di lingkungan bank, network admin lebih banyak bekerja dengan perubahan terkontrol, segmentasi, dan bukti audit daripada membangun jaringan baru dari nol. Tambahkan portofolio lab yang mensimulasikan kantor cabang dengan VLAN, ACL, dan dokumentasi perubahan.

</details>

---

## 10. Sumber

- CompTIA A+ Core 1 (V15), 220-1201: https://www.comptia.org/en-us/certifications/a/core-1-v15/
- CompTIA A+ Core 2 (V15), 220-1202: https://www.comptia.org/en-us/certifications/a/core-2-v15/
- Professor Messer, perbedaan 220-1101 dan 220-1201 (tanggal rilis dan pensiun): https://www.professormesser.com/free-a-plus-training/a-plus-articles/differences-between-220-1101-and-220-1201/
- CompTIA Tech+ (FC0-U71): https://www.comptia.org/en-us/certifications/tech/
- Google IT Support Professional Certificate: https://grow.google/certificates/it-support/
- HDI, katalog kursus dan sertifikasi berbasis peran: https://www.thinkhdi.com/education/courses
- PeopleCert, ITIL FAQ (ITIL Version 5 dan rencana akhir ITIL 4): https://www.peoplecert.org/help-and-support/faq-itil
- PeopleCert, ITIL Foundation (Version 5): https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1/itil-5-foundation-version-50-4154
- Microsoft 365 Certified: Endpoint Administrator Associate (MD-102): https://learn.microsoft.com/en-us/credentials/certifications/modern-desktop/
- O*NET, Computer User Support Specialists (15-1232.00): https://www.onetonline.org/link/summary/15-1232.00
- O*NET, Telecommunications Equipment Installers and Repairers (49-2022.00): https://www.onetonline.org/link/summary/49-2022.00
- O*NET, Computer Hardware Engineers (17-2061.00): https://www.onetonline.org/link/summary/17-2061.00
- TIA, rilis ANSI/TIA-568.2-E dan 568.5-1: https://tiaonline.org/?p=36976
- Wikipedia, ANSI/TIA-568 (struktur bagian 568.x-E dan T568A/T568B): https://en.wikipedia.org/wiki/ANSI/TIA-568
- FOA, CFOT: https://thefoa.org/cfot.htm
- FOA, sertifikasi spesialis CFOS: https://thefoa.org/adv-cert.htm
- FOA, loss budget dan nilai TIA-568: https://www.thefoa.org/tech/lossbudg.htm
- ITU-T G.984.2 (GPON PMD): https://itu.int/t/aap/recdetails/8484
- BICSI, program instalasi kabel ICT yang direvisi (INST1, INSTC, INSTF, TECH): https://www.cablinginstall.com/standards/article/14270591/bicsi-launches-revised-ict-cabling-installation-program
- JDIH Kemnaker, Kepmenaker 101 Tahun 2018 (SKKNI Instalasi Fiber Optik): https://jdih.kemnaker.go.id/peraturan/detail/1751/keputusan-menteri-ketenagakerjaan-nomor-101-tahun-2018
- JDIH Kemnaker, Kepmenaker 321 Tahun 2016 (SKKNI Jaringan Komputer): https://jdih.kemnaker.go.id/peraturan/detail/1464/keputusan-menteri-ketenagakerjaan-nomor-321-tahun-2016
- JDIH Kemnaker, Kepmenaker 285 Tahun 2016 (SKKNI Computer Technical Support): https://jdih.kemnaker.go.id/peraturan/detail/1384/keputusan-menteri-ketenagakerjaan-nomor-285-tahun-2016
- LSP Universitas Gunadarma, contoh skema Teknisi Utama Jaringan Komputer: https://lsp.gunadarma.ac.id/media/skema/Skema_Teknisi_Utama_Jaringan_Komputer.pdf
- BNSP (direktori LSP dan jadwal uji kompetensi): https://bnsp.go.id/
- Permenaker 9 Tahun 2016, K3 dalam Pekerjaan pada Ketinggian (Berita Negara 2016 No. 386): https://peraturan.go.id/files/bn386-2016.pdf
- JDIH Kemnaker, Permenaker 12 Tahun 2015, K3 Listrik di Tempat Kerja: https://jdih.kemnaker.go.id/peraturan/detail/610/peraturan-menteri-nomor-12-tahun-2015
- Global Electronics Association (dulu IPC), sejarah dan perubahan nama 2025: https://www.electronics.org/history
- APMG International, sertifikasi IAITAM: https://apmg-international.com/product/iaitam-certifications
- ISO/IEC 19770-1:2017: https://www.iso.org/standard/68531.html
- NIST SP 800-88 Rev. 2, Guidelines for Media Sanitization: https://csrc.nist.gov/pubs/sp/800/88/r2/final
- OJK, POJK Penyelenggaraan Teknologi Informasi oleh Bank Umum: https://ojk.go.id/id/regulasi/Pages/Penyelenggaraan-Teknologi-Informasi-oleh-Bank-Umum.aspx
- Bisnis.com, data APJII 2025 (229,43 juta pengguna internet): https://teknologi.bisnis.com/read/20250806/101/1899997/data-apjii-pengguna-internet-di-indonesia-tembus-22943-juta-orang-pada-2025
- CNN Indonesia, integrasi IndiHome ke Telkomsel (1 Juli 2023): https://www.cnnindonesia.com/teknologi/20230701125659-190-968316/mulai-hari-ini-telkom-resmi-integrasikan-indihome-ke-telkomsel/amp
- Selular.id, TKDN perangkat 4G dan 5G 35% (Permenkominfo 13/2021): https://selular.id/2021/10/kominfo-tetapkan-tkdn-perangkat-4g-dan-5g-naik-35-persen/
- Jobstreet Indonesia, kisaran gaji IT support: https://id.jobstreet.com/id/career-advice/article/kisaran-gaji-it-support-terbaru
- Jobstreet Indonesia, gaji Teknisi Jaringan: https://id.jobstreet.com/id/career-advice/role/network-technician/salary
- Jobstreet Indonesia, gaji Teknisi Elektronika: https://id.jobstreet.com/id/career-advice/role/electronics-technician/salary

---

**Berikutnya:** `21-ekosistem-profesi/07-rumpun-tata-kelola-konsultasi`. Rumpun tata kelola dan konsultasi: IT consultant, IT auditor, disaster recovery specialist, solution architect, dan scrum master infrastruktur.

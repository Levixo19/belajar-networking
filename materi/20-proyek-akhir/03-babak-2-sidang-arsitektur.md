# 20.3 Babak 2: Sidang Arsitektur (Jadi Juri)

> **Prasyarat:** `20.1`, `20.2`, ditambah `11` (WAN & VPN), `16` (data center, cloud, SDN), `17` (desain & arsitektur)
> **Tujuan:** Menilai tiga proposal vendor secara objektif dengan matriks berbobot, menolak yang salah dengan alasan yang menunjuk kebutuhan, lalu menyusun desain tingkat tinggi sendiri beserta catatan keputusan arsitektur.

---

## 1. Bentuk Kerja Babak Ini

Di Babak 1 Anda jadi auditor. Sekarang Anda jadi juri, lalu arsitek.

Ini bentuk kerja yang berbeda: tidak ada konfigurasi, tidak ada perintah. Yang diuji adalah kemampuan membandingkan hal-hal yang tidak sebanding dan mempertahankan pilihan Anda di depan orang yang lebih senior.

Alurnya tiga langkah, dan langkah 1 harus selesai sebelum melihat harga:

1. **Susun kriteria dulu.** Turunkan dari kebutuhan di `20.1`, beri bobot, dan bekukan. Kalau kriteria disusun setelah membaca proposal, Anda akan tanpa sadar menyusun kriteria yang memenangkan proposal yang paling Anda sukai.
2. **Nilai ketiga proposal** dengan kriteria yang sama, termasuk mencatat apa yang **tidak dijawab** proposal itu.
3. **Rancang sendiri.** Ambil gagasan bagus dari ketiganya, buang sisanya, dan pertanggungjawabkan setiap keputusan dalam bentuk ADR.

> [!NOTE]
> Mode Ujian: 150 menit. Mode Kilat: lewati babak ini, tapi wajib jawab latihan §9.

> [!WARNING]
> Jebakan utama babak ini: dua dari tiga proposal memakai istilah yang benar secara teknis namun tidak relevan dengan kebutuhan BNS. Kalau Anda menilai proposal dari kecanggihan teknologinya, Anda akan memilih yang salah.

---

## 2. Proposal A: "Cloud-First Nusantara"

> *"Hentikan repot mengelola perangkat. Pindahkan semuanya ke cloud."*

| Komponen | Isi |
|---|---|
| Situs | SD-WAN appliance vendor tunggal di HQ, pabrik, depo, dan 20 TPI |
| Data center | **Dihapus.** Semua VM dipindah ke cloud publik, NAS diganti object storage |
| Keamanan | SASE: semua lalu lintas pengguna dan situs keluar lewat titik inspeksi cloud |
| Rantai dingin | Sensor suhu kirim langsung ke platform IoT cloud; dasbor dan alarm dari cloud |
| Nirkabel | AP terkelola cloud, lisensi per AP per tahun |
| Operasional | "Cukup satu orang IT, sisanya kami kelola dari NOC kami" |
| Biaya | CAPEX Rp 4,6 miliar · OPEX Rp 320 juta/bulan (naik dari Rp 180 juta) |
| Waktu | 4 bulan |

Kutipan menarik dari presentasinya: *"Tidak perlu memikirkan VLAN lagi. Semuanya mikro-segmentasi berbasis identitas di cloud."*

---

## 3. Proposal B: "Enterprise Fabric"

> *"Bangun sekali, bangun benar. Arsitektur yang sama dengan bank."*

| Komponen | Isi |
|---|---|
| HQ | Spine-leaf VXLAN/EVPN: 2 spine + 4 leaf, switch 25G/100G |
| Pabrik | Spine-leaf kedua: 2 spine + 4 leaf, plus leaf industrial |
| Keamanan | Sepasang NGFW HA di **setiap** situs besar, 802.1X penuh untuk kabel & nirkabel, NAC dengan profiling |
| WAN | MPLS dua operator + perangkat SD-WAN terpisah |
| Manajemen | Pengendali jaringan berbasis niat (intent-based), otomasi bawaan vendor |
| TPI | **Tidak dibahas** ("di luar lingkup, bisa fase 2") |
| Cadangan/DR | **Tidak dibahas** |
| Operasional | Butuh 1 arsitek + 2 engineer bersertifikat, pelatihan 6 minggu |
| Biaya | CAPEX Rp 9,2 miliar · OPEX Rp 210 juta/bulan (lisensi & dukungan) |
| Waktu | 9 bulan |

Kutipan: *"VXLAN memberi Anda mobilitas beban kerja dan skala horizontal tanpa batas."*

---

## 4. Proposal C: "Paket Hemat Sekali Jalan"

> *"Rp 900 juta, semua beres, 3 minggu."*

| Komponen | Isi |
|---|---|
| HQ | 1 router baru, 1 firewall, 6 switch akses terkelola, 12 AP |
| Pabrik | 1 router baru, **switch tidak terkelola yang lama dipertahankan** ("masih bagus") |
| VLAN | "Dibuat nanti setelah semua stabil" |
| OT/PLC | Tidak disentuh ("risiko ke produksi") |
| TPI | MikroTik yang ada dipakai terus, konfigurasi diseragamkan manual |
| Monitoring | Aplikasi pemantau gratis dipasang di laptop staf IT |
| Log | Tetap di perangkat masing-masing |
| Cadangan | "Sudah ada NAS, cukup" |
| Biaya | CAPEX Rp 900 juta · OPEX tetap |
| Waktu | 3 minggu |

Kutipan: *"Jaringan itu sederhana, Pak. Yang penting internetnya kencang."*

---

## 5. Langkah 1: Susun Matriks Kriteria (sebelum menilai)

Buat tabel seperti ini di `03-keputusan-arsitektur.md`, isi bobot sendiri dengan total 100:

| # | Kriteria | Bobot | Dari kebutuhan mana |
|---|---|---|---|
| K1 | Rantai dingin tetap terpantau & teralarm **saat WAN mati** | ? | `20.1 §2` batas 15 menit, Rp 1,2 M/kontainer |
| K2 | Segmentasi OT/PLC dari jaringan kantor | ? | risiko kendali produksi, ISO 27001 |
| K3 | Bisa dijalankan oleh **1 engineer + 2 support** | ? | `20.1 §2` tim |
| K4 | Cocok untuk 12→20 TPI di belakang CGNAT | ? | lokasi TPI, LTE |
| K5 | Total biaya 5 tahun (CAPEX + OPEX×60) | ? | anggaran, tekanan CFO |
| K6 | Jalur perubahan tanpa menghentikan produksi | ? | Bu Ratna, Rp 400 juta/6 jam |
| K7 | Memenuhi kontrol yang dicari auditor ISO 27001 | ? | target CTO |
| K8 | Ketahanan terhadap ransomware & pemulihan | ? | insiden tahun lalu |
| K9 | Bebas keterikatan vendor / bisa dimigrasi | ? | kelangsungan usaha |
| K10 | Waktu sampai risiko terbesar hilang | ? | risiko berjalan setiap hari |

Beri skor tiap proposal 0-5 per kriteria, kalikan bobot, jumlahkan.

> [!TIP]
> Berbeda dengan pemula, juri berpengalaman memperlakukan beberapa kriteria sebagai **gugur (knock-out)**, bukan penambah nilai. Kalau sebuah proposal gagal pada K1, proposal itu tidak boleh diselamatkan oleh skor tinggi di kriteria lain. Tentukan sendiri kriteria mana yang gugur, dan pertahankan alasannya.

---

## 6. Langkah 2: Tulis Tiga Surat Penilaian

Untuk masing-masing proposal, satu halaman berisi:

- **Satu kalimat keputusan**: terima / terima dengan syarat / tolak.
- **Tiga gagasan yang layak diambil** dari proposal itu (semua proposal punya, termasuk C).
- **Kesalahan fatalnya**, dinyatakan sebagai *kebutuhan mana yang tidak terpenuhi*, bukan sebagai "teknologinya jelek".
- **Satu pertanyaan** yang akan Anda ajukan ke vendor dan Anda tahu jawabannya akan mengungkap kelemahan terbesarnya.

> [!WARNING]
> Penilaian yang berbunyi "Proposal B terlalu canggih" akan ditolak. Yang benar: "Proposal B gagal pada K3 dan K4: menuntut tiga orang bersertifikat yang tidak dimiliki BNS, dan tidak menyentuh 20 lokasi yang justru menghasilkan data kepatuhan."

---

## 7. Langkah 3: Rancang Sendiri

Keluarkan di `03-keputusan-arsitektur.md` + `04-topologi/`:

**a. Diagram tingkat tinggi**: situs, jalur WAN, zona keamanan, letak layanan (mana di lokal, mana di cloud). Satu halaman, boleh ASCII.

**b. Sepuluh ADR** (satu keputusan per catatan), format:

```text
ADR-003  Topologi kampus HQ
Konteks   220 pengguna, 4 lantai, 1 DC kecil, 1 engineer, tumbuh 50%/3 tahun
Keputusan Collapsed core: sepasang switch L3 + akses per lantai
Alasan    K3 (dirawat 1 orang), K5 (biaya), cukup untuk skala ini
Ditolak   Tiga lapis (belum perlu), spine-leaf (untuk east-west masif, bukan kasus ini)
Akibat    Batas ±500 pengguna sebelum perlu lapisan distribution terpisah
Ditinjau  Bila pengguna HQ > 450 atau DC > 10 host
```

Minimal cakup: topologi kampus HQ · fabric/akses pabrik · segmentasi OT · desain WAN & redundansi · pola terowongan TPI · letak penyimpanan data suhu · strategi cadangan & DR · titik keluar internet & inspeksi · manajemen out-of-band · identitas & autentikasi perangkat.

**c. Analisis ketahanan lokal**, berupa tabel: kalau X mati, apa yang masih jalan?

| Kegagalan | Suhu tetap terukur? | Tetap tersimpan? | Alarm tetap sampai? | Produksi jalan? |
|---|---|---|---|---|
| WAN HQ mati | ? | ? | ? | ? |
| WAN pabrik mati | ? | ? | ? | ? |
| Internet TPI mati 6 jam | ? | ? | ? | tidak berlaku |
| Cloud/ERP tidak bisa diakses | ? | ? | ? | ? |
| Switch inti pabrik mati | ? | ? | ? | ? |
| Listrik pabrik mati 30 menit | ? | ? | ? | ? |

**d. Daftar SPOF** desain Anda sendiri, dengan keputusan: digandakan, diterima dengan mitigasi, atau diterima sadar risiko.

**e. Peta keterlacakan kebutuhan**, berupa tabel dua kolom: setiap kebutuhan di `01-kebutuhan.md` menunjuk ke ADR yang memenuhinya. Kebutuhan tanpa ADR berarti desain Anda belum lengkap; ADR tanpa kebutuhan berarti Anda mendesain sesuatu yang tidak diminta siapa pun.

---

## 8. Ringkasan

- Kriteria disusun sebelum melihat proposal dan harga, kalau tidak penilaian Anda hanya rasionalisasi selera.
- Beberapa kebutuhan bersifat gugur. Rantai dingin yang berhenti saat WAN mati tidak bisa ditebus oleh dasbor yang cantik.
- Proposal termurah dan proposal termahal bisa gagal karena alasan yang sama: keduanya tidak menjawab kebutuhan sebenarnya.
- Desain yang baik untuk perusahaan dengan satu engineer berbeda dari desain yang baik untuk bank. Memilih desain yang sesuai skala BNS adalah ketepatan, bukan kompromi.
- ADR membuat keputusan bisa ditinjau ulang setahun kemudian oleh orang lain (atau oleh Anda yang sudah lupa).

---

## 9. Latihan: Pertanyaan Sidang

1. Proposal A memindahkan pencatatan dan alarm suhu sepenuhnya ke cloud. Jelaskan mengapa ini gagal pada kriteria gugur, lalu rumuskan prinsip desain umum yang bisa Anda pakai lagi di kasus lain, tidak terbatas pada BNS.
2. Proposal B menawarkan spine-leaf VXLAN/EVPN di HQ dan pabrik. Jelaskan untuk pola lalu lintas seperti apa arsitektur itu memang tepat, lalu tunjukkan dengan data kasus ini mengapa BNS bukan kasus tersebut. Sebutkan juga satu bagian dari Proposal B yang justru **harus** Anda ambil.
3. Proposal C mempertahankan switch tidak terkelola di pabrik dan menunda VLAN "sampai stabil". Bongkar logika kalimat itu: mengapa menunda segmentasi justru membuat jaringan tidak akan pernah stabil, dan hubungkan dengan dua temuan Babak 1.
4. CFO bertanya: *"Kalau Proposal A menaikkan OPEX Rp 140 juta per bulan, dan Proposal B butuh Rp 9,2 miliar di muka, kenapa angka kamu Rp 3,8 miliar bisa dipercaya?"* Susun jawaban yang memakai biaya lima tahun dan satu perbandingan risiko dalam rupiah.
5. Bu Ratna bertanya: *"Desain kamu tetap mengubah jaringan pabrik. Apa jaminannya produksi tidak berhenti?"* Jawab dengan pendekatan teknis konkret, bukan janji.

<details>
<summary>Jawaban</summary>

1. Gagal pada K1 karena **jalur pengukuran, penyimpanan, dan alarm semuanya melewati satu titik kegagalan yang sama: internet situs.** Sensor kirim ke cloud, basis data di cloud, aturan alarm di cloud, notifikasi keluar dari cloud. Ketika WAN pabrik mati 20 menit (hal yang wajar terjadi), tiga hal buruk terjadi sekaligus: data suhu **hilang** (bukan tertunda, kalau sensor tidak punya penyimpanan lokal), celah rekaman melewati batas auditor 15 menit, dan **alarm tidak bisa keluar justru saat Anda paling butuh tahu**. Bahkan lebih buruk: kegagalan jaringan menjadi *tidak terlihat* karena yang seharusnya memberi tahu Anda ada di seberang jaringan yang mati. Prinsip umum yang bisa dipakai di kasus lain: **fungsi yang menentukan kepatuhan atau keselamatan harus bisa berjalan sendiri di lokasi terjadinya, dan cloud hanya menjadi salinan serta tempat mengolah, bukan sumber kebenaran satu-satunya.** Wujud praktisnya: pengumpul data lokal (gateway/edge) yang menyimpan antrean tahan-mati-listrik, aturan alarm lokal dengan jalur keluar alternatif (SMS/GSM, sirene fisik di ruang jaga), sinkronisasi ke pusat saat jalur hidup, dan rekonsiliasi data. Pertanyaan penguji untuk desain apa pun: *"kalau jaringan ke tempat ini mati satu jam, apa yang berhenti dan apa yang tetap jalan?"*

2. Spine-leaf VXLAN/EVPN tepat untuk pola lalu lintas **east-west masif**: banyak server saling berbicara di dalam satu fasilitas, ratusan hingga ribuan port server, kebutuhan memindahkan beban kerja antar-rak tanpa mengubah alamat, penyewa (tenant) banyak yang harus saling terisolasi, dan pertumbuhan yang diselesaikan dengan menambah leaf. BNS bukan kasus itu: HQ punya **3 host hypervisor dan 1 NAS**, lalu lintas utamanya **north-south** (pengguna → ERP/cloud, pengguna → internet), dan di pabrik yang banyak justru perangkat akses (CCTV, PLC, timbangan, AP) bukan server. Membangun dua fabric VXLAN berarti membayar kompleksitas kontrol (BGP EVPN, VTEP, underlay/overlay, pemecahan masalah dua lapis) yang harus dirawat satu orang. Itu justru menurunkan ketersediaan, karena kompleksitas yang tidak dikuasai adalah sumber gangguan. Buktinya di data kasus: 360 pengguna total, satu DC kecil, satu engineer. Bagian Proposal B yang harus diambil: **sepasang NGFW dengan HA di HQ sebagai titik inspeksi antar-zona** dan **802.1X/NAC untuk kabel dan nirkabel** (menjawab K2 dan K7, sekaligus mengatasi masalah "siapa saja bisa menancapkan switch" dari Babak 1); tambahan yang juga layak dicontek: **jaringan manajemen out-of-band** dan disiplin pengendali/otomasi terpusat, walau diwujudkan dengan alat bebas vendor (lihat Babak 7).

3. Kalimat "VLAN nanti setelah stabil" membalik sebab dan akibat: **jaringan datar itu sendiri penyebab ketidakstabilan.** Di satu broadcast domain, setiap masalah menjadi masalah semua orang: satu loop dari switch tidak terkelola membuat seluruh pabrik terganggu (temuan Babak 1: MACFLAP dan 41.892 perubahan topologi), tabel MAC mendekati batas sehingga *flooding* menaikkan beban semua port (temuan `show mac address-table count` 7.940/252), broadcast dari ribuan perangkat memakan kapasitas dan CPU perangkat lemah, DHCP tanpa batas zona membuat printer label berganti alamat (T-944), dan PLC berada pada domain yang sama dengan laptop tamu sehingga tidak ada batas yang bisa dipakai membuat aturan apa pun. Selain itu, menunda segmentasi berarti menunda **kemampuan mengukur**: tanpa VLAN dan tanpa titik inspeksi, Anda tidak punya tempat untuk memasang aturan, menghitung lalu lintas, atau memisahkan gangguan, jadi "stabil" tidak akan pernah bisa dibuktikan, hanya bisa dirasakan. Ditambah switch yang tidak terkelola secara definisi tidak bisa diberi VLAN, port-security, atau BPDU guard, sehingga Proposal C secara struktural menutup jalan menuju perbaikan yang katanya ditunda. Urutan yang benar: ganti switch pabrik menjadi terkelola dan pisahkan zona paling berbahaya lebih dulu (OT, CCTV, sensor), justru karena jaringannya belum stabil.

4. Kerangka jawabannya tiga langkah. **(a) Bandingkan biaya lima tahun, bukan harga di muka.** Proposal A: 4,6 M + (320 juta × 60) = 4,6 M + 19,2 M = **23,8 M**. Proposal B: 9,2 M + (210 juta × 60) = 9,2 M + 12,6 M = **21,8 M**. Usulan Anda: 3,8 M + (kira-kira 200 juta × 60) = 3,8 M + 12,0 M = **15,8 M**. Proposal C: 0,9 M + 10,8 M = 11,7 M. Angka ini termurah, tetapi Proposal C masuk ke langkah (b). **(b) Masukkan biaya risiko yang tidak dihilangkan.** Proposal C tidak menghilangkan risiko kontainer ditolak; dengan 40 kontainer/bulan dan Rp 1,2 miliar per penolakan, **satu** penolakan per tahun saja sudah Rp 6 miliar selama lima tahun, lebih besar daripada seluruh selisih anggaran. Tambahkan biaya gagal audit ISO (kehilangan pembeli yang mensyaratkannya) dan biaya insiden ransomware kedua (yang pertama sudah terjadi, dan cadangan masih belum layak; lihat Babak 1 Bukti D). **(c) Tunjukkan bahwa angka Anda bisa diperiksa.** Rp 3,8 miliar Anda dirinci per kebutuhan dan tiap barisnya menunjuk ADR dan kriteria; ada urutan fase sehingga risiko terbesar hilang di fase 1 dengan porsi anggaran terkecil; dan ada bagian yang bisa dipotong bila perlu, beserta risiko yang muncul bila dipotong (itu pekerjaan Babak 9). Kalimat penutup yang bekerja di ruang rapat: *"Saya tidak meminta anggaran untuk jaringan yang lebih bagus. Saya meminta anggaran supaya bukti suhu kita tidak pernah bolong lagi, dan saya bisa tunjukkan setiap rupiahnya untuk apa."*

5. Jawaban "jaminan" yang bisa dipertanggungjawabkan bukan janji, tapi **metode**: **(a) Bangun di samping, bukan menimpa**: pasang switch baru berdampingan dengan yang lama, jalankan paralel, pindahkan port per kelompok kecil (misal satu lini produksi per jendela), sehingga yang lama tetap bisa dipakai. **(b) Urutan berdasar risiko produksi**, bukan kemudahan: mulai dari zona yang tidak menyentuh produksi (kantor pabrik, Wi-Fi tamu, CCTV), baru sensor suhu, dan OT/PLC paling akhir setelah semua pola terbukti. **(c) Jendela perubahan yang disepakati** (malam Sabtu), dengan **batas waktu keputusan mundur** (misal: bila pada 02:00 uji terima belum lulus, kembalikan). **(d) Rencana rollback yang sudah diuji, bukan ditulis**: konfigurasi lama tersimpan dan sudah dicoba dipulihkan di lab, kabel lama tetap terpasang dan berlabel, target kembali normal ≤ 30 menit sesuai permintaan Bu Ratna. **(e) Matriks uji terima** yang dijalankan sebelum jendela ditutup, termasuk uji yang penting bagi produksi: PLC merespons HMI, timbangan mencetak label dengan batch benar, sensor suhu tercatat di penyimpanan lokal, forklift tidak kehilangan sesi saat berpindah AP. **(f) Orang produksi hadir** saat perubahan dan yang menyatakan "lulus", bukan orang IT. **(g) Perubahan berikutnya hanya dilakukan setelah satu siklus produksi penuh berjalan normal.** Tutup dengan kalimat yang menukar posisi: *"Risiko terbesar bagi produksi bukan perubahan yang direncanakan, tapi jaringan sekarang yang bisa berhenti kapan saja tanpa kita tahu sebabnya. Yang saya tawarkan adalah memindahkan risiko dari 'kapan saja' ke 'malam Sabtu, dengan tombol mundur'."*

</details>

---

## 10. Rubrik Babak 2 (130 poin)

| Aspek | Poin | Kriteria |
|---|---|---|
| Matriks kriteria berbobot | 20 | Diturunkan dari kebutuhan, bobot punya alasan, ada kriteria gugur |
| Penilaian tiga proposal | 30 | Kesalahan fatal dinyatakan sebagai kebutuhan yang gagal; gagasan bagus tetap diambil |
| Diagram tingkat tinggi | 20 | Zona, jalur, dan letak layanan jelas; bisa dibaca orang lain |
| Sepuluh ADR | 30 | Ada konteks, alternatif yang ditolak, akibat, dan pemicu peninjauan |
| Analisis ketahanan lokal | 20 | Tabel kegagalan terisi dan konsisten dengan desain |
| Keterlacakan kebutuhan | 10 | Tidak ada kebutuhan tanpa ADR, tidak ada ADR tanpa kebutuhan |

---

## 11. Sumber

- `17-desain-arsitektur/01-prinsip-desain.md` sampai `04-studi-kasus-desain.md`
- `16-datacenter-cloud-sdn`: kapan spine-leaf, VXLAN, dan cloud memang tepat
- `11-wan-vpn`: SD-WAN, pemilihan transport, terowongan
- Michael Nygard, *Documenting Architecture Decisions*: asal format ADR
- ISO/IEC 27001:2022 Annex A 8.20-8.23: kontrol jaringan yang dicari auditor

---

**Berikutnya:** `20-proyek-akhir/04-babak-3-teka-teki-alamat.md`. Satu blok alamat, dua puluh situs, satu lubang yang tidak boleh disentuh.

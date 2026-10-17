# 20.10 Babak 9: Ruang Rapat

> **Prasyarat:** `20.9`, ditambah `17` (desain & arsitektur) dan `18` (karier & komunikasi profesional)
> **Tujuan:** Mempertahankan pekerjaan teknis Anda di hadapan orang yang tidak peduli pada teknis: mengubah risiko menjadi rupiah, memutuskan apa yang dikorbankan saat anggaran dipotong, dan menyusun rencana migrasi yang tidak menghentikan produksi.

---

## 1. Bentuk Kerja Babak Ini

Babak terakhir sebelum sidang, dan satu-satunya yang tidak boleh mengandung istilah teknis di keluaran utamanya.

Desain terbaik yang gagal dipertahankan di ruang rapat bernilai nol, dan keputusan tentang apa yang dikorbankan selalu diambil oleh orang yang tidak paham akibat teknisnya, kecuali Anda yang menerjemahkannya.

Tiga kemampuan yang diuji: **mengubah risiko menjadi angka** · **memilih apa yang dikorbankan dan berani menyebut yang tidak bisa dikorbankan** · **menjawab pertanyaan yang tidak ramah tanpa bersikap defensif**.

> [!NOTE]
> Mode Ujian: 120 menit. Latih jawaban lisan dengan suara, karena mengucapkannya jauh berbeda dari menulisnya.

---

## 2. Kejadian: Rapat Anggaran, Selasa Pagi

> **Pak Dedi (CFO):** "Saya sudah baca. Rapi. Tapi angkanya tidak bisa. Kuartal ini kita pangkas belanja modal 35% di semua lini. Untuk kamu artinya **Rp 2,47 miliar**, bukan 3,8. Saya tidak mau dengar 'kalau dipotong semuanya gagal'. Saya mau tahu apa yang tetap kamu kerjakan, apa yang kamu buang, dan apa yang terjadi kalau saya paksa potong lagi."
>
> **Pak Hendra (CTO):** "Dan tolong buat versi yang bisa saya bacakan ke direksi. Sepuluh menit, tanpa satu pun singkatan."
>
> **Bu Ratna (COO):** "Saya cuma mau satu hal: jangan ada satu jam pun lini berhenti karena pekerjaan kamu."

Ini terjadi **setelah** malam panjang di Babak 8. Insiden itu ada di ingatan semua orang. Itu aset argumentasi Anda, jadi gunakan.

---

## 3. Daftar Harga Acuan (asumsi kasus, bukan harga pasar)

Pakai angka ini agar hitungan semua orang bisa dibandingkan.

| Barang / jasa | Satuan | Harga |
|---|---|---|
| Switch inti L3 (24 port, 10G uplink) | unit | Rp 180 juta |
| Switch akses terkelola 48 port PoE+ | unit | Rp 55 juta |
| Switch industri (suhu ekstrem, DIN rail) | unit | Rp 78 juta |
| Firewall NGFW sepasang HA + langganan 1 tahun | pasang | Rp 420 juta |
| Router tepi WAN | unit | Rp 65 juta |
| AP indoor kelas perusahaan | unit | Rp 9 juta |
| AP kelas industri untuk cold storage (+antena, enklosur) | unit | Rp 28 juta |
| Paket MikroTik + antena per TPI | lokasi | Rp 6 juta |
| Server pengumpul lokal (pabrik/HQ) | unit | Rp 45 juta |
| Sensor suhu + gateway, 120 titik | paket | Rp 240 juta |
| Penyimpanan CCTV 50 TB usable | paket | Rp 160 juta |
| Cadangan tak-bisa-ditimpa + salinan luar lokasi | paket | Rp 150 juta |
| UPS, catu daya, pembumian | paket | Rp 120 juta |
| Kabel, jalur, instalasi fisik | paket | Rp 280 juta |
| Jasa survei RF profesional | paket | Rp 45 juta |
| Jasa integrator implementasi | paket | Rp 350 juta |
| Pemantauan, AAA, vault rahasia (langganan) | per tahun | Rp 90 juta |
| Pelatihan & sertifikasi tim (3 orang) | paket | Rp 60 juta |
| Cadangan tak terduga | % dari total | 10% |

---

## 4. Yang Harus Dikeluarkan

**a. Rincian anggaran berjenjang.** Tabel: barang · jumlah · harga · total · **tingkat** (P1 wajib / P2 penting / P3 bisa ditunda) · **kebutuhan yang dilayani** (tunjuk ADR dari Babak 2). Total P1 saja harus ≤ Rp 2,47 miliar; kalau tidak, Anda harus menurunkan sesuatu dari P1 dan itu keputusan yang harus Anda pertahankan.

**b. Tiga hal yang Anda tolak potong**, masing-masing dengan pembanding rupiah. Format yang bekerja di ruang rapat:

```text
Yang diminta : menunda pengumpul data lokal di pabrik (hemat Rp 90 juta)
Risikonya    : bukti suhu hilang setiap kali WAN terganggu
Kemungkinan  : WAN pabrik terganggu >15 menit rata-rata 2x/bulan (data 6 bulan terakhir)
Dampak       : satu kontainer ditolak = Rp 1,2 miliar
Perbandingan : hemat Rp 90 juta, menanggung risiko Rp 1,2 miliar dengan peluang nyata
Kesimpulan   : ini bukan penghematan, ini pertaruhan
```

**c. Risk register.** Kolom: risiko · kemungkinan (rendah/sedang/tinggi, dengan dasarnya) · dampak dalam rupiah · nilai risiko · mitigasi · **pemilik risiko** · status setelah pemotongan. Setiap barang yang Anda potong **wajib** muncul sebagai risiko di tabel ini. Risiko yang diterima harus ada nama pemiliknya, dan itu bukan Anda; Anda bukan pemilik risiko bisnis.

**d. Rencana migrasi (`12-migrasi.md`).** Fase, urutan, jendela perubahan, uji terima per fase (ambil dari Babak 4), rencana kembali yang sudah diuji, dan siapa yang menyatakan lulus. Syarat mutlak dari Bu Ratna: tidak ada satu jam pun produksi berhenti, dan setiap perubahan bisa dikembalikan ≤ 30 menit. Urutan fase harus menghilangkan **risiko terbesar lebih dulu dengan biaya terkecil**, bukan mengerjakan yang paling mudah lebih dulu.

**e. Penjelasan lima kalimat.** Untuk direktur yang tidak paham teknis, tanpa satu pun singkatan, tanpa kata "VLAN", "firewall", "segmentasi". Lima kalimat, tidak lebih. Ini jauh lebih sulit daripada kelihatannya.

**f. Kerangka sepuluh slide.** Satu baris judul per slide plus satu baris pesan utamanya. Aturan: slide pertama bukan topologi, dan tidak ada satu pun diagram jaringan di lima slide pertama.

**g. Laporan bulanan satu halaman.** Isi: pencapaian SLO terhadap target (dari Babak 7), jumlah insiden dan waktu deteksi rata-rata, anggaran kesalahan yang terpakai, kemajuan perbaikan, dan satu risiko teratas. Ini yang akan Anda kirim setiap bulan. Rancang supaya bisa dibuat dalam 20 menit; kalau tidak, Anda tidak akan pernah mengirimkannya.

**h. Jawaban untuk delapan pertanyaan tidak ramah.** Tulis jawaban untuk semuanya; lima yang tersulit dibahas di §6.

1. "Kenapa tidak semua dipindah ke cloud saja supaya kita tidak perlu urus perangkat?"
2. "Vendor bilang tiga minggu. Kamu bilang lima bulan. Siapa yang mengarang?"
3. "Kenapa harus dua koneksi internet? Yang sekarang jarang mati."
4. "Kenapa harus ganti switch pabrik yang masih menyala dan tidak rusak?"
5. "Kita sudah bayar antivirus dan firewall bertahun-tahun. Kenapa masih kena?"
6. "Kalau kamu resign bulan depan, apa yang terjadi dengan semua ini?"
7. "Pemantauan itu kan cuma melihat grafik. Kenapa perlu anggaran dan langganan?"
8. "Kamu minta Rp 2,47 miliar dan tidak bisa menjamin tidak akan ada gangguan lagi. Jadi saya beli apa?"

---

## 5. Ringkasan

- Risiko yang tidak dinyatakan dalam rupiah akan selalu kalah melawan penghematan yang dinyatakan dalam rupiah.
- Pemotongan anggaran bukan bencana; ia menguji apakah Anda tahu urutan prioritas dari desain Anda sendiri.
- Ada hal yang boleh dipotong dan ada yang tidak. Menyebut keduanya dengan jelas membuat Anda dipercaya; mengatakan "semuanya penting" membuat Anda diabaikan.
- Risiko yang diterima harus punya pemilik bernama, tertulis. Orang teknis bukan pemilik risiko bisnis; ia penyedia informasinya.
- Rencana migrasi yang baik menghilangkan risiko terbesar lebih dulu, bukan mengerjakan yang paling mudah lebih dulu.
- Jawaban yang tidak defensif selalu berbentuk sama: akui yang benar dari pertanyaannya, lalu bawa ke angka.

---

## 6. Latihan: Lima Pertanyaan Tersulit

1. Pilih tiga barang dari daftar harga yang Anda **tolak** potong meski anggaran dipangkas 35%. Untuk masing-masing, susun perbandingan rupiah seperti format di §4.b, dan jelaskan kenapa dua di antaranya tetap Anda pertahankan walau bukan yang paling mahal.
2. "Kenapa harus dua koneksi internet? Yang sekarang jarang mati." Jawab dengan memakai bukti dari Babak 8, dan jelaskan mengapa kata "mati" dalam pertanyaan itu justru salah sasaran.
3. "Kalau kamu resign bulan depan, apa yang terjadi?" Jawab dengan jujur, lalu tunjukkan bagian mana dari pekerjaan Anda di Babak 1-8 yang memang dirancang untuk menjawab pertanyaan ini.
4. "Kita sudah bayar antivirus dan firewall bertahun-tahun. Kenapa masih kena?" Jelaskan tanpa menyalahkan pendahulu dan tanpa istilah teknis, dengan memakai analogi yang tepat, lalu sebutkan apa yang sebenarnya dibeli dengan anggaran baru.
5. "Kamu minta Rp 2,47 miliar dan tidak bisa menjamin tidak akan ada gangguan lagi. Jadi saya beli apa?" Jawab dengan angka nyata dari proyek ini, dan rumuskan apa sebenarnya yang dijual oleh pekerjaan keandalan.

<details>
<summary>Jawaban</summary>

1. Tiga yang ditolak potong (contoh yang bisa dipertahankan; pilihan Anda boleh berbeda selama pembandingnya kuat):
   - **Server pengumpul data lokal di pabrik: Rp 45-90 juta.** Yang diminta: ditunda, cukup kirim langsung ke pusat. Risikonya: setiap gangguan WAN membuat bukti suhu bolong. Kemungkinan: tinggi, karena Babak 8 membuktikan jalur WAN bisa terdegradasi tanpa "mati", dan sudah terjadi dalam satu malam. Dampak: satu kontainer ditolak Rp 1,2 miliar, ditambah risiko temuan auditor. Perbandingan: menghemat Rp 90 juta untuk menanggung paparan Rp 1,2 miliar dengan peluang nyata setiap bulan. **Ini barang termurah dengan pencegahan risiko terbesar di seluruh daftar**, dan itulah alasan ia dipertahankan meski bukan yang paling mahal.
   - **Cadangan tak-bisa-ditimpa + salinan luar lokasi: Rp 150 juta.** Yang diminta: cukup pakai NAS yang sudah ada. Risikonya: insiden ransomware kedua menghapus data **dan** cadangannya sekaligus, karena keduanya di host yang sama dan salinannya selalu ditimpa (temuan Babak 1, Bukti D). Kemungkinan: sedang-tinggi, karena perusahaan ini **sudah pernah** kena sekali, dan Babak 8 Tiket 5 menunjukkan penyerang sudah berada di dalam sejak Juni. Dampak: kehilangan data keuangan dan ketertelusuran; biaya penghentian operasi berhari-hari jauh melebihi Rp 1 miliar, dan sebagian data mungkin tidak bisa dipulihkan dengan harga berapa pun. Perbandingan: Rp 150 juta melawan kelangsungan usaha. Dipertahankan walau tidak termahal karena **ia satu-satunya barang di daftar yang melindungi dari kejadian yang tidak bisa diperbaiki dengan uang setelahnya.**
   - **Pemantauan, AAA, dan vault rahasia (langganan): Rp 90 juta/tahun.** Yang diminta: dipotong karena "cuma grafik" dan karena OPEX. Risikonya: kembali ke keadaan Babak 8, ketika celah 73 menit baru ditemukan secara kebetulan; tanpa pemantauan, tidak ada satu pun perbaikan lain yang bisa dibuktikan bekerja, dan kegagalan menjadi senyap lagi. Dampak: bukan satu angka, tetapi **pengali** terhadap semua risiko lain, karena waktu deteksi menentukan besarnya kerusakan. Perbandingan: Rp 90 juta per tahun untuk mengubah waktu deteksi dari "kebetulan" menjadi lima menit. Ini yang paling sering dipotong dan paling mahal akibatnya, karena manfaatnya tidak terlihat sampai ia tidak ada.
   - Barang yang **boleh** dipotong atau ditunda sebagai penggantinya: jasa integrator (kerjakan lebih banyak sendiri, konsekuensinya lebih lambat), AP industri di ruang beku ketiga (tunda satu ruang, catat sebagai risiko), penyimpanan CCTV 50 TB penuh (turunkan laju data dan pakai retensi berjenjang sesuai Babak 5), firewall NGFW HA menjadi satu unit dulu dengan suku cadang siap pakai (turun dari 420 juta, dengan risiko waktu pulih lebih lama; risiko itu **harus** ditulis di risk register beserta pemiliknya), dan pelatihan ditunda satu kuartal. Yang tidak boleh diambil sebagai jalan hemat: mengurangi segmentasi OT, membatalkan proses perubahan, atau menghapus uji alarm. Ketiganya nol rupiah atau nyaris nol, jadi memotongnya tidak menghemat apa pun.

2. Jawabannya: *"Betul, jarang mati, dan justru itu masalahnya."* Pada malam Jumat lalu, koneksi utama kami **tidak mati sama sekali**; semua lampu di dasbor hijau dan tidak ada satu pun laporan gangguan dari operator. Tetapi selama lebih dari satu jam, 8 dari setiap 100 paket hilang: telepon antar-lokasi terdengar terpotong sehingga bagian penjualan tidak bisa menerima pesanan dengan jelas, dan sistem ERP melambat tanpa ada yang membuat tiket; orang hanya menganggapnya "hari ini lemot". Kami tidak berpindah ke jalur cadangan **karena sistem kami hanya bisa melihat mati atau hidup, bukan bagus atau buruk**, dan itu justru yang kami perbaiki. Jadi kata "mati" salah sasaran karena **kegagalan yang paling merugikan bisnis ini bukan kegagalan total, melainkan pemburukan yang tidak terlihat**: ia tidak memicu apa pun, tidak masuk laporan gangguan operator, tidak ada yang bisa kita tuntut, dan ia berlangsung berjam-jam. Jalur kedua bukan untuk hari ketika Telkom mati; untuk itu kita rela menunggu satu jam. Jalur kedua untuk hari ketika jalur pertama masih "hidup" tetapi tidak layak pakai, dan kita perlu tempat untuk pindah dalam hitungan detik. Tambahan yang biasanya menutup perdebatan: hitung nilainya, yaitu berapa nilai satu jam gangguan suara dan ERP di jam kerja bagi penjualan dan produksi, dibandingkan biaya langganan jalur kedua per bulan. Sebutkan juga bahwa jalur kedua sebaiknya dari operator dan jalur fisik berbeda, karena dua langganan yang melewati kabel yang sama bukan redundansi, melainkan dua tagihan.

3. Jawaban jujurnya: *"Kalau saya resign hari ini, jaringan tetap jalan. Tapi kalau saya resign hari ini **dan tidak ada yang saya tinggalkan**, orang berikutnya akan mengulang seluruh pekerjaan dari nol, persis seperti yang saya alami waktu masuk, karena semua pengetahuan ada di kepala orang dan di grup WhatsApp."* Lalu tunjukkan apa yang sudah dirancang untuk menjawab itu: **catatan keputusan arsitektur (ADR) dari Babak 2**, tempat setiap keputusan dicatat beserta konteks, alternatif yang ditolak, dan pemicu peninjauan, sehingga penerus tahu *kenapa*, bukan hanya *apa*; **rencana alamat dan penamaan yang terdokumentasi (Babak 3)** yang membuat orang baru bisa membaca alamat dan tahu itu lokasi mana; **matriks uji terima (Babak 4)** yang membuat penerus bisa memverifikasi keadaan tanpa mempercayai siapa pun; **konfigurasi sebagai kode dan inventory sebagai sumber kebenaran (Babak 7)** sehingga menambah lokasi tidak butuh ingatan saya, dan penyimpangan terdeteksi otomatis; **runbook dan postmortem (Babak 7-8)** yang mengubah pengalaman malam panjang menjadi prosedur yang bisa dijalankan orang lain pada jam 3 pagi; dan **akses terpusat dengan vault (Babak 7)** sehingga kepergian saya tidak membawa kredensial ke mana-mana. Tambahkan yang jujur juga: satu orang tetap **titik kegagalan tunggal** untuk pekerjaan yang butuh penilaian, jadi mitigasinya bukan hanya dokumentasi. Perlu satu orang lain yang dilatih untuk pekerjaan rutin (itulah pos pelatihan Rp 60 juta yang diminta dipotong), dan kontrak dukungan vendor untuk hal yang jarang. Bila pertanyaan ini datang dari CFO, ia sebenarnya menanyakan risiko ketergantungan. Jawaban terbaik adalah menunjukkan bahwa Anda **sudah** memperlakukannya sebagai risiko dan sedang menguranginya, bukan menjaminnya dengan janji akan bertahan lama.

4. Tanpa menyalahkan siapa pun: *"Yang kita beli selama ini adalah penjaga di pintu depan. Itu memang perlu, dan itu bekerja. Yang tidak kita punya adalah pintu-pintu di dalam."* Analoginya gudang tanpa sekat: ada penjaga di gerbang, tetapi begitu ada satu orang masuk (entah menyamar sebagai kontraktor, entah lewat barang yang dikirim masuk), ia bisa berjalan ke mana saja, termasuk ke ruang kendali mesin, dan tidak ada satu pun pintu yang menanyakan dia siapa. Antivirus memeriksa berkas yang datang; ia tidak tahu apa-apa ketika kamera pengawas yang kita beli sendiri, dengan kata sandi bawaan pabrik, mulai menelepon keluar setiap menit. Firewall memeriksa lalu lintas yang **melewati pintu depan**; ia tidak melihat apa pun yang terjadi antara perangkat di dalam gedung yang sama. Malam Jumat lalu kita melihat keduanya: perangkat di dalam yang berbicara ke luar, dan perangkat di dalam yang mencoba menyentuh mesin produksi. Keduanya tidak pernah melewati pintu depan. Yang dibeli dengan anggaran baru: **sekat-sekat di dalam** (setiap kelompok perangkat hanya bisa bicara dengan yang memang perlu), **daftar penghuni** (tidak ada perangkat asing bisa menyambung tanpa didaftarkan; inilah yang mencegah kejadian kontraktor terulang), dan **mata yang melihat ke dalam, bukan hanya ke pintu** (kita tahu dalam lima menit kalau ada yang tidak wajar, bukan dalam tiga bulan). Tutup tanpa menyalahkan: *"Yang dibangun dulu masuk akal untuk perusahaan yang jauh lebih kecil. Kita sekarang punya pabrik, dua puluh lokasi pesisir, dan sertifikasi ekspor. Kebutuhannya berubah, bukan keputusannya yang bodoh."*

5. Jawabannya dengan angka: *"Betul, saya tidak bisa menjanjikan tidak ada gangguan, dan siapa pun yang menjanjikan itu ke Bapak sedang berbohong. Yang saya jual tiga hal, dan ketiganya bisa diukur."* **(a) Gangguan lebih jarang:** hal-hal yang menyebabkan malam Jumat lalu (jaringan datar, perangkat asing bisa menyambung, kredensial seragam, konfigurasi hasil salin tangan) dihapus, bukan ditambal. **(b) Kerusakan lebih kecil ketika tetap terjadi:** malam itu satu kontraktor menancapkan satu kabel dan akibatnya terasa di seluruh pabrik sampai ke sistem kendali produksi; setelah sekat dibangun, kejadian yang sama berhenti di satu ruangan. **(c) Kita tahu jauh lebih cepat:** ini angka yang paling jelas. Bukti suhu dua ruang beku hilang **73 menit** dan kita hanya tahu karena saya kebetulan melihat layar; target setelah perbaikan adalah **5 menit**, dan itu akan **diuji setiap bulan** dengan sengaja mematikan satu sensor dan mencatat berapa lama alarm berbunyi. Bedanya dalam rupiah: celah 73 menit adalah celah yang harus dijelaskan ke auditor dan bisa menjatuhkan satu pengiriman senilai Rp 1,2 miliar; celah 5 menit berada di bawah ambang yang mereka persoalkan dan bisa langsung ditutup dengan pencatatan manual. Lalu rumuskan apa yang sebenarnya dijual: **pekerjaan keandalan tidak menjual ketiadaan masalah; ia menjual pengurangan frekuensi, pengurangan luas kerusakan, dan pemendekan waktu sampai kita tahu.** Itu tiga angka, dan ketiganya akan ada di laporan bulanan satu halaman yang Bapak terima, sehingga Bapak tidak perlu percaya pada saya; Bapak bisa memeriksa. Kalimat penutup yang jujur dan justru menambah kepercayaan: *"Kalau setelah enam bulan ketiga angka itu tidak membaik, Bapak berhak menuntut saya menjelaskan kenapa, dan itu memang seharusnya."*

</details>

---

## 7. Rubrik Babak 9 (100 poin)

| Aspek | Poin | Kriteria |
|---|---|---|
| Rincian anggaran berjenjang | 20 | P1 ≤ Rp 2,47 miliar, setiap baris menunjuk kebutuhan/ADR |
| Tiga penolakan dengan pembanding rupiah | 15 | Kemungkinan punya dasar, dampak dalam rupiah, kesimpulan tegas |
| Risk register | 20 | Setiap pemotongan muncul sebagai risiko, ada pemilik risiko bernama peran |
| Rencana migrasi | 20 | Risiko terbesar dulu, jendela disepakati, rollback teruji ≤ 30 menit, ada penyata lulus |
| Penjelasan lima kalimat & sepuluh slide | 15 | Tanpa jargon, pesan utama per slide jelas, tidak dibuka dengan topologi |
| Laporan bulanan satu halaman | 10 | Bisa dibuat dalam 20 menit, berisi SLO, insiden, waktu deteksi, risiko teratas |

---

## 8. Sumber

- `17-desain-arsitektur/03-perencanaan-dokumentasi.md`: rencana implementasi & dokumentasi
- `18-karier-sertifikasi/04-portofolio-interview.md`: menjelaskan pekerjaan teknis ke non-teknis
- `20.2` sampai `20.9`: seluruh bukti yang Anda pakai sebagai bahan argumentasi
- Google SRE Book: bab *Embracing Risk* (anggaran kesalahan sebagai bahasa bersama dengan bisnis)
- ISO/IEC 27005: kerangka penilaian risiko yang dipakai auditor

---

**Berikutnya:** `20-proyek-akhir/11-sidang-akhir-dan-penilaian.md`. Pertanyaan terakhir, penilaian total, dan apa yang Anda lakukan setelah ini.

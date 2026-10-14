# 20.6 — Babak 5: Udara & Gudang Beku

> **Prasyarat:** `20.5`, ditambah `02` (layer fisik & sinyal) dan `10` (wireless)
> **Tujuan:** Menghitung — bukan menebak — anggaran daya radio, jumlah titik akses, rencana kanal, dan kapasitas penyimpanan CCTV di lingkungan yang secara fisik memusuhi gelombang radio.

---

## 1. Bentuk Kerja Babak Ini

Babak ini **matematika dan fisika**. Tidak ada konfigurasi, tidak ada perdebatan desain. Hampir semua jawabannya berupa angka, dan angka bisa dicek.

Alasannya sederhana: nirkabel adalah satu-satunya bagian jaringan di mana **membeli perangkat lebih banyak sering memperburuk keadaan**. Tanpa hitungan, orang memasang AP sampai "sinyalnya penuh" lalu bingung kenapa terminal forklift tetap terputus.

⏱ Mode Ujian: 90 menit. Kalkulator wajib, tabel logaritma tidak perlu.

---

## 2. Kondisi Lapangan

### 2.1 Cold storage pabrik Surabaya

| Fakta | Nilai |
|---|---|
| Tiga ruang beku | masing-masing 40 m × 25 m, tinggi 9 m |
| Suhu operasi | **−25 °C**, kelembapan tinggi saat pintu dibuka |
| Isi | rak logam 8 tingkat penuh ikan beku (kandungan air tinggi) |
| Lorong | 4 lorong per ruang, lebar 3 m, panjang 40 m |
| Pengguna | 24 terminal forklift + 12 HT pemindai, berpindah terus |
| Sensor suhu | 40 titik per ruang (120 total), harus terkirim setiap ≤ 5 menit |
| Dinding | panel insulasi berinti logam (memantulkan dan meredam) |
| AP sekarang | 6 AP konsumer di koridor luar, dipasang tahun 2019 |
| Gejala | tiket T-881: "Wi-Fi hilang setiap kali forklift masuk lorong 3" |

### 2.2 Kantor HQ Jakarta

| Fakta | Nilai |
|---|---|
| 4 lantai | masing-masing ±1.200 m², partisi gipsum, beberapa dinding beton |
| Perangkat Wi-Fi karyawan | 400 sekarang (laptop + ponsel), rencana 800 |
| Wi-Fi tamu | 80 perangkat, hanya butuh internet |
| Ruang rapat | 4 ruang, video conference, 12–20 orang |
| AP sekarang | 4 AP konsumer, satu per lantai |

### 2.3 Perangkat yang akan dipakai (asumsi kasus)

| Parameter | Nilai |
|---|---|
| Daya pancar AP (conducted) | 17 dBm |
| Antena eksternal | 8 dBi (patch terarah) |
| Kabel koaksial | LMR-400, 6 m, redaman ±0,22 dB/m pada 5,5 GHz |
| Konektor | 2 buah, total 0,5 dB |
| Antena klien (terminal forklift) | 0 dBi |
| Derau dasar (kanal 20 MHz) | −92 dBm |
| Target RSSI untuk data andal | ≥ −67 dBm |
| Target SNR untuk MCS tinggi | ≥ 25 dB |
| Redaman satu rak penuh ikan beku | ±10 dB pada 5 GHz (asumsi kasus) |

⚠️ Angka regulasi daya dan alokasi kanal 5 GHz di Indonesia berubah dari waktu ke waktu. Untuk proyek ini, **setiap keputusan kanal dan daya wajib Anda sertai catatan "diverifikasi terhadap peraturan Kominfo yang berlaku"**, dengan rujukannya. Auditor akan menanyakan itu, dan menjawab "saya pakai angka dari tutorial" bukan jawaban.

---

## 3. Hitungan Wajib

Rumus yang Anda butuhkan hanya dua.

**Rugi ruang bebas (FSPL):**

```text
FSPL(dB) = 20·log10(d) + 20·log10(f) − 27,55        d dalam meter, f dalam MHz
```

**Anggaran daya:**

```text
EIRP(dBm)  = Daya pancar − rugi kabel − rugi konektor + penguatan antena
RSSI(dBm)  = EIRP − FSPL − rugi halangan + penguatan antena klien
SNR(dB)    = RSSI − derau dasar
```

Kerjakan tujuh hitungan ini dan catat hasilnya di `08-wlan.md`:

| # | Hitung | Petunjuk |
|---|---|---|
| H1 | EIRP sistem AP dengan kabel 6 m dan antena 8 dBi | Satu baris |
| H2 | FSPL pada 5,5 GHz untuk jarak 10, 15, 30, dan 60 m | Empat angka |
| H3 | FSPL pada 2,45 GHz untuk 30 m, lalu selisihnya terhadap 5,5 GHz | Jelaskan artinya |
| H4 | RSSI dan SNR di ujung lorong 40 m bila AP dipasang di koridor luar dan sinyal harus melewati **2 rak** | Bandingkan dengan target |
| H5 | RSSI dan SNR bila AP dipasang **di dalam lorong**, jarak terjauh 15 m, tanpa rak menghalangi | Bandingkan dengan H4 |
| H6 | Kebutuhan bandwidth agregat 64 kamera (rata-rata 2 Mbps, puncak 4 Mbps) | Dua angka |
| H7 | Penyimpanan CCTV: GB per kamera per hari, TB per hari untuk 64 kamera, TB untuk retensi 30 hari, dan **berapa hari** yang bisa ditampung NVR 7,3 TB | Empat angka |

---

## 4. Checksum Hitungan

Cocokkan setelah Anda menghitung sendiri. Toleransi ±0,3 dB dan ±2%.

| # | Besaran | Nilai |
|---|---|---|
| C1 | EIRP sistem AP | **23,2 dBm** |
| C2 | FSPL 5,5 GHz pada 15 m / 30 m / 60 m | **70,8 / 76,8 / 82,8 dB** |
| C3 | FSPL 2,45 GHz pada 30 m, dan selisihnya terhadap 5,5 GHz | **69,8 dB**, selisih **7,0 dB** |
| C4 | RSSI di 30 m tanpa halangan | **−53,6 dBm** |
| C5 | RSSI di 30 m dengan 2 rak (20 dB), dan SNR-nya | **−73,6 dBm**, SNR **18,4 dB** |
| C6 | Bandwidth agregat CCTV rata-rata / puncak | **128 / 256 Mbps** |
| C7 | Penyimpanan per kamera per hari | **21,6 GB** |
| C8 | 64 kamera per hari / retensi 30 hari | **1,38 TB/hari** / **41,5 TB** |
| C9 | Umur simpan NVR 7,3 TB | **±5,3 hari** |

💡 C9 adalah jawaban untuk tiket T-915 ("rekaman hanya 4 hari, kontrak bilang 30 hari"). Perhatikan: itu **bukan** kerusakan dan **bukan** kesalahan vendor CCTV — itu aritmetika yang tidak pernah dikerjakan siapa pun sebelum membeli. Setelah Anda menghitungnya, Anda punya tiga pilihan nyata, dan semuanya adalah keputusan bisnis. Tuliskan ketiganya beserta konsekuensinya.

---

## 5. Keputusan Desain yang Harus Diambil

Setiap keputusan wajib disertai angka atau alasan fisik.

**a. Letak dan jumlah AP cold storage.** Berapa AP per ruang, dipasang di mana, antena jenis apa, menghadap ke mana. Jawaban "di plafon, omni" harus Anda bantah sendiri dengan hitungan H4 — rak setinggi 8 tingkat berada di antara plafon dan pengguna.

**b. Cara bertahan di −25 °C.** Pilih salah satu dan pertahankan: AP kelas industri dengan rentang suhu yang sesuai di dalam ruang · AP di luar ruang beku dengan antena di dalam lewat kabel koaksial (hitung rugi kabelnya — sudah ada di H1) · enklosur berpemanas. Bahas juga kondensasi saat pintu dibuka dan apa yang terjadi pada konektor yang membeku lalu mencair setiap hari.

**c. Jumlah AP kantor HQ: kapasitas atau cakupan?** Hitung keduanya lalu ambil yang lebih besar:
- **Cakupan**: luas lantai ÷ luas efektif satu AP (pakai radius yang Anda dapat dari hitungan RSSI di lingkungan kantor).
- **Kapasitas**: jumlah perangkat ÷ target perangkat per radio (25–30 untuk beban campuran).
Yang mana yang menentukan di kasus HQ, dan apa akibatnya bila Anda hanya menghitung cakupan?

**d. Lebar kanal.** 20, 40, atau 80 MHz. Untuk gudang dengan 36 perangkat bergerak, dan untuk kantor dengan 800 perangkat — jawabannya bisa berbeda. Pertahankan dengan konsep jumlah kanal non-tumpang-tindih dan interferensi co-channel.

**e. Rencana kanal.** Buat tabel: AP, band, kanal, lebar, daya. Untuk 2,4 GHz hanya ada tiga kanal yang tidak bertumpuk — putuskan apakah 2,4 GHz dipakai sama sekali. Untuk 5 GHz, putuskan sikap Anda terhadap **DFS**: pabrik berada dekat pelabuhan dan bandar udara Surabaya, dan kejadian radar membuat AP harus meninggalkan kanal seketika. Apa akibatnya bagi terminal forklift yang sedang memindai barang?

**f. SSID dan pemetaan VLAN.** Berapa SSID, masing-masing ke VLAN mana, dengan autentikasi apa. Ingat Mbak Sari berkata "jangan pakai sertifikat, ribet" — dan Anda tetap harus mengamankan Wi-Fi karyawan. Putuskan dan siapkan argumennya.

**g. Perpindahan (roaming) untuk forklift.** Mekanisme apa yang Anda aktifkan, dan apa masalah "klien lengket" (perangkat yang bertahan di AP jauh dengan sinyal lemah). Hubungkan dengan hitungan: perangkat yang bertahan di MCS rendah **memakan waktu udara** jauh lebih banyak untuk data yang sama — jelaskan akibatnya pada 35 perangkat lain di ruang yang sama.

**h. Teknologi sensor suhu.** Buat matriks keputusan antara: Wi-Fi · LoRaWAN · gateway BLE · kabel (Ethernet/PoE atau bus industri). Kriteria wajib: daya tahan baterai pada −25 °C, daya tembus melewati rak logam dan dinding insulasi, apa yang terjadi bila jaringan mati, biaya per titik untuk 120 titik, dan **siapa yang merawatnya** mengingat tim BNS hanya tiga orang.

**i. Rencana survei tiga tahap.** Prediktif (di perangkat lunak, sebelum membeli) → AP-on-a-Stick (uji satu AP di lokasi nyata, dengan rak terisi penuh, bukan gudang kosong) → validasi pasca-pasang (berjalan dengan alat ukur, membuat peta panas, menguji perpindahan sambil bergerak). Tuliskan apa yang diukur di tiap tahap dan **kapan gudang harus dalam keadaan penuh** saat diukur.

---

## 6. Ringkasan

- Nirkabel adalah satu-satunya bagian jaringan yang bisa memburuk karena ditambah perangkat; hitungan menggantikan dugaan.
- Setiap kali frekuensi naik dua kali, rugi ruang bebas naik ±6 dB; 5,5 GHz kehilangan ±7 dB lebih banyak daripada 2,45 GHz pada jarak yang sama — dan itu sebelum menghitung rak berisi air beku.
- Rak logam penuh ikan beku bukan "sedikit menghalangi"; dua rak sudah cukup mengubah sinyal yang sangat baik menjadi tidak layak pakai.
- Jumlah AP kantor biasanya ditentukan kapasitas, bukan cakupan — dan yang hanya menghitung cakupan akan memasang terlalu sedikit.
- Kapasitas penyimpanan CCTV adalah aritmetika sederhana yang sering tidak dilakukan, lalu menjadi tiket helpdesk bertahun-tahun.
- Lingkungan fisik (suhu, kondensasi, ketinggian rak) menentukan pilihan perangkat lebih dulu daripada fitur perangkat lunaknya.

---

## 7. Latihan — Pembuktian Angka

1. Bandingkan H4 dan H5. Nyatakan dalam satu paragraf mengapa memindahkan AP dari koridor ke dalam lorong memberi perbaikan yang jauh lebih besar daripada menaikkan daya pancar AP sampai batas maksimum, dan hitung kira-kira berapa dB yang bisa Anda peroleh dari masing-masing tindakan.
2. Tiket T-881 mengatakan "Wi-Fi hilang setiap kali forklift masuk lorong 3". Berikan penjelasan fisik yang lengkap sampai ke mekanismenya, dan sebutkan satu pengukuran lapangan yang membuktikan penjelasan Anda benar.
3. Dari hitungan H7 dan C9, susun tiga pilihan nyata agar retensi 30 hari tercapai, lengkap dengan angka, dan tentukan mana yang Anda rekomendasikan untuk BNS beserta alasan kepatuhannya.
4. Terminal forklift memakai kanal DFS dan radar pelabuhan terdeteksi pukul 14:00. Jelaskan urutan kejadian dari sisi AP dan sisi klien, dampaknya pada pemindaian barang yang sedang berjalan, lalu tentukan sikap Anda terhadap DFS di pabrik dan di kantor HQ — dan kenapa jawabannya boleh berbeda.
5. Satu terminal tua hanya mendukung 802.11n 2,4 GHz dan selalu bekerja pada laju rendah. Jelaskan dengan konsep waktu udara mengapa satu perangkat ini dapat menurunkan kinerja 35 perangkat lain, perkirakan besaran dampaknya, dan sebutkan tiga cara menanganinya beserta akibat sampingnya.

<details>
<summary>Jawaban</summary>

1. Hasil hitungan: **H4** (AP di koridor, jarak 30 m, melewati 2 rak) memberi RSSI **−73,6 dBm** dan SNR **18,4 dB** — di bawah target RSSI −67 dBm dan jauh di bawah target SNR 25 dB, artinya perangkat akan turun ke MCS rendah, sering mengulang kirim, dan terputus saat ada pergerakan. **H5** (AP di dalam lorong, jarak terjauh 15 m, tanpa rak menghalangi) memberi RSSI ≈ 23,2 − 70,8 = **−47,6 dBm** dan SNR ≈ **44 dB** — sangat baik. Perbaikannya **±26 dB**, yang berasal dari dua sumber: menghilangkan 20 dB halangan rak dan mengurangi 6 dB rugi jarak (30 m → 15 m). Sebaliknya, menaikkan daya pancar hanya bisa memberi sekitar **3–6 dB** sebelum menabrak batas regulasi EIRP, dan itu pun membawa tiga kerugian: (a) tautan menjadi **tidak simetris** — AP terdengar oleh klien, tetapi daya pancar klien (terminal kecil, antena 0 dBi) tidak naik, sehingga arah balik tetap gagal; (b) sel menjadi lebih luas sehingga **interferensi co-channel** dan masalah klien lengket bertambah; (c) daya tidak mengubah SNR di sisi klien bila sumber derau ikut naik. Kesimpulan yang bisa dibawa ke kasus lain: **pada masalah nirkabel, geometri dan halangan hampir selalu memberi puluhan dB, sedangkan daya memberi beberapa dB.** Karena itu jawaban pertama untuk cakupan buruk adalah memindahkan atau menambah AP dan memilih antena yang tepat, bukan menaikkan daya.

2. Mekanismenya: sinyal dari AP di koridor mencapai lorong 3 lewat **satu jalur sempit** — celah antar-rak atau pantulan dari dinding logam — bukan lewat garis pandang. Sinyal seperti itu berada tepat di ambang batas (H4 menunjukkan −73,6 dBm, hanya beberapa dB di atas titik perangkat menyerah). Ketika forklift — massa logam besar setinggi 2–3 m dengan operator dan muatan — masuk ke lorong, ia **menghalangi satu-satunya jalur yang tersisa** dan sekaligus mengubah pola pantulan di ruang yang dipenuhi permukaan logam, sehingga terjadi pelemahan mendalam (fading) pada posisi tertentu. Ditambah lagi antena terminal berada **di badan forklift itu sendiri**, jadi tubuh forklift dan muatan ikut menghalangi arah ke AP. Karena RSSI sudah marginal, kehilangan 10–15 dB seketika membuat tautan gagal — bukan melambat, tetapi putus, lalu perangkat mencari AP lain dan tidak menemukan yang lebih baik. Pengukuran yang membuktikan: jalankan **ping berkelanjutan sambil berjalan** (`ping -i 0.2`) bersamaan dengan perekaman RSSI/SNR dari sisi klien atau alat survei, **dengan gudang dalam keadaan rak penuh**, sekali tanpa forklift dan sekali dengan forklift melintas di titik yang sama; bukti yang dicari adalah penurunan RSSI 10 dB atau lebih yang bertepatan waktu dengan lewatnya forklift, disertai kehilangan paket, pada titik-titik tertentu di lorong (bukan merata). Bukti pendukung: hitungan ulang percobaan perpindahan pada log AP di detik-detik yang sama. Hal yang **bukan** penjelasan: "interferensi dari mesin" saja — walau mungkin ada, ia tidak menjelaskan keterkaitan waktu yang tepat dengan lewatnya forklift.

3. Kebutuhan retensi 30 hari pada konfigurasi sekarang = **41,5 TB** (1,38 TB/hari), sedangkan NVR punya 7,3 TB yang hanya cukup **±5,3 hari**. Tiga pilihan nyata:
   - **Tambah kapasitas penyimpanan.** Butuh ±41,5 TB data ditambah margin pertumbuhan dan ruang bebas untuk kesehatan sistem berkas — rencanakan **±50 TB usable** (dan bila memakai RAID dengan redundansi, kapasitas mentahnya lebih besar lagi). Paling sederhana, tidak mengubah mutu bukti visual, tetapi paling mahal dan menambah beban jaringan tetap 128 Mbps rata-rata.
   - **Turunkan laju data per kamera.** Dari 2 Mbps menjadi 1 Mbps (turunkan fps dari 25 ke 12–15, atau naikkan kompresi/atur kualitas per zona) → kebutuhan menjadi 20,75 TB untuk 30 hari, sehingga ±25 TB usable sudah cukup. Konsekuensi: rekaman kurang mulus dan detail berkurang — dapat diterima untuk koridor, **tidak** dapat diterima untuk titik yang dipakai membuktikan penanganan produk.
   - **Rekam berbasis peristiwa dengan retensi berjenjang.** Rekaman terus-menerus disimpan 7 hari (9,7 TB), dan setelah itu hanya menyimpan segmen bertanda peristiwa (pintu dibuka, deteksi gerak, pemuatan kontainer) selama 30–90 hari. Kebutuhan turun drastis, tetapi menambah kompleksitas dan **risiko kepatuhan**: rekaman yang dibutuhkan auditor bisa terhapus bila aturan penandaan peristiwanya salah.
   - **Rekomendasi untuk BNS: gabungan pilihan kedua dan ketiga, dengan pengecualian eksplisit** — kamera di titik kritis rantai dingin (pintu cold storage, area pemuatan kontainer, ruang timbang) tetap 2 Mbps dan **retensi penuh 30 hari**, kamera lain diturunkan ke 1 Mbps dengan retensi berjenjang. Alasan kepatuhan: yang perlu dibuktikan kepada auditor bukan "semua sudut gudang selama 30 hari", melainkan **penanganan produk pada titik yang menentukan mutu**; jadi anggaran diarahkan ke titik yang menghasilkan bukti. Apa pun pilihannya, tuliskan **kebijakan retensi resmi** dan pantau kapasitas sebagai metrik dengan alarm — karena kegagalan senyap inilah yang membuat T-915 bertahan bertahun-tahun.

4. Urutan kejadiannya: AP yang bekerja pada kanal DFS wajib menjalankan deteksi radar terus-menerus. Saat pola radar terdeteksi, AP **harus** berhenti memancar di kanal itu dalam waktu yang ditentukan regulasi (ratusan milidetik), lalu pindah ke kanal lain dan **tidak boleh kembali** ke kanal tersebut selama periode tertentu (umumnya 30 menit). Dari sisi klien: koneksi hilang seketika tanpa peringatan; perangkat harus memindai ulang, menemukan AP di kanal baru, melakukan autentikasi dan asosiasi ulang (dan bila memakai 802.1X, autentikasi penuh lagi kecuali ada mekanisme percepatan). Untuk terminal forklift yang sedang memindai barang: sesi aplikasi terputus di tengah transaksi — pemindaian terakhir bisa hilang atau terkirim dua kali, operator harus mengulang, dan bila aplikasi tidak idempoten, data batch bisa ganda. Buruknya lagi, seluruh AP di ruang itu bisa terpengaruh bersamaan, sehingga tidak ada AP tetangga yang bisa dituju. **Sikap di pabrik: hindari kanal DFS** untuk SSID operasional (forklift, HT, sensor) dan pakai kanal non-DFS; bila jumlah kanal non-DFS tidak cukup, pilih lebar kanal 20 MHz untuk memperbanyak kanal, dan rancang agar kanal DFS hanya dipakai SSID yang tahan gangguan. **Sikap di HQ: DFS boleh dipakai** — kantor punya kebutuhan kapasitas tinggi sehingga tambahan kanal berharga, pengguna duduk dan aplikasinya tahan sambungan ulang sesaat, dan risiko radar di lokasi kantor umumnya lebih rendah. Jawaban berbeda karena **yang menentukan bukan tekniknya, melainkan apakah aplikasi di atasnya tahan terputus tiba-tiba** — dan itulah cara berpikir yang benar tentang pilihan kanal.

5. Konsepnya **waktu udara (airtime)**: satu kanal adalah medium bersama; hanya satu perangkat memancar pada satu waktu. Waktu yang dibutuhkan untuk mengirim sejumlah data berbanding terbalik dengan laju yang dipakai. Perangkat yang bekerja pada laju rendah memerlukan **puluhan kali lebih lama** untuk data yang sama — mengirim 1 MB pada laju efektif ±3 Mbps memakan sekitar 2,7 detik waktu udara, sementara perangkat modern pada laju efektif ±100 Mbps memakannya sekitar 0,08 detik, yaitu sekitar **30 kali lebih banyak**. Selama 2,7 detik itu, 35 perangkat lain menunggu. Dampaknya terasa sebagai "Wi-Fi lambat untuk semua orang" walau hanya satu perangkat yang bermasalah — dan pada 2,4 GHz efeknya lebih parah karena hanya ada tiga kanal, sehingga sel bertetangga ikut menanggung. Ditambah lagi, mekanisme perlindungan untuk perangkat lama memaksa perangkat baru memakai pembukaan kirim yang lebih boros, menurunkan efisiensi seluruh sel. Tiga cara menangani beserta akibat sampingnya:
   - **Ganti perangkatnya.** Paling bersih dan mengembalikan efisiensi sel; akibat sampingnya biaya dan waktu, serta aplikasi gudang harus diuji pada terminal baru.
   - **Pisahkan ke SSID/band tersendiri** (misalnya perangkat lama hanya di 2,4 GHz pada kanal yang dipisahkan, SSID operasional utama hanya 5 GHz). Melindungi perangkat modern; akibat sampingnya bertambahnya SSID (setiap SSID memakan waktu udara untuk beacon — jangan sampai membuat masalah baru), dan perangkat lama tetap lambat.
   - **Tetapkan laju data minimum dan matikan laju terendah** (menolak asosiasi atau memaksa perangkat mencari AP lebih dekat), disertai penyeimbangan waktu udara bila perangkatnya mendukung. Memaksa sel tetap efisien; akibat sampingnya perangkat lama atau perangkat di tepi cakupan bisa **tidak bisa terhubung sama sekali** — keputusan yang harus disetujui pemilik proses, bukan diambil diam-diam oleh orang jaringan.

</details>

---

## 8. Rubrik Babak 5 (110 poin)

| Aspek | Poin | Kriteria |
|---|---|---|
| Hitungan H1–H7 | 35 | Checksum C1–C9 cocok, langkah hitungan ditulis |
| Letak & jumlah AP cold storage | 15 | Dibenarkan oleh hitungan, bukan oleh kebiasaan |
| Penanganan lingkungan −25 °C & kondensasi | 10 | Pilihan teknis nyata beserta konsekuensi kabel/rugi daya |
| Jumlah AP HQ: kapasitas vs cakupan | 10 | Keduanya dihitung, yang menentukan diidentifikasi |
| Rencana kanal & sikap terhadap DFS | 15 | Tabel lengkap, beda sikap pabrik vs kantor beralasan, regulasi dicatat |
| SSID, VLAN, autentikasi, roaming | 10 | Konsisten dengan Babak 3 dan 4 |
| Matriks keputusan sensor suhu | 10 | Kriteria mencakup baterai di suhu rendah dan siapa yang merawat |
| Rencana survei tiga tahap | 5 | Menyebut pengukuran dengan gudang terisi penuh |

---

## 9. Sumber

- `00-fondasi/03-sinyal-bandwidth-latency.md` — dasar dB, sinyal, derau
- `10-wireless/01-rf-dasar.md` sampai `04-desain-wlan.md`
- `19-mikrotik/05-wireless-mikrotik.md` — bila memakai perangkat MikroTik untuk AP
- Peraturan Kominfo tentang penggunaan pita 2,4 GHz dan 5 GHz — **wajib diverifikasi sendiri, versi terbaru**
- IEEE 802.11 (khususnya 802.11k/v/r untuk perpindahan), dan dokumen DFS dari regulator
- *802.11 Wireless Networks: The Definitive Guide* (Matthew Gast) — bab lapisan fisik

---

**Berikutnya:** `20-proyek-akhir/07-babak-6-tim-merah-tim-biru.md` — sepuluh serangan nyata, Anda yang harus bertahan.

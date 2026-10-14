# 20.1 — Briefing: Proyek Akhir Rantai Dingin

> **Prasyarat:** Seluruh modul `00`–`19` dan lab `00`–`06`
> **Tujuan:** Memahami aturan main proyek akhir, menggali kebutuhan nyata dari dokumen bisnis yang berantakan, dan menyiapkan berkas kerja sebelum masuk Babak 1.

---

<figure class="fig-img"><a href="/img/capstone-sampul.png" target="_blank" rel="noreferrer"><img src="/img/capstone-sampul.png" alt="Sampul proyek akhir: Rantai Dingin PT Bahari Nusantara Segar" loading="lazy"></a><figcaption>Seri ilustrasi proyek akhir — arsitektur situs, topologi lab, alur babak, dan garis waktu insiden.</figcaption></figure>

## 1. Kenapa Bukan Ujian Pilihan Ganda

Anda sudah punya `referensi/soal-latihan.md` untuk menguji hafalan. Babak ini menguji hal lain: **apakah Anda bisa memakai semuanya sekaligus, pada masalah yang tidak memberi tahu jawabannya.**

Perbedaannya penting:

| Ujian biasa | Proyek akhir ini |
|---|---|
| Soal menyebut topiknya ("hitung subnet...") | Anda sendiri yang memutuskan ini soal subnetting, QoS, atau kebijakan |
| Satu jawaban benar | Banyak jawaban sah, tapi setiap keputusan harus bisa dipertahankan |
| Data lengkap dan bersih | Data bertentangan, ada yang bohong, ada yang hilang |
| Selesai dalam 2 menit | Selesai dalam 3–6 minggu kerja santai |
| Lupa seminggu kemudian | Jadi portofolio yang bisa ditunjukkan saat wawancara |

💡 Ukuran keberhasilan sebenarnya: setelah selesai, Anda bisa menjelaskan **kenapa** setiap angka di desain Anda seperti itu — tanpa membuka catatan.

---

## 2. Dunia Cerita: PT Bahari Nusantara Segar

**PT Bahari Nusantara Segar (BNS)** mengolah dan mengekspor hasil laut beku. Ikan dikumpulkan dari titik pengumpulan di pesisir, dibekukan di pabrik Surabaya, lalu diekspor ke Jepang dan Uni Eropa.

Bisnisnya bergantung pada satu hal yang mudah dilupakan orang IT: **rantai dingin tidak boleh terputus, dan buktinya harus berupa data.**

<figure class="fig-img"><a href="/img/capstone-peta-situs.png" target="_blank" rel="noreferrer"><img src="/img/capstone-peta-situs.png" alt="Peta situs dan aliran data PT Bahari Nusantara Segar" loading="lazy"></a><figcaption>Tiga situs utama, 12→20 TPI di balik CGNAT, dan layanan awan. Klik untuk memperbesar.</figcaption></figure>

**Angka bisnis yang perlu Anda ingat sepanjang proyek:**

| Fakta | Nilai |
|---|---|
| Ekspor | ±40 kontainer/bulan |
| Kerugian satu kontainer ditolak | ±Rp 1,2 miliar + risiko pencabutan nomor approval ekspor |
| Aturan suhu | Produk inti ≤ −18 °C; rekaman suhu **kontinu**; celah data > 15 menit wajib dijelaskan ke auditor |
| Anggaran CAPEX yang diajukan | Rp 3,8 miliar |
| OPEX sekarang | Rp 180 juta/bulan |
| Tim | **Anda** (satu-satunya network engineer), 2 IT support, tanpa tim keamanan |
| Rencana | +2 depo dan TPI menjadi 20 titik dalam 24 bulan; audit ISO 27001 tahun depan |

---

## 3. Berkas Masuk

Ini semua bahan yang Anda punya. Sengaja tidak rapi — persis seperti di pekerjaan nyata.

### 3.1 Email dari CTO

> **Dari:** hendra.p@bns.co.id
> **Subjek:** Perbaikan jaringan — mulai sekarang kamu yang pegang
>
> Selamat bergabung. Tiga hal yang membuat saya tidak bisa tidur:
>
> Pertama, bulan lalu satu kontainer ke Osaka hampir ditolak karena log suhu bolong 40 menit. Kata IT, "switch-nya di-restart". Saya tidak mau dengar alasan itu lagi.
>
> Kedua, kita kena ransomware di bagian keuangan tahun lalu. Untung file server produksi tidak ikut. Auditor ISO akan datang tahun depan dan saya yakin kita gagal.
>
> Ketiga, vendor menawarkan paket Rp 900 juta "semua beres". CFO suka angkanya. Saya minta kamu baca proposalnya dan beri saya penilaian jujur, bukan penilaian yang menyenangkan.
>
> Saya tidak paham teknis. Jelaskan ke saya dengan bahasa yang bisa saya pakai di rapat direksi.

### 3.2 Notulen Rapat Kickoff (kutipan)

- **Bu Ratna (COO Produksi):** "Jangan ada yang menyentuh jaringan pabrik saat jam produksi. Tahun lalu ganti switch, lini berhenti 6 jam, kerugian Rp 400 juta. Kalau mau ubah, malam Sabtu, dan harus bisa dikembalikan dalam 30 menit."
- **Pak Dedi (CFO):** "Vendor bilang cukup Rp 900 juta. Kamu minta 3,8 miliar. Yakinkan saya, atau saya potong."
- **Mbak Sari (IT Support):** "Password semua perangkat sama. Kalau dibedakan kami lupa, terus tidak bisa masuk saat malam. Dan tolong jangan pakai sertifikat, ribet."
- **Pak Ir. Tanaka (vendor mesin pembeku, Jepang):** "Kami butuh akses jarak jauh permanen ke PLC untuk garansi. Biasanya klien memasang TeamViewer di komputer HMI."
- **Auditor ekspor (pihak ketiga):** "Kami butuh akses baca ke data ketertelusuran per batch, dari kapal sampai kontainer."
- **Pak Hendra (CTO):** "Target: ISO 27001 tahun depan. Anggap itu kebutuhan, bukan keinginan."

### 3.3 Lima Tiket Helpdesk Terakhir

| # | Tiket | Status |
|---|---|---|
| T-881 | "Wi-Fi di cold storage hilang setiap kali forklift masuk lorong 3" | Dibiarkan, "sudah dari dulu" |
| T-902 | "Tablet TPI-04 minta login ulang berkali-kali, kadang gagal kirim data 2 jam" | Ditutup: "sinyal LTE lemah" |
| T-915 | "Rekaman CCTV pabrik hanya bertahan 4 hari, padahal kontrak bilang 30 hari" | Diteruskan ke vendor CCTV |
| T-930 | "Setiap Senin 09:00–10:00 ERP lambat sekali" | Ditutup: "jam sibuk, normal" |
| T-944 | "Printer label timbangan ganti IP sendiri, label tercetak dengan kode batch salah" | Dibiarkan, "dicabut-pasang saja" |

💡 Empat dari lima tiket ini punya akar masalah yang akan Anda temukan sendiri di Babak 1 dan Babak 8. Jangan diagnosa sekarang — catat saja.

### 3.4 Inventaris Warisan

| Lokasi | Yang terpasang | Catatan |
|---|---|---|
| JKT-HQ | 2× switch L3 (bisa dikelola), 6× switch akses, 1× router internet, 4× AP konsumer | VLAN hanya untuk tamu; sisanya satu segmen datar |
| JKT-DC | 3 host hypervisor, 1 NAS, switch 10G tunggal | NAS menyimpan backup **dan** menjadi target backup |
| SBY-PLANT | 1 router internet, 9× switch **tidak bisa dikelola** bertumpuk, 6× AP konsumer, 1 NVR | Seluruh pabrik `192.168.1.0/24` datar — PLC, CCTV, staf, tamu, sensor suhu, semuanya |
| MKS-DEPO | Router ISP bawaan, 2× switch tidak bisa dikelola | Tidak ada dokumentasi |
| TPI (12) | MikroTik hAP + modem LTE, 1 tablet, 1 timbangan, 2 sensor suhu | Konfigurasi hasil salin-tempel dari TPI-01, semua sama termasuk nama |
| Semua | Kredensial `admin` / `Bahari2019!` | Tidak ada NTP, tidak ada syslog terpusat, tidak ada cadangan konfigurasi |

### 3.5 Yang Tidak Ada di Berkas Mana Pun

Ini bagian yang paling sering dilewatkan pemula: **daftar hal yang harus Anda tanyakan.** Contoh: berapa lama produksi boleh berhenti? Data sensor suhu disimpan di mana dan berapa lama? Siapa yang menerima alarm pada jam 2 malam? Apakah TPI punya listrik stabil?

Bagian dari nilai Anda adalah menuliskan **daftar pertanyaan terbuka** dan asumsi yang Anda ambil karena jawabannya belum ada.

---

## 4. Aturan Main

**Tiga mode. Pilih satu, tulis pilihan Anda di jurnal.**

| Mode | Cara | Untuk siapa |
|---|---|---|
| **Santai** | Boleh buka semua modul, tanpa batas waktu. Target 3–6 minggu. | Baru selesai kurikulum, ingin memantapkan |
| **Ujian** | Hanya boleh buka `referensi/` (cheatsheet, tabel subnetting, daftar port). Tiap babak punya batas waktu. | Persiapan CCNA/MTCNA atau wawancara kerja |
| **Kilat** | Tanpa catatan sama sekali, hanya Babak 1, 3, 8, dan sidang akhir. Satu hari penuh. | Menguji kesiapan wawancara teknis |

**Aturan yang berlaku di semua mode:**

1. **Kunci jawaban dibuka terakhir.** Tulis jawaban Anda dulu — di berkas, bukan di kepala. Jawaban yang "sudah kebayang di kepala" selalu terasa benar.
2. **Setiap keputusan wajib punya alasan yang menunjuk kebutuhan.** Format: *"Saya pilih X karena kebutuhan Y; konsekuensinya Z; alternatif yang saya tolak W karena …"*
3. **Angka harus dihitung, bukan dikira.** Setiap bandwidth, jumlah AP, ukuran subnet, dan kapasitas penyimpanan harus ada perhitungannya.
4. **Boleh salah, tidak boleh mengarang.** Kalau Anda tidak tahu, tulis "tidak tahu — perlu diverifikasi dengan …". Auditor lebih menghargai itu daripada karangan.
5. **Yang bisa dijalankan, jalankan.** Konfigurasi harus diuji di lab (Containerlab / GNS3 / EVE-NG / Packet Tracer / mesin virtual Linux), bukan hanya ditulis.
6. **Simpan di Git.** Satu commit per babak, minimal. Riwayat kerja adalah bagian dari portofolio.

⚠️ Satu larangan keras: **jangan minta model bahasa membuatkan desainnya lalu Anda tempel.** Babak ini mengukur isi kepala Anda. Memakai AI untuk memeriksa hasil kerja sendiri, mencari dokumentasi, atau berdebat — silakan.

---

## 5. Sembilan Babak, Sembilan Bentuk Kerja

Babak ini sengaja tidak seragam. Pekerjaan network engineer memang tidak seragam.

<figure class="fig-img"><a href="/img/capstone-alur-babak.png" target="_blank" rel="noreferrer"><img src="/img/capstone-alur-babak.png" alt="Sembilan babak proyek akhir dan bentuk kerjanya masing-masing" loading="lazy"></a><figcaption>Sembilan babak, sembilan bentuk kerja berbeda — total 1230 poin.</figcaption></figure>

| Babak | Bentuk kerja | Yang diuji | Modul | Poin |
|---|---|---|---|---|
| **1** Audit Warisan | Forensik: bedah konfigurasi & keluaran perintah yang salah | Ketelitian, prioritisasi, L2/L3, keamanan dasar | 02–04, 09, 12, 13, 19 | 120 |
| **2** Sidang Arsitektur | Jadi juri: nilai 3 proposal vendor, lalu buat desain sendiri | Desain, trade-off, argumentasi | 17, 11, 16 | 130 |
| **3** Teka-teki Alamat | Puzzle presisi dengan verifikasi mandiri | Subnetting, VLSM, ringkasan rute, IPv6 | 04, 08 | 130 |
| **4** Bangun di Lab | Kerja tangan + matriks uji terima PASS/FAIL | Konfigurasi nyata, VLAN, routing, FHRP, verifikasi | 03, 04, 07, 13, 19 | 150 |
| **5** Udara & Gudang Beku | Hitungan fisika RF & kapasitas | Wireless, kapasitas, keterbatasan fisik | 02, 10 | 110 |
| **6** Tim Merah vs Tim Biru | Adversarial: diserang, Anda bertahan | Keamanan per layer, deteksi, Zero Trust | 09, 12, 03, 06 | 130 |
| **7** Kode yang Menjaga | Menulis kode & berkas yang benar-benar jalan | Otomasi, observability, SLO | 15, 14 | 120 |
| **8** Malam Panjang | Simulasi jaga malam bercabang, dikejar waktu | Troubleshooting metodis, tekanan, keputusan | 14, semua | 140 |
| **9** Ruang Rapat | Bisnis: anggaran dipotong, jelaskan ke non-teknis | Komunikasi, risiko, rencana migrasi | 17, 18 | 100 |
| **Sidang** | Tanya jawab lisan + mengajar | Kedalaman pemahaman | Semua | 100 |

Total **1230 poin**. Ambang lulus dibahas di `20.11`.

💡 Urutan babak boleh diubah, **kecuali** Babak 1 (harus pertama, karena temuannya dipakai babak lain) dan Sidang (harus terakhir).

---

## 6. Yang Harus Ada di Akhir (Deliverable)

Satu repositori, struktur seperti ini:

```
proyek-bns/
├── 00-jurnal.md                  ← catatan harian: keputusan, kebingungan, waktu
├── 01-kebutuhan.md               D1  kebutuhan, batasan, asumsi, pertanyaan terbuka
├── 02-temuan-audit.md            D2  temuan Babak 1 + prioritas + risiko
├── 03-keputusan-arsitektur.md    D3  ADR: satu keputusan per bagian
├── 04-topologi/                  D4  diagram L1, L2, L3, aliran data
├── 05-alamat.md                  D5  rencana IPv4 + IPv6 + VLAN + penamaan + DNS
├── 06-konfigurasi/               D6  config per perangkat (cisco/, mikrotik/, linux/)
├── 07-uji-terima.md              D7  matriks uji: ID, langkah, harapan, hasil
├── 08-wlan.md                    D8  desain nirkabel + perhitungan + rencana survei
├── 09-keamanan.md                D9  matriks zona, aturan firewall, hardening, akses vendor
├── 10-observability.md           D10 metrik, SLO, alarm, runbook, uji alarm
├── 11-otomasi/                   D11 inventory, template, playbook, skrip audit, CI
├── 12-migrasi.md                 D12 rencana cutover, jendela, rollback, risk register
├── 13-postmortem.md              D13 laporan insiden Babak 8
└── 14-presentasi.md              D14 10 slide + ringkasan 1 halaman untuk direksi
```

Bikin kerangkanya **sekarang**, kosong. Mengisi berkas yang sudah ada jauh lebih mudah daripada memulai dari nol saat sudah lelah.

---

## 7. Empat Cara Menilai Diri Sendiri

Masalah belajar mandiri: tidak ada yang mengoreksi. Proyek ini memakai empat mekanisme berbeda supaya Anda tidak bisa menipu diri.

| Mekanisme | Cara kerja | Dipakai di |
|---|---|---|
| **Kunci jawaban beralasan** | Bukan cuma jawabannya, tapi kenapa. Kalau jawaban Anda beda tapi alasannya kuat, itu tetap sah. | Semua babak |
| **Checksum** | Hasil hitungan Anda dijumlahkan; kalau totalnya cocok dengan angka yang diberikan, hitungan Anda hampir pasti benar — tanpa melihat jawaban. | Babak 3, 5 |
| **Uji terima** | Perintah nyata di lab yang hasilnya PASS atau FAIL. Tidak bisa didebat. | Babak 4, 7 |
| **Ajari orang lain** | Jelaskan ke orang yang tidak paham jaringan dalam 5 menit. Kalau dia bingung, Anda belum paham. | Babak 9, Sidang |

⚠️ Mekanisme paling keras adalah yang terakhir. Banyak orang bisa mengonfigurasi OSPF tapi tidak bisa menjelaskan kenapa OSPF, bukan RIP, untuk kasus ini. Yang kedua itulah yang ditanya saat wawancara.

---

## 8. Kesalahan Umum Peserta

❌ **Mulai dari teknologi.** "Saya mau pakai VXLAN" sebelum tahu berapa host per situs. Mulai dari kebutuhan, selalu.
❌ **Mendesain untuk jaringan impian.** Ini perusahaan dengan satu engineer dan tanpa tim keamanan. Desain yang butuh 5 orang untuk dirawat adalah desain yang gagal.
❌ **Melewati Babak 1.** Semua yang "sudah dari dulu" adalah bom waktu, dan Babak 8 akan meledakkannya.
❌ **Menulis konfigurasi tanpa menguji.** Konfigurasi yang belum pernah dijalankan adalah karangan.
❌ **Mengabaikan sisi bisnis.** Desain paling benar yang ditolak CFO bernilai nol.
❌ **Mengerjakan semuanya dalam satu duduk.** Kelelahan menghasilkan keputusan buruk yang tidak Anda sadari. Satu babak, satu sesi.

---

## 9. Ringkasan

- Proyek ini satu kasus berkelanjutan: **PT Bahari Nusantara Segar**, perusahaan ekspor hasil laut beku dengan rantai dingin yang wajib terpantau.
- Sembilan babak, masing-masing bentuk kerjanya berbeda: forensik, penjurian, puzzle, kerja lab, hitungan RF, adversarial, menulis kode, simulasi jaga malam, dan rapat direksi.
- Dokumen masuk sengaja bertentangan. Menggali kebutuhan dari kekacauan adalah bagian dari ujian.
- Empat mekanisme penilaian diri: kunci beralasan, checksum, uji terima PASS/FAIL, dan menjelaskan ke orang lain.
- Keluaran akhir adalah satu repositori berisi 14 dokumen — sekaligus portofolio.

---

## 10. Latihan — Membaca Kebutuhan

Jawab di `01-kebutuhan.md` sebelum membuka kunci. Semua jawabannya ada di berkas masuk di atas.

1. Dari semua kalimat stakeholder di §3.2, mana yang sebenarnya **bukan kebutuhan melainkan solusi yang sudah dipilih orang lain**? Apa kebutuhan asli di baliknya, dan kenapa membedakan keduanya penting?
2. Sebutkan dua pasang kebutuhan yang **saling bertentangan** di kasus ini, dan tentukan mana yang harus menang beserta alasan bisnisnya.
3. Ubah kalimat "rantai dingin tidak boleh terputus" menjadi **kebutuhan yang bisa diuji** — lengkap dengan angka, cara mengukur, dan konsekuensi bila dilanggar.
4. Tiket T-944 ("printer label ganti IP sendiri, label tercetak dengan kode batch salah") kelihatannya masalah kecil. Naikkan tiket ini menjadi **risiko bisnis** dan perkirakan dampak terburuknya.
5. Permintaan vendor Jepang di §3.2 adalah risiko keamanan terbesar dalam berkas ini. Jelaskan kenapa, lalu rumuskan kebutuhan pengganti yang tetap memenuhi kepentingan sah vendor.

<details>
<summary>Jawaban</summary>

1. Yang paling jelas: **"Kami biasanya memasang TeamViewer di komputer HMI"** (Pak Tanaka) dan **"password semua perangkat sama"** (Mbak Sari) — keduanya solusi, bukan kebutuhan. Kebutuhan asli Tanaka: *"teknisi kami harus bisa mendiagnosis dan memperbarui PLC dari Jepang, kalau tidak garansi hangus."* Kebutuhan asli Sari: *"tim support harus bisa masuk ke perangkat apa pun pada jam 2 malam tanpa bergantung ingatan."* Memisahkan keduanya penting karena **kebutuhan biasanya punya banyak solusi, sedangkan solusi orang lain biasanya solusi yang paling nyaman bagi dirinya, bukan yang paling aman bagi Anda.** Setelah kebutuhannya jelas, Anda bisa menawarkan jump host dengan MFA dan rekaman sesi (memenuhi Tanaka) serta password manager dengan vault bersama plus akses AAA terpusat (memenuhi Sari) — keduanya memenuhi kebutuhan tanpa memasang pintu belakang permanen ke jaringan produksi. Ciri khas "solusi yang menyelinap sebagai kebutuhan": kalimatnya menyebut merek, produk, atau protokol tertentu.

2. Pasangan yang bertentangan, misalnya:
   - **"Jangan sentuh jaringan pabrik" (Bu Ratna) versus "pabrik harus disegmentasi dan dipantau" (kepatuhan + keamanan).** Yang menang: segmentasi harus dilakukan — tetapi cara Bu Ratna yang menang, bukan keberatannya. Artinya: perubahan bertahap di jendela malam Sabtu, setiap langkah bisa dikembalikan dalam 30 menit, ada uji terima sebelum jam produksi. Alasan bisnis: satu kontainer ditolak (Rp 1,2 miliar) lebih besar daripada risiko downtime terkendali, dan jaringan pabrik yang datar adalah penyebab paling mungkin dari log suhu yang bolong.
   - **"Rp 900 juta cukup" (CFO) versus "audit ISO 27001 tahun depan" (CTO).** Yang menang: kepatuhan, tetapi harus dibuktikan dengan angka. Paket murah yang tidak menyediakan segmentasi, log terpusat, dan kontrol akses akan membuat audit gagal; biaya gagal audit dan risiko kehilangan nomor approval ekspor jauh melebihi selisih anggaran. Cara menangnya bukan berdebat soal teknologi, tapi membandingkan rupiah lawan rupiah (dipakai di Babak 9).
   - Pasangan lain yang sah: **"jangan pakai sertifikat, ribet"** lawan **kebutuhan autentikasi kuat (802.1X, VPN, TLS)**; dan **auditor butuh akses ke data** lawan **prinsip hak akses minimum**.

3. Contoh kebutuhan yang bisa diuji: **"Suhu setiap ruang beku dan setiap kontainer aktif terekam minimal satu kali per 5 menit, dengan penanda waktu tersinkronisasi NTP; celah data maksimum 10 menit (di bawah batas auditor 15 menit); data tersimpan di dua lokasi terpisah dengan retensi 24 bulan; alarm sampai ke petugas jaga dalam ≤ 5 menit setelah data berhenti masuk atau suhu melewati −18 °C; ketersediaan jalur pengukuran-ke-penyimpanan 99,9% per bulan 24/7."** Cara mengukur: kueri gap terpanjang per hari dari basis data suhu; uji alarm terjadwal (matikan satu sensor dengan sengaja, catat waktu sampai alarm berbunyi); laporan bulanan ketersediaan. Konsekuensi pelanggaran: temuan auditor, penolakan kontainer, potensi pencabutan nomor approval. Kunci jawaban ini: kebutuhan yang tidak punya **angka, cara ukur, dan konsekuensi** tidak bisa diuji, jadi tidak bisa dipakai membenarkan anggaran maupun desain.

4. T-944 bukan masalah printer, tapi **masalah integritas data ketertelusuran**. Rantai sebabnya: jaringan datar tanpa DHCP yang dikelola (atau dengan alamat statis yang tumpang tindih) membuat printer label berganti alamat; sistem timbangan mengirim data batch ke alamat IP, bukan ke nama; ketika alamat berpindah, label tercetak dengan kode batch milik pengiriman lain. Dampak terburuk: **kontainer ekspor membawa label batch yang tidak sesuai isinya.** Saat auditor atau otoritas pangan negara tujuan melakukan penelusuran balik, ketertelusuran terbukti tidak dapat diandalkan — konsekuensinya bukan satu kontainer ditolak, tetapi **seluruh sistem ketertelusuran perusahaan dipertanyakan** (penahanan pengiriman, penarikan produk, audit ulang, sampai pencabutan izin ekspor). Nilai risikonya jauh di atas biaya memperbaiki DHCP dan resolusi nama. Pelajarannya: tiket yang tampak sepele harus dinilai dari **data apa yang salah karenanya**, bukan dari perangkat apa yang rusak.

5. Permintaan akses jarak jauh permanen ke PLC berbahaya karena menggabungkan lima hal terburuk sekaligus: **(a)** akses dari internet **langsung ke zona paling kritis** (sistem kendali produksi); **(b)** memakai perangkat lunak akses jarak jauh yang membuat terowongan keluar sehingga menembus firewall dari dalam dan sulit diawasi; **(c)** dipasang di komputer HMI — yang justru tidak bisa ditambal karena terikat sertifikasi mesin; **(d)** **permanen**, padahal kebutuhannya sesekali; **(e)** milik pihak ketiga, sehingga kredensial dan keamanan perangkat teknisi di luar kendali Anda. PLC dengan protokol tanpa autentikasi (misalnya Modbus) berarti siapa pun yang mencapai jaringan itu dapat mengubah setpoint suhu — yaitu tepat cara merusak bisnis BNS. Kebutuhan pengganti: *"Teknisi vendor dapat mendiagnosis dan memperbarui PLC dari jarak jauh, dengan jejak audit, tanpa jalur permanen ke zona produksi."* Wujudnya: akses hanya lewat **jump host / bastion** di zona DMZ industri, VPN dengan MFA per orang (bukan akun bersama), **dibuka atas permintaan dan otomatis tertutup** (time-bound, disetujui operator pabrik), hanya ke alamat dan port tertentu, **sesi direkam**, dan semua tindakan dicatat. Bila vendor menolak, itu keputusan bisnis yang harus diambil manajemen dengan risiko tertulis — bukan keputusan yang diam-diam diambil oleh orang jaringan.

</details>

---

## 11. Sumber

- `17-desain-arsitektur/01-03` — metodologi desain, hierarki, dokumentasi
- `18-karier-sertifikasi/04-portofolio-interview.md` — cara memakai hasil proyek ini saat wawancara
- *Top-Down Network Design* (Priscilla Oppenheimer) — bab penggalian kebutuhan
- ISO/IEC 27001:2022 Annex A — untuk memahami apa yang dicari auditor
- Codex Alimentarius / prinsip HACCP — latar belakang kewajiban rekaman suhu

---

**Berikutnya:** `20-proyek-akhir/02-babak-1-audit-warisan.md` — bedah konfigurasi warisan BNS dan temukan bom waktunya.

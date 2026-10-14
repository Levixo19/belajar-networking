# 20.11 — Sidang Akhir & Penilaian

> **Prasyarat:** `20.1`–`20.10` selesai, semua deliverable ada di repositori
> **Tujuan:** Menguji kedalaman pemahaman lewat tanya jawab dan mengajar, menghitung nilai total secara jujur, lalu menentukan apa yang harus Anda ulang dan apa yang harus Anda kerjakan selanjutnya.

---

## 1. Bentuk Kerja Babak Ini

Dua bagian yang tidak bisa diakali:

**Sidang (60 poin).** Empat puluh pertanyaan. Tidak ada satu pun yang menanyakan definisi. Semuanya menanyakan **kenapa keputusan Anda seperti itu** — dan jawaban yang benar untuk desain orang lain akan salah untuk desain Anda.

**Mengajar (40 poin).** Tiga topik, masing-masing 15 menit, dijelaskan ke orang yang tidak paham jaringan. Ini alat ukur paling keras yang ada: pemahaman yang tidak utuh selalu bocor saat dijelaskan ke orang lain.

**Cara menjalankan sidang tanpa penguji:** rekam suara Anda menjawab, satu pertanyaan satu rekaman, **tanpa membuka catatan dan tanpa berhenti**. Batas 2 menit per pertanyaan. Dengarkan kembali besoknya dan nilai sendiri — jeda panjang, kalimat berputar, dan "pokoknya" adalah tanda pemahaman berlubang. Kalau ada teman atau atasan yang bersedia, jauh lebih baik: minta ia bertanya balik setiap kali jawaban Anda terdengar hafalan.

⚠️ Aturan yang paling penting di seluruh proyek ini: **jawaban "saya tidak tahu, tetapi begini cara saya mencarinya" bernilai penuh.** Yang bernilai nol adalah karangan yang terdengar yakin. Dalam pekerjaan nyata, orang yang mengarang lebih berbahaya daripada orang yang tidak tahu.

---

## 2. Empat Puluh Pertanyaan Sidang

### Kelompok A — Lapisan 1 & 2 (fisik dan data link)

1. Di pabrik Anda mengganti switch tak terkelola dengan yang terkelola. Sebutkan tiga hal yang **baru bisa** Anda lakukan setelah penggantian itu, dan satu hal yang tetap tidak bisa Anda lakukan.
2. Tunjukkan di desain Anda, port mana yang boleh menjadi trunk dan kenapa port lainnya tidak — lalu jelaskan apa yang terjadi bila satu port akses berubah menjadi trunk tanpa Anda ketahui.
3. Anda memilih native VLAN tertentu untuk trunk. Sebutkan angkanya dan jelaskan kenapa angka itu, lalu jelaskan apa yang rusak bila kedua ujung trunk memakai native VLAN berbeda.
4. Kenapa STP masih penting di jaringan yang sudah Anda rancang tanpa loop? Jawab dengan menyebut satu kejadian dari Babak 8.
5. Terminal forklift berpindah antar-AP sambil bergerak. Jelaskan apa yang terjadi di lapisan 2 saat perpindahan itu, dan mengapa VLAN yang sama harus tersedia di semua AP di area itu.

### Kelompok B — Lapisan 3 (alamat dan rute)

6. Tunjuk satu subnet di rencana Anda dan jelaskan kenapa prefixnya bukan satu tingkat lebih besar dan bukan satu tingkat lebih kecil.
7. Kenapa blok TPI Anda bisa diringkas sementara seluruh blok korporat tidak? Jelaskan dari sifat bilangan binernya.
8. Kalau mitra tiba-tiba melepaskan `10.66.0.0/16`, apa yang berubah pada tabel rute Anda dan berapa prefix yang jadi Anda iklankan?
9. Jelaskan apa yang dilakukan router di pabrik terhadap paket dari VLAN sensor menuju pengumpul lokal — langkah demi langkah, termasuk keputusan yang tidak melibatkan routing.
10. Kenapa Anda memilih protokol routing yang Anda pilih, dan pada skala berapa pilihan itu akan berhenti tepat?

### Kelompok C — Lapisan 4 sampai 7

11. Kenapa masalah WAN di Babak 8 Tiket 3 terdengar di VoIP tetapi tidak terlihat di ERP? Jelaskan dari sifat protokol transportnya.
12. Sensor mengirim lewat HTTPS. Sebutkan semua hal yang harus benar sebelum satu byte data suhu tersimpan — dan mana di antaranya yang paling sering salah di lapangan.
13. Kenapa jam yang salah bisa menghentikan pengiriman data padahal jaringannya sehat? Jelaskan rantai sebabnya sampai ke tiket T-902.
14. Jelaskan peran DNS internal di desain Anda, dan apa yang terjadi pada pengiriman data suhu bila resolver internal tidak bisa dijangkau dari TPI.
15. Kenapa MSS/MTU pada terowongan penting, dan kenapa gejalanya berupa "koneksi menggantung" bukan "tidak bisa terhubung"?

### Kelompok D — Keamanan

16. Tunjuk satu sel "diizinkan" di matriks zona Anda yang paling berisiko, jelaskan kenapa tetap Anda izinkan, dan kontrol apa yang mengurangi risikonya.
17. Kenapa 802.1X tidak menyelesaikan masalah keamanan zona OT? Apa yang menyelesaikannya?
18. Jelaskan perbedaan mendasar antara mencegah kode jahat dan mencegah perintah sah yang tidak berwenang — dan mana yang relevan untuk PLC pembeku.
19. Seseorang mengusulkan membuka satu port dari internet ke NVR agar vendor CCTV bisa memeriksa. Jawab usulan itu dalam tiga kalimat, dengan alternatif.
20. Bagaimana Anda tahu, bulan depan, bahwa kontrol keamanan yang Anda pasang masih aktif? Sebutkan mekanismenya, bukan niatnya.

### Kelompok E — Nirkabel dan fisik

21. Kenapa menaikkan daya pancar AP bukan jawaban untuk cakupan buruk di cold storage? Jawab dengan angka dari Babak 5.
22. Jelaskan kepada manajer gudang, tanpa istilah teknis, kenapa Wi-Fi di ruang beku lebih mahal daripada Wi-Fi di kantor.
23. Jumlah AP di HQ Anda ditentukan kapasitas atau cakupan? Buktikan dengan hitungan, dan jelaskan akibatnya bila yang lain yang dipakai.
24. Kenapa Anda memilih (atau menolak) kanal DFS di pabrik? Apa yang berubah bila jawabannya untuk kantor?
25. Satu perangkat lama menurunkan kinerja seluruh sel. Jelaskan mekanismenya, lalu jelaskan kenapa solusi paling efektif justru bisa membuat perangkat itu tidak bisa terhubung sama sekali.

### Kelompok F — Linux, otomasi, observability

26. Jelaskan arti idempoten dengan satu contoh dari playbook Anda sendiri yang hampir tidak idempoten.
27. Kenapa skrip audit Anda harus menganggap "tidak bisa dihubungi" sebagai temuan? Apa yang terjadi bila tidak?
28. Tunjukkan satu SLO Anda dan turunkan dari mana angkanya. Berapa anggaran kesalahannya per bulan dalam menit?
29. Kenapa alarm Anda memantau ketiadaan data, bukan nilai data? Jelaskan dengan kejadian Babak 8 Tiket 4.
30. Siapa yang memberi tahu Anda bila sistem pemantauan mati? Jelaskan mekanismenya dan kenapa ia harus berada di luar infrastruktur BNS.

### Kelompok G — Desain, WAN, cloud

31. Sebutkan satu keputusan arsitektur Anda yang akan Anda ubah bila jumlah pengguna HQ naik menjadi 600. Apa pemicu peninjauannya?
32. Kenapa data suhu tidak sepenuhnya dipindahkan ke cloud, padahal cloud lebih andal daripada server di pabrik? Jawab tanpa merendahkan cloud.
33. Jelaskan kenapa spine-leaf salah untuk BNS tetapi benar untuk perusahaan lain — dengan menyebut sifat lalu lintasnya.
34. Apa yang membuat dua langganan internet **bukan** redundansi? Bagaimana Anda memastikan milik BNS benar-benar redundan?
35. Bila BNS membuka depo keempat bulan depan, langkah apa saja yang Anda lakukan, dan berapa dari langkah itu yang sudah otomatis?

### Kelompok H — Operasional, risiko, komunikasi

36. Bukti suhu hilang 30 menit. Apa yang Anda lakukan dalam 10 menit pertama, dan apa yang tidak pernah Anda lakukan?
37. Siapa pemilik risiko untuk firewall tanpa pasangan HA setelah pemotongan anggaran? Kenapa bukan Anda?
38. Jelaskan ke CFO dalam dua kalimat apa yang dibeli dengan langganan pemantauan Rp 90 juta per tahun.
39. Sebutkan satu hal dalam desain Anda yang Anda **tidak yakin** benar, dan bagaimana Anda akan mengujinya dalam tiga bulan ke depan.
40. Apa kesalahan terbesar Anda selama proyek ini, dan apa yang berubah dalam cara Anda bekerja setelahnya?

### Ciri jawaban kuat dan lemah

| Kelompok | Ciri jawaban kuat | Ciri jawaban lemah |
|---|---|---|
| A–C | Menyebut perangkat, header, dan keputusan yang terjadi berurutan; tahu di mana sesuatu bisa gagal | Menyebut nama protokol tanpa mekanisme; "pokoknya dia mencari jalan terbaik" |
| D | Membedakan pencegahan dari deteksi; menyebut siapa yang berwenang | "Sudah ada firewall"; menyebut alat, bukan kontrol |
| E | Membawa angka dB dan hitungan kapasitas | "Sinyalnya kurang, tambah AP saja" |
| F | Menyebut cara membuktikan, bukan cara memasang | "Sudah dipantau kok"; tidak bisa menyebut ambang alarm |
| G | Menyebut pemicu peninjauan dan alternatif yang ditolak | Membela pilihan seolah tanpa kelemahan |
| H | Membedakan keputusan teknis dari keputusan bisnis; berani menyebut ketidaktahuan | Mengambil keputusan bisnis sendiri; tidak punya satu pun keraguan |

💡 Pertanyaan 39 dan 40 bernilai dua kali lipat dalam penilaian mengajar di §3. Orang yang tidak punya jawaban untuk keduanya biasanya belum benar-benar mengerjakan proyeknya, atau belum jujur pada dirinya.

---

## 3. Tantangan Mengajar

Tiga sesi, masing-masing 15 menit, kepada orang yang **tidak** paham jaringan (pasangan, teman, atau rekan non-IT). Rekam atau minta mereka menilai.

| # | Topik | Batasan | Yang diuji |
|---|---|---|---|
| M1 | Kenapa jaringan datar berbahaya, dan apa artinya "memberi sekat" | Tanpa kata VLAN, subnet, broadcast | Apakah Anda paham akibatnya, bukan mekanismenya |
| M2 | Kenapa bukti suhu bisa hilang padahal pendinginnya normal | Tanpa kata DHCP, alarm, protokol | Apakah Anda paham rantai ketergantungan |
| M3 | Kenapa jaringan yang "kelihatan hidup" bisa tidak layak pakai | Tanpa angka teknis, pakai analogi | Apakah Anda paham beda status dan kesehatan |

**Lulus bila pendengar bisa menjelaskan ulang inti sarinya dengan kalimatnya sendiri, dan bisa mengajukan satu pertanyaan lanjutan yang masuk akal.** Kalau ia hanya mengangguk, Anda belum lulus — anggukan biasanya tanda menyerah, bukan tanda mengerti.

---

## 4. Penilaian Total

| Babak | Bentuk kerja | Poin | Nilai Anda |
|---|---|---|---|
| 1 — Audit Warisan | Forensik | 120 | |
| 2 — Sidang Arsitektur | Penjurian & desain | 130 | |
| 3 — Teka-teki Alamat | Puzzle presisi | 130 | |
| 4 — Bangun di Lab | Kerja tangan & uji terima | 150 | |
| 5 — Udara & Gudang Beku | Hitungan RF & kapasitas | 110 | |
| 6 — Tim Merah vs Tim Biru | Adversarial | 130 | |
| 7 — Kode yang Menjaga | Menulis kode | 120 | |
| 8 — Malam Panjang | Simulasi insiden | 140 | |
| 9 — Ruang Rapat | Bisnis & komunikasi | 100 | |
| Sidang & Mengajar | Tanya jawab & pengajaran | 100 | |
| **Total** | | **1230** | |

### Tingkat pencapaian

| Nilai | Tingkat | Artinya |
|---|---|---|
| < 615 | **Belum siap** | Fondasinya ada, penerapannya belum. Ulangi babak dengan nilai terendah, bukan seluruhnya. |
| 615–799 | **Cukup** | Paham materi, masih butuh kedalaman pada penerapan dan pertahanan keputusan. |
| 800–999 | **Baik** | Setara siap bekerja sebagai network engineer dan lulus wawancara teknis menengah. |
| 1000–1129 | **Sangat baik** | Bisa memimpin proyek jaringan skala menengah dan mempertahankannya di depan manajemen. |
| ≥ 1130 | **Istimewa** | Sudah bekerja seperti arsitek. Pertimbangkan sertifikasi tingkat profesional dan mentoring orang lain. |

⚠️ **Dua syarat keras yang mengalahkan nilai total:**

- **Tidak ada babak di bawah 50% poinnya.** Nilai total 900 dengan Babak 3 hanya 40 poin berarti rencana alamat Anda tidak bisa dipakai — dan segalanya di atasnya rapuh. Ulangi babak itu.
- **Babak 8 minimal 70 poin.** Kalau Anda tidak bisa mendiagnosis gangguan, kemampuan mendesain tidak akan pernah terpakai di pekerjaan nyata. Ini syarat yang paling sering gagal dipenuhi orang dengan nilai desain tinggi.

---

## 5. Peta Perbaikan

Nilai rendah bukan hukuman, tapi peta. Cari babak terendah Anda, kerjakan kolom kanannya, lalu kerjakan **ulang babak itu** — bukan babak lain.

| Babak lemah | Kembali ke | Latihan tambahan |
|---|---|---|
| 1 — Audit | `03`, `09`, `12`, `13`, `19/03` | Ambil konfigurasi perangkat mana pun di internet, cari 20 cacat; bandingkan dengan CIS Benchmark |
| 2 — Arsitektur | `17` seluruhnya, `16`, `11` | Tulis 5 ADR untuk jaringan rumah/kantor Anda sendiri, termasuk alternatif yang ditolak |
| 3 — Alamat | `04/02`, `04/03`, `08/01-02` | 50 soal subnetting bertempo di `arena`, lalu rancang ulang alamat satu kantor fiktif dengan blok sempit |
| 4 — Lab | `lab/01`–`lab/06`, `03`, `07` | Ulangi lab 1–3 tanpa membuka panduan; tulis uji terimanya sendiri lebih dulu |
| 5 — Nirkabel | `02/03`, `10` seluruhnya | Hitung anggaran daya untuk 5 skenario berbeda; ukur RSSI rumah Anda sendiri dan bandingkan dengan hitungan |
| 6 — Keamanan | `12` seluruhnya, `09`, `03/03` | Buat matriks zona untuk kantor fiktif; petakan 10 teknik MITRE ke kontrol yang Anda punya |
| 7 — Otomasi | `15` seluruhnya, `14/03` | Otomatiskan satu tugas nyata milik Anda sendiri sampai idempoten dan berkode keluar benar |
| 8 — Insiden | `14/01`, `14/02`, `14/04` | Kerjakan ulang `14/04` dengan stopwatch; latih menulis hipotesis sebelum memeriksa |
| 9 — Ruang rapat | `17/03`, `18/04` | Jelaskan satu keputusan teknis ke orang non-IT tiap hari selama sepekan |
| Sidang | Babak dengan nilai terendah | Rekam diri menjawab 10 pertanyaan tiap hari; dengarkan kembali besoknya |

---

## 6. Setelah Lulus

**a. Jadikan portofolio.** Bersihkan repositori, buat `README.md` yang menjelaskan kasus dan hasilnya dalam 300 kata, dan sertakan satu diagram yang bisa dipahami tanpa penjelasan. Simpan di GitHub publik. Yang paling dilihat pewawancara bukan konfigurasinya — tapi **ADR dan postmortem**, karena keduanya menunjukkan cara Anda berpikir.

**b. Tiga baris untuk CV Anda.** Contoh yang bisa disesuaikan:

```text
Merancang ulang jaringan multi-lokasi (3 situs + 20 lokasi terpencil di balik CGNAT)
untuk perusahaan pengolahan pangan: segmentasi OT/IT, IPv4/IPv6 terencana,
terowongan hub-spoke, dan ketahanan lokal untuk kepatuhan rantai dingin.

Membangun otomasi konfigurasi (inventory → templat → playbook idempoten) dan audit
kepatuhan sebagai kode untuk 23 lokasi, menurunkan penyimpangan konfigurasi manual.

Merancang SLO dan alarm berbasis gejala untuk pemantauan suhu; memperpendek waktu
deteksi kegagalan pencatatan dari 73 menit menjadi target 5 menit dengan uji alarm bulanan.
```

⚠️ Tulis apa adanya: ini **proyek studi kasus**, bukan pekerjaan berbayar. Sebutkan begitu. Pewawancara menghargai proyek studi yang dikerjakan serius, dan langsung kehilangan kepercayaan pada kandidat yang membesar-besarkan.

**c. Peta ke sertifikasi.** Pekerjaan Anda di babak ini memetakan langsung ke:

| Babak | CCNA 200-301 | Network+ N10-009 | MikroTik |
|---|---|---|---|
| 1, 4 | Domain 1–2 (dasar & akses) | Domain 1–2 | MTCNA |
| 3 | Domain 1 (pengalamatan) | Domain 1 | MTCNA |
| 4 | Domain 3 (konektivitas IP) | Domain 2 | MTCRE |
| 5 | Domain 2 (nirkabel) | Domain 2 | MTCWE |
| 6 | Domain 5 (keamanan) | Domain 4 | MTCNA/MTCSE |
| 7 | Domain 6 (otomasi) | Domain 3 | MTCINE (sebagian) |
| 8 | Semua domain | Domain 5 (troubleshooting) | — |

Lanjutkan dengan `18-karier-sertifikasi/02-peta-ccna.md`, `03-peta-networkplus.md`, atau `05-peta-mikrotik.md` sesuai tujuan Anda.

**d. Sertifikat diri.** Isi dan simpan di repositori — bukan untuk ditunjukkan ke orang lain, tapi untuk Anda sendiri:

```text
PROYEK AKHIR — KURIKULUM JARINGAN
Kasus     : PT Bahari Nusantara Segar (rantai dingin multi-lokasi)
Nama      : ____________________
Mode      : Santai / Ujian / Kilat
Mulai     : ______________   Selesai : ______________
Nilai     : ______ / 1230  → tingkat: ______________
Babak terkuat  : ______________
Babak terlemah : ______________  → rencana perbaikan: ______________
Tiga hal yang saya tidak tahu sebelum proyek ini:
  1. ______________
  2. ______________
  3. ______________
Satu hal yang masih membuat saya tidak yakin: ______________
```

**e. Ulangi setahun kemudian.** Serius. Kerjakan lagi Babak 1, 3, dan 8 dua belas bulan dari sekarang tanpa melihat jawaban lama Anda, lalu bandingkan. Itu pengukuran pertumbuhan yang paling jujur yang bisa Anda lakukan pada diri sendiri.

---

## 7. Ringkasan

- Sidang tidak menguji hafalan; ia menguji apakah Anda bisa mempertahankan keputusan sendiri tanpa catatan.
- "Saya tidak tahu, begini cara saya mencarinya" adalah jawaban penuh nilai; karangan yang yakin bernilai nol.
- Mengajar adalah alat ukur paling keras: pemahaman berlubang selalu terlihat saat dijelaskan ke orang lain.
- Dua syarat keras mengalahkan nilai total — tidak ada babak di bawah setengah, dan kemampuan diagnosis tidak bisa ditukar dengan kemampuan desain.
- Nilai rendah adalah peta, bukan putusan: ulangi babak yang lemah, bukan seluruh proyek.
- Yang paling berharga dari seluruh proyek ini bukan desainnya — tetapi ADR, uji terima, dan postmortem, karena ketiganya memperlihatkan cara Anda berpikir.

---

## 8. Latihan — Lima Pertanyaan Penutup

1. Runut satu paket data suhu dari sensor di TPI-07 sampai tersimpan di basis data HQ. Sebutkan setiap perangkat yang dilewati, setiap perubahan pada paketnya, dan setiap titik yang bisa membuatnya gagal.
2. Sebutkan tiga keputusan dalam desain Anda yang akan berubah bila salah satu kebutuhan berubah: (a) semua TPI mendapat alamat publik tetap, (b) auditor menuntut retensi data suhu 7 tahun, (c) pabrik menambah 300 pekerja. Tunjukkan ADR mana yang sudah mengantisipasinya.
3. Bila Anda harus menghapus satu babak dari proyek ini karena keterbatasan waktu, mana yang Anda hapus dan apa yang hilang karenanya? Jawaban ini menguji apakah Anda memahami peran tiap babak.
4. Setelah semua ini, apa yang masih **tidak** Anda ketahui? Sebutkan tiga hal konkret dan bagaimana Anda akan mempelajarinya.
5. Ajari seorang junior dalam lima menit: kenapa jaringan datar berbahaya — tanpa memakai kata VLAN, subnet, atau broadcast. Tulis naskahnya.

<details>
<summary>Jawaban</summary>

1. Perjalanannya (angka contoh mengikuti rencana Babak 3; sesuaikan dengan rencana Anda):
   - **Pengukuran & penanda waktu.** Sensor `10.72.4.68` di VLAN 70 mengambil sampel suhu dan memberinya penanda waktu dari jam lokalnya, yang tersinkronisasi ke router TPI sebagai server NTP setempat. *Titik gagal:* baterai sensor melemah di suhu rendah; sensor mati; jam salah sehingga seluruh sampel setelahnya cacat sebagai bukti.
   - **Hop pertama ke pengumpul lokal.** Sensor menyusun paket ke pengumpul `10.72.4.66` — satu subnet, jadi tidak ada routing: sensor mencari MAC tujuan lewat ARP, membentuk bingkai Ethernet/802.11, dan mengirimkannya. Bila nirkabel: bingkai 802.11 ke AP, AP menerjemahkan ke Ethernet dan memberi tag VLAN 70. *Titik gagal:* sinyal radio; kolam DHCP habis sehingga sensor tak punya alamat (Tiket 4); ARP diracuni; port salah VLAN.
   - **Penyanggaan.** Pengumpul lokal menulis sampel ke disk **sebelum** mengirim, supaya data selamat bila jalur mati atau listrik padam. *Titik gagal:* disk penuh; proses pengumpul berhenti; antrean tidak tahan mati listrik.
   - **Resolusi nama.** Pengumpul harus mengubah nama pengumpul pusat menjadi alamat lewat resolver internal (yang dijangkau melalui terowongan). *Titik gagal:* resolver tak terjangkau — karena itu perlu resolver cadangan atau pemetaan tetap sebagai jaring pengaman, kalau tidak data macet walau jaringan hidup.
   - **Keputusan routing di TPI.** Paket `10.72.4.66 → 10.64.50.22:443` dikirim ke gateway `10.72.4.1` (ARP lagi, bingkai baru). Router memeriksa tabel rute: tujuan cocok dengan prefix yang diarahkan ke antarmuka WireGuard. Sebelum itu, aturan firewall rantai *forward* memutuskan paket ini boleh lewat — hanya sensor ke pengumpul, bukan ke mana-mana. *Titik gagal:* aturan firewall salah; rute tidak ada; paket dari zona lain ikut lewat.
   - **Enkapsulasi terowongan.** Paket asli dienkripsi dan dibungkus menjadi UDP menuju alamat publik hub, port terowongan. Alamat sumber luar adalah alamat privat dari operator seluler. Aturan MSS clamp menyesuaikan ukuran segmen pada paket SYN agar tidak melebihi MTU jalur. *Titik gagal:* MTU/MSS tidak disesuaikan → koneksi menggantung pada paket besar (tiket T-902); kunci tidak cocok; `allowed-address` tidak memuat prefix tujuan.
   - **Menembus CGNAT.** Gerbang NAT operator menerjemahkan alamat dan port sumber, lalu **menyimpan pemetaan** yang hanya hidup selama ada lalu lintas. Keepalive berkala dari sisi TPI menjaga pemetaan itu. *Titik gagal:* keepalive tidak diset → terowongan mati setelah pemeliharaan operator (Tiket 1); operator mengubah kebijakan NAT.
   - **Masuk ke HQ.** Firewall tepi HQ mengizinkan UDP terowongan menuju hub. Hub mendekripsi, **memverifikasi bahwa alamat sumber di dalam paket memang milik peer itu** (penolakan pemalsuan), dan mengeluarkan paket aslinya. *Titik gagal:* hub tunggal tanpa pasangan → 20 TPI kehilangan jalur sekaligus; aturan tepi salah; verifikasi sumber terlalu longgar sehingga satu TPI yang dikuasai bisa menyamar sebagai TPI lain.
   - **Routing internal HQ.** Paket diarahkan ke zona server; firewall antar-zona mengizinkan hanya TPI → pengumpul pada port aplikasi. Di lapisan 2 terakhir: SVI, ARP, switch, port server. *Titik gagal:* aturan antar-zona terlalu longgar atau terlalu ketat; rute balik tidak simetris sehingga firewall stateful menjatuhkan jawabannya.
   - **Lapisan aplikasi.** TLS dibangun (butuh jam benar dan sertifikat sah di **kedua** sisi), lokasi diautentikasi dengan kredensial per situs, data ditulis ke basis data secara idempoten sehingga pengiriman ulang tidak menggandakan catatan, dan data dengan penanda waktu masa lalu diterima sebagai penyusulan. Setelah pusat mengonfirmasi, pengumpul lokal baru menghapus dari antrean. *Titik gagal:* sertifikat kedaluwarsa; jam salah; penyusulan ditolak sehingga data hilang walau sudah sampai; basis data penuh; konfirmasi tidak dipakai sehingga data terhapus sebelum benar-benar tersimpan.
   - **Pengawasan.** Metrik "usia sampel terakhir per sensor" dihitung terus; alarm berbunyi bila tidak ada sampel melebihi ambang; SLO kelengkapan dilaporkan bulanan. *Titik gagal:* aturan alarm memantau nilai bukan ketiadaan nilai (Tiket 4); pemantauan mati tanpa ada yang tahu — karena itu perlu pengawas mati di luar infrastruktur.
   - Inti jawaban ini: **jalurnya panjang, dan hampir setiap langkah punya cara gagal sendiri yang tidak terlihat dari langkah lain.** Kemampuan menyebutkan rantai ini dari ingatan adalah tanda paling kuat bahwa Anda memahami jaringan sebagai sistem, bukan sebagai kumpulan perangkat.

2. Tiga perubahan kebutuhan dan akibatnya:
   - **(a) Semua TPI mendapat alamat publik tetap.** Yang berubah: arah pembentukan terowongan tidak lagi wajib dari TPI, sehingga hub bisa memulai koneksi dan pemulihan setelah gangguan bisa lebih cepat; keepalive tidak lagi menjadi syarat hidup-mati; dan pemantauan dari pusat bisa langsung menjangkau perangkat TPI. Tetapi **konsekuensi baru muncul**: perangkat TPI menjadi terlihat dari internet, sehingga aturan masuk harus diperketat, dan permukaan serangan bertambah — yang sebelumnya "dilindungi oleh CGNAT" secara kebetulan. Keputusan yang saya ubah: pola terowongan (jadi bisa dua arah), kebijakan firewall masuk per situs, dan cara pemantauan menjangkau perangkat. Yang **tidak** saya ubah: keepalive tetap dipertahankan (murah, dan melindungi bila alamat berubah lagi). ADR yang mengantisipasi: ADR pola terowongan TPI, dengan pemicu peninjauan "bila jalur WAN TPI berubah jenis atau mendapat alamat publik".
   - **(b) Retensi data suhu 7 tahun.** Yang berubah: perhitungan kapasitas penyimpanan dan strategi arsip. Data sensor bervolume kecil, jadi masalahnya bukan ruang — masalahnya **keterbacaan jangka panjang** (format data, kemampuan memulihkan dari media lama), **keutuhan** (bukti harus bisa dibuktikan tidak diubah, sehingga perlu penyimpanan tak-bisa-ditimpa dan tanda tangan/ringkasan kriptografis), dan **kepatuhan data pribadi** (bila data terkait orang, retensi panjang berbenturan dengan prinsip minimalisasi UU PDP — jadi pisahkan data suhu dari data pribadi). Keputusan yang saya ubah: ADR letak penyimpanan data suhu dan ADR strategi cadangan, ditambah kebijakan arsip dan uji pemulihan arsip tahunan. Yang tidak berubah: pengumpul lokal dan ketahanan lokal — kebutuhan itu tidak bergantung retensi.
   - **(c) Pabrik menambah 300 pekerja.** Yang berubah: kapasitas akses dan nirkabel (jumlah port, jumlah AP berbasis kapasitas — bukan cakupan), ukuran subnet VLAN staf dan Wi-Fi (di sini ruang tumbuh 100% dari Babak 3 diuji: cukup atau tidak), kapasitas uplink dan titik keluar internet, dan kemungkinan lapisan distribution terpisah bila jumlah switch akses melampaui yang bisa dilayani sepasang inti. Keputusan yang saya ubah: ADR topologi pabrik (pemicu peninjauannya memang "bila pengguna melampaui X"), ADR rencana alamat untuk VLAN staf, dan ADR desain WLAN. Yang tidak berubah: segmentasi OT dan rantai dingin — keduanya tidak tergantung jumlah pekerja kantor.
   - Pola jawaban yang kuat: setiap perubahan kebutuhan ditelusuri ke **ADR tertentu beserta pemicu peninjauannya**. Bila Anda tidak bisa menunjuk ADR-nya, berarti dokumen Anda tidak berfungsi sebagai alat, hanya sebagai laporan.

3. Tidak ada jawaban tunggal, tetapi ada jawaban yang menunjukkan pemahaman peran tiap babak. **Yang paling bisa dihapus: Babak 5 (nirkabel)** — ia paling berdiri sendiri; menghapusnya tidak membuat babak lain runtuh, dan keterampilannya bisa dilatih terpisah. Yang hilang: kemampuan menghitung sebelum membeli, dan pemahaman bahwa lingkungan fisik menentukan pilihan teknologi. Kandidat kedua: **Babak 9 (ruang rapat)**, dengan konsekuensi lebih besar daripada yang disadari orang teknis — tanpa itu, seluruh desain tetap berupa dokumen yang tidak dibiayai. **Yang tidak boleh dihapus:** Babak 1 (karena semua babak lain memakai temuannya, dan tanpa audit Anda mendesain untuk jaringan yang tidak ada), Babak 3 (karena Babak 4 dan 7 dibangun di atasnya — rencana alamat yang salah membuat semuanya harus dikerjakan ulang), dan Babak 8 (karena ia satu-satunya yang menguji apakah semua pekerjaan sebelumnya benar-benar bertahan saat dihantam kenyataan, dan ia mengungkap akar yang tidak pernah terlihat dari sisi desain). Jawaban yang lemah: "Babak 8, karena itu kan cuma simulasi" — itu tanda Anda melihat troubleshooting sebagai pekerjaan kelas dua, dan justru itu yang akan Anda kerjakan 70% waktu.

4. Yang dinilai di sini bukan isi jawabannya, tetapi **kejujuran dan ketepatannya**. Ciri jawaban kuat: tiga hal yang **konkret dan bisa diuji**, masing-masing dengan cara belajar yang nyata. Contoh jawaban kuat: *"(a) Saya belum pernah menangani BGP dengan dua penyedia di produksi; saya hanya mengerti konsepnya — saya akan melatihnya di lab dengan dua AS simulasi dan membaca panduan operasional penyaringan rute. (b) Saya belum pernah melakukan survei RF dengan alat ukur sungguhan, jadi hitungan saya di Babak 5 belum pernah saya bandingkan dengan pengukuran lapangan — saya akan meminjam atau menyewa alat dan mengukur satu gudang nyata. (c) Saya tidak tahu seberapa berbeda perilaku perangkat OT sungguhan dari simulasi saya; saya akan mencari kesempatan mendampingi teknisi otomasi industri satu hari."* Ciri jawaban lemah: "saya masih perlu banyak belajar" (tidak konkret), atau daftar teknologi bermerek tanpa kaitan dengan pekerjaan yang baru saja dilakukan, atau — yang paling mengkhawatirkan — **"sepertinya sudah cukup paham semua"**. Setelah proyek sebesar ini, seseorang yang tidak bisa menyebutkan tiga lubang dalam pengetahuannya sendiri belum memeriksa pekerjaannya dengan cukup keras.

5. Contoh naskah (sesuaikan dengan gaya Anda; yang dinilai adalah tidak adanya jargon dan adanya akibat yang terasa):
   > *"Bayangkan gudang besar tanpa satu pun sekat. Satu ruangan raksasa: di situ ada meja kantor, ada mesin pembeku, ada kamera pengawas, ada alat pengukur suhu yang jadi bukti ekspor kita, dan ada kursi tamu — semuanya dalam satu ruangan yang sama, tanpa pintu di antaranya.*
   >
   > *Selama semuanya tertib, tidak terasa masalah. Masalahnya muncul waktu ada satu hal yang salah. Kalau ada satu orang berteriak, semua orang di ruangan itu terganggu — bukan hanya yang dekat dia. Kalau ada satu tamu yang niatnya tidak baik, dia tidak perlu membuka pintu apa pun untuk sampai ke mesin pembeku, karena tidak ada pintu. Dan kalau ada barang baru dimasukkan tanpa izin, dia langsung mengambil tempat yang sebenarnya milik alat pengukur suhu kita — lalu alat itu berhenti bekerja dan kita tidak punya bukti suhu malam itu.*
   >
   > *Ketiga hal itu benar-benar terjadi di pabrik kita bulan ini, dalam satu malam yang sama.*
   >
   > *Yang kami kerjakan sekarang adalah memasang sekat dan pintu di dalam gudang itu. Bukan mengganti gudangnya, dan bukan menambah penjaga di gerbang depan — gerbang depan sudah ada penjaganya. Yang belum ada adalah pintu di dalam: setiap kelompok punya ruangnya sendiri, dan hanya bisa bicara dengan ruangan yang memang perlu. Kalau nanti ada masalah lagi, masalahnya berhenti di satu ruangan, bukan menyebar ke seluruh gudang.*
   >
   > *Dan satu lagi: kami pasang tanda yang berbunyi kalau alat pengukur suhu berhenti mengirim. Selama ini kami hanya punya tanda yang berbunyi kalau suhunya terlalu panas — jadi kalau alatnya diam saja, tidak ada yang berbunyi. Itu yang membuat kami baru tahu setelah lebih dari satu jam."*
   >
   > Ciri naskah yang lulus: pendengar bisa menceritakan ulang dengan kalimat sendiri, dan mengajukan pertanyaan lanjutan yang masuk akal — misalnya *"kalau disekat, apa jadi lebih repot kalau mau mengubah sesuatu?"* Itu pertanyaan bagus, dan jawabannya jujur: ya, sedikit lebih repot, dan itu harganya.

</details>

---

## 9. Sumber

- Seluruh kurikulum `00`–`19` — babak ini adalah ujiannya
- `18-karier-sertifikasi/02-peta-ccna.md`, `03-peta-networkplus.md`, `05-peta-mikrotik.md`
- `18-karier-sertifikasi/04-portofolio-interview.md` — cara menyajikan hasil proyek ini
- `referensi/soal-latihan.md` — untuk latihan hafalan yang tetap perlu menjelang ujian sertifikasi

---

**Berikutnya:** Tidak ada modul berikutnya. Yang berikutnya adalah pekerjaan nyata — atau ujian sertifikasi yang sudah Anda petakan di `18-karier-sertifikasi`. Simpan repositori proyek Anda; setahun dari sekarang, kerjakan ulang Babak 1, 3, dan 8 dan lihat sendiri seberapa jauh Anda berpindah.

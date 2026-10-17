# 14.1 Metodologi Troubleshooting

> **Prasyarat:** `01-model-referensi/01` (OSI sebagai kerangka), pemahaman seluruh tahap sebelumnya
> **Tujuan:** Anda punya pendekatan sistematis untuk memecahkan masalah jaringan apa pun, bukan menebak-nebak.

> > [!NOTE]
> > **Ini modul terpenting untuk pekerjaan nyata.** Yang membedakan teknisi senior dari junior adalah cara berpikirnya saat menghadapi masalah, bukan hafalan perintah.

---

## 1. Kenapa Metodologi Penting

```
PENDEKATAN BURUK (menebak):
  "Coba restart routernya"
  "Coba ganti kabelnya"
  "Coba matikan firewall"
  → kadang berhasil, sering memperburuk, tidak belajar apa-apa,
    tidak bisa mencegah kambuh

PENDEKATAN SISTEMATIS:
  Definisikan masalah → kumpulkan info → hipotesis →
  uji → terapkan → verifikasi → dokumentasi
  → konsisten, dapat diulang, mengajar, mencegah kambuh
```

> [!WARNING]
> **"Restart saja" sering menyembunyikan akar masalah** yang akan kambuh, sekaligus menghapus bukti (log, state) yang Anda butuhkan untuk memahaminya. Restart adalah pilihan terakhir, bukan pertama, kecuali dalam keadaan darurat produksi.

---

## 2. Metodologi CompTIA 7 Langkah

Kerangka standar yang diuji di Network+ dan berlaku universal.

```
1. IDENTIFIKASI masalah
   - Kumpulkan informasi
   - Tanyakan pengguna (apa yang terjadi, kapan mulai, apa yang berubah)
   - Identifikasi gejala
   - Tentukan apakah ada beberapa masalah

2. Buat TEORI kemungkinan penyebab (hipotesis)
   - Mulai dari yang paling mungkin / paling mudah diperiksa
   - Pertimbangkan pendekatan OSI (atas-bawah, bawah-atas, divide)
   - "Kalau ragu, curigai yang sudah pasti" — apa yang baru berubah?

3. UJI teori untuk menentukan penyebab
   - Kalau teori terkonfirmasi → lanjut ke langkah 4
   - Kalau tidak → buat teori baru atau eskalasi

4. Buat RENCANA aksi dan identifikasi dampak potensial
   - Apa yang akan Anda ubah? Apa risikonya? Bagaimana rollback?

5. IMPLEMENTASIKAN solusi (atau eskalasi)

6. VERIFIKASI fungsionalitas penuh
   - Pastikan benar-benar selesai, bukan sekadar gejala hilang
   - Terapkan tindakan preventif kalau mungkin

7. DOKUMENTASIKAN temuan, tindakan, dan hasil
```

> [!TIP]
> **Langkah 1 (identifikasi) dan 7 (dokumentasi) paling sering dilewati**, padahal keduanya paling penting. Identifikasi yang buruk membuang waktu berjam-jam; dokumentasi yang buruk membuat masalah yang sama diselesaikan berulang kali dari nol.

---

## 3. Tiga Pendekatan OSI

Setelah punya kerangka umum, gunakan model OSI untuk mengarahkan pencarian.

### Bottom-Up (dari Layer 1 naik)

```
L1 → kabel, lampu link, SFP, sinyal
L2 → VLAN, MAC, STP, duplex
L3 → IP, subnet, gateway, routing
L4 → port, firewall
L7 → aplikasi, DNS, sertifikat
```

**Kapan:** tidak ada konektivitas sama sekali, instalasi baru, setelah perubahan fisik.
**Kelebihan:** menyeluruh, tidak melewatkan masalah fondasi.
**Kekurangan:** lambat kalau masalahnya jelas di layer atas.

### Top-Down (dari Layer 7 turun)

```
L7 → aplikasi lain jalan? cek log aplikasi
L4 → bisa buka koneksi ke port?
L3 → bisa ping IP? traceroute berhenti di mana?
L2 → di VLAN yang benar?
L1 → (jarang sampai sini)
```

**Kapan:** sebagian besar berfungsi, hanya satu aplikasi bermasalah.
**Kelebihan:** cepat kalau masalahnya di aplikasi.
**Kekurangan:** membuang waktu kalau ternyata masalah fondasi.

### Divide-and-Conquer (mulai dari tengah)

```
Mulai dari L3 (ping) — layer paling informatif
├── ping berhasil → naik ke L4/L7
└── ping gagal → turun ke L1/L2
```

**Kapan:** pengalaman menyarankan titik awal tertentu; ini yang paling sering dipakai praktisi berpengalaman.

> [!TIP]
> **Praktisi berpengalaman biasanya memakai divide-and-conquer** dengan intuisi tentang di mana memulai, tetapi selalu siap kembali ke bottom-up kalau intuisi meleset.

---

## 4. Menentukan Scope: Pertanyaan Kunci

Sebelum menyentuh apa pun, tentukan seberapa luas masalahnya. Jawabannya langsung mempersempit ruang pencarian.

```
BERAPA BANYAK yang terpengaruh?
├── Satu pengguna    → perangkat/konfigurasi pengguna itu, port, kabel
├── Satu segmen/VLAN → switch, VLAN, DHCP, gateway segmen itu
├── Satu lokasi      → uplink, router lokasi, WAN
└── Semua            → core, DNS, layanan pusat, internet

APA yang terpengaruh?
├── Semua aplikasi   → konektivitas (L1-L4)
├── Satu aplikasi    → aplikasi/server/DNS spesifik (L7)
└── Sebagian aplikasi → firewall, routing, MTU

KAPAN mulai?
├── Baru saja        → apa yang BERUBAH? (deploy, perubahan config, update)
├── Selalu begitu    → kesalahan konfigurasi/desain sejak awal
└── Intermiten       → interferensi, congestion, flapping, DFS, timeout

ARAH mana?
├── Keluar saja      → NAT, firewall egress, DNS
├── Masuk saja       → port forwarding, firewall ingress
└── Keduanya         → konektivitas dasar
```

> [!WARNING]
> **"Apa yang baru berubah?" adalah pertanyaan paling produktif.** Sebagian besar masalah produksi disebabkan perubahan: deploy, update, perubahan konfigurasi, penambahan perangkat. Selalu periksa change log terlebih dahulu.

---

## 5. Membedakan Gejala vs Penyebab

```
GEJALA (yang dilihat pengguna):    PENYEBAB (yang sebenarnya):
"Internet lambat"                → bufferbloat, DNS lambat, satu app rakus,
                                    congestion, Wi-Fi buruk, MTU
"Tidak bisa akses server"        → DNS, routing, firewall, server mati, port
"Website error"                  → sertifikat, backend, DNS, load balancer
"Wi-Fi putus-putus"              → roaming, DFS, interferensi, kapasitas
"Email tidak terkirim"           → SPF/DKIM/DMARC, port 25 diblokir, PTR, reputasi
```

> [!WARNING]
> **Jangan memperbaiki gejala.** "Internet lambat" yang diperbaiki dengan restart router mungkin sebenarnya masalah DNS yang akan kambuh. Selalu tanyakan kenapa.

### Teknik "5 Whys"

```
"Internet lambat"
  → Kenapa? Halaman web lambat dimuat
  → Kenapa? DNS lookup memakan 3 detik
  → Kenapa? Server DNS primer tidak merespons
  → Kenapa? Server DNS overload
  → Kenapa? Ada perangkat mengirim ribuan query DNS
  → AKAR: perangkat terinfeksi melakukan DNS tunneling/DGA
```

---

## 6. Baseline: Tahu Apa yang "Normal"

Anda tidak bisa mengenali "abnormal" tanpa tahu "normal".

```
Baseline yang perlu diketahui:
- Latency normal ke tujuan penting (gateway, DNS, aplikasi kunci)
- Utilisasi bandwidth normal per link (jam sibuk vs sepi)
- Jumlah koneksi normal
- CPU/memori normal perangkat
- Error counter normal (biasanya 0 dan stabil)
- Jumlah rute normal (BGP, OSPF)
```

> [!TIP]
> **Monitoring yang baik memberi baseline otomatis.** "Latency ke DNS naik dari 5 ms ke 200 ms sejak pukul 14:00" jauh lebih berguna daripada "DNS terasa lambat". Itulah sebabnya modul `14-monitoring-troubleshooting/03` (observability) penting: tanpa data historis, Anda tidak bisa men-troubleshoot dengan baik.

> [!WARNING]
> **Change correlation**: kalau masalah mulai pukul 14:00, apa lagi yang terjadi pukul 14:00? Deploy? Perubahan config? Perangkat baru? Perubahan trafik? Grafik monitoring yang menampilkan semua metrik pada garis waktu yang sama membuat pertanyaan itu cepat terjawab.

---

## 7. Isolasi Masalah: Teknik

### Substitusi

```
Ganti satu komponen dengan yang diketahui baik:
- Kabel → patch cord baru
- Port → pindah ke port lain
- SFP → SFP lain
- Perangkat → swap dengan cadangan
```

### Binary search (bagi dua)

```
Jalur A → B → C → D → E → tujuan
Cek di titik TENGAH (C):
├── C OK    → masalah antara C dan tujuan
└── C gagal → masalah antara A dan C
Ulangi → menemukan titik masalah dengan cepat
```

> [!TIP]
> **`traceroute`/`mtr` adalah binary search otomatis** untuk masalah jalur: keduanya menunjukkan di hop mana masalah muncul.

### Eliminasi

```
Nonaktifkan variabel satu per satu untuk mengisolasi:
- Matikan firewall sementara (di lab/dengan hati-hati) → masalah firewall?
- Bypass proxy → masalah proxy?
- Coba dari perangkat lain → masalah perangkat atau jaringan?
- Coba tujuan lain → masalah tujuan atau sumber?
```

> [!WARNING]
> **Berhati-hatilah menonaktifkan kontrol keamanan** (firewall) untuk diagnosis di produksi, karena bisa membuka celah. Lebih baik menambahkan aturan log/permit sementara yang sempit.

### Uji dari beberapa titik

```
Masalah "server tidak bisa diakses":
- Dari LAN yang sama → masalah server/switch lokal
- Dari VLAN lain     → masalah routing/firewall antar-VLAN
- Dari internet      → masalah NAT/firewall perimeter/DNS publik
- Dari beberapa lokasi → masalah global (DNS, BGP) vs lokal
```

---

## 8. Alur Diagnosis Universal

Untuk masalah "tidak bisa mengakses X":

```
1. ping 127.0.0.1              → stack TCP/IP host sendiri OK?
2. ip addr / ipconfig          → punya IP yang benar? (bukan 169.254.x.x?)
3. ping <gateway>              → L2/L3 lokal OK?
4. ip route / route print      → ada default route?
5. ping 8.8.8.8               → internet L3 OK?
6. dig google.com             → DNS OK?
7. ping <nama tujuan>         → resolusi + jalur ke tujuan OK?
8. nc -zv <tujuan> <port>     → port terbuka? firewall?
9. curl -v <url>              → aplikasi + TLS OK?
10. traceroute <tujuan>        → di mana jalur berhenti?
```

**Menafsirkan pola hasil:**
```
Langkah 5 OK, langkah 6 gagal → DNS (paling sering!)
Langkah 3 OK, langkah 5 gagal → routing/gateway/ISP
Langkah 3 gagal               → L1/L2 lokal (kabel, VLAN, switch)
Langkah 7 OK, langkah 8 gagal → firewall atau layanan mati
Langkah 8 OK, langkah 9 gagal → aplikasi atau sertifikat
```

> [!TIP]
> **"It's always DNS."** Kalau ping ke IP berhasil tetapi ke nama gagal, itu DNS. Ini penyebab nomor satu masalah "internet mati" yang sebenarnya bukan tentang konektivitas sama sekali.

---

## 9. Menangani Masalah Intermiten

Masalah yang datang-pergi adalah yang tersulit karena tidak bisa direproduksi sesuka hati.

```
Penyebab umum intermiten:
- Interferensi (Wi-Fi, EMI) — muncul saat sumber aktif
- Congestion — muncul saat trafik puncak
- Bufferbloat — muncul saat ada transfer besar
- DFS radar event — muncul acak di kanal DFS
- Flapping (link, BGP, STP) — muncul saat kondisi batas
- Timeout/aging (NAT, ARP, session) — muncul setelah idle
- Kebocoran memori — muncul setelah uptime tertentu
- Thermal — muncul saat perangkat panas
- Load-dependent — muncul hanya di bawah beban tertentu
```

**Strategi:**
```
1. Monitoring KONTINU untuk menangkap saat terjadi
   - ping/mtr berkelanjutan yang mencatat timestamp
   - SNMP/telemetry dengan interval pendek
   - syslog terpusat
2. Korelasi dengan waktu — kapan tepatnya terjadi? Pola?
3. Korelasi dengan beban/kondisi — saat trafik tinggi? Saat panas?
4. Capture yang berjalan terus (ring buffer) untuk menangkap kejadian
```

```bash
# ping berkelanjutan dengan timestamp
$ ping -D 8.8.8.8 | while read line; do echo "$(date '+%H:%M:%S') $line"; done

# mtr yang mencatat
$ mtr --report-cycles 1000 -r 8.8.8.8

# tcpdump ring buffer (menangkap kejadian tanpa mengisi disk)
$ sudo tcpdump -ni eth0 -w cap-%Y%m%d-%H%M%S.pcap -G 300 -W 12 'port 443'
```

> [!TIP]
> **Masalah intermiten butuh monitoring yang sudah berjalan.** Anda tidak bisa men-troubleshoot apa yang tidak Anda tangkap, jadi siapkan pengumpulan data yang berjalan terus sebelum masalah kambuh.

---

## 10. Dokumentasi dan RCA

### Root Cause Analysis (RCA)

Setelah masalah selesai, dokumentasikan:
```
- GEJALA: apa yang dilaporkan, kapan, siapa terpengaruh
- TIMELINE: kronologi kejadian dan tindakan
- AKAR PENYEBAB: kenapa sebenarnya terjadi (bukan gejala)
- RESOLUSI: apa yang memperbaikinya
- PENCEGAHAN: bagaimana mencegah kambuh
- PELAJARAN: apa yang bisa diperbaiki dalam proses/monitoring
```

### Postmortem Blameless

> [!WARNING]
> **Fokus pada SISTEM dan PROSES, bukan menyalahkan orang.** Budaya menyalahkan membuat orang menyembunyikan kesalahan, dan kesalahan yang disembunyikan jauh lebih berbahaya.

```
❌ "Budi merusak jaringan karena salah ketik"
✅ "Perubahan diterapkan tanpa review dan tanpa rollback plan;
    kita perlu proses change control dan Safe Mode/revert timer"
```

> [!TIP]
> **Kesalahan manusia adalah gejala masalah sistem.** Kalau satu salah ketik bisa melumpuhkan jaringan, masalahnya adalah tidak ada pengaman (review, staging, rollback otomatis, Safe Mode), bukan orang yang salah ketik.

### Eskalasi dan komunikasi saat outage

```
Selama outage:
1. Komunikasikan STATUS secara berkala (bahkan "masih investigasi")
2. Berikan ETA yang jujur (atau "belum ada ETA")
3. Tentukan siapa yang memutuskan (mis. rollback vs perbaiki maju)
4. Dokumentasikan tindakan REAL-TIME (untuk RCA nanti)
5. Eskalasi kalau melewati batas waktu/kemampuan
6. Jangan ubah banyak hal sekaligus (sulit tahu apa yang berhasil)
```

> [!WARNING]
> **Saat outage, jangan mengubah banyak variabel sekaligus.** Kalau berhasil, Anda tidak tahu mana yang memperbaikinya; kalau memperburuk, Anda tidak tahu mana penyebabnya. Ubah satu hal, verifikasi, lanjut.

---

## 11. Kesalahan Berpikir yang Umum

> [!WARNING]
> **Confirmation bias**: mencari bukti yang mendukung teori Anda dan mengabaikan yang bertentangan. Uji teori Anda dengan mencoba menyangkalnya.

> [!WARNING]
> **Anchoring**: terpaku pada teori pertama. Kalau bukti tidak cocok, buat teori baru, jangan memaksakan.

> [!WARNING]
> **Menyalahkan yang terakhir berubah tanpa bukti.** Tebakan ini sering benar, tetapi tetap verifikasi. Korelasi bukan kausalitas.

> [!WARNING]
> **Mengabaikan yang "tidak mungkin"**: kabel yang "pasti baik", perangkat yang "pasti menyala". Verifikasi asumsi, jangan percaya begitu saja.

> [!WARNING]
> **Terlalu cepat menyalahkan jaringan.** Sering masalahnya di aplikasi, server, DNS, atau kesalahan pengguna. Kumpulkan bukti sebelum menyimpulkan "ini masalah jaringan".

> [!WARNING]
> **Overengineering diagnosis**: kadang jawabannya sederhana (kabel dicabut, caps lock, salah URL). Periksa yang sederhana dulu.

> [!TIP]
> **"Kalau mendengar derap kaki, pikirkan kuda, bukan zebra."** Mulai dari penyebab yang paling umum dan sederhana. Tetapi kalau bukti menunjuk zebra, jangan abaikan.

---

## 12. Ringkasan

- **Metodologi mengalahkan menebak.** Restart menyembunyikan akar masalah dan menghapus bukti; ia pilihan terakhir, bukan pertama.
- **CompTIA 7 langkah**: identifikasi → teori → uji → rencana → implementasi → verifikasi → dokumentasi. Langkah 1 dan 7 paling sering dilewati dan paling penting.
- **Tiga pendekatan OSI**: bottom-up (tidak ada konektivitas), top-down (satu aplikasi), divide-and-conquer (mulai dari L3/ping, favorit praktisi).
- **Tentukan scope dulu**: berapa banyak terpengaruh, apa, kapan ("apa yang berubah?"), arah mana. Ini memangkas ruang pencarian.
- **Bedakan gejala dan penyebab** dengan "5 Whys". Jangan perbaiki gejala.
- **Baseline** memungkinkan mengenali abnormal; monitoring memberi baseline dan change correlation otomatis.
- **Isolasi**: substitusi, binary search (traceroute), eliminasi, uji dari beberapa titik.
- **Alur universal**: ping localhost → IP → gateway → internet → DNS → port → aplikasi. "It's always DNS."
- **Masalah intermiten** butuh monitoring kontinu, karena Anda tidak bisa men-troubleshoot yang tidak Anda tangkap.
- **Dokumentasi + RCA blameless**: fokus pada sistem/proses, bukan menyalahkan orang. Kesalahan manusia = gejala masalah sistem.
- **Saat outage**: komunikasi berkala, jangan ubah banyak hal sekaligus.
- **Waspadai bias**: confirmation bias, anchoring, terlalu cepat menyalahkan jaringan. Kuda dulu, bukan zebra.

---

## 13. Latihan

1. Kapan memakai bottom-up, top-down, dan divide-and-conquer?
2. Kenapa "apa yang baru berubah?" adalah pertanyaan pertama yang paling produktif?
3. Pengguna melaporkan "internet lambat". Bagaimana Anda menentukan scope dan gejala vs penyebab?
4. Ping ke 8.8.8.8 berhasil tetapi ke google.com gagal. Apa diagnosis Anda dalam satu kata?
5. Masalah muncul acak beberapa kali sehari dan tidak bisa direproduksi. Bagaimana pendekatan Anda?
6. Kenapa restart sebaiknya bukan tindakan pertama?
7. Jelaskan postmortem blameless dan mengapa penting.
8. Selama outage, rekan Anda mengubah tiga hal sekaligus dan masalah teratasi. Apa masalah dengan pendekatan ini?

<details>
<summary>Jawaban</summary>

1. **Bottom-up** ketika tidak ada konektivitas sama sekali, instalasi baru, atau setelah perubahan fisik. Penyebabnya kemungkinan besar di fondasi (kabel, port, VLAN), jadi mulailah dari sana dan periksa menyeluruh. **Top-down** ketika sebagian besar berfungsi dan hanya satu aplikasi bermasalah. Tidak masuk akal memeriksa kabel kalau aplikasi lain di komputer yang sama jalan; mulai dari log aplikasi. **Divide-and-conquer** ketika pengalaman menyarankan titik awal tertentu: mulai dari L3 (ping) karena paling informatif, lalu naik atau turun sesuai hasil. Pendekatan ini paling sering dipakai praktisi berpengalaman, dengan kesiapan kembali ke bottom-up kalau intuisi meleset.

2. Karena sebagian besar masalah produksi disebabkan oleh perubahan: deploy kode, update software/firmware, perubahan konfigurasi, penambahan/pemindahan perangkat, atau perubahan pihak ketiga (ISP, DNS, sertifikat). Sistem yang tadinya berfungsi tidak tiba-tiba rusak sendiri; hampir selalu ada pemicu. Dengan menanyakan "apa yang berubah?" dan memeriksa change log, Anda sering langsung menemukan tersangka utama, sehingga pencarian berjam-jam menyusut menjadi hitungan menit. Kalau tidak ada perubahan yang diketahui, fakta itu sendiri berguna: kemungkinannya bergeser ke kegagalan hardware, kondisi batas yang baru tercapai, atau serangan.

3. **Scope:** apakah lambat untuk satu pengguna atau semua? Satu aplikasi (mis. hanya video call) atau semua? Sejak kapan? Ke tujuan tertentu atau semua tujuan? Dari satu lokasi atau semua? Uji dari beberapa perangkat/lokasi.
   **Gejala vs penyebab:** "lambat" adalah gejala, dan penyebabnya bisa banyak: bufferbloat (ping naik saat ada download), DNS lambat (halaman lama dibuka tetapi transfer cepat setelah tersambung), satu perangkat rakus (torrent), congestion link, Wi-Fi buruk (SNR rendah), atau MTU. Ukur: latency saat idle vs beban (bufferbloat), waktu resolusi DNS (`dig`), utilisasi link, dan uji dengan kabel vs Wi-Fi. Jangan langsung "tambah bandwidth", karena sering bukan itu masalahnya.

4. **DNS.** Ping ke IP berhasil berarti konektivitas L1-L3 ke internet baik; yang gagal hanya resolusi nama. Perbaikan: periksa server DNS yang dikonfigurasi (`/etc/resolv.conf`, setelan DHCP), uji dengan `dig @1.1.1.1 google.com`, periksa apakah DNS server terjangkau dan merespons.

5. Karena masalah intermiten tidak bisa direproduksi sesuka hati, Anda harus menangkapnya saat terjadi dengan monitoring kontinu. (a) Jalankan ping/mtr berkelanjutan dengan timestamp ke tujuan yang relevan dan catat ke file. (b) Siapkan capture ring buffer (tcpdump dengan rotasi) yang berjalan terus, sehingga bukti tertangkap saat kejadian. (c) Pastikan syslog terpusat dan SNMP/telemetry interval pendek aktif. (d) Setelah tertangkap, korelasikan dengan waktu (pola jam? hari? setelah uptime tertentu?) dan dengan kondisi (saat trafik puncak? saat perangkat panas? saat ada transfer besar? di kanal DFS?). Penyebab intermiten umum: interferensi, congestion, bufferbloat, DFS event, flapping, timeout/aging, kebocoran memori, dan thermal. Tanpa data yang tertangkap, Anda hanya menebak.

6. Karena restart menyembunyikan akar masalah dan menghapus bukti. Ia sering "memperbaiki" gejala sementara (mengosongkan state yang bermasalah, memutus koneksi yang macet), sehingga masalah tampak selesai, padahal akan kambuh karena penyebabnya tidak ditemukan. Lebih buruk lagi, restart menghapus log dalam memori, tabel state, statistik, dan kondisi yang justru Anda butuhkan untuk memahami apa yang terjadi. Setelah restart, Anda kehilangan kesempatan diagnosis dan kembali ke titik nol saat kambuh. Restart adalah pilihan terakhir, bukan langkah pertama. Pengecualiannya tindakan darurat untuk memulihkan layanan dengan cepat, dengan kesadaran bahwa akar masalah belum diketahui. Kalau harus restart untuk memulihkan layanan, kumpulkan dulu bukti (log, `show tech`, capture) sebelum melakukannya.

7. **Postmortem blameless** adalah analisis pasca-insiden yang berfokus pada sistem, proses, dan kondisi yang memungkinkan kesalahan terjadi, bukan pada menyalahkan individu. Alih-alih "Budi merusak jaringan", pertanyaannya menjadi "kenapa satu perubahan bisa lolos tanpa review, tanpa staging, dan tanpa rollback otomatis?".
   **Kenapa penting:** budaya menyalahkan membuat orang menyembunyikan kesalahan dan near-miss karena takut hukuman. Akibatnya organisasi kehilangan informasi paling berharga untuk mencegah insiden berikutnya, dan masalah sistemik tidak pernah diperbaiki. Dalam budaya blameless, orang melaporkan kesalahan dengan jujur dan cepat, sehingga respons lebih cepat dan pembelajaran maksimal. Prinsipnya: kesalahan manusia hampir selalu gejala dari masalah sistem. Kalau satu salah ketik bisa melumpuhkan jaringan, perbaiki pengamannya (review, Safe Mode, revert timer, staging), bukan menghukum orangnya.

8. Masalahnya: Anda tidak tahu perubahan mana yang sebenarnya memperbaiki masalah, dan dua perubahan lainnya mungkin tidak perlu, atau bahkan menciptakan masalah baru yang belum terlihat. Konsekuensinya: (a) tidak ada pembelajaran, karena akar penyebab tetap tidak jelas untuk RCA; (b) kalau masalah kambuh, Anda tidak tahu mana yang harus diterapkan lagi; (c) perubahan yang tidak perlu menambah kompleksitas dan potensi bug baru; (d) sulit membuat dokumentasi yang akurat. Pendekatan yang benar saat outage adalah ubah satu hal, verifikasi, lanjut, kecuali dalam keadaan darurat ekstrem ketika pemulihan cepat lebih penting daripada pemahaman. Itu pun harus diikuti RCA untuk mengurai apa yang sebenarnya terjadi. Setelah pulih, sebaiknya kembalikan perubahan yang tidak terbukti perlu satu per satu untuk mengonfirmasi mana yang benar-benar menyelesaikan masalah.

</details>

---

## 14. Sumber

- CompTIA Network+ N10-009, Domain 5.0 (Network Troubleshooting): metodologi 7 langkah
- Google SRE Book, *Effective Troubleshooting* dan *Postmortem Culture*
- Cisco, *Internetwork Troubleshooting Handbook*
- Kepner-Tregoe, *Problem Analysis methodology*

---

**Berikutnya:** `14-monitoring-troubleshooting/02-tools.md`. Alat troubleshooting dan cara menafsirkannya dengan benar.

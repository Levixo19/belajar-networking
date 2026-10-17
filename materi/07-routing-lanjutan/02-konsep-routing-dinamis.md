# 07.2 Konsep Routing Dinamis

> **Prasyarat:** `07-routing-lanjutan/01`
> **Tujuan:** Anda paham perbedaan mendasar antara distance vector, link state, dan path vector, serta mekanisme pencegahan loop yang dipakai masing-masing.

Modul ini adalah fondasi konseptual untuk OSPF, EIGRP, dan BGP. Memahaminya membuat modul-modul berikutnya jauh lebih mudah.

---

## 1. Apa yang Dilakukan Protokol Routing Dinamis

Empat tugas:

```
1. DISCOVERY   — menemukan router tetangga
2. EXCHANGE    — bertukar informasi tentang jaringan yang diketahui
3. CALCULATION — menghitung jalur terbaik ke setiap tujuan
4. MAINTENANCE — mendeteksi perubahan dan menghitung ulang
```

Manfaat dibanding static:
- **Adaptif**: otomatis beralih saat jalur gagal
- **Skalabel**: tidak perlu mengonfigurasi setiap rute manual
- **Menemukan jalur optimal** berdasarkan metrik

Biaya:
- CPU dan memori
- Bandwidth untuk pertukaran informasi
- Kompleksitas dan permukaan serangan baru
- Waktu konvergensi (ada masa transisi di mana routing tidak konsisten)

---

## 2. Klasifikasi Protokol Routing

### Berdasarkan cakupan: IGP vs EGP

| | **IGP** (Interior Gateway Protocol) | **EGP** (Exterior Gateway Protocol) |
|---|---|---|
| Cakupan | Dalam satu AS | Antar AS |
| Tujuan | Menemukan jalur terbaik | Menegakkan kebijakan |
| Contoh | RIP, OSPF, EIGRP, IS-IS | BGP |
| Metrik | Teknis (bandwidth, delay, hop) | Path attribute (kebijakan bisnis) |
| Skala | Ribuan rute | Jutaan rute |
| Konvergensi | Cepat (detik) | Lambat (menit), sengaja demi stabilitas |

> [!TIP]
> **Perbedaan filosofisnya:** IGP bertanya *"jalur mana yang tercepat?"*, sedangkan BGP bertanya *"jalur mana yang ingin saya pakai berdasarkan perjanjian bisnis?"* BGP bisa dengan sengaja memilih jalur yang lebih panjang karena lebih murah.

### Berdasarkan algoritma

| | **Distance Vector** | **Link State** | **Path Vector** |
|---|---|---|---|
| Yang diketahui router | Jarak & arah ke tujuan | Peta topologi lengkap | Daftar AS yang dilalui |
| Yang dibagikan | Seluruh routing table | Status link lokal (LSA) | Prefix + path attributes |
| Dibagikan ke | Hanya tetangga | Seluruh area (flooding) | Tetangga BGP |
| Perhitungan | Bellman-Ford | Dijkstra (SPF) | Best path selection |
| Kebutuhan CPU/RAM | Rendah | Tinggi | Tinggi |
| Konvergensi | Lambat | Cepat | Lambat |
| Pencegahan loop | Split horizon, poison reverse, holddown | Topologi lengkap | AS_PATH |
| Contoh | RIP, IGRP | OSPF, IS-IS | BGP |
| EIGRP | Advanced DV (hybrid) dengan DUAL | | |

---

## 3. Distance Vector: "Routing by Rumor"

Setiap router memberi tahu tetangganya: *"Saya bisa mencapai jaringan X dengan jarak N."* Penerima menambahkan biaya link ke tetangga itu, lalu menyebarkannya lagi.

```
R1 → R2 : "Saya bisa mencapai 10.0.0.0/8, jarak 0 hop"
R2 mencatat: 10.0.0.0/8 lewat R1, jarak 1
R2 → R3 : "Saya bisa mencapai 10.0.0.0/8, jarak 1"
R3 mencatat: 10.0.0.0/8 lewat R2, jarak 2
```

> [!WARNING]
> **R3 tidak tahu apa pun tentang topologi.** Ia hanya percaya apa yang dikatakan R2. Karena itulah cara ini disebut *routing by rumor*.

### Masalah: Count to Infinity

```
Topologi: [Net A]──R1──R2──R3

Normal:
  R1: Net A = 0 hop
  R2: Net A = 1 hop (lewat R1)
  R3: Net A = 2 hop (lewat R2)

Net A MATI:
  R1: Net A tidak terjangkau
  R1 → R2: "Net A hilang"

  TAPI sebelum R2 memproses, R2 mengirim update rutinnya:
  R2 → R1: "Saya bisa mencapai Net A, 1 hop"

  R1 (sudah lupa): "Oh! R2 punya jalur. Saya pakai, 2 hop"
  R1 → R2: "Net A, 2 hop"
  R2: "Jalur saya lewat R1 sekarang 3 hop"
  R2 → R1: "Net A, 3 hop"
  R1: "4 hop"
  ...
  → Naik terus sampai INFINITY
  → Paket ke Net A berputar-putar antara R1 dan R2
```

### Mekanisme pencegahan

**1. Maximum hop count (definisi "infinity")**
```
RIP: 16 hop = tak terjangkau
→ membatasi berapa lama loop bisa berlangsung
→ tetapi juga membatasi ukuran jaringan
```

**2. Split Horizon**
```
"Jangan mengiklankan rute kembali ke arah dari mana Anda mempelajarinya"

R2 belajar Net A dari R1 → R2 TIDAK mengiklankan Net A ke R1
```

**3. Route Poisoning**
```
Ketika rute hilang, jangan diam — iklankan dengan metrik INFINITY
R1 → R2: "Net A = 16 hop (tak terjangkau)"
→ menyebar cepat, mencegah informasi lama bertahan
```

**4. Poison Reverse**
```
Split horizon dengan poison: iklankan kembali, tetapi dengan metrik infinity
R2 → R1: "Net A = 16 hop"
→ lebih eksplisit daripada sekadar diam
```

**5. Holddown Timer**
```
Setelah rute dinyatakan hilang, ABAIKAN informasi baru tentang rute itu
selama periode holddown (RIP: 180 detik)
→ mencegah menerima informasi basi
→ TAPI memperlambat konvergensi secara signifikan
```

**6. Triggered Update**
```
Jangan tunggu timer periodik — kirim update SEGERA saat ada perubahan
→ mempercepat konvergensi
```

> [!WARNING]
> **Semua mekanisme ini adalah tambalan** untuk kelemahan mendasar distance vector: router tidak punya gambaran topologi. Link state memecahkan masalah ini dari akarnya.

---

## 4. Link State: Setiap Router Punya Peta

```
1. Setiap router mendeteksi tetangganya (Hello)
2. Setiap router membuat LSA (Link State Advertisement) berisi:
   "Saya router X. Saya terhubung ke Y dengan cost 10, ke Z dengan cost 5"
3. LSA di-FLOOD ke SELURUH area — setiap router menerima setiap LSA
4. Setiap router membangun LSDB (Link State Database) yang IDENTIK
   → semua router punya peta topologi yang SAMA
5. Setiap router menjalankan Dijkstra SPF pada peta itu,
   dengan DIRINYA SENDIRI sebagai akar pohon
6. Hasilnya: jalur terpendek ke setiap tujuan
```

### Analogi

```
Distance Vector : Anda bertanya arah ke orang di jalan.
                  "Ke stasiun? Lurus 2 km lalu tanya lagi."
                  Anda tidak pernah melihat petanya.

Link State      : Anda punya peta lengkap kota.
                  Anda menghitung sendiri rute terbaik.
```

### Keunggulan

| Aspek | Keuntungan |
|---|---|
| **Konvergensi** | Cepat: perubahan di-flood langsung, tidak menunggu update periodik |
| **Bebas loop** | Setiap router punya topologi lengkap sehingga tidak bisa "tertipu" |
| **Metrik lebih baik** | Berbasis cost/bandwidth, bukan sekadar hop |
| **Skalabilitas** | Dengan area, LSDB dan SPF bisa dibatasi cakupannya |
| **Support VLSM/CIDR** | Selalu classless |

### Biaya

| Aspek | Biaya |
|---|---|
| **Memori** | LSDB bisa besar |
| **CPU** | Dijkstra mahal; setiap perubahan memicu perhitungan ulang |
| **Bandwidth** | Flooding LSA memakan bandwidth (walau hanya saat ada perubahan) |
| **Kompleksitas** | Konfigurasi dan troubleshooting lebih rumit |

### Algoritma Dijkstra: intuisi

```
1. Mulai dari diri sendiri, cost 0. Tandai sebagai "sementara".
2. Ambil node dengan cost terkecil dari daftar sementara.
   Tandai "permanen" (jalur terpendek ke sana sudah pasti).
3. Untuk setiap tetangga node itu:
      cost_baru = cost_node + cost_link
      Kalau cost_baru < cost yang tercatat, perbarui.
4. Ulangi sampai semua node permanen.
```

**Area** membatasi cakupan flooding dan SPF. Dengan area itulah OSPF dan IS-IS bisa berskala besar (`07-routing-lanjutan/04`).

---

## 5. Path Vector: BGP

BGP tidak mencari jalur tercepat, melainkan menegakkan kebijakan.

```
Alih-alih metrik tunggal, BGP membawa PATH ATTRIBUTES:
  AS_PATH     : daftar AS yang dilalui  → pencegahan loop + panjang jalur
  NEXT_HOP    : router berikutnya
  LOCAL_PREF  : preferensi keluar (dalam AS sendiri)
  MED         : saran preferensi masuk (ke AS tetangga)
  COMMUNITY   : tag untuk kebijakan
  ORIGIN      : dari mana rute berasal
```

### Pencegahan loop dengan AS_PATH

```
Rute dari AS 100 → AS 200 → AS 300:
  AS_PATH = "300 200 100"

Kalau rute ini kembali ke AS 200:
  AS 200 melihat nomornya sendiri di AS_PATH → BUANG
  → Loop dicegah secara elegan, tanpa timer atau holddown
```

> [!WARNING]
> **iBGP (dalam AS yang sama) tidak menambah AS_PATH**, sehingga mekanisme ini tidak berlaku. Karena itu iBGP butuh aturan berbeda: router tidak boleh meneruskan rute iBGP ke peer iBGP lain. Aturan inilah yang memaksa **full mesh** atau **route reflector** (`07-routing-lanjutan/06`).

---

## 6. Metrik

| Protokol | Metrik | Formula/Rentang |
|---|---|---|
| **RIP** | Hop count | 1-15 (16 = tak terjangkau) |
| **OSPF** | Cost | `reference_bandwidth / bandwidth`; default ref = 100 Mbps |
| **EIGRP** | Composite | `256 × ((K1×BW) + (K3×Delay))` dengan K1=K3=1 default |
| **IS-IS** | Cost | Default 10 per link; wide metric sampai 16.777.215 |
| **BGP** | Tidak ada metrik tunggal | Algoritma seleksi 13 langkah |

### Masalah metrik OSPF default

```
Reference bandwidth default = 100 Mbps

Cost = 100.000.000 / bandwidth
  10 Mbps  → cost 10
  100 Mbps → cost 1
  1 Gbps   → cost 1     ← SAMA dengan 100 Mbps!
  10 Gbps  → cost 1     ← SAMA!
  100 Gbps → cost 1     ← SAMA!
```

> [!WARNING]
> OSPF tidak bisa membedakan 100 Mbps dan 100 Gbps dengan setelan default. Selalu naikkan reference bandwidth, dan samakan nilainya di semua router:
```
R1(config-router)# auto-cost reference-bandwidth 100000    ← 100 Gbps
```

---

## 7. Konvergensi

**Konvergensi** = waktu sampai semua router punya pandangan topologi yang konsisten setelah perubahan.

```
Waktu konvergensi = deteksi + propagasi + perhitungan + pemasangan FIB
```

### Mempercepat deteksi

| Mekanisme | Waktu deteksi |
|---|---|
| Link down (fisik) | Milidetik (tercepat) |
| **BFD** (Bidirectional Forwarding Detection) | 50-150 ms |
| Fast hello (OSPF sub-second) | ~1 detik |
| Hello/dead timer default OSPF | 40 detik |
| Hello/hold timer default EIGRP | 15 detik |
| BGP hold timer default | 180 detik |

> [!TIP]
> **BFD adalah mekanisme deteksi universal**: protokol ringan yang mengirim paket sangat cepat dan memberi tahu protokol routing (OSPF, BGP, EIGRP, static) begitu link mati. Cara ini jauh lebih efisien daripada mempercepat hello timer setiap protokol.

```
R1(config-if)# bfd interval 50 min_rx 50 multiplier 3
R1(config-router)# bfd all-interfaces
```

> [!WARNING]
> **Menurunkan hello/dead timer terlalu agresif berbahaya.** Beban CPU meningkat, dan link yang sedikit tidak stabil akan menyebabkan **flapping** yang justru lebih merusak daripada konvergensi lambat.

### Mekanisme peredam

```
Dampening       — menekan rute yang flapping (BGP)
SPF throttling  — batasi seberapa sering SPF dijalankan (OSPF)
LSA throttling  — batasi laju pembuatan LSA
Carrier delay   — tunda pelaporan interface down
```

---

## 8. Teori Algoritma Routing

Bagian 3 sampai 5 memberi intuisi. Bagian ini mengerjakan algoritmanya dengan tangan, karena hanya dengan cara itu perilaku OSPF, RIP, dan BGP di lapangan bisa diprediksi, bukan dihafal. Semua contoh memakai satu graf: enam router backbone fiktif di Jawa dan Bali, dengan cost link seperti berikut.

```
   JKT ───2─── BDG
    │        ╱  │
    5      4    7          Link (cost):
    │    ╱      │          JKT-BDG 2, JKT-SMG 5, BDG-SMG 4, BDG-YOG 7,
   SMG ───1─── YOG         SMG-YOG 1, SMG-SBY 6, YOG-SBY 3,
    │        ╱  │          YOG-DPS 9, SBY-DPS 2
    6      3    9
    │    ╱      │
   SBY ───2─── DPS
```

Secara formal jaringan adalah graf G = (N, E): N adalah himpunan node (router), E adalah himpunan sisi (link), dan setiap sisi punya cost c(i,j) > 0. Masalah routing adalah mencari jalur dengan total cost terkecil dari setiap node ke setiap node lain.

### 8.1 Dijkstra langkah demi langkah

Router link-state menjalankan Dijkstra dalam bentuk yang oleh Peterson & Davie disebut *forward search*. Router menyimpan dua daftar berisi entri `(Tujuan, Cost, NextHop)`:

1. Masukkan diri sendiri ke daftar **Confirmed** dengan cost 0.
2. Ambil node yang baru masuk Confirmed (sebut `Next`) dan baca LSA-nya.
3. Untuk setiap tetangga `Next`, hitung `Cost = cost(Next) + c(Next, tetangga)`.
   - Kalau tetangga belum ada di Confirmed maupun **Tentative**, masukkan ke Tentative.
   - Kalau sudah ada di Tentative dengan cost lebih besar, ganti entrinya.
   - NextHop adalah arah yang dipakai untuk mencapai `Next` (atau tetangga itu sendiri kalau `Next` adalah diri sendiri).
4. Kalau Tentative kosong, selesai. Kalau tidak, pindahkan entri Tentative dengan cost terkecil ke Confirmed, kembali ke langkah 2.

**Dijkstra dari JKT:**

| Langkah | Confirmed (ditambahkan) | Tentative setelah langkah | Catatan |
|---|---|---|---|
| 1 | (JKT,0,-) | (BDG,2,BDG) (SMG,5,SMG) | Baca LSA JKT: tetangga BDG dan SMG |
| 2 | (BDG,2,BDG) | (SMG,5,SMG) (YOG,9,BDG) | Lewat BDG ke SMG = 2+4 = 6, tidak lebih baik dari 5. Ke YOG = 2+7 = 9 |
| 3 | (SMG,5,SMG) | (YOG,6,SMG) (SBY,11,SMG) | Lewat SMG ke YOG = 5+1 = 6 < 9: **ganti**. Ke SBY = 5+6 = 11 |
| 4 | (YOG,6,SMG) | (SBY,9,SMG) (DPS,15,SMG) | Lewat YOG ke SBY = 6+3 = 9 < 11: **ganti**. Ke DPS = 6+9 = 15 |
| 5 | (SBY,9,SMG) | (DPS,11,SMG) | Lewat SBY ke DPS = 9+2 = 11 < 15: **ganti** |
| 6 | (DPS,11,SMG) | kosong | Selesai |

Perhatikan bagaimana algoritma tampak "salah jalan" lebih dulu (YOG 9, SBY 11, DPS 15), lalu memperbaikinya. Dijkstra hanya menjamin satu hal: saat sebuah node dipindah ke Confirmed, cost-nya sudah pasti minimum, karena semua jalur lain melewati node Tentative yang cost-nya sudah lebih besar dan cost link tidak pernah negatif.

Hasilnya adalah *shortest-path tree* dengan JKT sebagai akar, dan tabel routing JKT:

```
            JKT                     Tujuan  Cost  Next hop
          2╱   ╲5                   BDG      2    BDG
        BDG     SMG                 SMG      5    SMG
                 │1                 YOG      6    SMG
                YOG                 SBY      9    SMG
                 │3                 DPS     11    SMG
                SBY
                 │2
                DPS
```

**Kompleksitas.** Dengan larik biasa, Dijkstra butuh O(N²). Dengan *priority queue* (heap), O((N + E) log N). Untuk area OSPF besar dengan 500 router dan 2.000 link: (500 + 2.000) × log₂ 500 ≈ 2.500 × 9 ≈ 22.500 operasi dasar, jauh di bawah satu milidetik pada CPU router modern. SPF itu sendiri jarang menjadi bottleneck. Yang lambat adalah timer di sekitarnya dan pemasangan hasil ke FIB (8.6).

### 8.2 Bellman-Ford dan persamaan distance vector

Distance vector bertumpu pada **persamaan Bellman-Ford**:

```
D_x(y) = min over v ∈ tetangga(x) { c(x,v) + D_v(y) }

"Jarak terbaik saya ke y = jarak terkecil dari pilihan: biaya ke tetangga v
 ditambah jarak yang dilaporkan v ke y."
```

Setiap router hanya butuh dua hal: biaya ke tetangganya dan vektor jarak yang diumumkan tetangganya. Router tidak perlu peta. Tabel berikut menjalankan persamaan itu pada graf yang sama untuk satu tujuan, DPS, secara sinkron (setiap iterasi semua router memakai vektor tetangga dari iterasi sebelumnya):

| Iterasi | JKT | BDG | SMG | YOG | SBY | DPS |
|---|---|---|---|---|---|---|
| 0 | ∞ | ∞ | ∞ | ∞ | ∞ | 0 |
| 1 | ∞ | ∞ | ∞ | 9 (via DPS) | 2 (via DPS) | 0 |
| 2 | ∞ | 16 (via YOG) | 8 (via SBY) | 5 (via SBY) | 2 | 0 |
| 3 | 13 (via SMG) | 12 (via SMG, seri dengan via YOG) | 6 (via YOG) | 5 | 2 | 0 |
| 4 | 11 (via SMG) | 10 (via SMG) | 6 | 5 | 2 | 0 |
| 5 | tidak berubah, konvergen | | | | | |

Cek dua angka: di iterasi 2, SMG memilih min(6 + D_SBY = 6+2, 1 + D_YOG = 1+9) = min(8, 10) = 8 via SBY. Di iterasi 3, YOG sudah melaporkan 5, sehingga SMG menghitung ulang min(6+2, 1+5) = 6 via YOG. Hasil akhir (JKT 11, BDG 10, SMG 6, YOG 5, SBY 2) sama dengan Dijkstra, seperti seharusnya.

Kabar baik menyebar cepat: banyaknya iterasi paling banyak sebanding dengan jumlah hop jalur terpendek terpanjang (di sini 4). Masalahnya ada pada kabar buruk.

### 8.3 Count to infinity, iterasi demi iterasi

Ambil tiga router di Sumatra: **PKU** (Pekanbaru) terhubung ke **MDN** (Medan) dengan cost 1, PKU terhubung ke **PDG** (Padang) dengan cost 1, dan PDG punya link cadangan langsung ke MDN dengan cost 11 (misalnya link radio yang mahal).

```
        MDN
      1╱   ╲11
     PKU ─1─ PDG

Sebelum gangguan: PKU → MDN = 1 (langsung)
                  PDG → MDN = min(11, 1 + 1) = 2 (via PKU)
```

Link PKU-MDN putus. Tanpa mekanisme pencegahan, dengan update yang diproses bergantian:

| Langkah | Router | Perhitungan | Hasil | Loop? |
|---|---|---|---|---|
| 1 | PKU | link langsung hilang; via PDG: 1 + 2 | 3 via PDG | PKU→PDG→PKU |
| 2 | PDG | min(11, 1 + 3) | 4 via PKU | ya |
| 3 | PKU | 1 + 4 | 5 via PDG | ya |
| 4 | PDG | min(11, 1 + 5) | 6 via PKU | ya |
| 5 | PKU | 1 + 6 | 7 via PDG | ya |
| 6 | PDG | min(11, 1 + 7) | 8 via PKU | ya |
| 7 | PKU | 1 + 8 | 9 via PDG | ya |
| 8 | PDG | min(11, 1 + 9) | 10 via PKU | ya |
| 9 | PKU | 1 + 10 | 11 via PDG | ya |
| 10 | PDG | min(11, 1 + 11) | **11 via MDN** | selesai di PDG |
| 11 | PKU | 1 + 11 | **12 via PDG** | konvergen |

Sembilan langkah paket ke MDN berputar antara PKU dan PDG, padahal jalur cadangan sudah ada sejak awal. PKU tidak bisa tahu bahwa "2" yang dilaporkan PDG justru melewati PKU sendiri. Semakin mahal jalur cadangannya, semakin lama hitungannya. Kalau MDN terisolasi total (link cadangan juga putus), keduanya menghitung sampai "tak terhingga". Pada RIP (16 = tak terjangkau) dengan update periodik 30 detik dan tanpa triggered update, simulasi sinkron butuh sekitar 15 putaran, atau sekitar 7,5 menit loop dalam kasus terburuk.

**Dengan poison reverse**, PDG yang memakai PKU sebagai next hop memberi tahu PKU "MDN = ∞" sejak awal:

| Langkah | Router | Perhitungan | Hasil |
|---|---|---|---|
| 1 | PKU | link langsung hilang; PDG melaporkan ∞ | ∞, kirim poison ke PDG |
| 2 | PDG | min(11, 1 + ∞) | 11 via MDN |
| 3 | PKU | 1 + 11 | 12 via PDG |

Tiga langkah, tanpa loop.

### 8.4 Batas split horizon dan poison reverse

Peterson & Davie mencatat kelemahan pentingnya: split horizon dan poison reverse hanya mencegah loop yang melibatkan dua router. Contoh segitiga R1, R2, R3 (semua link cost 1), dengan jaringan Z terhubung langsung ke R3. R1 dan R2 sama-sama mencapai Z via R3 dengan cost 1, dan split horizon aktif.

| Langkah | Kejadian | R1 | R2 | R3 |
|---|---|---|---|---|
| 0 | Normal | 1 via R3 | 1 via R3 | 0 (langsung) |
| 1 | Link R3-Z putus. Poison dari R3 sampai ke R2, tetapi paket ke R1 hilang | 1 via R3 (basi) | ∞ | ∞ |
| 2 | R1 mengirim update periodik ke R2: "Z = 1". Split horizon mengizinkannya, karena R1 belajar Z dari R3, bukan dari R2 | 1 via R3 | 2 via R1 | ∞ |
| 3 | R2 mengumumkan ke R3 (diizinkan, karena rute R2 lewat R1) | 1 via R3 | 2 via R1 | 3 via R2 |
| 4 | R3 mengumumkan ke R1 (diizinkan, karena rute R3 lewat R2). R1 wajib menerima update dari next hop-nya sendiri | 4 via R3 | 2 via R1 | 3 via R2 |
| 5 | R1 mengumumkan ke R2 | 4 via R3 | 5 via R1 | 3 via R2 |
| ... | Siklus R1 → R3 → R2 → R1 terus menghitung naik sampai 16 | | | |

Setiap router mematuhi split horizon terhadap tetangganya sendiri, tetapi loop-nya melibatkan tiga router. Holddown timer membantu (R2 akan mengabaikan kabar baik tentang Z selama holddown), dengan harga konvergensi yang lebih lambat. EIGRP menyelesaikannya dengan cara berbeda: algoritma DUAL hanya menerima jalur cadangan yang memenuhi *feasibility condition*, yang menjamin jalur itu tidak melewati router itu sendiri (`07-routing-lanjutan/05`).

### 8.5 Path vector: kenapa BGP tidak menghitung sampai tak terhingga

Akar masalah distance vector: router menerima angka tanpa tahu jalurnya. Path vector mengirim seluruh jalur, sehingga setiap router bisa memeriksa apakah dirinya sudah ada di dalamnya. Ulangi segitiga di atas dengan path vector: pada langkah 3, R2 mengumumkan ke R3 jalur `[R2, R1, R3]`. R3 melihat namanya sendiri di jalur itu dan membuangnya. Loop tidak pernah terbentuk, berapa pun panjang siklusnya. Itulah fungsi AS_PATH pada BGP (bagian 5).

Kenapa antar-AS tidak memakai link-state saja? Ada tiga alasan:

1. **Skala.** Tabel routing global saat ini memuat sekitar 79 ribu AS (CIDR Report, Oktober 2026) dan lebih dari satu juta prefix IPv4. Membanjiri seluruh internet dengan setiap perubahan link di setiap AS tidak masuk akal.
2. **Kerahasiaan.** Topologi internal dan kebijakan komersial (siapa pelanggan, siapa peer) adalah rahasia bisnis. Path vector hanya mengungkap jalur yang memang diumumkan.
3. **Metrik tidak bisa dibandingkan.** Cost OSPF di Telkom dan di ISP lain tidak punya arti bersama. Setiap AS memilih berdasarkan kebijakannya sendiri.

Path vector bebas loop, tetapi tidak bebas masalah. Saat sebuah prefix ditarik, router mencoba jalur cadangan yang sudah basi satu per satu (*path exploration*). Contoh dengan nomor AS dokumentasi (RFC 5398): AS64496 mengumumkan `203.0.113.0/24` ke AS64497, AS64498, dan AS64499, yang saling terhubung.

```
Sebelum: AS64497 memakai [64496], cadangan [64498 64496] dan [64499 64496]
AS64496 putus dari ketiganya:
  AS64497: [64496] hilang → pakai [64498 64496] (basi) → umumkan [64497 64498 64496]
  AS64498 menarik → AS64497 pindah ke [64499 64496] (basi) → umumkan lagi
  AS64499 menarik → AS64497 mencoba jalur lebih panjang yang tersisa ...
  ... sampai tidak ada jalur tersisa → withdraw
```

Karena BGP membatasi frekuensi pengumuman per tetangga (MRAI, nilai yang disarankan RFC 4271 adalah 30 detik untuk eBGP dan 5 detik untuk iBGP), setiap langkah bisa memakan puluhan detik. Labovitz dkk. (2000) mengukur bahwa konvergensi setelah penarikan prefix di internet sering memakan beberapa menit. Lebih jauh, dengan kebijakan sembarangan, BGP tidak dijamin konvergen sama sekali (Griffin, Shepherd, Wilfong, 2002). Jaminan konvergensi datang dari pola kebijakan ekonomi yang wajar, yaitu aturan Gao-Rexford: utamakan rute dari pelanggan, dan jangan meneruskan rute dari peer atau provider ke peer atau provider lain (`07-routing-lanjutan/06`).

### 8.6 Loop transien dan microloop di link-state

Link-state "bebas loop" hanya dalam kondisi stabil. Saat topologi berubah, setiap router memperbarui FIB-nya pada waktu yang berbeda: router yang dekat dengan gangguan tahu lebih dulu, router lain menunggu LSA tiba, menunggu timer SPF, lalu menunggu FIB terpasang. Selama jeda itu dua router bisa saling menunjuk. Inilah **microloop**.

Kembali ke graf utama. Sebelum gangguan, rute ke DPS adalah: YOG via SBY (3+2 = 5), SBY langsung (2). Sekarang link SBY-DPS putus:

```
Rute baru ke DPS:  SBY → via YOG (3 + 9 = 12)    YOG → langsung (9)

t = 0 ms    link SBY-DPS putus
t ≈ 60 ms   SBY (mendeteksi sendiri) sudah memasang FIB baru: DPS via YOG
t ≈ 110 ms  YOG baru selesai SPF dan memasang FIB baru: DPS langsung
            (angka waktu ilustratif)

Di antara 60 dan 110 ms:
   SBY ──► YOG     (FIB baru SBY: ke DPS lewat YOG)
   YOG ──► SBY     (FIB lama YOG: ke DPS lewat SBY)
   paket ke DPS memantul SBY ↔ YOG sampai TTL habis atau YOG selesai update
```

Microloop paling sering terjadi seperti ini: router di sisi dekat gangguan memperbarui lebih dulu dan mengarahkan trafik ke tetangga yang masih memakai rute lama melalui dirinya. Dampaknya lebih luas dari sekadar trafik ke DPS. Kalau 2 Gbps trafik menuju DPS selama 50 ms, ada 2 × 10⁹ × 0,05 = 100 Mbit (12,5 MB) paket yang memantul, masing-masing bisa melintasi link SBY-YOG puluhan kali sebelum TTL habis. Link SBY-YOG penuh, dan trafik lain yang kebetulan memakai link itu (misalnya SBY ke JKT) ikut terbuang.

Mitigasinya:

- **Mengurutkan pembaruan FIB** (oFIB, RFC 6976): router yang jauh dari gangguan memperbarui lebih dulu, router dekat belakangan. Cara sederhana yang banyak diimplementasikan vendor adalah menunda pembaruan FIB di router lokal sesaat ketika ia mendeteksi gangguan.
- **Jalur cadangan yang sudah dihitung sebelumnya**: Loop-Free Alternate (RFC 5286) dan TI-LFA dengan Segment Routing mengalihkan trafik dalam puluhan milidetik ke jalur yang dijamin tidak kembali (`22-service-provider/03-te-segment-routing`).
- **Penundaan SPF yang terkendali** (RFC 8405) agar perubahan beruntun tidak memicu SPF berkali-kali dengan hasil berbeda-beda.

### 8.7 Ringkasan kompleksitas dan anggaran konvergensi

| | Distance vector | Link state | Path vector |
|---|---|---|---|
| Yang dikirim | Vektor jarak, ke tetangga | LSA link sendiri, ke seluruh area | Prefix + jalur + atribut, ke tetangga BGP |
| Komputasi | Bellman-Ford, iterasi sampai stabil | Dijkstra O((N+E) log N) | Seleksi best path per prefix |
| Memori | Kecil: vektor tetangga | LSDB seluruh area | Besar: semua jalur dari semua tetangga |
| Loop saat konvergensi | Bisa panjang (count to infinity) | Singkat (microloop) | Tidak ada loop forwarding dari AS_PATH, tetapi ada path exploration |
| Konvergensi tipikal | Detik sampai menit | Puluhan milidetik sampai detik | Detik sampai menit |

Waktu konvergensi link-state adalah jumlah beberapa tahap (bagian 7). Contoh anggaran untuk OSPF yang sudah di-tuning (semua angka ilustratif):

```
Deteksi dengan BFD (3 × 50 ms)               150 ms
Tunda pembuatan LSA                           50 ms
Flooding 5 hop × ~2 ms                        10 ms
Tunda SPF awal                                50 ms
Komputasi SPF (500 node, 2.000 link)          < 1 ms
Pemasangan FIB: 10.000 prefix × 10 µs        100 ms
                                             ───────
Total                                       ≈ 361 ms
```

Komputasi Dijkstra, yang paling banyak dibahas di buku, justru bagian terkecil. Deteksi dan pemasangan FIB mendominasi, sehingga optimasi nyata di lapangan berfokus pada BFD, urutan pemasangan prefix (prefix penting dipasang lebih dulu), dan jalur cadangan yang dihitung sebelum gangguan terjadi.

---

## 9. Passive Interface

Mencegah protokol routing mengirim hello/update di interface tertentu, tetapi tetap mengiklankan subnet interface itu.

```
R1(config-router)# passive-interface gi0/5
R1(config-router)# passive-interface default          ← semua pasif
R1(config-router)# no passive-interface gi0/1         ← kecuali yang ini
```

**Kenapa penting:**
1. **Keamanan**: mencegah penyerang di jaringan pengguna membentuk adjacency dan menyuntikkan rute palsu
2. **Efisiensi**: tidak membuang bandwidth mengirim hello ke jaringan tanpa router
3. **Kebersihan**: mengurangi noise

> [!TIP]
> **Praktik terbaik: `passive-interface default`, lalu aktifkan eksplisit hanya di interface yang menghadap router lain.** Ini pendekatan "deny by default" yang jauh lebih aman.

> [!WARNING]
> Pada EIGRP dan OSPF, passive interface berarti tidak ada adjacency sama sekali di interface itu. Pada RIP, router masih menerima update (hanya tidak mengirim).

---

## 10. Autentikasi Protokol Routing

Tanpa autentikasi, siapa pun yang bisa mengirim paket ke segmen Anda bisa menyuntikkan rute palsu untuk mengalihkan trafik ke dirinya (MITM) atau ke lubang hitam (DoS).

```
# OSPF (MD5 per interface)
R1(config-if)# ip ospf authentication message-digest
R1(config-if)# ip ospf message-digest-key 1 md5 RahasiaKuat

# OSPF (SHA, lebih modern — key chain)
R1(config)# key chain OSPF-KEYS
R1(config-keychain)# key 1
R1(config-keychain-key)# key-string RahasiaKuat
R1(config-keychain-key)# cryptographic-algorithm hmac-sha-256
R1(config-if)# ip ospf authentication key-chain OSPF-KEYS

# EIGRP
R1(config)# key chain EIGRP-KEYS
R1(config-keychain)# key 1
R1(config-keychain-key)# key-string RahasiaKuat
R1(config-if)# ip authentication mode eigrp 100 md5
R1(config-if)# ip authentication key-chain eigrp 100 EIGRP-KEYS

# BGP
R1(config-router)# neighbor 10.0.0.2 password RahasiaKuat
```

> [!TIP]
> **Autentikasi + passive-interface adalah dua kontrol keamanan routing paling dasar.** Terapkan keduanya di semua jaringan produksi.

---

## 11. Memilih Protokol

| Kebutuhan | Pilihan |
|---|---|
| Jaringan sangat kecil, stub | **Static** |
| Enterprise multi-vendor | **OSPF** |
| Enterprise all-Cisco, ingin konvergensi tercepat | **EIGRP** |
| Service provider, backbone besar | **IS-IS** atau OSPF |
| Antar-AS / internet | **BGP** (tidak ada alternatif) |
| Data center modern (spine-leaf) | **eBGP** (bahkan di dalam DC) |
| Multi-homing ke banyak ISP | **BGP** |
| Warisan/lab sederhana | RIP (hindari di produksi) |

> [!TIP]
> **Tren modern:** BGP semakin dipakai di dalam data center (bukan hanya antar-AS), karena skalabilitas, kontrol kebijakan yang eksplisit, dan implementasinya yang sangat matang. Desain "BGP everywhere" dengan eBGP unnumbered kini umum di spine-leaf (`16-datacenter-cloud-sdn/01`).

---

## 12. Ringkasan

- **IGP** (dalam AS, cari jalur terbaik) vs **EGP/BGP** (antar-AS, tegakkan kebijakan).
- **Distance vector** ("routing by rumor"): hanya tahu jarak & arah dari tetangga; rentan count to infinity; ditambal dengan split horizon, route poisoning, poison reverse, holddown, triggered update.
- **Link state**: setiap router punya LSDB identik dan menjalankan Dijkstra sendiri; konvergensi cepat dan bebas loop; biayanya CPU/memori. Area membatasi cakupan.
- **Path vector (BGP)**: memakai AS_PATH untuk mencegah loop dan path attributes untuk kebijakan.
- Reference bandwidth OSPF default (100 Mbps) tidak bisa membedakan link ≥100 Mbps. Selalu naikkan dan samakan nilainya di semua router.
- Konvergensi = deteksi + propagasi + perhitungan + FIB. BFD memberi deteksi 50-150 ms tanpa membebani timer protokol.
- Timer yang terlalu agresif menyebabkan flapping yang lebih merusak daripada konvergensi lambat.
- **`passive-interface default` + aktifkan eksplisit** adalah praktik keamanan yang benar.
- **Selalu aktifkan autentikasi** protokol routing di jaringan produksi.
- **Dijkstra** (forward search, Confirmed/Tentative) memastikan cost node yang dikonfirmasi sudah minimum; kompleksitas O((N+E) log N), jarang menjadi bottleneck konvergensi.
- **Bellman-Ford**: `D_x(y) = min_v { c(x,v) + D_v(y) }`. Kabar baik cepat, kabar buruk lambat (count to infinity). Split horizon dan poison reverse hanya menolong loop dua router.
- **Path vector** mencegah loop berapa pun panjangnya dengan memeriksa jalur, tetapi membayar dengan path exploration. Link-state bisa mengalami microloop saat FIB diperbarui tidak serentak.

---

## 13. Latihan

1. Jelaskan perbedaan mendasar informasi yang dimiliki router pada distance vector dan link state.
2. Apa itu count to infinity dan sebutkan tiga mekanisme yang mencegahnya?
3. Kenapa link state pada dasarnya bebas loop, sementara distance vector membutuhkan banyak tambalan?
4. Sebuah jaringan memakai OSPF dengan link 1 Gbps dan 10 Gbps. Semua jalur tampak setara. Kenapa, dan bagaimana memperbaikinya?
5. Kenapa BGP tidak memakai metrik tunggal seperti IGP?
6. Jelaskan apa yang terjadi kalau Anda tidak mengonfigurasi passive-interface pada interface yang menghadap pengguna.
7. Kapan Anda memilih static route dibanding protokol dinamis, walaupun jaringannya cukup besar?
8. Pada graf enam router di bagian 8, jalankan Dijkstra dari **SBY** dengan metode Confirmed/Tentative. Tuliskan isi kedua daftar di setiap langkah, lalu tabel routing akhir SBY (tujuan, cost, next hop).
9. Masih pada graf yang sama, **link SMG-YOG putus**. (a) Untuk tujuan SMG, apa next hop lama dan baru di YOG dan di SBY? (b) Router mana yang kemungkinan memperbarui FIB lebih dulu, dan microloop apa yang bisa terjadi? (c) Apakah trafik JKT ke SMG ikut terdampak? (d) Sebutkan dua cara mencegah atau memperpendek microloop itu.

<details>
<summary>Jawaban</summary>

1. **Distance vector**: router hanya mengetahui jarak (metrik) dan arah (next hop) ke setiap tujuan, yaitu informasi yang ia terima dari tetangganya. Ia tidak punya gambaran topologi dan tidak bisa memverifikasi kebenaran informasi itu; ia hanya percaya. **Link state**: setiap router menerima LSA dari semua router di area dan membangun LSDB yang identik (peta topologi lengkap). Dari peta itu ia menghitung sendiri jalur terpendek dengan Dijkstra, sehingga tidak bergantung pada penilaian router lain.

2. **Count to infinity** terjadi ketika sebuah jaringan mati, tetapi informasi lama tentangnya masih beredar di antara router. Dua router saling belajar dari informasi basi masing-masing, sehingga metrik terus meningkat tanpa henti sementara paket berputar di antara mereka.
   **Mekanisme pencegahan:** (a) **maximum hop count**: RIP mendefinisikan 16 sebagai infinity, sehingga durasi loop terbatas; (b) **split horizon**: jangan iklankan rute kembali ke arah asal pembelajarannya; (c) **route poisoning**: saat rute hilang, iklankan dengan metrik infinity alih-alih diam; (d) **poison reverse**: split horizon dengan mengirim metrik infinity secara eksplisit; (e) **holddown timer**: abaikan informasi baru tentang rute yang baru hilang selama periode tertentu; (f) **triggered update**: kirim perubahan segera, jangan menunggu timer periodik.

3. Karena pada link state setiap router memiliki peta topologi lengkap yang identik dan menghitung jalurnya sendiri dari peta itu. Router tidak pernah "percaya" pada kesimpulan router lain. Ia hanya menerima fakta tentang link (siapa terhubung ke siapa dengan cost berapa), lalu menyimpulkan sendiri. Karena semua router menghitung dari data yang sama, hasilnya konsisten dan tidak mungkin dua router saling menunjuk sebagai jalur ke tujuan yang sama.
   Distance vector menyebarkan kesimpulan, bukan fakta ("saya bisa mencapai X dalam N hop"). Router penerima tidak bisa memverifikasi apakah jalur itu sebenarnya melewati dirinya sendiri, sehingga loop mungkin terjadi dan seluruh mekanisme tambalan diperlukan untuk mendeteksi serta memutusnya.

4. Karena reference bandwidth OSPF default adalah 100 Mbps, dan cost dihitung `100.000.000 / bandwidth` dengan pembulatan minimum 1. Link 100 Mbps, 1 Gbps, 10 Gbps, dan 100 Gbps semuanya menghasilkan cost 1. OSPF tidak bisa membedakannya, sehingga memilih jalur berdasarkan tie-breaker yang tidak relevan.
   **Perbaikan:** naikkan reference bandwidth, mis. `auto-cost reference-bandwidth 100000` (100 Gbps). Setelah itu: 1 Gbps → cost 100, 10 Gbps → cost 10, 100 Gbps → cost 1. Hati-hati: nilai ini harus sama di semua router dalam domain OSPF, atau perhitungan jalur menjadi tidak konsisten dan bisa menyebabkan routing suboptimal atau loop sementara.

5. Karena BGP menyelesaikan masalah yang berbeda. IGP mencari jalur teknis terbaik dalam satu organisasi yang punya tujuan seragam. BGP menghubungkan organisasi yang berbeda dengan kepentingan bisnis yang berbeda, dan seringkali jalur "terbaik" secara teknis bukan jalur yang ingin dipakai. Contoh: sebuah ISP mungkin memilih jalur yang 2 hop lebih panjang karena melewati peering gratis alih-alih transit berbayar. Karena itu BGP memakai path attributes (LOCAL_PREF, AS_PATH, MED, COMMUNITY) yang bisa dimanipulasi untuk mencerminkan kebijakan, dan algoritma seleksi bertingkat yang memberi operator kendali penuh atas prioritas kriteria. Metrik tunggal tidak bisa mengekspresikan "lebih murah", "sesuai kontrak", atau "hindari negara tertentu".

6. Router akan mengirim hello/update protokol routing ke jaringan pengguna. Konsekuensinya: (a) **risiko keamanan serius**: siapa pun yang menancapkan perangkat di jaringan itu bisa membentuk adjacency dan menyuntikkan rute palsu untuk mengalihkan trafik ke dirinya sendiri (MITM) atau ke lubang hitam (DoS); (b) **pemborosan bandwidth dan CPU**: hello dikirim terus-menerus ke segmen yang tidak punya router; (c) pada jaringan multicast, setiap host menerima dan memproses paket itu; (d) informasi topologi jaringan bocor ke pengguna. Perbaikan: `passive-interface default` lalu `no passive-interface` hanya pada interface yang benar-benar menghadap router lain, ditambah autentikasi protokol routing.

7. Beberapa situasi: (a) **jaringan stub dengan satu jalan keluar**: sebesar apa pun jaringan internalnya, kalau hanya ada satu uplink maka tidak ada keputusan routing yang perlu dibuat ke luar; default route statis sudah optimal; (b) **batas administratif/keamanan**: Anda tidak ingin bertukar informasi routing dengan pihak lain (mitra, penyedia, DMZ), sehingga static memberi kontrol dan permukaan serangan minimal; (c) **kebijakan eksplisit**: Anda ingin trafik tertentu melewati jalur tertentu terlepas dari metrik; (d) **perangkat dengan sumber daya sangat terbatas**; (e) **backup route** dengan floating static + IP SLA, dikombinasikan dengan protokol dinamis untuk jalur utama. Dalam praktik, jaringan besar sering memakai kombinasi: dinamis di inti, statis di tepi.

8. Dijkstra dari SBY:

   | Langkah | Masuk Confirmed | Tentative setelah langkah | Catatan |
   |---|---|---|---|
   | 1 | (SBY,0,-) | (DPS,2,DPS) (YOG,3,YOG) (SMG,6,SMG) | Tetangga langsung SBY |
   | 2 | (DPS,2,DPS) | (YOG,3,YOG) (SMG,6,SMG) | Lewat DPS ke YOG = 2+9 = 11, tidak lebih baik dari 3 |
   | 3 | (YOG,3,YOG) | (SMG,4,YOG) (BDG,10,YOG) | Lewat YOG ke SMG = 3+1 = 4 < 6: ganti. Ke BDG = 3+7 = 10 |
   | 4 | (SMG,4,YOG) | (BDG,8,YOG) (JKT,9,YOG) | Lewat SMG ke BDG = 4+4 = 8 < 10: ganti. Ke JKT = 4+5 = 9 |
   | 5 | (BDG,8,YOG) | (JKT,9,YOG) | Lewat BDG ke JKT = 8+2 = 10, tidak lebih baik dari 9 |
   | 6 | (JKT,9,YOG) | kosong | Selesai |

   Tabel routing SBY: DPS 2 via DPS; YOG 3 via YOG; SMG 4 via YOG; BDG 8 via YOG; JKT 9 via YOG. Link langsung SBY-SMG (cost 6) tidak terpakai sama sekali, karena jalur SBY-YOG-SMG hanya bercost 4.

9. (a) Sebelum putus: YOG ke SMG langsung (1); SBY ke SMG via YOG (3+1 = 4). Sesudah putus: YOG ke SMG via SBY (3+6 = 9, lebih murah dari via BDG 7+4 = 11); SBY ke SMG langsung (6).
   (b) YOG mendeteksi putusnya link sendiri, sehingga biasanya ia memasang FIB baru lebih dulu: SMG via SBY. Selama SBY belum menerima LSA dan memperbarui FIB, SBY masih mengirim trafik ke SMG lewat YOG. Akibatnya paket ke SMG memantul YOG ↔ SBY sampai SBY selesai konvergen atau TTL habis.
   (c) **Tidak.** JKT mencapai SMG lewat link langsung JKT-SMG (cost 5), sebelum dan sesudah gangguan; jalurnya tidak melewati link yang putus maupun pasangan YOG-SBY. Yang terdampak adalah trafik dari YOG, SBY, dan DPS menuju SMG, ditambah trafik lain yang kebetulan memakai link YOG-SBY selama link itu dipenuhi paket yang memantul.
   (d) Contoh: (1) tunda pemasangan FIB di router lokal (YOG) sesaat setelah mendeteksi gangguan, agar SBY memperbarui lebih dulu (prinsip oFIB, RFC 6976); (2) siapkan jalur cadangan yang dijamin bebas loop sebelum gangguan terjadi, misalnya LFA (RFC 5286) atau TI-LFA dengan Segment Routing, sehingga YOG langsung memakai jalur yang tidak kembali ke dirinya; (3) percepat penyebaran informasi (BFD, flooding cepat, timer SPF awal yang kecil) untuk memperpendek jendela microloop.

</details>

---

## 14. Sumber

- RFC 1058 / 2453 (RIP) · RFC 2328 (OSPFv2) · RFC 7868 (EIGRP) · RFC 4271 (BGP-4)
- RFC 5880, Bidirectional Forwarding Detection (BFD)
- Cisco CCNA 200-301 v1.1, topik 3.2 (bagaimana router mengambil keputusan forwarding)
- Dijkstra, E. W. (1959), *A Note on Two Problems in Connexion with Graphs*
- Computer Networks: A Systems Approach, 3.4 Routing (distance vector, link state, forward search): https://book.systemsapproach.org/internetworking/routing.html
- RFC 4271, A Border Gateway Protocol 4 (BGP-4), bagian 10 (MinRouteAdvertisementIntervalTimer): https://www.rfc-editor.org/rfc/rfc4271
- RFC 5286, Basic Specification for IP Fast Reroute: Loop-Free Alternates: https://www.rfc-editor.org/rfc/rfc5286
- RFC 5715, A Framework for Loop-Free Convergence: https://www.rfc-editor.org/rfc/rfc5715
- RFC 6976, Framework for Loop-Free Convergence Using the Ordered Forwarding Information Base (oFIB) Approach: https://www.rfc-editor.org/rfc/rfc6976
- RFC 8405, Shortest Path First (SPF) Back-Off Delay Algorithm for Link-State IGPs: https://www.rfc-editor.org/rfc/rfc8405
- RFC 5398, Autonomous System (AS) Number Reservation for Documentation Use: https://www.rfc-editor.org/rfc/rfc5398
- Labovitz, Ahuja, Bose, Jahanian (2000), Delayed Internet Routing Convergence: https://doi.org/10.1145/347057.347428
- Griffin, Shepherd, Wilfong (2002), The Stable Paths Problem and Interdomain Routing: https://doi.org/10.1109/90.993304
- Gao & Rexford (2001), Stable Internet Routing Without Global Coordination: https://doi.org/10.1109/90.974523
- CIDR Report (jumlah AS dan prefix): https://www.cidr-report.org/as2.0/

Subbagian 8.1 (algoritma forward search dengan daftar Confirmed/Tentative) dan 8.4 (batas split horizon) mengadaptasi penjelasan dari *Computer Networks: A Systems Approach*, Larry Peterson & Bruce Davie, © Elsevier 2012, https://github.com/SystemsApproach/book, lisensi CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Perubahan: diterjemahkan ke bahasa Indonesia, diringkas, dan contoh graf serta tabel diganti dengan contoh baru.

---

**Berikutnya:** `07-routing-lanjutan/03-rip.md`. Protokol distance vector klasik.

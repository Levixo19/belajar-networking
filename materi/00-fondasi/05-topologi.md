# 00.5 Topologi Jaringan

> **Prasyarat:** `00-fondasi/01`
> **Tujuan:** Anda bisa memilih topologi yang tepat untuk sebuah kebutuhan, menghitung jumlah link, dan menjelaskan trade-off antara biaya, keandalan, dan kinerja.

---

## 1. Topologi Fisik vs Topologi Logis

Ini pembeda yang sering membingungkan pemula, padahal sederhana:

- **Topologi fisik** — bagaimana kabel benar-benar terpasang.
- **Topologi logis** — bagaimana data benar-benar mengalir.

Keduanya **sering berbeda**.

Contoh klasik: **Token Ring**. Kabelnya terhubung ke satu hub pusat (MAU) — fisiknya **star**. Tapi data berputar dari satu stasiun ke stasiun berikutnya — logisnya **ring**.

Contoh modern: **Wi-Fi**. Secara fisik tidak ada kabel sama sekali; secara logis semua klien berkomunikasi lewat satu AP — logisnya **star**.

Contoh yang paling sering Anda temui: **VLAN**. Secara fisik semua PC menancap ke switch yang sama (star). Secara logis mereka berada di jaringan-jaringan terpisah yang tidak bisa saling bicara tanpa router.

> [!TIP]
> Saat membuat dokumentasi, Anda hampir selalu perlu **dua diagram**: diagram fisik (rak, kabel, port) dan diagram logis (subnet, VLAN, routing). Dibahas di `17-desain-arsitektur/03`.

---

## 2. Topologi Dasar

### 2.1 Point-to-Point

Dua node, satu link.

```
[A]────────[B]
```

- **Kelebihan:** paling sederhana, bandwidth penuh, tidak ada perebutan media.
- **Kekurangan:** hanya untuk dua node.
- **Dipakai:** link WAN antar-router, uplink switch, koneksi serial, radio point-to-point.

### 2.2 Bus

Semua node menempel pada satu kabel bersama (backbone) yang ujung-ujungnya diberi terminator.

```
        │       │       │       │
     ═══╧═══════╧═══════╧═══════╧═══   (terminator di kedua ujung)
       [A]     [B]     [C]     [D]
```

- **Dipakai dulu:** Ethernet 10BASE5 (thicknet) dan 10BASE2 (thinnet), 1980-90-an.
- **Kelebihan:** hemat kabel, murah.
- **Kekurangan yang mematikan:**
  - Satu kabel putus → **seluruh jaringan mati**.
  - Semua node berbagi satu **collision domain** → makin banyak node, makin sering tabrakan.
  - Sulit sekali dilacak saat rusak.
  - Terminator hilang → sinyal memantul → jaringan kacau.

**Status: mati total.** Anda perlu mengenalnya hanya untuk memahami dari mana CSMA/CD berasal (`03-data-link/01`) dan untuk ujian sertifikasi.

> [!WARNING]
> Catatan penting: sebuah **hub** menciptakan bus secara logis meskipun kabelnya berbentuk star. Semua kelemahan bus di atas berlaku pada hub.

### 2.3 Ring

Setiap node terhubung ke dua tetangga; data berputar satu arah (atau dua arah pada dual ring).

```
      [A]───[B]
       │      │
      [D]───[C]
```

- **Dipakai dulu:** Token Ring (IBM), FDDI. Sekarang: **cincin serat metro/SDH**, cincin RPR, dan ring pada jaringan provider.
- **Kelebihan:** tidak ada tabrakan (token menentukan giliran); dual ring memberi jalur cadangan otomatis.
- **Kekurangan:** satu node/link putus memutus cincin (kecuali dual ring); menambah node harus memutus cincin sementara.

> [!TIP]
> Meski Token Ring mati, **topologi cincin fisik sangat hidup** di jaringan operator serat: ring memberi dua jalur ke setiap titik dengan kabel jauh lebih hemat daripada mesh.

### 2.4 Star (Bintang)

Semua node terhubung ke satu perangkat pusat (switch).

```
          [A]
           │
   [B]───[SW]───[C]
           │
          [D]
```

- **Ini topologi LAN modern.** Hampir semua jaringan kabel yang Anda temui hari ini adalah star.
- **Kelebihan:**
  - Satu kabel putus hanya memutus satu node.
  - Mudah menambah/mengurangi node.
  - Mudah dilacak (satu kabel = satu port = satu perangkat).
  - Dengan switch: setiap port punya collision domain sendiri, full duplex.
- **Kekurangan:** perangkat pusat adalah **single point of failure**; butuh lebih banyak kabel.

Mitigasi SPOF: switch redundan + link ganda (`03-data-link/05` EtherChannel, `07-routing-lanjutan/08` FHRP).

### 2.5 Extended Star / Tree (Hierarki)

Star bertingkat — inilah bentuk nyata jaringan kampus.

```
                     [Core SW]
                    ╱         ╲
           [Distrib SW1]    [Distrib SW2]
            ╱     │            │     ╲
      [Acc1]  [Acc2]        [Acc3]  [Acc4]
        │││     │││           │││     │││
       PC PC   PC PC         PC PC   PC PC
```

- **Kelebihan:** skalabel, mudah dipetakan ke gedung/lantai, mudah menerapkan kebijakan per lapisan.
- **Kekurangan:** kegagalan di lapisan atas berdampak luas → wajib redundansi.
- Ini yang menjadi **desain 3-tier** (lihat §3).

### 2.6 Mesh

**Full mesh** — setiap node terhubung ke setiap node lain.

```
      [A]═══[B]
       ║ ╲ ╱ ║
       ║  ╳  ║
       ║ ╱ ╲ ║
      [D]═══[C]
```

Jumlah link full mesh:
```
L = n(n − 1) / 2
```
| n node | Link dibutuhkan |
|---|---|
| 4 | 6 |
| 5 | 10 |
| 10 | 45 |
| 20 | 190 |
| 50 | 1.225 |

Itulah sebabnya full mesh tidak scalable — pertumbuhannya kuadratik.

**Partial mesh** — hanya jalur penting yang diredundansi. Kompromi yang dipakai di dunia nyata (backbone WAN, core data center).

- **Kelebihan mesh:** sangat tahan gangguan, banyak jalur alternatif, load sharing.
- **Kekurangan:** mahal (kabel, port, interface), kompleks (routing harus memilih dari banyak jalur), sulit di-troubleshoot.

**Dipakai:** backbone ISP, interkoneksi core router, WAN antar-data-center, Wi-Fi mesh.

### 2.7 Hub-and-Spoke (Star pada skala WAN)

Satu pusat (hub site), banyak cabang (spoke).

```
   [Cabang A]     [Cabang B]
         ╲          ╱
          [Kantor Pusat]
         ╱          ╲
   [Cabang C]     [Cabang D]
```

- **Kelebihan:** murah, kontrol terpusat (semua trafik lewat pusat → mudah difilter & diinspeksi).
- **Kekurangan:** trafik cabang↔cabang harus memutar lewat pusat (**tromboning**) → latency ekstra & beban di pusat; pusat = SPOF.
- **Dipakai:** WAN MPLS klasik, VPN perusahaan, arsitektur hub VPC di cloud.
- **Evolusi:** DMVPN dan SD-WAN memungkinkan tunnel spoke-to-spoke dinamis, menghilangkan tromboning (`11-wan-vpn/01–02`).

### 2.8 Hybrid

Kombinasi — inilah kenyataan hampir semua jaringan:
- Star di lantai (access),
- Partial mesh di core,
- Hub-and-spoke ke cabang,
- Ring di jalur serat metro.

---

## 3. Topologi Arsitektural (Yang Diuji di CCNA)

### 3.1 Three-Tier (Core, Distribution, Access)

```
   ┌──────────────── CORE ────────────────┐
   │   Kecepatan tinggi, tanpa policy      │
   │   Tugas: forward secepat mungkin      │
   └────┬──────────────────────┬───────────┘
        │                      │
   ┌────┴──────── DISTRIBUTION ┴───────────┐
   │   Routing antar-VLAN, ACL, QoS,       │
   │   summarization, batas failure domain │
   └────┬──────────────────────┬───────────┘
        │                      │
   ┌────┴─────────── ACCESS ───┴───────────┐
   │   Port untuk end device, PoE,         │
   │   port security, VLAN assignment      │
   └───────────────────────────────────────┘
```

| Lapisan | Tugas utama | Yang **tidak** boleh dilakukan |
|---|---|---|
| **Access** | Menghubungkan end device, PoE, VLAN, port security, 802.1X | Routing rumit, policy berat |
| **Distribution** | Agregasi, inter-VLAN routing, ACL, QoS marking, summarization, redundansi | Terhubung langsung ke end device |
| **Core** | Meneruskan trafik antar-distribution secepat mungkin, redundansi penuh | ACL/policy yang memperlambat (kecuali sangat diperlukan) |

Kenapa dipisah? Karena setiap lapisan punya **kebutuhan berbeda**: access butuh banyak port murah, core butuh sedikit port sangat cepat. Memisahkan juga membatasi **failure domain**.

### 3.2 Two-Tier (Collapsed Core)

Core dan distribution digabung. Untuk jaringan kecil-menengah (satu gedung, < ~1.000 user).

```
   ┌──── COLLAPSED CORE / DISTRIBUTION ────┐
   └────┬──────────────────────┬───────────┘
      [Access SW]          [Access SW]
```

- **Kelebihan:** lebih murah, lebih sederhana, latency lebih rendah (lebih sedikit hop).
- **Kapan naik ke 3-tier:** saat jumlah switch distribution bertambah sehingga saling menghubungkannya jadi rumit, atau saat butuh memisahkan gedung/failure domain.

### 3.3 Spine-Leaf (Topologi Data Center)

```
        [Spine1]      [Spine2]      [Spine3]
         ╱  │  ╲       ╱  │  ╲       ╱  │  ╲
        ╱   │   ╲     ╱   │   ╲     ╱   │   ╲
   [Leaf1] [Leaf2] [Leaf3] [Leaf4]  ...
      ││      ││      ││      ││
   server   server  server  server
```

Aturan:
- **Setiap leaf terhubung ke SETIAP spine.** Tidak ada leaf-ke-leaf, tidak ada spine-ke-spine.
- Server hanya menempel ke leaf (leaf = ToR, *Top of Rack*).

Kenapa lahir? Karena pola trafik data center berubah:
- Dulu **north-south** (klien luar → server) dominan → 3-tier cocok.
- Sekarang **east-west** (server ↔ server: microservice, storage, replikasi, AI training) dominan → butuh jalur pendek dan seragam antar-server.

**Keunggulan spine-leaf:**
1. **Latency deterministik** — setiap server ke server lain selalu tepat 2 hop (leaf→spine→leaf). Tidak ada jalur "jauh".
2. **ECMP** — semua uplink dipakai bersamaan (bukan diblok STP). Bandwidth tumbuh linier dengan jumlah spine.
3. **Skalabilitas horizontal** — kapasitas kurang? Tambah spine. Port kurang? Tambah leaf.
4. **Failure domain kecil** — satu spine mati hanya mengurangi kapasitas 1/N, tidak memutus apa pun.

Biasanya dipakai bersama routing L3 sampai ke leaf (eBGP) + overlay VXLAN/EVPN. Detail penuh di `16-datacenter-cloud-sdn/01–02`.

**Oversubscription ratio** — perbandingan bandwidth ke server vs bandwidth uplink:
```
Leaf: 48 port × 25G ke server = 1.200G
      6 port × 100G ke spine   =   600G
Oversubscription = 1200 : 600 = 2:1
```
Rasio 3:1 umum untuk workload biasa; 1:1 (non-blocking) untuk HPC/AI.

### 3.4 Perbandingan

| | Three-tier | Two-tier | Spine-leaf |
|---|---|---|---|
| Untuk | Kampus besar | Kantor kecil-menengah | Data center |
| Trafik dominan | North-south | North-south | East-west |
| Hop antar-endpoint | Bervariasi | Sedikit | Selalu sama (2) |
| Loop prevention | STP | STP | Routing L3 + ECMP |
| Skala | Vertikal (perangkat lebih besar) | Terbatas | Horizontal (tambah spine/leaf) |
| Biaya awal | Tinggi | Rendah | Sedang-tinggi |

---

## 4. Redundansi dan Failure Domain

### Single Point of Failure (SPOF)

Komponen yang bila gagal memutus layanan. Latihan mental yang harus jadi kebiasaan:

> Tunjuk setiap kotak dan setiap garis di diagram Anda, lalu tanya: *"Kalau ini mati sekarang, apa yang berhenti?"*

SPOF yang sering terlupakan (bukan hanya perangkat jaringan):
- Satu catu daya di switch
- Satu UPS / satu jalur listrik PLN
- Satu ISP (walau ada dua router!)
- Satu jalur kabel fisik (dua serat dalam satu galian yang sama = satu backhoe memutus keduanya)
- Satu server DNS / DHCP
- Satu orang yang tahu password

### Tingkat redundansi

| Model | Arti | Contoh |
|---|---|---|
| **N** | Tanpa redundansi | 1 switch |
| **N+1** | Satu cadangan untuk N unit | 3 PSU untuk beban 2 PSU |
| **2N** | Duplikasi penuh | Dua jalur listrik terpisah, dua switch identik |
| **2N+1** | Duplikasi penuh + cadangan | Data center Tier IV |

### Failure domain

Area yang terdampak oleh satu kegagalan. Prinsip desain:

> **Buat failure domain sekecil mungkin, dan buat batasnya jelas.**

Contoh: kalau semua 500 PC berada di satu VLAN besar, satu broadcast storm melumpuhkan 500 PC. Kalau dipecah menjadi 10 VLAN per lantai, storm hanya melumpuhkan 50 PC.

### Ketersediaan (availability math)

| Uptime | Downtime/tahun | Downtime/bulan | Istilah |
|---|---|---|---|
| 99% | 3,65 hari | 7,2 jam | "dua sembilan" |
| 99,9% | 8,76 jam | 43,8 menit | "tiga sembilan" |
| 99,99% | 52,6 menit | 4,4 menit | "empat sembilan" |
| 99,999% | 5,26 menit | 26 detik | "lima sembilan" |

Untuk komponen **seri** (semua harus hidup), availability dikalikan:
```
Switch 99,9% → Router 99,9% → Firewall 99,9%
Total = 0,999³ = 99,7%   ← lebih buruk daripada komponen mana pun!
```

Untuk komponen **paralel** (cukup satu hidup):
```
Dua switch 99,9% paralel
Total = 1 − (0,001)² = 99,9999%
```

Pelajaran: **rantai seri menurunkan keandalan; paralel menaikkannya secara dramatis.** Karena itu redundansi bernilai besar — asal tidak ada SPOF tersembunyi yang membuat "paralel" itu semu (mis. dua switch tapi satu catu daya bersama).

> [!WARNING]
> Redundansi juga menambah **kompleksitas**, dan kompleksitas menyebabkan outage. Banyak insiden besar berasal dari mekanisme failover yang gagal atau salah konfigurasi, bukan dari perangkat yang mati. Uji failover secara berkala — redundansi yang tidak pernah diuji adalah asumsi, bukan fakta.

---

## 5. Memilih Topologi: Panduan Praktis

| Kebutuhan | Topologi |
|---|---|
| Rumah / kantor < 20 user | Star tunggal (satu switch + AP) |
| Kantor 20-200 user, 1 gedung | Two-tier (collapsed core) |
| Kampus/gedung banyak, > 500 user | Three-tier |
| Data center, trafik east-west | Spine-leaf |
| WAN banyak cabang, kontrol terpusat | Hub-and-spoke |
| WAN cabang saling bicara intensif | Partial mesh / SD-WAN dengan tunnel dinamis |
| Backbone provider | Ring (metro) + partial mesh (core) |
| Cakupan area luas tanpa kabel | Wi-Fi mesh |

Pertanyaan yang menentukan pilihan:
1. Berapa banyak endpoint sekarang, dan dalam 3-5 tahun?
2. Pola trafiknya ke mana — keluar (north-south) atau antar-internal (east-west)?
3. Berapa lama downtime yang bisa diterima? (menentukan level redundansi)
4. Berapa anggaran, termasuk biaya operasional & keahlian tim?
5. Apakah ada batasan fisik (jarak, jalur kabel, ruang rak, daya, pendinginan)?

---

## 6. Praktik: Baca Topologi dari Jaringan Nyata

```bash
# Lihat tetangga langsung (Linux dengan lldpd terpasang)
$ lldpctl

# Lacak jalur ke tujuan → menunjukkan topologi logis L3
$ traceroute -n 8.8.8.8
$ mtr -n 8.8.8.8

# Pindai perangkat di subnet lokal (hanya di jaringan Anda sendiri)
$ ip neigh show
$ arp-scan --localnet
```

Di Cisco:
```
SW1# show cdp neighbors detail
SW1# show lldp neighbors
SW1# show spanning-tree           ← memperlihatkan topologi logis L2 setelah STP
R1#  show ip route                ← topologi logis L3
```

> [!TIP]
> **Gabungan `show cdp neighbors` di setiap switch = peta topologi fisik.** Ini cara cepat membuat dokumentasi jaringan yang tidak terdokumentasi. Otomasinya dibahas di `15-otomasi/03`.

---

## 7. Kesalahan Umum

> [!WARNING]
> **1. Menyamakan diagram fisik dan logis.** Dua PC di switch yang sama bisa berada di jaringan yang sepenuhnya terpisah (VLAN berbeda).

> [!WARNING]
> **2. Redundansi tanpa memeriksa jalur bersama.** Dua uplink ke switch yang sama bukan redundansi terhadap kegagalan switch. Dua serat di satu duct bukan redundansi terhadap galian.

> [!WARNING]
> **3. Menganggap full mesh selalu terbaik.** Biaya dan kompleksitasnya tumbuh kuadratik; partial mesh biasanya pilihan rasional.

> [!WARNING]
> **4. Memakai spine-leaf untuk kantor biasa.** Spine-leaf memecahkan masalah east-west di data center; di kantor ia hanya menambah biaya.

> [!WARNING]
> **5. Lupa bahwa Wi-Fi adalah media bersama.** Menambah AP tanpa merencanakan kanal justru menurunkan kinerja karena co-channel interference (`10-wireless/01`).

> [!WARNING]
> **6. Failure domain terlalu besar.** Satu VLAN untuk seluruh perusahaan = satu masalah untuk seluruh perusahaan.

---

## 8. Ringkasan

- Topologi fisik ≠ topologi logis. Selalu dokumentasikan keduanya.
- Bus dan ring (Token Ring) sudah usang di LAN; **star** adalah standar LAN modern.
- Extended star/tree → **two-tier** (kecil) atau **three-tier** (besar).
- **Spine-leaf** untuk data center: setiap leaf ke setiap spine, 2 hop selalu, ECMP, skala horizontal.
- Full mesh butuh n(n−1)/2 link → tidak scalable; partial mesh adalah kompromi nyata.
- Hub-and-spoke murah & terkontrol, tapi menyebabkan tromboning.
- Availability: komponen seri mengalikan (menurunkan), paralel meningkatkan drastis.
- Perkecil failure domain; uji failover — redundansi yang tak diuji hanyalah asumsi.

---

## 9. Latihan

1. Berapa link untuk full mesh 8 router? Bagaimana kalau bertambah jadi 12?
2. Jaringan Anda: 6 switch access di 3 lantai, ~180 user, 1 gedung, budget terbatas. Topologi apa yang Anda rekomendasikan dan mengapa?
3. Dua PC menancap ke switch yang sama tetapi tidak bisa saling ping. Sebutkan dua kemungkinan penyebab yang berkaitan dengan perbedaan topologi fisik/logis.
4. Availability firewall 99,95%, router 99,99%, switch 99,99%, dipasang seri. Berapa availability total?
5. Kenapa spine-leaf tidak memakai STP untuk mencegah loop?
6. Sebutkan tiga SPOF yang tidak berbentuk perangkat jaringan.

<details>
<summary>Jawaban</summary>

1. n=8: 8×7/2 = **28 link**. n=12: 12×11/2 = **66 link**. Penambahan 4 router menambah 38 link — inilah pertumbuhan kuadratik.

2. **Two-tier / collapsed core**: sepasang switch distribution/core (redundan, di-stack atau MLAG) + 6 switch access, masing-masing dengan dua uplink ke pasangan core. Alasan: 180 user dalam satu gedung tidak memerlukan pemisahan core-distribution; two-tier lebih murah, lebih sedikit hop, lebih sederhana dikelola, dan tetap menghilangkan SPOF di lapisan agregasi.

3. (a) Keduanya di **VLAN berbeda** — fisik satu switch, logis dua jaringan terpisah; butuh routing. (b) Keduanya di VLAN sama tapi **subnet IP berbeda** (salah konfigurasi alamat). Kemungkinan lain: port protection/private VLAN, ACL, atau firewall host.

4. 0,9995 × 0,9999 × 0,9999 = 0,99930... ≈ **99,93%** (≈ 6,1 jam downtime per tahun). Perhatikan hasilnya lebih buruk daripada komponen terlemah sekalipun.

5. Karena spine-leaf memakai **routing Layer 3 (biasanya eBGP) dengan ECMP** antar leaf dan spine, bukan bridging L2. Loop dicegah oleh mekanisme routing (AS_PATH/TTL), dan semua jalur paralel dipakai bersamaan. STP justru akan memblok sebagian uplink dan membuang kapasitas — hal yang persis ingin dihindari desain ini.

6. Contoh: satu sumber listrik/UPS; satu sistem pendingin; satu server DNS/DHCP/autentikasi; satu ISP; satu jalur kabel fisik (duct/galian); satu orang yang memegang kredensial; satu lisensi yang kedaluwarsa; satu sistem NTP (waktu tidak sinkron merusak autentikasi & log).

</details>

---

## 10. Sumber

- Cisco, *Enterprise Campus Infrastructure Design Guide* (hierarchical model)
- Cisco CCNA 200-301 v1.1, topik 1.2: two-tier, three-tier, spine-leaf, WAN, SOHO, on-premises & cloud
- Clos, C. (1953), *A Study of Non-Blocking Switching Networks* — dasar matematis spine-leaf
- TIA-942 — standar infrastruktur telekomunikasi data center

---

**Berikutnya:** `01-model-referensi/01-osi.md`. Kerangka berpikir yang akan Anda pakai seumur karier.

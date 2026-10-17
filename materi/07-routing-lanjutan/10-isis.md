# 07.10 IS-IS

> **Prasyarat:** `07-routing-lanjutan/02-konsep-routing-dinamis`, `07-routing-lanjutan/04-ospf` (LSDB, SPF, area, DR/BDR)
> **Tujuan:** Anda paham kenapa backbone ISP memakai IS-IS, bisa membaca NET dan LSDB IS-IS, merancang hierarki L1/L2, mengonfigurasi IS-IS di Cisco IOS XE/IOS XR, Junos, MikroTik RouterOS v7, dan FRRouting, serta mendiagnosis adjacency dan sinkronisasi LSDB yang gagal.

> > [!NOTE]
> > **OSPF adalah IGP enterprise, IS-IS adalah IGP operator.** Hampir semua yang Anda pelajari di modul OSPF (link state, LSDB, Dijkstra) berlaku di sini. Yang berbeda adalah "kemasannya", dan justru kemasan itulah yang membuat IS-IS disukai di backbone besar. Modul ini juga menjadi prasyarat Tahap 22 (MPLS, Segment Routing, L3VPN).

---

## 1. Kenapa ISP dan Backbone Memilih IS-IS

Di modul `07-routing-lanjutan/02-konsep-routing-dinamis` Anda membaca rekomendasi "service provider, backbone besar: IS-IS atau OSPF". Dua-duanya protokol link state, dua-duanya memakai Dijkstra, dan dua-duanya bisa membawa ribuan prefiks. Lalu kenapa banyak operator besar memilih IS-IS untuk inti jaringannya?

**1. IS-IS tidak berjalan di atas IP.** Paket IS-IS dibungkus langsung di frame data link (LLC di Ethernet), bukan di dalam paket IP seperti OSPF (protokol IP 89). Akibatnya:
- Penyerang dari internet tidak bisa mengirim paket IS-IS ke router Anda dari jauh. Paket IS-IS tidak bisa dirutekan; ia hanya hidup di satu link.
- Kesalahan pengalamatan IP (subnet salah, alamat bentrok) tidak serta-merta mematikan protokol routing-nya.

**2. Ekstensibel lewat TLV.** Isi paket IS-IS adalah deretan blok *Type-Length-Value*. Fitur baru cukup menambah tipe TLV baru; router lama yang tidak mengenal sebuah TLV akan mengabaikannya tetapi tetap meneruskannya saat flooding. Begitulah IS-IS mendapat dukungan IPv6 (RFC 5308), Traffic Engineering (RFC 5305), dan Segment Routing (RFC 8667) tanpa perlu "versi baru". Bandingkan dengan OSPF yang butuh protokol terpisah (OSPFv3) untuk IPv6.

**3. Satu protokol untuk IPv4 dan IPv6.** Satu adjacency, satu LSDB, satu proses. Untuk operator yang menjalankan dual-stack di ratusan router, ini menghemat banyak pekerjaan operasional.

**4. Model data yang sederhana.** OSPF punya tujuh-an tipe LSA dengan aturan flooding yang berbeda-beda. IS-IS hanya punya satu jenis LSP per level: setiap router menerbitkan LSP berisi "siapa tetangga saya" dan "prefiks apa yang saya punya". Backbone datar ratusan router dalam satu level sudah lazim.

**5. Basis keahlian.** Sebagian alasannya historis. Ketika backbone internet besar dibangun pada 1990-an, sejumlah operator memilih IS-IS, dan pengalaman operasional serta fitur vendor (TE, SR, fast reroute) banyak dikembangkan dan diuji di sana lebih dulu. Akibatnya, dokumentasi, sertifikasi SP (Cisco SPCOR, Juniper JNCIS-SP), dan lowongan kerja di operator cenderung menganggap IS-IS sebagai default.

> [!WARNING]
> **Ini bukan berarti OSPF "kalah".** Banyak operator, termasuk yang besar, menjalankan OSPF dengan baik. Perbandingan yang adil ada di bagian 16. Yang penting: kalau Anda ingin bekerja di NOC atau tim core ISP, Anda harus fasih keduanya.

### Karakteristik IS-IS

| Aspek | Nilai |
|---|---|
| Jenis | **Link state** |
| Algoritma | **Dijkstra SPF**, dijalankan terpisah per level |
| Metrik | **Default 10 per interface** (tidak dihitung dari bandwidth); narrow 6 bit atau wide 24 bit |
| Administrative Distance | **115** (Cisco, FRR); Junos memakai *preference* 15/18 (L1/L2 internal) |
| Transport | **Langsung di atas data link** (LLC DSAP/SSAP 0xFE), bukan IP |
| Alamat tujuan | MAC multicast **01-80-C2-00-00-14** (AllL1ISs), **01-80-C2-00-00-15** (AllL2ISs) |
| Standar | ISO/IEC 10589, RFC 1195 (Integrated IS-IS), RFC 5305, RFC 5308, RFC 5120 |
| Hierarki | **Level 1** (dalam area) dan **Level 2** (antar-area/backbone) |
| IPv6 | Bawaan lewat TLV, tanpa versi protokol baru |

---

## 2. Sejarah Singkat: dari OSI ke Integrated IS-IS

IS-IS lahir di dunia **OSI**, tumpukan protokol yang pada 1980-an dirancang sebagai pesaing TCP/IP. Di dunia OSI, protokol network layer-nya bernama **CLNP** (*Connectionless Network Protocol*, ISO 8473), dan layanannya disebut **CLNS**. Protokol routing intra-domain untuk CLNP itulah IS-IS, yang dikembangkan dari pekerjaan DEC untuk DECnet Phase V lalu distandarkan sebagai **ISO/IEC 10589**.

Pada 1990, **RFC 1195** menambahkan kemampuan membawa prefiks IP ke dalam IS-IS. Hasilnya disebut **Integrated IS-IS** (atau *Dual IS-IS*): satu protokol yang bisa merutekan CLNP dan IP sekaligus. OSI kemudian tidak pernah populer, CLNP praktis lenyap, tetapi IS-IS bertahan sebagai IGP untuk IP.

Warisan OSI ini menjelaskan istilah-istilahnya yang terasa asing:

| Istilah IS-IS (OSI) | Padanan sehari-hari |
|---|---|
| **IS** (*Intermediate System*) | Router |
| **ES** (*End System*) | Host |
| **Circuit** | Interface |
| **SNPA** (*Subnetwork Point of Attachment*) | Alamat data link (MAC, DLCI) |
| **PDU** (*Protocol Data Unit*) | Paket |
| **NSAP / NET** | Alamat node (bagian 3) |
| **LSP** (*Link State PDU*) | Kira-kira gabungan LSA tipe 1 dan 2 OSPF |
| **DIS** (*Designated Intermediate System*) | Padanan DR di OSPF |
| **Domain** | Autonomous system (bagian yang menjalankan IS-IS) |

> [!TIP]
> Perintah Cisco seperti `show clns neighbors` dan `show clns interface` adalah sisa era CLNS. Perintah itu masih berguna, dan Anda akan menemukannya di banyak runbook NOC.

---

## 3. Alamat: NSAP, NET, dan System ID

OSPF mengenali router lewat Router ID 32 bit. IS-IS mengenali router lewat **NET** (*Network Entity Title*), yaitu alamat NSAP dengan byte terakhir (NSEL) bernilai `00`. Bahkan di jaringan yang hanya merutekan IP, setiap router IS-IS **wajib** punya NET.

```
NET:  49.0001.0000.0000.0002.00
      ──┬──────── ──────┬─────── ┬
        │               │        └── NSEL = 00 (selalu 00 untuk router)
        │               └── System ID (6 byte, unik di seluruh domain)
        └── Area ID (AFI 49 + nomor area 0001)
```

| Bagian | Panjang | Arti |
|---|---|---|
| **AFI** | 1 byte | `49` = alamat privat (seperti RFC 1918 untuk NSAP). Hampir semua jaringan IP memakai 49 |
| **Area ID** | 0-12 byte setelah AFI | Nomor area pilihan Anda, mis. `0001` |
| **System ID** | **6 byte** (12 digit hex) | Identitas router, wajib unik |
| **NSEL** | 1 byte | `00` untuk router itu sendiri |

Panjang NET bervariasi (8 sampai 20 byte), tetapi pembacaannya selalu dari **belakang**: byte terakhir NSEL, 6 byte sebelumnya System ID, sisanya di depan adalah Area ID.

### Dari alamat loopback ke System ID

Ada dua kebiasaan yang umum di operator:

```
Cara 1: dari IPv4 loopback, setiap oktet dipad 3 digit
  10.1.255.2 → 010.001.255.002 → 0100.0125.5002
  NET: 49.0001.0100.0125.5002.00

Cara 2: nomor urut atau ID inventaris
  router ke-2 → 0000.0000.0002
  NET: 49.0001.0000.0000.0002.00
```

Cara 1 memudahkan pemetaan System ID ke loopback saat membaca LSDB. Cara 2 lebih pendek. Yang penting **konsisten** dan terdokumentasi.

### Aturan yang tidak boleh dilanggar

```
✓ System ID unik di seluruh domain (bukan hanya di area)
✓ Semua router di area yang sama punya Area ID yang sama
✓ Satu router boleh punya sampai 3 area address (berguna saat migrasi/menggabungkan area)
✓ NSEL selalu 00
```

> [!WARNING]
> **System ID duplikat adalah salah satu gangguan IS-IS yang paling membingungkan.** Dua router dengan System ID sama akan saling menimpa LSP. Masing-masing melihat "LSP-nya sendiri" datang dengan nomor urut lebih tinggi, lalu menerbitkan ulang dengan nomor lebih tinggi lagi. LSDB terus berubah, SPF terus berjalan, dan log dipenuhi pesan tentang LSP milik sendiri. Selalu periksa duplikasi saat mengganti perangkat.

### Nama, bukan angka

System ID 12 digit sulit dibaca. **Dynamic Hostname** (RFC 5301, TLV 137) membuat setiap router menyisipkan nama host-nya ke LSP, sehingga perintah `show` menampilkan `r2.00-00` alih-alih `0000.0000.0002.00-00`. Aktifkan selalu: di Cisco `hostname dynamic` (aktif secara default di banyak versi), di FRR aktif secara default.

---

## 4. Level, Area, dan Hierarki

IS-IS membagi routing menjadi dua tingkat:

| Level | Cakupan | Router tahu apa |
|---|---|---|
| **Level 1 (L1)** | Di dalam satu area | Topologi lengkap areanya sendiri. Untuk tujuan di luar area: kirim ke router L1/L2 terdekat |
| **Level 2 (L2)** | Antar-area (backbone) | Topologi backbone dan prefiks dari semua area |

Setiap router punya salah satu dari tiga peran:

| Tipe router | Adjacency | Peran |
|---|---|---|
| **L1** | Hanya L1, hanya dengan router di area yang sama | Router akses/internal area. Mirip router di OSPF *totally stubby area* |
| **L2** | Hanya L2, dengan router area mana pun | Router inti (backbone) |
| **L1/L2** | L1 dan L2 sekaligus | Gerbang area ke backbone. Mirip ABR di OSPF |

> [!WARNING]
> **Default di Cisco IOS adalah L1/L2** pada semua router dan semua interface. Kalau Anda tidak mengatur `is-type`, setiap router membentuk adjacency L1 *dan* L2, menyimpan dua LSDB, dan menjalankan dua SPF. Jaringan tetap jalan, tetapi boros. Tentukan peran dengan sengaja.

### Batas area ada di link, bukan di router

Inilah perbedaan konseptual terbesar dengan OSPF:

```
OSPF:  batas area ada DI DALAM router (ABR)
       interface Gi0/0 di area 0, interface Gi0/1 di area 1

IS-IS: setiap router berada di SATU area (sesuai NET-nya)
       batas area ada di LINK antara dua router beda area
```

Akibatnya, **backbone IS-IS bukanlah area tertentu**. Tidak ada "area 0". Backbone L2 adalah **rantai router yang mampu L2 dan saling bersambung**, dari area mana pun. Di lab modul ini, r2 (area 49.0001), r5 (area 49.0000), dan r3 (area 49.0002) bersama-sama membentuk backbone L2.

```
   Area 49.0001             Backbone L2               Area 49.0002

   r1 (L1) ────── r2 (L1/L2) ──── metrik 100 ──── r3 (L1/L2) ────── r4 (L1)
                      │                               │
                      └──────── r5 (L2-only) ─────────┘
                               area 49.0000
```

> [!WARNING]
> **Backbone L2 harus bersambung (contiguous).** Kalau rantai router L2 terputus menjadi dua pulau, kedua pulau tidak bisa saling mencapai lewat IS-IS. IS-IS tidak punya virtual link seperti OSPF.

### Aturan adjacency per level

| Router A | Router B | Area sama? | Adjacency yang terbentuk |
|---|---|---|---|
| L1 | L1 | Ya | L1 |
| L1 | L1 | Tidak | **Tidak ada** |
| L1 | L1/L2 | Ya | L1 |
| L1/L2 | L1/L2 | Ya | L1 dan L2 |
| L1/L2 | L1/L2 | Tidak | L2 saja |
| L2 | L2 atau L1/L2 | Bebas | L2 |
| L1 | L2 | Bebas | **Tidak ada** |

### Bagaimana prefiks berpindah antar-level

```
L1 → L2 : OTOMATIS (RFC 1195). Router L1/L2 mengiklankan prefiks
          yang dapat dicapai di areanya ke dalam LSP L2-nya.
L2 → L1 : TIDAK, secara default. Router L1 hanya mendapat default
          route menuju router L1/L2 yang memasang ATT bit (bagian 11).
          Kalau perlu, prefiks L2 bisa "dibocorkan" (route leaking).
```

---

## 5. Enkapsulasi dan Format PDU

### Di atas Ethernet

```
┌──────────────┬──────────────┬────────┬──────┬──────┬──────┬─────────────────┐
│ MAC tujuan   │ MAC sumber   │ Length │ DSAP │ SSAP │ Ctrl │ PDU IS-IS       │
│ 01-80-C2-    │              │ (802.3)│ 0xFE │ 0xFE │ 0x03 │ (maks 1497 byte │
│ 00-00-14/15  │              │        │      │      │      │  pada MTU 1500) │
└──────────────┴──────────────┴────────┴──────┴──────┴──────┴─────────────────┘
```

IS-IS memakai frame IEEE 802.3 dengan header LLC 3 byte, bukan EtherType. Karena itu PDU IS-IS terbesar di link ber-MTU 1500 adalah **1497 byte**. Angka ini akan muncul lagi saat membahas hello padding dan masalah MTU.

> [!TIP]
> Di Wireshark, filter tampilan untuk IS-IS adalah `isis`. Karena tidak ada header IP, filter `ip` tidak akan menangkapnya.

### Header umum (8 byte, ada di semua PDU)

| Field | Ukuran | Nilai |
|---|---|---|
| Intradomain Routing Protocol Discriminator | 1 | `0x83` (penanda IS-IS) |
| Length Indicator | 1 | Panjang header |
| Version/Protocol ID Extension | 1 | `1` |
| ID Length | 1 | `0` berarti System ID 6 byte |
| PDU Type | 1 (5 bit) | Lihat tabel berikut |
| Version | 1 | `1` |
| Reserved | 1 | `0` |
| Maximum Area Addresses | 1 | `0` berarti 3 |

### Sembilan jenis PDU

| PDU Type | Nama | Fungsi |
|---|---|---|
| 15 | **L1 LAN IIH** | Hello L1 di link broadcast |
| 16 | **L2 LAN IIH** | Hello L2 di link broadcast |
| 17 | **P2P IIH** | Hello di link point-to-point (satu PDU untuk L1 dan L2) |
| 18 | **L1 LSP** | Informasi link state level 1 |
| 20 | **L2 LSP** | Informasi link state level 2 |
| 24 / 25 | **L1 / L2 CSNP** | Daftar lengkap isi LSDB (ringkasan) |
| 26 / 27 | **L1 / L2 PSNP** | Permintaan LSP atau acknowledgment |

Bandingkan dengan OSPF: Hello ↔ IIH, LSU/LSA ↔ LSP, DBD ↔ CSNP, LSR dan LSAck ↔ PSNP.

### TLV yang paling sering Anda temui

| TLV | Nama | Dipakai di | Sumber |
|---|---|---|---|
| 1 | Area Addresses | IIH, LSP | ISO 10589 |
| 2 | IS Reachability (narrow) | LSP | ISO 10589 |
| 6 | IS Neighbors (MAC tetangga) | LAN IIH | ISO 10589 |
| 8 | Padding | IIH | ISO 10589 |
| 9 | LSP Entries | CSNP, PSNP | ISO 10589 |
| 10 | Authentication | Semua | ISO 10589, RFC 5304, RFC 5310 |
| 22 | **Extended IS Reachability** (wide) | LSP | RFC 5305 |
| 128 / 130 | IP Internal / External Reachability (narrow) | LSP | RFC 1195 |
| 129 | Protocols Supported (NLPID) | IIH, LSP | RFC 1195 |
| 132 | IP Interface Address | IIH, LSP | RFC 1195 |
| 135 | **Extended IP Reachability** (wide) | LSP | RFC 5305 |
| 137 | Dynamic Hostname | LSP | RFC 5301 |
| 222 / 229 / 235 / 237 | Multi-Topology (IS, MT, IPv4, IPv6) | IIH, LSP | RFC 5120 |
| 232 / 236 | IPv6 Interface Address / IPv6 Reachability | IIH, LSP | RFC 5308 |
| 240 | Point-to-Point Three-Way Adjacency | P2P IIH | RFC 5303 |
| 242 | Router Capability (dipakai SR) | LSP | RFC 7981 |

---

## 6. Adjacency: Hello, Three-Way, Point-to-Point vs Broadcast

### Hello (IIH)

Router mengirim IIH secara periodik ke setiap interface yang aktif IS-IS. Holding time (padanan dead interval) dibawa **di dalam IIH**, sehingga kedua sisi tidak harus memakai timer yang sama, berbeda dengan OSPF yang mewajibkan hello/dead identik.

| Platform | Hello | Multiplier | Holding time |
|---|---|---|---|
| Cisco IOS/IOS XE (default) | 10 s | 3 | 30 s |
| Cisco, router yang menjadi DIS | sepertiga hello biasa (sekitar 3,3 s) | | |
| FRR (diamati di lab) | 3 s | 10 | 30 s |

### Hello padding dan MTU

Secara default, IIH **diisi padding (TLV 8) sampai ukuran MTU penuh**. Tujuannya cerdik: kalau MTU kedua sisi berbeda, hello dari sisi ber-MTU besar tidak akan sampai ke sisi ber-MTU kecil, sehingga adjacency **tidak terbentuk sama sekali**. Lebih baik gagal di awal daripada adjacency "Up" lalu LSP besar diam-diam hilang di tengah jalan.

```
r2 (MTU 1500) ── IIH 1497 byte ──X  r1 (MTU 1400)   ← dibuang, terlalu besar
r2 (MTU 1500) X── IIH 1397 byte ─── r1 (MTU 1400)   ← diterima
→ r2 melihat r1 tetapi r1 tidak pernah melihat r2: macet di Initializing
```

Di jaringan nyata, padding penuh pada setiap hello menghabiskan bandwidth di link lambat. Banyak platform menyediakan opsi padding hanya saat adjacency dibentuk (FRR: `isis hello padding during-adjacency-formation`).

### Tiga-arah (three-way) di LAN

Di link broadcast, LAN IIH membawa **TLV 6 (IS Neighbors)** berisi MAC address semua tetangga yang hello-nya sudah diterima. Router baru menganggap adjacency **Up** setelah melihat MAC-nya sendiri di hello tetangga. Ini mekanisme dua arah yang sama dengan OSPF 2-WAY.

### Tiga-arah di point-to-point (RFC 5303)

ISO 10589 aslinya hanya punya handshake dua arah di P2P: begitu menerima hello, adjacency langsung Up, walaupun hello kita belum tentu sampai ke seberang. RFC 5303 menambahkan **TLV 240** dengan tiga state:

```
Down          → belum menerima hello dari tetangga
Initializing  → menerima hello, tetapi tetangga belum melaporkan melihat kita
Up            → tetangga melaporkan melihat kita (System ID kita ada di TLV 240)
```

> [!WARNING]
> **Interop:** sebagian implementasi Cisco IOS lama tidak mengirim TLV 240 versi lengkap secara default. Dokumentasi MikroTik mencatat bahwa router Cisco perlu `isis three-way-handshake ietf` agar adjacency P2P dengan RouterOS terbentuk; template lab netlab untuk Cisco IOS juga menambahkannya pada link point-to-point.

### Point-to-point atau broadcast?

| | Broadcast (default di Ethernet) | Point-to-point |
|---|---|---|
| Hello | L1 LAN IIH dan L2 LAN IIH terpisah | Satu P2P IIH |
| DIS dan pseudonode | Ya | Tidak |
| Sinkronisasi LSDB | CSNP periodik dari DIS | CSNP saat adjacency naik, PSNP sebagai ack |
| Node di graf SPF | Router + pseudonode | Router saja |

> [!TIP]
> **Praktik terbaik:** seperti di OSPF, ubah link Ethernet yang hanya berisi dua router menjadi point-to-point (`isis network point-to-point`). Tidak ada pemilihan DIS, tidak ada pseudonode, graf SPF lebih kecil, dan konvergensi lebih cepat. Hampir semua link core ISP dikonfigurasi begini.

> [!WARNING]
> **Tipe jaringan harus sama di kedua sisi.** Satu sisi broadcast, satu sisi P2P: keduanya mengirim jenis IIH yang berbeda dan adjacency tidak terbentuk.

### Syarat pembentukan adjacency

```
✓ Level kompatibel (is-type router dan circuit-type interface)
✓ Untuk L1: minimal satu area address sama
✓ System ID berbeda
✓ MTU sama (karena hello padding)
✓ Tipe jaringan sama (P2P vs broadcast)
✓ Autentikasi hello cocok
✓ Interface tidak passive
✓ Dukungan protokol kompatibel (IPv4/IPv6 di single topology, lihat bagian 10)
```

Perhatikan apa yang **tidak** ada di daftar: hello/holding time tidak harus sama, dan tidak ada "area type" seperti stub flag OSPF.

---

## 7. DIS dan Pseudonode

### Pemilihan DIS

Di setiap segmen broadcast, router memilih satu **DIS** untuk masing-masing level:

```
1. Priority interface TERTINGGI menang (0-127, default 64)
2. Kalau seri → SNPA (MAC address) TERTINGGI menang
```

Perbedaan penting dengan DR di OSPF:

| | OSPF DR | IS-IS DIS |
|---|---|---|
| Preemption | **Tidak** (DR bertahan sampai mati) | **Ya**, router berprioritas lebih tinggi langsung mengambil alih |
| Backup | Ada BDR | **Tidak ada** backup; kalau DIS mati, dipilih ulang |
| Priority 0 | Tidak pernah menjadi DR | **Tetap bisa** menjadi DIS (hanya prioritas terendah) |
| Adjacency | DROTHER hanya FULL dengan DR/BDR | **Semua router membentuk adjacency dengan semua router** di LAN |
| Per level | Satu DR | DIS L1 dan DIS L2 bisa berbeda router |

Karena tidak ada BDR dan pemilihan ulang cepat, IS-IS tidak terlalu dirugikan oleh preemption. Tetapi ingat: setiap pergantian DIS berarti LSP pseudonode baru dan SPF ulang di seluruh level.

### Pseudonode

Segmen LAN dengan N router tidak digambarkan sebagai full mesh N(N-1)/2 link, tetapi sebagai **satu node virtual** yang disebut **pseudonode**. Setiap router mengiklankan satu link ke pseudonode; DIS menerbitkan **LSP pseudonode** yang mendaftar semua router di segmen itu dengan metrik 0.

```
Fisik:   r1 ──┬── r2           Graf SPF:  r1 ──10──► [r2.03] ◄──10── r2
              │                                 (pseudonode)
            (LAN)                           metrik pseudonode → router = 0
```

LSP ID pseudonode memakai System ID milik DIS ditambah **Circuit ID bukan nol**. Di lab, r2 adalah DIS link r1-r2 dan pseudonode-nya bernama `r2.03-00`:

```
r1# show isis database detail
...
r2.03-00                   70   0x00000001  0xdda0    1109    1/0/0
  Authentication:
    HMAC-MD5: d7c617702be780b014fd5067b6c4b28d
  Extended Reachability: 0000.0000.0002.00 (Metric: 0)
  Extended Reachability: 0000.0000.0001.00 (Metric: 0)
```

### Tugas DIS: CSNP periodik

Di LAN tidak ada acknowledgment per LSP. Sebagai gantinya, DIS mengirim **CSNP** (daftar semua LSP beserta nomor urutnya) secara periodik, default **10 detik**. Router lain membandingkannya dengan LSDB-nya: kalau ada yang kurang atau lebih tua, ia meminta lewat **PSNP**; kalau ia punya versi lebih baru, ia mem-flood LSP tersebut.

```
r2# show isis interface eth1
  Interface: eth1, State: Up, Active, Circuit Id: 0x3
    Type: lan, Level: L1, SNPA: 322b.7c1a.fead
    Level-1 Information:
      Metric: 10, Active neighbors: 1
      Hello interval: 3, Holddown count: 10, Padding: yes
      CNSP interval: 10, PSNP interval: 2
      LAN Priority: 100, is DIS
```

---

## 8. LSP, Flooding, dan Sinkronisasi

### Isi dan identitas LSP

```
LSP ID: r2.00-00   = System ID . Pseudonode ID - Nomor fragmen
                      0000.0000.0002 . 00 - 00
        r2.03-00   → pseudonode (Pseudonode ID ≠ 0) yang diterbitkan r2 sebagai DIS
        r2.00-01   → fragmen kedua LSP r2 (kalau isinya tidak muat satu PDU)
```

Header LSP setelah header umum (total 27 byte):

| Field | Ukuran | Fungsi |
|---|---|---|
| PDU Length | 2 | Panjang total PDU |
| **Remaining Lifetime** | 2 | Detik tersisa sebelum LSP kedaluwarsa (menghitung **mundur**) |
| **LSP ID** | 8 | System ID + Pseudonode ID + Nomor fragmen |
| **Sequence Number** | 4 | Naik setiap kali LSP diterbitkan ulang |
| Checksum | 2 | Melindungi isi LSP (tidak termasuk lifetime) |
| **P / ATT / OL / IS Type** | 1 | Partition repair, Attached, Overload, tipe router |

Kolom `ATT/P/OL` di `show isis database` FRR menampilkan tiga bit itu langsung.

Karena satu LSP bisa punya sampai 256 fragmen (nomor 00 sampai FF), satu router IS-IS dapat mengiklankan sangat banyak informasi tanpa mengubah struktur protokol.

### Flooding yang andal

Prinsip flooding di semua protokol link state sama. Ringkasnya (diadaptasi dari Peterson & Davie, §3.4.3):

1. Router X menerima LSP milik router Y. Kalau X belum punya LSP dari Y, ia menyimpannya.
2. Kalau X sudah punya, ia membandingkan **nomor urut**. Nomor lebih besar berarti lebih baru: simpan dan ganti yang lama. Nomor lebih kecil atau sama: buang, tidak perlu tindakan lanjut.
3. Kalau LSP yang diterima lebih baru, X meneruskannya ke **semua tetangga kecuali** tetangga asal LSP itu. Larangan mengirim balik inilah yang membuat flooding berhenti.
4. Setiap LSP punya **umur**. Router menuakan LSP yang tersimpan; kalau umurnya habis, LSP itu dibanjirkan dengan umur 0 sebagai tanda "hapus" ke seluruh jaringan.

IS-IS menerapkannya dengan beberapa kekhasan:

- **Lifetime menghitung mundur** dari MaxAge, default **1200 detik**. Router penerbit memperbarui (refresh) LSP-nya sebelum habis, default sekitar **900 detik**. Operator besar sering menaikkan lifetime sampai mendekati 65535 detik agar refresh tidak membebani jaringan.
- **Purge:** LSP dengan Remaining Lifetime 0 berarti "hapus". RFC 6232 menambahkan identitas router yang melakukan purge, sehingga purge misterius bisa dilacak (FRR: `purge-originator`).
- **Nomor urut 32 bit dan tidak berputar.** Router yang baru menyala memulai dari angka kecil. Kalau di jaringan masih beredar LSP lamanya dengan nomor lebih besar, ia menerima LSP itu, lalu menerbitkan ulang dengan nomor yang lebih tinggi lagi.
- **Flag SRM/SSN.** ISO 10589 mendeskripsikan flooding dengan dua flag per LSP per interface: *Send Routing Message* (LSP ini perlu dikirim ke interface itu) dan *Send Sequence Numbers* (perlu dikirim PSNP sebagai ack/permintaan). Anda tidak mengonfigurasinya, tetapi istilah ini muncul di debug dan dokumentasi vendor.

### CSNP dan PSNP

| | Point-to-point | Broadcast |
|---|---|---|
| Ack per LSP | **Ya, lewat PSNP** | Tidak |
| Retransmisi | LSP dikirim ulang sampai di-ack | Bergantung pada CSNP periodik dari DIS |
| CSNP | Sekali, saat adjacency naik | Periodik dari DIS (default 10 s) |
| Meminta LSP yang kurang | PSNP | PSNP |

```
Point-to-point                         Broadcast
r2 ── LSP r3.00-00 seq 7 ──► r5        DIS  ── CSNP (daftar semua LSP) ──► semua
r2 ◄── PSNP (ack seq 7) ──── r5        r1   ── PSNP "minta r3.00-00" ────► DIS
                                       DIS  ── LSP r3.00-00 ──────────────► semua
```

> [!TIP]
> Analogi dengan OSPF: CSNP mirip DBD, PSNP berperan ganda sebagai LSR dan LSAck. Bedanya, IS-IS tidak punya state machine ExStart/Exchange/Loading. Begitu adjacency Up, sinkronisasi berjalan lewat CSNP dan PSNP saja. Inilah salah satu alasan IS-IS dianggap lebih sederhana untuk dioperasikan.

---

## 9. LSDB dan SPF

Setelah setiap router di satu level memiliki LSP dari semua router lain, LSDB-nya identik, dan masing-masing menjalankan Dijkstra dengan dirinya sebagai akar. IS-IS menjalankan **SPF terpisah untuk L1 dan L2**; router L1/L2 menjalankan keduanya.

### Contoh: SPF L2 dari sudut pandang r2

Kita pakai topologi L2 lab: r2-r5 metrik 10, r5-r3 metrik 10, r2-r3 metrik 100. Algoritma *forward search* memakai dua daftar, **Confirmed** dan **Tentative**, berisi entri (Tujuan, Biaya, NextHop). Penjelasan langkahnya diadaptasi dari Peterson & Davie (§3.4.3):

| Langkah | Confirmed | Tentative | Keterangan |
|---|---|---|---|
| 1 | (r2, 0, -) | | Mulai dari diri sendiri |
| 2 | (r2, 0, -) | (r5, 10, r5), (r3, 100, r3) | Baca LSP r2: dua tetangga |
| 3 | (r2,0,-), (r5,10,r5) | (r3, 100, r3) | Pindahkan entri termurah (r5) |
| 4 | (r2,0,-), (r5,10,r5) | (r3, **20**, r5) | Baca LSP r5: r3 lewat r5 = 10+10 = 20 < 100, ganti |
| 5 | (r2,0,-), (r5,10,r5), (r3,20,r5) | kosong | Pindahkan r3. Tentative kosong, selesai |

Hasilnya sama persis dengan yang dilaporkan FRR di lab:

```
r2# show isis topology level-2
IS-IS paths to level-2 routers that speak IP
 Vertex         Type         Metric  Next-Hop  Interface  Parent
 r2
 r5             TE-IS        10      r5        eth3       r2(4)
 r3             TE-IS        20      r5        eth3       r5(4)
 10.0.255.5/32  IP TE        20      r5        eth3       r5(4)
 10.2.0.0/16    IP TE        20      r5        eth3       r3(4)
 10.2.255.3/32  IP TE        30      r5        eth3       r3(4)
 10.0.23.0/30   IP TE        120     r5        eth3       r3(4)
```

### Prefiks adalah daun

Di IS-IS, prefiks IP tidak membentuk node di graf; mereka **daun** yang menempel pada router. Kalau yang berubah hanya prefiks (mis. sebuah loopback pelanggan muncul) tanpa perubahan link antar-router, router cukup menjalankan **PRC** (*Partial Route Calculation*) yang jauh lebih murah daripada SPF penuh. Ini salah satu sumber skalabilitas IS-IS di backbone yang membawa ribuan prefiks.

### Pemeriksaan dua arah

Sebuah link hanya dipakai SPF kalau **kedua** ujungnya melaporkan link itu di LSP masing-masing. Kalau r2 bilang "saya terhubung ke r3" tetapi LSP r3 tidak menyebut r2 (mis. karena adjacency satu arah), link itu diabaikan. Ini melindungi dari jalur yang hanya bekerja satu arah.

### Throttling

Seperti OSPF, IS-IS memakai penundaan eksponensial agar SPF dan pembuatan LSP tidak berjalan terus-menerus saat jaringan tidak stabil. Di Cisco: `spf-interval` dan `lsp-gen-interval` dengan tiga nilai (tunggu maksimum, tunggu awal, tunggu kedua); di FRR: `spf-interval` dan `lsp-gen-interval` dalam detik, atau `spf-delay-ietf` (RFC 8405).

---

## 10. Metrik, TLV, IPv6, dan Multi-Topology

### Metrik default: 10, bukan bandwidth

IS-IS **tidak menghitung metrik dari bandwidth**. Setiap interface bermetrik **10** kecuali diatur manual. Link 1 Gbps dan 100 Gbps dianggap setara. Di jaringan nyata, Anda **wajib** merancang skema metrik (bagian 15).

### Narrow vs wide

| | Narrow (ISO 10589 / RFC 1195) | Wide (RFC 5305) |
|---|---|---|
| Metrik per link | **6 bit: 0-63** | **24 bit: 0-16.777.215** |
| Total jalur maksimum | 1023 | 0xFE000000 (4.261.412.864) |
| TLV IS | 2 | **22** |
| TLV prefiks IPv4 | 128 / 130 | **135** |
| Sub-TLV (TE, SR, tag) | Tidak bisa | **Bisa** |

Metrik narrow terlalu sempit untuk jaringan modern: dengan maksimum 63 per link, Anda tidak bisa membedakan 10G, 100G, dan 400G dengan halus. Lebih penting lagi, **TE, Segment Routing, dan route tag membutuhkan wide metric** karena informasinya dibawa sebagai sub-TLV di TLV 22/135.

RFC 5305 juga mendefinisikan nilai khusus: link dengan metrik maksimum (2^24 - 1) **tidak dipakai** dalam SPF normal, dan prefiks dengan metrik di atas MAX_PATH_METRIC tidak dipertimbangkan.

| Platform | Default metric-style |
|---|---|
| Cisco IOS / IOS XE / IOS XR | **narrow** |
| Junos | mengirim narrow dan wide (pakai `wide-metrics-only` untuk wide saja) |
| FRR | **wide** |
| MikroTik RouterOS v7 | **hanya wide** (menurut dokumentasi MikroTik) |

> [!WARNING]
> **Mismatch metric style menyebabkan routing hilang secara diam-diam.** Adjacency tetap Up, LSDB tersinkron, tetapi router narrow tidak mengerti TLV 22/135 dari router wide (dan sebaliknya). Akibatnya prefiks dan link "tidak terlihat". Gejala klasik saat router Cisco default (narrow) bertetangga dengan MikroTik atau FRR. Selalu set `metric-style wide` di semua router.

**Migrasi tanpa putus:** Cisco dan FRR punya `metric-style transition` yang mengirim dan menerima kedua gaya. Migrasi yang aman: semua router ke `transition`, verifikasi, lalu semua router ke `wide`.

### IPv6 di IS-IS (RFC 5308)

RFC 5308 cukup menambahkan dua TLV: **236** (IPv6 Reachability) dan **232** (IPv6 Interface Address), serta NLPID 0x8E di TLV Protocols Supported. Tidak ada protokol baru, tidak ada adjacency baru.

Masalahnya ada pada mode **single topology** (default di Cisco): satu SPF dipakai untuk IPv4 dan IPv6 sekaligus. Akibatnya **topologi IPv4 dan IPv6 harus identik**. Kalau ada satu link yang hanya menjalankan IPv4, SPF tetap menganggap link itu bisa dipakai IPv6, dan paket IPv6 dikirim ke router yang tidak bisa meneruskannya: **blackhole**. Sebagian implementasi memilih jalan lain: menolak adjacency kalau dukungan protokol kedua sisi berbeda. Itu mencegah blackhole, tetapi membuat link "hilang" dari IS-IS saat IPv6 baru diaktifkan di satu sisi.

### Multi-Topology (RFC 5120)

**MT-ISIS** menjalankan SPF terpisah per topologi:

| MT ID | Topologi |
|---|---|
| 0 | Standar (IPv4) |
| 2 | **IPv6 unicast** |
| 3 | IPv4 multicast |
| 4 | IPv6 multicast |

Router mengiklankan topologi yang ia ikuti di TLV 229, tetangga per topologi di TLV 222, dan prefiks IPv6 di TLV 237. Dengan MT, IPv6 bisa digelar link demi link tanpa risiko blackhole. **Untuk jaringan dual-stack baru, pakai MT.**

Di lab, semua router memakai `topology ipv6-unicast`. Lihat bagaimana satu LSP membawa kedua dunia:

```
r1# show isis database detail r1.00-00
r1.00-00             *    173   0x00000002  0x90c7    1142    0/0/0
  Protocols Supported: IPv4, IPv6
  Area Address: 49.0001
  MT Router Info: ipv4-unicast
  MT Router Info: ipv6-unicast
  Hostname: r1
  Extended Reachability: 0000.0000.0002.03 (Metric: 10)
  MT Reachability: 0000.0000.0002.03 (Metric: 10) ipv6-unicast
  Extended IP Reachability: 10.1.255.1/32 (Metric: 10)
  Extended IP Reachability: 10.1.12.0/29 (Metric: 10)
  MT IPv6 Reachability: 2001:db8:1:ff::1/128 (Metric: 10) ipv6-unicast
  MT IPv6 Reachability: 2001:db8:1:12::/64 (Metric: 10) ipv6-unicast
```

> [!TIP]
> Next hop rute IPv6 dari IS-IS selalu **alamat link-local** tetangga (`fe80::...`), sama seperti OSPFv3.

---

## 11. ATT Bit, Route Leaking, dan Overload Bit

### ATT bit dan default route

Router L1/L2 yang terhubung ke backbone L2 (punya adjacency L2 ke area lain) memasang **ATT bit** (*Attached*) di LSP L1-nya. Router L1 yang melihat ATT bit memasang **default route** ke router L1/L2 terdekat yang memasang bit itu.

```
r1# show ip route isis
I>* 0.0.0.0/0 [115/10] via 10.1.12.2, eth1, weight 1, 00:00:13
I>* 10.0.23.0/30 [115/110] via 10.1.12.2, eth1, weight 1, 00:00:13
I>* 10.0.25.0/30 [115/20] via 10.1.12.2, eth1, weight 1, 00:00:13
I   10.1.12.0/29 [115/20] via 10.1.12.2, eth1 inactive, weight 1, 00:00:13
I>* 10.1.255.2/32 [115/20] via 10.1.12.2, eth1, weight 1, 00:00:13
```

r1 tidak mengenal loopback r4 sama sekali, tetapi tetap bisa mencapainya lewat default route itu. Ini membuat LSDB dan tabel routing router L1 sangat kecil, ideal untuk router akses berkapasitas terbatas.

Kalau r2 kehilangan semua adjacency L2-nya, ia mencabut ATT bit, dan default route di r1 ikut hilang. Ini perilaku yang benar: r2 tidak lagi bisa membawa trafik keluar area, jadi r1 sebaiknya tidak mengirim ke sana.

### Masalah 1: routing suboptimal

```
              ┌── r2 (L1/L2) ── 100 km ──┐
r1 (L1) ──────┤                           ├── tujuan X
              └── r6 (L1/L2) ──  5 km  ───┘
```

Kalau r1 lebih dekat ke r2 (dalam metrik L1), semua trafik keluar area lewat r2, termasuk trafik ke X yang sebenarnya jauh lebih dekat lewat r6. Router L1 tidak tahu apa-apa tentang jarak di L2; ia hanya tahu "L1/L2 mana yang terdekat".

### Masalah 2: MPLS dan BGP butuh /32

Di backbone ISP, router PE perlu tahu **prefiks /32 loopback setiap PE lain**:
- LDP hanya membangun LSP untuk FEC yang cocok persis dengan entri di tabel routing. Default route tidak cukup untuk membangun LSP ke loopback PE tertentu.
- Next hop BGP (loopback PE) harus bisa diselesaikan secara spesifik.

Inilah alasan banyak operator memilih **satu level saja (L2 datar)** atau melakukan route leaking.

### Route leaking L2 → L1 (RFC 5302)

Router L1/L2 boleh membocorkan prefiks L2 terpilih ke L1. Prefiks yang dibocorkan ditandai **up/down bit** (bit dalam TLV 135). Aturannya: prefiks dengan up/down bit terpasang **tidak boleh** diiklankan kembali dari L1 ke L2. Inilah pencegah loop antar-level.

```
Cisco IOS XE
router isis INTI
 redistribute isis ip level-2 into level-1 route-map BOCOR-LOOPBACK
!
ip prefix-list LOOPBACK-PE seq 10 permit 10.0.255.0/24 ge 32
route-map BOCOR-LOOPBACK permit 10
 match ip address prefix-list LOOPBACK-PE
```

```
Cisco IOS XR
prefix-set LOOPBACK-PE
  10.0.255.0/24 eq 32
end-set
!
route-policy BOCOR-LOOPBACK
  if destination in LOOPBACK-PE then
    pass
  endif
end-policy
!
router isis INTI
 address-family ipv4 unicast
  propagate level 2 into level 1 route-policy BOCOR-LOOPBACK
```

```
Junos
set policy-options policy-statement BOCOR-LOOPBACK term pe from protocol isis
set policy-options policy-statement BOCOR-LOOPBACK term pe from level 2
set policy-options policy-statement BOCOR-LOOPBACK term pe from route-filter 10.0.255.0/24 prefix-length-range /32-/32
set policy-options policy-statement BOCOR-LOOPBACK term pe to level 1
set policy-options policy-statement BOCOR-LOOPBACK term pe then accept
set protocols isis export BOCOR-LOOPBACK
```

Di Cisco, rute hasil leaking tampil dengan kode `i ia` (inter-area) di `show ip route`.

> [!WARNING]
> **FRR 10.4 belum mendukung route leaking L2 → L1** (masih berupa usulan perubahan di repositori FRR). Lab modul ini tidak bisa memperagakannya, dan itu disengaja: ini contoh nyata bahwa fitur protokol di atas kertas tidak selalu ada di semua implementasi.

### Mengabaikan ATT bit

Kadang router L1 punya jalan keluar sendiri (mis. default route statis ke firewall) dan tidak ingin default dari ATT bit. FRR: `attached-bit receive ignore`; Junos: `set protocols isis ignore-attached-bit`; Cisco IOS XE juga menyediakan `ignore-attached-bit` di bawah `router isis`.

### Overload bit (RFC 3277)

Router yang memasang **OL bit** di LSP-nya berkata: "jangan jadikan saya jalur transit". Router lain tetap bisa mencapai prefiks yang **menempel langsung** pada router itu (loopback-nya, misalnya), tetapi tidak akan melewatkan trafik **menembus** router tersebut.

Dua pemakaian yang sangat umum di ISP:

1. **Pemeliharaan terencana.** Pasang overload, tunggu trafik pindah, baru kerjakan router. Ini cara paling bersih "mengosongkan" router tanpa mematikan adjacency.
2. **Saat boot (on-startup).** Router yang baru menyala sudah punya adjacency IGP dalam hitungan detik, tetapi BGP-nya butuh waktu lebih lama untuk menerima full table. Tanpa overload, trafik transit akan diarahkan ke router yang belum tahu rute BGP dan dibuang. Solusinya:

```
Cisco IOS XE / IOS XR : set-overload-bit on-startup wait-for-bgp
Junos                 : set protocols isis overload timeout 300
FRR                   : set-overload-bit on-startup 300
```

Di lab, ketika r5 memasang overload bit, trafik r1 ke r4 pindah dari jalur via r5 ke link langsung r2-r3 yang mahal:

```
r2# show isis database
IS-IS Level-2 link-state database:
LSP ID                  PduLen  SeqNumber   Chksum  Holdtime  ATT/P/OL
r2.00-00             *    260   0x00000006  0x8085    1118    0/0/0
r3.00-00                  260   0x00000008  0x6d07    1168    0/0/0
r5.00-00                  218   0x00000005  0xb109    1187    0/0/1

r1# traceroute -n 10.2.255.4
 1  10.1.12.2  0.006 ms  0.002 ms  0.001 ms
 2  10.0.23.2  0.002 ms  0.001 ms  0.001 ms
 3  10.2.255.4  0.001 ms  0.002 ms  0.002 ms
```

> [!TIP]
> Alternatif yang lebih halus dari overload: **advertise high/max metric** pada semua link router (FRR: `advertise-high-metrics`, RFC 3277). Router masih bisa menjadi jalur cadangan terakhir kalau tidak ada jalan lain.

---

## 12. Autentikasi

IS-IS punya tiga lingkup autentikasi yang **independen**:

| Lingkup | Melindungi | Cisco IOS XE | FRR |
|---|---|---|---|
| **Hello (interface)** | IIH di satu link | `isis authentication ...` di interface | `isis password md5 ...` |
| **Area (L1)** | LSP, CSNP, PSNP level 1 | `authentication ... level-1` di `router isis` | `area-password md5 ...` |
| **Domain (L2)** | LSP, CSNP, PSNP level 2 | `authentication ... level-2` di `router isis` | `domain-password md5 ...` |

Jenis autentikasi (semua dibawa di TLV 10):
- **Clear text** (ISO 10589): kata sandi terkirim apa adanya. Hanya mencegah salah konfigurasi, bukan serangan.
- **HMAC-MD5** (RFC 5304, auth type 54): yang paling luas didukung lintas vendor.
- **HMAC-SHA** generik (RFC 5310, auth type 3): lebih kuat, tetapi dukungan dan sintaksnya bervariasi per platform dan versi. Periksa dokumentasi platform Anda sebelum memakainya lintas vendor.

### Gejala yang perlu Anda hafalkan

```
Hello auth salah     → adjacency TIDAK terbentuk (atau putus)
Area/domain auth salah → adjacency TETAP Up, tetapi LSP DITOLAK
                         → LSDB tidak sinkron, rute hilang perlahan
```

Kasus kedua jauh lebih berbahaya. Di lab, ketika domain password r5 diganti, adjacency r5 tetap Up tetapi penghitung drop naik dan LSDB r5 membeku:

```
r5# show isis neighbor
 System Id           Interface   L  State         Holdtime SNPA
 r2                  eth1        2  Up            30       2020.2020.2020
 r3                  eth2        2  Up            29       2020.2020.2020

r5# show isis summary
  ...
  Drop counters per PDU type:
     L2 LSP: 9
```

LSP lama di LSDB r5 masih ada sampai lifetime-nya habis (hingga sekitar 20 menit dengan default 1200 detik), lalu menghilang satu per satu. Gangguan muncul jauh setelah perubahan konfigurasi dilakukan, sehingga sulit dikaitkan dengan penyebabnya.

> [!WARNING]
> **Interop Junos:** di Junos, `authentication-key` di bawah `level` secara default juga menandatangani hello, CSNP, dan PSNP (ada opsi `no-hello-authentication`, `no-csnp-authentication`, `no-psnp-authentication`). Di Cisco, autentikasi level tidak mencakup hello. Saat menghubungkan keduanya, samakan lingkup secara eksplisit.

> [!TIP]
> **Rotasi kunci** di Cisco dan IOS XR paling aman memakai **key chain** dengan `send-lifetime`/`accept-lifetime` yang tumpang tindih, sehingga kunci baru bisa dipasang di semua router sebelum kunci lama berhenti diterima.

---

## 13. IS-IS untuk Segment Routing (Pengantar)

Segment Routing (SR) adalah alasan terbaru IS-IS makin dominan di backbone. Pada SR-MPLS, IGP sendiri yang membagikan label MPLS, sehingga LDP tidak lagi diperlukan. IS-IS cukup menambahkan sub-TLV (RFC 8667):

| Informasi | Dibawa di | Artinya |
|---|---|---|
| **SRGB** (*SR Global Block*) | Sub-TLV di Router Capability (TLV 242) | Rentang label global, mis. 16000-23999 |
| **Prefix-SID** | Sub-TLV di TLV 135 / 235 / 236 / 237 | Indeks untuk sebuah prefiks (biasanya loopback). Label = SRGB awal + indeks |
| **Adjacency-SID** | Sub-TLV di TLV 22 / 222 | Label lokal untuk satu adjacency |

```
Loopback r5 10.0.255.5/32, prefix-SID index 5, SRGB 16000-23999
→ semua router memakai label 16005 untuk mencapai r5
```

Konfigurasi minimal (sintaks per dokumentasi resmi masing-masing):

```
! FRR (isisd)
router isis INTI
 segment-routing on
 segment-routing global-block 16000 23999
 segment-routing prefix 10.0.255.5/32 index 5

! Cisco IOS XR
router isis INTI
 address-family ipv4 unicast
  metric-style wide
  segment-routing mpls
 interface Loopback0
  address-family ipv4 unicast
   prefix-sid index 5
```

Perhatikan kebutuhan **wide metric**: SR tidak bisa berjalan di atas metric-style narrow. Begitu SR aktif, IS-IS juga menjadi dasar **TI-LFA** (fast reroute dengan cakupan topologi penuh) dan **Flex-Algo** (beberapa "bidang" SPF dengan kriteria berbeda, mis. latensi terendah). Semua topik itu dibahas mendalam di `22-service-provider/03-te-segment-routing`.

---

## 14. Konfigurasi Multi-Vendor

Contoh di bawah mengonfigurasi router setara r2 di lab: L1/L2 di area 49.0001, satu link L1 ke router akses, satu link L2 point-to-point ke core, loopback passive, wide metric, IPv6 multi-topology, dan autentikasi MD5.

### Cisco IOS XE

```
key chain ISIS-HELLO
 key 1
  key-string KunciHello
key chain ISIS-L2
 key 1
  key-string KunciDomain
!
router isis INTI
 net 49.0001.0100.0125.5002.00
 is-type level-1-2
 metric-style wide
 log-adjacency-changes
 passive-interface Loopback0
 set-overload-bit on-startup wait-for-bgp
 authentication mode md5 level-2
 authentication key-chain ISIS-L2 level-2
 !
 address-family ipv6
  multi-topology
 exit-address-family
!
interface Loopback0
 ip address 10.1.255.2 255.255.255.255
 ipv6 address 2001:db8:1:ff::2/128
 ip router isis INTI
 ipv6 router isis INTI
!
interface GigabitEthernet0/0/1
 description ke-akses-r1
 ip address 10.1.12.2 255.255.255.248
 ipv6 address 2001:db8:1:12::2/64
 ip router isis INTI
 ipv6 router isis INTI
 isis circuit-type level-1
 isis priority 100 level-1
 isis metric 10 level-1
!
interface TenGigabitEthernet0/0/2
 description ke-core-r5
 ip address 10.0.25.1 255.255.255.252
 ipv6 address 2001:db8:0:25::1/64
 ip router isis INTI
 ipv6 router isis INTI
 isis network point-to-point
 isis circuit-type level-2-only
 isis metric 10 level-2
 isis ipv6 metric 10 level-2
 isis authentication mode md5
 isis authentication key-chain ISIS-HELLO
```

Catatan IOS XE:
- `passive-interface` di IS-IS berarti: prefiks interface diiklankan, tetapi tidak ada hello. Perintah `ip router isis` di Loopback0 tetap diperlukan agar prefiksnya masuk.
- Pada multi-topology, metrik IPv6 diatur terpisah dengan `isis ipv6 metric`.
- Kalau bertetangga dengan MikroTik di link P2P, tambahkan `isis three-way-handshake ietf` pada interface (lihat bagian 6).

Verifikasi:

```
R2# show isis neighbors
Tag INTI:
System Id      Type Interface     IP Address      State Holdtime Circuit Id
r1             L1   Gi0/0/1       10.1.12.1       UP    9        r2.03
r5             L2   Te0/0/2       10.0.25.2       UP    27       00
R2# show clns neighbors detail
R2# show isis database detail level-2
R2# show isis topology
R2# show ip route isis
R2# show isis spf-log
R2# debug isis adj-packets
```

(Format keluaran `show isis neighbors` di atas adalah ilustrasi; kolomnya mengikuti keluaran Cisco yang terdokumentasi, tetapi nilainya disesuaikan dengan contoh ini.)

### Cisco IOS XR

IOS XR mengelompokkan semua konfigurasi IS-IS di bawah `router isis`, termasuk interface:

```
router isis INTI
 is-type level-1-2
 net 49.0001.0100.0125.5002.00
 log adjacency changes
 set-overload-bit on-startup wait-for-bgp
 lsp-password hmac-md5 clear KunciDomain level 2
 address-family ipv4 unicast
  metric-style wide
 !
 address-family ipv6 unicast
  metric-style wide
 !
 interface Loopback0
  passive
  address-family ipv4 unicast
  !
  address-family ipv6 unicast
  !
 !
 interface GigabitEthernet0/0/0/1
  circuit-type level-1
  priority 100 level 1
  address-family ipv4 unicast
   metric 10
  !
  address-family ipv6 unicast
   metric 10
  !
 !
 interface TenGigE0/0/0/2
  circuit-type level-2-only
  point-to-point
  hello-password hmac-md5 clear KunciHello
  address-family ipv4 unicast
   metric 10
  !
  address-family ipv6 unicast
   metric 10
  !
 !
!
```

Di IOS XR, adanya `address-family ipv6 unicast` membuat IPv6 berjalan sebagai topologi tersendiri (multi-topology); `single-topology` harus diminta secara eksplisit. Commit dengan `commit`, lalu verifikasi:

```
RP/0/RP0/CPU0:r2# show isis adjacency
RP/0/RP0/CPU0:r2# show isis database detail
RP/0/RP0/CPU0:r2# show isis interface brief
RP/0/RP0/CPU0:r2# show route isis
```

### Juniper Junos

Junos mewajibkan **`family iso`** di setiap interface yang menjalankan IS-IS, dan NET dipasang sebagai alamat ISO di `lo0`:

```
set interfaces lo0 unit 0 family inet address 10.1.255.2/32
set interfaces lo0 unit 0 family inet6 address 2001:db8:1:ff::2/128
set interfaces lo0 unit 0 family iso address 49.0001.0100.0125.5002.00

set interfaces ge-0/0/1 unit 0 family inet address 10.1.12.2/29
set interfaces ge-0/0/1 unit 0 family inet6 address 2001:db8:1:12::2/64
set interfaces ge-0/0/1 unit 0 family iso

set interfaces xe-0/0/2 unit 0 family inet address 10.0.25.1/30
set interfaces xe-0/0/2 unit 0 family inet6 address 2001:db8:0:25::1/64
set interfaces xe-0/0/2 unit 0 family iso

set protocols isis topologies ipv6-unicast
set protocols isis level 1 wide-metrics-only
set protocols isis level 2 wide-metrics-only
set protocols isis level 2 authentication-key "KunciDomain"
set protocols isis level 2 authentication-type md5
set protocols isis overload timeout 300

set protocols isis interface lo0.0 passive
set protocols isis interface ge-0/0/1.0 level 2 disable
set protocols isis interface ge-0/0/1.0 level 1 priority 100
set protocols isis interface ge-0/0/1.0 level 1 metric 10
set protocols isis interface xe-0/0/2.0 point-to-point
set protocols isis interface xe-0/0/2.0 level 1 disable
set protocols isis interface xe-0/0/2.0 level 2 metric 10
set protocols isis interface xe-0/0/2.0 level 2 ipv6-unicast-metric 10
```

Catatan Junos:
- **Lupa `family iso` adalah kesalahan nomor satu.** Interface muncul di `show isis interface`, tetapi tidak pernah ada adjacency.
- Level dimatikan per interface dengan `level N disable`; untuk router L2-only, matikan level 1 di tingkat protokol: `set protocols isis level 1 disable`.
- Junos memberi metrik 0 pada `lo0` secara default.
- Preference Junos: L1 internal 15, L2 internal 18, L1 external 160, L2 external 165. Ini berbeda dengan AD 115 Cisco; perhatikan saat menyusun redistribusi.

Verifikasi:

```
user@r2> show isis adjacency
user@r2> show isis interface
user@r2> show isis database extensive
user@r2> show isis spf log
user@r2> show route protocol isis
```

### MikroTik RouterOS v7

IS-IS tersedia sejak **RouterOS 7.13** (catatan rilis: "added IS-IS protocol support (CLI only)"). Fitur-fiturnya bertambah di versi-versi berikutnya: parameter `passive` pada interface-template baru ada di 7.20, dan pengaturan metric-type di 7.23. Jalankan versi terbaru dari kanal *stable* kalau Anda ingin memakai IS-IS di MikroTik.

```
/routing isis instance
add name=isis-inti afi=ip areas=49.0001 system-id=0100.0125.5002 disabled=no
/routing isis interface-template
add instance=isis-inti interfaces=lo levels=l1,l2
add instance=isis-inti interfaces=ether1 levels=l1
add instance=isis-inti interfaces=sfp-sfpplus1 levels=l2
```

Verifikasi:

```
/routing isis neighbor print
/routing route print where isis
```

Catatan RouterOS:
- Dokumentasi MikroTik menyebut implementasinya hanya mendukung **wide metric** (RFC 5305). Router Cisco tetangganya wajib `metric-style wide`.
- Untuk link P2P ke Cisco, aktifkan `isis three-way-handshake ietf` di sisi Cisco. Gejala kalau lupa: peringatan "invalid 3way tlv" di log RouterOS.
- Contoh di atas hanya memakai parameter yang muncul di dokumentasi resmi (`afi`, `areas`, `system-id`, `instance`, `interfaces`, `levels`). Nama parameter untuk metrik, autentikasi, dan tipe jaringan per interface bisa berbeda antar-versi 7.x; periksa langsung di router Anda dengan `/routing isis interface-template add ?` dan `/routing isis instance add ?`.
- Sejak 7.16, tipe rute di tabel routing bernama `isis` (sebelumnya `is-is`).

### FRRouting (isisd)

FRR memakai berkas `frr.conf` terpadu. Aktifkan `isisd=yes` di `/etc/frr/daemons`, lalu:

```
interface lo
 ip address 10.1.255.2/32
 ipv6 address 2001:db8:1:ff::2/128
 ip router isis INTI
 ipv6 router isis INTI
 isis passive
!
interface eth1
 ip router isis INTI
 ipv6 router isis INTI
 isis circuit-type level-1
 isis priority 100 level-1
 isis metric 10
!
interface eth3
 ip router isis INTI
 ipv6 router isis INTI
 isis circuit-type level-2-only
 isis network point-to-point
 isis metric 10
 isis password md5 KunciHello
!
router isis INTI
 net 49.0001.0000.0000.0002.00
 is-type level-1-2
 metric-style wide
 topology ipv6-unicast
 area-password md5 KunciArea1
 domain-password md5 KunciDomain
 set-overload-bit on-startup 300
 log-adjacency-changes
```

Catatan FRR:
- Nama setelah `router isis` (di sini `INTI`) harus sama dengan yang dipakai di `ip router isis INTI`.
- `metric-style wide` adalah default FRR, tetapi menuliskannya membuat niat Anda jelas.
- `show running-config` FRR tidak menampilkan nilai default (mis. `is-type level-1-2`).

Verifikasi:

```
show isis neighbor [detail]
show isis interface [detail]
show isis database [detail] [LSPID]
show isis topology [level-1|level-2]
show isis route
show isis summary
show isis hostname
show ip route isis
show ipv6 route isis
debug isis adj-packets
debug isis update-packets
debug isis snp-packets
```

### Padanan istilah dan perintah

| Konsep | Cisco IOS XE | IOS XR | Junos | RouterOS v7 | FRR |
|---|---|---|---|---|---|
| Proses | `router isis INTI` | `router isis INTI` | `protocols isis` | `/routing isis instance` | `router isis INTI` |
| NET | `net ...` | `net ...` | `lo0 family iso address` | `areas=` + `system-id=` | `net ...` |
| Tipe router | `is-type` | `is-type` | `level N disable` | `levels=` per template | `is-type` |
| Aktif di interface | `ip router isis` | `interface ... address-family` | `interface X.0` + `family iso` | `interface-template` | `ip router isis` |
| Point-to-point | `isis network point-to-point` | `point-to-point` | `point-to-point` | periksa versi | `isis network point-to-point` |
| Wide metric | `metric-style wide` | `metric-style wide` (per AF) | `wide-metrics-only` | selalu wide | default |
| IPv6 MT | `address-family ipv6` + `multi-topology` | `address-family ipv6 unicast` | `topologies ipv6-unicast` | periksa versi | `topology ipv6-unicast` |
| Overload saat boot | `set-overload-bit on-startup` | `set-overload-bit on-startup` | `overload timeout` | periksa versi | `set-overload-bit on-startup` |
| Tetangga | `show isis neighbors` | `show isis adjacency` | `show isis adjacency` | `/routing isis neighbor print` | `show isis neighbor` |
| LSDB | `show isis database` | `show isis database` | `show isis database` | periksa versi | `show isis database` |

---

## 15. Desain IS-IS untuk ISP Indonesia

Geografi Indonesia memberi tantangan khas: backbone antar-pulau yang panjang (kabel laut, termasuk ruas Palapa Ring), jaringan metro padat di Jawa, dan jaringan akses di daerah yang sering bergantung pada microwave atau radio dengan kualitas link berfluktuasi. Berikut prinsip desain yang bisa Anda pegang. Ini rekomendasi praktik, bukan aturan baku; sesuaikan dengan ukuran dan peralatan jaringan Anda.

### 1. Mulai dari L2 datar

Untuk ISP regional dengan puluhan sampai beberapa ratus router, **satu level L2 saja** biasanya paling sederhana:
- Semua router melihat semua /32 loopback, sehingga LDP, BGP next hop, dan SR berjalan tanpa route leaking.
- Tidak ada routing suboptimal akibat ATT bit.
- Satu LSDB, satu SPF, troubleshooting lebih mudah.

Pertimbangkan **L1/L2** hanya kalau ada alasan konkret: ratusan router akses yang kecil memorinya, atau domain akses yang tidak stabil (link radio yang sering flap) yang ingin Anda isolasi dari backbone. Kalau memakai L1, rencanakan route leaking untuk loopback PE sejak awal.

### 2. Rencana NET

```
Area ID per region (kalau multi-level) atau satu area untuk L2 datar:
  49.0001  Jabodetabek      49.0004  Sumatra
  49.0002  Jawa Barat       49.0005  Kalimantan
  49.0003  Jawa Timur-Bali  49.0006  Sulawesi dan Indonesia Timur

System ID dari loopback (cara 1, bagian 3):
  10.0.0.21 → 0100.0000.0021 → NET 49.0001.0100.0000.0021.00
```

Simpan pemetaan ini di sumber kebenaran (NetBox atau spreadsheet yang terkendali). System ID duplikat saat swap perangkat adalah insiden yang bisa dicegah.

### 3. Skema metrik

Metrik default 10 untuk semua link hampir pasti salah untuk ISP. Dua pendekatan umum:

| Pendekatan | Cara | Cocok untuk |
|---|---|---|
| Berbasis kapasitas | Metrik turun saat kapasitas naik, mis. 100G = 10, 10G = 100, 1G = 1000 | Backbone metro dengan latensi kecil |
| Berbasis latensi | Metrik sebanding dengan delay terukur (mis. 1 unit per 10 µs) | Backbone antar-pulau, karena 1.000 km kabel laut jauh lebih "mahal" daripada 1 hop metro |

Banyak operator mencampur: latensi sebagai dasar, ditambah penalti untuk kapasitas kecil. Apa pun pilihannya, **dokumentasikan dan terapkan konsisten**. Dengan SR dan Flex-Algo (Tahap 22), Anda bahkan bisa punya topologi "latensi terendah" dan "kapasitas terbesar" sekaligus.

### 4. MTU

Jalur microwave, perangkat radio, dan link sewa dari operator lain sering punya MTU yang tidak seragam. Karena hello padding, MTU mismatch langsung terlihat sebagai adjacency yang macet di **Initializing**. Itu bagus, karena masalahnya ketahuan lebih awal. Tetapi rencanakan MTU dengan memperhitungkan overhead MPLS (4 byte per label) dan VLAN/QinQ sejak awal. Standarkan MTU core (mis. 9000-an untuk link milik sendiri) dan catat pengecualiannya.

### 5. Perlindungan operasional

```
✓ set-overload-bit on-startup wait-for-bgp (atau timeout) di semua router yang membawa BGP
✓ BFD di link core untuk deteksi kegagalan sub-detik
✓ hostname dynamic dan log-adjacency-changes di semua router
✓ autentikasi MD5 (atau SHA bila semua platform mendukung) di level 2 dan hello
✓ max-lsp-lifetime dan lsp-refresh-interval dinaikkan konsisten di semua router
✓ Monitoring: jumlah adjacency, jumlah LSP, frekuensi SPF, dan drop counter
```

### 6. MikroTik di jaringan akses

Router MikroTik banyak dipakai di POP kecil dan jaringan akses ISP lokal. Kalau ingin memasukkannya ke domain IS-IS:
- Pastikan seluruh domain memakai wide metric (MikroTik hanya wide).
- Pakai RouterOS 7 versi terbaru; catatan rilis 7.17 sampai 7.24 memuat banyak perbaikan IS-IS (MTU di atas 1500, validasi three-way handshake, stabilitas).
- Uji interop di lab (containerlab mendukung MikroTik CHR via vrnetlab) sebelum produksi.
- Alternatif yang sering lebih aman: biarkan MikroTik di tepi memakai OSPF atau BGP ke PE, dan jalankan IS-IS hanya di perangkat core.

---

## 16. OSPF vs IS-IS: Perbandingan Mendalam

| Aspek | OSPF (v2/v3) | IS-IS |
|---|---|---|
| Lapisan transport | IP protokol 89 | Langsung di atas data link |
| Serangan jarak jauh | Mungkin (perlu filter/autentikasi) | Tidak mungkin dari luar link |
| IPv6 | Protokol terpisah (OSPFv3) | TLV tambahan di protokol yang sama |
| Identitas router | Router ID 32 bit | System ID 48 bit di dalam NET |
| Batas area | Di dalam router (ABR) | Di link antar-router |
| Backbone | Area 0 khusus | Rantai router L2 yang bersambung |
| Area non-backbone harus menempel ke backbone | Ya (atau virtual link) | Ya, lewat router L1/L2; tidak ada virtual link |
| Jenis unit informasi | Banyak tipe LSA (1, 2, 3, 4, 5, 7, 9-11) | Satu jenis LSP per level (+ pseudonode) |
| Ekstensi | Opaque LSA (tipe 9-11) | TLV dan sub-TLV |
| Router pusat segmen LAN | DR + BDR, non-preemptive | DIS, preemptive, tanpa backup |
| Adjacency di LAN | Hanya dengan DR/BDR | Dengan semua router |
| Sinkronisasi LSDB | State machine ExStart/Exchange/Loading | CSNP + PSNP |
| Timer hello/dead harus sama | Ya | Tidak (holding time dibawa di hello) |
| Deteksi MTU mismatch | Macet di ExStart/Exchange | Hello padding, macet di Initializing |
| Metrik default | Dari bandwidth (ref 100 Mbps) | 10 per interface |
| Tipe area khusus | Stub, totally stubby, NSSA | Router L1 sudah berperilaku seperti totally stubby |
| Summarization | Di ABR/ASBR | Di router L1/L2 (dan saat redistribusi) |
| Default route ke area | Diatur di ABR | Otomatis lewat ATT bit |
| Dukungan SR, TE, Flex-Algo | Ada (RFC 8665, 3630, 9350) | Ada (RFC 8667, 5305, 9350) |
| Ekosistem | Enterprise, kampus, CCNA | Operator, SP, sertifikasi SP |

### Kapan memilih yang mana

**Pilih OSPF** kalau jaringan Anda enterprise atau kampus, tim Anda sudah fasih OSPF, banyak perangkat (firewall, switch L3, perangkat murah) yang hanya mendukung OSPF, atau Anda butuh fitur area khusus seperti NSSA untuk menyuntikkan rute dari cabang.

**Pilih IS-IS** kalau Anda membangun backbone operator yang akan membawa MPLS/SR, dual-stack penuh, ratusan router dalam satu domain, atau Anda ingin IGP inti terisolasi dari bidang data IP.

> [!TIP]
> **Yang sering dilupakan:** konvergensi kedua protokol pada perangkat modern praktis setara. Yang menentukan kecepatan konvergensi adalah tuning (BFD, SPF/LSP throttle, FRR/TI-LFA) dan kualitas implementasi vendor, bukan pilihan OSPF atau IS-IS itu sendiri.

---

## 17. Troubleshooting IS-IS

### Alur diagnosis

```
1. Tidak ada tetangga sama sekali?
   → IS-IS aktif di interface? (show isis interface)
   → Interface passive?
   → Junos: family iso ada?
   → Level kompatibel? (is-type router dan circuit-type interface)
   → Untuk L1: area address sama?
   → Tipe jaringan sama (P2P vs broadcast)?
   → Hello authentication cocok?
   → Lihat drop counter / log PDU drop

2. Tetangga macet di Initializing?
   → MTU mismatch (hello padding)! Bandingkan MTU kedua sisi
   → Hello hanya sampai satu arah (filter L2, VLAN salah di satu sisi)
   → P2P: masalah three-way handshake (Cisco lama vs RFC 5303)

3. Adjacency Up, tetapi rute tidak ada / tidak lengkap?
   → Bandingkan LSDB di kedua sisi: nomor urut LSP yang sama?
   → Area/domain password salah → LSP ditolak (cek drop counter)
   → Metric style mismatch (narrow vs wide)
   → Single topology dengan dukungan IPv4/IPv6 berbeda
   → Router L1 tanpa default: ATT bit tidak terpasang / diabaikan?
   → Ada overload bit di jalur?

4. Jaringan berubah terus (SPF tanpa henti)?
   → System ID duplikat
   → Link flapping (cek log adjacency, pertimbangkan dampening/BFD)
```

### Kesalahan yang sering terjadi

> [!WARNING]
> **1. Membiarkan default L1/L2 di Cisco.** Semua router membentuk dua jenis adjacency, menyimpan dua LSDB, dan menjalankan dua SPF. Tentukan `is-type` dan `circuit-type` dengan sengaja.

> [!WARNING]
> **2. Mencampur narrow dan wide.** Adjacency Up, tetapi sebagian prefiks "hilang". Set `metric-style wide` di semua router.

> [!WARNING]
> **3. Lupa `family iso` di Junos.** Interface terlihat di IS-IS tetapi tidak pernah ada adjacency.

> [!WARNING]
> **4. Mengira passive interface tidak perlu `ip router isis`.** Di Cisco dan FRR, prefiks loopback hanya diiklankan kalau IS-IS diaktifkan di interface itu; `passive` hanya mematikan hello.

> [!WARNING]
> **5. Area/domain password berbeda.** Adjacency terlihat sehat, padahal LSDB perlahan basi. Selalu periksa drop counter dan nomor urut LSP saat mengganti kata sandi.

> [!WARNING]
> **6. Backbone L2 terputus.** Mengubah router di tengah backbone menjadi L1-only (atau mengubah circuit-type link) bisa membelah backbone menjadi dua pulau.

> [!WARNING]
> **7. Single topology lalu menyalakan IPv6 bertahap.** Hasilnya adjacency ditolak atau blackhole IPv6. Pakai multi-topology.

> [!WARNING]
> **8. System ID duplikat setelah swap perangkat.** Konfigurasi router lama disalin utuh ke router baru, termasuk NET-nya.

> [!WARNING]
> **9. Mengandalkan metrik default 10.** Semua link dianggap setara, sehingga trafik bisa lewat link 1G alih-alih 100G.

---

## 18. Lab: IS-IS Dua Level dengan FRR dan containerlab

### Tujuan lab

Membangun domain IS-IS dua level dengan lima router FRR, lalu mengamati DIS dan pseudonode, ATT bit, multi-topology IPv6, SPF, overload bit, dan lima skenario gangguan.

### Kebutuhan

- Linux (atau VM Linux) dengan Docker dan **containerlab** (containerlab.dev). Semua gratis.
- Image `quay.io/frrouting/frr:10.4.1` (diunduh otomatis saat deploy).
- Semua berkas lab ada di `materi/lab/kode/isis/`:

```
isis/
├── isis.clab.yml    ← topologi containerlab
├── daemons          ← mengaktifkan isisd
├── vtysh.conf       ← konfigurasi vtysh terpadu
├── r1/frr.conf
├── r2/frr.conf
├── r3/frr.conf
├── r4/frr.conf
└── r5/frr.conf
```

### Topologi dan pengalamatan

```
   Area 49.0001             Backbone L2               Area 49.0002

   r1 (L1) ────── r2 (L1/L2) ──── metrik 100 ──── r3 (L1/L2) ────── r4 (L1)
      eth1    eth1     │ eth2                  eth1 │     eth3    eth1
    (broadcast, DIS)   │ eth3                  eth2 │       (p2p)
                       └──────── r5 (L2-only) ──────┘
                            eth1  area 49.0000  eth2
```

| Router | Peran | NET | Loopback IPv4 / IPv6 |
|---|---|---|---|
| r1 | L1 | 49.0001.0000.0000.0001.00 | 10.1.255.1/32, 2001:db8:1:ff::1/128 |
| r2 | L1/L2 | 49.0001.0000.0000.0002.00 | 10.1.255.2/32, 2001:db8:1:ff::2/128 |
| r3 | L1/L2 | 49.0002.0000.0000.0003.00 | 10.2.255.3/32, 2001:db8:2:ff::3/128 |
| r4 | L1 | 49.0002.0000.0000.0004.00 | 10.2.255.4/32, 2001:db8:2:ff::4/128 |
| r5 | L2-only | 49.0000.0000.0000.0005.00 | 10.0.255.5/32, 2001:db8:0:ff::5/128 |

| Link | Subnet IPv4 | Subnet IPv6 | Level | Tipe | Metrik |
|---|---|---|---|---|---|
| r1 eth1 - r2 eth1 | 10.1.12.0/29 | 2001:db8:1:12::/64 | L1 | broadcast | 10 |
| r2 eth2 - r3 eth1 | 10.0.23.0/30 | 2001:db8:0:23::/64 | L2 | p2p, hello MD5 | **100** |
| r2 eth3 - r5 eth1 | 10.0.25.0/30 | 2001:db8:0:25::/64 | L2 | p2p | 10 |
| r3 eth2 - r5 eth2 | 10.0.35.0/30 | 2001:db8:0:35::/64 | L2 | p2p | 10 |
| r3 eth3 - r4 eth1 | 10.2.34.0/30 | 2001:db8:2:34::/64 | L1 | p2p | 10 |

Rencana alamat sengaja dibuat hierarkis: semua prefiks area 49.0001 ada di 10.1.0.0/16 dan 2001:db8:1::/48, area 49.0002 di 10.2.0.0/16 dan 2001:db8:2::/48. Alasannya dijelaskan di catatan berikut.

> [!WARNING]
> **Catatan penting tentang FRR.** Menurut RFC 1195, router L1/L2 seharusnya otomatis mengiklankan prefiks areanya ke L2. **isisd FRR 10.4 belum melakukannya**: LSP L2 router L1/L2 hanya berisi prefiks interface miliknya sendiri dan rute hasil redistribusi. Hal ini tercatat sebagai isu di repositori FRR, dan perbaikannya masih berupa pull request terbuka saat modul ini ditulis. Agar lab tetap mencerminkan perilaku standar, r2 dan r3 mengiklankan **ringkasan area** (route ke `blackhole` yang diredistribusi ke L2). Ini persis yang dilakukan `summary-address` di router Cisco, dan sekaligus mengajarkan bahwa ringkasan di batas level adalah praktik yang baik.

### Berkas topologi

```yaml
name: isis

topology:
  defaults:
    kind: linux
    image: quay.io/frrouting/frr:10.4.1
    sysctls:
      net.ipv4.ip_forward: 1
      net.ipv6.conf.all.forwarding: 1
  nodes:
    r1:
      binds:
        - daemons:/etc/frr/daemons
        - vtysh.conf:/etc/frr/vtysh.conf
        - r1/frr.conf:/etc/frr/frr.conf
      exec:
        - ip route del default
    r2:
      binds:
        - daemons:/etc/frr/daemons
        - vtysh.conf:/etc/frr/vtysh.conf
        - r2/frr.conf:/etc/frr/frr.conf
    # r3, r4, r5 serupa; r4 juga memakai exec "ip route del default"
  links:
    - endpoints: ["r1:eth1", "r2:eth1"]
      mtu: 1500
    - endpoints: ["r2:eth2", "r3:eth1"]
      mtu: 1500
    - endpoints: ["r2:eth3", "r5:eth1"]
      mtu: 1500
    - endpoints: ["r3:eth2", "r5:eth2"]
      mtu: 1500
    - endpoints: ["r3:eth3", "r4:eth1"]
      mtu: 1500
```

Tiga detail yang perlu Anda pahami:
- **`sysctls`**: container Linux tidak meneruskan paket secara default. Tanpa ini, adjacency tetap terbentuk tetapi ping lintas router gagal.
- **`exec: ip route del default`** di r1 dan r4: containerlab memberi setiap node default route ke jaringan manajemen. Default route itu (kernel, AD 0) akan mengalahkan default route dari ATT bit. Kita hapus agar perilaku ATT bit terlihat.
- **`mtu: 1500`**: default link containerlab adalah 9500. Kita pakai 1500 agar skenario MTU realistis.

### Konfigurasi router

r1 (L1 murni):

```
frr defaults traditional
hostname r1
log stdout informational
!
interface lo
 ip address 10.1.255.1/32
 ipv6 address 2001:db8:1:ff::1/128
 ip router isis INTI
 ipv6 router isis INTI
 isis passive
!
interface eth1
 ip address 10.1.12.1/29
 ipv6 address 2001:db8:1:12::1/64
 ip router isis INTI
 ipv6 router isis INTI
 isis circuit-type level-1
 isis metric 10
!
router isis INTI
 net 49.0001.0000.0000.0001.00
 is-type level-1
 metric-style wide
 topology ipv6-unicast
 area-password md5 KunciArea1
 log-adjacency-changes
!
end
```

r2 (L1/L2, gerbang area 49.0001):

```
frr defaults traditional
hostname r2
log stdout informational
!
interface lo
 ip address 10.1.255.2/32
 ipv6 address 2001:db8:1:ff::2/128
 ip router isis INTI
 ipv6 router isis INTI
 isis passive
!
interface eth1
 ip address 10.1.12.2/29
 ipv6 address 2001:db8:1:12::2/64
 ip router isis INTI
 ipv6 router isis INTI
 isis circuit-type level-1
 isis metric 10
 isis priority 100 level-1
!
interface eth2
 ip address 10.0.23.1/30
 ipv6 address 2001:db8:0:23::1/64
 ip router isis INTI
 ipv6 router isis INTI
 isis circuit-type level-2-only
 isis network point-to-point
 isis metric 100
 isis password md5 KunciHello23
!
interface eth3
 ip address 10.0.25.1/30
 ipv6 address 2001:db8:0:25::1/64
 ip router isis INTI
 ipv6 router isis INTI
 isis circuit-type level-2-only
 isis network point-to-point
 isis metric 10
!
ip route 10.1.0.0/16 blackhole
ipv6 route 2001:db8:1::/48 blackhole
!
router isis INTI
 net 49.0001.0000.0000.0002.00
 is-type level-1-2
 metric-style wide
 topology ipv6-unicast
 area-password md5 KunciArea1
 domain-password md5 KunciDomain
 redistribute ipv4 static level-2
 redistribute ipv6 static level-2
 log-adjacency-changes
!
end
```

r5 (L2-only, inti):

```
frr defaults traditional
hostname r5
log stdout informational
!
interface lo
 ip address 10.0.255.5/32
 ipv6 address 2001:db8:0:ff::5/128
 ip router isis INTI
 ipv6 router isis INTI
 isis passive
!
interface eth1
 ip address 10.0.25.2/30
 ipv6 address 2001:db8:0:25::2/64
 ip router isis INTI
 ipv6 router isis INTI
 isis circuit-type level-2-only
 isis network point-to-point
 isis metric 10
!
interface eth2
 ip address 10.0.35.2/30
 ipv6 address 2001:db8:0:35::2/64
 ip router isis INTI
 ipv6 router isis INTI
 isis circuit-type level-2-only
 isis network point-to-point
 isis metric 10
!
router isis INTI
 net 49.0000.0000.0000.0005.00
 is-type level-2-only
 metric-style wide
 topology ipv6-unicast
 domain-password md5 KunciDomain
 log-adjacency-changes
!
end
```

r3 adalah cermin r2 (area 49.0002, `area-password md5 KunciArea2`, ringkasan 10.2.0.0/16 dan 2001:db8:2::/48, eth1 ke r2 dengan metrik 100 dan hello MD5, eth2 ke r5, eth3 ke r4 sebagai L1 point-to-point). r4 adalah cermin r1 di area 49.0002 dengan link point-to-point. Konfigurasi lengkap keduanya ada di `r3/frr.conf` dan `r4/frr.conf`.

### Langkah 1: deploy

```
$ cd materi/lab/kode/isis
$ sudo containerlab deploy -t isis.clab.yml
$ docker exec -it clab-isis-r2 vtysh
```

Tunggu sekitar 30-60 detik sampai adjacency dan LSDB stabil.

### Langkah 2: periksa adjacency

```
r2# show isis neighbor
Area INTI:
 System Id           Interface   L  State         Holdtime SNPA
 r1                  eth1        1  Up            30       3a41.c5b6.53b3
 r3                  eth2        2  Up            30       2020.2020.2020
 r5                  eth3        2  Up            29       2020.2020.2020
```

Yang perlu Anda perhatikan:
- Kolom **L** menunjukkan level adjacency: 1 ke r1, 2 ke r3 dan r5.
- Pada link P2P, SNPA tampil sebagai `2020.2020.2020` (FRR tidak memakai MAC di P2P). Pada link broadcast (eth1), SNPA adalah MAC r1. Nilai MAC di lab Anda akan berbeda.
- Kolom System Id menampilkan nama berkat dynamic hostname.

### Langkah 3: amati DIS dan pseudonode

```
r1# show isis neighbor detail
 r2
    Interface: eth1, Level: 1, State: Up, Expires in 28s
    Circuit type: L1, Speaks: IPv4, IPv6
    Topologies:
      standard
      ipv6-unicast
    SNPA: 322b.7c1a.fead, LAN id: r2.03
    LAN Priority: 100, is DIS, DIS flaps: 1, Last: 5m26s ago
    Area Address(es):
      49.0001
```

r2 menjadi DIS karena priority 100 lebih tinggi dari default 64 milik r1. LAN id `r2.03` adalah nama pseudonode. Lihat LSP-nya:

```
r1# show isis database
Area INTI:
IS-IS Level-1 link-state database:
LSP ID                  PduLen  SeqNumber   Chksum  Holdtime  ATT/P/OL
r1.00-00             *    173   0x00000002  0x90c7    1142    0/0/0
r2.00-00                  219   0x00000002  0x1bb0    1154    1/0/0
r2.03-00                   70   0x00000001  0xdda0    1109    1/0/0
    3 LSPs
```

Tanda `*` menandai LSP milik router itu sendiri. Perhatikan **ATT=1** pada LSP r2.

**Tugas:** turunkan priority r2 menjadi 10 (`interface eth1` lalu `isis priority 10 level-1`). Apa yang terjadi pada nama pseudonode? Karena DIS IS-IS preemptive, r1 langsung mengambil alih dan pseudonode berganti menjadi `r1.xx-00`.

### Langkah 4: LSDB dua level di router L1/L2

```
r2# show isis database
Area INTI:
IS-IS Level-1 link-state database:
LSP ID                  PduLen  SeqNumber   Chksum  Holdtime  ATT/P/OL
r1.00-00                  173   0x00000002  0x90c7    1142    0/0/0
r2.00-00             *    219   0x00000002  0x1bb0    1154    1/0/0
r2.03-00             *     70   0x00000001  0xdda0    1109    1/0/0
    3 LSPs

IS-IS Level-2 link-state database:
LSP ID                  PduLen  SeqNumber   Chksum  Holdtime  ATT/P/OL
r2.00-00             *    260   0x00000002  0x1710    1172    0/0/0
r3.00-00                  260   0x00000002  0xd7fd    1147    0/0/0
r5.00-00                  218   0x00000002  0x03d6    1173    0/0/0
    3 LSPs
```

r2 menyimpan dua LSDB terpisah. LSP L1 r4 **tidak ada** di sini: LSP L1 tidak pernah keluar dari areanya. Lihat isi LSP L2 r2 dari sudut pandang r5:

```
r5# show isis database detail r2.00-00
r2.00-00                  260   0x00000002  0x1710    1172    0/0/0
  Protocols Supported: IPv4, IPv6
  Area Address: 49.0001
  Hostname: r2
  Extended Reachability: 0000.0000.0003.00 (Metric: 100)
  Extended Reachability: 0000.0000.0005.00 (Metric: 10)
  MT Reachability: 0000.0000.0003.00 (Metric: 100) ipv6-unicast
  MT Reachability: 0000.0000.0005.00 (Metric: 10) ipv6-unicast
  Extended IP Reachability: 10.1.12.0/29 (Metric: 10)
  Extended IP Reachability: 10.0.23.0/30 (Metric: 100)
  Extended IP Reachability: 10.1.255.2/32 (Metric: 10)
  Extended IP Reachability: 10.0.25.0/30 (Metric: 10)
  Extended IP Reachability: 10.1.0.0/16 (Metric: 0)
  MT IPv6 Reachability: 2001:db8:1::/48 (Metric: 0) ipv6-unicast
  ...
```

Ringkasan area (10.1.0.0/16 dan 2001:db8:1::/48) masuk ke L2 lewat redistribusi.

### Langkah 5: tabel routing

Router inti r5 mengenal ringkasan setiap area:

```
r5# show ip route isis
I>* 10.0.23.0/30 [115/110] via 10.0.25.1, eth1, weight 1, 00:00:13
  *                        via 10.0.35.1, eth2, weight 1, 00:00:13
I>* 10.1.0.0/16 [115/10] via 10.0.25.1, eth1, weight 1, 00:00:13
I>* 10.1.12.0/29 [115/20] via 10.0.25.1, eth1, weight 1, 00:00:13
I>* 10.1.255.2/32 [115/20] via 10.0.25.1, eth1, weight 1, 00:00:13
I>* 10.2.0.0/16 [115/10] via 10.0.35.1, eth2, weight 1, 00:00:13
I>* 10.2.34.0/30 [115/20] via 10.0.35.1, eth2, weight 1, 00:00:13
I>* 10.2.255.3/32 [115/20] via 10.0.35.1, eth2, weight 1, 00:00:13
```

Perhatikan **ECMP** ke 10.0.23.0/30: lewat r2 (10 + 100) dan lewat r3 (10 + 100) sama-sama 110. Router L1 r4 hanya mengenal areanya plus default:

```
r4# show ip route isis
I>* 0.0.0.0/0 [115/10] via 10.2.34.1, eth1, weight 1, 00:07:39
I>* 10.0.23.0/30 [115/110] via 10.2.34.1, eth1, weight 1, 00:07:39
I>* 10.0.35.0/30 [115/20] via 10.2.34.1, eth1, weight 1, 00:07:39
I   10.2.34.0/30 [115/20] via 10.2.34.1, eth1 inactive, weight 1, 00:07:39
I>* 10.2.255.3/32 [115/20] via 10.2.34.1, eth1, weight 1, 00:07:39
```

(Rute IS-IS untuk subnet yang terhubung langsung tampil `inactive` karena rute connected lebih disukai. Ini normal.)

### Langkah 6: uji ujung ke ujung

```
r1# ping 10.2.255.4
64 bytes from 10.2.255.4: seq=0 ttl=61 time=0.116 ms

r1# traceroute -n 10.2.255.4
 1  10.1.12.2  0.005 ms  0.002 ms  0.001 ms
 2  10.0.25.2  0.002 ms  0.002 ms  0.001 ms
 3  10.0.35.1  0.001 ms  0.001 ms  0.001 ms
 4  10.2.255.4  0.002 ms  0.002 ms  0.002 ms

r1# traceroute -n 2001:db8:2:ff::4
 1  2001:db8:1:12::2  0.005 ms  0.002 ms  0.008 ms
 2  2001:db8:0:25::2  0.010 ms  0.002 ms  0.002 ms
 3  2001:db8:0:35::1  0.001 ms  0.005 ms  0.001 ms
 4  2001:db8:2:ff::4  0.001 ms  0.001 ms  0.001 ms
```

(Perintah `ping` dan `traceroute` dijalankan dari shell container, mis. `docker exec clab-isis-r1 ping -c2 10.2.255.4`.)

Jalur melewati r5, bukan link langsung r2-r3 yang bermetrik 100. Itu sesuai hitungan SPF di bagian 9.

### Langkah 7: ATT bit dan overload bit

1. Di r1: `router isis INTI` lalu `attached-bit receive ignore`. Default route hilang dari `show ip route isis`. Kembalikan dengan `no attached-bit receive ignore`; default route kembali dalam beberapa puluh detik (setelah SPF berikutnya).
2. Di r2, matikan kedua link L2 dari shell: `ip link set eth2 down` dan `ip link set eth3 down`. Amati di r1: ATT bit pada LSP r2 menjadi 0 dan default route hilang. Nyalakan kembali.
3. Di r5: `router isis INTI` lalu `set-overload-bit`. Amati kolom OL di `show isis database` r2 dan jalur traceroute r1 ke r4 (sekarang lewat 10.0.23.2). Kembalikan dengan `no set-overload-bit`.

### Skenario troubleshooting

Kerjakan satu per satu. Untuk setiap skenario: buat kerusakannya, amati gejalanya, catat perintah yang membuktikan penyebabnya, lalu perbaiki.

> [!TIP]
> Aktifkan pencatatan PDU yang dibuang agar penyebab lebih mudah terlihat: di `router isis INTI` tambahkan `log-pdu-drops`, dan lihat penghitungnya di `show isis summary`.

**Skenario A: MTU mismatch.** Dari shell r1: `ip link set dev eth1 mtu 1400`.

```
r2# show isis neighbor
 System Id           Interface   L  State         Holdtime SNPA
 r1                  eth1        1  Initializing  29       3a41.c5b6.53b3
 ...
r1# show isis neighbor
Area INTI:
 System Id           Interface   L  State         Holdtime SNPA
```

r2 menerima hello r1 (1397 byte) tetapi r1 tidak pernah menerima hello r2 (1497 byte), sehingga r2 macet di **Initializing** dan r1 tidak melihat apa-apa. Dengan `debug isis adj-packets` Anda melihat panjang IIH yang dikirim masing-masing sisi. Perbaikan: samakan MTU (`ip link set dev eth1 mtu 1500`).

**Skenario B: area mismatch di L1.** Di r4: `router isis INTI`, `no net 49.0002.0000.0000.0004.00`, `net 49.0003.0000.0000.0004.00`.

Adjacency r3-r4 hilang setelah holding time habis (log: `Adjacency to r4 (eth3) for level-1 changed from Up to Down, holding time expired`). r4 tidak punya tetangga dan kehilangan default route. Hello r4 tetap sampai ke r3 tetapi dibuang:

```
r3# show isis summary
  Drop counters per PDU type:
    P2P IIH: 14
```

Perbaikan: kembalikan NET r4. Renungkan: kalau r3 dan r4 sama-sama L1/L2, apakah adjacency akan hilang? (Tidak sepenuhnya: adjacency L2 tetap terbentuk karena L2 tidak peduli area.)

**Skenario C: level mismatch.** Di r3: `interface eth3`, `isis circuit-type level-2-only`. r4 adalah router L1-only, sehingga tidak ada level bersama. Gejala sama dengan skenario B (tidak ada tetangga, drop counter IIH naik), tetapi `show isis interface eth3` di r3 kini menunjukkan `Level: L2`. Pelajarannya: gejala sama, penyebab berbeda. Selalu periksa level dan area sekaligus. Kembalikan ke `isis circuit-type level-1`.

**Skenario D: autentikasi hello salah.** Di r3: `interface eth1`, `isis password md5 SalahKetik`. Adjacency r2-r3 putus. Karena jalur utama lewat r5, trafik pelanggan tidak terganggu, dan inilah bahayanya: link cadangan bisa mati berminggu-minggu tanpa ketahuan kalau Anda tidak memantau jumlah adjacency. Kembalikan ke `KunciHello23`.

**Skenario E: domain password salah.** Di r5: `router isis INTI`, `domain-password md5 KunciLama`. Lalu picu perubahan, mis. tambahkan alamat loopback baru di r3 (`interface lo`, `ip address 10.2.255.33/32`).

```
r5# show isis neighbor
 r2                  eth1        2  Up            30       2020.2020.2020
 r3                  eth2        2  Up            29       2020.2020.2020

r2# show isis database
IS-IS Level-2 link-state database:
LSP ID                  PduLen  SeqNumber   Chksum  Holdtime  ATT/P/OL
r2.00-00             *    260   0x00000006  0x8085    1161    0/0/0
r3.00-00                  269   0x00000007  0x2e08    1147    0/0/0
r5.00-00                  218   0x00000002  0x03d6     924    0/0/0

r5# show isis summary
  Drop counters per PDU type:
     L2 LSP: 9
```

Adjacency tetap **Up**, r2 sudah mengenal 10.2.255.33 tetapi r5 tidak. LSP r5 di r2 tidak pernah diperbarui (nomor urut tertahan, holdtime terus turun). Kalau dibiarkan, LSP r5 akan kedaluwarsa di seluruh domain dan r5 lenyap dari topologi. Perbaikan: kembalikan password, hapus loopback tambahan, lalu pastikan nomor urut LSP sama di r2 dan r5.

### Membongkar lab

```
$ sudo containerlab destroy -t isis.clab.yml --cleanup
```

### Kriteria sukses

- [ ] `show isis neighbor` di setiap router sesuai tabel topologi
- [ ] Anda bisa menunjukkan pseudonode, ATT bit, dan overload bit di `show isis database`
- [ ] r1 bisa ping loopback IPv4 dan IPv6 r4, dan Anda bisa menjelaskan jalurnya dengan hitungan SPF
- [ ] Untuk kelima skenario, Anda bisa menyebut satu perintah yang membuktikan penyebabnya

---

## 19. Ringkasan

- IS-IS adalah protokol **link state** dari dunia OSI (ISO 10589) yang diperluas untuk IP oleh **RFC 1195**. Ia berjalan **langsung di atas data link**, bukan IP.
- Router dikenali lewat **NET**: Area ID + **System ID 6 byte** (unik di seluruh domain) + NSEL 00. Baca NET dari belakang.
- **L1** = routing dalam area, **L2** = backbone. Router L1, L2, atau L1/L2. **Batas area ada di link**, dan backbone adalah rantai router L2 yang harus bersambung. Default Cisco adalah L1/L2.
- Prefiks L1 naik ke L2 secara otomatis menurut standar; L2 tidak turun ke L1 kecuali dibocorkan (up/down bit, RFC 5302). Router L1 keluar area lewat default route dari **ATT bit**.
- Adjacency: IIH dengan **hello padding** (MTU mismatch → macet di Initializing), three-way di LAN lewat TLV 6, di P2P lewat **TLV 240** (RFC 5303). Hello timer tidak harus sama.
- **DIS**: priority tertinggi (default 64) lalu MAC tertinggi, **preemptive**, tanpa backup. DIS menerbitkan **LSP pseudonode** dan mengirim **CSNP** periodik. Link dua router: pakai **point-to-point**.
- **LSP**: ID = System ID.Pseudonode-Fragmen, lifetime menghitung mundur dari **1200 s**, nomor urut menentukan versi terbaru. **CSNP** = ringkasan LSDB, **PSNP** = permintaan/ack.
- **Metrik default 10**, tidak dari bandwidth. Pakai **wide metric** (TLV 22/135, 24 bit) di semua router; narrow vs wide yang tercampur menyembunyikan rute.
- IPv6 lewat TLV 236/232 (RFC 5308); pakai **multi-topology** (RFC 5120, MT ID 2) untuk dual-stack.
- **Overload bit** mencegah transit (pemeliharaan, `on-startup wait-for-bgp`). Autentikasi punya tiga lingkup; area/domain password yang salah membuat LSDB basi walau adjacency Up.
- IS-IS membawa label **Segment Routing** lewat sub-TLV (RFC 8667) dan menjadi dasar TI-LFA dan Flex-Algo.

---

## 20. Latihan

1. Sebuah router memiliki NET `49.0005.0100.1000.0032.00`. Sebutkan Area ID, System ID, dan alamat loopback IPv4 yang kemungkinan besar dipakai untuk membentuk System ID tersebut.
2. Dua router Cisco baru dipasang di area yang sama tanpa perintah `is-type` dan tanpa `isis circuit-type`. Berapa adjacency yang terbentuk di link di antara keduanya, berapa LSDB yang disimpan masing-masing router, dan apa yang sebaiknya Anda ubah kalau keduanya hanya router akses?
3. Adjacency antara router Cisco dan router MikroTik di link point-to-point tidak pernah mencapai Up, dan log RouterOS menampilkan "invalid 3way tlv". Setelah diperbaiki, adjacency Up tetapi prefiks dari MikroTik tidak pernah muncul di tabel routing Cisco. Jelaskan kedua masalah dan perbaikannya.
4. `show isis neighbor` di router A menampilkan B dalam state Initializing, sementara di B tidak ada tetangga sama sekali. Link baru saja dipindah ke perangkat radio microwave. Apa penyebab paling mungkin, dan kenapa IS-IS sengaja dirancang agar gagal dengan cara ini?
5. Di area L1 Anda ada dua router L1/L2, satu di Jakarta dan satu di Surabaya. Router akses di Bandung selalu mengirim trafik ke Surabaya lewat Jakarta, padahal ada jalur yang lebih pendek. Jelaskan penyebabnya dan dua cara memperbaikinya.
6. Setelah tim keamanan mengganti domain password di semua router kecuali satu router core, tidak ada alarm adjacency, tetapi sekitar 20 menit kemudian sebagian pelanggan kehilangan konektivitas. Jelaskan rangkaian kejadiannya dan perintah untuk membuktikannya.
7. Anda akan melakukan upgrade software pada router P di backbone yang juga menjalankan BGP. Bagaimana memakai overload bit sebelum pemeliharaan dan saat router menyala kembali? Kenapa pengaturan saat menyala kembali itu penting?
8. Seorang rekan mengusulkan memecah backbone IS-IS ISP Anda (120 router, semuanya menjalankan MPLS LDP) menjadi enam area L1 per region "agar lebih skalabel seperti OSPF". Apa risiko teknis usulan ini dan apa yang Anda sarankan?
9. Di lab, ketika r5 diberi overload bit, kenapa r1 masih bisa ping 10.0.255.5 (loopback r5) tetapi trafik r1 ke r4 tidak lagi lewat r5?
10. Jaringan Anda memakai IS-IS single topology dan Anda mulai mengaktifkan IPv6 hanya di sebagian link core. Apa yang bisa salah, dan konfigurasi apa yang mencegahnya?

<details>
<summary>Jawaban</summary>

1. Baca dari belakang. NSEL `00`; **System ID** adalah 6 byte sebelumnya: `0100.1000.0032`; sisanya **Area ID** `49.0005`. Kalau System ID dibentuk dengan cara memadatkan alamat IPv4 menjadi 12 digit (setiap oktet 3 digit), `010010000032` dibaca `010.010.000.032`, yaitu loopback **10.10.0.32**.

2. Default Cisco adalah **L1/L2** untuk router dan interface, dan keduanya satu area. Maka terbentuk **dua adjacency** di link itu (L1 dan L2), dan setiap router menyimpan **dua LSDB** serta menjalankan dua SPF. Untuk router akses, set `is-type level-1` (atau `isis circuit-type level-1` pada interface yang menghadap area) agar hanya ada adjacency L1 dan satu LSDB. Router akses lalu keluar area lewat default route dari ATT bit router L1/L2.

3. Masalah pertama adalah **three-way handshake**: RouterOS mengharapkan TLV 240 sesuai RFC 5303, sementara IOS lama tidak mengirimnya dalam format lengkap. Perbaikannya `isis three-way-handshake ietf` di interface Cisco. Masalah kedua adalah **metric style**: default Cisco adalah **narrow**, sedangkan MikroTik hanya mendukung **wide**. LSDB tersinkron, tetapi Cisco tidak memakai TLV 22/135 dari MikroTik saat menghitung rute. Perbaikannya `metric-style wide` (atau `transition` sebagai langkah migrasi) di semua router Cisco.

4. **MTU mismatch.** Karena hello padding, IIH dari sisi ber-MTU besar sebesar MTU penuh (mis. 1497 byte) dan dibuang oleh perangkat atau interface ber-MTU lebih kecil. A menerima hello B yang lebih kecil, tetapi B tidak pernah menerima hello A, sehingga A macet di Initializing dan B tidak melihat tetangga. Desain ini disengaja agar masalah MTU langsung terlihat sebagai kegagalan adjacency. Kalau hello kecil dan adjacency Up, LSP atau CSNP besar akan hilang diam-diam belakangan, dan itu jauh lebih sulit didiagnosis. Perbaikannya: samakan MTU di kedua sisi dan di perangkat radio, bukan mematikan padding.

5. Router L1 tidak tahu topologi L2. Ia hanya memasang default route ke router L1/L2 **terdekat dalam metrik L1** yang memasang ATT bit, dan dari Bandung itu Jakarta, tanpa memandang di mana tujuan sebenarnya. Perbaikan: (a) **route leaking** L2 ke L1 untuk prefiks yang perlu jalur optimal (Cisco `redistribute isis ip level-2 into level-1 route-map ...`, IOS XR `propagate level 2 into level 1`, Junos policy `from level 2` / `to level 1`), sehingga router akses memilih berdasarkan metrik sebenarnya; atau (b) mengubah desain, mis. menjadikan router Bandung L1/L2 atau meratakan jaringan menjadi L2 saja. Menyetel metrik L1 bisa memindahkan pilihan default, tetapi hanya memindahkan masalah ke tujuan lain.

6. Domain password melindungi **LSP dan SNP level 2**, bukan hello. Adjacency router yang tertinggal tetap Up, sehingga tidak ada alarm adjacency. Tetapi LSP yang ia terima ditolak (dan LSP-nya ditolak router lain). LSDB-nya membeku: LSP lama tidak diperbarui, dan router lain juga tidak menerima LSP terbarunya. Setelah **remaining lifetime** LSP habis (default 1200 detik, sekitar 20 menit), LSP itu kedaluwarsa dan dihapus, router hilang dari topologi, dan pelanggan di belakangnya terputus. Bukti: penghitung drop LSP di `show isis summary` (FRR) atau log autentikasi, nomor urut LSP yang berbeda untuk LSP yang sama di dua router (`show isis database`), dan holdtime LSP router tersebut yang terus turun tanpa refresh.

7. Sebelum pemeliharaan, pasang **overload bit** (`set-overload-bit`) dan tunggu sampai trafik transit berpindah (verifikasi dengan counter interface atau traceroute), baru lakukan upgrade. Untuk saat menyala kembali, konfigurasi **`set-overload-bit on-startup wait-for-bgp`** (Cisco/IOS XR) atau `overload timeout` (Junos). IGP membentuk adjacency dalam hitungan detik, sedangkan BGP butuh waktu jauh lebih lama untuk menerima semua rute. Tanpa overload saat boot, router lain langsung mengirim trafik transit lewat router yang belum punya rute BGP lengkap, dan trafik itu dibuang (blackhole) sampai BGP selesai konvergen.

8. Risiko: router di area L1 hanya menerima **default route** dari ATT bit, sehingga **/32 loopback PE di area lain hilang**. LDP tidak bisa membangun LSP ke FEC yang tidak ada di tabel routing dengan prefiks persis, sehingga layanan MPLS (L3VPN, L2VPN) lintas region putus. Next hop BGP juga hanya bisa diselesaikan lewat default. Selain itu bisa muncul routing suboptimal. Kalau tetap dipecah, Anda wajib merancang route leaking /32 loopback (dan RFC 5302 up/down bit) dengan disiplin. Saran: 120 router masih nyaman untuk **satu level L2 datar**. IS-IS dengan prefiks sebagai daun dan PRC menangani ukuran ini dengan baik. Fokuskan upaya skalabilitas pada metrik, throttle, BFD, dan pembatasan prefiks yang diiklankan (mis. hanya loopback dan link core).

9. Overload bit berarti "jangan pakai saya sebagai **transit**". Saat SPF, router lain tidak melanjutkan pencarian jalur melewati r5, tetapi prefiks yang **menempel langsung** pada r5 (loopback dan link-nya) tetap bisa dicapai karena r5 adalah tujuan akhir, bukan perantara. Trafik r1 ke r4 sebelumnya lewat r2-r5-r3 (biaya 20 di L2); dengan r5 overload, satu-satunya jalur transit tersisa adalah link langsung r2-r3 (biaya 100), sehingga traceroute menunjukkan hop 10.0.23.2.

10. Pada single topology, satu SPF dipakai untuk IPv4 dan IPv6, sehingga topologi keduanya dianggap identik. Akibatnya: (a) adjacency bisa ditolak di link yang dukungan protokolnya berbeda di kedua sisi, sehingga trafik IPv4 ikut terganggu; atau (b) kalau adjacency tetap ada, SPF memilih jalur IPv6 melewati link atau router yang tidak menjalankan IPv6, dan paket IPv6 dibuang (blackhole). Pencegahnya: **multi-topology** (RFC 5120), mis. `address-family ipv6` + `multi-topology` di IOS XE, `address-family ipv6 unicast` di IOS XR, `topologies ipv6-unicast` di Junos, `topology ipv6-unicast` di FRR. Dengan MT, IPv6 memakai SPF sendiri (MT ID 2) sehingga bisa digelar link demi link dengan aman.

</details>

---

## 21. Sumber

- ISO/IEC 10589:2002, Intermediate System to Intermediate System intra-domain routeing information exchange protocol (rujukan; standar berbayar): https://www.iso.org/standard/30932.html
- RFC 1195, Use of OSI IS-IS for Routing in TCP/IP and Dual Environments: https://www.rfc-editor.org/rfc/rfc1195
- RFC 5305, IS-IS Extensions for Traffic Engineering (wide metric, TLV 22/135): https://www.rfc-editor.org/rfc/rfc5305
- RFC 5308, Routing IPv6 with IS-IS: https://www.rfc-editor.org/rfc/rfc5308
- RFC 5120, M-ISIS: Multi Topology Routing in IS-IS: https://www.rfc-editor.org/rfc/rfc5120
- RFC 5302, Domain-Wide Prefix Distribution with Two-Level IS-IS: https://www.rfc-editor.org/rfc/rfc5302
- RFC 5303, Three-Way Handshake for IS-IS Point-to-Point Adjacencies: https://www.rfc-editor.org/rfc/rfc5303
- RFC 5301, Dynamic Hostname Exchange Mechanism for IS-IS: https://www.rfc-editor.org/rfc/rfc5301
- RFC 5304, IS-IS Cryptographic Authentication (HMAC-MD5): https://www.rfc-editor.org/rfc/rfc5304
- RFC 5310, IS-IS Generic Cryptographic Authentication: https://www.rfc-editor.org/rfc/rfc5310
- RFC 5309, Point-to-Point Operation over LAN in Link State Routing Protocols: https://www.rfc-editor.org/rfc/rfc5309
- RFC 3277, IS-IS Transient Blackhole Avoidance (overload bit): https://www.rfc-editor.org/rfc/rfc3277
- RFC 7981, IS-IS Extensions for Advertising Router Information: https://www.rfc-editor.org/rfc/rfc7981
- RFC 8667, IS-IS Extensions for Segment Routing: https://www.rfc-editor.org/rfc/rfc8667
- FRRouting User Guide, IS-IS (isisd): https://docs.frrouting.org/en/latest/isisd.html
- FRRouting pull request #23540, "isisd: leak level-1 prefixes into the level-2 LSP" (latar belakang keterbatasan FRR di lab): https://github.com/FRRouting/frr/pull/23540
- MikroTik RouterOS documentation, IS-IS: https://help.mikrotik.com/docs/spaces/ROS/pages/201523543/IS-IS
- MikroTik RouterOS 7.13 changelog (IS-IS pertama kali ditambahkan): https://download.mikrotik.com/routeros/7.13/CHANGELOG
- Cisco IOS XE, IP Routing: ISIS Configuration Guide: https://www.cisco.com/c/en/us/support/ios-nx-os-software/ios-xe-17/products-installation-and-configuration-guides-list.html
- Juniper Networks, IS-IS User Guide (Junos OS): https://www.juniper.net/documentation/us/en/software/junos/is-is/index.html
- containerlab documentation, topology definition dan link MTU: https://containerlab.dev/manual/topo-def-file/
- netlab (ipspace), template konfigurasi IS-IS multi-vendor (rujukan sintaks): https://github.com/ipspace/netlab
- Larry Peterson dan Bruce Davie, Computer Networks: A Systems Approach, §3.4.3 Link State (CC BY 4.0; bagian flooding andal dan algoritma forward search diadaptasi dan diterjemahkan dengan perubahan): https://book.systemsapproach.org/internetworking/routing.html

---

**Berikutnya:** `07-routing-lanjutan/11-interkoneksi-internet`. Dari IGP di dalam jaringan ke bagaimana jaringan saling terhubung: transit, peering, dan IXP di Indonesia.

# 04.5 Routing: Konsep Dasar

> **Prasyarat:** `04-network-layer/01`–`04`
> **Tujuan:** Anda bisa membaca routing table baris demi baris, memprediksi keputusan forwarding router, dan memahami pemisahan control plane/data plane.

---

## 1. Apa yang Dilakukan Router

Router menjawab satu pertanyaan untuk setiap paket:

> **"Ke interface mana dan ke next hop mana paket ini harus dikirim?"**

Prosesnya:
```
1. Terima frame → periksa FCS → dekapsulasi header L2
2. MAC tujuan = MAC saya? Kalau bukan (dan bukan broadcast/multicast) → buang
3. Baca header IP → ambil IP tujuan
4. Periksa TTL: kurangi 1. Kalau 0 → buang + kirim ICMP Time Exceeded
5. Cari IP tujuan di ROUTING TABLE (longest prefix match)
6. Ketemu? → tentukan interface keluar & next hop
   Tidak ketemu? → buang + kirim ICMP Destination Unreachable
7. Hitung ulang checksum header IP (karena TTL berubah)
8. Cari MAC next hop (ARP kalau perlu)
9. Bungkus dengan header L2 BARU
10. Kirim
```

> [!WARNING]
> Perhatikan langkah 9: **header L2 selalu dibuat baru.** Router membuang header Ethernet lama sepenuhnya. Inilah kenapa MAC berubah setiap hop.

---

## 2. Routing Table

```
R1# show ip route

Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP
       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area
       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2
       E1 - OSPF external type 1, E2 - OSPF external type 2
       i - IS-IS, su - IS-IS summary, L1 - IS-IS level-1, L2 - IS-IS level-2
       * - candidate default, U - per-user static route

Gateway of last resort is 203.0.113.1 to network 0.0.0.0

S*    0.0.0.0/0 [1/0] via 203.0.113.1
      10.0.0.0/8 is variably subnetted, 3 subnets, 2 masks
C        10.1.1.0/24 is directly connected, GigabitEthernet0/0
L        10.1.1.1/32 is directly connected, GigabitEthernet0/0
O        10.2.2.0/24 [110/20] via 10.1.1.2, 00:15:23, GigabitEthernet0/0
D        10.3.3.0/24 [90/30720] via 10.1.1.3, 00:08:11, GigabitEthernet0/0
      192.168.0.0/24 is subnetted, 1 subnets
S        192.168.5.0/24 [1/0] via 10.1.1.5
```

### Membaca setiap kolom

```
O        10.2.2.0/24 [110/20] via 10.1.1.2, 00:15:23, GigabitEthernet0/0
│        │           │   │    │            │         │
│        │           │   │    │            │         └── interface keluar
│        │           │   │    │            └── berapa lama rute ini ada
│        │           │   │    └── NEXT HOP
│        │           │   └── METRIC (biaya menurut protokol itu)
│        │           └── ADMINISTRATIVE DISTANCE (seberapa dipercaya sumbernya)
│        └── jaringan tujuan + prefix length
└── SUMBER rute (O = OSPF)
```

### Jenis rute

| Kode | Jenis | Bagaimana masuk tabel |
|---|---|---|
| **C** | Connected | Interface punya IP dan statusnya up/up |
| **L** | Local | Alamat IP interface itu sendiri (/32), otomatis |
| **S** | Static | Dikonfigurasi manual |
| **S*** | Static default | Default route yang dikonfigurasi manual |
| **O** | OSPF | Dipelajari lewat OSPF |
| **D** | EIGRP | Dipelajari lewat EIGRP |
| **B** | BGP | Dipelajari lewat BGP |
| **R** | RIP | Dipelajari lewat RIP |
| **i** | IS-IS | Dipelajari lewat IS-IS |

> [!TIP]
> **Perbedaan C dan L:**
```
C  10.1.1.0/24  → seluruh SUBNET yang terhubung langsung
L  10.1.1.1/32  → alamat IP ROUTER ITU SENDIRI di subnet tersebut
```
Rute L memungkinkan router mengenali paket yang ditujukan kepada dirinya sendiri secara efisien. Diperkenalkan sejak IOS 15.

---

## 3. Longest Prefix Match: Aturan Nomor Satu

> [!WARNING]
> **Ini aturan terpenting dalam routing.** Ketika beberapa rute cocok dengan tujuan, router memilih yang **prefix-nya paling panjang** (paling spesifik).

```
Routing table:
  0.0.0.0/0        via 203.0.113.1     ← cocok dengan SEMUA alamat
  10.0.0.0/8       via 10.1.1.2        ← cocok dengan 10.x.x.x
  10.1.0.0/16      via 10.1.1.3        ← cocok dengan 10.1.x.x
  10.1.1.0/24      via 10.1.1.4        ← cocok dengan 10.1.1.x
  10.1.1.128/25    via 10.1.1.5        ← cocok dengan 10.1.1.128-255

Paket ke 10.1.1.200:
  Cocok dengan: /0, /8, /16, /24, dan /25
  → PILIH /25 (paling panjang) → via 10.1.1.5

Paket ke 10.1.1.50:
  Cocok dengan: /0, /8, /16, /24  (tidak /25, karena 50 < 128)
  → PILIH /24 → via 10.1.1.4

Paket ke 10.5.3.1:
  Cocok dengan: /0 dan /8
  → PILIH /8 → via 10.1.1.2

Paket ke 8.8.8.8:
  Cocok dengan: /0 saja
  → PILIH /0 (default route) → via 203.0.113.1
```

> [!WARNING]
> **Longest prefix match diperiksa SEBELUM administrative distance dan metric.** Rute /25 dari RIP (AD 120) akan mengalahkan rute /24 dari OSPF (AD 110) untuk tujuan yang cocok keduanya — karena /25 lebih spesifik.

**Urutan keputusan router:**
```
1. Longest prefix match  ← paling spesifik menang
2. Administrative distance ← hanya untuk rute dengan prefix SAMA dari sumber BERBEDA
3. Metric                 ← hanya untuk rute dengan prefix & sumber yang SAMA
```

---

## 4. Administrative Distance (AD)

Ukuran **seberapa dipercaya** sebuah sumber rute. **Semakin kecil, semakin dipercaya.**

Dipakai ketika **beberapa protokol** mengiklankan **prefix yang sama**.

| Sumber | AD | Alasan |
|---|---|---|
| Connected | **0** | Router melihatnya sendiri — pasti benar |
| Static | **1** | Administrator menetapkannya — dianggap disengaja |
| EIGRP summary | 5 | |
| eBGP | **20** | Dari AS lain; lebih dipercaya daripada IGP untuk rute eksternal |
| **EIGRP internal** | **90** | Cepat konvergen, metrik kaya |
| IGRP | 100 | (usang) |
| **OSPF** | **110** | Link state, andal |
| IS-IS | 115 | |
| **RIP** | **120** | Hop count sederhana, kurang akurat |
| EIGRP external | 170 | Rute dari luar EIGRP, kurang dipercaya |
| iBGP | 200 | |
| Unknown / unusable | **255** | Tidak akan dipasang ke routing table |

**Contoh:**
```
Router menerima rute 192.168.10.0/24 dari:
  - OSPF  (AD 110), metric 20
  - EIGRP (AD 90),  metric 30720
  - RIP   (AD 120), metric 3

→ EIGRP menang (AD 90 terkecil)
→ Hanya rute EIGRP yang masuk routing table
→ Rute OSPF & RIP disimpan di database protokolnya, siap menggantikan
   jika rute EIGRP hilang
```

> [!WARNING]
> **Metric TIDAK dibandingkan antar-protokol.** Metric OSPF (cost) dan metric EIGRP (composite) memakai skala yang sama sekali berbeda — membandingkannya tidak bermakna. Karena itu AD dipakai sebagai pemisah tingkat pertama.

### Mengubah AD

**Floating static route** — static route dengan AD lebih tinggi, sehingga hanya dipakai jika rute utama hilang:
```
R1(config)# ip route 192.168.10.0 255.255.255.0 10.1.1.2         ← AD 1, utama
R1(config)# ip route 192.168.10.0 255.255.255.0 10.1.1.9 130     ← AD 130, cadangan
```
Rute kedua tidak akan muncul di routing table selama rute pertama aktif. Kalau rute pertama hilang (interface down atau tracking gagal), rute kedua otomatis masuk.

Contoh pemakaian: link utama MPLS lewat OSPF (AD 110), cadangan lewat VPN internet sebagai static AD 130.

---

## 5. Metric

Ukuran "biaya" jalur **dalam satu protokol**.

| Protokol | Metric | Rentang |
|---|---|---|
| **RIP** | Hop count | 1-15 (16 = tak terjangkau) |
| **OSPF** | Cost = ref_bw / bandwidth | 1-65535 |
| **EIGRP** | Composite: bandwidth + delay (+ reliability, load, MTU jika K diubah) | Besar (mis. 30720) |
| **IS-IS** | Cost | 1-16777215 (wide metric) |
| **BGP** | Path attributes (bukan metric tunggal) | — |

### Contoh perbedaan filosofi

```
Jalur A: 2 hop, keduanya link 10 Mbps
Jalur B: 5 hop, semuanya link 10 Gbps

RIP  → memilih jalur A (2 hop < 5 hop)  ❌ pilihan buruk
OSPF → memilih jalur B (cost total jauh lebih kecil)  ✅ pilihan baik
```

Inilah kelemahan mendasar RIP: hop count mengabaikan bandwidth.

---

## 6. Jenis-Jenis Rute

### Connected Route
Otomatis muncul saat interface punya IP dan statusnya **up/up**.
```
R1(config)# interface gi0/0
R1(config-if)# ip address 10.1.1.1 255.255.255.0
R1(config-if)# no shutdown
→ C 10.1.1.0/24 is directly connected, GigabitEthernet0/0
→ L 10.1.1.1/32 is directly connected, GigabitEthernet0/0
```
> [!WARNING]
> Kalau interface `down`, rute connected **hilang** dari tabel.

### Static Route
```
# Dengan next hop
R1(config)# ip route 192.168.10.0 255.255.255.0 10.1.1.2

# Dengan exit interface
R1(config)# ip route 192.168.10.0 255.255.255.0 gi0/1

# Keduanya (direkomendasikan untuk multi-access seperti Ethernet)
R1(config)# ip route 192.168.10.0 255.255.255.0 gi0/1 10.1.1.2

# Dengan AD khusus (floating static)
R1(config)# ip route 192.168.10.0 255.255.255.0 10.1.1.9 130
```

### Default Route
```
R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1
```
`0.0.0.0/0` cocok dengan **semua** alamat, tetapi karena prefix-nya paling pendek, ia hanya dipakai jika tidak ada rute lain yang cocok. Disebut juga **gateway of last resort**.

### Host Route
```
R1(config)# ip route 192.168.10.50 255.255.255.255 10.1.1.2
```
Rute untuk satu alamat spesifik (/32). Karena prefix terpanjang, selalu menang.

### Summary/Aggregate Route
```
R1(config)# ip route 192.168.0.0 255.255.252.0 10.1.1.2
```

### Null Route (blackhole)
```
R1(config)# ip route 192.168.99.0 255.255.255.0 null0
```
Paket yang cocok akan **dibuang secara sadar**. Dipakai untuk:
- Mencegah loop pada summary route
- **RTBH** (*Remotely Triggered Black Hole*) untuk mitigasi DDoS
- Memblokir tujuan tertentu tanpa ACL

---

## 7. Static Route dengan Next Hop vs Exit Interface

Ini punya konsekuensi praktis yang penting.

### Next hop saja
```
R1(config)# ip route 192.168.10.0 255.255.255.0 10.1.1.2
```
Router harus melakukan **recursive lookup**:
```
1. Paket ke 192.168.10.5 → cocok dengan rute ini → next hop 10.1.1.2
2. "Bagaimana cara mencapai 10.1.1.2?" → cari lagi di routing table
3. Ketemu C 10.1.1.0/24 via Gi0/0 → interface keluar Gi0/0
```

> [!WARNING]
> Kalau rute ke `10.1.1.2` hilang, rute ini menjadi **tidak dapat dipakai** dan dihapus dari tabel.

### Exit interface saja
```
R1(config)# ip route 192.168.10.0 255.255.255.0 gi0/1
```
- Pada link **point-to-point** (serial, PPP): baik — hanya ada satu tetangga.
- Pada link **multi-access** (Ethernet): ⚠️ **bermasalah**. Router menganggap semua tujuan di jaringan itu "directly connected" dan akan ber-ARP untuk **setiap alamat tujuan** — membanjiri jaringan dengan ARP request dan membengkakkan ARP table.

### Keduanya (direkomendasikan untuk Ethernet)
```
R1(config)# ip route 192.168.10.0 255.255.255.0 gi0/1 10.1.1.2
```
Tidak perlu recursive lookup, dan next hop jelas → satu ARP untuk `10.1.1.2` saja. **Ini praktik terbaik untuk link Ethernet.**

---

## 8. Control Plane, Data Plane, Management Plane

Pemisahan konseptual yang penting untuk memahami kinerja dan keamanan perangkat.

```
┌────────────────────────────────────────────────────────────┐
│ MANAGEMENT PLANE                                           │
│   SSH, Telnet, SNMP, NETCONF, syslog, console              │
│   → cara ADMIN mengelola perangkat                          │
├────────────────────────────────────────────────────────────┤
│ CONTROL PLANE                                              │
│   OSPF, BGP, EIGRP, STP, ARP, ICMP, LACP, CDP/LLDP        │
│   → protokol yang MEMBANGUN tabel forwarding                │
│   → dijalankan oleh CPU                                     │
│   → menghasilkan RIB (Routing Information Base)             │
├────────────────────────────────────────────────────────────┤
│ DATA PLANE (forwarding plane)                              │
│   Meneruskan paket pengguna                                 │
│   → dijalankan ASIC/hardware, sangat cepat                  │
│   → memakai FIB (Forwarding Information Base)               │
└────────────────────────────────────────────────────────────┘
```

### RIB vs FIB

| | **RIB** (Routing Information Base) | **FIB** (Forwarding Information Base) |
|---|---|---|
| Isi | **Semua** rute yang diketahui dari semua protokol | Hanya rute **terbaik** yang dipilih |
| Dikelola oleh | Control plane (CPU) | Data plane (ASIC) |
| Perintah | `show ip route` | `show ip cef` |
| Berisi | Metric, AD, sumber, timer | Next hop + MAC + interface, siap pakai |
| Optimasi | Untuk kelengkapan | Untuk **kecepatan lookup** |

```
R1# show ip route 10.2.2.0            ← RIB
R1# show ip cef 10.2.2.0              ← FIB
R1# show ip cef exact-route 10.1.1.10 10.2.2.20   ← jalur nyata untuk aliran tertentu
```

### Evolusi metode switching Cisco

| Metode | Cara kerja | Kecepatan |
|---|---|---|
| **Process switching** | Setiap paket diproses CPU, lookup penuh di RIB | Sangat lambat |
| **Fast switching** | Paket pertama diproses CPU, sisanya memakai cache | Sedang |
| **CEF** (*Cisco Express Forwarding*) | FIB dibangun di awal; semua paket diteruskan hardware | **Sangat cepat** ← default |

> [!WARNING]
> **"Punting to CPU"** — beberapa paket harus diproses CPU walaupun CEF aktif:
- Paket dengan IP options
- Paket yang butuh fragmentasi
- Paket untuk router itu sendiri (SSH, routing protocol)
- Paket yang memicu ICMP error
- ACL/fitur yang tidak didukung hardware
- Debug yang aktif

Terlalu banyak punting → **CPU 100%** → router tidak responsif dan routing protocol bisa timeout. Ini penyebab umum "router hang" saat serangan atau salah konfigurasi.

```
R1# show processes cpu sorted
R1# show ip cef switching statistics
R1# show platform hardware ...   (bergantung platform)
```

**Control Plane Policing (CoPP)** melindungi CPU dengan membatasi rate trafik yang masuk ke control plane (`12-keamanan/05`).

---

## 9. Di Dalam Router: Lookup, Fabric, dan Antrean

Bagian 8 memisahkan control plane dan data plane. Bagian ini membuka kotak data plane: apa yang terjadi pada sebuah paket dalam beberapa nanodetik antara masuk dan keluar router, dan kenapa batas-batas fisik di dalamnya (memori, TCAM, fabric, antrean) menentukan harga router, jumlah rute yang muat, dan perilaku QoS.

```
              CONTROL PLANE (CPU, DRAM besar, lambat tapi pintar)
   OSPF/BGP/static ──► RIB ──► pilih rute terbaik ──► FIB + adjacency
                                                       │ (diunduh ke hardware)
   ────────────────────────────────────────────────────┼──────────────────
              DATA PLANE (ASIC/NPU, per paket, nanodetik)▼
  port masuk ─► parser ─► lookup FIB (LPM) ─► rewrite L2 ─► FABRIC ─► antrean
                 header    di TCAM/SRAM       adjacency     switching  keluar
                                                                         │
                                                         penjadwal ◄─────┘
                                                             │
                                                        port keluar
```

### 9.1 Anggaran waktu: kenapa lookup harus di hardware

Hitung berapa lama router punya waktu untuk satu paket pada kecepatan penuh. Paket Ethernet terkecil 64 byte, ditambah preamble 8 byte dan inter-frame gap 12 byte, memakai 84 byte waktu kabel:

```
Port 10 Gbps : 10 × 10^9 / (84 × 8)  = 14,88 juta paket/detik → 67,2 ns per paket
Port 100 Gbps: 100 × 10^9 / (84 × 8) = 148,8 juta paket/detik → 6,72 ns per paket
Switch 32 × 100 Gbps                 = 32 × 148,8 ≈ 4,76 miliar paket/detik
```

Akses acak ke DRAM butuh puluhan nanodetik. Kalau satu lookup butuh beberapa kali akses memori berurutan, satu port 100 Gbps saja sudah tidak terkejar. Inilah alasan struktur data FIB dan jenis memorinya menjadi soal desain utama. Peterson & Davie menunjukkan hal yang sama dari sisi software: prosesor yang mampu 40 juta paket/detik dengan paket 64 byte hanya menghasilkan sekitar 20 Gbps total, dibagi ke semua port.

### 9.2 RIB, FIB, dan siapa yang memegang apa

Ringkasnya (lihat tabel di bagian 8): RIB adalah kumpulan semua kandidat rute beserta metadata, FIB adalah hasil akhir yang siap dipakai. Di Linux dengan FRRouting pembagiannya kelihatan jelas: daemon `zebra` memegang RIB, kernel memegang FIB. Di output `show ip route` FRR, tanda `>` berarti rute terpilih dan `*` berarti rute itu sudah terpasang di FIB. Rute yang terpilih tetapi tidak bertanda `*` adalah tanda masalah antara control plane dan data plane.

```bash
# FIB kernel Linux disimpan sebagai LC-trie; Anda bisa melihat strukturnya
$ cat /proc/net/fib_trie | head
Main:
  +-- 0.0.0.0/0 3 0 4
     +-- 0.0.0.0/4 2 0 2
        |-- 0.0.0.0
           /0 universe UNICAST
        +-- 10.10.88.0/23 2 0 1
           |-- 10.10.88.0
              /23 link UNICAST
$ cat /proc/net/fib_triestat     # kedalaman rata-rata trie, jumlah node, dsb.
```

### 9.3 Longest prefix match dengan trie

Aturan LPM (bagian 3) mudah diucapkan, tetapi bagaimana mencarinya cepat di antara sejuta prefix? Struktur klasiknya **trie biner**: pohon yang setiap tingkatnya mewakili satu bit alamat. Agar muat di layar, contoh ini memakai alamat 4 bit (bayangkan ini 4 bit pertama alamat IPv4):

| Prefix | Arti | Port keluar |
|---|---|---|
| `*` | default | 1 |
| `0*` | semua alamat berawalan 0 | 2 |
| `010*` | berawalan 010 | 3 |
| `0101` | tepat 0101 | 4 |
| `11*` | berawalan 11 | 5 |

```
                   [root: * → port 1]
                    0 /            \ 1
        [0: 0* → port 2]          [1: -]
               1 \                      \ 1
              [01: -]              [11: 11* → port 5]
               0 /
     [010: 010* → port 3]
               1 \
     [0101: 0101 → port 4]
```

Lookup berjalan dari akar mengikuti bit alamat, **mengingat prefix terakhir yang ditemui**, dan berhenti saat cabang yang dibutuhkan tidak ada:

```
Alamat 0101: root(*) → 0(0*) → 01 → 010(010*) → 0101(0101)  → port 4
Alamat 0100: root(*) → 0(0*) → 01 → 010(010*) → cabang 0 tidak ada → port 3
Alamat 0110: root(*) → 0(0*) → 01 → cabang 1 tidak ada            → port 2
Alamat 1000: root(*) → 1 → cabang 0 tidak ada                      → port 1
```

Masalahnya: untuk IPv4 kedalaman trie bisa 32, berarti sampai 32 akses memori berurutan per paket. Dengan anggaran 6,72 ns per paket, mustahil.

**Trie multibit** memeriksa beberapa bit sekaligus (*stride*). Prefix yang panjangnya tidak pas dengan batas stride "dikembangkan" (*controlled prefix expansion*). Contoh tabel di atas dengan stride 2 bit:

```
Tingkat 1 (bit 1-2)               Tingkat 2 di bawah "01" (bit 3-4)
 00 → port 2  (0* dikembangkan)    00 → port 3  (010* dikembangkan)
 01 → port 2  + penunjuk ─────►    01 → port 4  (0101, lebih panjang menang)
 10 → port 1  (default)            10 → port 2  (diwarisi dari 0*)
 11 → port 5  (11*)                11 → port 2
```

Lookup 0101 sekarang hanya **2 akses** (01, lalu 01), bukan 5. Bayarannya memori: setiap node berisi 2^stride entri, dan prefix pendek digandakan berkali-kali. Pada IPv4 dengan stride 8-8-8-8 (paling banyak 4 akses), prefix `10.20.16.0/20` di tingkat ketiga harus dikembangkan menjadi 2^(24−20) = **16 entri**: `10.20.16.0/24` sampai `10.20.31.0/24`.

| Struktur | Akses memori maksimum per lookup (IPv4) | Catatan |
|---|---|---|
| Trie biner | 32 | Hemat memori, terlalu lambat untuk kecepatan tinggi |
| Multibit stride 8 | 4 | Kompromi umum |
| DIR-24-8 (Gupta, Lin, McKeown 1998) | 2 | Tabel pertama 2^24 = 16.777.216 entri (32 MB dengan entri 2 byte); dipakai pustaka LPM DPDK |
| LC-trie | bervariasi | Dipakai kernel Linux (`fib_trie`) |
| TCAM | 1 (paralel) | Lihat 9.4 |

### 9.4 TCAM: cepat, mahal, dan panas

**TCAM** (*Ternary Content-Addressable Memory*) membalik cara kerja memori biasa. RAM menerima alamat dan mengembalikan isi. CAM menerima **isi** (kunci pencarian) dan mengembalikan **alamat entri yang cocok**. "Ternary" berarti setiap bit entri bisa 0, 1, atau X (*don't care*), sehingga satu entri bisa menyatakan sebuah prefix: bit host dijadikan X.

```
Kunci pencarian: 0100   (dibandingkan ke SEMUA entri dalam satu siklus)

Indeks  Entri (nilai/mask)   Cocok?    Aksi
  0     0101                  tidak     port 4
  1     010X                  YA        port 3   ◄── priority encoder memilih
  2     11XX                  tidak     port 5       indeks terkecil yang cocok
  3     0XXX                  YA        port 2
  4     XXXX                  YA        port 1
```

Karena encoder memilih indeks terkecil, entri **harus diurutkan dari prefix terpanjang**. Dengan begitu kecocokan pertama otomatis adalah longest prefix match, dalam satu operasi berapa pun jumlah entrinya. Konsekuensinya, menyisipkan prefix baru bisa memaksa entri lain digeser. Implementasi biasanya menyisakan ruang kosong per kelompok panjang prefix agar pergeseran sedikit.

Kenapa tidak semua memori dibuat TCAM?

- **Luas chip.** Setiap sel TCAM butuh rangkaian pembanding sendiri, umumnya sekitar 16 transistor per bit, dibandingkan sekitar 6 untuk sel SRAM biasa.
- **Daya dan panas.** Setiap lookup menyalakan pembanding di seluruh entri secara bersamaan. Konsumsi daya naik sebanding dengan jumlah entri dikali laju lookup. TCAM besar adalah salah satu penyumbang utama panas dan harga line card.
- **Kapasitas terbatas dan dibagi.** TCAM yang sama sering dipakai bersama untuk rute IPv4, IPv6, ACL, QoS, dan MPLS. Entri IPv6 yang lebih lebar biasanya memakan dua atau empat kali ruang entri IPv4, bergantung platform.

**Tabel internet penuh tidak lagi kecil.** Menurut CIDR Report per 7 Oktober 2026, tabel BGP global berisi sekitar **1,08 juta prefix IPv4** dan **257 ribu prefix IPv6**, dan terus bertambah. Sejarah sudah memberi peringatan: pada **12 Agustus 2014** ("512K day") tabel IPv4 melewati 512 ribu entri. Banyak router Cisco Catalyst 6500/7600 yang alokasi TCAM bawaannya 512 ribu entri IPv4 kehabisan ruang. Rute yang tidak muat diproses di CPU, dan sejumlah jaringan di berbagai negara mengalami gangguan. Perbaikannya adalah mengubah pembagian TCAM (`mls cef maximum-routes ip 1000` pada platform itu) lalu reboot, yang tentu harus dijadwalkan.

Pelajaran desain untuk ISP dan enterprise di Indonesia:

- Sebelum menerima *full table* dari upstream atau IX, periksa kapasitas FIB hardware, bukan hanya RAM control plane. Router berbasis CPU (termasuk banyak router MikroTik CCR) menyimpan FIB di RAM sehingga batasnya jauh lebih longgar, tetapi lookup-nya dikerjakan CPU, sehingga laju paketnya yang menjadi batas.
- Kalau hardware terbatas, terima full table di RIB untuk keperluan kebijakan, tetapi pasang di FIB hanya sebagian (*selective FIB download*: misalnya `table-map ... filter` di BGP Cisco IOS XE atau kebijakan `forwarding-table export` di Junos), ditambah default route.
- Pantau pemakaian TCAM seperti Anda memantau CPU. Di switch Catalyst: `show sdm prefer` menampilkan template pembagian sumber daya hardware yang aktif.

### 9.5 Adjacency table dan CEF

FIB menjawab "next hop mana", tetapi untuk mengirim frame router masih butuh header L2 lengkap. Mencari ARP per paket terlalu lambat, jadi CEF memisahkan dua tabel:

```
FIB (per prefix)                         Adjacency table (per next hop)
10.2.2.0/24 ──────┐
10.2.3.0/24 ──────┼──► 192.168.12.2 ───► Gi0/1, rewrite 14 byte:
172.16.0.0/16 ────┘                       [MAC tujuan][MAC sumber][0800]
                                          (dibangun dari cache ARP)
```

Ribuan prefix bisa menunjuk satu entri adjacency. Kalau MAC next hop berubah, hanya satu entri adjacency yang diperbarui, bukan ribuan entri FIB. Contoh (output disederhanakan):

```
R1# show ip cef 10.2.2.0/24
10.2.2.0/24
  nexthop 192.168.12.2 GigabitEthernet0/1

R1# show adjacency GigabitEthernet0/1 detail
Protocol Interface                 Address
IP       GigabitEthernet0/1        192.168.12.2(9)
                                   Encap length 14
                                   AABBCC000200AABBCC0001000800
                                   ARP
```

String `AABBCC000200 AABBCC000100 0800` adalah MAC tujuan, MAC sumber, dan EtherType IPv4: header Ethernet yang tinggal ditempel ke paket. Ada juga adjacency khusus yang menjelaskan banyak kejadian "punt to CPU" di bagian 8: **glean** (subnet terhubung langsung, MAC host belum diketahui, paket dikirim ke CPU untuk memicu ARP), **punt** (fitur yang tidak didukung hardware), **drop/discard**, dan **null** (rute ke Null0).

Untuk ECMP, entri FIB menunjuk ke tabel pembagian beban, bukan langsung ke satu adjacency. Pada implementasi CEF klasik tabel ini berisi 16 *bucket*, dan hash alamat sumber dan tujuan memilih bucket. Tiga jalur sama-biaya tidak membagi 16 dengan rata:

```
16 bucket / 3 jalur = 6 + 5 + 5
Jalur 1: 6/16 = 37,5%    Jalur 2: 5/16 = 31,25%    Jalur 3: 5/16 = 31,25%
```

Gunakan `show ip cef exact-route <sumber> <tujuan>` untuk melihat jalur mana yang dipakai satu aliran tertentu.

### 9.6 Switching fabric

Setelah lookup, paket harus dipindah dari port masuk ke port keluar. Ada tiga arsitektur dasar:

```
(a) Memori bersama        (b) Bus bersama            (c) Crossbar
  in ─► ┌──────┐ ─► out     in1 ─┐                     in1 ─┼────┼────┼──
  in ─► │MEMORI│ ─► out     in2 ─┼═══ BUS ═══┬─► out1  in2 ─┼────┼────┼──
  in ─► └──────┘ ─► out     in3 ─┘           ├─► out2  in3 ─┼────┼────┼──
  setiap paket ditulis      satu paket per            out1 out2 out3
  lalu dibaca: 2 akses      waktu melintasi bus       titik silang bisa aktif
                                                      paralel
```

Contoh hitung untuk switch 24 port 10 Gbps (total 240 Gbps):

| Fabric | Syarat kecepatan agar tidak menjadi bottleneck |
|---|---|
| Memori bersama | Bandwidth memori ≥ 2 × 240 = **480 Gbps** (tulis + baca setiap paket) |
| Bus | Bus ≥ **240 Gbps**, dan hanya satu transfer per waktu |
| Crossbar | Setiap jalur cukup 10 Gbps, tetapi butuh penjadwal yang memilih pasangan masuk-keluar setiap siklus |

PC Linux yang dijadikan router dan banyak router berbasis CPU memakai model (a): paket di-DMA ke RAM, diperiksa CPU, lalu di-DMA keluar. Switch dan router kelas atas memakai crossbar atau fabric bertingkat (Clos) di dalam chassis.

### 9.7 Input queueing, output queueing, dan head-of-line blocking

Kalau beberapa port masuk mengirim ke satu port keluar bersamaan, sebagian paket harus menunggu. Di mana menunggunya?

- **Output queueing**: paket langsung dipindah ke antrean port keluar. Ideal secara kinerja, tetapi fabric harus mampu mengantar N paket ke satu port dalam satu slot waktu (speedup N). Untuk N besar, mahal.
- **Input queueing**: paket menunggu di port masuk sampai fabric mengizinkan. Fabric cukup cepat 1×, tetapi muncul **head-of-line (HOL) blocking**:

```
Slot waktu t (crossbar 3×3, satu paket per port keluar per slot)

Input 1: [ke O1] [ke O2]          O1 ◄── input 1 menang
Input 2: [ke O1] [ke O3]  ← paket ke O3 TERTAHAN di belakang paket ke O1,
Input 3: [ke O2]                   padahal O3 sedang menganggur
                                  O2 ◄── input 3
                                  O3 ── kosong
```

Karol, Hluchyj, dan Morgan (1987) menghitung bahwa dengan antrean FIFO di input dan trafik acak seragam, throughput maksimum switch besar hanya **2 − √2 ≈ 58,6%**. Pada switch dengan beban rata-rata 70% per port, antrean input akan tumbuh terus walaupun tidak ada port keluar yang kelebihan beban secara rata-rata. (Modul `03-data-link/02` menyebut HOL blocking pada buffer switch; ini asal-usul angkanya.)

**Virtual Output Queue (VOQ)** memecahkannya: setiap port masuk punya **satu antrean terpisah untuk setiap port keluar**. Paket ke O3 tidak lagi terjebak di belakang paket ke O1. Penjadwal (misalnya algoritma iSLIP dari McKeown, 1999) memilih pasangan masuk-keluar setiap slot. Harganya jumlah antrean:

```
Switch 32 port dengan VOQ   : 32 × 32 = 1.024 antrean
Dengan 8 kelas trafik per VOQ: 1.024 × 8 = 8.192 antrean
```

Arsitektur gabungan (antrean di input dan output dengan fabric sedikit lebih cepat dari 1×) adalah yang umum di router modern.

### 9.8 Penjadwalan: siapa dikirim berikutnya

Di port keluar yang padat, **disiplin antrean** menentukan dua hal: paket mana yang dikirim lebih dulu (penjadwalan) dan paket mana yang dibuang (kebijakan drop). Peterson & Davie menekankan bahwa keduanya terpisah: "FIFO" yang biasa disebut sebenarnya *FIFO dengan tail drop*.

- **FIFO + tail drop.** Sederhana, tidak membedakan aliran. Satu aliran agresif bisa menguasai antrean dan menunda semua yang lain (bufferbloat, `00-fondasi/03`).
- **Strict priority.** Beberapa antrean FIFO; antrean prioritas tinggi selalu dilayani lebih dulu. Delay minimal untuk suara, tetapi antrean rendah bisa **kelaparan** (*starvation*) kalau trafik prioritas tidak dibatasi. Karena itu LLQ selalu memasang policer pada antrean prioritas.
- **Fair Queuing / WFQ.** Meniru round-robin per bit. Setiap paket diberi label waktu selesai virtual `F_i = max(F_{i−1}, A_i) + P_i` (P = panjang paket, A = waktu kedatangan dalam jam virtual), dan paket dengan F terkecil dikirim lebih dulu. Contoh: aliran 1 punya paket berukuran 8 dan 6, aliran 2 punya satu paket berukuran 10, semuanya tiba di waktu 0. Label: aliran 1 = 8 dan 14, aliran 2 = 10. Urutan kirim: paket aliran 1 (8), paket aliran 2 (10), paket aliran 1 (14). WFQ memberi bobot: aliran berbobot 2 mendapat dua kali bagian aliran berbobot 1. Kelemahannya, mengurutkan label waktu butuh O(log n) per paket.
- **Deficit Round Robin (DRR)** (Shreedhar & Varghese, 1995). Setiap antrean punya *quantum* (byte per putaran) dan penghitung defisit. Setiap putaran, defisit ditambah quantum, lalu antrean boleh mengirim paket selama ukuran paket ≤ defisit. Sisa defisit dibawa ke putaran berikutnya. Biayanya O(1) per paket, dan adil dalam byte walaupun ukuran paket berbeda.

**Contoh hitung DRR.** Quantum 1.000 byte untuk dua antrean. Antrean A berisi paket bulk 1.500 byte, antrean B berisi paket kecil 200 byte.

| Putaran | Defisit A sebelum kirim | A mengirim | Sisa defisit A | B mengirim | Total A / B (byte) |
|---|---|---|---|---|---|
| 1 | 1.000 | tidak ada (1.500 > 1.000) | 1.000 | 5 × 200 | 0 / 1.000 |
| 2 | 2.000 | 1 × 1.500 | 500 | 5 × 200 | 1.500 / 2.000 |
| 3 | 1.500 | 1 × 1.500 | 0 | 5 × 200 | 3.000 / 3.000 |
| 4 | 1.000 | tidak ada | 1.000 | 5 × 200 | 3.000 / 4.000 |
| 5 | 2.000 | 1 × 1.500 | 500 | 5 × 200 | 4.500 / 5.000 |
| 6 | 1.500 | 1 × 1.500 | 0 | 5 × 200 | 6.000 / 6.000 |

Dalam jangka panjang keduanya mendapat 50% byte. Bandingkan round-robin per paket biasa: A mengirim 1.500 byte dan B 200 byte per putaran, sehingga A menguasai 1.500 / 1.700 ≈ **88%** link hanya karena paketnya lebih besar. Mengubah quantum A menjadi 3.000 byte (B tetap 1.000) menghasilkan pembagian 75% : 25%, yaitu WFQ versi murah.

**Kaitan ke QoS.** Semua konfigurasi QoS adalah cara memilih dan memberi parameter pada mekanisme di atas, dan hanya berpengaruh **di tempat antrean terbentuk**, yaitu di port keluar yang menjadi bottleneck (misalnya LAN 1 Gbps menuju WAN 100 Mbps):

| Konsep | Cisco | Linux `tc` | MikroTik |
|---|---|---|---|
| Strict priority + policer | LLQ (`priority`) | `prio`, atau HTB dengan prioritas | queue tree dengan `priority` |
| Bobot per kelas | CBWFQ (`bandwidth`) | `htb`, `drr` | queue tree (HTB) |
| Adil per aliran + AQM | `fair-queue` | `fq_codel`, `cake` | PCQ, `fq-codel` |

Detail konfigurasinya ada di `11-wan-vpn/03`. Untuk melihat antrean yang benar-benar terbentuk: `tc -s qdisc show dev eth0` di Linux (kolom `backlog` dan `dropped`), `show interfaces` dan `show policy-map interface` di Cisco, serta `/queue tree print stats` di MikroTik.

---

## 10. Routing vs Switching vs Bridging

| | Bridging/Switching (L2) | Routing (L3) |
|---|---|---|
| Alamat | MAC | IP |
| Tabel | MAC address table | Routing table |
| Cara belajar | Otomatis dari source MAC | Manual (static) atau protokol routing |
| Tujuan tidak dikenal | **Flooding** ke semua port | **Buang** + kirim ICMP unreachable |
| Broadcast | Diteruskan | **Tidak diteruskan** |
| Header L2 | Tidak diubah | **Dibuat ulang** |
| TTL | Tidak ada | Dikurangi setiap hop |
| Loop prevention | STP | TTL + algoritma routing |

---

## 11. Masalah Routing yang Umum

### Routing Loop

Paket berputar antara beberapa router.
```
R1 → "192.168.5.0/24 lewat R2"
R2 → "192.168.5.0/24 lewat R1"
→ paket bolak-balik sampai TTL habis
```
Gejala: TTL exceeded, latency naik, bandwidth link terpakai penuh oleh trafik yang sama.
Deteksi: `traceroute` menunjukkan alamat yang sama berulang.

### Black Hole

Paket masuk tetapi tidak pernah keluar — hilang tanpa pesan error.
Penyebab: null route yang salah, over-summarization, ACL yang diam-diam membuang, MTU black hole.

### Asymmetric Routing

Jalur pergi ≠ jalur pulang.
```
A → B lewat Router 1
B → A lewat Router 2
```
**Normal di internet**, tetapi bermasalah dengan:
- **Firewall stateful** — melihat trafik balasan tanpa pernah melihat trafik pergi → dibuang
- **NAT** — mapping tidak ditemukan
- **IPS/DPI** — hanya melihat separuh percakapan
- **uRPF strict mode** — paket dari interface yang "salah" dibuang

### Suboptimal Routing

Trafik mengambil jalur yang lebih panjang dari seharusnya. Penyebab: metric salah, summarization yang menyembunyikan jalur lebih baik, redistribusi yang menyebabkan preferensi keliru.

### Recursive Lookup Failure

```
R1(config)# ip route 192.168.10.0 255.255.255.0 172.16.99.1
→ Router tidak punya rute ke 172.16.99.1
→ Rute ini TIDAK muncul di routing table
```
Gejala: static route dikonfigurasi tetapi tidak muncul di `show ip route`.

---

## 12. Load Balancing

Ketika ada beberapa jalur dengan cost sama, router bisa memakai semuanya.

### ECMP (Equal-Cost Multi-Path)
```
R1# show ip route 10.2.2.0
O    10.2.2.0/24 [110/20] via 10.1.1.2, 00:05:12, GigabitEthernet0/0
                 [110/20] via 10.1.1.3, 00:05:12, GigabitEthernet0/1
```
Dua jalur dengan metric sama → trafik dibagi.

**Cara pembagian:**
- **Per-destination** (default CEF) — hash dari src/dst IP menentukan jalur. Aliran yang sama selalu di jalur yang sama → tidak ada out-of-order. ✅
- **Per-packet** — bergantian setiap paket. Bandwidth terbagi merata, tetapi paket bisa tiba tidak berurutan → merusak TCP. ⚠️ Hindari.

```
R1(config-if)# ip load-sharing per-destination    ← default, disarankan
R1(config-if)# ip load-sharing per-packet         ← hati-hati
```

Jumlah jalur maksimum:
```
R1(config-router)# maximum-paths 8
```

### Unequal-Cost Load Balancing

Hanya **EIGRP** yang mendukung ini (lewat `variance`):
```
R1(config-router)# variance 2
```
Artinya: pakai juga jalur dengan metric sampai 2× metric terbaik, dengan proporsi trafik sebanding kualitasnya.

---

## 13. Praktik

### Membaca dan menguji routing table
```
R1# show ip route
R1# show ip route 10.2.2.5              ← rute mana yang dipakai untuk IP ini
R1# show ip route ospf                  ← hanya rute OSPF
R1# show ip route summary               ← statistik jumlah rute
R1# show ip route | include 10.1
R1# show ip cef 10.2.2.5
R1# show ip cef exact-route 10.1.1.10 10.2.2.20
R1# show ip protocols                   ← protokol routing yang aktif
```

### Linux
```bash
$ ip route show
default via 192.168.1.1 dev eth0 proto dhcp metric 100
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.50

# Rute mana yang dipakai untuk tujuan tertentu — SANGAT BERGUNA
$ ip route get 8.8.8.8
8.8.8.8 via 192.168.1.1 dev eth0 src 192.168.1.50 uid 1000
    cache

$ ip route get 192.168.1.20
192.168.1.20 dev eth0 src 192.168.1.50 uid 1000
    cache

# Menambah rute
$ sudo ip route add 10.0.0.0/8 via 192.168.1.254
$ sudo ip route add default via 192.168.1.1
$ sudo ip route del 10.0.0.0/8
$ sudo ip route add blackhole 192.168.99.0/24

# Aktifkan IP forwarding (menjadikan Linux router)
$ sudo sysctl -w net.ipv4.ip_forward=1
$ echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-router.conf

# Beberapa tabel routing (policy routing)
$ ip rule show
$ ip route show table main
$ ip route show table local
```

### Windows
```powershell
PS> route print
PS> Get-NetRoute
PS> Find-NetRoute -RemoteIPAddress 8.8.8.8
PS> New-NetRoute -DestinationPrefix 10.0.0.0/8 -NextHop 192.168.1.254 -InterfaceIndex 5
```

---

## 14. Kesalahan Umum

> [!WARNING]
> **1. Mengira AD dibandingkan sebelum longest prefix match.** Prefix terpanjang selalu menang lebih dulu.

> [!WARNING]
> **2. Membandingkan metric antar-protokol.** Tidak bermakna; itulah gunanya AD.

> [!WARNING]
> **3. Memakai exit interface saja pada link Ethernet.** Menyebabkan ARP berlebihan.

> [!WARNING]
> **4. Lupa rute balik.** Paket sampai, tetapi balasan tidak bisa kembali. **Selalu periksa routing di KEDUA arah.**

> [!WARNING]
> **5. Lupa mengaktifkan `ip routing` pada multilayer switch.**

> [!WARNING]
> **6. Memakai per-packet load balancing.** Menyebabkan out-of-order dan merusak kinerja TCP.

> [!WARNING]
> **7. Mengabaikan asymmetric routing saat ada firewall stateful.**

> [!WARNING]
> **8. Static route yang tidak muncul di tabel.** Biasanya recursive lookup gagal atau interface down.

---

## MikroTik RouterOS

```
# Routing table
/ip route print
/ip route print detail
/ip route print where active=yes
/ip route print where dst-address~"192.168"

Flags: X - disabled, A - active, D - dynamic, C - connect, S - static,
       r - rip, b - bgp, o - ospf, m - mme, B - blackhole, U - unreachable, P - prohibit

 #      DST-ADDRESS      PREF-SRC       GATEWAY        DISTANCE
 0 A S  0.0.0.0/0                       203.0.113.9           1
 1 ADC  192.168.1.0/24   192.168.1.1    bridge-LAN            0
 2 A o  10.0.0.0/8                      192.168.1.254       110

# Static route
/ip route add dst-address=10.0.0.0/8 gateway=192.168.1.254
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.9 comment="ISP-A"

# Distance (= administrative distance)
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.9 distance=1
/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.9 distance=10

# Blackhole / unreachable / prohibit
/ip route add dst-address=192.168.99.0/24 type=blackhole
/ip route add dst-address=192.168.98.0/24 type=unreachable   ← kirim ICMP unreachable
/ip route add dst-address=192.168.97.0/24 type=prohibit      ← kirim ICMP prohibited

# Check gateway (failover sederhana)
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.9 check-gateway=ping

# Rute mana yang dipakai untuk tujuan tertentu
/ip route check 8.8.8.8

# ECMP (equal cost multipath) — sebutkan beberapa gateway
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.9,198.51.100.9
```

> [!WARNING]
> **`check-gateway=ping` hanya menguji GATEWAY, bukan konektivitas internet.** Kalau gateway ISP hidup tetapi upstream-nya mati, rute tetap aktif. Untuk pengujian end-to-end, gunakan **recursive route**:

```
# Probe ke 8.8.8.8 dipaksa lewat ISP-A
/ip route add dst-address=8.8.8.8/32 gateway=203.0.113.9 scope=10
# Default route yang bergantung pada terjangkaunya 8.8.8.8
/ip route add dst-address=0.0.0.0/0 gateway=8.8.8.8 target-scope=11 \
    distance=1 check-gateway=ping comment="ISP-A"
# Cadangan
/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.9 distance=10 comment="ISP-B"
```

> [!TIP]
> **`scope` dan `target-scope`** adalah mekanisme khas RouterOS untuk mengontrol resolusi rekursif. Aturannya: sebuah rute dapat memakai gateway kalau **`target-scope` rute itu ≥ `scope` rute yang menyediakan gateway tersebut**. Default: `scope=30`, `target-scope=10`.

### Routing table terpisah (setara VRF/PBR)

```
# Buat routing table baru (RouterOS v7)
/routing table add name=via-ISP-B fib

# Tambahkan rute ke tabel itu
/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.9 routing-table=via-ISP-B

# Arahkan trafik tertentu ke tabel itu (mangle = PBR)
/ip firewall mangle add chain=prerouting src-address=192.168.30.0/24 \
    action=mark-routing new-routing-mark=via-ISP-B passthrough=no

/routing table print
/ip route print where routing-table=via-ISP-B
```

> [!WARNING]
> **Di RouterOS v6 sintaksnya berbeda:** memakai `routing-mark=` alih-alih `routing-table=`, dan tabel dibuat implisit. Selalu periksa versi dengan `/system resource print`.

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `show ip route` | `/ip route print` |
| `show ip route 8.8.8.8` | `/ip route check 8.8.8.8` |
| Administrative Distance | `distance` |
| `ip route ... null0` | `type=blackhole` |
| Floating static + IP SLA | `distance` + `check-gateway=ping` / recursive route |
| ECMP `maximum-paths` | beberapa gateway dipisah koma |
| VRF | `/routing table` (v7) atau `routing-mark` (v6) |
| PBR (route-map + set ip next-hop) | `/ip firewall mangle action=mark-routing` |
| `show ip cef` | `/ip route print detail` |

---

## 15. Ringkasan

- Router: dekapsulasi L2 → cek TTL → **longest prefix match** → enkapsulasi L2 baru.
- **Longest prefix match adalah aturan pertama** — lebih spesifik selalu menang, sebelum AD dan metric.
- **AD** = tingkat kepercayaan sumber rute (Connected 0, Static 1, eBGP 20, EIGRP 90, OSPF 110, RIP 120, iBGP 200). Dipakai hanya untuk prefix identik dari sumber berbeda.
- **Metric** = biaya dalam satu protokol; tidak bisa dibandingkan antar-protokol.
- Jenis rute: connected (C), local (L, /32), static (S), default (0.0.0.0/0), host (/32), summary, null.
- Static di Ethernet sebaiknya menyebut **interface + next hop**.
- **Floating static** (AD tinggi) untuk jalur cadangan otomatis.
- **Control plane** (CPU, membangun RIB) vs **data plane** (ASIC, memakai FIB). CEF membuat forwarding berjalan di hardware.
- Terlalu banyak paket yang "di-punt" ke CPU → router kewalahan.
- Masalah umum: routing loop, black hole, **asymmetric routing** (bermasalah dengan firewall stateful), suboptimal routing, recursive lookup gagal.
- **ECMP per-destination** aman; per-packet merusak TCP.
- Di dalam router: lookup LPM memakai trie multibit, DIR-24-8, atau **TCAM** (satu siklus, tetapi mahal, panas, dan terbatas; tabel internet sudah melewati 1 juta prefix IPv4). Adjacency table menyimpan header L2 siap tempel.
- Fabric (memori, bus, crossbar) memindah paket antarport. Antrean FIFO di input menimbulkan **HOL blocking** (maksimum ~58,6%); **VOQ** memecahkannya.
- Penjadwal (FIFO, strict priority, WFQ, DRR) menentukan siapa dikirim berikutnya; itulah bahan baku semua konfigurasi QoS.

---

## 16. Latihan

1. Routing table berisi `10.0.0.0/8 via A`, `10.1.0.0/16 via B`, `10.1.1.0/24 via C`, `0.0.0.0/0 via D`. Ke mana paket untuk `10.1.5.7` dikirim?
2. Router menerima `192.168.1.0/24` dari OSPF (metric 10) dan dari RIP (metric 2). Mana yang masuk routing table dan kenapa?
3. Jelaskan perbedaan rute `C` dan `L` dalam `show ip route`.
4. Anda mengonfigurasi static route tetapi tidak muncul di `show ip route`. Sebutkan tiga kemungkinan penyebab.
5. Apa itu floating static route dan kapan dipakai?
6. Kenapa memakai exit interface saja pada static route di link Ethernet bermasalah?
7. Firewall stateful membuang trafik balasan yang sah. Apa dugaan Anda?
8. Jelaskan perbedaan RIB dan FIB, dan kenapa pemisahan ini penting untuk kinerja.
9. FIB sebuah router berisi `0.0.0.0/0 → ISP`, `10.0.0.0/8 → A`, `10.20.0.0/16 → B`, `10.20.16.0/20 → C`, dan `10.20.17.0/24 → D`. (a) Ke mana paket untuk `10.20.17.5`, `10.20.18.9`, dan `10.21.0.1` diteruskan? (b) Kalau FIB disimpan sebagai trie multibit dengan stride 8-8-8-8, berapa entri yang dihasilkan prefix /20 di tingkat ketiga (oktet ketiga) di bawah `10.20`, dan apa isi entri untuk oktet ketiga = 17? (c) Seorang engineer menulis entri ini secara manual ke TCAM dengan urutan `10.20.0.0/16` di indeks 0, lalu `10.20.17.0/24`, lalu sisanya. Apa akibatnya bagi paket ke `10.20.17.5`, dan kenapa?
10. Sebuah vendor menawarkan switch agregasi 16 port murah untuk POP Anda di Balikpapan. Lembar spesifikasinya menyebut "input-queued, FIFO per port, fabric 1×". Rata-rata beban setiap port masuk 70%, tersebar merata ke semua port keluar. (a) Apakah switch ini sanggup? Jelaskan dengan konsep HOL blocking. (b) Apa yang harus Anda tanyakan ke vendor? (c) Di router lain, tiga link ke core dipakai sebagai ECMP dan engineer melihat salah satu link konsisten sekitar 20% lebih ramai daripada dua lainnya walaupun alirannya banyak dan mirip. Berikan satu penjelasan berbasis struktur FIB.

<details>
<summary>Jawaban</summary>

1. Cocok dengan `/8` (10.x.x.x ✓), `/16` (10.1.x.x ✓), dan `/0`. Tidak cocok dengan `/24` (10.1.1.x — tujuan 10.1.5.7 bukan 10.1.1.x). Prefix terpanjang yang cocok adalah **/16 → dikirim ke B**.

2. **OSPF menang.** AD OSPF = 110, AD RIP = 120; AD yang lebih kecil lebih dipercaya. Metric tidak dibandingkan karena berasal dari protokol berbeda dengan skala yang tidak sebanding. Rute RIP tetap disimpan di database RIP dan akan menggantikan jika rute OSPF hilang.

3. **C** (connected) adalah rute untuk seluruh **subnet** yang terhubung langsung ke interface (mis. `10.1.1.0/24`). **L** (local) adalah rute **/32** untuk alamat IP interface router itu sendiri (mis. `10.1.1.1/32`). Rute L memungkinkan router mengenali secara efisien paket yang ditujukan kepada dirinya sendiri, memisahkannya dari paket yang harus diteruskan.

4. (a) **Recursive lookup gagal** — router tidak punya rute ke alamat next hop yang disebut; (b) **interface keluar down** — jika static memakai exit interface dan interface itu down, rute tidak dipasang; (c) ada rute lain untuk prefix yang sama dengan **AD lebih rendah** yang menang; (d) salah ketik pada alamat/mask; (e) VRF yang berbeda dari yang dilihat.

5. **Floating static route** adalah static route yang diberi **administrative distance lebih tinggi** daripada rute utama, sehingga tidak dipasang ke routing table selama rute utama masih ada. Ketika rute utama hilang (interface down, protokol routing kehilangan tetangga, atau IP SLA tracking gagal), floating static otomatis masuk dan trafik beralih ke jalur cadangan. Dipakai untuk backup link — misalnya jalur utama MPLS lewat OSPF (AD 110) dan cadangan lewat VPN internet sebagai static dengan AD 130.

6. Pada link **multi-access** seperti Ethernet, ada banyak tetangga yang mungkin di segmen itu. Dengan hanya menyebut exit interface, router menganggap **semua alamat tujuan** dalam rute tersebut "terhubung langsung" di interface itu, sehingga ia akan mengirim **ARP request untuk setiap alamat tujuan** yang berbeda. Akibatnya: ARP request membanjiri jaringan, ARP table membengkak, dan CPU meningkat. Pada link point-to-point hal ini tidak terjadi karena hanya ada satu tetangga. Solusi: sebutkan **interface + next hop**.

7. **Asymmetric routing.** Trafik pergi melewati satu jalur (tidak melalui firewall, atau melalui firewall lain), sedangkan trafik balasan melewati firewall ini. Firewall stateful tidak memiliki entri sesi untuk trafik balasan tersebut (karena tidak pernah melihat paket SYN pergi), sehingga menganggapnya trafik tidak sah dan membuangnya. Perbaikan: pastikan trafik simetris (perbaiki routing atau desain), atau gunakan firewall cluster dengan sinkronisasi state, atau kecualikan jalur tersebut dari inspeksi stateful.

8. **RIB** (`show ip route`) berisi **semua** rute yang diketahui router dari semua sumber, lengkap dengan metadata (AD, metric, sumber, umur). Ia dikelola oleh **control plane (CPU)** dan dioptimalkan untuk kelengkapan dan pengambilan keputusan.
   **FIB** (`show ip cef`) berisi hanya **rute terbaik yang sudah diputuskan**, dalam format yang dioptimalkan untuk lookup cepat oleh **hardware (ASIC)** — termasuk MAC next hop yang sudah di-resolve dan header L2 yang siap dipasang.
   Pemisahan ini penting karena: control plane bisa lambat dan kompleks (menjalankan SPF, memproses ribuan update BGP) tanpa memengaruhi kecepatan forwarding; sementara data plane bisa meneruskan jutaan paket per detik di hardware tanpa melibatkan CPU sama sekali.

9. (a) `10.20.17.5` cocok dengan /0, /8, /16, /20 (10.20.16.0-10.20.31.255), dan /24 (10.20.17.x). Terpanjang **/24 → D**. `10.20.18.9` cocok /0, /8, /16, /20, tetapi bukan /24. Terpanjang **/20 → C**. `10.21.0.1` cocok /0 dan /8 saja (bukan 10.20.x.x). Terpanjang **/8 → A**.
   (b) /20 berhenti 4 bit sebelum batas stride /24, sehingga dikembangkan menjadi 2^(24−20) = **16 entri**: oktet ketiga 16 sampai 31, semuanya → C. Entri oktet ketiga = **17** kemudian **ditimpa** oleh prefix yang lebih panjang `10.20.17.0/24` → **D** (entri yang lebih spesifik menang saat pengembangan).
   (c) TCAM memilih kecocokan dengan **indeks terkecil**, dan tidak tahu apa pun tentang panjang prefix. `10.20.17.5` cocok dengan `/16` di indeks 0, sehingga paket dikirim ke **B**, bukan D. Longest prefix match hanya benar kalau entri diurutkan dari prefix terpanjang ke terpendek. Itulah sebabnya perangkat lunak router, bukan manusia, yang mengatur penempatan entri TCAM.

10. (a) **Tidak sanggup.** Dengan antrean FIFO di input, paket di kepala antrean yang ditujukan ke port keluar yang sedang dipakai menahan paket di belakangnya, walaupun port tujuan paket itu menganggur. Untuk trafik acak seragam, throughput maksimum switch input-queued FIFO sekitar 2 − √2 ≈ 58,6% untuk N besar (sekitar 60% untuk 16 port). Beban 70% melebihi batas itu, sehingga antrean input tumbuh terus sampai buffer penuh dan paket dibuang, walaupun tidak ada port keluar yang kelebihan beban secara rata-rata.
   (b) Tanyakan apakah fabric memakai **Virtual Output Queue** (satu antrean per port keluar di setiap input) dan algoritma penjadwal apa (misalnya keluarga iSLIP), berapa **speedup** fabric, berapa buffer per port dan apakah buffer dibagi, dan minta hasil uji throughput dengan trafik *full mesh* (misalnya metodologi RFC 2544/RFC 2889), bukan hanya uji port-ke-port.
   (c) Pada CEF klasik, ECMP memakai **16 bucket** hash. Tiga jalur tidak membagi 16 dengan rata: 6 + 5 + 5, sehingga satu link menerima 6/16 = 37,5% dan dua lainnya 31,25%. Selisihnya 6/5 = **20% lebih banyak**, persis gejalanya. Perbaikan: pakai jumlah jalur yang membagi habis jumlah bucket (2 atau 4), atau platform yang memakai tabel hash lebih besar. Penjelasan lain yang mungkin: polarisasi hash ketika beberapa router berurutan memakai fungsi hash yang sama.

</details>

---

## 17. Sumber

- RFC 1812 — Requirements for IP Version 4 Routers
- RFC 4632 — CIDR (longest prefix match)
- Cisco CCNA 200-301 v1.1, topik 3.1 (komponen routing table) dan 3.2 (keputusan forwarding: longest prefix match, AD, metric)
- Cisco, *Cisco Express Forwarding Overview*
- Cisco, *Route Selection in Cisco Routers* (Document ID 8651)
- Computer Networks: A Systems Approach, 3.5 Implementation (software switch, NPU, TCAM, control/data plane): https://book.systemsapproach.org/internetworking/impl.html
- Computer Networks: A Systems Approach, 6.2 Queuing Disciplines (FIFO, priority, FQ, WFQ): https://book.systemsapproach.org/congestion/queuing.html
- Gupta, Lin, McKeown (1998), Routing Lookups in Hardware at Memory Access Speeds: https://doi.org/10.1109/INFCOM.1998.662938
- Karol, Hluchyj, Morgan (1987), Input Versus Output Queueing on a Space-Division Packet Switch: https://doi.org/10.1109/TCOM.1987.1096719
- McKeown (1999), The iSLIP Scheduling Algorithm for Input-Queued Switches: https://doi.org/10.1109/90.769767
- Demers, Keshav, Shenker (1989), Analysis and Simulation of a Fair Queueing Algorithm: https://doi.org/10.1145/75247.75248
- Shreedhar & Varghese (1995), Efficient Fair Queueing Using Deficit Round Robin: https://doi.org/10.1145/217382.217453
- CIDR Report (ukuran tabel BGP IPv4): https://www.cidr-report.org/as2.0/
- CIDR Report (ukuran tabel BGP IPv6): https://www.cidr-report.org/v6/as2.0/
- Kernel Linux, dokumentasi fib_trie: https://www.kernel.org/doc/html/latest/networking/fib_trie.html

Subbagian 9.1, 9.4, dan 9.8 mengadaptasi sebagian penjelasan dari *Computer Networks: A Systems Approach*, Larry Peterson & Bruce Davie, © Elsevier 2012, https://github.com/SystemsApproach/book, lisensi CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Perubahan: diterjemahkan ke bahasa Indonesia, diringkas, dan diberi contoh hitung baru.

---

**Berikutnya:** `05-transport/01-port-socket.md`. Masuk ke Layer 4.

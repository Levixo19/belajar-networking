# 07.5 EIGRP

> **Prasyarat:** `07-routing-lanjutan/02`, `07-routing-lanjutan/04`
> **Tujuan:** Anda paham DUAL, successor/feasible successor, metrik composite, dan bisa mengonfigurasi EIGRP termasuk named mode.

---

## 1. Karakteristik EIGRP

| Aspek | Nilai |
|---|---|
| Jenis | Advanced distance vector (hybrid) |
| Algoritma | DUAL (Diffusing Update Algorithm) |
| Metrik | Composite: bandwidth + delay (+ reliability, load, MTU jika K diubah) |
| AD | 90 (internal), 170 (external), 5 (summary) |
| Transport | RTP (Reliable Transport Protocol) langsung di IP, protokol 88 |
| Multicast | 224.0.0.10 (IPv4), FF02::A (IPv6) |
| Standar | RFC 7868 (Informational; sebelumnya proprietary Cisco) |
| Classless | Ya |

### Kelebihan EIGRP

- **Konvergensi sangat cepat**: feasible successor memberi jalur cadangan tanpa perhitungan ulang
- **Update parsial dan terbatas**: hanya perubahan, hanya ke router yang perlu tahu
- **Unequal-cost load balancing**: satu-satunya IGP yang mendukungnya (lewat `variance`)
- Ringan pada CPU dibanding link state
- Konfigurasi lebih sederhana daripada OSPF multi-area

### Kekurangan

- **Praktis hanya Cisco**: meski RFC 7868 menerbitkan spesifikasinya, dukungan vendor lain terbatas
- Tidak ada konsep area, sehingga skalabilitas bergantung pada summarization manual
- Metrik composite lebih sulit diprediksi daripada cost OSPF

> [!TIP]
> **Kapan memilih EIGRP:** jaringan all-Cisco yang menginginkan konvergensi tercepat dan konfigurasi sederhana. Untuk lingkungan multi-vendor atau jaringan yang mungkin berganti vendor, OSPF lebih aman.

---

## 2. Tiga Tabel EIGRP

```
1. NEIGHBOR TABLE   — daftar tetangga yang aktif
2. TOPOLOGY TABLE   — SEMUA rute yang diketahui, termasuk yang tidak dipakai
3. ROUTING TABLE    — hanya successor (rute terbaik) yang dipasang
```

```
R1# show ip eigrp neighbors
R1# show ip eigrp topology
R1# show ip eigrp topology all-links      ← termasuk yang tidak feasible
R1# show ip route eigrp
```

---

## 3. DUAL (Successor dan Feasible Successor)

Ini inti EIGRP dan alasan konvergensinya sangat cepat.

### Istilah

| Istilah | Arti |
|---|---|
| **FD** (Feasible Distance) | Metrik total dari router ini ke tujuan lewat jalur terbaik |
| **AD/RD** (Advertised/Reported Distance) | Metrik yang dilaporkan tetangga dari dirinya ke tujuan |
| **Successor** | Tetangga dengan FD terkecil → dipasang ke routing table |
| **Feasible Successor (FS)** | Jalur cadangan yang dijamin bebas loop |

### Feasibility Condition: aturan kunci

> **Sebuah jalur menjadi Feasible Successor jika AD tetangga itu < FD saat ini.**

```
AD_tetangga < FD_saya  →  Feasible Successor ✅
```

**Kenapa aturan ini menjamin bebas loop?** Karena kalau tetangga melaporkan jarak yang lebih kecil daripada jarak total saya, ia pasti tidak melewati saya untuk mencapai tujuan (kalau lewat saya, jaraknya pasti lebih besar dari FD saya).

### Contoh

```
                    ┌──── R2 ────┐
   R1 ──────────────┤            ├──── [Net X]
                    └──── R3 ────┘

Dari R1:
  Lewat R2: FD = 30 (R2 melaporkan AD = 20)
  Lewat R3: FD = 45 (R3 melaporkan AD = 25)

SUCCESSOR = R2 (FD 30 terkecil) → masuk routing table

Apakah R3 menjadi Feasible Successor?
  AD_R3 (25) < FD_saat_ini (30)?  → 25 < 30 → YA ✅
  → R3 adalah FEASIBLE SUCCESSOR
```

**Manfaatnya:**
```
Kalau jalur lewat R2 mati:
  Dengan FS      → langsung pakai R3, konvergensi HAMPIR INSTAN (milidetik)
  Tanpa FS       → masuk ACTIVE state, kirim QUERY ke semua tetangga,
                   tunggu REPLY → jauh lebih lambat
```

### Contoh yang TIDAK feasible

```
  Lewat R2: FD = 30 (AD = 20)  → successor
  Lewat R3: FD = 45 (AD = 35)

  AD_R3 (35) < FD (30)?  → 35 < 30 → TIDAK ✅
  → R3 BUKAN feasible successor
```

Jalur lewat R3 mungkin sebenarnya valid, tetapi EIGRP tidak bisa membuktikannya bebas loop, sehingga bersikap konservatif. Kalau successor hilang, EIGRP harus melakukan query.

### Passive vs Active

```
PASSIVE = rute stabil, ada successor  ✅ (kondisi normal)
ACTIVE  = successor hilang dan TIDAK ada FS
          → kirim QUERY ke semua tetangga
          → tunggu REPLY dari semuanya
```

> [!WARNING]
> **SIA (Stuck In Active)**: router tidak menerima REPLY dalam batas waktu (default 3 menit).
```
%DUAL-3-SIA: Route 10.1.1.0/24 stuck-in-active state in IP-EIGRP(0) 1.
Cleaning up
```

Penyebab SIA:
- Query menyebar terlalu jauh (**query scope** terlalu luas)
- Link lambat atau tidak stabil
- Router yang kelebihan beban tidak sempat membalas
- Adjacency yang putus di tengah proses query

**Mitigasi SIA:**
1. **Summarization**: membatasi query scope (router yang punya summary langsung membalas)
2. **Stub router**: router stub tidak di-query untuk rute transit
3. Perbaiki stabilitas link
4. `timers active-time` untuk menyesuaikan batas waktu

> [!TIP]
> **Query scope adalah faktor skalabilitas utama EIGRP.** Tanpa summarization dan stub, query bisa menyebar ke seluruh jaringan. Itulah kelemahan EIGRP di jaringan besar.

---

## 4. Metrik Composite

### Formula

```
Metric = 256 × [ (K1 × Bandwidth) + (K2 × Bandwidth)/(256 − Load)
                 + (K3 × Delay) ] × [ K5 / (Reliability + K4) ]

Default: K1 = 1, K2 = 0, K3 = 1, K4 = 0, K5 = 0
→ Menyederhanakan menjadi:

Metric = 256 × (Bandwidth + Delay)

di mana:
  Bandwidth = 10.000.000 / bandwidth_terkecil_di_jalur (kbps)
  Delay     = jumlah_semua_delay_di_jalur (dalam satuan 10 mikrodetik)
```

> [!WARNING]
> **Perhatikan asimetrinya:**
- **Bandwidth** = yang TERKECIL (bottleneck) sepanjang jalur
- **Delay** = JUMLAH semua delay sepanjang jalur

### Contoh perhitungan

```
Jalur: R1 → R2 (100 Mbps, delay 100 µs) → R3 (10 Mbps, delay 1000 µs)

Bandwidth terkecil = 10 Mbps = 10.000 kbps
  → 10.000.000 / 10.000 = 1000

Delay total = 100 + 1000 = 1100 µs = 110 (satuan 10 µs)

Metric = 256 × (1000 + 110) = 256 × 1110 = 284.160
```

> [!WARNING]
> **JANGAN ubah nilai K** kecuali Anda benar-benar memahami konsekuensinya:
- K harus sama persis di semua router, atau adjacency tidak terbentuk
- Memakai load (K2) atau reliability (K4/K5) menyebabkan metrik berubah terus-menerus → rute flapping → jaringan tidak stabil

```
R1(config-router)# metric weights 0 1 0 1 0 0    ← default (TOS K1 K2 K3 K4 K5)
```

### Memengaruhi metrik dengan benar

```
# Ubah delay (CARA YANG DIREKOMENDASIKAN)
R1(config-if)# delay 200          ← satuan 10 mikrodetik → 2000 µs

# Ubah bandwidth (HATI-HATI)
R1(config-if)# bandwidth 10000    ← kbps
```

> [!WARNING]
> **Mengubah `bandwidth` memengaruhi banyak hal lain**: perhitungan QoS, `ip bandwidth-percent`, statistik SNMP, dan protokol lain. Gunakan `delay` untuk memanipulasi metrik EIGRP karena efeknya terisolasi.

### Wide Metrics (EIGRP Named Mode)

Metrik klasik 32-bit tidak bisa membedakan link di atas ~10 Gbps. **Wide metrics** memakai 64 bit:
```
R1(config-router-af)# metric rib-scale 128
R1(config-router-af)# metric version 64bit
```

---

## 5. Konfigurasi

### Classic Mode

```
R1(config)# router eigrp 100                 ← 100 = AS number, harus SAMA di semua router
R1(config-router)# eigrp router-id 1.1.1.1
R1(config-router)# no auto-summary           ← WAJIB (default sudah no di IOS baru)
R1(config-router)# network 10.0.0.0 0.0.0.255
R1(config-router)# network 192.168.1.0
R1(config-router)# passive-interface default
R1(config-router)# no passive-interface gi0/1
```

> [!WARNING]
> **AS number harus identik di semua router** yang akan membentuk adjacency. Ini bukan AS BGP, hanya pengenal proses lokal.

> [!WARNING]
> EIGRP menerima `network` dengan atau tanpa wildcard mask. Tanpa wildcard, ia diperlakukan classful.

### Named Mode (modern, direkomendasikan)

```
R1(config)# router eigrp PERUSAHAAN
R1(config-router)# address-family ipv4 unicast autonomous-system 100
R1(config-router-af)# eigrp router-id 1.1.1.1
R1(config-router-af)# network 10.0.0.0 0.0.0.255

R1(config-router-af)# af-interface default
R1(config-router-af-interface)# passive-interface
R1(config-router-af-interface)# exit

R1(config-router-af)# af-interface gi0/1
R1(config-router-af-interface)# no passive-interface
R1(config-router-af-interface)# hello-interval 5
R1(config-router-af-interface)# hold-time 15
R1(config-router-af-interface)# authentication mode hmac-sha-256 RahasiaKuat
R1(config-router-af-interface)# summary-address 192.168.0.0 255.255.252.0
```

**Keunggulan named mode:**
- Semua konfigurasi terpusat di satu tempat (bukan tersebar di interface)
- Mendukung HMAC-SHA-256 (classic hanya MD5)
- Mendukung wide metrics
- Mendukung IPv4 dan IPv6 dalam satu proses
- Lebih mudah dibaca dan diaudit

### Autentikasi (classic mode)

```
R1(config)# key chain EIGRP-KEYS
R1(config-keychain)# key 1
R1(config-keychain-key)# key-string RahasiaKuat

R1(config)# interface gi0/1
R1(config-if)# ip authentication mode eigrp 100 md5
R1(config-if)# ip authentication key-chain eigrp 100 EIGRP-KEYS
```

### Timer

```
Default pada link cepat (> T1) : hello 5 detik, hold 15 detik
Default pada link lambat        : hello 60 detik, hold 180 detik

R1(config-if)# ip hello-interval eigrp 100 5
R1(config-if)# ip hold-time eigrp 100 15
```

> [!WARNING]
> **Hello dan hold interval TIDAK harus cocok** untuk membentuk adjacency di EIGRP (berbeda dari OSPF). Tetapi hold time harus lebih besar daripada hello interval tetangga, atau adjacency akan naik-turun.

---

## 6. Summarization

EIGRP melakukan summarization per interface, bukan di batas area (tidak ada area).

```
R1(config)# interface gi0/1
R1(config-if)# ip summary-address eigrp 100 192.168.0.0 255.255.252.0

# Named mode
R1(config-router-af-interface)# summary-address 192.168.0.0 255.255.252.0
```

Efeknya:
- Rute spesifik tidak lagi diiklankan lewat interface itu
- Router otomatis membuat rute null0 untuk summary (mencegah loop)
- **Query scope terbatas**: router yang punya summary langsung membalas query, tidak meneruskannya

> [!TIP]
> **Summarization adalah alat skalabilitas utama EIGRP.** Ia mengecilkan tabel dan membatasi query scope sekaligus.

### Auto-summary

```
R1(config-router)# no auto-summary
```
> [!WARNING]
> Auto-summary meringkas ke batas classful, merusak jaringan discontiguous. Default `no auto-summary` sejak IOS 15, tetapi selalu verifikasi.

---

## 7. Stub Router

Router stub memberi tahu tetangganya: *"Jangan kirim query ke saya untuk rute transit. Saya tidak punya jalur alternatif."*

```
R2(config-router)# eigrp stub connected summary
```

**Opsi stub:**
| Opsi | Yang diiklankan |
|---|---|
| `connected` | Rute connected (default) |
| `summary` | Summary route (default) |
| `static` | Static route yang di-redistribute |
| `redistributed` | Rute hasil redistribusi |
| `receive-only` | Tidak mengiklankan apa pun |
| `leak-map` | Kecualikan rute tertentu dari pembatasan stub |

**Manfaat:**
- **Membatasi query scope secara drastis** → mencegah SIA
- Mengurangi beban CPU dan bandwidth
- Meningkatkan stabilitas

> [!TIP]
> **Konfigurasikan semua router cabang (spoke) sebagai stub.** Ini praktik standar di jaringan hub-and-spoke dan salah satu perbaikan skalabilitas EIGRP yang paling efektif.

> [!WARNING]
> Router stub tidak akan meneruskan trafik transit antar-tetangga. Jangan pakai pada router yang memang berfungsi sebagai transit.

---

## 8. Unequal-Cost Load Balancing (Variance)

> [!WARNING]
> **Hanya EIGRP yang punya ini** di antara IGP.

```
R1(config-router)# variance 2
```

Artinya: pakai juga jalur dengan metrik sampai 2 × metrik successor, dengan syarat jalur itu adalah feasible successor.

```
Successor       : metric 100.000
Feasible Succ.  : metric 180.000
Jalur ketiga    : metric 250.000

Dengan variance 2 (batas = 200.000):
  → successor (100.000) ✅ dipakai
  → FS (180.000)        ✅ dipakai
  → jalur ketiga (250.000) ❌ di atas batas

Trafik dibagi PROPORSIONAL terbalik terhadap metrik:
  jalur 100.000 mendapat lebih banyak daripada jalur 180.000
```

> [!WARNING]
> **Syarat mutlak: jalur harus feasible successor.** Variance tidak akan memakai jalur yang gagal feasibility condition, karena itu bisa menyebabkan loop.

```
R1(config-router)# maximum-paths 6         ← maksimum jalur yang dipakai
R1(config-router)# traffic-share balanced  ← default: proporsional
R1(config-router)# traffic-share min       ← hanya jalur terbaik yang membawa trafik
```

---

## 9. EIGRP untuk IPv6

```
# Classic
R1(config)# ipv6 unicast-routing
R1(config)# ipv6 router eigrp 100
R1(config-rtr)# eigrp router-id 1.1.1.1
R1(config-rtr)# no shutdown              ← WAJIB! EIGRPv6 shutdown by default
R1(config)# interface gi0/1
R1(config-if)# ipv6 eigrp 100

# Named mode (lebih baik — satu proses untuk IPv4 & IPv6)
R1(config)# router eigrp PERUSAHAAN
R1(config-router)# address-family ipv6 unicast autonomous-system 100
R1(config-router-af)# eigrp router-id 1.1.1.1
```

> [!WARNING]
> **`no shutdown` pada proses EIGRPv6 sering terlupa.** Proses dibuat dalam keadaan shutdown secara default, sehingga tidak ada adjacency yang terbentuk walau konfigurasi lain benar.

---

## 10. Verifikasi dan Troubleshooting

```
R1# show ip eigrp neighbors
IP-EIGRP neighbors for process 100
H   Address    Interface  Hold Uptime   SRTT   RTO  Q  Seq
                          (sec)         (ms)       Cnt Num
0   10.0.0.2   Gi0/1        13 01:23:45   12   100   0  25

R1# show ip eigrp topology
P 192.168.20.0/24, 1 successors, FD is 3072
        via 10.0.0.2 (3072/2816), GigabitEthernet0/1      ← successor
        via 10.0.0.6 (5120/2560), GigabitEthernet0/2      ← feasible successor
              │       │      │
              │       │      └── AD tetangga (2560 < FD 3072 → FEASIBLE ✅)
              │       └── FD lewat jalur ini
              └── next hop

P = Passive (stabil)
A = Active (sedang query — masalah!)

R1# show ip eigrp topology all-links     ← termasuk yang tidak feasible
R1# show ip eigrp interfaces
R1# show ip eigrp traffic
R1# show ip protocols
R1# show ip route eigrp
R1# debug eigrp packets
R1# debug ip eigrp
```

### Membaca kolom penting

| Kolom | Arti |
|---|---|
| **Q Cnt** | Jumlah paket yang menunggu dikirim. Tidak nol terus = masalah! |
| **SRTT** | Smoothed round-trip time ke tetangga |
| **RTO** | Retransmission timeout |
| **Hold** | Detik tersisa sebelum tetangga dianggap mati |
| **Seq Num** | Nomor urut paket terakhir |

### Kenapa adjacency tidak terbentuk

```
✓ AS number sama?                    ← penyebab #1
✓ Nilai K sama?                      ← penyebab #2
✓ Subnet primer sama?                ← EIGRP tidak membentuk adjacency lewat secondary address
✓ Autentikasi cocok?
✓ Interface passive?
✓ ACL memblokir protokol 88 atau multicast 224.0.0.10?
✓ EIGRPv6: sudah "no shutdown"?
```

```
R1# show ip protocols | include EIGRP metric
  EIGRP metric weight K1=1, K2=0, K3=1, K4=0, K5=0
```

---

## 11. Ringkasan

- EIGRP: advanced distance vector, algoritma DUAL, AD 90 (internal) / 170 (external), protokol IP 88, multicast 224.0.0.10.
- Tiga tabel: neighbor, topology (semua rute), routing (successor saja).
- **Successor** = FD terkecil. **Feasible Successor** = jalur cadangan bebas loop, syaratnya AD tetangga < FD saya.
- Adanya FS memberi konvergensi hampir instan; tanpa FS, rute masuk ACTIVE dan harus query.
- **SIA** terjadi kalau query tidak terjawab. Mitigasinya dengan summarization dan stub router.
- Metrik default = `256 × (bandwidth + delay)` di mana bandwidth = terkecil dan delay = jumlah.
- **Ubah `delay`, bukan `bandwidth`**, untuk memanipulasi metrik.
- **Nilai K harus identik** di semua router, atau adjacency gagal. Jangan aktifkan load/reliability.
- **Named mode** lebih baik: terpusat, HMAC-SHA-256, wide metrics, IPv4+IPv6 satu proses.
- **Summarization per interface** mengecilkan tabel dan membatasi query scope.
- **Stub router** untuk semua cabang: praktik standar untuk skalabilitas.
- **`variance`** memberi unequal-cost load balancing (hanya EIGRP yang punya); syaratnya jalur harus FS.
- **EIGRPv6 shutdown by default**, jadi jangan lupa `no shutdown`.

---

## 12. Latihan

1. Successor punya FD 5000. Ada tiga jalur alternatif dengan (FD/AD): A (6000/4500), B (7000/5200), C (5500/4900). Mana yang menjadi feasible successor?
2. Apa yang terjadi kalau successor hilang dan tidak ada feasible successor?
3. Jelaskan penyebab SIA dan dua cara mencegahnya.
4. Kenapa mengubah `delay` lebih baik daripada `bandwidth` untuk memengaruhi metrik EIGRP?
5. Dua router tidak membentuk adjacency EIGRP. Sebutkan lima hal yang Anda periksa.
6. Apa itu variance dan apa syarat mutlaknya?
7. Sebuah jaringan hub-and-spoke dengan 50 cabang sering mengalami SIA. Apa dua perubahan paling efektif?

<details>
<summary>Jawaban</summary>

1. Feasibility condition: AD tetangga < FD saat ini (5000).
   - A: AD 4500 < 5000 → FS
   - B: AD 5200 < 5000? Tidak → bukan FS
   - C: AD 4900 < 5000 → FS
   Jadi **A dan C** adalah feasible successor. B mungkin sebenarnya jalur yang valid, tetapi EIGRP tidak dapat membuktikannya bebas loop sehingga tidak menyimpannya sebagai cadangan.

2. Rute masuk state ACTIVE. Router mengirim QUERY ke semua tetangganya (kecuali yang lewat jalur yang hilang), menanyakan apakah mereka punya jalur ke tujuan itu. Router harus menunggu REPLY dari semua tetangga sebelum bisa memilih jalur baru dan kembali ke PASSIVE. Proses ini jauh lebih lambat daripada beralih ke FS yang sudah tersedia, dan berisiko menyebar luas (query bisa diteruskan ke tetangga berikutnya). Penyebaran inilah yang bisa berujung pada SIA.

3. **SIA (Stuck In Active)** terjadi ketika router tidak menerima REPLY untuk query-nya dalam batas waktu (default 3 menit), sehingga ia memutus adjacency dengan tetangga yang tidak membalas. Penyebabnya: query menyebar terlalu jauh melintasi banyak router; link lambat/tidak stabil; router yang kelebihan beban; atau adjacency putus di tengah proses.
   **Dua cara paling efektif mencegahnya:** (a) **summarization**: router yang memiliki summary route dapat langsung membalas query tanpa meneruskannya, sehingga query scope terpotong; (b) **stub router**: router stub secara eksplisit memberi tahu bahwa ia tidak punya jalur transit, sehingga tidak pernah di-query untuk rute transit.

4. Karena `bandwidth` memengaruhi banyak subsistem lain selain EIGRP: perhitungan QoS (`bandwidth-percent`, CBWFQ), statistik utilisasi SNMP, cost OSPF jika berjalan bersamaan, dan berbagai fitur yang memakai nilai bandwidth interface. Mengubahnya untuk memanipulasi routing bisa menimbulkan efek samping yang tidak diinginkan dan sulit dilacak.
   **`delay`** hanya dipakai oleh EIGRP (dan sedikit fitur lain), sehingga efeknya terisolasi dan dapat diprediksi. Ini alasan Cisco secara konsisten merekomendasikan `delay` untuk *traffic engineering* pada EIGRP.

5. (a) **AS number**: harus identik di kedua router (`router eigrp 100`); (b) **nilai K**: `show ip protocols` dan bandingkan K1-K5; berbeda satu saja → adjacency ditolak; (c) **subnet primer**: kedua interface harus berada di subnet yang sama; EIGRP tidak membentuk adjacency lewat secondary address; (d) **autentikasi**: mode dan key-chain harus cocok, termasuk nomor key; (e) **passive-interface**: periksa `show ip protocols`; (f) **ACL/firewall** yang memblokir protokol IP 88 atau multicast 224.0.0.10; (g) untuk EIGRPv6: apakah proses sudah `no shutdown`; (h) interface up/up dan MTU wajar.

6. **`variance N`** memungkinkan EIGRP memakai jalur yang metriknya sampai N × metrik successor untuk load balancing, dengan trafik dibagi proporsional terbalik terhadap metrik (jalur lebih baik membawa lebih banyak). Ini menjadikan EIGRP satu-satunya IGP dengan unequal-cost load balancing.
   **Syarat mutlaknya:** jalur alternatif itu harus merupakan feasible successor (memenuhi `AD tetangga < FD`). Tanpa syarat ini, EIGRP bisa mengirim trafik ke jalur yang sebenarnya kembali melewati dirinya sendiri, sehingga terjadi routing loop. Jalur yang gagal feasibility condition tidak akan dipakai berapa pun nilai variance-nya.

7. (a) **Konfigurasikan semua 50 cabang sebagai stub router** (`eigrp stub connected summary`). Ini menghentikan hub mengirim query ke cabang untuk rute transit. Query scope berkurang drastis, karena cabang memang tidak pernah menjadi jalur transit dalam topologi hub-and-spoke.
   (b) **Terapkan summarization di hub** ke arah cabang, dan di cabang ke arah hub. Summary memungkinkan router membalas query secara lokal tanpa meneruskannya, dan mengecilkan tabel topologi.
   Tambahan yang membantu: perbaiki stabilitas link WAN yang flapping, pastikan CPU router hub tidak jenuh, dan pertimbangkan menaikkan `timers active-time` sebagai mitigasi sementara (bukan solusi).

</details>

---

## 13. Sumber

- RFC 7868, Cisco's Enhanced Interior Gateway Routing Protocol (EIGRP)
- Cisco, *EIGRP Configuration Guide*
- Cisco, *Enhanced Interior Gateway Routing Protocol* (Document ID 16406)
- Garcia-Luna-Aceves, J.J. (1993), *Loop-Free Routing Using Diffusing Computations* (dasar DUAL)

---

**Berikutnya:** `07-routing-lanjutan/06-bgp.md`. Protokol yang menjalankan internet.

# 07.4 OSPF

> **Prasyarat:** `07-routing-lanjutan/02`
> **Tujuan:** Anda bisa mengonfigurasi single-area dan multi-area OSPF, memahami LSA dan tipe area, serta mendiagnosis kegagalan adjacency dengan sistematis.

> > [!NOTE]
> > **OSPF adalah topik routing terpenting di CCNA (topik 3.4) dan protokol IGP yang paling banyak dipakai di enterprise.** Kuasai modul ini dengan baik.

---

## 1. Karakteristik OSPF

| Aspek | Nilai |
|---|---|
| Jenis | Link state |
| Algoritma | Dijkstra SPF |
| Metrik | Cost = reference_bandwidth / bandwidth |
| Administrative Distance | 110 |
| Transport | Langsung di atas IP, protokol 89 (bukan TCP/UDP) |
| Multicast | 224.0.0.5 (AllSPFRouters), 224.0.0.6 (AllDRouters) |
| Versi | OSPFv2 (IPv4), OSPFv3 (IPv6 dan IPv4) |
| Standar | RFC 2328 (v2), RFC 5340 (v3) |
| Classless | Ya (VLSM & CIDR) |
| Hierarki | Area |

---

## 2. Router ID

Setiap router OSPF membutuhkan **Router ID (RID)**, yaitu pengenal unik 32 bit berformat seperti alamat IP.

**Urutan pemilihan:**
```
1. Perintah eksplisit: router-id X.X.X.X          ← DIREKOMENDASIKAN
2. Alamat IP TERTINGGI dari interface LOOPBACK yang aktif
3. Alamat IP TERTINGGI dari interface FISIK yang aktif
```

```
R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1# clear ip ospf process          ← perlu untuk menerapkan RID baru
```

> [!TIP]
> **Praktik terbaik: selalu set RID eksplisit** dan gunakan skema yang bermakna (mis. `1.1.1.1` untuk R1). Alasannya:
- RID yang berasal dari interface fisik bisa berubah kalau interface itu down → memicu rekalkulasi dan gangguan
- RID yang bermakna sangat memudahkan troubleshooting
- Loopback selalu up, sehingga stabil

```
R1(config)# interface loopback0
R1(config-if)# ip address 1.1.1.1 255.255.255.255
```

> [!WARNING]
> **Perubahan RID tidak berlaku sampai proses OSPF di-restart** (`clear ip ospf process`), dan restart itu memutus semua adjacency sementara. Rencanakan di jendela pemeliharaan.

---

## 3. Neighbor Adjacency

### Tahapan state

```
DOWN       → belum ada hello diterima
INIT       → hello diterima, tapi RID kita belum ada di dalamnya
2-WAY      → hello diterima dan RID kita ADA di dalamnya
             (komunikasi dua arah terkonfirmasi)
             ← Pada jaringan broadcast, DR/BDR dipilih di sini
             ← Router non-DR/BDR BERHENTI di 2-WAY (normal!)
EXSTART    → menentukan siapa master/slave untuk pertukaran database
EXCHANGE   → bertukar DBD (Database Description) — ringkasan LSDB
LOADING    → meminta LSA yang kurang (LSR/LSU/LSAck)
FULL       → LSDB identik → adjacency lengkap ✅
```

> [!WARNING]
> **Pada jaringan broadcast, tidak semua router mencapai FULL satu sama lain.** Router non-DR/BDR hanya mencapai 2-WAY dengan sesama router non-DR, dan itu normal. Mereka mencapai FULL hanya dengan DR dan BDR.

```
R1# show ip ospf neighbor
Neighbor ID     Pri   State           Dead Time   Address       Interface
2.2.2.2           1   FULL/DR         00:00:34    10.0.0.2      Gi0/1
3.3.3.3           1   FULL/BDR        00:00:33    10.0.0.3      Gi0/1
4.4.4.4           1   2WAY/DROTHER    00:00:35    10.0.0.4      Gi0/1  ← NORMAL
```

### Syarat pembentukan adjacency

Semua ini harus cocok, atau adjacency tidak terbentuk:

```
✓ Area ID sama
✓ Subnet dan subnet mask sama (kecuali pada point-to-point)
✓ Hello interval sama
✓ Dead interval sama
✓ Authentication (tipe dan kunci) sama
✓ Stub area flag sama
✓ MTU sama            ← sering terlewat! menyebabkan stuck di EXSTART/EXCHANGE
✓ Router ID berbeda   ← RID duplikat mencegah adjacency
✓ Interface tidak passive
✓ Network type kompatibel
```

> [!WARNING]
> **MTU mismatch adalah penyebab klasik adjacency macet di EXSTART/EXCHANGE.** Gejalanya: neighbor terlihat tetapi tidak pernah mencapai FULL. Cek dengan `show ip ospf interface` dan bandingkan MTU di kedua sisi.

Solusi darurat (bukan perbaikan sesungguhnya):
```
R1(config-if)# ip ospf mtu-ignore
```
> [!WARNING]
> Ini menyembunyikan gejala. Perbaikan yang benar adalah menyamakan MTU.

---

## 4. Network Types

| Tipe | Default pada | DR/BDR? | Hello/Dead | Neighbor |
|---|---|---|---|---|
| **Broadcast** | Ethernet | Ya | 10/40 | Otomatis (multicast) |
| **Point-to-Point** | Serial (PPP/HDLC), subinterface P2P | Tidak | 10/40 | Otomatis |
| **Non-Broadcast (NBMA)** | Frame Relay | Ya | 30/120 | Manual |
| **Point-to-Multipoint** | Tidak ada (harus diset) | Tidak | 30/120 | Otomatis |
| **Loopback** | Interface loopback | - | - | Diiklankan sebagai /32 |

```
R1(config-if)# ip ospf network point-to-point
R1(config-if)# ip ospf network broadcast
R1(config-if)# ip ospf hello-interval 5
R1(config-if)# ip ospf dead-interval 20
```

> [!TIP]
> **Trik yang sering dipakai:** mengubah link Ethernet point-to-point (antara dua router saja) menjadi `network point-to-point` menghilangkan proses pemilihan DR/BDR dan mempercepat konvergensi. Sangat umum di data center.

> [!WARNING]
> **Network type harus cocok di kedua sisi.** Broadcast vs point-to-point tidak akan membentuk adjacency (karena hello interval berbeda dan ekspektasi DR berbeda).

---

## 5. DR dan BDR

### Masalah yang dipecahkan

Pada segmen broadcast dengan N router, full mesh adjacency membutuhkan `N(N−1)/2` hubungan:
```
5 router  → 10 adjacency
10 router → 45 adjacency
→ flooding LSA menjadi sangat boros
```

**Solusi:** pilih satu **DR** (Designated Router) sebagai pusat. Semua router membentuk FULL adjacency hanya dengan DR dan **BDR** (backup). Jumlah adjacency turun menjadi `2N`.

```
        [DR]
      ╱  │  ╲
  [R1] [R2] [R3]     ← masing-masing FULL dengan DR & BDR,
                        2-WAY dengan sesamanya
```

### Pemilihan DR/BDR

```
1. Priority TERTINGGI menang (default 1; 0 = tidak pernah menjadi DR/BDR)
2. Kalau seri → Router ID TERTINGGI menang
```

> [!WARNING]
> **DR bersifat NON-PREEMPTIVE.** Kalau router dengan priority lebih tinggi muncul setelah DR terpilih, ia tidak mengambil alih. DR baru hanya dipilih jika DR lama mati. Perilaku ini disengaja untuk mencegah gangguan berulang.

```
R1(config-if)# ip ospf priority 255      ← paksa menjadi DR
R2(config-if)# ip ospf priority 100      ← kandidat BDR
R3(config-if)# ip ospf priority 0        ← TIDAK PERNAH jadi DR/BDR
```

> [!TIP]
> **Praktik terbaik:** set priority secara sengaja. DR sebaiknya router yang paling stabil dan kuat (biasanya switch distribution/core), bukan hasil kebetulan RID tertinggi.

### Multicast address

```
224.0.0.5 (AllSPFRouters) → semua router OSPF mendengarkan
224.0.0.6 (AllDRouters)   → hanya DR dan BDR mendengarkan
                            (router lain mengirim update ke sini)
```

---

## 6. Cost dan Metrik

```
Cost = reference_bandwidth / interface_bandwidth
Default reference bandwidth = 100 Mbps (100.000.000 bps)
```

| Bandwidth | Cost (ref default) | Cost (ref 100 Gbps) |
|---|---|---|
| 64 kbps | 1562 | 1.562.500 |
| 1,544 Mbps (T1) | 64 | 64.766 |
| 10 Mbps | 10 | 10.000 |
| 100 Mbps | 1 | 1.000 |
| 1 Gbps | 1 (tak terbedakan) | 100 |
| 10 Gbps | 1 (tak terbedakan) | 10 |
| 100 Gbps | 1 (tak terbedakan) | 1 |

> [!WARNING]
> **Dengan setelan default, semua link ≥100 Mbps punya cost 1**, sehingga OSPF tidak bisa membedakannya.

```
R1(config-router)# auto-cost reference-bandwidth 100000    ← 100 Gbps
```

> [!WARNING]
> **Nilai ini harus SAMA di semua router** dalam domain OSPF, atau perhitungan jalur menjadi tidak konsisten. IOS akan menampilkan peringatan.

**Cost manual per interface:**
```
R1(config-if)# ip ospf cost 50           ← menimpa perhitungan otomatis
```

**Cost jalur = jumlah cost interface KELUAR di sepanjang jalur, dilihat dari arah trafik menuju tujuan:**
```
R1 --cost 10--> R2 --cost 5--> R3 --cost 20--> Tujuan
Total cost dari R1 = 10 + 5 + 20 = 35
```

Setiap angka adalah cost interface keluar milik router di sebelah kirinya: R1 keluar ke R2 (10), R2 keluar ke R3 (5), dan R3 keluar ke jaringan tujuan (20). Ungkapan yang sering beredar, "cost dijumlahkan pada interface masuk", memakai sudut pandang LSA: router menambahkan cost interface tempat informasi rute itu diterima, dan bagi trafik menuju tujuan itu, interface tersebut justru interface keluar. Karena cost dipasang per interface, cost dua arah sebuah link bisa berbeda, sehingga jalur pergi dan jalur pulang bisa tidak sama.

---

## 7. Konfigurasi OSPF

### Metode 1: perintah `network` (klasik, diuji di CCNA)

```
R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# network 10.0.0.0 0.0.0.255 area 0
R1(config-router)# network 192.168.1.0 0.0.0.255 area 0
R1(config-router)# passive-interface default
R1(config-router)# no passive-interface gi0/1
R1(config-router)# auto-cost reference-bandwidth 100000
```

> [!WARNING]
> **Perhatikan: OSPF memakai WILDCARD MASK, bukan subnet mask.**
```
Subnet 10.0.0.0/24  → wildcard 0.0.0.255
Subnet 10.0.0.0/30  → wildcard 0.0.0.3
Satu interface saja → wildcard 0.0.0.0 (host spesifik)
```

> [!TIP]
> **Perintah `network` melakukan dua hal sekaligus:**
1. Mengaktifkan OSPF pada interface yang alamatnya cocok
2. Mengiklankan subnet interface itu ke OSPF

Untuk presisi maksimal, sebut interface secara spesifik:
```
R1(config-router)# network 10.0.0.1 0.0.0.0 area 0    ← hanya interface dengan IP ini
```

### Metode 2: per interface (lebih modern dan jelas)

```
R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# exit

R1(config)# interface gi0/1
R1(config-if)# ip ospf 1 area 0
R1(config-if)# ip ospf cost 10

R1(config)# interface loopback0
R1(config-if)# ip ospf 1 area 0
```

> [!TIP]
> Metode ini lebih disukai di jaringan modern karena eksplisit dan tidak ada kejutan dari wildcard mask.

### Default route

```
R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1
R1(config)# router ospf 1
R1(config-router)# default-information originate
R1(config-router)# default-information originate metric 10 metric-type 1
```

### Autentikasi

```
# Per interface (MD5)
R1(config-if)# ip ospf authentication message-digest
R1(config-if)# ip ospf message-digest-key 1 md5 RahasiaKuat

# Per area (berlaku ke semua interface di area itu)
R1(config-router)# area 0 authentication message-digest

# SHA (modern)
R1(config)# key chain OSPF-KEYS
R1(config-keychain)# key 1
R1(config-keychain-key)# key-string RahasiaKuat
R1(config-keychain-key)# cryptographic-algorithm hmac-sha-256
R1(config-if)# ip ospf authentication key-chain OSPF-KEYS
```

---

## 8. Area: Kunci Skalabilitas

### Kenapa area diperlukan

Tanpa area, seluruh domain OSPF berbagi satu LSDB:
```
❌ LSDB besar → memori besar
❌ Setiap perubahan memicu SPF di SEMUA router
❌ Flooding menyebar ke seluruh jaringan
❌ Tidak bisa melakukan summarization
```

**Area memecah domain**: flooding LSA tipe 1/2 berhenti di batas area, dan SPF hanya dijalankan untuk area sendiri.

### Aturan area

```
1. Harus ada AREA 0 (backbone)
2. Semua area lain HARUS terhubung langsung ke area 0
   (kalau tidak bisa: virtual link — solusi darurat)
3. Trafik antar-area SELALU melewati area 0
```

```
      [Area 1] ──┐
                 ├── [AREA 0 / BACKBONE] ── [Area 3]
      [Area 2] ──┘
```

### Peran router

| Peran | Definisi |
|---|---|
| **Internal Router** | Semua interface di satu area |
| **Backbone Router** | Punya minimal satu interface di area 0 |
| **ABR** (Area Border Router) | Menghubungkan dua area atau lebih; wajib punya interface di area 0 |
| **ASBR** (AS Boundary Router) | Menyuntikkan rute dari luar OSPF (redistribusi) |

### Konfigurasi multi-area

```
# ABR
R2(config)# router ospf 1
R2(config-router)# router-id 2.2.2.2
R2(config-router)# network 10.0.0.0 0.0.0.3 area 0
R2(config-router)# network 10.1.1.0 0.0.0.255 area 1
```

### Summarization

> [!WARNING]
> **Summarization hanya bisa dilakukan di ABR atau ASBR**, bukan di router internal.

```
# Di ABR: ringkas rute dari area 1 sebelum masuk area 0
R2(config-router)# area 1 range 192.168.0.0 255.255.252.0

# Di ASBR: ringkas rute eksternal
R3(config-router)# summary-address 172.16.0.0 255.255.0.0
```

> [!TIP]
> Summarization menyembunyikan flapping di dalam area (perubahan di area 1 tidak memicu SPF di area 0), mengecilkan LSDB, dan mempercepat konvergensi.

---

## 9. LSA Types

| Tipe | Nama | Dibuat oleh | Cakupan flooding | Isi |
|---|---|---|---|---|
| **1** | Router LSA | Setiap router | Dalam area saja | Link & cost router itu |
| **2** | Network LSA | DR | Dalam area saja | Router yang terhubung ke segmen multi-access |
| **3** | Summary LSA | ABR | Antar-area | Rute dari area lain |
| **4** | ASBR Summary | ABR | Antar-area | Cara mencapai ASBR |
| **5** | AS External | ASBR | Seluruh domain (kecuali stub) | Rute dari luar OSPF |
| **7** | NSSA External | ASBR di NSSA | Dalam NSSA, dikonversi jadi tipe 5 di ABR | Rute eksternal di NSSA |

```
R1# show ip ospf database
R1# show ip ospf database router
R1# show ip ospf database network
R1# show ip ospf database summary
R1# show ip ospf database external
```

### Membaca kode rute OSPF

```
O    10.1.1.0/24   → intra-area (dalam area yang sama)
O IA 10.2.2.0/24   → Inter-Area (dari area lain, LSA tipe 3)
O E1 172.16.0.0/16 → External type 1 (cost eksternal + cost internal)
O E2 172.16.0.0/16 → External type 2 (HANYA cost eksternal) ← DEFAULT
O N1 / O N2        → NSSA external
```

> [!WARNING]
> **Perbedaan E1 dan E2:**
- **E2 (default)**: metrik tidak berubah saat menyebar. Semua router melihat cost yang sama, sehingga pemilihan ASBR terdekat tidak otomatis.
- **E1**: metrik eksternal ditambah cost internal ke ASBR. Router otomatis memilih ASBR terdekat.

Kalau ada beberapa ASBR yang menyuntikkan rute yang sama, gunakan E1 agar setiap router memilih pintu keluar terdekat:
```
R1(config-router)# redistribute static subnets metric-type 1
```

---

## 10. Tipe Area Khusus

Tujuannya mengurangi ukuran LSDB pada area yang tidak butuh detail penuh.

| Tipe area | LSA 1,2 | LSA 3 | LSA 4,5 | LSA 7 | Default route |
|---|---|---|---|---|---|
| **Standard** | Ya | Ya | Ya | Tidak | Opsional |
| **Stub** | Ya | Ya | Tidak | Tidak | Otomatis dari ABR |
| **Totally Stubby** | Ya | Tidak | Tidak | Tidak | Otomatis |
| **NSSA** | Ya | Ya | Tidak | Ya | Opsional |
| **Totally NSSA** | Ya | Tidak | Tidak | Ya | Otomatis |

```
# Stub (di SEMUA router dalam area itu)
R2(config-router)# area 1 stub

# Totally stubby (ABR saja yang pakai no-summary)
R2(config-router)# area 1 stub no-summary

# NSSA — untuk area yang punya ASBR sendiri
R2(config-router)# area 1 nssa

# Totally NSSA
R2(config-router)# area 1 nssa no-summary
```

> [!WARNING]
> **Semua router dalam satu area harus sepakat tipe area-nya.** Kalau tidak, adjacency tidak akan terbentuk (stub flag adalah bagian dari hello).

> [!TIP]
> **Kapan memakai apa:**
- **Stub/Totally Stubby**: area cabang tanpa koneksi eksternal sendiri → LSDB jauh lebih kecil
- **NSSA**: area cabang yang punya link ke ISP atau jaringan mitra (perlu menyuntikkan rute eksternal), tetapi tidak perlu menerima rute eksternal dari area lain

---

## 11. Virtual Link: Solusi Darurat

Ketika sebuah area tidak bisa terhubung langsung ke area 0 (mis. setelah merger perusahaan):

```
R2(config-router)# area 1 virtual-link 3.3.3.3
R3(config-router)# area 1 virtual-link 2.2.2.2
     ↑ RID router seberang, melintasi area 1 sebagai transit area
```

> [!WARNING]
> **Virtual link adalah tambalan, bukan desain.** Ia menambah kompleksitas, sulit di-troubleshoot, dan menyembunyikan masalah desain. Perbaiki topologinya kalau memungkinkan (mis. tambahkan link fisik atau tunnel GRE ke area 0).

---

## 12. Tuning dan Optimasi

```
# Fast hello (sub-second detection)
R1(config-if)# ip ospf dead-interval minimal hello-multiplier 4
   → hello 4× per detik, dead 1 detik

# BFD (lebih baik daripada fast hello)
R1(config-if)# bfd interval 50 min_rx 50 multiplier 3
R1(config-router)# bfd all-interfaces

# SPF throttling — mencegah SPF berjalan terlalu sering saat jaringan tidak stabil
R1(config-router)# timers throttle spf 10 100 5000
                                    │   │    └── maksimum antar-SPF (ms)
                                    │   └── inkremen (ms)
                                    └── delay awal (ms)

# LSA throttling
R1(config-router)# timers throttle lsa all 10 100 5000
R1(config-router)# timers lsa arrival 80

# Maximum paths (ECMP)
R1(config-router)# maximum-paths 8

# Batasi jumlah LSA (perlindungan terhadap flooding berlebihan)
R1(config-router)# max-lsa 12000
```

---

## 13. OSPFv3 (IPv6)

```
R1(config)# ipv6 unicast-routing
R1(config)# ipv6 router ospf 1
R1(config-rtr)# router-id 1.1.1.1        ← WAJIB (tidak ada IPv4 untuk diambil)

R1(config)# interface gi0/1
R1(config-if)# ipv6 ospf 1 area 0

R1# show ipv6 ospf neighbor
R1# show ipv6 route ospf
```

**Perbedaan OSPFv3 dari OSPFv2:**
| Aspek | OSPFv2 | OSPFv3 |
|---|---|---|
| Diaktifkan | Perintah `network` atau per interface | Selalu per interface |
| Router ID | Bisa otomatis dari IP | Wajib dikonfigurasi manual |
| Autentikasi | Bawaan (MD5/SHA) | Memakai IPsec (atau auth trailer di RFC 7166) |
| Alamat multicast | 224.0.0.5/6 | FF02::5 / FF02::6 |
| Adjacency | Berdasarkan alamat IPv4 | Berdasarkan link-local |
| Address family | IPv4 saja | IPv4 dan IPv6 (dengan AF) |

> [!WARNING]
> **OSPFv3 membentuk adjacency memakai alamat link-local**, sehingga interface tidak perlu punya alamat global IPv6 untuk membentuk tetangga.

---

## 14. Troubleshooting OSPF

### Alur diagnosis adjacency

```
1. Neighbor tidak muncul sama sekali?
   R1# show ip ospf interface gi0/1
   → OSPF aktif di interface ini?
   → Interface passive? (show ip protocols)
   → Interface up/up?
   → Area ID cocok?
   → Subnet dan mask cocok?
   → Autentikasi cocok?
   → ACL memblokir protokol 89?

2. Stuck di INIT?
   → Hello sampai satu arah saja
   → Cek ACL, firewall, atau masalah multicast satu arah

3. Stuck di EXSTART / EXCHANGE?
   → MTU MISMATCH (penyebab paling umum!)
   R1# show ip ospf interface gi0/1 | include MTU
   → RID duplikat
   → Masalah unicast setelah negosiasi master/slave

4. Stuck di 2-WAY?
   → NORMAL antar-DROTHER pada jaringan broadcast
   → Kalau seharusnya FULL: cek apakah keduanya priority 0
     (tidak ada DR terpilih → tidak ada yang membentuk FULL)

5. FULL tapi rute tidak muncul?
   → Cek LSDB: show ip ospf database
   → Cek apakah ada rute lain dengan AD lebih rendah
   → Cek filtering / distribute-list
   → Cek area type (stub tidak menerima LSA 5)
```

### Perintah penting

```
R1# show ip ospf neighbor
R1# show ip ospf neighbor detail
R1# show ip ospf interface
R1# show ip ospf interface brief
R1# show ip ospf
R1# show ip ospf database
R1# show ip ospf database router 1.1.1.1
R1# show ip protocols
R1# show ip route ospf
R1# show ip ospf border-routers
R1# show ip ospf statistics
R1# clear ip ospf process           ← memutus semua adjacency; hati-hati!
R1# debug ip ospf adj               ← proses adjacency
R1# debug ip ospf hello
R1# debug ip ospf events
```

### Membaca `show ip ospf interface`

```
R1# show ip ospf interface gi0/1
GigabitEthernet0/1 is up, line protocol is up
  Internet Address 10.0.0.1/30, Area 0, Attached via Network Statement
  Process ID 1, Router ID 1.1.1.1, Network Type BROADCAST, Cost: 1
  Topology-MTID    Cost    Disabled    Shutdown      Topology Name
        0           1         no          no            Base
  Transmit Delay is 1 sec, State DR, Priority 1
  Designated Router (ID) 1.1.1.1, Interface address 10.0.0.1
  Backup Designated router (ID) 2.2.2.2, Interface address 10.0.0.2
  Timer intervals configured, Hello 10, Dead 40, Wait 40, Retransmit 5
  Neighbor Count is 1, Adjacent neighbor count is 1
  Message digest authentication enabled
```

Semua parameter yang harus cocok terlihat di sini: Area, Network Type, Hello, Dead, dan autentikasi.

---

## MikroTik RouterOS

> [!WARNING]
> **Sintaks OSPF berbeda drastis antara RouterOS v6 dan v7.** Selalu periksa versi: `/system resource print`.

### RouterOS v7 (menu `/routing/ospf`)

```
# 1. Definisikan instance
/routing ospf instance add name=ospf-utama version=2 router-id=1.1.1.1 \
    redistribute=connected,static

# 2. Definisikan area
/routing ospf area add name=backbone area-id=0.0.0.0 instance=ospf-utama
/routing ospf area add name=area1 area-id=0.0.0.1 instance=ospf-utama type=stub

# 3. Aktifkan pada interface (dua cara)
/routing ospf interface-template add networks=192.168.1.0/24 area=backbone
/routing ospf interface-template add interfaces=ether2 area=backbone \
    type=ptp cost=10 priority=100 auth=md5 auth-key=RahasiaKuat auth-id=1

# Passive interface
/routing ospf interface-template add networks=192.168.50.0/24 area=backbone passive=yes

# Verifikasi
/routing ospf neighbor print
/routing ospf interface print
/routing ospf lsa print
/routing ospf area print
/ip route print where ospf
```

### RouterOS v6 (menu `/routing/ospf` versi lama)

```
/routing ospf instance set default router-id=1.1.1.1 redistribute-connected=as-type-1
/routing ospf area add name=backbone area-id=0.0.0.0
/routing ospf network add network=192.168.1.0/24 area=backbone
/routing ospf interface add interface=ether2 network-type=point-to-point cost=10

/routing ospf neighbor print
/routing ospf interface print
```

### Catatan penting

| Konsep | MikroTik |
|---|---|
| `network-type=broadcast` | default pada Ethernet; ada DR/BDR |
| `network-type=ptp` | sangat disarankan untuk link antar-router; tanpa DR, konvergensi lebih cepat |
| `priority=0` | tidak pernah menjadi DR/BDR |
| `cost` | dihitung otomatis dari bandwidth, atau set manual |
| Reference bandwidth | Hati-hati: RouterOS memakai perhitungan berbeda; set cost manual untuk konsistensi dengan Cisco |

> [!WARNING]
> **Interoperabilitas MikroTik ↔ Cisco:** OSPF adalah standar terbuka dan bekerja dengan baik antar-vendor, tetapi perhatikan:
- **MTU harus cocok**: MikroTik dan Cisco menghitung MTU sedikit berbeda; kalau adjacency macet di ExStart, samakan MTU atau set `/routing ospf interface-template set ... ` dengan MTU yang sesuai
- **Cost tidak dihitung dengan formula yang sama**: set manual di kedua sisi untuk hasil yang dapat diprediksi
- **Autentikasi**: pastikan tipe dan key identik

### Padanan istilah

| Cisco | MikroTik v7 |
|---|---|
| `router ospf 1` | `/routing ospf instance add` |
| `router-id X` | `router-id=X` pada instance |
| `network X Y area Z` | `/routing ospf interface-template add networks=X area=Z` |
| `ip ospf cost N` | `cost=N` pada interface-template |
| `ip ospf network point-to-point` | `type=ptp` |
| `ip ospf priority 0` | `priority=0` |
| `passive-interface` | `passive=yes` |
| `area 1 stub` | `/routing ospf area add type=stub` |
| `default-information originate` | `redistribute=...` + rute default statis |
| `show ip ospf neighbor` | `/routing ospf neighbor print` |
| `show ip ospf database` | `/routing ospf lsa print` |

---

## 15. Ringkasan

- OSPF: link state, Dijkstra SPF, AD 110, protokol IP 89, multicast 224.0.0.5/6.
- **Router ID**: eksplisit > loopback tertinggi > interface fisik tertinggi. Selalu set eksplisit dan pakai loopback.
- State adjacency: DOWN → INIT → 2-WAY → EXSTART → EXCHANGE → LOADING → FULL. Pada broadcast, DROTHER berhenti di 2-WAY, dan itu normal.
- Yang harus cocok: area, subnet/mask, hello, dead, autentikasi, stub flag, MTU.
- **MTU mismatch → stuck di EXSTART/EXCHANGE.** Penyebab klasik.
- **Network type**: broadcast (DR/BDR, 10/40) vs point-to-point (tanpa DR, 10/40). Ubah link Ethernet P2P menjadi `point-to-point` untuk konvergensi lebih cepat.
- **DR/BDR non-preemptive**; priority 0 = tidak pernah jadi DR/BDR.
- **Reference bandwidth default 100 Mbps tidak memadai.** Naikkan dan samakan nilainya di semua router.
- **Area 0 wajib**; semua area harus terhubung ke area 0. Summarization hanya di ABR/ASBR.
- **LSA**: 1 (router), 2 (network/DR), 3 (summary/ABR), 4 (ASBR summary), 5 (external/ASBR), 7 (NSSA).
- **E1 menambahkan cost internal** (pilih ASBR terdekat); E2 (default) tidak.
- Area stub/totally stubby/NSSA mengecilkan LSDB; semua router dalam area harus sepakat tipenya.
- **OSPFv3**: per interface, RID wajib manual, adjacency lewat link-local, FF02::5/6.

---

## 16. Latihan

1. Router memiliki loopback 10.10.10.10 dan interface fisik 192.168.1.1. Tidak ada `router-id` eksplisit. Berapa RID-nya?
2. Dua router terhubung Ethernet, hello diterima kedua arah, tetapi adjacency macet di EXSTART. Apa penyebab paling mungkin dan bagaimana memverifikasinya?
3. `show ip ospf neighbor` menunjukkan `2WAY/DROTHER`. Apakah ini masalah?
4. Semua link di jaringan Anda 10 Gbps dan 1 Gbps, tetapi OSPF memperlakukannya setara. Jelaskan dan perbaiki.
5. Apa perbedaan `O IA`, `O E1`, dan `O E2` dalam routing table?
6. Sebuah area cabang tidak perlu tahu detail rute internet, tetapi punya link sendiri ke jaringan mitra yang harus di-redistribute. Tipe area apa yang tepat?
7. Kenapa summarization hanya bisa dilakukan di ABR/ASBR, bukan di router internal?
8. Anda mengubah `router-id` tetapi `show ip ospf` masih menampilkan RID lama. Kenapa?

<details>
<summary>Jawaban</summary>

1. **10.10.10.10.** Urutan pemilihan RID: (1) perintah `router-id` eksplisit (tidak ada di sini); (2) alamat tertinggi dari interface loopback aktif, yaitu 10.10.10.10; (3) alamat tertinggi dari interface fisik. Karena ada loopback aktif, ia menang tanpa memandang nilai numeriknya dibanding interface fisik.

2. **MTU mismatch.** Selama fase Database Description (EXSTART/EXCHANGE), kedua router menukar nilai MTU interface; jika berbeda, salah satu menolak melanjutkan dan adjacency macet.
   **Verifikasi:** `show ip ospf interface gi0/1` di kedua router dan bandingkan nilai MTU, atau `show interfaces gi0/1 | include MTU`. `debug ip ospf adj` akan menampilkan pesan seperti "Nbr ... has larger interface MTU".
   **Perbaikan:** samakan MTU di kedua sisi. Penyebab umum: satu sisi memakai jumbo frame, atau ada subinterface/tunnel dengan MTU berbeda. `ip ospf mtu-ignore` hanya menyembunyikan gejala dan bisa menyebabkan masalah lain.

3. **Tidak, ini normal** pada jaringan broadcast dengan lebih dari dua router. Router non-DR/non-BDR (DROTHER) hanya membentuk FULL adjacency dengan DR dan BDR; dengan sesama DROTHER mereka berhenti di 2-WAY karena tidak perlu bertukar LSDB langsung (semua flooding melewati DR). Ini justru desain yang menghemat adjacency.
   Masalah hanya terjadi kalau semua router di segmen itu berstatus DROTHER, artinya tidak ada DR yang terpilih (mis. semua priority 0), sehingga tidak ada yang mencapai FULL dan rute tidak dipertukarkan.

4. **Reference bandwidth default OSPF adalah 100 Mbps**, dan cost = ref/bandwidth dengan minimum 1. Baik 1 Gbps maupun 10 Gbps menghasilkan cost 1, sehingga OSPF tidak bisa membedakannya dan memilih jalur berdasarkan tie-breaker yang tidak relevan.
   **Perbaikan:** `auto-cost reference-bandwidth 100000` (100 Gbps) → 1 Gbps menjadi cost 100, 10 Gbps menjadi cost 10. Nilai ini wajib sama di semua router dalam domain OSPF; ketidakkonsistenan menyebabkan perhitungan jalur berbeda antar-router dan bisa menghasilkan routing suboptimal atau loop sementara.

5. **`O IA`** = *Inter-Area*: rute berasal dari area OSPF lain, dipelajari lewat LSA tipe 3 dari ABR. **`O E1`** = *External Type 1*: rute dari luar domain OSPF (redistribusi), dan metriknya = cost eksternal + cost internal untuk mencapai ASBR, sehingga setiap router otomatis memilih ASBR terdekat. **`O E2`** = *External Type 2* (default): rute eksternal yang metriknya tetap (hanya cost eksternal) di seluruh domain; berguna untuk konsistensi, tetapi tidak membedakan jarak ke ASBR sehingga bisa menghasilkan pilihan suboptimal ketika ada beberapa ASBR.

6. **NSSA** (*Not-So-Stubby Area*), atau **Totally NSSA** jika juga ingin memblokir LSA tipe 3.
   Alasannya: area itu tidak perlu menerima rute eksternal dari area lain (LSA tipe 5 diblokir → LSDB kecil), tetapi perlu menyuntikkan rute eksternalnya sendiri dari link ke mitra. Area *stub* biasa tidak mengizinkan ASBR sama sekali. NSSA menyelesaikan ini dengan LSA tipe 7 yang hanya beredar dalam NSSA, lalu dikonversi menjadi tipe 5 oleh ABR saat masuk ke area 0.
   ```
   R2(config-router)# area 1 nssa
   ```

7. Karena summarization mengubah informasi topologi, dan link state mensyaratkan semua router dalam satu area memiliki LSDB yang identik. Router internal hanya membanjiri (flood) LSA tipe 1/2 apa adanya. Kalau ia meringkasnya, LSDB router lain di area yang sama menjadi berbeda, dan perhitungan SPF akan menghasilkan jalur yang tidak konsisten atau loop.
   ABR dan ASBR berada di batas informasi: ABR menerjemahkan topologi area menjadi LSA tipe 3 (yang sudah berupa "rute", bukan "topologi"), dan ASBR memperkenalkan rute eksternal sebagai tipe 5. Pada titik konversi inilah peringkasan aman dilakukan, karena tidak ada router lain yang bergantung pada detail topologi aslinya.

8. Karena Router ID hanya dievaluasi saat proses OSPF dimulai. Mengubah `router-id` pada proses yang sudah berjalan tidak berlaku sampai proses di-restart:
   ```
   R1# clear ip ospf process
   ```
   **Perhatian:** Perintah ini memutus semua adjacency OSPF sementara dan memicu rekalkulasi di seluruh area, jadi lakukan di jendela pemeliharaan. Alternatif untuk router yang belum produksi: `reload`.

</details>

---

## 17. Sumber

- RFC 2328, OSPF Version 2
- RFC 5340, OSPF for IPv6 (OSPFv3)
- RFC 3101, NSSA Option
- RFC 5709 / 7474, OSPFv2 HMAC-SHA Cryptographic Authentication
- Cisco CCNA 200-301 v1.1, topik 3.4 (single area OSPFv2: neighbor adjacencies, point-to-point, broadcast/DR-BDR, router ID)
- Cisco, *OSPF Design Guide* (Document ID 7039)

---

**Berikutnya:** `07-routing-lanjutan/05-eigrp.md`. Protokol Cisco dengan konvergensi tercepat.

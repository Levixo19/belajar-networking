# 07.6 BGP

> **Prasyarat:** `07-routing-lanjutan/02`, `00-fondasi/04` (AS, transit, peering)
> **Tujuan:** Anda paham cara kerja BGP, bisa membaca dan memengaruhi best path selection, mengonfigurasi multihoming, dan memahami keamanan routing internet (RPKI).

> > [!NOTE]
> > **BGP menjalankan internet.** Ia satu-satunya protokol yang menghubungkan ~80.000 jaringan otonom menjadi satu internet.

---

## 1. Karakteristik BGP

| Aspek | Nilai |
|---|---|
| Jenis | Path vector |
| Transport | TCP port 179 ← satu-satunya protokol routing yang memakai TCP |
| AD | 20 (eBGP), 200 (iBGP) |
| Standar | RFC 4271 (BGP-4) |
| Metrik | Tidak ada metrik tunggal: path attributes + algoritma seleksi |
| Update | Inkremental (hanya perubahan), keep-alive setiap 60 detik |
| Skala | >1 juta rute di tabel internet global |

### Kenapa TCP?

BGP memakai TCP agar tidak perlu mengimplementasikan sendiri: keandalan, pengurutan, flow control, dan fragmentasi. Dengan jutaan rute yang harus dipertukarkan, ini keputusan desain yang tepat.

> [!WARNING]
> **Konsekuensinya:** BGP membutuhkan konektivitas IP terlebih dahulu sebelum bisa membentuk sesi. Anda tidak bisa memakai BGP untuk membangun konektivitas dasar: harus ada rute (connected, static, atau IGP) ke alamat peer.

---

## 2. eBGP vs iBGP

| | **eBGP** (external) | **iBGP** (internal) |
|---|---|---|
| Antara | AS berbeda | AS sama |
| AD | 20 | 200 |
| TTL default | 1 (harus bertetangga langsung) | 255 |
| AS_PATH | Ditambahkan nomor AS sendiri | Tidak diubah |
| NEXT_HOP | Diubah menjadi diri sendiri | Tidak diubah (default) |
| Meneruskan rute | Ke semua peer | Tidak ke sesama iBGP peer |

### Aturan iBGP yang krusial

> **Router tidak boleh meneruskan rute yang dipelajari dari iBGP peer ke iBGP peer lain.**

Alasannya: iBGP tidak menambahkan AS_PATH, sehingga tidak ada mekanisme deteksi loop. Aturan ini mencegah loop, tetapi menimbulkan konsekuensi:

> [!WARNING]
> **Semua router iBGP harus terhubung FULL MESH.**
```
n router → n(n−1)/2 sesi

10 router → 45 sesi
50 router → 1.225 sesi   ← tidak dapat dikelola
```

**Solusinya:** Route Reflector atau Confederation (lihat §7).

---

## 3. Neighbor State Machine

```
IDLE         → belum ada apa-apa; menunggu event start
CONNECT      → mencoba membuka koneksi TCP
ACTIVE       → koneksi TCP gagal, mencoba lagi
OPENSENT     → TCP terbentuk, OPEN message dikirim
OPENCONFIRM  → OPEN diterima, menunggu KEEPALIVE
ESTABLISHED  → sesi aktif, siap bertukar UPDATE ✅
```

> [!WARNING]
> **`ACTIVE` bukan berarti "aktif dan sehat"**, justru sebaliknya. `ACTIVE` berarti BGP gagal membuka koneksi TCP dan sedang mencoba lagi. Namanya memang menyesatkan.

**Diagnosis dari state:**
```
IDLE      → peer tidak dikonfigurasi/administratively down, atau tidak ada rute ke peer
ACTIVE    → TCP 179 gagal: peer tidak menjawab, ACL memblokir, alamat salah,
            atau peer belum dikonfigurasi
OPENSENT  → OPEN dikirim tetapi tidak dibalas: AS number salah, versi tidak cocok
IDLE (berulang) → password salah, capability mismatch, hold timer habis
```

### Jenis pesan BGP

| Pesan | Fungsi |
|---|---|
| **OPEN** | Membuka sesi: versi, AS number, hold time, RID, capabilities |
| **UPDATE** | Mengiklankan atau menarik rute |
| **KEEPALIVE** | Menjaga sesi hidup (default setiap 60 detik) |
| **NOTIFICATION** | Melaporkan error dan menutup sesi |
| **ROUTE-REFRESH** | Minta peer mengirim ulang seluruh rute (tanpa memutus sesi) |

**Timer:** Keepalive 60 detik, Hold 180 detik (3× keepalive). Kalau tidak ada pesan dalam hold time, sesi ditutup.

---

## 4. Path Attributes

BGP tidak punya metrik tunggal. Ia membawa atribut yang dipakai untuk kebijakan.

| Atribut | Kategori | Fungsi | Arah pengaruh |
|---|---|---|---|
| **AS_PATH** | Well-known mandatory | Daftar AS yang dilalui | Deteksi loop + panjang jalur |
| **NEXT_HOP** | Well-known mandatory | IP router berikutnya | - |
| **ORIGIN** | Well-known mandatory | Asal rute: IGP(i) / EGP(e) / Incomplete(?) | Tie-breaker |
| **LOCAL_PREF** | Well-known discretionary | Preferensi keluar | Dalam AS sendiri |
| **ATOMIC_AGGREGATE** | Well-known discretionary | Menandai agregasi | - |
| **MED** | Optional non-transitive | Saran preferensi masuk | Ke AS tetangga |
| **COMMUNITY** | Optional transitive | Tag untuk kebijakan | Fleksibel |
| **AGGREGATOR** | Optional transitive | Siapa yang mengagregasi | - |
| **WEIGHT** | Cisco proprietary | Preferensi lokal router | Router itu saja |

### Empat atribut yang paling sering dipakai

**WEIGHT** (Cisco, lokal router saja, lebih besar menang, default 0)
```
R1(config-router)# neighbor 10.0.0.2 weight 200
```
Tidak diiklankan ke mana pun. Hanya memengaruhi router ini.

**LOCAL_PREF** (dalam AS, lebih besar menang, default 100)
```
R1(config-router)# bgp default local-preference 200
```
Diiklankan ke semua iBGP peer → cara standar mengendalikan trafik KELUAR dari AS Anda.

**AS_PATH prepending** (lebih pendek menang)
```
route-map PREPEND permit 10
 set as-path prepend 65001 65001 65001
```
Membuat jalur tampak lebih panjang → cara standar memengaruhi trafik MASUK.

**MED** (lebih kecil menang, default 0)
```
R1(config-router)# neighbor 203.0.113.1 route-map SET-MED out
```
Saran ke AS tetangga tentang pintu masuk mana yang disukai. Hati-hati: MED hanya dibandingkan antar-jalur dari AS yang sama, dan tetangga boleh mengabaikannya.

### Ringkasan arah pengaruh

```
Mengendalikan trafik KELUAR dari AS Anda  → LOCAL_PREF (dan WEIGHT lokal)
Memengaruhi trafik MASUK ke AS Anda       → AS_PATH prepending, MED, community
```

> [!WARNING]
> **Anda punya kendali penuh atas trafik keluar, tetapi hanya bisa "menyarankan" untuk trafik masuk.** Keputusan akhir ada di AS lain. Ini asimetri fundamental BGP.

---

## 5. Best Path Selection Algorithm

Urutan ini wajib dihafal untuk memahami keputusan BGP.

```
0. Next hop harus REACHABLE (kalau tidak, rute tidak dipertimbangkan sama sekali)

1. WEIGHT tertinggi              (Cisco, lokal router)
2. LOCAL_PREF tertinggi          (dalam AS)
3. Rute yang DIHASILKAN LOKAL    (network / aggregate / redistribute)
4. AS_PATH terpendek
5. ORIGIN terendah               (IGP < EGP < Incomplete)
6. MED terendah                  (hanya antar-jalur dari AS yang sama)
7. eBGP lebih disukai daripada iBGP
8. Metrik IGP ke next hop terendah
9. eBGP: rute TERTUA (paling stabil)
10. Router ID BGP terendah
11. Cluster list terpendek
12. Alamat neighbor terendah
```

**Mnemonic populer:**
> **W**e **L**ove **O**ranges **A**s **O**ranges **M**ean **P**ure **R**efreshment
> (Weight, LOCAL_PREF, Originate, AS_PATH, ORIGIN, MED, Paths eBGP/iBGP, RID/Router ID)

> [!TIP]
> **Dalam praktik, 95% keputusan berhenti di langkah 1-4.** Kalau Anda ingin memengaruhi pilihan BGP, gunakan LOCAL_PREF (keluar) atau AS_PATH prepending (masuk).

```
R1# show ip bgp 192.168.10.0
BGP routing table entry for 192.168.10.0/24, version 5
Paths: (2 available, best #1, table default)
  65002 65003
    203.0.113.2 from 203.0.113.2 (2.2.2.2)
      Origin IGP, localpref 100, valid, external, best     ← BEST
  65004 65005 65003
    198.51.100.2 from 198.51.100.2 (4.4.4.4)
      Origin IGP, localpref 100, valid, external
```

---

## 6. Konfigurasi Dasar

### eBGP

```
R1(config)# router bgp 65001
R1(config-router)# bgp router-id 1.1.1.1
R1(config-router)# bgp log-neighbor-changes
R1(config-router)# no bgp default ipv4-unicast     ← praktik baik: aktifkan eksplisit

R1(config-router)# neighbor 203.0.113.2 remote-as 65002
R1(config-router)# neighbor 203.0.113.2 description ISP-A
R1(config-router)# neighbor 203.0.113.2 password RahasiaKuat
R1(config-router)# neighbor 203.0.113.2 timers 10 30

R1(config-router)# address-family ipv4 unicast
R1(config-router-af)# neighbor 203.0.113.2 activate
R1(config-router-af)# network 192.168.0.0 mask 255.255.252.0
R1(config-router-af)# neighbor 203.0.113.2 prefix-list KELUAR out
R1(config-router-af)# neighbor 203.0.113.2 prefix-list MASUK in
R1(config-router-af)# neighbor 203.0.113.2 maximum-prefix 100000 90 restart 15
```

> [!WARNING]
> **Perintah `network` di BGP BERBEDA dari IGP.** Ia tidak mengaktifkan BGP di interface. Artinya: *"iklankan prefix ini, JIKA prefix ini ada di routing table."* Kalau prefix tidak ada di routing table, ia tidak akan diiklankan.

```
R1(config-router-af)# network 192.168.0.0 mask 255.255.252.0
# Agar selalu ada di routing table:
R1(config)# ip route 192.168.0.0 255.255.252.0 null0
```

### iBGP

```
R1(config)# router bgp 65001
R1(config-router)# neighbor 10.0.0.2 remote-as 65001         ← AS SAMA = iBGP
R1(config-router)# neighbor 10.0.0.2 update-source loopback0  ← PENTING!
R1(config-router)# neighbor 10.0.0.2 next-hop-self            ← PENTING!
```

> [!TIP]
> **`update-source loopback0`**: sesi iBGP dibangun dari loopback ke loopback, sehingga tetap hidup selama ada jalur mana pun antar-router (IGP menyediakan redundansi). Kalau memakai interface fisik, sesi putus saat interface itu down walau ada jalur alternatif.

> [!TIP]
> **`next-hop-self`**: router border mengubah NEXT_HOP menjadi dirinya sendiri sebelum meneruskan rute eBGP ke iBGP peer. Tanpa ini, router internal menerima NEXT_HOP berupa alamat router ISP yang tidak ada di IGP mereka → rute dianggap tidak reachable dan tidak dipasang.

### eBGP multihop

Default TTL eBGP = 1, sehingga peer harus bertetangga langsung. Kalau tidak:
```
R1(config-router)# neighbor 203.0.113.2 ebgp-multihop 2
R1(config-router)# neighbor 203.0.113.2 update-source loopback0
```

---

## 7. Route Reflector dan Confederation

Solusi untuk masalah full mesh iBGP.

### Route Reflector (RR)

Satu router diizinkan meneruskan rute iBGP ke iBGP peer lain.

```
        [RR]
      ╱  │  ╲
   [C1] [C2] [C3]     ← client, hanya perlu peering ke RR
```

```
# Di RR
RR(config-router)# neighbor 10.0.0.1 route-reflector-client
RR(config-router)# neighbor 10.0.0.2 route-reflector-client
RR(config-router)# neighbor 10.0.0.3 route-reflector-client
```

**Aturan refleksi:**
```
Dari CLIENT      → refleksikan ke semua client DAN non-client
Dari NON-CLIENT  → refleksikan hanya ke client
Dari eBGP        → refleksikan ke semua
```

**Pencegahan loop:** atribut `ORIGINATOR_ID` (RID pembuat asli) dan `CLUSTER_LIST` (daftar RR yang dilalui). Router membuang rute yang `ORIGINATOR_ID`-nya adalah dirinya sendiri, atau yang `CLUSTER_LIST`-nya berisi cluster-ID-nya.

> [!TIP]
> **Selalu pasang minimal dua RR** untuk redundansi, karena RR adalah single point of failure untuk distribusi rute.

### Confederation

Memecah satu AS besar menjadi beberapa **sub-AS**. Di dalam sub-AS tetap butuh full mesh, tetapi antar-sub-AS memakai eBGP-like. Lebih kompleks dan jauh lebih jarang dipakai daripada RR.

---

## 8. Filtering dan Route-Map

> [!WARNING]
> **Filtering di BGP wajib.** Tanpa filter, Anda bisa secara tidak sengaja menjadi transit untuk seluruh internet (route leak), atau menerima rute palsu.

### Prefix-list

```
R1(config)# ip prefix-list KELUAR seq 5 permit 192.168.0.0/22
R1(config)# ip prefix-list KELUAR seq 10 deny 0.0.0.0/0 le 32   ← tolak sisanya

R1(config)# ip prefix-list BOGON seq 5 deny 10.0.0.0/8 le 32
R1(config)# ip prefix-list BOGON seq 10 deny 172.16.0.0/12 le 32
R1(config)# ip prefix-list BOGON seq 15 deny 192.168.0.0/16 le 32
R1(config)# ip prefix-list BOGON seq 20 deny 127.0.0.0/8 le 32
R1(config)# ip prefix-list BOGON seq 25 deny 169.254.0.0/16 le 32
R1(config)# ip prefix-list BOGON seq 30 deny 0.0.0.0/0 ge 25    ← tolak lebih spesifik dari /24
R1(config)# ip prefix-list BOGON seq 99 permit 0.0.0.0/0 le 24

R1(config-router-af)# neighbor 203.0.113.2 prefix-list KELUAR out
R1(config-router-af)# neighbor 203.0.113.2 prefix-list BOGON in
```

**Makna `ge` dan `le`:**
```
permit 10.0.0.0/8              → hanya persis /8
permit 10.0.0.0/8 le 24        → /8 sampai /24
permit 10.0.0.0/8 ge 25        → /25 sampai /32
permit 0.0.0.0/0 le 24         → semua prefix dengan panjang ≤ 24
```

### AS-path filter

```
R1(config)# ip as-path access-list 1 permit ^$
   ← ^$ berarti AS_PATH KOSONG = rute berasal dari AS kita sendiri

R1(config-router-af)# neighbor 203.0.113.2 filter-list 1 out
   ← hanya iklankan rute milik sendiri, JANGAN jadi transit
```

> [!TIP]
> **`^$` adalah filter keluar paling penting bagi jaringan multihomed non-transit.** Ia mencegah Anda secara tidak sengaja mengiklankan rute dari ISP A ke ISP B (yang akan membuat seluruh trafik internet mengalir melalui Anda).

### Route-map

```
R1(config)# route-map ISP-A-IN permit 10
R1(config-route-map)# match ip address prefix-list PENTING
R1(config-route-map)# set local-preference 200
R1(config)# route-map ISP-A-IN permit 20
R1(config-route-map)# set local-preference 150

R1(config-router-af)# neighbor 203.0.113.2 route-map ISP-A-IN in
```

> [!WARNING]
> **Route-map punya implicit deny di akhir.** Kalau Anda membuat route-map dengan hanya satu `permit 10` yang cocok sebagian rute, sisanya akan dibuang diam-diam. Selalu akhiri dengan `permit` kosong kalau ingin melewatkan sisanya.

### Menerapkan perubahan filter

```
R1# clear ip bgp 203.0.113.2 soft in       ← soft reset, tidak memutus sesi
R1# clear ip bgp 203.0.113.2 soft out
R1# clear ip bgp *                         ⚠️ HARD RESET — memutus semua sesi!
```

> [!WARNING]
> **Jangan pernah `clear ip bgp *` di produksi.** Selalu gunakan `soft`.

---

## 9. Multihoming

### Skenario umum

```
                Internet
              ╱          ╲
        [ISP-A]          [ISP-B]
            │                │
            └──── [Anda] ────┘
                 AS 65001
```

**Kebutuhan:**
1. Redundansi: kalau satu ISP mati, tetap terhubung
2. Kontrol jalur: trafik penting lewat ISP yang lebih baik
3. Jangan menjadi transit antara ISP A dan B

### Mengendalikan trafik KELUAR (LOCAL_PREF)

```
# Utamakan ISP-A untuk semua trafik keluar
R1(config)# route-map PREFER-ISP-A permit 10
R1(config-route-map)# set local-preference 200
R1(config-router-af)# neighbor 203.0.113.2 route-map PREFER-ISP-A in
   ← ISP-A mendapat LOCAL_PREF 200

R1(config)# route-map ISP-B permit 10
R1(config-route-map)# set local-preference 100
R1(config-router-af)# neighbor 198.51.100.2 route-map ISP-B in
   ← ISP-B mendapat 100 (default)
```

### Mengendalikan trafik MASUK (AS_PATH prepending)

```
# Buat jalur lewat ISP-B tampak lebih panjang → trafik masuk memilih ISP-A
R1(config)# route-map PREPEND-ISP-B permit 10
R1(config-route-map)# set as-path prepend 65001 65001 65001
R1(config-router-af)# neighbor 198.51.100.2 route-map PREPEND-ISP-B out
```

> [!WARNING]
> **Prepending tidak selalu efektif.** AS lain bisa punya LOCAL_PREF yang mengalahkan panjang AS_PATH. Alternatif yang lebih presisi: BGP community yang disediakan ISP (mis. "kurangi LOCAL_PREF Anda untuk rute saya").

### Mencegah menjadi transit

```
# CARA 1: as-path filter (paling sederhana dan efektif)
R1(config)# ip as-path access-list 1 permit ^$
R1(config-router-af)# neighbor 203.0.113.2 filter-list 1 out
R1(config-router-af)# neighbor 198.51.100.2 filter-list 1 out

# CARA 2: prefix-list eksplisit
R1(config)# ip prefix-list MILIK-SENDIRI permit 192.168.0.0/22
R1(config-router-af)# neighbor 203.0.113.2 prefix-list MILIK-SENDIRI out
```

### Perlindungan wajib lainnya

```
# Batasi jumlah prefix yang diterima
R1(config-router-af)# neighbor 203.0.113.2 maximum-prefix 1000000 90 restart 15
   ← peringatan di 90%, restart sesi kalau melebihi

# Batasi TTL (GTSM) — hanya terima paket dari hop yang dekat
R1(config-router)# neighbor 203.0.113.2 ttl-security hops 1

# Autentikasi
R1(config-router)# neighbor 203.0.113.2 password RahasiaKuat
```

> [!WARNING]
> **`maximum-prefix` adalah perlindungan penting.** Tanpa itu, ISP yang salah konfigurasi bisa mengirim jutaan rute dan menghabiskan memori router Anda.

---

## 10. Keamanan Routing Internet

### Ancaman

**BGP Hijacking**: AS mengumumkan prefix yang bukan miliknya.
```
Contoh nyata: Pakistan Telecom mengumumkan prefix YouTube (2008)
              → YouTube tidak dapat diakses secara global selama ~2 jam
```

**Route Leak**: AS meneruskan rute yang seharusnya tidak diteruskan.
```
Contoh: pelanggan meneruskan rute dari ISP A ke ISP B
        → seluruh trafik internet mencoba lewat pelanggan kecil
        → jaringan pelanggan runtuh, dan sebagian internet ikut terganggu
```

### RPKI dan ROV

**RPKI** (*Resource Public Key Infrastructure*) memungkinkan pemilik prefix menandatangani secara kriptografis siapa yang berhak mengumumkannya.

```
ROA (Route Origin Authorization):
  "Prefix 192.168.0.0/22 boleh diumumkan oleh AS 65001, maxLength /24"
```

**ROV** (*Route Origin Validation*) berarti router memeriksa rute terhadap ROA:
```
VALID    → ada ROA dan cocok         → terima, beri preferensi
INVALID  → ada ROA tetapi TIDAK cocok → TOLAK (kemungkinan hijack)
NOTFOUND → tidak ada ROA             → terima (belum semua prefix punya ROA)
```

**Status adopsi:** cakupan ROA dan penerapan ROV terus bertambah, tetapi belum menyeluruh. Contoh bertanggal: pelacak Cloudflare [isbgpsafeyet.com](https://isbgpsafeyet.com/) mencatat bahwa sejak 3 Februari 2026 Sparkle (AS6762), salah satu transit Tier-1 global, menolak prefix RPKI-invalid, tetapi situs yang sama masih menjawab "Is BGP safe yet? No." Persentase rute yang tercakup ROA berubah dari bulan ke bulan, jadi lihat angka terbaru di NIST RPKI Monitor atau statistik ROV APNIC sebelum mengutipnya. Adopsi di jaringan kecil dan stub umumnya masih tertinggal.

```
# Konfigurasi RPKI di IOS-XE
R1(config-router)# bgp rpki server tcp 192.0.2.10 port 3323 refresh 600
R1# show ip bgp rpki table
R1# show ip bgp rpki servers
```

> [!WARNING]
> **Praktik yang disarankan MANRS: pasang RPKI dengan logging dulu, jangan langsung memfilter.** ROA yang salah atau validator yang gagal bisa memutus konektivitas ke jaringan yang sah.

### MANRS

**MANRS** (*Mutually Agreed Norms for Routing Security*) menetapkan empat tindakan minimum bagi operator:

```
1. FILTERING       — cegah propagasi informasi routing yang salah
2. ANTI-SPOOFING   — cegah trafik dengan alamat sumber palsu (BCP 38 / uRPF)
3. COORDINATION    — jaga informasi kontak tetap terbarui (PeeringDB, WHOIS)
4. GLOBAL VALIDATION — publikasikan data routing Anda (IRR dan/atau RPKI)
```

### Praktik lain

```
- Bogon filtering (RFC 1918, dokumentasi, reserved)
- Prefix-list yang ketat pada semua peer
- maximum-prefix
- Autentikasi TCP MD5 / TCP-AO
- GTSM (ttl-security)
- IRR — daftarkan rute Anda; hasilkan filter dengan bgpq4
```

```bash
# Hasilkan prefix-list dari data IRR secara otomatis
$ bgpq4 -F "ip prefix-list PEER-X permit %n/%l\n" AS-CUSTOMER
```

---

## 11. BGP di Data Center

Tren modern: memakai eBGP sebagai IGP di dalam data center spine-leaf.

```
Setiap switch punya AS number sendiri (private ASN)
Leaf ←eBGP→ Spine
Tidak ada IGP sama sekali
```

**Kenapa?**
- Skalabilitas terbukti (menjalankan internet)
- Kebijakan eksplisit dan mudah dipahami
- Konvergensi yang dapat diprediksi
- ECMP alami
- Implementasi sangat matang di semua vendor

**BGP Unnumbered** memakai IPv6 link-local untuk peering, tanpa mengonfigurasi alamat IP pada link sama sekali:
```
# FRRouting
interface swp1
 no ipv6 nd suppress-ra
router bgp 65001
 neighbor swp1 interface remote-as external
```
Ini menghilangkan seluruh pekerjaan perencanaan alamat untuk link P2P. Detail di `16-datacenter-cloud-sdn/01`.

---

## 12. Verifikasi dan Troubleshooting

```
R1# show ip bgp summary
BGP router identifier 1.1.1.1, local AS number 65001
BGP table version is 245, main routing table version 245

Neighbor      V  AS   MsgRcvd MsgSent  TblVer InQ OutQ Up/Down  State/PfxRcd
203.0.113.2   4 65002  145234   12456     245   0    0 3d04h    892341
198.51.100.2  4 65003  143221   12401     245   0    0 3d04h    892100
10.0.0.2      4 65001   45231    4523     245   0    0 5d12h         42

R1# show ip bgp
R1# show ip bgp 192.168.10.0/24
R1# show ip bgp neighbors 203.0.113.2
R1# show ip bgp neighbors 203.0.113.2 advertised-routes
R1# show ip bgp neighbors 203.0.113.2 received-routes    ← butuh soft-reconfiguration
R1# show ip bgp neighbors 203.0.113.2 routes
R1# show ip bgp regexp ^65002_
R1# show ip bgp community 65001:100
R1# show bgp ipv4 unicast summary
R1# clear ip bgp 203.0.113.2 soft in
R1# debug ip bgp updates
```

### Membaca kolom `State/PfxRcd`

```
Angka (mis. 892341) → ESTABLISHED, menerima sekian prefix ✅
Idle                → tidak ada rute ke peer, atau administratively down
Active              → TCP 179 gagal — cek konektivitas, ACL, alamat peer
Idle (PfxCt)        → melebihi maximum-prefix, sesi ditutup
Connect             → sedang mencoba TCP
```

### Alur diagnosis

```
1. Sesi tidak ESTABLISHED?
   → ping alamat peer (dengan source yang benar!)
   → telnet <peer> 179 — apakah TCP terbuka?
   → cek AS number di kedua sisi
   → cek ACL yang memblokir TCP 179
   → cek password (kalau salah, sesi flapping antara IDLE/ACTIVE)
   → untuk iBGP: cek update-source dan rute ke loopback peer

2. ESTABLISHED tetapi tidak menerima rute?
   → show ip bgp neighbors X received-routes (aktifkan soft-reconfiguration inbound)
   → cek prefix-list / route-map / filter-list masuk
   → cek apakah peer memang mengiklankannya

3. Menerima rute tetapi tidak masuk routing table?
   → NEXT_HOP tidak reachable! (masalah iBGP paling umum → next-hop-self)
   → ada rute lain dengan AD lebih rendah
   → show ip bgp <prefix> — cek apakah ditandai "valid"

4. Rute masuk tetapi jalur yang dipilih salah?
   → show ip bgp <prefix> dan telusuri algoritma seleksi langkah demi langkah
```

> [!WARNING]
> **"Rute ada di `show ip bgp` tetapi tidak di `show ip route`"** hampir selalu berarti NEXT_HOP tidak reachable. Pada iBGP, solusinya `next-hop-self` di router border.

---

## MikroTik RouterOS

> [!WARNING]
> **BGP ditulis ulang total di RouterOS v7.** Sintaks v6 dan v7 sangat berbeda.

### RouterOS v7

Sintaks di bawah ini diuji di RouterOS 7.24.5 (stable, Oktober 2026). Beberapa nama parameter berubah selama siklus v7: `address-families=` menjadi `afi=`, `router-id` pindah ke `/routing bgp instance`, dan prefiks yang diiklankan sekarang diambil dari address-list. Pembahasan lengkap ada di `19-mikrotik/08-routing-v7`.

```
# Instance: AS dan router-id dipasang sekali di sini
/routing bgp instance add name=bgp-isp as=65001 router-id=10.255.255.1

# Prefiks milik sendiri: address-list + pull-up route agar prefiks ada di tabel routing
/ip firewall address-list add list=prefiks-kita address=192.168.0.0/22
/ip route add dst-address=192.168.0.0/22 blackhole

# Koneksi eBGP ke upstream (role RFC 9234: kita pelanggan dari ISP-A)
/routing bgp connection add name=ISP-A instance=bgp-isp \
    remote.address=203.0.113.9 remote.as=65002 local.role=ebgp-customer \
    input.filter=MASUK output.filter-chain=KELUAR output.network=prefiks-kita

# iBGP
/routing bgp connection add name=iBGP-R2 instance=bgp-isp \
    remote.address=10.255.255.2 remote.as=65001 local.role=ibgp \
    local.address=10.255.255.1 nexthop-choice=force-self

# Verifikasi
/routing bgp connection print
/routing bgp session print detail
/routing bgp advertisements print
/ip route print where bgp
```

> [!WARNING]
> **RouterOS tidak mengiklankan default route lewat BGP kecuali diminta.** Untuk itu pasang `output.default-originate` (misalnya `if-installed`) di connection.

### Routing filter (setara route-map)

```
# Filter keluar: hanya iklankan prefix milik sendiri
/routing filter rule add chain=KELUAR rule="if (dst == 192.168.0.0/22) { accept } else { reject }"

# Filter masuk: tolak bogon dan prefix terlalu spesifik
/routing filter rule add chain=MASUK rule="
  if (dst in 10.0.0.0/8 || dst in 172.16.0.0/12 || dst in 192.168.0.0/16) { reject }
  if (dst-len > 24) { reject }
  accept
"

# Set local preference (mengendalikan trafik KELUAR)
/routing filter rule add chain=MASUK-ISP-A rule="set bgp-local-pref 200; accept"

# AS-path prepend (memengaruhi trafik MASUK)
/routing filter rule add chain=KELUAR-ISP-B rule="set bgp-path-prepend 3; accept"

/routing filter rule print
```

> [!WARNING]
> **Bahasa routing filter RouterOS v7 memakai sintaks mirip skrip**, bukan match/set terpisah seperti Cisco. Ini lebih ekspresif tetapi butuh pembiasaan.

### RouterOS v6 (untuk referensi jaringan lama)

```
/routing bgp instance set default as=65001 router-id=1.1.1.1
/routing bgp peer add name=ISP-A remote-address=203.0.113.9 remote-as=65002 \
    in-filter=MASUK out-filter=KELUAR
/routing bgp network add network=192.168.0.0/22 synchronize=no

/routing filter add chain=KELUAR prefix=192.168.0.0/22 action=accept
/routing filter add chain=KELUAR action=discard
```

### Padanan istilah

| Cisco | MikroTik v7 |
|---|---|
| `router bgp 65001` | `as=65001` pada template/connection |
| `neighbor X remote-as Y` | `/routing bgp connection add remote.address=X remote.as=Y` |
| `neighbor X update-source loopback0` | `local.address=<ip-loopback>` |
| `neighbor X next-hop-self` | `nexthop-choice=force-self` |
| `network X mask Y` | `output.network=X/prefix` + rute blackhole |
| `neighbor X route-map Z in` | `input.filter-chain=Z` |
| `neighbor X prefix-list Z out` | `output.filter-chain=Z` |
| `set local-preference 200` | `set bgp-local-pref 200` |
| `set as-path prepend 65001` | `set bgp-path-prepend 1` |
| `show ip bgp summary` | `/routing bgp session print` |
| `show ip bgp` | `/ip route print where bgp` |
| `clear ip bgp X soft` | `/routing bgp session refresh [find]` |

> [!TIP]
> **MikroTik sering dipakai sebagai router BGP untuk ISP kecil di Indonesia** karena CCR bisa menangani tabel internet penuh dengan harga jauh di bawah router setara dari vendor lain. Pastikan RAM cukup: full table IPv4 + IPv6 butuh minimal 4 GB.

> [!WARNING]
> **Selalu pasang `maximum-prefix`** dan filter keluar `^$`-equivalent agar tidak menjadi transit tidak sengaja:
```
/routing bgp connection set ISP-A input.limit-process-routes-ipv4=1000000
```

---

## 13. Higiene dan Keamanan BGP 2026

Bagian 10 memberi kerangkanya: ancaman, RPKI/ROV, MANRS. Bagian ini menambahkan standar yang terbit antara 2017 dan 2025, satu mekanisme yang masih draft, alat pemantauan, dan konfigurasi validator RPKI di lima platform. Praktik di bagian ini dipakai langsung di lab route server modul `07-routing-lanjutan/11-interkoneksi-internet`.

### 13.1 RFC 8212: eBGP tanpa kebijakan berarti diam

RFC 8212 (Juli 2017) mengubah perilaku default BGP-4. Dua kalimat intinya, dikutip dari RFC:

> "Routes contained in an Adj-RIB-In associated with an EBGP peer SHALL NOT be considered eligible in the Decision Process if no explicit Import Policy has been applied."
>
> "Routes SHALL NOT be added to an Adj-RIB-Out associated with an EBGP peer if no explicit Export Policy has been applied."

Artinya: sesi eBGP yang belum diberi kebijakan masuk tidak menerima apa-apa, dan yang belum diberi kebijakan keluar tidak mengiklankan apa-apa. Tujuannya mencegah route leak karena lupa memasang filter, kesalahan yang dulu sangat umum ketika default-nya "terima dan kirim semua".

| Platform | Perilaku |
|---|---|
| FRR | `bgp ebgp-requires-policy` aktif secara default pada profil `frr defaults traditional`. Gejalanya di `show bgp summary`: kolom PfxRcd atau PfxSnt berisi `(Policy)` |
| BIRD 2 | Untuk eBGP tidak ada default `import all`/`export all`; kebijakan harus ditulis eksplisit di channel |
| Platform lain | Tidak semua menerapkannya secara default. Periksa dokumentasi versi Anda, dan selalu pasang kebijakan eksplisit di kedua arah apa pun default-nya |

```
isp-b# show bgp summary
Neighbor        V    AS   MsgRcvd MsgSent TblVer InQ OutQ Up/Down  State/PfxRcd PfxSnt   Desc
10.10.0.10      4 64510        14      13      9   0    0 00:02:13            1 (Policy) RS-IXP-LAB
```

> [!WARNING]
> **`(Policy)` bukan error sesi.** Sesi tetap Established. Pemula sering menghabiskan waktu memeriksa kabel dan password, padahal yang kurang hanya `neighbor X route-map ... out`.

### 13.2 BGP Roles dan atribut OTC (RFC 9234)

RFC 9234 (Mei 2022) menjawab route leak, yaitu pelanggaran aturan valley-free yang dibahas di modul interkoneksi. Ada dua bagian.

**Roles di pesan OPEN.** Kedua sisi menyatakan perannya lewat capability BGP Role: `provider`, `customer`, `peer`, `rs` (route server), atau `rs-client`. Pasangan yang sah hanya provider-customer, peer-peer, dan rs-rs-client. Dengan **strict mode**, sesi tidak akan naik kalau sisi lain tidak mengirim role atau role-nya tidak cocok.

**Atribut OTC (Only to Customer)**, atribut opsional transitif tipe 35 berisi satu ASN. Prosedurnya menurut RFC 9234 bagian 5:

```
Saat MENERIMA rute:
  1. Ada OTC dan datang dari Customer atau RS-Client      → route leak, tolak
  2. Ada OTC dari Peer, tetapi nilainya bukan ASN peer itu → route leak, tolak
  3. Datang dari Provider, Peer, atau RS tanpa OTC         → tambahkan OTC = ASN pengirim

Saat MENGIRIM rute:
  1. Ke Customer, Peer, atau RS-Client (oleh RS), belum ada OTC → tambahkan OTC = ASN sendiri
  2. Rute sudah ber-OTC                                         → JANGAN kirim ke Provider, Peer, atau RS
```

Hasilnya dua lapis: pencegahan di AS Anda sendiri (rute dari peer atau provider tidak akan naik lagi), dan deteksi beberapa hop jauhnya: kalau pelanggan di ujung lain dunia membocorkan rute yang membawa OTC, provider-nya yang patuh RFC 9234 akan melihat OTC dari arah pelanggan dan menolaknya.

Konfigurasi (contoh: Anda pelanggan dari upstream 203.0.113.1):

```
! FRR
router bgp 64500
 neighbor 203.0.113.1 local-role customer
 ! tambahkan "strict-mode" bila upstream sudah pasti mendukung role

# BIRD 2
protocol bgp upstream_a {
  local as 64500;
  neighbor 203.0.113.1 as 64496;
  local role customer;
  # require roles;      # strict mode
  ...
}

# MikroTik RouterOS v7 (nilai: ebgp-customer, ebgp-provider, ebgp-peer, ebgp-rs, ebgp-rs-client)
/routing bgp connection set UPSTREAM-A local.role=ebgp-customer
```

Verifikasi di FRR (keluaran dari lab route server):

```
isp-a# show bgp neighbors 10.10.0.10
  Local Role: rs-client
  Remote Role: rs-server
...
isp-a# show bgp ipv4 unicast 203.0.113.0/24
      Origin IGP, metric 0, localpref 200, valid, external, otc 64510, best
```

> [!TIP]
> **Roles tidak menggantikan filter.** Ia hanya tahu hubungan bisnis, bukan prefix mana milik siapa. Pasang roles di samping prefix-list, as-path filter, max-prefix, dan ROV.

### 13.3 ROA yang benar: maxLength (RFC 9319), profil ROA (RFC 9582), satu prefix per ROA (RFC 9455)

**Masalah maxLength.** ROA "198.18.0.0/22, maxLength 24, AS64500" mengizinkan /22, kedua /23, dan keempat /24 di dalamnya. Kalau Anda hanya mengumumkan /22, penyerang bisa mengumumkan 198.18.1.0/24 dengan AS_PATH palsu yang diakhiri AS64500. ROV menilainya valid (prefix dan origin cocok), dan karena lebih spesifik, ia menang di forwarding. Serangan ini disebut **forged-origin sub-prefix hijack**.

RFC 9319 (BCP, Oktober 2022) merekomendasikan **ROA minimal**: operator "SHOULD use 'minimal ROAs' that authorize only those IP prefixes that are actually originated in BGP", dan secara umum "SHOULD avoid using the maxLength attribute". Pengecualiannya sempit: ketika semua prefix lebih spesifik yang diizinkan maxLength memang diumumkan. RFC yang sama juga membahas ROA untuk layanan mitigasi DDoS: kalau penyedia scrubbing akan mengumumkan prefix Anda dari ASN-nya, siapkan ROA untuk ASN itu.

**RFC 9582** (Mei 2024) adalah profil standar objek ROA dan menggantikan RFC 6482. Bagi operator, dampak langsungnya kecil: portal RIR/NIR dan validator yang menangani format. Yang perlu Anda ingat adalah isinya: satu ASN, satu atau lebih prefix, maxLength opsional per prefix.

**RFC 9455** (BCP, Agustus 2023) merekomendasikan satu prefix per ROA. ROA yang memuat banyak prefix menjadi satu titik kegagalan: kalau objeknya tidak valid (misalnya salah satu prefix sudah tidak lagi Anda pegang), semua prefix di dalamnya ikut kehilangan perlindungan.

### 13.4 ASPA: memvalidasi jalur, bukan hanya asal (masih draft)

ROV hanya memeriksa origin. Ia tidak mendeteksi route leak (origin-nya benar) dan tidak mendeteksi pembajak yang memalsukan origin seperti pada 13.3. **ASPA** (*Autonomous System Provider Authorization*) menambahkan objek RPKI baru: setiap AS menandatangani daftar AS penyedianya. Dengan data itu, router bisa memeriksa apakah setiap lompatan "naik" di AS_PATH memang ke penyedia yang diakui, lalu menilai apakah jalur berbentuk valley-free. Ada dua algoritma: untuk rute dari pelanggan atau peer (*upstream*, lebih ketat) dan dari provider (*downstream*).

**Status per Oktober 2026: belum RFC.** Di IETF datatracker, `draft-ietf-sidrops-aspa-verification` berada di revisi 28 dan `draft-ietf-sidrops-aspa-profile` di revisi 29. Penyebaran ASPA ke router juga butuh RTR versi 2 (`draft-ietf-sidrops-8210bis`, revisi 27), yang juga masih draft. Sebagian implementasi sudah bereksperimen; BIRD 2, misalnya, mendokumentasikan tabel `aspa` dan fungsi `aspa_check_upstream()`/`aspa_check_downstream()` dengan catatan bahwa algoritmanya mengikuti draft.

Sikap yang masuk akal sekarang: pahami konsepnya, coba di lab, pantau apakah portal RIR/NIR Anda sudah menyediakan pembuatan objek ASPA, tetapi jangan membangun kebijakan produksi yang bergantung padanya sampai standarnya terbit dan implementasinya matang.

### 13.5 Large Communities (RFC 8092)

Community klasik (RFC 1997) berukuran 32 bit dan ditulis `ASN:nilai` dengan masing-masing 16 bit. ASN 4-byte (di atas 65535) tidak muat. **Large Community** (RFC 8092, Februari 2017) berukuran 96 bit: `ASN:fungsi:parameter`, masing-masing 32 bit, sehingga pemilik ASN 4-byte bisa memakai ASN-nya sendiri sebagai bagian pertama.

Konvensi yang lazim: bagian pertama ASN yang mendefinisikan arti community itu, bagian kedua jenis tindakan atau informasi, bagian ketiga parameternya.

```
64500:100:1        "rute ini dipelajari dari pelanggan" (informasi, AS64500)
64510:0:64501      "route server AS64510, jangan kirim ke AS64501" (kontrol)
```

```
! FRR
route-map KE-RS permit 10
 set large-community 64510:0:64501 additive
bgp large-community-list standard JANGAN-KE-B permit 64510:0:64501

# BIRD 2
bgp_large_community.add((64510, 0, 64501));
if (64510, 0, 64501) ~ bgp_large_community then reject;

# MikroTik RouterOS v7
/routing filter rule add chain=KE-RS rule="append bgp-large-communities 64510:0:64501; accept"
/routing filter rule add chain=DARI-RS rule="if (bgp-large-communities includes 64510:0:64501) { reject }"
```

Dua community standar lain yang sebaiknya Anda kenali: **BLACKHOLE** `65535:666` (RFC 7999) untuk meminta upstream membuang trafik ke prefix yang diserang, dan **GRACEFUL_SHUTDOWN** `65535:0` (RFC 8326) untuk meminta peer menurunkan preferensi jalur sebelum Anda mematikan sesi untuk pemeliharaan, sehingga trafik pindah tanpa paket hilang.

### 13.6 AS_SET resmi dilarang (RFC 9774)

AS_SET adalah segmen AS_PATH berisi himpunan ASN tak berurutan, hasil agregasi rute dengan opsi `as-set`. Ia membuat origin sebuah rute ambigu, sehingga ROV tidak bisa menilainya. RFC 6472 (2011) baru menyarankan untuk tidak memakainya. **RFC 9774** (Mei 2025) menjadikannya kewajiban: BGP speaker yang patuh "MUST NOT advertise BGP UPDATE messages containing AS_SETs or AS_CONFED_SETs" dan harus memperlakukan UPDATE yang menerimanya sebagai withdraw (*treat-as-withdraw*, RFC 7606).

Langkah praktis: jangan pakai kata kunci `as-set` pada `aggregate-address`, periksa apakah ada rute ber-AS_SET di tabel Anda (di Cisco tampak sebagai `{...}` dalam AS_PATH), dan cari opsi platform untuk menolaknya. Di BIRD 2, opsi `allow as sets` masih default `on`, jadi pasang `allow as sets off` untuk mengikuti RFC 9774.

### 13.7 BMP: melihat apa yang dikirim peer, sebelum filter (RFC 7854)

`show ip bgp neighbors X received-routes` hanya menunjukkan keadaan sekarang, di satu router, dan butuh soft-reconfiguration. **BMP** (*BGP Monitoring Protocol*, RFC 7854, Juni 2016) membuat router mengalirkan informasi BGP ke kolektor lewat TCP:

- **Route Monitoring**: Adj-RIB-In **pre-policy** (apa yang dikirim peer sebelum filter Anda) dan **post-policy**; Loc-RIB ditambahkan RFC 9069.
- **Peer Up/Down** beserta alasan sesi turun.
- **Statistics**: jumlah prefix ditolak, duplikat, dan sebagainya.

Dengan BMP, Anda bisa menjawab "kapan tepatnya peer X mulai mengirim prefix aneh ini" atau "berapa rute yang ditolak filter RPKI minggu ini" dari satu basis data, tanpa masuk ke setiap router. Kolektor open-source yang aktif dikembangkan antara lain pmacct (yang juga menangani NetFlow/IPFIX dan RPKI).

```
# FRR: bgpd harus dijalankan dengan modul bmp, mis. di /etc/frr/daemons:
#   bgpd_options="   -A 127.0.0.1 -M bmp -M rpki"
router bgp 64500
 bmp targets KOLEKTOR
  bmp connect 192.0.2.50 port 5000 min-retry 1000 max-retry 10000
  bmp monitor ipv4 unicast pre-policy
  bmp monitor ipv4 unicast post-policy
  bmp stats interval 60000
 exit
```

> [!WARNING]
> Dokumentasi BIRD 2 menyebut implementasi BMP-nya masih pendahuluan dan belum siap produksi (tidak dikompilasi secara default). Untuk router BIRD, andalkan dulu log, `show route filtered`, dan ekspor tabel.

### 13.8 Validator RPKI dan RTR: konfigurasi multi-platform

Arsitektur yang disarankan:

```
                Repositori RPKI publik (APNIC, IDNIC, RIR lain)
                        │ RRDP / rsync
          ┌─────────────┴─────────────┐
   [Validator 1: Routinator]   [Validator 2: rpki-client + StayRTR]
          │ RTR (TCP 3323)            │ RTR (TCP 8282)
          └──────────┬────────────────┘
                     │  jaringan manajemen internal
        [Router border]  [Route server]  [Router border]
```

Port default yang dipakai contoh di bawah: Routinator 3323, StayRTR 8282. Validator berada di jaringan internal; RTR tanpa TLS/SSH tidak punya autentikasi.

**FRR** (bgpd dimuat dengan `-M rpki`):

```
rpki
 rpki polling_period 300
 rpki retry_interval 30
 rpki cache tcp 10.20.0.3 8282 preference 1
 rpki cache tcp 10.20.0.4 3323 preference 2
exit
!
route-map UPSTREAM-IN deny 10
 match rpki invalid
route-map UPSTREAM-IN permit 20
 match rpki valid
 set local-preference 200
route-map UPSTREAM-IN permit 30
!
! Verifikasi
show rpki cache-connection
show rpki prefix-table
show rpki prefix 203.0.113.0/24
show bgp ipv4 unicast rpki invalid
```

**BIRD 2** (satu protokol `rpki` per validator):

```
roa4 table r4;
roa6 table r6;
protocol rpki validator1 {
  roa4 { table r4; };
  roa6 { table r6; };
  remote 10.20.0.3 port 8282;
  retry keep 30;
  refresh keep 300;
  expire keep 7200;
}
filter upstream_in {
  if roa_check(r4, net, bgp_path.last) = ROA_INVALID then reject;
  accept;
}
# Di channel ipv4 sesi BGP: import table on;  agar perubahan ROA
# dievaluasi ulang otomatis (opsi channel "rpki reload", default on).
# Verifikasi:  birdc show protocols all validator1 ;  birdc show route table r4
```

**MikroTik RouterOS v7**:

```
/routing/rpki
add group=rpki-lokal address=10.20.0.3 port=8282 refresh-interval=300
add group=rpki-lokal address=10.20.0.4 port=3323 refresh-interval=300
/routing/filter/rule
add chain=UPSTREAM-IN rule="rpki-verify rpki-lokal"
add chain=UPSTREAM-IN rule="if (rpki invalid) { reject }"
add chain=UPSTREAM-IN rule="accept"
# Verifikasi
/routing/rpki print
/routing/rpki rpki-check group=rpki-lokal prfx=203.0.113.0/24 origin-as=64501
```

RouterOS juga punya status `unverified` untuk keadaan ketika tidak ada sesi RPKI di grup yang sudah tersinkron. Gunakan status itu bila Anda ingin perlakuan khusus saat semua validator gagal.

**Cisco IOS XE**:

```
router bgp 64500
 bgp rpki server tcp 10.20.0.3 port 8282 refresh 300
 bgp rpki server tcp 10.20.0.4 port 3323 refresh 300
!
route-map UPSTREAM-IN permit 10
 match rpki valid
 set local-preference 200
route-map UPSTREAM-IN permit 20
!
show ip bgp rpki servers
show ip bgp rpki table
```

> [!WARNING]
> **Perilaku default IOS XE berbeda dari platform lain.** Menurut dokumentasi Cisco, begitu `bgp rpki server` dipasang, rute invalid tidak dipilih sebagai best path dan tidak diiklankan, tanpa perlu route-map. Kalau Anda ingin tahap "logging dulu", pasang `bgp bestpath prefix-validate allow-invalid` sebelum menambahkan server, lalu hapus setelah yakin.

**Juniper Junos**:

```
set routing-options validation group rpki session 10.20.0.3 port 8282
set routing-options validation group rpki session 10.20.0.4 port 3323
set policy-options policy-statement RPKI term invalid from protocol bgp
set policy-options policy-statement RPKI term invalid from validation-database invalid
set policy-options policy-statement RPKI term invalid then validation-state invalid
set policy-options policy-statement RPKI term invalid then reject
set policy-options policy-statement RPKI term valid from protocol bgp
set policy-options policy-statement RPKI term valid from validation-database valid
set policy-options policy-statement RPKI term valid then validation-state valid
set policy-options policy-statement RPKI term valid then next policy
set protocols bgp group UPSTREAM import [ RPKI UPSTREAM-IN ]
# Verifikasi
show validation session
show validation database
```

**Evaluasi ulang.** Status RPKI sebuah rute bisa berubah tanpa ada UPDATE baru dari peer (ROA baru terbit, ROA dicabut). Router harus mengevaluasi ulang kebijakan masuk. RFC 9324 (Desember 2022) mewajibkan ini dilakukan tanpa meminta route refresh ke peer. Di lab modul interkoneksi, BIRD melakukannya otomatis, sedangkan FRR perlu `clear bgp ... soft in` setelah sesi RTR baru tersambung. Uji perilaku platform Anda sendiri.

### 13.9 Studi kasus

**YouTube dan Pakistan Telecom, 24 Februari 2008** (analisis RIPE NCC RIS). Pukul 18:47 UTC, Pakistan Telecom (AS17557) mulai mengumumkan 208.65.153.0/24, bagian dari 208.65.152.0/22 milik YouTube (AS36561). Rutenya diteruskan oleh penyedianya, PCCW Global (AS3491), ke seluruh dunia, dan karena lebih spesifik, menang di mana-mana. Pukul 20:07 YouTube ikut mengumumkan /24 yang sama, pukul 20:18 mengumumkan dua /25 yang lebih spesifik lagi, dan pukul 21:01 PCCW menarik semua prefix dari AS17557. Total sekitar dua jam. Pelajaran: filter pelanggan di PCCW (hanya terima prefix yang terdaftar milik pelanggan) akan menghentikannya di hop pertama; hari ini, ROA YouTube dengan maxLength ketat akan membuat /24 itu invalid di jaringan yang menerapkan ROV.

**Route leak Verizon, DQE, dan Allegheny, 24 Juni 2019** (laporan Cloudflare). DQE Communications (AS33154) memakai "BGP optimizer" yang memecah prefix menjadi bagian lebih spesifik untuk keperluan internalnya; misalnya 104.20.0.0/20 milik Cloudflare menjadi 104.20.0.0/21 dan 104.20.8.0/21. Rute itu bocor ke pelanggannya, Allegheny Technologies (AS396531), yang meneruskannya ke penyedia lainnya, Verizon (AS701). Verizon menerimanya dan menyebarkannya ke internet. Pada puncaknya Cloudflare kehilangan sekitar 15% trafik globalnya. Pelajaran: ini route leak klasik (pelanggan meneruskan rute dari satu penyedia ke penyedia lain, persis pola lembah), dan Cloudflare menyebut max-prefix, filter IRR, dan RPKI (yang membuat prefix lebih spesifik itu invalid) sebagai pencegah. Dengan RFC 9234, rute dari DQE ke Allegheny akan membawa OTC, dan Verizon yang patuh akan menolaknya ketika datang dari pelanggan.

**Indosat, 2 April 2014.** Kebocoran lebih dari 320.000 rute dari AS4761; dibahas di modul `07-routing-lanjutan/11-interkoneksi-internet` bagian Troubleshooting, termasuk mengapa jaringan yang banyak melakukan prepending paling parah terdampak.

---

## 14. Ringkasan

- BGP: path vector, TCP 179, AD 20 (eBGP) / 200 (iBGP), skala >1 juta rute.
- **iBGP tidak meneruskan rute ke sesama iBGP peer** → butuh full mesh atau Route Reflector.
- State: IDLE → CONNECT → ACTIVE (artinya GAGAL, bukan sehat) → OPENSENT → OPENCONFIRM → ESTABLISHED.
- Atribut utama: AS_PATH (loop + panjang), NEXT_HOP, LOCAL_PREF (keluar), MED (masuk), WEIGHT (lokal), COMMUNITY.
- Best path: Weight → LOCAL_PREF → Originate → AS_PATH → ORIGIN → MED → eBGP>iBGP → IGP metric → oldest → RID.
- Kendalikan trafik keluar dengan LOCAL_PREF; pengaruhi trafik masuk dengan AS_PATH prepending. Trafik masuk hanya bisa "disarankan".
- `network` di BGP berarti "iklankan jika ada di routing table", bukan mengaktifkan interface.
- iBGP wajib: `update-source loopback` dan `next-hop-self` di router border.
- **Filtering wajib**: prefix-list, `^$` as-path filter untuk mencegah menjadi transit, bogon filter, `maximum-prefix`.
- Gunakan `clear ip bgp ... soft`, jangan hard reset.
- Keamanan: RPKI/ROV (valid/invalid/notfound), MANRS (filtering, anti-spoofing, koordinasi, validasi global).
- "Ada di `show ip bgp` tapi tidak di routing table" = NEXT_HOP tidak reachable.
- Higiene 2026: RFC 8212 (eBGP tanpa kebijakan = diam), RFC 9234 Roles + OTC melawan route leak, ROA minimal tanpa maxLength longgar (RFC 9319), satu prefix per ROA, AS_SET dilarang (RFC 9774), Large Communities untuk ASN 4-byte, BMP untuk pemantauan, minimal dua validator RPKI lewat RTR. ASPA masih draft.

---

## 15. Latihan

1. Kenapa BGP memakai TCP, dan apa konsekuensinya?
2. `show ip bgp summary` menunjukkan state `Active`. Apa artinya dan apa yang Anda periksa?
3. Router iBGP menerima rute (`show ip bgp` menampilkannya) tetapi tidak memasangnya ke routing table. Apa penyebab paling mungkin dan perbaikannya?
4. Anda multihomed ke dua ISP. Bagaimana memastikan trafik keluar mengutamakan ISP-A?
5. Bagaimana mencegah AS Anda menjadi transit antara dua ISP? Berikan konfigurasinya.
6. Sebutkan lima langkah pertama algoritma best path selection secara berurutan.
7. Apa perbedaan status RPKI `INVALID` dan `NOTFOUND`, dan bagaimana sebaiknya router memperlakukan masing-masing?
8. Kenapa `clear ip bgp *` berbahaya di produksi, dan apa alternatifnya?
9. Anda menambahkan `bgp rpki server tcp 10.20.0.3 port 8282 refresh 300` ke router Cisco IOS XE border, dengan rencana "logging dulu seminggu". Satu jam kemudian beberapa pelanggan melaporkan satu situs tidak bisa diakses, padahal Anda belum memasang route-map apa pun. Jelaskan apa yang terjadi dan bagaimana menjalankan rencana logging dengan benar.
10. Pelanggan Anda (AS64520, multihomed ke Anda dan ke penyedia lain) salah konfigurasi dan mulai mengirimkan ke Anda ribuan rute yang ia terima dari penyedia lainnya. Sesi Anda ke pelanggan itu memakai `local-role provider` dan pelanggan memakai `local-role customer`. Rute mana yang akan ditolak otomatis oleh mekanisme RFC 9234, rute mana yang lolos, dan perlindungan apa lagi yang Anda pasang?

<details>
<summary>Jawaban</summary>

1. BGP memakai TCP port 179 agar tidak perlu mengimplementasikan sendiri keandalan, pengurutan, acknowledgment, flow control, dan fragmentasi. Semua itu dibutuhkan ketika harus mempertukarkan jutaan rute secara andal.
   **Konsekuensinya:** BGP membutuhkan konektivitas IP terlebih dahulu: harus sudah ada rute (connected, static, atau lewat IGP) ke alamat peer sebelum sesi bisa terbentuk. BGP tidak bisa dipakai untuk membangun konektivitas dasar. Ini juga berarti masalah pada IGP atau ACL yang memblokir TCP 179 akan langsung memutus BGP.

2. **`Active` berarti BGP GAGAL membuka koneksi TCP** ke peer dan sedang mencoba lagi; namanya menyesatkan. Periksa: (a) apakah alamat peer dapat di-`ping` (dengan source interface yang benar)? (b) apakah `telnet <peer> 179` berhasil (kalau tidak, ada yang memblokir); (c) ACL/firewall yang memblokir TCP 179; (d) apakah alamat neighbor yang dikonfigurasi benar dan cocok dengan `update-source` di sisi peer; (e) apakah peer sudah mengonfigurasi Anda sebagai neighbor; (f) untuk iBGP: apakah ada rute ke loopback peer.

3. **NEXT_HOP tidak reachable.** Ketika router border menerima rute dari eBGP, NEXT_HOP-nya adalah alamat router ISP. Router border meneruskan rute itu ke iBGP peer tanpa mengubah NEXT_HOP (perilaku default iBGP). Router internal tidak punya rute ke alamat ISP itu di IGP-nya, sehingga BGP menandai rute sebagai tidak valid dan tidak memasangnya.
   **Perbaikan:** `neighbor <ibgp-peer> next-hop-self` pada router border, sehingga ia mengganti NEXT_HOP dengan alamat dirinya sendiri (yang dikenal IGP). Alternatif: redistribusikan subnet link eBGP ke IGP (kurang disukai).

4. Terapkan **LOCAL_PREF lebih tinggi** pada rute yang diterima dari ISP-A:
   ```
   route-map PREFER-ISP-A permit 10
    set local-preference 200
   router bgp 65001
    address-family ipv4 unicast
     neighbor 203.0.113.2 route-map PREFER-ISP-A in    ! ISP-A
     ! ISP-B dibiarkan default (100)
   ```
   LOCAL_PREF dievaluasi di langkah 2 algoritma seleksi (setelah WEIGHT), dan diiklankan ke semua iBGP peer, sehingga seluruh AS Anda konsisten memilih ISP-A untuk trafik keluar. Terapkan dengan `clear ip bgp 203.0.113.2 soft in`.

5. Cara paling sederhana dan efektif: **as-path filter `^$`** yang hanya mengizinkan rute dengan AS_PATH kosong (= rute yang berasal dari AS Anda sendiri) untuk diiklankan keluar.
   ```
   ip as-path access-list 1 permit ^$
   router bgp 65001
    address-family ipv4 unicast
     neighbor 203.0.113.2 filter-list 1 out
     neighbor 198.51.100.2 filter-list 1 out
   ```
   Alternatif yang lebih eksplisit (dan lebih aman karena tidak bergantung regex): prefix-list yang hanya mengizinkan prefix milik Anda.
   ```
   ip prefix-list MILIK-SENDIRI permit 192.168.0.0/22
   neighbor 203.0.113.2 prefix-list MILIK-SENDIRI out
   ```
   Praktik terbaik: pakai keduanya.

6. (1) **WEIGHT tertinggi** (Cisco, lokal router saja); (2) **LOCAL_PREF tertinggi** (berlaku dalam AS); (3) **rute yang dihasilkan lokal** (network/aggregate/redistribute) lebih disukai; (4) **AS_PATH terpendek**; (5) **ORIGIN terendah** (IGP < EGP < Incomplete).
   Sebelum semua itu, ada prasyarat: NEXT_HOP harus reachable, kalau tidak rute tidak dipertimbangkan sama sekali.

7. **`INVALID`** berarti ada ROA untuk prefix tersebut, tetapi pengumumannya tidak cocok: AS asal salah, atau panjang prefix melebihi `maxLength`. Ini indikasi kuat hijacking atau salah konfigurasi. Router sebaiknya menolak rute ini.
   **`NOTFOUND`** berarti tidak ada ROA yang mencakup prefix tersebut; pemiliknya belum mendaftarkan RPKI. Ini bukan indikasi masalah; masih banyak prefix di internet tanpa ROA. Router harus menerima rute ini secara normal (kalau menolaknya, Anda akan kehilangan konektivitas ke sebagian besar internet).
   **Perhatian:** Sesuai rekomendasi MANRS, terapkan RPKI dengan logging terlebih dahulu sebelum mengaktifkan penolakan INVALID, untuk memastikan validator berfungsi dan tidak ada ROA salah yang memutus trafik sah.

8. **`clear ip bgp *` melakukan HARD RESET**: semua sesi TCP BGP diputus, sehingga seluruh rute yang dipelajari dihapus dari routing table, terjadi outage total selama sesi dibangun ulang, dan pada router dengan tabel internet penuh (>1 juta rute) proses ini bisa memakan beberapa menit dengan CPU mendekati 100%. Selain itu ia memicu churn di seluruh jaringan Anda dan bahkan ke peer.
   **Alternatif:** soft reset, yang menerapkan ulang kebijakan tanpa memutus sesi:
   ```
   R1# clear ip bgp 203.0.113.2 soft in     ! terapkan ulang filter masuk
   R1# clear ip bgp 203.0.113.2 soft out    ! kirim ulang rute keluar
   ```
   Soft reset inbound memerlukan route refresh capability (didukung semua implementasi modern) atau `neighbor X soft-reconfiguration inbound` (yang memakan memori karena menyimpan salinan rute mentah).

9. Di IOS XE, begitu `bgp rpki server` dipasang, router mulai memvalidasi setiap jalur dan, menurut dokumentasi Cisco, rute INVALID tidak dipilih sebagai best path dan tidak diiklankan, tanpa route-map apa pun. Jadi Anda tidak sedang "logging", Anda sudah memfilter. Situs yang tidak bisa diakses kemungkinan punya ROA yang salah (ASN keliru atau maxLength terlalu pendek), sehingga prefix sahnya invalid. Untuk benar-benar mulai dengan logging: pasang `bgp bestpath prefix-validate allow-invalid` (atau `disable`) sebelum menambahkan server, amati `show ip bgp rpki table` dan rute ber-status invalid (misalnya dengan route-map `match rpki invalid` yang hanya menurunkan local-preference), hubungi pemilik prefix yang ROA-nya salah, lalu hapus `allow-invalid` setelah yakin. Pelajaran umumnya: pahami perilaku default platform sebelum menyalin rencana dari platform lain.

10. Rute yang pelanggan terima dari penyedia lainnya: kalau penyedia itu patuh RFC 9234, rute tersebut sudah membawa atribut OTC saat dikirim ke pelanggan (dipasang penyedia saat egress ke customer, atau dipasang pelanggan saat ingress dari provider). Ketika rute ber-OTC itu sampai ke Anda dari sesi ber-role customer, aturan ingress nomor 1 berlaku: rute dengan OTC dari Customer adalah route leak dan ditolak. Yang lolos: rute bocor yang tidak membawa OTC, misalnya karena penyedia lain dan pelanggan sama-sama belum menerapkan role, atau karena pelanggan menghapus atributnya. Karena itu tetap pasang lapisan klasik: prefix-list dari IRR/AS-SET pelanggan (hanya prefix pelanggan yang diterima), maximum-prefix yang ketat dan sesuai PeeringDB pelanggan (ribuan rute akan memutus sesi sebelum menyebar), dan ROV (yang menolak rute bocor yang origin-nya tidak cocok ROA). Pertimbangkan juga `strict-mode` agar sesi tidak naik kalau pelanggan menghapus konfigurasi role-nya.

</details>

---

## 16. Sumber

- RFC 4271 (BGP-4) · RFC 4456 (Route Reflection) · RFC 5065 (Confederations)
- RFC 6811, BGP Prefix Origin Validation (ROV) · RFC 6480, RPKI Architecture
- RFC 7454 / BCP 194, BGP Operations and Security
- RFC 8212, Default External BGP Route Propagation Behavior Without Policies
- MANRS: https://www.manrs.org
- Cisco, *BGP Best Path Selection Algorithm* (Document ID 13753)
- bgpq4: https://github.com/bgp/bgpq4
- RFC 9234, Route Leak Prevention and Detection Using Roles in UPDATE and OPEN Messages: https://www.rfc-editor.org/rfc/rfc9234
- RFC 9319, The Use of maxLength in the RPKI: https://www.rfc-editor.org/rfc/rfc9319
- RFC 9582, A Profile for Route Origin Authorizations: https://www.rfc-editor.org/rfc/rfc9582
- RFC 9455, Avoiding ROAs Containing Multiple IP Prefixes: https://www.rfc-editor.org/rfc/rfc9455
- RFC 9774, Deprecation of AS_SET and AS_CONFED_SET in BGP: https://www.rfc-editor.org/rfc/rfc9774
- RFC 8092, BGP Large Communities Attribute: https://www.rfc-editor.org/rfc/rfc8092
- RFC 7854, BGP Monitoring Protocol (BMP): https://www.rfc-editor.org/rfc/rfc7854
- RFC 9324, Policy Based on the RPKI without Route Refresh: https://www.rfc-editor.org/rfc/rfc9324
- RFC 7999 (BLACKHOLE Community) dan RFC 8326 (Graceful BGP Session Shutdown): https://www.rfc-editor.org/rfc/rfc8326
- IETF datatracker, draft-ietf-sidrops-aspa-verification: https://datatracker.ietf.org/doc/draft-ietf-sidrops-aspa-verification/
- IETF datatracker, draft-ietf-sidrops-aspa-profile: https://datatracker.ietf.org/doc/draft-ietf-sidrops-aspa-profile/
- BIRD 2 User's Guide, protokol RPKI dan BGP (local role, allow as sets): https://bird.network.cz/?get_doc&v=20&f=bird-6.html
- FRRouting, RPKI dan BMP: https://docs.frrouting.org/en/latest/bmp.html
- MikroTik RouterOS, RPKI: https://help.mikrotik.com/docs/spaces/ROS/pages/59277471/RPKI
- Cisco IOS XE, BGP Origin AS Validation: https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_bgp/configuration/xe-16/irg-xe-16-book/bgp-origin-as-validation.html
- Juniper, BGP Origin Validation: https://www.juniper.net/documentation/us/en/software/junos/bgp/topics/topic-map/bgp_origin_validation.html
- Routinator: https://routinator.docs.nlnetlabs.nl/
- RIPE NCC, YouTube Hijacking: A RIPE NCC RIS case study: https://www.ripe.net/publications/news/industry-developments/youtube-hijacking-a-ripe-ncc-ris-case-study
- Cloudflare, How Verizon and a BGP Optimizer Knocked Large Parts of the Internet Offline Today (24 Juni 2019): https://blog.cloudflare.com/how-verizon-and-a-bgp-optimizer-knocked-large-parts-of-the-internet-offline-today/

---

**Berikutnya:** `07-routing-lanjutan/07-redistribusi-policy.md`. Menggabungkan protokol routing dan menerapkan kebijakan.

# 22.5 — Ketersediaan dan Keamanan Jaringan Service Provider

> **Prasyarat:** `22-service-provider/01-mpls-ldp`, `22-service-provider/03-te-segment-routing` (FRR, TI-LFA), `22-service-provider/04-l2vpn-carrier-ethernet`, `07-routing-lanjutan/06-bgp`, `07-routing-lanjutan/10-isis`, `12-keamanan/03-serangan-l3-l7`, `12-keamanan/05-hardening-zero-trust` (dasar CoPP)
> **Tujuan:** Anda bisa menyusun anggaran konvergensi untuk jaringan operator, memilih dan mengonfigurasi GR/NSF/NSR, BFD, BGP PIC, dan Add-Path dengan alasan yang jelas, melindungi control plane (CoPP, LPTS, filter lo0, iACL, uRPF, GTSM, TCP-AO), menanggapi DDoS di tepi operator, serta menjalankan pemeliharaan dengan cost-out yang tidak memutus pelanggan.

---

## 1. Dua Pertanyaan yang Selalu Ditanyakan ke Operator

Pelanggan korporat, regulator, dan manajemen Anda sendiri pada akhirnya hanya menanyakan dua hal:

1. **Berapa lama trafik saya hilang ketika sesuatu rusak?** Ini soal ketersediaan: deteksi kegagalan, konvergensi, dan desain redundansi.
2. **Bisakah orang lain merusak jaringan ini dengan sengaja?** Ini soal keamanan infrastruktur: control plane, sesi routing, dan serangan volumetrik.

Keduanya saling terkait. Router yang CPU-nya dibanjiri paket serangan akan terlambat mengirim hello, sesi IGP putus, dan serangan keamanan berubah menjadi gangguan ketersediaan. Sebaliknya, timer deteksi yang terlalu agresif membuat jaringan rapuh terhadap lonjakan beban yang normal. Modul ini membahas keduanya sebagai satu disiplin.

Modul sebelumnya sudah memberi Anda sebagian alat: TI-LFA di `22-service-provider/03-te-segment-routing` untuk proteksi lokal di bawah 50 ms, route reflector dan RPKI di `07-routing-lanjutan/06-bgp`, serta CoPP dasar di `12-keamanan/05-hardening-zero-trust`. Di sini alat-alat itu dirangkai dari sudut pandang operator.

---

## 2. Anggaran Konvergensi

### Rumus dasar

Waktu trafik hilang setelah kegagalan adalah jumlah empat komponen:

```
 T_hilang = T_deteksi + T_propagasi + T_komputasi + T_FIB

 T_deteksi   : sampai router SADAR ada kegagalan
               (loss of light: instan; BFD: ratusan ms; hello IGP default: puluhan detik;
                hold timer BGP default: 180 detik)
 T_propagasi : sampai router LAIN tahu (flooding LSP/LSA, UPDATE/WITHDRAW BGP)
 T_komputasi : SPF, best path BGP
 T_FIB       : memprogram ulang tabel forwarding di line card
```

Setiap komponen punya "tombol" yang berbeda:

| Komponen | Cara memperkecil | Dibahas di |
|---|---|---|
| Deteksi | Loss of signal fisik, **BFD**, carrier-delay 0 | §4 |
| Propagasi | Flooding IGP cepat, LSP/LSA throttling yang wajar, BGP next-hop tracking | `07-routing-lanjutan/10-isis` |
| Komputasi | SPF throttle dengan initial delay kecil, incremental SPF | `07-routing-lanjutan/10-isis` |
| FIB | **BGP PIC** (FIB hierarkis), backup path terpasang lebih dulu | §5 |
| Semuanya sekaligus (untuk kegagalan lokal) | **FRR lokal**: LFA, TI-LFA, RSVP-TE FRR, dipicu tanpa menunggu konvergensi global | `22-service-provider/03-te-segment-routing` |

### Kenapa T_FIB bisa mendominasi

Bayangkan PE dengan tabel internet penuh (lebih dari satu juta prefiks IPv4) dan dua upstream. Upstream A putus. Tanpa optimasi, router harus menulis ulang next-hop **untuk setiap prefiks** di FIB. Pada platform yang memprogram puluhan ribu entri per detik, ini berarti puluhan detik trafik sebagian prefiks masih diarahkan ke upstream yang mati. Tidak ada timer BGP yang bisa memperbaiki ini; yang memperbaikinya adalah struktur FIB yang tidak bergantung pada jumlah prefiks (§5).

### Contoh anggaran

Sebuah operator menetapkan target berikut untuk core-nya. Angka di bawah adalah **contoh desain**, bukan standar; target nyata bergantung pada perangkat, topologi, dan kontrak.

| Kejadian | Mekanisme utama | Target contoh |
|---|---|---|
| Link core putus (fiber terpotong) | Loss of light + TI-LFA pra-hitung | Di bawah 50 ms |
| Link core "abu-abu" (link UP, frame hilang) | BFD 50 ms × 3 lalu TI-LFA | Sekitar 150-200 ms |
| Node P mati | BFD di semua link ke node itu, TI-LFA node protection | Di bawah 200 ms |
| PE tujuan mati (trafik dari PE lain) | IGP menghapus loopback PE, BGP PIC edge berpindah ke PE cadangan | Di bawah 1 detik |
| Sesi eBGP ke upstream mati karena router upstream hang | BFD eBGP + BGP PIC edge di PE | Sekitar 1 detik |
| Restart proses BGP di PE (bug, upgrade) | NSR (tidak ada yang tahu) atau GR (tetangga mempertahankan rute) | Nol kehilangan trafik |

💡 **Anggaran konvergensi adalah dokumen desain, bukan angan-angan.** Tulis target per jenis kejadian, mekanisme yang diandalkan, dan cara mengujinya. Lalu uji di lab dan saat pemeliharaan terjadwal. Angka yang tidak pernah diuji hanyalah harapan.

---

## 3. Saat Control Plane Restart: GR, NSF, NSR

Router SP modern memisahkan **control plane** (prosesor route, RP/RE) dan **data plane** (line card dengan FIB sendiri). Ketika proses routing restart, crash, atau RP utama digantikan RP cadangan, data plane secara fisik masih bisa meneruskan paket memakai FIB terakhir. Pertanyaannya: apakah tetangga akan membuang rute kita?

### Tiga istilah yang sering tertukar

| Istilah | Siapa yang bekerja | Tetangga tahu ada restart? | Inti |
|---|---|---|---|
| **NSF** (Non-Stop Forwarding) | Router itu sendiri | Bergantung mekanisme | **Kemampuan** data plane tetap meneruskan selama control plane pulih. Prasyarat untuk GR maupun NSR |
| **GR** (Graceful Restart) | Router yang restart **dan tetangganya** (helper) | **Ya**, diberi tahu lewat protokol | Tetangga diminta mempertahankan rute dari router yang restart selama waktu tertentu, lalu sinkron ulang |
| **NSR** (Non-Stop Routing) | Router itu sendiri (RP cadangan) | **Tidak** | State protokol (sesi TCP BGP, adjacency IGP) disinkronkan ke RP cadangan. Saat failover, sesi tidak putus sama sekali |

Pada Juniper, mekanisme switchover RE dengan data plane tetap berjalan disebut **GRES** (Graceful Routing Engine Switchover), dan NSR dibangun di atasnya.

### Graceful Restart BGP (RFC 4724)

1. Saat sesi dibangun, kedua router mengiklankan **GR capability**: restart time dan, per address family, bit **F** (forwarding state dipertahankan).
2. Router A restart. Tetangga B melihat sesi TCP putus, tetapi karena GR, B **menandai rute dari A sebagai stale** dan tetap memakainya, alih-alih menghapusnya.
3. A kembali, membuka sesi baru dengan bit **R** (restarting). Bila bit F untuk sebuah address family tidak di-set, B langsung membuang rute stale family itu.
4. A dan B saling mengirim rute; **End-of-RIB** menandai selesai. B membuang rute stale yang tidak diperbarui.

IS-IS (RFC 8706) dan OSPF (RFC 3623) punya mekanisme serupa. **LLGR** (Long-Lived Graceful Restart, RFC 9494) memperpanjang retensi rute stale sampai jam atau hari dengan preferensi diturunkan, berguna untuk sesi seperti VPN ke route reflector yang terputus lama.

### GR berbahaya bila data plane sebenarnya mati

GR berasumsi data plane router yang restart **masih hidup**. Bila router benar-benar mati (listrik padam), tetangga yang setia mempertahankan rute stale justru **mengirim trafik ke lubang hitam** sampai restart time habis (sering 120 detik). Di sinilah BFD dan GR harus dipahami bersama: BFD yang berjalan di data plane (atau di proses terpisah) tetap UP saat hanya proses BGP yang restart, tetapi DOWN saat seluruh router mati. Bit **C** (Control Plane Independent) di paket BFD memberi tahu tetangga apakah BFD lawan independen dari control plane. Implementasi seperti FRR menyediakan opsi `neighbor X bfd check-control-plane-failure` untuk mengatur interaksi ini.

### Kapan memakai apa

| Situasi | Pilihan |
|---|---|
| Router dengan RP ganda (chassis SP) | **NSR**. Pasangkan dengan BFD agresif di link |
| Router dengan satu RP, upgrade software sering | **GR** (sebagai restarting router) bila platform mendukung NSF |
| Router di sisi lawan router yang punya NSR | Cukup GR **helper** (umumnya aktif default) |
| Sesi eBGP ke pihak lain | Hati-hati; GR membuat Anda bergantung pada perilaku router lawan. Banyak operator mengaktifkan helper saja |

### Konfigurasi

**Cisco IOS XR:**

```
router bgp 65000
 nsr
 bgp graceful-restart
 bgp graceful-restart restart-time 120
!
router isis CORE
 nsr
 nsf cisco
```

**Juniper Junos:**

```
set chassis redundancy graceful-switchover
set routing-options nonstop-routing
set system commit synchronize
# atau, untuk GR (tidak dipakai bersamaan dengan NSR pada protokol yang sama):
set routing-options graceful-restart
```

**FRRouting** (diuji, lihat lab §11):

```
router bgp 65000
 bgp graceful-restart
 bgp graceful-restart preserve-fw-state
```

`preserve-fw-state` membuat FRR menyetel bit F. Tanpanya, lab penulis menunjukkan `IPv4 Unicast(not preserved)` dan `F bit: False` di sisi helper, sehingga helper akan langsung membuang rute stale setelah sesi kembali.

**MikroTik RouterOS v7:** sesi BGP di RouterOS 7.24.5 mengiklankan capability `gr` (terlihat di `/routing bgp session print` sebagai `.capabilities=mp,rr,enhe,gr,as4`). RouterOS tidak punya NSR karena platformnya satu prosesor kontrol.

### Verifikasi

```
RP/0/RP0/CPU0:PE1# show bgp neighbor 10.255.0.10 | include Graceful
RP/0/RP0/CPU0:PE1# show redundancy                       ← status RP cadangan, siap NSR?
RP/0/RP0/CPU0:PE1# show bgp nsr                          ← sinkronisasi NSR

user@pe1> show bgp neighbor 10.255.0.10 | match "restart|NLRI"
user@pe1> show task replication                          ← status replikasi NSR Junos

pe1# show bgp neighbors 10.255.0.10 graceful-restart     ← FRR
```

---

## 4. BFD: Detektor Kegagalan Universal

### Kenapa butuh BFD

Bila fiber terputus, interface langsung down dan semua protokol bereaksi seketika. Masalahnya, banyak kegagalan **tidak** memutus sinyal:

- Ada switch Layer 2, perangkat transmisi, atau converter media di tengah link. Satu sisi putus, sisi Anda tetap "UP".
- Line card lawan macet, CPU router lawan hang, atau ASIC berhenti meneruskan, tetapi laser tetap menyala.
- Link radio microwave mengalami fading parah: link UP, paket hilang.

Tanpa BFD, deteksinya menunggu hello IGP atau hold timer BGP. Menurunkan timer protokol satu per satu itu mahal (setiap protokol punya implementasi hello sendiri) dan berisiko. BFD (RFC 5880) memberi **satu** mekanisme ringan yang hasilnya dipakai bersama oleh IS-IS, OSPF, BGP, static route, LDP, RSVP, dan PW.

### Format paket kontrol

```
  0                   1                   2                   3
  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |Vers |  Diag   |Sta|P|F|C|A|D|M|  Detect Mult  |    Length     |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                       My Discriminator                        |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                      Your Discriminator                       |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                    Desired Min TX Interval                    |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                   Required Min RX Interval                    |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                 Required Min Echo RX Interval                 |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
                                             (sumber: RFC 5880 §4.1)
```

| Field | Arti |
|---|---|
| **Diag** | Alasan perubahan state terakhir: 1 Control Detection Time Expired, 2 Echo Function Failed, 3 Neighbor Signaled Session Down, 5 Path Down, 7 Administratively Down, dan lain-lain |
| **Sta** | State pengirim: AdminDown, Down, Init, Up |
| **P/F** | Poll/Final, untuk mengubah parameter dengan aman |
| **C** | Control Plane Independent (lihat §3) |
| **D** | Demand mode |
| **Detect Mult** | Pengali waktu deteksi |
| **My/Your Discriminator** | Pengenal sesi unik di kedua sisi, agar banyak sesi bisa dipisahkan |
| **Desired Min TX / Required Min RX** | Negosiasi interval, dalam mikrodetik |

### State machine dan negosiasi timer

```
   Down ──(terima Down)──▶ Init ──(terima Init/Up)──▶ Up
    ▲                                                  │
    └──── detection time habis / terima Down ──────────┘
```

Setiap sisi mengirim dengan interval = **max(Desired Min TX miliknya, Required Min RX milik lawan)**. Waktu deteksi di sisi penerima kira-kira **Detect Mult lawan × interval yang disepakati**. Contoh dari lab penulis (FRR), profil 300 ms × 3:

```
Local timers:
        Detect-multiplier: 3
        Receive interval: 300ms
        Transmission interval: 300ms
        Transmission interval (actual with jitter): 294ms
        Detection timeout: 900ms
```

"actual with jitter" muncul karena RFC 5880 mewajibkan jitter acak pada interval kirim agar paket banyak sesi tidak tersinkron.

### Mode dan varian

| Varian | Standar | Transport | Catatan |
|---|---|---|---|
| **Single-hop** | RFC 5881 | UDP tujuan **3784**, TTL/Hop Limit **255** wajib | Untuk tetangga yang terhubung langsung. Paket dengan TTL selain 255 dibuang (proteksi ala GTSM) |
| **Multihop** | RFC 5883 | UDP tujuan **4784** | Untuk iBGP antar-loopback, eBGP multihop. Tidak mendukung echo |
| **Echo** | RFC 5880 | Paket dikirim ke diri sendiri, dipantulkan oleh **forwarding plane** lawan | Menguji jalur data sebenarnya; paket kontrol bisa diperlambat. Hanya single-hop |
| **Demand** | RFC 5880 | Paket kontrol berhenti, verifikasi lewat cara lain | Jarang dipakai |
| **Micro-BFD** | RFC 7130 | Satu sesi per anggota LAG | BFD biasa di atas LAG hanya memantau satu anggota |
| **VCCV-BFD** | RFC 5885 | Di dalam pseudowire | Memantau PW dari ujung ke ujung |

### Seberapa agresif?

BFD yang diproses di line card atau ASIC (hardware offload) bisa stabil di 3,3 ms sampai 50 ms. BFD yang diproses di CPU (router software, VM, sebagian besar router kecil termasuk router berbasis Linux) bisa **flap palsu** saat CPU sibuk, misalnya ketika menerima tabel BGP penuh atau saat serangan ke control plane. BFD yang flap lebih buruk daripada BFD yang lambat, karena setiap flap meruntuhkan sesi IGP/BGP.

💡 **Panduan praktis:** mulai dari 300 ms × 3 untuk platform berbasis CPU dan 50 ms × 3 untuk platform dengan BFD di hardware; ukur stabilitas selama beberapa minggu sebelum mengetatkan. Aktifkan **BFD dampening** bila platform mendukung, agar link yang flap tidak terus meruntuhkan protokol.

### Konfigurasi

**Cisco IOS XR:**

```
router isis CORE
 interface HundredGigE0/0/0/0
  bfd minimum-interval 50
  bfd multiplier 3
  bfd fast-detect ipv4
!
router bgp 65000
 neighbor 192.0.2.1
  remote-as 65001
  bfd fast-detect
  bfd minimum-interval 300
  bfd multiplier 3
```

**Cisco IOS XE:**

```
interface TenGigabitEthernet0/0/0
 bfd interval 50 min_rx 50 multiplier 3
!
router isis CORE
 bfd all-interfaces
!
router bgp 65000
 neighbor 192.0.2.1 fall-over bfd
```

**Juniper Junos:**

```
set protocols isis interface et-0/0/0.0 family inet bfd-liveness-detection minimum-interval 50
set protocols isis interface et-0/0/0.0 family inet bfd-liveness-detection multiplier 3
set protocols bgp group UPSTREAM neighbor 192.0.2.1 bfd-liveness-detection minimum-interval 300
set protocols bgp group UPSTREAM neighbor 192.0.2.1 bfd-liveness-detection multiplier 3
```

**MikroTik RouterOS v7** (diuji di CHR 7.24.5):

```
/routing bfd configuration add interfaces=ether2 min-rx=100ms min-tx=100ms multiplier=3
/routing ospf interface-template set [find interfaces=ether2] use-bfd=yes
/routing bgp connection set [find name=ISP-A] use-bfd=yes
/routing bfd session print detail
```

**FRRouting** (diuji, lihat lab §11):

```
bfd
 profile CORE
  detect-multiplier 3
  receive-interval 100
  transmit-interval 100
 exit
exit
!
interface eth1
 isis bfd
 isis bfd profile CORE
exit
!
router bgp 65000
 neighbor 192.0.2.1 bfd profile EBGP
```

### Verifikasi

```
RP/0/RP0/CPU0:PE1# show bfd session
RP/0/RP0/CPU0:PE1# show bfd session detail          ← interval, multiplier, client (isis, bgp)
PE1# show bfd neighbors details                      ← IOS XE
user@pe1> show bfd session extensive                 ← Junos
pe1# show bfd peers brief                            ← FRR
[admin@pe1] > /routing bfd session print detail      ← RouterOS
```

Di setiap platform, periksa tiga hal: state **Up**, interval yang **benar-benar dinegosiasikan** (bukan sekadar yang dikonfigurasi), dan **klien** yang terdaftar (IS-IS, BGP, static). Sesi BFD UP tanpa klien tidak berguna.

---

## 5. BGP PIC: Konvergensi yang Tidak Bergantung Jumlah Prefiks

### Masalah FIB datar

```
 FIB datar (tanpa PIC):
   203.0.113.0/24  → next-hop 192.0.2.1 → Gi0/0/0/2, MAC aa:bb
   198.51.100.0/24 → next-hop 192.0.2.1 → Gi0/0/0/2, MAC aa:bb
   ... 1 juta entri, masing-masing menyimpan informasi forwarding sendiri

 Upstream 192.0.2.1 mati → tulis ulang 1 juta entri.
```

### FIB hierarkis

```
 FIB hierarkis (PIC):
   203.0.113.0/24  ─┐
   198.51.100.0/24 ─┼──▶ [path-list: primer 10.255.0.1 | backup 10.255.0.2] ──▶ [adjacency]
   ... 1 juta entri ┘
                       (satu objek bersama, diubah SEKALI)
```

Prefiks menunjuk ke **objek next-hop bersama** (path-list), bukan langsung ke adjacency. Saat next-hop berubah, router cukup mengubah satu objek, dan semua prefiks yang menunjuk ke objek itu ikut pindah. Waktu konvergensi menjadi **tidak bergantung jumlah prefiks** (prefix independent). Konsep ini dijabarkan dalam Internet-Draft `draft-ietf-rtgwg-bgp-pic`, yang saat modul ini ditulis masih berstatus draft, bukan RFC, walau sudah lama diimplementasikan vendor besar.

### PIC Core vs PIC Edge

| | **PIC Core** | **PIC Edge** |
|---|---|---|
| Kegagalan | Jalur IGP **menuju** next-hop BGP berubah (link/node core) | Next-hop BGP itu sendiri **hilang** (PE atau upstream mati) |
| Next-hop BGP | Tetap sama | Berganti ke next-hop cadangan |
| Syarat | FIB hierarkis saja | FIB hierarkis **dan** path cadangan sudah diketahui dan dipasang di FIB |
| Contoh | Link P-P putus, IGP menemukan jalur baru ke PE yang sama | PE1 mati, trafik ke 203.0.113.0/24 pindah ke PE2 |

PIC Edge butuh **dua jalur** sudah ada di tabel sebelum kegagalan. Di balik route reflector, router biasanya hanya menerima **satu** jalur terbaik. Karena itulah PIC Edge hampir selalu berpasangan dengan **Add-Path** (§6), best-external, atau RD unik per PE (untuk L3VPN).

### Deteksi tetap penting

PIC mempercepat langkah **setelah** router tahu next-hop mati. Untuk PE yang mati, router lain tahu dari IGP: loopback PE hilang dari tabel IS-IS, lalu **BGP next-hop tracking** menandai semua jalur dengan next-hop itu tidak valid. Waktu deteksi IGP (BFD di link ke PE tersebut) tetap menjadi bagian terbesar anggaran. Beberapa operator menambahkan BFD multihop antar-loopback untuk sesi iBGP, tetapi hati-hati: dengan RR, sesi iBGP PE ke RR putus tidak berarti PE mati.

### Konfigurasi

**Cisco IOS XR (PIC Edge dengan backup terpasang):**

```
route-policy PIC-BACKUP
  set path-selection backup 1 install
end-policy
!
router bgp 65000
 address-family ipv4 unicast
  additional-paths selection route-policy PIC-BACKUP
```

**Cisco IOS XE:**

```
router bgp 65000
 address-family ipv4
  bgp additional-paths install                 ← PIC Edge: pasang jalur backup
  bgp advertise-best-external                  ← PE border mengiklankan jalur eBGP-nya walau bukan best
!
cef table output-chain build favor convergence-speed     ← PIC Core (bila tidak aktif default)
```

**Juniper Junos:**

```
set routing-options forwarding-table indirect-next-hop        ← FIB hierarkis (default di banyak platform MX)
set protocols bgp group IBGP family inet unicast protection   ← PIC Edge untuk inet.0
set routing-instances VPN-A routing-options protect core      ← PIC Edge untuk L3VPN
```

**FRRouting dan RouterOS:** zebra FRR memakai nexthop group sehingga satu perubahan next-hop IGP diterapkan ke banyak rute sekaligus, dan multipath BGP (yang diaktifkan di lab §11) memberi efek serupa untuk jalur yang setara. Penulis tidak menemukan perintah "backup path install" ala PIC Edge di dokumentasi FRR yang diperiksa, atau di RouterOS 7.24.5. Gunakan ECMP sebagai pendekatan terdekat di platform ini.

---

## 6. BGP Add-Path (RFC 7911)

### Masalah: route reflector menyembunyikan jalur

Route reflector hanya memantulkan **satu** jalur terbaik per prefiks. Bila PE1 dan PE2 sama-sama punya jalur ke 203.0.113.0/24, RR memilih satu (misalnya via PE1, router ID lebih kecil), dan semua client hanya tahu jalur itu. Akibatnya:

- Client tidak bisa ECMP ke dua PE.
- Client tidak bisa memasang backup (PIC Edge).
- Saat PE1 mati, client menunggu RR menghitung ulang dan mengirim jalur PE2. Selama itu trafik hilang.

### Solusi: path identifier

Add-Path menambahkan **Path Identifier** 4 byte di depan setiap NLRI, sehingga satu sesi BGP bisa membawa beberapa jalur untuk prefiks yang sama tanpa saling menimpa. Kemampuan ini dinegosiasikan per address family lewat capability (send, receive, atau keduanya).

```
 Tanpa Add-Path:  UPDATE { NLRI 203.0.113.0/24, NH 10.255.0.1 }
                  UPDATE { NLRI 203.0.113.0/24, NH 10.255.0.2 }   ← menimpa yang pertama
 Dengan Add-Path: UPDATE { PathID 6, NLRI 203.0.113.0/24, NH 10.255.0.1 }
                  UPDATE { PathID 7, NLRI 203.0.113.0/24, NH 10.255.0.2 }   ← keduanya hidup
```

### Biaya

Setiap jalur tambahan memakan memori di RR dan client, dan memperbanyak UPDATE. Jangan kirim "semua jalur" ke semua client untuk tabel internet penuh tanpa menghitung. Pilihan yang umum: **2 jalur terbaik**, atau **jalur terbaik per AS tetangga**.

### Konfigurasi

**Cisco IOS XR:**

```
route-policy ADD-PATH-ALL
  set path-selection all advertise
end-policy
!
router bgp 65000
 address-family ipv4 unicast
  additional-paths send
  additional-paths receive
  additional-paths selection route-policy ADD-PATH-ALL
```

**Juniper Junos:**

```
set protocols bgp group RR-CLIENTS family inet unicast add-path send path-count 2
set protocols bgp group RR-CLIENTS family inet unicast add-path receive
```

**FRRouting** (diuji, di RR):

```
router bgp 65000
 address-family ipv4 unicast
  neighbor 10.255.0.3 addpath-tx-all-paths           ← atau addpath-tx-best-selected 2
```

**MikroTik RouterOS v7:** connection BGP di RouterOS 7.24.5 punya parameter `input.add-path` dan `output.add-path` (diperiksa dengan `/console inspect`).

### Bukti di lab

Output dari lab §11 (FRR 10.7.1). Tanpa Add-Path di RR, pe3 hanya melihat satu jalur:

```
pe3# show bgp ipv4 unicast
     Network          Next Hop            Metric LocPrf Weight Path
 *>i 198.51.100.0/24  10.255.0.1               0    100      0 65001 i
 *>i 203.0.113.0/24   10.255.0.1               0    100      0 65001 i
```

Dengan `addpath-tx-all-paths` di RR, pe3 melihat dua jalur dan memasang keduanya (`=` berarti multipath):

```
pe3# show bgp ipv4 unicast
     Network          Next Hop            Metric LocPrf Weight Path
 *>i 198.51.100.0/24  10.255.0.1               0    100      0 65001 i
 *=i                  10.255.0.2               0    100      0 65002 i
 *>i 203.0.113.0/24   10.255.0.1               0    100      0 65001 i
 *=i                  10.255.0.2               0    100      0 65002 i

pe3# show bgp neighbors 10.255.0.10
    AddPath:
      IPv4 Unicast: TX received
      IPv4 Unicast: RX advertised and received
```

---

## 7. Menyusun Convergence Budget untuk Satu Skenario

Ambil skenario konkret: PE3 melayani pelanggan, internet keluar lewat PE1 (upstream AS65001) atau PE2 (upstream AS65002). Router upstream AS65001 **hang** (link tetap UP). Berapa lama pelanggan di PE3 kehilangan sebagian trafik?

| Langkah | Tanpa optimasi | Dengan BFD + Add-Path + multipath |
|---|---|---|
| PE1 sadar upstream mati | Hold timer BGP: hingga 180 detik (default 60/180) | BFD 300 ms × 3: sekitar 0,9 detik |
| PE1 menarik rute dari RR | Milidetik setelah sesi turun | Sama |
| RR memberi tahu PE3 | RR menghitung best baru lalu mengirim jalur PE2 | PE3 **sudah punya** jalur PE2 |
| PE3 memperbarui FIB | Tulis ulang per prefiks | Hapus satu next-hop dari grup multipath |
| **Total** | **Hingga sekitar 3 menit** | **Sekitar 1 detik** (di lab penulis: 0,99 sampai 1,13 detik dari kegagalan sampai jalur PE1 hilang di PE3) |

Angka lab berasal dari kontainer di satu laptop dan hanya menunjukkan **urutan besaran**. Router fisik dengan BFD di hardware dan FIB hierarkis bisa jauh lebih cepat; router software di bawah beban bisa lebih lambat.

⚠️ **Jangan lupa arah sebaliknya.** Trafik **masuk** dari internet ke pelanggan juga perlu berpindah. Upstream AS65001 yang hang tidak akan menarik rute Anda; yang menyelamatkan adalah sesi eBGP Anda turun (karena BFD), sehingga rute pelanggan berhenti diiklankan lewat AS65001 dan internet beralih ke AS65002. Kecepatannya bergantung pada konvergensi BGP di internet, yang di luar kendali Anda.

---

## 8. Proteksi Control Plane

### Jalur punt

Paket yang **ditujukan ke router** (BGP, IS-IS, LDP, SSH, SNMP, ICMP ke alamat router, paket dengan TTL habis, paket dengan IP option) tidak diteruskan oleh ASIC, melainkan "dilempar" (*punt*) ke CPU. Kapasitas jalur punt jauh lebih kecil daripada kapasitas forwarding. Penyerang tidak perlu membanjiri link 100G; cukup membanjiri CPU dengan beberapa ratus ribu paket per detik ke alamat router.

Prinsip proteksinya sama di semua vendor (RFC 6192):

1. **Klasifikasikan** trafik ke CPU menurut protokol dan sumber.
2. **Izinkan** hanya dari sumber yang sah (peer BGP yang dikonfigurasi, tetangga IGP di interface core, subnet manajemen).
3. **Batasi laju** setiap kelas, termasuk kelas yang sah, agar satu protokol tidak bisa menenggelamkan yang lain.
4. **Buang dan catat** sisanya.

### Cisco IOS XE: CoPP

Dasar CoPP sudah ada di `12-keamanan/05-hardening-zero-trust`. Penekanan untuk SP: kelas routing (BGP, IS-IS, LDP, BFD) harus dipisah dari kelas manajemen dan dari kelas "lainnya", dan setiap kelas diberi rate yang diukur dari kondisi normal.

```
ip access-list extended COPP-BGP
 permit tcp host 192.0.2.1 any eq bgp
 permit tcp host 192.0.2.1 eq bgp any
!
class-map match-any COPP-ROUTING
 match access-group name COPP-BGP
 match protocol isis
!
policy-map COPP-SP
 class COPP-ROUTING
  police rate 2000 pps conform-action transmit exceed-action drop
 class class-default
  police rate 200 pps conform-action transmit exceed-action drop
!
control-plane
 service-policy input COPP-SP
```

Sebagian platform IOS XE (misalnya keluarga Catalyst 9000) memakai CoPP sistem yang sudah terpasang default dan hanya bisa disesuaikan ratenya. Periksa dokumentasi platform Anda.

### Cisco IOS XR: LPTS

IOS XR tidak memakai CoPP gaya MQC. Ia memakai **LPTS** (Local Packet Transport Services), yang dibangun **otomatis** dari konfigurasi:

- Saat Anda mengonfigurasi `neighbor 192.0.2.1` di BGP, LPTS membuat entri di **pIFIB** (pre-IFIB) untuk TCP 179 dari 192.0.2.1 sebagai flow **BGP-known**.
- Paket BGP dari alamat yang tidak dikonfigurasi masuk flow **BGP-default** atau **BGP-cfg-peer** dengan rate jauh lebih kecil.
- Setiap flow type punya policer di hardware line card (per NPU), sebelum paket mencapai CPU RP.

```
RP/0/RP0/CPU0:PE1# show lpts pifib hardware police location 0/0/CPU0 ← rate dan drop per flow
RP/0/RP0/CPU0:PE1# show lpts pifib hardware entry brief location 0/0/CPU0
!
lpts pifib hardware police
 flow bgp known rate 2500                                          ← menyesuaikan rate satu flow
```

💡 **Kelebihan LPTS:** proteksi dasar sudah aktif tanpa konfigurasi tambahan, dan peer BGP baru otomatis masuk kelas "known". **Kelemahannya:** operator sering lupa bahwa rate default mungkin terlalu rendah untuk router dengan ribuan sesi BGP (misalnya RR besar atau router di IXP), sehingga flow sah ikut terbuang saat konvergensi masal. Pantau kolom drop di output police.

### Juniper Junos: filter lo0

Di Junos, semua trafik ke Routing Engine melewati interface `lo0`. Filter input di `lo0` menjadi CoPP. Polanya: daftar sumber sah dibangun otomatis dengan `apply-path`, lalu setiap term mengizinkan satu protokol, dan term terakhir membuang serta mencatat.

```
set policy-options prefix-list BGP-PEERS apply-path "protocols bgp group <*> neighbor <*>"
set policy-options prefix-list MGMT 10.99.0.0/24

set firewall family inet filter PROTECT-RE term BGP from source-prefix-list BGP-PEERS
set firewall family inet filter PROTECT-RE term BGP from protocol tcp
set firewall family inet filter PROTECT-RE term BGP from port bgp
set firewall family inet filter PROTECT-RE term BGP then accept

set firewall family inet filter PROTECT-RE term SSH from source-prefix-list MGMT
set firewall family inet filter PROTECT-RE term SSH from protocol tcp
set firewall family inet filter PROTECT-RE term SSH from destination-port ssh
set firewall family inet filter PROTECT-RE term SSH then accept

set firewall family inet filter PROTECT-RE term BFD from protocol udp
set firewall family inet filter PROTECT-RE term BFD from destination-port [ 3784 4784 ]
set firewall family inet filter PROTECT-RE term BFD then accept

set firewall family inet filter PROTECT-RE term SISANYA then count DROP-RE
set firewall family inet filter PROTECT-RE term SISANYA then syslog
set firewall family inet filter PROTECT-RE term SISANYA then discard

set interfaces lo0 unit 0 family inet filter input PROTECT-RE
```

`apply-path` membuat prefix-list yang selalu sinkron dengan konfigurasi BGP: peer baru otomatis diizinkan. IS-IS tidak berjalan di atas IP, sehingga tidak tersaring oleh filter `family inet` ini. Untuk kelengkapan, tambahkan term untuk OSPF, LDP (TCP/UDP 646), RSVP, ICMP dengan policer, NTP, SNMP, dan protokol lain yang Anda pakai **sebelum** menerapkan term terakhir.

⚠️ **Terapkan filter lo0 dengan `commit confirmed`.** Satu term yang terlupa (misalnya BFD atau LDP) langsung memutus protokol itu di seluruh router. `commit confirmed 5` membuat Junos membatalkan perubahan otomatis dalam 5 menit bila Anda tidak mengonfirmasi, misalnya karena Anda sendiri terkunci.

### MikroTik RouterOS dan Linux/FRR

RouterOS memakai chain `input` di `/ip firewall filter` sebagai proteksi control plane, dan Linux memakai hook `input` di nftables (`13-linux-networking/03-nftables-firewall`). Polanya sama: izinkan BGP hanya dari peer, IGP hanya dari interface core, manajemen hanya dari subnet manajemen, lalu buang sisanya. Router berbasis CPU tanpa policer hardware tetap rentan terhadap banjir paket yang dibuang sekalipun, karena pembuangan itu sendiri memakan CPU. Di sinilah filter di **tepi jaringan** (§9) menjadi lapis pertama.

---

## 9. Infrastructure ACL (iACL)

CoPP melindungi CPU, tetapi paket serangan tetap menempuh jaringan Anda sampai ke router target. **Infrastructure ACL** memblokir paket dari luar yang ditujukan ke **alamat infrastruktur** (loopback, link core, manajemen) di titik paling awal: interface ke upstream, peer, dan pelanggan.

```
 Ruang alamat operator:
   100.64.0.0/22   ← pelanggan (transit, harus lewat)
   10.255.0.0/24   ← loopback router (infrastruktur)
   10.0.0.0/16     ← link core (infrastruktur)

 iACL di interface eksternal:
   1. Izinkan protokol yang memang harus dari luar ke infrastruktur
      (eBGP dari alamat peer ke alamat interface lokal, BFD dari peer)
   2. Tolak semua lainnya yang TUJUANNYA ruang infrastruktur
   3. Izinkan semua trafik transit (tujuannya pelanggan)
```

**Cisco IOS XR:**

```
ipv4 access-list IACL-UPSTREAM
 10 permit tcp host 192.0.2.1 host 192.0.2.0 eq bgp
 20 permit tcp host 192.0.2.1 eq bgp host 192.0.2.0
 30 permit udp host 192.0.2.1 host 192.0.2.0 eq 3784
 40 deny ipv4 any 10.255.0.0 0.0.0.255
 50 deny ipv4 any 10.0.0.0 0.0.255.255
 60 permit ipv4 any any
!
interface HundredGigE0/0/0/5
 ipv4 access-group IACL-UPSTREAM ingress
```

Agar iACL sederhana, alokasikan alamat infrastruktur dari blok yang **ringkas dan terpisah** dari alamat pelanggan sejak awal. Banyak operator juga tidak mengiklankan alamat link core ke internet sama sekali.

---

## 10. uRPF: Menolak Alamat Sumber Palsu

Serangan refleksi dan amplifikasi bergantung pada **alamat sumber palsu**. Operator yang tidak memfilter alamat sumber pelanggannya ikut menjadi sumber serangan. **BCP 38** (RFC 2827) dan **BCP 84** (RFC 3704) meminta operator memfilter di tepi; MANRS menjadikannya salah satu tindakan wajib (`07-routing-lanjutan/06-bgp`).

**uRPF** (unicast Reverse Path Forwarding) melakukannya otomatis dengan memeriksa alamat **sumber** terhadap tabel routing:

| Mode | Aturan | Cocok untuk |
|---|---|---|
| **Strict** | Rute ke alamat sumber harus ada **dan** keluar lewat interface yang sama dengan interface masuk | Pelanggan single-homed, port akses |
| **Loose** | Rute ke alamat sumber cukup **ada** di tabel (interface mana pun, selain ke null) | Tepi peering dan transit (asimetris); terutama untuk RTBH berbasis sumber |
| **Feasible path** | Interface masuk termasuk salah satu jalur yang **mungkin** (termasuk jalur cadangan BGP) | Pelanggan multihomed; versi diperbaiki di RFC 8704 |

⚠️ **Strict uRPF di jalur asimetris membuang trafik sah.** Pelanggan multihomed yang mengirim lewat link A tetapi rutenya terpasang lewat link B akan terputus sebagian. Jangan pasang strict di link peering atau transit.

```
! Cisco IOS XR
interface GigabitEthernet0/0/0/10
 ipv4 verify unicast source reachable-via rx          ← strict
 ! ipv4 verify unicast source reachable-via any       ← loose

! Cisco IOS XE
interface GigabitEthernet0/0/1
 ip verify unicast source reachable-via rx

# Juniper Junos
set interfaces ge-0/0/1 unit 0 family inet rpf-check                 ← strict
set interfaces ge-0/0/1 unit 0 family inet rpf-check mode loose

# MikroTik RouterOS (global, berlaku untuk semua interface)
/ip settings set rp-filter=strict

# Linux
sysctl -w net.ipv4.conf.eth1.rp_filter=1      # 1 = strict, 2 = loose
```

---

## 11. GTSM: Pertahanan dari TTL (RFC 5082)

Sesi eBGP biasa menerima paket dari mana saja di internet asalkan alamat dan port cocok. Penyerang yang jauh bisa mengirim TCP RST palsu atau membanjiri port 179.

**GTSM** (Generalized TTL Security Mechanism) memanfaatkan fakta sederhana: TTL berkurang satu di setiap hop dan **tidak bisa dinaikkan** oleh penyerang yang jauh.

```
 Tanpa GTSM: kirim TTL 1, terima TTL berapa pun ≥ 1
 Dengan GTSM: kedua sisi KIRIM dengan TTL 255
              terima hanya bila TTL ≥ 255 - (jumlah hop yang diizinkan) + 1
              untuk tetangga langsung: terima hanya TTL 255 (atau ≥ 254 pada beberapa implementasi)

 Penyerang 5 hop jauhnya mengirim TTL 255 → tiba dengan TTL 250 → dibuang
```

GTSM murah (pemeriksaan header, bisa di hardware) dan efektif, tetapi **harus diaktifkan di kedua sisi**. Bila hanya satu sisi, sisi itu menolak paket lawan yang masih memakai TTL 1, dan sesi tidak naik.

```
! Cisco IOS XR
router bgp 65000
 neighbor 192.0.2.1
  ttl-security

! Cisco IOS XE
router bgp 65000
 neighbor 192.0.2.1 ttl-security hops 1

# FRRouting (diuji di lab)
router bgp 65000
 neighbor 192.0.2.1 ttl-security hops 1

# MikroTik RouterOS v7: local.ttl = TTL paket keluar,
# remote.ttl = TTL minimum yang diterima (hanya berlaku untuk eBGP, menurut manual MikroTik)
/routing bgp connection set [find name=ISP-A] local.ttl=255 remote.ttl=255
```

Junos tidak punya satu tombol GTSM. Ia terdiri dari dua bagian: TTL keluar diset 255 dengan `set protocols bgp group UPSTREAM ttl 255`, dan pemeriksaan TTL masuk dilakukan filter lo0 (§8) dengan term yang mencocokkan `protocol tcp`, `port bgp`, dan `ttl-except 255`, lalu `discard`.

⚠️ **Temuan lab penulis (FRR 10.7.1):** saat `ttl-security hops 1` aktif pada sesi eBGP, FRR mendaftarkan sesi BFD untuk tetangga itu sebagai **multihop** (`BFD: Type: multi hop`, port 4784), bukan single-hop. Tanpa `ttl-security`, sesi yang sama menjadi `single hop`. Deteksi tetap bekerja (lab mencatat BFD down dalam sekitar 0,84 detik), tetapi mode echo tidak bisa dipakai dan perangkat lawan dari vendor lain mungkin mengharapkan BFD single-hop. Uji kombinasi GTSM dan BFD antar-vendor sebelum produksi.

---

## 12. Mengamankan Sesi BGP: MD5 dan TCP-AO

### TCP MD5 (RFC 2385)

Opsi TCP MD5 menambahkan tanda tangan MD5 di setiap segmen TCP berdasarkan kata sandi bersama. Ia mencegah RST palsu dan injeksi segmen dari pihak yang tidak tahu kata sandi. Kelemahannya: MD5 sudah tua, **tidak ada mekanisme ganti kunci tanpa memutus sesi**, dan kata sandi sering sama selama bertahun-tahun karena tidak ada yang berani menggantinya.

### TCP-AO (RFC 5925)

TCP-AO menggantikan TCP MD5 (RFC 2385 secara resmi digantikan RFC 5925):

| Aspek | TCP MD5 | TCP-AO |
|---|---|---|
| Algoritma | MD5 saja | Beberapa, misalnya HMAC-SHA-1-96 dan AES-128-CMAC-96 (RFC 5926) |
| Ganti kunci | Memutus sesi | **Tanpa putus**, lewat key ID dan keychain |
| Kunci sesi | Kata sandi langsung | Kunci turunan per koneksi (traffic key) |
| Dukungan | Hampir semua router | Router SP modern; kernel Linux sejak versi 6.7 |

Status dukungan yang penulis periksa: kernel Linux menambahkan TCP-AO pada versi 6.7 (dokumentasi `Documentation/networking/tcp_ao.rst`), tetapi dokumentasi BGP FRR yang diperiksa hanya mendokumentasikan `neighbor PEER password` (MD5). RouterOS 7.24.5 hanya punya `tcp-md5-key` di connection BGP. Cisco IOS XR, IOS XE, dan Junos menyediakan TCP-AO berbasis keychain pada rilis yang mendukungnya.

```
# Juniper Junos: keychain TCP-AO lalu dipakai oleh grup BGP
set security authentication-key-chains key-chain BGP-AO key 1 secret "RahasiaPanjangSekali"
set security authentication-key-chains key-chain BGP-AO key 1 start-time "2026-11-01.00:00:00"
set security authentication-key-chains key-chain BGP-AO key 1 ao-attribute send-id 1 recv-id 1
set security authentication-key-chains key-chain BGP-AO key 1 ao-attribute tcp-ao-option enabled
set security authentication-key-chains key-chain BGP-AO key 1 ao-attribute cryptographic-algorithm aes-128-cmac-96
set protocols bgp group UPSTREAM authentication-algorithm ao
set protocols bgp group UPSTREAM authentication-key-chain BGP-AO

! Cisco IOS XR: keychain didefinisikan terpisah, lalu
router bgp 65000
 neighbor 192.0.2.1
  ao BGP-AO include-tcp-options enable

! Cisco IOS XE: keychain didefinisikan terpisah, lalu
router bgp 65000
 neighbor 192.0.2.1 ao BGP-AO

# FRRouting (MD5, diuji di lab)
router bgp 65000
 neighbor 192.0.2.1 password RahasiaLab22

# MikroTik RouterOS v7
/routing bgp connection set [find name=ISP-A] tcp-md5-key=RahasiaLab22
```

💡 **Perlindungan sesi bukan hanya kriptografi.** Paket lengkap untuk setiap sesi eBGP operator: GTSM, autentikasi (TCP-AO bila kedua sisi mendukung, MD5 bila tidak), `maximum-prefix`, filter prefiks masuk dan keluar, RPKI ROV, serta BGP Roles (RFC 9234) untuk mencegah route leak. Semua ini dibahas di `07-routing-lanjutan/06-bgp` dan `07-routing-lanjutan/11-interkoneksi-internet`.

---

## 13. Anti-DDoS di Tepi Operator (Ringkas)

Konsep serangan DDoS, RTBH dasar, dan scrubbing sudah ada di `12-keamanan/03-serangan-l3-l7`. Bagian ini menambahkan sudut pandang operator yang **menerima** permintaan blackhole dari pelanggan dan meneruskannya ke hulu.

### RTBH berbasis tujuan

1. Pelanggan (atau NOC Anda) mengiklankan /32 korban dengan community **BLACKHOLE** `65535:666` (RFC 7999).
2. Router tepi operator punya kebijakan: rute dengan community itu, **dan** prefiks yang memang milik pelanggan tersebut, diterima walau lebih spesifik dari /24, lalu next-hop-nya diarahkan ke null/discard.
3. Operator meneruskan /32 itu ke upstream dengan community blackhole milik upstream, sehingga trafik dibuang sedekat mungkin dengan sumbernya.

```
! Cisco IOS XR: terima permintaan blackhole dari pelanggan
community-set BLACKHOLE
  65535:666
end-set
!
route-policy PELANGGAN-X-IN
  if destination in PREFIKS-PELANGGAN-X-32 and community matches-any BLACKHOLE then
    set next-hop discard
    set local-preference 200
    done
  endif
  if destination in PREFIKS-PELANGGAN-X then
    pass
  endif
end-policy
```

⚠️ Validasi **kepemilikan prefiks** sebelum menerima blackhole adalah bagian terpenting. Tanpa itu, satu pelanggan bisa mem-blackhole alamat pelanggan lain, atau alamat siapa pun di internet.

### RTBH berbasis sumber

Dengan **uRPF loose** di tepi (§10), mengarahkan rute **sumber** serangan ke discard membuat paket dari sumber itu gagal pemeriksaan uRPF dan dibuang (RFC 5635). Ini membuang penyerang tanpa memutus korban, tetapi hanya efektif bila sumbernya sedikit dan tidak dipalsukan.

### BGP Flowspec (RFC 8955)

Flowspec mendistribusikan **aturan filter** lewat BGP, bukan rute. Satu aturan berisi kombinasi komponen (tipe 1 alamat tujuan, tipe 2 alamat sumber, tipe 3 protokol IP, lalu port, port tujuan, port sumber, tipe dan kode ICMP, TCP flags, panjang paket, DSCP, fragment) dan aksi berupa extended community (misalnya **traffic-rate** `0x8006` dengan laju 0 berarti buang, **redirect** ke VRF, atau marking DSCP). Untuk IPv6 ada RFC 8956.

```
 Contoh aturan: "buang UDP dari port 123 (NTP amplifikasi) menuju 100.64.1.10/32"
   Tipe 1 (tujuan)   = 100.64.1.10/32
   Tipe 3 (protokol) = 17 (UDP)
   Tipe 6 (port sumber) = 123
   Aksi: traffic-rate 0
```

Flowspec jauh lebih presisi daripada RTBH, tetapi berisiko: aturan yang salah menyebar ke seluruh jaringan dalam hitungan detik, kapasitas TCAM terbatas, dan dukungan antar-vendor tidak seragam. Praktik aman: terima Flowspec hanya dari sumber internal yang dikontrol (misalnya sistem deteksi DDoS Anda), validasi bahwa tujuan aturan adalah prefiks milik sendiri, batasi jumlah aturan, dan uji di lab sebelum produksi.

---

## 14. Operasi SP: Perubahan Tanpa Drama

Sebagian besar gangguan di jaringan operator bukan disebabkan fiber putus, tetapi **perubahan yang dilakukan manusia**. Disiplin operasi adalah bagian dari ketersediaan.

### Jendela pemeliharaan

- Dilakukan pada jam trafik terendah (sering dini hari), diumumkan ke pelanggan terdampak beberapa hari sebelumnya sesuai kontrak.
- Punya **pemilik** (engineer pelaksana), **penyetuju** (change advisory atau atasan), dan **saluran komunikasi** (bridge call, grup NOC).
- Satu jendela, satu tujuan. Jangan menumpuk upgrade software, migrasi fiber, dan perubahan kebijakan BGP dalam satu malam.

### MOP (Method of Procedure)

MOP adalah naskah langkah demi langkah yang ditulis dan ditinjau **sebelum** jendela. Kerangka minimal:

```
1. Tujuan dan ruang lingkup         : apa yang diubah, perangkat mana, layanan terdampak
2. Prasyarat                        : backup konfigurasi, image sudah diunggah dan diverifikasi
                                      checksum-nya, akses konsol cadangan, tiket ke vendor bila perlu
3. Pre-check (rekam kondisi awal)   : jumlah tetangga IGP/BGP, jumlah prefiks per peer,
                                      status BFD, trafik per interface, alarm aktif
4. Cost-out                         : alihkan trafik dari perangkat (lihat di bawah), verifikasi trafik
                                      benar-benar turun
5. Langkah perubahan                : perintah persis, satu per satu, dengan hasil yang diharapkan
6. Post-check                       : bandingkan dengan pre-check
7. Cost-in                          : kembalikan trafik bertahap, verifikasi
8. Kriteria batal (abort)           : kondisi yang memicu rollback, misalnya "lebih dari 15 menit
                                      setelah reload perangkat belum kembali"
9. Rollback                         : langkah persis untuk kembali ke kondisi awal
10. Komunikasi                      : siapa diberi kabar kapan
```

### Cost-out: mengosongkan router sebelum disentuh

Tujuannya: saat router di-reload atau link dicabut, **tidak ada trafik** yang lewat sehingga tidak ada yang hilang.

**IGP, untuk trafik transit:**

| Protokol | Mekanisme | Efek |
|---|---|---|
| IS-IS | **Overload bit** di LSP | Router lain tidak memakai router ini sebagai jalur transit, tetapi prefiks miliknya (loopback, link) tetap terjangkau |
| OSPF | **Max-metric** pada router-LSA (RFC 6987, "stub router") | Semua link transit diberi metrik maksimum sehingga dihindari |

**BGP, untuk trafik yang keluar/masuk lewat router ini:**

**Graceful shutdown (RFC 8326)**: router yang akan dirawat menempelkan community **GRACEFUL_SHUTDOWN** `65535:0` pada rute yang diiklankannya, dan penerima yang mengikuti RFC menurunkan LOCAL_PREF rute itu (umumnya ke 0). Trafik berpindah ke jalur lain **sementara sesi masih hidup**, sehingga tidak ada momen tanpa jalur. Baru setelah trafik turun, sesi boleh diputus.

```
! Cisco IOS XR: aktifkan untuk semua neighbor
! (tanpa all-neighbors, hanya neighbor yang punya blok graceful-maintenance yang terpengaruh)
router bgp 65000
 graceful-maintenance activate all-neighbors

! Cisco IOS XE: per neighbor, dengan timer (detik) sebelum sesi benar-benar ditutup.
! Nilai community adalah GRACEFUL_SHUTDOWN (65535:0); periksa format penulisan
! community yang diterima rilis IOS XE Anda.
router bgp 65000
 neighbor 192.0.2.1 shutdown graceful 300 community 65535:0

# FRRouting (diuji di lab)
bgp graceful-shutdown

# MikroTik RouterOS v7 (sintaks filter diuji di CHR 7.24.5)
# Sisi yang dirawat: tempelkan community pada rute keluar
/routing filter rule add chain=DRAIN-OUT rule="append bgp-communities graceful-shutdown; accept"
# Sisi penerima: hormati community
/routing filter rule add chain=UPSTREAM-IN rule="if (bgp-communities includes graceful-shutdown) { set bgp-local-pref 0; }"
```

```
! IS-IS overload dan OSPF max-metric
! Cisco IOS XR
router isis CORE
 set-overload-bit
router ospf 1
 max-metric router-lsa

# Juniper Junos
set protocols isis overload
set protocols ospf overload

# FRRouting (overload bit diuji di lab)
router isis CORE
 set-overload-bit
router ospf
 max-metric router-lsa administrative
```

### Overload bit saat boot

Router yang baru menyala sering sudah punya adjacency IGP dalam hitungan detik, tetapi tabel BGP-nya belum lengkap selama beberapa menit. Router lain langsung mengirim trafik transit lewat router itu, dan trafik ke prefiks yang belum dipelajari BGP akan hilang. Solusinya: **overload bit atau max-metric otomatis saat startup**, dilepas setelah BGP konvergen atau setelah timer.

```
! Cisco IOS XR
router isis CORE
 set-overload-bit on-startup wait-for-bgp
! atau timer tetap
 set-overload-bit on-startup 300

# Juniper Junos
set protocols isis overload timeout 300

# FRRouting
router isis CORE
 set-overload-bit on-startup 300
```

### Pengaman saat mengetik

- **Junos:** `commit confirmed 5`, lalu `commit` untuk mengonfirmasi. Tanpa konfirmasi, rollback otomatis. `commit check` sebelum commit.
- **IOS XR:** model commit juga; `commit confirmed` tersedia dan `show configuration commit changes` untuk meninjau.
- **RouterOS:** **Safe Mode** (Ctrl+X di terminal). Bila sesi terputus, perubahan sejak Safe Mode aktif dibatalkan.
- **Semua platform:** ambil backup konfigurasi dan simpan di luar perangkat sebelum mulai.

---

## 15. Lab: BFD, Konvergensi Cepat, Add-Path, dan Graceful Shutdown (FRRouting)

### Topologi

```
   up1 (AS65001)                                up2 (AS65002)
   192.0.2.1 │ eBGP + BFD + GTSM + MD5           │ 192.0.2.3
   192.0.2.0 │ eth2                         eth2 │ 192.0.2.2
            pe1 ──eth1────── p1 ──────eth1──── pe2
       10.255.0.1        (P + RR)          10.255.0.2
                        10.255.0.10
                             │ eth3
                             │ eth1
                            pe3 10.255.0.3

 AS 65000: IS-IS L2 + BFD (100 ms × 3) di link core.
 iBGP: pe1, pe2, pe3 ke RR p1 (loopback), Add-Path dari RR ke semua client.
 eBGP: BFD 300 ms × 3, GTSM (ttl-security hops 1), MD5.
 up1 dan up2 sama-sama mengiklankan 203.0.113.0/24 dan 198.51.100.0/24.
 AS65000 mengiklankan 100.64.0.0/22 ke kedua upstream.
```

Berkas: `materi/lab/kode/sp-ha/` berisi `sp-ha.clab.yml`, `daemons`, `vtysh.conf`, dan direktori `pe1/`, `pe2/`, `pe3/`, `p1/`, `up1/`, `up2/` dengan `frr.conf` masing-masing. Image `quay.io/frrouting/frr:10.7.1`. Lab ini tidak butuh modul MPLS.

### Cara penulis memverifikasi

Penulis tidak menjalankan containerlab (butuh root). Konfigurasi yang **sama persis** dijalankan dengan Docker biasa: satu jaringan bridge Docker per link, kontainer FRR yang sama, dan berkas yang di-mount dari direktori lab. Semua output di bawah berasal dari jalankan itu. Angka waktu dari kontainer di laptop hanya menunjukkan urutan besaran.

### Langkah 1: deploy dan cek dasar

```bash
cd materi/lab/kode/sp-ha
sudo containerlab deploy -t sp-ha.clab.yml
docker exec -it clab-sp-ha-pe1 vtysh
```

```
pe1# show bgp summary
Neighbor        V         AS   MsgRcvd   MsgSent   TblVer  InQ OutQ  Up/Down State/PfxRcd   PfxSnt Desc
10.255.0.10     4      65000         7         5        3    0    0 00:00:03            3        3 RR-p1
192.0.2.1       4      65001        12        11        3    0    0 00:00:05            2        1 upstream-AS65001

pe1# show bfd peers brief
SessionId  LocalAddress     PeerAddress      Status   Profile
2665840001 192.0.2.0        192.0.2.1        up       EBGP
4272333566 10.255.0.1       10.255.0.10      up       CORE
```

(Kolom `show bfd peers brief` dipersingkat.) Perhatikan `PfxSnt 1` ke upstream: hanya 100.64.0.0/22 yang keluar, sesuai route-map `UPSTREAM-OUT`.

### Langkah 2: Add-Path dan ECMP di pe3

```
pe3# show bgp ipv4 unicast 203.0.113.0/24
Paths: (2 available, best #1, table default)
  65001
    10.255.0.1 (metric 30) from 10.255.0.10 (10.255.0.1)
      Origin IGP, metric 0, localpref 100, valid, internal, multipath, best (Router ID)
      Originator: 10.255.0.1, Cluster list: 10.255.0.10
      AddPath ID: RX 4, TX-All 0 TX-Best-Per-AS 0 TX-Best-Selected 0
  65002
    10.255.0.2 (metric 30) from 10.255.0.10 (10.255.0.2)
      Origin IGP, metric 0, localpref 100, valid, internal, multipath
      Originator: 10.255.0.2, Cluster list: 10.255.0.10
      AddPath ID: RX 7, TX-All 0 TX-Best-Per-AS 0 TX-Best-Selected 0

pe3# show ip route 203.0.113.0/24
    10.255.0.1 (recursive), weight 1
  *   10.0.3.1, via eth1, weight 1
    10.255.0.2 (recursive), weight 1
      10.0.3.1, via eth1 (duplicate nexthop removed), weight 1
```

Dua jalur dari RR yang sama dibedakan oleh **AddPath ID** (RX 4 dan RX 7). Karena AS_PATH berbeda (65001 vs 65002), pe3 butuh `bgp bestpath as-path multipath-relax` agar keduanya dianggap multipath.

**Eksperimen:** di p1, `no neighbor 10.255.0.3 addpath-tx-all-paths` di bawah `address-family ipv4 unicast`, lalu ulangi perintah di pe3. Anda akan melihat hanya satu jalur (output di §6). Kembalikan konfigurasinya.

### Langkah 3: router upstream hang, BFD bekerja

`docker pause` membekukan semua proses di kontainer up1 tanpa menurunkan link. Ini meniru router yang hang: kabel dan laser tetap hidup, tetapi tidak ada yang menjawab.

```bash
date +%T.%3N; docker pause clab-sp-ha-up1
docker logs clab-sp-ha-pe1 2>&1 | grep -E "BFD|192.0.2.1" | tail -3
```

Log pe1 dari lab penulis (waktu log dalam UTC, `docker pause` dijalankan pukul 08:01:50.169 UTC):

```
08:01:51.005 BGP: %NOTIFICATION(Hard Reset): sent to neighbor 192.0.2.1 6/10 (Cease/BFD Down) 0 bytes
08:01:51.005 BGP: %ADJCHANGE: neighbor 192.0.2.1(up1) in vrf default Down BFD down initiated
```

Sekitar **836 ms** dari kegagalan sampai sesi BGP turun, sesuai waktu deteksi BFD 900 ms (paket terakhir diterima sedikit sebelum pause). BGP mengirim NOTIFICATION Cease dengan subkode **10 (BFD Down)**. Diukur dari pe3, jalur via pe1 hilang dari tabel routing pe3 **1.132 ms** setelah pause pada percobaan ini dan **992 ms** pada percobaan ulang.

Tanpa BFD, deteksi bergantung pada hold timer BGP (default FRR dengan `frr defaults traditional`: keepalive 60, hold 180 detik). Anda bisa mencobanya dengan menghapus `neighbor 192.0.2.1 bfd profile EBGP` di pe1 dan up1, lalu mengulang pause.

```bash
docker unpause clab-sp-ha-up1     # pulihkan
```

### Langkah 4: graceful shutdown (cost-out pe1)

```
pe1# configure
pe1(config)# bgp graceful-shutdown
```

Hasil di lab penulis:

```
pe1# show bgp ipv4 unicast 203.0.113.0/24
Paths: (2 available, best #1, table default)
  65002
    10.255.0.2 (metric 30) from 10.255.0.10 (10.255.0.2)
      Origin IGP, metric 0, localpref 100, valid, internal, best (Local Pref)
  65001
    192.0.2.1 from 192.0.2.1 (192.0.2.1)
      Origin IGP, metric 0, localpref 0, valid, external
      Community: graceful-shutdown

up1# show bgp ipv4 unicast 100.64.0.0/22
  65000
    192.0.2.0 from 192.0.2.0 (10.255.0.1)
      Origin IGP, metric 0, localpref 0, valid, external, best (First path received)
      Community: graceful-shutdown

pe3# show ip route 203.0.113.0/24
    10.255.0.2 (recursive), weight 1
  *   10.0.3.1, via eth1, weight 1
```

Tiga hal terjadi sekaligus, **tanpa satu sesi pun turun**:

1. pe1 sendiri menurunkan jalur eBGP-nya ke LOCAL_PREF 0, sehingga pe1 pun memilih keluar lewat pe2.
2. Karena jalur eBGP pe1 bukan lagi best, pe1 berhenti mengiklankannya ke RR, sehingga pe3 hanya memakai pe2 (trafik **keluar** sudah dialihkan).
3. up1 menerima 100.64.0.0/22 dengan community `graceful-shutdown`. Dokumentasi FRR menyebut FRR penerima otomatis memperlakukan community ini sebagai preferensi terendah (terlihat `localpref 0` di up1). Trafik **masuk** pun akan beralih ke jalur lain bila upstream punya alternatif.

Sekarang pe1 aman untuk di-reload. Setelah selesai: `no bgp graceful-shutdown`.

### Langkah 5: graceful restart (bgpd crash)

```bash
docker exec clab-sp-ha-pe1 sh -c 'kill -9 $(pidof bgpd)'
docker exec clab-sp-ha-p1 vtysh -c "show bgp ipv4 unicast 203.0.113.0/24"
```

Hasil di lab penulis, dua detik setelah bgpd pe1 dibunuh:

```
p1# show bgp ipv4 unicast 203.0.113.0/24
Paths: (2 available, best #1, table default)
  65001, (stale), (Received from a RR-client)
    10.255.0.1 (metric 20) from 10.255.0.1 (0.0.0.0)
      Origin IGP, metric 0, localpref 100, valid, internal, best (Router ID)
      Time until Graceful Restart stale route deleted: 117
  65002, (Received from a RR-client)
    10.255.0.2 (metric 20) from 10.255.0.2 (10.255.0.2)
```

p1 (sebagai **helper**) menandai jalur dari pe1 sebagai **stale** tetapi tetap memakainya, dengan hitung mundur 120 detik. pe3 tidak melihat perubahan apa pun. watchfrr di dalam kontainer menyalakan ulang bgpd, sesi naik kembali, dan tanda stale hilang. Perhatikan juga: BFD tetap UP selama bgpd mati karena BFD berjalan di proses terpisah (`bfdd`). Inilah perilaku yang Anda inginkan untuk restart proses, dan juga alasan BFD tidak bisa mendeteksi "BGP hidup tetapi macet".

### Langkah 6: overload bit

```
pe1# configure
pe1(config)# router isis CORE
pe1(config-router)# set-overload-bit

pe3# show isis database
LSP ID                  PduLen  SeqNumber   Chksum  Holdtime  ATT/P/OL
pe1.00-00                  93   0x00000006  0xa9a8    1190    0/0/1
```

Kolom `OL` bernilai 1 untuk LSP pe1. Di topologi ini pe1 adalah router ujung sehingga tidak ada trafik transit yang berpindah. Lepas lagi (`no set-overload-bit`), lalu ulangi di **p1**. Hasil di lab penulis:

```
pe3# show ip route isis
I>* 10.0.1.0/31 [115/20] via 10.0.3.1, eth1, weight 1
I>* 10.0.2.0/31 [115/20] via 10.0.3.1, eth1, weight 1
I>* 10.255.0.10/32 [115/20] via 10.0.3.1, eth1, weight 1

pe3# show bgp ipv4 unicast
     Network          Next Hop            Metric LocPrf Weight Path
   i 203.0.113.0/24   10.255.0.2               0    100      0 65002 i
   i                  10.255.0.1               0    100      0 65001 i
   ...
pe3# show ip route 203.0.113.0/24
% Network not in table
```

Prefiks milik p1 sendiri (loopback dan link-nya) tetap terjangkau, sehingga sesi iBGP pe3 ke RR p1 **tetap hidup** dan jalur BGP tetap diterima. Tetapi loopback pe1 dan pe2 hilang karena satu-satunya jalan ke sana adalah transit melalui p1. Jalur BGP kehilangan tanda `*` (next-hop tidak valid) dan tidak ada lagi rute ke internet. Pelajaran: **overload di router yang tidak punya alternatif sama dengan memutus jaringan**, dan gejalanya menipu karena sesi BGP ke RR masih Established. Cost-out hanya aman bila ada jalur pengganti.

⚠️ **Catatan lab:** `sp-ha.clab.yml` menghapus default route jaringan manajemen di setiap node. Tanpa itu, next-hop BGP pe1 dan pe2 "terselesaikan" lewat default route ke eth0 (jaringan manajemen Docker), dan eksperimen ini tampak baik-baik saja. Penulis mengalaminya sendiri saat pertama kali menjalankan lab.

```bash
sudo containerlab destroy -t sp-ha.clab.yml
```

---

## 16. Troubleshooting

| Gejala | Penyebab paling mungkin | Pembuktian |
|---|---|---|
| Sesi BFD tidak pernah UP | Paket BFD diblokir CoPP/filter lo0/iACL, UDP 3784/4784 tidak diizinkan, satu sisi single-hop dan sisi lain multihop | `show bfd session detail`, penghitung drop CoPP/LPTS, tangkap paket di interface |
| BFD flap berkala, IGP ikut flap | Timer terlalu agresif untuk BFD berbasis CPU, CPU sibuk saat konvergensi BGP | Korelasikan waktu flap dengan beban CPU; longgarkan timer, aktifkan dampening |
| BFD UP tapi protokol tidak bereaksi saat link mati | Protokol tidak terdaftar sebagai klien BFD | Lihat daftar klien di `show bfd session detail` |
| Sesi eBGP dengan GTSM tidak naik | GTSM hanya di satu sisi, atau jumlah hop salah | Bandingkan konfigurasi; tangkap paket dan periksa TTL |
| Sesi BGP flap setelah ganti kata sandi MD5 | MD5 tidak bisa ganti kunci tanpa putus | Jadwalkan di jendela pemeliharaan atau migrasi ke TCP-AO |
| Setelah PE mati, sebagian prefiks lama pulih | FIB datar (tanpa PIC), atau client RR tidak punya jalur cadangan | Ukur waktu per prefiks; cek apakah backup path terpasang |
| Client RR tidak melihat jalur kedua | Add-Path tidak dinegosiasikan di kedua sisi | Bagian capability di `show bgp neighbor` |
| Setelah reload, trafik ke sebagian tujuan hilang beberapa menit | Router menarik trafik transit sebelum BGP lengkap | Pasang overload bit/max-metric on-startup |
| Rute stale bertahan lama setelah router lawan mati total | GR helper mempertahankan rute dari router yang data plane-nya ikut mati | BFD yang independen dari control plane, restart time yang wajar |
| Pelanggan multihomed kehilangan sebagian trafik setelah uRPF dipasang | Strict uRPF di jalur asimetris | Penghitung drop uRPF; ganti ke loose atau feasible |
| Setelah memasang filter lo0, LDP/BFD/SNMP mati | Term untuk protokol itu terlupa | Penghitung term terakhir (discard), log syslog filter |

---

## 17. Kesalahan Umum

1. **Menyalin timer BFD 50 ms × 3 dari presentasi vendor ke router berbasis CPU.** Hasilnya flap palsu yang lebih sering daripada kegagalan nyata.
2. **Menganggap GR dan NSR sama.** GR membutuhkan kerja sama tetangga dan mereka tahu ada restart; NSR tidak terlihat dari luar dan butuh RP ganda.
3. **Mengaktifkan GR di mana-mana tanpa BFD.** Saat router mati total, tetangga mempertahankan rute stale ke lubang hitam selama restart time.
4. **Mengharapkan PIC Edge bekerja di balik RR tanpa Add-Path.** Client yang hanya tahu satu jalur tidak punya apa pun untuk dipasang sebagai backup.
5. **Add-Path "semua jalur" ke semua client untuk tabel penuh.** Memori client membengkak; pilih 2 jalur atau best per AS.
6. **Filter lo0 atau CoPP tanpa term untuk protokol yang dipakai.** Biasanya BFD, LDP, atau traceroute (ICMP TTL exceeded).
7. **Strict uRPF di link peering.** Jalur asimetris adalah hal normal di internet.
8. **GTSM di satu sisi saja.** Sesi tidak naik, dan engineer menghabiskan waktu mencurigai kata sandi.
9. **Menerima blackhole /32 tanpa memvalidasi kepemilikan prefiks.** Pelanggan bisa mem-blackhole alamat orang lain.
10. **Reload router tanpa cost-out**, atau cost-out router yang tidak punya jalur pengganti. Keduanya berakhir dengan trafik hilang.
11. **MOP tanpa kriteria batal.** Tanpa batas waktu dan kondisi yang jelas, tim cenderung terus "mencoba sedikit lagi" sampai jendela habis dan pagi tiba.

---

## 18. Ringkasan

- **Anggaran konvergensi** = deteksi + propagasi + komputasi + FIB. Tetapkan target per jenis kejadian dan ujilah.
- **NSF** = data plane jalan terus; **GR** = tetangga membantu dan tahu ada restart (RFC 4724, bit R dan F, rute stale, End-of-RIB); **NSR** = state disinkronkan ke RP cadangan, tetangga tidak tahu. GR tanpa BFD berisiko lubang hitam.
- **BFD** (RFC 5880): Diag, Sta, discriminator, interval dinegosiasikan, deteksi = multiplier × interval. Single-hop UDP 3784 TTL 255 (RFC 5881), multihop UDP 4784 (RFC 5883), echo, micro-BFD untuk LAG. Timer agresif hanya untuk BFD di hardware.
- **BGP PIC**: FIB hierarkis membuat konvergensi tidak bergantung jumlah prefiks. **Core** = jalur IGP ke next-hop berubah; **Edge** = next-hop hilang, butuh backup path terpasang.
- **Add-Path** (RFC 7911): Path Identifier 4 byte, RR bisa memantulkan lebih dari satu jalur; dasar PIC Edge dan ECMP di balik RR.
- **Proteksi control plane**: CoPP (IOS XE), **LPTS** otomatis dari konfigurasi (IOS XR), **filter lo0** dengan `apply-path` (Junos), chain input (RouterOS/Linux).
- **iACL** di tepi melindungi alamat infrastruktur; **uRPF** strict untuk pelanggan single-homed, loose untuk peering/RTBH sumber.
- **GTSM** (RFC 5082): kirim TTL 255, terima hanya dari hop terdekat; harus di kedua sisi.
- **TCP-AO** (RFC 5925) menggantikan **MD5** (RFC 2385): banyak algoritma, ganti kunci tanpa putus.
- **DDoS**: RTBH tujuan dengan **65535:666** (RFC 7999) plus validasi kepemilikan; RTBH sumber dengan uRPF loose; **Flowspec** (RFC 8955) presisi tetapi berisiko.
- **Operasi**: jendela pemeliharaan, **MOP** dengan pre-check, cost-out, kriteria batal, rollback. Cost-out dengan **overload bit**, **max-metric**, dan **graceful shutdown** `65535:0` (RFC 8326); overload **on-startup** setelah reload; `commit confirmed` dan Safe Mode.

---

## 19. Latihan

1. Router PE dengan tabel internet penuh kehilangan salah satu dari dua upstream. Engineer menurunkan timer BGP ke 3/9 detik, tetapi pelanggan tetap melaporkan sebagian situs tidak bisa diakses sampai sekitar 40 detik. Komponen anggaran konvergensi mana yang kemungkinan besar dominan, dan fitur apa yang memperbaikinya?
2. Jelaskan perbedaan GR dan NSR dari sudut pandang router tetangga. Dalam situasi apa GR justru memperpanjang gangguan, dan bagaimana mencegahnya?
3. Dua router menegosiasikan BFD. Router A: Desired Min TX 50 ms, Required Min RX 300 ms, multiplier 3. Router B: Desired Min TX 100 ms, Required Min RX 50 ms, multiplier 5. Hitung interval kirim masing-masing dan waktu deteksi di masing-masing sisi.
4. Di jaringan Anda, setiap PE menjadi client dari dua RR. Manajemen meminta PIC Edge untuk prefiks internet. Apa yang harus diubah di RR dan di PE, dan apa risiko yang perlu Anda hitung?
5. Setelah menerapkan filter lo0 di router Junos, sesi IS-IS tetap UP tetapi semua LSP MPLS dari router itu turun beberapa menit kemudian. Apa penyebab paling mungkin, dan kenapa IS-IS tidak terpengaruh?
6. Seorang engineer memasang `ipv4 verify unicast source reachable-via rx` di semua interface ke peer IXP. Beberapa jam kemudian ada keluhan sebagian pengguna tidak bisa mengakses layanan tertentu. Jelaskan apa yang terjadi dan perbaikannya.
7. Sesi eBGP baru ke upstream tidak naik. Anda sudah memastikan alamat, AS, dan kata sandi MD5 benar. Konfigurasi Anda memuat `neighbor X ttl-security hops 1`. Apa yang Anda periksa berikutnya, dan bagaimana membuktikannya dengan tangkapan paket?
8. Pelanggan Anda meminta fitur "blackhole sendiri" untuk /32 di dalam prefiks /24 miliknya. Tuliskan syarat kebijakan di router tepi Anda dan jelaskan kenapa setiap syarat diperlukan.
9. Susun MOP ringkas (pre-check, cost-out, perubahan, post-check, cost-in, kriteria batal) untuk upgrade software satu router P dalam core IS-IS + LDP yang punya jalur alternatif.
10. Di lab §15, langkah 6, overload bit di p1 memutus semua PE satu sama lain. Kenapa demikian, dan apa pelajaran desainnya untuk cost-out?

<details>
<summary>Jawaban</summary>

1. Yang dominan kemungkinan besar **T_FIB**: router harus menulis ulang next-hop untuk ratusan ribu sampai jutaan prefiks satu per satu, sehingga sebagian prefiks pindah cepat dan sebagian lain baru pindah puluhan detik kemudian. Menurunkan timer BGP hanya mempercepat **deteksi**, yang sudah bukan masalah. Perbaikannya **BGP PIC** (FIB hierarkis: prefiks menunjuk ke objek next-hop bersama) ditambah jalur cadangan yang sudah terpasang (**PIC Edge**, dengan Add-Path atau best-external bila ada RR). Deteksi juga sebaiknya memakai **BFD** alih-alih timer BGP 3/9 yang membebani CPU dan berisiko flap.

2. Pada **GR**, tetangga **tahu** router restart: sesi TCP putus, tetangga (helper) mempertahankan rute sebagai stale, lalu sesi dibangun ulang dan disinkronkan dengan End-of-RIB. Pada **NSR**, tetangga **tidak tahu apa-apa**: sesi TCP dan adjacency dipindahkan ke RP cadangan tanpa putus. GR memperpanjang gangguan bila router yang "restart" sebenarnya **mati total** (data plane ikut mati): helper tetap mengirim trafik ke rute stale sampai restart time habis. Pencegahannya: BFD yang statusnya mencerminkan data plane, sehingga kematian total terdeteksi dan GR tidak dipicu (atau diakhiri), restart time yang wajar, dan memakai NSR pada platform dengan RP ganda.

3. Interval kirim A = max(TX A 50, RX B 50) = **50 ms**. Interval kirim B = max(TX B 100, RX A 300) = **300 ms**. Waktu deteksi di sisi **A** (menunggu paket dari B) = multiplier B × interval kirim B = 5 × 300 = **1.500 ms**. Waktu deteksi di sisi **B** (menunggu paket dari A) = multiplier A × interval kirim A = 3 × 50 = **150 ms**. Asimetri seperti ini legal, tetapi biasanya tanda konfigurasi yang tidak disengaja; samakan profil di kedua sisi.

4. **Di RR:** aktifkan Add-Path **send** dengan seleksi terbatas (misalnya 2 jalur terbaik atau best per AS tetangga), sehingga client menerima jalur kedua. **Di PE:** aktifkan Add-Path **receive**, lalu aktifkan pemasangan backup (IOS XR `additional-paths selection` dengan `set path-selection backup 1 install`, IOS XE `bgp additional-paths install`, Junos `protection`), dan pastikan FIB hierarkis aktif. PE border juga perlu mengiklankan jalur eBGP-nya walau bukan best (best-external) agar jalur alternatif ada di RR. **Risiko yang dihitung:** memori RIB/FIB di setiap PE untuk jalur tambahan (dikalikan ukuran tabel penuh dan dua RR), jumlah UPDATE saat churn, dan kapasitas FIB hardware untuk entri backup.

5. Penyebab paling mungkin: filter lo0 tidak punya term untuk **LDP** (UDP/TCP 646) atau **RSVP**, atau untuk **BFD** bila LSP bergantung padanya, sehingga sesi LDP/RSVP habis waktu dan LSP turun setelah timer holdtime-nya habis (itulah sebabnya terjadi beberapa menit kemudian). IS-IS tidak terpengaruh karena **IS-IS tidak berjalan di atas IP**; ia langsung di atas Layer 2 (CLNS), sehingga filter `family inet` tidak menyentuhnya. Perbaikan: tambahkan term LDP/RSVP/BFD sebelum term discard, dan selalu terapkan filter dengan `commit confirmed` sambil memantau penghitung term terakhir.

6. `reachable-via rx` adalah **strict uRPF**: paket diterima hanya bila rute ke alamat sumbernya keluar lewat interface yang sama. Di IXP dan peering, routing **asimetris** adalah normal: jaringan X mungkin mengirim trafik ke Anda lewat IXP, tetapi rute Anda ke prefiks X lewat transit. Paket sah dari X dibuang. Perbaikan: ganti ke **loose** (`reachable-via any`) atau lepas uRPF di interface peering; pakai strict hanya di port pelanggan single-homed. Pemfilteran anti-spoofing di peering lebih baik dilakukan dengan filter prefiks dan kebijakan yang disepakati.

7. Periksa apakah **upstream juga mengaktifkan GTSM**. Bila tidak, upstream mengirim paket BGP dengan TTL 1 (eBGP default), yang tiba dengan TTL 1, sementara router Anda hanya menerima TTL 254-255, sehingga paket dibuang. Bukti: tangkap paket di interface ke upstream (misalnya `tcpdump -v -n port 179`) dan lihat field **ttl** pada SYN atau segmen dari upstream. TTL 1 dari upstream berarti GTSM hanya di sisi Anda. Sepakati GTSM di kedua sisi atau lepaskan sementara. Periksa juga jumlah hop: bila sesi melewati satu hop tambahan (misalnya ke loopback), `hops 1` tidak cukup.

8. Syarat kebijakan: (a) rute membawa community **BLACKHOLE `65535:666`** (atau community yang Anda dokumentasikan); tanpa penanda ini, /32 diperlakukan sebagai rute biasa dan ditolak karena terlalu spesifik. (b) Prefiks berada **di dalam ruang alamat yang terdaftar milik pelanggan itu** (prefix-list per pelanggan, misalnya /24 miliknya `le 32`); ini mencegah pelanggan mem-blackhole alamat orang lain. (c) Panjang prefiks dibatasi (misalnya hanya /32 untuk IPv4 dan /128 untuk IPv6, atau maksimal tertentu) agar blackhole tidak terlalu luas. (d) Next-hop diubah ke **discard/null** di router Anda, dan rute diberi **no-export** atau hanya diteruskan ke upstream dengan community blackhole milik upstream. (e) Batasi jumlah rute blackhole per pelanggan (maximum-prefix) dan catat setiap kejadian.

9. Contoh MOP: **Pre-check:** catat tetangga IS-IS dan sesi LDP (jumlah dan uptime), sesi BFD, jumlah label di LFIB, trafik per interface, alarm aktif; verifikasi image sudah di flash dengan checksum benar; backup konfigurasi ke server. **Cost-out:** aktifkan overload bit IS-IS di router P; verifikasi di router tetangga bahwa jalur transit sudah pindah dan trafik interface router P turun mendekati nol. **Perubahan:** instal image, reload, tunggu boot. **Post-check:** bandingkan semua item pre-check; versi software sesuai. **Cost-in:** lepas overload bit (atau biarkan on-startup timer bekerja), verifikasi trafik kembali, pantau 15-30 menit. **Kriteria batal:** router tidak kembali dalam X menit setelah reload, adjacency kurang dari jumlah awal, atau error baru di log; **rollback:** boot ke image lama, pulihkan konfigurasi dari backup, lepas overload setelah kondisi sesuai pre-check.

10. p1 adalah **satu-satunya** router transit antara pe1, pe2, dan pe3. Overload bit memberi tahu router lain "jangan pakai saya sebagai jalur transit", tetapi prefiks milik p1 sendiri tetap terjangkau. Akibatnya sesi iBGP setiap PE ke RR p1 (loopback p1) tetap Established dan rute BGP tetap diterima, tetapi SPF di setiap PE tidak menemukan jalan ke loopback PE lain, sehingga **next-hop BGP** (10.255.0.1 dan 10.255.0.2) tidak valid dan rute ke internet hilang dari tabel routing. Gejala ini menipu: sesi BGP terlihat sehat padahal trafik putus. Pelajarannya: **cost-out hanya aman bila ada jalur pengganti**; sebelum overload atau graceful shutdown, verifikasi bahwa topologi punya redundansi untuk perangkat itu, dan pada router yang memang titik tunggal, rencanakan jendela pemeliharaan dengan dampak yang diumumkan.

</details>

---

## 20. Sumber

- RFC 5880, Bidirectional Forwarding Detection (BFD): https://www.rfc-editor.org/rfc/rfc5880
- RFC 5881, BFD for IPv4 and IPv6 (Single Hop): https://www.rfc-editor.org/rfc/rfc5881
- RFC 5882, Generic Application of BFD: https://www.rfc-editor.org/rfc/rfc5882
- RFC 5883, BFD for Multihop Paths: https://www.rfc-editor.org/rfc/rfc5883
- RFC 7130, BFD on Link Aggregation Group (LAG) Interfaces: https://www.rfc-editor.org/rfc/rfc7130
- RFC 4724, Graceful Restart Mechanism for BGP: https://www.rfc-editor.org/rfc/rfc4724
- RFC 9494, Long-Lived Graceful Restart for BGP: https://www.rfc-editor.org/rfc/rfc9494
- RFC 8706, Restart Signaling for IS-IS: https://www.rfc-editor.org/rfc/rfc8706
- RFC 3623, Graceful OSPF Restart: https://www.rfc-editor.org/rfc/rfc3623
- RFC 7911, Advertisement of Multiple Paths in BGP: https://www.rfc-editor.org/rfc/rfc7911
- draft-ietf-rtgwg-bgp-pic, BGP Prefix Independent Convergence: https://datatracker.ietf.org/doc/draft-ietf-rtgwg-bgp-pic/
- RFC 6192, Protecting the Router Control Plane: https://www.rfc-editor.org/rfc/rfc6192
- RFC 2827 (BCP 38), Network Ingress Filtering: https://www.rfc-editor.org/rfc/rfc2827
- RFC 3704 (BCP 84), Ingress Filtering for Multihomed Networks: https://www.rfc-editor.org/rfc/rfc3704
- RFC 8704, Enhanced Feasible-Path Unicast Reverse Path Forwarding: https://www.rfc-editor.org/rfc/rfc8704
- RFC 5082, The Generalized TTL Security Mechanism (GTSM): https://www.rfc-editor.org/rfc/rfc5082
- RFC 2385, Protection of BGP Sessions via the TCP MD5 Signature Option: https://www.rfc-editor.org/rfc/rfc2385
- RFC 5925, The TCP Authentication Option: https://www.rfc-editor.org/rfc/rfc5925
- RFC 5926, Cryptographic Algorithms for TCP-AO: https://www.rfc-editor.org/rfc/rfc5926
- RFC 7454 (BCP 194), BGP Operations and Security: https://www.rfc-editor.org/rfc/rfc7454
- RFC 7999, BLACKHOLE Community: https://www.rfc-editor.org/rfc/rfc7999
- RFC 5635, Remote Triggered Black Hole Filtering with uRPF: https://www.rfc-editor.org/rfc/rfc5635
- RFC 8955, Dissemination of Flow Specification Rules: https://www.rfc-editor.org/rfc/rfc8955
- RFC 8956, Dissemination of Flow Specification Rules for IPv6: https://www.rfc-editor.org/rfc/rfc8956
- RFC 8326, Graceful BGP Session Shutdown: https://www.rfc-editor.org/rfc/rfc8326
- RFC 6987, OSPF Stub Router Advertisement: https://www.rfc-editor.org/rfc/rfc6987
- RFC 9234, Route Leak Prevention and Detection Using Roles: https://www.rfc-editor.org/rfc/rfc9234
- Linux kernel, TCP Authentication Option Linux implementation: https://docs.kernel.org/networking/tcp_ao.html
- FRRouting User Guide, BFD: https://docs.frrouting.org/en/latest/bfd.html
- FRRouting User Guide, BGP (graceful restart, Add-Path, graceful shutdown, GTSM): https://docs.frrouting.org/en/latest/bgp.html
- FRRouting User Guide, IS-IS (overload bit): https://docs.frrouting.org/en/latest/isisd.html
- MikroTik, CLI reference `/routing/bgp/connection`: https://manual.mikrotik.com/docs/cli-reference/routing/bgp/connection
- containerlab: https://containerlab.dev/
- Cisco, dokumentasi IOS XR (BGP, BFD, LPTS) untuk ASR 9000/NCS: https://www.cisco.com/c/en/us/support/routers/asr-9000-series-aggregation-services-routers/products-installation-and-configuration-guides-list.html
- Juniper, dokumentasi Junos (BFD, NSR/GRES, firewall filter lo0): https://www.juniper.net/documentation/
- MANRS, Mutually Agreed Norms for Routing Security: https://www.manrs.org/

---

**Berikutnya:** `23-jalur-vendor/01-junos` — pendalaman opsional: Junos, Cisco SD-Access dan Catalyst SD-WAN, serta API platform Cisco. Kalau ingin langsung ke peta profesi, lewati ke modul 21.1 Peta Ekosistem.

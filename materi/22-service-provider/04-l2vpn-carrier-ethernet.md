# 22.4 L2VPN dan Carrier Ethernet

> **Prasyarat:** `22-service-provider/01-mpls-ldp` (label, LDP, LSP), `22-service-provider/02-mpls-l3vpn` (RD/RT, MP-BGP), `03-data-link/03-vlan`, `03-data-link/04-stp`, `16-datacenter-cloud-sdn/02-overlay-vxlan-evpn` (konsep dasar EVPN)
> **Tujuan:** Anda paham cara kerja pseudowire sampai level label dan field FEC, bisa membangun dan men-debug VPWS, VPLS (sinyal LDP maupun BGP), dan EVPN-MPLS di beberapa vendor, mengenali layanan MEF (E-Line, E-LAN, E-Tree), menguasai QinQ/PBB, proteksi ring G.8032, serta memakai Ethernet OAM (CFM dan Y.1731) untuk membuktikan SLA kepada pelanggan.

---

## 1. Kenapa Operator Masih Menjual "Kabel Ethernet Panjang"

Di modul 22.2 Anda membangun L3VPN: operator ikut me-routing trafik pelanggan, PE menyimpan tabel routing pelanggan di VRF. Banyak pelanggan justru **tidak mau** operator ikut campur di Layer 3. Mereka ingin sesuatu yang terasa seperti kabel Ethernet yang sangat panjang: colok di kantor pusat Jakarta, keluar di cabang Surabaya, dan semua yang terjadi di antaranya bukan urusan mereka.

Contoh nyata kebutuhan seperti ini:

- **Bank** menghubungkan ratusan kantor cabang ke dua data center. Tim jaringan bank ingin memegang sendiri routing, firewall, dan pengalamatan, sehingga mereka membeli link Layer 2 dari operator.
- **Operator seluler** membawa trafik BTS dari tower ke titik agregasi (backhaul). Bagi operator seluler, jaringan operator metro hanyalah "pipa Ethernet" berlatensi rendah.
- **Penyedia data center** menyambungkan dua gedung (DCI) agar VLAN yang sama hadir di kedua lokasi.
- **ISP lokal** menyewa link dari operator besar untuk membawa trafik pelanggan dari POP di kota kecil ke POP utama, lalu menjalankan PPPoE atau routing sendiri di atasnya.

| Aspek | L3VPN (22.2) | L2VPN (modul ini) |
|---|---|---|
| Yang dibawa operator | Paket IP pelanggan | Frame Ethernet pelanggan utuh |
| Routing pelanggan | Ikut dipertukarkan dengan PE (PE-CE routing) | Tidak terlihat oleh operator |
| Protokol non-IP | Tidak bisa | Bisa (apa pun di atas Ethernet) |
| Skala per pelanggan | PE menyimpan rute pelanggan | PE menyimpan MAC pelanggan (VPLS/EVPN) atau tidak sama sekali (VPWS) |
| Siapa yang men-debug L3 | Operator dan pelanggan bersama | Pelanggan sendiri |
| Risiko khas | Kebocoran rute antar-VRF | Loop L2, broadcast storm, MTU |

> [!TIP]
> **Sudut pandang yang membantu:** L3VPN menjual *routing*, L2VPN menjual *transport*. Di L2VPN, operator berjanji membawa frame dengan utuh, cepat, dan terukur. Itulah sebabnya bagian OAM dan SLA di modul ini sama pentingnya dengan konfigurasi.

---

## 2. Bahasa Bersama: Model Layanan MEF

Sebelum masuk ke protokol, kenali bahasa yang dipakai di kontrak dan RFP. **MEF** (dulu Metro Ethernet Forum) mendefinisikan layanan Carrier Ethernet secara vendor-netral. Sales, tim pengadaan pelanggan, dan engineer operator memakai istilah ini.

### Komponen dasar

```
  Pelanggan A                 Jaringan operator                 Pelanggan A
 [CE]──UNI──[PE]═══════════════ EVC ═══════════════[PE]──UNI──[CE]
             │                                       │
             └── batas tanggung jawab operator ──────┘

 UNI  : User Network Interface, port fisik tempat pelanggan menyambung
 EVC  : Ethernet Virtual Connection, asosiasi antar-UNI yang boleh saling kirim frame
 ENNI : External Network-Network Interface, titik serah antar-operator
 OVC  : Operator Virtual Connection, potongan EVC di dalam satu operator (bila
        layanan melewati lebih dari satu operator)
```

### Tiga (plus satu) jenis layanan

| Tipe MEF | Topologi EVC | Varian port-based | Varian VLAN-based | Teknologi yang umum dipakai |
|---|---|---|---|---|
| **E-Line** | Titik-ke-titik | EPL (Ethernet Private Line) | EVPL (Ethernet Virtual Private Line) | VPWS (pseudowire), EVPN-VPWS |
| **E-LAN** | Banyak-ke-banyak | EP-LAN | EVP-LAN | VPLS, EVPN |
| **E-Tree** | Root-ke-leaf (leaf tidak saling bicara) | EP-Tree | EVP-Tree | VPLS dengan split horizon khusus, EVPN E-Tree (RFC 8317) |
| **E-Access** | Akses antar-operator melalui ENNI | Access EPL | Access EVPL | Pseudowire atau S-VLAN di ENNI |

**Port-based** (EPL, EP-LAN) berarti seluruh port UNI milik satu layanan; semua frame, ber-tag atau tidak, dibawa apa adanya. **VLAN-based** (EVPL, EVP-LAN) berarti satu port UNI bisa membawa beberapa layanan, dipisah berdasarkan VLAN pelanggan (CE-VLAN ID).

### Bandwidth profile

Kontrak MEF menyebut kecepatan dengan empat angka, bukan satu:

| Parameter | Arti |
|---|---|
| **CIR** (Committed Information Rate) | Laju yang dijamin, dikirim dengan SLA |
| **CBS** (Committed Burst Size) | Besar burst yang boleh melewati CIR sesaat |
| **EIR** (Excess Information Rate) | Laju tambahan "kalau ada kapasitas", tanpa jaminan SLA |
| **EBS** (Excess Burst Size) | Burst untuk bagian excess |

Frame diwarnai: **hijau** (dalam CIR, dijamin), **kuning** (dalam EIR, boleh dibuang saat padat), **merah** (melebihi keduanya, dibuang). Ini adalah policer dua-laju tiga-warna yang sudah Anda kenal di `11-wan-vpn/03-qos`.

> [!WARNING]
> **Salah paham yang sering terjadi di lapangan:** pelanggan membeli "Metro-E 100 Mbps" dan mengukur 100 Mbps dengan speedtest, padahal kontraknya CIR 50 Mbps + EIR 50 Mbps. Saat jam sibuk, bagian EIR dibuang dan pelanggan mengira link rusak. Selalu baca dan jelaskan bandwidth profile secara eksplisit.

### Atribut yang diukur dalam SLA

MEF mendefinisikan atribut kinerja yang nantinya Anda ukur dengan Y.1731 (§10): **Frame Delay** (latensi satu arah atau dua arah), **Frame Delay Variation** (jitter), **Frame Loss Ratio**, dan **Availability**. Simpan daftar ini; ia menjadi jembatan antara kontrak dan perintah `show` di router.

---

## 3. Pseudowire: Fondasi Semua L2VPN Berbasis MPLS

### Model PWE3

Pseudowire (PW) adalah emulasi sebuah sirkuit Layer 2 di atas jaringan paket (PSN, *packet switched network*). Arsitekturnya dibakukan kelompok kerja IETF PWE3, dan sinyalnya lewat LDP didefinisikan di **RFC 8077** (yang menggantikan RFC 4447).

```
  [CE1]──AC──[PE1]════════════ PSN tunnel (LSP LDP/RSVP/SR) ═══════════[PE2]──AC──[CE2]
                 ╲_________________ Pseudowire (PW) ____________________╱

 AC  = Attachment Circuit: port, sub-interface, atau VLAN yang menghadap pelanggan
 PW  = koneksi logis PE1 ↔ PE2, diidentifikasi oleh PW label
 PSN tunnel = LSP biasa di core (dari 22.1), bisa dipakai bersama banyak PW
```

### Tumpukan label

Frame pelanggan di core MPLS membawa dua label:

```
 ┌──────────────┬──────────────┬──────────────┬─────────────────────────────┐
 │ Label luar   │ Label PW     │ Control word │ Frame Ethernet pelanggan    │
 │ (transport)  │ (S-bit = 1)  │ (opsional,   │ (tanpa preamble dan FCS)    │
 │ ke PE tujuan │ pilih PW di  │  4 byte)     │                             │
 │ diganti P    │ PE tujuan    │              │                             │
 └──────────────┴──────────────┴──────────────┴─────────────────────────────┘
   4 byte         4 byte         0 atau 4 byte
```

- **Label luar (transport)** didapat dari LDP/RSVP/SR biasa menuju loopback PE tujuan. Router P hanya melihat label ini. Dengan PHP, label ini dilepas di hop terakhir sebelum PE tujuan.
- **Label PW** dialokasikan oleh PE **tujuan** dan dikirim ke PE asal lewat sesi LDP *targeted*. Label inilah yang memberi tahu PE tujuan: "frame ini milik pelanggan X, keluarkan ke AC Y."
- **Control word** (RFC 4385) adalah 4 byte opsional di antara label dan payload. Empat bit pertamanya selalu `0000`.

### Kenapa control word penting

Banyak router P melakukan load balancing ECMP dengan "mengintip" byte setelah label terakhir. Kalau nibble pertama `4`, router menebak itu paket IPv4; kalau `6`, IPv6. Masalahnya, payload PW adalah frame Ethernet, dan byte pertama frame Ethernet adalah alamat MAC tujuan. MAC yang diawali `4` atau `6` (misalnya `4c:...` atau `60:...`) akan **disangka paket IP**, di-hash dengan field yang salah, dan frame dari satu aliran bisa tersebar ke jalur berbeda sehingga **tiba tidak berurutan**.

Control word yang diawali `0000` mencegah tebakan itu. Ia juga membawa nomor urut (opsional) dan field panjang untuk frame pendek yang di-padding.

```
 Control word (RFC 4385):
  0                   1                   2                   3
  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |0 0 0 0| Flags |FRG|  Length   |       Sequence Number         |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

> [!TIP]
> **Aturan praktis:** aktifkan control word bila kedua sisi mendukung, terutama jika core memakai ECMP. Kedua PE harus sepakat (bit **C** di FEC). Bila satu sisi meminta dan sisi lain tidak, RFC 8077 mengatur negosiasinya, tetapi dalam praktik ketidakcocokan ini adalah salah satu penyebab PW gagal naik antar-vendor. Untuk load balancing yang lebih baik, banyak operator juga memakai **flow label** (FAT-PW, RFC 6391), label ketiga berisi hash aliran.

### Sinyal LDP: FEC 128 (PWid)

PE saling membangun sesi **LDP targeted** (hello unicast ke loopback lawan, UDP/TCP 646), karena kedua PE tidak bertetangga langsung. Lalu masing-masing mengirim *Label Mapping* berisi **PWid FEC Element** (tipe `0x80`, sehingga sering disebut "FEC 128"):

```
  0                   1                   2                   3
  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |  PWid (0x80)  |C|         PW type             |PW info length |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                          Group ID                             |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                           PW ID                               |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 |                Interface Parameter Sub-TLV                    |
 +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
                                          (sumber: RFC 8077 §6.1)
```

| Field | Isi | Yang harus cocok di kedua PE |
|---|---|---|
| **C** | 1 = pakai control word | Ya (atau dinegosiasikan) |
| **PW type** | `0x0005` Ethernet (raw), `0x0004` Ethernet tagged, dan lain-lain | **Ya** |
| **Group ID** | Pengelompokan PW, misalnya per port, untuk withdraw massal | Tidak |
| **PW ID** | Nomor PW 32-bit, sering disebut **VC ID** | **Ya**, inilah kunci pencocokan |
| **Interface MTU** (sub-TLV) | MTU AC tanpa overhead | **Ya**: RFC 8077 menulis "If this parameter does not match in both directions of a specific PW, that PW MUST NOT be enabled." |

Alur sinyalnya:

```
 PE1 (10.255.0.1)                                        PE2 (10.255.0.2)
   │ ── Targeted Hello (UDP 646) ─────────────────────────────▶ │
   │ ◀──────────────────────────────── Targeted Hello ───────── │
   │ ══ Sesi TCP 646, Initialization, KeepAlive ═══════════════ │
   │ ── Label Mapping {FEC 128: PW ID 100, type 5, MTU 1500,    │
   │                   C=1}, label = 16 ──────────────────────▶ │  PE2 mencatat: kirim ke
   │                                                            │  PE1 dengan label PW 16
   │ ◀── Label Mapping {FEC 128: PW ID 100, type 5, MTU 1500,   │
   │                    C=1}, label = 16 ──────────────────     │  PE1 mencatat: kirim ke
   │                                                            │  PE2 dengan label PW 16
   │  PW UP bila PW ID, PW type, MTU (dan C) cocok di kedua arah │
```

Label PW di kedua arah boleh bernilai sama (seperti di contoh, keduanya 16) karena setiap PE mengalokasikan dari ruang labelnya sendiri.

### FEC 129 (Generalized PWid)

FEC 129 mengganti satu angka PW ID dengan pengenal yang lebih terstruktur: **AGI** (Attachment Group Identifier, biasanya identitas VPN), **SAII** dan **TAII** (pengenal ujung sumber dan tujuan). FEC 129 berguna bila PE ditemukan otomatis, misalnya VPLS dengan BGP auto-discovery (RFC 6074) dan sinyal LDP. Untuk VPWS manual, FEC 128 tetap yang paling umum.

### Status PW

Selain *Label Withdraw*, PE memberi tahu kondisi PW lewat **PW Status TLV** (tipe `0x096A`) di pesan Notification. Isinya bit-field, misalnya "Pseudowire Not Forwarding", kegagalan AC sisi lokal (Rx/Tx), atau kegagalan sisi PSN. Inilah alasan `show` di router bisa menampilkan "AC down di sisi remote": PE lawan mengirimkan status itu, bukan menarik labelnya.

### Hitung MTU dengan benar

```
 Frame pelanggan (tanpa FCS)      : 1500 (payload) + 14 (header Ethernet) = 1514
 + tag VLAN pelanggan (bila ada)  : + 4  → 1518
 + control word                   : + 4  → 1522
 + label PW + label transport     : + 8  → 1530
 = MTU MPLS minimal di link core  : ≥ 1530 byte (lebih bila ada label TE/SR tambahan)
```

> [!WARNING]
> **Dua MTU berbeda, dua gejala berbeda.** (1) **MTU AC** yang diiklankan di FEC harus sama di kedua PE; kalau berbeda, PW **tidak pernah naik** (gejalanya terang-terangan). (2) **MTU link core** yang terlalu kecil membuat PW tetap UP, ping kecil lancar, tetapi frame besar **hilang diam-diam**. Gejala kedua jauh lebih menyesatkan. Praktik operator: MTU core 9000 atau setidaknya beberapa puluh byte di atas MTU layanan terbesar.

---

## 4. VPWS: Layanan E-Line

**VPWS** (Virtual Private Wire Service) adalah PW titik-ke-titik yang menyambungkan dua AC. PE **tidak mempelajari MAC**: setiap frame dari AC langsung dibungkus dan dikirim ke PE lawan. Itulah yang membuat VPWS sederhana, cepat, dan cocok untuk E-Line.

### Cisco IOS XR

```
interface GigabitEthernet0/0/0/1.100 l2transport
 encapsulation dot1q 100
 rewrite ingress tag pop 1 symmetric      ! lepas tag 100 sebelum masuk PW
!
l2vpn
 pw-class PW-CW
  encapsulation mpls
   control-word
 !
 xconnect group PELANGGAN-A
  p2p BANK-JKT-SBY
   interface GigabitEthernet0/0/0/1.100
   neighbor ipv4 10.255.0.2 pw-id 100
    pw-class PW-CW
```

```
RP/0/RP0/CPU0:PE1# show l2vpn xconnect
RP/0/RP0/CPU0:PE1# show l2vpn xconnect detail          ← label lokal/remote, MTU, control word
RP/0/RP0/CPU0:PE1# show mpls ldp neighbor 10.255.0.2   ← sesi targeted harus ada
```

Kolom yang Anda cari di `show l2vpn xconnect`: status grup **UP**, segmen 1 (AC) **UP**, segmen 2 (PW ke 10.255.0.2, PW ID 100) **UP**. Bila AC UP tetapi PW DN, lanjutkan ke `detail` dan periksa MTU, PW type, serta label remote.

### Cisco IOS XE (gaya `interface pseudowire`)

```
interface pseudowire100
 encapsulation mpls
 neighbor 10.255.0.2 100
!
interface GigabitEthernet0/0/1
 service instance 100 ethernet
  encapsulation dot1q 100
  rewrite ingress tag pop 1 symmetric
!
l2vpn xconnect context BANK-JKT-SBY
 member pseudowire100
 member GigabitEthernet0/0/1 service-instance 100
```

IOS XE lama juga menerima gaya ringkas `xconnect 10.255.0.2 100 encapsulation mpls` langsung di bawah interface atau service instance. Verifikasi: `show l2vpn atom vc`, `show l2vpn atom vc detail`, `show mpls l2transport vc`.

### Juniper Junos (l2circuit)

```
set interfaces ge-0/0/1 flexible-vlan-tagging
set interfaces ge-0/0/1 encapsulation flexible-ethernet-services
set interfaces ge-0/0/1 unit 100 encapsulation vlan-ccc
set interfaces ge-0/0/1 unit 100 vlan-id 100
set protocols ldp interface lo0.0                       ← agar menerima targeted LDP
set protocols l2circuit neighbor 10.255.0.2 interface ge-0/0/1.100 virtual-circuit-id 100
set protocols l2circuit neighbor 10.255.0.2 interface ge-0/0/1.100 control-word
```

Verifikasi: `show l2circuit connections` (cari status **Up**; bila tidak, kode status singkat di kolom status dijelaskan di legenda pada bagian atas output, termasuk untuk ketidakcocokan MTU dan encapsulation), `show ldp neighbor`, `show ldp database`.

### MikroTik RouterOS v7

RouterOS tidak punya objek "VPWS" terpisah. Pola yang dipakai adalah interface `vpls` dengan **satu** peer, dijembatani ke port pelanggan:

```
/interface bridge add name=br-elinea protocol-mode=none
/interface bridge port add bridge=br-elinea interface=ether3
/interface vpls add name=pw-ke-pe2 peer=10.255.0.2 vpls-id=65000:100 \
    bridge=br-elinea pw-control-word=enabled
```

Pada RouterOS 7.24.5, parameter `/interface vpls add` yang relevan adalah `peer`, `vpls-id`, `bridge`, `bridge-horizon`, `pw-type` (`raw-ethernet`, `tagged-ethernet`, `vpls`), `pw-control-word`, `pw-l2mtu`, dan `cisco-static-id` (untuk interop FEC 128 dengan router Cisco). Penulis memeriksanya langsung dengan `/console inspect` di CHR 7.24.5. Detail MPLS RouterOS dibahas di `19-mikrotik/09-mpls-routeros`.

### FRRouting

FRR (`ldpd`) hanya menyediakan objek `l2vpn NAME type vpls`. Satu instance dengan satu `member pseudowire` secara sinyal setara dengan VPWS. Batasannya penting dan dibahas di lab §11: **di Linux, FRR hanya menjalankan control plane PW.**

---

## 5. VPLS: Switch Virtual di Atas MPLS

### Intuisi

VPLS (Virtual Private LAN Service) membuat jaringan operator tampak seperti **satu switch Ethernet raksasa** bagi pelanggan. Di setiap PE ada instance switch virtual (disebut **VSI** atau **VFI**) yang:

- **mempelajari MAC** dari AC lokal dan dari PW,
- **mem-flood** frame broadcast, multicast, dan unknown unicast (BUM) ke semua PW dan AC lain,
- **meneruskan** unicast yang MAC-nya sudah dikenal ke satu PW atau AC.

```
            PE1 [VSI-B]──────PW──────[VSI-B] PE2
             │  ╲                     ╱  │
          CE1   PW                  PW   CE2
                  ╲               ╱
                   [VSI-B] PE3
                      │
                     CE3
   Full mesh PW antar-PE: n PE butuh n(n-1)/2 PW per instance VPLS
```

### Split horizon: pengganti STP di core

Karena PW membentuk full mesh, loop sangat mungkin. VPLS tidak menjalankan STP di core. Ia memakai aturan sederhana dari RFC 4762: **frame yang diterima dari sebuah PW core tidak boleh diteruskan ke PW core lain**, hanya ke AC lokal. Karena setiap PE sudah punya PW langsung ke setiap PE lain (full mesh), aturan ini tidak mengurangi jangkauan, tetapi menghapus kemungkinan loop di core.

Konsekuensinya: **full mesh itu wajib**. Bila satu PW antara PE2 dan PE3 putus, CE2 dan CE3 tidak bisa saling bicara walau keduanya masih terhubung ke PE1, karena PE1 dilarang meneruskan frame dari PW ke PW.

> [!WARNING]
> Split horizon hanya melindungi **core**. Loop di sisi pelanggan (misalnya pelanggan menyambung dua cabang lewat jalur cadangan sendiri) tetap bisa membuat broadcast storm di seluruh VPLS. Operator biasanya memasang storm control dan batas MAC per AC.

### MAC withdrawal

Saat topologi pelanggan berubah (misalnya CE dual-homed pindah ke link cadangan), MAC yang dipelajari PE lain menjadi basi. RFC 4762 mendefinisikan pesan **MAC Address Withdraw** lewat LDP agar PE lain membuang MAC terkait dan belajar ulang, alih-alih menunggu aging timer (umumnya 300 detik).

### Dua cara sinyal

| Aspek | **VPLS sinyal LDP** (RFC 4762, "Martini") | **VPLS sinyal BGP** (RFC 4761, "Kompella") |
|---|---|---|
| Penemuan PE anggota | Manual: setiap PE dikonfigurasi daftar neighbor | Otomatis lewat BGP (route target) |
| Distribusi label | LDP targeted, satu Label Mapping per PW | BGP, satu **label block** per PE |
| Menambah PE ke-n+1 | Ubah konfigurasi di **semua** n PE lain | Konfigurasi hanya di PE baru |
| Skala sesi | Sesi LDP targeted full mesh antar-PE | Sesi BGP ke route reflector |
| Identitas situs | VPLS ID / PW ID | VE ID (site ID) unik per PE |
| Varian hibrida | BGP auto-discovery + sinyal LDP FEC 129 (RFC 6074) | |

**Label block** (RFC 4761 §3.2.1) adalah trik cerdas: setiap PE mengiklankan satu blok label `{LB, LB+1, ..., LB+VBS-1}`. PE penerima dengan VE ID tertentu menghitung label untuk mengirim ke PE pengiklan dengan menjumlahkan VE ID-nya ke label base (dengan memperhitungkan offset). Satu UPDATE BGP melayani semua PE lain, alih-alih satu pesan per PW.

### H-VPLS: memecah full mesh

Full mesh antar-PE membengkak cepat: 50 PE berarti 1.225 PW per instance VPLS. **H-VPLS** (Hierarchical VPLS, RFC 4762 §10) membagi PE menjadi dua peran:

```
                 ┌──────── full mesh PW (hub) ────────┐
              [PE-rs 1]════════[PE-rs 2]════════[PE-rs 3]
               ╱    ╲              │
        spoke PW   spoke PW     spoke PW
             ╱        ╲            │
       [MTU-s A]   [MTU-s B]   [MTU-s C]       ← switch akses di gedung/area
          │            │           │
         CE           CE          CE
```

- **PE-rs** (routing and switching) di core membentuk full mesh dan menerapkan split horizon antar-PW mesh.
- **MTU-s** (multi-tenant unit switch) di akses hanya punya **spoke PW** (atau S-VLAN QinQ) ke satu atau dua PE-rs.
- Frame dari spoke **boleh** diteruskan ke PW mesh, dan sebaliknya. Split horizon hanya berlaku antar-PW mesh.

Hasilnya, perangkat akses yang murah tidak perlu tahu seluruh PE, dan full mesh hanya ada di antara sedikit PE-rs.

### Konfigurasi VPLS

**Cisco IOS XR, sinyal LDP:**

```
l2vpn
 bridge group PELANGGAN-B
  bridge-domain KANTOR
   interface GigabitEthernet0/0/0/2.200
   !
   vfi VFI-KANTOR
    neighbor 10.255.0.2 pw-id 200
    neighbor 10.255.0.3 pw-id 200
```

**Cisco IOS XR, BGP auto-discovery dan sinyal BGP:**

```
l2vpn
 bridge group PELANGGAN-B
  bridge-domain KANTOR
   interface GigabitEthernet0/0/0/2.200
   vfi VFI-KANTOR
    vpn-id 200
    autodiscovery bgp
     rd auto
     route-target 65000:200
     signaling-protocol bgp
      ve-id 1
!
router bgp 65000
 address-family l2vpn vpls-vpws
 neighbor 10.255.0.100
  address-family l2vpn vpls-vpws
```

Verifikasi: `show l2vpn bridge-domain detail`, `show l2vpn bridge-domain summary`, `show l2vpn forwarding bridge-domain mac-address location 0/0/CPU0`.

**Juniper Junos, sinyal LDP (FEC 128):**

```
set routing-instances VPLS-B instance-type vpls
set routing-instances VPLS-B interface ge-0/0/2.200
set routing-instances VPLS-B protocols vpls vpls-id 200
set routing-instances VPLS-B protocols vpls neighbor 10.255.0.2
set routing-instances VPLS-B protocols vpls neighbor 10.255.0.3
```

**Juniper Junos, sinyal BGP:**

```
set protocols bgp group IBGP family l2vpn signaling
set routing-instances VPLS-B instance-type vpls
set routing-instances VPLS-B interface ge-0/0/2.200
set routing-instances VPLS-B route-distinguisher 10.255.0.1:200
set routing-instances VPLS-B vrf-target target:65000:200
set routing-instances VPLS-B protocols vpls site-range 10
set routing-instances VPLS-B protocols vpls no-tunnel-services
set routing-instances VPLS-B protocols vpls site KANTOR-JKT site-identifier 1
```

Verifikasi: `show vpls connections`, `show vpls mac-table`, `show route table bgp.l2vpn.0`.

**MikroTik RouterOS v7, sinyal LDP (diuji di CHR 7.24.5):**

```
/interface bridge add name=br-pelanggan-b protocol-mode=none
/interface bridge port add bridge=br-pelanggan-b interface=ether3
/interface vpls add name=vpls-ke-pe2 peer=10.255.0.2 vpls-id=65000:100 \
    bridge=br-pelanggan-b bridge-horizon=1
/interface vpls add name=vpls-ke-pe3 peer=10.255.0.3 vpls-id=65000:100 \
    bridge=br-pelanggan-b bridge-horizon=1
```

`bridge-horizon=1` adalah split horizon versi RouterOS: port bridge dengan nilai horizon yang **sama** tidak saling meneruskan frame. Semua PW diberi horizon yang sama; port pelanggan (ether3) tidak diberi horizon.

**MikroTik RouterOS v7, sinyal BGP (diuji di CHR 7.24.5):**

```
/routing bgp instance add name=bgp-core as=65000 router-id=10.255.0.1
/routing bgp connection add name=ibgp-pe2 instance=bgp-core remote.address=10.255.0.2 \
    remote.as=65000 local.address=10.255.0.1 local.role=ibgp afi=l2vpn
/routing bgp vpls add name=pelanggan-b-bgp bridge=br-pelanggan-b bridge-horizon=1 \
    rd=10.255.0.1:100 import-route-targets=65000:100 export-route-targets=65000:100 site-id=1
```

Setelah sesi BGP naik, RouterOS membuat interface VPLS **dinamis** (flag `D`, kolom `BGP-VPLS` terisi) ke setiap PE yang ditemukan. Contoh nyata dari lab penulis:

```
[admin@pe1] > /interface vpls print
Flags: X - DISABLED, R - RUNNING; D - DYNAMIC
Columns: NAME, PEER, VPLS-ID, BGP-VPLS
#    NAME         PEER        VPLS-ID    BGP-VPLS
0 X  vpls-ke-pe2  10.255.0.2  65000:100
1 X  vpls-ke-pe3  10.255.0.3  65000:100
2 RD vpls1        10.255.0.2             pelanggan-b-bgp
3 RD vpls2        10.255.0.3             pelanggan-b-bgp
```

Dua baris pertama adalah PW LDP yang dinonaktifkan; dua baris berikutnya dibangun otomatis dari sinyal BGP.

---

## 6. EVPN-MPLS: Pengganti VPLS

Konsep EVPN (MP-BGP sebagai control plane untuk MAC dan IP) sudah dikenalkan di `16-datacenter-cloud-sdn/02-overlay-vxlan-evpn` dalam konteks VXLAN. Bagian ini tidak mengulangnya. Fokusnya adalah **EVPN dengan data plane MPLS** (RFC 7432) di jaringan operator, dan kenapa operator memindahkan layanan E-LAN dari VPLS ke EVPN.

### Masalah VPLS yang dijawab EVPN

| Masalah di VPLS | Jawaban EVPN |
|---|---|
| MAC dipelajari di **data plane** (flood lalu belajar), lambat dan boros | MAC diiklankan lewat **BGP** (route type 2), PE lain langsung tahu |
| Multihoming CE ke dua PE hanya bisa **active/standby**, sering butuh protokol tambahan | **All-active** multihoming dengan Ethernet Segment (ESI) |
| Kegagalan link CE-PE membuat ribuan MAC basi | **Mass withdrawal**: satu route type 1 ditarik, semua MAC di segmen itu ikut tidak valid |
| Tidak ada load balancing per-aliran ke CE dual-homed | **Aliasing**: PE remote bisa membagi trafik ke kedua PE meski hanya satu yang mengiklankan MAC |
| Full mesh PW harus dirawat | Tidak ada PW. Reachability ditentukan BGP dan label MPLS |
| Integrasi L2/L3 kikuk | IRB terpadu, MAC+IP dalam satu rute, ARP/ND proxy |

### Route type yang perlu dihafal (RFC 7432)

| Tipe | Nama | Isi utama | Dipakai untuk |
|---|---|---|---|
| **1** | Ethernet Auto-Discovery (A-D) | ESI, Ethernet Tag, label | Mass withdrawal (per-ES), aliasing dan backup path (per-EVI) |
| **2** | MAC/IP Advertisement | MAC, IP opsional, label | Mengumumkan host; menggantikan flood-and-learn |
| **3** | Inclusive Multicast Ethernet Tag | IP PE asal, PMSI tunnel attribute | Membangun pohon BUM (biasanya ingress replication) |
| **4** | Ethernet Segment | ESI, IP PE | Menemukan PE lain di segmen yang sama, dasar **pemilihan DF** |

Route type 5 (IP Prefix, RFC 9136) dipakai untuk layanan L3 dan sudah disebut di 16.2.

### Multihoming: ESI dan Designated Forwarder

```
                    ┌───── PE1 ─────┐
   CE (LAG ke 2 PE)─┤   ESI 00:11:22:33:44:55:66:77:88:99
                    └───── PE2 ─────┘
```

- **ESI** (Ethernet Segment Identifier, 10 byte) mengidentifikasi sekumpulan link dari satu CE ke beberapa PE. Kedua PE mengonfigurasi ESI yang sama.
- **Designated Forwarder (DF):** hanya satu PE per segmen per VLAN yang boleh mengirim trafik **BUM** ke CE, agar CE tidak menerima duplikat. Pemilihan default RFC 7432 memakai modulo: urutkan IP PE pada segmen, lalu DF untuk VLAN V adalah PE ke-(V mod N).
- **Split horizon dengan ESI label:** saat PE1 mem-flood BUM dari CE ke PE2, ia menyertakan label ESI. PE2 melihat label itu dan **tidak** mengirim frame kembali ke CE yang sama.
- **Mode:** *all-active* (kedua PE meneruskan unicast, CE memakai LAG) atau *single-active* (satu PE aktif per VLAN, cocok bila CE tidak bisa LAG).

### MAC mobility

Bila sebuah MAC pindah dari belakang PE1 ke belakang PE3, PE3 mengiklankan route type 2 dengan **MAC Mobility extended community** bernomor urut lebih tinggi. Semua PE memilih iklan dengan nomor urut tertinggi. Bila nomor urut naik terlalu sering dalam waktu singkat, implementasi menganggapnya duplikat MAC (sering tanda loop) dan menahan MAC itu.

### EVPN-VPWS

EVPN juga bisa menggantikan pseudowire LDP untuk E-Line (RFC 8214). Tidak ada sesi LDP targeted; kedua PE mengiklankan route type 1 per-EVI dengan pengenal ujung lokal dan remote. Keuntungannya: satu control plane (BGP) untuk E-Line dan E-LAN, plus multihoming yang sama.

### Konfigurasi ringkas

**Cisco IOS XR, EVPN E-LAN:**

```
evpn
 evi 300
  bgp
   route-target import 65000:300
   route-target export 65000:300
  !
 interface Bundle-Ether10
  ethernet-segment
   identifier type 0 00.11.22.33.44.55.66.77.88
   load-balancing-mode single-active        ! hapus untuk all-active (default)
!
l2vpn
 bridge group EVPN
  bridge-domain BD-300
   interface Bundle-Ether10.300
   evi 300
!
router bgp 65000
 address-family l2vpn evpn
 neighbor 10.255.0.100
  remote-as 65000
  update-source Loopback0
  address-family l2vpn evpn
```

**Cisco IOS XR, EVPN-VPWS:**

```
l2vpn
 xconnect group EVPN-VPWS
  p2p BANK-JKT-SBY
   interface GigabitEthernet0/0/0/1.100
   neighbor evpn evi 100 target 2 source 1
```

**Juniper Junos, EVPN-MPLS:**

```
set protocols bgp group IBGP family evpn signaling
set routing-instances EVPN-300 instance-type evpn
set routing-instances EVPN-300 vlan-id 300
set routing-instances EVPN-300 interface ge-0/0/2.300
set routing-instances EVPN-300 route-distinguisher 10.255.0.1:300
set routing-instances EVPN-300 vrf-target target:65000:300
set routing-instances EVPN-300 protocols evpn
```

Verifikasi: IOS XR `show evpn evi detail`, `show evpn ethernet-segment detail` (lihat DF yang terpilih), `show bgp l2vpn evpn`; Junos `show evpn instance extensive`, `show route table EVPN-300.evpn.0`.

**MikroTik dan FRR:** di RouterOS 7.24.5, `/routing bgp evpn` hanya punya parameter `vni`, `rd`, `import.route-targets`, `export.route-targets`, dan `vrf`, artinya EVPN di RouterOS memakai **VXLAN**, bukan MPLS. FRR di Linux juga memakai VXLAN sebagai data plane EVPN (dokumentasi FRR, bagian "The Linux (VXLAN) Dataplane"). Untuk praktik EVPN-MPLS sungguhan Anda butuh IOS XR, Junos, atau Nokia SR OS/SR Linux, dan di sinilah batas lab gratis (lihat §11).

> [!TIP]
> **Migrasi VPLS ke EVPN** biasanya dilakukan per layanan: bangun instance EVPN berdampingan, pindahkan AC satu per satu pada jendela pemeliharaan, lalu bongkar VFI lama. Beberapa vendor mendukung interworking VPLS-EVPN pada PE yang sama (RFC 8560) agar migrasi bertahap tidak memutus situs lain.

---

## 7. QinQ (802.1ad) dan PBB (802.1ah)

Tidak semua Carrier Ethernet berjalan di atas MPLS. Jaringan akses dan metro yang murni Ethernet memakai penumpukan tag.

### QinQ: tag di atas tag

```
 Frame pelanggan:   [DA | SA | 0x8100 C-VID 10 | Type | Payload]
 Setelah masuk operator (port UNI):
                    [DA | SA | 0x88A8 S-VID 500 | 0x8100 C-VID 10 | Type | Payload]
                              └─ S-tag (service, milik operator)
```

- **C-tag** (customer tag) memakai TPID `0x8100` milik pelanggan, dibawa tanpa diubah.
- **S-tag** (service tag) memakai TPID `0x88A8` (802.1ad). Beberapa perangkat lama memakai `0x9100` atau bahkan `0x8100` untuk S-tag; ketidakcocokan TPID di titik serah antar-operator adalah masalah interop klasik.
- Satu S-VLAN = satu pelanggan atau satu layanan. Batas tetap 4094 S-VLAN per domain, sehingga QinQ cocok untuk metro skala kota, bukan nasional.

### Manipulasi tag VLAN

SPCOR menyebut "VLAN tag manipulation" secara eksplisit. Operasi yang perlu Anda kenali:

| Operasi | Arti | Contoh pemakaian |
|---|---|---|
| **push** | Tambahkan tag | Bungkus frame pelanggan dengan S-tag di UNI |
| **pop** | Buang tag terluar | Lepas tag sebelum frame masuk PW yang raw |
| **translate 1-to-1** | Ganti nilai VLAN | Pelanggan memakai VLAN 10, operator di sisi lain butuh VLAN 210 |
| **translate 1-to-2 / 2-to-1** | Ganti satu tag dengan dua, atau sebaliknya | Titik serah ENNI |
| **symmetric** | Operasi kebalikan diterapkan otomatis di arah keluar | Hampir selalu yang Anda inginkan |

```
! IOS XR: lepas tag pelanggan saat masuk, pasang kembali saat keluar
interface GigabitEthernet0/0/0/1.100 l2transport
 encapsulation dot1q 100
 rewrite ingress tag pop 1 symmetric

! IOS XR: terjemahkan VLAN 100 pelanggan menjadi VLAN 2100
interface GigabitEthernet0/0/0/1.101 l2transport
 encapsulation dot1q 101
 rewrite ingress tag translate 1-to-1 dot1q 2101 symmetric
```

```
# Junos: sub-interface dengan dua tag (S-VLAN 500, C-VLAN 10)
set interfaces ge-0/0/3 stacked-vlan-tagging
set interfaces ge-0/0/3 encapsulation extended-vlan-bridge
set interfaces ge-0/0/3 unit 10 vlan-tags outer 500 inner 10
```

```
# RouterOS v7: interface S-VLAN (use-service-tag=yes memakai TPID 0x88A8)
/interface vlan add name=svlan500 interface=ether2 vlan-id=500 use-service-tag=yes
/interface vlan add name=cvlan10 interface=svlan500 vlan-id=10

# RouterOS v7: bridge VLAN filtering dengan TPID S-tag
/interface bridge set br1 vlan-filtering=yes ether-type=0x88a8
```

Di RouterOS 7.24.5, `ether-type` bridge menerima `0x8100`, `0x88a8`, atau `0x9100` (diperiksa dengan `/console inspect`). QinQ di switch CRS dibahas di `19-mikrotik/11-crs-switching`.

### PBB: MAC-in-MAC

QinQ tetap membuat switch operator mempelajari **MAC pelanggan**. Ribuan pelanggan berarti jutaan MAC di tabel switch core. **PBB** (Provider Backbone Bridging, 802.1ah) membungkus seluruh frame pelanggan dengan header Ethernet baru milik operator:

```
 [B-DA | B-SA | 0x88A8 B-VID | 0x88E7 I-SID (24 bit) | DA | SA | S-tag | C-tag | Payload]
  └──── backbone, milik operator ────┘ └ instance service ┘ └── frame pelanggan utuh ──┘
```

- **B-DA/B-SA:** alamat MAC switch tepi backbone (BEB). Switch core hanya mempelajari alamat ini.
- **I-SID:** pengenal layanan 24 bit, sekitar 16 juta layanan, mirip VNI di VXLAN.
- **B-VID:** VLAN backbone untuk memisahkan topologi.

PBB murni kini jarang dibangun baru. Gagasannya hidup di **PBB-EVPN** (RFC 7623), yang memakai EVPN untuk mengiklankan B-MAC saja sehingga control plane tidak perlu tahu MAC pelanggan. QinQ dan PBB kini juga sudah dilebur ke dalam standar induk IEEE 802.1Q.

---

## 8. Proteksi Ring: ITU-T G.8032 (ERPS)

### Kenapa ring, dan kenapa bukan STP

Fiber metro di kota-kota Indonesia sering digelar mengikuti jalan dan membentuk **ring**: dari POP, kabel mengitari beberapa gedung atau kelurahan lalu kembali. Ring memberi dua jalur ke setiap node dengan biaya fiber yang masuk akal. Masalahnya, ring Ethernet adalah loop.

STP klasik butuh puluhan detik untuk konvergen dan RSTP pun tidak dirancang untuk target waktu tertentu di ring besar. **G.8032 Ethernet Ring Protection Switching (ERPS)** dirancang khusus untuk ring, dengan sasaran pemulihan di bawah 50 ms untuk ring hingga 16 node dan keliling fiber hingga 1.200 km (sasaran yang dinyatakan rekomendasi ITU-T G.8032).

### Mekanisme

```
         [A]────────[B]
          │           │
   RPL ── ╳           │       ← Ring Protection Link: link yang SENGAJA diblokir
  (owner [F])         │         saat kondisi normal, agar ring tidak loop
          │           │
         [E]────[D]──[C]

 Normal (Idle)  : RPL diblokir oleh RPL owner. Trafik mengalir lewat sisi lain.
 Link C-D putus : C dan D memblokir port yang gagal, mengirim R-APS(SF)
                  ke seluruh ring → RPL owner membuka RPL → semua node flush FDB.
 Link pulih     : node mengirim R-APS(NR); RPL owner menunggu WTR timer
                  (default 5 menit) lalu memblokir RPL kembali (mode revertive).
```

| Istilah | Arti |
|---|---|
| **RPL** (Ring Protection Link) | Link yang diblokir saat normal |
| **RPL owner** | Node yang memblokir dan membuka RPL |
| **RPL neighbor** | Node di ujung lain RPL, ikut memblokir (opsional, mempercepat) |
| **R-APS** | Pesan kontrol ring (Ring Automatic Protection Switching), dikirim di VLAN khusus (R-APS channel). Formatnya memakai PDU Y.1731 dengan OpCode 40 |
| **SF / NR / NR-RB** | Signal Fail, No Request, No Request RPL Blocked |
| **WTR timer** | Wait-to-Restore: tunggu sebelum kembali ke kondisi normal, mencegah flapping |
| **Guard timer** | Abaikan R-APS lama sesaat setelah perubahan, mencegah keputusan dari pesan basi |
| **Hold-off timer** | Tunda pelaporan kegagalan, memberi waktu proteksi lapisan bawah (misalnya optik) bekerja dulu |
| **Sub-ring** (G.8032v2) | Ring tambahan yang menempel ke ring utama lewat interconnection node, untuk topologi tangga |

Deteksi kegagalan link biasanya dari status fisik port, atau dari CFM CCM (§9) bila ada perangkat transmisi di tengah yang menyembunyikan link down.

### Contoh konfigurasi Cisco IOS XR (ringkas)

```
l2vpn
 ethernet ring g8032 RING-METRO-1
  port0 interface TenGigE0/0/0/0
  port1 interface TenGigE0/0/0/1
  instance 1
   profile ERPS-DEFAULT
   rpl port0 owner
   inclusion-list vlan-ids 100-200
   aps-channel
    port0 interface TenGigE0/0/0/0.10
    port1 interface TenGigE0/0/0/1.10
```

Verifikasi umumnya lewat `show ethernet ring g8032 status` dan `show ethernet ring g8032 brief`. Junos mengonfigurasi ERPS di bawah `protocols protection-group ethernet-ring`.

> [!WARNING]
> **Kejujuran tentang lab:** penulis tidak menemukan cara gratis dan terverifikasi untuk mempraktikkan G.8032. FRR dan kernel Linux tidak mengimplementasikannya, dan RouterOS 7.24.5 di CHR tidak menampilkan menu ERPS atau CFM sama sekali (diperiksa lewat `/console inspect` pada pohon perintah tingkat atas). Pelajari G.8032 dari rekomendasi ITU-T dan dokumentasi vendor, lalu praktikkan di perangkat fisik atau lab vendor bila tersedia.

---

## 9. Ethernet OAM: CFM (802.1ag) dan Y.1731

Di jaringan IP Anda punya `ping` dan `traceroute`. Di layanan Layer 2 milik pelanggan, operator **tidak punya alamat IP** di dalam layanan itu. Ethernet OAM mengisi kekosongan ini: memantau, menguji, dan mengukur layanan pada Layer 2.

### Hierarki pemeliharaan

```
 Level 7-5 : Customer       ┌────────────── MEP pelanggan ──────────────┐
 Level 4-3 : Service/Provider    ┌──── MEP operator (UNI ke UNI) ────┐
 Level 2-0 : Operator/Link          ┌─ MEP per segmen operator ─┐
                [CE]──[PE-A]──[P]──[P]──[PE-B]──[CE]
```

| Istilah | Arti |
|---|---|
| **MD** (Maintenance Domain) | Wilayah tanggung jawab satu organisasi, diberi **level 0-7** |
| **MA** (Maintenance Association) | Satu layanan di dalam MD, misalnya satu EVC |
| **MEP** (Maintenance End Point) | Titik ujung yang **membangkitkan dan menghentikan** pesan OAM pada level-nya |
| **MIP** (Maintenance Intermediate Point) | Titik tengah yang **menjawab** loopback dan linktrace, tetapi tidak membangkitkan CCM |
| **Up MEP / Down MEP** | Up MEP mengirim ke arah dalam perangkat (bridge/relay), cocok untuk memantau layanan ujung ke ujung. Down MEP mengirim langsung keluar port, cocok untuk memantau satu link |

Aturan level: pesan OAM level rendah tidak boleh bocor keluar dari domain level tinggi, dan MEP membuang pesan level lebih rendah dari level-nya sendiri. Pelanggan, operator, dan sub-kontraktor bisa memantau layanan yang sama tanpa saling mengganggu.

### Fungsi CFM (802.1ag)

| Fungsi | Pesan | Analogi IP | Keterangan |
|---|---|---|---|
| **Continuity Check** | CCM (OpCode 1) | Hello protokol routing | Multicast periodik antar-MEP. Interval standar: 3,33 ms, 10 ms, 100 ms, 1 s, 10 s, 1 min, 10 min. Kehilangan CCM selama 3,5 kali interval = **loss of continuity** |
| **Loopback** | LBM/LBR (OpCode 3/2) | `ping` | Unicast ke MEP atau MIP tertentu |
| **Linktrace** | LTM/LTR (OpCode 5/4) | `traceroute` | Menemukan MIP/MEP yang dilalui ke MAC tujuan |
| **RDI** | Bit di dalam CCM | | "Saya tidak menerima CCM dari Anda", memberi tahu ujung jauh tentang kegagalan |

Semua PDU CFM memakai EtherType `0x8902`.

### Tambahan Y.1731 (ITU-T G.8013/Y.1731)

Y.1731 memakai format PDU yang sama dan menambahkan **pengukuran kinerja**, inilah yang menghubungkan OAM ke SLA MEF:

| Fungsi | Pesan | Mengukur |
|---|---|---|
| **ETH-DM** (delay measurement) | 1DM (satu arah, OpCode 45), DMM/DMR (dua arah, OpCode 47/46) | Frame Delay dan Frame Delay Variation |
| **ETH-LM** (loss measurement) | LMM/LMR (OpCode 43/42) | Frame Loss Ratio berdasarkan **penghitung frame layanan sebenarnya** |
| **ETH-SLM** (synthetic loss) | SLM/SLR (OpCode 55/54) | Frame loss berdasarkan **frame sintetis**, lebih mudah diterapkan di layanan multipoint |
| **ETH-AIS** | AIS (OpCode 33) | Memberi tahu level di atasnya bahwa ada kegagalan di bawah, menekan alarm berantai |
| **ETH-LCK** | LCK (OpCode 35) | Menandai layanan sengaja dikunci untuk pengujian |

> [!TIP]
> **DMM satu arah butuh jam tersinkron.** Delay satu arah (1DM) hanya akurat bila kedua ujung sinkron waktu (PTP). Delay dua arah (DMM/DMR) tidak butuh sinkronisasi karena dihitung dari timestamp di satu jam yang sama, dikurangi waktu proses di sisi responder.

### Contoh konfigurasi Cisco IOS XR (ringkas)

```
ethernet cfm
 domain OPERATOR level 4
  service EVC-BANK-100 xconnect group PELANGGAN-A p2p BANK-JKT-SBY
   continuity-check interval 1s
   mep crosscheck
    mep-id 2
!
interface GigabitEthernet0/0/0/1.100 l2transport
 ethernet cfm
  mep domain OPERATOR service EVC-BANK-100 mep-id 1
```

Perintah verifikasi yang lazim: `show ethernet cfm peer meps` dan `show ethernet cfm local maintenance-points`. Uji manual memakai perintah `ping ethernet cfm` dan `traceroute ethernet cfm` dengan argumen domain, service, dan MEP ID tujuan (urutan kata kunci persisnya periksa di dokumentasi rilis Anda). Pengukuran Y.1731 di IOS XR memakai profil `ethernet sla`, misalnya `profile P type cfm-delay-measurement` (DMM) atau `type cfm-synthetic-loss-measurement` (SLM), yang dipasang ke MEP dengan `sla operation profile P target mep-id N`.

Di Junos, CFM dikonfigurasi di bawah `protocols oam ethernet connectivity-fault-management` (maintenance-domain, maintenance-association, mep), dan pengukuran Y.1731 di bawah `performance-monitoring`.

### Link OAM (802.3ah)

Jangan tertukar dengan **EFM OAM** (IEEE 802.3ah, kini bagian 802.3 klausul 57). Ia bekerja hanya pada satu link fisik (tidak melewati bridge), untuk discovery, remote loopback, dan pemantauan error link, misalnya antara NTU di gedung pelanggan dan switch akses operator.

> [!WARNING]
> **Kejujuran tentang lab:** sama seperti G.8032, penulis tidak menemukan implementasi CFM/Y.1731 gratis yang bisa diverifikasi di containerlab dengan FRR atau di RouterOS CHR 7.24.5. Konsep dan konfigurasi di atas ditulis berdasarkan standar dan dokumentasi vendor, bukan hasil lab penulis.

---

## 10. Metro Ethernet di ISP Indonesia (Gambaran Generik)

Bagian ini menggambarkan pola umum yang lazim, bukan desain operator tertentu.

### Arsitektur berlapis

```
   Gedung pelanggan        Akses                 Agregasi              Core
  ┌────────────┐      ┌──────────────┐      ┌──────────────┐     ┌──────────────┐
  │ NTU / CPE  │─UNI─▶│ Switch akses │─────▶│ PE agregasi  │════▶│  P / PE core │
  │ (demarkasi)│      │ di ring fiber│ ring │ (MPLS mulai  │MPLS │ (IS-IS + LDP │
  └────────────┘      │ (QinQ/ERPS   │      │  di sini)    │     │  atau SR)    │
                      │  atau MPLS)  │      └──────────────┘     └──────────────┘
                      └──────────────┘
```

- **Akses:** switch Carrier Ethernet di ring fiber kota. Operator yang lebih tua memakai QinQ plus G.8032. Operator yang lebih baru mendorong MPLS (atau segment routing) sampai ke perangkat akses, sehingga satu control plane dari ujung ke ujung.
- **Agregasi/PE:** titik tempat S-VLAN dari akses dipetakan ke pseudowire, VPLS, EVPN, atau VRF L3VPN.
- **Demarkasi:** NTU atau CPE milik operator di gedung pelanggan, sering mendukung 802.3ah dan Y.1731 agar operator bisa menguji layanan sampai ke titik itu tanpa mengandalkan perangkat pelanggan.

### Produk yang biasa Anda temui

| Nama dagang umum | Pemetaan MEF | Pelanggan khas |
|---|---|---|
| "Metro-E point-to-point", "Ethernet leased line" | E-Line (EPL/EVPL) | Bank, perusahaan multi-cabang, DCI |
| "Metro-E multipoint", "IP-VPN Layer 2" | E-LAN | Kantor pusat plus banyak cabang di satu kota |
| "Backhaul" | E-Line atau E-Tree | Operator seluler, ISP lokal |
| "NNI / wholesale" | E-Access lewat ENNI | ISP lokal yang menyewa akses dari operator jaringan tetap |

### Hal praktis yang sering muncul

- **MTU di sepanjang rantai.** Link radio microwave, perangkat transmisi lama, dan switch akses murah sering berhenti di MTU 1518 atau 1522. Ketika pelanggan menambahkan tag sendiri atau operator menambahkan label, frame besar hilang. Selalu minta dan uji MTU end-to-end saat aktivasi.
- **ISP kecil dengan MikroTik.** Banyak ISP lokal membangun VPLS di atas MikroTik untuk menyambungkan POP-POP mereka, misalnya agar server PPPoE terpusat bisa melayani pelanggan di beberapa kecamatan. Polanya sama dengan lab §12, termasuk pentingnya L2MTU dan `bridge-horizon`.
- **Uji terima (acceptance test).** Pelanggan korporat semakin sering meminta laporan uji saat aktivasi: throughput, latensi, jitter, dan loss pada beberapa ukuran frame. Metodologi yang umum dirujuk adalah ITU-T Y.1564 (uji aktivasi layanan Ethernet) dan RFC 2544 (benchmark perangkat). Laporan ini menjadi dasar bila kelak terjadi sengketa SLA.
- **Regulasi.** Layanan sirkuit sewa termasuk kategori penyelenggaraan jaringan telekomunikasi yang perizinannya diatur pemerintah (saat ini dalam kerangka perizinan berusaha berbasis risiko). Jika Anda membangun layanan untuk pihak lain, pastikan aspek perizinan dicek oleh tim legal, bukan diasumsikan.

---

## 11. Lab A: Sinyal VPLS dengan FRRouting (containerlab)

**Tujuan:** melihat sendiri targeted LDP, pertukaran label PW (FEC 128), status PW, dan dua kegagalan klasik (MTU dan PW ID tidak cocok).

### Kejujuran tentang batas lab ini

Penulis memeriksa kode sumber FRR: fungsi yang memasang PW ke kernel Linux (`netlink_put_pw_update_msg` di `zebra/zebra_mpls_netlink.c`) tidak melakukan apa-apa dan langsung melaporkan sukses. Kernel Linux memang tidak punya data plane pseudowire. Akibatnya:

- **Control plane berjalan penuh:** sesi LDP, label PW, status UP/DOWN, deteksi MTU mismatch.
- **Data plane tidak ada:** ping antar-CE **pasti gagal**. Ini bukan salah konfigurasi Anda.

Untuk data plane VPLS yang sungguhan dengan alat gratis, lanjutkan ke Lab B (MikroTik CHR). Untuk EVPN-MPLS, belum ada pilihan gratis yang penulis bisa verifikasi: tutorial MPLS resmi Nokia SR Linux menyatakan fitur MPLS hanya didukung pada platform 7250 IXR-6e/10e dan 7730 SXR, dan image container yang mengemulasikan platform itu butuh lisensi.

### Topologi

```
   ce1 (192.168.100.1)          ce2 (192.168.100.2)
     │ eth1                        │ eth1
     │ eth2                        │ eth2
    pe1 ──eth1──── p1 ────eth1──── pe2
 10.255.0.1     10.255.0.10      10.255.0.2
                   │ eth3
                   │ eth1
                  pe3 10.255.0.3
                   │ eth2
                  ce3 (192.168.100.3)

 Core: IS-IS level-2 + LDP. Link pe-p memakai /31 (10.0.1.0/31, 10.0.2.0/31, 10.0.3.0/31).
 Layanan: VPLS "PELANGGAN-B", full mesh PW antar-PE, pw-id 100, MTU 1500.
```

Berkas lab ada di `materi/lab/kode/l2vpn/`: `l2vpn.clab.yml`, `daemons`, `vtysh.conf`, dan `pe1/`, `pe2/`, `pe3/`, `p1/` masing-masing berisi `frr.conf`. Image yang dipakai `quay.io/frrouting/frr:10.7.1`.

**Cara penulis memverifikasi:** containerlab butuh root, jadi penulis menjalankan konfigurasi yang sama persis dengan Docker biasa (satu jaringan bridge Docker per link, berkas di-mount dari direktori lab). Semua output di bawah berasal dari jalankan itu, bukan dari `containerlab deploy`.

### Langkah

```bash
# 1. Host Linux butuh modul MPLS (sekali per boot)
sudo modprobe mpls_router
sudo modprobe mpls_iptunnel

# 2. Jalankan lab
cd materi/lab/kode/l2vpn
sudo containerlab deploy -t l2vpn.clab.yml

# 3. Masuk ke PE
docker exec -it clab-l2vpn-pe1 vtysh
```

Inti konfigurasi `pe1/frr.conf`:

```
mpls ldp
 router-id 10.255.0.1
 address-family ipv4
  discovery transport-address 10.255.0.1
  interface eth1
  exit
 exit-address-family
exit
!
l2vpn PELANGGAN-B type vpls
 mtu 1500
 member interface eth2
 member pseudowire mpw2
  neighbor lsr-id 10.255.0.2
  pw-id 100
 exit
 member pseudowire mpw3
  neighbor lsr-id 10.255.0.3
  pw-id 100
 exit
exit
```

Perhatikan: tidak ada perintah "neighbor targeted" untuk PE lain. FRR otomatis memulai targeted hello ke setiap `neighbor lsr-id` yang disebut di `l2vpn`.

### Verifikasi dan hasil yang diharapkan

Output berikut diambil dari lab penulis (FRR 10.7.1). Nomor label di lab Anda bisa berbeda.

```
pe1# show mpls ldp discovery
AF   ID              Type     Source           Holdtime
ipv4 10.255.0.2      Targeted 10.255.0.2             45
ipv4 10.255.0.3      Targeted 10.255.0.3             45
ipv4 10.255.0.10     Link     eth1                   15
```

Dua sumber **Targeted** (ke PE lain) dan satu **Link** (ke p1, tetangga langsung). Hello targeted punya holdtime lebih panjang daripada hello link.

```
pe1# show mpls ldp neighbor
AF   ID              State       Remote Address  Uptime
ipv4 10.255.0.2      OPERATIONAL 10.255.0.2      00:00:01
ipv4 10.255.0.3      OPERATIONAL 10.255.0.3      00:00:01
ipv4 10.255.0.10     OPERATIONAL 10.255.0.10     00:00:01
```

```
pe1# show l2vpn atom vc
Interface Peer ID         VC ID      Name             Status
--------- --------------- ---------- ---------------- ----------
mpw2      10.255.0.2      100        PELANGGAN-B      UP
mpw3      10.255.0.3      100        PELANGGAN-B      UP

pe1# show l2vpn atom binding
  Destination Address: 10.255.0.2, VC ID: 100
    Local Label:  16
        Cbit: 1,    VC Type: Ethernet,    GroupID: 0
        MTU: 1500
        Last failure: No Error
    Remote Label: 16
        Cbit: 1,    VC Type: Ethernet,    GroupID: 0
        MTU: 1500
  Destination Address: 10.255.0.3, VC ID: 100
    Local Label:  17
        Cbit: 1,    VC Type: Ethernet,    GroupID: 0
        MTU: 1500
        Last failure: No Error
    Remote Label: 16
        Cbit: 1,    VC Type: Ethernet,    GroupID: 0
        MTU: 1500
```

Cocokkan output ini dengan format FEC 128 di §3: **Cbit** adalah bit C (control word), **VC Type: Ethernet** adalah PW type 5, **GroupID** dan **MTU** adalah field Group ID dan sub-TLV MTU. Label lokal 16 dan 17 dialokasikan pe1 untuk masing-masing PE; label remote adalah yang harus dipakai pe1 saat mengirim.

Lihat juga label transport ke loopback PE lain:

```
pe1# show ip route 10.255.0.2/32
...
I>* 10.255.0.2/32 [115/30] via 10.0.1.1, eth1, label 17, weight 1
```

Jadi frame dari ce1 ke ce2 (seandainya kernel punya data plane PW) akan membawa tumpukan **[label transport 17 | label PW 16 | control word | frame]**.

### Latihan troubleshooting di lab

**Kasus 1: MTU tidak cocok.** Di pe3:

```
pe3# configure
pe3(config)# l2vpn PELANGGAN-B type vpls
pe3(config-l2vpn)# mtu 9000
```

Hasil di pe1 (dari lab penulis):

```
pe1# show l2vpn atom vc
mpw2      10.255.0.2      100        PELANGGAN-B      UP
mpw3      10.255.0.3      100        PELANGGAN-B      DOWN

pe1# show l2vpn atom binding
  Destination Address: 10.255.0.3, VC ID: 100
    Local Label:  17
        Cbit: 1,    VC Type: Ethernet,    GroupID: 0
        MTU: 1500
        Last failure: mtu mismatch between peers
    Remote Label: 16
        Cbit: 1,    VC Type: Ethernet,    GroupID: 0
        MTU: 9000
```

Perhatikan: label remote **sudah diterima** (sinyal berjalan), tetapi PW tetap DOWN karena RFC 8077 melarang PW naik bila MTU berbeda. Kembalikan dengan `mtu 1500`.

**Kasus 2: PW ID tidak cocok.** Di pe2, ubah `pw-id` untuk `mpw1` menjadi 200. Hasil di pe1:

```
mpw2      10.255.0.2      100        PELANGGAN-B      DOWN

  Destination Address: 10.255.0.2, VC ID: 100
    Local Label:  16
        ...
        Last failure: No Error
    Remote Label: unassigned
```

Kali ini **Remote Label: unassigned**: pe2 mengiklankan FEC untuk PW ID 200, yang tidak dikenal pe1, sehingga dari sudut pe1 tidak ada label yang cocok. "Last failure: No Error" justru menyesatkan; petunjuk sebenarnya adalah label remote yang kosong.

**Kasus 3: buktikan sendiri data plane tidak ada.**

```bash
docker exec clab-l2vpn-ce1 ping -c 3 192.168.100.2      # 100% packet loss
docker exec clab-l2vpn-pe1 ip -f mpls route show         # hanya LSP transport, tanpa label PW
```

Kernel hanya berisi entri LFIB untuk label transport, tidak ada entri untuk label PW 16 dan 17.

```bash
# Bongkar lab
sudo containerlab destroy -t l2vpn.clab.yml
```

---

## 12. Lab B: VPLS dengan Data Plane Nyata di MikroTik CHR

**Tujuan:** menjalankan VPLS full mesh yang benar-benar meneruskan frame, lalu varian sinyal BGP, memakai RouterOS v7 CHR (gratis; lisensi free CHR membatasi kecepatan 1 Mbps per interface, cukup untuk lab).

### Topologi dan berkas

Topologi sama dengan Lab A, tetapi semua node adalah CHR, link core memakai 10.1.1.0/31, 10.1.2.0/31, dan 10.1.3.0/31, IGP-nya OSPF, dan BFD aktif di link core. Berkas ada di `materi/lab/kode/l2vpn/routeros/`:

- `pe1.rsc`, `pe2.rsc`, `pe3.rsc`, `p1.rsc`, `ce1.rsc`, `ce2.rsc`, `ce3.rsc`: konfigurasi per node (diuji di RouterOS 7.24.5).
- `bgp-vpls-pe-contoh.rsc`: varian sinyal BGP untuk pe1.
- `routeros-vpls.clab.yml`: topologi containerlab (kind `mikrotik_ros`, image dibangun sendiri dengan vrnetlab dari CHR resmi).

Penulis menguji berkas `.rsc` dengan menjalankan 7 VM CHR 7.24.5 langsung di QEMU (link antar-VM lewat socket UDP), lalu mengimpor setiap berkas dengan `/import`. Berkas `routeros-vpls.clab.yml` sendiri belum dijalankan penulis lewat containerlab, jadi periksa nama tag image Anda dengan `docker images` setelah build vrnetlab.

> [!WARNING]
> **Jebakan MAC yang penulis temui:** VM QEMU yang dijalankan tanpa opsi `mac=` mendapat MAC ethernet yang **sama** di setiap VM. Selama hanya link routed, hal ini tidak terasa. Begitu ce1, ce2, dan ce3 berada dalam satu domain L2 (VPLS), MAC mereka bentrok dan ARP gagal. Karena itu `ce*.rsc` memasang IP di bridge dengan `admin-mac` unik. Di containerlab/vrnetlab, MAC sudah unik, jadi langkah ini tidak berbahaya tetapi juga tidak wajib.

### Langkah (containerlab)

```bash
# 1. Bangun image CHR (sekali)
git clone https://github.com/srl-labs/vrnetlab
cd vrnetlab/mikrotik/routeros
# unduh chr-7.24.5.vmdk dari https://mikrotik.com/download ke direktori ini
make docker-image

# 2. Jalankan lab (konfigurasi dimuat otomatis sebagai startup-config)
cd materi/lab/kode/l2vpn/routeros
sudo containerlab deploy -t routeros-vpls.clab.yml
ssh admin@clab-ros-vpls-pe1          # password default vrnetlab: admin
```

### Verifikasi dan hasil yang diharapkan

Output berikut diambil dari lab penulis.

```
[admin@pe1] > /interface vpls print
Flags: R - RUNNING
Columns: NAME, PEER, VPLS-ID
#   NAME         PEER        VPLS-ID
0 R vpls-ke-pe2  10.255.0.2  65000:100
1 R vpls-ke-pe3  10.255.0.3  65000:100

[admin@pe1] > /interface vpls monitor [find] once
   remote-label: 16                                                 16
    local-label: 16                                                 17
  remote-status:
       nexthops: { label=17; nh=10.1.1.1%ether2; interface=ether2 } { label=18; nh=10.1.1.1%ether2; interface=ether2 }
```

Kolom kiri untuk PW ke pe2, kolom kanan ke pe3. `nexthops` menunjukkan label transport (17 dan 18) yang dipasang di depan label PW.

```
[admin@pe1] > /mpls ldp neighbor print
Flags: D - DYNAMIC; O - OPERATIONAL, ...; t - SENDING-TARGETED-HELLO; v - VPLS; p - PASSIVE
#       TRANSPORT    LOCAL-TRANSPORT  PEER           ADDRESSES
0 DOtv  10.255.0.2   10.255.0.1       10.255.0.2:0   ...
1 DOtv  10.255.0.3   10.255.0.1       10.255.0.3:0   ...
2 DO  p 10.255.0.10  10.255.0.1       10.255.0.10:0  ...
```

Flag `t` (targeted hello) dan `v` (dipakai VPLS) muncul untuk sesi ke PE lain.

```
[admin@ce1] > /ping 192.168.100.2 count=3
  SEQ HOST                                     SIZE TTL TIME       STATUS
    0 192.168.100.2                              56  64 2ms336us
    1 192.168.100.2                              56  64 915us
    2 192.168.100.2                              56  64 964us
    sent=3 received=3 packet-loss=0%

[admin@pe1] > /interface bridge host print where bridge=br-pelanggan-b
#    MAC-ADDRESS        ON-INTERFACE    BRIDGE
0 D  02:00:00:00:0C:01  ether3          br-pelanggan-b
1 D  02:00:00:00:0C:02  vpls-ke-pe2     br-pelanggan-b
2 D  02:00:00:00:0C:03  vpls-ke-pe3     br-pelanggan-b
```

Inilah VPLS bekerja: MAC ce1 dipelajari di port lokal, MAC ce2 dan ce3 dipelajari di **interface PW** masing-masing. Persis seperti switch yang port-portnya kebetulan berada di kota berbeda.

```
[admin@p1] > /routing bfd session print
[admin@pe2] > /routing bfd session print detail
 0 U multihop=no vrf=main remote-address=10.1.2.1%ether2 local-address=10.1.2.0%ether2
     state=up ... desired-tx-interval=100ms ... multiplier=3 hold-time=300ms
```

BFD di core memastikan OSPF (dan dengan demikian LSP transport) bereaksi dalam sekitar 300 ms bila link core mati. BFD dibahas tuntas di `22-service-provider/05-sp-ketersediaan-keamanan`.

### Varian sinyal BGP

Terapkan `bgp-vpls-pe-contoh.rsc` di pe1, lalu versi yang disesuaikan di pe2 dan pe3 (router-id, rd, site-id, dan daftar peer). Hasil yang diharapkan sudah ditunjukkan di §5: interface `vpls1` dan `vpls2` dengan flag `RD` muncul otomatis, dan ping antar-CE kembali berhasil. Periksa sesi BGP dengan `/routing bgp session print`; kolom `.afi=l2vpn` menandakan keluarga alamat VPLS sudah dinegosiasikan.

### Eksperimen tambahan

1. Matikan `vpls-ke-pe3` di pe2 (`/interface vpls disable vpls-ke-pe3`). Apakah ce2 masih bisa ping ce3? Jelaskan dengan aturan split horizon (§5).
2. Hapus `bridge-horizon` dari semua PW di ketiga PE, lalu kirim broadcast dari ce1 (`/ping 192.168.100.255 count=2`). Amati penghitung paket di interface VPLS. Apa yang terjadi bila full mesh sudah lengkap tetapi horizon hilang?
3. Uji `ping size=1500 do-not-fragment` dari ce1 ke ce2. Di lab penulis ping ini berhasil walau MTU link core CHR hanya 1500. Cari tahu di dokumentasi MikroTik bagaimana RouterOS menangani paket VPLS yang melebihi MTU core, lalu bandingkan dengan perilaku router yang tidak memfragmentasi PW.

---

## 13. Troubleshooting L2VPN

### Alur diagnosis

```
1. AC (sisi pelanggan) UP?            → status interface, encapsulation/VLAN cocok
2. Ada LSP transport ke PE lawan?     → ping/traceroute MPLS ke loopback lawan
                                        (IOS XR: ping mpls ipv4 10.255.0.2/32)
3. Sesi LDP targeted (atau BGP) UP?   → show mpls ldp neighbor / discovery
4. Label PW remote diterima?          → binding/detail: "unassigned" = PW ID atau
                                        konfigurasi lawan tidak cocok
5. Parameter cocok?                   → PW type, MTU, control word
6. PW UP tetapi frame tidak lewat?    → MTU core, VLAN rewrite, MAC table, storm control
7. PW UP, frame kecil lewat, besar tidak? → MTU core kurang untuk tumpukan label
```

### Tabel gejala

| Gejala | Penyebab paling mungkin | Perintah pembuktian |
|---|---|---|
| PW DOWN, remote label tidak ada | PW ID beda, PE lawan belum dikonfigurasi, targeted LDP tidak naik | `show l2vpn atom binding` (FRR/IOS XE), `show l2vpn xconnect detail` (XR), `show l2circuit connections` (Junos) |
| PW DOWN, remote label ada, "mtu mismatch" | MTU AC berbeda | Bagian MTU di output detail |
| PW DOWN, kode "VC type mismatch" | Satu sisi Ethernet (5), sisi lain Ethernet tagged (4) | Bandingkan PW type kedua sisi |
| Sesi targeted LDP tidak naik | Tidak ada rute ke loopback lawan, ACL memblokir UDP/TCP 646, transport address salah | `show mpls ldp discovery`, ping antar-loopback |
| PW UP tapi ping antar-CE gagal | VLAN rewrite tidak simetris, MAC bentrok, AC salah VLAN | Penghitung paket di AC dan PW, tabel MAC |
| Ping kecil lewat, transfer file macet | MTU core < frame + label + control word | Ping dengan ukuran membesar dan DF |
| Paket tiba tidak berurutan, aplikasi lambat | ECMP di core salah tebak payload, tanpa control word | Aktifkan control word atau flow label |
| VPLS: dua situs saling tak terlihat, situs lain normal | Satu PW di full mesh putus (split horizon) | Status setiap PW di instance itu |
| Broadcast storm seluruh VPLS | Loop di sisi pelanggan | Penghitung broadcast per AC, tabel MAC yang berpindah-pindah |
| EVPN: duplikat BUM ke CE dual-homed | DF election tidak konsisten, ESI tidak sama di kedua PE | `show evpn ethernet-segment detail` |

---

## 14. 5G Standalone dan UPF: Yang Dilihat Jaringan Transport

Backhaul seluler di bagian 1 dan 10 sering dibayangkan sebagai "pipa Ethernet dari menara ke pusat". Pada 5G, pipa itu membawa arsitektur inti yang berbeda dari 4G, dan sebagai engineer SP Anda perlu tahu apa yang berjalan di ujung-ujungnya. Ada dua cara menggelar 5G. **Non-Standalone (NSA)** memakai radio 5G New Radio (NR) bersama inti 4G (EPC) yang sudah ada. **Standalone (SA)** menghubungkan NR ke **5G Core (5GC)**; menurut 3GPP, hanya dalam konfigurasi inilah seluruh layanan 5G Phase 1 (Release 15) didukung. Inti 5GC dirancang sebagai *Service-Based Architecture*: fungsi jaringan (*Network Function*, NF) seperti AMF (akses dan mobilitas), SMF (manajemen sesi), AUSF (autentikasi), dan UPF saling menawarkan layanan lewat antarmuka umum.

Prinsip yang paling relevan bagi jaringan IP adalah **CUPS** (*Control and User Plane Separation*). TS 23.501 menyatakan bahwa fungsi user plane dipisahkan dari control plane agar bisa berkembang dan diskalakan sendiri-sendiri, serta ditempatkan secara terpusat atau tersebar. Dalam istilah yang Anda kenal dari SDN (`16-datacenter-cloud-sdn/06-sdn`): **SMF** adalah control plane yang memutuskan aturan per sesi, dan **UPF (User Plane Function)** adalah data plane yang meneruskan paket pengguna. Keduanya terhubung lewat reference point **N4** memakai protokol **PFCP** (3GPP TS 29.244), yang juga dipakai di EPC untuk memisahkan SGW-C/PGW-C dari SGW-U/PGW-U.

| Reference point | Menghubungkan | Catatan |
|---|---|---|
| **N3** | RAN (gNB) dan UPF | Lalu lintas pengguna dibawa dalam tunnel **GTP-U** |
| **N4** | SMF dan UPF | Kontrol, PFCP |
| **N6** | UPF dan Data Network (internet, jaringan enterprise, MEC) | Titik breakout ke IP biasa |
| **N9** | UPF ke UPF | Antar-UPF, misalnya edge ke pusat |

Menurut TS 23.501 bagian 6.2.3, UPF antara lain menjadi titik jangkar mobilitas, menyediakan interkoneksi ke Data Network, meneruskan paket (termasuk *uplink classifier* dan *branching point* untuk sesi multi-homed), memeriksa paket, menegakkan kebijakan dan QoS (batas laju uplink/downlink), membuat laporan penggunaan, dan menahan paket downlink serta memicu notifikasi data untuk perangkat yang sedang idle. Ia mirip router besar yang menyimpan state per pelanggan.

Konsekuensi untuk transport: dari sisi jaringan SP, N3 adalah aliran IP biasa antara gNB dan UPF yang bisa dibawa L3VPN (`22-service-provider/02-mpls-l3vpn`), EVPN, atau SR-TE (`22-service-provider/03-te-segment-routing`), dengan kebutuhan latensi rendah dan keandalan yang ketat. Di sisi N6, UPF tampil sebagai router yang mengiklankan prefix alamat pengguna ke internet atau ke VRF pelanggan korporat, sehingga membutuhkan routing, firewall, dan sering NAT seperti perangkat edge lain. Memindahkan UPF ke edge (dekat pengguna) memperpendek jalur dan menurunkan latensi, tetapi memindahkan titik N6 breakout dan kebutuhan transport, serta menambah jumlah lokasi yang harus dioperasikan.

> [!WARNING]
> Bagian ini hanya menunjukkan batas antara inti seluler dan jaringan transport. Detail RAN, AMF, slicing, dan prosedur sesi PDU di luar cakupan kurikulum ini; rujuk TS 23.501 dan TS 23.502 untuk itu.

---

## 15. Kesalahan Umum

1. **Lupa bahwa PW butuh LSP transport.** Sesi targeted LDP bisa naik lewat IP biasa, tetapi kalau tidak ada label ke loopback PE lawan (misalnya LDP tidak aktif di satu link core), frame tidak akan sampai.
2. **Memakai loopback yang tidak di-/32 atau tidak diiklankan IGP.** Transport address LDP harus bisa dijangkau dan sebaiknya /32 agar label dialokasikan untuk FEC yang tepat.
3. **MTU berbeda di kedua ujung.** Konfigurasi MTU pada AC atau instance VPLS tidak seragam antar-PE, terutama saat satu PE vendor lain dengan default berbeda.
4. **Menganggap PW UP berarti layanan sehat.** PW UP hanya berarti sinyal sukses. Buktikan data plane dengan CFM/Y.1731, atau minimal ping dari sisi pelanggan dengan beberapa ukuran frame.
5. **Full mesh VPLS tidak lengkap.** Menambah PE baru di VPLS sinyal LDP tanpa memperbarui semua PE lama. Ini alasan utama BGP auto-discovery atau EVPN.
6. **Rewrite VLAN tidak simetris.** Tag dilepas di ingress tetapi tidak dipasang kembali di egress, sehingga pelanggan menerima frame tanpa tag.
7. **TPID S-tag berbeda di titik serah.** Satu operator `0x88A8`, operator lain `0x8100`. Frame lewat di satu arah tetapi tidak di arah lain, atau malah salah VLAN.
8. **Menyalakan STP pelanggan melewati VPLS tanpa kesepakatan.** BPDU pelanggan bisa memblokir port di sisi pelanggan secara tidak terduga. Sepakati apakah BPDU di-tunnel, dibuang, atau diproses.
9. **Level CFM tumpang tindih.** Operator memakai level yang sama dengan pelanggan, sehingga CCM pelanggan diproses (dan dibuang) oleh MEP operator.
10. **Percaya lab berarti produksi.** Lab FRR di modul ini menampilkan PW UP tanpa data plane. Selalu pahami apa yang benar-benar diuji oleh sebuah lab.

---

## 16. Ringkasan

- **L2VPN menjual transport**, bukan routing: operator membawa frame Ethernet utuh, pelanggan memegang L3 sendiri.
- **MEF:** UNI, EVC, ENNI; layanan **E-Line** (EPL/EVPL), **E-LAN**, **E-Tree**, **E-Access**; bandwidth profile **CIR/CBS/EIR/EBS** dengan warna hijau/kuning/merah.
- **Pseudowire:** label transport + **label PW** + control word opsional. Label PW dialokasikan PE tujuan dan dikirim lewat **LDP targeted** (RFC 8077, menggantikan RFC 4447).
- **FEC 128:** bit C, PW type, Group ID, **PW ID**, sub-TLV **MTU**. PW ID, PW type, dan MTU harus cocok; MTU berbeda berarti PW **tidak boleh** naik.
- **Control word** mencegah ECMP salah menebak frame Ethernet sebagai paket IP.
- **VPWS** tidak belajar MAC; **VPLS** adalah switch virtual dengan full mesh PW dan **split horizon** sebagai pengganti STP di core.
- VPLS sinyal **LDP** (RFC 4762, neighbor manual) vs sinyal **BGP** (RFC 4761, auto-discovery, label block, VE ID). **H-VPLS** memecah full mesh menjadi hub (PE-rs) dan spoke (MTU-s).
- **EVPN-MPLS** (RFC 7432) menggantikan VPLS: MAC di control plane, multihoming **all-active** dengan **ESI**, **DF election**, mass withdrawal, aliasing, MAC mobility. Route type **1-4**. EVPN-VPWS (RFC 8214) untuk E-Line.
- **QinQ** (S-tag `0x88A8`) untuk metro skala kota; **PBB** (I-SID 24 bit) menyembunyikan MAC pelanggan dari core.
- **G.8032** memblokir **RPL** saat normal dan membukanya saat ada kegagalan, dengan sasaran pemulihan di bawah 50 ms.
- **CFM** (CCM, loopback, linktrace) untuk konektivitas; **Y.1731** (DMM, LMM, SLM, AIS) untuk mengukur delay, jitter, dan loss sesuai SLA.
- **Lab gratis:** FRR menunjukkan sinyal PW tanpa data plane; MikroTik CHR menjalankan VPLS (LDP dan BGP) dengan data plane nyata; EVPN-MPLS, G.8032, dan Y.1731 tidak bisa penulis verifikasi dengan alat gratis.
- **5G SA** = NR terhubung ke 5GC (NSA memakai inti 4G). **CUPS**: SMF (control) memerintah **UPF** (user plane) lewat **N4/PFCP**; **N3** = gNB ke UPF (GTP-U), **N6** = UPF ke Data Network, **N9** = UPF ke UPF. Bagi transport, N3 adalah aliran IP yang dibawa L3VPN/SR, dan UPF di edge memindahkan titik breakout N6.

---

## 17. Latihan

1. Seorang pelanggan bank membeli layanan "Metro-E 100 Mbps" dan mengeluh hanya mendapat sekitar 50 Mbps pada jam sibuk, padahal pagi hari bisa 100 Mbps. Kontraknya menyebut CIR 50 Mbps, EIR 50 Mbps. Jelaskan apa yang terjadi dan apa yang seharusnya dijelaskan tim sales sejak awal.
2. Gambarkan tumpukan header lengkap sebuah frame Ethernet pelanggan (dengan satu tag VLAN) saat melintasi link antara P dan PE tujuan pada VPWS dengan control word, jika core memakai PHP. Berapa MTU minimal link sebelumnya (antara P sebelum hop terakhir dan P terakhir)?
3. `show l2vpn atom binding` di PE1 menampilkan "Remote Label: unassigned" untuk PW ke PE2, sedangkan sesi LDP targeted ke PE2 OPERATIONAL. Sebutkan dua penyebab paling mungkin dan cara membuktikan masing-masing.
4. VPLS dengan empat PE (PE1-PE4) berjalan normal. Setelah pemeliharaan, PW antara PE2 dan PE4 tidak naik kembali, sementara semua PW lain UP. Situs mana yang terganggu, dan kenapa PE1 tidak "menolong" meneruskan frame?
5. Operator Anda punya 40 PE dan menjual E-LAN ke 300 pelanggan dengan VPLS sinyal LDP. Hitung jumlah PW bila setiap pelanggan hadir di semua PE, lalu usulkan dua pendekatan untuk mengurangi beban operasional.
6. Pelanggan menyambung CE dengan LAG ke dua PE (PE-A, PE-B) dalam satu layanan EVPN all-active. Pelanggan melaporkan menerima setiap paket broadcast dua kali. Apa mekanisme EVPN yang seharusnya mencegah ini, dan apa yang Anda periksa?
7. Di sebuah titik serah, operator A mengirim frame dengan S-tag TPID `0x88A8` VLAN 500 ke operator B. Operator B mengonfigurasi port sebagai trunk 802.1Q biasa dengan VLAN 500. Apa yang terjadi pada frame tersebut dan bagaimana memperbaikinya?
8. Pada ring G.8032 enam node, link antara node C dan D putus. Urutkan peristiwa yang terjadi sampai trafik pulih, lalu jelaskan peran WTR timer ketika link C-D kembali normal.
9. Pelanggan menuntut bukti bahwa latensi layanan E-Line Jakarta-Surabaya selalu di bawah angka di kontrak. Fungsi Y.1731 apa yang Anda pakai, dua arah atau satu arah, dan apa syarat teknis untuk masing-masing?
10. Di Lab A (FRR), seorang rekan melaporkan "PW sudah UP semua tapi ping antar-CE gagal, berarti konfigurasi salah". Bagaimana Anda menanggapinya, dan bukti apa yang Anda tunjukkan?
11. Operator memindahkan UPF dari pusat data nasional ke lokasi regional untuk menurunkan latensi aplikasi pabrik. Sebutkan reference point yang jalurnya berubah dan reference point yang tetap berupa sesi kontrol, lalu uraikan tiga dampak pada jaringan transport/SP.

<details>
<summary>Jawaban</summary>

1. Yang terjadi adalah **bandwidth profile** bekerja sesuai kontrak. 50 Mbps pertama (CIR) diwarnai hijau dan dijamin. 50 Mbps berikutnya (EIR) diwarnai kuning: dikirim bila ada kapasitas, tetapi boleh dibuang saat jaringan padat. Pagi hari jaringan sepi sehingga trafik kuning ikut lewat; jam sibuk trafik kuning dibuang. Ini bukan gangguan. Tim sales seharusnya menjelaskan bahwa yang dijamin hanya 50 Mbps, dan bila pelanggan butuh 100 Mbps terjamin, ia harus membeli CIR 100 Mbps. Engineer bisa membantu dengan menunjukkan penghitung drop policer kuning di UNI.

2. Di link terakhir (P terakhir ke PE tujuan), label transport sudah dilepas karena PHP, sehingga tumpukannya: **[header Ethernet link core | label PW | control word | frame pelanggan: DA, SA, tag VLAN, EtherType, payload]**. Di link sebelumnya (antara dua P), masih ada label transport: **[Ethernet link | label transport | label PW | CW | frame pelanggan]**. MTU MPLS minimal di link itu: payload 1500 + header Ethernet pelanggan 14 + tag VLAN 4 + control word 4 + dua label 8 = **1530 byte**. Bila core memakai label tambahan (TE, SR, flow label), tambahkan 4 byte per label.

3. (a) **PW ID tidak sama** di kedua sisi: PE2 mengiklankan FEC dengan PW ID lain sehingga PE1 tidak menemukan pasangannya. Buktikan dengan membandingkan konfigurasi pw-id/VC ID dan melihat binding di PE2 (PE2 juga akan menampilkan label remote kosong untuk PW ID-nya). (b) **PE2 belum mengonfigurasi PW ke PE1** (atau salah alamat neighbor/lsr-id), sehingga sesi LDP ada (misalnya karena PW lain) tetapi tidak ada Label Mapping untuk FEC ini. Buktikan di PE2 dengan `show l2vpn atom vc` atau setara. Penyebab lain yang mungkin: PW type berbeda pada implementasi yang tidak mengirim mapping saat tipe tidak cocok. Di Lab A, kasus 2 mereproduksi penyebab (a).

4. Situs di belakang **PE2 dan PE4** tidak bisa saling berkomunikasi; semua pasangan lain normal. PE1 (dan PE3) memang menerima frame dari PE2, tetapi aturan **split horizon** VPLS melarang PE meneruskan frame yang datang dari PW core ke PW core lain. Aturan ini ada karena VPLS mengandalkan full mesh untuk jangkauan dan split horizon untuk mencegah loop tanpa STP. Akibatnya setiap pasangan PE wajib punya PW langsung.

5. Per pelanggan: 40 × 39 / 2 = **780 PW**. Untuk 300 pelanggan: **234.000 PW** (masing-masing dengan state di dua PE). Pendekatan: (a) **BGP auto-discovery dan/atau sinyal BGP** (RFC 4761/6074) sehingga menambah PE tidak perlu menyentuh PE lain, dan label block mengurangi pesan; (b) **H-VPLS**, memusatkan full mesh di beberapa PE-rs dan menyambung PE akses lewat spoke; (c) migrasi ke **EVPN-MPLS**, yang tidak memakai PW sama sekali dan memakai route reflector untuk skala. Jawaban yang baik menyebut minimal dua.

6. Mekanisme yang relevan adalah **Designated Forwarder (DF) election** per Ethernet Segment: hanya DF yang boleh mengirim BUM ke CE, ditambah **split horizon dengan ESI label** agar BUM yang berasal dari CE itu tidak dikirim balik ke CE yang sama lewat PE lain. Periksa: (a) **ESI sama persis** di PE-A dan PE-B; bila berbeda, masing-masing menganggap dirinya DF untuk segmen berbeda; (b) route type 4 dari kedua PE saling diterima (`show bgp l2vpn evpn` atau `show evpn ethernet-segment detail`), dan keduanya menyepakati DF yang sama; (c) mode multihoming sama (all-active di kedua sisi).

7. Port trunk 802.1Q biasa mengenali tag dengan TPID `0x8100`. Frame dengan TPID `0x88A8` tidak dianggap ber-tag VLAN, sehingga diperlakukan sebagai frame tanpa tag (masuk native VLAN) atau dibuang, tergantung perangkat. Frame tidak masuk VLAN 500 sebagaimana dimaksud. Perbaikan: sepakati TPID di titik serah. Operator B mengonfigurasi port untuk menerima S-tag `0x88A8` (misalnya dot1ad atau ethertype S-VLAN), atau operator A mengubah TPID keluar menjadi `0x8100` sesuai kesepakatan ENNI. Uji kedua arah setelah perubahan.

8. (1) C dan D mendeteksi kegagalan (link down fisik atau hilangnya CCM), lalu **memblokir port yang gagal**. (2) Setelah hold-off timer (bila diset) habis, C dan D mengirim **R-APS(SF)** ke seluruh ring lewat port yang masih hidup. (3) Setiap node yang menerima R-APS(SF) **mem-flush tabel MAC** (FDB). (4) **RPL owner membuka RPL**, sehingga ring menjadi rantai terbuka di titik putus C-D dan trafik mengalir lewat RPL. (5) Trafik pulih. Saat link C-D kembali, C dan D mengirim **R-APS(NR)** sambil tetap memblokir port tersebut. RPL owner menjalankan **WTR timer** (default 5 menit) dan baru setelah habis memblokir RPL kembali dan mengirim R-APS(NR, RB), lalu C dan D membuka port. WTR mencegah ring bolak-balik berpindah bila link C-D masih tidak stabil (flapping).

9. Gunakan **ETH-DM** dari Y.1731. Paling praktis adalah **DMM/DMR (dua arah)**: MEP di Jakarta mengirim DMM, MEP Surabaya membalas DMR, dan delay dihitung dari timestamp di sisi pengirim dikurangi waktu proses responder. Syaratnya hanya MEP di kedua ujung dengan dukungan DM, **tidak perlu sinkronisasi jam**. Bila kontrak meminta **latensi satu arah**, pakai **1DM**, dan syaratnya kedua MEP harus **tersinkron waktu dengan akurat** (umumnya PTP/IEEE 1588), karena delay dihitung dari selisih timestamp dua jam yang berbeda. Simpan hasil per interval (misalnya per 15 menit) sebagai bukti SLA, beserta FDV (jitter).

10. Tanggapan yang benar: konfigurasinya bisa saja **sudah benar**. Di Linux, FRR hanya menjalankan **control plane** pseudowire; kernel tidak punya data plane PW, dan fungsi zebra yang seharusnya memasang PW ke kernel tidak melakukan apa-apa. Bukti: (a) `show l2vpn atom binding` menunjukkan label lokal/remote dan parameter cocok, jadi sinyal sukses; (b) `ip -f mpls route show` di PE hanya berisi label transport, tidak ada label PW; (c) ping antar-CE gagal walaupun semua PW UP. Untuk menguji data plane, pakai Lab B (MikroTik CHR) atau perangkat yang punya data plane PW. Pelajaran umumnya: status UP di control plane bukan bukti layanan meneruskan trafik.

11. Yang berubah jalurnya adalah **N3** (gNB ke UPF: kini lebih pendek dan berakhir di lokasi regional) dan **N6** (UPF ke Data Network: breakout ke internet atau VRF enterprise kini terjadi di lokasi regional), serta **N9** bila masih ada UPF pusat sebagai jangkar. **N4** (SMF ke UPF, PFCP) tetap sesi kontrol, tetapi kini melintasi jarak lebih jauh karena SMF masih di pusat sehingga butuh jalur yang andal dan latensi terkendali. Dampak transport: (1) rute N3 baru butuh kapasitas, QoS, dan SLA latensi di L3VPN/EVPN/SR-TE menuju lokasi regional; (2) lokasi regional kini perlu fungsi edge penuh untuk N6 (routing BGP ke internet atau VRF pelanggan, firewall, dan NAT bila diperlukan) beserta proteksi seperti iACL; (3) jumlah lokasi yang dioperasikan naik, sehingga monitoring, change window, dan redundansi UPF/link harus dirancang per lokasi.

</details>

---

## 18. Sumber

- RFC 8077, Pseudowire Setup and Maintenance Using the Label Distribution Protocol (LDP): https://www.rfc-editor.org/rfc/rfc8077
- RFC 4447, Pseudowire Setup and Maintenance Using LDP (digantikan RFC 8077): https://www.rfc-editor.org/rfc/rfc4447
- RFC 4385, Pseudowire Emulation Edge-to-Edge (PWE3) Control Word: https://www.rfc-editor.org/rfc/rfc4385
- RFC 6391, Flow-Aware Transport of Pseudowires over an MPLS PSN: https://www.rfc-editor.org/rfc/rfc6391
- RFC 4762, VPLS Using LDP Signaling: https://www.rfc-editor.org/rfc/rfc4762
- RFC 4761, VPLS Using BGP for Auto-Discovery and Signaling: https://www.rfc-editor.org/rfc/rfc4761
- RFC 6074, Provisioning, Auto-Discovery, and Signaling in L2VPNs: https://www.rfc-editor.org/rfc/rfc6074
- RFC 7432, BGP MPLS-Based Ethernet VPN: https://www.rfc-editor.org/rfc/rfc7432
- RFC 8214, Virtual Private Wire Service Support in Ethernet VPN: https://www.rfc-editor.org/rfc/rfc8214
- RFC 8317, Ethernet-Tree (E-Tree) Support in EVPN and PBB-EVPN: https://www.rfc-editor.org/rfc/rfc8317
- RFC 7623, Provider Backbone Bridging Combined with Ethernet VPN (PBB-EVPN): https://www.rfc-editor.org/rfc/rfc7623
- RFC 8560, Seamless Integration of EVPN with VPLS: https://www.rfc-editor.org/rfc/rfc8560
- ITU-T G.8032, Ethernet ring protection switching: https://www.itu.int/rec/T-REC-G.8032
- ITU-T G.8013/Y.1731, Operations, administration and maintenance (OAM) functions and mechanisms for Ethernet-based networks: https://www.itu.int/rec/T-REC-G.8013
- ITU-T Y.1564, Ethernet service activation test methodology: https://www.itu.int/rec/T-REC-Y.1564
- IEEE 802.1Q (memuat 802.1ad, 802.1ag, 802.1ah): https://standards.ieee.org/ieee/802.1Q/10323/
- MEF, Carrier Ethernet service definitions dan atribut layanan: https://www.mef.net/
- FRRouting User Guide, LDP (termasuk l2vpn): https://docs.frrouting.org/en/latest/ldpd.html
- FRRouting, kode `zebra/zebra_mpls_netlink.c` (stub PW di Linux): https://github.com/FRRouting/frr/blob/master/zebra/zebra_mpls_netlink.c
- FRRouting User Guide, EVPN: https://docs.frrouting.org/en/latest/evpn.html
- MikroTik, CLI reference `/interface vpls`: https://manual.mikrotik.com/docs/cli-reference/interface/vpls/
- MikroTik, CHR dan unduhan: https://mikrotik.com/download
- Nokia SR Linux, tutorial MPLS dengan LDP (catatan lisensi platform MPLS): https://learn.srlinux.dev/tutorials/mpls/mpls-ldp/intro/
- containerlab, kind MikroTik RouterOS: https://containerlab.dev/manual/kinds/vr-ros/
- vrnetlab (srl-labs), image MikroTik RouterOS: https://github.com/srl-labs/vrnetlab/tree/master/mikrotik/routeros
- Cisco, dokumentasi L2VPN dan Ethernet Services IOS XR (ASR 9000): https://www.cisco.com/c/en/us/support/routers/asr-9000-series-aggregation-services-routers/products-installation-and-configuration-guides-list.html
- Juniper, dokumentasi VPLS, EVPN, dan l2circuit Junos: https://www.juniper.net/documentation/
- 3GPP/ETSI, TS 123 501 V18.6.0, System architecture for the 5G System (bagian 4.1, 4.2.7, 6.2.3): https://www.etsi.org/deliver/etsi_ts/123500_123599/123501/18.06.00_60/ts_123501v180600p.pdf
- 3GPP, 5G System Overview (perbedaan SA dan NSA, Release 15): https://www.3gpp.org/technologies/5g-system-overview
- ETSI, daftar TS 129 244 (PFCP, antarmuka Control Plane dan User Plane): https://www.etsi.org/deliver/etsi_ts/129200_129299/129244/

---

**Berikutnya:** `22-service-provider/05-sp-ketersediaan-keamanan`. Membuat jaringan SP tetap hidup saat ada kegagalan dan tetap aman dari serangan: BFD, GR/NSR, BGP PIC, Add-Path, proteksi control plane, dan disiplin operasi.

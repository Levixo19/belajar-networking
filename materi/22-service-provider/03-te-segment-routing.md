# 22.3 — Traffic Engineering dan Segment Routing

> **Prasyarat:** `07-routing-lanjutan/10-isis` (IGP backbone, LSP, TLV), `22-service-provider/01-mpls-ldp` (label, push/swap/pop, PHP, LDP), `22-service-provider/02-mpls-l3vpn` (VRF, RD/RT, VPNv4, untuk bagian SRv6 L3VPN)
> **Tujuan:** Anda bisa menjelaskan kenapa jalur terpendek IGP tidak selalu jalur terbaik, memahami cara kerja RSVP-TE dan FRR facility backup, menguasai Segment Routing (jenis SID, SRGB/SRLB, ekstensi IS-IS/OSPF), merencanakan migrasi LDP ke SR, menghitung dan memverifikasi proteksi TI-LFA, membangun SR-TE policy berbasis color, memahami Flex-Algo, PCE/PCEP, dan BGP-LS, membaca alamat SRv6 dan uSID (RFC 9800), mengonfigurasinya di IOS XR, Junos, FRRouting, dan SR Linux, serta memutuskan kapan SR-MPLS atau SRv6 cocok untuk operator Anda.

---

## 1. Masalah yang Dipecahkan Traffic Engineering

IGP seperti IS-IS dan OSPF punya satu aturan sederhana: kirim paket lewat jalur dengan **total metrik terkecil**. Aturan itu bagus untuk konvergensi dan bebas loop, tetapi buta terhadap tiga hal yang justru paling dipedulikan operator: **kapasitas yang tersisa, latensi, dan risiko bersama**.

Bayangkan backbone sebuah operator dengan dua jalur antara Jakarta dan Surabaya:

```
                 Jalur utara (kabel laut, 100G, metrik 10+10)
          ┌──── JKT ──────── SMG ──────── SBY ────┐
          │                                        │
   pelanggan                                    data center
          │                                        │
          └──── JKT ──── BDG ──── YOG ──── SBY ───┘
                 Jalur selatan (darat, 100G, metrik 10+10+10)
```

IGP memilih jalur utara karena metriknya 20, lebih kecil dari 30. Akibatnya:

- **Jalur utara penuh, jalur selatan menganggur.** Saat jam sibuk, link JKT-SMG mencapai 95% dan mulai membuang paket, sementara link selatan hanya terpakai 20%. Inilah yang di literatur disebut *the fish problem*: semua trafik mengalir ke "kepala ikan" (jalur terpendek) dan "badan ikan" (jalur alternatif) kosong.
- **Mengubah metrik tidak menyelesaikan masalah.** Jika metrik utara Anda naikkan menjadi 40, **semua** trafik pindah ke selatan dan masalah berpindah tempat. Metrik IGP berlaku untuk semua tujuan sekaligus. Anda tidak bisa berkata "pelanggan A lewat utara, pelanggan B lewat selatan".
- **Kebutuhan berbeda per layanan.** Trafik suara dan backhaul seluler butuh latensi rendah. Trafik backup data center butuh bandwidth besar tetapi toleran terhadap latensi. Pelanggan bank meminta dua jalur yang **tidak berbagi kabel atau duct yang sama** (disjoint) agar satu galian tidak memutus keduanya.

**Traffic Engineering (TE)** adalah kemampuan untuk menempatkan trafik pada jalur yang **bukan** jalur terpendek IGP, secara terkendali dan per kelas trafik. Ada tiga generasi alat untuk itu:

| Generasi | Teknologi | Di mana state jalur disimpan | Status 2026 |
|---|---|---|---|
| 1 | IGP metric tuning, PBR | Tidak ada state jalur | Masih dipakai untuk kasus sederhana |
| 2 | **RSVP-TE** (RFC 3209) | **Di setiap router** sepanjang jalur (per LSP) | Masih banyak di backbone yang sudah ada |
| 3 | **Segment Routing** (RFC 8402) | **Di header paket** (daftar segmen) | Arah baru hampir semua vendor dan operator |

Kebutuhan kedua yang sering dibahas bersama TE adalah **pemulihan cepat**. Backbone operator menargetkan pemulihan dalam orde puluhan milidetik setelah link putus. Angka 50 ms yang sering Anda dengar adalah warisan SONET/SDH. Konvergensi IGP biasa butuh ratusan milidetik hingga detik, sehingga dibutuhkan **jalur cadangan yang sudah dihitung dan dipasang sebelum gangguan terjadi**. RSVP-TE menyediakannya lewat FRR (RFC 4090), Segment Routing lewat TI-LFA (RFC 9855).

---

## 2. RSVP-TE: Cara Lama yang Masih Hidup

Anda perlu memahami RSVP-TE karena tiga alasan: banyak backbone di Indonesia masih menjalankannya, ujian SPCOR dan JNCIS-SP menanyakannya, dan konsep-konsepnya (CSPF, ERO, bandwidth reservation, facility backup) diwarisi Segment Routing.

### 2.1 Langkah 1: IGP membawa informasi TE

Supaya headend bisa menghitung jalur dengan batasan bandwidth, setiap router mengiklankan atribut link lewat **ekstensi TE** di IGP:

| Atribut | IS-IS (RFC 5305, sub-TLV di TLV 22) | OSPF (RFC 3630, Opaque LSA type 10) |
|---|---|---|
| Bandwidth maksimum link | Maximum Link Bandwidth | Maximum Bandwidth |
| Bandwidth yang boleh direservasi | Maximum Reservable Bandwidth | Maximum Reservable Bandwidth |
| Sisa bandwidth per prioritas (8 level) | Unreserved Bandwidth | Unreserved Bandwidth |
| Metrik TE (terpisah dari metrik IGP) | TE Default Metric | TE Metric |
| "Warna" link (affinity) | Administrative Group | Administrative Group |

Administrative group (atau *affinity*, *link color*) adalah bitmask 32 bit. RFC 7308 memperluasnya menjadi *extended admin group* yang lebih panjang. Operator memberi arti sendiri, misalnya bit 0 = "kabel laut", bit 1 = "link sewa pihak ketiga", bit 2 = "microwave". Dari situ, kebijakan seperti "LSP pelanggan bank jangan lewat microwave" bisa dibentuk.

Semua router menyimpan informasi ini di **TED (Traffic Engineering Database)**, yaitu LSDB yang diperkaya atribut TE.

### 2.2 Langkah 2: CSPF menghitung jalur

**CSPF (Constrained Shortest Path First)** adalah Dijkstra dengan langkah pemangkasan di depan:

```
1. Mulai dari TED (topologi lengkap + atribut TE)
2. Buang semua link yang TIDAK memenuhi batasan:
     - unreserved bandwidth pada prioritas LSP < bandwidth yang diminta
     - admin group yang dilarang (exclude) / tidak memenuhi include
     - node/link yang dikecualikan secara eksplisit
3. Jalankan SPF (memakai metrik IGP atau metrik TE) pada sisa topologi
4. Hasil: daftar hop → menjadi ERO
```

CSPF hanya berjalan di **headend** (router asal LSP). Router transit tidak menghitung ulang, mereka mengikuti instruksi.

### 2.3 Langkah 3: RSVP memberi sinyal dan mereservasi

RSVP-TE (RFC 3209) memakai dua pesan utama:

```
Headend (R1)                 R5                   R4                Tailend (R3)
    │ PATH ──────────────────▶│ PATH ─────────────▶│ PATH ───────────▶│
    │  ERO: R5, R4, R3        │  ERO: R4, R3       │  ERO: R3         │
    │  LABEL_REQUEST          │                    │                  │
    │  SENDER_TSPEC: 2 Gbps   │                    │                  │
    │                         │                    │                  │
    │◀────────────────── RESV │◀───────────── RESV │◀──────────── RESV│
    │  LABEL: 24005           │  LABEL: 24010      │  LABEL: 3 (PHP)  │
    │  (reservasi 2G di link) │                    │                  │
```

Objek penting yang perlu Anda kenali di debug dan capture:

| Objek | Pesan | Fungsi |
|---|---|---|
| **ERO** (Explicit Route Object) | PATH | Daftar hop yang harus dilalui. Tiap hop *strict* (harus tetangga langsung) atau *loose* (boleh lewat jalur IGP) |
| **LABEL_REQUEST** | PATH | Meminta downstream mengalokasikan label |
| **LABEL** | RESV | Label yang dialokasikan downstream, dikirim ke upstream (downstream-on-demand) |
| **SENDER_TSPEC / FLOWSPEC** | PATH / RESV | Bandwidth yang diminta dan yang direservasi |
| **SESSION_ATTRIBUTE** | PATH | Nama LSP, **setup priority** dan **hold priority** (0 tertinggi sampai 7 terendah), flag seperti *local protection desired* |
| **RRO** (Record Route Object) | PATH dan RESV | Mencatat hop (dan label) yang benar-benar dilalui. Dipakai untuk loop detection dan oleh FRR |

**Preemption.** LSP baru dengan *setup priority* lebih tinggi (angka lebih kecil) dari *hold priority* LSP yang sudah ada boleh "mengusir" LSP lama bila bandwidth tidak cukup. Begitulah operator memastikan LSP backhaul seluler selalu mendapat tempat, sementara LSP best-effort mengalah.

**Make-before-break.** Saat LSP perlu dipindah (misalnya bandwidth diubah atau reoptimasi menemukan jalur lebih baik), headend membangun LSP baru dulu dengan *shared explicit* style sehingga reservasi di link yang sama tidak dihitung dua kali, baru kemudian merobohkan LSP lama. Tidak ada paket yang hilang.

**Soft state.** RSVP adalah protokol *soft state*: PATH dan RESV harus di-refresh berkala (default RFC 2205 adalah 30 detik). Jika refresh berhenti, state kedaluwarsa. Inilah salah satu sumber beban RSVP di jaringan besar.

### 2.4 Fast Reroute RSVP-TE (RFC 4090)

RFC 4090 mendefinisikan dua metode proteksi lokal. Router yang mendeteksi kegagalan dan mengalihkan trafik disebut **PLR (Point of Local Repair)**. Router tempat jalur cadangan bergabung kembali disebut **MP (Merge Point)**.

| | One-to-one backup | **Facility backup** |
|---|---|---|
| Cara | Setiap LSP terlindungi punya **detour LSP** sendiri | Satu **bypass tunnel** melindungi **banyak LSP** sekaligus |
| Skala | Buruk: jumlah detour sebanding jumlah LSP | Baik: satu bypass per link atau per node yang dilindungi |
| Label | Detour membawa label sendiri | **Label stacking**: PLR mendorong label bypass di atas label yang diharapkan MP |
| Pemakaian | Jarang | **Paling umum di lapangan** |

Facility backup punya dua varian:

```
Link protection (NHOP bypass):         Node protection (NNHOP bypass):

  R1 ══X══ R2 ──── R3                    R1 ════ R2 ════ R3
   ╲      ╱                               ╲      X      ╱
    ╲    ╱  bypass ke R2 (next-hop)        ╲           ╱   bypass ke R3 (next-next-hop),
     R5                                     R5 ─── R4 ╱    melewati R2 sepenuhnya
```

Saat link R1-R2 putus, R1 (PLR) tidak menunggu headend. Ia langsung mengambil label yang seharusnya dikirim ke R2 (untuk NHOP) atau label yang diharapkan R3 (untuk NNHOP, dipelajari dari RRO dengan *label recording*), lalu mendorong label bypass di atasnya. Paket sampai di MP dengan label yang sama seperti jika lewat jalur normal, sehingga MP tidak perlu tahu ada gangguan. Setelah itu PLR memberi tahu headend (PathErr), dan headend membangun ulang LSP lewat make-before-break.

### 2.5 Kenapa industri bergerak meninggalkan RSVP-TE

- **State di setiap router.** Dengan N PE dan full mesh LSP, ada N×(N-1) LSP. 200 PE menghasilkan hampir 40.000 LSP, dan setiap router P di tengah harus menyimpan dan me-refresh state untuk ribuan di antaranya.
- **Dua protokol label.** Umumnya LDP tetap dibutuhkan untuk layanan biasa, dan RSVP-TE ditambahkan untuk TE. Operator mengoperasikan dua control plane label sekaligus.
- **Proteksi bergantung topologi.** Bypass harus dikonfigurasi atau dibuat otomatis per link/node, dan cakupannya tidak selalu 100%.
- **ECMP lemah.** LSP RSVP adalah satu jalur. Memanfaatkan beberapa jalur setara butuh banyak LSP paralel.

Segment Routing menyelesaikan semua poin itu dengan satu perubahan: **memindahkan state jalur dari router ke paket**.

### 2.6 Konfigurasi RSVP-TE singkat

**Cisco IOS XR:**
```
router isis CORE
 address-family ipv4 unicast
  metric-style wide
  mpls traffic-eng level-2-only
  mpls traffic-eng router-id Loopback0
!
rsvp
 interface HundredGigE0/0/0/0
  bandwidth 40000000                ← kbps yang boleh direservasi
!
mpls traffic-eng
 interface HundredGigE0/0/0/0
  auto-tunnel backup                ← bypass facility dibuat otomatis
!
explicit-path name LEWAT-R5
 index 10 next-address strict ipv4 unicast 10.1.15.5
 index 20 next-address loose ipv4 unicast 10.0.0.3
!
interface tunnel-te10
 ipv4 unnumbered Loopback0
 destination 10.0.0.3
 signalled-bandwidth 2000000         ← 2 Gbps
 autoroute announce
 fast-reroute                        ← minta proteksi lokal
 path-option 10 explicit name LEWAT-R5
 path-option 20 dynamic              ← cadangan: CSPF bebas
```

**Juniper Junos:**
```
set interfaces et-0/0/0 unit 0 family mpls
set protocols mpls interface et-0/0/0.0
set protocols rsvp interface et-0/0/0.0 bandwidth 40g
set protocols rsvp interface et-0/0/0.0 link-protection
set protocols mpls path LEWAT-R5 10.1.15.5 strict
set protocols mpls label-switched-path KE-R3 to 10.0.0.3
set protocols mpls label-switched-path KE-R3 bandwidth 2g
set protocols mpls label-switched-path KE-R3 primary LEWAT-R5
set protocols mpls label-switched-path KE-R3 link-protection
```
Di Junos, `link-protection` (atau `node-link-protection`) pada LSP meminta facility backup, sedangkan `fast-reroute` meminta one-to-one detour. Verifikasi dengan `show mpls lsp extensive`, `show rsvp session detail`, dan `show rsvp interface`.

⚠️ **FRRouting tidak mengimplementasikan RSVP-TE.** Tidak ada daemon RSVP di FRR, sehingga bagian ini tidak bisa dipraktikkan dengan FRR. Alternatif gratis: MikroTik CHR (RouterOS v7 punya RSVP-TE, tetapi menurut manualnya belum ada fast reroute, lihat `22-service-provider/01-mpls-ldp` §11) atau Cisco CML Free/XRd bila Anda punya akses lisensinya.

---

## 3. Segment Routing: Ide Dasar

### 3.1 Source routing dengan label

Segment Routing (SR, RFC 8402) adalah **source routing**: router asal (headend) menuliskan **daftar instruksi** ke dalam paket, dan setiap router di jalur hanya menjalankan instruksi teratas. Setiap instruksi disebut **segmen**, dan pengenalnya disebut **SID (Segment Identifier)**.

Analogi yang membantu: RSVP-TE seperti memesan **jalur kereta khusus**. Setiap stasiun di sepanjang jalan harus mencatat pesanan Anda. SR seperti **tiket berantai** yang Anda bawa sendiri: "naik ke Semarang, lalu ganti ke Surabaya". Stasiun Semarang tidak perlu tahu Anda datang. Ia cukup membaca tiket dan meneruskan Anda.

```
R1 ingin mengirim ke R3 lewat R5 dan R4 (bukan jalur terpendek lewat R2):

  R1 mendorong:  [ 16004 | 16003 ] + paket IP
                   │        └── segmen 2: "pergi ke R3 lewat jalur terpendek"
                   └─────────── segmen 1: "pergi ke R4 lewat jalur terpendek"

  R1 ──▶ R5 : [16004 | 16003]   R5 penultimate untuk R4 → pop 16004 (PHP)
  R5 ──▶ R4 : [16003]           R4 penultimate untuk R3 → pop 16003 (PHP)
  R4 ──▶ R3 : paket IP polos
```

Perhatikan apa yang **tidak** ada: R5 dan R4 tidak menyimpan state "LSP R1 ke R3". Mereka hanya tahu cara mencapai setiap node, yang sudah mereka ketahui dari IGP. State jalur ada di paket, dan hanya headend yang tahu bahwa jalur ini istimewa.

### 3.2 Dua data plane

SR adalah arsitektur, bukan format paket. Ada dua data plane:

| | **SR-MPLS** (RFC 8660) | **SRv6** (RFC 8986, RFC 8754) |
|---|---|---|
| SID | Label MPLS 20 bit | Alamat IPv6 128 bit |
| Daftar segmen | Label stack | Segment Routing Header (SRH) di header ekstensi IPv6, atau dikompresi di alamat tujuan (uSID) |
| Perangkat transit | Harus mendukung MPLS | Cukup IPv6 biasa (hanya endpoint segmen yang harus paham SRv6) |
| Dibahas di | §4 sampai §11 | §12 |

### 3.3 Tiga operasi dasar

RFC 8402 mendefinisikan operasi pada daftar segmen:

| Operasi | Arti | Di SR-MPLS |
|---|---|---|
| **PUSH** | Menambahkan segmen ke daftar | Push label |
| **CONTINUE** | Segmen aktif belum selesai, teruskan | Swap (biasanya ke label yang sama bila SRGB seragam) |
| **NEXT** | Segmen aktif selesai, segmen berikutnya menjadi aktif | Pop |

### 3.4 Apa yang hilang dari jaringan

Dengan SR-MPLS, **LDP dan RSVP-TE tidak lagi dibutuhkan**. Label disebarkan oleh IGP yang memang sudah ada (IS-IS atau OSPF). Satu protokol lebih sedikit berarti satu sumber masalah lebih sedikit: tidak ada lagi LDP-IGP sync (yang dibahas di `22-service-provider/01-mpls-ldp` §9), tidak ada lagi sesi LDP yang macet, dan tidak ada ribuan state RSVP.

---

## 4. Jenis SID, SRGB, dan SRLB

### 4.1 Jenis SID

| SID | Cakupan | Diiklankan oleh | Arti instruksi |
|---|---|---|---|
| **Prefix SID** | **Global** di domain SR | IGP, menempel pada prefix | "Kirim ke prefix ini lewat jalur terpendek (ECMP-aware)" |
| **Node SID** | Global | Prefix SID dengan **flag N**, biasanya di loopback | "Kirim ke router ini" |
| **Anycast SID** | Global | Prefix SID yang **sama** diiklankan beberapa router untuk prefix anycast yang sama | "Kirim ke router terdekat dari kelompok ini" |
| **Adjacency SID** | **Lokal** ke router pemiliknya | IGP, menempel pada adjacency | "Keluarkan lewat link/tetangga ini", walau bukan jalur terpendek |
| **Binding SID (BSID)** | Lokal | SR-TE policy | "Masukkan paket ke policy ini" (satu label mewakili seluruh daftar segmen) |
| **BGP Peering SID** (EPE) | Lokal | BGP-LS/BGP | "Keluar ke peer eBGP ini", untuk egress peer engineering (RFC 9087) |

**Node SID vs adjacency SID** adalah pasangan yang paling sering dipakai. Node SID membawa paket lewat jalur terpendek IGP (dengan ECMP), sehingga satu SID bisa mewakili banyak hop. Adjacency SID memaksa satu hop tertentu, berguna untuk memaksa link yang bukan jalur terpendek. Jalur eksplisit apa pun bisa dinyatakan sebagai kombinasi keduanya.

**Anycast SID** berguna untuk redundansi gateway. Dua ABR atau dua router border yang mengiklankan prefix anycast yang sama dengan SID yang sama memberi Anda segmen "ke ABR mana saja yang terdekat". Syaratnya, **semua anggota anycast harus memakai SRGB yang sama** agar label yang dihasilkan konsisten.

### 4.2 SRGB: dari index ke label

Prefix SID biasanya diiklankan sebagai **index**, bukan label. Setiap router menerjemahkan index menjadi label lewat **SRGB (Segment Routing Global Block)** miliknya:

```
label = SRGB_base + index

Contoh (SRGB default banyak vendor: 16000-23999):
  R3 mengiklankan prefix 10.0.0.3/32 dengan index 3
  → di semua router yang SRGB-nya 16000-23999, label untuk R3 = 16003
```

Yang sering disalahpahami: label yang **dikirim keluar** dihitung memakai SRGB **tetangga downstream**, bukan SRGB sendiri. Jika SRGB berbeda-beda:

```
R1 SRGB 16000-23999,  R5 SRGB 900000-907999

R1 mengirim paket untuk R3 (index 3) lewat R5:
  label lokal R1 untuk R3 (yang diterima dari upstream) = 16000 + 3 = 16003
  label keluar ke R5                                     = 900000 + 3 = 900003
```

Secara teknis ini sah (RFC 8402 mengizinkan SRGB berbeda), tetapi operasinya menyiksa: label untuk node yang sama berubah di setiap hop, troubleshooting lebih sulit, dan anycast SID tidak bisa dipakai. **Praktik terbaik: SRGB seragam di seluruh domain.** Dengan SRGB seragam, label 16003 berarti "R3" di mana pun, dan operasi CONTINUE menjadi swap 16003 ke 16003.

⚠️ **SRGB harus tidak bertabrakan dengan label dinamis.** LDP, BGP-LU, dan VPN memakai label dari rentang dinamis. Jika SRGB menimpa rentang itu, router menolak SRGB atau label bentrok. Default IOS XR, misalnya, memisahkan SRGB 16000-23999 dari label dinamis yang dimulai di 24000. Saat memperbesar SRGB, periksa batas platform dan rencanakan karena perubahan SRGB biasanya mengganggu forwarding.

### 4.3 SRLB

**SRLB (Segment Routing Local Block)** adalah rentang label untuk SID lokal yang dikonfigurasi secara manual, misalnya adjacency SID statis atau BSID. Adjacency SID dinamis biasanya diambil dari rentang label dinamis. Lab di modul ini memakai SRGB 16000-23999 dan SRLB 15000-15999 (default FRR).

### 4.4 Flag pada Prefix SID

Flag Prefix SID menentukan perilaku penultimate hop dan cara membaca nilai SID (RFC 8667 §2.1):

| Flag | Nama | Bila diset |
|---|---|---|
| **N** | Node | SID ini mewakili node (node SID) |
| **P** | No-PHP | Penultimate hop **tidak** melakukan pop. Label sampai di node tujuan |
| **E** | Explicit-Null | Penultimate hop mengganti label dengan explicit-null (0 untuk IPv4, 2 untuk IPv6), misalnya agar bit TC/EXP sampai ke egress |
| **V** | Value | Field berisi label absolut, bukan index |
| **L** | Local | SID bermakna lokal |
| **R** | Re-advertisement | Prefix diiklankan ulang (misalnya bocor dari L1 ke L2) |

Kombinasi V/L yang sah hanya V=0,L=0 (index global) atau V=1,L=1 (label lokal). Prefix SID pada loopback hampir selalu berbentuk index dengan N=1 dan P=0, sehingga PHP aktif seperti LDP.

---

## 5. SR-MPLS di IGP: Ekstensi IS-IS dan OSPF

SR tidak menambah protokol baru. Ia menambah **TLV** pada IGP. Bagi IS-IS (RFC 8667), yang paling penting:

| Informasi | Wadah IS-IS | Isi |
|---|---|---|
| Kemampuan SR | **Router Capability TLV 242** → SR-Capabilities sub-TLV 2 | Flag I (MPLS IPv4) dan V (MPLS IPv6), **SRGB** (base + range) |
| Algoritma | TLV 242 → SR-Algorithm sub-TLV 19 | 0 = SPF, 1 = strict SPF, 128-255 = Flex-Algo |
| SRLB | TLV 242 → SRLB sub-TLV 22 | Rentang label lokal |
| Kedalaman stack | TLV 242 → Node MSD sub-TLV 23 (RFC 8491) | Jumlah label maksimum yang bisa didorong router |
| Prefix SID | **Prefix-SID sub-TLV 3** di TLV 135/235/236/237 | Index atau label + flag + algoritma |
| Adjacency SID | **Adj-SID sub-TLV 31** (P2P) / LAN-Adj-SID 32, di TLV 22/23/222/223 | Label lokal per adjacency, flag F, B, V, L, S, P |
| Mapping server | **SID/Label Binding TLV 149** | Prefix SID untuk prefix milik router lain (§7) |

Flag **B (Backup)** pada adjacency SID menandakan adjacency itu **dilindungi** FRR. Banyak implementasi mengalokasikan dua adjacency SID per tetangga: satu terlindungi dan satu tidak terlindungi. Anda akan melihatnya di lab.

OSPF memakai mekanisme yang setara (RFC 8665, memakai Opaque LSA dari RFC 7684):

| Informasi | Wadah OSPFv2 |
|---|---|
| SRGB, algoritma, SRLB, MSD | **Router Information Opaque LSA** (opaque type 4) |
| Prefix SID | **Extended Prefix Opaque LSA** (opaque type 7) |
| Adjacency SID | **Extended Link Opaque LSA** (opaque type 8) |

Karena memakai Opaque LSA, OSPF butuh `capability opaque` dan Router Information LSA aktif. Untuk OSPFv3 ada RFC 8666 dengan LSA extended milik OSPFv3.

Begini rupa LSP IS-IS yang membawa informasi SR, diambil dari lab di §14 (router r2):

```
r1# show isis database detail r2.00-00
LSP ID                  PduLen  SeqNumber   Chksum  Holdtime  ATT/P/OL
r2.00-00                  162   0x00000002  0xd162     983    0/0/0
  ...
  Router Capability: 10.0.0.2 , D:0, S:0
    Segment Routing: I:1 V:1, Global Block Base: 16000 Range: 8000     ← SRGB
    SR Local Block Base: 15000 Range: 1000                              ← SRLB
    SR Algorithm:
      0: SPF
    Node Maximum SID Depth: 8                                           ← MSD
  Extended Reachability: 0000.0000.0001.00 (Metric: 10)
    Adjacency-SID: 15000, Weight: 0, Flags: F:0 B:0, V:1, L:1, S:0, P:0 ← adj SID ke r1
  Extended Reachability: 0000.0000.0003.00 (Metric: 10)
    Adjacency-SID: 15001, Weight: 0, Flags: F:0 B:0, V:1, L:1, S:0, P:0
  Extended IP Reachability: 10.0.0.2/32 (Metric: 10)
    Subtlvs:
      SR Prefix-SID Index: 2, Algorithm: 0, Flags: NODE PHP              ← node SID index 2
```

Cara membacanya: r2 menyatakan dirinya mampu SR-MPLS (I:1 V:1), memakai SRGB 16000 sampai 23999 (base 16000, range 8000), mampu mendorong 8 label, dan loopback-nya 10.0.0.2/32 punya node SID index 2. Dengan SRGB seragam, semua router memasang label **16002** untuk r2.

---

## 6. Konfigurasi SR-MPLS Multi-Vendor

Contoh di bawah memakai skema yang sama dengan lab: loopback R1 = 10.0.0.1/32, index 1, SRGB 16000-23999.

### Cisco IOS XR

```
segment-routing
 global-block 16000 23999
!
router isis CORE
 is-type level-2-only
 net 49.0001.0000.0000.0001.00
 address-family ipv4 unicast
  metric-style wide
  segment-routing mpls                ← aktifkan SR-MPLS untuk AF ini
 !
 interface Loopback0
  passive
  address-family ipv4 unicast
   prefix-sid index 1                 ← node SID (N-flag otomatis di loopback /32)
 !
 interface HundredGigE0/0/0/0
  point-to-point
  address-family ipv4 unicast
   fast-reroute per-prefix
   fast-reroute per-prefix ti-lfa     ← lihat §8
```

Untuk OSPF di IOS XR:
```
router ospf 1
 segment-routing mpls
 area 0
  segment-routing mpls
  interface Loopback0
   prefix-sid index 1
```

Verifikasi: `show isis segment-routing label table`, `show mpls forwarding`, `show isis database verbose`, `show segment-routing local-block inconsistencies`.

### Juniper Junos

```
set interfaces et-0/0/0 unit 0 family iso
set interfaces et-0/0/0 unit 0 family mpls
set protocols mpls interface et-0/0/0.0
set protocols isis level 1 disable
set protocols isis level 2 wide-metrics-only
set protocols isis interface lo0.0 passive
set protocols isis interface et-0/0/0.0 point-to-point
set protocols isis source-packet-routing srgb start-label 16000 index-range 8000
set protocols isis source-packet-routing node-segment ipv4-index 1
```

Di Junos, SR disebut **SPRING** dan konfigurasinya ada di bawah `source-packet-routing`. Rute SR IS-IS masuk ke tabel `inet.3` dengan protokol `L-ISIS`. Verifikasi: `show isis overview`, `show route table inet.3`, `show route table mpls.0`, `show isis database extensive`.

### FRRouting (isisd dan ospfd)

```
router isis CORE
 net 49.0001.0000.0000.0001.00
 is-type level-2-only
 metric-style wide
 segment-routing on
 segment-routing global-block 16000 23999 local-block 15000 15999
 segment-routing node-msd 8
 segment-routing prefix 10.0.0.1/32 index 1
!
interface lo
 ip address 10.0.0.1/32
 ip router isis CORE
 isis passive
!
interface eth1
 ip router isis CORE
 isis network point-to-point
 isis fast-reroute ti-lfa
```

Untuk ospfd, SR membutuhkan Opaque LSA dan Router Information LSA:
```
router ospf
 ospf router-id 10.0.0.1
 capability opaque
 mpls-te on
 router-info area
 segment-routing on
 segment-routing global-block 16000 23999
 segment-routing node-msd 8
 segment-routing prefix 10.0.0.1/32 index 1
 fast-reroute ti-lfa                     ← dokumentasi FRR: baru untuk interface P2P
```

⚠️ FRR memakai dataplane MPLS **kernel Linux**. Tanpa `modprobe mpls_router mpls_iptunnel` di host dan `net.mpls.platform_labels` di setiap namespace, isisd tetap mengiklankan SID tetapi zebra gagal memasang label. Lab di §14 mengurus ini lewat skrip start.

### Nokia SR Linux

SR Linux mengonfigurasi SR-MPLS lewat model YANG. Contoh di bawah ditulis dalam bentuk `set` dan disusun dari jalur konfigurasi yang dipakai template netlab untuk SR Linux:

```
set / system mpls label-ranges static srgb start-label 16000 end-label 23999
set / system mpls label-ranges dynamic dyn start-label 100000 end-label 199999
set / network-instance default segment-routing mpls global-block label-range srgb
set / network-instance default protocols isis dynamic-label-block dyn
set / network-instance default protocols isis instance CORE segment-routing mpls dynamic-adjacency-sids all-interfaces true
set / network-instance default protocols isis instance CORE interface system0.0 segment-routing mpls ipv4-node-sid index 1
```

⚠️ Menurut catatan proyek netlab, SR-MPLS di SR Linux hanya didukung pada platform tertentu (7250 IXR dan 7730 SXR), bukan pada tipe 7220 yang menjadi default container. Konfigurasi ini **belum diverifikasi** di lab modul ini. Periksa dokumentasi rilis SR Linux Anda sebelum memakainya.

---

## 7. Migrasi dari LDP ke SR

Hampir tidak ada operator yang membangun backbone SR dari nol. Yang umum adalah backbone LDP yang ingin pindah ke SR **tanpa downtime**. Kuncinya: SR dan LDP bisa berjalan bersamaan (*ships in the night*) karena keduanya hanya mengisi LFIB dengan label dari rentang berbeda.

### 7.1 Tahapan yang lazim

```
Tahap 0  LDP saja                    : semua LSP berbasis LDP
Tahap 1  SR diaktifkan, LDP tetap    : router mengiklankan SID, LFIB punya label LDP dan SR,
                                       tetapi headend MASIH memakai label LDP (default)
Tahap 2  sr-prefer                   : headend memilih label SR untuk FEC yang punya SID
Tahap 3  router lama tanpa SR        : mapping server memberi SID "atas nama" mereka,
                                       interworking SR-LDP menjembatani di perbatasan
Tahap 4  LDP dimatikan               : setelah semua node mendukung SR dan trafik sudah lewat SR
```

**Preferensi default.** Saat sebuah prefix punya label LDP sekaligus prefix SID, kebanyakan implementasi tetap memakai LDP sampai Anda memintanya lain. Di IOS XR, `segment-routing mpls sr-prefer` di address-family IS-IS (atau di proses OSPF) membuat label SR dipakai. Di Junos, rute LDP di `inet.3` defaultnya punya preference lebih baik daripada rute `L-ISIS`, sehingga Anda perlu menyesuaikan preference. Periksa hasilnya dengan `show route table inet.3`.

### 7.2 Mapping server untuk router yang belum bisa SR

Router lama yang tidak mendukung SR tidak bisa mengiklankan prefix SID untuk loopback-nya. **SR Mapping Server (SRMS)** mengiklankan SID itu atas nama mereka lewat SID/Label Binding TLV 149 (IS-IS) atau Extended Prefix Range TLV (OSPF):

```
IOS XR (di satu atau dua router yang menjadi mapping server):
segment-routing
 mapping-server
  prefix-sid-map
   address-family ipv4
    10.0.0.20/32 20 range 5          ← 10.0.0.20 sampai 10.0.0.24 → index 20 sampai 24
!
router isis CORE
 address-family ipv4 unicast
  segment-routing prefix-sid-map advertise-local
```

Mapping server **hanya mengiklankan** pemetaan. Ia tidak berada di jalur data. Router SR lain (klien) memakai pemetaan itu untuk memasang label SR menuju router lama. Jika ada konflik (dua sumber memberi SID berbeda untuk prefix yang sama), aturan RFC 8661 dan preferensi SRMS (sub-TLV 24) menentukan pemenangnya. Konflik semacam ini adalah sumber gangguan klasik saat migrasi, jadi pantau dengan perintah inkonsistensi milik platform Anda.

### 7.3 Interworking di perbatasan (RFC 8661)

```
  [domain SR]                    [domain LDP]
  PE1 ── P1 ── P2(SR+LDP) ── P3(LDP saja) ── PE9(LDP saja)

  PE1 → PE9 : PE1 memakai prefix SID PE9 (dari mapping server)
              P2 adalah router terakhir yang punya SID dan juga label LDP:
              ia "menjahit" (stitch) label SR 16009 menjadi label LDP yang
              diberikan P3 untuk FEC PE9
  PE9 → PE1 : LDP sampai P2, lalu P2 menukar label LDP-nya untuk PE1
              dengan label SR 16001
```

Penjahitan ini otomatis terjadi di router yang menjalankan keduanya: LFIB-nya punya entri masuk dari satu dunia dan entri keluar ke dunia lain untuk FEC yang sama.

💡 **Bonus migrasi:** TI-LFA bisa melindungi trafik yang masih berbasis LDP juga, asalkan router PLR dan jalur perbaikannya mendukung SR. Banyak operator mengaktifkan SR hanya untuk mendapatkan TI-LFA, jauh sebelum LDP dimatikan.

Pada saat penulisan, dokumentasi isisd FRR tidak memuat perintah mapping server, sehingga bagian ini tidak dipraktikkan di lab.

---

## 8. Fast Reroute: LFA, Remote LFA, TI-LFA, dan Microloop

### 8.1 Kerangka IP Fast Reroute

Semua mekanisme di bagian ini mengikuti pola yang sama (kerangka RFC 5714):

1. **Sebelum** gangguan, router menghitung jalur cadangan untuk setiap tujuan, untuk kasus "jika link (atau node) X putus".
2. Jalur cadangan itu **sudah dipasang di FIB** sebagai backup next-hop.
3. Saat link putus (deteksi lewat loss of signal atau BFD), line card langsung beralih ke backup, tanpa menunggu SPF. Inilah fase **perlindungan lokal** yang singkat.
4. IGP kemudian konvergen dan menghitung jalur baru. Jalur baru menggantikan backup.

Router yang melakukan ini disebut **PLR**, sama seperti di RSVP-TE.

### 8.2 LFA klasik (RFC 5286)

Router S ingin melindungi trafik ke tujuan D yang biasanya lewat tetangga F. Tetangga lain N adalah **LFA (Loop-Free Alternate)** jika N tidak akan mengirim paket kembali ke S:

```
Syarat loop-free (inequality 1):   dist(N, D) < dist(N, S) + dist(S, D)
```

Artinya, jalur terpendek N ke D tidak lewat S. Jika syarat terpenuhi, S cukup mengirim paket IP biasa ke N saat link S-F putus.

Masalahnya, **cakupan LFA bergantung topologi**. Di topologi cincin (ring) dan topologi yang jarang, banyak tujuan tidak punya LFA. Ini cincin lima router yang dipakai di lab, semua metrik 10:

```
        r1 ──── r2
       /          \
     r5            r3
       \          /
        r4 ──────
```

r1 ingin melindungi link r1-r2 untuk tujuan **r2**. Satu-satunya tetangga lain adalah r5:

```
dist(r5, r2) = 20  (r5 → r1 → r2)
dist(r5, r1) + dist(r1, r2) = 10 + 10 = 20
20 < 20 ?  TIDAK → r5 bukan LFA untuk r2
```

Jika r1 mengirim paket ke r5, r5 akan mengembalikannya ke r1 karena menurut r5 jalur terpendek ke r2 lewat r1. Itu loop. Di lab, LFA klasik hanya melindungi 60% tujuan di r1 (lihat §14).

### 8.3 Remote LFA (RFC 7490)

Remote LFA mencari node yang **lebih jauh** dan mengirim paket ke sana lewat **tunnel** (biasanya targeted LDP). Konsep yang diperkenalkan:

- **P-space** milik S terhadap link S-F: node yang bisa dicapai S lewat jalur terpendek **tanpa** melewati link S-F.
- **Extended P-space**: gabungan P-space semua tetangga S (selain via link yang dilindungi). Lebih luas, jadi lebih mudah menemukan kandidat.
- **Q-space** milik F (atau D) terhadap link S-F: node yang jalur terpendeknya ke tujuan **tidak** melewati link S-F.
- **PQ node**: node di irisan P-space dan Q-space. S mengirim paket lewat tunnel ke PQ node, dan dari sana paket mengalir alami ke tujuan.

Di cincin lab, untuk link r1-r2 dan tujuan r2:

```
P-space r1 (tanpa link r1-r2)        : r5 (10), r4 (20)
Extended P-space (lewat tetangga r5) : r5, r4, r3   (r5→r3 = 20 lewat r4, bukan lewat r1)
Q-space r2 (tanpa link r1-r2)        : r3 (10), r4 (20 lewat r3)
PQ node                              : r4 (dan r3 di extended P-space)
```

rLFA bekerja di contoh ini, tetapi ia tetap punya kelemahan: butuh sesi targeted LDP ke PQ node, tidak selalu ada PQ node di topologi tertentu, dan jalur cadangannya belum tentu sama dengan jalur setelah konvergensi.

### 8.4 TI-LFA (RFC 9855)

**Topology Independent LFA** memakai kemampuan SR untuk menyatakan **jalur apa pun** sebagai daftar segmen. Dua gagasan utamanya:

1. **Cakupan 100%** untuk kegagalan tunggal (link, node, atau SRLG) selama topologi masih tersambung setelah gangguan. Tidak perlu ada PQ node alami. Jika P-space dan Q-space tidak beririsan, TI-LFA menyambungkannya dengan **adjacency SID** dari node P ke node Q.
2. **Jalur cadangan = jalur pasca-konvergensi** (*post-convergence path*). TI-LFA menghitung jalur yang akan dipakai IGP **setelah** konvergensi, lalu mengekspresikannya sebagai daftar segmen. Akibatnya trafik tidak berpindah jalur dua kali (sekali ke backup, sekali ke jalur baru), dan kapasitas bisa direncanakan untuk satu skenario saja.

Bentuk *repair list* yang mungkin:

| Situasi | Daftar segmen yang didorong PLR |
|---|---|
| Tetangga N sudah LFA | Tidak ada tambahan, cukup kirim ke N (seperti LFA) |
| Ada PQ node | `[node SID PQ]`, lalu SID tujuan |
| P dan Q bertetangga tetapi tidak beririsan | `[node SID P, adj SID P→Q]`, lalu SID tujuan |
| Kasus lebih rumit | Beberapa segmen, dibatasi MSD |

Di lab, r1 menghitung backup untuk r2 sebagai berikut (output asli FRR):

```
r1# show ip route 10.0.0.2/32
Routing entry for 10.0.0.2/32
  Known via "isis", distance 115, metric 20, best
  * 10.1.12.2, via eth1, label implicit-null, weight 1, backup 0
      b 10.1.15.5, via eth2, label 16003/16002, weight 1
```

Jalur utama: langsung ke r2 (implicit-null, karena r1 adalah penultimate hop). Jalur cadangan: kirim ke r5 dengan stack `[16003, 16002]`. Artinya "pergi ke r3 dulu (node SID r3), lalu ke r2". FRR memilih r3, yang ada di extended P-space dan Q-space. r4 juga PQ node yang sah. Keduanya memberi kedalaman stack yang sama.

**Mode proteksi:**

| Mode | Yang dihindari jalur cadangan | Catatan |
|---|---|---|
| Link protection | Link yang putus | Default di kebanyakan implementasi |
| Node protection | Seluruh node tetangga | Lebih aman bila router tetangga yang mati, tetapi cakupannya bisa lebih rendah |
| SRLG protection | Semua link yang berbagi risiko (duct, kabel laut, perangkat transmisi yang sama) | Butuh SRLG dikonfigurasi dengan benar di IGP |

💡 **SRLG sangat relevan di Indonesia.** Dua "link berbeda" antarpulau sering menumpang kabel laut atau sistem transmisi yang sama. Tanpa SRLG, TI-LFA bisa memilih backup yang ikut putus bersama link utama.

### 8.5 Microloop

Setelah gangguan, router-router di jaringan tidak memperbarui FIB pada saat yang persis sama. Selama beberapa ratus milidetik, router A sudah memakai jalur baru yang mengarah ke B, sementara B masih memakai jalur lama yang mengarah ke A. Paket memantul antara A dan B sampai TTL habis. Ini disebut **microloop**, dan ia bisa terjadi bahkan saat FRR bekerja sempurna, karena FRR hanya melindungi PLR.

Mitigasi:

- **Local convergence delay (RFC 8333):** PLR sengaja menunda pembaruan FIB-nya (memakai backup FRR lebih lama) sampai router lain sempat konvergen. Ini mencegah microloop untuk kegagalan link yang bersebelahan.
- **SR microloop avoidance:** setelah perubahan topologi, router yang mendeteksi risiko loop sementara mengirim trafik dengan **daftar segmen yang bebas loop** menuju tujuan, lalu kembali ke forwarding biasa setelah timer habis. Contoh IOS XR:

```
router isis CORE
 address-family ipv4 unicast
  microloop avoidance segment-routing
  microloop avoidance rib-update-delay 5000
```

### 8.6 Konfigurasi TI-LFA

**IOS XR:**
```
router isis CORE
 interface HundredGigE0/0/0/0
  point-to-point
  address-family ipv4 unicast
   fast-reroute per-prefix
   fast-reroute per-prefix ti-lfa
   fast-reroute per-prefix tiebreaker node-protecting index 100
   fast-reroute per-prefix tiebreaker srlg-disjoint index 200
```
Verifikasi: `show isis fast-reroute summary`, `show isis fast-reroute 10.0.0.2/32 detail`, `show cef 10.0.0.2/32 detail` (cari "backup").

**Junos:**
```
set protocols isis interface et-0/0/0.0 level 2 post-convergence-lfa
set protocols isis interface et-0/0/1.0 level 2 post-convergence-lfa node-protection
set protocols isis backup-spf-options use-post-convergence-lfa
set protocols isis backup-spf-options use-source-packet-routing
```
Di Junos, TI-LFA disebut **post-convergence LFA**. Verifikasi: `show isis backup coverage`, `show isis backup spf results`, `show route 10.0.0.2 extensive`.

**FRRouting:**
```
interface eth1
 isis fast-reroute ti-lfa                      ← link protection
!
interface eth2
 isis fast-reroute ti-lfa node-protection link-fallback
```
`link-fallback` meminta FRR memakai proteksi link untuk tujuan yang tidak bisa dilindungi secara node. Verifikasi: `show isis route backup`, `show isis fast-reroute summary`, `show ip route <prefix>` (baris berawalan `b`), `show mpls table <label>`.

⚠️ **Batas FRR di kernel Linux.** FRR menghitung backup TI-LFA dan menyimpannya di RIB zebra (terlihat sebagai `backup 0` dan baris `b`), tetapi kernel Linux tidak punya konsep backup next-hop di FIB. `ip route` di lab hanya menampilkan jalur utama. Saat link putus, pemulihan di lab terjadi karena isisd langsung bereaksi terhadap interface down dan menjalankan SPF, yang di container sangat cepat. Ini **bukan** perlindungan FIB tingkat hardware seperti di router fisik. Konsep, perhitungan, dan label stack-nya sama, tetapi angka waktu pemulihan di lab tidak boleh dipakai sebagai patokan perangkat produksi.

---

## 9. SR-TE Policy: Color, Endpoint, Candidate Path, ODN

### 9.1 Anatomi SR Policy (RFC 9256)

SR Policy adalah pengganti "tunnel TE". Ia diidentifikasi oleh tuple **(headend, color, endpoint)**:

- **Endpoint**: alamat tujuan policy (biasanya loopback PE tujuan).
- **Color**: bilangan 32 bit tidak nol yang mewakili **niat** (*intent*), misalnya 100 = latensi rendah, 200 = hindari kabel laut, 300 = bandwidth besar. Color tidak punya arti teknis bawaan. Operator yang mendefinisikannya.
- **Candidate path**: satu policy bisa punya beberapa calon jalur dengan **preference**. Calon valid dengan preference tertinggi menjadi *active candidate path*.

```
SR Policy (color 10, endpoint 10.0.0.3)
 ├─ candidate path pref 200 : dynamic (CSPF/PCE, metric latency)       ← dipakai jika valid
 ├─ candidate path pref 100 : explicit segment-list [16004, 16003]    ← cadangan
 └─ BSID 1010                                                          ← label pintu masuk policy
```

Jenis candidate path:

| Jenis | Isi | Dihitung oleh |
|---|---|---|
| **Explicit** | Daftar segmen ditulis manual (label atau alamat yang diterjemahkan ke SID) | Operator |
| **Dynamic** | Batasan dan objektif (metrik IGP/TE/latency, affinity, disjointness, batas jumlah SID) | Headend (SR-TE CSPF) atau PCE |
| **Composite** | Kumpulan policy lain dengan bobot | Headend |

Candidate path bisa berasal dari konfigurasi lokal, dari PCE lewat PCEP, atau dari controller lewat BGP SR Policy (RFC 9830). Asal-usul ini disebut **protocol-origin** dan ikut menentukan pemilihan.

### 9.2 Steering: bagaimana trafik masuk ke policy

Membuat policy saja tidak cukup. Trafik harus **diarahkan** (*steered*) ke dalamnya:

1. **Automated steering berbasis color (paling umum).** PE tujuan mengiklankan rute BGP (misalnya rute VPNv4 pelanggan) dengan **Color Extended Community** (RFC 9012). PE asal melihat rute dengan next-hop N dan color C, lalu otomatis memakai SR Policy (C, N) jika ada. Satu policy bisa melayani ribuan rute. Tidak perlu `autoroute` atau static route ke tunnel.
2. **Binding SID.** Router lain (atau controller) cukup mendorong satu label BSID. Headend menerjemahkannya menjadi seluruh daftar segmen. BSID juga dipakai untuk menyembunyikan stack panjang dari router yang MSD-nya kecil.
3. **Per-flow steering** (RFC 9256 §8.6): pemilihan policy berdasarkan kelas trafik (misalnya bit DSCP), bukan hanya berdasarkan tujuan.
4. **Static route / autoroute** ke policy, mirip cara lama.

### 9.3 ODN: policy yang dibuat sesuai permintaan

Membuat policy manual untuk setiap pasangan (color, PE) tidak berskala. **ODN (On-Demand Next-hop)**, istilah Cisco untuk mekanisme yang dibahas RFC 9256 §8.5, membalik caranya: operator hanya mendefinisikan **template per color**. Saat rute BGP dengan color 100 dan next-hop PE7 tiba, headend otomatis membuat SR Policy (100, PE7) memakai template itu, dan menghapusnya ketika rute hilang.

```
IOS XR, headend:
segment-routing
 traffic-eng
  on-demand color 100
   dynamic
    metric
     type latency                 ← jalur latensi terendah (butuh pengukuran delay)
  !
  on-demand color 129
   dynamic
    sid-algorithm 129             ← pakai topologi Flex-Algo 129 (§10), misalnya tanpa kabel laut
!
IOS XR, PE tujuan (memberi warna pada rute pelanggan):
extcommunity-set opaque LATENSI-RENDAH
  100
end-set
!
route-policy WARNAI-VOICE
  set extcommunity color LATENSI-RENDAH
  pass
end-policy
!
vrf VOICE
 address-family ipv4 unicast
  export route-policy WARNAI-VOICE
```

Hasilnya: semua rute VRF VOICE di seluruh PE otomatis lewat jalur latensi terendah, tanpa satu pun policy dibuat manual. Color 129 memperlihatkan pola lain: color dipetakan ke Flex-Algo, sehingga jalurnya cukup dinyatakan dengan satu prefix SID algoritma itu.

### 9.4 Konfigurasi SR Policy eksplisit

**IOS XR:**
```
segment-routing
 traffic-eng
  segment-list LEWAT-R5-R4
   index 10 mpls label 16004
   index 20 mpls label 16003
  !
  policy HIJAU-KE-R3
   binding-sid mpls 1010
   color 10 end-point ipv4 10.0.0.3
   candidate-paths
    preference 200
     dynamic
      metric
       type te
    !
    preference 100
     explicit segment-list LEWAT-R5-R4
```
Verifikasi: `show segment-routing traffic-eng policy color 10`, `show segment-routing traffic-eng forwarding policy`.

**Junos:**
```
set protocols source-packet-routing segment-list LEWAT-R5-R4 hop1 label 16004
set protocols source-packet-routing segment-list LEWAT-R5-R4 hop2 label 16003
set protocols source-packet-routing source-routing-path HIJAU-KE-R3 to 10.0.0.3
set protocols source-packet-routing source-routing-path HIJAU-KE-R3 color 10
set protocols source-packet-routing source-routing-path HIJAU-KE-R3 binding-sid 1010
set protocols source-packet-routing source-routing-path HIJAU-KE-R3 primary LEWAT-R5-R4
```
Verifikasi: `show spring-traffic-engineering lsp detail`, `show route table inetcolor.0`.

**FRRouting (pathd),** dipakai di lab:
```
segment-routing
 traffic-eng
  segment-list LEWAT-R5-R4
   index 10 mpls label 16004
   index 20 mpls label 16003
  !
  policy color 10 endpoint 10.0.0.3
   binding-sid 1010
   candidate-path preference 100 name EKSPLISIT explicit segment-list LEWAT-R5-R4
!
route-map WARNA-HIJAU permit 10
 set sr-te color 10                 ← "mewarnai" rute BGP yang diterima
!
router bgp 65000
 neighbor 10.0.0.3 remote-as 65000
 address-family ipv4 unicast
  neighbor 10.0.0.3 route-map WARNA-HIJAU in
```

Di FRR, warna bisa berasal dari Color Extended Community yang dikirim peer, atau ditetapkan lokal dengan `set sr-te color` di route-map inbound seperti contoh di atas. pathd juga mendukung candidate path dinamis (`candidate-path preference N name X dynamic` dengan batasan seperti `metric te`, `bandwidth`, `affinity`), tetapi hitungannya bergantung pada PCE. Dokumentasi FRR menyebut dukungan TE untuk IS-IS di pathd "belum sepenuhnya diuji".

### 9.5 Batas MSD

Setiap SID di SR-MPLS adalah satu label 4 byte. Daftar 6 segmen berarti 24 byte tambahan, dan setiap ASIC punya batas jumlah label yang bisa didorong sekaligus (**MSD**, diiklankan di IGP). Jika daftar segmen melebihi MSD headend, policy menjadi tidak valid. Cara mengatasinya:

- Pakai **node SID** sebanyak mungkin (satu node SID menggantikan banyak adjacency SID).
- Pecah jalur dengan **BSID** di router tengah (*stitching*): headend mendorong `[..., BSID]`, router tengah mengganti BSID dengan sisa daftar.
- Beri batas `sid-limit` pada candidate path dinamis agar CSPF memilih jalur yang bisa diekspresikan dalam N label.
- Pertimbangkan **Flex-Algo** (§10), yang sering membuat jalur khusus cukup dinyatakan dengan **satu** SID.

---

## 10. Flexible Algorithm

### 10.1 Ide

SR Policy dinamis bergantung pada headend atau PCE untuk menghitung jalur, lalu mendorong beberapa SID. **Flex-Algo** (RFC 9350) mengambil pendekatan lain: seluruh router IGP menghitung **topologi tambahan** dengan aturan yang disepakati bersama, dan setiap node punya **prefix SID khusus** untuk topologi itu.

```
Algoritma 0   : SPF biasa, metrik IGP, semua link        → node SID index 3   (label 16003)
Flex-Algo 128 : metrik DELAY, semua link                  → node SID index 103 (label 16103)
Flex-Algo 129 : metrik IGP, KECUALI link berwarna MERAH   → node SID index 203 (label 16203)
```

Mengirim paket dengan label 16103 berarti "pergi ke R3 lewat jalur **latensi terendah**", dan cukup satu label. Setiap router di jalur menghitung sendiri jalur algoritma 128 dan meneruskan sesuai hasilnya.

### 10.2 Flexible Algorithm Definition (FAD)

FAD adalah definisi algoritma yang diiklankan di IGP:

| Komponen FAD | Isi |
|---|---|
| Nomor algoritma | 128 sampai 255 |
| Metric type | IGP, **min unidirectional link delay**, atau TE metric. RFC 9843 menambah jenis metrik dan batasan lain, termasuk bandwidth |
| Calculation type | 0 = SPF |
| Batasan | Exclude-any, include-any, include-all **affinity**, exclude **SRLG** |
| Priority | Jika beberapa router mengiklankan FAD berbeda untuk nomor yang sama, yang prioritasnya tertinggi (lalu system ID tertinggi) menang |

Router hanya ikut algoritma 128 jika ia mengiklankan dukungan untuk algoritma itu. Router yang tidak ikut dikeluarkan dari topologi algoritma tersebut.

### 10.3 Pemakaian umum

- **Plane latensi rendah** untuk voice, 5G fronthaul/midhaul, dan trading: Flex-Algo dengan metrik delay. Butuh pengukuran delay link (performance measurement, TWAMP) agar metriknya bermakna.
- **Dual-plane disjoint**: algoritma 128 hanya memakai link "plane A", algoritma 129 hanya "plane B". Pelanggan yang butuh dua jalur yang tidak berbagi link cukup diberi dua node SID dari dua algoritma.
- **Menghindari kelas link tertentu**: link sewa, microwave, atau kabel laut yang sedang rawan.

Flex-Algo menyatu dengan SR-TE lewat ODN: color tertentu dipetakan ke algoritma tertentu (`sid-algorithm 128` di IOS XR), dan TI-LFA juga dihitung per algoritma.

### 10.4 Konfigurasi

**IOS XR:**
```
router isis CORE
 affinity-map MERAH bit-position 1
 flex-algo 128
  metric-type delay
  advertise-definition
 !
 flex-algo 129
  affinity exclude-any MERAH
  advertise-definition
 !
 interface Loopback0
  address-family ipv4 unicast
   prefix-sid index 3
   prefix-sid algorithm 128 index 103
   prefix-sid algorithm 129 index 203
 !
 interface HundredGigE0/0/0/2
  affinity flex-algo MERAH
!
segment-routing
 traffic-eng
  on-demand color 128
   dynamic
    sid-algorithm 128
```

**FRRouting:**
```
router isis CORE
 affinity-map MERAH bit-position 1
 flex-algo 129
  advertise-definition
  affinity exclude-any MERAH
 !
 segment-routing prefix 10.0.0.3/32 algorithm 129 index 203
!
interface eth2
 isis affinity flex-algo MERAH
```
Verifikasi FRR: `show isis flex-algo`, `show isis segment-routing node algorithm 129`, `show isis route algorithm 129`. Dokumentasi FRR menyebut bahwa dari metric type `igp`, `te`, dan `delay`, saat ini **hanya `igp` yang berfungsi**. Flex-Algo berbasis delay belum bisa dipraktikkan dengan FRR.

---

## 11. Controller: PCE, PCEP, dan BGP-LS

### 11.1 Kenapa butuh controller

Headend hanya tahu topologi **area/level IGP-nya sendiri**. Beberapa kebutuhan tidak bisa dipenuhi dengan perhitungan lokal:

- **Jalur antar-domain** (melewati beberapa area IS-IS atau beberapa AS).
- **Disjointness antar-headend**: "LSP dari PE1 dan LSP dari PE2 untuk pelanggan bank tidak boleh berbagi link." Masing-masing headend tidak tahu jalur headend lain.
- **Optimasi global bandwidth**: menempatkan ribuan policy agar tidak ada link yang penuh, yang butuh pandangan seluruh jaringan dan data trafik.

### 11.2 PCE dan PCEP

**PCE (Path Computation Element)** adalah komponen yang menghitung jalur atas nama router. Router yang meminta disebut **PCC (Path Computation Client)**. Keduanya berbicara dengan **PCEP** (RFC 5440, di atas TCP port 4189).

| Model | Cara kerja | RFC |
|---|---|---|
| Stateless | PCC meminta jalur (PCReq), PCE menjawab (PCRep), lalu lupa | RFC 5440 |
| **Stateful, PCC-initiated** | PCC melaporkan semua LSP/policy-nya (PCRpt). PCE boleh memperbarui jalurnya (PCUpd), *delegation* | RFC 8231 |
| **Stateful, PCE-initiated** | PCE yang memutuskan membuat policy di headend (PCInitiate) | RFC 8281 |
| Ekstensi SR | Membawa daftar SID (SR-ERO) | RFC 8664 (SR-MPLS), RFC 9603 (SRv6) |
| Binding SID | Membawa BSID | RFC 9604 |

### 11.3 BGP-LS: bagaimana controller melihat topologi

Controller harus tahu topologi lengkap, termasuk SID dan atribut TE. Ia tidak perlu ikut IGP: cukup satu atau dua router per domain yang **mengekspor LSDB ke BGP** dalam address family **BGP-LS** (RFC 9552, menggantikan RFC 7752). Ekstensi lain membawa SID SR, SRv6 (RFC 9514), Flex-Algo (RFC 9351), dan metrik performa seperti delay (RFC 8571).

```
           ┌────────────────────────────┐
           │  Controller / PCE          │
           │  (TED dari BGP-LS)         │
           └──────▲───────────┬─────────┘
       BGP-LS     │           │ PCEP (PCInitiate / PCUpd)
     (topologi)   │           ▼
   ┌──────────────┴─┐     ┌────────┐
   │ RR / router IGP│     │ PE1    │ headend (PCC)
   │ "distribute    │     └────────┘
   │  link-state"   │
   └────────────────┘
```

IOS XR:
```
router isis CORE
 distribute link-state level 2
!
router bgp 65000
 address-family link-state link-state
 neighbor 10.0.0.100
  remote-as 65000
  address-family link-state link-state
!
segment-routing
 traffic-eng
  pcc
   source-address ipv4 10.0.0.1
   pce address ipv4 10.0.0.100
    precedence 10
```

FRR pathd (sebagai PCC; pathd harus dijalankan dengan modul `-M pathd_pcep`):
```
segment-routing
 traffic-eng
  pcep
   pce-config GRUP1
    source-address ip 10.0.0.1
   !
   pce PCE1
    config GRUP1
    address ip 10.0.0.100
   !
   pcc
    peer PCE1 precedence 10
```

**Produk di lapangan.** Controller komersial yang umum: Cisco Crosswork Network Controller/Optimization Engine (penerus SR-PCE/XTC), Juniper Paragon Pathfinder (penerus NorthStar), dan Nokia Network Services Platform. Di dunia sumber terbuka ada OpenDaylight (PCEP dan BGP-LS), proyek Jalapeno dari Cisco (pengumpul data BGP-LS untuk SR), serta beberapa PCE ringan. Lab modul ini tidak menyertakan PCE: PCC FRR bisa dicoba terhadap PCE sumber terbuka, tetapi kombinasi itu belum penulis uji.

---

## 12. SRv6

### 12.1 SID adalah alamat IPv6

Di SRv6, setiap SID adalah **alamat IPv6 128 bit** dengan struktur (RFC 8986):

```
|<------------- Locator ------------->|<- Function ->|<- Argument ->|
|      Block      |      Node         |              |              |
   B bit              N bit               F bit           A bit
```

- **Locator** (Block + Node) diiklankan di IGP sebagai **prefix IPv6 biasa**. Router transit yang tidak paham SRv6 tetap bisa meneruskan paket ke locator ini dengan routing IPv6 standar. Inilah keunggulan terbesar SRv6.
- **Function** menunjuk instruksi lokal di node pemilik locator: "decapsulate dan lookup di VRF X", "keluar lewat link Y", dan sebagainya.
- **Argument** opsional, untuk instruksi yang butuh parameter.

RFC 9602 menyisihkan blok **`5f00::/16`** untuk SID SRv6. Banyak operator dan contoh vendor juga memakai blok ULA seperti `fcbb:bbbb::/32` (dipakai lab ini) atau alamat global milik sendiri.

### 12.2 Endpoint behavior

Instruksi di SRv6 disebut **behavior** (RFC 8986). Yang paling sering Anda temui:

| Behavior | Arti | Padanan SR-MPLS |
|---|---|---|
| **End** | Endpoint biasa: lanjutkan ke segmen berikutnya | Node SID |
| **End.X** | Lanjutkan ke segmen berikutnya **lewat adjacency tertentu** | Adjacency SID |
| **End.T** | Lanjutkan, lookup di tabel tertentu | |
| **End.DX4 / End.DX6** | Decapsulate, kirim ke next-hop IPv4/IPv6 tertentu (per-CE) | Label VPN per-CE |
| **End.DT4 / End.DT6** | Decapsulate, **lookup di tabel VRF** IPv4/IPv6 | Label VPN per-VRF |
| **End.DT46** | Seperti DT4 dan DT6 dalam satu SID | |
| **End.DX2 / End.DT2U / End.DT2M** | Layanan L2 (EVPN) | Label EVPN |
| **End.B6.Encaps** | Masukkan ke SR Policy lain | Binding SID |

Di sisi headend ada **H.Encaps** (bungkus paket dalam header IPv6 luar dengan SRH) dan **H.Encaps.Red** (*reduced*: SID pertama hanya ditaruh di alamat tujuan, tidak diulang di SRH; jika hanya satu SID, SRH tidak perlu ada sama sekali). Flavor **PSP**, **USP**, dan **USD** mengatur kapan SRH dibuang: di penultimate segment, di ultimate segment, atau dengan dekapsulasi di ultimate segment.

### 12.3 Segment Routing Header (RFC 8754)

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| Next Header   |  Hdr Ext Len  | Routing Type=4| Segments Left |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Last Entry   |     Flags     |              Tag              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|            Segment List[0] (128 bit), segmen TERAKHIR         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                              ...                              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|            Segment List[n] (128 bit), segmen PERTAMA          |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          TLV opsional (misalnya HMAC)                         |
```

- Daftar segmen disimpan **terbalik**: `Segment List[0]` adalah tujuan akhir.
- **Segments Left** menunjuk segmen aktif. Setiap endpoint mengurangi Segments Left satu, menyalin `Segment List[Segments Left]` ke alamat tujuan IPv6, lalu meneruskan.
- Router transit **tidak menyentuh SRH**. Mereka hanya melihat alamat tujuan.

**Overhead.** Header IPv6 luar 40 byte, ditambah SRH 8 byte, ditambah 16 byte per SID. Tiga SID berarti 40 + 8 + 48 = 96 byte. Bandingkan dengan SR-MPLS: 4 byte per label. Di sinilah kompresi menjadi penting.

### 12.4 Kompresi SID: uSID dan RFC 9800

RFC 9800 (Juni 2025) mendefinisikan dua flavor kompresi:

- **NEXT-CSID**, dikenal di industri sebagai **uSID** (micro-SID). Beberapa SID pendek dikemas dalam **satu** alamat IPv6 yang disebut *CSID container*.
- **REPLACE-CSID**, yang dikenal dari usulan G-SID. Beberapa SID pendek dikemas dalam entri SRH, lalu diganti satu per satu.

Format uSID yang paling umum adalah **F3216**: **Locator-Block 32 bit** dan **uSID 16 bit**. RFC 9800 mewajibkan implementasi NEXT-CSID mendukung kombinasi 32 bit dan 16 bit ini. Satu container 128 bit memuat 32 bit block ditambah (128 - 32) / 16 = **6 uSID**.

```
Alamat tujuan:  fcbb:bbbb : 0002 : 0003 : 0001 : 0000 : 0000 : 0000
                └ block ┘   uN p   uN pe2 uDT4   (kosong / end-of-container)

Di p (locator uN fcbb:bbbb:2::/48):
  cocok dengan uN miliknya → GESER sisa uSID ke kiri 16 bit, isi nol di kanan
  DA baru: fcbb:bbbb : 0003 : 0001 : 0000 : 0000 : 0000 : 0000
  lookup ulang → diteruskan ke pe2

Di pe2:
  fcbb:bbbb:3:1:: cocok dengan SID uDT4 miliknya → decapsulate, lookup di VRF
```

Operasi "geser lalu teruskan" (*shift and forward*) ini adalah inti uSID: satu alamat IPv6 membawa sampai 6 instruksi, tanpa SRH sama sekali. Jika butuh lebih dari 6, container berikutnya ditaruh di SRH. Lab B di §15 menunjukkan pergeseran ini terjadi di kernel Linux, ditangkap dengan tcpdump.

Penamaan behavior uSID mengikuti pola: **uN** (End dengan NEXT-CSID), **uA** (End.X dengan NEXT-CSID), **uDT4/uDT6/uDT46**. Di IOS XR, locator uSID ditandai `micro-segment behavior unode psp-usd`. Di FRR, `behavior usid`.

### 12.5 Control plane SRv6

- **IGP**: IS-IS (RFC 9352) mengiklankan **SRv6 Locator TLV 27** beserta End SID, dan End.X SID di TLV adjacency. OSPFv3 memakai RFC 9513.
- **BGP layanan** (RFC 9252): rute VPNv4/VPNv6/EVPN membawa **SRv6 Service SID** di BGP Prefix-SID attribute. Ada teknik *transposition*: sebagian bit SID (biasanya function) dipindahkan ke field label NLRI agar banyak rute bisa berbagi atribut yang sama dan update BGP lebih efisien.

Output lab memperlihatkan transposition ini:

```
pe1# show bgp ipv4 vpn
Route Distinguisher: 65000:3
 *>i 192.168.2.0/24   fd00::3       0    100      0 ?
    UN=fd00::3 EC{65000:100} label=16 sid=fcbb:bbbb:3:: sid_structure=[32,16,16,0] ...
```

Atribut membawa `fcbb:bbbb:3::` dan struktur `[block 32, node 16, function 16, argument 0]`. Function-nya ada di field label (16 = 0x10, yaitu nilai function 1 yang digeser 4 bit). Penerima menggabungkannya kembali menjadi SID lengkap **`fcbb:bbbb:3:1::`**, yang kemudian dipasang sebagai tujuan enkapsulasi.

### 12.6 Keamanan dan MTU

- **Batas domain SR.** SRv6 memakai alamat yang bisa dirutekan, sehingga paket dengan SRH buatan dari luar bisa memerintah router Anda. RFC 8754 meminta router batas domain **memfilter** paket yang tujuan alamatnya berada di blok SID internal atau yang membawa SRH dari luar domain. Pasang ACL di semua interface eksternal, dan jangan bocorkan blok SID ke internet.
- **MTU.** Rencanakan MTU core setidaknya 1500 + 40 + 8 + 16×n. Dengan uSID dan enkapsulasi reduced, overhead umumnya cukup 40 byte (tanpa SRH).

### 12.7 Konfigurasi SRv6 L3VPN

**IOS XR (uSID):**
```
segment-routing
 srv6
  encapsulation
   source-address fd00::1
  !
  locators
   locator MAIN
    micro-segment behavior unode psp-usd
    prefix fcbb:bbbb:1::/48
!
router isis CORE
 address-family ipv6 unicast
  segment-routing srv6
   locator MAIN
 !
 interface HundredGigE0/0/0/0
  address-family ipv6 unicast
   fast-reroute per-prefix
   fast-reroute per-prefix ti-lfa
!
router bgp 65000
 bgp router-id 10.255.255.1
 segment-routing srv6
  locator MAIN
 !
 address-family vpnv4 unicast
 !
 neighbor fd00::3
  remote-as 65000
  update-source Loopback0
  address-family vpnv4 unicast
 !
 vrf CUST
  rd 65000:1
  address-family ipv4 unicast
   segment-routing srv6
    locator MAIN
    alloc mode per-vrf                ← satu uDT4 per VRF
   !
   redistribute connected
```

**Junos.** Junos mendefinisikan locator di `routing-options` dan memasangnya di IS-IS serta di BGP per routing-instance. Contoh di bawah memakai SID end-dt4 eksplisit. Untuk locator uSID, Junos memakai kata kunci `micro-sid` pada locator dan `micro-node-sid` di IS-IS. Contoh ini disusun dari konfigurasi publik dan **belum diverifikasi** di perangkat. Sesuaikan dengan dokumentasi rilis Anda.
```
set routing-options source-packet-routing srv6 locator MAIN fcbb:bbbb:1::/48
set protocols isis source-packet-routing srv6 locator MAIN end-sid fcbb:bbbb:1:: flavor psp
set protocols bgp group IBGP family inet-vpn unicast extended-nexthop
set protocols bgp group IBGP family inet-vpn unicast advertise-srv6-service
set protocols bgp group IBGP family inet-vpn unicast accept-srv6-service
set routing-instances CUST instance-type vrf
set routing-instances CUST protocols bgp source-packet-routing srv6 locator MAIN end-dt4-sid fcbb:bbbb:1:10::
```

**FRRouting,** dipakai di Lab B (diverifikasi):
```
segment-routing
 srv6
  locators
   locator MAIN
    prefix fcbb:bbbb:1::/48 block-len 32 node-len 16 func-bits 16
    behavior usid
  encapsulation
   source-address fd00::1
!
router isis CORE
 segment-routing srv6
  locator MAIN
!
router bgp 65000
 neighbor fd00::3 remote-as 65000
 neighbor fd00::3 update-source lo
 neighbor fd00::3 capability extended-nexthop
 address-family ipv4 vpn
  neighbor fd00::3 activate
 segment-routing srv6
  locator MAIN
!
router bgp 65000 vrf CUST
 address-family ipv4 unicast
  redistribute connected
  sid vpn export auto                 ← alokasikan uDT4 untuk VRF ini
  nexthop vpn export fd00::1
  rd vpn export 65000:1
  rt vpn both 65000:100
  export vpn
  import vpn
```

---

## 13. SR-MPLS atau SRv6? Konteks Operator Indonesia

Tidak ada jawaban tunggal. Gunakan faktor berikut:

| Faktor | Condong ke **SR-MPLS** | Condong ke **SRv6** |
|---|---|---|
| Basis terpasang | Backbone LDP/RSVP sudah ada, layanan L3VPN/VPLS/EVPN berjalan di MPLS | Greenfield, misalnya transport 5G baru atau jaringan data center/metro baru |
| Hardware | Router dan line card lama yang MPLS-capable tetapi SRv6 terbatas | ASIC generasi baru dengan dukungan uSID line-rate |
| IPv6 | Core masih IPv4-only | Core sudah dual-stack atau siap IPv6-only |
| Perangkat campuran | Ada perangkat yang hanya bisa LDP | Router transit cukup IPv6 biasa, tidak harus SRv6 |
| Overhead dan MTU | 4 byte per label, sangat efisien | 40 byte minimum, lebih jika SRH panjang. uSID sangat mengurangi masalah ini |
| Skala dan ringkasnya control plane | Butuh label per node di seluruh domain, butuh BGP-LU untuk antar-domain | Locator bisa diringkas (summarize) seperti prefix IPv6 biasa, cocok untuk domain sangat besar |
| Keterampilan tim | Tim sudah fasih MPLS | Tim siap mempelajari model baru, termasuk keamanan batas domain |

**Pola yang realistis di Indonesia** (gambaran umum, bukan klaim tentang operator tertentu, karena penulis tidak menemukan sumber publik yang dapat diverifikasi tentang teknologi backbone tiap operator):

- **Operator besar dengan backbone MPLS mapan.** Jalur yang paling minim risiko adalah **SR-MPLS + TI-LFA** di atas IS-IS yang sudah ada, berdampingan dengan LDP, lalu menambah SR-TE/ODN untuk layanan premium. SRv6 dievaluasi untuk domain baru (misalnya transport 5G atau metro baru) bila perangkatnya mendukung uSID.
- **ISP regional berbasis MikroTik.** Pada saat penulisan, penulis tidak menemukan dukungan Segment Routing di manual RouterOS v7. RouterOS menyediakan LDP, RSVP-TE, VPLS, dan L3VPN (lihat `22-service-provider/01-mpls-ldp`). Jadi bagi jaringan yang inti-nya MikroTik, SR baru relevan ketika inti diganti perangkat yang mendukungnya. Periksa catatan rilis terbaru sebelum merencanakan.
- **Penyedia jaringan tertutup untuk bank dan instansi.** Nilai jual SR ada pada **jalur disjoint** (Flex-Algo atau SR Policy dengan batasan disjointness) dan **SRLG** yang dirancang benar untuk kabel laut dan jalur transmisi bersama.
- **Geografi kepulauan.** Latensi antarpulau sangat bervariasi (kabel laut dibandingkan satelit dan microwave). Flex-Algo dengan metrik delay dan pengukuran delay link adalah alat yang tepat untuk memisahkan trafik sensitif latensi.

---

## 14. Lab A: IS-IS SR-MPLS, TI-LFA, dan SR-TE dengan FRR

Lab ini sudah diuji dengan containerlab dan image `quay.io/frrouting/frr:10.4.1` di kernel Linux 7.2. Semua output di bawah adalah output asli dari lab tersebut.

### Topologi

```
                10.1.12.0/24
        r1 ─────────────────── r2
  eth2 /  eth1           eth1    \ eth2
      /                           \
 10.1.15.0/24                 10.1.23.0/24
    /                               \
  r5  eth2                     eth1  r3   cust0: 192.0.2.3/32 (prefix "pelanggan", lewat iBGP)
    \ eth1                     eth2 /
 10.1.45.0/24                 10.1.34.0/24
      \                           /
        r4 ─────────────────────
           eth2              eth1

  Loopback rN = 10.0.0.N/32, node SID index N (label 16000+N)
  Semua link metrik 10, IS-IS L2, point-to-point, TI-LFA di semua interface
  SR Policy di r1: color 10, endpoint 10.0.0.3, segment list [16004, 16003], BSID 1010
```

### File lab

Semua file ada di `materi/lab/kode/segment-routing/`:

| File | Isi |
|---|---|
| `start-frr.sh` | Entrypoint: menunggu interface, menyetel sysctl MPLS/SRv6, membuat VRF/dummy, lalu menjalankan FRR |
| `vtysh.conf` | Mode konfigurasi terpadu |
| `sr-mpls/sr-mpls.clab.yml` | Topologi Lab A |
| `sr-mpls/daemons` | Mengaktifkan zebra, isisd, bgpd, pathd, staticd |
| `sr-mpls/r1..r5/frr.conf` | Konfigurasi tiap router |
| `sr-mpls/uji-tilfa.sh` | Uji putus link otomatis |
| `srv6/...` | Lab B (§15) |

### Prasyarat

```bash
# Di HOST (container berbagi kernel dengan host):
sudo modprobe mpls_router mpls_iptunnel vrf
ls /proc/sys/net/mpls/                 # harus ada: conf, platform_labels, ...
docker pull quay.io/frrouting/frr:10.4.1
```

### Langkah 1: deploy dan periksa IS-IS

```bash
cd materi/lab/kode/segment-routing/sr-mpls
sudo containerlab deploy -t sr-mpls.clab.yml
# tunggu sekitar 20-30 detik
docker exec -it clab-sr-mpls-r1 vtysh
```

```
r1# show isis neighbor
Area CORE:
 System Id           Interface   L  State         Holdtime SNPA
 r2                  eth1        2  Up            28       2020.2020.2020
 r5                  eth2        2  Up            28       2020.2020.2020

r1# show isis segment-routing node
Area CORE:
 IS-IS L2 SR-Nodes:

 System ID       SRGB           SRLB           Algorithm  MSD
 --------------------------------------------------------------
 0000.0000.0001  16000 - 23999  15000 - 15999  SPF        8
 0000.0000.0002  16000 - 23999  15000 - 15999  SPF        8
 0000.0000.0003  16000 - 23999  15000 - 15999  SPF        8
 0000.0000.0004  16000 - 23999  15000 - 15999  SPF        8
 0000.0000.0005  16000 - 23999  15000 - 15999  SPF        8
```

Kelima router mengiklankan SRGB yang sama. Jika salah satu router tidak muncul, cek `segment-routing on` dan `metric-style wide` di router itu.

### Langkah 2: baca tabel label

```
r1# show isis route prefix-sid
 Prefix        Metric  Interface  Nexthop    SID  Label Op.           Algo
 ---------------------------------------------------------------------------
 10.0.0.2/32   20      eth1       10.1.12.2  2    Pop(16002)          0
 10.0.0.3/32   30      eth1       10.1.12.2  3    Swap(16003, 16003)  0
 10.0.0.4/32   30      eth2       10.1.15.5  4    Swap(16004, 16004)  0
 10.0.0.5/32   20      eth2       10.1.15.5  5    Pop(16005)          0
 10.1.12.0/24  20      eth1       10.1.12.2  -    -                   0
 ...

r1# show mpls table
 Inbound Label  Type        Nexthop    Outbound Label
 ------------------------------------------------------
 1010           SR-TE       10.1.15.5  16004/16003
 15000          SR (IS-IS)  10.1.15.5  implicit-null
 15001          SR (IS-IS)  10.1.12.2  implicit-null
 15002          SR (IS-IS)  10.1.12.2  implicit-null
 15003          SR (IS-IS)  10.1.15.5  implicit-null
 16002          SR (IS-IS)  10.1.12.2  implicit-null
 16003          SR (IS-IS)  10.1.12.2  16003
 16004          SR (IS-IS)  10.1.15.5  16004
 16005          SR (IS-IS)  10.1.15.5  implicit-null
```

Perhatikan:
- Untuk tetangga langsung (r2, r5), operasinya **Pop** karena r1 adalah penultimate hop (PHP).
- Untuk r3 dan r4, operasinya **Swap 16003 ke 16003**: berkat SRGB seragam, labelnya tetap sama di setiap hop.
- Label 15000 sampai 15003 adalah **adjacency SID** dari SRLB. Ada dua per tetangga: satu terlindungi, satu tidak (`show isis neighbor detail` menampilkan `IPv4 Adjacency-SID` dan `IPv4 Adjacency-SID (backup)`).
- Prefix link (10.1.x.0/24) tidak punya SID, sehingga diteruskan sebagai IP biasa.
- Label **1010** adalah BSID dari SR Policy (langkah 5).

Di kernel Linux, hasilnya bisa Anda lihat dengan `ip -f mpls route` dan `ip route`:

```
docker exec clab-sr-mpls-r1 ip route | grep encap
10.0.0.3 nhid 41  encap mpls  16003 via 10.1.12.2 dev eth1 proto isis metric 20
10.0.0.4 nhid 42  encap mpls  16004 via 10.1.15.5 dev eth2 proto isis metric 20
```

### Langkah 3: LFA klasik dibandingkan TI-LFA

Konfigurasi awal memakai TI-LFA. Lihat cakupannya:

```
r1# show isis fast-reroute summary
 Protection \ Priority     Critical  High      Medium    Low       Total
 ---------------------------------------------------------------------------
 Classic LFA               0         0         0         0         0
 Remote LFA                0         0         0         0         0
 Topology Independent LFA  0         0         5         4         9
 ECMP                      0         0         0         1         1
 Unprotected               0         0         0         0         0
 Protection coverage       0.00%     0.00%     100.00%   100.00%   100.00%

r1# show isis route backup
 Prefix        Metric  Interface  Nexthop    Label(s)
 ---------------------------------------------------------
 10.0.0.2/32   50      eth2       10.1.15.5  16003/16002
 10.0.0.3/32   40      eth2       10.1.15.5  16003
 10.0.0.4/32   40      eth1       10.1.12.2  16004
 10.0.0.5/32   50      eth1       10.1.12.2  16004/16005
 ...
```

Backup untuk r2 dan r5 butuh **dua label** karena tidak ada LFA biasa (§8.2). Backup untuk r3 dan r4 cukup satu label karena tetangga di sisi lain sudah loop-free.

Sekarang ganti ke LFA klasik di r1 dan bandingkan:

```
r1# configure terminal
r1(config)# interface eth1
r1(config-if)# no isis fast-reroute ti-lfa
r1(config-if)# isis fast-reroute lfa
r1(config-if)# interface eth2
r1(config-if)# no isis fast-reroute ti-lfa
r1(config-if)# isis fast-reroute lfa
r1(config-if)# end
r1# show isis fast-reroute summary
 Classic LFA               0         0         3         2         5
 Topology Independent LFA  0         0         0         0         0
 ECMP                      0         0         0         1         1
 Unprotected               0         0         2         2         4
 Protection coverage       0.00%     0.00%     60.00%    60.00%    60.00%
```

Cakupan turun dari 100% ke 60%. Loopback r2 dan r5 kini tidak terlindungi, persis seperti hitungan inequality di §8.2. Kembalikan ke TI-LFA sebelum lanjut (ulangi perintah di atas dengan `no isis fast-reroute lfa` dan `isis fast-reroute ti-lfa`).

### Langkah 4: putuskan link r1-r2

Skrip `uji-tilfa.sh` menjalankan ping 100 paket per detik dari loopback r1 ke loopback r2, mematikan eth1 di r1 di tengah jalan, lalu menampilkan hasilnya:

```bash
sudo sh uji-tilfa.sh
```

Hasil yang diharapkan (dari uji penulis):

```
500 packets transmitted, 499 packets received, 0% packet loss

 Prefix        Metric  Interface  Nexthop    SID  Label Op.           Algo
 ---------------------------------------------------------------------------
 10.0.0.2/32   50      eth2       10.1.15.5  2    Swap(16002, 16002)  0
 10.0.0.3/32   40      eth2       10.1.15.5  3    Swap(16003, 16003)  0
 10.0.0.4/32   30      eth2       10.1.15.5  4    Swap(16004, 16004)  0
 10.0.0.5/32   20      eth2       10.1.15.5  5    Pop(16005)          0
```

Hanya satu paket (sekitar 10 ms) yang hilang. Setelah konvergensi, r2 dicapai lewat r5-r4-r3 dengan **satu** label 16002. Itulah jalur pasca-konvergensi yang sebelumnya sudah diekspresikan TI-LFA sebagai `[16003, 16002]`. Ingat batasan di §8.6: di container, pemulihan secepat ini terjadi karena SPF berjalan langsung saat interface down, bukan karena backup sudah ada di FIB kernel. Skrip menyalakan kembali eth1 di akhir.

💡 Traceroute antar-loopback di lab menampilkan `*` untuk hop di tengah. Kernel Linux membuang paket MPLS yang TTL-nya habis tanpa mengirim ICMP Time Exceeded, sehingga router transit tidak terlihat. Ini perilaku dataplane Linux, bukan tanda kerusakan.

### Langkah 5: SR Policy dan steering berbasis color

r3 mengiklankan 192.0.2.3/32 ke r1 lewat iBGP. Prefix itu **tidak** ada di IS-IS. r1 memberi rute itu color 10 lewat route-map inbound, dan pathd di r1 punya policy (color 10, endpoint 10.0.0.3):

```
r1# show sr-te policy detail
Endpoint: 10.0.0.3  Color: 10  Name:   BSID: 1010  Status: Active
  * Preference: 100  Name: EKSPLISIT  Type: explicit  Segment-List: LEWAT-R5-R4  Protocol-Origin: Local

r1# show ip route 192.0.2.3/32
Routing entry for 192.0.2.3/32
  Known via "bgp", distance 200, metric 0, best
    10.0.0.3 (recursive), weight 1
  *   10.1.15.5, via eth2, label 16004/16003, weight 1
```

Tanpa policy, rute ini akan mengikuti jalur IGP ke 10.0.0.3, yaitu lewat r2 dengan label 16003. Dengan policy, ia lewat r5 dengan stack `[16004, 16003]`. Buktikan di kabel dengan menangkap paket di r5 (tcpdump tidak ada di image FRR, jadi pasang dulu):

```bash
docker exec clab-sr-mpls-r5 sh -c 'apk update -q && apk add -q libpcap tcpdump'
docker exec clab-sr-mpls-r5 tcpdump -nn -e -i eth2 -c 2 mpls &
docker exec clab-sr-mpls-r1 ping -c 2 -I 10.0.0.1 192.0.2.3
```

```
... ethertype MPLS unicast (0x8847), length 106: MPLS (label 16004, tc 0, ttl 64)
    (label 16003, tc 0, [S], ttl 64) 10.0.0.1 > 192.0.2.3: ICMP echo request ...
```

Dua label terlihat, dengan bit **S** (bottom of stack) pada label kedua. Coba juga tangkap di eth1 milik r4: Anda hanya akan melihat label 16003, karena r5 sudah melakukan PHP untuk 16004.

⚠️ **Catatan FRR 10.4.1:** perintah `name` di bawah `policy` membuat pathd abort saat `frr.conf` dimuat (penulis mengamatinya di lab ini). Karena itu konfigurasi lab tidak memakai `name` untuk policy. Nama candidate path (`name EKSPLISIT`) aman. Selain itu, BSID harus berada di luar SRGB dan SRLB. Penulis mencoba BSID 15100 (di dalam SRLB), dan pathd menolaknya dengan "failed to allocate resource".

### Langkah 6: bersihkan

```bash
sudo containerlab destroy -t sr-mpls.clab.yml --cleanup
```

### Tantangan tambahan

1. Ubah `isis fast-reroute ti-lfa` di r1 menjadi `isis fast-reroute ti-lfa node-protection` lalu lihat `show isis route backup`. Untuk tujuan mana node protection tidak mungkin di cincin lima router, dan kenapa?
2. Ubah SRGB r5 menjadi `segment-routing global-block 20000 27999`. Lihat `show mpls table` di r1: label keluar menuju r3 lewat r5 sekarang bernilai berapa?
3. Tambahkan candidate path kedua dengan preference 200 dan segment list `[16002, 16003]`. Policy mana yang aktif? Hapus lagi dan amati failover antar-candidate path.

---

## 15. Lab B: L3VPN di atas SRv6 uSID

Lab ini membangun VPN IPv4 pelanggan di atas core **IPv6-only** dengan SRv6 uSID format F3216. Diuji dengan image dan kernel yang sama seperti Lab A.

### Topologi

```
  ce1 ────── pe1 ══════════ p ══════════ pe2 ────── ce2
 .1.2  eth2(VRF CUST)  eth1   eth1  eth2   eth1  eth2(VRF CUST)  .2.2
 192.168.1.0/24        fd00:12::/64   fd00:23::/64        192.168.2.0/24

  Loopback  : pe1 fd00::1, p fd00::2, pe2 fd00::3
  Locator   : pe1 fcbb:bbbb:1::/48, p fcbb:bbbb:2::/48, pe2 fcbb:bbbb:3::/48
  IGP       : IS-IS L2 (IPv6 saja) dengan SRv6 locator
  Layanan   : iBGP pe1-pe2 address-family ipv4 vpn, VRF CUST, SID uDT4 per VRF
```

### Langkah 1: deploy

```bash
cd materi/lab/kode/segment-routing/srv6
sudo containerlab deploy -t srv6.clab.yml
```

Skrip start membuat VRF `CUST` (tabel 10) dan memasukkan eth2 ke dalamnya **sebelum** FRR berjalan, menyalakan `seg6_enabled`, menyetel `net.vrf.strict_mode=1` (dibutuhkan End.DT4 di kernel), dan membuat interface dummy `sr0`.

### Langkah 2: verifikasi SID

```
pe2# show segment-routing srv6 sid
 SID              Behavior    Context             Daemon/Instance    Locator    AllocationType
 ---------------------------  ------------------  -----------------  ---------  ----------------
 fcbb:bbbb:3::    uN          -                   isis(0)            MAIN       dynamic
 fcbb:bbbb:3:1::  uDT4        VRF 'CUST'          bgp(0)             MAIN       dynamic
 fcbb:bbbb:3:2::  uA          Interface 'eth1'    isis(0)            MAIN       dynamic
```

Tiga SID di pe2: **uN** (node), **uA** (adjacency ke p), dan **uDT4** (dekapsulasi ke VRF CUST). Kernel menerjemahkannya menjadi route `seg6local`:

```
docker exec clab-srv6-pe2 ip -6 route | grep seg6local
fcbb:bbbb:3:1:: ... encap seg6local action End.DT4 vrftable 10 dev CUST proto bgp ...
fcbb:bbbb:3:2::/64 ... encap seg6local action End.X nh6 fe80::... flavors next-csid lblen 32 nflen 16 dev eth1 ...
fcbb:bbbb:3::/48 ... encap seg6local action End flavors next-csid lblen 32 nflen 16 dev sr0 ...
```

`flavors next-csid lblen 32 nflen 16` adalah NEXT-CSID RFC 9800 dengan block 32 bit dan uSID 16 bit.

IS-IS mengiklankan locator di TLV SRv6 Locator:

```
pe1# show isis database detail pe2.00-00
  SRv6 Locator: fcbb:bbbb:3::/48 (Metric: 0) standard
    Sub-TLVs:
      SRv6 End SID Endpoint Behavior: uN, SID value: fcbb:bbbb:3::
        Sub-Sub-TLVs:
          SRv6 SID Structure Locator Block length: 32, Locator Node length: 16, Function length: 16, Argument length: 0,
```

### Langkah 3: VPN dan ping pelanggan

```
pe1# show ip route vrf CUST
B>  192.168.2.0/24 [200/0] via fd00::3 (vrf default) (recursive), label 16, seg6 fcbb:bbbb:3:1::, weight 1
  *                          via fe80::..., eth1 (vrf default), label 16, seg6 fcbb:bbbb:3:1::, weight 1

docker exec clab-srv6-pe1 ip route show vrf CUST
192.168.2.0/24 nhid 31  encap seg6 mode encap segs 1 [ fcbb:bbbb:3:1:: ] via inet6 fe80::... dev eth1 proto bgp metric 20

docker exec clab-srv6-ce1 ping -c 3 192.168.2.2
3 packets transmitted, 3 packets received, 0% packet loss
```

Tangkap di p (pasang tcpdump seperti Lab A):

```
IP6 (hlim 63, next-header Routing (43) payload length: 108) fd00::1 > fcbb:bbbb:3:1:::
  RT6 (len=2, type=4, segleft=0, last-entry=0, flags=0x0, tag=0, [0]fcbb:bbbb:3:1::)
  IP (...) 192.168.1.2 > 192.168.2.2: ICMP echo request ...
```

Paket IPv4 pelanggan dibungkus IPv6 dari `fd00::1` (alamat `encapsulation source-address`) ke SID uDT4 pe2, dengan SRH satu segmen (`type=4`, `segleft=0`). Router p tidak melakukan apa pun selain routing IPv6 biasa ke `fcbb:bbbb:3::/48`.

### Langkah 4: lihat uSID bergeser

Paksa jalur lewat uN milik p dengan memasang rute manual yang lebih spesifik di VRF pe1. Isinya satu container berisi tiga uSID: p (0002), pe2 (0003), uDT4 pe2 (0001):

```bash
docker exec clab-srv6-pe1 ip route add 192.168.2.2/32 vrf CUST \
    encap seg6 mode encap segs fcbb:bbbb:2:3:1:: dev eth1
docker exec clab-srv6-p tcpdump -nn -i any -c 2 'ip6 and not icmp6' &
docker exec clab-srv6-ce1 ping -c 1 192.168.2.2
```

```
eth1  In  IP6 fd00::1 > fcbb:bbbb:2:3:1::: RT6 (... [0]fcbb:bbbb:2:3:1::) IP 192.168.1.2 > 192.168.2.2 ...
eth2  Out IP6 fd00::1 > fcbb:bbbb:3:1:::   RT6 (... [0]fcbb:bbbb:2:3:1::) IP 192.168.1.2 > 192.168.2.2 ...
```

Paket masuk ke p dengan tujuan `fcbb:bbbb:2:3:1::` dan keluar dengan tujuan `fcbb:bbbb:3:1::`. p mencocokkan uN miliknya, menggeser uSID 16 bit ke kiri, lalu meneruskan. Itulah *shift and forward* dari §12.4, dijalankan oleh kernel Linux. SRH masih ada karena mode `encap` biasa selalu menyertakannya. Ganti `mode encap` menjadi `mode encap.red` (H.Encaps.Red) dan tangkap lagi: SRH hilang, hanya tersisa header IPv6 luar 40 byte. Hapus rute manual setelah selesai:

```bash
docker exec clab-srv6-pe1 ip route del 192.168.2.2/32 vrf CUST
```

### Yang tidak dicakup lab

- **TI-LFA untuk SRv6 di FRR**: perintah TI-LFA isisd yang terdokumentasi berbasis SR-MPLS. Penulis tidak menguji TI-LFA SRv6 di FRR.
- **SR Policy SRv6 di pathd**: tidak diuji. Langkah 4 memakai rute kernel manual untuk memperlihatkan mekanismenya.
- **RSVP-TE, PCE, Flex-Algo berbasis delay, dan mapping server**: tidak tersedia atau belum lengkap di FRR (lihat bagian masing-masing).

Bersihkan dengan `sudo containerlab destroy -t srv6.clab.yml --cleanup`.

---

## 16. Troubleshooting

### Alur diagnosis SR-MPLS

```
1. Router tidak muncul di daftar SR node?
   → SR belum aktif di router itu / metric-style bukan wide
   → Router Capability TLV tidak terkirim (cek LSP-nya: show isis database detail)

2. Prefix SID tidak terlihat untuk loopback?
   → prefix-sid belum dikonfigurasi, atau dikonfigurasi pada prefix yang berbeda
     (mis. /32 di config tetapi loopback memakai /24)
   → konflik index: dua router memakai index yang sama → cek log "SID conflict"

3. SID ada di LSDB, tetapi label tidak terpasang di LFIB?
   → index di luar SRGB lokal (index 9000 dengan SRGB berukuran 8000)
   → SRGB bertabrakan dengan rentang label lain
   → Linux: net.mpls.platform_labels = 0 atau modul mpls_router tidak dimuat
   → LDP masih lebih disukai (sr-prefer belum diset), lihat tabel CEF/inet.3

4. Label terpasang, tetapi trafik tetap lewat LDP atau IP?
   → preferensi LDP vs SR (§7.1)
   → tujuan BGP di-resolve lewat rute yang tidak berlabel

5. Paket besar hilang, paket kecil lolos?
   → MTU: setiap label 4 byte, TI-LFA dan SR-TE menambah 2 sampai 5 label

6. TI-LFA tidak memberi proteksi?
   → TI-LFA hanya di satu arah/interface; cek cakupan (fast-reroute summary)
   → MSD terlalu kecil untuk repair list
   → node protection diminta, tetapi topologi tidak memungkinkan (tambahkan link-fallback)

7. SR Policy "down" atau "invalid"?
   → SID pertama tidak bisa di-resolve (node SID tidak dikenal, adjacency SID salah)
   → jumlah SID melebihi MSD
   → BSID bentrok dengan label lain
   → color/endpoint rute BGP tidak cocok dengan policy (steering tidak terjadi)
```

### Alur diagnosis SRv6

```
1. Locator tidak muncul di IGP lawan?
   → locator status Down (prefix tidak valid / tidak cocok dengan block-len+node-len)
   → IS-IS tidak berjalan untuk IPv6 di interface
2. SID ada, paket dibuang di endpoint?
   → Linux: seg6_enabled=0 di interface masuk
   → End.DT4: net.vrf.strict_mode belum 1
   → interface dummy (sr0) belum dibuat
3. Rute VPN ada tetapi tanpa SID?
   → BGP tidak punya `segment-routing srv6 locator` / VRF tidak punya `sid vpn export`
   → peer tidak mengirim/menerima atribut SRv6 Service (Junos: advertise/accept-srv6-service)
4. Ping pelanggan gagal satu arah?
   → periksa kedua PE: route encap di VRF dan route seg6local untuk SID lokal
   → CE punya default route lain (lab: eth0 manajemen) yang menang atas rute ke PE
```

### Perintah penting

| Tujuan | IOS XR | Junos | FRR |
|---|---|---|---|
| Node SR dan SRGB | `show isis segment-routing srgb` | `show isis overview` | `show isis segment-routing node` |
| Label SR | `show isis segment-routing label table` | `show route table mpls.0` | `show mpls table` |
| Rute dengan label | `show cef <prefix> detail` | `show route table inet.3` | `show isis route prefix-sid` |
| TI-LFA | `show isis fast-reroute summary` | `show isis backup coverage` | `show isis fast-reroute summary`, `show isis route backup` |
| SR Policy | `show segment-routing traffic-eng policy` | `show spring-traffic-engineering lsp` | `show sr-te policy detail` |
| SRv6 SID | `show segment-routing srv6 sid` | `show route table inet6.0 protocol srv6` | `show segment-routing srv6 sid` |
| Uji jalur | `ping mpls sr ...`, `traceroute sr-mpls ...` (RFC 8287) | `ping mpls segment-routing isis ...` | `ping`, `tcpdump` |

Pada Junos, pastikan nama perintah sesuai rilis Anda dengan `show ?` atau dokumentasi resmi, karena beberapa perintah SPRING berubah antar-rilis.

---

## 17. Kesalahan Umum

- **SRGB berbeda-beda antar-router "karena default vendor".** Hasilnya label berubah di setiap hop dan anycast SID tidak bekerja. Tetapkan satu SRGB untuk seluruh domain sejak hari pertama.
- **Index sama dipakai dua router.** Konflik prefix SID bisa mengakibatkan salah satu prefix tidak berlabel atau trafik salah tujuan. Buat registri index (misalnya sama dengan nomor router) dan kelola di sumber kebenaran seperti NetBox.
- **Mengaktifkan SR lalu heran kenapa trafik masih lewat LDP.** Preferensi default kebanyakan platform adalah LDP. Gunakan `sr-prefer` (atau atur preference) dengan sadar dan bertahap.
- **Mengira TI-LFA melindungi dari semua hal.** TI-LFA melindungi dari kegagalan **tunggal**. Tanpa SRLG, dua link di kabel laut yang sama dianggap independen, dan backup bisa ikut putus.
- **Mengabaikan MSD dan MTU.** SR-TE dengan 6 label di platform yang MSD-nya 5 menghasilkan policy invalid. Stack yang lebih tebal juga butuh MTU core lebih besar.
- **Tidak memfilter blok SID SRv6 di batas jaringan.** SID SRv6 adalah alamat yang bisa dirutekan. Tanpa ACL di edge, pihak luar bisa mengirim paket ber-SRH ke router Anda.
- **Color tanpa arti yang terdokumentasi.** Color 100 di satu PE berarti "latensi rendah", di PE lain "hindari microwave". Buat katalog color sebagai standar operasional.
- **Menganggap hasil lab container sama dengan perangkat produksi.** Kernel Linux tidak memasang backup TI-LFA di FIB. Ukur waktu pemulihan nyata di perangkat sesungguhnya.

---

## 18. Ringkasan

- **TE** dibutuhkan karena jalur terpendek IGP buta terhadap kapasitas, latensi, dan risiko bersama. Mengubah metrik IGP memindahkan **semua** trafik sekaligus.
- **RSVP-TE**: IGP membawa atribut TE, CSPF menghitung jalur di headend, PATH/RESV memberi sinyal dengan ERO dan mereservasi bandwidth. FRR facility backup memakai bypass NHOP/NNHOP dengan label stacking. Kelemahannya state per LSP di setiap router.
- **Segment Routing** adalah source routing: state ada di paket, bukan di router. SR-MPLS memakai label, SRv6 memakai alamat IPv6. LDP dan RSVP tidak lagi dibutuhkan.
- **SID**: prefix/node/anycast (global, berbasis index), adjacency dan BSID (lokal). **label = SRGB base + index**, dihitung dengan SRGB tetangga downstream. Pakai **SRGB seragam**.
- IS-IS membawa SR di **Router Capability TLV 242**, **Prefix-SID sub-TLV 3**, **Adj-SID sub-TLV 31/32**, mapping server di **TLV 149**. OSPF memakai Router Info, Extended Prefix, dan Extended Link Opaque LSA.
- **Migrasi LDP ke SR**: jalankan berdampingan, `sr-prefer`, mapping server untuk router lama, interworking otomatis di router yang menjalankan keduanya (RFC 8661), lalu matikan LDP.
- **LFA** bergantung topologi. **rLFA** memakai PQ node dan tunnel LDP. **TI-LFA** (RFC 9855) memberi cakupan penuh untuk kegagalan tunggal dengan mengekspresikan **jalur pasca-konvergensi** sebagai daftar segmen. Microloop diatasi dengan local delay (RFC 8333) atau SR microloop avoidance.
- **SR Policy** = (headend, color, endpoint) + candidate path berpreferensi + BSID. Steering otomatis lewat **Color Extended Community**. **ODN** membuat policy sesuai permintaan dari template per color.
- **Flex-Algo** (RFC 9350): topologi tambahan dengan metrik/batasan sendiri (128-255), cukup satu prefix SID per algoritma untuk jalur latensi rendah atau disjoint.
- **PCE/PCEP** menghitung jalur yang tidak bisa dihitung headend sendiri. **BGP-LS** (RFC 9552) membawa topologi ke controller.
- **SRv6**: SID = locator:function:argument. Behavior penting: End, End.X, End.DT4/DT6/DT46. SRH (RFC 8754) menyimpan segmen terbalik dengan Segments Left. **uSID** (NEXT-CSID, RFC 9800, format F3216) mengemas sampai 6 instruksi dalam satu alamat dengan *shift and forward*.
- Pilihan **SR-MPLS vs SRv6** bergantung pada basis terpasang, hardware, kesiapan IPv6, MTU, dan keterampilan tim. Untuk backbone MPLS yang sudah ada, SR-MPLS + TI-LFA adalah langkah awal yang paling aman.

---

## 19. Latihan

1. Domain IS-IS Anda memakai SRGB 16000-23999 di semua router, kecuali satu router lama (R7) yang memakai SRGB 900000-907999. Loopback PE9 punya prefix SID index 9. Paket dari R6 menuju PE9 melewati R7. Label apa yang dikirim R6 ke R7, dan label apa yang dipasang R7 di LFIB-nya sebagai label masuk untuk PE9? Apa dampak operasionalnya?
2. Topologi persegi: A-B metrik 10, B-D metrik 10, A-C metrik 10, C-D metrik 30. A melindungi link A-B untuk tujuan D. Apakah C adalah LFA? Tunjukkan perhitungannya. Jika bukan, bagaimana TI-LFA membangun jalur cadangannya?
3. Anda mengaktifkan IS-IS SR di lab FRR. `show isis segment-routing node` menampilkan semua router, tetapi `show mpls table` kosong dan `ip route` tidak menunjukkan `encap mpls`. Sebutkan dua penyebab paling mungkin dan cara memeriksanya.
4. Backbone Anda punya 40 router SR dan 6 router lama yang hanya mendukung LDP. Rancang langkah agar PE baru (SR saja, tanpa LDP) tetap bisa mengirim trafik berlabel ke loopback router lama.
5. Seorang engineer membuat SR Policy dengan 7 SID untuk memaksa trafik pelanggan bank lewat jalur tertentu. Policy berstatus invalid di headend yang MSD-nya 5. Berikan tiga cara memperbaikinya.
6. Pelanggan meminta dua koneksi VPN dari Jakarta ke Surabaya yang tidak berbagi link maupun kabel laut. Jelaskan dua cara memenuhinya dengan SR, dan informasi apa yang wajib benar di IGP.
7. Di lab SRv6, Anda melihat paket tiba di p dengan tujuan `fcbb:bbbb:2:3:1::`. Tuliskan tujuan paket saat keluar dari p, dan jelaskan apa yang dilakukan pe2 ketika menerimanya. Berapa banyak uSID yang masih bisa ditambahkan ke container ini?
8. Setelah link putus di backbone, monitoring menunjukkan paket hilang sekitar 300 ms di router yang **bukan** PLR, walau TI-LFA aktif dan cakupan 100%. Apa fenomenanya dan bagaimana mengatasinya?
9. Rute VPNv4 dari pe2 terlihat di pe1 dengan `sid=fcbb:bbbb:3::`, `label=16`, dan `sid_structure=[32,16,16,0]`. SID lengkap apa yang dipakai pe1 sebagai tujuan enkapsulasi, dan kenapa BGP mengirimnya dengan cara ini?

<details>
<summary>Jawaban</summary>

1. **R6 mengirim label 900009 ke R7.** Label keluar selalu dihitung dengan SRGB **tetangga downstream**: 900000 + 9. **Label masuk R7 untuk PE9 adalah 900009** (SRGB R7 sendiri). Saat meneruskan ke tetangga berikutnya yang SRGB-nya 16000, R7 menukar 900009 menjadi 16009.
   Dampak operasional: label untuk node yang sama berbeda di sebagian jalur, sehingga troubleshooting dengan "label 160xx = router xx" tidak lagi berlaku. Anycast SID yang melibatkan R7 tidak konsisten. Beberapa alat dan controller juga mengasumsikan SRGB seragam. Perbaikan terbaik adalah menyeragamkan SRGB R7 pada jendela pemeliharaan.

2. **C bukan LFA.** Syarat: dist(C, D) < dist(C, A) + dist(A, D).
   dist(C, D) = min(30 langsung, 10+10+10 lewat A-B) = 30. dist(C, A) + dist(A, D) = 10 + 20 = 30. Karena 30 < 30 salah, jalur terpendek C ke D bisa kembali lewat A (seri ECMP 30 lewat A-B-D dan 30 langsung). Paket yang dikirim A ke C bisa memantul kembali ke A.
   TI-LFA menghitung jalur pasca-konvergensi A-C-D. Jalur C ke D lewat link C-D (metrik 30) bukan jalur terpendek tunggal C, sehingga TI-LFA mendorong **adjacency SID C→D** atau `[node SID C, adj SID C→D]`. Paket dipaksa keluar lewat link C-D, lalu sampai di D tanpa loop.

3. Penyebab paling mungkin:
   - **Modul MPLS kernel tidak dimuat di host** (`lsmod | grep mpls`, `ls /proc/sys/net/mpls`). Container tidak bisa memuatnya sendiri.
   - **`net.mpls.platform_labels` bernilai 0** di namespace router (`sysctl net.mpls.platform_labels`). Zebra menolak memasang label yang melebihi tabel label kernel.
   Penyebab lain yang layak dicek: `net.mpls.conf.<iface>.input` = 0 (paket berlabel yang masuk dibuang), dan log zebra (`show logging` atau `docker logs`) yang menyebut kegagalan memasang LSP.

4. Langkah yang disarankan:
   - Pilih dua router SR yang stabil sebagai **mapping server** (redundan). Iklankan pemetaan prefix ke index untuk 6 loopback router lama (`prefix-sid-map`), dengan index yang tidak bentrok dengan registri index yang ada.
   - Pastikan router di perbatasan antara bagian SR dan bagian LDP menjalankan **SR dan LDP sekaligus**. Router ini menjahit label SR ke label LDP (dan sebaliknya) secara otomatis (RFC 8661).
   - Verifikasi di PE baru bahwa loopback router lama punya label SR (dari SRMS), lalu uji jalur dengan ping/traceroute MPLS.
   - Pantau konflik SID (dua sumber memberi SID berbeda untuk prefix yang sama). Setelah router lama diganti, hapus pemetaan dan matikan LDP bertahap.

5. Tiga cara:
   - **Sederhanakan segment list**: ganti rangkaian adjacency SID dengan **node SID** bila jalur terpendek ke node itu memang segmen jalur yang diinginkan. Satu node SID bisa menggantikan beberapa hop.
   - **Stitching dengan BSID**: buat policy kedua di router tengah dengan BSID. Headend cukup mendorong `[SID ke router tengah, BSID]`, dan router tengah mengganti BSID dengan sisa daftar.
   - **Flex-Algo atau candidate path dinamis dengan `sid-limit`**: definisikan algoritma yang mengecualikan link yang tidak diinginkan sehingga jalur yang sama dicapai dengan satu prefix SID algoritma itu. Atau minta CSPF/PCE mencari jalur yang bisa diekspresikan dalam maksimal 5 SID.
   Opsi lain bila hardware memungkinkan: platform dengan MSD lebih besar, atau SRv6 uSID yang mengemas 6 instruksi per alamat.

6. Dua cara:
   - **Flex-Algo dual-plane**: tandai link dengan affinity "plane A" dan "plane B", definisikan algoritma 128 (hanya A) dan 129 (hanya B), lalu arahkan kedua koneksi masing-masing lewat prefix SID algoritma 128 dan 129 (misalnya lewat ODN color yang dipetakan ke `sid-algorithm`).
   - **Dua SR Policy dengan batasan disjointness**, dihitung oleh **PCE** yang melihat kedua headend sekaligus. Headend saja tidak tahu jalur headend lain, jadi PCE dengan topologi dari BGP-LS dibutuhkan bila kedua policy berasal dari headend berbeda.
   Yang wajib benar di IGP: **SRLG** untuk link yang berbagi kabel laut, duct, atau sistem transmisi, dan **affinity** yang sesuai kondisi fisik. Tanpa SRLG yang akurat, dua link yang "berbeda" di IGP bisa berada di kabel laut yang sama.

7. Tujuan keluar dari p: **`fcbb:bbbb:3:1::`**. p mencocokkan uN miliknya (`fcbb:bbbb:2::/48`), menggeser uSID tersisa (`0003`, `0001`) 16 bit ke kiri, dan mengisi nol di kanan. pe2 menerima paket dengan tujuan `fcbb:bbbb:3:1::`, yang cocok dengan **SID uDT4** miliknya. pe2 membuang header IPv6 luar (dan SRH), lalu melakukan lookup alamat tujuan IPv4 pelanggan di tabel VRF CUST (tabel 10).
   Kapasitas container F3216 adalah 6 uSID (96 bit setelah block 32 bit). Container ini memakai 3, jadi **masih ada ruang untuk 3 uSID lagi**.

8. Fenomenanya **microloop**. TI-LFA hanya melindungi trafik di PLR. Setelah IGP konvergen, router-router memperbarui FIB pada waktu yang sedikit berbeda, sehingga untuk sementara dua router bisa saling menunjuk satu sama lain sebagai next-hop. Paket memantul sampai TTL habis atau FIB selesai diperbarui.
   Mitigasi: aktifkan **SR microloop avoidance** (router mengirim trafik dengan segment list bebas loop selama periode konvergensi, misalnya `microloop avoidance segment-routing` di IOS XR), atau gunakan **local convergence delay** (RFC 8333) di PLR untuk kasus kegagalan link yang bersebelahan. Tuning timer SPF dan FIB update juga membantu, tetapi tidak menghilangkan akar masalahnya.

9. SID lengkapnya **`fcbb:bbbb:3:1::`**. Struktur `[32,16,16,0]` berarti block 32 bit, node 16 bit, function 16 bit. BGP memakai **transposition** (RFC 9252): bit function dipindahkan ke field label NLRI (label=16 adalah nilai function 1 yang digeser 4 bit), sementara atribut hanya membawa bagian yang sama untuk banyak rute (`fcbb:bbbb:3::`). pe1 menggabungkan kembali keduanya. Manfaatnya, banyak rute VPN dari PE yang sama bisa berbagi atribut BGP identik dan dikemas dalam lebih sedikit UPDATE.

</details>

---

## 20. Sumber

- RFC 8402, Segment Routing Architecture: https://www.rfc-editor.org/rfc/rfc8402
- RFC 8660, Segment Routing with the MPLS Data Plane: https://www.rfc-editor.org/rfc/rfc8660
- RFC 8667, IS-IS Extensions for Segment Routing: https://www.rfc-editor.org/rfc/rfc8667
- RFC 8665, OSPF Extensions for Segment Routing: https://www.rfc-editor.org/rfc/rfc8665
- RFC 8661, Segment Routing MPLS Interworking with LDP: https://www.rfc-editor.org/rfc/rfc8661
- RFC 8491, Signaling Maximum SID Depth (MSD) Using IS-IS: https://www.rfc-editor.org/rfc/rfc8491
- RFC 3209, RSVP-TE: Extensions to RSVP for LSP Tunnels: https://www.rfc-editor.org/rfc/rfc3209
- RFC 4090, Fast Reroute Extensions to RSVP-TE for LSP Tunnels: https://www.rfc-editor.org/rfc/rfc4090
- RFC 5305, IS-IS Extensions for Traffic Engineering: https://www.rfc-editor.org/rfc/rfc5305
- RFC 3630, Traffic Engineering (TE) Extensions to OSPF Version 2: https://www.rfc-editor.org/rfc/rfc3630
- RFC 7308, Extended Administrative Groups in MPLS-TE: https://www.rfc-editor.org/rfc/rfc7308
- RFC 5714, IP Fast Reroute Framework: https://www.rfc-editor.org/rfc/rfc5714
- RFC 5286, Basic Specification for IP Fast Reroute: Loop-Free Alternates: https://www.rfc-editor.org/rfc/rfc5286
- RFC 7490, Remote Loop-Free Alternate (LFA) Fast Reroute (FRR): https://www.rfc-editor.org/rfc/rfc7490
- RFC 9855, Topology Independent Fast Reroute Using Segment Routing: https://www.rfc-editor.org/rfc/rfc9855
- RFC 8333, Micro-loop Prevention by Introducing a Local Convergence Delay: https://www.rfc-editor.org/rfc/rfc8333
- RFC 9256, Segment Routing Policy Architecture: https://www.rfc-editor.org/rfc/rfc9256
- RFC 9830, Advertising Segment Routing Policies in BGP: https://www.rfc-editor.org/rfc/rfc9830
- RFC 9012, The BGP Tunnel Encapsulation Attribute (Color Extended Community): https://www.rfc-editor.org/rfc/rfc9012
- RFC 9350, IGP Flexible Algorithm: https://www.rfc-editor.org/rfc/rfc9350
- RFC 9843, IGP Flexible Algorithms: Bandwidth, Delay, Metrics, and Constraints: https://www.rfc-editor.org/rfc/rfc9843
- RFC 5440, Path Computation Element Communication Protocol (PCEP): https://www.rfc-editor.org/rfc/rfc5440
- RFC 8231, PCEP Extensions for Stateful PCE: https://www.rfc-editor.org/rfc/rfc8231
- RFC 8281, PCEP Extensions for PCE-Initiated LSP Setup: https://www.rfc-editor.org/rfc/rfc8281
- RFC 8664, PCEP Extensions for Segment Routing: https://www.rfc-editor.org/rfc/rfc8664
- RFC 9603, PCEP Extensions for IPv6 Segment Routing: https://www.rfc-editor.org/rfc/rfc9603
- RFC 9552, Distribution of Link-State and TE Information Using BGP (BGP-LS): https://www.rfc-editor.org/rfc/rfc9552
- RFC 8986, Segment Routing over IPv6 (SRv6) Network Programming: https://www.rfc-editor.org/rfc/rfc8986
- RFC 8754, IPv6 Segment Routing Header (SRH): https://www.rfc-editor.org/rfc/rfc8754
- RFC 9800, Compressed SRv6 Segment List Encoding: https://www.rfc-editor.org/rfc/rfc9800
- RFC 9602, SRv6 Segment Identifiers in the IPv6 Addressing Architecture: https://www.rfc-editor.org/rfc/rfc9602
- RFC 9352, IS-IS Extensions to Support Segment Routing over the IPv6 Data Plane: https://www.rfc-editor.org/rfc/rfc9352
- RFC 9252, BGP Overlay Services Based on SRv6: https://www.rfc-editor.org/rfc/rfc9252
- RFC 8287, LSP Ping/Traceroute for Segment Routing IGP-Prefix and IGP-Adjacency SIDs: https://www.rfc-editor.org/rfc/rfc8287
- Dokumentasi FRRouting, IS-IS (SR, TI-LFA, SRv6, Flex-Algo): https://docs.frrouting.org/en/latest/isisd.html
- Dokumentasi FRRouting, OSPFv2 (Segment Routing): https://docs.frrouting.org/en/latest/ospfd.html
- Dokumentasi FRRouting, PATH daemon (SR-TE dan PCEP): https://docs.frrouting.org/en/latest/pathd.html
- Dokumentasi FRRouting, Zebra (SRv6 locator): https://docs.frrouting.org/en/latest/zebra.html
- FRRouting topotests (contoh konfigurasi isis_sr_te_topo1, isis_srv6_topo1, bgp_srv6l3vpn_to_bgp_vrf3): https://github.com/FRRouting/frr/tree/master/tests/topotests
- segment-routing.net, sumber belajar komunitas Segment Routing: https://www.segment-routing.net
- Cisco IOS XR Segment Routing Configuration Guide: https://www.cisco.com/c/en/us/support/ios-nx-os-software/ios-xr-software/products-installation-and-configuration-guides-list.html
- Juniper, Source Packet Routing in Networking (SPRING) User Guide: https://www.juniper.net/documentation/us/en/software/junos/is-is/index.html
- Nokia SR Linux documentation: https://documentation.nokia.com/srlinux/
- netlab, template SR multi-vendor (rujukan sintaks): https://github.com/ipspace/netlab/tree/dev/netsim/ansible/templates/sr
- containerlab: https://containerlab.dev

---

**Berikutnya:** `22-service-provider/04-l2vpn-carrier-ethernet` — VPWS, VPLS, EVPN, dan Carrier Ethernet: menyambung layer 2 pelanggan di atas backbone MPLS dan SR.

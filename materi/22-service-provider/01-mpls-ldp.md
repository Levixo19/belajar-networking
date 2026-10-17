# 22.1 MPLS dan LDP

> **Prasyarat:** `11-wan-vpn/01-teknologi-wan` (§4 pengenalan MPLS), `07-routing-lanjutan/06-bgp`, `07-routing-lanjutan/10-isis` (IGP backbone), `13-linux-networking/01-iproute2`
> **Tujuan:** Anda bisa menjelaskan cara MPLS meneruskan paket sampai ke tingkat bit header label, membaca LIB dan LFIB, memahami push/swap/pop, PHP, explicit-null, dan TTL, mengoperasikan LDP (discovery, sesi, mode distribusi label, sinkronisasi dengan IGP), menghitung dampak label terhadap MTU, serta mendiagnosis LSP yang putus di Cisco, Juniper, MikroTik, dan FRRouting.

---

## 1. Selamat Datang di Jaringan Service Provider

Tahap-tahap sebelumnya memandang jaringan dari sisi **pelanggan**: kantor, kampus, data center. Tahap 22 membalik sudut pandangnya. Sekarang Anda berdiri di dalam jaringan **operator**: ISP, operator telekomunikasi, penyedia backbone, atau penyedia jaringan tertutup untuk bank dan instansi. Jaringan seperti ini punya kebutuhan yang tidak muncul di LAN kantor:

- Satu backbone dipakai **ribuan pelanggan** sekaligus, dan pelanggan-pelanggan itu memakai alamat privat yang sama (semua orang suka `192.168.1.0/24`).
- Router di tengah backbone harus **sederhana dan cepat**. Router itu tidak boleh menyimpan tabel internet penuh plus rute ribuan pelanggan.
- Operator ingin **mengatur jalur** trafik (traffic engineering) dan memulihkan jalur dalam hitungan puluhan milidetik saat serat optik putus.
- Layanan yang dijual beragam: internet, VPN layer 3, VPN layer 2 (E-Line, E-LAN), backhaul seluler. Semuanya harus berjalan di atas **satu** infrastruktur.

Jawaban industri untuk semua kebutuhan itu selama dua dekade terakhir adalah **MPLS**, dan penerusnya, Segment Routing, tetap memakai format label MPLS yang sama. Itulah sebabnya Tahap 22 dimulai dari sini.

### Tiga peran router

Modul 11.1 sudah memperkenalkan istilahnya. Di sini kita pakai secara konsisten di seluruh tahap:

```
  Situs pelanggan            Jaringan operator (satu AS)            Situs pelanggan
 ┌──────────┐      ┌────────────────────────────────────────────┐      ┌──────────┐
 │   CE1    │──────│  PE1 ═══════ P1 ═══════ P2 ═══════ PE2     │──────│   CE2    │
 └──────────┘      │  (edge)    (core)     (core)     (edge)    │      └──────────┘
   milik/dikelola  │  tahu pelanggan  tidak tahu pelanggan      │
   pelanggan       └────────────────────────────────────────────┘
```

| Peran | Nama lengkap | Yang ia ketahui | Yang ia kerjakan |
|---|---|---|---|
| **CE** | Customer Edge | Hanya jaringan pelanggannya sendiri | Routing biasa (static, BGP, OSPF) ke PE. Tidak tahu MPLS sama sekali |
| **PE** | Provider Edge | Rute pelanggan (per VRF) + rute backbone | Menerima IP dari CE, **memasang label** (push), dan sebaliknya **melepas label** |
| **P** | Provider (core) | **Hanya** rute backbone (loopback dan link antar-router operator) | **Menukar label** (swap) secepat mungkin. Tidak menjalankan BGP pelanggan |

Dalam terminologi RFC 3031, PE adalah **LER** (*Label Edge Router*) dan P adalah **LSR** (*Label Switching Router*). Dalam praktik, istilah PE/P lebih sering dipakai karena langsung menunjukkan posisi bisnisnya.

> [!TIP]
> **Ide besarnya: router P tidak perlu tahu ke mana paket pelanggan akhirnya pergi.** Ia hanya perlu tahu "label 17 masuk dari kiri, keluarkan sebagai label 18 ke kanan". Semua kecerdasan tentang pelanggan ada di tepi (PE). Inilah yang membuat backbone operator bisa membesar tanpa router core ikut membengkak.

### Peta Tahap 22

| Modul | Isi | Pertanyaan yang dijawab |
|---|---|---|
| **22.1** (ini) | MPLS dataplane dan LDP | Bagaimana label dibuat, disebar, dan dipakai? |
| 22.2 | MPLS L3VPN | Bagaimana ribuan pelanggan berbagi backbone tanpa saling melihat? |
| 22.3 | Traffic Engineering dan Segment Routing | Bagaimana memilih jalur selain jalur terpendek IGP, dan pulih dalam 50 ms? |
| 22.4 | L2VPN dan Carrier Ethernet | Bagaimana menjual "kabel virtual" dan LAN lintas kota? |
| 22.5 | Ketersediaan dan keamanan SP | Bagaimana backbone tetap hidup dan aman saat ada gangguan dan serangan? |

Isi tahap ini menyasar domain "MPLS and Segment Routing" dan "Services" di ujian Cisco 350-501 SPCOR, bagian MPLS di Juniper JNCIS-SP, dan materi MikroTik MTCINE. Pemetaan rinci ada di Tahap 18.

---

## 2. Kenapa Label?

### Alasan yang sering disebut, dan yang sudah tidak berlaku

Buku lama sering menulis "MPLS lebih cepat karena mencari label 20 bit lebih mudah daripada longest prefix match". Pada akhir 1990-an argumen ini masuk akal. Sekarang tidak lagi: ASIC router modern melakukan longest prefix match IPv4 dan IPv6 pada kecepatan line rate. **Kecepatan lookup bukan lagi alasan memakai MPLS.**

Peterson dan Davie dalam *Computer Networks: A Systems Approach* menyebut tiga hal yang membuat MPLS tetap dipakai luas walau alasan kecepatan sudah gugur: (1) membawa kemampuan IP ke perangkat yang tidak bisa memproses header IP, (2) **explicit routing**, yaitu memaksa paket lewat jalur yang dipilih, bukan jalur terpendek, dan (3) **VPN** dan tunnel. Dua yang terakhir adalah alasan utama operator saat ini.

### Alasan yang sebenarnya

**1. Memisahkan "ke mana paket pergi" dari "apa isi paketnya".**
Di jaringan IP murni, setiap router memutuskan berdasarkan alamat tujuan IP. Akibatnya setiap router harus tahu rute ke **setiap** tujuan. Dengan label, hanya router ingress (PE) yang melihat alamat tujuan. Router di tengah cukup melihat label. Konsekuensi praktisnya:

- **BGP-free core.** Router P tidak perlu memegang tabel internet penuh (lebih dari satu juta prefix IPv4) atau rute pelanggan. Ia cukup tahu loopback para PE. Router P bisa lebih murah dan konvergensinya lebih cepat.
- **Alamat tumpang tindih tidak masalah.** Dua pelanggan sama-sama memakai `192.168.1.0/24`. Router P tidak pernah melihat alamat itu sebagai dasar keputusan, jadi tidak ada konflik. (Bagaimana PE membedakannya dibahas di 22.2.)

**2. Tumpukan label (label stack).**
Satu paket bisa membawa beberapa label. Label paling luar menyatakan "bawa paket ini ke PE2", label di bawahnya menyatakan "di PE2, serahkan ke VRF pelanggan A". Satu mekanisme ini menjadi dasar L3VPN, L2VPN, traffic engineering, dan fast reroute.

**3. Multiprotocol.**
Isi di bawah label bisa apa saja: IPv4, IPv6, frame Ethernet utuh, bahkan sel ATM. Router P tidak peduli. Huruf "M" pertama di MPLS berarti ini.

**4. Jalur eksplisit.**
Karena paket diteruskan berdasarkan label, operator bisa membuat jalur yang tidak mengikuti IGP (RSVP-TE, SR-TE). Ini topik 22.3.

### Analogi

Bayangkan kantor pos pusat di Jakarta mengirim karung surat ke Makassar. Petugas di Jakarta membaca alamat setiap amplop, lalu memasukkan amplop ke **karung bertanda "MKS-07"**. Petugas transit di Surabaya tidak membuka karung dan tidak membaca alamat amplop. Ia hanya melihat tanda karung, lalu menempel tanda baru "MKS-12" sesuai kesepakatan dengan petugas berikutnya. Baru di Makassar karung dibuka dan amplop dibaca. Tanda karung itulah **label**. Tanda itu hanya berlaku antara dua petugas yang bersebelahan, sehingga setiap petugas bebas memilih nomornya sendiri.

---

## 3. Header Label MPLS, Bit per Bit

### Posisi di dalam frame

Label MPLS disisipkan **di antara header layer 2 dan header layer 3**. Karena itu MPLS sering disebut protokol "layer 2,5". Header ini disebut *shim header* (RFC 3032).

```
┌───────────────────┬──────────────┬──────────────┬─────────────────┬─────┐
│  Header Ethernet  │ Label MPLS 1 │ Label MPLS 2 │  Header IP      │ ... │
│  EtherType 0x8847 │  (S = 0)     │  (S = 1)     │  + payload      │     │
└───────────────────┴──────────────┴──────────────┴─────────────────┴─────┘
                      label paling atas (top)   label paling bawah (bottom)
```

- Di Ethernet, keberadaan label ditandai **EtherType `0x8847`** (MPLS unicast). EtherType `0x8848` dipakai untuk MPLS dengan label yang ditetapkan upstream, misalnya multicast (RFC 5332).
- Di PPP, ada protokol kontrol sendiri (MPLSCP).
- Header MPLS **tidak punya field "protokol berikutnya"**. Router yang melepas label terakhir harus tahu sendiri isi di bawahnya dari konteks: label itu ia alokasikan untuk FEC IPv4, IPv6, atau pseudowire Ethernet. Ini sebabnya label khusus "IPv4 explicit null" dan "IPv6 explicit null" dipisah.

### Satu entri label: 32 bit

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
┌───────────────────────────────────────┬─────┬─┬───────────────┐
│                Label                  │ TC  │S│      TTL      │
│               20 bit                  │3 bit│1│     8 bit     │
└───────────────────────────────────────┴─────┴─┴───────────────┘
```

| Field | Ukuran | Fungsi |
|---|---|---|
| **Label** | 20 bit | Nilai 0 sampai 1.048.575. Nilai 0 sampai 15 dicadangkan untuk fungsi khusus |
| **TC** (*Traffic Class*) | 3 bit | Penanda QoS (8 kelas). Dulu bernama **EXP** (*experimental*), diganti namanya oleh RFC 5462 karena faktanya selalu dipakai untuk QoS |
| **S** (*Bottom of Stack*) | 1 bit | `1` jika ini label **paling bawah** dalam tumpukan, `0` jika masih ada label lain di bawahnya |
| **TTL** | 8 bit | Pencegah loop, sama seperti TTL IP. Dikurangi satu di setiap hop yang memproses label |

### Contoh nyata: membongkar heksadesimal

Berikut tangkapan `tcpdump` dari lab di akhir modul ini (link pe1 ke p1), paket ping dari pelanggan A:

```
MPLS (label 17, tc 0, ttl 63) (label 81, tc 0, [S], ttl 63) IP 192.168.1.1 > 192.168.2.1: ICMP echo request
```

Dalam bentuk byte, dua entri label itu adalah:

```
Label luar : 00 01 10 3F
             0000 0000 0000 0001 0001 │ 000 │ 0 │ 0011 1111
             label = 0x00011 = 17     │ TC=0│S=0│ TTL = 63

Label dalam: 00 05 11 3F
             0000 0000 0000 0101 0001 │ 000 │ 1 │ 0011 1111
             label = 0x00051 = 81     │ TC=0│S=1│ TTL = 63
```

Cara cepat menghitungnya: nilai 32 bit = `label × 4096 + TC × 512 + S × 256 + TTL`. Untuk label 81, S=1, TTL 63: 81 × 4096 + 256 + 63 = 332.095 = `0x0005113F`.

### Label khusus (0 sampai 15)

| Nilai | Nama | Arti |
|---|---|---|
| **0** | IPv4 Explicit NULL | "Lepas label ini, isinya IPv4." Dipakai agar hop terakhir tetap menerima TC (lihat §6) |
| 1 | Router Alert | Paket harus diserahkan ke CPU (control plane) router, bukan diteruskan di hardware |
| **2** | IPv6 Explicit NULL | Sama seperti 0, untuk IPv6 |
| **3** | Implicit NULL | **Tidak pernah muncul di paket.** Hanya diiklankan lewat protokol pensinyalan, artinya "jangan pasang label untuk saya, langsung pop" (PHP) |
| 7 | Entropy Label Indicator | Menandai bahwa label berikutnya adalah *entropy label* untuk load balancing (RFC 6790) |
| 13 | GAL | *Generic Associated Channel Label*, untuk OAM MPLS-TP (RFC 5586) |
| 14 | OAM Alert | Paket OAM (RFC 3429) |
| 15 | Extension Label | Membuka ruang label khusus tambahan (RFC 7274) |

Label dinamis biasanya dialokasikan mulai **16**. Itu sebabnya hampir semua contoh output menampilkan label 16, 17, 18, dan seterusnya. Vendor punya rentang default sendiri (misalnya Cisco IOS XE mulai 16, IOS XR mulai 24000, Junos mulai 299776), dan rentang itu bisa diubah.

> [!TIP]
> **Label hanya bermakna lokal.** Label 17 di link pe1 ke p1 tidak ada hubungannya dengan label 17 di link p1 ke pe2. Setiap router memilih label masuknya sendiri dan memberitahu tetangga upstream. Inilah yang disebut **downstream label assignment**.

---

## 4. FEC, LSP, dan Arah Aliran

### FEC (Forwarding Equivalence Class)

**FEC** adalah sekelompok paket yang diperlakukan sama: lewat jalur yang sama, dengan perlakuan yang sama. Di jaringan IP biasa, FEC hampir selalu berarti **satu prefix tujuan**. Misalnya semua paket menuju loopback PE2 `10.255.0.3/32` adalah satu FEC.

Router ingress menentukan FEC **sekali saja**, saat paket masuk ke domain MPLS. Setelah itu paket hanya membawa label yang mewakili FEC tersebut. Di LDP, FEC yang paling penting adalah **prefix /32 loopback PE**, karena itulah tujuan semua layanan (VPN, L2VPN, BGP next hop).

### LSP (Label Switched Path)

**LSP** adalah jalur yang dilalui paket berlabel untuk satu FEC, dari ingress ke egress. Sifat penting:

- **Satu arah (unidirectional).** LSP dari PE1 ke PE2 terpisah dari LSP PE2 ke PE1. Keduanya bisa lewat jalur fisik berbeda.
- **Mengikuti IGP** bila dibangun dengan LDP. LDP tidak menghitung jalur sendiri. Ia hanya menempelkan label pada jalur yang sudah dipilih IS-IS atau OSPF.
- Untuk satu FEC, LSP dari banyak ingress **bergabung** menuju egress yang sama. Bentuknya pohon yang berakar di egress, bukan garis lurus. Router P memakai satu label masuk untuk FEC itu, siapa pun pengirimnya.

```
Peran router terhadap satu LSP (FEC 10.255.0.3/32, arah pe1 → pe2):

   pe1  ──────────►  p1  ──────────►  pe2
 INGRESS           TRANSIT          EGRESS
 (push)            (swap / pop)     (pop / lookup)
```

Satu router bisa menjadi ingress untuk satu LSP, transit untuk LSP lain, dan egress untuk LSP ketiga. Peran itu melekat pada LSP, bukan pada perangkat.

---

## 5. Tabel-Tabel: RIB, LIB, FIB, LFIB

Seperti routing IP yang membedakan RIB (control plane) dan FIB (data plane), MPLS punya pasangan sendiri:

```
                    CONTROL PLANE
 ┌───────────────┐              ┌──────────────────────────────────┐
 │  RIB (IGP)    │              │  LIB (Label Information Base)    │
 │  10.255.0.3/32│              │  FEC 10.255.0.3/32               │
 │   via p1      │              │   label lokal saya : 18          │
 └──────┬────────┘              │   dari p1          : 17  ← dipakai│
        │                       │   dari tetangga X  : 22          │
        │                       └────────────┬─────────────────────┘
        │   digabung: "next hop IGP = p1, maka pakai label dari p1"
        ▼                                    ▼
 ┌────────────────────────────┐   ┌─────────────────────────────────────┐
 │ FIB (paket IP masuk)       │   │ LFIB (paket berlabel masuk)         │
 │ 10.255.0.3/32 → push 17,   │   │ label masuk 18 → swap ke 17,        │
 │   keluar eth1 ke p1        │   │   keluar eth1 ke p1                 │
 └────────────────────────────┘   └─────────────────────────────────────┘
                     DATA PLANE
```

| Tabel | Isi | Dipakai untuk |
|---|---|---|
| **RIB** | Rute terbaik dari IGP/BGP/static | Menentukan next hop untuk FEC |
| **LIB** | **Semua** pasangan FEC dan label: label lokal yang saya umumkan, plus label dari **setiap** tetangga LDP | Basis data mentah label |
| **FIB** | Entri forwarding IP, kini dengan instruksi "push label X" | Paket **IP** yang masuk (di ingress) |
| **LFIB** | Label masuk → aksi (swap/pop) + label keluar + interface | Paket **berlabel** yang masuk (di transit dan egress) |

Aturan pemilihannya sederhana: dari sekian label yang ada di LIB untuk satu FEC, router memakai label dari tetangga yang menjadi **next hop IGP** untuk FEC itu. Label dari tetangga lain tetap disimpan (lihat *liberal retention* di §8), tetapi tidak dipasang ke LFIB.

Contoh nyata dari router p1 di lab. Perhatikan kolom "In Use":

```
p1# show mpls ldp binding
AF   Destination          Nexthop         Local Label Remote Label  In Use
ipv4 10.255.0.1/32        10.255.0.1      16          imp-null         yes
ipv4 10.255.0.1/32        10.255.0.3      16          17                no
ipv4 10.255.0.3/32        10.255.0.1      17          18                no
ipv4 10.255.0.3/32        10.255.0.3      17          imp-null         yes
```

Untuk FEC `10.255.0.3/32`, p1 mengumumkan label lokal **17**. Ia menerima dua label dari tetangga: 18 dari pe1 dan `imp-null` dari pe2. Next hop IGP ke 10.255.0.3 adalah pe2, jadi yang dipakai adalah `imp-null` (artinya: pop). Label 18 dari pe1 disimpan tetapi tidak dipakai. LFIB-nya menjadi:

```
p1# show mpls table
 Inbound Label  Type  Nexthop    Outbound Label
 ------------------------------------------------
 16             LDP   10.0.12.1  implicit-null
 17             LDP   10.0.23.2  implicit-null
```

Padanan perintah antarplatform:

| Tabel | Cisco IOS XE | Cisco IOS XR | Junos | RouterOS v7 | FRR |
|---|---|---|---|---|---|
| LIB | `show mpls ldp bindings` | `show mpls ldp bindings` | `show ldp database` | `/mpls ldp local-mapping print` dan `remote-mapping print` | `show mpls ldp binding` |
| LFIB | `show mpls forwarding-table` | `show mpls forwarding` | `show route table mpls.0` | `/mpls forwarding-table print` | `show mpls table` |
| FIB berlabel | `show ip cef 10.255.0.3 detail` | `show cef 10.255.0.3/32` | `show route table inet.3` | `/ip route print detail` | `show ip route` (kolom `label`) |

> [!TIP]
> Di Junos, tabel **`inet.3`** khusus berisi "tujuan yang bisa dicapai lewat LSP". BGP memakainya untuk me-resolve next hop layanan VPN. Kalau loopback PE seberang tidak ada di `inet.3`, layanan VPN ke PE itu tidak akan jalan. Ini pola pikir yang berguna juga untuk vendor lain.

---

## 6. Operasi Label: Push, Swap, Pop

Ada tiga operasi dasar:

| Operasi | Di mana | Yang terjadi |
|---|---|---|
| **Push** (*impose*) | Ingress (PE) | Menambah satu label atau lebih di atas paket |
| **Swap** | Transit (P) | Mengganti label teratas dengan label lain |
| **Pop** (*dispose*) | Penultimate hop atau egress | Membuang label teratas |

Operasi bisa digabung, misalnya "swap lalu push" (dipakai pada fast reroute di 22.3).

### Perjalanan satu paket, langkah demi langkah

Gunakan lab modul ini: pelanggan A di ce1a mengirim ping ke `192.168.2.1` di belakang ce2a. Untuk saat ini abaikan label VPN (dibahas di 22.2) dan fokus pada label **transport** yang membawa paket dari pe1 ke pe2.

```
ce1a ──IP──► pe1 ──[17|81|IP]──► p1 ──[81|IP]──► pe2 ──IP──► ce2a
             PUSH 17 (+81)       POP 17 (PHP)     POP 81, lookup VRF
```

1. **Di pe1 (ingress).** Paket IP masuk dari ce1a. pe1 mencari tujuan di tabel VRF pelanggan dan menemukan bahwa `192.168.2.0/24` ada di belakang pe2 (`10.255.0.3`). Untuk mencapai `10.255.0.3/32`, LIB pe1 punya label **17** dari p1. pe1 melakukan **push**: label VPN 81 di bawah, label transport 17 di atas.
2. **Di p1 (transit, sekaligus penultimate hop).** p1 menerima label 17. LFIB-nya berkata "17 → implicit-null ke 10.0.23.2". Artinya p1 **membuang** label 17 dan meneruskan sisanya (label 81 dan paket IP) ke pe2. p1 tidak pernah melihat alamat 192.168.x.x.
3. **Di pe2 (egress).** pe2 menerima label 81, yang ia alokasikan sendiri untuk VRF pelanggan A. pe2 membuang label itu, lalu mencari `192.168.2.1` di tabel VRF A dan meneruskan paket IP ke ce2a.

Bandingkan dengan tangkapan paket di dua sisi p1:

```
Masuk ke p1 (eth1, dari pe1):
  MPLS (label 17, tc 0, ttl 63) (label 81, tc 0, [S], ttl 63) IP 192.168.1.1 > 192.168.2.1

Keluar dari p1 (eth2, ke pe2):
  MPLS (label 81, tc 0, [S], ttl 63) IP 192.168.1.1 > 192.168.2.1
```

Label 17 hilang di p1. Itulah PHP.

### PHP: Penultimate Hop Popping

Tanpa PHP, pe2 harus melakukan **dua** lookup untuk setiap paket: lookup label transport (yang hanya berkata "ini untuk saya, buang"), lalu lookup label VPN atau alamat IP. Lookup pertama tidak berguna. Dengan PHP (RFC 3031 §3.16), router **sebelum** egress yang membuang label transport, sehingga egress langsung bekerja pada isi di bawahnya.

Mekanismenya: egress mengiklankan **label 3 (implicit null)** untuk FEC miliknya, yaitu loopback dan subnet yang terhubung langsung. Tetangga yang menerima "label 3" tahu bahwa ia harus melakukan pop, bukan swap. Label 3 tidak pernah muncul di paket.

```
pe1# show mpls ldp binding
AF   Destination          Nexthop         Local Label Remote Label  In Use
ipv4 10.255.0.2/32        10.255.0.2      17          imp-null         yes   ← p1 = egress loopback-nya sendiri
ipv4 10.255.0.3/32        10.255.0.2      18          17               yes   ← p1 transit, pakai label 17
```

### Explicit NULL: kapan PHP justru merugikan

PHP punya efek samping: label transport dibuang **sebelum** egress, sehingga **nilai TC (QoS) di label itu ikut hilang**. Pada paket dengan satu label (misalnya internet berlabel), egress hanya menerima paket IP polos, dengan DSCP pelanggan yang mungkin berbeda dari kelas yang ditentukan operator.

Solusinya: egress mengiklankan **label 0 (IPv4 explicit null)** sebagai ganti label 3. Penultimate hop melakukan swap ke label 0, egress menerima paket dengan label 0 (berikut TC-nya), membaca TC untuk penjadwalan antrean, lalu membuangnya.

Dari lab, setelah pe2 dikonfigurasi `label local advertise explicit-null`:

```
p1# show mpls table
 Inbound Label  Type  Nexthop    Outbound Label
 ----------------------------------------------------
 16             LDP   10.0.12.1  implicit-null
 17             LDP   10.0.23.2  IPv4 Explicit Null

Keluar dari p1 ke pe2:
  MPLS (label 0, tc 0, ttl 62) (label 81, tc 0, [S], ttl 63) IP 192.168.1.1 > 192.168.2.1
```

| | Implicit NULL (label 3, default) | Explicit NULL (label 0 / 2) |
|---|---|---|
| Label di paket terakhir | Tidak ada (sudah di-pop) | Ada, bernilai 0 atau 2 |
| Lookup di egress | Satu | Dua (tetapi lookup label 0 sangat murah) |
| TC sampai di egress | **Tidak** | **Ya** |
| Dipakai saat | Kebanyakan kasus | Model QoS *pipe*/*short pipe* yang butuh TC di egress |

Konfigurasi explicit null per vendor:

```
Cisco IOS XE : mpls ldp explicit-null
Cisco IOS XR : mpls ldp address-family ipv4 label local advertise explicit-null
Junos        : set protocols ldp explicit-null
RouterOS v7  : /mpls ldp set [find] use-explicit-null=yes
FRR          : mpls ldp / address-family ipv4 / label local advertise explicit-null
```

---

## 7. TTL dan Propagasi

### Aturan dasar (RFC 3032 dan RFC 3443)

- Saat **push** di ingress, TTL label diisi dari TTL IP (setelah dikurangi satu). Ini disebut **TTL propagation**.
- Setiap router yang memproses label **mengurangi TTL label teratas**, bukan TTL IP.
- Saat **pop** label terakhir, TTL label disalin kembali ke TTL IP (bila lebih kecil).
- Jika TTL label habis di tengah jalan, router membuang paket dan, bila mampu, membuat ICMP Time Exceeded.

Akibatnya, dengan propagasi aktif, `traceroute` dari pelanggan **melihat router-router core** operator. Banyak operator tidak mau itu: topologi internal terekspos, dan pelanggan bingung melihat hop dengan alamat yang tidak mereka kenal.

### Tiga model (RFC 3443)

| Model | TTL saat push | Hop core terlihat di traceroute pelanggan? | Catatan |
|---|---|---|---|
| **Uniform** | Disalin dari IP | Ya | Default di kebanyakan platform. Domain MPLS terlihat seperti rangkaian router IP biasa |
| **Short pipe** | Diisi 255 | Tidak | Seluruh domain MPLS tampak sebagai satu hop. TTL IP hanya dikurangi di ingress dan egress |
| **Pipe** | Diisi 255 | Tidak | Seperti short pipe. Bedanya ada pada perlakuan QoS di egress (RFC 3270), bukan pada TTL |

Bukti dari lab. Dengan propagasi aktif (default Linux), lalu dengan `net.mpls.ip_ttl_propagate=0` di pe1 dan pe2:

```
Propagasi aktif:                       Propagasi mati:
 1  172.16.1.1   (pe1)                  1  172.16.1.1   (pe1)
 2  *            (p1)                   2  192.168.2.1  (ce2a)
 3  192.168.2.1  (ce2a)
```

Dengan propagasi mati, core MPLS lenyap dari traceroute. Mengapa hop 2 menjadi `*` pada kondisi pertama, dan bukan alamat p1? Lihat subbagian berikut.

### ICMP di dalam core: dikirim ke depan, bukan ke belakang

Router P yang membuang paket karena TTL habis harus mengirim ICMP Time Exceeded ke pengirim. Masalahnya, pengirim itu adalah alamat pelanggan (`192.168.1.1`) yang **tidak ada** di tabel routing P (ingat: BGP-free core). RFC 3032 §2.3.2 memberi solusi: router P membuat ICMP, lalu mengirimnya **ke depan sepanjang LSP yang sama** dengan tumpukan label paket asli. PE egress, yang punya tabel VRF pelanggan, lalu merutekan ICMP itu kembali ke pengirim.

Konsekuensi praktis:

- Jika LSP putus di tengah, ICMP dari hop sebelum titik putus juga tidak pernah kembali. **Traceroute biasa tidak bisa diandalkan untuk mencari titik putus di MPLS.** Itulah alasan ada LSP ping/traceroute (§13).
- Router yang mendukung **RFC 4950** menyisipkan tumpukan label paket asli ke dalam ICMP, sehingga traceroute menampilkan `MPLS: Label=17`. Cisco, Juniper, dan MikroTik melakukannya.
- Dataplane MPLS kernel Linux (dipakai FRR di lab) **membuang** paket berlabel yang TTL-nya habis tanpa membuat ICMP. Itulah sebabnya p1 tampil sebagai `*`. Ini batasan Linux, bukan perilaku MPLS secara umum.

### Konfigurasi menyembunyikan core

```
! Cisco IOS XE: sembunyikan core dari trafik pelanggan (forwarded),
! tetapi biarkan traceroute dari router sendiri (local) tetap melihatnya
no mpls ip propagate-ttl forwarded

! Cisco IOS XR
mpls ip-ttl-propagate disable forwarded

# Junos
set protocols mpls no-propagate-ttl

# RouterOS v7
/mpls settings set propagate-ttl=no

# Linux (FRR memakai dataplane kernel)
sysctl -w net.mpls.ip_ttl_propagate=0
```

> [!TIP]
> Varian `forwarded` di Cisco adalah kompromi yang bagus: pelanggan tidak melihat core, tetapi engineer NOC yang menjalankan traceroute dari router operator masih melihat setiap hop.

> [!WARNING]
> **TTL propagation harus konsisten di semua PE.** Jika ingress menyalin TTL tetapi egress tidak, atau sebaliknya, traceroute menampilkan hasil yang membingungkan, dan pada kasus ekstrem TTL IP bisa "naik" setelah keluar dari domain MPLS.

---

## 8. LDP: Label Distribution Protocol

Label harus disepakati antar-tetangga: "untuk FEC 10.255.0.3/32, kirim ke saya dengan label 17". Protokol yang paling umum untuk ini adalah **LDP** (RFC 5036). Alternatifnya: RSVP-TE (jalur eksplisit, 22.3), BGP labeled unicast (RFC 8277, untuk antar-domain), dan Segment Routing yang menyebar label lewat IGP (22.3).

### Karakteristik

| Aspek | Nilai |
|---|---|
| Standar | RFC 5036 (menggantikan RFC 3036) |
| Discovery | **UDP 646**, hello multicast ke **224.0.0.2** (semua router di subnet) |
| Sesi | **TCP 646** |
| LDP Identifier | 6 byte: **LSR ID** (4 byte, biasanya loopback) + **label space** (2 byte, 0 = berlaku untuk seluruh router). Ditulis `10.255.0.1:0` |
| Hello default | Interval 5 detik, hold 15 detik (link hello) |
| Keepalive sesi | Umumnya hold 180 detik, keepalive 60 detik |
| Ketergantungan | Butuh IGP untuk jalur dan untuk mencapai transport address tetangga |

### Fase 1: Discovery

**Basic discovery.** Setiap router mengirim LDP Link Hello lewat UDP 646 ke `224.0.0.2` di setiap interface yang mengaktifkan LDP. Hello berisi LDP ID pengirim, hold time, dan **transport address**: alamat IP yang akan dipakai untuk TCP. Router yang mendengar hello mencatat "ada calon tetangga LDP di interface ini".

**Extended discovery.** Hello unicast ke alamat tertentu yang tidak bertetangga langsung, disebut **targeted hello** (hold default 45 detik). Dipakai untuk pseudowire L2VPN (22.4), remote LFA, dan session protection (§9).

```
pe1# show mpls ldp discovery
AF   ID              Type     Source           Holdtime
ipv4 10.255.0.2      Link     eth1                   15
```

> [!WARNING]
> **Transport address harus bisa dicapai.** Praktik standar adalah memakai loopback sebagai transport address. Akibatnya **loopback tetangga harus sudah ada di tabel routing via IGP** sebelum sesi TCP bisa terbentuk. Jika IGP belum jalan atau loopback tidak diiklankan, hello terlihat di `discovery` tetapi tetangga tidak pernah `OPERATIONAL`.

### Fase 2: Sesi TCP

Dari dua router yang saling mendengar hello, router dengan **transport address lebih besar** mengambil peran *active* dan membuka koneksi TCP ke port 646 milik tetangganya (RFC 5036 §2.5.2). Yang lain menjadi *passive*. Setelah TCP tersambung, keduanya bertukar pesan **Initialization** untuk menyepakati parameter: versi protokol, keepalive time, mode advertisement (*downstream unsolicited* atau *on demand*), deteksi loop, dan ukuran PDU maksimum.

```
Status sesi:
NON EXISTENT → INITIALIZED → OPENREC / OPENSENT → OPERATIONAL ✅
```

Di lab, LDP ID p1 `10.255.0.2` lebih besar dari pe1 `10.255.0.1`, jadi p1 yang membuka TCP. Terlihat dari port sumber acak di sisi p1:

```
pe1# show mpls ldp neighbor detail
Peer LDP Identifier: 10.255.0.2:0
  TCP connection: 10.255.0.1:646 - 10.255.0.2:51627
  Session Holdtime: 180 secs; KeepAlive interval: 60 secs
  State: OPERATIONAL; Downstream-Unsolicited
```

### Fase 3: Pertukaran label

Begitu sesi `OPERATIONAL`, router bertukar dua jenis informasi penting:

1. **Address message.** Daftar **semua alamat interface** milik router itu. Ini yang memungkinkan pe1 menghubungkan "next hop IGP saya 10.0.12.2" dengan "tetangga LDP 10.255.0.2". Tanpa address message, label dari tetangga tidak bisa dicocokkan dengan next hop.
2. **Label Mapping message.** Pasangan FEC dan label: "untuk 10.255.0.3/32, pakai label 17 ke saya".

| Pesan LDP | Fungsi |
|---|---|
| Hello | Discovery (UDP) |
| Initialization | Negosiasi parameter sesi |
| KeepAlive | Menjaga sesi hidup |
| Address / Address Withdraw | Mengumumkan / menarik alamat interface |
| **Label Mapping** | Mengumumkan binding FEC ke label |
| Label Request | Meminta label (mode on demand) |
| Label Withdraw | Menarik binding yang sudah diumumkan |
| Label Release | Memberi tahu bahwa label dari tetangga tidak dipakai lagi |
| Label Abort Request | Membatalkan permintaan label |
| Notification | Pemberitahuan error atau status. Error fatal menutup sesi |

### Tiga pasang pilihan mode distribusi label

LDP mendefinisikan tiga keputusan desain. Pahami ketiganya karena perilaku vendor berbeda.

**1. Advertisement: Downstream Unsolicited (DU) vs Downstream on Demand (DoD).**
DU: router mengumumkan label ke semua tetangga tanpa diminta, untuk setiap FEC yang ia punya. DoD: router hanya memberi label bila upstream memintanya. Hampir semua jaringan Ethernet memakai **DU**. DoD dipakai pada kasus khusus seperti ATM dulu dan beberapa desain seamless MPLS dengan perangkat akses bermemori kecil.

**2. Label retention: Liberal vs Conservative.**
Liberal: simpan label dari **semua** tetangga, termasuk yang bukan next hop saat ini. Conservative: simpan hanya label dari next hop. Liberal memakai sedikit lebih banyak memori, tetapi **konvergensinya lebih cepat**: ketika IGP pindah ke next hop lain, label dari next hop baru sudah ada di LIB, tinggal dipasang ke LFIB. Output p1 di §5 menunjukkan liberal retention: dua label untuk satu FEC, satu `yes`, satu `no`.

**3. Label distribution control: Independent vs Ordered.**
Independent: setiap router langsung mengalokasikan dan mengumumkan label untuk setiap FEC di tabel routingnya, tanpa menunggu tetangga downstream. Ordered: router hanya mengumumkan label untuk FEC jika ia **egress** untuk FEC itu, atau jika ia sudah menerima label dari next hop downstream. Ordered mencegah upstream memakai LSP yang belum utuh sampai ujung, dengan imbalan konvergensi sedikit lebih lambat.

| Platform | Advertisement | Retention | Control | Catatan |
|---|---|---|---|---|
| Cisco IOS XE / XR | DU | Liberal | **Independent** | Default label untuk **semua** prefix IGP |
| Juniper Junos | DU | Liberal | **Ordered** | Default hanya mengiklankan label untuk **loopback** sendiri (atur dengan `egress-policy`) |
| FRRouting ldpd | DU | Liberal | Independent (opsi `ordered-control`) | Lihat dokumentasi ldpd |
| MikroTik RouterOS v7 | DU | Liberal | Independent | Ordered, conservative, dan DoD **belum** didukung menurut manual |

Kedua mode control bisa bekerja sama dalam satu jaringan. Perbedaan perilaku default ini sering muncul di soal ujian dan di lapangan saat menyambung Cisco dengan Juniper.

### Membatasi label hanya untuk yang perlu

Secara default, Cisco dan FRR mengalokasikan label untuk **setiap** prefix di IGP, termasuk subnet link antar-router yang tidak pernah menjadi tujuan layanan. Pada backbone besar ini membuang memori LFIB. Praktik umum: hanya alokasikan label untuk **loopback /32** (BGP next hop dan endpoint pseudowire).

```
! Cisco IOS XE
mpls ldp label
 allocate global host-routes

# MikroTik RouterOS v7 (filter advertisement)
/mpls ldp advertise-filter add prefix=10.255.0.0/24 advertise=yes
/mpls ldp advertise-filter add prefix=0.0.0.0/0 advertise=no
```

> [!WARNING]
> **Loopback PE harus diiklankan sebagai /32.** Jika loopback diiklankan sebagai /24 (misalnya karena salah konfigurasi interface loopback di OSPF yang di beberapa platform diiklankan apa adanya), FEC menjadi /24 sementara BGP next hop adalah /32. Banyak implementasi lalu gagal mencocokkan label, dan layanan VPN putus walau `ping` antar-loopback berhasil.

---

## 9. LDP-IGP Synchronization dan Session Protection

### Masalah: IGP lebih cepat daripada LDP

Bayangkan link antara P1 dan P2 baru saja pulih. IS-IS membentuk adjacency dalam hitungan detik, lalu menghitung bahwa jalur terbaik ke PE2 kini lewat link itu. Tetapi sesi LDP di link tersebut belum `OPERATIONAL`, atau sudah tetapi label belum dipertukarkan. Selama jeda itu, P1 meneruskan trafik ke P2 **tanpa label yang sah**. Paket VPN yang kehilangan label transport akan dibuang atau salah diteruskan. Hasilnya **blackhole** beberapa detik sampai puluhan detik, setiap kali link naik.

Masalah serupa muncul jika sesi LDP putus (misalnya karena salah konfigurasi atau ACL) sementara IGP tetap hidup: IGP terus memilih link itu, padahal tidak ada label di sana.

### Solusi: RFC 5443

Dengan **LDP-IGP synchronization**, IGP tidak mau memakai sebuah link untuk trafik transit sampai LDP di link itu sinkron. Caranya: selama LDP belum siap, IGP mengiklankan link tersebut dengan **metrik maksimum**:

- IS-IS (wide metric): **16.777.214** (2²⁴ - 2)
- OSPF: **65.535** (*LSInfinity*)

Link tetap ada di topologi (sehingga sesi LDP bisa terbentuk melewatinya), tetapi tidak dipilih selama ada jalur alternatif.

Bukti dari lab. LDP dimatikan di interface p1 ke pe2, dan pe2 (yang mengaktifkan `mpls ldp-sync` di IS-IS) langsung mengiklankan metrik maksimum:

```
p1# show isis mpls ldp-sync
eth2
  LDP-IGP Synchronization enabled: yes
  holddown timer in seconds: 0
  State: Sync not achieved

p1# show isis database detail pe2
  Extended Reachability: 0102.5500.0002.00 (Metric: 16777214)
```

Di topologi lab yang hanya punya satu jalur, metrik maksimum tidak bisa menyelamatkan trafik (tidak ada jalur lain). Di backbone nyata dengan jalur cadangan, fitur ini mengalihkan trafik ke jalur yang labelnya utuh.

Konfigurasi:

```
! Cisco IOS XE (global di proses IGP)
router isis CORE
 mpls ldp sync
router ospf 1
 mpls ldp sync

! Cisco IOS XR (per interface di IGP)
router isis CORE
 interface GigabitEthernet0/0/0/0
  address-family ipv4 unicast
   mpls ldp sync

# Junos
set protocols isis interface ge-0/0/0.0 ldp-synchronization
set protocols ospf area 0 interface ge-0/0/0.0 ldp-synchronization

# FRR
router isis CORE
 mpls ldp-sync
router ospf
 mpls ldp-sync
```

> [!WARNING]
> Aktifkan LDP-IGP sync di **kedua** sisi link. Metrik dalam IS-IS dan OSPF diiklankan per arah, jadi jika hanya satu sisi yang mengaktifkannya, arah sebaliknya tetap memakai link yang belum siap.

### Session protection: jangan buang label saat link berkedip

Ketika link fisik antara dua router putus, hello LDP berhenti, sesi LDP putus, dan semua label dari tetangga itu dibuang. Saat link kembali, sesi dibangun dari awal dan semua label dipertukarkan ulang. Pada router dengan ribuan FEC, ini memperlambat pemulihan.

**Session protection** menambahkan **targeted hello** ke loopback tetangga. Selama loopback tetangga masih bisa dicapai lewat jalur lain di IGP, sesi LDP **tetap hidup** walau link langsungnya putus. Label dari tetangga tetap ada di LIB (berkat liberal retention). Saat link kembali, LFIB langsung bisa dipasang tanpa menunggu pertukaran label ulang.

```
                 jalur cadangan (lewat P3)
        ┌──────────────────────────────────────┐
       P1 ═════════ link langsung (putus) ═════ P2
        │  sesi LDP tetap hidup lewat targeted   │
        │  hello antar-loopback                  │
```

```
! Cisco IOS XE
mpls ldp session protection
! Cisco IOS XR
mpls ldp
 session protection
# Junos
set protocols ldp session-protection
```

FRR ldpd dan MikroTik RouterOS v7 tidak mendokumentasikan fitur session protection. Di kedua platform itu, andalkan konvergensi IGP yang cepat dan LDP-IGP sync (FRR).

> [!TIP]
> LDP-IGP sync dan session protection saling melengkapi. Sync mencegah trafik masuk ke link tanpa label. Session protection mempercepat kembalinya label setelah link pulih. Operator besar biasanya mengaktifkan keduanya, ditambah BFD untuk mendeteksi kegagalan link lebih cepat (22.5).

---

## 10. MTU di Jaringan MPLS

Setiap label menambah **4 byte**. Jumlahnya cepat bertambah:

| Layanan | Label tipikal | Tambahan byte |
|---|---|---|
| Internet berlabel (satu label transport) | 1 | 4 |
| **L3VPN** (transport + VPN) | 2 | **8** |
| L3VPN lewat TE/FRR backup tunnel | 3 | 12 |
| L2VPN pseudowire + control word | 2 label + 4 byte CW | 12, ditambah header Ethernet pelanggan 14 sampai 18 byte |
| SR dengan TI-LFA dan beberapa segmen | 3 sampai 5+ | 12 sampai 20+ |

Jika interface core memakai MTU 1500 dan pelanggan mengirim paket IP 1500 byte, paket itu menjadi 1508 byte setelah dua label. Ada tiga kemungkinan hasil, dan dua di antaranya buruk:

1. **Paket dibuang diam-diam** oleh switch atau router di tengah yang tidak sanggup menerima frame lebih besar. Pelanggan melihat gejala klasik "ping jalan, web sebagian macet, transfer file besar hang".
2. Router membuat **ICMP Fragmentation Needed** (bila bit DF set). Seperti dijelaskan di §7, ICMP dari router P dikirim ke depan sepanjang LSP, jadi bisa sampai atau tidak bergantung keadaan.
3. Router memfragmentasi paket (bila DF tidak set). Mahal bagi CPU dan sering dinonaktifkan.

Bukti dari lab saat link core diberi MTU 1500 (bukan default containerlab). PE Linux menghitung bahwa ruang IP yang tersisa adalah 1500 - 8 = 1492 byte, lalu mengirim ICMP ke CE:

```
ce1a$ ping -M do -s 1464 -I 192.168.1.1 192.168.2.1     ← 1464 + 28 = 1492, lolos
2 packets transmitted, 2 received, 0% packet loss

ce1a$ ping -M do -s 1465 -I 192.168.1.1 192.168.2.1     ← 1493, terlalu besar
ping: local error: message too long, mtu=1492
```

### Praktik yang benar

- **Naikkan MTU di seluruh core.** Praktik umum operator adalah MTU interface core 9000 byte ke atas (jumbo), sehingga ada ruang lega untuk label apa pun sementara pelanggan tetap memakai 1500. Ingat bahwa **semua** perangkat di jalur (termasuk switch layer 2, perangkat DWDM, dan microwave) harus mendukung frame sebesar itu.
- Jika jumbo tidak mungkin, minimal sediakan *baby giant*: 1500 + 4 × jumlah label maksimum. Perangkat Ethernet lama sering mendukung 1504 sampai 1546 byte.
- Bedakan **MTU interface** (ukuran frame L2), **IP MTU**, dan **MPLS MTU** (ukuran paket berlabel). Di Cisco, `mpls mtu` diatur per interface. Di RouterOS, `/mpls interface` punya parameter `mpls-mtu`, dan perangkat MikroTik juga punya konsep **L2MTU** terpisah dari MTU.
- Uji dengan ping DF berukuran penuh di setiap layanan baru: `ping 192.168.2.1 size 1500 df-bit` (Cisco), `ping -M do -s 1472` (Linux).

```
! Cisco IOS XE
interface GigabitEthernet1
 mtu 9216
 mpls mtu 9100

# Junos
set interfaces ge-0/0/0 mtu 9192
set interfaces ge-0/0/0 unit 0 family mpls mtu 9100

# RouterOS v7
/interface ethernet set ether1 l2mtu=9100 mtu=9000
/mpls interface add interface=ether1 mpls-mtu=9000
```

> [!WARNING]
> **MTU adalah penyebab nomor satu keluhan "VPN baru jalan setengah".** Sebelum menyerahkan layanan ke pelanggan, selalu uji ping DF 1500 byte dari CE ke CE.

---

## 11. Konfigurasi Multi-Vendor

Semua contoh di bawah memakai topologi yang sama dengan lab: tiga router backbone `PE1 - P1 - PE2` dengan loopback `10.255.0.1`, `10.255.0.2`, `10.255.0.3`, IS-IS level 2 sebagai IGP, dan LDP di link core. Yang ditampilkan adalah PE1. Router lain identik, cukup ganti alamat.

### Cisco IOS XE

```
hostname PE1
!
mpls label protocol ldp                 ! default di IOS XE modern, tulis agar eksplisit
mpls ldp router-id Loopback0 force      ! LDP ID = loopback, bukan alamat interface acak
mpls ldp session protection
!
interface Loopback0
 ip address 10.255.0.1 255.255.255.255
 ip router isis CORE
!
interface GigabitEthernet1
 description ke-P1
 mtu 9216
 ip address 10.0.12.1 255.255.255.252
 ip router isis CORE
 isis network point-to-point
 mpls ip                                ! aktifkan LDP + forwarding MPLS di interface
!
router isis CORE
 net 49.0001.0102.5500.0001.00
 is-type level-2-only
 metric-style wide
 passive-interface Loopback0
 mpls ldp sync
```

Alternatif dari `mpls ip` per interface: `mpls ldp autoconfig` di bawah `router isis` atau `router ospf`, yang menyalakan LDP di semua interface IGP. Praktis, tetapi hati-hati: interface ke pelanggan yang kebetulan masuk IGP juga ikut menyalakan LDP.

Verifikasi:

```
PE1# show mpls interfaces
PE1# show mpls ldp discovery
PE1# show mpls ldp neighbor
PE1# show mpls ldp bindings 10.255.0.3 32
PE1# show mpls forwarding-table
PE1# show mpls ldp igp sync
PE1# show ip cef 10.255.0.3 detail
```

Contoh bentuk output LFIB di IOS XE (nilai ilustratif):

```
PE1# show mpls forwarding-table
Local      Outgoing   Prefix           Bytes Label   Outgoing   Next Hop
Label      Label      or Tunnel Id     Switched      interface
16         Pop Label  10.255.0.2/32    0             Gi1        10.0.12.2
17         17         10.255.0.3/32    0             Gi1        10.0.12.2
18         Pop Label  10.0.23.0/30     0             Gi1        10.0.12.2
```

`Pop Label` berarti tetangga mengiklankan implicit null (PHP). `No Label` (pada versi lama `Untagged`) berarti **tidak ada label dari next hop**: router akan membuang seluruh tumpukan label dan meneruskan paket sebagai IP biasa. Untuk trafik VPN, itu sama dengan blackhole.

### Cisco IOS XR

```
hostname PE1
!
interface Loopback0
 ipv4 address 10.255.0.1 255.255.255.255
!
interface GigabitEthernet0/0/0/0
 description ke-P1
 mtu 9216
 ipv4 address 10.0.12.1 255.255.255.252
!
router isis CORE
 is-type level-2-only
 net 49.0001.0102.5500.0001.00
 address-family ipv4 unicast
  metric-style wide
 !
 interface Loopback0
  passive
  address-family ipv4 unicast
 !
 interface GigabitEthernet0/0/0/0
  point-to-point
  address-family ipv4 unicast
   mpls ldp sync
!
mpls oam                                ! wajib agar LSP ping/traceroute dijawab
!
mpls ldp
 router-id 10.255.0.1
 session protection
 interface GigabitEthernet0/0/0/0
```

Di IOS XR, interface tidak ikut LDP sebelum didaftarkan di bawah `mpls ldp`. Perubahan baru berlaku setelah `commit`.

```
RP/0/RP0/CPU0:PE1# show mpls ldp neighbor brief
RP/0/RP0/CPU0:PE1# show mpls ldp bindings 10.255.0.3/32
RP/0/RP0/CPU0:PE1# show mpls forwarding
RP/0/RP0/CPU0:PE1# show mpls ldp igp sync
RP/0/RP0/CPU0:PE1# ping mpls ipv4 10.255.0.3/32
```

### Juniper Junos

```
set interfaces ge-0/0/0 description ke-P1
set interfaces ge-0/0/0 mtu 9192
set interfaces ge-0/0/0 unit 0 family inet address 10.0.12.1/30
set interfaces ge-0/0/0 unit 0 family iso
set interfaces ge-0/0/0 unit 0 family mpls
set interfaces lo0 unit 0 family inet address 10.255.0.1/32
set interfaces lo0 unit 0 family iso address 49.0001.0102.5500.0001.00

set routing-options router-id 10.255.0.1

set protocols isis level 1 disable
set protocols isis interface ge-0/0/0.0 point-to-point
set protocols isis interface ge-0/0/0.0 ldp-synchronization
set protocols isis interface lo0.0 passive

set protocols mpls interface ge-0/0/0.0
set protocols ldp interface ge-0/0/0.0
set protocols ldp session-protection
```

> [!WARNING]
> **Junos butuh tiga hal di interface yang sama:** `family mpls` di unit interface, interface terdaftar di `protocols mpls`, dan interface terdaftar di `protocols ldp`. Lupa salah satunya adalah kesalahan paling umum di Junos: sesi LDP bisa saja terbentuk, tetapi paket berlabel dibuang.

```
user@PE1> show ldp neighbor
user@PE1> show ldp session
user@PE1> show ldp database
user@PE1> show route table inet.3
user@PE1> show route table mpls.0
user@PE1> ping mpls ldp 10.255.0.3/32
user@PE1> traceroute mpls ldp 10.255.0.3/32
```

Ingat perbedaan default Junos: LDP hanya mengiklankan label untuk loopback router itu sendiri. Untuk mengiklankan prefix lain, buat `policy-statement` lalu pasang dengan `set protocols ldp egress-policy NAMA`.

### MikroTik RouterOS v7

```
# Loopback: di v7 bisa memakai interface loopback bawaan atau bridge kosong
/interface bridge add name=lo
/ip address add address=10.255.0.1/32 interface=lo
/ip address add address=10.0.12.1/30 interface=ether1

# IGP: contoh memakai OSPF v7 (IS-IS di RouterOS v7 lihat 19-mikrotik/08-routing-v7)
/routing ospf instance add name=core router-id=10.255.0.1
/routing ospf area add name=backbone instance=core area-id=0.0.0.0
/routing ospf interface-template add area=backbone networks=10.255.0.1/32 passive
/routing ospf interface-template add area=backbone networks=10.0.12.0/30 type=ptp

# MPLS MTU di interface core
/mpls interface add interface=ether1 mpls-mtu=1600

# LDP
/mpls ldp add afi=ip lsr-id=10.255.0.1 transport-addresses=10.255.0.1
/mpls ldp interface add interface=ether1

# Verifikasi
/mpls ldp neighbor print
/mpls ldp local-mapping print
/mpls ldp remote-mapping print
/mpls forwarding-table print
/tool traceroute 10.255.0.3 src-address=10.255.0.1
```

**Keterbatasan RouterOS v7 yang perlu Anda ketahui** (menurut manual MikroTik):

- LDP hanya mendukung *downstream unsolicited*, *independent control*, dan *liberal retention*. **Ordered control, conservative retention, dan downstream on demand belum didukung.**
- BGP sebagai protokol distribusi label (BGP labeled unicast) belum didukung, sehingga desain seamless/unified MPLS dan inter-AS option C tidak bisa dibangun murni dengan RouterOS.
- RSVP-TE tersedia, tetapi fast reroute dan link/node protection belum ada.
- Manual tidak mendokumentasikan LDP-IGP synchronization maupun session protection.
- MPLS tidak didukung di perangkat SMIPS (hAP lite, hAP mini, dan sejenisnya).
- Paket yang di-switch dengan MPLS **tidak diproses firewall IP**. Filter dan NAT harus diterapkan di ingress atau egress domain MPLS.

Detail konfigurasi MPLS dan VPLS RouterOS yang lebih lengkap ada di `19-mikrotik/09-mpls-routeros`.

### FRRouting di Linux

FRR memakai dataplane MPLS milik **kernel Linux**. Tanpa persiapan kernel, ldpd tetap bisa bertukar label, tetapi zebra gagal memasang LSP dan paket tidak pernah diberi label.

**Prasyarat kernel** (di host, sekali per boot, butuh root):

```bash
sudo modprobe mpls_router        # forwarding MPLS (tabel label, swap/pop)
sudo modprobe mpls_iptunnel      # encap IP → MPLS (push di ingress)
lsmod | grep mpls                # pastikan keduanya termuat

# Agar permanen
echo -e "mpls_router\nmpls_iptunnel" | sudo tee /etc/modules-load.d/mpls.conf
```

**Sysctl** (per network namespace, jadi di dalam container masing-masing router):

```bash
sysctl -w net.mpls.platform_labels=100000   # ukuran tabel label. Default 0 = semua label ditolak
sysctl -w net.mpls.conf.eth1.input=1        # terima paket berlabel di interface core
sysctl -w net.ipv4.ip_forward=1
```

> [!WARNING]
> **`platform_labels` default-nya 0.** Ini jebakan paling umum di Linux: modul sudah dimuat, LDP sudah `OPERATIONAL`, `show mpls table` di FRR terisi, tetapi kernel menolak memasang label karena tabelnya berukuran nol. Periksa dengan `ip -f mpls route`: jika kosong padahal FRR menampilkan label, curigai sysctl ini.

Konfigurasi FRR (`/etc/frr/frr.conf`, aktifkan `isisd=yes` dan `ldpd=yes` di `/etc/frr/daemons`):

```
interface lo
 ip address 10.255.0.1/32
 ip router isis CORE
 isis passive
!
interface eth1
 ip address 10.0.12.1/30
 ip router isis CORE
 isis network point-to-point
!
router isis CORE
 is-type level-2-only
 net 49.0001.0102.5500.0001.00
 metric-style wide
 mpls ldp-sync
!
mpls ldp
 router-id 10.255.0.1
 address-family ipv4
  discovery transport-address 10.255.0.1
  interface eth1
 exit-address-family
```

Verifikasi:

```
pe1# show mpls ldp neighbor
pe1# show mpls ldp discovery
pe1# show mpls ldp binding
pe1# show mpls table
pe1# show isis mpls ldp-sync
pe1# show ip route 10.255.0.3/32
$ ip -f mpls route            # LFIB di kernel
$ ip route get 10.255.0.3     # FIB: lihat "encap mpls"
```

FRR tidak menyediakan LSP ping (RFC 8029). Untuk diagnosis dataplane di Linux, kombinasikan `show mpls table`, `ip -f mpls route`, dan `tcpdump -nn -i eth1 mpls`.

---

## 12. Lab: Backbone MPLS dengan LDP (Containerlab + FRR)

Lab ini dipakai bersama oleh modul 22.1 dan 22.2. Di modul ini Anda fokus pada backbone (pe1, p1, pe2). Pelanggan di sisi kiri dan kanan baru dibahas tuntas di 22.2, tetapi Anda sudah bisa memakainya untuk melihat label bekerja.

### Topologi

```
  ce1a (AS65001) ─eth2─┐                                   ┌─eth2─ ce2a (AS65001)
  192.168.1.0/24       │                                   │       192.168.2.0/24
                      pe1 ══eth1══ p1 ══eth2══ pe2
  ce1b (static)  ─eth3─┘ 10.255.0.1   10.255.0.2   10.255.0.3 └─eth3─ ce2b (static)
  192.168.1.0/24                                                   192.168.2.0/24

  Link core : pe1-p1 10.0.12.0/30, p1-pe2 10.0.23.0/30
  IGP       : IS-IS L2 (dengan mpls ldp-sync), LDP di eth1/eth2 core
```

### File lab

Semua file ada di `materi/lab/kode/mpls-l3vpn/`:

| File | Isi |
|---|---|
| `mpls-l3vpn.clab.yml` | Topologi containerlab (7 node FRR 10.4.1) |
| `configs/mulai.sh` | Entrypoint: menunggu interface, menyetel sysctl MPLS, membuat VRF, lalu menjalankan FRR |
| `configs/daemons` | Mengaktifkan bgpd, isisd, ldpd |
| `configs/<node>/frr.conf` | Konfigurasi tiap router |
| `uji.sh` | Delapan pemeriksaan otomatis |

### Prasyarat

- Linux (atau WSL2 dengan kernel yang punya modul MPLS) dengan Docker dan [containerlab](https://containerlab.dev).
- Modul kernel MPLS dimuat di **host**: container berbagi kernel dengan host, jadi container tidak bisa memuatnya sendiri.

```bash
sudo modprobe mpls_router mpls_iptunnel
ls /proc/sys/net/mpls/          # harus ada: conf, platform_labels, ...
```

### Langkah

```bash
cd materi/lab/kode/mpls-l3vpn
sudo containerlab deploy -t mpls-l3vpn.clab.yml
# tunggu sekitar satu menit agar IS-IS, LDP, dan BGP konvergen
./uji.sh
```

Hasil yang diharapkan:

```
LULUS  p1 punya 2 tetangga LDP OPERATIONAL
LULUS  pe1 punya label LDP untuk loopback pe2 (10.255.0.3/32)
LULUS  sesi VPNv4 pe1 <-> pe2 Established (kolom PfxRcd berupa angka)
LULUS  VRF CUST-A di pe1 punya 192.168.2.0/24 berlabel
LULUS  VRF CUST-B di pe1 punya 192.168.2.0/24 berlabel
LULUS  p1 tidak punya rute pelanggan 192.168.0.0/16 (core bebas BGP)
LULUS  pelanggan A: ce1a 192.168.1.1 -> 192.168.2.1
LULUS  pelanggan B: ce1b 192.168.1.1 -> 192.168.2.1
```

### Latihan terpandu di lab

**A. Amati LDP.** Masuk ke p1 dengan `docker exec -it clab-mpls-l3vpn-p1 vtysh`.

```
p1# show isis neighbor
p1# show mpls ldp discovery
p1# show mpls ldp neighbor
p1# show mpls ldp binding
p1# show mpls table
```

Pertanyaan: untuk FEC `10.255.0.3/32`, berapa label lokal p1? Label dari siapa yang `In Use`? Mengapa ada binding dengan `In Use = no`?

**B. Lihat label di kabel.** Image FRR berbasis Alpine dan tidak membawa tcpdump. Pasang dulu (butuh akses internet dari container):

```bash
docker exec clab-mpls-l3vpn-p1 apk add tcpdump
docker exec clab-mpls-l3vpn-p1 tcpdump -nn -i eth1 mpls &
docker exec clab-mpls-l3vpn-ce1a ping -c 2 -I 192.168.1.1 192.168.2.1
```

Anda akan melihat dua label di eth1 (dari pe1) dan satu label di eth2 (ke pe2, setelah PHP).

**C. Explicit null.** Di pe2:

```
pe2# configure terminal
pe2(config)# mpls ldp
pe2(config-ldp)# address-family ipv4
pe2(config-ldp-af)# label local advertise explicit-null
```

Lihat `show mpls table` di p1: label keluar untuk `10.255.0.3/32` berubah dari `implicit-null` menjadi `IPv4 Explicit Null`. Tangkap paket di p1 eth2: kini ada label 0 di atas label VPN. Kembalikan dengan `no label local advertise explicit-null`.

**D. TTL propagation.** Jalankan `traceroute -n -s 192.168.1.1 192.168.2.1` dari ce1a. Lalu di pe1 dan pe2 jalankan `sysctl -w net.mpls.ip_ttl_propagate=0` (dari shell container, bukan vtysh) dan ulangi traceroute. Hitung hop yang hilang.

**E. Putuskan LSP, amati LDP-IGP sync.** Di p1:

```
p1(config)# mpls ldp
p1(config-ldp)# address-family ipv4
p1(config-ldp-af)# no interface eth2
```

Lalu amati dari tiga sudut:

```
p1# show isis mpls ldp-sync                  ← eth2: Sync not achieved
p1# show isis database detail pe2            ← link pe2→p1 bermetrik 16777214
pe1# show mpls ldp binding                   ← label dari p1 untuk 10.255.0.3/32 berubah
ce1a$ ping -c 2 -I 192.168.1.1 192.168.2.1   ← 100% loss
```

Hasil yang diamati di lab: p1 kehilangan label dari pe2, dan ldpd FRR lalu mengiklankan `imp-null` ke pe1 untuk FEC `10.255.0.3/32`. pe1 pun mengirim paket **hanya dengan label VPN 81** ke p1. p1 tidak punya entri untuk label 81 di LFIB-nya, jadi paket dibuang. Ini contoh nyata LSP putus yang menyebabkan blackhole layanan VPN walau IGP dan BGP sehat. Pulihkan dengan `interface eth2` di bawah `address-family ipv4`.

**F. (Tantangan) MTU.** Tambahkan `mtu: 1500` pada dua link core di file topologi, deploy ulang, lalu cari ukuran ping DF terbesar yang lolos dari ce1a ke ce2a. Jelaskan angka yang Anda dapat.

### Membongkar lab

```bash
sudo containerlab destroy -t mpls-l3vpn.clab.yml --cleanup
```

---

## 13. Troubleshooting

### Alur diagnosis berlapis

Masalah MPLS hampir selalu bisa dilokalisasi dengan memeriksa lapisan dari bawah ke atas. Jangan melompat ke BGP atau VPN sebelum lapisan di bawahnya terbukti sehat.

```
1. IGP      : loopback /32 semua PE ada di tabel routing setiap router?
              show ip route 10.255.0.3 / show isis neighbor / show isis database
2. Discovery: hello LDP terlihat di interface yang benar?
              show mpls ldp discovery
3. Sesi     : tetangga OPERATIONAL? transport address reachable? TCP 646 tidak diblokir?
              show mpls ldp neighbor
4. Binding  : ada label dari next hop IGP untuk FEC loopback PE?
              show mpls ldp bindings <loopback>/32
5. LFIB     : entri label terpasang dengan aksi yang benar (swap/pop)?
              show mpls forwarding-table / ip -f mpls route
6. Dataplane: paket benar-benar berlabel di kabel? LSP utuh ujung ke ujung?
              ping mpls / traceroute mpls / tcpdump mpls
```

### Gejala dan penyebab

| Gejala | Penyebab paling mungkin | Pemeriksaan |
|---|---|---|
| Tetangga tidak muncul di `discovery` | LDP tidak aktif di interface, ACL memblokir UDP 646, interface beda subnet | `show mpls interfaces`, ACL, capture UDP 646 |
| Muncul di `discovery`, tidak pernah `OPERATIONAL` | Transport address (loopback) tetangga tidak ada di tabel routing, TCP 646 diblokir, password MD5 tidak cocok | `ping <loopback-tetangga> source <loopback-sendiri>`, log LDP |
| Sesi naik-turun | MD5 salah, MTU kecil sehingga PDU LDP besar terpotong, keepalive habis karena CPU penuh | Log, `show mpls ldp neighbor detail` |
| Sesi `OPERATIONAL` tapi LFIB kosong untuk FEC | Label tidak diiklankan (Junos hanya loopback, filter advertisement), FEC beda panjang prefix (/24 vs /32) | `show mpls ldp bindings`, cek panjang prefix loopback di IGP |
| `No Label` / `Untagged` di LFIB | Next hop IGP bukan tetangga LDP (LDP mati di link itu) | Bandingkan next hop IGP dengan daftar tetangga LDP |
| VPN mati, ping antar-loopback **berhasil** | LSP putus: ping loopback lewat IP biasa, VPN butuh label. Lihat juga 22.2 | `ping mpls ipv4 <loopback>/32`, `traceroute mpls` |
| Paket kecil jalan, paket besar tidak | MTU core | Ping DF bertingkat |
| Junos: sesi LDP naik, trafik berlabel dibuang | `family mpls` belum ada di unit interface atau interface belum di `protocols mpls` | `show interfaces terse`, `show mpls interface` |
| Linux/FRR: FRR menampilkan label, kernel tidak | `platform_labels` = 0, modul `mpls_iptunnel` belum dimuat, `input` = 0 | `sysctl net.mpls`, `ip -f mpls route`, `ip route get` |

### Label mismatch

"Label mismatch" berarti router upstream memakai label yang tidak dikenal router downstream, atau keduanya punya pandangan berbeda tentang FEC. Penyebab umum:

- **Pandangan FEC berbeda.** Satu router punya rute `/32` ke loopback, router lain hanya `/24` hasil summarization. LDP hanya mengiklankan label untuk prefix yang persis ada di tabel routing. Hindari meringkas loopback PE di dalam domain MPLS (atau gunakan solusi khusus seperti LDP downstream on demand atau BGP labeled unicast untuk desain berhierarki).
- **Sesi baru pulih, label belum tersebar.** Ini masalah yang diselesaikan LDP-IGP sync.
- **Label statis bertabrakan dengan rentang dinamis.** Jika Anda membuat label statis, geser rentang dinamis agar tidak tumpang tindih.

Cara memeriksa: bandingkan **label keluar** di LFIB router upstream dengan **label lokal** di LIB router downstream untuk FEC yang sama. Keduanya harus sama persis.

```
Upstream (pe1)   : show mpls forwarding-table 10.255.0.3 32   → Outgoing label 17
Downstream (p1)  : show mpls ldp bindings 10.255.0.3 32       → local binding: label 17   ✅
```

### Traceroute MPLS dan LSP ping (RFC 8029)

`ping` dan `traceroute` IP biasa menguji jalur IP, bukan LSP. Paket ping ke loopback PE2 bisa saja diteruskan sebagai IP polos (misalnya karena `No Label`) dan tetap sampai, padahal trafik VPN yang **butuh** label dibuang. Untuk menguji LSP, gunakan **MPLS LSP ping/traceroute** (RFC 8029, menggantikan RFC 4379):

- Paket uji adalah UDP ke port **3503**, dibungkus label yang sama dengan trafik sungguhan untuk FEC tersebut.
- Alamat IP tujuannya diambil dari rentang **127.0.0.0/8**, dengan TTL IP 1. Jika LSP putus di tengah dan paket kehilangan label, router mana pun yang menerimanya sebagai IP **tidak akan meneruskannya**, karena 127/8 tidak boleh dirutekan. Dengan begitu, jawaban sukses hanya mungkin jika paket benar-benar tiba di egress lewat label.
- Egress memeriksa apakah ia memang egress untuk FEC yang ditanyakan, lalu menjawab dengan kode status.

```
! Cisco IOS XE / IOS XR
ping mpls ipv4 10.255.0.3/32
traceroute mpls ipv4 10.255.0.3/32

# Junos
ping mpls ldp 10.255.0.3/32
traceroute mpls ldp 10.255.0.3/32
```

Kode yang paling sering terlihat pada output Cisco:

| Kode | Arti |
|---|---|
| `!` | Sukses: egress membenarkan dirinya egress untuk FEC itu |
| `.` | Timeout: tidak ada jawaban |
| `Q` | Permintaan tidak terkirim (misalnya tidak ada label untuk FEC itu di router lokal) |
| `L` | (traceroute) Hop transit, interface keluar berlabel |
| `B` | (traceroute) Hop transit, interface keluar **tanpa label**: indikasi LSP putus di hop ini |
| `R` | Router transit menjawab, belum sampai egress |

Contoh bentuk output traceroute MPLS (ilustrasi, format disederhanakan):

```
PE1# traceroute mpls ipv4 10.255.0.3/32
  0 10.0.12.1 MRU 1500 [Labels: 17 Exp: 0]
L 1 10.0.12.2 MRU 1500 [Labels: implicit-null Exp: 0] 1 ms
! 2 10.0.23.2 2 ms
```

Baris hop 1 menunjukkan p1 menerima label 17 dan meneruskan dengan implicit-null (PHP). Hop 2 adalah egress yang menjawab sukses.

> [!WARNING]
> Di IOS XR, LSP ping hanya dijawab jika `mpls oam` sudah dikonfigurasi. Router yang tidak menjawab LSP ping belum tentu rusak; bisa jadi OAM-nya belum diaktifkan.

### Traceroute biasa di jaringan MPLS

Traceroute IP tetap berguna jika Anda memahami keterbatasannya (§7):

- Hop P bisa tampil sebagai `*` karena ICMP-nya dikirim ke depan lalu hilang, atau karena platform tidak membuat ICMP untuk paket berlabel (seperti Linux).
- Dengan `no-propagate-ttl`, seluruh core hilang dan PE seberang tampak bertetangga langsung.
- Sumber traceroute penting. Dokumentasi MikroTik memberi contoh bagaimana alamat sumber yang dipilih otomatis bisa membuat satu hop tidak menjawab karena interaksi dengan PHP. Gunakan sumber loopback (`src-address` atau `source Loopback0`).

---

## 14. Kesalahan Umum

| Kesalahan | Akibat | Pencegahan |
|---|---|---|
| LDP router-id memakai alamat interface fisik | Sesi putus saat interface itu down, LDP ID berubah setelah reboot | `mpls ldp router-id Loopback0 force` / `router-id` eksplisit |
| Loopback PE diiklankan /24 atau diringkas | FEC tidak cocok dengan BGP next hop, layanan VPN mati | Loopback selalu /32, jangan diringkas dalam domain MPLS |
| LDP-IGP sync hanya di satu sisi | Blackhole tetap terjadi di arah sebaliknya | Aktifkan di kedua sisi semua link core |
| MTU core 1500 | Paket besar pelanggan dibuang | Jumbo di seluruh core, uji ping DF 1500 |
| Menganggap traceroute IP `*` berarti router mati | Salah diagnosis | Gunakan LSP ping/traceroute |
| Mengaktifkan LDP di interface pelanggan | Pelanggan bisa membentuk sesi LDP dan menyuntik label | LDP hanya di interface core, gunakan filter/ACL di edge |
| Junos tanpa `family mpls` | Sesi naik, paket berlabel dibuang | Checklist tiga langkah Junos |
| Linux tanpa modul atau `platform_labels` | Kontrol plane sehat, dataplane kosong | `modprobe`, sysctl, periksa `ip -f mpls route` |

---

## 15. Konteks Indonesia

- **Backbone operator.** Operator telekomunikasi dan penyedia jaringan tertutup berskala nasional di Indonesia umumnya menjalankan backbone berbasis MPLS untuk melayani pelanggan korporat, backhaul seluler, dan layanan internet. Lowongan "IP/MPLS engineer", "core network engineer", atau "NOC backbone" biasanya mensyaratkan pemahaman LDP, IS-IS/OSPF, BGP, dan L3VPN, sering bersama sertifikasi Cisco, Juniper, atau Huawei. Huawei VRP juga banyak dipakai operator di Indonesia. Konsepnya sama, hanya sintaksnya berbeda (misalnya `mpls lsr-id`, `mpls ldp` di tingkat interface).
- **ISP regional dan RT/RW net yang tumbuh.** Banyak ISP regional memulai dengan routing IP biasa di atas MikroTik, lalu beralih ke MPLS ketika butuh VPLS untuk menyambung beberapa POP dalam satu domain layer 2 atau menjual VPN ke pelanggan bisnis. Di sinilah keterbatasan RouterOS (§11) perlu dipertimbangkan sejak awal desain.
- **Geografi kepulauan.** Link antarpulau (kabel laut, microwave, satelit) sering punya MTU dan karakteristik berbeda dari link darat. Pastikan MTU end-to-end diuji pada setiap jenis media, terutama bila sebagian jalur memakai perangkat transmisi milik pihak lain.

---

## 16. Ringkasan

- MPLS meneruskan paket berdasarkan **label 20 bit** yang hanya bermakna lokal antar-tetangga. Alasan memakainya sekarang adalah **BGP-free core, VPN, dan traffic engineering**, bukan kecepatan lookup.
- Header label 32 bit: **Label (20) + TC (3) + S (1) + TTL (8)**. EtherType **0x8847**. Label 0 sampai 15 dicadangkan: **0/2 explicit null, 3 implicit null**.
- **CE** tidak tahu MPLS, **PE** melakukan push/pop dan tahu pelanggan, **P** hanya swap dan tidak tahu pelanggan.
- **FEC** = kelompok paket dengan perlakuan sama (di LDP: prefix, terutama loopback /32 PE). **LSP** bersifat satu arah dan, dengan LDP, mengikuti IGP.
- **LIB** menyimpan semua label dari semua tetangga, **LFIB** hanya yang dari next hop IGP.
- **PHP**: egress mengiklankan **label 3**, penultimate hop melakukan pop. **Explicit null** (label 0) dipakai bila TC harus sampai ke egress.
- **TTL**: model uniform memperlihatkan core di traceroute, pipe/short pipe menyembunyikannya. ICMP dari router P dikirim **ke depan** sepanjang LSP.
- **LDP**: hello UDP 646 ke 224.0.0.2, sesi TCP 646, router dengan transport address lebih besar menjadi active. Mode default kebanyakan vendor: **DU + liberal retention**, control **independent** (Cisco) atau **ordered** (Junos).
- **LDP-IGP sync** (RFC 5443) mengiklankan metrik maksimum sampai LDP siap. **Session protection** menjaga sesi lewat targeted hello saat link putus.
- Setiap label = **4 byte**. L3VPN butuh minimal 8 byte ekstra: pakai **MTU jumbo** di core.
- Diagnosis berlapis: **IGP → discovery → sesi → binding → LFIB → dataplane**. Gunakan **LSP ping/traceroute** (RFC 8029), bukan hanya ping IP.
- Di Linux/FRR: modul **mpls_router + mpls_iptunnel**, sysctl **platform_labels** dan **conf.IF.input**.

---

## 17. Latihan

1. Tangkapan paket menunjukkan entri label `00 03 E8 FE` diikuti entri `00 05 11 3F`. Uraikan field kedua entri itu (label, TC, S, TTL), dan jelaskan peran masing-masing label dalam paket.
2. Di sebuah router P, `show mpls ldp bindings 10.255.0.9 32` menampilkan label lokal 24 dan tiga label remote: 30 dari P2, 41 dari P3, dan `imp-null` dari PE9. IGP memilih PE9 sebagai next hop. Apa isi entri LFIB untuk label masuk 24? Apa gunanya dua label lain disimpan?
3. Seorang engineer QoS mengeluh: kelas trafik suara yang ditandai di TC oleh PE ingress tidak terbaca di PE egress, sehingga antrean di sisi keluar PE egress salah. Jelaskan penyebabnya dan perubahan konfigurasi LDP yang menyelesaikannya.
4. Pelanggan menjalankan traceroute dan melihat empat alamat 10.x milik operator di tengah jalur. Tim keamanan meminta core disembunyikan, tetapi tim NOC tetap ingin bisa melakukan traceroute dari router operator dan melihat setiap hop. Tulis konfigurasi Cisco IOS XE yang memenuhi keduanya dan jelaskan alasannya.
5. `show mpls ldp discovery` di PE3 menampilkan hello dari P5 di Gi0/1, tetapi `show mpls ldp neighbor` tidak pernah menampilkan P5. Sebutkan tiga penyebab yang mungkin, berurutan dari yang paling umum, beserta perintah pemeriksaannya.
6. Setelah pemeliharaan, link P1-P2 kembali naik. Selama sekitar 20 detik, sebagian pelanggan VPN mengalami putus, padahal ada jalur cadangan lewat P3. Jelaskan mekanisme masalahnya dan fitur yang mencegahnya. Mengapa fitur itu harus aktif di kedua sisi link?
7. Anda menyambungkan router Cisco IOS XE dan Juniper MX dengan LDP. Sesi naik, tetapi router Cisco tidak menerima label untuk subnet link 10.0.0.0/30 yang terhubung ke Juniper, hanya untuk loopback Juniper. Apakah ini masalah? Jelaskan perilaku default kedua vendor.
8. Pelanggan L3VPN baru melaporkan: ping berjalan, SSH berjalan, tetapi unggah file ke server di kantor pusat selalu macet di tengah. Link core operator memakai MTU 1500. Hitung ukuran paket yang bermasalah, jelaskan kenapa gejalanya seperti itu, dan beri dua solusi (satu di sisi operator, satu sementara di sisi pelanggan).
9. Di lab FRR, LDP sudah `OPERATIONAL` dan `show mpls table` di pe1 berisi label, tetapi `ip -f mpls route` kosong dan paket keluar pe1 tanpa label. Apa yang Anda periksa dan bagaimana memperbaikinya?
10. `ping 10.255.0.3 source Loopback0` dari PE1 berhasil, tetapi layanan VPN ke PE2 mati, dan `traceroute mpls ipv4 10.255.0.3/32` menampilkan kode `B` di hop 2. Apa artinya, dan langkah apa yang Anda ambil di router hop 2?

<details>
<summary>Jawaban</summary>

1. Gunakan rumus nilai 32 bit = `label × 4096 + TC × 512 + S × 256 + TTL`.
   Entri pertama `0x0003E8FE` = 256.254. Dibagi 4096: **label 62**, sisa `0x8FE` = `1000 1111 1110` → TC = `100` = **4**, S = **0**, TTL = `1111 1110` = **254**.
   Entri kedua `0x0005113F` = 332.095 → **label 81**, TC **0**, S = **1**, TTL **63**.
   Label 62 (S = 0, paling atas) adalah **label transport** yang membawa paket ke PE egress. TC 4 adalah kelas QoS yang dipasang operator. TTL 254 mengisyaratkan model pipe/no-propagate: ingress mengisi 255, lalu satu hop sudah menguranginya. Label 81 (S = 1, paling bawah) adalah **label layanan**, misalnya label VPN, yang hanya dibaca PE egress untuk menentukan VRF tujuan. Hanya label paling bawah yang boleh ber-S 1.

2. Entri LFIB: **label masuk 24 → pop (implicit-null), keluar ke PE9**, karena PE9 adalah next hop IGP dan mengiklankan implicit null (PE9 egress untuk loopback-nya, router ini penultimate hop). Label 30 (P2) dan 41 (P3) disimpan karena **liberal label retention**. Jika IGP berpindah next hop, misalnya link ke PE9 putus dan jalur baru lewat P3, router langsung memasang label 41 ke LFIB tanpa harus meminta atau menunggu label baru. Konvergensi menjadi lebih cepat.

3. Penyebabnya **PHP**. Penultimate hop membuang label transport, dan nilai TC yang ada di label itu ikut hilang sebelum paket mencapai PE egress. Jika paket hanya punya satu label, PE egress menerima IP polos dan memakai DSCP pelanggan, bukan kelas operator. Solusi: PE egress mengiklankan **explicit null** sehingga penultimate hop melakukan swap ke label 0, dan TC tetap terbawa sampai egress. Cisco IOS XE: `mpls ldp explicit-null`. Junos: `set protocols ldp explicit-null`. IOS XR: `label local advertise explicit-null` di address-family LDP. (Pada L3VPN, label VPN masih membawa TC jika ingress menyalinnya ke semua label. Tetapi untuk trafik berlabel tunggal, explicit null adalah jawabannya.)

4. Konfigurasi di semua PE:
   ```
   no mpls ip propagate-ttl forwarded
   ```
   Varian `forwarded` hanya mematikan propagasi TTL untuk paket yang **diteruskan** (trafik pelanggan): saat push, TTL label diisi 255, sehingga hop core tidak pernah membuat Time Exceeded untuk traceroute pelanggan dan core tampak sebagai satu hop. Paket yang **dibangkitkan router itu sendiri** (traceroute dari CLI NOC) tetap memakai propagasi, sehingga NOC masih melihat setiap hop. Konfigurasi harus seragam di semua PE agar perilakunya konsisten di kedua arah.

5. Urutan penyebab dan pemeriksaan: (a) **Transport address P5 (biasanya loopback) tidak ada di tabel routing PE3**: `show ip route <loopback-P5>`, dan cek IGP. Hello datang lewat multicast di link, jadi discovery berhasil, tetapi TCP ke loopback gagal. (b) **TCP 646 diblokir** ACL, CoPP, atau firewall di jalur: `ping <loopback-P5> source Loopback0`, `telnet <loopback-P5> 646`, cek ACL/CoPP. (c) **Autentikasi MD5 tidak cocok** (atau hanya dikonfigurasi di satu sisi): lihat log (`%TCP-6-BADAUTH` di Cisco), `show mpls ldp neighbor password`. Penyebab lain yang lebih jarang: LDP router-id P5 tidak bisa dicapai karena `force` belum dipakai, atau parameter Initialization tidak cocok.

6. Saat link pulih, IGP membentuk adjacency dan memilih link P1-P2 dalam beberapa detik, **sebelum** sesi LDP di link itu selesai bertukar label. Selama jeda itu P1 meneruskan trafik ke P2 tanpa label transport yang sah (`No Label`), sehingga trafik VPN dibuang. Fitur pencegahnya **LDP-IGP synchronization** (RFC 5443): IGP mengiklankan link dengan **metrik maksimum** sampai LDP sinkron, sehingga trafik tetap lewat P3 selama itu. Harus di kedua sisi karena metrik IGP diiklankan **per arah**. P1 mengatur metrik arah P1→P2 dan P2 mengatur arah P2→P1. Jika hanya satu sisi, salah satu arah tetap terkena blackhole. Tambahan yang membantu: **session protection** agar label tidak hilang saat link berkedip.

7. **Ini perilaku normal, bukan kesalahan.** Junos secara default hanya mengiklankan label LDP untuk **loopback (router-id) miliknya sendiri**, sedangkan Cisco mengiklankan label untuk **semua** prefix IGP. Untuk layanan MPLS (VPN, pseudowire), yang dibutuhkan hanya label untuk loopback PE, jadi tidak ada masalah fungsional. Jika memang perlu label untuk prefix lain, tambahkan `egress-policy` di Junos. Perbedaan lain yang perlu diingat: Junos memakai **ordered control**, Cisco **independent control**. Keduanya interoperabel.

8. Paket IP pelanggan 1500 byte ditambah dua label L3VPN (8 byte) menjadi **1508 byte**, melebihi MTU 1500 di core. Ping (kecil) dan SSH interaktif (paket kecil) lolos. Unggah file memakai segmen TCP penuh (paket 1500 byte) yang dibuang atau memicu ICMP Fragmentation Needed yang bisa tidak sampai (ICMP dari router P dikirim ke depan sepanjang LSP, dan sering juga difilter). Akibatnya sesi TCP menggantung setelah fase handshake dan data kecil. Solusi operator: **naikkan MTU core** (jumbo, misalnya 9000+, atau minimal 1508/1512) di semua perangkat jalur. Solusi sementara pelanggan atau di PE: **TCP MSS clamping** (misalnya `ip tcp adjust-mss 1452` di interface CE/PE) atau turunkan MTU interface CE ke 1492.

9. Periksa dataplane kernel, bukan FRR: (a) `lsmod | grep mpls` di host: **`mpls_router` dan `mpls_iptunnel`** harus termuat; tanpa `mpls_iptunnel`, kernel tidak bisa melakukan push di ingress. Muat dengan `sudo modprobe mpls_router mpls_iptunnel`. (b) `sysctl net.mpls.platform_labels` di container: jika **0**, kernel menolak semua label; set `net.mpls.platform_labels=100000`. (c) `sysctl net.mpls.conf.eth1.input`: harus **1** di interface core agar paket berlabel yang masuk diterima. Setelah diperbaiki, mungkin perlu restart FRR agar zebra memasang ulang rute. Verifikasi dengan `ip -f mpls route` dan `ip route get 10.255.0.3` (harus ada `encap mpls`).

10. `ping` IP biasa ke loopback hanya membuktikan jalur **IP**. Kode **`B`** di hop 2 berarti router hop 2 meneruskan paket uji ke interface keluar **tanpa label** (unlabeled): LSP untuk FEC `10.255.0.3/32` terputus di sana. Trafik VPN yang bergantung pada label transport kehilangan labelnya dan dibuang (atau salah diteruskan sebagai IP dengan alamat pelanggan). Di router hop 2: periksa `show mpls ldp neighbor` (apakah tetangga downstream berstatus OPERATIONAL?), `show mpls ldp bindings 10.255.0.3 32` (adakah label dari next hop IGP?), dan `show mpls forwarding-table 10.255.0.3 32` (apakah `No Label`?). Penyebab tipikal: LDP tidak aktif di interface menuju next hop, sesi LDP ke next hop putus, atau next hop (misalnya Junos) tidak mengiklankan label untuk FEC itu. Pastikan juga LDP-IGP sync aktif agar IGP tidak memakai link tanpa label.

</details>

---

## 18. Sumber

- RFC 3031, Multiprotocol Label Switching Architecture: https://www.rfc-editor.org/rfc/rfc3031
- RFC 3032, MPLS Label Stack Encoding: https://www.rfc-editor.org/rfc/rfc3032
- RFC 3443, Time To Live (TTL) Processing in MPLS Networks: https://www.rfc-editor.org/rfc/rfc3443
- RFC 4950, ICMP Extensions for MPLS: https://www.rfc-editor.org/rfc/rfc4950
- RFC 5036, LDP Specification: https://www.rfc-editor.org/rfc/rfc5036
- RFC 5443, LDP IGP Synchronization: https://www.rfc-editor.org/rfc/rfc5443
- RFC 5462, MPLS Label Stack Entry: "EXP" Field Renamed to "Traffic Class" Field: https://www.rfc-editor.org/rfc/rfc5462
- RFC 7274, Allocating and Retiring Special-Purpose MPLS Labels: https://www.rfc-editor.org/rfc/rfc7274
- RFC 8029, Detecting MPLS Data-Plane Failures (LSP ping): https://www.rfc-editor.org/rfc/rfc8029
- Peterson dan Davie, Computer Networks: A Systems Approach, bagian 4.4 Multiprotocol Label Switching (CC BY 4.0): https://book.systemsapproach.org/scaling/mpls.html
- Dokumentasi FRRouting, LDP: https://docs.frrouting.org/en/latest/ldpd.html
- Dokumentasi FRRouting, instalasi (modul kernel dan sysctl MPLS): https://docs.frrouting.org/en/latest/installation.html
- Dokumentasi FRRouting, IS-IS: https://docs.frrouting.org/en/latest/isisd.html
- Manual MikroTik RouterOS, MPLS: https://manual.mikrotik.com/docs/user-guides/routing-and-networking-protocols/mpls/
- Manual MikroTik RouterOS, LDP: https://manual.mikrotik.com/docs/user-guides/routing-and-networking-protocols/mpls/ldp
- Cisco, MPLS Label Distribution Protocol Configuration Guide (IOS XE, termasuk Session Protection dan LDP-IGP Synchronization): https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/mp_ldp/configuration/xe-16/mp-ldp-xe-16-book.html
- Juniper, LDP User Guide: https://www.juniper.net/documentation/us/en/software/junos/mpls/topics/topic-map/ldp-overview.html
- Containerlab: https://containerlab.dev

---

**Berikutnya:** `22-service-provider/02-mpls-l3vpn`. VRF, RD, RT, dan MP-BGP: bagaimana ribuan pelanggan dengan alamat yang sama berbagi satu backbone MPLS.

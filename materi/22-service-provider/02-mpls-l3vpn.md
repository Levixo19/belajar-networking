# 22.2 MPLS L3VPN

> **Prasyarat:** `22-service-provider/01-mpls-ldp`, `07-routing-lanjutan/06-bgp`, `07-routing-lanjutan/07-redistribusi-policy` (§9 VRF-Lite), `07-routing-lanjutan/04-ospf`
> **Tujuan:** Anda bisa menjelaskan arsitektur BGP/MPLS IP VPN (RFC 4364) sampai ke format RD, RT, dan NLRI VPNv4, membedakan RD dan RT tanpa ragu, mengonfigurasi VRF, MP-BGP VPNv4, dan routing PE-CE (static, eBGP, OSPF) di Cisco, Juniper, MikroTik, dan FRR, merancang topologi full mesh, hub-and-spoke, dan extranet dengan route target, memahami route reflector dan opsi inter-AS, serta mendiagnosis layanan VPN yang putus secara sistematis.

---

## 1. Masalah yang Dipecahkan

Sebuah operator punya dua pelanggan korporat. Keduanya punya kantor pusat di Jakarta dan cabang di Surabaya. Keduanya, seperti kebanyakan perusahaan, memakai alamat privat yang sama:

```
Pelanggan A (bank):        Jakarta 192.168.1.0/24   Surabaya 192.168.2.0/24
Pelanggan B (ritel):       Jakarta 192.168.1.0/24   Surabaya 192.168.2.0/24
```

Operator harus:

1. **Memisahkan** keduanya total. Kantor bank tidak boleh bisa menjangkau kantor ritel, walau alamatnya sama persis.
2. **Merutekan** di antara situs-situs milik pelanggan yang sama, tanpa pelanggan harus mengelola tunnel.
3. Melakukannya untuk **ribuan** pelanggan di atas satu backbone, tanpa membuat router core menyimpan rute semua pelanggan.

### Dua model VPN

| | **Overlay model** | **Peer model** |
|---|---|---|
| Contoh | Frame Relay, ATM, tunnel GRE/IPsec antar-CE | **MPLS L3VPN** (BGP/MPLS IP VPN) |
| Siapa yang merutekan antar-situs | Pelanggan (CE ke CE) | **Operator** (PE bertukar rute dengan CE) |
| Jumlah tunnel/sirkuit untuk N situs full mesh | N(N-1)/2 | **Tidak ada**. Setiap situs cukup satu sambungan ke PE |
| Menambah situs baru | Ubah konfigurasi di semua situs lain | Cukup konfigurasi PE baru |
| Operator tahu rute pelanggan? | Tidak | **Ya** (di VRF, terpisah per pelanggan) |

MPLS L3VPN adalah peer model yang tetap menjaga privasi rute: operator memang tahu rute pelanggan, tetapi setiap pelanggan berada di tabel terpisah dan tidak bisa saling melihat.

### Dari VRF-Lite ke L3VPN

Modul 07.7 §9 sudah memperkenalkan **VRF-Lite**: beberapa tabel routing terpisah di satu router. VRF-Lite cukup untuk satu router atau beberapa router yang disambung dengan subinterface per VRF. Masalahnya, setiap VRF butuh link (atau VLAN) dan sesi routing sendiri di **setiap hop**. Untuk 500 pelanggan di 40 router, itu 500 × jumlah link sesi routing. Tidak terkelola.

MPLS L3VPN mempertahankan VRF di **tepi** (PE), lalu menghapus kebutuhan VRF di tengah dengan dua trik:

- **MP-BGP** membawa rute semua VRF antar-PE dalam satu sesi BGP, dengan penanda agar rute yang alamatnya sama tidak tertukar.
- **Label MPLS** membawa paket melewati core tanpa core perlu tahu VRF mana. Router P hanya melihat label transport (22.1).

---

## 2. Komponen Arsitektur

```
             VRF CUST-A                                      VRF CUST-A
  ce1a ───── [pe1] ══════════ p1 ══════════ [pe2] ───── ce2a
  ce1b ───── [pe1]   label transport (LDP)  [pe2] ───── ce2b
             VRF CUST-B                                      VRF CUST-B
               │                                               │
               └────────── MP-BGP VPNv4 (iBGP, loopback) ──────┘
                           rute + RD + RT + label VPN
```

| Komponen | Peran | Di mana |
|---|---|---|
| **VRF** | Tabel routing dan forwarding terpisah per pelanggan | PE |
| **RD** (Route Distinguisher) | Membuat prefix pelanggan unik di dalam BGP | Ditempel pada rute saat ekspor dari VRF ke VPNv4 |
| **RT** (Route Target) | Menentukan VRF mana yang boleh mengimpor rute | Extended community pada rute VPNv4 |
| **MP-BGP VPNv4/VPNv6** | Membawa rute VPN + label antar-PE | Sesi iBGP antar-loopback PE (atau lewat route reflector) |
| **Label VPN** (label dalam) | Memberi tahu PE egress VRF/next hop mana tujuan paket | Dialokasikan PE egress, diiklankan lewat MP-BGP |
| **Label transport** (label luar) | Membawa paket ke PE egress | LDP, RSVP-TE, atau Segment Routing (22.1, 22.3) |
| **Protokol PE-CE** | Pertukaran rute antara pelanggan dan operator | Static, eBGP, OSPF, (juga RIP, EIGRP, IS-IS) |

Pembagian kerja ini bisa dirangkum dalam satu kalimat: **BGP membawa "apa" (rute pelanggan dan label VPN), LDP membawa "bagaimana sampai ke sana" (label transport ke loopback PE).** Router P hanya ikut bagian kedua.

---

## 3. VRF di PE

**VRF** (*Virtual Routing and Forwarding*) adalah kombinasi dari:

- Tabel routing (RIB) sendiri.
- Tabel forwarding (FIB/CEF) sendiri.
- Daftar interface yang terikat ke VRF itu (interface ke CE pelanggan).
- Aturan impor dan ekspor ke MP-BGP (RD dan RT).
- Instance protokol routing PE-CE yang berjalan di konteks VRF.

Satu interface hanya bisa terikat ke satu VRF. Paket yang masuk dari interface itu dicari di tabel VRF tersebut, bukan di tabel global. Itulah yang memungkinkan dua interface di PE yang sama memakai alamat yang sama persis, seperti di lab:

```
pe1# show ip route vrf CUST-A
C>* 172.16.1.0/30 is directly connected, eth2
B>* 192.168.1.0/24 [20/0] via 172.16.1.2, eth2
B>  192.168.2.0/24 [200/0] via 10.255.0.3 (vrf default) (recursive), label 81
  *                          via 10.0.12.2, eth1 (vrf default), label 17/81

pe1# show ip route vrf CUST-B
C>* 172.16.1.0/30 is directly connected, eth3
S>* 192.168.1.0/24 [1/0] via 172.16.1.2, eth3
B>  192.168.2.0/24 [200/0] via 10.255.0.3 (vrf default) (recursive), label 80
  *                          via 10.0.12.2, eth1 (vrf default), label 17/80
```

Perhatikan:

- `172.16.1.0/30` muncul di **dua** VRF dengan interface berbeda (eth2 dan eth3). Tidak ada konflik.
- Rute ke kantor seberang (`192.168.2.0/24`) punya next hop `10.255.0.3` (loopback pe2) **di VRF default**. Rute VPN di-resolve lewat tabel global, lalu diberi dua label: **17** (transport ke pe2, dari LDP) dan **80/81** (label VPN dari pe2, dari BGP).
- Label VPN untuk A (81) dan B (80) berbeda. Dari label itulah pe2 tahu paket harus diserahkan ke VRF mana.

### VRF di Linux

FRR memakai VRF milik kernel Linux: sebuah perangkat jaringan bertipe `vrf` yang terikat ke tabel routing bernomor. Interface dijadikan "budak" (*enslaved*) perangkat VRF.

```bash
ip link add CUST-A type vrf table 10
ip link set CUST-A up
ip link set eth2 master CUST-A
ip route show vrf CUST-A          # tabel 10
ip vrf exec CUST-A ping 172.16.1.2
```

Label VPN di Linux dipasang sebagai rute MPLS yang menunjuk ke perangkat VRF. Artinya: "pop label ini, lalu cari alamat tujuan di tabel VRF tersebut":

```
pe1$ ip -f mpls route
16 via inet 10.0.12.2 dev eth1 proto 193
17 via inet 10.0.12.2 dev eth1 proto 193
18 as to 17 via inet 10.0.12.2 dev eth1 proto 193
80 dev CUST-B proto bgp
81 dev CUST-A proto bgp

pe1$ ip route show vrf CUST-A
192.168.2.0/24 nhid 32 encap mpls 17/81 via 10.0.12.2 dev eth1 proto bgp metric 20
```

---

## 4. RD dan RT: Dua Konsep yang Paling Sering Tertukar

Kalau Anda hanya mengingat satu hal dari modul ini, ingatlah tabel berikut.

| | **RD** (Route Distinguisher) | **RT** (Route Target) |
|---|---|---|
| Pertanyaan yang dijawab | "Bagaimana dua prefix yang sama tidak bertabrakan di BGP?" | "VRF mana yang boleh menerima rute ini?" |
| Bentuk | Bagian dari **alamat** (prefix VPNv4) | **Atribut** (extended community) |
| Jumlah per rute | **Tepat satu** | **Satu atau lebih** |
| Dipakai untuk keputusan impor? | **Tidak pernah** | **Ya**, satu-satunya dasar impor |
| Analogi | Nomor kode area telepon yang membuat nomor lokal unik | Label "kirim ke departemen X dan Y" di amplop |

### RD: membuat prefix unik

Bayangkan pe1 mengirim dua rute `192.168.1.0/24` (milik A dan milik B) lewat satu sesi BGP. Tanpa penanda, BGP akan menganggapnya rute yang sama dan hanya memilih satu. RD mengatasi ini dengan menempelkan 8 byte di depan prefix, sehingga terbentuk **alamat VPN-IPv4 12 byte** (RFC 4364 §4.1):

```
VPN-IPv4 = RD (8 byte) + IPv4 (4 byte)

10.255.0.1:100:192.168.1.0/24    ← milik A
10.255.0.1:200:192.168.1.0/24    ← milik B     (dua prefix berbeda di mata BGP)
```

Format RD (RFC 4364 §4.2): 2 byte **type**, lalu 6 byte nilai yang dibagi dua sub-field.

```
Type 0:  │ 00 00 │ ASN 2 byte  │ nomor 4 byte │      contoh 65000:100
Type 1:  │ 00 01 │ IPv4 4 byte │ nomor 2 byte │      contoh 10.255.0.1:100
Type 2:  │ 00 02 │ ASN 4 byte  │ nomor 2 byte │      contoh 4200000000:100
```

RFC 4364 menegaskan bahwa RD **tidak membawa makna apa pun**. RD tidak menyatakan asal rute atau ke mana rute harus pergi. Ia hanya angka pembeda.

**Strategi pemberian RD:**

- **RD per VRF (sama di semua PE):** misalnya semua PE memakai `65000:100` untuk pelanggan A. Sederhana, tetapi bermasalah saat ada route reflector dan situs dual-homed (lihat §8).
- **RD per VRF per PE (disarankan):** formatnya `<loopback-PE>:<id-VRF>`, misalnya `10.255.0.1:100` di pe1 dan `10.255.0.3:100` di pe2. Rute yang sama dari dua PE menjadi dua prefix VPNv4 berbeda, sehingga route reflector meneruskan keduanya. Lab modul ini memakai strategi ini.

### RT: menentukan siapa menerima apa

RT adalah **BGP extended community** (RFC 4360), 8 byte, dengan subtype `0x02` (Route Target):

```
│ type │ subtype 0x02 │ nilai 6 byte              │
  0x00                 ASN 2 byte + nomor 4 byte    contoh RT:65000:100
  0x01                 IPv4 4 byte + nomor 2 byte   contoh RT:10.255.0.1:100
  0x02                 ASN 4 byte + nomor 2 byte    (RFC 5668)
```

Setiap VRF punya dua daftar RT:

- **Export RT:** ditempelkan pada setiap rute yang diekspor dari VRF ini ke VPNv4.
- **Import RT:** VRF ini mengimpor rute VPNv4 apa pun yang membawa **setidaknya satu** RT yang ada di daftar impornya.

```
pe1 VRF CUST-A  export RT:65000:100 ──► rute 10.255.0.1:100:192.168.1.0/24  [RT:65000:100]
                                                        │
                                                        ▼
pe2 VRF CUST-A  import RT:65000:100   ✅ cocok, rute masuk VRF CUST-A di pe2
pe2 VRF CUST-B  import RT:65000:200   ❌ tidak cocok, rute diabaikan VRF CUST-B
```

Karena impor hanya berdasarkan RT, Anda bisa membangun topologi apa pun: full mesh, hub-and-spoke, extranet, VPN manajemen. Semuanya hanya permainan daftar RT (§9).

> [!WARNING]
> **RD tidak pernah dipakai untuk memutuskan impor.** Kesalahan paling umum pemula adalah mengira "RD sama berarti satu VPN". Dua VRF dengan RD sama tetapi RT berbeda tidak akan saling bertukar rute. Dua VRF dengan RD berbeda tetapi RT cocok akan bertukar rute dengan normal.

> [!TIP]
> Kebiasaan yang baik: buat RD dan RT **terlihat berbeda** agar tidak tertukar saat membaca konfigurasi. Misalnya RD selalu `<loopback>:<id>` dan RT selalu `<ASN>:<id>`.

---

## 5. MP-BGP VPNv4 dan VPNv6

BGP-4 aslinya hanya membawa prefix IPv4 unicast. **Multiprotocol BGP** (RFC 4760) menambahkan atribut `MP_REACH_NLRI` dan `MP_UNREACH_NLRI` yang bisa membawa "keluarga alamat" lain, ditandai pasangan **AFI/SAFI**:

| Keluarga | AFI | SAFI | Nama di CLI |
|---|---|---|---|
| IPv4 unicast | 1 | 1 | `ipv4 unicast` |
| IPv4 berlabel (BGP-LU, RFC 8277) | 1 | 4 | `ipv4 labeled-unicast` |
| **VPN-IPv4** | 1 | **128** | `vpnv4` / `ipv4 vpn` / `inet-vpn` |
| **VPN-IPv6** (RFC 4659) | 2 | **128** | `vpnv6` / `ipv6 vpn` / `inet6-vpn` |
| Route Target Constraint (RFC 4684) | 1 | 132 | `rtfilter` / `route-target` |

Kemampuan ini dinegosiasikan di pesan OPEN (capability *Multiprotocol Extensions*). Jika satu sisi tidak mengaktifkan VPNv4, sesi tetap `Established` tetapi tidak ada rute VPN yang dipertukarkan.

### Isi satu rute VPNv4

Satu entri NLRI VPNv4 di dalam `MP_REACH_NLRI` berisi (RFC 4364 dan RFC 8277):

```
┌────────┬──────────────────┬──────────────┬─────────────────┐
│ Panjang│ Label (3 byte)   │ RD (8 byte)  │ Prefix IPv4     │
│ (bit)  │ 20 bit label +   │              │ (sepanjang mask)│
│        │ 3 bit + S bit    │              │                 │
└────────┴──────────────────┴──────────────┴─────────────────┘
Next hop  : alamat VPN-IPv4 dengan RD = 0, IPv4 = loopback PE pengirim
Atribut   : ORIGIN, AS_PATH, LOCAL_PREF, ... + EXTENDED COMMUNITIES (RT, SoO, ...)
```

Label VPN dibawa **di dalam NLRI**, bukan sebagai atribut terpisah. Setiap rute VPNv4 membawa labelnya sendiri.

Output nyata dari pe1 di lab:

```
pe1# show bgp ipv4 vpn
     Network          Next Hop            Metric LocPrf Weight Path
Route Distinguisher: 10.255.0.1:100
 *>  192.168.1.0/24   172.16.1.2@6<            0             0 65001 i
    UN=172.16.1.2 EC{65000:100} label=81 type=bgp, subtype=5
Route Distinguisher: 10.255.0.1:200
 *>  192.168.1.0/24   172.16.1.2@7<            0         32768 ?
    UN=172.16.1.2 EC{65000:200} label=80 type=bgp, subtype=5
Route Distinguisher: 10.255.0.3:100
 *>i 192.168.2.0/24   10.255.0.3               0    100      0 65001 i
    UN=10.255.0.3 EC{65000:100} label=81 type=bgp, subtype=0
Route Distinguisher: 10.255.0.3:200
 *>i 192.168.2.0/24   10.255.0.3               0    100      0 ?
    UN=10.255.0.3 EC{65000:200} label=80 type=bgp, subtype=0
```

Empat rute, dua di antaranya `192.168.1.0/24` dan dua `192.168.2.0/24`, semuanya unik karena RD-nya berbeda. Rute lokal (RD `10.255.0.1:*`) adalah hasil ekspor dari VRF pe1. Rute `*>i` datang dari pe2 lewat iBGP. Kolom `EC{...}` adalah RT, `label=` adalah label VPN.

### Aturan-aturan penting

**Sesi antar-loopback, iBGP.** PE membentuk iBGP antar-loopback, seperti iBGP biasa (07.6). Next hop rute VPNv4 adalah loopback PE pengirim. Loopback itu harus punya **LSP** (label transport dari LDP/SR), bukan sekadar rute IP.

**Extended community harus dikirim.** RT adalah extended community. Di Cisco IOS, saat neighbor diaktifkan di `address-family vpnv4`, perintah `send-community extended` ditambahkan otomatis. Jangan menghapusnya. Tanpa RT, PE penerima tidak akan mengimpor rute apa pun.

**Penyaringan otomatis berdasarkan RT.** PE secara default **membuang** rute VPNv4 yang tidak membawa RT yang diimpor oleh VRF lokal mana pun. Ini menghemat memori: PE di Medan yang tidak punya pelanggan X tidak perlu menyimpan rute pelanggan X. Route reflector adalah pengecualian (§8). Di FRR, perilaku ini diatur dengan `bgp retain route-target all` (default aktif menurut dokumentasi FRR).

**Route Target Constraint (RFC 4684).** Penyaringan di atas terjadi **setelah** rute dikirim. Pada jaringan besar, route reflector tetap mengirim semua rute ke semua PE, lalu PE membuangnya. RT Constraint membuat PE memberi tahu RR "saya hanya mengimpor RT ini", sehingga RR hanya mengirim yang relevan.

**VPNv6 dan 6VPE.** VPN IPv6 (RFC 4659) bekerja persis sama dengan AFI 2. Core boleh tetap IPv4-only dengan LDP IPv4: next hop VPNv6 dikodekan sebagai alamat IPv4-mapped IPv6 dari loopback PE. Desain ini disebut **6VPE**, dan menjadi cara populer operator menawarkan IPv6 ke pelanggan VPN tanpa mengubah core.

---

## 6. Label Stack Layanan

### Dua label, dua tugas

```
Paket dari ce1a ke 192.168.2.1, di link pe1 → p1:

┌──────────┬──────────────────────┬──────────────────────┬───────────────────────┐
│ Ethernet │ Label 17 (S=0)       │ Label 81 (S=1)       │ IP 192.168.1.1 →      │
│ 0x8847   │ TRANSPORT            │ VPN                  │    192.168.2.1        │
│          │ dari LDP (p1)        │ dari MP-BGP (pe2)    │                       │
│          │ "bawa ke pe2"        │ "di pe2: VRF CUST-A" │                       │
└──────────┴──────────────────────┴──────────────────────┴───────────────────────┘
```

| | Label transport (luar) | Label VPN (dalam) |
|---|---|---|
| Dialokasikan oleh | Router **downstream berikutnya** (berganti di setiap hop) | **PE egress** (tetap sepanjang jalur) |
| Disebar lewat | LDP / RSVP-TE / SR (IGP) | MP-BGP VPNv4/VPNv6 |
| Dibaca oleh | P dan penultimate hop | Hanya PE egress |
| Di-pop oleh | Penultimate hop (PHP) | PE egress |

Tangkapan nyata di p1 menunjukkan kedua label dan efek PHP, untuk kedua pelanggan:

```
p1 eth1 (masuk dari pe1), pelanggan A:
  MPLS (label 17, tc 0, ttl 63) (label 81, tc 0, [S], ttl 63) IP 192.168.1.1 > 192.168.2.1: ICMP echo request

p1 eth2 (keluar ke pe2), pelanggan B:
  MPLS (label 80, tc 0, [S], ttl 63) IP 192.168.1.1 > 192.168.2.1: ICMP echo request
```

Alamat IP di dalam kedua paket identik. Yang membedakan hanya label VPN (81 untuk A, 80 untuk B). p1 tidak pernah membaca label dalam maupun header IP.

### Mode alokasi label VPN

PE egress bisa mengalokasikan label VPN dengan beberapa cara:

| Mode | Satu label untuk | Jumlah label | Perilaku di PE egress |
|---|---|---|---|
| **Per-prefix** | Setiap prefix VPN | Paling banyak | Label langsung menunjuk next hop CE, tanpa lookup IP |
| **Per-CE** (per next hop) | Setiap CE/next hop | Sedang | Label menunjuk CE, tanpa lookup IP |
| **Per-VRF** | Seluruh VRF | Paling sedikit | Pop lalu **lookup IP di tabel VRF** |

Per-VRF menghemat ruang label (penting di PE dengan puluhan ribu prefix VPN), tetapi menambah satu lookup IP di egress dan tidak bisa dipakai untuk fitur yang butuh label per next hop. Default vendor berbeda-beda: Cisco umumnya per-prefix, Junos per next hop (berubah menjadi per tabel dengan `vrf-table-label`), dan FRR per-VRF (`label vpn export allocation-mode` untuk mengubahnya). Di lab, setiap VRF di pe1 punya tepat satu label (80 dan 81): itulah per-VRF.

```
! Cisco IOS XE: ubah satu VRF ke per-VRF
mpls label mode vrf CUST-A protocol bgp-vpnv4 per-vrf
! Cisco IOS XR (di bawah router bgp, vrf, address-family)
label mode per-vrf
# Junos
set routing-instances CUST-A vrf-table-label
# FRR (di router bgp vrf, address-family ipv4 unicast)
label vpn export allocation-mode per-nexthop
```

### Next hop VPN harus punya LSP

PE ingress hanya bisa memasang dua label jika ia punya **label transport ke next hop BGP** (loopback PE egress). Jika LSP ke loopback itu tidak ada:

- **Junos** menyembunyikan rute VPN (tampil di `show route hidden`), karena next hop tidak ada di `inet.3`.
- **FRR** tidak memasang rute VPN ke VRF jika jalur ke next hop tidak berlabel (dokumentasi FRR menyebut syarat ini secara eksplisit).
- **Cisco IOS** bisa memasang rute ke VRF, tetapi CEF menandainya tanpa label transport, dan paket VPN dibuang.

Itulah alasan loopback PE wajib /32 dan wajib punya label LDP (22.1 §8).

---

## 7. Routing PE-CE

Ada beberapa cara PE mempelajari rute pelanggan. Pilihan bergantung pada skala pelanggan dan siapa yang mengelola CE.

### Static

Paling sederhana dan paling umum untuk cabang kecil dengan satu jalur. PE punya rute statis di VRF ke LAN pelanggan, lalu meredistribusikannya ke MP-BGP. CE cukup punya rute ke PE.

```
! Cisco IOS XE (PE)
ip route vrf CUST-B 192.168.1.0 255.255.255.0 172.16.1.2
router bgp 65000
 address-family ipv4 vrf CUST-B
  redistribute static
  redistribute connected        ! opsional: iklankan juga subnet link PE-CE
```

Kelemahan: tidak ada deteksi kegagalan dinamis. Jika LAN pelanggan mati tetapi link PE-CE hidup, rute tetap diiklankan. Tambahkan IP SLA/BFD pada rute statis bila perlu.

### eBGP (paling umum untuk pelanggan korporat)

eBGP antara CE (AS pelanggan) dan PE (AS operator). Keunggulannya: kebijakan jelas, skala bagus, dan mudah membawa atribut (community pelanggan, preferensi jalur).

**Masalah AS yang sama di semua situs.** Pelanggan sering memakai satu ASN privat (misalnya 65001) di semua situs. Rute dari situs Jakarta tiba di CE Surabaya dengan AS_PATH `65000 65001`. CE Surabaya melihat ASN-nya sendiri (65001) di AS_PATH dan **membuangnya** sebagai loop. Dua solusinya:

| Solusi | Di mana | Cara kerja |
|---|---|---|
| **as-override** | PE | PE mengganti setiap kemunculan ASN pelanggan dengan ASN operator saat mengirim ke CE. AS_PATH menjadi `65000 65000` |
| **allowas-in** | CE | CE diizinkan menerima rute yang berisi ASN-nya sendiri (sampai N kali) |

Operator biasanya memilih **as-override** karena tidak bergantung pada konfigurasi CE milik pelanggan.

Bukti dari lab. Tanpa `as-override` di pe2, ce2a membuang rute dari situs lain:

```
ce2a# show ip bgp neighbors 172.16.2.1
  Prefix statistics:
    AS-PATH loop: 2
  0 accepted, 1 sent prefixes
```

Dengan `as-override`:

```
ce2a# show ip bgp
     Network          Next Hop            Metric LocPrf Weight Path
 *>  192.168.1.0/24   172.16.2.1               0             0 65000 65000 i
```

**Site of Origin (SoO).** as-override dan allowas-in **mematikan** deteksi loop AS_PATH. Pada situs yang terhubung ke dua PE (dual-homed), rute situs itu bisa keluar lewat PE1, berputar lewat MP-BGP, lalu masuk kembali ke situs yang sama lewat PE2. SoO adalah extended community (subtype `0x03`) yang ditempel PE pada rute dari sebuah situs. PE tidak akan mengirim rute kembali ke CE yang SoO-nya sama.

Di lab terlihat mengapa ini penting: dengan `as-override`, pe2 bahkan mengirim balik prefix milik ce2a sendiri, dan ce2a menerimanya karena AS_PATH-nya sudah tidak memuat 65001:

```
ce2a# show ip bgp
 *>  192.168.2.0/24   0.0.0.0                  0         32768 i
 *                    172.16.2.1                             0 65000 65000 i
```

Pada situs tunggal ini tidak berbahaya (rute lokal menang). Pada situs dual-homed, inilah resep loop routing.

```
! Cisco IOS XE (PE): eBGP ke CE dengan as-override dan SoO
router bgp 65000
 address-family ipv4 vrf CUST-A
  neighbor 172.16.1.2 remote-as 65001
  neighbor 172.16.1.2 activate
  neighbor 172.16.1.2 as-override
  neighbor 172.16.1.2 soo 65001:1          ! IOS XE versi baru, atau lewat route-map
  neighbor 172.16.1.2 prefix-list CUST-A-IN in
  neighbor 172.16.1.2 maximum-prefix 500 80
```

> [!WARNING]
> **Selalu pasang filter dan `maximum-prefix` pada sesi PE-CE.** CE milik pelanggan berada di luar kendali Anda. Satu salah konfigurasi di CE (misalnya meredistribusi tabel internet penuh ke VRF) bisa menghabiskan memori PE dan memengaruhi pelanggan lain di PE yang sama.

### OSPF sebagai PE-CE

Banyak perusahaan sudah memakai OSPF di jaringan internalnya dan ingin VPN operator "terlihat seperti bagian dari OSPF". RFC 4577 mendefinisikan cara kerjanya:

- PE menjalankan instance OSPF per VRF. Rute OSPF dari CE diredistribusikan ke MP-BGP, dan PE seberang meredistribusikannya kembali ke OSPF.
- Informasi OSPF asli dibawa sebagai extended community: **Domain ID**, **OSPF Route Type** (area, tipe LSA), dan **Router ID**. Dengan itu PE seberang bisa merekonstruksi rute sebagai **inter-area (LSA tipe 3)** jika domain ID cocok, alih-alih external (tipe 5).
- Backbone MPLS dianggap sebagai "superbackbone" di atas area 0.
- **DN bit** pada LSA mencegah loop: PE tidak meredistribusikan kembali ke BGP LSA yang ditandai DN oleh PE lain.

**Masalah backdoor link dan sham-link.** Misalkan kantor Jakarta dan Surabaya selain lewat VPN juga terhubung lewat link cadangan langsung (backdoor) dalam area OSPF yang sama. Rute lewat backdoor adalah **intra-area**, sedangkan rute lewat VPN tampil sebagai **inter-area**. OSPF selalu memilih intra-area di atas inter-area, apa pun metriknya. Hasilnya, link cadangan yang kecil menjadi jalur utama.

**Sham-link** adalah link OSPF logis intra-area **di antara dua PE**, berjalan di atas backbone MPLS. Dengan sham-link, rute lewat VPN juga intra-area, sehingga metrik kembali menentukan pilihan dan backdoor bisa diberi metrik tinggi.

```
! Cisco IOS XE: sham-link antara pe1 dan pe2 di VRF CUST-C
interface Loopback100
 vrf forwarding CUST-C
 ip address 10.99.0.1 255.255.255.255     ! endpoint sham-link, di dalam VRF
!
router ospf 100 vrf CUST-C
 area 0 sham-link 10.99.0.1 10.99.0.3 cost 10
!
router bgp 65000
 address-family ipv4 vrf CUST-C
  network 10.99.0.1 mask 255.255.255.255  ! endpoint diiklankan lewat BGP, BUKAN OSPF
  redistribute ospf 100
```

> [!WARNING]
> Endpoint sham-link harus diiklankan lewat MP-BGP, bukan lewat OSPF di VRF itu. Jika endpoint dipelajari lewat OSPF, sham-link akan mencoba berjalan di atas dirinya sendiri dan tidak stabil.

FRR ospfd mendukung OSPF di dalam VRF untuk PE-CE, tetapi dokumentasinya tidak mencakup sham-link. RouterOS v7 mencantumkan OSPF sebagai protokol CE-PE di daftar fiturnya.

### Protokol lain

RIP, EIGRP (Cisco), dan IS-IS juga bisa menjadi protokol PE-CE di platform tertentu. Polanya sama: instance per VRF, redistribusi dua arah dengan MP-BGP. Dalam praktik operator, urutan popularitasnya kira-kira **eBGP dan static**, lalu OSPF.

---

## 8. Route Reflector untuk VPNv4

Dengan N PE, full mesh iBGP butuh N(N-1)/2 sesi (07.6 §2). Operator dengan ratusan PE selalu memakai **route reflector (RR)** untuk VPNv4.

```
          [RR1]        [RR2]          ← hanya control plane, sering di luar jalur data
         ╱  │  ╲      ╱  │  ╲
      [PE1][PE2][PE3][PE4][PE5]...    ← setiap PE peering ke dua RR
```

Hal-hal yang khas pada RR VPNv4:

- **RR tidak butuh VRF.** RR hanya memantulkan rute VPNv4 sebagai teks BGP. Ia tidak perlu punya pelanggan.
- **RR menyimpan semua rute.** Karena tidak punya VRF, penyaringan RT otomatis akan membuat RR membuang semuanya. Maka RR menonaktifkan penyaringan itu. Di Cisco IOS, ini terjadi otomatis saat router punya route-reflector client. Di router lain, Anda mungkin perlu mengaturnya secara eksplisit (`bgp retain route-target all` di FRR, `no bgp default route-target filter` di IOS untuk non-RR seperti ASBR).
- **RR tidak harus berada di jalur data.** RR hanya mengubah informasi rute, tidak mengubah next hop (next hop tetap loopback PE asal). Banyak operator memakai RR khusus, bahkan router virtual (vRR), yang tidak meneruskan trafik pelanggan sama sekali.
- **RD unik per PE penting di sini.** RR hanya memantulkan **jalur terbaik** per prefix. Jika situs dual-homed diiklankan oleh PE1 dan PE2 dengan RD yang **sama**, RR melihat dua jalur untuk prefix VPNv4 yang sama, memilih satu, dan PE lain tidak pernah tahu jalur kedua. Konvergensi saat PE1 mati menjadi lambat. Dengan RD **berbeda** per PE, RR melihat dua prefix berbeda dan memantulkan keduanya. (Alternatif lain: BGP Add-Path, dibahas di 22.5.)

```
! Cisco IOS XE: RR untuk VPNv4
router bgp 65000
 neighbor PE-CLIENTS peer-group
 neighbor PE-CLIENTS remote-as 65000
 neighbor PE-CLIENTS update-source Loopback0
 neighbor 10.255.0.1 peer-group PE-CLIENTS
 neighbor 10.255.0.3 peer-group PE-CLIENTS
 !
 address-family vpnv4
  neighbor PE-CLIENTS send-community extended
  neighbor PE-CLIENTS route-reflector-client
  neighbor 10.255.0.1 activate
  neighbor 10.255.0.3 activate

# FRR: RR untuk VPNv4
router bgp 65000
 neighbor 10.255.0.1 remote-as 65000
 neighbor 10.255.0.1 update-source lo
 address-family ipv4 vpn
  neighbor 10.255.0.1 activate
  neighbor 10.255.0.1 route-reflector-client
```

---

## 9. Merancang Topologi dengan Route Target

Karena impor hanya ditentukan RT, topologi VPN adalah soal **desain daftar RT**.

### Full mesh (any-to-any)

Satu RT untuk impor dan ekspor di semua situs pelanggan. Ini yang dipakai di lab (`rt vpn both 65000:100`). Semua situs saling melihat langsung.

### Hub-and-spoke

Kebutuhan umum: cabang hanya boleh bicara ke kantor pusat, atau semua trafik antar-cabang harus melewati firewall di pusat.

```
RT:65000:2001 = "dari spoke"      RT:65000:2000 = "dari hub"

 Spoke 1 VRF: export 2001, import 2000 ──┐
 Spoke 2 VRF: export 2001, import 2000 ──┤
                                         ▼
 Hub PE, VRF HUB-IN : import 2001  ──► link 1 ──► [CE hub / firewall]
 Hub PE, VRF HUB-OUT: export 2000  ◄── link 2 ◄── [CE hub / firewall]
```

- Spoke hanya mengimpor RT hub, jadi spoke tidak pernah menerima rute spoke lain secara langsung.
- Hub mempelajari rute semua spoke lewat VRF `HUB-IN`, lalu CE hub (firewall) mengiklankannya kembali (atau mengiklankan ringkasan atau default route) lewat link kedua ke VRF `HUB-OUT`, yang mengekspor dengan RT hub.
- Trafik spoke 1 ke spoke 2: spoke 1 → PE hub (`HUB-OUT`) → firewall → PE hub (`HUB-IN`) → spoke 2.

Butuh dua VRF dan dua sambungan (atau dua subinterface) di hub karena rute masuk dan rute keluar harus berada di tabel berbeda. Jika CE hub memakai eBGP dengan AS yang sama dengan spoke, pasang `as-override` atau `allowas-in` sesuai arah.

```
! Cisco IOS XE: VRF spoke
vrf definition SPOKE
 rd 10.255.0.5:2001
 address-family ipv4
  route-target export 65000:2001
  route-target import 65000:2000

! VRF di PE hub
vrf definition HUB-IN
 rd 10.255.0.1:2010
 address-family ipv4
  route-target import 65000:2001
vrf definition HUB-OUT
 rd 10.255.0.1:2020
 address-family ipv4
  route-target export 65000:2000
```

### Extranet dan shared services

Pelanggan A dan B sama-sama perlu menjangkau layanan bersama milik operator (misalnya DNS, NTP, gateway pembayaran, atau portal manajemen), tanpa bisa saling menjangkau.

```
VRF SHARED : export RT:65000:999, import RT:65000:101 dan RT:65000:201
VRF CUST-A : export RT:65000:100 + (khusus prefix server) RT:65000:101, import RT:65000:100 dan RT:65000:999
VRF CUST-B : export RT:65000:200 + (khusus prefix server) RT:65000:201, import RT:65000:200 dan RT:65000:999
```

A dan B sama-sama mengimpor `999` (rute layanan bersama), tetapi tidak mengimpor RT satu sama lain. SHARED hanya mengimpor RT khusus `101`/`201` yang ditempel pada prefix tertentu, bukan seluruh rute pelanggan.

```
! Cisco IOS XE: tempelkan RT tambahan hanya pada prefix tertentu
ip prefix-list A-UNTUK-SHARED permit 192.168.1.0/24
route-map EXPORT-A permit 10
 match ip address prefix-list A-UNTUK-SHARED
 set extcommunity rt 65000:101 additive
route-map EXPORT-A permit 20
!
vrf definition CUST-A
 address-family ipv4
  export map EXPORT-A

# FRR: padanannya route-map vpn export
route-map EXPORT-A permit 10
 match ip address prefix-list A-UNTUK-SHARED
 set extcommunity rt 65000:100 65000:101
route-map EXPORT-A permit 20
 set extcommunity rt 65000:100
router bgp 65000 vrf CUST-A
 address-family ipv4 unicast
  route-map vpn export EXPORT-A
```

> [!WARNING]
> **Extranet mensyaratkan alamat yang tidak tumpang tindih** di antara pihak yang bertemu. Dua pelanggan yang sama-sama memakai `192.168.1.0/24` tidak bisa sama-sama dijangkau dari VRF SHARED tanpa NAT. Untuk layanan bersama, operator biasanya memakai blok alamat yang dijamin tidak dipakai pelanggan, atau melakukan NAT di sisi layanan.

### VPN manajemen

Operator yang mengelola CE pelanggan (*managed CE*) perlu menjangkau alamat manajemen setiap CE tanpa masuk ke VPN pelanggan. Polanya sama dengan extranet: VRF pelanggan mengekspor **hanya /32 alamat manajemen CE** dengan RT manajemen, dan VRF manajemen (NOC) mengimpor RT itu (RFC 4364 §12).

---

## 10. Inter-AS: Ketika VPN Melintasi Dua Operator

Bagaimana jika satu pelanggan punya situs yang dilayani dua AS berbeda, misalnya dua operator yang bermitra, atau dua AS milik satu grup perusahaan hasil akuisisi? RFC 4364 §10 menjelaskan tiga cara, yang dikenal sebagai opsi A, B, dan C, berurutan dari yang paling sederhana ke yang paling skalabel.

```
     AS 65000                                          AS 64999
 PE1 ── P ── ASBR1 ═══════════ batas AS ═══════════ ASBR2 ── P ── PE2
```

| | **Option A** | **Option B** | **Option C** |
|---|---|---|---|
| Nama RFC | VRF-to-VRF di ASBR | eBGP VPNv4 antar-ASBR | eBGP VPNv4 multihop antar-RR/PE, + label /32 PE antar-ASBR |
| Yang lewat di batas AS | Paket IP biasa, satu subinterface **per VPN** | Paket berlabel (label VPN) | Paket berlabel (label transport + VPN) |
| ASBR menyimpan rute VPN? | Ya, di VRF | Ya, di tabel VPNv4 (tanpa VRF) | **Tidak**. Hanya /32 loopback PE (BGP labeled unicast) |
| Skala | Buruk (satu VRF dan subinterface per VPN) | Sedang | Terbaik |
| Kepercayaan antar-AS | Minimal | Sedang (bertukar label VPN) | Tinggi (loopback PE dan label saling terekspos) |
| Kebijakan/QoS per VPN di batas | **Mudah** (setiap VPN punya interface) | Terbatas | Terbatas |
| Kapan dipakai | Sedikit VPN lintas AS, antar-operator yang tidak saling percaya | Antar-operator mitra | Antar-AS di bawah satu organisasi |

- **Option A**: setiap ASBR memperlakukan ASBR lain sebagai CE. Paling sederhana dan paling aman, karena tidak ada label yang melintas batas. Tetapi 300 VPN berarti 300 subinterface, 300 VRF, dan 300 sesi eBGP di setiap ASBR.
- **Option B**: ASBR bertukar rute VPNv4 berlabel lewat eBGP. ASBR mengganti label VPN (alokasi label lokal, swap). ASBR harus menyimpan rute VPNv4 tanpa punya VRF, jadi penyaringan RT otomatis harus dimatikan (misalnya `no bgp default route-target filter` di IOS, `bgp retain route-target all` di FRR). FRR punya perintah `mpls bgp l3vpn-multi-domain-switching` per interface untuk perilaku ini.
- **Option C**: ASBR hanya bertukar loopback /32 PE beserta labelnya (BGP labeled unicast, RFC 8277). Rute VPNv4 dipertukarkan langsung antar-RR kedua AS lewat eBGP multihop, dengan next hop tidak diubah. Paket bisa membawa tiga label: label VPN (dari PE egress), label ke PE egress (dari ASBR), dan label ke ASBR (dari IGP lokal).

Konsep serupa **Carrier Supporting Carrier (CSC)** (RFC 4364 §9) dipakai saat pelanggan VPN sendiri adalah operator. Operator pelanggan hanya memasukkan loopback dan rute internalnya ke VRF, dengan label (LDP atau BGP-LU) di sambungan PE-CE, sehingga rute pelanggan-pelanggannya tidak membebani operator penyedia.

> [!TIP]
> Opsi C dan desain seamless/unified MPLS membutuhkan **BGP labeled unicast**. Menurut manual MikroTik, RouterOS belum mendukung BGP sebagai protokol distribusi label, jadi opsi C tidak bisa dibangun murni dengan RouterOS.

---

## 11. Konfigurasi Multi-Vendor

Contoh berikut adalah PE1 di topologi lab: VRF `CUST-A` (eBGP ke CE AS 65001) dan `CUST-B` (static), MP-BGP VPNv4 ke PE2 (`10.255.0.3`). Backbone IGP dan LDP diasumsikan sudah berjalan seperti di 22.1.

### Cisco IOS XE

```
vrf definition CUST-A
 rd 10.255.0.1:100
 address-family ipv4
  route-target export 65000:100
  route-target import 65000:100
 exit-address-family
!
vrf definition CUST-B
 rd 10.255.0.1:200
 address-family ipv4
  route-target both 65000:200
 exit-address-family
!
interface GigabitEthernet2
 description ke-CE1A
 vrf forwarding CUST-A          ! pasang SEBELUM alamat IP
 ip address 172.16.1.1 255.255.255.252
!
interface GigabitEthernet3
 description ke-CE1B
 vrf forwarding CUST-B
 ip address 172.16.1.1 255.255.255.252
!
ip route vrf CUST-B 192.168.1.0 255.255.255.0 172.16.1.2
!
router bgp 65000
 bgp router-id 10.255.0.1
 no bgp default ipv4-unicast
 neighbor 10.255.0.3 remote-as 65000
 neighbor 10.255.0.3 update-source Loopback0
 !
 address-family vpnv4
  neighbor 10.255.0.3 activate
  neighbor 10.255.0.3 send-community extended
 exit-address-family
 !
 address-family ipv4 vrf CUST-A
  neighbor 172.16.1.2 remote-as 65001
  neighbor 172.16.1.2 activate
  neighbor 172.16.1.2 as-override
  neighbor 172.16.1.2 prefix-list CUST-A-IN in
 exit-address-family
 !
 address-family ipv4 vrf CUST-B
  redistribute static
 exit-address-family
```

> [!WARNING]
> **`vrf forwarding` menghapus alamat IP interface.** IOS menampilkan pesan bahwa IPv4 di interface dinonaktifkan dan alamatnya dihapus. Jika Anda menambahkan VRF ke interface yang sudah beralamat (misalnya saat migrasi), alamat harus diketik ulang. Di jendela pemeliharaan, ini berarti pelanggan putus sampai alamat dipasang kembali.

Verifikasi:

```
PE1# show vrf detail CUST-A
PE1# show ip route vrf CUST-A
PE1# show bgp vpnv4 unicast all summary
PE1# show bgp vpnv4 unicast all
PE1# show bgp vpnv4 unicast rd 10.255.0.3:100 192.168.2.0/24
PE1# show bgp vpnv4 unicast all labels
PE1# show ip cef vrf CUST-A 192.168.2.0 detail       ← dua label: transport dan VPN
PE1# ping vrf CUST-A 192.168.2.1 source 172.16.1.1
```

### Cisco IOS XR

```
vrf CUST-A
 address-family ipv4 unicast
  import route-target
   65000:100
  !
  export route-target
   65000:100
!
interface GigabitEthernet0/0/0/1
 vrf CUST-A
 ipv4 address 172.16.1.1 255.255.255.252
!
route-policy PASS
  pass
end-policy
!
router bgp 65000
 bgp router-id 10.255.0.1
 address-family vpnv4 unicast
 !
 neighbor 10.255.0.3
  remote-as 65000
  update-source Loopback0
  address-family vpnv4 unicast
 !
 vrf CUST-A
  rd 10.255.0.1:100
  address-family ipv4 unicast
   label mode per-vrf
  !
  neighbor 172.16.1.2
   remote-as 65001
   address-family ipv4 unicast
    route-policy PASS in
    route-policy PASS out
    as-override
```

> [!WARNING]
> IOS XR **tidak menerima dan tidak mengirim rute eBGP** apa pun tanpa `route-policy` di kedua arah (perilaku RFC 8212). Contoh di atas memakai `PASS` agar ringkas. Di produksi, gunakan kebijakan yang benar-benar menyaring.

```
RP/0/RP0/CPU0:PE1# show bgp vpnv4 unicast summary
RP/0/RP0/CPU0:PE1# show bgp vpnv4 unicast rd 10.255.0.3:100
RP/0/RP0/CPU0:PE1# show bgp vrf CUST-A
RP/0/RP0/CPU0:PE1# show route vrf CUST-A
RP/0/RP0/CPU0:PE1# show cef vrf CUST-A 192.168.2.0/24
```

### Juniper Junos

```
set routing-options autonomous-system 65000
set routing-options router-id 10.255.0.1

set protocols bgp group IBGP-VPN type internal
set protocols bgp group IBGP-VPN local-address 10.255.0.1
set protocols bgp group IBGP-VPN family inet-vpn unicast
set protocols bgp group IBGP-VPN neighbor 10.255.0.3

set interfaces ge-0/0/1 unit 0 family inet address 172.16.1.1/30

set routing-instances CUST-A instance-type vrf
set routing-instances CUST-A interface ge-0/0/1.0
set routing-instances CUST-A route-distinguisher 10.255.0.1:100
set routing-instances CUST-A vrf-target target:65000:100
set routing-instances CUST-A vrf-table-label
set routing-instances CUST-A protocols bgp group CE type external
set routing-instances CUST-A protocols bgp group CE peer-as 65001
set routing-instances CUST-A protocols bgp group CE as-override
set routing-instances CUST-A protocols bgp group CE neighbor 172.16.1.2
```

`vrf-target` adalah singkatan untuk "impor dan ekspor RT yang sama". Untuk RT impor dan ekspor yang berbeda (hub-and-spoke), gunakan `vrf-import` dan `vrf-export` dengan `policy-statement`, atau `vrf-target import ...` dan `vrf-target export ...`.

```
user@PE1> show route table CUST-A.inet.0
user@PE1> show route table bgp.l3vpn.0
user@PE1> show route advertising-protocol bgp 10.255.0.3
user@PE1> show route receive-protocol bgp 10.255.0.3 detail
user@PE1> show route hidden table bgp.l3vpn.0          ← rute tanpa LSP ke next hop
user@PE1> ping routing-instance CUST-A 192.168.2.1
```

### MikroTik RouterOS v7

```
# VRF pelanggan
/ip vrf add name=cust-a interfaces=ether3
/ip vrf add name=cust-b interfaces=ether4
/ip address add address=172.16.1.1/30 interface=ether3
/ip address add address=172.16.1.1/30 interface=ether4

# Static ke LAN pelanggan B, di tabel VRF
/ip route add dst-address=192.168.1.0/24 gateway=172.16.1.2 routing-table=cust-b

# Sesi VPNv4 ke PE seberang
/routing bgp template add name=vpn-core as=65000 router-id=10.255.0.1
/routing bgp connection add name=pe2 templates=vpn-core local.role=ibgp \
    remote.address=10.255.0.3 local.address=10.255.0.1 address-families=vpnv4

# Ekspor/impor VRF ke VPNv4
/routing bgp vpn add vrf=cust-a route-distinguisher=10.255.0.1:100 \
    import.route-targets=65000:100 export.route-targets=65000:100 \
    label-allocation-policy=per-vrf export.redistribute=connected,bgp
/routing bgp vpn add vrf=cust-b route-distinguisher=10.255.0.1:200 \
    import.route-targets=65000:200 export.route-targets=65000:200 \
    label-allocation-policy=per-vrf export.redistribute=connected,static

# eBGP ke CE pelanggan A di dalam VRF
/routing bgp connection add name=ce1a templates=vpn-core local.role=ebgp vrf=cust-a \
    remote.address=172.16.1.2 remote.as=65001 output.as-override=yes

# Verifikasi
/routing bgp session print
/ip route print where routing-table=cust-a
/mpls forwarding-table print
/ping 192.168.2.1 vrf=cust-a
```

**Catatan versi dan keterbatasan RouterOS v7:**

- Sintaks BGP RouterOS v7 berubah beberapa kali di antara rilis v7. Contoh di modul ini memakai sintaks rilis stable per Oktober 2026 (7.24.5, dicek di server pembaruan resmi MikroTik; 7.26 masih beta): menu `/routing/bgp/instance`, parameter `instance=` di `connection` dan `vpn`, serta `afi=` (misalnya `afi=vpnv4`) untuk keluarga alamat. Rilis v7 yang lebih lama memakai `address-families=` dan belum mengenal `instance`. Konfigurasi RouterOS lengkap yang diuji di CHR 7.24.5 ada di `19-mikrotik/09-mpls-routeros`; selalu cek `?` di router Anda sendiri.
- Label VPN bisa per-VRF atau per-prefix (`label-allocation-policy`).
- BGP labeled unicast belum didukung, jadi inter-AS option C dan seamless MPLS tidak bisa dibangun murni dengan RouterOS.
- Paket yang di-switch dengan MPLS tidak melewati firewall IP, jadi kebijakan keamanan pelanggan harus diterapkan di interface VRF (ingress/egress PE).
- Pembahasan lengkap MPLS di RouterOS, termasuk VPLS, ada di `19-mikrotik/09-mpls-routeros`.

### FRRouting

Konfigurasi lengkap PE1 di lab (`configs/pe1/frr.conf`, bagian layanan):

```
vrf CUST-B
 ip route 192.168.1.0/24 172.16.1.2
exit-vrf
!
interface eth2
 ip address 172.16.1.1/30          ! eth2 sudah di-enslave ke VRF CUST-A oleh mulai.sh
!
interface eth3
 ip address 172.16.1.1/30          ! eth3 di VRF CUST-B
!
ip prefix-list PL-CE-A-IN seq 10 permit 192.168.0.0/16 le 24
route-map RM-CE-A-IN permit 10
 match ip address prefix-list PL-CE-A-IN
route-map RM-CE-A-OUT permit 10
!
router bgp 65000
 bgp router-id 10.255.0.1
 no bgp default ipv4-unicast
 neighbor 10.255.0.3 remote-as 65000
 neighbor 10.255.0.3 update-source lo
 address-family ipv4 vpn
  neighbor 10.255.0.3 activate
 exit-address-family
!
router bgp 65000 vrf CUST-A
 bgp router-id 10.255.0.1
 neighbor 172.16.1.2 remote-as 65001
 address-family ipv4 unicast
  neighbor 172.16.1.2 as-override
  neighbor 172.16.1.2 route-map RM-CE-A-IN in
  neighbor 172.16.1.2 route-map RM-CE-A-OUT out
  label vpn export auto            ! minta label dari zebra
  rd vpn export 10.255.0.1:100
  rt vpn both 65000:100
  export vpn                       ! VRF → VPNv4
  import vpn                       ! VPNv4 → VRF
 exit-address-family
!
router bgp 65000 vrf CUST-B
 bgp router-id 10.255.0.1
 address-family ipv4 unicast
  redistribute static
  label vpn export auto
  rd vpn export 10.255.0.1:200
  rt vpn both 65000:200
  export vpn
  import vpn
 exit-address-family
```

Hal-hal khas FRR:

- Instance BGP default (tanpa `vrf`) membawa VPNv4. Setiap VRF punya instance `router bgp <AS> vrf <NAMA>` sendiri.
- `export vpn` dan `import vpn` adalah saklar eksplisit. Tanpa keduanya, RD dan RT tidak berpengaruh.
- **`label vpn export auto` wajib.** Dokumentasi FRR menyebut bahwa tanpa label, ekspor ke VPN tidak selesai. Pada percobaan di lab (FRR 10.4.1), perilakunya sedikit berbeda dan lebih licik: rute tetap diekspor, tetapi dengan label VPN **3 (implicit null)**. Lihat percobaan 6c di §12.
- `frr defaults traditional` mengaktifkan `bgp ebgp-requires-policy` (RFC 8212). Sesi eBGP ke CE tidak akan menerima atau mengirim rute tanpa route-map di kedua arah. Itulah sebabnya ada `RM-CE-A-IN` dan `RM-CE-A-OUT`.
- `rd vpn export` hanya menerima format `AS:NN` atau `IP:nn`.
- VPNv6 memakai pola yang sama di `address-family ipv6 unicast` (VRF) dan `address-family ipv6 vpn` (instance default).

```
pe1# show bgp ipv4 vpn summary
pe1# show bgp ipv4 vpn
pe1# show bgp ipv4 vpn rd 10.255.0.3:100
pe1# show bgp vrf CUST-A ipv4 unicast
pe1# show ip route vrf CUST-A
pe1# show mpls table
$ ip -f mpls route
$ ip route show vrf CUST-A
$ ip vrf exec CUST-A ping 192.168.1.2
```

---

## 12. Lab: Dua Pelanggan dengan Alamat Identik

Lab ini sama dengan lab di 22.1 (`materi/lab/kode/mpls-l3vpn/`). Prasyarat dan cara deploy ada di 22.1 §12. Ringkasnya:

```bash
sudo modprobe mpls_router mpls_iptunnel
cd materi/lab/kode/mpls-l3vpn
sudo containerlab deploy -t mpls-l3vpn.clab.yml
# tunggu sekitar satu menit
./uji.sh
```

### Rencana layanan

| | Pelanggan A (`CUST-A`) | Pelanggan B (`CUST-B`) |
|---|---|---|
| Situs Jakarta (pe1) | ce1a, LAN `192.168.1.0/24`, link `172.16.1.0/30` | ce1b, LAN `192.168.1.0/24`, link `172.16.1.0/30` |
| Situs Surabaya (pe2) | ce2a, LAN `192.168.2.0/24`, link `172.16.2.0/30` | ce2b, LAN `192.168.2.0/24`, link `172.16.2.0/30` |
| PE-CE | eBGP, CE AS 65001 di kedua situs, `as-override` di PE | Static |
| RD | `10.255.0.1:100` (pe1), `10.255.0.3:100` (pe2) | `10.255.0.1:200`, `10.255.0.3:200` |
| RT | `65000:100` | `65000:200` |

Alamat kedua pelanggan, **termasuk subnet link PE-CE**, identik. Inilah inti lab.

### Langkah 1: periksa sisi pelanggan

```bash
docker exec -it clab-mpls-l3vpn-ce1a vtysh -c "show ip bgp summary" -c "show ip bgp"
docker exec clab-mpls-l3vpn-ce1b ip route
```

ce1a harus `Established` ke `172.16.1.1` dan menerima `192.168.2.0/24` dengan AS_PATH `65000 65000`. ce1b hanya punya rute statis `192.168.0.0/16 via 172.16.1.1`.

### Langkah 2: periksa VRF dan VPNv4 di PE

```
pe1# show bgp vrf CUST-A ipv4 unicast summary
pe1# show bgp ipv4 vpn summary
pe1# show bgp ipv4 vpn
pe1# show ip route vrf CUST-A
pe1# show ip route vrf CUST-B
```

Pertanyaan: berapa label VPN yang diiklankan pe2 untuk `CUST-A` dan `CUST-B`? Berapa label transport yang dipakai pe1 untuk mencapai pe2? Cocokkan dengan `show mpls ldp binding` dari 22.1.

### Langkah 3: buktikan core tidak tahu pelanggan

```bash
docker exec clab-mpls-l3vpn-p1 ip route          # tidak ada 192.168.x.x
docker exec clab-mpls-l3vpn-p1 vtysh -c "show bgp summary"   # BGP tidak berjalan
```

### Langkah 4: uji konektivitas dan isolasi

```bash
docker exec clab-mpls-l3vpn-ce1a ping -c 3 -I 192.168.1.1 192.168.2.1   # ke ce2a
docker exec clab-mpls-l3vpn-ce1b ping -c 3 -I 192.168.1.1 192.168.2.1   # ke ce2b
```

Keduanya berhasil, padahal sumber dan tujuannya sama persis. Untuk membuktikan bahwa paket B memang sampai ke ce2b (bukan ce2a), hapus alamat LAN di ce2b lalu ulangi:

```bash
docker exec clab-mpls-l3vpn-ce2b ip addr del 192.168.2.1/24 dev lan0
docker exec clab-mpls-l3vpn-ce1b ping -c 2 -W 1 -I 192.168.1.1 192.168.2.1   # 100% loss
docker exec clab-mpls-l3vpn-ce1a ping -c 2 -I 192.168.1.1 192.168.2.1        # tetap 0% loss
docker exec clab-mpls-l3vpn-ce2b ip addr add 192.168.2.1/24 dev lan0
```

(Mematikan interface `lan0` saja tidak cukup untuk percobaan ini: Linux tetap menjawab ping ke alamat lokal walau interface dummy-nya down.)

### Langkah 5: lihat dua label di kabel

```bash
docker exec clab-mpls-l3vpn-p1 apk add tcpdump
docker exec clab-mpls-l3vpn-p1 tcpdump -nn -c 4 -i eth1 mpls &
docker exec clab-mpls-l3vpn-ce1a ping -c 2 -I 192.168.1.1 192.168.2.1
```

### Langkah 6: rusak dengan sengaja

Lakukan satu per satu, amati gejalanya, lalu pulihkan.

**a. RT impor salah.** Di pe2:

```
pe2(config)# router bgp 65000 vrf CUST-A
pe2(config-router)# address-family ipv4 unicast
pe2(config-router-af)# no rt vpn both 65000:100
pe2(config-router-af)# rt vpn export 65000:100
pe2(config-router-af)# rt vpn import 65000:999
```

Hasil yang diamati di lab: rute `10.255.0.1:100:192.168.1.0/24` **tetap ada** di `show bgp ipv4 vpn` di pe2, tetapi **hilang** dari `show ip route vrf CUST-A`. Ini tanda khas RT mismatch: rute sampai di PE, tetapi tidak diimpor ke VRF. Pulihkan dengan `no rt vpn import 65000:999`, `no rt vpn export 65000:100`, `rt vpn both 65000:100`.

**b. Tanpa as-override.** Di pe2: `no neighbor 172.16.2.2 as-override` di `address-family ipv4 unicast` VRF CUST-A, lalu `clear bgp vrf CUST-A 172.16.2.2 soft out`. Di ce2a, `show ip bgp neighbors 172.16.2.1` menampilkan `AS-PATH loop` dan rute ke `192.168.1.0/24` hilang.

**c. Tanpa label ekspor.** Di pe1, `no label vpn export auto` di VRF CUST-B. Hasil yang diamati di lab (FRR 10.4.1): rute B dari pe1 **tetap** ada di VPNv4 dan VRF pe2, tetapi dengan `Remote label: 3`:

```
pe2# show ip route vrf CUST-B 192.168.1.0/24
    10.255.0.1(vrf default) (recursive), label implicit-null, weight 1
  *   10.0.23.1, via eth1(vrf default), label 16/implicit-null, weight 1
```

pe2 kini hanya memasang label transport. p1 melakukan PHP, sehingga paket tiba di pe1 sebagai **IP polos tanpa label VPN**. pe1 mencarinya di tabel global (bukan VRF CUST-B), tidak menemukan `192.168.1.0/24`, dan membuangnya. Ping ce1b ke ce2b gagal, padahal semua tabel kontrol tampak "lengkap". Pelajaran: selalu periksa **nilai** label VPN, bukan hanya keberadaan rute. Pulihkan dengan `label vpn export auto`.

**d. Putuskan LSP.** Matikan LDP di p1 eth2 seperti di 22.1 §12 latihan E. BGP VPNv4 tetap `Established`, rute tetap ada di VPNv4 dan VRF, tetapi ping gagal. Ini kasus "BGP sehat, VPN mati" yang paling membingungkan di lapangan.

### Tantangan

1. **Hub-and-spoke.** Ubah RT pelanggan B: pe1 menjadi hub (export `65000:2000`, import `65000:2001`), pe2 menjadi spoke (export `65000:2001`, import `65000:2000`). Apakah konektivitas ce1b ke ce2b masih jalan? Mengapa? Apa yang perlu ditambahkan agar dua spoke bisa saling bicara lewat hub?
2. **VPNv6.** Tambahkan alamat IPv6 di LAN dan link PE-CE pelanggan A, aktifkan `address-family ipv6 vpn` di sesi pe1-pe2 dan `address-family ipv6 unicast` di VRF, tanpa mengubah core yang IPv4-only. Ini 6VPE.
3. **Route reflector.** Tambahkan node `rr` yang tersambung ke p1, jalankan IS-IS dan LDP di sana, lalu ubah pe1 dan pe2 agar hanya peering VPNv4 ke `rr`.

### Membongkar lab

```bash
sudo containerlab destroy -t mpls-l3vpn.clab.yml --cleanup
```

---

## 13. Troubleshooting

### Ikuti rute, langkah demi langkah

Layanan L3VPN melibatkan banyak tahap. Diagnosis yang efisien mengikuti perjalanan **rute** dari CE sumber sampai PE seberang, lalu perjalanan **paket** di arah sebaliknya. Kerjakan berurutan.

```
CONTROL PLANE (rute 192.168.1.0/24 dari ce1a menuju VRF di pe2)

1. CE → PE     : sesi PE-CE naik? rute ada di VRF pe1?
                 show bgp vrf CUST-A summary / show ip route vrf CUST-A
2. VRF → VPNv4 : rute diekspor dengan RD, RT, label yang benar?
                 show bgp vpnv4 unicast rd 10.255.0.1:100   (Cisco)
                 show bgp ipv4 vpn rd 10.255.0.1:100        (FRR)
3. VPNv4 sesi  : pe1 ↔ pe2 (atau ↔ RR) Established DAN keluarga vpnv4 aktif?
                 show bgp vpnv4 unicast all summary
4. Diterima    : rute ada di tabel VPNv4 pe2? (jika lewat RR: ada di RR?)
5. Diimpor     : rute masuk VRF di pe2? Jika ada di VPNv4 tapi tidak di VRF → RT
6. Next hop    : next hop (loopback pe1) punya LSP? (Junos: inet.3 / hidden)
7. PE → CE     : rute diiklankan ke ce2a? diterima ce2a? (AS loop, filter)

DATA PLANE
8. LSP         : ping mpls ipv4 10.255.0.1/32 dari pe2 (dan sebaliknya!)
9. Label VPN   : label yang dipakai pe2 = label yang dialokasikan pe1?
                 show ip cef vrf CUST-A 192.168.1.0 detail / show mpls forwarding vrf
10. MTU        : ping DF 1500 byte dari CE ke CE
11. Arah balik : ulangi semua langkah untuk 192.168.2.0/24 dari ce2a ke pe1
```

> [!WARNING]
> **Jangan lupa arah balik.** Ping butuh rute di kedua arah. Banyak tiket "VPN mati" ternyata hanya satu arah yang rusak, misalnya RT impor salah hanya di satu PE.

### Gejala dan penyebab

| Gejala | Penyebab paling mungkin | Pemeriksaan |
|---|---|---|
| Rute pelanggan tidak ada di VRF PE lokal | Sesi PE-CE turun, filter masuk, eBGP tanpa policy (XR/FRR), static salah VRF | `show bgp vrf X summary`, `show ip route vrf X` |
| Rute di VRF lokal tapi tidak di VPNv4 | Tidak ada RD, tidak ada `export vpn` atau label (FRR), RT ekspor kosong, rute tidak diredistribusikan ke BGP VRF | `show bgp vpnv4 unicast rd <RD>` |
| Sesi VPNv4 Established tapi PfxRcd 0 | Keluarga vpnv4 tidak diaktifkan di salah satu sisi, `send-community extended` hilang | `show bgp vpnv4 unicast all neighbors X` (cek capability) |
| Rute ada di tabel VPNv4 PE seberang, tidak ada di VRF | **RT impor tidak cocok** | Bandingkan RT di rute dengan `route-target import` VRF |
| Rute tidak sampai ke PE seberang lewat RR | RR membuang (penyaringan RT di non-RR), RR belum `route-reflector-client`, RD sama sehingga jalur kedua tersembunyi | Periksa tabel VPNv4 di RR |
| Rute di VRF tapi Junos menandainya hidden | Next hop tidak ada di `inet.3` (tidak ada LSP) | `show route hidden extensive` |
| Semua rute benar, ping gagal | LSP putus, label VPN salah, MTU, ACL di CE | `ping mpls`, `show ip cef vrf ... detail`, ping DF |
| CE tidak menerima rute situs lain | AS_PATH loop (AS sama tanpa as-override), filter keluar PE | `show ip bgp neighbors` di CE |
| Loop routing pada situs dual-homed | as-override/allowas-in tanpa SoO | Tambahkan SoO per situs |
| Pelanggan A bisa menjangkau B | RT bocor (salah ketik RT, RT extranet terlalu luas) | Audit semua `import` yang memuat RT pelanggan lain |
| Ping kecil jalan, transfer besar macet | MTU core | Lihat 22.1 §10 |
| OSPF PE-CE: rute lewat VPN muncul sebagai external (O E2) | Domain ID berbeda di kedua PE | Samakan domain ID atau proses OSPF |
| OSPF PE-CE: trafik lewat backdoor, bukan VPN | Rute backdoor intra-area mengalahkan inter-area | Sham-link |

### Kesalahan Umum

| Kesalahan | Akibat | Pencegahan |
|---|---|---|
| Mengira RD menentukan keanggotaan VPN | Rute tidak diimpor walau "RD sudah sama" | Ingat: impor hanya berdasarkan **RT** |
| RD sama di semua PE dengan RR dan situs dual-homed | Jalur cadangan tidak terlihat, failover lambat | RD per PE: `<loopback>:<id>` |
| Lupa `send-community extended` atau menghapusnya | Rute VPNv4 tiba tanpa RT dan tidak diimpor di mana pun | Biarkan default IOS, periksa konfigurasi neighbor |
| `vrf forwarding` setelah `ip address` di IOS | Alamat interface terhapus, pelanggan putus | Pasang VRF lebih dulu, siapkan alamat untuk diketik ulang |
| Tidak memfilter rute dari CE | CE pelanggan bisa membanjiri PE | Prefix-list + `maximum-prefix` per sesi PE-CE |
| as-override tanpa SoO di situs dual-homed | Loop routing | SoO per situs |
| Loopback PE bukan /32 atau tanpa label LDP | Rute VPN tidak terpasang atau paket dibuang | Loopback /32, cek `show mpls ldp bindings` |
| Hanya menguji satu arah | Masalah arah balik terlewat | Selalu uji dan periksa kedua arah |
| Extranet antar-pelanggan beralamat sama | Rute bertabrakan di VRF bersama | Blok alamat khusus layanan bersama, atau NAT |

---

## 14. Contoh Layanan IP VPN di Operator Indonesia

Bagian ini menggambarkan pola umum layanan IP VPN berbasis MPLS yang dijual operator dan penyedia jaringan tertutup di Indonesia. Nama produk, paket, dan angka SLA berbeda di setiap operator, jadi yang ditulis di sini adalah **pola teknis**, bukan deskripsi produk tertentu.

### Bentuk layanan yang lazim

```
  Kantor pusat (Jakarta)                         Cabang (kota lain, remote)
  ┌─────────────────────┐                        ┌──────────────────┐
  │ LAN ── [CE managed] │═══ fiber/metro-E ═══╗  │ [CE managed]─LAN │
  └─────────────────────┘                     ║  └────────╥─────────┘
                                         ┌────╨───────────╨───────┐
  Data center / DRC ═════════════════════│   Backbone MPLS        │═══ VSAT / radio ═══ Cabang terpencil
                                         │   operator (VRF per    │
  Internet breakout terpusat ════════════│   pelanggan)           │
                                         └────────────────────────┘
```

- **Satu VRF per pelanggan korporat**, dengan RT full mesh atau hub-and-spoke ke kantor pusat dan data center.
- **CE dikelola operator** (*managed CE*). Operator memegang konfigurasi router di sisi pelanggan, memantau link, dan bertanggung jawab atas SLA sampai ke port LAN CE. Untuk ini operator membangun **VPN manajemen** (§9) agar NOC bisa menjangkau semua CE.
- **Last mile beragam:** fiber atau metro Ethernet di kota besar, radio microwave untuk jarak menengah, dan VSAT atau link satelit lain untuk lokasi terpencil yang belum terjangkau fiber. MTU dan latensi tiap media berbeda, dan desain QoS harus menyesuaikan.
- **Kelas layanan (CoS):** operator biasanya menawarkan beberapa kelas, misalnya real-time untuk suara/video, kelas bisnis untuk aplikasi kritis, dan best effort. Penandaan DSCP dari pelanggan dipetakan ke TC di label MPLS (22.1 §6, 11.3).
- **Akses internet** bisa melalui situs pusat pelanggan (semua cabang keluar lewat firewall pusat, pola hub) atau melalui *internet breakout* di PE dengan VRF atau route leaking khusus.

### Pola permintaan pelanggan korporat

- **Dua operator berbeda (dual carrier).** Pelanggan dengan kebutuhan ketersediaan tinggi, misalnya institusi keuangan, sering meminta link utama dan cadangan dari dua operator berbeda, lalu mengatur failover di CE dengan BGP (LOCAL_PREF dan AS_PATH prepend, 07.6 §9). Dari sudut pandang operator, setiap operator hanya melihat satu sisi. Dari sudut pandang pelanggan, desain eBGP PE-CE dengan AS privat pelanggan menjadi kunci.
- **Banyak cabang kecil.** Jaringan ritel, logistik, atau mesin layanan mandiri bisa berarti ratusan sampai ribuan situs kecil dengan bandwidth rendah. Di sini PE-CE static, template konfigurasi CE, dan otomasi provisioning (Tahap 15) menjadi penting.
- **Pemisahan unit bisnis.** Satu perusahaan bisa meminta beberapa VRF (misalnya jaringan produksi, kantor, dan CCTV) dengan extranet terbatas di antaranya.
- **Sambungan ke cloud.** Semakin banyak pelanggan meminta VRF mereka tersambung ke cloud publik lewat layanan interkoneksi privat. Polanya serupa extranet: VRF pelanggan disambungkan ke titik interkoneksi cloud.

### Apa artinya bagi Anda sebagai engineer

Pekerjaan sehari-hari di NOC atau tim provisioning operator banyak berkisar pada hal-hal di modul ini: membuat VRF baru dengan RD dan RT sesuai standar penomoran internal, mengikat interface pelanggan, menyiapkan sesi PE-CE dengan filter, menguji ping DF ujung ke ujung sebelum serah terima, dan menelusuri tiket "VPN putus" dengan alur §13. Kebiasaan yang membedakan engineer senior: **selalu menyebut dan memeriksa RD, RT, label, dan arah balik**, bukan hanya "BGP-nya sudah up".

---

## 15. Ringkasan

- MPLS L3VPN (RFC 4364) adalah **peer model**: operator merutekan antar-situs pelanggan, setiap pelanggan berada di **VRF** terpisah di PE, core tidak tahu pelanggan.
- **RD** (8 byte, type 0/1/2) membuat prefix unik: **VPN-IPv4 = RD + IPv4 = 12 byte**. RD **tidak** menentukan impor.
- **RT** adalah extended community (subtype 0x02). VRF mengimpor rute yang membawa **minimal satu** RT di daftar impornya. Semua topologi (full mesh, hub-and-spoke, extranet, manajemen) dibangun dari desain RT.
- **MP-BGP** membawa VPNv4 (**AFI 1, SAFI 128**) dan VPNv6 (AFI 2, SAFI 128) antar-loopback PE, dengan **label VPN di dalam NLRI** dan RT sebagai extended community.
- Paket VPN membawa **dua label**: **transport** (LDP, berganti per hop, di-pop di penultimate hop) dan **VPN** (dari PE egress, dibaca hanya oleh PE egress).
- Next hop VPN (loopback PE) **wajib punya LSP**. Tanpa itu: Junos menyembunyikan rute, FRR tidak memasangnya, Cisco membuang paketnya.
- PE-CE: **static** (sederhana), **eBGP** (umum, butuh **as-override**/allowas-in bila AS sama, plus **SoO** untuk dual-homed), **OSPF** (domain ID, DN bit, **sham-link** untuk backdoor).
- **RR VPNv4** tidak butuh VRF, menyimpan semua rute, dan sebaiknya dipadukan dengan **RD unik per PE**.
- **Inter-AS**: option **A** (VRF-to-VRF, sederhana, tidak skalabel), **B** (eBGP VPNv4 antar-ASBR), **C** (BGP-LU antar-ASBR + VPNv4 multihop antar-RR, paling skalabel).
- Diagnosis: ikuti rute **CE → VRF → VPNv4 (RD/RT/label) → sesi → impor (RT) → next hop LSP → CE**, lalu dataplane (LSP ping, label, MTU), **di kedua arah**.

---

## 16. Latihan

1. Seorang rekan berkata: "VRF pelanggan X di PE5 tidak menerima rute dari PE2 karena RD-nya beda. PE2 pakai `10.255.0.2:300`, PE5 pakai `10.255.0.5:300`. Samakan saja RD-nya." Apakah analisisnya benar? Jelaskan apa yang sebenarnya menentukan impor, dan apa yang akan Anda periksa.
2. Hitung panjang dalam byte dari alamat VPN-IPv4 untuk prefix `192.168.1.0/24` dengan RD `65000:100`, dan tulis nilai 8 byte RD-nya dalam heksadesimal.
3. Di PE2, `show bgp vpnv4 unicast all` menampilkan rute `10.255.0.1:100:192.168.1.0/24` dengan RT `65000:100`, tetapi `show ip route vrf CUST-A` di PE2 tidak memuat `192.168.1.0/24`. Sebutkan dua penyebab yang mungkin dan cara membedakannya.
4. Pelanggan dengan 30 cabang memakai AS 65010 di semua situs, PE-CE eBGP. Setelah aktivasi, setiap cabang hanya bisa menjangkau dirinya sendiri. Jelaskan penyebabnya, beri dua solusi, dan sebutkan solusi yang biasanya dipilih operator beserta alasannya. Fitur tambahan apa yang wajib bila ada cabang dual-homed?
5. Rancang daftar RT untuk pelanggan dengan satu kantor pusat (PE1) dan 20 cabang (PE lain), dengan syarat semua trafik antar-cabang wajib melewati firewall di kantor pusat. Jelaskan mengapa PE kantor pusat butuh dua VRF.
6. Operator punya dua route reflector VPNv4. Situs pelanggan C terhubung ke PE3 (utama) dan PE4 (cadangan), keduanya memakai RD `65000:500`. Saat PE3 mati, pemulihan trafik dari situs lain butuh puluhan detik. Jelaskan kenapa, dan perubahan apa yang mempercepatnya.
7. Kantor Jakarta dan Bandung pelanggan D sama-sama di area 0 OSPF, terhubung lewat L3VPN (OSPF PE-CE) dan juga link microwave cadangan 10 Mbps langsung antar-CE. Setelah migrasi, semua trafik lewat microwave. Jelaskan penyebabnya dan solusinya.
8. Dua operator ingin menyambungkan 15 VPN pelanggan bersama. Mereka tidak ingin saling mengekspos loopback internal dan ingin menerapkan kebijakan QoS per VPN di titik interkoneksi. Opsi inter-AS mana yang Anda sarankan dan apa konsekuensinya jika jumlah VPN tumbuh menjadi 400?
9. Di lab FRR, Anda menghapus `label vpn export auto` dari VRF CUST-B di pe1. Apa yang terjadi pada tabel VPNv4 di pe2 dan konektivitas pelanggan B? Mengapa?
10. Tiket: "Sejak pagi, cabang Makassar pelanggan E tidak bisa menjangkau kantor pusat. Cabang lain normal." Sesi PE-CE di Makassar `Established` dan BGP VPNv4 di PE Makassar ke RR juga `Established`. Tulis urutan pemeriksaan Anda (minimal enam langkah) beserta perintah Cisco IOS XE yang Anda pakai.

<details>
<summary>Jawaban</summary>

1. **Analisisnya salah.** RD hanya membuat prefix unik di BGP dan **tidak pernah** dipakai untuk memutuskan impor. RD berbeda per PE justru praktik yang disarankan. Yang menentukan impor adalah **RT**: VRF di PE5 mengimpor rute yang membawa minimal satu RT dari daftar `route-target import`-nya. Periksa: (a) RT apa yang ditempel PE2 saat ekspor (`show bgp vpnv4 unicast rd 10.255.0.2:300 <prefix>`, lihat `Extended Community: RT:...`); (b) daftar import RT di VRF PE5 (`show vrf detail X`); (c) apakah rute itu memang tiba di PE5 (`show bgp vpnv4 unicast all <prefix>`). Jika rute tiba tetapi tidak diimpor, RT tidak cocok. Jika tidak tiba, periksa sesi VPNv4, RR, dan `send-community extended`.

2. VPN-IPv4 = 8 byte RD + 4 byte IPv4 = **12 byte** (di NLRI, prefix /24 hanya membawa 3 byte alamat, tetapi alamat VPN-IPv4 lengkapnya 12 byte). RD `65000:100` adalah **type 0**: 2 byte type `00 00`, 2 byte ASN 65000 = `FD E8`, 4 byte nomor 100 = `00 00 00 64`. Hasil: **`00 00 FD E8 00 00 00 64`**.

3. Penyebab yang mungkin: (a) **RT impor VRF CUST-A di PE2 tidak memuat `65000:100`** (salah ketik, atau desain hub-and-spoke yang memang tidak mengimpor RT itu). Bedakan dengan `show vrf detail CUST-A`, bandingkan dengan RT di rute. (b) **Next hop `10.255.0.1` tidak bisa di-resolve dengan benar** (tidak ada rute atau LSP ke loopback PE1), sehingga rute tidak valid/tidak dipilih. Bedakan dengan `show bgp vpnv4 unicast all 192.168.1.0` (apakah ada tanda `valid`/`best` dan "inaccessible"?) dan `show mpls forwarding-table 10.255.0.1 32`. Penyebab lain: route-map impor (`import map`) menolak prefix, atau ada rute lain dengan AD lebih rendah untuk prefix yang sama di VRF.

4. Penyebab: rute dari cabang lain tiba di CE dengan AS_PATH memuat **65010**, ASN CE itu sendiri. CE membuangnya sebagai loop AS. Solusi: (a) **`as-override`** di PE: PE mengganti 65010 di AS_PATH dengan ASN operator saat mengirim ke CE. (b) **`allowas-in`** di setiap CE. Operator biasanya memilih **as-override** karena cukup dikonfigurasi di PE yang dikelola operator, tidak bergantung pada konfigurasi CE pelanggan. Untuk cabang dual-homed, wajib menambahkan **Site of Origin (SoO)** per situs, karena as-override menghilangkan deteksi loop AS_PATH sehingga rute situs bisa kembali ke situs itu lewat PE lain.

5. Dua RT: `RT-HUB` (misalnya `65000:3000`) dan `RT-SPOKE` (`65000:3001`). Setiap VRF cabang: **export RT-SPOKE, import RT-HUB**. Di PE1: **VRF HUB-IN import RT-SPOKE** (menerima rute semua cabang, diarahkan ke firewall lewat link 1) dan **VRF HUB-OUT export RT-HUB** (menerima dari firewall lewat link 2 rute cabang atau ringkasan/default, lalu mengekspornya ke cabang). Cabang tidak mengimpor RT-SPOKE, jadi tidak pernah punya rute langsung ke cabang lain. Satu-satunya jalurnya adalah lewat rute dari hub. PE kantor pusat butuh **dua VRF** karena rute "masuk ke firewall" dan rute "keluar dari firewall" harus berada di tabel berbeda. Jika satu VRF, PE1 akan langsung meneruskan trafik cabang ke cabang lain (rute spoke ada di VRF yang sama) tanpa lewat firewall.

6. Dengan RD sama, PE3 dan PE4 mengiklankan **prefix VPNv4 yang identik** (`65000:500:<prefix>`). Setiap RR menjalankan best path dan hanya memantulkan **satu** jalur (misalnya lewat PE3). PE lain tidak tahu ada jalur lewat PE4. Saat PE3 mati, RR harus mendeteksi kegagalan (sesi BGP timeout atau next hop hilang dari IGP), menghitung ulang, lalu mengirim update jalur PE4 ke semua PE. Itu butuh waktu. Perbaikan: **RD unik per PE** (misalnya `10.255.0.3:500` dan `10.255.0.4:500`), sehingga keduanya menjadi prefix berbeda dan RR memantulkan keduanya. PE lain sudah punya jalur cadangan dan bisa beralih segera saat next hop PE3 hilang (dipercepat lagi dengan BGP PIC dan BFD, 22.5). Alternatif lain: BGP Add-Path di RR.

7. Rute lewat link microwave dipelajari sebagai **intra-area** (LSA tipe 1/2 di area 0), sedangkan rute lewat VPN diredistribusikan PE sebagai **inter-area** (tipe 3, jika domain ID cocok) atau external. OSPF selalu memilih intra-area di atas inter-area, **tanpa melihat metrik**. Maka microwave 10 Mbps menang. Solusi: **sham-link** antara PE Jakarta dan PE Bandung di VRF pelanggan D. Sham-link adalah link intra-area logis di atas backbone MPLS, sehingga rute lewat VPN juga intra-area dan pemilihan kembali berdasarkan metrik. Beri link microwave metrik tinggi (cost besar) agar hanya dipakai saat VPN gagal. Endpoint sham-link (/32 di VRF) harus diiklankan lewat MP-BGP, bukan OSPF.

8. **Option A** (back-to-back VRF): tidak ada label atau loopback yang melintas batas, setiap VPN punya subinterface sendiri sehingga QoS, ACL, dan policing per VPN mudah. Ini cocok untuk dua operator yang tidak ingin saling mempercayai lebih jauh dan jumlah VPN-nya sedikit (15). Konsekuensi jika tumbuh ke 400: setiap ASBR harus punya **400 VRF, 400 subinterface/VLAN, dan 400 sesi eBGP**, menambah beban konfigurasi, memori, dan risiko salah konfigurasi. Pada titik itu, **Option B** (eBGP VPNv4 berlabel antar-ASBR) menjadi lebih layak, dengan konsekuensi kebijakan per VPN di batas lebih sulit dan ASBR menyimpan rute VPNv4 semua VPN bersama. Option C kurang cocok karena mensyaratkan pertukaran loopback PE dan kepercayaan tinggi.

9. Di lab (FRR 10.4.1), rute VRF CUST-B dari pe1 **tetap diekspor** ke VPNv4, tetapi tanpa label VPN yang sah: FRR mengiklankannya dengan **label 3 (implicit null)**. (Dokumentasi FRR menyebut ekspor tanpa label tidak selesai. Perilaku yang teramati berbeda, dan justru lebih menyesatkan.) pe2 memasang rute di VRF CUST-B dengan tumpukan label `16/implicit-null`, artinya hanya label transport. p1 melakukan PHP, dan paket tiba di pe1 sebagai IP polos tanpa label VPN. pe1 tidak tahu paket itu milik VRF mana, mencarinya di tabel global, tidak menemukan `192.168.1.0/24`, lalu membuangnya. Akibatnya trafik ce2b ke ce1b gagal, dan ping ce1b ke ce2b juga gagal karena balasannya hilang. Pelanggan A tidak terpengaruh. Pelajarannya: tabel VPNv4 dan VRF yang "lengkap" belum menjamin layanan jalan; periksa **nilai** label VPN (`Remote label`) dan tumpukan label di rute VRF.

10. Contoh urutan (PE Makassar = PE-MKS, kantor pusat di PE-JKT):
    1. **Rute dari CE Makassar masuk VRF?** `show bgp vpnv4 unicast vrf E summary` (PfxRcd > 0) dan `show ip route vrf E` di PE-MKS.
    2. **Rute diekspor ke VPNv4 dengan RT benar?** `show bgp vpnv4 unicast rd <RD-MKS> <prefix-cabang>`: periksa RT, label, dan status `best`.
    3. **Sesi VPNv4 benar-benar bertukar rute?** `show bgp vpnv4 unicast all summary` di PE-MKS (PfxRcd dari RR, bukan hanya Established). Periksa juga `show bgp vpnv4 unicast all neighbors <RR> advertised-routes`.
    4. **Rute kantor pusat ada di PE-MKS?** `show bgp vpnv4 unicast all <prefix-pusat>`. Jika ada di VPNv4 tetapi tidak di VRF: periksa RT impor (`show vrf detail E`). Jika tidak ada: periksa di RR dan di PE-JKT.
    5. **Next hop punya LSP?** `show mpls forwarding-table <loopback-PE-JKT> 32` dan `ping mpls ipv4 <loopback-PE-JKT>/32 source <loopback-PE-MKS>`. Ulangi dari PE-JKT ke PE-MKS (arah balik).
    6. **CEF dan label VPN benar?** `show ip cef vrf E <alamat-pusat> detail`: harus ada dua label. Bandingkan label VPN dengan yang dialokasikan PE-JKT (`show bgp vpnv4 unicast all labels` di PE-JKT).
    7. **Rute dikirim ke CE Makassar dan diterima?** `show bgp vpnv4 unicast vrf E neighbors <CE> advertised-routes`, dan di CE: periksa AS loop (as-override?) dan filter.
    8. **Dataplane dan MTU:** `ping vrf E <alamat-pusat> source <interface-PE-CE> size 1500 df-bit`. Jika ukuran kecil berhasil tetapi besar gagal, periksa MTU di jalur ke Makassar (sering melewati media berbeda, misalnya microwave atau satelit).
    Karena cabang lain normal, fokuskan pada hal yang unik di Makassar: RT/VRF di PE-MKS, LSP ke dan dari PE-MKS, serta link transmisi di jalurnya.

</details>

---

## 17. Sumber

- RFC 4364, BGP/MPLS IP Virtual Private Networks (VPNs): https://www.rfc-editor.org/rfc/rfc4364
- RFC 4360, BGP Extended Communities Attribute: https://www.rfc-editor.org/rfc/rfc4360
- RFC 4760, Multiprotocol Extensions for BGP-4: https://www.rfc-editor.org/rfc/rfc4760
- RFC 4659, BGP-MPLS IP VPN Extension for IPv6 VPN: https://www.rfc-editor.org/rfc/rfc4659
- RFC 4577, OSPF as the PE/CE Protocol for BGP/MPLS IP VPNs: https://www.rfc-editor.org/rfc/rfc4577
- RFC 4684, Constrained Route Distribution for BGP/MPLS IP VPNs: https://www.rfc-editor.org/rfc/rfc4684
- RFC 8277, Using BGP to Bind MPLS Labels to Address Prefixes: https://www.rfc-editor.org/rfc/rfc8277
- RFC 5443, LDP IGP Synchronization: https://www.rfc-editor.org/rfc/rfc5443
- Peterson dan Davie, Computer Networks: A Systems Approach, bagian 4.4.3 Virtual Private Networks and Tunnels (CC BY 4.0): https://book.systemsapproach.org/scaling/mpls.html
- Dokumentasi FRRouting, BGP (L3VPN VRFs dan VRF Route Leaking): https://docs.frrouting.org/en/latest/bgp.html
- Cisco, MPLS: Layer 3 VPNs Configuration Guide (IOS XE): https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/mp_l3_vpns/configuration/xe-16/mp-l3-vpns-xe-16-book.html
- Juniper, Layer 3 VPNs User Guide: https://www.juniper.net/documentation/us/en/software/junos/vpn-l3/index.html
- Manual MikroTik RouterOS, `/routing/bgp/vpn`: https://manual.mikrotik.com/docs/cli-reference/routing/bgp/vpn
- Manual MikroTik RouterOS, `/ip/vrf`: https://manual.mikrotik.com/docs/cli-reference/ip/vrf
- Manual MikroTik RouterOS, MPLS (daftar fitur dan keterbatasan): https://manual.mikrotik.com/docs/user-guides/routing-and-networking-protocols/mpls/
- Containerlab: https://containerlab.dev

---

**Berikutnya:** `22-service-provider/03-te-segment-routing`. Memilih jalur selain jalur terpendek IGP: RSVP-TE, Segment Routing, TI-LFA, dan Flex-Algo.

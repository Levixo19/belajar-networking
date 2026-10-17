# 19.9 MPLS di RouterOS (MTCINE)

> **Prasyarat:** `19-mikrotik/08-routing-v7` (OSPF, BGP instance, VRF di v7), `22-service-provider/01-mpls-ldp` (label, LDP, PHP), `22-service-provider/02-mpls-l3vpn` (RD, RT, VPNv4), `22-service-provider/04-l2vpn-carrier-ethernet` (pseudowire, VPLS)
> **Tujuan:** Anda bisa membangun backbone MPLS dengan RouterOS v7: LDP dan filter label, L3VPN dengan VRF dan BGP VPNv4 (PE-CE eBGP dan OSPF, alamat pelanggan tumpang tindih), VPLS bersinyal LDP maupun BGP, tunnel RSVP-TE, menghitung MTU MPLS dengan benar, merancang backbone ISP kecil di Indonesia dengan perangkat MikroTik, memahami batas CCR dan CHR, serta mendiagnosis gangguan MPLS secara sistematis.

---

## 1. Posisi Modul Ini

Konsep MPLS sudah dibahas tuntas di Tahap 22: format label, LIB dan LFIB, PHP, dan LDP di `22-service-provider/01-mpls-ldp`; RD, RT, dan VPNv4 di `22-service-provider/02-mpls-l3vpn`; pseudowire dan VPLS di `22-service-provider/04-l2vpn-carrier-ethernet`. Modul ini tidak mengulanginya. Fokusnya adalah **cara RouterOS v7 mengimplementasikan semua itu**, jebakan yang khas MikroTik, dan desain yang masuk akal untuk ISP lokal yang backbone-nya MikroTik.

Outline resmi MTCINE (MikroTik Certified Inter-Networking Engineer) terakhir disunting Februari 2012, jauh sebelum RouterOS v7. Isinya: BGP (sudah dibahas di `19-mikrotik/08-routing-v7`), MPLS (static label, LDP, PHP, traceroute MPLS, VPLS LDP dan BGP, split horizon, control word, L2MTU, VRF dan route leaking, L3VPN, OSPF sebagai protokol CE-PE), serta traffic engineering (RSVP, path statis dan dinamis dengan CSPF, alokasi bandwidth). Semua topik itu dibahas di sini dengan sintaks v7.

Semua konfigurasi dan keluaran di modul ini diuji pada **CHR RouterOS 7.24.5**. Bagian BGP memakai menu `/routing bgp instance` yang baru ada sejak 7.20.

### Apa yang didukung dan tidak didukung RouterOS

Halaman MPLS Overview di dokumentasi resmi mendaftar fitur yang didukung: penerusan MPLS dengan PHP, label statis, LDP (RFC 5036 dan RFC 7552 untuk IPv6) dengan mode *downstream unsolicited*, *independent control*, dan *liberal retention*, sesi targeted, ECMP, VPLS bersinyal LDP (RFC 4762) dan BGP (RFC 4761), pseudowire statis gaya Cisco, fragmentasi pseudowire (RFC 4623), tunnel RSVP-TE dengan jalur eksplisit dan CSPF, L3VPN dengan MP-BGP, serta OSPF dan RIP sebagai protokol CE-PE.

Halaman yang sama juga menyebut apa yang **belum** ada:

- LDP: mode *downstream on demand*, *ordered control*, dan *conservative retention*.
- TE: fast reroute (proteksi link dan node).
- BGP sebagai protokol distribusi label (BGP labeled unicast).

Dokumentasi MPLS resmi juga tidak mencantumkan Segment Routing. Jadi jika desain Anda butuh TI-LFA, SR-TE, atau RSVP FRR (lihat `22-service-provider/03-te-segment-routing`), MikroTik bukan pilihan untuk peran P atau PE di jalur itu. Untuk ISP lokal yang butuh L3VPN, VPLS, dan sedikit rekayasa lalu lintas, fitur yang ada sudah mencukupi.

> [!WARNING]
> MPLS tidak didukung pada perangkat berarsitektur SMIPS (hAP lite, hAP lite TC, hAP mini). Periksa arsitektur perangkat sebelum merencanakan.

---

## 2. Fondasi: Loopback, IGP, dan MTU

MPLS di RouterOS mengikuti urutan yang sama dengan vendor lain: IP routing harus benar dulu, baru label.

### Loopback dan IGP

LDP mendistribusikan label untuk rute IGP yang aktif (connected, static, OSPF), bukan untuk rute BGP. Setiap router MPLS butuh loopback /32 yang diiklankan IGP. Dokumentasi resmi memberi dua alasan: sesi LDP antara dua router cukup satu walau link-nya banyak, sehingga loopback membuat sesi tidak terpengaruh status satu interface; dan loopback sebagai alamat transport memastikan PHP bekerja benar saat paket membawa lebih dari satu label (seperti VPLS dan L3VPN).

```
/ip address add address=10.255.255.2/32 interface=lo comment="loopback P1 (LSR-ID)"
/routing ospf instance add name=ospf-core version=2 router-id=10.255.255.2
/routing ospf area add name=backbone area-id=0.0.0.0 instance=ospf-core
/routing ospf interface-template
add area=backbone interfaces=ether2,ether3 type=ptp cost=10
add area=backbone networks=10.255.255.2/32 passive
```

Interface `lo` tersedia sejak 7.14. Di versi lebih lama, buat bridge kosong sebagai loopback.

### Empat jenis MTU di RouterOS

RouterOS membedakan empat MTU, dan memahami bedanya adalah separuh dari troubleshooting MPLS:

| Jenis | Diatur di | Arti |
|---|---|---|
| L3 MTU | `/interface ... mtu=` | Ukuran paket IP maksimum |
| MPLS MTU (L2.5) | `/mpls interface ... mpls-mtu=` | Ukuran paket termasuk label MPLS |
| L2MTU | `/interface ... l2mtu=` (jika didukung) | Ukuran frame tanpa header MAC |
| Full frame | (hasil) | Frame yang benar-benar dikirim |

Aturan pemilihan MPLS MTU di sebuah interface, menurut dokumentasi resmi: jika interface cocok dengan entri `/mpls interface`, pakai nilai `mpls-mtu` di situ; jika tidak ada entri, MPLS MTU = L2MTU; jika interface tidak punya L2MTU, MPLS MTU = L3 MTU. Pada ingress, MTU efektif adalah min(MPLS MTU dikurangi ukuran label, L3 MTU).

### Kasus CHR: tidak ada L2MTU

Interface virtio pada CHR tidak melaporkan L2MTU. Saat pengujian, `/interface ethernet print detail` di CHR 7.24.5 hanya menampilkan `mtu=1500`, tanpa `l2mtu`. Akibatnya MPLS MTU sama dengan L3 MTU, dan dengan MTU 1500 di link inti, paket IP pelanggan yang dibungkus dua label (8 byte) hanya boleh berukuran 1492 byte.

Hasil pengujian di lab §9 dengan MTU inti 1500:

```
[admin@CE-A1] > /ping 192.168.2.1 src-address=192.168.1.1 count=3 size=1500 do-not-fragment
  SEQ HOST                                     SIZE TTL TIME       STATUS
    0 172.16.11.1                               576  64 243us      fragmentation needed
[admin@CE-A1] > /ping 192.168.2.1 src-address=192.168.1.1 count=3 size=1490 do-not-fragment
    0 192.168.2.1                              1490  62 691us
    sent=3 received=3 packet-loss=0%
```

PE1 (172.16.11.1) mengirim ICMP *fragmentation needed* untuk paket 1500 byte. Ini perilaku yang terdokumentasi: pada ingress IP, jika paket plus label melebihi MPLS MTU, router memfragmentasi atau, jika bit DF terpasang, mengirim ICMP. Di tengah jaringan pelanggan, ICMP ini sering diblokir firewall, sehingga gejala yang terlihat adalah "web tertentu tidak bisa dibuka" atau "VPN pelanggan putus-putus".

Solusi di lab: naikkan L3 MTU link inti menjadi 1530 di kedua sisi.

```
/interface ethernet set [find default-name=ether2] mtu=1530
```

Setelah itu paket 1500 byte dengan DF lewat tanpa masalah. Di perangkat fisik RouterBOARD yang mendukung L2MTU, cara yang lebih bersih adalah menaikkan `l2mtu` lalu (bila perlu) mengatur `/mpls interface add interface=ether2 mpls-mtu=1530`. Tabel `max-l2mtu` per model ada di dokumentasi "MTU in RouterOS"; semua interface wireless RouterOS mendukung L2MTU 2290.

### Menghitung kebutuhan MTU

| Layanan | Overhead di atas payload pelanggan | MPLS MTU minimum untuk payload 1500 |
|---|---|---|
| IP biasa lewat LDP (1 label) | 4 | 1504 |
| L3VPN (label transport + label VPN) | 8 | 1508 |
| VPLS (Ethernet 14 + 2 label + control word 4) | 26 | 1526 |
| VPLS dengan frame pelanggan ber-VLAN | 30 | 1530 |
| VPLS di atas tunnel TE dengan label tambahan | +4 per label | (hitung ulang) |

> [!TIP]
> Tetapkan MPLS MTU yang **sama** di semua router dalam awan MPLS, dan pilih nilai terkecil yang didukung semua link (termasuk link wireless dan switch di tengah jalan). Dokumentasi resmi menekankan hal ini karena MTU yang berbeda membuat paket di-drop di tengah LSP tanpa jejak.

> [!WARNING]
> Perilaku saat paket terlalu besar berbeda menurut posisinya. Di tengah LSP (router P), jika paket berlabel melebihi MPLS MTU dan isinya IP, router mengirim ICMP yang diteruskan sampai ujung LSP. Jika isinya bukan IP (misalnya frame Ethernet VPLS), paket langsung dibuang. Pada ingress VPLS, RouterOS memfragmentasi frame dengan control word agar sesuai MPLS MTU, lalu menyatukannya kembali di ujung pseudowire. Dalam pengujian, ping 1472 byte dengan DF lewat VPLS tetap berhasil walau MTU inti 1500, karena mekanisme fragmentasi ini. Fragmentasi menambah beban CPU dan, menurut dokumentasi, fragmen yang datang tidak berurutan dibuang. Jangan mengandalkannya sebagai desain.

### Pengaturan MPLS global

```
[admin@PE1] > /mpls settings print
     dynamic-label-range: 16-1048575
           propagate-ttl: yes
         allow-fast-path: yes
```

- `dynamic-label-range`: rentang label untuk LDP, VPN, dan VPLS. Kecilkan jika Anda memakai label statis, agar tidak bertabrakan.
- `propagate-ttl=no` menyembunyikan hop di dalam awan MPLS dari traceroute pelanggan.
- `allow-fast-path`: MPLS FastPath. Menurut changelog, FastPath untuk MPLS ditambahkan di 7.10 dan untuk VPLS di 7.17.

---

## 3. LDP di RouterOS v7

### Konfigurasi

Di v6, LDP diaktifkan dengan `/mpls ldp set enabled=yes`. Di v7, LDP adalah entri (instance) yang Anda tambahkan, satu per VRF:

```
/mpls ldp
add afi=ip lsr-id=10.255.255.2 transport-addresses=10.255.255.2
/mpls ldp interface
add interface=ether2
add interface=ether3
```

- `lsr-id`: identitas router, biasanya loopback.
- `transport-addresses`: alamat sumber sesi TCP LDP dan alamat yang diiklankan ke tetangga. Selalu loopback.
- `afi=ip` (atau `ip,ipv6` untuk dual-stack dengan `preferred-afi`).
- `/mpls ldp interface`: hanya interface ke router MPLS lain. Jangan aktifkan LDP di interface ke pelanggan.

### Membatasi label hanya untuk loopback

Secara default LDP membuat label untuk semua rute IGP. Di backbone yang hanya menyediakan layanan VPN, satu-satunya label yang berguna adalah label menuju loopback PE. Dokumentasi resmi menganjurkan filter iklan:

```
/mpls ldp advertise-filter
add prefix=10.255.255.0/24 advertise=yes comment="label hanya untuk loopback"
add prefix=0.0.0.0/0 advertise=no
```

Baris kedua wajib, karena tanpa aturan yang cocok, perilaku default-nya mengizinkan. Ada juga `/mpls ldp accept-filter` dengan logika yang sama untuk sisi terima. Perubahan filter tidak memengaruhi mapping yang sudah ada; reset sesi LDP (nonaktifkan lalu aktifkan entri `/mpls ldp`) agar filter berlaku.

> [!TIP]
> Di lab, filter ini juga mencegah label untuk jaringan manajemen 10.0.2.0/24 yang ada di setiap CHR. Tanpa filter, alamat itu muncul di daftar alamat tetangga LDP dan label-nya ikut didistribusikan.

### Verifikasi

Tetangga LDP di P1:

```
[admin@P1] > /mpls ldp neighbor print
Flags: D - DYNAMIC; O - OPERATIONAL; p - PASSIVE
#     TRANSPORT     LOCAL-TRANSPORT  PEER            ADDRESSES
0 DO  10.255.255.1  10.255.255.2     10.255.255.1:0  10.1.12.1
                                                     10.255.255.1
1 DOp 10.255.255.3  10.255.255.2     10.255.255.3:0  10.1.23.2
                                                     10.255.255.3
```

Flag `O` berarti sesi operasional. `p` menandakan router ini berperan pasif dalam pembentukan sesi (yang alamat transport-nya lebih kecil). Format `PEER` adalah LSR-ID dan ruang label (`:0` untuk ruang label per platform).

Label lokal (LIB, sisi yang kita iklankan):

```
[admin@P1] > /mpls ldp local-mapping print
Flags: I - INACTIVE; D - DYNAMIC; E - EGRESS; G - GATEWAY; L - LOCAL
#       VRF   DST-ADDRESS   LABEL      PEERS
0  D G  main  10.255.255.1  16         10.255.255.1:0
                                       10.255.255.3:0
1 IDE L main  10.255.255.2  impl-null  10.255.255.1:0
                                       10.255.255.3:0
2  D G  main  10.255.255.3  17         10.255.255.1:0
                                       10.255.255.3:0
```

Untuk loopback sendiri, P1 mengiklankan `impl-null` (label 3), yaitu permintaan PHP: router sebelumnya diminta melepas label sebelum mengirim ke P1. Entri ini bertanda `E` (egress).

Label dari tetangga:

```
[admin@P1] > /mpls ldp remote-mapping print
Flags: I - INACTIVE; D - DYNAMIC
#    VRF   DST-ADDRESS   NEXTHOP    LABEL      PEER
0 ID main  10.255.255.2             35         10.255.255.1:0
1  D main  10.255.255.1  10.1.12.1  impl-null  10.255.255.1:0
2 ID main  10.255.255.3             36         10.255.255.1:0
5  D main  10.255.255.3  10.1.23.2  impl-null  10.255.255.3:0
```

Ini *liberal retention* dalam praktik: P1 menyimpan label dari semua tetangga, tetapi hanya yang datang dari next-hop IGP yang aktif (tanpa `I`).

Tabel penerusan (LFIB) di PE1:

```
[admin@PE1] > /mpls forwarding-table print
Flags: L - LDP, P - VPN, V - VPLS
#   LABEL  VRF          PREFIX
0 P    33  pelanggan-a
1 P    34  pelanggan-b
2 L    35  main         10.255.255.2
3 L    36  main         10.255.255.3
4 V    19
5 V    16
```

Di satu tabel Anda melihat ketiga jenis label: `L` dari LDP, `P` label VPN per VRF (L3VPN), dan `V` label pseudowire VPLS. `print detail` menampilkan label keluar dan next-hop, misalnya `prefix=10.255.255.3 nexthops={ label=17; nh=10.1.12.2; interface=ether2 }`.

### Traceroute di jaringan MPLS

RouterOS menampilkan stack label dari ICMP extension (RFC 4950):

```
[admin@PE1] > /tool traceroute 10.255.255.3 src-address=10.255.255.1 count=1
#  ADDRESS       LOSS  SENT  LAST     STATUS
0  10.1.12.2     0%       1  0.4ms    <MPLS:L=17,E=0>
1  10.255.255.3  0%       1  0.2ms
```

Hop pertama (P1) menerima paket berlabel 17, label yang diiklankan P1 untuk 10.255.255.3. Hop terakhir tidak menampilkan label karena P1 melakukan PHP.

Dua hal yang perlu diingat saat membaca traceroute MPLS:

- ICMP yang dibuat router P tidak dirutekan langsung ke pengirim, tetapi diteruskan sampai ujung LSP lalu dikembalikan. Jika LSP putus di tengah, tidak ada balasan dari hop mana pun, sehingga traceroute tidak bisa menunjuk titik putusnya.
- Traceroute dari CE ke CE lewat L3VPN akan menampilkan hop P sebagai timeout atau tanpa alamat, karena P tidak punya rute ke alamat pelanggan. Ini normal.

Pakai `src-address=` loopback saat melakukan traceroute dari router. Dokumentasi resmi memberi contoh kasus ketika alamat sumber default (alamat interface) membuat balasan ICMP terkena PHP di router yang salah dan dibuang.

### Label statis

Untuk keperluan uji atau interoperabilitas khusus, label bisa dipetakan manual di `/mpls local-mapping` dan `/mpls remote-mapping`. Kecilkan `dynamic-label-range` lebih dulu agar label statis tidak bentrok dengan label dinamis. Dalam operasi normal ISP, label statis jarang dipakai karena tidak bereaksi terhadap perubahan topologi.

---

## 4. L3VPN: VRF dan BGP VPNv4 di v7

### Pemetaan konsep ke menu RouterOS

| Konsep (lihat `22-service-provider/02-mpls-l3vpn`) | Menu RouterOS v7 |
|---|---|
| VRF di PE | `/ip vrf add name=... interfaces=...` |
| RD, RT impor/ekspor, label per-VRF | `/routing bgp vpn add vrf=... route-distinguisher=... import.route-targets=... export.route-targets=... label-allocation-policy=...` |
| Rute apa yang diekspor dari VRF ke VPNv4 | `export.redistribute=connected,static,bgp,ospf` |
| MP-iBGP antar-PE | `/routing bgp connection ... afi=vpnv4` |
| PE-CE eBGP | `/routing bgp connection ... vrf=...` |
| Transport label | LDP (atau RSVP-TE) di backbone |

### Konfigurasi PE1 (dari lab)

```
/ip vrf
add name=pelanggan-a interfaces=ether3
add name=pelanggan-b interfaces=b-lan
/ip address
add address=172.16.11.1/30 interface=ether3 comment="PE-CE ke CE-A1"
add address=192.168.1.1/24 interface=b-lan comment="sengaja sama dengan LAN CE-A1"

/routing bgp instance
add name=bgp-sp as=65000 router-id=10.255.255.1
/routing bgp connection
add name=ibgp-pe2 instance=bgp-sp remote.address=10.255.255.3 remote.as=65000 \
    local.address=10.255.255.1 local.role=ibgp afi=vpnv4,l2vpn
add name=ce-a1 instance=bgp-sp vrf=pelanggan-a remote.address=172.16.11.2 \
    remote.as=65100 local.role=ebgp output.as-override=yes \
    output.redistribute=bgp-mpls-vpn
/routing bgp vpn
add name=vpn-a instance=bgp-sp vrf=pelanggan-a route-distinguisher=10.255.255.1:100 \
    import.route-targets=65000:100 export.route-targets=65000:100 \
    export.redistribute=connected,bgp label-allocation-policy=per-vrf
add name=vpn-b instance=bgp-sp vrf=pelanggan-b route-distinguisher=10.255.255.1:200 \
    import.route-targets=65000:200 export.route-targets=65000:200 \
    export.redistribute=connected label-allocation-policy=per-vrf
```

Penjelasan bagian demi bagian:

- **RD per PE per VRF** (`10.255.255.1:100` di PE1, `10.255.255.3:100` di PE2). Dokumentasi VRF resmi menunjukkan alasannya: dengan RD yang sama di semua situs, dua situs yang mengiklankan prefiks sama dianggap satu tujuan dan hanya satu yang dipilih, sehingga konvergensi saat gagal lebih lambat. Dengan RD unik per situs, keduanya diimpor dan perpindahan terjadi seketika.
- **RT per pelanggan** (`65000:100` untuk A, `65000:200` untuk B). RT-lah yang menentukan VRF mana mengimpor rute mana.
- `label-allocation-policy=per-vrf`: satu label VPN untuk seluruh VRF (hemat label; PE egress melakukan lookup IP di VRF). Alternatifnya `per-prefix`.
- `export.redistribute`: hanya jenis rute yang disebut yang masuk VPNv4. Lupa menambahkan `bgp` berarti rute dari CE (lewat eBGP) tidak pernah sampai ke situs lain.
- `afi=vpnv4,l2vpn` di sesi iBGP: satu sesi membawa L3VPN dan VPLS BGP (§5). Sebelum 7.19, parameternya bernama `address-families`.
- **PE-CE eBGP di VRF**: connection biasa dengan `vrf=pelanggan-a`.

Dua parameter di connection PE-CE itu terbukti wajib saat pengujian:

> [!WARNING]
> **`output.redistribute=bgp-mpls-vpn` diperlukan agar PE mengirim rute VPN ke CE.** Rute yang diimpor dari VPNv4 bertanda `y` (BGP-MPLS-VPN), bukan `b` (BGP). Saat parameter ini dihapus dari connection `ce-a2` di PE2, CE-A2 tidak menerima satu rute BGP pun, walaupun sesi tetap established.

> [!WARNING]
> **`output.as-override=yes` diperlukan jika semua situs pelanggan memakai AS yang sama.** CE-A1 dan CE-A2 sama-sama AS 65100. Tanpa as-override, CE-A2 melihat AS 65100 di AS-path rute 192.168.1.0/24 dan menolaknya sebagai loop. Dengan as-override, PE mengganti AS pelanggan dengan AS provider, sehingga CE-A2 menerima `as-path="65000,65000"`. Alternatif yang sama sahnya: beri setiap situs AS privat berbeda, atau di sisi CE pakai `input.allow-as=1`.

### Verifikasi L3VPN

Rute VPNv4 di PE1 (perhatikan format `prefiks&RD`):

```
[admin@PE1] > /routing route print where afi=vpnv4
Flags: A - ACTIVE; b - BGP, y - BGP-MPLS-VPN
   DST-ADDRESS                      GATEWAY                  AFI    ROUT  DIS
Ay 172.16.11.0/30&10.255.255.1:100  ether3@pelanggan-a       vpnv4  main  200
Ay 192.168.1.0/24&10.255.255.1:100  172.16.11.2@pelanggan-a  vpnv4  main  200
Ay 192.168.1.0/24&10.255.255.1:200  b-lan@pelanggan-b        vpnv4  main  200
Ab 172.16.12.0/30&10.255.255.3:100  10.255.255.3             vpnv4  main  200
Ab 192.168.2.0/24&10.255.255.3:100  10.255.255.3             vpnv4  main  200
Ab 192.168.2.0/24&10.255.255.3:200  10.255.255.3             vpnv4  main  200
```

Prefiks 192.168.1.0/24 muncul dua kali dengan RD berbeda: milik pelanggan A (lewat CE-A1) dan milik pelanggan B (langsung di PE1). Inilah fungsi RD.

Tabel VRF:

```
[admin@PE1] > /ip route print where routing-table=pelanggan-a || routing-table=pelanggan-b
    DST-ADDRESS     GATEWAY                  ROUTING-TABLE  DISTANCE
DAc 172.16.11.0/30  ether3@pelanggan-a       pelanggan-a           0
DAy 172.16.12.0/30  10.255.255.3             pelanggan-a         200
DAb 192.168.1.0/24  172.16.11.2@pelanggan-a  pelanggan-a          20
DAy 192.168.2.0/24  10.255.255.3             pelanggan-a         200
DAc 192.168.1.0/24  b-lan@pelanggan-b        pelanggan-b           0
DAy 192.168.2.0/24  10.255.255.3             pelanggan-b         200
```

`/routing route print detail` untuk rute bertanda `y` menampilkan label VPN (`label=33`), RD asal, dan `immediate-gw` yang berarti label transport LDP sudah terpasang.

Dari sisi pelanggan:

```
[admin@CE-A1] > /ping 192.168.2.1 src-address=192.168.1.1 count=3
    0 192.168.2.1                                56  62 801us
    sent=3 received=3 packet-loss=0%
```

> [!TIP]
> **Ping dari PE ke dalam VRF: selalu isi `src-address`.** Dalam pengujian, `/ping 192.168.2.1 vrf=pelanggan-b` dari PE1 gagal, sedangkan `/ping 192.168.2.1 vrf=pelanggan-b src-address=192.168.1.1` berhasil. Tanpa alamat sumber eksplisit, router memilih alamat yang tidak diekspor ke VPN, sehingga balasan tidak punya jalan pulang.

### Menyembunyikan route target dari pelanggan

Rute yang diterima CE-A1 dari PE membawa extended community `rt:65000:100`. Itu informasi internal provider. Hapus sebelum dikirim ke CE:

```
/routing filter rule add chain=ke-ce rule="delete bgp-ext-communities rt; accept"
/routing bgp connection set [find name=ce-a1] output.filter-chain=ke-ce
```

Setelah filter dipasang, `/routing route print detail` di CE-A1 tidak lagi menampilkan `.ext-communities`.

### OSPF sebagai protokol PE-CE

Outline MTCINE memasukkan OSPF sebagai CE-PE. Di v7 caranya: instance OSPF dengan `vrf=`, redistribusi rute VPN ke OSPF, dan redistribusi OSPF ke VPN. Diuji di lab (CE-A1 punya jaringan tambahan 10.99.1.0/24 yang diiklankan lewat OSPF):

```
# di PE1
/routing ospf instance
add name=ospf-pa version=2 vrf=pelanggan-a router-id=172.16.11.1 redistribute=bgp-mpls-vpn
/routing ospf area
add name=pa-backbone area-id=0.0.0.0 instance=ospf-pa
/routing ospf interface-template
add area=pa-backbone interfaces=ether3 type=ptp
/routing bgp vpn set [find name=vpn-a] export.redistribute=connected,bgp,ospf
```

Hasil: PE1 belajar 10.99.1.0/24 dari CE-A1 lewat OSPF di VRF, mengekspornya ke VPNv4, dan CE-A2 menerimanya lewat BGP. Ke arah CE-A1, rute VPN dari situs lain muncul sebagai LSA eksternal tipe 1 di instance `ospf-pa`. Instance OSPF di VRF punya parameter `domain-id` dan `use-dn` untuk perilaku RFC 4577 (penandaan domain dan bit DN untuk mencegah loop pada pelanggan multihomed); periksa dokumentasi OSPF versi Anda sebelum mengandalkannya di pelanggan dengan banyak PE.

> [!WARNING]
> Saat pengujian, RouterOS mengizinkan dua instance OSPF dengan **nama yang sama**. Menghapus salah satunya ternyata menghancurkan instance yang sedang dipakai area. Beri nama unik dan periksa `/routing ospf instance print` sebelum mengubah apa pun.

### Akses internet untuk pelanggan VRF

Pola yang lazim di ISP lokal: pelanggan korporat mendapat VPN antar-cabang sekaligus internet. Salah satu cara sederhana adalah default route di VRF yang gateway-nya dicari di tabel main, ditambah rute balik ke prefiks pelanggan di main (lihat leaking di `19-mikrotik/08-routing-v7` §8):

```
/ip route add dst-address=0.0.0.0/0 gateway=10.1.12.2@main routing-table=pelanggan-a
```

Prefiks pelanggan yang memakai alamat privat tetap butuh NAT di titik keluar internet. Untuk banyak pelanggan, cara yang lebih rapi adalah VRF "internet" terpisah dengan route target bersama (desain hub-and-spoke dengan RT), seperti dibahas di `22-service-provider/02-mpls-l3vpn`.

---

## 5. VPLS di RouterOS v7

VPLS membuat beberapa situs pelanggan berada di satu segmen Ethernet. Di RouterOS, setiap pseudowire VPLS adalah interface (`/interface vpls`) yang Anda masukkan ke bridge bersama port pelanggan. Data diteruskan dengan dua label: label transport ke PE tujuan dan label pseudowire.

### VPLS bersinyal LDP (RFC 4762)

```
/interface bridge add name=br-vpls-c protocol-mode=none comment="VPLS LDP pelanggan C"
/interface vpls
add name=vpls-c-pe2 peer=10.255.255.3 vpls-id=65000:300 disabled=no
/interface bridge port
add bridge=br-vpls-c interface=ether4
add bridge=br-vpls-c interface=vpls-c-pe2 horizon=1
```

- `peer`: loopback PE di ujung lain. RouterOS membentuk sesi LDP targeted ke alamat itu secara otomatis (terlihat sebagai flag `t` dan `v` di `/mpls ldp neighbor print`).
- `vpls-id`: pengenal VPLS, format `AS:angka` atau `IP:angka`, harus sama di kedua ujung.
- `disabled=no`: interface VPLS baru **disabled secara default**. Lupa baris ini adalah kesalahan pertama yang dibuat hampir semua orang.
- `horizon=1` pada port bridge: split horizon. Frame yang masuk dari port dengan horizon 1 tidak diteruskan ke port lain dengan horizon 1. Dalam VPLS full mesh dengan tiga PE atau lebih, ini mencegah loop: frame dari PE2 tidak dikirim balik ke PE3 oleh PE1. Port pelanggan tidak diberi horizon.
- `protocol-mode=none`: STP pada bridge VPLS biasanya tidak diinginkan. Pertimbangkan sesuai kebutuhan pelanggan.
- Untuk N PE, setiap PE butuh N-1 interface VPLS. Inilah alasan VPLS BGP (di bawah) lebih praktis untuk banyak situs.

Parameter lain: `pw-type` (`raw-ethernet` default, `tagged-ethernet`, `vpls`), `pw-control-word` (`default`, `enabled`, `disabled`), `pw-l2mtu` (MTU yang diiklankan, default 1500), `cisco-static-id` untuk pseudowire statis gaya Cisco. RFC 4447 mensyaratkan MTU pseudowire sama di kedua ujung agar PW bisa naik, jadi samakan `pw-l2mtu`.

Verifikasi:

```
[admin@PE1] > /interface vpls monitor vpls-c-pe2 once
   remote-label: 16
    local-label: 16
  remote-status:
       nexthops: { label=17; nh=10.1.12.2; interface=ether2 }
```

`local-label` dan `remote-label` adalah label pseudowire hasil pertukaran LDP; `nexthops` menunjukkan label transport (17) menuju PE2 lewat P1. Jika `remote-label` kosong, PE seberang belum mengiklankan label untuk vpls-id ini. Periksa vpls-id, alamat peer, dan sesi LDP targeted.

> [!TIP]
> Bridge host table menunjukkan alamat MAC situs seberang dipelajari di interface VPLS (`/interface bridge host print where bridge=br-vpls-c`). Ini cara cepat membuktikan bahwa frame benar-benar melintasi pseudowire. Saat membangun lab dengan VM, pastikan setiap NIC punya MAC unik; pengujian awal modul ini gagal justru karena semua VM QEMU memakai MAC default yang sama.

### VPLS bersinyal BGP (RFC 4761)

Dengan BGP, PE cukup mengumumkan keanggotaan VPLS; pseudowire ke semua PE lain dibuat otomatis.

```
/interface bridge add name=br-vpls-d protocol-mode=none
/interface bridge port add bridge=br-vpls-d interface=ether5
/routing bgp vpls
add name=vpls-d bridge=br-vpls-d bridge-horizon=1 rd=10.255.255.1:400 site-id=1 \
    import-route-targets=65000:400 export-route-targets=65000:400
```

Di PE2 sama, dengan `rd=10.255.255.3:400` dan `site-id=2`. `site-id` harus unik per situs. Sesi iBGP harus membawa `afi=l2vpn` (di lab digabung dengan vpnv4). Interface dinamis muncul sendiri:

```
[admin@PE1] > /interface vpls print detail
 1  RD name="vpls2" mtu=1500 peer=10.255.255.3 pw-type=vpls pw-l2mtu=1500
       pw-control-word=enabled bridge=br-vpls-d bridge-horizon=1 bgp-vpls=vpls-d
       bgp-vpls-prfx="veId=2,veBlockOffset=0&10.255.255.3:400"
```

Perhatikan bahwa interface VPLS hasil BGP memakai control word secara default (`pw-control-word=enabled`). Untuk interoperabilitas dengan implementasi auto-discovery gaya Cisco, ada `cisco-id` di `/routing bgp vpls` dan `afi=l2vpn-cisco`.

Lab B di `22-service-provider/04-l2vpn-carrier-ethernet` membangun VPLS tiga PE di CHR dengan data plane nyata dan membahas split horizon lebih dalam. Modul itu dan modul ini saling melengkapi.

---

## 6. RSVP-TE di RouterOS v7

### Status di v7

RSVP-TE **didukung di v7**. Pengujian di CHR 7.24.5 berhasil membangun tunnel dengan CSPF dan reservasi bandwidth. Yang perlu diketahui sebelum mencari dokumentasi:

- Halaman "Traffic Eng" di help.mikrotik.com masih memakai sintaks v6 (`/interface traffic-eng`, `/mpls traffic-eng tunnel-path`). Di v7, menunya `/mpls traffic-eng interface`, `/mpls traffic-eng path`, dan `/mpls traffic-eng tunnel`. Referensi CLI v7 ada di manual.mikrotik.com.
- Fast reroute tidak didukung (dinyatakan di MPLS Overview). Jika jalur primer putus, tunnel pindah ke jalur sekunder lewat signaling ulang, bukan proteksi lokal 50 ms.

### Konfigurasi minimal

Langkah 1, aktifkan ekstensi TE di OSPF semua router (isi area-id, bukan nama area):

```
/routing ospf instance set [find name=ospf-core] mpls-te-area=0.0.0.0 mpls-te-address=10.255.255.1
```

Langkah 2, daftarkan interface TE dan bandwidth yang boleh direservasi, di setiap router pada jalur:

```
/mpls traffic-eng interface add interface=ether2 bandwidth=100M
```

Langkah 3, di head-end (PE1), definisikan jalur dan tunnel:

```
/mpls traffic-eng path
add name=dinamis use-cspf=yes record-route=yes
add name=lewat-p1 hops=10.1.12.2/strict,10.1.23.2/strict use-cspf=no
/mpls traffic-eng tunnel
add name=te-ke-pe2 from-address=10.255.255.1 to-address=10.255.255.3 \
    primary-path=dinamis secondary-paths=lewat-p1 bandwidth=10M record-route=yes disabled=no
```

Format hop eksplisit di v7 adalah `alamat/strict` atau `alamat/loose`, dipisah koma (format `alamat:strict` ditolak saat pengujian).

### Verifikasi

```
[admin@PE1] > /mpls traffic-eng tunnel print detail
Flags: F - FORWARDING
0  F name="te-ke-pe2" from-address=10.255.255.1 to-address=10.255.255.3
     bandwidth=10Mbps primary-path=dinamis secondary-paths=lewat-p1
     session="10.255.255.3|1|10.255.255.1"
     forwarding-on="primary, Iface=ether2, Nexthop=10.1.12.2, Label=19"
     primary="Path=dinamis, Bw=1250000, Sender=10.255.255.1|3,
        ExplRoute={10.1.12.2|strict,10.1.23.1|strict,10.1.23.2|strict},
        RecRoute={10.1.23.1,*19*,10.1.23.2,*0*}"
```

Tunnel `F` (forwarding) di jalur primer hasil CSPF. Sesaat setelah dibuat, tunnel sempat berjalan di jalur sekunder (eksplisit) sebelum CSPF selesai menghitung, lalu berpindah ke primer. Bandwidth tercatat dalam byte per detik di detail (`Bw=1250000` = 10 Mbps).

Reservasi terlihat di setiap hop:

```
[admin@P1] > /mpls traffic-eng interface print detail
 1  interface=ether3 bandwidth=100Mbps remaining-bw=90.0Mbps ...
```

Dan entri label TE muncul di LFIB P1 dengan flag `T`:

```
[admin@P1] > /mpls forwarding-table print
Flags: L - LDP, T - TRAFFIC-ENG
#   LA  VRF   PREFIX        NEXTHOPS
0 L 16  main  10.255.255.1  { label=impl-null; nh=10.1.12.1; interface=ether2 }
1 L 17  main  10.255.255.3  { label=impl-null; nh=10.1.23.2; interface=ether3 }
2 T 19  main                { label=expl-null; nh=10.1.23.2; interface=ether3 }
```

### Lalu lintas apa yang memakai tunnel?

Hasil pengujian: **pseudowire VPLS LDP otomatis memakai tunnel TE** ke peer yang sama. Setelah tunnel naik, monitor VPLS menunjukkan:

```
[admin@PE1] > /interface vpls monitor vpls-c-pe2 once
   remote-label: 16
    local-label: 16
      te-tunnel: te-ke-pe2
       nexthops: { label=19; nh=10.1.12.2; interface=ether2 }
```

Label transport berubah dari 17 (LDP) menjadi 19 (RSVP-TE). Ini sesuai daftar fitur resmi ("forwarding of VPLS and MPLS IP VPN traffic on TE tunnels").

Untuk rute IP dan VPNv4, routing filter punya properti `use-te-nexthop`. Dalam pengujian, menerapkan `set use-te-nexthop yes` pada filter input sesi iBGP membuat objek next-hop dengan label TE muncul di `/routing nexthop print`, tetapi rute VPN pelanggan A tetap menampilkan label transport LDP. Penulis tidak berhasil memastikan kondisi apa yang membuat lalu lintas VPNv4 berpindah ke tunnel, jadi verifikasi sendiri di versi Anda dengan `/routing route print detail` dan penghitung `/mpls traffic-eng interface` sebelum mengandalkannya.

---

## 7. Desain Backbone ISP Kecil Indonesia dengan MikroTik

Bagian ini menggambarkan pola generik yang umum, bukan jaringan operator tertentu.

### Profil yang umum

Bayangkan ISP lokal atau RT-RW Net yang sudah tumbuh di satu kabupaten: lima sampai dua puluh POP (kecamatan, ruko, menara), terhubung fiber milik sendiri atau sewaan dan sebagian backhaul wireless (PtP 5 GHz atau 60 GHz), satu atau dua titik upstream di kota, dan layanan:

- Broadband rumahan lewat PPPoE (lihat `19-mikrotik/06-vpn-tunnel`) dengan RADIUS di NOC (lihat `19-mikrotik/10-user-manager-radius`).
- Dedicated internet untuk sekolah, kantor desa, dan UMKM.
- Jaringan antar-cabang untuk bank perkreditan, dinas, atau jaringan minimarket (L3VPN).
- "Kabel panjang" L2 untuk pelanggan yang ingin mengelola routing sendiri (VPLS).

### Kerangka desain

```
                 Upstream A        Upstream B        IX (IIX/OpenIXP/dll)
                      │                 │                   │
                ┌─────┴─────┐     ┌─────┴─────┐             │
                │ BR1 (CCR) │─────│ BR2 (CCR) │─────────────┘
                └─────┬─────┘     └─────┬─────┘   eBGP, filter (19.8)
                      │  OSPF area 0 + LDP + iBGP (RR di BR1/BR2 atau CORE)
          ┌───────────┴───────┬─────────┴──────────┐
     ┌────┴────┐        ┌─────┴────┐         ┌─────┴────┐
     │ PE-POP1 │──fiber─│ PE-POP2  │─wireless│ PE-POP3  │   PE: VRF, VPLS, PPPoE BNG
     └────┬────┘        └────┬─────┘         └────┬─────┘
       pelanggan           pelanggan            pelanggan
```

Keputusan yang paling berpengaruh:

1. **Rencana alamat loopback dan link.** Satu blok /24 untuk loopback (seperti 10.255.255.0/24 di lab), satu blok untuk link /30 atau /31. Filter LDP cukup satu baris jika loopback rapi.
2. **IGP tunggal, area 0.** Untuk puluhan router, satu area OSPF sudah cukup dan lebih mudah dirawat. Tetapkan cost manual berdasarkan kapasitas dan keandalan; link wireless diberi cost lebih tinggi daripada fiber agar menjadi cadangan.
3. **Inti BGP-free.** Router P (atau PE yang hanya transit) cukup OSPF dan LDP. Full table atau rute VPN hanya di PE dan router batas.
4. **Route reflector.** Dua RR (bisa di router batas atau dua CCR khusus) untuk vpnv4, l2vpn, dan ip. Setiap PE cukup dua sesi iBGP.
5. **MTU.** Tetapkan satu nilai MPLS MTU untuk seluruh awan (misalnya 1530 atau lebih jika semua link mendukung) dan uji tiap link, terutama radio dan switch media converter di tengah jalan. Interface wireless RouterOS mendukung L2MTU 2290, tetapi perangkat pihak ketiga di jalur belum tentu.
6. **VRF manajemen.** Pisahkan akses NOC ke router dari tabel pelanggan.
7. **Pilih layanan yang tepat.** VPLS terasa mudah dijual ("seperti satu switch"), tetapi satu loop di sisi pelanggan bisa membanjiri seluruh pseudowire. Untuk pelanggan yang hanya butuh konektivitas IP antar-cabang, L3VPN lebih aman dan lebih mudah dioperasikan.

> [!TIP]
> Tidak semua ISP kecil butuh MPLS. Jika layanan Anda hanya broadband dan dedicated internet di satu tabel routing, OSPF plus BGP di tepi (seperti lab `19-mikrotik/08-routing-v7`) sudah cukup. MPLS mulai bernilai ketika Anda menjual layanan terisolasi untuk banyak pelanggan, butuh alamat tumpang tindih, atau ingin memisahkan lalu lintas manajemen dan pelanggan tanpa menarik kabel baru.

### Alternatif yang perlu Anda ketahui

RouterOS 7.20 menambahkan dukungan awal EVPN (dengan VXLAN) di BGP. Di dunia data center dan beberapa operator, EVPN menggantikan VPLS karena belajar MAC lewat control plane dan mendukung multihoming aktif-aktif (lihat `22-service-provider/04-l2vpn-carrier-ethernet`). Untuk backbone MikroTik, EVPN masih baru; uji dengan teliti sebelum dipakai untuk pelanggan.

---

## 8. Batas Performa: CCR dan CHR

### Memilih perangkat

Spesifikasi resmi tiap model (halaman produk di mikrotik.com) memuat hasil uji routing dan bridging dengan berbagai ukuran paket. Saat membandingkan, perhatikan:

- **Ukuran paket.** Angka untuk paket 1518 byte jauh lebih tinggi daripada paket 64 byte. Lalu lintas ISP nyata bercampur; DDoS dan VoIP didominasi paket kecil.
- **Jenis uji.** Hasil "routing fast path" berbeda dengan "routing dengan 25 aturan filter" atau dengan queue. Fitur yang Anda pakai di PE (firewall, queue, NAT untuk pelanggan internet) menentukan angka yang relevan.
- **MPLS.** RouterOS punya FastPath untuk MPLS (sejak 7.10) dan VPLS (sejak 7.17), diatur di `/mpls settings allow-fast-path`. Fitur seperti mangle pada lalu lintas MPLS atau fragmentasi VPLS dapat membuat paket keluar dari jalur cepat.
- **Control plane.** BGP di v7 bisa memakai banyak core (§2 di `19-mikrotik/08-routing-v7`). Full table IPv4 dan IPv6 dari dua upstream membutuhkan RAM yang cukup; pantau dengan `/routing stats process print`.

Jangan mengutip angka throughput dari forum atau video tanpa konteks. Ukur sendiri dengan `/tool traffic-generator` atau `/tool bandwidth-test` dari perangkat terpisah, dengan konfigurasi yang sama seperti produksi.

### CHR sebagai router produksi

CHR berjalan di hypervisor (KVM, VMware, Hyper-V, cloud) dan sering dipakai ISP kecil sebagai route reflector, BNG PPPoE, atau router batas di data center. Fakta resmi tentang lisensinya:

| Lisensi | Batas kecepatan unggah per interface | Harga (dokumentasi resmi) |
|---|---|---|
| free | 1 Mbps | gratis |
| p1 | 1 Gbps | USD 45 |
| p10 | 10 Gbps | USD 95 |
| p-unlimited | tanpa batas | USD 250 |

Lisensi perpetual dibeli sekali; trial 60 hari tersedia untuk tingkat berbayar. Fitur tidak dibatasi; yang dibatasi hanya kecepatan. Karena itu CHR gratis sangat cocok untuk lab MPLS seperti di modul ini, dan juga untuk route reflector produksi (RR tidak meneruskan lalu lintas data, jadi batas 1 Mbps tidak relevan selama sesi BGP-nya kecil; pertimbangkan apakah update full table muat dalam batas itu).

Hal teknis yang perlu diingat:

- Dokumentasi menyarankan RAM minimal 1024 MiB untuk CHR, dengan rumus kebutuhan v7: 256 + 8 × jumlah CPU × (jumlah interface − 1) MiB.
- FastPath di v7 didukung untuk adapter `vmxnet3` dan `virtio-net`.
- Interface virtio tidak melaporkan L2MTU, sehingga MPLS MTU mengikuti L3 MTU (§2). Atur MTU di sisi hypervisor juga (vSwitch, bridge Linux).
- Kinerja CHR bergantung pada host: CPU, NIC, dan teknik akselerasi hypervisor. Uji di host yang sama dengan produksi.

---

## 9. Lab: Backbone MPLS ISP Lokal

### Topologi

```
   h-a1                                                        h-a2
192.168.1.10                                               192.168.2.10
     │ ether3                                                    │ ether3
 ┌───┴───┐ 172.16.11.0/30 ┌───────┐ 10.1.12.0/30 ┌──────┐ 10.1.23.0/30 ┌───────┐ 172.16.12.0/30 ┌───┴───┐
 │ CE-A1 │────────────────│  PE1  │──────────────│  P1  │──────────────│  PE2  │────────────────│ CE-A2 │
 │AS65100│  ether2  ether3│.255.1 │ether2  ether2│.255.2│ether3  ether2│.255.3 │ether3  ether2  │AS65100│
 └───────┘  (VRF A)       └─┬───┬─┘              └──────┘              └─┬───┬─┘   (VRF A)      └───────┘
                       ether4│   │ether5                            ether4│   │ether5
                          h-c1  h-d1                                   h-c2  h-d2
                    VPLS LDP   VPLS BGP                          VPLS LDP   VPLS BGP
                  10.10.30.1   10.10.40.1                       10.10.30.2  10.10.40.2
```

| Komponen | Detail |
|---|---|
| Backbone | AS 65000, OSPF area 0, LDP, MTU link inti 1530, loopback 10.255.255.0/24 |
| L3VPN pelanggan A | VRF `pelanggan-a`, RD `IP-PE:100`, RT 65000:100, PE-CE eBGP AS 65100 di kedua situs (as-override) |
| L3VPN pelanggan B | VRF `pelanggan-b`, RT 65000:200, LAN 192.168.1.0/24 dan 192.168.2.0/24 (tumpang tindih dengan pelanggan A) di bridge `b-lan` pada PE |
| VPLS pelanggan C | LDP, vpls-id 65000:300, port ether4 |
| VPLS pelanggan D | BGP, RD `IP-PE:400`, RT 65000:400, site-id 1 dan 2, port ether5 |

### Berkas lab

Di `materi/lab/kode/mikrotik-v7/`:

- `mpls.clab.yml`: topologi containerlab (5 CHR + 6 host Linux).
- `mpls/pe1.rsc`, `p1.rsc`, `pe2.rsc`, `ce-a1.rsc`, `ce-a2.rsc`: konfigurasi startup.

Cara membangun image CHR untuk containerlab sama dengan lab `19-mikrotik/08-routing-v7` §10 (vrnetlab, kind `mikrotik_ros`, port data mulai `ether2`). Lab ini juga bisa dibangun di GNS3 atau EVE-NG dengan mengimpor berkas `.rsc`.

```bash
cd materi/lab/kode/mikrotik-v7
sudo containerlab deploy -t mpls.clab.yml
```

### Verifikasi langkah demi langkah

Keluaran yang dikutip berasal dari pengujian konfigurasi lab ini di CHR 7.24.5.

**Langkah 1. IGP dan LDP.** Di P1: `/routing ospf neighbor print` menunjukkan dua tetangga `Full`; `/mpls ldp neighbor print` menunjukkan dua tetangga dengan flag `O` (lihat §3). Di PE1: `/mpls forwarding-table print` berisi label `L` untuk 10.255.255.2 dan 10.255.255.3.

**Langkah 2. iBGP.** Di PE1, `/routing bgp session print` menunjukkan sesi `ibgp-pe2-1` dengan `.afi=l2vpn,vpnv4` dan sesi `ce-a1-1` dengan `remote.address=172.16.11.2@pelanggan-a`.

**Langkah 3. L3VPN pelanggan A.** Di CE-A1, `/ip route print where bgp` berisi 192.168.2.0/24 dengan gateway 172.16.11.1. Ping `192.168.2.1 src-address=192.168.1.1` berhasil. Dari host: `docker exec -it clab-mt7-mpls-h-a1 ping 192.168.2.10`.

**Langkah 4. Alamat tumpang tindih (pelanggan B).** Di PE1, `/routing route print where afi=vpnv4` menunjukkan 192.168.1.0/24 dengan dua RD. Ping antar-situs B: `/ping 192.168.2.1 vrf=pelanggan-b src-address=192.168.1.1`.

**Langkah 5. Traceroute dan label.** Di PE1, `/tool traceroute 10.255.255.3 src-address=10.255.255.1` menampilkan `<MPLS:L=...>` di hop P1.

**Langkah 6. VPLS LDP.** Di PE1, `/interface vpls monitor vpls-c-pe2 once` menampilkan local dan remote label. Dari host: `docker exec -it clab-mt7-mpls-h-c1 ping 10.10.30.2`. Lalu `/interface bridge host print where bridge=br-vpls-c` di PE1 menunjukkan MAC h-c2 di interface `vpls-c-pe2`.

**Langkah 7. VPLS BGP.** Di PE1, `/interface vpls print` menampilkan interface dinamis (flag `RD`) dengan `bgp-vpls=vpls-d`. Dari host: `docker exec -it clab-mt7-mpls-h-d1 ping 10.10.40.2`.

**Langkah 8. MTU.** Dari h-a1, `ping -M do -s 1472 192.168.2.10` (paket IP 1500 byte, DF) harus berhasil karena MTU inti 1530. Ubah MTU ether2 di PE1, P1, PE2 menjadi 1500 (`/interface ethernet set ether2 mtu=1500`, dan ether3 di P1), ulangi, dan amati ICMP *fragmentation needed* dari PE1. Kembalikan ke 1530.

### Eksperimen

1. Di PE2, nonaktifkan as-override (`/routing bgp connection set [find name=ce-a2] output.as-override=no`). Di CE-A2, rute 192.168.1.0/24 hilang. Kembalikan.
2. Di PE2, hapus `output.redistribute` dari connection `ce-a2` (`/routing bgp connection set [find name=ce-a2] !output.redistribute`). CE-A2 tidak menerima rute BGP sama sekali. Kembalikan dengan `output.redistribute=bgp-mpls-vpn`.
3. Tambahkan RT 65000:200 ke impor `vpn-a` di PE1 saja. Amati rute pelanggan B masuk ke VRF A di PE1 (route leaking dengan RT) dan pikirkan dampaknya terhadap alamat yang tumpang tindih.
4. Bangun tunnel RSVP-TE PE1 ke PE2 sesuai §6 dan amati `te-tunnel` di monitor VPLS.
5. Pasang filter `ke-ce` (§4) dan bandingkan atribut rute di CE-A1 sebelum dan sesudahnya.

```bash
sudo containerlab destroy -t mpls.clab.yml
```

---

## 10. Troubleshooting MPLS di RouterOS

### Alur dari bawah ke atas

```
1. IGP     : /routing ospf neighbor print        → semua Full? loopback PE terlihat di /ip route?
2. LDP     : /mpls ldp neighbor print            → flag O? alamat transport = loopback?
3. Label   : /mpls forwarding-table print        → ada label L untuk loopback setiap PE?
            /mpls ldp remote-mapping print       → label dari next-hop IGP aktif (tanpa I)?
4. BGP     : /routing bgp session print          → afi memuat vpnv4/l2vpn?
5. VPN     : /routing route print where afi=vpnv4 → rute ada? RT cocok dengan import?
            /ip route print where routing-table=VRF → rute bertanda y aktif?
6. PE-CE   : sesi di VRF established? output.redistribute? as-override?
7. Data    : ping/traceroute dengan src-address dan vrf=; uji ukuran paket dengan DF
```

### Gejala dan penyebab

| Gejala | Penyebab yang sering ditemui | Pemeriksaan |
|---|---|---|
| Tetangga LDP tidak muncul | LDP tidak diaktifkan di interface; firewall memblokir UDP/TCP 646 | `/mpls ldp interface print`, `/ip firewall filter print` |
| Tetangga muncul tetapi tidak `O` | Alamat transport tidak terjangkau (loopback tidak di IGP) | `/ping` ke transport tetangga dengan `src-address=` loopback |
| Label untuk loopback PE tidak ada | Advertise-filter terlalu ketat; filter baru belum berlaku | Reset entri `/mpls ldp`; periksa urutan filter |
| Rute VPN ada di vpnv4 tetapi tidak masuk VRF | Import RT tidak cocok dengan export RT situs lain | `/routing bgp vpn print detail` di kedua PE |
| Rute masuk VRF tetapi tidak aktif | Next-hop (loopback PE) tidak punya label transport | `/routing route print detail` → `immediate-gw` |
| CE tidak menerima rute | `output.redistribute=bgp-mpls-vpn` tidak ada; AS loop tanpa as-override | §4 |
| Ping kecil berhasil, paket besar gagal | MPLS MTU kurang | Ping dengan `do-not-fragment` dan ukuran bertahap |
| VPLS: interface tidak running | Interface masih disabled; vpls-id beda; `pw-l2mtu` beda | `/interface vpls print detail`, monitor |
| VPLS running tetapi host tidak saling ping | Port pelanggan tidak di bridge; MAC duplikat di lab VM; horizon salah | `/interface bridge port print`, `/interface bridge host print` |
| Ping dari PE ke VRF gagal | Tidak memakai `src-address` | §4 |

### Log

Topik log untuk routing berawalan `route`, misalnya baris `route,bgp,info` dan `route,ospf,info` di `/log print`. VPLS punya topik `vpls` sendiri (changelog menyebut "expose VPLS related debug logs to vpls logging topic"). Untuk debug sementara:

```
/system logging add topics=vpls
/system logging add topics=bgp,debug
```

Hapus aturan debug setelah selesai agar log tidak penuh.

---

## 11. Kesalahan Umum

> [!WARNING]
> **Menjalankan LDP di interface pelanggan.** Pelanggan bisa membentuk sesi LDP dengan PE dan menerima label infrastruktur. Aktifkan LDP hanya di interface inti dan blokir port 646 dari arah pelanggan.

> [!WARNING]
> **Alamat transport LDP bukan loopback.** Sesi bergantung pada satu interface, dan PHP bisa berperilaku salah untuk lalu lintas berlabel ganda.

> [!WARNING]
> **Lupa `disabled=no` pada `/interface vpls add`.** Interface VPLS dibuat dalam keadaan nonaktif.

> [!WARNING]
> **RD sama di semua PE.** Bekerja, tetapi konvergensi pelanggan multihomed lebih lambat. Gunakan RD unik per PE per VRF.

> [!WARNING]
> **Lupa `bgp` di `export.redistribute`.** Rute yang dipelajari dari CE lewat eBGP tidak pernah sampai ke situs lain.

> [!WARNING]
> **Menganggap MTU 1500 cukup.** Pelanggan VPN mengalami gangguan aneh pada paket besar. Hitung overhead layanan dan seragamkan MPLS MTU.

> [!WARNING]
> **Mencari konfigurasi TE dengan sintaks v6.** `/interface traffic-eng` tidak ada di v7; gunakan `/mpls traffic-eng`.

> [!WARNING]
> **Mengandalkan TE untuk proteksi cepat.** RouterOS tidak punya RSVP FRR. Gunakan BFD di IGP dan rancang jalur cadangan dengan cost IGP.

> [!WARNING]
> **Menjual VPLS tanpa batas MAC dan proteksi loop di sisi pelanggan.** Satu loop di LAN pelanggan menyebar ke semua situs lewat pseudowire. Pertimbangkan L3VPN atau batasi dengan horizon, STP di sisi pelanggan, dan pemantauan broadcast.

---

## 12. Ringkasan

- RouterOS v7 mendukung LDP, L3VPN (VPNv4/VPNv6), VPLS LDP dan BGP, serta RSVP-TE dengan CSPF; belum mendukung RSVP FRR, LDP on-demand, dan BGP labeled unicast. Segment Routing tidak tercantum di dokumentasi MPLS resmi.
- Fondasi: loopback /32 di `lo`, IGP yang menjangkau semua loopback, MTU yang seragam. Di CHR, virtio tidak punya L2MTU, jadi naikkan L3 MTU link inti (lab: 1530).
- LDP v7: `/mpls ldp add afi=ip lsr-id=... transport-addresses=...`, `/mpls ldp interface add`, filter label hanya untuk loopback, verifikasi dengan neighbor, local-mapping, remote-mapping, forwarding-table, dan traceroute `<MPLS:L=...>`.
- L3VPN v7: `/ip vrf`, `/routing bgp vpn` (RD per PE per VRF, RT per pelanggan, `instance`, `label-allocation-policy`), iBGP `afi=vpnv4`, PE-CE dengan `vrf=`. Di connection PE-CE, `output.redistribute=bgp-mpls-vpn` wajib dan `output.as-override=yes` dibutuhkan bila semua situs memakai AS sama. OSPF bisa dipakai sebagai PE-CE dengan instance `vrf=`.
- VPLS LDP: `/interface vpls add peer=... vpls-id=... disabled=no` + bridge + `horizon=1`. VPLS BGP: `/routing bgp vpls` dengan `site-id`, `rd`, RT, dan `afi=l2vpn`.
- RSVP-TE v7: `mpls-te-area`/`mpls-te-address` di OSPF, `/mpls traffic-eng interface|path|tunnel`; hop eksplisit `alamat/strict`; VPLS otomatis memakai tunnel TE ke peer yang sama.
- ISP kecil: inti BGP-free, satu area OSPF, dua RR, VRF manajemen, MTU seragam, pilih L3VPN daripada VPLS bila pelanggan hanya butuh IP.
- CHR gratis cocok untuk lab dan route reflector; lisensi berbayar membuka kecepatan, bukan fitur.

---

## 13. Latihan

1. Di backbone baru, `/mpls ldp neighbor print` di P1 menampilkan PE1 dengan flag `D` tetapi tanpa `O`. OSPF Full, dan ping dari P1 ke 10.255.255.1 berhasil. Apa yang akan Anda periksa berikutnya dan kenapa?
2. Pelanggan VPN mengeluh: ping antar-kantor lancar, tetapi aplikasi web internal sering macet saat mengunggah berkas. Backbone memakai CHR dengan MTU default. Jelaskan mekanismenya dan dua cara memperbaikinya.
3. PE1 dan PE2 sama-sama mengonfigurasi `vpn-a` dengan RD 65000:100 dan RT 65000:100. Pelanggan A punya dua kantor yang masing-masing terhubung ke PE1 dan PE2 dan mengiklankan prefiks cadangan yang sama. Apa dampak RD yang sama, dan apa perubahan yang Anda sarankan?
4. Sesi eBGP PE2 ke CE-A2 established, prefix-count dari CE bertambah, tetapi CE-A2 tidak menerima rute apa pun dari PE2. `/ip route print where routing-table=pelanggan-a` di PE2 berisi rute bertanda `y`. Apa yang kurang?
5. Kantor pusat dan cabang pelanggan sama-sama AS 65100. Setelah as-override diaktifkan, rute sampai, tetapi pelanggan kemudian menambahkan link backdoor langsung antar-kantor dengan eBGP. Risiko apa yang muncul, dan mekanisme apa yang biasanya dipakai untuk mencegahnya?
6. Anda menambahkan PE3 ke VPLS pelanggan C yang bersinyal LDP. Setelah itu terjadi broadcast storm di semua situs. Konfigurasi interface VPLS baru di PE3 benar. Apa yang paling mungkin terlupa?
7. Seorang teknisi mencari cara membuat tunnel TE di RouterOS 7 dan menemukan perintah `/interface traffic-eng add ...` di dokumentasi. Perintah ditolak. Apa yang harus ia gunakan, dan langkah apa yang wajib di OSPF agar CSPF bekerja?
8. Manajer meminta Anda memilih antara CCR fisik dan CHR di server untuk dua peran: (a) route reflector VPNv4 dan L2VPN untuk 30 PE, (b) PE di POP yang meneruskan 3 Gbps lalu lintas pelanggan. Apa pertimbangan Anda untuk masing-masing?
9. Setelah membangun lab di VM sendiri, VPLS menunjukkan label lokal dan remote yang benar, tetapi host di kedua sisi tidak bisa saling ping. Bridge host table di kedua PE menampilkan alamat MAC yang sama di port yang berbeda. Apa penyebabnya?

<details>
<summary>Jawaban</summary>

1. Flag `D` berarti tetangga ditemukan lewat hello UDP, tetapi tanpa `O` sesi TCP LDP belum operasional. Sesi dibuka dari dan ke alamat transport, bukan alamat link. Periksa bahwa `transport-addresses` di kedua sisi adalah loopback yang benar dan saling terjangkau dengan alamat sumber loopback (`/ping 10.255.255.1 src-address=10.255.255.2`), bahwa firewall `input` mengizinkan TCP 646 dari loopback tetangga, dan apakah tetangga berstatus throttled (sesi gagal berulang). Ping biasa dari P1 memakai alamat sumber interface, sehingga bisa berhasil walau jalur loopback-ke-loopback bermasalah.

2. Interface virtio CHR tidak punya L2MTU, sehingga MPLS MTU sama dengan L3 MTU 1500. Paket pelanggan 1500 byte ditambah dua label (8 byte) melebihi batas. Di PE ingress, paket dengan DF memicu ICMP fragmentation needed yang sering diblokir firewall pelanggan, sehingga TCP dengan PMTUD macet saat mengirim segmen besar (unggah), sementara ping kecil lancar. Perbaikan pertama: naikkan MTU L3 link inti di semua router MPLS (misalnya 1530) dan pastikan hypervisor dan switch di jalur mendukung. Perbaikan kedua (sementara atau tambahan): kecilkan MSS TCP di PE atau CE (`change-mss` di mangle) agar segmen tidak melebihi 1492 byte payload IP. Yang pertama memperbaiki akar masalah.

3. Dengan RD sama, kedua iklan prefiks cadangan dianggap tujuan VPNv4 yang sama, sehingga mesin BGP hanya memilih satu dan PE lain hanya menerima satu jalur. Saat situs yang terpilih putus, perlu withdraw, perhitungan ulang, dan update baru sebelum jalur kedua dipakai, sehingga konvergensi lebih lambat. Dokumentasi VRF RouterOS memperlihatkan bahwa dengan RD unik per situs (misalnya 10.255.255.1:100 di PE1 dan 10.255.255.3:100 di PE2), kedua rute diimpor ke VRF dan perpindahan terjadi seketika. RT tetap sama (65000:100) karena keanggotaan VPN-nya sama.

4. Connection PE-CE belum diberi `output.redistribute=bgp-mpls-vpn`. Rute yang diimpor dari VPNv4 bertipe BGP-MPLS-VPN (flag `y`), bukan BGP biasa, sehingga tidak diiklankan ke CE secara default. Pengujian lab membuktikan CE tidak menerima satu rute pun tanpa parameter ini. Tambahkan `output.redistribute=bgp-mpls-vpn`; jika semua situs memakai AS yang sama, pastikan juga `output.as-override=yes`.

5. Dengan as-override, AS asli pelanggan diganti AS provider, sehingga pemeriksaan loop AS-path di CE tidak lagi bekerja. Jika ada backdoor antar-kantor, rute bisa berputar: kantor A mengiklankan ke backdoor, kantor B mengiklankan kembali ke PE, dan seterusnya, karena tidak ada lagi jejak AS 65100 yang dikenali. Mekanisme yang biasa dipakai adalah Site of Origin (SoO), extended community yang menandai situs asal rute sehingga PE tidak mengirim rute kembali ke situs yang sama. RouterOS mengenali extended community `soo:` di routing filter, sehingga Anda bisa menempelkan SoO pada rute dari tiap CE dan menolak rute dengan SoO situs itu di arah keluar ke CE yang sama. Alternatif paling sederhana adalah memberi tiap situs AS privat berbeda dan menghindari as-override.

6. Split horizon. Pada port bridge untuk interface VPLS di PE3 (atau di PE1/PE2 untuk pseudowire baru ke PE3), parameter `horizon=1` lupa diisi. Tanpa horizon, frame broadcast dari satu pseudowire diteruskan ke pseudowire lain, dan dalam mesh tiga PE frame itu berputar tanpa henti. Semua port pseudowire di bridge VPLS harus berada di horizon yang sama, sedangkan port pelanggan tidak diberi horizon.

7. Di v7, menunya `/mpls traffic-eng interface` (interface dan bandwidth yang boleh direservasi), `/mpls traffic-eng path` (jalur dinamis dengan `use-cspf=yes` atau eksplisit dengan `hops=alamat/strict`), dan `/mpls traffic-eng tunnel` (head-end, `to-address`, `primary-path`, `bandwidth`). Halaman Traffic Eng di help.mikrotik.com masih memakai sintaks v6. Agar CSPF bekerja, semua router harus mengiklankan informasi TE lewat OSPF: `/routing ospf instance set ... mpls-te-area=0.0.0.0 mpls-te-address=LOOPBACK`. Tanpa itu, CSPF tidak punya basis data bandwidth.

8. (a) Route reflector tidak meneruskan lalu lintas pelanggan; bebannya adalah memori dan CPU untuk rute VPNv4 dan L2VPN serta jumlah sesi. CHR di server dengan RAM cukup (dan dua instance di host berbeda untuk redundansi) sangat cocok, dan lisensi rendah pun memadai karena hanya lalu lintas BGP yang lewat. Pantau `/routing stats process print`. (b) PE yang meneruskan 3 Gbps butuh data plane yang kuat dan antarmuka fisik ke pelanggan di POP. CHR butuh lisensi p10 atau p-unlimited, host dengan NIC dan CPU memadai, dan tetap terikat pada perilaku virtio (tanpa L2MTU, kinerja bergantung hypervisor). CCR fisik yang hasil ujinya (dengan fitur yang sama seperti produksi: queue, firewall, MPLS) memenuhi kebutuhan biasanya lebih sederhana dioperasikan di POP. Keputusan akhir harus berdasarkan pengukuran sendiri, bukan angka brosur.

9. Semua VM memakai alamat MAC yang sama untuk NIC-nya (default QEMU tanpa parameter `mac=`). Akibatnya bridge mempelajari MAC yang sama di dua tempat dan frame dikirim ke port yang salah. Inilah yang terjadi saat modul ini diuji pertama kali. Beri setiap NIC alamat MAC unik di hypervisor atau di konfigurasi QEMU, lalu ulangi uji.

</details>

---

## 14. Sumber

- MikroTik, MPLS Overview (fitur yang didukung dan belum): https://help.mikrotik.com/docs/spaces/ROS/pages/40992794/MPLS+Overview
- MikroTik, LDP: https://help.mikrotik.com/docs/spaces/ROS/pages/121995275/LDP
- MikroTik, MPLS MTU, Forwarding and Label Bindings: https://help.mikrotik.com/docs/spaces/ROS/pages/128974876/MPLS+MTU+Forwarding+and+Label+Bindings
- MikroTik, MTU in RouterOS: https://help.mikrotik.com/docs/spaces/ROS/pages/21725296/MTU+in+RouterOS
- MikroTik, VPLS: https://help.mikrotik.com/docs/spaces/ROS/pages/40992798/VPLS
- MikroTik, VPLS Control Word: https://help.mikrotik.com/docs/spaces/ROS/pages/128974851/VPLS+Control+Word
- MikroTik, Traffic Eng (halaman v6, untuk konsep parameter): https://help.mikrotik.com/docs/spaces/ROS/pages/40992796/Traffic+Eng
- MikroTik, Virtual Routing and Forwarding (VRF) dan contoh MPLS VPN: https://help.mikrotik.com/docs/spaces/ROS/pages/328206/Virtual+Routing+and+Forwarding+-+VRF
- MikroTik, BGP: https://help.mikrotik.com/docs/spaces/ROS/pages/328220/BGP
- MikroTik, OSPF (RFC 4577 dan parameter instance): https://help.mikrotik.com/docs/spaces/ROS/pages/9863229/OSPF
- MikroTik, EVPN: https://help.mikrotik.com/docs/spaces/ROS/pages/315883568/EVPN
- MikroTik, RouterOS Manual, CLI Reference (mpls ldp, mpls traffic-eng, routing bgp vpn, interface vpls): https://manual.mikrotik.com/docs/cli-reference/routing/bgp/
- MikroTik, Cloud Hosted Router (CHR), persyaratan dan lisensi: https://help.mikrotik.com/docs/spaces/ROS/pages/18350234/Cloud+Hosted+Router+CHR
- MikroTik, changelog RouterOS v7: https://download.mikrotik.com/routeros/7.24/CHANGELOG
- MikroTik, MTCINE Training Outline: https://i.mt.lv/cdn/training_pdf/mtcine_outline_2020154114220.pdf
- Containerlab, MikroTik RouterOS kind: https://containerlab.dev/manual/kinds/vr-ros/
- RFC 5036, LDP Specification: https://www.rfc-editor.org/rfc/rfc5036
- RFC 4364, BGP/MPLS IP Virtual Private Networks: https://www.rfc-editor.org/rfc/rfc4364
- RFC 4577, OSPF as the PE/CE Protocol for BGP/MPLS IP VPNs: https://www.rfc-editor.org/rfc/rfc4577
- RFC 4761, VPLS Using BGP for Auto-Discovery and Signaling: https://www.rfc-editor.org/rfc/rfc4761
- RFC 4762, VPLS Using LDP Signaling: https://www.rfc-editor.org/rfc/rfc4762
- RFC 4623, PWE3 Fragmentation and Reassembly: https://www.rfc-editor.org/rfc/rfc4623
- RFC 4950, ICMP Extensions for MPLS: https://www.rfc-editor.org/rfc/rfc4950
- RFC 3209, RSVP-TE: Extensions to RSVP for LSP Tunnels: https://www.rfc-editor.org/rfc/rfc3209

---

**Berikutnya:** `19-mikrotik/10-user-manager-radius`. AAA di RouterOS: RADIUS, User Manager v7, dan CoA untuk layanan pelanggan.

# 19.8 — Routing RouterOS v7 (MTCRE)

> **Prasyarat:** `19-mikrotik/01-pengenalan-routeros`, `19-mikrotik/03-firewall-nat` (mangle), `07-routing-lanjutan/01-static-routing`, `07-routing-lanjutan/04-ospf`, `07-routing-lanjutan/06-bgp`, `07-routing-lanjutan/07-redistribusi-policy`
> **Tujuan:** Anda memahami arsitektur routing RouterOS v7 (RIB, FIB, scope, routing table, routing rule), bisa menulis routing filter dengan sintaks baru, membangun OSPFv2/v3 dan BGP v7 (instance, template, connection, community, route reflector) untuk ISP lokal yang multihoming ke dua upstream, memakai VRF dan ECMP, serta mengenali perbedaan perilaku v6 dan v7 yang paling sering menjebak.

---

## 1. Kenapa Modul Ini Ada, dan Versi yang Dipakai

Outline resmi MTCRE (MikroTik Certified Routing Engineer) terakhir disunting Juli 2015. Isinya masih relevan: static routing, ECMP, check-gateway, routing mark, recursive next-hop dengan scope dan target-scope, OSPF lengkap dengan area, LSA, dan filter. Masalahnya, semua itu ditulis untuk RouterOS v6. RouterOS v7 menulis ulang mesin routing dari nol. Menu berpindah, nama parameter berubah, dan beberapa perilaku default berbalik arah. Konfigurasi v6 yang ditempel mentah ke router v7 sering diterima tanpa pesan galat, lalu bekerja dengan cara yang tidak Anda duga.

Modul ini mengajarkan topik MTCRE dengan sintaks v7, ditambah BGP dan VRF yang di v7 sudah menjadi kebutuhan sehari-hari ISP lokal. Konsep protokolnya (cara kerja OSPF, atribut BGP, AD) tidak diulang di sini. Bacalah `07-routing-lanjutan/04-ospf` dan `07-routing-lanjutan/06-bgp` lebih dulu. Fokus kita adalah cara RouterOS v7 mengimplementasikannya.

Semua perintah dan contoh keluaran di modul ini diuji pada **CHR RouterOS 7.24.5** (rilis stabil per Oktober 2026, build 29 September 2026). Sintaks v7 sendiri masih bergerak. Tabel berikut merangkum perubahan yang relevan, diambil dari changelog resmi:

| Versi | Perubahan yang memengaruhi modul ini |
|---|---|
| 7.1 | Dukungan ECMP IPv6 dan VRF (termasuk VRF-lite) |
| 7.10 | Impor VPNv4 memakai distance iBGP (200); OSPF mendukung `use-bfd` |
| 7.14 | Interface `lo` dan interface VRF muncul di `/interface`; BGP bisa membocorkan rute antar-VRF lokal |
| 7.19 | Parameter BGP `address-families` berganti nama menjadi `afi`; `/routing settings` mendapat `connected-in-chain` dan `dynamic-in-chain` |
| 7.20 | Menu `/routing bgp instance` diperkenalkan (instance tidak lagi ditebak dari router-id); `filter-wizard` untuk routing filter |
| 7.21 | Role BGP RFC 9234 ditegakkan (pencegahan route leak); timer `check-gateway=ping` bisa diatur; default `nssa-translator` OSPF menjadi `candidate` |
| 7.22 | BGP multipath, add-path, BGP unnumbered; `/routing settings policy-rules` |
| 7.23 | Konfigurasi virtual link OSPF berubah (memakai interface OSPF langsung) |

⚠️ Lab di modul ini memakai `/routing bgp instance`, jadi butuh **RouterOS 7.20 atau lebih baru**. Kalau perangkat Anda masih di bawah itu, bagian BGP perlu disesuaikan (lihat §7.1). Periksa versi dengan `/system resource print` sebelum menyalin apa pun.

💡 Satu kebiasaan yang menyelamatkan banyak jam: setiap kali menemukan contoh konfigurasi RouterOS di forum atau blog, cari tahu dulu ditulis untuk v6 atau v7. Tanda v6 yang paling mudah dikenali: `/ip route rule`, `/routing bgp peer`, `/routing bgp network`, `/routing ospf network`, `/routing filter add chain=... action=...`. Semua menu itu tidak ada lagi di v7.

---

## 2. Arsitektur Routing v7: RIB, FIB, dan Proses Routing

### RIB dan FIB

RouterOS memisahkan dua tabel, sama seperti router lain yang Anda pelajari di Tahap 7:

- **RIB** (Routing Information Base) menyimpan semua rute yang diketahui: connected, static, OSPF, BGP, VPN, termasuk rute yang kalah seleksi dan rute yang ditolak filter.
- **FIB** (Forwarding Information Base) hanya berisi rute aktif dan aturan policy routing. Inilah yang dipakai untuk meneruskan paket.

```
 OSPF ─┐                                            ┌─ /ip route print (ringkas)
 BGP  ─┼─► filter masuk ─► RIB ─► seleksi rute ─► FIB ──► forwarding paket
 static┤   (per protokol)   │    (distance,        │
 conn ─┘                    │     next-hop lookup) └─ /routing rule, routing table
                            └─► filter keluar ─► OSPF/BGP ke tetangga
```

Rute di RIB v7 menyimpan tiga salinan atribut: *private* (apa adanya dari tetangga), *updated* (hasil filter masuk), dan *current* (yang sedang dipakai). Akibat praktisnya: filter masuk yang mengubah atribut membuat router memakai memori lebih banyak, karena salinan private dan updated tidak lagi bisa berbagi. Di router dengan full table, lebih hemat menolak rute sedini mungkin dengan `input.accept-*` (§7.4) daripada mengubah atribut jutaan rute.

### Tiga menu untuk melihat rute

| Menu | Isi | Bisa diedit? |
|---|---|---|
| `/ip route` | Rute IPv4, kolom ringkas | Ya, untuk rute static |
| `/ipv6 route` | Rute IPv6 | Ya, untuk rute static |
| `/routing route` | Semua address family (ip, ipv6, vpnv4, l2vpn, ...), termasuk rute yang difilter, dengan atribut lengkap | Tidak, hanya baca |

Kalau Anda bertanya "kenapa rute ini tidak aktif", jawabannya hampir selalu ada di `/routing route print detail`, bukan di `/ip route`. Berikut keluaran dari router CORE di lab §10:

```
[admin@CORE] > /ip route print
Flags: D - DYNAMIC; A - ACTIVE; c - CONNECT, s - STATIC, b - BGP, o - OSPF
       + - ECMP
Columns: DST-ADDRESS, GATEWAY, ROUTING-TABLE, DISTANCE
#      DST-ADDRESS      GATEWAY           ROUTING-TABLE  DISTANCE
  D b  0.0.0.0/0        10.255.0.2        main                200
  DAb+ 0.0.0.0/0        10.255.0.1        main                200
  DAo+ 10.255.0.1/32    10.0.31.1%ether3  main                110
  DAo+ 10.255.0.1/32    10.0.13.1%ether2  main                110
  DAo  10.255.0.2/32    10.0.23.1%ether4  main                110
  DAc  10.255.0.3/32    lo                main                  0
  DAb+ 198.51.100.0/24  10.255.0.1        main                200
  DAc  203.0.113.0/26   ether5            main                  0
;;; rekursif ke loopback BR2 lewat OSPF
0  As  0.0.0.0/0        10.255.0.2        via-upb               1
```

Cara membaca flag: `A` aktif (masuk FIB), `D` dinamis, huruf kecil menunjukkan sumber (`c` connected, `s` static, `o` OSPF, `b` BGP, `y` BGP-MPLS-VPN), `+` anggota ECMP. Baris tanpa `A` adalah kandidat yang kalah. Di contoh ini ada dua default route dari BGP; yang lewat 10.255.0.1 menang karena local-pref lebih tinggi, yang lewat 10.255.0.2 menunggu sebagai cadangan.

### Proses routing terpisah

Di v7, OSPF, BGP, LDP, BFD, RIB, dan FIB berjalan sebagai proses (task) terpisah yang bisa disebar ke beberapa core CPU. Anda bisa melihatnya:

```
[admin@CORE] > /routing stats process print
 # TASKS                         PRIVATE-M  SHARED-ME  PSS       RSS
 0 routing tables                1280.0KiB  1792.0KiB  793.0KiB  3472.0KiB
   rib
 1 fib                           256.0KiB   0          675.0KiB  3044.0KiB
 5 ospf                          1280.0KiB  512.0KiB   847.0KiB  3256.0KiB
13 bgp-IP-10.255.0.2             512.0KiB   768.0KiB   814.0KiB  3364.0KiB
   bgp-output-10.255.0.2
```

Setiap sesi BGP mendapat proses input dan output sendiri secara default (`input.affinity=alone`). Pada router dengan sedikit core, dokumentasi resmi menyarankan mengelompokkan sesi (`affinity=main` atau `instance`) karena pertukaran data antar-proses sedikit lebih lambat. Ini relevan saat Anda memasang full table di CCR dengan banyak upstream.

### Router ID

Router ID di v7 dikelola terpusat di `/routing id`. Ada entri dinamis `main` yang memilih alamat IP tertinggi. OSPF (`router-id=main` secara default) dan BGP bisa merujuk nama ini atau Anda isi alamat langsung. Untuk router produksi, selalu tetapkan router-id eksplisit sama dengan loopback, persis seperti anjuran di `07-routing-lanjutan/04-ospf`.

### Loopback di v7

Sejak 7.14 RouterOS punya interface `lo` bawaan. Anda cukup menambahkan alamat /32 ke `lo`:

```
/ip address add address=10.255.0.1/32 interface=lo comment="loopback"
```

Dokumentasi lama (dan banyak tutorial) masih memakai bridge kosong sebagai loopback (`/interface bridge add name=loopback`). Cara itu tetap bekerja dan wajib dipakai di versi sebelum 7.14.

---

## 3. Distance, Scope, dan Target-Scope: Mesin Resolusi Next-Hop

### Distance

`distance` di RouterOS setara administrative distance di Cisco. Rute kandidat dengan distance terkecil menjadi aktif. Nilai yang teramati pada lab ini (RouterOS 7.24.5):

| Sumber rute | Distance default |
|---|---|
| Connected | 0 |
| Static | 1 |
| eBGP | 20 |
| OSPF | 110 |
| iBGP | 200 |
| Impor VPNv4/VPNv6 (BGP-MPLS-VPN) | 200 (sejak 7.10) |

Syarat sebuah rute boleh ikut seleksi: tidak disabled, punya minimal satu next-hop yang bisa dijangkau (untuk rute unicast), dan bukan rute sintetis. Jika ada dua kandidat dengan distance sama, RouterOS memilih salah satu secara arbitrer, kecuali protokolnya sendiri (OSPF, atau BGP multipath sejak 7.22) menggabungkannya menjadi ECMP.

### Scope dan target-scope

Di sinilah RouterOS berbeda dari kebanyakan vendor, dan di sinilah outline MTCRE menaruh "recursive next-hop and scope/target-scope usage". Setiap rute punya dua angka:

- **scope**: "seberapa jauh" rute ini dianggap. Rute dengan scope kecil boleh dipakai untuk menyelesaikan next-hop rute lain.
- **target-scope**: batas atas scope rute yang boleh dipakai untuk mencari next-hop rute ini.

Aturannya satu kalimat: **rute R boleh dipakai untuk menyelesaikan gateway rute X jika scope(R) ≤ target-scope(X)**.

Nilai default yang teramati di lab:

| Rute | scope | target-scope |
|---|---|---|
| Connected | 10 | (tidak relevan) |
| OSPF | 20 | 10 |
| Static | 30 | 10 |
| eBGP | 40 | 10 |
| iBGP | 40 | 30 |

Dari tabel ini Anda bisa menurunkan perilaku yang sering membingungkan:

- Static route default (target-scope 10) hanya bisa menunjuk gateway yang terhubung langsung, karena hanya connected (scope 10) yang memenuhi.
- Rute iBGP (target-scope 30) bisa menyelesaikan next-hop lewat OSPF (scope 20) dan static (scope 30). Itu sebabnya next-hop iBGP berupa loopback router lain bekerja tanpa konfigurasi tambahan.
- Kalau Anda ingin static route menunjuk loopback yang dipelajari lewat OSPF, naikkan target-scope menjadi minimal 20.

Lihat keluaran nyata dari CORE. Kolom `SC` adalah scope, `TA` target-scope:

```
[admin@CORE] > /routing route print where dst-address=10.255.0.1/32 || dst-address=0.0.0.0/0
   DST-ADDRESS    GATEWAY           AFI  ROUTING  DIS  SC  TA  IMMEDIATE-GW
Ao 10.255.0.1/32  10.0.13.1%ether2  ip   main     110  20  10  10.0.13.1%ether2
As 0.0.0.0/0      10.255.0.2        ip   via-upb    1  30  20  10.0.23.1%ether4
```

Rute static terakhir punya gateway 10.255.0.2 (loopback BR2, rute OSPF dengan scope 20). Karena target-scope-nya 20, gateway itu terselesaikan dan `IMMEDIATE-GW` terisi 10.0.23.1 lewat ether4. Kalau target-scope dibiarkan default 10, rute itu akan tetap tidak aktif dan tidak ada pesan galat apa pun.

### Recursive route untuk failover dua ISP

Modul `19-mikrotik/01-pengenalan-routeros` §7 sudah memberi resep failover klasik dengan 8.8.8.8. Sekarang Anda bisa membacanya dengan angka:

```
/ip route add dst-address=8.8.8.8/32 gateway=203.0.113.9 scope=10
/ip route add dst-address=0.0.0.0/0 gateway=8.8.8.8 target-scope=11 \
    distance=1 check-gateway=ping
/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.9 distance=10
```

Rute pertama diberi `scope=10` supaya boleh dipakai untuk resolusi. Rute kedua memakai `target-scope=11`, sehingga ia hanya bisa diselesaikan lewat rute dengan scope ≤ 11, yaitu rute /32 tadi (bukan lewat default route dirinya sendiri, yang scope-nya 30). `check-gateway=ping` lalu memeriksa 8.8.8.8 yang berada di luar jaringan ISP. Kalau upstream ISP-A putus di tengah jalan sementara modem tetap hidup, ping ke 8.8.8.8 gagal dan default route pertama dinonaktifkan. Ini yang tidak bisa dilakukan oleh `check-gateway` biasa yang hanya memeriksa gateway terdekat.

⚠️ Pilih alamat probe yang Anda boleh ping terus-menerus dan yang jarang berubah. Dua ISP sebaiknya memakai alamat probe yang berbeda, dan rute /32 ke probe harus tetap mengarah lewat ISP yang diuji.

### Perbedaan v6 dan v7 dalam resolusi next-hop

Di v6, satu alamat gateway hanya punya satu objek next-hop. Mengubah `target-scope` satu rute bisa membuat rute lain yang memakai gateway sama tiba-tiba tidak aktif. v7 menyimpan objek next-hop terpisah untuk setiap kombinasi scope dan jenis gateway check, sehingga perubahan pada satu rute tidak lagi merembet. Objek-objek ini bisa diperiksa di `/routing nexthop print`:

```
[admin@CORE] > /routing nexthop print where address=10.255.0.1
Flags: R - REACHABLE
  ADDRESS     SCOPE  TA  IMMEDIATE-GW.ADD
R 10.255.0.1     40  30  10.0.13.1%ether2
                         10.0.31.1%ether3
```

### Gateway dengan `@tabel` dan `%interface`

v7 memperkenalkan notasi untuk menyatakan di tabel mana gateway dicari:

| Notasi | Arti |
|---|---|
| `gateway=10.0.0.1` | Cari gateway di tabel `main` |
| `gateway=10.0.0.1@main` | Sama, ditulis eksplisit (wajib saat rute berada di tabel lain tetapi gateway ada di main) |
| `gateway=10.0.0.1@vrf-a` | Cari gateway di tabel atau VRF `vrf-a` |
| `gateway=10.0.0.1%ether2` | Gateway di interface tertentu |
| `gateway=ether2@vrf-a` | Interface di VRF lain |

⚠️ Hindari interface sebagai gateway pada link broadcast (Ethernet) kecuali tujuannya memang terhubung langsung. Router akan mengirim ARP untuk alamat tujuan akhir, bukan untuk next-hop, sehingga tujuan yang berjarak beberapa hop tidak akan pernah terjangkau. `check-gateway` juga tidak bisa dipakai pada gateway berupa interface broadcast karena tidak ada alamat yang bisa diperiksa.

### check-gateway

Nilai yang diterima di 7.24.5: `arp`, `ping`, `bfd`, `none`. Router memeriksa gateway setiap 10 detik; jika tidak ada balasan dalam 10 detik, itu dihitung satu timeout, dan setelah dua timeout gateway dianggap tidak terjangkau. Sejak 7.21 timer ping bisa diatur di `/routing settings` (`check-gateway-ping-interval`, `check-gateway-ping-timeout`, `check-gateway-ping-count`). Jadi dengan default, failover butuh sekitar 20 detik. Kalau Anda butuh detik tunggal, pakai `check-gateway=bfd` dengan BFD dikonfigurasi di kedua sisi.

### Blackhole dan pull-up route

Di v7 terbaru, rute blackhole ditulis dengan flag `blackhole`, bukan `type=blackhole` seperti di v6:

```
/ip route add dst-address=203.0.113.0/24 blackhole comment="pull-up route agregat"
```

Rute seperti ini dipakai sebagai "jangkar" agar prefiks agregat bisa diiklankan BGP (§7.3) dan agar paket ke bagian prefiks yang belum terpakai dibuang di tepi, bukan berputar-putar.

---

## 4. Routing Table, Routing Rule, dan Policy Routing

Policy routing berarti keputusan forwarding memakai informasi selain alamat tujuan: alamat sumber, interface masuk, atau tanda (routing mark) dari mangle. RouterOS v7 menyediakan tiga komponen: routing table, routing rule, dan mangle.

### Routing table harus dibuat dulu

Perbedaan v7 yang paling sering memakan korban: **tabel harus didaftarkan di `/routing table` sebelum dipakai di mana pun**, dan flag `fib` wajib jika rute di tabel itu ingin dipakai forwarding.

```
/routing table add name=via-upb fib
/ip route add dst-address=0.0.0.0/0 gateway=198.18.0.5 routing-table=via-upb
```

Di v6 Anda cukup menulis `routing-mark=nama` di rute dan tabel tercipta sendiri. Di v7, perintah `/ip route add ... routing-table=via-upb` tanpa tabel terdaftar ditolak dengan pesan `input does not match any value of routing-table`. Batas jumlah tabel adalah 4096.

💡 Rute di tabel selain `main` yang gateway-nya ada di `main` perlu notasi `gateway=x.x.x.x@main` bila gateway tidak terhubung langsung ke tabel itu. Dokumentasi resmi juga mengingatkan: agar lookup di tabel kustom berhasil, tabel `main` sebaiknya juga bisa menyelesaikan tujuan yang sama.

### Routing rule

Routing rule pindah dari `/ip route rule` (v6) ke `/routing rule` (v7). Aksi yang tersedia:

| Aksi | Perilaku |
|---|---|
| `lookup` | Cari di tabel yang disebut; jika tidak ada rute yang cocok, lanjut ke rule berikutnya (akhirnya ke `main`) |
| `lookup-only-in-table` | Cari hanya di tabel itu; jika gagal, paket tidak jatuh ke `main` |
| `drop` | Buang diam-diam |
| `unreachable` | Buang dan kirim ICMP unreachable |

Parameter pencocokan: `src-address`, `dst-address`, `interface` (interface masuk), `routing-mark`, dan `min-prefix` (setara `suppress_prefixlength` di Linux, misalnya `min-prefix=0` menyembunyikan default route dari lookup rule itu).

Rule diperiksa berurutan dari atas. Urutan inilah sumber jebakan klasik berikut.

⚠️ **Default route di tabel kustom menelan lalu lintas internal.** Aksi `lookup` hanya jatuh ke `main` kalau *tidak ada* rute yang cocok. Tabel `via-upb` berisi default route, sehingga selalu ada yang cocok. Akibatnya, paket dari pelanggan korporat ke server di jaringan sendiri ikut dikirim ke upstream. Solusinya, taruh pengecualian di atas:

```
/routing rule
add dst-address=203.0.113.0/24 action=lookup-only-in-table table=main \
    comment="tujuan internal tetap memakai tabel main"
add dst-address=10.0.0.0/8 action=lookup-only-in-table table=main
add src-address=203.0.113.64/26 action=lookup table=via-upb \
    comment="pelanggan korporat keluar lewat BR2"
```

Rule pertama dan kedua menangkap tujuan internal sebelum rule ketiga sempat bekerja. Konfigurasi ini dipakai di router CORE dan BR2 pada lab.

### Urutan keputusan: policy-rules (7.22+)

Sejak 7.22 urutan langkah keputusan routing bisa dilihat dan diubah di `/routing settings`:

```
[admin@CORE] /routing/settings> print
                    policy-rules: mangle
                                  vrf-lookup
                                  vrf-unreach
                                  local
                                  user
                                  main
```

Artinya: tanda dari mangle diproses paling awal, lalu lookup VRF, lalu alamat lokal router, lalu rule buatan Anda (`user`), terakhir tabel `main`. Implikasinya penting: **routing mark dari mangle mendahului pengecekan alamat lokal**. Jika mangle Anda menandai paket yang sebenarnya ditujukan ke router itu sendiri, router tidak bisa lagi dijangkau dari LAN. Dokumentasi resmi memberi dua jalan keluar: tambahkan `dst-address-type=!local` di aturan mangle, atau pindahkan langkah `mangle` ke bawah `local` di `policy-rules`.

### Mangle dan routing mark: load balancing PCC dua ISP

Model mangle tidak berubah dari v6 (lihat `19-mikrotik/03-firewall-nat`), kecuali satu hal: nilai `new-routing-mark` harus berupa nama tabel yang sudah ada di `/routing table`. Berikut pola PCC (Per Connection Classifier) untuk dua ISP yang lazim di RT-RW Net dan kantor kecil. Pola ini membagi koneksi, bukan paket, sehingga satu sesi TCP tetap keluar lewat ISP yang sama:

```
/routing table
add name=ke-isp1 fib
add name=ke-isp2 fib

/ip firewall mangle
# koneksi masuk dari ISP dikembalikan lewat ISP yang sama
add chain=prerouting in-interface=ether1-isp1 connection-mark=no-mark \
    action=mark-connection new-connection-mark=isp1-conn passthrough=yes
add chain=prerouting in-interface=ether2-isp2 connection-mark=no-mark \
    action=mark-connection new-connection-mark=isp2-conn passthrough=yes
# koneksi baru dari LAN dibagi dua dengan PCC; alamat lokal router dikecualikan
add chain=prerouting in-interface=bridge-lan dst-address-type=!local \
    connection-mark=no-mark per-connection-classifier=both-addresses:2/0 \
    action=mark-connection new-connection-mark=isp1-conn passthrough=yes
add chain=prerouting in-interface=bridge-lan dst-address-type=!local \
    connection-mark=no-mark per-connection-classifier=both-addresses:2/1 \
    action=mark-connection new-connection-mark=isp2-conn passthrough=yes
# terjemahkan tanda koneksi menjadi routing mark
add chain=prerouting in-interface=bridge-lan connection-mark=isp1-conn \
    action=mark-routing new-routing-mark=ke-isp1 passthrough=no
add chain=prerouting in-interface=bridge-lan connection-mark=isp2-conn \
    action=mark-routing new-routing-mark=ke-isp2 passthrough=no
add chain=output connection-mark=isp1-conn action=mark-routing \
    new-routing-mark=ke-isp1 passthrough=no
add chain=output connection-mark=isp2-conn action=mark-routing \
    new-routing-mark=ke-isp2 passthrough=no

/ip route
add gateway=192.0.2.1 routing-table=ke-isp1 check-gateway=ping
add gateway=198.51.100.1 routing-table=ke-isp2 check-gateway=ping
add gateway=192.0.2.1 distance=1 check-gateway=ping
add gateway=198.51.100.1 distance=2 check-gateway=ping
```

Pilihan `both-addresses` membuat satu pasangan alamat sumber-tujuan selalu jatuh ke ISP yang sama. Ini penting untuk layanan perbankan dan game daring yang menolak sesi jika alamat publik pelanggan berganti di tengah jalan. Jangan lupa NAT masquerade untuk kedua interface WAN.

⚠️ Dokumentasi resmi menyarankan tidak mencampur mangle routing mark dan routing rule untuk lalu lintas yang sama kecuali Anda paham urutannya. Mangle diproses lebih dulu, sehingga lalu lintas yang sudah ditandai dan berhasil di-lookup tidak akan pernah dilihat routing rule.

---

## 5. Routing Filter v7: Bahasa Baru

Di v6, filter adalah daftar baris dengan `prefix=`, `prefix-length=`, `action=`. Di v7, setiap baris berisi potongan skrip `if (...) { ... } else { ... }`. Perubahan ini terjadi sejak 7.1beta4, dan konsekuensinya besar: aturan v6 tidak bisa diterjemahkan satu-satu tanpa berpikir.

### Anatomi aturan

```
/routing filter rule
add chain=upa-masuk rule="if (dst-len > 24) { reject }"
add chain=upa-masuk rule="set bgp-local-pref 200; append bgp-communities 64500:101; accept"
```

- `chain` adalah nama rantai. Rantai dirujuk oleh protokol (BGP, OSPF) atau oleh rantai lain lewat `jump`.
- `rule` berisi pencocok (matcher) di dalam `if (...)` dan aksi di dalam `{ ... }`.
- Aturan tanpa `if` langsung mengeksekusi aksinya.
- Beberapa aturan dalam satu rantai dieksekusi dari atas seperti firewall. Begitu ada `accept` atau `reject`, pemrosesan berhenti.
- **Aksi default di akhir rantai adalah reject.** Rantai yang lupa diakhiri `accept` akan membuang semua rute.

Aturan yang salah tulis ditolak saat diketik, misalnya:

```
[admin@BR1] > /routing filter rule add chain=salah rule="if (dst-panjang > 24) { reject }"
failure: "Word {dst-panjang} > Word {24} " - unknown matcher
```

### Pencocok dan aksi yang paling sering dipakai

| Kategori | Contoh | Keterangan |
|---|---|---|
| Prefiks | `dst == 203.0.113.0/24`, `dst in 10.0.0.0/8`, `dst-len > 24`, `dst-len in 8-24` | `in` berarti subnet dari jaringan yang disebut |
| Protokol | `protocol static`, `protocol connected`, `ospf-type ext2` | Untuk redistribusi |
| BGP | `bgp-as-path ^64502$`, `bgp-path-len > 10`, `bgp-communities includes 64500:101`, `bgp-input-remote-as == 64501` | Regex AS-path per nomor AS |
| RPKI | `rpki invalid` (setelah `rpki-verify grup`) | Butuh `/routing rpki` |
| Aksi atur | `set bgp-local-pref 200`, `set bgp-path-prepend 3`, `set bgp-med 50`, `set distance +1`, `set ospf-ext-metric 50`, `set ospf-ext-type type1`, `set gw 10.0.0.1` | Angka bisa diawali `+`/`-` untuk menambah atau mengurangi |
| Aksi community | `append bgp-communities 64500:1`, `delete bgp-communities other`, `filter bgp-communities ...`, `set bgp-large-communities 64500:1:2` | `delete bgp-ext-communities rt` menghapus route target |
| Alur | `accept`, `reject`, `jump nama-rantai`, `return` | |

### Rantai bersama dengan `jump` dan `return`

Daftar bogon dipakai di semua sesi eBGP, jadi tulis sekali dan panggil dari mana saja. Pola ini teruji di lab:

```
/routing filter rule
add chain=bogon rule="if (dst in 0.0.0.0/8 || dst in 10.0.0.0/8 || dst in 100.64.0.0/10 || dst in 127.0.0.0/8) { reject }"
add chain=bogon rule="if (dst in 169.254.0.0/16 || dst in 172.16.0.0/12 || dst in 192.168.0.0/16 || dst in 198.18.0.0/15) { reject }"
add chain=bogon rule="if (dst in 224.0.0.0/3) { reject }"
add chain=bogon rule="if (dst in 203.0.113.0/24) { reject }"
add chain=bogon rule="return"
add chain=upa-masuk rule="jump bogon"
add chain=upa-masuk rule="if (dst-len > 24) { reject }"
add chain=upa-masuk rule="set bgp-local-pref 200; append bgp-communities 64500:101; accept"
```

`return` di akhir rantai `bogon` mengembalikan rute yang lolos ke rantai pemanggil. Tanpa baris itu, rute yang lolos akan jatuh ke aksi default (reject). Perhatikan juga bahwa `dst in 0.0.0.0/8` tidak menangkap default route 0.0.0.0/0, karena 0.0.0.0/0 bukan subnet dari 0.0.0.0/8. Lab membuktikan default route dari upstream tetap diterima.

💡 Aturan keempat (menolak prefiks milik sendiri dari upstream) adalah higiene BGP dasar. Kalau ada pihak lain yang membajak atau membocorkan prefiks Anda, router Anda tidak akan ikut mempercayainya.

### Regex AS-path: jangan salin dari v6 atau Cisco

v6 dan Cisco mengubah AS-path menjadi string lalu mencocokkan per karakter. v7 mencocokkan per nomor AS (gaya Juniper), sehingga jauh lebih cepat tetapi maknanya berbeda. Contoh dari dokumentasi resmi: pola `1234[5-9]` di v6 cocok dengan AS 12345 sampai 12349 di mana saja; di v7 pola yang sama berarti "AS 1234 diikuti AS bernomor 5 sampai 9". Uji pola dengan alat bawaan sebelum dipakai:

```
[admin@CORE] > /routing filter test-as-path-regexp regexp="^64501 64502\$" as-path="64501,64502"
 match
[admin@CORE] > /routing filter test-as-path-regexp regexp="^64502\$" as-path="64501,64502"
 no match
```

Regex tidak bisa mencocokkan AS-path kosong (`^$`). Untuk rute yang berasal dari AS sendiri, pakai `bgp-path-len == 0`.

### Daftar bersama: num-list dan community-list

```
/routing filter num-list add list=as-pelanggan range=64600-64699
/routing filter community-list add list=dari-upa communities=64500:101
/routing filter rule add chain=contoh rule="if (bgp-communities any-list dari-upa) { set distance 25; accept }"
```

Sejak 7.20 parameter `list` dan `chain` wajib diisi saat menambah entri.

### filter-wizard (7.20+)

Bagi yang terbiasa dengan v6, 7.20 menambah generator aturan dengan sintaks bergaya v6. Hasilnya tetap aturan skrip biasa dengan komentar `added by filter-wizard`:

```
[admin@BR2] > /routing filter filter-wizard chain=coba action=accept dst=10.99.0.0/16 dst-len=24 set-bgp-local-pref=150
 Filter rule 'if (dst == 10.99.0.0/16 && dst-len == 24) { set bgp-local-pref 150; accept; }' added
```

Perhatikan bahwa `dst=` di wizard menjadi `dst ==` (sama persis), bukan `dst in`. Selalu baca aturan hasil wizard sebelum dipakai di produksi.

### Di mana rantai dipasang

| Tempat | Parameter | Catatan |
|---|---|---|
| BGP masuk | `input.filter=` di connection/template | Rute yang ditolak tetap ada di memori sebagai "filtered" |
| BGP masuk, sangat awal | `input.accept-nlri=` (address-list), `input.accept-communities=`, `input.filter-nlri=` (7.20+) | Ditolak sebelum di-parse, hemat memori |
| BGP keluar | `output.filter-chain=`, `output.filter-select=` | Tanpa filter, BGP mengiklankan semua rute BGP aktif |
| OSPF masuk | `in-filter-chain=` di instance | |
| OSPF keluar | `out-filter-chain=`, `out-filter-select=` di instance | Hanya bekerja untuk rute eksternal (hasil redistribusi) |
| Rute connected/dinamis | `/routing settings connected-in-chain`, `dynamic-in-chain` (7.19+) | |

---

## 6. OSPFv2 dan OSPFv3 di RouterOS v7

### Model konfigurasi: instance, area, interface-template

v7 menggabungkan OSPFv2 dan OSPFv3 ke satu menu `/routing ospf`. Tidak ada instance atau area bawaan; semua dibuat eksplisit:

```
instance  (version=2 atau 3, router-id, redistribute, filter)
   └── area  (area-id, type: default | stub | nssa)
          └── interface-template  (pencocok: networks= atau interfaces=; parameter: cost, type, auth, passive, ...)
                 └── interface, neighbor  (hasil, hanya baca)
```

Konsep kunci: **interface-template adalah pencocok, bukan daftar interface**. Template mencocokkan interface berdasarkan `interfaces=` (nama atau interface list) atau `networks=` (interface mana pun yang punya alamat di dalam prefiks itu, dihitung dari prefiks jaringannya, bukan alamat host). Parameter template kemudian diterapkan ke setiap interface yang cocok. Menu `/routing ospf interface` dan `/routing ospf neighbor` hanya untuk melihat hasilnya.

Konfigurasi BR1 di lab:

```
/routing ospf instance
add name=ospf-isp version=2 router-id=10.255.0.1
/routing ospf area
add name=backbone area-id=0.0.0.0 instance=ospf-isp
/routing ospf interface-template
add area=backbone interfaces=ether3,ether4 type=ptp cost=10 \
    auth=sha256 auth-id=1 auth-key=RahasiaOSPF2026
add area=backbone networks=10.255.0.1/32 passive
```

Beberapa hal yang perlu diperhatikan:

- `type=ptp` pada link antar-router menghilangkan pemilihan DR/BDR. Nilai lain: `broadcast` (default untuk Ethernet), `nbma`, `ptmp`, `ptp-unnumbered`. Sejak 7.23 virtual link tidak lagi dibuat lewat template `type=virtual-link`; ikuti dokumentasi versi Anda.
- Autentikasi: `auth=` bisa `simple`, `md5`, `sha1`, `sha256`, `sha384`, `sha512` (SHA ditambahkan di 7.6). Nama parameter kuncinya `auth-key` (beberapa halaman dokumentasi menulis `authentication-key`; CLI 7.24.5 menerima `auth-key`).
- `passive` adalah flag tanpa nilai.
- Cost default di template adalah 1 dan **tidak dihitung dari bandwidth**. Dokumentasi resmi menyarankan rumus Cisco (100000000/bw dalam bps) bila Anda butuh kecocokan dengan vendor lain. Untuk jaringan campuran, tetapkan cost manual di kedua sisi.

### Verifikasi

```
[admin@CORE] > /routing ospf neighbor print
 0 D instance=ospf-isp area=backbone interface=ether2 address=10.0.13.1
     router-id=10.255.0.1 state="Full" state-changes=4 adjacency=1s timeout=39s
 1 D instance=ospf-isp area=backbone interface=ether3 address=10.0.31.1
     router-id=10.255.0.1 state="Full" state-changes=5 adjacency=1s timeout=39s
 2 D instance=ospf-isp area=backbone interface=ether4 address=10.0.23.1
     router-id=10.255.0.2 state="Full" state-changes=5 adjacency=5s timeout=35s
```

Database LSA dibaca dengan `/routing ospf lsa print`. Contoh LSA router milik BR2:

```
[admin@BR2] > /routing ospf lsa print where self-originated
 1  SD instance=ospf-isp area=backbone type="router" originator=10.255.0.2
      id=10.255.0.2 sequence=0x80000006 age=3 checksum=0x980F body=
         options=E bits=E
             type=p2p id=10.255.0.3 data=10.0.23.1 metric=10
             type=stub id=10.0.23.0 data=255.255.255.252 metric=10
             type=stub id=10.255.0.2 data=255.255.255.255 metric=1
```

Anda bisa membaca ini dengan bekal `07-routing-lanjutan/04-ospf`: link `p2p` ke router 10.255.0.3 dengan metric 10, subnet /30 sebagai stub, dan loopback sebagai stub /32 dengan metric 1. Bit `E` menandakan router ini ASBR (karena ada redistribusi, lihat di bawah).

### Tipe area

```
/routing ospf area
add name=area1 area-id=0.0.0.1 instance=ospf-isp type=stub
# totally stubby: no-summaries dipasang di ABR
add name=area2 area-id=0.0.0.2 instance=ospf-isp type=stub no-summaries
add name=area3 area-id=0.0.0.3 instance=ospf-isp type=nssa nssa-translator=candidate
# ringkasan inter-area, dipasang di ABR
/routing ospf area range
add area=area1 prefix=10.1.0.0/16 advertise=yes cost=10
```

Untuk area range yang aktif, RouterOS memasang rute blackhole untuk prefiks ringkasan, sama seperti router lain yang membuat rute null untuk summary.

### Redistribusi dan default route

v7 sempat menghapus tombol redistribusi di instance (semua lewat filter), lalu mengembalikannya sejak 7.1beta7. Model akhirnya: `redistribute=` memilih jenis rute, `out-filter-chain` menyaring dan mengatur atribut.

```
/routing ospf instance set ospf-isp redistribute=static out-filter-chain=ospf-keluar
/routing filter rule
add chain=ospf-keluar rule="if (dst == 203.0.113.0/24) { set ospf-ext-metric 50; set ospf-ext-type type1; accept }"
add chain=ospf-keluar rule="reject"
```

Hasilnya teramati di CORE sebagai LSA eksternal tipe 1 dengan metric 50:

```
[admin@CORE] > /routing ospf lsa print where type=external
0 D instance=ospf-isp type="external" originator=10.255.0.2 id=203.0.113.0
    sequence=0x80000001 age=11 checksum=0xB522 body=
       options=E
       netmask=255.255.255.0
       forwarding-address=0.0.0.0
       metric=50 type-1
       route-tag=0
```

Default route punya jalur khusus: `originate-default=always | if-installed | never` di instance. `if-installed` hanya mengiklankan default jika router punya default route aktif.

⚠️ Contoh di atas sengaja memperlihatkan bahaya klasik. Rute 203.0.113.0/24 di BR2 adalah blackhole agregat. Begitu diredistribusikan ke OSPF, CORE akan mengirim paket ke bagian prefiks yang tidak punya rute lebih spesifik ke BR2, lalu dibuang. Di lab, eksperimen ini Anda batalkan lagi setelah melihat hasilnya.

### BFD untuk OSPF

```
/routing bfd configuration add interfaces=all min-rx=200ms min-tx=200ms multiplier=3
/routing ospf interface-template set [find interfaces~"ether"] use-bfd=yes
```

Sesi BFD terlihat di `/routing bfd session print` dengan status `up` dan `hold-time=600ms`. BFD harus dikonfigurasi di kedua sisi; jika salah satu belum, sesi tetap `down` dan OSPF berjalan dengan timer hello/dead biasa.

### OSPFv3

OSPFv3 memakai instance terpisah dengan `version=3`. Router-id tetap angka 32 bit:

```
/ipv6 address add address=2001:db8:ffff::1/128 interface=lo advertise=no
/routing ospf instance add name=ospf6-isp version=3 router-id=10.255.0.1
/routing ospf area add name=backbone6 area-id=0.0.0.0 instance=ospf6-isp
/routing ospf interface-template
add area=backbone6 interfaces=ether3 type=ptp cost=10
add area=backbone6 networks=2001:db8:ffff::1/128 passive
```

Adjacency terbentuk lewat alamat link-local, dan rute IPv6 muncul di `/ipv6 route print where ospf` dengan gateway `fe80::...%interface`.

### Troubleshooting adjacency OSPF di RouterOS

| Gejala | Penyebab yang paling mungkin di RouterOS | Pemeriksaan |
|---|---|---|
| Neighbor tidak muncul sama sekali | Template tidak mencocokkan interface (prefiks `networks=` salah, atau nama interface salah) | `/routing ospf interface print`: interface harus terdaftar |
| Neighbor muncul lalu hilang, log menyebut authentication | `auth`, `auth-id`, atau `auth-key` berbeda | Bandingkan template kedua sisi |
| Macet di ExStart/Exchange | MTU berbeda | `/interface print` kolom MTU di kedua sisi |
| Tidak pernah Full pada link Ethernet dua router | `type` berbeda (`ptp` di satu sisi, `broadcast` di sisi lain) | Samakan `type` |
| Rute eksternal tidak muncul | `redistribute` tidak diisi, atau `out-filter-chain` berakhir tanpa `accept` | `/routing ospf lsa print where type=external` di ASBR |

---

## 7. BGP di RouterOS v7

### 7.1 Model konfigurasi

BGP v7 ditulis ulang total. Menu `instance` lama, `peer`, `network`, dan `aggregate` dari v6 tidak ada di v7. Sebagai gantinya ada:

| Menu | Fungsi |
|---|---|
| `/routing bgp instance` (7.20+) | AS lokal, router-id, cluster-id, VRF, `multipath` (7.22+). Seleksi best path hanya membandingkan rute dalam satu instance |
| `/routing bgp template` | Parameter protokol bersama (afi, filter, timer, nexthop-choice). Bisa diwariskan ke connection |
| `/routing bgp connection` | Satu definisi koneksi: alamat tetangga, AS tetangga, role, instance. Juga bisa mendengar satu subnet untuk peer dinamis |
| `/routing bgp session` | Hanya baca: sesi yang sedang berjalan dan kapabilitas yang dinegosiasikan |
| `/routing bgp advertisements` | Hanya baca: prefiks yang dikirim ke tiap sesi |
| `/routing bgp vpn`, `vpls`, `evpn` | Layanan MPLS/EVPN (modul `19-mikrotik/09-mpls-routeros`) |

Parameter template juga tersedia langsung di connection, jadi untuk jaringan kecil Anda tidak wajib membuat template.

Contoh minimal eBGP di 7.20+:

```
/routing bgp instance
add name=bgp-isp as=64500 router-id=10.255.0.1
/routing bgp connection
add name=upa instance=bgp-isp remote.address=198.18.0.1 remote.as=64501 \
    local.role=ebgp
```

Hal-hal yang berbeda dari v6 dan dari vendor lain:

- **`local.role` wajib.** Untuk kasus umum isi `ebgp` atau `ibgp`. Nilai lain mengikuti RFC 9234 (lihat §7.6).
- `remote.as` boleh dikosongkan; AS tetangga dibaca dari pesan OPEN. Isi tetap disarankan untuk eBGP agar tidak sembarang AS bisa tersambung.
- `local.address` setara `update-source`. Untuk iBGP antar-loopback, isi dengan loopback.
- Keluarga alamat diatur dengan `afi=` (misalnya `afi=ip,ipv6` atau `afi=vpnv4`). Sebelum 7.19 namanya `address-families=`.
- Sebelum 7.20 tidak ada `/routing bgp instance`: AS diisi di template atau connection (`as=`), dan instance ditentukan oleh kesamaan router-id. Saat upgrade ke 7.20, konfigurasi lama dikonversi otomatis. Changelog 7.20 memperingatkan bahwa downgrade ke versi tanpa instance bisa merusak konfigurasi.

### 7.2 Sesi dan verifikasi

```
[admin@BR1] > /routing bgp session print
 0  E name="upa-1" instance=bgp-isp remote.address=198.18.0.1 .as=64501
      .id=10.255.10.1 .capabilities=mp,rr,enhe,gr,as4 .afi=ip .messages=6
      .address=198.18.0.2 .as=64500 .id=10.255.0.1 .cluster-id=10.255.0.1
      output.procid=20 .filter-chain=upa-keluar .network=prefiks-kita
      input.procid=20 .filter=upa-masuk .limit-process-routes=10000 ebgp
      hold-time=3m keepalive-time=1m uptime=28s660ms prefix-count=3
```

Flag `E` berarti established. Nama sesi adalah nama connection ditambah akhiran `-1`. `prefix-count` adalah jumlah prefiks yang diterima. Atribut sebuah rute dibaca di `/routing route print detail`:

```
[admin@BR1] > /routing route print detail where dst-address=0.0.0.0/0
Ab afi=ip contribution=active dst-address=0.0.0.0/0 routing-table=main
   gateway=198.18.0.1 immediate-gw=198.18.0.1%ether2 distance=20 scope=40
   target-scope=10 belongs-to="bgp-IP-198.18.0.1" bgp.session=upa-1
   .as-path="64501" .communities=64500:101 .local-pref=200 .origin=igp
```

Terlihat local-pref 200 dan community 64500:101 hasil rantai `upa-masuk`.

Untuk melihat apa yang dikirim ke tetangga:

```
[admin@BR2] > /routing bgp advertisements print
DST              PEER         AFI  NEXTHOP
0.0.0.0/0        ibgp-core-1  ip   10.255.0.2
192.0.2.0/24     ibgp-core-1  ip   10.255.0.2
203.0.113.0/24   upb-1        ip   198.18.0.6
```

v7 sengaja tidak menyimpan atribut yang dikirim agar hemat memori. Jika Anda perlu bukti atribut keluar (misalnya untuk berdebat dengan NOC upstream), aktifkan `output.keep-sent-attributes=yes` di connection, lalu `/routing bgp session dump-saved-advertisements` untuk menyimpannya ke berkas pcap.

### 7.3 Mengiklankan prefiks sendiri

Menu `network` diganti address-list:

```
/ip firewall address-list add list=prefiks-kita address=203.0.113.0/24
/ip route add dst-address=203.0.113.0/24 blackhole comment="pull-up route agregat /24"
/routing bgp connection set upa output.network=prefiks-kita
```

Prefiks hanya diiklankan jika rute yang sama persis ada di tabel routing (sinkronisasi dengan IGP tidak bisa dimatikan di v7). Itulah fungsi rute blackhole. Sejak 7.20.1 ada `output.network-blackhole=yes` yang membuat rute blackhole itu secara otomatis. Satu address-list bisa dipakai banyak connection, atau tiap connection punya daftar sendiri.

### 7.4 Jebakan output dan input

⚠️ **Tanpa `output.filter-chain`, BGP mengiklankan semua rute BGP aktif.** RouterOS tidak menerapkan perilaku "tolak semua secara default" seperti yang dianjurkan RFC 8212. Satu sesi eBGP tanpa filter di router yang menerima full table dari upstream A akan mengiklankan seluruh internet ke upstream B. Itulah route leak, dan itulah alasan setiap sesi eBGP di lab punya rantai keluar yang berakhir `reject`:

```
/routing filter rule
add chain=upa-keluar rule="if (dst == 203.0.113.0/24) { accept }"
add chain=upa-keluar rule="reject"
```

⚠️ **Default route tidak diiklankan lewat BGP kecuali diminta.** Ini ditemukan saat menguji lab: BR1 menerima default dari UPA, tetapi CORE tidak pernah menerimanya lewat iBGP sampai connection BR1 ke CORE diberi `output.default-originate=if-installed`. Nilai lain: `always` (selalu kirim default, dipakai upstream ke pelanggan) dan `never` (default).

Untuk sisi masuk, ada dua lapis:

- `input.filter=` menjalankan rantai routing filter setelah rute di-parse. Rute yang ditolak tetap memakan memori dan muncul sebagai *filtered*.
- `input.accept-nlri=`, `input.accept-communities=`, `input.filter-nlri=` dan kawan-kawan menolak sebelum parse. Pakai ini untuk membatasi apa yang boleh masuk dari peer IXP atau pelanggan.
- `input.limit-process-routes-ipv4=` (setara maximum-prefix). Jika batas terlampaui, sesi diberi flag `limit-exceeded` dan harus dibersihkan manual dengan `/routing bgp session clear ... flag=limit-exceeded`.

### 7.5 Best path di RouterOS

Urutan seleksi dari dokumentasi resmi: WEIGHT tertinggi (atribut lokal, diatur lewat filter), LOCAL_PREF tertinggi, AS_PATH terpendek (dilewati jika `ignore-as-path-len`), rute yang berasal dari router sendiri, ORIGIN terendah (IGP < EGP < incomplete), MED terendah (hanya antar-rute dari AS tetangga yang sama), eBGP di atas iBGP, IGP metric ke next-hop terendah, lalu (jika `multipath` aktif) berhenti dan pasang ECMP, kemudian router-id terendah (atau ORIGINATOR_ID), cluster list terpendek, dan alamat tetangga terendah.

Seleksi hanya dilakukan antar-rute dari instance yang sama. Rute dari instance berbeda dibandingkan dengan aturan umum (distance).

### 7.6 Role BGP (RFC 9234) dan pencegahan route leak

Role menyatakan hubungan bisnis: `ebgp-customer` (saya pelanggan tetangga), `ebgp-provider` (saya penyedia tetangga), `ebgp-peer`, `ebgp-rs`, `ebgp-rs-client`. Kedua sisi harus konsisten. Uji di lab memberi hasil berikut:

- BR1 `ebgp-customer` dan UPA `ebgp-provider`: sesi naik, kapabilitas `role` tercantum.
- BR1 `ebgp-customer` dan UPA juga `ebgp-customer`: sesi ditolak dengan log `remote role (3) mismatch`.

Sesi yang dikonfigurasi dengan role juga memakai atribut OTC (Only To Customer). Di UPB, rute 203.0.113.0/24 yang diterima dari peer UPA membawa `.otc=64501`. Dengan atribut ini, router yang mematuhi RFC 9234 tidak akan meneruskan rute tersebut ke provider atau peer lain. Ini mekanisme di tingkat protokol untuk aturan valley-free yang dibahas di `07-routing-lanjutan/11-interkoneksi-internet`.

💡 Role adalah tambahan, bukan pengganti filter keluar. Upstream Anda mungkin belum mendukung RFC 9234. Selalu pertahankan filter prefiks keluar.

### 7.7 iBGP dan route reflector

Di lab, CORE adalah route reflector untuk BR1 dan BR2:

```
/routing bgp instance
add name=bgp-isp as=64500 router-id=10.255.0.3 cluster-id=10.255.0.3
/routing bgp connection
add name=rr-br1 instance=bgp-isp remote.address=10.255.0.1 remote.as=64500 \
    local.address=10.255.0.3 local.role=ibgp-rr
add name=rr-br2 instance=bgp-isp remote.address=10.255.0.2 remote.as=64500 \
    local.address=10.255.0.3 local.role=ibgp-rr
```

Di sisi klien (BR1, BR2) role-nya `ibgp` biasa, ditambah `nexthop-choice=force-self` (setara next-hop-self) agar CORE tidak perlu tahu subnet eBGP. Nilai `nexthop-choice` lain: `default` (sesuai RFC 4271) dan `propagate` (teruskan next-hop asli, berguna untuk RR di topologi EVPN). Sejak 7.21 RouterOS menolak sesi iBGP dengan nomor AS yang berbeda.

### 7.8 Community

```
# menandai rute dari tiap upstream (informasional, untuk dibaca operator dan filter lain)
add chain=upa-masuk rule="set bgp-local-pref 200; append bgp-communities 64500:101; accept"
# mencocokkan
add chain=contoh rule="if (bgp-communities includes 64500:101) { set distance 25; accept }"
# menghapus community dari luar sebelum mengiklankan ke pelanggan
add chain=ke-pelanggan rule="delete bgp-communities other; accept"
# large community (RFC 8092), cocok untuk ASN 32 bit
add chain=contoh2 rule="append bgp-large-communities 64500:1:101; accept"
```

Community well-known yang dikenali di `community-list` antara lain `no-export`, `no-advertise`, `blackhole`, `graceful-shutdown`, `local-as`.

💡 Banyak upstream dan IXP di Indonesia menyediakan *action community*: community yang Anda tempel pada prefiks agar upstream melakukan sesuatu, misalnya prepend ke tetangga tertentu, tidak mengiklankan ke peer tertentu, atau RTBH (blackhole) saat Anda diserang DDoS. Nilainya berbeda di tiap operator dan biasanya ada di dokumen teknis untuk pelanggan atau di catatan PeeringDB-nya. Mintalah dokumen itu saat tanda tangan kontrak transit. Teknik pemasangannya di RouterOS sama: `append bgp-communities AS-UPSTREAM:NILAI` di rantai keluar ke upstream tersebut.

### 7.9 Multihoming ke dua upstream: kebijakan ISP lokal

Skenario lab mewakili kasus yang sangat umum di Indonesia: ISP lokal di sebuah kabupaten yang sudah punya ASN dan blok /24 sendiri (diperoleh lewat IDNIC, lihat `07-routing-lanjutan/11-interkoneksi-internet`), membeli transit dari dua upstream nasional, dan ingin:

1. **Lalu lintas keluar** lewat upstream A (lebih murah atau lebih besar kapasitasnya), upstream B sebagai cadangan. Alat: `local-pref` 200 untuk rute dari A di router batas A.
2. **Lalu lintas masuk** juga cenderung lewat A. Alat: AS-path prepend ke B.
3. Pelanggan korporat tertentu (yang membayar jalur khusus) keluar lewat B. Alat: policy routing (§4).
4. Jika A putus, semua pindah ke B otomatis. Alat: BGP itu sendiri, ditambah default route iBGP dari kedua router batas.

Untuk butir 2, perhatikan semantik prepend di RouterOS yang ditemukan saat pengujian:

⚠️ **`set bgp-path-prepend N` membuat AS Anda muncul N kali total, bukan ditambah N.** Dengan `set bgp-path-prepend 2`, UPB menerima AS-path `64500,64500` (satu tambahan). Panjangnya sama dengan jalur lewat UPA (`64501,64500`), sehingga UPB tetap memilih jalur langsung dan inbound tidak bergeser. Baru dengan nilai 3 (`64500,64500,64500`) UPB memilih jalur lewat UPA:

```
[admin@UPB] > /routing route print detail where dst-address=203.0.113.0/24
 b afi=ip contribution=candidate dst-address=203.0.113.0/24
   gateway=198.18.0.6 ... .as-path="64500,64500,64500" .origin=igp
Ab afi=ip contribution=active dst-address=203.0.113.0/24
   gateway=198.18.0.9 ... .as-path="64501,64500" .origin=igp .otc=64501
```

Prepend adalah alat yang kasar. Upstream yang menerapkan local-pref berdasarkan jenis pelanggan (pelanggan lebih disukai daripada peer) akan mengabaikan prepend Anda, karena local-pref diperiksa sebelum panjang AS-path. Di situlah action community dari upstream lebih efektif.

---

## 8. VRF di RouterOS v7

### Dasar

VRF di v7 dibuat di `/ip vrf` (di v6: `/ip route vrf`). Setiap VRF otomatis mendapat routing table dengan nama yang sama:

```
/interface bridge add name=noc
/ip address add address=172.16.99.1/24 interface=noc
/ip vrf add name=vrf-noc interfaces=noc
```

```
[admin@CORE] > /ip vrf print
Flags: * - BUILTIN
0   name="vrf-noc" interfaces=noc
1 * name="main" interfaces=all
[admin@CORE] > /routing table print
0  D name="main" fib
1  D name="vrf-noc" fib
```

Hal-hal penting:

- **Urutan entri VRF berpengaruh.** Pencocokan interface berjalan dari atas seperti firewall. Entri `main` dengan `interfaces=all` menangkap semua interface, jadi VRF baru harus berada di atasnya. RouterOS biasanya menaruh entri baru di atas `main`; jika tidak, pindahkan dengan `move` atau gunakan `place-before=0`.
- **Routing table VRF dibuat secara asinkron.** Saat pengujian, perintah `/ip route add ... routing-table=vrf-noc` yang dijalankan sesaat setelah `/ip vrf add` ditolak (`input does not match any value of routing-table`), lalu berhasil beberapa detik kemudian. Dalam skrip, beri jeda (`:delay 2s`) setelah membuat VRF.
- Sejak 7.14, setiap VRF punya interface virtual bernama sama (terlihat di `/interface print` dengan tipe `vrf`). Firewall dengan `in-interface=` untuk lalu lintas VRF harus merujuk interface VRF itu, bukan interface fisik anggotanya.
- Batas 1024 VRF per router (sejak 7.12).
- Layanan router tidak otomatis "tahu" VRF. SSH, WinBox, SNMP, NTP, RADIUS, syslog, DNS dan lainnya punya parameter `vrf=` atau notasi `alamat@vrf` sendiri. Contoh: `/ip service set ssh vrf=vrf-noc`.

### Perintah diagnostik di VRF

```
/ping 10.255.0.1 vrf=vrf-noc src-address=172.16.99.1
/tool traceroute 10.255.0.1 vrf=vrf-noc
/ip route print where routing-table=vrf-noc
```

💡 Selalu isi `src-address` saat ping dari router ke dalam VRF. Saat menguji lab 19.9, ping dari PE ke VRF tanpa `src-address` gagal, sedangkan dengan `src-address` alamat interface VRF berhasil.

### Route leaking statis

Ada dua arah, dan ada satu jebakan yang ditemukan saat pengujian:

```
# dari VRF ke main: gateway dicari di main
/ip route add dst-address=10.255.0.0/24 gateway=10.0.13.1@main routing-table=vrf-noc

# dari main ke VRF: untuk menjangkau HOST di dalam VRF
/ip route add dst-address=172.16.99.0/24 gateway=noc@vrf-noc

# dari main ke VRF: untuk menjangkau ALAMAT ROUTER SENDIRI di dalam VRF
/ip route add dst-address=172.16.99.0/24 gateway=vrf-noc@vrf-noc
```

⚠️ Gateway `interface@vrf` hanya bekerja untuk paket yang diteruskan (forwarding). Untuk paket yang ditujukan ke alamat lokal router di VRF itu (misalnya balasan ping ke 172.16.99.1), gateway harus interface VRF-nya (`vrf-noc@vrf-noc`). Di lab, ping dari VRF ke loopback BR1 baru berhasil setelah rute balik diubah ke bentuk ini. Membocorkan prefiks yang tumpang tindih tidak akan bekerja.

### Route leaking dinamis tanpa sesi BGP (7.14+)

Untuk banyak VRF, rute statis tidak lagi praktis. Sejak 7.14 RouterOS bisa bertukar rute antar-VRF lokal lewat mesin BGP VPN tanpa perlu sesi BGP ke router lain, cukup dengan route target:

```
/routing bgp vpn
add name=leak-1 instance=bgp-isp vrf=vrfTest1 route-distinguisher=1.2.3.4:1 \
    export.redistribute=connected export.route-targets=1:1 \
    import.route-targets=1:2 label-allocation-policy=per-vrf
add name=leak-2 instance=bgp-isp vrf=vrfTest2 route-distinguisher=1.2.3.4:2 \
    export.redistribute=connected export.route-targets=1:2 \
    import.route-targets=1:1 label-allocation-policy=per-vrf
```

RD, RT, dan mekanisme impor/ekspor dijelaskan lengkap di `22-service-provider/02-mpls-l3vpn`. Sebelum 7.14, satu-satunya cara adalah membuat tunnel antara dua loopback lokal yang masing-masing dimasukkan ke VRF berbeda, lalu menjalankan protokol routing di atasnya. Cara itu masih sering muncul di tutorial lama.

### VRF manajemen

Pola yang layak dipakai di ISP: semua interface manajemen dan layanan (SSH, SNMP, syslog, RADIUS ke NOC) ditaruh di satu VRF `mgmt`. Dengan begitu kesalahan routing di tabel `main` (misalnya full table yang kacau) tidak memutus akses NOC ke router. Ingat bahwa setiap layanan perlu diberi `vrf=mgmt` atau `alamat@mgmt` secara eksplisit.

---

## 9. ECMP

### Cara v7 membentuk ECMP

Di v7, ECMP terbentuk ketika ada beberapa rute ke tujuan yang sama dengan distance sama, atau ketika protokol (OSPF, BGP multipath) menghasilkan beberapa next-hop setara. RouterOS menggabungkannya otomatis dan memberi flag `+`. Untuk static, cukup tambahkan dua rute dengan distance sama:

```
/ip route add dst-address=0.0.0.0/0 gateway=192.0.2.1 distance=1
/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.1 distance=1
```

Di lab, CORE dan BR1 terhubung dua link dengan cost OSPF sama. Hasilnya, loopback BR1 dicapai lewat dua jalur, dan rute BGP yang next-hop-nya loopback BR1 ikut mewarisi dua immediate gateway:

```
[admin@CORE] > /routing route print where bgp
    DST-ADDRESS      GATEWAY     AFI  ROUT  DIS  SCOPE  TA  IMMEDIATE-GW
Ab+ 0.0.0.0/0        10.255.0.1  ip   main  200     40  30  10.0.13.1%ether2
                                                            10.0.31.1%ether3
 b  0.0.0.0/0        10.255.0.2  ip   main  200     40  30  10.0.23.1%ether4
```

### Hash

Secara default ECMP IPv4 memakai hash L3 (alamat sumber dan tujuan). Sejak 7.16 kebijakan hash bisa diganti:

```
# nilai yang diterima: l3 | l4 | l3-inner
/ip settings set ipv4-multipath-hash-policy=l4
```

`l4` menambahkan port dan protokol, sehingga banyak sesi dari satu pelanggan bisa tersebar. `l3-inner` melihat header dalam bila paket di-tunnel. Untuk IPv6, hash L3 sudah memasukkan flow label.

### ECMP, PCC, dan NAT

ECMP berbasis hash per aliran, bukan per paket, sehingga tidak merusak urutan TCP. Namun ECMP ke dua ISP yang berbeda dengan NAT masquerade bisa mengganggu pelanggan, karena aliran yang berbeda dari satu pengguna keluar dengan alamat publik yang berbeda. Untuk dua ISP di RT-RW Net, PCC dengan `both-addresses` (§4) lebih terkendali. ECMP paling cocok untuk jalur paralel di dalam jaringan Anda sendiri, seperti dua link antara BR1 dan CORE di lab.

BGP baru bisa memasang ECMP sejak 7.22 lewat parameter `multipath` di `/routing bgp instance` (angka: jumlah jalur setara yang boleh dipasang), misalnya `/routing bgp instance set [find name=bgp-isp] multipath=2`.

---

## 10. Lab: ISP Lokal Multihoming ke Dua Upstream

### Topologi

```
        AS 64501                      AS 64502
     ┌──────────┐ 198.18.0.8/30  ┌──────────┐
     │   UPA    │────────────────│   UPB    │
     │198.51.100│ (peering)      │192.0.2.0 │
     │   .0/24  │                │   /24    │
     └────┬─────┘                └────┬─────┘
 198.18.0.0/30 (eBGP)          198.18.0.4/30 (eBGP)
          │ ether2                    │ ether2
     ┌────┴─────┐                ┌────┴─────┐
     │   BR1    │  AS 64500      │   BR2    │
     │10.255.0.1│                │10.255.0.2│
     └─┬──────┬─┘                └────┬─────┘
 ether3│      │ether4                 │ether3
10.0.13│/30   │10.0.31/30        10.0.23.0/30
 ether2│      │ether3                 │ether4
     ┌─┴──────┴──────────────────────┴─┐
     │              CORE               │ route reflector, policy routing
     │           10.255.0.3            │
     └──────┬────────────────────┬─────┘
       ether5│203.0.113.0/26     │ether6 203.0.113.64/26
        h-rumah                 h-korp (pelanggan korporat)
```

| Perangkat | Peran | Loopback | AS |
|---|---|---|---|
| UPA | Upstream A, memberi default dan 198.51.100.0/24 | 10.255.10.1 | 64501 |
| UPB | Upstream B, memberi default dan 192.0.2.0/24 | 10.255.20.1 | 64502 |
| BR1 | Router batas ke UPA (jalur utama) | 10.255.0.1 | 64500 |
| BR2 | Router batas ke UPB (cadangan, prepend, jalur korporat) | 10.255.0.2 | 64500 |
| CORE | Route reflector, gateway pelanggan | 10.255.0.3 | 64500 |

Semua alamat memakai blok dokumentasi (RFC 5737), blok benchmark 198.18.0.0/15 untuk link, dan ASN privat. Jangan dipakai di internet.

### Berkas lab

Semua berkas ada di `materi/lab/kode/mikrotik-v7/`:

- `routing-v7.clab.yml`: topologi containerlab.
- `routing-v7/upa.rsc`, `upb.rsc`, `br1.rsc`, `br2.rsc`, `core.rsc`: konfigurasi startup tiap router.

### Menyiapkan image CHR untuk containerlab

Containerlab menjalankan CHR lewat kind `mikrotik_ros`, yaitu VM QEMU yang dibungkus container oleh proyek vrnetlab. Image tidak disediakan siapa pun; Anda membangunnya sendiri dari CHR resmi:

```bash
git clone https://github.com/srl-labs/vrnetlab.git
cd vrnetlab/mikrotik/routeros
# unduh chr-7.24.5.vmdk dari https://mikrotik.com/download (bagian Cloud Hosted Router)
cp ~/Unduhan/chr-7.24.5.vmdk .
make docker-image
docker images | grep mikrotik_routeros     # hasil: vrnetlab/mikrotik_routeros:7.24.5
```

Catatan dari dokumentasi containerlab: `ether1` dipakai untuk manajemen dan tidak boleh muncul di bagian `links`, port data mulai dari `ether2`, kredensial default `admin:admin`, dan berkas `startup-config` disalin ke node sebagai `config.auto.rsc` lalu dieksekusi otomatis oleh RouterOS. Host Linux butuh KVM (`/dev/kvm`). Lisensi CHR gratis membatasi kecepatan unggah 1 Mbps per interface, lebih dari cukup untuk lab routing.

💡 Tanpa containerlab, topologi yang sama bisa dibangun di GNS3 atau EVE-NG dengan template CHR. Hubungkan port sesuai tabel, lalu impor berkas `.rsc` dengan `/import file-name=br1.rsc` setelah mengunggahnya lewat WinBox atau SCP.

### Menjalankan

```bash
cd materi/lab/kode/mikrotik-v7
sudo containerlab deploy -t routing-v7.clab.yml
# tunggu 1-2 menit sampai semua CHR selesai boot dan konfigurasi teraplikasi
ssh admin@clab-mt7-routing-core          # kata sandi: admin
```

### Verifikasi langkah demi langkah

Hasil di bawah adalah keluaran nyata dari pengujian konfigurasi lab ini pada CHR 7.24.5.

**Langkah 1. OSPF.** Di CORE, `/routing ospf neighbor print` harus menunjukkan tiga tetangga `Full` (dua ke BR1, satu ke BR2), dan `/ip route print where ospf` harus berisi 10.255.0.1/32 dengan dua gateway bertanda `+` serta 10.255.0.2/32.

**Langkah 2. BGP.** Di CORE, `/routing bgp session print` harus menunjukkan dua sesi `E` dengan `local.role=ibgp-rr`. Di BR1, sesi `upa-1` established dengan `.capabilities` yang memuat `role`.

**Langkah 3. Kebijakan keluar.** Di CORE:

```
[admin@CORE] > /tool traceroute 198.51.100.1 src-address=203.0.113.1 count=1
#  ADDRESS       LOSS  SENT  LAST
0  10.0.13.1     0%       1  0.3ms
1  198.51.100.1  0%       1  0.3ms
```

Pelanggan rumahan keluar lewat BR1 ke UPA.

**Langkah 4. Policy routing korporat.**

```
[admin@CORE] > /tool traceroute 192.0.2.1 src-address=203.0.113.65 count=1
#  ADDRESS    LOSS  SENT  LAST
0  10.0.23.1  0%       1  0.2ms
1  192.0.2.1  0%       1  0.5ms
```

Sumber 203.0.113.65 keluar lewat BR2 ke UPB, walaupun default route di tabel `main` mengarah ke BR1. Untuk melihat pentingnya rule pengecualian, nonaktifkan dua rule pertama (`/routing rule disable 0,1`), tunggu beberapa detik, lalu jalankan `/tool traceroute 10.255.0.1 src-address=203.0.113.65 count=1`. Paket ke loopback BR1, yang seharusnya langsung lewat ether2 atau ether3, kini dibawa ke BR2. BR2 mengembalikannya ke CORE (karena BR2 masih punya pengecualian), CORE mengirimnya lagi ke BR2 karena sumbernya tetap 203.0.113.65, dan seterusnya. Hasil pengujian memperlihatkan loop yang khas:

```
 #  ADDRESS       LOSS  SENT  LAST
 0  10.0.23.1     0%       1  0.3ms
 1  203.0.113.65  0%       1  0ms
 2  10.0.23.1     0%       1  0.1ms
 3  203.0.113.65  0%       1  0.1ms
 ...
```

Hop berselang-seling antara BR2 dan CORE sampai TTL habis. Aktifkan kembali dengan `/routing rule enable 0,1`.

**Langkah 5. Kebijakan masuk.** Di UPB, `/routing route print detail where dst-address=203.0.113.0/24` harus menunjukkan jalur aktif lewat UPA (`as-path="64501,64500"`) dan jalur langsung dari BR2 dengan `as-path="64500,64500,64500"` sebagai kandidat.

**Langkah 6. Failover.** Di BR1 jalankan `/routing bgp connection disable upa`. Dalam beberapa detik, di CORE:

```
[admin@CORE] > /ip route print where bgp
    DST-ADDRESS      GATEWAY     ROUTING-TABLE  DISTANCE
DAb 0.0.0.0/0        10.255.0.2  main                200
DAb 192.0.2.0/24     10.255.0.2  main                200
DAb 198.51.100.0/24  10.255.0.2  main                200
```

Semua lalu lintas pindah ke BR2. Aktifkan kembali dengan `/routing bgp connection enable upa`.

**Langkah 7. Dari host.** Dari container `h-rumah` (`docker exec -it clab-mt7-routing-h-rumah bash`), `traceroute 198.51.100.1` harus melewati 203.0.113.1, lalu BR1. Dari `h-korp`, `traceroute 192.0.2.1` harus melewati BR2.

### Eksperimen tambahan

1. Ubah prepend di BR2 dari 3 menjadi 2 (`/routing filter rule set [find chain=upb-keluar && rule~"prepend"] rule="if (dst == 203.0.113.0/24) { set bgp-path-prepend 2; accept }"`). Amati di UPB bahwa jalur langsung kembali aktif.
2. Hapus `output.default-originate=if-installed` dari connection `ibgp-core` di BR1. Amati default route hilang dari CORE (hanya tersisa yang dari BR2).
3. Ubah role UPA ke BR1 menjadi `ebgp-customer`. Baca log BR1 dengan `/log print where topics~"bgp"`.
4. Tambahkan `/ip settings set ipv4-multipath-hash-policy=l4` di CORE, lalu bandingkan `/interface print stats` ether2 dan ether3 saat beberapa host melakukan unduhan paralel.

### Membersihkan

```bash
sudo containerlab destroy -t routing-v7.clab.yml
```

---

## 11. Troubleshooting dan Perbedaan v6 vs v7 yang Menjebak

### Alur diagnosis "rute tidak ada atau tidak dipakai"

```
1. Apakah rute ada di RIB?            /routing route print where dst-address=X
   ├─ tidak ada  → masalah di protokol (sesi BGP, adjacency OSPF, filter masuk)
   └─ ada, tanpa flag A:
2. Apakah tertanda F (filtered)?      → filter masuk menolaknya; periksa rantai input
3. Apakah gateway terjangkau?         /routing route print detail → immediate-gw kosong?
   └─ kosong → periksa scope/target-scope dan /routing nexthop print
4. Apakah kalah seleksi?              bandingkan distance, lalu atribut BGP
5. Rute aktif tapi paket lewat jalan lain?
   └─ periksa /routing rule, mangle routing-mark, dan tabel yang dipakai
```

### Perintah yang paling sering dipakai

| Tujuan | Perintah |
|---|---|
| Semua rute termasuk yang difilter | `/routing route print detail where dst-address=X` |
| Resolusi next-hop | `/routing nexthop print` |
| Sesi BGP dan kapabilitas | `/routing bgp session print` |
| Apa yang dikirim ke tetangga | `/routing bgp advertisements print` |
| Minta ulang rute dari tetangga | `/routing bgp session refresh NAMA afi=ip` |
| Tetangga OSPF dan LSA | `/routing ospf neighbor print`, `/routing ospf lsa print` |
| Interface yang cocok dengan template | `/routing ospf interface print` |
| Proses dan memori routing | `/routing stats process print` |
| Log protokol | `/log print where topics~"bgp\|ospf"` |
| Uji regex AS-path | `/routing filter test-as-path-regexp` |
| Tangkap paket | `/tool sniffer quick port=179` |

### Tabel jebakan v6 ke v7

| Kebiasaan v6 | Kenyataan di v7 |
|---|---|
| `routing-mark=` membuat tabel otomatis | Tabel wajib dibuat di `/routing table add name=X fib` |
| `/ip route rule` | `/routing rule` |
| `/ip route vrf` | `/ip vrf` |
| `type=blackhole` | Flag `blackhole` |
| `gateway=a,b` untuk ECMP static | Dua rute terpisah dengan distance sama (dikelompokkan otomatis dengan flag `+`) |
| `/routing ospf network add` | `/routing ospf interface-template add networks=` |
| OSPF instance `default` sudah ada | Tidak ada instance atau area bawaan |
| Cost OSPF dihitung otomatis | Cost default template 1; atur manual |
| `/routing bgp peer` | `/routing bgp connection` (+ `instance` sejak 7.20) |
| `/routing bgp network` | `output.network=` berisi nama address-list |
| `/routing filter add ... action=accept` | `/routing filter rule add rule="if (...) { accept }"` |
| Akhir rantai filter = lanjut | Akhir rantai filter = reject |
| Regex AS-path per karakter | Regex per nomor AS |
| Default route BGP ikut diiklankan | Perlu `output.default-originate` |
| `remove-private-as=yes` | `output.remove-private-as=yes` |
| `address-families=` | `afi=` (7.19+) |
| Ubah target-scope satu rute bisa mematikan rute lain | Objek next-hop terpisah per kombinasi scope |
| Prepend N = tambah N | Prepend N = total N kemunculan |

---

## 12. Kesalahan Umum

⚠️ **Menyalin konfigurasi v6 dari tutorial lama.** Sebagian perintah ditolak (bagus, Anda langsung tahu), tetapi sebagian lain diterima dengan makna berbeda, terutama regex AS-path dan prepend. Selalu cek versi sumber.

⚠️ **Rantai filter tanpa `accept` di akhir.** Sesi BGP established, tetapi `prefix-count` tidak bertambah di tabel aktif, atau semua rute tampil sebagai filtered. Tambahkan aturan `accept` atau `return` yang tepat.

⚠️ **Sesi eBGP tanpa filter keluar.** Router ISP lokal menjadi transit gratis antar-upstream dan membocorkan rute. Setiap connection eBGP wajib punya `output.filter-chain` yang berakhir `reject`.

⚠️ **Rule policy routing tanpa pengecualian tujuan internal.** Pelanggan korporat tidak bisa menjangkau DNS atau server di jaringan sendiri karena paketnya dibawa ke upstream.

⚠️ **Mangle menandai lalu lintas ke router sendiri.** WinBox dan DNS router tidak bisa diakses dari LAN setelah PCC dipasang. Tambahkan `dst-address-type=!local`.

⚠️ **Static route ke loopback tanpa menaikkan target-scope.** Rute tidak aktif dan tidak ada pesan galat. Periksa kolom `TA` dan `IMMEDIATE-GW` di `/routing route print`.

⚠️ **Mengandalkan cost OSPF otomatis.** Link 10G dan 100M diperlakukan sama. Tetapkan cost secara eksplisit sesuai kebijakan yang sama dengan router vendor lain di jaringan Anda.

⚠️ **Mengharapkan default route BGP mengalir sendiri ke router internal.** Pakai `output.default-originate=if-installed` di connection yang perlu menerimanya.

⚠️ **Membuat VRF lalu langsung menambah rute di skrip.** Tabel VRF belum siap. Beri jeda.

⚠️ **Lupa bahwa layanan router tidak mengikuti VRF.** SSH ke router lewat interface VRF gagal sampai `/ip service set ssh vrf=...` diatur.

---

## 13. Ringkasan

- RouterOS v7 menulis ulang mesin routing. Konsep protokol sama, tetapi menu, parameter, dan beberapa perilaku default berbeda dari v6. Selalu periksa versi; lab ini butuh 7.20+.
- `/routing route` adalah jendela utama ke RIB: semua address family, atribut lengkap, termasuk rute yang difilter.
- Resolusi next-hop diatur scope dan target-scope: rute R boleh menyelesaikan gateway rute X jika scope(R) ≤ target-scope(X). Static default (TA 10) hanya ke connected; iBGP (TA 30) bisa lewat OSPF dan static.
- Routing table harus dibuat dengan `/routing table add name=X fib` sebelum dipakai. Routing rule pindah ke `/routing rule`; urutan dan pengecualian tujuan internal menentukan benar-salahnya policy routing. Mangle diproses sebelum pengecekan alamat lokal.
- Routing filter memakai sintaks `if (...) { ... }`; akhir rantai = reject; `jump`/`return` untuk rantai bersama; regex AS-path per nomor AS; prepend N = total N.
- OSPF v7: instance, area, interface-template (pencocok), cost default 1, autentikasi sampai SHA-512, BFD, OSPFv3 di menu yang sama.
- BGP v7: instance (7.20+), template, connection, session; role wajib; `afi=` (7.19+); network lewat address-list + rute di tabel; tanpa filter keluar semua rute BGP diiklankan; default route butuh `output.default-originate`; role RFC 9234 mencegah route leak.
- VRF di `/ip vrf`, tabel otomatis, interface VRF (7.14+), leaking statis dengan `@vrf`, leaking dinamis lewat `/routing bgp vpn` lokal.
- ECMP terbentuk dari rute setara (flag `+`); hash bisa L3, L4, atau L3-inner (7.16+); BGP multipath sejak 7.22.

---

## 14. Latihan

1. Anda menambahkan `/ip route add dst-address=0.0.0.0/0 gateway=10.255.0.2 routing-table=via-upb` di CORE (loopback BR2 dipelajari lewat OSPF). Rute muncul tanpa flag `A`. Jelaskan penyebabnya dengan angka scope dan target-scope, lalu perbaiki.
2. Seorang teknisi menyalin aturan v6 `/routing filter add chain=bgp-in prefix=10.0.0.0/8 prefix-length=8-32 action=discard` ke router v7 dan mendapat galat. Tulis padanannya di v7, dan jelaskan apa yang terjadi pada rute lain jika rantai itu hanya berisi aturan tersebut.
3. Setelah memasang PCC dua ISP di router RT-RW Net, pelanggan tidak bisa membuka halaman login hotspot di 10.5.50.1 (alamat router). Internet berjalan. Apa penyebab yang paling mungkin dan dua cara memperbaikinya di v7?
4. BR2 mengiklankan 203.0.113.0/24 ke UPB dengan `set bgp-path-prepend 2`, tetapi grafik trafik menunjukkan inbound tetap seimbang di kedua upstream. Jelaskan kenapa, dengan memperhitungkan semantik prepend RouterOS dan AS-path yang dilihat UPB.
5. Sesi iBGP BR1 ke CORE established, rute 198.51.100.0/24 sampai di CORE, tetapi default route dari UPA tidak pernah muncul di CORE. Konfigurasi filter BR1 tidak menolak 0.0.0.0/0. Apa yang kurang?
6. Seorang admin ISP menambahkan sesi eBGP ke peer di IXP tanpa `output.filter-chain`, karena "nanti saja filternya". Satu jam kemudian NOC IXP menghubunginya. Apa yang kemungkinan besar terjadi, dan bagaimana role RFC 9234 serta filter keluar mencegahnya?
7. Anda membuat VRF `mgmt` berisi ether10 dengan alamat 172.16.0.1/24, lalu mencoba SSH dari laptop NOC 172.16.0.50 ke 172.16.0.1. Koneksi gagal walaupun ping berhasil. Apa yang perlu diubah?
8. Dua link OSPF CORE ke BR1 punya cost sama, tetapi `/interface print stats` menunjukkan hampir semua trafik lewat ether2. Sebutkan dua kemungkinan penyebab dan cara memeriksanya.
9. Pelanggan korporat 203.0.113.64/26 harus keluar lewat BR2. Anda memasang rule `src-address=203.0.113.64/26 action=lookup-only-in-table table=via-upb` di CORE. Saat BR2 mati, pelanggan korporat putus total, padahal BR1 sehat. Kenapa, dan apa perubahan yang membuat mereka otomatis pindah ke BR1?

<details>
<summary>Jawaban</summary>

1. Rute static punya target-scope default 10, artinya gateway hanya boleh diselesaikan oleh rute dengan scope ≤ 10, yaitu connected. Loopback 10.255.0.2/32 adalah rute OSPF dengan scope 20, jadi tidak memenuhi. Selain itu tabel `via-upb` sendiri tidak berisi rute ke 10.255.0.2. Perbaikan: `/ip route set [find routing-table=via-upb dst-address=0.0.0.0/0] gateway=10.255.0.2@main target-scope=20`. Notasi `@main` menyuruh router mencari gateway di tabel main, dan target-scope 20 mengizinkan rute OSPF dipakai. Verifikasi dengan `/routing route print where routing-table=via-upb`: kolom `IMMEDIATE-GW` harus terisi.

2. Padanannya: `/routing filter rule add chain=bgp-in rule="if (dst in 10.0.0.0/8 && dst-len in 8-32) { reject }"`. Karena aksi default di akhir rantai v7 adalah reject, rantai yang hanya berisi aturan ini juga menolak semua rute lain, sehingga sesi BGP naik tetapi tidak ada rute yang dipakai. Tambahkan aturan kedua `rule="accept"` (atau logika lain yang Anda inginkan) setelahnya.

3. Aturan mangle `mark-routing` ikut menandai paket yang tujuannya alamat router sendiri. Karena di v7 langkah `mangle` dievaluasi sebelum `local` dalam urutan keputusan routing, paket itu di-lookup di tabel `ke-isp1` atau `ke-isp2` dan dikirim ke ISP, bukan dikirim ke proses lokal. Perbaikan pertama: tambahkan `dst-address-type=!local` pada aturan mangle yang menandai lalu lintas LAN. Perbaikan kedua (7.22+): ubah urutan `/routing settings set policy-rules=` sehingga `local` berada sebelum `mangle`.

4. Di RouterOS, `bgp-path-prepend 2` menghasilkan AS 64500 muncul dua kali total (`64500,64500`), yaitu hanya satu tambahan. UPB membandingkan jalur langsung (`64500,64500`, panjang 2) dengan jalur lewat UPA (`64501,64500`, juga panjang 2). Panjang sama, sehingga pemilihan jatuh ke kriteria berikutnya dan jalur langsung tetap menang. Nilai 3 membuat jalur langsung lebih panjang (3) dan UPB memilih lewat UPA. Perlu dicatat juga bahwa jika UPB memberi local-pref lebih tinggi untuk rute dari pelanggan dibanding dari peer, prepend tidak berpengaruh sama sekali; di situ butuh action community.

5. RouterOS v7 tidak mengiklankan default route lewat BGP kecuali diminta. Connection `ibgp-core` di BR1 perlu `output.default-originate=if-installed`, yang mengiklankan default selama BR1 sendiri punya default route aktif (dari UPA). `always` tidak cocok di sini karena BR1 akan terus mengiklankan default walau UPA putus, sehingga CORE mengirim trafik ke router yang tidak punya jalan keluar.

6. Tanpa filter keluar, RouterOS mengiklankan semua rute BGP aktif ke peer IXP, termasuk full table dari upstream transit. ISP lokal itu tiba-tiba menjadi jalur transit untuk peer-peer di IXP (route leak), dan trafik peer ke seluruh internet bisa mengalir lewat link kecil ISP tersebut, atau route server IXP menolak atau memutus sesi karena batas prefiks. Pencegahan pertama: `output.filter-chain` yang hanya meloloskan prefiks milik sendiri dan pelanggan, diakhiri `reject`. Pencegahan kedua: role `ebgp-peer` (atau `ebgp-rs-client` ke route server). Dengan role, rute dari upstream yang ditandai OTC tidak boleh dikirim ke peer, dan sesi dengan role yang tidak konsisten ditolak sejak awal. Role melengkapi, tidak menggantikan, filter prefiks.

7. Layanan router tidak otomatis mendengarkan di VRF. Ping berhasil karena ICMP ditangani kernel di VRF tersebut, tetapi layanan SSH masih terikat ke VRF `main`. Jalankan `/ip service set ssh vrf=mgmt` (dan hal yang sama untuk winbox, api, atau layanan lain yang dibutuhkan NOC). Perlu diingat juga bahwa aturan firewall `input` untuk lalu lintas VRF sejak 7.14 harus memakai interface VRF (`in-interface=mgmt`), bukan ether10.

8. Kemungkinan pertama: hash ECMP default berbasis L3 (alamat sumber dan tujuan), sehingga jika sebagian besar trafik adalah satu pasangan alamat (misalnya satu server cache ke satu gateway), semua jatuh ke satu jalur. Periksa dengan `/ip settings print` kolom `ipv4-multipath-hash-policy`, dan pertimbangkan `l4`. Kemungkinan kedua: rute yang dipakai trafik tidak benar-benar ECMP, misalnya cost salah satu template berbeda atau satu adjacency belum Full, sehingga hanya satu next-hop yang dipasang. Periksa `/routing ospf neighbor print` dan `/routing route print detail where dst-address=10.255.0.1/32`, pastikan ada dua `immediate-gw`.

9. `lookup-only-in-table` tidak pernah jatuh ke `main`. Saat BR2 mati, loopback 10.255.0.2 hilang dari OSPF, rute default di `via-upb` menjadi tidak aktif, dan lookup di tabel itu gagal, sehingga paket dibuang. Ganti aksinya menjadi `action=lookup`: jika tabel `via-upb` tidak punya rute yang cocok (karena default-nya tidak aktif), pencarian dilanjutkan ke rule berikutnya dan akhirnya ke `main`, yang default-nya mengarah ke BR1. `check-gateway=ping` pada rute di `via-upb` membantu menonaktifkan rute itu juga ketika BR2 masih ada di OSPF tetapi tidak merespons.

</details>

---

## 15. Sumber

- MikroTik, IP Routing (RIB, FIB, scope, policy rules): https://help.mikrotik.com/docs/spaces/ROS/pages/328084/IP+Routing
- MikroTik, Policy Routing: https://help.mikrotik.com/docs/spaces/ROS/pages/59965508/Policy+Routing
- MikroTik, Moving from ROSv6 to v7 with examples: https://help.mikrotik.com/docs/spaces/ROS/pages/30474256/Moving+from+ROSv6+to+v7+with+examples
- MikroTik, Route Selection and Filters: https://help.mikrotik.com/docs/spaces/ROS/pages/74678285/Route+Selection+and+Filters
- MikroTik, OSPF: https://help.mikrotik.com/docs/spaces/ROS/pages/9863229/OSPF
- MikroTik, BGP: https://help.mikrotik.com/docs/spaces/ROS/pages/328220/BGP
- MikroTik, Virtual Routing and Forwarding (VRF): https://help.mikrotik.com/docs/spaces/ROS/pages/328206/Virtual+Routing+and+Forwarding+-+VRF
- MikroTik, Routing Protocol Multi-core Support: https://help.mikrotik.com/docs/spaces/ROS/pages/34897937/Routing+Protocol+Multi-core+Support
- MikroTik, RouterOS Manual, CLI Reference (routing, ip route, routing rule): https://manual.mikrotik.com/docs/cli-reference/routing/bgp/
- MikroTik, changelog RouterOS v7 per rilis: https://download.mikrotik.com/routeros/7.24/CHANGELOG
- MikroTik, MTCRE Training Outline: https://i.mt.lv/cdn/training_pdf/mtcre_outline_2019181161836.pdf
- MikroTik, Cloud Hosted Router (CHR) dan lisensinya: https://help.mikrotik.com/docs/spaces/ROS/pages/18350234/Cloud+Hosted+Router+CHR
- Containerlab, MikroTik RouterOS kind (`mikrotik_ros`): https://containerlab.dev/manual/kinds/vr-ros/
- srl-labs/vrnetlab, MikroTik RouterOS: https://github.com/srl-labs/vrnetlab/tree/master/mikrotik/routeros
- RFC 9234, Route Leak Prevention and Detection Using Roles in UPDATE and OPEN Messages: https://www.rfc-editor.org/rfc/rfc9234
- RFC 8212, Default External BGP (EBGP) Route Propagation Behavior without Policies: https://www.rfc-editor.org/rfc/rfc8212
- RFC 5737, IPv4 Address Blocks Reserved for Documentation: https://www.rfc-editor.org/rfc/rfc5737

---

**Berikutnya:** `19-mikrotik/09-mpls-routeros` — MPLS, LDP, L3VPN, VPLS, dan RSVP-TE di RouterOS v7 untuk backbone ISP lokal.

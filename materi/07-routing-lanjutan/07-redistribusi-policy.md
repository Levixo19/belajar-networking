# 07.7 Redistribusi dan Routing Policy

> **Prasyarat:** `07-routing-lanjutan/04`-`06`
> **Tujuan:** Anda bisa meredistribusikan rute antar-protokol dengan aman, mencegah routing loop, dan menerapkan kebijakan dengan route-map dan PBR.

---

## 1. Kenapa Redistribusi Diperlukan

```
Situasi nyata:
  - Merger perusahaan: satu memakai OSPF, satu memakai EIGRP
  - Migrasi protokol bertahap
  - Perangkat vendor lain hanya mendukung OSPF
  - Rute static/connected harus masuk ke protokol dinamis
  - BGP harus menerima rute internal dari IGP
```

**Redistribusi** = mengambil rute dari satu sumber routing dan memasukkannya ke protokol lain.

> [!WARNING]
> **Redistribusi adalah salah satu operasi paling berbahaya di jaringan.** Kesalahan redistribusi dapat menyebabkan routing loop, black hole, dan suboptimal routing yang sangat sulit dilacak. Lakukan dengan sangat hati-hati.

---

## 2. Sintaks Dasar

```
# Ke OSPF
R1(config)# router ospf 1
R1(config-router)# redistribute eigrp 100 subnets metric 100 metric-type 1
R1(config-router)# redistribute static subnets
R1(config-router)# redistribute connected subnets

# Ke EIGRP
R1(config)# router eigrp 100
R1(config-router)# redistribute ospf 1 metric 10000 100 255 1 1500
R1(config-router)# redistribute static

# Ke BGP
R1(config)# router bgp 65001
R1(config-router-af)# redistribute ospf 1

# Dari BGP ke IGP (HATI-HATI — bisa memasukkan jutaan rute!)
R1(config-router)# redistribute bgp 65001 subnets
```

> [!WARNING]
> **`subnets` wajib untuk OSPF.** Tanpa kata kunci ini, OSPF hanya meredistribusikan rute classful (/8, /16, /24) dan mengabaikan sisanya secara diam-diam. Ini kesalahan yang sangat sering terjadi.

---

## 3. Seed Metric

Setiap protokol punya sistem metrik yang berbeda dan tidak sebanding. Saat redistribusi, metrik asal harus diganti dengan **seed metric**.

| Protokol tujuan | Seed metric default | Konsekuensi |
|---|---|---|
| **OSPF** | 20 (E2), atau 1 dari BGP | Rute masuk dengan cost tetap |
| **EIGRP** | Infinity | Rute TIDAK diiklankan kalau metrik tidak diset! |
| **RIP** | Infinity | Sama |
| **BGP** | Metrik IGP → MED | |
| **IS-IS** | 0 | |

> [!WARNING]
> **EIGRP dan RIP memerlukan metrik eksplisit.** Tanpa itu, redistribusi tampak berhasil di konfigurasi tetapi tidak ada rute yang benar-benar diiklankan. Gejala ini sangat membingungkan.

```
# EIGRP: bandwidth delay reliability load MTU
R1(config-router)# redistribute ospf 1 metric 10000 100 255 1 1500
                                        │     │   │   │  │
                                        │     │   │   │  └── MTU
                                        │     │   │   └── load (1 = tidak dimuat)
                                        │     │   └── reliability (255 = sempurna)
                                        │     └── delay (satuan 10 µs)
                                        └── bandwidth (kbps)

# Atau set default sekali untuk semua redistribusi
R1(config-router)# default-metric 10000 100 255 1 1500

# RIP
R1(config-router)# redistribute ospf 1 metric 5

# OSPF
R1(config-router)# redistribute eigrp 100 subnets metric 100 metric-type 1
```

### OSPF: E1 vs E2

```
metric-type 1 (E1) → cost eksternal + cost internal ke ASBR
                     → setiap router memilih ASBR TERDEKAT ✅
metric-type 2 (E2) → HANYA cost eksternal (DEFAULT)
                     → semua router melihat cost sama
```

> [!TIP]
> **Kalau ada beberapa ASBR yang meredistribusikan rute yang sama, gunakan E1** agar trafik keluar lewat pintu terdekat. E2 bisa menyebabkan trafik memutar jauh untuk mencapai ASBR yang "kebetulan" dipilih.

---

## 4. Bahaya Redistribusi

### Bahaya 1: Routing Loop

```
     OSPF Domain          R1 & R2         EIGRP Domain
   [A]────────────────────[R1]────────────────────[B]
                            │                      │
   [   ]────────────────────[R2]───────────────────[  ]
        (kedua router meredistribusi DUA ARAH)

Skenario:
1. Rute 10.1.1.0/24 berasal dari EIGRP
2. R1 meredistribusi ke OSPF → menjadi O E2 dengan cost 20
3. Rute menyebar di OSPF, sampai ke R2
4. R2 meredistribusi kembali ke EIGRP → menjadi D EX
5. AD EIGRP external = 170, AD OSPF = 110

Kalau AD dan metrik tidak diatur:
  → router bisa memilih jalur yang MEMUTAR balik
  → LOOP atau suboptimal routing
```

### Bahaya 2: Suboptimal Routing

```
Rute internal (AD lebih rendah) kalah dari rute yang diredistribusi
karena AD protokol lain lebih kecil.

Contoh: rute EIGRP internal (AD 90) di satu router,
        tetapi di router lain rute yang sama masuk lewat OSPF (AD 110)
        yang diredistribusi dari EIGRP
        → jalur berbeda dari sisi berbeda → asymmetric routing
```

### Bahaya 3: Ledakan Jumlah Rute

```
redistribute bgp 65001 into OSPF
  → 1 juta rute internet masuk ke LSDB OSPF
  → router kehabisan memori dan CPU
  → seluruh domain OSPF runtuh
```

> [!WARNING]
> **JANGAN PERNAH meredistribusi tabel BGP penuh ke IGP.** Kalau butuh konektivitas internet dari internal, gunakan default route.

---

## 5. Mitigasi: Tag, Filter, dan AD

### Teknik 1: Route Tagging (paling elegan)

Beri tanda pada rute saat redistribusi, lalu tolak rute bertanda itu saat redistribusi balik.

```
# Di R1: tandai rute yang masuk dari EIGRP ke OSPF
R1(config)# route-map EIGRP-TO-OSPF permit 10
R1(config-route-map)# set tag 100
R1(config-route-map)# exit
R1(config)# router ospf 1
R1(config-router)# redistribute eigrp 100 subnets route-map EIGRP-TO-OSPF

# Di R2: TOLAK rute bertag 100 saat redistribusi balik ke EIGRP
R2(config)# route-map OSPF-TO-EIGRP deny 10
R2(config-route-map)# match tag 100
R2(config-route-map)# exit
R2(config)# route-map OSPF-TO-EIGRP permit 20
R2(config-route-map)# set tag 200
R2(config-route-map)# exit
R2(config)# router eigrp 100
R2(config-router)# redistribute ospf 1 route-map OSPF-TO-EIGRP metric 10000 100 255 1 1500
```

> [!TIP]
> **Tagging adalah teknik terbaik** karena bekerja otomatis tanpa harus mendaftar setiap prefix. Terapkan tag di semua titik redistribusi.

### Teknik 2: Filtering dengan Prefix-List

```
R1(config)# ip prefix-list DARI-EIGRP permit 10.1.0.0/16 le 24
R1(config)# route-map FILTER permit 10
R1(config-route-map)# match ip address prefix-list DARI-EIGRP
R1(config-router)# redistribute eigrp 100 subnets route-map FILTER
```

### Teknik 3: Manipulasi Administrative Distance

```
# Naikkan AD rute OSPF external agar kalah dari EIGRP internal
R1(config-router)# distance ospf external 180

# AD spesifik per sumber dan prefix (EIGRP)
R1(config-router)# distance 200 10.0.0.2 0.0.0.0 PREFIX-LIST-NAME
```

> [!WARNING]
> Manipulasi AD kuat tetapi sulit dipahami orang lain. Dokumentasikan dengan sangat jelas.

### Teknik 4: Distribute-List

```
R1(config)# access-list 10 deny 10.1.1.0 0.0.0.255
R1(config)# access-list 10 permit any
R1(config-router)# distribute-list 10 out
R1(config-router)# distribute-list 10 in
```

---

## 6. Redistribusi Satu Arah: Lebih Aman

Kalau memungkinkan, hindari **mutual redistribution** (dua arah di dua titik).

```
Pola yang lebih aman:
  Domain A → Domain B  : redistribusi penuh
  Domain B → Domain A  : hanya DEFAULT ROUTE

Ini menghilangkan seluruh kelas masalah loop.
```

```
# Di R1: kirim default route saja ke EIGRP
R1(config)# ip route 0.0.0.0 0.0.0.0 null0 250
R1(config)# router eigrp 100
R1(config-router)# redistribute static metric 10000 100 255 1 1500
```

> [!TIP]
> **Kalau Anda harus melakukan mutual redistribution di lebih dari satu titik**, tagging menjadi wajib.

---

## 7. Route-Map: Bahasa Kebijakan Routing

### Struktur

```
route-map NAMA {permit | deny} SEQ
  match <kondisi>       ← kalau tidak ada match, cocok dengan SEMUA
  set <aksi>            ← hanya berlaku pada permit
```

**Cara kerja:**
```
1. Evaluasi sequence dari terkecil
2. Kalau SEMUA match dalam satu sequence cocok:
     permit → jalankan set, BERHENTI
     deny   → tolak rute, BERHENTI
3. Kalau tidak cocok, lanjut ke sequence berikutnya
4. Kalau tidak ada yang cocok sama sekali → IMPLICIT DENY
```

> [!WARNING]
> **Implicit deny di akhir route-map** adalah sumber masalah nomor satu. Kalau Anda hanya menulis satu `permit 10` untuk memberi tag pada sebagian rute, sisanya akan dibuang diam-diam.

```
❌ SALAH — rute selain 10.1.0.0/16 hilang:
route-map SET-TAG permit 10
 match ip address prefix-list SUBNET-A
 set tag 100

✅ BENAR — sisanya tetap lewat:
route-map SET-TAG permit 10
 match ip address prefix-list SUBNET-A
 set tag 100
route-map SET-TAG permit 20
 ! kosong = cocok semua, lewatkan tanpa perubahan
```

### Kondisi `match` yang tersedia

```
match ip address <acl | prefix-list>
match ip next-hop <acl>
match ip route-source <acl>
match interface <intf>
match metric <nilai>
match route-type {internal | external | level-1 | level-2}
match tag <nilai>
match community <community-list>       (BGP)
match as-path <as-path-list>           (BGP)
match length <min> <max>               (untuk PBR)
```

### Aksi `set` yang tersedia

```
set metric <nilai>
set metric-type {type-1 | type-2 | internal | external}
set tag <nilai>
set ip next-hop <ip>
set ip next-hop verify-availability <ip> <seq> track <n>
set local-preference <nilai>           (BGP)
set weight <nilai>                     (BGP)
set as-path prepend <as> <as>          (BGP)
set community <nilai> [additive]       (BGP)
set origin {igp | egp | incomplete}    (BGP)
set interface <intf>                   (PBR)
set ip df 0                            (PBR)
```

### Beberapa match dalam satu sequence

```
route-map CONTOH permit 10
 match ip address prefix-list A
 match ip address prefix-list B     ← OR (dalam kategori yang sama)
 match metric 100                   ← AND (kategori berbeda)
```

Aturannya: match dalam kategori yang sama = OR; kategori berbeda = AND.

---

## 8. Policy-Based Routing (PBR)

Routing normal hanya melihat alamat tujuan. PBR memungkinkan keputusan berdasarkan alamat sumber, protokol, port, ukuran paket, dan lainnya.

### Kasus penggunaan

```
- Trafik dari VLAN tamu → keluar lewat ISP murah
- Trafik dari VLAN server → keluar lewat ISP premium
- Trafik VoIP → jalur latency rendah
- Trafik backup → jalur bandwidth besar
- Memaksa trafik tertentu melewati firewall/proxy
```

### Konfigurasi

```
# 1. Definisikan trafik yang ditargetkan
R1(config)# access-list 101 permit ip 192.168.30.0 0.0.0.255 any
   ← VLAN tamu

# 2. Buat route-map
R1(config)# route-map PBR-TAMU permit 10
R1(config-route-map)# match ip address 101
R1(config-route-map)# set ip next-hop 198.51.100.1        ← ISP murah
R1(config-route-map)# exit
   ← paket yang tidak cocok dengan sequence mana pun tetap di-routing
     normal berdasarkan tujuan; tidak perlu sequence permit kosong

# 3. Terapkan pada interface MASUK
R1(config)# interface vlan 30
R1(config-if)# ip policy route-map PBR-TAMU

# Untuk trafik yang DIHASILKAN ROUTER SENDIRI
R1(config)# ip local policy route-map PBR-LOKAL
```

> [!WARNING]
> **PBR diterapkan pada interface INGRESS** (tempat trafik masuk), bukan egress.

> [!NOTE]
> **Implicit deny pada PBR tidak membuang paket.** Route-map yang sama artinya berbeda menurut pemakaiannya. Pada redistribusi (§7), rute yang tidak cocok dengan sequence mana pun memang tidak diredistribusi. Pada PBR, paket yang tidak cocok, atau yang cocok dengan sequence `deny`, hanya **tidak di-policy-route**: router meneruskannya lewat routing biasa berdasarkan alamat tujuan. Sequence `deny` di PBR dipakai untuk mengecualikan sebagian trafik dari kebijakan, bukan untuk memblokirnya. Kalau trafik memang harus dibuang, pakai ACL di interface atau `set interface Null0`.

### PBR dengan verifikasi ketersediaan

```
R1(config)# route-map PBR-TAMU permit 10
R1(config-route-map)# match ip address 101
R1(config-route-map)# set ip next-hop verify-availability 198.51.100.1 10 track 1
R1(config-route-map)# set ip next-hop verify-availability 203.0.113.1 20 track 2
```
Kalau next-hop pertama tidak tersedia (track down), pakai yang kedua.

### Verifikasi

```
R1# show ip policy
R1# show route-map
R1# debug ip policy
```

> [!WARNING]
> **PBR sering diproses CPU** pada beberapa platform (bukan hardware), sehingga bisa menurunkan throughput drastis. Verifikasi bahwa platform Anda mendukung PBR di hardware sebelum menerapkannya pada trafik volume tinggi.

---

## 9. VRF-Lite

**VRF** (*Virtual Routing and Forwarding*) memungkinkan satu router memiliki beberapa routing table yang terpisah total.

```
              ┌─────────── ROUTER FISIK ───────────┐
              │                                     │
              │  VRF PELANGGAN-A   VRF PELANGGAN-B  │
              │  ┌─────────────┐   ┌─────────────┐  │
              │  │ routing tbl │   │ routing tbl │  │
              │  │ 10.0.0.0/8  │   │ 10.0.0.0/8  │  │  ← alamat SAMA,
              │  └─────────────┘   └─────────────┘  │     tidak konflik!
              └─────────────────────────────────────┘
```

### Kegunaan

- **Multi-tenancy**: beberapa pelanggan/departemen dengan isolasi penuh
- **Alamat tumpang tindih**: dua entitas memakai 192.168.1.0/24 yang sama
- **Segmentasi keamanan**: pemisahan pada layer 3 (lebih kuat daripada VLAN)
- **Manajemen out-of-band**: VRF `Mgmt-vrf` terpisah dari trafik produksi

### Konfigurasi VRF-Lite

```
R1(config)# vrf definition PELANGGAN-A
R1(config-vrf)# rd 65001:100
R1(config-vrf)# address-family ipv4
R1(config-vrf-af)# exit-address-family

R1(config)# interface gi0/1
R1(config-if)# vrf forwarding PELANGGAN-A       ← ⚠️ menghapus IP yang ada!
R1(config-if)# ip address 10.0.0.1 255.255.255.0

# Static route dalam VRF
R1(config)# ip route vrf PELANGGAN-A 192.168.1.0 255.255.255.0 10.0.0.2

# Routing protocol dalam VRF
R1(config)# router ospf 10 vrf PELANGGAN-A
R1(config-router)# network 10.0.0.0 0.0.0.255 area 0

# Verifikasi
R1# show vrf
R1# show ip route vrf PELANGGAN-A
R1# ping vrf PELANGGAN-A 10.0.0.2
R1# traceroute vrf PELANGGAN-A 10.0.0.2
R1# telnet 10.0.0.2 /vrf PELANGGAN-A
```

> [!WARNING]
> **`vrf forwarding` menghapus konfigurasi IP pada interface.** Konfigurasikan VRF terlebih dahulu, baru pasang alamat IP.

### Route leaking antar-VRF

Kadang perlu membocorkan rute tertentu antar-VRF (mis. akses ke server bersama):
```
R1(config-vrf)# address-family ipv4
R1(config-vrf-af)# route-target export 65001:100
R1(config-vrf-af)# route-target import 65001:200
```
Membutuhkan MP-BGP. Untuk kasus sederhana, bisa memakai static route antar-VRF.

> [!TIP]
> **VRF-Lite** = VRF tanpa MPLS (isolasi lokal per perangkat). **VRF dengan MPLS L3VPN** memungkinkan isolasi menyeberang jaringan provider (`11-wan-vpn/01`).

---

## 10. Ringkasan

- Redistribusi memindahkan rute antar-protokol; berbahaya dan bisa menyebabkan loop, black hole, dan suboptimal routing.
- **`subnets` wajib untuk OSPF.** Tanpa itu hanya rute classful yang diredistribusi.
- **EIGRP dan RIP butuh seed metric eksplisit.** Tanpa itu metriknya infinity dan rute tidak diiklankan sama sekali.
- **OSPF E1** menambahkan cost internal (pilih ASBR terdekat); E2 (default) tidak.
- **JANGAN meredistribusi tabel BGP penuh ke IGP**; pakai default route.
- Mitigasi loop: route tagging (terbaik), filtering, manipulasi AD, distribute-list.
- **Redistribusi satu arah + default route balik** jauh lebih aman daripada mutual redistribution.
- **Route-map punya implicit deny**, jadi selalu akhiri dengan `permit` kosong bila ingin melewatkan sisanya.
- Match dalam kategori sama = OR; kategori berbeda = AND.
- **PBR** merutekan berdasarkan sumber/protokol/port; diterapkan pada interface ingress; periksa dukungan hardware.
- **VRF** memberi routing table terpisah dalam satu perangkat, dipakai untuk multi-tenancy, alamat tumpang tindih, dan isolasi keamanan.

---

## 11. Latihan

1. Anda meredistribusi OSPF ke EIGRP tetapi tidak ada rute yang muncul di EIGRP. Apa yang terlupa?
2. Anda meredistribusi EIGRP ke OSPF dengan `redistribute eigrp 100`. Hanya sebagian rute yang muncul. Kenapa?
3. Jelaskan bagaimana route tagging mencegah loop pada mutual redistribution.
4. Sebuah route-map dibuat untuk memberi tag pada subnet 10.1.0.0/16. Setelah diterapkan, semua rute lain hilang. Kenapa?
5. Kapan Anda memilih E1 dibanding E2 untuk rute eksternal OSPF?
6. Apa perbedaan VLAN dan VRF dalam hal isolasi?
7. Anda ingin trafik dari VLAN 30 keluar lewat ISP-B sementara trafik lain lewat ISP-A. Bagaimana konfigurasinya?

<details>
<summary>Jawaban</summary>

1. **Seed metric tidak diset.** EIGRP memberikan metrik infinity untuk rute yang diredistribusi tanpa metrik eksplisit, sehingga rute dianggap tidak terjangkau dan tidak pernah diiklankan. Perbaikan:
   ```
   redistribute ospf 1 metric 10000 100 255 1 1500
   ```
   atau set sekali: `default-metric 10000 100 255 1 1500`. Hal yang sama berlaku untuk RIP (`metric 5`).

2. **Kata kunci `subnets` tidak disertakan.** Tanpa `subnets`, OSPF hanya meredistribusikan rute yang merupakan jaringan classful (/8, /16, /24 tepat pada batas kelas) dan mengabaikan semua subnet lainnya secara diam-diam. Perbaikan: `redistribute eigrp 100 subnets`.

3. **Route tagging** memberi "cap" pada rute saat pertama kali diredistribusi. Misalnya semua rute EIGRP yang masuk ke OSPF diberi `tag 100`. Ketika rute itu menyebar melalui OSPF dan sampai ke router kedua yang juga melakukan redistribusi balik ke EIGRP, router tersebut memeriksa tag: rute bertag 100 ditolak (`route-map ... deny 10 / match tag 100`), karena artinya rute itu memang berasal dari EIGRP. Dengan demikian rute tidak pernah kembali ke domain asalnya, dan loop dicegah tanpa perlu mendaftar setiap prefix secara manual. Terapkan tag di semua titik redistribusi agar konsisten.

4. Karena route-map punya implicit deny di akhir. Route-map dengan hanya satu `permit 10` yang cocok dengan subnet 10.1.0.0/16 akan menolak semua rute lain yang tidak cocok dengan match itu. Perbaikan: tambahkan sequence permit kosong di akhir:
   ```
   route-map SET-TAG permit 20
   ```
   Sequence tanpa `match` cocok dengan semua rute dan melewatkannya tanpa perubahan.

5. Pilih **E1** ketika ada beberapa ASBR yang meredistribusikan rute eksternal yang sama. E1 menambahkan cost internal (jarak ke ASBR) ke metrik eksternal, sehingga setiap router otomatis memilih ASBR terdekat dan routing menjadi optimal. Dengan E2 (default), semua router melihat metrik yang sama tanpa memandang jarak ke ASBR, sehingga tie-breaker berikutnya (cost ke ASBR) baru dipakai. Pada topologi tertentu, hasilnya bisa berupa pilihan yang tidak intuitif. E2 tetap berguna kalau Anda ingin metrik eksternal konsisten di seluruh domain (mis. untuk membedakan kualitas rute eksternal itu sendiri).

6. **VLAN** memisahkan pada Layer 2, yaitu memisahkan broadcast domain. Perangkat di VLAN berbeda tetap bisa berkomunikasi begitu ada routing di antara mereka, dan semuanya berbagi satu routing table. Alamat IP harus unik di seluruh perangkat.
   **VRF** memisahkan pada Layer 3 dengan memberi routing table yang sepenuhnya terpisah. Dua VRF bisa memakai rentang alamat IP yang identik tanpa konflik, dan trafik tidak bisa berpindah antar-VRF kecuali dikonfigurasi eksplisit (route leaking). Isolasi VRF jauh lebih kuat: bahkan router itu sendiri memperlakukan keduanya sebagai jaringan yang berbeda sama sekali.

7. **Policy-Based Routing:**
   ```
   ! 1. Identifikasi trafik
   access-list 130 permit ip 192.168.30.0 0.0.0.255 any

   ! 2. Route-map
   route-map PBR-VLAN30 permit 10
    match ip address 130
    set ip next-hop verify-availability 198.51.100.1 10 track 2   ! ISP-B
   ! Paket yang tidak cocok dengan permit 10 di-routing normal
   ! berdasarkan tujuan, jadi tidak perlu sequence tambahan.

   ! 3. Terapkan pada interface INGRESS
   interface vlan 30
    ip policy route-map PBR-VLAN30
   ```
   Catatan: trafik yang tidak cocok dengan ACL 130 tidak dibuang. Pada PBR, implicit deny berarti paket tidak di-policy-route, sehingga router meneruskannya lewat routing biasa ke ISP-A. Ini berbeda dengan route-map untuk redistribusi, tempat implicit deny memang menyaring rute. Gunakan `verify-availability` + tracking agar trafik jatuh kembali ke routing normal bila ISP-B mati. Verifikasi dukungan PBR di hardware pada platform Anda.

</details>

---

## 12. Sumber

- Cisco, *Route Redistribution* (Document ID 8606)
- Cisco, [*IP Routing: Protocol-Independent Configuration Guide, Policy-Based Routing*](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_pi/configuration/xe-16/iri-xe-16-book/iri-pbr.html): paket yang cocok dengan entri `deny` atau tidak cocok sama sekali diteruskan dengan algoritma forwarding biasa
- Cisco, *VRF-lite Configuration Guide*
- RFC 4364, BGP/MPLS IP VPNs (konsep VRF & route target)

---

**Berikutnya:** `07-routing-lanjutan/08-fhrp.md`. Redundansi default gateway.

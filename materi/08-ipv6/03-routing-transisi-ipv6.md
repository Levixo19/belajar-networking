# 08.3 Routing IPv6 dan Strategi Transisi

> **Prasyarat:** `08-ipv6/01`, `08-ipv6/02`, `07-routing-lanjutan/04`
> **Tujuan:** Anda bisa mengonfigurasi routing IPv6 dengan semua protokol utama, dan memilih strategi transisi yang tepat.

---

## 1. Routing IPv6

Konsepnya identik dengan IPv4; yang berubah hanya sintaks dan beberapa detail.

### Static Route

```
R1(config)# ipv6 unicast-routing                        ← WAJIB

R1(config)# ipv6 route 2001:db8:10::/64 2001:db8:1::2
R1(config)# ipv6 route 2001:db8:10::/64 gi0/1 fe80::2   ← link-local WAJIB pakai interface
R1(config)# ipv6 route ::/0 2001:db8:1::1               ← default route
R1(config)# ipv6 route 2001:db8:10::/64 null0           ← blackhole
R1(config)# ipv6 route 2001:db8:10::/64 2001:db8:1::9 130   ← floating static

R1# show ipv6 route
R1# show ipv6 route static
R1# show ipv6 route 2001:db8:10::5
```

> [!WARNING]
> **Next hop link-local WAJIB disertai exit interface**, karena `fe80::2` tidak unik secara global:
```
✅ ipv6 route 2001:db8:10::/64 gi0/1 fe80::2
❌ ipv6 route 2001:db8:10::/64 fe80::2         ← ditolak
```

### OSPFv3

```
R1(config)# ipv6 unicast-routing
R1(config)# ipv6 router ospf 1
R1(config-rtr)# router-id 1.1.1.1               ← WAJIB manual (tidak ada IPv4 untuk diambil)
R1(config-rtr)# auto-cost reference-bandwidth 100000

R1(config)# interface gi0/1
R1(config-if)# ipv6 ospf 1 area 0               ← selalu per interface, tidak ada "network"

R1# show ipv6 ospf neighbor
R1# show ipv6 ospf interface
R1# show ipv6 route ospf
```

**Perbedaan dari OSPFv2:**
| Aspek | OSPFv2 | OSPFv3 |
|---|---|---|
| Aktivasi | `network` atau per interface | Selalu per interface |
| Router ID | Bisa otomatis dari IPv4 | Wajib manual |
| Adjacency | Lewat alamat IPv4 subnet | Lewat link-local |
| Multicast | 224.0.0.5 / 224.0.0.6 | FF02::5 / FF02::6 |
| Autentikasi | Bawaan (MD5/SHA) | IPsec (atau auth trailer RFC 7166) |
| Address family | IPv4 saja | IPv4 dan IPv6 |

> [!TIP]
> Karena adjacency memakai link-local, interface tidak perlu punya alamat global untuk membentuk tetangga OSPFv3. Ini memudahkan desain "IPv6 unnumbered".

### EIGRP untuk IPv6

```
# Classic
R1(config)# ipv6 router eigrp 100
R1(config-rtr)# eigrp router-id 1.1.1.1
R1(config-rtr)# no shutdown                     ← ⚠️ WAJIB — shutdown by default!
R1(config)# interface gi0/1
R1(config-if)# ipv6 eigrp 100

# Named mode (lebih baik — satu proses untuk IPv4 dan IPv6)
R1(config)# router eigrp PERUSAHAAN
R1(config-router)# address-family ipv6 unicast autonomous-system 100
R1(config-router-af)# eigrp router-id 1.1.1.1
R1(config-router-af)# af-interface gi0/1
R1(config-router-af-interface)# no passive-interface
```

> [!WARNING]
> **`no shutdown` pada proses EIGRPv6 classic sangat sering terlupa.** Konfigurasi terlihat benar tetapi tidak ada adjacency sama sekali.

### MP-BGP untuk IPv6

```
R1(config)# router bgp 65001
R1(config-router)# bgp router-id 1.1.1.1
R1(config-router)# no bgp default ipv4-unicast
R1(config-router)# neighbor 2001:db8:1::2 remote-as 65002

R1(config-router)# address-family ipv6 unicast
R1(config-router-af)# neighbor 2001:db8:1::2 activate
R1(config-router-af)# network 2001:db8:acad::/48

R1# show bgp ipv6 unicast summary
R1# show bgp ipv6 unicast
```

> [!WARNING]
> **`no bgp default ipv4-unicast` penting.** Tanpa itu, setiap neighbor otomatis diaktifkan untuk IPv4 unicast, yang sering tidak diinginkan pada peering IPv6.

> [!TIP]
> **BGP unnumbered** memakai link-local untuk peering, sehingga Anda tidak perlu mengalokasikan alamat untuk link P2P:
```
# FRRouting
interface swp1
 no ipv6 nd suppress-ra
router bgp 65001
 neighbor swp1 interface remote-as external
```

### RIPng

```
R1(config)# ipv6 router rip RIPPROC
R1(config)# interface gi0/1
R1(config-if)# ipv6 rip RIPPROC enable
```
(Tidak ada `network`; RIPng diaktifkan per interface. Jangan dipakai di produksi.)

### IS-IS

IS-IS mendukung IPv4 dan IPv6 secara alami dalam satu proses karena ia berjalan langsung di layer 2 (CLNS), bukan di atas IP. Ini alasan banyak service provider memilihnya.

---

## 2. Strategi Transisi

Ada tiga keluarga besar. Pilihannya bergantung situasi.

```
1. DUAL STACK   — jalankan IPv4 dan IPv6 bersamaan
2. TUNNELING    — bawa IPv6 di dalam IPv4 (atau sebaliknya)
3. TRANSLATION  — terjemahkan antara IPv6 dan IPv4
```

---

## 3. Dual Stack: Pendekatan yang Direkomendasikan

Setiap perangkat menjalankan IPv4 dan IPv6 secara bersamaan.

```
R1(config)# interface gi0/0
R1(config-if)# ip address 192.168.1.1 255.255.255.0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
```

**Cara host memilih:**
- DNS mengembalikan A (IPv4) dan/atau AAAA (IPv6)
- Kalau ada AAAA, host mengutamakan IPv6 (RFC 6724)
- **Happy Eyeballs** (RFC 8305): coba keduanya paralel, pakai yang lebih dulu berhasil

> [!TIP]
> **Kenapa Happy Eyeballs perlu:** tanpa itu, IPv6 yang bermasalah menyebabkan timeout panjang sebelum fallback ke IPv4, dan pengalaman pengguna menjadi buruk. Dengan Happy Eyeballs, browser memberi IPv6 keunggulan kecil (~50-300 ms) lalu langsung beralih ke IPv4 kalau tidak responsif.

| Kelebihan | Kekurangan |
|---|---|
| Paling sederhana secara konseptual | Harus mengelola dua stack, dua set ACL, dua set rute |
| Tidak ada translasi yang merusak aplikasi | Butuh alamat IPv4 (yang langka) |
| Fallback alami | Permukaan serangan ganda |
| Migrasi bertahap | Troubleshooting lebih rumit |

> [!WARNING]
> **Bahaya keamanan dual stack:** banyak organisasi mengonfigurasi firewall IPv4 dengan ketat tetapi lupa IPv6, padahal IPv6 aktif secara default dan lebih diutamakan host. Akibatnya ada pintu belakang yang terbuka lebar.

**Selalu:** buat kebijakan firewall IPv6 yang setara dengan IPv4, dan uji keduanya.

---

## 4. Tunneling

Tunneling membawa paket IPv6 di dalam paket IPv4 (atau sebaliknya).

| Mekanisme | RFC | Cara kerja | Status |
|---|---|---|---|
| **Manual / 6in4** | 4213 | Tunnel statis IPv6-in-IPv4 (protokol 41) | Masih dipakai (tunnel broker) |
| **GRE** | 2784 | Tunnel generik yang bisa membawa IPv6 | Umum di enterprise |
| **6to4** | 3056 | Otomatis, memakai `2002::/16` | Usang, tidak andal |
| **Teredo** | 4380 | IPv6 lewat UDP, menembus NAT | Praktis mati |
| **ISATAP** | 5214 | Intra-site, memperlakukan IPv4 sebagai link | Jarang |
| **6rd** | 5969 | 6to4 versi ISP dengan prefix sendiri | Dipakai beberapa ISP |
| **DS-Lite** | 6333 | IPv4 di dalam IPv6 (untuk ISP IPv6-only) | Dipakai ISP modern |
| **MAP-E/MAP-T** | 7597/7599 | IPv4 di atas IPv6 dengan port sharing | Dipakai ISP besar |

### Manual tunnel (6in4)

```
R1(config)# interface tunnel 0
R1(config-if)# ipv6 address 2001:db8:ffff::1/64
R1(config-if)# tunnel source 203.0.113.1
R1(config-if)# tunnel destination 198.51.100.1
R1(config-if)# tunnel mode ipv6ip

R1(config)# ipv6 route ::/0 tunnel 0

R1# show interfaces tunnel 0
R1# show ipv6 interface tunnel 0
```

### GRE tunnel (lebih fleksibel)

```
R1(config)# interface tunnel 0
R1(config-if)# ipv6 address 2001:db8:ffff::1/64
R1(config-if)# tunnel source gi0/0
R1(config-if)# tunnel destination 198.51.100.1
R1(config-if)# tunnel mode gre ip
```

> [!WARNING]
> **Tunnel mengurangi MTU** (6in4: 20 byte, GRE: 24 byte). Karena IPv6 punya MTU minimum 1280 dan router tidak boleh memfragmentasi, MTU harus disesuaikan:
```
R1(config-if)# ipv6 mtu 1280
R1(config-if)# tunnel path-mtu-discovery
```

> [!TIP]
> **Tunnel adalah solusi sementara.** Ia menambah overhead, latency, kompleksitas troubleshooting, dan sering jadi bottleneck karena diproses CPU. Gunakan untuk migrasi, bukan sebagai arsitektur permanen.

---

## 5. Translation

### NAT64 + DNS64

Mekanisme ini memungkinkan klien IPv6-only mengakses server IPv4-only.

```
1. Klien IPv6-only mencari "example.com" (yang hanya punya A record)
2. DNS64 server melihat tidak ada AAAA
3. DNS64 MENSINTESIS AAAA palsu:
   64:ff9b:: + alamat IPv4 (32 bit)
   93.184.216.34 → 64:ff9b::5db8:d822
4. Klien mengirim ke 64:ff9b::5db8:d822
5. NAT64 gateway menerjemahkannya ke IPv4 asli
6. Balasan diterjemahkan kembali ke IPv6
```

**Prefix well-known NAT64: `64:ff9b::/96`** [RFC 6052]

```
R1(config)# nat64 prefix stateful 64:ff9b::/96
R1(config)# nat64 v4 pool POOL1 203.0.113.10 203.0.113.20
R1(config)# nat64 v6v4 list ACL-V6 pool POOL1 overload
R1(config-if)# nat64 enable
```

> [!WARNING]
> **Keterbatasan NAT64/DNS64:**
- Aplikasi yang menyertakan alamat IPv4 literal (bukan nama domain) tidak akan bekerja
- **DNSSEC rusak**: DNS64 memodifikasi jawaban, sehingga tanda tangan tidak valid
- Beberapa protokol dengan alamat di payload (FTP aktif, SIP tanpa ALG) bermasalah

### 464XLAT

Mekanisme ini menambahkan **CLAT** (customer-side translator) di perangkat klien, sehingga aplikasi IPv4-only tetap bekerja di jaringan IPv6-only.

```
[Aplikasi IPv4-only]
        ↓
   CLAT (di ponsel/perangkat) → terjemahkan IPv4 ke IPv6
        ↓
   Jaringan IPv6-only
        ↓
   PLAT / NAT64 (di operator) → terjemahkan kembali ke IPv4
        ↓
   Internet IPv4
```

> [!TIP]
> **Inilah yang membuat jaringan seluler IPv6-only bekerja.** Banyak operator besar (T-Mobile US, Jio, dan lainnya) menjalankan jaringan IPv6-only dengan 464XLAT, dan pengguna tidak menyadarinya sama sekali. Android dan iOS mendukung CLAT secara bawaan.

### NPTv6

**Network Prefix Translation** [RFC 6296] menerjemahkan prefix saja, bersifat stateless dan 1:1.

```
fd00:1234::/48  ←→  2001:db8:abcd::/48
```

Berguna untuk: multihoming tanpa BGP, atau menjaga alamat internal stabil saat prefix ISP berubah.

> [!WARNING]
> **Bukan NAT66 dengan port translation.** NPTv6 stateless dan tidak merusak konektivitas end-to-end sebanyak NAT44. Tetap saja, gunakan hanya kalau benar-benar perlu.

---

## 6. Strategi Migrasi Praktis

### Fase-fase yang disarankan

```
FASE 0 — PERSIAPAN (bulan 1–3)
  □ Audit perangkat: mana yang mendukung IPv6?
  □ Audit aplikasi: mana yang hard-code alamat IPv4?
  □ Ajukan alokasi IPv6 ke RIR/ISP (minta /48 untuk enterprise)
  □ Rancang skema pengalamatan hierarkis
  □ Latih tim
  □ Pastikan monitoring dan logging mendukung IPv6

FASE 1 — INTERNET EDGE (bulan 3–6)
  □ Aktifkan IPv6 di router edge
  □ Peering BGP IPv6 dengan ISP
  □ Publikasikan AAAA untuk situs publik
  □ Konfigurasikan firewall IPv6 (SETARA dengan IPv4!)
  □ Uji dari luar

FASE 2 — DMZ DAN SERVER PUBLIK (bulan 6–9)
  □ Dual stack pada web server, mail server, DNS
  □ Load balancer mendukung IPv6
  □ Pantau trafik IPv6 yang masuk

FASE 3 — INFRASTRUKTUR INTERNAL (bulan 9–15)
  □ Dual stack pada core dan distribution
  □ Routing IPv6 (OSPFv3/IS-IS/BGP)
  □ DNS internal dengan AAAA
  □ NTP, monitoring, manajemen lewat IPv6

FASE 4 — ACCESS LAYER (bulan 15–24)
  □ Dual stack pada VLAN pengguna
  □ RA / DHCPv6
  □ First-hop security (RA Guard, DHCPv6 Guard)
  □ Uji per departemen secara bertahap

FASE 5 — IPv6-ONLY (bertahap, jangka panjang)
  □ Segmen baru langsung IPv6-only + NAT64
  □ Kurangi ketergantungan IPv4
  □ Pertahankan IPv4 hanya untuk legacy yang benar-benar perlu
```

### Prinsip

1. **Mulai dari edge, bukan dari core.** Konektivitas internet IPv6 memberi nilai langsung.
2. **Jangan tunggu sempurna.** Aktifkan bertahap; dual stack memberi fallback alami.
3. **Firewall IPv6 dari hari pertama.** Ini kesalahan paling berbahaya kalau terlewat.
4. **Uji monitoring dan logging.** Banyak alat lama tidak menangani IPv6 dengan benar.
5. **Perhatikan aplikasi**, bukan hanya jaringan: aplikasi yang menyimpan alamat sebagai `VARCHAR(15)` akan rusak.

### Perencanaan alamat

Alokasi tipikal untuk enterprise dengan `/48`:
```
2001:db8:abcd::/48  ← alokasi organisasi

Bagi berdasarkan lokasi (16 bit subnet ID):
  2001:db8:abcd:0000::/56  → Kantor Pusat
      2001:db8:abcd:0000::/64  → Manajemen
      2001:db8:abcd:0001::/64  → Staff
      2001:db8:abcd:0002::/64  → Server
      2001:db8:abcd:0003::/64  → Tamu
      ...
  2001:db8:abcd:0100::/56  → Cabang Bandung
  2001:db8:abcd:0200::/56  → Cabang Surabaya
  2001:db8:abcd:ff00::/56  → Data Center
```

> [!TIP]
> **Rancang untuk kemudahan dibaca, bukan untuk berhemat.** Alamat IPv6 tidak akan habis. Skema yang mudah dibaca manusia jauh lebih bernilai daripada skema yang padat. Misalnya, memakai VLAN ID sebagai subnet ID (`2001:db8:abcd:0010::/64` untuk VLAN 10) sangat memudahkan operasi.

---

## 7. Keamanan IPv6

### Perbedaan permukaan serangan

| Aspek | IPv4 | IPv6 |
|---|---|---|
| **Pemindaian** | /24 = 254 host, dipindai dalam detik | /64 = 18 kuintiliun, tidak mungkin dipindai brute force |
| **NAT sebagai "firewall"** | Sering diandalkan (keliru) | Tidak ada NAT → firewall stateful WAJIB |
| **Extension header** | - | Bisa dipakai mengelabui firewall |
| **ICMP** | Bisa diblokir | Tidak boleh diblokir |
| **Rogue RA** | Setara rogue DHCP | Lebih mudah dan lebih sering tidak disengaja |
| **Alamat sementara** | - | Privacy extension menyulitkan pelacakan |

> [!WARNING]
> **Pemindaian IPv6 tetap mungkin** dengan cara lain: melalui DNS enumeration, log, alamat yang mudah ditebak (`::1`, `::2`, `::80`), alamat EUI-64 (jika OUI diketahui), dan Certificate Transparency logs.

> [!TIP]
> Karena itu, jangan memakai alamat yang mudah ditebak untuk server yang sensitif; gunakan interface ID acak.

### Checklist keamanan IPv6

```
□ Firewall IPv6 SETARA dengan IPv4 (jangan sampai terlupa!)
□ Izinkan ICMPv6 yang diperlukan (RFC 4890) — jangan blokir total
□ RA Guard di semua port access
□ DHCPv6 Guard
□ IPv6 Snooping + Source Guard
□ Batasi/filter extension header yang mencurigakan
□ Batasi neighbor cache (anti NDP exhaustion)
□ Nonaktifkan tunnel otomatis yang tidak dipakai (6to4, Teredo, ISATAP)
□ uRPF untuk anti-spoofing
□ Monitoring dan logging IPv6 aktif
□ IDS/IPS memahami IPv6
```

```
# Nonaktifkan tunnel otomatis (mengurangi permukaan serangan)
R1(config)# no ipv6 source-route

# uRPF
R1(config-if)# ipv6 verify unicast source reachable-via rx

# Batasi extension header (contoh)
R1(config)# ipv6 access-list FILTER-EH
R1(config-ipv6-acl)# deny ipv6 any any routing-type 0    ← RH0 dilarang RFC 5095
R1(config-ipv6-acl)# permit ipv6 any any
```

---

## 8. Verifikasi Konektivitas IPv6

```bash
# Uji dasar
$ ping6 -c4 2606:4700:4700::1111
$ ping6 -c4 ipv6.google.com
$ traceroute6 ipv6.google.com

# Uji dari sisi aplikasi
$ curl -6 https://ipv6.google.com
$ curl -6 https://ifconfig.co        # lihat IPv6 publik Anda
$ dig AAAA example.com

# Situs uji lengkap
$ curl -s https://test-ipv6.com      # atau buka di browser

# Cek apakah host mengutamakan IPv6
$ getent ahosts google.com
2a00:1450:4001:80f::200e STREAM google.com    ← IPv6 lebih dulu = benar
142.250.185.78          STREAM

# Cek MTU jalur IPv6
$ ping6 -M do -s 1232 tujuan          # 1232 + 48 = 1280 (MTU minimum)
$ tracepath6 tujuan
```

```
# Cisco
R1# ping ipv6 2001:db8::1
R1# ping ipv6 2001:db8::1 source loopback0 size 1400
R1# traceroute ipv6 2001:db8::1
R1# show ipv6 interface brief
R1# show ipv6 route summary
R1# show ipv6 traffic
```

---

## MikroTik RouterOS

### Static route dan OSPFv3

```
# Static route IPv6
/ipv6 route add dst-address=2001:db8:10::/64 gateway=2001:db8:1::2
/ipv6 route add dst-address=2001:db8:10::/64 gateway=fe80::2%ether2   ← link-local + interface
/ipv6 route add dst-address=::/0 gateway=2001:db8:1::1
/ipv6 route print

# OSPFv3 (RouterOS v7 — satu instance untuk IPv4 dan IPv6)
/routing ospf instance add name=ospf-v3 version=3 router-id=1.1.1.1
/routing ospf area add name=backbone-v3 area-id=0.0.0.0 instance=ospf-v3
/routing ospf interface-template add interfaces=ether2 area=backbone-v3

/routing ospf neighbor print
```

### Tunnel IPv6-in-IPv4 (6in4)

Sangat berguna untuk mendapat IPv6 dari tunnel broker (mis. Hurricane Electric) ketika ISP belum menyediakan IPv6.

```
/interface 6to4 add name=he-tunnel remote-address=216.66.80.30 \
    local-address=203.0.113.10 disabled=no

/ipv6 address add address=2001:470:1f0a:1::2/64 interface=he-tunnel
/ipv6 route add dst-address=::/0 gateway=2001:470:1f0a:1::1

# Prefix yang dirutekan ke Anda dipakai di LAN
/ipv6 address add address=2001:470:1f0b:1::1/64 interface=bridge-LAN advertise=yes
```

> [!WARNING]
> **Tunnel mengurangi MTU.** Set `/ipv6 nd` untuk mengumumkan MTU yang benar:
```
/interface 6to4 set he-tunnel mtu=1280
```

### Firewall IPv6: WAJIB

```
/ipv6 firewall filter
add chain=input action=accept connection-state=established,related
add chain=input action=accept protocol=icmpv6 comment="WAJIB — jangan blokir ICMPv6!"
add chain=input action=accept src-address-list=MGMT
add chain=input action=drop in-interface-list=WAN

add chain=forward action=accept connection-state=established,related
add chain=forward action=accept protocol=icmpv6
add chain=forward action=accept in-interface-list=LAN out-interface-list=WAN
add chain=forward action=drop in-interface-list=WAN comment="Tolak inisiasi dari internet"
```

> [!WARNING]
> **Ini bagian paling kritis dari dual stack.** Tanpa NAT, setiap host IPv6 dapat dijangkau langsung dari internet. Firewall IPv6 yang tidak dikonfigurasi = seluruh jaringan internal terbuka.

> [!WARNING]
> **Jangan blokir ICMPv6 sepenuhnya.** NDP, RA, DAD, dan Packet Too Big semuanya memakainya. Tanpa ICMPv6, IPv6 berhenti bekerja.

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `ipv6 route X/64 Y` | `/ipv6 route add dst-address=X/64 gateway=Y` |
| `ipv6 router ospf 1` | `/routing ospf instance add version=3` |
| `interface tunnel` + `tunnel mode ipv6ip` | `/interface 6to4` |
| `ipv6 access-list` | `/ipv6 firewall filter` |
| `show ipv6 route` | `/ipv6 route print` |

---

## 9. DHCPv4 Option 108: IPv6-Mostly (RFC 8925)

Strategi migrasi di bagian 6 biasanya mengorbankan satu hal: untuk membuat segmen IPv6-only, Anda memisahkan perangkat modern dan lawas ke VLAN atau SSID berbeda. RFC 8925 (Oktober 2020, Standards Track) menyelesaikannya dengan satu opsi DHCPv4. Segmen yang dihasilkan disebut **IPv6-mostly**: segmen yang menyediakan NAT64 (umumnya dengan DNS64) sekaligus tetap menyediakan IPv4, sehingga host IPv6-only, dual-stack, dan IPv4-only bisa hidup berdampingan di segmen yang sama.

Opsi ini bernama **IPv6-Only Preferred**, kode 108, panjang tetap 4 byte, dan nilainya adalah bilangan 32 bit tak bertanda berisi detik **V6ONLY_WAIT**. Cara kerjanya:

1. Klien yang mampu IPv6-only (misalnya punya CLAT 464XLAT seperti di bagian 5) menaruh kode 108 di *Parameter Request List* pada DHCPDISCOVER dan DHCPREQUEST. Klien yang bukan IPv6-only-capable tidak boleh meminta opsi ini.
2. Server hanya menyertakan opsi 108 bila (a) klien memintanya dan (b) kolam alamat itu memang dikonfigurasi sebagai IPv6-mostly. Server sebaiknya menawarkan alamat `0.0.0.0` agar tidak menghabiskan alamat dari kolam.
3. Klien yang menerima opsi 108 tidak boleh meminta alamat IPv4 yang ditawarkan dan menunda DHCPv4 selama V6ONLY_WAIT detik, atau sampai terjadi *network attachment event* (misalnya link up), mana yang lebih dulu. Nilai minimum yang dipakai klien adalah `MIN_V6ONLY_WAIT` = 300 detik; nilai server yang lebih kecil (termasuk 0 saat server tidak mengatur apa pun) diperlakukan sebagai 300. Nilai bawaan variabel V6ONLY_WAIT adalah 1800 detik.
4. Klien lama atau IPv4-only mengabaikan opsi ini dan menerima alamat IPv4 seperti biasa.

Karena nilainya 32 bit, 1800 detik ditulis sebagai `0x00000708` dan 3600 detik sebagai `0x00000E10`. Di MikroTik RouterOS v7, opsi ini ditambahkan sebagai DHCP option mentah lalu dipasang ke jaringan DHCP; sintaks di bawah belum diuji di lab kurikulum ini, jadi verifikasi dengan `tcpdump` atau Wireshark pada paket DHCPOFFER.

```
/ip dhcp-server option add name=v6only-preferred code=108 value=0x00000708
/ip dhcp-server network set [find address=192.0.2.0/24] dhcp-option=v6only-preferred
```

Di Cisco IOS XE, opsi generik ditulis di pool DHCP dengan `option 108 hex 0000.0708`; di Linux, server DHCPv4 seperti dnsmasq atau Kea punya sintaks masing-masing, cek dokumentasi versi Anda. Syarat jaringannya sama: NAT64 dan DNS64 harus sudah berjalan (lihat `NAT64 + DNS64` di bagian 5), dan router mengiklankan prefix NAT64 lewat RA PREF64 (RFC 8781) bila klien memerlukannya. Tanpa itu, klien yang menunda IPv4 akan kehilangan akses ke tujuan IPv4-only.

> [!WARNING]
> **Jangan mengaktifkan opsi 108 sebelum NAT64 dan DNS64 benar-benar diuji.** RFC 8925 sendiri tidak membahas apa yang terjadi bila IPv6 gagal setelah klien mematikan IPv4. Jadi mulailah dari satu kolam percobaan, dan pastikan aplikasi yang memakai IPv4 literal punya CLAT atau pengecualian.

---

## 10. Ringkasan

- Routing IPv6 konsepnya identik dengan IPv4; yang berubah sintaks dan beberapa detail.
- **`ipv6 unicast-routing` wajib.** Next hop link-local harus disertai exit interface.
- **OSPFv3**: selalu per interface, RID wajib manual, adjacency lewat link-local, FF02::5/6.
- **EIGRPv6 classic shutdown by default**, jadi jangan lupa `no shutdown`.
- **MP-BGP** untuk IPv6; gunakan `no bgp default ipv4-unicast`. BGP unnumbered memakai link-local.
- **Dual stack adalah pendekatan yang direkomendasikan**: sederhana dan punya fallback alami lewat Happy Eyeballs.
- **Bahaya dual stack: firewall IPv6 yang terlupa**, yang menjadi pintu belakang terbuka lebar.
- **Tunneling** (6in4, GRE, 6rd, DS-Lite, MAP-E) adalah solusi sementara; mengurangi MTU dan menambah kompleksitas.
- **NAT64 + DNS64** untuk klien IPv6-only mengakses server IPv4-only; merusak DNSSEC dan alamat literal.
- **464XLAT** adalah yang membuat jaringan seluler IPv6-only bekerja untuk aplikasi IPv4-only.
- Migrasi bertahap: edge → DMZ → core → access → IPv6-only.
- Rancang skema alamat untuk kemudahan dibaca, bukan penghematan.
- Keamanan: pemindaian brute force tidak mungkin, tetapi enumerasi lewat DNS/log tetap ada; RA Guard wajib; jangan blokir ICMPv6.
- **RFC 8925** (DHCPv4 option 108, IPv6-Only Preferred) membuat segmen IPv6-mostly: klien IPv6-only-capable meminta opsi itu dan menunda DHCPv4 selama V6ONLY_WAIT (minimum 300 detik, bawaan 1800), sedangkan klien lain tetap mendapat IPv4. Syaratnya NAT64/DNS64 sudah berjalan.

---

## 11. Latihan

1. Kenapa next hop link-local pada static route IPv6 wajib disertai exit interface?
2. Anda mengonfigurasi OSPFv3 tetapi tidak ada adjacency. Konfigurasi terlihat benar. Sebutkan tiga hal yang paling mungkin.
3. Jelaskan cara kerja NAT64 + DNS64 dan dua keterbatasannya.
4. Apa itu Happy Eyeballs dan kenapa penting untuk dual stack?
5. Sebuah organisasi menerapkan dual stack. Firewall IPv4-nya sangat ketat. Apa risiko terbesar yang mungkin terlewat?
6. Rancang skema pengalamatan untuk perusahaan dengan alokasi `2001:db8:1234::/48`, 4 lokasi, masing-masing sampai 20 VLAN.
7. Kenapa 464XLAT diperlukan padahal sudah ada NAT64?
8. Apakah IPv6 lebih aman daripada IPv4 karena tidak bisa dipindai? Jelaskan.
9. Kolam DHCPv4 `192.0.2.0/24` Anda ubah menjadi IPv6-mostly dengan V6ONLY_WAIT 3600 detik. Tulis kode opsi dan nilai 32-bit heksadesimalnya. Jelaskan apa yang terjadi pada (a) ponsel modern dengan CLAT, (b) printer lama IPv4-only, dan (c) apa yang akan dilakukan klien bila server mengirim nilai 0.

<details>
<summary>Jawaban</summary>

1. Karena alamat link-local (`fe80::/10`) hanya unik dalam satu link: alamat `fe80::2` bisa ada di banyak interface router yang berbeda secara bersamaan. Tanpa menyebut interface, router tidak tahu ke link mana paket harus dikirim; alamatnya ambigu. Karena itu IOS menolak `ipv6 route 2001:db8::/64 fe80::2` dan mengharuskan `ipv6 route 2001:db8::/64 gi0/1 fe80::2`. Konsep yang sama berlaku saat melakukan ping ke link-local dari host (`ping6 fe80::1%eth0`).

2. (a) **`ipv6 unicast-routing` belum diaktifkan**: tanpa ini router tidak memproses IPv6 sama sekali. (b) **Router ID belum dikonfigurasi**: OSPFv3 tidak punya alamat IPv4 untuk diambil otomatis, sehingga RID wajib diset manual; tanpa itu proses tidak akan start. (c) **`ipv6 ospf 1 area 0` belum dipasang di interface**: OSPFv3 tidak punya perintah `network`, aktivasi selalu per interface. Kemungkinan lain: area ID berbeda, MTU tidak cocok, interface belum `no shutdown`, atau ACL memblokir FF02::5.

3. **Cara kerja:** klien IPv6-only mencari nama domain. DNS64 melihat domain itu hanya punya record A (IPv4), lalu mensintesis record AAAA palsu dengan menempelkan alamat IPv4 32-bit ke prefix `64:ff9b::/96` (mis. `93.184.216.34` → `64:ff9b::5db8:d822`). Klien mengirim paket IPv6 ke alamat itu; gateway NAT64 mengenali prefix tersebut, mengekstrak alamat IPv4-nya, dan menerjemahkan paket menjadi IPv4 (dengan NAT ke pool alamat publik). Balasan diterjemahkan kembali.
   **Keterbatasan:** (a) **DNSSEC rusak**: DNS64 memodifikasi jawaban DNS, sehingga tanda tangan tidak lagi valid; klien yang memvalidasi DNSSEC akan menolak jawaban sintetis. (b) **Alamat IPv4 literal tidak bekerja**: aplikasi yang menghubungi `http://93.184.216.34` langsung (tanpa DNS) tidak melewati DNS64 sehingga tidak pernah mendapat alamat tersintesis. Tambahan: protokol yang menyertakan alamat di payload (FTP aktif, SIP tanpa ALG) juga bermasalah.

4. **Happy Eyeballs** (RFC 8305) adalah algoritma di klien yang mencoba koneksi IPv6 dan IPv4 secara hampir paralel, lalu memakai yang lebih dulu berhasil. Biasanya IPv6 diberi keunggulan waktu kecil (~50-300 ms) sebelum IPv4 dicoba.
   **Kenapa penting:** tanpa itu, host yang mengutamakan IPv6 (sesuai RFC 6724) akan menunggu timeout TCP penuh (bisa 30 detik atau lebih) sebelum fallback ke IPv4 ketika konektivitas IPv6 rusak (jalur bermasalah, MTU black hole, firewall salah). Pengalaman pengguna menjadi sangat buruk dan sering disalahkan sebagai "IPv6 itu lambat". Happy Eyeballs membuat kegagalan IPv6 nyaris tidak terasa, sehingga organisasi berani mengaktifkan IPv6.

5. **Firewall IPv6 yang tidak dikonfigurasi atau jauh lebih longgar daripada IPv4.** Ini kesalahan yang sangat umum dan berbahaya karena: (a) IPv6 aktif secara default di hampir semua OS modern; (b) host mengutamakan IPv6 ketika tersedia; (c) tidak ada NAT di IPv6, sehingga setiap host punya alamat yang dapat dijangkau langsung dari internet, dan perlindungan implisit yang dulu diberikan NAT hilang; (d) tim sering menganggap "kami belum pakai IPv6" padahal jaringannya sudah membawa trafik IPv6.
   Akibatnya: layanan internal yang dilindungi ketat di IPv4 bisa terbuka penuh lewat IPv6. Perbaikan: buat kebijakan firewall IPv6 yang setara sebelum mengaktifkan IPv6, dan uji dari luar dengan pemindai IPv6.

6. Alokasi `/48` memberi 16 bit subnet ID (65.536 subnet /64). Dengan 4 lokasi dan 20 VLAN per lokasi, skema yang mudah dibaca:
   ```
   2001:db8:1234::/48                    ← organisasi

   Lokasi memakai digit pertama subnet ID:
     2001:db8:1234:0xxx::/64  → Kantor Pusat
     2001:db8:1234:1xxx::/64  → Cabang Bandung
     2001:db8:1234:2xxx::/64  → Cabang Surabaya
     2001:db8:1234:3xxx::/64  → Data Center

   VLAN memakai digit sisanya (cocokkan dengan nomor VLAN IPv4!):
     Kantor Pusat:
       2001:db8:1234:0010::/64  → VLAN 10 (Staff)
       2001:db8:1234:0020::/64  → VLAN 20 (Server)
       2001:db8:1234:0030::/64  → VLAN 30 (Tamu)
       2001:db8:1234:0999::/64  → VLAN 999 (Manajemen)
     Cabang Bandung:
       2001:db8:1234:1010::/64  → VLAN 10
       2001:db8:1234:1020::/64  → VLAN 20
   ```
   **Keuntungan skema ini:** nomor VLAN terbaca langsung dari alamat, lokasi terbaca dari digit pertama, summarization rapi per lokasi (`2001:db8:1234:1000::/52` untuk seluruh Bandung), dan masih tersisa ruang sangat besar untuk pertumbuhan.

7. **NAT64 saja hanya menyelesaikan separuh masalah.** NAT64 memungkinkan aplikasi IPv6 di klien IPv6-only mengakses server IPv4. Tetapi banyak aplikasi, terutama di ponsel, masih hard-code IPv4 atau memakai socket API IPv4 saja (mis. game lama, aplikasi VoIP tertentu, SDK pihak ketiga). Aplikasi seperti itu tidak bisa mengirim paket IPv6 sama sekali, sehingga NAT64 tidak pernah terlibat.
   **464XLAT** menambahkan CLAT di perangkat klien yang menerjemahkan trafik IPv4 aplikasi menjadi IPv6 sebelum meninggalkan perangkat. Di sisi operator, PLAT (NAT64) menerjemahkannya kembali ke IPv4. Dengan begitu aplikasi IPv4-only tetap bekerja sempurna di jaringan IPv6-only. Inilah yang memungkinkan operator seluler besar menjalankan jaringan IPv6-only tanpa keluhan pengguna.

8. **Sebagian benar, tetapi tidak boleh diandalkan.** Benar bahwa pemindaian brute force sebuah /64 tidak mungkin: 18 kuintiliun alamat akan memakan waktu miliaran tahun, sehingga teknik pemindaian massal IPv4 (yang bisa memindai seluruh internet dalam hitungan menit) tidak berlaku.
   Tetapi penyerang punya cara lain: (a) **enumerasi DNS**: AAAA record, reverse DNS, zone transfer; (b) **Certificate Transparency logs** yang mengungkap nama host; (c) **alamat yang mudah ditebak**: `::1`, `::2`, `::80`, `::53`, atau alamat berurutan yang diberikan administrator; (d) **alamat EUI-64**: kalau OUI vendor diketahui, ruang pencarian menyusut drastis; (e) **log, traffic capture, dan referer**; (f) pemindaian dari dalam segmen memakai `ff02::1`.
   Kesimpulan: kesulitan pemindaian adalah lapisan tambahan, bukan pengganti kontrol keamanan. Firewall stateful, segmentasi, dan hardening tetap wajib, terlebih karena IPv6 menghilangkan perlindungan implisit yang dulu diberikan NAT. Gunakan interface ID acak untuk host sensitif agar tidak mudah ditebak.

9. Kode opsi **108**, panjang 4 byte, nilai 3600 = **0x00000E10**. (a) Ponsel mengirim kode 108 di Parameter Request List; server menjawab dengan opsi 108 (dan umumnya alamat 0.0.0.0), sehingga ponsel tidak meminta IPv4 dan menunda DHCPv4 selama 3600 detik atau sampai link up berikutnya; akses ke tujuan IPv4-only lewat NAT64 dan CLAT. (b) Printer tidak meminta opsi 108 dan tidak boleh mendapat opsi itu dari server, jadi ia menerima alamat IPv4 normal dari kolam. (c) Nilai 0 berarti server tidak mengonfigurasi V6ONLY_WAIT; klien memperlakukan nilai di bawah MIN_V6ONLY_WAIT sebagai **300 detik**.

</details>

---

## 12. Sumber

- RFC 4213, Basic Transition Mechanisms for IPv6 Hosts and Routers
- RFC 6146 (Stateful NAT64) · RFC 6147 (DNS64) · RFC 6052 (IPv6 Addressing of IPv4/IPv6 Translators)
- RFC 6877 (464XLAT) · RFC 6333 (DS-Lite) · RFC 7597 (MAP-E)
- RFC 6724, Default Address Selection for IPv6
- RFC 8305, Happy Eyeballs Version 2
- RFC 7381, Enterprise IPv6 Deployment Guidelines
- RFC 5095, Deprecation of Type 0 Routing Headers
- Cisco CCNA 200-301 v1.1, topik 1.8, 1.9, 3.3
- RFC 8925, IPv6-Only Preferred Option for DHCPv4 (Oktober 2020): https://www.rfc-editor.org/rfc/rfc8925
- RFC 8781, Discovering PREF64 in Router Advertisements: https://www.rfc-editor.org/rfc/rfc8781

---

**Berikutnya:** `09-nat-acl-firewall/01-nat.md`. Memasuki tahap keamanan dan kontrol trafik.

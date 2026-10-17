# 08.1 Dasar IPv6

> **Prasyarat:** `04-network-layer/01`, `00-fondasi/02`
> **Tujuan:** Anda bisa membaca dan menyingkat alamat IPv6, mengenali setiap tipe alamat, dan memahami header IPv6.

---

## 1. Kenapa IPv6

```
IPv4: 32 bit  = 4.294.967.296 alamat (~4,3 miliar)
IPv6: 128 bit = 340.282.366.920.938.463.463.374.607.431.768.211.456
                (~340 undecillion, atau 3,4 × 10³⁸)
```

Untuk memberi gambaran skala: setiap orang di bumi bisa mendapat 4,3 × 10²⁸ alamat, atau setiap butir pasir di bumi bisa punya alamat sendiri, berkali-kali lipat.

### Timeline kehabisan IPv4

```
1981  RFC 791 — IPv4 dirancang untuk jaringan riset
1993  CIDR memperlambat kehabisan
1998  IPv6 distandarkan (RFC 2460, kini RFC 8200)
2011  IANA mengalokasikan blok /8 terakhir (3 Februari)
2011  APNIC kehabisan (kawasan Asia-Pasifik, termasuk Indonesia)
2012  RIPE NCC kehabisan
2015  ARIN kehabisan
2017  LACNIC kehabisan
2020  RIPE benar-benar habis
```

### Solusi sementara yang menahan IPv4

- **NAT/PAT**: banyak host di balik satu alamat publik
- **RFC 1918**: alamat privat
- **CGNAT**: dua lapis NAT di sisi ISP
- **Pasar alamat IPv4**: harga per alamat terus naik

> [!WARNING]
> Semua ini adalah tambalan dengan biaya nyata: NAT merusak model end-to-end, menyulitkan P2P dan VoIP, menambah kompleksitas, dan menyembunyikan identitas pengguna dari log.

### Keunggulan IPv6 di luar jumlah alamat

| Keunggulan | Penjelasan |
|---|---|
| **Header lebih sederhana** | 8 field (vs 13 di IPv4); ukuran tetap 40 byte → forwarding lebih cepat |
| **Tidak ada fragmentasi di router** | Hanya pengirim yang boleh memfragmentasi → router lebih ringan |
| **Tidak ada checksum header** | L2 dan L4 sudah punya; menghilangkan perhitungan ulang per hop |
| **Autokonfigurasi (SLAAC)** | Host bisa mengonfigurasi dirinya tanpa DHCP |
| **Tidak butuh NAT** | Konektivitas end-to-end kembali |
| **Multicast menggantikan broadcast** | Lebih efisien; host yang tidak berminat tidak terganggu |
| **IPsec terintegrasi** | Bagian dari spesifikasi (walau tidak wajib dipakai) |
| **Prefix delegation** | ISP memberi seluruh /56 atau /48 ke pelanggan |
| **Renumbering lebih mudah** | Dengan RA, mengganti prefix jauh lebih sederhana |

---

## 2. Format Alamat

Alamat ini terdiri atas 128 bit, ditulis sebagai 8 kelompok berisi 4 digit heksadesimal, dipisah titik dua.

```
2001:0db8:85a3:0000:0000:8a2e:0370:7334
└──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘
 16   16   16   16   16   16   16   16  bit = 128 bit
```

### Aturan penyingkatan [RFC 5952]

**Aturan 1: hapus nol di depan setiap kelompok**
```
2001:0db8:85a3:0000:0000:8a2e:0370:7334
2001:db8:85a3:0:0:8a2e:370:7334
```

**Aturan 2: ganti satu deret nol terpanjang dengan `::` (hanya SEKALI)**
```
2001:db8:85a3:0:0:8a2e:370:7334
2001:db8:85a3::8a2e:370:7334
```

### Aturan penulisan yang benar (RFC 5952)

```
✅ Huruf KECIL untuk hex        : 2001:db8::1     (bukan 2001:DB8::1)
✅ Hapus nol di depan            : 2001:db8::1     (bukan 2001:0db8::1)
✅ Gunakan :: untuk deret nol TERPANJANG
✅ Kalau ada dua deret sama panjang, singkat yang PERTAMA
✅ Jangan pakai :: untuk satu kelompok nol tunggal
```

**Contoh yang benar dan salah:**
```
Asli   : 2001:0db8:0000:0000:0001:0000:0000:0001

❌ 2001:db8::1:0:0:1        ← salah, deret pertama (2 kelompok) bukan yang terpanjang?
   → sebenarnya kedua deret sama panjang (2 kelompok)
   → aturan: singkat yang PERTAMA
✅ 2001:db8::1:0:0:1

Asli   : 2001:db8:0:0:0:0:0:1
✅ 2001:db8::1

Asli   : fe80:0:0:0:0:0:0:1
✅ fe80::1

Asli   : 0:0:0:0:0:0:0:1
✅ ::1                      (loopback)

Asli   : 0:0:0:0:0:0:0:0
✅ ::                       (unspecified)

❌ 2001:db8::85a3::1        ← DUA :: = ILEGAL (ambigu)
❌ 2001:db8:0::1            ← jangan pakai :: untuk satu kelompok nol
✅ 2001:db8:0:0:0:0:0:1 → 2001:db8::1
```

> [!WARNING]
> **Dua `::` dalam satu alamat adalah ILEGAL** karena ambigu: tidak jelas berapa kelompok nol yang diwakili masing-masing.

### Prefix

```
2001:db8:acad:1::/64
                  └── panjang prefix (network portion)

2001:db8:acad:1:0:0:0:1/64
└─────── network (64 bit) ───┘└─ interface ID (64 bit) ─┘
```

Notasi CIDR sama seperti IPv4, tetapi di IPv6 tidak ada subnet mask bertitik; yang dipakai selalu prefix length.

---

## 3. Tipe Alamat

| Tipe | Prefix | Fungsi |
|---|---|---|
| **GUA** (Global Unicast) | 2000::/3 | Publik, dapat dirutekan di internet |
| **ULA** (Unique Local) | fc00::/7 (praktis fd00::/8) | Privat, setara RFC 1918 |
| **LLA** (Link-Local) | fe80::/10 | Hanya dalam satu link; WAJIB ada di setiap interface |
| **Multicast** | ff00::/8 | Satu ke banyak |
| **Anycast** | Dari rentang unicast | Alamat sama di banyak lokasi |
| **Loopback** | ::1/128 | Setara 127.0.0.1 |
| **Unspecified** | ::/128 | Setara 0.0.0.0 |
| **IPv4-mapped** | ::ffff:0:0/96 | Merepresentasikan IPv4 dalam socket IPv6 |
| **Dokumentasi** | 2001:db8::/32 | Contoh dan dokumentasi (RFC 3849) |
| **Teredo** | 2001::/32 | Tunneling (usang) |
| **6to4** | 2002::/16 | Tunneling (usang) |

> [!WARNING]
> **TIDAK ADA BROADCAST di IPv6.** Fungsinya digantikan multicast, yang jauh lebih efisien karena hanya host yang berlangganan yang memprosesnya.

### GUA (Global Unicast Address)

```
2001:db8:acad:0001:0000:0000:0000:0001/64
└────────────────┘└──┘└──────────────────┘
  Global routing   Subnet   Interface ID
  prefix (48 bit)  (16 bit)   (64 bit)
```

Struktur alokasi tipikal:
```
/32  → dialokasikan RIR ke ISP
/48  → ISP ke pelanggan enterprise      (65.536 subnet /64)
/56  → ISP ke pelanggan rumahan/UKM     (256 subnet /64)
/64  → SATU subnet (standar untuk LAN)
```

> [!WARNING]
> **`/64` adalah standar mutlak untuk LAN.** Ukuran ini adalah persyaratan, karena:
- **SLAAC memerlukan interface ID 64 bit** untuk membentuk alamat
- Beberapa fitur (mis. privacy extension, EUI-64) mengasumsikan /64
- Alamat IPv6 tidak akan pernah habis, jadi tidak perlu berhemat

> [!TIP]
> Satu `/64` berisi 18 kuintiliun alamat, lebih banyak daripada seluruh alamat IPv4 dikalikan 4 miliar. Jangan pernah memakai /112, /120, atau /126 untuk LAN.

**Pengecualian yang lazim:** link point-to-point antar-router boleh memakai `/127` [RFC 6164] untuk mencegah serangan *neighbor discovery exhaustion*.

### ULA (Unique Local Address)

```
fd00::/8 → praktis semua ULA memakai ini
fd + 40 bit acak + 16 bit subnet + 64 bit interface ID

Contoh: fd12:3456:789a:0001::1/64
        └┘└──────────┘└──┘
        fd  Global ID  Subnet
            (40 bit ACAK — hasilkan sekali, jangan tebak!)
```

Setara RFC 1918 di IPv4, tetapi Global ID harus DIACAK agar unik secara global. Dengan begitu, dua organisasi yang merger tidak mengalami konflik alamat.

```bash
# Hasilkan ULA prefix acak
$ python3 -c "
import secrets
gid = secrets.token_hex(5)
print(f'fd{gid[:2]}:{gid[2:6]}:{gid[6:10]}::/48')
"
fd7a:3c91:e4f2::/48
```

> [!WARNING]
> **`fc00::/8` dicadangkan** untuk alokasi terpusat yang tidak pernah terjadi. Dalam praktik, semua ULA memakai `fd00::/8`.

> [!WARNING]
> **ULA bukan pengganti GUA.** Jangan memakai ULA + NAT66 untuk meniru pola IPv4, karena cara itu membuang seluruh keunggulan IPv6. Gunakan GUA untuk konektivitas internet, dan ULA hanya untuk komunikasi internal yang harus stabil walau prefix ISP berubah.

### LLA (Link-Local Address)

```
fe80::/10 (praktis: fe80::/64)
```

Setiap interface IPv6 WAJIB punya alamat link-local, dibuat otomatis saat interface aktif. Tanpa itu, IPv6 tidak berfungsi sama sekali.

**Digunakan untuk:**
- **NDP** (Neighbor Discovery, pengganti ARP)
- **Router Advertisement** dan Router Solicitation
- **Next hop** pada routing (OSPFv3, EIGRPv6, BGP unnumbered)
- Komunikasi dalam satu link tanpa perlu alamat global

> [!WARNING]
> **Alamat link-local tidak unik secara global.** `fe80::1` bisa ada di banyak interface. Karena itu, saat memakainya Anda harus menyebut interface (zone ID):
```bash
$ ping6 fe80::1%eth0            ← Linux/macOS
PS> ping fe80::1%12             ← Windows (angka = interface index)
```

```
R1(config-if)# ipv6 route 2001:db8:10::/64 gi0/1 fe80::2   ← interface WAJIB
```

### Multicast

```
ff00::/8

ff  |  flags  |  scope  |  group ID
8bit    4bit     4bit      112 bit
```

**Scope (jangkauan):**
```
ff01:: → interface-local (loopback)
ff02:: → LINK-LOCAL (paling sering dipakai)
ff05:: → site-local
ff08:: → organization-local
ff0e:: → global
```

**Alamat multicast yang wajib dihafal:**
```
ff02::1        → SEMUA NODE di link ini     (setara broadcast IPv4)
ff02::2        → SEMUA ROUTER di link ini
ff02::5        → semua router OSPFv3
ff02::6        → OSPFv3 DR/BDR
ff02::9        → RIPng
ff02::a        → EIGRP untuk IPv6
ff02::c        → SSDP
ff02::d        → PIM
ff02::16       → MLDv2
ff02::1:2      → semua DHCPv6 relay agent dan server
ff02::1:ff00:0/104 → SOLICITED-NODE (untuk NDP)
ff02::fb       → mDNS
```

### Solicited-Node Multicast: konsep penting

Setiap alamat unicast IPv6 punya alamat solicited-node yang berasosiasi dengannya:

```
ff02::1:ff + 24 BIT TERENDAH dari alamat unicast

Alamat  : 2001:db8:acad:1::a1b2:c3d4
24 bit terakhir: b2:c3d4
Solicited-node : ff02::1:ffb2:c3d4
```

**Kenapa ini penting?** ARP di IPv4 memakai broadcast yang mengganggu setiap host di segmen. NDP di IPv6 memakai solicited-node multicast, sehingga hanya host yang 24 bit terakhir alamatnya cocok yang memproses paket. Beban CPU host jauh berkurang.

### Anycast

Anycast adalah alamat unicast biasa yang diberikan ke beberapa perangkat. Routing mengarahkan ke instance terdekat.

**Subnet-router anycast** adalah alamat dengan interface ID semua nol (`prefix::`) yang otomatis dimiliki semua router di subnet itu.

---

## 4. Interface ID

Interface ID adalah 64 bit terakhir alamat. Ada beberapa cara membentuknya.

### Modified EUI-64 (dari MAC address)

```
MAC : 00:1A:2B:3C:4D:5E

Langkah 1 — sisipkan FFFE di tengah:
      00:1A:2B : FF:FE : 3C:4D:5E

Langkah 2 — BALIK bit ke-7 (U/L bit) dari byte pertama:
      00 = 0000 0000
                  ↑ bit ke-7 (dihitung dari kiri, mulai 0)
           0000 0010 = 02

Hasil: 021A:2BFF:FE3C:4D5E

Alamat lengkap: 2001:db8:acad:1:021a:2bff:fe3c:4d5e
```

> [!WARNING]
> **Masalah privasi:** MAC address terekspos dalam alamat IPv6, sehingga perangkat bisa dilacak ke mana pun ia pergi, bahkan saat berganti jaringan. Karena itu EUI-64 tidak lagi menjadi default.

**Cara membalik bit ke-7 dengan cepat:**
```
00 → 02        02 → 00
0A → 08        AC → AE
1E → 1C        3C → 3E
```
(Tambah/kurangi 2 pada digit hex kedua, atau XOR byte pertama dengan `0x02`.)

### Privacy Extension (RFC 4941)

Privacy extension membuat alamat sementara yang diacak dan diganti berkala (biasanya setiap 24 jam).

```
Host punya:
  - Alamat stabil (untuk menerima koneksi masuk)
  - Alamat sementara acak (untuk koneksi KELUAR)
```

Aktif secara default di Windows, macOS, iOS, Android, dan sebagian besar distribusi Linux modern.

```bash
# Linux
$ sysctl net.ipv6.conf.all.use_tempaddr
# 0 = mati, 1 = hasilkan tapi jangan diutamakan, 2 = hasilkan dan UTAMAKAN
$ sudo sysctl -w net.ipv6.conf.all.use_tempaddr=2

# Windows
PS> netsh interface ipv6 set privacy state=enabled
```

> [!WARNING]
> **Implikasi operasional:** alamat yang berubah-ubah menyulitkan firewall berbasis IP, logging, dan pelacakan aset. Di jaringan enterprise, sering dinonaktifkan dan diganti dengan **stable privacy address** (RFC 7217) yang stabil per-jaringan tetapi tidak mengungkap MAC.

### Stable Privacy Address (RFC 7217)

```
Interface ID = Hash(prefix, nama interface, secret perangkat, counter)
```

- **Stabil** dalam satu jaringan (bagus untuk firewall dan log)
- **Berbeda** di setiap jaringan (bagus untuk privasi)
- **Tidak mengungkap MAC**

Ini pendekatan terbaik dan menjadi default pada banyak sistem modern.

### Manual

Untuk server dan perangkat infrastruktur, gunakan alamat manual yang mudah diingat:
```
2001:db8:acad:1::1     ← gateway
2001:db8:acad:1::10    ← DNS server
2001:db8:acad:1::53    ← DNS (memakai nomor port sebagai mnemonic)
2001:db8:acad:1::80    ← web server
```

---

## 5. Header IPv6

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|Version| Traffic Class |           Flow Label                  |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|         Payload Length        |  Next Header  |   Hop Limit   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                    Source Address (128 bit)                   +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                 Destination Address (128 bit)                 +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

Ukuran header tetap 40 byte (dua kali IPv4 minimum, tetapi hanya 8 field dibanding 13).

| Field | Ukuran | Setara IPv4 |
|---|---|---|
| **Version** | 4 bit | Version (nilai 6) |
| **Traffic Class** | 8 bit | DSCP + ECN |
| **Flow Label** | 20 bit | BARU: menandai aliran untuk QoS/load balancing |
| **Payload Length** | 16 bit | Total Length (tetapi tanpa header) |
| **Next Header** | 8 bit | Protocol |
| **Hop Limit** | 8 bit | TTL |
| **Source/Destination** | 128 bit each | Source/Destination Address |

### Yang DIHAPUS dari IPv4

```
❌ Header Checksum      → L2 (FCS) dan L4 (checksum) sudah cukup
                          → router tidak perlu menghitung ulang tiap hop = LEBIH CEPAT
❌ IHL                  → header selalu 40 byte
❌ Identification       → pindah ke Fragment extension header
❌ Flags, Fragment Offset → pindah ke Fragment extension header
❌ Options              → pindah ke Extension Header
```

> [!WARNING]
> **Karena tidak ada checksum header, checksum di UDP menjadi WAJIB pada IPv6** (di IPv4 opsional).

### Extension Header

Opsi ditempatkan sebagai header terpisah yang dirantai lewat field `Next Header`.

```
┌────────────┬──────────────┬──────────────┬─────────────┐
│ IPv6 hdr   │ Routing ext  │ Fragment ext │ TCP header  │
│ NextHdr=43 │ NextHdr=44   │ NextHdr=6    │ + data      │
└────────────┴──────────────┴──────────────┴─────────────┘
```

**Urutan yang direkomendasikan (RFC 8200):**
```
1. Hop-by-Hop Options (0)       ← diproses SETIAP router
2. Destination Options (60)
3. Routing (43)
4. Fragment (44)
5. Authentication Header (51)
6. ESP (50)
7. Destination Options (60)
8. Upper layer: TCP(6) / UDP(17) / ICMPv6(58)
```

> [!WARNING]
> **Extension header adalah masalah keamanan dan kinerja nyata:**
- Rantai panjang bisa dipakai untuk mengelabui firewall (header L4 terdorong jauh sehingga tidak terinspeksi)
- **Type 0 Routing Header sudah dilarang** (RFC 5095) karena bisa dipakai untuk amplification attack
- Banyak perangkat memproses paket dengan extension header di CPU, bukan hardware → celah DoS
- Banyak operator memblokir paket dengan extension header tertentu

### Flow Label

Flow label adalah 20 bit yang menandai paket-paket milik satu aliran yang sama. Router bisa memakainya untuk load balancing (ECMP) tanpa harus membaca header L4. Cara ini lebih cepat, dan tetap bekerja walau paket terenkripsi atau terfragmentasi.

---

## 6. Fragmentasi di IPv6

> [!WARNING]
> **Router IPv6 TIDAK PERNAH memfragmentasi paket.** Ini perubahan mendasar dari IPv4.

```
Paket terlalu besar untuk link berikutnya:
  IPv4 → router memfragmentasi (kalau DF tidak diset)
  IPv6 → router MEMBUANG paket + kirim ICMPv6 "Packet Too Big" (tipe 2)
         → PENGIRIM yang harus memperkecil atau memfragmentasi sendiri
```

**Konsekuensi:**
1. Router jauh lebih ringan dan cepat
2. **PMTUD menjadi WAJIB**, bukan opsional
3. **Memblokir ICMPv6 = merusak IPv6 sepenuhnya**

**MTU minimum IPv6 = 1280 byte** (IPv4: 68 byte). Setiap link yang membawa IPv6 harus mendukung minimal 1280.

> [!WARNING]
> **JANGAN memblokir ICMPv6.** Berbeda dari IPv4 di mana memblokir ICMP "hanya" merusak PMTUD dan traceroute, di IPv6 ICMPv6 membawa NDP (pengganti ARP), RA, DAD, dan Packet Too Big. Memblokirnya berarti IPv6 berhenti bekerja total.

Yang minimal harus diizinkan [RFC 4890]:
```
Tipe 1   Destination Unreachable
Tipe 2   Packet Too Big              ← WAJIB untuk PMTUD
Tipe 3   Time Exceeded
Tipe 4   Parameter Problem
Tipe 128/129  Echo Request/Reply
Tipe 133-136  NDP (RS, RA, NS, NA)   ← WAJIB untuk operasi dasar
Tipe 137 Redirect (opsional)
```

---

## 7. Konfigurasi Dasar

### Cisco

```
R1(config)# ipv6 unicast-routing              ← WAJIB, sering terlupa!

R1(config)# interface gi0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# ipv6 address fe80::1 link-local     ← opsional, mudah diingat
R1(config-if)# ipv6 enable                          ← hanya link-local
R1(config-if)# no shutdown

# EUI-64 otomatis
R1(config-if)# ipv6 address 2001:db8:acad:1::/64 eui-64

# Verifikasi
R1# show ipv6 interface brief
R1# show ipv6 interface gi0/0
R1# show ipv6 route
R1# show ipv6 neighbors
R1# ping ipv6 2001:db8:acad:1::2
```

> [!WARNING]
> **Tanpa `ipv6 unicast-routing`, router tidak akan meneruskan paket IPv6 sama sekali**, walaupun alamat dan rute sudah dikonfigurasi. Ini penyebab masalah IPv6 paling umum di lab.

### Linux

```bash
# Lihat alamat
$ ip -6 addr show
$ ip -6 route show
$ ip -6 neigh show

# Tambah alamat
$ sudo ip -6 addr add 2001:db8:acad:1::10/64 dev eth0
$ sudo ip -6 route add default via 2001:db8:acad:1::1

# Aktifkan forwarding (menjadikan Linux router IPv6)
$ sudo sysctl -w net.ipv6.conf.all.forwarding=1

# Uji
$ ping6 2001:db8:acad:1::1
$ ping6 -I eth0 fe80::1          # link-local butuh interface
$ traceroute6 2606:4700:4700::1111
$ dig AAAA example.com
$ curl -6 https://example.com

# Nonaktifkan IPv6 (kalau benar-benar perlu — umumnya JANGAN)
$ sudo sysctl -w net.ipv6.conf.all.disable_ipv6=1
```

### Windows

```powershell
PS> Get-NetIPAddress -AddressFamily IPv6
PS> Get-NetRoute -AddressFamily IPv6
PS> Get-NetNeighbor -AddressFamily IPv6
PS> ping -6 2001:db8::1
PS> Test-NetConnection -ComputerName ipv6.google.com
```

---

## 8. Kesalahan Umum

> [!WARNING]
> **1. Lupa `ipv6 unicast-routing`.** Penyebab masalah nomor satu di lab.

> [!WARNING]
> **2. Memakai subnet lebih kecil dari /64 di LAN.** Merusak SLAAC. Selalu /64.

> [!WARNING]
> **3. Memblokir ICMPv6.** IPv6 berhenti bekerja total, bukan sekadar terganggu.

> [!WARNING]
> **4. Mencoba meniru NAT IPv4 dengan ULA + NAT66.** Membuang keunggulan IPv6 dan menambah kompleksitas tanpa manfaat keamanan nyata.

> [!WARNING]
> **5. Lupa menyebut interface saat memakai alamat link-local.** `ping6 fe80::1` akan gagal tanpa `%eth0`.

> [!WARNING]
> **6. Menganggap "IPv6 tidak aktif" berarti aman.** Sebagian besar OS mengaktifkan IPv6 secara default dan lebih mengutamakannya daripada IPv4 (Happy Eyeballs). Jaringan yang mengabaikan IPv6 sering punya celah keamanan karena firewall IPv6 tidak dikonfigurasi.

> [!WARNING]
> **7. Menulis alamat dengan huruf besar atau nol di depan.** Bukan error teknis, tetapi melanggar RFC 5952 dan menyulitkan pencarian di log.

---

## MikroTik RouterOS

```
# Paket ipv6 harus AKTIF (tidak aktif default di sebagian versi!)
/system package print
/system package enable ipv6
/system reboot                        ← perlu reboot setelah mengaktifkan paket

# Alamat IPv6
/ipv6 address add address=2001:db8:acad:1::1/64 interface=bridge-LAN advertise=yes
/ipv6 address add address=fe80::1/64 interface=bridge-LAN
/ipv6 address print
/ipv6 address print detail

# EUI-64 otomatis
/ipv6 address add address=2001:db8:acad:1::/64 interface=bridge-LAN eui-64=yes

# Aktifkan forwarding
/ipv6 settings set forward=yes accept-router-advertisements=no

# Neighbor table (= ARP)
/ipv6 neighbor print

# Ping dan traceroute
/ping 2001:db8::1
/ping fe80::1%bridge-LAN              ← link-local butuh interface
/tool traceroute 2606:4700:4700::1111
```

> [!WARNING]
> **Paket `ipv6` tidak selalu aktif secara default** di RouterOS. Kalau menu `/ipv6` tidak ada, aktifkan dengan `/system package enable ipv6` lalu reboot. Ini penyebab kebingungan yang sangat umum.

> [!WARNING]
> **`advertise=yes` pada alamat** membuat RouterOS mengumumkan prefix itu lewat Router Advertisement, setara `ipv6 nd prefix` di Cisco. Tanpa ini, klien tidak akan mendapat alamat lewat SLAAC.

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `ipv6 unicast-routing` | `/ipv6 settings set forward=yes` |
| `ipv6 address X/64` | `/ipv6 address add address=X/64 interface=Y` |
| `ipv6 address X/64 eui-64` | `eui-64=yes` |
| `ipv6 enable` (link-local saja) | otomatis saat interface aktif |
| `show ipv6 interface brief` | `/ipv6 address print` |
| `show ipv6 neighbors` | `/ipv6 neighbor print` |
| `ipv6 nd prefix X` | `advertise=yes` pada alamat |

---

## 9. Ringkasan

- IPv6 = 128 bit, 8 kelompok hex, disingkat dengan aturan RFC 5952: huruf kecil, hapus nol depan, satu `::` untuk deret nol terpanjang.
- **Dua `::` ilegal.** `/64` adalah standar mutlak untuk LAN; `/127` untuk link P2P antar-router.
- Tipe: **GUA `2000::/3`** (publik), **ULA `fd00::/8`** (privat, Global ID acak), **LLA `fe80::/10`** (wajib di setiap interface), **multicast `ff00::/8`**.
- **TIDAK ADA BROADCAST**; fungsinya digantikan multicast. `ff02::1` semua node, `ff02::2` semua router.
- **Solicited-node multicast** (`ff02::1:ff` + 24 bit terakhir) membuat NDP jauh lebih efisien daripada ARP.
- Interface ID: EUI-64 (mengekspos MAC, hindari), privacy extension (acak, berubah), stable privacy RFC 7217 (terbaik), atau manual.
- Header 40 byte tetap, 8 field; tidak ada checksum → forwarding lebih cepat; opsi pindah ke extension header.
- **Router tidak pernah memfragmentasi**; hanya pengirim yang boleh. PMTUD wajib; MTU minimum 1280.
- **Memblokir ICMPv6 mematikan IPv6**, karena protokol itu membawa NDP, RA, DAD, dan Packet Too Big.
- **`ipv6 unicast-routing` wajib** di router Cisco.

---

## 10. Latihan

1. Singkat: `2001:0db8:0000:0000:0000:ff00:0042:8329`
2. Singkat: `fe80:0000:0000:0000:0204:61ff:fe9d:f156`
3. Apakah `2001:db8::1::2` valid? Jelaskan.
4. Hitung alamat EUI-64 dari MAC `AC:DE:48:00:11:22` dengan prefix `2001:db8:1::/64`.
5. Hitung alamat solicited-node multicast untuk `2001:db8:acad:1::a1b2:c3d4`.
6. Kenapa /64 wajib untuk LAN, dan apa yang rusak kalau memakai /120?
7. Anda memblokir semua ICMPv6 di firewall untuk keamanan. Apa yang terjadi?
8. Jelaskan mengapa IPv6 tidak punya checksum di header dan apa konsekuensinya bagi UDP.

<details>
<summary>Jawaban</summary>

1. `2001:0db8:0000:0000:0000:ff00:0042:8329`
   → hapus nol depan: `2001:db8:0:0:0:ff00:42:8329`
   → ganti deret nol terpanjang (3 kelompok) dengan `::`
   → **`2001:db8::ff00:42:8329`**

2. `fe80:0000:0000:0000:0204:61ff:fe9d:f156`
   → hapus nol depan: `fe80:0:0:0:204:61ff:fe9d:f156`
   → **`fe80::204:61ff:fe9d:f156`**

3. **Tidak valid.** Sebuah alamat IPv6 hanya boleh mengandung satu `::`. Dengan dua `::`, tidak mungkin menentukan berapa kelompok nol yang diwakili masing-masing, sehingga alamatnya ambigu. Parser akan menolaknya.

4. MAC `AC:DE:48:00:11:22`:
   - Sisipkan `FFFE` di tengah: `ACDE:48FF:FE00:1122`
   - Balik bit ke-7 dari byte pertama: `AC` = `1010 1100` → `1010 1110` = `AE`
   - Interface ID: `AEDE:48FF:FE00:1122`
   - **Alamat lengkap: `2001:db8:1:0:aede:48ff:fe00:1122`** (atau `2001:db8:1::aede:48ff:fe00:1122`)

5. Ambil 24 bit terendah dari `2001:db8:acad:1::a1b2:c3d4`.
   Alamat lengkapnya: `...:0000:a1b2:c3d4` → 24 bit terakhir = `b2:c3:d4`.
   Solicited-node = `ff02::1:ff` + 24 bit itu → **`ff02::1:ffb2:c3d4`**

6. **SLAAC (Stateless Address Autoconfiguration) mensyaratkan interface ID sepanjang 64 bit.** Dengan prefix /120, hanya tersisa 8 bit untuk interface ID. Host tidak bisa membentuk alamatnya sendiri dari RA, sehingga SLAAC gagal total. Host harus dikonfigurasi manual atau lewat DHCPv6 stateful.
   Selain itu: privacy extension dan stable privacy address (RFC 7217) mengasumsikan ruang 64 bit; beberapa implementasi berperilaku tidak terduga; dan tidak ada alasan berhemat karena satu /64 saja berisi 18 kuintiliun alamat sementara satu /48 sudah memberi 65.536 subnet /64.
   **Pengecualian sah:** `/127` untuk link point-to-point antar-router (RFC 6164), karena di sana SLAAC memang tidak dipakai dan /127 mencegah serangan NDP exhaustion.

7. **IPv6 berhenti bekerja sepenuhnya.** Berbeda dari IPv4 di mana ICMP hanya untuk diagnostik dan PMTUD, ICMPv6 membawa fungsi inti IPv6:
   - **NDP** (tipe 135/136) menggantikan ARP → host tidak bisa menemukan MAC tetangga → tidak ada komunikasi sama sekali
   - **Router Advertisement** (tipe 134) → host tidak dapat default gateway dan prefix → SLAAC gagal
   - **DAD** → deteksi duplikasi alamat gagal
   - **Packet Too Big** (tipe 2) → PMTUD gagal → MTU black hole, karena router IPv6 tidak boleh memfragmentasi
   Sesuai RFC 4890, izinkan minimal tipe 1, 2, 3, 4, 128, 129, dan 133-136.

8. Header IPv4 punya checksum yang harus dihitung ulang di setiap router karena TTL berubah, dan pekerjaan itu memakan siklus CPU pada setiap hop. IPv6 menghapusnya dengan alasan: lapisan bawah (Ethernet FCS) sudah mendeteksi korupsi di setiap link, dan lapisan atas (TCP/UDP checksum) mendeteksi korupsi end-to-end. Menghilangkan checksum header membuat forwarding lebih cepat dan sederhana.
   **Konsekuensi bagi UDP:** di IPv4, checksum UDP bersifat opsional (boleh diisi nol) karena header IP masih melindungi alamat. Di IPv6 tidak ada perlindungan itu, sehingga checksum UDP menjadi WAJIB: datagram UDP IPv6 dengan checksum nol harus dibuang penerima. (Pengecualian: RFC 6935/6936 mengizinkan checksum nol untuk tunnel tertentu dengan syarat ketat.)

</details>

---

## 11. Sumber

- RFC 8200, Internet Protocol, Version 6 (menggantikan RFC 2460)
- RFC 4291, IPv6 Addressing Architecture
- RFC 5952, A Recommendation for IPv6 Address Text Representation
- RFC 4193, Unique Local IPv6 Unicast Addresses
- RFC 4941 (Privacy Extensions) · RFC 7217 (Stable Privacy Addresses)
- RFC 4890, Recommendations for Filtering ICMPv6
- RFC 6164, Using 127-Bit IPv6 Prefixes on Inter-Router Links
- Cisco CCNA 200-301 v1.1, topik 1.8 (configure & verify IPv6 addressing and prefix) dan 1.9 (IPv6 address types)

---

**Berikutnya:** `08-ipv6/02-ndp-slaac-dhcpv6.md`. Bagaimana host IPv6 mengonfigurasi dirinya sendiri.

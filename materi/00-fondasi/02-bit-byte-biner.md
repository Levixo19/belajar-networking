# 00.2 Bit, Byte, Biner, dan Heksadesimal

> **Prasyarat:** `00-fondasi/01`
> **Tujuan:** Anda bisa mengonversi biner↔desimal↔hex dalam hitungan detik tanpa kalkulator, dan memahami operasi AND yang menjadi dasar seluruh subnetting.

> [!WARNING]
> **Modul ini adalah fondasi paling kritis di seluruh kurikulum.** Orang yang gagal di subnetting (`04-network-layer/02`) 90% gagal karena melewati modul ini. Jangan lanjut sebelum bisa mengerjakan latihan di bawah tanpa alat bantu.

---

## 1. Kenapa Harus Biner?

Komputer dibangun dari transistor. Satu transistor hanya punya dua keadaan stabil: **ada tegangan** atau **tidak ada tegangan**. Kita sebut itu **1** dan **0**.

Semua yang ada di komputer — teks, gambar, video, alamat IP — pada akhirnya hanyalah barisan 1 dan 0.

Di jaringan, sinyal yang lewat kabel juga hanya dua keadaan (tegangan tinggi/rendah, cahaya nyala/mati). Jadi:

> **Jaringan mengirimkan bit. Titik.** Semua konsep di atasnya adalah cara kita menafsirkan barisan bit itu.

Anda **wajib** nyaman dengan biner karena:
1. **Subnet mask** hanya bisa dipahami dalam biner.
2. **MAC address** dan **IPv6** ditulis dalam hex.
3. **Wildcard mask** di ACL adalah operasi bit.
4. **Flag** di header TCP/IP adalah bit tunggal.
5. **Perhitungan jumlah host** adalah pangkat dua.

---

## 2. Satuan Data

| Satuan | Isi | Catatan |
|---|---|---|
| **bit** (b) | 1 digit biner: 0 atau 1 | Satuan terkecil |
| **nibble** | 4 bit | Persis 1 digit hex — penting! |
| **byte** (B) | 8 bit | Satuan penyimpanan standar |
| **octet** | 8 bit | Istilah resmi di dunia jaringan |
| **word** | 16/32/64 bit | Tergantung arsitektur |

> [!TIP]
> Di dokumen jaringan dan RFC, kata yang dipakai adalah **octet**, bukan byte. Alasan historis: dulu ada komputer dengan byte 6, 7, atau 9 bit, jadi IETF memilih istilah yang tidak ambigu. Alamat IPv4 disebut terdiri dari "4 oktet".

### bit vs byte: huruf kecil vs besar

Ini sumber kebingungan nomor satu bagi pengguna awam:

| Notasi | Arti | Dipakai untuk |
|---|---|---|
| **b** (kecil) | bit | Kecepatan jaringan: 100 Mbps |
| **B** (besar) | byte | Ukuran file & kecepatan download: 12 MB/s |

**Konversi:** 1 byte = 8 bit, jadi:

```
100 Mbps ÷ 8 = 12,5 MB/s (teoretis maksimum)
```

Ini menjawab keluhan klasik: *"Internet saya 100 Mbps tapi download cuma 12 MB/s!"* — Itu **benar dan normal**. 100 Mbps memang setara ~12,5 MB/s, dan setelah overhead protokol, ~11-12 MB/s adalah hasil yang bagus.

### Prefiks SI vs biner

| Prefiks SI (basis 10) | Nilai | Prefiks biner (basis 2) | Nilai |
|---|---|---|---|
| kilo (k) | 10³ = 1.000 | kibi (Ki) | 2¹⁰ = 1.024 |
| mega (M) | 10⁶ = 1.000.000 | mebi (Mi) | 2²⁰ = 1.048.576 |
| giga (G) | 10⁹ | gibi (Gi) | 2³⁰ |
| tera (T) | 10¹² | tebi (Ti) | 2⁴⁰ |

Aturan praktis di lapangan:
- **Kecepatan jaringan selalu basis 10.** 1 Gbps = 1.000.000.000 bit/detik, bukan 2³⁰.
- **Ukuran RAM selalu basis 2.**
- **Ukuran disk:** produsen memakai basis 10 (1 TB = 10¹² byte), OS sering menampilkan basis 2 → "disk 1 TB kok cuma terbaca 931 GB?" Itu 10¹² byte ditampilkan sebagai GiB.

---

## 3. Sistem Bilangan

### 3.1 Desimal (basis 10): yang kita pakai sehari-hari

Setiap posisi bernilai pangkat 10:

```
   2    5    7
   │    │    └── 7 × 10⁰ = 7
   │    └─────── 5 × 10¹ = 50
   └──────────── 2 × 10² = 200
                        Total = 257
```

### 3.2 Biner (basis 2)

Setiap posisi bernilai pangkat 2. Untuk jaringan, hafalkan tabel 8 posisi ini:

```
Posisi   :   8    7    6    5    4    3    2    1
Pangkat  :  2⁷   2⁶   2⁵   2⁴   2³   2²   2¹   2⁰
NILAI    : 128   64   32   16    8    4    2    1
```

**Hafalkan baris NILAI itu: 128 64 32 16 8 4 2 1.** Ini alat kerja Anda setiap hari sebagai network engineer.

### 3.3 Heksadesimal (basis 16)

16 simbol: `0 1 2 3 4 5 6 7 8 9 A B C D E F`

| Hex | Desimal | Biner (4 bit) |
|---|---|---|
| 0 | 0 | 0000 |
| 1 | 1 | 0001 |
| 2 | 2 | 0010 |
| 3 | 3 | 0011 |
| 4 | 4 | 0100 |
| 5 | 5 | 0101 |
| 6 | 6 | 0110 |
| 7 | 7 | 0111 |
| 8 | 8 | 1000 |
| 9 | 9 | 1001 |
| A | 10 | 1010 |
| B | 11 | 1011 |
| C | 12 | 1100 |
| D | 13 | 1101 |
| E | 14 | 1110 |
| F | 15 | 1111 |

**Kenapa hex dipakai?** Karena **1 digit hex = tepat 4 bit (1 nibble)**. Ini membuat konversi jadi trivial dan tulisan jadi pendek.

```
Biner : 1010 1100 0001 1111   (16 bit, panjang & rawan salah baca)
Hex   :  A    C    0    1... → AC1F  (4 karakter)
```

Di jaringan, hex dipakai untuk:
- **MAC address**: `00:1A:2B:3C:4D:5E` (6 byte = 12 digit hex)
- **IPv6**: `2001:0db8:85a3::8a2e:0370:7334`
- **EtherType**: `0x0800` = IPv4, `0x0806` = ARP, `0x86DD` = IPv6
- **Isi paket** di Wireshark/tcpdump (hex dump)

> [!TIP]
> Prefiks `0x` menandakan angka hex (`0x1F` = 31 desimal). Prefiks `0b` menandakan biner (`0b11111` = 31).

---

## 4. Konversi: Metode yang Dipakai Praktisi

### 4.1 Biner → Desimal (metode jumlah posisi)

Tulis nilai posisi di atas, jumlahkan yang bitnya 1.

**Contoh: `11000000`**
```
128  64  32  16   8   4   2   1
  1   1   0   0   0   0   0   0
128 +64                          = 192
```

**Contoh: `10101100`**
```
128  64  32  16   8   4   2   1
  1   0   1   0   1   1   0   0
128     +32      +8  +4          = 172
```

**Contoh: `11111111`**
```
128+64+32+16+8+4+2+1 = 255      ← nilai maksimum 1 oktet
```

**Contoh: `11111110`**
```
255 - 1 = 254                    ← trik: kalau hampir penuh, kurangi dari 255
```

### 4.2 Desimal → Biner (metode kurangi dari kiri)

Aturan: mulai dari 128. Kalau angka Anda **≥** nilai posisi, tulis 1 dan kurangi. Kalau **<**, tulis 0 dan lanjut.

**Contoh: 200**
```
200 ≥ 128 ? Ya  → bit=1, sisa = 200-128 = 72
 72 ≥  64 ? Ya  → bit=1, sisa =  72- 64 =  8
  8 ≥  32 ? No  → bit=0
  8 ≥  16 ? No  → bit=0
  8 ≥   8 ? Ya  → bit=1, sisa =   8-  8 =  0
  0 ≥   4 ? No  → bit=0
  0 ≥   2 ? No  → bit=0
  0 ≥   1 ? No  → bit=0

Hasil: 11001000
Verifikasi: 128+64+8 = 200 ✓
```

**Contoh: 172**
```
172 ≥ 128 ✓ → 1, sisa 44
 44 ≥  64 ✗ → 0
 44 ≥  32 ✓ → 1, sisa 12
 12 ≥  16 ✗ → 0
 12 ≥   8 ✓ → 1, sisa 4
  4 ≥   4 ✓ → 1, sisa 0
  0 ≥   2 ✗ → 0
  0 ≥   1 ✗ → 0

Hasil: 10101100 ✓
```

**Contoh: 16**
```
16 ≥ 128 ✗ → 0
16 ≥  64 ✗ → 0
16 ≥  32 ✗ → 0
16 ≥  16 ✓ → 1, sisa 0
sisanya 0000

Hasil: 00010000
```

### 4.3 Nilai Mask yang Wajib Hafal

Dalam subnet mask, bit 1 selalu **berurutan dari kiri** (contiguous). Karena itu hanya 9 nilai oktet ini yang mungkin:

| Biner | Desimal | Jumlah bit 1 |
|---|---|---|
| `00000000` | **0** | 0 |
| `10000000` | **128** | 1 |
| `11000000` | **192** | 2 |
| `11100000` | **224** | 3 |
| `11110000` | **240** | 4 |
| `11111000` | **248** | 5 |
| `11111100` | **252** | 6 |
| `11111110` | **254** | 7 |
| `11111111` | **255** | 8 |

**Hafalkan kolom desimal: 0, 128, 192, 224, 240, 248, 252, 254, 255.**

Trik hafalan: setiap angka adalah *angka sebelumnya + nilai bit berikutnya*:
```
128 → +64 = 192 → +32 = 224 → +16 = 240 → +8 = 248 → +4 = 252 → +2 = 254 → +1 = 255
```

> [!WARNING]
> Kalau Anda melihat subnet mask `255.255.255.100`, itu **tidak valid** — 100 = `01100100`, bit 1-nya tidak berurutan dari kiri.

### 4.4 Biner ↔ Hex (paling mudah dari semua)

Kelompokkan per 4 bit, terjemahkan tiap kelompok.

```
Biner:  1010 1100 . 0001 1111
Hex  :   A    C   .  1    F     →  AC.1F
```

Balik arah:
```
Hex  :  3    E    B    7
Biner: 0011 1110 1011 0111
```

**Contoh MAC address:**
```
MAC : 00 : 1A : 2B : 3C : 4D : 5E
Bin : 00000000 00011010 00101011 00111100 01001101 01011110
```

### 4.5 Hex ↔ Desimal

Lewat biner (paling aman untuk pemula), atau langsung:

```
0x1F = (1 × 16¹) + (15 × 16⁰) = 16 + 15 = 31
0xFF = (15 × 16) + 15 = 240 + 15 = 255
0x0800 = (0×4096) + (8×256) + (0×16) + 0 = 2048
```

### 4.6 Verifikasi dengan Komputer

Selalu latih manual dulu, lalu cek:

```bash
# Desimal → biner
$ printf '%08d\n' $(echo "obase=2; 200" | bc)
11001000

# Biner → desimal
$ echo "$((2#11001000))"
200

# Desimal → hex
$ printf '%X\n' 255
FF

# Hex → desimal
$ echo "$((0xFF))"
255

# Python (paling nyaman)
$ python3 -c "print(bin(200), hex(200), int('11001000',2), int('FF',16))"
0b11001000 0xc8 200 255
```

---

## 5. Pangkat Dua: Tabel Wajib

Dipakai untuk menghitung jumlah subnet dan jumlah host.

| n | 2ⁿ | | n | 2ⁿ |
|---|---|---|---|---|
| 0 | 1 | | 9 | 512 |
| 1 | 2 | | 10 | 1.024 |
| 2 | 4 | | 11 | 2.048 |
| 3 | 8 | | 12 | 4.096 |
| 4 | 16 | | 13 | 8.192 |
| 5 | 32 | | 14 | 16.384 |
| 6 | 64 | | 15 | 32.768 |
| 7 | 128 | | 16 | 65.536 |
| 8 | 256 | | 24 | 16.777.216 |

Angka-angka ini akan Anda kenali di mana-mana:
- **256** — jumlah nilai satu oktet (0-255)
- **1.024** — jumlah VLAN yang praktis dipakai; 4.096 = batas teoretis VLAN 12-bit
- **65.536** — jumlah port TCP/UDP (0-65535)
- **16.777.216** — jumlah alamat di /8 (misalnya seluruh 10.0.0.0/8)
- **4.294.967.296** = 2³² — total alamat IPv4 di dunia

---

## 6. Operasi Bitwise: Inti Subnetting

### 6.1 AND

Hasil 1 hanya jika **kedua** bit 1.

| A | B | A AND B |
|---|---|---|
| 0 | 0 | 0 |
| 0 | 1 | 0 |
| 1 | 0 | 0 |
| 1 | 1 | **1** |

**Inilah operasi yang dilakukan setiap router, setiap kali, untuk setiap paket.**

Router meng-AND alamat IP tujuan dengan subnet mask untuk mendapatkan **network address**:

```
IP tujuan   : 192.168.10.130  =  11000000.10101000.00001010.10000010
Subnet mask : 255.255.255.192 =  11111111.11111111.11111111.11000000
              AND ─────────────────────────────────────────────────────
Network     : 192.168.10.128  =  11000000.10101000.00001010.10000000
```

Artinya: alamat `192.168.10.130` dengan mask `/26` berada di jaringan `192.168.10.128/26`.

Kalau Anda paham operasi ini, subnetting menjadi mekanis, bukan sihir. Kita bahas tuntas di `04-network-layer/02`.

### 6.2 OR

Hasil 1 jika **salah satu** bit 1. Dipakai untuk menghitung **broadcast address** (network OR inverted-mask):

```
Network      : 192.168.10.128 = ...00001010.10000000
Wildcard     :       0.0.0.63 = ...00000000.00111111   (mask dibalik)
               OR ─────────────────────────────────────
Broadcast    : 192.168.10.191 = ...00001010.10111111
```

### 6.3 NOT (komplemen)

Membalik semua bit. Cara mendapat **wildcard mask** dari subnet mask:

```
Subnet mask   : 255.255.255.192 = 11111111.11111111.11111111.11000000
NOT ─────────────────────────────────────────────────────────────────
Wildcard mask :       0.0.0.63  = 00000000.00000000.00000000.00111111
```

Cara cepat tanpa biner: **255 − setiap oktet**.
```
255.255.255.192  →  255-255, 255-255, 255-255, 255-192  →  0.0.0.63
```
Wildcard mask dipakai di ACL dan OSPF (`09-nat-acl-firewall/02`, `07-routing-lanjutan/04`).

### 6.4 XOR

Hasil 1 jika bit **berbeda**. Dipakai di checksum, kriptografi, dan RAID parity.

| A | B | A XOR B |
|---|---|---|
| 0 | 0 | 0 |
| 0 | 1 | 1 |
| 1 | 0 | 1 |
| 1 | 1 | 0 |

### 6.5 Shift

- **Left shift** (`<<`) — geser ke kiri, sama dengan mengalikan 2.
- **Right shift** (`>>`) — geser ke kanan, sama dengan membagi 2 (dibulatkan ke bawah).

```
00000101 (5) << 1 = 00001010 (10)
00000101 (5) >> 1 = 00000010 (2)
```

### Praktik bitwise

```bash
$ python3
>>> ip   = 0xC0A80A82        # 192.168.10.130
>>> mask = 0xFFFFFFC0        # 255.255.255.192
>>> net  = ip & mask
>>> print('.'.join(str((net >> s) & 0xFF) for s in (24,16,8,0)))
192.168.10.128
```

Atau langsung dengan modul standar Python:
```bash
$ python3 -c "import ipaddress; print(ipaddress.ip_network('192.168.10.130/26', strict=False))"
192.168.10.128/26
```

---

## 7. Bagaimana Bit Menjadi "Data"

Sekadar untuk melengkapi gambaran (tidak perlu dihafal):

- **Teks** — setiap karakter dipetakan ke angka. ASCII (7 bit, 128 karakter): `A`=65, `a`=97, `0`=48. UTF-8 (1-4 byte) menampung semua bahasa.
- **Bilangan** — integer (2's complement untuk negatif), floating point (IEEE 754).
- **Gambar** — piksel × kanal warna (RGB 3 byte/piksel), lalu dikompres (JPEG/PNG).
- **Suara** — sampling (44.100 sampel/detik × 16 bit × 2 kanal = 1,4 Mbps untuk audio CD).

Kenapa relevan? Karena inilah alasan **ukuran matters di jaringan**: video 4K butuh 25 Mbps, panggilan VoIP butuh 87 kbps. Kebutuhan bandwidth berasal dari sini.

```bash
# Lihat teks menjadi byte
$ echo -n "Hi" | xxd
00000000: 4869                                     Hi
#          ^^ ^^  → 0x48=72='H', 0x69=105='i'
```

---

## 8. Kesalahan Umum

> [!WARNING]
> **1. Tertukar bit dan byte.** "Link 1 Gbps" bukan 1 GB/s, tapi ~125 MB/s.

> [!WARNING]
> **2. Mengira subnet mask bisa nilai apa saja.** Hanya 9 nilai per oktet yang valid (lihat §4.3).

> [!WARNING]
> **3. Lupa bahwa oktet maksimal 255.** `192.168.300.1` bukan alamat IP yang valid.

> [!WARNING]
> **4. Menghitung 2ⁿ untuk host tanpa mengurangi 2.** Jumlah host usable = 2ⁿ − 2 (network address & broadcast address tidak bisa dipakai host). Detail di `04-network-layer/02`.

> [!WARNING]
> **5. Membaca hex sebagai desimal.** `0x10` = 16, bukan 10. Ini sering terjadi saat membaca EtherType atau IPv6.

---

## 9. Ringkasan

- 1 byte = 8 bit = 2 digit hex. 1 nibble = 4 bit = 1 digit hex.
- Nilai posisi biner 8 bit: **128 64 32 16 8 4 2 1** — hafalkan.
- Nilai oktet mask yang valid: **0 128 192 224 240 248 252 254 255** — hafalkan.
- Konversi biner→desimal = jumlahkan posisi yang bernilai 1.
- Konversi desimal→biner = kurangi dari 128 ke bawah.
- Biner↔hex = kelompokkan 4 bit.
- **AND** IP dengan mask = network address. Ini yang dilakukan router.
- Wildcard mask = 255 − setiap oktet mask.
- bps (bit) untuk kecepatan link; B (byte) untuk ukuran file. Bagi 8 untuk konversi.

---

## 10. Latihan

Kerjakan **tanpa kalkulator**. Target: 10 soal dalam 5 menit.

1. `11001101` → desimal
2. `10000001` → desimal
3. 210 → biner
4. 63 → biner
5. `11111100` → desimal, dan berapa bit 1-nya?
6. Konversi `10110110 11001010` → hex
7. `0x2C` → desimal → biner
8. Subnet mask `/27` ditulis dalam desimal bertitik?
9. Wildcard mask untuk `255.255.240.0`?
10. `192.168.5.77 AND 255.255.255.240` = ?
11. Berapa MB/s maksimum teoretis dari link 40 Mbps?
12. MAC `AC:DE:48:00:11:22` — tulis oktet pertama dalam biner.

<details>
<summary>Jawaban</summary>

1. `11001101` → 128+64+8+4+1 = **205**
2. `10000001` → 128+1 = **129**
3. 210: 210≥128✓(sisa 82), 82≥64✓(sisa 18), 18≥32✗, 18≥16✓(sisa 2), 2≥8✗, 2≥4✗, 2≥2✓(sisa 0), 0≥1✗ → **11010010**
4. 63 = 32+16+8+4+2+1 → **00111111**
5. `11111100` = 252, ada **6** bit 1.
6. `1011 0110 1100 1010` → **B6CA**
7. `0x2C` = (2×16)+12 = **44** = **00101100**
8. /27 = 27 bit 1: `11111111.11111111.11111111.11100000` → **255.255.255.224**
9. 255−255, 255−255, 255−240, 255−0 → **0.0.15.255**
10. Oktet 4: 77 = `01001101`, mask 240 = `11110000`, AND = `01000000` = 64. Oktet 1-3 tidak berubah karena mask 255. → **192.168.5.64**
11. 40 ÷ 8 = **5 MB/s**
12. `AC` = A(1010) C(1100) → **10101100**

</details>

---

## 11. Sumber

- RFC 791 (Internet Protocol) — pemakaian istilah "octet"
- IEC 80000-13 — standar prefiks biner (kibi, mebi, gibi)
- IEEE 802 — format MAC address dan penulisan hex
- Python `ipaddress` module — https://docs.python.org/3/library/ipaddress.html

---

**Berikutnya:** `00-fondasi/03-sinyal-bandwidth-latency.md`. Apa yang sebenarnya terjadi pada bit saat melintasi kabel.

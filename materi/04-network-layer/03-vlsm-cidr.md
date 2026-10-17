# 04.3 VLSM, CIDR, Summarization, dan Wildcard Mask

> **Prasyarat:** `04-network-layer/02` (subnetting harus lancar)
> **Tujuan:** Anda bisa merancang IP plan efisien dengan VLSM, meringkas rute, dan menghitung wildcard mask untuk ACL dan OSPF.

---

## 1. VLSM (Variable Length Subnet Mask)

Subnetting biasa (**FLSM**, *Fixed Length*) membagi jaringan menjadi potongan **sama besar**. VLSM membagi menjadi potongan **berbeda ukuran** sesuai kebutuhan.

### Masalah dengan FLSM

Kebutuhan nyata:
```
Kantor Pusat  : 100 host
Cabang A      :  50 host
Cabang B      :  25 host
Cabang C      :  10 host
Link WAN 1    :   2 host
Link WAN 2    :   2 host
Link WAN 3    :   2 host
────────────────────────
Total          : 191 host
```

Tersedia: `192.168.1.0/24` (254 alamat).

**Dengan FLSM** — semua subnet harus seukuran subnet terbesar (/25 untuk 100 host):
```
/25 → hanya ada 2 subnet dalam /24
→ TIDAK CUKUP untuk 7 jaringan ❌
```

Kalaupun dipaksa dengan /26 (62 host):
```
4 subnet × 62 host = masih tidak cukup untuk kantor pusat (100 host) ❌
```

**FLSM gagal total** di sini.

### Dengan VLSM

```
Kantor Pusat  100 host → butuh /25 (126 host)
Cabang A       50 host → butuh /26 (62 host)
Cabang B       25 host → butuh /27 (30 host)
Cabang C       10 host → butuh /28 (14 host)
Link WAN ×3     2 host → butuh /30 (2 host) masing-masing
```

Total alamat terpakai: 128 + 64 + 32 + 16 + 4 + 4 + 4 = **252 dari 256** ✅

---

## 2. Aturan Emas VLSM: Alokasikan dari Besar ke Kecil

> [!WARNING]
> **Ini aturan yang tidak boleh dilanggar.** Kalau Anda mengalokasikan subnet kecil dulu, subnet besar tidak akan muat karena batas alignment.

### Contoh alokasi lengkap dari `192.168.1.0/24`

**Langkah 1 — Urutkan kebutuhan dari besar ke kecil:**
```
1. Kantor Pusat : 100 host → /25 (128 alamat)
2. Cabang A     :  50 host → /26 (64 alamat)
3. Cabang B     :  25 host → /27 (32 alamat)
4. Cabang C     :  10 host → /28 (16 alamat)
5. WAN 1        :   2 host → /30 (4 alamat)
6. WAN 2        :   2 host → /30 (4 alamat)
7. WAN 3        :   2 host → /30 (4 alamat)
```

**Langkah 2 — Alokasikan berurutan:**

```
┌─ Kantor Pusat ─────────────────────────────────────────────────┐
│ 192.168.1.0/25                                                 │
│   Network   : 192.168.1.0                                      │
│   Host      : 192.168.1.1   – 192.168.1.126                    │
│   Broadcast : 192.168.1.127                                    │
│   Kapasitas : 126 host (butuh 100) ✅                          │
└────────────────────────────────────────────────────────────────┘
   Berikutnya mulai dari 192.168.1.128

┌─ Cabang A ─────────────────────────────────────────────────────┐
│ 192.168.1.128/26                                               │
│   Network   : 192.168.1.128                                    │
│   Host      : 192.168.1.129 – 192.168.1.190                    │
│   Broadcast : 192.168.1.191                                    │
│   Kapasitas : 62 host (butuh 50) ✅                            │
└────────────────────────────────────────────────────────────────┘
   Berikutnya mulai dari 192.168.1.192

┌─ Cabang B ─────────────────────────────────────────────────────┐
│ 192.168.1.192/27                                               │
│   Network   : 192.168.1.192                                    │
│   Host      : 192.168.1.193 – 192.168.1.222                    │
│   Broadcast : 192.168.1.223                                    │
│   Kapasitas : 30 host (butuh 25) ✅                            │
└────────────────────────────────────────────────────────────────┘
   Berikutnya mulai dari 192.168.1.224

┌─ Cabang C ─────────────────────────────────────────────────────┐
│ 192.168.1.224/28                                               │
│   Network   : 192.168.1.224                                    │
│   Host      : 192.168.1.225 – 192.168.1.238                    │
│   Broadcast : 192.168.1.239                                    │
│   Kapasitas : 14 host (butuh 10) ✅                            │
└────────────────────────────────────────────────────────────────┘
   Berikutnya mulai dari 192.168.1.240

┌─ WAN 1 ────────────────────────────────────────────────────────┐
│ 192.168.1.240/30   → host .241 – .242, broadcast .243          │
├─ WAN 2 ────────────────────────────────────────────────────────┤
│ 192.168.1.244/30   → host .245 – .246, broadcast .247          │
├─ WAN 3 ────────────────────────────────────────────────────────┤
│ 192.168.1.248/30   → host .249 – .250, broadcast .251          │
└────────────────────────────────────────────────────────────────┘

Sisa: 192.168.1.252/30 (cadangan untuk WAN keempat)
```

### Kenapa harus besar dulu?

Kalau kita alokasikan Cabang C (/28) lebih dulu:
```
192.168.1.0/28   → Cabang C (0–15)
Sisa mulai dari 192.168.1.16

Kantor Pusat butuh /25. Batas /25 hanya ada di .0 dan .128.
192.168.1.16 BUKAN batas /25 yang valid.
→ harus lompat ke 192.168.1.128 → membuang 112 alamat (16–127)
```

Aturan **alignment**: sebuah subnet /N harus dimulai pada alamat yang merupakan kelipatan dari ukuran block-nya. `/25` hanya bisa mulai di `.0` atau `.128`; `/26` hanya di `.0`, `.64`, `.128`, `.192`; dan seterusnya.

---

## 3. Latihan VLSM Lengkap

**Soal:** Anda diberi `172.16.0.0/22` untuk kampus dengan kebutuhan:
```
Gedung A : 400 host
Gedung B : 200 host
Gedung C : 100 host
Lab       :  60 host
Server    :  25 host
Wi-Fi Tamu:  50 host
4 link P2P antar-router
```

<details>
<summary>Solusi lengkap</summary>

`172.16.0.0/22` = 172.16.0.0-172.16.3.255 (1024 alamat)

**Urutkan besar ke kecil:**
```
Gedung A  400 → /23 (510 host, 512 alamat)
Gedung B  200 → /24 (254 host, 256 alamat)
Gedung C  100 → /25 (126 host, 128 alamat)
Lab        60 → /26 (62 host, 64 alamat)
Wi-Fi Tamu 50 → /26 (62 host, 64 alamat)
Server     25 → /27 (30 host, 32 alamat)
P2P ×4      2 → /30 (2 host, 4 alamat) × 4 = 16 alamat
```
Total = 512 + 256 + 128 + 64 + 64 + 32 + 16 = **1072 alamat**

> [!WARNING]
> **1072 > 1024 — TIDAK CUKUP!**

Ini pelajaran penting: **selalu jumlahkan dulu sebelum mulai mengalokasikan.**

Opsi perbaikan:
- (a) Minta blok lebih besar (`/21`)
- (b) Kurangi ruang tumbuh: Gedung A dipecah menjadi dua VLAN /24, Wi-Fi tamu dipakaikan /26 yang sama dengan lab
- (c) Pakai alamat privat lain untuk sebagian kebutuhan

**Solusi dengan /21** (`172.16.0.0/21` = 172.16.0.0-172.16.7.255, 2048 alamat):
```
Gedung A   : 172.16.0.0/23     (host 172.16.0.1   – 172.16.1.254)
Gedung B   : 172.16.2.0/24     (host 172.16.2.1   – 172.16.2.254)
Gedung C   : 172.16.3.0/25     (host 172.16.3.1   – 172.16.3.126)
Lab        : 172.16.3.128/26   (host 172.16.3.129 – 172.16.3.190)
Wi-Fi Tamu : 172.16.3.192/26   (host 172.16.3.193 – 172.16.3.254)
Server     : 172.16.4.0/27     (host 172.16.4.1   – 172.16.4.30)
P2P-1      : 172.16.4.32/30    (host .33 – .34)
P2P-2      : 172.16.4.36/30    (host .37 – .38)
P2P-3      : 172.16.4.40/30    (host .41 – .42)
P2P-4      : 172.16.4.44/30    (host .45 – .46)

Sisa: 172.16.4.48 – 172.16.7.255 → ruang tumbuh besar ✅
```

</details>

---

## 4. CIDR dan Summarization

**CIDR** (*Classless Inter-Domain Routing*) adalah kebalikan subnetting: menggabungkan banyak jaringan kecil menjadi satu iklan rute besar.

Disebut juga: **route summarization**, **supernetting**, **route aggregation**.

### Kenapa perlu

```
Tanpa summarization — router harus menyimpan 4 rute:
  192.168.0.0/24 via R2
  192.168.1.0/24 via R2
  192.168.2.0/24 via R2
  192.168.3.0/24 via R2

Dengan summarization — cukup 1 rute:
  192.168.0.0/22 via R2
```

Manfaat:
1. **Routing table lebih kecil** → lookup lebih cepat, memori lebih hemat
2. **Stabilitas lebih baik** — perubahan di dalam blok tidak menyebar ke luar (mengurangi *route flapping*)
3. **Konvergensi lebih cepat**
4. **Bandwidth control plane lebih hemat**

> [!TIP]
> Ini yang menjaga internet tetap bisa dikelola: tanpa CIDR, tabel routing global akan berisi jutaan entri /24 alih-alih ~1 juta entri agregat.

### Cara menghitung summary route

**Metode:** cari bit-bit awal yang **sama** di semua jaringan.

**Contoh 1:**
```
192.168.0.0 = 11000000.10101000.00000000.00000000
192.168.1.0 = 11000000.10101000.00000001.00000000
192.168.2.0 = 11000000.10101000.00000010.00000000
192.168.3.0 = 11000000.10101000.00000011.00000000
              └────── 22 bit sama ──────┘└─ berbeda ─┘

SUMMARY = 192.168.0.0/22
```

**Contoh 2:**
```
10.1.0.0/16
10.2.0.0/16
10.3.0.0/16

10.1 = 00001010.00000001
10.2 = 00001010.00000010
10.3 = 00001010.00000011
       └─ 8 ─┘ └─ 6 ─┘
       14 bit pertama sama

SUMMARY = 10.0.0.0/14
```

> [!WARNING]
> **Perhatikan:** `10.0.0.0/14` mencakup `10.0.0.0` – `10.3.255.255` — termasuk **10.0.0.0/16 yang tidak ada dalam daftar**. Ini disebut **over-summarization**.

### Bahaya over-summarization

```
Router mengiklankan 10.0.0.0/14 padahal hanya punya 10.1, 10.2, 10.3

Paket ke 10.0.5.5 (yang sebenarnya ada di router LAIN):
→ dikirim ke router ini
→ router tidak punya rute spesifik
→ paket DIBUANG (black hole)
```

**Aman jika:** Anda benar-benar memiliki seluruh blok, atau ada default route yang menangani sisanya.

**Mitigasi:** buat **null route** untuk blok summary agar paket yang tidak cocok dibuang secara sadar (dan tidak mengikuti default route ke tempat yang salah):
```
R1(config)# ip route 10.0.0.0 255.252.0.0 null0
```

### Cara cepat menentukan prefix summary

```
1. Cari jumlah jaringan yang akan diringkas → bulatkan ke pangkat 2
2. Prefix summary = prefix asli − log₂(jumlah)

Contoh: 4 jaringan /24 → log₂(4) = 2 → summary = /22
        8 jaringan /24 → log₂(8) = 3 → summary = /21
        2 jaringan /24 → log₂(2) = 1 → summary = /23
```

> [!WARNING]
> **Syarat:** jaringan harus **berurutan** dan **selaras (aligned)** pada batas blok summary.
```
✅ Bisa diringkas: 192.168.0.0/24, .1.0/24, .2.0/24, .3.0/24 → /22
❌ Tidak bisa    : 192.168.1.0/24, .2.0/24, .3.0/24, .4.0/24
   (mulai dari .1 bukan batas /22 yang valid — batas /22 ada di .0, .4, .8, ...)
```

### Konfigurasi summarization

**OSPF** (hanya di ABR/ASBR):
```
R1(config)# router ospf 1
R1(config-router)# area 1 range 192.168.0.0 255.255.252.0     ← inter-area
R1(config-router)# summary-address 10.0.0.0 255.252.0.0       ← external (ASBR)
```

**EIGRP** (per interface):
```
R1(config)# interface gi0/0
R1(config-if)# ip summary-address eigrp 100 192.168.0.0 255.255.252.0
```

**BGP:**
```
R1(config-router)# aggregate-address 192.168.0.0 255.255.252.0 summary-only
```

### Desain hierarkis untuk summarization yang rapi

Summarization hanya efektif kalau alokasi alamat **hierarkis sejak awal**.

```
Perusahaan: 10.0.0.0/8

  Jakarta     : 10.0.0.0/12    (10.0.0.0 – 10.15.255.255)
    Gedung A  : 10.0.0.0/16
      Lantai 1: 10.0.1.0/24
      Lantai 2: 10.0.2.0/24
    Gedung B  : 10.1.0.0/16
  Surabaya    : 10.16.0.0/12   (10.16.0.0 – 10.31.255.255)
  Medan       : 10.32.0.0/12
  Data Center : 10.240.0.0/12
```

Dengan skema ini, router core cukup menyimpan satu rute per kota, bukan ratusan rute per lantai.

> [!WARNING]
> **Ini keputusan desain yang harus dibuat di awal.** Mengubah skema alamat setelah jaringan berjalan adalah proyek besar.

---

## 5. Wildcard Mask

Kebalikan dari subnet mask, dipakai di **ACL** dan **OSPF**.

```
Subnet mask  : 1 = harus cocok, 0 = bebas
Wildcard mask: 0 = harus cocok, 1 = bebas   ← TERBALIK
```

### Konversi cepat

```
Wildcard = 255.255.255.255 − subnet mask

255.255.255.0   → 0.0.0.255
255.255.255.192 → 0.0.0.63
255.255.240.0   → 0.0.15.255
255.255.255.252 → 0.0.0.3
255.255.255.255 → 0.0.0.0     (host tunggal)
0.0.0.0         → 255.255.255.255  (semua alamat)
```

### Kata kunci pintas

```
host 192.168.1.10   ≡  192.168.1.10 0.0.0.0
any                 ≡  0.0.0.0 255.255.255.255
```

### Contoh pemakaian

**ACL:**
```
R1(config)# access-list 10 permit 192.168.1.0 0.0.0.255
   → izinkan seluruh 192.168.1.0/24

R1(config)# access-list 10 permit 192.168.1.64 0.0.0.63
   → izinkan 192.168.1.64/26

R1(config)# access-list 10 permit host 192.168.1.10
   → izinkan satu host saja
```

**OSPF:**
```
R1(config-router)# network 192.168.1.0 0.0.0.255 area 0
   → aktifkan OSPF pada interface yang alamatnya di 192.168.1.0/24
```

### Wildcard tidak harus berurutan

Ini kemampuan yang tidak dimiliki subnet mask: wildcard bisa mencocokkan pola yang tidak kontinu.

**Contoh: cocokkan semua subnet ganjil** `192.168.1.0`, `.3.0`, `.5.0`, ...
```
Wildcard 0.0.254.255 pada 192.168.1.0:

192.168.1.0 dengan wildcard 0.0.254.255
Oktet 3: 1 = 00000001
Wildcard: 254 = 11111110
          → hanya bit terakhir yang harus cocok (=1) → semua angka ganjil
```

**Contoh: cocokkan semua subnet genap:**
```
access-list 10 permit 192.168.0.0 0.0.254.255
```

> [!TIP]
> Trik ini berguna untuk ACL yang ringkas, tetapi **kurangi pemakaiannya** — sulit dibaca orang lain dan mudah salah. Kejelasan lebih penting daripada keringkasan pada konfigurasi produksi.

---

## 6. /30 vs /31 untuk Link Point-to-Point

Link antar-router hanya butuh 2 alamat.

**/30 (tradisional):**
```
10.0.0.0/30
  .0 = network (terbuang)
  .1 = router A
  .2 = router B
  .3 = broadcast (terbuang)

Efisiensi: 2 dari 4 = 50%
```

**/31 (RFC 3021):**
```
10.0.0.0/31
  .0 = router A
  .1 = router B

Efisiensi: 2 dari 2 = 100%
```

Untuk jaringan dengan 500 link P2P:
```
/30 → 500 × 4 = 2000 alamat
/31 → 500 × 2 = 1000 alamat
Hemat 1000 alamat ✅
```

```
R1(config-if)# ip address 10.0.0.0 255.255.255.254
R2(config-if)# ip address 10.0.0.1 255.255.255.254
```

> [!WARNING]
> Beberapa perangkat dan software lama tidak mendukung /31. Uji dulu sebelum menerapkannya luas. Didukung: Cisco IOS/IOS-XE/NX-OS, Juniper, Arista, Linux, FRR.

> [!TIP]
> **Alternatif modern:** **unnumbered interface** — link P2P tidak diberi alamat sama sekali, meminjam alamat loopback router.
```
R1(config-if)# ip unnumbered loopback0
```
Ini yang dipakai di data center modern dengan BGP unnumbered (memakai IPv6 link-local untuk peering).

---

## 7. Praktik

```bash
# Hitung summary route
$ python3 -c "
import ipaddress
nets = ['192.168.0.0/24','192.168.1.0/24','192.168.2.0/24','192.168.3.0/24']
nets = [ipaddress.ip_network(n) for n in nets]
for s in ipaddress.collapse_addresses(nets):
    print(s)
"
192.168.0.0/22

# Cek apakah bisa diringkas (tidak berurutan)
$ python3 -c "
import ipaddress
nets = [ipaddress.ip_network(n) for n in
        ['192.168.1.0/24','192.168.2.0/24','192.168.3.0/24','192.168.4.0/24']]
print(list(ipaddress.collapse_addresses(nets)))
"
[IPv4Network('192.168.1.0/24'), IPv4Network('192.168.2.0/23'), IPv4Network('192.168.4.0/24')]
# → tidak bisa jadi satu blok karena tidak aligned

# Pecah blok besar menjadi VLSM
$ python3 -c "
import ipaddress
base = ipaddress.ip_network('192.168.1.0/24')
needs = [('Pusat',25),('CabangA',26),('CabangB',27),('CabangC',28),
         ('WAN1',30),('WAN2',30),('WAN3',30)]
cur = base
avail = [base]
for name, plen in needs:
    for i, blk in enumerate(avail):
        if blk.prefixlen <= plen:
            sub = next(blk.subnets(new_prefix=plen))
            avail.pop(i)
            avail.extend(x for x in blk.address_exclude(sub))
            avail.sort()
            print(f'{name:10} {sub}  host {list(sub.hosts())[0]}-{list(sub.hosts())[-1]}')
            break
"

# Wildcard mask
$ python3 -c "
import ipaddress
m = ipaddress.ip_network('0.0.0.0/26').netmask
print('subnet :', m)
print('wildcard:', ipaddress.ip_address(int(ipaddress.ip_address('255.255.255.255')) - int(m)))
"
```

---

## 8. Kesalahan Umum

> [!WARNING]
> **1. Mengalokasikan VLSM dari kecil ke besar.** Subnet besar tidak akan muat karena alignment.

> [!WARNING]
> **2. Tidak menjumlahkan kebutuhan total dulu.** Baru sadar kekurangan alamat setelah setengah jalan.

> [!WARNING]
> **3. Over-summarization.** Mengiklankan blok yang mencakup jaringan milik pihak lain → black hole.

> [!WARNING]
> **4. Meringkas jaringan yang tidak aligned.** `192.168.1.0`–`.4.0` tidak bisa menjadi satu /22.

> [!WARNING]
> **5. Tertukar subnet mask dan wildcard mask** di ACL/OSPF. Cisco menerima keduanya di beberapa konteks, sehingga kesalahan tidak selalu langsung terlihat.

> [!WARNING]
> **6. Alokasi alamat yang tidak hierarkis.** Membuat summarization mustahil di kemudian hari.

> [!WARNING]
> **7. Membuat subnet terlalu pas tanpa ruang tumbuh.**

---

## 9. Ringkasan

- **VLSM** = subnet berbeda ukuran sesuai kebutuhan; **selalu alokasikan dari besar ke kecil**.
- Subnet /N harus dimulai pada kelipatan ukuran blok-nya (**alignment**).
- Selalu **jumlahkan total kebutuhan** sebelum mulai mengalokasikan.
- **CIDR/summarization** menggabungkan rute: tabel lebih kecil, konvergensi lebih cepat, stabilitas lebih baik.
- Summary prefix = prefix asli − log₂(jumlah jaringan); jaringan harus berurutan dan aligned.
- **Over-summarization → black hole.** Mitigasi dengan null route.
- Summarization efektif hanya kalau alokasi alamat **hierarkis sejak awal** — keputusan desain di depan.
- **Wildcard mask** = 255.255.255.255 − subnet mask; `0` = harus cocok, `1` = bebas. Dipakai di ACL & OSPF.
- **/31** (RFC 3021) menghemat 50% alamat pada link P2P dibanding /30; unnumbered lebih hemat lagi.

---

## 10. Latihan

1. Alokasikan `192.168.10.0/24` untuk: 60 host, 30 host, 12 host, 12 host, 2 link P2P. Tunjukkan setiap subnet lengkap.
2. Ringkas jaringan berikut: `172.16.4.0/24`, `172.16.5.0/24`, `172.16.6.0/24`, `172.16.7.0/24`.
3. Bisakah `10.1.0.0/16`, `10.2.0.0/16`, `10.3.0.0/16`, `10.4.0.0/16` diringkas menjadi satu blok? Jelaskan.
4. Wildcard mask untuk `255.255.252.0`?
5. Berapa alamat yang dihemat jika 200 link P2P memakai /31 alih-alih /30?
6. Apa risiko mengiklankan `10.0.0.0/8` dari sebuah cabang yang hanya memiliki `10.5.0.0/16`?
7. Anda diminta merancang skema alamat untuk perusahaan dengan 5 kota, masing-masing sampai 8 gedung, masing-masing sampai 20 lantai dengan maksimum 200 host per lantai. Rancang skema hierarkis dari `10.0.0.0/8`.

<details>
<summary>Jawaban</summary>

1. Urutkan besar ke kecil: 60→/26, 30→/27, 12→/28, 12→/28, 2→/30, 2→/30.
   ```
   60 host : 192.168.10.0/26    host .1   – .62,   bcast .63
   30 host : 192.168.10.64/27   host .65  – .94,   bcast .95
   12 host : 192.168.10.96/28   host .97  – .110,  bcast .111
   12 host : 192.168.10.112/28  host .113 – .126,  bcast .127
   P2P-1   : 192.168.10.128/30  host .129 – .130,  bcast .131
   P2P-2   : 192.168.10.132/30  host .133 – .134,  bcast .135
   Sisa    : 192.168.10.136 – .255 (ruang tumbuh)
   ```

2. Empat jaringan /24 berurutan dan aligned (mulai dari .4 yang merupakan kelipatan 4).
   log₂(4) = 2 → 24 − 2 = **/22** → **`172.16.4.0/22`** (mencakup 172.16.4.0-172.16.7.255).

3. **Tidak bisa menjadi satu blok.** Empat jaringan berurutan membutuhkan /14, tetapi batas /14 ada di 10.0, 10.4, 10.8, ... — sehingga 10.1-10.4 tidak aligned.
   - `10.0.0.0/14` mencakup 10.0-10.3 (memasukkan 10.0 yang tidak dimiliki, dan tidak mencakup 10.4).
   - Ringkasan yang benar: **`10.1.0.0/16` + `10.2.0.0/15` + `10.4.0.0/16`** (tiga rute), atau terima over-summarization `10.0.0.0/13` (10.0-10.7) jika seluruh blok itu memang milik Anda.

4. 255−255, 255−255, 255−252, 255−0 → **`0.0.3.255`**.

5. /30 = 4 alamat per link → 200 × 4 = 800. /31 = 2 alamat per link → 200 × 2 = 400. **Hemat 400 alamat.**

6. **Over-summarization → black hole.** Cabang itu mengiklankan bahwa ia dapat menjangkau seluruh `10.0.0.0/8` (16,7 juta alamat), padahal hanya memiliki `10.5.0.0/16`. Router lain akan mengirimkan trafik untuk `10.7.x.x`, `10.20.x.x`, dan seterusnya ke cabang tersebut. Cabang tidak punya rute spesifik untuk itu, sehingga paket dibuang — atau lebih buruk, dikirim ke default route-nya dan berputar. Lokasi tujuan yang sebenarnya menjadi tidak terjangkau dari sebagian jaringan. Perbaikan: iklankan hanya `10.5.0.0/16`.

7. Perhitungan kebutuhan: 200 host per lantai → butuh /24 (254 host). 20 lantai × /24 = /24 × 20 → bulatkan ke 32 → gedung butuh **/19** (32 × /24). 8 gedung → bulatkan ke 8 → kota butuh **/16** (8 × /19). 5 kota → bulatkan ke 8 → total **/13** cukup, tetapi untuk kejelasan berikan **/12 per kota** (ruang tumbuh besar).

   Skema yang bersih dan mudah dibaca:
   ```
   Perusahaan          : 10.0.0.0/8

   Kota 1 (Jakarta)    : 10.0.0.0/13    (10.0.0.0   – 10.7.255.255)
   Kota 2 (Surabaya)   : 10.8.0.0/13    (10.8.0.0   – 10.15.255.255)
   Kota 3 (Bandung)    : 10.16.0.0/13
   Kota 4 (Medan)      : 10.24.0.0/13
   Kota 5 (Makassar)   : 10.32.0.0/13
   Cadangan/DC         : 10.40.0.0/13 dan seterusnya

   Dalam Jakarta (10.0.0.0/13):
     Gedung 1          : 10.0.0.0/16
     Gedung 2          : 10.1.0.0/16
     ...
     Gedung 8          : 10.7.0.0/16

   Dalam Gedung 1 (10.0.0.0/16):
     Lantai 1          : 10.0.1.0/24
     Lantai 2          : 10.0.2.0/24
     ...
     Lantai 20         : 10.0.20.0/24
     (10.0.0.0/24 dan 10.0.100+.0/24 untuk infrastruktur/manajemen)
   ```
   Dengan skema ini: router core cukup menyimpan **5 rute** (satu per kota); router kota menyimpan **8 rute** (satu per gedung); router gedung menyimpan rute per lantai. Setiap tingkat bisa melakukan summarization dengan bersih.

</details>

---

## 11. Sumber

- RFC 1519 & RFC 4632 — Classless Inter-Domain Routing (CIDR)
- RFC 1878 — Variable Length Subnet Table
- RFC 3021 — Using 31-Bit Prefixes on IPv4 Point-to-Point Links
- RFC 5735 / RFC 6890 — Special-Purpose IP Address Registries
- Cisco CCNA 200-301 v1.1, topik 1.6 dan 5.6 (ACL, wildcard mask)

---

**Berikutnya:** `04-network-layer/04-arp-icmp.md`. Protokol pendamping yang membuat IP bekerja.

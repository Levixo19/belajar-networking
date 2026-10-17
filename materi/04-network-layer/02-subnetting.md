# 04.2 Subnetting

> **Prasyarat:** `00-fondasi/02` (biner — **wajib kuasai**), `04-network-layer/01`
> **Tujuan:** Anda bisa mengerjakan soal subnetting apa pun dalam **kurang dari 30 detik tanpa kalkulator**.

Subnetting adalah keterampilan yang **paling sering diuji** dan **paling sering menghambat** orang di CCNA/Network+. Kabar baiknya: setelah Anda memahami satu metode dan melatihnya, ini menjadi mekanis.

---

## 1. Kenapa Subnetting

Anda diberi `192.168.1.0/24` (254 host) untuk kantor dengan:
- 50 PC staf
- 20 telepon IP
- 10 server
- 5 printer
- 2 link ke router

**Tanpa subnetting** — semua di satu jaringan:
```
❌ Satu broadcast domain untuk semua → broadcast dari printer sampai ke server
❌ Tidak ada isolasi keamanan → tamu bisa mengakses server
❌ Tidak bisa menerapkan QoS berbeda untuk suara
❌ Satu broadcast storm melumpuhkan semuanya
```

**Dengan subnetting** — dipecah menjadi beberapa jaringan kecil:
```
✅ Broadcast terisolasi per kelompok
✅ Bisa memasang ACL/firewall antar-kelompok
✅ QoS per subnet
✅ Failure domain lebih kecil
✅ Alamat lebih efisien (subnet kecil untuk kebutuhan kecil)
```

---

## 2. Cara Kerja: Meminjam Bit Host

Subnetting = **memindahkan batas** antara network dan host, dengan meminjam bit dari bagian host.

```
192.168.1.0/24 asli:
  11000000.10101000.00000001.00000000
  └──── network (24 bit) ──┘└host(8)┘
  → 1 jaringan, 254 host

Pinjam 2 bit host → /26:
  11000000.10101000.00000001.00000000
  └──── network (26 bit) ────┘└host┘
                          ^^
                       dipinjam
  → 4 subnet, masing-masing 62 host
```

**Rumus:**
```
Jumlah subnet      = 2^(bit yang dipinjam)
Jumlah host usable = 2^(bit host tersisa) − 2
```

| Bit dipinjam | Prefix baru | Jumlah subnet | Host per subnet |
|---|---|---|---|
| 0 | /24 | 1 | 254 |
| 1 | /25 | 2 | 126 |
| 2 | /26 | 4 | 62 |
| 3 | /27 | 8 | 30 |
| 4 | /28 | 16 | 14 |
| 5 | /29 | 32 | 6 |
| 6 | /30 | 64 | 2 |

**Trade-off mendasar:** makin banyak subnet, makin sedikit host per subnet. Total alamat tetap.

---

## 3. Metode Magic Number (Cara Cepat)

Ini metode yang dipakai praktisi. Kuasai ini dan Anda tidak perlu menggambar biner lagi.

### Langkah

```
1. Cari OKTET YANG MENENTUKAN (interesting octet)
   → oktet tempat mask berubah dari 255 ke angka lain

2. Hitung BLOCK SIZE (magic number)
   → block size = 256 − nilai oktet mask tersebut

3. Kelipatan block size = batas-batas subnet

4. Cari subnet tempat IP berada
   → network address = kelipatan terbesar yang ≤ nilai oktet IP

5. Broadcast = network berikutnya − 1
6. Host range = network+1 sampai broadcast−1
```

### Contoh 1: `192.168.1.100/26`

```
Langkah 1: /26 → mask 255.255.255.192
           Oktet menentukan = oktet ke-4 (nilai 192)

Langkah 2: Block size = 256 − 192 = 64

Langkah 3: Kelipatan 64: 0, 64, 128, 192, (256)

Langkah 4: IP oktet ke-4 = 100
           Kelipatan terbesar yang ≤ 100 → 64
           NETWORK = 192.168.1.64

Langkah 5: Network berikutnya = 128
           BROADCAST = 128 − 1 = 192.168.1.127

Langkah 6: HOST RANGE = 192.168.1.65 – 192.168.1.126
           Jumlah host = 62
```

Waktu pengerjaan setelah terlatih: **~10 detik.**

### Contoh 2: `10.5.7.200/28`

```
/28 → 255.255.255.240
Block size = 256 − 240 = 16
Kelipatan 16: 0,16,32,48,64,80,96,112,128,144,160,176,192,208,224,240

IP oktet 4 = 200 → kelipatan terbesar ≤ 200 adalah 192

NETWORK   = 10.5.7.192
BROADCAST = 208 − 1 = 10.5.7.207
HOST      = 10.5.7.193 – 10.5.7.206
Jumlah    = 14
```

### Contoh 3: `172.16.35.90/20` (oktet ke-3 yang menentukan)

```
/20 → 255.255.240.0
Oktet menentukan = oktet ke-3 (nilai 240)
Block size = 256 − 240 = 16
Kelipatan 16 pada oktet ke-3: 0,16,32,48,64,...

IP oktet 3 = 35 → kelipatan terbesar ≤ 35 adalah 32

NETWORK   = 172.16.32.0
BROADCAST = 172.16.(48−1).255 = 172.16.47.255
HOST      = 172.16.32.1 – 172.16.47.254
Jumlah    = 2^12 − 2 = 4094
```

> [!WARNING]
> **Perhatikan:** saat oktet ke-3 yang menentukan, oktet ke-4 ikut menjadi bagian host. Broadcast berakhir dengan `.255`, dan host terakhir adalah `.254`.

### Contoh 4: `10.100.50.75/12` (oktet ke-2 yang menentukan)

```
/12 → 255.240.0.0
Oktet menentukan = oktet ke-2 (nilai 240)
Block size = 256 − 240 = 16
Kelipatan 16 pada oktet 2: 0,16,32,48,64,80,96,112,...

IP oktet 2 = 100 → kelipatan terbesar ≤ 100 adalah 96

NETWORK   = 10.96.0.0
BROADCAST = 10.111.255.255   (112 − 1 = 111)
HOST      = 10.96.0.1 – 10.111.255.254
Jumlah    = 2^20 − 2 = 1.048.574
```

---

## 4. Tabel Referensi yang Wajib Hafal

### Nilai mask dan block size

| Prefix (oktet ke-4) | Mask | Block size | Subnet | Host |
|---|---|---|---|---|
| /24 | 255.255.255.**0** | 256 | 1 | 254 |
| /25 | 255.255.255.**128** | 128 | 2 | 126 |
| /26 | 255.255.255.**192** | 64 | 4 | 62 |
| /27 | 255.255.255.**224** | 32 | 8 | 30 |
| /28 | 255.255.255.**240** | 16 | 16 | 14 |
| /29 | 255.255.255.**248** | 8 | 32 | 6 |
| /30 | 255.255.255.**252** | 4 | 64 | 2 |
| /31 | 255.255.255.**254** | 2 | 128 | 2* |
| /32 | 255.255.255.**255** | 1 | 256 | 1 |

\* /31 khusus point-to-point (RFC 3021)

### Prefix pada oktet ke-3

| Prefix | Mask | Block size (oktet 3) | Host |
|---|---|---|---|
| /16 | 255.255.**0**.0 | 256 | 65.534 |
| /17 | 255.255.**128**.0 | 128 | 32.766 |
| /18 | 255.255.**192**.0 | 64 | 16.382 |
| /19 | 255.255.**224**.0 | 32 | 8.190 |
| /20 | 255.255.**240**.0 | 16 | 4.094 |
| /21 | 255.255.**248**.0 | 8 | 2.046 |
| /22 | 255.255.**252**.0 | 4 | 1.022 |
| /23 | 255.255.**254**.0 | 2 | 510 |

> [!TIP]
> **Pola yang mempercepat:** nilai mask hanya boleh salah satu dari **0, 128, 192, 224, 240, 248, 252, 254, 255**. Block size adalah `256 −` nilai itu: **256, 128, 64, 32, 16, 8, 4, 2, 1**.

### Menghafal jumlah host

```
/30 → 2      /26 → 62      /22 → 1.022
/29 → 6      /25 → 126     /21 → 2.046
/28 → 14     /24 → 254     /20 → 4.094
/27 → 30     /23 → 510     /19 → 8.190
```

Pola: setiap turun satu prefix, jumlah host **≈ dua kali lipat**. Mulai dari /30 = 2, lalu 6, 14, 30, 62, 126, 254, 510, 1022, ... (masing-masing = 2× sebelumnya + 2).

---

## 5. Menentukan Apakah Dua IP Satu Subnet

Ini pertanyaan yang muncul terus dalam troubleshooting.

**Metode:** AND kedua IP dengan mask; kalau hasilnya sama, mereka satu subnet.

### Contoh: `192.168.1.100/26` dan `192.168.1.130/26`

```
Cara cepat (block size):
Block size /26 = 64 → batas: 0, 64, 128, 192

IP 100 → berada di blok 64–127   (network 192.168.1.64)
IP 130 → berada di blok 128–191  (network 192.168.1.128)

BERBEDA SUBNET → butuh router untuk berkomunikasi
```

### Contoh: `10.1.1.50/22` dan `10.1.3.200/22`

```
Block size /22 pada oktet 3 = 4 → batas: 0, 4, 8, 12, ...

IP oktet 3 = 1 → blok 0–3   (network 10.1.0.0/22)
IP oktet 3 = 3 → blok 0–3   (network 10.1.0.0/22)

SAMA SUBNET → bisa berkomunikasi langsung tanpa router
```

> [!WARNING]
> **Kesalahan klasik:** mengira `10.1.1.x` dan `10.1.3.x` pasti berbeda subnet karena oktet ke-3 berbeda. Dengan mask /22, keduanya satu subnet.

### Kesalahan mask yang menipu

Skenario nyata yang sering terjadi:
```
PC-A: 192.168.1.10  mask 255.255.255.0   (/24)
PC-B: 192.168.1.20  mask 255.255.255.128 (/25)

PC-A berpikir: PC-B (192.168.1.20) ada di 192.168.1.0/24 → subnet saya ✅
PC-B berpikir: PC-A (192.168.1.10) ada di 192.168.1.0/25 → subnet saya ✅

Keduanya mengira satu subnet → berkomunikasi langsung. Terlihat bekerja!

Tapi:
PC-A: 192.168.1.200 mask /24
PC-B: 192.168.1.20  mask /25

PC-B berpikir: 192.168.1.200 ada di 192.168.1.128/25 → BUKAN subnet saya
             → kirim ke gateway
PC-A berpikir: 192.168.1.20 ada di subnet saya → kirim langsung

→ Komunikasi ASIMETRIS, gejala sangat membingungkan
```

> [!TIP]
> **Pelajaran:** ketika gejalanya "sebagian host bisa, sebagian tidak", **selalu periksa subnet mask di semua perangkat**, bukan hanya alamat IP-nya.

---

## 6. Menghitung Subnet ke-N

Soal ujian sering menanyakan "subnet ke-5 dari X".

### Contoh: subnet ke-5 dari `192.168.10.0/24` yang di-subnet menjadi /28

```
Block size = 256 − 240 = 16

Subnet 1 : 192.168.10.0   (host .1–.14,   broadcast .15)
Subnet 2 : 192.168.10.16  (host .17–.30,  broadcast .31)
Subnet 3 : 192.168.10.32  (host .33–.46,  broadcast .47)
Subnet 4 : 192.168.10.48  (host .49–.62,  broadcast .63)
Subnet 5 : 192.168.10.64  (host .65–.78,  broadcast .79)  ← JAWABAN
```

**Rumus cepat:** network subnet ke-N = `(N − 1) × block_size`
```
Subnet ke-5: (5 − 1) × 16 = 64 → 192.168.10.64
```

---

## 7. Menentukan Prefix dari Kebutuhan Host

Soal: "Saya butuh subnet untuk 45 host. Prefix apa?"

```
Cari 2ⁿ − 2 ≥ 45

2^5 − 2 = 30   ❌ kurang
2^6 − 2 = 62   ✅ cukup

Butuh 6 bit host → prefix = 32 − 6 = /26
```

**Tabel bantu:**
| Butuh host | Bit host | Prefix | Kapasitas |
|---|---|---|---|
| 1-2 | 2 | /30 | 2 |
| 3-6 | 3 | /29 | 6 |
| 7-14 | 4 | /28 | 14 |
| 15-30 | 5 | /27 | 30 |
| 31-62 | 6 | /26 | 62 |
| 63-126 | 7 | /25 | 126 |
| 127-254 | 8 | /24 | 254 |
| 255-510 | 9 | /23 | 510 |
| 511-1022 | 10 | /22 | 1022 |

> [!TIP]
> **Selalu sisakan ruang tumbuh.** Kalau butuh 60 host hari ini, /26 (62 host) sudah nyaris penuh. Pilih /25 (126 host) kecuali alamat benar-benar terbatas.

---

## 8. Latihan Terstruktur: 20 Soal

Kerjakan tanpa kalkulator. Target: **rata-rata 30 detik per soal.**

**Bagian A — Cari network, broadcast, dan host range:**
1. `192.168.4.77/26`
2. `10.10.10.200/27`
3. `172.16.8.45/28`
4. `192.168.1.130/25`
5. `10.0.5.99/29`
6. `172.20.100.10/22`
7. `192.168.200.35/30`
8. `10.50.60.70/19`

**Bagian B — Berapa host usable dan berapa subnet:**
9. `/26` dari `/24`
10. `/28` dari `/24`
11. `/22` dari `/16`
12. `/30` dari `/24`

**Bagian C — Apakah satu subnet:**
13. `192.168.1.50/26` dan `192.168.1.70/26`
14. `10.1.5.10/22` dan `10.1.7.200/22`
15. `172.16.20.5/20` dan `172.16.40.5/20`

**Bagian D — Terapan:**
16. Anda butuh subnet untuk 100 host. Prefix minimum apa?
17. Berapa subnet /27 yang bisa dibuat dari satu /24?
18. Subnet ke-3 dari `192.168.50.0/24` yang dipecah menjadi /27?
19. Sebuah host `10.20.30.40` dengan mask `255.255.255.192`. Apa gateway yang masuk akal jika konvensi organisasi memakai alamat pertama?
20. Anda melihat host dengan IP `192.168.1.63/26`. Apakah konfigurasi ini valid?

<details>
<summary>Jawaban Bagian A</summary>

1. `/26`, block 64. 77 → blok 64.
   **Network 192.168.4.64 · Broadcast 192.168.4.127 · Host .65–.126**

2. `/27`, block 32. 200 → kelipatan: 0,32,64,96,128,160,192,224. Terbesar ≤200 = 192.
   **Network 10.10.10.192 · Broadcast 10.10.10.223 · Host .193–.222**

3. `/28`, block 16. 45 → kelipatan: 0,16,32,48. Terbesar ≤45 = 32.
   **Network 172.16.8.32 · Broadcast 172.16.8.47 · Host .33–.46**

4. `/25`, block 128. 130 → blok 128.
   **Network 192.168.1.128 · Broadcast 192.168.1.255 · Host .129–.254**

5. `/29`, block 8. 99 → kelipatan 8: ...96, 104. Terbesar ≤99 = 96.
   **Network 10.0.5.96 · Broadcast 10.0.5.103 · Host .97–.102**

6. `/22`, block 4 pada oktet 3. Oktet 3 = 100 → kelipatan 4: 100 tepat kelipatan.
   **Network 172.20.100.0 · Broadcast 172.20.103.255 · Host 172.20.100.1-172.20.103.254**

7. `/30`, block 4. 35 → kelipatan 4: 32.
   **Network 192.168.200.32 · Broadcast 192.168.200.35 · Host .33–.34**
   **Perhatian:** Perhatikan: `.35` justru adalah broadcast, bukan alamat host!

8. `/19`, block 32 pada oktet 3. Oktet 3 = 60 → kelipatan 32: 0, 32, 64. Terbesar ≤60 = 32.
   **Network 10.50.32.0 · Broadcast 10.50.63.255 · Host 10.50.32.1-10.50.63.254**

</details>

<details>
<summary>Jawaban Bagian B</summary>

9. `/26` dari `/24`: pinjam 2 bit → **4 subnet**, masing-masing **62 host**.
10. `/28` dari `/24`: pinjam 4 bit → **16 subnet**, masing-masing **14 host**.
11. `/22` dari `/16`: pinjam 6 bit → **64 subnet**, masing-masing **1022 host**.
12. `/30` dari `/24`: pinjam 6 bit → **64 subnet**, masing-masing **2 host**.

</details>

<details>
<summary>Jawaban Bagian C</summary>

13. Block 64: 50 → blok 0-63; 70 → blok 64-127. **BERBEDA subnet.**
14. Block 4 pada oktet 3: oktet 5 → blok 4-7; oktet 7 → blok 4-7. **SAMA subnet** (10.1.4.0/22).
15. Block 16 pada oktet 3: oktet 20 → blok 16-31; oktet 40 → blok 32-47. **BERBEDA subnet.**

</details>

<details>
<summary>Jawaban Bagian D</summary>

16. 2⁷ − 2 = 126 ≥ 100 → butuh 7 bit host → **/25**.
17. 256 ÷ 32 = **8 subnet**.
18. Block 32. Subnet ke-3 = (3−1) × 32 = 64 → **192.168.50.64/27** (host .65–.94, broadcast .95).
19. Mask `/26`, block 64. Oktet 4 = 40 → blok 0-63 → network `10.20.30.0`. Alamat pertama yang usable = **10.20.30.1**.
20. **TIDAK VALID.** `/26` dengan block 64: 63 adalah **broadcast address** dari subnet `192.168.1.0/26`, sehingga tidak bisa diberikan ke host. Gejalanya: host tidak bisa berkomunikasi sama sekali, atau perilaku aneh (beberapa OS menolak konfigurasi ini secara langsung).

</details>

---

## 9. Verifikasi dengan Alat

Selalu latih manual dulu, lalu verifikasi.

```bash
# Python (paling nyaman)
$ python3 -c "
import ipaddress
n = ipaddress.ip_network('192.168.4.77/26', strict=False)
print('Network  :', n.network_address)
print('Broadcast:', n.broadcast_address)
print('Mask     :', n.netmask)
print('Host     :', list(n.hosts())[0], '-', list(n.hosts())[-1])
print('Jumlah   :', n.num_addresses - 2)
"
Network  : 192.168.4.64
Broadcast: 192.168.4.127
Mask     : 255.255.255.192
Host     : 192.168.4.65 - 192.168.4.126
Jumlah   : 62

# ipcalc (install: apt/dnf install ipcalc)
$ ipcalc 192.168.4.77/26

# sipcalc
$ sipcalc 192.168.4.77/26

# Daftar semua subnet /26 dari /24
$ python3 -c "
import ipaddress
for s in ipaddress.ip_network('192.168.1.0/24').subnets(new_prefix=26):
    print(s, '→ host', list(s.hosts())[0], '-', list(s.hosts())[-1])
"
```

---

## 10. Kesalahan Umum

> [!WARNING]
> **1. Lupa mengurangi 2** untuk network dan broadcast address.

> [!WARNING]
> **2. Salah menghitung block size.** Block size = **256 − nilai oktet mask**, bukan nilai mask itu sendiri.

> [!WARNING]
> **3. Salah memilih oktet yang menentukan.** Untuk /20, yang menentukan adalah oktet ke-3, bukan ke-4.

> [!WARNING]
> **4. Memberikan broadcast address ke host.** Periksa: apakah oktet terakhir adalah `network + block_size − 1`?

> [!WARNING]
> **5. Mask tidak konsisten antar-host.** Menyebabkan komunikasi asimetris yang sangat sulit didiagnosis.

> [!WARNING]
> **6. Membuat subnet terlalu pas.** Butuh 60 host lalu memakai /26 (62 host) berarti hanya ada ruang untuk 2 perangkat tambahan.

> [!WARNING]
> **7. Mengira dua IP berbeda oktet ke-3 pasti beda subnet.** Bergantung mask.

---

## 11. Ringkasan

- Subnetting = meminjam bit host untuk membuat lebih banyak jaringan.
- `Jumlah subnet = 2^bit_dipinjam`, `host usable = 2^bit_host − 2`.
- **Metode magic number:** cari oktet menentukan → `block size = 256 − nilai mask` → kelipatan block size adalah batas subnet.
- Network = kelipatan terbesar yang ≤ nilai oktet IP. Broadcast = network berikutnya − 1.
- Nilai mask hanya: **0, 128, 192, 224, 240, 248, 252, 254, 255**. Block size: **256, 128, 64, 32, 16, 8, 4, 2, 1**.
- Hafalkan host per prefix: /30=2, /29=6, /28=14, /27=30, /26=62, /25=126, /24=254, /23=510, /22=1022.
- Untuk memeriksa apakah dua IP satu subnet: bandingkan blok mereka dengan block size yang sama.
- **Mask yang tidak konsisten** menyebabkan komunikasi asimetris — selalu periksa mask, bukan hanya IP.
- Sisakan ruang tumbuh saat memilih prefix.

---

## 12. Sumber

- RFC 950 — Internet Standard Subnetting Procedure
- RFC 1878 — Variable Length Subnet Table For IPv4
- RFC 4632 — CIDR: The Internet Address Assignment and Aggregation Plan
- Cisco CCNA 200-301 v1.1, topik 1.6
- `referensi/tabel-subnetting.md` di repositori ini — tabel lengkap /1–/32

---

**Berikutnya:** `04-network-layer/03-vlsm-cidr.md`. Subnetting dengan ukuran berbeda-beda dan meringkas rute.

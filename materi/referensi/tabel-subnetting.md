# Tabel Subnetting & Referensi Cepat

> Rujukan untuk subnetting cepat, karena soal CCNA berwaktu. Latih sampai otomatis. Lihat `04-network-layer/02-03`.

---

## 1. Kekuatan 2 (hafalkan!)

```
2^0=1   2^1=2   2^2=4    2^3=8    2^4=16   2^5=32
2^6=64  2^7=128 2^8=256  2^9=512  2^10=1024
```

## 2. Nilai Bit dalam Satu Oktet

```
Posisi bit:   128  64  32  16   8   4   2   1
              2^7 2^6 2^5 2^4 2^3 2^2 2^1 2^0
```

## 3. Tabel Subnet Mask (IPv4)

| CIDR | Subnet Mask | Wildcard | Jml Alamat | Host Usable | Blok (increment) |
|---|---|---|---|---|---|
| /24 | 255.255.255.0 | 0.0.0.255 | 256 | 254 | 256 (oktet-4) |
| /25 | 255.255.255.128 | 0.0.0.127 | 128 | 126 | 128 |
| /26 | 255.255.255.192 | 0.0.0.63 | 64 | 62 | 64 |
| /27 | 255.255.255.224 | 0.0.0.31 | 32 | 30 | 32 |
| /28 | 255.255.255.240 | 0.0.0.15 | 16 | 14 | 16 |
| /29 | 255.255.255.248 | 0.0.0.7 | 8 | 6 | 8 |
| /30 | 255.255.255.252 | 0.0.0.3 | 4 | 2 | 4 |
| /31 | 255.255.255.254 | 0.0.0.1 | 2 | 2* | 2 (P2P, RFC 3021) |
| /32 | 255.255.255.255 | 0.0.0.0 | 1 | 1 | host tunggal |

*Host usable = Jml Alamat − 2 (network + broadcast), **kecuali /31** (P2P, 2 usable) & /32 (host).

## 4. Mask di Oktet Ketiga (subnet lebih besar dari /24)

| CIDR | Subnet Mask | Jml /24 di dalamnya | Host Usable | Blok (oktet-3) |
|---|---|---|---|---|
| /23 | 255.255.254.0 | 2 | 510 | 2 |
| /22 | 255.255.252.0 | 4 | 1022 | 4 |
| /21 | 255.255.248.0 | 8 | 2046 | 8 |
| /20 | 255.255.240.0 | 16 | 4094 | 16 |
| /19 | 255.255.224.0 | 32 | 8190 | 32 |
| /18 | 255.255.192.0 | 64 | 16382 | 64 |
| /17 | 255.255.128.0 | 128 | 32766 | 128 |
| /16 | 255.255.0.0 | 256 | 65534 | 256 |

## 5. Nilai Mask Tunggal → CIDR

```
128 = /X+1 (1 bit)     224 = +3      252 = +6
192 = +2               240 = +4      254 = +7
                       248 = +5      255 = +8 (oktet penuh)
```

---

## 6. Metode Cepat Subnetting

### Menentukan subnet sebuah IP (contoh: 172.16.20.55/26)
```
1. Blok = 256 − 192 (nilai mask oktet ke-4 dari /26) = 64
2. Kelipatan blok di oktet-4: 0, 64, 128, 192
3. 55 jatuh antara 0-63 → NETWORK = 172.16.20.0
4. Broadcast = network + blok − 1 = 172.16.20.63
5. Host usable = 172.16.20.1 s/d 172.16.20.62
```

### Menentukan jumlah subnet & host
```
Bit dipinjam (s) → 2^s subnet
Bit host tersisa (h) → 2^h − 2 host usable per subnet
Contoh /26 dari /24: pinjam 2 bit → 4 subnet, sisa 6 bit → 62 host
```

> [!TIP]
> **Kunci kecepatan:** hafalkan **blok/increment** (256 − nilai mask). Blok memberi tahu di mana batas tiap subnet. Untuk IP di oktet mana pun, cari kelipatan blok terdekat di bawah nilai oktet tersebut = alamat network.

---

## 7. VLSM (Alokasi Efisien (contoh))

Diberi `192.168.1.0/24`, alokasikan: LAN-A 100 host, LAN-B 50 host, LAN-C 25 host, link P2P 2 host. **Urutkan dari terbesar:**

```
LAN-A (100 host) → butuh /25 (126 host) → 192.168.1.0/25   (.0-.127)
LAN-B (50 host)  → butuh /26 (62 host)  → 192.168.1.128/26 (.128-.191)
LAN-C (25 host)  → butuh /27 (30 host)  → 192.168.1.192/27 (.192-.223)
P2P (2 host)     → butuh /30 (2 host)   → 192.168.1.224/30 (.224-.227)
```
> [!WARNING]
> **Selalu alokasikan dari kebutuhan TERBESAR ke terkecil** untuk menghindari fragmentasi. Pilih prefix terkecil yang cukup menampung host (bulatkan ke atas ke kekuatan 2).

---

## 8. Alamat Khusus IPv4

```
Private (RFC 1918):  10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
Loopback:            127.0.0.0/8 (127.0.0.1)
APIPA/link-local:    169.254.0.0/16 (saat DHCP gagal)
Multicast:           224.0.0.0/4
Broadcast terbatas:  255.255.255.255
"This host":         0.0.0.0
Dokumentasi:         192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24
CGNAT:               100.64.0.0/10
```

## 9. IPv6 Ringkas

```
Panjang:      128 bit (8 grup × 16 bit, hex, dipisah ":")
Prefix umum:  /64 (subnet standar), /48 (situs), /56 (pelanggan)
Kompresi:     hilangkan leading zero; "::" ganti blok nol berturut (sekali saja)
  2001:0db8:0000:0000:0000:0000:0000:0001 → 2001:db8::1
Tipe:
  Global unicast:  2000::/3 (2xxx, 3xxx) — publik
  Unique local:    fc00::/7 (fd..) — privat (≈RFC1918)
  Link-local:      fe80::/10 — wajib, per-link
  Multicast:       ff00::/8   (tidak ada broadcast di IPv6!)
  Loopback:        ::1
  Unspecified:     ::
EUI-64: MAC → interface ID (sisipkan fffe di tengah, flip bit U/L ke-7)
```

---

## 10. Tabel Konversi Biner-Desimal-Hex (Cepat)

| Dec | Bin (8-bit) | Hex | | Dec | Bin | Hex |
|---|---|---|---|---|---|---|
| 0 | 00000000 | 00 | | 128 | 10000000 | 80 |
| 1 | 00000001 | 01 | | 192 | 11000000 | C0 |
| 2 | 00000010 | 02 | | 224 | 11100000 | E0 |
| 4 | 00000100 | 04 | | 240 | 11110000 | F0 |
| 8 | 00001000 | 08 | | 248 | 11111000 | F8 |
| 15 | 00001111 | 0F | | 252 | 11111100 | FC |
| 16 | 00010000 | 10 | | 254 | 11111110 | FE |
| 10 | 00001010 | 0A | | 255 | 11111111 | FF |

> [!TIP]
> **Nibble (4 bit) = 1 digit hex.** Pecah oktet menjadi dua nibble untuk konversi hex cepat: `192 = 1100 0000 = C0`.

---

**Lihat juga:** `04-network-layer/01-03` (biner, subnetting, VLSM/CIDR), `08-ipv6/01`

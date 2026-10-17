# 07.1 Static Routing

> **Prasyarat:** `04-network-layer/05`
> **Tujuan:** Anda bisa mengonfigurasi semua varian static route, memahami recursive lookup, dan membangun failover otomatis dengan floating static + IP SLA.

---

## 1. Kapan Static Route Adalah Pilihan yang Tepat

Static routing sering dianggap "primitif", padahal dalam banyak situasi justru **pilihan yang benar**.

| Situasi | Kenapa static lebih baik |
|---|---|
| **Stub network** (hanya satu jalan keluar) | Tidak ada keputusan yang perlu dibuat — protokol dinamis hanya menambah overhead |
| **Default route ke ISP** | Tujuan selalu sama |
| Jaringan sangat kecil (< 5 router) | Kompleksitas protokol dinamis tidak sepadan |
| **Kontrol eksplisit** | Anda ingin jalur tertentu, bukan yang dipilih algoritma |
| Perangkat dengan CPU/memori terbatas | Protokol dinamis memakan sumber daya |
| **Keamanan** | Tidak ada pertukaran informasi routing yang bisa disadap/dipalsukan |
| Backup route | Floating static |

**Kapan static menjadi buruk:**
- Jaringan besar → jumlah entri tumbuh eksponensial
- Topologi sering berubah → pemeliharaan manual melelahkan
- Butuh failover otomatis tanpa konfigurasi tambahan
- Banyak jalur alternatif

> [!TIP]
> **Aturan praktis:** kalau Anda menulis lebih dari ~10 static route per router, atau kalau topologi berubah lebih dari sekali sebulan, pertimbangkan protokol dinamis.

---

## 2. Sintaks Dasar

```
ip route <jaringan-tujuan> <subnet-mask> {<next-hop-ip> | <exit-interface>} [AD] [name <keterangan>]
```

### Varian

```
# 1. Next hop saja — butuh recursive lookup
R1(config)# ip route 192.168.10.0 255.255.255.0 10.0.0.2

# 2. Exit interface saja — untuk link point-to-point
R1(config)# ip route 192.168.10.0 255.255.255.0 serial0/0/0

# 3. Keduanya — DIREKOMENDASIKAN untuk Ethernet
R1(config)# ip route 192.168.10.0 255.255.255.0 gi0/1 10.0.0.2

# 4. Dengan AD khusus (floating static)
R1(config)# ip route 192.168.10.0 255.255.255.0 10.0.0.9 130

# 5. Dengan nama (dokumentasi di konfigurasi)
R1(config)# ip route 192.168.10.0 255.255.255.0 10.0.0.2 name KE-CABANG-BANDUNG

# 6. Default route
R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1

# 7. Host route (/32)
R1(config)# ip route 192.168.10.50 255.255.255.255 10.0.0.2

# 8. Summary route
R1(config)# ip route 192.168.0.0 255.255.252.0 10.0.0.2

# 9. Null route (blackhole)
R1(config)# ip route 192.168.99.0 255.255.255.0 null0

# 10. Permanent (tetap di tabel walau interface down — hati-hati!)
R1(config)# ip route 192.168.10.0 255.255.255.0 10.0.0.2 permanent
```

> [!WARNING]
> **`permanent` berbahaya.** Rute tetap ada walaupun jalurnya jelas mati, sehingga paket dibuang diam-diam alih-alih beralih ke rute cadangan. Hanya pakai bila Anda benar-benar memahami konsekuensinya.

---

## 3. Recursive Lookup: Konsep yang Harus Dipahami

Ketika static route hanya menyebut **next hop**, router harus mencari **dua kali**.

```
R1(config)# ip route 192.168.10.0 255.255.255.0 10.0.0.2

Paket ke 192.168.10.5:
  Lookup 1: "192.168.10.0/24 → next hop 10.0.0.2"
  Lookup 2: "Bagaimana mencapai 10.0.0.2?"
            → C 10.0.0.0/30 is directly connected, Gi0/1
  Hasil    : kirim lewat Gi0/1 ke MAC dari 10.0.0.2
```

> [!WARNING]
> **Kalau lookup kedua gagal, seluruh rute menjadi tidak dapat dipakai dan TIDAK MUNCUL di routing table.**

Ini penyebab paling umum "static route sudah dikonfigurasi tetapi tidak muncul di `show ip route`":
```
R1(config)# ip route 192.168.10.0 255.255.255.0 172.16.99.1
   → Router tidak punya rute ke 172.16.99.1
   → Rute ini diam-diam tidak dipasang

R1# show ip route static
   (kosong)
R1# show running-config | include ip route
   ip route 192.168.10.0 255.255.255.0 172.16.99.1    ← ada di config, tidak di tabel
```

### Recursive berlapis

```
ip route 192.168.10.0 255.255.255.0 10.0.0.2
ip route 10.0.0.0 255.255.255.252 172.16.1.1
   → lookup berlapis dua

Router IOS membatasi kedalaman rekursi (biasanya 3–5 tingkat)
```

> [!TIP]
> **Cara memastikan rute benar-benar dipakai:**
```
R1# show ip route 192.168.10.5
Routing entry for 192.168.10.0/24
  Known via "static", distance 1, metric 0
  Routing Descriptor Blocks:
  * 10.0.0.2, via GigabitEthernet0/1     ← resolved!
```

---

## 4. Exit Interface pada Link Multi-Access: Jangan Lakukan

```
R1(config)# ip route 192.168.10.0 255.255.255.0 gi0/1
```

Pada link **point-to-point** (serial, PPP, tunnel), ini baik — hanya ada satu tetangga.

Pada link **Ethernet**, ini bermasalah:

```
Router memperlakukan SELURUH 192.168.10.0/24 sebagai "directly connected"
di Gi0/1.

Paket ke 192.168.10.5   → ARP untuk 192.168.10.5
Paket ke 192.168.10.6   → ARP untuk 192.168.10.6
Paket ke 192.168.10.7   → ARP untuk 192.168.10.7
...
→ 254 entri ARP untuk satu subnet remote
→ ARP request membanjiri jaringan
→ ARP table membengkak
→ Bergantung pada Proxy ARP di router tetangga (yang mungkin dimatikan)
```

**Solusi: sebutkan keduanya.**
```
R1(config)# ip route 192.168.10.0 255.255.255.0 gi0/1 10.0.0.2
   → tidak ada recursive lookup (interface sudah jelas)
   → satu ARP saja untuk 10.0.0.2
```

---

## 5. Default Route

```
R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1
```

`0.0.0.0/0` cocok dengan **semua** alamat, tetapi karena prefix-nya paling pendek (0 bit), ia hanya dipakai jika **tidak ada rute lain yang cocok** (longest prefix match).

Disebut juga **gateway of last resort**:
```
R1# show ip route
Gateway of last resort is 203.0.113.1 to network 0.0.0.0
S*   0.0.0.0/0 [1/0] via 203.0.113.1
     ^ tanda * = candidate default
```

### Mengiklankan default route ke protokol dinamis

```
# OSPF
R1(config-router)# default-information originate
R1(config-router)# default-information originate always   ← walau rute default lokal tidak ada

# EIGRP
R1(config-router)# redistribute static

# RIP
R1(config-router)# default-information originate

# BGP
R1(config-router-af)# neighbor 10.0.0.2 default-originate
```

> [!WARNING]
> **`always` berbahaya** — router akan mengiklankan default route walaupun ia sendiri tidak punya jalan keluar, menciptakan black hole.

---

## 6. Floating Static Route: Failover Otomatis

Static route dengan **AD lebih tinggi** hanya dipasang jika rute utama hilang.

```
# Jalur utama: lewat MPLS (dipelajari OSPF, AD 110)
# Jalur cadangan: lewat internet VPN (static, AD 130)

R1(config)# ip route 192.168.10.0 255.255.255.0 10.0.0.9 130
```

Hasilnya:
```
Selama OSPF punya rute (AD 110):
  R1# show ip route 192.168.10.0
  O    192.168.10.0/24 [110/20] via 10.0.0.2      ← OSPF menang

Ketika OSPF kehilangan rute:
  R1# show ip route 192.168.10.0
  S    192.168.10.0/24 [130/0] via 10.0.0.9       ← floating static masuk
```

### Contoh: Dual ISP

```
# ISP utama (AD 1 default)
R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1

# ISP cadangan (AD 10)
R1(config)# ip route 0.0.0.0 0.0.0.0 198.51.100.1 10
```

> [!WARNING]
> **Masalah besar:** static route hanya hilang kalau **interface fisik down**. Kalau interface tetap up tetapi ISP di seberang bermasalah (kabel putus lebih jauh, router ISP mati, BGP ISP bermasalah), rute utama **tetap terpasang** dan trafik dibuang ke lubang hitam.

Solusinya: **IP SLA tracking**.

---

## 7. IP SLA + Object Tracking: Failover yang Benar

Router secara aktif menguji konektivitas dan menghapus rute jika pengujian gagal.

### Konfigurasi lengkap

```
# 1. Buat operasi IP SLA: ping ke alamat di luar ISP
R1(config)# ip sla 1
R1(config-ip-sla)# icmp-echo 8.8.8.8 source-interface gi0/0
R1(config-ip-sla-echo)# frequency 5          ← ping setiap 5 detik
R1(config-ip-sla-echo)# timeout 1000         ← timeout 1 detik
R1(config-ip-sla-echo)# threshold 500
R1(config-ip-sla-echo)# exit

# 2. Jadwalkan agar berjalan terus-menerus
R1(config)# ip sla schedule 1 life forever start-time now

# 3. Buat track object yang memantau SLA itu
R1(config)# track 1 ip sla 1 reachability
R1(config-track)# delay down 10 up 30
   ← tunggu 10 detik sebelum menyatakan down (hindari flapping)
   ← tunggu 30 detik sebelum menyatakan up kembali

# 4. Ikat static route ke track object
R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1 track 1
R1(config)# ip route 0.0.0.0 0.0.0.0 198.51.100.1 10
```

Sekarang: jika ping ke 8.8.8.8 lewat ISP utama gagal, rute utama **dihapus dari routing table**, dan rute cadangan (AD 10) otomatis masuk.

### Verifikasi

```
R1# show ip sla statistics
IPSLA operation id: 1
	Latest RTT: 12 milliseconds
	Latest operation start time: 14:22:01 WIB Thu Sep 10 2026
	Latest operation return code: OK
	Number of successes: 1247
	Number of failures: 0

R1# show track
Track 1
  IP SLA 1 reachability
  Reachability is Up
    1 change, last change 02:15:33
  Delay up 30 secs, down 10 secs
  Tracked by:
    STATIC-IP-ROUTING 0

R1# show ip route static
R1# show ip sla configuration 1
```

### Pilihan target IP SLA

> [!WARNING]
> **Jangan ping alamat gateway ISP.** Kalau ISP punya masalah di hulu, gateway lokalnya tetap menjawab — pengujian lolos padahal internet mati.

```
❌ icmp-echo 203.0.113.1              ← gateway ISP; terlalu dekat
✅ icmp-echo 8.8.8.8                  ← di luar ISP
✅ icmp-echo 1.1.1.1
```

> [!TIP]
> **Lebih baik lagi: gunakan dua target berbeda** dan `track list` boolean, sehingga satu target yang kebetulan mati tidak memicu failover palsu:
```
R1(config)# ip sla 1
R1(config-ip-sla)# icmp-echo 8.8.8.8 source-interface gi0/0
R1(config)# ip sla 2
R1(config-ip-sla)# icmp-echo 1.1.1.1 source-interface gi0/0
R1(config)# ip sla schedule 1 life forever start-time now
R1(config)# ip sla schedule 2 life forever start-time now
R1(config)# track 1 ip sla 1 reachability
R1(config)# track 2 ip sla 2 reachability
R1(config)# track 10 list boolean or
R1(config-track)# object 1
R1(config-track)# object 2
R1(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1 track 10
```
Rute utama hanya dihapus kalau **kedua** target tidak terjangkau.

> [!WARNING]
> Pastikan rute ke alamat SLA melewati ISP yang sedang diuji. Kalau tidak, tambahkan host route:
```
R1(config)# ip route 8.8.8.8 255.255.255.255 203.0.113.1
```

### Jenis operasi IP SLA lain

```
icmp-echo         → ping
tcp-connect       → uji apakah port TCP terbuka
udp-jitter        → ukur jitter (untuk VoIP)
http              → uji halaman web
dns               → uji resolusi DNS
path-echo         → traceroute berulang
```

---

## 8. IPv6 Static Route

Sintaksnya paralel dengan IPv4.

```
R1(config)# ipv6 unicast-routing              ← WAJIB diaktifkan dulu!

R1(config)# ipv6 route 2001:db8:10::/64 2001:db8:1::2
R1(config)# ipv6 route 2001:db8:10::/64 gi0/1 2001:db8:1::2
R1(config)# ipv6 route ::/0 2001:db8:1::1     ← default route
R1(config)# ipv6 route 2001:db8:10::/64 gi0/1 fe80::2   ← lewat link-local

R1# show ipv6 route
R1# show ipv6 route static
```

> [!WARNING]
> **`ipv6 unicast-routing` sering terlupa.** Tanpa itu, router tidak akan meneruskan paket IPv6 sama sekali, walaupun alamat dan rute sudah dikonfigurasi.

> [!TIP]
> **Memakai link-local sebagai next hop** memerlukan penyebutan exit interface, karena alamat link-local tidak unik secara global:
```
✅ ipv6 route 2001:db8:10::/64 gi0/1 fe80::2
❌ ipv6 route 2001:db8:10::/64 fe80::2         ← ambigu, ditolak
```

---

## 9. Static Route di Linux

```bash
# Tambah rute
$ sudo ip route add 192.168.10.0/24 via 10.0.0.2
$ sudo ip route add 192.168.10.0/24 via 10.0.0.2 dev eth1
$ sudo ip route add default via 203.0.113.1
$ sudo ip route add 192.168.10.50/32 via 10.0.0.2

# Metric (setara AD; lebih kecil lebih disukai)
$ sudo ip route add default via 203.0.113.1 metric 100
$ sudo ip route add default via 198.51.100.1 metric 200   ← cadangan

# Blackhole
$ sudo ip route add blackhole 192.168.99.0/24

# Hapus
$ sudo ip route del 192.168.10.0/24

# Verifikasi rute mana yang dipakai
$ ip route get 192.168.10.5

# Permanen dengan NetworkManager
$ sudo nmcli con mod eth1 +ipv4.routes "192.168.10.0/24 10.0.0.2"
$ sudo nmcli con up eth1

# Permanen dengan systemd-networkd
# /etc/systemd/network/10-eth1.network
[Route]
Destination=192.168.10.0/24
Gateway=10.0.0.2
```

---

## 10. Troubleshooting Static Route

### Alur diagnosis

```
1. Apakah rute muncul di routing table?
   R1# show ip route static
   R1# show ip route 192.168.10.0

   Tidak muncul?
   → Recursive lookup gagal (next hop tidak terjangkau)
   → Interface keluar down
   → Ada rute dengan AD lebih rendah untuk prefix yang sama
   → Track object dalam keadaan down
   → Salah ketik pada alamat/mask

2. Rute ada tetapi paket tidak sampai?
   → Cek RUTE BALIK di router tujuan! (kesalahan paling umum)
   → Cek ACL di sepanjang jalur
   → Cek NAT
   → traceroute untuk melihat di mana berhenti

3. Rute ada tetapi trafik lewat jalur yang salah?
   → Ada rute lebih spesifik (longest prefix match)
   → AD dari protokol lain lebih rendah
   → show ip cef exact-route <src> <dst>
```

> [!WARNING]
> **"Lupa rute balik" adalah kesalahan static routing nomor satu.** Ping dari R1 ke jaringan di belakang R2 memerlukan R2 tahu cara kembali ke jaringan di belakang R1.

### Perintah diagnostik

```
R1# show ip route
R1# show ip route static
R1# show ip route 192.168.10.5           ← rute mana yang dipakai
R1# show ip cef 192.168.10.5
R1# show ip cef exact-route 10.1.1.10 192.168.10.5
R1# show running-config | include ip route
R1# ping 192.168.10.5 source gi0/0
R1# traceroute 192.168.10.5 source gi0/0
R1# show ip sla statistics
R1# show track
R1# debug ip routing              ← lihat perubahan tabel secara langsung
```

---

## MikroTik RouterOS

```
# Static route dasar
/ip route add dst-address=192.168.10.0/24 gateway=10.0.0.2 comment="Ke cabang"
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.9

# Dengan interface eksplisit (untuk link P2P/tunnel)
/ip route add dst-address=192.168.10.0/24 gateway=wg-tunnel

# Distance (= administrative distance)
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.9 distance=1  comment="ISP-A"
/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.9 distance=10 comment="ISP-B"

# Blackhole
/ip route add dst-address=192.168.99.0/24 type=blackhole

# Nonaktifkan sementara tanpa menghapus
/ip route disable [find comment="ISP-A"]
/ip route enable  [find comment="ISP-A"]

# Verifikasi
/ip route print where static
/ip route check 192.168.10.5
```

### Failover: tiga tingkat kecanggihan

**Tingkat 1 — `check-gateway` (paling sederhana):**
```
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.9 distance=1 check-gateway=ping
/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.9 distance=10
```
> [!WARNING]
> Hanya menguji gateway langsung — tidak mendeteksi kegagalan di hulu ISP.

**Tingkat 2 — Recursive route (menguji end-to-end):**
```
# Paksa probe melewati ISP-A
/ip route add dst-address=8.8.8.8/32 gateway=203.0.113.9 scope=10
# Default route bergantung pada terjangkaunya probe
/ip route add dst-address=0.0.0.0/0 gateway=8.8.8.8 target-scope=11 \
    distance=1 check-gateway=ping comment="ISP-A"
/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.9 distance=10 comment="ISP-B"
```
Ini setara **IP SLA + floating static** di Cisco.

**Tingkat 3 — Netwatch dengan skrip (paling fleksibel):**
```
/tool netwatch add host=8.8.8.8 interval=10s timeout=1s \
  up-script={
    :if ([/ip route get [find comment="ISP-A"] disabled] = true) do={
      /ip route enable [find comment="ISP-A"]
      /log warning "ISP-A pulih, kembali ke jalur utama"
      /tool e-mail send to="noc@perusahaan.com" subject="ISP-A UP" body="Failback"
    }
  } \
  down-script={
    /ip route disable [find comment="ISP-A"]
    /log error "ISP-A DOWN, beralih ke ISP-B"
    /tool e-mail send to="noc@perusahaan.com" subject="ISP-A DOWN" body="Failover"
  }
```

> [!TIP]
> **Netwatch memungkinkan aksi apa pun** — mengaktifkan/menonaktifkan rute, mengganti NAT, mengirim email/Telegram, menjalankan skrip. Ini gabungan **IP SLA + EEM** Cisco dalam satu fitur yang jauh lebih mudah.

> [!WARNING]
> **Jangan lupa NAT saat failover.** Kalau memakai `masquerade` dengan `out-interface`, ia otomatis mengikuti rute aktif. Kalau memakai `src-nat` dengan alamat tetap, Anda harus membuat aturan terpisah per ISP:
```
/ip firewall nat add chain=srcnat out-interface=ether1-ISP-A action=masquerade
/ip firewall nat add chain=srcnat out-interface=ether2-ISP-B action=masquerade
```

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `ip route X Y Z` | `/ip route add dst-address=X/prefix gateway=Z` |
| Floating static (AD tinggi) | `distance=10` |
| `ip route ... track 1` | `check-gateway=ping` atau Netwatch |
| IP SLA `icmp-echo` | `/tool netwatch` atau recursive route |
| `ip route ... null0` | `type=blackhole` |
| `ip route ... name X` | `comment="X"` |
| `show ip route static` | `/ip route print where static` |

---

## 11. Ringkasan

- Static route tepat untuk: stub network, default ke ISP, jaringan kecil, kontrol eksplisit, dan backup.
- Sintaks: `ip route <net> <mask> {next-hop | interface} [AD] [name X] [track N]`.
- **Recursive lookup**: kalau next hop tidak dapat diselesaikan, rute **tidak dipasang** — penyebab utama "static route tidak muncul".
- Pada Ethernet, **sebutkan interface + next hop**; exit interface saja menyebabkan ARP berlebihan.
- Default route `0.0.0.0/0` = gateway of last resort; dipakai terakhir karena prefix terpendek.
- **Floating static** (AD lebih tinggi) memberi failover otomatis — tetapi hanya bereaksi pada interface down.
- **IP SLA + track** membuat failover bereaksi pada kegagalan end-to-end. Pilih target **di luar** ISP, dan gunakan `delay down/up` untuk mencegah flapping.
- IPv6 butuh **`ipv6 unicast-routing`**; next hop link-local wajib disertai exit interface.
- **Selalu periksa rute balik** — kesalahan static routing paling umum.

---

## 12. Latihan

1. Anda mengonfigurasi `ip route 10.5.0.0 255.255.0.0 172.16.99.1` tetapi rute tidak muncul di `show ip route`. Sebutkan tiga kemungkinan penyebab.
2. Kenapa memakai exit interface saja pada static route di link Ethernet bermasalah?
3. Rancang failover dual-ISP lengkap: ISP-A utama (203.0.113.1), ISP-B cadangan (198.51.100.1), dengan deteksi kegagalan end-to-end.
4. Apa risiko `default-information originate always` di OSPF?
5. Ping dari R1 ke 192.168.20.5 gagal. `show ip route` di R1 menunjukkan rute ke 192.168.20.0/24 ada dan resolved. Apa yang Anda periksa berikutnya?
6. Kenapa target IP SLA sebaiknya bukan alamat gateway ISP?
7. Jelaskan perbedaan perilaku `ip route ... permanent` dan `ip route ... track 1`.

<details>
<summary>Jawaban</summary>

1. (a) **Recursive lookup gagal** — router tidak punya rute apa pun ke `172.16.99.1`, sehingga next hop tidak dapat diselesaikan; (b) **interface menuju next hop down** — kalau interface yang menghubungkan ke 172.16.99.1 dalam keadaan down, rute connected-nya hilang sehingga rekursi gagal; (c) ada **rute lain dengan AD lebih rendah** untuk prefix `10.5.0.0/16` (mis. dari OSPF) yang memenangkan seleksi; (d) rute diikat ke **track object yang down**; (e) salah ketik pada alamat atau mask; (f) rute berada di **VRF berbeda** dari yang Anda periksa.

2. Router memperlakukan **seluruh subnet tujuan** sebagai "terhubung langsung" di interface itu. Pada link Ethernet yang multi-access, ini berarti router akan mengirim **ARP request untuk setiap alamat tujuan yang berbeda** — bukan satu ARP untuk next hop. Akibatnya: banjir ARP, ARP table membengkak, CPU meningkat, dan ketergantungan pada Proxy ARP di router tetangga (yang sering dimatikan, sehingga rute gagal total). Pada link point-to-point hal ini tidak terjadi karena hanya ada satu tetangga.

3. ```
   ! Pastikan probe melewati ISP yang diuji
   ip route 8.8.8.8 255.255.255.255 203.0.113.1
   ip route 1.1.1.1 255.255.255.255 203.0.113.1

   ! Dua probe untuk menghindari false positive
   ip sla 1
    icmp-echo 8.8.8.8 source-interface gi0/0
    frequency 5
    timeout 1000
   ip sla 2
    icmp-echo 1.1.1.1 source-interface gi0/0
    frequency 5
    timeout 1000
   ip sla schedule 1 life forever start-time now
   ip sla schedule 2 life forever start-time now

   track 1 ip sla 1 reachability
    delay down 10 up 30
   track 2 ip sla 2 reachability
    delay down 10 up 30

   ! Failover hanya jika KEDUA probe gagal
   track 10 list boolean or
    object 1
    object 2

   ! Rute utama diikat ke tracking, cadangan dengan AD lebih tinggi
   ip route 0.0.0.0 0.0.0.0 203.0.113.1 track 10
   ip route 0.0.0.0 0.0.0.0 198.51.100.1 10
   ```
   Tambahan: konfigurasikan NAT agar mengikuti interface aktif, dan pertimbangkan `ip nat inside source route-map` agar translasi mengikuti jalur yang dipakai.

4. `always` memerintahkan OSPF **selalu** mengiklankan default route, **bahkan ketika router itu sendiri tidak punya rute default yang valid** (mis. link ISP mati). Router-router lain akan terus mengirim seluruh trafik internet ke router ini, yang lalu **membuangnya** karena tidak punya jalan keluar — **black hole**. Tanpa `always`, iklan default otomatis berhenti ketika rute default lokal hilang, sehingga jaringan bisa beralih ke jalur lain. Gunakan `always` hanya jika Anda punya mekanisme lain yang menjamin konektivitas keluar.

5. **Rute balik di R2/router tujuan.** Paket ICMP echo request mungkin sampai ke 192.168.20.5, tetapi host itu (atau router di jalurnya) tidak tahu cara mengirim balasan ke alamat sumber ping Anda. Periksa `show ip route` di router tujuan untuk subnet sumber. Selanjutnya periksa: (b) ACL di sepanjang jalur yang memblokir ICMP; (c) NAT yang mengubah alamat; (d) firewall di host tujuan; (e) jalankan `traceroute` untuk melihat di hop mana paket berhenti; (f) coba `ping ... source <interface>` dengan sumber yang jelas punya rute balik.

6. Karena gateway ISP berada **terlalu dekat** — ia adalah perangkat pertama di luar router Anda. Kalau kegagalan terjadi di **hulu** ISP (router core ISP mati, upstream transit putus, BGP ISP bermasalah), gateway lokal ISP **tetap hidup dan menjawab ping**. Pengujian lolos sementara internet sebenarnya tidak dapat dijangkau — failover tidak pernah terpicu. Target yang benar adalah alamat **di luar jaringan ISP** (mis. 8.8.8.8, 1.1.1.1) sehingga probe menguji konektivitas end-to-end yang sesungguhnya.

7. **`permanent`**: rute **tetap dipasang di routing table** walaupun interface keluar down atau next hop tidak terjangkau. Router akan terus mengirim paket ke jalur mati — paket hilang tanpa pemberitahuan, dan rute cadangan **tidak pernah** aktif. Berguna hanya dalam kasus khusus (mis. mencegah flapping rute pada link yang naik-turun singkat, dengan pemahaman penuh atas risikonya).
   **`track N`**: rute dipasang **hanya jika** track object dalam keadaan up. Ketika pengujian aktif (IP SLA) gagal, rute **dihapus** dari tabel, sehingga rute cadangan dengan AD lebih tinggi otomatis masuk. Ini perilaku yang diinginkan untuk failover.

</details>

---

## 13. Sumber

- Cisco CCNA 200-301 v1.1, topik 3.3 (Configure and verify IPv4 and IPv6 static routing: default route, network route, host route, floating static)
- Cisco, *IP SLAs Configuration Guide*
- Cisco, *Configuring Enhanced Object Tracking*
- RFC 4632 — CIDR (longest prefix match)

---

**Berikutnya:** `07-routing-lanjutan/02-konsep-routing-dinamis.md` — dasar sebelum masuk ke OSPF, EIGRP, dan BGP.

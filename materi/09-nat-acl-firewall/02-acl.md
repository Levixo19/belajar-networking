# 09.2 Access Control List (ACL)

> **Prasyarat:** `04-network-layer/03` (wildcard mask), `05-transport/01`
> **Tujuan:** Anda bisa menulis, menempatkan, dan mendiagnosis ACL dengan benar di Cisco, dan memahami padanannya di MikroTik/Linux.

---

## 1. Apa Itu ACL

**ACL** adalah daftar aturan berurutan yang menentukan paket mana yang **diizinkan** atau **ditolak**.

### Kegunaan: lebih dari sekadar filtering

```
1. Filtering trafik (paling umum)
2. Membatasi akses manajemen (VTY)
3. Menentukan trafik untuk NAT
4. Menentukan trafik untuk QoS/marking
5. Menentukan trafik untuk PBR (route-map)
6. Menentukan rute untuk distribute-list
7. Menentukan trafik untuk VPN (crypto ACL)
8. Debug yang terbatas
```

> [!TIP]
> **ACL sering dipakai sebagai "pemilih trafik" (traffic selector), bukan hanya sebagai firewall.** Ini konsep yang membedakan penggunaan pemula dan profesional.

---

## 2. Cara Kerja: Top-Down dengan Implicit Deny

```
Paket masuk
    ↓
Aturan 1  → cocok? → jalankan aksi, BERHENTI
    ↓ tidak cocok
Aturan 2  → cocok? → jalankan aksi, BERHENTI
    ↓ tidak cocok
Aturan 3  → cocok? → jalankan aksi, BERHENTI
    ↓ tidak cocok
IMPLICIT DENY ANY  ← selalu ada di akhir, tidak terlihat
    → paket DIBUANG
```

> [!WARNING]
> **Dua aturan yang menyebabkan 90% kesalahan ACL:**

**1. Urutan sangat penting.** Aturan pertama yang cocok yang menang.
```
❌ SALAH:
access-list 101 permit ip any any              ← cocok dengan SEMUA
access-list 101 deny tcp any any eq 23         ← TIDAK PERNAH DIEVALUASI

✅ BENAR:
access-list 101 deny tcp any any eq 23
access-list 101 permit ip any any
```

**2. Implicit deny di akhir.** ACL yang hanya berisi `permit` untuk satu hal akan **memblokir semua yang lain**.
```
❌ Bermaksud "blokir telnet", hasilnya "blokir SEMUANYA kecuali yang disebut":
access-list 101 deny tcp any any eq 23
   ← tidak ada permit → implicit deny memblokir semua trafik lain!

✅ BENAR:
access-list 101 deny tcp any any eq 23
access-list 101 permit ip any any
```

---

## 3. Jenis ACL di Cisco

| Jenis | Nomor | Memeriksa |
|---|---|---|
| **Standard** | 1-99, 1300-1999 | **Hanya alamat sumber** |
| **Extended** | 100-199, 2000-2699 | Sumber, tujuan, protokol, port, flag |
| **Named** | Nama teks | Standard atau extended, lebih mudah dikelola |

### Standard ACL

```
R1(config)# access-list 10 permit 192.168.1.0 0.0.0.255
R1(config)# access-list 10 deny   192.168.2.0 0.0.0.255
R1(config)# access-list 10 permit any

# Named
R1(config)# ip access-list standard MANAJEMEN
R1(config-std-nacl)# permit 192.168.99.0 0.0.0.255
R1(config-std-nacl)# deny any log
```

> [!WARNING]
> **Standard ACL hanya melihat alamat SUMBER.** Karena itu ia harus ditempatkan **sedekat mungkin dengan TUJUAN** — kalau ditempatkan dekat sumber, ia akan memblokir trafik ke semua tujuan, bukan hanya yang dimaksud.

### Extended ACL

```
access-list <nomor> {permit|deny} <protokol> <sumber> <wildcard> [operator port]
                                              <tujuan> <wildcard> [operator port] [opsi]
```

```
# Izinkan HTTP dari LAN ke server
R1(config)# access-list 101 permit tcp 192.168.1.0 0.0.0.255 host 10.0.0.10 eq 80

# Izinkan HTTPS ke mana saja
R1(config)# access-list 101 permit tcp 192.168.1.0 0.0.0.255 any eq 443

# Izinkan DNS (TCP dan UDP)
R1(config)# access-list 101 permit udp 192.168.1.0 0.0.0.255 any eq 53
R1(config)# access-list 101 permit tcp 192.168.1.0 0.0.0.255 any eq 53

# Izinkan ping keluar dan balasannya
R1(config)# access-list 101 permit icmp 192.168.1.0 0.0.0.255 any echo
R1(config)# access-list 101 permit icmp any 192.168.1.0 0.0.0.255 echo-reply

# WAJIB untuk PMTUD — jangan sampai terlupa!
R1(config)# access-list 101 permit icmp any any packet-too-big

# Izinkan hanya balasan koneksi yang dimulai dari dalam
R1(config)# access-list 101 permit tcp any 192.168.1.0 0.0.0.255 established

# Blokir dan catat sisanya
R1(config)# access-list 101 deny ip any any log
```

**Operator port:**
```
eq 80              sama dengan 80
neq 80             tidak sama dengan 80
lt 1024            kurang dari 1024
gt 1023            lebih dari 1023
range 20 21        antara 20 dan 21
```

**Kata kunci yang mempercepat penulisan:**
```
host 10.0.0.1      ≡  10.0.0.1 0.0.0.0
any                ≡  0.0.0.0 255.255.255.255
```

### Named Extended ACL (direkomendasikan)

```
R1(config)# ip access-list extended DARI-LAN
R1(config-ext-nacl)# permit tcp 192.168.1.0 0.0.0.255 any eq 443
R1(config-ext-nacl)# permit tcp 192.168.1.0 0.0.0.255 any eq 80
R1(config-ext-nacl)# permit udp 192.168.1.0 0.0.0.255 any eq 53
R1(config-ext-nacl)# deny ip any any log
```

> [!TIP]
> **Selalu pakai named ACL** — lebih mudah dibaca, lebih mudah diedit, dan tidak membuang nomor.

---

## 4. Penempatan ACL

Ini keputusan yang menentukan apakah ACL Anda bekerja seperti yang dimaksud.

```
STANDARD ACL  → tempatkan sedekat mungkin dengan TUJUAN
                (karena hanya melihat sumber; kalau dekat sumber
                 akan memblokir ke semua tujuan)

EXTENDED ACL  → tempatkan sedekat mungkin dengan SUMBER
                (menghemat bandwidth — buang trafik sedini mungkin)
```

### Inbound vs Outbound

```
R1(config-if)# ip access-group 101 in     ← periksa SEBELUM routing
R1(config-if)# ip access-group 101 out    ← periksa SETELAH routing
```

| | **Inbound** | **Outbound** |
|---|---|---|
| Kapan diperiksa | Sebelum keputusan routing | Setelah keputusan routing |
| Efisiensi | **Lebih efisien** (paket ditolak lebih awal) | Router terlanjur memproses routing |
| Trafik yang dihasilkan router | Tidak diperiksa | Tidak diperiksa |

> [!TIP]
> **Umumnya pilih `in`** — lebih efisien dan lebih intuitif.

> [!WARNING]
> **ACL tidak memfilter trafik yang dihasilkan router itu sendiri.** Ping, SSH, atau routing update dari router tidak melewati ACL interface. Untuk itu gunakan Control Plane Policing (CoPP).

---

## 5. Membatasi Akses Manajemen (VTY)

Ini salah satu penggunaan ACL yang paling penting untuk keamanan.

```
R1(config)# ip access-list standard AKSES-SSH
R1(config-std-nacl)# permit 192.168.99.0 0.0.0.255
R1(config-std-nacl)# deny any log

R1(config)# line vty 0 15
R1(config-line)# transport input ssh
R1(config-line)# access-class AKSES-SSH in
R1(config-line)# exec-timeout 10 0
```

> [!WARNING]
> **Perhatikan `access-class`, bukan `ip access-group`** untuk VTY.

> [!WARNING]
> **Selalu uji dari sesi kedua sebelum menutup sesi pertama.** Kalau ACL salah, Anda akan terkunci dan harus datang secara fisik.

---

## 6. Mengedit ACL dengan Aman

> [!WARNING]
> **Named ACL dengan sequence number** adalah satu-satunya cara aman untuk mengedit ACL produksi.

```
R1# show ip access-lists DARI-LAN
Extended IP access list DARI-LAN
    10 permit tcp 192.168.1.0 0.0.0.255 any eq 443 (1523 matches)
    20 permit tcp 192.168.1.0 0.0.0.255 any eq 80 (892 matches)
    30 deny ip any any log (45 matches)

# Sisipkan aturan baru DI ANTARA
R1(config)# ip access-list extended DARI-LAN
R1(config-ext-nacl)# 15 permit udp 192.168.1.0 0.0.0.255 any eq 53

# Hapus satu aturan
R1(config-ext-nacl)# no 20

# Nomori ulang (rapikan)
R1(config)# ip access-list resequence DARI-LAN 10 10
```

> [!WARNING]
> **JANGAN memakai `no access-list 101` pada ACL bernomor yang sedang terpasang** — ini **menghapus seluruh ACL sekaligus**, dan karena ACL kosong berarti implicit deny, **seluruh trafik langsung diblokir**. Outage instan.

> [!TIP]
> **Cara aman mengganti ACL produksi:**
```
1. Buat ACL BARU dengan nama berbeda
2. Uji dengan hati-hati
3. Ganti binding-nya: ip access-group ACL-BARU in
4. Setelah terverifikasi, hapus ACL lama
```

---

## 7. ACL untuk IPv6

```
R1(config)# ipv6 access-list DARI-LAN-V6
R1(config-ipv6-acl)# permit tcp 2001:db8:1::/64 any eq 443
R1(config-ipv6-acl)# permit icmp any any            ← WAJIB!
R1(config-ipv6-acl)# deny ipv6 any any log

R1(config-if)# ipv6 traffic-filter DARI-LAN-V6 in
```

> [!WARNING]
> **Perbedaan penting dari IPv4:**

1. **Perintahnya `ipv6 traffic-filter`**, bukan `ipv6 access-group`.
2. **JANGAN blokir ICMPv6** — ia membawa NDP (pengganti ARP), RA, DAD. Memblokirnya mematikan IPv6 total.
3. IPv6 ACL punya **implicit permit** untuk NDP sebelum implicit deny:
   ```
   permit icmp any any nd-na
   permit icmp any any nd-ns
   deny ipv6 any any
   ```
   **Perhatian:** Tetapi kalau Anda menambahkan `deny ipv6 any any` **eksplisit**, kedua permit implisit itu **hilang** — dan IPv6 berhenti bekerja. Selalu tambahkan permit NDP secara eksplisit kalau memakai deny eksplisit.

4. **Tidak ada wildcard mask** — memakai prefix length.

---

## 8. ACL di MikroTik RouterOS

MikroTik tidak punya "ACL" terpisah — semuanya dilakukan lewat **firewall filter** dan **address list**.

```
# Setara standard ACL: address list
/ip firewall address-list add list=MANAJEMEN address=192.168.99.0/24
/ip firewall address-list add list=MANAJEMEN address=10.10.10.5

# Membatasi akses manajemen (setara access-class)
/ip firewall filter add chain=input src-address-list=MANAJEMEN \
    protocol=tcp dst-port=22,8291 action=accept comment="Akses manajemen"
/ip firewall filter add chain=input protocol=tcp dst-port=22,8291 \
    action=drop comment="Tolak manajemen dari sumber lain"

# Setara extended ACL
/ip firewall filter add chain=forward src-address=192.168.1.0/24 \
    protocol=tcp dst-port=443 action=accept
/ip firewall filter add chain=forward src-address=192.168.1.0/24 \
    protocol=udp dst-port=53 action=accept
/ip firewall filter add chain=forward action=drop log=yes log-prefix="DROP-FWD"

# Melihat dan mengedit
/ip firewall filter print
/ip firewall filter print stats            ← berapa paket kena tiap aturan
/ip firewall filter move 5 destination=2   ← ubah urutan (PENTING!)
/ip firewall filter disable 3
/ip firewall filter remove [find comment="lama"]
```

> [!WARNING]
> **Sama seperti Cisco, urutan sangat penting di MikroTik** — aturan diproses dari atas ke bawah. Gunakan `/ip firewall filter move` untuk mengurutkannya, dan **selalu beri `comment`** agar bisa dicari dengan `[find comment=...]`.

> [!WARNING]
> **Berbeda dari Cisco, MikroTik TIDAK punya implicit deny.** Kalau tidak ada aturan yang cocok, paket **diterima**. Anda harus menambahkan aturan `drop` di akhir secara eksplisit.

### Address list: fitur unggulan MikroTik

```
# Statis
/ip firewall address-list add list=BLOKIR address=203.0.113.0/24

# Dari nama domain (otomatis di-resolve dan diperbarui)
/ip firewall address-list add list=SOSMED address=facebook.com

# DINAMIS — ditambahkan otomatis oleh aturan firewall
/ip firewall filter add chain=input protocol=tcp dst-port=22 \
    connection-state=new src-address-list=ssh-stage3 \
    action=add-src-to-address-list address-list=ssh-blacklist \
    address-list-timeout=1d comment="Brute force → blacklist 1 hari"
```

> [!TIP]
> **Address list dinamis dengan timeout adalah salah satu fitur terkuat MikroTik** — memungkinkan blacklist otomatis, deteksi port scan, dan brute force protection tanpa perangkat tambahan. Tidak ada padanan sesederhana ini di Cisco IOS.

---

## 9. ACL di Linux

```bash
# nftables (modern)
sudo nft add table inet filter
sudo nft add chain inet filter input '{ type filter hook input priority 0; policy drop; }'
sudo nft add rule inet filter input ct state established,related accept
sudo nft add rule inet filter input iif lo accept
sudo nft add rule inet filter input ip saddr 192.168.99.0/24 tcp dport 22 accept
sudo nft add rule inet filter input icmp type { echo-request, destination-unreachable } accept
sudo nft add rule inet filter input log prefix "DROP-INPUT: " drop

sudo nft list ruleset
sudo nft -a list ruleset          # dengan handle (untuk menghapus aturan tertentu)
```

Detail lengkap di `13-linux-networking/03-nftables-firewall.md`.

---

## 10. Verifikasi dan Troubleshooting

```
# Cisco
R1# show ip access-lists
R1# show ip access-lists DARI-LAN
R1# show ip interface gi0/1 | include access list
R1# show access-lists | include matches
R1# clear ip access-list counters DARI-LAN
R1# debug ip packet 101 detail        ⚠️ SANGAT berbahaya di produksi!
```

> [!WARNING]
> **`debug ip packet` bisa melumpuhkan router** karena setiap paket diproses CPU dan dicatat. **Jangan pernah** menjalankannya di produksi tanpa ACL pembatas yang sangat sempit, dan selalu siapkan `undebug all`.

### Alur diagnosis

```
1. Apakah ACL benar-benar terpasang?
   show ip interface gi0/1 | include access list

2. Apakah ACL kena?
   show ip access-lists → lihat counter "(N matches)"
   → counter 0 pada aturan yang seharusnya kena = paket tidak sampai ke ACL ini
     (arah salah? interface salah? sudah diblokir aturan lain?)

3. Aturan mana yang memblokir?
   Tambahkan sementara aturan permit dengan log di posisi tertentu,
   atau periksa counter aturan deny

4. Apakah arah benar?
   in vs out — ini penyebab kesalahan paling umum

5. Apakah trafik BALIK diizinkan?
   ACL bersifat searah! Trafik balasan butuh aturan sendiri
   (atau kata kunci "established" / reflexive ACL)
```

> [!WARNING]
> **Kesalahan nomor satu: lupa trafik balik.** ACL standar bersifat **stateless** — mengizinkan paket keluar tidak otomatis mengizinkan balasannya masuk.

```
# Solusi 1: kata kunci established (hanya TCP)
R1(config)# access-list 101 permit tcp any 192.168.1.0 0.0.0.255 established

# Solusi 2: reflexive ACL (stateful sederhana)
R1(config)# ip access-list extended KELUAR
R1(config-ext-nacl)# permit tcp 192.168.1.0 0.0.0.255 any reflect TRAFIK-KELUAR
R1(config)# ip access-list extended MASUK
R1(config-ext-nacl)# evaluate TRAFIK-KELUAR
R1(config-ext-nacl)# deny ip any any

# Solusi 3 (TERBAIK): pakai firewall stateful — ZBF, ASA, atau MikroTik
```

---

## 11. Praktik Terbaik

```
✅ Gunakan NAMED ACL, bukan bernomor
✅ Beri komentar pada setiap aturan penting:
     R1(config-ext-nacl)# remark Izinkan HTTPS dari LAN staf
✅ Urutkan dari SPESIFIK ke UMUM
✅ Tempatkan aturan yang paling sering kena di ATAS (efisiensi)
✅ Selalu akhiri dengan deny eksplisit + log (agar terlihat)
✅ Uji dari sesi terpisah sebelum menutup sesi manajemen
✅ Dokumentasikan tujuan setiap ACL
✅ Review berkala — hapus aturan yang tidak pernah kena
✅ Untuk IPv6: JANGAN blokir ICMPv6
✅ Gunakan sequence number untuk mengedit
```

```
❌ JANGAN `no access-list 101` pada ACL yang sedang terpasang
❌ JANGAN letakkan permit any di atas
❌ JANGAN lupa trafik balik
❌ JANGAN pakai ACL sebagai pengganti firewall stateful untuk perimeter
❌ JANGAN `debug ip packet` di produksi
```

---

## 12. Ringkasan

- ACL = daftar aturan berurutan; diproses **top-down**, aturan pertama yang cocok menang, dan ada **implicit deny any** di akhir (Cisco).
- **Standard** (1-99) hanya melihat **sumber** → tempatkan **dekat tujuan**. **Extended** (100-199) melihat semuanya → tempatkan **dekat sumber**.
- Gunakan **named ACL** dengan sequence number agar bisa diedit dengan aman.
- `host X` ≡ `X 0.0.0.0`; `any` ≡ `0.0.0.0 255.255.255.255`.
- **`in` lebih efisien** daripada `out`. ACL **tidak memfilter trafik yang dihasilkan router sendiri**.
- **`access-class` untuk VTY**, `ip access-group` untuk interface.
- **`no access-list 101` menghapus seluruh ACL → outage instan.** Buat ACL baru, ganti binding, baru hapus yang lama.
- **IPv6: `ipv6 traffic-filter`**, jangan blokir ICMPv6, dan `deny ipv6 any any` eksplisit menghapus permit NDP implisit.
- **MikroTik tidak punya implicit deny** — tambahkan `action=drop` eksplisit di akhir. **Address list dinamis** adalah fitur unggulannya.
- ACL bersifat **stateless** — selalu pertimbangkan trafik balik (`established`, reflexive, atau pakai firewall stateful).

---

## 13. Latihan

1. Kenapa standard ACL ditempatkan dekat tujuan, sedangkan extended ACL dekat sumber?
2. Tulis extended ACL yang mengizinkan LAN 192.168.10.0/24 mengakses HTTPS dan DNS, tetapi memblokir semua yang lain, dengan logging.
3. Anda menjalankan `no access-list 101` untuk mengedit ACL. Apa yang terjadi dan bagaimana seharusnya?
4. ACL IPv6 Anda berisi `permit tcp any any eq 443` dan `deny ipv6 any any`. IPv6 berhenti bekerja total. Kenapa?
5. Trafik keluar diizinkan tetapi tidak ada balasan yang masuk. Sebutkan tiga solusi.
6. Apa perbedaan mendasar perilaku default ACL Cisco dan firewall filter MikroTik?
7. Bagaimana membuat blacklist otomatis untuk penyerang SSH brute force di MikroTik?

<details>
<summary>Jawaban</summary>

1. **Standard ACL hanya memeriksa alamat sumber.** Kalau ditempatkan dekat sumber, ia akan memblokir trafik dari host itu ke **semua tujuan** — termasuk tujuan yang seharusnya boleh diakses. Menempatkannya dekat tujuan membatasi dampaknya hanya pada jalur menuju tujuan yang dimaksud.
   **Extended ACL memeriksa sumber, tujuan, protokol, dan port** sehingga bisa sangat spesifik. Menempatkannya dekat sumber **menghemat bandwidth** — paket yang akan ditolak dibuang sedini mungkin, tidak membebani link di sepanjang jalur.

2. ```
   ip access-list extended LAN10-KELUAR
    remark Izinkan HTTPS
    permit tcp 192.168.10.0 0.0.0.255 any eq 443
    remark Izinkan DNS (UDP dan TCP)
    permit udp 192.168.10.0 0.0.0.255 any eq 53
    permit tcp 192.168.10.0 0.0.0.255 any eq 53
    remark Izinkan PMTUD - WAJIB
    permit icmp any any packet-too-big
    remark Tolak dan catat sisanya
    deny ip any any log

   interface gi0/1
    ip access-group LAN10-KELUAR in
   ```
   Catatan: `permit icmp any any packet-too-big` penting agar Path MTU Discovery tetap bekerja — tanpa itu, transfer besar bisa menggantung.

3. **`no access-list 101` menghapus SELURUH ACL sekaligus.** Karena ACL tersebut masih terpasang di interface dengan `ip access-group 101 in`, dan **ACL kosong berarti hanya ada implicit deny**, maka **seluruh trafik langsung diblokir** — outage instan. Kalau Anda melakukannya dari jarak jauh, Anda juga terkunci.
   **Yang seharusnya:** (a) gunakan **named ACL** yang bisa diedit per-baris dengan sequence number; atau (b) buat ACL **baru** dengan nama/nomor berbeda, uji, lalu ganti binding-nya (`ip access-group ACL-BARU in`), baru hapus yang lama setelah terverifikasi.

4. Karena **ACL IPv6 punya dua aturan permit implisit untuk NDP** sebelum implicit deny:
   ```
   permit icmp any any nd-na
   permit icmp any any nd-ns
   deny ipv6 any any
   ```
   Ketika Anda menambahkan **`deny ipv6 any any` secara eksplisit**, kedua permit implisit itu **tidak lagi diterapkan** — NDP (Neighbor Solicitation/Advertisement) diblokir. Tanpa NDP, host tidak bisa me-resolve alamat IPv6 ke MAC, sehingga **tidak ada komunikasi IPv6 sama sekali**. Router Advertisement juga terblokir sehingga host kehilangan gateway.
   **Perbaikan:** tambahkan permit ICMPv6 secara eksplisit sebelum deny:
   ```
   permit icmp any any nd-na
   permit icmp any any nd-ns
   permit icmp any any router-advertisement
   permit icmp any any packet-too-big
   deny ipv6 any any log
   ```

5. (a) **Kata kunci `established`** — mengizinkan segmen TCP yang punya bit ACK/RST diset (artinya bagian dari koneksi yang sudah ada). Terbatas: **hanya untuk TCP**, dan bisa dipalsukan.
   (b) **Reflexive ACL** — membuat entri sementara secara otomatis saat trafik keluar, dan mengizinkan balasan yang cocok. Bekerja untuk TCP dan UDP, tetapi terbatas dan kikuk.
   (c) **Firewall stateful** — Zone-Based Firewall (Cisco IOS), ASA/FTD, atau MikroTik `connection-state=established,related`. Ini solusi yang **benar**: firewall melacak state koneksi dan otomatis mengizinkan balasan yang sah. Untuk perimeter, selalu pakai ini alih-alih ACL stateless.

6. **Cisco ACL punya `implicit deny any` di akhir** — kalau tidak ada aturan yang cocok, paket **dibuang**. Ini pendekatan "default deny" yang aman, tetapi berarti Anda harus mengizinkan semua yang diperlukan secara eksplisit — termasuk hal-hal yang mudah terlupa.
   **MikroTik firewall filter TIDAK punya implicit deny** — kalau tidak ada aturan yang cocok, paket **diterima**. Ini pendekatan "default permit" yang lebih permisif dan berbahaya kalau Anda mengiranya sama dengan Cisco.
   **Konsekuensi praktis:** di MikroTik Anda **wajib menambahkan aturan `action=drop` di akhir setiap chain** yang ingin Anda amankan. Banyak router MikroTik di lapangan terekspos karena administratornya mengira perilakunya sama dengan Cisco.

7. Teknik bertingkat dengan address list dinamis — pendekatan standar MikroTik:
   ```
   /ip firewall filter
   # Tahap 3: yang sudah di tahap 3 dan mencoba lagi → BLACKLIST 10 hari
   add chain=input protocol=tcp dst-port=22 connection-state=new \
       src-address-list=ssh-stage3 action=add-src-to-address-list \
       address-list=ssh-blacklist address-list-timeout=10d \
       comment="SSH brute force: blacklist"

   # Tahap 2 → 3
   add chain=input protocol=tcp dst-port=22 connection-state=new \
       src-address-list=ssh-stage2 action=add-src-to-address-list \
       address-list=ssh-stage3 address-list-timeout=1m

   # Tahap 1 → 2
   add chain=input protocol=tcp dst-port=22 connection-state=new \
       src-address-list=ssh-stage1 action=add-src-to-address-list \
       address-list=ssh-stage2 address-list-timeout=1m

   # Percobaan pertama → tahap 1
   add chain=input protocol=tcp dst-port=22 connection-state=new \
       action=add-src-to-address-list address-list=ssh-stage1 \
       address-list-timeout=1m

   # Blokir yang sudah masuk blacklist (letakkan PALING ATAS!)
   add chain=input protocol=tcp dst-port=22 src-address-list=ssh-blacklist \
       action=drop comment="Drop SSH blacklist"
   ```
   ⚠️ **Urutan penting:** aturan `drop` untuk blacklist harus berada **di atas** semua aturan tahap, atau penyerang yang sudah di-blacklist akan terus memicu aturan tahap alih-alih langsung ditolak. Gunakan `/ip firewall filter move` untuk mengaturnya.
   Cara kerjanya: empat percobaan koneksi baru dalam waktu singkat akan menaikkan alamat dari stage1 → stage2 → stage3 → blacklist, lalu diblokir selama 10 hari. Alamat yang hanya salah ketik sekali akan kedaluwarsa dari stage1 dalam 1 menit tanpa konsekuensi.

</details>

---

## 14. Sumber

- Cisco CCNA 200-301 v1.1, topik 5.6 (Configure and verify access control lists)
- Cisco, *Configuring IP Access Lists* (Document ID 23602)
- RFC 4890 — Recommendations for Filtering ICMPv6 Messages
- MikroTik — https://help.mikrotik.com/docs/display/ROS/Filter

---

**Berikutnya:** `09-nat-acl-firewall/03-firewall.md` — dari filter paket ke firewall stateful dan NGFW.

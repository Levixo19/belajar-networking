# 09.1 NAT

> **Prasyarat:** `04-network-layer/01`, `05-transport/01`
> **Tujuan:** Anda paham semua varian NAT, bisa mengonfigurasinya di Cisco/MikroTik/Linux, dan mendiagnosis masalah yang ditimbulkannya.

---

## 1. Kenapa NAT Ada

```
Masalah: IPv4 hanya punya 4,3 miliar alamat
Kenyataan: ada >20 miliar perangkat terhubung

Solusi: banyak perangkat berbagi SATU alamat publik
```

**NAT** (*Network Address Translation*) [RFC 3022] mengubah alamat IP (dan sering port) saat paket melintasi router.

### Manfaat

1. **Menghemat alamat IPv4** — ratusan host di balik satu alamat publik
2. **Menyembunyikan topologi internal** — luar hanya melihat satu alamat
3. **Fleksibilitas** — ganti ISP tanpa menomori ulang jaringan internal
4. **Menghindari konflik** saat merger (dengan NAT overlapping)

### Biaya yang sering diabaikan

> [!WARNING]
> **NAT merusak prinsip end-to-end internet:**
- Koneksi masuk **tidak mungkin** tanpa konfigurasi khusus
- P2P, VoIP, dan game butuh mekanisme traversal (STUN/TURN/ICE)
- Protokol yang menyertakan alamat di payload rusak (FTP aktif, SIP, H.323) → butuh ALG
- Logging dan forensik jadi sulit — ribuan pengguna di satu alamat
- Menambah latency dan beban CPU/memori router
- IPsec AH tidak bisa melewati NAT (ESP butuh NAT-T)

> [!TIP]
> **NAT BUKAN fitur keamanan.** Ia menyembunyikan alamat, tetapi tidak memeriksa isi paket. Firewall stateful-lah yang memberi keamanan — dan NAT kebetulan menyertakan sifat stateful itu. Di IPv6 tidak ada NAT, dan keamanannya justru **lebih baik** karena firewall dikonfigurasi secara eksplisit.

---

## 2. Terminologi Cisco (Wajib untuk Ujian)

```
                    NAT Router
   [Host 10.0.0.5] ──────────────── [Server 203.0.113.50]
        INSIDE                            OUTSIDE

  Inside Local   : 10.0.0.5         alamat host DI DALAM, dilihat dari DALAM
  Inside Global  : 198.51.100.10    alamat host DI DALAM, dilihat dari LUAR
  Outside Local  : 203.0.113.50     alamat host DI LUAR, dilihat dari DALAM
  Outside Global : 203.0.113.50     alamat host DI LUAR, dilihat dari LUAR
```

**Cara mengingat:**
- **Inside/Outside** = perangkat itu ada di **jaringan mana**
- **Local/Global** = alamat itu **terlihat dari mana**

> [!WARNING]
> Outside Local dan Outside Global biasanya sama, kecuali Anda memakai NAT dua arah (destination NAT untuk alamat yang tumpang tindih).

---

## 3. Jenis NAT

### Static NAT (satu-ke-satu)

Pemetaan tetap antara satu alamat privat dan satu alamat publik.

```
10.0.0.10 ←──selalu──→ 198.51.100.10
```

**Untuk:** server yang harus dapat diakses dari internet dengan alamat tetap.

```
# Cisco
R1(config)# ip nat inside source static 10.0.0.10 198.51.100.10
R1(config)# interface gi0/1
R1(config-if)# ip nat inside
R1(config)# interface gi0/0
R1(config-if)# ip nat outside
```

```
# MikroTik — butuh DUA aturan (keluar dan masuk)
/ip firewall nat add chain=srcnat src-address=10.0.0.10 \
    action=src-nat to-addresses=198.51.100.10
/ip firewall nat add chain=dstnat dst-address=198.51.100.10 \
    action=dst-nat to-addresses=10.0.0.10
```

```bash
# Linux (nftables)
nft add rule ip nat postrouting ip saddr 10.0.0.10 snat to 198.51.100.10
nft add rule ip nat prerouting  ip daddr 198.51.100.10 dnat to 10.0.0.10
```

### Dynamic NAT (kolam alamat)

Alamat privat dipetakan ke alamat publik dari **pool**, secara dinamis.

```
# Cisco
R1(config)# ip nat pool POOL-PUBLIK 198.51.100.10 198.51.100.20 netmask 255.255.255.0
R1(config)# access-list 1 permit 10.0.0.0 0.0.0.255
R1(config)# ip nat inside source list 1 pool POOL-PUBLIK
```

> [!WARNING]
> **Jumlah host bersamaan dibatasi ukuran pool.** Kalau pool habis, host berikutnya tidak bisa keluar sama sekali. Jarang dipakai; PAT hampir selalu lebih baik.

### PAT / NAT Overload (banyak-ke-satu): yang paling umum

Semua host berbagi **satu** alamat publik; dibedakan dengan **port sumber**.

```
10.0.0.5:51234  →  198.51.100.1:61001
10.0.0.6:51234  →  198.51.100.1:61002   ← port diubah agar unik
10.0.0.7:44000  →  198.51.100.1:61003
```

Karena port 16 bit, secara teoretis **~64.000 sesi bersamaan per alamat publik** (praktisnya lebih sedikit).

```
# Cisco — dengan interface
R1(config)# access-list 1 permit 10.0.0.0 0.0.0.255
R1(config)# ip nat inside source list 1 interface gi0/0 overload

# Cisco — dengan pool
R1(config)# ip nat inside source list 1 pool POOL-PUBLIK overload
```

```
# MikroTik — masquerade (alamat mengikuti interface)
/ip firewall nat add chain=srcnat out-interface=ether1-WAN action=masquerade

# MikroTik — src-nat (alamat tetap, lebih efisien)
/ip firewall nat add chain=srcnat out-interface=ether1-WAN \
    action=src-nat to-addresses=198.51.100.1
```

```bash
# Linux
nft add rule ip nat postrouting oifname "eth0" masquerade
nft add rule ip nat postrouting oifname "eth0" snat to 198.51.100.1
```

> [!WARNING]
> **`masquerade` vs `src-nat` di MikroTik:**
| | `masquerade` | `src-nat` |
|---|---|---|
| Alamat | Otomatis dari interface keluar | Ditentukan manual |
| Untuk | IP WAN dinamis (DHCP/PPPoE) | IP WAN statis |
| Kinerja | Sedikit lebih berat (harus cek alamat tiap paket) | Lebih efisien |
| Saat interface down | **Semua koneksi dihapus** | Tidak otomatis |

> [!TIP]
> **Gunakan `src-nat` kalau IP publik Anda statis** — lebih cepat dan tidak membuang tabel koneksi saat interface flapping.

### Port Forwarding / Destination NAT

Membuka layanan internal ke internet.

```
Internet → 198.51.100.1:443 → diteruskan ke → 10.0.0.10:443
```

```
# Cisco
R1(config)# ip nat inside source static tcp 10.0.0.10 443 198.51.100.1 443
R1(config)# ip nat inside source static tcp 10.0.0.20 3389 198.51.100.1 33890
```

```
# MikroTik
/ip firewall nat add chain=dstnat in-interface-list=WAN protocol=tcp dst-port=443 \
    action=dst-nat to-addresses=10.0.0.10 to-ports=443 comment="Web server"

/ip firewall nat add chain=dstnat in-interface-list=WAN protocol=tcp dst-port=33890 \
    action=dst-nat to-addresses=10.0.0.20 to-ports=3389 comment="RDP (port diubah)"
```

```bash
# Linux
nft add rule ip nat prerouting iifname "eth0" tcp dport 443 dnat to 10.0.0.10:443
```

> [!WARNING]
> **Port forwarding + firewall harus konsisten.** Di MikroTik, aturan `dstnat` diproses **sebelum** `filter forward`, sehingga aturan filter harus mengizinkan alamat **internal** (10.0.0.10), bukan alamat publik.

### Hairpin NAT / NAT Loopback

Masalah klasik: klien **internal** mengakses server internal lewat **alamat publik**-nya.

```
[Klien 10.0.0.5] → 198.51.100.1:443 → [Server 10.0.0.10:443]

Tanpa hairpin:
  1. dstnat mengubah tujuan menjadi 10.0.0.10 ✅
  2. Server membalas LANGSUNG ke 10.0.0.5 (satu subnet, tidak lewat router)
  3. Klien menerima balasan dari 10.0.0.10, padahal ia mengirim ke 198.51.100.1
  4. Klien MEMBUANG paket → koneksi gagal ❌
```

**Solusi: NAT juga alamat sumbernya**, sehingga balasan kembali lewat router.

```
# MikroTik
/ip firewall nat add chain=srcnat src-address=10.0.0.0/24 dst-address=10.0.0.10 \
    protocol=tcp dst-port=443 out-interface=bridge-LAN action=masquerade \
    comment="Hairpin NAT"
```

```
# Cisco
R1(config)# ip nat inside source list HAIRPIN interface gi0/1 overload
```

> [!TIP]
> **Solusi yang lebih elegan: split-horizon DNS.** Buat DNS internal mengembalikan alamat privat untuk nama domain yang sama. Klien internal langsung terhubung ke 10.0.0.10 tanpa melewati router sama sekali — lebih cepat dan lebih sederhana.

---

## 4. CGNAT

Ketika ISP kehabisan IPv4, mereka menerapkan **dua lapis NAT**.

```
[Pelanggan] → NAT rumah → 100.64.x.x → NAT ISP → IPv4 publik → Internet
   10.0.0.5      (NAT 1)   (CGNAT)      (NAT 2)
```

Blok **`100.64.0.0/10`** [RFC 6598] dicadangkan khusus untuk ini.

### Dampak bagi pengguna

```
❌ Port forwarding TIDAK MUNGKIN
❌ Beberapa game dan aplikasi P2P bermasalah
❌ Server rumahan tidak bisa diakses dari luar
❌ CAPTCHA lebih sering (ribuan pengguna berbagi satu IP)
❌ Pemblokiran satu pengguna memengaruhi banyak orang
```

```bash
# Cek apakah Anda di belakang CGNAT
$ curl -s ifconfig.me           # IP publik yang terlihat dunia
# Bandingkan dengan IP WAN router Anda
# Kalau IP router 100.64.x.x – 100.127.x.x → Anda di belakang CGNAT
```

**Solusi:** minta IP publik statis ke ISP (biasanya berbayar), pakai layanan tunnel/reverse proxy (Cloudflare Tunnel, ngrok, Tailscale), atau **beralih ke IPv6**.

---

## 5. NAT Traversal

Bagaimana aplikasi P2P bekerja meski kedua pihak di belakang NAT?

| Teknik | Cara kerja |
|---|---|
| **STUN** | Klien bertanya ke server publik: "alamat dan port apa yang kamu lihat dari saya?" → tahu pemetaan NAT-nya |
| **TURN** | Relay penuh lewat server — dipakai kalau STUN gagal (symmetric NAT). Boros bandwidth |
| **ICE** | Kerangka yang mencoba semua kandidat (host, STUN, TURN) dan memilih yang berhasil |
| **UPnP / NAT-PMP / PCP** | Aplikasi meminta router membuka port secara otomatis |
| **Hole punching** | Kedua pihak mengirim keluar bersamaan sehingga NAT membuka jalur |

> [!WARNING]
> **UPnP adalah risiko keamanan** — malware bisa memakainya untuk membuka port dari dalam. Matikan di lingkungan yang butuh kontrol:
```
/ip upnp set enabled=no                          # MikroTik
R1(config)# no ip nat service ...                # Cisco
```

### Tipe NAT dan dampaknya pada P2P

```
Full Cone        → paling permisif, P2P mudah
Restricted Cone  → P2P bisa dengan hole punching
Port Restricted  → P2P bisa, lebih sulit
Symmetric        → P2P SANGAT SULIT → butuh TURN relay
```

MikroTik `masquerade` dan `src-nat` berperilaku mendekati **symmetric NAT** secara default, yang sering menyebabkan masalah game/VoIP. Beberapa pengaturan bisa melonggarkannya.

---

## 6. NAT dan Protokol Bermasalah

### FTP Aktif
Server membuka koneksi data **ke klien** — NAT memblokirnya. Solusi: mode pasif, atau ALG.

### SIP / VoIP
SIP menyertakan alamat IP di **payload**, bukan hanya header. NAT tidak mengubahnya → RTP mengalir ke alamat privat yang tidak dapat dijangkau.

```
# MikroTik — SIP ALG (helper)
/ip firewall service-port print
/ip firewall service-port set sip disabled=no
```

> [!WARNING]
> **SIP ALG sering menyebabkan masalah, bukan menyelesaikannya.** Banyak penyedia VoIP menyarankan **mematikannya** dan memakai STUN/SBC di sisi mereka:
```
/ip firewall service-port set sip disabled=yes
```

Selalu tanyakan ke penyedia VoIP Anda apa yang mereka rekomendasikan.

### IPsec
- **AH tidak bisa melewati NAT** sama sekali (mengautentikasi header IP yang diubah NAT)
- **ESP butuh NAT-T** — enkapsulasi dalam UDP 4500

```
/ip firewall service-port set ipsec-esp disabled=no    # MikroTik ESP helper
```

---

## 7. Verifikasi dan Troubleshooting

### Cisco
```
R1# show ip nat translations
Pro  Inside global      Inside local       Outside local      Outside global
tcp  198.51.100.1:61001 10.0.0.5:51234     93.184.216.34:443  93.184.216.34:443

R1# show ip nat translations verbose
R1# show ip nat statistics
R1# clear ip nat translation *
R1# debug ip nat
```

### MikroTik
```
/ip firewall nat print
/ip firewall nat print stats                 ← berapa paket kena tiap aturan
/ip firewall connection print                ← tabel koneksi
/ip firewall connection print where src-address~"10.0.0.5"
/ip firewall connection tracking print       ← statistik & timeout
/ip firewall connection remove [find]        ← reset koneksi
```

### Linux
```bash
$ sudo nft list table ip nat
$ sudo conntrack -L
$ sudo conntrack -L -s 10.0.0.5
$ sudo conntrack -F                          # flush
$ cat /proc/sys/net/netfilter/nf_conntrack_count
$ cat /proc/sys/net/netfilter/nf_conntrack_max
```

### Masalah umum

| Gejala | Penyebab |
|---|---|
| Tidak bisa keluar sama sekali | `ip nat inside/outside` belum diset (Cisco); aturan srcnat salah interface |
| Sebagian host bisa, sebagian tidak | ACL/`src-address` tidak mencakup semua subnet |
| Port forwarding tidak bekerja | Firewall memblokir; aturan filter memakai alamat publik alih-alih internal |
| Internal tidak bisa akses server sendiri lewat IP publik | **Perlu hairpin NAT** atau split-horizon DNS |
| Koneksi terputus setelah beberapa menit | **NAT timeout** — perpendek keep-alive aplikasi atau perpanjang timeout NAT |
| Router kehabisan memori | Tabel koneksi penuh (`nf_conntrack_max`) — sering karena serangan atau P2P |
| VoIP satu arah | SIP ALG bermasalah, atau RTP tidak di-NAT dengan benar |
| Game/P2P tidak bisa host | Symmetric NAT / CGNAT |

### NAT timeout

```
# MikroTik
/ip firewall connection tracking print
/ip firewall connection tracking set tcp-established-timeout=1d \
    udp-timeout=30s udp-stream-timeout=3m icmp-timeout=10s

# Linux
$ sysctl net.netfilter.nf_conntrack_tcp_timeout_established   # default 432000 (5 hari!)
$ sudo sysctl -w net.netfilter.nf_conntrack_tcp_timeout_established=86400
$ sudo sysctl -w net.netfilter.nf_conntrack_max=262144
```

> [!WARNING]
> **Timeout TCP established default Linux adalah 5 hari** — sangat boros memori pada router sibuk. Turunkan ke 1 hari atau kurang, dan pastikan aplikasi memakai TCP keep-alive.

---

## 8. NAT dan IPv6

> [!WARNING]
> **IPv6 tidak butuh NAT** karena alamatnya cukup untuk semua perangkat.

Ada **NPTv6** [RFC 6296] — translasi prefix stateless 1:1 — untuk kasus khusus (multihoming tanpa BGP). Tetapi ini **bukan** NAT dengan port translation, dan tidak merusak end-to-end sebanyak NAT44.

```
# MikroTik NPTv6 (jarang dipakai)
/ipv6 firewall nat add chain=srcnat src-address=fd00:1::/64 \
    action=netmap to-address=2001:db8:1::/64
```

> [!TIP]
> **Jangan meniru pola IPv4 di IPv6.** Memakai ULA + NAT66 membuang seluruh keunggulan IPv6 dan menambah kompleksitas tanpa manfaat keamanan nyata. Gunakan GUA + firewall stateful.

---

## 9. Ringkasan

- NAT mengubah alamat (dan port) saat paket melintasi router; **RFC 3022**.
- Terminologi Cisco: **Inside/Outside** = perangkat di jaringan mana; **Local/Global** = terlihat dari mana.
- Jenis: **static** (1:1 tetap), **dynamic** (pool), **PAT/overload** (banyak:1, paling umum), **destination NAT** (port forwarding).
- MikroTik: **`masquerade`** untuk IP dinamis, **`src-nat`** untuk IP statis (lebih efisien).
- **Hairpin NAT** diperlukan agar klien internal bisa mengakses server internal lewat IP publik — atau pakai **split-horizon DNS** (lebih baik).
- **CGNAT** (`100.64.0.0/10`) memakai dua lapis NAT; port forwarding tidak mungkin.
- **NAT traversal**: STUN (tahu pemetaan), TURN (relay), ICE (kerangka). **Symmetric NAT** paling sulit untuk P2P.
- Protokol bermasalah: FTP aktif, **SIP** (sering lebih baik matikan ALG), IPsec (AH tidak bisa, ESP butuh NAT-T).
- **NAT BUKAN firewall.** Keamanan datang dari inspeksi stateful, bukan dari penyembunyian alamat.
- Perhatikan **tabel koneksi** dan **timeout** — sumber masalah memori dan koneksi terputus.
- **IPv6 tidak butuh NAT** — jangan menirunya di sana.

---

## 10. Latihan

1. Jelaskan istilah inside local, inside global, outside local, outside global dengan contoh.
2. Kenapa PAT bisa melayani ribuan host dengan satu alamat publik? Apa batasnya?
3. Klien di LAN tidak bisa mengakses web server internal lewat nama domain publiknya, padahal dari internet bisa. Jelaskan dan berikan dua solusi.
4. Kapan memilih `src-nat` daripada `masquerade` di MikroTik?
5. Anda di belakang CGNAT dan ingin mengakses NAS rumah dari luar. Sebutkan tiga opsi.
6. Kenapa SIP sering bermasalah dengan NAT, dan kenapa SIP ALG kadang memperburuk?
7. Router MikroTik kehabisan memori. `/ip firewall connection print count-only` menunjukkan 180.000 koneksi. Apa yang Anda periksa dan lakukan?

<details>
<summary>Jawaban</summary>

1. Contoh: host internal `10.0.0.5` mengakses `93.184.216.34` lewat router yang mem-PAT ke `198.51.100.1`.
   - **Inside Local = `10.0.0.5`** — alamat host internal seperti terlihat dari dalam jaringan.
   - **Inside Global = `198.51.100.1`** — alamat host internal yang sama seperti terlihat dari internet (setelah NAT).
   - **Outside Local = `93.184.216.34`** — alamat host eksternal seperti terlihat dari dalam.
   - **Outside Global = `93.184.216.34`** — alamat host eksternal seperti terlihat dari luar.
   Outside Local dan Global sama di sini karena tidak ada destination NAT untuk alamat eksternal.

2. Karena PAT membedakan sesi bukan hanya dengan alamat, tetapi dengan **kombinasi alamat + port**. Setiap sesi keluar diberi **port sumber unik** pada alamat publik, sehingga router bisa memetakan balasan kembali ke host internal yang benar lewat tabel translasi.
   **Batasnya:** port adalah field 16 bit → **~65.000 port per alamat publik**, dan sebagian dicadangkan. Batas praktis lebih rendah karena: setiap aplikasi bisa membuka banyak koneksi (browser modern puluhan per situs), koneksi yang ditutup tetap menahan port selama timeout, dan memori untuk tabel translasi terbatas. Untuk ribuan pengguna aktif, ISP menambah alamat publik ke pool.

3. Ini masalah **hairpin NAT / NAT loopback**. Klien internal me-resolve nama domain ke alamat **publik**, lalu mengirim paket ke router. Router menerapkan `dstnat` sehingga tujuan berubah menjadi alamat internal server. Tetapi server melihat alamat sumber = klien internal yang berada **di subnet yang sama**, sehingga ia membalas **langsung** tanpa melewati router. Klien menerima balasan dari alamat yang berbeda dari yang ia kirimi, sehingga **membuangnya** — koneksi gagal.
   **Solusi 1 — Hairpin NAT:** tambahkan aturan `srcnat` yang juga menerjemahkan alamat sumber untuk trafik internal→internal, sehingga balasan kembali lewat router.
   ```
   /ip firewall nat add chain=srcnat src-address=10.0.0.0/24 dst-address=10.0.0.10 \
       protocol=tcp dst-port=443 action=masquerade
   ```
   **Solusi 2 — Split-horizon DNS (lebih baik):** konfigurasikan DNS internal agar nama domain itu me-resolve ke alamat **privat** server. Klien internal langsung terhubung ke `10.0.0.10` tanpa melibatkan router sama sekali — lebih cepat, lebih sederhana, dan tidak membebani router.

4. Pilih **`src-nat`** ketika alamat IP publik WAN Anda **statis**. Alasannya: (a) lebih **efisien** — router tidak perlu memeriksa alamat interface untuk setiap paket, cukup memakai nilai tetap; (b) lebih **stabil** — `masquerade` menghapus seluruh entri koneksi terkait ketika interface turun, sehingga semua sesi terputus bahkan pada gangguan singkat.
   Pilih **`masquerade`** ketika alamat WAN **dinamis** (DHCP dari ISP, PPPoE), karena ia otomatis mengikuti alamat yang sedang aktif tanpa perlu mengubah konfigurasi.

5. (a) **Minta IPv4 publik statis ke ISP** — biasanya layanan berbayar, tetapi paling sederhana dan memberi kontrol penuh. (b) **Gunakan layanan tunnel/reverse proxy** — Cloudflare Tunnel, Tailscale, ZeroTier, ngrok, atau VPS murah dengan reverse SSH tunnel/WireGuard; koneksi diinisiasi dari dalam sehingga NAT tidak menjadi penghalang. (c) **Aktifkan IPv6** — kalau ISP menyediakan IPv6 (banyak yang sudah), NAS mendapat alamat publik yang dapat dijangkau langsung; cukup buka firewall untuk port yang diperlukan. Opsi tambahan: VPN ke rumah lewat penyedia dynamic DNS **jika** Anda punya IPv4 publik dinamis (bukan CGNAT).

6. **SIP menyertakan alamat IP dan port di dalam payload pesan** (header SDP), bukan hanya di header IP. NAT hanya mengubah header IP/UDP, sehingga payload masih berisi **alamat privat**. Akibatnya lawan bicara mencoba mengirim aliran RTP (suara) ke alamat privat yang tidak dapat dijangkau → **suara satu arah atau tidak ada suara sama sekali**.
   **SIP ALG** mencoba memperbaikinya dengan menulis ulang payload. Masalahnya: implementasi ALG di banyak router **buruk dan tidak konsisten** — ia bisa merusak pesan SIP yang sah, gagal menangani SIP over TLS (yang terenkripsi sehingga tidak bisa dimodifikasi), salah menangani beberapa dialek SIP, atau berkonflik dengan mekanisme traversal yang sudah dipakai penyedia (STUN/ICE/SBC). Karena itu banyak penyedia VoIP **secara eksplisit meminta SIP ALG dimatikan** dan mengandalkan mekanisme di sisi mereka.

7. **Periksa dulu apa yang mengisi tabel koneksi:**
   ```
   /ip firewall connection print count-only
   /ip firewall connection print where protocol=udp
   /ip firewall connection print where src-address~"192.168.1.50"
   /tool torch interface=bridge-LAN
   ```
   Cari: satu host yang membuat ribuan koneksi (P2P/torrent, malware, atau aplikasi yang bocor), atau serangan (SYN flood, port scan).
   **Tindakan:**
   (a) **Turunkan timeout** agar entri lama cepat dibersihkan:
   ```
   /ip firewall connection tracking set tcp-established-timeout=1d \
       udp-timeout=10s udp-stream-timeout=1m tcp-close-wait-timeout=10s
   ```
   (b) **Batasi koneksi per host** untuk mencegah satu perangkat menghabiskan tabel:
   ```
   /ip firewall filter add chain=forward connection-limit=200,32 \
       protocol=tcp action=drop comment="Batasi 200 koneksi per host"
   ```
   (c) **Aktifkan FastTrack** untuk koneksi established agar tidak semua diproses penuh (perhatikan: FastTrack melewati queue dan mangle).
   (d) Identifikasi dan tangani host bermasalah; blokir trafik P2P kalau melanggar kebijakan.
   (e) Kalau perangkat memang kurang kuat untuk beban itu, pertimbangkan upgrade — CCR punya RAM jauh lebih besar.

</details>

---

## 11. Sumber

- RFC 3022 — Traditional IP Network Address Translator (NAT)
- RFC 2663 — NAT Terminology and Considerations
- RFC 4787 — NAT Behavioral Requirements for Unicast UDP
- RFC 6598 — Shared Address Space (CGNAT)
- RFC 5389 — STUN · RFC 8656 — TURN · RFC 8445 — ICE
- RFC 6296 — IPv6-to-IPv6 Network Prefix Translation
- Cisco CCNA 200-301 v1.1, topik 4.1 (configure and verify inside source NAT using static and pools)
- MikroTik — https://help.mikrotik.com/docs/display/ROS/NAT

---

**Berikutnya:** `09-nat-acl-firewall/02-acl.md`. Kontrol trafik dengan access control list.

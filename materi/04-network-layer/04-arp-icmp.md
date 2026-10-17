# 04.4 ARP dan ICMP

> **Prasyarat:** `04-network-layer/01`, `03-data-link/01`
> **Tujuan:** Anda paham bagaimana IP dipetakan ke MAC, bisa membaca setiap tipe pesan ICMP, dan tahu persis bagaimana `ping` dan `traceroute` bekerja.

---

## 1. ARP (Address Resolution Protocol)

### Masalah yang dipecahkan

Anda tahu IP tujuan. Tetapi untuk mengirim frame, Anda butuh **MAC address**. Dari mana?

```
Aplikasi tahu : "kirim ke 192.168.1.20"
Layer 2 butuh : "MAC tujuan = ?"
```

**ARP** [RFC 826] menjembatani ini: ia menanyakan "siapa yang punya IP ini?" dan mendapat jawaban berupa MAC address.

### Cara kerja

```
1. Host A (192.168.1.10) ingin mengirim ke 192.168.1.20
2. Cek ARP cache → tidak ada
3. Kirim ARP REQUEST sebagai BROADCAST:
   ┌────────────────────────────────────────────┐
   │ MAC tujuan : ff:ff:ff:ff:ff:ff (broadcast) │
   │ MAC sumber : aa:aa:aa:aa:aa:aa             │
   │ EtherType  : 0x0806 (ARP)                  │
   │ Isi        : "Siapa punya 192.168.1.20?    │
   │               Beritahu 192.168.1.10"       │
   └────────────────────────────────────────────┘
4. SEMUA host di broadcast domain menerima
5. Host dengan IP 192.168.1.20 menjawab dengan ARP REPLY (UNICAST):
   ┌────────────────────────────────────────────┐
   │ MAC tujuan : aa:aa:aa:aa:aa:aa             │
   │ MAC sumber : bb:bb:bb:bb:bb:bb             │
   │ Isi        : "192.168.1.20 ada di bb:bb..."│
   └────────────────────────────────────────────┘
6. Host A menyimpan pemetaan di ARP cache
7. Sekarang frame bisa dikirim
```

> [!WARNING]
> **Poin penting:** Request adalah **broadcast**, Reply adalah **unicast**. Host lain yang mendengar request juga sering menyimpan pemetaan IP↔MAC pengirim (ARP snooping pasif).

### Struktur paket ARP

```
Hardware Type      : 1 (Ethernet)
Protocol Type      : 0x0800 (IPv4)
Hardware Size      : 6 (panjang MAC)
Protocol Size      : 4 (panjang IPv4)
Opcode             : 1 = Request, 2 = Reply
Sender MAC         : MAC pengirim
Sender IP          : IP pengirim
Target MAC         : 00:00:00:00:00:00 pada request (belum tahu)
Target IP          : IP yang dicari
```

### ARP untuk tujuan di luar subnet

> [!WARNING]
> **Kesalahpahaman paling umum tentang ARP.**

```
Host A (192.168.1.10/24) ingin mengirim ke 8.8.8.8

1. AND: 8.8.8.8 tidak ada di 192.168.1.0/24 → TUJUAN JAUH
2. Kirim ke DEFAULT GATEWAY (192.168.1.1)
3. ARP untuk 192.168.1.1 (BUKAN untuk 8.8.8.8!)
4. Frame:
     MAC tujuan = MAC gateway
     IP tujuan  = 8.8.8.8         ← tetap tujuan akhir
```

> **Host tidak pernah melakukan ARP untuk alamat di luar subnetnya.** Ia hanya ber-ARP untuk gateway.

### ARP Cache

```bash
# Linux
$ ip neigh show
192.168.1.1 dev eth0 lladdr bb:bb:bb:bb:bb:bb REACHABLE
192.168.1.20 dev eth0 lladdr cc:cc:cc:cc:cc:cc STALE

# State ARP di Linux:
#   INCOMPLETE  — request dikirim, belum ada jawaban
#   REACHABLE   — terverifikasi baru-baru ini
#   STALE       — kedaluwarsa, akan diverifikasi saat dipakai
#   DELAY       — menunggu konfirmasi
#   PROBE       — sedang memverifikasi
#   FAILED      — tidak ada jawaban

$ ip neigh flush all              # hapus seluruh cache
$ ip neigh del 192.168.1.20 dev eth0
$ ip neigh add 192.168.1.99 lladdr 00:11:22:33:44:55 dev eth0 nud permanent

# Windows
PS> arp -a
PS> arp -d *
PS> netsh interface ip delete arpcache
```

```
# Cisco
R1# show ip arp
Protocol  Address        Age (min)  Hardware Addr   Type   Interface
Internet  192.168.1.1           -   bbbb.bbbb.bbbb  ARPA   GigabitEthernet0/0
Internet  192.168.1.10          5   aaaa.aaaa.aaaa  ARPA   GigabitEthernet0/0

R1# clear arp-cache
R1(config)# arp 192.168.1.99 0011.2233.4455 arpa    ← entri statis
R1(config-if)# arp timeout 300                       ← default 14400 detik (4 jam)
```

> [!WARNING]
> **ARP timeout default Cisco adalah 4 jam**, sementara MAC address table switch hanya 5 menit. Ketidaksesuaian ini menyebabkan **unicast flooding** — dibahas di `03-data-link/02`.

### Gratuitous ARP

ARP Request untuk **alamat IP sendiri**, dikirim tanpa diminta.

```
"Siapa yang punya 192.168.1.10?  Beritahu 192.168.1.10"
                 ^^^^^^^^^^^^^                ^^^^^^^^^^^^^
                 target IP = sender IP
```

Kegunaan:
1. **Deteksi duplikasi IP** — kalau ada yang menjawab, berarti IP sudah dipakai.
2. **Memperbarui cache tetangga** — setelah failover (VRRP/HSRP), perangkat baru mengumumkan "MAC untuk IP virtual ini sekarang saya".
3. **Setelah VM migrasi** — mengumumkan lokasi baru.
4. **Saat interface naik** — memastikan tetangga punya informasi terbaru.

> [!WARNING]
> Gratuitous ARP juga menjadi mekanisme **ARP spoofing** (`12-keamanan/02`) — penyerang mengirim gratuitous ARP palsu untuk mengaku sebagai gateway.

### Proxy ARP

Router menjawab ARP request untuk alamat yang **bukan miliknya**, seolah-olah ia adalah tujuan tersebut.

```
Host A (192.168.1.10/16 — mask salah!) ingin mengirim ke 192.168.2.20
Host A mengira 192.168.2.20 ada di subnetnya (karena /16)
→ Host A ber-ARP untuk 192.168.2.20
→ Router menjawab dengan MAC-nya sendiri (proxy ARP)
→ Trafik lewat router, komunikasi berhasil
```

> [!TIP]
> Proxy ARP "menyembunyikan" kesalahan konfigurasi subnet mask. Ini terdengar membantu, tetapi:

> [!WARNING]
> **Umumnya sebaiknya dimatikan:**
- Menyembunyikan kesalahan konfigurasi (masalah tidak pernah diperbaiki)
- Memperbesar ARP table
- Bisa dieksploitasi untuk MITM
- Membuat troubleshooting membingungkan

```
R1(config-if)# no ip proxy-arp
```

Pengecualian di mana proxy ARP sah: beberapa desain VPN remote-access dan skenario transisi jaringan.

### RARP dan BOOTP (historis)

- **RARP** — kebalikan ARP: "MAC saya X, IP saya apa?" Digantikan BOOTP lalu DHCP.
- **BOOTP** — pendahulu DHCP; DHCP kompatibel mundur dengannya (port 67/68 yang sama).

---

## 2. ICMP (Internet Control Message Protocol)

Protokol pelaporan error dan diagnostik untuk IP. Berjalan **langsung di dalam IP** (protokol nomor **1**), bukan di atas TCP/UDP.

> [!WARNING]
> ICMP bukan protokol layer 4. Ia adalah bagian integral dari layer 3.

### Struktur pesan ICMP

```
┌────────┬────────┬──────────────────┐
│  Type  │  Code  │    Checksum      │
│ 1 byte │ 1 byte │     2 byte       │
├────────┴────────┴──────────────────┤
│      Isi bergantung Type/Code       │
│  (untuk error: header IP asli +     │
│   8 byte pertama payload asli)      │
└────────────────────────────────────┘
```

> [!TIP]
> Pesan error ICMP menyertakan **header paket yang gagal + 8 byte pertama payload**. Delapan byte itu cukup untuk memuat port sumber & tujuan TCP/UDP — sehingga host bisa tahu **koneksi mana** yang bermasalah.

### Tipe ICMP yang wajib dikenal

| Type | Code | Nama | Kapan muncul |
|---|---|---|---|
| **0** | 0 | **Echo Reply** | Jawaban ping |
| **3** | — | **Destination Unreachable** | Tujuan tidak terjangkau |
| 3 | 0 | Network Unreachable | Router tidak punya rute ke jaringan |
| 3 | 1 | Host Unreachable | Jaringan terjangkau, host tidak menjawab ARP |
| 3 | 2 | Protocol Unreachable | Protokol L4 tidak didukung |
| **3** | **3** | **Port Unreachable** | Tidak ada aplikasi di port UDP itu |
| **3** | **4** | **Fragmentation Needed & DF set** | **Kunci PMTUD!** |
| 3 | 9/10 | Administratively Prohibited | Diblokir ACL/firewall |
| 3 | 13 | Communication Administratively Filtered | Diblokir kebijakan |
| **5** | 0-3 | **Redirect** | "Ada gateway yang lebih baik" |
| **8** | 0 | **Echo Request** | Ping dikirim |
| **11** | **0** | **TTL Exceeded in Transit** | **Kunci traceroute!** |
| 11 | 1 | Fragment Reassembly Time Exceeded | Fragmen tidak lengkap |
| 12 | 0 | Parameter Problem | Header IP rusak |
| 13/14 | 0 | Timestamp Request/Reply | Sinkronisasi waktu (jarang) |

### ICMP Redirect

Router memberi tahu host bahwa ada gateway yang lebih baik untuk tujuan tertentu.

```
Host mengirim ke Router A
Router A melihat: "tujuan ini lebih baik lewat Router B, yang ada di
                   segmen yang SAMA dengan host"
Router A meneruskan paketnya, TAPI juga mengirim ICMP Redirect ke host:
  "Untuk tujuan X, kirimlah ke Router B langsung"
Host memperbarui routing table-nya
```

> [!WARNING]
> **Sering dimatikan** karena bisa dieksploitasi untuk mengarahkan trafik ke penyerang:
```
R1(config-if)# no ip redirects
```

---

## 3. Ping: Cara Kerja Sesungguhnya

```
Host A                          Host B
   │                               │
   │──── ICMP Echo Request ───────►│   Type 8, Code 0
   │      (id, seq, payload)       │
   │                               │
   │◄─── ICMP Echo Reply ──────────│   Type 0, Code 0
   │      (id, seq, payload sama)  │
```

**Field penting:**
- **Identifier** — membedakan proses ping yang berbeda di host yang sama
- **Sequence number** — bertambah setiap paket; mendeteksi kehilangan dan urutan
- **Payload** — data pengisi; ukurannya bisa diatur untuk menguji MTU

### Membaca output ping

```bash
$ ping -c 4 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=115 time=12.3 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=115 time=11.8 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=115 time=45.2 ms
64 bytes from 8.8.8.8: icmp_seq=4 ttl=115 time=12.1 ms

--- 8.8.8.8 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3005ms
rtt min/avg/max/mdev = 11.891/20.375/45.243/14.203 ms
```

| Bagian | Arti |
|---|---|
| `56(84) bytes` | 56 byte payload + 8 byte header ICMP + 20 byte header IP = 84 |
| `icmp_seq` | Nomor urut; lompatan = paket hilang |
| `ttl=115` | TTL sisa; 128−115 = 13 hop (pengirim kemungkinan Windows) |
| `time` | RTT |
| `mdev` | Deviasi = indikator **jitter**; 14 ms di sini menunjukkan variasi tinggi |

### Opsi ping penting

```bash
$ ping -c 10 host              # jumlah paket
$ ping -i 0.2 host             # interval 0,2 detik
$ ping -s 1472 host            # ukuran payload
$ ping -M do -s 1472 host      # DF bit diset → uji MTU
$ ping -I eth1 host            # tentukan interface sumber
$ ping -t 5 host               # set TTL
$ ping -f host                 # flood (butuh root; hati-hati!)
$ ping -W 2 host               # timeout per paket
$ ping -D host                 # tampilkan timestamp
$ ping -A host                 # adaptif (secepat RTT)
```

```
# Cisco extended ping
R1# ping
Protocol [ip]:
Target IP address: 10.0.0.1
Repeat count [5]: 100
Datagram size [100]: 1500
Timeout in seconds [2]:
Extended commands [n]: y
Source address or interface: gi0/1     ← PENTING untuk troubleshooting
Type of service [0]:
Set DF bit in IP header? [no]: yes     ← untuk uji MTU
Data pattern [0xABCD]:
Sweep range of sizes [n]: y            ← uji berbagai ukuran sekaligus

# Singkat
R1# ping 10.0.0.1 source gi0/1 repeat 100 size 1500 df-bit
```

> [!TIP]
> **`source` sangat penting** saat menguji dari router: tanpa itu, router memakai IP interface keluar, yang mungkin tidak punya jalur balik. Banyak masalah "ping gagal dari router tetapi PC bisa" berasal dari sini.

### Kenapa ping gagal padahal host hidup

> [!WARNING]
> **`ping` gagal ≠ host mati.** Kemungkinan penyebab:
1. **Firewall memblokir ICMP** — sangat umum di server Windows dan cloud
2. **ACL di router** memblokir
3. Host dikonfigurasi tidak menjawab ICMP
4. **Rate limiting ICMP** di router (ICMP prioritas rendah)
5. Jalur balik tidak ada (routing asimetris)
6. Ada NAT tanpa mapping balik

**Alternatif menguji konektivitas:**
```bash
$ nc -zv host 443              # uji port TCP
$ curl -Is https://host        # uji HTTP
$ tcptraceroute host 443       # traceroute lewat TCP
$ nmap -Pn -p 443 host         # skip ping, langsung port scan
$ arping -I eth0 192.168.1.20  # uji L2 (tanpa ICMP)
```

---

## 4. Traceroute: Cara Kerja Sesungguhnya

Traceroute memanfaatkan **TTL** untuk memaksa setiap router mengungkapkan dirinya.

```
Kirim paket dengan TTL=1
  → Router 1: TTL menjadi 0 → BUANG + kirim ICMP Time Exceeded (Type 11)
  → Kita tahu identitas Router 1 dan RTT-nya

Kirim paket dengan TTL=2
  → Router 1: TTL→1, teruskan
  → Router 2: TTL→0 → ICMP Time Exceeded
  → Kita tahu Router 2

Kirim paket dengan TTL=3, 4, 5, ...
  → sampai tujuan menjawab (bukan Time Exceeded)
```

### Perbedaan implementasi

| | Linux/macOS `traceroute` | Windows `tracert` | `traceroute -I` |
|---|---|---|---|
| Paket keluar | **UDP** port tinggi (33434+) | **ICMP Echo Request** | ICMP Echo Request |
| Tanda selesai | ICMP **Port Unreachable** (3/3) | ICMP **Echo Reply** (0) | ICMP Echo Reply |

> [!WARNING]
> **Konsekuensi praktis:** firewall yang memblokir UDP port tinggi akan membuat `traceroute` Linux gagal tetapi `tracert` Windows berhasil (atau sebaliknya jika ICMP yang diblokir). Kalau satu gagal, coba yang lain:
```bash
$ traceroute -I host          # pakai ICMP
$ traceroute -T -p 443 host   # pakai TCP SYN ke port 443 (paling sering lolos firewall)
```

### Membaca output traceroute

```bash
$ traceroute -n 8.8.8.8
 1  192.168.1.1      0.512 ms   0.489 ms   0.478 ms
 2  10.20.30.1       8.234 ms   8.190 ms   8.201 ms
 3  * * *
 4  103.10.20.30    12.456 ms  12.401 ms  12.398 ms
 5  103.10.20.34    45.234 ms  12.502 ms  12.489 ms
 6  8.8.8.8         12.601 ms  12.588 ms  12.594 ms
```

> [!WARNING]
> **Cara menafsirkan yang BENAR — ini sering salah:**

**1. `* * *` tidak selalu berarti masalah.**
Router bisa:
- Dikonfigurasi tidak mengirim ICMP Time Exceeded
- Melakukan rate limiting ICMP
- Berada di dalam MPLS cloud yang menyembunyikan hop
Kalau hop **setelahnya** menjawab normal, jalur baik-baik saja.

**2. Latency tinggi di satu hop tengah tidak berarti hop itu bermasalah.**
```
 5  103.10.20.34    450 ms   455 ms   448 ms
 6  8.8.8.8          12 ms    12 ms    12 ms   ← hop terakhir CEPAT
```
Ini normal! Hop 5 hanya lambat **membalas ICMP** (prioritas rendah di CPU-nya), tetapi **meneruskan trafik** dengan cepat. Yang penting adalah **latency di hop terakhir**.

**3. Latency yang naik dan tetap tinggi sampai akhir = masalah nyata.**
```
 4   12 ms
 5  180 ms
 6  185 ms
 7  190 ms   ← naik di hop 5 dan TIDAK turun lagi → masalah antara hop 4 dan 5
```

**4. Jalur pergi ≠ jalur pulang.** Traceroute hanya menunjukkan jalur **pergi**. Latency tinggi bisa berasal dari jalur pulang yang berbeda dan tidak terlihat.

**5. Load balancing membuat hop berbeda-beda.** Tiga probe per hop bisa melewati router berbeda.

### MTR: traceroute + ping berkelanjutan

```bash
$ mtr -n -r -c 100 8.8.8.8
HOST: laptop                      Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- 192.168.1.1                0.0%   100    0.5   0.6   0.4   2.1   0.2
  2.|-- 10.20.30.1                 0.0%   100    8.2   8.5   8.0  15.3   1.1
  3.|-- 103.10.20.30              12.0%   100   12.4  13.1  12.0  45.2   4.2
  4.|-- 8.8.8.8                    0.0%   100   12.6  12.8  12.3  18.9   0.8
```

> [!WARNING]
> **Loss di hop tengah yang tidak muncul di hop akhir adalah normal** — itu ICMP rate limiting, bukan packet loss sesungguhnya. **Loss yang benar-benar bermasalah adalah loss di hop terakhir** (atau loss yang persisten dari satu hop sampai akhir).

Dalam contoh di atas: hop 3 menunjukkan 12% loss tetapi hop 4 (tujuan) 0% → tidak ada masalah nyata.

---

## 5. Path MTU Discovery

Mekanisme untuk menemukan MTU terkecil di sepanjang jalur, tanpa fragmentasi.

```
1. Pengirim mengirim paket dengan bit DF (Don't Fragment) diset
2. Router menemukan paket terlalu besar untuk link berikutnya
3. Router MEMBUANG paket dan mengirim:
      ICMP Type 3 Code 4 "Fragmentation Needed and DF Set"
      + MTU yang benar dalam pesannya
4. Pengirim memperkecil paket dan mengirim ulang
5. Diulang sampai paket lolos
```

> [!WARNING]
> **PMTUD gagal total jika ICMP tipe 3 kode 4 diblokir** → **MTU black hole**.

**Gejala MTU black hole:**
```
✅ ping berhasil (paket kecil)
✅ Koneksi TCP terbentuk (handshake paket kecil)
✅ SSH login berhasil
❌ Transfer data besar MENGGANTUNG tanpa error
❌ Sebagian situs terbuka, sebagian tidak (yang punya halaman besar)
❌ `ls` direktori besar via SSH macet
```

**Diagnosis:**
```bash
# Cari MTU efektif — turunkan sampai berhasil
$ ping -M do -s 1472 tujuan     # 1472+28 = 1500
$ ping -M do -s 1400 tujuan
$ ping -M do -s 1372 tujuan     # 1372+28 = 1400
# Yang pertama berhasil menunjukkan MTU jalur

# Cek PMTU yang tercatat
$ ip route get 8.8.8.8
8.8.8.8 via 192.168.1.1 dev eth0 src 192.168.1.50 uid 1000
    cache expires 590sec mtu 1400
```

**Perbaikan:**
```bash
# 1. Izinkan ICMP tipe 3 kode 4 di firewall (SOLUSI TERBAIK)
$ sudo nft add rule inet filter input icmp type destination-unreachable accept

# 2. Turunkan MTU interface
$ sudo ip link set dev tun0 mtu 1400

# 3. MSS clamping di router (untuk TCP)
R1(config-if)# ip tcp adjust-mss 1360
```

> [!TIP]
> **MSS clamping** memodifikasi opsi MSS di paket SYN TCP sehingga kedua ujung sepakat memakai segmen kecil sejak awal. Ini bekerja tanpa bergantung pada ICMP — solusi paling andal untuk tunnel.

---

## 6. ICMP dan Keamanan

### Kenapa orang memblokir ICMP

- Mencegah *reconnaissance* (ping sweep untuk memetakan jaringan)
- Mencegah serangan lama: Smurf (broadcast amplification), Ping of Death (paket >65535), ICMP flood
- Mencegah ICMP tunneling (eksfiltrasi data lewat payload ICMP)

### Kenapa memblokir ICMP total adalah kesalahan

> [!WARNING]
> Memblokir **seluruh** ICMP merusak:
1. **PMTUD** → MTU black hole (masalah paling sering)
2. **Traceroute** → troubleshooting jauh lebih sulit
3. **Pesan error yang berguna** → "host unreachable" menjadi timeout misterius
4. **IPv6 sepenuhnya rusak** — ICMPv6 membawa NDP (pengganti ARP), RA, dan DAD. Memblokir ICMPv6 = mematikan IPv6.

### Rekomendasi

**Izinkan minimal:**
```
Type 3 Code 4  — Fragmentation Needed (WAJIB untuk PMTUD)
Type 3         — Destination Unreachable (berguna untuk aplikasi)
Type 11        — Time Exceeded (untuk traceroute)
Type 0/8       — Echo (dengan rate limiting)
```

**Rate limit, jangan blokir:**
```
R1(config)# ip icmp rate-limit unreachable 1000
```

```bash
# nftables — rate limit ICMP
$ sudo nft add rule inet filter input icmp type echo-request limit rate 10/second accept
$ sudo nft add rule inet filter input icmp type { destination-unreachable, time-exceeded } accept
```

---

## 7. Praktik

```bash
# ARP
$ ip neigh show
$ arping -I eth0 -c 3 192.168.1.1        # ping di layer 2
$ sudo arp-scan --localnet                # pindai semua host di LAN
$ sudo tcpdump -ni eth0 arp -e            # lihat ARP secara langsung

# Deteksi duplikasi IP
$ sudo arping -D -I eth0 192.168.1.50     # DAD: cek apakah IP sudah dipakai

# ICMP
$ ping -c 5 -s 1472 -M do 8.8.8.8
$ traceroute -n 8.8.8.8
$ traceroute -I -n 8.8.8.8               # ICMP mode
$ traceroute -T -p 443 -n 8.8.8.8        # TCP mode (lolos firewall)
$ mtr -n -r -c 50 8.8.8.8

# Lihat ICMP di jaringan
$ sudo tcpdump -ni any icmp -v

# Cek PMTU
$ ip route get 8.8.8.8
$ tracepath 8.8.8.8                      # menampilkan MTU per hop
```

```
# Cisco
R1# show ip arp
R1# show arp
R1# clear arp-cache
R1# debug arp
R1# ping 10.0.0.1 source lo0 df-bit size 1500
R1# traceroute 8.8.8.8 source gi0/0
R1(config-if)# no ip proxy-arp
R1(config-if)# no ip redirects
R1(config-if)# no ip unreachables      ← hati-hati: merusak PMTUD!
```

> [!WARNING]
> `no ip unreachables` sering direkomendasikan untuk hardening, tetapi **merusak PMTUD** karena ICMP tipe 3 kode 4 tidak lagi dikirim. Pertimbangkan `ip icmp rate-limit unreachable` sebagai gantinya.

---

## 8. Kesalahan Umum

> [!WARNING]
> **1. Mengira host ber-ARP untuk tujuan jauh.** Host hanya ber-ARP untuk gateway.

> [!WARNING]
> **2. Menyimpulkan "host mati" dari ping yang gagal.** Firewall sangat sering memblokir ICMP.

> [!WARNING]
> **3. Menyalahkan hop tengah dengan latency tinggi di traceroute.** Yang penting hop terakhir.

> [!WARNING]
> **4. Menyalahkan `* * *` di traceroute.** Sering hanya ICMP yang tidak dijawab.

> [!WARNING]
> **5. Memblokir seluruh ICMP.** Merusak PMTUD, dan mematikan IPv6.

> [!WARNING]
> **6. Mengabaikan `source` saat ping/traceroute dari router.** Hasil bisa menyesatkan.

> [!WARNING]
> **7. Membiarkan proxy ARP aktif.** Menyembunyikan salah konfigurasi mask.

---

## MikroTik RouterOS

```
# ARP table
/ip arp print
/ip arp print where interface=bridge-LAN
/ip arp print detail

# Entri ARP statis
/ip arp add address=192.168.1.50 mac-address=00:11:22:33:44:55 interface=bridge-LAN

# Mode ARP per interface — SANGAT berguna untuk keamanan
/interface bridge set bridge-LAN arp=enabled
   # enabled        → normal (default)
   # disabled       → tidak menjawab & tidak belajar ARP
   # proxy-arp      → jawab ARP untuk alamat yang bukan miliknya
   # local-proxy-arp→ proxy ARP dalam interface yang sama
   # reply-only     → HANYA menjawab; tidak belajar ARP baru

# Kombinasi anti ARP spoofing: reply-only + entri statis dari DHCP
/interface bridge set bridge-LAN arp=reply-only
/ip dhcp-server set dhcp1 add-arp=yes
```

> [!TIP]
> **`arp=reply-only` + `add-arp=yes` di DHCP server** adalah teknik keamanan khas MikroTik: router **hanya** mengenali host yang mendapat alamat dari DHCP-nya. Host yang memasang IP statis sendiri **tidak akan bisa berkomunikasi** — mencegah pencurian IP dan ARP spoofing sekaligus. Sangat umum dipakai di hotspot dan RT/RW-Net.

> [!WARNING]
> Konsekuensinya: perangkat dengan IP statis (server, printer) harus didaftarkan manual di `/ip arp` atau diberi lease statis di DHCP.

### ICMP dan diagnostik

```
# Ping
/ping 8.8.8.8 count=5
/ping 8.8.8.8 count=5 src-address=192.168.1.1
/ping 8.8.8.8 size=1472 do-not-fragment       ← uji MTU
/ping 8.8.8.8 interval=100ms count=100

# Traceroute
/tool traceroute 8.8.8.8
/tool traceroute 8.8.8.8 src-address=192.168.1.1
/tool traceroute 8.8.8.8 protocol=tcp port=443

# Ping berkelanjutan dengan statistik (setara MTR)
/tool ping-speed address=8.8.8.8

# Netwatch — monitoring host dengan aksi otomatis
/tool netwatch add host=8.8.8.8 interval=10s timeout=1s \
    up-script="/log info \"ISP-A UP\"" \
    down-script="/log warning \"ISP-A DOWN\"; /ip route disable [find comment=ISP-A]"
/tool netwatch print
```

> [!TIP]
> **Netwatch adalah salah satu fitur paling berguna di RouterOS** — setara IP SLA + EEM di Cisco, tetapi jauh lebih sederhana. Dipakai untuk failover, notifikasi, dan otomasi.

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `show ip arp` | `/ip arp print` |
| `clear arp-cache` | `/ip arp remove [find dynamic]` |
| `arp 1.1.1.1 0011.2233.4455 arpa` | `/ip arp add address=1.1.1.1 mac-address=00:11:22:33:44:55 interface=X` |
| `no ip proxy-arp` | `/interface set X arp=enabled` (bukan proxy-arp) |
| `ping X source Y` | `/ping X src-address=Y` |
| `ping X df-bit size 1500` | `/ping X do-not-fragment size=1472` |
| `traceroute X` | `/tool traceroute X` |
| IP SLA + track | `/tool netwatch` |

---

## 9. Ringkasan

- **ARP** memetakan IP → MAC dalam satu segmen. Request = broadcast, Reply = unicast.
- Host **hanya ber-ARP untuk gateway** saat tujuan berada di luar subnet.
- ARP timeout Cisco default 4 jam vs MAC table 5 menit → sumber unicast flooding.
- **Gratuitous ARP** untuk deteksi duplikasi, failover FHRP, dan migrasi VM — juga dipakai untuk ARP spoofing.
- **Proxy ARP sebaiknya dimatikan** — menyembunyikan salah konfigurasi.
- **ICMP** berjalan langsung di IP (protokol 1), bukan layer 4.
- Tipe kunci: **8/0** echo, **3/4** fragmentation needed (PMTUD), **11/0** TTL exceeded (traceroute), **3/3** port unreachable, **5** redirect.
- Ping memakai Echo Request/Reply; traceroute memanfaatkan TTL. Implementasi Linux pakai UDP, Windows pakai ICMP.
- Dalam traceroute: **`* * *` dan latency hop tengah sering normal**; yang penting hop terakhir.
- **PMTUD gagal bila ICMP 3/4 diblokir → MTU black hole.** Perbaiki dengan mengizinkan ICMP, menurunkan MTU, atau **MSS clamping**.
- Jangan blokir ICMP total — rate limit saja. ICMPv6 mutlak diperlukan untuk IPv6.

---

## 10. Latihan

1. Host `192.168.1.10/24` mengirim ke `10.0.0.5`. Untuk alamat mana host melakukan ARP?
2. `ping 10.0.0.5` gagal. Sebutkan lima kemungkinan penyebab selain "host mati".
3. Traceroute menunjukkan hop 5 dengan latency 400 ms tetapi hop 6 (tujuan) 15 ms. Apakah ada masalah?
4. Jelaskan bagaimana traceroute bisa memetakan setiap router di jalur.
5. Anda memblokir semua ICMP di firewall untuk keamanan. Masalah apa yang muncul dalam beberapa hari?
6. Sebuah VPN: SSH tersambung, tetapi `scp` file besar menggantung. Diagnosis dan perbaikan?
7. Kenapa `traceroute` Linux bisa gagal sementara `tracert` Windows berhasil pada tujuan yang sama?
8. Apa fungsi gratuitous ARP setelah failover HSRP?

<details>
<summary>Jawaban</summary>

1. Untuk **default gateway** (misalnya `192.168.1.1`), bukan untuk `10.0.0.5`. Karena `10.0.0.5` berada di luar subnet `192.168.1.0/24`, host mengirim frame ke MAC gateway sementara IP tujuan di dalam paket tetap `10.0.0.5`.

2. (a) Firewall di host tujuan memblokir ICMP; (b) ACL di router memblokir; (c) tidak ada rute balik (routing asimetris/tidak lengkap); (d) NAT tanpa mapping balik; (e) rate limiting ICMP; (f) host dikonfigurasi tidak menjawab echo request; (g) VLAN/subnet salah sehingga trafik tidak pernah sampai.

3. **Tidak ada masalah.** Latency tinggi di hop tengah biasanya berarti router itu memberi prioritas rendah untuk **membalas** ICMP Time Exceeded (diproses CPU), sementara **meneruskan** trafik tetap cepat (diproses ASIC). Bukti bahwa jalur baik: hop terakhir hanya 15 ms.

4. Traceroute mengirim serangkaian paket dengan **TTL yang bertambah**: TTL=1, 2, 3, dan seterusnya. Router ke-N akan mengurangi TTL menjadi 0, membuang paket, dan mengirim **ICMP Time Exceeded (tipe 11)** kembali ke pengirim — pesan itu berisi alamat IP router tersebut sebagai sumber. Dengan menaikkan TTL satu per satu, setiap router di jalur secara berurutan "memperkenalkan diri". Proses berhenti ketika tujuan akhir menjawab (Echo Reply atau Port Unreachable, tergantung implementasi).

5. Masalah utama: (a) **PMTUD rusak** → MTU black hole: koneksi terbentuk tetapi transfer besar menggantung, sebagian situs tidak terbuka; (b) traceroute tidak berfungsi → troubleshooting jauh lebih sulit; (c) pesan error berguna hilang → aplikasi menunggu timeout panjang alih-alih langsung tahu tujuan tidak terjangkau; (d) jika IPv6 dipakai, **IPv6 berhenti bekerja total** karena NDP, RA, dan DAD semuanya memakai ICMPv6.

6. **MTU black hole akibat overhead tunnel.** VPN menambah header (WireGuard 60 byte, IPsec ~56-73 byte), sehingga MTU efektif turun di bawah 1500. Paket besar dengan DF diset dibuang, dan ICMP "Fragmentation Needed" kemungkinan diblokir di jalur.
   **Diagnosis:** `ping -M do -s <ukuran> tujuan` dengan ukuran menurun untuk menemukan MTU efektif; bandingkan dengan `ip link show <tunnel>`.
   **Perbaikan:** turunkan MTU interface tunnel (mis. `ip link set dev wg0 mtu 1420`), dan/atau terapkan **MSS clamping** di router (`ip tcp adjust-mss 1380`), dan pastikan ICMP tipe 3 kode 4 tidak diblokir.

7. Karena implementasinya berbeda. `traceroute` Linux mengirim **paket UDP ke port tinggi** (33434+) secara default; `tracert` Windows mengirim **ICMP Echo Request**. Jika firewall di jalur memblokir UDP port tinggi tetapi mengizinkan ICMP, maka Linux gagal dan Windows berhasil. Solusi di Linux: `traceroute -I` (mode ICMP) atau `traceroute -T -p 443` (mode TCP, biasanya paling sering lolos).

8. Setelah failover, router **standby** mengambil alih IP virtual dan MAC virtual HSRP. Ia mengirim **gratuitous ARP** untuk mengumumkan bahwa MAC virtual tersebut sekarang berada di port/switch yang berbeda. Ini memaksa switch memperbarui MAC address table-nya (memindahkan entri MAC virtual ke port yang benar) dan memperbarui ARP cache host, sehingga trafik langsung mengalir ke router yang baru aktif tanpa menunggu timeout ARP/MAC.

</details>

---

## 11. Sumber

- RFC 826 — Address Resolution Protocol (ARP)
- RFC 792 — Internet Control Message Protocol (ICMP)
- RFC 1122 — Requirements for Internet Hosts (perilaku ARP & ICMP)
- RFC 1191 & RFC 8899 — Path MTU Discovery
- RFC 5227 — IPv4 Address Conflict Detection (gratuitous ARP)
- RFC 4443 — ICMPv6
- Cisco CCNA 200-301 v1.1, topik 1.4 & 5.x

---

**Berikutnya:** `04-network-layer/05-routing-dasar.md`. Bagaimana router memilih jalur.

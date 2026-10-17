# 01.3 Enkapsulasi dan Perjalanan Sebuah Paket

> **Prasyarat:** `01-model-referensi/01`, `01-model-referensi/02`
> **Tujuan:** Anda bisa menjelaskan langkah demi langkah apa yang terjadi sejak menekan Enter di browser sampai halaman muncul, dan tahu persis apa yang berubah di setiap hop.

Modul ini inti kurikulum: kalau Anda benar-benar memahami satu narasi ini, sisa materi hanyalah pendalaman tiap bagiannya.

---

## 1. Enkapsulasi: Amplop di Dalam Amplop

**Enkapsulasi** = setiap layer menambahkan informasinya sendiri ke data dari layer di atasnya, lalu menyerahkannya ke layer di bawahnya.

Analogi surat berlapis:
```
Anda menulis surat                            → DATA
Masukkan ke amplop kecil, tulis "Untuk Budi"  → header aplikasi
Masukkan amplop kecil ke amplop besar,
  tulis "PT Maju, lantai 5"                   → header transport
Masukkan ke kotak pengiriman,
  tulis alamat lengkap kota                   → header network
Serahkan ke kurir, tulis nomor truk           → header data link
Truk berangkat                                → sinyal fisik
```

Setiap layer tidak peduli isi dari layer di atasnya. Bagi layer 3, seluruh segmen TCP hanyalah "muatan" yang harus diantar.

---

## 2. Proses Enkapsulasi di Pengirim

```
┌─────────────────────────────────────────────────────────┐
│ L7  Aplikasi                                            │
│     ┌───────────────────────────────────┐               │
│     │            DATA                   │               │
│     └───────────────────────────────────┘               │
├─────────────────────────────────────────────────────────┤
│ L4  Transport — tambah header TCP/UDP                   │
│     ┌────────┬──────────────────────────┐               │
│     │ TCP hdr│          DATA            │  = SEGMENT    │
│     └────────┴──────────────────────────┘               │
├─────────────────────────────────────────────────────────┤
│ L3  Network — tambah header IP                          │
│     ┌───────┬────────┬──────────────────┐               │
│     │ IP hdr│ TCP hdr│      DATA        │  = PACKET     │
│     └───────┴────────┴──────────────────┘               │
├─────────────────────────────────────────────────────────┤
│ L2  Data Link — tambah header Ethernet + trailer FCS    │
│     ┌───────┬───────┬────────┬──────┬─────┐             │
│     │Eth hdr│ IP hdr│ TCP hdr│ DATA │ FCS │  = FRAME    │
│     └───────┴───────┴────────┴──────┴─────┘             │
├─────────────────────────────────────────────────────────┤
│ L1  Physical — ubah menjadi sinyal                      │
│     10110100101110100101110010110101...   = BITS        │
└─────────────────────────────────────────────────────────┘
```

Hanya layer 2 yang menambahkan **trailer** (FCS untuk deteksi error). Layer lain hanya menambahkan header.

### Ukuran nyata

```
Data aplikasi (HTTP GET)     :   ~500 byte
+ Header TCP                 :     20 byte  (bisa 20–60 dengan options)
+ Header IPv4                :     20 byte  (bisa 20–60 dengan options)
+ Header Ethernet            :     14 byte
+ FCS                        :      4 byte
─────────────────────────────────────────
Total di kabel               :    558 byte
```

Ditambah di layer fisik (tidak dihitung sebagai bagian frame): preamble 7 byte + SFD 1 byte + interframe gap setara 12 byte.

---

## 3. Dekapsulasi di Penerima

Kebalikannya, dari bawah ke atas:

```
L1 → menerima sinyal, merangkainya menjadi bit
L2 → memeriksa FCS. Rusak? BUANG.
     Memeriksa MAC tujuan. Bukan untuk saya (dan bukan broadcast/multicast
     yang saya ikuti)? BUANG.
     Membaca EtherType (0x0800 = IPv4) → serahkan ke IP
L3 → memeriksa checksum header IP (IPv4)
     Memeriksa IP tujuan. Bukan untuk saya? → route atau buang
     Membaca field Protocol (6 = TCP) → serahkan ke TCP
L4 → memeriksa checksum TCP
     Membaca port tujuan (443) → serahkan ke proses yang listening di port itu
L7 → aplikasi memproses data
```

Setiap layer melakukan hal yang sama: buka header saya, periksa validitas, lihat penanda protokol berikutnya, serahkan sisanya ke atas.

### Field penanda "protokol berikutnya"

Ini yang membuat dekapsulasi berantai bekerja:

| Layer | Field | Contoh nilai |
|---|---|---|
| Ethernet | **EtherType** | `0x0800` = IPv4, `0x0806` = ARP, `0x86DD` = IPv6, `0x8100` = VLAN tag |
| IPv4 | **Protocol** | 1 = ICMP, 6 = TCP, 17 = UDP, 47 = GRE, 50 = ESP, 89 = OSPF |
| IPv6 | **Next Header** | sama seperti di atas, plus extension header |
| TCP/UDP | **Port tujuan** | 80 = HTTP, 443 = HTTPS, 53 = DNS, 22 = SSH |

> [!TIP]
> Rantai ini yang Anda baca saat menganalisis paket: EtherType → Protocol → Port. Kalau salah satunya tidak sesuai harapan, di situlah anomalinya.

---

## 4. Yang Berubah dan Tidak Berubah di Setiap Hop

Pemula paling sering salah memahami konsep ini. Hafalkan tabelnya:

| Field | Berubah tiap hop? | Kenapa |
|---|---|---|
| **MAC sumber** | **Ya** | Diganti dengan MAC interface router yang mengirim |
| **MAC tujuan** | **Ya** | Diganti dengan MAC next hop |
| **IP sumber** | Tidak | Identitas pengirim asli (kecuali NAT) |
| **IP tujuan** | Tidak | Identitas penerima akhir (kecuali NAT) |
| **TTL** | **Ya** | Dikurangi 1 oleh setiap router |
| **Checksum header IP** | **Ya** | Dihitung ulang karena TTL berubah (IPv4 saja) |
| **Port sumber/tujuan** | Tidak | Kecuali PAT/NAT |
| **Data aplikasi** | Tidak | Kecuali proxy/inspeksi |

Kalimat yang layak dihafal:

> **IP address = ke mana paket ini akhirnya pergi. MAC address = ke mana paket ini pergi berikutnya.**

Analogi pos: alamat rumah tujuan (IP) ditulis di paket dan tidak berubah. Tetapi "truk mana yang membawa sekarang" (MAC) berubah di setiap kota transit.

---

## 5. Perjalanan Lengkap: Mengetik `https://example.com`

Skenario:
```
[PC Anda]───[Switch]───[Router/GW]───[ISP]───...internet...───[Server example.com]
192.168.1.50            192.168.1.1                            93.184.216.34
MAC: aa:aa:aa:aa:aa:aa   MAC: bb:bb:bb:bb:bb:bb
```

### Fase 1: Persiapan Lokal

**Langkah 1. Browser mengurai URL.**
```
https://example.com  →  skema: https (port default 443)
                        host: example.com
                        path: /
```

**Langkah 2. Cek cache DNS.**
Browser memeriksa cache internalnya, lalu cache OS, lalu file `hosts`. Kalau ada dan belum kedaluwarsa (TTL), lompat ke Langkah 8.

**Langkah 3. PC perlu bertanya ke server DNS.**
Server DNS misalnya `192.168.1.1` (didapat dari DHCP).

**Langkah 4. PC menentukan: DNS server lokal atau jauh?**
```
IP saya      : 192.168.1.50
Mask         : 255.255.255.0
Network saya : 192.168.1.50 AND 255.255.255.0 = 192.168.1.0

IP tujuan    : 192.168.1.1
Network tujuan: 192.168.1.1 AND 255.255.255.0 = 192.168.1.0

SAMA → tujuan ada di jaringan lokal → kirim langsung, tidak lewat gateway
```

Ini operasi **AND** yang Anda pelajari di `00-fondasi/02`. Setiap host melakukan ini untuk setiap paket keluar.

**Langkah 5. PC perlu MAC address dari 192.168.1.1 → ARP.**
```
Cek ARP cache. Tidak ada?
Broadcast ARP Request:
  MAC tujuan : ff:ff:ff:ff:ff:ff   (broadcast — semua dengar)
  "Siapa yang punya 192.168.1.1? Beritahu 192.168.1.50"

Switch membanjiri (flood) ke semua port dalam VLAN itu.
Router menjawab (unicast) ARP Reply:
  "192.168.1.1 ada di bb:bb:bb:bb:bb:bb"

PC menyimpannya di ARP cache (biasanya beberapa menit).
```

**Langkah 6. Kirim query DNS.**
```
L7  : DNS Query "A record untuk example.com?"
L4  : UDP, port sumber 54321 (acak), port tujuan 53
L3  : IP sumber 192.168.1.50, IP tujuan 192.168.1.1
L2  : MAC sumber aa:aa.., MAC tujuan bb:bb..
L1  : bit ke kabel
```

**Langkah 7. Jawaban DNS kembali.**
Kalau resolver belum tahu, ia melakukan resolusi rekursif: root server → TLD `.com` → authoritative server `example.com`. Detail penuh di `06-aplikasi/01`.
```
Jawaban: example.com = 93.184.216.34 (TTL 3600)
```

### Fase 2: Menghubungi Server

**Langkah 8. PC menentukan: tujuan lokal atau jauh?**
```
IP tujuan     : 93.184.216.34
Network tujuan: 93.184.216.34 AND 255.255.255.0 = 93.184.216.0
Network saya  : 192.168.1.0

BERBEDA → tujuan JAUH → kirim ke default gateway
```

> [!WARNING]
> **Titik kritis yang harus benar-benar dipahami:**
```
IP tujuan di paket  = 93.184.216.34   (tujuan akhir)
MAC tujuan di frame = bb:bb:bb:bb:bb:bb  (MAC ROUTER, bukan MAC server!)
```
PC tidak akan pernah tahu MAC address server example.com, dan memang tidak perlu tahu. Ia hanya perlu MAC hop berikutnya.

**Langkah 9. TCP three-way handshake.**
```
PC  → Server : SYN,     seq=x
Server → PC  : SYN-ACK, seq=y, ack=x+1
PC  → Server : ACK,     ack=y+1
```
Tiga paket ini masing-masing melalui seluruh proses enkapsulasi/dekapsulasi dan seluruh rantai router. Butuh **1 RTT** sebelum data pertama bisa dikirim.

**Langkah 10. TLS handshake.**
```
PC  → Server : ClientHello (versi TLS, cipher suites, SNI="example.com")
Server → PC  : ServerHello + Certificate + parameter kunci
PC          : verifikasi sertifikat (chain ke root CA, tanggal, nama, revocation)
PC ↔ Server : menurunkan kunci sesi bersama
```
TLS 1.3 menyelesaikan ini dalam **1 RTT** (TLS 1.2 butuh 2 RTT).

**Langkah 11. Kirim HTTP request (terenkripsi).**
```
GET / HTTP/2
Host: example.com
User-Agent: ...
```
Isi ini dienkripsi; router di tengah hanya melihat "data TCP acak" ke port 443.

### Fase 3: Perjalanan Melintasi Jaringan

**Langkah 12. Di switch lokal.**
```
1. Terima frame di port 5
2. Catat: MAC aa:aa:aa:aa:aa:aa ada di port 5  (MAC learning)
3. Cari MAC tujuan bb:bb:bb:bb:bb:bb di MAC address table
4. Ada di port 24 → teruskan HANYA ke port 24
5. Frame TIDAK diubah sama sekali
```
Switch bekerja murni di layer 2. Ia tidak membuka header IP.

**Langkah 13. Di router (hop pertama).**
```
1. Terima frame. FCS valid? Ya.
2. MAC tujuan = MAC saya? Ya → dekapsulasi, buang header Ethernet
3. Baca header IP: tujuan 93.184.216.34
4. TTL 64 → kurangi jadi 63. TTL = 0? Tidak → lanjut
   (kalau 0: buang paket, kirim ICMP Time Exceeded)
5. Cari di routing table dengan LONGEST PREFIX MATCH:
      93.184.216.0/24  via ...   ← tidak ada
      93.0.0.0/8       via ...   ← tidak ada
      0.0.0.0/0        via 203.0.113.1  ← COCOK (default route)
6. Next hop = 203.0.113.1 lewat interface WAN
7. Hitung ulang checksum header IP (karena TTL berubah)
8. Cari MAC dari 203.0.113.1 (ARP kalau perlu)
9. Bungkus ULANG dengan header Ethernet BARU:
      MAC sumber  = MAC interface WAN router
      MAC tujuan  = MAC router ISP
10. Kirim
```

Pada langkah 9, header L2 dibuat baru sepenuhnya. Header L3 dan seterusnya tetap (kecuali TTL & checksum).

**Langkah 14. NAT (kalau ada).**
Di router rumah/kantor:
```
Sebelum : 192.168.1.50:51234 → 93.184.216.34:443
Sesudah : 203.0.113.77:61001 → 93.184.216.34:443

Tabel NAT mencatat pemetaan agar balasan bisa dikembalikan.
```
Ini satu-satunya hal yang mengubah IP sumber di tengah jalan. Detail di `09-nat-acl-firewall/01`.

**Langkah 15. Melintasi banyak router (10-20 hop tipikal).**
Setiap router mengulang Langkah 13:
```
Router ISP     → TTL 62, header L2 baru
Router regional→ TTL 61, header L2 baru
Router IXP     → TTL 60, header L2 baru
Router transit → TTL 59, header L2 baru (mungkin lintas benua)
...
Router hosting → TTL 52, header L2 baru
```

Lihat sendiri:
```bash
$ traceroute -n example.com
```
Setiap baris = satu router yang mengurangi TTL.

**Langkah 16. Sampai di jaringan server.**
```
Load balancer / firewall → mungkin mengubah tujuan (DNAT) ke server backend
Server menerima frame, dekapsulasi sampai L7
```

### Fase 4: Respons Kembali

**Langkah 17. Server menyusun balasan.**
```
HTTP/2 200 OK
Content-Type: text/html
...isi halaman...
```

**Langkah 18. Balasan menempuh jalur pulang.**
- Bisa lewat jalur berbeda dari jalur pergi (asymmetric routing). Ini normal di internet.
- IP sumber/tujuan ditukar: `93.184.216.34:443 → 203.0.113.77:61001`.
- Router NAT mencocokkan port 61001 ke `192.168.1.50:51234` dan menulis ulang tujuan.

**Langkah 19. PC menerima, merakit, mendekripsi, merender.**
Browser mengurai HTML, menemukan referensi ke CSS/JS/gambar, dan mengulang seluruh proses ini untuk setiap sumber daya (sering ke domain berbeda → DNS lookup lagi).

---

## 6. Hitungan Waktu Nyata

Untuk memuat satu halaman sederhana dengan RTT 20 ms:

| Tahap | RTT | Waktu |
|---|---|---|
| DNS lookup (cache miss) | 1-2 | 20-40 ms |
| TCP handshake | 1 | 20 ms |
| TLS 1.3 handshake | 1 | 20 ms |
| HTTP request → byte pertama | 1 | 20 ms |
| **Total sebelum byte pertama** | **4-5** | **80-100 ms** |

Ini menjelaskan banyak hal:
- DNS caching penting karena menghemat 1 RTT penuh.
- Keep-alive penting karena menghindari handshake berulang.
- TLS 1.3 lebih cepat karena menghemat 1 RTT dibanding TLS 1.2.
- QUIC/HTTP/3 dibuat untuk menggabungkan handshake transport & kripto menjadi 1 RTT, bahkan 0-RTT untuk kunjungan berulang.
- CDN bekerja karena memangkas RTT. Memotong RTT dari 200 ms menjadi 10 ms mengubah semua angka di tabel.

---

## 7. Enkapsulasi Bertingkat (Tunneling)

Saat memakai VPN, enkapsulasi terjadi dua kali:

```
┌────────────────────────────────────────────────────────────────┐
│ Eth │ IP luar │ UDP │ WireGuard │ IP dalam │ TCP │ DATA │ FCS  │
└────────────────────────────────────────────────────────────────┘
  ↑     ↑              ↑            ↑
  │     │              │            └── paket ASLI (terenkripsi)
  │     │              └── header tunnel
  │     └── IP publik: dari Anda ke server VPN
  └── frame di jaringan lokal Anda
```

Konsekuensi praktis yang wajib Anda ingat: overhead tunnel mengurangi MTU efektif.

```
MTU Ethernet          : 1500
− IP luar             :   20
− UDP                 :    8
− WireGuard           :   32
────────────────────────────
MTU di dalam tunnel   : 1440
```

Kalau MTU tidak disesuaikan, paket besar akan terfragmentasi atau hilang diam-diam (MTU black hole): SSH tersambung, tapi `ls` di direktori besar menggantung. Ini salah satu masalah VPN paling umum. Solusinya di `11-wan-vpn/02` (MSS clamping).

Contoh overhead tunnel lain:
| Tunnel | Overhead | MTU dalam (dari 1500) |
|---|---|---|
| GRE | 24 | 1476 |
| IPsec ESP (tunnel, AES) | ~56-73 | ~1427-1444 |
| WireGuard | 60 (IPv4) | 1440 |
| VXLAN | 50 | 1450 |
| PPPoE | 8 | 1492 |

---

## 8. Praktik: Buktikan Sendiri

### Lihat enkapsulasi lengkap
```bash
$ sudo tcpdump -ni any -e -vvv -c 5 'port 443'
```
Opsi `-e` menampilkan header Ethernet (MAC).

### Buktikan MAC berubah, IP tidak
```bash
# 1. Lihat MAC gateway Anda
$ ip neigh show
192.168.1.1 dev eth0 lladdr bb:bb:bb:bb:bb:bb REACHABLE

# 2. Capture paket ke server jauh
$ sudo tcpdump -ni eth0 -e -c 2 'host 1.1.1.1'
```
Anda akan melihat: **MAC tujuan = MAC gateway**, tetapi **IP tujuan = 1.1.1.1**. Inilah bukti langsung dari konsep di §4.

### Lihat TTL berkurang
```bash
$ traceroute -n 1.1.1.1
$ ping -c 1 -t 1 1.1.1.1     # TTL=1 → pasti kena Time Exceeded di hop pertama
```

### Lihat urutan lengkap koneksi HTTPS
```bash
$ curl -w "\ndns:%{time_namelookup}s connect:%{time_connect}s tls:%{time_appconnect}s ttfb:%{time_starttransfer}s total:%{time_total}s\n" -o /dev/null -s https://example.com
```
Angkanya akan mencerminkan tabel di §6.

---

## 9. Kesalahan Umum

> [!WARNING]
> **1. Mengira PC tahu MAC address server jauh.** Tidak. PC hanya tahu MAC hop berikutnya.

> [!WARNING]
> **2. Mengira IP berubah tiap hop.** Tidak, kecuali NAT.

> [!WARNING]
> **3. Lupa ARP diperlukan sebelum paket pertama.** Kalau ARP gagal, tidak ada paket yang bisa keluar, walau routing sempurna.

> [!WARNING]
> **4. Mengabaikan MTU di tunnel.** Penyebab utama "koneksi jalan tapi transfer besar macet".

> [!WARNING]
> **5. Mengira jalur pergi = jalur pulang.** Sering berbeda. Penting saat menganalisis firewall stateful & traceroute.

> [!WARNING]
> **6. Mengira switch membaca IP.** Switch L2 tidak. Ia hanya membaca MAC (dan header VLAN).

---

## 10. Ringkasan

- Enkapsulasi menambahkan header dari atas ke bawah; dekapsulasi membukanya dari bawah ke atas.
- Hanya L2 yang menambahkan trailer (FCS).
- Rantai penanda protokol: **EtherType → Protocol → Port**.
- **MAC berubah tiap hop; IP tidak** (kecuali NAT). TTL berkurang tiap hop.
- Sebelum mengirim, host selalu melakukan AND untuk memutuskan: lokal (kirim langsung) atau jauh (kirim ke gateway).
- ARP diperlukan untuk mendapatkan MAC hop berikutnya.
- Router: dekapsulasi L2 → cek TTL → longest prefix match → enkapsulasi L2 baru.
- Memuat halaman butuh 4-5 RTT sebelum byte pertama; inilah alasan DNS cache, keep-alive, TLS 1.3, QUIC, dan CDN ada.
- Tunneling = enkapsulasi bertingkat → MTU efektif berkurang → wajib disesuaikan.

---

## 11. Latihan

1. PC A (192.168.1.10/24) mengirim ke server 8.8.8.8. Apa isi MAC tujuan pada frame yang keluar dari PC A?
2. Paket melewati 12 router. Berapa nilai TTL saat tiba, jika berangkat dengan TTL 64?
3. Jelaskan mengapa checksum header IPv4 harus dihitung ulang di setiap router, tetapi checksum TCP tidak.
4. Urutkan proses ini: ARP Request, TCP SYN, DNS Query, TLS ClientHello, HTTP GET.
5. Anda memakai VPN WireGuard. `ping` ke server berhasil, `ssh` tersambung, tetapi `scp` file besar menggantung. Apa dugaan Anda dan bagaimana membuktikannya?
6. Sebuah frame tiba di switch dengan MAC tujuan yang tidak ada di MAC address table. Apa yang dilakukan switch?
7. Dalam tunnel VXLAN (overhead 50 byte), berapa MTU efektif jika MTU fisik 1500? Apa yang biasanya dilakukan operator data center untuk menghindari masalah ini?

<details>
<summary>Jawaban</summary>

1. **MAC address dari default gateway** (router), bukan MAC 8.8.8.8. Karena 8.8.8.8 berada di luar jaringan lokal 192.168.1.0/24, PC A mengirimkan frame ke gateway. IP tujuan di dalam paket tetap 8.8.8.8.

2. **TTL 52.** Setiap router mengurangi 1: 64 − 12 = 52.

3. Checksum header IPv4 hanya mencakup **header IP**, dan field TTL di dalamnya berubah di setiap router, jadi checksum harus dihitung ulang. Checksum TCP mencakup header TCP + data + pseudo-header (IP sumber, IP tujuan, protokol, panjang). Semuanya **tidak berubah** dalam transit normal, jadi tidak perlu dihitung ulang. (Pengecualian: perangkat NAT mengubah IP/port sehingga harus memperbarui checksum TCP juga.)

4. **DNS Query** (perlu tahu IP dulu) → **ARP Request** (perlu MAC gateway; sebenarnya ARP terjadi lebih dulu jika resolver DNS-nya juga di luar host, tetapi dalam urutan logis yang diminta: setelah tahu IP tujuan, host perlu MAC next hop) → **TCP SYN** → **TLS ClientHello** → **HTTP GET**.
   Catatan: jika ARP cache kosong, ARP Request untuk gateway sebenarnya terjadi sebelum DNS Query dapat dikirim keluar.

5. **MTU black hole.** Paket kecil (ping, keystroke SSH) muat; paket besar (transfer data scp) melebihi MTU tunnel dan dibuang tanpa pemberitahuan, biasanya karena ICMP "Fragmentation Needed" diblokir sehingga PMTUD gagal.
   Pembuktian: `ping -M do -s 1400 <tujuan>` lalu turunkan ukurannya sampai berhasil. Cara ini menemukan MTU efektif. Perbaikan: set MTU interface WireGuard (mis. 1420) atau terapkan MSS clamping.

6. Switch melakukan **flooding**: mengirimkan frame itu ke **semua port dalam VLAN yang sama**, kecuali port asalnya. Ini disebut *unknown unicast flooding*. Saat tujuan menjawab, switch mempelajari lokasinya dan tidak perlu flooding lagi.

7. MTU efektif = 1500 − 50 = **1450 byte**. Praktik standar operator data center: menaikkan MTU fisik pada underlay menjadi **jumbo frame (9000 atau minimal 1550-1600)** sehingga overlay tetap bisa membawa payload 1500 byte penuh tanpa fragmentasi.

</details>

---

## 12. Sumber

- RFC 791: Internet Protocol (TTL, checksum, fragmentasi)
- RFC 826: Address Resolution Protocol (ARP)
- RFC 9293: Transmission Control Protocol (handshake)
- RFC 8446: TLS 1.3 (handshake 1-RTT)
- RFC 1191 & 8899: Path MTU Discovery
- "What happens when you type google.com": https://github.com/alex/what-happens-when

---

**Berikutnya:** `02-layer-fisik/01-media-transmisi.md`. Memulai perjalanan dari lapisan paling bawah.

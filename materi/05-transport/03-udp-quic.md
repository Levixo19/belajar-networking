# 05.3 UDP dan QUIC

> **Prasyarat:** `05-transport/02`
> **Tujuan:** Anda tahu kapan UDP lebih tepat daripada TCP, dan memahami mengapa QUIC/HTTP3 menjadi transport modern.

---

## 1. UDP (User Datagram Protocol)

UDP [RFC 768] adalah protokol transport paling sederhana yang mungkin dibuat: ia hanya menambahkan **port** dan **checksum** di atas IP.

### Header UDP: hanya 8 byte

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |       Destination Port        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|            Length             |           Checksum            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

Bandingkan dengan TCP yang minimal 20 byte dan bisa 60 byte.

| Field | Fungsi |
|---|---|
| Source Port | Port pengirim (boleh 0 kalau tidak mengharapkan balasan) |
| Destination Port | Port tujuan |
| Length | Panjang header + data (minimum 8) |
| Checksum | Opsional di IPv4, **wajib di IPv6** |

### Yang TIDAK dilakukan UDP

```
❌ Tidak ada handshake       → tidak ada koneksi
❌ Tidak ada acknowledgment  → tidak tahu apakah sampai
❌ Tidak ada retransmisi     → paket hilang, hilang selamanya
❌ Tidak ada pengurutan      → paket bisa tiba tidak berurutan
❌ Tidak ada flow control    → bisa membanjiri penerima
❌ Tidak ada congestion control → bisa membanjiri jaringan
```

Ini terdengar seperti daftar kelemahan. Tetapi justru inilah kekuatannya.

### Kenapa memilih UDP

**1. Latency lebih rendah**
Tidak ada handshake (hemat 1 RTT), tidak ada menunggu retransmisi.

**2. Untuk data real-time, terlambat = tidak berguna**
```
Panggilan VoIP: paket suara hilang di detik ke-5
TCP  → mengirim ulang → tiba di detik ke-5,3 → SUDAH TERLAMBAT,
       dan menahan semua suara setelahnya (head-of-line blocking)
       → hasilnya: suara terputus lebih parah
UDP  → hilang ya sudah → codec menyembunyikannya dengan interpolasi
       → hasilnya: sedikit gangguan, tetapi percakapan lanjut
```

**3. Overhead lebih kecil**
8 byte vs 20+ byte. Untuk paket VoIP dengan payload 20 byte, ini berarti perbedaan besar.

**4. Mendukung broadcast dan multicast**
TCP hanya bisa unicast (butuh koneksi). UDP bisa dikirim ke banyak penerima sekaligus.

**5. Cocok untuk transaksi request-response tunggal**
DNS query cukup satu paket pergi dan satu paket balik. Membangun koneksi TCP untuk itu adalah pemborosan 1 RTT penuh.

**6. Kontrol penuh di aplikasi**
Aplikasi bisa membangun mekanisme keandalannya sendiri yang lebih cocok — inilah yang dilakukan QUIC.

### Yang memakai UDP

| Aplikasi | Kenapa UDP |
|---|---|
| **DNS** (53) | Satu query, satu jawaban — TCP terlalu mahal |
| **DHCP** (67/68) | Broadcast; klien belum punya IP |
| **NTP** (123) | Satu pertukaran; keterlambatan merusak akurasi |
| **SNMP** (161/162) | Banyak query kecil; kehilangan bisa ditoleransi |
| **Syslog** (514) | Fire-and-forget; tidak boleh memblokir aplikasi |
| **TFTP** (69) | Sederhana, punya mekanisme ACK sendiri |
| **RTP/RTCP** (media) | Real-time; terlambat = tidak berguna |
| **VoIP** | Sama |
| **Video streaming langsung** | Sama |
| **Game online** | Latency kritis; posisi lama tidak berguna |
| **VXLAN** (4789) | Tunneling — keandalan ditangani payload |
| **IPsec NAT-T** (4500) | Enkapsulasi |
| **WireGuard** (51820) | Enkapsulasi VPN |
| **QUIC / HTTP3** (443) | Membangun keandalan sendiri di atas UDP |

### Perbandingan TCP vs UDP

| | TCP | UDP |
|---|---|---|
| Koneksi | Connection-oriented | Connectionless |
| Keandalan | Dijamin | Tidak |
| Urutan | Dijaga | Tidak |
| Header | 20-60 byte | **8 byte** |
| Handshake | 3-way (1 RTT) | Tidak ada |
| Flow control | Ya | Tidak |
| Congestion control | Ya | Tidak (aplikasi harus sendiri) |
| Broadcast/multicast | Tidak | **Ya** |
| Batas pesan | Tidak (stream) | **Ya** (datagram) |
| Kecepatan | Lebih lambat | Lebih cepat |
| Analogi | Surat tercatat | Kartu pos |

> [!TIP]
> **UDP menjaga batas pesan** — satu `sendto()` = satu `recvfrom()`. Ini keuntungan yang sering dilupakan; dengan TCP, aplikasi harus membuat framingnya sendiri.

---

## 2. Bahaya UDP: Amplification Attack

Karena UDP tidak ada handshake, **alamat sumber mudah dipalsukan** (spoofing). Ini dieksploitasi untuk serangan DDoS.

```
Penyerang mengirim query kecil dengan IP sumber PALSU (= korban)
Server menjawab dengan respons BESAR ke korban

Amplification factor:
  DNS (ANY query)    : 28–54×
  NTP (monlist)      : hingga 556×
  memcached          : hingga 51.000×
  SSDP               : 30×
  CLDAP              : 56–70×
```

Penyerang dengan 1 Mbps bisa menghasilkan 50 Gbps trafik ke korban lewat memcached.

**Mitigasi:**
1. **BCP 38 / uRPF** — ISP memfilter paket dengan alamat sumber palsu di sumbernya (`12-keamanan/03`).
2. **Rate limiting** pada layanan UDP publik.
3. **Nonaktifkan fitur berisiko** (NTP `monlist`, DNS `ANY`, memcached dari internet).
4. **DNS Response Rate Limiting (RRL)**.
5. Jangan pernah mengekspos memcached/Redis ke internet.

> [!WARNING]
> Ini alasan penting mengapa **UDP sering dibatasi ketat di firewall perusahaan** — dan sebabnya QUIC kadang diblokir.

---

## 3. QUIC (Transport Modern)

**QUIC** [RFC 9000] adalah protokol transport yang berjalan **di atas UDP**, tetapi menyediakan semua yang TCP berikan — plus lebih banyak.

### Mengapa QUIC dibuat

Google mengukur tiga masalah TCP+TLS yang tidak bisa diperbaiki secara inkremental:

**1. Terlalu banyak round-trip sebelum data pertama**
```
TCP handshake     : 1 RTT
TLS 1.2 handshake : 2 RTT
─────────────────────────
Total             : 3 RTT sebelum HTTP request pertama

Dengan RTT 100 ms → 300 ms terbuang setiap koneksi baru
```

**2. Head-of-line blocking di TCP**
```
HTTP/2 memultipleks banyak stream dalam SATU koneksi TCP.
Satu paket TCP hilang → SELURUH stream berhenti menunggu retransmisi,
walaupun stream lain datanya sudah lengkap.

→ HTTP/2 di jaringan dengan loss bisa lebih lambat daripada HTTP/1.1
```

**3. Perubahan TCP tidak bisa di-deploy**
TCP diimplementasikan di **kernel** OS. Perubahan butuh update sistem operasi di miliaran perangkat, plus middlebox yang membuang opsi TCP yang tidak dikenalnya (**ossification**).

### Solusi QUIC

```
┌────────────────────────────────────────────────────┐
│                    HTTP/3                          │
├────────────────────────────────────────────────────┤
│                    QUIC                            │
│   ┌──────────────────────────────────────────┐    │
│   │ Stream multiplexing (independen)          │    │
│   │ Loss recovery & congestion control        │    │
│   │ TLS 1.3 TERINTEGRASI (wajib)              │    │
│   │ Connection ID (independen dari IP/port)   │    │
│   └──────────────────────────────────────────┘    │
├────────────────────────────────────────────────────┤
│                    UDP                             │
├────────────────────────────────────────────────────┤
│                     IP                             │
└────────────────────────────────────────────────────┘
```

### Keunggulan QUIC

**1. Handshake 1 RTT (atau 0-RTT)**
```
QUIC menggabungkan handshake transport dan kripto:
  Koneksi baru      : 1 RTT
  Koneksi berulang  : 0 RTT (langsung kirim data!)

vs TCP+TLS 1.3 = 2 RTT, TCP+TLS 1.2 = 3 RTT
```

> [!WARNING]
> 0-RTT punya risiko **replay attack** — data 0-RTT bisa diputar ulang penyerang. Karena itu hanya boleh untuk request idempoten (GET), bukan POST yang mengubah state.

**2. Tidak ada head-of-line blocking antar-stream**
```
Setiap stream dalam QUIC punya loss recovery SENDIRI.
Paket hilang di stream 3 → hanya stream 3 yang menunggu.
Stream 1, 2, 4 terus mengalir.
```

**3. Connection migration**
QUIC mengidentifikasi koneksi dengan **Connection ID**, bukan 5-tuple.
```
Ponsel berpindah dari Wi-Fi ke seluler:
  TCP  → IP berubah → koneksi PUTUS → harus handshake ulang
  QUIC → Connection ID sama → koneksi BERLANJUT tanpa terputus
```
Ini keunggulan besar untuk perangkat bergerak.

**4. Enkripsi wajib dan menyeluruh**
Hampir seluruh header QUIC dienkripsi (bukan hanya payload). Middlebox tidak bisa membaca atau memodifikasinya → mencegah **ossification** dan memungkinkan protokol berevolusi.

**5. Diimplementasikan di user space**
Bukan di kernel. Browser dan server bisa memperbarui QUIC dengan update aplikasi biasa — iterasi jauh lebih cepat.

**6. Loss recovery yang lebih baik**
Nomor paket QUIC **selalu bertambah** (tidak dipakai ulang saat retransmisi), sehingga tidak ada ambiguitas RTT seperti pada TCP (yang butuh Karn's algorithm).

### Kelemahan dan tantangan QUIC

> [!WARNING]
> **1. Konsumsi CPU lebih tinggi.** Karena berjalan di user space dan mengenkripsi lebih banyak, QUIC memakai CPU lebih besar daripada TCP yang dioptimasi kernel (walaupun terus membaik dengan offload dan optimasi).

> [!WARNING]
> **2. Diblokir sebagian jaringan.** Banyak firewall perusahaan memblokir UDP/443. Klien akan **fallback ke TCP** — tetapi itu berarti percobaan yang terbuang dan latency tambahan.

> [!WARNING]
> **3. Sulit di-troubleshoot.** Trafiknya terenkripsi hampir seluruhnya; tidak bisa dianalisis dengan cara yang sama seperti TCP. Butuh kunci sesi (`SSLKEYLOGFILE`) untuk dekripsi di Wireshark.

> [!WARNING]
> **4. Middlebox lama tidak mengenalinya.** Beberapa perangkat menganggap UDP/443 mencurigakan.

### Keluarga RFC QUIC

| RFC | Isi |
|---|---|
| **8999** | Version-independent properties |
| **9000** | QUIC: transport protocol (inti) |
| **9001** | Menggunakan TLS untuk mengamankan QUIC |
| **9002** | Loss detection & congestion control |
| **9114** | **HTTP/3** |
| **9204** | QPACK (kompresi header untuk HTTP/3) |
| **9369** | QUIC versi 2 |

---

## 4. HTTP/3

HTTP/3 adalah HTTP yang berjalan di atas QUIC.

### Evolusi HTTP

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|---|---|---|
| Transport | TCP | TCP | **QUIC (UDP)** |
| Format | Teks | Biner | Biner |
| Multiplexing | Tidak (butuh banyak koneksi) | Ya | Ya |
| HOL blocking | Ya (per koneksi) | **Ya (di TCP)** | **Tidak** |
| Kompresi header | Tidak | HPACK | QPACK |
| Enkripsi | Opsional | Praktis wajib | **Wajib** |
| Handshake | 1-3 RTT | 2-3 RTT | **1 RTT / 0-RTT** |

### Bagaimana browser menemukan HTTP/3

```
1. Browser terhubung lewat HTTPS (TCP) seperti biasa
2. Server mengirim header:
     Alt-Svc: h3=":443"; ma=86400
   → "saya juga melayani HTTP/3 di port 443 UDP"
3. Browser mencatatnya, dan pada kunjungan BERIKUTNYA mencoba QUIC dulu
4. Kalau QUIC gagal (diblokir), fallback ke TCP
```

Beberapa klien memakai **Happy Eyeballs untuk QUIC** — mencoba QUIC dan TCP secara paralel, memakai yang lebih dulu berhasil.

### Implikasi untuk network engineer

> [!WARNING]
> **Ini yang harus Anda putuskan di jaringan perusahaan:**

**Kalau mengizinkan UDP/443:**
- **Benar:** Pengguna mendapat kinerja lebih baik
- **Hindari:** Tidak bisa melakukan TLS inspection dengan perangkat lama (banyak yang belum mendukung QUIC)
- **Hindari:** Visibilitas berkurang untuk DLP/IPS

**Kalau memblokir UDP/443:**
- **Benar:** Semua trafik web kembali ke TCP → bisa diinspeksi seperti biasa
- **Hindari:** Latency sedikit lebih tinggi
- **Hindari:** Ada delay saat browser mencoba QUIC lalu fallback

> [!TIP]
> **Praktik yang lazim saat ini:** blokir UDP/443 di jaringan yang membutuhkan inspeksi mendalam, izinkan di jaringan tamu/umum. Tetapi ini akan berubah seiring perangkat keamanan mendukung QUIC.

```
# Memblokir QUIC (Cisco)
R1(config)# ip access-list extended BLOCK-QUIC
R1(config-ext-nacl)# deny udp any any eq 443
R1(config-ext-nacl)# permit ip any any
```

```bash
# nftables
$ sudo nft add rule inet filter forward udp dport 443 drop
```

---

## 5. Praktik

### Melihat trafik UDP dan QUIC
```bash
# UDP umum
$ sudo tcpdump -ni any udp -v

# DNS
$ sudo tcpdump -ni any 'udp port 53' -v

# QUIC / HTTP3
$ sudo tcpdump -ni any 'udp port 443'

# Uji apakah situs mendukung HTTP/3
$ curl -I --http3 https://cloudflare.com
$ curl -sI https://www.google.com | grep -i alt-svc
alt-svc: h3=":443"; ma=2592000

# Bandingkan waktu HTTP/2 vs HTTP/3
$ curl -o /dev/null -s -w 'http2: %{time_total}s\n' --http2 https://cloudflare.com
$ curl -o /dev/null -s -w 'http3: %{time_total}s\n' --http3 https://cloudflare.com
```

### Menguji UDP
```bash
# iperf3 mode UDP — mengukur loss dan jitter
$ iperf3 -c server -u -b 100M -t 30
[ ID] Interval    Transfer   Bitrate      Jitter    Lost/Total
[  5] 0.00-30.00  357 MBytes 99.9 Mbits/s 0.089 ms  12/258402 (0.0046%)

# Kirim data UDP manual
$ echo "test" | nc -u host 9999
$ nc -ul 9999                      # listener UDP

# Cek apakah port UDP terbuka (kurang andal)
$ nmap -sU -p 53,123,161 host
```

### Wireshark
```
udp                          ← semua UDP
quic                         ← trafik QUIC
quic.header_form == 1        ← long header (handshake)
dns                          ← DNS
rtp                          ← media real-time

# Dekripsi QUIC: set SSLKEYLOGFILE sebelum menjalankan browser
$ export SSLKEYLOGFILE=~/quic-keys.log
$ google-chrome
# Wireshark → Preferences → Protocols → TLS → (Pre)-Master-Secret log filename
```

---

## 6. Kapan Memilih Apa

```
Butuh SEMUA data sampai dengan benar          → TCP
Butuh kecepatan real-time, data lama tidak
  berguna                                      → UDP
Butuh broadcast/multicast                      → UDP
Transaksi kecil request-response tunggal       → UDP
Butuh keandalan TAPI juga latency rendah dan
  multiplexing                                 → QUIC
Aplikasi web modern                            → HTTP/3 (QUIC)
Melewati firewall yang ketat                   → TCP (paling diizinkan)
Membuat protokol tunneling                     → UDP (enkapsulasi sederhana)
```

---

## 7. Ringkasan

- **UDP** hanya menambahkan port + checksum (8 byte). Tanpa handshake, keandalan, urutan, atau kontrol apa pun.
- UDP dipilih karena: **latency rendah**, overhead kecil, mendukung broadcast/multicast, menjaga **batas pesan**, dan memberi kontrol penuh ke aplikasi.
- Untuk real-time, **data yang terlambat tidak berguna** — retransmisi TCP justru merugikan.
- **Perhatian:** UDP rentan **spoofing dan amplification attack** (DNS 54×, NTP 556×, memcached 51.000×). Mitigasi: BCP 38/uRPF, rate limiting, nonaktifkan fitur berisiko.
- **QUIC** (RFC 9000) berjalan di atas UDP dan menyediakan keandalan + TLS 1.3 + multiplexing.
- Keunggulan QUIC: **1 RTT / 0-RTT**, **tanpa head-of-line blocking antar-stream**, **connection migration** (Connection ID), enkripsi menyeluruh (anti-ossification), di user space (mudah diperbarui).
- **HTTP/3** = HTTP di atas QUIC; ditemukan lewat header **`Alt-Svc`**; fallback ke TCP jika UDP/443 diblokir.
- Keputusan jaringan: mengizinkan QUIC memberi kinerja lebih baik tetapi mengurangi visibilitas inspeksi.

---

## 8. Latihan

1. Kenapa DNS memakai UDP padahal keandalan penting?
2. Jelaskan mengapa retransmisi TCP justru merugikan panggilan VoIP.
3. Apa itu amplification attack dan kenapa UDP rentan? Sebutkan dua mitigasi.
4. Jelaskan head-of-line blocking pada HTTP/2 dan bagaimana QUIC mengatasinya.
5. Apa keuntungan Connection ID QUIC dibanding 5-tuple TCP?
6. Perusahaan Anda memblokir UDP/443. Apa dampaknya bagi pengguna, dan apa alasan sah untuk kebijakan itu?
7. Kenapa QUIC diimplementasikan di user space, bukan kernel?

<details>
<summary>Jawaban</summary>

1. Karena kebanyakan query DNS **cukup satu paket pergi dan satu paket balik**. Membangun koneksi TCP memerlukan 1 RTT tambahan hanya untuk handshake — menggandakan latency resolusi nama yang terjadi sangat sering. Keandalan ditangani di tingkat aplikasi: jika tidak ada jawaban dalam timeout, resolver cukup mengulang query (dan biasanya mencoba server DNS lain). Untuk kasus di mana UDP tidak memadai — jawaban >512 byte tanpa EDNS0, DNSSEC, atau zone transfer — DNS beralih ke **TCP 53**.

2. Paket suara punya **relevansi waktu**. Jika paket untuk detik ke-5 hilang dan TCP mengirim ulangnya, paket itu tiba pada detik ke-5,3 — saat percakapan sudah lewat, sehingga **tidak berguna**. Lebih buruk lagi, TCP menjaga urutan: seluruh paket suara setelahnya **ditahan** di buffer sampai paket yang hilang tiba (head-of-line blocking) — sehingga satu kehilangan kecil menyebabkan jeda yang jauh lebih panjang. Dengan UDP, paket hilang cukup diabaikan dan codec melakukan *packet loss concealment* (interpolasi), menghasilkan gangguan sangat singkat.

3. **Amplification attack**: penyerang mengirim query kecil ke server publik dengan **alamat sumber dipalsukan** menjadi alamat korban; server membalas dengan respons **jauh lebih besar** ke korban. UDP rentan karena **tidak ada handshake**, sehingga server tidak pernah memverifikasi bahwa pengirim benar-benar berada di alamat sumber yang diklaim.
   **Mitigasi:** (a) **BCP 38 / uRPF** — operator jaringan memfilter paket keluar dengan alamat sumber yang tidak sah, menghentikan spoofing di sumbernya; (b) **rate limiting** pada layanan UDP publik (mis. DNS Response Rate Limiting); (c) nonaktifkan fitur berisiko (NTP `monlist`, DNS `ANY`); (d) jangan mengekspos memcached/Redis ke internet.

4. **HTTP/2** memultipleks banyak stream dalam **satu koneksi TCP**. TCP menjamin urutan byte untuk seluruh koneksi, sehingga ketika satu paket hilang, TCP menahan **semua** data setelahnya — termasuk data milik stream lain yang sudah tiba lengkap — sampai paket yang hilang dikirim ulang. Akibatnya satu kehilangan memblokir semua stream.
   **QUIC** mengelola loss recovery **per stream**. Setiap stream punya ruang urutannya sendiri, sehingga kehilangan pada stream 3 hanya menahan stream 3; stream lain terus dikirim ke aplikasi.

5. Koneksi TCP diidentifikasi oleh **5-tuple** (protokol, IP src, port src, IP dst, port dst). Jika salah satu berubah — misalnya ponsel berpindah dari Wi-Fi ke jaringan seluler sehingga IP sumbernya berubah — koneksi **putus** dan harus dibangun ulang lengkap dengan handshake TLS.
   QUIC mengidentifikasi koneksi dengan **Connection ID** yang independen dari alamat. Saat IP/port berubah, koneksi **berlanjut** tanpa terputus (connection migration) — unduhan, video call, dan sesi tetap berjalan. Ini keunggulan besar untuk perangkat bergerak.

6. **Dampak bagi pengguna:** browser akan mencoba QUIC, gagal, lalu **fallback ke TCP** — menambah sedikit delay pada koneksi pertama ke setiap situs; pengguna kehilangan manfaat 0-RTT, connection migration, dan bebas HOL blocking. Pada jaringan dengan loss atau latency tinggi, perbedaannya terasa.
   **Alasan sah kebijakan itu:** organisasi perlu **inspeksi TLS** untuk DLP, IPS, filtering konten, dan audit kepatuhan. Banyak perangkat keamanan (proxy, NGFW) belum bisa mendekripsi atau menganalisis QUIC, sehingga trafik QUIC menjadi "titik buta". Memaksa fallback ke TCP mengembalikan visibilitas. Kebijakan ini bersifat sementara dan akan berubah seiring dukungan QUIC di perangkat keamanan matang.

7. Karena TCP yang berada di **kernel** ternyata sangat sulit diubah: memperbarui TCP berarti memperbarui sistem operasi di miliaran perangkat, dan **middlebox** (firewall, NAT, proxy lama) sering membuang atau merusak opsi TCP yang tidak mereka kenali — fenomena yang disebut **ossification**. Akibatnya perbaikan TCP macet selama puluhan tahun.
   Dengan menempatkan QUIC di **user space** di atas UDP (yang sudah pasti dilewatkan middlebox) dan **mengenkripsi hampir seluruh header** (sehingga middlebox tidak bisa "membantu" atau merusaknya), QUIC bisa diperbarui lewat update browser/server biasa — iterasi dalam hitungan minggu, bukan dekade.

</details>

---

## 9. Sumber

- RFC 768 — User Datagram Protocol
- RFC 9000 — QUIC: A UDP-Based Multiplexed and Secure Transport
- RFC 9001 — Using TLS to Secure QUIC
- RFC 9002 — QUIC Loss Detection and Congestion Control
- RFC 9114 — HTTP/3
- RFC 9204 — QPACK
- RFC 2827 / BCP 38 — Network Ingress Filtering
- Cloudflare, *The Road to QUIC* — https://blog.cloudflare.com/the-road-to-quic/
- Cisco CCNA 200-301 v1.1, topik 1.5

---

**Berikutnya:** `05-transport/04-congestion-control.md`. Bagaimana internet tidak runtuh karena kepadatan.

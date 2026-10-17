# 05.4 Congestion Control, MTU, dan Bufferbloat

> **Prasyarat:** `05-transport/02`, `00-fondasi/03`
> **Tujuan:** Anda paham bagaimana TCP menghindari kemacetan jaringan, bisa memilih algoritma yang tepat, dan bisa mendiagnosis bufferbloat serta masalah MTU.

---

## 1. Congestion Collapse: Masalah yang Harus Dicegah

Oktober 1986: throughput antara Lawrence Berkeley Laboratory dan UC Berkeley (jarak 400 m) jatuh dari 32 kbps menjadi **40 bps**, turun 1000×. Peristiwa ini disebut **congestion collapse**.

Mekanismenya:
```
1. Jaringan padat → paket dibuang
2. Pengirim tidak menerima ACK → mengirim ulang
3. Retransmisi menambah beban → lebih banyak paket dibuang
4. Lebih banyak retransmisi → SPIRAL MENURUN
5. Jaringan penuh dengan paket yang tidak pernah sampai
```

Van Jacobson merancang algoritma congestion control yang menyelamatkan internet, dipublikasikan 1988. Prinsipnya masih dipakai sampai hari ini.

---

## 2. Flow Control vs Congestion Control

Dua hal berbeda yang sering tertukar:

| | **Flow Control** | **Congestion Control** |
|---|---|---|
| Melindungi | **Penerima** | **Jaringan** |
| Mekanisme | `rwnd` (receive window) | `cwnd` (congestion window) |
| Sinyal | **Eksplisit**: penerima mengiklankan window | **Implisit**: disimpulkan dari loss/delay/ECN |
| Ditentukan oleh | Penerima | Pengirim (perkiraan sendiri) |

**Pengirim dibatasi oleh yang terkecil:**
```
Data in-flight ≤ min(rwnd, cwnd)
```

> [!WARNING]
> Jaringan tidak pernah memberi tahu kapasitasnya. Pengirim harus menebak dengan mencoba menaikkan kecepatan sampai ada tanda masalah. Itulah inti congestion control.

---

## 3. Algoritma Klasik: Slow Start dan Congestion Avoidance

### Slow Start

Meski namanya "slow", ini justru fase **pertumbuhan eksponensial**.

```
cwnd dimulai dari IW (Initial Window) = 10 segmen (RFC 6928; dulu 1–4)
Setiap ACK diterima → cwnd += 1 segmen

Efeknya per RTT: cwnd DIGANDAKAN

RTT 1: cwnd = 10
RTT 2: cwnd = 20
RTT 3: cwnd = 40
RTT 4: cwnd = 80
...
```

Berhenti ketika: mencapai **ssthresh** (slow start threshold), atau terjadi loss.

Nama "slow start" berasal dari perbandingan dengan perilaku sebelumnya: dulu TCP langsung mengirim sebanyak yang diizinkan window, tanpa pemanasan sama sekali.

### Congestion Avoidance

Setelah `cwnd ≥ ssthresh`, pertumbuhan menjadi **linear**:
```
Setiap RTT → cwnd += 1 segmen
```

Ini fase "hati-hati": mendekati kapasitas maksimum, kenaikan diperlambat.

### AIMD (Additive Increase, Multiplicative Decrease)

```
Tidak ada masalah  → cwnd += 1 per RTT     (naik pelan)
Ada loss           → cwnd = cwnd / 2       (turun cepat)
```

**Kenapa asimetris?** Karena keamanan: menaikkan terlalu cepat berisiko menyebabkan collapse; menurunkan cepat memulihkan jaringan dengan segera. AIMD terbukti secara matematis konvergen ke pembagian bandwidth yang adil antar-aliran.

### Grafik cwnd klasik

```
cwnd
  │                          ╱│
  │                        ╱  │        ╱│
  │           ╱│         ╱    │      ╱  │
  │         ╱  │       ╱      │    ╱    │
  │       ╱    │     ╱        │  ╱      │
  │     ╱      │   ╱          │╱        │
  │   ╱ (slow  │ ╱ (congestion avoidance)│
  │ ╱   start) │╱                        │
  └────────────┴─────────────────────────┴──► waktu
              loss                     loss
```

---

## 4. Reaksi terhadap Loss

### Tahoe (1988)
```
Loss terdeteksi (timeout ATAU 3 dup ACK)
→ ssthresh = cwnd / 2
→ cwnd = 1     ← kembali ke slow start dari nol
```
Reaksi ini terlalu drastis: throughput jatuh total setiap kali ada loss kecil.

### Reno (1990)
Menambahkan **Fast Recovery**:
```
3 duplicate ACK (loss ringan, jaringan masih mengalirkan data):
→ ssthresh = cwnd / 2
→ cwnd = ssthresh          ← TIDAK kembali ke 1
→ langsung masuk congestion avoidance

Timeout (loss berat, tidak ada yang sampai):
→ ssthresh = cwnd / 2
→ cwnd = 1                 ← slow start dari awal
```

Logikanya: duplicate ACK berarti paket **masih mengalir** (penerima menerima sesuatu), jadi jaringan belum runtuh. Timeout berarti tidak ada apa pun yang sampai, situasi yang jauh lebih serius.

### NewReno
Memperbaiki Reno untuk kasus **beberapa paket hilang dalam satu window**. Reno keluar dari fast recovery terlalu cepat dan bisa memicu timeout.

### CUBIC (default Linux, Windows 10+, macOS)

Masalah Reno: pada link **long-fat** (bandwidth besar, RTT besar), pertumbuhan linear +1 per RTT terlalu lambat untuk memulihkan window besar.

```
Link 10 Gbps, RTT 100 ms → BDP ≈ 83.000 segmen
Setelah loss: cwnd turun ke ~41.500
Untuk kembali ke 83.000 dengan +1 per RTT:
  41.500 RTT × 0,1 detik = 4.150 detik ≈ 69 MENIT ❌
```

**CUBIC** memakai fungsi kubik yang:
- Tumbuh **cepat** saat jauh dari titik loss sebelumnya
- Melambat saat **mendekati** titik itu (hati-hati)
- Tumbuh cepat lagi jika ternyata aman (menjelajahi kapasitas baru)

Pertumbuhannya juga **tidak bergantung RTT**, sehingga lebih adil antara aliran dengan RTT berbeda.

### BBR (Bottleneck Bandwidth and RTT): Google, 2016

BBR memakai pendekatan yang sama sekali berbeda.

```
Algoritma berbasis LOSS (Reno, CUBIC):
  "Naikkan sampai ada paket hilang"
  → Masalah: buffer besar terisi penuh SEBELUM loss terjadi
  → Menyebabkan BUFFERBLOAT (latency tinggi)
  → Juga: pada link dengan loss acak (wireless), throughput turun tanpa alasan

BBR:
  Mengukur dua hal:
    - BtlBw : bandwidth bottleneck maksimum yang teramati
    - RTprop: RTT propagasi minimum (saat antrean kosong)
  Mengirim tepat pada laju BtlBw dengan data in-flight ≈ BDP
  → Antrean tetap PENDEK → latency rendah
  → Tidak terganggu loss acak
```

**Keunggulan BBR:**
- Throughput jauh lebih tinggi pada link dengan loss acak (wireless, satelit, link internasional)
- Latency lebih rendah (tidak mengisi buffer)
- Sangat baik untuk link long-fat

**Kritik BBR v1:** bisa terlalu agresif dan "menekan" aliran CUBIC yang berbagi bottleneck yang sama. **BBRv2/v3** memperbaiki keadilan ini dan menambahkan respons terhadap ECN.

### Perbandingan

| Algoritma | Sinyal | Cocok untuk | Catatan |
|---|---|---|---|
| Reno / NewReno | Loss | Referensi historis | Terlalu lambat untuk link cepat |
| **CUBIC** | Loss | Umum | Default Linux/Windows/macOS |
| **BBR** | Bandwidth + RTT | Link dengan loss, long-fat, video | Default beberapa layanan Google/YouTube |
| Vegas | Delay | Riset | Kalah bersaing dengan yang berbasis loss |
| DCTCP | ECN | **Data center** | Butuh dukungan switch ECN |
| **Prague / L4S** | ECN halus | Masa depan | Latency sangat rendah, sedang distandarkan |

```bash
# Lihat & ubah algoritma
$ sysctl net.ipv4.tcp_congestion_control
net.ipv4.tcp_congestion_control = cubic

$ sysctl net.ipv4.tcp_available_congestion_control
reno cubic bbr

$ sudo sysctl -w net.ipv4.tcp_congestion_control=bbr
$ echo 'net.ipv4.tcp_congestion_control=bbr' | sudo tee /etc/sysctl.d/99-bbr.conf

# BBR bekerja paling baik dengan qdisc fq
$ sudo sysctl -w net.core.default_qdisc=fq
```

> [!TIP]
> **Kapan mengganti ke BBR:** server yang melayani klien di jaringan dengan loss (seluler, internasional, wireless), atau transfer besar lintas benua. Untuk LAN dan data center, CUBIC sudah baik, dan DCTCP lebih tepat kalau switch mendukung ECN.

---

## 5. ECN (Explicit Congestion Notification)

Alih-alih **membuang** paket untuk memberi sinyal congestion, router **menandai** paket.

```
Tanpa ECN:
  Router penuh → BUANG paket → pengirim tahu dari timeout/dup ACK
  → data hilang, harus dikirim ulang

Dengan ECN:
  Router hampir penuh → TANDAI paket (bit CE di header IP)
  → Penerima melihat CE → set flag ECE di ACK
  → Pengirim mengurangi cwnd DAN set flag CWR
  → TIDAK ADA data yang hilang
```

Bit ECN di header IP (2 bit di byte ToS):
```
00 = Non-ECT  (tidak mendukung ECN)
01 = ECT(1)   ┐ mendukung ECN
10 = ECT(0)   ┘
11 = CE       ← Congestion Experienced (ditandai router)
```

```bash
$ sysctl net.ipv4.tcp_ecn
# 0 = mati, 1 = aktif (minta & terima), 2 = hanya terima jika diminta
$ sudo sysctl -w net.ipv4.tcp_ecn=1
```

> [!WARNING]
> Beberapa middlebox lama membuang paket ber-ECN atau menghapus bitnya. Nilai default `2` (pasif) aman; nilai `1` bisa menyebabkan masalah di jaringan tertentu.

**L4S** (*Low Latency, Low Loss, Scalable throughput*) [RFC 9330] adalah evolusi ECN yang memberi sinyal jauh lebih halus dan sering, sehingga latency bisa di bawah 1 ms bahkan saat link penuh.

---

## 6. Bufferbloat

Bufferbloat adalah salah satu masalah kinerja jaringan yang paling banyak memengaruhi pengguna rumahan, dan paling sering salah didiagnosis.

### Masalahnya

Memori menjadi murah, jadi produsen memasang buffer besar di router, modem, dan perangkat. Niatnya baik ("jangan buang paket"), tetapi hasilnya buruk:

```
Router dengan buffer 1 MB pada link upload 1 Mbps:
  Waktu mengosongkan buffer = 1.000.000 × 8 / 1.000.000 = 8 DETIK

Saat ada upload besar berjalan:
  Buffer penuh → setiap paket baru menunggu di belakang antrean
  Ping yang biasanya 20 ms menjadi 2000+ ms
  Video call putus, game tidak bisa dimainkan, halaman web tidak terbuka
  TAPI: packet loss = 0% ← inilah yang menipu
```

**Gejala khas:**
```
Idle          : ping 20 ms   ✅
Download besar: ping 800 ms  ❌
Upload besar  : ping 2000 ms ❌❌
Packet loss   : 0%
Speedtest     : "kecepatan bagus!" (speedtest hanya mengukur throughput)
```

Pengguna melaporkan "internet lambat saat ada yang download", padahal bandwidth-nya baik-baik saja. Yang rusak adalah **latency**.

### Kenapa terjadi

Algoritma berbasis loss (CUBIC, Reno) **membutuhkan** loss untuk tahu kapan berhenti menaikkan kecepatan. Buffer besar menunda loss itu, sehingga TCP terus mengisi buffer sampai penuh sebelum mendapat sinyal.

### Solusi: AQM (Active Queue Management)

Alih-alih membiarkan antrean penuh (*tail drop*), AQM membuang atau menandai paket lebih awal dan lebih cerdas.

| AQM | Cara kerja |
|---|---|
| **RED** (Random Early Detection) | Membuang paket secara acak saat antrean mulai penuh. Sulit dituning |
| **CoDel** (Controlled Delay) | Mengukur **berapa lama paket menunggu**, bukan panjang antrean. Buang jika delay > target (5 ms) terlalu lama |
| **FQ-CoDel** | CoDel + **fair queuing** per aliran → aliran kecil (SSH, DNS, game) tidak tertahan di belakang aliran besar |
| **CAKE** | FQ-CoDel + shaping + kompensasi overhead + prioritas DiffServ. Paling lengkap untuk router rumahan |

### Mengukur bufferbloat

```bash
# 1. Ukur latency saat idle
$ ping -c 20 8.8.8.8
rtt min/avg/max = 18.2/19.1/21.3 ms

# 2. Mulai beban berat di terminal lain
$ iperf3 -c server -t 60          # upload
# atau unduh file besar

# 3. Ukur latency lagi SAAT beban berjalan
$ ping -c 20 8.8.8.8
rtt min/avg/max = 18.5/850.2/2100.5 ms   ← BUFFERBLOAT PARAH
```

Alat khusus:
- **Waveform Bufferbloat Test**: https://www.waveform.com/tools/bufferbloat
- **DSLReports Speed Test**: memberi grade A-F untuk bufferbloat
- `flent` (Flexible Network Tester): pengujian RRUL yang komprehensif

### Memperbaiki dengan CAKE
```bash
# Pasang qdisc CAKE di interface WAN
# Set bandwidth ~90-95% dari kapasitas sebenarnya agar ANTREAN ada di sini,
# bukan di modem/perangkat ISP yang tidak bisa Anda kontrol
$ sudo tc qdisc replace dev eth0 root cake bandwidth 95Mbit

# Untuk koneksi asimetris, gunakan IFB untuk arah download
# Atau gunakan router dengan OpenWrt + SQM (paket luci-app-sqm)

# Verifikasi
$ tc -s qdisc show dev eth0

# FQ-CoDel (lebih sederhana, tersedia di mana-mana)
$ sudo tc qdisc replace dev eth0 root fq_codel
```

> [!TIP]
> **Buat bottleneck berada di perangkat yang Anda kendalikan.** Kalau Anda men-shape ke 95% dari kapasitas link, antrean terbentuk di router Anda (yang punya AQM baik) alih-alih di modem ISP (yang punya buffer besar tanpa AQM).

---

## 7. MTU dan MSS: Masalah Praktis Terbesar

Sudah dibahas di `04-network-layer/01` dan `05-transport/02`. Di sini rangkuman praktis untuk diagnosis.

### Alur diagnosis MTU

```
Gejala: koneksi terbentuk, transfer besar menggantung

1. Cari MTU efektif jalur
   $ ping -M do -s 1472 tujuan     # 1472 + 28 = 1500
   $ ping -M do -s 1400 tujuan     # 1400 + 28 = 1428
   $ ping -M do -s 1372 tujuan
   → ukuran terbesar yang berhasil + 28 = MTU jalur

2. Bandingkan dengan MTU interface
   $ ip link show | grep mtu

3. Periksa apakah ICMP diblokir
   $ tracepath tujuan               # menampilkan perubahan MTU per hop

4. Perbaiki:
   a) Izinkan ICMP tipe 3 kode 4 (SOLUSI TERBAIK)
   b) Turunkan MTU interface
   c) MSS clamping (paling andal untuk tunnel)
```

### Tabel MTU untuk berbagai teknologi

| Teknologi | MTU | MSS (IPv4) |
|---|---|---|
| Ethernet | 1500 | 1460 |
| Jumbo frame | 9000 | 8960 |
| PPPoE | 1492 | 1452 |
| GRE | 1476 | 1436 |
| GRE + IPsec | ~1400-1438 | ~1360-1398 |
| IPsec transport (AES) | ~1438 | ~1398 |
| IPsec tunnel (AES) | ~1427 | ~1387 |
| WireGuard (IPv4) | 1440 | 1400 |
| WireGuard (IPv6) | 1420 | 1380 |
| VXLAN | 1450 | 1410 |
| L2TP/IPsec | ~1400 | ~1360 |
| 6in4 tunnel | 1480 | 1440 |

> [!TIP]
> **Nilai aman universal untuk tunnel:** MTU **1400** dan MSS clamp **1360**. Sedikit tidak optimal, tetapi hampir selalu bekerja.

### MSS clamping

```
# Cisco
R1(config-if)# ip tcp adjust-mss 1360

# Linux (nftables) — otomatis sesuai MTU rute
$ sudo nft add rule inet filter forward tcp flags syn tcp option maxseg size set rt mtu

# Linux (iptables legacy)
$ sudo iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN \
    -j TCPMSS --clamp-mss-to-pmtu
```

> [!WARNING]
> MSS clamping hanya bekerja untuk **TCP**. Trafik UDP (termasuk QUIC dan VPN di dalam VPN) tetap memerlukan MTU yang benar.

---

## 8. Praktik: Mengukur dan Menyetel

```bash
# Bandingkan algoritma congestion control
$ sudo sysctl -w net.ipv4.tcp_congestion_control=cubic
$ iperf3 -c server -t 30
$ sudo sysctl -w net.ipv4.tcp_congestion_control=bbr
$ iperf3 -c server -t 30

# Lihat cwnd dan statistik per koneksi secara langsung
$ ss -tin dst 1.2.3.4
    bbr wscale:7,7 rto:212 rtt:11.5/2.1 mss:1448
    cwnd:64 ssthresh:32 bytes_sent:5231000 retrans:0/12
    send 80.6Mbps pacing_rate 96.8Mbps delivery_rate 78.2Mbps

# Statistik retransmisi sistem
$ nstat -az | grep -iE 'retrans|TCPLoss|TCPTimeout'
$ netstat -s | grep -iE 'retransmit|segments'

# Uji dengan loss buatan (untuk membandingkan algoritma)
$ sudo tc qdisc add dev eth0 root netem loss 1% delay 100ms
$ iperf3 -c server -t 30
$ sudo tc qdisc del dev eth0 root

# Lihat qdisc aktif
$ tc qdisc show
$ tc -s qdisc show dev eth0
```

### Tuning buffer untuk link long-fat
```bash
# BDP untuk 1 Gbps × 200 ms = 25 MB
$ sudo sysctl -w net.core.rmem_max=67108864
$ sudo sysctl -w net.core.wmem_max=67108864
$ sudo sysctl -w net.ipv4.tcp_rmem="4096 131072 67108864"
$ sudo sysctl -w net.ipv4.tcp_wmem="4096 65536 67108864"
$ sudo sysctl -w net.ipv4.tcp_congestion_control=bbr
$ sudo sysctl -w net.core.default_qdisc=fq
```

> [!WARNING]
> **Selalu ukur sebelum dan sesudah.** Buffer yang terlalu besar menyebabkan bufferbloat di sisi host. Tidak ada nilai ajaib yang cocok untuk semua situasi.

---

## 9. Kesalahan Umum

> [!WARNING]
> **1. Menyamakan flow control dan congestion control.** Berbeda: satu melindungi penerima, satu melindungi jaringan.

> [!WARNING]
> **2. Menyimpulkan jaringan sehat dari "0% packet loss".** Bufferbloat memberi 0% loss dengan latency 2000 ms.

> [!WARNING]
> **3. Menilai kualitas koneksi hanya dari speedtest.** Speedtest mengukur throughput, bukan latency di bawah beban.

> [!WARNING]
> **4. Menyalin setelan sysctl dari internet tanpa mengukur.** Bisa memperburuk keadaan.

> [!WARNING]
> **5. Memakai BBR di mana-mana tanpa alasan.** Untuk LAN/data center, CUBIC atau DCTCP sering lebih tepat.

> [!WARNING]
> **6. Memperbesar buffer untuk "memperbaiki" masalah latency.** Justru memperburuk bufferbloat.

> [!WARNING]
> **7. Mengandalkan MSS clamping untuk trafik UDP.** Clamping tidak berlaku untuk UDP, jadi perbaiki MTU-nya.

---

## 10. Ringkasan

- **Congestion collapse** (1986) adalah alasan congestion control ada.
- **Flow control** (rwnd, eksplisit) melindungi penerima; **congestion control** (cwnd, implisit) melindungi jaringan. Pengirim dibatasi `min(rwnd, cwnd)`.
- **Slow start** menggandakan cwnd tiap RTT sampai ssthresh; **congestion avoidance** menaikkan +1 per RTT. **AIMD**: naik pelan, turun cepat (½).
- **Reno** menambahkan fast recovery (3 dup ACK → cwnd/2, bukan 1). **CUBIC** (default modern) tumbuh kubik agar cepat pulih di link long-fat.
- **BBR** mengukur bandwidth & RTT alih-alih menunggu loss → latency rendah, tahan loss acak. Cocok untuk seluler/internasional/video.
- **ECN** menandai alih-alih membuang paket; **L4S** adalah evolusinya untuk latency sangat rendah.
- **Bufferbloat**: buffer besar → latency melonjak saat beban, dengan **0% packet loss**. Gejala klasik "internet lambat saat ada yang download".
- Solusi bufferbloat: **AQM** (FQ-CoDel atau **CAKE**) dan **shape ke ~95%** kapasitas agar antrean ada di perangkat yang Anda kendalikan.
- **MTU/MSS**: nilai aman universal untuk tunnel adalah MTU 1400 / MSS 1360. MSS clamping hanya untuk TCP.

---

## 11. Latihan

1. Jelaskan perbedaan flow control dan congestion control, dan apa yang membatasi pengirim.
2. Kenapa AIMD menaikkan cwnd secara linear tetapi menurunkannya secara multiplikatif?
3. Pengguna melapor: "ping saya 20 ms saat idle, tetapi 1500 ms saat mengunduh. Tidak ada packet loss." Apa diagnosis dan perbaikannya?
4. Kenapa CUBIC dibuat menggantikan Reno pada link berkecepatan tinggi? Tunjukkan dengan hitungan.
5. Apa keunggulan BBR pada koneksi seluler, dan mengapa?
6. Sebuah VPN WireGuard bekerja untuk SSH tetapi transfer file macet. Jelaskan penyebab dan tiga cara memperbaikinya.
7. Kenapa mengaktifkan ECN bisa menyebabkan masalah di beberapa jaringan?

<details>
<summary>Jawaban</summary>

1. **Flow control** melindungi **penerima** agar buffer penerimaannya tidak melimpah; penerima secara eksplisit mengiklankan `rwnd` di setiap ACK. **Congestion control** melindungi **jaringan** agar tidak macet; jaringan tidak pernah mengumumkan kapasitasnya, sehingga pengirim harus menyimpulkan dari sinyal implisit (packet loss, kenaikan RTT, penandaan ECN) dan memelihara `cwnd` sendiri. Pengirim dibatasi oleh **`min(rwnd, cwnd)`**: data in-flight tidak boleh melebihi yang lebih kecil dari keduanya.

2. Karena **konsekuensi kesalahan asimetris**. Menaikkan terlalu cepat berisiko menyebabkan kemacetan berantai hingga congestion collapse, yang kerugiannya besar dan memengaruhi semua pengguna jaringan. Menurunkan terlalu cepat hanya membuat pengirim ini sedikit lebih lambat, dan bisa dipulihkan kembali. Jadi: naik hati-hati (linear), turun tegas (½). Selain itu, AIMD terbukti secara matematis **konvergen ke pembagian bandwidth yang adil** antar-aliran yang berbagi bottleneck, sifat yang tidak dimiliki kombinasi lain (mis. additive-decrease).

3. **Bufferbloat.** Buffer besar di modem/router ISP terisi penuh saat unduhan berjalan, sehingga setiap paket baru (termasuk ICMP ping) harus mengantre di belakangnya. Tidak ada loss justru karena buffer-nya besar: paket tidak dibuang, hanya **ditunda**.
   **Perbaikan:** pasang **AQM** di router yang Anda kendalikan (`fq_codel`, atau lebih baik `cake`) dan **shape** bandwidth ke ~90-95% dari kapasitas sebenarnya, sehingga antrean terbentuk di router Anda (yang punya AQM) alih-alih di modem ISP. Pada router OpenWrt: pasang paket SQM (`luci-app-sqm`). Verifikasi dengan mengukur ping ulang di bawah beban.

4. Reno menaikkan cwnd **+1 segmen per RTT** setelah loss. Pada link cepat berlatency tinggi, window yang harus dipulihkan sangat besar:
   ```
   Link 10 Gbps, RTT 100 ms, MSS 1460 byte
   BDP = 10e9 × 0,1 / 8 / 1460 ≈ 85.600 segmen
   Setelah loss: cwnd turun ke ≈ 42.800
   Pemulihan dengan +1/RTT: 42.800 × 0,1 detik ≈ 4.280 detik ≈ 71 menit
   ```
   CUBIC memakai fungsi kubik yang tumbuh cepat saat jauh dari titik loss sebelumnya dan melambat saat mendekatinya, sehingga pemulihan berlangsung dalam hitungan detik. CUBIC juga **tidak bergantung RTT**, sehingga lebih adil antar-aliran dengan RTT berbeda.

5. Jaringan seluler punya **loss acak** yang disebabkan kondisi radio (fading, handover, interferensi), bukan kemacetan. Algoritma berbasis loss seperti CUBIC menafsirkan setiap kehilangan sebagai "jaringan macet" dan **memotong cwnd menjadi setengah**, sehingga throughput jatuh drastis padahal kapasitas sebenarnya masih tersedia.
   **BBR** tidak memakai loss sebagai sinyal utama; ia mengukur **bandwidth bottleneck** dan **RTT propagasi minimum**, lalu mengirim pada laju yang sesuai. Loss acak diabaikan, sehingga throughput tetap tinggi. Sebagai bonus, BBR menjaga antrean tetap pendek sehingga latency lebih rendah.

6. **Penyebab: MTU black hole akibat overhead tunnel.** WireGuard menambah ~60 byte header, sehingga payload maksimum turun dari 1500 menjadi ~1440. Paket besar dengan bit DF diset akan dibuang, dan pesan ICMP "Fragmentation Needed" kemungkinan diblokir sehingga PMTUD gagal. SSH interaktif memakai paket kecil sehingga tetap bekerja; transfer file memakai paket penuh sehingga macet.
   **Tiga perbaikan:** (a) **turunkan MTU interface tunnel** di kedua sisi dengan `ip link set dev wg0 mtu 1400` (atau set `MTU = 1400` di file konfigurasi WireGuard); (b) **MSS clamping** di router dengan `ip tcp adjust-mss 1360` (Cisco) atau aturan nftables `tcp option maxseg size set rt mtu`; (c) **izinkan ICMP tipe 3 kode 4** melewati firewall di kedua ujung sehingga PMTUD dapat bekerja normal.

7. Beberapa **middlebox lama** (firewall, load balancer, perangkat ISP) tidak memahami bit ECN di header IP dan berperilaku salah: ada yang **membuang** paket dengan bit ECT/CE diset, ada yang **menghapus** bitnya sehingga negosiasi ECN menjadi tidak konsisten, dan ada yang menandai semua paket sebagai CE sehingga pengirim terus-menerus menurunkan cwnd tanpa alasan. Akibatnya: koneksi ke tujuan tertentu gagal total atau sangat lambat. Karena itu Linux memakai default `tcp_ecn=2` (hanya merespons jika lawan meminta, tidak pernah memulai), yang aman; nilai `1` (aktif meminta ECN) sebaiknya diuji dulu di lingkungan Anda.

</details>

---

## 12. Sumber

- RFC 5681, TCP Congestion Control
- RFC 6928, Increasing TCP's Initial Window
- RFC 8312, CUBIC for Fast Long-Distance Networks
- RFC 3168, The Addition of ECN to IP
- RFC 8290, FQ-CoDel
- RFC 9330, L4S Architecture
- Cardwell et al. (2016), *BBR: Congestion-Based Congestion Control*
- Jacobson, V. (1988), *Congestion Avoidance and Control*
- Bufferbloat project: https://www.bufferbloat.net/

---

**Berikutnya:** `06-aplikasi/01-dns.md`. Layanan yang paling sering menjadi penyebab masalah "internet mati".

# 05.2 — TCP

> **Prasyarat:** `05-transport/01`
> **Tujuan:** Anda paham setiap field header TCP, bisa menjelaskan handshake dan teardown, mengenali state machine, dan mendiagnosis masalah TCP di Wireshark.

---

## 1. Apa yang Dijamin TCP

TCP [RFC 9293, menggantikan RFC 793] memberikan **abstraksi byte-stream yang andal** di atas IP yang best-effort.

| Jaminan | Bagaimana dicapai |
|---|---|
| **Data sampai** | Acknowledgment + retransmisi |
| **Urutan benar** | Sequence number + buffer reorder |
| **Tidak duplikat** | Sequence number |
| **Tidak rusak** | Checksum |
| **Tidak membanjiri penerima** | Flow control (window) |
| **Tidak membanjiri jaringan** | Congestion control |

Yang **tidak** dijamin TCP:
- ❌ Latency tertentu (tidak ada jaminan waktu)
- ❌ Keamanan (butuh TLS)
- ❌ Batas pesan (TCP adalah **stream**, bukan pesan — aplikasi harus membuat framingnya sendiri)

⚠️ **Poin terakhir sering menjebak developer:** kalau Anda mengirim `send("HALO")` lalu `send("DUNIA")`, penerima bisa menerimanya sebagai satu `recv()` berisi `"HALODUNIA"`, atau tiga `recv()` berisi `"HAL"`, `"ODUN"`, `"IA"`. TCP tidak menjaga batas pesan.

---

## 2. Header TCP

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|          Source Port          |       Destination Port        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Sequence Number                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Acknowledgment Number                     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| Offset|  Rsvd |C|E|U|A|P|R|S|F|            Window             |
|       |       |W|C|R|C|S|S|Y|I|                               |
|       |       |R|E|G|K|H|T|N|N|                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|           Checksum            |         Urgent Pointer        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Options (0–40 byte)          |   Padding   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

| Field | Ukuran | Fungsi |
|---|---|---|
| **Source Port** | 16 bit | Port pengirim |
| **Destination Port** | 16 bit | Port tujuan |
| **Sequence Number** | 32 bit | Nomor byte pertama dalam segmen ini |
| **Acknowledgment Number** | 32 bit | Byte berikutnya yang **diharapkan** diterima |
| **Data Offset** | 4 bit | Panjang header dalam kelipatan 4 byte (5 = 20 byte minimum) |
| **Flags** | 8 bit | Lihat di bawah |
| **Window** | 16 bit | Berapa byte lagi yang siap diterima (flow control) |
| **Checksum** | 16 bit | Checksum header + data + pseudo-header IP |
| **Urgent Pointer** | 16 bit | Posisi data mendesak (jarang dipakai) |
| **Options** | 0–40 byte | MSS, window scale, SACK, timestamp |

### Flags

| Flag | Nama | Arti |
|---|---|---|
| **SYN** | Synchronize | Memulai koneksi, sinkronkan sequence number |
| **ACK** | Acknowledgment | Field acknowledgment number valid |
| **FIN** | Finish | Selesai mengirim data (penutupan sopan) |
| **RST** | Reset | Putuskan paksa — ada yang salah |
| **PSH** | Push | Kirim data ke aplikasi segera, jangan buffer |
| **URG** | Urgent | Ada data mendesak (praktis tidak dipakai; dianggap berisiko) |
| **ECE** | ECN-Echo | Memberi tahu pengirim ada congestion |
| **CWR** | Congestion Window Reduced | Konfirmasi telah mengurangi cwnd |

### Sequence dan Acknowledgment Number

⚠️ Ini konsep yang paling sering membingungkan. Kuncinya:

```
Sequence number  = nomor byte PERTAMA dalam segmen ini
Ack number       = nomor byte BERIKUTNYA yang saya harapkan
                   (= saya sudah menerima semua sampai ack−1)
```

Contoh:
```
Pengirim mengirim 100 byte dengan seq=1000
  → berisi byte 1000 sampai 1099

Penerima menjawab ack=1100
  → "saya sudah punya sampai byte 1099, kirimkan mulai 1100"
```

**ISN (Initial Sequence Number)** dipilih **acak** saat handshake — bukan mulai dari 0. Ini keamanan: ISN yang dapat ditebak memungkinkan penyerang menyuntikkan data ke koneksi (session hijacking) [RFC 6528].

💡 Wireshark menampilkan **relative sequence number** (dimulai dari 0) secara default agar mudah dibaca. Untuk melihat nilai sebenarnya: *Preferences → Protocols → TCP → uncheck "Relative sequence numbers"*.

### Options penting

| Option | Fungsi |
|---|---|
| **MSS** (*Maximum Segment Size*) | Ukuran payload maksimum yang bisa diterima. Dinegosiasikan di SYN |
| **Window Scale** | Faktor pengali window (window 16 bit terlalu kecil untuk link cepat) |
| **SACK Permitted / SACK** | Selective ACK — beri tahu blok mana saja yang sudah diterima |
| **Timestamps** | Pengukuran RTT akurat + perlindungan wrap-around sequence (PAWS) |

---

## 3. Three-Way Handshake

```
Klien                                          Server
  │                                              │
  │  1. SYN  seq=x, MSS=1460, WS=7, SACK-perm    │
  │─────────────────────────────────────────────►│
  │                                              │
  │  2. SYN-ACK  seq=y, ack=x+1, MSS=1460, WS=7  │
  │◄─────────────────────────────────────────────│
  │                                              │
  │  3. ACK  seq=x+1, ack=y+1                    │
  │─────────────────────────────────────────────►│
  │                                              │
  │         KONEKSI TERBENTUK                    │
```

**Kenapa tiga langkah, bukan dua?**
Karena **kedua arah** harus disinkronkan. Langkah 1–2 menyinkronkan arah klien→server; langkah 2–3 menyinkronkan arah server→klien. Dengan dua langkah saja, server tidak tahu apakah klien menerima SYN-ACK-nya.

**Yang dinegosiasikan selama handshake:**
- Sequence number awal kedua arah
- **MSS** — ukuran segmen maksimum
- **Window scale** — hanya bisa dinegosiasikan di SYN/SYN-ACK
- **SACK** — didukung atau tidak
- **Timestamps**

⚠️ **Window scale hanya bisa disepakati di handshake.** Kalau middlebox menghapus opsi ini dari SYN, koneksi akan terbatas pada window 64 KB selamanya — menyebabkan throughput rendah pada link berlatency tinggi.

**Biaya:** handshake butuh **1 RTT** sebelum data pertama bisa dikirim. Ditambah TLS (1 RTT untuk TLS 1.3, 2 RTT untuk TLS 1.2), total 2–3 RTT sebelum request pertama. Inilah yang dipangkas QUIC.

**TCP Fast Open (TFO)** [RFC 7413] memungkinkan mengirim data bersama SYN untuk koneksi berulang, menghemat 1 RTT. Adopsinya terbatas karena banyak middlebox membuangnya.

---

## 4. Transfer Data

```
Klien                                    Server
  │  seq=1, len=100  ("data 1-100")        │
  │───────────────────────────────────────►│
  │                                        │
  │  seq=101, len=100 ("data 101-200")     │
  │───────────────────────────────────────►│
  │                          ack=201       │
  │◄───────────────────────────────────────│  ← cumulative ACK untuk keduanya
  │                                        │
```

**Cumulative ACK** — satu ACK bisa mengonfirmasi banyak segmen sekaligus. Efisien.

**Delayed ACK** — penerima menunda ACK sampai ~40–200 ms, berharap bisa menggabungkannya dengan data balasan (piggyback) atau mengonfirmasi dua segmen sekaligus. Mengurangi jumlah paket.

⚠️ **Interaksi buruk Nagle + Delayed ACK:**
```
Nagle: "jangan kirim segmen kecil sampai ACK sebelumnya diterima"
Delayed ACK: "jangan kirim ACK sampai 40 ms atau ada data balasan"

→ Pengirim menunggu ACK, penerima menunggu data
→ DEADLOCK 40–200 ms per transaksi kecil
```
Gejala: aplikasi request-response kecil (RPC, database query) terasa lambat dengan latency yang aneh konsisten ~40 ms.

Perbaikan: matikan Nagle di aplikasi yang latency-sensitif:
```c
setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, &one, sizeof(one));
```

---

## 5. Flow Control — Sliding Window

Mencegah pengirim membanjiri **penerima** (bukan jaringan).

```
Penerima mengiklankan: window = 8000

Pengirim boleh mengirim sampai 8000 byte tanpa menunggu ACK.
Setiap ACK "menggeser" window ke depan.

    Sudah di-ACK  │  Terkirim,     │  Boleh dikirim │ Belum boleh
                  │  belum di-ACK  │  sekarang      │
    ══════════════╪════════════════╪════════════════╪══════════
                  └───────── window (8000) ─────────┘
```

### Window Scaling

Field window hanya 16 bit → maksimum **65.535 byte**. Terlalu kecil untuk link modern.

```
Tanpa scaling, RTT 100 ms:
  Throughput maksimum = 65.535 × 8 / 0,1 = 5,2 Mbps
  → walaupun link 10 Gbps!
```

**Window Scale option** [RFC 7323] menambahkan faktor pengali sampai 2¹⁴:
```
Window efektif = window_field × 2^scale_factor
Maksimum = 65.535 × 16.384 = ~1 GB
```

Ingat **BDP** dari `00-fondasi/03`: window harus ≥ bandwidth × RTT agar pipa penuh.

```bash
# Cek apakah window scaling aktif
$ sysctl net.ipv4.tcp_window_scaling
net.ipv4.tcp_window_scaling = 1

# Lihat window scale yang dinegosiasikan
$ ss -tin dst 1.2.3.4 | grep wscale
    cubic wscale:7,7 rto:212 rtt:11.5/2.1 mss:1448 cwnd:10
                ^^^ ^^^ (send,recv scale factor)
```

### Zero Window

Kalau buffer penerima penuh, ia mengiklankan `window=0`:
```
Penerima: "window=0"  → pengirim BERHENTI
Pengirim mengirim window probe berkala
Penerima: "window=8000" (window update) → pengirim lanjut
```

⚠️ **Zero window yang sering muncul di Wireshark = aplikasi penerima terlalu lambat membaca socket buffer.** Ini masalah **aplikasi/server**, bukan jaringan. Sering terjadi pada server yang CPU-bound atau disk-bound.

---

## 6. Retransmisi

### RTO — Retransmission Timeout

```
Pengirim mengirim segmen → menyalakan timer
Timer habis sebelum ACK → RETRANSMIT + gandakan RTO (exponential backoff)
```

RTO dihitung dari **RTT yang diukur**:
```
SRTT   = smoothed RTT (rata-rata bergerak)
RTTVAR = variasi RTT
RTO    = SRTT + 4 × RTTVAR    (minimum biasanya 200 ms – 1 detik)
```

**Karn's algorithm** — jangan gunakan RTT dari segmen yang di-retransmit untuk menghitung SRTT (ambigu: ACK itu untuk transmisi asli atau retransmisi?).

**Exponential backoff:** RTO digandakan setiap retransmisi berturut-turut (1s, 2s, 4s, 8s, ...) sampai batas percobaan.

### Fast Retransmit

Menunggu RTO itu lambat. Kalau penerima menerima segmen di luar urutan, ia mengirim **duplicate ACK**.

```
Terkirim: seg1, seg2, seg3, seg4, seg5
seg2 HILANG

Penerima menerima seg1 → ack=2 (normal)
Penerima menerima seg3 → ack=2 (DUPLIKAT — "saya masih butuh seg2")
Penerima menerima seg4 → ack=2 (duplikat ke-2)
Penerima menerima seg5 → ack=2 (duplikat ke-3)

Pengirim melihat 3 duplicate ACK
→ FAST RETRANSMIT seg2 SEGERA, tanpa menunggu RTO
```

Ini menghemat waktu besar dibanding menunggu timeout.

### SACK — Selective Acknowledgment

Tanpa SACK, ACK bersifat kumulatif: penerima hanya bisa bilang "saya punya sampai byte X". Kalau seg2 hilang tetapi seg3–seg10 diterima, pengirim tidak tahu itu dan bisa mengirim ulang semuanya.

**SACK** [RFC 2018] memungkinkan penerima menyebutkan **blok** yang sudah diterima:
```
ack=2000, SACK: 3000-4000, 5000-6000
→ "saya butuh mulai 2000, tapi saya sudah punya 3000-4000 dan 5000-6000"
→ pengirim hanya mengirim ulang yang benar-benar hilang
```

Sangat penting pada jaringan dengan loss. Aktif secara default di semua OS modern.

---

## 7. Menutup Koneksi

### Four-Way Handshake (penutupan normal)

```
Klien                                       Server
  │  FIN, seq=x                                │
  │───────────────────────────────────────────►│  klien selesai mengirim
  │                            ACK, ack=x+1    │
  │◄───────────────────────────────────────────│
  │                                            │
  │      (server masih bisa mengirim data)     │
  │                                            │
  │                            FIN, seq=y      │
  │◄───────────────────────────────────────────│  server selesai mengirim
  │  ACK, ack=y+1                              │
  │───────────────────────────────────────────►│
  │                                            │
  │  klien menunggu 2×MSL di TIME_WAIT         │
```

Butuh empat langkah karena TCP **full duplex** — setiap arah ditutup terpisah. Kondisi di mana satu arah sudah ditutup tetapi yang lain masih terbuka disebut **half-close**.

### RST — Penutupan Paksa

```
RST dikirim ketika:
- Koneksi ke port yang tidak ada aplikasi listening  → "connection refused"
- Aplikasi crash / socket ditutup paksa
- Menerima paket untuk koneksi yang tidak dikenal
- Firewall mengirim RST untuk memblokir (reject, bukan drop)
- Timeout / kondisi error
```

⚠️ **RST di tengah transfer = tanda masalah.** Sering karena: firewall/IPS memutus koneksi, aplikasi crash, timeout di load balancer, atau NAT timeout yang menghapus entri.

### TIME_WAIT

Setelah menutup koneksi, sisi yang **menutup lebih dulu** (active close) masuk `TIME_WAIT` selama **2 × MSL** (*Maximum Segment Lifetime*) — biasanya **60 detik** di Linux, 240 detik di beberapa sistem.

**Kenapa perlu:**
1. Memastikan ACK terakhir sampai — kalau hilang, sisi lain akan mengirim ulang FIN, dan socket ini masih ada untuk membalas.
2. Mencegah segmen "nyasar" dari koneksi lama muncul di koneksi baru dengan 5-tuple yang sama.

⚠️ **Masalah pada server sibuk:**
```
$ ss -s
TCP:   45231 (estab 1203, closed 41000, timewait 40890)
                                        ^^^^^^^^^^^^^^^
```
Puluhan ribu socket TIME_WAIT memakan memori dan port.

**Solusi yang BENAR:**
```bash
# 1. Buat KLIEN yang menutup duluan, bukan server (desain aplikasi)
# 2. Gunakan keep-alive / connection pooling — jangan buat koneksi baru terus
# 3. Untuk koneksi KELUAR: aktifkan reuse
$ sudo sysctl -w net.ipv4.tcp_tw_reuse=1
```

⚠️ **JANGAN memakai `net.ipv4.tcp_tw_recycle`** — sudah **dihapus** dari kernel Linux sejak 4.12 karena merusak koneksi dari klien di balik NAT. Banyak tutorial lama masih menyarankannya; abaikan.

---

## 8. State Machine TCP

```
                        CLOSED
                          │
          ┌───────────────┴───────────────┐
   (aktif: connect)              (pasif: listen)
          │                               │
      SYN_SENT                        LISTEN
          │                               │
          │  terima SYN-ACK          terima SYN
          │  kirim ACK               kirim SYN-ACK
          │                               │
          │                          SYN_RECEIVED
          │                               │
          └────────────► ESTABLISHED ◄────┘
                          │       │
          (kirim FIN)     │       │   (terima FIN)
                          │       │
                    FIN_WAIT_1  CLOSE_WAIT
                          │       │
                          │       │ (aplikasi tutup → kirim FIN)
                    FIN_WAIT_2  LAST_ACK
                          │       │
                     TIME_WAIT   CLOSED
                          │
                     (2×MSL)
                          │
                       CLOSED
```

### State yang perlu dikenali saat troubleshooting

| State | Arti | Kalau menumpuk berarti |
|---|---|---|
| `LISTEN` | Server siap menerima | Normal |
| `SYN_SENT` | Klien mengirim SYN, menunggu jawaban | **Tujuan tidak menjawab** — firewall/host mati |
| `SYN_RECV` | Server menerima SYN, menunggu ACK | **SYN flood** atau klien menghilang |
| `ESTABLISHED` | Koneksi aktif | Normal |
| `FIN_WAIT_1/2` | Kita menutup, menunggu sisi lain | Sisi lain lambat menutup |
| **`CLOSE_WAIT`** | Sisi lain menutup, **aplikasi kita belum memanggil `close()`** | ⚠️ **BUG APLIKASI** — socket leak |
| `LAST_ACK` | Menunggu ACK terakhir | Normal sesaat |
| `TIME_WAIT` | Menunggu 2×MSL | Normal; menumpuk pada server yang menutup duluan |

⚠️ **`CLOSE_WAIT` yang menumpuk adalah tanda bug aplikasi**, bukan masalah jaringan. Aplikasi menerima FIN tetapi tidak pernah memanggil `close()` pada socket — kebocoran file descriptor yang akhirnya menyebabkan "too many open files".

```bash
$ ss -tan state close-wait
$ ss -tan | awk '{print $1}' | sort | uniq -c | sort -rn
```

---

## 9. MSS dan Interaksi dengan MTU

```
MTU  = 1500 byte  (payload maksimum frame Ethernet)
     − 20 byte header IP
     − 20 byte header TCP
     ────────────────────
MSS  = 1460 byte  (payload TCP maksimum)
```

MSS dinegosiasikan di SYN. Setiap sisi mengumumkan **MSS yang bisa ia terima**.

Dengan tunnel:
```
WireGuard : MTU 1420 → MSS 1380
IPsec     : MTU ~1438 → MSS ~1398
PPPoE     : MTU 1492 → MSS 1452
VXLAN     : MTU 1450 → MSS 1410
```

### MSS Clamping

Router menulis ulang opsi MSS di paket SYN yang lewat, memaksa kedua ujung memakai segmen lebih kecil.

```
R1(config-if)# ip tcp adjust-mss 1360
```

```bash
# Linux (nftables)
$ sudo nft add rule inet filter forward tcp flags syn tcp option maxseg size set rt mtu
```

💡 **MSS clamping adalah solusi paling andal untuk MTU black hole di tunnel**, karena tidak bergantung pada ICMP yang mungkin diblokir.

---

## 10. Analisis TCP di Wireshark

### Display filter penting
```
tcp.flags.syn == 1 && tcp.flags.ack == 0    ← SYN saja (permintaan koneksi baru)
tcp.flags.reset == 1                         ← RST
tcp.analysis.retransmission                  ← retransmisi
tcp.analysis.fast_retransmission
tcp.analysis.duplicate_ack
tcp.analysis.zero_window
tcp.analysis.out_of_order
tcp.analysis.lost_segment
tcp.analysis.flags                           ← SEMUA masalah TCP sekaligus
tcp.stream eq 5                              ← satu koneksi saja
tcp.time_delta > 1                           ← jeda > 1 detik
```

### Menafsirkan temuan

| Temuan Wireshark | Kemungkinan penyebab |
|---|---|
| **Retransmission** banyak | Packet loss di jaringan; kemacetan; kabel/wireless bermasalah |
| **Duplicate ACK** (3+) | Paket hilang di tengah; segera diikuti fast retransmit |
| **Out-of-order** | Load balancing per-packet; jalur berbeda; bukan selalu masalah |
| **Zero window** | **Aplikasi penerima terlalu lambat membaca** — masalah server, bukan jaringan |
| **Window full** | Pengirim mencapai batas window; jika sering, window terlalu kecil untuk BDP |
| **RST** di tengah sesi | Firewall/IPS memutus; aplikasi crash; timeout NAT/LB |
| **TCP Previous segment not captured** | Paket hilang sebelum titik capture |
| **Keep-Alive** | Koneksi idle; normal |
| **Spurious retransmission** | Retransmisi yang tidak perlu — RTO terlalu agresif atau ACK terlambat |

💡 **Aturan diagnosis:** kalau retransmisi terlihat di **kedua** titik capture (klien dan server), loss terjadi **antara** keduanya. Kalau hanya terlihat di sisi pengirim, loss terjadi dekat pengirim.

### Perintah cepat tanpa Wireshark
```bash
# Statistik TCP sistem
$ ss -s
$ netstat -s | grep -iE 'retrans|segments|reset'
$ nstat -az | grep -i retrans

# Info per koneksi
$ ss -tin dst 1.2.3.4
    cubic wscale:7,7 rto:212 rtt:11.5/2.1 ato:40 mss:1448
    cwnd:10 ssthresh:7 bytes_sent:52310 bytes_acked:52310
    bytes_received:1200 segs_out:40 segs_in:22
    data_segs_out:38 send 10.1Mbps lastsnd:12 lastrcv:12
    pacing_rate 20.2Mbps delivery_rate 8.9Mbps retrans:0/3 rcv_space:14480

# Tangkap handshake saja
$ sudo tcpdump -ni any 'tcp[tcpflags] & (tcp-syn|tcp-fin|tcp-rst) != 0'
```

---

## 11. Tuning TCP di Linux

```bash
# Lihat setelan buffer (min, default, max)
$ sysctl net.ipv4.tcp_rmem net.ipv4.tcp_wmem
net.ipv4.tcp_rmem = 4096	131072	6291456
net.ipv4.tcp_wmem = 4096	16384	4194304

# Untuk link long-fat (BDP besar), perbesar maksimum
$ sudo sysctl -w net.core.rmem_max=67108864
$ sudo sysctl -w net.core.wmem_max=67108864
$ sudo sysctl -w net.ipv4.tcp_rmem="4096 131072 67108864"
$ sudo sysctl -w net.ipv4.tcp_wmem="4096 65536 67108864"

# Algoritma congestion control
$ sysctl net.ipv4.tcp_congestion_control
$ sysctl net.ipv4.tcp_available_congestion_control
$ sudo sysctl -w net.ipv4.tcp_congestion_control=bbr

# Fitur penting (biarkan aktif)
$ sysctl net.ipv4.tcp_window_scaling    # = 1
$ sysctl net.ipv4.tcp_sack              # = 1
$ sysctl net.ipv4.tcp_timestamps        # = 1

# Perlindungan SYN flood
$ sudo sysctl -w net.ipv4.tcp_syncookies=1

# Jangan pakai (dihapus dari kernel modern)
# net.ipv4.tcp_tw_recycle  ← MERUSAK klien di balik NAT
```

⚠️ **Jangan menyalin setelan tuning dari internet tanpa mengukur.** Buffer terlalu besar menyebabkan bufferbloat dan latency tinggi. Ukur dengan `iperf3` sebelum dan sesudah.

---

## 12. Prinsip Transfer Andal: dari Stop-and-Wait ke Selective Repeat

> **Pendalaman.** Bagian ini tidak diuji di CCNA, Network+, maupun MTCNA. Isinya menjawab pertanyaan yang lebih mendasar: *mengapa* TCP dirancang seperti di bagian 4 sampai 6, bukan sekadar *apa* yang dilakukannya. Praktiknya ada di `lab/07-lab-membangun-protokol`, tempat Anda menulis sendiri protokol-protokol di bawah ini dan mengukurnya.

Sebagian struktur dan contoh di bagian ini diadaptasi dari *Computer Networks: A Systems Approach* (Larry Peterson & Bruce Davie, © Elsevier 2012, https://github.com/SystemsApproach/book, CC BY 4.0), bab 2.5 "Reliable Transmission". Perubahan: diterjemahkan ke bahasa Indonesia, disusun ulang, diberi contoh baru (Jakarta-Makassar, kegagalan jendela 4 nomor urut), dan dikaitkan ke TCP.

### 12.1 Masalahnya: kanal yang tidak bisa dipercaya

IP hanya berjanji "berusaha sebaik mungkin". Sebuah paket bisa hilang (antrean router penuh, gangguan radio), rusak (bit terbalik di kabel atau memori), datang dua kali (retransmisi di lapisan bawah), atau datang tidak berurutan (dua jalur ECMP dengan antrean berbeda). Tugas protokol transfer andal (*reliable data transfer*, sering disingkat rdt) adalah memberi aplikasi ilusi pipa sempurna di atas kanal seperti itu.

Cara termudah memahaminya: bangun protokol secara bertahap, mulai dari kanal yang paling ramah, lalu tambahkan satu jenis kerusakan setiap kali dan lihat mekanisme apa yang terpaksa muncul.

**Tahap 1: kanal sempurna.** Bila kanal tidak pernah menghilangkan, merusak, atau mengacak paket, pengirim cukup memotong data dan mengirimnya, dan penerima cukup menyerahkan apa yang datang. Tidak perlu header tambahan sama sekali. Tahap ini penting justru karena memperlihatkan bahwa *semua* kerumitan TCP adalah harga yang dibayar untuk kanal yang tidak sempurna.

**Tahap 2: kanal yang membalik bit.** Kini penerima harus bisa *mendeteksi* kerusakan dan *memberi tahu* pengirim. Muncul tiga mekanisme:

| Mekanisme | Fungsi |
|---|---|
| **Checksum** | Penerima menghitung ulang ringkasan isi paket. Bila tidak cocok, paket dianggap rusak |
| **ACK** (*acknowledgment*) | Penerima berkata "paket itu sampai dengan baik" |
| **NAK** (*negative acknowledgment*) | Penerima berkata "paket itu rusak, kirim lagi" |

Pengirim menunggu ACK atau NAK setelah setiap paket, lalu mengirim paket berikutnya atau mengulang paket yang sama. Skema "kirim, tunggu jawaban, ulangi bila perlu" disebut **ARQ** (*Automatic Repeat reQuest*).

Masalah baru langsung muncul: bagaimana kalau ACK atau NAK itu sendiri yang rusak? Pengirim tidak tahu jawaban apa yang dimaksud, jadi satu-satunya langkah aman adalah mengirim ulang. Akibatnya penerima bisa menerima paket yang sama dua kali tanpa bisa membedakannya dari paket baru. Solusinya adalah **nomor urut** (*sequence number*): setiap paket diberi nomor, sehingga duplikat bisa dikenali dan dibuang (tetapi tetap di-ACK). Untuk protokol yang hanya mengirim satu paket sebelum menunggu, nomor 0 dan 1 secara bergantian sudah cukup.

Satu penyederhanaan lagi: NAK sebenarnya tidak wajib. Penerima bisa mengirim ACK untuk paket *terakhir yang diterima dengan benar*. Pengirim yang menerima ACK untuk paket lama tahu paket terbarunya bermasalah. Pola "ACK duplikat sebagai pengganti NAK" inilah yang dipakai TCP (duplicate ACK di bagian 6).

**Tahap 3: kanal yang juga menghilangkan paket.** Kalau paket data atau ACK hilang, tidak ada yang datang sama sekali, jadi menunggu jawaban bisa berlangsung selamanya. Mekanisme yang hilang adalah **timer**: pengirim menyalakan timer setiap kali mengirim, dan mengirim ulang bila timer habis sebelum ACK datang. Timer yang terlalu pendek menghasilkan duplikat (yang sudah bisa ditangani berkat nomor urut). Timer yang terlalu panjang membuat pemulihan lambat. Itulah alasan TCP menghitung RTO dari RTT terukur (bagian 6).

Ringkasnya, empat bahan dasar protokol andal adalah **checksum, ACK, nomor urut, dan timer**. Semua protokol transfer andal yang Anda temui, dari TCP, QUIC, sampai lapisan link nirkabel 802.11, adalah variasi dari kombinasi keempatnya.

💡 Checksum yang dipakai IPv4, UDP, dan TCP adalah *Internet checksum* (RFC 1071): jumlah one's complement dari kata-kata 16 bit. Ia murah dihitung dan selalu mendeteksi error satu bit, tetapi lemah terhadap pola tertentu, misalnya dua kata 16 bit yang tertukar posisi. Karena itu Ethernet menambahkan CRC-32 yang jauh lebih kuat di setiap hop, dan TLS menambahkan MAC kriptografis di ujung ke ujung.

### 12.2 Stop-and-wait dan utilisasinya

Protokol tahap 3 disebut **stop-and-wait**: kirim satu paket, berhenti, tunggu ACK. Protokol ini benar, tetapi seberapa efisien? Definisikan:

```
L   = ukuran paket (bit)
R   = laju link (bit/s)
RTT = waktu pulang-pergi
L/R = waktu menaruh seluruh bit paket ke kabel (waktu transmisi)

Utilisasi pengirim U = waktu link benar-benar sibuk / waktu satu siklus
                     = (L/R) / (RTT + L/R)
```

**Contoh: link 1 Gbps Jakarta-Makassar.** Jarak lurus kedua kota sekitar 1.400 km. Kabel laut dan darat tidak pernah lurus, jadi anggap panjang jalur serat sekitar 2.000 km (angka asumsi untuk latihan, bukan data operator). Cahaya di serat merambat sekitar 2 × 10⁸ m/s, sehingga:

```
Tunda propagasi satu arah = 2.000 km / 200.000 km/s = 10 ms
RTT (propagasi saja)      ≈ 20 ms
L/R untuk paket 1.500 byte di 1 Gbps = 12.000 bit / 10⁹ bit/s = 12 µs

U = 0,012 ms / (20 ms + 0,012 ms) ≈ 0,0006 = 0,06%
Throughput = 12.000 bit / 20,012 ms ≈ 600 kbit/s
```

Link 1 Gbps yang Anda bayar mahal hanya terpakai 0,06%. Throughput-nya setara paket data seluler yang buruk, padahal tidak ada satu paket pun yang hilang. Penyebabnya bukan bandwidth, melainkan **menunggu**: pengirim menganggur 99,94% waktu sambil menunggu ACK menempuh 2.000 km kembali. Ping nyata Jakarta-Makassar biasanya lebih besar dari 20 ms karena antrean dan rute yang memutar, yang membuat stop-and-wait makin buruk.

Ini adalah wujud lain dari **BDP** (`00-fondasi/03`): link ini mampu "menampung" 10⁹ × 0,020 = 20 Mbit = 2,5 MB data yang sedang dalam perjalanan, sedangkan stop-and-wait hanya mengisinya dengan 1.500 byte.

### 12.3 Pipelining: banyak paket dalam perjalanan

Solusinya jelas: izinkan pengirim mengirim **N paket** sebelum harus menunggu ACK. Teknik ini disebut **pipelining** atau **sliding window**, dan N disebut ukuran jendela.

```
U = min(1, N × (L/R) / (RTT + L/R))

Agar U = 1 di link Jakarta-Makassar:
N ≥ (RTT + L/R) / (L/R) = 20,012 / 0,012 ≈ 1.668 paket ≈ 2,5 MB
```

Pipelining membawa tiga konsekuensi:
1. Nomor urut harus mencakup lebih dari 0 dan 1, karena banyak paket belum di-ACK sekaligus.
2. Pengirim harus **menyangga** (*buffer*) semua paket yang belum di-ACK, karena mungkin harus mengirim ulang.
3. Harus ada aturan tentang apa yang dilakukan bila satu paket di tengah jendela hilang. Dua jawaban klasiknya adalah **Go-Back-N** dan **Selective Repeat**.

### 12.4 Go-Back-N

Aturan Go-Back-N (GBN):
- **Pengirim** boleh punya paling banyak N paket yang belum di-ACK. Ia memakai **satu timer** untuk paket tertua. Bila timer habis, ia mengirim ulang **semua** paket yang belum di-ACK.
- **Penerima** hanya menerima paket yang tepat diharapkan (jendela penerima = 1). Paket lain dibuang, dan penerima mengulang ACK terakhirnya.
- **ACK bersifat kumulatif**: "ACK k" berarti "semua sebelum k sudah saya terima, kirim mulai k" (gaya TCP).

Timeline dengan N = 4, paket 2 hilang:

```
Pengirim (N=4)                                   Penerima (harap=0)
  │ pkt0 ─────────────────────────────────────────►│ terima, ACK1
  │ pkt1 ─────────────────────────────────────────►│ terima, ACK2
  │ pkt2 ─────────────────X  (hilang)              │
  │ pkt3 ─────────────────────────────────────────►│ bukan 2: BUANG, ACK2 (duplikat)
  │◄──────────────────────────────────────── ACK1  │
  │◄──────────────────────────────────────── ACK2  │ jendela bergeser: 2,3,4,5
  │ pkt4 ─────────────────────────────────────────►│ BUANG, ACK2
  │ pkt5 ─────────────────────────────────────────►│ BUANG, ACK2
  │◄─────────────────────────────── ACK2 ACK2 ACK2 │
  │                                                │
  │ ... timer pkt2 habis: kirim ulang 2,3,4,5 ...  │
  │ pkt2 ─────────────────────────────────────────►│ terima, ACK3
  │ pkt3 ─────────────────────────────────────────►│ terima, ACK4
  │ pkt4 ─────────────────────────────────────────►│ terima, ACK5
  │ pkt5 ─────────────────────────────────────────►│ terima, ACK6
```

Paket 3, 4, dan 5 sebenarnya tiba dengan selamat, tetapi tetap dikirim dua kali. Kelebihan GBN adalah kesederhanaannya: penerima tidak perlu buffer, dan pengirim hanya perlu satu timer. Kelemahannya terasa pada link dengan BDP besar dan loss: dengan jendela 1.668 paket, satu paket hilang bisa memicu pengiriman ulang ribuan paket yang sebenarnya sudah sampai.

### 12.5 Selective Repeat

Selective Repeat (SR) mengirim ulang **hanya paket yang benar-benar hilang**:
- **Penerima** punya jendela berukuran N. Paket di dalam jendela diterima dan disangga walau tidak berurutan. Data baru diserahkan ke aplikasi setelah urutannya lengkap.
- **ACK bersifat individual**: "ACK k" berarti "paket k sampai".
- **Pengirim** memasang timer per paket (secara logis), dan hanya paket yang timernya habis yang dikirim ulang.

```
Pengirim (N=4)                                   Penerima (jendela 0..3)
  │ pkt0 ─────────────────────────────────────────►│ serahkan 0, ACK0
  │ pkt1 ─────────────────────────────────────────►│ serahkan 1, ACK1
  │ pkt2 ─────────────────X                        │
  │ pkt3 ─────────────────────────────────────────►│ SANGGA 3, ACK3
  │◄───────────────────────────────── ACK0 ACK1    │ jendela: 2..5
  │ pkt4 ─────────────────────────────────────────►│ SANGGA 4, ACK4
  │ pkt5 ─────────────────────────────────────────►│ SANGGA 5, ACK5
  │◄──────────────────────────── ACK3 ACK4 ACK5    │
  │                                                │
  │ ... timer pkt2 habis: kirim ulang HANYA 2 ...  │
  │ pkt2 ─────────────────────────────────────────►│ serahkan 2,3,4,5 sekaligus, ACK2
```

Di simulator lab (kanal 10 Mbps, RTT 20 ms, 5% paket hilang di kedua arah, jendela 32, data 300 KB), GBN mengirim dua sampai dua setengah kali lebih banyak paket daripada SR untuk data yang sama, dan goodput SR sekitar 1,5 sampai 2,6 kali goodput GBN pada tiga seed acak yang dicoba. Anda akan mengukurnya sendiri di `lab/07-lab-membangun-protokol`.

| | Go-Back-N | Selective Repeat |
|---|---|---|
| Jendela penerima | 1 | N |
| Buffer penerima | Tidak perlu | Perlu (paket di luar urutan) |
| ACK | Kumulatif | Individual |
| Timer | Satu, untuk paket tertua | Per paket |
| Saat loss | Kirim ulang seluruh jendela | Kirim ulang paket yang hilang saja |
| Cocok untuk | Loss rendah, perangkat sederhana | BDP besar dengan loss |

### 12.6 Batas ukuran jendela terhadap ruang nomor urut

Field nomor urut punya panjang terbatas. Dengan k bit, tersedia 2ᵏ nomor yang dipakai berputar: 0, 1, ..., 2ᵏ−1, 0, 1, .... Pertanyaannya: seberapa besar jendela boleh dibuat sebelum penerima tidak lagi bisa membedakan paket *baru* bernomor x dari paket *lama* bernomor x yang dikirim ulang?

```
Go-Back-N        : N ≤ 2ᵏ − 1
Selective Repeat : N ≤ 2ᵏ / 2 = 2ᵏ⁻¹
Umum (P&D)       : jendela_kirim + jendela_terima ≤ 2ᵏ
```

**Contoh kegagalan SR (diadaptasi dari P&D).** Nomor urut 3 bit: 0..7. Misalkan jendela pengirim dan penerima sama-sama 7. Pengirim mengirim paket 0..6, semuanya sampai, penerima menyerahkannya ke aplikasi dan menggeser jendelanya menjadi 7, 0, 1, 2, 3, 4, 5. Lalu **semua ACK hilang**. Timer pengirim habis dan ia mengirim ulang paket 0 yang *lama*. Penerima melihat nomor 0 berada di dalam jendelanya dan menerimanya sebagai paket 0 yang *baru*. Data rusak, dan tidak ada yang tahu.

Contoh yang lebih kecil, yang juga diuji otomatis di lab: ruang 4 nomor (0..3), jendela SR = 3 (melebihi batas 2).

```
Pengirim                  Penerima                 Jendela penerima
  │ 0 (A) ──────────────►  serahkan A               [1 2 3]
  │ 1 (B) ──────────────►  serahkan B               [2 3 0]
  │ 2 (C) ──────────────►  serahkan C               [3 0 1]
  │      X◄──── ACK0,1,2 semuanya hilang
  │ timeout: 0 (A) ─────►  nomor 0 ada di jendela [3 0 1]
  │                        → disangga sebagai paket BARU (posisi E)
  │ ...
  Hasil di aplikasi: A B C D A B ...   (seharusnya A B C D E F ...)
```

Dengan jendela 2, jendela penerima setelah menyerahkan A dan B adalah [2 3], yang tidak tumpang tindih dengan nomor paket lama yang mungkin dikirim ulang (0 dan 1), sehingga duplikat dikenali dengan benar. Intuisinya: SR berayun di antara dua paruh ruang nomor urut, persis seperti stop-and-wait berayun antara 0 dan 1.

⚠️ **Aturan di atas mengandaikan kanal tidak mengacak urutan.** Di link titik-ke-titik, satu frame tidak bisa menyalip frame lain. Di Internet bisa: paket lama yang tertahan di antrean panjang bisa muncul jauh setelah nomor urutnya dipakai ulang. Lab 7.2 memperlihatkan bahwa GBN dengan ruang 8 nomor merusak data begitu kanal mengacak urutan, padahal jendelanya sah. Karena itu TCP memakai nomor urut 32 bit yang menghitung **byte**, membatasi umur paket di jaringan (**MSL**, alasan adanya TIME_WAIT di bagian 7), dan pada link sangat cepat menambah **PAWS** (*Protection Against Wrapped Sequences*, RFC 7323) berbasis timestamp. Pada 1 Gbps, 2³² byte habis dalam sekitar 34 detik, cukup dekat dengan MSL sehingga perlindungan tambahan itu memang dibutuhkan.

### 12.7 Kaitan ke TCP nyata

TCP bukan GBN murni dan bukan SR murni, melainkan hibrida yang mengambil bagian terbaik dari keduanya:

| Gagasan rdt | Wujudnya di TCP |
|---|---|
| Nomor urut per paket | Nomor urut per **byte** (bagian 2); segmen bisa dipecah dan digabung ulang |
| ACK kumulatif (GBN) | Field Acknowledgment Number: "byte berikutnya yang saya harapkan" |
| Penerima menyangga data di luar urutan (SR) | Penerima TCP modern menyimpan segmen di luar urutan, tidak membuangnya |
| ACK individual (SR) | Opsi **SACK** (RFC 2018): ACK kumulatif ditambah daftar blok yang sudah diterima |
| ACK duplikat sebagai NAK | **Fast retransmit** setelah 3 duplicate ACK (RFC 5681), tanpa menunggu timer |
| Timer | **Satu** timer retransmisi per koneksi dengan RTO adaptif (RFC 6298) |
| Ukuran jendela N | `min(rwnd, cwnd)`: jendela penerima (flow control) dan jendela kemacetan (congestion control) |

Dua catatan penting:
- Jendela TCP **tidak tetap**. Jendela GBN/SR di atas adalah konstanta, sedangkan TCP mengubah `cwnd` terus-menerus untuk menebak kapasitas jaringan (`05-transport/04`). Itulah perbedaan terbesar antara protokol buku teks dan TCP sungguhan.
- Deteksi kehilangan di Linux modern tidak lagi hanya menghitung tiga duplicate ACK. Dokumentasi kernel menyebut **RACK** (RFC 8985) sebagai satu-satunya algoritma deteksi kehilangan yang didukung (`net.ipv4.tcp_recovery`). RACK memakai waktu kirim segmen untuk memutuskan apakah suatu segmen hilang atau sekadar terlambat karena reordering. Gagasannya tetap sama dengan bagian ini: gabungkan ACK kumulatif, informasi selektif, dan timer.

💡 **Cara membaca Wireshark dengan kacamata baru:** `tcp.analysis.duplicate_ack` adalah "NAK" gaya rdt; `tcp.analysis.fast_retransmission` adalah pengirim yang bereaksi sebelum timer habis; blok SACK di opsi TCP adalah ACK individual Selective Repeat; dan `tcp.analysis.retransmission` tanpa duplicate ACK sebelumnya biasanya berarti timer (RTO) yang habis, yaitu jalur pemulihan paling lambat.

---

## 13. Ringkasan

- TCP menjamin: pengiriman, urutan, tanpa duplikat, tanpa korupsi, flow control, congestion control. **Tidak menjamin batas pesan** — TCP adalah byte-stream.
- **Seq** = nomor byte pertama segmen; **Ack** = byte berikutnya yang diharapkan. ISN acak untuk keamanan.
- **Three-way handshake** (SYN, SYN-ACK, ACK) menyinkronkan kedua arah dan menegosiasikan MSS, window scale, SACK, timestamps. Biaya 1 RTT.
- **Window scale hanya bisa dinegosiasikan di SYN** — middlebox yang menghapusnya membatasi throughput.
- **Flow control** melindungi penerima (window); **congestion control** melindungi jaringan (cwnd).
- **Fast retransmit** dipicu 3 duplicate ACK; **SACK** memungkinkan retransmisi yang tepat sasaran.
- Penutupan **four-way** (FIN masing-masing arah); **RST** = paksa. **TIME_WAIT 2×MSL** pada sisi yang menutup duluan.
- **`CLOSE_WAIT` menumpuk = bug aplikasi** (lupa `close()`). **Zero window = aplikasi penerima lambat.**
- MSS = MTU − 40. **MSS clamping** adalah solusi paling andal untuk MTU black hole di tunnel.
- Jangan pakai `tcp_tw_recycle` (dihapus dari kernel).
- Transfer andal dibangun dari **checksum, ACK, nomor urut, dan timer**. Stop-and-wait benar tetapi boros pada BDP besar; pipelining (GBN, SR) mengisi pipa. Jendela dibatasi ruang nomor urut (GBN ≤ 2ᵏ−1, SR ≤ 2ᵏ⁻¹), dan TCP adalah hibrida keduanya: ACK kumulatif + SACK + fast retransmit.

---

## 14. Latihan

1. Kenapa handshake TCP butuh tiga langkah, bukan dua?
2. Pengirim mengirim segmen dengan `seq=5000, len=500`. Berapa `ack` yang dikirim penerima?
3. Anda melihat ribuan socket dalam state `CLOSE_WAIT` di server. Apa penyebabnya dan siapa yang harus memperbaiki?
4. Wireshark menunjukkan banyak "TCP Zero Window" dari server ke klien. Apa artinya?
5. Link 1 Gbps dengan RTT 150 ms hanya memberi throughput 3,5 Mbps. Diagnosis dan perbaikan?
6. Apa fungsi TIME_WAIT dan kenapa `tcp_tw_recycle` berbahaya?
7. Aplikasi RPC kecil menunjukkan latency konsisten ~40 ms padahal RTT jaringan hanya 1 ms. Apa dugaan Anda?
8. Jelaskan perbedaan flow control dan congestion control.
9. Sebuah aplikasi telemetri lama di kantor cabang Makassar mengirim data ke server di Jakarta dengan protokol buatan vendor di atas UDP: kirim satu blok 1.000 byte, tunggu ACK, baru kirim blok berikutnya. Link WAN 100 Mbps, RTT terukur 30 ms. Berapa throughput maksimum aplikasi itu dan berapa utilisasi link-nya? Vendor menawarkan "upgrade link ke 1 Gbps". Apakah itu menolong, dan apa saran Anda?
10. Anda merancang protokol Selective Repeat dengan field nomor urut 4 bit. Rekan Anda memakai jendela 12 "supaya pipa penuh". Berapa jendela maksimum yang aman, dan jelaskan satu skenario konkret yang merusak data bila jendela 12 dipakai.

<details>
<summary>Jawaban</summary>

1. Karena TCP **full duplex** — kedua arah harus disinkronkan secara independen. Langkah 1 (SYN) menyinkronkan ISN klien; langkah 2 (SYN-ACK) mengonfirmasi ISN klien **dan** mengirim ISN server; langkah 3 (ACK) mengonfirmasi ISN server. Dengan hanya dua langkah, server tidak akan pernah tahu apakah klien menerima SYN-ACK-nya, sehingga tidak bisa yakin arah server→klien tersinkronisasi. Handshake juga memungkinkan kedua sisi menegosiasikan opsi (MSS, window scale, SACK).

2. Segmen berisi byte 5000–5499, sehingga penerima menjawab **`ack=5500`** — "saya sudah punya semua sampai 5499, kirim mulai 5500".

3. `CLOSE_WAIT` berarti sisi lain sudah mengirim FIN (menutup arahnya), dan kernel sudah membalas ACK, tetapi **aplikasi lokal belum memanggil `close()`** pada socket tersebut. Ini adalah **bug aplikasi** — kebocoran file descriptor, bukan masalah jaringan. Yang harus memperbaiki: **tim pengembang aplikasi**. Gejala lanjutannya: "too many open files" dan server berhenti menerima koneksi baru.

4. Server mengiklankan `window=0`, artinya **buffer penerimaan server penuh** — aplikasi di server tidak membaca data dari socket buffer cukup cepat. Ini menunjukkan bottleneck di **aplikasi/server** (CPU-bound, disk-bound, thread pool habis, atau lock contention), bukan di jaringan. Menambah bandwidth tidak akan membantu.

5. **Window TCP terlalu kecil untuk BDP.** BDP = 1e9 × 0,15 / 8 = **18,75 MB**. Throughput 3,5 Mbps setara window ≈ 3,5e6 × 0,15 / 8 ≈ 65 KB — persis batas window 16-bit tanpa scaling.
   **Diagnosis:** `ss -tin` untuk memeriksa `wscale`; jika `wscale:0,0` maka window scaling tidak aktif atau dihapus middlebox. Periksa juga `tcp_rmem`/`tcp_wmem`.
   **Perbaikan:** pastikan `net.ipv4.tcp_window_scaling=1` di kedua sisi; perbesar `net.core.rmem_max`/`wmem_max` dan `tcp_rmem`/`tcp_wmem`; cari middlebox (firewall/IPS lama) yang menghapus opsi window scale dari SYN dan perbaiki/lewati. Alternatif sementara: transfer paralel multi-stream.

6. **TIME_WAIT** menahan socket selama 2×MSL setelah penutupan untuk dua alasan: (a) memastikan ACK terakhir sampai — jika hilang, sisi lain akan mengirim ulang FIN dan socket ini masih ada untuk membalasnya; (b) mencegah segmen "nyasar" dari koneksi lama muncul di koneksi baru dengan 5-tuple identik dan merusak data.
   **`tcp_tw_recycle` berbahaya** karena ia memakai TCP timestamp per-alamat-sumber untuk mempercepat daur ulang. Klien-klien berbeda di balik satu NAT terlihat berasal dari IP yang sama tetapi punya nilai timestamp yang tidak berurutan — server akan **membuang koneksi sah** dari sebagian klien secara acak. Karena itu opsi ini **dihapus dari kernel Linux sejak versi 4.12**. Gunakan `tcp_tw_reuse` (aman, hanya untuk koneksi keluar) dan perbaikan di tingkat aplikasi (keep-alive, connection pooling).

7. **Interaksi Nagle's algorithm dengan Delayed ACK.** Nagle menahan segmen kecil sampai ACK sebelumnya diterima; Delayed ACK menahan ACK sampai ~40 ms atau sampai ada data balasan. Ketika keduanya bertemu pada pola request-response kecil, terjadi jeda 40 ms per transaksi. **Perbaikan:** aktifkan `TCP_NODELAY` (mematikan Nagle) pada socket aplikasi yang latency-sensitif, atau gabungkan penulisan kecil menjadi satu `send()`.

8. **Flow control** melindungi **penerima** dari kebanjiran: penerima mengiklankan `window` sesuai kapasitas buffer-nya, dan pengirim tidak boleh melebihi itu. Sifatnya **end-to-end** dan eksplisit.
   **Congestion control** melindungi **jaringan** dari kebanjiran: pengirim memelihara `cwnd` (congestion window) yang diperkirakan sendiri berdasarkan sinyal tidak langsung (packet loss, RTT, ECN) — jaringan tidak pernah memberi tahu kapasitasnya secara eksplisit.
   Pengirim dibatasi oleh **nilai terkecil** dari keduanya: `jumlah data in-flight ≤ min(rwnd, cwnd)`.

9. Ini stop-and-wait. L = 8.000 bit, R = 100 Mbps, jadi L/R = 0,08 ms. Satu siklus = RTT + L/R = 30,08 ms, sehingga **throughput ≈ 8.000 bit / 30,08 ms ≈ 266 kbit/s** dan **utilisasi ≈ 0,08 / 30,08 ≈ 0,27%**. Upgrade ke 1 Gbps hanya memperkecil L/R menjadi 0,008 ms: throughput naik dari sekitar 266 menjadi sekitar 267 kbit/s, praktis **tidak menolong**, karena hambatannya RTT, bukan bandwidth. Saran: minta vendor mendukung **pipelining** (jendela beberapa blok, idealnya mendekati BDP = 100 Mbps × 30 ms = 375 KB, sekitar 375 blok), atau beralih ke TCP/QUIC yang sudah melakukannya; sebagai tambalan sementara, jalankan beberapa sesi paralel. Ukur dulu dengan `ping` dan perhitungan ini sebelum membayar link lebih besar.

10. Ruang nomor urut 4 bit = 16 nomor. Untuk Selective Repeat, **jendela maksimum = 16 / 2 = 8**. Dengan jendela 12: pengirim mengirim paket 0..11, semuanya sampai, penerima menyerahkannya dan menggeser jendela menjadi 12, 13, 14, 15, 0, 1, ..., 7. Seluruh ACK hilang. Timer pengirim habis dan ia mengirim ulang paket 0 yang **lama**. Nomor 0 berada di dalam jendela penerima, jadi paket lama itu diterima sebagai paket **baru** bernomor 16 (yang di kabel juga bernomor 0) dan nanti diserahkan ke aplikasi di posisi yang salah. Data rusak tanpa ada error yang terdeteksi, karena checksum hanya memeriksa keutuhan isi, bukan "kebaruan" paket. Dengan jendela 8, jendela penerima setelah paket 0..7 adalah 8..15, yang tidak tumpang tindih dengan nomor lama 0..7, sehingga duplikat dikenali. Ingat juga bahwa batas ini hanya berlaku bila kanal tidak mengacak urutan; di Internet dibutuhkan ruang nomor urut yang jauh lebih besar ditambah batas umur paket (MSL), seperti pada TCP.

</details>

---

## 15. Sumber

- RFC 9293 — Transmission Control Protocol (menggantikan RFC 793)
- RFC 7323 — TCP Extensions for High Performance (window scale, timestamps)
- RFC 2018 — TCP Selective Acknowledgment Options
- RFC 6528 — Defending against Sequence Number Attacks
- RFC 7413 — TCP Fast Open
- Cisco CCNA 200-301 v1.1, topik 1.5 (Compare TCP to UDP)
- Wireshark TCP Analysis — https://www.wireshark.org/docs/wsug_html_chunked/ChAdvTCPAnalysis.html
- Computer Networks: A Systems Approach, bab 2.5 Reliable Transmission (Peterson & Davie, CC BY 4.0): https://book.systemsapproach.org/direct/reliable.html
- RFC 1071, Computing the Internet Checksum: https://www.rfc-editor.org/rfc/rfc1071
- RFC 5681, TCP Congestion Control (fast retransmit): https://www.rfc-editor.org/rfc/rfc5681
- RFC 6298, Computing TCP's Retransmission Timer: https://www.rfc-editor.org/rfc/rfc6298
- RFC 8985, The RACK-TLP Loss Detection Algorithm for TCP: https://www.rfc-editor.org/rfc/rfc8985
- Dokumentasi kernel Linux, ip-sysctl (`tcp_recovery`): https://docs.kernel.org/networking/ip-sysctl.html

---

**Berikutnya:** `05-transport/03-udp-quic.md` — protokol tanpa jaminan dan penerusnya.

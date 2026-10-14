# 11.3 — Quality of Service (QoS)

> **Prasyarat:** `11-wan-vpn/01`, `05-transport/04`
> **Tujuan:** Anda paham model QoS, bisa merancang kebijakan end-to-end, dan mengonfigurasinya di Cisco, MikroTik, dan Linux.

---

## 1. Kenapa QoS Diperlukan

```
Link WAN 20 Mbps:
  - Backup malam berjalan (mengambil semua bandwidth)
  - Panggilan VoIP putus-putus
  - Aplikasi ERP timeout
  - Video conference tidak bisa dipakai

Tanpa QoS: semua trafik diperlakukan SAMA → yang paling rakus menang
Dengan QoS: Anda MEMUTUSKAN mana yang lebih penting
```

⚠️ **QoS tidak menciptakan bandwidth.** Ia hanya menentukan **siapa yang mengalah saat terjadi kemacetan**. Kalau link Anda selalu penuh, QoS memindahkan masalah, bukan menyelesaikannya — Anda tetap butuh bandwidth lebih.

💡 **QoS paling bernilai untuk trafik yang sensitif waktu** (suara, video, kontrol industri) di link yang **kadang** padat. Kalau link tidak pernah penuh, QoS tidak memberi perbedaan.

### Empat parameter yang dikelola QoS

| Parameter | Arti | Target VoIP |
|---|---|---|
| **Bandwidth** | Kapasitas yang tersedia | 87 kbps per panggilan (G.711 dengan overhead) |
| **Delay/Latency** | Waktu tempuh satu arah | **< 150 ms** (ITU-T G.114) |
| **Jitter** | Variasi delay | **< 30 ms** (ideal < 10 ms) |
| **Loss** | Paket hilang | **< 1%** (ideal 0%) |

### Kebutuhan per aplikasi

| Aplikasi | Bandwidth | Sensitif delay | Sensitif jitter | Sensitif loss |
|---|---|---|---|---|
| **VoIP** | Rendah (87 kbps) | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Video conference** | Sedang (1–4 Mbps) | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Video streaming** | Tinggi (5–25 Mbps) | ⭐ | ⭐ (buffer besar) | ⭐⭐ |
| **Aplikasi transaksi** | Rendah | ⭐⭐ | ⭐ | ⭐⭐⭐ |
| **Web browsing** | Sedang | ⭐⭐ | — | ⭐ |
| **Email** | Rendah | — | — | — |
| **Backup / file transfer** | Sangat tinggi | — | — | — |
| **Kontrol industri (SCADA)** | Sangat rendah | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

💡 **Perhatikan: VoIP butuh bandwidth SANGAT KECIL tetapi sangat sensitif delay dan jitter.** Ini kebalikan dari backup yang butuh bandwidth besar tetapi tidak peduli waktu. Justru itulah yang membuat QoS efektif — keduanya bisa dilayani dengan baik jika diprioritaskan dengan benar.

---

## 2. Tiga Model QoS

| Model | Cara kerja | Skalabilitas |
|---|---|---|
| **Best Effort** | Tidak ada QoS; semua sama | ✅ Tak terbatas |
| **IntServ** | Reservasi bandwidth per aliran (RSVP) | ❌ Tidak scalable |
| **DiffServ** | Klasifikasi ke beberapa kelas, perlakuan per-hop | ✅ **Standar saat ini** |

**DiffServ** [RFC 2474/2475] menang karena router tidak perlu menyimpan state per aliran — cukup melihat **marking** di header dan menerapkan **PHB** (Per-Hop Behavior).

---

## 3. Marking

### Layer 2: CoS (802.1p)

3 bit dalam tag VLAN 802.1Q (field PCP) → nilai 0–7.

⚠️ **CoS hanya ada di frame yang BERTAG VLAN.** Frame di access port tanpa tag tidak punya CoS. Karena itu marking L2 hilang begitu melewati router.

### Layer 3: DSCP

6 bit dalam byte ToS header IP → nilai 0–63.

```
┌────────────────────┬────────┐
│    DSCP (6 bit)    │ ECN (2)│
└────────────────────┴────────┘
```

**Nilai DSCP standar yang wajib dikenal:**

| DSCP | Nama | Nilai desimal | Untuk | CoS setara |
|---|---|---|---|---|
| **EF** | Expedited Forwarding | **46** | **VoIP (suara)** | 5 |
| **CS5** | Class Selector 5 | 40 | Broadcast video | 5 |
| **AF41** | Assured Forwarding 4-1 | **34** | **Video conference** | 4 |
| AF42 / AF43 | | 36 / 38 | Video (drop lebih tinggi) | 4 |
| **CS4** | | 32 | Real-time interaktif | 4 |
| **CS3** | | 24 | **Call signaling** (SIP, H.323) | 3 |
| **AF31** | | 26 | Multimedia streaming | 3 |
| **AF21** | | 18 | **Transaksional / aplikasi bisnis** | 2 |
| **CS2** | | 16 | Network management (OAM) | 2 |
| **AF11** | | 10 | Bulk data (backup) | 1 |
| **CS1** | | 8 | **Scavenger** (P2P, trafik yang boleh dikorbankan) | 1 |
| **BE / CS0** | Best Effort / Default | **0** | Default | 0 |

**Struktur AF (Assured Forwarding):**
```
AFxy   x = kelas (1–4, makin tinggi makin prioritas)
       y = drop precedence (1–3, makin tinggi makin cepat dibuang saat congestion)

AF41 : kelas 4, drop precedence rendah  ← paling dilindungi dalam kelasnya
AF43 : kelas 4, drop precedence tinggi  ← dibuang duluan saat congestion
```

💡 **Model 12-class Cisco** adalah acuan yang baik untuk desain enterprise. Untuk sebagian besar organisasi, **4–6 kelas sudah cukup** dan jauh lebih mudah dikelola.

### Trust Boundary

```
        ┌── TRUST BOUNDARY ──┐
        │                     │
[Telepon IP]──[Access SW]──[Distribution]──[Core]──[WAN]
   marking      TRUST /        trust         trust    trust
   sendiri      RE-MARK
        │                     │
   ⚠️ PC pengguna bisa memalsukan marking!
```

⚠️ **Jangan pernah mempercayai marking dari perangkat pengguna.** PC bisa menandai semua trafiknya sebagai EF (prioritas VoIP tertinggi) dan mendapat prioritas atas panggilan telepon yang sesungguhnya.

**Aturan trust boundary:**
```
✅ Percayai: telepon IP (dengan CDP/LLDP-MED verification), AP, server terkelola
❌ Jangan percayai: PC pengguna, perangkat tamu, perangkat BYOD
→ Re-mark atau reset ke 0 di access port
```

```
# Cisco — percayai telepon, tetapi bukan PC di belakangnya
SW1(config-if)# mls qos trust device cisco-phone
SW1(config-if)# mls qos trust cos

# Reset marking dari PC
SW1(config-if)# mls qos cos override
```

```
# MikroTik — reset DSCP dari LAN
/ip firewall mangle add chain=prerouting in-interface-list=LAN \
    action=change-dscp new-dscp=0 comment="Reset marking pengguna"
```

⚠️ **DSCP tidak dijamin dipertahankan di internet.** Sebagian besar ISP me-reset atau mengabaikan DSCP. QoS end-to-end hanya bisa dijamin di jaringan yang Anda kendalikan atau lewat MPLS dengan SLA.

---

## 4. Queueing — Bagaimana Antrean Dilayani

| Metode | Cara kerja | Masalah |
|---|---|---|
| **FIFO** | First In First Out | Tidak ada prioritas sama sekali |
| **PQ** (Priority Queuing) | Antrean prioritas dilayani sampai kosong | **Starvation** — antrean rendah bisa tidak pernah dilayani |
| **CQ** (Custom Queuing) | Round-robin dengan byte count | Tidak ada prioritas ketat untuk real-time |
| **WFQ** (Weighted Fair Queuing) | Aliran kecil didahulukan otomatis | Tidak bisa dikontrol manual |
| **CBWFQ** | Bandwidth minimum per kelas | Tidak ada prioritas ketat |
| **LLQ** (Low Latency Queuing) | **CBWFQ + priority queue dengan policing** | ✅ **Standar untuk voice** |

### LLQ — kombinasi yang benar

```
LLQ = Priority Queue (untuk voice) + CBWFQ (untuk sisanya)

Priority queue dilayani DULU (latency rendah)
TETAPI di-policing agar tidak menyebabkan starvation
```

⚠️ **Priority queue HARUS di-policing.** Tanpa batas, trafik yang salah masuk ke priority queue (atau serangan) bisa menghabiskan seluruh link dan membuat semua kelas lain kelaparan.

💡 **Aturan praktis: priority queue maksimal 33% dari bandwidth link.** Lebih dari itu, kelas lain mulai menderita.

### Congestion Avoidance

```
TAIL DROP (default):
  Antrean penuh → buang semua paket baru
  ❌ TCP global synchronization — semua aliran TCP turun bersamaan,
     lalu naik bersamaan → link berayun

WRED (Weighted Random Early Detection):
  Mulai membuang secara acak SEBELUM antrean penuh
  Paket dengan drop precedence tinggi (AF43) dibuang lebih dulu
  ✅ Mencegah global synchronization
```

⚠️ **Jangan pakai WRED pada priority queue (voice)** — membuang paket suara secara acak justru merusak.

---

## 5. Shaping vs Policing

Ini dua cara membatasi laju, dengan perilaku sangat berbeda.

```
POLICING:
  Melebihi rate → BUANG (atau turunkan marking)

  Rate
   │  ╱╲    ╱╲  ╱╲         ← trafik asli
   │─╱──╲──╱──╲╱──╲──── batas
   │╱    ╲╱        ╲
   → paket di atas garis DIBUANG

SHAPING:
  Melebihi rate → BUFFER dan kirim nanti

  Rate
   │  ╱╲    ╱╲  ╱╲
   │─────────────────── batas
   │ ▄▄▄▄▄▄▄▄▄▄▄▄▄▄     ← diratakan
   → paket di atas garis DITUNDA (di-buffer)
```

| | **Policing** | **Shaping** |
|---|---|---|
| Kelebihan trafik | **Dibuang** atau di-remark | **Di-buffer** |
| Buffer | Tidak ada | Ya |
| Menambah delay | ❌ Tidak | ✅ Ya |
| Dampak ke TCP | Retransmisi (boros) | Adaptasi mulus |
| Arah | Inbound & outbound | **Outbound saja** |
| Untuk | Menegakkan batas (provider) | Menyesuaikan ke kapasitas link |
| Burst | Tidak diratakan | Diratakan |

💡 **Gunakan shaping di sisi pelanggan, policing di sisi provider.**

⚠️ **Kasus klasik yang membutuhkan shaping:** port fisik 1 Gbps tetapi CIR yang dibeli hanya 20 Mbps. Tanpa shaping, router mengirim burst 1 Gbps; provider mem-policing dan **membuang** kelebihannya — menyebabkan packet loss dan retransmisi. Dengan shaping ke 19 Mbps di sisi Anda, trafik keluar rata dan **tidak ada yang dibuang**.

```
# Cisco — shape ke bawah CIR
policy-map SHAPE-KE-ISP
 class class-default
  shape average 19000000        ← 19 Mbps (95% dari CIR 20 Mbps)
   service-policy QOS-DALAM     ← QoS di dalam shaper
```

### Token Bucket

Mekanisme yang mendasari policing dan shaping.

```
CIR : Committed Information Rate — laju pengisian token
Bc  : Committed Burst — ukuran ember (berapa token bisa ditimbun)
Be   : Excess Burst — ember kedua untuk burst tambahan
Tc   : interval waktu = Bc / CIR
```

Paket boleh dikirim kalau ada token yang cukup. Token diisi ulang dengan laju CIR.

💡 **Bc terlalu kecil menyebabkan burst yang sah ikut dibuang.** Aturan umum: `Bc = CIR × 0,0125` (interval 12,5 ms) atau minimal cukup untuk satu MTU.

---

## 6. Konfigurasi Cisco (MQC)

**MQC** (Modular QoS CLI) memakai tiga langkah: **class-map → policy-map → service-policy**.

```
! ═══ 1. CLASS-MAP: trafik apa ═══
class-map match-all VOICE
 match dscp ef
class-map match-all VIDEO
 match dscp af41 af42 af43
class-map match-all SIGNALING
 match dscp cs3
class-map match-all KRITIS
 match dscp af21
class-map match-any SCAVENGER
 match dscp cs1
 match protocol bittorrent

! ═══ 2. POLICY-MAP: apa yang dilakukan ═══
policy-map QOS-WAN
 class VOICE
  priority percent 10                ← LLQ: priority queue + policing
 class VIDEO
  bandwidth percent 25
  random-detect dscp-based
 class SIGNALING
  bandwidth percent 5
 class KRITIS
  bandwidth percent 30
  random-detect dscp-based
 class SCAVENGER
  bandwidth percent 1
 class class-default
  bandwidth percent 25
  random-detect
  fair-queue

! ═══ 3. Shaping + QoS di dalamnya ═══
policy-map SHAPE-WAN
 class class-default
  shape average 19000000
   service-policy QOS-WAN

! ═══ 4. SERVICE-POLICY: terapkan ═══
interface GigabitEthernet0/0
 service-policy output SHAPE-WAN
```

**Verifikasi:**
```
show policy-map interface gi0/0
show policy-map interface gi0/0 output class VOICE
show class-map
show mls qos interface
```

⚠️ **`show policy-map interface` adalah perintah diagnostik utama** — menampilkan berapa paket masuk setiap kelas, berapa yang dibuang, dan apakah shaper aktif.

### Marking di edge

```
class-map match-all TANDAI-VOICE
 match protocol rtp audio
policy-map MARK-MASUK
 class TANDAI-VOICE
  set dscp ef
 class class-default
  set dscp default

interface GigabitEthernet0/1
 service-policy input MARK-MASUK
```

---

## 7. QoS di MikroTik

MikroTik memakai pendekatan berbeda: **mangle** untuk klasifikasi, **queue** untuk penjadwalan.

### Simple Queue — untuk kasus sederhana

```
# Batasi satu host
/queue simple add name=limit-pc1 target=192.168.1.50/32 max-limit=5M/5M

# Batasi seluruh subnet
/queue simple add name=limit-tamu target=192.168.30.0/24 max-limit=20M/20M

# Dengan burst
/queue simple add name=limit-staff target=192.168.10.0/24 \
    max-limit=50M/50M burst-limit=80M/80M burst-threshold=40M/40M burst-time=10s/10s

# Prioritas (1 = tertinggi, 8 = terendah)
/queue simple add name=voip target=192.168.10.0/24 \
    max-limit=2M/2M limit-at=2M/2M priority=1/1

/queue simple print stats
```

⚠️ **Urutan Simple Queue penting** — diproses dari atas ke bawah, queue pertama yang cocok yang dipakai. Gunakan `/queue simple move`.

### PCQ — Per Connection Queue (pembagian adil)

Ini fitur unggulan MikroTik untuk membagi bandwidth **secara adil antar-pengguna**.

```
# Buat tipe PCQ
/queue type add name=pcq-download kind=pcq pcq-rate=0 pcq-limit=50 \
    pcq-classifier=dst-address pcq-total-limit=2000
/queue type add name=pcq-upload kind=pcq pcq-rate=0 pcq-limit=50 \
    pcq-classifier=src-address pcq-total-limit=2000

# Terapkan — bandwidth dibagi RATA otomatis antar-pengguna aktif
/queue simple add name=bagi-rata target=192.168.10.0/24 \
    max-limit=50M/50M queue=pcq-upload/pcq-download
```

💡 **`pcq-rate=0` berarti bandwidth dibagi rata secara dinamis.** Kalau 10 pengguna aktif di link 50 Mbps, masing-masing dapat 5 Mbps; kalau hanya 2 yang aktif, masing-masing dapat 25 Mbps. **Ini yang membuat MikroTik populer di RT/RW-Net dan warnet** — tidak ada satu pengguna yang bisa menghabiskan seluruh bandwidth.

`pcq-classifier=dst-address` untuk download (membedakan per penerima), `src-address` untuk upload.

### Queue Tree — untuk kontrol penuh

```
# ═══ 1. MANGLE: tandai paket ═══
/ip firewall mangle
add chain=prerouting protocol=udp dst-port=5060 action=mark-connection \
    new-connection-mark=voip-conn passthrough=yes comment="SIP signaling"
add chain=prerouting protocol=udp dst-port=10000-20000 action=mark-connection \
    new-connection-mark=voip-conn passthrough=yes comment="RTP media"
add chain=prerouting connection-mark=voip-conn action=mark-packet \
    new-packet-mark=voip-pkt passthrough=no

add chain=prerouting protocol=tcp dst-port=443,80 action=mark-connection \
    new-connection-mark=web-conn passthrough=yes
add chain=prerouting connection-mark=web-conn action=mark-packet \
    new-packet-mark=web-pkt passthrough=no

add chain=prerouting action=mark-packet new-packet-mark=lainnya passthrough=no

# ═══ 2. QUEUE TREE ═══
/queue tree
add name=total parent=ether1-WAN max-limit=20M
add name=voip parent=total packet-mark=voip-pkt limit-at=3M max-limit=5M priority=1
add name=web  parent=total packet-mark=web-pkt  limit-at=8M max-limit=18M priority=5
add name=rest parent=total packet-mark=lainnya  limit-at=2M max-limit=15M priority=8

/queue tree print stats
```

⚠️ **FastTrack melewati mangle dan queue!** Kalau Anda memakai queue, kecualikan trafik yang perlu di-QoS dari FastTrack:
```
/ip firewall filter
add chain=forward action=accept connection-mark=voip-conn place-before=0
add chain=forward action=fasttrack-connection connection-state=established,related
```
Atau matikan FastTrack sepenuhnya kalau QoS lebih penting daripada throughput maksimum.

💡 **`limit-at` = bandwidth yang DIJAMIN; `max-limit` = maksimum yang boleh dipakai.** Jumlah semua `limit-at` tidak boleh melebihi `max-limit` induknya.

---

## 8. QoS di Linux (tc)

```bash
# HTB (Hierarchical Token Bucket)
$ sudo tc qdisc add dev eth0 root handle 1: htb default 30
$ sudo tc class add dev eth0 parent 1: classid 1:1 htb rate 20mbit
$ sudo tc class add dev eth0 parent 1:1 classid 1:10 htb rate 5mbit ceil 8mbit prio 1
$ sudo tc class add dev eth0 parent 1:1 classid 1:20 htb rate 10mbit ceil 18mbit prio 2
$ sudo tc class add dev eth0 parent 1:1 classid 1:30 htb rate 5mbit ceil 20mbit prio 3

# Filter berdasarkan DSCP
$ sudo tc filter add dev eth0 protocol ip parent 1:0 prio 1 u32 \
    match ip tos 0xb8 0xfc flowid 1:10        # DSCP EF (46)

# CAKE — jauh lebih sederhana dan sangat baik untuk link rumahan/kantor kecil
$ sudo tc qdisc replace dev eth0 root cake bandwidth 19Mbit diffserv4

$ tc -s qdisc show dev eth0
$ tc -s class show dev eth0
```

💡 **CAKE menggabungkan shaping, AQM (fq_codel), fair queuing, dan DiffServ dalam satu qdisc** — untuk sebagian besar kasus, satu baris CAKE mengalahkan konfigurasi HTB yang rumit. Ini juga solusi terbaik untuk bufferbloat (`05-transport/04`).

---

## 9. QoS Wireless (WMM)

**WMM** (Wi-Fi Multimedia) memetakan trafik ke empat **Access Category**:

| AC | Nama | Untuk | Prioritas |
|---|---|---|---|
| **AC_VO** | Voice | VoIP | Tertinggi |
| **AC_VI** | Video | Video streaming | Tinggi |
| **AC_BE** | Best Effort | Data umum | Sedang |
| **AC_BK** | Background | Backup, P2P | Terendah |

Prioritas diwujudkan lewat **AIFS dan contention window yang berbeda** — AC dengan prioritas tinggi menunggu lebih singkat sebelum mengirim.

⚠️ **WMM wajib aktif untuk sertifikasi Wi-Fi 4 ke atas**, dan diperlukan untuk 802.11n/ac/ax bekerja. Jangan pernah menonaktifkannya.

⚠️ **Wi-Fi adalah media bersama** — QoS wireless hanya mengatur **urutan giliran**, bukan bandwidth yang dijamin. Kalau airtime habis, semua terdampak.

---

## 10. Merancang Kebijakan QoS

### Langkah-langkah

```
1. IDENTIFIKASI aplikasi kritis bisnis
   → wawancara pengguna, analisis NetFlow, lihat data historis

2. UKUR kebutuhan bandwidth nyata
   → jangan menebak; pakai data monitoring

3. TENTUKAN jumlah kelas (4–6 untuk kebanyakan organisasi)
   Contoh model 5 kelas:
     - Voice        (EF)   : 10%
     - Signaling    (CS3)  : 5%
     - Kritis bisnis(AF21) : 30%
     - Best effort  (BE)   : 50%
     - Scavenger    (CS1)  : 5%

4. TENTUKAN trust boundary
   → di mana marking dipercaya, di mana di-reset

5. MARK sedekat mungkin dengan SUMBER

6. TERAPKAN queueing di titik CONGESTION (biasanya WAN edge)

7. SHAPE ke bawah CIR yang dibeli

8. MONITOR dan sesuaikan
```

### Prinsip

```
✅ Mark di edge, antre di titik congestion
✅ Voice: LLQ dengan policing, maksimal 33% link
✅ Jangan pakai WRED pada voice
✅ Shape ke 90–95% CIR (bukan bandwidth port)
✅ Sedikit kelas lebih baik daripada banyak
✅ Konsisten di SELURUH jalur — QoS end-to-end butuh semua hop
✅ Monitor dan sesuaikan berdasarkan data
```

```
❌ JANGAN percayai marking dari perangkat pengguna
❌ JANGAN buat 12 kelas kalau 4 sudah cukup
❌ JANGAN berharap DSCP dipertahankan di internet
❌ JANGAN pakai QoS sebagai pengganti bandwidth yang memadai
❌ JANGAN lupa FastTrack (MikroTik) melewati queue
```

⚠️ **QoS hanya berlaku pada arah KELUAR (egress) dari sebuah interface.** Anda tidak bisa mengontrol apa yang provider kirimkan ke Anda — hanya bisa mem-policing setelah tiba (yang sudah terlambat, bandwidth sudah terpakai). Untuk mengontrol arah masuk, Anda harus meminta provider menerapkan QoS di sisi mereka, atau memakai teknik tidak langsung seperti membatasi TCP window.

---

## 11. Troubleshooting QoS

```
1. Apakah paket masuk ke kelas yang benar?
   Cisco    : show policy-map interface gi0/0
              → periksa counter "Match" per kelas
   MikroTik : /ip firewall mangle print stats
              /queue tree print stats

2. Apakah ada drop?
   Cisco    : lihat "drops" pada output policy-map
   MikroTik : /queue tree print stats → kolom "dropped"

3. Apakah shaper aktif?
   → kalau tidak ada congestion, QoS tidak melakukan apa pun
   → uji dengan membebani link (iperf3)

4. Apakah marking bertahan sepanjang jalur?
   → capture di beberapa titik, periksa DSCP
   → banyak perangkat me-reset DSCP diam-diam

5. MikroTik: apakah FastTrack aktif?
   → FastTrack melewati mangle dan queue
```

```bash
# Verifikasi DSCP di paket nyata
$ sudo tcpdump -ni eth0 -v 'ip[1] & 0xfc == 0xb8'    # DSCP EF (46)
$ sudo tcpdump -ni eth0 -v ip and 'ip[1] != 0'       # semua yang bertanda

# Wireshark
ip.dsfield.dscp == 46
```

---

## 12. Ringkasan

- **QoS tidak menciptakan bandwidth** — ia menentukan siapa yang mengalah saat macet.
- Empat parameter: bandwidth, **delay (<150 ms)**, **jitter (<30 ms)**, **loss (<1%)** untuk VoIP.
- **DiffServ** adalah standar: klasifikasi ke kelas, perlakuan per-hop (PHB).
- Marking: **CoS (L2, 3 bit, hanya di frame bertag)**, **DSCP (L3, 6 bit)**. Hafalkan: **EF=46 voice, AF41=34 video, CS3=24 signaling, AF21=18 transaksional, CS1=8 scavenger, BE=0**.
- ⚠️ **Jangan percayai marking dari perangkat pengguna** — tetapkan **trust boundary** dan re-mark di access port.
- **LLQ** = priority queue (voice) + CBWFQ. **Priority queue harus di-policing**, maksimal ~33% link.
- **WRED** mencegah TCP global synchronization; **jangan dipakai pada voice**.
- **Policing membuang, shaping mem-buffer.** Gunakan **shaping ke 90–95% CIR** di sisi pelanggan.
- **MikroTik**: mangle untuk klasifikasi, **Simple Queue** untuk sederhana, **PCQ** untuk pembagian adil otomatis, **Queue Tree** untuk kontrol penuh. ⚠️ **FastTrack melewati queue**.
- **CAKE (Linux)** menggabungkan shaping + AQM + fair queuing + DiffServ dalam satu qdisc.
- **WMM** memberi empat access category di Wi-Fi; wajib aktif.
- **QoS hanya berlaku pada arah keluar** — arah masuk harus diatur provider.

---

## 13. Latihan

1. Kenapa VoIP butuh bandwidth kecil tetapi sangat diprioritaskan?
2. Apa perbedaan policing dan shaping? Kapan memakai masing-masing?
3. Port fisik 1 Gbps, CIR 50 Mbps. Kenapa Anda harus melakukan shaping, dan ke berapa?
4. Kenapa priority queue harus di-policing?
5. Jelaskan trust boundary dan apa yang terjadi kalau diabaikan.
6. Anda mengonfigurasi Queue Tree di MikroTik tetapi tidak berpengaruh sama sekali. Apa dugaan utama?
7. Rancang kebijakan QoS 5 kelas untuk kantor dengan link 30 Mbps: VoIP (20 panggilan), video conference, ERP, web, dan backup.
8. Kenapa DSCP sering tidak dipertahankan di internet?

<details>
<summary>Jawaban</summary>

1. Karena **kebutuhan bandwidth dan sensitivitas waktu adalah dua hal berbeda**. Satu panggilan VoIP G.711 hanya butuh ~87 kbps (termasuk overhead header) — sangat kecil dibanding video atau backup. Tetapi suara adalah **komunikasi real-time**: paket yang terlambat lebih dari 150 ms sudah tidak berguna, dan variasi delay (jitter) membuat suara terputus-putus.
   Justru kombinasi inilah yang membuat QoS sangat efektif untuk VoIP: memberi prioritas tertinggi pada trafik yang hanya memakan 5–10% bandwidth **hampir tidak merugikan** aplikasi lain, tetapi menyelamatkan kualitas panggilan sepenuhnya.

2. **Policing** membuang (atau menurunkan marking) paket yang melebihi rate — tidak ada buffer, tidak menambah delay, tetapi menyebabkan **packet loss dan retransmisi TCP** yang boros. Bisa diterapkan pada arah masuk maupun keluar.
   **Shaping** menahan paket berlebih dalam **buffer** dan mengirimkannya kemudian — meratakan burst, tidak ada paket yang dibuang, tetapi **menambah delay** dan hanya bisa diterapkan pada arah **keluar**.
   **Gunakan shaping di sisi pelanggan** untuk menyesuaikan trafik keluar dengan CIR yang dibeli, sehingga provider tidak perlu membuang apa pun. **Gunakan policing di sisi provider** untuk menegakkan batas kontrak — provider tidak mau menyediakan buffer untuk pelanggan yang melebihi kesepakatan.

3. Karena **router akan mengirim burst pada kecepatan port (1 Gbps)**, sementara provider hanya menjamin 50 Mbps dan akan **mem-policing** — membuang semua kelebihan. Setiap burst menyebabkan packet loss, yang memicu retransmisi TCP dan penurunan congestion window; hasilnya throughput efektif **jauh di bawah 50 Mbps** dan latency tidak stabil.
   Dengan shaping di sisi Anda, trafik keluar diratakan sehingga **tidak pernah melebihi batas** dan tidak ada yang dibuang.
   **Shape ke 90–95% dari CIR**, yaitu sekitar **45–47 Mbps**. Margin ini penting karena: overhead L2 yang tidak dihitung shaper, ketidaktepatan pengukuran, dan agar antrean terbentuk **di router Anda** (yang punya QoS) alih-alih di perangkat provider.

4. Karena **priority queue dilayani lebih dulu sampai kosong**. Tanpa batas, trafik yang masuk ke priority queue bisa **menghabiskan seluruh bandwidth link**, membuat semua kelas lain **kelaparan (starvation)** — bahkan trafik kritis lain dan protokol routing.
   Ini bisa terjadi karena: kesalahan klasifikasi (trafik besar salah ditandai EF), perangkat pengguna yang memalsukan marking, atau serangan yang sengaja mengirim trafik bertanda EF.
   **LLQ menambahkan policing implisit pada priority queue** — trafik di atas batas dibuang, sehingga kelas lain terlindungi. Aturan praktis: **priority queue maksimal ~33% bandwidth link**.

5. **Trust boundary** adalah titik dalam jaringan di mana Anda mulai **mempercayai marking QoS** yang ada di paket. Di luar batas itu (arah pengguna), marking harus diperiksa ulang: **dipercaya secara kondisional** (mis. telepon IP yang terverifikasi lewat CDP/LLDP-MED), **di-remark** sesuai kebijakan, atau **direset ke 0**.
   **Kalau diabaikan** — yaitu jika switch access mempercayai marking dari PC pengguna — maka pengguna (atau malware di PC-nya) bisa **menandai semua trafiknya sebagai EF**. Trafik itu akan masuk priority queue dan **mendapat prioritas di atas panggilan telepon yang sesungguhnya**, merusak seluruh kebijakan QoS. Satu pengguna yang mengunduh torrent bertanda EF bisa melumpuhkan sistem telepon perusahaan.

6. **FastTrack aktif.** `action=fasttrack-connection` membuat paket dari koneksi yang sudah dikenal diteruskan lewat jalur cepat di kernel yang **melewati mangle dan queue sepenuhnya**. Karena Queue Tree bergantung pada `packet-mark` yang dibuat di mangle, dan mangle tidak pernah dijalankan, tidak ada paket yang masuk ke queue mana pun.
   **Perbaikan:** kecualikan trafik yang perlu di-QoS dari FastTrack dengan menempatkan aturan `accept` sebelum aturan fasttrack:
   ```
   /ip firewall filter add chain=forward action=accept connection-mark=voip-conn place-before=0
   ```
   atau matikan FastTrack sepenuhnya kalau QoS lebih penting daripada throughput maksimum.
   **Kemungkinan lain:** parent queue salah (harus interface atau queue induk yang benar), `packet-mark` tidak cocok dengan yang dibuat mangle, `max-limit` tidak diset pada queue induk, atau tidak ada congestion sehingga queue memang tidak melakukan apa-apa.

7. **Perhitungan:**
   ```
   VoIP: 20 panggilan × 87 kbps ≈ 1,74 Mbps → alokasikan 2,5 Mbps (8%)
   Video conference: 2 sesi × 2 Mbps = 4 Mbps (13%)
   ERP/transaksional: 8 Mbps (27%)
   Web/best effort: 12 Mbps (40%)
   Backup/scavenger: 2 Mbps (7%), boleh burst ke sisa
   Shaper total: 28 Mbps (93% dari 30 Mbps)
   ```
   ```
   ! ═══ Cisco MQC ═══
   class-map match-all VOICE
    match dscp ef
   class-map match-all SIGNALING
    match dscp cs3
   class-map match-all VIDEO
    match dscp af41
   class-map match-all ERP
    match dscp af21
   class-map match-any SCAVENGER
    match dscp cs1

   policy-map QOS-WAN
    class VOICE
     priority 2500                    ! LLQ, ~8% (di bawah 33%)
    class SIGNALING
     bandwidth percent 3
    class VIDEO
     bandwidth percent 14
     random-detect dscp-based
    class ERP
     bandwidth percent 28
     random-detect dscp-based
    class SCAVENGER
     bandwidth percent 2
    class class-default
     bandwidth percent 40
     fair-queue
     random-detect

   policy-map SHAPE-WAN
    class class-default
     shape average 28000000
      service-policy QOS-WAN

   interface GigabitEthernet0/0
    service-policy output SHAPE-WAN
   ```
   Tambahan: tetapkan trust boundary di access switch (percayai telepon, reset marking PC), tandai trafik ERP berdasarkan alamat server, dan pantau `show policy-map interface` untuk menyesuaikan alokasi berdasarkan data nyata.

8. Beberapa alasan: (a) **Tidak ada perjanjian antar-AS** tentang arti nilai DSCP — apa yang berarti "prioritas tinggi" bagi Anda bisa berarti hal lain bagi ISP; (b) **ISP me-reset DSCP di titik masuk** (*bleaching*) untuk mencegah pelanggan mendapat prioritas yang tidak dibayar — kalau tidak, semua orang akan menandai trafiknya EF; (c) **Sebagian besar backbone internet tidak menerapkan QoS sama sekali** karena kapasitasnya sengaja dibuat berlebih (overprovisioned), sehingga marking tidak relevan; (d) **Perangkat di jalur mungkin me-remark** untuk kebijakan internal mereka.
   **Konsekuensinya:** QoS end-to-end hanya dapat dijamin di jaringan yang **Anda kendalikan sepenuhnya** (LAN, WAN privat) atau lewat **MPLS/Metro Ethernet dengan SLA yang secara eksplisit menjamin penghormatan DSCP**. Untuk trafik yang melintasi internet publik, andalkan aplikasi yang adaptif (codec yang bisa menurunkan bitrate) dan bandwidth yang memadai.

</details>

---

## 14. Sumber

- RFC 2474 / 2475 — Differentiated Services
- RFC 2597 — Assured Forwarding PHB · RFC 3246 — Expedited Forwarding PHB
- RFC 4594 — Configuration Guidelines for DiffServ Service Classes
- ITU-T G.114 — One-way transmission time
- Cisco, *Enterprise QoS Solution Reference Network Design Guide*
- Cisco CCNA 200-301 v1.1, topik 4.7 (forwarding per-hop behavior untuk QoS: classification, marking, queuing, congestion, policing, shaping)
- MikroTik Queues — https://help.mikrotik.com/docs/display/ROS/Queues

---

**Berikutnya:** `12-keamanan/01-konsep-keamanan.md` — memasuki tahap keamanan jaringan.

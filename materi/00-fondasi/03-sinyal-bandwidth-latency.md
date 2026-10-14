# 00.3 — Sinyal, Bandwidth, Latency, dan Metrik Kinerja

> **Prasyarat:** `00-fondasi/01`, `00-fondasi/02`
> **Tujuan:** Anda bisa membedakan bandwidth/throughput/latency/jitter, menghitung waktu transfer, dan menjelaskan mengapa "internet cepat" bisa tetap terasa lambat.

---

## 1. Dari Bit ke Sinyal

Bit adalah konsep. Yang benar-benar melintasi kabel adalah **sinyal fisik**.

| Media | Sinyal fisiknya |
|---|---|
| Kabel tembaga | Perubahan tegangan listrik (mis. +2,5 V vs −2,5 V) |
| Serat optik | Kedipan cahaya (LED/laser nyala–mati, atau perubahan fase) |
| Nirkabel | Gelombang radio yang dimodulasi (amplitudo/frekuensi/fase) |

**Encoding** adalah aturan penerjemahan bit ↔ sinyal. Contoh paling sederhana:

```
Bit    :  1     0     1     1     0
        ┌───┐       ┌───┬───┐
Sinyal :┘   └───────┘       └──────
        tinggi rendah  tinggi  rendah
```

Ini disebut **NRZ** (*Non-Return to Zero*). Sederhana, tapi punya masalah: kalau ada 50 bit `0` berurutan, sinyal datar terus dan penerima kehilangan sinkronisasi waktu ("sekarang bit ke berapa?"). Karena itu jaringan nyata memakai encoding yang lebih pintar (Manchester, 4B/5B, 8B/10B, 64B/66B, PAM4). Rincian di `02-layer-fisik/04`.

### Analog vs Digital

- **Analog** — nilai kontinu, bisa apa saja di antara batas. Suara asli, sinyal radio AM/FM.
- **Digital** — nilai diskrit, hanya level tertentu. Data komputer.

Keunggulan digital: **bisa direkonstruksi sempurna.** Sinyal analog yang melemah kehilangan informasi selamanya; sinyal digital yang melemah masih bisa dibaca sebagai 1/0 lalu **dibangkitkan ulang** dengan kualitas asli oleh repeater/switch. Inilah alasan jaringan digital bisa menjangkau seluruh dunia tanpa degradasi kumulatif.

### Baseband vs Broadband

- **Baseband** — seluruh kapasitas media dipakai satu sinyal digital. Ethernet adalah baseband — itulah arti "BASE" di `1000BASE-T`.
- **Broadband** — media dibagi menjadi banyak kanal frekuensi yang dipakai bersamaan. TV kabel, DOCSIS, DSL, dan Wi-Fi (OFDM) memakai prinsip ini.

⚠️ Kata "broadband" dalam iklan ISP artinya berbeda: di sana ia cuma berarti "internet cepat & selalu terhubung". Dalam konteks teknis, arti aslinya adalah pembagian frekuensi.

### Bit rate vs Baud rate

- **Baud rate** = jumlah perubahan simbol per detik.
- **Bit rate** = jumlah bit per detik.

Kalau satu simbol membawa lebih dari 1 bit, bit rate > baud rate.

```
Encoding 1 bit/simbol  : 1000 baud = 1000 bps
Encoding PAM4 (2 bit/simbol) : 1000 baud = 2000 bps
Encoding 4096-QAM Wi-Fi 7 (12 bit/simbol) : 1000 baud = 12.000 bps
```

Ini kunci untuk memahami bagaimana Wi-Fi dan Ethernet terus makin cepat tanpa memperlebar frekuensi: **tiap simbol dipadatkan lebih banyak bit**. Batasnya ditentukan oleh noise.

### Dua hukum yang membatasi segalanya

**Nyquist (kanal tanpa noise):**
```
Kapasitas maksimum = 2 × B × log₂(M)
   B = bandwidth (Hz), M = jumlah level sinyal
```

**Shannon (kanal dengan noise) — hukum yang sebenarnya berlaku:**
```
C = B × log₂(1 + S/N)
   C = kapasitas (bps), B = bandwidth (Hz), S/N = signal-to-noise ratio
```

Dua konsekuensi praktis yang akan Anda hadapi seumur karier:
1. **Bandwidth lebih lebar → kapasitas lebih besar** (karena itu Wi-Fi 7 pakai kanal 320 MHz).
2. **SNR lebih baik → kapasitas lebih besar** (karena itu klien Wi-Fi yang jauh dari AP dapat kecepatan rendah — bukan karena "sinyal kecil", tapi karena SNR rendah memaksa modulasi yang lebih sederhana).

---

## 2. Bandwidth, Throughput, Goodput

Tiga istilah yang sering dipakai bergantian oleh orang awam, padahal berbeda.

| Istilah | Definisi | Contoh |
|---|---|---|
| **Bandwidth** | Kapasitas **maksimum teoretis** jalur | Port Gigabit Ethernet = 1.000 Mbps |
| **Throughput** | Laju data **aktual** yang terukur, termasuk semua header | 940 Mbps |
| **Goodput** | Data **berguna** saja (payload aplikasi), tanpa header & retransmisi | 915 Mbps |

**Analogi jalan raya:**
- Bandwidth = jumlah lajur × batas kecepatan.
- Throughput = mobil yang benar-benar lewat per jam (ada macet, ada lampu merah).
- Goodput = **orang** yang benar-benar sampai tujuan (mobil kosong tidak dihitung).

### Kenapa throughput selalu < bandwidth?

Pada Gigabit Ethernet dengan frame maksimal 1518 byte:

```
Overhead per frame:
  Preamble + SFD ............  8 byte
  Header Ethernet ...........  14 byte
  FCS .......................  4 byte
  Interframe gap ............  12 byte (setara)
  Header IP .................  20 byte
  Header TCP ................  20 byte
  ───────────────────────────────────
  Total overhead ............  78 byte
  Payload aplikasi ..........  1460 byte
  Total di kabel ............  1538 byte

Efisiensi = 1460 / 1538 = 94,9%
Goodput maksimum = 1000 Mbps × 0,949 ≈ 949 Mbps
```

Itu **batas fisik**, bukan kelemahan. Angka ~940 Mbps saat uji `iperf3` di link 1 Gbps adalah hasil sempurna.

Kalau frame kecil (misalnya VoIP dengan payload 20 byte), efisiensi jatuh drastis:
```
Payload 20 byte + overhead 78 byte = 98 byte di kabel
Efisiensi = 20/98 = 20,4%
```
Inilah kenapa "1000 panggilan VoIP" memakan bandwidth jauh lebih besar daripada perkiraan naif.

### Faktor yang menurunkan throughput

1. **Overhead protokol** (di atas).
2. **Congestion** — jalur penuh, paket menunggu di antrean atau dibuang.
3. **Packet loss** → retransmisi → bandwidth terpakai dua kali untuk data yang sama.
4. **Latency tinggi + window kecil** → TCP tidak bisa mengisi pipa (lihat §5).
5. **Duplex mismatch** → tabrakan terus-menerus (`03-data-link/01`).
6. **CPU/disk bottleneck** di host, bukan di jaringan.
7. **Rate limiting / shaping** oleh provider.

---

## 3. Latency dan Empat Komponennya

**Latency** (delay) = waktu yang dibutuhkan satu bit/paket untuk sampai dari A ke B.

Total latency satu hop = **propagasi + transmisi + prosesing + queuing**

### 3.1 Delay propagasi

Waktu sinyal menempuh jarak fisik.

```
Propagasi = jarak / kecepatan sinyal
```

Kecepatan sinyal:
- Di ruang hampa (cahaya): 300.000 km/s
- Di serat optik: ~200.000 km/s (~2/3 c, karena indeks refraksi kaca)
- Di kabel tembaga: ~180.000–200.000 km/s

**Contoh: Jakarta → Singapura (~900 km serat)**
```
900 km / 200.000 km/s = 0,0045 s = 4,5 ms (satu arah)
RTT minimum ≈ 9 ms
```

**Contoh: Jakarta → Amsterdam (~11.000 km serat, jalur nyata lebih panjang ~14.000 km)**
```
14.000 / 200.000 = 70 ms satu arah → RTT ≈ 140 ms
```

⚠️ **Ini tidak bisa dipercepat dengan uang.** Anda bisa membeli bandwidth 100 Gbps, tapi tidak bisa membeli kecepatan cahaya. Ini alasan utama keberadaan **CDN**: dekatkan datanya, bukan percepat kabelnya.

### 3.2 Delay transmisi (serialization delay)

Waktu untuk "menuangkan" seluruh paket ke kabel, bit demi bit.

```
Transmisi = ukuran paket (bit) / bandwidth (bps)
```

**Contoh: paket 1500 byte di link berbeda**
```
1500 byte = 12.000 bit

Link 10 Mbps   : 12.000 / 10.000.000     = 1,2 ms
Link 100 Mbps  : 12.000 / 100.000.000    = 0,12 ms  (120 µs)
Link 1 Gbps    : 12.000 / 1.000.000.000  = 0,012 ms (12 µs)
Link 10 Gbps   : 12.000 / 10.000.000.000 = 1,2 µs
```

Pelajaran: **di link lambat, ukuran paket sangat berpengaruh pada delay.** Ini alasan teknis mengapa VoIP memakai paket kecil (20 ms audio per paket), dan mengapa link WAN lambat butuh QoS agar paket besar tidak menahan paket kecil (`11-wan-vpn/03`).

### 3.3 Delay prosesing

Waktu perangkat memeriksa header dan memutuskan ke mana meneruskan.
- Switch modern (ASIC): **beberapa mikrodetik**.
- Router hardware-based (CEF): puluhan mikrodetik.
- Router yang memproses di CPU (process switching), firewall dengan deep inspection, enkripsi software: bisa **milidetik**.

### 3.4 Delay queuing

Waktu paket menunggu dalam antrean karena jalur keluar sedang sibuk. **Ini satu-satunya komponen yang sangat bervariasi** — dari 0 sampai ratusan milidetik. Sumber utama jitter.

```
Antrean kosong  → queuing delay ≈ 0
Antrean penuh   → queuing delay besar, lalu paket mulai dibuang (tail drop)
```

Fenomena **bufferbloat**: perangkat dengan buffer sangat besar tidak membuang paket, melainkan menunda semuanya — hasilnya latency melonjak dari 20 ms ke 500 ms saat ada download besar, walaupun "tidak ada packet loss". Solusinya AQM (CoDel/FQ-CoDel), dibahas di `05-transport/04`.

### Ringkasan komponen

| Komponen | Dipengaruhi oleh | Bervariasi? |
|---|---|---|
| Propagasi | Jarak fisik | Tidak (tetap) |
| Transmisi | Ukuran paket & bandwidth | Tidak (deterministik) |
| Prosesing | Jenis perangkat & fitur aktif | Sedikit |
| Queuing | Beban jaringan | **Sangat** |

---

## 4. RTT, Jitter, Packet Loss

### RTT (Round-Trip Time)

Waktu pulang-balik: kirim → sampai → balasan kembali. Ini yang diukur `ping`.

```bash
$ ping -c 4 1.1.1.1
64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=8.21 ms
64 bytes from 1.1.1.1: icmp_seq=2 ttl=57 time=9.05 ms
64 bytes from 1.1.1.1: icmp_seq=3 ttl=57 time=8.44 ms
64 bytes from 1.1.1.1: icmp_seq=4 ttl=57 time=8.33 ms
--- 1.1.1.1 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss
rtt min/avg/max/mdev = 8.21/8.50/9.05/0.32 ms
```

Baca hasilnya:
- `min 8,21` — latency terbaik (mendekati propagasi murni).
- `avg 8,50` — rata-rata.
- `max 9,05` — terburuk (ada queuing).
- `mdev 0,32` — deviasi = indikator **jitter**. Kecil = bagus.
- `0% packet loss` — bagus.

⚠️ RTT ≠ 2 × latency satu arah, karena jalur pergi dan balik bisa berbeda (asymmetric routing) dan beban tiap arah berbeda.

### Jitter

Variasi latency antar-paket.

```
Paket 1: 20 ms   ┐
Paket 2: 22 ms   │ jitter kecil (2–3 ms) → bagus
Paket 3: 21 ms   ┘

Paket 1: 20 ms   ┐
Paket 2: 95 ms   │ jitter besar → suara terputus-putus
Paket 3: 18 ms   ┘
```

Aplikasi real-time (VoIP, video call, game) **lebih terganggu jitter daripada latency tinggi yang stabil.** Panggilan dengan latency stabil 150 ms terdengar jauh lebih baik daripada latency berayun 30–200 ms.

Penerima memakai **jitter buffer** — menahan paket sedikit agar keluar dengan tempo rata. Buffer ini menambah latency, jadi ada trade-off.

Target industri untuk VoIP:
| Metrik | Target |
|---|---|
| Latency satu arah | < 150 ms (ideal < 100 ms) |
| Jitter | < 30 ms (ideal < 10 ms) |
| Packet loss | < 1% (ideal 0%) |

### Packet Loss

Paket yang tidak sampai. Penyebab:
1. **Congestion** — buffer penuh, paket dibuang. Penyebab paling umum.
2. **Error fisik** — kabel rusak, konektor kotor, interferensi (CRC error).
3. **Policing** — paket melebihi rate yang diizinkan, sengaja dibuang.
4. **Firewall/ACL** — sengaja diblokir (bukan "loss" dalam arti masalah).
5. **Perangkat kelebihan beban** — CPU/buffer habis.
6. **Wireless** — tabrakan, sinyal lemah, interferensi.

Dampaknya berbeda per protokol:
- **TCP** — mendeteksi & mengirim ulang. Data selamat, tapi throughput jatuh (dan bisa jatuh dramatis: loss 1% bisa memotong throughput jauh lebih dari 1%).
- **UDP** — hilang selamanya kecuali aplikasi menanganinya. VoIP kehilangan potongan suara.

💡 Loss 0,1% terlihat "kecil" tapi bisa merusak transfer file besar. Selalu curigai loss saat throughput jauh di bawah bandwidth.

---

## 5. Bandwidth-Delay Product (BDP) — Konsep Penting yang Sering Dilewatkan

BDP = berapa banyak data yang bisa "berada di dalam pipa" pada satu saat.

```
BDP (bit) = bandwidth (bps) × RTT (detik)
```

**Contoh 1 — LAN:**
```
1 Gbps, RTT 1 ms
BDP = 1.000.000.000 × 0,001 = 1.000.000 bit = 125 KB
```

**Contoh 2 — WAN transkontinental:**
```
1 Gbps, RTT 200 ms
BDP = 1.000.000.000 × 0,2 = 200.000.000 bit = 25 MB
```

### Kenapa ini penting

TCP hanya bisa mengirim sebanyak **window size** sebelum menunggu ACK. Kalau window lebih kecil daripada BDP, pipa tidak pernah penuh:

```
Window 64 KB, RTT 200 ms
Throughput maksimum = 65.536 byte × 8 / 0,2 s = 2,6 Mbps
```

**Anda punya link 1 Gbps tapi hanya dapat 2,6 Mbps** — bukan karena jaringan buruk, tapi karena window TCP terlalu kecil untuk BDP sebesar itu. Solusinya **TCP window scaling** ([RFC 7323]) yang memungkinkan window sampai 1 GB. Dibahas tuntas di `05-transport/02`.

Ini disebut jaringan **LFN** (*Long Fat Network*) — bandwidth besar, delay besar. Sering muncul di:
- Transfer data antar-benua
- Replikasi antar-region cloud
- Backup ke DR site jauh
- Link satelit GEO (RTT ~600 ms!)

---

## 6. Antrean dan Model Kinerja

Bagian 3.4 menyebut queuing delay sebagai satu-satunya komponen latency yang sangat bervariasi. Bagian ini menjawab tiga pertanyaan yang sering muncul di NOC: seberapa besar antrean itu, kapan ia meledak, dan kenapa pengguna sudah mengeluh lambat padahal grafik utilisasi link "baru" 80%.

### 6.1 Circuit switching vs statistical multiplexing

Ada dua cara membagi satu link ke banyak pengguna.

- **Circuit switching** (dan TDM/FDM): setiap pengguna mendapat jatah tetap (slot waktu atau frekuensi) selama sambungan berlangsung. Jatah itu tetap dipegang walaupun pengguna sedang diam. Telepon PSTN bekerja seperti ini.
- **Statistical multiplexing** (packet switching): tidak ada jatah tetap. Paket dari siapa pun dikirim saat ada, satu per satu. Kalau hanya satu pengguna yang aktif, ia boleh memakai seluruh link. Kalau banyak yang aktif bersamaan, paket mereka bergantian, dan sisanya **menunggu di antrean**.

```
TDM (jatah tetap):     | A | B | C | D | A | B | C | D |   ← slot B dan D kosong
                         ■   ·   ■   ·   ■   ·   ■   ·       tetap terbuang

Statistical mux:       | A | C | A | A | C | A | C | C |   ← link hanya dipakai
                         ■   ■   ■   ■   ■   ■   ■   ■       oleh yang sedang aktif
                                    ▲
                   saat A dan C datang bersamaan, salah satu antre
```

Peterson & Davie merangkumnya begini: statistical multiplexing membagi link dengan granularitas paket, efisien karena tidak ada slot yang menganggur, dan harga yang dibayar adalah dua tantangan, yaitu pembagian yang adil dan penanganan kemacetan saat paket datang lebih cepat daripada kemampuan link mengirimnya.

**Contoh hitung: RT/RW-Net di Sleman.** Sebuah ISP lokal punya uplink **100 Mbps**. Setiap pelanggan, ketika sedang aktif, menarik **10 Mbps**, tetapi rata-rata hanya aktif **10% dari waktu** (sebagian besar waktu dipakai membaca, menonton video yang sudah ter-buffer, atau tidur).

```
Circuit switching:
  Kapasitas per pelanggan dijamin 10 Mbps  → maksimum 100 / 10 = 10 pelanggan
  Rata-rata trafik nyata = 10 × 0,1 × 10 Mbps = 10 Mbps → utilisasi uplink 10%

Statistical multiplexing dengan 35 pelanggan:
  Jumlah yang aktif bersamaan X ~ Binomial(n = 35, p = 0,1)
  Rata-rata yang aktif = 35 × 0,1 = 3,5 pelanggan → 35 Mbps → utilisasi 35%
  Link baru "kurang" kalau lebih dari 10 pelanggan aktif bersamaan:

  P(X > 10) = Σ (k = 11..35) C(35,k) × 0,1^k × 0,9^(35−k) ≈ 0,00042
```

Artinya, dengan 35 pelanggan (3,5 kali lipat), peluang permintaan melebihi kapasitas hanya sekitar **0,04%** dari waktu, atau kurang dari 40 detik per hari. Itulah **statistical multiplexing gain**. Tapi keuntungan ini tidak gratis, dan bertambah mahal dengan cepat:

| Jumlah pelanggan | Rata-rata utilisasi | P(lebih dari 10 aktif) |
|---|---|---|
| 10 (setara circuit) | 10% | 0 |
| 35 | 35% | ≈ 0,04% |
| 50 | 50% | ≈ 0,94% |
| 60 | 60% | ≈ 3,4% |
| 70 | 70% | ≈ 8,7% |

Saat lebih dari 10 pelanggan aktif bersamaan, kelebihannya tidak langsung hilang: ia **ditampung di buffer**, dan di situlah queuing delay lahir. Rasio "berapa pelanggan per kapasitas" (*contention ratio* atau *overbooking*) yang dipakai ISP pada dasarnya adalah keputusan seberapa sering antrean semacam ini boleh terjadi.

### 6.2 Komponen delay, dilihat dari antrean

Ingat rumus per hop dari bagian 3: `d_node = d_proc + d_queue + d_trans + d_prop`. Untuk membahas antrean, kita butuh tiga besaran:

```
λ  = laju kedatangan paket rata-rata (paket/detik)
L  = ukuran paket rata-rata (bit)
R  = kecepatan link keluar (bit/detik)

Intensitas trafik (utilisasi)  ρ = λ × L / R
Waktu layanan satu paket      S = L / R   (= delay transmisi)
```

Dua aturan dasar:

1. **Kalau ρ > 1**, data datang lebih cepat daripada yang bisa dikirim. Antrean tumbuh terus sampai buffer penuh, lalu paket dibuang. Tidak ada jumlah buffer yang menyelamatkan kondisi ini dalam jangka panjang.
2. **Kalau ρ < 1**, besar antrean bergantung pada **pola kedatangan**, bukan hanya rata-ratanya. Paket yang datang rapi berjarak sama tidak pernah antre. Paket yang datang bergerombol selalu antre.

**Contoh gerombolan.** Sepuluh paket 1.500 byte tiba bersamaan di link 10 Mbps (S = 1,2 ms):

```
Paket ke-1 menunggu 0 ms, ke-2 menunggu 1,2 ms, ..., ke-10 menunggu 9 × 1,2 = 10,8 ms
Rata-rata menunggu = (0 + 1 + ... + 9) × 1,2 / 10 = 45 × 1,2 / 10 = 5,4 ms
```

Kalau gerombolan seperti ini datang sekali per detik, utilisasi rata-ratanya hanya 10 × 12.000 / 10.000.000 = 1,2%, tetapi paket terakhir tetap menunggu hampir 11 ms. Utilisasi rata-rata yang rendah **tidak menjamin** antrean pendek.

### 6.3 Little's Law: satu rumus yang selalu berlaku

John Little membuktikan (1961) hubungan yang mengejutkan sederhana untuk sistem antrean apa pun yang stabil:

```
N = λ × W

N = jumlah rata-rata "pelanggan" di dalam sistem
λ = laju kedatangan rata-rata
W = waktu rata-rata satu pelanggan berada di dalam sistem
```

Rumus ini **tidak bergantung pada distribusi kedatangan, ukuran paket, atau disiplin antrean**. Ia berlaku untuk buffer router, tabel koneksi firewall, antrean kasir minimarket, dan TCP. Syaratnya hanya sistem stabil (yang masuk pada akhirnya keluar) dan diukur dalam rentang waktu yang cukup panjang.

**Contoh 1: buffer router.** Router agregasi di POP Surabaya meneruskan rata-rata **80.000 paket/detik** ke uplink. Dari sampling, output queue interface itu rata-rata berisi **40 paket**.

```
W = N / λ = 40 / 80.000 = 0,0005 s = 0,5 ms   ← rata-rata queuing delay di hop ini
```

Anda tidak perlu tahu apa pun tentang pola trafiknya. Dua angka yang bisa diukur (panjang antrean dan laju paket) langsung memberi delay rata-rata.

**Contoh 2: versi byte, router rumah.** Little's law juga berlaku dalam satuan byte: delay antrean = isi antrean (byte) / laju pengurasan (byte/detik). Sebuah router rumah dengan upload **20 Mbps** memakai antrean FIFO sepanjang **1.000 paket** (nilai `txqueuelen` bawaan banyak interface Linux). Saat ada upload besar (backup foto ke cloud), antrean terisi penuh:

```
Isi antrean  = 1.000 × 1.500 byte × 8 = 12.000.000 bit
Delay        = 12.000.000 / 20.000.000 = 0,6 s = 600 ms
```

Setiap paket lain yang lewat, termasuk paket game atau panggilan video, ikut menunggu 600 ms. Inilah mekanisme bufferbloat dalam satu baris hitungan.

**Contoh 3: server saat Harbolnas.** Pada puncak promo 12.12, sebuah toko daring menerima **2.000 koneksi baru per detik**, dan setiap koneksi rata-rata hidup **3 detik**.

```
Koneksi bersamaan = 2.000 × 3 = 6.000
```

Angka ini yang dipakai untuk mengukur kapasitas tabel sesi load balancer, `nf_conntrack_max`, atau tabel NAT, bukan jumlah koneksi per detik saja.

💡 **BDP (bagian 5) adalah Little's law.** Data yang "berada di dalam pipa" = laju (throughput) × waktu tinggal (RTT). Begitu Anda mengenali polanya, rumus ini muncul di mana-mana.

### 6.4 Model M/M/1 dan kurva utilisasi vs delay

Little's law memberi hubungan, tetapi tidak memberi tahu **berapa** N atau W untuk utilisasi tertentu. Untuk itu kita butuh model. Model paling sederhana adalah **M/M/1**: kedatangan acak (proses Poisson, huruf M pertama), waktu layanan acak berdistribusi eksponensial (M kedua), satu server (angka 1, yaitu satu link keluar), buffer tak terbatas, FIFO.

Hasilnya (tanpa penurunan):

```
Waktu rata-rata di sistem (antre + kirim):   T  = S / (1 − ρ)
Waktu rata-rata menunggu di antrean saja:    Wq = ρ × S / (1 − ρ)
Jumlah rata-rata paket di sistem:            N  = ρ / (1 − ρ)
```

Perhatikan bahwa `N = λ × T` (cek: λ × S/(1−ρ) = ρ/(1−ρ)). Little's law konsisten dengan model ini.

**Contoh hitung.** Link 100 Mbps, paket rata-rata 1.250 byte (10.000 bit), sehingga S = 10.000 / 100.000.000 = **0,1 ms** dan kapasitas μ = 10.000 paket/detik.

| ρ | T (ms) | N (paket) | T/S |
|---|---|---|---|
| 0,10 | 0,111 | 0,11 | 1,1 |
| 0,30 | 0,143 | 0,43 | 1,4 |
| 0,50 | 0,200 | 1,00 | 2 |
| 0,70 | 0,333 | 2,33 | 3,3 |
| 0,80 | 0,500 | 4,00 | 5 |
| 0,90 | 1,000 | 9,00 | 10 |
| 0,95 | 2,000 | 19,0 | 20 |
| 0,99 | 10,00 | 99,0 | 100 |

```
Delay relatif terhadap waktu layanan (1 kotak = 1 × S)

ρ = 0,10  │█                        1,1 S
ρ = 0,50  │██                       2 S
ρ = 0,70  │███▍                     3,3 S
ρ = 0,80  │█████                    5 S
ρ = 0,90  │██████████               10 S
ρ = 0,95  │████████████████████     20 S
ρ = 0,99  │████████████████████···  100 S  (keluar grafik)
          └──────────────────────────────►
```

**Kenapa link 70-80% mulai terasa lambat?** Lihat seberapa **peka** delay terhadap tambahan beban. Turunan `T = S/(1−ρ)` adalah `S/(1−ρ)²`:

```
ρ = 0,5  → kepekaan  4 S per satuan ρ
ρ = 0,8  → kepekaan 25 S per satuan ρ   (6× lebih peka daripada di 0,5)
ρ = 0,9  → kepekaan 100 S per satuan ρ  (25× lebih peka)
```

Di utilisasi 50%, lonjakan beban sesaat hampir tidak terasa. Di 80-90%, lonjakan kecil yang sama (satu pengguna mulai streaming) melipatgandakan delay. Grafik rata-rata 5 menit yang menunjukkan 80% berarti dalam rentang itu ada banyak detik yang sebenarnya di atas 90%.

Rata-rata pun belum seluruh cerita. Pada M/M/1, waktu tinggal paket berdistribusi eksponensial, sehingga **persentil ke-99 ≈ 4,6 × T** (karena ln 100 ≈ 4,6). Ambil link VSAT 10 Mbps ke kantor cabang di Papua dengan paket 1.250 byte (S = 1 ms) pada ρ = 0,9:

```
T rata-rata   = 1 ms / (1 − 0,9) = 10 ms
T persentil 99 ≈ 4,6 × 10 ms     = 46 ms   ← inilah jitter yang dirasakan VoIP
```

Itu baru satu hop. Jalur dengan lima hop yang sama-sama padat menjumlahkan semuanya.

Peterson & Davie dalam *Computer Networks: A Systems Approach* (subbab 6.1 buku itu) memakai metrik *power* = throughput / delay untuk mencari titik kerja ideal. Pada M/M/1, power ∝ λ(μ − λ), yang maksimum tepat di **ρ = 0,5**: di kiri titik itu link kurang terpakai, di kanannya tambahan throughput dibayar mahal dengan delay. Dalam praktik operator memakai ambang yang lebih longgar. Banyak tim kapasitas menetapkan pemicu upgrade sekitar 70% pada persentil ke-95 utilisasi 5 menitan. Itu kebiasaan industri, bukan standar, tetapi kurva di atas menjelaskan kenapa angkanya di sekitar sana.

### 6.5 Kapan model ini meleset

M/M/1 adalah alat berpikir, bukan alat ukur. Ia meleset dalam beberapa hal penting:

1. **Trafik internet tidak Poisson.** Pengukuran klasik pada LAN Ethernet (Leland dkk., 1994) dan WAN (Paxson & Floyd, 1995) menunjukkan trafik bersifat *bursty* di banyak skala waktu sekaligus (*self-similar*). Pada Poisson, gerombolan "rata" begitu dijumlahkan dalam jendela yang lebih panjang. Pada trafik nyata, gerombolan tetap terlihat. Akibatnya antrean nyata pada ρ yang sama **lebih panjang** daripada prediksi M/M/1.
2. **Microburst tidak terlihat di grafik SNMP.** Dua port 10 Gbps mengirim ke satu port 10 Gbps selama 1 ms (pola *incast* di data center):
   ```
   Kelebihan = 10 Gbps × 0,001 s = 10 Mbit = 1,25 MB yang harus ditampung buffer
   Kontribusinya ke rata-rata 5 menit = 10 Mbit / (10 Gbps × 300 s) ≈ 0,0003%
   ```
   Kalau buffer port itu lebih kecil dari 1,25 MB, ada drop, padahal grafik utilisasi tampak landai. Penghitung `output drops` lebih jujur daripada grafik utilisasi.
3. **Ukuran paket tidak acak.** Kalau semua paket berukuran sama (misalnya trunk VoIP), modelnya M/D/1 dan waktu tunggu antrean menjadi **setengah** dari M/M/1: `Wq = ρS / (2(1−ρ))`. Bentuk kurvanya tetap sama: tetap meledak mendekati ρ = 1.
4. **Buffer terbatas.** Router nyata tidak punya buffer tak terhingga (model M/M/1/K). Delay jadi berbatas, tetapi gantinya paket dibuang.
5. **TCP adalah sistem umpan balik.** Ini yang paling penting. M/M/1 menganggap kedatangan tidak peduli pada antrean. TCP justru menaikkan laju kirimnya **sampai terjadi loss**. Satu unduhan besar saja sudah cukup mendorong ρ ke mendekati 1, dan antrean terisi sampai buffer penuh. Pada kondisi ini delay ditentukan oleh **ukuran buffer**, bukan oleh ρ. Rumus M/M/1 tidak berlaku lagi.

### 6.6 Kaitan dengan bufferbloat

Poin 5 di atas adalah inti bufferbloat (`05-transport/04`). Kathleen Nichols dan Van Jacobson, perancang CoDel, membedakan dua jenis antrean:

- **Antrean baik**: muncul karena burst, lalu terkuras dalam kira-kira satu RTT. Ia berguna, karena menyerap gerombolan tanpa membuang paket.
- **Antrean buruk (*standing queue*)**: tidak pernah terkuras. Ia tidak menambah throughput sedikit pun (link sudah penuh), hanya menambah delay untuk semua orang.

Berapa buffer yang "cukup"? Aturan lama adalah `B = RTT × C` (satu BDP), agar satu aliran TCP tetap memenuhi link setelah window-nya dipotong separuh. Appenzeller, Keslassy, dan McKeown (2004) menunjukkan bahwa pada link yang dilewati banyak aliran (n), `B = RTT × C / √n` sudah cukup:

```
Link 10 Gbps, RTT 100 ms:
  Aturan lama          : 10 × 10^9 × 0,1 / 8      = 125 MB
  Dengan n = 10.000 aliran: 125 MB / √10.000 = 125 / 100 = 1,25 MB
```

Masalahnya di sisi lain: di ujung jaringan (router rumah, ONT, modem LTE), hanya ada sedikit aliran dan link-nya lambat, sementara buffer-nya dibuat besar "supaya tidak ada drop". Hasilnya seperti contoh 2 di subbagian 6.3: 600 ms delay saat ada upload. Obatnya bukan memperkecil buffer secara membabi buta, melainkan AQM seperti **FQ-CoDel** (RFC 8290) yang menjaga delay antrean di sekitar target 5 ms dan memisahkan setiap aliran ke antreannya sendiri sehingga paket ping atau VoIP tidak terjebak di belakang unduhan besar.

**Lihat sendiri dengan network namespace Linux** (butuh `iproute2` dan `iperf3`, jalankan sebagai root):

```bash
# Dua namespace dihubungkan veth
ip netns add a; ip netns add b
ip link add va netns a type veth peer name vb netns b
ip -n a addr add 10.0.0.1/24 dev va; ip -n a link set va up
ip -n b addr add 10.0.0.2/24 dev vb; ip -n b link set vb up

# Bottleneck 10 Mbps di sisi a, antrean FIFO 1000 paket
tc -n a qdisc add dev va root handle 1: tbf rate 10mbit burst 32kbit latency 2s
tc -n a qdisc add dev va parent 1:1 handle 10: pfifo limit 1000

# Beban: unggahan TCP 30 detik, lalu ukur RTT selama beban berjalan
ip netns exec b iperf3 -s -D
ip netns exec a iperf3 -c 10.0.0.2 -t 30 &
ip netns exec a ping -c 15 10.0.0.2

# Ganti FIFO dengan fq_codel lalu ulangi beban dan ping
tc -n a qdisc del dev va parent 1:1 handle 10:
tc -n a qdisc add dev va parent 1:1 handle 10: fq_codel
```

Contoh hasil pada satu mesin uji (angka Anda akan berbeda, karena kernel juga membatasi berapa byte yang boleh ditumpuk satu soket TCP di antrean):

```
Tanpa beban          : rtt avg ≈ 0,03 ms
FIFO 1000 + unggahan : rtt min/avg/max ≈ 67 / 98 / 120 ms
fq_codel + unggahan  : rtt avg ≈ 0,9 ms
```

Link-nya sama, beban dan throughput unggahannya sama. Yang berubah hanya cara antrean dikelola. Kurva di 6.4 menjelaskan kenapa antrean muncul, dan bagian ini menjelaskan kenapa antrean itu tidak perlu dibiarkan menetap. Disiplin antrean yang lebih kaya (prioritas, WFQ, DRR) dibahas di `04-network-layer/05` dan `11-wan-vpn/03`.

---

## 7. Duplex

| Mode | Arti | Contoh |
|---|---|---|
| **Simplex** | Satu arah saja | Siaran TV, sensor kirim-saja |
| **Half duplex** | Dua arah, tapi bergantian | Walkie-talkie, hub Ethernet, Wi-Fi |
| **Full duplex** | Dua arah bersamaan | Telepon, switch Ethernet modern |

- **Half duplex** butuh mekanisme menghindari tabrakan (CSMA/CD di Ethernet lama, CSMA/CA di Wi-Fi).
- **Full duplex** di Ethernet dimungkinkan karena ada pasangan kabel terpisah untuk kirim dan terima — tidak ada tabrakan, sehingga CSMA/CD dimatikan.

⚠️ **Wi-Fi selalu half duplex.** Radio tidak bisa mengirim dan menerima di frekuensi yang sama pada waktu sama. Karena itu "Wi-Fi 1 Gbps" secara praktis memberikan throughput jauh lebih rendah, dan makin banyak klien makin turun. Detail di `10-wireless/02`.

⚠️ **Duplex mismatch** (satu sisi full, satu sisi half) adalah salah satu bug jaringan paling menipu: koneksi tetap "jalan", tapi lambat luar biasa dan penuh error. Deteksinya di `03-data-link/01`.

---

## 8. Menghitung Waktu Transfer

Rumus praktis:

```
Waktu ≈ (ukuran data / throughput) + RTT × jumlah round-trip
```

**Contoh: unduh file 500 MB via link 100 Mbps**
```
500 MB = 500 × 8 = 4.000 Mbit
4.000 / 100 = 40 detik (teoretis)
Dengan efisiensi ~94% → ≈ 42–43 detik
```

**Contoh: memuat halaman web 2 MB dengan 50 request, RTT 100 ms, HTTP/1.1 tanpa keep-alive**
```
Transfer data : 2 MB × 8 / 100 Mbps = 0,16 s
Round-trip    : 50 request × (1 RTT handshake + 1 RTT request) × 0,1 s = 10 s
Total         : ~10,2 s  ← DIDOMINASI LATENCY, bukan bandwidth!
```

Ini inti pelajarannya:

> **Untuk transfer besar, bandwidth menentukan. Untuk banyak transaksi kecil, latency menentukan.**

Karena itu HTTP/2 memakai multiplexing dan HTTP/3 memakai QUIC — mereka mengurangi jumlah round-trip, bukan menambah bandwidth (`06-aplikasi/03`).

---

## 9. MTU — Sekilas

**MTU** (*Maximum Transmission Unit*) = ukuran payload terbesar yang bisa dibawa satu frame.
- Ethernet standar: **1500 byte**.
- Jumbo frame: 9000 byte (harus didukung semua perangkat di jalur).
- PPPoE: 1492. Tunnel IPsec/GRE/VXLAN: lebih kecil lagi.

Kenapa penting sekarang: MTU yang tidak konsisten di sepanjang jalur menyebabkan **MTU black hole** — koneksi terbentuk (paket kecil lewat) tapi transfer data besar menggantung. Ini salah satu masalah paling sering di VPN. Dibahas di `04-network-layer/01` dan `05-transport/04`.

---

## 10. Praktik

### Ukur latency & jitter
```bash
$ ping -c 20 8.8.8.8            # lihat min/avg/max/mdev
$ mtr -r -c 50 8.8.8.8          # latency & loss per hop
```

### Ukur throughput nyata (butuh dua host)
```bash
# Di server
$ iperf3 -s

# Di klien
$ iperf3 -c IP_SERVER -t 30              # TCP, 30 detik
$ iperf3 -c IP_SERVER -t 30 -P 4         # 4 stream paralel
$ iperf3 -c IP_SERVER -u -b 100M         # UDP, target 100 Mbps → lihat loss & jitter
$ iperf3 -c IP_SERVER -R                 # arah balik (download)
```

### Lihat kecepatan & duplex interface
```bash
$ ethtool eth0 | grep -E 'Speed|Duplex'
        Speed: 1000Mb/s
        Duplex: Full

$ ip -s link show eth0            # statistik error/drop
```

### Hitung BDP
```bash
$ python3 -c "bw=1e9; rtt=0.2; print(f'BDP = {bw*rtt/8/1e6:.1f} MB')"
BDP = 25.0 MB
```

### Lihat efek ukuran paket pada latency
```bash
$ ping -c 5 -s 64 8.8.8.8       # paket kecil
$ ping -c 5 -s 1400 8.8.8.8     # paket besar → RTT sedikit lebih tinggi
```

---

## 11. Kesalahan Umum

⚠️ **1. "Tambah bandwidth pasti lebih cepat."** Tidak, kalau masalahnya latency, loss, atau window TCP.

⚠️ **2. Menyimpulkan jaringan buruk dari satu `ping` tinggi.** ICMP sering diberi prioritas rendah atau di-rate-limit. Router bisa lambat menjawab ping tapi cepat meneruskan trafik.

⚠️ **3. Mengabaikan arah.** Banyak link asimetris (mis. 100/20 Mbps). Uji kedua arah (`iperf3 -R`).

⚠️ **4. Mengukur throughput dengan satu stream TCP saja.** Satu stream sensitif terhadap loss & window; pakai `-P 4` untuk melihat kapasitas jalur.

⚠️ **5. Mengira 0% loss berarti sehat.** Bufferbloat memberi 0% loss dengan latency 500 ms.

⚠️ **6. Lupa bottleneck bisa bukan di jaringan.** Disk lambat atau CPU enkripsi bisa jadi batasnya.

---

## 12. Ringkasan

- Encoding menerjemahkan bit ke sinyal; digital bisa dibangkitkan ulang tanpa degradasi.
- Shannon: kapasitas naik dengan bandwidth **dan** SNR.
- Bandwidth = kapasitas; throughput = aktual; goodput = data berguna. Overhead Ethernet+IP+TCP membuat efisiensi maksimum ~95%.
- Latency = propagasi + transmisi + prosesing + queuing. Hanya queuing yang sangat bervariasi.
- Propagasi dibatasi kecepatan cahaya — tidak bisa dibeli. Solusinya mendekatkan data (CDN).
- Jitter lebih merusak real-time daripada latency stabil.
- BDP = bandwidth × RTT. Window TCP harus ≥ BDP untuk memakai link penuh.
- Wi-Fi selalu half duplex; switch Ethernet full duplex.
- Transfer besar → bandwidth-bound. Banyak transaksi kecil → latency-bound.
- Statistical multiplexing melayani jauh lebih banyak pengguna daripada circuit switching, dengan harga antrean saat burst bertabrakan.
- Little's law `N = λ × W` berlaku untuk sistem antrean stabil apa pun; BDP adalah salah satu wujudnya.
- M/M/1: `T = S / (1 − ρ)`. Delay naik pelan sampai sekitar 50%, lalu meledak di atas 80-90%. Trafik nyata yang bursty dan TCP yang mengisi buffer membuat kondisi nyata lebih buruk daripada model.

---

## 13. Latihan

1. Link 200 Mbps, file 1,5 GB. Berapa lama minimum (abaikan overhead)?
2. RTT ke server 40 ms, bandwidth 500 Mbps. Berapa BDP dalam KB?
3. Jelaskan kenapa `iperf3` di link 1 Gbps memberi 941 Mbps dan itu normal.
4. Aplikasi VoIP mengeluh suara "robotik dan terputus". Latency stabil 60 ms, loss 0%. Apa dugaan Anda?
5. Serat Jakarta–Surabaya ~800 km. Hitung RTT minimum teoretis.
6. Kenapa paket 1500 byte butuh 1,2 ms di link 10 Mbps tapi hanya 12 µs di link 1 Gbps?
7. Kantor punya link 1 Gbps ke kantor cabang dengan RTT 180 ms. Transfer file selalu ~3 Mbps walau link kosong. Apa penyebab paling mungkin dan bagaimana memperbaikinya?
8. Kantor cabang di Makassar punya uplink WAN 50 Mbps, paket rata-rata 1.000 byte, dan beban rata-rata 40 Mbps. Dengan model M/M/1, hitung utilisasi, waktu rata-rata di sistem (T), dan jumlah rata-rata paket di sistem (N). Lalu hitung ulang kalau beban naik ke 45 Mbps. Apa yang Anda sampaikan ke manajer yang berkata "kan hanya naik 12,5%"?
9. (a) Router edge ISP meneruskan rata-rata 60.000 paket/detik ke upstream, dan sampling menunjukkan output queue rata-rata berisi 120 paket. Berapa queuing delay rata-rata di hop ini? (b) Gateway pembayaran QRIS menerima 1.500 transaksi/detik di jam sibuk, setiap transaksi memegang satu koneksi selama rata-rata 0,4 detik. Berapa entri tabel koneksi yang minimal harus disediakan firewall di depannya, dan kenapa Anda tetap menambah cadangan?

<details>
<summary>Jawaban</summary>

1. 1,5 GB = 1.500 MB × 8 = 12.000 Mbit. 12.000/200 = **60 detik**. Dengan overhead ~5% → ~63 detik.

2. BDP = 500.000.000 × 0,04 = 20.000.000 bit = 2.500.000 byte = **~2.441 KB (≈2,4 MB)**.

3. Overhead: preamble+SFD 8 + Ethernet header 14 + FCS 4 + IFG 12 + IP 20 + TCP 20 = 78 byte per 1460 byte payload. Efisiensi 1460/1538 ≈ 94,9% → maksimum praktis ~949 Mbps. 941 Mbps = **~99% dari maksimum teoretis**, artinya link sehat.

4. **Jitter.** Latency rata-rata bagus dan tidak ada loss, tapi variasi latency membuat jitter buffer kehabisan/kelebihan paket. Periksa `ping` dengan `mdev` besar, cek antrean/QoS, cek apakah ada trafik bulk yang membanjiri link (bufferbloat).

5. 800 km / 200.000 km/s = 4 ms satu arah → **RTT minimum ≈ 8 ms**. Kenyataannya lebih besar (jalur fiber tidak lurus, ada perangkat perantara) — biasanya 12–20 ms.

6. Delay transmisi = ukuran/bandwidth. 12.000 bit ÷ 10 Mbps = 1,2 ms; 12.000 bit ÷ 1 Gbps = 12 µs. Bandwidth 100× lebih besar → waktu menuangkan bit ke kabel 100× lebih singkat.

7. **Window TCP terlalu kecil untuk BDP.** BDP = 1e9 × 0,18 / 8 = 22,5 MB. Kalau window ~64 KB, throughput maksimum = 65.536×8/0,18 ≈ 2,9 Mbps — persis gejalanya. Perbaikan: aktifkan **TCP window scaling** dan naikkan buffer (`net.ipv4.tcp_rmem/wmem`, `net.core.rmem_max`), pastikan tidak ada middlebox yang menghapus opsi window scale, atau pakai transfer paralel/protokol yang sadar-BDP.

8. Kapasitas dalam paket: μ = 50.000.000 / (1.000 × 8) = **6.250 paket/detik**, sehingga waktu layanan S = 1/6.250 = **0,16 ms**.
   - Beban 40 Mbps: ρ = 40/50 = **0,8**. T = S/(1−ρ) = 0,16/0,2 = **0,8 ms**. N = ρ/(1−ρ) = **4 paket**.
   - Beban 45 Mbps: ρ = **0,9**. T = 0,16/0,1 = **1,6 ms**. N = **9 paket**.
   Beban naik 12,5%, tetapi delay rata-rata **berlipat dua** dan isi antrean lebih dari dua kali. Persentil ke-99 juga ikut naik dari sekitar 3,7 ms (4,6 × 0,8) menjadi sekitar 7,4 ms. Karena trafik nyata lebih bursty daripada model, kondisi sebenarnya lebih buruk. Pesannya ke manajer: di atas 80% hubungan beban dan delay tidak lagi linear; rencanakan upgrade atau QoS sebelum 90%.

9. (a) Little's law: W = N/λ = 120 / 60.000 = **0,002 s = 2 ms** per paket di hop itu, tanpa perlu tahu pola trafiknya.
   (b) N = λ × W = 1.500 × 0,4 = **600 koneksi bersamaan** rata-rata. Cadangan tetap diperlukan karena Little's law memberi **rata-rata**: lonjakan sesaat, retransmisi, koneksi yang menunggu timeout (misalnya TIME_WAIT atau sesi setengah terbuka yang masih tercatat di conntrack sampai timeout-nya habis) membuat jumlah entri nyata jauh di atas 600. Tabel yang penuh berarti koneksi baru ditolak, persis saat transaksi paling ramai.

</details>

---

## 14. Sumber

- RFC 7323 — TCP Extensions for High Performance (window scaling, timestamps)
- RFC 8290 — FQ-CoDel (mitigasi bufferbloat)
- ITU-T G.114 — rekomendasi delay satu arah untuk suara (< 150 ms)
- Shannon, C. E. (1948), *A Mathematical Theory of Communication*
- Bufferbloat project — https://www.bufferbloat.net/
- Computer Networks: A Systems Approach, 1.2 Requirements (statistical multiplexing): https://book.systemsapproach.org/foundation/requirements.html
- Computer Networks: A Systems Approach, 6.1 Issues in Resource Allocation (power, M/M/1): https://book.systemsapproach.org/congestion/issues.html
- Little, J. D. C. (1961), A Proof for the Queuing Formula L = λW: https://doi.org/10.1287/opre.9.3.383
- Leland, Taqqu, Willinger, Wilson (1994), On the Self-Similar Nature of Ethernet Traffic: https://doi.org/10.1109/90.282603
- Paxson & Floyd (1995), Wide Area Traffic: The Failure of Poisson Modeling: https://doi.org/10.1109/90.392383
- Appenzeller, Keslassy, McKeown (2004), Sizing Router Buffers: https://doi.org/10.1145/1030194.1015499
- RFC 8289, Controlled Delay Active Queue Management (CoDel): https://www.rfc-editor.org/rfc/rfc8289

Subbagian 6.1 dan 6.4 mengadaptasi sebagian penjelasan dari *Computer Networks: A Systems Approach*, Larry Peterson & Bruce Davie, © Elsevier 2012, https://github.com/SystemsApproach/book, lisensi CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Perubahan: diterjemahkan ke bahasa Indonesia, diringkas, dan diberi contoh hitung baru.

---

**Berikutnya:** `00-fondasi/04-sejarah-dan-standar.md` — siapa yang membuat aturan jaringan dan cara membaca standarnya.

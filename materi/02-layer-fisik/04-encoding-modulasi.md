# 02.4 Encoding dan Modulasi

> **Prasyarat:** `02-layer-fisik/01`, `00-fondasi/02`
> **Tujuan:** Anda paham bagaimana bit menjadi sinyal, kenapa ada overhead encoding, dan kenapa kecepatan link terus naik tanpa kabel berubah.

Modul ini lebih "teoretis" daripada modul lain, tetapi memberi Anda intuisi untuk memahami mengapa 1000BASE-T dan Wi-Fi 7 bisa secepat itu di media yang sama.

---

## 1. Masalah Dasar: Bagaimana Penerima Tahu Batas Antar-Bit?

Bayangkan pengirim mengirimkan 20 bit `0` berurutan sebagai tegangan rendah terus-menerus:

```
Pengirim: 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
Sinyal  : ────────────────────────────────────────
Penerima: "Ini berapa bit ya? 19? 20? 21?"
```

Tanpa penanda, penerima kehilangan **sinkronisasi clock**. Kalau clock pengirim dan penerima berbeda 0,01% saja, setelah ribuan bit posisinya sudah bergeser satu bit penuh — dan seluruh data setelah itu salah.

Tiga cara mengatasi:
1. **Kirim clock terpisah** — butuh kawat tambahan. Tidak praktis untuk jarak jauh.
2. **Sepakati clock yang sangat akurat** — mahal, dan tetap drift.
3. **Sisipkan transisi ke dalam data itu sendiri** ← **ini yang dipakai jaringan.**

Encoding yang baik memenuhi tiga syarat:
- **Self-clocking** — cukup banyak transisi untuk menjaga sinkronisasi.
- **DC balance** — jumlah `1` dan `0` seimbang, agar tidak ada tegangan rata-rata (penting untuk kopling transformator dan AC coupling).
- **Efisien** — overhead sekecil mungkin.

---

## 2. Skema Encoding Dasar

### 2.1 NRZ (Non-Return to Zero)

Paling sederhana: tegangan tinggi = 1, tegangan rendah = 0.

```
Bit    :  1     0     1     1     0     0     0
         ┌──┐        ┌──┬──┐
Sinyal : ┘  └────────┘     └──────────────────
```

- **Benar:** Sederhana, efisien (1 bit per simbol).
- **Hindari:** Tidak self-clocking (deretan panjang bit sama = tidak ada transisi).
- **Hindari:** Tidak DC balanced.

Dipakai sebagai **dasar** di banyak standar, tetapi selalu dikombinasikan dengan scrambling atau block coding.

### 2.2 NRZ-I (Non-Return to Zero Inverted)

Transisi = bit `1`; tidak ada transisi = bit `0`.

```
Bit    :  1     0     1     1     0     1
         ┌─────┐     ┌─────────────┐
Sinyal : ┘     └─────┘              └────────
         ^transisi   ^transisi ^transisi(?)
```

- Lebih tahan terhadap pembalikan polaritas kabel.
- Masih bermasalah dengan deretan `0` panjang.
- Dipakai di FDDI dan USB (dengan bit stuffing).

### 2.3 Manchester Encoding

Setiap bit **selalu** punya transisi di tengah:
- `0` = transisi tinggi→rendah
- `1` = transisi rendah→tinggi

```
Bit    :   0      1      1      0
          ┌─┐    ┌─┐    ┌─┐   ┌─┐
Sinyal :  │ └─┐ ─┘ │   ─┘ │  ─┘ │
          ┘   └───┐│    ─┐│    ─┐
```

- **Sempurna self-clocking** — transisi di setiap bit.
- **Benar:** DC balanced.
- **Efisiensi hanya 50%** — butuh baud rate 2× bit rate.

Dipakai di **10BASE-T** (10 Mbps butuh 20 MHz sinyal) dan Ethernet lama. Tidak dipakai untuk kecepatan tinggi karena boros bandwidth.

### 2.4 Differential Manchester

Transisi di tengah selalu ada (untuk clock), sedangkan **ada/tidaknya transisi di awal bit** menentukan nilainya. Dipakai di Token Ring.

---

## 3. Block Coding: Solusi Modern

Ide: terjemahkan blok bit data ke blok simbol yang lebih panjang, dipilih sedemikian rupa sehingga selalu punya cukup transisi dan DC balance.

### 3.1 4B/5B

Setiap 4 bit data → 5 bit di kabel. Hanya kode 5-bit yang punya cukup transisi yang dipakai.

```
Data (4 bit)  →  Kode (5 bit)
   0000       →     11110
   0001       →     01001
   0010       →     10100
   ...
```

- **Overhead 25%** — 100 Mbps data butuh 125 Mbaud di kabel.
- Kode yang tidak dipakai untuk data dijadikan **simbol kendali** (idle, start, end of stream).
- Dipakai di **100BASE-TX** (dikombinasikan dengan MLT-3) dan FDDI.

### 3.2 8B/10B

Setiap 8 bit → 10 bit. Menjaga DC balance secara aktif dengan **running disparity** (melacak kelebihan `1` atau `0` dan memilih varian kode yang menyeimbangkan).

- **Overhead 25%** — 1 Gbps data butuh 1,25 Gbaud.
- Dipakai di **1000BASE-X** (fiber gigabit), Fibre Channel, PCIe gen 1/2, SATA, DisplayPort.

### 3.3 64B/66B

Setiap 64 bit → 66 bit (2 bit sync header + 64 bit data yang di-*scramble*).

- **Overhead hanya 3,125%** — jauh lebih efisien.
- Scrambling (bukan tabel lookup) menjamin transisi secara statistik.
- Dipakai di **10GBASE-R**, 40G, 100G.

Itulah kenapa 10 Gbps Ethernet berjalan pada ~10,3125 Gbaud, bukan 12,5 Gbaud seperti kalau memakai 8B/10B.

### 3.4 256B/257B

Overhead ~0,4%. Dipakai di 200G/400G bersama FEC.

### Perbandingan efisiensi

| Skema | Overhead | Bit rate 10 Gbps → baud rate |
|---|---|---|
| Manchester | 100% | 20 Gbaud |
| 4B/5B | 25% | 12,5 Gbaud |
| 8B/10B | 25% | 12,5 Gbaud |
| **64B/66B** | **3,1%** | **10,3125 Gbaud** |
| 256B/257B | 0,4% | 10,04 Gbaud |

---

## 4. Multi-Level Signaling: Lebih Banyak Bit per Simbol

Sampai sini kita masih 1 bit per simbol. Untuk naik lebih cepat tanpa menaikkan frekuensi, gunakan **lebih banyak level tegangan**.

### PAM (Pulse Amplitude Modulation)

```
PAM2 (=NRZ):  2 level  → 1 bit/simbol
   +V ─── 1
   −V ─── 0

PAM4:         4 level  → 2 bit/simbol
   +3 ─── 11
   +1 ─── 10
   −1 ─── 01
   −3 ─── 00

PAM5:         5 level  → dipakai di 1000BASE-T (4 level data + 1 untuk FEC)

PAM8:         8 level  → 3 bit/simbol
```

**Trade-off:** makin banyak level, makin sempit jarak antar-level → makin mudah terganggu noise → butuh SNR lebih tinggi. Ini persis hukum Shannon dari `00-fondasi/03`.

### Contoh nyata: 1000BASE-T

Bagaimana 1 Gbps muat di kabel Cat5e yang bandwidth-nya "hanya" 100 MHz?

```
1 Gbps ÷ 4 pasang           = 250 Mbps per pasang
250 Mbps dengan PAM5
  (efektif 2 bit/simbol)     = 125 Mbaud per pasang
125 MHz masih dalam batas Cat5e ✅
Plus: transmisi dua arah bersamaan (echo cancellation)
Plus: Trellis coding untuk koreksi error
```

Ini contoh cemerlang rekayasa: alih-alih menuntut kabel yang lebih baik, kompleksitas dipindahkan ke chip (DSP) yang harganya terus turun.

### Contoh: 10GBASE-T

```
10 Gbps ÷ 4 pasang = 2,5 Gbps per pasang
PAM16 dengan DSP canggih + LDPC FEC
Butuh bandwidth 400–500 MHz → karena itu wajib Cat6A
```

Ini juga menjelaskan kenapa 10GBASE-T memakan **daya jauh lebih besar** (2-5 W per port) daripada 10G fiber (~1 W): DSP-nya bekerja sangat keras.

---

## 5. Modulasi untuk Nirkabel

Di media nirkabel, informasi dibawa dengan mengubah karakteristik gelombang pembawa.

### Tiga parameter yang bisa dimodulasi

```
ASK (Amplitude Shift Keying)  — ubah amplitudo (tinggi gelombang)
FSK (Frequency Shift Keying)  — ubah frekuensi
PSK (Phase Shift Keying)      — ubah fase
```

### QAM (Kombinasi Amplitudo dan Fase)

**QAM** (*Quadrature Amplitude Modulation*) menggabungkan perubahan amplitudo **dan** fase, sehingga satu simbol bisa membawa banyak bit.

Digambarkan sebagai **constellation diagram** — setiap titik = satu kombinasi amplitudo+fase = satu pola bit:

```
   QPSK (4-QAM)          16-QAM                256-QAM
   2 bit/simbol          4 bit/simbol          8 bit/simbol

      •   •            • • • •              (16×16 = 256 titik,
                       • • • •               sangat rapat)
      •   •            • • • •
                       • • • •
```

| Modulasi | Bit/simbol | Butuh SNR (kira-kira) | Dipakai di |
|---|---|---|---|
| BPSK | 1 | ~5 dB | Wi-Fi jarak jauh, kondisi buruk |
| QPSK | 2 | ~10 dB | Wi-Fi, LTE |
| 16-QAM | 4 | ~16 dB | Wi-Fi, LTE |
| 64-QAM | 6 | ~22 dB | Wi-Fi 4/5 |
| 256-QAM | 8 | ~28 dB | Wi-Fi 5 (802.11ac) |
| **1024-QAM** | 10 | ~34 dB | **Wi-Fi 6** (802.11ax) |
| **4096-QAM** | 12 | ~40+ dB | **Wi-Fi 7** (802.11be) |

**Inilah penjelasan teknis fenomena sehari-hari:**

> Klien yang dekat AP (SNR tinggi) mendapat 4096-QAM → sangat cepat.
> Klien yang jauh (SNR rendah) turun ke QPSK → 6× lebih lambat.
> Keduanya "terhubung", tetapi kecepatannya berbeda drastis.

Proses turun-naik modulasi ini disebut **rate adaptation** atau *rate shifting*, dan terjadi otomatis puluhan kali per detik.

### OFDM (Membagi Kanal Menjadi Banyak Subcarrier)

**OFDM** (*Orthogonal Frequency Division Multiplexing*) memecah satu kanal lebar menjadi ratusan subcarrier sempit yang dimodulasi terpisah.

```
Kanal 20 MHz tanpa OFDM:  ████████████████████  satu sinyal lebar
Kanal 20 MHz dengan OFDM: ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌  64 subcarrier sempit
```

Keunggulan:
- **Tahan multipath** — setiap subcarrier sempit sehingga pantulan tidak merusaknya (symbol time panjang relatif terhadap delay spread).
- **Adaptif** — subcarrier yang terganggu bisa dimatikan atau diberi modulasi lebih rendah, sementara yang bersih tetap cepat.
- Dipakai di Wi-Fi (sejak 802.11a/g), LTE, 5G, DSL, DOCSIS.

**OFDMA** (Wi-Fi 6 dan seterusnya) melangkah lebih jauh: subcarrier dibagi menjadi **Resource Unit (RU)** yang bisa dialokasikan ke **klien berbeda pada waktu yang sama**. Sebelumnya, satu transmisi = satu klien; dengan OFDMA, satu transmisi bisa melayani beberapa klien sekaligus — sangat efisien untuk banyak perangkat kecil (IoT, ponsel).

---

## 6. FEC (Forward Error Correction)

Pada kecepatan sangat tinggi, error tidak bisa dihindari. Mengirim ulang terlalu lambat. Solusinya: **kirim informasi redundan sehingga penerima bisa memperbaiki error sendiri.**

```
Data asli   : 1011
Dikirim     : 1011 + paritas/parity bits
Diterima    : 1010 + parity   ← ada 1 bit rusak
Penerima    : mendeteksi & MEMPERBAIKI menjadi 1011  ✅
```

Jenis FEC yang dipakai:
| FEC | Dipakai di |
|---|---|
| Reed-Solomon (RS-FEC) | 25G, 100G, 400G Ethernet |
| LDPC | 10GBASE-T, Wi-Fi 6/7, 5G, DVB |
| Trellis coding | 1000BASE-T |
| Convolutional | Wi-Fi lama, satelit |

**Trade-off:** FEC menambah overhead (biasanya 2-7%) dan **latency** (butuh mengumpulkan blok sebelum bisa mendekode). Untuk aplikasi latency-kritis (HFT, beberapa aplikasi AI/HPC), ada mode "FEC bypass" atau FEC ringan.

> [!WARNING]
> **Masalah interoperabilitas nyata:** mode FEC yang tidak cocok antara dua ujung link 25G/100G menyebabkan link tidak naik atau naik dengan error tinggi. Ini penyebab umum masalah 25G di data center.
```
SW1(config-if)# fec rs-fec        ← paksa mode yang sama di kedua ujung
SW1# show interface eth1/1 | include FEC
```

---

## 7. Auto-Negotiation

Bagaimana dua perangkat menyepakati kecepatan, duplex, dan kemampuan lain?

### Cara kerja (802.3 Clause 28)

```
1. Saat link naik, kedua sisi mengirim FLP (Fast Link Pulse) burst
2. FLP membawa "base page" berisi daftar kemampuan:
   10/100/1000, half/full, pause frame, dll
3. Kedua sisi memilih kemampuan tertinggi yang SAMA-SAMA didukung
   (priority resolution)
4. Untuk 1000BASE-T: negosiasi juga menentukan siapa MASTER dan siapa SLAVE
   (untuk sinkronisasi clock)
5. Link naik dengan setelan yang disepakati
```

**Urutan prioritas** (tertinggi ke terendah):
```
10GBASE-T > 1000BASE-T full > 1000BASE-T half > 100BASE-TX full >
100BASE-T4 > 100BASE-TX half > 10BASE-T full > 10BASE-T half
```

### Masalah klasik: Duplex Mismatch

Terjadi kalau satu sisi auto-negotiation dan sisi lain hard-coded.

```
Switch  : hard-coded 100/full
PC      : auto-negotiation

PC tidak menerima FLP yang menjawab → tidak tahu kemampuan lawan
→ PC memakai parallel detection: bisa mendeteksi KECEPATAN (100)
  tetapi TIDAK bisa mendeteksi duplex → default ke HALF duplex

Hasil: Switch full duplex, PC half duplex → DUPLEX MISMATCH
```

**Gejalanya sangat menipu:**
- Link naik normal, lampu hijau
- `ping` kecil berhasil
- Transfer besar sangat lambat (bisa 10-100× lebih lambat)
- Sisi half melihat banyak **collision** dan **late collision**
- Sisi full melihat banyak **CRC/FCS error** dan **runts**

**Aturan emas:**
> **Auto di kedua sisi, ATAU hard-code di kedua sisi. Jangan campur.**
> Untuk 1000BASE-T ke atas, auto-negotiation adalah **wajib** menurut standar — jangan pernah mematikannya.

Deteksi:
```
SW1# show interfaces gi0/1 | include duplex|collision|error
  Full-duplex, 100Mb/s
  ...
  1523 input errors, 1401 CRC, 122 frame
  0 output errors, 8734 collisions, 445 late collision
```
> [!WARNING]
> **Late collision adalah tanda paling khas duplex mismatch** (atau kabel terlalu panjang).

---

## 8. Rangkuman Encoding per Standar

| Standar | Encoding | Modulasi | Baud rate |
|---|---|---|---|
| 10BASE-T | Manchester | PAM2 | 20 Mbaud |
| 100BASE-TX | 4B/5B + MLT-3 | 3 level | 125 Mbaud |
| 1000BASE-T | 8B1Q4 + Trellis | PAM5, 4 pasang, dua arah | 125 Mbaud/pasang |
| 1000BASE-X (fiber) | 8B/10B | NRZ | 1,25 Gbaud |
| 10GBASE-T | DSQ128 + LDPC | PAM16 | 800 Mbaud/pasang |
| 10GBASE-R (fiber) | 64B/66B | NRZ | 10,3125 Gbaud |
| 25GBASE-R | 64B/66B + RS-FEC | NRZ | 25,78 Gbaud |
| 100GBASE-SR4 | 64B/66B | NRZ, 4 jalur | 25,78 Gbaud × 4 |
| 400GBASE-DR4 | 256B/257B + RS-FEC | **PAM4**, 4 jalur | 53,125 Gbaud × 4 |
| Wi-Fi 6 (11ax) | LDPC | OFDMA + 1024-QAM | — |
| Wi-Fi 7 (11be) | LDPC | OFDMA + 4096-QAM, MLO | — |

Pola yang terlihat:
1. Overhead encoding turun (100% → 25% → 3% → 0,4%)
2. Bit per simbol naik (1 → 2 → 4 → 12)
3. FEC menjadi wajib di kecepatan tinggi
4. Kompleksitas berpindah dari kabel ke silikon

---

## 9. Praktik

```bash
# Lihat kemampuan yang dinegosiasikan
$ ethtool eth0
        Supported link modes:   10baseT/Half 10baseT/Full
                                100baseT/Half 100baseT/Full
                                1000baseT/Full
        Advertised link modes:  ... (yang diiklankan sisi kita)
        Link partner advertised link modes: ...  (yang diiklankan lawan)
        Speed: 1000Mb/s
        Duplex: Full
        Auto-negotiation: on

# Paksa kecepatan/duplex (HANYA kalau benar-benar perlu, dan set kedua sisi!)
# sudo ethtool -s eth0 speed 100 duplex full autoneg off

# Kembalikan ke auto
# sudo ethtool -s eth0 autoneg on

# Cek error yang mengindikasikan masalah encoding/duplex
$ ethtool -S eth0 | grep -iE 'crc|frame|collision|late'
```

Di Cisco:
```
SW1# show interfaces gi0/1 status
SW1# show interfaces gi0/1 capabilities
SW1(config-if)# speed auto
SW1(config-if)# duplex auto
SW1# show interfaces counters errors
```

---

## 10. Kesalahan Umum

> [!WARNING]
> **1. Mematikan auto-negotiation di satu sisi saja.** Penyebab duplex mismatch nomor satu.

> [!WARNING]
> **2. Hard-code kecepatan pada 1000BASE-T.** Standar mewajibkan auto-negotiation untuk gigabit (dibutuhkan untuk penentuan master/slave). Mematikannya bisa membuat link tidak naik sama sekali.

> [!WARNING]
> **3. Mengabaikan mode FEC di 25G/100G.** Mismatch FEC = link gagal atau error tinggi.

> [!WARNING]
> **4. Mengira "link naik = semuanya baik".** Duplex mismatch memberi link yang naik tetapi kinerja hancur.

> [!WARNING]
> **5. Mengharapkan Wi-Fi mencapai kecepatan maksimum di semua jarak.** Modulasi turun otomatis seiring SNR menurun — ini fitur, bukan bug.

---

## 11. Ringkasan

- Encoding harus **self-clocking** dan **DC balanced**, bukan sekadar memetakan 1/0.
- Manchester (10BASE-T) boros 100%; block coding jauh lebih efisien: 4B/5B (25%), 8B/10B (25%), **64B/66B (3,1%)**, 256B/257B (0,4%).
- Multi-level signaling (PAM4/PAM5/PAM16) menaikkan bit per simbol tanpa menaikkan frekuensi — dibatasi SNR.
- 1000BASE-T: 4 pasang × PAM5 × dua arah + echo cancellation → 1 Gbps di Cat5e.
- **QAM**: makin banyak titik konstelasi, makin banyak bit/simbol, makin butuh SNR tinggi. Wi-Fi 6 = 1024-QAM, Wi-Fi 7 = 4096-QAM.
- **OFDM/OFDMA** membagi kanal menjadi subcarrier; tahan multipath dan bisa melayani banyak klien sekaligus.
- **FEC** memperbaiki error tanpa retransmisi; wajib di 25G ke atas; mismatch FEC = link gagal.
- **Auto-negotiation**: auto di kedua sisi atau hard-code di kedua sisi — jangan campur. **Late collision = tanda duplex mismatch.**

---

## 12. Latihan

1. Kenapa Manchester encoding tidak dipakai untuk gigabit Ethernet?
2. 10GBASE-R memakai 64B/66B. Berapa baud rate di kabel untuk 10 Gbps data?
3. Jelaskan bagaimana 1000BASE-T mencapai 1 Gbps di kabel Cat5e yang bandwidth-nya 100 MHz.
4. Klien Wi-Fi menunjukkan RSSI −45 dBm (kuat) tetapi kecepatannya rendah. Sebutkan dua kemungkinan penyebab terkait modulasi.
5. Sebuah link menunjukkan CRC error di satu sisi dan late collision di sisi lain. Apa diagnosis Anda?
6. Kenapa 10GBASE-T memakan daya jauh lebih besar daripada 10GBASE-SR?
7. Dua switch 25G tidak bisa membentuk link walaupun kabel dan transceiver benar. Apa yang harus diperiksa terkait modul ini?

<details>
<summary>Jawaban</summary>

1. Karena efisiensinya hanya 50% — butuh baud rate 2× bit rate. Untuk 1 Gbps berarti 2 Gbaud, yang jauh melampaui bandwidth kabel Cat5e (100 MHz). Encoding modern memakai overhead jauh lebih kecil plus multi-level signaling.

2. 10 Gbps × (66/64) = **10,3125 Gbaud**. Overhead 64B/66B hanya 3,125%.

3. Tiga teknik digabung: (a) **4 pasang dipakai paralel** → 250 Mbps per pasang; (b) **PAM5** memberi efektif 2 bit per simbol → 125 Mbaud per pasang, masih dalam bandwidth Cat5e; (c) **transmisi dua arah bersamaan** pada setiap pasang menggunakan echo cancellation di DSP. Ditambah Trellis coding untuk koreksi error. Kompleksitasnya ada di chip, bukan di kabel.

4. (a) **SNR rendah walaupun RSSI tinggi** — ada sumber interferensi kuat di kanal yang sama (noise floor tinggi), sehingga modulasi turun ke tingkat rendah. (b) **Co-channel interference / kanal padat** — banyak perangkat berbagi airtime sehingga throughput per klien rendah meski modulasi tinggi. Kemungkinan lain: klien hanya mendukung standar/spatial stream lebih rendah, atau AP kekurangan daya PoE sehingga radio berjalan di mode terbatas.

5. **Duplex mismatch.** Sisi yang half-duplex mendeteksi late collision (karena sisi lain mengirim kapan saja), sedangkan sisi full-duplex melihat frame rusak sebagai CRC error. Perbaikan: set kedua sisi ke auto-negotiation (atau hard-code identik di kedua sisi).

6. Karena 10GBASE-T harus melawan keterbatasan kabel tembaga: PAM16 dengan 16 level tegangan yang sangat rapat, transmisi dua arah pada 4 pasang, echo cancellation, crosstalk cancellation, dan LDPC FEC — semuanya memerlukan **DSP yang bekerja sangat intensif**. 10GBASE-SR di serat hanya perlu NRZ sederhana dengan 64B/66B karena serat jauh lebih "bersih".

7. **Mode FEC yang tidak cocok.** Pada 25G, ada beberapa mode: RS-FEC (Clause 91), FC-FEC/BASE-R (Clause 74), dan no-FEC. Jika kedua ujung memakai mode berbeda, link tidak akan naik. Periksa dan samakan dengan `show interface ... | include FEC` lalu set eksplisit di kedua sisi. Periksa juga auto-negotiation 25G (Clause 73) yang perilakunya bisa berbeda antar-vendor.

</details>

---

## 13. Sumber

- IEEE 802.3 Clause 23 (Manchester), 24 (4B/5B), 36 (8B/10B), 49 (64B/66B), 91 (RS-FEC)
- IEEE 802.3 Clause 28 — Auto-Negotiation
- IEEE 802.11-2020 — modulasi & OFDM Wi-Fi
- Cisco, *Troubleshooting Ethernet Collisions and Duplex Mismatch*

---

**Berikutnya:** `03-data-link/01-ethernet-frame-mac.md`. Masuk ke Layer 2, tempat sebagian besar pekerjaan harian network engineer berada.

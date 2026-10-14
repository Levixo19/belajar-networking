# 02.1 — Media Transmisi dan Gangguan Sinyal

> **Prasyarat:** `00-fondasi/03`, `01-model-referensi/01`
> **Tujuan:** Anda paham tiga jenis media, tahu gangguan apa yang menyerang masing-masing, dan bisa memilih media yang tepat berdasarkan jarak, kecepatan, dan lingkungan.

---

## 1. Tiga Jenis Media

| | Tembaga (copper) | Serat optik (fiber) | Nirkabel (wireless) |
|---|---|---|---|
| Membawa | Sinyal listrik | Cahaya | Gelombang radio |
| Jarak tipikal | 100 m | 300 m – 100+ km | 30–100 m indoor |
| Kecepatan | 1–40 Gbps | 1 Gbps – 800 Gbps+ | 100 Mbps – beberapa Gbps |
| Kekebalan EMI | Buruk | **Sempurna** | Buruk |
| Keamanan fisik | Bisa disadap | Sulit disadap | **Paling mudah disadap** |
| Biaya per meter | Murah | Sedang (kabel murah, optik mahal) | Tanpa kabel |
| Instalasi | Mudah | Butuh keahlian (splicing) | Paling mudah |
| Bisa bawa listrik (PoE) | ✅ Ya | ❌ Tidak | ❌ Tidak |
| Media bersama? | Tidak (switched) | Tidak | **Ya** (half duplex) |

### Aturan pemilihan cepat

```
Jarak < 100 m, butuh PoE, budget ketat     → Tembaga (UTP Cat6/6A)
Jarak > 100 m, antar-gedung, backbone       → Serat optik
Ada gangguan listrik berat (pabrik, dekat
  motor/las/kabel HV)                       → Serat optik (wajib)
Butuh isolasi listrik antar-gedung
  (beda grounding, risiko petir)            → Serat optik (wajib)
Perangkat bergerak, sulit ditarik kabel     → Nirkabel
Butuh throughput konsisten & rendah latency → Kabel, bukan nirkabel
```

⚠️ **Aturan yang sering dilanggar:** menghubungkan dua gedung terpisah dengan kabel tembaga. Perbedaan potensial tanah (*ground potential difference*) dan sambaran petir bisa merusak perangkat di kedua ujung — bahkan membahayakan orang. Antar-gedung **selalu** pakai serat optik (atau media converter dengan isolasi yang benar).

---

## 2. Musuh Sinyal

### 2.1 Atenuasi (Attenuation)

Sinyal melemah seiring jarak. Ini fisika, tidak bisa dihindari — hanya bisa dikelola.

```
Kuat sinyal
    │╲
    │ ╲___
    │     ╲____
    │          ╲_____  ← di bawah ambang deteksi = bit error
    └──────────────────► Jarak
```

- **Tembaga:** melemah karena resistansi kabel; makin tinggi frekuensi, makin cepat melemah. Inilah alasan batas 100 m untuk UTP.
- **Serat:** melemah jauh lebih lambat (~0,2–0,35 dB/km untuk single-mode) — karena itu bisa puluhan kilometer.
- **Nirkabel:** melemah dengan kuadrat jarak (*free space path loss*), plus terhalang benda.

Solusi: repeater, switch (yang membangkitkan ulang sinyal), amplifier optik, atau memperpendek jarak.

### 2.2 Noise (derau)

Sinyal asing yang bercampur dengan sinyal Anda.

- **EMI** (*Electromagnetic Interference*) — dari motor listrik, lampu neon/ballast, kabel listrik, lift, mesin las, microwave.
- **RFI** (*Radio Frequency Interference*) — dari pemancar radio, ponsel, Wi-Fi tetangga.
- **Thermal noise** — derau dasar akibat gerakan elektron; tidak bisa dihilangkan.
- **Impulse noise** — lonjakan mendadak (petir, kontaktor, switching daya).

Serat optik **kebal EMI/RFI sepenuhnya** karena membawa cahaya, bukan listrik. Ini keunggulan yang menentukan di lingkungan industri.

### 2.3 Crosstalk

Sinyal dari satu pasang kabel "bocor" ke pasangan tetangga di dalam kabel yang sama.

| Jenis | Arti |
|---|---|
| **NEXT** (*Near-End Crosstalk*) | Bocor ke pasangan lain **di ujung yang sama** dengan pemancar |
| **FEXT** (*Far-End Crosstalk*) | Bocor terukur di **ujung jauh** |
| **ACR-F / ELFEXT** | FEXT relatif terhadap atenuasi |
| **Alien crosstalk** | Bocor dari **kabel lain** di sebelahnya (masalah di Cat6A 10G) |

**Mitigasi crosstalk pada UTP:** setiap pasang dipilin (*twisted*) dengan **rapatan berbeda**. Pilinan membuat medan elektromagnetik saling meniadakan; rapatan berbeda mencegah dua pasang beresonansi bersama.

⚠️ **Konsekuensi praktis:** jangan membuka pilinan lebih dari **13 mm** saat memasang RJ45. Instalasi yang "rapi terlihat" dengan pilinan dibuka panjang justru gagal uji sertifikasi Cat6.

### 2.4 Distorsi & Delay Skew

- **Distorsi** — bentuk sinyal berubah karena komponen frekuensi berbeda merambat dengan kecepatan berbeda.
- **Delay skew** — 4 pasang dalam satu kabel punya panjang fisik sedikit berbeda (karena rapatan pilinan berbeda), sehingga bit tiba tidak bersamaan. Penting untuk 1000BASE-T yang memakai keempat pasang secara paralel.

### 2.5 Return Loss & Impedance Mismatch

Kabel jaringan punya **impedansi karakteristik 100 Ω** (UTP). Jika ada perubahan impedansi (konektor buruk, kabel tertekuk tajam, sambungan campuran), sebagian sinyal **memantul kembali** ke pengirim.

Ini yang diukur sebagai **return loss**. Nilai buruk = banyak pantulan = error.

Penyebab umum di lapangan:
- Konektor RJ45 di-crimp asal-asalan
- Menyambung Cat5e dengan Cat6 di tengah jalur
- Kabel tertekuk melebihi radius tekuk minimum
- Kabel terjepit staples atau tertindih

### 2.6 Latency & Jitter

Sudah dibahas di `00-fondasi/03`. Di layer fisik, penyebabnya adalah kecepatan rambat sinyal dan panjang media.

---

## 3. SNR — Rasio Sinyal terhadap Derau

```
SNR (dB) = 10 × log₁₀ (daya sinyal / daya derau)
```

Inilah **metrik yang paling menentukan** kualitas link, bukan "kekuatan sinyal" saja.

Analogi: berbicara di ruang sepi dengan suara pelan lebih jelas daripada berteriak di konser. Yang penting bukan volume suara Anda, tapi **selisih** antara suara Anda dan kebisingan.

Konsekuensi (dari hukum Shannon di `00-fondasi/03`):
- SNR tinggi → bisa memakai modulasi padat (banyak bit per simbol) → cepat.
- SNR rendah → harus turun ke modulasi sederhana → lambat, tapi tetap terhubung.

Ini menjelaskan perilaku yang sering membingungkan:
> Wi-Fi menunjukkan "sinyal penuh" tetapi lambat — karena ada sumber derau kuat di frekuensi yang sama, sehingga SNR rendah walaupun RSSI tinggi.

Panduan kasar SNR untuk Wi-Fi:
| SNR | Kualitas |
|---|---|
| > 40 dB | Sangat baik, kecepatan maksimum |
| 25–40 dB | Baik, cocok untuk data & suara |
| 15–25 dB | Cukup, kecepatan menurun |
| < 15 dB | Buruk, sering terputus |

---

## 4. Desibel (dB) — Wajib Dipahami

Semua pengukuran sinyal memakai skala logaritmik.

```
dB   = perbandingan relatif (tanpa satuan absolut)
dBm  = daya absolut, relatif terhadap 1 mW
dBi  = penguatan antena relatif terhadap antena isotropis
```

### Aturan 3 dan 10 — hafalkan ini

| Perubahan | Artinya |
|---|---|
| **+3 dB** | Daya **2×** lipat |
| **−3 dB** | Daya **½** |
| **+10 dB** | Daya **10×** |
| **−10 dB** | Daya **1/10** |
| **+20 dB** | Daya 100× |
| **−20 dB** | Daya 1/100 |

Contoh perhitungan cepat:
```
0 dBm  = 1 mW
+3 dBm = 2 mW
+10 dBm = 10 mW
+20 dBm = 100 mW
+30 dBm = 1000 mW = 1 W
−30 dBm = 0,000001 mW (sinyal Wi-Fi yang masih bisa diterima)
```

### Kenapa logaritmik?

Karena rentangnya luar biasa besar. Pemancar Wi-Fi 100 mW, penerima bisa mendeteksi 0,000000001 mW. Menuliskan itu dalam angka biasa tidak praktis; dalam dBm menjadi +20 dBm dan −90 dBm.

Keuntungan lain: **penguatan dan redaman tinggal dijumlahkan**, tidak dikalikan.
```
Pemancar +20 dBm
Kabel −3 dB
Antena +9 dBi
Path loss −80 dB
─────────────────
Diterima: 20 − 3 + 9 − 80 = −54 dBm
```

Ini dipakai untuk **link budget** — perhitungan wajib saat merancang link nirkabel atau serat optik (`02-layer-fisik/03`, `10-wireless/01`).

---

## 5. Simplex, Half Duplex, Full Duplex

Sudah diperkenalkan di `00-fondasi/03`; di sini konsekuensi fisiknya.

**Kenapa Ethernet kabel bisa full duplex:**
Kabel UTP punya 4 pasang. Pada 10/100BASE-TX, satu pasang untuk kirim, satu pasang untuk terima — terpisah secara fisik, jadi tidak mungkin bertabrakan.

Pada 1000BASE-T, keempat pasang dipakai **dua arah sekaligus** — dimungkinkan oleh *echo cancellation* di chip (perangkat "mengurangi" sinyal yang ia kirim sendiri dari yang ia terima).

**Kenapa Wi-Fi selalu half duplex:**
Radio memakai satu frekuensi. Jika perangkat mengirim dan menerima bersamaan di frekuensi yang sama, sinyal kirimnya sendiri (yang jutaan kali lebih kuat) akan menenggelamkan sinyal terima. Karena itu Wi-Fi harus bergiliran (CSMA/CA).

Konsekuensi: **kapasitas Wi-Fi dibagi antara semua klien dan kedua arah.** "Wi-Fi 6 sampai 9,6 Gbps" adalah angka agregat teoretis, bukan yang didapat satu klien.

---

## 6. Baseband vs Broadband (Ulasan)

- **Baseband** — satu sinyal digital memakai seluruh kapasitas media. Ethernet (`1000BASE-T` → "BASE" = baseband).
- **Broadband** — media dibagi menjadi banyak kanal frekuensi. TV kabel, DOCSIS, DSL, dan OFDM di Wi-Fi/5G.

---

## 7. Membaca Nama Standar Ethernet

Format: `<kecepatan>BASE-<media/penanda>`

```
1000 BASE - T
 │     │     │
 │     │     └── T = Twisted pair (tembaga)
 │     │         X = penanda encoding blok (mis. 100BASE-TX)
 │     │         S = Short wavelength fiber (850 nm, multimode)
 │     │         L = Long wavelength fiber (1310 nm, single-mode)
 │     │         E = Extra long (1550 nm)
 │     │         C = twinax/copper cable (DAC)
 │     │         K = backplane
 │     └── BASE = baseband
 └── kecepatan dalam Mbps (1000 = 1 Gbps)
```

Contoh yang wajib dikenal:

| Standar | Kecepatan | Media | Jarak maks |
|---|---|---|---|
| 10BASE-T | 10 Mbps | UTP Cat3+ | 100 m |
| 100BASE-TX | 100 Mbps | UTP Cat5+ | 100 m |
| **1000BASE-T** | 1 Gbps | UTP Cat5e+ | 100 m |
| 1000BASE-SX | 1 Gbps | MMF 850 nm | 220–550 m |
| 1000BASE-LX | 1 Gbps | SMF 1310 nm | 5–10 km |
| **10GBASE-T** | 10 Gbps | UTP Cat6A | 100 m (Cat6: 55 m) |
| 10GBASE-SR | 10 Gbps | MMF | 26–400 m (OM3/OM4) |
| 10GBASE-LR | 10 Gbps | SMF | 10 km |
| 25GBASE-SR | 25 Gbps | MMF | 70–100 m |
| 40GBASE-SR4 | 40 Gbps | MMF (MPO 8 serat) | 100–150 m |
| 100GBASE-SR4 | 100 Gbps | MMF (MPO) | 70–100 m |
| 100GBASE-LR4 | 100 Gbps | SMF | 10 km |
| 400GBASE-DR4 | 400 Gbps | SMF (MPO) | 500 m |

💡 Angka `4` di akhir (SR4, LR4) berarti sinyal dibagi ke **4 jalur paralel** — 4 pasang serat atau 4 panjang gelombang.

---

## 8. Praktik

### Periksa kondisi link fisik
```bash
$ ethtool eth0
Settings for eth0:
        Supported ports: [ TP ]
        Supported link modes: 10baseT/Half 10baseT/Full
                              100baseT/Half 100baseT/Full
                              1000baseT/Full
        Speed: 1000Mb/s
        Duplex: Full
        Auto-negotiation: on
        Link detected: yes
```

### Lihat statistik error fisik
```bash
$ ip -s link show eth0
    RX: bytes packets errors dropped missed mcast
    ...            0       0       0     0
    TX: bytes packets errors dropped carrier collsns
    ...            0       0       0        0

$ ethtool -S eth0 | grep -iE 'err|crc|drop|discard'
```

⚠️ **CRC error yang terus bertambah = masalah layer 1.** Kabel, konektor, SFP, atau interferensi. Bukan masalah routing.

### Di Cisco
```
SW1# show interfaces gi0/1
  ...
  0 input errors, 0 CRC, 0 frame, 0 overrun, 0 ignored
  0 output errors, 0 collisions, 0 interface resets

SW1# show interfaces gi0/1 transceiver detail    ← daya optik SFP
SW1# show interfaces status err-disabled
```

### Uji kabel dari switch (Cisco TDR)
```
SW1# test cable-diagnostics tdr interface gi0/1
SW1# show cable-diagnostics tdr interface gi0/1
```
Ini menunjukkan panjang kabel dan lokasi perkiraan kerusakan tiap pasang.

---

## 9. Kesalahan Umum

⚠️ **1. Menarik kabel data sejajar kabel listrik.** Sumber EMI utama. Jaga jarak minimal 30 cm untuk jalur paralel panjang; kalau harus menyeberang, buat sudut 90°.

⚠️ **2. Menghubungkan gedung berbeda dengan tembaga.** Risiko petir & perbedaan potensial tanah. Gunakan serat.

⚠️ **3. Melebihi 100 m pada UTP.** Batas ini mencakup patch cord di kedua ujung (90 m permanent link + 2×5 m patch). Melebihinya menyebabkan error yang muncul acak dan sulit dilacak.

⚠️ **4. Mengabaikan radius tekuk.** Serat yang tertekuk tajam kehilangan cahaya (macrobend loss). UTP yang tertekuk mengubah impedansi.

⚠️ **5. Mengira "sinyal kuat = cepat" pada Wi-Fi.** Yang menentukan adalah SNR.

⚠️ **6. Memakai kabel murah tanpa sertifikasi.** Banyak kabel "Cat6" di pasar sebenarnya CCA (*Copper Clad Aluminum*) — bukan tembaga murni. Resistansi lebih tinggi, gagal pada PoE dan pada jarak jauh, dan mudah patah.

---

## 10. Ringkasan

- Tiga media: tembaga (murah, PoE, 100 m), serat (jauh, cepat, kebal EMI), nirkabel (fleksibel, half duplex, mudah disadap).
- Musuh sinyal: atenuasi, noise (EMI/RFI), crosstalk (NEXT/FEXT/alien), distorsi, delay skew, return loss.
- Pilinan pada UTP meniadakan interferensi; jangan buka lebih dari 13 mm.
- **SNR** lebih menentukan daripada kekuatan sinyal semata.
- dB logaritmik: +3 dB = 2× daya, +10 dB = 10× daya. Penguatan/redaman dijumlahkan.
- Wi-Fi selalu half duplex karena keterbatasan radio; Ethernet full duplex karena pasangan terpisah/echo cancellation.
- Format nama standar: `<kecepatan>BASE-<media>`; `T`=tembaga, `S`=MMF, `L`=SMF.
- Antar-gedung wajib serat optik.

---

## 11. Latihan

1. Pemancar +23 dBm, kabel rugi 4 dB, antena +12 dBi. Berapa EIRP-nya?
2. Sinyal diterima −70 dBm dan noise floor −95 dBm. Berapa SNR-nya? Bagaimana kualitasnya?
3. Kenapa pasangan kabel UTP dipilin dengan rapatan yang berbeda-beda?
4. Anda harus menghubungkan switch di gedung A ke switch di gedung B, jarak 180 m, terpisah halaman terbuka. Media apa dan mengapa?
5. Link 1 Gbps antar-switch menunjukkan CRC error naik terus. Sebutkan empat kemungkinan penyebab layer 1.
6. Daya sinyal turun dari 40 mW ke 10 mW. Berapa dB penurunannya?

<details>
<summary>Jawaban</summary>

1. EIRP = 23 − 4 + 12 = **+31 dBm** (≈ 1,26 W).

2. SNR = −70 − (−95) = **25 dB**. Ini di batas bawah kategori "baik" — cukup untuk data dan suara, tetapi tidak akan mencapai kecepatan maksimum. Perlu diperbaiki jika untuk aplikasi berat.

3. Agar dua pasangan yang berdekatan tidak "beresonansi" bersama. Jika rapatan pilinannya sama, medan magnet keduanya berpola serupa dan crosstalk justru menguat. Rapatan berbeda membuat pola interferensi tidak sinkron sehingga saling meniadakan.

4. **Serat optik** (single-mode atau multimode dengan transceiver yang sesuai). Alasan: (a) 180 m melebihi batas 100 m UTP; (b) antar-gedung berarti risiko perbedaan potensial tanah dan sambaran petir — serat memberi isolasi listrik sempurna; (c) halaman terbuka berarti jalur luar ruangan, perlu kabel outdoor/armored.

5. Contoh: (a) kabel rusak/tertekuk/terjepit; (b) konektor RJ45 buruk atau kotor / SFP tidak duduk sempurna; (c) panjang kabel melebihi batas; (d) interferensi EMI dari kabel listrik/motor; (e) SFP tidak kompatibel atau daya optik di luar rentang; (f) duplex mismatch (menghasilkan CRC/late collision); (g) kabel CCA berkualitas rendah.

6. 40 → 10 mW adalah faktor 1/4 = ½ × ½ = −3 dB + (−3 dB) = **−6 dB**.

</details>

---

## 12. Sumber

- IEEE 802.3 — Ethernet (semua varian media)
- TIA/EIA-568 — Commercial Building Telecommunications Cabling Standard
- Cisco CCNA 200-301 v1.1, topik 1.3 (physical interface & cabling) dan 1.4 (interface & cable issues)
- ISO/IEC 11801 — Generic cabling for customer premises

---

**Berikutnya:** `02-layer-fisik/02-kabel-copper.md` — semua tentang UTP, kategori, pinout, dan PoE.

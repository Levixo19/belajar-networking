# 02.3 — Serat Optik

> **Prasyarat:** `02-layer-fisik/01`, `02-layer-fisik/02`
> **Tujuan:** Anda bisa memilih jenis serat & transceiver yang tepat, menghitung power budget optik, dan mendiagnosis masalah link fiber.

---

## 1. Cara Serat Optik Bekerja

Serat optik membawa **cahaya**, bukan listrik. Prinsipnya **total internal reflection** (pemantulan internal sempurna).

```
   Penampang memanjang serat:

   ═══════════════ CLADDING (indeks bias rendah) ═══════════════
   ╲    ╱╲    ╱╲    ╱╲    ╱╲
    ╲  ╱  ╲  ╱  ╲  ╱  ╲  ╱      ← cahaya memantul di batas core/cladding
     ╲╱    ╲╱    ╲╱    ╲╱          CORE (indeks bias tinggi)
   ═══════════════ CLADDING ══════════════════════════════════
   ─────────────── COATING / BUFFER ──────────────────────────
```

Cahaya masuk dengan sudut tertentu, memantul terus di batas core–cladding, dan merambat sampai ujung. Karena tidak ada arus listrik:
- **Kebal EMI/RFI sepenuhnya**
- **Tidak memancarkan sinyal** → sangat sulit disadap tanpa terdeteksi
- **Isolasi listrik sempurna** → aman untuk antar-gedung
- **Atenuasi sangat rendah** → bisa puluhan sampai ratusan kilometer

Struktur fisik dari dalam ke luar:
```
Core (8,3 µm atau 50/62,5 µm)
  → Cladding (125 µm — SELALU 125 µm, baik SMF maupun MMF)
    → Coating/buffer (250 µm atau 900 µm tight-buffered)
      → Strength member (biasanya serat aramid/Kevlar)
        → Jacket luar
```

---

## 2. Single-Mode vs Multimode

Perbedaan terpenting yang harus Anda kuasai.

| | **Single-mode (SMF)** | **Multimode (MMF)** |
|---|---|---|
| Diameter core | **8–10 µm** (sangat kecil) | **50 µm** atau 62,5 µm |
| Cladding | 125 µm | 125 µm |
| Jalur cahaya | Satu jalur lurus | Banyak jalur memantul |
| Sumber cahaya | Laser (mahal, presisi) | LED atau VCSEL (murah) |
| Panjang gelombang | 1310 nm, 1550 nm | 850 nm, 1300 nm |
| Jarak | **10 km – 100+ km** | 100 m – 2 km |
| Bandwidth | Sangat besar | Terbatas oleh dispersi modal |
| Harga kabel | Lebih murah | Sedikit lebih mahal |
| Harga transceiver | **Lebih mahal** | Lebih murah |
| Warna jaket (konvensi) | **Kuning** | Oranye (OM1/OM2), **Aqua** (OM3/OM4), **Magenta/ungu** (OM5) |
| Untuk | Antar-gedung, WAN, backbone jauh | Dalam gedung, dalam data center |

### Dispersi Modal — kenapa MMF terbatas jarak

Pada MMF, cahaya masuk dengan banyak sudut berbeda ("mode"). Cahaya yang memantul dengan sudut tajam menempuh jarak lebih panjang daripada yang lurus.

```
Masuk bersamaan:  ▮▮▮
                   ╲    ╱╲    ╱╲
                    ╲  ╱  ╲  ╱  ╲     ← jalur panjang, tiba TERLAMBAT
                     ──────────────    ← jalur lurus, tiba DULUAN
Keluar tersebar:  ▮  ▮  ▮
```

Pulsa yang tadinya tajam menjadi melebar. Kalau melebar sampai tumpang tindih dengan pulsa berikutnya, penerima tidak bisa membedakan bit. Ini yang membatasi **jarak × bandwidth** MMF.

Pada SMF, core sangat kecil sehingga hanya satu mode yang bisa merambat — tidak ada dispersi modal. Yang tersisa hanya dispersi kromatik (lebih kecil dan bisa dikompensasi).

### Kategori MMF (OM = Optical Multimode)

| Kategori | Core | Bandwidth @850 nm | 1 G | 10 G | 40/100 G | Warna |
|---|---|---|---|---|---|---|
| **OM1** | 62,5 µm | 200 MHz·km | 275 m | 33 m | — | Oranye |
| **OM2** | 50 µm | 500 MHz·km | 550 m | 82 m | — | Oranye |
| **OM3** | 50 µm | 2000 MHz·km | 550 m | **300 m** | 100 m | Aqua |
| **OM4** | 50 µm | 4700 MHz·km | 550 m | **400 m** | 150 m | Aqua |
| **OM5** | 50 µm | 4700 MHz·km (+ WDM) | 550 m | 400 m | 150 m | Lime/magenta |

- **OM1/OM2 sudah usang** untuk instalasi baru.
- **OM3 minimum, OM4 direkomendasikan** untuk data center.
- **OM5** mendukung SWDM (beberapa panjang gelombang di MMF) — adopsi terbatas.

⚠️ **Jangan mencampur OM1 (62,5 µm) dengan OM3/OM4 (50 µm)** dalam satu jalur. Perbedaan diameter core menyebabkan rugi daya besar (terutama arah 62,5 → 50 µm) dan link tidak akan stabil.

### Kategori SMF (OS = Optical Single-mode)

| Kategori | Atenuasi | Untuk |
|---|---|---|
| **OS1** | ≤1,0 dB/km | Indoor, tight-buffered |
| **OS2** | ≤0,4 dB/km | Outdoor, loose tube, jarak jauh |

Standar serat SMF yang paling umum: **ITU-T G.652.D** (low water peak, cocok untuk semua panjang gelombang 1260–1625 nm).

---

## 3. Konektor

| Konektor | Bentuk | Ukuran | Dipakai untuk |
|---|---|---|---|
| **LC** | Latch kecil (seperti RJ45 mini) | Small form factor | **Paling umum** — SFP, SFP+, SFP28 |
| **SC** | Push-pull kotak | Standar | Perangkat lama, GBIC, ODF, FTTH |
| **ST** | Bayonet putar (seperti BNC) | Standar | Instalasi lama |
| **FC** | Ulir | Standar | Alat ukur, telekomunikasi |
| **MPO/MTP** | Multi-fiber ribbon (8/12/24 serat) | Besar | 40G/100G/400G, cabling data center |
| **E2000** | Dengan shutter otomatis | Standar | Telekomunikasi Eropa |

### Polish (bentuk permukaan ujung)

| Tipe | Return loss | Warna konektor | Untuk |
|---|---|---|---|
| **PC** (Physical Contact) | ~−35 dB | — | Umum lama |
| **UPC** (Ultra PC) | ~−50 dB | **Biru** | Standar data (Ethernet) |
| **APC** (Angled PC, 8°) | ~−60 dB | **Hijau** | FTTH, video RF, aplikasi sensitif pantulan |

⚠️ **JANGAN mencolokkan APC ke UPC.** Ujung APC bersudut 8°, ujung UPC datar — menyambungkannya menyebabkan celah udara: rugi daya besar dan bisa merusak permukaan konektor secara permanen. Ingat: **hijau hanya dengan hijau, biru hanya dengan biru.**

### Simplex vs Duplex

- **Simplex** — satu serat, satu arah. Dipakai dengan BiDi transceiver.
- **Duplex** — dua serat: satu TX, satu RX. Standar untuk kebanyakan Ethernet fiber.

⚠️ **Kesalahan paling umum pada link fiber baru: TX dan RX tertukar.** Gejalanya: link tidak naik sama sekali, dan `show interfaces transceiver` menunjukkan RX power sangat rendah (mis. −40 dBm). Solusinya: balik salah satu ujung. Ini kesalahan yang wajar dan cepat diperbaiki — periksa ini **sebelum** menuduh SFP rusak.

---

## 4. Transceiver (Optik yang Dapat Dilepas)

| Form factor | Kecepatan | Konektor | Catatan |
|---|---|---|---|
| GBIC | 1 G | SC | Usang |
| **SFP** | 1 G | LC | Sangat umum |
| **SFP+** | 10 G | LC | Standar 10 G |
| **SFP28** | 25 G | LC | Data center modern |
| SFP56 | 50 G | LC | |
| **QSFP+** | 40 G (4×10 G) | MPO / LC (LR4) | |
| **QSFP28** | 100 G (4×25 G) | MPO / LC | Standar 100 G |
| QSFP56 | 200 G | MPO | |
| **QSFP-DD** | 400 G / 800 G | MPO-16 | Data center terbaru |
| OSFP | 400 G / 800 G / 1,6 T | MPO | Alternatif QSFP-DD |
| CFP/CFP2/CFP4 | 40–400 G | Beragam | Telekomunikasi |

### Kode jarak pada transceiver

| Kode | Arti | Jarak tipikal | Serat |
|---|---|---|---|
| **SR** | Short Reach | 26–400 m | MMF |
| **LR** | Long Reach | 10 km | SMF |
| **ER** | Extended Reach | 40 km | SMF |
| **ZR** | 80 km | 80 km | SMF |
| LX/LH | Long haul | 10–70 km | SMF |
| **BiDi** | Bidirectional | bervariasi | **1 serat** (2 λ) |
| CWDM/DWDM | Multiplexing λ | bervariasi | SMF |

### Membaca kode lengkap
```
10GBASE-LR    →  10 Gbps, baseband, Long Reach (SMF 1310 nm, 10 km)
100GBASE-SR4  →  100 Gbps, Short Reach, 4 jalur paralel (MMF, MPO)
40GBASE-LR4   →  40 Gbps, Long Reach, 4 panjang gelombang (SMF, LC duplex)
25GBASE-SR    →  25 Gbps, Short Reach (MMF)
```

### BiDi — hemat serat

Transceiver BiDi memakai **satu serat** dengan dua panjang gelombang berbeda:
```
Sisi A: TX 1310 nm ──────────► RX 1310 nm : Sisi B
Sisi A: RX 1490 nm ◄────────── TX 1490 nm : Sisi B
        (satu serat yang sama)
```
Berguna ketika jumlah serat yang tersedia terbatas (sewa dark fiber sering dihitung per serat). **Harus dipasang berpasangan** (satu "U" upstream, satu "D" downstream).

### Vendor lock & kompatibilitas

Banyak vendor memprogram EEPROM transceiver dengan kode vendornya sendiri. Switch bisa menolak SFP pihak ketiga.

```
Cisco:  service unsupported-transceiver     ← mengizinkan SFP non-Cisco (menghapus dukungan resmi)
        no errdisable detect cause gbic-invalid
```

💡 SFP pihak ketiga yang di-coding untuk merek tertentu umumnya bekerja baik dan jauh lebih murah, tetapi periksa kebijakan garansi/dukungan Anda sebelum memakainya di lingkungan produksi kritis.

---

## 5. Power Budget Optik — Perhitungan Wajib

Ini keterampilan yang membedakan teknisi dan engineer.

### Rumus

```
Link budget    = TX power (min) − RX sensitivity (min)
Total loss     = (panjang × atenuasi/km) + (jumlah konektor × loss/konektor)
                 + (jumlah splice × loss/splice)
Margin         = Link budget − Total loss

Margin harus ≥ 3 dB untuk penuaan komponen, kotoran, dan perbaikan di masa depan.
```

### Nilai referensi

| Komponen | Rugi tipikal |
|---|---|
| SMF @1310 nm | 0,35 dB/km |
| SMF @1550 nm | 0,22 dB/km |
| MMF @850 nm | 3,0 dB/km |
| MMF @1300 nm | 1,0 dB/km |
| Konektor (mated pair) | 0,3–0,75 dB |
| Fusion splice | 0,1 dB |
| Mechanical splice | 0,3 dB |
| Patch panel (sepasang konektor) | 0,5–0,75 dB |

### Contoh 1: Link antar-gedung 3 km

```
Transceiver : 1000BASE-LX
  TX power minimum   : −9,5 dBm
  RX sensitivity     : −20 dBm
  ────────────────────────────────
  Link budget        : 10,5 dB

Jalur:
  Serat SMF 3 km × 0,35 dB/km        =  1,05 dB
  4 konektor (2 patch panel) × 0,5   =  2,00 dB
  2 fusion splice × 0,1              =  0,20 dB
  ────────────────────────────────────────────
  Total loss                          =  3,25 dB

Margin = 10,5 − 3,25 = 7,25 dB  ✅ SANGAT AMAN
```

### Contoh 2: Link 10G di data center

```
Transceiver : 10GBASE-SR di OM3
  TX power minimum   : −7,3 dBm
  RX sensitivity     : −11,1 dBm
  ────────────────────────────────
  Link budget        : 3,8 dB   ← sempit!

Jalur:
  MMF OM3 250 m × 3,0 dB/km          =  0,75 dB
  4 konektor × 0,5                    =  2,00 dB
  ────────────────────────────────────────────
  Total loss                          =  2,75 dB

Margin = 3,8 − 2,75 = 1,05 dB  ⚠️ TERLALU KETAT
```
Kesimpulan: link ini akan bekerja hari ini, tetapi satu konektor kotor atau satu patch tambahan akan mematikannya. Perbaikan: kurangi jumlah konektor (jalur langsung), gunakan OM4, atau pindah ke SMF/LR.

💡 **Pelajaran penting:** link 10G/25G/100G di MMF punya budget yang jauh lebih sempit daripada 1G. Kebersihan konektor menjadi kritis, bukan opsional.

### Verifikasi daya optik nyata

```
SW1# show interfaces gi1/0/49 transceiver detail

                             Optical   Optical
           Temperature  Voltage  Tx Power  Rx Power
Port       (Celsius)    (Volts)  (dBm)     (dBm)
---------  -----------  -------  --------  --------
Gi1/0/49      34.2        3.30     -5.4      -7.8
```

Cara membaca:
- **Tx Power** — daya yang dikirim transceiver ini. Kalau terlalu rendah → transceiver rusak.
- **Rx Power** — daya yang diterima dari ujung lain. **Ini metrik terpenting.**
- Bandingkan Rx power dengan sensitivity transceiver. Kalau mendekati batas → jalur bermasalah.
- **Rx Power < −30 dBm atau "N/A"** biasanya berarti tidak ada cahaya sama sekali → serat putus, TX/RX tertukar, atau ujung lain mati.

Di Linux dengan SFP:
```bash
$ ethtool -m enp3s0
        Laser output power              : 0.3020 mW / -5.20 dBm
        Receiver signal average optical power : 0.1660 mW / -7.80 dBm
```

---

## 6. Kebersihan Serat — Hal yang Paling Sering Diabaikan

> **Sebagian besar masalah link fiber disebabkan oleh konektor kotor.**

Core single-mode berdiameter 9 µm. Satu partikel debu berukuran 5 µm sudah menutupi sebagian besar area transmisi.

```
   Core 9 µm            Partikel debu 5 µm
   ┌─────────┐          ┌───┐
   │ ███████ │    vs    │███│
   └─────────┘          └───┘
```

### Aturan kebersihan

1. **Selalu pasang dust cap** saat konektor tidak terpakai — pada konektor **dan** pada port transceiver.
2. **Bersihkan sebelum setiap koneksi**, bahkan konektor baru dari pabrik (pelumas cetakan sering tertinggal).
3. Alat: **one-click cleaner** (paling praktis), cleaning cassette, atau lint-free wipe + isopropyl alcohol 99%.
4. **Inspeksi dengan fiber scope** kalau tersedia — Anda akan terkejut melihat betapa kotornya konektor "bersih".
5. **Jangan pernah menyentuh ujung serat dengan jari.** Minyak kulit adalah kontaminan yang sulit dibersihkan.
6. **Jangan melihat langsung ke ujung serat aktif.** Cahaya inframerah tidak terlihat mata tetapi bisa merusak retina. Gunakan detektor atau kartu inframerah.

### Radius tekuk

Serat yang tertekuk terlalu tajam kehilangan cahaya (*macrobend loss*) dan bisa retak permanen.

```
Radius tekuk minimum (aturan umum):
  Saat instalasi (dengan tarikan) : 20 × diameter kabel
  Setelah terpasang (tanpa beban) : 10 × diameter kabel

Untuk patch cord 2 mm → minimal ~20–30 mm radius
```

Serat **bend-insensitive** (G.657.A2/B3) lebih toleran, tetapi tetap ada batasnya.

---

## 7. Splicing dan Terminasi

| Metode | Rugi | Kecepatan | Alat | Untuk |
|---|---|---|---|---|
| **Fusion splice** | 0,02–0,1 dB | Cepat setelah terlatih | Fusion splicer (mahal) | Permanen, kualitas terbaik |
| **Mechanical splice** | 0,1–0,5 dB | Cepat | Murah | Perbaikan sementara/darurat |
| **Pigtail + fusion** | 0,1 dB | Sedang | Fusion splicer | Terminasi ODF standar |
| **Field-installable connector** | 0,3–0,75 dB | Cepat | Kit murah | Instalasi kecil |
| **Pre-terminated** | Terjamin pabrik | Instan | — | Data center (MPO trunk) |

**Praktik standar untuk instalasi permanen:** kabel outdoor ditarik ke **ODF** (*Optical Distribution Frame*), lalu setiap serat di-**fusion splice** ke **pigtail** yang sudah punya konektor pabrik. Patch cord menghubungkan ODF ke perangkat.

---

## 8. WDM — Banyak Sinyal dalam Satu Serat

**WDM** (*Wavelength Division Multiplexing*) mengirim beberapa panjang gelombang (warna cahaya) berbeda dalam satu serat secara bersamaan.

| | **CWDM** | **DWDM** |
|---|---|---|
| Kepanjangan | Coarse WDM | Dense WDM |
| Jarak antar-kanal | 20 nm | 0,8 nm / 0,4 nm (100/50 GHz) |
| Jumlah kanal | 8–18 | 40–96+ (bahkan 160) |
| Rentang | 1270–1610 nm | Band C (1530–1565 nm), band L |
| Laser | Tidak perlu pendingin | **Butuh laser terkontrol suhu** |
| Amplifikasi | Sulit | Bisa pakai EDFA |
| Biaya | Lebih murah | Mahal |
| Untuk | Metro, kampus | Long haul, backbone operator |

**Manfaat praktis:** satu pasang serat yang disewa mahal bisa membawa 40 × 100 Gbps = 4 Tbps. Ini yang membuat penyewaan dark fiber ekonomis.

**Dark fiber** — serat yang disewa tanpa peralatan aktif dari provider; Anda memasang transceiver sendiri di kedua ujung dan sepenuhnya mengendalikan kapasitasnya.

---

## 9. 400ZR: Optik Koheren yang Dicolok Langsung ke Router

Bagian 8 menunjukkan bahwa DWDM memerlukan laser terkontrol suhu, multiplexer, dan sering amplifier. Secara historis, sinyal DWDM dihasilkan oleh *transponder* terpisah, sebuah perangkat tersendiri yang mengubah port abu-abu dari router menjadi panjang gelombang tertentu. Untuk interkoneksi antar-data-center (**DCI**), itu berarti rak tambahan, daya, dan biaya. **400ZR** adalah *Implementation Agreement* dari **OIF** (Optical Internetworking Forum) yang memadatkan fungsi itu menjadi modul **pluggable** berbentuk QSFP-DD atau OSFP yang dicolok ke port 400GbE router atau switch. Berkat itu, router sendiri memancarkan panjang gelombang DWDM berstandar interoperabel antar-vendor.

Isi spesifikasinya, menurut OIF-400ZR-03.0 (8 Oktober 2024): antarmuka digital koheren yang bekerja sebagai PHY 400GBASE-R, memakai satu pembawa dengan modulasi **DP-16QAM** (*dual-polarization*, 16 level amplitudo-fase, sehingga 4 bit per simbol per polarisasi; modulasi QAM dijelaskan di `02-layer-fisik/04-encoding-modulasi`) dan **C-FEC** (*concatenated FEC*) dengan batas galat sisa setelah FEC di bawah 1E-15. Laju simbolnya 59,84375 GBaud per polarisasi, atau total sekitar 478,75 Gb/s di sisi saluran; selisih dari 400 Gb/s dipakai untuk overhead frame ZR dan FEC. Tiga aplikasi yang dicakup: (1) **amplified**, titik-ke-titik hingga 120 km, DWDM 100 GHz, yang dibatasi derau (*noise limited*) dengan target jangkauan minimal 80 km; (2) **unamplified**, satu panjang gelombang, yang dibatasi redaman (*loss limited*) sehingga jangkauan tergantung daya kirim, sensitivitas penerima, dan loss saluran; (3) amplified dengan spasi 75 GHz.

Perbedaan cara menghitung anggaran link penting. Pada optik biasa (bagian 5) Anda menghitung dB redaman terhadap power budget. Pada link amplified 400ZR, jangkauan ditentukan oleh **OSNR** (*optical signal-to-noise ratio*) di penerima, karena setiap amplifier EDFA menambah derau. IA menggambarkan lintasan di antara kedua modul sebagai *black link* dengan sifat spektral tertentu, yaitu semua yang ada di antara modul (multiplexer, amplifier, serat) dianggap satu kotak hitam. Praktisnya, pada aplikasi amplified modul 400ZR dihubungkan ke sistem DWDM berisi mux dan EDFA; pada aplikasi unamplified, dua modul dihubungkan langsung oleh serat pada satu panjang gelombang selama redamannya masih tertampung.

💡 **400ZR hanya untuk Ethernet 400G, titik-ke-titik, jarak metro.** Jarak lebih jauh, topologi multi-span, atau laju lain ditangani oleh varian dan keluarga lain (misalnya ZR+ atau standar sesudahnya); cek spesifikasi vendor sebelum membeli. Modul koheren juga lebih panas dan lebih haus daya daripada optik LR biasa, jadi periksa anggaran daya dan pendinginan chassis.

---

## 10. Troubleshooting Link Fiber

### Alur diagnosis

```
1. Link tidak naik sama sekali
   → Periksa TX/RX tidak tertukar (paling sering!)
   → Periksa jenis transceiver cocok di kedua ujung (SR↔SR, LR↔LR)
   → Periksa jenis serat cocok (SMF↔SMF, MMF↔MMF, OM3↔OM3)
   → Periksa transceiver dikenali: show interfaces transceiver
   → Periksa apakah switch menolak SFP pihak ketiga

2. Link naik tetapi banyak CRC error
   → Cek Rx power: terlalu rendah (rugi terlalu besar) atau
     terlalu tinggi (overload — perlu attenuator pada link pendek dengan optik jarak jauh!)
   → Bersihkan semua konektor
   → Cek radius tekuk di seluruh jalur

3. Link flapping (naik-turun)
   → Konektor longgar
   → Rx power di batas sensitivity
   → Transceiver terlalu panas (cek temperature)

4. Link bekerja tetapi lebih lambat dari seharusnya
   → Cek negosiasi kecepatan
   → Cek apakah ada rugi paket → periksa Rx power dan kebersihan
```

⚠️ **Optical overload** — masalah yang sering terlewat: memakai transceiver LR (10 km) untuk link 5 meter di dalam rak. Daya TX terlalu besar untuk penerima → saturasi → error. Solusinya: pasang **attenuator** (5–10 dB) atau gunakan transceiver SR yang sesuai jarak.

### Alat

| Alat | Fungsi |
|---|---|
| **VFL** (*Visual Fault Locator*) | Laser merah tampak; menemukan putus/tekukan pada jarak pendek (~5 km). Titik terang di sepanjang kabel = kerusakan |
| **Optical power meter + light source** | Mengukur rugi total jalur (insertion loss) — pengukuran paling penting |
| **OTDR** | Memetakan seluruh jalur: jarak ke setiap splice, konektor, dan lokasi putus. Alat utama untuk jalur panjang |
| **Fiber inspection scope** | Memeriksa kebersihan permukaan konektor |
| **Fiber cleaner** | One-click cleaner untuk LC/SC |

---

## 11. Ringkasan

- Serat membawa cahaya via total internal reflection: kebal EMI, aman antar-gedung, sulit disadap, jangkauan jauh.
- **SMF** (core 9 µm, kuning): jauh (10–100+ km), transceiver mahal. **MMF** (core 50 µm, aqua): dekat (≤400 m), transceiver murah.
- MMF terbatas oleh **dispersi modal**; OM3 minimum, OM4 direkomendasikan.
- Konektor: **LC** paling umum; MPO untuk 40G+. **UPC biru, APC hijau — jangan dicampur.**
- Transceiver: SFP (1G), SFP+ (10G), SFP28 (25G), QSFP28 (100G), QSFP-DD (400G+). SR=MMF pendek, LR=SMF 10 km.
- **Power budget = TX power − RX sensitivity.** Kurangi total loss; sisakan margin ≥3 dB.
- Link 10G/25G di MMF punya budget sempit — kebersihan konektor menjadi kritis.
- **TX/RX tertukar** adalah penyebab nomor satu link fiber baru tidak naik.
- **Optical overload** terjadi saat optik jarak jauh dipakai untuk link pendek — pasang attenuator.
- Selalu bersihkan konektor sebelum menyambung; selalu pasang dust cap.
- **400ZR (OIF)** = modul koheren pluggable (QSFP-DD/OSFP) untuk DCI: DP-16QAM, C-FEC, sekitar 478,75 Gb/s di saluran untuk 400GbE, target minimal 80 km pada link amplified DWDM 100 GHz. Link amplified dibatasi **OSNR**, bukan redaman biasa.

---

## 12. Latihan

1. Anda perlu menghubungkan dua gedung berjarak 2,5 km. Jenis serat dan transceiver apa?
2. Data center, dari leaf switch ke server dalam rak yang sama (3 m), 25 Gbps. Apa pilihan paling ekonomis?
3. Link 1000BASE-LX (budget 10,5 dB) melewati SMF 8 km dengan 6 konektor dan 3 splice. Hitung margin.
4. Sebuah link fiber baru tidak naik. Transceiver terdeteksi, tipe cocok di kedua ujung, Rx power menunjukkan −40 dBm. Apa dugaan pertama Anda?
5. Kenapa OM1 tidak boleh dicampur dengan OM3 dalam satu jalur?
6. Anda memakai transceiver 10GBASE-ER (40 km) untuk link 10 m di dalam rak. Apa yang mungkin terjadi dan bagaimana memperbaikinya?
7. Sebutkan tiga alasan mengapa serat wajib dipakai untuk koneksi antar-gedung, bukan tembaga.
8. Laju simbol 400ZR adalah 59,84375 GBaud per polarisasi dengan DP-16QAM. Hitung laju bit total di saluran, bandingkan dengan 400 Gb/s, lalu jelaskan mengapa jangkauan link amplified 400ZR tidak dihitung dengan power budget dB biasa.

<details>
<summary>Jawaban</summary>

1. **Single-mode fiber (OS2)** dengan transceiver **1000BASE-LX** atau **10GBASE-LR** (keduanya mendukung 10 km, jauh melebihi 2,5 km). Multimode tidak memadai — bahkan OM4 hanya sampai ~550 m di 1 G. Gunakan kabel outdoor/armored, dan terminasi lewat ODF di kedua gedung.

2. **DAC (Direct Attach Copper) SFP28** sepanjang 3 m. Jauh lebih murah daripada dua transceiver optik + patch fiber, konsumsi daya lebih rendah, dan tidak ada risiko konektor kotor.

3. Loss = (8 km × 0,35) + (6 × 0,5) + (3 × 0,1) = 2,8 + 3,0 + 0,3 = **6,1 dB**. Margin = 10,5 − 6,1 = **4,4 dB**. ✅ Di atas ambang 3 dB, jadi dapat diterima — meski tidak longgar. Sebaiknya kurangi jumlah konektor jika memungkinkan.

4. **TX dan RX tertukar** di salah satu ujung. Rx power −40 dBm berarti praktis tidak ada cahaya yang diterima. Kemungkinan lain: serat putus, patch cord salah, atau ujung lain mati/port shutdown. Periksa yang paling murah dulu: balik salah satu ujung patch cord.

5. Karena diameter core berbeda: OM1 = 62,5 µm, OM3 = 50 µm. Saat cahaya berpindah dari core besar ke core kecil (62,5 → 50), sebagian besar cahaya tidak masuk → rugi daya besar (bisa >3 dB). Arah sebaliknya menyebabkan masalah eksitasi mode. Selain itu karakteristik bandwidth berbeda sehingga jarak maksimum tidak dapat dijamin.

6. **Optical overload** — daya TX dari transceiver ER (dirancang untuk melawan rugi 40 km) jauh melebihi batas maksimum penerima pada jarak 10 m. Akibatnya: saturasi penerima, CRC error tinggi, link tidak stabil, dan bisa merusak penerima dalam jangka panjang. Perbaikan: pasang **attenuator optik** (biasanya 10–15 dB) di sisi RX, atau — lebih baik — ganti dengan transceiver **SR/LR** yang sesuai jarak.

7. (a) **Isolasi listrik** — mencegah kerusakan akibat perbedaan potensial tanah antar-gedung dan sambaran petir, yang bisa merusak perangkat dan membahayakan orang; (b) **jarak** — tembaga terbatas 100 m, serat bisa kilometer; (c) **kekebalan EMI** — jalur luar ruangan melewati banyak sumber interferensi; (d) tambahan: kapasitas masa depan jauh lebih besar tanpa mengganti kabel.

8. 16QAM membawa 4 bit per simbol, dan DP berarti dua polarisasi, jadi 59,84375 x 2 x 4 = **478,75 Gb/s**. Ini sekitar 78,75 Gb/s (kurang lebih 19,7%) di atas 400 Gb/s; selisihnya dipakai untuk overhead frame ZR dan **C-FEC**. Pada link amplified yang dibatasi derau, setiap amplifier optik menambah derau, sehingga yang menentukan apakah sinyal bisa didecode adalah **OSNR** di penerima terhadap toleransi OSNR modul, bukan sekadar daya kirim dikurangi redaman serat. Link unamplified, sebaliknya, bersifat loss limited sehingga power budget biasa (daya kirim, sensitivitas, loss) masih relevan.

</details>

---

## 13. Sumber

- ITU-T G.652 / G.657 — karakteristik serat single-mode
- TIA-492 / ISO/IEC 11801 — klasifikasi OM1–OM5
- IEEE 802.3 clause 38, 52, 86 — spesifikasi Ethernet optik
- IEC 61300-3-35 — standar inspeksi kebersihan konektor serat
- Cisco *Transceiver Module Compatibility Matrix*
- OIF, Implementation Agreement OIF-400ZR-03.0 (8 Oktober 2024): https://www.oiforum.com/wp-content/uploads/OIF-400ZR-03.0.1.pdf
- OIF, What is 400ZR? (ringkasan tujuan dan jangkauan): https://www.oiforum.com/fiercetelecom-what-is-400zr/

---

**Berikutnya:** `02-layer-fisik/04-encoding-modulasi.md` — bagaimana bit benar-benar diubah menjadi sinyal.

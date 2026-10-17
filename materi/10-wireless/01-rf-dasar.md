# 10.1 Dasar Radio Frequency (RF)

> **Prasyarat:** `02-layer-fisik/01`, `00-fondasi/03`
> **Tujuan:** Anda paham fisika gelombang radio, bisa menghitung link budget, dan mengerti mengapa Wi-Fi berperilaku seperti yang Anda lihat.

---

## 1. Gelombang Radio

Wi-Fi adalah gelombang elektromagnetik seperti cahaya, hanya frekuensinya jauh lebih rendah.

```
Amplitudo
    │     ╱╲        ╱╲
    │    ╱  ╲      ╱  ╲
    │───╱────╲────╱────╲───  waktu
    │  ╱      ╲  ╱      ╲
    │ ╱        ╲╱        ╲
    └────────────────────────
       │←── 1 siklus ──→│
```

| Parameter | Arti |
|---|---|
| **Frekuensi** | Siklus per detik (Hz). 2,4 GHz = 2,4 miliar siklus/detik |
| **Amplitudo** | Tinggi gelombang = kekuatan sinyal |
| **Fase** | Posisi dalam siklus (dipakai untuk modulasi PSK/QAM) |
| **Panjang gelombang (λ)** | Jarak satu siklus = c / frekuensi |

```
λ = 300 / f(MHz)  meter

2,4 GHz  → λ = 300/2400 = 0,125 m = 12,5 cm
5 GHz    → λ = 300/5000 = 0,06 m  = 6 cm
6 GHz    → λ = 300/6000 = 0,05 m  = 5 cm
```

> [!TIP]
> **Panjang gelombang menentukan perilaku fisik:**
- Gelombang lebih **panjang** (2,4 GHz) menembus dinding lebih baik dan menjangkau lebih jauh
- Gelombang lebih **pendek** (5/6 GHz) membawa lebih banyak data tetapi lebih mudah terhalang

Ini menjelaskan **trade-off mendasar Wi-Fi**: jangkauan vs kecepatan.

---

## 2. Desibel: Wajib Dikuasai

Semua perhitungan RF memakai skala logaritmik. Ulasan dari `02-layer-fisik/01` dengan penerapan wireless.

| Satuan | Arti |
|---|---|
| **dB** | Perbandingan relatif (penguatan/redaman) |
| **dBm** | Daya absolut relatif terhadap 1 mW |
| **dBi** | Penguatan antena relatif terhadap antena isotropis teoretis |
| **dBd** | Penguatan relatif terhadap dipole (dBi = dBd + 2,15) |

### Aturan 3 dan 10: hafalkan

```
+3 dB  = daya 2×      −3 dB  = daya ½
+10 dB = daya 10×     −10 dB = daya 1/10
+20 dB = daya 100×    −20 dB = daya 1/100
```

**Referensi cepat:**
```
 0 dBm = 1 mW
 3 dBm = 2 mW
10 dBm = 10 mW
15 dBm = ~32 mW
20 dBm = 100 mW      ← batas umum AP indoor
23 dBm = 200 mW
30 dBm = 1000 mW = 1 W
−30 dBm = 0,000001 mW  ← sinyal Wi-Fi yang masih sangat baik
−90 dBm ≈ noise floor  ← batas bawah deteksi
```

### RSSI dan kualitas sinyal

| RSSI | Kualitas | Cocok untuk |
|---|---|---|
| −30 dBm | Sempurna (sangat dekat AP) | Semua |
| −50 dBm | Sangat baik | Semua, kecepatan maksimum |
| −60 dBm | Baik | Data, suara, video |
| **−67 dBm** | **Minimum untuk VoIP/video** | Ambang desain standar |
| −70 dBm | Cukup untuk data ringan | Browsing, email |
| −80 dBm | Buruk | Sering terputus |
| −90 dBm | Tidak dapat dipakai | Tidak ada |

> [!TIP]
> **−67 dBm adalah angka desain standar industri** untuk cakupan Wi-Fi yang mendukung suara dan video. Rancang cakupan agar setiap titik menerima minimal −67 dBm.

---

## 3. SNR (Yang Sesungguhnya Menentukan Kecepatan)

```
SNR (dB) = RSSI (dBm) − Noise floor (dBm)
```

**Contoh:**
```
RSSI        = −60 dBm
Noise floor = −95 dBm
SNR         = −60 − (−95) = 35 dB  → sangat baik
```

| SNR | Kualitas | Modulasi yang mungkin |
|---|---|---|
| > 40 dB | Sangat baik | 1024/4096-QAM (kecepatan maksimum) |
| 25-40 dB | Baik | 256-QAM |
| 15-25 dB | Cukup | 64-QAM, kecepatan menurun |
| 10-15 dB | Buruk | QPSK, sangat lambat |
| < 10 dB | Tidak dapat dipakai | Koneksi terputus |

> [!WARNING]
> **Inilah kenapa "sinyal penuh tapi lambat" terjadi.** RSSI tinggi tetapi noise floor juga tinggi (banyak interferensi) → SNR rendah → modulasi turun → lambat.

```
Kasus A: RSSI −50, noise −95  → SNR 45 dB → sangat cepat ✅
Kasus B: RSSI −50, noise −70  → SNR 20 dB → lambat ❌
       (RSSI SAMA, tetapi ada sumber noise kuat)
```

> [!TIP]
> **Selalu ukur SNR, bukan hanya RSSI.** Alat survei yang baik menampilkan keduanya.

---

## 4. Band Frekuensi

| Band | Rentang | Kanal | Karakteristik |
|---|---|---|---|
| **2,4 GHz** | 2,400-2,4835 GHz | 1-13 (14 di Jepang) | Jangkauan jauh, tembus dinding, **sangat padat** |
| **5 GHz** | 5,150-5,825 GHz | 36-165 | Banyak kanal, lebih bersih, jangkauan lebih pendek |
| **6 GHz** | 5,925-7,125 GHz | 1-233 | **Sangat bersih**, hanya Wi-Fi 6E/7 |

### 2,4 GHz: Kanal yang Tumpang Tindih

```
Kanal:  1   2   3   4   5   6   7   8   9  10  11  12  13
        │   │   │   │   │   │   │   │   │   │   │   │   │
       ┌───────────┐
       │  Kanal 1  │  (2412 MHz ± 11 MHz)
       └───────────┘
                   ┌───────────┐
                   │  Kanal 6  │  (2437 MHz)
                   └───────────┘
                               ┌───────────┐
                               │ Kanal 11  │  (2462 MHz)
                               └───────────┘
```

> [!WARNING]
> **Hanya kanal 1, 6, dan 11 yang TIDAK saling tumpang tindih** (dengan lebar kanal 20 MHz). Kanal lain akan saling mengganggu.

```
❌ SALAH: memakai kanal 1, 3, 5, 7, 9, 11 → semuanya saling mengganggu
✅ BENAR: hanya 1, 6, 11 — diulang dengan pola yang jauh
```

**Sumber interferensi di 2,4 GHz:**
```
- Wi-Fi tetangga (paling utama)
- Microwave oven (2,45 GHz — persis di tengah!)
- Bluetooth (frequency hopping di seluruh band)
- Telepon nirkabel lama
- Kamera nirkabel analog
- Perangkat Zigbee/IoT
- Lampu neon rusak
```

> [!TIP]
> **Di lingkungan padat (apartemen, perkantoran), 2,4 GHz sering tidak dapat diselamatkan.** Arahkan klien ke 5 GHz.

### 5 GHz: Banyak Kanal, Tetapi Ada DFS

```
UNII-1  (36–48)   : 5150–5250 MHz  — indoor, daya rendah
UNII-2A (52–64)   : 5250–5350 MHz  — DFS wajib
UNII-2C (100–144) : 5470–5725 MHz  — DFS wajib
UNII-3  (149–165) : 5725–5850 MHz  — daya lebih tinggi, tanpa DFS
```

**DFS (Dynamic Frequency Selection)** diperlukan karena kanal ini dipakai bersama radar cuaca dan militer. AP wajib:
1. Mendengarkan 60 detik sebelum memakai kanal (CAC, Channel Availability Check)
2. Terus memantau
3. Kalau radar terdeteksi → **pindah kanal dalam 10 detik** dan tidak memakai kanal itu selama 30 menit

> [!WARNING]
> **Dampak DFS pada pengguna:** ketika radar terdeteksi (atau false positive), semua klien terputus dan harus menyambung ulang. Di dekat bandara atau pelabuhan, ini bisa terjadi berkali-kali sehari.

> [!TIP]
> **Untuk lingkungan kritis (rumah sakit, bandara), pertimbangkan menghindari kanal DFS** meski itu mengurangi jumlah kanal yang tersedia.

> [!WARNING]
> **Banyak perangkat klien lama tidak mendukung DFS.** Mereka tidak akan melihat SSID Anda sama sekali kalau AP memakai kanal DFS.

### 6 GHz (Wi-Fi 6E / 7)

```
- 1200 MHz spektrum baru (hampir 3× lipat dari 5 GHz)
- Sampai 59 kanal 20 MHz, atau 7 kanal 160 MHz
- TIDAK ADA perangkat lama → sangat bersih
- WPA3 WAJIB (tidak boleh open atau WPA2)
- Daya lebih rendah (indoor low power)
- Jangkauan lebih pendek
```

> [!WARNING]
> **Status regulasi 6 GHz berbeda per negara.** Di Indonesia, sebagian band 6 GHz (5925-6425 MHz) telah dibuka untuk penggunaan tanpa izin. Periksa peraturan Kominfo/Komdigi terbaru sebelum menerapkannya.

### Lebar Kanal

| Lebar | Kecepatan | Jumlah kanal non-overlap (5 GHz) |
|---|---|---|
| 20 MHz | Dasar | ~25 |
| 40 MHz | ~2× | ~12 |
| 80 MHz | ~4× | ~6 |
| 160 MHz | ~8× | ~2 |
| 320 MHz (Wi-Fi 7, 6 GHz) | ~16× | ~3 |

> [!WARNING]
> **Kanal lebar adalah trade-off, bukan peningkatan gratis:**
```
Kanal lebar  → kecepatan puncak lebih tinggi per klien
             → TETAPI lebih sedikit kanal non-overlap
             → co-channel interference meningkat
             → di lingkungan padat, throughput TOTAL justru TURUN
```

> [!TIP]
> **Aturan praktis:**
```
2,4 GHz          : SELALU 20 MHz (jangan pernah 40 MHz)
5 GHz kantor padat: 20 atau 40 MHz
5 GHz rumah/jarang: 80 MHz
6 GHz            : 80 atau 160 MHz (spektrum masih longgar)
```

---

## 5. Perilaku Gelombang RF

| Fenomena | Penjelasan | Dampak |
|---|---|---|
| **Absorption** | Energi diserap material (air, beton, tubuh manusia) | Sinyal melemah |
| **Reflection** | Memantul dari permukaan besar (logam, kaca) | Multipath |
| **Refraction** | Membelok saat melewati media berbeda | Arah berubah |
| **Diffraction** | Membelok di sekitar penghalang | Bisa menjangkau di balik sudut |
| **Scattering** | Terpencar oleh permukaan tidak rata | Sinyal melemah & tersebar |
| **Free Space Path Loss** | Melemah dengan kuadrat jarak | Batas jangkauan |

### Redaman material (perkiraan, 2,4 GHz)

```
Dinding gypsum/drywall   : 3–5 dB
Kaca biasa                : 2–4 dB
Kaca berlapis logam (low-E): 10–25 dB  ⚠️
Dinding bata              : 6–10 dB
Dinding beton             : 10–20 dB
Beton bertulang           : 20–30 dB  ⚠️
Lantai beton              : 20–30 dB
Pintu logam               : 15–30 dB  ⚠️
Lemari arsip logam        : 15–20 dB
Tubuh manusia             : 3–5 dB    ⚠️ (ruang penuh orang!)
Akuarium / tangki air     : 20–30 dB  ⚠️
Pohon (basah)             : 10–20 dB
```

> [!WARNING]
> **Redaman di 5 GHz umumnya 1,5-2× lebih besar** daripada 2,4 GHz untuk material yang sama.

> [!TIP]
> **Tubuh manusia ikut menyerap RF.** Survei yang dilakukan di ruang kosong akan memberi hasil terlalu optimistis untuk auditorium atau ruang rapat yang penuh. Selalu perhitungkan ini.

### Free Space Path Loss

```
FSPL (dB) = 20·log₁₀(d) + 20·log₁₀(f) + 32,44
            d dalam km, f dalam MHz
```

**Contoh praktis:**
```
100 m di 2,4 GHz:
  FSPL = 20·log(0,1) + 20·log(2400) + 32,44
       = −20 + 67,6 + 32,44 = 80 dB

100 m di 5 GHz:
  FSPL = −20 + 74 + 32,44 = 86,4 dB
       → 6,4 dB LEBIH BESAR
```

> [!TIP]
> **Selisih ~6 dB antara 2,4 dan 5 GHz** menjelaskan mengapa jangkauan 5 GHz jauh lebih pendek, dan mengapa AP dual-band perlu menyeimbangkan daya pancar antar-band agar klien tidak "menempel" di 2,4 GHz.

### Multipath

Sinyal mencapai penerima lewat beberapa jalur (langsung + pantulan) dengan waktu berbeda.

```
        ┌──── pantulan (lebih panjang) ────┐
       ╱                                    ╲
[AP] ─────── jalur langsung ──────────► [Klien]
```

- **Merusak** pada Wi-Fi lama (802.11a/b/g): menyebabkan interferensi destruktif
- **Dimanfaatkan** oleh MIMO (802.11n dan seterusnya): beberapa jalur = beberapa aliran data

> [!TIP]
> **MIMO mengubah multipath dari musuh menjadi teman.** Inilah terobosan terbesar 802.11n.

---

## 6. Antena

### Jenis dan pola radiasi

| Jenis | Gain | Pola | Untuk |
|---|---|---|---|
| **Omni-directional** | 2-9 dBi | 360° horizontal | AP indoor, cakupan umum |
| **Patch/Panel** | 6-20 dBi | Sektor 60-120° | Cakupan terarah, koridor |
| **Yagi** | 10-20 dBi | Sempit | Point-to-point jarak menengah |
| **Parabolic/Grid** | 15-30 dBi | Sangat sempit | Point-to-point jarak jauh |
| **Sector** | 10-20 dBi | 60/90/120° | Menara PtMP (WISP) |

> [!WARNING]
> **Gain antena tidak "menciptakan" daya.** Ia memfokuskan daya ke arah tertentu, seperti reflektor senter. Gain tinggi berarti jangkauan lebih jauh, tetapi sudutnya lebih sempit.

```
Omni 3 dBi  : seperti bola lampu — ke segala arah, jangkauan sedang
Omni 9 dBi  : seperti donat pipih — jauh secara horizontal,
              TETAPI LEMAH di atas dan bawah ⚠️
```

> [!TIP]
> **Jebakan antena omni gain tinggi:** di gedung bertingkat, antena 9 dBi memberi cakupan buruk di lantai atas/bawah karena polanya pipih. Untuk cakupan multi-lantai, antena gain lebih rendah sering lebih baik.

### Polarisasi

Orientasi medan listrik gelombang: **vertikal**, **horizontal**, atau **circular**.

> [!WARNING]
> **Polarisasi yang tidak cocok menyebabkan rugi 20-30 dB.** Pada link point-to-point, pastikan kedua antena berpolarisasi sama. Pada AP indoor, klien bergerak dengan orientasi acak. Karena itu AP modern memakai **dual-polarization** (MIMO).

### EIRP (Daya Pancar Efektif)

```
EIRP (dBm) = Daya pemancar (dBm) − Rugi kabel (dB) + Gain antena (dBi)
```

**Contoh:**
```
Pemancar : 20 dBm
Kabel    : −3 dB (10 m LMR-400 di 5 GHz)
Antena   : +12 dBi
──────────────────────
EIRP     : 29 dBm (≈ 800 mW)
```

> [!WARNING]
> **EIRP dibatasi regulasi.** Di Indonesia (Peraturan Kominfo), batas umum untuk 2,4 GHz adalah **500 mW (27 dBm) EIRP** dan 5 GHz bervariasi per sub-band. Melebihi batas adalah pelanggaran hukum dan menyebabkan interferensi. Selalu periksa peraturan Komdigi/Kominfo terbaru.

---

## 7. Link Budget: Perhitungan untuk Point-to-Point

```
RSSI diterima = EIRP pemancar − FSPL + Gain antena penerima − Rugi kabel penerima
Margin        = RSSI diterima − Sensitivitas penerima
```

**Contoh: link 5 km di 5 GHz**
```
Sisi A:
  Daya pemancar        : +23 dBm
  Rugi kabel           :  −2 dB
  Gain antena          : +24 dBi
  ──────────────────────────────
  EIRP                 : +45 dBm

Path:
  FSPL 5 km @ 5,5 GHz  = 20·log(5) + 20·log(5500) + 32,44
                       = 14 + 74,8 + 32,44 = 121,2 dB
  Margin cuaca/fresnel : −10 dB (hujan, vegetasi)
  ──────────────────────────────
  Total path loss      : −131,2 dB

Sisi B:
  Gain antena          : +24 dBi
  Rugi kabel           :  −2 dB

RSSI diterima = 45 − 131,2 + 24 − 2 = −64,2 dBm

Sensitivitas penerima (MCS7, 20 MHz) = −77 dBm
Margin = −64,2 − (−77) = 12,8 dB  ✅ SEHAT
```

> [!TIP]
> **Margin minimum yang disarankan: 10 dB** untuk link luar ruangan (mengakomodasi hujan, pertumbuhan vegetasi, dan penuaan perangkat). Untuk daerah dengan curah hujan tinggi seperti Indonesia, targetkan **15-20 dB**.

### Fresnel Zone

Garis pandang yang lurus saja belum cukup. Link point-to-point membutuhkan **ruang bebas berbentuk elips** di sekitar garis pandang itu.

```
r = 17,32 × √(d / (4 × f))
    r dalam meter, d dalam km, f dalam GHz
```

**Contoh: link 5 km di 5 GHz**
```
r = 17,32 × √(5 / (4 × 5)) = 17,32 × √0,25 = 8,66 m
```

> [!WARNING]
> **Minimal 60% zona Fresnel pertama harus bebas hambatan.** Dalam contoh di atas: 8,66 × 0,6 = **5,2 m ruang bebas** di titik tengah (di atas pohon, gedung, dan bukit).

> [!TIP]
> Ini alasan link yang "terlihat lurus" tetap bermasalah: pohon setinggi 3 m di titik tengah bisa memotong zona Fresnel meski tidak menghalangi garis pandang.

---

## 8. Praktik Pengukuran

```bash
# Linux
$ iw dev wlan0 scan | grep -E 'SSID|signal|freq|DS Parameter'
$ iw dev wlan0 link
$ iwconfig wlan0
$ nmcli dev wifi list
$ watch -n1 'iw dev wlan0 link | grep signal'

# Analisis kanal
$ sudo iw dev wlan0 scan | grep -E 'freq|SSID' | paste - - | sort -k2 -n

# macOS (alat airport sudah usang sejak macOS 14.4)
$ sudo wdutil info                    # RSSI, noise, kanal, laju PHY
$ system_profiler SPAirPortDataType   # termasuk jaringan lain di sekitar

# Windows
PS> netsh wlan show interfaces
PS> netsh wlan show networks mode=bssid
PS> netsh wlan show drivers
```

```
# MikroTik
/interface wireless scan wlan1
/interface wireless registration-table print
/interface wireless monitor wlan1
/interface wireless spectral-scan wlan1          ← spectrum analyzer bawaan!
/interface wireless spectral-history wlan1
/interface wireless align monitor wlan1          ← untuk alignment PtP
```

> [!TIP]
> **`spectral-scan` di MikroTik adalah spectrum analyzer gratis** yang menampilkan energi RF di seluruh band, termasuk sumber non-Wi-Fi seperti microwave dan kamera analog. Biasanya, fitur seperti ini butuh alat seharga puluhan juta.

**Alat profesional:**
- **Ekahau AI Pro**: survei prediktif & aktif (standar industri)
- **Hamina**: survei berbasis cloud
- **NetSpot**: terjangkau, macOS/Windows
- **WiFi Explorer**: analisis cepat macOS
- **Wireshark + adapter monitor mode**: analisis frame 802.11
- **MetaGeek Chanalyzer + Wi-Spy**: spectrum analyzer khusus

---

## 9. Ringkasan

- Wi-Fi adalah gelombang EM; **λ = 300/f(MHz)**. Frekuensi lebih rendah = jangkauan lebih jauh, tembus dinding lebih baik.
- **dB logaritmik**: +3 dB = 2× daya, +10 dB = 10×. **0 dBm = 1 mW**, 20 dBm = 100 mW.
- **−67 dBm** adalah ambang desain standar untuk suara/video.
- **SNR = RSSI − noise floor**. SNR-lah yang menentukan kecepatan, bukan RSSI saja. "Sinyal penuh tapi lambat" = SNR rendah.
- **2,4 GHz: hanya kanal 1, 6, 11** yang tidak tumpang tindih. Selalu 20 MHz.
- **5 GHz**: banyak kanal, tetapi **DFS** bisa memutus klien saat radar terdeteksi.
- **6 GHz**: sangat bersih, WPA3 wajib, jangkauan pendek.
- **Kanal lebar = trade-off**: kecepatan puncak naik, tetapi kanal non-overlap berkurang dan interferensi meningkat.
- Redaman material: beton bertulang 20-30 dB, kaca low-E 10-25 dB, tubuh manusia 3-5 dB.
- MIMO mengubah multipath dari musuh menjadi keunggulan.
- **Gain antena memfokuskan, tidak menciptakan daya.** Omni gain tinggi = pola pipih, buruk untuk multi-lantai.
- **EIRP = daya − rugi kabel + gain antena**; dibatasi regulasi Komdigi.
- Link PtP butuh **margin ≥ 10 dB** (15-20 dB untuk Indonesia) dan **60% zona Fresnel bebas**.

---

## 10. Latihan

1. Pemancar 20 dBm, kabel rugi 3 dB, antena 15 dBi. Berapa EIRP dalam dBm dan mW?
2. RSSI −55 dBm, noise floor −72 dBm. Berapa SNR? Bagaimana kualitasnya dan apa yang Anda lakukan?
3. Kenapa hanya kanal 1, 6, 11 yang dipakai di 2,4 GHz?
4. Klien melaporkan "sinyal penuh tapi internet lambat". Sebutkan tiga kemungkinan penyebab.
5. Hitung radius zona Fresnel untuk link 8 km di 5,8 GHz. Berapa ruang bebas minimum yang dibutuhkan?
6. Kenapa memakai kanal 160 MHz di kantor padat bisa menurunkan kinerja total?
7. AP dipasang dengan antena omni 9 dBi di lantai 2 gedung 3 lantai. Cakupan lantai 1 dan 3 buruk. Jelaskan dan berikan solusi.

<details>
<summary>Jawaban</summary>

1. EIRP = 20 − 3 + 15 = **+32 dBm**. Konversi: 30 dBm = 1000 mW, +2 dB ≈ ×1,58 → **≈1585 mW (1,6 W)**.
   **Perhatian:** Ini jauh melebihi batas regulasi untuk 2,4 GHz di Indonesia (500 mW EIRP). Dayanya harus dikurangi: turunkan daya pemancar atau pakai antena gain lebih rendah.

2. SNR = −55 − (−72) = **17 dB**. Ini kategori **cukup/buruk**: cukup untuk data ringan, tetapi modulasi akan turun ke 64-QAM atau lebih rendah, sehingga kecepatan jauh di bawah maksimum.
   Kekuatan sinyalnya bagus (−55 dBm). Masalahnya ada di **noise floor yang sangat tinggi** (−72 dBm; normalnya sekitar −95 dBm), tanda ada sumber interferensi kuat.
   **Tindakan:** jalankan spectrum analysis (mis. `/interface wireless spectral-scan` di MikroTik) untuk menemukan sumbernya, entah microwave, kamera analog, AP tetangga, atau perangkat non-Wi-Fi. Lalu: pindah kanal, hilangkan sumber interferensi, atau pindah klien ke 5/6 GHz.

3. Karena setiap kanal Wi-Fi 2,4 GHz menempati **~22 MHz**, sementara jarak antar-nomor kanal hanya **5 MHz**. Kanal 1 (2412 MHz) menempati ~2401-2423 MHz; kanal 6 (2437) menempati ~2426-2448; kanal 11 (2462) menempati ~2451-2473. Hanya kombinasi ini yang tidak saling tumpang tindih dalam band 2,400-2,4835 GHz.
   Memakai kanal lain (mis. 3, 5, 9) menyebabkan **partial overlap**, yang justru lebih buruk daripada co-channel. Perangkat pada kanal yang tumpang tindih sebagian tidak bisa saling "mendengar" untuk melakukan CSMA/CA, sehingga mereka mengirim bersamaan dan saling merusak.

4. (a) **SNR rendah**: RSSI kuat tetapi noise floor tinggi karena interferensi, sehingga modulasi turun. (b) **Co-channel interference / airtime terbagi**: banyak klien atau AP tetangga di kanal yang sama; setiap perangkat harus antre memakai media (Wi-Fi half duplex). (c) **Satu klien lambat menyeret semua**: klien jauh dengan MCS rendah memakan airtime jauh lebih lama untuk data yang sama. (d) Kemungkinan lain: bottleneck di uplink AP (link 100 Mbps atau PoE kurang daya sehingga radio berjalan mode terbatas), masalah di jaringan kabel/internet, atau klien hanya mendukung standar lama.

5. r = 17,32 × √(8 / (4 × 5,8)) = 17,32 × √(8/23,2) = 17,32 × √0,345 = 17,32 × 0,587 = **10,2 m**.
   Ruang bebas minimum = 60% × 10,2 = **6,1 m** di titik tengah link. Artinya tidak boleh ada pohon, gedung, atau kontur tanah yang masuk dalam radius 6,1 m dari garis pandang di titik tengah.

6. Karena kanal 160 MHz memakan hampir seluruh spektrum 5 GHz yang tersedia, sehingga hanya tersisa ~2 kanal non-overlap. Di kantor padat dengan banyak AP, itu berarti AP-AP yang berdekatan terpaksa memakai kanal yang sama → co-channel interference berat.
   Semua perangkat pada kanal yang sama harus berbagi airtime dengan CSMA/CA: mereka menunggu giliran. Jadi, meskipun kecepatan puncak satu klien lebih tinggi, **throughput agregat seluruh kantor justru turun** karena lebih banyak perangkat berebut media yang sama.
   Selain itu, kanal 160 MHz hampir pasti mencakup kanal DFS, dengan risiko pemutusan saat radar terdeteksi. Untuk kantor padat, **20 atau 40 MHz** memberi throughput total jauh lebih baik.

7. **Penyebab:** antena omni gain tinggi (9 dBi) memiliki pola radiasi yang pipih secara vertikal. Energinya difokuskan ke arah horizontal untuk mendapatkan gain, akibatnya cakupan ke atas dan ke bawah sangat lemah. Ditambah redaman lantai beton (20-30 dB), lantai 1 dan 3 hampir tidak menerima sinyal.
   **Solusi:** (a) **Pasang AP di setiap lantai.** Ini solusi yang benar; jangan mengandalkan penetrasi antar-lantai. (b) Kalau harus satu AP, gunakan **antena gain lebih rendah (3-5 dBi)** yang polanya lebih membulat. (c) Untuk gedung bertingkat, rencanakan juga **channel reuse vertikal**: AP lantai 1, 2, 3 harus di kanal berbeda karena sinyalnya saling menembus sebagian. (d) Lakukan **site survey** untuk memverifikasi cakupan aktual per lantai, bukan mengandalkan asumsi.

</details>

---

## 11. Sumber

- IEEE 802.11-2020, Wireless LAN MAC and PHY Specifications
- Cisco, *Wireless LAN Design Guide*
- Peraturan Menteri Komunikasi dan Informatika RI tentang penggunaan pita frekuensi 2,4 GHz dan 5 GHz
- CWNA (Certified Wireless Network Administrator), kurikulum resmi
- Ekahau: https://www.ekahau.com/resources/
- Cisco CCNA 200-301 v1.1, topik 1.11 (wireless principles: nonoverlapping channels, SSID, RF, encryption)

---

**Berikutnya:** `10-wireless/02-802-11.md`. Standar Wi-Fi dan cara kerjanya.

# 02.2 Kabel Tembaga: UTP, Kategori, Pinout, dan PoE

> **Prasyarat:** `02-layer-fisik/01`
> **Tujuan:** Anda bisa memilih kategori kabel yang benar, membuat kabel straight-through/crossover, memahami PoE sampai ke perhitungan power budget, dan mendiagnosis masalah kabel.

---

## 1. Anatomi Kabel Twisted Pair

Kabel LAN standar berisi **4 pasang** kawat tembaga yang dipilin, total 8 kawat.

```
Penampang kabel UTP:

     ┌─────────────────────────┐
     │  ╭─╮ Oranye/Putih-Oranye│  ← pasang 2
     │  ╰─╯                     │
     │  ╭─╮ Hijau/Putih-Hijau  │  ← pasang 3
     │  ╰─╯                     │
     │  ╭─╮ Biru/Putih-Biru    │  ← pasang 1
     │  ╰─╯                     │
     │  ╭─╮ Coklat/Putih-Coklat│  ← pasang 4
     │  ╰─╯                     │
     └─────────────────────────┘
          Selubung luar (jacket)
```

### Kenapa dipilin (twisted)?

Dua kawat dalam satu pasang membawa sinyal yang **berlawanan fase** (*differential signaling*). Interferensi dari luar mengenai keduanya sama besar. Penerima mengurangkan kedua sinyal:

```
Sinyal murni     : A dan −A          → selisih = 2A  ✅
Interferensi     : +N pada keduanya
Yang tiba        : (A+N) dan (−A+N)
Penerima hitung  : (A+N) − (−A+N) = 2A   ← noise HILANG
```

Pilinan memastikan kedua kawat berada di posisi yang hampir identik terhadap sumber interferensi. Makin rapat pilinan, makin baik penolakan noise pada frekuensi tinggi.

---

## 2. Jenis Pelindung (Shielding)

| Kode | Nama | Struktur |
|---|---|---|
| **UTP** | Unshielded Twisted Pair | Tanpa pelindung. Paling umum, murah, fleksibel |
| **FTP / F/UTP** | Foil Twisted Pair | Satu lapis foil membungkus semua pasang |
| **STP / U/FTP** | Shielded Twisted Pair | Foil per pasang |
| **S/FTP** | Screened + Foiled | Foil per pasang **plus** braid keseluruhan |
| **SF/UTP** | Foil + braid keseluruhan | Tanpa foil per pasang |

Notasi modern: `X/YTP` di mana X = pelindung keseluruhan, Y = pelindung per pasang.
```
U/UTP  = tanpa pelindung apa pun (= UTP)
F/UTP  = foil keseluruhan, pasang tanpa pelindung
U/FTP  = tanpa pelindung keseluruhan, tiap pasang berfoil
S/FTP  = braid keseluruhan + foil tiap pasang (paling terlindungi)
```

> [!WARNING]
> **Kabel bershield HARUS di-grounding dengan benar** di salah satu ujung (atau keduanya, sesuai standar yang dipakai). Shield yang tidak di-grounding justru menjadi **antena** dan memperburuk keadaan. Ini kesalahan instalasi yang sangat umum.

Kapan pakai shielded:
- Lingkungan industri (pabrik, dekat motor besar, inverter, las)
- Rumah sakit (dekat MRI, peralatan medis)
- Data center dengan kepadatan kabel tinggi (alien crosstalk pada 10G)
- Jalur sejajar kabel listrik yang tidak bisa dihindari

---

## 3. Kategori Kabel

| Kategori | Bandwidth | Kecepatan maksimum | Jarak | Status |
|---|---|---|---|---|
| Cat3 | 16 MHz | 10 Mbps | 100 m | Usang (dulu untuk telepon) |
| Cat5 | 100 MHz | 100 Mbps | 100 m | Usang |
| **Cat5e** | 100 MHz | **1 Gbps** | 100 m | Masih banyak terpasang |
| **Cat6** | 250 MHz | 1 Gbps @100 m; **10 Gbps @55 m** | 100 m | Umum |
| **Cat6A** | 500 MHz | **10 Gbps @100 m** | 100 m | Standar untuk instalasi baru |
| Cat7 | 600 MHz | 10 Gbps | 100 m | Konektor GG45/TERA, tidak populer |
| Cat7A | 1000 MHz | 40 Gbps @50 m | 100 m | Jarang |
| Cat8 | 2000 MHz | **25/40 Gbps** | **30 m** | Khusus data center (ToR ke server) |

### Yang perlu diingat

1. **Cat5e cukup untuk 1 Gbps.** Tidak perlu Cat6 kalau kebutuhannya hanya gigabit.
2. **Cat6 mendukung 10G hanya sampai 55 m** (dan lebih pendek lagi jika ada alien crosstalk berat).
3. **Cat6A adalah pilihan default untuk instalasi baru** — mendukung 10G penuh 100 m, siap untuk masa depan, dan biaya kabelnya tidak jauh berbeda. Biaya terbesar instalasi adalah **tenaga kerja**, bukan kabel; menarik ulang kabel jauh lebih mahal daripada memilih kategori lebih tinggi sejak awal.
4. **Cat8 hanya 30 m** — dirancang untuk koneksi pendek dalam rak data center, bukan untuk kabel gedung.
5. **Kategori kabel harus konsisten dengan seluruh komponen**: patch panel, keystone jack, patch cord. Rantai sekuat mata rantai terlemah — Cat6A dengan jack Cat5e = kinerja Cat5e.

### CCA: jebakan pasar

**CCA** (*Copper Clad Aluminum*) adalah kabel aluminium berlapis tembaga tipis, dijual murah dengan label "Cat6".

Masalahnya:
- Resistansi DC jauh lebih tinggi → **gagal pada PoE** (perangkat mati/restart), kabel bisa panas
- Lebih rapuh, mudah patah saat ditekuk
- Tidak memenuhi standar TIA/ISO — gagal uji sertifikasi
- Kadang terbakar pada PoE++ berdaya tinggi

> [!TIP]
> Cara mendeteksi: kabel tembaga murni terasa lebih berat dan lebih lentur; CCA lebih ringan, kaku, dan kawatnya patah saat ditekuk berulang. Kabel asli mencantumkan "solid copper" atau memenuhi "ETL verified".

### Solid vs Stranded

| | Solid | Stranded |
|---|---|---|
| Konstruksi | Satu kawat tebal per konduktor | Banyak kawat halus dipilin |
| Untuk | Jalur permanen dalam dinding/plafon | Patch cord |
| Terminasi | Punch-down ke jack/panel | Crimp ke plug RJ45 |
| Kelenturan | Kaku | Lentur, tahan tekuk berulang |
| Atenuasi | Lebih rendah | Sedikit lebih tinggi |

> [!WARNING]
> Memakai kabel solid untuk patch cord yang sering digerakkan → kawat patah. Memakai stranded untuk jalur panjang permanen → atenuasi lebih besar dan punch-down tidak andal.

---

## 4. Pinout: T568A dan T568B

Konektor **RJ45** (nama teknisnya 8P8C) punya 8 pin.

```
    Tampak dari depan konektor, klip di bawah:
    ┌─────────────────┐
    │ 1 2 3 4 5 6 7 8 │
    └────────┬────────┘
             │ klip
```

### T568B (paling umum dipakai)

| Pin | Warna | Pasang |
|---|---|---|
| 1 | Putih-Oranye | 2 |
| 2 | Oranye | 2 |
| 3 | Putih-Hijau | 3 |
| 4 | Biru | 1 |
| 5 | Putih-Biru | 1 |
| 6 | Hijau | 3 |
| 7 | Putih-Coklat | 4 |
| 8 | Coklat | 4 |

### T568A

| Pin | Warna | Pasang |
|---|---|---|
| 1 | Putih-Hijau | 3 |
| 2 | Hijau | 3 |
| 3 | Putih-Oranye | 2 |
| 4 | Biru | 1 |
| 5 | Putih-Biru | 1 |
| 6 | Oranye | 2 |
| 7 | Putih-Coklat | 4 |
| 8 | Coklat | 4 |

**Perbedaannya hanya:** pasangan oranye dan hijau ditukar (pin 1-2 ↔ 3-6).

> [!TIP]
> Mnemonic T568B: **"Putih-Oranye, Oranye, Putih-Hijau, Biru, Putih-Biru, Hijau, Putih-Coklat, Coklat."** Ucapkan berulang sampai hafal — ini akan Anda pakai seumur karier.

> [!WARNING]
> Perhatikan pin 4-5 dan 3-6: pasang biru menempati pin 4-5 (berdampingan) tetapi pasang hijau **terpisah** di pin 3 dan 6. Ini bukan kesalahan desain — ini untuk kompatibilitas mundur dengan telepon analog yang memakai pin 4-5.

### Straight-through vs Crossover vs Rollover

| Jenis | Ujung A | Ujung B | Untuk |
|---|---|---|---|
| **Straight-through** | T568B | T568B | Perangkat **berbeda jenis**: PC↔switch, switch↔router, AP↔switch |
| **Crossover** | T568A | T568B | Perangkat **sejenis**: PC↔PC, switch↔switch, router↔router |
| **Rollover** (console) | Urutan dibalik total (1↔8, 2↔7, ...) | | PC ke port console perangkat Cisco |

**Aturan lama:** perangkat "berbeda level" pakai straight-through; "sama level" pakai crossover.

> [!WARNING]
> **Tetapi sejak Auto-MDI/MDIX, ini hampir tidak relevan lagi.** Hampir semua perangkat gigabit modern otomatis mendeteksi dan menyesuaikan. Anda tetap harus tahu konsepnya untuk ujian dan untuk perangkat lama.

Perangkat yang masih butuh perhatian:
- Switch/router lama tanpa auto-MDIX
- Beberapa perangkat industri
- Saat auto-negotiation dimatikan (hard-coded speed/duplex) — **auto-MDIX ikut mati** pada banyak perangkat Cisco

### Pasangan yang dipakai per kecepatan

| Standar | Pasangan dipakai | Catatan |
|---|---|---|
| 10BASE-T | 2 pasang (1-2, 3-6) | Pasang 4-5, 7-8 bebas |
| 100BASE-TX | 2 pasang (1-2, 3-6) | Sama |
| **1000BASE-T** | **4 pasang, dua arah** | Semua kawat harus tersambung benar |
| 10GBASE-T | 4 pasang, dua arah | Butuh Cat6A |

> [!TIP]
> Ini menjelaskan gejala klasik: **kabel dengan satu pasang rusak tetap jalan di 100 Mbps tetapi tidak bisa 1 Gbps.** Kalau link tiba-tiba "turun" ke 100 Mbps, curigai kabel/konektor, bukan konfigurasi.

---

## 5. Membuat dan Menguji Kabel

### Langkah membuat patch cord

```
1. Potong kabel dengan panjang yang cukup (+ toleransi)
2. Kupas jaket ±25 mm — HATI-HATI jangan melukai isolasi kawat
3. Urai pasangan, luruskan kawat
4. Susun sesuai T568B
5. Rapikan ujung, potong rata pada ±13 mm dari jaket
   ⚠️ Panjang pilinan yang terbuka MAKSIMAL 13 mm
6. Masukkan ke plug RJ45 — pastikan semua 8 kawat menyentuh ujung depan
   dan jaket masuk melewati titik crimp strain relief
7. Crimp dengan tang yang benar
8. UJI dengan cable tester
```

### Cable tester

- **Continuity tester** (murah) — hanya memeriksa apakah semua 8 kawat tersambung dan urutannya benar (wiremap).
- **Qualification tester** — memeriksa apakah kabel bisa mendukung kecepatan tertentu.
- **Certification tester** (Fluke DSX, dll — mahal) — mengukur NEXT, return loss, insertion loss, delay skew, dan menerbitkan sertifikat sesuai TIA/ISO. Diperlukan untuk garansi instalasi.

Parameter yang diuji sertifikasi:
```
Wiremap            : semua kawat ke pin yang benar, tidak ada short/open/split pair
Length             : ≤ 90 m permanent link
Insertion loss     : atenuasi total
NEXT / PSNEXT      : crosstalk ujung dekat
ACR-F / PSACR-F    : crosstalk ujung jauh relatif
Return loss        : pantulan sinyal
Propagation delay  : waktu tempuh
Delay skew         : selisih waktu antar-pasang
DC resistance      : penting untuk PoE
```

> [!WARNING]
> **Split pair** — kesalahan yang lolos dari tester murah. Kawat tersambung ke pin yang benar, tetapi memakai kawat dari pasangan yang salah. Continuity tester bilang "OK", tetapi crosstalk parah dan gigabit gagal. Hanya tester bagus yang mendeteksinya.

### TDR (Time Domain Reflectometer)

Mengirim pulsa dan mengukur pantulannya untuk menemukan **lokasi** kerusakan.

```
SW1# test cable-diagnostics tdr interface gi0/5
SW1# show cable-diagnostics tdr interface gi0/5

Pair  Status              Length
1     Normal              48 m
2     Normal              48 m
3     Open                12 m     ← kabel putus di 12 m dari switch
4     Normal              48 m
```

Ini menghemat berjam-jam pencarian fisik.

---

## 6. PoE: Power over Ethernet

### Standar

| Standar | Nama umum | Daya di PSE | Daya di PD | Pasangan | Tegangan |
|---|---|---|---|---|---|
| **802.3af** | PoE | 15,4 W | 12,95 W | 2 pasang | 44-57 V |
| **802.3at** | PoE+ | 30 W | 25,5 W | 2 pasang | 50-57 V |
| **802.3bt Type 3** | PoE++ / 4PPoE | 60 W | 51 W | **4 pasang** | 50-57 V |
| **802.3bt Type 4** | PoE++ / HDBaseT | 90-100 W | 71,3 W | **4 pasang** | 52-57 V |

Selisih daya PSE vs PD adalah **rugi daya di kabel** — makin panjang dan makin tipis kabelnya, makin besar rugi.

### Kelas daya (Class)

| Class | Daya maksimum di PD | Standar |
|---|---|---|
| 0 | 12,95 W (default, tidak terklasifikasi) | af |
| 1 | 3,84 W | af |
| 2 | 6,49 W | af |
| 3 | 12,95 W | af |
| 4 | 25,5 W | at |
| 5 | 40 W | bt |
| 6 | 51 W | bt |
| 7 | 62 W | bt |
| 8 | 71,3 W | bt |

### Cara PoE bekerja (proses negosiasi)

```
1. DETEKSI    — PSE mengirim tegangan rendah (2,8–10 V) dan mengukur resistansi.
                PD yang valid punya signature 25 kΩ.
                Kalau bukan PD → JANGAN kirim daya (melindungi perangkat non-PoE).

2. KLASIFIKASI— PSE mengirim tegangan 15,5–20,5 V, mengukur arus yang ditarik PD.
                Dari situ ditentukan class → berapa daya yang perlu dialokasikan.

3. STARTUP    — PSE menaikkan tegangan ke 44–57 V secara bertahap.

4. OPERASI    — PSE memantau. Kalau PD dicabut (arus hilang) → matikan daya
                dalam ~300–400 ms.
```

Inilah kenapa PoE **aman**: perangkat non-PoE yang tertancap tidak akan menerima 48 V karena gagal di tahap deteksi.

### Alternative A vs Alternative B

Untuk 802.3af/at (2 pasang):
- **Alternative A** — daya di pasang 1-2 dan 3-6 (pasang data, memakai phantom power).
- **Alternative B** — daya di pasang 4-5 dan 7-8 (pasang cadangan).

PD wajib mendukung keduanya. 802.3bt memakai **keempat pasang** sekaligus.

### Istilah

- **PSE** (*Power Sourcing Equipment*) — switch PoE atau injector.
- **PD** (*Powered Device*) — AP, kamera IP, telepon IP.
- **Endspan** — PSE adalah switch itu sendiri.
- **Midspan / injector** — perangkat terpisah yang disisipkan di jalur kabel (untuk switch non-PoE).
- **PoE splitter** — memisahkan daya dan data untuk perangkat non-PoE.

### Power Budget: Perhitungan yang Wajib

Switch punya total daya terbatas, bukan per port.

**Contoh 1:**
```
Switch    : 48 port PoE+, power budget 740 W
Perangkat : 40 AP Wi-Fi 6, masing-masing class 4 (25,5 W)

Kebutuhan = 40 × 25,5 = 1.020 W  >  740 W  ❌ TIDAK CUKUP
```
Yang terjadi: switch memberi daya sesuai prioritas dan **mematikan sisanya**, atau AP restart bergantian secara acak — gejala yang sangat membingungkan kalau tidak tahu penyebabnya.

**Contoh 2:**
```
Switch    : 24 port PoE+, budget 370 W
Perangkat : 12 telepon IP (class 2, 6,49 W) + 8 AP (class 4, 25,5 W)

Kebutuhan = (12 × 6,49) + (8 × 25,5) = 77,9 + 204 = 281,9 W
Sisa      = 370 − 281,9 = 88,1 W  → headroom 24%  ✅ AMAN
```

**Aturan praktis:** sisakan headroom 20-30% untuk pertumbuhan dan lonjakan daya saat boot.

### Verifikasi PoE
```
SW1# show power inline
Available:370.0(w)  Used:281.9(w)  Remaining:88.1(w)

Interface Admin  Oper       Power   Device              Class Max
--------- ------ ---------- ------- ------------------- ----- ----
Gi1/0/1   auto   on         25.5    AIR-AP2802I         4     30.0
Gi1/0/2   auto   on         6.5     IP Phone 7841       2     30.0
Gi1/0/3   auto   off        0.0     n/a                 n/a   30.0

SW1# show power inline gi1/0/1 detail
SW1# show power inline police          ← pelanggaran batas daya
```

### Masalah PoE yang sering terjadi

> [!WARNING]
> **1. Power budget habis** — perangkat mati acak. Cek `show power inline`.

> [!WARNING]
> **2. Kabel CCA atau terlalu panjang** — rugi daya terlalu besar, PD tidak menyala walaupun budget cukup.

> [!WARNING]
> **3. Perangkat butuh 802.3bt tetapi switch hanya 802.3at** — misalnya AP Wi-Fi 6E/7 kelas atas atau kamera PTZ dengan pemanas.

> [!WARNING]
> **4. AP masuk mode daya rendah** — Wi-Fi 6/7 AP yang hanya diberi 802.3af akan mematikan sebagian radio atau port. Gejalanya: throughput jauh di bawah spesifikasi. Cek log AP: "AP is running in low power mode".

> [!WARNING]
> **5. Injector non-standar (passive PoE)** — perangkat murah yang langsung mengirim 24 V/48 V tanpa negosiasi. **Bisa merusak perangkat non-PoE.** Hindari di lingkungan campuran.

---

## 7. Kabel Coaxial dan DAC

### Coaxial

```
   ┌─────────────────────────────┐
   │ ═══ konduktor tengah ═══     │
   │ ░░░ dielektrik ░░░           │
   │ ▓▓▓ shield/braid ▓▓▓         │
   │ ███ jaket ███                │
   └─────────────────────────────┘
```

| Tipe | Impedansi | Untuk |
|---|---|---|
| RG-6 | 75 Ω | TV kabel, internet DOCSIS, antena satelit |
| RG-59 | 75 Ω | CCTV analog (jarak pendek) |
| RG-58 | 50 Ω | 10BASE2 lama, radio |
| Hardline | 75 Ω | Distribusi CATV |

Konektor: **F-type** (TV/kabel modem), **BNC** (CCTV, alat ukur).

Di dunia jaringan modern, coax hanya Anda temui pada **koneksi internet kabel (DOCSIS)** dan CCTV analog lama.

### DAC / Twinax

**DAC** (*Direct Attach Copper*) — kabel tembaga dengan transceiver terpasang permanen di kedua ujung.

- Untuk jarak sangat pendek (1-7 m; active DAC sampai 10-15 m).
- Jauh **lebih murah** daripada sepasang transceiver optik + patch fiber.
- Konsumsi daya lebih rendah.
- Dipakai untuk: server ke ToR switch, switch ke switch dalam rak yang sama.
- Bentuk: SFP+ DAC (10G), SFP28 (25G), QSFP+ (40G), QSFP28 (100G).

**AOC** (*Active Optical Cable*) — mirip DAC tetapi memakai serat di dalamnya; untuk jarak menengah (sampai ~100 m) tanpa perlu membeli transceiver terpisah.

---

## 8. Kabel Terstruktur (Structured Cabling)

Standar TIA-568 mendefinisikan sistem kabel gedung yang rapi dan dapat dikelola.

```
[Perangkat] ──patch cord── [Wall jack]
                                │
                            (permanent link, dalam dinding/plafon, maks 90 m)
                                │
                          [Patch panel]
                                │
                          ──patch cord──
                                │
                            [Switch]
```

**Batas panjang (channel = total maksimum 100 m):**
```
Permanent link (jack ke patch panel)  : maksimum 90 m
Patch cord di kedua ujung             : total maksimum 10 m
────────────────────────────────────────────────────
Channel total                          : 100 m
```

### Komponen

- **Patch panel** — panel di rak tempat semua kabel permanen diterminasi. Membuat perubahan cukup dilakukan dengan memindah patch cord, bukan menarik ulang kabel.
- **Keystone jack** — soket di sisi pengguna (wall plate).
- **Punch-down tool** — alat menekan kawat ke terminal IDC pada jack/panel (tipe 110 atau Krone).
- **Cable management** — rapikan dengan velcro, **jangan cable tie yang dikencangkan** (menekan kabel → mengubah impedansi).
- **Labeling** — setiap ujung kabel diberi label yang konsisten dengan dokumentasi. Ini bukan formalitas; ini yang menyelamatkan Anda saat pukul 2 pagi.

### Ruang-ruang

| Istilah | Arti |
|---|---|
| **MDF** (*Main Distribution Frame*) / ER (*Equipment Room*) | Ruang utama, tempat core switch & masuknya layanan provider |
| **IDF** (*Intermediate Distribution Frame*) / TR (*Telecom Room*) | Ruang distribusi per lantai/area, tempat switch access |
| **Backbone cabling** | Kabel antara MDF dan IDF (biasanya serat) |
| **Horizontal cabling** | Kabel dari IDF ke wall jack (maks 90 m) |
| **Work area** | Sisi pengguna |
| **Demarc** | Titik batas tanggung jawab dengan provider |

> [!TIP]
> Aturan 90 m menentukan **jangkauan satu IDF ≈ radius 70–80 m** (setelah memperhitungkan jalur kabel yang tidak lurus). Ini yang menentukan berapa banyak ruang IDF dibutuhkan sebuah gedung — pertimbangan desain nyata, bukan teori.

---

## 9. Praktik & Diagnosis

### Gejala → dugaan penyebab

| Gejala | Kemungkinan penyebab |
|---|---|
| Link mati total | Kabel putus, konektor lepas, port mati, perangkat mati |
| Link naik di 100 Mbps padahal harusnya 1 Gbps | Satu pasang rusak; kabel Cat5 lama; konektor buruk |
| CRC error meningkat | Kabel rusak, EMI, konektor buruk, terlalu panjang |
| Link naik-turun (flapping) | Konektor longgar, kabel terjepit, SFP bermasalah |
| PoE tidak menyala | Budget habis, kabel CCA, class tidak didukung, port bukan PoE |
| Lambat & banyak collision | Duplex mismatch |
| Berfungsi saat kabel digoyang | Konektor/crimp buruk |

### Perintah cek
```bash
$ ethtool eth0 | grep -E 'Speed|Duplex|Link detected'
$ ip -s link show eth0
$ ethtool -S eth0 | grep -i err
```

```
SW1# show interfaces status
SW1# show interfaces gi0/1 | include error|CRC|collision
SW1# show power inline
SW1# test cable-diagnostics tdr interface gi0/1
SW1# show interfaces counters errors
```

---

## 10. Ringkasan

- Kabel LAN = 4 pasang dipilin; pilinan meniadakan noise lewat differential signaling.
- Cat5e = 1 Gbps; Cat6 = 10 G hanya 55 m; **Cat6A = 10 G penuh 100 m (pilihan default instalasi baru)**; Cat8 = 30 m untuk data center.
- Hindari **CCA** — gagal pada PoE dan tidak memenuhi standar.
- T568B paling umum; T568A dan T568B hanya berbeda tukar pasang oranye/hijau.
- Straight-through untuk perangkat berbeda jenis, crossover untuk sejenis — tetapi **auto-MDIX** membuat ini jarang relevan.
- 1000BASE-T memakai **keempat pasang**; satu pasang rusak → turun ke 100 Mbps.
- Buka pilinan maksimal **13 mm**; channel maksimum **100 m** (90 m permanent + 10 m patch).
- PoE: af 15,4 W / at 30 W / bt 60-90 W di PSE. Selalu hitung **power budget dengan headroom 20-30%**.
- PoE aman karena ada tahap deteksi & klasifikasi sebelum tegangan penuh dikirim.
- Split pair adalah kesalahan yang lolos tester murah — pakai tester yang benar.

---

## 11. Latihan

1. Anda memasang 10G ke server sejauh 80 m. Kategori kabel apa yang minimal diperlukan?
2. Sebuah link tiba-tiba hanya bisa 100 Mbps padahal sebelumnya 1 Gbps. Apa dugaan pertama Anda dan bagaimana membuktikannya?
3. Switch 48 port PoE+ dengan budget 740 W. Anda ingin memasang 24 AP class 4 dan 20 telepon IP class 2. Cukup? Tunjukkan hitungannya.
4. Kenapa pasang hijau ditempatkan di pin 3 dan 6 (tidak berdampingan) pada T568B?
5. Anda membuat kabel dan continuity tester menunjukkan semua OK, tetapi gigabit tidak stabil. Apa kemungkinan penyebabnya?
6. Jelaskan mengapa PoE tidak merusak laptop biasa yang ditancapkan ke port PoE.
7. Jarak dari IDF ke titik terjauh di lantai adalah 95 m diukur mengikuti jalur kabel. Apa masalahnya dan apa solusinya?

<details>
<summary>Jawaban</summary>

1. **Cat6A.** Cat6 hanya mendukung 10GBASE-T sampai 55 m (bahkan lebih pendek jika ada alien crosstalk). Untuk 80 m dibutuhkan Cat6A yang tersertifikasi 10 G sampai 100 m.

2. **Kabel/konektor rusak pada salah satu pasang.** 1000BASE-T memerlukan keempat pasang; 100BASE-TX hanya butuh dua. Jika satu pasang putus, link otomatis turun ke 100 Mbps. Pembuktian: jalankan TDR (`test cable-diagnostics tdr`) atau uji dengan cable tester — akan terlihat pasang mana yang open/short. Alternatif cepat: ganti dengan patch cord yang diketahui baik.

3. (24 × 25,5) + (20 × 6,49) = 612 + 129,8 = **741,8 W**. Budget 740 W → **TIDAK CUKUP** (kurang 1,8 W), dan bahkan jika pas, tidak ada headroom sama sekali. Solusi: pakai switch dengan budget lebih besar, tambah PSU redundan yang menaikkan budget, distribusikan perangkat ke dua switch, atau pakai injector untuk beberapa perangkat.

4. Untuk **kompatibilitas mundur dengan telepon analog**. Telepon memakai pin 4-5 (pasang biru) untuk satu jalur dan pin 3-6 untuk jalur kedua. Dengan menempatkan pasang data di 1-2 dan 3-6, satu kabel bisa dipakai untuk data dan telepon secara bersamaan pada instalasi lama.

5. Kemungkinan besar **split pair** — kawat sampai ke pin yang benar tetapi diambil dari pasangan yang salah, sehingga pasangan yang membawa sinyal tidak dipilin bersama. Continuity tester hanya memeriksa "pin 1 ke pin 1", jadi lolos; tetapi crosstalk menjadi parah dan gigabit gagal. Kemungkinan lain: pilinan dibuka terlalu panjang (>13 mm), crimp buruk, atau kabel melebihi panjang maksimum.

6. Karena PoE melakukan **deteksi signature** sebelum mengirim daya. PSE mengirim tegangan rendah (2,8-10 V) dan mencari resistansi signature 25 kΩ yang hanya dimiliki PD valid. Laptop biasa tidak punya signature itu, sehingga PSE tidak pernah menaikkan tegangan ke 48 V. (Pengecualian: *passive PoE* non-standar yang langsung mengirim tegangan — inilah yang berbahaya dan harus dihindari.)

7. **Melebihi batas 90 m untuk permanent link** — dengan patch cord di kedua ujung, channel akan melebihi 100 m, sehingga tidak memenuhi standar dan berisiko error/kecepatan turun. Solusi: (a) tambahkan IDF baru yang lebih dekat ke area itu; (b) pindahkan posisi IDF ke titik yang lebih sentral; (c) gunakan serat optik untuk jalur tersebut dengan media converter/switch kecil di ujung; (d) periksa apakah jalur kabel bisa dibuat lebih pendek.

</details>

---

## 12. Sumber

- TIA/EIA-568-D — Commercial Building Telecommunications Cabling Standard
- ISO/IEC 11801-1:2017 — Generic cabling
- IEEE 802.3af / 802.3at / 802.3bt — Power over Ethernet
- IEEE 802.3bz — 2.5G/5GBASE-T (memakai Cat5e/Cat6 yang ada)
- Cisco CCNA 200-301 v1.1, topik 1.3, 1.4, dan 1.1.h (PoE)

---

**Berikutnya:** `02-layer-fisik/03-fiber.md`. Serat optik dari dasar sampai perhitungan power budget.

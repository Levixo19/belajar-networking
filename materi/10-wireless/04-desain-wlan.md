# 10.4 — Arsitektur dan Desain WLAN

> **Prasyarat:** `10-wireless/01`–`03`
> **Tujuan:** Anda paham arsitektur AP dan controller, bisa merancang cakupan dan kapasitas WLAN, serta mendiagnosis masalah wireless secara sistematis.

---

## 1. Arsitektur WLAN

| Arsitektur | Cara kerja | Cocok untuk |
|---|---|---|
| **Autonomous AP** | Setiap AP dikonfigurasi sendiri, punya semua fungsi | 1–5 AP, SOHO |
| **Controller-based (split-MAC)** | WLC memusatkan kontrol; AP jadi "lightweight" | Enterprise, kampus |
| **Cloud-managed** | Kontrol di cloud vendor | Multi-lokasi, tanpa staf lokal |
| **Embedded / Mobility Express** | Salah satu AP menjadi controller | 5–50 AP |
| **CAPsMAN** (MikroTik) | Controller MikroTik untuk AP MikroTik | Jaringan MikroTik |

### Split-MAC — konsep controller-based

Fungsi 802.11 dibagi antara AP dan WLC:

```
DI AP (real-time, tidak boleh tertunda):
  - Transmisi/penerimaan frame
  - Enkripsi/dekripsi
  - Beacon dan probe response
  - Buffering untuk power save
  - ACK frame

DI WLC (manajemen, boleh sedikit tertunda):
  - Autentikasi & asosiasi
  - Manajemen kunci
  - Manajemen RF (kanal, daya)
  - Roaming antar-AP
  - QoS policy
  - Keputusan keamanan
```

**CAPWAP** (*Control And Provisioning of Wireless Access Points*, RFC 5415) adalah protokol antara AP dan WLC:
```
UDP 5246 → control channel (DTLS-encrypted)
UDP 5247 → data channel
```

### Mode AP (topik CCNA 2.6)

| Mode | Fungsi |
|---|---|
| **Local** | Mode normal; trafik klien di-tunnel ke WLC (centrally switched) |
| **FlexConnect** | Trafik klien di-switch **lokal** di AP; kontrol tetap di WLC |
| **Monitor** | Tidak melayani klien; hanya memindai (rogue detection, location) |
| **Sniffer** | Menangkap frame dan mengirimkannya ke analyzer |
| **Rogue Detector** | Mendeteksi rogue AP lewat jaringan kabel |
| **Bridge / Mesh** | Menghubungkan jaringan tanpa kabel |
| **Flex+Bridge** | Kombinasi mesh dan FlexConnect |
| **SE-Connect** | Spectrum analysis |

⚠️ **Local mode mengirim SEMUA trafik klien ke WLC** lewat tunnel CAPWAP — bahkan kalau dua klien di AP yang sama saling berkomunikasi. Untuk cabang dengan link WAN lambat, ini sangat boros.

💡 **FlexConnect memecahkan masalah itu** — trafik di-switch lokal di AP, hanya kontrol yang lewat WAN. Wajib untuk desain cabang.

**FlexConnect punya beberapa mode:**
```
Connected mode   : WLC terjangkau, semua fitur aktif
Standalone mode  : WLC tidak terjangkau
                   → AP tetap melayani klien yang sudah terautentikasi
                   → autentikasi baru bergantung "local auth" atau gagal
```

---

## 2. Koneksi Fisik WLC dan AP (topik CCNA 2.7)

```
[AP] ──── access port ──── [Switch] ──── trunk/LAG ──── [WLC] ──── [Core]
```

**Port AP:**
- Biasanya **access port** di VLAN manajemen AP
- Untuk FlexConnect dengan local switching: **trunk port** (membawa VLAN klien juga)
- **PoE** — pastikan daya cukup (lihat di bawah)

**Port WLC:**
- **Trunk** atau **LAG (Link Aggregation)** ke switch
- Membawa VLAN manajemen dan semua VLAN klien

⚠️ **Perhatikan daya PoE untuk AP modern:**
```
Wi-Fi 5 AP     : 802.3af (15,4 W) biasanya cukup
Wi-Fi 6 AP     : 802.3at (30 W) diperlukan
Wi-Fi 6E/7 AP  : 802.3at atau 802.3bt (60 W) — periksa spesifikasi!
```

⚠️ **AP yang kekurangan daya akan berjalan dalam mode terbatas** — mematikan salah satu radio, mengurangi spatial stream, atau menonaktifkan port USB/Ethernet sekunder. Gejalanya: throughput jauh di bawah spesifikasi tanpa alasan jelas.

```
# Cisco — periksa daya AP
SW1# show power inline gi1/0/5 detail
WLC# show ap config general AP-Lantai2 | include Power
```

---

## 3. Site Survey

Ini yang membedakan WLAN yang bekerja dan yang selalu bermasalah.

### Jenis survei

| Jenis | Kapan | Alat |
|---|---|---|
| **Predictive** | Sebelum instalasi, dari denah | Ekahau AI Pro, Hamina, iBwave |
| **Passive** | Setelah instalasi, mendengarkan | NetSpot, Ekahau, WiFi Explorer |
| **Active** | Menghubungkan dan menguji throughput nyata | Ekahau, iPerf |
| **AP-on-a-stick** | Menempatkan AP sementara untuk mengukur | AP + baterai + tripod |
| **Spectrum analysis** | Menemukan interferensi non-Wi-Fi | Wi-Spy, Ekahau Sidekick, MikroTik spectral-scan |

💡 **Predictive survey tanpa validasi lapangan sering meleset jauh** — model tidak mengetahui material dinding yang sebenarnya, rak logam, atau interferensi. **Selalu validasi dengan passive survey setelah instalasi.**

### Target desain

| Aplikasi | RSSI minimum | SNR minimum | Cell overlap |
|---|---|---|---|
| Data umum | −70 dBm | 20 dB | 15% |
| **Suara (VoIP)** | **−67 dBm** | **25 dB** | **20%** |
| Video | −67 dBm | 25 dB | 20% |
| Location tracking | −75 dBm dari ≥3 AP | — | 30%+ |
| High density | −65 dBm | 25 dB | 20% |

⚠️ **Cell overlap yang terlalu besar (>25%) menyebabkan co-channel interference.** Yang terlalu kecil (<10%) menyebabkan roaming gagal dan "coverage hole". Target 15–20%.

### Kesalahan survei yang umum

⚠️ **1. Survei di gedung kosong.** Tubuh manusia menyerap 3–5 dB. Auditorium penuh berperilaku sangat berbeda.

⚠️ **2. Memakai adapter yang berbeda dari klien nyata.** Adapter survei sering lebih sensitif daripada ponsel. Survei dengan perangkat yang mewakili klien terburuk.

⚠️ **3. Hanya mengukur RSSI, bukan SNR.** RSSI baik dengan noise tinggi tetap buruk.

⚠️ **4. Mengabaikan sumbu vertikal.** Sinyal menembus lantai; AP lantai 2 mengganggu lantai 1 dan 3.

⚠️ **5. Tidak melakukan spectrum analysis.** Interferensi non-Wi-Fi tidak terlihat di survei Wi-Fi biasa.

---

## 4. Coverage vs Capacity Design

Ini keputusan desain paling mendasar.

```
COVERAGE-DRIVEN (lama):
  "Berapa AP minimum agar sinyal sampai ke seluruh area?"
  → sedikit AP, daya tinggi, sel besar
  → cocok untuk gudang, area dengan sedikit pengguna

CAPACITY-DRIVEN (modern):
  "Berapa AP yang dibutuhkan agar SEMUA pengguna mendapat bandwidth cukup?"
  → banyak AP, daya RENDAH, sel kecil
  → cocok untuk kantor, kampus, auditorium
```

### Menghitung kebutuhan AP berbasis kapasitas

```
Langkah 1: Berapa perangkat?
  200 karyawan × 2,5 perangkat = 500 perangkat

Langkah 2: Berapa yang aktif bersamaan?
  Asumsikan 60% aktif = 300 perangkat aktif

Langkah 3: Bandwidth per perangkat?
  Kantor umum : 2–5 Mbps
  Video call  : 2–4 Mbps
  Video 4K    : 25 Mbps
  → asumsikan rata-rata 3 Mbps → 900 Mbps total

Langkah 4: Throughput realistis per AP?
  Wi-Fi 6, 5 GHz, 80 MHz, kondisi baik ≈ 400–600 Mbps agregat
  → asumsikan 400 Mbps

Langkah 5: Jumlah AP
  900 / 400 = 2,25 → minimal 3 AP untuk kapasitas

Langkah 6: Cek terhadap batas klien per AP
  Praktik baik: maksimal 25–30 klien aktif per radio
  300 perangkat / 30 = 10 AP

→ AMBIL YANG LEBIH BESAR: 10 AP
```

⚠️ **Batas klien per AP hampir selalu menjadi faktor penentu**, bukan bandwidth. Wi-Fi adalah media bersama — 100 klien di satu AP akan sangat lambat meski bandwidth agregat mencukupi, karena setiap klien harus antre memakai media.

### Kepadatan tinggi (auditorium, stadion, ruang kelas)

```
Prinsip:
1. Sel SANGAT kecil → daya pancar rendah (8–11 dBm, bukan 20)
2. Kanal 20 MHz saja (memaksimalkan jumlah kanal non-overlap)
3. Matikan rate rendah (1, 2, 5,5, 11, 6, 9 Mbps)
4. Batasi jumlah SSID (2–3 maksimum)
5. Antena directional/patch mengarah ke bawah
6. Aktifkan airtime fairness
7. Aktifkan band steering ke 5/6 GHz
8. Pertimbangkan AP di bawah kursi atau di dinding samping, bukan plafon tinggi
```

💡 **Menurunkan daya pancar terasa berlawanan dengan intuisi, tetapi benar.** Sel yang lebih kecil berarti lebih sedikit klien per sel, lebih sedikit co-channel interference, dan roaming lebih tegas.

---

## 5. Perencanaan Kanal

### 2,4 GHz — pola 3 kanal

```
Lantai:
  [1]     [6]     [11]    [1]     [6]
      [11]    [1]     [6]     [11]
  [6]     [11]    [1]     [6]     [1]
```

Karena hanya ada 3 kanal, **kepadatan AP di 2,4 GHz sangat terbatas**. Di lingkungan padat, sering lebih baik **mematikan radio 2,4 GHz pada sebagian AP**.

### 5 GHz — banyak kanal

Dengan 20 MHz, tersedia ~25 kanal (termasuk DFS) → perencanaan jauh lebih mudah.

⚠️ **Jangan pakai kanal yang sama di lantai atas/bawah** — sinyal menembus lantai.

### Auto RF (RRM)

Sistem enterprise memiliki **Radio Resource Management** yang menyesuaikan kanal dan daya otomatis:
```
Cisco  : RRM (DCA untuk kanal, TPC untuk daya)
Aruba  : ARM (Adaptive Radio Management)
MikroTik: frequency=auto (jauh lebih sederhana)
```

💡 **Auto RF baik untuk memulai, tetapi selalu tinjau hasilnya.** Kadang ia membuat keputusan yang buruk (mis. memilih kanal DFS di dekat radar). Untuk lingkungan kritis, kunci kanal secara manual setelah survei.

---

## 6. Wireless Bridging dan Mesh

### Point-to-Point (PtP)

Menghubungkan dua gedung tanpa kabel.

```
[Gedung A] ──antena directional── ((( ))) ──antena directional── [Gedung B]
```

**Persyaratan:**
- **Line of sight** (garis pandang bebas)
- **60% zona Fresnel bebas** (lihat `10-wireless/01`)
- Antena berpolarisasi sama, ter-align dengan presisi
- Margin link ≥ 15 dB untuk Indonesia (curah hujan tinggi)
- Grounding dan proteksi petir ⚠️

```
# MikroTik — PtP dengan Nstreme/NV2
# Sisi A (AP)
/interface wireless set wlan1 mode=bridge ssid=PtP-Link band=5ghz-a/n/ac \
    frequency=5500 wireless-protocol=nv2 nv2-mode=dynamic-downlink \
    nv2-security=enabled nv2-preshared-key=RahasiaKuat

# Sisi B (station)
/interface wireless set wlan1 mode=station-bridge ssid=PtP-Link \
    wireless-protocol=nv2 nv2-preshared-key=RahasiaKuat

# Alignment
/interface wireless align monitor wlan1
/interface wireless monitor wlan1
```

💡 **NV2 (Nstreme Version 2)** adalah protokol TDMA proprietary MikroTik yang **menggantikan CSMA/CA** untuk link PtP/PtMP. Keunggulannya: tidak ada masalah hidden node, latency lebih rendah dan konsisten, dan throughput jauh lebih baik pada jarak jauh. ⚠️ **Hanya bekerja antar-perangkat MikroTik.**

### Point-to-Multipoint (PtMP)

Satu AP sektor melayani banyak stasiun — model **WISP/RT-RW Net**.

```
              [AP Sektor 120°]
             ╱       │       ╲
      [CPE-1]   [CPE-2]   [CPE-3]  ...
```

⚠️ **Hidden node adalah masalah utama di PtMP** — CPE di sisi berlawanan tidak saling mendengar. NV2/TDMA memecahkannya; CSMA/CA tidak.

### Mesh

AP saling terhubung tanpa kabel; salah satu (RAP — Root AP) terhubung ke kabel.

```
[RAP] ─kabel─ [Jaringan]
  ╱  ╲
[MAP] [MAP]
       ╱  ╲
    [MAP] [MAP]
```

⚠️ **Setiap hop mesh memotong throughput sekitar setengah** (radio yang sama dipakai untuk uplink dan downlink). Mesh 3 hop → ~12,5% throughput asli.

💡 **Batasi mesh maksimal 2–3 hop.** Untuk mesh yang serius, gunakan AP dengan radio backhaul terpisah (tri-band) sehingga uplink tidak berbagi radio dengan klien.

---

## 7. CAPsMAN — Controller MikroTik

```
# Di CONTROLLER
/caps-man manager set enabled=yes certificate=auto
/caps-man configuration add name=cfg-kantor ssid=KANTOR \
    security.authentication-types=wpa2-psk \
    security.passphrase="PassphraseKuat" \
    datapath.bridge=bridge-LAN datapath.local-forwarding=yes \
    channel.band=5ghz-a/n/ac channel.width=20/40mhz-Ce \
    country=indonesia

/caps-man provisioning add action=create-dynamic-enabled \
    master-configuration=cfg-kantor name-format=prefix-identity name-prefix=AP

# Di setiap AP
/interface wireless cap set enabled=yes interfaces=wlan1 \
    discovery-interfaces=bridge-LAN bridge=bridge-LAN certificate=request

# Verifikasi di controller
/caps-man radio print
/caps-man registration-table print
/caps-man interface print
```

💡 **`local-forwarding=yes`** membuat trafik klien di-switch lokal di AP (setara FlexConnect) alih-alih di-tunnel ke controller — wajib untuk cabang dengan link WAN lambat.

**RouterOS v7 memakai `/interface wifi` dan CAPsMAN yang berbeda:**
```
/interface wifi capsman set enabled=yes
/interface wifi provisioning add action=create-dynamic-enabled \
    master-configuration=cfg-kantor
```

---

## 8. Troubleshooting Wireless

### Alur diagnosis

```
1. MASALAH SATU KLIEN atau SEMUA KLIEN?
   Satu klien  → driver, konfigurasi klien, kemampuan perangkat
   Semua klien → AP, RF, jaringan kabel di belakang AP

2. TIDAK BISA TERHUBUNG SAMA SEKALI?
   → SSID terlihat?      (masalah RF/kanal/DFS)
   → Autentikasi gagal?  (PSK salah, RADIUS, sertifikat)
   → Terhubung tapi tidak dapat IP? (DHCP, VLAN, trunk)

3. TERHUBUNG TAPI LAMBAT?
   → Cek RSSI dan SNR    (coverage/interferensi)
   → Cek MCS/tx-rate     (rate adaptation)
   → Cek retry rate      (interferensi/hidden node)
   → Cek jumlah klien    (kapasitas)
   → Cek airtime         (klien lambat menyeret semua)
   → Cek uplink AP       (100 Mbps? PoE kurang?)

4. TERPUTUS-PUTUS?
   → Roaming (sticky client)
   → DFS radar event
   → Interferensi periodik (microwave, radar)
   → Power save issue
   → Deauth attack

5. HANYA DI AREA TERTENTU?
   → Coverage hole → site survey
```

### Perintah diagnostik

```bash
# Linux — sisi klien
$ iw dev wlan0 link
$ iw dev wlan0 station dump
$ watch -n1 'iw dev wlan0 link | grep -E "signal|tx bitrate|rx bitrate"'
$ iw dev wlan0 scan | grep -E 'SSID|signal|freq'
$ journalctl -u wpa_supplicant -f
```

```
# MikroTik
/interface wireless registration-table print detail
     signal-strength: -55dBm@6Mbps
     signal-to-noise: 40
     tx-rate: 866.7Mbps-80MHz/2S/SGI
     tx-ccq: 95%
     p-throughput: 520000
     packets: 15234,8721
     bytes: 12M,8M
     frames: 15234,8721
     hw-frames: 16102,8901       ← selisih besar dengan frames = banyak RETRY
     tx-frames-timeout: 0

/interface wireless monitor wlan1
/interface wireless spectral-scan wlan1
/interface wireless sniffer sniff wlan1
/log print where topics~"wireless"
```

💡 **`tx-ccq` (Client Connection Quality)** di MikroTik adalah metrik gabungan terbaik untuk penilaian cepat. Di bawah 70% = ada masalah. Selisih besar antara `frames` dan `hw-frames` menunjukkan banyak retransmisi.

```
# Cisco WLC
WLC> show client summary
WLC> show client detail <mac>
WLC> show ap summary
WLC> show ap auto-rf 802.11a <ap-name>
WLC> show ap channel <ap-name>
WLC> show rogue ap summary
WLC> debug client <mac>              ← sangat berguna, tampilkan seluruh proses koneksi
```

### Tabel gejala → penyebab

| Gejala | Kemungkinan penyebab |
|---|---|
| SSID tidak terlihat | AP mati; kanal DFS (klien lama tidak mendukung); SSID hidden; band tidak didukung klien |
| Terhubung lalu langsung putus | PSK salah; RADIUS menolak; PMF mismatch; MAC filtering |
| Dapat IP 169.254.x.x | DHCP tidak sampai — VLAN salah di AP/trunk; DHCP relay; pool habis |
| Sinyal kuat tetapi lambat | SNR rendah (interferensi); banyak klien; klien lambat menyeret; uplink AP bottleneck |
| Terputus saat berjalan | Roaming buruk — aktifkan 802.11k/v/r, turunkan daya, minimum RSSI |
| Terputus periodik semua klien | **DFS radar event**; interferensi periodik; AP reboot; PoE tidak stabil |
| Throughput jauh di bawah spesifikasi | **PoE kurang daya** → AP mode terbatas; uplink 100 Mbps; klien 1x1 |
| Hanya sebagian klien bermasalah | Klien lama (802.11b/g) memaksa protection mode; driver bermasalah |
| Retry rate tinggi | Interferensi; hidden node; sinyal lemah; kanal padat |

⚠️ **Selalu periksa uplink AP dan daya PoE terlebih dahulu** saat throughput mengecewakan. AP Wi-Fi 6 dengan uplink 100 Mbps atau PoE 802.3af akan berkinerja jauh di bawah spesifikasi tanpa gejala jelas lainnya.

---

## 9. Ringkasan

- Arsitektur: **autonomous** (kecil), **controller-based/split-MAC** (enterprise), **cloud-managed**, **embedded**, **CAPsMAN** (MikroTik).
- **CAPWAP**: UDP 5246 (control, DTLS) dan 5247 (data).
- Mode AP: **local** (tunnel ke WLC), **FlexConnect** (switch lokal — wajib untuk cabang), monitor, sniffer, bridge/mesh.
- **Periksa daya PoE**: Wi-Fi 6 butuh 802.3at; Wi-Fi 6E/7 bisa butuh 802.3bt. AP kurang daya berjalan dalam mode terbatas.
- **Site survey**: predictive → validasi passive. Target **−67 dBm, SNR 25 dB, overlap 15–20%** untuk suara.
- Survei di gedung kosong menyesatkan — **tubuh manusia menyerap 3–5 dB**.
- **Capacity-driven design**: sel kecil, daya rendah, banyak AP. **Batas klien per AP (25–30) biasanya menjadi faktor penentu**, bukan bandwidth.
- Kepadatan tinggi: daya rendah, 20 MHz, matikan rate rendah, batasi SSID, airtime fairness.
- **2,4 GHz hanya 3 kanal** — pertimbangkan mematikan sebagian radio 2,4 GHz.
- **Setiap hop mesh memotong throughput setengah** — batasi 2–3 hop, atau pakai radio backhaul terpisah.
- **NV2 (MikroTik)** menggantikan CSMA/CA dengan TDMA untuk PtP/PtMP — memecahkan hidden node.
- Troubleshooting: pisahkan **satu klien vs semua klien**; periksa **RSSI, SNR, MCS, retry, jumlah klien, uplink, dan PoE**.

---

## 10. Latihan

1. Kapan memakai FlexConnect alih-alih local mode? Jelaskan alasannya.
2. Hitung jumlah AP untuk kantor 300 karyawan, 2 perangkat per orang, 50% aktif, kebutuhan 3 Mbps per perangkat.
3. Kenapa desain kepadatan tinggi memakai daya pancar RENDAH?
4. AP Wi-Fi 6 memberi throughput hanya 90 Mbps. Sebutkan tiga hal pertama yang Anda periksa.
5. Semua klien di satu AP terputus bersamaan setiap beberapa jam. Apa dugaan utama Anda?
6. Jelaskan kenapa mesh 4 hop adalah desain yang buruk.
7. Anda merancang link PtP 7 km di daerah dengan curah hujan tinggi. Apa yang harus diperhatikan?

<details>
<summary>Jawaban</summary>

1. Gunakan **FlexConnect** ketika AP berada di **lokasi cabang yang terhubung ke WLC lewat WAN**. Dalam **local mode**, semua trafik klien di-tunnel lewat CAPWAP ke WLC — bahkan trafik antar-klien di AP yang sama, dan bahkan trafik yang tujuannya adalah server di cabang itu sendiri. Ini membuang bandwidth WAN yang mahal, menambah latency, dan membuat cabang **berhenti berfungsi** jika WAN putus.
   **FlexConnect** melakukan *local switching*: trafik klien di-switch langsung di AP ke VLAN lokal, hanya trafik kontrol (autentikasi, manajemen) yang lewat WAN ke WLC. Saat WAN putus, AP masuk **standalone mode** dan tetap melayani klien yang sudah terautentikasi. Syaratnya: port AP harus **trunk** yang membawa VLAN klien.

2. ```
   Perangkat total   : 300 × 2 = 600
   Aktif bersamaan   : 600 × 50% = 300
   Bandwidth total   : 300 × 3 Mbps = 900 Mbps

   Berbasis bandwidth:
     Throughput realistis per AP (Wi-Fi 6, 5 GHz, 80 MHz) ≈ 400 Mbps
     900 / 400 = 2,25 → 3 AP

   Berbasis jumlah klien:
     Maksimal 25–30 klien aktif per radio
     300 / 30 = 10 AP

   → AMBIL YANG LEBIH BESAR: 10 AP (dibulatkan ke atas untuk cakupan
     dan redundansi, mis. 12 AP)
   ```
   Faktor klien-per-AP menjadi penentu — ini hampir selalu terjadi. Tambahkan AP lagi setelah site survey untuk menutup coverage hole dan area kepadatan tinggi (ruang rapat, kantin).

3. Karena tujuan desain kepadatan tinggi adalah **memperkecil ukuran sel**, bukan memperluasnya. Daya pancar tinggi membuat sel besar, sehingga: (a) **banyak klien berkumpul di satu AP** — dan Wi-Fi adalah media bersama, sehingga semua harus antre; (b) **co-channel interference meningkat** karena sel-sel yang jauh pun saling mendengar dan harus saling menunggu; (c) **klien menjadi sticky** — bertahan di AP jauh karena sinyalnya masih "cukup", padahal ada AP dekat yang lebih baik.
   Dengan daya rendah (8–11 dBm), sel menjadi kecil dan batasnya tegas: klien terdistribusi merata, roaming terjadi lebih cepat, dan lebih banyak AP dapat memakai kanal yang sama tanpa saling mengganggu. Hasilnya **throughput agregat jauh lebih tinggi** meski kecepatan puncak per klien mungkin sedikit lebih rendah.

4. (a) **Daya PoE** — AP Wi-Fi 6 memerlukan 802.3at (30 W). Kalau hanya mendapat 802.3af (15,4 W), AP berjalan dalam mode terbatas: mematikan radio, mengurangi spatial stream, atau menonaktifkan port. Periksa `show power inline` dan log AP.
   (b) **Kecepatan uplink AP** — kalau port switch bernegosiasi 100 Mbps (kabel rusak, satu pasang putus, atau port lama), throughput maksimal 100 Mbps apa pun kemampuan radionya. Periksa `show interfaces status`.
   (c) **Kemampuan klien dan kondisi RF** — klien 1x1 atau 2x2 dengan kanal 20 MHz punya batas jauh lebih rendah; periksa `tx bitrate`, SNR, dan lebar kanal yang dinegosiasikan.
   Selanjutnya: jumlah klien di AP, interferensi, dan apakah ada klien 802.11b/g yang memaksa protection mode.

5. **DFS radar event.** Kalau AP memakai kanal DFS (52–144) dan mendeteksi pola radar (asli atau false positive dari radar cuaca, radar maritim, atau bahkan perangkat lain), ia **wajib meninggalkan kanal dalam 10 detik** dan tidak memakainya selama 30 menit. Semua klien terputus dan harus menyambung ulang di kanal baru.
   **Verifikasi:** periksa log AP/WLC untuk pesan radar detection dan channel change. Di Cisco: `show ap auto-rf 802.11a <ap>` dan cari riwayat perubahan kanal.
   **Solusi:** pindahkan AP ke kanal non-DFS (36–48 atau 149–165) kalau lokasinya dekat bandara/pelabuhan/instalasi radar. Trade-off-nya: lebih sedikit kanal tersedia.
   **Kemungkinan lain:** PoE tidak stabil menyebabkan AP reboot berkala, AP overheat, memory leak firmware, atau interferensi periodik.

6. Karena **setiap hop mesh memakai radio yang sama untuk menerima dari hop sebelumnya dan mengirim ke hop berikutnya** — radio hanya bisa melakukan satu hal pada satu waktu (half duplex). Akibatnya throughput terpotong sekitar **setengah pada setiap hop**:
   ```
   Hop 1 (RAP→MAP1) : 100%
   Hop 2 (MAP1→MAP2): ~50%
   Hop 3 (MAP2→MAP3): ~25%
   Hop 4 (MAP3→MAP4): ~12,5%
   ```
   Selain itu latency bertambah di setiap hop, dan kegagalan satu node memutus seluruh cabang di bawahnya. Dengan 4 hop, klien di ujung mendapat throughput sangat kecil dan pengalaman yang buruk.
   **Perbaikan:** batasi 2–3 hop; gunakan AP **tri-band** dengan radio backhaul khusus (sehingga uplink mesh tidak berbagi radio dengan klien); atau lebih baik lagi, tarik kabel/fiber ke lebih banyak titik.

7. **Perhitungan link budget dan margin:**
   - Hitung FSPL untuk 7 km pada frekuensi yang dipakai; tambahkan margin **15–20 dB** (bukan 10 dB standar) karena **rain fade** di iklim tropis Indonesia signifikan, terutama di 5 GHz ke atas.
   - Pilih antena dengan gain memadai (24–30 dBi grid/parabolic), tetapi periksa batas **EIRP regulasi Komdigi**.
   - **Zona Fresnel**: r = 17,32 × √(7/(4×5,5)) ≈ 9,8 m; butuh ≥ 60% bebas = **5,9 m ruang bebas** di titik tengah. Survei jalur untuk pohon (yang akan tumbuh!), gedung, dan kontur tanah.
   - **Polarisasi sama** di kedua sisi; lakukan alignment presisi (`/interface wireless align monitor`).
   - **Grounding dan proteksi petir** — wajib di Indonesia; pasang surge arrester pada kabel coax dan Ethernet, grounding tower yang benar.
   - Gunakan **NV2/TDMA** alih-alih 802.11 CSMA/CA untuk latency dan throughput yang lebih baik pada jarak jauh.
   - Pertimbangkan **kanal yang tidak DFS** dan lakukan spectrum scan untuk memastikan kanal bersih.
   - Rencanakan **jalur cadangan** (link kedua atau koneksi WAN alternatif) — link nirkabel jarak jauh akan terganggu saat hujan sangat lebat.

</details>

---

## 11. Sumber

- RFC 5415 — CAPWAP Protocol Specification
- Cisco, *Enterprise Mobility Design Guide*
- Cisco, *High Density Wireless LAN Design Guide*
- Ekahau, *Wi-Fi Design Best Practices*
- MikroTik CAPsMAN — https://help.mikrotik.com/docs/display/ROS/CAPsMAN
- Cisco CCNA 200-301 v1.1, topik 2.6 (Cisco Wireless Architectures & AP modes), 2.7 (koneksi fisik WLAN), 2.9 (interpretasi GUI WLAN)

---

**Berikutnya:** `11-wan-vpn/01-teknologi-wan.md` — menghubungkan lokasi yang berjauhan.

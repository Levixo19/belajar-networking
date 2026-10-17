# 10.3 Keamanan Wireless

> **Prasyarat:** `10-wireless/02`, `06-aplikasi/04` (kripto dasar)
> **Tujuan:** Anda paham evolusi keamanan Wi-Fi, bisa memilih dan mengonfigurasi yang tepat, serta mengenali dan memitigasi serangan wireless.

---

## 1. Kenapa Wireless Berbeda

```
Kabel    : penyerang harus AKSES FISIK ke kabel/port
Wireless : sinyal menyebar melewati dinding, ke jalan, ke gedung sebelah
           → siapa pun dalam jangkauan bisa MENDENGAR dan MENGIRIM
```

> [!WARNING]
> **Setiap frame wireless dapat ditangkap oleh siapa pun dengan adapter murah dalam mode monitor.** Enkripsi bukan pilihan — ia keharusan mutlak.

---

## 2. Evolusi Keamanan Wi-Fi

| Standar | Tahun | Enkripsi | Integritas | Status |
|---|---|---|---|---|
| **Open** | — | Tidak ada | Tidak | ⚠️ Hanya untuk hotspot publik dengan captive portal |
| **WEP** | 1999 | RC4 (40/104 bit) | CRC-32 | ❌ **RUSAK TOTAL** — dipecahkan dalam menit |
| **WPA** | 2003 | RC4 + **TKIP** | Michael MIC | ❌ Usang, rentan |
| **WPA2** | 2004 | **AES-CCMP** | CCM | ⚠️ Masih dipakai luas; rentan KRACK & offline attack |
| **WPA3** | 2018 | **AES-GCMP** / CCMP | GCM | ✅ **Standar saat ini** |

### Kenapa WEP rusak total

```
1. IV (Initialization Vector) hanya 24 bit
   → berulang setelah ~5000 paket → key reuse
2. RC4 punya kelemahan pada byte awal keystream
3. CRC-32 untuk integritas → LINEAR, bisa dimanipulasi
4. Kunci statis, tidak pernah dirotasi
5. Tidak ada autentikasi yang sesungguhnya

→ Dengan aircrack-ng, kunci WEP dipecahkan dalam 2–10 MENIT
```

> [!WARNING]
> **Kalau Anda menemukan WEP di lapangan, itu darurat keamanan.** Ganti segera.

### WPA2: masih dominan tetapi punya kelemahan

**Kelemahan 1 — Offline dictionary attack (PSK):**
```
Penyerang menangkap 4-way handshake (butuh deauth klien atau menunggu)
→ brute force PSK secara OFFLINE tanpa terdeteksi
→ passphrase lemah dipecahkan dalam jam/hari dengan GPU
```

**Kelemahan 2 — KRACK (2017):**
Serangan pada 4-way handshake yang memaksa key reinstallation → nonce reuse → sebagian trafik dapat didekripsi. Sudah ditambal lewat pembaruan firmware/driver, tetapi banyak perangkat lama tidak pernah diperbarui.

**Kelemahan 3 — Tidak ada forward secrecy:**
Kalau PSK bocor, **semua trafik yang pernah direkam** bisa didekripsi.

**Kelemahan 4 — PMKID attack (2018):**
Penyerang bisa mendapat material untuk brute force **tanpa perlu menunggu klien melakukan handshake** — cukup satu paket dari AP.

---

## 3. WPA3 (Standar Saat Ini)

### WPA3-Personal: SAE menggantikan PSK

**SAE** (*Simultaneous Authentication of Equals*, "Dragonfly") mengganti 4-way handshake berbasis PSK.

| Aspek | WPA2-PSK | WPA3-SAE |
|---|---|---|
| Offline dictionary attack | ✅ Mungkin | ❌ **Tidak mungkin** |
| Forward secrecy | Tidak | ✅ **Ya** |
| Passphrase lemah | Sangat berbahaya | Masih tidak disarankan, tetapi tidak bisa di-brute-force offline |
| Protected Management Frames | Opsional | **Wajib** |

> [!TIP]
> **Keunggulan terbesar SAE: setiap percobaan tebakan harus dilakukan ONLINE dengan AP** — sehingga rate limiting dan deteksi bekerja. Penyerang tidak bisa lagi menangkap handshake lalu menyerangnya di rumah dengan GPU.

> [!TIP]
> **Forward secrecy** berarti kalau passphrase bocor besok, trafik yang direkam hari ini **tetap tidak bisa didekripsi**.

### WPA3-Enterprise

```
WPA3-Enterprise           : setara WPA2-Enterprise + PMF wajib
WPA3-Enterprise 192-bit   : mode keamanan tinggi (CNSA)
    - GCMP-256 untuk enkripsi
    - HMAC-SHA-384 untuk integritas
    - ECDHE/ECDSA 384-bit
    - Hanya EAP-TLS
    → untuk pemerintahan, keuangan, pertahanan
```

### OWE (Enhanced Open)

Untuk jaringan **publik tanpa password**, OWE (*Opportunistic Wireless Encryption*, RFC 8110) memberikan **enkripsi tanpa autentikasi**.

```
Open biasa : trafik PLAINTEXT — siapa pun bisa membaca
OWE        : setiap klien menegosiasikan kunci unik lewat Diffie-Hellman
             → trafik TERENKRIPSI meski tanpa password
```

> [!WARNING]
> **OWE tidak mengautentikasi AP** — masih rentan evil twin. Tetapi jauh lebih baik daripada open biasa yang sepenuhnya plaintext.

> [!TIP]
> **Untuk Wi-Fi tamu di kafe/hotel, OWE adalah pilihan yang benar** — pengguna tidak perlu password, tetapi trafiknya tetap terenkripsi.

### Transition Mode

```
WPA2/WPA3 mixed → mendukung klien lama dan baru
```

> [!WARNING]
> **Transition mode mewarisi kelemahan WPA2** — penyerang bisa memaksa klien turun ke WPA2 (downgrade attack). Gunakan hanya selama masa migrasi, dan tetapkan tanggal untuk beralih ke WPA3-only.

> [!WARNING]
> **Band 6 GHz WAJIB WPA3** — tidak boleh open, tidak boleh WPA2, tidak boleh transition mode.

---

## 4. Empat-Way Handshake (WPA2)

Memahaminya penting untuk troubleshooting dan keamanan.

```
Sebelumnya: PMK (Pairwise Master Key) diturunkan dari
            PSK + SSID (PBKDF2, 4096 iterasi)
            atau dari 802.1X/EAP

Handshake:
1. AP → Klien : ANonce (nomor acak dari AP)
   Klien menghitung PTK = PRF(PMK, ANonce, SNonce, MAC-AP, MAC-Klien)

2. Klien → AP : SNonce + MIC
   AP menghitung PTK yang sama, memverifikasi MIC

3. AP → Klien : GTK (Group Temporal Key untuk broadcast) + MIC

4. Klien → AP : ACK
   → Kedua pihak memasang kunci, trafik mulai terenkripsi
```

**Hierarki kunci:**
```
PMK  → Pairwise Master Key (dari PSK atau EAP)
PTK  → Pairwise Transient Key (unik per sesi klien)
       ├── KCK : Key Confirmation Key (untuk MIC)
       ├── KEK : Key Encryption Key
       └── TK  : Temporal Key (mengenkripsi data unicast)
GTK  → Group Temporal Key (mengenkripsi broadcast/multicast, SAMA untuk semua klien)
```

> [!WARNING]
> **GTK sama untuk semua klien di SSID itu.** Artinya klien yang sah bisa mendekripsi trafik broadcast/multicast klien lain. Untuk isolasi sejati, aktifkan **client isolation**.

---

## 5. 802.1X / EAP: Autentikasi Enterprise

Untuk lingkungan korporat, PSK tidak memadai: satu passphrase bersama untuk semua orang berarti mengganti password saat ada karyawan keluar berarti mengonfigurasi ulang semua perangkat.

**802.1X** memberi setiap pengguna kredensial sendiri.

```
[Supplicant]  ←EAPOL→  [Authenticator]  ←RADIUS→  [Auth Server]
  (klien)                  (AP/WLC)              (ISE/NPS/FreeRADIUS)
```

### Metode EAP

| Metode | Kredensial klien | Sertifikat server | Keamanan |
|---|---|---|---|
| **EAP-TLS** | **Sertifikat** | ✅ Wajib | Terbaik (5/5) |
| **PEAP-MSCHAPv2** | Username/password | ✅ Wajib | Umum (3/5) |
| **EAP-TTLS** | Username/password | ✅ Wajib | 3/5 |
| **EAP-FAST** | PAC / kredensial | Opsional | Cisco (2/5) |
| EAP-MD5 | Password | Tidak | ❌ Jangan dipakai |
| LEAP | Password | Tidak | ❌ Rusak |

> [!WARNING]
> **PEAP-MSCHAPv2 rentan jika klien tidak memvalidasi sertifikat server.** Penyerang bisa mendirikan AP palsu dengan RADIUS palsu, menangkap MSCHAPv2 challenge/response, lalu memecahkannya offline (MSCHAPv2 dapat direduksi ke satu DES). **Klien HARUS dikonfigurasi untuk memvalidasi CA server** — dan pengguna tidak boleh diizinkan mengeklik "trust" pada sertifikat yang tidak dikenal.

> [!TIP]
> **EAP-TLS adalah pilihan terbaik** karena memakai sertifikat di kedua sisi — tidak ada password yang bisa dicuri atau ditebak. Biayanya: perlu PKI dan proses penyediaan sertifikat ke setiap perangkat (biasanya lewat MDM).

### Manfaat 802.1X di luar keamanan

```
- VLAN dinamis berdasarkan identitas pengguna
- dACL (downloadable ACL) per pengguna
- Akses berbasis waktu dan lokasi
- Audit trail: siapa terhubung, kapan, dari mana
- Cabut akses satu pengguna tanpa memengaruhi yang lain
```

---

## 6. Serangan Wireless dan Mitigasi

### Deauthentication Attack

```
Penyerang mengirim frame DEAUTH palsu (management frame TIDAK terenkripsi di WPA2)
→ Klien terputus paksa
→ Dipakai untuk: DoS, memaksa reconnect agar handshake tertangkap,
                 memaksa klien pindah ke evil twin
```

**Mitigasi:** **802.11w / PMF (Protected Management Frames)** — mengenkripsi dan mengautentikasi management frame.
```
WPA2: PMF opsional  → aktifkan!
WPA3: PMF WAJIB     ✅
```

```
# MikroTik
/interface wireless security-profiles set default management-protection=required
```

### Evil Twin / Rogue AP

```
Penyerang mendirikan AP dengan SSID yang SAMA dan sinyal lebih kuat
→ Klien terhubung ke penyerang
→ MITM penuh: semua trafik lewat penyerang
```

> [!WARNING]
> **Sangat efektif** karena klien memilih AP berdasarkan kekuatan sinyal, dan sebagian besar pengguna tidak memeriksa apa pun.

**Mitigasi:**
```
- 802.1X dengan validasi sertifikat server (klien menolak RADIUS palsu)
- WPA3-SAE (autentikasi mutual)
- WIPS (Wireless IPS) untuk mendeteksi dan menetralkan rogue AP
- Edukasi pengguna: jangan sambungkan ke SSID publik tanpa VPN
```

### Rogue AP internal (tidak disengaja)

Karyawan menancapkan router Wi-Fi rumahan ke port jaringan kantor.

**Mitigasi:**
```
- 802.1X pada port kabel (perangkat tidak sah tidak bisa terhubung sama sekali)
- Port security
- Rogue AP detection di WLC/controller
- Scanning berkala dengan sensor WIPS
```

### WPS Attack

**WPS** (Wi-Fi Protected Setup) dengan PIN 8 digit punya kelemahan desain: PIN divalidasi dalam dua bagian terpisah, sehingga ruang pencarian turun dari 10⁸ menjadi **11.000** — dapat dipecahkan dalam beberapa jam.

> [!WARNING]
> **MATIKAN WPS.** Selalu. Tidak ada alasan memakainya.

### PMKID Attack

Penyerang meminta PMKID dari AP dan melakukan brute force offline — **tanpa perlu menunggu klien melakukan handshake**.

**Mitigasi:** WPA3-SAE, atau passphrase yang sangat kuat (≥ 20 karakter acak).

### Karma / Preferred Network List Attack

Perangkat mengirim Probe Request untuk semua SSID yang pernah disimpan. Penyerang menjawab "ya, saya SSID itu" untuk apa pun yang diminta.

**Mitigasi:**
```
- Hapus jaringan tersimpan yang tidak dipakai
- JANGAN pakai hidden SSID (memaksa probe aktif)
- Matikan auto-connect ke jaringan open
- 802.1X (klien memverifikasi server)
```

### Jamming

Membanjiri kanal dengan noise. **Tidak bisa dicegah secara teknis** — hanya bisa dideteksi (spectrum analyzer) dan dilaporkan ke otoritas.

---

## 7. Jaringan Tamu

Ini kebutuhan yang hampir selalu ada dan sering salah dikonfigurasi.

```
Prinsip:
1. VLAN TERPISAH dari jaringan internal
2. Isolasi klien (guest tidak bisa saling melihat)
3. Firewall: HANYA ke internet, TIDAK ke LAN internal
4. Rate limit per klien
5. Enkripsi — pakai OWE atau WPA2/WPA3 dengan passphrase yang dirotasi
6. Captive portal dengan syarat & ketentuan (untuk kepatuhan hukum)
7. Batas waktu sesi
8. Logging untuk kepatuhan
```

> [!WARNING]
> **Kesalahan paling umum: tamu bisa mencapai LAN internal.** Selalu verifikasi dengan mencoba akses dari perangkat tamu ke server internal.

```
# MikroTik — jaringan tamu lengkap
/interface bridge port set [find interface=wlan-guest] horizon=1   ← isolasi klien
/ip firewall filter
add chain=forward in-interface-list=TAMU out-interface-list=WAN action=accept
add chain=forward in-interface-list=TAMU action=drop comment="Tamu HANYA ke internet"
/queue simple add name=limit-tamu target=192.168.30.0/24 max-limit=10M/10M
```

---

## 8. Konfigurasi

### MikroTik (RouterOS v6: wireless)

```
# WPA2-PSK
/interface wireless security-profiles
add name=wpa2-kantor mode=dynamic-keys authentication-types=wpa2-psk \
    unicast-ciphers=aes-ccm group-ciphers=aes-ccm \
    wpa2-pre-shared-key="PassphraseYangSangatPanjangDanAcak" \
    management-protection=required

/interface wireless set wlan1 ssid=KANTOR security-profile=wpa2-kantor \
    band=5ghz-a/n/ac channel-width=20/40mhz-Ce frequency=auto \
    wireless-protocol=802.11 country=indonesia

# WPA2-Enterprise (802.1X)
/interface wireless security-profiles
add name=dot1x-kantor mode=dynamic-keys authentication-types=wpa2-eap \
    unicast-ciphers=aes-ccm group-ciphers=aes-ccm \
    eap-methods=passthrough management-protection=required

/radius add service=wireless address=192.168.99.50 secret=RahasiaRadius \
    authentication-port=1812 accounting-port=1813

# Isolasi klien
/interface wireless set wlan1 default-forwarding=no
```

### MikroTik (RouterOS v7: wifi)

```
/interface wifi security
add name=wpa3-kantor authentication-types=wpa2-psk,wpa3-psk \
    passphrase="PassphraseYangSangatPanjang" \
    management-protection=required ft=yes ft-over-ds=yes

/interface wifi configuration
add name=cfg-kantor ssid=KANTOR security=wpa3-kantor country=Indonesia

/interface wifi set wifi1 configuration=cfg-kantor
```

### Cisco WLC (konsep GUI: topik CCNA 2.9)

```
WLANs → Create New
  Profile Name : KANTOR
  SSID         : KANTOR
  ID           : 1

General tab:
  Status              : Enabled
  Broadcast SSID      : Enabled
  Interface/VLAN      : vlan10-staff
  Radio Policy        : 802.11a/n/ac (5 GHz saja)

Security → Layer 2:
  Layer 2 Security    : WPA+WPA2
  WPA2 Policy         : Enabled
  WPA2 Encryption     : AES
  Auth Key Mgmt       : PSK (atau 802.1X)
  PSK Format          : ASCII
  PMF                 : Required
  Fast Transition     : Enabled (802.11r)

Security → AAA Servers (untuk 802.1X):
  Authentication Server 1 : 192.168.99.50

QoS tab:
  Quality of Service  : Platinum (untuk voice) / Silver (data)
  WMM Policy          : Required

Advanced tab:
  Client Exclusion    : Enabled, 60s
  P2P Blocking Action : Drop        ← isolasi klien
  Client Band Select  : Enabled     ← dorong klien ke 5 GHz
  Session Timeout     : 1800
  Aironet IE          : Disabled
  Coverage Hole Detection : Enabled
```

> [!WARNING]
> **Topik CCNA 2.9 secara eksplisit menguji kemampuan menafsirkan konfigurasi WLAN GUI ini** — pelajari nama field dan artinya.

---

## 9. Praktik Terbaik

```
✅ WPA3 kalau semua klien mendukung; WPA2/WPA3 transition selama migrasi
✅ Passphrase minimal 20 karakter acak untuk PSK
✅ 802.1X (EAP-TLS lebih baik daripada PEAP) untuk korporat
✅ PMF (802.11w) — required di WPA3, aktifkan di WPA2
✅ Matikan WPS SELALU
✅ Matikan WEP, WPA/TKIP
✅ VLAN terpisah untuk tamu, IoT, dan korporat
✅ Client isolation di jaringan tamu dan IoT
✅ Rotasi PSK tamu secara berkala
✅ WIPS untuk deteksi rogue AP
✅ Nonaktifkan SSID yang tidak dipakai (setiap SSID memakan airtime!)
✅ Batasi jumlah SSID maksimal 3–4
✅ 802.11k/v/r untuk roaming
✅ Logging dan monitoring
```

```
❌ JANGAN pakai hidden SSID sebagai "keamanan"
❌ JANGAN pakai MAC filtering sebagai kontrol utama (MAC mudah dipalsukan)
❌ JANGAN pakai WEP/WPA/TKIP
❌ JANGAN biarkan WPS aktif
❌ JANGAN pakai PSK yang sama bertahun-tahun untuk korporat
❌ JANGAN izinkan tamu mencapai LAN internal
❌ JANGAN buat 8 SSID (setiap SSID mengirim beacon 10×/detik → boros airtime)
```

> [!WARNING]
> **Setiap SSID tambahan memakan airtime.** Dengan 8 SSID dan 3 AP di kanal yang sama, beacon saja bisa memakan 20–30% airtime sebelum ada data apa pun yang dikirim. **Maksimal 3–4 SSID per band.**

---

## 10. Ringkasan

- Wireless berbeda karena **sinyal menyebar tanpa batas fisik** — enkripsi wajib.
- **WEP rusak total** (dipecahkan dalam menit). **WPA/TKIP usang**. **WPA2-AES** masih dipakai tetapi rentan offline dictionary attack, KRACK, dan PMKID.
- **WPA3-SAE** menghilangkan offline dictionary attack dan memberi **forward secrecy**. **PMF wajib**.
- **OWE (Enhanced Open)** memberi enkripsi tanpa password — pilihan yang benar untuk hotspot publik.
- **6 GHz wajib WPA3** — tidak boleh open, WPA2, atau transition mode.
- **4-way handshake** menurunkan PTK (per klien) dan GTK (bersama, untuk broadcast).
- **802.1X/EAP** memberi kredensial per pengguna. **EAP-TLS terbaik**; **PEAP rentan bila klien tidak memvalidasi sertifikat server**.
- Serangan utama: **deauth** (mitigasi: PMF), **evil twin** (mitigasi: 802.1X + validasi sertifikat, WIPS), **WPS** (matikan), **PMKID** (mitigasi: WPA3), **Karma** (mitigasi: jangan hidden SSID, hapus jaringan tersimpan).
- **Hidden SSID dan MAC filtering bukan keamanan.**
- Jaringan tamu: VLAN terpisah + isolasi klien + firewall ke internet saja + rate limit + logging.
- **Batasi jumlah SSID (maks 3-4)** — setiap SSID memakan airtime.

---

## 11. Latihan

1. Kenapa WEP bisa dipecahkan dalam hitungan menit?
2. Jelaskan mengapa WPA3-SAE menghilangkan serangan dictionary offline.
3. Apa itu PMF dan serangan apa yang dicegahnya?
4. Seorang penyerang mendirikan AP dengan SSID yang sama dan sinyal lebih kuat. Sebutkan tiga mitigasi.
5. Kenapa PEAP-MSCHAPv2 bisa berbahaya, dan bagaimana mengamankannya?
6. Rancang konfigurasi keamanan untuk jaringan tamu di hotel.
7. Sebuah kantor punya 8 SSID di setiap AP. Apa masalahnya?
8. Kapan memakai OWE dan apa keterbatasannya?

<details>
<summary>Jawaban</summary>

1. Karena beberapa kelemahan desain yang saling memperkuat: (a) **IV hanya 24 bit**, sehingga berulang setelah ~5.000 paket pada jaringan sibuk — dan IV dikirim dalam plaintext, memungkinkan penyerang mengumpulkan pasangan IV/ciphertext; (b) **RC4 punya kelemahan statistik** pada byte awal keystream (serangan FMS/PTW) yang memungkinkan pemulihan kunci dari IV yang cukup banyak; (c) **CRC-32 bersifat linear**, sehingga penyerang bisa memodifikasi paket dan menyesuaikan checksum tanpa mengetahui kunci — memungkinkan serangan injeksi untuk **mempercepat** pengumpulan IV; (d) **kunci statis** tidak pernah dirotasi. Dengan `aireplay-ng` untuk injeksi dan `aircrack-ng` untuk analisis, kunci WEP 104-bit dipecahkan dalam **2-10 menit**.

2. Pada **WPA2-PSK**, penyerang cukup menangkap **4-way handshake** (satu kali, bisa dipaksa dengan deauth) yang berisi MIC. Dari situ ia dapat menghitung apakah sebuah tebakan passphrase menghasilkan MIC yang sama — **seluruhnya secara offline**, di komputernya sendiri, dengan GPU yang menguji miliaran tebakan per detik. AP tidak pernah tahu.
   **WPA3-SAE** memakai pertukaran Dragonfly berbasis kurva eliptik di mana setiap percobaan autentikasi **harus dilakukan secara interaktif dengan AP**. Material yang ditangkap penyerang tidak memungkinkan verifikasi tebakan secara offline. Akibatnya, penyerang hanya bisa mencoba satu tebakan per interaksi — sehingga **rate limiting dan deteksi di AP menjadi efektif**. SAE juga memberikan **forward secrecy**: passphrase yang bocor kemudian tidak membuka trafik yang direkam sebelumnya.

3. **PMF (Protected Management Frames, IEEE 802.11w)** mengenkripsi dan mengautentikasi **management frame** — yang pada WPA2 biasa dikirim dalam plaintext tanpa autentikasi.
   Serangan yang dicegahnya terutama **deauthentication/disassociation attack**: penyerang mengirim frame deauth palsu dengan MAC address AP yang dipalsukan, memaksa klien terputus. Ini dipakai untuk DoS, untuk memaksa klien melakukan handshake ulang agar dapat ditangkap, dan untuk mendorong klien berpindah ke evil twin.
   Dengan PMF, frame deauth harus diautentikasi dengan kunci sesi — penyerang tanpa kunci tidak bisa memalsukannya. PMF **opsional di WPA2** (aktifkan!) dan **wajib di WPA3**.

4. Ini serangan **evil twin**. Mitigasi: (a) **802.1X dengan validasi sertifikat server** — klien dikonfigurasi untuk hanya mempercayai RADIUS dengan sertifikat dari CA organisasi; AP palsu tidak punya sertifikat itu, sehingga klien menolak terhubung dan autentikasi gagal; (b) **WPA3-SAE** yang memberi **autentikasi mutual** — AP palsu tanpa passphrase yang benar tidak bisa menyelesaikan pertukaran SAE; (c) **WIPS (Wireless IPS)** yang memantau udara, mendeteksi AP dengan SSID organisasi yang bukan milik organisasi, memberi alarm, dan (pada mode agresif) mengirim deauth untuk menetralkannya; (d) tambahan: **edukasi pengguna** agar tidak mengeklik "trust" pada sertifikat yang tidak dikenal, dan memakai **VPN** di jaringan publik.

5. **PEAP-MSCHAPv2 aman hanya jika klien memvalidasi sertifikat server RADIUS.** Kalau tidak divalidasi, penyerang dapat mendirikan AP palsu dengan server RADIUS palsu; klien akan melakukan handshake MSCHAPv2 dengannya dan mengirimkan **challenge/response** berbasis hash NT dari password pengguna. MSCHAPv2 dapat direduksi menjadi tiga operasi DES 56-bit, yang **dapat dipecahkan secara offline dalam hitungan jam** dengan layanan khusus — memberi penyerang password domain pengguna.
   **Pengamanannya:** (a) konfigurasikan klien untuk **memvalidasi sertifikat server** dan menyebutkan **nama CA yang tepat**, bukan sekadar "validate"; (b) sebutkan **nama server RADIUS** yang diharapkan; (c) **larang pengguna mengeklik "trust"** pada sertifikat baru — terapkan lewat Group Policy/MDM agar pengaturan tidak bisa diubah; (d) lebih baik lagi: **beralih ke EAP-TLS** yang memakai sertifikat klien sehingga tidak ada password untuk dicuri.

6. Konfigurasi jaringan tamu hotel:
   ```
   SSID          : HOTEL-GUEST
   Keamanan      : OWE (Enhanced Open) — enkripsi tanpa password
                   ATAU WPA2/WPA3 dengan passphrase yang dirotasi harian
   VLAN          : terpisah total dari jaringan operasional hotel
   Client isolation : AKTIF (tamu tidak bisa saling melihat)
   Firewall      : HANYA ke internet; TOLAK semua ke LAN internal, PMS, CCTV
   Captive portal: syarat & ketentuan + nomor kamar/kode untuk kepatuhan hukum
   Rate limit    : mis. 10 Mbps per perangkat, dengan burst
   Session timeout: 8–24 jam, idle timeout 30 menit
   Batas perangkat: 3–4 per kamar
   DNS           : resolver hotel dengan filtering malware
   Logging       : catat MAC, waktu, dan alamat yang diakses (wajib di banyak yurisdiksi)
   Band steering : dorong ke 5 GHz
   Maksimal SSID : 1 untuk tamu (jangan buat terpisah per band)
   ```
   **Perhatian:** Verifikasi secara aktif bahwa perangkat tamu **tidak bisa** menjangkau sistem PMS, POS, CCTV, atau jaringan staf — ini pelanggaran paling umum dan paling berbahaya di hotel.

7. **Setiap SSID mengirim beacon frame ~10 kali per detik pada rate dasar (rendah)**, dan setiap beacon memakan airtime. Dengan 8 SSID:
   - 80 beacon/detik per AP per band
   - Beacon dikirim pada rate rendah (mis. 6 Mbps) agar semua klien bisa membacanya, sehingga memakan airtime jauh lebih lama daripada data
   - Dengan beberapa AP di kanal yang sama, beacon saja bisa memakan **20-30% airtime** sebelum ada data apa pun
   - Setiap SSID juga menambah beban probe response, dan memperbesar kemungkinan klien memilih SSID yang salah
   **Perbaikan:** kurangi menjadi **maksimal 3-4 SSID per band**. Gunakan **VLAN dinamis lewat 802.1X** untuk memisahkan kelompok pengguna dalam satu SSID, alih-alih membuat SSID terpisah untuk setiap departemen.

8. **OWE (Opportunistic Wireless Encryption, RFC 8110)** dipakai untuk **jaringan publik yang tidak memerlukan password**: kafe, hotel, bandara, ruang publik. Ia memberikan **enkripsi per-klien** lewat pertukaran Diffie-Hellman, sehingga trafik tidak lagi plaintext — pengalaman pengguna tetap sama (tidak perlu memasukkan apa pun), tetapi penyadap di sekitar tidak bisa membaca trafik.
   **Keterbatasannya:** OWE **tidak mengautentikasi AP**. Karena tidak ada kredensial bersama, klien tidak bisa memverifikasi bahwa AP yang ia hubungi adalah yang sah — sehingga **evil twin tetap mungkin**. Penyerang bisa mendirikan AP OWE dengan SSID yang sama dan melakukan MITM.
   Karena itu OWE adalah **peningkatan besar dibanding open biasa**, tetapi bukan pengganti WPA3-SAE atau 802.1X. Untuk jaringan publik, kombinasikan dengan saran agar pengguna memakai VPN untuk data sensitif.

</details>

---

## 12. Sumber

- IEEE 802.11i (WPA2), 802.11w (PMF)
- Wi-Fi Alliance — WPA3 Specification
- RFC 8110 — Opportunistic Wireless Encryption
- Vanhoef & Piessens (2017) — *Key Reinstallation Attacks* (KRACK)
- Vanhoef & Ronen (2020) — *Dragonblood* (analisis WPA3)
- NIST SP 800-153 — Guidelines for Securing WLANs
- Cisco CCNA 200-301 v1.1, topik 5.9 (WPA, WPA2, WPA3) dan 5.10 (configure WLAN dengan WPA2 PSK via GUI)

---

**Berikutnya:** `10-wireless/04-desain-wlan.md`. Arsitektur dan perencanaan WLAN.

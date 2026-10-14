# 06.4 — TLS, Sertifikat, dan PKI

> **Prasyarat:** `06-aplikasi/03`, `05-transport/02`
> **Tujuan:** Anda paham dasar kriptografi yang relevan, bisa membaca sertifikat, mendiagnosis error TLS, dan memahami implikasi TLS inspection.

---

## 1. Kriptografi Dasar yang Perlu Anda Tahu

Tidak perlu menjadi kriptografer, tetapi Anda harus memahami empat blok bangunan ini.

### Enkripsi Simetris

Satu kunci yang sama untuk mengenkripsi dan mendekripsi.

```
Plaintext + Kunci K → Ciphertext
Ciphertext + Kunci K → Plaintext
```

- **Cepat** — bisa mengenkripsi gigabytes per detik (dengan AES-NI di CPU modern).
- **Masalah:** bagaimana kedua pihak menyepakati kunci K tanpa ada yang menyadapnya?

Algoritma: **AES** (128/256 bit), **ChaCha20**.

### Enkripsi Asimetris (Kunci Publik)

Sepasang kunci: **publik** (boleh disebar) dan **privat** (dirahasiakan).

```
Enkripsi dengan kunci PUBLIK → hanya kunci PRIVAT yang bisa membuka
Tanda tangan dengan kunci PRIVAT → siapa pun bisa verifikasi dengan kunci PUBLIK
```

- **Lambat** — ribuan kali lebih lambat daripada simetris.
- Dipakai untuk: pertukaran kunci dan tanda tangan digital, **bukan** untuk mengenkripsi data besar.

Algoritma: **RSA** (2048/4096 bit), **ECDSA** (P-256/P-384), **Ed25519**.

💡 **TLS memakai keduanya:** asimetris untuk menyepakati kunci sesi, lalu simetris untuk data. Ini disebut *hybrid cryptosystem*.

### Hash

Fungsi satu arah yang mengubah input apa pun menjadi output berukuran tetap.

```
SHA-256("halo") = 5eb63bbbe01eeed093cb22bb8f5acdc3...  (selalu 256 bit)
```

Sifat: satu arah (tidak bisa dibalik), deterministik, perubahan 1 bit input mengubah output total (*avalanche effect*), tahan tabrakan.

Algoritma: **SHA-256/384/512**, SHA-3. ⚠️ **MD5 dan SHA-1 sudah rusak** — jangan dipakai untuk keamanan.

### HMAC dan AEAD

- **HMAC** — hash dengan kunci; membuktikan pesan tidak diubah **dan** berasal dari pemegang kunci.
- **AEAD** (*Authenticated Encryption with Associated Data*) — mengenkripsi **dan** mengautentikasi dalam satu operasi. Contoh: **AES-GCM**, **ChaCha20-Poly1305**.

💡 TLS 1.3 **hanya mengizinkan AEAD** — menghilangkan seluruh kelas kerentanan yang berasal dari kombinasi enkripsi dan MAC yang salah.

### Diffie-Hellman dan Forward Secrecy

**Diffie-Hellman** memungkinkan dua pihak menyepakati kunci rahasia bersama **melalui saluran publik**, tanpa pernah mengirimkan kuncinya.

```
Alice punya rahasia a, Bob punya rahasia b
Alice mengirim g^a mod p (publik)
Bob mengirim g^b mod p (publik)
Keduanya menghitung g^(ab) mod p = kunci bersama
Penyadap melihat g^a dan g^b, tetapi tidak bisa menghitung g^(ab)
```

**Ephemeral DH (DHE/ECDHE)** — kunci DH baru untuk **setiap sesi**, lalu dibuang.

Ini memberi **Perfect Forward Secrecy (PFS)**:
> Kalau kunci privat server dicuri **besok**, penyerang **tidak bisa** mendekripsi trafik yang direkam **hari ini** — karena kunci sesinya sudah dibuang dan tidak pernah diturunkan dari kunci privat server.

⚠️ Ini alasan penting mengapa cipher suite tanpa forward secrecy (RSA key exchange) sudah dihapus dari TLS 1.3.

---

## 2. TLS Handshake

### TLS 1.3 (RFC 8446) — 1 RTT

```
Klien                                          Server
  │                                              │
  │ ClientHello                                  │
  │  - versi yang didukung                       │
  │  - cipher suites                             │
  │  - SNI: "example.com"                        │
  │  - key_share (tebakan ECDHE)                 │
  │  - ALPN: h2, http/1.1                        │
  │─────────────────────────────────────────────►│
  │                                              │
  │ ServerHello                                  │
  │  - cipher suite yang dipilih                 │
  │  - key_share server                          │
  │ {EncryptedExtensions}                        │
  │ {Certificate}          ← SUDAH TERENKRIPSI   │
  │ {CertificateVerify}                          │
  │ {Finished}                                   │
  │◄─────────────────────────────────────────────│
  │                                              │
  │ {Finished}                                   │
  │ {Application Data}     ← data bisa langsung  │
  │─────────────────────────────────────────────►│
```

**Perbaikan TLS 1.3 dibanding 1.2:**
1. **1 RTT** (bukan 2) — klien menebak parameter kunci di ClientHello
2. **0-RTT** untuk koneksi berulang (dengan risiko replay)
3. **Sertifikat dienkripsi** — penyadap tidak melihat identitas server (kecuali SNI)
4. **Hanya AEAD** — cipher lemah dihapus total
5. **Forward secrecy wajib** — tidak ada lagi RSA key exchange
6. **Cipher suite disederhanakan** dari puluhan menjadi 5

### TLS 1.2 — 2 RTT
```
ClientHello → ServerHello + Certificate + ServerKeyExchange + ServerHelloDone
→ ClientKeyExchange + ChangeCipherSpec + Finished
→ ChangeCipherSpec + Finished
→ baru Application Data
```

### Cipher Suite

**TLS 1.2:**
```
TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
 │    │     │        │          │
 │    │     │        │          └── hash untuk PRF/HMAC
 │    │     │        └── enkripsi simetris + mode
 │    │     └── algoritma autentikasi (sertifikat server)
 │    └── pertukaran kunci (ECDHE = ephemeral → forward secrecy ✅)
 └── protokol
```

**TLS 1.3** (jauh lebih sederhana — hanya AEAD + hash):
```
TLS_AES_256_GCM_SHA384
TLS_AES_128_GCM_SHA256
TLS_CHACHA20_POLY1305_SHA256
TLS_AES_128_CCM_SHA256
TLS_AES_128_CCM_8_SHA256
```

⚠️ **Yang harus dinonaktifkan:**
```
SSLv2, SSLv3          ← rusak total (POODLE)
TLS 1.0, TLS 1.1      ← usang; PCI DSS melarang
RC4, DES, 3DES        ← lemah
MD5, SHA-1            ← rusak
Cipher NULL / EXPORT  ← tanpa enkripsi nyata
RSA key exchange      ← tidak punya forward secrecy
CBC mode (TLS 1.2)    ← rentan berbagai serangan (Lucky13, dll)
```

**Minimum yang direkomendasikan hari ini: TLS 1.2 dengan cipher AEAD + ECDHE, dan TLS 1.3.**

### Ekstensi penting

| Ekstensi | Fungsi |
|---|---|
| **SNI** (*Server Name Indication*) | Nama host di ClientHello → satu IP bisa melayani banyak sertifikat |
| **ALPN** | Negosiasi protokol aplikasi (h2, http/1.1, h3) dalam handshake |
| **ECH** (*Encrypted Client Hello*) | Mengenkripsi SNI — menghilangkan kebocoran nama host |
| **OCSP stapling** | Server melampirkan bukti sertifikat masih valid |
| **Session resumption** | PSK/session ticket → handshake lebih cepat |

⚠️ **SNI dikirim dalam plaintext** (kecuali dengan ECH). Karena itu firewall dan ISP bisa melihat situs apa yang Anda kunjungi walaupun isinya terenkripsi — dan inilah dasar pemblokiran berbasis SNI. **ECH** mengubah ini, dan sedang menimbulkan diskusi besar di kalangan operator jaringan.

---

## 3. Sertifikat X.509

Sertifikat mengikat **identitas** (nama domain) ke **kunci publik**, ditandatangani oleh pihak yang dipercaya (**CA**).

### Isi sertifikat

```bash
$ openssl x509 -in cert.pem -noout -text
```

```
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: 03:8f:2a:...
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: C=US, O=Let's Encrypt, CN=R3            ← siapa yang menandatangani
        Validity
            Not Before: Jul 15 00:00:00 2026 GMT
            Not After : Oct 13 23:59:59 2026 GMT        ← masa berlaku
        Subject: CN=example.com                          ← untuk siapa
        Subject Public Key Info:
            Public Key Algorithm: id-ecPublicKey
                Public-Key: (256 bit)
        X509v3 extensions:
            X509v3 Subject Alternative Name:             ← SAN — YANG SEBENARNYA DIPERIKSA
                DNS:example.com, DNS:www.example.com
            X509v3 Key Usage: critical
                Digital Signature
            X509v3 Extended Key Usage:
                TLS Web Server Authentication
            X509v3 Basic Constraints: critical
                CA:FALSE
            Authority Information Access:
                OCSP - URI:http://r3.o.lencr.org
```

⚠️ **Browser modern mengabaikan field CN dan hanya memeriksa SAN.** Sertifikat tanpa SAN akan ditolak, walaupun CN-nya benar. Ini kesalahan yang masih sering terjadi pada sertifikat internal yang dibuat manual.

### Chain of Trust

```
Root CA                    ← self-signed, kunci publiknya ada di trust store OS/browser
  │ menandatangani
  ▼
Intermediate CA            ← dikirim server bersama sertifikatnya
  │ menandatangani
  ▼
Server certificate         ← untuk example.com
```

**Kenapa ada intermediate?** Kunci privat root CA disimpan **offline** di HSM dalam brankas — sangat aman tetapi tidak praktis untuk penandatanganan harian. Intermediate menjadi perantara yang bisa dicabut kalau bocor, tanpa harus mencabut root.

⚠️ **Kesalahan konfigurasi paling umum: intermediate certificate tidak dikirim.** Gejalanya menipu:
```
✅ Berfungsi di browser desktop (yang punya cache intermediate dari kunjungan lain)
❌ Gagal di ponsel, aplikasi mobile, curl, Java, dan skrip
```

Selalu kirimkan **fullchain** (server cert + intermediate), tetapi **jangan** kirim root cert (klien sudah punya, dan mengirimnya hanya memboroskan bandwidth handshake).

```bash
# Uji apakah chain lengkap (dari mesin lain, bukan yang punya cache)
$ openssl s_client -connect example.com:443 -showcerts </dev/null
$ curl -v https://example.com          # perhatikan pesan verifikasi
```

### Jenis sertifikat berdasarkan validasi

| Jenis | Yang diverifikasi | Waktu terbit | Catatan |
|---|---|---|---|
| **DV** (Domain Validated) | Kontrol atas domain | Menit | Let's Encrypt; cukup untuk sebagian besar kasus |
| **OV** (Organization Validated) | Domain + keberadaan organisasi | Hari | Info organisasi tercantum |
| **EV** (Extended Validation) | Verifikasi hukum menyeluruh | Minggu | Browser **tidak lagi** menampilkan bilah hijau |

💡 **DV sudah cukup untuk enkripsi.** EV tidak memberi keamanan kriptografis tambahan; nilainya semata reputasi, dan browser sudah menghapus indikator visualnya.

### Jenis berdasarkan cakupan

```
Single domain : example.com
Wildcard      : *.example.com  ← hanya SATU tingkat: sub.example.com ✅,
                                  a.b.example.com ❌
Multi-domain  : SAN berisi beberapa nama berbeda
```

---

## 4. PKI dan ACME

### Alur penerbitan sertifikat

```
1. Buat KEY PAIR (privat + publik)
2. Buat CSR (Certificate Signing Request) berisi:
   - kunci publik
   - nama domain
   - info organisasi
   - ditandatangani dengan kunci privat (membuktikan kepemilikan)
3. Kirim CSR ke CA
4. CA memvalidasi kepemilikan domain
5. CA menandatangani → sertifikat
6. Pasang sertifikat + intermediate di server
   (kunci privat TIDAK PERNAH meninggalkan server)
```

```bash
# Buat kunci privat dan CSR
$ openssl req -new -newkey rsa:2048 -nodes \
    -keyout example.key -out example.csr \
    -subj "/CN=example.com/O=Perusahaan/C=ID" \
    -addext "subjectAltName=DNS:example.com,DNS:www.example.com"

# Periksa CSR
$ openssl req -in example.csr -noout -text

# Self-signed (untuk lab/internal)
$ openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
    -keyout self.key -out self.crt \
    -subj "/CN=lab.internal" \
    -addext "subjectAltName=DNS:lab.internal,IP:192.168.1.10"
```

### ACME dan Let's Encrypt

**ACME** [RFC 8555] mengotomasi seluruh proses. Sertifikat gratis, berlaku 90 hari, diperbarui otomatis.

```bash
# certbot (standalone)
$ sudo certbot certonly --standalone -d example.com -d www.example.com

# certbot dengan nginx
$ sudo certbot --nginx -d example.com

# DNS-01 challenge (bisa untuk wildcard, dan server tidak perlu terekspos)
$ sudo certbot certonly --manual --preferred-challenges dns \
    -d "*.example.com" -d example.com

# Perbarui semua (biasanya sudah otomatis lewat systemd timer)
$ sudo certbot renew --dry-run
```

**Jenis challenge ACME:**
| Challenge | Cara membuktikan | Catatan |
|---|---|---|
| **HTTP-01** | File di `/.well-known/acme-challenge/` | Butuh port 80 terbuka; tidak bisa wildcard |
| **DNS-01** | TXT record `_acme-challenge.example.com` | **Bisa wildcard**; server tidak perlu terekspos |
| **TLS-ALPN-01** | Respons TLS khusus di port 443 | Tidak butuh port 80 |

💡 **Masa berlaku 90 hari disengaja** — memaksa otomasi. Sertifikat yang diperbarui manual pasti akan terlupa suatu hari. Industri bergerak ke masa berlaku lebih pendek lagi (rencana 47 hari pada 2029).

### Revocation

Bagaimana membatalkan sertifikat yang kunci privatnya bocor?

| Mekanisme | Cara kerja | Masalah |
|---|---|---|
| **CRL** (Certificate Revocation List) | Daftar serial yang dicabut, diunduh klien | Besar, jarang diperbarui |
| **OCSP** | Klien bertanya ke CA per sertifikat | Lambat, bocor privasi (CA tahu situs yang Anda kunjungi) |
| **OCSP Stapling** | **Server** melampirkan bukti OCSP terbaru | ✅ Cepat, tidak bocor privasi |
| **CRLite / CRLSets** | Browser menyematkan ringkasan kompak | Dipakai Firefox/Chrome |
| **Short-lived certs** | Sertifikat berumur pendek → tidak perlu revocation | Arah masa depan |

⚠️ **Revocation pada dasarnya rapuh.** Banyak klien melakukan *soft-fail*: kalau pengecekan OCSP gagal, mereka tetap melanjutkan koneksi — sehingga penyerang yang bisa memblokir OCSP bisa memakai sertifikat yang sudah dicabut. Inilah alasan industri beralih ke **sertifikat berumur pendek**.

```nginx
# Aktifkan OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/ssl/certs/chain.pem;
resolver 1.1.1.1 8.8.8.8 valid=300s;
```

### mTLS (Mutual TLS)

Kedua pihak menunjukkan sertifikat — **server memverifikasi klien juga**.

```
Klien → sertifikat klien → Server memverifikasi
Server → sertifikat server → Klien memverifikasi
```

Dipakai di: arsitektur zero trust, service mesh (Istio/Linkerd), API antar-layanan, VPN, dan autentikasi perangkat jaringan.

```nginx
ssl_client_certificate /etc/ssl/certs/client-ca.pem;
ssl_verify_client on;
ssl_verify_depth 2;
```

### Certificate Pinning

Aplikasi menyematkan sertifikat/kunci publik tertentu dan menolak yang lain — bahkan jika ditandatangani CA yang sah.

⚠️ **Berisiko:** kalau kunci berubah (rotasi, insiden) dan aplikasi belum diperbarui, layanan **mati total**. HPKP (versi HTTP header) sudah **dihapus** dari browser karena terlalu berbahaya. Pinning masih dipakai di aplikasi mobile dengan mekanisme cadangan yang hati-hati.

---

## 5. Membaca dan Mendiagnosis Error TLS

### Tabel error → penyebab → perbaikan

| Error | Penyebab | Perbaikan |
|---|---|---|
| `certificate has expired` | Sertifikat kedaluwarsa | Perbarui; **otomasikan** dengan ACME |
| `unable to get local issuer certificate` | **Intermediate tidak dikirim** server, atau root tidak dipercaya klien | Kirim fullchain; pasang CA internal di trust store klien |
| `hostname mismatch` / `NET::ERR_CERT_COMMON_NAME_INVALID` | Nama di **SAN** tidak cocok dengan yang diakses | Terbitkan ulang dengan SAN yang benar |
| `self signed certificate` | Sertifikat self-signed | Pakai CA yang dipercaya, atau pasang CA internal di klien |
| `certificate is not yet valid` | **Jam sistem salah** | Perbaiki NTP |
| `handshake failure` / `no cipher overlap` | Tidak ada cipher/versi TLS yang sama | Sesuaikan versi & cipher di kedua sisi |
| `ERR_SSL_PROTOCOL_ERROR` | Versi TLS tidak didukung; middlebox merusak handshake | Cek versi minimum; cek TLS inspection |
| `revoked` | Sertifikat dicabut | Terbitkan baru; selidiki mengapa dicabut |
| Timeout saat handshake | Port 443 diblokir; MTU/fragmentasi | Cek firewall dan MTU |

⚠️ **"Certificate is not yet valid" hampir selalu berarti jam sistem salah.** Ini sangat sering terjadi pada perangkat embedded, VM yang baru di-restore, dan perangkat jaringan yang kehilangan NTP. Periksa waktu **sebelum** menyalahkan sertifikat.

### Perintah diagnostik

```bash
# Handshake lengkap
$ openssl s_client -connect example.com:443 -servername example.com

# Dengan chain lengkap
$ openssl s_client -connect example.com:443 -showcerts </dev/null

# Uji versi TLS tertentu
$ openssl s_client -connect example.com:443 -tls1_2
$ openssl s_client -connect example.com:443 -tls1_3
$ openssl s_client -connect example.com:443 -tls1_1   # harus GAGAL

# Lihat isi sertifikat dari server
$ echo | openssl s_client -connect example.com:443 2>/dev/null \
    | openssl x509 -noout -text

# Cek tanggal kedaluwarsa saja
$ echo | openssl s_client -connect example.com:443 2>/dev/null \
    | openssl x509 -noout -dates
notBefore=Jul 15 00:00:00 2026 GMT
notAfter=Oct 13 23:59:59 2026 GMT

# Cek SAN
$ echo | openssl s_client -connect example.com:443 2>/dev/null \
    | openssl x509 -noout -ext subjectAltName

# Periksa file sertifikat lokal
$ openssl x509 -in cert.pem -noout -subject -issuer -dates -ext subjectAltName

# Verifikasi kunci privat cocok dengan sertifikat (hash harus SAMA)
$ openssl x509 -noout -modulus -in cert.pem | openssl md5
$ openssl rsa  -noout -modulus -in key.pem  | openssl md5

# Uji chain terhadap CA bundle
$ openssl verify -CAfile chain.pem cert.pem

# curl
$ curl -v https://example.com
$ curl --cacert /path/to/ca.pem https://internal.example.com
$ curl -k https://example.com          # ⚠️ abaikan verifikasi — HANYA untuk diagnosis

# Pemindai konfigurasi TLS
$ sslyze example.com
$ testssl.sh example.com
$ nmap --script ssl-enum-ciphers -p 443 example.com
```

### Skrip pemantauan kedaluwarsa

```bash
#!/bin/bash
# Peringatkan sertifikat yang akan kedaluwarsa dalam 30 hari
for host in example.com api.example.com vpn.example.com; do
  exp=$(echo | openssl s_client -connect "$host:443" -servername "$host" 2>/dev/null \
        | openssl x509 -noout -enddate | cut -d= -f2)
  exp_s=$(date -d "$exp" +%s)
  now_s=$(date +%s)
  days=$(( (exp_s - now_s) / 86400 ))
  if [ "$days" -lt 30 ]; then
    echo "PERINGATAN: $host kedaluwarsa dalam $days hari ($exp)"
  else
    echo "OK: $host ($days hari)"
  fi
done
```

---

## 6. TLS Inspection di Jaringan Perusahaan

### Cara kerja

```
[Klien] ──TLS ke firewall──► [Firewall] ──TLS ke server──► [Server]
             ▲                    │
             │              Firewall MENDEKRIPSI,
             │              memeriksa, lalu
             │              MENGENKRIPSI ULANG
             │
    Klien harus mempercayai
    CA internal firewall
```

Firewall menerbitkan sertifikat "palsu" untuk setiap situs, ditandatangani CA internal yang dipasang di semua perangkat perusahaan.

### Alasan sah

- DLP (mencegah kebocoran data)
- Deteksi malware dan C2 dalam trafik terenkripsi
- Kepatuhan regulasi dan audit
- Filtering konten yang akurat

### Masalah dan batasan

⚠️ **1. Melemahkan keamanan.** Firewall menjadi titik tunggal yang melihat **semua** trafik terdekripsi organisasi — target bernilai sangat tinggi.

⚠️ **2. Merusak certificate pinning.** Aplikasi mobile perbankan, Windows Update, banyak aplikasi native akan **gagal total**.

⚠️ **3. Masalah privasi dan hukum.** Trafik perbankan, kesehatan, dan pribadi karyawan ikut terdekripsi. Banyak yurisdiksi mengharuskan pemberitahuan eksplisit dan pengecualian kategori tertentu.

⚠️ **4. QUIC/HTTP3 sering tidak didukung** oleh perangkat inspeksi → harus memblokir UDP/443 agar klien fallback ke TCP.

⚠️ **5. ECH akan menyulitkan lebih jauh** — SNI yang selama ini terlihat akan terenkripsi.

**Praktik yang bertanggung jawab:**
```
- Kecualikan kategori sensitif (perbankan, kesehatan, HR) dari inspeksi
- Beritahu pengguna secara eksplisit dalam kebijakan
- Lindungi kunci CA internal dengan HSM
- Audit siapa yang bisa mengakses trafik terdekripsi
- Bypass aplikasi yang memakai pinning
```

---

## 7. Konfigurasi TLS yang Baik

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Hanya TLS 1.2 dan 1.3
    ssl_protocols TLSv1.2 TLSv1.3;

    # Cipher AEAD dengan forward secrecy
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;      # biarkan klien memilih (TLS 1.3)

    # Session resumption
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;            # ticket tanpa rotasi merusak forward secrecy

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 1.1.1.1 8.8.8.8 valid=300s;

    # HSTS — paksa HTTPS selama 1 tahun
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

💡 Gunakan **Mozilla SSL Configuration Generator** (https://ssl-config.mozilla.org/) untuk konfigurasi yang selalu mutakhir sesuai server dan tingkat kompatibilitas yang Anda butuhkan.

### HSTS

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
Browser akan **menolak** koneksi HTTP ke domain ini selama masa itu — mencegah SSL stripping.

⚠️ **Hati-hati dengan `includeSubDomains` dan `preload`.** Kalau ada subdomain yang belum siap HTTPS, ia akan **tidak bisa diakses**. `preload` sulit dibatalkan (butuh berbulan-bulan).

---

## 8. Ringkasan

- Kripto: **simetris** (cepat, untuk data) + **asimetris** (lambat, untuk pertukaran kunci & tanda tangan) + **hash** + **AEAD**.
- **Ephemeral DH (ECDHE)** memberi **forward secrecy** — kunci privat yang bocor besok tidak membuka trafik hari ini.
- **TLS 1.3**: 1 RTT, sertifikat terenkripsi, hanya AEAD, forward secrecy wajib, 5 cipher suite.
- Nonaktifkan SSLv2/3, TLS 1.0/1.1, RC4/3DES, MD5/SHA-1, dan RSA key exchange.
- **SNI plaintext** memungkinkan pemblokiran berbasis nama host; **ECH** akan mengenkripsinya.
- Sertifikat: **SAN yang diperiksa, bukan CN**. Selalu kirim **fullchain** (server + intermediate), jangan root.
- **Intermediate yang tidak dikirim** menyebabkan gejala menipu: berhasil di browser desktop, gagal di mobile/curl/Java.
- **ACME/Let's Encrypt**: gratis, 90 hari, otomatis. HTTP-01, **DNS-01 (bisa wildcard)**, TLS-ALPN-01.
- Revocation rapuh (soft-fail); **OCSP stapling** mengatasi latency & privasi; arah masa depan adalah sertifikat berumur pendek.
- **"Not yet valid" = jam sistem salah.** Periksa NTP dulu.
- **TLS inspection** memberi visibilitas tetapi melemahkan keamanan, merusak pinning, dan punya implikasi hukum.

---

## 9. Latihan

1. Kenapa TLS memakai kriptografi simetris **dan** asimetris sekaligus?
2. Jelaskan forward secrecy dan mengapa ia penting.
3. Sebuah situs bekerja di Chrome desktop tetapi gagal di aplikasi mobile dan `curl` dengan error "unable to get local issuer certificate". Apa penyebabnya?
4. Sertifikat baru dipasang tetapi browser melapor "certificate is not yet valid". Apa yang Anda periksa pertama?
5. Apa perbedaan HTTP-01 dan DNS-01 challenge ACME, dan kapan Anda harus memakai DNS-01?
6. Kenapa `ssl_session_tickets off` kadang direkomendasikan?
7. Perusahaan menerapkan TLS inspection. Aplikasi mobile banking karyawan berhenti bekerja. Jelaskan penyebab dan solusinya.
8. Anda menerbitkan sertifikat untuk `*.example.com`. Apakah `api.v2.example.com` tercakup?

<details>
<summary>Jawaban</summary>

1. Karena keduanya punya kekuatan yang saling melengkapi. **Asimetris** memecahkan masalah **pertukaran kunci** — dua pihak yang belum pernah bertemu bisa menyepakati rahasia bersama lewat saluran publik, dan bisa memverifikasi identitas lewat tanda tangan. Tetapi asimetris **ribuan kali lebih lambat** sehingga tidak praktis untuk mengenkripsi data besar. **Simetris** sangat cepat (dengan AES-NI bisa gigabytes/detik) tetapi memerlukan kunci bersama yang sudah disepakati. TLS menggabungkan keduanya: asimetris/ECDHE untuk menyepakati kunci sesi, lalu simetris (AES-GCM/ChaCha20) untuk seluruh data.

2. **Forward secrecy** berarti kunci sesi diturunkan dari pertukaran **Diffie-Hellman ephemeral** yang unik untuk setiap sesi dan dibuang setelahnya — tidak pernah diturunkan dari kunci privat jangka panjang server. Akibatnya, jika penyerang merekam trafik terenkripsi hari ini dan **mencuri kunci privat server setahun kemudian**, ia tetap **tidak bisa mendekripsi** rekaman itu. Tanpa forward secrecy (mis. RSA key exchange lama), satu kunci privat yang bocor membuka seluruh riwayat komunikasi. Karena itu TLS 1.3 mewajibkannya.

3. **Server tidak mengirim intermediate certificate.** Chrome desktop berhasil karena ia sudah punya intermediate itu di cache dari kunjungan ke situs lain yang memakai CA yang sama (dan bisa mengambilnya lewat AIA fetching). Klien lain — aplikasi mobile, `curl`, Java, skrip — tidak punya cache itu dan tidak selalu melakukan AIA fetching, sehingga tidak bisa membangun rantai ke root yang dipercaya.
   **Perbaikan:** konfigurasikan server memakai **fullchain** (sertifikat server + intermediate, tanpa root). Verifikasi dengan `openssl s_client -showcerts` dari mesin yang belum pernah mengunjungi situs itu.

4. **Jam sistem klien (atau server).** Error itu berarti waktu saat ini lebih awal daripada `notBefore` di sertifikat. Penyebab paling umum: NTP tidak berjalan, VM baru di-restore dengan jam lama, perangkat embedded tanpa baterai RTC, atau zona waktu salah. Periksa `date`/`timedatectl` dan status NTP terlebih dahulu — jauh lebih sering ini daripada sertifikat yang benar-benar salah.

5. **HTTP-01**: CA memverifikasi kepemilikan dengan meminta file di `http://domain/.well-known/acme-challenge/<token>`. Butuh **port 80 terbuka dari internet** dan **tidak bisa menerbitkan wildcard**.
   **DNS-01**: CA memverifikasi dengan memeriksa TXT record `_acme-challenge.domain`. **Bisa menerbitkan wildcard** (`*.example.com`), dan **server tidak perlu terekspos ke internet sama sekali**.
   Gunakan **DNS-01** ketika: (a) Anda butuh sertifikat wildcard; (b) server berada di jaringan internal tanpa akses masuk dari internet; (c) port 80 diblokir kebijakan; (d) Anda ingin menerbitkan sertifikat secara terpusat lalu mendistribusikannya. Syaratnya: penyedia DNS Anda punya API agar prosesnya bisa diotomasi.

6. **Session ticket** menyimpan state sesi dalam blob terenkripsi yang dipegang klien, dienkripsi dengan **STEK** (Session Ticket Encryption Key) di server. Kalau STEK tidak dirotasi secara berkala (banyak server memakai satu kunci sampai restart), maka **forward secrecy hilang**: penyerang yang mencuri STEK dapat mendekripsi semua sesi yang memakai ticket tersebut, termasuk yang direkam sebelumnya. Karena banyak deployment tidak merotasi STEK dengan benar, `ssl_session_tickets off` (mengandalkan session cache sisi server saja) adalah pilihan yang lebih aman — dengan biaya resumption lintas server menjadi lebih sulit di kluster.

7. **Penyebab: certificate pinning.** Aplikasi mobile banking menyematkan sertifikat atau kunci publik server aslinya. TLS inspection mengganti sertifikat server dengan sertifikat yang diterbitkan CA internal perusahaan — pin tidak cocok, sehingga aplikasi **sengaja menolak** koneksi. Ini bekerja persis sebagaimana dirancang; pinning memang bertujuan menggagalkan man-in-the-middle, dan inspeksi TLS secara teknis adalah man-in-the-middle.
   **Solusi:** buat **daftar bypass** — kecualikan domain perbankan (dan kategori sensitif lain: kesehatan, HR) dari inspeksi TLS. Sebagian besar NGFW punya kategori bawaan untuk ini. Selain menyelesaikan masalah teknis, ini juga praktik yang tepat secara privasi dan hukum.

8. **Tidak.** Wildcard `*.example.com` hanya mencakup **satu tingkat** label: `api.example.com` ✅, `www.example.com` ✅, tetapi `api.v2.example.com` ❌ (dua tingkat). Untuk mencakupnya, Anda perlu wildcard tambahan `*.v2.example.com` di SAN yang sama, atau sertifikat multi-domain yang menyebutkan nama itu secara eksplisit. Perhatikan juga bahwa `*.example.com` **tidak mencakup** apex `example.com` itu sendiri — apex harus ditambahkan terpisah ke SAN.

</details>

---

## 10. Sumber

- RFC 8446 — TLS 1.3
- RFC 5280 — X.509 PKI Certificate and CRL Profile
- RFC 6960 — OCSP · RFC 6961 — OCSP Multi-Stapling
- RFC 8555 — ACME
- RFC 6797 — HSTS
- Mozilla SSL Configuration Generator — https://ssl-config.mozilla.org/
- SSL Labs Server Test — https://www.ssllabs.com/ssltest/
- Let's Encrypt — https://letsencrypt.org/docs/

---

**Berikutnya:** `06-aplikasi/05-layanan-lain.md` — email, SSH, NTP, SNMP, syslog, dan layanan infrastruktur lain.

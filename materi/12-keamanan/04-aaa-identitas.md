# 12.4 AAA dan Manajemen Identitas

> **Prasyarat:** `12-keamanan/01`, `06-aplikasi/05`
> **Tujuan:** Anda paham AAA, bisa mengonfigurasi RADIUS/TACACS+, dan memahami peran identitas dalam keamanan modern.

---

## 1. AAA (Tiga Pilar)

| Pilar | Pertanyaan | Contoh |
|---|---|---|
| **Authentication** | **Siapa Anda?** | Username + password, sertifikat, biometrik |
| **Authorization** | **Apa yang boleh Anda lakukan?** | Privilege level, perintah yang diizinkan, VLAN |
| **Accounting** | **Apa yang Anda lakukan?** | Log perintah, durasi sesi, byte terpakai |

> [!WARNING]
> **Ketiganya berbeda dan sering tertukar.** Autentikasi berhasil tidak berarti otorisasi diberikan: pengguna bisa terautentikasi tetapi tidak berhak melakukan apa pun.

---

## 2. Faktor Autentikasi

```
1. SOMETHING YOU KNOW  → password, PIN, jawaban pertanyaan
2. SOMETHING YOU HAVE  → token, kartu, ponsel, security key
3. SOMETHING YOU ARE   → sidik jari, wajah, iris, suara
4. SOMEWHERE YOU ARE   → lokasi geografis, alamat IP
5. SOMETHING YOU DO    → pola perilaku, cara mengetik
```

**MFA** (*Multi-Factor Authentication*) memerlukan **minimal dua faktor BERBEDA**.

> [!WARNING]
> **Password + PIN BUKAN MFA**, karena keduanya "something you know". Yang benar: password (know) + kode dari ponsel (have).

### Kekuatan metode MFA

| Metode | Keamanan | Kerentanan |
|---|---|---|
| **SMS OTP** | Lemah (1/5) | SIM swap, SS7 interception, phishing |
| **Email OTP** | Lemah (1/5) | Email bisa diretas |
| **TOTP** (Google Auth, Authy) | Baik (3/5) | Phishing real-time (penyerang meneruskan kode) |
| **Push notification** | Baik (3/5) | **MFA fatigue**: pengguna menyetujui karena lelah |
| **Push + number matching** | 4/5 | Jauh lebih baik |
| **FIDO2 / WebAuthn / Passkey** | **Terbaik** (5/5) | **Tahan phishing secara desain** |
| **Sertifikat klien** | 5/5 | Butuh PKI dan manajemen |

> [!TIP]
> **FIDO2/passkey tahan phishing karena terikat pada domain.** Kunci untuk `bank.com` tidak akan dipakai di `bank-verify.com` karena browser menolaknya secara otomatis. Ini melindungi bahkan pengguna yang tertipu sepenuhnya.

> [!WARNING]
> **MFA fatigue attack:** penyerang yang sudah punya password membanjiri pengguna dengan prompt push berulang-ulang (bahkan tengah malam) sampai pengguna menyetujuinya karena kesal atau mengira ada kesalahan sistem. **Number matching** memaksa pengguna mengetikkan angka yang ditampilkan di layar login, sehingga persetujuan tidak bisa dilakukan tanpa sadar.

---

## 3. Kebijakan Password (Topik CCNA 5.4)

### Panduan modern (NIST SP 800-63B)

```
✅ Panjang MINIMAL 12 karakter (semakin panjang semakin baik)
✅ Izinkan hingga 64+ karakter dan SEMUA karakter (termasuk spasi, emoji)
✅ Periksa terhadap DAFTAR PASSWORD BOCOR (Have I Been Pwned API)
✅ Blokir password yang jelas (nama perusahaan, "password", pola keyboard)
✅ Izinkan copy-paste (agar password manager bisa dipakai)
✅ Rate limiting dan account lockout terhadap brute force
✅ MFA — jauh lebih penting daripada aturan kompleksitas

❌ JANGAN paksa rotasi berkala tanpa indikasi kompromi
❌ JANGAN paksa aturan komposisi rumit (huruf besar + angka + simbol)
❌ JANGAN pakai pertanyaan keamanan (jawabannya sering publik)
❌ JANGAN batasi panjang maksimum di bawah 64 karakter
```

> [!WARNING]
> **Ini perubahan besar dari praktik lama.** NIST tidak lagi merekomendasikan rotasi password berkala dan aturan komposisi, karena penelitian menunjukkan keduanya memperburuk keamanan:

```
Rotasi 90 hari  → pengguna membuat pola: Password1! → Password2! → Password3!
                → atau menuliskannya di sticky note
Aturan rumit    → pengguna membuat: P@ssw0rd! (mudah ditebak, sulit diingat)
                → dan memakai password yang sama di banyak layanan
```

> [!TIP]
> **Yang efektif:** panjang minimum, pemeriksaan terhadap daftar bocor, MFA, dan password manager. Rotasi hanya dilakukan saat ada indikasi kompromi.

### Alternatif password

```
Passphrase     : "kucing-oranye-makan-rendang-2026" — panjang, mudah diingat
Password manager: kata sandi acak unik per layanan
Passkey/FIDO2  : tanpa password sama sekali
Sertifikat     : untuk perangkat dan layanan
SSO            : satu autentikasi kuat, banyak layanan
```

---

## 4. RADIUS vs TACACS+

Dua protokol AAA utama untuk perangkat jaringan.

| Aspek | **RADIUS** | **TACACS+** |
|---|---|---|
| Standar | **RFC 2865/2866** (terbuka) | Cisco proprietary (RFC 8907 informational) |
| Transport | **UDP** 1812/1813 | **TCP** 49 |
| Enkripsi | **Hanya password** | **SELURUH payload** |
| AAA | Auth+Authz **digabung** | Auth, Authz, Acct **TERPISAH** |
| Command authorization | Terbatas | **Per-perintah** |
| Multi-vendor | **Universal** | Terutama Cisco |
| Untuk | **Akses jaringan** (802.1X, VPN, Wi-Fi) | **Administrasi perangkat** |

> [!TIP]
> **Praktik umum: pakai keduanya.**
```
TACACS+ → login administrator ke router/switch (dengan command authorization)
RADIUS  → autentikasi pengguna akhir (802.1X, VPN, Wi-Fi)
```

> [!WARNING]
> **RADIUS hanya mengenkripsi field password.** Username, atribut, dan hasil otorisasi dikirim plaintext. Siapa pun yang menyadap trafik RADIUS bisa melihat siapa login ke mana. **RadSec** (RADIUS over TLS, RFC 6614) memperbaikinya.

> [!WARNING]
> **TACACS+ mengenkripsi seluruh payload**, tetapi memakai algoritma lama berbasis MD5 yang tidak lagi dianggap kuat. Tetap jauh lebih baik daripada RADIUS plaintext.

### Konfigurasi Cisco: TACACS+

```
aaa new-model

tacacs server ISE-1
 address ipv4 192.168.99.50
 key RahasiaTacacs
 timeout 5
tacacs server ISE-2
 address ipv4 192.168.99.51
 key RahasiaTacacs

aaa group server tacacs+ TACACS-GROUP
 server name ISE-1
 server name ISE-2

! Autentikasi login — fallback ke lokal kalau server mati
aaa authentication login default group TACACS-GROUP local
aaa authentication enable default group TACACS-GROUP enable

! Otorisasi
aaa authorization exec default group TACACS-GROUP local
aaa authorization commands 1 default group TACACS-GROUP local
aaa authorization commands 15 default group TACACS-GROUP local
aaa authorization config-commands

! Accounting — catat SEMUA perintah
aaa accounting exec default start-stop group TACACS-GROUP
aaa accounting commands 1 default start-stop group TACACS-GROUP
aaa accounting commands 15 default start-stop group TACACS-GROUP

! User lokal sebagai FALLBACK (WAJIB!)
username admin-darurat privilege 15 secret RahasiaDaruratKuat

line vty 0 15
 transport input ssh
 exec-timeout 10 0
```

> [!WARNING]
> **`local` di akhir baris `aaa authentication` adalah penyelamat.** Kalau semua server TACACS+ mati dan tidak ada fallback, Anda tidak bisa login ke perangkat sama sekali. Ini outage manajemen total. Selalu sediakan akun lokal darurat dengan password kuat yang disimpan di brankas/password manager.

### Konfigurasi Cisco: RADIUS untuk 802.1X

```
aaa new-model
aaa authentication dot1x default group radius
aaa authorization network default group radius
aaa accounting dot1x default start-stop group radius

radius server ISE-1
 address ipv4 192.168.99.50 auth-port 1812 acct-port 1813
 key RahasiaRadius
 automate-tester username probe-user probe-on

aaa group server radius RADIUS-GROUP
 server name ISE-1
 deadtime 5

! Untuk CoA (Change of Authorization) — mengubah otorisasi sesi yang berjalan
aaa server radius dynamic-author
 client 192.168.99.50 server-key RahasiaRadius

dot1x system-auth-control
```

### MikroTik

```
# RADIUS
/radius add service=login,ppp,wireless,dot1x address=192.168.99.50 \
    secret=RahasiaRadius timeout=300ms

/user aaa set use-radius=yes accounting=yes interim-update=5m \
    default-group=read

# User lokal sebagai fallback
/user add name=admin-darurat password=RahasiaDaruratKuat group=full \
    address=192.168.99.0/24 comment="Akun darurat"

/radius monitor 0
/log print where topics~"radius"
```

> [!WARNING]
> **MikroTik tidak mendukung TACACS+ secara native.** Untuk command authorization, gunakan **user group** dengan policy yang dibatasi:

```
/user group add name=noc policy=read,test,ssh,winbox,reboot \
    comment="NOC — hanya baca dan reboot"
/user group add name=netops policy=read,write,test,ssh,winbox,reboot,policy \
    comment="Network operations"
/user group print
```

---

## 5. Privilege Level dan RBAC

### Cisco Privilege Level

```
Level 0  : disable, enable, exit, help, logout
Level 1  : user EXEC (prompt >) — perintah show terbatas
Level 15 : privileged EXEC (prompt #) — akses penuh
Level 2-14: dapat dikustomisasi
```

```
! Buat level 5 untuk operator NOC
privilege exec level 5 show running-config
privilege exec level 5 show ip interface brief
privilege exec level 5 clear counters
privilege exec level 5 ping
privilege exec level 5 traceroute

username noc-operator privilege 5 secret RahasiaKuat
enable secret level 5 RahasiaLevel5
```

> [!WARNING]
> **Privilege level bersifat kumulatif dan kasar:** level 5 mencakup semua level 1, sehingga sulit membuat peran yang presisi.

### Role-Based CLI (Parser View): lebih baik

```
! Aktifkan (butuh AAA)
enable view
conf t
 parser view NOC
  secret RahasiaView
  commands exec include show ip interface brief
  commands exec include show interfaces
  commands exec include ping
  commands exec include traceroute
  commands exec include show logging

username noc-operator view NOC secret RahasiaKuat
```

> [!TIP]
> **Untuk kontrol yang benar-benar presisi, gunakan TACACS+ command authorization.** Setiap perintah diverifikasi ke server, sehingga kebijakan dikelola terpusat dan Anda tidak perlu mengonfigurasi setiap perangkat.

---

## 6. 802.1X untuk Akses Jaringan

Sudah dibahas di `12-keamanan/02` (kabel) dan `10-wireless/03` (nirkabel). Di sini fokus pada sisi identitas.

### Manfaat identitas

```
✅ Setiap pengguna punya kredensial sendiri
   → cabut akses satu orang tanpa memengaruhi yang lain
✅ VLAN dinamis berdasarkan identitas/grup
✅ dACL (downloadable ACL) per pengguna
✅ Audit trail: siapa, kapan, dari port mana
✅ Kebijakan berbasis waktu dan lokasi
✅ Posture assessment (periksa antivirus, patch, sebelum mengizinkan)
```

### Atribut RADIUS untuk otorisasi dinamis

```
Tunnel-Type = VLAN (13)
Tunnel-Medium-Type = 802 (6)
Tunnel-Private-Group-ID = "20"        ← VLAN yang ditetapkan

Filter-Id = "ACL-KARYAWAN"            ← ACL yang diterapkan
Cisco-AVPair = "ip:inacl#10=permit tcp any any eq 443"
Session-Timeout = 28800
Termination-Action = RADIUS-Request
```

### CoA: Change of Authorization

Memungkinkan server mengubah atau memutus **sesi yang sedang berjalan**.

```
Kegunaan:
- Karyawan keluar → putuskan sesinya segera
- Perangkat terdeteksi terinfeksi → pindahkan ke VLAN karantina
- Posture berubah → sesuaikan akses
- Kuota habis → batasi bandwidth
```

```
aaa server radius dynamic-author
 client 192.168.99.50 server-key RahasiaRadius
 auth-type any
```

---

## 7. Manajemen Kredensial Perangkat

### Yang harus dilakukan

```
✅ HAPUS atau nonaktifkan akun default
✅ Password unik per perangkat (jangan sama semua!)
✅ Simpan di password manager / vault (Vault, CyberArk, Bitwarden)
✅ Rotasi kredensial saat ada personel yang keluar
✅ Enkripsi password di konfigurasi
✅ SSH key alih-alih password kalau memungkinkan
✅ Akun darurat (break-glass) dengan proses yang terdokumentasi
✅ Audit siapa yang punya akses, secara berkala
```

```
! Cisco — enkripsi password
service password-encryption            ! ⚠️ HANYA obfuscation (type 7), mudah dipecahkan
enable secret <password>                ! type 5 (MD5) atau type 8/9 (PBKDF2/scrypt) — LEBIH BAIK
username admin secret <password>

! Type 8 (PBKDF2-SHA256) atau type 9 (scrypt) — TERBAIK
enable algorithm-type scrypt secret RahasiaKuat
username admin algorithm-type scrypt secret RahasiaKuat
```

> [!WARNING]
> **`service password-encryption` menghasilkan "type 7" yang BUKAN enkripsi**, melainkan hanya obfuscation yang dapat dipecahkan dalam hitungan detik oleh alat online mana pun. Selalu gunakan `secret` (type 5/8/9), bukan `password`.

```
# MikroTik — password disimpan terenkripsi otomatis
/user add name=admin password=X group=full
/export hide-sensitive              ← sembunyikan saat mengekspor
```

### Break-Glass Account

```
Prosedur:
1. Satu akun darurat per perangkat/kelompok, password sangat kuat
2. Password disimpan di brankas fisik atau vault dengan akses terkontrol
3. Penggunaannya MEMICU ALARM (monitoring khusus)
4. Setelah dipakai, password DIROTASI segera
5. Setiap penggunaan didokumentasikan dan direview
```

> [!TIP]
> **Break-glass account adalah kebutuhan operasional, bukan kelemahan**, asalkan dikelola dengan benar. Tanpa itu, kegagalan AAA server berarti Anda tidak bisa memperbaiki jaringan Anda sendiri.

---

## 8. Identity Provider dan SSO

### Konsep

```
[Pengguna] → [Service Provider] → redirect → [Identity Provider]
                                              ↓ autentikasi + MFA
[Pengguna] ← [Service Provider] ← token   ← [Identity Provider]
```

| Protokol | Untuk | Catatan |
|---|---|---|
| **SAML 2.0** | SSO web enterprise | XML-based, matang |
| **OAuth 2.0** | **Otorisasi** (delegasi akses) | Bukan autentikasi! |
| **OIDC** (OpenID Connect) | **Autentikasi** di atas OAuth 2.0 | Standar modern |
| **Kerberos** | Windows/AD | Sensitif waktu (toleransi 5 menit) |
| **LDAP** | Direktori pengguna | Sumber identitas |

> [!WARNING]
> **OAuth 2.0 adalah protokol OTORISASI, bukan autentikasi.** Memakainya untuk login (tanpa OIDC) adalah kesalahan desain yang umum dan berisiko.

### Relevansi untuk network engineer

```
- RADIUS/TACACS+ sering mengambil identitas dari LDAP/AD
- VPN dan ZTNA memakai SAML/OIDC untuk autentikasi
- Kerberos memerlukan NTP yang akurat (toleransi 5 menit!)
- SSO menyederhanakan pencabutan akses — nonaktifkan sekali, berlaku di mana-mana
```

> [!TIP]
> **NTP yang salah adalah penyebab kegagalan Kerberos yang sering tidak terduga.** Kalau autentikasi domain tiba-tiba gagal di sebuah lokasi, periksa jam sebelum hal lain.

---

## 9. Privileged Access Management

Akun dengan hak tinggi memerlukan kontrol tambahan.

```
✅ Bastion host / jump server — satu-satunya jalan ke perangkat jaringan
✅ Session recording — rekam apa yang dilakukan admin
✅ Just-in-time access — hak admin diberikan sementara, otomatis dicabut
✅ Approval workflow untuk akses istimewa
✅ Password vaulting — admin tidak pernah tahu password perangkat
✅ Akun admin TERPISAH dari akun harian
✅ Jaringan manajemen out-of-band
```

> [!WARNING]
> **Admin tidak boleh memakai akun istimewa untuk email dan browsing.** Satu klik phishing dengan akun domain admin = seluruh organisasi jatuh. Gunakan akun terpisah dan workstation khusus admin (PAW).

---

## 10. Verifikasi dan Troubleshooting

```
! Cisco
show aaa servers
show aaa sessions
show tacacs
show radius statistics
show authentication sessions
show authentication sessions interface gi0/5 details
debug aaa authentication
debug tacacs
debug radius
test aaa group TACACS-GROUP user password legacy
```

```
# MikroTik
/radius monitor 0
/radius print
/user active print
/log print where topics~"radius"
/tool user-manager user print       ← kalau memakai User Manager
```

### Masalah umum

| Gejala | Penyebab |
|---|---|
| Login gagal, semua pengguna | AAA server tidak terjangkau; shared secret salah; **tidak ada fallback lokal** |
| Login berhasil tetapi tidak bisa apa-apa | **Otorisasi** gagal: atribut/privilege tidak dikirim |
| Login lambat (timeout lama) | Server pertama mati; kurangi timeout dan pakai `deadtime` |
| Sebagian pengguna gagal | Grup/atribut salah di server; sinkronisasi LDAP bermasalah |
| Terkunci dari perangkat | Tidak ada akun lokal fallback |
| Accounting tidak tercatat | Konfigurasi accounting kurang; port 1813 diblokir |
| Kerberos/AD gagal | **Selisih waktu > 5 menit**; periksa NTP |

> [!WARNING]
> **Selalu uji `test aaa` sebelum menerapkan konfigurasi AAA**, dan **selalu buka sesi kedua** sebelum menutup yang pertama.

```
R1# test aaa group TACACS-GROUP budi Rahasia123 legacy
Attempting authentication test to server-group TACACS-GROUP using tacacs+
User was successfully authenticated.
```

---

## 11. Ringkasan

- **AAA**: Authentication (siapa), Authorization (boleh apa), Accounting (melakukan apa). Ketiganya berbeda.
- **MFA butuh dua faktor BERBEDA.** Password + PIN bukan MFA.
- Kekuatan MFA: SMS/email (lemah) < TOTP/push < **push + number matching** < **FIDO2/passkey (tahan phishing)**.
- **MFA fatigue** diatasi dengan number matching.
- **NIST SP 800-63B: JANGAN paksa rotasi berkala dan aturan komposisi rumit.** Yang efektif: panjang ≥12, cek daftar bocor, MFA, password manager.
- **RADIUS** (UDP 1812/1813, hanya password terenkripsi, auth+authz digabung) untuk **akses jaringan**; **TACACS+** (TCP 49, seluruh payload terenkripsi, AAA terpisah, command authorization) untuk **administrasi perangkat**.
- **SELALU sediakan fallback lokal** (`... group TACACS-GROUP local`) dan **break-glass account**. Tanpa itu, AAA server mati = tidak bisa login sama sekali.
- **`service password-encryption` (type 7) bukan enkripsi.** Pakai `secret` dengan type 8/9 (scrypt/PBKDF2).
- **802.1X + RADIUS** memberi VLAN dinamis, dACL, dan audit trail per pengguna. **CoA** mengubah sesi yang berjalan.
- **OAuth 2.0 adalah otorisasi, bukan autentikasi.** Gunakan **OIDC** untuk login.
- **Kerberos sensitif waktu** (toleransi 5 menit), jadi periksa NTP saat autentikasi domain gagal.
- **Admin tidak boleh memakai akun istimewa untuk email/browsing.**

---

## 12. Latihan

1. Jelaskan perbedaan authentication, authorization, dan accounting dengan satu skenario.
2. Kenapa password + PIN bukan MFA?
3. Kapan memakai RADIUS dan kapan TACACS+? Bisakah keduanya dipakai bersamaan?
4. Apa yang terjadi kalau AAA server mati dan tidak ada fallback? Bagaimana mencegahnya?
5. Kenapa NIST tidak lagi merekomendasikan rotasi password berkala?
6. Jelaskan MFA fatigue attack dan mitigasinya.
7. Sebuah organisasi memakai `service password-encryption` dan menganggap konfigurasinya aman untuk dibagikan. Apa masalahnya?
8. Autentikasi domain tiba-tiba gagal di satu cabang. Apa yang Anda periksa pertama?

<details>
<summary>Jawaban</summary>

1. Skenario: seorang teknisi NOC login ke router untuk memeriksa masalah.
   - **Authentication**: ia memasukkan username `budi` dan password (+ kode MFA); server memverifikasi bahwa ia benar-benar Budi. Hasilnya: diterima atau ditolak.
   - **Authorization**: setelah terautentikasi, sistem menentukan apa yang boleh ia lakukan. Misalnya, ia berada di grup NOC sehingga hanya boleh menjalankan perintah `show` dan `ping`, tetapi tidak boleh masuk mode konfigurasi. Setiap perintah bisa diverifikasi ke server (TACACS+ command authorization).
   - **Accounting**: setiap perintah yang ia jalankan, waktu login/logout, dan durasi sesi dicatat ke server, sehingga ada jejak audit tentang siapa melakukan apa dan kapan.

2. Karena **MFA mensyaratkan faktor dari KATEGORI YANG BERBEDA**. Password dan PIN keduanya adalah **"something you know"**, yaitu rahasia yang diingat pengguna. Penyerang yang berhasil melakukan phishing, keylogging, atau menemukan catatan pengguna kemungkinan besar mendapat keduanya sekaligus, sehingga tidak ada perlindungan tambahan yang berarti.
   MFA yang benar mengombinasikan kategori berbeda: password (**know**) + kode dari aplikasi authenticator di ponsel (**have**), atau password + sidik jari (**are**). Dengan begitu penyerang harus mengompromikan dua hal yang sifatnya berbeda.

3. **RADIUS** untuk **akses jaringan pengguna akhir**: 802.1X (kabel dan Wi-Fi), VPN, hotspot, PPPoE. Alasannya: standar terbuka yang didukung semua vendor, ringan (UDP), dan menggabungkan auth+authz sehingga cukup satu pertukaran untuk memberikan VLAN/ACL dinamis.
   **TACACS+** untuk **administrasi perangkat jaringan**: login admin ke router/switch. Alasannya: memisahkan authorization dari authentication sehingga bisa melakukan command authorization per-perintah, dan mengenkripsi seluruh payload (bukan hanya password).
   **Ya, keduanya bisa dan lazim dipakai bersamaan**, bahkan pada perangkat yang sama. Router memakai TACACS+ untuk login administrator, dan RADIUS untuk mengautentikasi pengguna 802.1X yang terhubung ke port-portnya. Keduanya bisa mengambil identitas dari direktori yang sama (LDAP/AD).

4. **Tidak ada seorang pun yang bisa login ke perangkat**, termasuk Anda. Perangkat mencoba menghubungi AAA server, gagal, dan karena tidak ada metode alternatif yang dikonfigurasi, semua percobaan login ditolak. Ini **outage manajemen total**: jaringan mungkin masih meneruskan trafik, tetapi Anda tidak dapat mengubah apa pun, bahkan untuk memperbaiki masalah yang sedang terjadi. Pemulihan memerlukan akses fisik dan prosedur password recovery.
   **Pencegahan:** (a) selalu tambahkan **`local`** di akhir daftar metode: `aaa authentication login default group TACACS-GROUP local`; (b) buat **akun lokal darurat (break-glass)** dengan password sangat kuat, disimpan di vault, dan penggunaannya memicu alarm; (c) pasang minimal dua AAA server di lokasi terpisah; (d) uji skenario kegagalan AAA secara berkala; (e) pastikan akses out-of-band (console server) tersedia.

5. Karena penelitian menunjukkan rotasi berkala memperburuk keamanan dalam praktik. Ketika dipaksa mengganti password setiap 90 hari, pengguna: (a) membuat pola yang mudah ditebak (`Password1!` → `Password2!` → `Password3!`), sehingga penyerang yang pernah mendapat satu password dapat menebak yang berikutnya; (b) memilih password yang lebih lemah karena harus sering diingat ulang; (c) menuliskannya di tempat yang tidak aman; (d) memakai password yang sama di banyak layanan agar lebih mudah.
   Sementara itu, manfaatnya kecil: kalau password sudah bocor, penyerang biasanya memakainya dalam hitungan jam atau hari, jauh sebelum rotasi 90 hari berikutnya.
   **NIST SP 800-63B** karena itu merekomendasikan rotasi hanya saat ada indikasi kompromi, dan mengalihkan fokus ke: panjang minimum, pemeriksaan terhadap daftar password bocor, dan MFA.

6. **MFA fatigue** (juga disebut *push bombing* atau *MFA bombing*) terjadi ketika penyerang sudah memiliki password korban (dari kebocoran atau phishing) tetapi terhalang MFA berbasis push. Penyerang berulang kali mencoba login, sehingga korban menerima prompt push terus-menerus, puluhan kali, sering pada tengah malam. Akhirnya korban menyetujui karena: mengira ada kesalahan sistem, ingin prompt-nya berhenti, atau tidak sadar saat setengah tertidur.
   **Mitigasi:** (a) **Number matching**: layar login menampilkan angka yang harus diketikkan pengguna di aplikasi, sehingga persetujuan tidak bisa dilakukan tanpa melihat layar login yang sah; (b) **beralih ke FIDO2/passkey** yang tahan phishing secara desain; (c) **rate limiting** pada jumlah prompt per periode; (d) **notifikasi konteks** (lokasi, aplikasi) pada prompt; (e) **deteksi dan alarm** pada pola percobaan login berulang yang gagal; (f) **edukasi pengguna** untuk melaporkan prompt yang tidak diminta.

7. **`service password-encryption` menghasilkan "type 7" yang BUKAN enkripsi, melainkan hanya obfuscation dengan algoritma Vigenère yang sudah dipublikasikan.** Password type 7 dapat dipecahkan dalam hitungan detik oleh alat online mana pun atau skrip beberapa baris. Ia hanya melindungi dari orang yang tidak sengaja melihat layar, bukan dari penyerang.
   Kalau konfigurasi itu dibagikan (ke vendor, di tiket dukungan, di repositori, atau bocor), **semua password di dalamnya dianggap terekspos sepenuhnya**.
   **Yang benar:** gunakan `enable secret` dan `username ... secret` yang menghasilkan hash, lalu pilih **type 8 (PBKDF2-SHA256)** atau **type 9 (scrypt)** yang tahan terhadap serangan GPU:
   ```
   enable algorithm-type scrypt secret RahasiaKuat
   username admin algorithm-type scrypt secret RahasiaKuat
   ```
   Untuk berbagi konfigurasi, tetap sensor bagian kredensial (`show running-config | redact` atau proses manual), dan **rotasi kredensial** apa pun yang pernah terekspos.

8. **Periksa jam sistem dan sinkronisasi NTP.** Kerberos, yang menjadi dasar autentikasi Active Directory, menyertakan **timestamp** dalam tiketnya untuk mencegah serangan replay, dengan toleransi default hanya 5 menit. Kalau jam perangkat, server, atau domain controller di cabang itu bergeser lebih dari 5 menit, semua autentikasi Kerberos gagal: pengguna tidak bisa login, mengakses file share, atau membuka aplikasi terintegrasi AD.
   Ini penyebab yang sangat sering terjadi setelah: pemadaman listrik (perangkat kehilangan waktu), server NTP tidak terjangkau (link WAN putus, firewall memblokir UDP 123), atau perubahan konfigurasi NTP.
   ```
   R1# show clock detail
   R1# show ntp status
   $ timedatectl status
   PS> w32tm /query /status
   ```
   Setelah memastikan waktu, baru periksa: konektivitas ke domain controller, DNS (SRV record `_ldap._tcp`), dan status akun/komputer di AD.

</details>

---

## 13. Sumber

- RFC 2865 / 2866: RADIUS · RFC 6614: RadSec (RADIUS over TLS)
- RFC 8907: TACACS+ Protocol
- NIST SP 800-63B, Digital Identity Guidelines: Authentication
- RFC 6749: OAuth 2.0 · OpenID Connect Core 1.0
- FIDO Alliance: https://fidoalliance.org
- Cisco CCNA 200-301 v1.1, topik 5.3 (device access control), 5.4 (password policy), 5.8 (AAA concepts)

---

**Berikutnya:** `12-keamanan/05-hardening-zero-trust.md`. Memperkuat perangkat dan arsitektur zero trust.

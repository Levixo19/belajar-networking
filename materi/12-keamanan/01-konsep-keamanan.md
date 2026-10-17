# 12.1 Konsep Dasar Keamanan Jaringan

> **Prasyarat:** `09-nat-acl-firewall/03`
> **Tujuan:** Anda menguasai kosakata keamanan yang dipakai profesional, memahami model ancaman, dan bisa berpikir seperti penyerang maupun pembela.

---

## 1. CIA Triad: Fondasi Semua Keamanan

```
        ┌─────────────────┐
        │  CONFIDENTIALITY │  Hanya yang berhak yang bisa MEMBACA
        └────────┬─────────┘
                 │
     ┌───────────┴───────────┐
     │                       │
┌────┴──────┐        ┌───────┴─────┐
│ INTEGRITY │        │AVAILABILITY │
│ Data tidak│        │ Sistem bisa │
│ diubah    │        │ diakses saat│
│ tanpa izin│        │ dibutuhkan  │
└───────────┘        └─────────────┘
```

| Pilar | Ancaman | Kontrol |
|---|---|---|
| **Confidentiality** | Penyadapan, kebocoran data, akses tidak sah | Enkripsi, kontrol akses, klasifikasi data |
| **Integrity** | Modifikasi data, MITM, malware | Hash, tanda tangan digital, checksum, kontrol perubahan |
| **Availability** | DDoS, kegagalan hardware, ransomware | Redundansi, backup, rate limiting, DDoS protection |

> [!WARNING]
> **Ketiganya sering saling bertentangan.** Enkripsi penuh (confidentiality) menyulitkan inspeksi keamanan; redundansi (availability) memperbesar permukaan serangan; kontrol ketat (integrity) memperlambat operasi. Keamanan selalu soal keseimbangan, bukan maksimum.

### Tambahan penting

| Konsep | Arti |
|---|---|
| **Authentication** | Membuktikan siapa Anda |
| **Authorization** | Menentukan apa yang boleh Anda lakukan |
| **Accounting/Audit** | Mencatat apa yang Anda lakukan |
| **Non-repudiation** | Tidak bisa menyangkal telah melakukannya (tanda tangan digital) |

---

## 2. Kosakata Wajib (Topik CCNA 5.1)

| Istilah | Definisi | Contoh |
|---|---|---|
| **Asset** | Sesuatu yang bernilai dan perlu dilindungi | Data pelanggan, server, reputasi |
| **Vulnerability** | **Kelemahan** yang bisa dieksploitasi | Software belum di-patch, password lemah |
| **Threat** | **Potensi bahaya** yang bisa memanfaatkan kelemahan | Malware, penyerang, bencana alam |
| **Threat actor** | Pihak yang melakukan ancaman | Kriminal, insider, negara |
| **Exploit** | **Cara/alat** memanfaatkan vulnerability | Kode yang memanfaatkan CVE tertentu |
| **Attack** | Percobaan nyata mengeksploitasi | Ransomware yang dijalankan |
| **Risk** | **Kemungkinan × Dampak** | "Kemungkinan 30%, kerugian Rp 2 M" |
| **Mitigation** | Tindakan mengurangi risiko | Patch, firewall, backup, pelatihan |
| **Attack surface** | Semua titik yang bisa diserang | Port terbuka, aplikasi, pengguna |
| **Attack vector** | Jalur yang dipakai penyerang | Email phishing, port RDP terbuka |

**Hubungannya:**
```
THREAT memanfaatkan VULNERABILITY lewat EXPLOIT
→ menjadi ATTACK terhadap ASSET
→ menghasilkan RISK
→ dikurangi dengan MITIGATION
```

### Menangani risiko: empat pilihan

```
1. MITIGATE  (kurangi)   → pasang kontrol keamanan
2. TRANSFER  (alihkan)   → asuransi siber, outsourcing
3. ACCEPT    (terima)    → risiko kecil, biaya mitigasi lebih besar
4. AVOID     (hindari)   → hentikan aktivitas yang berisiko
```

> [!TIP]
> **"Accept" adalah keputusan yang sah**, asalkan disadari, didokumentasikan, dan disetujui manajemen. Yang berbahaya adalah risiko yang tidak diketahui, bukan risiko yang diterima secara sadar.

---

## 3. Prinsip Desain Keamanan

### Defense in Depth (pertahanan berlapis)

```
   ┌─────────────────────────────────────────────┐
   │ 1. KEBIJAKAN & PELATIHAN                    │
   │ ┌─────────────────────────────────────────┐ │
   │ │ 2. KEAMANAN FISIK                       │ │
   │ │ ┌─────────────────────────────────────┐ │ │
   │ │ │ 3. PERIMETER (firewall, IPS)        │ │ │
   │ │ │ ┌─────────────────────────────────┐ │ │ │
   │ │ │ │ 4. JARINGAN INTERNAL (segmentasi)│ │ │ │
   │ │ │ │ ┌─────────────────────────────┐ │ │ │ │
   │ │ │ │ │ 5. HOST (hardening, EDR)    │ │ │ │ │
   │ │ │ │ │ ┌─────────────────────────┐ │ │ │ │ │
   │ │ │ │ │ │ 6. APLIKASI             │ │ │ │ │ │
   │ │ │ │ │ │ ┌─────────────────────┐ │ │ │ │ │ │
   │ │ │ │ │ │ │ 7. DATA (enkripsi)  │ │ │ │ │ │ │
   │ │ │ │ │ │ └─────────────────────┘ │ │ │ │ │ │
   │ │ │ │ │ └─────────────────────────┘ │ │ │ │ │
   │ │ │ │ └─────────────────────────────┘ │ │ │ │
   │ │ │ └─────────────────────────────────┘ │ │ │
   │ │ └─────────────────────────────────────┘ │ │
   │ └─────────────────────────────────────────┘ │
   └─────────────────────────────────────────────┘
```

**Prinsipnya:** asumsikan setiap lapisan akan ditembus. Lapisan berikutnya harus tetap memberi perlindungan.

> [!WARNING]
> **Kesalahan klasik: "kami punya firewall, jadi kami aman".** Firewall hanya melindungi perimeter. Sebagian besar serangan modern masuk lewat email dan browser, melewati firewall sebagai trafik yang tampak sah.

### Prinsip lainnya

| Prinsip | Arti | Contoh penerapan |
|---|---|---|
| **Least Privilege** | Beri hak seminimal yang diperlukan | Admin tidak memakai akun domain admin untuk email |
| **Separation of Duties** | Satu orang tidak boleh mengendalikan seluruh proses | Yang membuat perubahan ≠ yang menyetujui |
| **Fail Secure** | Kalau gagal, gagal dalam keadaan aman | Firewall mati → tidak ada trafik lewat |
| **Fail Open** | Kalau gagal, tetap berfungsi | Kadang perlu (sistem keselamatan), tetapi berisiko |
| **Minimize Attack Surface** | Matikan yang tidak dipakai | Nonaktifkan port, layanan, protokol tidak terpakai |
| **Zero Trust** | Jangan percaya siapa pun secara default | Verifikasi setiap permintaan |
| **Security by Design** | Keamanan sejak awal, bukan ditambal | Ancam-modelkan sebelum membangun |
| **KISS** | Sederhana lebih aman | Konfigurasi rumit = lebih banyak celah |

> [!TIP]
> **Kompleksitas adalah musuh keamanan.** Firewall dengan 3.000 aturan yang tidak ada yang memahaminya lebih tidak aman daripada 50 aturan yang jelas.

---

## 4. Threat Actor

| Jenis | Motivasi | Kemampuan | Contoh target |
|---|---|---|---|
| **Script kiddie** | Iseng, pamer | Rendah (pakai alat orang lain) | Siapa saja yang lengah |
| **Hacktivist** | Ideologi, politik | Sedang | Pemerintah, korporasi |
| **Cybercriminal** | **Uang** | Sedang-tinggi | Semua (ransomware, pencurian data) |
| **Insider** | Dendam, uang, kelalaian | **Akses istimewa** | Organisasi sendiri |
| **Competitor** | Keunggulan bisnis | Sedang | Pesaing |
| **Nation-state / APT** | Spionase, sabotase | **Sangat tinggi** | Infrastruktur kritis, pemerintah |

> [!WARNING]
> **Insider threat adalah yang paling sering diremehkan.** Mereka sudah punya akses, tahu di mana data berharga, dan tahu kontrol apa yang ada. Insider threat juga mencakup kelalaian (mengklik phishing, salah konfigurasi), yang jauh lebih umum daripada niat jahat.

> [!TIP]
> **Untuk sebagian besar organisasi, ancaman nyata adalah cybercriminal dengan ransomware dan insider yang lalai, bukan APT.** Rancang pertahanan sesuai ancaman yang realistis.

---

## 5. Rekayasa Sosial: Serangan yang Menargetkan Manusia

Manusia adalah lapisan yang paling sulit di-patch.

| Teknik | Cara kerja |
|---|---|
| **Phishing** | Email massal yang meminta kredensial atau menjalankan malware |
| **Spear phishing** | Phishing yang **ditargetkan** dengan riset (nama, jabatan, konteks nyata) |
| **Whaling** | Spear phishing terhadap eksekutif |
| **Vishing** | Lewat telepon ("saya dari IT, butuh password Anda") |
| **Smishing** | Lewat SMS |
| **Pretexting** | Membangun skenario palsu yang meyakinkan |
| **Baiting** | Meninggalkan USB berisi malware di parkiran |
| **Tailgating** | Mengikuti masuk lewat pintu berkartu |
| **Business Email Compromise (BEC)** | Berpura-pura jadi eksekutif untuk meminta transfer dana |
| **MFA fatigue** | Membanjiri pengguna dengan prompt MFA sampai ia menyetujui |

> [!WARNING]
> **Rekayasa sosial adalah vektor serangan paling sukses.** Tidak ada firewall yang menghentikan karyawan yang secara sukarela memasukkan kredensialnya ke situs palsu.

**Mitigasi:**
```
✅ Pelatihan kesadaran keamanan yang BERKELANJUTAN (bukan sekali setahun)
✅ Simulasi phishing dengan umpan balik (bukan hukuman)
✅ MFA yang tahan phishing (FIDO2/passkey, bukan SMS atau push)
✅ Proses verifikasi untuk transfer dana (panggilan balik ke nomor terdaftar)
✅ Email security gateway + DMARC
✅ Budaya "tidak apa-apa melaporkan kesalahan"
```

> [!TIP]
> **Budaya pelaporan ikut menentukan.** Kalau karyawan takut dihukum karena mengklik phishing, mereka akan menyembunyikannya, dan Anda kehilangan waktu berharga untuk merespons.

---

## 6. Program Keamanan (Topik CCNA 5.2)

CCNA secara eksplisit menguji tiga elemen ini.

### 1. User Awareness

Membuat pengguna **sadar** akan ancaman.
```
- Kampanye kesadaran (poster, email, newsletter)
- Pengumuman ancaman terkini
- Simulasi phishing
- Onboarding karyawan baru
```

### 2. Training

Memberi pengguna **keterampilan** yang dapat ditindaklanjuti.
```
- Cara mengenali phishing
- Cara melaporkan insiden
- Kebijakan penggunaan yang dapat diterima (AUP)
- Penanganan data sensitif
- Pelatihan khusus untuk peran tertentu (developer, admin, keuangan)
```

### 3. Physical Access Control

Keamanan siber tidak berarti kalau penyerang bisa masuk ke ruang server.
```
- Kartu akses, biometrik, mantrap
- CCTV dan log akses
- Rak terkunci, kabel terkunci
- Port console dan port switch yang tidak dipakai → dinonaktifkan
- Kebijakan tamu (didampingi)
- Pemusnahan media (shredding, degaussing)
```

> [!WARNING]
> **Akses fisik = akses penuh.** Dengan akses fisik ke router/switch, penyerang bisa melakukan **password recovery** dalam hitungan menit, sehingga semua konfigurasi keamanan menjadi tidak berarti.

```
# Cisco — matikan password recovery (⚠️ hati-hati!)
R1(config)# no service password-recovery
```
> [!WARNING]
> Setelah ini, kalau Anda lupa password, satu-satunya jalan adalah menghapus seluruh konfigurasi. Pastikan Anda punya backup dan proses manajemen kredensial yang baik.

---

## 7. Kill Chain dan MITRE ATT&CK

Memahami bagaimana serangan berlangsung membantu menempatkan pertahanan di titik yang tepat.

### Cyber Kill Chain (Lockheed Martin)

```
1. RECONNAISSANCE  → mengumpulkan informasi target
2. WEAPONIZATION   → menyiapkan malware/exploit
3. DELIVERY        → mengirimkan (email, USB, web)
4. EXPLOITATION    → mengeksekusi kode
5. INSTALLATION    → memasang persistence (backdoor)
6. COMMAND & CONTROL (C2) → membangun kanal kendali
7. ACTIONS ON OBJECTIVES  → mencuri data, enkripsi, sabotase
```

> [!TIP]
> **Memutus satu tahap saja sudah menggagalkan serangan.** Ini alasan defense in depth bekerja: penyerang harus berhasil di setiap tahap, sedangkan pembela cukup berhasil di satu.

**Di mana kontrol jaringan berperan:**
```
Reconnaissance → batasi informasi publik, deteksi port scan
Delivery       → email gateway, web filtering, DNS filtering
Exploitation   → IPS, patching, EDR
Installation   → application whitelisting, EDR
C2             → deteksi trafik anomali, DNS monitoring, blokir domain C2
Actions        → DLP, segmentasi (membatasi lateral movement), monitoring
```

### MITRE ATT&CK

Basis pengetahuan taktik dan teknik penyerang yang diamati di dunia nyata. Diorganisasi dalam **14 taktik** (tujuan) dengan ratusan **teknik** (cara).

```
Reconnaissance → Resource Development → Initial Access → Execution →
Persistence → Privilege Escalation → Defense Evasion → Credential Access →
Discovery → Lateral Movement → Collection → Command and Control →
Exfiltration → Impact
```

> [!TIP]
> **ATT&CK dipakai untuk:** memetakan cakupan deteksi Anda, merancang purple team exercise, dan berkomunikasi tentang ancaman dengan bahasa yang sama. Situs: https://attack.mitre.org

---

## 8. Lateral Movement dan Segmentasi

Setelah penyerang masuk ke satu host, tujuan berikutnya adalah **bergerak menyamping** ke sistem yang lebih berharga.

```
Penyerang masuk lewat laptop karyawan (phishing)
→ mencari kredensial tersimpan
→ pindah ke file server
→ pindah ke domain controller
→ RANSOMWARE SELURUH ORGANISASI
```

> [!WARNING]
> **Jaringan "datar" (semua perangkat bisa menjangkau semuanya) adalah mimpi buruk keamanan.** Satu laptop yang terinfeksi dapat menjangkau setiap server.

**Segmentasi adalah kontrol paling efektif melawan lateral movement:**

```
✅ VLAN + ACL/firewall antar-segmen
✅ Pisahkan: pengguna, server, manajemen, IoT/OT, tamu, DMZ
✅ Server tidak boleh menginisiasi koneksi ke jaringan pengguna
✅ Jaringan manajemen TERPISAH (out-of-band)
✅ Mikrosegmentasi untuk aset kritis
✅ Batasi SMB, RDP, WinRM antar-segmen
```

> [!TIP]
> **Dampak nyata:** organisasi dengan segmentasi yang baik sering hanya kehilangan satu segmen saat terkena ransomware; yang jaringannya datar kehilangan semuanya.

---

## 9. Berpikir Seperti Penyerang

Untuk bertahan dengan baik, Anda harus memahami cara berpikir penyerang.

### Yang dicari penyerang

```
1. Jalan masuk termudah (bukan yang paling canggih)
   → password default, layanan terekspos, phishing

2. Kredensial (lebih baik daripada exploit)
   → tidak ada IPS yang mendeteksi login yang "sah"

3. Persistence
   → agar tetap masuk setelah reboot/patch

4. Cara bergerak menyamping
   → kredensial tersimpan, share terbuka, trust relationship

5. Data bernilai atau leverage
   → data pelanggan, rahasia dagang, atau sekadar
     mengenkripsi semuanya untuk tebusan
```

### Yang paling sering menjadi jalan masuk

```
1. Phishing / rekayasa sosial
2. Kredensial yang bocor atau lemah (tanpa MFA)
3. Layanan terekspos ke internet (RDP, VPN tanpa patch, panel admin)
4. Kerentanan yang belum di-patch pada perangkat perimeter
5. Salah konfigurasi (bucket cloud terbuka, database tanpa autentikasi)
6. Rantai pasokan (software pihak ketiga, vendor)
```

> [!WARNING]
> **Sebagian besar jalan masuk itu bukan serangan "canggih".** Mereka memanfaatkan kelalaian dasar: patch yang tertunda, MFA yang tidak dipakai, dan layanan yang tidak seharusnya terekspos.

> [!TIP]
> **Konsekuensinya untuk network engineer:** pekerjaan keamanan Anda yang paling bernilai adalah hal-hal membosankan seperti patching, mematikan yang tidak dipakai, segmentasi, MFA, backup, dan monitoring, bukan membeli produk keamanan termahal.

---

## 10. Kerangka Kepatuhan

| Kerangka | Fokus | Relevansi |
|---|---|---|
| **NIST CSF 2.0** | Govern, Identify, Protect, Detect, Respond, Recover | Kerangka umum yang sangat dipakai |
| **NIST SP 800-53** | Katalog kontrol keamanan | Pemerintah AS, dipakai luas |
| **ISO/IEC 27001** | Sistem manajemen keamanan informasi | Sertifikasi internasional |
| **CIS Controls v8** | 18 kontrol prioritas | **Sangat praktis untuk memulai** |
| **PCI DSS 4.0** | Data kartu pembayaran | Wajib jika memproses kartu |
| **NIST SP 800-207** | Zero Trust Architecture | Arah arsitektur modern |
| **UU PDP (Indonesia)** | Perlindungan data pribadi | **Wajib di Indonesia** |
| **IEC 62443** | Keamanan sistem industri (OT) | Pabrik, utilitas |

> [!TIP]
> **CIS Controls v8 adalah titik awal terbaik** untuk organisasi yang belum punya program keamanan: 18 kontrol yang diurutkan berdasarkan dampak, dengan panduan implementasi konkret.

> [!WARNING]
> **Kepatuhan ≠ keamanan.** Banyak organisasi yang "compliant" tetap diretas. Kepatuhan adalah standar minimum, bukan tujuan akhir.

---

## 11. Ringkasan

- **CIA Triad**: Confidentiality, Integrity, Availability. Ketiganya sering bertentangan, jadi keamanan adalah soal keseimbangan.
- Kosakata: **vulnerability** (kelemahan) → **threat** (potensi bahaya) → **exploit** (cara) → **attack** (kejadian) → **risk** (kemungkinan × dampak) → **mitigation**.
- Risiko ditangani dengan **mitigate, transfer, accept, atau avoid**. "Accept" sah asalkan disadari dan didokumentasikan.
- **Defense in depth**: asumsikan setiap lapisan akan ditembus. **Least privilege**, **separation of duties**, **fail secure**, **minimize attack surface**, **KISS**.
- **Kompleksitas adalah musuh keamanan.**
- Threat actor: script kiddie, hacktivist, **cybercriminal**, **insider** (paling diremehkan), competitor, nation-state.
- **Rekayasa sosial adalah vektor paling sukses.** Mitigasinya: pelatihan berkelanjutan, MFA tahan phishing, dan budaya yang tidak menghukum pelaporan.
- Program keamanan (CCNA 5.2): **user awareness**, **training**, **physical access control**.
- **Akses fisik = akses penuh**: password recovery membuat semua konfigurasi tidak berarti.
- **Kill chain**: memutus satu tahap menggagalkan serangan. **MITRE ATT&CK** untuk memetakan deteksi.
- **Segmentasi adalah kontrol paling efektif melawan lateral movement.**
- Jalan masuk tersering bukan serangan canggih, melainkan **patch tertunda, kredensial lemah tanpa MFA, dan layanan terekspos**.
- **Kepatuhan ≠ keamanan.** Kepatuhan adalah standar minimum.

---

## 12. Latihan

1. Jelaskan perbedaan vulnerability, threat, exploit, dan risk dengan satu contoh yang menghubungkan keempatnya.
2. Kenapa "kami punya firewall" bukan strategi keamanan yang memadai?
3. Sebutkan empat cara menangani risiko. Kapan "accept" adalah pilihan yang sah?
4. Kenapa insider threat sering paling berbahaya?
5. Jelaskan bagaimana segmentasi jaringan membatasi dampak ransomware.
6. Sebuah organisasi lulus audit PCI DSS tetapi tetap diretas. Bagaimana ini mungkin?
7. Manajemen menolak anggaran untuk MFA karena "kita punya firewall canggih". Bagaimana Anda menjelaskannya?
8. Sebutkan lima jalan masuk paling umum bagi penyerang, dan kontrol jaringan apa yang mengatasinya.

<details>
<summary>Jawaban</summary>

1. Contoh terhubung: sebuah organisasi menjalankan server VPN dengan firmware yang belum di-patch.
   - **Vulnerability**: kerentanan pada firmware VPN (mis. CVE tertentu yang memungkinkan bypass autentikasi). Ini **kelemahan** yang ada.
   - **Threat**: kelompok ransomware yang aktif memindai internet mencari VPN rentan. Ini **potensi bahaya** yang ada di luar sana.
   - **Exploit**: kode publik yang memanfaatkan CVE itu untuk mendapat akses tanpa kredensial. Ini **cara/alat** konkretnya.
   - **Risk**: kemungkinan diserang (tinggi, karena VPN terekspos internet dan exploit tersedia publik) dikalikan dampaknya (sangat tinggi: akses ke seluruh jaringan internal) = **risiko kritis**.
   - **Mitigation**: patch firmware segera, batasi akses VPN dengan MFA, dan pantau log autentikasi.

2. Karena firewall hanya melindungi **perimeter**, yaitu batas antara internal dan internet. Sementara itu: (a) sebagian besar serangan modern masuk lewat email dan browser sebagai trafik yang tampak sah dan diizinkan firewall; (b) firewall tidak melindungi dari insider atau perangkat yang sudah terinfeksi di dalam; (c) firewall tidak menghentikan lateral movement setelah penyerang masuk; (d) trafik terenkripsi (>95% web) tidak dapat diinspeksi tanpa TLS inspection; (e) kredensial yang dicuri menghasilkan login yang sah, jadi tidak ada yang bisa diblokir.
   Karena itu diperlukan **defense in depth**: email security, EDR di endpoint, segmentasi internal, MFA, monitoring, dan backup.

3. **Mitigate** (kurangi dengan kontrol), **Transfer** (asuransi siber, outsourcing ke pihak yang menanggung), **Accept** (terima apa adanya), **Avoid** (hentikan aktivitasnya).
   **"Accept" sah** ketika: biaya mitigasi jelas melebihi potensi kerugian; risikonya kecil dan dampaknya terbatas; atau tidak ada mitigasi yang praktis. Syaratnya: keputusan itu harus disadari, dianalisis, didokumentasikan dalam risk register, dan disetujui oleh pihak yang berwenang menanggung konsekuensinya (biasanya manajemen, bukan tim IT). Yang berbahaya adalah risiko yang tidak diketahui atau diabaikan diam-diam.

4. Karena mereka **sudah melewati semua kontrol perimeter**: mereka punya akun yang sah, kredensial yang valid, dan akses fisik. Mereka juga tahu di mana data berharga berada, tahu kontrol apa yang ada dan bagaimana menghindarinya, dan aktivitas mereka terlihat normal bagi sistem monitoring.
   Selain itu, kategori ini mencakup **kelalaian**, yang jauh lebih umum daripada niat jahat: mengklik phishing, salah mengonfigurasi firewall, mengunggah data ke cloud pribadi, atau membawa laptop yang tidak terenkripsi. Mitigasi: least privilege, separation of duties, monitoring perilaku (UEBA), DLP, rotasi tugas, dan proses offboarding yang ketat.

5. Ransomware modern bekerja dengan: masuk ke satu host → mencuri kredensial → **bergerak menyamping** ke sebanyak mungkin sistem → mengenkripsi semuanya secara serentak.
   **Segmentasi memutus langkah ketiga.** Dengan VLAN dan firewall antar-segmen: (a) host terinfeksi di jaringan pengguna tidak bisa menjangkau server produksi kecuali lewat port yang diizinkan secara eksplisit; (b) protokol yang biasa dipakai lateral movement (SMB 445, RDP 3389, WinRM) diblokir antar-segmen; (c) jaringan manajemen terpisah sehingga perangkat jaringan tidak dapat dicapai; (d) backup berada di segmen terisolasi sehingga tidak ikut terenkripsi.
   **Dampak nyata:** organisasi dengan segmentasi baik sering hanya kehilangan satu segmen dan pulih dari backup dalam hitungan jam; yang jaringannya datar kehilangan seluruh operasi selama berminggu-minggu.

6. Karena **kepatuhan adalah standar minimum pada satu titik waktu, untuk ruang lingkup tertentu**, bukan jaminan keamanan menyeluruh. Beberapa alasan konkret: (a) **ruang lingkup terbatas**: PCI DSS hanya mencakup lingkungan data kartu (CDE), sedangkan sistem lain di luar ruang lingkup bisa sangat rentan dan menjadi jalan masuk; (b) **audit adalah snapshot**: sistem yang patuh saat audit bisa berubah keesokan harinya; (c) **kontrol yang "ada" belum tentu efektif**: firewall ada tetapi aturannya buruk, log dikumpulkan tetapi tidak pernah dibaca; (d) **checkbox mentality**: organisasi memenuhi huruf persyaratan tanpa memahami tujuannya; (e) kerangka apa pun tidak mencakup semua ancaman, terutama yang baru.

7. Sampaikan dengan data dan skenario, bukan perdebatan teknis:
   (a) **Jelaskan apa yang firewall tidak bisa lakukan**: kredensial yang dicuri menghasilkan login yang sah. Firewall melihat trafik yang diizinkan dan tidak punya alasan memblokirnya. Firewall tidak dapat membedakan karyawan asli dan penyerang yang memakai passwordnya.
   (b) **Tunjukkan vektor nyata**: sebagian besar pelanggaran dimulai dari kredensial yang bocor atau phishing, bukan dari penyerang yang "menembus" firewall.
   (c) **Kuantifikasi**: berapa akun yang terekspos di kebocoran data publik (cek layanan seperti Have I Been Pwned untuk domain organisasi)? Berapa biaya downtime satu hari dibanding biaya lisensi MFA per tahun?
   (d) **Lakukan simulasi phishing** dan tunjukkan tingkat klik yang sesungguhnya. Data internal jauh lebih meyakinkan daripada statistik industri.
   (e) **Kaitkan dengan kepatuhan dan asuransi**: banyak polis asuransi siber kini mensyaratkan MFA, dan tanpa itu klaim bisa ditolak.
   (f) **Tawarkan penerapan bertahap**: mulai dari akun admin dan akses jarak jauh (dampak tertinggi, biaya terendah), baru meluas.

8. | Jalan masuk | Kontrol jaringan |
   |---|---|
   | **Phishing / rekayasa sosial** | Email security gateway, DMARC/SPF/DKIM, DNS filtering, web filtering, pelatihan |
   | **Kredensial lemah/bocor tanpa MFA** | MFA (FIDO2), 802.1X, monitoring login anomali, batasi akses admin ke jaringan manajemen |
   | **Layanan terekspos ke internet** (RDP, panel admin, database) | Audit permukaan serangan eksternal, VPN/ZTNA alih-alih ekspos langsung, firewall default-deny, port scanning berkala terhadap diri sendiri |
   | **Kerentanan belum di-patch pada perangkat perimeter** | Manajemen patch, IPS/virtual patching, inventaris aset, langganan advisory vendor |
   | **Salah konfigurasi** | Konfigurasi as-code + review, baseline hardening, audit otomatis, change control |
   | **Rantai pasokan** | Segmentasi akses vendor, monitoring koneksi pihak ketiga, review keamanan vendor |

</details>

---

## 13. Sumber

- NIST Cybersecurity Framework 2.0
- NIST SP 800-53 Rev.5: Security and Privacy Controls
- CIS Critical Security Controls v8
- MITRE ATT&CK: https://attack.mitre.org
- Lockheed Martin, *Cyber Kill Chain*
- UU No. 27 Tahun 2022 tentang Perlindungan Data Pribadi (Indonesia)
- Cisco CCNA 200-301 v1.1, topik 5.1 (threats, vulnerabilities, exploits, mitigation) dan 5.2 (security program elements)

---

**Berikutnya:** `12-keamanan/02-serangan-l2.md`. Serangan layer 2 dan mitigasinya.

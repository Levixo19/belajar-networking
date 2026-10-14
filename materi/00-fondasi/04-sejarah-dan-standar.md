# 00.4 — Sejarah Internet dan Badan Standar

> **Prasyarat:** `00-fondasi/01`
> **Tujuan:** Anda paham dari mana aturan jaringan berasal, bisa membaca RFC, dan mengerti bagaimana internet dikelola tanpa pemilik tunggal.

Modul ini terlihat "cuma teori", tetapi punya nilai praktis langsung: ketika Anda menemui perilaku aneh sebuah protokol, jawabannya ada di dokumen standarnya — dan Anda harus tahu cara mencarinya.

---

## 1. Garis Waktu Singkat

| Tahun | Peristiwa | Kenapa penting |
|---|---|---|
| 1961–64 | Paul Baran & Donald Davies mengusulkan **packet switching** | Ide dasar: pecah data jadi paket, kirim mandiri. Menggantikan circuit switching telepon. |
| 1969 | **ARPANET** hidup, 4 node (UCLA, SRI, UCSB, Utah) | Jaringan paket pertama yang beroperasi |
| 1971 | Ray Tomlinson mengirim **email** pertama, memilih simbol `@` | Aplikasi pembunuh pertama |
| 1973–74 | Vint Cerf & Bob Kahn merancang **TCP** | Cikal bakal protokol internet |
| 1978 | TCP dipecah jadi **TCP + IP** | Pemisahan tanggung jawab: IP mengantar, TCP menjamin |
| 1980 | **Ethernet** dikomersialkan (DIX: DEC-Intel-Xerox) | Standar LAN yang menang |
| 1983 | ARPANET beralih ke **TCP/IP** (1 Januari, "flag day") | Kelahiran internet modern |
| 1983 | **DNS** diciptakan (Paul Mockapetris) | Menggantikan file HOSTS.TXT yang tidak scalable |
| 1984 | Model **OSI** diterbitkan ISO | Model referensi 7 layer |
| 1985 | **NSFNET** — backbone akademik | Membuka internet ke universitas |
| 1989 | **CIDR** diusulkan; Tim Berners-Lee mengusulkan **World Wide Web** | Menyelamatkan pengalamatan; web lahir |
| 1991 | NSFNET dibuka untuk komersial | Internet menjadi bisnis |
| 1993 | Browser **Mosaic** | Web jadi populer massal |
| 1994 | **BGP-4** [RFC 1654] | Protokol routing antar-AS yang masih dipakai hari ini |
| 1995 | **SSL 2.0/3.0** | Enkripsi web |
| 1998 | **IPv6** distandarkan [RFC 2460] | Solusi kehabisan alamat |
| 1999 | **Wi-Fi** 802.11a/b | LAN nirkabel massal |
| 1999 | **TLS 1.0** [RFC 2246] | SSL menjadi standar terbuka |
| 2011 | **IANA kehabisan blok IPv4** (3 Feb) | Titik balik: NAT & IPv6 jadi keharusan |
| 2015 | **HTTP/2** [RFC 7540] | Multiplexing, akhir dari pipelining gagal |
| 2018 | **TLS 1.3** [RFC 8446] | Handshake 1-RTT, hapus cipher lemah |
| 2018 | **WPA3** | Perbaikan keamanan Wi-Fi |
| 2021 | **QUIC** [RFC 9000] & **HTTP/3** [RFC 9114] | Transport baru di atas UDP |
| 2021 | **Wi-Fi 6E** (band 6 GHz dibuka) | Spektrum baru |
| 2024 | **Wi-Fi 7 / 802.11be** disertifikasi | MLO, 320 MHz, 4096-QAM |
| 2024–2026 | RPKI melewati mayoritas rute IPv4 tercakup ROA | Keamanan routing internet membaik |
| ~2028 | **Wi-Fi 8 / 802.11bn** (perkiraan ratifikasi) | Fokus reliabilitas, bukan kecepatan puncak |

### Ide besar yang bertahan

1. **Packet switching** — data dipecah, tiap paket mandiri, jalur bisa berbeda. Tahan gangguan.
2. **End-to-end principle** — kecerdasan di ujung (host), jaringan di tengah dibuat sederhana. Inilah kenapa internet bisa membawa aplikasi yang belum ada saat ia dirancang.
3. **Best effort** — jaringan berusaha, tapi tidak menjamin. Jaminan dibangun di atasnya (TCP).
4. **Hourglass model** — banyak aplikasi di atas, banyak media di bawah, **satu IP di tengah**.

```
        HTTP  SMTP  DNS  SSH  RTP  QUIC ...      ← banyak aplikasi
              TCP        UDP                      ← beberapa transport
                    IP                            ← LEHER SEMPIT: hanya satu
        Ethernet  Wi-Fi  Fiber  5G  PPP ...       ← banyak media
```

Ini alasan filosofis mengapa IPv4→IPv6 begitu sulit: mengganti leher sempit berarti mengganti fondasi semuanya.

---

## 2. Siapa yang Mengatur Internet?

Jawaban singkat: **tidak ada satu pihak pun.** Yang ada adalah pembagian peran.

### 2.1 IETF — *Internet Engineering Task Force*

- Membuat standar **protokol internet**: IP, TCP, UDP, HTTP, DNS, TLS, BGP, QUIC.
- Terbuka: siapa pun bisa ikut milis dan menyumbang. Tidak ada keanggotaan formal.
- Prinsipnya: *"We reject kings, presidents and voting. We believe in rough consensus and running code."* (David Clark)
- Output: **RFC**.
- Situs: https://www.ietf.org, dokumen di https://datatracker.ietf.org

### 2.2 IEEE — *Institute of Electrical and Electronics Engineers*

- Membuat standar **layer 1 & 2**, khususnya keluarga **802**.
- Yang wajib Anda kenal:

| Standar | Isi |
|---|---|
| 802.1 | Bridging, VLAN (802.1Q), STP (802.1D/w/s), 802.1X (NAC) |
| 802.3 | **Ethernet** (semua kecepatan, PoE 802.3af/at/bt) |
| 802.11 | **Wi-Fi** (a/b/g/n/ac/ax/be/bn) |
| 802.15 | WPAN — Bluetooth (802.15.1), Zigbee (802.15.4) |
| 802.16 | WiMAX (sudah tidak relevan) |

### 2.3 ITU-T — *International Telecommunication Union*

- Badan PBB. Standar **telekomunikasi**: G.xxx (transmisi, DSL, GPON, kualitas suara), H.xxx (video/H.264, H.323), E.164 (nomor telepon internasional).
- Contoh relevan: G.114 (batas delay suara), G.984 (GPON), G.652 (serat single-mode).

### 2.4 ISO — *International Organization for Standardization*

- Membuat **model OSI** (ISO/IEC 7498-1) dan standar manajemen mutu/keamanan (ISO 27001).
- Ironis: model OSI menang sebagai *bahasa*, tapi protokol OSI kalah dari TCP/IP.

### 2.5 IANA & ICANN

- **IANA** (*Internet Assigned Numbers Authority*) — mengelola angka: blok IP, nomor AS, nomor port, nomor protokol, root DNS. Dijalankan oleh PTI di bawah ICANN.
- **ICANN** — mengelola nama domain & kebijakan.
- Registry angka: https://www.iana.org/protocols

### 2.6 RIR — *Regional Internet Registry*

Membagikan blok IP & nomor AS per wilayah:

| RIR | Wilayah |
|---|---|
| **APNIC** | Asia-Pasifik (termasuk **Indonesia**) |
| ARIN | Amerika Utara |
| RIPE NCC | Eropa, Timur Tengah, Asia Tengah |
| LACNIC | Amerika Latin & Karibia |
| AFRINIC | Afrika |

Di bawah RIR ada **NIR/LIR** (di Indonesia: IDNIC di bawah APJII) yang mengalokasikan ke ISP dan organisasi.

### 2.7 Lain-lain yang sering muncul

- **W3C** — standar web (HTML, CSS, DOM).
- **Wi-Fi Alliance** — sertifikasi interoperabilitas Wi-Fi & penamaan pemasaran ("Wi-Fi 6", "Wi-Fi 7"). Bukan pembuat standar — standarnya IEEE.
- **NIST** — publikasi keamanan AS yang jadi acuan global (SP 800-207 Zero Trust, SP 800-53).
- **PCI SSC** — PCI DSS untuk jaringan yang memproses kartu pembayaran.
- **TIA/EIA** — standar kabel terstruktur (TIA-568, TIA-942 untuk data center).
- **MANRS** — norma keamanan routing yang disepakati bersama operator.

---

## 3. RFC — Cara Membaca Standar Internet

**RFC** = *Request for Comments*. Nama yang menyesatkan: sebagian RFC adalah standar penuh, sebagian sekadar catatan, sebagian lelucon 1 April.

### 3.1 Status RFC

| Status | Arti |
|---|---|
| **Internet Standard (STD)** | Standar matang, diimplementasikan luas. Contoh: RFC 791 (IP), RFC 793→9293 (TCP) |
| **Proposed Standard** | Standar resmi yang dipakai; sebagian besar RFC penting ada di sini |
| **Draft Standard** | Tingkat lama, tidak dipakai lagi sejak 2011 |
| **Best Current Practice (BCP)** | Rekomendasi operasional. Contoh: BCP 38 (anti-spoofing) |
| **Informational** | Informasi, bukan standar |
| **Experimental** | Percobaan |
| **Historic** | Sudah usang/digantikan |

⚠️ **Selalu cek apakah sebuah RFC sudah "Obsoleted by".** Contoh nyata:
- TCP: RFC 793 → **RFC 9293** (2022)
- IPv6: RFC 2460 → **RFC 8200** (2017)
- HTTP/1.1: RFC 2616 → RFC 7230-7235 → **RFC 9110-9112** (2022)
- Terminologi DNS: tersebar → **RFC 9499**

### 3.2 Struktur sebuah RFC

```
Header       : nomor, penulis, tanggal, status, obsoletes/updates
Abstract     : ringkasan 1 paragraf
Introduction : latar belakang & masalah yang dipecahkan
Terminology  : definisi + pernyataan kata kunci RFC 2119
Body         : spesifikasi teknis (format paket, state machine, algoritma)
Security Considerations : WAJIB ada di setiap RFC
IANA Considerations     : angka apa yang perlu didaftarkan
References   : Normative (wajib) & Informative (pelengkap)
```

### 3.3 Kata kunci RFC 2119 / RFC 8174

Kata-kata ini punya arti hukum-teknis yang tepat:

| Kata | Arti |
|---|---|
| **MUST** / REQUIRED / SHALL | Wajib mutlak |
| **MUST NOT** / SHALL NOT | Dilarang mutlak |
| **SHOULD** / RECOMMENDED | Sangat disarankan; boleh menyimpang bila paham konsekuensinya |
| **SHOULD NOT** | Sangat tidak disarankan |
| **MAY** / OPTIONAL | Boleh, terserah implementor |

💡 Banyak masalah interoperabilitas berasal dari vendor yang memperlakukan SHOULD seperti MAY.

### 3.4 Cara mencari & membaca

```
https://www.rfc-editor.org/rfc/rfc9293       ← teks resmi
https://datatracker.ietf.org/doc/rfc9293/    ← status, riwayat, diskusi
https://www.rfc-editor.org/search/rfc_search.php   ← pencarian
```

Untuk pemula, **jangan mulai dengan membaca RFC dari awal sampai akhir.** Strategi yang efektif:
1. Baca Abstract dan Introduction.
2. Lompat ke bagian format paket / diagram header.
3. Cari bagian yang menjawab pertanyaan spesifik Anda.
4. Baca Security Considerations — sering paling mencerahkan.

### 3.5 RFC yang layak dibaca lebih awal

| RFC | Judul | Kenapa |
|---|---|---|
| 1180 | A TCP/IP Tutorial | Pengantar terbaik, mudah dibaca |
| 791 | Internet Protocol | Diagram header IPv4 klasik |
| 1918 | Address Allocation for Private Internets | Alamat privat |
| 2119 | Key words for use in RFCs | Wajib untuk membaca RFC lain |
| 9293 | TCP (menggantikan 793) | TCP modern lengkap |
| 1034/1035 | DNS concepts & implementation | Fondasi DNS |
| 8200 | IPv6 Specification | IPv6 modern |
| 8446 | TLS 1.3 | Keamanan transport modern |
| 9000 | QUIC | Transport masa depan |
| BCP 38 (2827) | Network Ingress Filtering | Anti-spoofing, tanggung jawab operator |

Daftar lengkap terkurasi ada di `referensi/daftar-rfc-penting.md`.

### 3.6 RFC 1 April

Tradisi IETF: setiap 1 April terbit RFC lelucon yang ditulis serius.
- **RFC 1149** — IP over Avian Carriers (IP lewat merpati pos). Pernah benar-benar diuji tahun 2001: 9 paket dikirim, 4 sampai, RTT 3.000–6.000 detik.
- **RFC 2324** — HTCPCP, protokol kontrol teko kopi. Sumber kode status **418 I'm a teapot** yang sungguhan diimplementasikan banyak server.

Bacalah — humor ini mengajarkan bahwa protokol adalah kesepakatan, bukan hukum alam.

---

## 4. Bagaimana Internet Terhubung Secara Ekonomi

Internet bukan satu jaringan, melainkan ~75.000+ jaringan otonom (**AS**, *Autonomous System*) yang saling sepakat bertukar trafik.

### Tier

| Tier | Ciri | Contoh |
|---|---|---|
| **Tier 1** | Bisa menjangkau seluruh internet **hanya lewat peering**, tidak membeli transit dari siapa pun | Lumen, Arelion, GTT, NTT, Telia |
| **Tier 2** | Peering + membeli transit dari Tier 1 | ISP nasional besar |
| **Tier 3** | Hanya membeli transit | ISP lokal/regional |

### Dua jenis hubungan

- **Transit** — Anda **membayar** agar trafik Anda diantar ke mana pun. Hubungan pelanggan–penyedia.
- **Peering** — dua jaringan bertukar trafik **pelanggan masing-masing** secara langsung, biasanya gratis (settlement-free), karena saling menguntungkan.

### IXP — *Internet Exchange Point*

Tempat fisik (biasanya data center netral) di mana banyak jaringan saling peering lewat satu switch fabric bersama. Manfaat: latency lebih rendah, biaya transit lebih kecil, trafik lokal tetap lokal.

- Indonesia: PeeringDB mencatat 80 IXP di Indonesia. Yang terbesar menurut jumlah jaringan anggota (per Oktober 2026, sumber [PeeringDB](https://www.peeringdb.com/api/ix?country=ID)): **JKT-IX** (868), **IIX-Jakarta** milik APJII (828), dan **OpenIXP/NiCE** (625). Ada juga IXP internasional di Jakarta seperti **DE-CIX Jakarta** (177) dan Equinix Jakarta, IXP lain seperti **CDIX** (84), serta node IIX daerah (Jabar, Jateng, Jawa Timur, Bali, Jogja, Lampung, Sumut, dan lain-lain). Angka ini berubah terus, jadi cek PeeringDB untuk data terbaru.
- Komunitas operator jaringan Indonesia berkumpul di **ID-NOG** ([idnog.or.id](https://idnog.or.id/)), tempat engineer ISP, IXP, dan data center berbagi pengalaman operasional.
- Global besar: AMS-IX (Amsterdam), DE-CIX (Frankfurt), LINX (London), Equinix IX.

💡 Inilah alasan teknis mengapa mengakses situs lokal terasa lebih cepat: trafik tidak keluar negeri. Kalau situs "Indonesia" ternyata lambat, sering karena kontennya sebenarnya di-hosting di luar negeri.

### ASN dan blok IP

- **ASN** (*Autonomous System Number*) — identitas jaringan di BGP. Contoh: AS15169 (Google), AS13335 (Cloudflare). Dulu 16-bit (0–65535), sekarang 32-bit.
- Organisasi yang punya minimal dua koneksi upstream (multihoming) biasanya mengambil ASN + blok IP sendiri dari RIR agar bisa ber-BGP. Detail di `07-routing-lanjutan/06`.

```bash
# Lihat AS pemilik sebuah IP
$ whois -h whois.cymru.com " -v 1.1.1.1"
AS      | IP        | AS Name
13335   | 1.1.1.1   | CLOUDFLARENET, US
```

---

## 5. Bagaimana Standar Baru Lahir (Studi Kasus: QUIC)

Berguna dipahami karena menunjukkan bahwa standar bukan turun dari langit.

1. **Masalah nyata** — Google mengukur bahwa handshake TCP+TLS memakan 2–3 RTT, dan head-of-line blocking TCP merusak HTTP/2 di jaringan dengan loss.
2. **Eksperimen** — Google membuat "gQUIC" di atas UDP, dipasang di Chrome & server Google, diukur pada trafik nyata jutaan pengguna.
3. **Dibawa ke IETF (2016)** — dibentuk working group; desain dirombak agar netral vendor dan memakai TLS 1.3 standar.
4. **Draft berulang** — puluhan versi draft, interop testing antar-implementasi.
5. **RFC terbit (2021)** — RFC 8999/9000/9001/9002 (QUIC) dan RFC 9114 (HTTP/3).
6. **Adopsi** — browser, CDN, server. Jaringan enterprise mulai harus memutuskan: izinkan UDP/443 atau paksa fallback ke TCP.

Pelajarannya: **implementasi nyata mendahului standar**, dan standar yang menang adalah yang menyelesaikan masalah terukur.

---

## 6. Praktik

```bash
# Siapa pemilik domain & IP
$ whois example.com
$ whois 8.8.8.8

# ASN dan prefix
$ whois -h whois.radb.net AS15169

# Lihat nomor port resmi (registry IANA)
$ curl -s https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.csv | head

# Di Linux, salinan lokal registry port & protokol
$ grep -E '^(http|https|ssh|domain)\b' /etc/services
$ head -20 /etc/protocols
```

Latihan membaca RFC:
```
1. Buka https://www.rfc-editor.org/rfc/rfc1180  (TCP/IP Tutorial)
2. Baca bagian 1–3 saja.
3. Bandingkan diagram enkapsulasinya dengan modul 01-model-referensi/03.
```

---

## 7. Ringkasan

- Internet lahir dari ARPANET; TCP/IP menjadi standar pada 1983.
- Ide besar yang bertahan: packet switching, end-to-end principle, best effort, hourglass model.
- Pembagian peran: **IETF** (protokol/RFC), **IEEE** (802 — Ethernet & Wi-Fi), **ITU-T** (telekomunikasi), **ISO** (OSI), **IANA/ICANN** (angka & nama), **RIR** (alokasi IP per wilayah — APNIC untuk Indonesia).
- RFC punya status; selalu cek "Obsoleted by". Kata MUST/SHOULD/MAY punya arti tepat [RFC 2119].
- Internet terhubung lewat **transit** (bayar) dan **peering** (tukar), dipusatkan di **IXP**.
- Standar baru lahir dari masalah terukur + implementasi nyata, lalu dibakukan.

---

## 8. Latihan

1. Apa perbedaan peran IETF dan IEEE? Beri satu contoh standar dari masing-masing yang Anda pakai setiap hari.
2. RFC 2460 mendefinisikan IPv6. Kenapa Anda tidak boleh memakainya sebagai rujukan hari ini?
3. Jelaskan perbedaan transit dan peering dari sisi uang dan sisi rute.
4. RIR mana yang mengalokasikan IP untuk Indonesia? Organisasi apa di bawahnya?
5. Sebuah spesifikasi menulis "implementations SHOULD support X". Bolehkah vendor tidak mendukung X?
6. Kenapa model hourglass membuat migrasi ke IPv6 sulit?

<details>
<summary>Jawaban</summary>

1. IETF membuat standar protokol internet (layer 3 ke atas) lewat RFC — contoh: HTTP, TCP, DNS yang Anda pakai saat membuka web. IEEE membuat standar layer 1–2 keluarga 802 — contoh: 802.3 Ethernet (kabel LAN) dan 802.11 Wi-Fi.

2. Karena RFC 2460 sudah **obsolete**, digantikan **RFC 8200** (2017). Merujuk dokumen usang berisiko mengutip perilaku yang sudah diubah (mis. penanganan extension header dan fragmentasi).

3. **Transit**: hubungan pelanggan–penyedia; pelanggan **membayar**, dan penyedia mengumumkan rute pelanggan ke seluruh internet (pelanggan mendapat akses ke *semua* tujuan). **Peering**: dua pihak setara bertukar **hanya rute pelanggan masing-masing**, umumnya tanpa bayaran; tidak memberi akses ke seluruh internet.

4. **APNIC** (Asia-Pacific). Di bawahnya ada NIR **IDNIC** yang dikelola **APJII** untuk alokasi di Indonesia.

5. Boleh, tetapi hanya jika mereka benar-benar memahami konsekuensinya (RFC 2119: SHOULD = "mungkin ada alasan sah untuk menyimpang dalam keadaan tertentu, tetapi implikasi penuhnya harus dipahami dan ditimbang"). Dalam praktik, tidak mendukung sesuatu yang SHOULD sering menyebabkan masalah interoperabilitas.

6. Karena IP adalah leher sempit tunggal yang menjadi tumpuan **semua** aplikasi di atas dan **semua** media di bawah. Mengganti leher berarti setiap host, router, firewall, aplikasi, dan sistem manajemen harus berubah — tanpa hari-H bersama, sehingga IPv4 dan IPv6 harus hidup berdampingan (dual stack) untuk waktu yang sangat lama.

</details>

---

## 9. Sumber

- IETF — https://www.ietf.org · Datatracker — https://datatracker.ietf.org
- RFC Editor — https://www.rfc-editor.org
- IEEE 802 — https://www.ieee802.org
- IANA protocol registries — https://www.iana.org/protocols
- APNIC — https://www.apnic.net · IDNIC/APJII — https://www.apjii.or.id
- MANRS — https://www.manrs.org
- RFC 1180 (TCP/IP Tutorial), RFC 2119, RFC 8174

---

**Berikutnya:** `00-fondasi/05-topologi.md` — bentuk-bentuk susunan jaringan dan konsekuensinya.

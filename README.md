# Kurikulum Networking: Dari Nol Sampai Profesional

Materi belajar jaringan komputer berbahasa Indonesia, disusun **berurutan tanpa lompatan**.
Setiap modul hanya memakai konsep yang sudah dijelaskan di modul sebelumnya.

Disusun dengan mengacu pada blueprint resmi:
- **Cisco CCNA 200-301 v1.1** (6 domain, berlaku sampai 2 Feb 2027)
- **CompTIA Network+ N10-009** (5 domain)
- **MikroTik MTCNA/MTCRE** — RouterOS mendominasi pasar Indonesia
- RFC IETF, standar IEEE 802, NIST SP 800-207
- Materi profesional: otomasi, cloud, data center, SDN, observability

### Tiga platform, satu konsep

Setiap modul menyertakan padanan perintah untuk **tiga platform** sekaligus:

| Platform | Kenapa |
|---|---|
| **Cisco IOS** | Standar industri, dasar sertifikasi CCNA/CCNP |
| **MikroTik RouterOS** | Dominan di ISP kecil, RT/RW-Net, hotel, dan UKM Indonesia |
| **Linux** | Dasar semua server, container, dan cloud |

Memahami satu konsep di tiga platform membuat Anda **tidak terikat vendor** — dan itulah tanda engineer yang sesungguhnya.

---

## Struktur Repositori

```
.
├── README.md ................... berkas ini — peta jalan & cara memakai
├── SILABUS.md .................. rincian per modul, untuk cek celah pengetahuan
├── materi/ ..................... seluruh bahan belajar
│   ├── 00-fondasi/ … 19-mikrotik/    modul teori, berurutan
│   ├── 20-proyek-akhir/              studi kasus penutup, 9 babak
│   ├── lab/                          lab praktik bertahap
│   └── referensi/                    cheatsheet, tabel, glosarium, bank soal
├── docs/ ....................... panduan operasional
│   └── menjalankan-aplikasi.md       cara menyalakan & merawat aplikasi
└── app/ ........................ aplikasi belajar interaktif (MERN)
```

---

## Cara Memakai Repositori Ini

### 1. Baca berurutan, jangan melompat
Semua materi ada di **`materi/`**. Nomor folder = urutan belajar: `00-fondasi` → `18-karier-sertifikasi`.
Setiap berkas diberi nomor juga. Baca `materi/00-fondasi/01-*.md` dulu, sampai habis, baru lanjut.

### 2. Setiap modul punya struktur sama

| Bagian | Isi |
|---|---|
| **Prasyarat** | Modul apa yang wajib dipahami dulu |
| **Tujuan Belajar** | Apa yang bisa Anda lakukan setelah modul ini |
| **Analogi Dunia Nyata** | Penjelasan awam sebelum masuk teknis |
| **Materi** | Penjelasan bertahap, dari "apa" → "kenapa" → "bagaimana" |
| **Praktik** | Command nyata (Linux/Windows/Cisco) yang bisa langsung dicoba |
| **Kesalahan Umum** | Jebakan yang sering bikin pemula bingung |
| **Ringkasan** | Poin kunci |
| **Latihan** | Soal + jawaban tersembunyi |
| **Sumber** | RFC/dokumentasi resmi untuk pendalaman |

### 3. Jangan cuma membaca — praktikkan
Mulai dari **`materi/lab/00-setup-lab.md`** setelah selesai `01-model-referensi`.
Semua lab bisa dijalankan gratis (Containerlab/GNS3/Packet Tracer/Linux namespace).

### 4. Ukur diri sendiri
`materi/referensi/soal-latihan.md` berisi bank soal per tahap. Kerjakan sebelum lanjut tahap berikutnya.
Target minimal **80% benar** sebelum naik tahap.

---

## Peta Jalan Lengkap

Semua jalur di bawah relatif terhadap **`materi/`**.

```
TAHAP DASAR (Minggu 1–6) ─ tidak butuh pengetahuan apa pun sebelumnya
├── 00-fondasi ................. Bit, biner, sinyal, istilah dasar
├── 01-model-referensi ......... OSI, TCP/IP, enkapsulasi
├── 02-layer-fisik ............. Kabel, fiber, konektor, sinyal
├── 03-data-link ............... Ethernet, MAC, switch, VLAN, STP
├── 04-network-layer ........... IP, subnetting, ARP, ICMP, routing dasar
├── 05-transport ............... TCP, UDP, port, congestion control
└── 06-aplikasi ................ DNS, DHCP, HTTP, TLS, email, dll

TAHAP MENENGAH (Minggu 7–16) ─ setara CCNA + Network+
├── 07-routing-lanjutan ........ Static, RIP, OSPF, EIGRP, BGP, FHRP
├── 08-ipv6 .................... Alamat, SLAAC, NDP, transisi
├── 09-nat-acl-firewall ........ NAT/PAT, ACL, firewall, IDS/IPS
├── 10-wireless ................ RF, 802.11, WPA3, desain WLAN
└── 11-wan-vpn ................. MPLS, SD-WAN, IPsec, WireGuard, QoS

TAHAP LANJUT (Minggu 17–30) ─ setara CCNP + praktik industri
├── 12-keamanan ................ Serangan & mitigasi per layer, AAA, Zero Trust
├── 13-linux-networking ........ ip, nftables, namespace, DNS/DHCP server
├── 14-monitoring-troubleshoot .. Metodologi, tcpdump, Wireshark, NetFlow, Grafana
└── 15-otomasi ................. Python, Ansible, NETCONF, gNMI, NetBox, CI/CD

TAHAP PROFESIONAL (Minggu 31–52)
├── 16-datacenter-cloud-sdn .... Spine-leaf, VXLAN/EVPN, VPC, Kubernetes, SDN
├── 17-desain-arsitektur ....... Desain kampus/DC/WAN, HA, dokumentasi, migrasi
└── 18-karier-sertifikasi ...... Roadmap sertifikasi, portofolio, interview

JALUR KHUSUS (bisa dimulai setelah Tahap 4)
└── 19-mikrotik ................ RouterOS mendalam: bridge/VLAN, firewall,
                                 hotspot, queue, wireless, tunnel, scripting

PENUNJANG (dipakai sepanjang jalan)
├── lab/ ....................... ±34 lab praktik bertahap (7 berkas per area)
└── referensi/ ................. Cheatsheet, tabel subnet, port, glosarium, soal

PROYEK AKHIR (setelah semua modul + lab selesai)
└── 20-proyek-akhir/ ........... Satu studi kasus berkelanjutan, 9 babak dengan
                                 bentuk kerja berbeda: audit, penjurian desain,
                                 teka-teki alamat, kerja lab, hitungan RF,
                                 tim merah/biru, otomasi, simulasi jaga malam,
                                 rapat direksi — plus sidang & penilaian 1230 poin
```

---

## Proyek Akhir: Menguji Diri Sendiri

Setelah seluruh modul dan lab selesai, kerjakan **`materi/20-proyek-akhir/`**. Isinya satu studi kasus
berkelanjutan — **PT Bahari Nusantara Segar**, perusahaan ekspor hasil laut beku dengan 3 situs,
20 titik pengumpulan di pesisir, pabrik bersuhu −25 °C, dan kewajiban merekam suhu tanpa putus.

Yang membedakannya dari `materi/referensi/soal-latihan.md`: bank soal menguji hafalan per topik,
proyek akhir menguji apakah Anda bisa **memakai semuanya sekaligus** pada masalah yang tidak
memberi tahu jawabannya. Sembilan babak, dan **tiap babak bentuk kerjanya berbeda**:

| Babak | Bentuk kerja |
|---|---|
| 1 | Forensik — bedah konfigurasi warisan yang "katanya sudah jalan" |
| 2 | Penjurian — nilai 3 proposal vendor, lalu rancang sendiri |
| 3 | Teka-teki presisi — satu blok alamat sempit, dengan checksum verifikasi mandiri |
| 4 | Kerja tangan di lab + matriks uji terima PASS/FAIL (separuhnya uji negatif) |
| 5 | Hitungan fisika RF & kapasitas penyimpanan |
| 6 | Adversarial — sepuluh serangan, Anda yang bertahan |
| 7 | Menulis kode yang benar-benar jalan (idempoten, teruji) |
| 8 | Simulasi jaga malam bercabang, dikejar waktu, dengan keputusan bisnis |
| 9 | Rapat direksi — anggaran dipotong 35%, jelaskan tanpa jargon |

Ditutup sidang 40 pertanyaan + tantangan mengajar, dan penilaian 1230 poin lengkap dengan
**peta perbaikan**: nilai rendah di babak tertentu menunjuk modul mana yang harus diulang.
Hasil akhirnya satu repositori berisi 14 dokumen — sekaligus portofolio untuk wawancara kerja.

---

## Estimasi Waktu

| Intensitas | Durasi 0 → profesional |
|---|---|
| 1 jam/hari (7 jam/minggu) | ~12 bulan |
| 2 jam/hari (14 jam/minggu) | ~6–7 bulan |
| Full-time (40 jam/minggu) | ~3 bulan (intensif) |

Angka ini termasuk waktu lab. **Tanpa lab, waktu belajar Anda terbuang** — teori jaringan tidak menempel tanpa tangan yang mengetik command.

---

## Prinsip Belajar yang Dipakai di Sini

1. **Konkret sebelum abstrak.** Anda lihat paket nyata di Wireshark sebelum menghafal nama field.
2. **Satu konsep baru per bagian.** Kalau sebuah istilah muncul, ia sudah dijelaskan atau dijelaskan saat itu.
3. **Kenapa sebelum bagaimana.** Setiap protokol dimulai dari "masalah apa yang ia pecahkan".
4. **Ulang dengan sudut berbeda.** Konsep penting (mis. subnetting, TCP handshake) muncul lagi di lab dan troubleshooting.
5. **Tidak ada "nanti akan dijelaskan".** Kalau perlu maju, ada pointer eksplisit ke modul mana.

---

## Untuk Siapa Materi Ini

- **Pemula total** — belum pernah tahu apa itu IP address. Mulai dari `materi/00-fondasi/01`.
- **Sudah paham dasar** — pakai `SILABUS.md` untuk cek celah pengetahuan, lompat ke bagian yang belum dikuasai (ini satu-satunya "lompatan" yang diizinkan: melewati apa yang sudah Anda kuasai, bukan melewati prasyarat).
- **Sysadmin/DevOps** — jalur cepat: `01`, `04`, `05`, `06`, `13`, `16`.
- **Persiapan CCNA** — `00`–`11` + `15` + lab. Peta ke blueprint ada di `materi/18-karier-sertifikasi/02-peta-ccna.md`.
- **Persiapan MTCNA / kerja di ISP-RT/RW-Net** — `00`–`04`, `06`, `07.1`, `09`, lalu **seluruh `materi/19-mikrotik`**. Peta ke blueprint MTCNA ada di `materi/18-karier-sertifikasi/05-peta-mikrotik.md`.

---

## Konvensi Penulisan

- Command yang diawali `$` = shell Linux biasa (user).
- Command yang diawali `#` = butuh root.
- Command yang diawali `R1#` atau `SW1(config)#` = CLI Cisco IOS.
- Command yang diawali `/ip address` atau `[admin@MikroTik] >` = CLI MikroTik RouterOS.
- `PS>` = PowerShell Windows.
- Blok `⚠️` = jebakan/kesalahan umum.
- Blok `💡` = tip praktik lapangan.
- `[RFC xxxx]` = rujukan standar resmi.

---

## Mulai Sekarang

```
👉 Buka: materi/00-fondasi/01-apa-itu-jaringan.md
```

Atau jalankan aplikasi belajarnya — lihat `docs/menjalankan-aplikasi.md`.

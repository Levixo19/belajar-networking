# 01.2 Model TCP/IP

> **Prasyarat:** `01-model-referensi/01`
> **Tujuan:** Anda paham model yang benar-benar dipakai internet, bisa memetakannya ke OSI, dan tahu kapan memakai istilah yang mana.

---

## 1. Kenapa Ada Dua Model?

Sejarah singkat yang menjelaskan kebingungan ini:

- **1970-an:** ARPANET mengembangkan TCP/IP secara praktis — bangun dulu, standarkan kemudian.
- **1977-1984:** ISO mengembangkan OSI secara teoretis — rancang dulu dengan sempurna, implementasi kemudian.
- **1983:** ARPANET beralih ke TCP/IP. Sudah bekerja, sudah dipakai, gratis.
- **1980-90-an:** Pemerintah AS dan Eropa sempat mewajibkan OSI (GOSIP). Gagal.
- **Hasil akhir:** **TCP/IP menang sebagai implementasi. OSI menang sebagai kosakata.**

Itulah kenapa hari ini orang berkata "masalah layer 3" (istilah OSI) sambil menunjuk paket IP (protokol TCP/IP).

---

## 2. Model TCP/IP: Versi 4 Layer

Ini versi resmi menurut [RFC 1122].

```
┌──────────────────────────────────────────────────┐
│  4. APPLICATION                                  │
│     HTTP, DNS, SMTP, FTP, SSH, DHCP, SNMP, TLS   │
├──────────────────────────────────────────────────┤
│  3. TRANSPORT                                    │
│     TCP, UDP, (QUIC, SCTP)                       │
├──────────────────────────────────────────────────┤
│  2. INTERNET                                     │
│     IPv4, IPv6, ICMP, ICMPv6, IGMP, IPsec        │
├──────────────────────────────────────────────────┤
│  1. LINK (Network Access / Network Interface)    │
│     Ethernet, Wi-Fi, PPP, driver NIC, kabel      │
└──────────────────────────────────────────────────┘
```

### Pemetaan ke OSI

```
        OSI                          TCP/IP (4 layer)
   ┌──────────────┐
   │ 7 Application│  ┐
   ├──────────────┤  │
   │ 6 Presentation│ ├──────────►   4. Application
   ├──────────────┤  │
   │ 5 Session    │  ┘
   ├──────────────┤
   │ 4 Transport  │  ──────────►   3. Transport
   ├──────────────┤
   │ 3 Network    │  ──────────►   2. Internet
   ├──────────────┤
   │ 2 Data Link  │  ┐
   ├──────────────┤  ├──────────►   1. Link
   │ 1 Physical   │  ┘
   └──────────────┘
```

Perbedaan intinya:
- OSI memecah lapisan atas menjadi tiga (5, 6, 7); TCP/IP menggabungkannya menjadi satu.
- OSI memecah lapisan bawah menjadi dua (1, 2); TCP/IP menggabungkannya menjadi satu.

---

## 3. Model TCP/IP: Versi 5 Layer (Hybrid)

Karena menggabungkan physical dan data link menyulitkan pengajaran (kabel dan MAC address jelas hal berbeda), banyak buku memakai versi 5 layer:

```
5. Application     ← HTTP, DNS, SMTP
4. Transport       ← TCP, UDP
3. Network         ← IP, ICMP
2. Data Link       ← Ethernet, Wi-Fi, MAC
1. Physical        ← kabel, sinyal, konektor
```

Ini yang dipakai buku Kurose & Ross dan sebagian besar kuliah jaringan. Dalam kurikulum ini kita akan memakai **nomor OSI** untuk pembicaraan sehari-hari (karena itu yang dipakai industri) tetapi **struktur TCP/IP** untuk memahami protokol nyata.

---

## 4. Layer Demi Layer (TCP/IP)

### 4.1 Link Layer

**Tugas:** memindahkan datagram IP antar-perangkat yang **terhubung langsung** di media yang sama.

Yang termasuk: driver NIC, Ethernet, Wi-Fi, PPP, tunnel (GRE/VXLAN), dan seluruh perangkat keras di bawahnya.

Ciri penting: **link layer berbeda-beda di setiap hop.** Paket yang sama bisa melintasi Wi-Fi, lalu Ethernet, lalu serat optik, lalu link seluler. IP tidak peduli — inilah kekuatan desainnya.

### 4.2 Internet Layer

**Tugas:** mengantar datagram dari host mana pun ke host mana pun, lintas jaringan.

Protokol intinya **IP**. Ciri IP:
- **Connectionless** — tidak ada handshake, setiap paket berdiri sendiri.
- **Best effort** — tidak ada jaminan sampai, tidak ada jaminan urutan, tidak ada jaminan tanpa duplikasi.
- **Unreliable secara sengaja** — keandalan diserahkan ke layer atas (TCP) atau ke aplikasi.

Ini keputusan desain paling penting dalam sejarah internet. Dengan membuat lapisan tengah sesederhana mungkin, IP bisa berjalan di atas media apa pun dan membawa aplikasi apa pun — termasuk yang belum ditemukan saat IP dirancang.

Pendamping IP:
- **ICMP** — pelaporan error dan diagnostik (`ping`, `traceroute`, "destination unreachable", "fragmentation needed").
- **IGMP / MLD** — manajemen keanggotaan grup multicast.
- **IPsec** — enkripsi & autentikasi di layer internet.

> [!WARNING]
> ICMP **bukan** protokol layer 4. Ia berjalan langsung di dalam IP (protokol nomor 1) dan merupakan bagian tak terpisahkan dari layer internet.

### 4.3 Transport Layer

**Tugas:** komunikasi antar-proses, dan menambahkan keandalan bila diperlukan.

- **TCP** — andal, berurutan, byte-stream, dengan flow & congestion control.
- **UDP** — tipis, tanpa jaminan, hanya menambahkan port dan checksum.
- **QUIC** — berjalan di atas UDP, menyediakan keandalan + enkripsi + multiplexing. Secara arsitektural menempati peran transport.
- **SCTP** — multi-streaming & multi-homing; dipakai di jaringan telekomunikasi (Diameter, S1AP).

### 4.4 Application Layer

**Tugas:** segala sesuatu yang spesifik terhadap aplikasi — format pesan, semantik, sesi, enkripsi aplikasi.

Karena TCP/IP tidak memisahkan session dan presentation, semua itu masuk ke sini: HTTP, DNS, SMTP, TLS, SSH, gRPC, MQTT, dan seterusnya.

---

## 5. Kenapa TCP/IP Menang

Layak dipahami karena pelajarannya berulang di industri.

| Faktor | TCP/IP | OSI |
|---|---|---|
| Waktu tersedia | Sudah jalan sejak 1983 | Spesifikasi selesai belakangan |
| Biaya | Gratis, implementasi BSD terbuka | Implementasi komersial mahal |
| Kompleksitas | Sederhana, cukup baik | Sangat lengkap, berat |
| Proses | Bottom-up: kode dulu, standar kemudian | Top-down: standar dulu, kode kemudian |
| Fleksibilitas | Longgar, mudah diperluas | Kaku |

Prinsip yang lahir dari sini dan masih dikutip di IETF:
> *"Rough consensus and running code."*

---

## 6. Hourglass Model

```
   Banyak aplikasi:
   HTTP  SMTP  DNS  SSH  RTP  SNMP  MQTT  gRPC  QUIC ...
        ╲    ╲   │   ╱    ╱     ╱
         ╲    ╲  │  ╱    ╱     ╱
   Beberapa transport:   TCP    UDP
                  ╲       │      ╱
                   ╲      │     ╱
   LEHER SEMPIT:  ══════ IP ══════      ← hanya SATU
                   ╱      │     ╲
                  ╱       │      ╲
   Banyak media:
   Ethernet  Wi-Fi  PPP  Fiber  5G  Bluetooth  Satelit ...
```

Tiga konsekuensi praktis:

1. **Inovasi bebas di atas dan di bawah.** Wi-Fi 7 dan HTTP/3 lahir tanpa mengubah IP.
2. **Mengubah leher sangat sulit.** Itulah kisah IPv4→IPv6: bukan masalah teknis, tapi masalah "semua orang harus berubah bersamaan".
3. **Apa pun yang menembus leher menjadi universal.** Karena itu banyak protokol modern memilih berjalan di atas UDP/443 — melewati middlebox yang hanya mengizinkan trafik web.

---

## 7. Prinsip Arsitektur Internet

Bagian 6 menunjukkan *bentuk* arsitektur internet (jam pasir). Bagian ini membahas *alasan* di balik bentuk itu: beberapa prinsip desain yang ditulis para perancangnya pada 1980-an dan masih menjelaskan perilaku jaringan hari ini, dari kenapa router boleh di-reboot tanpa memutus unduhan Anda sampai kenapa QUIC berjalan di atas UDP. RFC 1958 merangkumnya dalam satu kalimat yang sering dikutip:

> "the goal is connectivity, the tool is the Internet Protocol, and the intelligence is end to end rather than hidden in the network." (RFC 1958, bagian 2.1)

### 7.1 Argumen end-to-end

Saltzer, Reed, dan Clark (1984) mengajukan argumen yang kemudian menjadi salah satu prinsip terpenting dalam desain sistem. Bentuk ringkasnya: **sebuah fungsi hanya bisa diwujudkan secara lengkap dan benar oleh aplikasi di kedua ujung komunikasi. Menyediakannya di dalam jaringan tidak bisa menggantikan pemeriksaan di ujung; versi parsial di jaringan hanya layak sebagai optimasi kinerja.**

Contoh yang mereka pakai adalah *careful file transfer*: memindahkan berkas dari disk komputer A ke disk komputer B dengan benar. Hitung di mana saja berkas itu bisa rusak:

```
 Disk A ──► baca oleh sistem berkas A ──► buffer aplikasi A ──► stack jaringan A
   (1) sektor buruk      (2) bug software       (3) memori rusak
                                                            │
                                                            ▼
                                   jaringan: hop 1 ──► hop 2 ──► ... ──► hop n
                                   (4) bit error di link, (5) memori router rusak,
                                   (6) paket hilang/duplikat/tertukar
                                                            │
                                                            ▼
 Disk B ◄── tulis oleh sistem berkas B ◄── buffer aplikasi B ◄── stack jaringan B
   (9) gagal tulis       (8) bug software        (7) memori rusak, host crash
```

Andaikan jaringan dibuat **sempurna andal**: setiap hop memeriksa CRC dan mengirim ulang frame yang rusak. Risiko (4) dan (6) memang turun, tetapi (1), (2), (3), (5), (7), (8), dan (9) tetap ada. Untuk benar-benar yakin, aplikasi tetap harus menghitung checksum seluruh berkas di A, menghitung ulang di B, dan mengulang kalau berbeda. Begitu pemeriksaan ujung-ke-ujung itu ada, keandalan di dalam jaringan **tidak lagi diperlukan untuk kebenaran**.

Risiko (5) bukan teori. Stone dan Partridge (2000) menganalisis paket yang lolos CRC link layer tetapi gagal checksum TCP, dan menemukan bahwa sebagian kerusakan terjadi **di dalam perangkat**, termasuk router dan host, di antara saat CRC diperiksa dan saat CRC dihitung ulang untuk link berikutnya. Router menerima frame (CRC benar), menyalinnya di memori yang bermasalah, lalu menghitung CRC baru untuk data yang sudah rusak. Link berikutnya melihat CRC yang "benar" untuk data yang salah.

**Contoh: replikasi backup bank dari DC Jakarta ke DRC Batam.** Tim infrastruktur memakai link MPLS dari provider yang menjanjikan "tanpa error". Itu janji tentang link, bukan tentang memori router provider, NIC server, atau sistem berkas. Praktik yang benar adalah membandingkan hash di kedua sisi, misalnya:

```bash
sha256sum backup-2026-10-12.dump            # di Jakarta
sha256sum backup-2026-10-12.dump            # di Batam, hasil harus identik
```

Alat seperti `rsync` memverifikasi isi berkas yang ditransfer dengan checksum di sisi penerima, dan basis data serius menyimpan checksum per blok. Itu argumen end-to-end yang dipraktikkan.

**Lalu kenapa link layer tetap punya CRC dan retransmisi?** Karena prinsip itu membolehkan versi parsial **sebagai optimasi**. Peterson & Davie memberi contoh yang tepat: mendeteksi dan mengirim ulang satu frame rusak di satu hop jauh lebih murah daripada mengirim ulang seluruh berkas dari ujung. Hitungannya untuk Wi-Fi:

```
Link Wi-Fi dengan peluang frame rusak 20% per percobaan.

Tanpa retransmisi di link layer:
  TCP melihat loss 20% → throughput TCP runtuh (TCP mengira jaringan macet)

Dengan sampai 4 kali percobaan di link layer:
  Peluang gagal keempatnya = 0,2^4 = 0,0016 = 0,16%
  Loss yang dilihat TCP turun dari 20% menjadi 0,16%
```

Retransmisi 802.11 tidak menjamin kebenaran (TCP dan aplikasi tetap memeriksa), tetapi ia menyelamatkan kinerja. Sebaliknya, retransmisi yang terlalu gigih di link berbahaya: menunda paket VoIP sampai tidak berguna, dan membuat TCP salah menaksir RTT. Batasnya selalu pertanyaan desain: **seberapa banyak fungsi di dalam jaringan sebelum ia lebih banyak merugikan aplikasi yang tidak membutuhkannya?**

### 7.2 Fate-sharing

David Clark (1988) menuliskan tujuan desain internet ARPA dalam urutan prioritas. Tujuan pertama adalah **komunikasi harus tetap berjalan walaupun ada jaringan atau gateway yang gagal**. Tujuan terakhir, ketujuh, adalah akuntabilitas sumber daya. Urutan ini menjelaskan banyak hal: internet sangat tahan terhadap kegagalan, tetapi lemah dalam penagihan, autentikasi sumber, dan keamanan, karena hal-hal itu memang bukan prioritas awal.

Untuk mencapai tujuan pertama, Clark memakai prinsip **fate-sharing**. RFC 1958 merumuskannya: state tentang komunikasi ujung-ke-ujung sebaiknya disimpan hanya di ujung, sehingga state itu hanya hilang ketika ujung itu sendiri rusak.

```
Telepon klasik (circuit):                Internet (datagram):
  state panggilan ada di setiap sentral    state koneksi TCP hanya di dua host
  ┌───┐   ┌────┐   ┌────┐   ┌───┐          ┌───┐   ┌──┐   ┌──┐   ┌───┐
  │ A ├───┤SW1 ├───┤SW2 ├───┤ B │          │ A ├───┤R1├───┤R2├───┤ B │
  └───┘   └────┘   └─╳──┘   └───┘          └───┘   └──┘   └╳─┘   └───┘
                     SW2 mati                              R2 mati
  → panggilan putus, harus dial ulang       → routing mencari jalur lain,
                                              koneksi TCP selamat kalau jalur
                                              baru siap sebelum timeout
```

Router tidak menyimpan apa pun tentang koneksi Anda, jadi kehilangan router tidak menghilangkan koneksi Anda. Nasib koneksi "berbagi takdir" hanya dengan host yang memegangnya, dan kalau host itu mati, koneksinya memang tidak ada gunanya lagi.

**Pelanggaran fate-sharing di jaringan nyata: CGNAT.** Karena IPv4 habis, banyak ISP seluler dan fixed broadband di Indonesia memakai Carrier-Grade NAT. CGNAT menyimpan state per sesi **di tengah jaringan**. Misalkan satu perangkat CGNAT melayani 20.000 pelanggan dan rata-rata setiap pelanggan punya 150 sesi aktif (angka ilustrasi):

```
State di CGNAT = 20.000 × 150 = 3.000.000 entri translasi
```

Kalau perangkat itu mati dan cadangannya tidak menyinkronkan state, tiga juta sesi putus serentak walaupun semua host dan semua jalur lain sehat. Karena itu firewall dan NAT berpasangan butuh sinkronisasi state (misalnya `conntrackd` di Linux, atau fitur sinkronisasi sesi di perangkat vendor), dan itu pun mahal serta tidak sempurna. Setiap kotak stateful di jalur adalah titik tempat prinsip fate-sharing dikorbankan demi fungsi lain.

### 7.3 Narrow waist, dilihat lebih dalam

Bagian 6 menggambar jam pasir. Pertanyaan yang lebih tajam: **apa yang membuat IP layak jadi leher?** Jawabannya justru karena IP berjanji sangat sedikit: alamat global dan pengantaran datagram *best effort*. Setiap fitur yang dimasukkan ke leher harus disediakan oleh **semua** teknologi di bawahnya. Kalau IP menjanjikan pengantaran tanpa loss, maka setiap link (radio seluler, satelit, kabel laut) wajib bebas loss, dan internet tidak akan pernah menjangkau separuh teknologi yang ada. Peterson & Davie menyebut leher sempit sebagai "kumpulan kemampuan global yang minimal dan dipilih dengan hati-hati", yang membuat aplikasi di atas dan teknologi di bawah bisa berkembang sendiri-sendiri.

Peterson & Davie juga mencatat bahwa dalam praktik "leher" itu sudah bergeser ke atas. Bagi sebagian besar aplikasi hari ini, platform bersama yang diasumsikan ada di mana-mana adalah kombinasi **HTTP + TLS + TCP (atau QUIC) + IP**. Firewall korporat yang hanya membuka TCP/443 dan UDP/443 adalah wujud nyata pergeseran ini: protokol baru yang ingin bisa dipakai di mana saja harus "menyamar" sebagai trafik web.

### 7.4 Best effort dan soft state

**Best effort** berarti jaringan berusaha mengantar, tanpa menjanjikan apa pun, dan tanpa *admission control*. Tidak ada yang ditolak saat jaringan padat; semua mendapat layanan yang sedikit lebih buruk. Ini pasangan alami argumen end-to-end: karena jaringan tidak menjanjikan, ujunglah yang memeriksa dan memperbaiki.

**Soft state** adalah cara internet menyimpan state yang memang perlu ada di dalam jaringan tanpa merusak ketahanan: state dibuat oleh pesan, **diperbarui secara berkala, dan kedaluwarsa sendiri** kalau tidak diperbarui. Lawannya *hard state*, yang harus dibuat dan dihapus secara eksplisit lewat sinyal, seperti sirkuit telepon.

| State | Diperbarui oleh | Kedaluwarsa kalau diam (nilai default umum) |
|---|---|---|
| Tabel MAC switch | Frame dari host | 300 detik (Cisco IOS) |
| Cache ARP | Lalu lintas/ARP | Linux: dasar 30 detik, diacak; Cisco IOS: 4 jam |
| Tetangga OSPF | Hello tiap 10 detik | Dead interval 40 detik |
| Entri NAT/conntrack UDP | Paket dalam sesi | Puluhan detik, bergantung perangkat |
| Lease DHCP | Perpanjangan lease | Sesuai masa lease |

Keindahan soft state: kalau sebuah perangkat lupa (reboot), dunia tidak perlu "membersihkan" apa pun. State yang salah lenyap sendiri, state yang benar muncul lagi pada refresh berikutnya. Harganya adalah overhead refresh dan masa ketika state basi masih dipakai. Contoh nyata di lapangan: aplikasi yang hanya mengirim paket UDP sesekali (VPN, VoIP saat hening) akan kehilangan entri NAT-nya kalau timeout NAT lebih pendek daripada jeda antarpaket. Karena itu WireGuard menyediakan `PersistentKeepalive` (dokumentasinya menyarankan 25 detik bila berada di belakang NAT): keepalive itu sebenarnya refresh soft state di NAT, sebuah kotak yang seharusnya tidak ada menurut prinsip end-to-end.

### 7.5 Layering sebagai abstraksi, dan kapan dilanggar

Layering adalah abstraksi: setiap lapisan hanya memakai layanan lapisan di bawahnya lewat antarmuka, tanpa tahu isinya. Keuntungannya modularitas: Wi-Fi bisa diganti 5G tanpa menyentuh TCP. Kerugiannya **informasi tersembunyi**: TCP tidak tahu apakah loss disebabkan antrean penuh atau sinyal radio lemah, sehingga ia selalu menganggapnya kemacetan dan menurunkan laju, bahkan ketika itu salah.

Internet nyata penuh **middlebox** (RFC 3234) yang membaca atau menulis di lapisan yang "bukan urusannya":

| Middlebox | Lapisan yang disentuh | Akibat bagi arsitektur |
|---|---|---|
| NAT/CGNAT | Menulis ulang alamat IP (L3) dan port (L4) | Host di belakangnya tidak bisa dihubungi langsung; checksum TCP/UDP harus dihitung ulang karena checksum L4 mencakup alamat IP (*pseudo-header*) |
| Firewall stateful | Membaca L3/L4, menyimpan state per sesi | Melanggar fate-sharing; membuang paket yang "tidak dikenalnya" |
| ALG (FTP, SIP) | Membaca dan mengubah **payload** aplikasi | Protokol baru atau terenkripsi tidak bisa ditangani |
| MSS clamping di PPPoE | Mengubah opsi TCP di tengah jalan | Router menyentuh header transport milik host |
| PEP di link satelit | Memecah satu koneksi TCP menjadi dua atau tiga potongan | Host mengira berbicara langsung, padahal ACK berasal dari kotak di tengah |

Contoh MSS clamping sangat umum di ISP Indonesia yang memakai PPPoE untuk fiber rumah: MTU PPPoE 1492 byte, sehingga MSS yang aman adalah 1492 − 20 (IPv4) − 20 (TCP) = **1452 byte**. Router (misalnya MikroTik dengan opsi `change-tcp-mss` pada profil PPP) menulis ulang nilai MSS di paket SYN. Ini pelanggaran layering yang disengaja, dan sangat berguna, karena Path MTU Discovery sering gagal ketika ICMP diblokir.

Pelanggaran semacam ini bukan "dosa" yang otomatis salah. Masalahnya muncul belakangan, dalam bentuk ossification.

### 7.6 Ossification, dan kenapa QUIC berjalan di atas UDP

**Ossification** (pengerasan) terjadi ketika middlebox yang terlalu "pintar" membekukan protokol. Sebuah firewall atau NAT yang dibuat pada 2010 hanya mengenali opsi TCP yang ada pada 2010. Begitu ada opsi baru, kotak itu membuangnya, menghapusnya, atau bahkan membuang seluruh paket. Studi Honda dkk. (2011) menguji ribuan jalur di internet dan menemukan bahwa sebagian berarti di antaranya mengganggu ekstensi TCP: menghapus opsi yang tidak dikenal, menulis ulang nomor urut, atau memecah dan menggabung segmen. Akibatnya pengembang TCP harus merancang setiap ekstensi baru (Multipath TCP, TCP Fast Open) dengan **jalur mundur** kalau middlebox mengacaukannya, dan adopsinya berjalan lambat. Protokol transport yang benar-benar baru seperti SCTP hampir mustahil melewati NAT rumahan, karena NAT hanya mengerti TCP, UDP, dan ICMP.

QUIC (`05-transport/03`) adalah jawaban yang sengaja dirancang terhadap masalah ini, dengan tiga keputusan:

1. **Berjalan di atas UDP.** UDP sudah lolos hampir semua NAT dan firewall, dan header UDP terlalu sederhana untuk diosifikasi lebih jauh. Semua logika transport (keandalan, congestion control, stream) dipindah ke dalam payload UDP, di user space, sehingga bisa diperbarui bersama aplikasi tanpa menunggu kernel.
2. **Mengenkripsi hampir semua header transport.** Frame ACK, informasi stream, dan kontrol aliran berada di dalam payload yang dienkripsi. Bahkan nomor paket dan beberapa bit di byte pertama dilindungi dengan *header protection* (RFC 9001 bagian 5.4). Yang terlihat di jalur hanya hal minimal: sebagian flag, versi (pada header panjang), dan Connection ID. Apa yang tidak bisa dibaca middlebox tidak bisa ia bekukan. RFC 8546 menyebut bagian yang terlihat ini sebagai *wire image* sebuah protokol.
3. **Melatih kelenturan secara aktif.** Nilai-nilai yang "seharusnya bebas" sengaja diacak agar middlebox tidak bisa mengasumsikan nilai tetap: versi QUIC cadangan untuk menguji negosiasi versi, dan RFC 9287 (*Greasing the QUIC Bit*) yang membolehkan bit yang biasanya selalu 1 diacak. Prinsip yang sama dipakai TLS lewat GREASE (RFC 8701), dan dirangkum di RFC 9170: mekanisme ekstensi yang tidak pernah dipakai akan berkarat.

**Harga yang dibayar operator.** Dengan TCP, engineer bisa membuka capture dan melihat retransmisi, window, dan RTT dari header. Dengan QUIC, hampir semua itu tertutup. RFC 9000 menyediakan *latency spin bit* opsional agar pengamat di jalur bisa mengukur RTT pasif, tetapi implementasi wajib mematikannya secara acak di sebagian koneksi, dan banyak yang tidak mengaktifkannya sama sekali. Diagnosis bergeser dari middlebox ke telemetri di ujung (misalnya log qlog dari aplikasi). Trade-off antara privasi, kelenturan protokol, dan kemudahan operasi ini dibahas panjang di RFC 9065.

**Hitungan kecil: kenapa ini sepadan.** Pengguna di Jayapura mengakses layanan yang servernya di Jakarta, misalkan RTT 80 ms.

```
TCP + TLS 1.3 : 1 RTT handshake TCP + 1 RTT handshake TLS = 2 RTT = 160 ms
                sebelum byte pertama permintaan HTTP bisa dikirim
QUIC (baru)   : handshake transport dan kriptografi digabung = 1 RTT = 80 ms
QUIC 0-RTT    : permintaan ikut di paket pertama (sesi dilanjutkan) ≈ 0 ms tambahan
```

Penghematan 80 ms per koneksi baru tidak mungkin didapat dengan mengubah TCP di kernel miliaran perangkat dan menunggu semua middlebox diperbarui. Ia hanya mungkin karena QUIC memilih menyembunyikan dirinya dari jaringan. Itu ironi besar arsitektur internet: prinsip end-to-end dilanggar oleh middlebox, dan prinsip itu dipulihkan dengan **enkripsi**.

---

## 8. Istilah: Kapan Memakai Model Mana

Panduan praktis untuk komunikasi profesional:

| Situasi | Pakai istilah |
|---|---|
| Bicara dengan tim jaringan, ticket, troubleshooting | **Nomor OSI** ("masalahnya di layer 2") |
| Menjelaskan protokol nyata, membaca RFC | **TCP/IP** ("ini di internet layer") |
| Ujian sertifikasi (CCNA, Network+) | **OSI** (dan tahu pemetaannya) |
| Bicara dengan developer aplikasi | **Nama protokol langsung** ("ini masalah TLS") |
| Membaca spesifikasi vendor | Keduanya muncul; perhatikan konteks |

> [!TIP]
> Ungkapan industri yang sering Anda dengar:
- **"Layer 8 problem"** — masalahnya pengguna. (Layer 8 tidak ada di standar mana pun; ini lelucon.)
- **"Layer 9/10"** — politik dan anggaran organisasi.
- **"Layer 2,5"** — MPLS.
- **"L4-L7 services"** — load balancer, firewall, WAF.

---

## 9. Praktik: Melihat Kedua Model dalam Satu Paket

```bash
$ curl -sv https://example.com 2>&1 | head -25
```

Baca outputnya dengan dua kacamata:

```
* Trying 93.184.216.34:443...              ← IP + port    → OSI L3+L4 / TCP-IP Internet+Transport
* Connected to example.com port 443        ← TCP selesai  → OSI L4    / Transport
* TLSv1.3 (OUT), TLS handshake             ← TLS          → OSI L6    / Application (TCP/IP)
* SSL connection using TLSv1.3 / AES256    ← cipher       → OSI L6    / Application
> GET / HTTP/2                             ← HTTP         → OSI L7    / Application
> Host: example.com
< HTTP/2 200
```

Perhatikan: dalam model TCP/IP, tiga baris terakhir (TLS + HTTP) semuanya **Application layer**. Dalam OSI, mereka terpisah menjadi layer 6 dan 7. Kedua pembacaan benar — bergantung model yang dipakai.

Lihat juga daftar nomor protokol IP di sistem Anda:
```bash
$ head -15 /etc/protocols
ip      0    IP       # internet protocol
icmp    1    ICMP     # internet control message protocol
igmp    2    IGMP     # Internet Group Management
tcp     6    TCP      # transmission control protocol
udp     17   UDP      # user datagram protocol
gre     47   GRE
esp     50   IPSEC-ESP
ah      51   IPSEC-AH
ospf    89   OSPFIGP
```

Angka-angka ini muncul di field **Protocol** header IPv4. Saat Anda melihat `proto TCP (6)` di tcpdump, itulah asalnya.

---

## 10. Kesalahan Umum

> [!WARNING]
> **1. Mengira TCP/IP hanya berarti TCP dan IP.** Itu nama *suite* — mencakup UDP, ICMP, ARP, DNS, HTTP, dan puluhan protokol lain.

> [!WARNING]
> **2. Mencari "session layer" di TCP/IP.** Tidak ada layer terpisah; fungsinya ada di dalam aplikasi.

> [!WARNING]
> **3. Menempatkan ICMP di layer 4.** ICMP ada di internet layer (L3), berjalan langsung di dalam IP.

> [!WARNING]
> **4. Mengira IP menjamin pengiriman.** IP adalah best-effort. Jaminan datang dari TCP atau dari aplikasi.

> [!WARNING]
> **5. Bingung karena vendor memakai istilah berbeda.** Cisco cenderung OSI, dokumen IETF cenderung TCP/IP. Keduanya menggambarkan hal yang sama.

---

## 11. Ringkasan

- TCP/IP punya 4 layer resmi (Link, Internet, Transport, Application); versi 5 layer memisahkan Physical dan Data Link untuk kemudahan belajar.
- Pemetaan: OSI 5-6-7 → Application; OSI 4 → Transport; OSI 3 → Internet; OSI 1-2 → Link.
- IP bersifat **connectionless, best-effort, unreliable** — dan itu disengaja.
- ICMP adalah bagian internet layer, bukan transport.
- Hourglass model: banyak aplikasi & media, satu IP di tengah. Menjelaskan mengapa inovasi mudah di ujung dan sulit di tengah.
- TCP/IP menang karena tersedia, gratis, sederhana, dan berbasis kode yang berjalan.
- Praktik industri: pakai **nomor OSI** untuk berbicara, **struktur TCP/IP** untuk memahami.
- **Argumen end-to-end**: kebenaran hanya bisa dijamin di ujung; fungsi di dalam jaringan hanya optimasi. **Fate-sharing**: state koneksi disimpan di host, bukan di router. **Soft state** kedaluwarsa sendiri bila tidak diperbarui.
- Middlebox (NAT, firewall, PEP) melanggar layering dan menyebabkan **ossification**; QUIC menjawabnya dengan berjalan di atas UDP dan mengenkripsi hampir seluruh header transport.

---

## 12. Latihan

1. Petakan setiap layer OSI ke layer TCP/IP 4-layer.
2. Di layer TCP/IP mana masing-masing berada: ARP, TLS, OSPF, UDP, Wi-Fi, ICMP, DHCP?
3. Kenapa keandalan tidak dibangun ke dalam IP saja, agar semua aplikasi otomatis andal?
4. Jelaskan mengapa migrasi IPv6 lebih sulit daripada mengadopsi HTTP/3, memakai konsep hourglass.
5. Seorang rekan berkata: "Ini masalah layer 5." Apa yang mungkin ia maksud, dan bagaimana Anda menerjemahkannya ke istilah TCP/IP?
6. Sebuah ISP regional mengganti perangkat CGNAT tunggal dengan sepasang perangkat aktif-standby tanpa sinkronisasi sesi. Saat uji failover malam hari, ribuan pelanggan melaporkan panggilan WhatsApp dan sesi game putus, padahal semua link dan router inti sehat. Di sisi lain, tunnel WireGuard milik beberapa pelanggan korporat ikut putus dan baru pulih ketika mereka mengirim trafik lagi. Jelaskan kejadian ini memakai prinsip fate-sharing dan soft state, lalu usulkan dua perbaikan.
7. Operator VSAT yang melayani sekolah di daerah 3T memakai *Performance Enhancing Proxy* (PEP) yang memecah koneksi TCP untuk mengatasi RTT satelit GEO (sekitar 600 ms). Setelah browser dan aplikasi besar beralih ke HTTP/3, pengguna mengeluh unduhan lebih lambat daripada sebelumnya. Jelaskan penyebabnya dengan konsep pelanggaran layering, ossification, dan enkripsi header QUIC. Apa pilihan yang dimiliki operator, dan apa risikonya?

<details>
<summary>Jawaban</summary>

1. OSI 7/6/5 → **Application**; OSI 4 → **Transport**; OSI 3 → **Internet**; OSI 2/1 → **Link**.

2. ARP = **Link layer** (mengoperasikan pemetaan alamat link; sebagian sumber menyebut pembantu Internet layer); TLS = **Application**; OSPF = **Internet** secara fungsi (berjalan langsung di atas IP, protokol 89); UDP = **Transport**; Wi-Fi = **Link**; ICMP = **Internet**; DHCP = **Application** (berjalan di atas UDP).

3. Karena tidak semua aplikasi menginginkannya. Keandalan berbiaya: handshake, retransmisi, buffering, dan **delay**. VoIP lebih baik kehilangan satu paket daripada menunggu paket itu dikirim ulang — suara yang terlambat lebih buruk daripada suara yang hilang. Dengan menyerahkan keandalan ke lapisan atas (*end-to-end principle*), setiap aplikasi memilih trade-off yang cocok untuknya. Ini juga menjaga router tetap sederhana dan cepat.

4. HTTP/3 berada **di atas** leher sempit: hanya klien dan server yang perlu berubah, jaringan di tengah tidak peduli (ia hanya melihat UDP). IPv6 **mengganti leher sempit itu sendiri**: setiap router, firewall, sistem manajemen, aplikasi yang menyimpan alamat, dan setiap host harus mendukungnya. Tidak ada cara mengubahnya secara sepihak, sehingga IPv4 dan IPv6 harus berjalan berdampingan (dual stack) untuk waktu sangat lama.

5. Dalam OSI, layer 5 = session. Yang ia maksud kemungkinan besar: masalah pada pembentukan/pemeliharaan **sesi** — misalnya sesi TLS gagal di-resume, sesi RDP/SSH terputus, SIP tidak bisa membangun panggilan, atau session token aplikasi kedaluwarsa. Dalam istilah TCP/IP, semua itu berada di **Application layer**; Anda akan mendiagnosisnya dengan log aplikasi dan capture protokol yang bersangkutan, bukan dengan `ping`.

6. **Fate-sharing dilanggar.** Menurut prinsip fate-sharing, state sesi seharusnya hanya ada di host. CGNAT menyimpan state translasi (alamat dan port publik per sesi) di tengah jaringan. Saat perangkat aktif berhenti dan perangkat standby mengambil alih **tanpa salinan state**, semua entri translasi hilang: paket balasan dari internet tidak lagi cocok dengan entri mana pun dan dibuang, dan sesi TCP/UDP di host putus walaupun host, link, dan routing sehat. Tunnel WireGuard adalah contoh **soft state**: entri NAT untuk tunnel itu baru dibuat ulang ketika ada paket keluar berikutnya, sehingga tunnel tampak mati sampai klien mengirim trafik (atau sampai keepalive berikutnya).
   **Perbaikan:** (a) aktifkan sinkronisasi state sesi di pasangan CGNAT (atau pakai skema yang memetakan blok port secara deterministik per pelanggan sehingga translasi bisa dihitung ulang tanpa state); (b) di sisi pelanggan, aktifkan keepalive di bawah timeout NAT (misalnya `PersistentKeepalive = 25` di WireGuard) agar soft state cepat terbentuk kembali; (c) jangka panjang, kurangi ketergantungan pada state di tengah dengan IPv6, sehingga sebagian besar trafik tidak perlu melewati NAT sama sekali.

7. **PEP adalah pelanggaran layering yang disengaja:** ia membaca dan memalsukan perilaku TCP (mengirim ACK lokal atas nama host jauh, memperbesar window) supaya pengirim tidak menunggu RTT satelit 600 ms. Itu hanya mungkin karena header TCP terlihat dan bisa diubah. Pada QUIC, ACK, nomor paket, dan kontrol aliran **terenkripsi** dan dilindungi integritasnya (header protection, RFC 9001), sehingga PEP tidak bisa membaca apalagi memalsukan ACK. Trafik HTTP/3 kembali menanggung RTT penuh pada setiap putaran slow start, sehingga lebih lambat daripada TCP yang "dibantu" PEP. Dari sudut pandang desainer QUIC ini justru tujuan: mencegah ossification oleh kotak di tengah jalan.
   **Pilihan operator:** (a) memblokir UDP/443 agar browser jatuh kembali ke HTTP/2 di atas TCP yang bisa dibantu PEP; berhasil dalam jangka pendek, tetapi menambah satu middlebox yang membekukan protokol, menghilangkan manfaat QUIC (migrasi koneksi, tanpa HOL blocking), dan bisa merusak aplikasi yang hanya memakai QUIC; (b) menyediakan proxy QUIC/HTTP3 yang berakhir di stasiun bumi (MASQUE atau proxy eksplisit yang dikonfigurasi pengguna), yang sah karena pengguna memilihnya, tetapi butuh konfigurasi di klien; (c) bekerja dengan penyedia konten/CDN agar server memakai parameter congestion control yang sadar link satelit; (d) beralih ke satelit orbit rendah yang RTT-nya jauh lebih kecil, sehingga PEP tidak lagi diperlukan. Pilihan (a) paling mudah tetapi paling bertentangan dengan prinsip arsitektur.

</details>

---

## 13. Sumber

- RFC 1122 — Requirements for Internet Hosts: Communication Layers (definisi resmi model TCP/IP)
- RFC 1123 — Requirements for Internet Hosts: Application and Support
- RFC 1958 — Architectural Principles of the Internet (end-to-end principle)
- Kurose & Ross, *Computer Networking: A Top-Down Approach* (model 5 layer)
- IANA Protocol Numbers — https://www.iana.org/assignments/protocol-numbers
- Saltzer, Reed, Clark (1984), End-to-End Arguments in System Design: https://web.mit.edu/Saltzer/www/publications/endtoend/endtoend.pdf
- Clark (1988), The Design Philosophy of the DARPA Internet Protocols: https://doi.org/10.1145/52324.52336
- Stone & Partridge (2000), When the CRC and TCP Checksum Disagree: https://doi.org/10.1145/347057.347561
- Honda dkk. (2011), Is It Still Possible to Extend TCP?: https://doi.org/10.1145/2068816.2068834
- RFC 1958, Architectural Principles of the Internet: https://www.rfc-editor.org/rfc/rfc1958
- RFC 3234, Middleboxes: Taxonomy and Issues: https://www.rfc-editor.org/rfc/rfc3234
- RFC 3135, Performance Enhancing Proxies Intended to Mitigate Link-Related Degradations: https://www.rfc-editor.org/rfc/rfc3135
- RFC 8546, The Wire Image of a Network Protocol: https://www.rfc-editor.org/rfc/rfc8546
- RFC 9000, QUIC: A UDP-Based Multiplexed and Secure Transport (17.4 Latency Spin Bit): https://www.rfc-editor.org/rfc/rfc9000
- RFC 9001, Using TLS to Secure QUIC (5.4 Header Protection): https://www.rfc-editor.org/rfc/rfc9001
- RFC 9065, Considerations around Transport Header Confidentiality, Network Operations, and the Evolution of Internet Transport Protocols: https://www.rfc-editor.org/rfc/rfc9065
- RFC 9170, Long-Term Viability of Protocol Extension Mechanisms: https://www.rfc-editor.org/rfc/rfc9170
- RFC 9287, Greasing the QUIC Bit: https://www.rfc-editor.org/rfc/rfc9287
- RFC 8701, Applying GREASE to TLS Extensibility: https://www.rfc-editor.org/rfc/rfc8701
- Computer Networks: A Systems Approach, 1.3 Architecture (hourglass): https://book.systemsapproach.org/foundation/architecture.html
- Computer Networks: A Systems Approach, 5.2 TCP (end-to-end argument): https://book.systemsapproach.org/e2e/tcp.html
- Computer Networks: A Systems Approach, Perspective: HTTP is the New Narrow Waist: https://book.systemsapproach.org/e2e/trend.html

Subbagian 7.1 dan 7.3 mengadaptasi sebagian penjelasan dari *Computer Networks: A Systems Approach*, Larry Peterson & Bruce Davie, © Elsevier 2012, https://github.com/SystemsApproach/book, lisensi CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Perubahan: diterjemahkan ke bahasa Indonesia, diringkas, dan diberi contoh baru.

---

**Berikutnya:** `01-model-referensi/03-enkapsulasi.md`. Perjalanan lengkap satu paket, langkah demi langkah.

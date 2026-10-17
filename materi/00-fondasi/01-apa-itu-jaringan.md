# 00.1 Apa Itu Jaringan Komputer

> **Prasyarat:** Tidak ada. Ini titik nol.
> **Tujuan:** Setelah modul ini Anda bisa menjelaskan apa itu jaringan, menyebut komponennya, dan tahu peran setiap perangkat jaringan tanpa menghafal.

---

## 1. Analogi: Jaringan Itu Sistem Pos

Bayangkan Anda ingin mengirim surat ke teman di kota lain.

1. Anda tulis surat (**data**).
2. Anda masukkan ke amplop, tulis alamat tujuan dan alamat pengirim (**pengalamatan**).
3. Anda masukkan ke kotak pos (**interface**).
4. Kantor pos lokal menyortir dan mengirim ke kota tujuan (**routing**).
5. Pak pos mengantar ke rumah teman Anda (**delivery**).
6. Teman Anda membuka amplop dan membaca surat (**dekapsulasi**).

Jaringan komputer bekerja **persis seperti ini**, hanya jauh lebih cepat dan dengan aturan yang sangat ketat. Hampir semua konsep yang akan Anda pelajari punya padanan di sistem pos:

| Sistem pos | Jaringan komputer |
|---|---|
| Alamat rumah | IP address |
| Nama penerima di rumah itu | Port number |
| Amplop | Header paket |
| Isi surat | Payload / data |
| Kantor pos penyortir | Router |
| Pak pos di komplek Anda | Switch |
| Kode pos | Subnet / prefix |
| Buku telepon | DNS |
| Surat tercatat (ada tanda terima) | TCP |
| Kartu pos biasa (dikirim, semoga sampai) | UDP |
| Satpam komplek yang memeriksa tamu | Firewall |

Simpan tabel ini. Kita akan kembali ke sini di banyak modul.

---

## 2. Definisi Formal

> **Jaringan komputer** adalah dua atau lebih perangkat komputasi yang saling terhubung melalui media transmisi dan menggunakan aturan komunikasi (protokol) yang sama, sehingga dapat bertukar data dan berbagi sumber daya.

Tiga kata kunci di definisi itu:

**a. Terhubung** — ada jalur fisik atau nirkabel di antara mereka. Tanpa jalur, tidak ada jaringan.

**b. Protokol** — aturan yang disepakati. Ini bagian yang paling sering diremehkan pemula. Dua komputer yang terhubung kabel tapi "berbicara bahasa berbeda" tetap tidak bisa berkomunikasi. Protokol menentukan:
- Format pesan (bagian mana alamat, bagian mana data)
- Urutan pesan (siapa bicara dulu)
- Arti setiap pesan
- Apa yang dilakukan kalau ada error

**c. Berbagi sumber daya** — inilah alasan jaringan ada.

---

## 3. Mengapa Jaringan Dibuat: 5 Alasan Historis yang Masih Berlaku

1. **Berbagi perangkat mahal.** Tahun 1970-an, printer laser seharga mobil. Menghubungkan 20 terminal ke satu printer jauh lebih murah daripada 20 printer. Hari ini: berbagi storage, GPU, bandwidth internet.

2. **Berbagi data.** Satu database dipakai bersama lebih baik daripada 20 salinan yang saling bertentangan. Ini melahirkan model klien-server.

3. **Komunikasi.** Email (1971) lahir lebih dulu daripada web (1991). Sekarang: chat, video call, kolaborasi dokumen.

4. **Keandalan.** Kalau satu server mati, yang lain mengambil alih. Konsep **redundansi** — yang akan Anda temui di STP, HSRP, BGP multihoming.

5. **Skalabilitas & ekonomi.** Lebih murah menambah server kecil daripada mengganti satu komputer raksasa. Ini dasar cloud computing.

---

## 4. Kosakata Dasar (Wajib Hafal)

Istilah-istilah ini akan muncul di setiap modul. Pahami sekarang, bukan nanti.

| Istilah | Arti | Contoh konkret |
|---|---|---|
| **Host** | Perangkat yang menjadi sumber atau tujuan akhir data | Laptop, server, HP, printer |
| **Node** | Titik mana pun di jaringan (host *atau* perangkat perantara) | Laptop, switch, router |
| **Endpoint** | Sinonim praktis dari host; titik akhir komunikasi | PC karyawan, kamera IP |
| **Link** | Koneksi fisik/logis antara dua node | Kabel dari PC ke switch |
| **Interface** | Titik masuk/keluar data pada sebuah node | Port Ethernet, adapter Wi-Fi |
| **NIC** | *Network Interface Card* — perangkat keras interface | Kartu Ethernet, chip Wi-Fi |
| **Media** | Bahan yang membawa sinyal | Tembaga, serat optik, udara |
| **Protokol** | Aturan komunikasi | IP, TCP, HTTP |
| **Paket** | Unit data yang dikirim | Satu "amplop" berisi data |
| **Bandwidth** | Kapasitas maksimum jalur | 1 Gbps |
| **Throughput** | Kecepatan aktual yang tercapai | 640 Mbps |
| **Latency** | Waktu tempuh data | 12 ms |
| **Topologi** | Bentuk susunan jaringan | Star, mesh |

> [!WARNING]
> **Kesalahan umum #1:** Menyamakan *host* dan *node*. Semua host adalah node, tapi tidak semua node adalah host. Switch adalah node, bukan host (ia meneruskan data, bukan menghasilkan/mengonsumsinya — kecuali untuk manajemen dirinya sendiri).

> [!WARNING]
> **Kesalahan umum #2:** Menyamakan *bandwidth* dan *throughput*. Bandwidth = lebar pipa. Throughput = air yang benar-benar mengalir. Detail di modul `00-fondasi/03`.

---

## 5. Dua Model Komunikasi

### 5.1 Klien-Server

Satu pihak (**server**) menyediakan layanan; pihak lain (**klien**) memintanya.

```
   [Klien]  ──── request ────►  [Server]
   [Klien]  ◄─── response ───   [Server]
```

- Server: selalu menyala, punya alamat tetap, menunggu permintaan.
- Klien: menyala kadang-kadang, alamat bisa berubah, memulai permintaan.
- Contoh: browser ↔ web server, Outlook ↔ mail server, ponsel ↔ server WhatsApp.

**Kelebihan:** terpusat, mudah dikelola, keamanan lebih mudah dikontrol, backup terpusat.
**Kekurangan:** server jadi *single point of failure* dan titik kemacetan; butuh biaya infrastruktur.

### 5.2 Peer-to-Peer (P2P)

Setiap perangkat bisa jadi klien sekaligus server.

```
   [Peer A] ◄───► [Peer B]
       ▲              ▲
       └──► [Peer C] ◄┘
```

- Contoh: BitTorrent, blockchain, file sharing Windows workgroup, WebRTC (video call langsung antar-browser).

**Kelebihan:** murah, tidak ada titik kegagalan tunggal, skalabilitas alami (makin banyak peer, makin banyak kapasitas).
**Kekurangan:** sulit dikelola, keamanan tersebar, sulit di-backup, sering diblokir di jaringan korporat.

> [!TIP]
> **Di lapangan:** kebanyakan jaringan modern **hibrida**. Contoh: video call Zoom memakai server untuk sinyal dan koordinasi, tapi bisa mengirim media langsung antar-peer jika memungkinkan.

---

## 6. Skala Jaringan

Diurutkan dari terkecil ke terbesar. Perhatikan bahwa yang membedakan bukan cuma jarak, tapi juga **siapa yang memiliki dan mengelola**.

| Singkatan | Nama | Jangkauan | Contoh | Dikelola oleh |
|---|---|---|---|---|
| **PAN** | Personal Area Network | ~1-10 m | Bluetooth headset ke HP, USB tethering | Individu |
| **LAN** | Local Area Network | 1 gedung / 1 lantai | Jaringan kantor, rumah, lab sekolah | Pemilik gedung/organisasi |
| **WLAN** | Wireless LAN | sama dengan LAN | Wi-Fi kantor | Organisasi |
| **CAN** | Campus Area Network | Beberapa gedung berdekatan | Kampus universitas, kompleks pabrik | Organisasi |
| **MAN** | Metropolitan Area Network | Satu kota | Jaringan pemda antar-kantor, Metro Ethernet | Provider / pemda |
| **WAN** | Wide Area Network | Antar-kota / negara | Jaringan cabang bank nasional | Provider (disewa) |
| **GAN** | Global Area Network | Global | Internet itu sendiri | Tidak ada pemilik tunggal |

Ada juga istilah yang muncul belakangan:

- **SAN** (*Storage Area Network*) — jaringan khusus untuk storage (Fibre Channel/iSCSI). Bukan soal jarak, tapi fungsi.
- **DCN** (*Data Center Network*) — jaringan di dalam data center; padat, cepat, punya desain khusus (spine-leaf).
- **SD-WAN** — WAN yang dikendalikan software; overlay di atas internet biasa.

### Kunci pemahaman

Perbedaan terpenting antara **LAN** dan **WAN** bukan jarak, tetapi:

| | LAN | WAN |
|---|---|---|
| Kepemilikan media | Anda memiliki kabelnya | Anda **menyewa** dari provider |
| Bandwidth | Murah dan besar (1-100 Gbps) | Mahal dan lebih kecil |
| Latency | Sangat rendah (<1 ms) | Lebih tinggi (10-300 ms) |
| Teknologi | Ethernet, Wi-Fi | MPLS, Metro-E, internet, seluler |
| Kendali | Penuh | Terbatas oleh SLA provider |

Konsekuensi praktisnya besar: desain aplikasi yang jalan mulus di LAN bisa hancur di WAN karena latency. Anda akan melihat ini lagi di modul TCP (`05-transport/02`) dan QoS (`11-wan-vpn/03`).

---

## 7. Istilah Berbasis Kepemilikan & Akses

- **Intranet** — jaringan internal organisasi, memakai teknologi internet (IP, HTTP), tapi hanya bisa diakses dari dalam.
- **Ekstranet** — bagian intranet yang sengaja dibuka untuk mitra tertentu (vendor, supplier), biasanya lewat VPN.
- **Internet** — jaringan publik global; gabungan puluhan ribu jaringan otonom (AS) yang saling bertukar rute.
- **DMZ** (*Demilitarized Zone*) — zona penyangga antara internet dan jaringan internal, tempat menaruh server yang harus diakses publik (web server, mail gateway). Dibahas tuntas di `09-nat-acl-firewall/03`.

```
   INTERNET
      │
   [Firewall]
      ├──────────► DMZ  (web server, mail relay)   ← boleh diakses publik
      │
      └──────────► LAN internal (PC, file server)  ← tidak boleh diakses publik
```

---

## 8. Peran Perangkat Jaringan

Ini daftar yang harus Anda kenali sekarang secara **fungsi**. Cara kerjanya dibahas rinci di modul masing-masing.

### 8.1 Perangkat Akhir (End Devices)

- **PC / laptop / server / HP / tablet** — menghasilkan dan mengonsumsi data.
- **Printer jaringan, kamera IP, sensor IoT, telepon IP** — juga host.
- **Server** — host yang menjalankan layanan: web, file, database, DNS, DHCP, autentikasi.

### 8.2 Perangkat Perantara (Intermediary Devices)

| Perangkat | Fungsi inti | Bekerja di layer | Modul detail |
|---|---|---|---|
| **NIC** | Menghubungkan host ke media, memberi identitas MAC | 1-2 | `03-data-link/01` |
| **Repeater** | Menguatkan/membangkitkan ulang sinyal agar bisa lebih jauh | 1 | `02-layer-fisik/03` |
| **Hub** | Repeater banyak port — mengirim ulang ke semua port | 1 | `03-data-link/02` |
| **Bridge** | Menghubungkan dua segmen, memfilter berdasarkan MAC | 2 | `03-data-link/02` |
| **Switch** | Bridge banyak port berbasis hardware; meneruskan frame ke port yang tepat | 2 (dan 3 untuk multilayer) | `03-data-link/02` |
| **Router** | Menghubungkan jaringan berbeda; memilih jalur terbaik berdasarkan IP | 3 | `04-network-layer/05` |
| **Firewall** | Menegakkan kebijakan boleh/tidak boleh lewat | 3-7 | `09-nat-acl-firewall/03` |
| **IPS/IDS** | Mendeteksi (IDS) atau memblokir (IPS) serangan | 3-7 | `09-nat-acl-firewall/03` |
| **Access Point (AP)** | Menjembatani klien nirkabel ke jaringan kabel | 1-2 | `10-wireless/04` |
| **WLC** (*Wireless LAN Controller*) | Mengelola banyak AP secara terpusat (config, RF, roaming) | — | `10-wireless/04` |
| **Load balancer** | Membagi beban ke banyak server | 4 atau 7 | `06-aplikasi/03` |
| **Proxy** | Perantara permintaan aplikasi (cache, filter, anonimisasi) | 7 | `06-aplikasi/03` |
| **Modem** | Mengubah sinyal digital ↔ sinyal media provider (DSL, kabel, fiber) | 1 | `11-wan-vpn/01` |
| **Media converter** | Mengubah media (copper ↔ fiber) tanpa mengubah data | 1 | `02-layer-fisik/03` |
| **Controller** | Otak terpusat pada jaringan berbasis controller (SDN) | — | `16-datacenter-cloud-sdn/06` |

### 8.3 Cara Cepat Membedakan Hub, Switch, Router

Ini pertanyaan interview klasik. Jawabannya:

```
HUB:    Frame masuk port 1 → dikirim ke SEMUA port lain. Tidak berpikir.
        Satu collision domain, satu broadcast domain.

SWITCH: Frame masuk port 1 → dibaca MAC tujuannya → dikirim HANYA ke port yang benar.
        Setiap port = collision domain sendiri. Semua port = satu broadcast domain
        (kecuali dipisah VLAN).

ROUTER: Paket masuk → dibaca IP tujuannya → dicocokkan ke tabel routing →
        dikirim ke jaringan lain. Setiap interface = broadcast domain sendiri.
        Router TIDAK meneruskan broadcast.
```

Kalimat yang layak dihafal:
> **Switch memisahkan collision domain. Router memisahkan broadcast domain.**

(Istilah *collision domain* dan *broadcast domain* dijelaskan tuntas di `03-data-link/01` dan `03-data-link/02`. Untuk sekarang: collision domain = area di mana dua pengirim bisa bertabrakan; broadcast domain = area yang menerima pesan "untuk semua orang".)

---

## 9. PoE: Power over Ethernet

Kabel Ethernet bisa membawa **listrik** sekaligus data. Ini bukan hal sepele: tanpa PoE, memasang 40 access point di plafon berarti menarik 40 kabel listrik juga.

- **802.3af (PoE)** — sampai 15,4 W di sumber, ~12,95 W di perangkat.
- **802.3at (PoE+)** — sampai 30 W di sumber, ~25,5 W di perangkat.
- **802.3bt (PoE++ / 4PPoE)** — Type 3 sampai 60 W, Type 4 sampai 90-100 W di sumber.

Perangkat yang lazim memakai PoE: access point, telepon IP, kamera CCTV, small switch, sensor, bahkan lampu LED gedung.

Istilah:
- **PSE** (*Power Sourcing Equipment*) — yang memberi daya (switch PoE atau injector).
- **PD** (*Powered Device*) — yang menerima daya (AP, kamera).
- **Power budget** — total daya yang bisa disediakan switch. Switch 24 port PoE+ dengan budget 370 W **tidak** bisa memberi 30 W ke semua 24 port (butuh 720 W).

> [!WARNING]
> **Jebakan lapangan:** Menghitung jumlah port PoE tanpa menghitung power budget. Perangkat akan menyala bergantian atau mati acak. Selalu jumlahkan kebutuhan daya nyata.

Detail teknis PoE (deteksi, klasifikasi, pasangan kabel yang dipakai) ada di `02-layer-fisik/02`.

---

## 10. Kategori Lingkungan Jaringan

Anda akan bekerja pada salah satu (atau beberapa) dari ini. Perbedaannya menentukan gaya desain.

**SOHO** (*Small Office / Home Office*)
- 1-20 pengguna. Satu perangkat all-in-one (router+switch+AP+firewall).
- Prioritas: murah, mudah, cukup andal.

**Enterprise / Campus**
- Ratusan sampai puluhan ribu pengguna, banyak gedung.
- Berlapis: access → distribution → core. Redundansi di mana-mana.
- Prioritas: keandalan, keamanan, manajemen terpusat, kepatuhan.

**Data Center**
- Server ke server (*east-west traffic*) mendominasi.
- Topologi spine-leaf, latency sangat rendah, bandwidth sangat besar.
- Prioritas: throughput, latency konsisten, otomasi.

**Service Provider / ISP**
- Membawa trafik pelanggan lain. BGP, MPLS, skala besar.
- Prioritas: skalabilitas, SLA, efisiensi biaya per bit.

**Cloud**
- Jaringan virtual (VPC/VNet) yang didefinisikan lewat API.
- Prioritas: elastis, infrastructure-as-code, model biaya berbasis pemakaian.

**Industrial / OT** (*Operational Technology*)
- Pabrik, pembangkit listrik, kilang. Protokol khusus (Modbus, PROFINET).
- Prioritas: determinisme, uptime, keselamatan. Perubahan sangat konservatif.

---

## 11. Praktik Pertama Anda

Coba langsung di komputer Anda sekarang. Belum perlu paham hasilnya — tujuannya mengenali bahwa semua ini nyata.

**Linux:**
```bash
$ ip addr show          # alamat interface Anda
$ ip route show         # ke mana paket dikirim
$ ping -c 4 1.1.1.1     # uji konektivitas ke internet
```

**Windows (PowerShell):**
```powershell
PS> ipconfig /all
PS> route print
PS> ping 1.1.1.1
```

**macOS:**
```bash
$ ifconfig
$ netstat -rn
$ ping -c 4 1.1.1.1
```

Simpan hasilnya. Di modul `04-network-layer/01` Anda akan membaca setiap baris output itu dan mengerti artinya.

---

## 12. Ringkasan

- Jaringan = perangkat + media + **protokol** + tujuan berbagi.
- Analogi sistem pos berlaku hampir sempurna; gunakan terus.
- Host menghasilkan/mengonsumsi data; node mencakup perangkat perantara juga.
- Klien-server terpusat & mudah dikelola; P2P tersebar & tahan gangguan.
- Skala: PAN → LAN → CAN → MAN → WAN → internet. Beda LAN/WAN yang paling penting adalah **kepemilikan media**, bukan jarak.
- Switch memisahkan collision domain; router memisahkan broadcast domain.
- PoE membawa listrik lewat kabel data; hitung **power budget**, bukan jumlah port.

---

## 13. Latihan

1. Sebutkan tiga hal yang membedakan LAN dari WAN selain jarak.
2. Anda punya 30 kamera CCTV PoE (masing-masing 12 W) dan switch 48-port PoE+ dengan power budget 370 W. Apakah cukup? Tunjukkan hitungannya.
3. Perangkat apa yang Anda perlukan agar dua jaringan dengan alamat berbeda bisa saling berkomunikasi? Mengapa switch tidak cukup?
4. Sebuah kantor punya 200 karyawan di 3 lantai satu gedung. Jaringan apa itu — LAN, CAN, atau MAN?
5. Jelaskan dengan analogi pos: apa peran DNS?

<details>
<summary>Jawaban</summary>

1. (a) Kepemilikan media — LAN milik sendiri, WAN disewa dari provider; (b) biaya per bandwidth — WAN jauh lebih mahal; (c) latency — LAN <1 ms, WAN puluhan sampai ratusan ms; (d) teknologi — Ethernet/Wi-Fi vs MPLS/Metro-E/seluler; (e) tingkat kendali — penuh vs dibatasi SLA.

2. 30 × 12 W = 360 W kebutuhan perangkat. Budget 370 W. **Secara angka cukup, tetapi terlalu ketat.** Belum menghitung rugi daya di kabel (PSE harus mengirim lebih besar daripada yang diterima PD) dan tidak ada ruang untuk penambahan. Praktik yang benar: sisakan minimal 20-30% headroom, atau pilih switch dengan budget ≥ 500 W.

3. **Router** (atau switch layer 3 / multilayer switch). Switch biasa hanya membaca alamat MAC dan bekerja dalam satu broadcast domain; ia tidak bisa memindahkan paket antar-jaringan IP yang berbeda karena tidak membaca alamat IP dan tidak punya tabel routing.

4. **LAN** (lebih spesifik: satu LAN besar dengan beberapa switch, atau beberapa LAN per lantai yang dihubungkan router/L3 switch). CAN dipakai kalau melibatkan beberapa gedung terpisah dalam satu kompleks.

5. DNS = **buku telepon**. Anda tahu nama orang ("tokopedia.com") tapi butuh alamat rumahnya ("104.18.x.x") untuk mengirim surat. DNS mengubah nama menjadi alamat.

</details>

---

## 14. Sumber

- Cisco, *Networking Basics* — https://www.netacad.com/courses/networking-basics
- Cloudflare Learning Center, *How does the Internet work?* — https://www.cloudflare.com/learning/network-layer/how-does-the-internet-work/
- IEEE 802.3bt-2018 (PoE++) — standar Power over Ethernet
- Cisco CCNA 200-301 v1.1 blueprint, topik 1.1 (role dan fungsi komponen jaringan) dan 1.2 (arsitektur topologi)

---

**Berikutnya:** `00-fondasi/02-bit-byte-biner.md`. Bahasa yang benar-benar dipakai komputer.

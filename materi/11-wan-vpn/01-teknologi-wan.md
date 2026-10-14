# 11.1 — Teknologi WAN

> **Prasyarat:** `00-fondasi/01`, `07-routing-lanjutan/06`
> **Tujuan:** Anda paham pilihan teknologi WAN, bisa membaca SLA provider, dan memahami MPLS serta SD-WAN.

---

## 1. Apa yang Membedakan WAN

| | LAN | WAN |
|---|---|---|
| Kepemilikan media | Anda | **Disewa dari provider** |
| Bandwidth | Murah, besar | **Mahal**, lebih kecil |
| Latency | < 1 ms | 5–300 ms |
| Kendali | Penuh | Dibatasi **SLA** |
| Perubahan | Menit | **Minggu sampai bulan** |
| Biaya | Sekali beli | **Bulanan, terus-menerus** |

💡 **Konsekuensi desain:** karena bandwidth WAN mahal, **QoS menjadi wajib** — Anda harus memutuskan trafik mana yang lebih penting. Di LAN dengan 10 Gbps, QoS sering tidak diperlukan.

### Istilah kontrak

| Istilah | Arti |
|---|---|
| **CPE** (Customer Premises Equipment) | Perangkat di lokasi Anda (router, modem) |
| **Demarc** (Demarcation Point) | Batas tanggung jawab Anda dan provider |
| **Local loop / last mile** | Koneksi fisik dari lokasi Anda ke jaringan provider |
| **CO** (Central Office) / POP | Fasilitas provider |
| **CIR** (Committed Information Rate) | Bandwidth **yang dijamin** |
| **EIR** / burst | Bandwidth tambahan yang boleh dipakai **kalau tersedia** |
| **SLA** | Jaminan uptime, latency, jitter, loss + kompensasi |
| **MTTR** | Mean Time To Repair — janji waktu perbaikan |

⚠️ **Baca SLA dengan teliti.** "Uptime 99,9%" berarti **8,76 jam downtime per tahun yang diizinkan** — dan kompensasinya biasanya hanya potongan tagihan bulanan, bukan ganti rugi kerugian bisnis.

⚠️ **Perhatikan CIR vs bandwidth port.** Provider sering menjual "100 Mbps" tetapi CIR-nya hanya 20 Mbps — sisanya *best effort* yang bisa hilang saat jaringan provider padat.

---

## 2. Teknologi Akses (Last Mile)

| Teknologi | Kecepatan tipikal | Media | Catatan |
|---|---|---|---|
| **Leased line / E1-T1** | 2 Mbps (E1) | Copper/fiber | Sangat mahal, simetris, SLA ketat. Warisan |
| **Metro Ethernet** | 10 Mbps – 10 Gbps | Fiber | **Standar enterprise saat ini** |
| **Dedicated Internet Access (DIA)** | 10 Mbps – 10 Gbps | Fiber | Simetris, SLA, IP publik |
| **GPON / FTTH** | 100 Mbps – 1 Gbps | Fiber | Murah, **shared** (dibagi 32–128 pelanggan) |
| **DSL (ADSL/VDSL)** | 1–100 Mbps | Copper | Asimetris, jarak-sensitif. Menurun |
| **DOCSIS (kabel)** | 100 Mbps – 1 Gbps | Coax | Asimetris, shared |
| **4G/5G FWA** | 10–500 Mbps | Seluler | Cepat dipasang, cocok untuk backup |
| **Satelit GEO** | 10–100 Mbps | Radio | **RTT 600 ms** — buruk untuk interaktif |
| **Satelit LEO** (Starlink) | 50–300 Mbps | Radio | RTT 25–60 ms — jauh lebih baik |
| **Wireless PtP** | 100 Mbps – 1 Gbps | Radio | Untuk lokasi tanpa fiber |

### Istilah penting

**Dedicated vs Shared:**
```
Dedicated  : bandwidth khusus untuk Anda; harga tinggi; SLA kuat
Shared     : dibagi dengan pelanggan lain; murah; kinerja bervariasi
             (GPON: 1 fiber dibagi 32–128 pelanggan; DOCSIS: per node)
```

**Contention ratio** — perbandingan bandwidth yang dijual vs kapasitas nyata.
```
1:1   → dedicated
1:20  → 20 pelanggan berbagi kapasitas yang sama (umum untuk bisnis)
1:50  → umum untuk layanan rumahan
```

💡 **Di Indonesia**, layanan bisnis umumnya menawarkan **DIA** (dedicated, simetris, SLA) atau **Metro Ethernet**; layanan rumahan/UKM memakai **GPON dengan contention ratio** yang tidak selalu diungkapkan.

---

## 3. Metro Ethernet

Layanan WAN berbasis Ethernet — sekarang mendominasi karena sederhana dan familiar.

### Tipe layanan (MEF)

| Tipe | Nama | Topologi |
|---|---|---|
| **E-Line** | EPL / EVPL | Point-to-point |
| **E-LAN** | EP-LAN / EVP-LAN | Multipoint-to-multipoint (semua lokasi seperti satu LAN) |
| **E-Tree** | EP-Tree | Hub-and-spoke (root ke leaf; leaf tidak saling bicara) |
| **E-Access** | — | Akses ke operator lain |

```
E-Line  : [Kantor A] ═══════════ [Kantor B]
          (seperti kabel langsung)

E-LAN   : [A] ──┐
          [B] ──┼── (seperti satu switch besar)
          [C] ──┘

E-Tree  : [Pusat]
           ╱  │  ╲
        [A]  [B]  [C]     ← cabang tidak bisa saling bicara langsung
```

💡 **E-LAN sangat memudahkan** karena semua lokasi berada di satu broadcast domain — routing menjadi sederhana. **Tetapi** ini juga berarti **STP dan broadcast membentang lintas WAN** — satu masalah di satu lokasi bisa memengaruhi semuanya. Pertimbangkan dengan hati-hati.

---

## 4. MPLS

**MPLS** (*Multiprotocol Label Switching*) meneruskan paket berdasarkan **label**, bukan alamat IP.

```
Paket masuk → [LER] tambahkan LABEL → [LSR] tukar label → [LSR] → [LER] hapus label → keluar
              Label Edge Router      Label Switch Router
```

### Konsep

| Istilah | Arti |
|---|---|
| **Label** | Penanda 20 bit yang menentukan jalur |
| **LSP** (Label Switched Path) | Jalur yang dilalui paket berlabel |
| **LER / PE** (Provider Edge) | Router di tepi yang menambah/menghapus label |
| **LSR / P** (Provider) | Router di tengah yang menukar label |
| **CE** (Customer Edge) | Router pelanggan |
| **FEC** | Kelompok paket yang diperlakukan sama |
| **LDP** | Protokol distribusi label |
| **PHP** (Penultimate Hop Popping) | Router sebelum terakhir menghapus label (efisiensi) |

Header MPLS (**"layer 2,5"** — di antara L2 dan L3):
```
┌──────────┬─────┬───┬─────┐
│  Label   │ EXP │ S │ TTL │
│  20 bit  │3 bit│1  │8 bit│
└──────────┴─────┴───┴─────┘
  EXP = QoS marking
  S   = Bottom of Stack (label bisa bertumpuk)
```

### MPLS L3VPN — layanan yang paling banyak dijual

```
Setiap pelanggan punya VRF sendiri di router PE
→ tabel routing terpisah total
→ alamat IP boleh tumpang tindih antar-pelanggan

RD (Route Distinguisher)  : membuat prefix unik (65001:100:10.0.0.0/24)
RT (Route Target)         : mengontrol prefix mana masuk VRF mana
MP-BGP                    : membawa rute VPN antar-PE
```

**Keunggulan MPLS L3VPN bagi pelanggan:**
```
✅ Provider yang mengurus routing antar-lokasi
✅ Any-to-any connectivity tanpa mesh tunnel
✅ QoS end-to-end yang dijamin SLA
✅ Terpisah dari internet (tidak terekspos)
✅ Latency rendah dan stabil
```

**Kekurangan:**
```
❌ MAHAL — sering 5–20× harga internet dengan bandwidth sama
❌ Lambat menambah lokasi (minggu sampai bulan)
❌ Terkunci ke satu provider
❌ Tidak fleksibel untuk cloud (perlu koneksi khusus)
```

⚠️ **MPLS tidak mengenkripsi.** Trafik terisolasi secara logis, tetapi provider dapat melihatnya. Untuk data sensitif, **tambahkan IPsec di atas MPLS**.

### Segment Routing — penerus MPLS

**SR-MPLS** dan **SRv6** menghilangkan LDP/RSVP dengan menyematkan seluruh jalur di header paket (*source routing*).

```
Keunggulan:
  - Tidak perlu protokol distribusi label terpisah (LDP/RSVP-TE)
  - State jauh lebih sedikit di router tengah
  - Traffic engineering jauh lebih sederhana
  - Cocok untuk SDN/otomasi
```

Ini arah yang diambil sebagian besar operator besar untuk backbone baru.

---

## 5. SD-WAN

SD-WAN memakai **overlay** di atas transport apa pun (internet, MPLS, LTE) dengan kontrol terpusat.

```
        ┌─────────── CONTROLLER / ORCHESTRATOR ───────────┐
        │  Kebijakan, monitoring, zero-touch provisioning  │
        └────┬──────────────┬──────────────┬───────────────┘
             │              │              │
        [Edge-Pusat]   [Edge-Cabang1] [Edge-Cabang2]
             ║              ║              ║
        ═════╬══════════════╬══════════════╬═════  ← overlay tunnel (IPsec)
             ║              ║              ║
      ┌──────┴───┐   ┌──────┴───┐   ┌──────┴───┐
      │ Internet │   │   MPLS   │   │   LTE    │  ← underlay (transport apa saja)
      └──────────┘   └──────────┘   └──────────┘
```

### Kemampuan utama

| Fitur | Manfaat |
|---|---|
| **Transport-independent overlay** | Pakai internet murah + MPLS untuk kritis |
| **Application-aware routing** | Voice lewat MPLS, backup lewat internet |
| **Dynamic path selection** | Otomatis pindah kalau jalur memburuk (loss/latency/jitter) |
| **Zero-touch provisioning** | Kirim perangkat ke cabang, staf lokal cukup mencolokkan |
| **Centralized policy** | Ubah sekali, berlaku di semua lokasi |
| **DIA / Local Internet Breakout** | Trafik SaaS langsung ke internet, tidak memutar ke pusat |
| **Integrated security** | Firewall, IPS, URL filtering di edge |
| **Enkripsi otomatis** | IPsec antar-semua edge |

💡 **Local Internet Breakout adalah manfaat terbesar.** Dengan MPLS tradisional, trafik ke Microsoft 365 dari cabang harus memutar ke data center pusat lalu keluar ke internet (**tromboning**) — menambah latency besar. SD-WAN mengizinkannya keluar langsung dari cabang.

### Vendor utama

```
Cisco    : Viptela (SD-WAN), Meraki SD-WAN
VMware   : VeloCloud
Fortinet : Secure SD-WAN
Palo Alto: Prisma SD-WAN (CloudGenix)
HPE      : Silver Peak / Aruba EdgeConnect
Versa    : Versa SASE
```

⚠️ **Pertimbangan SD-WAN:**
```
- Vendor lock-in (edge, controller, dan lisensi dari satu vendor)
- Controller menjadi titik kritis — pastikan HA dan akses darurat
- Butuh internet yang cukup andal di setiap lokasi
- Biaya lisensi berulang bisa mendekati harga MPLS
- Troubleshooting lebih kompleks (overlay + underlay)
```

### SASE / SSE

Evolusi berikutnya: menggabungkan SD-WAN dengan layanan keamanan yang dikirim dari cloud.

```
SASE = SD-WAN + SWG + CASB + ZTNA + FWaaS
       (jaringan)  (keamanan, semuanya dari cloud)

SSE  = bagian keamanannya saja (tanpa SD-WAN)
```

Dibahas lebih lanjut di `12-keamanan/05`.

---

## 6. Teknologi WAN Warisan

Anda perlu mengenalinya untuk dokumentasi lama dan ujian.

### Frame Relay

```
DLCI  : identitas circuit virtual, bermakna LOKAL saja
PVC   : circuit virtual permanen
CIR   : bandwidth dijamin
LMI   : pensinyalan status PVC
FECN/BECN : notifikasi congestion
Inverse ARP : memetakan DLCI ke IP otomatis
```

⚠️ **Masalah klasik: split horizon pada hub-and-spoke multipoint** — routing update dari satu spoke tidak diteruskan ke spoke lain. Solusinya: subinterface point-to-point.

### ATM
Sel tetap 53 byte (48 data + 5 header). "Cell tax" ~9% membuatnya tidak efisien untuk data. Kalah dari Ethernet.

### ISDN, X.25, SONET/SDH
Sudah usang untuk akses enterprise; SONET/SDH masih ada di backbone operator lama.

**Pelajaran dari semuanya:** teknologi yang lebih canggih secara teknis bisa kalah oleh yang lebih sederhana dan murah. Ethernet menang lagi.

---

## 7. Desain WAN

### Pola topologi

| Pola | Kelebihan | Kekurangan |
|---|---|---|
| **Hub-and-spoke** | Murah, kontrol terpusat | Tromboning; pusat = SPOF |
| **Partial mesh** | Jalur langsung untuk yang penting | Lebih mahal |
| **Full mesh** | Latency optimal | n(n−1)/2 link — tidak scalable |
| **Dual hub** | Redundansi pusat | Biaya 2× di pusat |
| **Hybrid (SD-WAN)** | Fleksibel, dinamis | Kompleks |

### Redundansi

```
TINGKAT 1 — dua link ke provider yang SAMA
  ⚠️ Sering berbagi last mile yang sama → satu galian memutus keduanya

TINGKAT 2 — dua provider BERBEDA
  ✅ Lebih baik, tetapi periksa apakah mereka menyewa fiber dari operator yang sama

TINGKAT 3 — dua provider + MEDIA berbeda (fiber + LTE/5G)
  ✅✅ Perlindungan terbaik terhadap kegagalan fisik

TINGKAT 4 — + lokasi DR
```

⚠️ **Selalu tanyakan ke provider: apakah kedua link melewati jalur fisik yang sama?** Banyak organisasi membayar dua link "redundan" yang ternyata melewati duct yang sama — satu ekskavator memutus keduanya. Minta **diverse path guarantee** secara tertulis.

### Failover WAN

```
# MikroTik — recursive route + netwatch (lihat 07-routing-lanjutan/01)
/ip route add dst-address=8.8.8.8/32 gateway=203.0.113.9 scope=10
/ip route add dst-address=0.0.0.0/0 gateway=8.8.8.8 target-scope=11 \
    distance=1 check-gateway=ping comment="ISP-A"
/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.9 distance=10 comment="ISP-B"

# NAT untuk kedua ISP
/ip firewall nat add chain=srcnat out-interface=ether1-ISP-A action=masquerade
/ip firewall nat add chain=srcnat out-interface=ether2-ISP-B action=masquerade
```

```
# Cisco — IP SLA + floating static (lihat 07-routing-lanjutan/01)
ip sla 1
 icmp-echo 8.8.8.8 source-interface gi0/0
 frequency 5
ip sla schedule 1 life forever start-time now
track 1 ip sla 1 reachability
 delay down 10 up 30
ip route 0.0.0.0 0.0.0.0 203.0.113.1 track 1
ip route 0.0.0.0 0.0.0.0 198.51.100.1 10
```

⚠️ **Failover memutus sesi TCP yang sedang berjalan** kalau alamat sumber berubah (NAT ke IP publik yang berbeda). Untuk failover yang benar-benar mulus, butuh **BGP dengan alamat IP milik sendiri**, atau **SD-WAN overlay** yang mempertahankan alamat tunnel.

---

## 8. Optimasi WAN

Karena bandwidth WAN mahal, ada banyak teknik untuk memaksimalkannya.

| Teknik | Cara kerja |
|---|---|
| **Kompresi** | Mengecilkan data sebelum dikirim |
| **Deduplikasi** | Kirim referensi untuk blok yang sudah pernah dikirim |
| **Caching** | Simpan konten yang sering diakses di cabang |
| **TCP optimization** | Perbesar window, kurangi round-trip |
| **Protocol acceleration** | Kurangi "chattiness" CIFS/SMB, MAPI |
| **QoS** | Prioritaskan trafik penting (`11-wan-vpn/03`) |
| **Local breakout** | Trafik internet keluar langsung dari cabang |

💡 **Deduplikasi bisa memberi penghematan 60–90%** untuk backup dan replikasi file, karena banyak data berulang.

⚠️ **Sebagian besar teknik ini tidak bekerja pada trafik terenkripsi** (HTTPS, yang kini >95% trafik web). Karena itu WAN optimizer klasik kehilangan relevansi, dan fokus bergeser ke **local breakout + SD-WAN + CDN**.

---

## 9. MikroTik untuk WAN

```
# PPPoE client (koneksi ISP paling umum di Indonesia)
/interface pppoe-client add name=pppoe-isp interface=ether1 \
    user=pelanggan001 password=RahasiaISP \
    add-default-route=yes use-peer-dns=no disabled=no
/interface pppoe-client monitor pppoe-isp

# MSS clamping — WAJIB untuk PPPoE (MTU 1492)
/ip firewall mangle add chain=forward protocol=tcp tcp-flags=syn \
    action=change-mss new-mss=clamp-to-pmtu passthrough=yes

# LTE sebagai backup
/interface lte set lte1 apn-profiles=internet
/ip route add dst-address=0.0.0.0/0 gateway=lte1 distance=20 comment="LTE backup"

# Bandwidth test antar-MikroTik (uji kapasitas link nyata)
/tool bandwidth-test address=10.0.0.2 direction=both protocol=tcp user=admin

# Monitoring kualitas link
/tool netwatch add host=8.8.8.8 interval=10s
/tool ping-speed address=8.8.8.8
```

⚠️ **`/tool bandwidth-server` sebaiknya dimatikan di produksi** — sering disalahgunakan untuk menghabiskan bandwidth Anda:
```
/tool bandwidth-server set enabled=no
```

---

## 10. Ringkasan

- WAN berbeda dari LAN terutama karena **media disewa** — mahal, lambat berubah, dibatasi **SLA**.
- Baca SLA dengan teliti: **99,9% = 8,76 jam downtime/tahun**, dan perhatikan **CIR vs bandwidth port**.
- Akses: **Metro Ethernet/DIA** (enterprise), **GPON** (murah, shared), **4G/5G** (backup cepat), **LEO satellite** (RTT jauh lebih baik daripada GEO).
- **Metro Ethernet**: E-Line (P2P), **E-LAN** (semua seperti satu LAN — mudah tetapi membentangkan broadcast/STP), E-Tree (hub-and-spoke).
- **MPLS** meneruskan berdasarkan **label** (layer 2,5). **L3VPN** memakai **VRF + RD + RT + MP-BGP**. Andal dan ber-SLA, tetapi **mahal, lambat, dan tidak mengenkripsi**.
- **Segment Routing (SR-MPLS/SRv6)** menghilangkan LDP dengan source routing — arah backbone modern.
- **SD-WAN**: overlay di atas transport apa pun, application-aware routing, **local internet breakout** (menghilangkan tromboning), zero-touch provisioning. Waspadai vendor lock-in dan biaya lisensi.
- Redundansi: dua provider **dengan media dan jalur fisik berbeda**. **Selalu verifikasi diverse path.**
- Failover memutus sesi kecuali memakai **BGP dengan IP sendiri** atau overlay SD-WAN.
- Optimasi WAN klasik (kompresi, dedup) **tidak bekerja pada trafik terenkripsi** — fokus bergeser ke local breakout dan CDN.

---

## 11. Latihan

1. Kenapa QoS wajib di WAN tetapi sering tidak diperlukan di LAN?
2. Provider menawarkan "100 Mbps" dengan CIR 20 Mbps. Apa artinya?
3. Jelaskan tromboning dan bagaimana SD-WAN mengatasinya.
4. Apa perbedaan E-Line, E-LAN, dan E-Tree? Kapan memakai masing-masing?
5. Anda punya dua link dari provider berbeda. Apa yang harus Anda verifikasi?
6. Kenapa MPLS L3VPN masih dipakai meski jauh lebih mahal daripada internet + IPsec?
7. Setelah failover ke ISP cadangan, semua sesi pengguna terputus. Kenapa, dan bagaimana mencegahnya?

<details>
<summary>Jawaban</summary>

1. Karena **bandwidth WAN mahal dan terbatas**, sehingga hampir selalu ada saat di mana permintaan melebihi kapasitas. Ketika itu terjadi, tanpa QoS semua trafik diperlakukan sama — backup besar bisa membuat panggilan VoIP putus dan aplikasi bisnis tidak responsif. Anda harus memutuskan secara eksplisit apa yang lebih penting.
   Di LAN dengan link 1–10 Gbps, kapasitasnya biasanya jauh melebihi kebutuhan, sehingga antrean jarang terbentuk dan QoS tidak memberi perbedaan nyata. QoS di LAN baru diperlukan pada titik agregasi yang oversubscribed atau untuk trafik khusus (storage, RoCE).

2. **CIR (Committed Information Rate) 20 Mbps adalah bandwidth yang benar-benar DIJAMIN** oleh provider dan dilindungi SLA. Sisanya (80 Mbps) adalah **best effort** — Anda boleh memakainya **kalau jaringan provider sedang tidak padat**, tetapi tidak ada jaminan dan tidak ada kompensasi jika tidak tersedia.
   Praktisnya: pada jam sibuk Anda mungkin hanya mendapat mendekati 20 Mbps. Untuk aplikasi kritis, **rancang berdasarkan CIR, bukan angka pemasaran**. Kalau bisnis Anda membutuhkan 50 Mbps yang andal, belilah CIR 50 Mbps.

3. **Tromboning** terjadi ketika trafik dari cabang menuju internet (mis. Microsoft 365, Zoom) harus **memutar melalui data center pusat** terlebih dahulu sebelum keluar ke internet — karena arsitektur MPLS hub-and-spoke tradisional hanya menyediakan pintu internet di pusat. Akibatnya latency bertambah besar (bisa puluhan hingga ratusan milidetik), bandwidth MPLS yang mahal terpakai untuk trafik internet biasa, dan link pusat menjadi bottleneck.
   **SD-WAN mengatasinya dengan local internet breakout**: edge di cabang mengenali aplikasi (application-aware) dan mengirim trafik SaaS **langsung ke internet dari cabang**, sementara trafik ke aplikasi internal tetap lewat overlay ke data center. Keamanan tetap terjaga karena edge SD-WAN menjalankan firewall/IPS, atau trafik diarahkan ke layanan keamanan cloud (SASE).

4. **E-Line** = koneksi **point-to-point** antara dua lokasi, seolah-olah kabel langsung. Gunakan untuk menghubungkan dua data center, atau kantor pusat ke satu cabang besar.
   **E-LAN** = **multipoint-to-multipoint** — semua lokasi berada dalam satu broadcast domain, seperti terhubung ke satu switch besar. Gunakan ketika semua lokasi perlu berkomunikasi bebas dan Anda ingin routing sederhana. ⚠️ Perhatikan bahwa broadcast dan STP membentang lintas WAN.
   **E-Tree** = **hub-and-spoke** — root (pusat) bisa berkomunikasi dengan semua leaf, tetapi leaf **tidak bisa** saling berkomunikasi langsung. Gunakan untuk keamanan/isolasi cabang, atau untuk layanan di mana pelanggan tidak boleh saling melihat (mis. ISP ke pelanggan).

5. **Apakah kedua link melewati jalur fisik yang berbeda.** Banyak organisasi membeli dua link dari provider berbeda dan mengira sudah redundan, padahal: (a) kedua provider **menyewa fiber dari operator infrastruktur yang sama**; (b) kedua kabel melewati **duct/galian yang sama** di sebagian jalur; (c) keduanya masuk gedung lewat **titik masuk yang sama**; (d) keduanya terhubung ke **POP yang sama**.
   Dalam semua kasus itu, satu ekskavator, satu kebakaran, atau satu kegagalan POP memutus keduanya. **Minta diverse path guarantee secara tertulis**, dan idealnya gunakan **media yang berbeda** (fiber + 4G/5G) serta titik masuk gedung yang berbeda.

6. Beberapa alasan yang masih valid: (a) **SLA end-to-end yang mengikat** untuk latency, jitter, dan packet loss — internet best effort tidak memberikan ini, dan untuk aplikasi seperti VoIP, video conference, atau sistem transaksi real-time, jaminan itu bernilai; (b) **QoS yang dihormati provider di seluruh jalur** — marking DSCP Anda dipertahankan, sedangkan di internet umumnya diabaikan; (c) **kesederhanaan operasional** — provider yang mengurus routing any-to-any, Anda tidak perlu mengelola mesh tunnel; (d) **tidak terekspos ke internet** — permukaan serangan lebih kecil; (e) **kepatuhan regulasi** di sektor tertentu (keuangan, kesehatan, pemerintahan) yang mensyaratkan jaringan privat.
   Namun tren jelas bergerak ke **hybrid**: MPLS untuk trafik kritis, internet + SD-WAN untuk sisanya — sering dengan pengurangan bandwidth MPLS secara bertahap.

7. Karena **alamat IP sumber berubah**. Saat failover, trafik keluar lewat ISP-B dengan alamat publik yang berbeda, dan NAT menerjemahkannya ke IP baru. Server di sisi lain melihat paket datang dari alamat yang berbeda dari sesi yang sudah ada, sehingga **membuangnya**; sesi TCP putus dan aplikasi harus menyambung ulang. Tabel NAT/koneksi lama juga tidak valid lagi.
   **Pencegahan:** (a) **BGP dengan blok IP milik sendiri (PI address) dan ASN sendiri** — Anda mengiklankan prefix yang sama lewat kedua ISP, sehingga alamat sumber tidak pernah berubah; failover hanya mengubah jalur, bukan identitas. Ini solusi yang benar tetapi memerlukan alokasi RIR dan pengelolaan BGP. (b) **SD-WAN overlay** — sesi berjalan di dalam tunnel dengan alamat overlay yang stabil; perpindahan underlay tidak terlihat oleh aplikasi. (c) Untuk kasus terbatas: **tunnel IPsec/WireGuard ke satu endpoint pusat** lewat kedua ISP, dengan routing di dalam tunnel — memberi efek serupa pada skala kecil.

</details>

---

## 12. Sumber

- MEF Forum — Carrier Ethernet Service Definitions (MEF 6.3)
- RFC 3031 — Multiprotocol Label Switching Architecture
- RFC 4364 — BGP/MPLS IP VPNs
- RFC 8402 — Segment Routing Architecture
- Cisco CCNA 200-301 v1.1, topik 1.2.d (WAN) dan 1.2.f (on-premises & cloud)
- Cisco, *SD-WAN Design Guide*

---

**Berikutnya:** `11-wan-vpn/02-tunneling-vpn.md` — mengamankan komunikasi lintas jaringan publik.

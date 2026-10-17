# 07.11 Interkoneksi Internet dan Ekosistem Indonesia

> **Prasyarat:** `07-routing-lanjutan/06-bgp` (atribut, filter, RPKI), `07-routing-lanjutan/07-redistribusi-policy` (route-map dan community), `00-fondasi/04-sejarah-dan-standar` (AS, tier, IXP, RIR). Untuk lab: `lab/00-setup-lab`.
> **Tujuan:** Anda memahami internet sebagai jaringan hubungan bisnis antar-AS (transit, peering, aturan ekspor valley-free), bisa membaca dan memakai PeeringDB, memahami cara kerja IXP dan route server, mampu menghitung kelayakan peering tanpa menebak harga, mengenal ekosistem Indonesia (IDNIC, IIX, JKT-IX, OpenIXP, DE-CIX Jakarta, CDIX, ID-NOG), mendaftarkan objek IRR dan ROA, lalu menjalankan sendiri route server BIRD dengan validasi RPKI di lab.

Seorang pelanggan ISP kecil di Bekasi membuka video. Server videonya ada di Jakarta, sekitar tiga puluh kilometer dari rumahnya. Tetapi traceroute menunjukkan paketnya pergi ke Singapura dulu, lalu kembali ke Jakarta. Tidak ada kabel yang putus dan tidak ada router yang salah konfigurasi. Paket itu hanya mengikuti uang: ISP kecil itu membeli transit dari penyedia yang kebetulan bertemu penyedia konten di Singapura, bukan di Jakarta. Modul ini tentang cara memperbaiki hal seperti itu, dan tentang aturan main yang membuat internet bekerja seperti sekarang.

---

## 1. Internet Adalah Kumpulan Kontrak

Di modul BGP Anda belajar bahwa internet adalah puluhan ribu **AS** (*Autonomous System*) yang saling bertukar rute. Yang belum dibahas: kenapa AS A mau membawa trafik AS B. Jawabannya hampir selalu kontrak bisnis, dan kontrak itu menentukan rute mana yang diiklankan ke siapa.

### 1.1 Jenis hubungan

| Hubungan | Siapa membayar | Apa yang dipertukarkan | Contoh |
|---|---|---|---|
| **Transit** | Pelanggan membayar penyedia | Penyedia mengirim seluruh tabel internet (atau default route) ke pelanggan, dan mengiklankan rute pelanggan ke semua orang | ISP lokal membeli transit dari operator nasional |
| **Peering settlement-free** | Tidak ada yang membayar (masing-masing menanggung biaya portnya) | Masing-masing hanya mengiklankan rute sendiri dan rute pelanggannya | Dua ISP sekota saling peering di IXP |
| **Paid peering** | Satu pihak membayar | Sama seperti peering (hanya rute sendiri + pelanggan), tetapi ada biaya karena rasio trafik atau kekuatan tawar timpang | ISP akses membayar ke jaringan besar agar bisa peering langsung |
| **Partial transit** | Pelanggan membayar | Penyedia mengirim sebagian tabel, misalnya rute regional atau rute pelanggan dan peer-nya saja | Transit "Asia saja" yang lebih murah |
| **Remote peering** | Pelanggan membayar penyedia layanan transport L2 | Port IXP Anda dibawa lewat jaringan pihak ketiga, jadi Anda bisa peering di IXP kota lain tanpa router di sana | ISP di Makassar ikut IXP Jakarta |

> [!TIP]
> **Bedanya ada di kolom "apa yang dipertukarkan".** Transit memberi Anda jalan ke mana saja. Peering hanya memberi jalan ke jaringan pihak lain dan pelanggannya, tidak lebih. Peer Anda tidak akan membawa trafik Anda ke peer-nya yang lain.

### 1.2 Tier: label yang longgar

| Tier | Ciri | Catatan |
|---|---|---|
| **Tier 1** | Menjangkau seluruh internet hanya lewat pelanggan dan peering, tidak membeli transit dari siapa pun | Daftarnya kecil dan sering diperdebatkan |
| **Tier 2** | Melakukan peering luas, tetapi tetap membeli transit untuk sebagian tujuan | Kebanyakan operator nasional |
| **Tier 3** | Hanya membeli transit, sedikit atau tanpa peering | ISP lokal, jaringan perusahaan |

> [!WARNING]
> **"Tier" bukan standar teknis.** Tidak ada badan yang menetapkannya. Peneliti biasanya menyimpulkan hubungan antar-AS dari data BGP publik (misalnya proyek AS Rank dari CAIDA) dan hasilnya tetap berupa inferensi. Jangan memakai label tier sebagai dasar keputusan teknis. Yang penting adalah: siapa pelanggan Anda, siapa penyedia Anda, dan siapa peer Anda.

---

## 2. Aturan Ekspor dan Jalur Valley-Free

### 2.1 Tiga peran, tiga kebijakan

Kontrak bisnis di atas bisa diringkas menjadi tiga peran. Penjelasan berikut mengikuti pembagian dalam buku Peterson & Davie (lihat atribusi di bagian Sumber):

- **Penyedia ke pelanggan (provider-customer).** Bisnis penyedia adalah menghubungkan pelanggannya ke seluruh internet. Kebijakannya: kirim semua rute yang saya tahu ke pelanggan, dan iklankan rute dari pelanggan ke semua orang.
- **Pelanggan ke penyedia (customer-provider).** Pelanggan ingin trafik ke dirinya (dan ke pelanggannya, kalau punya) dikirim lewat penyedia, dan ingin keluar ke internet lewat penyedia itu. Kebijakannya: iklankan prefix sendiri dan prefix pelanggan saya ke penyedia, kirim rute dari penyedia ke pelanggan saya, tetapi jangan iklankan rute dari satu penyedia ke penyedia lain. Kalau dilanggar, pelanggan menjadi jalan tembus antara dua penyedianya, padahal dia yang membayar keduanya.
- **Peer ke peer.** Dua jaringan yang merasa setara saling bertukar akses ke pelanggan masing-masing tanpa membayar penyedia ketiga. Kebijakannya: iklankan rute pelanggan saya ke peer, kirim rute dari peer ke pelanggan saya, tetapi jangan iklankan rute dari peer ke penyedia, atau dari penyedia ke peer.

Dalam bentuk tabel (baris = dari mana rute dipelajari, kolom = boleh diiklankan ke siapa):

| Rute dipelajari dari | ke Pelanggan | ke Peer | ke Penyedia |
|---|---|---|---|
| Diri sendiri (prefix milik sendiri) | Ya | Ya | Ya |
| Pelanggan | Ya | Ya | Ya |
| Peer | Ya | Tidak | Tidak |
| Penyedia | Ya | Tidak | Tidak |

Aturan ini dikenal sebagai **aturan Gao-Rexford**, dari dua makalah Lixin Gao dan Jennifer Rexford tahun 2001. Gao menunjukkan bahwa hubungan antar-AS bisa disimpulkan dari pola AS_PATH, dan bersama Rexford membuktikan bahwa kalau semua AS mengikuti aturan ekspor ini dan lebih menyukai rute dari pelanggan daripada dari peer atau penyedia (dengan syarat hubungan pelanggan-penyedia tidak membentuk siklus), BGP dijamin konvergen ke keadaan stabil tanpa koordinasi global.

### 2.2 Jalur valley-free

Akibat aturan ekspor itu, setiap jalur yang sah di internet berbentuk "gunung": naik dari pelanggan ke penyedia, paling banyak satu lintasan peer di puncak, lalu turun dari penyedia ke pelanggan.

```
                 [AS1] ======= peer ======= [AS2]
                 /    \                        \
        penyedia/      \penyedia                \penyedia
               /        \                        \
           [AS3]        [AS4]                   [AS5]
               \        /
       penyedia \      / penyedia
                 [AS6]          AS6 multihomed ke AS3 dan AS4
```

Garis miring menghubungkan penyedia (atas) dengan pelanggannya (bawah).

| Jalur | Bentuk | Sah? |
|---|---|---|
| AS6 → AS3 → AS1 → AS2 → AS5 | naik, naik, peer, turun | Ya, valley-free |
| AS5 → AS2 → AS1 → AS4 → AS6 | naik, peer, turun, turun | Ya, valley-free |
| AS3 → AS6 → AS4 | turun, lalu naik | Tidak, **lembah**: AS6 menjadi transit bagi dua penyedianya |
| AS1 → AS2 → (peer AS2 yang lain) | peer, lalu peer lagi | Tidak, dua lintasan peer |

Pola umumnya bisa ditulis seperti ekspresi reguler: `(naik)* (peer)? (turun)*`.

> [!WARNING]
> **Route leak adalah jalur yang tidak valley-free.** RFC 7908 mendefinisikan route leak sebagai penyebaran rute melewati batas yang dimaksudkan. Contoh klasiknya persis baris ketiga tabel: pelanggan multihomed menerima tabel penuh dari penyedia A lalu meneruskannya ke penyedia B. Penyedia B yang tidak memfilter akan mengirim sebagian trafik internetnya lewat pelanggan kecil itu, dan link pelanggan langsung penuh. Filter `^$` yang Anda pelajari di modul BGP adalah pertahanan paling dasar terhadap kesalahan ini.

### 2.3 Preferensi mengikuti uang

Selain aturan ekspor, ada aturan pemilihan:

```
Rute dari PELANGGAN  → paling disukai   (pelanggan membayar Anda)
Rute dari PEER       → berikutnya        (gratis)
Rute dari PENYEDIA   → paling akhir      (Anda membayar)
```

Karena LOCAL_PREF dievaluasi sebelum AS_PATH, cara standar menerapkannya adalah memberi LOCAL_PREF berbeda menurut asal rute, lalu menandai asal itu dengan community agar aturan ekspor bisa dijalankan di router mana pun dalam AS.

### 2.4 Implementasi dengan community (FRR)

Misalkan AS64500 punya upstream (penyedia), peer di IXP, dan satu pelanggan. Polanya: tandai saat masuk, filter saat keluar.

```
! Penanda asal rute
bgp community-list standard DARI-PELANGGAN permit 64500:100
bgp community-list standard DARI-PEER      permit 64500:200
bgp community-list standard DARI-UPSTREAM  permit 64500:300
!
route-map MASUK-PELANGGAN permit 10
 match ip address prefix-list PELANGGAN-X      ! dari IRR, lihat §8
 set local-preference 300
 set community 64500:100 additive
!
route-map MASUK-PEER permit 10
 set local-preference 200
 set community 64500:200 additive
!
route-map MASUK-UPSTREAM permit 10
 set local-preference 100
 set community 64500:300 additive
!
! Ke upstream dan peer: hanya prefix sendiri + rute pelanggan
route-map KELUAR-NONPELANGGAN permit 10
 match ip address prefix-list PFX-SENDIRI
route-map KELUAR-NONPELANGGAN permit 20
 match community DARI-PELANGGAN
! (implicit deny: rute dari peer dan upstream tidak pernah lolos)
!
! Ke pelanggan: semuanya
route-map KELUAR-PELANGGAN permit 10
```

Pasang `MASUK-*` sebagai filter `in` dan `KELUAR-*` sebagai filter `out` pada neighbor yang sesuai. Router border lain di AS yang sama cukup membaca community-nya, sehingga kebijakan tetap konsisten walaupun rute diteruskan lewat iBGP.

> [!TIP]
> **RFC 9234 (BGP Roles) mengotomatiskan sebagian pola ini.** Kedua sisi sesi menyatakan perannya (provider, customer, peer, rs-server, rs-client) di pesan OPEN, dan router memasang atribut OTC (*Only to Customer*) yang mencegah rute dari peer atau penyedia bocor naik lagi. Detail dan konfigurasinya ada di modul BGP bagian "Higiene dan Keamanan BGP 2026". Roles tidak menggantikan community di atas, tetapi menjadi jaring pengaman kedua.

---

## 3. IXP: Anatomi Sebuah Exchange

### 3.1 Fabric L2 dan peering LAN

Secara teknis, IXP adalah switch Ethernet besar (sering beberapa switch di beberapa gedung data center yang disambung menjadi satu fabric) yang menjadi satu domain broadcast bersama, disebut **peering LAN**. Setiap anggota mendapat:

- satu port fisik (1G, 10G, 100G, dan seterusnya),
- satu alamat IPv4 dan satu alamat IPv6 dari prefix peering LAN milik IXP,
- akses ke route server IXP.

Karena ratusan router berbagi satu domain broadcast, IXP menegakkan aturan ketat, umumnya:

| Aturan | Alasan |
|---|---|
| Satu MAC address per port (port security) | Mencegah loop dan perangkat tak terduga |
| Hanya Ethertype IPv4, ARP, IPv6 | Tidak ada STP, CDP, LLDP, DHCP, atau protokol lain yang "cerewet" |
| Tidak boleh ada proxy-ARP, ICMP redirect, atau Router Advertisement IPv6 | Router Anda jangan sampai menjawab ARP untuk alamat orang lain |
| MTU sesuai ketentuan IXP (umumnya 1500 di LAN utama) | MTU berbeda menyebabkan sesi BGP hidup tetapi update besar gagal |

Kalau Anda mengganti router atau line card, MAC address berubah. Laporkan ke NOC IXP sebelum penggantian, atau port Anda akan diblok oleh port security.

### 3.2 Bilateral atau multilateral

Dengan **peering bilateral**, Anda membuat sesi BGP langsung ke setiap jaringan yang mau peering. Dengan `n` anggota yang semuanya saling peering, jumlah sesinya `n(n−1)/2`. IXP dengan 800 anggota berarti sekitar 320.000 sesi. Tidak ada yang mau mengelola itu.

**Peering multilateral** memakai **route server (RS)**: setiap anggota cukup membuat satu (biasanya dua, untuk redundansi) sesi ke RS, dan RS meneruskan rute dari setiap anggota ke anggota lain.

```
Bilateral (n = 4)               Multilateral (route server)

  A ──── B                          A     B
  │ ╲  ╱ │                           ╲   ╱
  │  ╳   │      6 sesi                [RS]      4 sesi
  │ ╱  ╲ │                           ╱   ╲
  C ──── D                          C     D
```

Dalam praktik keduanya dipakai bersamaan: RS untuk "ekor panjang" anggota kecil, sesi bilateral untuk jaringan besar yang trafiknya penting atau yang tidak memakai RS (sebagian jaringan konten besar memilih bilateral saja).

### 3.3 Route server: route reflector versi eBGP

Route server diatur oleh RFC 7947 (perilaku protokol) dan RFC 7948 (operasi). Sifat terpentingnya:

1. **Transparan terhadap AS_PATH.** RS tidak menambahkan AS-nya sendiri. Anggota A melihat rute anggota B dengan AS_PATH `B`, seolah-olah peering langsung.
2. **NEXT_HOP tidak diubah.** Rute dari B tetap ber-next-hop alamat B di peering LAN. Akibatnya, trafik data mengalir langsung dari A ke B lewat switch IXP, tidak melewati RS. RS hanya bagian control plane.
3. **MED dan community diteruskan** apa adanya (kecuali community kontrol RS yang ditujukan untuk RS itu sendiri).
4. RS tidak memasang rute ke kernel, karena memang tidak meneruskan paket.

Konsekuensi poin 1: router anggota yang menegakkan pemeriksaan "AS pertama di AS_PATH harus sama dengan AS neighbor" akan membuang semua rute dari RS. Di FRR pemeriksaan ini aktif secara default (`enforce-first-as`) dan harus dimatikan per neighbor RS. Ini kesalahan nomor satu pemula di IXP, dan Anda akan melihatnya sendiri di lab.

**Masalah path hiding.** Kalau dua anggota mengumumkan prefix yang sama dan RS hanya punya satu tabel, RS memilih satu jalur terbaik. Kalau jalur terbaik itu ditolak kebijakan ekspor untuk anggota tertentu, anggota itu tidak menerima apa-apa padahal jalur kedua tersedia. RFC 7947 membahas solusinya: RS menyimpan RIB per klien, atau memakai Add-Path. BIRD menyediakan opsi `secondary` di channel BGP untuk mencoba jalur berikutnya.

**Perangkat lunak.** Dua implementasi yang paling sering dipakai IXP adalah **BIRD** (bird.network.cz, dari CZ.NIC) dan **OpenBGPD** (dari proyek OpenBSD). Konfigurasi RS di IXP besar jarang ditulis tangan: biasanya dihasilkan otomatis dari data anggota, IRR, dan RPKI oleh alat seperti IXP Manager atau arouteserver. Banyak IXP menjalankan dua RS dengan implementasi berbeda agar satu bug tidak menjatuhkan keduanya.

### 3.4 Mengendalikan route server dengan community

Karena RS meneruskan rute Anda ke semua anggota, IXP menyediakan community untuk mengendalikannya. Skema persisnya berbeda di setiap IXP, jadi selalu baca dokumentasi RS IXP Anda. Pola umum dengan Large Community (RFC 8092), dengan RS = ASN route server:

```
RS:0:peer-as     jangan kirim rute ini ke peer-as
RS:1:peer-as     kirim rute ini ke peer-as (dipakai bersama "jangan kirim ke semua")
RS:0:0           jangan kirim ke siapa pun
RS:101:peer-as   prepend satu kali ke peer-as
```

Banyak RS juga menambahkan community informasi pada rute yang diteruskannya, misalnya status RPKI (valid atau not found) atau lokasi masuk. Lab di bagian 11 memakai pola ini.

### 3.5 Kebijakan peering

Setiap jaringan sebaiknya menulis **kebijakan peering** (*peering policy*) yang bisa dibaca publik. Tiga kategori umum (kategori yang sama dipakai PeeringDB):

| Kebijakan | Arti |
|---|---|
| **Open** | Mau peering dengan siapa saja di IXP yang sama, biasanya cukup lewat RS |
| **Selective** | Mau peering dengan syarat: volume trafik minimum, hadir di beberapa lokasi, rasio trafik tertentu, NOC 24 jam |
| **Restrictive** | Umumnya tidak menerima permintaan peering baru |

Isi minimum dokumen kebijakan peering: ASN dan AS-SET, IXP dan fasilitas tempat Anda hadir, apakah memakai RS, persyaratan teknis (MD5 opsional/wajib, max-prefix yang harus disetel peer, IPv6 wajib), kontak NOC, dan janji Anda soal filter (misalnya "kami hanya menerima prefix yang terdaftar di IRR dan tidak RPKI-invalid").

### 3.6 Public peering, PNI, dan remote peering

- **Public peering**: lewat fabric IXP bersama. Murah per port, tetapi kapasitas dibagi untuk semua peer.
- **PNI** (*Private Network Interconnect*): kabel langsung (cross-connect) antara dua jaringan di gedung yang sama. Dipakai ketika trafik ke satu jaringan sudah cukup besar untuk mengisi port sendiri.
- **Remote peering**: port IXP dicapai lewat penyedia transport L2. Hemat karena tidak perlu router di lokasi IXP, tetapi menambah latensi dan satu titik kegagalan yang tidak terlihat oleh BGP (link transport putus, sesi BGP baru turun setelah hold timer habis, kecuali Anda memakai BFD).

---

## 4. PeeringDB: Buku Telepon Interkoneksi

**PeeringDB** (peeringdb.com) adalah basis data bebas yang diisi sendiri oleh jaringan, IXP, dan data center. Isinya: siapa hadir di mana, kebijakan peering, kontak, AS-SET, dan perkiraan jumlah prefix. Hampir semua engineer peering membukanya setiap hari.

### 4.1 Objek-objek utama

| Objek API | Isi |
|---|---|
| `org` | Organisasi pemilik |
| `net` | Satu jaringan (satu ASN): kebijakan, AS-SET, jumlah prefix |
| `ix` | Satu IXP: kota, kontak, URL statistik |
| `ixlan`, `ixpfx` | LAN peering IXP dan prefix IPv4/IPv6-nya |
| `netixlan` | Kehadiran satu jaringan di satu IXP: alamat IP, kecepatan port, apakah ikut RS |
| `fac`, `netfac` | Data center dan jaringan yang hadir di sana |
| `poc` | Kontak (NOC, peering, abuse) |

### 4.2 Membaca record jaringan

Contoh nyata (diambil dari API 13 Oktober 2026, dipangkas) untuk AS13335:

```bash
$ curl -s "https://www.peeringdb.com/api/net?asn=13335" | jq '.data[0] |
    {name, info_type, policy_general, info_prefixes4, info_prefixes6, irr_as_set}'
{
  "name": "Cloudflare",
  "info_type": "Content",
  "policy_general": "Open",
  "info_prefixes4": 80000,
  "info_prefixes6": 30000,
  "irr_as_set": "AS13335:AS-CLOUDFLARE"
}
```

Cara memakai setiap field:

| Field | Dipakai untuk |
|---|---|
| `info_prefixes4`, `info_prefixes6` | Menyetel maximum-prefix sesi Anda ke jaringan ini. Ini angka yang dijanjikan pemiliknya; beri ruang sekitar 10 sampai 20 persen |
| `irr_as_set` | Input `bgpq4` untuk membangun filter prefix sesi ini |
| `policy_general` | Open, Selective, Restrictive, atau No: apakah layak mengirim permintaan peering |
| `info_type` | NSP, Content, Cable/DSL/ISP, Enterprise, dan seterusnya: memperkirakan arah dan volume trafik |

> [!WARNING]
> **PeeringDB berisi data yang diisi sendiri.** Angkanya bisa usang. Kalau `info_prefixes4` milik peer terlalu kecil dibanding yang sebenarnya diumumkan, sesi Anda akan putus karena max-prefix, dan kesalahannya ada pada record mereka, tetapi gangguannya Anda yang merasakan.

### 4.3 Bertanya ke API

```bash
# Semua IXP di Indonesia, urut menurut jumlah anggota
curl -s "https://www.peeringdb.com/api/ix?country=ID" |
  jq -r '.data | sort_by(-.net_count)[] | "\(.net_count)\t\(.name)\t\(.city)"' | head

# Siapa saja yang hadir di JKT-IX (ix id 2476) dan ikut route server
curl -s "https://www.peeringdb.com/api/netixlan?ix_id=2476&is_rs_peer=true" |
  jq -r '.data[] | "\(.asn)\t\(.ipaddr4)\t\(.speed)"' | head

# IXP mana yang sama-sama dihadiri AS A dan AS B? (kandidat lokasi peering)
for asn in 64500 64501; do
  curl -s "https://www.peeringdb.com/api/netixlan?asn=$asn" | jq -r '.data[].name' | sort -u > ix-$asn.txt
done
comm -12 ix-64500.txt ix-64501.txt
```

Akses tanpa login dibatasi lajunya; saat menyiapkan modul ini, beberapa puluh permintaan beruntun dibalas `Request was throttled ... Authenticate for less restrictions` dan baru dibuka lagi hampir satu jam kemudian. Untuk skrip yang berjalan rutin, buat akun dan API key, tunggu beberapa detik antarpermintaan, dan simpan hasilnya (cache) alih-alih menembak API setiap kali.

### 4.4 Kebersihan record Anda sendiri

Setelah punya ASN, record PeeringDB Anda adalah "kartu nama" di depan semua calon peer. Minimal isi: AS-SET yang benar, jumlah prefix IPv4/IPv6 yang realistis (dengan cadangan pertumbuhan), kebijakan peering, kontak NOC yang benar-benar dibaca, dan daftar IXP serta data center tempat Anda hadir. Mengisi kontak dengan benar juga salah satu tindakan **Coordination** dalam MANRS.

---

## 5. Ekonomi Peering

Keputusan "ikut IXP atau tidak" adalah hitungan biaya, latensi, dan risiko. Modul ini sengaja tidak mencantumkan harga, karena harga transit dan port IXP di Indonesia berubah cepat, berbeda antarkota, dan sangat bergantung negosiasi. Yang Anda perlukan adalah cara menghitungnya dengan angka kontrak Anda sendiri.

### 5.1 Cara transit ditagih: persentil ke-95

Transit biasanya ditagih per Mbps dengan metode **burstable persentil ke-95 (p95)**:

```
1. Penyedia mengambil sampel laju trafik setiap 5 menit.
   30 hari × 24 jam × 12 sampel per jam = 8.640 sampel.
2. Urutkan dari terbesar ke terkecil.
3. Buang 5% teratas: 8.640 × 0,05 = 432 sampel.
4. Sampel tertinggi yang tersisa (urutan ke-433) adalah angka tagihan.
5. Biasanya dihitung terpisah untuk arah masuk dan keluar, lalu yang lebih besar yang ditagih.
```

Artinya, lonjakan pendek yang totalnya kurang dari sekitar 36 jam sebulan (432 × 5 menit) tidak ikut ditagih, tetapi jam sibuk harian Anda pasti ikut. Kontrak juga sering punya **commit**: Anda membayar minimal sekian Mbps walaupun p95 Anda di bawahnya.

### 5.2 Komponen biaya IXP

| Komponen | Keterangan |
|---|---|
| Biaya port IXP | Bulanan, menurut kecepatan port |
| Keanggotaan atau biaya setup | Sebagian IXP mengenakan biaya keanggotaan atau satu kali pasang |
| Cross-connect | Kabel dari rak Anda ke switch IXP di data center, biasanya ditagih data center |
| Kolokasi | Rak, daya listrik, akses gedung, kalau router Anda ditaruh di sana |
| Transport | Kalau router Anda tidak di gedung yang sama: link metro atau remote peering |
| Perangkat | Port router tambahan, optik; hitung sebagai amortisasi bulanan |
| Tenaga kerja | Konfigurasi, monitoring, menangani permintaan peering |

### 5.3 Titik impas

Misalkan:

```
H  = harga transit Anda per Mbps (p95) per bulan, dari kontrak
B  = total biaya bulanan ikut IXP (jumlah komponen 5.2)
O  = trafik (p95, Mbps) yang bisa DIPINDAH dari transit ke IXP

Peering layak secara biaya bila   O × H  >  B
Titik impas:                      O* = B / H
```

Contoh dengan satuan biaya hipotetis (ganti dengan angka kontrak Anda): kalau `B = 400 satuan` per bulan dan `H = 1 satuan per Mbps`, maka `O* = 400 Mbps`. Di bawah 400 Mbps trafik yang bisa dipindah, IXP lebih mahal daripada transit. Di atasnya, setiap Mbps tambahan adalah penghematan.

Cara memperkirakan `O`:

1. Ekspor NetFlow/sFlow/IPFIX dari router border, kelompokkan trafik per AS asal/tujuan.
2. Ambil daftar anggota IXP calon dari PeeringDB (`netixlan`).
3. Jumlahkan trafik ke AS yang (a) hadir di IXP itu dan (b) kebijakannya Open atau ikut RS.
4. Hitung p95 dari jumlah itu, bukan rata-rata.

> [!WARNING]
> **Dua jebakan perhitungan.** Pertama, memindahkan trafik ke IXP tidak otomatis menurunkan tagihan transit kalau Anda masih di bawah commit. Kedua, Anda tetap butuh kapasitas transit yang cukup untuk menanggung trafik itu saat IXP bermasalah. Kalau Anda menurunkan kapasitas transit terlalu jauh, gangguan IXP berubah menjadi gangguan total.

### 5.4 Manfaat di luar uang

- **Latensi lebih rendah.** Trafik domestik tetap domestik, tidak memutar lewat luar negeri seperti cerita di awal modul.
- **Ketahanan.** Satu jalur tambahan yang tidak bergantung pada penyedia transit.
- **Kendali.** Anda bisa memilih jalur ke jaringan tertentu dengan LOCAL_PREF, alih-alih menerima keputusan penyedia transit.

Biayanya: kompleksitas operasional (lebih banyak sesi, lebih banyak filter), dan risiko **de-peering** kalau hubungan dengan peer memburuk.

---

## 6. CDN, Cache Operator, dan Anycast

### 6.1 Ke mana trafik Anda sebenarnya pergi

Di jaringan akses (ISP rumah dan seluler), sebagian besar trafik masuk berasal dari segelintir jaringan konten: platform video, media sosial, CDN, dan pembaruan perangkat lunak. Karena itu peering dengan beberapa jaringan konten saja sering memindahkan porsi trafik yang besar. Ukur sendiri dengan analisis flow per AS (5.3), jangan mengandalkan perkiraan umum.

### 6.2 Embedded cache

Jaringan konten besar menawarkan server cache yang dipasang di dalam jaringan ISP. Contohnya Netflix Open Connect Appliance (OCA), Google Global Cache (GGC), dan program serupa dari Akamai serta Meta. Netflix, misalnya, menyatakan bahwa appliance embedded diberikan tanpa biaya kepada ISP mitra yang memenuhi syarat, yaitu yang punya trafik Netflix "substansial" ke pelanggannya, dan bahwa ISP mengatur sesi BGP dengan appliance itu untuk mengarahkan trafik. Syarat dan prosedur setiap program berbeda; baca halaman resmi masing-masing.

Cara kerja umumnya:

```
                  Internet (transit / peering)
                            │
                  ┌─────────┴─────────┐
                  │  Router ISP       │◄── eBGP: ISP mengiklankan ke cache
                  │                   │    prefix PELANGGAN yang dilayaninya
                  └──┬─────────────┬──┘
           isi ulang │             │ melayani pelanggan
           (fill)    │             │
                ┌────┴─────┐  ┌────┴──────────────┐
                │  Cache   │  │ Pelanggan ISP     │
                └──────────┘  └───────────────────┘
```

1. ISP menyediakan rak, daya, dan port; penyedia konten mengirim servernya.
2. ISP membuat sesi BGP ke cache dan mengiklankan prefix pelanggan yang boleh dilayani cache itu. Cache tidak mengiklankan rute apa pun ke ISP (atau hanya rute alamat dirinya).
3. Sistem pengarah milik penyedia konten mengarahkan pelanggan dari prefix tersebut ke cache lokal.
4. Cache mengisi ulang kontennya (*fill*) dari internet, biasanya di luar jam sibuk.

> [!WARNING]
> **Kesalahan umum:** mengiklankan prefix yang salah ke cache (misalnya lupa prefix CGNAT publik yang baru), sehingga sebagian pelanggan tetap dilayani dari luar. Atau sebaliknya, mengiklankan prefix pelanggan ISP lain (pelanggan transit Anda) tanpa izin program.

### 6.3 Anycast

**Anycast** berarti satu prefix yang sama diumumkan dari banyak lokasi. BGP di setiap jaringan memilih salah satunya menurut kebijakan dan panjang AS_PATH, sehingga pengguna "jatuh" ke lokasi yang (secara routing) terdekat. Anycast dipakai oleh server DNS root dan resolver publik, CDN, dan layanan mitigasi DDoS.

Hal yang perlu dipahami operator:

- "Terdekat" berarti terdekat menurut BGP, bukan menurut peta. Pelanggan di Surabaya bisa jatuh ke instans Singapura kalau jalur BGP ke sana lebih pendek atau lebih disukai upstream-nya. Peering lokal sering memperbaiki ini.
- Wilayah yang jatuh ke satu instans disebut **catchment**. Perubahan routing di mana pun bisa memindahkan catchment, jadi layanan anycast berbasis TCP harus tahan terhadap perpindahan (umumnya aman karena routing jarang berubah di tengah koneksi pendek).
- Kalau prefix anycast diumumkan dari beberapa ASN asal, setiap ASN itu butuh ROA sendiri. Tanpa itu, sebagian instans akan RPKI-invalid dan ditolak jaringan yang menerapkan ROV.

---

## 7. Ekosistem Indonesia

### 7.1 APNIC dan IDNIC

Indonesia berada di wilayah **APNIC**. Di bawah APNIC, Indonesia punya **NIR** (*National Internet Registry*) bernama **IDNIC**, yang menyebut dirinya "IDNIC - APJII" karena dikelola APJII. Bagi organisasi di Indonesia, jalur yang umum untuk mendapatkan IP dan ASN sendiri adalah menjadi anggota IDNIC.

Ringkasan prosedur menurut halaman IDNIC (diakses 13 Oktober 2026; selalu periksa ulang di idnic.net, karena syarat dan tarif bisa berubah):

| Tahap | Isi |
|---|---|
| Syarat organisasi | Badan hukum terdaftar di Indonesia, atau berencana memakai IP untuk jaringan di Indonesia |
| Aplikasi keanggotaan | Dokumen legal perusahaan (misalnya NIB dan akta), jenis dokumen bergantung tipe anggota |
| Aplikasi IP | Identitas pemohon, bukti kewenangan dari direksi, bukti operasional perusahaan, dan bukti kebutuhan: profil perusahaan, kontrak dengan penyedia upstream, lisensi ISP kalau Anda ISP, perjanjian peering IXP kalau Anda IXP |
| Evaluasi | Hostmaster IDNIC mengevaluasi sesuai kebijakan APNIC. IDNIC menyatakan bahwa sejak 19 Juli 2024 keputusan diterima atau ditolaknya permohonan IP adalah hasil evaluasi APNIC |
| Ukuran alokasi | IPv4 dari /24 (256 alamat) sampai maksimal /23 (512 alamat); IPv6 /48 atau /32 bergantung ukuran jaringan |
| ASN | Diminta setelah memiliki alokasi IP, lewat formulir dan email ke hostmaster, dengan diagram jaringan dan bukti perangkat. Estimasi menurut IDNIC: 1 sampai 3 hari kerja setelah data disetujui |
| Portal anggota | **MyIDNIC**: mengelola sumber daya, kontak, whois, dan sertifikasi sumber daya (RPKI) |

Modul ini sengaja tidak mencantumkan tarif keanggotaan; lihat halaman daftar harga IDNIC. Yang perlu Anda pahami: alokasi IPv4 baru kecil karena IPv4 sudah langka, sedangkan IPv6 cukup besar untuk seluruh rencana jaringan Anda. Rencanakan dual-stack sejak hari pertama (modul `08-ipv6/01-dasar-ipv6`).

IDNIC juga menjalankan whois dan Routing Registry yang terintegrasi dengan data alokasi (dibahas di §8), layanan reverse DNS, alat cek status ROV, serta kegiatan komunitas seperti Open Policy Meeting dan workshop.

### 7.2 IXP di Indonesia

Data dari API PeeringDB yang diambil 13 Oktober 2026. PeeringDB mencatat 80 IXP berkode negara ID. Kolom "Jaringan" adalah `net_count` (jumlah jaringan unik yang mencatat kehadirannya); angka ini diisi sendiri oleh anggota dan berubah setiap hari.

| IXP | Organisasi (menurut PeeringDB) | Kota | Jaringan | Prefix peering LAN |
|---|---|---|---|---|
| **JKT-IX** | NTT DATA's Global Data Centers division | Jakarta | 868 | 119.11.184.0/22, 2404:c8:0:a::/64 |
| **IIX-Jakarta** | Asosiasi Penyelenggara Jasa Internet Indonesia (APJII) | Jakarta | 828 | 123.108.8.0/21, 2001:7fa:2:5::/64 |
| **OpenIXP / NiCE** | OpenIXP / NiCE | Indonesia | 625 | 218.100.27.0/24, 218.100.36.0/24, 43.252.146.0/23, 2001:7fa:f::/48 |
| **DE-CIX Jakarta** | PT DE-CIX Indonesia Pratama | Jakarta | 177 | 49.213.56.0/23, 2001:df5:7880::/64 |
| **CDIX** | Cyber Data Center International | Jakarta | 84 | 103.30.172.0/23, 2001:df0:f080:cdc::/64 |

IXP lain dengan jumlah jaringan terbanyak pada tanggal yang sama: AIX, Tapos, Depok (320); ODIX Omadata, Surabaya (213); CXC Jakarta (201); BIX Jakarta (181); EdgeNXT, Jakarta (133); ILIX, Jakarta Selatan (105); Digital Edge EPIX Jakarta (98); IIX-JawaTimur, Surabaya (71); Equinix Jakarta (44).

Node IIX daerah lain yang tercatat antara lain IIX-Jabar (Bandung), IIX-Bali, IIX-Jogja, IIX-Lampung, IIX-Rimba-1 (Pekanbaru), IIX-Jateng, IIX-Sumut, dan IIX-Banten.

Beberapa pengamatan dari data yang sama:

- Kelima IXP di tabel mencatat dukungan IPv6 (`proto_ipv6: true`) dan MTU 1500 di LAN utamanya.
- Sebagian besar record kehadiran (`netixlan`) bertanda `is_rs_peer: true`: IIX-Jakarta 731 dari 852 record, DE-CIX Jakarta 149 dari 181, CDIX 55 dari 84, OpenIXP/NiCE 386 dari 626, dan JKT-IX 688 record. Artinya route server adalah cara utama anggota bertukar rute. Satu jaringan bisa punya lebih dari satu record di IXP yang sama.
- Satu jaringan biasanya hadir di beberapa IXP sekaligus. Jangan menjumlahkan angka anggota antar-IXP.

> [!TIP]
> **Memilih IXP pertama.** Jangan memilih dari jumlah anggota saja. Ambil daftar AS tujuan trafik terbesar Anda (5.3), lalu cek di PeeringDB di IXP mana mereka hadir dan apakah mereka ikut RS. Pertimbangkan juga gedung: IXP yang switch-nya ada di gedung tempat router Anda sudah berada menghemat cross-connect dan transport.

### 7.3 Komunitas: ID-NOG, APNIC, MANRS

- **ID-NOG** (idnog.or.id) adalah komunitas operator jaringan Indonesia: engineer ISP, IXP, data center, dan penyedia konten bertemu untuk berbagi pengalaman operasional. Situsnya menampilkan agenda dan materi acara.
- **APNIC** menyelenggarakan konferensi (termasuk APRICOT), pelatihan daring APNIC Academy, dan forum kebijakan. IDNIC juga mengadakan acara dan workshop untuk anggota.
- **MANRS** (manrs.org) adalah program norma keamanan routing yang dibahas di modul BGP. Operator bisa mendaftar dan menunjukkan bahwa ia menerapkan filtering, anti-spoofing, koordinasi, dan validasi global.

Komunitas ini adalah tempat Anda mendapat peer pertama, mendengar insiden lebih cepat daripada lewat berita, dan menemukan orang yang bisa dihubungi saat prefix Anda dibajak tengah malam.

---

## 8. IRR: Mengumumkan Niat Routing

### 8.1 Objek RPSL

**IRR** (*Internet Routing Registry*) adalah basis data publik tempat jaringan menyatakan "prefix ini akan saya umumkan dari AS ini" dan "ini daftar pelanggan saya". Formatnya RPSL (*Routing Policy Specification Language*). Objek yang paling penting:

| Objek | Isi |
|---|---|
| `aut-num` | Satu ASN: nama, kontak, dan (opsional) kebijakan impor/ekspor |
| `route` / `route6` | Satu prefix + ASN asal (`origin`) |
| `as-set` | Daftar ASN dan as-set lain, misalnya "AS saya + semua pelanggan saya" |
| `mntner` | Pemelihara: siapa yang boleh mengubah objek |

Contoh nyata dari whois APNIC (dipangkas): objek `aut-num` milik route server IIX:

```
$ whois -h whois.apnic.net -- "-T aut-num AS7597"
aut-num:        AS7597
as-name:        IIX-AS-AP
descr:          Indonesia Internet Exchange
descr:          APJII IIX AS
country:        ID
import:         from AS2687
                action pref=1000;
                accept AS2687
...
```

Contoh objek `route` dan `as-set` untuk ISP fiktif (ASN dan prefix dokumentasi):

```
route:          203.0.113.0/24
descr:          ISP Contoh Nusantara
origin:         AS64500
mnt-by:         MAINT-ID-CONTOH
source:         IDNIC

as-set:         AS64500:AS-PELANGGAN
descr:          AS64500 dan pelanggan BGP-nya
members:        AS64500, AS64510, AS64511
mnt-by:         MAINT-ID-CONTOH
source:         IDNIC
```

Di IRR IDNIC, objek `route` hanya bisa dibuat kalau pemelihara yang mengajukan punya hak di objek `inetnum` (prefix) dan di objek `aut-num` (ASN asal), lewat atribut seperti `mnt-routes`. Karena itu IDNIC menyatakan data IRR-nya terlindungi setara dengan data alokasi. Data IRR IDNIC juga dicerminkan ke IRR lain seperti RADB dan RIPE.

### 8.2 Kelemahan IRR

Tidak semua IRR memverifikasi kepemilikan. Di IRR pihak ketiga (misalnya RADB), siapa pun yang punya akun bisa membuat objek `route` untuk prefix apa pun. Contoh nyata hari ini: kueri `whois -h whois.radb.net -- "-i origin AS13335"` mengembalikan objek `route` untuk 1.0.0.0/24 yang dipelihara oleh `MAINT-AS8966`, bukan oleh pemegang prefix. Objek seperti itu bisa sah (dibuat penyedia transit atas nama pelanggan), bisa usang, bisa juga palsu. Filter yang dibangun dari IRR akan meloloskannya.

Itulah sebabnya praktik modern menggabungkan IRR dengan RPKI: IRR menjawab "apakah jaringan ini menyatakan akan mengumumkan prefix ini", RPKI menjawab "apakah pemegang prefix mengizinkannya". Sebagian server IRR modern (IRRd) bahkan menandai objek dengan status RPKI-nya; pada hasil kueri RADB di atas tampak atribut `rpki-ov-state: valid`.

### 8.3 bgpq4: dari IRR ke filter

`bgpq4` membaca IRR dan menghasilkan prefix-list untuk berbagai platform. Contoh nyata (dijalankan 13 Oktober 2026 lewat container resmi `ghcr.io/bgp/bgpq4`):

```bash
$ bgpq4 -S APNIC -4 -l IIX-IN AS7597
no ip prefix-list IIX-IN
ip prefix-list IIX-IN permit 203.119.41.0/24

$ bgpq4 -S APNIC -4 -b -l IIX AS7597          # format BIRD
IIX = [
    203.119.41.0/24
];

$ bgpq4 -S APNIC -4 -K7 -l IIX AS7597         # format MikroTik RouterOS v7
/routing filter rule add chain="IIX-V4" rule="if (dst==203.119.41.0/24) {accept}"
```

Opsi yang sering dipakai: `-6` untuk IPv6, `-A` untuk agregasi, `-J` Junos, `-X` IOS XR, `-S` untuk memilih sumber IRR (dokumentasi bgpq4 menyarankan sumber RIR dan RPKI, tidak sembarang IRR), `-m 24` untuk membatasi panjang prefix maksimum. Server default bgpq4 adalah `rr.ntt.net`.

> [!TIP]
> **Otomatiskan.** Jalankan bgpq4 terjadwal (misalnya setiap malam), bandingkan dengan filter yang terpasang, dan terapkan perubahan lewat sistem otomasi Anda. Filter yang dibuat tangan sekali lalu dilupakan adalah sumber gangguan klasik: pelanggan menambah prefix baru, mendaftarkannya di IRR, tetapi tetap tidak bisa diakses karena filter Anda usang.

---

## 9. RPKI di Indonesia: ROA, Validator, ROV

### 9.1 Rantai kepercayaan

```
IANA
  └── APNIC (trust anchor)                      sertifikat sumber daya
        └── IDNIC                               berisi blok IP dan ASN
              └── Anggota IDNIC (CA milik Anda)
                    └── ROA: "198.18.0.0/22, maxLength 22, boleh diumumkan AS64500"
```

1. Setiap pemegang sumber daya punya **sertifikat** yang menyatakan blok IP dan ASN miliknya, ditandatangani oleh tingkat di atasnya.
2. Pemegang menandatangani **ROA** (*Route Origin Authorization*) dengan sertifikat itu. Isinya: prefix, **maxLength**, dan **ASN asal** yang diizinkan.
3. Semua objek diterbitkan di **repositori publik**.
4. **Validator** (*relying party*) seperti Routinator atau rpki-client mengunduh semua repositori, memverifikasi tanda tangan sampai ke trust anchor, dan menghasilkan daftar **VRP** (*Validated ROA Payload*).
5. Router mengambil VRP dari validator lewat protokol **RTR** (RFC 8210) dan menjalankan **ROV** (RFC 6811): valid, invalid, atau not found.

Router tidak memverifikasi kriptografi sendiri. Itu sebabnya validator harus Anda percayai dan diletakkan di jaringan internal Anda.

### 9.2 Membuat ROA di MyIDNIC

Langkah menurut panduan IDNIC (diakses 13 Oktober 2026):

1. Masuk ke portal **MyIDNIC**, buka menu **Route Origin Authorizations**.
2. Kalau belum pernah membuat ROA, klik **Setup RPKI** untuk membuat CA organisasi Anda (sekali saja).
3. Klik **Create ROA**.
4. Isi **prefix**, **ASN**, dan **MSA** (*Most Specific Announcement*, istilah IDNIC untuk maxLength).
5. Tunggu propagasi. IDNIC memperkirakan 10 sampai 30 menit sampai ROA terlihat di validator IDNIC; validator lain di dunia bisa lebih lama karena siklus unduh masing-masing.
6. Periksa hasilnya dengan alat cek ROV IDNIC, looking glass, atau validator Anda sendiri.

Aturan praktis saat mengisi ROA:

| Situasi | Yang benar |
|---|---|
| Anda mengumumkan /22 saja | Satu ROA, prefix /22, **MSA 22**. Jangan memasang MSA 24 "untuk jaga-jaga" (RFC 9319, lihat modul BGP) |
| Anda juga mengumumkan dua /24 dari /22 itu untuk traffic engineering | Tambahkan ROA terpisah untuk setiap /24 yang benar-benar diumumkan |
| Penyedia mitigasi DDoS akan mengumumkan prefix Anda dari ASN mereka saat serangan | Buat ROA tambahan untuk ASN penyedia itu, sebelum terjadi serangan |
| Prefix anycast dari beberapa ASN | Satu ROA per ASN asal |
| Blok yang belum diumumkan sama sekali | Pertimbangkan ROA dengan ASN 0 (AS0) agar setiap pengumuman blok itu menjadi invalid |
| Prefix dialihkan ke pelanggan yang memakai ASN sendiri | ROA untuk ASN pelanggan itu, dengan prefix sepersis yang ia umumkan |

> [!WARNING]
> **ROA yang salah lebih berbahaya daripada tidak punya ROA.** Tanpa ROA, prefix Anda "not found" dan tetap diterima. Dengan ROA yang salah (ASN keliru, MSA terlalu pendek untuk prefix yang Anda umumkan), prefix Anda invalid dan ditolak oleh setiap jaringan yang menerapkan ROV, termasuk sejumlah transit global. Selalu buat ROA baru sebelum mengubah pengumuman, bukan sesudahnya.

### 9.3 Menjalankan validator sendiri

**Routinator** (NLnet Labs) paling mudah dijalankan lewat Docker. Sejak versi 0.12.0 tidak perlu lagi langkah inisialisasi untuk menerima perjanjian ARIN; kelima TAL RIR sudah disertakan.

```bash
docker run -d --restart=unless-stopped --name routinator \
  -p 3323:3323 -p 8323:8323 \
  -v rpki-cache:/home/routinator/.rpki-cache \
  nlnetlabs/routinator
# 3323 = RTR untuk router, 8323 = HTTP (status, metrik, API)
```

Alternatif yang juga banyak dipakai: **rpki-client** (proyek OpenBSD, tersedia versi portable untuk Linux) sebagai validator, ditambah **StayRTR** sebagai server RTR yang membaca keluaran JSON rpki-client.

Praktik operasional:

- Jalankan minimal dua validator, idealnya dengan perangkat lunak berbeda, dan arahkan router ke keduanya.
- Pantau kesegaran data. Validator yang macet tetapi tetap melayani RTR akan menyajikan data basi.
- Jangan biarkan router memakai validator di luar jaringan Anda lewat internet terbuka tanpa perlindungan; RTR tanpa enkripsi tidak punya autentikasi.

Konfigurasi ROV di router (FRR, BIRD, MikroTik v7, Cisco IOS XE, Junos) ada di modul BGP bagian "Higiene dan Keamanan BGP 2026".

---

## 10. Panduan: Menjadi Multihomed dan Mulai Peering

Skenario: ISP kecil di Indonesia, saat ini memakai IP dari satu upstream (alamat milik upstream, tanpa ASN). Tujuannya: punya IP dan ASN sendiri, dua upstream, lalu peering di satu IXP.

### Langkah 1: Siapkan dasar legal dan dokumen

- Pastikan izin penyelenggaraan usaha Anda sesuai (ISP perlu lisensi yang berlaku; ikuti regulasi Kementerian Komunikasi dan Digital yang terbaru).
- Siapkan dokumen untuk keanggotaan IDNIC dan bukti kebutuhan IP: diagram jaringan, rencana pelanggan, kontrak upstream.

### Langkah 2: Keanggotaan IDNIC, alokasi IP, lalu ASN

- Daftar anggota, ajukan IPv4 dan IPv6 sekaligus.
- Setelah IP disetujui, ajukan ASN.
- Simpan kredensial MyIDNIC di pengelola kata sandi tim, bukan di laptop satu orang. Kehilangan akses ke portal berarti tidak bisa mengubah ROA saat darurat.

### Langkah 3: Objek whois dan IRR

```
mntner      → MAINT-ID-NAMAISP (pemelihara milik Anda)
aut-num     → ASN Anda, kontak NOC dan abuse yang benar
route       → setiap prefix IPv4 yang akan diumumkan, origin ASN Anda
route6      → setiap prefix IPv6 yang akan diumumkan
as-set      → ASxxxxx:AS-NAMAISP berisi ASN Anda (dan nanti pelanggan BGP Anda)
domain      → reverse DNS untuk blok Anda
```

### Langkah 4: ROA

Buat ROA untuk setiap prefix yang akan diumumkan, dengan MSA sama dengan panjang prefix (§9.2). Lakukan sebelum pengumuman pertama.

### Langkah 5: Record PeeringDB

Buat akun, minta afiliasi ke organisasi Anda, isi record `net`: AS-SET, jumlah prefix IPv4/IPv6, kebijakan peering (Open untuk ISP kecil hampir selalu tepat), kontak NOC. Upstream dan calon peer akan memakai data ini untuk menyetel filter dan max-prefix mereka.

### Langkah 6: Rancang edge

| Keputusan | Pilihan umum untuk ISP kecil |
|---|---|
| Jumlah router border | Dua, satu per upstream, terhubung iBGP. Satu router menghemat biaya tetapi menjadi titik kegagalan tunggal |
| Tabel dari upstream | Default route + rute pelanggan upstream (partial) jika router terbatas; full table jika ingin memilih jalur terbaik per tujuan. Pastikan RAM cukup (lihat catatan MikroTik di modul BGP) |
| Platform | MikroTik CCR/RouterOS v7, Linux + FRR/BIRD, atau router vendor. Yang penting dukungan RPKI/RTR, prefix-list, dan community |
| Validator RPKI | Dua instans di jaringan internal (§9.3) |
| Monitoring | Pemantau pengumuman prefix (misalnya BGPalerter, open-source dari NTT) dan, kalau memungkinkan, BMP ke kolektor |

### Langkah 7: Konfigurasi sesi upstream

Ringkasan kebijakan (sintaks lengkap ada di modul BGP):

```
KELUAR ke setiap upstream:
  - hanya prefix milik sendiri (+ pelanggan BGP dari as-set Anda)
  - as-path ^$ (atau ^$ plus ASN pelanggan) sebagai lapisan kedua
  - prepending/community upstream untuk mengatur trafik masuk

MASUK dari setiap upstream:
  - tolak bogon, tolak prefix milik sendiri, tolak lebih panjang dari /24 (IPv4) dan /48 (IPv6)
  - tolak RPKI invalid (setelah masa "logging" singkat, lihat lab)
  - maximum-prefix sesuai yang diharapkan
  - LOCAL_PREF sesuai preferensi upstream
```

### Langkah 8: Umumkan dan verifikasi dari luar

- Cek dari looking glass upstream dan pihak ketiga (misalnya bgp.tools, bgp.he.net, RIPEstat): apakah prefix Anda terlihat, dengan AS_PATH yang benar, dan status RPKI valid.
- Uji kegagalan: matikan sesi ke upstream A pada jam sepi, pastikan trafik pindah ke B dalam hitungan detik sampai menit, lalu kembalikan.

### Langkah 9: Bergabung dengan IXP

1. Pilih IXP berdasarkan data trafik Anda (§7.2).
2. Isi formulir dan perjanjian keanggotaan IXP, pesan port dan cross-connect.
3. Terima alamat IPv4/IPv6 peering LAN, laporkan MAC address router Anda.
4. Konfigurasi interface: tanpa proxy-ARP, tanpa LLDP/CDP ke arah IXP, MTU sesuai ketentuan.
5. Bangun sesi ke kedua route server. Matikan `enforce-first-as` untuk sesi RS.
6. Tambahkan kehadiran Anda (`netixlan`) di PeeringDB.

### Langkah 10: Peering bilateral dan kebijakan peering

Setelah RS berjalan, lihat siapa di IXP itu yang tidak ikut RS tetapi trafiknya besar ke Anda. Kirim permintaan peering lewat kontak di PeeringDB, sertakan ASN, IP peering LAN, AS-SET, dan perkiraan jumlah prefix Anda. Publikasikan kebijakan peering Anda sendiri.

### Langkah 11: Operasi berkelanjutan

- Perbarui filter dari IRR secara otomatis.
- Pantau: sesi BGP turun, jumlah prefix yang diterima melonjak, prefix Anda diumumkan oleh AS lain, ROA mendekati kedaluwarsa atau berubah.
- Bergabung dengan ID-NOG dan milis operator, daftar MANRS ketika keempat tindakannya sudah Anda jalankan.

---

## 11. Lab: IXP Mini dengan Route Server BIRD dan RPKI

### 11.1 Topologi

```
                      peering LAN IXP 10.10.0.0/24
        ┌───────────────────── ix-sw (bridge L2) ─────────────────────┐
        │                            │                                │
   isp-a eth1 .11              rs eth1 .10                      isp-b eth1 .12
   AS64500 (FRR 10.4)          AS64510 (BIRD 2.17)              AS64501 (FRR 10.4)
   198.18.0.0/22               route server                     203.0.113.0/24  (ada ROA)
        │                            │                          192.0.2.0/24    (tanpa ROA)
   eth2 10.20.1.2/29           eth2 10.20.0.2/29                198.18.1.0/24   (BUKAN miliknya)
        │                            │
        └────────── eth2 ── rpki ── eth1 ───────┘
                    StayRTR v0.6.4, RTR port 8282
```

Skenario: ISP-B salah mengetik filter keluarnya dan ikut mengumumkan 198.18.1.0/24, bagian dari blok milik ISP-A. Lebih parah lagi, ada objek route "usang" untuk prefix itu di IRR atas nama ISP-B, sehingga filter IRR di route server meloloskannya. Yang tersisa sebagai pertahanan adalah RPKI.

Lab memakai prefix dokumentasi RFC 5737 (192.0.2.0/24, 203.0.113.0/24) dan ruang benchmark RFC 2544 (198.18.0.0/15) sebagai pengganti alamat publik, serta ASN dokumentasi RFC 5398 (64496 sampai 64511).

Berkas lab ada di `materi/lab/kode/interkoneksi/`:

| Berkas | Isi |
|---|---|
| `interkoneksi.clab.yml` | Topologi containerlab |
| `rs/Dockerfile`, `rs/bird.conf` | Image dan konfigurasi route server BIRD 2 |
| `isp-a/frr.conf`, `isp-b/frr.conf`, `daemons`, `vtysh.conf` | Konfigurasi FRR |
| `rpki/vrps.json` | Data uji VRP (format JSON rpki-client) yang dibaca StayRTR |
| `uji-tanpa-clab.sh` | Topologi yang sama dengan jaringan Docker biasa, tanpa containerlab dan tanpa sudo |

### 11.2 Menjalankan

```bash
cd materi/lab/kode/interkoneksi
docker build -t lab-bird:2 rs/                       # sekali saja
sudo containerlab deploy -t interkoneksi.clab.yml
# atau, tanpa containerlab:
./uji-tanpa-clab.sh up
```

Tunggu 30 sampai 60 detik. Alias yang memudahkan:

```bash
alias rs='docker exec clab-ixp-rs birdc -s /run/bird.ctl'
alias a='docker exec -it clab-ixp-isp-a vtysh -c'
alias b='docker exec -it clab-ixp-isp-b vtysh -c'
```

> [!WARNING]
> Pada `uji-tanpa-clab.sh`, Docker menamai interface secara berbeda (peering LAN menjadi `eth0`), tetapi alamat IP-nya sama. Contoh keluaran di bawah memakai penamaan containerlab.

### 11.3 Langkah 1: Sesi BGP dan RTR di route server

```
$ rs show protocols
Name       Proto      Table      State  Since         Info
device1    Device     ---        up     08:15:35.890
validator  RPKI       ---        up     08:15:50.986  Established
isp_a      BGP        ---        up     08:15:35.898  Established
isp_b      BGP        ---        up     08:15:35.898  Established

$ rs show route table r4
Table r4:
203.0.113.0/24-24 AS64501  [validator 08:15:50.986] * (100)
198.18.0.0/22-22 AS64500  [validator 08:15:50.986] * (100)
```

Format `198.18.0.0/22-22 AS64500` dibaca: prefix /22, maxLength 22, ASN asal 64500.

### 11.4 Langkah 2: Rute invalid ditolak

```
$ rs show route
Table master4:
192.0.2.0/24         unicast [isp_b 08:16:31] * (100) [AS64501i]
	via 10.10.0.12 on eth1
203.0.113.0/24       unicast [isp_b 08:15:51] * (100) [AS64501i]
	via 10.10.0.12 on eth1
198.18.0.0/22        unicast [isp_a 08:15:51] * (100) [AS64500i]
	via 10.10.0.11 on eth1

$ rs show route filtered
Table master4:
198.18.1.0/24        unicast [isp_b 08:15:51] * (100) [AS64501i]
	via 10.10.0.12 on eth1

$ docker logs clab-ixp-rs 2>&1 | grep RS:
<INFO> RS: tolak RPKI INVALID 198.18.1.0/24 origin AS64501
```

Rute hijack ada di Adj-RIB-In route server (berkat `import keep filtered on`), tetapi tidak diteruskan ke siapa pun. Lihat juga community informasi yang dipasang RS:

```
$ rs show route 203.0.113.0/24 all | grep -E "as_path|next_hop|large"
	BGP.as_path: 64501
	BGP.next_hop: 10.10.0.12
	BGP.large_community: (64510, 1000, 1)       ← RPKI valid
$ rs show route 192.0.2.0/24 all | grep large
	BGP.large_community: (64510, 1000, 2)       ← RPKI not found
```

Perhatikan `BGP.as_path: 64501` (tanpa 64510) dan `BGP.next_hop: 10.10.0.12` (alamat ISP-B, bukan RS). Itu dua sifat utama route server dari §3.3.

> [!WARNING]
> **Perhatikan stempel waktunya.** Di uji coba modul ini, sesi BGP naik sekitar 15 detik sebelum sesi RTR. Selama jeda itu tabel `r4` kosong, semua rute berstatus not found, dan hijack sempat lolos ke ISP-A sampai data ROA tiba dan BIRD mengevaluasi ulang. Di produksi, jeda seperti ini terjadi setiap kali route server atau validator di-restart. Itulah alasan menjalankan dua validator dan memantau sesi RTR, bukan hanya sesi BGP.

### 11.5 Langkah 3: Dari sisi ISP-A

```
$ a "show bgp ipv4 unicast"
RPKI validation codes: V valid, I invalid, N Not found

     Network          Next Hop            Metric LocPrf Weight Path
N*>  192.0.2.0/24     10.10.0.12               0    150      0 64501 i
V*>  198.18.0.0/22    0.0.0.0                  0         32768 i
V*>  203.0.113.0/24   10.10.0.12               0    200      0 64501 i

$ a "show bgp ipv4 unicast 203.0.113.0/24"
  64501
    10.10.0.12 from 10.10.0.10 (10.10.0.10)
      Origin IGP, metric 0, localpref 200, valid, external, otc 64510, best
      Large Community: 64510:1000:1

$ a "show bgp neighbors 10.10.0.10" | grep -i role
  Local Role: rs-client
  Remote Role: rs-server

$ docker exec clab-ixp-isp-a traceroute -n -s 198.18.0.1 203.0.113.1
 1  203.0.113.1  0.016 ms  0.002 ms  0.001 ms
```

Rute dari ISP-B diterima "dari" 10.10.0.10 (RS) tetapi next-hop-nya 10.10.0.12, dan traceroute membuktikan paket langsung ke ISP-B dalam satu hop. Atribut `otc 64510` dipasang otomatis karena kedua sisi mengumumkan role RFC 9234.

> [!WARNING]
> **Kalau LocPrf rute valid masih 150, bukan 200,** sesi BGP terbentuk sebelum sesi RTR ISP-A tersambung, jadi route-map dievaluasi saat status RPKI belum diketahui. Jalankan `a "clear bgp ipv4 unicast 10.10.0.10 soft in"`. Masalah "status RPKI berubah tetapi kebijakan tidak dievaluasi ulang" ini dibahas RFC 9324; BIRD di route server menanganinya otomatis lewat `import table on` dan opsi `rpki reload`.

### 11.6 Langkah 4: Percobaan, apa jadinya tanpa ROV di route server?

```
$ rs disable validator
$ rs show route table r4 count
0 of 0 routes for 0 networks in table r4
```

Tanpa data ROA, semua rute menjadi not found. Filter IRR di RS meloloskan 198.18.1.0/24 (objek route usang). Tunggu beberapa detik:

```
$ a "show bgp ipv4 unicast 198.18.1.0/24"
  64501
    10.10.0.12 from 10.10.0.10 (10.10.0.10)
      Origin IGP, metric 0, localpref 50, valid, external, otc 64510, best,
      rpki validation-state: invalid

$ a "show ip route 198.18.1.77"
Routing entry for 198.18.1.0/24
  Known via "bgp", distance 20, metric 0, best
  * 10.10.0.12, via eth1, weight 1
```

Inilah pelajaran terpenting lab ini. ISP-A sendiri menjalankan validasi RPKI dan tahu rute itu invalid, tetapi route-map-nya masih dalam tahap "logging" (`permit 10` dengan local-preference 50). LOCAL_PREF rendah tidak menolong sama sekali, karena 198.18.1.0/24 lebih spesifik daripada 198.18.0.0/22 milik ISP-A, dan forwarding selalu memilih prefix terpanjang sebelum melihat atribut BGP. Trafik ISP-A ke seperempat bloknya sendiri kini dikirim ke ISP-B.

### 11.7 Langkah 5: Tutup lubangnya

```
$ docker exec clab-ixp-isp-a vtysh -c "conf t" \
    -c "no route-map RS-IN permit 10" \
    -c "route-map RS-IN deny 10" -c "match rpki invalid" -c "end" \
    -c "clear bgp ipv4 unicast 10.10.0.10 soft in"

$ a "show bgp ipv4 unicast neighbors 10.10.0.10 received-routes"   # masih terlihat (soft-reconfiguration)
$ a "show bgp ipv4 unicast" | grep 198.18.1                        # tidak ada lagi
$ rs enable validator                                              # pulihkan RS
```

Sekarang ada dua lapis pertahanan: RS menolak invalid untuk semua anggota, dan ISP-A menolak invalid untuk dirinya sendiri kalau RS gagal.

### 11.8 Langkah 6: ROA baru tersebar lewat RTR

Sunting `rpki/vrps.json`, tambahkan ROA untuk 192.0.2.0/24 milik ISP-B:

```json
{ "prefix": "192.0.2.0/24", "maxLength": 24, "asn": 64501, "ta": "lab" }
```

StayRTR membaca ulang berkas setiap 10 detik dan menaikkan nomor seri. Dalam lab ini, RS mengevaluasi ulang rute sekitar satu detik setelah data baru tiba:

```
$ docker logs clab-ixp-rpki 2>&1 | tail -2
level=info msg="New update (3 uniques, 3 total prefixes, 0 router keys)."
level=info msg="Update added, new serial 1"
$ rs show route 192.0.2.0/24 all | grep large
	BGP.large_community: (64510, 1000, 1)      ← sekarang valid
```

### 11.9 Langkah 7: Mengendalikan RS dengan Large Community

ISP-B tidak ingin 203.0.113.0/24 dikirim ke ISP-A lewat RS (misalnya karena mereka akan membuat sesi bilateral). Ia memasang community kontrol `64510:0:64500`:

```
$ docker exec clab-ixp-isp-b vtysh -c "conf t" -c "route-map RS-OUT permit 10" \
    -c "set large-community 64510:0:64500" -c "end" \
    -c "clear bgp ipv4 unicast 10.10.0.10 soft out"
$ a "show bgp ipv4 unicast" | grep 203.0.113          # hilang dari ISP-A
```

Hapus lagi dengan `no set large-community` dan soft out.

### 11.10 Langkah 8: Merusak dengan sengaja

| Coba ini | Gejala yang akan Anda lihat |
|---|---|
| Di ISP-A: `router bgp 64500` → `neighbor 10.10.0.10 enforce-first-as`, lalu `clear bgp ipv4 unicast 10.10.0.10` | `PfxRcd` menjadi 0. Log FRR: `10.10.0.10 incorrect first AS (must be 64510)` |
| Di ISP-B: hapus `neighbor 10.10.0.10 route-map RS-OUT out` | Kolom `PfxSnt` berisi `(Policy)`: RFC 8212 di FRR menahan semua pengumuman eBGP tanpa kebijakan keluar |
| Di vrps.json: ganti ROA ISP-B menjadi `"prefix": "203.0.112.0/23", "maxLength": 23` | 203.0.113.0/24 menjadi INVALID dan masuk `show route filtered` di RS, walaupun ASN-nya benar |
| Di RS: `rs show protocols all isp_b` | Lihat statistik `Import updates ... filtered`, dan capability `Role: rs_client` dari ISP-B |

Baris ketiga adalah kesalahan ROA yang paling sering di dunia nyata: ROA /23 dengan maxLength 23 tidak mengizinkan /24 apa pun di dalamnya, jadi pengumuman /24 yang sah berubah menjadi invalid. Kembalikan berkasnya setelah mencoba.

### 11.11 Bongkar

```bash
sudo containerlab destroy -t interkoneksi.clab.yml --cleanup
# atau
./uji-tanpa-clab.sh down
```

---

## 12. Troubleshooting dan Kesalahan Umum

### 12.1 Tabel gejala

| Gejala | Penyebab paling mungkin | Perbaikan |
|---|---|---|
| Sesi ke RS `Established`, tetapi 0 prefix diterima | `enforce-first-as` aktif terhadap RS; atau filter masuk terlalu ketat; atau RFC 8212 (tidak ada kebijakan masuk) | Matikan enforce-first-as untuk RS; pasang kebijakan masuk eksplisit |
| Sesi ke RS hanya naik di satu dari dua RS | Alamat RS kedua salah, atau IXP belum mengaktifkan Anda di RS kedua | Cek dokumen IXP dan PeeringDB `ixlan` |
| Port IXP diblok setelah ganti router | Port security mendeteksi MAC baru | Laporkan MAC baru ke NOC IXP sebelum penggantian |
| Sesi BGP naik tetapi putus saat tabel besar dikirim | MTU tidak cocok di peering LAN | Samakan MTU dengan ketentuan IXP |
| Prefix Anda tidak terlihat di sebagian internet setelah mengubah pengumuman | ROA tidak mencakup prefix baru (invalid); atau filter IRR upstream belum diperbarui | Buat ROA dan objek route sebelum mengumumkan; minta upstream memperbarui filter |
| Saat serangan DDoS, mitigasi dari penyedia scrubbing tidak bekerja di sebagian jaringan | Penyedia scrubbing mengumumkan prefix Anda dari ASN-nya tanpa ROA | Siapkan ROA untuk ASN penyedia scrubbing jauh hari |
| Sesi ke peer putus berulang dengan pesan max-prefix | Peer mengumumkan lebih banyak prefix daripada angka di PeeringDB-nya; atau Anda menyetel limit terlalu ketat | Cocokkan dengan PeeringDB, hubungi peer, beri cadangan |
| Trafik ke satu CDN tetap lewat transit walau CDN hadir di IXP | CDN tidak ikut RS (perlu bilateral), atau rute transit punya LOCAL_PREF lebih tinggi | Cek PeeringDB `is_rs_peer`, minta peering bilateral, cek kebijakan LOCAL_PREF |
| Pelanggan di kota lain dilayani anycast dari luar negeri | Catchment mengikuti BGP, bukan geografi | Peering lokal dengan operator layanan anycast, cek AS_PATH |

### 12.2 Kesalahan yang paling sering

- **Menjadi transit tanpa sengaja.** Filter keluar ke IXP lupa diberi, sehingga rute dari upstream ikut diiklankan ke RS. RS yang baik akan menolaknya karena tidak cocok dengan IRR Anda, tetapi jangan bergantung pada filter orang lain.
- **ROA dengan maxLength terlalu longgar.** Membuka pintu bagi pembajak yang memalsukan ASN Anda sebagai asal dan mengumumkan sub-prefix.
- **Record PeeringDB dan IRR yang usang.** Peer menyetel filter dan max-prefix dari data itu.
- **Mengandalkan prepending berlebihan.** Prepending panjang membuat rute sah Anda kalah dari rute bocor yang AS_PATH-nya lebih pendek (lihat studi kasus di bawah).
- **Satu validator, tanpa pemantauan.** Validator mati diam-diam, router kehilangan data ROA setelah masa kedaluwarsa, dan ROV berhenti melindungi tanpa ada yang tahu.

### 12.3 Studi kasus: kebocoran Indosat, April 2014

Menurut analisis Dyn Research (Renesys) yang terbit 3 April 2014, pada 2 April 2014 mulai pukul 18:25 UTC Indosat (AS4761) membocorkan lebih dari 320.000 rute bukan miliknya, saat tabel global berisi hampir 500.000 rute, berulang kali selama sekitar dua jam. Sebagian besar rute bocor itu tidak menyebar jauh, tetapi beberapa ratus diterima luas, dan banyak di antaranya milik Akamai. Indosat sendiri ikut terganggu berat.

Dyn mencatat satu pelajaran yang relevan untuk setiap ISP: jaringan yang memperpanjang AS_PATH-nya dengan prepending berat termasuk yang paling parah terdampak, karena jalur bocor lewat Indonesia sering lebih pendek daripada jalur sah yang sengaja dipanjangkan.

Apa yang akan membatasi dampaknya hari ini:

- **Di sisi pembocor:** filter keluar berbasis prefix dan as-path (rute yang tidak dikenal tidak pernah keluar), dan max-prefix yang ketat di sesi upstream dan peer.
- **Di sisi penerima:** ROV akan menolak rute bocor untuk prefix yang punya ROA, karena ASN asalnya salah. Filter IRR dan max-prefix pada sesi ke Indosat akan memutus sesi sebelum ratusan ribu rute masuk.
- **Di sisi korban:** prefix yang punya ROA, dan AS_PATH yang tidak dipanjangkan tanpa perlu.

---

## 13. Ringkasan

- Internet adalah jaringan kontrak: transit (bayar, dapat jalan ke mana saja), peering (gratis atau berbayar, hanya rute pihak lain dan pelanggannya), partial transit, remote peering.
- **Aturan ekspor Gao-Rexford**: rute dari pelanggan ke semua orang; rute dari peer atau penyedia hanya ke pelanggan. Jalur sah berbentuk valley-free: naik, paling banyak satu peer, turun. Route leak adalah jalur yang melanggar ini.
- Preferensi: pelanggan > peer > penyedia, diterapkan dengan LOCAL_PREF dan community; RFC 9234 Roles menjadi jaring pengaman kedua.
- **IXP** adalah fabric L2 bersama dengan aturan ketat (satu MAC, tanpa protokol cerewet). Route server (RFC 7947) tidak menambah AS dan tidak mengubah next-hop, jadi trafik data langsung antar-anggota; matikan `enforce-first-as` untuk sesi RS.
- **PeeringDB** adalah sumber AS-SET, jumlah prefix (untuk max-prefix), kebijakan peering, dan kehadiran di IXP; datanya diisi sendiri dan bisa usang.
- Transit ditagih p95; titik impas IXP adalah `B / H`. Tetap sisakan kapasitas transit untuk saat IXP gagal.
- Embedded cache dari penyedia konten diatur lewat BGP: ISP mengiklankan prefix pelanggan ke cache. Anycast memilih lokasi menurut BGP, bukan geografi.
- Indonesia: IDNIC-APJII (NIR di bawah APNIC) untuk IP dan ASN; IXP terbesar menurut PeeringDB (13 Oktober 2026): JKT-IX, IIX-Jakarta, OpenIXP/NiCE, ditambah DE-CIX Jakarta, CDIX, dan puluhan lainnya; komunitas ID-NOG.
- **IRR** menyatakan niat routing tetapi autentikasinya bervariasi; RPKI membuktikan izin pemegang prefix. ROA dibuat di MyIDNIC dengan MSA sama dengan panjang prefix yang diumumkan.
- Lab membuktikan: tanpa ROV, filter IRR meloloskan hijack, dan LOCAL_PREF rendah tidak menolong melawan prefix yang lebih spesifik.

---

## 14. Latihan

1. Sebuah ISP kecil (AS64520) membeli transit dari AS64530 dan AS64540, serta peering dengan AS64550 di IXP. Router border-nya menerima rute 8.8.8.0/24 dari AS64530. Ke neighbor mana saja rute itu boleh diiklankan, dan mengapa?
2. Anda melihat AS_PATH `64601 64602 64603 64604` di looking glass. Dari data hubungan diketahui: 64602 adalah pelanggan 64601, 64602 adalah pelanggan 64603, dan 64604 adalah pelanggan 64603. Apakah jalur ini valley-free? Kalau tidak, AS mana yang kemungkinan membocorkan?
3. Anda baru tersambung ke dua route server sebuah IXP Jakarta dengan router FRR. Kedua sesi `Established`, `PfxSnt` 4, tetapi `PfxRcd` 0. Log berisi `incorrect first AS`. Jelaskan penyebab dan perbaikannya.
4. Tagihan transit Anda memakai p95 per bulan. Bulan ini ada serangan DDoS yang membuat trafik masuk 9 Gbps selama 50 jam, sedangkan jam sibuk normal Anda 2 Gbps. Kira-kira berapa angka p95 yang ditagih, dan apa pelajarannya?
5. Total biaya bulanan ikut IXP (port, cross-connect, kolokasi, amortisasi perangkat) adalah `B`, harga transit `H` per Mbps p95. Analisis NetFlow menunjukkan 600 Mbps p95 trafik ke AS yang hadir di IXP, tetapi hanya 350 Mbps di antaranya ke AS yang ikut route server. Bagaimana Anda menghitung kelayakan, dan apa yang Anda lakukan dengan 250 Mbps sisanya?
6. Anda memegang 198.18.0.0/22 dan membuat ROA dengan MSA 24 "supaya fleksibel", padahal hanya mengumumkan /22. Jelaskan serangan apa yang menjadi mungkin, lalu perbaiki ROA-nya.
7. Di lab, setelah validator RS dimatikan, ISP-A melihat 198.18.1.0/24 dengan `localpref 50` dan status invalid, tetapi trafiknya tetap terbelokkan ke ISP-B. Mengapa LOCAL_PREF rendah tidak cukup, dan apa dua perbaikan yang Anda lakukan?
8. Sebuah penyedia konten menawarkan cache embedded ke ISP Anda. Apa yang Anda iklankan ke cache lewat BGP, dan dua kesalahan konfigurasi apa yang paling mungkin membuat cache tidak efektif atau melanggar perjanjian?
9. Pelanggan Anda (ISP lebih kecil dengan ASN sendiri) mengeluh prefix barunya 203.0.113.0/24 tidak bisa diakses dari sebagian internet, padahal sudah diumumkan ke Anda dan Anda meneruskannya. Sebutkan tiga hal yang Anda periksa, berurutan.

<details>
<summary>Jawaban</summary>

1. Rute itu dipelajari dari penyedia (AS64530), jadi menurut aturan ekspor Gao-Rexford hanya boleh diiklankan ke pelanggan ISP itu (kalau ada). Tidak boleh ke AS64540 (penyedia lain), karena ISP akan menjadi jalan tembus antara dua penyedianya dan membayar keduanya untuk trafik orang lain. Tidak boleh ke AS64550 (peer), karena peer hanya berhak atas rute milik ISP dan pelanggannya; mengiklankan rute penyedia ke peer berarti memberi peer transit gratis. Di router, ini dijaga dengan filter keluar berbasis prefix sendiri/community pelanggan dan as-path `^$`.

2. Baca dari kanan (asal) ke kiri (pengamat): 64604 → 64603 adalah pelanggan ke penyedia (naik), 64603 → 64602 adalah penyedia ke pelanggan (turun), lalu 64602 → 64601 adalah pelanggan ke penyedia (naik lagi). Pola turun lalu naik membentuk lembah, jadi jalur ini tidak valley-free. Pembocornya kemungkinan **AS64602**: ia menerima rute dari penyedianya (64603) lalu mengiklankannya ke penyedia lain (64601). Ini persis route leak tipe pelanggan multihomed. Penyedia 64601 juga ikut bersalah karena tidak memfilter rute pelanggannya dengan IRR atau max-prefix. Dengan RFC 9234, 64603 akan memasang OTC dan 64601 (sebagai penyedia dengan role yang dinyatakan) akan menolak rute ber-OTC dari pelanggan.

3. Route server tidak menambahkan ASN-nya ke AS_PATH, jadi AS pertama di rute yang diterima adalah ASN anggota lain, bukan ASN RS. FRR secara default menegakkan `enforce-first-as` dan membuang setiap update yang AS pertamanya tidak sama dengan ASN neighbor, sehingga semua rute dari RS dibuang. Perbaikan: `router bgp <ASN>` → `no neighbor <IP-RS> enforce-first-as` untuk kedua RS, lalu `clear bgp ipv4 unicast <IP-RS>` (atau soft in). Pastikan juga ada route-map masuk, karena dengan default `traditional` FRR menerapkan RFC 8212.

4. Sebulan 30 hari punya 8.640 sampel lima menit; 5% teratas yang dibuang adalah 432 sampel atau 36 jam. Serangan berlangsung 50 jam (600 sampel), jadi setelah 432 sampel tertinggi dibuang, masih tersisa sekitar 168 sampel di level 9 Gbps. Sampel ke-433 berada di dalam periode serangan, sehingga p95 yang ditagih sekitar **9 Gbps**, bukan 2 Gbps. Pelajarannya: p95 hanya memaafkan lonjakan yang totalnya kurang dari sekitar 36 jam per bulan. Serangan panjang bisa melipatgandakan tagihan. Siapkan mitigasi yang memotong trafik serangan sebelum melewati port berbayar (RTBH atau scrubbing di upstream, lihat modul serangan L3-L7) dan pelajari klausul kontrak tentang DDoS.

5. Kelayakan dihitung dengan trafik yang benar-benar bisa dipindah sekarang, yaitu 350 Mbps via RS: layak secara biaya bila `350 × H > B`, atau titik impas `O* = B / H` dibandingkan 350. Sisa 250 Mbps adalah ke AS yang hadir di IXP tetapi tidak ikut RS: cek kebijakan peering mereka di PeeringDB (Open, Selective), lalu ajukan peering bilateral. Kalau berhasil, `O` naik ke 600 Mbps. Jangan masukkan 250 Mbps itu ke perhitungan sebelum ada kesepakatan, dan ingat bahwa penghematan nyata baru terjadi kalau p95 transit Anda turun di atas commit kontrak.

6. Dengan MSA 24, ROA Anda mengizinkan semua /23 dan /24 di dalam /22 diumumkan dengan ASN asal Anda, padahal Anda tidak mengumumkannya. Penyerang bisa melakukan **forged-origin sub-prefix hijack**: mengumumkan misalnya 198.18.1.0/24 dengan AS_PATH yang diakhiri ASN Anda. ROV menilainya valid (prefix dan origin cocok dengan ROA), dan karena lebih spesifik, rute itu menang di forwarding di mana-mana. Perbaikan sesuai RFC 9319: ubah ROA menjadi 198.18.0.0/22 dengan **MSA 22**. Kalau suatu saat Anda perlu mengumumkan /24 tertentu, buat ROA terpisah untuk /24 itu saja, sebelum mengumumkannya.

7. Forwarding memakai **longest prefix match** sebelum atribut BGP berperan. LOCAL_PREF hanya membandingkan jalur untuk prefix yang sama. Karena tidak ada jalur lain untuk 198.18.1.0/24, rute invalid itu tetap terbaik untuk prefix tersebut, dan /24 lebih spesifik daripada /22 milik ISP-A, sehingga trafik ke 198.18.1.0/24 dibelokkan. Perbaikan: (1) di ISP-A, ubah route-map menjadi menolak RPKI invalid (`route-map RS-IN deny 10` + `match rpki invalid`) lalu soft in; (2) pulihkan ROV di route server (`enable validator`) dan buat validator RS redundan. Sebagai lapisan tambahan, banyak ISP juga menolak prefix miliknya sendiri yang datang dari luar.

8. ISP mengiklankan ke cache **prefix pelanggan yang boleh dilayani cache itu** (termasuk prefix publik CGNAT dan IPv6 pelanggan), biasanya sesuai ketentuan program. Kesalahan umum: (a) lupa memasukkan prefix pelanggan baru (misalnya blok CGNAT atau IPv6 yang baru dialokasikan), sehingga pelanggan dari prefix itu tetap dilayani dari luar dan trafik transit tidak turun; (b) mengiklankan prefix yang tidak boleh dilayani, misalnya prefix pelanggan transit atau jaringan pihak ketiga, yang bisa melanggar perjanjian dan membebani cache. Kesalahan ketiga yang sering: filter keluar ke cache tidak ada, sehingga full table ikut terkirim.

9. (1) **RPKI**: apakah ada ROA untuk 203.0.113.0/24 dengan ASN pelanggan dan maxLength yang cocok? Kalau blok induknya punya ROA milik pemegang lain (misalnya Anda sebagai pemberi alokasi) tanpa ROA untuk ASN pelanggan, prefix itu invalid dan ditolak oleh jaringan yang menerapkan ROV. (2) **IRR**: apakah ada objek `route` untuk prefix itu dengan origin ASN pelanggan, dan apakah ASN pelanggan ada di AS-SET Anda? Upstream dan peer Anda membangun filter dari AS-SET Anda; kalau belum masuk, mereka membuangnya. (3) **Propagasi dan filter Anda sendiri**: periksa di looking glass upstream apakah prefix itu diterima, apakah filter otomatis Anda sudah diperbarui, dan apakah max-prefix pelanggan masih cukup.

</details>

---

## 15. Sumber

- RFC 7947, Internet Exchange BGP Route Server: https://www.rfc-editor.org/rfc/rfc7947
- RFC 7948, Internet Exchange BGP Route Server Operations: https://www.rfc-editor.org/rfc/rfc7948
- RFC 7908, Problem Definition and Classification of BGP Route Leaks: https://www.rfc-editor.org/rfc/rfc7908
- RFC 9234, Route Leak Prevention and Detection Using Roles in UPDATE and OPEN Messages: https://www.rfc-editor.org/rfc/rfc9234
- RFC 8092, BGP Large Communities Attribute: https://www.rfc-editor.org/rfc/rfc8092
- RFC 6811, BGP Prefix Origin Validation: https://www.rfc-editor.org/rfc/rfc6811
- RFC 8210, The RPKI to Router Protocol, Version 1: https://www.rfc-editor.org/rfc/rfc8210
- RFC 9319, The Use of maxLength in the RPKI: https://www.rfc-editor.org/rfc/rfc9319
- RFC 9324, Policy Based on the RPKI without Route Refresh: https://www.rfc-editor.org/rfc/rfc9324
- RFC 5737 (IPv4 Address Blocks Reserved for Documentation), RFC 5398 (AS Number Reservation for Documentation), RFC 2544 (benchmarking): https://www.rfc-editor.org/rfc/rfc5737
- Gao, L. (2001), On Inferring Autonomous System Relationships in the Internet, IEEE/ACM ToN 9(6): https://doi.org/10.1109/90.974527
- Gao, L. & Rexford, J. (2001), Stable Internet Routing Without Global Coordination, IEEE/ACM ToN 9(6): https://doi.org/10.1109/90.974523
- Computer Networks: A Systems Approach, 4.1 Global Internet (Common AS Relationships and Policies): https://book.systemsapproach.org/scaling/global.html
- PeeringDB API (ix, net, netixlan, ixlan, ixpfx), diambil 13 Oktober 2026: https://www.peeringdb.com/api/ix?country=ID
- PeeringDB, dokumentasi: https://docs.peeringdb.com/
- IDNIC, Cara Mendapatkan IP Address: https://idnic.net/membership/how-to-get-ip
- IDNIC, Panduan ASN: https://idnic.net/manage-resource/internet-resource-guide/asn-guide
- IDNIC, ROA (Route Origin Authorization): https://idnic.net/service/rpki/roa
- IDNIC, Internet Routing Registry dan Routing Objects: https://idnic.net/service/whois/irr
- ID-NOG: https://idnog.or.id/
- BIRD 2 User's Guide (BGP, RPKI, filter): https://bird.network.cz/?get_doc&v=20&f=bird.html
- FRRouting, RPKI: https://docs.frrouting.org/en/latest/bgp.html
- Routinator, dokumentasi: https://routinator.docs.nlnetlabs.nl/
- NLnet Labs, RPKI documentation: https://rpki.readthedocs.io/
- StayRTR: https://github.com/bgp/stayrtr
- bgpq4: https://github.com/bgp/bgpq4
- BGPalerter: https://github.com/nttgin/BGPalerter
- containerlab, bridge dan linux kind: https://containerlab.dev/manual/kinds/linux/
- Netflix Open Connect: https://openconnect.netflix.com/
- MANRS: https://www.manrs.org/
- Dyn Research (Renesys), Indonesia Hijacks the World (3 April 2014), arsip: https://web.archive.org/web/20141016015930/http://research.dyn.com/2014/04/indonesia-hijacks-world/

Subbagian 2.1 mengadaptasi sebagian penjelasan dari *Computer Networks: A Systems Approach*, Larry Peterson & Bruce Davie, © Elsevier 2012, https://github.com/SystemsApproach/book, lisensi CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Perubahan: diterjemahkan ke bahasa Indonesia, diringkas, dan ditambah tabel aturan ekspor serta contoh jalur valley-free.

---

**Berikutnya:** `08-ipv6/01-dasar-ipv6`. Alamat IPv6, yang alokasinya dari IDNIC cukup besar untuk seluruh rencana jaringan Anda.

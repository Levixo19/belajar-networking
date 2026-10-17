# 20.4 Babak 3: Teka-teki Alamat

> **Prasyarat:** `20.3`, ditambah `04` (IP, subnetting, VLSM) dan `08` (IPv6)
> **Tujuan:** Menyusun rencana pengalamatan IPv4 dan IPv6 untuk 23 lokasi di bawah batasan yang saling menekan, lalu membuktikan sendiri bahwa hitungannya benar tanpa melihat kunci jawaban.

---

## 1. Bentuk Kerja Babak Ini

Babak ini satu-satunya yang punya **jawaban yang bisa salah secara objektif.** Tidak ada ruang berdebat: subnet yang tumpang tindih itu tumpang tindih, dan subnet yang kekecilan akan kehabisan alamat pada hari yang bisa dihitung.

Bentuknya teka-teki: batasan diberikan, ruangnya sempit, dan ada satu jebakan yang membuat pendekatan paling wajar gagal.

Yang membedakan babak ini: **Anda bisa memeriksa pekerjaan sendiri dengan checksum.** Kalau angka Anda cocok, hitungan Anda hampir pasti benar. Kalau tidak cocok, Anda tahu harus mengulang — tanpa pernah melihat kunci.

> [!NOTE]
> Mode Ujian: 90 menit untuk IPv4, 45 menit untuk IPv6. Boleh pakai `referensi/tabel-subnetting.md` dan kalkulator subnet.

---

## 2. Ruang yang Anda Punya

| Sumber daya | Nilai |
|---|---|
| Blok korporat IPv4 | **`10.64.0.0/12`** (bukan `10.0.0.0/8`) |
| Blok IPv6 dari ISP | **`2001:db8:5e4a::/48`** |
| Alamat publik IPv4 | `203.0.113.8/29` di HQ (untuk DMZ & NAT) |

> [!CAUTION]
> **Lubang yang tidak boleh disentuh:** mitra logistik ekspor sudah memakai `10.66.0.0/16` di jaringan mereka, dan BNS terhubung ke mereka lewat VPN antar-perusahaan. Alamat itu tidak boleh dipakai, tidak boleh tumpang tindih, dan tidak boleh ikut dalam prefix apa pun yang BNS iklankan ke mereka.

---

## 3. Yang Harus Dimuat

Angka "sekarang" adalah perangkat aktif hari ini.

**JKT-HQ — 14 segmen**

| VLAN | Fungsi | Sekarang |
|---|---|---|
| 10 | Staf lantai 1 | 40 |
| 11 | Staf lantai 2 | 70 |
| 12 | Staf lantai 3 | 60 |
| 13 | Staf lantai 4 | 50 |
| 20 | Voice (telepon IP) | 240 |
| 24 | Wi-Fi karyawan | 400 |
| 28 | Wi-Fi tamu | 80 |
| 29 | Printer & MFP | 25 |
| 50 | Server aplikasi | 40 |
| 51 | Server basis data | 6 |
| 52 | Cadangan & penyimpanan | 4 |
| 60 | CCTV & kendali pintu | 24 |
| 70 | DMZ (web publik) | 8 |
| 99 | Manajemen perangkat | 60 |

**SBY-PLANT — 10 segmen**

| VLAN | Fungsi | Sekarang |
|---|---|---|
| 10 | Staf kantor pabrik | 60 |
| 20 | Voice | 50 |
| 24 | Terminal forklift & HT | 40 |
| 28 | Wi-Fi tamu & kontraktor | 30 |
| 40 | Timbangan & printer label | 18 |
| 50 | OT — PLC & mesin pembeku | 35 |
| 51 | OT — HMI & SCADA | 8 |
| 60 | CCTV | 64 |
| 70 | Sensor suhu & IoT rantai dingin | 120 |
| 99 | Manajemen perangkat | 40 |

**MKS-DEPO — 6 segmen**

| VLAN | Fungsi | Sekarang |
|---|---|---|
| 10 | Staf | 25 |
| 20 | Voice | 20 |
| 24 | Wi-Fi | 40 |
| 60 | CCTV | 12 |
| 70 | Sensor suhu | 20 |
| 99 | Manajemen | 10 |

**TPI (20 lokasi, seragam) — 6 segmen per lokasi**

| VLAN | Fungsi | Sekarang |
|---|---|---|
| 99 | Manajemen | 4 |
| 10 | Tablet & staf | 6 |
| 70 | Sensor suhu & timbangan | 10 |
| 60 | CCTV | 4 |
| 20 | Voice | 2 |
| 28 | Wi-Fi tamu nelayan | 20 |

**Infrastruktur bersama**

| Kebutuhan | Jumlah |
|---|---|
| Loopback router & switch L3 | 30 |
| Tautan titik-ke-titik WAN & antar-inti | 14 |
| Jaringan manajemen out-of-band | 25 |
| Lab & staging (tidak boleh menyentuh produksi) | 1 blok |

---

## 4. Aturan Teka-teki

1. **Ruang tumbuh 100%.** Setiap subnet harus memuat **minimal dua kali** jumlah perangkat sekarang. Pilih **prefix terkecil yang masih cukup** — bukan yang paling longgar. Alamat yang dihambur-hamburkan adalah alamat yang tidak ada saat depo keempat dibuka.
2. **Satu ringkasan per situs besar.** HQ, pabrik, dan depo masing-masing harus bisa diwakili satu prefix di tabel rute.
3. **Satu ringkasan untuk seluruh TPI**, yang tidak menyertakan situs lain. Harus muat sampai 20 TPI dan menyisakan ruang tumbuh.
4. **Nomor TPI terbaca dari alamatnya.** Melihat `10.72.7.x` harus langsung memberi tahu ini TPI-07. Teknisi lapangan akan berterima kasih pada Anda jam 3 pagi.
5. **VLAN 70 (sensor suhu) tidak berbagi subnet dengan apa pun.** Ini kebutuhan kepatuhan, bukan kerapian.
6. **Lab & staging harus mustahil tertukar dengan produksi**, bahkan oleh orang yang salah baca.
7. **Tautan P2P:** pilih `/30` atau `/31` dan pertahankan alasannya.
8. **Alamat khusus tetap dipesan:** `.1` untuk gateway, `.2`–`.9` untuk perangkat jaringan, kolam DHCP mulai `.50`, di atas `.200` untuk perangkat tetap yang didaftarkan. Tuliskan konvensinya, jangan diingat saja.

---

## 5. Yang Harus Dikeluarkan

Tulis di `05-alamat.md`:

**a. Pembagian tingkat pertama** — bagaimana `10.64.0.0/12` dipecah untuk situs, infrastruktur, lab, dan TPI. Tandai lubang `10.66.0.0/16` sebagai terlarang di dokumen, jangan hanya di kepala.

**b. Himpunan prefix yang diiklankan ke mitra** — daftar prefix **seminimal mungkin** yang mencakup seluruh ruang BNS **tanpa** menyentuh lubang.

**c. Tabel subnet per situs** — kolom: VLAN, fungsi, kebutuhan, kebutuhan ×2, prefix, network, rentang usable, broadcast, gateway.

**d. Template TPI** — satu tabel, plus rumus/aturan untuk menurunkannya ke 20 lokasi.

**e. Rencana IPv6** — skema penomoran subnet, contoh alamat untuk tiga situs, dan keputusan untuk setiap segmen: SLAAC, DHCPv6 stateful, atau statis. Sertakan keputusan Anda tentang apa yang dilakukan pada sensor yang tidak mendukung IPv6.

**f. Konvensi nama & DNS** — pola nama perangkat, zona DNS internal, kebijakan reverse DNS, dan hierarki NTP (termasuk: apa yang menjadi sumber waktu saat WAN pabrik mati).

**g. Berkas `subnets.txt`** — satu prefix per baris, semua subnet produksi. Ini yang akan diperiksa mesin di §6.

---

## 6. Verifikasi Mandiri

### 6.1 Periksa tumpang tindih dengan mesin

Simpan semua subnet Anda di `subnets.txt` (satu per baris, format `10.64.10.0/24`), lalu:

```bash
python3 - <<'PY'
import ipaddress
nets = [ipaddress.ip_network(l.strip()) for l in open('subnets.txt') if l.strip()]
bad = 0
for i, a in enumerate(nets):
    for b in nets[i+1:]:
        if a.overlaps(b):
            print("TUMPANG TINDIH:", a, b); bad += 1
hole = ipaddress.ip_network('10.66.0.0/16')
for a in nets:
    if a.overlaps(hole):
        print("MASUK LUBANG MITRA:", a); bad += 1
print(f"jumlah subnet = {len(nets)}")
print(f"jumlah panjang prefix = {sum(n.prefixlen for n in nets)}")
print("HASIL:", "BERSIH" if bad == 0 else f"{bad} masalah")
PY
```

### 6.2 Checksum

Kerjakan dulu, cocokkan kemudian. Kalau tidak cocok, **jangan lihat kunci** — cari sendiri barisnya.

| # | Yang dihitung | Harus sama dengan |
|---|---|---|
| C1 | Jumlah **panjang prefix** dari 14 subnet HQ (prefix terkecil yang cukup untuk kebutuhan ×2) | **353** |
| C2 | Jumlah panjang prefix 10 subnet pabrik | **252** |
| C3 | Jumlah panjang prefix 6 subnet depo Makassar | **157** |
| C4 | Jumlah panjang prefix 6 subnet satu TPI | **166** |
| C5 | Total C1+C2+C3+C4 dan jumlah subnet dalam template (HQ+pabrik+depo+satu TPI) | **928** dan **36** |
| C6 | Jumlah **oktet kedua** dari semua prefix yang diiklankan ke mitra, dan jumlah panjang prefixnya | **271** dan **58** |
| C7 | Jumlah oktet ketiga dari 20 subnet dasar TPI (bila TPI-01 = `10.72.1.0/24` dst.) | **210** |
| C8 | Jumlah `/64` IPv6 yang benar-benar terpakai di seluruh perusahaan (20 TPI penuh) | **150** |

> [!TIP]
> C1–C5 hanya cocok bila Anda benar-benar memilih **prefix terkecil yang cukup**. Satu subnet yang terlalu longgar akan membuat jumlahnya lebih kecil; satu yang kekecilan membuatnya lebih besar. Checksum ini menangkap kesalahan yang mata Anda lewatkan — termasuk jebakan di §7.

---

## 7. Peringatan Jebakan

Ada tiga tempat di mana orang yang sudah paham subnetting tetap jatuh.

> [!WARNING]
> **Jebakan pertama — kurang dua.** Satu segmen di pabrik butuh tepat 128 alamat setelah dikali dua. `/25` terdengar pas: 128 alamat. Tapi network dan broadcast tidak bisa dipakai host, jadi `/25` hanya memberi **126**. Jawabannya `/24`. Cek setiap baris Anda yang kebutuhannya pas di batas: 2, 6, 14, 30, 62, 126, 254.

> [!WARNING]
> **Jebakan kedua — lubang di tengah.** Cara paling wajar membagi adalah "situs ke-n dapat `10.(64+n).0.0/16`". Cara itu akan mendaratkan salah satu situs tepat di `10.66.0.0/16`. Lebih jauh lagi: lubang di tengah blok membuat `10.64.0.0/12` **tidak bisa** diiklankan sebagai satu ringkasan — dan banyak orang baru menyadarinya setelah rute mitra tertelan.

> [!WARNING]
> **Jebakan ketiga — kolam DHCP, bukan subnet.** Subnet yang cukup besar tidak menjamin DHCP tidak kehabisan. Sensor di TPI dapat `/27` (30 alamat usable) untuk 10 perangkat — terlihat aman. Tapi bila masa sewa 3 hari dan perangkat sering berganti alamat, kolam bisa penuh oleh sewa yang sudah tidak dipakai. Tuliskan **ukuran kolam dan masa sewa per VLAN**, bukan hanya ukuran subnet. (Anda akan bertemu akibat kelalaian ini di Babak 8.)

---

## 8. Ringkasan

- Ruang alamat yang sempit memaksa keputusan; blok `/8` membuat orang tidak pernah belajar VLSM.
- Lubang di tengah blok adalah pelajaran paling penting babak ini: **kemampuan meringkas adalah sifat rancangan, bukan sifat protokol.**
- "Prefix terkecil yang cukup" dihitung dari **usable**, bukan dari total alamat.
- Alamat yang bisa dibaca manusia (nomor TPI terlihat di oktet) menghemat waktu saat gangguan jam 3 pagi.
- Rencana IPv6 yang baik memetakan situs dan VLAN ke digit heksadesimal yang bermakna — dan itu justru membatasi cara Anda menomori VLAN.
- Ukuran kolam DHCP dan masa sewa adalah bagian dari rencana pengalamatan, bukan detail yang diurus nanti.

---

## 9. Latihan: Pembuktian Hitungan

1. Tunjukkan mengapa `10.64.0.0/12` tidak bisa diiklankan sebagai satu prefix ke mitra, lalu turunkan himpunan prefix **seminimal mungkin** yang mencakup seluruh ruang BNS tanpa menyentuh `10.66.0.0/16`. Sebutkan berapa prefix yang Anda butuhkan dan buktikan tidak ada himpunan yang lebih kecil.
2. Segmen CCTV pabrik: 64 kamera sekarang, aturan ruang tumbuh 100%. Tentukan prefixnya, lalu jelaskan kenapa banyak orang menjawab `/25` dan kenapa itu salah. Sebutkan tiga angka kebutuhan lain di tabel §3 yang punya sifat batas serupa.
3. Untuk 14 tautan titik-ke-titik, bandingkan `/30` dan `/31`: berapa alamat yang dihemat secara total, kapan `/31` bisa menimbulkan masalah, dan pada tautan mana di kasus BNS Anda tetap memilih `/30`.
4. Rancang skema subnet IPv6 dari `2001:db8:5e4a::/48` sehingga nomor situs dan nomor VLAN bisa dibaca langsung dari alamatnya. Jelaskan batasan yang skema itu paksakan pada penomoran VLAN Anda, dan apa yang terjadi bila suatu saat ada VLAN 120.
5. Kenapa VLAN 70 (sensor suhu) tidak boleh berbagi subnet dengan CCTV, padahal keduanya "perangkat kecil yang hanya mengirim data"? Berikan empat alasan yang berasal dari empat sudut berbeda: kepatuhan, keamanan, operasional, dan kinerja.

<details>
<summary>Jawaban</summary>

1. Karena `10.64.0.0/12` mencakup `10.64.0.0`–`10.79.255.255`, dan `10.66.0.0/16` berada **di tengahnya**. Mengiklankan `/12` berarti memberi tahu mitra "kirimkan semua lalu lintas untuk 10.64-10.79 ke saya", termasuk alamat milik mitra sendiri — akibatnya lalu lintas internal mitra bisa tertarik ke arah BNS (atau, tergantung pemilihan rute terpanjang, menimbulkan perilaku yang membingungkan dan sulit didiagnosis). Himpunan minimal yang mencakup 64-79 kecuali 66: **`10.64.0.0/15`** (64-65) + **`10.67.0.0/16`** (67) + **`10.68.0.0/14`** (68-71) + **`10.72.0.0/13`** (72-79) — **empat prefix**. Buktinya tidak ada yang lebih kecil: batas-batas blok biner memaksa demikian. Di sisi bawah lubang tersisa dua nilai (64, 65) yang selaras sebagai satu `/15`; di sisi atas tersisa 67 sendirian — 67 bernilai ganjil sehingga tidak bisa digabung dengan 68 dalam satu blok selaras (blok `/15` harus mulai di angka genap), jadi 67 wajib berdiri sebagai `/16`; lalu 68-71 adalah empat nilai selaras (`/14`) dan 72-79 delapan nilai selaras (`/13`). Tiga prefix tidak mungkin karena setiap penggabungan yang lebih besar akan menelan 66. Checksum pemeriksa: 64+67+68+72 = **271**, dan 15+16+14+13 = **58**. Pelajaran umum: **satu alamat yang "dipinjam" pihak lain di tengah blok Anda bisa mengubah satu baris tabel rute menjadi empat** — karena itu, saat merancang, letakkan blok yang dipakai pihak luar di **tepi**, bukan di tengah.

2. CCTV pabrik: 64 sekarang → butuh ≥ 128 usable. `/25` memberi 2⁷ = 128 alamat total, tetapi **usable = 128 − 2 = 126**, kurang dua dari kebutuhan. Jadi jawabannya **`/24`** (254 usable). Orang menjawab `/25` karena mencocokkan kebutuhan dengan **ukuran blok**, bukan dengan **jumlah host yang bisa dipakai** — kesalahan yang muncul justru pada angka yang "kelihatan pas" (128, 256, 64). Angka lain di §3 dengan sifat batas serupa setelah dikali dua: **Voice HQ 240 → 480** (bukan `/24` yang hanya 254, harus `/23`), **Wi-Fi karyawan HQ 400 → 800** (bukan `/23` yang 510, harus `/22`), **Staf lantai 2 HQ 70 → 140** (bukan `/25` yang 126, harus `/24`), dan **Server basis data 6 → 12** (bukan `/29` yang 6, harus `/28`). Kebiasaan yang menyelamatkan: hafal daftar usable — `/30`:2, `/29`:6, `/28`:14, `/27`:30, `/26`:62, `/25`:126, `/24`:254, `/23`:510, `/22`:1022 — lalu bandingkan kebutuhan terhadap daftar itu, bukan terhadap pangkat dua.

3. `/30` memakai 4 alamat per tautan (2 usable), `/31` memakai 2 (keduanya dipakai, sesuai RFC 3021). Untuk 14 tautan: `/30` menghabiskan 56 alamat, `/31` menghabiskan 28 — **hemat 28 alamat**, dan yang lebih berharga: `/31` membuat rencana lebih rapi karena satu `/24` dapat memuat 128 tautan alih-alih 64. Kapan `/31` bermasalah: pada perangkat atau versi perangkat lunak lama yang tidak mendukungnya, pada tautan **multi-akses** (Ethernet dengan lebih dari dua perangkat — `/31` hanya sah untuk titik-ke-titik sejati), pada tautan yang butuh alamat ketiga (misalnya untuk FHRP, atau untuk perangkat pemantau/penyadap di segmen yang sama), dan saat perangkat lunak pemantau/IPAM lama salah menafsirkan alamat network sebagai tidak dapat dipakai. Di kasus BNS: pakai `/31` untuk tautan antar-switch inti dan antar-router yang sudah pasti modern; tetap pakai **`/30`** pada tautan menuju perangkat lama yang masih dipertahankan sementara di pabrik, pada tautan yang menghadap perangkat pihak ketiga (mitra/ISP) yang tidak bisa Anda kontrol atau uji, dan pada tautan yang direncanakan menampung perangkat ketiga. Alasan yang harus ditulis di dokumen: keseragaman lebih berharga daripada penghematan 28 alamat — jadi pilih satu sebagai standar dan daftarkan pengecualiannya secara eksplisit.

4. Skema yang memenuhi: `/48` memberi 16 bit ruang subnet = empat digit heksadesimal pada kelompok keempat. Bagi menjadi **`R S V V`** — `R` satu digit untuk region, `S` satu digit untuk situs di dalam region, dan `VV` dua digit untuk VLAN. Artinya setiap region memegang `2001:db8:5e4a:R000::/52` (16 region), setiap situs memegang `2001:db8:5e4a:RS00::/56` (16 situs per region, 256 situs total), dan setiap VLAN memegang satu `/64`. Pemetaan contoh: region 1 = Jakarta, 2 = Surabaya, 3 = Makassar, 8 dan 9 = TPI. Maka **HQ VLAN 20 = `2001:db8:5e4a:1020::/64`**, **pabrik VLAN 70 = `2001:db8:5e4a:2070::/64`**, **depo Makassar VLAN 99 = `2001:db8:5e4a:3099::/64`**, dan **TPI-04 VLAN 10 = `2001:db8:5e4a:8410::/64`** (region 8, situs 4). Total `/64` terpakai: 14 + 10 + 6 + (20 × 6) = **150**. Batasan yang dipaksakan: karena nomor VLAN ditulis apa adanya sebagai dua digit heksadesimal agar terbaca manusia, **nomor VLAN Anda harus tetap 0-99 dan tidak boleh memakai digit heksadesimal a-f** — jadi penomoran VLAN 10, 20, 24, 28, 29, 40, 50, 51, 52, 60, 70, 99 masih aman, tetapi VLAN 100 tidak muat dalam dua digit. Bila suatu saat muncul VLAN 120, pilihannya: **(a)** jangan pakai nomor itu — tetapkan aturan penomoran VLAN maksimum 99 sebagai bagian dari standar; **(b)** ubah pembagian menjadi `R VVV` (satu digit region, tiga digit VLAN sampai 999) dengan konsekuensi hanya 16 region dan tidak ada digit situs — perlu region berbeda per situs; atau **(c)** terima bahwa digit subnet tidak lagi mencerminkan nomor VLAN untuk VLAN di atas 99 dan dokumentasikan pengecualiannya. Yang **tidak boleh** dilakukan: menyisipkan begitu saja sehingga dua VLAN berbeda memetakan ke `/64` yang sama. Pelajaran nyatanya: **rencana IPv6 yang enak dibaca manusia menempatkan syarat pada rencana VLAN Anda** — kedua rencana harus dirancang bersama, bukan berurutan.
   - Keputusan per segmen: server, PLC/HMI, timbangan, printer label, dan perangkat jaringan → **statis** (atau DHCPv6 dengan pemesanan) supaya aturan firewall dan log stabil; staf, Wi-Fi karyawan, Wi-Fi tamu → **SLAAC** (tambah DHCPv6 stateless untuk opsi DNS/NTP bila klien memerlukannya, dan matikan *privacy extensions* pada perangkat yang dikelola agar alamatnya bisa dilacak di log); sensor suhu dan kamera yang **tidak mendukung IPv6** → tetap IPv4 saja pada VLAN-nya (dual-stack di sisi gateway), jangan dipaksakan; ICMPv6 tidak boleh diblokir menyeluruh karena NDP dan Path MTU Discovery bergantung padanya; dan siapkan pengamanan hop pertama (RA Guard, DHCPv6 Guard, IPv6 snooping) karena RA liar adalah salah satu cara termudah membajak lalu lintas — hal yang akan diuji di Babak 6.

5. Empat alasan dari empat sudut:
   - **Kepatuhan:** data suhu adalah bukti yang diperiksa auditor ekspor. Segmen tersendiri memungkinkan Anda menyatakan dan **membuktikan** ruang lingkup: perangkat mana yang menghasilkan bukti, lalu lintasnya ke mana, siapa yang boleh menyentuhnya. Bila sensor bercampur kamera, ruang lingkup audit melebar ke seluruh sistem CCTV (termasuk aksesnya oleh vendor CCTV) dan Anda kehilangan kemampuan membatasi siapa yang bisa memengaruhi bukti.
   - **Keamanan:** kamera IP adalah salah satu perangkat paling sering terinfeksi (kata sandi bawaan, firmware tak ditambal — dan di BNS hal itu sudah terjadi, lihat Babak 8). Satu subnet berarti satu domain serangan: kamera yang terinfeksi bisa langsung meracuni ARP, memalsukan DHCP, atau memindai sensor tanpa melewati satu pun titik inspeksi. Subnet terpisah membuat setiap percakapan antara keduanya harus melewati gateway yang bisa menolak, mencatat, dan membatasi laju.
   - **Operasional:** aturan firewall, kebijakan QoS, dan alarm ditulis **per subnet**. Dengan segmen tersendiri, "sensor suhu tidak boleh bicara ke internet kecuali ke pengumpul data" adalah satu baris aturan yang jelas; dengan segmen bercampur, aturan itu harus menyebut alamat host satu per satu dan akan basi dalam sebulan. Pemecahan masalah juga berbeda: menghitung "berapa sensor yang diam" jauh lebih mudah bila subnet hanya berisi sensor.
   - **Kinerja:** perilaku lalu lintasnya bertolak belakang. Kamera menghasilkan aliran besar dan terus-menerus (64 kamera bisa melebihi 100 Mbps), sedangkan sensor mengirim paket kecil dan jarang tapi **tidak boleh terlambat**. Dalam satu broadcast domain, ledakan lalu lintas kamera, badai broadcast, atau kolam DHCP yang habis karena banyaknya kamera akan langsung mengganggu sensor — padahal sensorlah yang menentukan apakah kontainer bisa diekspor. Pemisahan memungkinkan QoS dan pembatasan laju yang berbeda untuk keduanya.

</details>

---

## 10. Rubrik Babak 3 (130 poin)

| Aspek | Poin | Kriteria |
|---|---|---|
| Pembagian tingkat pertama | 20 | Lubang dihindari & didokumentasikan, ada ruang tumbuh, TPI terkumpul |
| Himpunan prefix iklan minimal | 15 | Empat prefix, checksum C6 cocok |
| Tabel subnet per situs | 30 | Checksum C1-C5 cocok, tidak ada tumpang tindih (diuji skrip §6.1) |
| Template TPI & keterbacaan | 15 | Nomor TPI terbaca dari alamat, checksum C7 cocok |
| Rencana IPv6 | 25 | Skema bermakna, keputusan per segmen, checksum C8 cocok, batasannya disadari |
| Nama, DNS, NTP | 15 | Zona internal masuk akal, sumber waktu tetap ada saat WAN mati |
| Kolam & masa sewa DHCP | 10 | Ditulis per VLAN, bukan hanya ukuran subnet |

Nilai < 80 berarti ulangi `04-network-layer/02` dan `03`, serta `08-ipv6`, lalu kerjakan lagi — babak ini fondasi untuk Babak 4.

---

## 11. Sumber

- `04-network-layer/02-subnetting.md`, `03-vlsm-cidr.md`
- `08-ipv6/01-dasar-ipv6.md`, `02-slaac-ndp.md`
- `referensi/tabel-subnetting.md` — tabel usable per prefix
- RFC 3021 (`/31` untuk tautan titik-ke-titik), RFC 1918, RFC 6177 (kebijakan `/48`), RFC 7020
- RFC 6762 §3 — kenapa `.local` tidak boleh dipakai untuk zona DNS internal

---

**Berikutnya:** `20-proyek-akhir/05-babak-4-bangun-di-lab.md`. Turun ke perangkat, dan buktikan dengan uji terima.

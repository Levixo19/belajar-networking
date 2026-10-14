# 19.4 — MikroTik: QoS, Queue & Hotspot

> **Prasyarat:** `19-mikrotik/03` (mangle), `11-wan-vpn/03` (QoS), `06-aplikasi/02` (DHCP)
> **Tujuan:** Anda bisa mengelola bandwidth dengan simple queue dan queue tree (PCQ, burst), dan membangun hotspot dengan voucher — inti kebutuhan ISP/RT-RW-Net.

---

## 1. Manajemen Bandwidth di RouterOS

Dua mekanisme queue:

```
SIMPLE QUEUE  → mudah, per-target (IP/subnet). Cocok untuk mayoritas kasus.
QUEUE TREE    → hierarkis, fleksibel, butuh mangle mark. Untuk skenario kompleks.
```

### Simple Queue (paling umum)
```routeros
# Batasi satu pelanggan ke 10Mbps down / 3Mbps up
/queue simple
add name="pelanggan-01" target=192.168.1.10/32 \
    max-limit=3M/10M    # format: upload/download

# Batasi seluruh subnet pelanggan
add name="paket-5mbps" target=192.168.10.0/24 max-limit=5M/5M
```

⚠️ **Format `max-limit` adalah `upload/download`** (dari perspektif router: TX/RX target). Kesalahan umum membalik keduanya. `max-limit=3M/10M` = 3 Mbps upload, 10 Mbps download.

💡 Untuk **RT-RW-Net**, simple queue per-pelanggan (atau per-IP) adalah cara termudah menjual paket bandwidth (5 Mbps, 10 Mbps, dst.). Kombinasikan dengan PPPoE (`19.6`) agar limit mengikuti profil pelanggan otomatis.

---

## 2. PCQ — Pembagian Adil Otomatis

**PCQ (Per Connection Queue)** membagi bandwidth **secara adil dan dinamis** di antara banyak pengguna/koneksi — tanpa harus membuat queue per-orang.

```
Masalah: 20 pelanggan berbagi 100Mbps. Tanpa PCQ, satu pengunduh besar
         bisa "menghabiskan" semua bandwidth.
PCQ    : bagi rata otomatis — tiap pengguna aktif dapat porsi setara.
         Jika 4 aktif → masing-masing 25Mbps. Jika 10 aktif → 10Mbps.
```

```routeros
# Definisikan tipe queue PCQ (classifier = pembeda per-user)
/queue type
add name=pcq-download kind=pcq pcq-classifier=dst-address pcq-rate=0
add name=pcq-upload   kind=pcq pcq-classifier=src-address pcq-rate=0
# pcq-rate=0 = bagi rata seluruh bandwidth; >0 = batas per-user

# Pakai di queue tree (butuh packet-mark dari mangle) atau simple queue
```

💡 **PCQ dengan `pcq-rate=0`** membagi total bandwidth **rata** ke semua pengguna aktif — solusi klasik agar satu pengguna tidak memonopoli link bersama. `pcq-classifier=dst-address` untuk download (bedakan per-IP tujuan/pelanggan), `src-address` untuk upload. Ini fitur QoS MikroTik yang paling dihargai untuk jaringan berbagi.

---

## 3. Burst — Pengalaman "Cepat"

**Burst** mengizinkan kecepatan **melebihi max-limit sementara** saat trafik baru dimulai — membuat browsing/loading terasa cepat, lalu turun ke limit untuk transfer besar.

```routeros
/queue simple
add name="paket-burst" target=192.168.1.20/32 \
    max-limit=5M/5M \
    burst-limit=10M/10M \      # kecepatan puncak burst
    burst-threshold=4M/4M \    # rata-rata di bawah ini → burst boleh aktif
    burst-time=8/8             # jendela waktu perhitungan rata-rata (detik)
```

```
Efek: buka web / file kecil → dapat sampai 10Mbps (terasa ngebut)
      unduh besar berkelanjutan → turun ke 5Mbps (limit paket)
```

💡 **Burst menyeimbangkan "terasa cepat" dengan "batas adil".** Pelanggan merasa koneksi responsif (browsing, buka aplikasi) karena burst, tetapi unduhan besar tetap dibatasi paket mereka. Sangat populer untuk paket ISP retail. ⚠️ Logika burst (threshold vs limit vs time) membingungkan — burst aktif selama **rata-rata pemakaian** dalam `burst-time` masih di bawah `burst-threshold`.

---

## 4. Queue Tree (Hierarkis)

Untuk skenario kompleks (prioritas per-jenis trafik, hierarki), **queue tree** dipakai bersama **mangle** (`19.3`):

```routeros
# 1. Mangle tandai paket (mis. prioritaskan VoIP, batasi P2P)
/ip firewall mangle
add chain=forward protocol=udp port=5060 action=mark-packet \
    new-packet-mark=voip passthrough=no

# 2. Queue tree pakai packet-mark
/queue tree
add name=total parent=global max-limit=100M
add name=voip parent=total packet-mark=voip priority=1 limit-at=10M max-limit=20M
add name=lain parent=total packet-mark=no-mark priority=8 max-limit=100M
```

- **`priority`** 1 (tertinggi) – 8 (terendah): trafik prioritas tinggi dilayani dulu saat kongesti.
- **`limit-at`** = bandwidth terjamin (minimum); **`max-limit`** = maksimum bila tersedia.

💡 **`limit-at` (jaminan) vs `max-limit` (batas):** VoIP diberi `limit-at` tinggi + priority 1 → selalu dapat bandwidth minimum meski link penuh. Konsep sama dengan LLQ/CBWFQ Cisco (`11-wan-vpn/03`).

---

## 5. Di Dalam HTB dan Antrean

Simple queue dan queue tree hanyalah dua cara menulis konfigurasi untuk mesin yang sama: **HTB (Hierarchical Token Bucket)**. Dokumentasi MikroTik menyebut RouterOS memakai versi HTB yang dimodifikasi untuk mewujudkan keduanya. Memahami mesin ini membuat Anda bisa memprediksi siapa mendapat berapa saat link penuh, alih-alih menebak.

### 5.1 Di mana HTB berada

Menurut diagram packet flow (`19-mikrotik/03-firewall-nat` bagian 6), ada dua tempat antrean:

- **HTB global**: queue tree dengan `parent=global` dan semua simple queue. Dilewati di tahap input dan postrouting, sehingga bisa membatasi trafik apa pun yang melewati router, termasuk dua arah sekaligus.
- **Interface HTB**: queue tree dengan `parent=<nama antarmuka>`. Ini langkah terakhir sebelum paket keluar dari antarmuka tersebut, jadi hanya membatasi arah keluar antarmuka itu.

Tanpa queue apa pun, setiap antarmuka tetap punya antrean bawaan, terlihat di `/queue interface print`. Di CHR 7.24.5, antarmuka ethernet memakai `only-hardware-queue`; begitu ada queue tree ber-parent antarmuka, kolom `ACTIVE-QUEUE` berubah menjadi `queue-tree`.

⚠️ Paket dari koneksi yang di-FastTrack **melewati simple queue dan queue tree ber-parent global** (lihat `19-mikrotik/03-firewall-nat` bagian 6.3). Semua perhitungan di bagian ini hanya berlaku untuk trafik yang tidak di-fasttrack.

### 5.2 Inner queue dan leaf queue

HTB berbentuk pohon. Queue yang punya anak disebut **inner**, queue tanpa anak disebut **leaf**:

```
                      TOTAL-DOWN (inner)
                      max-limit=285M
             ┌──────────────┼──────────────┐
        BISNIS (inner)  RUMAH-20 (inner)  RUMAH-10 (inner)
             │              │                │
     ┌───────┴──┐      ┌────┴────┐      ┌────┴────┐
   toko-a  toko-b ... rumah-31 ...    rumah-01 ...    ← leaf: trafik nyata
```

Aturan dari dokumentasi:

- **Hanya leaf yang mengonsumsi trafik.** Inner queue hanya membagi. Semua leaf diperlakukan setara dalam arti tidak ada leaf yang lebih "dalam" dari yang lain.
- Token yang dipakai leaf **juga ditagihkan ke semua leluhurnya**. Anak "meminjam" dari induk. Akibatnya, induk dengan `max-limit` kecil membatasi seluruh cabangnya, apa pun nilai di anak.
- **`priority` hanya bermakna di leaf** dan hanya bila `max-limit` diisi. Prioritas di inner queue diabaikan.

### 5.3 Dual limitation: CIR dan MIR

Setiap queue punya dua batas:

| RouterOS | Istilah umum | Arti |
|---|---|---|
| `limit-at` | **CIR** (Committed Information Rate) | Yang dijamin, apa pun kondisinya (selama trafiknya memang ada) |
| `max-limit` | **MIR** (Maximal Information Rate) | Batas atas, bila induk masih punya sisa |

Urutan pembagian HTB:

1. Penuhi `limit-at` semua leaf yang aktif. Dokumentasi menegaskan CIR diberikan **bahkan bila melampaui max-limit induk**.
2. Sisa kapasitas induk dibagikan ke leaf yang masih ingin lebih, **mulai dari prioritas tertinggi** (1), sampai masing-masing mencapai `max-limit`.

Dari langkah 1 lahir dua aturan desain yang dianjurkan dokumentasi:

- Jumlah `limit-at` semua anak tidak boleh melebihi `limit-at` induk (untuk induk paling atas, anggap `limit-at` = `max-limit`).
- `max-limit` setiap anak tidak boleh melebihi `max-limit` induk.

Bila aturan pertama dilanggar, HTB terpaksa "berutang": total jaminan melebihi kapasitas antarmuka, dan antrean keluaran yang FIFO akhirnya membagi kapasitas mengikuti perbandingan jaminan, bukan prioritas.

**Contoh hitung.** Induk `max-limit=100M`, tiga leaf yang semuanya punya `max-limit=100M`:

| Leaf | limit-at | priority | Permintaan nyata |
|---|---|---|---|
| VoIP | 10M | 1 | 8M |
| Bisnis | 40M | 3 | tak terbatas |
| Rumah | 30M | 6 | tak terbatas |

Langkah 1: VoIP hanya butuh 8M, jadi ia mendapat 8M (jaminan yang tidak dipakai tidak "dikunci"). Bisnis 40M, Rumah 30M. Terpakai 78M.
Langkah 2: sisa 22M jatuh ke leaf aktif dengan prioritas tertinggi yang masih ingin lebih. VoIP sudah puas, jadi Bisnis (prioritas 3) mengambil semuanya.
Hasil: VoIP 8M, Bisnis 62M, Rumah 30M.

Perhatikan: Rumah dengan prioritas 6 tidak mendapat lebih dari jaminannya selama Bisnis masih lapar. Prioritas di HTB **bukan pembagian adil**, melainkan urutan siapa yang lebih dulu menghabiskan sisa.

### 5.4 Token bucket: dari mana "kecepatan" datang

Setiap queue punya ember token. Token (satuan byte) diisi dengan laju setara batas aktif queue saat itu, yaitu nilai tertinggi yang sedang berlaku di antara `limit-at`, `max-limit`, atau `burst-limit` (bila burst sedang diizinkan). Paket boleh lewat hanya bila token cukup; bila kurang, paket menunggu di antrean paket queue itu.

Kapasitas ember:

```
kapasitas ember = bucket-size × max-limit        (bucket-size 0..10, bawaan 0.1)
```

Queue `max-limit=10M` dengan `bucket-size=0.1` punya ember 1 Mbit. Setelah diam beberapa saat dan embernya penuh, 1 Mbit berikutnya bisa lewat tanpa direm. Dengan `bucket-size=10`, ember berisi 100 Mbit, sehingga setelah lama diam klien bisa menyedot ledakan besar sebelum direm. Dokumentasi memberi gambaran: ember 100 Mbit memungkinkan sekitar 20 Mbps selama 10 detik, atau ledakan lebih tinggi untuk waktu lebih singkat.

Karena anak meminjam token dari induk, kombinasi **ember anak besar dan ember induk kecil** menghasilkan ledakan yang tetap dibatasi laju induk. Ini cara lain (selain fitur burst di bagian 3) untuk membuat koneksi "terasa cepat" tanpa membiarkan ledakan tak terbatas.

### 5.5 Jenis antrean (queue type) di RouterOS v7

Leaf HTB menentukan **berapa banyak** yang boleh lewat. **Queue type** menentukan **paket mana** yang dikirim berikutnya dan mana yang dibuang ketika antrean penuh. Daftar bawaan di CHR 7.24.5:

```
[admin@MikroTik] > /queue type print where default
 7  * name="default" kind=pfifo pfifo-limit=50
 8  * name="ethernet-default" kind=pfifo pfifo-limit=50
 9  * name="wireless-default" kind=sfq sfq-perturb=5 sfq-allot=1514
10  * name="synchronous-default" kind=red red-limit=60 red-min-threshold=10
      red-max-threshold=50 red-burst=20 red-avg-packet=1000
11  * name="hotspot-default" kind=sfq sfq-perturb=5 sfq-allot=1514
12  * name="pcq-upload-default" kind=pcq pcq-rate=0 pcq-limit=50KiB
      pcq-classifier=src-address pcq-total-limit=2000KiB ...
13  * name="pcq-download-default" kind=pcq pcq-rate=0 pcq-limit=50KiB
      pcq-classifier=dst-address pcq-total-limit=2000KiB ...
14  * name="only-hardware-queue" kind=none
15  * name="multi-queue-ethernet-default" kind=mq-pfifo mq-pfifo-limit=50
16  * name="default-small" kind=pfifo pfifo-limit=10
```

Queue dinamis dari PPPoE, Hotspot, dan RADIUS memakai `default-small` (pfifo 10 paket) kecuali Anda mengubah `queue-type` di PPP profile.

| Kind | Cara kerja | Cocok untuk | Kelemahan |
|---|---|---|---|
| `pfifo` / `bfifo` | Satu antrean urut kedatangan, batas dalam paket atau byte | Leaf sederhana | Satu aliran besar bisa menahan aliran kecil di belakangnya (head-of-line) |
| `mq-pfifo` | pfifo dengan banyak antrean kirim | Antarmuka x86 multi-antrean | Sama seperti pfifo |
| `red` | Membuang paket secara acak saat rata-rata antrean di antara ambang min dan max, sebelum antrean penuh | Mencegah banyak TCP mundur serentak | Harus disetel; salah setel menurunkan kinerja |
| `sfq` | Hash alamat dan port ke 1024 sub-antrean, dilayani round-robin `sfq-allot` byte per giliran; seluruh SFQ menampung 128 paket | Keadilan antar aliran di satu leaf | Tidak mengelola latensi; adil per **aliran**, bukan per **pengguna** |
| `pcq` | Sub-antrean per pengklasifikasi (alamat atau port), masing-masing FIFO dengan batas sendiri | Pembagian adil per pengguna, satu queue untuk banyak pelanggan | Butuh memori sesuai jumlah sub-antrean |
| `codel` | Membuang berdasarkan lamanya paket menunggu, bukan panjang antrean | Mengurangi bufferbloat | Tidak adil antar aliran |
| `fq-codel` | Fair queuing per aliran ditambah CoDel per aliran | Pilihan bawaan yang baik untuk latensi rendah | Lebih rumit untuk diamati |
| `cake` | Shaper plus fair queuing per host atau aliran, kelas Diffserv, kompensasi overhead | Uplink ke ISP, terutama untuk mengurangi bufferbloat | Pemakaian CPU lebih tinggi; tidak untuk kontrol berbutir halus |

CoDel, FQ-CoDel, dan CAKE tersedia sejak RouterOS 7.1beta3. Contoh yang diuji di CHR 7.24.5:

```routeros
/queue type
add name=sfq-lab kind=sfq sfq-perturb=5 sfq-allot=1514
add name=red-lab kind=red red-limit=60 red-min-threshold=10 red-max-threshold=50 \
    red-burst=20 red-avg-packet=1000
add name=fqcodel-lab kind=fq-codel
add name=cake-wan-up kind=cake cake-bandwidth=95M cake-diffserv=diffserv4 \
    cake-flowmode=dual-srchost cake-nat=yes
# Pakai fq-codel sebagai antrean antarmuka WAN
/queue interface set ether2 queue=fqcodel-lab
```

`cake-flowmode=dual-srchost` membuat keadilan diterapkan dulu per alamat sumber, lalu per aliran. Dokumentasi menyebut mode ini cocok untuk arah LAN ke internet agar satu host tidak memonopoli uplink sebanyak apa pun alirannya; `dual-dsthost` untuk arah sebaliknya. `cake-nat=yes` membuat CAKE melihat alamat asli di balik NAT bila CAKE dipasang di router yang sama dengan NAT.

**Ukuran antrean** adalah tawar-menawar: antrean besar memanfaatkan link lebih penuh tetapi menambah latensi (bufferbloat); antrean kecil menjaga latensi tetapi membuang lebih banyak. Itulah alasan `default-small` untuk queue per pelanggan cukup 10 paket, dan alasan fq-codel atau cake di WAN biasanya terasa lebih "responsif" daripada pfifo 50.

### 5.6 PCQ lebih dalam

PCQ (bagian 2) bekerja dalam tiga langkah menurut dokumentasi: memilah paket ke sub-aliran berdasarkan `pcq-classifier`, menerapkan batas dan antrean FIFO per sub-aliran, lalu menerapkan batas total untuk semua sub-aliran.

| Properti | Arti | Tips |
|---|---|---|
| `pcq-classifier` | Pembeda sub-aliran: `dst-address`, `src-address`, `dst-port`, `src-port` | Download per pelanggan: `dst-address`; upload: `src-address` |
| `pcq-rate` | Laju maksimum per sub-aliran; `0` berarti dibagi rata | Isi dengan kecepatan paket untuk "paket tetap per orang" |
| `pcq-limit` | Antrean per sub-aliran (KiB) | Bawaan 50KiB |
| `pcq-total-limit` | Antrean total semua sub-aliran (KiB) | Bawaan 2000KiB |
| `pcq-dst-address-mask`, `pcq-src-address-mask` | Mengelompokkan alamat; 32 berarti per alamat | Mask 24 berarti satu sub-aliran per /24 (misalnya per kantor cabang) |
| `pcq-burst-rate`, `pcq-burst-threshold`, `pcq-burst-time` | Burst per sub-aliran, logikanya sama dengan simple queue | |

⚠️ **Hitung `pcq-total-limit`.** Dengan 100 pelanggan aktif dan `pcq-limit=50KiB`, kebutuhan antrean bisa mencapai 100 × 50 = 5000 KiB, sedangkan bawaan total hanya 2000 KiB. Saat jam sibuk, batas total tercapai lebih dulu dan paket dibuang walaupun antrean tiap pelanggan belum penuh. Naikkan total (misalnya 8000KiB, seperti di contoh di bawah) dan pantau memori router.

### 5.7 Desain bandwidth RT-RW Net 100 pelanggan

**Asumsi** (ilustrasi, sesuaikan dengan kontrak Anda): uplink dari ISP 300 Mbps download dan 100 Mbps upload. Paket yang dijual:

| Paket | Jumlah | Download/Upload | Total dijual (down) |
|---|---|---|---|
| Rumah 10 | 60 | 10M / 3M | 600 Mbps |
| Rumah 20 | 30 | 20M / 5M | 600 Mbps |
| Bisnis 50 | 10 | 50M / 15M | 500 Mbps |
| **Total** | 100 | | **1700 Mbps** |

Rasio langganan download 1700 : 300, sekitar 5,7 : 1. Itu wajar untuk layanan "up to" selama jaminan minimumnya dihitung jujur.

**Langkah 1: batasi di router sendiri, sedikit di bawah kapasitas ISP.** Bila router Anda meneruskan 300 Mbps penuh, antrean terbentuk di perangkat ISP (yang tidak Anda kendalikan) dan latensi melonjak. Dengan menyetel induk sekitar 95% kapasitas yang terukur, antrean terbentuk di router Anda, tempat queue type dan prioritas Anda berlaku. Induk: 285M down, 95M up.

**Langkah 2: tetapkan CIR yang muat.** Jumlah `limit-at` harus di bawah induk:

| Paket | limit-at down × jumlah | limit-at up × jumlah |
|---|---|---|
| Rumah 10 | 2M × 60 = 120M | 0,5M × 60 = 30M |
| Rumah 20 | 2,5M × 30 = 75M | 0,75M × 30 = 22,5M |
| Bisnis 50 | 8M × 10 = 80M | 3M × 10 = 30M |
| **Total** | **275M ≤ 285M** | **82,5M ≤ 95M** |

**Langkah 3: pilih bentuk antrean.** Dua pilihan yang sama-sama valid:

*Pilihan A, satu queue per pelanggan* (cocok bila pelanggan PPPoE dan paketnya datang dari RADIUS). Buat induk sebagai simple queue yang menangkap seluruh pool pelanggan, lalu biarkan queue dinamis PPPoE menjadi anaknya lewat properti `parent-queue` di PPP profile:

```routeros
/queue simple add name=TOTAL target=100.64.10.0/24 max-limit=95M/285M
/ppp profile set prof-pppoe parent-queue=TOTAL
```

Batas per pelanggan, jaminan, dan prioritas dikirim lewat `Mikrotik-Rate-Limit` (format di `19-mikrotik/10-user-manager-radius`), misalnya untuk Rumah 10: `3M/10M 0/0 0/0 0/0 5 512k/2M` (prioritas 5, jaminan 512k upload dan 2M download), dan untuk Bisnis 50: `15M/50M 0/0 0/0 0/0 3 3M/8M`.

*Pilihan B, PCQ per kelas paket* (cocok untuk hotspot atau pelanggan IP statis tanpa RADIUS). Tandai trafik per paket dengan mangle berdasarkan address-list, lalu satu leaf PCQ per paket:

```routeros
/queue type
add name=pcq-down-10 kind=pcq pcq-classifier=dst-address pcq-rate=10M pcq-total-limit=8000KiB
add name=pcq-down-20 kind=pcq pcq-classifier=dst-address pcq-rate=20M pcq-total-limit=8000KiB
/queue tree
add name=DOWN-total parent=ether3-lan max-limit=285M
add name=DOWN-rumah10 parent=DOWN-total packet-mark=pkt-r10 queue=pcq-down-10 \
    limit-at=120M max-limit=285M priority=5
add name=DOWN-rumah20 parent=DOWN-total packet-mark=pkt-r20 queue=pcq-down-20 \
    limit-at=75M max-limit=285M priority=5
```

Pada pilihan B, jaminan dihitung per **kelas** (120M untuk seluruh Rumah 10), lalu PCQ membagi rata di dalam kelas dengan batas 10M per alamat. Lebih sedikit queue, tetapi Anda kehilangan jaminan per individu.

**Langkah 4: uji hasilnya dengan logika HTB.** Malam hari, 40 Rumah 10, 20 Rumah 20, dan 6 Bisnis 50 aktif dan semuanya mengunduh tanpa henti (pilihan A, satu leaf per pelanggan):

- Jaminan: 40 × 2 + 20 × 2,5 + 6 × 8 = 80 + 50 + 48 = 178M.
- Sisa: 285 − 178 = 107M.
- Bisnis berprioritas 3 mengambil sisa lebih dulu. Mereka bisa menyerap sampai 6 × (50 − 8) = 252M, jadi seluruh 107M habis di sana: masing-masing Bisnis sekitar 8 + 17,8 ≈ 25,8M.
- Pelanggan rumah tinggal di jaminannya: 2M dan 2,5M.

Hasil ini sah secara HTB, tetapi mungkin bukan yang Anda inginkan secara bisnis. Bila semua pelanggan rumah diberi prioritas yang sama dengan Bisnis, sisa 107M dibagi di antara semua leaf yang masih lapar, bukan diborong satu kelas. Inilah gunanya menghitung di atas kertas sebelum pelanggan mengeluh.

**Langkah 5: lindungi dari jalan pintas.** Pastikan trafik pelanggan tidak di-fasttrack, pakai `queue-type` yang wajar (pfifo kecil, sfq, atau fq-codel untuk leaf), dan pasang fq-codel atau cake di antarmuka WAN bila latensi jam sibuk menjadi keluhan utama.

### 5.8 Verifikasi

```routeros
/queue simple print stats where name~"pppoe"
/queue tree print stats
/queue interface print
/tool torch interface=ether3-lan src-address=0.0.0.0/0 dst-address=100.64.10.0/24
```

`print stats` menampilkan laju, paket yang dibuang (`dropped`), dan isi antrean (`queued-packets`). Leaf yang terus-menerus `dropped` naik saat link belum penuh menandakan antrean terlalu kecil atau `pcq-total-limit` tercapai. Leaf yang lajunya jauh di atas `max-limit` hampir pasti dilewati FastTrack.

💡 Lisensi CHR free membatasi upload 1 Mbps per antarmuka, jadi CHR cukup untuk menguji sintaks dan struktur, bukan angka throughput. Untuk melihat pembagian HTB dengan angka nyata, pakai router fisik atau lisensi trial CHR, dan bangkitkan beban dengan `/tool bandwidth-test` atau iperf3 dari beberapa klien.

---

## 6. Hotspot — Login Portal & Voucher

**Hotspot** RouterOS memberi **captive portal**: pengguna harus login (voucher/username) sebelum akses internet. Inti bisnis warnet, kafe, wifi publik, RT-RW-Net voucher.

```routeros
# Setup wizard (cara termudah)
/ip hotspot setup
# Wizard menanyakan: interface, address pool, DNS, sertifikat, user awal
```

**Yang dibuat hotspot:**
```
- Captive portal (halaman login) — intersepsi HTTP → redirect ke login
- User profiles — paket (kecepatan, kuota, masa berlaku, session)
- Users / vouchers — kredensial pelanggan
- Walled garden — situs yang boleh diakses TANPA login (mis. halaman pembayaran)
```

### User profile & voucher
```routeros
# Profil paket: 2Mbps, sesi 1 pengguna
/ip hotspot user profile
add name="paket-2jam" rate-limit=2M/2M session-timeout=2h shared-users=1

# Buat voucher
/ip hotspot user
add name=voucher001 password=abc123 profile="paket-2jam"
```

💡 **Walled garden** penting: izinkan akses ke halaman pembayaran/informasi/DNS tertentu **tanpa login** — agar pengguna bisa membeli voucher atau melihat info sebelum autentikasi. Tanpa ini, portal pembayaran online tidak bisa diakses dari halaman login.

⚠️ **Hotspot melakukan intersepsi & NAT** — pastikan tidak bentrok dengan aturan firewall/NAT lain. Untuk skala besar (banyak pelanggan/lokasi), integrasikan dengan **RADIUS** eksternal (`19.6`, `12-keamanan/04`) untuk manajemen user & billing terpusat, alih-alih user lokal.

---

## 7. Skenario RT-RW-Net Menyeluruh

Menggabungkan komponen untuk operator kecil:

```
Model A — PPPoE (pelanggan tetap berlangganan):
  PPPoE server + profil per-paket (rate-limit di profil) + simple queue
  → tiap rumah punya user/password, bandwidth ikut paket otomatis

Model B — Hotspot voucher (pengguna sementara/publik):
  Hotspot + user profile per-paket + voucher (waktu/kuota)
  → cocok untuk wifi publik, kafe, penjualan voucher

Umum:
  + PCQ agar bandwidth bersama dibagi adil
  + Burst agar terasa cepat
  + Firewall + NAT (19.3)
  + Failover 2 ISP bila ada (19.3 mangle + routing)
  + Monitoring (19.7)
```

---

## 8. Ringkasan

- **Simple queue** (per-IP/subnet, mudah) vs **queue tree** (hierarkis, butuh mangle mark). ⚠️ `max-limit` format **upload/download**.
- **PCQ** membagi bandwidth **adil & dinamis** ke banyak pengguna (`pcq-rate=0` = bagi rata; classifier dst/src-address). Solusi anti-monopoli link bersama.
- **Burst** = kecepatan melebihi limit sementara → browsing terasa cepat, transfer besar tetap dibatasi. Logika: threshold/limit/time.
- **Queue tree**: `priority` (1 tertinggi), `limit-at` (jaminan) vs `max-limit` (maksimum) — mirip LLQ Cisco.
- **Hotspot**: captive portal + user profile (paket) + voucher + **walled garden** (akses tanpa login untuk pembayaran/info). Skala besar → **RADIUS**.
- **RT-RW-Net**: PPPoE (langganan tetap) atau hotspot voucher (publik), + PCQ + burst + firewall/NAT + failover + monitoring.

---

## 9. Latihan

1. Kapan memakai simple queue vs queue tree?
2. Jelaskan masalah yang dipecahkan PCQ dan bagaimana `pcq-rate=0` bekerja.
3. Bagaimana burst membuat koneksi "terasa cepat" tetapi tetap membatasi unduhan besar?
4. Apa perbedaan `limit-at` dan `max-limit` di queue tree?
5. Apa fungsi walled garden pada hotspot dan kenapa penting untuk sistem voucher berbayar?
6. Sebuah queue tree induk `max-limit=50M` punya tiga leaf, semuanya `max-limit=50M`: Game (`limit-at=5M`, priority 1, kebutuhan nyata 3M), Kantor (`limit-at=20M`, priority 4, kebutuhan tak terbatas), dan Tamu (`limit-at=10M`, priority 8, kebutuhan tak terbatas). Berapa laju yang diterima masing-masing leaf saat link penuh? Jelaskan langkah HTB yang Anda pakai, lalu jelaskan apa yang terjadi bila admin menaikkan `limit-at` Tamu menjadi 40M.
7. Hotspot kafe Anda memakai satu queue tree download dengan queue type `pcq-download-default` untuk sekitar 120 pengguna. Pada jam makan siang pengguna mengeluh video tersendat dan `/queue tree print stats` menunjukkan `dropped` naik cepat, padahal laju total masih di bawah `max-limit`. Selain itu ping ke internet melonjak dari 20 ms menjadi 400 ms saat ada yang mengunggah video. Jelaskan dua penyebab yang mungkin dan perbaikan untuk masing-masing.

<details>
<summary>Jawaban</summary>

1. Gunakan **simple queue** untuk **mayoritas kasus yang lugas** — membatasi bandwidth per-IP atau per-subnet (mis. tiap pelanggan RT-RW-Net dapat 10 Mbps). Ia mudah dikonfigurasi (cukup target IP dan max-limit), diproses berurutan, dan cukup untuk sebagian besar kebutuhan. Gunakan **queue tree** untuk **skenario kompleks/hierarkis** — ketika Anda butuh: prioritas antar-jenis trafik (VoIP di atas P2P), pembagian bandwidth berjenjang (total → per-departemen → per-user), atau QoS berbasis penandaan trafik. Queue tree bekerja bersama **mangle** (packet-mark) sehingga bisa membedakan trafik berdasarkan kriteria apa pun (protokol, port, DSCP), dan memberi kontrol `priority` dan `limit-at`/`max-limit` yang lebih halus. Singkatnya: simple queue untuk "batasi si ini sekian", queue tree untuk "atur prioritas dan hierarki bandwidth secara rinci".

2. **Masalah:** ketika banyak pengguna berbagi satu link (mis. 20 pelanggan berbagi 100 Mbps upstream), **satu pengguna yang mengunduh besar (atau banyak koneksi) dapat memonopoli hampir seluruh bandwidth**, membuat pengguna lain lambat — tanpa mekanisme pembagian, tidak ada keadilan. Membuat queue tetap per-pengguna itu merepotkan dan tidak dinamis. **PCQ (Per Connection Queue)** memecahkannya dengan **membagi bandwidth secara adil dan otomatis** di antara pengguna aktif berdasarkan classifier (mis. `dst-address` untuk download membedakan per-IP tujuan). Dengan **`pcq-rate=0`**, PCQ **tidak menetapkan batas tetap per-pengguna**, melainkan **membagi rata total bandwidth yang tersedia ke jumlah pengguna aktif saat itu**: jika 4 pengguna aktif berbagi 100 Mbps, masing-masing mendapat ~25 Mbps; jika 10 aktif, masing-masing ~10 Mbps; jika 1 aktif, ia bisa memakai (hampir) seluruhnya. Pembagian menyesuaikan **dinamis** dengan jumlah pengguna aktif — tidak perlu membuat atau mengubah queue per-orang.

3. **Burst mengizinkan kecepatan melebihi `max-limit` untuk sementara** ketika sebuah koneksi baru dimulai dan pemakaian rata-rata sebelumnya masih rendah. Cara kerjanya: RouterOS memantau **rata-rata pemakaian** dalam jendela `burst-time`; selama rata-rata itu masih **di bawah `burst-threshold`**, target boleh melaju hingga `burst-limit` (lebih tinggi dari max-limit). **Efeknya pada pengalaman:** aktivitas seperti membuka halaman web, memuat aplikasi, atau mengunduh file kecil terjadi dalam **ledakan singkat** — data yang dipindahkan sedikit sehingga rata-rata tetap rendah dan burst aktif, memberi kecepatan tinggi (mis. 10 Mbps pada paket 5 Mbps) → terasa **responsif/ngebut**. Sebaliknya, **unduhan besar yang berkelanjutan** dengan cepat menaikkan rata-rata pemakaian melewati `burst-threshold`, sehingga burst **berhenti** dan kecepatan turun ke `max-limit` paket (5 Mbps) → transfer besar tetap **dibatasi sesuai paket**. Jadi burst memberi kesan cepat untuk pemakaian ringan/berselang tanpa membiarkan pelanggan menikmati kecepatan tinggi terus-menerus.

4. **`limit-at`** adalah bandwidth **terjamin (minimum)** yang akan selalu didapat sebuah queue **bahkan saat link penuh/kongesti** — ini adalah "hak" yang dijamin. **`max-limit`** adalah bandwidth **maksimum** yang boleh dipakai queue **bila masih ada kapasitas tersedia** (setelah semua jaminan `limit-at` dipenuhi). Contoh: queue VoIP dengan `limit-at=10M max-limit=20M priority=1` **dijamin** selalu mendapat 10 Mbps (kritis agar suara tidak putus meski jaringan sibuk), dan boleh naik hingga 20 Mbps jika bandwidth menganggur. Saat kongesti, RouterOS pertama-tama memenuhi semua `limit-at` (sesuai prioritas), lalu membagi sisa kapasitas hingga `max-limit` masing-masing. Ini setara konsep **bandwidth guarantee vs bandwidth ceiling**, mirip LLQ/CBWFQ Cisco (`11-wan-vpn/03`) di mana kelas prioritas punya jaminan minimum.

5. **Walled garden** adalah daftar situs/tujuan yang boleh diakses pengguna hotspot **tanpa harus login** terlebih dahulu. **Fungsinya** memberi "taman berpagar" — sebagian kecil akses yang diizinkan sebelum autentikasi. **Penting untuk sistem voucher berbayar** karena: (a) pengguna yang belum punya voucher perlu bisa **mengakses halaman pembayaran/pembelian voucher online, payment gateway, atau halaman informasi** — jika semua akses diblokir sebelum login, mereka tidak akan pernah bisa membeli voucher untuk login (jadi buntu); (b) beberapa layanan pendukung (server DNS tertentu, halaman syarat & ketentuan, logo/gambar di halaman login yang dihosting eksternal) perlu dijangkau agar portal berfungsi; (c) untuk model tertentu, memungkinkan akses ke aplikasi/website mitra secara gratis sebagai promosi. Tanpa walled garden, captive portal akan memblokir bahkan proses yang dibutuhkan untuk membeli akses — walled garden membuka persis jalur yang diperlukan (mis. domain payment gateway) sambil tetap memblokir internet umum sampai pengguna login/membayar.

6. **Langkah 1, penuhi jaminan leaf yang aktif:** Game hanya butuh 3M, jadi ia mendapat 3M (jaminan 5M tidak dipakai penuh). Kantor 20M, Tamu 10M. Terpakai 33M. **Langkah 2, bagikan sisa menurut prioritas:** sisa 50 − 33 = 17M. Game sudah terpenuhi, jadi leaf aktif dengan prioritas tertinggi berikutnya adalah Kantor (4), yang mengambil seluruh 17M. **Hasil:** Game 3M, Kantor 37M, Tamu 10M. Bila `limit-at` Tamu dinaikkan menjadi 40M, jumlah jaminan menjadi 3 + 20 + 40 = 63M, melebihi induk 50M. Dokumentasi HTB menyatakan `limit-at` tetap diberikan walaupun melampaui `max-limit` induk, sehingga HTB "berjanji" lebih dari kapasitas antarmuka. Antrean keluaran yang FIFO lalu membagi kapasitas nyata kurang lebih sebanding jaminan (sekitar 3 : 20 : 40), sehingga Kantor turun jauh di bawah 20M dan prioritas tidak lagi bermakna. Itulah sebabnya jumlah `limit-at` anak harus tidak melebihi kapasitas induk.

7. **Penyebab pertama: `pcq-total-limit` terlalu kecil.** `pcq-download-default` memakai `pcq-limit=50KiB` per sub-aliran tetapi `pcq-total-limit=2000KiB` untuk semua sub-aliran. Dengan 120 pengguna aktif, kebutuhan antrean bisa mendekati 120 × 50 = 6000KiB, sehingga batas total tercapai lebih dulu dan paket dibuang meski laju total belum mencapai `max-limit`. Perbaikan: buat queue type PCQ sendiri dengan `pcq-total-limit` yang lebih besar (misalnya 8000KiB) dan pantau memori router. **Penyebab kedua: bufferbloat di arah upload atau di perangkat ISP.** Lonjakan ping saat ada unggahan berarti antrean besar terbentuk di suatu tempat di jalur keluar, biasanya di modem atau perangkat ISP karena router meneruskan lebih cepat dari kapasitas uplink. Perbaikan: batasi upload total di router sedikit di bawah kapasitas uplink terukur (misalnya 95%) agar antrean terbentuk di router, lalu pakai queue type yang mengelola latensi seperti `fq-codel` atau `cake` (misalnya `kind=cake cake-bandwidth=... cake-flowmode=dual-srchost`) untuk arah upload, sehingga satu pengunggah tidak membuat antrean panjang bagi semua orang. Periksa juga bahwa trafik pengguna tidak di-FastTrack, karena paket FastTrack melewati queue tree ber-parent global.

</details>

---

## 10. Sumber

- MikroTik documentation — Queues, PCQ, Simple Queue, Hotspot (help.mikrotik.com)
- MTCNA outline — QoS · MTCUME (User Management: hotspot lanjutan)
- `11-wan-vpn/03` (QoS konsep) · `12-keamanan/04` (RADIUS)
- MikroTik, HTB (Hierarchical Token Bucket): https://help.mikrotik.com/docs/spaces/ROS/pages/137986076/HTB+Hierarchical+Token+Bucket
- MikroTik, Queues: https://help.mikrotik.com/docs/spaces/ROS/pages/328088/Queues
- MikroTik, Queue types: https://help.mikrotik.com/docs/spaces/ROS/pages/196345871/Queue+types
- MikroTik, PCQ example: https://help.mikrotik.com/docs/spaces/ROS/pages/137986099/PCQ+example
- MikroTik, Queue Burst: https://help.mikrotik.com/docs/display/ROS/Queue+Burst
- MikroTik, CAKE: https://help.mikrotik.com/docs/display/ROS/CAKE
- MikroTik, Packet Flow in RouterOS: https://help.mikrotik.com/docs/spaces/ROS/pages/328227/Packet+Flow+in+RouterOS
- MikroTik, PPP AAA (properti parent-queue dan queue-type di PPP profile): https://help.mikrotik.com/docs/spaces/ROS/pages/132350049/PPP+AAA
- MikroTik, MTCTCE training outline: https://i.mt.lv/cdn/training_pdf/mtctce_outline_2020154113204.pdf

---

**Berikutnya:** `19-mikrotik/05-wireless-mikrotik.md` — wireless RouterOS (CAPsMAN, security, band).

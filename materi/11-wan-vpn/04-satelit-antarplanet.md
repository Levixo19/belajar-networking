# 11.4 Internet Satelit dan Jaringan Antarplanet

> **Prasyarat:** `11-wan-vpn/01-teknologi-wan`, `05-transport/02-tcp`
> **Tujuan:** Anda bisa menghitung latensi dan BDP link satelit GEO dan LEO, menjelaskan jalur data VSAT, Starlink, dan SATRIA-1, menyetel TCP untuk link berlatensi tinggi, dan menjelaskan kenapa jaringan antarplanet memakai DTN, bukan TCP/IP biasa.

---

## 1. Kenapa Satelit, dan Kenapa Terasa Lambat

Kota-kota besar tersambung lewat kabel serat optik di darat dan di dasar laut. Menarik kabel ke setiap pulau kecil, puncak bukit, kapal di laut, atau pesawat di udara sering tidak mungkin atau tidak sebanding biayanya. Satelit menutup celah itu. Satu satelit geostasioner bisa menyinari wilayah seluas Indonesia, dan sebuah sekolah di pedalaman cukup memasang antena parabola kecil serta modem untuk ikut tersambung.

Harga yang dibayar adalah jarak. Bayangkan jalan tol Jakarta-Surabaya. Menambah lajur membuat lebih banyak mobil lewat per jam (bandwidth), tetapi mobil pertama tetap butuh waktu tempuh yang sama (latensi). Bedanya, mobil di tol masih bisa dipercepat. Sinyal radio ke satelit sudah melaju secepat cahaya, jadi satu-satunya cara menurunkan latensinya adalah memperpendek jaraknya, yaitu menurunkan orbit satelit.

Bagian 2 sampai 5 membahas internet satelit yang bisa dipakai hari ini, termasuk satelit milik Indonesia. Bagian 6 keluar dari orbit Bumi: jaringan ke Bulan dan Mars, tempat satu kali bolak-balik sinyal bisa memakan waktu puluhan menit.

> [!NOTE]
> Bagian 6 (jaringan antarplanet) adalah pendalaman. Isinya tidak diuji di CCNA, Network+, maupun MTCNA.

---

## 2. Orbit GEO, MEO, dan LEO

Satelit tidak melayang diam. Ia terus "jatuh" mengitari Bumi dengan kecepatan yang pas sehingga tidak pernah menyentuh tanah, dan makin tinggi orbitnya, makin lama satu putarannya. Pada ketinggian 35.786 km di atas khatulistiwa, satu putaran butuh 23 jam 56 menit 4 detik, sama dengan waktu Bumi berputar sekali terhadap bintang. Dilihat dari darat, satelit di sana tampak diam di satu titik langit. Itulah **orbit geostasioner (GEO)**, dan itu sebabnya antena VSAT cukup diarahkan sekali lalu dikunci.

| Orbit | Ketinggian | Satu putaran | Satelit untuk cakupan | Contoh |
|---|---|---|---|---|
| **LEO** (*Low Earth Orbit*) | 180 sampai 2.000 km | sekitar 95 menit pada 550 km | ribuan untuk layanan global | Starlink, sekitar 550 km |
| **MEO** (*Medium Earth Orbit*) | di antara LEO dan GEO | 12 jam pada 20.200 km | 6 untuk layanan global (klaim SES) | GPS 20.200 km, SES O3b mPOWER 8.000 km |
| **GEO** (*Geostationary Orbit*) | 35.786 km di atas khatulistiwa | 23 jam 56 menit 4 detik | 3 untuk cakupan hampir global | SATRIA-1 di 146° BT |

Menurut ESA, LEO berada di bawah 2.000 km dan satelit tidak terbang lebih rendah dari 180 km, sedangkan MEO mencakup rentang lebar di antara LEO dan GEO. Satelit LEO hanya melihat sepetak kecil permukaan Bumi dan melintas cepat (satu putaran sekitar 95 menit), sehingga sebuah terminal di darat hanya bisa memakai satu satelit selama beberapa menit sebelum harus pindah ke satelit berikutnya. Karena itu layanan LEO butuh konstelasi besar: Starlink melaporkan lebih dari 7.800 satelit di orbit pada pertengahan 2025.

Periode orbit bisa Anda hitung sendiri dengan hukum Kepler. Jari-jari khatulistiwa Bumi 6.378 km, dan konstanta gravitasi Bumi (GM) sekitar 398.600 km³/s² (lembar fakta Bumi NASA):

```
T = 2 x pi x akar(a^3 / GM)        a = jari-jari Bumi + ketinggian

LEO 550 km : a = 6.378 + 550 = 6.928 km    T = 5.739 s   (sekitar 95,6 menit)
MEO 8.000 km: a = 14.378 km                T = 17.158 s  (sekitar 4,8 jam)
GEO        : a = 42.164 km                 T = 86.164 s  (23 jam 56 menit)
```

Hasil GEO itu sama dengan satu hari sideris (23,93 jam menurut lembar fakta yang sama), sehingga satelit dan permukaan Bumi berputar seirama.

### Menghitung latensi dari kecepatan cahaya

Latensi propagasi adalah jarak dibagi kecepatan sinyal. Kecepatan cahaya di ruang hampa tepat 299.792,458 km/s (NIST). Di serat optik, cahaya merambat lebih lambat: ITU-T G.114 memakai angka perencanaan 5 mikrodetik per km, setara sekitar 200.000 km/s atau dua per tiga kecepatan di hampa, angka yang sama dengan `00-fondasi/03`.

Pada satelit model **bent pipe** (satelit hanya menjadi repeater: menerima sinyal lalu memancarkannya ulang), data naik dari terminal ke satelit, turun ke stasiun bumi (gateway), lalu balasannya menempuh jalan yang sama kembali. Satu RTT berarti empat kali jarak permukaan ke satelit:

```
GEO, terminal dan gateway tepat di bawah satelit (batas paling optimistis)
  4 x 35.786 km = 143.144 km
  143.144 km / 299.792 km/s = 0,477 s = 477 ms

MEO 8.000 km, satelit tepat di atas
  4 x 8.000 km = 32.000 km              = 107 ms

LEO 550 km, satelit tepat di atas kepala
  4 x 550 km = 2.200 km                 = 7,3 ms

LEO 550 km, satelit pada elevasi 25 derajat (jarak miring sekitar 1.123 km)
  4 x 1.123 km = 4.492 km               = 15,0 ms

Kabel laut Jakarta-Batam-Singapura (Matrix Cable System, 1.055 km)
  2 x 1.055 km x 5 mikrodetik/km        = 10,6 ms
```

Angka 25 derajat berasal dari dokumen yang diajukan SpaceX ke FCC: terminal Starlink hanya berkomunikasi dengan satelit yang berada di atas elevasi itu. Jarak miringnya dihitung dengan geometri segitiga: `d = akar((R + h)^2 - (R cos e)^2) - R sin e`, dengan R jari-jari Bumi, h ketinggian satelit, dan e sudut elevasi.

Angka di lapangan selalu lebih besar daripada hitungan propagasi:

- **GEO.** RFC 2488 mencatat satu lompatan bumi-satelit-bumi butuh 239,6 ms untuk stasiun tepat di bawah satelit dan 279,0 ms untuk stasiun di tepi cakupan (2 x 41.756 km), sehingga RTT paling sedikit 558 ms. Antrean, akses kanal bersama, dan jalur darat menambah lagi. RFC 3135 mencatat total delay jaringan VSAT kadang naik sampai orde beberapa detik saat antrean penuh.
- **LEO.** Starlink menulis bahwa propagasi pengguna-satelit-darat hanya 1,8 sampai 3,6 ms per ruas, biasanya di bawah 10 ms untuk bolak-balik. Median RTT yang mereka ukur dari router pengguna ke internet pada jam sibuk di Amerika Serikat adalah 25,7 ms (Juni 2025), dan kurang dari 1% pengukuran di atas 55 ms. Selisihnya datang dari jalur gateway ke titik sambung internet (PoP), penjadwalan radio antara satelit dan pengguna, buffer, dan rute lewat laser antarsatelit.

> [!TIP]
> Pegang dua angka ini sebagai patokan: GEO di atas setengah detik, LEO puluhan milidetik. `ping` 30 ms lewat internet satelit tidak mungkin melewati GEO, karena propagasinya saja sudah paling sedikit 477 ms. `ping` 600 ms di LEO berarti ada masalah antrean atau rute, bukan jarak.

---

## 3. Komponen Jaringan Satelit

Sistem internet satelit punya tiga bagian: **terminal pengguna** di lokasi Anda, **satelit**, dan **gateway**, yaitu stasiun bumi besar yang tersambung ke internet darat. Ruas terminal-satelit disebut link pengguna, ruas satelit-gateway disebut link gateway. Dokumen FCC untuk Starlink memakai istilah yang sama: *user beams* dan *gateway beams*.

### Terminal pengguna: VSAT dan antena phased array

**VSAT** (*Very Small Aperture Terminal*) adalah antena parabola kecil plus modem di lokasi pengguna. Kominfo menyebut VSAT sebagai infrastruktur yang dibutuhkan untuk mengakses internet satelit, dan mencatat bahwa VSAT kadang disebut antena parabola. Ukurannya jauh lebih kecil daripada antena gateway: di stasiun bumi SATRIA-1 Manado tercatat satu antena gateway berdiameter 13 m, dan di lokasi yang sama dua antena VSAT berdiameter 1,8 m dan 98 cm.

Antena parabola VSAT GEO diarahkan sekali ke satu titik langit. Satelit LEO bergerak, jadi terminalnya harus terus mengikuti. Terminal Starlink memakai antena **phased array**: banyak elemen antena kecil yang fasenya diatur secara elektronik sehingga berkasnya bisa dibelokkan tanpa memutar piringan. SpaceX menjelaskan kepada FCC bahwa terminalnya memakai *beam-forming* dan pemrosesan digital untuk membuat berkas sempit yang menunjuk dan mengikuti satelit LEO yang lewat.

### Gateway dan hub

Gateway mengubah sinyal satelit menjadi lalu lintas IP biasa lalu menyerahkannya ke jaringan darat. Satu satelit berkapasitas besar butuh banyak gateway. BAKTI menjelaskan bahwa beam SATRIA-1 berbentuk lingkaran-lingkaran yang bersama-sama menjangkau seluruh Indonesia, dan karena itulah gateway-nya dibangun di sebelas titik: Cikarang, Batam, Manado, Banjarmasin, Tarakan, Pontianak, Kupang, Ambon, Manokwari, Jayapura, dan Timika, dengan Cikarang sebagai pusat pengendali satelit utama dan Network Operation Control. Gateway Manado saja melayani 20 beam yang meliputi Sulawesi dan Kalimantan. Starlink mencatat lebih dari 100 lokasi gateway dengan lebih dari 1.500 antena di Amerika Serikat saja.

Jaringan VSAT GEO klasik berbentuk bintang. RFC 3135 menjelaskannya: satu **hub** besar di tengah, VSAT di lokasi-lokasi jauh. Arah hub ke VSAT disebut *outroute*, arah VSAT ke hub disebut *inroute*, dan kapasitasnya sangat tidak seimbang. RFC itu mencatat (pada 2001) rasio 400 banding 1 atau lebih makin umum, sehingga kanal kecil untuk ACK TCP pun bisa menjadi penghambat. Akibat lain topologi bintang: komunikasi dari satu VSAT ke VSAT lain harus mampir ke hub, jadi sinyal naik-turun ke satelit dua kali (**double hop**).

> [!WARNING]
> ITU-T G.114 menyarankan delay satu arah tidak melebihi 400 ms untuk perencanaan jaringan, dan secara eksplisit menyebut double hop satelit sebagai contoh pengecualian yang melanggar batas itu. Dengan angka perencanaan G.114 sebesar 260 ms per lompatan GEO, panggilan suara VSAT ke VSAT lewat hub sudah sekitar 520 ms satu arah sebelum antrean dihitung, dan pembicara cenderung saling potong.

### Pita frekuensi dan redaman hujan

| Pita | Rentang (ESA) | Pemakaian satelit yang umum | Catatan |
|---|---|---|---|
| **L** | 1-2 GHz | GPS, telepon satelit, maritim | |
| **C** | 4-8 GHz | TV satelit, VSAT perusahaan | Redaman hujan rendah; pasangan klasik 6 GHz naik, 4 GHz turun |
| **Ku** | 12-18 GHz | TV langsung ke rumah, VSAT komersial, internet di pesawat | Pasangan klasik 14/12 GHz; terminal Starlink memancar di 14,0-14,5 GHz dan menerima di 10,7-12,7 GHz |
| **Ka** | 26-40 GHz | Satelit berkapasitas tinggi (HTS) | Pasangan klasik 30/20 GHz; peka hujan; dipakai SATRIA-1 |

Batas pita di dunia satelit tidak persis mengikuti tabel ESA. Dokumen SpaceX ke FCC menyebut 10,7-12,7 GHz yang dipakai Starlink sebagai Ku-band, padahal angkanya di bawah batas 12 GHz di tabel. Yang penting adalah polanya: makin tinggi frekuensi, makin lebar bandwidth yang tersedia, tetapi makin besar pula redaman oleh hujan (**rain fade**). Indonesia beriklim tropis dengan hujan deras, jadi perancang link Ka-band harus menghitung redaman hujan sejak awal; ITU menyediakan metodenya dalam Rekomendasi ITU-R P.618. RFC 3135 mencatat jaringan VSAT umumnya dirancang tetap bekerja saat cuaca buruk, tetapi tidak dioptimalkan untuk kondisi itu, jadi kinerjanya bisa turun saat hujan lebat.

### Handover antarsatelit LEO

Terminal GEO tidak perlu berganti satelit. Di LEO, RFC 2488 menggambarkannya begini: saat satu satelit keluar dari pandangan stasiun, satelit lain muncul di cakrawala dan kanal dipindahkan ke sana. Pada Starlink perpindahan itu terlihat dalam pengukuran. Penelitian Mohan dkk. (ACM Web Conference 2024) menemukan interval rekonfigurasi 15 detik yang serempak di seluruh dunia, dan pada batas-batas interval itu latensi serta throughput melompat. Bagi aplikasi waktu nyata seperti panggilan video atau game, lompatan berkala itu terasa sebagai jitter.

### Laser antarsatelit

Satelit GEO model bent pipe hanya memancarkan ulang sinyal antara terminal dan gateway yang sama-sama berada di bawah cakupannya. Satelit Starlink bisa saling mengoper data lewat laser. Menurut Starlink, setiap satelit membawa 3 laser antarsatelit (*optical intersatellite links*) hingga 200 Gbps, yang bersama-sama membentuk jaring global. Laser ini memungkinkan layanan di lokasi yang jauh dari gateway mana pun, dan memungkinkan rute menghindari gangguan di darat.

Ada harganya. Starlink sendiri mencatat bahwa lalu lintas yang lewat laser, alih-alih langsung turun ke gateway terdekat, bisa menambah latensi. Fisikanya membantu pada jarak jauh: cahaya di ruang hampa sekitar 1,5 kali lebih cepat daripada di serat (299.792 berbanding sekitar 200.000 km/s). Jarak 10.000 km butuh sekitar 50 ms di serat, tetapi hanya sekitar 33 ms di hampa, ditambah sekitar 4 ms untuk naik dan turun 550 km. Untuk jarak dekat seperti Jakarta-Singapura, ongkos naik-turun itu yang dominan, dan kabel laut tetap unggul.

---

## 4. Satelit di Indonesia: Palapa, VSAT 3T, dan SATRIA-1

### Palapa: sistem satelit domestik sejak 1976

Indonesia memakai satelit untuk komunikasi domestik sejak Palapa A diluncurkan pada 1976. Menurut Kominfo, saat rencana itu disusun, baru Amerika Serikat dan Kanada yang memiliki satelit domestik sendiri. Palapa A membawa 12 transponder, dan dua unitnya (A1 dan A2) menempati slot 77° BT dan 83° BT. Pola dasarnya masih sama sampai sekarang: satu satelit GEO menjangkau seluruh nusantara, stasiun bumi di darat menyambungkannya ke jaringan nasional.

### VSAT untuk daerah 3T

Daerah 3T (terdepan, terluar, tertinggal) sering tidak terjangkau serat optik Palapa Ring maupun BTS seluler. Di sana BAKTI, badan di bawah kementerian komunikasi, menjalankan program seperti SATRIA dan Akses Internet untuk sekolah, puskesmas, kantor desa, dan layanan publik lain. Kominfo menjelaskan logikanya: begitu satelit beroperasi, membangun titik akses baru cukup dengan memasang VSAT di lokasi, jauh lebih mudah daripada membangun BTS 4G yang butuh jalur transmisi ke BTS lain atau ke kabel serat optik.

### SATRIA-1

**SATRIA-1** (Satelit Republik Indonesia) adalah satelit GEO yang dibangun dengan skema Kerja Sama Pemerintah dan Badan Usaha (KPBU). Kominfo menyebutnya satelit supercanggih pertama yang sepenuhnya dimiliki dan dikendalikan Pemerintah Indonesia.

| Aspek | Fakta |
|---|---|
| Pembuat | Thales Alenia Space, Prancis, platform Spacebus NEO bertenaga listrik penuh |
| Pemilik proyek | Kominfo (kini Komdigi) melalui BAKTI; PT Satelit Nusantara Tiga (SNT) sebagai badan usaha pelaksana |
| Peluncuran | 18 Juni 2023 pukul 18.21 waktu Florida, atau 19 Juni 2023 pukul 05.21 WIB, roket Falcon 9 dari Cape Canaveral |
| Massa luncur | 4,6 ton |
| Teknologi | VHTS (*Very High Throughput Satellite*), Ka-band, 150 Gbps |
| Posisi | Slot GEO 146° BT, di atas Papua |
| Perjalanan ke orbit | Direncanakan sekitar 145 hari dengan pendorong listrik (*electric orbit raising*) |
| Mulai beroperasi | Pengoperasian diresmikan Presiden pada 28 Desember 2023 |
| Gateway | 11 stasiun bumi, pusat kendali di Cikarang |
| Masa rancang | 15 tahun |

Perjalanan 145 hari itu disengaja. Menurut BAKTI, pendorong listrik membuat perjalanan lama, tetapi hemat bahan bakar; beban yang dihemat bisa dipakai untuk kapasitas lebih besar, dan bahan bakar yang tersisa memperpanjang umur satelit. Kapasitas 150 Gbps itu sepuluh kali Nusantara Satu (15 Gbps), satelit HTS milik PSN yang diluncurkan pada 2019 ke slot yang sama.

Coba hitung pembagiannya. Pada perencanaan 2017, pemerintah menghitung kebutuhan 150 ribu titik layanan dengan 1 Mbps per titik. Belakangan sebagian titik dilayani operator seluler, dan BAKTI menyebut jumlahnya mengerucut ke sekitar 50 ribu titik dengan 3 sampai 4 Mbps per titik:

```
150 Gbps / 50.000 titik = 3 Mbps per titik (rata-rata, kalau semua aktif bersamaan)
```

Angka itu cocok dengan target BAKTI. Kapasitas satelit sebesar apa pun tetap dibagi ke puluhan ribu lokasi, dan karena SATRIA-1 berada di GEO, setiap titik juga menanggung RTT di atas setengah detik.

---

## 5. Dampak ke Protokol: TCP, PEP, dan QUIC

### TCP di link GEO: BDP dan window

Ingat **BDP** (*bandwidth-delay product*) dari `00-fondasi/03`: banyaknya data yang "sedang di jalan" pada satu saat. TCP hanya boleh mengirim sebanyak window sebelum menunggu ACK, jadi window harus paling sedikit sebesar BDP supaya link penuh.

```
Link VSAT GEO 50 Mbps, RTT 600 ms
  BDP = 50.000.000 bit/s x 0,6 s = 30.000.000 bit = 3,75 MB

Tanpa window scaling (window maksimum 65.535 byte)
  throughput maksimum = 65.535 x 8 / 0,6 = 874 kbps
  Anda membayar 50 Mbps, satu koneksi hanya mendapat di bawah 1 Mbps.
```

Obatnya opsi **window scaling** (RFC 7323, dibahas di `05-transport/02-tcp` bagian 5). Faktor skala paling besar 14, sehingga window bisa mencapai 1 GiB. Untuk BDP 3,75 MB cukup faktor 6 (65.535 x 64 = 4.194.240 byte). RFC 2488, panduan praktik terbaik IETF untuk TCP di kanal satelit (BCP 28), sudah sejak 1999 merekomendasikan window scaling, SACK, Path MTU Discovery, fast retransmit, dan fast recovery untuk link satelit.

Window scaling saja belum cukup. Setiap koneksi baru juga membayar handshake dan slow start dalam satuan RTT:

```
Waktu sampai byte permintaan pertama dikirim (RTT 600 ms)
  TCP + TLS 1.3 : 1 RTT handshake TCP + 1 RTT handshake TLS = 1,2 detik
  QUIC          : handshake transport dan kripto digabung     = 0,6 detik
  QUIC 0-RTT    : data ikut paket pertama (koneksi ulang)     = 0 detik
```

Setelah itu slow start menggandakan congestion window satu kali per RTT. Di serat dengan RTT 10 ms, sepuluh putaran selesai dalam 0,1 detik. Di GEO, sepuluh putaran butuh 6 detik. Berkas kecil biasanya selesai diunduh selagi TCP masih dalam slow start, jadi yang terasa adalah jumlah RTT-nya, bukan bandwidth-nya.

### PEP: proxy yang memecah koneksi TCP

Operator VSAT menjawab masalah ini dengan **PEP** (*Performance Enhancing Proxy*), yang dijelaskan RFC 3135 (2001). Jenis yang paling umum di VSAT adalah **split connection**: PEP di sisi terminal memutus koneksi TCP dari komputer pengguna dan membuka koneksi terpisah ke ujung lain. Di antara dua PEP (satu di terminal, satu di hub), operator boleh memakai TCP yang disetel khusus untuk link itu, atau protokol miliknya sendiri di atas UDP.

Kuncinya adalah **ACK lokal**. PEP langsung meng-ACK data dari komputer Anda, sehingga slow start di komputer Anda berjalan dengan RTT beberapa milidetik, bukan 600 ms. Konsekuensinya, PEP yang menanggung tanggung jawab mengirim ulang data yang sudah ia ACK bila data itu hilang di jalan. RFC 3135 mencatat ciri PEP VSAT pada umumnya: fokus pada TCP, implementasi terdistribusi yang asimetris, split connection dengan ACK dan retransmisi lokal, dan kompresi untuk menghemat inroute.

PEP punya dua harga:

1. **Melanggar prinsip end-to-end.** Koneksi sekarang bergantung pada state di tengah jaringan. RFC 3135 menulis bahwa bila PEP gagal, state itu hilang dan koneksi putus walaupun ada jalur lain.
2. **Buta terhadap enkripsi lapisan bawah.** Bila IPsec ESP dipakai dari ujung ke ujung, PEP di tengah tidak bisa membaca header TCP, jadi tidak bisa memecah koneksi. Artinya, lalu lintas di dalam VPN site-to-site atau VPN klien kembali menanggung RTT GEO penuh.

### QUIC di atas satelit

QUIC (RFC 9000, lihat `05-transport/03-udp-quic`) membawa dua kabar untuk link satelit. Kabar baiknya, handshake transport dan TLS digabung sehingga koneksi baru hemat satu RTT, dan koneksi ulang bisa memakai 0-RTT. Kabar buruknya, hampir seluruh header QUIC dienkripsi dan dilindungi integritasnya. RFC 9312 menyatakannya dengan jelas: tidak ada informasi di header QUIC yang dimaksudkan untuk bisa diubah jaringan, sehingga operasi di tengah jalan yang bergantung pada modifikasi data tidak mungkin tanpa kerja sama salah satu ujung QUIC.

Bagi PEP, QUIC sama dengan IPsec: tidak bisa dipecah. Lalu lintas HTTP/3 lewat GEO menanggung RTT penuh pada setiap putaran slow start. Latihan 7 di `01-model-referensi/02-tcp-ip` membahas pilihan operator dalam situasi ini. Di LEO dengan RTT puluhan milidetik, masalah ini jauh mengecil, dan alasan memakai PEP untuk mempercepat slow start nyaris hilang.

---

## 6. Jaringan Antarplanet

### Jarak dan waktu tempuh cahaya

Begitu meninggalkan orbit Bumi, jaraknya melompat ke skala lain. Hitungannya tetap sama: jarak dibagi kecepatan cahaya.

| Tujuan | Jarak | Waktu tempuh satu arah | RTT |
|---|---|---|---|
| Satelit GEO | 35.786 km | 0,12 detik | 0,48 detik (bent pipe) |
| Bulan | 363.300 sampai 405.500 km (rata-rata 384.400 km) | 1,2 sampai 1,35 detik (rata-rata 1,28 detik) | sekitar 2,6 detik |
| Mars, terdekat | 54,6 juta km | sekitar 3,0 menit | sekitar 6 menit |
| Mars, terjauh | 401,4 juta km | sekitar 22,3 menit | sekitar 45 menit |

RFC 5325 menambahkan contoh yang lebih jauh lagi: RTT antara Bumi dan Europa, bulan Jupiter, sekitar 66 sampai 100 menit. Jarak bukan satu-satunya masalah. Komunikasi antarplanet butuh garis pandang, jadi sambungan putus ketika planet berotasi atau wahana berada di balik planet (okultasi). Antena raksasa juga mahal dan dipakai bergiliran oleh banyak misi, sehingga sebuah wahana hanya mendapat jadwal kontak tertentu.

### NASA Deep Space Network

NASA berkomunikasi dengan wahana antarplanet lewat **Deep Space Network (DSN)**: tiga kompleks antena yang berjarak kira-kira 120 derajat bujur satu sama lain.

| Kompleks | Lokasi |
|---|---|
| Goldstone | Fort Irwin, sekitar 72 km di timur laut Barstow, California, Amerika Serikat |
| Madrid | Robledo de Chavela, 60 km di barat Madrid, Spanyol |
| Canberra | Dekat Cagar Alam Tidbinbilla, 40 km di barat daya Canberra, Australia |

Setiap kompleks punya sedikitnya empat stasiun antena, dengan piringan terbesar berdiameter 70 m dan sejumlah piringan 34 m. Jarak 120 derajat itu yang membuat kontak bisa terus-menerus: sebelum sebuah wahana tenggelam di cakrawala satu kompleks karena Bumi berputar, kompleks berikutnya sudah bisa menangkap sinyalnya. Semua dioperasikan lewat Network Operations Control Center di JPL.

Kecepatannya jauh dari internet rumah. Rover Perseverance di Mars bisa mengirim langsung ke Bumi lewat antena X-band (7-8 GHz) dengan laju 160 bit per detik atau lebih ke antena DSN 34 m, atau 800 bit per detik atau lebih ke antena 70 m; arah sebaliknya 500 dan 3.000 bit per detik. Lewat antena UHF (sekitar 400 MHz) ke orbiter Mars yang melintas di atasnya, lajunya sampai 2 Mbps, lalu orbiter meneruskan data itu ke Bumi. Jalur estafet itu (rover ke orbiter, orbiter ke DSN, DSN ke pusat misi) ribuan kali lebih cepat daripada jalur langsung, tetapi setiap ruasnya hanya tersambung pada waktu tertentu.

### Kenapa TCP/IP tidak bisa langsung dipakai

RFC 4838 (arsitektur DTN, 2007) mendaftar asumsi Internet yang tidak berlaku di ruang angkasa: selalu ada jalur ujung ke ujung selama sesi berlangsung, retransmisi berdasarkan umpan balik yang cepat dari penerima efektif untuk memperbaiki galat, loss ujung ke ujung relatif kecil, dan semua router serta host menjalankan TCP/IP.

Coba terapkan pada Mars di jarak terdekat:

```
RTT Bumi-Mars (terdekat) sekitar 6,1 menit

t = 0         klien di Bumi mengirim SYN
t = 6,1 menit SYN-ACK tiba; klien baru boleh mengirim data
t = 9,1 menit byte data pertama tiba di Mars
```

Sementara itu timer TCP dirancang untuk Bumi. Menurut dokumentasi kernel Linux, klien mengirim ulang SYN dengan RTO awal 1 detik dan, dengan setelan bawaan, menyerah setelah 131 detik. Klien itu sudah menyerah sebelum SYN pertamanya sampai di Mars, yang butuh sekitar 182 detik. RFC 5325 juga menghitung, dengan rumus throughput TCP dan RTT Mars minimum 8 menit, bahwa TCP baru bisa mencapai 1 Mbps bila tingkat loss-nya sekitar 4,68 x 10^-10. Link antariksa nyata tidak sebersih itu. Masalah terbesar justru di luar rumus: sering tidak ada jalur ujung ke ujung sama sekali, karena orbiter sedang di balik planet atau antena DSN sedang melayani misi lain.

### Arsitektur DTN dan Bundle Protocol versi 7

**DTN** (*Delay/Disruption Tolerant Networking*) menerima keadaan itu apa adanya. Arsitekturnya, RFC 4838, berasal dari riset Interplanetary Internet dan menambahkan satu lapisan baru di atas transport: **bundle layer**, sebuah overlay ujung ke ujung yang berorientasi pesan. Satuan datanya disebut **bundle**.

Perbedaan utamanya adalah **store-and-forward**. Router IP membuang paket bila jalur keluarnya tidak ada. Node DTN menyimpan bundle, biasanya di penyimpanan tetap seperti disk atau flash, sampai kontak berikutnya tersedia, lalu meneruskannya. Analogi yang pas adalah kantor pos: surat tidak perlu jalan tol yang tersambung dari pengirim ke penerima, cukup berpindah dari satu kantor ke kantor berikutnya setiap kali ada kendaraan yang berangkat. Analogi ini berhenti berlaku pada satu hal: bundle punya umur (*lifetime*), dan node boleh membuangnya setelah umurnya habis.

RFC 4838 juga mendefinisikan **custody transfer**: node yang menerima tanggung jawab pengantaran andal disebut *custodian*, dan perpindahan bundle beserta tanggung jawabnya dari satu node ke node lain disebut custody transfer. Dengan begitu pengirim di Mars tidak perlu menyimpan salinan sampai penerima di Bumi membalas, yang bisa makan waktu sampai 45 menit. Ia cukup menunggu node berikutnya menyatakan sanggup menjaga bundle itu.

**Bundle Protocol versi 7** (BPv7, RFC 9171, Januari 2022) adalah versi standar IETF dari protokol ini, penerus versi eksperimental RFC 5050. Hal-hal yang perlu Anda kenali:

| Unsur | Arti |
|---|---|
| Overlay *store-carry-forward* | BP duduk di atas jaringan-jaringan penyusun; bundle bisa disimpan, dibawa, lalu diteruskan |
| *Convergence layer* | Lapisan di bawah BP yang benar-benar mengangkut bundle pada satu ruas: TCP di darat, LTP di link radio antariksa, dan lainnya |
| Endpoint ID | Alamat tujuan bundle, memakai skema URI `dtn:` atau `ipn:` (misalnya `ipn:12.3`, nomor node 12, nomor layanan 3) |
| Lifetime | Umur bundle; setelah lewat, node tidak wajib menyimpannya lagi |
| Encoding | CBOR, menggantikan SDNV di RFC 5050; satuan waktu milidetik |

Satu perubahan penting di BPv7: custody transfer tidak lagi ada di protokol inti. RFC 9171 memindahkannya ke spesifikasi Bundle-in-Bundle Encapsulation (BIBE) yang masih berupa draf IETF, dan CCSDS menerbitkan spesifikasi eksperimental tersendiri untuk custody transfer pada Juni 2026 (CCSDS 734.6-O-1).

### LTP: keandalan per lompatan

Di ruas radio antariksa, convergence layer yang dirancang khusus adalah **LTP** (*Licklider Transmission Protocol*, RFC 5326, 2008, eksperimental). LTP bekerja berpasangan antara dua node yang bersebelahan dan sedang saling melihat lewat radio, sering langsung di atas protokol data link. Ciri-cirinya:

- **Tanpa handshake dan tanpa negosiasi.** Pengirim langsung mengirim; jeda menit tidak dihabiskan untuk membuka sesi.
- **ARQ dengan laporan penerimaan selektif.** Penerima melaporkan bagian mana yang sudah sampai, dan hanya bagian yang hilang yang dikirim ulang.
- **Bagian merah dan hijau.** Awal blok (*red-part*) dikirim andal dengan ACK dan retransmisi. Sisa blok (*green-part*) dikirim tanpa jaminan, cocok untuk data yang lebih baik hilang daripada terlambat.
- **Tanpa flow control dan congestion control.** Karena itu RFC 5326 menegaskan LTP tidak cocok dipakai di Internet global. Bila dijalankan di atas UDP, LTP hanya boleh untuk pengembangan atau LAN privat.

### CCSDS: standar untuk wahana antariksa

**CCSDS** (*Consultative Committee for Space Data Systems*), dibentuk pada 1982, adalah forum yang beranggotakan badan-badan antariksa dan membakukan protokol komunikasi wahana. Kelompok kerja DTN-nya menyusun protokol untuk konsep *Solar System Internetwork*, dan menerbitkan profil protokol IETF untuk dipakai misi:

| Dokumen | Isi | Terbit |
|---|---|---|
| CCSDS 734.1-B-1 | LTP untuk CCSDS (berbasis RFC 5326) | Mei 2015 |
| CCSDS 734.2-B-1 | Bundle Protocol (berbasis RFC 5050) | September 2015 |
| CCSDS 734.3-B-1 | Schedule-Aware Bundle Routing (rute berbasis jadwal kontak) | Juli 2019 |
| CCSDS 734.20-O-1 | Bundle Protocol berbasis RFC 9171 (eksperimental) | April 2025 |
| CCSDS 734.6-O-1 | Custody Transfer dan Compressed Bundle Status Reporting (eksperimental) | Juni 2026 |

Buku "B" (*Blue Book*) adalah standar yang direkomendasikan, buku "O" (*Orange Book*) adalah spesifikasi eksperimental. SABR menghitung rute dari jadwal kontak yang sudah diketahui sebelumnya, karena di antariksa waktu sambungan bisa diramalkan dari orbit. Ini berbeda dari protokol routing di Bumi seperti OSPF yang bereaksi setelah link naik atau turun.

### DTN yang sudah bekerja

DTN sudah dipakai di misi nyata. NASA mengembangkannya sejak akhir 1990-an, dan sekarang punya beberapa implementasi: ION, DTNME, HDTN, dan BPLib.

| Waktu | Peristiwa |
|---|---|
| Oktober 2008 | JPL menguji DTN di wahana EPOXI (Deep Impact) dan mengirim sekitar 300 gambar dari node JPL ke wahana lalu kembali lagi |
| Mei 2016 | Stasiun Luar Angkasa Internasional (ISS) mengoperasikan layanan DTN institusional untuk payload sains, dengan dua implementasi: ION dan DTNME |
| 20 November 2017 | Teknisi NASA di Stasiun McMurdo, Antarktika, mengirim swafoto ke ISS lewat DTN |
| 2024 | Misi PACE menjadi misi sains operasional pertama yang memakai DTN di wahana dan di jaringan bumi Near Space Network |
| 2024 | HDTN mengirim lebih dari 500 foto hewan peliharaan ke ISS lewat laser, 1,2 Gbps, melalui satelit relay LCRD di orbit geosinkron |

Kasus nyata modul ini membahas uji 2024 itu lebih rinci.

---

## 7. Praktik

### Menghitung BDP dan window untuk link GEO

Langkahnya selalu sama: ukur RTT, kalikan dengan bandwidth, lalu pastikan window dan buffer kedua ujung muat.

```bash
# BDP dan faktor window scaling minimum: 100 Mbps, RTT 600 ms
$ python3 -c "
bw=100e6; rtt=0.6
bdp=bw*rtt/8
s=0
while 65535*2**s < bdp: s+=1
print(f'BDP = {bdp/1e6:.2f} MB, faktor skala minimum = {s}, window maks = {65535*2**s:,} byte')
"
BDP = 7.50 MB, faktor skala minimum = 7, window maks = 8,388,480 byte
```

Untuk link LEO 100 Mbps dengan RTT 25 ms, BDP-nya hanya 0,31 MB, jauh di bawah batas autotuning bawaan kernel di kebanyakan mesin (lihat di bawah). Pemakai LEO jarang perlu menyetel apa pun, sedangkan pemakai GEO berkepentingan langsung dengan angka ini.

### Mengukur latensi dengan ping dan mtr

`ping` memberi RTT ujung ke ujung. `mtr` menggabungkan traceroute dan ping, sehingga Anda bisa melihat di lompatan mana latensi melonjak. Pada link GEO, lonjakan ratusan milidetik muncul tepat setelah router lokal, di lompatan pertama sesudah modem satelit.

```bash
# Linux: 20 ping, perhatikan baris ringkasan min/avg/max/mdev
$ ping -c 20 1.1.1.1

# mtr mode laporan: 100 putaran, nama host lebar, tampilkan IP dan nomor AS
$ mtr -rwbz -c 100 1.1.1.1

# RTT dan window scale yang dinegosiasikan untuk koneksi yang sedang berjalan
$ ss -ti dst 1.1.1.1
```

```
! Cisco IOS: 100 ping. Timeout bawaan 2 detik; untuk link berlatensi
! tinggi naikkan lewat extended ping (ketik "ping" saja, lalu isi
! "Timeout in seconds").
ping 1.1.1.1 repeat 100
traceroute 1.1.1.1
```

```
# MikroTik RouterOS v7
/ping 1.1.1.1 count=20 interval=500ms
/tool traceroute 1.1.1.1
```

Cara membaca hasilnya:

1. **min** mendekati latensi propagasi. Di GEO paling sedikit sekitar 480 ms (RFC 3135); untuk Starlink, median yang dilaporkan 25,7 ms.
2. **avg** jauh di atas min berarti ada antrean. Link satelit dibagi banyak pengguna, dan Starlink sendiri memusatkan pengukurannya pada jam sibuk (18.00-21.00 waktu setempat) karena saat itulah beban jaringan paling tinggi.
3. **mdev** atau lompatan berkala menandakan jitter. Di LEO, lompatan teratur bisa berasal dari rekonfigurasi satelit.
4. Di `mtr`, kalau sebuah lompatan tengah menunjukkan loss tetapi lompatan sesudahnya, termasuk tujuan akhir, tidak, berarti paket Anda tetap lewat. Router itu hanya tidak membalas sebagian probe.

> [!WARNING]
> Di Cisco, ping yang balasannya datang lebih lambat dari timeout dihitung gagal. Pada link satelit yang antreannya penuh, RTT bisa melewati 2 detik, dan Anda akan salah menyimpulkan ada packet loss padahal paketnya hanya terlambat.

### Menyetel TCP Linux untuk link satelit

Yang disetel adalah **host** yang mengirim dan menerima data (server, PC, server backup), bukan router. Router hanya meneruskan paket; window TCP ditentukan kedua ujung koneksi.

```bash
# 1. Periksa dulu. Kernel modern sudah melakukan autotuning buffer.
$ sysctl net.ipv4.tcp_window_scaling net.ipv4.tcp_sack \
         net.ipv4.tcp_rmem net.ipv4.tcp_wmem \
         net.core.rmem_max net.core.wmem_max \
         net.ipv4.tcp_congestion_control

# 2. Untuk BDP sekitar 7,5 MB (100 Mbps x 600 ms), beri batas atas 16 MB
#    supaya ada ruang untuk overhead buffer kernel.
$ sudo sysctl -w net.ipv4.tcp_rmem="4096 131072 16777216"
$ sudo sysctl -w net.ipv4.tcp_wmem="4096 16384 16777216"
$ sudo sysctl -w net.core.rmem_max=16777216
$ sudo sysctl -w net.core.wmem_max=16777216

# 3. BBR mengukur bandwidth dan RTT, tidak menunggu loss (lihat 05-transport/04)
$ sudo modprobe tcp_bbr
$ sudo sysctl -w net.ipv4.tcp_congestion_control=bbr

# 4. Simpan agar bertahan setelah reboot
$ sudo tee /etc/sysctl.d/90-satelit.conf <<'EOF'
net.ipv4.tcp_rmem = 4096 131072 16777216
net.ipv4.tcp_wmem = 4096 16384 16777216
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_congestion_control = bbr
EOF
$ sudo sysctl --system
```

Beberapa hal yang menentukan apakah setelan ini berguna:

- Nilai ketiga `tcp_rmem` dan `tcp_wmem` adalah batas autotuning. Dokumentasi kernel terbaru menyebut nilai bawaan maksimum `tcp_rmem` antara 131072 byte dan 32 MB tergantung RAM, jadi di mesin modern langkah 2 mungkin tidak perlu. Selalu periksa dulu.
- `net.core.rmem_max` dan `wmem_max` membatasi aplikasi yang meminta ukuran buffer sendiri lewat `setsockopt()`. Aplikasi yang melakukan itu mematikan autotuning untuk socket-nya, jadi window-nya terkunci di angka yang ia minta.
- Kalau operator VSAT memakai PEP, komputer Anda sebenarnya berbicara TCP dengan PEP di dekatnya. Setelan host paling terasa pada lalu lintas yang tidak bisa dipecah PEP: VPN, QUIC, atau transfer server-ke-server.

> [!CAUTION]
> Jangan menaikkan buffer sebesar-besarnya "supaya aman". Buffer yang terlalu besar mengisi antrean dan menaikkan latensi (bufferbloat). Starlink sendiri mencatat bahwa memangkas buffer di jaringannya dan memasang AQM `fq_codel` di router Wi-Fi-nya ikut menurunkan latensi. Ukur sebelum dan sesudah, misalnya dengan `iperf3`.

---

## 8. Kesalahan Umum

1. **Mengira bandwidth lebih besar menurunkan latensi.** Langganan 100 Mbps lewat GEO tetap punya RTT di atas setengah detik. Latensi propagasi hanya turun bila jaraknya turun.
2. **Menyamakan semua internet satelit.** GEO, MEO, dan LEO berbeda RTT-nya sampai puluhan kali lipat. Tanyakan orbitnya sebelum menilai cocok tidaknya untuk VoIP, video, atau game.
3. **Menilai link hanya dari speedtest.** Uji kecepatan yang membuka beberapa koneksi sekaligus bisa memenuhi link, sementara aplikasi yang memakai satu koneksi TCP, seperti backup atau unduhan berkas, jauh lebih lambat karena dibatasi window dan RTT. Ukur juga dengan `ping`, `mtr`, dan transfer satu aliran.
4. **Memasang VPN di atas VSAT GEO lalu heran semuanya melambat.** Enkripsi IPsec menyembunyikan header TCP dari PEP, jadi akselerasi operator berhenti bekerja.
5. **Menyetel router, padahal masalahnya di host.** Window TCP diatur kedua ujung koneksi. Mengganti setelan router tidak mengubah window server backup Anda.
6. **Memasang terminal di tempat yang terhalang.** Terminal Starlink hanya memakai satelit di atas elevasi 25 derajat. Pohon atau bangunan yang menjulang di atas sudut itu memutus sambungan ke satelit yang lewat di bagian langit tersebut.
7. **Mengabaikan hujan pada link Ka-band.** Di daerah tropis, rain fade menurunkan kualitas link. Saat mengeluhkan "internet satelit lambat", catat juga cuacanya.
8. **Menganggap DTN sama dengan TCP yang timeout-nya diperpanjang.** DTN mengubah modelnya: tidak ada sesi ujung ke ujung, data disimpan di setiap node sampai kontak berikutnya, dan tanggung jawab pengantaran bisa berpindah dari node ke node.

---

## 9. Ringkasan

- Latensi propagasi = jarak / kecepatan cahaya. Hampa 299.792 km/s, serat sekitar 200.000 km/s (5 mikrodetik per km).
- **GEO** 35.786 km, tampak diam, 3 satelit untuk cakupan hampir global, RTT paling sedikit 558 ms menurut RFC 2488. **LEO** sekitar 550 km untuk Starlink, butuh ribuan satelit, RTT propagasi di bawah 10 ms dan median terukur 25,7 ms. **MEO** di antaranya.
- Komponen: terminal (VSAT parabola atau phased array), satelit, gateway. Jaringan VSAT klasik berbentuk bintang dengan hub; VSAT ke VSAT berarti double hop.
- Pita C tahan hujan; Ku dan Ka lebih lebar tetapi lebih peka hujan. Starlink memakai Ku untuk terminal; SATRIA-1 memakai Ka.
- LEO butuh handover terus-menerus dan memakai laser antarsatelit (Starlink: 3 laser hingga 200 Gbps per satelit).
- **SATRIA-1**: GEO 146° BT, 150 Gbps Ka-band, diluncurkan 19 Juni 2023 WIB, beroperasi sejak akhir Desember 2023, 11 gateway, sekitar 50 ribu titik layanan publik.
- TCP di GEO butuh window sebesar BDP (window scaling, RFC 7323). Operator memakai **PEP** (RFC 3135) yang memecah koneksi dan mengirim ACK lokal, tetapi PEP tidak bisa membantu IPsec dan QUIC.
- Ke Bulan sekitar 1,3 detik, ke Mars 3 sampai 22 menit satu arah. TCP/IP gagal karena RTT menit dan jalur yang sering putus.
- **DTN** (RFC 4838) menambahkan bundle layer dengan store-and-forward; **BPv7** (RFC 9171) adalah standarnya; **LTP** (RFC 5326) memberi keandalan per lompatan radio; **CCSDS** membakukannya untuk misi. DTN sudah dipakai di ISS dan misi PACE.

---

## 10. Latihan

1. Sebuah sekolah di Maluku memakai VSAT GEO. Hitung RTT propagasi paling kecil yang mungkin bila terminal dan gateway sama-sama tepat di bawah satelit. Lalu jelaskan kenapa `ping` dari sekolah itu hampir selalu menunjukkan angka yang lebih besar.
2. Terminal Starlink hanya memakai satelit di atas elevasi 25 derajat; pada elevasi itu jarak miring ke satelit di ketinggian 550 km sekitar 1.123 km. Hitung RTT propagasi pada kondisi itu dan pada kondisi satelit tepat di atas kepala. Bandingkan dengan median 25,7 ms yang dilaporkan Starlink, lalu sebutkan dari mana selisihnya.
3. Link VSAT GEO 20 Mbps punya RTT 650 ms. Hitung (a) BDP-nya, (b) throughput maksimum satu koneksi TCP tanpa window scaling, dan (c) faktor window scaling minimum agar link bisa penuh.
4. Kantor pusat dan kantor cabang sebuah perusahaan tambang sama-sama memakai VSAT GEO dari satu operator dengan topologi bintang. Panggilan VoIP antara keduanya terasa saling potong, padahal panggilan dari cabang ke nomor telepon biasa terasa lebih baik. Jelaskan dengan konsep hub, double hop, dan batas ITU-T G.114.
5. Jelaskan cara kerja PEP model split connection di jaringan VSAT. Kenapa PEP tidak bisa membantu koneksi TCP yang berjalan di dalam IPsec ESP, dan kenapa HTTP/3 bernasib sama?
6. SATRIA-1 berkapasitas 150 Gbps dan direncanakan melayani sekitar 50 ribu titik layanan publik. Hitung kapasitas rata-rata per titik dan bandingkan dengan target BAKTI. Lalu jelaskan kenapa satelit itu butuh 11 gateway yang tersebar dari Batam sampai Jayapura, dan kenapa ia butuh sekitar 145 hari untuk sampai ke slotnya.
7. Hitung waktu tempuh cahaya Bumi-Mars pada jarak terdekat (54,6 juta km) dan terjauh (401,4 juta km). Pada jarak terdekat, berapa lama klien TCP di Bumi menunggu sejak mengirim SYN sampai boleh mengirim byte data pertama? Apa yang terjadi pada timer TCP biasa selama menunggu?
8. Dalam BPv7 (RFC 9171), di mana mekanisme custody transfer ditempatkan? Dengan skenario rover, orbiter, stasiun DSN, dan pusat misi, jelaskan bagaimana DTN menjaga data agar tidak hilang ketika tidak pernah ada jalur ujung ke ujung yang utuh.

<details>
<summary>Jawaban</summary>

1. Jaraknya empat kali ketinggian GEO: 4 x 35.786 km = 143.144 km. Dibagi kecepatan cahaya 299.792 km/s hasilnya sekitar 0,477 detik atau 477 ms. Angka ini batas bawah teoretis, karena terminal dan gateway tidak mungkin sama-sama tepat di bawah satelit. RFC 2488 menghitung satu lompatan bumi-satelit-bumi 239,6 sampai 279,0 ms tergantung posisi stasiun, sehingga RTT paling sedikit 558 ms. Di atas itu masih ada antrean dan akses kanal yang dibagi banyak VSAT (RFC 3135 mencatat total delay bisa sampai orde beberapa detik saat antrean penuh), pemrosesan di modem dan PEP, serta jalur darat dari gateway ke server tujuan.

2. Satelit tepat di atas kepala: 4 x 550 km = 2.200 km, sekitar 7,3 ms. Pada elevasi 25 derajat: 4 x 1.123 km = 4.492 km, sekitar 15,0 ms. Keduanya cocok dengan catatan Starlink sendiri (1,8 sampai 3,6 ms per ruas). Selisih sampai median 25,7 ms datang dari bagian yang bukan propagasi radio: jalur darat dari gateway ke PoP tempat lalu lintas masuk ke internet, penjadwalan radio karena satu beam dibagi banyak pengguna, buffer dan antrean, rute lewat laser antarsatelit bila tidak ada gateway dekat, serta lompatan berkala saat rekonfigurasi satelit.

3. (a) BDP = 20.000.000 x 0,65 = 13.000.000 bit = 1.625.000 byte, sekitar 1,6 MB.
   (b) Tanpa window scaling window maksimum 65.535 byte, jadi throughput maksimum 65.535 x 8 / 0,65 = sekitar 806 kbps. Link 20 Mbps hanya terpakai sekitar 4% oleh satu koneksi.
   (c) 1.625.000 / 65.535 = 24,8, jadi butuh pengali 32 = 2 pangkat 5. Faktor skala minimum 5, yang memberi window maksimum 2.097.120 byte. Linux biasanya menegosiasikan faktor yang lebih besar, misalnya 7 seperti contoh `ss` di `05-transport/02-tcp`, asalkan buffer penerima juga diizinkan tumbuh sebesar BDP.

4. Dalam topologi bintang, semua lalu lintas VSAT melewati hub. Suara dari cabang ke pusat berjalan VSAT cabang ke satelit ke hub, lalu hub ke satelit ke VSAT pusat: dua lompatan GEO (double hop). Dengan angka perencanaan ITU-T G.114 sebesar 260 ms per lompatan, delay satu arahnya sudah sekitar 520 ms sebelum antrean, melewati batas 400 ms yang disarankan G.114 untuk perencanaan jaringan. G.114 bahkan menyebut double hop satelit sebagai contoh pengecualian. Panggilan ke nomor biasa hanya melewati satu lompatan satelit sampai hub, lalu jaringan darat, jadi delay-nya sekitar separuh. Solusinya: pindahkan suara antarcabang ke jalur darat atau LEO bila tersedia, atau bila tidak ada pilihan lain, biasakan bicara bergiliran.

5. PEP di sisi terminal memutus koneksi TCP dari komputer pengguna dan membalas dengan ACK lokal, sehingga komputer pengguna melihat RTT pendek dan slow start-nya cepat. PEP lalu membawa data melewati satelit ke PEP pasangan di hub, memakai TCP yang disetel khusus atau protokol milik operator, sering dengan kompresi. PEP di hub membuka koneksi TCP baru ke server tujuan. Karena sudah meng-ACK duluan, PEP yang bertanggung jawab mengirim ulang data yang hilang di link satelit.
   Semua itu butuh kemampuan membaca dan membalas header TCP. IPsec ESP mengenkripsi header TCP dan muatannya, jadi bagi PEP paket itu tidak terbaca; RFC 3135 menyebut PEP di tengah jaringan tidak bisa memeriksa header transport bila IPsec dipakai ujung ke ujung. HTTP/3 berjalan di atas QUIC yang mengenkripsi hampir seluruh header transport dan melindungi integritasnya; RFC 9312 menyatakan header QUIC tidak dimaksudkan untuk diubah jaringan. PEP tidak bisa membuat ACK palsu atas nama ujung QUIC, jadi koneksi itu menanggung RTT GEO penuh.

6. 150 Gbps dibagi 50.000 titik sama dengan 3 Mbps per titik bila semua aktif bersamaan, sejalan dengan target BAKTI sebesar 3 sampai 4 Mbps per titik. Banyak gateway dibutuhkan karena kapasitas 150 Gbps tidak bisa dialirkan lewat satu antena. SATRIA-1 menyinari Indonesia dengan banyak beam sempit, dan setiap gateway menangani sekelompok beam; gateway Manado saja melayani 20 beam di Sulawesi dan Kalimantan. Cikarang menjadi pusat pengendali dan Network Operation Control. Perjalanan sekitar 145 hari terjadi karena SATRIA-1 memakai pendorong listrik untuk naik ke orbit GEO. Pendorong listrik lambat tetapi hemat bahan bakar, dan beban yang dihemat dipakai untuk kapasitas lebih besar dan umur lebih panjang.

7. Terdekat: 54.600.000 km / 299.792 km/s = sekitar 182 detik, atau 3,0 menit. Terjauh: 401.400.000 km / 299.792 km/s = sekitar 1.339 detik, atau 22,3 menit. Pada jarak terdekat RTT sekitar 6,1 menit. Klien mengirim SYN pada t = 0, SYN-ACK baru tiba sekitar 6,1 menit kemudian, dan baru saat itu klien boleh mengirim ACK beserta data pertama, yang tiba di Mars sekitar 9,1 menit setelah SYN. Dalam praktik klien tidak akan sempat menunggu selama itu. Timer retransmisinya dirancang untuk RTT milidetik: Linux mengirim ulang SYN dengan RTO awal 1 detik dan, dengan setelan bawaan, menyerah setelah 131 detik, bahkan sebelum SYN pertama tiba di Mars (sekitar 182 detik). Satu sesi TCP juga mengandaikan jalur tersambung selama sesi berlangsung, padahal okultasi dan jadwal antena DSN memutusnya.

8. BPv7 tidak memuat custody transfer di protokol intinya. RFC 9171 memindahkannya ke spesifikasi Bundle-in-Bundle Encapsulation (BIBE), yang masih berupa draf IETF, dan CCSDS menerbitkan spesifikasi eksperimental Custody Transfer untuk Bundle Protocol pada Juni 2026. Konsep custody sendiri berasal dari arsitektur DTN RFC 4838.
   Skenario: rover membuat bundle berisi data sains dengan lifetime yang cukup panjang, beralamat endpoint pusat misi. Saat orbiter melintas, rover meneruskan bundle lewat link radio. Orbiter menyimpan bundle di penyimpanan tetapnya karena Bumi belum terlihat. Bila custody dipakai, orbiter menyatakan menerima tanggung jawab, dan rover boleh menghapus salinannya serta memakai memorinya untuk data baru. Ketika jadwal kontak dengan stasiun DSN tiba, orbiter meneruskan bundle, misalnya lewat LTP yang mengirim ulang hanya bagian yang hilang. Dari stasiun DSN, bundle diteruskan lewat jaringan darat ke pusat misi dengan convergence layer seperti TCP. Pada setiap saat hanya satu ruas yang perlu tersambung; tidak pernah dibutuhkan jalur ujung ke ujung, dan tidak ada pihak yang menunggu ACK dari ujung lain yang berjarak menit cahaya.

</details>

---

## 11. Sumber

- NIST, CODATA: speed of light in vacuum: https://physics.nist.gov/cgi-bin/cuu/Value?c
- ESA, Types of orbits: https://www.esa.int/Enabling_Support/Space_Transportation/Types_of_orbits
- NASA Earth Observatory, Catalog of Earth Satellite Orbits: https://science.nasa.gov/earth/earth-observatory/catalog-of-earth-satellite-orbits
- NASA NSSDCA, Earth Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html
- NASA NSSDCA, Moon Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html
- NASA NSSDCA, Mars Fact Sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
- SES, Medium Earth Orbit (MEO): https://www.ses.com/network-and-technology/meo
- ITU-T G.114 (05/2003), One-way transmission time: https://www.itu.int/rec/T-REC-G.114-200305-I/en
- ITU-R P.618, Propagation data and prediction methods required for the design of Earth-space telecommunication systems: https://www.itu.int/rec/R-REC-P.618
- ESA, Satellite frequency bands: https://www.esa.int/Applications/Connectivity_and_Secure_Communications/Satellite_frequency_bands
- TeleGeography Submarine Cable Map, Matrix Cable System: https://www.submarinecablemap.com/submarine-cable/matrix-cable-system
- RFC 2488, Enhancing TCP Over Satellite Channels using Standard Mechanisms (BCP 28): https://www.rfc-editor.org/rfc/rfc2488
- RFC 3135, Performance Enhancing Proxies Intended to Mitigate Link-Related Degradations: https://www.rfc-editor.org/rfc/rfc3135
- RFC 7323, TCP Extensions for High Performance: https://www.rfc-editor.org/rfc/rfc7323
- RFC 9000, QUIC: A UDP-Based Multiplexed and Secure Transport: https://www.rfc-editor.org/rfc/rfc9000
- RFC 9312, Manageability of the QUIC Transport Protocol: https://www.rfc-editor.org/rfc/rfc9312
- RFC 4838, Delay-Tolerant Networking Architecture: https://www.rfc-editor.org/rfc/rfc4838
- RFC 9171, Bundle Protocol Version 7: https://www.rfc-editor.org/rfc/rfc9171
- RFC 5325, Licklider Transmission Protocol - Motivation: https://www.rfc-editor.org/rfc/rfc5325
- RFC 5326, Licklider Transmission Protocol - Specification: https://www.rfc-editor.org/rfc/rfc5326
- IETF Datatracker, Bundle-in-Bundle Encapsulation (draft-ietf-dtn-bibe): https://datatracker.ietf.org/doc/draft-ietf-dtn-bibe/
- CCSDS, daftar publikasi: https://ccsds.org/publications/allpubs/
- CCSDS 734.2-B-1, CCSDS Bundle Protocol Specification: https://ccsds.org/Pubs/734x2b1.pdf
- CCSDS 734.1-B-1, Licklider Transmission Protocol (LTP) for CCSDS: https://ccsds.org/Pubs/734x1b1.pdf
- Starlink, Satellite Technology: https://www.starlink.com/technology
- Starlink, Network Update: https://www.starlink.com/updates/network-update
- SpaceX, Improving Starlink's Latency: https://api.starlink.com/public-files/StarlinkLatency.pdf
- FCC 21-48, SpaceX Gen1 modification order: https://docs.fcc.gov/public/attachments/FCC-21-48A1.pdf
- FCC 22-91, SpaceX Gen2 order and authorization: https://docs.fcc.gov/public/attachments/FCC-22-91A1.pdf
- FCC, FCC Approves Next-Gen Satellite Constellation (9 Januari 2026): https://docs.fcc.gov/public/attachments/DOC-417881A1.pdf
- SpaceX, narasi permohonan eksperimen terminal pengguna ke FCC: https://apps.fcc.gov/els/GetAtt.html?id=262648&x=
- Mohan dkk., A Multifaceted Look at Starlink Performance (WWW 2024): https://arxiv.org/abs/2310.09242
- Thales Alenia Space, Indonesia's SATRIA communications satellite successfully launched: https://www.thalesaleniaspace.com/en/press-releases/indonesias-satria-communications-satellite-successfully-launched
- Kominfo, majalah KominfoNext Edisi 55 (Juli 2023), liputan SATRIA-1 dan sejarah satelit Indonesia: https://jdih.komdigi.go.id/storage/file-artikel-hukum/1709096783-KOMINFONEXT_EDISI_55_JULI_2023_1_.pdf
- Kominfo, majalah KominfoNext Edisi 61 (Januari 2024), peresmian SATRIA-1 dan gateway Manado: https://jdih.komdigi.go.id/storage/file-artikel-hukum/1729219601-KOMINFONEXT_EDISI_61_JANUARI_2024.pdf
- BPSDM Komdigi, Seremoni pengoperasian SATRIA-1 dan BTS 4G (28 Desember 2023): https://bpsdm.komdigi.go.id/berita-presiden-bersama-menkominfo-kunjungi-sulawesi-utara-dalam-rangka-seremoni-p-19-1667
- NASA, Where is the DSN Located?: https://www.nasa.gov/directorates/somd/space-communications-navigation-program/dsn-complexes/
- NASA, What is the Deep Space Network?: https://www.nasa.gov/directorates/somd/space-communications-navigation-program/what-is-the-deep-space-network/
- NASA JPL, Deep Space Network: https://www.jpl.nasa.gov/missions/dsn/
- NASA, Mars 2020 Perseverance rover components: https://science.nasa.gov/mission/mars-2020-perseverance/rover-components/
- NASA, Delay/Disruption Tolerant Networking Overview: https://www.nasa.gov/technology/space-comms/dtn-overview-benefits-successstories-learningresources/
- NASA, October 2008: Disruption Tolerant Networking Tested on Spacecraft: https://www.nasa.gov/image-article/october-2008-disruption-tolerant-networking-dtn-tested-spacecraft/
- NASA Glenn, High-Rate Delay Tolerant Networking: https://www.nasa.gov/glenn/glenn-expertise-space-exploration/scan/high-rate-delay-tolerant-networking/
- NASA, Laser Communications Relay Demonstration (LCRD) Overview: https://www.nasa.gov/directorates/stmd/tech-demo-missions-program/laser-communications-relay-demonstration-lcrd-overview/
- NASA, NASA's Laser Relay System Sends Pet Imagery to, from Space Station: https://www.nasa.gov/missions/station/nasas-laser-relay-system-sends-pet-imagery-to-from-space-station/
- Ristovski dkk., NASA Delay Tolerant Networks: Operational, Evolving, and Ready for Expansion (SpaceOps 2023): https://ntrs.nasa.gov/citations/20230001324
- Dokumentasi kernel Linux, IP sysctl: https://docs.kernel.org/networking/ip-sysctl.html
- Cisco, Understand the Ping and Traceroute Commands: https://www.cisco.com/c/en/us/support/docs/ios-nx-os-software/ios-software-releases-121-mainline/12778-ping-traceroute.html
- MikroTik, Ping: https://help.mikrotik.com/docs/display/ROS/Ping
- MikroTik, Traceroute: https://help.mikrotik.com/docs/display/ROS/Traceroute
- Halaman manual `mtr(8)`, mtr 0.96

---

**Berikutnya:** `12-keamanan/01-konsep-keamanan`. Memasuki tahap keamanan jaringan.

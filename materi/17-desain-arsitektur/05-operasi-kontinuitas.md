# 17.5 Operasi, Kontinuitas & Manajemen Perubahan

> **Prasyarat:** `17-desain-arsitektur/01-prinsip-desain`, `17-desain-arsitektur/03-perencanaan-dokumentasi`, `14-monitoring-troubleshooting/03-observability`
> **Tujuan:** Anda bisa menghitung dan menetapkan RPO, RTO, dan availability, memilih strategi site dan backup, menjalankan perubahan lewat change management dengan MOP dan rollback, serta mengelola siklus hidup aset sampai decommissioning.

---

## 1. Analogi

Bayangkan sebuah rumah sakit. Ia tidak hanya punya dokter yang pandai, tetapi juga genset, jadwal piket, prosedur evakuasi yang dilatih berkala, aturan siapa boleh mengubah apa di ruang operasi, dan catatan umur setiap alat. Jaringan yang baik sama: desain yang bagus (modul 17.1 sampai 17.4) baru separuh pekerjaan. Separuhnya lagi adalah disiplin operasi: apa yang terjadi saat sesuatu rusak, bagaimana kita pulih, siapa menyetujui perubahan, dan kapan perangkat tua dipensiunkan.

Modul ini diuji di CompTIA Network+ N10-009 pada Domain 3.0 (Network Operations): objektif 3.1 (tujuan proses dan prosedur organisasi: dokumentasi, manajemen siklus hidup, manajemen perubahan, manajemen konfigurasi) dan objektif 3.3 (konsep disaster recovery: RPO, RTO, MTTR, MTBF, site cold/warm/hot, active-active/active-passive, pengujian). Ringkasan objektif diperiksa dari halaman resmi CompTIA (lihat Sumber).

---

## 2. Metrik: RPO, RTO, MTTR, MTBF, MTTF

| Istilah | Arti | Pertanyaan yang dijawab |
|---|---|---|
| **RPO** (Recovery Point Objective) | Batas data yang boleh hilang, diukur sebagai waktu | "Berapa lama data terakhir yang masih boleh hilang?" |
| **RTO** (Recovery Time Objective) | Batas waktu layanan boleh mati sampai pulih | "Seberapa cepat layanan harus hidup lagi?" |
| **MTTR** (Mean Time To Repair/Restore) | Rata-rata waktu dari kerusakan sampai pulih | "Biasanya kita butuh berapa lama memperbaiki?" |
| **MTBF** (Mean Time Between Failures) | Rata-rata waktu antar kegagalan pada sistem yang bisa diperbaiki | "Seberapa sering benda ini rusak?" |
| **MTTF** (Mean Time To Failure) | Rata-rata umur sampai rusak pada komponen yang diganti, bukan diperbaiki | "Berapa lama sampai komponen ini mati?" |

RPO dan RTO adalah **target bisnis** yang ditetapkan lebih dulu. MTTR dan MTBF adalah **ukuran hasil** yang diamati dari riwayat operasi. Target dibandingkan dengan kenyataan: bila RTO bisnis 1 jam tetapi MTTR rata-rata Anda 3 jam, ada celah yang harus ditutup.

**Availability** dihitung dari waktu operasional:

```
Availability = MTBF / (MTBF + MTTR)
```

Contoh: switch dengan MTBF 2000 jam dan MTTR 4 jam. Availability = 2000 / 2004 = 0,998 (99,80%). Memperbaiki MTTR (misalnya menyimpan unit cadangan di lokasi) sering lebih murah daripada memperpanjang MTBF.

**Menerjemahkan persentase ke menit downtime** (satu tahun 8.760 jam, satu bulan 30 hari = 43.200 menit):

| Availability | Downtime per tahun | Downtime per bulan |
|---|---|---|
| 99% | 87,6 jam | 432 menit (7,2 jam) |
| 99,9% | 8,76 jam (525,6 menit) | 43,2 menit |
| 99,99% | 52,56 menit | 4,32 menit |
| 99,999% | 5,26 menit | sekitar 26 detik |

Perhitungan 99,9%: 0,1% x 43.200 menit = 43,2 menit per bulan; 0,1% x 525.600 menit per tahun = 525,6 menit.

**Susunan seri dan paralel.** Komponen yang harus bekerja semua (seri) mengalikan availability: dua perangkat 99,9% berurutan menjadi 0,999 x 0,999 = 99,80%. Komponen redundan (paralel, salah satu cukup) mengalikan *ketidaktersediaannya*: dua perangkat 99,9% paralel menjadi 1 - (0,001 x 0,001) = 99,9999% secara teori. Angka teoretis ini mengabaikan titik kegagalan bersama (listrik yang sama, perangkat lunak yang sama, kesalahan konfigurasi yang tersalin ke kedua perangkat). Karena itu redundansi di modul 17.1 harus disertai pemisahan fault domain.

> [!WARNING]
> RTO dan RPO bukan janji teknologi, melainkan keputusan biaya. RPO nol butuh replikasi sinkron; RTO menit butuh site siaga. Tanyakan bisnisnya dulu, jangan menebak.

---

## 3. Jenis Site Pemulihan

Site pemulihan adalah lokasi cadangan tempat layanan dijalankan bila site utama tidak bisa dipakai.

| Jenis | Kondisi | RTO tipikal | Biaya |
|---|---|---|---|
| **Hot site** | Perangkat dan data selalu hidup dan sinkron; tinggal pindah trafik | menit sampai detik | tertinggi |
| **Warm site** | Perangkat tersedia, data direplikasi berkala dan tertinggal; perlu aktivasi | jam | menengah |
| **Cold site** | Hanya ruang, daya, pendingin, dan konektivitas dasar; perangkat dan data dibawa atau dibeli saat bencana | hari sampai minggu | terendah |

Dua istilah pola layanan yang sering muncul bersama:

- **Active-active:** dua site atau lebih melayani trafik bersamaan; kegagalan satu site hanya mengurangi kapasitas.
- **Active-passive:** satu site melayani, satu siaga; berpindah saat gagal (failover), dan kembali (failback) setelah pulih.

**DR di cloud.** Site pemulihan dapat berupa sumber daya cloud yang disewa. Pola umum: *pilot light* (hanya inti seperti basis data direplikasi, sisanya dinyalakan saat bencana), *warm standby* (versi mengecil yang sudah berjalan), atau hot lewat replikasi penuh. Keunggulannya biaya mengikuti pemakaian; kelemahannya Anda tetap harus menguji failover, konektivitas VPN atau jalur khusus ke cloud, dan batas kuota akun.

> [!TIP]
> Pilih site per layanan, bukan satu untuk semuanya. Layanan pembayaran bisa hot, portal internal cukup warm, arsip cukup cold.

---

## 4. Backup Konfigurasi dan Data

Backup jaringan mencakup dua hal berbeda: **konfigurasi perangkat** (kecil, berubah sering, sangat bernilai) dan **data** (besar, di server dan basis data).

**Jenis backup data:**

| Jenis | Isi | Kelebihan | Kekurangan |
|---|---|---|---|
| **Full** | Semua data | Restore paling sederhana | Paling besar dan lama |
| **Incremental** | Perubahan sejak backup APA PUN terakhir | Backup tercepat dan hemat ruang | Restore butuh full + seluruh rantai incremental |
| **Differential** | Perubahan sejak backup FULL terakhir | Restore butuh full + satu differential | Ukuran membengkak sepanjang pekan |
| **Snapshot** | Keadaan titik waktu pada penyimpanan atau VM | Sangat cepat dibuat dan dikembalikan | Biasanya bukan backup sungguhan bila tersimpan di perangkat yang sama |

Contoh hitung: full 500 GB tiap Minggu, perubahan 20 GB per hari. Untuk memulihkan data Rabu malam: incremental butuh full + 3 set (Senin, Selasa, Rabu) = 500 + 60 GB dalam empat langkah; differential butuh full + set Rabu (60 GB) = 560 GB dalam dua langkah. Total yang dipindahkan sama, tetapi differential punya lebih sedikit titik kegagalan saat restore.

**Aturan 3-2-1:** simpan **3** salinan data (1 utama + 2 cadangan), pada **2** jenis media berbeda, dengan **1** salinan di luar lokasi (offsite). Panduan CISA memuat aturan ini. Varian modern menambah salinan imutabel atau offline untuk menghadapi ransomware.

**Backup konfigurasi perangkat jaringan:**
- Simpan konfigurasi sebelum dan sesudah setiap perubahan, dengan tanggal dan nomor tiket.
- Otomatiskan: tarik konfigurasi berkala lewat SSH atau API ke repositori Git (lihat `15-otomasi/04-ansible-cicd`), lalu bandingkan perbedaannya.
- Backup berisi rahasia (kata sandi, kunci). Enkripsi dan batasi aksesnya.
- **Backup yang belum pernah diuji restore belum bisa disebut backup.**

---

## 5. Uji DR dan Tabletop

Rencana DR yang tidak pernah dilatih akan gagal pada saat paling buruk. Tingkat pengujian dari yang paling ringan:

1. **Walkthrough / review dokumen:** tim membaca rencana dan mencari langkah yang usang.
2. **Tabletop exercise:** tim berkumpul di ruang rapat dan membahas skenario ("kedua link ke DC utama putus dan listrik padam") sambil menjawab: siapa yang dipanggil, keputusan apa, dokumen apa dipakai. Tanpa menyentuh sistem produksi, murah, dan efektif membongkar asumsi.
3. **Uji simulasi / parsial:** memulihkan satu layanan ke site siaga atau lingkungan uji.
4. **Failover penuh:** memindahkan produksi sungguhan ke site DR, lalu kembali. Paling realistis dan paling berisiko, dijadwalkan di maintenance window.

Hasil uji dicatat terhadap target: apakah RTO dan RPO tercapai? Temuan menjadi tindakan perbaikan bertenggat. Kontak darurat, kredensial break-glass, dan konfigurasi cadangan harus bisa diakses **tanpa** bergantung pada jaringan yang sedang mati (salinan offline atau luar jalur).

---

## 6. Manajemen Perubahan

Sebagian besar gangguan jaringan berasal dari perubahan yang kita buat sendiri. Change management mengurangi risiko itu dengan proses yang tertulis.

Siklus dasar: **change request (RFC)** berisi tujuan, alasan, sistem terdampak, rencana, rencana rollback, penilaian risiko, dan jadwal; lalu penilaian dan persetujuan; penjadwalan; eksekusi; verifikasi; penutupan dan review.

**Change Advisory Board (CAB)** adalah kelompok lintas fungsi (jaringan, keamanan, aplikasi, bisnis) yang menilai perubahan berisiko lebih tinggi, melihat bentrokan jadwal, dan menyetujui atau menolak.

Tiga jenis perubahan dalam praktik ITIL:

| Jenis | Ciri | Persetujuan |
|---|---|---|
| **Standard** | Risiko rendah, sering, prosedurnya baku (misalnya menambah port akses ke VLAN yang sudah ada) | Pra-disetujui, cukup dicatat |
| **Normal** | Perubahan terencana di luar kategori standard (misalnya mengganti core switch, migrasi OSPF area) | Melalui penilaian dan CAB |
| **Emergency** | Perbaikan mendesak insiden besar | Jalur cepat oleh otoritas darurat (ECAB), review dilengkapi sesudahnya |

> [!WARNING]
> Emergency change bukan jalan pintas untuk perubahan yang lupa dijadwalkan. Bila terlalu sering muncul, itu gejala perencanaan yang buruk, dan setiap emergency change tetap harus direview sesudahnya.

Terkait **configuration management** (Network+ 3.1): jaga **konfigurasi produksi**, **konfigurasi backup**, dan **konfigurasi baseline** (acuan standar yang disetujui) tetap terdokumentasi, sehingga penyimpangan (configuration drift) terdeteksi.

---

## 7. MOP dan Maintenance Window

**MOP (Method of Procedure)** adalah skrip langkah demi langkah untuk satu perubahan, ditulis cukup rinci sehingga rekan lain dapat mengeksekusinya. Isi minimal:

1. **Tujuan, lingkup, dan orang yang terlibat** (pelaksana, penonton, kontak eskalasi).
2. **Pre-check:** keadaan sebelum perubahan yang dicatat sebagai pembanding: `show` untuk neighbor, rute, interface, dan jumlah MAC; konfirmasi backup konfigurasi sudah dibuat; akses out-of-band berfungsi.
3. **Langkah eksekusi** bernomor, dengan perintah persis dan hasil yang diharapkan di tiap langkah.
4. **Post-check:** perintah verifikasi yang sama dengan pre-check, ditambah uji layanan (ping, aplikasi) dan pemantauan.
5. **Rollback:** langkah persis untuk kembali ke keadaan semula, **kriteria putus** ("bila post-check gagal atau waktu melewati pukul 02.00, rollback"), dan perkiraan waktu rollback.

**Maintenance window** adalah jadwal yang disepakati untuk perubahan berdampak, biasanya di jam sepi. Praktik baik: umumkan ke pemangku kepentingan, batasi durasi, dan sisakan waktu cadangan untuk rollback di akhir window (jangan mulai langkah berisiko di menit terakhir). Pantau juga trafik sungguhan, karena "jam sepi" menurut kalender belum tentu sepi menurut grafik.

> [!TIP]
> Uji MOP lebih dulu di lab atau perangkat virtual (lihat `lab/00-setup-lab`). MOP yang baru dibaca pertama kali pada malam eksekusi biasanya salah.

---

## 8. Siklus Hidup Aset

Aset jaringan melewati tahap: **perencanaan dan pengadaan, penerapan, operasi dan pemeliharaan, penggantian, lalu penghapusan**.

- **Inventaris aset:** daftar perangkat berisi model, nomor seri, lokasi, versi perangkat lunak, pemilik, tanggal beli, masa garansi, dan kontrak dukungan. Tanpa inventaris, Anda tidak tahu apa yang terdampak saat sebuah kerentanan diumumkan.
- **EOL (End of Life) / EOS (End of Sale):** pabrikan berhenti menjual produk (EOS), dan kemudian berhenti mendukung penuh (EOL / end of support). Istilah dan tanggal persisnya berbeda per vendor, jadi baca pengumuman vendor.
- **EoSW (End of Software Maintenance / Support):** perangkat lunak tidak lagi menerima perbaikan bug dan patch keamanan. Perangkat yang masih berfungsi tetapi melewati tanggal ini menjadi risiko keamanan.
- **Manajemen perangkat lunak dan patch:** jadwalkan pembaruan firmware, uji dulu di lab, lalu terapkan lewat change management.
- **Decommissioning aman:** hapus dari monitoring, inventaris, dan IPAM; cabut rute dan ACL yang merujuknya; **hapus data dan kredensial** (reset ke pabrik, hapus kunci, sanitasi media penyimpan); cabut sertifikat dan akun; catat pemusnahan atau penjualan.

> [!WARNING]
> Perangkat bekas dengan konfigurasi utuh membocorkan topologi, kata sandi, dan kunci VPN. Anggap setiap konfigurasi sebagai data sensitif sampai terbukti dihapus.

Rencanakan penggantian sebelum EoSW, terutama pada anggaran tahunan.

---

## 9. SLI, SLO dan Postmortem

- **SLI (Service Level Indicator):** ukuran terukur kesehatan layanan, misalnya persentase paket sukses, latensi p95, atau ketersediaan jalur.
- **SLO (Service Level Objective):** target internal untuk SLI itu, misalnya "ketersediaan jalur 99,95% per bulan".
- **SLA (Service Level Agreement):** kontrak dengan pelanggan, biasanya dengan kompensasi bila dilanggar. SLO sebaiknya lebih ketat daripada SLA.
- **Error budget:** sisa "kegagalan yang dibolehkan". SLO 99,95% per bulan berarti anggaran downtime sekitar 21,6 menit (0,05% x 43.200). Anggaran yang hampir habis berarti perubahan berisiko perlu ditunda.

Hubungannya dengan modul ini: SLO menentukan seberapa ketat RTO, desain redundansi, dan jumlah perubahan yang aman per bulan; SLI datang dari monitoring (`14-monitoring-troubleshooting/03-observability`).

**Postmortem tanpa menyalahkan (blameless).** Setelah insiden, tim menulis kronologi, dampak, akar masalah, faktor yang berkontribusi, dan tindakan perbaikan bertenggat. Prinsipnya: asumsikan semua orang bertindak dengan niat baik berdasarkan informasi yang mereka punya, dan cari kelemahan sistem dan proses, bukan orang yang salah. Kalau orang takut dihukum, mereka menyembunyikan kesalahan, dan organisasi kehilangan pelajaran.

---

## 10. Praktik Tiga Platform

Tujuan praktik: setiap perubahan punya **backup sebelum**, **jaring pengaman otomatis** bila akses terputus, dan **cara kembali** yang diuji.

### Cisco IOS / IOS XE

```
! Simpan salinan sebelum ubah
copy running-config flash:pra-perubahan.cfg

! Aktifkan archive: simpan versi tiap kali write memory
configure terminal
 archive
  path flash:cfg-
  maximum 10
  write-memory
 end

! Lihat perbedaan terhadap salinan
show archive config differences flash:pra-perubahan.cfg system:running-config
```

Pengembalian dengan `configure replace` menghitung selisih dan hanya menerapkan perbedaannya, tanpa reload:

```
! Terapkan salinan lama, batalkan otomatis bila tidak dikonfirmasi 5 menit
configure replace flash:pra-perubahan.cfg force time 5
! Bila akses masih normal:
configure confirm
```

Jaring pengaman klasik yang bekerja di semua IOS: jadwalkan reload sebelum mengubah, lalu batalkan bila berhasil.

```
reload in 10
! ...lakukan perubahan, verifikasi akses...
reload cancel
```

Reload hanya memulihkan keadaan *startup-config*, jadi **jangan** `write memory` sebelum perubahan terbukti baik. Di IOS XR dan Junos tersedia `commit confirmed` (rollback otomatis bila `commit` konfirmasi tidak diberikan dalam batas waktu), padanan terbaik dari konsep yang sama.

### MikroTik RouterOS v7

```
# Backup biner (utuh, tetapi terkait perangkat/versi; beri kata sandi)
/system backup save name=pra-perubahan password=GantiIni
# Ekspor teks (dapat dibaca, dibandingkan dengan diff, portabel)
/export file=pra-perubahan
# Pengembalian
/system backup load name=pra-perubahan
/import file-name=pra-perubahan.rsc
```

Backup biner paling lengkap, tetapi pulih ke perangkat dan versi yang sama. `/export` berupa skrip teks yang bisa disimpan di Git dan dibandingkan; di v7 data sensitif disembunyikan secara bawaan, jadi simpan ekspor itu bersama backup biner untuk kasus pemulihan penuh. Unduh keduanya dari router ke tempat lain (aturan 3-2-1), jangan hanya membiarkannya di flash perangkat.

**Safe mode** adalah jaring pengaman bawaan: tekan `F4` atau `Ctrl+X` di CLI (prompt berubah menjadi `<SAFE>`). Semua perubahan selama safe mode otomatis dibatalkan bila sesi terputus tidak normal (kabel tercabut, salah ubah IP manajemen). `Ctrl+D` keluar dan membatalkan semua perubahan, sedangkan `/quit` keluar dengan menyimpan perubahan. Riwayatnya terbatas sekitar 100 aksi; bila terlampaui, safe mode keluar tanpa membatalkan.

### Linux

```bash
# /etc di bawah kendali versi
sudo apt install etckeeper          # Debian/Ubuntu; pakai dnf di Fedora
sudo etckeeper init                 # bila belum otomatis
sudo etckeeper commit "sebelum ubah netplan"
sudo etckeeper vcs diff
sudo etckeeper vcs log --oneline

# Alternatif tanpa alat khusus
cd /etc && sudo git init && sudo git add -A && sudo git commit -m "baseline"
```

Etckeeper menyimpan `/etc` di Git (juga mendukung mercurial, bazaar, darcs), mencatat metadata seperti izin file, dan otomatis membuat commit saat paket dipasang atau diperbarui lewat manajer paket seperti apt.

Untuk perubahan jaringan jarak jauh di Ubuntu/Debian dengan Netplan:

```bash
sudo netplan try        # terapkan; rollback otomatis setelah 120 detik tanpa konfirmasi
sudo netplan try --timeout 60
```

Tekan Enter untuk mengonfirmasi bila koneksi masih hidup; bila SSH Anda putus, konfigurasi kembali sendiri. Untuk NetworkManager (`nmcli`) tidak ada `try` bawaan yang saya verifikasi, jadi buat sendiri: salin berkas profil, jadwalkan skrip rollback, lalu batalkan penjadwalnya setelah berhasil.

```bash
sudo cp -a /etc/NetworkManager/system-connections /root/nm-backup
sudo systemd-run --on-active=5m --unit=rollback-net /usr/local/sbin/rollback-net.sh
# ...nmcli connection modify ... ; nmcli connection up ...
sudo systemctl stop rollback-net.timer     # tanda berhasil, batalkan rollback
```

(`rollback-net.sh` adalah skrip buatan Anda yang menyalin kembali profil dan menjalankan `nmcli connection reload`.)

---

## 11. Kesalahan Umum

> [!CAUTION]
> **Backup yang tidak pernah diuji restore.** Berkas ada, tetapi tidak bisa dipulihkan, atau terenkripsi dengan kunci yang hilang.

> [!CAUTION]
> **Semua salinan di satu tempat.** Backup di flash perangkat yang sama dengan konfigurasinya hilang bersama perangkat; melanggar 3-2-1.

> [!CAUTION]
> **Mencampur RPO/RTO dengan MTTR/MTBF.** Yang pertama target bisnis, yang kedua ukuran hasil.

> [!CAUTION]
> **Perubahan tanpa rollback atau tanpa jaring pengaman** pada akses jarak jauh: salah ubah IP manajemen lalu terkunci.

> [!CAUTION]
> **Menyimpan `write memory` sebelum perubahan terbukti,** sehingga `reload in` tidak lagi menyelamatkan.

> [!CAUTION]
> **Menjadikan emergency change sebagai kebiasaan,** melewati CAB tanpa review sesudahnya.

> [!CAUTION]
> **Redundansi di atas kertas.** Dua perangkat redundan yang berbagi satu catu daya, satu rak, atau satu konfigurasi yang tersalin salah tetap satu titik kegagalan.

> [!CAUTION]
> **Postmortem untuk mencari kambing hitam,** sehingga insiden berikutnya disembunyikan.

> [!TIP]
> Benar: backup sebelum, jaring pengaman otomatis, kriteria rollback tertulis, pre/post-check yang sama, dan review sesudahnya.

---

## 12. Ringkasan

- RPO = batas data yang boleh hilang; RTO = batas waktu mati; MTTR = rata-rata waktu perbaikan; MTBF = rata-rata waktu antar kegagalan; MTTF = umur rata-rata komponen yang diganti.
- Availability = MTBF / (MTBF + MTTR). 99,9% = 43,2 menit per bulan (30 hari), 8,76 jam per tahun.
- Hot site siap menit, warm siap jam, cold siap hari. Cloud menyewa sumber daya saat dibutuhkan.
- Full, incremental (sejak backup terakhir), differential (sejak full terakhir), snapshot. Aturan 3-2-1: 3 salinan, 2 media, 1 offsite.
- Latih rencana: tabletop sampai failover penuh.
- Perubahan: RFC, penilaian, CAB, jadwal, eksekusi, verifikasi. Jenisnya standard, normal, emergency.
- MOP berisi pre-check, langkah, post-check, dan rollback dengan kriteria putus.
- Aset: inventaris, EOS/EOL/EoSW, decommissioning aman dengan penghapusan data.
- SLI/SLO memberi target terukur; postmortem tanpa menyalahkan mengubah insiden menjadi pelajaran.
- Cisco: `archive`, `configure replace ... time`, `configure confirm`, `reload in`. MikroTik: `/system backup`, `/export`, safe mode. Linux: etckeeper/Git, `netplan try`.

---

## 13. Latihan

1. Jelaskan perbedaan RPO dan RTO, dan sebutkan mana yang berkaitan dengan frekuensi backup.
2. Hitung downtime maksimum per bulan (30 hari) untuk availability 99,9% dan 99,99%.
3. Sebuah router punya MTBF 4000 jam dan MTTR 8 jam. Berapa availability-nya (dua desimal persen)?
4. Dua firewall masing-masing 99,9% dipasang paralel (active-passive ideal). Berapa availability teoretisnya, dan mengapa angka itu sering tidak tercapai?
5. Perusahaan membutuhkan RTO 30 menit untuk layanan pembayaran dan 3 hari untuk arsip. Jenis site apa yang cocok untuk masing-masing?
6. Full backup hari Minggu 400 GB, perubahan 10 GB per hari. Data Kamis harus dipulihkan. Berapa set backup yang dibutuhkan dengan incremental dan dengan differential, dan berapa GB total masing-masing (di luar full)?
7. Sebutkan isi minimal MOP dan jenis perubahan yang melewati CAB.
8. Anda akan mengubah IP manajemen router Cisco lewat SSH. Susun jaring pengaman dengan `reload in`, dan jelaskan satu hal yang tidak boleh dilakukan sebelum perubahan terbukti.

<details>
<summary>Jawaban</summary>

1. RPO adalah jumlah data (dalam waktu) yang boleh hilang; RTO adalah lamanya layanan boleh mati sampai pulih. RPO yang berkaitan dengan frekuensi backup atau replikasi: RPO 1 jam berarti backup atau replikasi minimal tiap jam.
2. 99,9%: 0,1% x 43.200 menit = 43,2 menit. 99,99%: 0,01% x 43.200 = 4,32 menit.
3. 4000 / (4000 + 8) = 4000 / 4008 = 0,99800, jadi sekitar 99,80%.
4. 1 - (0,001 x 0,001) = 0,999999, yaitu 99,9999%. Tidak tercapai karena ada titik kegagalan bersama (catu daya, rak, perangkat lunak atau konfigurasi yang sama), waktu failover, dan kegagalan pada mekanisme failover itu sendiri.
5. Pembayaran: hot site (atau active-active); RTO 30 menit tidak mungkin dengan warm yang butuh aktivasi jam-an. Arsip: cold site (atau DR cloud berbiaya rendah), karena 3 hari cukup untuk menyiapkan.
6. Incremental: 4 set (Senin, Selasa, Rabu, Kamis) = 40 GB di luar full, lima langkah restore termasuk full. Differential: 1 set (Kamis, 40 GB kumulatif) = 40 GB di luar full, dua langkah. Total GB yang dipindahkan sama, tetapi differential punya langkah restore lebih sedikit.
7. MOP: tujuan dan lingkup, pre-check, langkah eksekusi bernomor dengan hasil yang diharapkan, post-check, rollback dengan kriteria putus dan perkiraan waktu. Perubahan normal (dan perubahan standard hanya bila tidak pra-disetujui) melewati penilaian dan CAB; emergency memakai ECAB dengan review sesudahnya.
8. Jalankan `reload in 10` (misalnya), lakukan perubahan dan verifikasi akses dari IP baru, lalu `reload cancel`. Jangan `write memory` sebelum terbukti baik, karena reload akan memuat startup-config yang sudah berisi perubahan salah.

</details>

---

## 14. Sumber

- CompTIA Network+ (N10-009), halaman sertifikasi dan ringkasan Domain 3.0: https://www.comptia.org/en-us/certifications/network/
- CISA, Data Backup Options (aturan 3-2-1): https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf
- MikroTik, dokumentasi Safe Mode, export, dan backup: https://help.mikrotik.com/docs/spaces/ROS/pages/328155/Configuration+Management
- Cisco, Configuration Replace and Rollback (IOS XE 16): https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/config-mgmt/configuration/xe-16/config-mgmt-xe-16-book/cm-config-rollback.html
- Netplan, netplan try: https://netplan.readthedocs.io/en/stable/netplan-try/
- etckeeper: https://etckeeper.branchable.com/
- Google SRE Book, Postmortem Culture: https://sre.google/sre-book/postmortem-culture/

---

**Berikutnya:** `18-karier-sertifikasi/01-peta-sertifikasi`. Memetakan jalur karier dan sertifikasi jaringan.

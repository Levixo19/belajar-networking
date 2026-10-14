# 21.4 — Rumpun Administrasi Sistem & Data

> **Prasyarat:** sudah membaca `21-ekosistem-profesi/01-peta-ekosistem`, memahami layanan dasar (`06-aplikasi/01-dns`, `06-aplikasi/02-dhcp`, `06-aplikasi/05-layanan-lain`), Linux networking (`13-linux-networking/01-iproute2`, `13-linux-networking/04-layanan-jaringan-linux`), serta jaringan storage dan virtualisasi (`16-datacenter-cloud-sdn/03-storage-virtualisasi`).
> **Tujuan:** Anda mengenal lima profesi yang menjaga server, data, dan operasional TI sehari-hari (system administrator, database administrator, storage administrator, system engineer, IT operations manager): apa yang mereka kerjakan, bagaimana keberhasilannya diukur, sertifikasi yang masih berlaku per 2026, jalur masuk di Indonesia, dan modul kurikulum yang paling penting untuk masing-masing.

---

## 1. Peta Rumpun: Lapisan Tepat di Atas Jaringan

Jaringan adalah jalan. Rumpun ini mengurus apa yang ada di ujung jalan itu: server yang menjawab permintaan, database yang menyimpan saldo nasabah, larik storage yang menampung jutaan berkas, dan orang yang memastikan semuanya tetap berjalan ketika ada yang rusak pada pukul dua pagi.

Bagi orang jaringan, rumpun ini adalah tetangga terdekat. Banyak tiket "jaringan lambat" berakhir di sini: DNS internal yang salah, DHCP scope yang habis, query tanpa indeks, atau volume storage yang penuh. Sebaliknya, banyak masalah "server lambat" ternyata MTU yang tidak cocok di jalur iSCSI atau firewall yang memutus sesi TCP panjang ke database. Mengenal rumpun ini mempercepat pencarian akar masalah dan membuka pintu karier yang dekat dengan keahlian Anda.

| Profesi | Fokus utama | Jenjang masuk realistis | Sertifikasi kunci (2026) | Tempat kerja khas di Indonesia |
|---|---|---|---|---|
| System Administrator | Server Linux/Windows, akun, patch, backup, layanan dasar | Pemula | RHCSA (EX200), LFCS, Linux+ XK0-006, AZ-802 | Hampir semua organisasi: bank, BUMN, pabrik, kampus, pemerintah, managed service provider |
| Database Administrator (DBA) | Ketersediaan, kinerja, keamanan, dan pemulihan database | Menengah | Oracle 1Z0-182/1Z0-183, DP-300, EDB PostgreSQL, MongoDB Associate DBA | Bank, asuransi, fintech, e-commerce, telko, perusahaan dengan ERP |
| Storage Administrator | SAN/NAS, kapasitas, replikasi, backup dan pemulihan | Menengah | NetApp NCDA, Dell D-ISM-FN-02, VCAP-VCF Storage | Bank, operator, penyedia colocation dan cloud lokal, system integrator |
| System Engineer | Merancang dan membangun platform server, virtualisasi, otomasi | Menengah | RHCE, VCP-VCF Administrator (2V0-17.25), AZ-104 | System integrator, distributor dan vendor, bank, startup, penyedia cloud |
| IT Operations Manager | Layanan TI berjalan sesuai SLA, tim, proses, anggaran | Senior | ITIL Foundation (Version 5) lalu ITIL Practice Manager | Bank, BUMN, perusahaan multinasional, managed service provider, pemerintah |

💡 **Baca tabel ini sebagai tangga.** Jalan yang paling sering terlihat di Indonesia: masuk sebagai system administrator (sering dengan judul "IT Support" atau "IT Infrastructure Staff"), lalu memilih spesialisasi (database, storage, atau virtualisasi sebagai system engineer), dan setelah beberapa tahun memimpin tim menjadi IT operations manager. Network administrator bisa masuk di tengah tangga, karena separuh pekerjaan sysadmin adalah layanan jaringan.

⚠️ **Judul di lowongan Indonesia sangat cair.** "System Engineer" di system integrator sering berarti engineer implementasi yang ke lokasi klien, sementara "System Engineer" di bank bisa berarti sysadmin senior. "IT Infrastructure Staff" di perusahaan manufaktur biasanya mencakup jaringan, server, backup, sekaligus printer. Baca daftar tugasnya, bukan judulnya.

---

## 2. Bahasa Bersama Rumpun Ini

Kelima profesi ini memakai kosakata yang sama. Kuasai dulu bagian ini, karena pertanyaan wawancara di rumpun ini hampir selalu menyinggungnya.

### 2.1 SLA, SLO, SLI, dan angka "sembilan"

Buku *Site Reliability Engineering* dari Google membedakan tiga istilah yang sering dicampuradukkan:

- **SLI** (*service level indicator*): ukuran kuantitatif dari satu aspek layanan, misalnya persentase permintaan login yang sukses, atau latensi query ke database pada persentil ke-99.
- **SLO** (*service level objective*): nilai target untuk SLI itu, misalnya "99,9% login sukses dalam 30 hari".
- **SLA** (*service level agreement*): kontrak dengan pengguna atau pelanggan yang memuat SLO beserta konsekuensinya bila tidak tercapai, misalnya potongan biaya.

Hitungan downtime yang wajib Anda hafal (dalam setahun, 8.760 jam):

```
99%     → sekitar 87,6 jam  (± 3,65 hari)
99,9%   → sekitar 8,76 jam
99,95%  → sekitar 4,38 jam
99,99%  → sekitar 52,6 menit
```

Setiap tambahan satu angka sembilan biasanya berarti biaya redundansi yang jauh lebih besar: server cadangan, storage yang direplikasi, jalur jaringan kedua, dan orang yang siaga.

### 2.2 RPO, RTO, dan MTTR

- **RPO** (*recovery point objective*): berapa banyak data yang boleh hilang, diukur dalam waktu. RPO 15 menit berarti setelah bencana Anda harus bisa memulihkan data sampai paling lama 15 menit sebelum kejadian.
- **RTO** (*recovery time objective*): berapa lama layanan boleh mati sampai pulih.
- **MTTR** (*mean time to restore/recover*): rata-rata waktu dari gangguan terjadi sampai layanan kembali normal. Ini KPI operasional paling umum di rumpun ini.

RPO menentukan teknologi: backup harian hanya memberi RPO sampai 24 jam, sedangkan RPO mendekati nol menuntut replikasi sinkron, yang pada gilirannya menuntut latensi jaringan antar-lokasi yang sangat kecil. Di sinilah DBA, storage administrator, dan network engineer harus duduk satu meja.

### 2.3 Backup 3-2-1 dan pelajaran dari PDNS 2

Aturan 3-2-1 yang dipopulerkan dalam panduan CISA (badan keamanan siber AS) berbunyi: simpan **3** salinan data penting (satu utama dan dua cadangan), di **2** jenis media berbeda, dan **1** salinan di luar lokasi. Praktik modern menambahkan salinan yang tidak bisa diubah (*immutable*) atau terputus dari jaringan (*air-gapped*), karena ransomware kini sengaja mencari dan mengenkripsi server backup terlebih dahulu.

Indonesia punya contoh yang mahal. Pada Juni 2024, Pusat Data Nasional Sementara (PDNS) 2 di Surabaya terkena ransomware Brain Cipher. Menurut kronologi Menkominfo, gangguan terdeteksi sejak 17 Juni 2024, pelaku meminta tebusan USD 8 juta, dan 239 instansi terdampak (30 kementerian/lembaga, 15 provinsi, 148 kabupaten, 48 kota). Sesudahnya, BSSN dan DPR menyoroti bahwa sebagian besar data di PDNS 2 tidak memiliki cadangan, sehingga pemulihan berlangsung lama. Pelajarannya: backup yang tidak pernah diuji pemulihannya dan tidak terpisah dari jaringan produksi bukanlah backup.

⚠️ **Backup yang benar diukur dari restore, bukan dari laporan "job sukses".** Jadwalkan uji pemulihan berkala, catat berapa lama restore berjalan, dan bandingkan dengan RTO yang dijanjikan.

### 2.4 Change management

Banyak gangguan besar dipicu oleh perubahan: patch, konfigurasi, migrasi. Organisasi matang memakai proses perubahan (dalam ITIL disebut *change enablement*): setiap perubahan punya analisis dampak, rencana uji, rencana rollback, jendela waktu, dan persetujuan. Perubahan rutin berisiko rendah menjadi *standard change* yang disetujui di muka; perubahan besar dibahas di rapat CAB (*change advisory board*). Kebiasaan menulis rencana rollback sebelum menyentuh produksi adalah cara tercepat membangun kepercayaan atasan.

### 2.5 Regulasi penempatan data di Indonesia

Dua aturan ini sering muncul di proyek server, database, dan storage:

- **PP 71 Tahun 2019** tentang Penyelenggaraan Sistem dan Transaksi Elektronik. Pasal 20 mewajibkan Penyelenggara Sistem Elektronik (PSE) **Lingkup Publik** (instansi pemerintah dan yang ditunjuk) mengelola, memproses, dan/atau menyimpan sistem dan data elektroniknya di wilayah Indonesia, kecuali bila teknologi penyimpanannya tidak tersedia di dalam negeri. Pasal yang sama mewajibkan rencana keberlangsungan kegiatan. Pasal 21 membolehkan PSE **Lingkup Privat** menyimpan di dalam atau di luar negeri, dengan kewajiban memberi akses untuk pengawasan dan penegakan hukum, sementara untuk sektor keuangan diatur lebih lanjut oleh otoritasnya.
- **POJK 11/POJK.03/2022** tentang Penyelenggaraan Teknologi Informasi oleh Bank Umum. Pasal 35 mewajibkan bank menempatkan sistem elektronik pada pusat data dan pusat pemulihan bencana (DRC) di wilayah Indonesia; penempatan di luar negeri hanya dengan izin OJK dan untuk kriteria tertentu. Pasal 18 mewajibkan bank memiliki rencana pemulihan bencana, mengujinya terhadap seluruh aplikasi dan infrastruktur kritikal paling sedikit sekali setahun dengan melibatkan pengguna, dan mengkaji ulangnya paling sedikit sekali setahun.

Dampaknya nyata: bank dan instansi pemerintah membutuhkan sysadmin, DBA, dan storage administrator yang paham replikasi antar-DC di dalam negeri, latensi antar-kota, dan dokumentasi uji DRP yang siap diperiksa auditor.

---

## 3. System Administrator

### 3.1 Apa yang sebenarnya dikerjakan

System administrator (sysadmin) menjaga server dan layanan dasar tetap hidup, aman, dan terdokumentasi. Ia adalah orang pertama yang dicari ketika "tidak bisa login", "share folder hilang", atau "email tidak terkirim".

Contoh satu hari di kantor pusat sebuah perusahaan distribusi di Jakarta dengan 40 cabang:

- **07.45**: membaca laporan backup semalam. Dua job gagal karena disk target hampir penuh. Ia memperluas volume dan menjalankan ulang job secara manual.
- **09.00**: tiket dari cabang Makassar: komputer baru tidak mendapat IP. Ternyata scope DHCP cabang itu (`/26`) sudah habis karena banyak ponsel karyawan tersambung ke Wi-Fi kantor. Ia memperpendek lease time dan mengusulkan VLAN tamu terpisah ke tim jaringan.
- **10.30**: memproses akun tiga karyawan baru di Active Directory, memasukkan ke grup yang tepat, dan mencabut akses dua orang yang resign kemarin.
- **15.30**: aplikasi ERP lambat. Dengan `top`, `iostat`, dan `ss` ia melihat server aplikasi menunggu koneksi ke database. Ia meneruskan bukti ke DBA, bukan menebak.

### 3.2 Tanggung jawab dan ukuran keberhasilan

- Menginstal, mengonfigurasi, dan menambal (*patch*) sistem operasi server Linux dan Windows.
- Mengelola identitas dan akses: akun, grup, kebijakan kata sandi, akses SSH berbasis kunci.
- Menjalankan layanan infrastruktur: DNS internal, DHCP, NTP, file server, print server, kadang email.
- Menjalankan backup dan menguji restore.
- Memantau kapasitas dan kesehatan server.

O*NET (basis data okupasi Departemen Tenaga Kerja AS) memasukkan peran ini ke kode 15-1244 *Network and Computer Systems Administrators*, yang menggabungkan admin jaringan dan admin sistem dalam satu okupasi, persis seperti di banyak perusahaan menengah di Indonesia.

**Ukuran keberhasilan yang umum:** persentase server dengan patch terbaru (misalnya target 95% dalam 30 hari sejak rilis), tingkat keberhasilan backup dan hasil uji restore, uptime layanan inti, waktu penyelesaian tiket (MTTR), dan jumlah insiden berulang yang akarnya sudah diperbaiki.

### 3.3 Keahlian dan alat

**Teknis:** Linux (systemd, manajemen paket, LVM, izin berkas, SELinux), Windows Server (Active Directory, Group Policy, DNS, DHCP, file server), skrip Bash dan PowerShell, dasar Python, virtualisasi dasar, backup, dan tentu saja jaringan: IP, subnetting, DNS, DHCP, firewall host.

**Non-teknis:** menulis prosedur yang bisa diikuti orang lain, menjelaskan masalah teknis ke pengguna tanpa merendahkan, disiplin mencatat perubahan, dan tenang saat banyak orang menunggu.

**Alat yang umum:** Red Hat Enterprise Linux dan turunannya, Ubuntu Server, Windows Server dengan Active Directory dan Windows Admin Center, PowerShell, Ansible, Zabbix atau Prometheus dengan Grafana, Veeam Backup & Replication, VMware vSphere atau Proxmox VE, serta sistem tiket seperti GLPI atau Jira Service Management.

### 3.4 Sertifikasi per jenjang

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | **LPIC-1** (101-500 dan 102-500, versi 5.0) | Pilihan teori yang luas dan netral distribusi |
| Pemula | **CompTIA Linux+ (XK0-006)** | Diluncurkan 15 Juli 2025; 90 menit, campuran pilihan ganda dan soal berbasis kinerja |
| Pemula sampai menengah | **LFCS** (Linux Foundation Certified System Administrator) | Ujian praktik di baris perintah selama 2 jam; domain Operations Deployment 25%, Networking 25%, Storage 20%, Essential Commands 20%, Users and Groups 10%; berlaku 2 tahun |
| Pemula sampai menengah | **RHCSA (EX200)** | Ujian praktik, kini berbasis RHEL 10; prasyarat untuk jalur RHCE |
| Menengah | **Microsoft Certified: Windows Server Administrator Associate (AZ-802)** | AZ-800 dan AZ-801 pensiun 30 September 2026 dan diganti satu ujian AZ-802 "Administering Windows Server" |
| Menengah | **CompTIA Server+ (SK0-005)** | Netral vendor, fokus perangkat keras dan operasi server |
| Menengah | **RHCE** | Sejak restrukturisasi Red Hat 2026 ada dua jalur: RHCE in Enterprise Linux (EX200 + EX342) dan RHCE in Ansible (EX200 + EX294) |

⚠️ **Perhatikan perubahan jalur Microsoft.** Banyak materi kursus di internet masih menyebut "Windows Server Hybrid Administrator Associate (AZ-800 + AZ-801)". Per Oktober 2026 halaman resmi Microsoft Learn menyatakan kedua ujian itu sudah pensiun pada 30 September 2026, dan nama sertifikasinya kini **Windows Server Administrator Associate** dengan satu ujian **AZ-802**. Cakupannya: AD DS, manajemen hybrid (Azure Arc), mesin virtual Hyper-V, jaringan on-premises dan hybrid, storage dan file services, keamanan, serta monitoring.

**Jalur Indonesia:** SKKNI Bidang Administrasi Sistem ditetapkan lewat Kepmenaker Nomor 82 Tahun 2017. Unit-unitnya berkode `J.63SAM00` (25 unit, mulai dari mengumpulkan kebutuhan pengguna, merancang arsitektur dan keamanan server, menginstal sistem operasi dan layanan jaringan, sampai memantau dan memulihkan sistem). LSP berlisensi BNSP, misalnya LSP TIK Indonesia, menawarkan skema "System Administrator" berbasis unit-unit itu. Sertifikat BNSP berguna terutama untuk tender pemerintah dan BUMN yang mensyaratkan tenaga ahli bersertifikat kompetensi.

### 3.5 Jalur masuk dan progresi

Jalur masuk paling umum: lulusan SMK TKJ, D3, atau S1 informatika masuk sebagai IT support atau helpdesk, lalu dipercaya memegang server dalam 1 sampai 2 tahun. Magang di managed service provider atau system integrator juga mempercepat, karena Anda melihat banyak lingkungan klien sekaligus.

**Dari network administrator:** ini perpindahan paling mulus di seluruh kurikulum. Anda sudah paham DNS, DHCP, NTP, SSH, syslog, dan firewall. Yang perlu ditambah: administrasi Linux yang lebih dalam (LVM, systemd, SELinux), Active Directory, dan backup. Banyak perusahaan menengah justru mencari satu orang yang bisa keduanya.

**Ke depan:** sysadmin bisa naik menjadi **system engineer** (merancang platform), bercabang ke **DBA** atau **storage administrator**, menyeberang ke **DevOps engineer** atau **cloud infrastructure engineer** (modul 21.5), atau ke manajemen sebagai **IT operations manager**.

### 3.6 Pasar kerja Indonesia

Hampir setiap organisasi dengan lebih dari beberapa puluh karyawan membutuhkan sysadmin: perbankan, BUMN, manufaktur di kawasan industri (Cikarang, Karawang, Gresik, Batam), rumah sakit, kampus, pemerintah daerah, dan managed service provider.

Sebagai gambaran gaji, halaman wawasan gaji Jobstreet (diperbarui 1 Oktober 2026) mencatat rentang tipikal nasional untuk "Admin Sistem" sekitar Rp 3,63 juta sampai Rp 4,94 juta per bulan dari iklan yang mencantumkan gaji, dengan rata-rata lebih tinggi di beberapa wilayah Jakarta (Jakarta Pusat sekitar Rp 13 juta, Jakarta Selatan dan Jakarta Timur sekitar Rp 7 juta). Angka ini didominasi posisi junior dan perusahaan yang mau mencantumkan gaji; posisi sysadmin senior di bank atau perusahaan multinasional jarang dipasang dengan angka.

### 3.7 Belajar dari kurikulum ini

`04-network-layer/02-subnetting` → `06-aplikasi/01-dns` → `06-aplikasi/02-dhcp` → `06-aplikasi/05-layanan-lain` → `13-linux-networking/01-iproute2` → `13-linux-networking/03-nftables-firewall` → `13-linux-networking/04-layanan-jaringan-linux` → `12-keamanan/04-aaa-identitas` → `14-monitoring-troubleshooting/02-tools` → `lab/05-lab-linux-otomasi`.

### 3.8 Portofolio dan wawancara

**Proyek:**
1. Home lab dengan dua server Linux dan satu Windows Server: domain Active Directory, DNS internal yang meneruskan ke resolver publik, DHCP dengan reservasi, dan file share dengan izin per grup. Dokumentasikan topologi dan langkahnya di GitHub.
2. Skrip backup terjadwal (rsync atau restic) ke dua tujuan berbeda, ditambah skrip yang menguji restore secara otomatis dan mengirim laporan. Tunjukkan bahwa Anda memahami 3-2-1.
3. Playbook Ansible untuk hardening dasar server baru: pengguna, kunci SSH, firewall `nftables`, NTP, dan pengiriman log ke syslog pusat.

**Pertanyaan wawancara khas:**
- "Pengguna bilang `ping` ke nama server gagal, tetapi `ping` ke IP-nya berhasil. Apa langkah Anda?"
- "Ceritakan cara Anda memastikan backup benar-benar bisa dipulihkan."
- "Disk `/var` server produksi tinggal 2%. Apa yang Anda lakukan dalam 15 menit pertama, dan apa yang Anda lakukan minggu depannya?"

---

## 4. Database Administrator (DBA)

### 4.1 Apa yang sebenarnya dikerjakan

DBA bertanggung jawab agar database tersedia, cepat, aman, dan bisa dipulihkan. Di bank, database adalah tempat saldo nasabah berada. Kesalahan DBA tidak sekadar membuat aplikasi lambat: bisa membuat data hilang.

Contoh satu hari DBA di sebuah perusahaan pembiayaan (multifinance) di Jakarta:

- **07.30**: memeriksa dasbor: status replikasi PostgreSQL ke DC kedua di luar Jakarta, *lag* replikasi, keberhasilan backup penuh semalam, dan pertumbuhan tablespace.
- **09.00**: tim aplikasi mengeluh laporan penagihan butuh 40 detik. DBA membaca rencana eksekusi (`EXPLAIN ANALYZE`), menemukan full table scan pada tabel 80 juta baris, lalu mengusulkan indeks komposit. Indeks dibuat di luar jam sibuk lewat proses perubahan.
- **11.00**: rapat dengan tim jaringan. Rencana memindahkan server aplikasi ke gedung lain menambah latensi pulang-pergi dari 0,3 ms menjadi 4 ms. DBA menghitung: satu transaksi yang menjalankan 200 query berurutan akan bertambah sekitar 0,74 detik hanya karena latensi. Keputusan: aplikasi dan database tetap satu lokasi, atau aplikasinya diubah agar tidak "cerewet".
- **16.00**: uji restore bulanan: memulihkan backup ke server uji sampai titik waktu tertentu (*point-in-time recovery*) dan mencatat berapa lama prosesnya.

### 4.2 Tanggung jawab dan ukuran keberhasilan

O*NET (kode 15-1242 *Database Administrators*) mencatat tugas utama DBA: memodifikasi database dan sistem manajemen database, merencanakan dan menerapkan langkah keamanan, merencanakan dan menginstal upgrade, menentukan hak akses pengguna per segmen database, dan menguji perubahan.

**Ukuran keberhasilan yang umum:** ketersediaan database (sering 99,9% sampai 99,99% untuk sistem inti), RPO dan RTO yang terbukti lewat uji restore, latensi query kritis pada persentil ke-95 atau ke-99, lag replikasi, jumlah insiden yang disebabkan database, dan temuan audit akses.

### 4.3 Keahlian dan alat

**Teknis:** SQL yang kuat, arsitektur internal mesin database (buffer, log transaksi, MVCC, locking), backup dan pemulihan (penuh, inkremental, log/WAL, point-in-time), replikasi dan high availability (Oracle Data Guard, SQL Server Always On, replikasi streaming PostgreSQL, Group Replication MySQL, replica set MongoDB), tuning kinerja, keamanan (role, enkripsi, audit), serta Linux dan storage. Dari sisi jaringan: port dan firewall (Oracle 1521, SQL Server 1433, PostgreSQL 5432, MySQL 3306, MongoDB 27017), TLS untuk koneksi klien, DNS untuk *failover* berbasis nama, dan latensi.

**Non-teknis:** teliti, berani menolak perubahan berisiko, dan mampu menjelaskan ke developer kenapa query mereka lambat tanpa menyalahkan.

**Alat yang umum:** Oracle Database dengan RMAN dan Enterprise Manager, Microsoft SQL Server dengan SQL Server Management Studio, PostgreSQL dengan pgBackRest dan Patroni, MySQL dengan Percona XtraBackup, MongoDB Atlas atau MongoDB on-premises, DBeaver, serta pemantauan seperti Grafana dengan eksportir database atau Percona Monitoring and Management.

### 4.4 Sertifikasi per jenjang

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | **Oracle AI Database Administration Associate (1Z0-182)** | 120 menit, 60 soal, nilai lulus 65%. Oracle kini memakai merek "Oracle AI Database" untuk jalur yang sebelumnya bernama 23ai |
| Menengah | **Oracle AI Database Administration Professional (1Z0-183)** | 120 menit, 65 soal, nilai lulus 60%; mencakup multitenant, RMAN, tuning, patch dan upgrade |
| Menengah | **Microsoft Certified: Azure Database Administrator Associate (DP-300)** | Azure SQL dan SQL Server; perpanjangan tiap 12 bulan; versi bahasa Inggris diperbarui 27 Oktober 2026, cek study guide |
| Pemula sampai menengah | **EDB Essentials for PostgreSQL** (versi 18, 16, 14) dan **EDB Advanced for PostgreSQL** (versi 18, 16) | Dari EDB, kontributor besar PostgreSQL |
| Pemula sampai menengah | **MongoDB Associate Database Administrator** | Ada juga MongoDB Associate Atlas Administrator untuk layanan cloud-nya |
| Menengah | **Oracle Certified Professional, MySQL 8.0 Database Administrator (1Z0-908)** | Halaman Oracle menyatakan ujian ini pensiun 16 November 2026; periksa penggantinya sebelum mendaftar |

**Jalur Indonesia:** SKKNI Bidang Data Management System, Sub Bidang Data Management (Kepmenaker Nomor 268 Tahun 2020) memuat unit yang langsung relevan dengan DBA, antara lain `J.62DMS00.017.1` Mengadministrasi Basis Data, `J.62DMS00.018.1` Memonitor Kinerja Basis Data, `J.62DMS00.021.1` Melakukan Back-Up and Restore Data, dan `J.62DMS00.022.1` Mengelola Keamanan Data. Skema BNSP berbasis unit-unit ini tersedia di beberapa LSP; periksa daftar skema LSP sebelum mendaftar.

### 4.5 Jalur masuk dan progresi

Lowongan "DBA junior" untuk lulusan baru jarang ada di perusahaan besar. Jalur realistis: sysadmin, developer, atau *application support* yang banyak menulis SQL, lalu pindah ke tim database. Mitra Oracle atau Microsoft dan system integrator juga membuka posisi konsultan database junior.

**Dari network engineer:** perpindahannya lebih jauh dibanding ke sysadmin, tetapi keahlian Anda punya nilai khusus: DBA yang paham TCP, latensi, MTU, firewall stateful, dan load balancer sangat jarang. Mulailah dari SQL dan satu mesin database open source (PostgreSQL paling ramah untuk belajar), lalu pelajari backup dan replikasi.

**Ke depan:** DBA senior, *database architect*, *data platform engineer*, atau **site reliability engineer** untuk lapisan data. Banyak DBA juga naik ke **IT operations manager** karena terbiasa memegang sistem paling kritis.

### 4.6 Pasar kerja Indonesia

Perekrut utama: bank, asuransi dan multifinance, fintech dan bank digital, e-commerce, operator telekomunikasi (sistem tagihan), BUMN dengan ERP besar, serta system integrator dan mitra vendor database. Bank cenderung mencari Oracle atau SQL Server DBA dengan pengalaman replikasi, sedangkan startup lebih sering mencari PostgreSQL atau MySQL. Karena POJK 11/2022 mewajibkan DC dan DRC bank di Indonesia, pengalaman replikasi lintas kota sangat dihargai.

### 4.7 Belajar dari kurikulum ini

`00-fondasi/03-sinyal-bandwidth-latency` → `05-transport/01-port-socket` → `05-transport/02-tcp` → `06-aplikasi/01-dns` → `06-aplikasi/04-tls-pki` → `09-nat-acl-firewall/03-firewall` → `16-datacenter-cloud-sdn/03-storage-virtualisasi` → `14-monitoring-troubleshooting/03-observability`.

### 4.8 Portofolio dan wawancara

**Proyek:**
1. Klaster PostgreSQL tiga node di VM dengan Patroni dan etcd, lalu uji *failover*: matikan primary dan ukur berapa detik aplikasi kehilangan koneksi.
2. Simulasi point-in-time recovery: buat tabel, hapus datanya "tidak sengaja", lalu pulihkan ke satu menit sebelum penghapusan memakai backup dan WAL. Tulis laporan dengan angka RPO dan RTO yang tercapai.
3. Eksperimen latensi: jalankan beban query yang sama dengan tambahan latensi buatan (`tc qdisc ... netem delay 5ms`) antara aplikasi dan database, lalu grafikkan dampaknya. Proyek ini menunjukkan Anda paham jaringan dan database sekaligus.

**Pertanyaan wawancara khas:**
- "Aplikasi tiba-tiba lambat dan tim aplikasi menyalahkan database. Bagaimana Anda membuktikan di mana masalahnya?"
- "Jelaskan beda RPO dan RTO, dan teknologi apa yang Anda pakai untuk RPO mendekati nol."
- "Kenapa replikasi sinkron antara Jakarta dan Surabaya bisa memperlambat setiap transaksi tulis?"

---

## 5. Storage Administrator

### 5.1 Apa yang sebenarnya dikerjakan

Storage administrator mengelola tempat data benar-benar tersimpan: larik disk (SAN dan NAS), jaringan storage, replikasi antar-lokasi, dan sistem backup. Ia jarang terlihat oleh pengguna akhir, tetapi ketika storage bermasalah, puluhan server dan database ikut berhenti sekaligus.

Contoh satu hari di penyedia colocation dan cloud lokal di Jabodetabek:

- **08.00**: laporan kapasitas: satu *aggregate* sudah terisi 82%. Dengan laju pertumbuhan tiga bulan terakhir, penuh dalam tujuh minggu. Ia menyiapkan usulan penambahan shelf disk beserta waktu pengadaan.
- **11.00**: latensi tulis iSCSI ke satu klaster melonjak. Bersama network engineer ia memeriksa switch: satu port storage ternyata tersambung ke switch dengan MTU 1500 sementara host memakai jumbo frame 9000, sehingga terjadi fragmentasi dan *retransmit*. Masalahnya ada di jaringan, tetapi storage administrator yang pertama melihat gejalanya.
- **14.00**: memeriksa replikasi asinkron ke DRC di kota lain: lag replikasi naik karena jalur WAN dipakai bersama backup harian. Ia mengusulkan pembatasan bandwidth backup di jam kerja.

### 5.2 Tanggung jawab dan ukuran keberhasilan

- Merencanakan kapasitas dan kinerja (IOPS, throughput, latensi).
- Menyediakan storage blok (LUN via Fibre Channel, iSCSI, atau NVMe over Fabrics), berkas (NFS, SMB), dan objek (S3-compatible).
- Mengelola snapshot, replikasi, dan integrasi dengan perangkat lunak backup.
- Menjaga keamanan data: enkripsi saat diam dan saat transit, kontrol akses, perlindungan ransomware.
- Mengatur firmware dan siklus hidup perangkat bersama vendor.

**Ukuran keberhasilan yang umum:** latensi storage di bawah ambang SLO (misalnya beberapa milidetik untuk beban database), tidak ada kejadian "storage penuh" yang tak terduga, akurasi prakiraan kapasitas, tingkat keberhasilan backup dan restore, lag replikasi sesuai RPO, dan hasil uji DRP.

### 5.3 Keahlian dan alat

**Teknis:** konsep SAN dan NAS, RAID dan *erasure coding*, Fibre Channel (WWN, zoning, fabric), iSCSI (berjalan di atas TCP, dibakukan dalam RFC 7143, port 3260), NVMe-oF, NFS dan SMB, deduplikasi dan kompresi, snapshot dan replikasi, backup (Veeam, Commvault, Dell PowerProtect, Veritas NetBackup), serta storage di lingkungan virtualisasi (VMware vSAN, Ceph). Dari sisi jaringan: VLAN khusus storage, jumbo frame end-to-end, link aggregation dan multipath (MPIO), QoS, dan latensi WAN untuk replikasi.

**Non-teknis:** perencanaan jangka panjang, disiplin dokumentasi (siapa memakai LUN mana), dan komunikasi dengan vendor saat eskalasi.

**Alat yang umum:** NetApp ONTAP, Dell PowerStore dan PowerMax, Dell PowerScale, HPE Alletra, Pure Storage, Huawei OceanStor, Brocade (Broadcom) atau Cisco MDS untuk Fibre Channel, Veeam Backup & Replication, Ceph, MinIO, serta alat pemantauan bawaan vendor.

### 5.4 Sertifikasi per jenjang

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | **Dell Information Storage and Management Foundations (D-ISM-FN-02)** | Netral teknologi: FC SAN, IP SAN, NVMe-oF, block/file/object, backup, replikasi, keamanan. Versi D-ISM-FN-01 pensiun 15 Oktober 2026; D-ISM-FN-02 tersedia mulai 16 Oktober 2026 |
| Menengah | **NetApp Certified Data Administrator, ONTAP (NCDA)** | Domain: storage platforms, core ONTAP, ONTAP storage, networking, protokol SAN/NAS/S3, data protection, security, performance. Kode ujian yang tercantum di portal ujian NetApp saat ini NS0-164 |
| Menengah | **Sertifikasi produk Dell**, misalnya PowerMax Operate (D-PVM-OE-01) | Pilih sesuai perangkat yang dipakai pemberi kerja |
| Menengah sampai senior | **VCAP-VCF Storage (3V0-23.25)** | Storage tingkat lanjut di VMware Cloud Foundation 9 |

⚠️ **Tentang SNIA.** Organisasi industri storage SNIA pernah punya program sertifikasi netral vendor (SNCP). Per Oktober 2026 halaman sertifikasi di situs SNIA sudah tidak ditemukan, sedangkan SNIA Educational Library tetap aktif dan gratis. Gunakan perpustakaan itu sebagai bahan belajar, dan pakai D-ISM-FN-02 sebagai sertifikasi dasar yang netral teknologi.

**Jalur Indonesia:** belum ada SKKNI khusus storage administrator. Unit `J.62DMS00.021.1` (back-up and restore) dan `J.62DMS00.022.1` (keamanan data) dalam SKKNI Data Management, serta unit backup dan pemulihan di SKKNI Administrasi Sistem, adalah yang paling dekat.

### 5.5 Jalur masuk dan progresi

Hampir tidak ada yang masuk langsung sebagai storage administrator. Jalur umum: sysadmin atau engineer virtualisasi yang sering mengurus datastore dan backup, atau engineer implementasi di distributor dan system integrator yang menjual NetApp, Dell, HPE, atau Huawei.

**Dari network engineer:** sangat masuk akal bila Anda berasal dari data center. iSCSI, NFS, dan NVMe/TCP berjalan di atas Ethernet dan TCP; Fibre Channel punya konsep fabric dan zoning yang mirip VLAN dan ACL. Anda tinggal menambah RAID, konsep volume, snapshot, dan backup.

**Ke depan:** *storage architect*, *backup and recovery specialist*, **disaster recovery specialist** (modul 21.7), *data center engineer*, atau system engineer yang memegang seluruh lapisan infrastruktur.

### 5.6 Pasar kerja Indonesia

Peran khusus storage administrator biasanya ada di organisasi bervolume data besar: bank, operator seluler, penyedia colocation dan cloud lokal, BUMN besar, dan pengelola pusat data pemerintah. Di perusahaan menengah, tugas ini dipegang sysadmin atau system engineer. Distributor dan system integrator merekrut engineer implementasi dan *presales*. Kewajiban DC dan DRC di dalam negeri (POJK 11/2022, PP 71/2019) membuat keahlian replikasi antar-DC tetap dicari.

### 5.7 Belajar dari kurikulum ini

`02-layer-fisik/03-fiber` → `03-data-link/03-vlan` → `03-data-link/05-etherchannel` → `05-transport/04-congestion-control` → `11-wan-vpn/01-teknologi-wan` → `16-datacenter-cloud-sdn/01-desain-dc` → `16-datacenter-cloud-sdn/03-storage-virtualisasi` → `14-monitoring-troubleshooting/03-observability`.

### 5.8 Portofolio dan wawancara

**Proyek:**
1. Lab iSCSI: satu server Linux sebagai target (`targetcli`), dua host sebagai initiator dengan multipath ke dua VLAN storage terpisah. Uji putuskan satu jalur dan tunjukkan I/O tetap berjalan.
2. Lab jumbo frame: ukur throughput dan latensi iSCSI atau NFS dengan MTU 1500 dan 9000, lalu tunjukkan apa yang terjadi ketika satu titik di tengah jalur masih 1500 (gunakan `ping -M do -s 8972`).
3. Rancangan backup 3-2-1 untuk perusahaan fiktif 50 VM: kebijakan retensi, salinan immutable, salinan di lokasi lain, perhitungan kapasitas, serta jadwal dan hasil uji restore.

**Pertanyaan wawancara khas:**
- "Apa beda SAN dan NAS, dan kapan Anda memilih masing-masing?"
- "Latensi storage naik hanya di satu klaster. Apa saja yang Anda periksa, termasuk di sisi jaringan?"
- "Bagaimana rancangan backup Anda bertahan dari ransomware yang sudah memegang akun admin domain?"

---

## 6. System Engineer

### 6.1 Apa yang sebenarnya dikerjakan

Jika sysadmin menjaga sistem yang sudah ada, system engineer merancang dan membangun sistemnya. Ia memilih arsitektur server dan virtualisasi, menyusun standar (*baseline*) build, mengotomasi penyediaan, dan memimpin migrasi. O*NET memakai kode 15-1299.08 *Computer Systems Engineers/Architects*, dengan contoh judul seperti Infrastructure Engineer, Systems Engineer, dan Systems Architect. Tugasnya: memahami kebutuhan sistem, menilai kesesuaian komponen, memberi panduan implementasi yang aman, dan mengarahkan instalasi sistem operasi, jaringan, dan perangkat keras.

Contoh satu minggu di system integrator Jakarta yang mengerjakan proyek modernisasi DC untuk sebuah BUMN:

- **Senin**: survei lingkungan lama: 120 VM di klaster virtualisasi lama yang lisensinya akan habis. Ia memetakan VM, ketergantungan aplikasi, VLAN, dan alamat IP. Separuh waktunya dihabiskan untuk mencari tahu server mana yang masih dipakai.
- **Selasa**: menulis *low-level design*: klaster baru 6 host, jaringan dengan VLAN terpisah untuk manajemen, migrasi VM, storage, dan produksi, serta tautan ganda ke dua switch leaf.
- **Rabu**: membangun template VM Linux dan Windows yang sudah di-hardening, lalu playbook Ansible untuk konfigurasi pasca-instalasi.
- **Kamis**: uji fungsi bersama tim jaringan klien: failover tautan host, *live migration*, dan akses storage saat satu switch dimatikan.
- **Jumat malam**: migrasi gelombang pertama 20 VM dalam jendela perubahan, dengan rencana rollback dan daftar uji yang ditandatangani pemilik aplikasi.

### 6.2 Tanggung jawab dan ukuran keberhasilan

- Merancang arsitektur server, virtualisasi, dan platform (on-premises dan hybrid).
- Menyusun standar build, hardening, dan dokumentasi.
- Mengotomasi penyediaan dan konfigurasi.
- Memimpin implementasi, migrasi, dan uji terima.
- Menjadi eskalasi level 3 untuk masalah yang tidak terpecahkan oleh sysadmin.

**Ukuran keberhasilan yang umum:** proyek selesai sesuai jadwal dan lolos uji terima, jumlah insiden pasca-migrasi, waktu penyediaan server baru (dari hari menjadi menit), konsistensi konfigurasi antar-server, dan kualitas dokumentasi serah terima ke tim operasional.

### 6.3 Keahlian dan alat

**Teknis:** virtualisasi (VMware vSphere atau VMware Cloud Foundation, Hyper-V, Proxmox VE, Nutanix AHV), Linux dan Windows Server tingkat lanjut, storage untuk virtualisasi, jaringan DC (VLAN, link aggregation, routing dasar, FHRP), otomasi (Ansible, PowerShell, Terraform), dasar cloud publik, serta keamanan sistem.

**Non-teknis:** menulis desain dan dokumen serah terima, memimpin rapat teknis dengan klien, memperkirakan waktu dan risiko pekerjaan.

**Alat yang umum:** VMware vCenter dan NSX, Microsoft Hyper-V dengan Windows Admin Center, Proxmox VE, Nutanix Prism, Ansible, Terraform, PowerShell, Packer untuk template, draw.io untuk diagram, dan NetBox sebagai inventaris.

**Konteks VMware pasca-akuisisi Broadcom.** Portofolio VMware kini berpusat pada VMware Cloud Foundation (VCF) dan VMware vSphere Foundation (VVF), dan perubahan model lisensi mendorong banyak organisasi mengevaluasi alternatif seperti Hyper-V, Proxmox VE, atau Nutanix. Keahlian VMware tetap laku karena basis terpasangnya besar, tetapi system engineer yang bisa memimpin migrasi ke platform lain juga dicari.

### 6.4 Sertifikasi per jenjang

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Menengah | **VCP-VVF Administrator (2V0-16.25)** | vSphere Foundation (vCenter, ESX, vSAN) |
| Menengah | **VCP-VCF Administrator (2V0-17.25)** | Seluruh tumpukan VCF 9: NSX, vSAN, SDDC Manager, operasi. Tidak ada prasyarat; sertifikat VCP lama tidak otomatis terbawa; berlaku 3 tahun; harga standar USD 250 per ujian |
| Menengah | **Microsoft Certified: Azure Administrator Associate (AZ-104)** | Untuk lingkungan hybrid dengan Azure |
| Menengah | **RHCE in Enterprise Linux (EX200 + EX342)** atau **RHCE in Ansible (EX200 + EX294)** | Red Hat merestrukturisasi sertifikasinya mulai 11 Mei 2026; semua sertifikasi berlaku 3 tahun |
| Senior | **VCP-VCF Architect (2V0-13.25)** dan **VCAP-VCF** per domain (Networking 3V0-25.25, Storage 3V0-23.25, Operations 3V0-22.25, Automation 3V0-21.25) | Untuk yang bergerak ke arah desain |

**Jalur Indonesia:** unit perancangan arsitektur dan keamanan server dalam SKKNI Administrasi Sistem (Kepmenaker 82/2017, misalnya `J.63SAM00.003.2` dan `J.63SAM00.004.2`) relevan langsung. Untuk sisi cloud, lihat SKKNI Cloud Computing yang dibahas di modul 21.5.

### 6.5 Jalur masuk dan progresi

Jalur paling umum: sysadmin 2 sampai 4 tahun yang mulai dipercaya memegang proyek. Jalur kedua: engineer di system integrator, yang sejak awal memakai judul "System Engineer" tetapi baru mengerjakan desain setelah beberapa proyek.

**Dari network engineer:** jalurnya pendek jika Anda berasal dari data center. Anda sudah paham fabric, VLAN, link aggregation, dan FHRP. Tambahkan virtualisasi (mulai dari Proxmox VE di rumah), Linux tingkat RHCSA, dan otomasi Ansible yang mungkin sudah Anda pakai untuk switch.

**Ke depan:** **solution architect**, **cloud infrastructure engineer**, **DevOps engineer**, atau kembali ke operasional sebagai **IT operations manager**.

### 6.6 Pasar kerja Indonesia

Perekrut terbesar adalah system integrator yang mengerjakan proyek bank, BUMN, dan pemerintah, serta distributor dan vendor perangkat (Dell, HPE, Lenovo, Huawei, Nutanix, mitra VMware). Bank dan perusahaan besar merekrut untuk tim infrastruktur internal, sedangkan startup dan penyedia cloud lokal mencari profil yang condong ke otomasi dan Linux. Di system integrator, perjalanan dinas ke lokasi klien cukup sering.

### 6.7 Belajar dari kurikulum ini

`03-data-link/05-etherchannel` → `07-routing-lanjutan/08-fhrp` → `13-linux-networking/02-virtual-networking` → `16-datacenter-cloud-sdn/01-desain-dc` → `16-datacenter-cloud-sdn/03-storage-virtualisasi` → `16-datacenter-cloud-sdn/04-cloud-networking` → `12-keamanan/05-hardening-zero-trust` → `15-otomasi/04-ansible-cicd` → `17-desain-arsitektur/03-perencanaan-dokumentasi`.

### 6.8 Portofolio dan wawancara

**Proyek:**
1. Klaster Proxmox VE tiga node (bisa nested di satu PC) dengan storage bersama Ceph, VLAN terpisah untuk manajemen, migrasi, dan storage, serta uji *live migration* dan kegagalan satu node.
2. Template VM dengan Packer plus playbook Ansible, sehingga satu perintah menghasilkan server Linux siap pakai yang sudah di-hardening dan terdaftar di monitoring.
3. Dokumen rencana migrasi 50 VM dari satu platform virtualisasi ke platform lain: inventaris, pengelompokan gelombang, uji per aplikasi, rencana rollback, dan perkiraan downtime.

**Pertanyaan wawancara khas:**
- "Rancang jaringan untuk klaster virtualisasi enam host. VLAN apa saja yang Anda pisahkan, dan kenapa?"
- "Apa risiko terbesar saat migrasi VM antar-platform, dan bagaimana Anda menguranginya?"
- "Ceritakan konfigurasi yang Anda otomasi dan apa yang berubah setelahnya."

---

## 7. IT Operations Manager

### 7.1 Apa yang sebenarnya dikerjakan

IT operations manager memastikan layanan TI berjalan sesuai janji: aplikasi bisa diakses, insiden ditangani cepat, perubahan tidak merusak produksi, dan tim tidak kelelahan. Ia mengelola orang, proses, vendor, dan anggaran. O*NET memasukkannya ke 11-3021 *Computer and Information Systems Managers*, dengan tugas inti mengarahkan operasi harian, menetapkan prioritas dan standar, berkoordinasi dengan kepala unit dan vendor, serta menugaskan dan meninjau pekerjaan staf.

Contoh satu hari di divisi TI sebuah bank daerah:

- **08.00**: rapat harian 15 menit: insiden 24 jam terakhir, perubahan yang akan berjalan malam ini, dan status tiket yang hampir melanggar SLA.
- **09.00**: insiden prioritas 1: layanan transfer di mobile banking gagal sebagian. Ia bukan orang yang memperbaiki, tetapi *incident manager*: membuka jalur komunikasi, memanggil DBA, network engineer, dan vendor aplikasi, memastikan ada satu orang yang memegang keputusan, dan mengirim pembaruan ke direksi setiap 30 menit.
- **11.30**: setelah layanan pulih, ia menjadwalkan *post-incident review* tanpa mencari kambing hitam, dengan keluaran tindakan perbaikan yang punya pemilik dan tenggat.
- **13.30**: rapat CAB mingguan: meninjau sebelas permintaan perubahan, menolak satu yang tidak punya rencana rollback.
- **16.30**: menyusun jadwal uji DRP tahunan, karena POJK 11/2022 mewajibkan uji coba rencana pemulihan bencana paling sedikit sekali setahun dengan melibatkan pengguna.

### 7.2 Tanggung jawab dan ukuran keberhasilan

- Menjalankan proses manajemen layanan: insiden, problem, perubahan, permintaan layanan, aset dan konfigurasi.
- Menetapkan dan memantau SLA internal dan SLA dengan vendor.
- Mengelola tim operasional, jadwal shift dan *on-call*, serta pengembangan kompetensi.
- Mengelola anggaran operasional dan kontrak vendor.
- Menyiapkan bukti untuk audit internal, auditor eksternal, dan regulator.

**Ukuran keberhasilan yang umum:** ketersediaan layanan kritis terhadap SLA, MTTR insiden per prioritas, persentase perubahan yang gagal atau memicu insiden (*change failure rate*), jumlah problem berulang yang ditutup, kepuasan pengguna, kepatuhan SLA vendor, temuan audit, dan tingkat pergantian staf.

### 7.3 Keahlian dan alat

**Teknis:** pemahaman cukup luas di semua lapisan (jaringan, server, database, aplikasi, keamanan) untuk menilai risiko dan menanyai engineer dengan tepat; kerangka ITIL; dasar SRE (SLO, error budget); pengetahuan regulasi seperti PP 71/2019, POJK 11/2022, dan UU Pelindungan Data Pribadi.

**Non-teknis:** kepemimpinan, komunikasi krisis, negosiasi vendor, anggaran, pelaporan ke manajemen, dan keberanian memutuskan dengan informasi tidak lengkap.

**Alat yang umum:** ServiceNow, Jira Service Management, ManageEngine ServiceDesk Plus, atau GLPI untuk ITSM; Zabbix, Grafana, Datadog, atau PRTG untuk pemantauan; PagerDuty atau Opsgenie untuk *on-call*; serta Confluence atau wiki internal untuk runbook.

### 7.4 Sertifikasi per jenjang

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula sampai menengah | **ITIL Foundation (Version 5)** | Diterbitkan PeopleCert; 40 soal, 60 menit, buku tertutup, nilai lulus 65%; perpanjangan tiap 3 tahun dengan 60 poin CPD |
| Pemula sampai menengah | **ITIL Foundation Bridge (Version 5)** | Untuk pemegang ITIL 4 Foundation yang ingin pindah ke versi 5 lewat ujian singkat |
| Menengah | **ITIL Practice Manager (Version 5)** | Designation: Foundation + satu modul Practice Manager + Transformation |
| Senior | **ITIL Managing Professional** atau **ITIL Strategic Leader (Version 5)** | MP: Product, Service, Experience, Transformation. SL: Strategy dan Transformation |
| Pelengkap | **ITIL AI Governance (Version 5)** | Modul ekstensi tanpa prasyarat |

⚠️ **ITIL 4 sedang dalam masa transisi.** PeopleCert meluncurkan ITIL (Version 5) pada 2026 dan, menurut FAQ resminya, berencana menghentikan seluruh modul ITIL 4 pada 31 Desember 2027. Jika Anda baru mulai, ambil ITIL Foundation (Version 5). Jika sudah memegang ITIL 4 Foundation, sertifikat itu tetap bernilai di lowongan, dan jalur Bridge tersedia.

**Jalur Indonesia:** SKKNI Bidang Manajemen Layanan Teknologi Informasi kini ditetapkan lewat Kepmenaker Nomor 30 Tahun 2025, menggantikan Kepmenaker 610 Tahun 2012. Standar ini menjadi acuan skema sertifikasi BNSP untuk jabatan di manajemen layanan TI.

### 7.5 Jalur masuk dan progresi

Ini bukan posisi untuk lulusan baru. Jalur realistis: bertahun-tahun sebagai sysadmin, network engineer, DBA, atau system engineer, lalu team lead, dan setelah terbukti memimpin insiden besar serta mengelola vendor, naik menjadi manajer operasional.

**Dari network engineer atau network administrator:** jalur ini terbuka lebar, terutama bila Anda pernah memimpin NOC. Pengalaman menangani gangguan jaringan multi-pihak (operator, vendor, cabang) adalah latihan langsung untuk *incident management*. Yang perlu ditambah: wawasan server, database, dan aplikasi, ITIL, serta kemampuan anggaran dan pelaporan.

**Ke depan:** *Head of IT Infrastructure*, *IT Service Delivery Manager*, *Head of IT Operations*, lalu CIO atau CTO. Sebagian beralih ke **IT consultant** atau **IT auditor** (modul 21.7) karena sudah terbiasa dengan proses dan kepatuhan.

### 7.6 Pasar kerja Indonesia

Perekrut utama: bank dan lembaga keuangan (karena tekanan regulasi OJK), BUMN, perusahaan multinasional dengan pusat layanan bersama di Jakarta, managed service provider dan perusahaan outsourcing TI, operator telekomunikasi, serta instansi pemerintah yang mengelola pusat data. Sebagai gambaran gaji, Salary Comparison Tool Michael Page Indonesia (diakses Oktober 2026) mencatat rata-rata gaji pokok IT Infrastructure Manager sebesar IDR 25 juta per bulan dan IT Manager sebesar IDR 45 juta per bulan, belum termasuk bonus dan tunjangan.

### 7.7 Belajar dari kurikulum ini

`12-keamanan/01-konsep-keamanan` → `14-monitoring-troubleshooting/01-metodologi` → `14-monitoring-troubleshooting/03-observability` → `14-monitoring-troubleshooting/04-studi-kasus` → `17-desain-arsitektur/03-perencanaan-dokumentasi` → `20-proyek-akhir/09-babak-8-malam-panjang` → `20-proyek-akhir/10-babak-9-ruang-rapat` → `18-karier-sertifikasi/04-portofolio-interview`.

### 7.8 Portofolio dan wawancara

Untuk jabatan manajer, portofolio berupa dokumen dan cerita, bukan konfigurasi.

**Proyek:**
1. Katalog layanan dan SLA untuk perusahaan fiktif 500 karyawan: definisi prioritas insiden (P1 sampai P4), target respons dan penyelesaian, matriks eskalasi, serta SLO untuk tiga layanan kritis beserta SLI-nya.
2. Contoh *post-incident review* dari gangguan yang pernah Anda tangani (disamarkan): kronologi, dampak, akar masalah, faktor penyumbang, dan tindakan perbaikan dengan pemilik dan tenggat.
3. Rencana uji DRP satu hari: skenario, peran, kriteria lulus, lembar bukti untuk auditor, dan cara mengukur RTO dan RPO yang benar-benar tercapai.

**Pertanyaan wawancara khas:**
- "Pukul 19.00 core banking mati dan tiga vendor saling menyalahkan. Apa yang Anda lakukan di 30 menit pertama?"
- "Bagaimana Anda menurunkan jumlah perubahan yang gagal tanpa membuat proses perubahan menjadi birokrasi yang menghambat?"
- "Tim Anda kelelahan karena on-call. Apa yang Anda ubah?"

---

## 8. Menyeberang dari Network Engineer atau Administrator: Peta Realistis

| Tujuan | Jarak dari jaringan | Modal yang sudah Anda punya | Yang perlu ditambah | Langkah pertama yang masuk akal |
|---|---|---|---|---|
| System Administrator | Dekat | DNS, DHCP, NTP, SSH, syslog, firewall, troubleshooting | LVM, systemd, SELinux, Active Directory, backup | RHCSA atau LFCS, plus lab AD di rumah |
| System Engineer | Sedang | Fabric DC, VLAN, link aggregation, FHRP, Ansible | Virtualisasi, storage, Linux dan Windows tingkat lanjut | Klaster Proxmox atau vSphere di lab, lalu VCP atau RHCE |
| Storage Administrator | Sedang | Ethernet, MTU, multipath, QoS, latensi WAN | RAID, LUN, snapshot, replikasi, backup | D-ISM-FN-02, lab iSCSI dan NFS |
| Database Administrator | Jauh | TCP, latensi, firewall, TLS, load balancer | SQL, internal mesin database, backup, replikasi | Belajar PostgreSQL dan SQL, lalu EDB Essentials |
| IT Operations Manager | Jauh dalam waktu, dekat dalam keterampilan | Penanganan insiden multi-pihak, eskalasi vendor | ITIL, anggaran, kepemimpinan, wawasan lintas lapisan | ITIL Foundation (Version 5), memimpin satu proses di tempat kerja |

💡 **Anda tidak harus meninggalkan jaringan.** Di perusahaan menengah Indonesia, profil "network dan system administrator" termasuk yang paling sering dicari. Menambah lapisan server membuat Anda lebih sulit digantikan.

---

## 9. Jebakan Umum

- **Mengira backup sukses berarti data aman.** Yang membuktikan adalah restore yang diuji. Kasus PDNS 2 pada 2024 menunjukkan mahalnya kesalahan ini.
- **Menyalahkan jaringan tanpa data, atau sebaliknya.** Biasakan membawa bukti: `ss`, `tcpdump`, `iostat`, rencana eksekusi query, grafik latensi. Tim yang membawa data paling cepat dipercaya.
- **Mengabaikan latensi.** Memindahkan aplikasi jauh dari database, atau memaksakan replikasi sinkron antar-kota, bisa melambatkan setiap transaksi. Hitung dulu: jumlah query berurutan dikali RTT.
- **Mengejar sertifikasi yang sudah pensiun.** AZ-800 dan AZ-801 sudah pensiun 30 September 2026, D-ISM-FN-01 pensiun 15 Oktober 2026, dan 1Z0-908 dijadwalkan pensiun 16 November 2026. Selalu cek halaman resmi penerbit sebelum membeli voucher atau kursus.
- **Akun admin bersama.** Satu kata sandi "administrator" yang dipakai lima orang menghapus jejak audit dan menjadi pintu masuk ransomware. Pakai akun pribadi dengan hak minimum dan catat semua akses.

---

## 10. Ringkasan

- Rumpun ini mengurus server, database, storage, dan operasional layanan TI: tetangga terdekat orang jaringan.
- Kosakata bersama: SLA, SLO, SLI, RPO, RTO, MTTR, backup 3-2-1, dan change management.
- Regulasi Indonesia yang membentuk pekerjaan ini: PP 71/2019 (penempatan data PSE Lingkup Publik di Indonesia) dan POJK 11/POJK.03/2022 (DC dan DRC bank di Indonesia, uji DRP minimal sekali setahun).
- **System administrator**: pintu masuk paling realistis; RHCSA (EX200, RHEL 10), LFCS, Linux+ XK0-006, dan AZ-802 untuk Windows Server.
- **DBA**: menengah; Oracle 1Z0-182 dan 1Z0-183, DP-300, EDB PostgreSQL, MongoDB Associate DBA.
- **Storage administrator**: menengah; D-ISM-FN-02, NetApp NCDA, sertifikasi produk Dell, VCAP-VCF Storage.
- **System engineer**: menengah; VCP-VCF Administrator 2V0-17.25, VCP-VVF 2V0-16.25, RHCE (dua jalur), AZ-104.
- **IT operations manager**: senior; ITIL Foundation (Version 5) dan designation lanjutannya; ITIL 4 direncanakan berhenti akhir 2027.
- Jalur kompetensi Indonesia: SKKNI Administrasi Sistem (Kepmenaker 82/2017), SKKNI Data Management (Kepmenaker 268/2020), dan SKKNI Manajemen Layanan TI (Kepmenaker 30/2025).

---

## 11. Latihan

1. Sebuah aplikasi pinjaman online dipindahkan ke gedung lain, sementara database tetap di DC lama. RTT naik dari 0,5 ms menjadi 6 ms. Satu proses pengajuan menjalankan 150 query berurutan. Berapa kira-kira tambahan waktu per pengajuan, dan apa saran Anda?
2. Direksi sebuah bank meminta RPO nol untuk core banking antara DC Jakarta dan DRC di kota lain. Sebagai DBA atau storage administrator, apa yang Anda jelaskan tentang dampak jarak dan latensi, dan apa alternatifnya?
3. Pengguna di satu cabang tidak mendapat alamat IP pada pagi hari, padahal kemarin normal. Server DHCP berjalan. Susun langkah diagnosis Anda dari sisi sysadmin dan sisi jaringan.
4. Latensi tulis iSCSI ke klaster virtualisasi melonjak setelah tim jaringan mengganti satu switch. Apa dugaan pertama Anda, dan bagaimana membuktikannya dengan perintah sederhana?
5. Seorang rekan ingin mengambil "Windows Server Hybrid Administrator Associate" dengan membeli voucher AZ-800 bulan ini (Oktober 2026). Apa saran Anda?
6. Rancang strategi backup 3-2-1 untuk sebuah pemerintah kabupaten yang menjalankan 30 VM, dengan memperhatikan ancaman ransomware dan kewajiban PP 71/2019.
7. Sebagai IT operations manager, Anda menerima permintaan perubahan "update firmware storage, Jumat 15.00, tanpa rencana rollback, vendor bilang aman". Apa keputusan Anda dan apa yang Anda minta?
8. Anda network administrator dengan pengalaman dua tahun di perusahaan manufaktur. Susun rencana 12 bulan yang realistis untuk menjadi system administrator, lengkap dengan sertifikasi dan proyek portofolio.

<details>
<summary>Jawaban</summary>

1. Tambahan RTT per query 6 - 0,5 = 5,5 ms. Dengan 150 query berurutan, tambahannya sekitar 150 × 5,5 ms = 825 ms, hampir satu detik per pengajuan, sebelum menghitung waktu proses database. Saran: tempatkan kembali aplikasi satu lokasi dengan database; jika tidak mungkin, ubah aplikasi agar tidak "cerewet" (gabungkan query, pakai *batch* atau *stored procedure*, cache data yang jarang berubah). Bawa bukti ke rapat: pengukuran RTT, jumlah query per transaksi dari log, dan grafik waktu respons sebelum dan sesudah pemindahan. Ini contoh klasik "database lambat" yang akarnya jarak di jaringan.

2. RPO nol menuntut replikasi sinkron: setiap transaksi tulis baru selesai setelah DRC mengonfirmasi datanya tersimpan, jadi setiap commit menunggu minimal satu RTT ke DRC. Cahaya di serat optik merambat kira-kira 200 km per milidetik, sehingga jarak ratusan kilometer menambah beberapa milidetik per commit, belum termasuk perangkat dan jalur yang tidak lurus. Throughput turun, waktu respons naik, dan gangguan WAN bisa ikut menahan sistem utama. Alternatif lazim: replikasi sinkron ke lokasi kedua yang dekat ditambah replikasi asinkron ke DRC jauh, atau menerima RPO beberapa detik dengan replikasi asinkron dan prosedur rekonsiliasi. Apa pun pilihannya, POJK 11/2022 menuntut DC dan DRC di Indonesia serta uji DRP tahunan, jadi RPO-nya harus dibuktikan lewat uji.

3. Sisi sysadmin: periksa log server DHCP (adakah DISCOVER dari cabang itu?), pemakaian scope, dan daftar lease (terisi perangkat asing?). Sisi jaringan: DISCOVER adalah broadcast, jadi cabang yang memakai server pusat butuh *DHCP relay* (`ip helper-address` atau padanannya) di gateway cabang; periksa apakah relay masih ada setelah perubahan terakhir, apakah ACL atau firewall memblokir UDP 67/68, apakah link WAN hidup, dan apakah DHCP snooping menandai uplink sebagai *trusted*. `tcpdump -n port 67 or port 68` di server menunjukkan apakah permintaan dari relay sampai. Ikuti metodologi berlapis di `14-monitoring-troubleshooting/01-metodologi`.

4. Dugaan pertama: MTU tidak cocok. Jalur iSCSI sering memakai jumbo frame 9000, sementara switch pengganti mungkin masih 1500 di port atau VLAN storage, sehingga paket besar dibuang, TCP melakukan retransmit, dan latensi melonjak. Bukti dari host: `ping -M do -s 8972 <IP target storage>` (8972 byte data + 28 byte header IP dan ICMP = 9000). Jika gagal sementara `-s 1472` berhasil, ada titik di jalur yang belum mendukung jumbo frame. Periksa juga counter error dan *drop* di port switch, retransmit di host (`ss -ti`), dan status multipath.

5. Jangan beli voucher AZ-800. Microsoft Learn menyatakan AZ-800 dan AZ-801 pensiun pada 30 September 2026. Sertifikasinya kini bernama Windows Server Administrator Associate dengan satu ujian, AZ-802 (Administering Windows Server). Sarankan rekan Anda membaca study guide AZ-802 dan berhati-hati dengan kursus lama yang masih memakai dua ujian. Pelajaran umumnya: verifikasi kode ujian di situs penerbit sebelum membeli.

6. Contoh rancangan: **Salinan 1** adalah data produksi di pusat data di wilayah Indonesia, sesuai Pasal 20 PP 71/2019. **Salinan 2** adalah backup (inkremental harian, penuh mingguan) ke repositori terpisah pada media atau sistem berbeda, dengan fitur immutable dan akun backup yang tidak tergabung ke domain produksi. **Salinan 3** berada di luar lokasi: replikasi ke lokasi kedua di kota lain di Indonesia, atau media yang dilepas dari jaringan. Lengkapi dengan retensi yang jelas (misalnya 30 harian, 12 bulanan), enkripsi, jaringan backup terpisah, pemantauan job, dan uji restore terjadwal dengan catatan RTO yang tercapai. Pasal 20 ayat (1) mewajibkan rencana keberlangsungan kegiatan, jadi rancangan ini masuk dokumen BCP. Kasus PDNS 2 (2024) adalah alasan kenapa salinan immutable dan offline tidak bisa ditawar.

7. Tunda permintaan itu dalam bentuknya sekarang. Tidak ada rencana rollback, jam kerja hari Jumat memperbesar dampak bila gagal dan menyulitkan dukungan vendor di akhir pekan, dan "vendor bilang aman" bukan analisis risiko. Minta: catatan rilis dan daftar kompatibilitas (host, HBA, versi hypervisor), bukti bahwa update bersifat *non-disruptive* (controller diperbarui bergantian), langkah bila controller gagal kembali, backup terbaru yang sudah diverifikasi, jendela di luar jam sibuk dengan vendor siaga, daftar uji pasca-perubahan, dan pemberitahuan ke pemilik aplikasi. Jika lengkap, perubahan masuk jadwal CAB berikutnya.

8. Contoh rencana: **Bulan 1-3**: perdalam Linux (systemd, LVM, SELinux, journalctl) di lab rumah, ulangi `13-linux-networking/04-layanan-jaringan-linux`, dan ambil LFCS atau RHCSA. **Bulan 4-6**: lab Windows Server dengan Active Directory, DNS, DHCP, dan Group Policy; mulai belajar menuju AZ-802. **Bulan 7-9**: backup dan pemulihan (misalnya restic), playbook Ansible untuk server, dan monitoring dengan Zabbix atau Prometheus. **Bulan 10-12**: rapikan portofolio GitHub (proyek di bagian 3.8), minta tugas server di tempat kerja sekarang (misalnya DNS internal atau backup), lalu melamar posisi "System Administrator" atau "IT Infrastructure Engineer". Sertifikat BNSP skema System Administrator bisa ditambah bila menyasar BUMN atau tender pemerintah. Pengalaman nyata di tempat kerja tetap lebih meyakinkan daripada sertifikat saja.


</details>

---

## 12. Sumber

- Google, Site Reliability Engineering: Service Level Objectives: https://sre.google/sre-book/service-level-objectives/
- CISA (US-CERT), Data Backup Options (aturan 3-2-1): https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf
- Peraturan Pemerintah Nomor 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik (JDIH BPK): https://peraturan.bpk.go.id/Details/122030/pp-no-71-tahun-2019
- POJK Nomor 11/POJK.03/2022 tentang Penyelenggaraan Teknologi Informasi oleh Bank Umum (teks lengkap): https://peraturan.go.id/files/pojk11-2022.pdf
- OJK, halaman regulasi Penyelenggaraan Teknologi Informasi oleh Bank Umum: https://ojk.go.id/id/regulasi/Pages/Penyelenggaraan-Teknologi-Informasi-oleh-Bank-Umum.aspx
- Antara Kalsel, Menkominfo jelaskan kronologi serangan siber PDNS 2 (2024): https://kalsel.antaranews.com/berita/419220/menkominfo-jelaskan-kronologi-serangan-siber-pdns-2
- Bisnis.com, DPR Sesali Bertahun-tahun PDNS 2 Tidak Punya Data Cadangan (27 Juni 2024): https://teknologi.bisnis.com/read/20240627/101/1777675/dpr-sesali-bertahun-tahun-pdns-2-tidak-punya-data-cadangan-backup
- O*NET OnLine, 15-1244.00 Network and Computer Systems Administrators: https://www.onetonline.org/link/summary/15-1244.00
- O*NET OnLine, 15-1242.00 Database Administrators: https://www.onetonline.org/link/summary/15-1242.00
- O*NET OnLine, 15-1299.08 Computer Systems Engineers/Architects: https://www.onetonline.org/link/summary/15-1299.08
- O*NET OnLine, 11-3021.00 Computer and Information Systems Managers: https://www.onetonline.org/link/summary/11-3021.00
- Kemnaker, Kepmenaker Nomor 82 Tahun 2017 tentang SKKNI Bidang Administrasi Sistem: https://jdih.kemnaker.go.id/peraturan/detail/1489/keputusan-menaker-nomor-82-tahun-2017
- Kemnaker, Kepmenaker Nomor 268 Tahun 2020 tentang SKKNI Bidang Data Management (salinan lampiran di LSP Universitas Gunadarma): https://lsp.gunadarma.ac.id/media/skema/skkni/SKKNI_2020-268_Insinyur_Data_removed.pdf
- Kemnaker, Kepmenaker Nomor 30 Tahun 2025 tentang SKKNI Bidang Manajemen Layanan Teknologi Informasi: https://jdih.kemnaker.go.id/peraturan/detail/2634/keputusan-menteri-ketenagakerjaan-nomor-30-tahun-2025
- LSP TIK Indonesia, Skema Sertifikasi System Administrator: https://lsptik.or.id/scheme/system-administrator
- Red Hat, EX200 Red Hat Certified System Administrator (RHCSA) exam: https://www.redhat.com/en/services/training/ex200-red-hat-certified-system-administrator-rhcsa-exam
- Red Hat, Red Hat Certified Engineer (RHCE): https://www.redhat.com/en/services/certification/rhce
- Red Hat, Training and Certification FAQ: https://www.redhat.com/en/services/training-and-certification/faq
- Linux Foundation, LFCS: https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/
- LPI, LPIC-1 Overview: https://www.lpi.org/our-certifications/lpic-1-overview/
- CompTIA, Linux+: https://www.comptia.org/en-us/certifications/linux/
- CompTIA, Server+: https://www.comptia.org/en-us/certifications/server/
- Microsoft Learn, Windows Server Administrator Associate: https://learn.microsoft.com/en-us/credentials/certifications/windows-server-administrator-associate/
- Microsoft Learn, Exam AZ-802: Administering Windows Server: https://learn.microsoft.com/en-us/credentials/certifications/exams/az-802/
- Microsoft Learn, Azure Administrator Associate (AZ-104): https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/
- Microsoft Learn, Azure Database Administrator Associate (DP-300): https://learn.microsoft.com/certifications/exams/dp-300
- Oracle University, Exam 1Z0-182: Oracle AI Database Administration Associate: https://mylearn.oracle.com/ou/exam/oracle-database-23ai-administration-associate-1z0-182/38560/138639/219333
- Oracle University, Exam 1Z0-183: Oracle AI Database Administration Professional: https://mylearn.oracle.com/ou/exam/oracle-database-23ai-administration-professional-1z0-183/105037/149508/246090
- Oracle University, Exam 1Z0-908: MySQL 8.0 Database Administrator: https://mylearn.oracle.com/ou/exam/mysql-80-database-administrator-1z0-908/51871/110678/170386
- EDB, Certification Exams Catalog: https://www.enterprisedb.com/training/certification-exams
- MongoDB University, Certification Program: https://learn.mongodb.com/pages/certification-program
- Broadcom, VMware Cloud Foundation Certification FAQ: https://docs.broadcom.com/doc/vmw-certification-faqs
- Broadcom, 2026 VMware Cloud Foundation Certification Paths: https://docs.broadcom.com/doc/vmw-certification-paths
- NetApp, NetApp Certified Data Administrator, ONTAP: https://www.netapp.com/support-and-training/netapp-learning-services/certifications/ontap-data-administration/
- NetApp Community, diskusi perubahan ujian NS0-163 ke NS0-164: https://community.netapp.com/community/discussion/462449/netapp-data-administrator-ontap-guidence-on-exam-changes-from-version-ns0-163-to-nsx0-164
- Dell Technologies, Information Storage and Management Foundations: https://learning.dell.com/content/dell/en-us/home/certification-overview/available-exams/information-storage-and-management-foundations0.html
- SNIA, Educational Library: https://www.snia.org/educational-library
- IETF, RFC 7143: Internet Small Computer System Interface (iSCSI) Protocol (Consolidated): https://www.rfc-editor.org/rfc/rfc7143
- PeopleCert, ITIL Foundation (Version 5): https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1/itil-5-foundation-version-50-4154
- PeopleCert, ITIL Qualification Scheme: https://www.peoplecert.org/Frameworks-Professionals/ITIL-framework
- PeopleCert, ITIL FAQ (rencana penghentian modul ITIL 4): https://www.peoplecert.org/help-and-support/faq-itil
- Jobstreet Indonesia, Gaji Admin Sistem: https://id.jobstreet.com/id/career-advice/role/systems-administrator/salary
- Michael Page Indonesia, Salary Comparison Tool: IT Infrastructure Manager: https://www.michaelpage.co.id/salary-comparison-tool/it-infrastructure-manager-salaries
- Michael Page Indonesia, Salary Comparison Tool: IT Manager: https://www.michaelpage.co.id/salary-comparison-tool/it-manager-salaries

---

**Berikutnya:** `21-ekosistem-profesi/05-rumpun-devops-sre` — Rumpun DevOps, SRE & Otomasi: profesi yang mengubah pekerjaan operasional menjadi kode, pipeline, dan target keandalan yang terukur.

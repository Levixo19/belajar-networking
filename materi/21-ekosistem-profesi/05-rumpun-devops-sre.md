# 21.5 — Rumpun DevOps, SRE & Otomasi

> **Prasyarat:** sudah mengikuti blok otomasi (`15-otomasi/01-mengapa-otomasi` sampai `15-otomasi/04-ansible-cicd`), observability (`14-monitoring-troubleshooting/03-observability`), dan jaringan cloud serta container (`16-datacenter-cloud-sdn/04-cloud-networking`, `16-datacenter-cloud-sdn/05-container-kubernetes`). Akan lebih terasa bila Anda sudah mengerjakan `20-proyek-akhir/08-babak-7-kode-yang-menjaga` dan `20-proyek-akhir/09-babak-8-malam-panjang`.
> **Tujuan:** Anda memahami empat profesi dalam rumpun Otomatisasi & Integrasi Modern (DevOps Engineer, Site Reliability Engineer, Cloud Infrastructure Engineer, Automation Engineer), tahu apa yang benar-benar mereka kerjakan dan bagaimana keberhasilannya diukur, sertifikasi mana yang masih berlaku per 2026, dan bagaimana seorang network engineer atau network administrator bisa menyeberang ke rumpun ini secara realistis.

---

## 1. Kenapa Rumpun Ini Ada

Sepuluh tahun lalu, sebagian besar infrastruktur di Indonesia dikelola dengan tangan: admin login ke server satu per satu, network engineer mengetik konfigurasi di CLI router, dan rilis aplikasi dilakukan malam Minggu dengan daftar langkah di spreadsheet. Cara itu masih ada, tetapi tidak lagi cukup ketika sebuah aplikasi e-commerce harus menahan lonjakan trafik Harbolnas 12.12, aplikasi travel harus siap menghadapi musim mudik Lebaran, dan bank digital merilis fitur beberapa kali seminggu.

Dua hal mempercepat pergeseran ini di Indonesia. Pertama, hyperscaler membuka region di dalam negeri: AWS meluncurkan region Asia Pacific (Jakarta) `ap-southeast-3` pada Desember 2021, dan Microsoft membuka region Azure Indonesia Central dengan tiga availability zone pada 2025. Data bisa tinggal di Indonesia, sehingga bank, BUMN, dan instansi yang terikat aturan residensi data mulai bermigrasi. Kedua, perusahaan teknologi lokal tumbuh sampai skala ribuan layanan mikro, dan skala sebesar itu mustahil dikelola tanpa kode.

Rumpun ini berisi orang-orang yang **memperlakukan infrastruktur sebagai perangkat lunak**: konfigurasinya disimpan di Git, perubahannya ditinjau lewat pull request, diuji otomatis, dan diterapkan oleh pipeline. Bedanya dengan rumpun inti jaringan bukan pada pengetahuan (subnetting, BGP, DNS tetap wajib), melainkan pada **cara kerja**.

### Tabel ringkas perbandingan profesi

| Aspek | DevOps Engineer | Site Reliability Engineer (SRE) | Cloud Infrastructure Engineer | Automation Engineer (NetDevOps) |
|---|---|---|---|---|
| Pertanyaan utama | "Bagaimana kode sampai ke produksi dengan cepat dan aman?" | "Seberapa andal layanan ini, dan kapan kita boleh mengambil risiko?" | "Fondasi cloud apa yang aman, hemat, dan bisa diulang?" | "Pekerjaan manual apa di jaringan yang bisa dijadikan kode?" |
| Objek kerja utama | Pipeline CI/CD, container, lingkungan staging/produksi | SLO, alerting, on-call, postmortem, kapasitas | Akun/subscription cloud, VPC/VNet, IAM, landing zone | Router, switch, firewall, source of truth, playbook |
| Ukuran keberhasilan | Metrik DORA (lead time, frekuensi deploy, change fail rate) | SLO terpenuhi, error budget, MTTR, porsi toil | Biaya per beban kerja, temuan keamanan, waktu provisioning | Persentase perubahan otomatis, drift konfigurasi, insiden akibat salah ketik |
| Bahasa/alat khas | YAML pipeline, Docker, Kubernetes, Terraform | Prometheus, Grafana, OpenTelemetry, Python/Go | Terraform/OpenTofu, CLI cloud, Pulumi | Python, Ansible, Netmiko/Nornir, NetBox |
| Posisi masuk realistis | Menengah (dari sysadmin/developer) | Menengah (dari sysadmin/DevOps/backend) | Pemula sampai menengah | Menengah (dari network engineer) |
| Sertifikasi kunci 2026 | Terraform Associate (004), CKA, AWS DOP-C02, AZ-400 | CKA, Prometheus Certified Associate, Google Professional Cloud DevOps Engineer | AWS SAA-C03, AWS CloudOps Engineer (SOA-C03), AZ-104, Google ACE | CCNA Automation (200-901), CCNP Automation (350-901 AUTOCOR), RHCE in Ansible |

💡 **Batas antarprofesi di dunia nyata kabur.** Di startup 50 orang, satu orang bisa memegang keempat peran sekaligus dengan jabatan "DevOps Engineer". Di perusahaan teknologi besar, peran ini dipisah dan bahkan dipecah lagi menjadi tim *platform*, tim *observability*, tim *cloud foundation*, dan tim *network automation*. Baca deskripsi pekerjaan, bukan hanya judulnya.

---

## 2. Bahasa Bersama Rumpun Ini

Sebelum masuk ke tiap profesi, ada beberapa konsep yang dipakai oleh keempatnya. Kalau Anda menguasai konsep ini, Anda bisa mengikuti percakapan di rapat tim mana pun dalam rumpun ini.

### 2.1 Metrik DORA: mengukur kemampuan mengirim perubahan

DORA (DevOps Research and Assessment) adalah program riset yang selama bertahun-tahun mengukur kinerja tim pengiriman perangkat lunak. Saat ini DORA mendefinisikan **lima metrik**, dibagi dua kelompok:

| Kelompok | Metrik | Definisi singkat |
|---|---|---|
| Throughput | Change lead time | Waktu dari perubahan di-commit ke version control sampai berjalan di produksi |
| Throughput | Deployment frequency | Jumlah deploy dalam periode tertentu (atau jarak antardeploy) |
| Throughput | Failed deployment recovery time | Waktu pulih dari deploy gagal yang butuh intervensi segera |
| Instabilitas | Change fail rate | Rasio deploy yang butuh intervensi segera (rollback atau hotfix) |
| Instabilitas | Deployment rework rate | Rasio deploy tak terencana yang terjadi akibat insiden produksi |

⚠️ **Banyak materi lama masih menyebut "empat metrik DORA" dengan MTTR.** Definisi terkini di dora.dev memakai lima metrik di atas, dan "MTTR" diganti istilah yang lebih sempit: *failed deployment recovery time*. Kalau di wawancara Anda menyebut empat metrik lama, tidak salah total, tetapi menyebut pembaruannya menunjukkan Anda mengikuti perkembangan.

Laporan DORA 2025 berjudul *State of AI-assisted Software Development*. Pesan utamanya: AI berperan sebagai **penguat** (amplifier). Tim dengan fondasi rapi (pipeline otomatis, pengujian baik, platform internal yang jelas) makin cepat; tim yang berantakan makin cepat berantakan.

### 2.2 Prinsip SRE dari Google

Buku *Site Reliability Engineering* (Google, tersedia gratis di sre.google) memperkenalkan kosakata yang sekarang dipakai luas:

- **SLI (Service Level Indicator):** ukuran kuantitatif yang didefinisikan cermat untuk satu aspek layanan, misalnya persentase permintaan HTTP yang berhasil, atau latensi persentil ke-99.
- **SLO (Service Level Objective):** nilai target untuk SLI. Contoh: "99,9% permintaan checkout berhasil dalam jendela 28 hari."
- **SLA (Service Level Agreement):** kontrak dengan pengguna yang berisi konsekuensi bila SLO di dalamnya tidak terpenuhi. Kalau tidak ada konsekuensi (denda, kompensasi), itu SLO, bukan SLA.
- **Error budget:** selisih antara 100% dan SLO. SLO 99,9% berarti ada anggaran 0,1% "ketidakandalan" yang boleh dipakai. Selama anggaran masih ada, tim boleh merilis fitur baru. Bila habis, rilis diperlambat dan fokus pindah ke keandalan.
- **Toil:** pekerjaan operasional yang manual, berulang, bisa diotomasi, reaktif, tidak meninggalkan nilai jangka panjang, dan bertambah linear seiring layanan tumbuh. Google menetapkan target bahwa **setidaknya 50% waktu SRE** dipakai untuk pekerjaan rekayasa yang mengurangi toil atau menambah fitur layanan.
- **Postmortem tanpa menyalahkan (blameless postmortem):** setelah insiden, tim menulis analisis yang mencari faktor penyebab sistemik tanpa menuding individu. Pemicu umum: downtime yang terlihat pengguna di atas ambang, kehilangan data, intervensi on-call (rollback, pengalihan trafik), waktu pemulihan di atas ambang, atau kegagalan monitoring.

Contoh hitungan sederhana: layanan pembayaran QRIS internal dengan SLO ketersediaan 99,9% per 30 hari. Total menit dalam 30 hari = 43.200 menit. Error budget = 0,1% x 43.200 = **43,2 menit**. Jika minggu pertama sudah ada gangguan 30 menit akibat deploy gagal, tim tinggal punya sekitar 13 menit untuk sisa bulan. Keputusan "tunda rilis besar sampai bulan depan" sekarang punya dasar angka, bukan sekadar perasaan.

### 2.3 CI/CD dan Infrastructure as Code (IaC)

- **CI (Continuous Integration):** setiap perubahan kode digabung sering dan diuji otomatis (lint, unit test, build image).
- **CD (Continuous Delivery/Deployment):** hasil build bisa (delivery) atau langsung (deployment) dikirim ke produksi lewat pipeline yang konsisten. Alat umum: GitHub Actions, GitLab CI, Jenkins, Argo CD (pola GitOps), Azure Pipelines.
- **IaC:** infrastruktur dideklarasikan dalam berkas teks.
  - **Terraform** (HashiCorp, sekarang bagian dari IBM sejak akuisisi selesai Februari 2025). Pada 2023 HashiCorp mengganti lisensi Terraform dari MPL 2.0 ke Business Source License (BSL).
  - **OpenTofu**, fork Terraform yang lahir sebagai respons atas perubahan lisensi itu, dikelola di bawah Linux Foundation dan diterima di CNCF sebagai proyek Sandbox pada April 2025. Sintaksnya (HCL) sama, sehingga keterampilan Terraform langsung terpakai.
  - **Pulumi**: IaC memakai bahasa pemrograman umum (Python, TypeScript, Go), cocok untuk tim yang lebih nyaman menulis kode daripada HCL.
  - **Ansible**: manajemen konfigurasi berbasis playbook YAML tanpa agen, sangat populer untuk server Linux dan perangkat jaringan.

Detail teknis Terraform, Ansible, dan CI/CD untuk jaringan sudah dibahas di `15-otomasi/04-ansible-cicd`. Modul ini fokus pada profesinya.

### 2.4 Observability

Tiga pilar (metrik, log, trace) dibahas di `14-monitoring-troubleshooting/03-observability`. Di rumpun ini, stack yang paling sering Anda temui:

- **Prometheus** untuk metrik dan aturan alert, **Alertmanager** untuk routing notifikasi.
- **Grafana** untuk dashboard (juga Loki untuk log, Tempo untuk trace).
- **OpenTelemetry** sebagai standar terbuka untuk mengumpulkan metrik, log, dan trace dari aplikasi. Proyek ini naik ke status *Graduated* di CNCF pada Mei 2026, artinya sudah dianggap matang dan banyak dipakai.
- Platform komersial (Datadog, New Relic, Elastic, Dynatrace) banyak dipakai perusahaan yang tidak ingin mengelola stack sendiri.

---

## 3. DevOps Engineer

### 3.1 Apa yang sebenarnya dikerjakan

"DevOps" awalnya adalah budaya kolaborasi antara tim pengembang dan tim operasi, bukan jabatan. Tetapi di pasar kerja Indonesia, "DevOps Engineer" adalah salah satu judul lowongan infrastruktur paling umum. Dalam praktik, orang ini membangun dan merawat **jalan tol dari laptop developer ke produksi**.

Contoh satu hari DevOps Engineer di sebuah fintech pembayaran di Jakarta:

- **09.00** Stand-up dengan tim squad. Developer melaporkan pipeline build untuk layanan `merchant-settlement` sering gagal karena cache dependensi rusak. Anda mengambil tiketnya.
- **09.30** Memperbaiki konfigurasi GitLab CI: memisahkan cache per branch, menambahkan langkah pemindaian kerentanan image (Trivy) yang sebelumnya dilewati.
- **11.00** Meninjau pull request Terraform dari rekan: penambahan database PostgreSQL terkelola untuk layanan baru. Anda menemukan security group yang membuka port 5432 ke `0.0.0.0/0` dan meminta perbaikan.
- **13.30** Rapat dengan tim keamanan soal penyimpanan secret: memindahkan kredensial yang masih tertulis di variabel CI ke HashiCorp Vault atau secret manager milik cloud.
- **15.00** Menyiapkan strategi rilis canary di Kubernetes untuk fitur QRIS baru: 5% trafik dulu, pantau tingkat error di Grafana, lalu naik bertahap.
- **17.00** Menulis dokumentasi runbook rollback, karena besok rilis jatuh pada akhir bulan saat volume transaksi tinggi.

Perhatikan bahwa sebagian besar pekerjaan berupa **kode dan peninjauan**, bukan klik di konsol.

### 3.2 Tanggung jawab dan ukuran keberhasilan

Tanggung jawab inti:
- Merancang dan merawat pipeline CI/CD.
- Mengemas aplikasi ke container dan mengelola deployment (sering di Kubernetes).
- Menulis dan meninjau IaC untuk lingkungan dev, staging, dan produksi.
- Menyediakan observability dasar bagi tiap layanan (metrik, log, dashboard).
- Mengintegrasikan pemeriksaan keamanan ke pipeline (sering disebut DevSecOps).

Ukuran keberhasilan yang lazim:
- **Metrik DORA**: lead time turun, frekuensi deploy naik, change fail rate turun.
- Waktu build pipeline (misalnya dari 25 menit ke 8 menit).
- Persentase infrastruktur yang dikelola lewat IaC (bukan dibuat manual di konsol).
- Waktu yang dibutuhkan developer baru sampai bisa deploy pertama kali.

### 3.3 Keahlian dan alat

Teknis:
- Linux yang kuat (proses, systemd, berkas, izin, jaringan dasar dengan `ip`, `ss`, `dig`, `curl`).
- Git dan alur kerja pull request.
- Satu bahasa skrip (Python atau Bash; Go menjadi nilai tambah).
- Container (Docker/Podman) dan Kubernetes (Deployment, Service, Ingress, ConfigMap, Secret).
- Satu cloud publik secara mendalam.
- Terraform/OpenTofu dan Ansible.
- Pemahaman jaringan aplikasi: DNS, load balancer L4/L7, TLS, HTTP. Banyak masalah "pipeline jalan tapi aplikasi tidak bisa diakses" ternyata masalah DNS, sertifikat, atau aturan firewall.

Non-teknis:
- Menjelaskan trade-off kepada developer tanpa menggurui.
- Menulis dokumentasi dan runbook yang bisa diikuti orang lain jam 2 pagi.
- Disiplin manajemen perubahan.

Alat umum: GitLab CI, GitHub Actions, Jenkins, Argo CD, Docker, Kubernetes, Helm, Terraform/OpenTofu, Ansible, Vault, Prometheus, Grafana, SonarQube, Trivy.

### 3.4 Sertifikasi relevan (status 2026)

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | HashiCorp Certified: Terraform Associate (004) | Versi 004 berlaku sejak 8 Januari 2026, menguji Terraform 1.12; versi 003 dipensiunkan |
| Menengah | Certified Kubernetes Administrator (CKA) atau Certified Kubernetes Application Developer (CKAD) | Ujian praktik di command line, 2 jam, berlaku 2 tahun |
| Menengah | AWS Certified Solutions Architect Associate (SAA-C03), atau Microsoft Azure Administrator Associate (AZ-104) | Pilih sesuai cloud yang dipakai calon pemberi kerja |
| Senior | AWS Certified DevOps Engineer Professional (DOP-C02) | Disarankan 2 tahun atau lebih mengelola lingkungan AWS |
| Senior | Microsoft Certified: DevOps Engineer Expert (ujian AZ-400) | Prasyarat: Azure Administrator Associate atau Azure Developer Associate |

Jalur kompetensi Indonesia: sampai Oktober 2026 kami tidak menemukan SKKNI yang khusus berjudul DevOps. Yang paling dekat adalah **SKKNI Bidang Cloud Computing** (Kepmenaker Nomor 102 Tahun 2023), yang memuat unit seperti menyiapkan dan menerapkan adaptasi untuk deployment di sistem cloud, serta **SKKNI Bidang Administrasi Sistem** (Kepmenaker Nomor 82 Tahun 2017). Cek ketersediaan skema di LSP berlisensi BNSP sebelum mendaftar.

### 3.5 Jalur masuk dan progresi

Jalur masuk paling umum di Indonesia:
1. **Dari system administrator Linux**: sudah paham server, tinggal menambah Git, container, dan pipeline.
2. **Dari backend developer**: sudah paham kode, tinggal menambah Linux, jaringan, dan cloud.
3. **Dari network engineer**: lebih jarang, tetapi makin banyak, terutama di perusahaan yang menggabungkan tim infrastruktur. Kelebihan Anda: troubleshooting jaringan yang sering jadi titik buta tim DevOps.

Lowongan "Junior DevOps" ada, tetapi biasanya meminta pengalaman setara sysadmin atau developer 1 tahun. Progresi: DevOps Engineer, Senior DevOps, lalu bercabang ke **Platform Engineer / Lead** (membangun platform internal untuk developer), **SRE**, atau **Solution Architect**. Sebagai gambaran jenjang manajerial, Michael Page Indonesia mencatat rata-rata gaji DevOps Manager sebesar IDR 40 juta per bulan dan Head of DevOps IDR 75 juta per bulan (Salary Comparison Tool 2026, gaji pokok tanpa bonus).

### 3.6 Konteks pasar kerja Indonesia

Perusahaan yang merekrut DevOps Engineer:
- **Unicorn dan startup** (ride-hailing, e-commerce, travel, edutech, healthtech).
- **Fintech dan bank digital**: tuntutan rilis cepat bertemu regulasi ketat.
- **Bank konvensional dan BUMN** yang sedang membangun tim transformasi digital, biasanya dengan proses persetujuan perubahan yang lebih panjang.
- **System integrator dan konsultan cloud** (mitra AWS, Google Cloud, Microsoft) yang mengerjakan proyek migrasi untuk klien.
- **Software house** yang melayani klien luar negeri.

Data Jobstreet Indonesia (berdasarkan rentang gaji yang dicantumkan pemberi kerja di iklan) menunjukkan rentang tipikal DevOps Engineer sekitar **Rp 7,06 juta sampai Rp 8,88 juta per bulan** secara nasional, dengan Jakarta Raya di kisaran Rp 8,5 juta sampai Rp 11,5 juta (diakses Oktober 2026).

⚠️ **Baca angka gaji dari iklan dengan hati-hati.** Perusahaan yang mencantumkan gaji di iklan cenderung perusahaan menengah dan kecil; perusahaan teknologi besar jarang mencantumkannya. Rentang aktual untuk posisi senior di perusahaan besar bisa jauh berbeda. Jangan memakai satu angka sebagai patokan negosiasi tanpa membandingkan beberapa sumber.

### 3.7 Belajar dari kurikulum ini

- `13-linux-networking/01-iproute2` dan `13-linux-networking/02-virtual-networking`: jaringan di dalam host dan container.
- `06-aplikasi/01-dns`, `06-aplikasi/03-http`, `06-aplikasi/04-tls-pki`: tiga sumber masalah deploy yang paling sering.
- `15-otomasi/02-data-dan-api`: YAML, JSON, dan REST API, makanan sehari-hari pipeline.
- `15-otomasi/04-ansible-cicd`: Ansible, Terraform, Git, dan CI/CD.
- `16-datacenter-cloud-sdn/04-cloud-networking` dan `16-datacenter-cloud-sdn/05-container-kubernetes`.
- `14-monitoring-troubleshooting/03-observability`.
- `20-proyek-akhir/08-babak-7-kode-yang-menjaga`: latihan menulis pipeline yang menjaga konfigurasi.

### 3.8 Proyek portofolio dan pertanyaan wawancara

Proyek:
1. **Pipeline lengkap untuk aplikasi kecil**: aplikasi web sederhana (misalnya katalog UMKM) dengan GitHub Actions yang menjalankan test, membangun image, memindai kerentanan, lalu deploy ke cluster k3s atau kind. Sertakan README berisi diagram alur dan cara rollback.
2. **Lingkungan cloud dengan Terraform**: VPC, subnet publik/privat, NAT, load balancer, dan satu VM atau container service, semuanya dari kode. Tambahkan `terraform plan` otomatis di setiap pull request.
3. **Observability dasar**: Prometheus + Grafana untuk aplikasi tadi, dengan satu dashboard dan dua aturan alert yang masuk akal.

Pertanyaan wawancara khas:
- "Pipeline Anda berhasil, tapi pengguna melaporkan error 502 setelah deploy. Apa langkah Anda?"
- "Bagaimana Anda menyimpan secret agar tidak bocor di repositori atau log CI?"
- "Jelaskan perbedaan rolling update, blue-green, dan canary. Kapan memilih masing-masing?"

---

## 4. Site Reliability Engineer (SRE)

### 4.1 Apa yang sebenarnya dikerjakan

Google mendeskripsikan SRE sebagai "apa yang terjadi bila Anda meminta software engineer merancang tim operasi". SRE bertanggung jawab atas **keandalan layanan produksi**, tetapi dengan cara rekayasa: mengukur, menetapkan target, mengotomasi, dan belajar dari insiden.

Contoh satu minggu SRE di platform e-commerce menjelang 12.12:

- **Senin**: meninjau laporan SLO bulanan. Layanan pencarian produk memakai 70% error budget bulan ini, kebanyakan karena satu node database yang lambat. Anda mengusulkan pembekuan fitur sementara untuk layanan itu sampai perbaikan indeks selesai.
- **Selasa**: uji beban (load test) bersama tim backend dengan perkiraan trafik puncak dari tim pemasaran. Ditemukan connection pool ke Redis habis pada 3x trafik normal. Anda menulis tiket perbaikan dan menambah alert untuk saturasi pool.
- **Rabu**: giliran on-call. Pukul 02.10 alert berbunyi: tingkat error checkout naik ke 4%. Anda membuka dashboard, melihat lonjakan bertepatan dengan deploy layanan promo pukul 01.55, melakukan rollback, dan error turun dalam 6 menit. Anda mencatat linimasa di kanal insiden.
- **Kamis**: memimpin postmortem tanpa menyalahkan. Akar masalah: konfigurasi feature flag tidak diuji di staging karena staging tidak punya data promo. Tindak lanjut: menambah data sintetis di staging dan gerbang otomatis di pipeline.
- **Jumat**: mengerjakan proyek pengurangan toil, yaitu skrip yang otomatis menambah kapasitas node pool sebelum jam promo terjadwal, sehingga tim tidak perlu melakukannya manual.

Perusahaan travel juga menghadapi pola serupa. Dalam wawancara di blog AWS Startups (2019), Traveloka menyebut musim akhir tahun dan Ramadan sebagai puncak trafik yang kini butuh persiapan sekitar sebulan, dan visibilitas sistem lewat monitoring dan logging sebagai pelajaran teknis terpenting mereka.

### 4.2 Tanggung jawab dan ukuran keberhasilan

Tanggung jawab inti:
- Mendefinisikan SLI dan SLO bersama tim produk, lalu memantau error budget.
- Merancang alerting yang berbasis gejala pengguna (bukan sekadar "CPU 80%").
- Menjalankan dan memperbaiki proses on-call serta manajemen insiden.
- Memimpin postmortem dan memastikan tindak lanjutnya dikerjakan.
- Perencanaan kapasitas dan uji beban.
- Mengurangi toil dengan otomasi.

Ukuran keberhasilan:
- **SLO terpenuhi** dan error budget dikelola, bukan dihabiskan tanpa sadar.
- **MTTD dan MTTR**: waktu mendeteksi dan memulihkan insiden.
- Jumlah alert per giliran on-call (terlalu banyak alert berarti alert fatigue).
- **Porsi waktu untuk toil** (target Google: maksimal 50%, sisanya rekayasa).
- Persentase tindak lanjut postmortem yang benar-benar selesai.

💡 **SLO yang baik dimulai dari pengalaman pengguna.** "Halaman checkout berhasil dimuat di bawah 800 ms untuk 99% permintaan" jauh lebih berguna daripada "server uptime 99,99%". Server bisa hidup sementara pengguna tetap gagal bayar karena DNS, sertifikat, atau gateway pembayaran bermasalah.

### 4.3 Keahlian dan alat

Teknis:
- Sistem terdistribusi: load balancing, replikasi, antrian, cache, timeout dan retry.
- Linux dan jaringan pada level troubleshooting: `tcpdump`, `ss`, `dig`, `mtr`, membaca handshake TCP dan TLS.
- Observability mendalam: PromQL, desain dashboard, tracing terdistribusi.
- Pemrograman (Python atau Go) untuk alat internal.
- Kubernetes dan cloud.
- Statistik dasar: persentil, distribusi latensi, kenapa rata-rata menipu.

Non-teknis:
- Tenang dan sistematis saat insiden.
- Komunikasi insiden: pembaruan singkat dan rutin kepada pemangku kepentingan.
- Fasilitasi postmortem yang tidak menyalahkan orang.
- Negosiasi dengan tim produk soal risiko dan prioritas.

Alat umum: Prometheus, Alertmanager, Grafana, Loki, Tempo atau Jaeger, OpenTelemetry, PagerDuty atau Opsgenie, k6 atau Locust untuk uji beban, Kubernetes, Terraform, Datadog.

### 4.4 Sertifikasi relevan (status 2026)

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | Prometheus Certified Associate (PCA), Linux Foundation | Pilihan ganda, 90 menit, berlaku 2 tahun |
| Pemula | OpenTelemetry Certified Associate (OTCA), Linux Foundation | Pilihan ganda, 90 menit, berlaku 2 tahun |
| Menengah | Certified Kubernetes Administrator (CKA) | Domain *Troubleshooting* berbobot 30%, paling besar |
| Senior | Google Cloud Professional Cloud DevOps Engineer | Secara eksplisit menguji praktik SRE; disarankan 3 tahun pengalaman industri |
| Senior | Certified Kubernetes Security Specialist (CKS) | Wajib lulus CKA terlebih dahulu |

Tidak ada sertifikasi "SRE" yang diakui luas seperti CCNA di jaringan. Pewawancara SRE jauh lebih menilai cerita insiden nyata dan cara Anda berpikir daripada daftar sertifikat. Dari sisi SKKNI, unit "Memantau Sarana dan Prasarana Agar Bisa Digunakan oleh Pengguna Sesuai SLA" dan "Mengelola Insiden pada Sistem Cloud" di SKKNI Cloud Computing (Kepmenaker 102/2023) paling dekat dengan pekerjaan SRE.

### 4.5 Jalur masuk dan progresi

SRE jarang menjadi pekerjaan pertama. Jalur yang lazim:
- Sysadmin atau DevOps Engineer yang sudah sering menangani insiden produksi.
- Backend engineer yang tertarik pada performa dan keandalan.
- **NOC engineer atau network engineer** yang sudah terbiasa on-call, membaca grafik trafik, dan menangani gangguan. Kebiasaan troubleshooting bermetodologi (`14-monitoring-troubleshooting/01-metodologi`) adalah modal besar. Yang perlu ditambah: kemampuan menulis kode dan pemahaman arsitektur aplikasi.

Progresi: SRE, Senior SRE, Staff/Principal SRE (memengaruhi arsitektur lintas tim), atau jalur manajerial ke SRE Manager dan Head of Infrastructure/Reliability.

### 4.6 Konteks pasar kerja Indonesia

Judul "SRE" paling banyak muncul di perusahaan teknologi berskala besar (super-app, e-commerce, travel, bank digital, fintech pembayaran) karena di sanalah skala membuat pendekatan SRE masuk akal. Di perusahaan menengah, pekerjaan SRE sering dikerjakan oleh tim DevOps atau tim "Infrastructure" tanpa judul SRE. Operator seluler dan penyedia data center juga mulai memakai istilah dan praktik SRE untuk platform digital mereka.

Kami tidak menemukan sumber publik terverifikasi yang memisahkan data gaji SRE di Indonesia, sehingga modul ini tidak mencantumkan angka untuk peran ini.

### 4.7 Belajar dari kurikulum ini

- `00-fondasi/03-sinyal-bandwidth-latency`: latensi, jitter, throughput, dasar memahami SLI.
- `05-transport/02-tcp` dan `05-transport/04-congestion-control`: timeout, retransmisi, MTU, dan bufferbloat sering jadi akar insiden "lambat".
- `06-aplikasi/01-dns`: DNS adalah penyebab klasik insiden besar.
- `14-monitoring-troubleshooting/01-metodologi`, `14-monitoring-troubleshooting/03-observability`, `14-monitoring-troubleshooting/04-studi-kasus`.
- `16-datacenter-cloud-sdn/05-container-kubernetes`.
- `20-proyek-akhir/09-babak-8-malam-panjang`: simulasi malam insiden dan penulisan postmortem.

### 4.8 Proyek portofolio dan pertanyaan wawancara

Proyek:
1. **SLO untuk layanan buatan sendiri**: aplikasi kecil yang diinstrumentasi OpenTelemetry, metrik masuk ke Prometheus, dashboard SLO di Grafana dengan perhitungan error budget dan alert *burn rate*.
2. **Postmortem dari kekacauan terencana**: jalankan chaos experiment sederhana di lab (matikan satu replika, sisipkan latensi dengan `tc netem`), lalu tulis postmortem lengkap: linimasa, dampak, faktor penyebab, tindak lanjut.
3. **Skrip pengurangan toil**: alat yang mengotomasi satu pekerjaan berulang (misalnya rotasi log, pembersihan image lama, atau pemeriksaan masa berlaku sertifikat TLS) beserta perkiraan jam kerja yang dihemat.

Pertanyaan wawancara khas:
- "Layanan Anda punya SLO 99,95% per 30 hari. Berapa menit error budget-nya, dan apa yang Anda lakukan bila separuhnya habis di minggu pertama?"
- "Ceritakan insiden yang pernah Anda tangani. Apa yang Anda pelajari dan apa yang diubah setelahnya?"
- "Latensi p99 naik tetapi rata-rata latensi stabil. Apa artinya dan bagaimana Anda menyelidikinya?"

---

## 5. Cloud Infrastructure Engineer

### 5.1 Apa yang sebenarnya dikerjakan

Cloud Infrastructure Engineer membangun dan merawat **fondasi** tempat aplikasi berjalan di cloud: struktur akun atau subscription, jaringan virtual, konektivitas ke data center on-premise, identitas dan akses, kebijakan keamanan, serta kontrol biaya. Bedanya dengan DevOps Engineer: DevOps fokus pada aliran perubahan aplikasi, Cloud Infrastructure Engineer fokus pada **landasan** yang dipakai semua aplikasi.

Contoh skenario nyata di sebuah bank yang sedang migrasi sebagian sistem ke region cloud Jakarta:

- Merancang **landing zone**: pemisahan akun untuk produksi, non-produksi, keamanan, dan log; kebijakan organisasi yang melarang resource dibuat di region luar Indonesia untuk data nasabah.
- Merencanakan ruang alamat IP: blok CIDR untuk tiap VPC yang **tidak bertabrakan** dengan jaringan kantor cabang dan data center (kesalahan ini sangat sering terjadi dan mahal diperbaiki).
- Menghubungkan data center ke cloud dengan VPN IPsec sebagai cadangan dan koneksi dedicated (Direct Connect, ExpressRoute, atau Cloud Interconnect) sebagai jalur utama, dengan BGP di atasnya.
- Menulis modul Terraform yang dipakai ulang oleh tim aplikasi, sehingga setiap VPC baru otomatis punya flow log, enkripsi default, dan tag biaya.
- Rapat bulanan dengan tim keuangan membahas tagihan cloud yang naik 30%: ternyata ada cluster non-produksi yang menyala 24 jam dan snapshot lama yang tak pernah dihapus.

### 5.2 Tanggung jawab dan ukuran keberhasilan

Tanggung jawab inti:
- Desain dan implementasi jaringan cloud (VPC/VNet, subnet, routing, peering, transit, NAT, DNS privat).
- Konektivitas hybrid (VPN, koneksi dedicated, BGP).
- IAM: peran, kebijakan *least privilege*, integrasi dengan direktori perusahaan.
- IaC untuk seluruh fondasi.
- Kepatuhan dan keamanan dasar (enkripsi, logging, kebijakan organisasi).
- Optimasi biaya (sering disebut FinOps).

Ukuran keberhasilan:
- Waktu menyediakan lingkungan baru (dari tiket berhari-hari menjadi pull request yang selesai dalam jam).
- Jumlah temuan audit atau temuan keamanan pada konfigurasi cloud.
- Biaya per beban kerja dan persentase resource yang punya tag pemilik.
- Ketersediaan konektivitas hybrid sesuai SLA.

### 5.3 Keahlian dan alat

Teknis:
- **Fondasi jaringan yang kuat**: subnetting dan VLSM, routing, NAT, firewall, VPN, BGP, DNS. Di sinilah network engineer punya keunggulan besar dibanding pelamar yang hanya belajar cloud dari kursus singkat.
- Satu cloud secara mendalam (AWS, Azure, atau Google Cloud), lalu pemahaman konseptual untuk yang lain.
- Terraform/OpenTofu atau Pulumi; templat bawaan cloud (CloudFormation, Bicep) sebagai tambahan.
- IAM dan konsep identitas.
- Linux dan skrip (Bash, Python, PowerShell untuk Azure).

Non-teknis:
- Membaca dan menjelaskan tagihan cloud.
- Menulis dokumen desain dan keputusan arsitektur.
- Bekerja dengan tim keamanan, kepatuhan, dan auditor (terutama di sektor keuangan).

Alat umum: AWS (VPC, Transit Gateway, IAM, CloudWatch), Azure (VNet, Entra ID, Azure Monitor), Google Cloud (VPC, Cloud Interconnect), Terraform/OpenTofu, Pulumi, Ansible, AWS CLI dan Azure CLI, Checkov atau tfsec untuk pemindaian IaC.

### 5.4 Sertifikasi relevan (status 2026)

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | Google Cloud Associate Cloud Engineer | 2 jam, disarankan 6 bulan pengalaman Google Cloud, berlaku 3 tahun |
| Pemula | HashiCorp Terraform Associate (004) | Menguji Terraform 1.12 dan konsep HCP Terraform |
| Menengah | AWS Certified Solutions Architect Associate (SAA-C03) | 65 soal, 130 menit |
| Menengah | AWS Certified CloudOps Engineer Associate (SOA-C03) | Nama baru dari AWS Certified SysOps Administrator Associate; pemegang sertifikat lama tetap berlaku |
| Menengah | Microsoft Certified: Azure Administrator Associate (AZ-104) | Wajib diperbarui tiap 12 bulan lewat asesmen daring gratis |
| Senior | AWS Certified Solutions Architect Professional, atau Google Professional Cloud Architect | Untuk peran desain landing zone dan arsitektur multi-akun |

Jalur kompetensi Indonesia: **SKKNI Bidang Cloud Computing (Kepmenaker Nomor 102 Tahun 2023)** memuat 19 unit kompetensi, antara lain merekayasa arsitektur virtualisasi untuk public/private/hybrid/sovereign cloud, merekayasa arsitektur skalabilitas, membangun topologi jaringan, serta mengelola insiden pada sistem cloud. Ini adalah rujukan resmi paling relevan untuk profesi ini; tanyakan ke LSP berlisensi BNSP di bidang TIK apakah skema berbasis SKKNI tersebut tersedia.

### 5.5 Jalur masuk dan progresi

Ini adalah profesi dalam rumpun ini yang **paling mudah dimasuki dari jaringan**. Banyak lowongan "Cloud Engineer" di system integrator dan mitra cloud yang terbuka untuk lulusan dengan 0 sampai 2 tahun pengalaman, asalkan punya satu sertifikasi associate dan fondasi jaringan yang baik.

Jalur khas: NOC atau network administrator, lalu Cloud Engineer di system integrator (proyek migrasi untuk banyak klien, belajar cepat), lalu Cloud Infrastructure Engineer di perusahaan pengguna akhir (bank, e-commerce), lalu Senior atau Lead, dan akhirnya **Cloud Architect / Solution Architect**. Bila Anda tetap fokus pada sisi jaringan, profesi lateral yang dekat adalah Cloud Network Engineer (dibahas di modul rumpun infrastruktur).

### 5.6 Konteks pasar kerja Indonesia

- **System integrator dan managed service provider** yang menjadi mitra AWS, Microsoft, atau Google Cloud: pintu masuk terbanyak untuk pemula.
- **Penyedia cloud dan data center lokal** (operator telekomunikasi dan anak usahanya, penyedia cloud nasional) yang menjual layanan IaaS.
- **Bank, asuransi, dan BUMN** yang memindahkan beban kerja ke region cloud di Indonesia karena alasan residensi data.
- **Perusahaan teknologi** dengan tim *cloud foundation* atau *platform* sendiri.
- **Instansi pemerintah** dan penyedia Pusat Data Nasional, yang membutuhkan pengelola infrastruktur cloud privat atau pemerintah.

Kami tidak menemukan data gaji publik terverifikasi yang khusus untuk "Cloud Infrastructure Engineer" di Indonesia, sehingga angka tidak dicantumkan.

### 5.7 Belajar dari kurikulum ini

- `04-network-layer/02-subnetting` dan `04-network-layer/03-vlsm-cidr`: perencanaan CIDR untuk VPC.
- `09-nat-acl-firewall/01-nat` dan `09-nat-acl-firewall/03-firewall`: NAT gateway, security group, network ACL.
- `11-wan-vpn/02-tunneling-vpn` dan `07-routing-lanjutan/06-bgp`: konektivitas hybrid.
- `16-datacenter-cloud-sdn/03-storage-virtualisasi` dan `16-datacenter-cloud-sdn/04-cloud-networking`.
- `15-otomasi/04-ansible-cicd`: Terraform.
- `17-desain-arsitektur/03-perencanaan-dokumentasi`: rencana IP dan penamaan, sangat terpakai di landing zone.

### 5.8 Proyek portofolio dan pertanyaan wawancara

Proyek:
1. **Landing zone mini dengan Terraform**: dua VPC (produksi dan non-produksi) dengan rencana CIDR terdokumentasi, peering atau transit, NAT, flow log, dan modul yang bisa dipakai ulang. Semua di free tier atau dihancurkan setelah demo (sertakan perkiraan biaya).
2. **Hybrid lab**: VPN site-to-site dari router di lab rumah (MikroTik CHR atau VyOS) ke cloud, dengan BGP dan uji failover.
3. **Laporan penghematan biaya**: analisis tagihan dari akun lab Anda dengan rekomendasi (rightsizing, jadwal mati otomatis, pembersihan snapshot) dan skrip pendukungnya.

Pertanyaan wawancara khas:
- "Perusahaan punya kantor dengan 10.0.0.0/16 dan akan membuat 20 VPC. Bagaimana Anda merencanakan alamatnya?"
- "Instance di subnet privat tidak bisa mengunduh paket dari internet. Apa saja yang Anda periksa?"
- "Bagaimana Anda mencegah tim membuat resource berisi data nasabah di region luar Indonesia?"

---

## 6. Automation Engineer (Network Automation / NetDevOps)

### 6.1 Apa yang sebenarnya dikerjakan

"Automation Engineer" bisa berarti banyak hal (otomasi pengujian perangkat lunak, otomasi industri/PLC, otomasi proses bisnis/RPA). Dalam kurikulum ini, yang dimaksud adalah **otomasi infrastruktur, terutama jaringan**, yang sering disebut **NetDevOps** atau **Network Automation Engineer**. Profesi ini adalah jembatan paling alami bagi network engineer menuju rumpun DevOps.

Contoh skenario di sebuah ISP regional dengan 400 perangkat (router edge, switch distribusi, OLT):

- **Masalah awal**: setiap pelanggan korporat baru butuh VLAN, subinterface, kebijakan QoS, dan entri BGP. Engineer mengerjakannya manual lewat CLI, rata-rata 45 menit per pelanggan, dan sekitar satu dari dua puluh perubahan mengandung salah ketik.
- **Langkah 1**: membangun **source of truth** di NetBox: semua perangkat, interface, VLAN, dan prefix IP dicatat sebagai data, bukan di spreadsheet yang tersebar.
- **Langkah 2**: menulis templat Jinja2 dan playbook Ansible yang membaca data NetBox lalu menghasilkan konfigurasi. Engineer cukup mengisi formulir pelanggan baru.
- **Langkah 3**: pipeline CI: setiap perubahan templat diuji di lab Containerlab, dicek sintaksnya, dan ditampilkan diff-nya sebelum disetujui.
- **Langkah 4**: pemeriksaan drift harian: skrip Python (Nornir + NAPALM) membandingkan konfigurasi aktual dengan yang seharusnya dan membuka tiket bila berbeda.
- **Hasil**: waktu provisioning turun ke beberapa menit, dan insiden akibat salah konfigurasi menurun.

Sehari-hari, Anda menulis kode Python, membaca dokumentasi API vendor, meninjau pull request dari network engineer lain, dan sering kali **mengajari** rekan yang belum terbiasa dengan Git.

### 6.2 Tanggung jawab dan ukuran keberhasilan

Tanggung jawab inti:
- Membangun dan merawat source of truth jaringan.
- Menulis otomasi untuk provisioning, backup, audit kepatuhan, dan pengumpulan data.
- Mengintegrasikan perangkat lewat API (REST, NETCONF/RESTCONF, gNMI) atau SSH bila tidak ada API.
- Menyusun pipeline CI/CD untuk perubahan jaringan, termasuk pengujian di lab virtual.
- Menyediakan telemetri jaringan ke sistem observability.

Ukuran keberhasilan:
- Persentase perubahan jaringan yang dilakukan lewat otomasi.
- Waktu provisioning layanan baru.
- Jumlah insiden akibat kesalahan manusia.
- Jumlah perangkat yang konfigurasinya sesuai standar (compliance) dan tingkat drift.

### 6.3 Keahlian dan alat

Teknis:
- **Fondasi jaringan sekuat network engineer**: routing (OSPF, BGP), switching (VLAN, STP), keamanan dasar. Otomasi yang ditulis orang yang tidak paham jaringan cenderung berbahaya.
- Python: struktur data, fungsi, penanganan error, pustaka `requests`, Netmiko, NAPALM, Nornir, pyATS.
- Format data: YAML, JSON, XML; model data YANG.
- Ansible (koleksi untuk Cisco, Juniper, Arista, dan RouterOS) dan templat Jinja2.
- Git, pull request, dan CI.
- Lab virtual: Containerlab, GNS3/EVE-NG, Cisco CML.

Non-teknis:
- Kesabaran mengubah kebiasaan tim yang sudah bertahun-tahun bekerja manual.
- Menulis dokumentasi dan "cara pakai" yang ramah bagi engineer non-programmer.
- Memilih apa yang **tidak** perlu diotomasi (tugas yang hanya terjadi setahun sekali sering tidak sepadan).

Alat umum: Python, Ansible, Netmiko, NAPALM, Nornir, NetBox, Containerlab, Batfish, GitLab CI atau GitHub Actions, Jinja2, Postman, Prometheus/Grafana untuk telemetri.

### 6.4 Sertifikasi relevan (status 2026)

Ada perubahan penting yang perlu Anda ketahui: **mulai 3 Februari 2026, Cisco mengganti nama jalur DevNet menjadi jalur Automation**.

| Nama lama | Nama baru (sejak Februari 2026) | Ujian |
|---|---|---|
| Cisco Certified DevNet Associate | **CCNA Automation** | 200-901 CCNAAUTO (Automating Networks Using Cisco Platforms) v1.1 |
| Cisco Certified DevNet Professional | **CCNP Automation** | Inti: 350-901 AUTOCOR (Designing, Deploying, and Managing Network Automation Systems) v2.0, ditambah satu ujian konsentrasi seperti 300-435 ENAUTO atau 300-635 DCNAUTO |
| Cisco Certified DevNet Expert | **CCIE Automation** | Ujian lab expert |

Pemegang sertifikat DevNet lama diperbarui otomatis ke nama baru tanpa ujian ulang. Di tingkat profesional, perubahannya bukan sekadar nama: AUTOCOR menggantikan DEVCOR dan lebih berfokus pada rekayasa otomasi jaringan (infrastructure as code, operasi, dan AI dalam otomasi), bukan pengembangan aplikasi.

Red Hat juga merombak program sertifikasinya pada **11 Mei 2026** menjadi lima jalur spesialisasi (Enterprise Linux, Ansible, OpenShift, Cloud-native Applications, AI). Di jalur Ansible:
- Ujian **EX294** sekarang memberi gelar *Red Hat Certified Advanced System Administrator in Ansible*.
- **RHCE in Ansible** diperoleh dengan lulus EX200 (RHCSA) dan EX294.
- **EX374** (*Red Hat Certified Specialist in Developing Automation with Ansible Automation Platform*) menguji content collection, execution environment, dan automation controller, dan dihitung untuk gelar Red Hat Certified Architect.
- Sertifikasi yang sudah dimiliki tetap diakui dan dipetakan ke struktur baru.

Ringkasan per jenjang:

| Jenjang | Sertifikasi |
|---|---|
| Pemula | CCNA Automation (200-901 CCNAAUTO); HashiCorp Terraform Associate (004) |
| Menengah | CCNP Automation (350-901 AUTOCOR + konsentrasi); RHCE in Ansible (EX200 + EX294) |
| Senior | Red Hat EX374; CCIE Automation |

⚠️ **Hati-hati dengan materi belajar lama.** Banyak kursus dan buku masih memakai nama "DevNet Associate (DEVASC)" dan "RHCE EX294 untuk RHEL 8/9". Isinya sebagian besar masih berguna, tetapi selalu cocokkan dengan daftar topik ujian terbaru di situs Cisco dan Red Hat sebelum mendaftar.

Jalur kompetensi Indonesia: belum ada SKKNI khusus otomasi jaringan yang kami temukan. Untuk fondasi jaringannya, gunakan skema berbasis SKKNI jaringan yang dibahas di modul rumpun inti, dan untuk otomasi lampirkan portofolio kode sebagai bukti.

### 6.5 Jalur masuk dan progresi

Jalur paling realistis justru dari dalam: **network engineer yang mulai mengotomasi pekerjaannya sendiri**. Skrip backup konfigurasi, lalu playbook VLAN, lalu pipeline, lalu tiba-tiba Anda adalah "orang otomasi" di tim. Banyak perusahaan tidak membuka lowongan "Automation Engineer" untuk pemula; mereka mempromosikan atau memindahkan engineer yang sudah terbukti.

Progresi: Network Automation Engineer, Senior, lalu **Network Architect** (merancang jaringan yang memang siap diotomasi), atau berpindah ke **SRE / Platform Engineer** bila Anda makin tertarik pada sisi perangkat lunak.

### 6.6 Konteks pasar kerja Indonesia

- **ISP dan operator seluler**: ribuan perangkat, provisioning pelanggan berulang, cocok untuk otomasi.
- **Bank dan BUMN** dengan jaringan cabang besar dan tuntutan audit kepatuhan konfigurasi.
- **System integrator** yang menjual solusi otomasi atau SDN dari vendor (Cisco, Juniper, Arista, Fortinet).
- **Penyedia data center dan cloud** dengan fabric spine-leaf yang dikelola lewat controller dan API.
- **Perusahaan teknologi besar** yang memiliki tim network engineering internal.

Data gaji publik khusus untuk Network Automation Engineer di Indonesia belum kami temukan dari sumber yang bisa diverifikasi.

### 6.7 Belajar dari kurikulum ini

- `15-otomasi/01-mengapa-otomasi`, `15-otomasi/02-data-dan-api`, `15-otomasi/03-python-jaringan`, `15-otomasi/04-ansible-cicd`: inti seluruh profesi ini.
- `16-datacenter-cloud-sdn/06-sdn`: controller dan API.
- `19-mikrotik/07-monitoring-scripting`: otomasi di ekosistem MikroTik yang sangat umum di ISP lokal.
- `lab/05-lab-linux-otomasi`: backup multi-perangkat dengan Python dan playbook Ansible.
- `20-proyek-akhir/08-babak-7-kode-yang-menjaga`: source of truth, templat, playbook idempoten, audit kepatuhan sebagai kode.

### 6.8 Proyek portofolio dan pertanyaan wawancara

Proyek:
1. **NetBox sebagai source of truth + Ansible**: topologi Containerlab berisi beberapa router (misalnya FRR atau cEOS), data di NetBox, playbook yang menghasilkan dan menerapkan konfigurasi OSPF/BGP dari data tersebut.
2. **Pipeline CI untuk jaringan**: setiap pull request menjalankan lint YAML, render templat, deploy ke lab Containerlab, lalu uji otomatis (adjacency OSPF terbentuk, ping antarloopback berhasil). Gagal uji berarti tidak boleh di-merge.
3. **Audit kepatuhan RouterOS atau Cisco**: skrip Python yang memeriksa ratusan konfigurasi terhadap standar (SSH saja, NTP terpasang, SNMPv3, banner) dan menghasilkan laporan HTML.

Pertanyaan wawancara khas:
- "Playbook Anda dijalankan dua kali. Apa yang dimaksud idempoten, dan bagaimana Anda memastikannya?"
- "Perangkat lama tidak punya API. Bagaimana Anda tetap mengotomasinya dengan aman?"
- "Bagaimana Anda mencegah satu kesalahan di templat langsung menjatuhkan 300 router sekaligus?"

---

## 7. Menyeberang dari Network Engineer: Peta Realistis

Banyak pembaca kurikulum ini adalah network engineer atau administrator yang ingin masuk ke rumpun ini. Kabar baiknya: fondasi Anda jarang dimiliki pelamar dari jalur developer. Kabar kurang enaknya: Anda perlu membangun kebiasaan baru, bukan hanya menghafal alat.

Peta enam sampai dua belas bulan yang realistis, sambil tetap bekerja:

| Bulan | Fokus | Bukti yang dihasilkan |
|---|---|---|
| 1-2 | Linux harian dan Git. Kerjakan semua tugas lab lewat terminal, simpan konfigurasi di repositori. | Repositori GitHub berisi konfigurasi lab dan README |
| 3-4 | Python untuk jaringan: Netmiko, parsing output, YAML. | Skrip backup konfigurasi dan laporan inventaris (`lab/05-lab-linux-otomasi`) |
| 5-6 | Ansible + templat Jinja2 + NetBox. | Playbook provisioning VLAN atau OSPF dari source of truth |
| 7-8 | Container dan Kubernetes dasar, satu cloud publik. | Aplikasi kecil di cluster lokal; VPC dengan Terraform |
| 9-10 | CI/CD dan observability. | Pipeline yang menguji perubahan jaringan; dashboard Grafana |
| 11-12 | Satu sertifikasi terarah (CCNA Automation, Terraform Associate, atau cloud associate) dan mulai melamar. | Sertifikat + portofolio terdokumentasi |

💡 **Mulailah dari pekerjaan Anda sendiri.** Cara tercepat membuktikan diri adalah mengotomasi satu hal yang menyebalkan di kantor: backup konfigurasi harian, laporan utilisasi link mingguan, atau pengecekan masa berlaku sertifikat. Satu otomasi kecil yang dipakai tim setiap hari lebih meyakinkan pewawancara daripada lima kursus daring.

⚠️ **Jangan menjalankan otomasi langsung ke produksi tanpa izin dan tanpa lab.** Skrip yang salah bisa mengubah 300 perangkat dalam 30 detik. Mulai dari mode baca saja (mengambil data), lalu perubahan di lab, lalu perubahan kecil di produksi dengan persetujuan dan rencana rollback. Prinsip manajemen perubahan di `15-otomasi/04-ansible-cicd` berlaku penuh.

Arah sebaliknya juga terjadi: DevOps Engineer atau SRE yang menyadari bahwa banyak insiden mereka berakar di jaringan (DNS, MTU, BGP, firewall), lalu memperdalam fondasi jaringan lewat kurikulum ini. Kombinasi keduanya, orang yang bisa membaca `tcpdump` sekaligus menulis modul Terraform, termasuk yang paling dicari.

---

## 8. Jebakan Umum

- **Mengoleksi alat, bukan memahami masalah.** Menyebut 20 alat di CV tanpa bisa menjelaskan kenapa memilih satu di antaranya adalah tanda bahaya bagi pewawancara.
- **Lupa fondasi.** Kubernetes yang rusak karena DNS cluster, deploy yang gagal karena MTU overlay, VPC yang tidak bisa di-peer karena CIDR bertabrakan: semuanya masalah jaringan dasar.
- **Mengabaikan keamanan di pipeline.** Secret di repositori, image tanpa pemindaian, akun CI dengan hak administrator penuh.
- **Alert berlebihan.** Ratusan alert per minggu membuat on-call kebal, dan alert yang penting ikut terlewat.
- **Postmortem yang mencari kambing hitam.** Begitu orang takut disalahkan, informasi berhenti mengalir dan insiden yang sama berulang.
- **Otomasi tanpa source of truth.** Playbook yang membaca data dari spreadsheet berbeda-beda hanya memindahkan kekacauan ke tempat lain.

---

## 9. Ringkasan

- Rumpun ini memperlakukan infrastruktur sebagai perangkat lunak: Git, pull request, pengujian, pipeline.
- **DevOps Engineer** mengurus jalan dari kode ke produksi, diukur dengan lima metrik DORA terkini.
- **SRE** mengurus keandalan dengan SLI, SLO, error budget, pengurangan toil (target Google: minimal 50% waktu untuk rekayasa), dan postmortem tanpa menyalahkan.
- **Cloud Infrastructure Engineer** membangun fondasi cloud (jaringan, IAM, landing zone, biaya) dan paling mudah dimasuki dari latar jaringan.
- **Automation Engineer (NetDevOps)** mengotomasi jaringan dengan Python, Ansible, NetBox, dan CI; jembatan paling alami bagi network engineer.
- Perubahan sertifikasi 2026 yang penting: Cisco DevNet menjadi **CCNA/CCNP/CCIE Automation** (sejak 3 Februari 2026, AUTOCOR menggantikan DEVCOR), **Terraform Associate 004** (sejak 8 Januari 2026), restrukturisasi **Red Hat** ke jalur spesialisasi (Mei 2026), dan **AWS SysOps Administrator** berganti nama menjadi **CloudOps Engineer Associate (SOA-C03)**.
- Di Indonesia, rujukan SKKNI paling relevan adalah **SKKNI Bidang Cloud Computing (Kepmenaker 102/2023)**; belum ada SKKNI khusus DevOps atau SRE yang kami temukan.

---

## 10. Latihan

1. Sebuah layanan transfer antarbank internal memiliki SLO ketersediaan 99,95% dalam jendela 30 hari. Pada hari ke-10, gangguan total sudah mencapai 15 menit. Hitung error budget bulanan dan sisa anggarannya, lalu jelaskan keputusan yang sebaiknya diambil untuk rilis besar yang dijadwalkan hari ke-12.
2. Tim Anda melaporkan "deploy kami seminggu sekali, lead time tiga minggu, dan sekitar 30% deploy harus di-rollback". Petakan kondisi ini ke metrik DORA, lalu usulkan dua perubahan konkret di pipeline yang paling mungkin memperbaiki angka tersebut.
3. Seorang engineer on-call salah menjalankan perintah yang menghapus sebagian aturan firewall produksi, menyebabkan gangguan 40 menit. Manajer meminta "nama orang yang bertanggung jawab" untuk laporan. Sebagai SRE yang memimpin postmortem, bagaimana Anda menyusun laporannya dan pertanyaan sistemik apa yang Anda ajukan?
4. Anda network engineer di ISP dengan 250 router MikroTik dan Cisco. Atasan meminta "otomasi semuanya dalam tiga bulan". Susun urutan prioritas otomasi yang aman (apa dulu, apa nanti, apa yang tidak perlu), beserta alasannya.
5. Sebuah bank akan membuat 15 VPC di region cloud Jakarta. Data center utama memakai 10.0.0.0/12 dan kantor cabang memakai 172.16.0.0/12. Usulkan strategi alokasi CIDR untuk VPC dan jelaskan risiko jika strategi ini diabaikan.
6. Lowongan A berjudul "DevOps Engineer" meminta Kubernetes, Terraform, dan on-call. Lowongan B berjudul "SRE" meminta Jenkins, Ansible, dan instalasi server. Profesi mana yang sebenarnya dicari masing-masing lowongan, dan bagaimana Anda menyesuaikan CV untuk keduanya?
7. Anda memegang sertifikat Cisco DevNet Associate yang didapat tahun 2024. Seorang perekrut menanyakan apakah Anda punya "CCNA Automation". Bagaimana Anda menjawab, dan apa yang perlu Anda periksa terkait masa berlaku sertifikat tersebut?
8. Rekan Anda menulis playbook Ansible yang menjalankan perintah CLI mentah `configure terminal` diikuti baris konfigurasi, tanpa memeriksa kondisi awal. Playbook itu dijalankan tiap jam lewat cron. Identifikasi risikonya dan usulkan perbaikan.
9. Tagihan cloud perusahaan naik 40% dalam dua bulan tanpa ada peluncuran produk baru. Sebagai Cloud Infrastructure Engineer, uraikan langkah investigasi Anda dan kontrol yang akan Anda pasang agar tidak terulang.

<details>
<summary>Jawaban</summary>

1. Total menit 30 hari = 43.200. Error budget = 0,05% x 43.200 = 21,6 menit. Setelah 15 menit terpakai, sisa sekitar 6,6 menit untuk 20 hari ke depan, artinya sekitar 69% anggaran habis dalam sepertiga periode. Keputusan yang masuk akal: rilis besar pada hari ke-12 ditunda atau diperkecil (misalnya canary bertahap dengan rollback otomatis), dan tim memprioritaskan perbaikan penyebab gangguan 15 menit tadi. Keputusan ini sebaiknya mengikuti kebijakan error budget yang sudah disepakati bersama tim produk sebelumnya, bukan diputuskan sepihak oleh SRE saat itu.

2. Deploy seminggu sekali adalah deployment frequency rendah; lead time tiga minggu adalah change lead time panjang; 30% rollback adalah change fail rate tinggi. Dua perubahan konkret: (a) pengujian otomatis yang lebih kuat di CI (unit test, integration test, dan uji di lingkungan staging yang mirip produksi) agar kegagalan tertangkap sebelum deploy; (b) memperkecil ukuran perubahan dan memakai rilis bertahap (canary atau feature flag) sehingga deploy bisa lebih sering, risiko per deploy lebih kecil, dan rollback lebih cepat. Perubahan tambahan yang juga sah: otomatisasi persetujuan untuk perubahan berisiko rendah dan mengurangi antrean manual.

3. Laporan disusun tanpa menyebut nama sebagai penyebab. Isinya: linimasa (kapan perintah dijalankan, kapan alert muncul, kapan pemulihan), dampak (layanan dan pengguna terdampak, durasi), faktor penyebab, dan tindak lanjut. Pertanyaan sistemik: Mengapa satu orang bisa menjalankan perintah destruktif ke produksi tanpa peninjauan? Mengapa aturan firewall tidak dikelola lewat kode dengan pull request? Apakah ada mode dry-run atau konfirmasi? Mengapa pemulihan butuh 40 menit (apakah ada backup konfigurasi dan runbook)? Apakah alert mendeteksi gejala cukup cepat? Kepada manajer dijelaskan bahwa menyalahkan individu membuat orang menyembunyikan kesalahan, sedangkan perbaikan sistem mencegah orang berikutnya mengulang kesalahan yang sama.

4. Urutan aman: (a) operasi baca saja dulu: backup konfigurasi otomatis harian dan inventaris perangkat, risikonya kecil dan langsung berguna; (b) source of truth: memindahkan data perangkat, IP, dan VLAN ke NetBox; (c) audit kepatuhan otomatis (membandingkan konfigurasi dengan standar) tetapi masih tanpa mengubah; (d) otomasi perubahan berulang dan berisiko rendah, seperti provisioning VLAN atau pelanggan baru, diuji di lab dan diterapkan bertahap; (e) pipeline CI untuk semua perubahan. Yang tidak perlu diotomasi segera: tugas yang sangat jarang (misalnya migrasi sekali setahun) atau perangkat yang segera dipensiunkan. Alasan umumnya: membangun kepercayaan tim dengan risiko kecil dulu dan memastikan data yang menjadi dasar otomasi sudah benar sebelum otomasi diberi hak mengubah.

5. Pilih ruang alamat yang tidak bertabrakan dengan 10.0.0.0/12 (10.0.0.0 sampai 10.15.255.255) dan 172.16.0.0/12. Contoh: sisihkan blok 10.64.0.0/12 khusus cloud, lalu berikan tiap VPC sebuah /20 atau /19 sesuai kebutuhan, dengan cadangan untuk pertumbuhan dan region lain, dan dokumentasikan di IPAM atau NetBox. Risiko bila diabaikan: VPC tidak bisa dihubungkan ke data center lewat VPN atau koneksi dedicated karena rute bertabrakan, peering antar-VPC gagal, dan perbaikannya membutuhkan migrasi ulang alamat (mahal, berisiko, sering butuh downtime).

6. Lowongan A berjudul DevOps, tetapi Kubernetes, Terraform, dan on-call menunjukkan campuran DevOps dan SRE, dengan tanggung jawab keandalan produksi. Lowongan B berjudul SRE, tetapi Jenkins, Ansible, dan instalasi server lebih mirip DevOps tradisional atau system engineer. Untuk A, tonjolkan proyek Kubernetes, IaC, dan pengalaman menangani insiden; untuk B, tonjolkan pipeline Jenkins, playbook Ansible, dan otomasi server. Pelajarannya: judul pekerjaan tidak konsisten di pasar, baca deskripsi tugas dan sesuaikan CV dengan kebutuhan yang tertulis.

7. Jawaban yang tepat: sejak 3 Februari 2026 Cisco mengganti nama DevNet Associate menjadi CCNA Automation, dan pemegang sertifikat lama diperbarui otomatis tanpa ujian ulang, sehingga Anda dapat menyebut keduanya ("CCNA Automation, sebelumnya DevNet Associate"). Yang perlu diperiksa: tanggal kedaluwarsa di akun sertifikasi Cisco (sertifikasi Cisco berlaku tiga tahun), lencana digital yang sudah diperbarui, dan opsi resertifikasi bila mendekati masa berlaku.

8. Risiko: perintah dijalankan tanpa memeriksa kondisi, sehingga bisa menambah baris duplikat, menimpa perubahan manual darurat, atau gagal sebagian dan meninggalkan konfigurasi setengah jadi; menjalankannya tiap jam memperbesar dampak bila ada kesalahan; tidak ada catatan diff atau peninjauan. Perbaikan: pakai modul Ansible khusus platform yang idempoten (misalnya modul konfigurasi resource seperti VLAN atau interface, bukan perintah mentah), gunakan mode `--check` dan `--diff` sebelum menerapkan, simpan playbook di Git dengan pull request, jalankan lewat pipeline dengan persetujuan, dan pisahkan pemeriksaan drift (baca saja, laporkan) dari penerapan perubahan.

9. Investigasi: buka laporan biaya per layanan, per akun, dan per tag untuk menemukan lonjakan terbesar; cari resource tanpa tag pemilik; periksa instance dan cluster non-produksi yang menyala terus, volume dan snapshot yatim, biaya transfer data antar-zona atau keluar internet (sering terlupakan, dan terkait desain jaringan seperti NAT gateway), serta layanan terkelola yang ukurannya berlebih. Kontrol pencegahan: kebijakan wajib tag di IaC, anggaran dan alert biaya per tim, jadwal mati otomatis untuk lingkungan non-produksi, pemindaian IaC sebelum merge, dan tinjauan biaya bulanan bersama pemilik layanan.

</details>

---

## 11. Sumber

- Google, Site Reliability Engineering: Service Level Objectives: https://sre.google/sre-book/service-level-objectives/
- Google, Site Reliability Engineering: Embracing Risk (error budget): https://sre.google/sre-book/embracing-risk/
- Google, Site Reliability Engineering: Eliminating Toil: https://sre.google/sre-book/eliminating-toil/
- Google, Site Reliability Engineering: Postmortem Culture: https://sre.google/sre-book/postmortem-culture/
- DORA, DORA's software delivery performance metrics: https://dora.dev/guides/dora-metrics/
- DORA, State of AI-assisted Software Development 2025: https://dora.dev/research/2025/dora-report/
- Cisco, CCNA Automation: https://www.cisco.com/site/us/en/learn/training-certifications/certifications/automation/ccna-automation/index.html
- Cisco, CCNP Automation: https://www.cisco.com/site/us/en/learn/training-certifications/certifications/automation/ccnp-automation/index.html
- Cisco, 350-901 AUTOCOR: https://www.cisco.com/site/us/en/learn/training-certifications/exams/autocor.html
- CBT Nuggets, Cisco DevNet is now Cisco Automation: https://www.cbtnuggets.com/blog/certifications/cisco/tech-news-cisco-devnet-is-now-cisco-automation
- HashiCorp, Terraform Associate (004): https://developer.hashicorp.com/certifications/terraform-associate
- HashiCorp, Exam Content List Terraform Associate 004: https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-review-004
- Red Hat, EX294 Red Hat Certified Advanced System Administrator in Ansible: https://www.redhat.com/en/services/training/ex294-red-hat-certified-engineer-rhce-exam-red-hat-enterprise-linux-9
- Red Hat, Red Hat Certified Engineer (RHCE): https://www.redhat.com/en/services/certification/rhce
- Red Hat, Red Hat Certified Specialist in Developing Automation with Ansible Automation Platform (EX374): https://www.redhat.com/en/services/certification/rhcs-developing-automation-ansible
- Red Hat, Training and Certification FAQ (restrukturisasi 2026): https://www.redhat.com/en/services/training-and-certification/faq
- Linux Foundation, Certified Kubernetes Administrator (CKA): https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/
- Linux Foundation, Certified Kubernetes Application Developer (CKAD): https://training.linuxfoundation.org/certification/certified-kubernetes-application-developer-ckad/
- Linux Foundation, Certified Kubernetes Security Specialist (CKS): https://training.linuxfoundation.org/certification/certified-kubernetes-security-specialist/
- Linux Foundation, Prometheus Certified Associate (PCA): https://training.linuxfoundation.org/certification/prometheus-certified-associate/
- Linux Foundation, OpenTelemetry Certified Associate (OTCA): https://training.linuxfoundation.org/certification/opentelemetry-certified-associate-otca/
- CNCF, OpenTelemetry project page: https://www.cncf.io/projects/opentelemetry/
- CNCF, OpenTofu project page: https://www.cncf.io/projects/opentofu/
- IBM, IBM Completes Acquisition of HashiCorp (27 Februari 2025): https://newsroom.ibm.com/2025-02-27-ibm-completes-acquisition-of-hashicorp,-creates-comprehensive,-end-to-end-hybrid-cloud-platform
- AWS, Certified Solutions Architect Associate (SAA-C03): https://aws.amazon.com/certification/certified-solutions-architect-associate/
- AWS, Certified DevOps Engineer Professional (DOP-C02): https://aws.amazon.com/certification/certified-devops-engineer-professional/
- AWS, Certified CloudOps Engineer Associate (SOA-C03): https://aws.amazon.com/certification/certified-cloudops-engineer-associate/
- Microsoft Learn, Azure Administrator Associate (AZ-104): https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/
- Microsoft Learn, DevOps Engineer Expert (AZ-400): https://learn.microsoft.com/en-us/credentials/certifications/devops-engineer/
- Google Cloud, Professional Cloud DevOps Engineer: https://cloud.google.com/learn/certification/cloud-devops-engineer
- Google Cloud, Associate Cloud Engineer: https://cloud.google.com/learn/certification/cloud-engineer
- Kemnaker, Kepmenaker Nomor 102 Tahun 2023 tentang SKKNI Bidang Cloud Computing: https://jdih.kemnaker.go.id/asset/data_puu/SKKNI%202023-102.pdf
- Kemnaker, Kepmenaker Nomor 82 Tahun 2017 tentang SKKNI Bidang Administrasi Sistem: https://jdih.kemnaker.go.id/peraturan/detail/1489/keputusan-menaker-nomor-82-tahun-2017
- Amazon, AWS Launches Region in Indonesia (Desember 2021): https://press.aboutamazon.com/2021/12/aws-launches-region-in-indonesia
- Microsoft Indonesia, Microsoft opens its first cloud region in Indonesia (Mei 2025): https://news.microsoft.com/id-id/2025/05/27/microsoft-opens-indonesia-central/
- AWS Startups Blog, How Traveloka Uses AWS to Maintain Visibility into Its Systems (2019): https://aws.amazon.com/blogs/startups/how-traveloka-uses-aws-to-maintain-visibility-into-its-systems/
- Jobstreet Indonesia, Gaji DevOps Engineer: https://id.jobstreet.com/id/career-advice/role/devops-engineer/salary
- Michael Page Indonesia, Salary Comparison Tool: DevOps Manager: https://www.michaelpage.co.id/salary-comparison-tool/devops-manager-salaries
- Michael Page Indonesia, Salary Comparison Tool: Head of DevOps: https://www.michaelpage.co.id/salary-comparison-tool/head-of-devops-salaries

---

**Berikutnya:** `21-ekosistem-profesi/06-rumpun-dukungan-lapangan` — Rumpun Dukungan & Lapangan: profesi yang memastikan perangkat, kabel, dan pengguna akhir benar-benar terlayani di lokasi.

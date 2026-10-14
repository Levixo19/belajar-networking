# 21.7 — Rumpun Tata Kelola & Konsultasi

> **Prasyarat:** `17-desain-arsitektur/01-prinsip-desain`, `17-desain-arsitektur/03-perencanaan-dokumentasi`, `12-keamanan/01-konsep-keamanan`, `14-monitoring-troubleshooting/01-metodologi`, dan `18-karier-sertifikasi/01-peta-sertifikasi`
> **Tujuan:** Anda memahami lima profesi yang bekerja di "lapisan atas" infrastruktur (IT consultant, IT auditor, disaster recovery specialist, solution architect, scrum master infrastruktur), tahu kerangka dan regulasi yang mereka pakai di Indonesia, dan bisa menilai apakah salah satunya cocok sebagai langkah karier Anda berikutnya.

---

## 1. Rumpun yang Bekerja dengan Dokumen, tapi Dokumennya tentang Paket

Sampai modul sebelumnya, hampir semua profesi yang Anda temui punya satu kesamaan: tangannya menyentuh konfigurasi. Rumpun ini berbeda. Seorang IT auditor jarang mengetik perintah di router produksi. Seorang solution architect lebih sering membuka spreadsheet bill of material daripada terminal. Seorang scrum master infrastruktur menghabiskan pagi di papan Jira, bukan di Wireshark.

Tapi jangan salah sangka. Dokumen yang mereka hasilkan selalu tentang hal-hal yang Anda pelajari di kurikulum ini:

- Temuan audit "aturan firewall terlalu longgar" hanya bisa ditulis oleh orang yang paham apa arti `permit ip any any` (`09-nat-acl-firewall/02-acl`).
- Target pemulihan "sistem kembali dalam 2 jam" tidak ada artinya kalau tidak ada yang tahu bahwa TTL DNS 24 jam akan membuat klien tetap menuju pusat data yang mati (`06-aplikasi/01-dns`).
- Proposal "SD-WAN untuk 300 cabang" yang lolos tender tapi gagal di lapangan biasanya ditulis tanpa menghitung latensi dan MTU tunnel (`11-wan-vpn/02-tunneling-vpn`, `05-transport/04-congestion-control`).

Itulah sebabnya rumpun ini sering diisi orang yang dulunya network engineer atau system administrator. Mereka membawa satu hal yang sulit dipelajari dari buku tata kelola: **intuisi tentang bagaimana sistem benar-benar gagal**.

### Tabel ringkas rumpun

| Profesi | Pertanyaan utama yang dijawab | Hasil kerja khas | Jenjang masuk realistis | Kerangka utama |
|---|---|---|---|---|
| IT Consultant | "Apa yang sebaiknya organisasi ini lakukan dengan TI-nya?" | Laporan assessment, roadmap, desain tingkat tinggi | Menengah | COBIT 2019, ITIL, ISO/IEC 27001 |
| IT Auditor | "Apakah kontrol TI benar-benar berjalan seperti yang diklaim?" | Kertas kerja audit, laporan temuan | Pemula (lewat KAP/Big Four) | COBIT 2019, ISO/IEC 27001, POJK, standar ISACA |
| Disaster Recovery Specialist | "Kalau pusat data hilang, berapa lama dan berapa banyak data yang hilang?" | BIA, DRP, laporan uji DR | Menengah | ISO 22301, NIST SP 800-34, praktik DRI |
| Solution Architect | "Solusi seperti apa yang memenuhi kebutuhan ini dan bisa dibangun?" | Arsitektur solusi, BoM, proposal teknis | Senior | TOGAF Standard 10th Edition, Well-Architected |
| Scrum Master Infrastruktur | "Bagaimana tim infrastruktur ini bisa menyelesaikan pekerjaan dengan aliran yang sehat?" | Papan kerja, metrik aliran, retrospektif | Menengah | Scrum Guide 2020, Kanban, SAFe |

💡 Perhatikan kolom "jenjang masuk". Hanya IT auditor yang realistis dimasuki langsung oleh lulusan baru. Empat lainnya hampir selalu diisi orang yang sudah beberapa tahun di peran teknis. Artinya, rumpun ini lebih tepat dibaca sebagai **tujuan tahap kedua karier Anda**, bukan pintu pertama.

---

## 2. Bahasa Bersama: Kerangka dan Regulasi yang Akan Anda Temui

Kelima profesi ini berbagi kosakata. Sebelum masuk ke masing-masing profesi, kenali dulu kerangka yang akan muncul berulang kali.

### Kerangka internasional

| Kerangka | Pemilik | Isinya, dalam satu kalimat | Siapa yang paling sering memakainya |
|---|---|---|---|
| COBIT 2019 | ISACA | Kerangka tata kelola dan manajemen informasi dan teknologi perusahaan, berisi tujuan tata kelola dan manajemen beserta faktor desain untuk menyesuaikannya | Auditor, konsultan |
| ISO/IEC 27001:2022 | ISO/IEC | Persyaratan sistem manajemen keamanan informasi (SMKI) yang bisa disertifikasi | Auditor, konsultan, security |
| ISO 22301:2019 (dengan Amendemen 1:2024) | ISO | Persyaratan sistem manajemen kelangsungan usaha (BCMS) yang bisa disertifikasi | DR specialist, auditor |
| NIST SP 800-34 Rev. 1 | NIST | Panduan contingency planning untuk sistem informasi, termasuk BIA | DR specialist |
| TOGAF Standard, 10th Edition | The Open Group | Metode dan kerangka arsitektur enterprise, dibagi menjadi Fundamental Content dan Series Guides | Solution/enterprise architect |
| Scrum Guide 2020 | Ken Schwaber dan Jeff Sutherland | Definisi resmi Scrum: tiga akuntabilitas, lima event, tiga artefak | Scrum master |
| ITIL (Version 5) | PeopleCert | Praktik manajemen layanan dan produk digital; Version 5 terbit 2026 menggantikan ITIL 4 sebagai versi terbaru | Konsultan, scrum master infra, manajer operasi |

Beberapa catatan versi yang sering salah ditulis di CV dan lowongan:

- **ISO/IEC 27001:2013 sudah tidak berlaku.** Masa transisi ke versi 2022 berakhir 31 Oktober 2025; sertifikat 2013 yang belum ditransisikan tidak sah lagi.
- **ISO 22301 masih edisi 2019**, ditambah Amendemen 1:2024 yang menyisipkan pertimbangan perubahan iklim ke klausul konteks organisasi.
- **COBIT 2019 masih versi terbaru** dari ISACA per 2026.
- **Tidak ada ujian bernama "TOGAF 10 Foundation".** Untuk edisi ke-10, namanya TOGAF Enterprise Architecture Foundation dan Practitioner. TOGAF 9 Foundation dan TOGAF 9 Certified masih ditawarkan.
- **ITIL berganti versi.** PeopleCert kini menawarkan ITIL Foundation (Version 5); pemegang ITIL 4 Foundation tetap diakui sebagai prasyarat jenjang lanjutan.

### Regulasi Indonesia yang membentuk pasar kerja rumpun ini

Pasar kerja tata kelola di Indonesia sangat digerakkan regulasi. Ketika regulator mewajibkan sesuatu diuji atau diaudit, muncul lowongan. Berikut yang paling berpengaruh:

**Perbankan: POJK 11/POJK.03/2022** tentang Penyelenggaraan Teknologi Informasi oleh Bank Umum (berlaku 7 Juli 2022). Beberapa pasal yang langsung menciptakan pekerjaan:

- Pasal 17: bank wajib memastikan jaringan komunikasinya memenuhi prinsip kerahasiaan, integritas, dan ketersediaan. Ini pasal yang membuat auditor TI bank harus bisa membaca desain jaringan.
- Pasal 18: bank wajib memiliki Rencana Pemulihan Bencana, wajib **menguji coba DRP terhadap seluruh aplikasi dan infrastruktur kritikal sesuai hasil analisis dampak bisnis paling sedikit satu kali setahun dengan melibatkan pengguna TI**, dan wajib mengkaji ulang DRP paling sedikit satu kali setahun.
- Pasal 25: pengujian keamanan siber berbasis skenario wajib paling sedikit satu kali setahun.
- Pasal 54 dan 55: audit intern atas penyelenggaraan TI wajib paling sedikit satu kali setahun, dan fungsi audit intern TI itu sendiri wajib dikaji ulang **paling sedikit satu kali dalam tiga tahun oleh pihak ekstern yang independen**.

Ketentuan pelaksananya kini ada di **Peraturan Anggota Dewan Komisioner (PADK) OJK Nomor 1 Tahun 2026** tentang Penyelenggaraan Teknologi Informasi oleh Bank Umum, ditetapkan 23 Januari 2026 dan berlaku 1 Maret 2026. PADK ini mencabut SEOJK 21/SEOJK.03/2017 yang selama bertahun-tahun menjadi pegangan auditor TI perbankan. Jika Anda membaca materi persiapan audit bank yang masih merujuk SEOJK 21/2017, ingat bahwa rujukannya sudah berganti.

**Pemerintahan: SPBE.** Perpres 95/2018 tentang SPBE menjadi dasar. **Permenkominfo 16/2022** tentang Kebijakan Umum Penyelenggaraan Audit TIK mengatur audit atas unsur SPBE, termasuk infrastruktur, aplikasi, dan keamanan SPBE, oleh lembaga pelaksana audit TIK pemerintah atau lembaga terakreditasi dan terdaftar. **Perpres 82/2023** tentang Percepatan Transformasi Digital dan Keterpaduan Layanan Digital Nasional mendorong integrasi aplikasi SPBE prioritas. Hasilnya: pasar besar bagi konsultan dan auditor di kementerian, lembaga, dan pemerintah daerah (Kominfo kini bernama Komdigi).

**BUMN: PER-2/MBU/03/2023** tentang Pedoman Tata Kelola dan Kegiatan Korporasi Signifikan BUMN memuat ketentuan penyelenggaraan teknologi informasi, termasuk keamanan TI dan pelindungan data pribadi. BUMN beserta anak usahanya adalah pemberi kerja besar untuk konsultan tata kelola TI.

**Standar kompetensi: Kepmenaker 231/2024** menetapkan SKKNI bidang Audit Teknologi Informasi (berlaku 12 September 2024), berisi 18 unit kompetensi mulai dari penentuan ruang lingkup audit TI, analisis risiko audit, penyusunan rencana audit, hingga identifikasi kontrol TI. Ini acuan bagi Lembaga Sertifikasi Profesi (LSP) berlisensi BNSP yang menyelenggarakan uji kompetensi auditor TI.

⚠️ Regulasi berubah lebih cepat dari buku. Kebiasaan yang membedakan profesional rumpun ini adalah selalu memeriksa status peraturan di sumber resmi (situs OJK, JDIH kementerian, peraturan.bpk.go.id) sebelum mengutipnya di laporan. Mengutip SEOJK yang sudah dicabut di laporan audit adalah temuan yang memalukan bagi auditornya sendiri.

---

## 3. IT Consultant

**Satu hari kerja yang realistis.** Anda konsultan di firma konsultan lokal. Klien Anda grup yang baru menggabungkan tiga bank perkreditan rakyat (BPR) dan ingin menyatukan infrastruktur TI-nya. Pagi diisi wawancara dengan kepala TI dan staf jaringan: berapa cabang, link WAN apa, siapa memegang password perangkat inti, adakah diagram terbaru. Jawabannya, seperti biasa: diagram terakhir dibuat 2021. Siang Anda membaca sendiri ekspor konfigurasi router dan firewall, dan menemukan dua BPR memakai rentang IP privat yang sama (`10.0.0.0/16`), sehingga penggabungan butuh NAT sementara atau penomoran ulang. Malam, manajer proyek meminta draf "opsi integrasi" untuk steering committee: opsi A penomoran ulang bertahap, opsi B NAT sementara plus penomoran ulang dalam 12 bulan, masing-masing dengan risiko, biaya, dan dampak ke layanan.

Itulah inti pekerjaan konsultan: **mengubah kondisi teknis yang berantakan menjadi pilihan keputusan yang bisa dipahami manajemen**. Konsultan tidak dibayar untuk mengonfigurasi. Konsultan dibayar untuk jawaban yang bisa dipertanggungjawabkan.

**Tanggung jawab dan ukuran keberhasilan.**

- Melakukan assessment (kondisi saat ini), gap analysis terhadap kerangka atau regulasi, dan menyusun roadmap.
- Menyusun desain tingkat tinggi dan kebijakan, misalnya kebijakan keamanan jaringan atau standar konfigurasi.
- Mendampingi klien menuju sertifikasi (misalnya ISO/IEC 27001) atau kepatuhan regulasi (misalnya POJK 11/2022).
- Ukuran keberhasilan biasanya bukan MTTR, melainkan: deliverable diterima tepat waktu (milestone acceptance), utilisasi jam tagih (billable utilization) di firma konsultan, tingkat kepuasan klien, proyek lanjutan (repeat business), dan untuk proyek pendampingan sertifikasi: klien lulus audit sertifikasi tanpa temuan mayor.

**Keahlian teknis dan non-teknis.** Secara teknis Anda perlu cukup luas: jaringan, keamanan, cloud, dan dasar ITSM, sehingga bisa memeriksa klaim klien. Secara non-teknis, ini justru yang dominan: wawancara pemangku kepentingan, menulis laporan yang lugas, menyusun presentasi untuk direksi, mengelola ekspektasi, dan bernegosiasi soal ruang lingkup. Estimasi usaha juga penting karena kontrak konsultan sering berharga tetap.

**Alat yang dipakai.** Microsoft Excel dan PowerPoint (jangan diremehkan: sebagian besar deliverable konsultan berupa dua format ini), Microsoft Visio atau draw.io untuk diagram, Confluence atau SharePoint untuk dokumentasi, Jira untuk pelacakan pekerjaan, alat pemindai dan inventaris seperti Nmap dan Lansweeper untuk validasi kondisi lapangan, serta Wireshark ketika klaim klien perlu dibuktikan.

**Sertifikasi per jenjang.**

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | ITIL Foundation (Version 5) dari PeopleCert, atau CCNA 200-301 v1.1 sebagai bukti fondasi teknis | Fondasi bahasa layanan TI |
| Menengah | COBIT 2019 Foundation (ISACA), ISO/IEC 27001 Lead Implementer (misalnya PECB) | Untuk proyek tata kelola dan pendampingan SMKI |
| Senior | CGEIT (ISACA), CISM (ISACA) | CGEIT menguji tata kelola TI perusahaan, empat domain: Governance of Enterprise IT, IT Resources, Benefits Realization, Risk Optimization |

Biaya ujian ISACA per 2026 adalah USD 575 untuk anggota dan USD 760 untuk non-anggota, ditambah biaya aplikasi USD 50 setelah lulus.

**Jalur masuk, progresi, dan transisi.** Jalur paling umum di Indonesia: dua sampai lima tahun sebagai network atau system engineer di system integrator, lalu pindah ke peran technical consultant atau pre-sales consultant, atau melamar ke divisi technology consulting dan risk advisory firma Big Four (Deloitte, PwC, EY, KPMG) maupun konsultan lokal. Progresinya: consultant, senior consultant, manager, senior manager, lalu partner atau principal. Banyak konsultan kemudian pindah ke sisi klien sebagai kepala TI atau IT operations manager; sebagian kembali ke peran teknis senior seperti network architect.

**Konteks pasar kerja Indonesia.** Pemberi kerja utama: firma Big Four dan konsultan lokal, system integrator (Telkomsigma, Lintasarta, Datacomm Diangraha, Multipolar Technology, Mitra Integrasi Informatika, dan banyak SI menengah), vendor yang punya tim professional services, serta BUMN yang membentuk tim transformasi digital internal. Proyek SPBE di pemerintah daerah dan proyek kepatuhan POJK di bank dan lembaga keuangan non-bank adalah sumber proyek yang sangat besar.

Data gaji publik khusus "IT consultant" sulit diverifikasi (panduan gaji Michael Page Indonesia 2026 hanya bisa dibaca setelah registrasi). Sebagai patokan kasar, wawasan gaji Jobstreet Indonesia untuk jabatan "Konsultan Teknis", yang diambil dari rentang gaji di iklan lowongan, menunjukkan median sekitar Rp17,5 juta per bulan dengan persentil ke-25 sampai ke-75 di Rp16 juta sampai Rp19 juta (nasional, diakses Oktober 2026). Angka ini mencakup konsultan teknis dari berbagai bidang, bukan khusus TI.

**Belajar dari kurikulum ini.** Konsultan butuh peta yang luas. Kuasai: `01-model-referensi/01-osi`, `04-network-layer/02-subnetting`, `09-nat-acl-firewall/01-nat` (kasus tumpang tindih IP saat merger), `12-keamanan/01-konsep-keamanan`, `12-keamanan/05-hardening-zero-trust`, `16-datacenter-cloud-sdn/04-cloud-networking`, `17-desain-arsitektur/01-prinsip-desain`, `17-desain-arsitektur/03-perencanaan-dokumentasi`, dan `17-desain-arsitektur/04-studi-kasus-desain`.

**Proyek portofolio.**

1. Assessment fiktif lengkap: ambil topologi dari `20-proyek-akhir/02-babak-1-audit-warisan`, tulis laporan kondisi saat ini, gap terhadap 10 kontrol Annex A ISO/IEC 27001:2022 yang terkait jaringan, dan roadmap 12 bulan dalam tiga horizon.
2. Rencana integrasi dua jaringan dengan IP bertumpuk: dua opsi, analisis risiko, estimasi effort, dan rencana rollback, ditulis untuk pembaca non-teknis.
3. Satu set slide 10 halaman untuk direksi yang menjelaskan kenapa organisasi perlu segmentasi jaringan, tanpa satu pun istilah teknis yang tidak dijelaskan.

**Pertanyaan wawancara khas.**

- "Klien menolak rekomendasi Anda karena mahal, padahal Anda yakin risikonya tinggi. Apa yang Anda lakukan?" (Jawaban kuat: kuantifikasi risiko, tawarkan opsi bertahap, dokumentasikan bahwa risiko diterima oleh pemilik risiko yang berwenang.)
- "Bagaimana Anda melakukan assessment di organisasi yang dokumentasinya tidak ada?"
- "Ceritakan satu laporan yang pernah Anda tulis untuk pembaca non-teknis."

---

## 4. IT Auditor

**Satu hari kerja yang realistis.** Anda associate di tim IT audit sebuah Kantor Akuntan Publik (KAP) afiliasi Big Four. Minggu ini Anda ditugaskan pada audit laporan keuangan sebuah bank menengah, bagian IT General Controls (ITGC). Tugas Anda hari ini: menguji kontrol "akses ke sistem core banking dicabut paling lambat satu hari kerja setelah karyawan keluar". Pagi Anda meminta dua daftar: daftar karyawan yang keluar selama periode audit dari HR, dan daftar akun aktif core banking dari tim TI. Siang Anda mencocokkan keduanya di Excel. Dari 25 sampel, tiga akun masih aktif lebih dari sebulan setelah pemiliknya keluar. Satu di antaranya ternyata masih login dua minggu setelah resign, terlihat di log autentikasi yang Anda minta. Sore Anda mewawancarai supervisor TI untuk memahami penyebabnya (proses offboarding bergantung email manual dari HR) dan mulai menyusun draf temuan: kondisi, kriteria, penyebab, akibat, rekomendasi.

Hari lain Anda menguji change management, meninjau rule base firewall, menguji backup dan restore, atau meninjau hasil uji DRP tahunan yang diwajibkan Pasal 18 POJK 11/2022.

**Tanggung jawab dan ukuran keberhasilan.**

- Merencanakan audit berbasis risiko, menguji desain dan efektivitas operasional kontrol, mengumpulkan bukti, dan melaporkan temuan.
- Melacak tindak lanjut temuan sampai ditutup.
- Ukuran keberhasilan: rencana audit tahunan selesai sesuai jadwal, kualitas kertas kerja (lolos review manajer tanpa revisi besar), temuan yang relevan dan didukung bukti kuat, serta persentase rekomendasi yang ditindaklanjuti tepat waktu oleh auditee. Auditor yang baik tidak diukur dari jumlah temuan, melainkan dari apakah temuannya benar dan penting.

**Keahlian teknis dan non-teknis.** Teknis: memahami kontrol akses (`12-keamanan/04-aaa-identitas`), membaca konfigurasi dan rule firewall, memahami log dan SIEM, dasar database untuk menarik data pengujian, serta konsep backup dan pemulihan. Non-teknis: skeptisisme profesional, teknik sampling, wawancara yang tidak menginterogasi, penulisan temuan yang tidak bisa dibantah, dan integritas. Auditor sering menjadi orang yang paling tidak disukai di ruangan; yang membuat Anda dihormati adalah ketelitian dan keadilan.

**Alat yang dipakai.** Microsoft Excel (alat utama, terutama untuk sampling dan pencocokan data), alat analitik data audit seperti IDEA atau ACL Analytics (kini bagian dari Diligent), platform manajemen audit seperti TeamMate+ atau AuditBoard, alat analisis konfigurasi firewall seperti Tufin atau AlgoSec di organisasi besar, Nessus atau Qualys untuk membaca hasil pemindaian kerentanan, serta Splunk atau SIEM lain untuk meninjau log.

**Sertifikasi per jenjang.**

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | CISA (ISACA) mulai dipersiapkan; ISO/IEC 27001 Lead Auditor (PECB atau lembaga terakreditasi lain) | CISA bisa diujikan sebelum pengalaman terpenuhi; ada waktu lima tahun setelah lulus untuk mengajukan sertifikasi |
| Pemula, jalur nasional | Sertifikasi kompetensi berbasis SKKNI Audit TI (Kepmenaker 231/2024) melalui LSP berlisensi BNSP | Relevan untuk instansi pemerintah dan BUMN |
| Menengah | CISA penuh, CRISC (ISACA) | CRISC berfokus pada risiko TI, dengan empat domain: Governance, IT Risk Assessment, Risk Response and Reporting, serta Information Technology and Security |
| Senior | CISM, CGEIT (ISACA); untuk peran yang mulai menyentuh AI, ISACA kini juga menawarkan AAIA (Advanced in AI Audit) | Untuk kepala audit TI atau penanggung jawab risiko |

Ujian CISA terdiri atas 150 soal. Bobot domain pada job practice yang berlaku: Information Systems Auditing Process 18%, Governance and Management of IT 18%, Information Systems Acquisition, Development and Implementation 12%, Information Systems Operations and Business Resilience 26%, dan Protection of Information Assets 26%. Perhatikan bahwa dua domain terbesar adalah operasi/ketahanan dan perlindungan aset: wilayah tempat latar belakang jaringan paling berguna.

Pada skema PECB, kredensial ISO/IEC 27001 berjenjang menurut pengalaman: Provisional Auditor (tanpa syarat), Auditor (dua tahun, 200 jam audit), Lead Auditor (lima tahun, 300 jam audit), dan Senior Lead Auditor (sepuluh tahun, 1.000 jam audit). Lulus ujian pelatihan lima hari belum otomatis menjadikan Anda "Lead Auditor".

**Jalur masuk, progresi, dan transisi.** Ini satu-satunya profesi rumpun ini yang punya pintu masuk lulusan baru yang jelas: program trainee atau associate di tim IT audit atau technology risk KAP Big Four, yang biasanya menerima lulusan sistem informasi, informatika, atau akuntansi. Jalur kedua: dari network atau system administrator ke divisi audit intern TI bank atau BUMN. Jalur ketiga: dari tim keamanan ke IT risk. Progresi: associate, senior, assistant manager, manager, lalu kepala audit TI, kepala satuan kerja audit intern, atau Chief Information Security Officer.

Bagi network engineer, transisi ke audit punya keunggulan unik. Auditor TI tanpa latar teknis cenderung menguji keberadaan dokumen: "apakah ada kebijakan firewall?" Auditor dengan latar jaringan bisa menguji isinya: "aturan nomor 47 mengizinkan `any` ke subnet server database dari VLAN tamu, apakah itu sesuai kebijakan?" Perbedaan kualitas temuan ini langsung terlihat oleh manajer audit.

**Konteks pasar kerja Indonesia.** Permintaan dibentuk regulasi: POJK 11/2022 mewajibkan audit intern TI tahunan di bank dan kaji ulang eksternal independen tiga tahunan, sehingga bank membutuhkan auditor TI internal sekaligus jasa pihak ketiga. Audit TIK SPBE menurut Permenkominfo 16/2022 menciptakan kebutuhan auditor di lembaga pelaksana audit dan di inspektorat instansi. Pemberi kerja: KAP Big Four dan KAP menengah, bank (divisi SKAI atau audit intern), lembaga keuangan non-bank, BUMN, perusahaan fintech yang diawasi OJK atau Bank Indonesia, serta lembaga sertifikasi ISO yang membutuhkan auditor SMKI.

Data gaji publik terverifikasi khusus auditor TI di Indonesia tidak ditemukan (panduan gaji rekruter besar umumnya mensyaratkan registrasi), jadi modul ini tidak mengutip angka.

**Belajar dari kurikulum ini.** `09-nat-acl-firewall/02-acl`, `09-nat-acl-firewall/03-firewall`, `12-keamanan/01-konsep-keamanan`, `12-keamanan/04-aaa-identitas`, `12-keamanan/05-hardening-zero-trust`, `06-aplikasi/05-layanan-lain` (syslog dan NTP: bukti log tidak ada artinya kalau jam perangkat tidak sinkron), `14-monitoring-troubleshooting/03-observability`, dan `20-proyek-akhir/02-babak-1-audit-warisan` yang secara harfiah adalah latihan audit.

**Proyek portofolio.**

1. Program kerja audit ITGC fiktif untuk satu perusahaan: matriks risiko dan kontrol (RCM) berisi 15 kontrol (akses, perubahan, operasi, backup), dengan prosedur uji, ukuran sampel, dan bukti yang diminta.
2. Tinjauan rule base firewall dari lab Anda sendiri (`lab/03-lab-ip-services`): temukan aturan yang terlalu longgar, tidak terpakai, atau saling menutupi, lalu tulis tiga temuan dengan format kondisi, kriteria, penyebab, akibat, rekomendasi.
3. Pemetaan Pasal 17, 18, 25, dan 54 POJK 11/2022 ke kontrol teknis yang bisa diuji, dalam satu tabel.

**Pertanyaan wawancara khas.**

- "Apa beda menguji desain kontrol dengan menguji efektivitas operasional kontrol?"
- "Anda menemukan auditee memberi bukti yang tampaknya dibuat ulang setelah permintaan Anda. Apa yang Anda lakukan?"
- "Bagaimana Anda akan menguji bahwa segmentasi jaringan antara zona kartu pembayaran dan jaringan kantor benar-benar efektif, bukan sekadar ada di diagram?"

---

## 5. Disaster Recovery Specialist

**Tiga angka yang menjadi inti profesi ini.** Sebelum masuk ke hari kerjanya, pahami dulu bahasanya:

- **BIA (Business Impact Analysis):** analisis dampak bisnis jika suatu proses atau sistem berhenti. Hasilnya menentukan mana yang kritikal dan seberapa cepat harus pulih.
- **RTO (Recovery Time Objective):** batas waktu maksimum suatu sistem boleh tidak tersedia sebelum dampaknya tidak bisa diterima.
- **RPO (Recovery Point Objective):** titik waktu terakhir data yang boleh hilang. RPO 15 menit berarti kehilangan data paling banyak 15 menit terakhir masih bisa diterima.
- **MTPD/MTD (Maximum Tolerable Period of Disruption / Downtime):** batas waktu gangguan sebelum kelangsungan organisasi terancam. RTO harus lebih kecil dari MTPD.

```
         Bencana
            │
  ◄── RPO ──┤──────────── RTO ────────────►
 data hilang│        sistem tidak tersedia
            │
  backup/   │                         sistem pulih
  replikasi │                         dan diverifikasi
  terakhir  │
```

Contoh ilustratif (bukan ketentuan regulasi): sebuah bank menetapkan core banking RTO 2 jam dan RPO 5 menit, sistem email RTO 24 jam dan RPO 4 jam, intranet RTO 72 jam. Angka itu lahir dari BIA, bukan dari selera tim TI. Semakin kecil RTO dan RPO, semakin mahal solusinya.

**Satu hari kerja yang realistis.** Anda DR specialist di sebuah bank pembangunan daerah. Sabtu depan adalah uji DRP tahunan (wajib menurut Pasal 18 POJK 11/2022) untuk core banking dan ATM, dengan failover ke Disaster Recovery Center (DRC) di kota lain. Pagi Anda memimpin rapat persiapan: tim jaringan memastikan BGP ke dua penyedia di DRC siap mengiklankan rute, tim storage memastikan lag replikasi di bawah RPO, tim aplikasi menyiapkan skenario transaksi, dan perwakilan cabang yang ikut menguji (pasal itu mewajibkan pelibatan pengguna TI) sudah dikonfirmasi. Siang Anda memperbarui runbook: urutan failover, penanggung jawab, perintah verifikasi, kriteria go/no-go, dan fallback. Sore Anda menemukan masalah: TTL record DNS untuk portal internet banking masih 86.400 detik (24 jam). Jika failover lewat perubahan DNS, sebagian klien tetap menuju alamat lama sampai sehari. Anda meminta TTL diturunkan ke 300 detik paling lambat 48 jam sebelum uji. Detail kecil seperti ini yang memisahkan DRP yang bagus di kertas dari DRP yang bekerja.

**Tanggung jawab dan ukuran keberhasilan.**

- Menyusun dan memelihara BIA, strategi pemulihan, DRP, dan runbook teknis.
- Merancang dan memimpin uji DR (tabletop, uji komponen, sampai uji failover penuh), lalu menulis laporan hasil uji beserta tindak lanjut.
- Memastikan arsitektur replikasi dan backup memenuhi RTO/RPO.
- Ukuran keberhasilan: RTO dan RPO **tercapai saat uji** (bukan sekadar tertulis), persentase sistem kritikal yang sudah diuji dalam periode berjalan, temuan uji yang ditutup sebelum uji berikutnya, dan tidak adanya temuan audit atas DRP.

**Keahlian teknis dan non-teknis.** Teknis: backup dan replikasi (sinkron vs asinkron), virtualisasi dan replikasi VM, storage, failover jaringan (BGP, FHRP, DNS, load balancer global), cloud sebagai DR target, dan otomasi runbook. Non-teknis: memfasilitasi BIA dengan unit bisnis (yang sering tidak tahu jawabannya sendiri), memimpin orang di bawah tekanan saat uji atau insiden, serta menulis prosedur yang bisa dijalankan orang yang panik pada pukul tiga pagi.

Satu hal teknis yang sering hanya dipahami orang jaringan: **replikasi sinkron dibatasi fisika**. Cahaya di serat optik merambat sekitar 200.000 km per detik, kira-kira 5 mikrodetik per kilometer satu arah. Untuk DRC berjarak 100 km, RTT dasar sudah sekitar 1 milidetik sebelum ditambah latensi perangkat, dan setiap transaksi tulis pada replikasi sinkron harus menunggu konfirmasi dari sisi seberang. Itulah sebabnya pusat data sekunder yang jauh hampir selalu memakai replikasi asinkron, dan konsekuensinya RPO tidak pernah nol. Pemahaman ini datang langsung dari `00-fondasi/03-sinyal-bandwidth-latency` dan `02-layer-fisik/03-fiber`.

**Alat yang dipakai.** Veeam Backup & Replication, Commvault, VMware Live Site Recovery (dulu Site Recovery Manager), Zerto, Azure Site Recovery, AWS Elastic Disaster Recovery, replikasi storage dari vendor array, serta dokumentasi di Confluence atau perangkat lunak BCM khusus. Untuk sisi jaringan: konfigurasi BGP dan DNS failover, dan alat monitoring untuk memverifikasi bahwa layanan benar-benar pulih.

Panduan DR AWS memberi empat pola yang berguna sebagai kosakata umum: **backup and restore** (termurah, RTO terlama), **pilot light** (data direplikasi terus, server aplikasi "dimatikan"), **warm standby** (salinan berkapasitas kecil yang sudah melayani trafik), dan **multi-site active/active** (termahal, RTO mendekati nol). Panduan yang sama mengingatkan: replikasi berkelanjutan tidak melindungi dari korupsi data atau penghapusan berbahaya, jadi backup titik-waktu tetap wajib.

**Sertifikasi per jenjang.**

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | ABCP (Associate Business Continuity Professional) dari DRI International | Tanpa syarat pengalaman; lulus Qualifying Examination dengan skor minimal 75% |
| Pemula/menengah | EC-Council Disaster Recovery Professional (EDRP), ujian 312-76 | 150 soal, 4 jam, ambang lulus 70% |
| Menengah | CBCP (DRI International); ISO 22301 Lead Implementer atau Lead Auditor | CBCP mensyaratkan pengalaman di beberapa area praktik profesional BC |
| Senior | MBCP (DRI International) | Jenjang tertinggi DRI, mensyaratkan pengalaman lebih panjang dan area praktik lebih luas |

Sertifikasi platform yang Anda kelola (Veeam, VMware, cloud) sama pentingnya. SKKNI khusus DR specialist belum ditemukan saat modul ini disusun; kompetensi biasanya dibuktikan lewat sertifikasi di atas dan pengalaman memimpin uji DRP.

**Jalur masuk, progresi, dan transisi.** Hampir tidak ada yang menjadi DR specialist sebagai pekerjaan pertama. Jalur umum: system, storage, atau network engineer di bank atau penyedia data center yang rutin ikut uji DRP, lalu menjadi orang yang paling paham. Dari network engineer transisinya alami: Anda sudah paham failover BGP, HSRP/VRRP, dan DNS, tinggal menambah backup, replikasi, dan proses BCM. Progresi: BCM manager, kepala risiko operasional, atau IT operations manager. Arah lateral: site reliability engineer dan IT auditor.

**Konteks pasar kerja Indonesia.** Bank dan lembaga keuangan adalah pemberi kerja utama karena kewajiban DRP dan uji tahunan. Penyedia data center dan cloud lokal membutuhkan spesialis untuk layanan DR-as-a-Service. Operator telekomunikasi, BUMN energi dan transportasi, serta instansi pemerintah juga merekrut. Di negeri yang rawan gempa, banjir, dan gangguan listrik, memilih lokasi DRC di zona risiko berbeda adalah keputusan nyata.

Data gaji publik terverifikasi untuk peran ini di Indonesia tidak ditemukan.

**Belajar dari kurikulum ini.** `00-fondasi/03-sinyal-bandwidth-latency`, `06-aplikasi/01-dns`, `07-routing-lanjutan/06-bgp`, `07-routing-lanjutan/08-fhrp`, `11-wan-vpn/01-teknologi-wan`, `16-datacenter-cloud-sdn/01-desain-dc`, `16-datacenter-cloud-sdn/03-storage-virtualisasi`, `16-datacenter-cloud-sdn/04-cloud-networking`, `15-otomasi/04-ansible-cicd` (runbook yang diotomasi), dan `20-proyek-akhir/09-babak-8-malam-panjang`.

**Proyek portofolio.**

1. BIA dan DRP lengkap untuk perusahaan fiktif dengan lima layanan: tabel dampak per jam gangguan, RTO/RPO per layanan dengan justifikasi, dan pemilihan strategi pemulihan beserta biaya relatifnya.
2. Lab failover dua situs: dua "pusat data" di GNS3 atau Containerlab dengan BGP ke dua upstream, satu layanan web, dan replikasi data sederhana (misalnya rsync terjadwal atau replikasi database). Ukur RTO dan RPO aktual saat situs utama dimatikan, lalu tulis laporan uji yang membandingkan target dan hasil.
3. Runbook failover yang diotomasi dengan Ansible, lengkap dengan langkah verifikasi dan rollback.

**Pertanyaan wawancara khas.**

- "Apa beda RTO dan RPO? Beri contoh sistem dengan RTO longgar tapi RPO ketat."
- "Uji DR berhasil secara teknis, tetapi cabang tidak bisa bertransaksi karena alamat IP server berubah dan whitelist di sisi mitra belum diperbarui. Bagaimana Anda mencegahnya di uji berikutnya?"
- "Kenapa replikasi sinkron jarang dipakai untuk DRC yang jaraknya ratusan kilometer?"

---

## 6. Solution Architect

**Satu hari kerja yang realistis.** Anda solution architect di sebuah system integrator. Sebuah perusahaan logistik dengan 120 gudang menerbitkan RFP: mengganti jaringan MPLS lama dengan SD-WAN, menambah Wi-Fi di gudang untuk pemindai barcode, dan menghubungkan semuanya ke aplikasi WMS yang baru dipindahkan ke cloud. Pagi Anda membaca RFP dan menandai hal yang ambigu: berapa pemindai per gudang, apakah ada aplikasi suara (VoIP) yang butuh QoS, apa target ketersediaan per gudang. Siang Anda menyusun arsitektur: dua link per gudang besar (fiber plus 4G/5G sebagai cadangan), satu link plus cadangan seluler untuk gudang kecil, hub SD-WAN di region cloud yang sama dengan WMS, dan segmentasi untuk memisahkan perangkat IoT gudang dari jaringan kantor. Sore Anda menghitung bill of material (BoM) bersama tim pricing: perangkat edge per tipe gudang, lisensi, access point, dan jasa. Malam Anda menulis bagian "Solusi Teknis" proposal.

Di perusahaan pengguna akhir, harinya lebih banyak berisi rapat desain dengan tim aplikasi dan architecture review board.

**Tanggung jawab dan ukuran keberhasilan.**

- Menerjemahkan kebutuhan bisnis menjadi arsitektur solusi yang bisa dibangun, dioperasikan, dan dibiayai.
- Menyusun dokumen arsitektur, keputusan arsitektur (architecture decision record), BoM, dan bagian teknis proposal.
- Mendampingi tim implementasi agar desain tidak menyimpang, dan menjawab pertanyaan teknis pelanggan.
- Ukuran keberhasilan di SI: win rate tender yang didukung, akurasi BoM (selisih antara BoM proposal dan kebutuhan aktual saat implementasi), jumlah change request akibat kesalahan desain, dan kepuasan pelanggan. Di perusahaan pengguna: solusi memenuhi target non-fungsional (ketersediaan, kinerja, keamanan, biaya) yang ditetapkan di awal.

**Keahlian teknis dan non-teknis.** Teknis: luas sekaligus cukup dalam. Jaringan (LAN, WAN, wireless, keamanan), cloud, komputasi dan storage, dasar aplikasi dan integrasi (API), serta keamanan. Kemampuan menghitung kapasitas (bandwidth, sesi, throughput firewall dengan fitur keamanan aktif, jumlah AP) sangat menentukan. Non-teknis: presentasi, menulis proposal, memahami model bisnis pelanggan, negosiasi trade-off (biaya vs ketersediaan), dan berkata "tidak" pada permintaan yang tidak realistis tanpa kehilangan pelanggan.

**Alat yang dipakai.** draw.io atau Microsoft Visio, Lucidchart, Microsoft Excel untuk BoM dan sizing, PowerPoint, alat konfigurasi dan sizing vendor (misalnya Cisco Commerce, kalkulator harga AWS dan Azure), AWS Well-Architected Tool atau Azure Well-Architected Review, Ekahau untuk perencanaan Wi-Fi, Confluence untuk dokumentasi, dan alat pemodelan arsitektur seperti Archi (gratis, mendukung ArchiMate) di organisasi yang memakai TOGAF.

**Sertifikasi per jenjang.**

| Jenjang | Sertifikasi | Catatan per Oktober 2026 |
|---|---|---|
| Fondasi | CCNA 200-301 v1.1, atau sertifikasi cloud tingkat associate | Banyak solution architect jaringan memulai dari sini |
| Menengah | AWS Certified Solutions Architect – Associate (SAA-C03) | 65 soal, 130 menit, USD 150. Belum ada pengumuman versi baru untuk SAA |
| Menengah | Microsoft Certified: Azure Solutions Architect Expert (ujian AZ-305) | Prasyarat: Azure Administrator Associate (AZ-104). Versi bahasa Inggris AZ-305 diperbarui 17 April 2026 |
| Menengah | Google Cloud Professional Cloud Architect | 2 jam, 50 sampai 60 soal, termasuk studi kasus |
| Senior | AWS Certified Solutions Architect – Professional | **Berganti versi:** SAP-C02 terakhir bisa diambil 16 November 2026; SAP-C03 dibuka registrasinya 27 Oktober 2026 dan mulai diujikan 17 November 2026 |
| Senior | TOGAF Enterprise Architecture Foundation dan Practitioner (TOGAF Standard, 10th Edition) | Untuk jalur menuju enterprise architect |
| Spesialis jaringan | AWS Certified Advanced Networking – Specialty (ANS-C01) | **Sedang dipensiunkan:** halaman resmi AWS menyebut hari terakhir ujian 31 Desember 2026, tanpa pengganti yang diumumkan. Sertifikat yang sudah didapat tetap berlaku tiga tahun |

⚠️ Jangan merencanakan belajar setahun untuk ANS-C01 per Oktober 2026: ujiannya akan tutup sebelum Anda siap. Arahkan energi ke SAP-C03 (jika di ekosistem AWS) atau ke sertifikasi desain jaringan vendor.

**Jalur masuk, progresi, dan transisi.** Solution architect hampir selalu senior. Jalur yang paling sering terlihat di Indonesia: network engineer atau system engineer (3 sampai 5 tahun), lalu presales engineer atau technical consultant di SI atau vendor (2 sampai 4 tahun), lalu solution architect. Jalur lain: cloud engineer yang naik menjadi cloud solution architect. Progresi setelahnya: lead atau principal architect, enterprise architect, kepala presales, sampai CTO. Dari network architect, perpindahan ke solution architect adalah perluasan cakupan: dari "jaringan yang benar" ke "solusi menyeluruh yang benar", termasuk aplikasi, data, dan biaya.

💡 **Presales adalah sekolah terbaik untuk solution architect.** Anda dipaksa menjelaskan teknologi kepada pelanggan, menghitung BoM, dan menerima bahwa desain terbaik secara teknis belum tentu menang tender. Lowongan "presales engineer" di distributor dan SI adalah pintu realistis bagi network engineer.

**Konteks pasar kerja Indonesia.** Pemberi kerja: system integrator dan distributor (presales dan solution architect adalah jantung bisnis mereka), vendor jaringan, keamanan, dan cloud, penyedia cloud dan data center lokal, operator telekomunikasi, perusahaan digital, serta bank dan BUMN yang membangun tim arsitektur internal. Banyak proyek pemerintah (SPBE, pusat data, integrasi layanan digital) dimenangkan lewat proposal yang ditulis solution architect di SI.

Data gaji publik yang terverifikasi dan spesifik Indonesia untuk solution architect tidak berhasil diakses dari sumber primer saat modul ini disusun.

**Belajar dari kurikulum ini.** `17-desain-arsitektur/01-prinsip-desain`, `17-desain-arsitektur/02-desain-per-domain`, `17-desain-arsitektur/03-perencanaan-dokumentasi`, `17-desain-arsitektur/04-studi-kasus-desain`, `11-wan-vpn/01-teknologi-wan`, `11-wan-vpn/03-qos`, `10-wireless/04-desain-wlan`, `16-datacenter-cloud-sdn/04-cloud-networking`, `16-datacenter-cloud-sdn/06-sdn`, dan `20-proyek-akhir/03-babak-2-sidang-arsitektur`.

**Proyek portofolio.**

1. Jawaban RFP fiktif lengkap: ringkasan eksekutif, arsitektur solusi, diagram tingkat tinggi dan rinci, BoM dengan asumsi sizing yang ditulis eksplisit, rencana implementasi bertahap, dan daftar risiko.
2. Arsitektur hybrid: kantor pusat on-premise terhubung ke VPC/VNet melalui VPN dan desain cadangan, dengan perhitungan biaya bulanan memakai kalkulator resmi penyedia cloud dan tinjauan memakai pilar Well-Architected.
3. Tiga architecture decision record (ADR) untuk keputusan nyata di lab Anda: misalnya OSPF vs BGP untuk underlay, NAT vs penomoran ulang, Wi-Fi terpusat vs terdistribusi.

**Pertanyaan wawancara khas.**

- "Pelanggan meminta ketersediaan 99,99% untuk 300 cabang dengan anggaran satu link per cabang. Apa jawaban Anda?" (99,99% setara sekitar 52 menit gangguan per tahun; dengan satu link dari satu penyedia, target ini tidak realistis. Jawaban kuat menawarkan opsi dan konsekuensi biayanya.)
- "Ceritakan desain Anda yang gagal di lapangan dan apa yang Anda ubah setelahnya."
- "Bagaimana Anda menghitung throughput firewall yang dibutuhkan untuk kantor pusat 2.000 pengguna?"

---

## 7. Scrum Master Infrastruktur

**Kenapa profesi ini ada.** Scrum lahir di dunia pengembangan perangkat lunak. Tim infrastruktur (jaringan, server, cloud platform) punya karakter berbeda: sebagian besar pekerjaannya tidak terencana. Insiden, permintaan akses, perubahan darurat, dan permintaan "tolong buka port" datang setiap hari. Tim infrastruktur yang dipaksa menjalankan Scrum murni sering frustrasi: sprint direncanakan rapi pada Senin, lalu hancur pada Selasa karena gangguan link ke cabang.

Scrum master infrastruktur adalah orang yang membantu tim seperti ini **menemukan cara kerja yang jujur terhadap kenyataan**: kadang Scrum, sering Kanban, kadang campuran (misalnya sprint untuk pekerjaan proyek ditambah jalur khusus untuk pekerjaan interupsi dengan batas kapasitas).

**Satu hari kerja yang realistis.** Anda scrum master untuk dua tim di sebuah perusahaan e-commerce: tim network dan tim platform cloud. Di Daily Scrum tim network Anda melihat migrasi firewall cabang Surabaya sudah sembilan hari "In Progress" karena menunggu jadwal maintenance window dari cabang. Itu impediment, dan Anda yang mengejarnya, bukan engineer. Data Jira menunjukkan 40% kapasitas tim dalam tiga sprint terakhir habis untuk insiden dan permintaan mendadak. Siang Anda membahas angka itu dengan product owner dan manajer operasi TI: apakah sprint goal realistis jika hampir separuh waktu pasti hilang? Usulan Anda: tetapkan kapasitas eksplisit untuk pekerjaan interupsi, tampilkan di papan sebagai swimlane terpisah dengan batas WIP, dan ukur cycle time-nya. Sore Anda memfasilitasi retrospektif tim platform yang membahas perubahan Terraform yang menyebabkan gangguan DNS internal pekan lalu, dengan suasana tanpa saling menyalahkan (blameless).

**Tanggung jawab dan ukuran keberhasilan.**

- Memfasilitasi event (planning, daily, review, retrospektif) dan memastikan event itu bermanfaat, bukan ritual.
- Menyingkirkan hambatan lintas tim: menunggu persetujuan change advisory board (CAB), menunggu vendor, menunggu tim lain.
- Menyelaraskan cara kerja agile dengan proses ITSM yang ada (change management, incident management), bukan melawannya.
- Ukuran keberhasilan yang sehat adalah **metrik aliran**: cycle time, throughput, umur pekerjaan yang sedang berjalan (work item age), dan prediktabilitas (apakah tim mencapai sprint goal atau target layanannya). Untuk tim infrastruktur, metrik seperti tingkat kegagalan perubahan (change failure rate) dan waktu pemulihan layanan juga relevan. Velocity bukan alat untuk membandingkan tim, dan scrum master yang memakainya untuk menekan tim sedang merusak hal yang seharusnya ia lindungi.

**Kenapa harus paham infrastruktur.** Tanpa itu, scrum master sulit membedakan hambatan nyata dari alasan: kenapa perubahan BGP ke penyedia harus menunggu jendela pemeliharaan, kenapa "cuma ganti satu VLAN" butuh koordinasi tiga tim, atau kenapa otomasi Ansible minggu ini akan memangkas tiket bulan depan. Karena itu peran ini sering diisi mantan network atau system engineer.

**Keahlian teknis dan non-teknis.** Teknis: pemahaman cukup tentang jaringan, sistem, cloud, CI/CD, dan infrastruktur sebagai kode agar bisa berbicara dengan tim; dasar ITSM (change, incident, problem). Non-teknis: fasilitasi, coaching, mendengar, menangani konflik, mengelola pemangku kepentingan, dan membaca data aliran.

**Alat yang dipakai.** Jira (Software dan Service Management), Confluence, Azure DevOps Boards, papan digital seperti Miro atau Mural untuk retrospektif, ServiceNow di organisasi yang memakainya untuk ITSM, dan alat analitik aliran (fitur bawaan Jira atau plugin seperti ActionableAgile).

**Sertifikasi per jenjang.**

| Jenjang | Sertifikasi | Catatan |
|---|---|---|
| Pemula | Professional Scrum Master I (PSM I) dari Scrum.org | Penilaian daring berbahasa Inggris; sertifikasi tidak kedaluwarsa |
| Pemula | Certified ScrumMaster (CSM) dari Scrum Alliance | Wajib kelas 16 jam, ujian 50 soal dengan minimal 37 jawaban benar, perpanjangan tiap dua tahun dengan Scrum Education Units |
| Menengah | Professional Scrum with Kanban (PSK I) dari Scrum.org, atau Team Kanban Practitioner (TKP) dan Kanban Management Professional (KMP) dari Kanban University | Paling relevan untuk tim infrastruktur yang banyak pekerjaan interupsi. KMP terdiri atas kelas Kanban System Design dan Kanban Systems Improvement |
| Menengah | SAFe Scrum Master (SSM) dari Scaled Agile | Relevan di organisasi besar (bank, telko) yang memakai SAFe; ujian 45 soal, 90 menit; pemeliharaan 24 CEU per siklus dua tahun |
| Menengah | ITIL Foundation (Version 5) | Membantu menjembatani agile dengan proses ITSM |
| Senior | PSM II atau Advanced CSM (A-CSM) | Untuk scrum master yang melatih banyak tim |

Rujukan resmi Scrum per 2026 tetap Scrum Guide edisi November 2020. Belum ada SKKNI khusus scrum master yang ditemukan saat modul ini disusun.

**Jalur masuk, progresi, dan transisi.** Jalur paling realistis: beberapa tahun sebagai network atau system engineer di tim yang mulai memakai agile, menjadi orang yang paling rajin memperbaiki cara kerja tim, lalu memegang peran scrum master paruh waktu sebelum penuh waktu. Progresi: scrum master beberapa tim, agile coach, delivery manager, lalu IT operations manager. Kembali ke peran teknis, terutama DevOps atau SRE, juga umum.

⚠️ Peran scrum master di banyak perusahaan Indonesia digabung dengan project manager atau team lead. Baca deskripsi pekerjaannya dengan teliti. Lowongan yang meminta "scrum master yang juga mengatur prioritas dan menilai kinerja anggota tim" sebenarnya sedang mencari manajer, dan itu bertentangan dengan peran scrum master menurut Scrum Guide.

**Konteks pasar kerja Indonesia.** Pemberi kerja utama: bank besar dan bank digital yang menerapkan agile berskala (sering dengan SAFe atau model tribe-squad), perusahaan teknologi dan e-commerce, operator telekomunikasi, BUMN yang memiliki unit digital, serta konsultan agile yang menempatkan scrum master di klien. Lowongan yang secara eksplisit menyebut "scrum master infrastruktur" masih jarang; lebih sering Anda akan menemukan "scrum master" di tim platform, cloud, atau DevOps.

Data gaji publik terverifikasi untuk peran ini di Indonesia tidak ditemukan.

**Belajar dari kurikulum ini.** `14-monitoring-troubleshooting/01-metodologi`, `14-monitoring-troubleshooting/03-observability`, `15-otomasi/01-mengapa-otomasi`, `15-otomasi/04-ansible-cicd`, `17-desain-arsitektur/03-perencanaan-dokumentasi`, dan `20-proyek-akhir/10-babak-9-ruang-rapat`. Fondasi teknis yang membuat Anda dipercaya tim: `03-data-link/03-vlan`, `07-routing-lanjutan/04-ospf`, `09-nat-acl-firewall/03-firewall`.

**Proyek portofolio.**

1. Rancang papan Kanban untuk tim jaringan fiktif: kolom, kebijakan eksplisit (definisi selesai untuk perubahan jaringan), batas WIP, kelas layanan (expedite untuk insiden, standar untuk perubahan terencana, fixed date untuk perpanjangan sertifikat), dan cara mengukurnya.
2. Analisis data aliran: buat 60 tiket fiktif dengan tanggal mulai dan selesai, hitung cycle time, buat grafik cumulative flow, dan tulis tiga rekomendasi perbaikan berdasarkan data.
3. Rencana sprint untuk proyek otomasi (misalnya membuat skrip backup konfigurasi dari `15-otomasi/03-python-jaringan`) dengan backlog, sprint goal, dan definisi selesai.

**Pertanyaan wawancara khas.**

- "Tim infrastruktur Anda kehilangan 40% kapasitas karena pekerjaan tak terencana dan selalu gagal mencapai sprint goal. Apa yang Anda lakukan?"
- "Bagaimana Anda menyelaraskan sprint dengan proses Change Advisory Board yang hanya rapat seminggu sekali?"
- "Manajer meminta Anda melaporkan velocity tiap tim untuk dibandingkan. Bagaimana Anda menanggapinya?"

---

## 8. Kenapa Latar Belakang Jaringan Adalah Keunggulan di Rumpun Ini

Kalau rumpun ini lebih banyak dokumen dan rapat, apakah kurikulum teknis ini sia-sia? Justru sebaliknya, karena lima alasan.

**1. Jaringan adalah tempat semua sistem bertemu.** Aplikasi, database, cloud, pengguna, dan penyerang semuanya lewat jaringan. Orang yang paham jaringan bisa membaca keterkaitan antarsistem, sesuatu yang dibutuhkan konsultan untuk assessment, auditor untuk memahami ruang lingkup, DR specialist untuk memetakan ketergantungan, dan solution architect untuk desain menyeluruh.

**2. Anda tahu bagaimana sistem gagal.** Bertahun-tahun troubleshooting (`14-monitoring-troubleshooting/01-metodologi`) membentuk intuisi tentang mode kegagalan: asymmetric routing, MTU yang tidak cocok, TTL DNS, split-brain pada cluster, link cadangan yang ternyata lewat jalur fisik yang sama dengan link utama. Rencana DR dan desain solusi yang ditulis tanpa intuisi ini cenderung optimistis.

**3. Anda bisa memverifikasi, bukan sekadar menerima klaim.** Auditor yang bisa membaca rule base firewall, konsultan yang bisa menjalankan Nmap untuk memvalidasi inventaris, dan architect yang bisa menghitung kebutuhan bandwidth sendiri jauh lebih sulit dibohongi, termasuk oleh vendor.

**4. Bahasa yang sama dengan tim teknis.** Tim teknis lebih terbuka kepada auditor, konsultan, atau scrum master yang "pernah di posisi mereka". Kepercayaan ini membuat Anda mendapat informasi yang lebih jujur.

**5. Kerangka tata kelola sendiri menuntut pemahaman teknis.** Dua domain terbesar CISA (masing-masing 26%) adalah operasi/ketahanan dan perlindungan aset. Annex A ISO/IEC 27001:2022 memuat kontrol keamanan jaringan, segregasi jaringan, dan penyaringan web. AZ-305 menguji desain kelangsungan bisnis dan infrastruktur, dan halaman sertifikasinya menyebut networking sebagai pengalaman yang diharapkan.

### Peta transisi dari peran inti

| Dari | Ke | Jembatan yang perlu Anda tambahkan |
|---|---|---|
| Network administrator | IT auditor | Metodologi audit, sampling, penulisan temuan, CISA |
| Network engineer | Disaster recovery specialist | Backup dan replikasi, BIA, ISO 22301, memimpin uji |
| Network engineer | Solution architect | Cloud, aplikasi dan integrasi, BoM dan biaya, presentasi (lewat presales) |
| Network engineer atau architect | IT consultant | Kerangka tata kelola (COBIT, ISO/IEC 27001), menulis laporan untuk manajemen |
| Network atau system engineer | Scrum master infrastruktur | Scrum dan Kanban, fasilitasi, metrik aliran |

💡 Satu kebiasaan yang membantu transisi ke mana pun di rumpun ini: mulai sekarang, setiap kali Anda menyelesaikan pekerjaan teknis, tulis ringkasan satu paragraf untuk pembaca non-teknis. Apa yang berubah, kenapa penting, apa risikonya kalau tidak dilakukan. Kebiasaan ini melatih otot yang paling dibutuhkan kelima profesi tersebut.

---

## 9. Ringkasan

- **IT consultant** mengubah kondisi teknis menjadi pilihan keputusan; **IT auditor** membuktikan kontrol benar-benar berjalan; **DR specialist** menjamin pemulihan sesuai RTO/RPO hasil BIA; **solution architect** merancang solusi yang bisa dibangun dan dibiayai; **scrum master infrastruktur** menyehatkan aliran kerja tim yang penuh interupsi.
- Kerangka kunci per 2026: COBIT 2019, ISO/IEC 27001:2022, ISO 22301:2019 (Amd 1:2024), TOGAF Standard 10th Edition, Scrum Guide 2020, ITIL (Version 5). Regulasi penggerak pasar: POJK 11/POJK.03/2022 dan PADK OJK 1/2026, Permenkominfo 16/2022, Perpres 82/2023, PER-2/MBU/03/2023, SKKNI Audit TI (Kepmenaker 231/2024).
- Hanya IT auditor yang realistis dimasuki lulusan baru. Empat lainnya adalah tujuan tahap kedua karier, dan latar belakang jaringan adalah fondasi yang kuat untuk mencapainya.

---

## 10. Latihan

1. Anda network engineer dengan tiga tahun pengalaman di sebuah ISP dan ingin pindah ke IT audit di bank. Susun rencana 12 bulan yang realistis: sertifikasi apa, pengetahuan apa yang harus ditambah, dan bagaimana Anda menjelaskan nilai latar belakang Anda saat wawancara.
2. Sebuah bank menetapkan RPO 0 (nol kehilangan data) untuk core banking, dengan DRC di kota lain berjarak sekitar 700 km. Tim storage mengusulkan replikasi sinkron. Jelaskan masalahnya dan alternatif yang lebih realistis, termasuk konsekuensinya terhadap RPO.
3. Saat uji DRP tahunan, failover ke DRC berhasil dalam 45 menit (RTO 2 jam), tetapi 30% cabang tetap tidak bisa bertransaksi selama 6 jam berikutnya. Investigasi menunjukkan aplikasi di cabang memakai nama DNS dengan TTL 24 jam. Bagaimana Anda menuliskan hasil uji ini, dan apa tindak lanjutnya?
4. Anda auditor TI yang menguji kontrol "setiap perubahan konfigurasi firewall harus disetujui sebelum diterapkan". Dari 25 sampel tiket, semuanya punya persetujuan. Apakah Anda bisa menyimpulkan kontrol efektif? Apa uji tambahan yang perlu dilakukan?
5. Pelanggan meminta solusi dengan ketersediaan 99,99% untuk 300 cabang, tetapi anggarannya hanya cukup untuk satu link broadband per cabang. Sebagai solution architect, bagaimana Anda menanggapi tanpa kehilangan tender?
6. Tim jaringan yang Anda dampingi sebagai scrum master gagal mencapai sprint goal empat sprint berturut-turut. Data menunjukkan rata-rata 45% kapasitas habis untuk insiden dan permintaan mendadak. Usulkan perubahan cara kerja dan metrik untuk memantau dampaknya.
7. Sebagai konsultan, Anda diminta membantu sebuah pemerintah kabupaten menyiapkan diri menghadapi audit TIK SPBE untuk infrastruktur dan keamanan. Apa yang Anda periksa lebih dulu, dan bagian mana dari kurikulum ini yang paling menentukan kualitas pekerjaan Anda?
8. Seorang rekan menulis di CV: "Certified ISO 27001:2013 Lead Auditor, AWS Advanced Networking Specialty (sedang belajar, target ujian Maret 2027), TOGAF 10 Foundation". Apa yang perlu ia perbaiki dan kenapa?

<details>
<summary>Jawaban</summary>

1. **Bulan 1 sampai 3:** pelajari bahasa audit: COBIT 2019, Annex A ISO/IEC 27001:2022, pasal 17, 18, 25, 54, dan 55 POJK 11/2022, serta PADK OJK 1/2026. Mulai persiapan CISA, fokus pada domain yang paling asing (proses audit, akuisisi dan pengembangan sistem). **Bulan 4 sampai 6:** ambil ujian CISA. Lulus ujian belum sama dengan tersertifikasi; ada lima tahun setelah lulus untuk memenuhi syarat pengalaman sesuai ketentuan ISACA. **Bulan 7 sampai 9:** bangun portofolio (RCM ITGC fiktif, tinjauan rule base firewall lab, pemetaan pasal POJK ke kontrol teknis), dan pertimbangkan pelatihan ISO/IEC 27001 Lead Auditor atau uji kompetensi berbasis SKKNI Audit TI di LSP berlisensi BNSP. **Bulan 10 sampai 12:** melamar ke audit intern TI bank, tim IT risk Big Four, atau lembaga sertifikasi ISO. Di wawancara, jual kemampuan **memverifikasi**: "Saya bisa membaca konfigurasi router dan firewall langsung, jadi saya menguji apakah segmentasi benar-benar ada, bukan hanya apakah dokumennya ada," lalu beri contoh nyata dari pengalaman di ISP.

2. Replikasi sinkron membuat setiap operasi tulis menunggu konfirmasi dari DRC. Cahaya di serat sekitar 5 mikrodetik per km satu arah, jadi 700 km garis lurus sudah memberi RTT dasar sekitar 7 ms, padahal jalur serat sebenarnya lebih panjang dan ada latensi perangkat. Untuk core banking bervolume tinggi, tambahan beberapa milidetik per operasi tulis menurunkan throughput secara nyata. Alternatif: (a) arsitektur tiga situs, yaitu replikasi sinkron ke pusat data kedua yang dekat (belasan sampai puluhan km) lalu asinkron ke DRC jauh, sehingga RPO mendekati nol untuk kegagalan satu pusat data dan beberapa detik sampai menit untuk bencana regional; atau (b) replikasi asinkron langsung ke DRC dengan RPO yang dinyatakan jujur dan disetujui pemilik bisnis berdasarkan BIA. Intinya: RPO 0 ke situs ratusan km berbenturan dengan fisika, bukan sekadar anggaran.

3. Tulis hasilnya sebagai **tidak memenuhi RTO dari sudut pandang layanan**, walaupun failover teknis selesai 45 menit, karena RTO diukur sampai layanan bisa dipakai pengguna. Format temuan: kondisi (30% cabang tidak bisa bertransaksi sekitar 6 jam 45 menit), kriteria (RTO 2 jam), penyebab (TTL DNS 24 jam dan DRP tanpa langkah menurunkan TTL), akibat (pada bencana sungguhan, transaksi cabang terhenti jauh melebihi toleransi), rekomendasi. Tindak lanjut: turunkan TTL record kritikal (misalnya 300 detik) secara permanen atau sebagai langkah pra-uji, pertimbangkan failover yang tidak bergantung pada cache DNS (alamat yang sama diiklankan dari DRC lewat BGP, anycast, atau load balancer global), tambahkan verifikasi dari sisi cabang ke runbook, dan jadwalkan uji ulang.

4. Belum bisa. Sampel diambil dari **populasi tiket**, jadi uji ini hanya membuktikan bahwa perubahan yang punya tiket juga punya persetujuan. Kontrol ini juga harus mencegah perubahan **tanpa tiket**. Ambil populasi perubahan dari sumber independen (log audit firewall manager, syslog perintah konfigurasi, riwayat versi alat backup konfigurasi) lalu cocokkan ke tiket; setiap perubahan tanpa tiket adalah pengecualian. Periksa juga apakah persetujuan mendahului penerapan, apakah penyetuju berbeda dengan pelaksana (segregation of duties), dan apakah perubahan darurat mendapat persetujuan pasca-kejadian. Pastikan jam perangkat tersinkron NTP; tanpa itu, perbandingan waktu log dan tiket tidak bisa dipercaya.

5. Jangan menjanjikan yang mustahil: 99,99% setara sekitar 52 menit gangguan per tahun, dan satu link broadband dari satu penyedia tidak dirancang untuk itu. Klarifikasi dulu kebutuhan sebenarnya (mungkin hanya transaksi tertentu atau cabang besar yang butuh 99,99%). Tawarkan opsi bertingkat: link broadband plus cadangan seluler 4G/5G untuk semua cabang, dua penyedia berbeda untuk cabang tier 1, dan jalur fisik terpisah untuk lokasi paling kritikal, masing-masing dengan perkiraan ketersediaan, asumsi, dan biaya. Tulis risiko dan batasannya secara eksplisit. Proposal yang jujur dan menunjukkan pemahaman masalah sering lebih meyakinkan daripada proposal termurah, dan janji mustahil biasanya berakhir dengan sengketa SLA.

6. Berhenti berpura-pura kapasitasnya 100%. Buat pekerjaan interupsi terlihat (swimlane atau kelas layanan terpisah dengan batas WIP), rencanakan sprint hanya dengan sekitar separuh kapasitas, pertimbangkan rotasi "penjaga interupsi" mingguan, dan jika aliran tak terencana memang dominan, pertimbangkan Kanban sepenuhnya. Serang akar masalah: analisis kategori tiket yang paling sering muncul, lalu jadikan otomasi atau perbaikan permanen sebagai item backlog. Metrik: persentase kapasitas untuk pekerjaan tak terencana (harapannya turun), cycle time per kelas layanan, work item age, tingkat pencapaian sprint goal, dan jumlah tiket berulang. Putuskan bersama tim di retrospektif, bukan sepihak.

7. Mulai dari ruang lingkup Permenkominfo 16/2022 (infrastruktur, aplikasi, keamanan SPBE). Periksa lebih dulu: inventaris aset, diagram topologi yang sesuai kenyataan, kebijakan keamanan, bukti pengelolaan perubahan, bukti backup dan uji restore, serta log. Lalu lakukan gap assessment terhadap kriteria lembaga pelaksana, susun prioritas perbaikan, dan siapkan staf menghadapi wawancara auditor. Modul yang paling menentukan: `17-desain-arsitektur/03-perencanaan-dokumentasi`, `12-keamanan/05-hardening-zero-trust`, `09-nat-acl-firewall/03-firewall`, `06-aplikasi/05-layanan-lain` (syslog dan NTP sebagai bukti), dan `14-monitoring-troubleshooting/03-observability`. Temuan klasik di pemda, yaitu diagram yang tidak sesuai kenyataan dan password bawaan, hanya terlihat oleh orang yang mau memeriksa langsung.

8. (a) **ISO/IEC 27001:2013 sudah tidak berlaku** sejak masa transisi berakhir 31 Oktober 2025; tulis kredensial 2022 jika sudah mengikuti pelatihan transisi, atau ikuti dulu. Pada skema seperti PECB, gelar "Lead Auditor" juga mensyaratkan pengalaman dan jam audit; jika belum terpenuhi, kredensial yang benar mungkin "Provisional Auditor" atau "Auditor". (b) **ANS-C01 dijadwalkan pensiun**: halaman resmi AWS menyebut hari terakhir ujian 31 Desember 2026, tanpa pengganti yang diumumkan, jadi target Maret 2027 tidak mungkin. (c) **Tidak ada "TOGAF 10 Foundation"**; namanya TOGAF Enterprise Architecture Foundation. Di rumpun tata kelola, ketelitian terhadap versi dan nama standar adalah bagian dari kompetensi itu sendiri.

</details>

---

## 11. Sumber

- ISACA, Credentialing (daftar sertifikasi aktif): https://www.isaca.org/credentialing
- ISACA, CISA: https://www.isaca.org/credentialing/cisa
- ISACA, CISA Job Practice Areas: https://www.isaca.org/credentialing/cisa/cisa-job-practice-areas
- ISACA, CISM: https://www.isaca.org/credentialing/cism
- ISACA, CRISC: https://www.isaca.org/credentialing/crisc
- ISACA, CGEIT: https://www.isaca.org/credentialing/cgeit
- PECB, ISO/IEC 27001 Lead Auditor: https://pecb.com/en/education-and-certification-for-individuals/iso-iec-27001/iso-iec-27001-lead-auditor
- LRQA, Preparing for ISO/IEC 27001:2022 transition by October 2025: https://www.lrqa.com/en/insights/articles/preparing-for-iso-270012022-transition-by-october-2025/
- BSI Knowledge, ISO 22301:2019 Amendment 1: Climate action changes: https://knowledge.bsigroup.com/products/security-and-resilience-business-continuity-management-systems-requirements-amendment-1-climate-action-changes
- NIST SP 800-34 Rev. 1, Contingency Planning Guide for Federal Information Systems: https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final
- O*NET OnLine, Business Continuity Planners (13-1199.04): https://www.onetonline.org/link/summary/13-1199.04
- DRI International, ABCP: https://drii.org/certification/abcp
- EC-Council, Disaster Recovery Professional (EDRP): https://cert.eccouncil.org/ec-council-disaster-recovery-professional.html
- AWS Whitepaper, Disaster Recovery of Workloads on AWS: Disaster recovery options in the cloud: https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html
- AWS, Certified Solutions Architect – Associate: https://aws.amazon.com/certification/certified-solutions-architect-associate/
- AWS Training and Certification Blog, September 2026 new offerings (SAP-C03): https://aws.amazon.com/blogs/training-and-certification/september-2026-new-offerings/
- AWS, Certified Advanced Networking – Specialty: https://aws.amazon.com/certification/certified-advanced-networking-specialty/
- Microsoft Learn, Azure Solutions Architect Expert: https://learn.microsoft.com/en-us/credentials/certifications/azure-solutions-architect/
- Google Cloud, Professional Cloud Architect: https://cloud.google.com/learn/certification/cloud-architect
- The Open Group, The TOGAF Standard: https://www.opengroup.org/togaf
- The Open Group, TOGAF Certification Portfolio: https://www.opengroup.org/certifications/togaf
- Scrum Guides: https://scrumguides.org/
- Scrum.org, Professional Scrum Master I: https://www.scrum.org/assessments/professional-scrum-master-i-certification
- Scrum Alliance, Certified ScrumMaster: https://www.scrumalliance.org/get-certified/scrum-master-track/certified-scrummaster
- Scaled Agile, SAFe Scrum Master: https://scaledagile.com/training/safe-scrum-master/
- Kanban University, Kanban Management Professional: https://kanban.university/kmp/
- PeopleCert, ITIL certifications: https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1
- POJK 11/POJK.03/2022 tentang Penyelenggaraan Teknologi Informasi oleh Bank Umum (teks lengkap): https://peraturan.go.id/files/pojk11-2022.pdf
- OJK, halaman regulasi POJK 11/POJK.03/2022: https://ojk.go.id/id/regulasi/Pages/Penyelenggaraan-Teknologi-Informasi-oleh-Bank-Umum.aspx
- OJK, PADK Nomor 1 Tahun 2026 tentang Penyelenggaraan Teknologi Informasi oleh Bank Umum: https://ojk.go.id/id/regulasi/Pages/PADK-1-Tahun-2026-Penyelenggaraan-Teknologi-Informasi-oleh-Bank-Umum.aspx
- Permenkominfo Nomor 16 Tahun 2022 tentang Kebijakan Umum Penyelenggaraan Audit TIK: https://peraturan.bpk.go.id/Details/255601
- Perpres Nomor 82 Tahun 2023 tentang Percepatan Transformasi Digital dan Keterpaduan Layanan Digital Nasional: https://peraturan.bpk.go.id/Details/273981
- Permen BUMN PER-2/MBU/03/2023 tentang Pedoman Tata Kelola dan Kegiatan Korporasi Signifikan BUMN: https://jdih.kemenkoinfra.go.id/peraturan-menteri-bumn-no-per2-mbu-03-2023
- Kepmenaker Nomor 231 Tahun 2024 tentang SKKNI Bidang Audit Teknologi Informasi: https://jdih.kemnaker.go.id/peraturan/detail/2551/keputusan-menteri-ketenagakerjaan-nomor-231-tahun-2024
- Jobstreet Indonesia, Gaji Konsultan Teknis: https://id.jobstreet.com/id/career-advice/role/technical-consultant/salary

---

**Berikutnya:** `lab/00-setup-lab` — saatnya praktik: siapkan lab gratis, kerjakan lab bertahap, lalu uji semua bekal di proyek akhir.

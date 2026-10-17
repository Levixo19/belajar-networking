# Lab 00b: Panduan Cisco Packet Tracer

> **Prasyarat:** `lab/00-setup-lab`
> **Tujuan:** Anda bisa memasang Packet Tracer lewat jalur resmi, membangun dan menguji jaringan pertama lewat CLI, lalu memakai Simulation Mode untuk melihat ARP, ICMP, DNS, dan HTTP berjalan lapis demi lapis, sehingga siap mengerjakan Lab 01 sampai Lab 04.
> **Platform:** Cisco Packet Tracer 9.0.1, versi terbaru di halaman unduhan resmi saat diperiksa 17 Oktober 2026.

---

## 1. Apa Itu Packet Tracer

Orang belajar menyetir di lapangan kursus dulu, baru di jalan raya. Di lapangan, mesin mati di tanjakan cuma berarti Anda mencoba lagi. Packet Tracer adalah lapangan kursus untuk jaringan: router, switch, PC, server, dan kabelnya hidup di laptop Anda. Anda boleh salah ketik perintah, mencabut kabel, bahkan membuat loop, lalu memperbaikinya tanpa mengganggu siapa pun.

Packet Tracer dibuat dan dikembangkan oleh Cisco untuk program pendidikannya, Cisco Networking Academy (disingkat NetAcad). Bantuan resminya menggolongkan Packet Tracer sebagai lingkungan belajar berbasis simulasi dengan fidelitas menengah, ditujukan bagi pemula untuk merancang, mengonfigurasi, dan memecahkan masalah jaringan sampai tingkat kerumitan CCNA. Menurut bantuan yang sama, Cisco membuatnya karena banyak pelajar dan pengajar tidak punya akses ke perangkat, bandwidth, dan cara belajar interaktif.

"Fidelitas menengah" punya arti praktis. Packet Tracer tidak menjalankan Cisco IOS asli. Ia menjalankan model IOS yang disederhanakan, dibuat dengan image sungguhan sebagai acuan. Sebagian besar perintah tingkat CCNA tersedia, tetapi tidak semuanya, dan beberapa keluaran bisa berbeda dari perangkat fisik. Bagian 7 membahas batas ini.

Dari 21 sub-lab di `lab/01` sampai `lab/04`, 20 bisa dikerjakan di Packet Tracer. Pengecualiannya Lab 2.6 (eBGP), yang menyarankan GNS3 atau Containerlab supaya lebih realistis. Kalau alatnya sudah lancar, perhatian Anda bisa tercurah penuh ke konsep yang sedang dilatih.

### 1.1 Versi terbaru

Per 17 Oktober 2026, halaman unduhan resmi NetAcad (Resource Hub) menawarkan Packet Tracer 9.0.1 untuk Windows, Ubuntu, dan macOS, semuanya 64-bit. Menurut halaman What's New di bantuan resmi, seri 9.0 menambah perangkat dan protokol jaringan industri (operational technology, OT), model router Cisco C8200, sambungan fiber optik yang lebih realistis, dan proses login yang lebih ringkas. Nomor versi berubah dari waktu ke waktu, jadi periksa halaman unduhan sebelum memasang.

### 1.2 Gratis, dengan syarat

Packet Tracer gratis, tetapi tidak bebas dipakai untuk apa saja. Tiga dokumen resmi mengaturnya, dan ringkasannya begini:

1. Halaman Packet Tracer di netacad.com. Perangkat lunak ini tersedia gratis bagi instruktur, pelajar, dan alumni Cisco Networking Academy. Pendatang baru dianjurkan mendaftar kursus gratis Getting Started with Cisco Packet Tracer, yang juga mengajarkan cara mengunduh dan memasangnya. Peserta yang sudah terdaftar aktif bisa mengunduh versi terbaru dengan login ke netacad.com. Halaman yang sama menyatakan Packet Tracer boleh dipasang di komputer atau laptop pribadi dan dipakai di luar kelas untuk tugas, latihan, dan belajar mandiri.
2. Offer Description untuk Cisco Packet Tracer Software, dokumen yang dirujuk sebagai SEULA, versi 2.0 yang terakhir diubah 10 September 2025. Lisensinya per pengguna dan tidak berbatas waktu (perpetual). Pemakaiannya dibatasi untuk membuat, menampilkan, atau menjalankan simulasi jaringan dari berkas `.pkt`, `.pkz`, atau `.pka` dalam kaitan dengan Cisco Networking Academy, atau untuk tujuan lain yang disetujui Cisco secara tertulis. Tanpa persetujuan tertulis itu, Packet Tracer tidak boleh dipakai untuk mengajar kursus di luar NetAcad, membuat materi kursus, video, atau buku, maupun pemakaian komersial dan nonkomersial lainnya. Perangkat lunaknya diberikan apa adanya (as is), tanpa jaminan.
3. Halaman Copyrights di bantuan resmi. Mengunduh, memasang, atau memakai Packet Tracer berarti Anda menerima EULA umum Cisco dan Offer Description tadi.

> [!NOTE]
> Mengerjakan lab kurikulum ini di laptop sendiri sebagai peserta kursus NetAcad cocok dengan pemakaian yang disebut halaman resmi: latihan dan belajar mandiri. Yang butuh izin tertulis Cisco adalah memakai Packet Tracer untuk membuat konten, misalnya video tutorial, kursus, atau buku. Ketentuan bisa berubah, jadi baca ulang dokumen aslinya (tautannya di bagian Sumber) kalau tujuan Anda berbeda.

---

## 2. Mendapatkan dan Memasang Packet Tracer

### 2.1 Akun NetAcad dan kursus gratis

Urutan berikut mengikuti halaman resmi dan FAQ-nya:

1. Buka netacad.com, klik Sign up, lalu buat akun gratis.
2. Daftar (enroll) ke kursus Getting Started with Cisco Packet Tracer. Kursus ini gratis, mandiri, untuk pemula, dan memakan sekitar 2 jam. Modul 1-nya berjudul Download and Use Cisco Packet Tracer, Modul 2-nya Create a Cisco Packet Tracer Network.
3. Dalam keadaan login, buka Resource Hub di `https://www.netacad.com/resources/lab-downloads`. Tautan unduhan di halaman itu baru aktif setelah Anda login.
4. Unduh berkas untuk sistem operasi Anda.

> [!TIP]
> Jangan berhenti di pendaftaran akun. Menurut FAQ resmi, akun yang belum terdaftar di satu kursus pun bisa ditolak saat login di Packet Tracer dengan pesan "Sorry, we can't find a NetAcad account associated with this Cisco account." Mendaftar ke kursus apa saja, misalnya Getting Started tadi, menyelesaikan masalah itu.

Sesudah Getting Started, NetAcad punya dua kursus lanjutan yang juga gratis: Exploring Networking with Cisco Packet Tracer dan Exploring Internet of Things with Cisco Packet Tracer. Setelah ketiganya selesai, Anda bisa mengambil ujian Introduction to Packet Tracer untuk mendapat lencana digital. Semua itu opsional untuk kurikulum ini.

### 2.2 Persyaratan sistem

| Kebutuhan | Menurut halaman unduhan resmi |
|---|---|
| Sistem operasi | Windows 11, macOS 12 atau lebih baru, Ubuntu 22.04 atau 24.04 LTS |
| Prosesor | amd64 (x86-64) |
| RAM bebas | 4 GB |
| Ruang disk bebas | 1,4 GB |

Halaman System Requirements di bantuan versi 9.0 menambahkan layar 1920 x 1080 dan masih menyebut Windows 10 64-bit, sedangkan halaman unduhan terbaru hanya menyebut Windows 11. Login membutuhkan internet. Packet Tracer tidak tersedia untuk ponsel dan tablet.

Bantuan resmi juga memberi peringatan soal memori: Packet Tracer tidak membatasi pemakaian RAM, dan topologi besar dengan protokol rumit bisa butuh 2 GB atau lebih. Loop STP yang tidak disengaja ikut menaikkan kebutuhan itu dan bisa membuat aplikasi tidak stabil.

### 2.3 Instalasi di Windows

Langkahnya mengikuti dokumen petunjuk instalasi resmi:

1. Klik dua kali berkas installer yang Anda unduh.
2. Jendela Setup membuka License Agreement. Baca, pilih I accept the agreement, lalu klik Next.
3. Di Select Destination Location, terima lokasi bawaan atau pilih lokasi lain, lalu Next.
4. Di Select Start Menu Folder, terima bawaannya, lalu Next.
5. Di Select Additional Tasks, pilih pintasan yang Anda mau, lalu Next.
6. Di Ready to Install, periksa pilihan Anda, lalu klik Install.
7. Setelah selesai, kotak Launch Cisco Packet Tracer sudah tercentang. Klik Finish.

### 2.4 Instalasi di Ubuntu (paket .deb resmi)

Cisco menyediakan paket `.deb` untuk Ubuntu. Instalasinya lewat terminal dengan hak administrator:

```bash
cd ~/Downloads
sudo apt-get install ./CiscoPacketTracer_xxx_Ubuntu_64bit.deb
```

`xxx` adalah nomor versi pada nama berkas yang Anda unduh. Ketik `./Cisco` lalu tekan Tab supaya terminal melengkapi namanya. Awalan `./` penting: tanpa awalan itu, `apt-get` menganggapnya nama paket di repositori, bukan berkas di folder Anda.

Perjanjian lisensi muncul sebagai dialog teks di terminal, dan mouse tidak berfungsi di sana. Tekan Tab sampai `<OK>` tersorot lalu Enter, kemudian Tab ke `<Yes>` dan Enter untuk menerima. Setelah selesai, buka Packet Tracer dari menu aplikasi atau dengan perintah:

```bash
packettracer
```

> [!WARNING]
> Paket resmi hanya untuk Ubuntu 22.04 dan 24.04 LTS. Untuk distro lain seperti Fedora atau Arch, Cisco tidak menyediakan paket. Jalur yang tetap resmi adalah memasang Ubuntu 24.04 LTS di mesin virtual, lalu memasang Packet Tracer di dalamnya. Cara tidak resmi seperti mengonversi paket atau memakai kontainer berada di luar dukungan Cisco, dan masalah yang muncul harus Anda pecahkan sendiri.

Di macOS, buka berkas `.dmg`, ikuti jendela Setup (Continue, I accept the agreement, Install), lalu jalankan aplikasinya dari folder Applications.

### 2.5 Membuka pertama kali dan login

1. Saat pertama dibuka, Packet Tracer bertanya "Would you like to run multi-user when the application starts?" Jawab No. Fitur multi-user, yang menyambungkan beberapa Packet Tracer lewat jaringan, belum Anda perlukan.
2. Windows mungkin menampilkan Windows Security Alert dari firewall. Multi-user butuh akses jaringan, tetapi untuk lab biasa Anda boleh menolaknya.
3. Jendela Cisco Packet Tracer Login muncul. Sakelar Keep me logged in menyimpan login selama 3 bulan. Aktifkan hanya di laptop pribadi, jangan di komputer lab atau warnet.
4. Klik LOGIN. Browser terbuka ke halaman login NetAcad. Kalau sesi web Anda masih aktif, browser langsung menampilkan "You have successfully logged in to Cisco Packet Tracer. You may close this tab." Kalau belum, masukkan akun NetAcad Anda dulu.
5. Tutup tab itu dan kembali ke Packet Tracer.

Kalau browser eksternal bermasalah, tautan Advanced Settings di jendela login bisa memindahkan proses login ke browser internal Packet Tracer. Untuk keluar dari akun, gunakan menu File. Menurut FAQ resmi, jendela login yang kosong biasanya berarti komputer tidak terhubung ke internet atau pengaturan proxy sistem operasinya salah.

---

## 3. Tur Antarmuka

### 3.1 Peta layar

Saat dibuka, Packet Tracer berada di Logical Workspace dan Realtime Mode. Bantuan resminya membagi layar menjadi sepuluh komponen. Tujuh yang paling sering Anda sentuh:

| Bagian | Letak | Isi |
|---|---|---|
| Menu Bar | paling atas | File, Edit, Options, View, Tools, Extensions, Window, Help. Preferences ada di Options, Activity Wizard di Extensions |
| Common Tools Bar | tepat di bawah toolbar utama (Main Tool Bar) | Select, Inspect, Delete, Resize Shape, Place Note, Drawing Palette, Add Simple PDU, Add Complex PDU |
| Bilah Logical/Physical | tepat di atas area kerja | tab untuk berpindah workspace |
| Workspace | tengah | tempat Anda membangun dan mengamati jaringan |
| Bilah Realtime/Simulation | tepat di bawah area kerja | jam, tombol Power Cycle Devices dan Fast Forward Time, tab Realtime dan Simulation di ujung kanan |
| Network Component Box | kiri bawah | pemilih jenis perangkat (Device-Type Selection Box), pemilih model (Device-Specific Selection Box), dan kolom pencarian |
| User Created Packet Window | kanan bawah | paket uji yang Anda buat, dikelompokkan per skenario (Scenario 0, tombol New dan Delete) |

Arahkan mouse ke ikon mana pun untuk melihat balon penjelasannya. Bantuan lengkap terbuka lewat Help > Contents atau tombol F1.

Dua alat di Common Tools Bar akan sering Anda pakai. Select (tombol Esc) untuk memilih dan memindahkan objek, sekaligus membatalkan alat lain yang sedang aktif. Inspect untuk melihat tabel yang dibangun perangkat, misalnya tabel ARP, tabel MAC, dan tabel routing. Mengarahkan mouse ke perangkat hanya menampilkan ringkasan port, alamat IP, dan MAC; itu bukan isi tabelnya.

### 3.2 Logical Workspace dan Physical Workspace

Logical Workspace adalah tempat Anda menghabiskan hampir seluruh waktu lab: menaruh perangkat, menyambung kabel, dan mengonfigurasi. Jarak antarikon di layar tidak punya arti fisik.

Physical Workspace memberi dimensi fisik pada topologi yang sama. Hierarkinya Intercity, City (bawaannya bernama Home City), Building (Corporate Office), lalu Wiring Closet (Main Wiring Closet). Di wiring closet, router dan switch yang Anda buat di Logical Workspace tampil tersusun di rak dan meja. PC dan perangkat ujung lain tidak ikut masuk ke sana. Kalau opsi Enable Cable Length Effects di Preferences aktif, panjang kabel dan jarak nirkabel di Physical Workspace ikut menentukan apakah link bisa hidup.

Untuk Lab 01 sampai Lab 04, Anda cukup bekerja di Logical Workspace. Pintasannya Shift+L untuk Logical dan Shift+P untuk Physical.

### 3.3 Realtime Mode dan Simulation Mode

Bayangkan siaran langsung pertandingan sepak bola dan ruang VAR. Siaran langsung terus berjalan, dan penonton hanya melihat hasil akhir setiap kejadian. Di ruang VAR, wasit menghentikan waktu, memutar ulang bingkai demi bingkai, dan memperbesar detail sampai jelas siapa menyentuh bola duluan.

Realtime Mode adalah siaran langsungnya. Jaringan terus berjalan seperti jaringan sungguhan, perintah di CLI langsung dijawab, dan ping selesai dalam sekejap. Waktunya tetap model: FAQ resmi menyebut waktu Realtime tidak persis sama dengan waktu dunia nyata dan bisa melambat saat perangkat dan protokol bertambah. Dua tombol di bilah bawah layak diingat:

- Fast Forward Time (Alt+D) memajukan waktu 30 detik setiap kali diklik. Berguna saat Anda menunggu STP selesai.
- Power Cycle Devices (Alt+S) mematikan lalu menyalakan semua perangkat. Running-config router dan switch yang belum disimpan akan hilang (bagian 4.7 dan 8).

Simulation Mode adalah ruang VAR-nya. Waktu jaringan berhenti dan baru bergerak saat Anda menekan tombol. Anda bisa melangkah satu kejadian demi satu kejadian, melihat amplop paket berpindah dari perangkat ke perangkat, lalu membuka isi setiap paket per lapisan OSI. Hal di luar aliran paket tetap berjalan seketika; misalnya, kalau Anda mematikan port, lampunya langsung merah. Pintasannya Shift+R untuk Realtime dan Shift+S untuk Simulation, atau klik tabnya di kanan bawah. Bagian 5 membahas mode ini secara mendalam.

### 3.4 Kotak perangkat dan kabel

Untuk menaruh perangkat, pilih jenisnya di Device-Type Selection Box, pilih modelnya di Device-Specific Selection Box, lalu klik area kerja (atau seret modelnya ke area kerja). Tahan Ctrl (Cmd di Mac) saat memilih model kalau Anda ingin menaruh beberapa salinan sekaligus; tekan Esc untuk berhenti. Kolom pencarian membantu kalau Anda tahu nama modelnya. Daftar model juga memuat perangkat lama, yang bisa disembunyikan lewat opsi di Preferences.

Kabel ada di kategori Connections, yang ikonnya berbentuk petir. Pilih jenis kabel, klik perangkat pertama dan pilih port, lalu klik perangkat kedua dan pilih port. Kalau salah port, klik lampu link di dekat perangkat itu untuk mencabut ujung kabelnya, lalu pasang lagi.

| Kabel | Kapan dipakai |
|---|---|
| Automatically Choose Connection Type (Auto Connect) | Packet Tracer memilih kabel dan port yang menurutnya masuk akal. Praktis, tetapi Anda tidak belajar apa pun tentang kabel, dan port yang dipilih belum tentu port yang diminta lab |
| Console | port RS-232 di PC ke port console router atau switch, lalu buka Desktop > Terminal di PC |
| Copper Straight-Through (garis hitam utuh) | dua perangkat dari kelompok berbeda, misalnya PC ke switch, router ke switch, router ke hub |
| Copper Cross-Over (garis hitam putus-putus) | dua perangkat dari kelompok yang sama, misalnya PC ke PC, hub ke hub, PC ke printer |
| Fiber (single-mode dan multimode) | port fiber 100 Mbps atau 1 Gbps. Modul GLC-LH-SMD dan GLC-LX-SM-RGD butuh kabel single-mode, modul fiber lain multimode |
| Serial DCE dan DTE | link WAN serial antarrouter. Sisi DCE (bertanda ikon jam kecil) wajib diberi `clock rate` supaya line protocol hidup |
| Phone, Coaxial, Octal, IoE, USB | modem, modem kabel, kabel console 8 port, dan perangkat IoT. Jarang dipakai di lab CCNA |

Kelompok pada tabel itu adalah cara mudah mengingat aturan klasiknya: PC, server, dan router di satu kelompok, switch dan hub di kelompok lain. Contoh resminya konsisten dengan pembagian ini, termasuk FAQ yang menyebut access point butuh straight-through ke switch tetapi cross-over ke router dan perangkat ujung. Banyak port sungguhan zaman sekarang bisa menyesuaikan diri dengan jenis kabel (Auto-MDIX), jadi aturan ini jarang terasa di kantor. Di Packet Tracer, kabel yang salah sering berujung lampu merah. Contoh di lab perkenalan resmi: PC yang disambung langsung ke server dengan straight-through tidak mau hidup sampai kabelnya diganti cross-over.

### 3.5 Membaca lampu link

| Lampu | Arti menurut bantuan resmi |
|---|---|
| Segitiga hijau terang | link fisik hidup. Belum tentu line protocol-nya juga hidup |
| Segitiga hijau berkedip | ada aktivitas di link |
| Segitiga merah | link fisik mati, tidak ada sinyal terdeteksi |
| Bulatan oranye (amber) | port switch sedang tidak meneruskan karena STP. Hanya muncul di switch |
| Bulatan hitam | khusus kabel console: terpasang di port yang benar |

Lampu oranye sesaat setelah Anda menyambung PC ke switch itu normal. Menurut FAQ resmi, STP butuh lebih dari 30 detik untuk membawa port ke status forwarding. Klik Fast Forward Time kalau Anda tidak mau menunggu.

### 3.6 Jendela perangkat: Physical, Config, CLI, Desktop

Klik sebuah perangkat dengan alat Select untuk membuka jendelanya. Jumlah tabnya tergantung jenis perangkat:

- Physical: foto perangkat yang bisa diklik, tombol power, dan daftar modul. Modul yang tidak hot-swap hanya bisa dipasang atau dilepas saat perangkat mati. Ingat, router atau switch yang dinyalakan ulang memuat startup-config, jadi simpan running-config dulu.
- Config: formulir untuk pengaturan sederhana, seperti display name, hostname, berkas konfigurasi (hapus NVRAM, simpan, ekspor, muat), static route, RIP, VLAN, dan interface. Di bagian bawahnya ada jendela yang menampilkan perintah IOS yang setara dengan setiap klik Anda.
- CLI: command line Cisco IOS hasil model Packet Tracer. Semua perintah yang dimodelkan hanya bisa diakses dari sini. Tombol Copy dan Paste di tab ini lebih andal daripada Ctrl+C, yang di CLI Packet Tracer juga berfungsi sebagai sinyal break.
- Desktop (PC, laptop, server): kumpulan aplikasi, antara lain IP Configuration, Command Prompt, Web Browser, dan Terminal (untuk sesi console).
- Services (server): layanan HTTP, DHCP, DNS, TFTP, SYSLOG, AAA, NTP, Email, FTP, dan lainnya.

> [!WARNING]
> Tab Config memotong jalan. Bantuan resmi sendiri menyebut tab Config hanya alternatif untuk fitur sederhana yang umum, sedangkan perintah lengkapnya harus lewat CLI. Ujian dan kerja nyata pun memakai CLI. Sejak Juli 2022 Cisco meminta peserta semua ujian tingkat Associate dan Professional, termasuk CCNA, bersiap menghadapi soal lab berbasis kinerja: terminal web dengan tab untuk tiap perangkat, untuk mengonfigurasi dan memecahkan masalah. Router di ruang server juga tidak punya tab Config. Pakai tab Config hanya untuk mengintip perintah setaranya, lalu ketik perintah itu sendiri di CLI. Kalau Anda sering tergoda, sembunyikan tab Config lewat Options > Preferences.

---

## 4. Topologi Pertama: 2 PC, 1 Switch, 1 Router

Anda akan membangun LAN kecil seperti di kantor cabang: dua PC di satu switch, dengan router sebagai gerbang (default gateway) ke jaringan lain. "Jaringan lain" di sini diwakili interface loopback di router, yaitu interface virtual yang selalu hidup selama router menyala. Server0 baru dipasang di bagian 5.

### 4.1 Rencana alamat dan kabel

| Perangkat | Interface | Alamat IP | Subnet mask | Default gateway |
|---|---|---|---|---|
| R1 (router 2911) | GigabitEthernet0/0 | 192.168.10.1 | 255.255.255.0 | tidak perlu |
| R1 | Loopback0 | 10.10.10.1 | 255.255.255.255 | tidak perlu |
| PC0 | FastEthernet0 | 192.168.10.11 | 255.255.255.0 | 192.168.10.1 |
| PC1 | FastEthernet0 | 192.168.10.12 | 255.255.255.0 | 192.168.10.1 |
| Server0 (bagian 5) | FastEthernet0 | 192.168.10.100 | 255.255.255.0 | 192.168.10.1 |

| Dari | Ke | Kabel |
|---|---|---|
| PC0 FastEthernet0 | Switch0 FastEthernet0/1 | Copper Straight-Through |
| PC1 FastEthernet0 | Switch0 FastEthernet0/2 | Copper Straight-Through |
| R1 GigabitEthernet0/0 | Switch0 GigabitEthernet0/1 | Copper Straight-Through |
| Server0 FastEthernet0 (bagian 5) | Switch0 FastEthernet0/3 | Copper Straight-Through |

Mask 255.255.255.0 (/24) berarti tiga oktet pertama, 192.168.10, adalah bagian jaringan. Semua alamat 192.168.10.1 sampai 192.168.10.254 berada di LAN yang sama dan bisa saling menjangkau lewat switch saja. Alamat 10.10.10.1 ada di jaringan lain, jadi PC harus menitipkan paketnya ke gateway 192.168.10.1.

### 4.2 Letakkan perangkat

1. Klik File > New (Ctrl+N) untuk mendapat area kerja kosong.
2. Di Network Component Box, buka kategori Routers, pilih model 2911, lalu klik area kerja. Perangkat ini mendapat nama tampilan Router0.
3. Buka kategori Switches, pilih model 2960 (2960-24TT), dan taruh di bawah router. Namanya Switch0.
4. Buka kategori End Devices, pilih PC, dan taruh dua kali di bawah switch: PC0 dan PC1.

Nama tampilan seperti Router0 boleh dibiarkan. Hostname router akan Anda ganti menjadi R1 lewat CLI. Bantuan resmi memperlakukan keduanya sebagai dua pengaturan terpisah: nama tampilan hanya label di layar, hostname adalah nama di dalam IOS.

### 4.3 Sambungkan kabel

1. Buka kategori Connections, pilih Copper Straight-Through.
2. Klik PC0 dan pilih FastEthernet0, lalu klik Switch0 dan pilih FastEthernet0/1.
3. Ulangi untuk PC1 ke FastEthernet0/2.
4. Ulangi untuk Router0: GigabitEthernet0/0 ke GigabitEthernet0/1 di Switch0.

Sekarang baca lampunya. Di sambungan PC, sisi switch menyala oranye selama STP berjalan, lalu hijau. Sambungan router merah di kedua ujung, padahal kabelnya benar. FAQ resmi menjelaskan keduanya: STP butuh lebih dari 30 detik untuk membawa port ke status forwarding, dan port router berstatus shutdown sampai Anda memberi perintah `no shutdown`.

### 4.4 Konfigurasi router lewat CLI

Klik Router0, buka tab CLI, dan tunggu proses boot selesai. Selama image IOS dimuat, tab CLI dan Config belum bisa dipakai. Kalau muncul pertanyaan berikut, ketik `no` lalu Enter:

```
--- System Configuration Dialog ---
Would you like to enter the initial configuration dialog? [yes/no]:
```

Ini setup mode, fitur IOS sungguhan yang muncul otomatis kalau perangkat tidak punya berkas konfigurasi di NVRAM. Setup mode menuntun konfigurasi lewat tanya jawab, tetapi Anda sedang belajar CLI, jadi lewati saja. Tekan Enter sampai muncul prompt `Router>`, lalu ketik:

```
Router> enable
Router# configure terminal
Router(config)# hostname R1
R1(config)# interface gigabitEthernet 0/0
R1(config-if)# ip address 192.168.10.1 255.255.255.0
R1(config-if)# no shutdown
R1(config-if)# exit
R1(config)# interface loopback 0
R1(config-if)# ip address 10.10.10.1 255.255.255.255
R1(config-if)# end
R1# copy running-config startup-config
```

| Perintah | Fungsinya |
|---|---|
| `enable` | masuk mode privileged EXEC, prompt berubah dari `>` menjadi `#` |
| `configure terminal` | masuk mode konfigurasi global, prompt `(config)#` |
| `hostname R1` | mengganti nama router, langsung terlihat di prompt |
| `interface gigabitEthernet 0/0` | masuk ke konfigurasi port fisik G0/0, prompt `(config-if)#` |
| `ip address 192.168.10.1 255.255.255.0` | memberi alamat IP dan subnet mask |
| `no shutdown` | menyalakan port, yang di router mati secara bawaan |
| `interface loopback 0` | membuat interface virtual Loopback0 |
| `end` | kembali ke privileged EXEC dari mode mana pun |
| `copy running-config startup-config` | menyalin konfigurasi aktif di RAM ke NVRAM supaya bertahan saat router dinyalakan ulang |

Setelah `no shutdown`, router mencetak pesan bahwa interface dan line protocol GigabitEthernet0/0 berubah menjadi up. Pesan itu kadang membuat prompt tertinggal di ujung barisnya; tekan Enter untuk mendapat prompt baru. FAQ resmi menyebut perangkat sungguhan menampilkannya dengan cara yang sama. Di area kerja, lampu sisi router menjadi hijau, sedangkan sisi switch oranye dulu selama STP berjalan. Perintah `copy running-config startup-config` bertanya `Destination filename [startup-config]?`; tekan Enter untuk menerima nama bawaan.

Periksa hasilnya:

```
R1# show ip interface brief
```

Cari dua baris ini dan pastikan kolom Status dan Protocol sama-sama `up`:

```
Interface              IP-Address      OK? Method Status                Protocol
GigabitEthernet0/0     192.168.10.1    YES manual up                    up
Loopback0              10.10.10.1      YES manual up                    up
```

Port lain yang belum dipakai tampil sebagai `administratively down`, dan itu wajar. Kalau G0/0 masih `administratively down`, Anda lupa `no shutdown`. Kalau Status `down`, periksa kabel ke switch. Lihat seluruh konfigurasi dengan `show running-config`.

Tiga kebiasaan CLI yang menghemat waktu: tanda `?` menampilkan perintah yang tersedia di posisi kursor, Tab melengkapi kata yang baru diketik sebagian, dan singkatan seperti `conf t`, `int g0/0`, atau `no shut` diterima selama tidak ambigu.

### 4.5 Konfigurasi PC

1. Klik PC0, buka tab Desktop, lalu IP Configuration.
2. Pilih Static. Isi IPv4 Address dengan 192.168.10.11. Packet Tracer biasanya mengisi Subnet Mask secara otomatis saat kursor pindah ke kolom itu; pastikan nilainya 255.255.255.0.
3. Isi Default Gateway dengan 192.168.10.1.
4. Tutup jendela. Tidak perlu mencari tombol Apply: menurut FAQ resmi, sebagian besar kolom langsung berlaku begitu kursor meninggalkan kolom tersebut.
5. Ulangi untuk PC1 dengan alamat 192.168.10.12.

### 4.6 Uji konektivitas

Di PC0, buka Desktop > Command Prompt, lalu jalankan tiga ping berikut satu per satu:

```
C:\> ping 192.168.10.12
C:\> ping 192.168.10.1
C:\> ping 10.10.10.1
```

| Ping ke | Yang diuji |
|---|---|
| 192.168.10.12 (PC1) | LAN: paket cukup lewat switch, router tidak terlibat |
| 192.168.10.1 (R1 G0/0) | PC bisa menjangkau gatewaynya |
| 10.10.10.1 (Loopback0 R1) | PC menitipkan paket ke gateway untuk tujuan di jaringan lain |

Ping yang berhasil menampilkan baris `Reply from ...` dan ringkasan `Lost = 0 (0% loss)`. Kalau balasan pertama `Request timed out` sementara sisanya berhasil, penyebabnya biasanya ARP: perangkat harus menanyakan alamat MAC tujuan dulu. Ini paling sering terjadi saat router terlibat. FAQ resmi menjelaskan bahwa router yang belum tahu MAC tujuan berikutnya mengirim ARP request dan membuang paket yang sedang ditanganinya. Ping berikutnya berhasil karena jawabannya sudah tersimpan di tabel ARP. Untuk melihat pengaturan IP PC, ketik `ipconfig`.

Ada cara grafis juga. Klik Add Simple PDU (tombol P), klik PC0, lalu klik PC1. Packet Tracer mengirim satu ping, dan User Created Packet Window di kanan bawah mencatat hasilnya di kolom Last Status: Successful, Fail, atau In Progress.

### 4.7 Simpan pekerjaan

Ada dua jenis "simpan", dan keduanya perlu:

1. `copy running-config startup-config` di setiap router dan switch yang Anda konfigurasi. Ini melindungi konfigurasi dari tombol power perangkat dan dari Power Cycle Devices.
2. File > Save (Ctrl+S) untuk menyimpan seluruh topologi sebagai berkas `.pkt`, misalnya `lab00b-topologi-pertama.pkt` di folder khusus lab Anda. FAQ resmi menegaskan bahwa konfigurasi yang disimpan ke NVRAM hanya hidup di dalam berkas yang sedang terbuka. Tanpa menyimpan berkas `.pkt`, pekerjaan Anda hilang saat Packet Tracer ditutup.

> [!CAUTION]
> Power Cycle Devices mematikan lalu menyalakan semua perangkat. Bantuan resmi memperingatkan bahwa running-config semua router dan switch akan hilang kalau belum disalin ke startup-config. Biasakan `copy running-config startup-config` sebelum menekan tombol power perangkat mana pun.

---

## 5. Simulation Mode: Melihat Paket Lapis demi Lapis

Di Realtime Mode Anda hanya tahu ping berhasil atau gagal. Di Simulation Mode Anda melihat kenapa: urutan paketnya, siapa saja yang menerimanya, dan header yang ditambahkan atau dilepas di setiap perangkat. Enkapsulasi, yang di buku berupa gambar bertumpuk, menjadi kejadian yang bisa Anda jeda dan periksa. Packet Tracer sendiri menyebut daftar kejadiannya sebagai semacam packet sniffer.

### 5.1 Panel simulasi

Tekan Shift+S atau klik tab Simulation di kanan bawah. Simulation Panel muncul di sisi kanan dengan tiga bagian.

Event List mencatat setiap kejadian (event), yaitu setiap kali sebuah PDU muncul di suatu perangkat. Kolomnya:

| Kolom | Isi |
|---|---|
| Vis. | ikon mata menandai kejadian yang sedang tampil di area kerja |
| Time(sec) | waktu kejadian dalam detik, dihitung sejak simulasi terakhir dimulai ulang |
| Last Device | lokasi paket sebelumnya |
| At Device | lokasi paket sekarang |
| Type | jenis paket, misalnya ARP, ICMP, DNS, TCP, HTTP, STP, CDP |
| Info | kotak berwarna; klik untuk membuka rincian paket |

Di bawah daftar ada tombol Reset Simulation, kotak centang Constant Delay, dan penunjuk Captured to yang menunjukkan sampai detik ke berapa kejadian sudah direkam.

Play Controls berisi tiga tombol dan satu penggeser:

| Kontrol | Pintasan | Fungsi |
|---|---|---|
| Back | Alt+B | mundur satu langkah untuk melihat keadaan sebelumnya |
| Auto Capture / Play | Alt+P | memutar simulasi otomatis; klik lagi untuk jeda |
| Capture / Forward | Alt+C | maju tepat satu langkah |
| Penggeser kecepatan | | mengatur kecepatan animasi saat Auto Capture / Play berjalan |

Event List Filters menentukan jenis paket yang ditampilkan. Edit Filters membuka daftar protokol untuk dicentang, Show All/None mencentang atau mengosongkan semuanya sekaligus, dan Edit ACL Filters membuat penyaring berbasis pernyataan ACL extended.

Lima sifat simulasi ini sering membingungkan pemula:

- Waktunya digerakkan oleh kejadian, bukan oleh jam. Dua kejadian yang di animasi tampak berurutan bisa terpisah satu milidetik atau satu menit; lihat kolom Time untuk tahu jaraknya.
- Filter hanya menyembunyikan tampilan. Mematikan filter ARP tidak membuat perangkat berhenti memakai ARP; paketnya tetap ada di jaringan.
- Paket yang menumpang protokol lain ikut tampil lewat filter induknya. Menurut FAQ resmi, paket HTTP tetap terlihat walau filter HTTP mati selama filter TCP menyala, karena HTTP berjalan di atas TCP.
- Packet Tracer tetap merekam semua kejadian walau filternya tidak menampilkan apa-apa. Setelah 500 kejadian, ia berhenti dan menampilkan pesan bahwa batas jumlah kejadian tercapai.
- Back hanya menampilkan ulang keadaan lama. Bantuan resmi menegaskan bahwa waktu tidak benar-benar mundur, jadi Anda tidak bisa menyisipkan kejadian baru sebelum kejadian yang sudah terjadi.

### 5.2 Membaca jendela PDU Information

Klik amplop paket di area kerja, atau kotak berwarna di kolom Info, untuk membuka jendela PDU Information at Device. Isinya tiga tab:

- OSI Model memperlihatkan apa yang dilakukan perangkat itu terhadap paket di setiap lapisan. Kolom In Layers dibaca dari bawah ke atas (Layer 1 ke Layer 7) karena paket masuk lewat lapisan fisik. Kolom Out Layers dibaca dari atas ke bawah karena paket keluar lewat lapisan fisik paling akhir. Lapisan yang tidak dipakai perangkat itu tampil pucat. Di bawahnya ada penjelasan bernomor, dan tombol Next Layer serta Previous Layer menelusurinya satu lapisan demi satu lapisan.
- Inbound PDU Details memperlihatkan header paket yang diterima perangkat, kolom demi kolom: Ethernet II, IP, ICMP, ARP, dan seterusnya. Tab ini tidak ada kalau paketnya berasal dari perangkat itu sendiri.
- Outbound PDU Details memperlihatkan header paket yang dikirim perangkat itu.

Format alamat MAC di Packet Tracer adalah tiga kelompok heksadesimal, misalnya `0001.9789.D2DA`. Baris Layer 2 di tab OSI Model ditulis sumber lebih dulu, lalu tujuan: `0001.9789.D2DA >> 00E0.8FC2.4302`.

Tombol Challenge Me mengubah tab OSI Model menjadi kuis. Rincian lapisan disembunyikan, dan Anda harus menebak tindakan perangkat di setiap lapisan: Encapsulate (menambah header), De-encapsulate (melepas header), Transfer (memindahkan paket dari tumpukan masuk ke tumpukan keluar), Accept (menerima dan selesai memproses), Queue (menahan untuk diproses nanti), Drop (membuang), atau Transmit (mengirim sinyal ke media). Latihan ini bagus untuk menguji pemahaman enkapsulasi dari modul `01-model-referensi/03-enkapsulasi`.

### 5.3 Percobaan A: ARP lalu ICMP

Tujuannya melihat bahwa sebelum ping pertama bisa berangkat, PC harus menemukan alamat MAC tujuan lewat ARP. Teorinya ada di `04-network-layer/04-arp-icmp`. Pakai topologi bagian 4.

1. Di Realtime Mode, pastikan R1 sudah `copy running-config startup-config`. Klik Power Cycle Devices. Langkah ini mengosongkan tabel ARP semua perangkat. Klik Fast Forward Time beberapa kali sampai lampu switch hijau.
2. Pakai alat Inspect untuk membuka ARP Table PC0. Tabelnya kosong.
3. Tekan Shift+S. Klik Show All/None sampai semua filter kosong, lalu klik Edit Filters dan centang hanya ARP dan ICMP.
4. Klik Add Simple PDU, klik PC0, lalu klik PC1. Paket uji itu langsung tercatat di Event List dengan At Device PC0.
5. Klik Capture / Forward satu kali per langkah, dan buka amplopnya di setiap langkah.

Yang akan Anda lihat:

- ARP request berangkat dari PC0 ke Switch0. Di Outbound PDU Details PC0, MAC tujuan Ethernet II-nya `FFFF.FFFF.FFFF`, alamat broadcast. Isinya pertanyaan: siapa pemilik 192.168.10.12? Sesuai RFC 826, ARP request memang disiarkan ke semua stasiun di segmen itu.
- Switch0 menyalin frame itu ke semua port lain: PC1 dan R1. Di tab OSI Model Switch0, hanya Layer 1 dan Layer 2 yang aktif. Switch memutuskan dari alamat MAC, tanpa melihat alamat IP.
- R1 menerima ARP request itu tetapi tidak menjawab, karena alamat yang ditanyakan bukan miliknya dan berada di port yang sama dengan asal permintaan.
- PC1 menjawab dengan ARP reply. Jawabannya dikirim langsung ke MAC PC0 (unicast), bukan disiarkan.
- Setelah PC0 tahu MAC PC1, ICMP echo request berangkat. Di tab OSI Model PC1, Layer 3 menunjukkan ICMP Message Type 8. PC1 lalu membalas dengan echo reply, ICMP type 0. Kedua nilai itu ditetapkan RFC 792.
- Amplop yang kembali ke PC0 bertanda centang hijau: ping berhasil.

6. Begitu echo reply tiba di PC0, buka lagi ARP Table PC0 dengan Inspect. Kini ada baris untuk 192.168.10.12 beserta MAC PC1. Buka juga MAC Table Switch0: MAC PC0 tercatat di FastEthernet0/1 dan MAC PC1 di FastEthernet0/2.
7. Klik Reset Simulation. Event List kosong lagi, kecuali paket uji buatan Anda, tetapi tabel ARP tetap terisi. Klik Auto Capture / Play: kali ini ICMP langsung berangkat tanpa ARP, karena jawabannya sudah tersimpan.

> [!NOTE]
> Jangan menekan Capture / Forward terus setelah kejadian terakhir lalu heran tabel ARP kosong. FAQ resmi menjelaskan bahwa tombol itu memajukan waktu ke kejadian berikutnya; kalau tidak ada paket lagi, yang tersisa hanya pewaktu kedaluwarsa entri ARP, jadi entrinya terhapus. Hal yang sama berlaku untuk tabel MAC.

Bedanya dua tombol reset perlu diingat. Reset Simulation hanya membersihkan tampilan dan animasi; keadaan perangkat, termasuk tabel ARP dan MAC, tidak berubah. Power Cycle Devices melakukan semua itu dan juga menyalakan ulang perangkat, sehingga tabel-tabel kosong dan running-config yang belum disimpan hilang.

### 5.4 Percobaan B: DNS lalu HTTP

Sekarang Anda melihat dua protokol aplikasi bekerja berurutan: DNS menerjemahkan nama menjadi alamat IP, lalu HTTP mengambil halaman web. Siapkan server dulu di Realtime Mode.

1. Dari kategori End Devices, taruh sebuah Server (Server0). Sambungkan FastEthernet0-nya ke FastEthernet0/3 di Switch0 dengan Copper Straight-Through.
2. Buka Server0, tab Desktop, IP Configuration. Pilih Static, isi 192.168.10.100, mask 255.255.255.0, gateway 192.168.10.1.
3. Buka tab Services, pilih DNS. Nyalakan DNS Service (On). Isi Name `www.belajar.test`, Type A Record, Address 192.168.10.100, lalu klik Add.
4. Masih di Services, buka HTTP. Layanan HTTP menyala secara bawaan dan sudah berisi halaman `index.html`; pastikan statusnya On.
5. Buka PC0, Desktop, IP Configuration, lalu isi DNS Server dengan 192.168.10.100.

Akhiran `.test` sengaja dipilih. RFC 2606 mencadangkan `.test` untuk pengujian, sehingga nama itu tidak akan bentrok dengan domain sungguhan. Hindari `.local`: menurut RFC 6762, nama berakhiran `.local` adalah nama link-local milik Multicast DNS, dan kuerinya wajib dikirim ke alamat multicast mDNS 224.0.0.251. RFC yang sama memperingatkan bahwa mencampurnya dengan DNS biasa bisa membingungkan pengguna, karena hasilnya bisa berbeda tergantung kondisi jaringan.

Lalu amati di Simulation Mode:

1. Tekan Shift+S. Kosongkan filter, lalu centang hanya DNS dan HTTP.
2. Di PC0, buka Desktop > Web Browser, ketik `www.belajar.test`, lalu klik Go. Jangan tutup jendela PC0; geser saja ke samping. FAQ resmi menyebut menutup jendela perangkat di Simulation Mode membuat simulasi dimulai ulang.
3. Event List kini berisi paket DNS di PC0. Klik Capture / Forward per langkah dan buka amplopnya:
   - DNS query berangkat dari PC0 ke Server0. Di tab OSI Model Server0, Layer 4 berisi UDP dengan port tujuan 53, dan Layer 7 berisi DNS. Kuerinya meminta record A untuk `www.belajar.test`.
   - DNS response kembali ke PC0 membawa jawaban 192.168.10.100.
   - Baru setelah itu muncul HTTP request dari PC0 ke Server0 di atas TCP port 80, disusul HTTP response berisi halamannya.
4. Kembali ke jendela PC0. Web Browser kini menampilkan halaman dari Server0.

Dua variasi yang layak dicoba:

- Centang juga filter TCP, klik Reset Simulation, lalu ulangi permintaan halaman. Sebelum HTTP request, kini terlihat segmen TCP yang membuka koneksi (jabat tangan tiga arah), sesuai model resmi Packet Tracer bahwa klien HTTP tersambung ke server lewat soket TCP.
- Ketik `192.168.10.100` langsung di Web Browser. Tidak ada paket DNS sama sekali, karena klien HTTP hanya meminta bantuan DNS kalau Anda memberinya nama.

Rangkaian ini memperlihatkan tumpukan protokol dengan jelas. DNS menumpang UDP, HTTP menumpang TCP, keduanya di atas IP, dan semuanya dibawa frame Ethernet melewati Switch0. Teorinya ada di `06-aplikasi/01-dns`, `06-aplikasi/03-http`, `05-transport/02-tcp`, dan `05-transport/03-udp-quic`.

### 5.5 Hal kecil yang sering mengacaukan simulasi

- Simulasi dimulai ulang (waktu kembali ke 0, Event List kosong) kalau Anda menekan Reset Simulation atau Power Cycle Devices, berpindah ke Realtime lalu kembali, menambah atau menghapus perangkat dan kabel, mengubah konfigurasi, mengetik perintah apa pun di mode konfigurasi global, menutup jendela perangkat, atau menyalakan dan mematikan port.
- Perintah IOS yang mengirim paket, misalnya `ping` dari CLI router, tetap jalan di Simulation Mode. Amplopnya muncul di area kerja, tetapi Anda perlu Capture / Forward untuk melihatnya bergerak. Paket dari perintah IOS tidak masuk User Created Packet Window.
- Paket yang tidak Anda buat akan ikut muncul. Router dan switch mengirim CDP setiap 60 detik, dan STP serta DTP juga berjalan sendiri. Matikan filternya kalau mengganggu pengamatan.
- Saat Packet Tracer tersambung ke rekan lewat Multiuser, Simulation Mode tidak bisa dibuka. Packet Tracer akan menawarkan menyimpan salinan offline untuk dibuka di jendela baru.

---

## 6. Berkas .pkt, .pkz, dan .pka

| Ekstensi | Isinya | Cara membuat |
|---|---|---|
| `.pkt` | berkas jaringan biasa: topologi, konfigurasi perangkat, catatan | File > Save (Ctrl+S) atau Save As (Ctrl+Shift+S) |
| `.pkz` | berkas `.pkt` plus berkas tambahan, seperti ikon dan gambar latar buatan sendiri, dalam satu paket | File > Save as Pkz (Ctrl+Alt+Z) |
| `.pka` | aktivitas dengan instruksi, jaringan awal, jaringan jawaban, dan penilaian otomatis | Extensions > Activity Wizard (Ctrl+W) |

### 6.1 Menyimpan dan membuka berkas

Buka berkas lewat File > Open (Ctrl+O). Menurut FAQ resmi, menyeret berkas dari file manager ke jendela Packet Tracer tidak didukung.

Kurikulum ini tidak menyertakan berkas `.pkt`. Anda membangun sendiri topologi Lab 01 sampai Lab 04 dari deskripsinya, dan proses membangun itu bagian dari latihan. Simpan satu berkas per sub-lab dengan nama yang menjelaskan isinya, misalnya `lab1-2-vlan.pkt` atau `lab2-4-ospf.pkt`, di satu folder khusus. Sebelum mencoba sesuatu yang berisiko, simpan salinan dengan Save As supaya Anda bisa kembali ke keadaan yang masih jalan.

Berkas `.pka` biasanya dibagikan instruktur atau kursus NetAcad. Bantuan resminya menyebut Activity Wizard terutama dipakai instruktur untuk membuat aktivitas bagi pelajarnya.

### 6.2 Mengerjakan aktivitas .pka

Activity Wizard adalah alat penilaian. Penulis aktivitas menyiapkan jaringan jawaban, jaringan awal yang belum lengkap atau sengaja salah konfigurasi, instruksi, dan butir penilaian. Saat Anda membuka berkas `.pka`:

1. Jendela Activity muncul dengan tab Instructions, Network Topology, Addressing Table, dan User Notes kalau penulisnya mengaktifkan tab itu. Kotak Dock menempelkan jendela ini ke jendela utama, kotak Top membuatnya selalu di depan, dan tombol Back serta Next membalik halaman instruksi.
2. Angka di samping kata Completion menunjukkan persentase kemajuan. Tanda bintang di samping angka itu berarti masih ada uji konektivitas yang baru dinilai saat Anda membuka Check Results.
3. Tombol Check Results membuka hasil penilaian. Di tab Assessment Items, centang hijau berarti benar, centang putih berarti kategori itu baru sebagian selesai, dan tanda X merah berarti butir itu belum ada atau salah. Tombol Show Only Incorrect Items menyaring yang salah saja. Tab Connectivity Tests membandingkan hasil uji koneksi dengan jaringan jawaban.
4. Simpan kemajuan dengan File > Save As ke nama baru supaya berkas aslinya tetap utuh. Untuk mengulang dari jaringan awal, pakai File > Reset Activity (Alt+N).

Penulis aktivitas bisa mengunci fitur tertentu. Menurut FAQ resmi, ia bisa mengunci pemakaian tab Config saja, atau mengunci konfigurasi router dan switch sepenuhnya sehingga Anda harus masuk lewat kabel console dari aplikasi Terminal di PC. Activity Wizard di berkas itu juga bisa dilindungi kata sandi.

### 6.3 Versi dan kompatibilitas berkas

Menurut FAQ resmi, berkas dari versi lama umumnya bisa dibuka di versi baru, tetapi kompatibilitas mundurnya terbatas: tidak semua berkas dijamin terbuka atau berperilaku persis sama. Berkas berisi skrip, seperti perangkat IoT, yang dibuat di versi 7.2.2 atau lebih lama bisa berperilaku lain di versi 7.3.0 ke atas. Kebalikannya tidak didukung sama sekali: berkas dari versi yang lebih baru tidak bisa dibuka di versi lama dan bisa memunculkan pesan "Invalid File". Kalau berkas dari kursus atau teman menolak dibuka, perbarui Packet Tracer Anda lebih dulu.

---

## 7. Batasan Packet Tracer dan Kapan Pindah Alat

FAQ resmi menjawab dua pertanyaan dengan terus terang:

- Apakah Packet Tracer cukup untuk menguasai materi CCNA? Tidak. Packet Tracer adalah pelengkap kurikulum CCNA: tempat belajar konfigurasi router dan switch tingkat dasar sampai menengah, dan melihat cara paket diproses perangkat.
- Apakah Packet Tracer mendukung semua fitur perangkat Cisco? Tidak. Ia hanya mendukung sebagian kecil fitur, dengan model protokol dan IOS yang disederhanakan. Hasilnya sebaiknya selalu dibandingkan dengan perangkat sungguhan.

Batas yang perlu Anda tahu sejak awal:

- Model IOS-nya mengacu ke versi tertentu, misalnya 15.1 untuk router 2911 dan 15.0 untuk switch 2960. Perangkat yang Anda temui di lapangan bisa menjalankan versi lain, dan FAQ resmi menyebut perbedaan versi IOS sebagai penyebab keluaran perintah `show` yang tidak sama dengan perangkat sungguhan.
- Halaman pengantar bantuan resmi menandai sejumlah protokol dengan catatan "batasan pemodelan yang substansial", di antaranya STP, RSTP, TCP, IPv4, IPv6, PPP, Frame Relay, nirkabel 802.11, dan multilayer switching.
- FAQ resmi menyebut contoh perintah yang tidak didukung atau berbeda: alamat sekunder `ip address ... secondary`, ping ke port seperti `ping 192.168.1.5:80`, sebagian parameter extended ping, subinterface serial selain untuk Frame Relay, serta perintah `arp`, `bandwidth`, dan `delay` di switch 2960. Menempelkan seluruh keluaran `show running-config` ke perangkat lain juga bisa memunculkan `% Invalid input detected`, karena ada perintah yang tampil di keluaran tetapi tidak diterima.
- Daftar protokol di halaman pengantar dan pohon perintah di bantuan resmi tidak memuat MPLS maupun IS-IS. Katalog perangkatnya berisi model Cisco dan perangkat generik buatan Packet Tracer, tanpa MikroTik atau Juniper.
- Waktu Realtime adalah waktu model, bukan waktu nyata, dan nirkabel punya batas sendiri: menurut FAQ, lebih dari 10 klien dengan 3 access point dalam satu area cakupan membuat koneksi tidak bisa diprediksi.

Kalau ragu sebuah perintah didukung atau tidak, ketik `?` di posisi itu. Model IOS hanya menawarkan perintah yang dikenalinya, dan perintah yang tidak dikenali dijawab `% Invalid input detected`.

Kapan pindah? Tetap di Packet Tracer selama Anda mengerjakan Lab 01 sampai Lab 04 dan berlatih untuk CCNA. Pindah, atau lebih tepatnya menambah alat, saat kebutuhan Anda melewati batas di atas. Pilihan, cara memasang, dan kebutuhan perangkat kerasnya sudah dibahas di `lab/00-setup-lab` bagian 2:

| Kebutuhan | Alat yang lebih cocok |
|---|---|
| IOS atau IOS XE sungguhan, perintah lengkap, keluaran persis seperti perangkat | GNS3, EVE-NG, atau Cisco CML dengan image resmi |
| eBGP antarbanyak AS, MPLS, IS-IS (Lab 2.6, Tahap 22) | Containerlab dengan FRR, Nokia SR Linux, atau Arista cEOS; atau GNS3 dan EVE-NG |
| Otomasi dan NetDevOps (Tahap 15) | Containerlab dan Linux, seperti di `lab/08-lab-netdevops` |
| MikroTik RouterOS | MikroTik CHR di mesin virtual (`lab/06-lab-mikrotik`) |
| Linux networking | network namespaces di Linux (`lab/05-lab-linux-otomasi`) |

---

## 8. Masalah Umum dan Solusinya

| Gejala | Penyebab paling umum | Solusi |
|---|---|---|
| Lampu merah di port router, padahal kabel benar | port router berstatus shutdown secara bawaan | di mode interface, ketik `no shutdown`, lalu periksa `show ip interface brief` |
| Status `administratively down` di `show ip interface brief` | port dimatikan admin (bawaan router, atau perintah `shutdown`) | `no shutdown` di interface itu |
| Lampu merah di kedua ujung kabel antara dua PC, atau PC dan server | jenis kabel salah | ganti dengan Copper Cross-Over; ingat aturan kelompok di bagian 3.4 |
| Lampu oranye di switch tidak kunjung hijau | STP masih transisi, atau port diblokir karena ada loop | tunggu atau klik Fast Forward Time; kalau tetap oranye, cari loop seperti di Lab 1.4 |
| Link serial hidup, line protocol mati | sisi DCE belum diberi clock rate, atau Anda mengetik `clockrate` | di sisi DCE (bertanda ikon jam), ketik misalnya `clock rate 64000`; hanya nilai yang tercantum di `clock rate ?` yang sah, dan FAQ resmi menegaskan `clockrate` bukan perintah IOS |
| Konfigurasi router hilang setelah Power Cycle Devices atau tombol power | running-config belum disimpan | konfigurasi ulang, lalu biasakan `copy running-config startup-config` |
| Konfigurasi hilang setelah Packet Tracer dibuka lagi | berkas `.pkt` tidak disimpan | NVRAM hanya hidup di dalam berkas; simpan dengan Ctrl+S |
| Ping ke PC lain di LAN berhasil, ke jaringan lain gagal | default gateway PC kosong atau salah | isi gateway dengan alamat interface router di LAN itu |
| Balasan ping pertama `Request timed out`, sisanya berhasil | ARP sedang mencari MAC tujuan | wajar; ulangi ping |
| `% Invalid input detected at '^' marker.` | salah ketik, salah mode, atau perintah tidak dimodelkan | baca prompt untuk memastikan mode (`>`, `#`, `(config)#`, `(config-if)#`), pakai `?`, lalu lihat bagian 7 |
| Ubahan lewat CLI tidak tampak di tab Config | jendela perangkat yang terbuka tidak disinkronkan | tutup jendela perangkat, lalu buka lagi |
| Tidak bisa masuk mode privileged di switch | enable password lupa atau salah ketik saat dibuat | FAQ resmi: tekan tombol Mode di tab Physical switch untuk meresetnya |
| Ctrl+Break tidak berfungsi di Linux saat mencoba masuk ROMMON | keterbatasan pustaka Qt di Linux | pakai Ctrl+C |
| Login ditolak: "Sorry, we can't find a NetAcad account associated with this Cisco account." | akun belum terdaftar di kursus mana pun | daftar ke kursus, lihat bagian 2.1 |
| Jendela login kosong | tidak ada internet, atau pengaturan proxy sistem operasi salah | periksa koneksi dan proxy |
| Berkas tidak bisa dibuka, muncul "Invalid File" | berkas dibuat dengan versi Packet Tracer yang lebih baru | perbarui Packet Tracer |
| Simulasi tiba-tiba mulai dari nol | Anda menutup jendela perangkat, mengubah konfigurasi, atau menghapus perangkat | lihat daftar di bagian 5.5 |
| Tabel ARP kosong di akhir simulasi | Capture / Forward ditekan setelah kejadian terakhir | lihat catatan di bagian 5.3 |

---

## 9. Latihan

Semua latihan dikerjakan di Packet Tracer dengan topologi bagian 4 dan 5. Simpan dulu berkas Anda dengan Save As ke nama baru supaya topologi aslinya tetap utuh.

1. Taruh dua PC baru, PC2 dan PC3, dengan alamat 192.168.20.1/24 dan 192.168.20.2/24. Sambungkan keduanya langsung dengan Copper Straight-Through, catat warna lampu, lalu coba ping dari PC2 ke PC3. Ganti kabelnya dengan Copper Cross-Over dan ulangi. Apa bedanya, dan mengapa?
2. Di R1, masuk ke `interface gigabitEthernet 0/0` dan jalankan `shutdown`. Amati lampu link, keluaran `show ip interface brief`, serta hasil ping dari PC0 ke 192.168.10.1 dan ke PC1. Setelah itu jalankan `no shutdown`. Jelaskan apa yang Anda lihat.
3. Kosongkan Default Gateway PC0, lalu ping 192.168.10.12, 192.168.10.1, dan 10.10.10.1. Setelah itu isi gatewaynya dengan alamat PC1 (192.168.10.12) dan ping 10.10.10.1 lagi. Ping mana yang gagal di masing-masing keadaan, dan mengapa?
4. Di R1, ganti hostname menjadi `R1-UJI` tanpa menyimpan, lalu klik Power Cycle Devices dan tunggu R1 selesai boot. Apa hostname-nya sekarang? Ulangi perubahan yang sama, kali ini diakhiri `copy running-config startup-config` sebelum Power Cycle Devices. Apa bedanya, dan apa yang akan terjadi kalau R1 tidak punya startup-config sama sekali?
5. Ulangi Percobaan A di bagian 5.3. Saat ARP request dari PC0 mencari 192.168.10.12, perangkat mana saja yang menerima frame itu, siapa yang menjawab, dan apa MAC tujuan frame request serta frame reply-nya?
6. Masih di Percobaan A, buka tab OSI Model saat ICMP echo request berada di Switch0, lalu saat berada di PC1. Lapisan mana yang aktif di masing-masing, dan apa artinya bagi cara kerja switch dibanding host?
7. Ulangi Percobaan B di bagian 5.4 dan catat urutan Type di Event List saat membuka `www.belajar.test`. Lalu, di Server0, tambahkan record A kedua bernama `salah.belajar.test` dengan Address 192.168.10.101, alamat yang tidak dipakai perangkat mana pun. Centang juga filter ARP, lalu buka nama itu dari PC0. Apa yang terjadi, dan apa pelajarannya?
8. Di Switch0, buka tab Config. Ganti hostname menjadi SW1 di bagian Global Settings, lalu buat VLAN 10 bernama STAFF di VLAN Database. Catat perintah yang muncul di jendela perintah IOS setara di bagian bawah tab. Setelah itu buka tab CLI dan hapus VLAN 10 dengan perintah yang Anda ketik sendiri, lalu verifikasi.

<details>
<summary>Jawaban</summary>

1. Dengan straight-through, lampu merah di kedua ujung dan ping gagal karena link fisiknya tidak pernah hidup. Dengan cross-over, lampu hijau dan ping berhasil. Dua PC berada di kelompok yang sama, jadi keduanya mengirim di pasangan kabel yang sama; kabel cross-over menukar pasangan kirim ke pasangan terima di ujung seberang. Ini sama dengan contoh di lab perkenalan resmi Packet Tracer (PC ke server). Di perangkat sungguhan yang punya Auto-MDIX, kabel yang salah sering tetap jalan, tetapi di Packet Tracer aturan kabelnya perlu Anda pegang.
2. Begitu `shutdown`, lampu di kedua ujung link R1 menjadi merah dan `show ip interface brief` menampilkan G0/0 berstatus `administratively down`, protokol `down`. Ping PC0 ke 192.168.10.1 gagal, tetapi ping PC0 ke PC1 tetap berhasil karena lalu lintas di dalam LAN cukup lewat switch. Setelah `no shutdown`, status kembali `up`/`up`; balasan ping pertama ke gateway mungkin `Request timed out` selama ARP berjalan. `administratively down` berarti port dimatikan oleh admin, berbeda dengan `down` yang menandakan masalah fisik.
3. Tanpa gateway: ping ke 192.168.10.12 dan 192.168.10.1 berhasil karena keduanya satu subnet dengan PC0, sedangkan ping ke 10.10.10.1 gagal karena PC0 tidak tahu harus menitipkan paket untuk jaringan lain ke siapa. Ulangi ping itu di Simulation Mode dan baca penjelasan di tab OSI Model PC0 untuk melihat alasannya dari sisi Packet Tracer. Dengan gateway 192.168.10.12: ping ke 10.10.10.1 tetap gagal. PC0 mengirim frame ke MAC PC1, tetapi PC1 bukan router; ia membuang paket yang alamat IP tujuannya bukan miliknya. Gateway harus alamat interface router di LAN itu, di sini 192.168.10.1.
4. Tanpa menyimpan, R1 kembali bernama R1 setelah Power Cycle, karena router memuat startup-config yang Anda simpan di bagian 4.4, dan perubahan `R1-UJI` yang hanya ada di running-config hilang. Dengan `copy running-config startup-config`, nama `R1-UJI` bertahan. Kalau R1 sama sekali tidak punya startup-config, ia menyala dengan hostname bawaan `Router`, menawarkan setup mode, dan port G0/0 kembali shutdown, persis keadaan di awal bagian 4.4.
5. Switch0 menerima frame dari PC0 lalu menyalinnya ke semua port lain, yaitu PC1 dan R1 (juga Server0 kalau sudah tersambung). R1 tidak menjawab karena alamat yang ditanyakan bukan miliknya. Hanya PC1 yang menjawab. MAC tujuan ARP request adalah `FFFF.FFFF.FFFF` (broadcast), sedangkan ARP reply dikirim langsung ke MAC PC0 (unicast), sesuai RFC 826.
6. Di Switch0 hanya Layer 1 dan Layer 2 yang aktif: frame masuk di FastEthernet0/1, switch membaca header Ethernet dan mencari MAC tujuan di tabel MAC, lalu mengeluarkan frame yang sama di FastEthernet0/2 tanpa menyentuh header IP. Di PC1, In Layers naik sampai Layer 3 dan memperlihatkan header IP serta ICMP Message Type 8; Out Layers memperlihatkan PC1 membuat balasan ICMP type 0, lalu membungkusnya turun ke Layer 2 dan Layer 1. Switch meneruskan berdasarkan alamat MAC, sedangkan host memproses paket sampai ke protokol yang memakainya.
7. Urutannya DNS lebih dulu (query lalu response), baru HTTP (request lalu response). Kalau filter TCP dicentang, segmen TCP pembuka koneksi muncul di antara keduanya. Untuk `salah.belajar.test`, DNS tetap berhasil, tetapi jawabannya 192.168.10.101. PC0 lalu mengirim ARP request untuk alamat itu, tidak ada yang menjawab, dan halaman gagal dimuat. Pelajarannya: DNS yang menjawab belum tentu memberi alamat yang benar. Saat memecahkan masalah, periksa isi jawabannya di Inbound PDU Details PC0, jangan berhenti di "DNS-nya jalan".
8. Jendela itu menampilkan perintah `hostname SW1`, lalu `vlan 10` dan `name STAFF`. Untuk menghapus lewat CLI: `enable`, `configure terminal`, `no vlan 10`, `end`. Verifikasi dengan `show vlan brief`; VLAN 10 tidak lagi tercantum. Tab Config berguna sebagai penerjemah klik menjadi perintah, tetapi yang perlu Anda kuasai untuk ujian dan kerja adalah mengetik perintahnya sendiri. Tutup dengan `copy running-config startup-config`.

</details>

---

## 10. Sumber

- Cisco Networking Academy, halaman Cisco Packet Tracer (fungsi, siapa yang berhak, cara mendapatkan, pemakaian di laptop pribadi): https://www.netacad.com/cisco-packet-tracer
- Cisco Networking Academy, kursus Getting Started with Cisco Packet Tracer (gratis, sekitar 2 jam, isi modul): https://www.netacad.com/courses/getting-started-cisco-packet-tracer?courseLang=en-US
- Cisco Networking Academy, Resource Hub (versi 9.0.1, langkah instalasi, persyaratan sistem): https://www.netacad.com/resources/lab-downloads?courseLang=en-US
- Cisco, Cisco Packet Tracer Download and Installation Instructions (Windows, Ubuntu, macOS, login pertama): https://www.netacad.com/skillsforall/files/Cisco_Packet_Tracer_Download_and_Installation_Instructions.pdf
- Cisco, Offer Description: Cisco Packet Tracer Software (EDCS-19611795 versi 2.0, 10 September 2025): https://www.cisco.com/c/dam/en_us/about/doing_business/legal/seula/cisco-packet-tracer-software.pdf
- Cisco Packet Tracer Help, Introduction, What's New, Log In, dan Copyrights: https://tutorials.ptnetacad.net/help/default/intro.htm, https://tutorials.ptnetacad.net/help/default/whatsNew.htm, https://tutorials.ptnetacad.net/help/default/login.htm, https://tutorials.ptnetacad.net/help/default/copyrights.htm
- Cisco Packet Tracer Help, Interface Overview, Logical Workspace, dan Physical Workspace: https://tutorials.ptnetacad.net/help/default/interfaceOverview.htm, https://tutorials.ptnetacad.net/help/default/workspace_logical.htm, https://tutorials.ptnetacad.net/help/default/workspace_physical.htm
- Cisco Packet Tracer Help, Operating Modes, Realtime Mode, dan Simulation Mode: https://tutorials.ptnetacad.net/help/default/operatingModes.htm, https://tutorials.ptnetacad.net/help/default/mode_realtime.htm, https://tutorials.ptnetacad.net/help/default/mode_simulation.htm
- Cisco Packet Tracer Help, PDU Information dan Special Notes Simulation Mode: https://tutorials.ptnetacad.net/help/default/mode_simulation_PDUinfo.htm, https://tutorials.ptnetacad.net/help/default/mode_simulation_specialNotes.htm
- Cisco Packet Tracer Help, Connections / Links (jenis kabel dan arti lampu link): https://tutorials.ptnetacad.net/help/default/connectionsLinks.htm
- Cisco Packet Tracer Help, Devices & Modules, Configuring Routers, Configuring Switches, Configuring PCs, Configuring Servers: https://tutorials.ptnetacad.net/help/default/devicesAndModules.htm, https://tutorials.ptnetacad.net/help/default/config_routers.htm, https://tutorials.ptnetacad.net/help/default/config_switches.htm, https://tutorials.ptnetacad.net/help/default/config_PCs.htm, https://tutorials.ptnetacad.net/help/default/config_servers.htm
- Cisco Packet Tracer Help, My First PT Lab (contoh kabel PC ke server, alur ARP dan ICMP di Simulation Mode): https://tutorials.ptnetacad.net/help/default/myFirstPTLab.htm
- Cisco Packet Tracer Help, Activity Wizard dan Running Activity Files: https://tutorials.ptnetacad.net/help/default/activityWizard.htm, https://tutorials.ptnetacad.net/help/default/activityWizard_run.htm
- Cisco Packet Tracer Help, Keyboard Shortcuts: https://tutorials.ptnetacad.net/help/default/keyboardShortcuts.htm
- Cisco Packet Tracer Help, System Requirements: https://tutorials.ptnetacad.net/help/default/systemRequirements.htm
- Cisco Packet Tracer Help, FAQ/Troubleshooting (versi IOS, batasan, login, kompatibilitas berkas, NVRAM, STP, ARP): https://tutorials.ptnetacad.net/help/default/faqTroubleShoot.htm
- Cisco Packet Tracer Help, Router IOS 15 (pohon perintah yang dimodelkan, termasuk clock rate) dan Miscellaneous Modeling (model ARP): https://tutorials.ptnetacad.net/help/default/CLI_routerIOS15.htm, https://tutorials.ptnetacad.net/help/default/model_misc.htm
- Cisco, Configuration Fundamentals Configuration Guide 12.2SR, Using Setup Mode to Configure a Cisco Networking Device: https://www.cisco.com/c/en/us/td/docs/ios/fundamentals/configuration/guide/12_2sr/cf_12_2sr_book/cf_setup.html
- Cisco Blogs, New Performance-Based Lab Exam Items Build Opportunities (7 Juli 2022): https://blogs.cisco.com/learning/new-performance-based-lab-exam-items-build-opportunities
- RFC 792, Internet Control Message Protocol (tipe 8 echo, tipe 0 echo reply): https://www.rfc-editor.org/rfc/rfc792.html
- RFC 826, An Ethernet Address Resolution Protocol (request disiarkan, reply langsung ke penanya): https://www.rfc-editor.org/rfc/rfc826.html
- RFC 2606, Reserved Top Level DNS Names (cadangan nama .test): https://www.rfc-editor.org/rfc/rfc2606.html
- RFC 6762, Multicast DNS (nama .local): https://www.rfc-editor.org/rfc/rfc6762.html

---

**Berikutnya:** `lab/01-lab-fondasi-switching`. Dengan alatnya sudah lancar, Anda mulai dari alamat IP dasar, lalu VLAN, trunk 802.1Q, STP, dan EtherChannel.

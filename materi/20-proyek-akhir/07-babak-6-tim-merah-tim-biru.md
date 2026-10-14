# 20.7 — Babak 6: Tim Merah vs Tim Biru

> **Prasyarat:** `20.6`, ditambah `09` (NAT/ACL/firewall), `12` (keamanan), `03` (serangan layer 2), `06` (DNS, TLS)
> **Tujuan:** Mengenali sepuluh serangan dari buktinya saja, menyusun mitigasi yang bisa dikonfigurasi, dan — yang paling sering dilupakan — menentukan apa yang harus dipantau agar serangan itu terlihat.

---

## 1. Bentuk Kerja Babak Ini

Babak ini berpasangan lawan. Untuk tiap kejadian Anda dapat **bukti mentah saja** — tanpa nama serangan, tanpa petunjuk. Tugas Anda tiga hal, dan hal ketiga yang membedakan engineer dari operator:

| Kolom | Isi |
|---|---|
| **Kenali** | Serangan apa, lapisan berapa, apa yang diincar penyerang |
| **Cegah** | Konfigurasi konkret di platform yang tepat (Cisco / MikroTik / Linux) |
| **Deteksi** | Apa yang dipantau, ambang alarmnya, dan siapa yang menerimanya |

Setiap kejadian bernilai 3 poin: 1 untuk kenali, 1 untuk cegah, 1 untuk deteksi. Kalau Anda hanya mengisi dua kolom pertama, nilai Anda maksimum dua pertiga — dan itu gambaran yang jujur tentang jaringan yang "sudah dikeraskan tapi tidak diawasi".

⏱ Mode Ujian: 120 menit. Jawaban ditulis di `09-keamanan.md`.

⚠️ Semua bukti di bawah ini adalah **bukti pertahanan**: yang Anda cari adalah indikator dan mitigasinya. Babak ini tidak memerlukan Anda melakukan serangan apa pun — dan jangan mencobanya pada jaringan yang bukan milik Anda atau tanpa izin tertulis.

---

## 2. Sepuluh Kejadian

### S1 — Pagi Senin, pengguna lantai 2 tidak bisa membuka ERP

```bash
staf@pc-lt2:~$ ip route
default via 192.168.10.244 dev enp0s3 proto dhcp metric 100
staf@pc-lt2:~$ cat /etc/resolv.conf
nameserver 192.168.10.244
staf@pc-lt2:~$ ip neigh | grep 244
192.168.10.244 dev enp0s3 lladdr b8:27:eb:4a:11:c2 REACHABLE
```

Gateway yang seharusnya `192.168.10.1`. Prefiks MAC `b8:27:eb` terdaftar sebagai perangkat komputer papan tunggal.

### S2 — Switch akses tiba-tiba melambat untuk semua port

```cisco
JKT-ACC-02# show mac address-table count
Dynamic Address Count : 8188
Total Mac Address Space Available: 4

JKT-ACC-02# show mac address-table dynamic interface Gi1/0/17 | count
Number of lines which match regexp = 7931
```

### S3 — Staf keuangan melihat peringatan sertifikat saat membuka portal internal

```bash
staf@pc-fin:~$ ip neigh
10.64.11.1   dev eth0 lladdr 00:1c:42:9f:03:71 REACHABLE
10.64.11.87  dev eth0 lladdr 00:1c:42:9f:03:71 REACHABLE
```

Dua alamat IP berbeda, satu MAC yang sama. `10.64.11.1` adalah gateway.

### S4 — Bingkai aneh tertangkap di uplink

```text
Frame 8812: 122 bytes
  Ethernet II  src: 00:1c:42:9f:03:71  dst: ff:ff:ff:ff:ff:ff
  802.1Q Virtual LAN, PRI: 0, ID: 1
  802.1Q Virtual LAN, PRI: 0, ID: 50      <-- tag kedua
  Internet Protocol Version 4, src: 10.65.50.201, dst: 10.65.50.11
  Modbus/TCP
```

VLAN 50 di pabrik adalah zona PLC. Bingkai ini masuk dari port akses di VLAN staf.

### S5 — Jaringan pabrik "kedip" tiap beberapa menit

```cisco
SBY-ACC-01# show spanning-tree vlan 10 | include Root|topology
  Root ID    Priority    4106
             Address     fc:ec:da:11:98:20
             Cost        19  Port 9 (GigabitEthernet1/0/9)
  Number of topology changes 2871 last change occurred 00:01:34 ago

SBY-ACC-01# show cdp neighbors Gi1/0/9
(tidak ada tetangga CDP)
```

Gi1/0/9 adalah port akses di area kantor pabrik. Switch inti pabrik memakai prioritas 8192.

### S6 — Lalu lintas DNS naik lima kali lipat dari satu host

```bash
root@dns01:~# tail -4 /var/log/named/query.log
client 10.64.50.31#51022: query: 7a4f2b9c1e8d.data.n0de-sync.ru IN TXT +
client 10.64.50.31#51023: query: 91cd3e77aa20.data.n0de-sync.ru IN TXT +
client 10.64.50.31#51024: query: bb02f1d9e451.data.n0de-sync.ru IN TXT +
client 10.64.50.31#51025: query: 4e9a7c03b8f6.data.n0de-sync.ru IN TXT +

root@dns01:~# grep -c 'n0de-sync.ru' /var/log/named/query.log
418922
```

`10.64.50.31` adalah server aplikasi internal. Ia tidak punya alasan menanyakan nama luar sebanyak itu.

### S7 — Suhu ruang beku 2 naik perlahan pada 02:40

```text
HMI audit log
2026-09-12 02:38:51  session start   user=TV-remote  src=203.0.113.x (Jepang)
2026-09-12 02:40:07  write register  addr=40021  old=-25  new=-16
2026-09-12 02:40:09  write register  addr=40022  old=1    new=0
2026-09-12 03:52:44  session end
```

Tidak ada permintaan perubahan, tidak ada tiket, tidak ada operator yang tahu. Perangkat lunak akses jarak jauh terpasang permanen di komputer HMI.

### S8 — Lonjakan lalu lintas internal pada 01:15

```bash
root@sensor-ids:~# zeek-cut id.orig_h id.resp_p < conn.log | sort | uniq -c | sort -rn | head -5
  4812 10.64.11.203  445
   980 10.64.11.203  139
   412 10.64.11.203  3389
    71 10.64.11.203  22
     9 10.64.11.203  5985
```

Satu PC staf membuka koneksi ke port berbagi berkas pada 4.800 alamat internal dalam 9 menit. Segera setelah itu, pekerjaan cadangan malam gagal dan berkas di `/srv/file` berubah ekstensinya.

### S9 — Dua SSID dengan nama sama di lantai 3

```text
SSID              BSSID              Enkripsi    Kanal  Sinyal
BNS-Karyawan      a4:53:0e:11:22:33  WPA2-EAP    36     -48 dBm
BNS-Karyawan      02:11:6b:9f:cd:0e  Terbuka     6      -39 dBm

Bingkai manajemen pada kanal 36: 1.284 deauthentication dalam 3 menit
```

### S10 — Beberapa laptop tiba-tiba memakai IPv6 untuk keluar

```bash
staf@pc-lt4:~$ ip -6 route | head -3
default via fe80::dead:beef dev wlan0 proto ra metric 600
2001:db8:5e4a:1024::/64 dev wlan0 proto ra metric 600

staf@pc-lt4:~$ ip -6 neigh | grep dead:beef
fe80::dead:beef dev wlan0 lladdr 02:11:6b:9f:cd:0e router REACHABLE
```

BNS memang punya `2001:db8:5e4a::/48`, tetapi IPv6 **belum** diaktifkan di jaringan pengguna. MAC pengirim sama dengan BSSID palsu di S9.

---

## 3. Yang Harus Dikeluarkan

**a. Tabel sepuluh kejadian** dengan tiga kolom (kenali / cegah / deteksi). Mitigasi harus berupa konfigurasi atau kebijakan nyata, bukan "pasang firewall".

**b. Matriks zona.** Baris = zona sumber, kolom = zona tujuan, isi = ditolak, atau diizinkan dengan protokol/port tertentu. Zona minimum: Staf · Voice · Wi-Fi tamu · Printer · Server aplikasi · Server basis data · Cadangan · CCTV · Sensor rantai dingin · OT-PLC · OT-HMI · DMZ · Manajemen · Mitra/auditor · Vendor jarak jauh · Internet. Matriks yang benar hampir seluruhnya berisi "ditolak" — dan setiap sel yang diizinkan harus bisa Anda jelaskan.

**c. Rancangan akses vendor jarak jauh** yang menggantikan permintaan Pak Tanaka, mencakup: alur permintaan dan persetujuan, siapa yang menyetujui, batas waktu sesi, cakupan alamat dan port, autentikasi, pencatatan dan perekaman sesi, serta apa yang terjadi bila vendor menolak syarat ini.

**d. Daftar periksa hardening** untuk empat platform: switch Cisco, router MikroTik, server Linux, dan perangkat IoT/kamera. Masing-masing minimal 10 butir, diurutkan dari yang paling berdampak.

**e. Playbook respons insiden** untuk dua kelas kejadian: perangkat terinfeksi di jaringan kantor, dan perintah tidak sah ke sistem kendali produksi. Cakup: siapa memutuskan, langkah pengekangan, cara mengawetkan bukti, kapan boleh mematikan/menyalakan ulang perangkat, urutan pemulihan, dan siapa yang diberi tahu (termasuk kewajiban terkait UU PDP bila data pribadi tersentuh).

**f. Satu keputusan sulit.** Bila mengekang serangan berarti mematikan kamera di area kritis — sementara kamera itu menghasilkan bukti kepatuhan — apa yang Anda lakukan, siapa yang berhak memutuskan, dan bagaimana Anda mendokumentasikannya.

---

## 4. Ringkasan

- Serangan dikenali dari **pola bukti**, bukan dari nama alat. Bukti yang sama bisa berarti serangan atau kesalahan konfigurasi; yang membedakan adalah data tambahan yang Anda cari.
- Mitigasi tanpa deteksi hanya menunda: kontrol bisa dilewati, dimatikan, atau tidak berlaku untuk jalur baru — dan Anda tidak akan tahu.
- Jaringan datar membuat hampir semua mitigasi lapisan 2 dan 3 kehilangan tempat berpijak. Segmentasi adalah prasyarat keamanan, bukan pelengkapnya.
- Zona OT memerlukan aturan berbeda: perangkatnya tidak bisa ditambal, protokolnya tanpa autentikasi, dan menghentikannya berarti menghentikan pabrik — sehingga perlindungan harus berada **di sekitarnya**, bukan di dalamnya.
- Akses pihak ketiga adalah pintu masuk yang paling sering dilupakan dan paling mudah dibenarkan secara bisnis. Karena itu ia harus dirancang, bukan ditolak atau dibiarkan.
- Keputusan pengekangan yang mengorbankan kepatuhan bukan keputusan teknis. Tugas Anda menyiapkan pilihan dan konsekuensinya, lalu manajemen yang memutuskan — tertulis.

---

## 5. Latihan — Pertanyaan Tim Biru

1. Ambil S1, S3, dan S10. Ketiganya berujung pada hal yang sama: penyerang menjadi perantara lalu lintas. Jelaskan mekanisme masing-masing, lalu susun **satu set kontrol hop pertama** yang menutup ketiganya sekaligus, dan tunjukkan kontrol mana yang menutup jalur mana.
2. S4 menunjukkan bingkai dengan dua tag 802.1Q yang berakhir di zona PLC. Jelaskan bagaimana bingkai seperti itu bisa berpindah VLAN, sebutkan dua kesalahan konfigurasi yang memungkinkannya, dan jelaskan mengapa mitigasinya sama sekali tidak melibatkan firewall.
3. S7 adalah kejadian dengan dampak bisnis terbesar di daftar ini. Jelaskan mengapa 802.1X, antivirus, dan penambalan sistem **semuanya tidak relevan** untuk mencegahnya, lalu rumuskan tiga kontrol yang benar-benar mencegah, dan satu kontrol deteksi yang akan menangkapnya dalam hitungan menit.
4. Pada S6 dan S8, penyerang memakai protokol yang **tidak boleh** Anda blokir seluruhnya (DNS dan berbagi berkas internal). Jelaskan cara mendeteksi penyalahgunaan protokol yang sah — sebutkan metrik dan ambang konkret — lalu jelaskan mengapa pendekatan "blokir domain jahat" akan selalu ketinggalan.
5. Insiden S8 mengenkripsi berkas dan menggagalkan pekerjaan cadangan. Atasan Anda memerintahkan "matikan semuanya dan pulihkan sekarang". Jelaskan pertentangan antara pemulihan cepat dan pengawetan bukti, tentukan urutan tindakan yang Anda ambil pada 15 menit pertama, dan sebutkan satu hal yang **tidak boleh** Anda lakukan walau diperintah — beserta cara menyampaikannya.

<details>
<summary>Jawaban</summary>

1. Mekanismenya berbeda, tujuannya sama.
   - **S1 — server DHCP liar.** Penyerang menjawab permintaan DHCP lebih dulu (atau satu-satunya yang menjawab setelah korban menyambung), memberikan dirinya sebagai gateway dan DNS. Korban patuh karena DHCP tidak punya autentikasi. Buktinya: gateway `.244` yang bukan `.1`, DNS menunjuk ke alamat yang sama, dan MAC dari perangkat papan tunggal.
   - **S3 — ARP spoofing.** Penyerang membalas ARP untuk alamat gateway dengan MAC dirinya, sehingga korban mengirim semua lalu lintas keluar ke penyerang. Buktinya: dua IP berbeda (gateway dan satu host) memetakan ke satu MAC.
   - **S10 — Router Advertisement liar.** Pada IPv6, host menerima gateway dari RA tanpa autentikasi. Karena banyak sistem operasi **mengutamakan IPv6** ketika tersedia, cukup mengirim RA untuk membelokkan lalu lintas — bahkan pada jaringan yang "belum memakai IPv6", yang justru lebih berbahaya karena tidak ada yang mengawasi IPv6 di sana.
   - **Set kontrol hop pertama yang menutup ketiganya:** **(a) DHCP snooping** pada VLAN pengguna dengan port uplink saja yang dipercaya → menutup S1; ia juga membangun tabel ikatan IP-MAC-port yang dibutuhkan kontrol berikutnya. **(b) Dynamic ARP Inspection** yang memakai tabel ikatan tersebut → menutup S3. **(c) IP Source Guard** → menolak paket dengan alamat sumber yang tidak sesuai ikatan, menutup celah pemalsuan sumber yang tersisa. **(d) RA Guard dan DHCPv6 Guard** (plus IPv6 snooping) pada semua port akses → menutup S10; dan bila IPv6 belum dipakai, tetap aktifkan penjagaannya, jangan sekadar "tidak mengonfigurasi IPv6" — perangkat pengguna tetap berbicara IPv6 walau Anda tidak. **(e) Di atas semuanya: 802.1X** supaya perangkat asing tidak pernah mendapat tempat di VLAN pengguna, dan **port-security** untuk membatasi jumlah MAC. Di MikroTik, padanannya: `dhcp-snooping` pada bridge, `arp=reply-only` dengan entri ARP statis untuk segmen kritis, dan penyaringan RA (`/ipv6 nd` beserta aturan bridge filter) — pola yang sama, nama yang berbeda. Kuncinya: **kontrol ini semuanya berada di port akses, sedekat mungkin dengan perangkat**, karena setelah lalu lintas palsu masuk ke jaringan, tidak ada satu pun perangkat di hulu yang bisa membedakannya dari lalu lintas sah.

2. Bingkai dengan dua tag berpindah VLAN karena **tag terluar dilepas oleh switch pertama, lalu tag dalam yang tersisa ditafsirkan sebagai VLAN tujuan oleh switch berikutnya.** Agar itu bekerja, tag terluar harus cocok dengan **native VLAN** pada trunk — switch melepas bingkai native tanpa tag, meneruskan sisanya, dan switch kedua melihat bingkai yang seolah-olah memang bertag VLAN 50. Dua kesalahan konfigurasi yang memungkinkannya: **(a) native VLAN pada trunk dibiarkan VLAN 1 dan sekaligus dipakai sebagai VLAN pengguna** — sehingga tag terluar yang dibuat dari VLAN pengguna cocok dengan native VLAN; **(b) trunk terbentuk otomatis di tempat yang tidak semestinya atau mengizinkan semua VLAN** (`dynamic desirable`/DTP aktif, `allowed vlan all`), sehingga VLAN zona PLC benar-benar tersedia di jalur yang menuju area pengguna. Mitigasinya murni lapisan 2: setel `switchport mode access` + `switchport nonegotiate` di semua port pengguna, pakai **native VLAN khusus yang tidak dipakai siapa pun** (VLAN buangan) pada setiap trunk dan samakan di kedua ujung, batasi `switchport trunk allowed vlan` hanya pada VLAN yang memang harus lewat — **VLAN OT tidak boleh pernah hadir di trunk yang menuju area kantor**, matikan DTP, dan tandai eksplisit VLAN yang tidak dipakai. Firewall tidak relevan karena **perpindahan terjadi di lapisan 2, sebelum ada keputusan lapisan 3 apa pun** — paket tidak pernah melewati gateway zona, jadi tidak ada tempat bagi firewall untuk melihatnya, apalagi menolaknya. Ini contoh terbaik dari prinsip: kontrol harus berada pada lapisan tempat serangan bekerja.

3. 802.1X, antivirus, dan penambalan tidak relevan karena **tidak ada satu pun dari ketiganya berada di jalur serangan.** Sesi datang dari perangkat lunak akses jarak jauh yang **sudah terpasang sah** di komputer HMI dan membentuk koneksi **keluar** (sehingga tidak perlu melewati aturan masuk firewall); penggunanya adalah teknisi vendor dengan kredensial yang berlaku; perintah yang dikirim adalah **perintah Modbus yang sah secara protokol** — menulis register setpoint adalah fungsi normal, bukan eksploitasi; dan komputer HMI biasanya **tidak boleh** ditambal atau dipasangi antivirus karena terikat sertifikasi mesin. Jadi tidak ada berkas jahat untuk dipindai, tidak ada kerentanan untuk ditambal, dan tidak ada perangkat asing untuk ditolak 802.1X. Tiga kontrol yang benar-benar mencegah: **(a) hapus jalur permanen** — cabut perangkat lunak akses jarak jauh, ganti dengan akses lewat jump host yang hanya dibuka atas permintaan, berbatas waktu, dan **disetujui operator pabrik yang sedang berjaga**, sehingga tidak ada sesi jam 02:40 tanpa ada manusia yang tahu; **(b) batasi arah dan cakupan di conduit OT** — zona OT hanya boleh dihubungi dari satu host bastion, hanya port yang diperlukan, dan **jangan izinkan sesi keluar dari zona OT ke internet** (ini yang membuat perangkat lunak akses jarak jauh mustahil bekerja); **(c) kontrol pada proses, bukan hanya jaringan** — setpoint kritis dibatasi di tingkat pengendali/PLC (nilai di luar rentang aman ditolak oleh logika mesin), dan perubahan setpoint memerlukan otorisasi lokal. Kontrol deteksi yang menangkap dalam hitungan menit: **alarm pada perubahan setpoint itu sendiri** — setiap penulisan register kritis menghasilkan peristiwa yang dikirim ke pemantauan dengan nilai lama dan baru, dan **setiap perubahan di luar jam kerja tanpa tiket memicu alarm langsung ke petugas jaga**; dilengkapi alarm laju perubahan suhu (suhu naik lebih cepat daripada batas wajar) yang menangkap akibatnya walau penyebabnya belum diketahui. Yang penting dipahami: di dunia OT, **pertahanan bergeser dari "cegah kode jahat" menjadi "cegah perintah sah yang tidak berwenang"**.

4. Cara mendeteksi penyalahgunaan protokol sah adalah dengan **memantau bentuk perilakunya, bukan isinya**.
   - **DNS (S6).** Metrik: jumlah kueri per host per menit dibandingkan garis dasar host itu sendiri (server aplikasi yang biasanya 20 kueri/menit lalu menjadi 2.000 = alarm); **proporsi kueri yang gagal/NXDOMAIN**; **panjang rata-rata label** dan entropi nama (nama acak panjang seperti `7a4f2b9c1e8d` hampir tidak pernah muncul dari lalu lintas manusia); jumlah **kueri unik ke satu domain induk** (418.922 kueri ke satu domain adalah anomali telanjang); dominasi tipe rekaman yang jarang (TXT/NULL); dan **kueri dari host yang seharusnya tidak melakukan resolusi nama luar sama sekali**. Ambang praktis untuk BNS: alarm bila satu host internal melakukan > 300 kueri/menit selama 5 menit, atau > 50 subdomain unik pada satu domain induk dalam 10 menit, atau > 100 kueri TXT/jam dari host server. Kontrol pendamping: **paksa semua DNS lewat resolver internal** (blokir port 53 dan DNS terenkripsi ke luar dari semua zona), catat setiap kueri, dan terapkan pembatasan laju.
   - **Berbagi berkas internal (S8).** Metrik: **jumlah tujuan berbeda** yang dihubungi satu host pada port 445 per satuan waktu (4.812 tujuan dalam 9 menit jelas bukan perilaku manusia — komputer staf biasanya menghubungi kurang dari 10 server berkas); **rasio koneksi gagal terhadap berhasil** (pemindaian menghasilkan banyak kegagalan); percobaan ke port administratif (3389, 5985, 22) dari komputer staf; laju penulisan/penggantian nama berkas di server berkas; dan penghapusan salinan bayangan atau kegagalan pekerjaan cadangan. Ambang: alarm bila satu host menghubungi > 25 tujuan internal berbeda pada port berbagi berkas dalam 5 menit. Kontrol pendamping: **isolasi klien** (komputer staf tidak boleh saling berbicara — hanya ke server), sehingga pemindaian lateral gagal secara struktural.
   - **Mengapa "blokir domain jahat" selalu ketinggalan:** daftar hitam bersifat **reaktif dan terbatas pada identitas** — domain baru bisa dibuat dalam hitungan detik dan murah, satu kampanye bisa memakai ribuan nama, domain dapat menumpang pada layanan sah (penyimpanan awan, jaringan pengiriman konten) yang tidak mungkin diblokir, dan lalu lintasnya bisa terenkripsi sehingga isinya tidak terlihat. Daftar hitam berguna sebagai **lapisan murah yang menangkap yang mudah**, tetapi deteksi yang tahan waktu harus berbasis **perilaku dan garis dasar** — karena perilaku "mengirim data keluar lewat ribuan kueri kecil" atau "menyentuh ribuan host internal" tetap sama walau nama domain dan alat penyerang berganti setiap hari.

5. Pertentangannya nyata: **mematikan dan memulihkan segera menghancurkan bukti** (isi memori, proses yang berjalan, koneksi aktif, kunci enkripsi yang mungkin masih ada di memori, penanda waktu berkas), dan tanpa bukti Anda tidak tahu **bagaimana penyerang masuk** — sehingga pemulihan berisiko mengembalikan sistem ke keadaan yang segera terinfeksi lagi, atau memulihkan berkas yang sudah tersusupi. Sebaliknya, menunda terlalu lama memperluas kerusakan. Urutan 15 menit pertama: **(a) Kekang, jangan matikan** — isolasi host `10.64.11.203` dari jaringan (matikan port switch-nya atau pindahkan ke VLAN karantina) sehingga penyebaran berhenti tetapi keadaan mesin tetap utuh; **(b) putuskan jalur ke penyimpanan cadangan** supaya salinan yang masih baik tidak ikut terenkripsi atau tertimpa — termasuk **menghentikan pekerjaan cadangan berikutnya**, karena cadangan yang berjalan justru bisa menimpa versi yang masih baik dengan versi terenkripsi; **(c) hentikan penyebaran lateral secara luas** dengan memblokir port berbagi berkas antar-host pengguna di seluruh VLAN staf, bukan hanya di satu host; **(d) awetkan bukti** — ambil salinan log dari perangkat jaringan, firewall, DNS, dan server (log di perangkat akan tergulung/terhapus, jadi ini paling mendesak), catat waktu setiap tindakan Anda dalam satu catatan kronologis, dan jangan mengubah host yang terisolasi; **(e) tentukan cakupan** — cari host lain dengan pola sama sebelum menyatakan aman; **(f) beri tahu** — manajemen, dan bila ada indikasi data pribadi karyawan/nelayan tersentuh, siapkan jalur pemberitahuan sesuai UU PDP beserta tenggatnya. Yang **tidak boleh** dilakukan walau diperintah: **memulihkan data ke sistem yang belum diketahui bersih dan belum diketahui jalan masuknya**, dan **menyalakan ulang atau mematikan host yang terinfeksi sebelum bukti diambil**. Cara menyampaikannya bukan dengan menolak, tetapi dengan menawarkan urutan yang lebih cepat mencapai tujuan atasan: *"Saya mulai pemulihan dalam 30 menit dengan syarat kita tahu dulu jalan masuknya — kalau kita pulihkan sekarang ke sistem yang sama, kemungkinan besar kita mengerjakannya dua kali dan kehilangan satu hari lagi. Sementara itu penyebaran sudah saya hentikan, jadi kerusakan tidak bertambah."* Jujur juga tentang batas kemampuan sendiri: bila skalanya besar, ini saatnya meminta bantuan respons insiden eksternal — dan itu keputusan manajemen yang harus Anda usulkan, bukan Anda tanggung sendiri.

</details>

---

## 6. Rubrik Babak 6 (130 poin)

| Aspek | Poin | Kriteria |
|---|---|---|
| Sepuluh kejadian (kenali/cegah/deteksi) | 60 | 2 poin per kolom terisi benar per kejadian |
| Matriks zona | 20 | Default tolak, setiap izin bisa dijelaskan, zona OT & sensor benar-benar terkurung |
| Rancangan akses vendor | 15 | Atas permintaan, berbatas waktu, tercakup, terekam, ada jalur persetujuan |
| Daftar periksa hardening 4 platform | 15 | Minimal 10 butir per platform, diurutkan berdasar dampak |
| Playbook respons insiden | 15 | Urutan kekang → bukti → pulih jelas; ada pemberitahuan & peran |
| Keputusan sulit terdokumentasi | 5 | Pilihan, konsekuensi, dan siapa yang memutuskan ditulis |

---

## 7. Sumber

- `12-keamanan/01-konsep-keamanan.md` sampai `05-zero-trust.md`
- `03-data-link/03-vlan.md` (native VLAN, DTP), `12-keamanan/02-serangan-l2.md`
- `09-nat-acl-firewall` — ACL, firewall stateful, IDS/IPS
- `06-aplikasi/01-dns.md`, `05-tls.md`
- `08-ipv6/02-ndp-slaac-dhcpv6.md` — kenapa RA liar berbahaya
- NIST SP 800-207 (Zero Trust), NIST SP 800-82 (keamanan sistem kendali industri), IEC 62443 (zona & conduit)
- MITRE ATT&CK for ICS — untuk memahami teknik yang menyasar OT

---

**Berikutnya:** `20-proyek-akhir/08-babak-7-kode-yang-menjaga.md` — berhenti mengetik di perangkat, mulai menulis kode yang mengerjakannya untuk Anda.

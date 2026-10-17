# 20.5 Babak 4: Bangun di Lab & Uji Terima

> **Prasyarat:** `20.4`, ditambah `03` (VLAN, STP), `04` (routing dasar), `07` (OSPF, FHRP), `13` (Linux), `19` (MikroTik)
> **Tujuan:** Mewujudkan desain dan rencana alamat menjadi konfigurasi yang benar-benar berjalan, lalu membuktikannya dengan matriks uji terima yang hasilnya tidak bisa didebat.

---

## 1. Bentuk Kerja Babak Ini

Dua babak sebelumnya menghasilkan dokumen. Dokumen bisa salah tanpa ada yang tahu. Babak ini mengubahnya menjadi **PASS atau FAIL**.

Aturan yang membedakan babak ini dari "latihan konfigurasi biasa":

- **Uji terima ditulis sebelum konfigurasi.** Ini bukan formalitas. Menulis uji dulu memaksa Anda menyatakan apa arti "berhasil" sebelum Anda jatuh cinta pada konfigurasi Anda sendiri.
- **Setengah uji harus uji negatif**, yaitu membuktikan sesuatu tidak bisa terjadi. Jaringan yang semua pingnya berhasil adalah jaringan tanpa keamanan.
- **Uji waktu dihitung, bukan dirasakan.** "Failover-nya cepat" bukan hasil uji. "Kehilangan 7 paket pada interval 200 ms = ±1,4 detik" adalah hasil uji.
- Konfigurasi yang tidak lulus uji **tidak disimpan ke `06-konfigurasi/`**. Repositori Anda hanya berisi yang terbukti.

> [!NOTE]
> Mode Ujian: 4-6 jam, boleh dibagi dua sesi. Mode Kilat: lewati, tapi wajib kerjakan §7 dan latihan.

> [!TIP]
> Pilih alat sesuai yang Anda punya: **Containerlab** (paling dekat perangkat nyata, butuh image), **GNS3/EVE-NG**, **Packet Tracer** (cukup untuk bagian Cisco), atau **namespace Linux + FRR + RouterOS CHR**. Yang penting topologinya mewakili, bukan alatnya megah.

---

## 2. Topologi Minimum yang Mewakili

Anda tidak perlu membangun 23 lokasi. Anda perlu membangun **setiap pola** satu kali.

<figure class="fig-img"><a href="/img/capstone-topologi-lab.png" target="_blank" rel="noreferrer"><img src="/img/capstone-topologi-lab.png" alt="Topologi lab minimum: TPI di balik CGNAT, kampus HQ, dan zona OT pabrik" loading="lazy"></a><figcaption>Tiga kolom pola: TPI di balik CGNAT, kampus HQ, dan pabrik dengan zona OT. Klik untuk memperbesar.</figcaption></figure>

**Wajib ada:** sepasang inti dengan FHRP · dua switch akses dengan VLAN · zona OT terpisah · dua jalur WAN · dua TPI di balik NAT · satu server Linux (DNS, NTP, syslog, pengumpul data suhu).
**Boleh disimulasikan sederhana:** CCTV, PLC, sensor (cukup wadah/host yang mengirim lalu lintas), AP (cukup satu host di VLAN yang benar), CGNAT (satu router NAT di depan TPI).

---

## 3. Kerangka Konfigurasi

Isi semua `<<...>>` dari rencana Anda sendiri di Babak 3. Kerangkanya sengaja tidak lengkap: bagian yang hilang adalah bagian yang diuji.

### 3.1 Switch akses HQ (Cisco)

```cisco
hostname <<SITUS-ACC-NN>>
!
no ip http server
no ip http secure-server
service password-encryption
enable secret <<rahasia kuat, unik per perangkat>>
username <<user>> privilege 15 secret <<...>>
ip domain-name <<zona internal Anda>>
crypto key generate rsa modulus 2048
line vty 0 15
 transport input ssh
 exec-timeout 10 0
 login local
!
vtp mode transparent
spanning-tree mode rapid-pvst
spanning-tree portfast default
spanning-tree portfast bpduguard default
!
vlan <<10,20,24,28,99>>
!
interface range Gi1/0/1 - 40
 switchport mode access
 switchport nonegotiate
 switchport access vlan <<vlan staf>>
 switchport voice vlan <<vlan voice>>
 switchport port-security
 switchport port-security maximum <<?>>
 switchport port-security violation <<restrict|shutdown — pilih & alasan>>
 storm-control broadcast level <<?>>
!
interface range Gi1/0/41 - 44
 description tidak dipakai
 <<apa yang wajib ada di port yang tidak dipakai?>>
!
interface range Gi1/0/47 - 48
 description uplink ke core
 switchport mode trunk
 switchport nonegotiate
 switchport trunk native vlan <<VLAN buangan, bukan 1>>
 switchport trunk allowed vlan <<daftar eksplisit>>
!
ip dhcp snooping vlan <<...>>
ip dhcp snooping
interface range Gi1/0/47 - 48
 ip dhcp snooping trust
!
ip arp inspection vlan <<...>>
!
interface Vlan99
 ip address <<dari rencana Anda>>
!
ntp server <<NTP internal>>
logging host <<syslog internal>>
logging trap informational
snmp-server group <<SNMPv3, bukan community>>
```

### 3.2 Inti HQ (Cisco): FHRP + OSPF

```cisco
interface Vlan10
 ip address <<.2 atau .3>> <<mask>>
 <<HSRP atau VRRP — pilih, beri prioritas, aktifkan preempt>>
 ip helper-address <<server DHCP>>
!
router ospf 1
 router-id <<loopback>>
 passive-interface default
 no passive-interface <<hanya tautan ke tetangga>>
 <<autentikasi tetangga OSPF>>
 network <<...>> area <<...>>
!
ip access-list extended <<nama>>
 <<aturan antar-zona — lihat §4 uji negatif>>
```

### 3.3 MikroTik TPI (di balik CGNAT)

```routeros
/system identity set name=<<TPI-NN-RTR01>>
/system ntp client set enabled=yes servers=<<NTP internal via terowongan, + cadangan publik>>
/system clock set time-zone-name=Asia/Jakarta
/ip service set telnet,ftp,www,api disabled=yes
/ip service set ssh address=<<hanya jaringan manajemen>>
/user set admin password=<<unik per situs>> 
/interface bridge add name=br-<<vlan>> vlan-filtering=<<?>>
<<pisahkan sensor, tablet, CCTV, tamu ke VLAN/bridge berbeda — jangan satu bridge>>
/ip pool add name=<<per vlan>> ranges=<<dari Babak 3>>
/ip dhcp-server add ... lease-time=<<dari Babak 3, bukan 3d>>
/interface wireguard add name=wg-hq mtu=<<?>>
/interface wireguard peers add interface=wg-hq public-key="<<hub>>" \
    endpoint-address=<<alamat publik hub>> endpoint-port=<<...>> \
    allowed-address=<<hanya prefix yang perlu>> persistent-keepalive=<<?>>
/ip firewall mangle add chain=forward out-interface=wg-hq protocol=tcp tcp-flags=syn \
    action=change-mss new-mss=clamp-to-pmtu
/ip firewall filter
<<rantai input: default drop, izinkan hanya yang perlu>>
<<rantai forward: sensor hanya boleh ke pengumpul data; tamu tidak boleh ke VLAN lain>>
/system logging action set remote remote=<<syslog pusat>>
/system scheduler <<cadangan konfigurasi terjadwal ke luar perangkat>>
```

### 3.4 Server Linux pabrik (bertahan hidup lokal)

```bash
# nftables: zona, bukan policy accept
nft add table inet fw
# <<chain input/forward dengan policy drop, lalu izinkan yang perlu>>

# chrony: server waktu lokal yang tetap melayani saat WAN mati
# /etc/chrony/chrony.conf
# <<sumber hulu + local stratum supaya tetap melayani saat terisolasi>>
allow <<jaringan pabrik>>

# pengumpul data suhu: menyimpan lokal dulu, kirim ke pusat kemudian
# <<antrean tahan mati listrik: tulis ke disk sebelum mengirim>>

# syslog & metrik
# <<terima log perangkat, teruskan ke pusat, simpan lokal N hari>>
```

---

## 4. Matriks Uji Terima

Salin ke `07-uji-terima.md`. Kolom `Hasil` diisi PASS/FAIL beserta bukti (potongan keluaran perintah, bukan ingatan).

| ID | Kategori | Langkah | Hasil yang diharapkan |
|---|---|---|---|
| **T01** | L2 | `show vlan brief` di kedua switch akses | Hanya VLAN yang direncanakan ada; VLAN 1 tidak dipakai untuk data |
| **T02** | L2 | `show interfaces trunk` | Native VLAN bukan 1; daftar VLAN eksplisit, bukan `all` |
| **T03** | L2 | `show spanning-tree root` | Root adalah switch inti, untuk semua VLAN |
| **T04** | L2 | Tancapkan switch/hub ke port akses | Port masuk `err-disable` dalam < 5 detik (BPDU guard) |
| **T05** | L2 | Kirim 100 MAC palsu dari satu port akses | Port melanggar port-security dan bertindak sesuai kebijakan; dicatat di syslog |
| **T06** | L2 | Jalankan server DHCP liar di port akses | Tawaran DHCP liar diblokir; pelanggaran tercatat (DHCP snooping) |
| **T07** | L2 | Coba ARP palsu untuk gateway dari VLAN staf | Ditolak oleh Dynamic ARP Inspection |
| **T08** | L3 | Dari PC staf: `ping` gateway, lalu `ping` server aplikasi | Keduanya berhasil |
| **T09** | L3 | `show ip ospf neighbor` di inti | Semua tetangga `FULL`, autentikasi aktif |
| **T10** | L3 | `show ip route` di inti | Rute TPI masuk sebagai **satu ringkasan**, bukan 20 baris |
| **T11** | L3 | Dari PC staf `traceroute` ke pabrik | Melewati jalur yang Anda rancang, bukan jalur mengejutkan |
| **T12** | FHRP | `ping -i 0.2` ke luar sambil mematikan inti aktif | Kehilangan paket ≤ 15 (≈3 detik); **catat angka pastinya** |
| **T13** | FHRP | Nyalakan kembali inti pertama | Peran kembali sesuai rencana (preempt) tanpa gangguan kedua |
| **T14** | WAN | Matikan ISP-A | Lalu lintas pindah ke ISP-B; catat waktu; sesi ERP pulih |
| **T15** | WAN | Matikan ISP-A **saat panggilan VoIP aktif** | Panggilan pulih atau terputus ≤ 1 kali; jelaskan hasilnya |
| **T16** | Terowongan | `ping` dari TPI ke pengumpul data pusat | Berhasil, dan terowongan dibentuk **dari arah TPI** |
| **T17** | Terowongan | Kirim berkas ±5 MB dari TPI ke pusat | Selesai tanpa menggantung (bukti MSS/MTU benar) |
| **T18** | Terowongan | Matikan hub, hidupkan lagi | TPI menyambung sendiri ≤ 60 detik tanpa disentuh |
| **T19** | Waktu | `show clock` / `chronyc tracking` di 5 perangkat | Selisih < 1 detik; sumber adalah NTP internal |
| **T20** | Waktu | Putus WAN pabrik 15 menit | Perangkat pabrik **tetap** tersinkronisasi ke NTP lokal |
| **T21** | Log | Picu satu pelanggaran port-security | Muncul di syslog pusat ≤ 30 detik, dengan nama perangkat yang benar |
| **T22** | Rantai dingin | Putus WAN pabrik 20 menit, sensor tetap mengirim | Data tersimpan lokal; setelah WAN pulih, **tidak ada celah data** |
| **T23** | Rantai dingin | Matikan satu sensor | Alarm sampai ke tujuan ≤ 5 menit (uji lagi di Babak 7) |
| **T24** | Negatif | Dari VLAN tamu: `ping` server aplikasi, server DB, PLC, dan VLAN staf | **Semua gagal** |
| **T25** | Negatif | Dari VLAN staf: akses PLC dan HMI | **Gagal**; hanya lewat jump host yang diizinkan |
| **T26** | Negatif | Dari VLAN sensor: `ping 8.8.8.8` dan akses host acak internal | **Gagal**; hanya ke pengumpul data yang berhasil |
| **T27** | Negatif | Dari VLAN CCTV: mulai koneksi ke internet | **Gagal**; kamera tidak boleh memulai sesi keluar |
| **T28** | Negatif | Dari internet: coba SSH ke server Linux | **Gagal**; tidak ada port yang diteruskan ke host internal |
| **T29** | Negatif | Dari VLAN staf: `telnet` ke switch | **Gagal** (hanya SSH), dan hanya dari jaringan manajemen |
| **T30** | Pemulihan | Pulihkan konfigurasi satu switch dari cadangan | Perangkat kembali berfungsi ≤ 30 menit (janji ke Bu Ratna) |

**Cara mengukur waktu failover** (T12, T14, T18):

```bash
# Jalankan sebelum memicu kegagalan, hentikan setelah pulih
ping -i 0.2 -D 10.64.50.10 | tee /tmp/uji-t12.log
# Hitung paket hilang: interval 0,2 s → 1 paket hilang ≈ 200 ms gangguan
grep -c 'icmp_seq' /tmp/uji-t12.log
```

> [!WARNING]
> Uji yang FAIL adalah hasil yang **berharga**, bukan kegagalan Anda. Catat apa adanya, cari sebabnya, perbaiki, uji ulang, dan simpan kedua catatannya. Riwayat "FAIL → perbaikan → PASS" justru yang membuat portofolio Anda dipercaya.

---

## 5. Uji Beban Ringan (opsional tapi disarankan)

| Uji | Cara | Untuk apa |
|---|---|---|
| Kapasitas uplink pabrik | `iperf3` dari VLAN CCTV ke NVR sambil sensor mengirim | Membuktikan sensor tidak terganggu aliran kamera |
| Perilaku saat jenuh | Penuhi uplink 100%, ukur latensi & kehilangan paket VoIP | Membuktikan QoS Anda bekerja (atau belum ada) |
| Banyak sesi | Buka 2.000 sesi dari VLAN staf lewat firewall | Menemukan batas tabel sesi sebelum pengguna menemukannya |

---

## 6. Ringkasan

- Uji terima ditulis sebelum konfigurasi, supaya definisi "berhasil" tidak bergeser mengikuti hasil.
- Separuh uji harus uji negatif; tanpa itu Anda hanya membuktikan jaringan menyambung, bukan bahwa jaringan aman.
- Waktu failover diukur dengan menghitung paket, bukan dengan kesan.
- Ketahanan lokal diuji dengan benar-benar memutus WAN, bukan dengan membaca dokumen.
- Konfigurasi yang belum lulus uji tidak layak masuk repositori.

---

## 7. Latihan: Membaca Uji

1. Uji T10 mensyaratkan rute TPI muncul sebagai satu ringkasan di tabel rute inti. Kalau uji ini FAIL dan yang muncul 20 baris, sebutkan tiga penyebab yang mungkin dan gejala apa yang akan muncul di kemudian hari bila dibiarkan.
2. Pada T12 Anda mencatat 6 paket hilang pada interval 200 ms, tetapi pada T14 (failover WAN) Anda mencatat 140 paket hilang. Jelaskan mengapa besaran keduanya berbeda jauh secara wajar, dan tentukan angka mana yang **tidak** boleh Anda terima beserta alasan bisnisnya.
3. T22 (putus WAN 20 menit, tidak boleh ada celah data) adalah uji paling penting di babak ini. Rancang caranya: apa yang harus dimiliki sisi sensor, sisi pengumpul lokal, dan sisi pusat, dan bagaimana Anda **membuktikan** tidak ada celah.
4. T27 melarang kamera CCTV memulai koneksi keluar. Tetapi vendor CCTV mengatakan kamera butuh internet untuk pembaruan firmware dan sinkronisasi waktu. Selesaikan pertentangan ini tanpa membuka jalan keluar permanen.
5. T04 memakai BPDU guard, T05 memakai port-security, T06 memakai DHCP snooping, dan T07 memakai Dynamic ARP Inspection. Jelaskan apa yang **hanya** bisa dicegah oleh masing-masing, lalu tunjukkan bahwa keempatnya tidak saling menggantikan.

<details>
<summary>Jawaban</summary>

1. Tiga penyebab yang mungkin: **(a)** Alamat TPI tidak selaras blok: nomor TPI dialokasikan sembarang sehingga tidak ada satu prefix yang mencakup semuanya tanpa mencakup hal lain; ringkasan menjadi tidak mungkin secara matematis (masalah rencana, bukan konfigurasi). **(b)** Ringkasan tidak dikonfigurasi di titik yang benar: pada OSPF, penggabungan hanya bisa dilakukan di ABR antar-area (`area X range`) atau saat mengiklankan rute eksternal (`summary-address`); bila semua TPI berada di area yang sama dengan inti, tidak ada tempat untuk meringkas. **(c)** Rute TPI dipelajari sebagai rute host/statis per peer terowongan (umum pada WireGuard: satu rute per `allowed-address`) dan diredistribusikan satu per satu tanpa digabung di hub. Gejala kalau dibiarkan: tabel rute tumbuh linear terhadap jumlah TPI (20 → 40 → 100 baris) sehingga setiap TPI yang tidak stabil ikut mengguncang tabel rute seluruh perusahaan (*flapping* menyebar), waktu konvergensi memanjang, beban CPU perangkat inti naik, pemecahan masalah menjadi berisik, dan batas perangkat kecil (terutama di depo) bisa tercapai. Prinsipnya: **ringkasan adalah sekat kebisingan, bukan penghematan memori.**

2. Perbedaannya wajar karena yang diuji dua mekanisme yang bekerja pada lapisan berbeda dengan sifat berbeda. T12 menguji **FHRP di dalam satu LAN**: peralihan gateway hanya perlu satu perangkat mengumumkan dirinya aktif dan mengirim ARP/gratuitous ARP; waktunya ditentukan oleh interval hello dan pengali hold (misalnya hello 1 detik × 3 = 3 detik, atau di bawah 1 detik dengan penyetelan agresif/BFD). T14 menguji **peralihan jalur WAN**: perangkat harus mendeteksi jalur mati (bisa lewat tautan fisik, pelacakan rute, uji jangkauan, atau BFD, yang masing-masing beda kecepatannya), rute harus dihitung ulang dan mungkin harus dipelajari ulang dari sisi lain, sesi NAT dan sesi enkripsi harus dibangun kembali di alamat sumber baru, dan aplikasi harus menyambung ulang. 140 paket × 200 ms = **28 detik**. Angka ini masih wajar untuk peralihan WAN tanpa BFD, tetapi harus diputuskan berdasarkan bisnis: **untuk data suhu 28 detik dapat diterima** (batas auditor 15 menit, dan data tetap tertahan di antrean lokal; lihat T22), **untuk VoIP tidak** (panggilan terputus), dan **untuk ERP dapat diterima** bila sesi menyambung ulang otomatis. Yang **tidak** boleh diterima adalah hasil T12 yang lama (misal 15 detik untuk FHRP di dalam satu LAN). Itu menandakan penyetelan salah, preempt tidak aktif, atau pemilihan ulang STP ikut terjadi, dan dampaknya setiap gangguan kecil di kantor akan terasa seperti pemadaman. Aturan yang bisa dibawa: **tetapkan target waktu pulih per layanan sebelum menguji**, lalu bandingkan hasil dengan target itu, bukan dengan perasaan "cepat".

3. Rancangan untuk T22 dibagi tiga sisi. **Sisi sensor/pengukur:** sensor harus mempunyai penyangga lokal. Kalau perangkatnya terlalu sederhana, tugas ini pindah ke gateway pengumpul di dekatnya; yang penting **pengukuran tetap terjadi dan diberi penanda waktu di lokasi** (bukan diberi penanda waktu oleh pusat saat data tiba, karena itu memalsukan riwayat). **Sisi pengumpul lokal (pabrik/TPI):** antrean tahan mati listrik (data ditulis ke disk sebelum dianggap diterima), disertai penanda waktu dari NTP lokal (karena itu T20 wajib lulus: tanpa waktu lokal yang benar, semua bukti Anda cacat), kapasitas antrean dihitung untuk kejadian terburuk yang masuk akal (misal: WAN mati 24 jam × laju data), aturan alarm lokal yang tetap berbunyi walau pusat tak terjangkau, dan jalur keluar alternatif untuk alarm (SMS/GSM, sirene di ruang jaga). **Sisi pusat:** penerimaan idempoten (data yang sama dikirim dua kali tidak menjadi dua catatan), menerima data dengan penanda waktu masa lalu (*backfill*) tanpa menolaknya, dan pemantauan "kapan terakhir saya menerima data dari lokasi X" sebagai metrik tersendiri. **Cara membuktikan tidak ada celah:** sebelum uji, catat waktu mulai; putus WAN 20 menit; setelah pulih, jalankan kueri yang menghitung **selisih waktu antar-catatan berurutan** untuk tiap sensor pada periode itu dan tampilkan selisih maksimumnya. Uji lulus bila selisih maksimum ≤ interval pengambilan normal + toleransi kecil (bukan ≤ 15 menit; pakai ambang yang jauh lebih ketat supaya masih ada ruang aman). Simpan keluaran kueri itu sebagai bukti, dan jadikan kueri yang sama sebagai laporan harian otomatis, sehingga uji terima berubah menjadi pemantauan berkelanjutan. Yang **tidak** membuktikan apa pun: melihat dasbor "kelihatan normal", karena grafik yang dirata-ratakan menyembunyikan celah pendek.

4. Selesaikan dengan memisahkan **kebutuhan sah** dari **cara yang nyaman bagi vendor**. Kamera butuh dua hal: waktu yang benar dan firmware yang diperbarui. Keduanya tidak menuntut kamera bisa menjangkau internet. Untuk waktu: arahkan kamera ke **NTP internal** (yang memang sudah Anda punya, dan tetap hidup saat WAN mati; lihat T19/T20). Untuk firmware: unduh berkas firmware secara manual atau lewat proses terkendali ke **repositori internal**, uji pada satu kamera, lalu sebarkan dari dalam; pembaruan firmware perangkat kepatuhan memang **harus** diuji dulu, jadi jalur "kamera memperbarui diri sendiri dari internet" berisiko bagi keamanan sekaligus operasional (firmware yang mengubah perilaku perekaman di tengah masa audit). Bila vendor tetap butuh akses sesekali: sediakan jendela **atas permintaan dan berbatas waktu** lewat jump host, hanya ke alamat kamera tertentu, dengan pencatatan. Polanya sama seperti akses vendor PLC. Tambahan yang membuat aturan T27 tetap bisa ditegakkan: izinkan **hanya** kamera → NVR (port perekaman) dan kamera → NTP internal, tolak sisanya, dan **catat setiap penolakan**, karena kamera yang tiba-tiba mencoba keluar adalah indikator dini perangkat terinfeksi (persis yang terjadi di Babak 8). Prinsip umum: ketika vendor meminta akses internet untuk perangkatnya, tanyakan **layanan apa** yang sebenarnya dibutuhkan, lalu sediakan layanan itu dari dalam.

5. Keempatnya menutup lubang yang berbeda:
   - **BPDU guard** hanya menyoal **topologi lapisan 2**: mencegah perangkat yang berbicara STP muncul di port pengguna dan mengubah struktur pohon (mengambil peran root, memicu perubahan topologi, atau menciptakan jalur ganda). Ia tidak peduli MAC, DHCP, atau ARP.
   - **Port-security** menyoal **jumlah dan identitas MAC di satu port**: mencegah pembanjiran tabel MAC (`macof`) dan mencegah orang menyambungkan switch/beberapa perangkat di balik satu port akses. Ia tidak mencegah satu perangkat sah dari melakukan ARP palsu, dan tidak mencegah perangkat yang berbicara STP.
   - **DHCP snooping** menyoal **siapa yang boleh menjawab DHCP**: mencegah server DHCP liar memberi gateway/DNS palsu ke pengguna (serangan man-in-the-middle paling mudah dilakukan dan paling sering tidak sengaja terjadi, misalnya orang membawa router rumahan). Ia tidak mencegah ARP palsu dari perangkat yang tidak memakai DHCP, dan tidak membatasi jumlah MAC.
   - **Dynamic ARP Inspection** menyoal **kebenaran pemetaan IP-ke-MAC**: mencegah perangkat mengaku sebagai gateway atau sebagai host lain melalui balasan ARP palsu. DAI justru **bergantung** pada basis data ikatan hasil DHCP snooping, jadi keduanya berpasangan, bukan bergantian.
   - Cara mudah mengingatnya: BPDU guard menjaga **bentuk** jaringan, port-security menjaga **berapa banyak** yang tersambung, DHCP snooping menjaga **siapa yang boleh memberi alamat**, DAI menjaga **siapa yang boleh mengaku sebagai siapa**. Lengkapi dengan storm-control (menjaga **volume**) dan 802.1X (menjaga **siapa yang boleh masuk sama sekali**), barulah port akses Anda layak disebut aman.

</details>

---

## 8. Rubrik Babak 4 (150 poin)

| Aspek | Poin | Kriteria |
|---|---|---|
| Topologi lab mewakili semua pola | 20 | Inti berpasangan, akses, zona OT, dua WAN, dua TPI di balik NAT, server Linux |
| Konfigurasi lengkap & aman | 35 | Semua `<<...>>` terisi, konsisten dengan Babak 3, tanpa telnet/community/password bersama |
| Uji positif T01-T23 | 40 | Setiap uji punya bukti keluaran perintah |
| Uji negatif T24-T29 | 30 | Semua benar-benar gagal seperti diharapkan; ini yang paling sering luput |
| Uji waktu terukur | 15 | Angka nyata untuk T12, T14, T18, dengan cara ukur yang dicantumkan |
| Riwayat FAIL → perbaikan → PASS | 10 | Ada catatan kegagalan dan bagaimana diperbaiki |

---

## 9. Sumber

- `lab/00-setup-lab.md` sampai `lab/06-lab-mikrotik.md`: semua lab yang menjadi bekal babak ini
- `03-data-link/03-vlan.md`, `04-stp.md`, `05-etherchannel.md`
- `07-routing-lanjutan/04-ospf.md`, `07-fhrp.md`
- `19-mikrotik/02-bridge-vlan-switching.md`, `03-firewall-nat.md`, `06-vpn-tunnel.md`
- `13-linux-networking`: nftables, chrony, resolusi nama
- `referensi/cheatsheet-cisco-ios.md`, `cheatsheet-mikrotik.md`, `cheatsheet-linux-network.md`

---

**Berikutnya:** `20-proyek-akhir/06-babak-5-udara-dan-gudang-beku.md`. Hitung sinyal radio di ruangan bersuhu −25 °C penuh rak logam.

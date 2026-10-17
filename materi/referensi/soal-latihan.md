# Bank Soal Latihan

> Kumpulan soal lintas-topik untuk menguji pemahaman & persiapan ujian (CCNA/Network+). Jawaban + penjelasan di `<details>`. Kerjakan tanpa melihat jawaban dulu. Tiap modul juga punya latihan sendiri.

---

## Bagian A: Fondasi & Model (Tahap 0-1)

**A1.** Konversikan `192` dan `172` ke biner 8-bit. Berapa `11000000` dalam desimal?

<details><summary>Jawaban</summary>192 = `11000000`; 172 = `10101100`; `11000000` = 128+64 = **192**. (Latih konversi ini sampai instan, karena ini dasar subnetting.)</details>

**A2.** Urutkan layer OSI dari 1 ke 7 dan sebutkan PDU di layer 2, 3, 4.

<details><summary>Jawaban</summary>1 Physical, 2 Data Link, 3 Network, 4 Transport, 5 Session, 6 Presentation, 7 Application. PDU: L2 = **frame**, L3 = **packet**, L4 = **segment** (TCP) / datagram (UDP). Mnemonik: "Please Do Not Throw Sausage Pizza Away".</details>

**A3.** Di layer OSI mana switch, router, dan hub beroperasi?

<details><summary>Jawaban</summary>Hub = **L1** (Physical, mengulang sinyal, satu collision domain). Switch = **L2** (Data Link, forwarding berdasar MAC). Router = **L3** (Network, forwarding berdasar IP). Switch L3/multilayer = L2+L3. Firewall NGFW bisa sampai L7.</details>

**A4.** Apa perbedaan collision domain dan broadcast domain? Berapa masing-masing pada switch 24-port?

<details><summary>Jawaban</summary>**Collision domain** = area di mana tabrakan bisa terjadi; **broadcast domain** = area di mana broadcast menyebar. Switch 24-port: **24 collision domain** (satu per port, full-duplex meniadakannya) dan **1 broadcast domain** (semua port, kecuali dipisah VLAN). Router memisahkan broadcast domain; VLAN memisahkannya dalam satu switch.</details>

---

## Bagian B: Layer Fisik & Data Link (Tahap 2-3)

**B1.** PC terhubung ke switch tetapi lambat & banyak error. `show interface` menunjukkan banyak "late collisions". Apa penyebab paling mungkin?

<details><summary>Jawaban</summary>**Duplex mismatch**: satu sisi full-duplex, sisi lain half-duplex (sering karena satu di-set manual, satu autonegosiasi lalu default half). Late collision adalah gejala klasik. Solusi: samakan setting duplex/speed di kedua ujung (idealnya autonegosiasi di keduanya, atau hardcode keduanya sama). Lihat `02/02`, `03/02`.</details>

**B2.** Sebuah frame masuk switch dengan MAC tujuan yang belum ada di CAM table. Apa yang dilakukan switch?

<details><summary>Jawaban</summary>**Flooding**: switch meneruskan frame ke semua port (kecuali port asal) dalam VLAN yang sama (unknown unicast flooding). Ia juga **belajar** MAC sumber frame itu (memetakannya ke port masuk). Saat balasan datang, ia belajar MAC tujuan sehingga frame berikutnya di-forward langsung (unicast). Lihat `03/02`.</details>

**B3.** Trunk antara SW1 dan SW2 tidak melewatkan VLAN 30, padahal VLAN 10 & 20 jalan. Apa yang dicek?

<details><summary>Jawaban</summary>Cek `switchport trunk allowed vlan`: VLAN 30 mungkin tidak termasuk daftar yang diizinkan di trunk (salah satu/kedua sisi). Juga pastikan **VLAN 30 ada** (dibuat) di kedua switch. `show interfaces trunk` menampilkan VLAN yang diizinkan & aktif. Lihat `03/03`.</details>

**B4.** Kenapa STP memblokir port, dan apa risikonya jika STP dimatikan pada topologi dengan link redundan?

<details><summary>Jawaban</summary>STP memblokir port redundan untuk **mencegah loop L2**. Tanpa STP pada topologi ber-loop: **broadcast storm** (broadcast berputar tak henti, menggandakan diri → melumpuhkan jaringan), **MAC table instability** (MAC terlihat berpindah-pindah port), dan **multiple frame delivery**. Loop L2 tidak punya TTL seperti L3, jadi tak berhenti sendiri. Lihat `03/04`.</details>

---

## Bagian C: IP & Subnetting (Tahap 4)

**C1.** Diberi `10.20.30.75/28`. Tentukan: network, broadcast, rentang host usable, dan jumlah host per subnet.

<details><summary>Jawaban</summary>/28 → mask 255.255.255.240, blok = 256−240 = **16**. Kelipatan 16: 64, 80... → 75 ada di 64-79. **Network = 10.20.30.64**, **Broadcast = 10.20.30.79**, **Host usable = .65-.78**, **14 host** (2^4−2). Lihat `04/02`, `referensi/tabel-subnetting.md`.</details>

**C2.** Anda butuh minimal 500 host dalam satu subnet. Prefix terkecil apa yang cukup?

<details><summary>Jawaban</summary>Butuh host usable ≥ 500. /23 = 2^9−2 = **510 host**, cukup (/24 hanya 254, kurang). Jadi **/23** (255.255.254.0). Lihat `04/02-03`.</details>

**C3.** Bagi `192.168.10.0/24` untuk 4 subnet sama besar. Sebutkan keempat network & prefixnya.

<details><summary>Jawaban</summary>4 subnet → pinjam 2 bit → **/26** (blok 64). Network: **192.168.10.0/26** (.0-.63), **192.168.10.64/26** (.64-.127), **192.168.10.128/26** (.128-.191), **192.168.10.192/26** (.192-.255). Masing-masing 62 host usable. Lihat `04/02`.</details>

**C4.** Host punya IP `169.254.10.5`. Apa artinya dan apa yang salah?

<details><summary>Jawaban</summary>`169.254.0.0/16` = **APIPA / link-local**: host gagal mendapat IP dari DHCP lalu memberi dirinya sendiri alamat ini. Artinya DHCP server tak terjangkau/tidak merespons. Cek: DHCP server hidup, konektivitas ke DHCP (relay/`ip helper-address` bila beda subnet), kabel/VLAN. Lihat `04/01`, `06/02`.</details>

**C5.** Apa itu wildcard mask, dan tulis wildcard untuk `255.255.255.192`.

<details><summary>Jawaban</summary>**Wildcard mask** = kebalikan subnet mask (0=harus cocok, 1=abaikan), dipakai di ACL & `network` OSPF. `255.255.255.192` → wildcard = `0.0.0.63` (255−255=0, 255−192=63). Lihat `04/03`, `09/02`.</details>

---

## Bagian D: Transport & Aplikasi (Tahap 5-6)

**D1.** Kapan memilih UDP daripada TCP? Beri dua contoh aplikasi UDP.

<details><summary>Jawaban</summary>Pilih **UDP** saat kecepatan/latensi rendah lebih penting daripada keandalan, atau aplikasi menangani sendiri keandalannya, atau untuk broadcast/multicast. Contoh: **DNS query** (cepat, satu paket), **VoIP/streaming** (real-time, retransmisi terlambat tak berguna), DHCP, NTP, SNMP, gaming, QUIC/HTTP3. TCP untuk yang butuh keandalan (web, email, transfer file). Lihat `05/02-03`.</details>

**D2.** Jelaskan TCP three-way handshake.

<details><summary>Jawaban</summary>**SYN** (klien→server, "mau connect", kirim ISN klien) → **SYN-ACK** (server→klien, akui + ISN server) → **ACK** (klien→server, akui). Setelah itu koneksi established. Menyinkronkan sequence number dua arah. (Penutupan: FIN/ACK empat arah.) Lihat `05/02`.</details>

**D3.** Klien tidak bisa membuka website via nama tapi bisa via IP. Di mana masalahnya?

<details><summary>Jawaban</summary>**DNS**: resolusi nama gagal, tetapi konektivitas IP OK (terbukti bisa via IP). Cek: konfigurasi DNS server di klien (`ipconfig /all` / `resolv.conf`), server DNS responsif (`nslookup`/`dig`), record ada. Lihat `06/01`, `14/02`.</details>

**D4.** Apa fungsi SPF, DKIM, dan DMARC pada email?

<details><summary>Jawaban</summary>Mencegah pemalsuan email (spoofing/phishing): **SPF** memverifikasi server pengirim diizinkan mengirim atas nama domain (via record DNS daftar IP). **DKIM** menambahkan tanda tangan kriptografis ke email (verifikasi integritas + asal via kunci publik di DNS). **DMARC** kebijakan yang mengikat SPF/DKIM (align dengan domain From) & memberi tahu penerima apa yang dilakukan jika gagal (none/quarantine/reject) + laporan. Lihat `06/05`.</details>

---

## Bagian E: Routing (Tahap 7)

**E1.** Router punya rute ke `10.1.1.0/24` dari OSPF (AD 110) dan dari static (AD 1). Mana yang dipakai & kenapa?

<details><summary>Jawaban</summary>**Static (AD 1)** dipakai. Router memilih rute dengan **Administrative Distance terendah** saat ada beberapa sumber untuk prefix yang sama. AD adalah tingkat kepercayaan sumber rute; static lebih dipercaya dari OSPF secara default. (Metric hanya membandingkan dalam protokol yang sama.) Lihat `07/02`.</details>

**E2.** Router punya rute: `10.1.1.0/24` via OSPF dan `10.1.0.0/16` via static. Paket ke `10.1.1.5` lewat mana?

<details><summary>Jawaban</summary>Lewat rute **`10.1.1.0/24`** (OSPF) karena **longest prefix match**: router memilih rute paling spesifik (mask terpanjang) yang cocok, terlepas dari AD/metric. /24 lebih spesifik dari /16. AD hanya menentukan pilihan antar-sumber untuk prefix yang sama persis. Lihat `07/02`, `04/05`.</details>

**E3.** Dua router OSPF tidak membentuk adjacency (stuck di INIT/EXSTART). Sebutkan tiga kemungkinan penyebab.

<details><summary>Jawaban</summary>(Tiga dari) **area mismatch**, **subnet/mask link tidak cocok**, **MTU mismatch** (stuck EXSTART/EXCHANGE), **hello/dead timer mismatch**, **network type mismatch**, **autentikasi mismatch**, **router-id duplikat**, ACL memblokir OSPF (proto 89). Cek `show ip ospf interface` & `show ip ospf neighbor`. Lihat `07/04`.</details>

**E4.** Kapan memakai OSPF vs BGP?

<details><summary>Jawaban</summary>**OSPF** = IGP, di dalam satu organisasi/AS: konvergensi cepat, memilih jalur terbaik via cost, cocok untuk enterprise/kampus. **BGP** = EGP, antar-AS (internet) atau untuk multihoming ke banyak ISP dan kontrol kebijakan skala besar: scalable (jutaan rute), berbasis kebijakan/path, konvergensi lebih lambat. Ringkas: OSPF di dalam, BGP di antara. Lihat `07/04`, `07/06`.</details>

**E5.** Apa tujuan FHRP (HSRP/VRRP), dan masalah apa yang dipecahkannya?

<details><summary>Jawaban</summary>**FHRP** menyediakan gateway redundan: beberapa router berbagi satu **virtual IP/MAC** sebagai default gateway. Masalah yang dipecahkan: default gateway adalah **single point of failure**; jika router gateway mati, host kehilangan akses keluar. Dengan FHRP, jika router aktif gagal, router standby mengambil alih virtual IP secara transparan, sehingga host tidak perlu mengubah gateway. Lihat `07/08`.</details>

---

## Bagian F: Keamanan & IP Services (Tahap 9, 12)

**F1.** Apa perbedaan ACL standard dan extended, dan di mana masing-masing sebaiknya ditempatkan?

<details><summary>Jawaban</summary>**Standard** (1-99) memfilter berdasarkan **alamat sumber saja** → tempatkan **dekat tujuan** (agar tidak memblokir trafik yang seharusnya boleh ke tujuan lain). **Extended** (100-199) memfilter berdasarkan **sumber, tujuan, protokol, dan port** → tempatkan **dekat sumber** (buang trafik tak diinginkan sedini mungkin, hemat bandwidth). Keduanya punya **deny any implisit** di akhir. Lihat `09/02`.</details>

**F2.** Jelaskan cara kerja PAT (NAT overload) dan kenapa satu IP publik bisa melayani ratusan host.

<details><summary>Jawaban</summary>**PAT** menerjemahkan banyak IP privat ke **satu IP publik**, membedakan setiap koneksi dengan **nomor port sumber** yang unik. Router menyimpan tabel translasi (IP privat:port ↔ IP publik:port). Karena ada 65535 port dan setiap koneksi punya kombinasi unik (5-tuple), satu IP publik bisa menangani puluhan ribu koneksi simultan. Balasan dicocokkan kembali via tabel. Ini yang membuat IPv4 bertahan meski alamat habis. Lihat `09/01`.</details>

**F3.** Serangan apa yang dicegah oleh DHCP snooping dan Dynamic ARP Inspection?

<details><summary>Jawaban</summary>**DHCP snooping** mencegah **rogue DHCP server** (server DHCP nakal yang memberi gateway/DNS palsu → MITM) dengan hanya mengizinkan reply DHCP dari port trusted. **DAI (Dynamic ARP Inspection)** mencegah **ARP spoofing/poisoning** (penyerang mengklaim MAC gateway untuk MITM) dengan memvalidasi ARP terhadap binding table DHCP snooping. Keduanya melindungi dari serangan L2 man-in-the-middle. Lihat `12/02`.</details>

**F4.** Bandingkan WPA2-PSK dan WPA2-Enterprise. Kapan memakai masing-masing?

<details><summary>Jawaban</summary>**WPA2-PSK** memakai satu passphrase bersama untuk semua pengguna. Cara ini mudah dan cocok untuk rumah/UKM kecil, tetapi passphrase bisa bocor & sulit dicabut per-orang. **WPA2-Enterprise** memakai **802.1X + RADIUS**: setiap pengguna berautentikasi dengan kredensial unik (username/password atau sertifikat), memungkinkan pencabutan per-orang, akunting, dan VLAN dinamis. Pakai Enterprise untuk korporat/organisasi (keamanan & manajemen), PSK untuk rumah/tamu sederhana. WPA3 memperbaiki keduanya (SAE). Lihat `10/03`, `12/04`.</details>

**F5.** Apa prinsip inti Zero Trust dan bagaimana ia berbeda dari model perimeter tradisional?

<details><summary>Jawaban</summary>**Zero Trust**: "jangan pernah percaya, selalu verifikasi". Tidak ada kepercayaan implisit berdasarkan lokasi jaringan (berada di jaringan internal tidak berarti tepercaya). Setiap akses diverifikasi (identitas, perangkat, konteks) dengan **least privilege** dan **mikrosegmentasi**. Model **perimeter tradisional** ("castle-and-moat") mempercayai semua yang di dalam perimeter (firewall keras di tepi, dalam lunak), sehingga sekali penyerang menembus perimeter, ia leluasa bergerak lateral. Zero Trust menghilangkan asumsi kepercayaan itu. Lihat `12/05` (NIST SP 800-207).</details>

---

## Bagian G: Wireless, WAN, QoS (Tahap 10-11)

**G1.** Kenapa di 2.4 GHz hanya kanal 1, 6, 11 yang direkomendasikan?

<details><summary>Jawaban</summary>Karena kanal 2.4 GHz saling tumpang tindih (overlap): tiap kanal lebarnya ~20-22 MHz, tetapi jaraknya hanya 5 MHz. Kanal **1, 6, 11** adalah satu-satunya set tiga kanal yang tidak overlap satu sama lain (berjarak cukup). Memakai kanal lain (mis. 3, 8) menyebabkan interferensi co-channel/adjacent-channel dengan tetangga. Lihat `10/01`.</details>

**G2.** Apa perbedaan policing dan shaping dalam QoS?

<details><summary>Jawaban</summary>**Policing** membatasi trafik dengan membuang (drop) atau menandai ulang paket yang melebihi rate. Paket tidak ditahan, langsung dibuang; cocok di ingress, tidak menambah delay tapi bisa banyak drop (buruk untuk TCP). **Shaping** membatasi dengan menahan (buffer/antre) paket berlebih lalu mengirimnya kemudian pada rate target. Hasilnya trafik lebih halus, delay/jitter bertambah tetapi drop lebih sedikit; cocok di egress (mis. ke WAN). Ringkas: policing buang, shaping tunda. Lihat `11/03`.</details>

**G3.** Apa keunggulan SD-WAN dibanding WAN MPLS tradisional?

<details><summary>Jawaban</summary>**SD-WAN**: (a) memanfaatkan **transport murah** (internet broadband, LTE) dengan reliabilitas mendekati MPLS lewat **pemilihan jalur dinamis** berbasis kondisi link (latensi/loss); (b) **manajemen terpusat** (controller) untuk kebijakan konsisten di banyak cabang; (c) **enkripsi otomatis** & keamanan terintegrasi; (d) provisioning cepat (zero-touch); (e) visibilitas aplikasi. MPLS memberi SLA terjamin tapi mahal & lambat provisioning. Banyak desain: SD-WAN atas MPLS+internet. Lihat `11/01`.</details>

---

## Bagian H: Otomasi, DC, Cloud (Tahap 15-16)

**H1.** Apa arti "idempoten" dalam otomasi, dan kenapa penting?

<details><summary>Jawaban</summary>**Idempoten** = menjalankan operasi berkali-kali menghasilkan **keadaan akhir yang sama** seperti sekali jalan (tidak ada perubahan tambahan/efek samping pada run berikutnya jika keadaan sudah sesuai). Penting karena: memungkinkan menjalankan playbook/skrip berulang dengan aman (tidak merusak/menduplikasi), memudahkan konvergensi ke keadaan diinginkan, dan mendukung "declare desired state". Ansible dirancang idempoten (run kedua = "changed=0"). Lihat `15/04`.</details>

**H2.** Jelaskan pemisahan control plane dan data plane dalam SDN.

<details><summary>Jawaban</summary>**Control plane** ("otak") memutuskan ke mana trafik pergi (routing, kebijakan); **data plane** ("otot") meneruskan paket berdasarkan keputusan itu. Tradisional: keduanya di setiap perangkat. SDN memisahkannya: control plane dipindah ke **controller terpusat** yang memprogram data plane perangkat (via southbound API). Ini memungkinkan pengelolaan seluruh jaringan sebagai satu sistem, konsistensi, dan programabilitas. Lihat `16/06`.</details>

**H3.** Kenapa data center modern memakai spine-leaf, bukan tiga-tier, dan apa peran VXLAN?

<details><summary>Jawaban</summary>**Spine-leaf** cocok untuk trafik **east-west** (server↔server) yang mendominasi DC: jarak konsisten **2 hop**, **ECMP** (semua link aktif, tak ada STP blocking), skala horizontal. Tiga-tier dioptimalkan untuk north-south & memblokir link redundan. **VXLAN** membangun **overlay L2 di atas underlay L3** dengan membungkus frame Ethernet dalam UDP/IP, sehingga VM/tenant di rak berbeda seolah berada di satu segmen. Dengan **16 juta segmen** (VNI 24-bit), VXLAN mengatasi batas 4094 VLAN. EVPN (MP-BGP) jadi control plane-nya. Lihat `16/01-02`.</details>

**H4.** Apa perbedaan Security Group dan Network ACL di cloud (AWS)?

<details><summary>Jawaban</summary>**Security Group**: melekat pada **instance**, **stateful** (balasan otomatis diizinkan), hanya rule allow. **Network ACL (NACL)**: melekat pada **subnet**, **stateless** (harus izinkan trafik masuk & balasannya eksplisit), punya rule allow & deny. Paralel on-premises: SG ≈ **stateful firewall**, NACL ≈ **ACL stateless** tradisional. Lihat `16/04`.</details>

---

## Bagian I: Troubleshooting (skenario terapan)

**I1.** User melapor "tidak bisa akses internet". Uraikan pendekatan troubleshooting sistematis Anda.

<details><summary>Jawaban</summary>Pendekatan **bottom-up OSI** (atau bagi-dua): **(1) Fisik**: link up? kabel? (`show interface`, lampu). **(2) IP lokal**: host punya IP/mask/gateway benar? (`ipconfig`/`ip addr`); bukan APIPA 169.254? **(3) Gateway**: bisa ping default gateway? (masalah lokal vs hulu). **(4) DNS**: bisa ping IP publik (8.8.8.8) tapi tidak nama? → DNS. **(5) Routing/NAT**: bisa ping gateway tapi tidak internet? Cek rute default, NAT, firewall di router. **(6) Luas atau satu user?** Jika semua user kena, masalah di infrastruktur (router/ISP); jika satu, masalah di host itu. Verifikasi tiap langkah sebelum lanjut, dokumentasikan. Lihat `14/01`.</details>

**I2.** Ping ke gateway berhasil, ping ke `8.8.8.8` gagal, tapi `nslookup` juga gagal. Di mana masalahnya?

<details><summary>Jawaban</summary>Gateway OK (LAN & gateway sehat), tetapi tidak bisa keluar ke internet (8.8.8.8 gagal) **dan** DNS gagal → masalah **di hulu gateway**: kemungkinan **default route hilang/salah**, **NAT tidak berfungsi**, **firewall memblokir**, atau **koneksi WAN/ISP down**. Karena ping ke IP publik (bukan nama) pun gagal, masalahnya lebih dari DNS: konektivitas keluar itu sendiri putus. Cek di router: rute default, status interface WAN, NAT, dan firewall. Lihat `14/01-02`.</details>

**I3.** Interface menunjukkan "up/down" (line protocol down). Apa artinya dan apa yang dicek?

<details><summary>Jawaban</summary>**"up/down"** = layer 1 (fisik/line) up, tetapi **layer 2 (line protocol) down**: sinyal ada, tetapi ada masalah L2. Untuk Ethernet: bisa masalah encapsulation mismatch, keepalive, atau (pada serial) clocking/encapsulation mismatch. Cek: encapsulation cocok di kedua sisi, tidak ada mismatch protokol, keepalive. ("down/down" = masalah fisik/kabel; "administratively down" = interface di-`shutdown`.) Lihat `14/02`, `02/02`.</details>

---

## Bagian J: Campuran (tantangan)

**J1.** Rancang skema IP hierarkis untuk 3 situs, masing-masing butuh ~200 host di LAN utama. Jelaskan agar bisa di-summarize.

<details><summary>Jawaban</summary>Beri tiap situs blok kontinu, mis. dari `10.0.0.0/8`: Situs 1 = `10.1.0.0/16`, Situs 2 = `10.2.0.0/16`, Situs 3 = `10.3.0.0/16`. LAN utama ~200 host butuh /24 (254 host): mis. Situs 1 LAN utama = `10.1.10.0/24`. Karena tiap situs punya blok /16 kontinu, tiap situs bisa **diiklankan sebagai satu rute /16** (summarization) ke situs lain/core, sehingga tabel routing ringkas. Sisakan ruang tumbuh (banyak /24 belum terpakai di tiap /16). Lihat `17/03`, `07/07`.</details>

**J2.** Jelaskan lengkap "apa yang terjadi saat mengetik https://example.com dan menekan Enter".

<details><summary>Jawaban</summary>(1) **DNS**: browser cek cache, lalu query resolver (UDP/53 atau DoH) untuk A/AAAA record → dapat IP. (2) **Routing lokal**: host tentukan tujuan lokal atau via gateway; **ARP** (atau NDP) untuk MAC gateway/tujuan. (3) **TCP handshake** ke port 443 (SYN/SYN-ACK/ACK). (4) **TLS handshake** (1.3): negosiasi cipher, verifikasi sertifikat server (PKI), buat kunci sesi. (5) **HTTP request** (GET) dikirim terenkripsi. (6) Sepanjang jalan, tiap **router** melakukan forwarding (longest prefix match), dekremen TTL, mungkin **NAT** di tepi. (7) Server balas **HTTP response** (HTML); mungkin HTTP/2 atau HTTP/3 (QUIC/UDP). (8) Browser render, ambil aset tambahan, tampilkan. Menguji pemahaman lintas-layer (DNS→ARP→TCP→TLS→HTTP + routing/enkapsulasi). Lihat `01/03`, `18/04`.</details>

**J3.** Sebuah RT-RW-Net ingin: autentikasi pelanggan, paket bandwidth, dan pembagian adil saat sibuk. Teknologi MikroTik apa yang dipakai?

<details><summary>Jawaban</summary>**PPPoE server** (autentikasi per-pelanggan dengan username/password) + **PPP profile dengan rate-limit** per paket (bandwidth ikut paket otomatis saat connect) + **PCQ** (`pcq-rate=0`) untuk membagi bandwidth uplink secara adil saat banyak pelanggan aktif + **queue dengan burst** agar terasa responsif. Ditambah **NAT masquerade** (keluar ke internet), **firewall** (proteksi), dan **RADIUS** bila skala besar (billing). Lihat `19/04`, `19/06`, `18/05`.</details>

---

## Tips Mengerjakan Ujian

```
1. Baca soal HATI-HATI — kata kunci ("MOST likely", "BEST", "EXCEPT").
2. Eliminasi jawaban yang jelas salah dulu.
3. Subnetting: hitung cepat pakai metode blok (referensi/tabel-subnetting.md).
4. Simulasi (CCNA): verifikasi dengan show commands; jangan lupa copy run start.
5. Kelola waktu — jangan terjebak satu soal; tandai & kembali.
6. Untuk "pilih dua/tiga" — pastikan jumlah jawaban benar.
7. Percaya pemahaman konsep, bukan hafalan buta — soal sering diparafrase.
```

---

**Lihat juga:** latihan di setiap modul, `18-karier-sertifikasi/02-03` (peta CCNA & Network+), `lab/*` (praktik)

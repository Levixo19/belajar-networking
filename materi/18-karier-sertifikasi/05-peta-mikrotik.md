# 18.5 — Jalur Sertifikasi MikroTik (MTCNA & Lanjutan)

> **Prasyarat:** `19-mikrotik/01` (pengenalan RouterOS) membantu
> **Tujuan:** Anda paham jalur sertifikasi MikroTik, isi MTCNA, dan bagaimana kurikulum ini mempersiapkannya — relevan khusus untuk pasar ISP/RT-RW-Net Indonesia.

---

## 1. Kenapa MikroTik Penting di Indonesia

MikroTik (RouterOS) sangat dominan di segmen tertentu di Indonesia:
- **ISP kecil-menengah & RT-RW-Net** — perangkat murah, fitur lengkap (routing, firewall, hotspot, PPPoE, bandwidth management).
- **Warnet, kafe, hotel** — hotspot & voucher.
- **UKM & kampus** — router/firewall terjangkau.

```
Kekuatan MikroTik untuk pasar ini:
  ✅ Murah (perangkat & lisensi) dibanding Cisco
  ✅ Fitur ISP lengkap dalam satu kotak (PPPoE server, hotspot, queue, BGP)
  ✅ RouterOS jalan di hardware murah & VM (CHR)
  ✅ Komunitas & materi lokal (Indonesia) melimpah
```

💡 **Untuk karier di ISP/RT-RW-Net Indonesia, MTCNA + skill MikroTik praktis sering lebih dicari daripada CCNA saja.** Idealnya kombinasikan keduanya (`18.1`): CCNA untuk fondasi konsep yang diakui luas, MTCNA untuk keterampilan pada perangkat yang benar-benar dipakai di lapangan.

---

## 2. Jalur Sertifikasi MikroTik

```
MTCNA (Network Associate) ★ : WAJIB, pintu masuk semua sertifikasi lain
   │
   ├── MTCRE    (Routing Engineer)             : routing statis lanjutan, OSPF, tunnel
   ├── MTCWE    (Wireless Engineer)            : wireless MikroTik
   ├── MTCEWE   (Enterprise Wireless Engineer) : wireless enterprise, CAPsMAN, RF, roaming
   ├── MTCSWE   (Switching Engineer)           : switching CRS/SwOS, VLAN/QinQ, MSTP, L2 security
   ├── MTCTCE   (Traffic Control)              : firewall, QoS, web proxy
   ├── MTCUME   (User Management)              : hotspot, RADIUS, PPP
   ├── MTCSE    (Security Engineer)            : keamanan
   ├── MTCIPv6E (IPv6 Engineer)                : IPv6
   └── MTCINE   (Inter-networking) ★★          : BGP, MPLS (level tertinggi, untuk ISP)
```

- **MTCNA** adalah **prasyarat** untuk semua sertifikasi lain — mulai dari sini.
- Sertifikasi engineer (MTCRE, MTCWE, dll.) adalah **spesialisasi** yang bisa diambil sesuai kebutuhan.
- **MTCINE** (BGP/MPLS) adalah puncak jalur ISP/backbone. Konfigurasi MPLS di RouterOS (LDP, VPLS, VRF/L3VPN, RSVP-TE) dibahas di `19-mikrotik/09-mpls-routeros`, dengan konsep multi-vendornya di Tahap 22 (`22-service-provider/01-mpls-ldp` dan seterusnya).

⚠️ **Outline resmi lebih tua dari RouterOS v7.** Outline pelatihan yang ditautkan di halaman resmi MikroTik bertanggal 2011 sampai 2020 (misalnya MTCRE terakhir disunting 2015, MTCTCE dan MTCUME 2011, MTCSWE dan MTCEWE 2020), jadi semuanya ditulis sebelum RouterOS v7. Sintaks v7 untuk OSPF, BGP, routing table, dan wifi berbeda dari materi lama. Sebelum mendaftar, periksa outline dan jadwal terbaru di [mikrotik.com/training](https://mikrotik.com/training/about) dan tanyakan ke trainer versi RouterOS yang dipakai di kelas.

**Seberapa jauh kurikulum ini menyiapkan jalur lanjutan?** Jujur saja, baru MTCNA yang tercakup penuh. Jalur di atasnya baru didukung sebagian:

| Sertifikasi | Status di kurikulum ini | Yang sudah ada | Yang belum |
|---|---|---|---|
| MTCRE | Sebagian besar | Static routing, ECMP (`07/01`, `19/01`); routing v7 lengkap: OSPF, BGP, VRF, policy routing (`19/08`); tunnel (`11/02`, `19/06`) | Topik outline lama yang tidak relevan lagi di v7 |
| MTCWE / MTCEWE | Parsial | Konsep wireless (`10/*`), wireless MikroTik (`19/05`) | Virtual-AP, mesh HWMP, CAPsMAN dan paket `wifi` v7 secara mendalam |
| MTCSWE | Sebagian besar | Bridge dan VLAN filtering (`19/02`); CRS3xx/5xx, L3HW, MSTP, LACP, IGMP snooping, port isolation, SwOS (`19/11`) | Fitur switch-chip yang butuh perangkat CRS fisik untuk dipraktikkan |
| MTCTCE | Sebagian besar | Firewall/NAT, packet flow v7 dan tabel RAW (`19/03`); queue, HTB, queue type v7, PCQ (`19/04`) | Web proxy |
| MTCUME | Sebagian besar | PPP (`19/06`); RADIUS, User Manager v7, CoA, voucher, FreeRADIUS (`19/10`) | MLPPP/BCP |
| MTCSE | Parsial | Serangan dan mitigasi umum (`09/03`, `12/*`); port knocking dan sertifikat di RouterOS (`19/03`) | Modul keamanan RouterOS khusus |
| MTCIPv6E | Sebagian besar | IPv6 dengan bagian MikroTik (`08/01-03`) | Tunnel IPIPv6/EoIPv6/GRE6 |
| MTCINE | Sebagian besar | BGP v7 (`19/08`, `07/06`); MPLS, LDP, L3VPN, VPLS, RSVP-TE di RouterOS (`19/09`); konsep SP multi-vendor (`22/*`) | BGP labeled unicast (belum didukung RouterOS) |

Modul lanjutan Tahap 19 kini mencakup routing v7 (`19/08`, MTCRE), MPLS di RouterOS (`19/09`, MTCINE), User Manager dan RADIUS (`19/10`, MTCUME), dan switching CRS (`19/11`, MTCSWE). Untuk wireless enterprise dan IPv6 lanjutan, gunakan dokumentasi resmi help.mikrotik.com dan training resmi.

**Format ujian:** ujian online, diikuti setelah mengikuti training resmi (dari MikroTik Certified Trainer). MTCNA umumnya 25 soal, passing ~60% (50%+ memberi kesempatan ujian ulang sekali).

---

## 3. Isi MTCNA & Pemetaan ke Kurikulum

Silabus MTCNA (garis besar) dan modul kurikulum ini yang menyiapkannya:

| Topik MTCNA | Modul kurikulum |
|---|---|
| **Introduction to RouterOS** (akses: Winbox/WebFig/CLI/API, upgrade, backup, user) | `19-mikrotik/01` |
| **DHCP** (server, client, relay) | `06/02` + bagian MikroTik-nya |
| **Bridging** (konsep, bridge, filter) | `03-data-link/02`, `19-mikrotik/02` |
| **Routing** (static route, konsep dasar) | `04/05`, `07/01`, + MikroTik `07/01` |
| **Wireless** (konsep, konfigurasi, security, MAC filter) | `10-wireless/01-03`, `19-mikrotik/05` |
| **Firewall** (filter, NAT, connection tracking, address-list) | `09/01-03`, `12/*`, `19-mikrotik/03` |
| **QoS** (simple queue, queue tree, burst) | `11-wan-vpn/03`, `19-mikrotik/04` |
| **Network Management** (tools, ARP, DNS, NTP, monitoring) | `06/*`, `14/02`, `19-mikrotik/07` |
| **Tunnels** (PPPoE, PPTP, dasar) | `11/02`, `19-mikrotik/06` |

💡 **Kurikulum ini mengajarkan setiap konsep MTCNA secara mendalam** (bukan hanya "cara klik di Winbox"), lalu **Tahap 19** memberi implementasi RouterOS spesifik. Anda akan memahami **kenapa**, bukan hanya **bagaimana** — keunggulan besar dibanding belajar MikroTik dari tutorial klik-klik saja.

---

## 4. Skenario Praktik Khas Indonesia (RT-RW-Net)

Proyek portofolio yang relevan dengan pasar lokal (bangun di CHR/hardware murah):

```
1. PPPoE SERVER untuk pelanggan
   - Autentikasi per-pelanggan, profil bandwidth per-paket
   - Integrasi RADIUS untuk manajemen pelanggan skala besar

2. HOTSPOT dengan voucher
   - Portal login, voucher waktu/kuota, trial
   - Untuk warnet/kafe/wifi RT

3. BANDWIDTH MANAGEMENT
   - Simple queue per-pelanggan (paket 5Mbps, 10Mbps)
   - Queue tree + PCQ untuk pembagian adil
   - Burst untuk pengalaman "cepat" saat browsing

4. FIREWALL & KEAMANAN
   - NAT (masquerade) untuk pelanggan ke internet
   - Filter melindungi router & pelanggan
   - Address-list untuk blokir/izinkan

5. FAILOVER / LOAD BALANCE dua ISP
   - Backup otomatis bila satu ISP putus
   - PCC untuk membagi beban ke dua uplink

6. MONITORING & MANAJEMEN
   - The Dude, SNMP, netwatch
   - Backup terjadwal + scripting
```

⚠️ **Kepatuhan hukum**: penyelenggara jasa internet (termasuk RT-RW-Net komersial) di Indonesia idealnya memperhatikan regulasi — RT-RW-Net yang menjual ulang bandwidth secara komersial secara ketat perlu bermitra dengan ISP berizin/berlisensi (aturan Komdigi/Kominfo). Detail lisensi ada di ranah regulasi, tetapi penting disadari saat membangun bisnis, bukan sekadar teknis.

---

## 5. Detail MikroTik di Kurikulum Ini

Ingat bahwa **MikroTik terintegrasi di seluruh kurikulum**, bukan hanya Tahap 19:
- Hampir setiap modul teknis punya bagian **"MikroTik RouterOS"** dengan perintah `/ip ...` dan **tabel padanan istilah** (Cisco ↔ MikroTik ↔ Linux).
- **Tahap 19** adalah jalur khusus mendalam: RouterOS, bridge/VLAN, firewall/NAT, QoS/queue/hotspot, wireless, VPN/tunnel, monitoring/scripting.
- **`referensi/cheatsheet-mikrotik.md`** dan **`referensi/padanan-cisco-mikrotik-linux.md`** untuk rujukan cepat.

💡 Pendekatan **tiga platform** (Cisco IOS + MikroTik RouterOS + Linux) di kurikulum ini membuat Anda memahami **konsep universal** yang berlaku di semua vendor — sehingga MTCNA, CCNA, dan bahkan Linux networking saling memperkuat, bukan dipelajari terpisah.

---

## 6. Ringkasan

- **MikroTik dominan** di ISP kecil-menengah, RT-RW-Net, warnet/hotel di Indonesia (murah, fitur ISP lengkap).
- Jalur: **MTCNA** (wajib, pintu masuk) → spesialisasi (MTCRE routing, MTCWE/MTCEWE wireless, MTCSWE switching, MTCTCE traffic, MTCUME user, dll.) → **MTCINE** (BGP/MPLS, puncak ISP).
- Kurikulum ini menyiapkan MTCNA secara penuh dan sebagian besar jalur lanjutan (MTCRE, MTCINE, MTCUME, MTCSWE, MTCTCE lewat `19/03` sampai `19/11`). Outline resmi lebih tua dari RouterOS v7, jadi cek mikrotik.com/training sebelum ujian.
- **MTCNA** mencakup: RouterOS, DHCP, bridging, routing, wireless, firewall, QoS, network management, tunnels — semua **dipetakan ke modul kurikulum ini**.
- Kurikulum mengajarkan **kenapa** (konsep mendalam), Tahap 19 memberi **bagaimana** (RouterOS) — lebih kuat dari tutorial klik-klik.
- Skenario lokal: **PPPoE server, hotspot voucher, bandwidth management (queue/PCQ/burst), firewall/NAT, failover 2 ISP, monitoring**.
- MikroTik **terintegrasi di seluruh kurikulum** (bagian MikroTik + tabel padanan) plus **Tahap 19** khusus dan cheatsheet.
- Untuk karier ISP Indonesia: **MTCNA + CCNA** = kombinasi kuat (keterampilan alat + fondasi konsep).
- ⚠️ Perhatikan **regulasi** saat membangun RT-RW-Net komersial.

---

## 7. Latihan

1. Kenapa MikroTik sangat populer di segmen ISP kecil/RT-RW-Net Indonesia?
2. Apa peran MTCNA dalam jalur sertifikasi MikroTik?
3. Sebutkan lima topik MTCNA dan di modul kurikulum mana masing-masing dipelajari.
4. Rancang daftar fitur MikroTik yang dibutuhkan untuk sebuah RT-RW-Net kecil dengan 50 pelanggan.
5. Kenapa memahami "kenapa" (konsep) lebih baik daripada hanya "bagaimana" (klik Winbox) untuk MikroTik?

<details>
<summary>Jawaban</summary>

1. Karena MikroTik menawarkan **kombinasi harga murah dan fitur ISP yang lengkap** yang sangat cocok untuk segmen dengan anggaran terbatas: perangkat dan lisensinya jauh lebih murah daripada Cisco/Juniper, namun RouterOS menyediakan hampir semua yang dibutuhkan operator kecil dalam satu perangkat — routing (termasuk BGP/OSPF), firewall/NAT, **PPPoE server** (untuk autentikasi pelanggan), **hotspot** (login voucher untuk warnet/wifi publik), **bandwidth management** (queue), dan VPN. RouterOS juga berjalan di hardware murah maupun sebagai VM gratis (**CHR**), sehingga mudah dipelajari dan di-deploy. Ditambah **komunitas dan materi berbahasa Indonesia yang melimpah**, MikroTik menjadi pilihan de-facto untuk ISP kecil-menengah, RT-RW-Net, warnet, kafe, dan hotel di Indonesia. Untuk operator yang perlu menjalankan layanan internet komersial dengan modal terbatas, MikroTik memberi rasio fitur-terhadap-biaya yang sulit ditandingi.

2. **MTCNA (MikroTik Certified Network Associate)** adalah sertifikasi **fondasi dan prasyarat wajib** — ia menjadi **pintu masuk untuk semua sertifikasi MikroTik lain**. Anda tidak bisa mengambil sertifikasi engineer yang lebih lanjut (MTCRE, MTCWE, MTCEWE, MTCSWE, MTCTCE, MTCUME, MTCINE, dll.) tanpa terlebih dahulu lulus MTCNA. MTCNA memvalidasi kemampuan dasar mengelola RouterOS: akses/manajemen, DHCP, bridging, routing dasar, wireless dasar, firewall/NAT dasar, QoS dasar, dan tunnel dasar. Setelah MTCNA, seseorang memilih **spesialisasi** sesuai kebutuhan (routing, wireless, switching, traffic control, user management, keamanan, IPv6), dengan **MTCINE** (BGP/MPLS) sebagai puncak untuk engineer ISP/backbone.

3. (Lima dari) **Introduction to RouterOS** (akses, backup, user) → `19-mikrotik/01`; **DHCP** (server/client/relay) → `06-aplikasi/02` + bagian MikroTik; **Bridging** → `03-data-link/02` dan `19-mikrotik/02`; **Routing** (static, konsep) → `04-network-layer/05`, `07-routing-lanjutan/01` + MikroTik; **Firewall** (filter, NAT, connection tracking, address-list) → `09-nat-acl-firewall/01-03`, `12-keamanan/*`, dan `19-mikrotik/03`; **QoS** (simple queue, queue tree, burst) → `11-wan-vpn/03` dan `19-mikrotik/04`; **Wireless** → `10-wireless/01-03` dan `19-mikrotik/05`; **Tunnels** (PPPoE/PPTP) → `11-wan-vpn/02` dan `19-mikrotik/06`; **Network Management** (tools, DNS, NTP, monitoring) → `06/*`, `14-monitoring-troubleshooting/02`, dan `19-mikrotik/07`.

4. (Contoh) Untuk RT-RW-Net ~50 pelanggan, fitur MikroTik yang dibutuhkan: **(1) PPPoE server** untuk autentikasi tiap pelanggan (username/password per rumah) dengan **profil bandwidth per-paket** (mis. paket 5 Mbps, 10 Mbps); alternatif/pelengkap: **hotspot** bila memakai model voucher. **(2) Bandwidth management** — **simple queue** per-pelanggan atau **queue tree + PCQ** untuk pembagian adil, dengan **burst** agar browsing terasa responsif. **(3) NAT (masquerade)** agar pelanggan (IP privat) bisa keluar ke internet lewat IP publik dari ISP upstream. **(4) Firewall filter** untuk melindungi router dan pelanggan (blokir akses tidak sah ke router, filter dasar), plus **address-list** untuk blokir/izinkan tertentu. **(5) DHCP server** (bila tidak PPPoE) atau pengalamatan via PPPoE. **(6) DNS** (cache lokal untuk mempercepat & mengurangi beban upstream) dan **NTP**. **(7) Failover dua ISP** (opsional tetapi disarankan) dengan backup route/recursive gateway atau **PCC load balancing** bila punya dua uplink. **(8) Monitoring** — netwatch, SNMP/The Dude, dan **backup terjadwal via scripting**. **(9) Manajemen pelanggan** — untuk 50 pelanggan bisa lokal (secret PPP), atau **RADIUS** bila ingin sistem billing terintegrasi. ⚠️ Perhatikan aspek **legalitas/lisensi** menjual ulang bandwidth (kemitraan dengan ISP berizin).

5. Karena memahami **konsep ("kenapa")** membuat pengetahuan Anda **transferable, adaptif, dan tahan terhadap masalah baru**, sedangkan hanya menghafal **prosedur ("bagaimana klik di Winbox")** membuat Anda rapuh. Contoh: jika Anda hanya hafal "klik di sini untuk buat queue" tanpa memahami cara kerja QoS (bagaimana antrean, PCQ, dan burst benar-benar membagi bandwidth), maka saat pembagian bandwidth tidak adil atau ada bottleneck, Anda tidak tahu **kenapa** atau **bagaimana memperbaikinya** — Anda hanya bisa mengulang langkah yang sama. Jika Anda paham konsepnya, Anda bisa **mendiagnosis** ("PCQ rate saya salah karena...", "queue parent tidak membatasi karena..."), **mengadaptasi** ke skenario yang berbeda dari tutorial, dan **memindahkan** pemahaman itu ke vendor lain (Cisco, Linux tc) karena konsep QoS universal. Selain itu, ujian MTCNA (dan wawancara kerja) menguji pemahaman, bukan hafalan klik. Karena itu kurikulum ini mengajarkan konsep mendalam lebih dulu (Tahap 1-17) lalu implementasi RouterOS (Tahap 19) — sehingga Anda menguasai **kenapa dan bagaimana** sekaligus.

</details>

---

## 8. Sumber

- MikroTik Training & Certification — https://mikrotik.com/training/certificates
- Halaman pelatihan dan outline resmi MikroTik (termasuk MTCSWE dan MTCEWE): https://mikrotik.com/training/about
- MikroTik documentation (help.mikrotik.com) & RouterOS manual
- `19-mikrotik/*` (jalur MikroTik kurikulum ini) · `referensi/cheatsheet-mikrotik.md`
- Regulasi: Komdigi/Kominfo (penyelenggaraan jasa telekomunikasi/internet)

---

**Berikutnya:** `19-mikrotik/02-bridge-vlan-switching.md` — melanjutkan jalur khusus MikroTik.

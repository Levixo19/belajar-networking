# 23.2 Cisco SD-Access dan Catalyst SD-WAN

> **Prasyarat:** `23-jalur-vendor/01-junos`, `16-datacenter-cloud-sdn/02-overlay-vxlan-evpn`, `16-datacenter-cloud-sdn/06-sdn`, `07-routing-lanjutan/10-isis`, `11-wan-vpn/01-teknologi-wan`
> **Tujuan:** Anda bisa menjelaskan arsitektur Cisco SD-Access (underlay IS-IS, overlay LISP dan VXLAN, SGT/TrustSec, peran control plane, border, dan edge node, serta Catalyst Center) dan Cisco Catalyst SD-WAN (Manager, Controller, Validator, WAN Edge, OMP, TLOC, kebijakan aplikasi), menyebut nama produk yang berlaku sekarang beserta nama lamanya, dan membedakan kapan keduanya dipakai.

---

## 1. Pengantar: Label Pendalaman

> [!WARNING]
> **Label pendalaman.** Modul ini spesialisasi vendor Cisco di atas CCNA. Topik ini **tidak diuji** di CCNA (yang hanya menyinggung konsep controller-based dan SD-WAN secara umum), Network+, maupun MTCNA. Ia relevan bila Anda menuju CCNP Enterprise (ENCOR, ENSDWI, ENAUTO), atau bekerja di perusahaan yang membeli solusi kampus dan WAN Cisco.

Dua produk dibahas karena menjawab dua masalah berbeda dengan ide yang mirip: **pisahkan kebijakan dari topologi fisik, dan kelola dari satu pusat**.

| | SD-Access | Catalyst SD-WAN |
|---|---|---|
| Wilayah | Jaringan **kampus** dan cabang berswitch (LAN) | **WAN** antar-lokasi lewat internet, MPLS, 4G/5G |
| Masalah | Segmentasi pengguna dan IoT, mobilitas, kebijakan konsisten | Biaya MPLS, jalur banyak, kebijakan aplikasi, onboarding cabang |
| Overlay | LISP (control) dan VXLAN (data) | OMP (control) dan IPsec (data) |
| Pusat manajemen | Catalyst Center + ISE | SD-WAN Manager |
| Yang dipisahkan | Identitas endpoint dan lokasi | Transport dan kebijakan layanan |

### Nama produk: ini sudah berganti beberapa kali

Cisco mengubah nama merek beberapa kali, dan materi lama memakai nama yang berbeda. Tabel ini merangkum versi yang berlaku saat modul ini ditulis, berdasarkan dokumentasi Cisco.

| Nama sekarang | Nama lama | Catatan |
|---|---|---|
| **Cisco Catalyst Center** | Cisco DNA Center | Pengelola SD-Access dan automation/assurance kampus |
| **Cisco Catalyst SD-WAN** | Cisco SD-WAN, Viptela SD-WAN | Viptela diakuisisi Cisco pada 2017 |
| **Catalyst SD-WAN Manager** | vManage | Penggantian nama mulai rilis IOS XE SD-WAN 17.12.1a dan Catalyst SD-WAN 20.12.1 |
| **Catalyst SD-WAN Controller** | vSmart | Idem |
| **Catalyst SD-WAN Validator** | vBond | Idem |
| **Catalyst SD-WAN Analytics** | vAnalytics | Idem |
| **Identity Services Engine (ISE)** | (tidak berubah) | Mesin kebijakan identitas dan SGT |

> [!TIP]
> Dokumentasi Cisco sendiri mencatat bahwa nama lama masih muncul di bagian API dan CLI. Jadi di konfigurasi nyata Anda masih akan melihat `vmanage`, `vsmart`, `vbond`, dan `vmanage-admin`. Hafalkan keduanya.

---

## 2. Analogi

**SD-Access** mirip sistem **kartu identitas elektronik di kompleks perkantoran**. Dulu aturan akses ditulis di tiap pintu berdasarkan nomor lantai (VLAN dan ACL per IP). Sekarang kartu setiap orang berisi **golongan** (SGT: karyawan, tamu, kontraktor), dan setiap pintu cukup mengecek golongan itu. Orang boleh pindah lantai tanpa mengganti aturan. Ada **buku tamu pusat** (control plane node) yang mencatat siapa sedang berada di pintu mana.

**Catalyst SD-WAN** mirip **dispatcher ekspedisi** yang punya banyak jalur (jalan tol, jalan raya, kereta) dan memilih jalur menurut jenis paket: dokumen penting lewat jalur tercepat, paket besar lewat jalur termurah. Dispatcher tidak mengangkut barang; ia hanya memberi tahu semua kantor cabang aturan dan jalurnya.

---

## 3. SD-Access: Gambaran Fabric

SD-Access membangun **fabric**: jaringan kampus di mana perangkat (switch Catalyst 9000, WLC, access point) membentuk satu overlay. Empat lapis ide:

1. **Underlay**: jaringan L3 routed-access biasa dengan link point-to-point. Cisco merekomendasikan **IS-IS** (dikonfigurasi otomatis oleh *LAN Automation* di Catalyst Center), BFD untuk deteksi cepat, dan **MTU 9100** karena VXLAN menambah header sekitar 50 byte.
2. **Overlay control plane**: **LISP** (Locator/ID Separation Protocol). Alamat endpoint (EID) dipisah dari lokasi (RLOC, alamat loopback edge node). Pemetaan EID ke RLOC disimpan di control plane node, bukan disebar lewat IGP.
3. **Overlay data plane**: **VXLAN** (MAC-in-IP). Header VXLAN yang dipakai SD-Access juga membawa **SGT**.
4. **Policy plane**: **Cisco TrustSec (CTS)**. ISE memberi **Scalable Group Tag (SGT)** 16-bit pada endpoint, dan aturan "golongan A boleh ke golongan B" ditegakkan di switch, tidak tergantung alamat IP.

### Peran perangkat

| Peran | Fungsi |
|---|---|
| **Edge node** | Menghubungkan endpoint (kabel dan wireless). Menjalankan **anycast gateway** (gateway default yang sama di semua edge), meng-*encapsulate* trafik ke VXLAN, dan **mendaftarkan** endpoint ke control plane node |
| **Control plane node** | Menyimpan basis data pelacakan host (*host tracking database*) berisi pemetaan EID ke RLOC. Bekerja sebagai LISP map-server/map-resolver |
| **Border node** | Gerbang antara fabric dan dunia luar (internet, WAN, data center, jaringan lama). Terdapat mode internal, external, atau gabungan (anywhere) |
| **Intermediate node** | Switch underlay murni yang hanya meneruskan IP, tidak ikut enkapsulasi fabric |
| **Fabric WLC / AP** | Mengintegrasikan wireless: AP dalam fabric mengirim trafik klien ke edge node lewat VXLAN |
| **Fabric in a Box** | Semua peran di satu perangkat, untuk cabang kecil |

### Virtual Network dan segmentasi dua tingkat

- **Virtual Network (VN)** = VRF. Satu VN dipetakan ke satu VNI di VXLAN. VN memisahkan secara **makro**: pegawai, tamu, IoT, CCTV tidak saling bertukar rute kecuali lewat border dan firewall.
- **SGT** memisahkan secara **mikro** di dalam satu VN: dua pegawai di VN yang sama bisa punya golongan berbeda dengan aturan akses berbeda.

---

## 4. Alur Paket di SD-Access

Skenario: Laptop A (di edge E1) menghubungi Server B (di edge E2) dalam VN yang sama.

1. A mengirim paket ke gateway anycast di E1. E1 telah **mendaftarkan** A ke control plane node (CP) saat A muncul (DHCP/ARP).
2. E1 bertanya ke CP: "EID milik B di RLOC mana?" Jawaban: RLOC E2.
3. E1 membungkus paket A dalam **VXLAN** menuju RLOC E2, dengan **VNI** milik VN itu dan **SGT** milik A pada header.
4. Underlay IS-IS meneruskan paket IP biasa dari E1 ke E2.
5. E2 membuka VXLAN, memeriksa matriks kebijakan (SGT sumber ke SGT tujuan), lalu mengirim ke B atau membuangnya.

Hal ini berbeda dari VLAN tradisional: tidak ada STP di fabric, tidak ada VLAN yang direntangkan lintas switch di underlay, dan endpoint yang berpindah cukup **mendaftar ulang** ke CP. Versi baru memakai **LISP Pub/Sub**: control plane node "menerbitkan" pembaruan kepada pelanggan (edge dan border), sehingga tidak bergantung pada BGP untuk pertukaran informasi dan konvergensinya lebih cepat.

> [!TIP]
> Instruktur sering memakai satu kalimat ringkasan: *LISP menjawab "di mana", VXLAN menjawab "bagaimana membawanya", SGT menjawab "boleh atau tidak".*

---

## 5. Catalyst Center dan ISE

Catalyst Center adalah pusat kendali SD-Access. Alurnya mengikuti empat tahap:

| Tahap | Isi |
|---|---|
| **Design** | Hierarki lokasi (area, gedung, lantai), pool IP, server (AAA, DHCP, DNS), profil wireless |
| **Policy** | VN, SGT, kontrak, matriks kebijakan (berintegrasi dengan ISE lewat pxGrid) |
| **Provision** | Menyiapkan fabric: menetapkan peran edge, border, control plane, dan mendorong konfigurasi ke perangkat |
| **Assurance** | Telemetri, kesehatan klien dan perangkat, analisis akar masalah |

Catalyst Center memiliki **API** (Intent API) untuk semua fungsi ini, dibahas di modul 23.3. **ISE** menyediakan autentikasi 802.1X/MAB dan penetapan SGT dinamis. Jaringan lama bisa dihubungkan lewat border node, lalu bermigrasi bertahap (model *brownfield*).

> [!WARNING]
> SD-Access bukan hanya "konfigurasi otomatis". Ia membawa **ketergantungan lisensi**, kebutuhan perangkat keras tertentu (Catalyst 9000), dan ISE yang sehat. Kegagalan ISE atau Catalyst Center memengaruhi onboarding endpoint baru, walau trafik endpoint yang sudah terhubung tetap berjalan.

---

## 6. Catalyst SD-WAN: Arsitektur

Catalyst SD-WAN memisahkan **bidang manajemen, kontrol, orkestrasi, dan data** sehingga tiap cabang bisa bergabung ke jaringan overlay tanpa konfigurasi manual per-tunnel.

| Komponen | Nama lama | Peran |
|---|---|---|
| **SD-WAN Manager** | vManage | Konsol manajemen terpusat: templat, kebijakan, pemantauan, API. Terhubung ke perangkat lewat DTLS/TLS |
| **SD-WAN Controller** | vSmart | "Otak" kontrol: menjaga koneksi kontrol permanen ke setiap WAN Edge, menjalankan **OMP**, memantulkan rute, dan menerapkan kebijakan terpusat |
| **SD-WAN Validator** | vBond | Orkestrator awal: memverifikasi identitas perangkat baru, memberi tahu alamat Controller dan Manager, serta membantu **NAT traversal** |
| **WAN Edge** | vEdge, cEdge | Router di tiap lokasi (perangkat keras atau virtual). Membangun tunnel data IPsec |
| **Analytics** | vAnalytics | Analitik performa jangka panjang |

### Control plane: OMP dan TLOC

- **OMP (Overlay Management Protocol)** adalah protokol mirip BGP yang berjalan di dalam koneksi kontrol terenkripsi (DTLS atau TLS) antara WAN Edge dan Controller. WAN Edge **tidak** saling bertukar rute secara langsung; mereka berbicara ke Controller, dan Controller memantulkan rute ke yang lain (mirip route reflector).
- Tiga jenis informasi di OMP: **rute prefix** (jaringan di belakang edge), **TLOC route**, dan **service route**.
- **TLOC (Transport Locator)** adalah titik koneksi sebuah edge ke WAN. Pasangan identitas terdiri dari **alamat sistem**, **color** (label jenis transport: `mpls`, `biz-internet`, `lte`, dan lain-lain), dan **jenis enkapsulasi** (IPsec atau GRE). Satu edge dengan dua transport punya dua TLOC.
- **VPN (VRF) bernomor** memisahkan trafik: VPN 0 adalah transport (sisi WAN), VPN 512 untuk manajemen, VPN lain (1, 2, ...) untuk segmen layanan LAN.

### Data plane

Controller membagikan **kunci enkripsi** simetris ke edge, dan edge membentuk tunnel **IPsec** antar-sesamanya secara otomatis, tanpa IKE manual per pasangan. **BFD** berjalan di setiap tunnel untuk mengukur *loss*, *latency*, dan *jitter*, sekaligus mendeteksi kegagalan.

### Alur onboarding perangkat (ringkas)

1. WAN Edge baru menyala, mendapat IP (DHCP atau statis), lalu menghubungi **Validator**.
2. Validator memeriksa sertifikat dan daftar perangkat sah, lalu memberi tahu alamat Controller dan Manager.
3. Edge membangun koneksi kontrol ke **Controller** (dan **Manager**). Setelah itu OMP mulai.
4. Controller mendistribusikan rute, kebijakan, dan kunci. Edge membentuk tunnel IPsec ke edge lain.

---

## 7. Kebijakan Aplikasi

Kebijakan di Catalyst SD-WAN terbagi dua:

- **Kebijakan terpusat** (centralized): dikonfigurasi di Manager dan dijalankan di **Controller**. Termasuk *control policy* (memengaruhi rute OMP: topologi hub-and-spoke, partial mesh, service chaining) dan *data policy* serta *application-aware routing policy* (memengaruhi pemilihan jalur data).
- **Kebijakan lokal** (localized): berlaku di perangkat WAN Edge, seperti QoS, ACL, dan kebijakan routing lokal.

**Application-aware routing** bekerja begini: Anda menetapkan **SLA class** (misalnya loss maksimum, latency maksimum, jitter maksimum) untuk kelas aplikasi. BFD pada tiap tunnel mengukur kondisi nyata. Bila jalur MPLS memenuhi SLA suara tetapi internet tidak, trafik suara memakai MPLS; bila MPLS rusak, trafik pindah ke internet. Pengenalan aplikasi memanfaatkan DPI dan SD-AVC.

Contoh kebijakan bisnis yang diterjemahkan:

| Kebutuhan | Cara di SD-WAN |
|---|---|
| Zoom/Teams harus lewat jalur dengan latency terendah | App-route policy dengan SLA latency, preferred color |
| Trafik unduhan OS tidak boleh memakai MPLS mahal | Data policy: kelas itu hanya `biz-internet` |
| Semua cabang keluar internet lokal, bukan lewat pusat | Direct Internet Access (DIA) |
| Cabang A tidak boleh bertemu cabang B | Control policy topologi hub-and-spoke |

---

## 8. Membandingkan dan Memilih

| Aspek | Jaringan tradisional | SD-Access / Catalyst SD-WAN |
|---|---|---|
| Konfigurasi | Per perangkat (CLI) | Templat dan intent dari pusat |
| Segmentasi | VLAN + ACL berbasis IP | VN + SGT / VPN + kebijakan pusat |
| Pemilihan jalur WAN | Routing dan PBR statis | Berbasis SLA aplikasi |
| Risiko | Salah konfigurasi tersebar | Titik kendali pusat harus tangguh |
| Analogi di dunia open source | OSPF/BGP + ACL manual | VXLAN-EVPN, WireGuard mesh dengan controller |
| Alternatif vendor | - | Juniper Mist, Aruba ESP, Fortinet Secure SD-WAN, Meraki SD-WAN |

Pertimbangan penting: kedua solusi menukar kerumitan per perangkat dengan **ketergantungan pada pengendali**. Pahami apa yang terjadi bila pusat kontrol mati: di SD-WAN, tunnel yang ada tetap berjalan sampai kunci dan pembaruan perlu diperbarui; di SD-Access, endpoint yang sudah terdaftar tetap berfungsi tetapi onboarding baru terganggu. Selalu baca dokumen desain resmi untuk perilaku persisnya per versi.

---

## 9. Kesalahan Umum

> [!CAUTION]
> Menyamakan SD-WAN Cisco dengan "VPN biasa". Perbedaannya ada pada **controller**, OMP, dan kebijakan aplikasi.

> [!CAUTION]
> Memakai nama lama dan baru bergantian tanpa kesepakatan, sehingga tim bingung antara vManage dan Manager.

> [!CAUTION]
> MTU underlay SD-Access tidak dinaikkan. Overhead VXLAN sekitar 50 byte membuat paket penuh terpecah atau terbuang. Cisco menyarankan 9100.

> [!CAUTION]
> Menganggap SGT menggantikan VN. VN memisahkan tabel routing, SGT memisahkan golongan di dalam satu VN.

> [!CAUTION]
> Mengabaikan sertifikat dan jam (NTP) di SD-WAN. Perangkat gagal bergabung bila waktu atau sertifikat salah.

> [!TIP]
> Dokumentasikan nama color, nomor VPN, dan pemetaan VN ke VRF sebelum membangun.

---

## 10. Ringkasan

- **SD-Access** = fabric kampus: underlay IS-IS (MTU 9100), kontrol **LISP**, data **VXLAN**, kebijakan **SGT/TrustSec** dengan **ISE**.
- Peran: **edge** (anycast gateway, mendaftarkan host), **control plane** (basis data EID ke RLOC), **border** (ke luar fabric), **intermediate** (underlay murni).
- **VN** = segmentasi makro (VRF/VNI), **SGT** = segmentasi mikro.
- **Catalyst Center** (dulu DNA Center) menjalankan Design, Policy, Provision, Assurance.
- **Catalyst SD-WAN**: **Manager** (vManage), **Controller** (vSmart), **Validator** (vBond), **WAN Edge**.
- **OMP** dijalankan via Controller (mirip route reflector); **TLOC** = alamat sistem + color + enkapsulasi; data plane **IPsec** dengan **BFD**.
- **Kebijakan aplikasi**: SLA class berbasis loss/latency/jitter yang diukur BFD, terpusat (Controller) dan lokal (edge).
- Nama lama masih muncul di CLI dan API: hafal pemetaannya.

---

## 11. Latihan

1. Sebutkan tiga lapis teknologi SD-Access (underlay, overlay control, overlay data) beserta protokolnya, dan satu alasan MTU underlay dinaikkan.
2. Apa perbedaan Virtual Network dan SGT di SD-Access? Beri contoh kebutuhan yang cocok untuk masing-masing.
3. Jelaskan peran control plane node saat Laptop A di edge E1 ingin mengirim paket ke Server B di edge E2 dalam VN yang sama.
4. Pasangkan nama baru dengan nama lama: Catalyst SD-WAN Controller, Catalyst SD-WAN Validator, Catalyst SD-WAN Manager, Catalyst Center.
5. Mengapa WAN Edge tidak perlu mengkonfigurasi sesi OMP ke setiap edge lain? Siapa yang memantulkan rute?
6. Sebuah edge memiliki dua koneksi WAN: MPLS dan internet biasa. Berapa TLOC yang dimilikinya, dan atribut apa yang membedakannya?
7. Dua cabang tidak mau membentuk tunnel IPsec padahal koneksi kontrol ke Controller sudah naik. Sebutkan dua area yang Anda periksa, berdasarkan arsitektur di modul ini.
8. Rancang kebijakan: suara (VoIP) harus lewat jalur dengan latency kurang dari 150 ms dan loss kurang dari 1%, dengan fallback internet. Jenis kebijakan apa yang dipakai, di mana ditegakkan, dan bagaimana kondisi jalur diukur?

<details>
<summary>Jawaban</summary>

1. Underlay: L3 routed access dengan **IS-IS** (otomatis via LAN Automation). Overlay control plane: **LISP**. Overlay data plane: **VXLAN**. (Policy plane: TrustSec/SGT.) MTU dinaikkan (Cisco menyarankan 9100) karena VXLAN menambah sekitar 50 byte, jadi frame penuh dari endpoint tidak terpecah.
2. VN = VRF/VNI, memisahkan **tabel routing** secara makro, misalnya VN Pegawai, VN Tamu, VN IoT. SGT = golongan 16-bit dalam satu VN, misalnya "Keuangan" boleh ke server keuangan sedangkan "Magang" tidak, padahal keduanya di VN Pegawai. Kebutuhan makro (tamu tidak boleh melihat jaringan internal) memakai VN; kebutuhan mikro memakai SGT.
3. E1 sudah mendaftarkan A ke control plane node. E1 bertanya ke CP untuk memetakan EID B ke RLOC; CP menjawab RLOC E2. E1 lalu membungkus paket dalam VXLAN (VNI dan SGT A) ke E2 lewat underlay. CP tidak meneruskan trafik data; ia hanya menjawab pertanyaan lokasi.
4. Controller = vSmart. Validator = vBond. Manager = vManage. Catalyst Center = Cisco DNA Center.
5. Karena Controller menjadi pusat OMP: setiap edge hanya membuat sesi ke Controller, dan Controller **memantulkan** rute (seperti route reflector) ke edge lain. Ini mengurangi jumlah sesi menjadi linear.
6. **Dua TLOC**, masing-masing didefinisikan oleh alamat sistem, color, dan enkapsulasi. Yang membedakan adalah **color** (misalnya `mpls` dan `biz-internet`).
7. (a) Konektivitas underlay antar-transport dan **color**: color yang tidak saling terhubung (misalnya restricted) atau NAT yang menghalangi pembentukan tunnel; (b) kunci dan kebijakan dari Controller, serta firewall atau NAT di jalur yang menahan trafik IPsec dan BFD. Periksa juga kebijakan kontrol yang membatasi topologi (hub-and-spoke melarang spoke ke spoke).
8. **Application-aware routing policy** (kebijakan terpusat) dengan SLA class latency 150 ms dan loss 1%, trafik suara dicocokkan lewat daftar aplikasi, jalur utama MPLS dan fallback `biz-internet`. Ditetapkan di Manager, dijalankan di Controller dan didorong ke edge. Kondisi jalur diukur oleh **BFD** di setiap tunnel IPsec.

</details>

---

## 12. Sumber

- Cisco, SD-Access Design Guide (underlay IS-IS, MTU 9100, LISP, VXLAN, SGT, peran node, LISP Pub/Sub): https://www.cisco.com/c/en/us/td/docs/solutions/CVD/Campus/cisco-sda-design-guide.html
- Cisco, Software-Defined Access (ringkasan solusi): https://www.cisco.com/c/en/us/solutions/enterprise-networks/software-defined-access/index.html
- Cisco, Catalyst SD-WAN Getting Started Guide, System Overview (Manager, Controller, Validator, WAN Edge, OMP, TLOC): https://www.cisco.com/c/en/us/td/docs/routers/sdwan/configuration/sdwan-xe-gs-book/system-overview.html
- Cisco, Catalyst SD-WAN Read Me First (penggantian nama komponen mulai 17.12.1a dan 20.12.1): https://www.cisco.com/c/ja_jp/td/docs/routers/sdwan/configuration/sdwan-xe-gs-book/read-me-first.html
- Cisco DevNet, Catalyst Center: https://developer.cisco.com/docs/catalyst-center/
- RFC 9300, The Locator/ID Separation Protocol (LISP): https://www.rfc-editor.org/rfc/rfc9300
- RFC 7348, Virtual eXtensible Local Area Network (VXLAN): https://www.rfc-editor.org/rfc/rfc7348

---

**Berikutnya:** `23-jalur-vendor/03-api-platform-cisco`. Platform ini bisa diprogram: Catalyst Center, Meraki, dan NSO lewat REST API dengan Python.

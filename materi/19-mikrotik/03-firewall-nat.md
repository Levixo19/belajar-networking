# 19.3 MikroTik: Firewall, NAT & Mangle

> **Prasyarat:** `19-mikrotik/01-02`, `09-nat-acl-firewall` (NAT/ACL/firewall), `12-keamanan/03` (firewall stateful)
> **Tujuan:** Anda bisa membangun firewall filter, NAT, dan mangle di RouterOS, memahami connection tracking, chain, dan address-list.

---

## 1. Struktur Firewall RouterOS

Firewall RouterOS (berbasis Linux netfilter, lihat `13-linux-networking/03`) terdiri dari beberapa **tabel** dengan **chain**:

```
/ip firewall
  filter   → mengizinkan/menolak paket (seperti ACL + stateful)
  nat      → menerjemahkan alamat/port (srcnat, dstnat)
  mangle   → menandai paket/koneksi, ubah field (untuk QoS/routing)
  raw      → proses sebelum connection tracking (untuk performa/anti-DDoS)
```

**Chain bawaan pada `filter`:**
```
input    → trafik DITUJUKAN ke router itu sendiri (mis. Winbox, ping ke router)
forward  → trafik MELEWATI router (dari satu interface ke lain — trafik pelanggan)
output   → trafik DIHASILKAN oleh router itu sendiri
```

> [!WARNING]
> **Bedakan `input` dan `forward`.** `input` melindungi **router itu sendiri** (akses manajemen). `forward` mengontrol trafik **yang lewat** (antar-jaringan/pelanggan/internet). Salah chain = aturan tidak berpengaruh atau memblokir hal yang salah. Ini padanan langsung netfilter Linux (`13/03`).

---

## 2. Connection Tracking & Stateful Firewall

RouterOS adalah **stateful firewall** — melacak status koneksi. Ini kunci firewall efisien dan aman.

```
Status koneksi (connection-state):
  new         → paket pertama koneksi baru
  established → bagian dari koneksi yang sudah terjalin
  related     → terkait koneksi ada (mis. data FTP, ICMP error)
  invalid     → tidak cocok koneksi mana pun (sering di-drop)
```

**Pola firewall stateful standar (best practice):**
```routeros
/ip firewall filter
# 1. Terima established & related dulu (efisien — mayoritas trafik)
add chain=input action=accept connection-state=established,related
# 2. Drop invalid
add chain=input action=drop connection-state=invalid
# 3. Izinkan ICMP (ping) — opsional tapi berguna
add chain=input action=accept protocol=icmp
# 4. Izinkan akses manajemen HANYA dari jaringan tepercaya
add chain=input action=accept src-address=192.168.1.0/24
# 5. Drop sisanya (default deny)
add chain=input action=drop
```

> [!TIP]
> **Terima `established,related` di aturan PERTAMA** adalah praktik terbaik: mayoritas paket adalah bagian koneksi yang sudah diizinkan, sehingga diproses cepat tanpa mengevaluasi semua aturan. Ini persis pola stateful yang diajarkan di `12-keamanan/03` dan `13-linux-networking/03`.

> [!WARNING]
> **Aturan diproses BERURUTAN dari atas ke bawah**, paket cocok aturan pertama yang sesuai. **Urutan sangat penting** — aturan `drop` di atas akan memblokir sebelum aturan `accept` di bawahnya sempat dievaluasi. Selalu susun: accept spesifik dulu, drop umum terakhir.

---

## 3. NAT di RouterOS

Dua chain NAT utama:

```
srcnat  → ubah alamat SUMBER (untuk trafik KELUAR) — masquerade/PAT
dstnat  → ubah alamat TUJUAN (untuk trafik MASUK) — port forwarding
```

### Masquerade (PAT keluar: paling umum)
```routeros
# Pelanggan/LAN keluar ke internet lewat IP publik router (PAT)
/ip firewall nat
add chain=srcnat out-interface=ether1-wan action=masquerade
```
Setara `ip nat inside source ... overload` (Cisco) atau `MASQUERADE` (iptables). Cocok bila IP publik dinamis.

### src-nat statik (bila IP publik tetap)
```routeros
add chain=srcnat out-interface=ether1-wan action=src-nat to-addresses=203.0.113.5
```
Lebih efisien dari masquerade bila IP publik statik (tidak menghitung ulang tiap kali).

### dst-nat (port forwarding)
```routeros
# Teruskan HTTP publik ke server internal
/ip firewall nat
add chain=dstnat protocol=tcp dst-port=80 in-interface=ether1-wan \
    action=dst-nat to-addresses=192.168.1.10 to-ports=80
```
Setara port forwarding / `ip nat inside source static tcp` Cisco.

> [!TIP]
> **`masquerade` vs `src-nat`:** gunakan **masquerade** untuk IP WAN **dinamis** (otomatis ikut IP interface), **src-nat** untuk IP WAN **statik** (sedikit lebih efisien). Untuk RT-RW-Net dengan IP dari ISP, masquerade paling umum.

---

## 4. Address-List: Kelompok Dinamis

**Address-list** mengelompokkan alamat IP untuk dipakai di banyak aturan — sangat kuat di RouterOS.

```routeros
# Buat daftar
/ip firewall address-list
add list=TEPERCAYA address=192.168.1.0/24
add list=DIBLOKIR address=203.0.113.0/24

# Pakai di filter
/ip firewall filter
add chain=input src-address-list=TEPERCAYA action=accept
add chain=forward src-address-list=DIBLOKIR action=drop
```

**Dinamis (otomatis) — mis. deteksi port scan / brute force:**
```routeros
# Tambahkan penyerang ke address-list otomatis lalu blokir
/ip firewall filter
add chain=input protocol=tcp dst-port=22 connection-state=new \
    action=add-src-to-address-list address-list=SSH-ATTACK \
    address-list-timeout=1h
add chain=input src-address-list=SSH-ATTACK action=drop
```

> [!TIP]
> **Address-list dinamis** adalah salah satu fitur firewall MikroTik paling berguna — bisa otomatis menambahkan IP mencurigakan (port scanner, brute-forcer) ke daftar blokir dengan timeout. Banyak dipakai untuk proteksi otomatis di ISP.

---

## 5. Mangle: Menandai untuk QoS & Routing

**Mangle** menandai paket/koneksi (mark) yang lalu dipakai oleh queue (QoS, `19.4`) atau routing (PBR/failover).

```routeros
/ip firewall mangle
# Tandai koneksi lalu paket — untuk dipakai di queue tree
add chain=forward dst-port=80,443 protocol=tcp \
    action=mark-connection new-connection-mark=web-conn
add chain=forward connection-mark=web-conn \
    action=mark-packet new-packet-mark=web-pkt
```

> [!TIP]
> **Pola mark-connection lalu mark-packet** adalah standar: tandai koneksi sekali (efisien), lalu tandai semua paket koneksi itu. Packet-mark dipakai queue tree untuk QoS (`19.4`) atau routing-mark untuk PBR/failover multi-WAN.

> [!WARNING]
> Mangle bekerja sebelum/berdampingan dengan queue dan routing — urutan dan chain (prerouting/forward/output) penting. Untuk QoS pelanggan, umumnya di chain `forward`.

---

## 6. Packet Flow RouterOS v7 dan Tabel RAW

Aturan firewall, NAT, mangle, dan queue yang Anda tulis tidak berdiri sendiri. Setiap paket melewati urutan fasilitas yang tetap, dan banyak "misteri" MikroTik (aturan yang tidak pernah kena, queue yang tidak membatasi, NAT yang tidak jalan) terjawab begitu Anda tahu urutan itu. Dokumentasi resmi menyebutnya **Packet Flow in RouterOS**.

### 6.1 Lima titik utama

Ada lima chain bawaan. Tidak semua tabel punya semua chain:

| Chain | Kapan paket melewatinya | Ada di tabel |
|---|---|---|
| `prerouting` | Begitu paket tiba, sebelum keputusan routing | `raw`, `mangle`, `nat` (sebagai `dstnat`) |
| `input` | Paket untuk router itu sendiri | `mangle`, `filter` |
| `forward` | Paket yang dirutekan melewati router | `mangle`, `filter` |
| `output` | Paket yang dibuat router | `raw`, `mangle`, `nat`, `filter` |
| `postrouting` | Tepat sebelum paket keluar | `mangle`, `nat` (sebagai `srcnat`) |

Urutan lengkap untuk paket yang **diteruskan** (misalnya trafik pelanggan ke internet), diringkas dari dokumentasi:

```
 in-interface
     │
     ▼
 ┌──────────────────────── PREROUTING ────────────────────────┐
 │ hotspot-in → RAW prerouting → CONNECTION TRACKING →        │
 │ mangle prerouting → NAT dstnat                             │
 └────────────────────────────┬───────────────────────────────┘
                              ▼
                   ┌─────────────────────┐
                   │  keputusan routing  │──── untuk router? ──▶ INPUT:
                   └──────────┬──────────┘     mangle input → filter input →
                              ▼                queue tree (global) → simple queue
 ┌───────────────────────── FORWARD ──────────────────────────┐   → proses lokal
 │ TTL dikurangi → mangle forward → filter forward →          │
 │ accounting                                                 │
 └────────────────────────────┬───────────────────────────────┘
                              ▼
 ┌──────────────────────── POSTROUTING ───────────────────────┐
 │ mangle postrouting → NAT srcnat → hotspot-out →            │
 │ queue tree (HTB global) → simple queue → IPsec policy      │
 └────────────────────────────┬───────────────────────────────┘
                              ▼
                     interface HTB (queue tree parent=antarmuka)
                              ▼
                        out-interface
```

Untuk paket yang **dibuat router** (misalnya router melakukan DNS query atau PPPoE client mengirim LCP), urutannya: keputusan routing, connection tracking, mangle output, filter output, routing adjustment (tempat policy routing lewat `routing-mark` di mangle output diberlakukan), lalu postrouting seperti di atas.

Konsekuensi praktis yang paling sering muncul:

1. **dstnat terjadi sebelum filter forward.** Aturan filter untuk port forwarding harus memakai alamat **sesudah** NAT (alamat server internal), bukan alamat publik.
2. **srcnat terjadi sesudah filter forward.** Di filter forward, alamat sumber pelanggan masih alamat privatnya, jadi aturan per pelanggan bisa memakai alamat asli.
3. **Simple queue dan queue tree global berada di postrouting (dan di input untuk trafik ke router).** Mangle yang menandai paket untuk queue harus berjalan sebelumnya. Untuk download pelanggan yang dibatasi simple queue dengan `packet-marks`, dokumentasi Queues menyebut tanda harus dipasang sebelum `global-in`, yaitu di mangle `prerouting`.
4. **RAW berada sebelum connection tracking.** Inilah yang membuatnya murah.

### 6.2 Tabel RAW: drop sebelum connection tracking

Connection tracking adalah bagian yang mahal: setiap paket dicari di tabel koneksi, setiap paket `new` membuat entri baru. Pada serangan banjir paket (SYN flood, UDP flood dari ribuan sumber), justru pembuatan entri itulah yang menghabiskan CPU dan memori, bahkan bila filter akhirnya men-drop paketnya.

Tabel **RAW** (`/ip firewall raw`, dan `/ipv6 firewall raw`) dievaluasi sebelum connection tracking. Sifatnya menurut dokumentasi:

- Hanya punya dua chain: `prerouting` (semua paket yang masuk) dan `output` (paket buatan router).
- **Tidak punya pencocok yang bergantung pada connection tracking** (`connection-state`, `layer7`, dan sejenisnya). Anda hanya bisa mencocokkan header: alamat, port, protokol, interface, address-list, flag TCP.
- Punya aksi khusus **`notrack`**: paket diteruskan tanpa dicatat di connection tracking. Paket itu tampil di filter dengan `connection-state=untracked`. Paket notrack juga tidak didefragmentasi.

Pola pemakaian yang sehat:

```routeros
/ip firewall raw
# Buang yang jelas sampah, sebelum memakan entri conntrack
add chain=prerouting in-interface-list=WAN src-address-list=bogon action=drop comment="bogon dari WAN"
add chain=prerouting in-interface-list=WAN src-address-list=blacklist action=drop comment="blacklist murah"
add chain=prerouting in-interface-list=WAN protocol=udp dst-port=1900 action=drop comment="SSDP dari internet"
# Protokol routing tidak perlu dilacak
add chain=prerouting protocol=ospf action=notrack
add chain=output protocol=ospf action=notrack

/ip firewall filter
# Ingat menerima untracked, atau paket notrack akan jatuh ke aturan drop
add chain=input action=accept connection-state=established,related,untracked
add chain=input action=drop connection-state=invalid
```

Dokumentasi DDoS Protection MikroTik memakai pembagian kerja yang sama: aturan filter mendeteksi penyerang (dengan `dst-limit`) dan memasukkannya ke address-list, sedangkan aturan RAW yang men-drop paket dari address-list itu. Deteksi butuh state, pembuangan tidak.

> [!WARNING]
> RAW tidak tahu apakah paket adalah balasan koneksi yang sah. Jangan men-drop di RAW sesuatu yang Anda butuhkan untuk balasan (misalnya "drop semua UDP dari WAN" juga akan membuang balasan DNS ke router). Simpan logika "izinkan yang established" di filter.

### 6.3 FastTrack: cepat, tetapi melompati banyak hal

**FastTrack** (Fast Path + Connection Tracking) menandai koneksi tertentu agar paket-paket berikutnya lewat jalur cepat:

```routeros
/ip firewall filter
add chain=forward action=fasttrack-connection connection-state=established,related
add chain=forward action=accept connection-state=established,related,untracked
```

Aturan accept kedua tetap diperlukan karena hanya TCP dan UDP yang bisa di-fasttrack, dan sebagian paket koneksi yang di-fasttrack tetap sesekali dikirim lewat jalur lambat agar entri conntrack tetap hidup. Setelah ada koneksi yang di-fasttrack, RouterOS menampilkan aturan dummy di puncak daftar filter sebagai penanda.

Daftar yang **dilewati** paket FastTrack menurut dokumentasi: firewall (termasuk mangle), connection tracking, **simple queue, queue tree dengan parent=global**, IP traffic-flow, IP accounting, IPsec, hotspot universal client, dan penetapan VRF. FastTrack juga hanya memakai tabel routing `main`.

Akibatnya di dunia nyata:

| Fitur Anda | Apa yang terjadi bila trafiknya di-fasttrack |
|---|---|
| Simple queue per pelanggan (termasuk queue dinamis PPPoE dan Hotspot) | Batas kecepatan "bocor"; pelanggan paket 10 Mbps bisa mendapat jauh lebih |
| Queue tree dengan packet-mark dari mangle | Mangle dilewati, paket tidak bertanda, queue tidak mengenali trafik |
| Policy routing (mangle `mark-routing`, failover dua ISP) | Paket di-fasttrack dirutekan lewat tabel `main`, bisa salah jalur |
| IPsec | Paket tidak melewati pemrosesan kebijakan IPsec sebagaimana mestinya; dokumentasi IPsec MikroTik menyarankan mengecualikan trafik IPsec dari FastTrack |

Kapan FastTrack tepat: router kantor atau rumah yang hanya butuh firewall dan NAT dengan throughput tinggi. Kapan harus dihindari atau dibatasi: NAS RT-RW Net yang menegakkan paket bandwidth per pelanggan, router dengan PBR, dan router IPsec. Untuk membatasi cakupannya, letakkan aturan `accept` untuk trafik yang dikecualikan di atas aturan fasttrack:

```routeros
/ip firewall filter
add chain=forward action=accept connection-state=established,related \
    src-address-list=pelanggan-ppp comment="pelanggan: jangan fasttrack, biar queue berlaku"
add chain=forward action=accept connection-state=established,related \
    dst-address-list=pelanggan-ppp
add chain=forward action=fasttrack-connection connection-state=established,related
add chain=forward action=accept connection-state=established,related,untracked
```

Address-list `pelanggan-ppp` bisa diisi otomatis lewat properti `address-list` di PPP profile (lihat `19-mikrotik/10-user-manager-radius`).

### 6.4 Port knocking dengan address-list

Alamat publik dipindai bot terus-menerus. **Port knocking** menyembunyikan layanan manajemen: port SSH dan WinBox tertutup sampai klien "mengetuk" urutan port tertentu dalam waktu singkat. Setiap ketukan hanya memindahkan alamat sumber ke address-list tahap berikutnya.

```routeros
/ip firewall filter
add chain=input action=accept connection-state=established,related,untracked
add chain=input action=drop connection-state=invalid
# Ketukan 1, 2, 3 (masing-masing hanya berlaku 15 detik)
add chain=input in-interface-list=WAN protocol=tcp dst-port=7001 \
    action=add-src-to-address-list address-list=knock1 address-list-timeout=15s comment="ketukan 1"
add chain=input in-interface-list=WAN protocol=tcp dst-port=8002 src-address-list=knock1 \
    action=add-src-to-address-list address-list=knock2 address-list-timeout=15s comment="ketukan 2"
add chain=input in-interface-list=WAN protocol=tcp dst-port=9003 src-address-list=knock2 \
    action=add-src-to-address-list address-list=admin-ok address-list-timeout=1h comment="ketukan 3"
# Setelah lulus: boleh SSH dan WinBox
add chain=input in-interface-list=WAN protocol=tcp dst-port=22,8291 src-address-list=admin-ok \
    action=accept comment="SSH/WinBox setelah knock"
# Mencoba SSH/WinBox tanpa knock: masuk blacklist (didrop di RAW, lihat 6.2)
add chain=input in-interface-list=WAN protocol=tcp dst-port=22,8291 \
    action=add-src-to-address-list address-list=blacklist address-list-timeout=1d
add chain=input in-interface-list=WAN action=drop comment="drop sisa dari WAN"
```

Dari sisi klien, ketukan cukup berupa percobaan koneksi TCP, misalnya dengan nmap seperti contoh di dokumentasi MikroTik: `for p in 7001 8002 9003; do nmap -Pn -p $p 203.0.113.1; done`, lalu SSH seperti biasa.

Hasil uji di CHR 7.24.5 (klien di 10.10.10.12 mengetuk router 10.10.10.11):

```
# Sebelum knock: percobaan ke 8291 langsung masuk blacklist
0 D blacklist  10.10.10.12  ...  23h59m49s
# Setelah blacklist dihapus dan tiga ketukan dilakukan berurutan
2 D admin-ok   10.10.10.12  ...  59m49s
# Counter aturan filter
;;; SSH/Winbox setelah knock
 6   input    accept                       60        1
```

Catatan desain:

- Aplikasi yang mencoba ulang (retransmisi SYN) mengirim beberapa paket ke port ketukan yang sama; itu tidak masalah. Yang penting urutan dan batas waktu.
- Port ketukan jangan berurutan naik (1000, 1001, 1002): pemindai yang menyapu rentang port bisa lulus tanpa sengaja. Dokumentasi MikroTik juga menyarankan daftar hitam untuk port jebakan.
- Port knocking adalah lapisan tambahan, bukan pengganti password kuat, pembatasan `/ip service ... address=`, dan pembaruan RouterOS.

> [!WARNING]
> **Gunakan Safe Mode** (Ctrl+X di terminal, atau tombol Safe Mode di WinBox) saat menyusun aturan `input`. Saat menyiapkan contoh di atas, aturan `drop` untuk `in-interface-list=!LAN` sempat memutus sesi SSH manajemen yang datang dari antarmuka di luar list LAN, dan akses harus dipulihkan lewat konsol serial. Safe Mode akan membatalkan perubahan secara otomatis bila sesi Anda terputus.

### 6.5 Sertifikat untuk HTTPS (WebFig) dan SSTP

Layanan `www-ssl` (WebFig lewat HTTPS), SSTP server, Hotspot HTTPS, dan RadSec membutuhkan sertifikat di `/certificate`. Ada dua jalur.

**A. CA lokal (untuk jaringan internal dan lab):**

```routeros
/certificate add name=ca-lab common-name=ca-lab key-usage=key-cert-sign,crl-sign days-valid=3650
/certificate sign ca-lab
/certificate add name=router-lab common-name=router.lab.test \
    subject-alt-name=DNS:router.lab.test,IP:192.0.2.1 days-valid=825 \
    key-usage=digital-signature,key-encipherment,tls-server
/certificate sign router-lab ca=ca-lab
/certificate export-certificate ca-lab
```

Hasilnya, `ca-lab` berflag `KAT` (punya private key, authority, trusted) dan `router-lab` berflag `KI` (punya private key, issued). Berkas `cert_export_ca-lab.crt` diimpor ke klien (Windows: "Trusted Root Certification Authorities") agar sertifikat router dipercaya. Browser modern mencocokkan nama dengan **subject-alt-name**, bukan hanya common-name, jadi isi SAN dengan nama DNS dan alamat yang benar-benar dipakai.

**B. Let's Encrypt (untuk nama domain publik):**

```routeros
/certificate add-acme directory-url=https://acme-v02.api.letsencrypt.org/directory \
    domain-names=vpn.contoh-rtrw.id
```

Menurut dokumentasi Certificates, nama domain harus mengarah ke router dan TCP port 80 harus bisa dijangkau dari internet (tantangan HTTP-01). Untuk nama `/ip cloud` (`*.sn.mynetname.net`) dipakai tantangan DNS-01. Sertifikat diperbarui otomatis setelah 80% masa berlakunya lewat. Ingat membuka port 80 di firewall input selama proses itu, atau proses gagal diam-diam.

**Memasang sertifikat:**

```routeros
/ip service set www-ssl certificate=router-lab disabled=no tls-version=only-1.2
/interface sstp-server server set enabled=yes port=4443 certificate=router-lab \
    default-profile=default-encryption tls-version=only-1.2 pfs=yes
```

> [!WARNING]
> `www-ssl` dan SSTP server sama-sama memakai **port 443** secara bawaan. Di CHR 7.24.5, mengaktifkan SSTP saat `www-ssl` sudah aktif di 443 gagal dengan pesan `can't bind, check if port is not used by other service!`. Pindahkan salah satunya (contoh di atas memindahkan SSTP ke 4443) atau matikan `www-ssl` bila WebFig tidak dipakai dari luar.

Di sisi klien SSTP RouterOS, aktifkan `verify-server-certificate=yes` (dan bila perlu `verify-server-address-from-certificate=yes`) setelah mengimpor CA. Dokumentasi SSTP menjelaskan bahwa tanpa verifikasi sertifikat, terowongan antar dua MikroTik memakai DH anonim yang rentan serangan man-in-the-middle. Klien Windows memang mewajibkan sertifikat server yang dipercaya. Dokumentasi juga mencatat bahwa klien Windows tidak bisa memakai sertifikat klien untuk SSTP.

> [!TIP]
> Pola keamanan manajemen yang lengkap untuk router di lokasi pelanggan: layanan manajemen hanya dari VPN (SSTP atau WireGuard, lihat `19-mikrotik/06-vpn-tunnel`) dengan sertifikat terverifikasi, port knocking sebagai pintu darurat dari internet, dan RAW untuk membuang alamat yang masuk daftar hitam sebelum menyentuh connection tracking.

---

## 7. Proteksi Router (Best Practice Keamanan)

```routeros
# Batasi akses manajemen — HANYA dari jaringan admin
/ip firewall filter
add chain=input connection-state=established,related action=accept
add chain=input connection-state=invalid action=drop
add chain=input protocol=icmp action=accept
add chain=input src-address-list=ADMIN action=accept
add chain=input action=drop     # default deny untuk router

# Nonaktifkan layanan tak perlu (kurangi permukaan serang)
/ip service
set telnet disabled=yes
set ftp disabled=yes
set www disabled=yes           # jika tidak pakai WebFig HTTP
set api disabled=yes           # jika tidak pakai API
set winbox address=192.168.1.0/24   # batasi Winbox ke subnet admin
set ssh port=2200              # ganti port default (opsional)
```

> [!WARNING]
> **Amankan router MikroTik sejak awal** — RouterOS default cukup terbuka. Nonaktifkan Telnet/FTP/layanan tak terpakai, batasi Winbox/SSH ke subnet admin, ganti password default, dan pasang firewall `input` default-deny. Router ISP yang terekspos tanpa proteksi cepat diserang (brute-force, botnet). Lihat juga `12-keamanan/05` (hardening).

---

## 8. Tabel Padanan

| Fungsi | Cisco IOS | MikroTik RouterOS | Linux (nftables/iptables) |
|---|---|---|---|
| Filter paket | ACL | `/ip firewall filter` | nftables rule / iptables |
| Stateful | ZBF / reflexive | connection-state | conntrack (ct state) |
| PAT keluar | `ip nat ... overload` | srcnat `masquerade`/`src-nat` | MASQUERADE/SNAT |
| Port forward | `ip nat ... static tcp` | dstnat `dst-nat` | DNAT |
| Trafik ke router | control-plane / VTY ACL | chain `input` | INPUT chain |
| Trafik lewat | ACL di interface | chain `forward` | FORWARD chain |
| Grup alamat | object-group | **address-list** | ipset / named set |
| Marking QoS | class-map / DSCP | **mangle** mark | mangle / meta mark |

---

## 9. Ringkasan

- Firewall RouterOS (netfilter): tabel **filter, nat, mangle, raw**. Chain filter: **input** (ke router), **forward** (lewat router), **output** (dari router). ⚠️ Bedakan input vs forward.
- **Stateful** via **connection-state** (new/established/related/invalid). Best practice: **terima established,related dulu**, drop invalid, izinkan spesifik, **default drop**. ⚠️ Urutan aturan menentukan (atas ke bawah).
- **NAT**: **srcnat** (`masquerade` untuk IP dinamis, `src-nat` untuk statik) = PAT keluar; **dstnat** (`dst-nat`) = port forwarding.
- **Address-list**: kelompok IP; **dinamis** bisa auto-tambah penyerang (anti brute-force/scan) dengan timeout.
- **Mangle**: tandai koneksi lalu paket (mark) untuk **QoS (queue)** dan **routing (PBR/failover)**.
- **Amankan router**: nonaktifkan layanan tak perlu, batasi Winbox/SSH ke admin, firewall input default-deny.

---

## 10. Latihan

1. Apa perbedaan chain `input` dan `forward`, dan kapan memakai masing-masing?
2. Kenapa aturan `accept established,related` diletakkan pertama?
3. Kapan memakai `masquerade` dan kapan `src-nat`? Tulis aturan port forwarding HTTP ke 192.168.1.10.
4. Bagaimana address-list dinamis bisa melindungi router dari brute-force SSH?
5. Sebutkan empat langkah mengamankan router MikroTik yang terekspos internet.
6. Router perbatasan RT-RW Net Anda diserang banjir UDP dari ribuan alamat palsu ke port 1900. CPU naik ke 100% walaupun sudah ada aturan `filter input` yang men-drop UDP 1900 dari WAN, dan `/ip firewall connection print count-only` menunjukkan puluhan ribu entri. Jelaskan, berdasarkan packet flow RouterOS, mengapa aturan filter itu tidak cukup, tuliskan aturan penggantinya, dan sebutkan satu hal yang harus Anda tambahkan di filter bila memakai aksi `notrack` untuk trafik lain.
7. Anda ingin mengaktifkan SSTP server agar teknisi bisa masuk ke router dari laptop Windows, sementara WebFig HTTPS juga dipakai. Perintah `/interface sstp-server server set enabled=yes certificate=router-lab` gagal dengan pesan "can't bind", dan setelah masalah itu diatasi, Windows menolak koneksi karena sertifikat. Jelaskan penyebab kedua masalah dan langkah perbaikannya, lalu jelaskan bagaimana port knocking bisa melengkapi akses darurat ke WinBox tanpa membuka port 8291 untuk semua orang.

<details>
<summary>Jawaban</summary>

1. **`input`** menangani trafik yang **ditujukan ke router itu sendiri** — misalnya seseorang mengakses Winbox/SSH/API router, atau ping ke alamat router. Aturan di chain input **melindungi router** (akses manajemen dan layanannya). **`forward`** menangani trafik yang **melewati router** dari satu interface ke interface lain — misalnya trafik pelanggan menuju internet, atau antar-VLAN/antar-jaringan. Aturan di chain forward **mengontrol trafik transit** (apa yang boleh lewat). **Kapan memakai:** gunakan `input` untuk membatasi/melindungi akses ke router (mis. hanya admin boleh Winbox); gunakan `forward` untuk kebijakan trafik yang mengalir melalui router (mis. blokir pelanggan mengakses situs tertentu, izinkan LAN ke internet, kontrol antar-VLAN). Salah memilih chain adalah kesalahan umum: aturan `forward` tidak akan melindungi router, dan aturan `input` tidak akan memengaruhi trafik pelanggan yang lewat.

2. Karena **mayoritas paket yang melewati firewall adalah bagian dari koneksi yang sudah terjalin** (established) atau terkait dengannya (related) — sekali sebuah koneksi diizinkan (paket `new`-nya lolos), semua paket balasan dan lanjutannya adalah established/related. Dengan menempatkan `accept connection-state=established,related` sebagai aturan **pertama**, paket-paket ini langsung diterima tanpa harus dievaluasi terhadap seluruh daftar aturan di bawahnya — jauh lebih **efisien** (menghemat CPU, penting pada trafik tinggi di router ISP). Selain efisiensi, ini juga **benar secara logika stateful**: Anda hanya perlu memutuskan izin pada paket **`new`** (pembuka koneksi); begitu koneksi diizinkan, lanjutannya otomatis boleh. Aturan-aturan spesifik di bawahnya kemudian hanya perlu menangani koneksi `new`. Ini pola stateful standar yang sama di netfilter Linux dan konsep firewall di `12-keamanan/03`.

3. Gunakan **`masquerade`** ketika IP publik WAN **dinamis** (berubah, mis. dari DHCP ISP) — masquerade otomatis memakai alamat interface WAN saat itu, jadi tidak perlu diubah saat IP berganti. Gunakan **`src-nat` dengan `to-addresses`** ketika IP publik WAN **statik** — sedikit lebih efisien karena router tidak perlu memeriksa/menghitung alamat interface setiap kali. **Port forwarding HTTP ke 192.168.1.10:**
   ```routeros
   /ip firewall nat
   add chain=dstnat protocol=tcp dst-port=80 in-interface=ether1-wan \
       action=dst-nat to-addresses=192.168.1.10 to-ports=80
   ```
   (Pastikan juga ada aturan `filter forward` yang mengizinkan trafik ke 192.168.1.10 port 80 bila firewall forward default-deny.)

4. Dengan **dua aturan yang bekerja sama**: aturan pertama mendeteksi **koneksi baru** ke port SSH (22) dan secara otomatis **menambahkan IP sumbernya ke sebuah address-list** (mis. bernama `SSH-ATTACK`) dengan `action=add-src-to-address-list` dan `address-list-timeout` tertentu (mis. 1 jam); aturan kedua **men-drop** semua trafik dari IP yang ada di address-list itu (`src-address-list=SSH-ATTACK action=drop`). Untuk implementasi anti-brute-force yang lebih canggih, biasanya dipakai **beberapa tingkat**: percobaan pertama masuk daftar tahap-1, jika mencoba lagi dalam waktu singkat naik ke tahap-2, dan seterusnya hingga masuk daftar blokir — sehingga hanya IP yang **berulang kali** mencoba (ciri brute-force) yang diblokir, bukan kesalahan ketik password sekali. Karena **timeout**, blokir otomatis kedaluwarsa setelah periode tertentu (tidak perlu intervensi manual). Ini melindungi router dari serangan brute-force login SSH secara otomatis dan adaptif — salah satu kekuatan address-list dinamis MikroTik.

5. (Empat dari) **(1) Firewall `input` default-deny** — pasang aturan chain input yang hanya mengizinkan established/related, ICMP secukupnya, dan akses dari subnet/address-list admin, lalu **drop sisanya**, sehingga router tidak menerima koneksi dari sumber tak dikenal. **(2) Nonaktifkan layanan yang tidak dipakai** — matikan Telnet, FTP, API, dan WebFig HTTP bila tidak digunakan (`/ip service set ... disabled=yes`) untuk mengurangi permukaan serang. **(3) Batasi akses manajemen ke sumber tepercaya** — set Winbox/SSH agar hanya menerima dari subnet admin (`/ip service set winbox address=...`), dan pertimbangkan mengganti port default SSH. **(4) Ganti kredensial default dan gunakan password kuat** — hapus/ubah user `admin` default, gunakan password kuat atau kunci SSH. Tambahan: aktifkan **address-list dinamis anti-brute-force**, nonaktifkan penemuan (MAC-server/neighbor discovery) di interface WAN, jaga RouterOS **selalu ter-update** (patch keamanan), dan matikan Bandwidth Test server. Ini konsisten dengan prinsip hardening di `12-keamanan/05`.

6. Di packet flow RouterOS, paket yang masuk melewati **RAW prerouting, lalu connection tracking**, baru kemudian mangle, dstnat, keputusan routing, dan **filter input**. Jadi setiap paket banjir sudah dicari dan dicatat di connection tracking (membuat entri `new` baru untuk setiap alamat palsu) sebelum aturan filter sempat men-drop-nya. Biaya terbesarnya ada di pembuatan entri itu, sehingga CPU dan tabel koneksi tetap penuh. Ganti dengan aturan di tabel RAW yang dievaluasi sebelum connection tracking:
   ```routeros
   /ip firewall raw
   add chain=prerouting in-interface-list=WAN protocol=udp dst-port=1900 action=drop
   ```
   Aturan filter lama boleh dihapus. Bila Anda juga memakai `action=notrack` di RAW untuk trafik lain (misalnya OSPF atau trafik server yang sangat padat), paket itu akan tampil di filter dengan `connection-state=untracked`, jadi aturan accept pertama di filter harus menyertakan `untracked` (`connection-state=established,related,untracked`). Tanpa itu, paket notrack jatuh ke aturan drop default.

7. **"can't bind"**: `www-ssl` (WebFig HTTPS) dan SSTP server sama-sama memakai TCP 443 secara bawaan. Port yang sudah dipakai satu layanan tidak bisa dipakai layanan lain. Perbaikan: pindahkan SSTP ke port lain (`/interface sstp-server server set port=4443 ...`) atau pindahkan/matikan `www-ssl`. **Penolakan sertifikat di Windows**: klien SSTP Windows mewajibkan sertifikat server yang dipercaya dan cocok dengan nama yang dituju. Bila sertifikat ditandatangani CA lokal, ekspor CA (`/certificate export-certificate ca-lab`) dan impor ke "Trusted Root Certification Authorities" di Windows, lalu pastikan `subject-alt-name` sertifikat server memuat nama DNS atau alamat IP yang dipakai teknisi. Alternatifnya, pakai sertifikat Let's Encrypt lewat `/certificate add-acme` untuk nama domain publik (butuh port 80 terjangkau saat penerbitan). **Port knocking** untuk akses darurat: buat beberapa aturan `filter input` yang memindahkan alamat sumber dari address-list `knock1` ke `knock2` lalu ke `admin-ok` hanya bila port ketukan diakses berurutan dalam batas waktu (misalnya 15 detik per tahap), lalu izinkan TCP 8291 hanya dari `src-address-list=admin-ok` dengan timeout terbatas (misalnya 1 jam). Port 8291 tetap tertutup bagi pemindai, dan percobaan langsung ke 8291 tanpa ketukan bisa dimasukkan ke address-list `blacklist` yang di-drop di RAW. Susun aturan input dalam Safe Mode agar kesalahan tidak mengunci Anda di luar.

</details>

---

## 11. Sumber

- MikroTik documentation — Firewall, NAT, Mangle, Connection tracking (help.mikrotik.com)
- MTCNA outline — Firewall · MikroTik "Building Your First Firewall" guide
- `09-nat-acl-firewall/*`, `12-keamanan/03`, `13-linux-networking/03` (netfilter)
- MikroTik, Packet Flow in RouterOS: https://help.mikrotik.com/docs/spaces/ROS/pages/328227/Packet+Flow+in+RouterOS
- MikroTik, Filter (bagian RAW Filtering): https://help.mikrotik.com/docs/spaces/ROS/pages/48660574/Filter
- MikroTik, Building Advanced Firewall: https://help.mikrotik.com/docs/spaces/ROS/pages/328513/Building+Advanced+Firewall
- MikroTik, DDoS Protection: https://help.mikrotik.com/docs/spaces/ROS/pages/28606504/DDoS+Protection
- MikroTik, Port knocking: https://help.mikrotik.com/docs/spaces/ROS/pages/154042369/Port+knocking
- MikroTik, Certificates: https://help.mikrotik.com/docs/spaces/ROS/pages/2555969/Certificates
- MikroTik, SSTP: https://help.mikrotik.com/docs/spaces/ROS/pages/2031645/SSTP
- MikroTik, IPsec (NAT and Fasttrack Bypass): https://help.mikrotik.com/docs/spaces/ROS/pages/11993097/IPsec
- MikroTik, MTCTCE dan MTCSE training outline: https://i.mt.lv/cdn/training_pdf/mtctce_outline_2020154113204.pdf dan https://i.mt.lv/cdn/training_pdf/mtcse_outline_2019181161836.pdf

---

**Berikutnya:** `19-mikrotik/04-qos-queue-hotspot.md`. QoS, queue, dan hotspot RouterOS.

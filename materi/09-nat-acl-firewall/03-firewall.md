# 09.3 Firewall: Stateful, NGFW, dan IDS/IPS

> **Prasyarat:** `09-nat-acl-firewall/02`, `05-transport/02`
> **Tujuan:** Anda paham evolusi firewall, bisa merancang kebijakan yang benar, dan mengonfigurasi firewall stateful di Cisco/MikroTik/Linux.

---

## 1. Evolusi Firewall

| Generasi | Jenis | Memeriksa | Keterbatasan |
|---|---|---|---|
| **1** | Packet filter (ACL) | Header L3/L4, **stateless** | Tidak tahu konteks; balasan harus diizinkan manual |
| **2** | **Stateful inspection** | Header + **state koneksi** | Tidak melihat isi aplikasi |
| **3** | Application gateway / proxy | Isi aplikasi penuh | Lambat, butuh proxy per protokol |
| **4** | **NGFW** | Aplikasi, pengguna, konten, + IPS | Kompleks, mahal, butuh dekripsi TLS |
| **5** | **Cloud-delivered (SASE/SSE)** | Semua di atas, dari cloud | Bergantung konektivitas internet |

---

## 2. Stateful Inspection: Konsep Inti

Firewall **stateless** memeriksa setiap paket secara terpisah. Firewall **stateful** mengingat **koneksi**.

```
Klien 10.0.0.5:51234 → Server 93.184.216.34:443  (SYN)

Firewall mencatat di CONNECTION TABLE:
  10.0.0.5:51234 ↔ 93.184.216.34:443, proto TCP, state SYN_SENT

Balasan datang: 93.184.216.34:443 → 10.0.0.5:51234 (SYN-ACK)
  → Firewall MENCOCOKKAN dengan entri yang ada
  → OTOMATIS DIIZINKAN ✅ (tidak perlu aturan terpisah)

Paket dari 93.184.216.34:443 → 10.0.0.5:9999 (port berbeda)
  → TIDAK cocok dengan entri mana pun
  → DIBUANG ✅
```

### Connection state

| State | Arti |
|---|---|
| **new** | Paket pertama dari koneksi baru |
| **established** | Bagian dari koneksi yang sudah ada |
| **related** | Koneksi terkait (mis. data FTP, ICMP error untuk koneksi yang ada) |
| **invalid** | Tidak cocok dengan state mana pun; **selalu buang** |
| **untracked** | Sengaja dikecualikan dari tracking (untuk kinerja) |

> [!TIP]
> **Inilah kenapa firewall stateful jauh lebih mudah dikonfigurasi:** Anda hanya perlu mengizinkan **arah inisiasi**; balasan ditangani otomatis.

> [!WARNING]
> **Asymmetric routing merusak firewall stateful.** Kalau paket pergi lewat satu jalur dan balasan lewat firewall yang berbeda, firewall kedua tidak punya entri koneksi → membuang trafik sah. Ini penyebab masalah yang sangat sulit didiagnosis.

---

## 3. Struktur Kebijakan Firewall

### Prinsip: Default Deny

```
✅ BENAR:  tolak semua, lalu izinkan yang diperlukan
❌ SALAH:  izinkan semua, lalu blokir yang berbahaya
```

Alasannya: Anda **tidak akan pernah** bisa mendaftar semua yang berbahaya. Tetapi Anda **bisa** mendaftar semua yang diperlukan.

### Zona

```
┌──────────────────────────────────────────────────┐
│  INTERNET (untrusted)                            │
└────────────────────┬─────────────────────────────┘
                     │
              ┌──────┴──────┐
              │  FIREWALL   │
              └──┬───────┬──┘
                 │       │
        ┌────────┴──┐ ┌──┴────────────┐
        │    DMZ    │ │  LAN INTERNAL │
        │ (server   │ │  (trusted)    │
        │  publik)  │ │               │
        └───────────┘ └───────────────┘
```

**Aturan antar-zona yang standar:**
```
LAN → Internet   : izinkan (dengan filtering konten)
LAN → DMZ        : izinkan layanan tertentu
Internet → DMZ   : izinkan HANYA port layanan (80, 443, 25)
Internet → LAN   : TOLAK SEMUA (kecuali VPN)
DMZ → LAN        : TOLAK SEMUA ← paling penting!
DMZ → Internet   : sangat terbatas (update, DNS)
```

> [!WARNING]
> **`DMZ → LAN` harus ditolak.** Kalau server DMZ diretas (dan itu memang tujuan DMZ: mengasumsikan ia akan diretas), penyerang tidak boleh bisa melompat ke jaringan internal.

---

## 4. Firewall di MikroTik RouterOS

MikroTik adalah salah satu firewall stateful termurah dan paling lengkap. Ini **materi inti** untuk pasar Indonesia.

### Arsitektur: Chain dan Table

```
        ┌─────────────┐
Paket → │  prerouting │ → keputusan routing
masuk   └─────────────┘         │
                        ┌───────┴────────┐
                   untuk router?     untuk diteruskan?
                        │                 │
                   ┌────┴────┐      ┌─────┴─────┐
                   │  INPUT  │      │  FORWARD  │
                   └────┬────┘      └─────┬─────┘
                        │                 │
                   proses lokal           │
                        │                 │
                   ┌────┴────┐            │
                   │ OUTPUT  │            │
                   └────┬────┘            │
                        └────────┬────────┘
                          ┌──────┴──────┐
                          │ postrouting │ → keluar
                          └─────────────┘
```

| Chain | Untuk trafik |
|---|---|
| **input** | Menuju **router itu sendiri** (SSH, WinBox, DNS, ping ke router) |
| **forward** | **Melewati** router (LAN ↔ Internet) |
| **output** | **Dihasilkan** router (ping dari router, update, DNS query router) |

| Table | Fungsi |
|---|---|
| **filter** | Izinkan/tolak (`accept`, `drop`, `reject`) |
| **nat** | Terjemahkan alamat (`srcnat`, `dstnat`) |
| **mangle** | Tandai paket/koneksi/routing (untuk QoS dan PBR) |
| **raw** | Sebelum connection tracking, untuk membuang trafik volume tinggi secara efisien |

### Template Firewall Produksi

```
# ═══ INTERFACE LIST (WAJIB — memudahkan pemeliharaan) ═══
/interface list add name=WAN
/interface list add name=LAN
/interface list member add list=WAN interface=ether1-ISP
/interface list member add list=LAN interface=bridge-LAN

# ═══ ADDRESS LIST ═══
/ip firewall address-list
add list=MANAJEMEN address=192.168.99.0/24 comment="Subnet admin"
add list=BOGON address=0.0.0.0/8
add list=BOGON address=127.0.0.0/8
add list=BOGON address=169.254.0.0/16
add list=BOGON address=224.0.0.0/4
add list=BOGON address=240.0.0.0/4

# ═══ CHAIN INPUT (melindungi router) ═══
/ip firewall filter
add chain=input action=accept connection-state=established,related \
    comment="Terima koneksi yang sudah ada"
add chain=input action=drop connection-state=invalid \
    comment="Buang paket invalid"
add chain=input action=accept protocol=icmp limit=10,20:packet \
    comment="ICMP dengan rate limit"
add chain=input action=accept in-interface-list=LAN \
    comment="Terima semua dari LAN"
add chain=input action=accept src-address-list=MANAJEMEN \
    protocol=tcp dst-port=22,8291 comment="Manajemen dari subnet admin"
add chain=input action=drop in-interface-list=WAN \
    comment="TOLAK semua dari internet ke router"
add chain=input action=drop comment="Default deny input"

# ═══ CHAIN FORWARD (melindungi jaringan) ═══
add chain=forward action=fasttrack-connection connection-state=established,related \
    hw-offload=yes comment="FastTrack — percepat koneksi yang sudah ada"
add chain=forward action=accept connection-state=established,related
add chain=forward action=drop connection-state=invalid
add chain=forward action=drop src-address-list=BOGON in-interface-list=WAN \
    comment="Buang bogon dari internet"
add chain=forward action=accept in-interface-list=LAN out-interface-list=WAN \
    comment="LAN boleh ke internet"
add chain=forward action=accept connection-nat-state=dstnat \
    comment="Izinkan trafik yang sudah melewati port forwarding"
add chain=forward action=drop comment="Default deny forward"

# ═══ NAT ═══
/ip firewall nat
add chain=srcnat out-interface-list=WAN action=masquerade comment="NAT keluar"
```

> [!WARNING]
> **`action=fasttrack-connection` sangat menaikkan throughput** dengan melewatkan pemrosesan penuh untuk koneksi yang sudah dikenal. Tetapi paket yang di-fasttrack **melewati mangle, queue, dan sebagian besar filter**, sehingga QoS/pembatasan bandwidth tidak berlaku untuknya.

> [!TIP]
> **Kalau Anda memakai Simple Queue atau Queue Tree, JANGAN aktifkan FastTrack** untuk trafik yang ingin dibatasi, atau kecualikan trafik itu:
```
add chain=forward action=accept connection-mark=perlu-queue
add chain=forward action=fasttrack-connection connection-state=established,related
```

### Perlindungan Tambahan

```
# ═══ ANTI PORT SCAN ═══
/ip firewall filter
add chain=input protocol=tcp psd=21,3s,3,1 action=add-src-to-address-list \
    address-list=port-scanner address-list-timeout=2w comment="Deteksi port scan"
add chain=input src-address-list=port-scanner action=drop

# ═══ ANTI BRUTE FORCE SSH ═══
add chain=input protocol=tcp dst-port=22 src-address-list=ssh-blacklist action=drop \
    comment="Blokir SSH blacklist"
add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh-stage3 \
    action=add-src-to-address-list address-list=ssh-blacklist address-list-timeout=10d
add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh-stage2 \
    action=add-src-to-address-list address-list=ssh-stage3 address-list-timeout=1m
add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh-stage1 \
    action=add-src-to-address-list address-list=ssh-stage2 address-list-timeout=1m
add chain=input protocol=tcp dst-port=22 connection-state=new \
    action=add-src-to-address-list address-list=ssh-stage1 address-list-timeout=1m

# ═══ BATASI KONEKSI PER HOST (anti P2P berlebihan) ═══
add chain=forward protocol=tcp connection-limit=200,32 action=drop \
    comment="Maksimum 200 koneksi TCP per host"

# ═══ RAW TABLE (buang sebelum conntrack — hemat CPU saat serangan) ═══
/ip firewall raw
add chain=prerouting action=drop src-address-list=BOGON in-interface-list=WAN
add chain=prerouting action=drop src-address-list=ddos-blacklist
```

> [!TIP]
> **Table `raw` memproses paket SEBELUM connection tracking**, sehingga sangat efisien untuk membuang trafik serangan volume tinggi tanpa membebani tabel koneksi. Ini pertahanan pertama terhadap DDoS.

### Verifikasi

```
/ip firewall filter print stats           ← berapa paket kena tiap aturan
/ip firewall filter print stats interval=1s
/ip firewall connection print count-only
/ip firewall address-list print where dynamic
/log print where topics~"firewall"
/tool torch interface=ether1-ISP          ← lihat trafik real-time
```

---

## 5. Zone-Based Firewall (Cisco IOS)

ZBF adalah pengganti modern untuk ACL + CBAC di Cisco IOS.

```
# 1. Definisikan zona
R1(config)# zone security INSIDE
R1(config)# zone security OUTSIDE
R1(config)# zone security DMZ

# 2. Masukkan interface ke zona
R1(config)# interface gi0/1
R1(config-if)# zone-member security INSIDE
R1(config)# interface gi0/0
R1(config-if)# zone-member security OUTSIDE

# 3. Class-map: trafik apa
R1(config)# class-map type inspect match-any TRAFIK-WEB
R1(config-cmap)# match protocol http
R1(config-cmap)# match protocol https
R1(config-cmap)# match protocol dns

# 4. Policy-map: apa yang dilakukan
R1(config)# policy-map type inspect INSIDE-KE-OUTSIDE
R1(config-pmap)# class type inspect TRAFIK-WEB
R1(config-pmap-c)# inspect              ← stateful inspection
R1(config-pmap)# class class-default
R1(config-pmap-c)# drop log

# 5. Zone-pair: terapkan policy antar-zona
R1(config)# zone-pair security IN-TO-OUT source INSIDE destination OUTSIDE
R1(config-sec-zone-pair)# service-policy type inspect INSIDE-KE-OUTSIDE

R1# show zone security
R1# show zone-pair security
R1# show policy-map type inspect zone-pair
```

> [!WARNING]
> **Aturan ZBF yang penting:**
- Trafik **antar-zona** ditolak secara default kecuali ada zone-pair
- Trafik **dalam zona yang sama** diizinkan secara default
- Interface **tanpa zona** tidak bisa berkomunikasi dengan interface yang punya zona
- Zone `self` mewakili router itu sendiri

---

## 6. Linux: nftables

```bash
#!/usr/sbin/nft -f
flush ruleset

table inet filter {
    set bogon {
        type ipv4_addr; flags interval
        elements = { 0.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16, 224.0.0.0/4, 240.0.0.0/4 }
    }

    chain input {
        type filter hook input priority 0; policy drop;

        ct state established,related accept
        ct state invalid drop
        iif lo accept

        icmp type { echo-request, destination-unreachable, time-exceeded } \
            limit rate 10/second accept
        icmpv6 type { echo-request, nd-neighbor-solicit, nd-neighbor-advert, \
                      nd-router-advert, packet-too-big, destination-unreachable } accept

        ip saddr 192.168.99.0/24 tcp dport 22 accept
        iifname "eth1" accept

        log prefix "DROP-INPUT: " limit rate 5/minute
        drop
    }

    chain forward {
        type filter hook forward priority 0; policy drop;

        ct state established,related accept
        ct state invalid drop
        ip saddr @bogon iifname "eth0" drop

        iifname "eth1" oifname "eth0" accept
        ct status dnat accept

        log prefix "DROP-FWD: " limit rate 5/minute
        drop
    }

    chain output {
        type filter hook output priority 0; policy accept;
    }
}

table ip nat {
    chain prerouting  { type nat hook prerouting priority -100; }
    chain postrouting { type nat hook postrouting priority 100;
        oifname "eth0" masquerade
    }
}
```

```bash
$ sudo nft -f /etc/nftables.conf
$ sudo nft list ruleset
$ sudo systemctl enable nftables
```

Detail lengkap di `13-linux-networking/03-nftables-firewall.md`.

---

## 7. NGFW dan Fitur Lanjutan

### Yang membedakan NGFW dari firewall stateful

| Fitur | Fungsi |
|---|---|
| **Application awareness** | Mengenali aplikasi terlepas dari port (Facebook di port 443 tetap terdeteksi) |
| **User identity** | Aturan berbasis pengguna/grup AD, bukan alamat IP |
| **IPS terintegrasi** | Deteksi & blokir eksploit dalam trafik |
| **TLS inspection** | Mendekripsi untuk inspeksi (lihat `06-aplikasi/04`) |
| **URL filtering** | Kategori situs |
| **Sandboxing** | Jalankan file mencurigakan di lingkungan terisolasi |
| **Threat intelligence** | Feed reputasi IP/domain yang diperbarui terus |

**Vendor utama:** Palo Alto, Fortinet FortiGate, Check Point, Cisco Firepower/FTD, Sophos.

> [!WARNING]
> **NGFW membutuhkan TLS inspection untuk sebagian besar fiturnya**, lengkap dengan semua implikasi keamanan dan privasi yang dibahas di `06-aplikasi/04`. Tanpa dekripsi, NGFW hanya melihat SNI dan metadata.

### IDS vs IPS

| | **IDS** (Detection) | **IPS** (Prevention) |
|---|---|---|
| Posisi | **Out-of-band** (SPAN/TAP) | **Inline** |
| Aksi | Mendeteksi & memberi alarm | Mendeteksi & **memblokir** |
| Risiko | Serangan tetap lewat | **False positive memblokir trafik sah** |
| Dampak jika mati | Kehilangan visibilitas | **Memutus jaringan** (kecuali fail-open) |

**Metode deteksi:**
```
Signature-based → cocokkan dengan pola serangan yang diketahui
                  ✅ akurat, ❌ tidak mendeteksi serangan baru
Anomaly-based   → deteksi penyimpangan dari baseline
                  ✅ bisa mendeteksi zero-day, ❌ banyak false positive
Policy-based    → deteksi pelanggaran kebijakan
Reputation      → berdasarkan reputasi IP/domain
```

**Open source:** Snort, Suricata (IDS/IPS), Zeek (network security monitoring).

> [!WARNING]
> **IPS yang baru dipasang sebaiknya dijalankan dalam mode IDS (alert-only) dulu** selama beberapa minggu untuk menyetel false positive. Langsung mengaktifkan blocking hampir pasti memutus aplikasi bisnis yang sah.

### WAF

WAF adalah firewall khusus aplikasi web yang memeriksa HTTP untuk SQL injection, XSS, dan serangan aplikasi lainnya. Contoh: ModSecurity, Cloudflare WAF, AWS WAF.

---

## 8. Praktik Terbaik Firewall

```
✅ Default deny — tolak semua, izinkan yang perlu
✅ Least privilege — port sesempit mungkin, sumber sesempit mungkin
✅ Segmentasi — pisahkan LAN, DMZ, server, IoT, tamu, manajemen
✅ DMZ → LAN harus DITOLAK
✅ Buang state "invalid" selalu
✅ Logging pada aturan deny (dengan rate limit agar tidak membanjiri)
✅ Beri komentar setiap aturan — siapa memintanya, kapan, untuk apa
✅ Review berkala — hapus aturan yang tidak pernah kena
✅ Uji dari sesi terpisah sebelum menutup akses
✅ Backup konfigurasi sebelum perubahan
✅ Change control untuk perubahan firewall
✅ Jangan lupa firewall IPv6!
```

```
❌ JANGAN pakai "any any allow" sementara "untuk sementara"
❌ JANGAN blokir seluruh ICMP (merusak PMTUD; mematikan IPv6)
❌ JANGAN andalkan NAT sebagai firewall
❌ JANGAN ekspos antarmuka manajemen ke internet
❌ JANGAN biarkan aturan lama menumpuk tanpa review
```

### Aturan hygiene

```
1. Setiap aturan harus punya PEMILIK dan ALASAN yang tercatat
2. Aturan sementara harus punya TANGGAL KEDALUWARSA
3. Audit tahunan: aturan mana yang counter-nya 0 selama setahun?
4. Dokumentasikan perubahan di sistem tiket
5. Versi kontrol konfigurasi firewall (Git)
```

---

## 9. Troubleshooting Firewall

### Alur diagnosis

```
1. Apakah paket benar-benar sampai ke firewall?
   MikroTik : /tool torch interface=ether1
   Linux    : tcpdump -ni eth0 host X
   Cisco    : show policy-map type inspect zone-pair | include Match

2. Aturan mana yang kena?
   MikroTik : /ip firewall filter print stats  → lihat counter
   Linux    : nft list ruleset -a  + log
   Cisco    : show access-lists → "(N matches)"

3. Apakah state koneksi benar?
   MikroTik : /ip firewall connection print where src-address~"10.0.0.5"
   Linux    : conntrack -L -s 10.0.0.5

4. Apakah masalahnya asymmetric routing?
   → periksa apakah trafik balik melewati firewall yang sama

5. Apakah NAT dan filter konsisten?
   → di MikroTik, dstnat diproses SEBELUM filter forward,
     sehingga filter harus mengizinkan alamat INTERNAL
```

### Teknik diagnosis: aturan log sementara

```
# MikroTik — sisipkan aturan log di atas aturan drop
/ip firewall filter add chain=forward src-address=10.0.0.5 action=log \
    log-prefix="DEBUG-10.0.0.5" place-before=0
/log print follow where message~"DEBUG"
# JANGAN LUPA hapus setelah selesai!
/ip firewall filter remove [find log-prefix="DEBUG-10.0.0.5"]
```

> [!WARNING]
> **Selalu hapus aturan debug setelah selesai.** Aturan log pada trafik volume tinggi bisa membanjiri CPU dan disk.

---

## 10. Ringkasan

- Evolusi: packet filter (stateless) → **stateful** → proxy → **NGFW** → cloud (SASE).
- **Stateful inspection** mengingat koneksi, sehingga balasan otomatis diizinkan. **Asymmetric routing merusaknya.**
- Connection state: **new, established, related, invalid** (selalu buang yang invalid).
- Prinsip: **default deny**, least privilege, segmentasi. **DMZ → LAN harus ditolak.**
- **MikroTik chain**: `input` (ke router), `forward` (melewati router), `output` (dari router). Tabel: `filter`, `nat`, `mangle`, `raw`.
- **MikroTik tidak punya implicit deny**, jadi tambahkan `action=drop` eksplisit di akhir setiap chain.
- **FastTrack** menaikkan throughput drastis tetapi **melewati queue dan mangle**; jangan pakai untuk trafik yang di-QoS.
- **Table `raw`** membuang paket sebelum conntrack, sehingga menjadi pertahanan efisien terhadap DDoS.
- **Address list dinamis** MikroTik memungkinkan blacklist otomatis untuk brute force dan port scan.
- **Cisco ZBF**: zona + class-map + policy-map + zone-pair; antar-zona ditolak default, dalam zona diizinkan.
- **IDS out-of-band** (alarm) vs **IPS inline** (blokir). Jalankan IPS baru dalam mode alert-only dulu.
- Jangan blokir seluruh ICMP; jangan lupa firewall IPv6; jangan andalkan NAT sebagai keamanan.

---

## 11. Latihan

1. Jelaskan perbedaan firewall stateless dan stateful dengan contoh konkret.
2. Kenapa trafik `DMZ → LAN` harus ditolak?
3. Anda mengaktifkan FastTrack di MikroTik dan tiba-tiba Simple Queue berhenti bekerja. Jelaskan.
4. Apa perbedaan chain `input`, `forward`, dan `output` di MikroTik? Berikan contoh trafik untuk masing-masing.
5. Firewall stateful membuang trafik balasan yang sah. Apa dugaan Anda?
6. Kapan memakai table `raw` alih-alih `filter` di MikroTik?
7. Rancang kebijakan firewall dasar untuk kantor dengan LAN, DMZ (web server), dan tamu.

<details>
<summary>Jawaban</summary>

1. **Stateless** memeriksa setiap paket secara terpisah tanpa konteks. Untuk mengizinkan browsing web, Anda harus membuat **dua** aturan: satu mengizinkan paket keluar ke port 443, dan satu lagi mengizinkan paket masuk dari port 443 ke port ephemeral tinggi (1024-65535). Aturan kedua ini **sangat longgar**: siapa pun yang mengirim dari port 443 ke port tinggi akan lolos.
   **Stateful** mengingat koneksi dalam tabel. Anda cukup mengizinkan **arah inisiasi** (LAN → internet port 443); ketika balasan datang, firewall mencocokkannya dengan entri yang ada dan mengizinkannya otomatis. Paket dari port 443 yang **tidak** cocok dengan koneksi mana pun akan dibuang. Hasilnya jauh lebih aman dengan aturan yang jauh lebih sedikit.

2. Karena **DMZ dirancang dengan asumsi ia akan diretas.** Server di DMZ (web, mail) menerima koneksi langsung dari internet, sehingga permukaan serangannya paling besar. Kalau salah satunya jatuh, penyerang mendapat pijakan di jaringan Anda.
   Kalau `DMZ → LAN` diizinkan, penyerang bisa **melompat dari server DMZ yang diretas ke jaringan internal** dan mengakses file server, database, workstation, dan Active Directory. Seluruh manfaat memisahkan DMZ hilang.
   Kalau server DMZ **memang perlu** mengakses sesuatu di LAN (mis. database), izinkan **hanya** koneksi spesifik ke host dan port tertentu, bukan akses umum. Lebih baik lagi: tempatkan database di zona ketiga yang terpisah.

3. **FastTrack melewati sebagian besar pemrosesan firewall, termasuk mangle dan queue.** Ketika sebuah koneksi ditandai `fasttrack-connection`, paket-paket berikutnya diteruskan lewat jalur cepat di kernel tanpa melalui rantai mangle, sehingga tidak pernah diberi packet mark, dan Simple Queue/Queue Tree yang bergantung pada mark itu tidak pernah diterapkan. Bahkan Simple Queue berbasis alamat pun terlewati pada banyak versi.
   **Solusi:** kecualikan trafik yang perlu di-queue dari FastTrack, mis. tandai koneksi yang perlu QoS lebih dulu dan terima (`accept`) sebelum aturan fasttrack, atau jangan pakai FastTrack sama sekali kalau QoS adalah prioritas. Trade-off-nya nyata: FastTrack bisa melipatgandakan throughput pada perangkat dengan CPU lemah.

4. - **`input`**: trafik yang **ditujukan ke router itu sendiri**. Contoh: SSH/WinBox dari admin ke router, ping ke alamat router, query DNS ke router (kalau router menjadi resolver), permintaan DHCP dari klien, paket routing protocol (OSPF/BGP) yang ditujukan ke router.
   - **`forward`**: trafik yang **melewati** router dari satu interface ke interface lain. Contoh: PC di LAN membuka situs web, klien mengakses server di DMZ, trafik antar-VLAN.
   - **`output`**: trafik yang **dihasilkan router sendiri**. Contoh: ping dari CLI router, query DNS yang dilakukan router untuk dirinya sendiri, router mengunduh update, router mengirim log ke syslog server, router mengirim email notifikasi.

5. Kemungkinan besar **asymmetric routing**: paket pergi melewati satu jalur/firewall, sementara balasan kembali lewat firewall yang berbeda. Firewall kedua tidak memiliki entri koneksi untuk trafik itu (karena tidak pernah melihat paket SYN pergi), sehingga menandainya sebagai `invalid` dan membuangnya.
   Kemungkinan lain: (a) **timeout koneksi** terlalu pendek sehingga entri sudah dihapus sebelum balasan datang (umum pada aplikasi dengan idle panjang); (b) **NAT** mengubah alamat sehingga tidak cocok dengan entri; (c) aturan `drop connection-state=invalid` membuang paket yang sebenarnya sah karena firewall kehilangan sinkronisasi (mis. setelah restart firewall di tengah koneksi); (d) firewall cluster tanpa sinkronisasi state, dan trafik berpindah node.
   **Diagnosis:** periksa tabel koneksi (`/ip firewall connection print` atau `conntrack -L`), dan lakukan capture di kedua arah untuk memastikan jalurnya simetris.

6. Gunakan **`raw`** ketika Anda ingin membuang trafik **sebelum connection tracking memprosesnya**. Connection tracking memakan CPU dan memori untuk setiap paket dan setiap entri; pada serangan volume tinggi (DDoS, port scan masif, SYN flood), tabel koneksi bisa penuh dan router lumpuh, bahkan kalau aturan `filter` Anda akan membuang trafik itu.
   Dengan menempatkan aturan drop di `raw/prerouting`, paket dibuang **sebelum** conntrack menyentuhnya, sehingga sangat hemat sumber daya.
   **Kasus penggunaan:** membuang bogon dari WAN, membuang alamat yang sudah di-blacklist DDoS, dan membuang trafik ke port yang jelas tidak dipakai. Untuk trafik normal yang perlu inspeksi state, tetap pakai `filter`. Anda juga bisa memakai `action=notrack` di `raw` untuk trafik volume tinggi yang tidak butuh state (mis. DNS server yang sangat sibuk).

7. **Zona:** `LAN` (192.168.10.0/24), `DMZ` (192.168.20.0/24, web server 192.168.20.10), `TAMU` (192.168.30.0/24), `WAN`.
   ```
   /interface list add name=WAN
   /interface list add name=LAN
   /interface list add name=DMZ
   /interface list add name=TAMU
   /interface list member add list=WAN  interface=ether1
   /interface list member add list=LAN  interface=vlan10
   /interface list member add list=DMZ  interface=vlan20
   /interface list member add list=TAMU interface=vlan30

   /ip firewall filter
   # --- INPUT: lindungi router ---
   add chain=input connection-state=established,related action=accept
   add chain=input connection-state=invalid action=drop
   add chain=input protocol=icmp limit=10,20:packet action=accept
   add chain=input in-interface-list=LAN protocol=udp dst-port=53 action=accept comment="DNS dari LAN"
   add chain=input in-interface-list=TAMU protocol=udp dst-port=53,67 action=accept comment="DNS+DHCP tamu"
   add chain=input src-address=192.168.10.0/24 protocol=tcp dst-port=22,8291 action=accept comment="Manajemen"
   add chain=input action=drop comment="Default deny input"

   # --- FORWARD ---
   add chain=forward connection-state=established,related action=accept
   add chain=forward connection-state=invalid action=drop

   # Internet -> DMZ: hanya web
   add chain=forward in-interface-list=WAN out-interface-list=DMZ \
       protocol=tcp dst-port=80,443 dst-address=192.168.20.10 action=accept comment="Publik ke web server"

   # LAN -> semua
   add chain=forward in-interface-list=LAN out-interface-list=WAN action=accept
   add chain=forward in-interface-list=LAN out-interface-list=DMZ action=accept

   # DMZ -> internet: terbatas (update, DNS)
   add chain=forward in-interface-list=DMZ out-interface-list=WAN \
       protocol=tcp dst-port=80,443 action=accept comment="DMZ update"
   add chain=forward in-interface-list=DMZ out-interface-list=WAN \
       protocol=udp dst-port=53 action=accept

   # DMZ -> LAN: DITOLAK (paling penting!)
   add chain=forward in-interface-list=DMZ out-interface-list=LAN action=drop \
       comment="DMZ TIDAK BOLEH ke LAN"

   # TAMU: hanya internet, isolasi total dari LAN dan DMZ
   add chain=forward in-interface-list=TAMU out-interface-list=WAN action=accept
   add chain=forward in-interface-list=TAMU action=drop comment="Tamu isolasi"

   add chain=forward action=drop comment="Default deny forward"

   /ip firewall nat
   add chain=srcnat out-interface-list=WAN action=masquerade
   add chain=dstnat in-interface-list=WAN protocol=tcp dst-port=80,443 \
       action=dst-nat to-addresses=192.168.20.10
   ```
   Tambahan yang disarankan: isolasi klien tamu satu sama lain (`/interface bridge port set ... horizon=1`), rate limit untuk tamu, dan aturan `raw` untuk bogon.

</details>

---

## 12. Sumber

- NIST SP 800-41 Rev.1, Guidelines on Firewalls and Firewall Policy
- Cisco, *Zone-Based Policy Firewall Design and Application Guide*
- MikroTik: https://help.mikrotik.com/docs/display/ROS/Firewall
- nftables wiki: https://wiki.nftables.org/
- Suricata: https://suricata.io/ · Zeek: https://zeek.org/
- Cisco CCNA 200-301 v1.1, topik 5.1 (key security concepts) dan 5.6 (ACL)

---

**Berikutnya:** `10-wireless/01-rf-dasar.md`. Memasuki dunia nirkabel.

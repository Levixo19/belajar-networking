# 19.1 — Pengenalan MikroTik dan RouterOS

> **Prasyarat:** `04-network-layer/05`, `03-data-link/03`
> **Tujuan:** Anda paham arsitektur RouterOS, bisa mengakses dan mengonfigurasi perangkat MikroTik, dan memahami filosofi CLI-nya.

> 📌 **Kenapa MikroTik penting di Indonesia?** MikroTik mendominasi pasar ISP kecil-menengah, RT/RW-Net, warnet, hotel, dan UKM karena harganya jauh lebih murah daripada Cisco dengan fitur yang setara atau lebih lengkap. Banyak lowongan network engineer di Indonesia mensyaratkan MikroTik, bukan Cisco.

---

## 1. Apa Itu MikroTik

**MikroTik** adalah perusahaan Latvia (didirikan 1996) yang membuat:
- **RouterOS** — sistem operasi jaringan berbasis Linux
- **RouterBOARD** — perangkat keras yang menjalankan RouterOS
- **SwOS** — OS sederhana untuk switch murni
- **The Dude** — aplikasi monitoring jaringan (gratis)

### Yang membedakan MikroTik

| Aspek | MikroTik | Cisco |
|---|---|---|
| Harga | Sangat murah (Rp 300 rb – 20 jt) | Mahal (Rp 5 jt – ratusan juta) |
| Lisensi | Sekali beli, semua fitur | Bertingkat, banyak fitur berbayar |
| OS | Linux-based, satu image untuk semua | IOS/IOS-XE/NX-OS berbeda per platform |
| Fitur | Sangat lengkap sejak level dasar | Bergantung lisensi & model |
| Antarmuka | CLI, WinBox (GUI), WebFig, API | CLI dominan |
| Dokumentasi | Wiki + komunitas | Sangat lengkap, resmi |
| Dukungan | Forum komunitas | TAC berbayar |
| Sertifikasi | MTCNA → MTCRE/MTCWE/... | CCNA → CCNP → CCIE |

💡 **Filosofi MikroTik: berikan semua fitur, biarkan pengguna yang mengaturnya.** Ini memberi fleksibilitas luar biasa tetapi juga berarti lebih mudah salah konfigurasi.

⚠️ **Konsekuensi harga murah:** kualitas hardware bervariasi, dan sebagian model punya CPU lemah. Untuk trafik besar, perhatikan spesifikasi CPU dan apakah fitur yang dipakai didukung **fast path**/**FastTrack** (offload) atau harus diproses per-paket.

---

## 2. Lini Produk

| Lini | Untuk | Contoh |
|---|---|---|
| **hEX / hAP** | SOHO, rumah | hEX S, hAP ac³, hAP ax² |
| **RB (RouterBOARD)** | Umum | RB4011, RB5009 |
| **CCR (Cloud Core Router)** | ISP, throughput tinggi | CCR2004, CCR2116 |
| **CRS (Cloud Router Switch)** | Switch dengan RouterOS | CRS326, CRS354 |
| **CSS** | Switch murni (SwOS) | CSS326 |
| **Wireless** | Outdoor, PtP, PtMP | SXT, LHG, Wireless Wire, mANT |
| **CHR (Cloud Hosted Router)** | Virtual machine | Berjalan di VMware/KVM/Hyper-V/cloud |

💡 **CHR gratis** dalam mode trial dengan batas 1 Mbps per interface — sangat cocok untuk **belajar dan lab**. Lisensi berbayar membuka kecepatan penuh.

### Versi RouterOS

```
RouterOS v6  → versi lama, masih banyak dipakai; stabil dan sangat terdokumentasi
RouterOS v7  → versi saat ini; menambah dukungan container, WireGuard,
               ROSE storage, BGP/OSPF yang ditulis ulang, dan perbaikan besar

⚠️ v6 dan v7 punya beberapa perbedaan sintaks penting (terutama routing).
   Selalu periksa versi: /system resource print
```

---

## 3. Cara Mengakses RouterOS

| Metode | Port | Catatan |
|---|---|---|
| **WinBox** | TCP 8291 | GUI khas MikroTik; bisa lewat **MAC address** (berguna kalau IP hilang!) |
| **WebFig** | TCP 80/443 | GUI berbasis browser |
| **SSH** | TCP 22 | CLI |
| **Telnet** | TCP 23 | ⚠️ Matikan |
| **API** | TCP 8728 / 8729 (TLS) | Untuk otomasi |
| **REST API** | HTTPS (v7) | Modern |
| **Console/serial** | — | Untuk pemulihan |

💡 **WinBox lewat MAC address adalah penyelamat.** Kalau Anda salah konfigurasi dan kehilangan akses IP, WinBox tetap bisa terhubung lewat layer 2 selama Anda berada di segmen yang sama. Ini fitur yang tidak dimiliki Cisco.

```
WinBox → tab "Neighbors" → pilih perangkat berdasarkan MAC → Connect
```

⚠️ **Amankan akses ini di produksi:**
```
/tool mac-server set allowed-interface-list=none
/tool mac-server mac-winbox set allowed-interface-list=MGMT
```

### Kredensial default

```
Username : admin
Password  : (kosong) pada RouterOS lama
            atau tertera di stiker perangkat (RouterOS 6.45+)
```

⚠️ **Langkah pertama SELALU:** ganti password admin dan buat user baru.

---

## 4. Struktur CLI RouterOS

CLI RouterOS berbentuk **hierarki menu** seperti struktur direktori.

```
/interface
/ip address
/ip route
/ip firewall filter
/ip firewall nat
/system identity
/user
```

### Navigasi

```
[admin@MikroTik] > /ip address           ← masuk ke menu
[admin@MikroTik] /ip/address> print      ← jalankan perintah di menu itu
[admin@MikroTik] /ip/address> ..         ← naik satu level
[admin@MikroTik] /ip/address> /          ← kembali ke root

# Atau jalankan langsung tanpa masuk menu:
[admin@MikroTik] > /ip address print
```

### Perintah dasar di setiap menu

```
print              tampilkan daftar
add                tambah entri
set                ubah entri
remove             hapus entri
enable / disable   aktifkan / nonaktifkan
move               ubah urutan (penting untuk firewall!)
find               cari entri
export             tampilkan konfigurasi sebagai perintah
comment            beri keterangan
```

### Fitur CLI yang mempercepat kerja

```
?                  bantuan kontekstual
Tab                autocomplete
[Tab][Tab]         tampilkan semua opsi

# Singkatan perintah — RouterOS menerima singkatan yang tidak ambigu
/ip add pr         = /ip address print
/int pr            = /interface print
/ip fi fi pr       = /ip firewall filter print

# Filter output
/ip address print where interface=ether1
/interface print where running=yes
/ip route print where dst-address~"192.168"

# Detail dan format
/ip address print detail
/interface print stats
/ip firewall filter print terse

# Jalankan perintah pada banyak entri sekaligus
/interface set [find type=ether] disabled=no
/ip firewall filter remove [find comment="lama"]
```

💡 **`[find ...]` adalah fitur paling kuat di RouterOS CLI** — memungkinkan operasi massal berdasarkan kriteria, mirip pipe di Linux.

### Konfigurasi sebagai teks

```
# Lihat seluruh konfigurasi sebagai perintah (sangat berguna!)
/export

# Hanya bagian tertentu
/ip firewall export
/interface export

# Simpan ke file
/export file=backup-config

# Sembunyikan data sensitif
/export hide-sensitive

# Backup biner (termasuk password, hanya untuk perangkat yang sama)
/system backup save name=backup-lengkap
/system backup load name=backup-lengkap
```

⚠️ **Perbedaan `/export` dan `/system backup`:**
| | `/export` | `/system backup` |
|---|---|---|
| Format | Teks (perintah RouterOS) | Biner |
| Bisa dibaca/diedit | ✅ Ya | ❌ Tidak |
| Bisa dipulihkan ke perangkat lain | ✅ Ya | ⚠️ Terbatas (harus model sama) |
| Berisi password | Tidak (dengan `hide-sensitive`) | ✅ Ya |
| Untuk | Dokumentasi, migrasi, version control | Pemulihan cepat |

💡 **Praktik terbaik: gunakan keduanya.** `/export` untuk disimpan di Git, `/system backup` untuk pemulihan cepat.

---

## 5. Konfigurasi Awal Wajib

### Langkah pertama pada perangkat baru

```
# 1. Ganti identitas
/system identity set name=RTR-KANTOR-01

# 2. Buat user baru dengan hak penuh, lalu hapus/nonaktifkan admin default
/user add name=netadmin password=RahasiaKuat123! group=full comment="Admin utama"
/user set admin disabled=yes
   # atau: /user remove admin  (setelah memastikan user baru bisa login!)

# 3. Set zona waktu dan NTP
/system clock set time-zone-name=Asia/Jakarta
/system ntp client set enabled=yes servers=id.pool.ntp.org,0.pool.ntp.org

# 4. Matikan layanan yang tidak dipakai
/ip service disable telnet,ftp,api,www
/ip service set ssh port=22
/ip service set winbox address=192.168.99.0/24
/ip service set www-ssl disabled=no certificate=...

# 5. Matikan penemuan perangkat di interface publik
/ip neighbor discovery-settings set discover-interface-list=LAN

# 6. Matikan bandwidth test server (sering disalahgunakan)
/tool bandwidth-server set enabled=no

# 7. Batasi akses MAC (setelah konfigurasi IP selesai)
/tool mac-server set allowed-interface-list=LAN
/tool mac-server mac-winbox set allowed-interface-list=LAN
/tool mac-server ping set enabled=no

# 8. Nonaktifkan Romon jika tidak dipakai
/tool romon set enabled=no
```

### Konfigurasi default MikroTik

Perangkat MikroTik baru sering datang dengan **konfigurasi default** (bridge LAN, DHCP server, firewall dasar, NAT).

```
# Lihat apa yang ada
/system default-configuration print

# Hapus semua konfigurasi default (untuk mulai dari nol)
/system reset-configuration no-defaults=yes skip-backup=yes

# Reset tetapi pertahankan akses (aman untuk pemula)
/system reset-configuration
```

⚠️ **`no-defaults=yes` menghapus SEMUANYA**, termasuk konfigurasi IP. Setelah reset, akses hanya lewat **WinBox MAC** atau console. Pastikan Anda bisa menjangkaunya secara fisik atau lewat layer 2.

---

## 6. Interface

```
# Lihat semua interface
/interface print
/interface print stats
/interface ethernet print

# Beri nama yang bermakna (SANGAT disarankan)
/interface set ether1 name=WAN-ISP-A comment="Uplink Telkom"
/interface set ether2 name=LAN-TRUNK

# Aktifkan/nonaktifkan
/interface enable ether3
/interface disable ether3

# Lihat trafik real-time
/interface monitor-traffic ether1
/tool traffic-monitor interface=ether1

# Uji kabel (RouterBOARD tertentu)
/interface ethernet cable-test ether1
```

### Jenis interface di RouterOS

| Jenis | Fungsi |
|---|---|
| `ethernet` | Port fisik |
| `bridge` | Switch software (setara VLAN/switching) |
| `vlan` | Subinterface VLAN 802.1Q |
| `bonding` | Link aggregation (setara EtherChannel) |
| `wireless` / `wifi` | Radio (v6 `wireless`, v7 `wifi`) |
| `pppoe-client` / `pppoe-server` | PPPoE |
| `l2tp`, `pptp`, `sstp`, `ovpn`, `wireguard` | VPN |
| `eoip` | Ethernet over IP (tunnel L2 khas MikroTik) |
| `gre`, `ipip` | Tunnel |
| `vrrp` | Redundansi gateway |
| `veth` | Virtual ethernet (untuk container di v7) |

---

## 7. IP Address dan Routing Dasar

```
# Tambah alamat
/ip address add address=192.168.1.1/24 interface=bridge-LAN comment="Gateway LAN"
/ip address add address=203.0.113.10/30 interface=WAN-ISP-A

# Lihat
/ip address print
/ip address print where interface=bridge-LAN

# DHCP client di WAN
/ip dhcp-client add interface=WAN-ISP-A disabled=no use-peer-dns=no add-default-route=yes

# Static route
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.9 comment="Default ke ISP-A"
/ip route add dst-address=10.0.0.0/8 gateway=192.168.1.254

# Route dengan distance (setara AD; lebih kecil lebih disukai)
/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.9 distance=1
/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.9 distance=10   ← cadangan

# Blackhole
/ip route add dst-address=192.168.99.0/24 type=blackhole

# Lihat routing table
/ip route print
/ip route print where active=yes
/ip route print detail
```

⚠️ **Di RouterOS v7, menu routing berubah:**
```
v6: /ip route
v7: /ip route  (masih ada, tetapi routing protocol pindah ke /routing)
    /routing ospf, /routing bgp, /routing filter
```

### Failover dengan Netwatch atau Recursive Route

```
# Cara 1: recursive next-hop dengan check-gateway
/ip route add dst-address=8.8.8.8 gateway=203.0.113.9 scope=10
/ip route add dst-address=0.0.0.0/0 gateway=8.8.8.8 target-scope=11 distance=1 check-gateway=ping
/ip route add dst-address=0.0.0.0/0 gateway=198.51.100.9 distance=10

# Cara 2: Netwatch (lebih fleksibel)
/tool netwatch add host=8.8.8.8 interval=10s \
    up-script="/ip route enable [find comment=ISP-A]" \
    down-script="/ip route disable [find comment=ISP-A]"
```

💡 **`check-gateway=ping`** membuat RouterOS memantau gateway dan menonaktifkan rute otomatis kalau tidak merespons — setara IP SLA sederhana di Cisco.

---

## 8. Padanan Istilah: Cisco ↔ MikroTik ↔ Linux

Tabel ini akan sangat membantu Anda berpindah antar-platform.

| Konsep | Cisco IOS | MikroTik RouterOS | Linux |
|---|---|---|---|
| Lihat interface | `show ip interface brief` | `/interface print` | `ip -br addr` |
| Alamat IP | `ip address 1.1.1.1 255.255.255.0` | `/ip address add address=1.1.1.1/24 interface=X` | `ip addr add 1.1.1.1/24 dev X` |
| Routing table | `show ip route` | `/ip route print` | `ip route show` |
| Static route | `ip route 10.0.0.0 255.0.0.0 1.1.1.2` | `/ip route add dst-address=10.0.0.0/8 gateway=1.1.1.2` | `ip route add 10.0.0.0/8 via 1.1.1.2` |
| Default route | `ip route 0.0.0.0 0.0.0.0 X` | `/ip route add dst-address=0.0.0.0/0 gateway=X` | `ip route add default via X` |
| AD / metric | `distance` / AD | `distance` | `metric` |
| ARP table | `show ip arp` | `/ip arp print` | `ip neigh show` |
| VLAN | `vlan 10` + `switchport` | `/interface vlan add vlan-id=10` + bridge VLAN | `ip link add link eth0 name eth0.10 type vlan id 10` |
| Trunk | `switchport mode trunk` | `bridge vlan tagged=` | bridge vlan |
| Bridge/switch | (bawaan switch) | `/interface bridge` | `ip link add br0 type bridge` |
| NAT overload | `ip nat inside source list 1 int X overload` | `/ip firewall nat add chain=srcnat out-interface=X action=masquerade` | `nft ... masquerade` |
| Port forward | `ip nat inside source static tcp ...` | `action=dst-nat to-addresses= to-ports=` | `nft ... dnat to` |
| ACL / firewall | `access-list` / `ip access-group` | `/ip firewall filter` | `nftables` / `iptables` |
| DHCP server | `ip dhcp pool` | `/ip dhcp-server` | `kea` / `dnsmasq` |
| DNS | `ip name-server` | `/ip dns set servers=` | `/etc/resolv.conf` |
| NTP | `ntp server X` | `/system ntp client set servers=X` | `chrony` |
| Syslog | `logging host X` | `/system logging action add remote=X` | `rsyslog` |
| SNMP | `snmp-server community` | `/snmp set enabled=yes` | `snmpd` |
| Simpan config | `write memory` | **otomatis** (tidak perlu!) | tergantung |
| Backup config | `copy run tftp` | `/export file=X` | file konfigurasi |
| Reload | `reload` | `/system reboot` | `reboot` |
| Ping | `ping X` | `/ping X` | `ping X` |
| Traceroute | `traceroute X` | `/tool traceroute X` | `traceroute X` |
| Capture paket | SPAN + eksternal | `/tool sniffer` | `tcpdump` |
| Bandwidth test | — | `/tool bandwidth-test` | `iperf3` |
| Neighbor discovery | CDP/LLDP | `/ip neighbor print` (MNDP+LLDP+CDP) | `lldpctl` |
| Debug | `debug ip packet` | `/log print` + `/tool sniffer` | `tcpdump` |

⚠️ **Perbedaan paling penting: RouterOS MENYIMPAN KONFIGURASI OTOMATIS.** Tidak ada `write memory`. Begitu Anda menekan Enter, konfigurasi tersimpan permanen — **termasuk kesalahan yang mengunci Anda dari perangkat**.

💡 **Karena itu gunakan `/system scheduler` atau Safe Mode** saat mengubah konfigurasi kritis dari jarak jauh (lihat §9).

---

## 9. Safe Mode — Fitur Penyelamat

Safe Mode membatalkan semua perubahan otomatis kalau koneksi Anda terputus.

```
# Di CLI: tekan Ctrl+X
[admin@MikroTik] <SAFE> >           ← indikator Safe Mode aktif

# Lakukan perubahan berisiko...
/ip firewall filter add chain=input action=drop

# Kalau koneksi PUTUS → semua perubahan dalam Safe Mode DIBATALKAN otomatis
# Kalau berhasil, tekan Ctrl+X lagi untuk menerapkan permanen
```

Di WinBox: klik tombol **"Safe Mode"** di pojok kiri atas.

💡 **SELALU gunakan Safe Mode** saat mengubah firewall, NAT, atau konfigurasi interface dari jarak jauh. Ini menyelamatkan Anda dari perjalanan ke lokasi perangkat.

⚠️ Safe Mode punya batas jumlah perubahan yang bisa dilacak. Untuk perubahan besar, gunakan scheduler:
```
# Jadwalkan reboot 5 menit lagi; batalkan kalau perubahan berhasil
/system scheduler add name=safety-reboot start-time=startup interval=5m \
    on-event="/system reboot"
# ... lakukan perubahan ...
# kalau berhasil:
/system scheduler remove safety-reboot
```

---

## 10. Sistem dan Pemeliharaan

```
# Informasi sistem
/system resource print
/system routerboard print
/system health print              ← suhu, voltase (model tertentu)
/system license print

# Update RouterOS
/system package update check-for-updates
/system package update download
/system reboot

# Update firmware RouterBOARD (SETELAH update RouterOS)
/system routerboard upgrade
/system reboot

# Log
/log print
/log print where topics~"error"
/log print follow                 ← seperti tail -f

# Konfigurasi logging
/system logging action set memory memory-lines=1000
/system logging add topics=firewall action=memory
/system logging action add name=remote-syslog target=remote remote=192.168.99.50
/system logging add topics=critical,error action=remote-syslog

# Penggunaan sumber daya
/tool profile                     ← proses apa yang memakan CPU
/system resource cpu print
/system resource monitor
```

⚠️ **Selalu update RouterOS sebelum firmware RouterBOARD**, dan reboot di antaranya. Urutan terbalik bisa menyebabkan perangkat tidak bisa boot.

⚠️ **RouterOS punya riwayat kerentanan keamanan yang serius** (mis. CVE-2018-14847 yang memungkinkan pengambilalihan penuh). **Selalu jalankan versi terbaru** dan jangan pernah mengekspos WinBox/API ke internet.

---

## 11. Kesalahan Umum Pemula MikroTik

⚠️ **1. Lupa bahwa konfigurasi tersimpan otomatis.** Tidak ada "batalkan" — gunakan **Safe Mode**.

⚠️ **2. Firewall `chain=input` yang memblokir diri sendiri.** Aturan `drop` di chain input tanpa mengizinkan akses manajemen akan mengunci Anda.

⚠️ **3. Mengekspos WinBox (8291) dan API (8728) ke internet.** Target serangan utama. Batasi dengan `/ip service set winbox address=`.

⚠️ **4. Memakai `masquerade` di interface yang salah.** Menyebabkan seluruh trafik LAN di-NAT ke dirinya sendiri.

⚠️ **5. Salah urutan aturan firewall.** RouterOS memproses **dari atas ke bawah** — aturan pertama yang cocok menang. Gunakan `/ip firewall filter move`.

⚠️ **6. Tidak memakai interface list.** Menulis aturan per interface membuat konfigurasi sulit dipelihara. Gunakan `/interface list`.

⚠️ **7. Lupa `check-gateway`** pada rute failover — rute tetap aktif walau gateway mati.

⚠️ **8. Tidak mengganti password default** dan tidak menonaktifkan user `admin`.

---

## 12. Ringkasan

- **MikroTik RouterOS** adalah OS jaringan berbasis Linux; murah, sangat lengkap fiturnya, dan **dominan di Indonesia** untuk ISP kecil, RT/RW-Net, hotel, dan UKM.
- Akses: **WinBox (8291, bisa lewat MAC address!)**, WebFig, SSH, API, REST API.
- CLI berbentuk **hierarki menu**; perintah inti: `print`, `add`, `set`, `remove`, `enable`, `disable`, `move`, `find`, `export`, `comment`.
- **`[find ...]`** memungkinkan operasi massal berdasarkan kriteria.
- ⚠️ **Konfigurasi tersimpan OTOMATIS** — tidak ada `write memory`, dan tidak ada undo. Gunakan **Safe Mode (Ctrl+X)** untuk perubahan berisiko dari jarak jauh.
- **`/export`** menghasilkan konfigurasi teks (untuk Git dan dokumentasi); **`/system backup`** menghasilkan file biner (untuk pemulihan cepat).
- Konfigurasi awal wajib: ganti identitas, buat user baru + nonaktifkan `admin`, set NTP & zona waktu, matikan layanan tidak terpakai, batasi MAC server dan neighbor discovery.
- **`distance`** di RouterOS setara **administrative distance** di Cisco; **`check-gateway=ping`** memberi failover otomatis.
- **CHR gratis** dengan batas 1 Mbps — sempurna untuk belajar dan lab.
- Selalu **update RouterOS sebelum firmware RouterBOARD**, dan jangan pernah ekspos WinBox/API ke internet.

---

## 13. Latihan

1. Apa perbedaan `/export` dan `/system backup`, dan kapan memakai masing-masing?
2. Anda mengonfigurasi firewall dari jarak jauh dan khawatir terkunci. Apa yang harus dilakukan?
3. Bagaimana cara menonaktifkan semua interface bertipe ethernet dalam satu perintah?
4. Sebutkan padanan MikroTik untuk: `show ip route`, `ip route 0.0.0.0 0.0.0.0 1.1.1.1`, `write memory`.
5. Kenapa WinBox lewat MAC address penting?
6. Apa risiko `/system reset-configuration no-defaults=yes` dan kapan Anda memakainya?
7. Anda punya dua ISP. Bagaimana membuat ISP-B menjadi cadangan otomatis?

<details>
<summary>Jawaban</summary>

1. **`/export`** menghasilkan konfigurasi dalam bentuk **teks berisi perintah RouterOS** — bisa dibaca, diedit, disimpan di Git, dibandingkan (diff), dan diterapkan ke perangkat lain (bahkan model berbeda). Tidak berisi password kalau memakai `hide-sensitive`. Gunakan untuk **dokumentasi, version control, dan migrasi**.
   **`/system backup`** menghasilkan file **biner** yang berisi seluruh state termasuk password, sertifikat, dan pengaturan yang tidak muncul di export. Pemulihannya instan tetapi **hanya andal ke perangkat model dan versi yang sama**. Gunakan untuk **pemulihan cepat setelah kegagalan**.
   Praktik terbaik: **pakai keduanya** — export harian ke Git, backup sebelum perubahan besar.

2. **Aktifkan Safe Mode dengan `Ctrl+X`** (atau tombol Safe Mode di WinBox). Semua perubahan yang dilakukan dalam Safe Mode akan **dibatalkan otomatis** kalau koneksi terputus — sehingga perangkat kembali ke kondisi yang bisa diakses. Setelah memastikan perubahan berhasil dan Anda masih terhubung, tekan `Ctrl+X` lagi untuk menerapkannya permanen.
   Untuk perubahan yang sangat besar (melebihi kapasitas Safe Mode), gunakan scheduler yang menjadwalkan reboot beberapa menit lagi, lalu hapus scheduler itu kalau perubahan berhasil.

3. ```
   /interface set [find type=ether] disabled=yes
   ```
   Sintaks `[find kriteria]` mengembalikan daftar semua entri yang cocok, dan perintah `set` diterapkan ke semuanya sekaligus. ⚠️ Perintah ini akan memutus akses Anda sendiri — dalam praktik tambahkan pengecualian, mis. `[find type=ether and name!=ether1]`.

4. | Cisco | MikroTik |
   |---|---|
   | `show ip route` | `/ip route print` |
   | `ip route 0.0.0.0 0.0.0.0 1.1.1.1` | `/ip route add dst-address=0.0.0.0/0 gateway=1.1.1.1` |
   | `write memory` | **tidak ada** — RouterOS menyimpan otomatis setiap perubahan |

5. Karena WinBox dapat terhubung ke perangkat MikroTik lewat **layer 2 (MAC address)** tanpa memerlukan konektivitas IP sama sekali. Ini menyelamatkan Anda ketika: (a) salah konfigurasi IP address atau firewall sehingga akses IP hilang; (b) perangkat baru direset dan belum punya alamat; (c) VLAN salah sehingga IP tidak terjangkau; (d) DHCP gagal.
   Syaratnya Anda berada di **segmen layer 2 yang sama**. Cisco tidak punya padanan fitur ini — kalau terkunci, Anda harus datang secara fisik dan memakai kabel console.
   ⚠️ Karena itu juga, **batasi MAC server di produksi** (`/tool mac-server set allowed-interface-list=MGMT`) agar tidak bisa disalahgunakan orang lain di segmen yang sama.

6. **Risiko:** perintah ini menghapus **seluruh konfigurasi**, termasuk alamat IP, bridge, DHCP, dan firewall — perangkat kembali benar-benar kosong. Setelah reboot, **tidak ada cara mengaksesnya lewat IP**; hanya lewat **WinBox MAC address** atau **kabel console/serial**. Kalau perangkat berada di lokasi jauh dan Anda tidak berada di segmen L2 yang sama, perangkat menjadi tidak terjangkau sampai ada yang datang secara fisik.
   **Kapan dipakai:** saat menyiapkan perangkat baru dari nol dengan konfigurasi standar organisasi (agar tidak ada sisa konfigurasi default yang mengganggu), atau saat memindahkan perangkat bekas ke lingkungan baru. Lakukan **hanya ketika Anda punya akses fisik** atau berada di segmen L2 yang sama.

7. Dua pendekatan:
   ```
   # Cara 1: distance + check-gateway (paling sederhana)
   /ip route add dst-address=0.0.0.0/0 gateway=203.0.113.9 distance=1 check-gateway=ping comment="ISP-A"
   /ip route add dst-address=0.0.0.0/0 gateway=198.51.100.9 distance=10 comment="ISP-B backup"
   ```
   `check-gateway=ping` membuat RouterOS memantau gateway; kalau tidak merespons, rute dinonaktifkan dan rute dengan distance lebih tinggi (ISP-B) mengambil alih.

   ```
   # Cara 2: recursive route — menguji konektivitas SESUNGGUHNYA, bukan hanya gateway
   /ip route add dst-address=8.8.8.8/32 gateway=203.0.113.9 scope=10 comment="probe ISP-A"
   /ip route add dst-address=0.0.0.0/0 gateway=8.8.8.8 target-scope=11 distance=1 check-gateway=ping
   /ip route add dst-address=0.0.0.0/0 gateway=198.51.100.9 distance=10
   ```
   Cara kedua lebih baik karena menguji jalur **end-to-end** (seperti IP SLA di Cisco) — kalau gateway ISP hidup tetapi internet di hulunya mati, failover tetap terjadi.
   Jangan lupa: NAT masquerade harus dikonfigurasi untuk **kedua** interface WAN, dan pertimbangkan `/ip firewall mangle` untuk connection marking agar sesi tidak putus saat failover.

</details>

---

## 14. Sumber

- MikroTik Documentation — https://help.mikrotik.com/docs/
- MikroTik Wiki (v6) — https://wiki.mikrotik.com/
- MikroTik Forum — https://forum.mikrotik.com/
- MTCNA (MikroTik Certified Network Associate) — kurikulum resmi
- MikroTik Download (termasuk CHR untuk lab) — https://mikrotik.com/download

---

**Berikutnya:** `19-mikrotik/02-bridge-vlan-switching.md` — switching dan VLAN di RouterOS.

# 13.1 — iproute2: Perangkat Jaringan Linux Modern

> **Prasyarat:** `04-network-layer/05`, `03-data-link/01`
> **Tujuan:** Anda menguasai suite `ip`, bisa mengelola alamat/rute/tetangga, dan mengonfigurasi jaringan secara persisten di Linux.

> 📌 **Kenapa Linux networking penting?** Setiap server, container, dan sebagian besar cloud berjalan di Linux. Router modern (termasuk banyak appliance) berbasis Linux. Menguasai jaringan Linux adalah keterampilan inti untuk sysadmin, DevOps, cloud engineer, dan network engineer.

---

## 1. iproute2 Menggantikan net-tools

Perintah lama (`ifconfig`, `route`, `arp`, `netstat`) sudah **usang** dan tidak dikembangkan lagi. Suite **iproute2** (`ip`, `ss`, `tc`) menggantikannya.

| Lama (net-tools) | Baru (iproute2) | Fungsi |
|---|---|---|
| `ifconfig` | `ip addr`, `ip link` | Alamat & interface |
| `route` | `ip route` | Routing |
| `arp` | `ip neigh` | Tabel tetangga |
| `netstat` | `ss` | Socket |
| `iptunnel` | `ip tunnel` | Tunnel |
| `brctl` | `ip link ... type bridge` | Bridge |
| `vconfig` | `ip link ... type vlan` | VLAN |

⚠️ **`ifconfig` tidak menampilkan semua alamat** (mis. beberapa alamat IPv6 atau alamat sekunder). Selalu pakai `ip` untuk hasil yang akurat.

💡 Semua perintah `ip` bisa disingkat selama tidak ambigu: `ip a` = `ip addr`, `ip r` = `ip route`, `ip l` = `ip link`, `ip n` = `ip neigh`.

---

## 2. `ip link` — Interface (Layer 1/2)

```bash
# Lihat semua interface
$ ip link show
$ ip -br link show          # ringkas
$ ip -s link show eth0      # dengan statistik

# Naik/turunkan interface
$ sudo ip link set eth0 up
$ sudo ip link set eth0 down

# Ubah MTU
$ sudo ip link set eth0 mtu 9000

# Ubah MAC address
$ sudo ip link set eth0 address 02:11:22:33:44:55

# Ganti nama
$ sudo ip link set eth0 name wan0

# Mode promiscuous (untuk sniffing)
$ sudo ip link set eth0 promisc on

# Statistik detail
$ ip -s -s link show eth0    # -s dua kali = lebih detail
```

Membaca output:
```bash
$ ip -br link show
lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>
eth0             UP             00:1a:2b:3c:4d:5e <BROADCAST,MULTICAST,UP,LOWER_UP>
eth1             DOWN           00:1a:2b:3c:4d:5f <BROADCAST,MULTICAST>
wg0              UNKNOWN        <POINTOPOINT,NOARP,UP,LOWER_UP>
```

⚠️ **Perhatikan `UP` vs `LOWER_UP`:**
- **`UP`** = interface diaktifkan secara administratif (`ip link set up`)
- **`LOWER_UP`** = ada **carrier fisik** (kabel tersambung, link naik)
- `NO-CARRIER` = diaktifkan tetapi tidak ada sinyal (kabel dicabut)

Ini setara "administratively up" vs "line protocol up" di Cisco.

---

## 3. `ip addr` — Alamat IP (Layer 3)

```bash
# Lihat alamat
$ ip addr show
$ ip -4 addr show           # IPv4 saja
$ ip -6 addr show           # IPv6 saja
$ ip -br addr show          # ringkas
$ ip addr show eth0

# Tambah alamat (sementara — hilang setelah reboot)
$ sudo ip addr add 192.168.1.50/24 dev eth0
$ sudo ip addr add 192.168.1.51/24 dev eth0    # alamat sekunder
$ sudo ip -6 addr add 2001:db8::50/64 dev eth0

# Hapus alamat
$ sudo ip addr del 192.168.1.51/24 dev eth0

# Hapus SEMUA alamat dari interface
$ sudo ip addr flush dev eth0
```

Membaca output:
```bash
$ ip addr show eth0
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 00:1a:2b:3c:4d:5e brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.50/24 brd 192.168.1.255 scope global dynamic eth0
       valid_lft 85021sec preferred_lft 85021sec
    inet6 2001:db8::50/64 scope global
       valid_lft forever preferred_lft forever
    inet6 fe80::21a:2bff:fe3c:4d5e/64 scope link
       valid_lft forever preferred_lft forever
```

| Field | Arti |
|---|---|
| `scope global` | Dapat dirutekan |
| `scope link` | Hanya link lokal (link-local) |
| `scope host` | Hanya host ini (loopback) |
| `dynamic` | Dari DHCP |
| `valid_lft` / `preferred_lft` | Lifetime alamat (DHCP/SLAAC) |
| `brd` | Broadcast address |

---

## 4. `ip route` — Routing

```bash
# Lihat routing table
$ ip route show
$ ip -6 route show
$ ip route show table all           # semua tabel

# Rute mana yang dipakai untuk tujuan tertentu (SANGAT BERGUNA)
$ ip route get 8.8.8.8
$ ip route get 192.168.1.20

# Tambah rute
$ sudo ip route add 10.0.0.0/8 via 192.168.1.254
$ sudo ip route add 10.0.0.0/8 via 192.168.1.254 dev eth0
$ sudo ip route add default via 192.168.1.1
$ sudo ip route add 192.168.5.0/24 dev eth1        # directly connected

# Rute dengan metric (lebih kecil lebih disukai)
$ sudo ip route add default via 192.168.1.1 metric 100
$ sudo ip route add default via 192.168.2.1 metric 200   # cadangan

# Blackhole
$ sudo ip route add blackhole 192.168.99.0/24

# Hapus rute
$ sudo ip route del 10.0.0.0/8
$ sudo ip route del default
```

Membaca output:
```bash
$ ip route show
default via 192.168.1.1 dev eth0 proto dhcp src 192.168.1.50 metric 100
10.0.0.0/8 via 192.168.1.254 dev eth0
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.50
```

| Field | Arti |
|---|---|
| `default` | Rute default (0.0.0.0/0) |
| `via X` | Next hop |
| `dev X` | Interface keluar |
| `proto kernel` | Dibuat otomatis oleh kernel (connected) |
| `proto dhcp` | Dari DHCP |
| `proto static` | Dikonfigurasi manual |
| `scope link` | Directly connected |
| `src X` | Alamat sumber yang dipakai |
| `metric X` | Prioritas (kecil = lebih disukai) |

```bash
$ ip route get 8.8.8.8
8.8.8.8 via 192.168.1.1 dev eth0 src 192.168.1.50 uid 1000
    cache
```
💡 **`ip route get` adalah alat diagnostik terbaik** — menunjukkan rute mana yang **benar-benar dipakai** untuk tujuan tertentu, termasuk alamat sumber yang dipilih. Setara `show ip cef exact-route` di Cisco.

---

## 5. `ip neigh` — Tabel Tetangga (ARP/NDP)

```bash
# Lihat tabel
$ ip neigh show
$ ip -6 neigh show

# Tambah entri statis
$ sudo ip neigh add 192.168.1.20 lladdr 00:11:22:33:44:55 dev eth0 nud permanent

# Hapus
$ sudo ip neigh del 192.168.1.20 dev eth0

# Hapus semua (flush)
$ sudo ip neigh flush all
$ sudo ip neigh flush dev eth0
```

Membaca output dan state:
```bash
$ ip neigh show
192.168.1.1 dev eth0 lladdr bb:bb:bb:bb:bb:bb REACHABLE
192.168.1.20 dev eth0 lladdr cc:cc:cc:cc:cc:cc STALE
192.168.1.99 dev eth0 FAILED
```

| State | Arti |
|---|---|
| `REACHABLE` | Terverifikasi baru-baru ini |
| `STALE` | Kedaluwarsa, akan diverifikasi saat dipakai |
| `DELAY` | Menunggu konfirmasi |
| `PROBE` | Sedang mengirim probe |
| `INCOMPLETE` | Request dikirim, belum ada jawaban |
| `FAILED` | Tidak ada jawaban (host mati/tidak ada) |
| `PERMANENT` | Entri statis |

---

## 6. `ip` untuk Diagnostik Lanjutan

```bash
# Policy routing rules
$ ip rule show
0:      from all lookup local
32766:  from all lookup main
32767:  from all lookup default

# Tabel routing tertentu
$ ip route show table local
$ ip route show table main

# Multicast
$ ip maddr show
$ ip mroute show

# Tunnel
$ ip tunnel show
$ ip -6 tunnel show

# Statistik jaringan sistem
$ ip -s link show eth0
$ nstat                     # statistik SNMP-style
$ nstat -az | grep -i retrans

# Namespace jaringan (lihat 13-linux-networking/02)
$ ip netns list
```

---

## 7. `ethtool` — Kontrol Hardware NIC

```bash
# Kecepatan, duplex, status link
$ ethtool eth0
        Speed: 1000Mb/s
        Duplex: Full
        Auto-negotiation: on
        Link detected: yes

# Statistik hardware (termasuk error)
$ ethtool -S eth0
$ ethtool -S eth0 | grep -iE 'err|drop|crc|discard'

# Informasi driver
$ ethtool -i eth0

# Offload features (checksum, TSO, GRO, dll)
$ ethtool -k eth0

# Ubah kecepatan/duplex (HANYA kalau perlu, set kedua sisi!)
$ sudo ethtool -s eth0 speed 1000 duplex full autoneg on

# Ring buffer (untuk mengurangi drop di beban tinggi)
$ ethtool -g eth0
$ sudo ethtool -G eth0 rx 4096 tx 4096

# Uji kabel (NIC yang mendukung)
$ sudo ethtool --test eth0
$ sudo ethtool --cable-test eth0

# Kedipkan LED untuk identifikasi fisik
$ sudo ethtool --identify eth0 10
```

💡 **`ethtool -S` menampilkan counter hardware** — setara `show interfaces` di Cisco. CRC error, drop, dan discard di sini menunjukkan masalah layer 1 (kabel, SFP, interferensi).

⚠️ **Offload features (`ethtool -k`)** bisa menyebabkan capture yang membingungkan — dengan GRO/TSO aktif, tcpdump/Wireshark melihat "paket raksasa" yang sebenarnya sudah digabung NIC. Untuk analisis akurat, matikan sementara:
```bash
$ sudo ethtool -K eth0 gro off tso off gso off
```

---

## 8. Konfigurasi Persisten

Perintah `ip` bersifat **sementara** — hilang setelah reboot. Untuk permanen, gunakan sistem manajemen jaringan distribusi Anda.

### NetworkManager (Fedora, RHEL, Ubuntu Desktop)

```bash
# Lihat koneksi
$ nmcli connection show
$ nmcli device status

# Konfigurasi statis
$ sudo nmcli con mod "Wired connection 1" \
    ipv4.method manual \
    ipv4.addresses 192.168.1.50/24 \
    ipv4.gateway 192.168.1.1 \
    ipv4.dns "1.1.1.1,8.8.8.8" \
    ipv4.routes "10.0.0.0/8 192.168.1.254"
$ sudo nmcli con up "Wired connection 1"

# DHCP
$ sudo nmcli con mod "Wired connection 1" ipv4.method auto

# Buat koneksi baru
$ sudo nmcli con add type ethernet con-name lan ifname eth0 \
    ip4 192.168.1.50/24 gw4 192.168.1.1

# VLAN
$ sudo nmcli con add type vlan con-name vlan10 dev eth0 id 10 \
    ip4 192.168.10.50/24

# Bonding
$ sudo nmcli con add type bond con-name bond0 ifname bond0 \
    bond.options "mode=802.3ad,miimon=100"

# Bridge
$ sudo nmcli con add type bridge con-name br0 ifname br0

# Info detail
$ nmcli -f all con show "Wired connection 1"
$ nmcli device show eth0
```

### systemd-networkd (server minimal, container)

`/etc/systemd/network/10-eth0.network`:
```ini
[Match]
Name=eth0

[Network]
Address=192.168.1.50/24
Gateway=192.168.1.1
DNS=1.1.1.1
DNS=8.8.8.8

[Route]
Destination=10.0.0.0/8
Gateway=192.168.1.254
```

```bash
$ sudo systemctl enable --now systemd-networkd
$ networkctl status
$ networkctl status eth0
$ networkctl list
```

### Netplan (Ubuntu Server)

`/etc/netplan/01-config.yaml`:
```yaml
network:
  version: 2
  renderer: networkd          # atau NetworkManager
  ethernets:
    eth0:
      addresses:
        - 192.168.1.50/24
      routes:
        - to: default
          via: 192.168.1.1
        - to: 10.0.0.0/8
          via: 192.168.1.254
      nameservers:
        addresses: [1.1.1.1, 8.8.8.8]
  vlans:
    vlan10:
      id: 10
      link: eth0
      addresses: [192.168.10.50/24]
```

```bash
$ sudo netplan try               # uji dengan rollback otomatis (100 detik)
$ sudo netplan apply
$ sudo netplan get
```

⚠️ **Netplan sensitif terhadap indentasi (YAML)** dan **tidak boleh memakai tab**. `netplan try` memberi rollback otomatis kalau konfigurasi memutus koneksi Anda — selalu pakai ini untuk perubahan jarak jauh.

### Debian klasik (`/etc/network/interfaces`)

```
auto eth0
iface eth0 inet static
    address 192.168.1.50/24
    gateway 192.168.1.1
    dns-nameservers 1.1.1.1 8.8.8.8
    up ip route add 10.0.0.0/8 via 192.168.1.254
```

💡 **Pilih SATU sistem manajemen dan konsisten.** Mencampur NetworkManager dan systemd-networkd pada interface yang sama menyebabkan konflik. Periksa mana yang aktif: `systemctl status NetworkManager systemd-networkd`.

---

## 9. sysctl — Tuning Kernel Network

```bash
# IP forwarding — menjadikan Linux router
$ sudo sysctl -w net.ipv4.ip_forward=1
$ sudo sysctl -w net.ipv6.conf.all.forwarding=1

# Reverse path filtering (anti-spoofing)
$ sudo sysctl -w net.ipv4.conf.all.rp_filter=1        # 1=strict, 2=loose

# Terima/abaikan ICMP redirect
$ sudo sysctl -w net.ipv4.conf.all.accept_redirects=0
$ sudo sysctl -w net.ipv4.conf.all.send_redirects=0

# Terima Router Advertisement IPv6 (untuk router, biasanya 0)
$ sudo sysctl -w net.ipv6.conf.all.accept_ra=0

# TCP tuning (lihat 05-transport)
$ sudo sysctl -w net.core.rmem_max=67108864
$ sudo sysctl -w net.ipv4.tcp_congestion_control=bbr
$ sudo sysctl -w net.core.default_qdisc=fq

# Connection tracking
$ sudo sysctl -w net.netfilter.nf_conntrack_max=262144

# Lihat semua setelan network
$ sysctl -a | grep net.ipv4

# Permanen — /etc/sysctl.d/99-network.conf
$ echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-router.conf
$ sudo sysctl --system
```

⚠️ **Setelan sysctl bersifat sementara** kecuali ditulis ke `/etc/sysctl.d/`. Untuk router produksi, dokumentasikan semua setelan dalam file yang dikelola konfigurasi (Ansible, dll).

---

## 10. Resolusi DNS di Linux

```bash
# systemd-resolved (default banyak distro modern)
$ resolvectl status
$ resolvectl query example.com
$ resolvectl statistics
$ resolvectl flush-caches
$ sudo resolvectl dns eth0 1.1.1.1 8.8.8.8

# File konfigurasi lama
$ cat /etc/resolv.conf
$ cat /etc/hosts
$ cat /etc/nsswitch.conf          # urutan resolusi (files, dns, mdns)

# Query
$ dig example.com
$ dig +short example.com
$ host example.com
$ nslookup example.com
$ getent hosts example.com        # memakai nsswitch (files + dns)
```

⚠️ **`/etc/resolv.conf` sering merupakan symlink yang dikelola systemd-resolved** — mengeditnya langsung tidak permanen. Gunakan `resolvectl` atau konfigurasi NetworkManager/netplan.

Detail DNS di `06-aplikasi/01`.

---

## 11. Troubleshooting Konektivitas — Alur Linux

```bash
# 1. LAYER 1/2 — apakah interface up dan ada carrier?
$ ip -br link show
$ ethtool eth0 | grep -E 'Speed|Duplex|Link detected'
$ ethtool -S eth0 | grep -i err

# 2. LAYER 3 — apakah punya alamat dan gateway?
$ ip -br addr show
$ ip route show
$ ip route get 8.8.8.8

# 3. Apakah gateway terjangkau?
$ ping -c3 $(ip route | awk '/default/ {print $3}')
$ ip neigh show | grep $(ip route | awk '/default/ {print $3}')

# 4. Apakah internet terjangkau?
$ ping -c3 8.8.8.8

# 5. Apakah DNS bekerja?
$ dig +short google.com
$ resolvectl query google.com

# 6. LAYER 4 — apakah port terbuka?
$ ss -tulnp
$ nc -zv host 443

# 7. Trace jalur
$ mtr -n 8.8.8.8
$ traceroute -n 8.8.8.8

# 8. Apakah firewall memblokir?
$ sudo nft list ruleset
$ sudo iptables -L -n -v
```

### One-liner yang berguna

```bash
# IP publik Anda
$ curl -s ifconfig.me

# Interface default
$ ip route | awk '/default/ {print $5; exit}'

# Gateway default
$ ip route | awk '/default/ {print $3; exit}'

# Semua alamat IP
$ ip -br -4 addr show | awk '{print $1, $3}'

# Koneksi established teratas per IP
$ ss -tn state established | awk '{print $4}' | cut -d: -f1 | sort | uniq -c | sort -rn | head
```

---

## 12. Ringkasan

- **iproute2 (`ip`, `ss`, `tc`) menggantikan net-tools** (`ifconfig`, `route`, `arp`, `netstat`) yang usang dan tidak akurat.
- `ip link` (interface L1/L2), `ip addr` (alamat L3), `ip route` (routing), `ip neigh` (ARP/NDP).
- **`UP` = admin up; `LOWER_UP` = ada carrier fisik.** `NO-CARRIER` = kabel dicabut.
- **`ip route get <tujuan>`** menunjukkan rute yang benar-benar dipakai — alat diagnostik terbaik.
- **`ethtool`** untuk hardware NIC: kecepatan/duplex, counter error (setara `show interfaces`), offload, ring buffer.
- ⚠️ **Offload (GRO/TSO) membuat capture membingungkan** — matikan sementara untuk analisis akurat.
- Perintah `ip` **sementara** — persisten lewat **NetworkManager** (`nmcli`), **systemd-networkd**, **Netplan**, atau `/etc/network/interfaces`. Pilih satu, konsisten.
- **`netplan try`** dan **`nmcli`** memberi cara aman untuk perubahan jarak jauh (rollback).
- **sysctl** untuk tuning: `ip_forward` (router), `rp_filter` (anti-spoof), congestion control. Permanen di `/etc/sysctl.d/`.
- **`/etc/resolv.conf` sering dikelola systemd-resolved** — jangan edit langsung; pakai `resolvectl`.
- Alur troubleshooting: L1/L2 (`ip link`, `ethtool`) → L3 (`ip addr`, `ip route get`) → gateway → internet → DNS → L4 (`ss`, `nc`) → trace (`mtr`) → firewall (`nft`).

---

## 13. Latihan

1. Apa perbedaan `UP` dan `LOWER_UP` di output `ip link`?
2. Perintah apa yang menunjukkan rute yang benar-benar dipakai untuk mencapai 8.8.8.8, termasuk alamat sumbernya?
3. Kenapa `ifconfig` sebaiknya tidak dipakai lagi?
4. Anda menjalankan tcpdump dan melihat "paket" 65.000 byte di link 1500 MTU. Apa yang terjadi dan bagaimana memperbaikinya untuk analisis?
5. Anda mengonfigurasi IP dengan `ip addr add` tetapi hilang setelah reboot. Kenapa dan apa solusinya?
6. Bagaimana menjadikan Linux sebagai router?
7. Server menunjukkan CRC error di `ethtool -S`. Layer berapa masalahnya dan apa yang Anda periksa?
8. Anda perlu mengubah konfigurasi jaringan server jarak jauh dan takut terkunci. Cara aman apa yang tersedia?

<details>
<summary>Jawaban</summary>

1. **`UP`** berarti interface telah **diaktifkan secara administratif** — administrator menjalankan `ip link set eth0 up`. **`LOWER_UP`** berarti ada **carrier fisik** — kabel tersambung dan link layer 1 benar-benar naik (setara "line protocol up" di Cisco). Sebuah interface bisa `UP` tetapi tanpa `LOWER_UP` (ditandai `NO-CARRIER`) — artinya diaktifkan tetapi kabelnya dicabut atau perangkat lawan mati. Untuk konektivitas, keduanya harus ada.

2. `ip route get 8.8.8.8`. Perintah ini menjalankan lookup routing yang sebenarnya dan menampilkan: rute yang cocok, next hop (`via`), interface keluar (`dev`), dan **alamat sumber yang dipilih** (`src`). Ini jauh lebih akurat daripada membaca `ip route show` dan menebak rute mana yang menang — setara dengan `show ip cef exact-route` di Cisco. Sangat berguna saat ada beberapa rute atau policy routing.

3. Karena `ifconfig` (bagian dari net-tools) sudah **usang dan tidak dikembangkan lagi**, dan yang lebih penting: ia **tidak menampilkan semua informasi dengan akurat**. Contoh: ia tidak menampilkan semua alamat IPv6, tidak menampilkan beberapa alamat sekunder dengan benar, tidak memahami fitur jaringan modern (namespace, beberapa jenis interface), dan format outputnya tidak lengkap. Suite `ip` dari iproute2 adalah antarmuka resmi ke kernel network modern dan menampilkan keadaan yang sebenarnya. `ifconfig` sering bahkan tidak terinstal di distribusi minimal/container.

4. **Offload NIC — GRO (Generic Receive Offload) atau LRO** sedang aktif. NIC/kernel **menggabungkan beberapa paket TCP yang berurutan menjadi satu segmen besar** sebelum menyerahkannya ke stack (dan tcpdump), untuk efisiensi. Jadi apa yang Anda lihat bukan paket sesungguhnya di kabel. Hal serupa terjadi di sisi kirim dengan TSO/GSO.
   **Perbaikan untuk analisis:** matikan offload sementara:
   ```
   sudo ethtool -K eth0 gro off lro off tso off gso off
   ```
   Setelah selesai, aktifkan kembali (offload penting untuk kinerja). Alternatif: lakukan capture di titik lain (mis. switch SPAN) yang melihat paket sesungguhnya di kabel.

5. Karena perintah `ip addr add` (dan semua perintah `ip`) **bekerja langsung pada kernel state yang bersifat sementara** — tidak menulis ke file konfigurasi mana pun, sehingga hilang saat reboot atau restart layanan jaringan. Ini disengaja: `ip` adalah alat untuk mengubah keadaan runtime.
   **Solusi:** konfigurasikan lewat sistem manajemen jaringan yang persisten sesuai distribusi Anda — **NetworkManager** (`nmcli con mod ...`), **systemd-networkd** (file `.network`), **Netplan** (YAML), atau `/etc/network/interfaces` (Debian klasik). Sistem ini menulis konfigurasi ke disk dan menerapkannya saat boot.

6. Dua langkah: (a) **Aktifkan IP forwarding** di kernel:
   ```
   sudo sysctl -w net.ipv4.ip_forward=1
   sudo sysctl -w net.ipv6.conf.all.forwarding=1
   # Permanen:
   echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-router.conf
   echo 'net.ipv6.conf.all.forwarding=1' | sudo tee -a /etc/sysctl.d/99-router.conf
   sudo sysctl --system
   ```
   (b) **Konfigurasikan interface, rute, dan (biasanya) NAT/firewall** sesuai peran router — alamat pada setiap interface, rute statis atau protokol routing (FRR), dan aturan nftables untuk NAT/filtering. Untuk router yang serius, gunakan **FRRouting** (OSPF/BGP di Linux) — dibahas di `13-linux-networking/04`.

7. **CRC error adalah masalah Layer 1 (fisik)** — frame tiba dengan checksum yang tidak cocok, artinya rusak dalam transmisi. Yang diperiksa: (a) **kabel** — coba ganti dengan patch cord yang diketahui baik; (b) **konektor/port** — periksa apakah bersih dan terpasang benar; (c) untuk fiber: **SFP dan daya optik** (`ethtool -m eth0`), kebersihan konektor; (d) **duplex mismatch** — periksa `ethtool eth0` di kedua sisi (CRC error di satu sisi + late collision di sisi lain = duplex mismatch); (e) **interferensi EMI** kalau kabel dekat sumber listrik; (f) **panjang kabel** melebihi batas. Ini bukan masalah IP/routing — jangan buang waktu memeriksa konfigurasi layer atas sampai CRC error berhenti.

8. Beberapa cara aman:
   - **`netplan try`** (Ubuntu) — menerapkan konfigurasi baru dengan **rollback otomatis setelah 120 detik** kecuali Anda mengonfirmasinya; kalau konfigurasi memutus koneksi Anda, ia otomatis kembali.
   - **`nmcli`** dengan pengujian bertahap, atau membuat koneksi baru dan mengaktifkannya sambil mempertahankan yang lama sebagai fallback.
   - **Menjadwalkan reboot** beberapa menit ke depan sebelum perubahan (`sleep 300 && reboot` atau `shutdown -r +5`), lalu membatalkannya (`shutdown -c`) jika perubahan berhasil — perangkat kembali ke konfigurasi lama kalau Anda terkunci.
   - **Akses out-of-band** — console serial, IPMI/iDRAC/iLO, atau KVM — sehingga Anda bisa memperbaiki tanpa jaringan.
   - Untuk perubahan firewall: aturan yang mengizinkan sesi SSH Anda saat ini di paling atas, dan uji dari sesi kedua sebelum menutup yang pertama.
   Prinsip umumnya sama dengan Safe Mode di MikroTik dan `configure revert timer` di Cisco: **selalu punya jalan pulang otomatis** saat mengubah konfigurasi jaringan dari jarak jauh.

</details>

---

## 14. Sumber

- `man ip`, `man ip-route`, `man ip-address`, `man ethtool`
- iproute2 — https://wiki.linuxfoundation.org/networking/iproute2
- Red Hat, *Configuring and Managing Networking*
- systemd-networkd — https://www.freedesktop.org/software/systemd/man/systemd.network.html
- Netplan — https://netplan.io/

---

**Berikutnya:** `13-linux-networking/02-virtual-networking.md` — namespace, veth, bridge, dan membangun router di Linux.

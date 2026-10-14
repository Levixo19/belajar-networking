# 13.2 — Virtual Networking di Linux

> **Prasyarat:** `13-linux-networking/01`, `03-data-link/02`, `03-data-link/03`
> **Tujuan:** Anda paham blok bangunan jaringan virtual Linux dan bisa membangun topologi lengkap (router, switch, VLAN) hanya dengan Linux — fondasi container dan cloud.

> 📌 **Kenapa ini penting?** Semua jaringan container (Docker, Kubernetes) dan cloud dibangun dari primitif ini: namespace, veth, bridge, VLAN, dan tunnel. Memahaminya membuat jaringan container/cloud tidak lagi menjadi kotak hitam.

---

## 1. Network Namespace — Jaringan Terisolasi

**Network namespace** memberi proses **stack jaringan yang terpisah total**: interface, routing table, ARP table, firewall, dan socket sendiri.

```
        ┌──────── HOST ────────────────────────┐
        │  ┌─────────┐  ┌─────────┐  ┌────────┐│
        │  │ netns A │  │ netns B │  │ default││
        │  │ eth0    │  │ eth0    │  │ eth0   ││
        │  │ lo      │  │ lo      │  │ ...    ││
        │  │ routes  │  │ routes  │  │        ││
        │  │ (sendiri)│ │ (sendiri)│ │        ││
        │  └─────────┘  └─────────┘  └────────┘│
        └───────────────────────────────────────┘
```

💡 **Inilah yang membuat container terisolasi.** Setiap container Docker adalah proses dalam network namespace sendiri — punya `eth0`, IP, dan routing table sendiri, tetapi berbagi kernel dengan host.

```bash
# Buat namespace
$ sudo ip netns add merah
$ sudo ip netns add biru

# Lihat
$ ip netns list

# Jalankan perintah dalam namespace
$ sudo ip netns exec merah ip addr show
$ sudo ip netns exec merah ip route show
$ sudo ip netns exec merah ping 10.0.0.2

# Shell interaktif dalam namespace
$ sudo ip netns exec merah bash

# Hapus
$ sudo ip netns del merah
```

⚠️ **Setiap namespace baru hanya punya interface `lo` yang DOWN.** Anda harus mengaktifkannya dan menambahkan konektivitas:
```bash
$ sudo ip netns exec merah ip link set lo up
```

---

## 2. veth — Kabel Virtual

**veth pair** adalah sepasang interface virtual yang terhubung seperti kabel — apa yang masuk satu ujung keluar ujung lainnya. Dipakai untuk menghubungkan namespace.

```
   [netns merah]                [host / netns lain]
    veth-merah ═══════════════════ veth-host
         (satu "kabel" virtual)
```

```bash
# Buat veth pair
$ sudo ip link add veth-merah type veth peer name veth-host

# Pindahkan satu ujung ke namespace
$ sudo ip link set veth-merah netns merah

# Konfigurasi ujung di namespace
$ sudo ip netns exec merah ip addr add 10.0.0.1/24 dev veth-merah
$ sudo ip netns exec merah ip link set veth-merah up
$ sudo ip netns exec merah ip link set lo up

# Konfigurasi ujung di host
$ sudo ip addr add 10.0.0.254/24 dev veth-host
$ sudo ip link set veth-host up

# Uji
$ sudo ip netns exec merah ping 10.0.0.254
```

💡 **Docker membuat veth pair untuk setiap container** — satu ujung di namespace container (bernama `eth0` di dalam), satu ujung di host (terhubung ke bridge `docker0`).

---

## 3. Linux Bridge — Switch Virtual

**Bridge** adalah switch layer 2 dalam software. Ia mempelajari MAC address dan meneruskan frame antar-port — persis seperti switch fisik.

```
        ┌──────── Linux Bridge (br0) ────────┐
        │   MAC table, learning, flooding     │
        └──┬──────────┬──────────┬────────────┘
           │          │          │
      veth-merah  veth-biru   eth0
      (netns)     (netns)   (fisik/uplink)
```

```bash
# Buat bridge
$ sudo ip link add br0 type bridge
$ sudo ip link set br0 up

# Tambahkan interface ke bridge
$ sudo ip link set veth-host master br0
$ sudo ip link set eth1 master br0

# Lihat MAC table (= CAM table)
$ bridge fdb show
$ bridge fdb show br br0

# Lihat port bridge
$ bridge link show

# Info detail bridge
$ ip -d link show br0

# STP di bridge
$ sudo ip link set br0 type bridge stp_state 1

# Hapus port dari bridge
$ sudo ip link set eth1 nomaster
```

⚠️ **Kalau Anda memberi IP ke bridge, berikan ke `br0`, bukan ke interface anggotanya.** Interface yang menjadi anggota bridge beroperasi di layer 2; alamat IP-nya diabaikan.

```bash
$ sudo ip addr add 192.168.1.1/24 dev br0    # IP di bridge, bukan di eth1
```

💡 **`docker0` adalah Linux bridge.** Semua container di jaringan bridge default terhubung ke sana, dan bridge itu terhubung ke jaringan host lewat NAT (iptables/nftables masquerade).

---

## 4. Membangun Router Lengkap dengan Namespace

Latihan yang mengajarkan seluruh konsep sekaligus: dua "host" di subnet berbeda, dihubungkan sebuah "router".

```
[host-a]              [ROUTER]              [host-b]
10.1.1.10/24 ─────── 10.1.1.1  10.2.2.1 ─────── 10.2.2.10/24
              veth              veth
```

```bash
#!/bin/bash
# Buat tiga namespace
sudo ip netns add host-a
sudo ip netns add router
sudo ip netns add host-b

# veth pair: host-a <-> router
sudo ip link add veth-a type veth peer name veth-ra
sudo ip link set veth-a netns host-a
sudo ip link set veth-ra netns router

# veth pair: router <-> host-b
sudo ip link add veth-b type veth peer name veth-rb
sudo ip link set veth-b netns host-b
sudo ip link set veth-rb netns router

# Konfigurasi host-a
sudo ip netns exec host-a ip addr add 10.1.1.10/24 dev veth-a
sudo ip netns exec host-a ip link set veth-a up
sudo ip netns exec host-a ip link set lo up
sudo ip netns exec host-a ip route add default via 10.1.1.1

# Konfigurasi router (dua interface)
sudo ip netns exec router ip addr add 10.1.1.1/24 dev veth-ra
sudo ip netns exec router ip addr add 10.2.2.1/24 dev veth-rb
sudo ip netns exec router ip link set veth-ra up
sudo ip netns exec router ip link set veth-rb up
sudo ip netns exec router ip link set lo up
# AKTIFKAN FORWARDING — inilah yang menjadikannya router
sudo ip netns exec router sysctl -w net.ipv4.ip_forward=1

# Konfigurasi host-b
sudo ip netns exec host-b ip addr add 10.2.2.10/24 dev veth-b
sudo ip netns exec host-b ip link set veth-b up
sudo ip netns exec host-b ip link set lo up
sudo ip netns exec host-b ip route add default via 10.2.2.1

# UJI — host-a ping host-b MELALUI router
sudo ip netns exec host-a ping -c3 10.2.2.10

# Lihat jalurnya
sudo ip netns exec host-a traceroute -n 10.2.2.10
```

💡 **Ini adalah router sungguhan** — hanya dalam software. Anda bisa menambahkan OSPF/BGP (FRR), firewall (nftables), dan NAT ke namespace router untuk membuat lab jaringan lengkap tanpa perangkat fisik. Inilah dasar **Containerlab** dan **GNS3** (lihat `lab/00-setup-lab.md`).

⚠️ **`ip_forward` diatur per-namespace.** Mengaktifkannya di host tidak otomatis berlaku di namespace.

---

## 5. VLAN di Linux (802.1Q)

```bash
# Buat interface VLAN (subinterface bertag)
$ sudo ip link add link eth0 name eth0.10 type vlan id 10
$ sudo ip link add link eth0 name eth0.20 type vlan id 20

$ sudo ip addr add 192.168.10.1/24 dev eth0.10
$ sudo ip addr add 192.168.20.1/24 dev eth0.20
$ sudo ip link set eth0.10 up
$ sudo ip link set eth0.20 up

# Lihat
$ ip -d link show eth0.10
$ cat /proc/net/vlan/config

# Hapus
$ sudo ip link del eth0.10
```

💡 **Ini setara router-on-a-stick** — satu interface fisik membawa banyak VLAN, masing-masing menjadi subinterface dengan subnet sendiri. Linux merutekan di antaranya (dengan `ip_forward=1`).

### VLAN + Bridge (untuk trunk ke switch)

Untuk membuat Linux berperilaku seperti switch dengan VLAN filtering:
```bash
$ sudo ip link add br0 type bridge vlan_filtering 1
$ sudo ip link set eth1 master br0
$ sudo bridge vlan add dev eth1 vid 10 pvid untagged   # access port VLAN 10
$ sudo bridge vlan add dev eth0 vid 10                  # trunk (tagged)
$ sudo bridge vlan add dev eth0 vid 20
$ bridge vlan show
```

---

## 6. Bonding dan Teaming — Link Aggregation

Sudah dibahas di `03-data-link/05`. Ringkasan primitifnya:

```bash
# Bonding lewat nmcli (persisten, direkomendasikan)
$ sudo nmcli con add type bond con-name bond0 ifname bond0 \
    bond.options "mode=802.3ad,miimon=100,lacp_rate=fast"
$ sudo nmcli con add type ethernet con-name bond0-p1 ifname eth1 master bond0
$ sudo nmcli con add type ethernet con-name bond0-p2 ifname eth2 master bond0

# Manual (sementara)
$ sudo ip link add bond0 type bond mode 802.3ad
$ sudo ip link set eth1 master bond0
$ sudo ip link set eth2 master bond0

# Verifikasi
$ cat /proc/net/bonding/bond0
$ ip -d link show bond0
```

Mode: `active-backup` (tanpa dukungan switch), `802.3ad` (LACP, butuh EtherChannel di switch), `balance-xor`, dll.

---

## 7. macvlan dan ipvlan

Cara memberi container/VM alamat **langsung di jaringan fisik** tanpa NAT.

### macvlan

Setiap interface macvlan punya **MAC address sendiri** dan muncul sebagai perangkat terpisah di jaringan.

```bash
$ sudo ip link add mac0 link eth0 type macvlan mode bridge
$ sudo ip addr add 192.168.1.100/24 dev mac0
$ sudo ip link set mac0 up
```

⚠️ **Keterbatasan macvlan:** host **tidak bisa berkomunikasi** dengan container macvlan-nya sendiri (secara desain). Dan switch fisik harus mengizinkan **banyak MAC per port** — beberapa switch (dan Wi-Fi) memblokirnya.

### ipvlan

Container berbagi **MAC address host** tetapi punya IP berbeda.

```bash
$ sudo ip link add ipv0 link eth0 type ipvlan mode l2
$ sudo ip addr add 192.168.1.101/24 dev ipv0
```

💡 **Pakai ipvlan kalau switch/Wi-Fi membatasi jumlah MAC per port**, atau kalau MAC berlebihan menjadi masalah. Pakai macvlan kalau butuh MAC unik per container.

---

## 8. TUN/TAP — Interface Virtual untuk VPN

| | **TUN** | **TAP** |
|---|---|---|
| Layer | 3 (IP) | 2 (Ethernet) |
| Membawa | Paket IP | Frame Ethernet penuh |
| Untuk | VPN routed (WireGuard, OpenVPN tun) | VPN bridged, emulasi, VM |

```bash
# Aplikasi VPN membuat ini otomatis, tetapi bisa dibuat manual:
$ sudo ip tuntap add mode tun tun0
$ sudo ip addr add 10.8.0.1/24 dev tun0
$ sudo ip link set tun0 up

$ sudo ip tuntap add mode tap tap0
$ sudo ip link set tap0 master br0    # tap bisa masuk bridge
```

💡 WireGuard membuat interface tipe `wireguard`, OpenVPN membuat `tun0`/`tap0`, dan VM (QEMU/KVM) sering memakai `tap` yang terhubung ke bridge host.

---

## 9. Jenis Interface Virtual Lain

```bash
# Dummy — interface yang selalu up, untuk loopback tambahan / testing
$ sudo ip link add dummy0 type dummy
$ sudo ip addr add 10.99.99.1/32 dev dummy0
$ sudo ip link set dummy0 up

# VXLAN — overlay L2 di atas L3 (lihat 16-datacenter-cloud-sdn/02)
$ sudo ip link add vxlan10 type vxlan id 10 dev eth0 dstport 4789 remote 203.0.113.20
$ sudo ip link set vxlan10 master br0
$ sudo ip link set vxlan10 up

# GRE tunnel
$ sudo ip tunnel add gre1 mode gre local 203.0.113.10 remote 198.51.100.1
$ sudo ip link set gre1 up

# WireGuard
$ sudo ip link add wg0 type wireguard
# lalu konfigurasi dengan wg / wg-quick (lihat 11-wan-vpn/02)

# VRF — routing table terpisah (setara VRF-lite Cisco)
$ sudo ip link add vrf-merah type vrf table 100
$ sudo ip link set vrf-merah up
$ sudo ip link set eth1 master vrf-merah
$ sudo ip route add default via 10.0.0.1 table 100
$ ip vrf show
$ ip route show vrf vrf-merah
```

---

## 10. Membangun Firewall/NAT untuk Namespace

Untuk memberi namespace (atau container) akses internet, host bertindak sebagai router NAT:

```bash
# Aktifkan forwarding di host
$ sudo sysctl -w net.ipv4.ip_forward=1

# NAT (masquerade) untuk subnet namespace
$ sudo nft add table ip nat
$ sudo nft add chain ip nat postrouting '{ type nat hook postrouting priority 100; }'
$ sudo nft add rule ip nat postrouting ip saddr 10.0.0.0/24 oifname "eth0" masquerade

# Izinkan forwarding
$ sudo nft add rule inet filter forward ip saddr 10.0.0.0/24 accept
$ sudo nft add rule inet filter forward ct state established,related accept
```

Detail nftables di `13-linux-networking/03`.

---

## 11. Menghubungkan Semua: Cara Docker Bekerja

Sekarang Anda bisa memahami jaringan Docker sepenuhnya:

```
┌─────────────────── HOST ───────────────────────────┐
│                                                     │
│  ┌─ container A ─┐    ┌─ container B ─┐             │
│  │ netns         │    │ netns         │             │
│  │ eth0          │    │ eth0          │             │
│  │ 172.17.0.2    │    │ 172.17.0.3    │             │
│  └──────┬────────┘    └──────┬────────┘             │
│      veth              veth                          │
│         └──────┬──────────┘                          │
│         ┌──────┴──────┐                              │
│         │  docker0    │  ← Linux BRIDGE 172.17.0.1   │
│         └──────┬──────┘                              │
│                │ NAT (nftables masquerade)           │
│              eth0 (fisik) ──────────────────► Internet│
└─────────────────────────────────────────────────────┘
```

**Setiap konsep yang Anda pelajari:**
- **Network namespace** → isolasi setiap container
- **veth pair** → "kabel" dari container ke bridge
- **Linux bridge (docker0)** → switch virtual yang menghubungkan container
- **NAT (masquerade)** → memberi container akses internet lewat IP host
- **iptables/nftables** → port publishing (`-p 8080:80`) dan isolasi

```bash
# Lihat sendiri
$ docker network ls
$ docker network inspect bridge
$ ip link show docker0
$ bridge link show
$ sudo nft list ruleset | grep -i docker
$ ip netns list                              # (Docker sering menyembunyikannya)
$ sudo ln -s /var/run/docker/netns /var/run/netns   # agar terlihat ip netns
```

Detail lengkap di `16-datacenter-cloud-sdn/05`.

---

## 12. Ringkasan

- **Network namespace** memberi stack jaringan terpisah total (interface, routing, ARP, firewall, socket) — dasar isolasi container.
- **veth pair** = kabel virtual yang menghubungkan namespace; satu ujung bisa dipindah ke namespace lain.
- **Linux bridge** = switch layer 2 dalam software (learning, flooding, STP); `docker0` adalah contohnya. Beri IP ke bridge, bukan anggotanya.
- Router lengkap bisa dibangun dengan namespace + veth + **`ip_forward=1`** (per-namespace) — dasar Containerlab/GNS3.
- **VLAN** (`ip link add ... type vlan id N`) untuk subinterface bertag; bridge dengan `vlan_filtering` untuk switch VLAN sungguhan.
- **macvlan** (MAC unik per container) vs **ipvlan** (berbagi MAC host) — untuk memberi container alamat di jaringan fisik.
- **TUN** (L3, paket IP) vs **TAP** (L2, frame Ethernet) untuk VPN dan VM.
- Interface lain: **dummy** (loopback tambahan), **VXLAN** (overlay), **GRE/WireGuard** (tunnel), **VRF** (routing table terpisah).
- **Docker networking = namespace + veth + bridge + NAT** — semua primitif yang Anda pelajari di modul ini.

---

## 13. Latihan

1. Apa yang membuat container terisolasi satu sama lain di tingkat jaringan?
2. Anda membuat namespace baru tetapi tidak bisa ping apa pun, bahkan `127.0.0.1`. Kenapa?
3. Anda membuat bridge, memberi IP ke `eth1` yang menjadi anggotanya, tetapi tidak bisa diakses. Kenapa?
4. Gambarkan komponen yang dibuat Docker saat menjalankan satu container di jaringan bridge default.
5. Kapan memakai ipvlan alih-alih macvlan?
6. Anda ingin membangun lab dengan 3 router yang menjalankan OSPF, tanpa perangkat fisik. Primitif Linux apa yang Anda pakai?
7. Apa perbedaan TUN dan TAP, dan kapan memakai masing-masing?
8. Bagaimana memberi namespace akses internet?

<details>
<summary>Jawaban</summary>

1. **Network namespace.** Setiap container berjalan dalam network namespace-nya sendiri, yang memberikan **stack jaringan terpisah total**: interface sendiri (`eth0`, `lo`), routing table sendiri, ARP/neighbor table sendiri, aturan firewall sendiri, dan port/socket sendiri. Container tidak bisa melihat interface atau koneksi container lain, dan port 80 di satu container tidak bertabrakan dengan port 80 di container lain. Mereka hanya berbagi kernel host. Konektivitas antar-container disediakan secara eksplisit lewat veth pair yang terhubung ke bridge bersama.

2. Karena **interface `lo` (loopback) dalam namespace baru dibuat dalam keadaan DOWN.** Setiap namespace baru hanya berisi interface `lo` dan tidak ada yang lain, dan `lo` tidak otomatis diaktifkan. `127.0.0.1` tidak bisa di-ping sampai loopback dinaikkan:
   ```
   sudo ip netns exec <nama> ip link set lo up
   ```
   Untuk konektivitas ke luar, Anda juga perlu menambahkan veth pair (satu ujung ke namespace) dan mengonfigurasinya.

3. Karena **interface yang menjadi anggota bridge beroperasi murni di layer 2** — mereka menjadi "port switch" dan **alamat IP yang diberikan kepadanya diabaikan**. Frame yang masuk `eth1` diteruskan oleh logika bridge, bukan diproses oleh stack IP interface itu.
   **Perbaikan:** berikan alamat IP ke **interface bridge (`br0`)**, bukan ke anggotanya:
   ```
   sudo ip addr add 192.168.1.1/24 dev br0
   ```
   Bridge bertindak sebagai antarmuka layer 3 gabungan untuk semua port-nya — sama seperti SVI (interface VLAN) pada switch.

4. Docker membuat: (a) **network namespace baru** untuk container — memberi isolasi jaringan; (b) **veth pair** — satu ujung ditempatkan di namespace container dan dinamai `eth0` (dengan IP dari subnet bridge, mis. `172.17.0.2`), ujung lainnya (bernama `vethXXXX`) tetap di host; (c) ujung host dari veth **dimasukkan ke bridge `docker0`** (Linux bridge yang bertindak sebagai switch virtual, dengan gateway `172.17.0.1`); (d) **aturan NAT (masquerade)** di nftables/iptables agar trafik keluar container di-NAT ke IP host untuk akses internet; (e) kalau memakai `-p`, **aturan DNAT** untuk port publishing. Semua container di bridge default terhubung ke `docker0` dan bisa saling berkomunikasi lewat layer 2.

5. Gunakan **ipvlan** ketika: (a) **switch atau AP Wi-Fi membatasi jumlah MAC address per port** (port security, atau Wi-Fi yang hanya mengizinkan satu MAC per klien) — ipvlan membuat semua container berbagi MAC host, sehingga hanya satu MAC yang terlihat switch; (b) MAC address yang berlebihan menjadi masalah (membebani CAM table switch); (c) provider cloud yang memfilter berdasarkan MAC.
   Gunakan **macvlan** ketika Anda butuh setiap container punya **MAC unik** — misalnya untuk DHCP (setiap container mendapat lease sendiri berdasarkan MAC), atau kebijakan jaringan berbasis MAC. Keterbatasan macvlan: host tidak bisa berkomunikasi langsung dengan container macvlan-nya, dan butuh switch yang mengizinkan banyak MAC per port.

6. Kombinasi: (a) **3 network namespace** — satu untuk setiap "router"; (b) **veth pair** untuk menghubungkan router-router (misalnya membentuk topologi segitiga atau linear); (c) **`ip_forward=1`** di setiap namespace router agar mereka meneruskan paket; (d) **FRRouting (FRR)** dijalankan di dalam setiap namespace untuk menyediakan OSPF — `ip netns exec routerA frr` dengan konfigurasi OSPF-nya; (e) alamat IP pada setiap interface veth. Tambahkan namespace "host" di ujung untuk menguji konektivitas end-to-end.
   Ini persis prinsip yang dipakai **Containerlab** (yang mengotomasi ini dengan file YAML dan container image router seperti FRR, Arista cEOS, Nokia SR Linux) dan **GNS3**. Lihat `lab/00-setup-lab.md`.

7. **TUN** beroperasi di **layer 3** — ia membawa **paket IP** mentah (tanpa header Ethernet). Dipakai untuk VPN **routed** di mana Anda hanya perlu memindahkan paket IP: WireGuard, OpenVPN mode tun. Ini yang paling umum karena efisien dan tidak membawa overhead layer 2.
   **TAP** beroperasi di **layer 2** — ia membawa **frame Ethernet penuh** (dengan header MAC). Dipakai ketika Anda perlu memindahkan frame layer 2: VPN **bridged** (menggabungkan dua LAN menjadi satu broadcast domain, seperti EoIP), emulasi jaringan, dan **VM** (QEMU/KVM menghubungkan `tap` ke bridge host sehingga VM muncul di LAN seperti mesin fisik).
   Pilih TUN untuk VPN routed biasa (lebih efisien); pilih TAP hanya kalau benar-benar butuh konektivitas layer 2 (broadcast, protokol non-IP, atau VM yang harus tampak di LAN fisik).

8. Host bertindak sebagai **router NAT**. Langkah-langkah: (a) hubungkan namespace ke host lewat **veth pair** dengan alamat IP; (b) beri **default route** di namespace yang menunjuk ke alamat host di veth itu; (c) **aktifkan `ip_forward=1` di host** agar meneruskan paket; (d) buat aturan **NAT masquerade** untuk subnet namespace pada interface keluar host:
   ```
   sudo sysctl -w net.ipv4.ip_forward=1
   sudo nft add rule ip nat postrouting ip saddr 10.0.0.0/24 oifname "eth0" masquerade
   sudo nft add rule inet filter forward ip saddr 10.0.0.0/24 accept
   sudo nft add rule inet filter forward ct state established,related accept
   ```
   Ini persis mekanisme yang dipakai Docker untuk memberi container akses internet.

</details>

---

## 14. Sumber

- `man ip-netns`, `man ip-link`, `man bridge`
- Linux Foundation — https://wiki.linuxfoundation.org/networking/
- Docker networking — https://docs.docker.com/network/
- "Linux network namespaces" — dokumentasi kernel
- Containerlab — https://containerlab.dev/

---

**Berikutnya:** `13-linux-networking/03-nftables-firewall.md` — firewall Linux modern.

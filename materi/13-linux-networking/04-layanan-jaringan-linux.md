# 13.4 Layanan Jaringan di Linux

> **Prasyarat:** `13-linux-networking/01`–`03`, `06-aplikasi/*`
> **Tujuan:** Anda bisa menjalankan layanan jaringan inti di Linux — DNS, DHCP, reverse proxy/LB, NTP, RADIUS, dan routing daemon.

> > [!NOTE]
> > Ini adalah tahap **profesional (P)**. Layanan-layanan ini menggantikan appliance mahal dengan software gratis di atas Linux — pendekatan yang mendominasi cloud dan infrastruktur modern.

---

## 1. DNS Resolver: Unbound

Resolver rekursif dengan validasi DNSSEC. Ringkasan dari `06-aplikasi/01` dengan fokus operasional.

```bash
$ sudo apt install unbound        # atau dnf install unbound
```

`/etc/unbound/unbound.conf`:
```yaml
server:
    interface: 0.0.0.0
    interface: ::0
    port: 53

    # WAJIB dibatasi — jangan jadi open resolver!
    access-control: 127.0.0.0/8 allow
    access-control: 192.168.0.0/16 allow
    access-control: 10.0.0.0/8 allow
    access-control: 0.0.0.0/0 refuse

    # Keamanan & privasi
    hide-identity: yes
    hide-version: yes
    harden-glue: yes
    harden-dnssec-stripped: yes
    qname-minimisation: yes
    use-caps-for-id: yes
    auto-trust-anchor-file: "/var/lib/unbound/root.key"

    # Anti DNS rebinding
    private-address: 10.0.0.0/8
    private-address: 172.16.0.0/12
    private-address: 192.168.0.0/16
    private-address: fd00::/8

    # Kinerja
    num-threads: 4
    prefetch: yes
    cache-min-ttl: 60
    serve-expired: yes

# Zona internal ke DNS internal (mis. AD)
forward-zone:
    name: "perusahaan.local"
    forward-addr: 192.168.1.10
```

```bash
$ sudo unbound-checkconf
$ sudo systemctl enable --now unbound
$ dig @127.0.0.1 example.com +dnssec
$ sudo unbound-control stats_noreset
```

> [!WARNING]
> **`access-control` yang membatasi sumber adalah WAJIB** — open resolver dipakai untuk DNS amplification attack. Sama seperti kesalahan `allow-remote-requests` di MikroTik.

### dnsmasq: DNS + DHCP + TFTP ringan (SOHO)

`/etc/dnsmasq.conf`:
```
# DNS
no-resolv
server=1.1.1.1
server=8.8.8.8
server=/perusahaan.local/192.168.1.10   # zona internal ke AD
cache-size=10000
domain-needed
bogus-priv
stop-dns-rebind

# Record lokal
address=/nas.rumah.lan/192.168.1.100
local=/rumah.lan/
domain=rumah.lan
expand-hosts

# DHCP
dhcp-range=192.168.1.100,192.168.1.200,255.255.255.0,12h
dhcp-option=option:router,192.168.1.1
dhcp-option=option:dns-server,192.168.1.1
dhcp-host=00:11:22:33:44:55,192.168.1.50,nas,infinite
```

> [!TIP]
> **dnsmasq sangat populer di router rumahan dan Raspberry Pi** — satu proses menangani DNS, DHCP, dan TFTP dengan konfigurasi minimal. **Pi-hole** dibangun di atasnya untuk ad-blocking berbasis DNS.

---

## 2. DHCP Server: ISC Kea

ISC DHCP klasik sudah EOL — **Kea** adalah penggantinya. (Ringkasan dari `06-aplikasi/02`.)

`/etc/kea/kea-dhcp4.conf`:
```json
{
  "Dhcp4": {
    "interfaces-config": { "interfaces": [ "eth0" ] },
    "lease-database": { "type": "memfile", "persist": true,
                        "name": "/var/lib/kea/dhcp4.leases" },
    "valid-lifetime": 28800,
    "subnet4": [{
      "id": 10,
      "subnet": "192.168.10.0/24",
      "pools": [ { "pool": "192.168.10.100 - 192.168.10.200" } ],
      "option-data": [
        { "name": "routers", "data": "192.168.10.1" },
        { "name": "domain-name-servers", "data": "192.168.10.10" }
      ],
      "reservations": [
        { "hw-address": "00:11:22:33:44:55", "ip-address": "192.168.10.50" }
      ]
    }]
  }
}
```

```bash
$ sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf    # uji konfigurasi
$ sudo systemctl enable --now kea-dhcp4-server
```

> [!TIP]
> **Kea mendukung backend database (MySQL/PostgreSQL)** untuk lease — memungkinkan HA dan skala besar. Ini keunggulan besar untuk ISP dan enterprise.

---

## 3. Reverse Proxy dan Load Balancer

### nginx

Ringkasan dari `06-aplikasi/03` dengan fokus operasional.

```nginx
upstream backend {
    least_conn;
    server 10.0.1.10:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:8080 backup;
    keepalive 32;
}

server {
    listen 443 ssl http2;
    server_name app.example.com;
    ssl_certificate     /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    add_header Strict-Transport-Security "max-age=31536000" always;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout    30s;
    }
    location /healthz { access_log off; return 200 "ok\n"; }
}
```

### HAProxy: load balancer khusus

Lebih kuat untuk load balancing L4/L7 dengan fitur canggih.

```
global
    maxconn 50000
    log /dev/log local0

defaults
    mode http
    timeout connect 5s
    timeout client 30s
    timeout server 30s
    option httpchk GET /healthz

frontend web
    bind :443 ssl crt /etc/haproxy/certs/app.pem alpn h2,http/1.1
    http-request redirect scheme https unless { ssl_fc }
    default_backend app_servers

backend app_servers
    balance leastconn
    option forwardfor
    server app1 10.0.1.10:8080 check inter 3s fall 3 rise 2
    server app2 10.0.1.11:8080 check inter 3s fall 3 rise 2
    server app3 10.0.1.12:8080 check backup

# Statistik
listen stats
    bind :8404
    stats enable
    stats uri /stats
```

```bash
$ sudo haproxy -c -f /etc/haproxy/haproxy.cfg    # cek konfigurasi
$ sudo systemctl reload haproxy                   # reload tanpa memutus koneksi
$ echo "show stat" | sudo socat stdio /run/haproxy/admin.sock
```

> [!TIP]
> **HAProxy unggul dalam health check dan reload tanpa downtime.** `reload` memuat konfigurasi baru sambil menyelesaikan koneksi lama — penting untuk zero-downtime deployment.

> [!WARNING]
> **Health check L7 (`option httpchk`) sangat penting** — server yang menjawab TCP tetapi aplikasinya mati akan tetap menerima trafik kalau hanya cek L4. Lihat `06-aplikasi/03`.

### keepalived: VIP dan failover (VRRP)

Untuk membuat load balancer itu sendiri redundan:

```
vrrp_instance VIP1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 110
    advert_int 1
    authentication { auth_type PASS; auth_pass RahasiaVRRP; }
    virtual_ipaddress { 192.168.1.100/24 }
    track_script { chk_haproxy }
}
vrrp_script chk_haproxy {
    script "killall -0 haproxy"
    interval 2
    weight -20
}
```

> [!TIP]
> **keepalived + HAProxy = load balancer HA** — VIP berpindah ke node cadangan kalau node utama atau HAProxy-nya mati. Setara VRRP + FHRP di dunia appliance.

---

## 4. NTP: chrony

Pengganti modern ntpd, lebih akurat dan cepat konvergen. (Ringkasan dari `06-aplikasi/05`.)

`/etc/chrony/chrony.conf`:
```
pool id.pool.ntp.org iburst
server 192.168.1.5 iburst prefer
driftfile /var/lib/chrony/drift
makestep 1.0 3
rtcsync

# Jadikan server NTP untuk LAN
allow 192.168.0.0/16
local stratum 10          # tetap melayani walau upstream hilang
```

```bash
$ chronyc sources -v
$ chronyc tracking
$ timedatectl status
```

> [!WARNING]
> **Waktu yang salah merusak TLS, Kerberos (toleransi 5 menit), dan korelasi log.** Chrony memulihkan sinkronisasi jauh lebih cepat daripada ntpd setelah reboot atau drift besar.

---

## 5. RADIUS: FreeRADIUS

Untuk 802.1X, VPN, dan autentikasi jaringan.

```bash
$ sudo apt install freeradius freeradius-utils
```

`/etc/freeradius/3.0/clients.conf`:
```
client switch-lantai2 {
    ipaddr = 192.168.99.11
    secret = RahasiaRadius
    nas_type = cisco
}
client mikrotik-ap {
    ipaddr = 192.168.99.20
    secret = RahasiaRadius2
}
```

`/etc/freeradius/3.0/users` (autentikasi sederhana + atribut):
```
budi  Cleartext-Password := "RahasiaKuat"
      Tunnel-Type = VLAN,
      Tunnel-Medium-Type = IEEE-802,
      Tunnel-Private-Group-Id = "20"
```

```bash
# Uji dalam mode debug (SANGAT berguna)
$ sudo freeradius -X

# Uji autentikasi
$ radtest budi RahasiaKuat 127.0.0.1 0 testing123

$ sudo systemctl enable --now freeradius
```

> [!TIP]
> **`freeradius -X` (mode debug) menampilkan setiap langkah autentikasi** — alat troubleshooting AAA yang tak ternilai. Selalu jalankan ini saat mengonfigurasi 802.1X baru.

**Integrasi umum:**
```
FreeRADIUS + LDAP/AD  → identitas dari direktori terpusat
FreeRADIUS + SQL      → pengguna di database
FreeRADIUS + Google Authenticator → MFA
```

---

## 6. Routing Daemon: FRRouting (FRR)

Menjalankan **OSPF, BGP, IS-IS, RIP, PIM** di Linux — menjadikan Linux router penuh. Fork dari Quagga, dipakai di banyak produk jaringan (Cumulus/NVIDIA, SONiC, VyOS memakai FRR atau turunannya).

```bash
$ sudo apt install frr frr-pythontools
```

`/etc/frr/daemons` — aktifkan daemon yang dipakai:
```
ospfd=yes
bgpd=yes
```

Konfigurasi (mode vtysh — mirip Cisco IOS!):
```bash
$ sudo vtysh

router# configure terminal
router(config)# router ospf
router(config-router)# network 192.168.1.0/24 area 0
router(config-router)# exit
router(config)# router bgp 65001
router(config-router)# neighbor 203.0.113.1 remote-as 65002
router(config-router)# address-family ipv4 unicast
router(config-router-af)# network 192.168.0.0/22
router(config-router-af)# exit
router(config)# exit
router# write memory

# Verifikasi (perintah mirip Cisco!)
router# show ip ospf neighbor
router# show ip bgp summary
router# show ip route
```

> [!TIP]
> **FRR memakai CLI yang hampir identik dengan Cisco IOS** — kalau Anda menguasai OSPF/BGP di Cisco, Anda bisa langsung memakai FRR. Ini menjadikan Linux router yang serius untuk data center (BGP unnumbered di spine-leaf), lab, dan edge.

> [!WARNING]
> **Jangan lupa `sudo sysctl -w net.ipv4.ip_forward=1`** — FRR menghitung rute, tetapi kernel yang meneruskan paket.

### BGP unnumbered dengan FRR (data center)

```
interface swp1
 no ipv6 nd suppress-ra
router bgp 65001
 bgp router-id 10.0.0.1
 neighbor swp1 interface remote-as external
 address-family ipv4 unicast
  network 10.0.0.1/32
  neighbor swp1 activate
```

Dibahas di `16-datacenter-cloud-sdn/01`.

---

## 7. Monitoring Agent

Untuk mengintegrasikan Linux ke sistem monitoring (`14-monitoring-troubleshooting/03`).

```bash
# node_exporter (Prometheus) — metrik sistem & jaringan
$ ./node_exporter
# metrik di http://host:9100/metrics

# snmpd — agar bisa di-poll SNMP
$ sudo apt install snmpd
# /etc/snmp/snmpd.conf: konfigurasi SNMPv3

# rsyslog — kirim log ke server terpusat
# /etc/rsyslog.d/50-remote.conf:
*.* @@192.168.99.50:514        # @@ = TCP, @ = UDP
```

---

## 8. Menjadikan Linux Router/Firewall Lengkap

Menggabungkan semua yang dipelajari, Linux bisa menjadi router edge yang lengkap:

```
Komponen:
  ✅ IP forwarding         → sysctl net.ipv4.ip_forward=1
  ✅ Routing               → FRR (OSPF/BGP) atau static
  ✅ Firewall + NAT        → nftables
  ✅ DHCP                  → Kea / dnsmasq
  ✅ DNS                   → Unbound / dnsmasq
  ✅ VPN                   → WireGuard / strongSwan (IPsec)
  ✅ QoS                   → tc (CAKE / HTB)
  ✅ Monitoring            → node_exporter / snmpd
  ✅ NTP                   → chrony
```

> [!TIP]
> **Ini persis yang dilakukan distribusi router seperti VyOS, OPNsense, dan pfSense** — mereka mengemas komponen-komponen ini dengan antarmuka manajemen terpadu. VyOS memakai CLI mirip Junos; OPNsense/pfSense memakai GUI web dan berbasis FreeBSD (bukan Linux, tetapi konsepnya sama).

### Distribusi router siap pakai

| Distribusi | Basis | Antarmuka | Cocok untuk |
|---|---|---|---|
| **VyOS** | Debian | CLI (mirip Junos) + API | Router/firewall, otomasi, cloud |
| **OPNsense** | FreeBSD | GUI web | Firewall UTM, SOHO/SMB |
| **pfSense** | FreeBSD | GUI web | Firewall UTM, SOHO/SMB |
| **OpenWrt** | Linux minimal | GUI (LuCI) + CLI | Router rumahan, embedded, IoT gateway |

> [!TIP]
> **OpenWrt** menjadikan router rumahan murah menjadi perangkat yang sangat mampu (SQM/CAKE untuk bufferbloat, WireGuard, VLAN, dll) — alternatif menarik untuk RouterOS pada perangkat non-MikroTik.

---

## 9. Manajemen Layanan dengan systemd

```bash
# Status dan kontrol
$ sudo systemctl status unbound
$ sudo systemctl start/stop/restart/reload <layanan>
$ sudo systemctl enable --now <layanan>     # aktifkan + jalankan
$ sudo systemctl disable <layanan>

# Log layanan
$ journalctl -u unbound -f
$ journalctl -u unbound --since "1 hour ago"
$ journalctl -u unbound -p err

# Socket yang dibuka layanan
$ sudo ss -tulnp | grep unbound

# Dependensi dan urutan boot
$ systemctl list-dependencies unbound
```

> [!WARNING]
> **Pastikan layanan `enable`** (bukan hanya `start`) agar berjalan otomatis setelah reboot. Kesalahan umum: layanan jalan sekarang tetapi hilang setelah restart.

---

## 10. Keamanan Layanan Linux

```
✅ Jalankan layanan sebagai user non-root (systemd: User=)
✅ Batasi kapabilitas (systemd: CapabilityBoundingSet=)
✅ Firewall: hanya buka port yang diperlukan
✅ Bind ke interface/alamat spesifik, bukan 0.0.0.0 kalau tidak perlu
✅ TLS untuk semua yang mendukung
✅ Update berkala (unattended-upgrades untuk patch keamanan)
✅ Hardening per-layanan (systemd sandboxing: ProtectSystem, PrivateTmp, dll)
✅ SELinux/AppArmor aktif
✅ Log ke tempat terpusat
```

> [!WARNING]
> **Layanan yang bind ke `0.0.0.0` terekspos ke semua interface** — termasuk WAN. Periksa dengan `ss -tulnp` dan bind ke alamat internal saja kalau layanan tidak seharusnya publik. Ini kesalahan yang sangat umum (mis. database yang tidak sengaja terekspos internet).

```
# systemd hardening (contoh unit override)
$ sudo systemctl edit unbound
[Service]
ProtectSystem=strict
PrivateTmp=true
NoNewPrivileges=true
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
```

---

## 11. Ringkasan

- Linux menggantikan appliance mahal dengan layanan gratis — pendekatan yang mendominasi cloud dan infrastruktur modern.
- **DNS**: **Unbound** (validating recursive, batasi `access-control`!), **dnsmasq** (DNS+DHCP+TFTP ringan, dasar Pi-hole).
- **DHCP**: **Kea** (pengganti ISC DHCP EOL, mendukung database backend untuk HA).
- **Reverse proxy/LB**: **nginx** dan **HAProxy** (health check L7 penting, reload tanpa downtime); **keepalived** untuk VIP/failover.
- **NTP**: **chrony** (lebih akurat & cepat konvergen daripada ntpd). Waktu salah merusak TLS/Kerberos/log.
- **RADIUS**: **FreeRADIUS** — jalankan `freeradius -X` untuk debug 802.1X.
- **Routing**: **FRR** (OSPF/BGP/IS-IS dengan CLI mirip Cisco) menjadikan Linux router penuh; jangan lupa `ip_forward=1`.
- Distribusi router siap pakai: **VyOS** (CLI, otomasi), **OPNsense/pfSense** (GUI, firewall UTM), **OpenWrt** (router rumahan).
- systemd: **`enable --now`** agar layanan otomatis setelah reboot; `journalctl -u` untuk log.
- Keamanan: user non-root, bind ke alamat spesifik (bukan `0.0.0.0` sembarangan), TLS, firewall, sandboxing systemd.
- **Periksa `ss -tulnp`** untuk memastikan layanan tidak terekspos ke WAN secara tidak sengaja.

---

## 12. Latihan

1. Kenapa `access-control` di Unbound wajib dibatasi?
2. Apa keunggulan HAProxy dibanding load balancing DNS round-robin sederhana?
3. Bagaimana membuat load balancer Linux itu sendiri redundan?
4. Anda mengonfigurasi 802.1X dengan FreeRADIUS tetapi klien gagal autentikasi. Alat apa yang paling membantu?
5. Kenapa FRR menarik bagi seseorang yang sudah menguasai Cisco IOS?
6. Layanan berjalan sekarang tetapi hilang setelah reboot. Apa yang terlupa?
7. Anda menemukan database terekspos ke internet. Bagaimana ini bisa terjadi dan bagaimana memeriksanya di seluruh server?
8. Kapan Anda memilih VyOS/OpenWrt dibanding MikroTik RouterOS?

<details>
<summary>Jawaban</summary>

1. Karena resolver DNS yang menerima query dari **sumber mana pun (open resolver)** akan disalahgunakan untuk **DNS amplification attack**: penyerang mengirim query kecil dengan alamat sumber palsu (= korban), dan resolver Anda mengirim respons besar ke korban. Ini membuat server Anda menjadi senjata serangan, memakan bandwidth Anda, dan bisa membuat IP Anda masuk daftar hitam.
   `access-control` yang membatasi ke subnet internal (`allow`) dan menolak sisanya (`refuse`) memastikan resolver hanya melayani klien Anda sendiri. Ini persis analog dengan kesalahan `allow-remote-requests=yes` tanpa filter WAN di MikroTik — salah satu miskonfigurasi paling umum yang menjadikan perangkat bagian dari serangan.

2. HAProxy memberi kontrol yang jauh lebih baik: (a) **Health check yang sesungguhnya** — HAProxy memeriksa apakah backend benar-benar melayani (L4 atau L7 seperti `GET /healthz`) dan **otomatis mengeluarkan server yang mati** dari rotasi; DNS round-robin memberikan alamat server yang mati begitu saja karena tidak tahu statusnya. (b) **Algoritma pintar** — least connections, weighted, dsb, berdasarkan beban nyata; DNS hanya merotasi urutan buta. (c) **Session affinity/sticky** yang benar. (d) **Distribusi yang dapat diandalkan** — DNS terpengaruh caching di resolver dan klien, sehingga distribusinya tidak merata dan lambat berubah. (e) Fitur L7: TLS termination, header rewriting, routing berbasis path, rate limiting, dan **reload tanpa downtime**. DNS round-robin cocok hanya untuk distribusi geografis kasar (bersama GeoDNS), bukan load balancing yang serius.

3. Dengan **keepalived** yang mengimplementasikan **VRRP**. Dua (atau lebih) node menjalankan HAProxy/nginx, dan keepalived mengelola **Virtual IP (VIP)** yang menjadi alamat yang dituju klien. Node MASTER memegang VIP; kalau node MASTER mati **atau proses HAProxy-nya mati** (dideteksi lewat `track_script`), VIP **otomatis berpindah** ke node BACKUP lewat gratuitous ARP. Klien tidak menyadari perpindahan karena alamat yang mereka tuju tetap sama. Ini setara VRRP/HSRP di dunia appliance — dan memang memakai protokol VRRP yang sama. Untuk skala lebih besar, VIP bisa dikombinasikan dengan ECMP/anycast.

4. **`sudo freeradius -X`** — menjalankan FreeRADIUS dalam **mode debug foreground** yang menampilkan **setiap langkah** proses autentikasi secara real-time: request yang masuk dari NAS (switch/AP), atribut yang dikirim, metode EAP yang dinegosiasikan, pencarian ke modul (users file, LDAP, SQL), keputusan, dan atribut balasan (VLAN, dACL). Kalau autentikasi gagal, Anda melihat **persis di langkah mana dan mengapa** — shared secret salah, user tidak ditemukan, sertifikat bermasalah, atau metode EAP tidak cocok. Ini alat troubleshooting AAA yang tak tergantikan; selalu jalankan saat menyiapkan 802.1X baru. Lengkapi dengan `radtest` untuk uji cepat dan log di sisi NAS (`debug radius` di Cisco, `/log print` di MikroTik).

5. Karena **FRR memakai CLI yang hampir identik dengan Cisco IOS** — masuk dengan `vtysh`, lalu `configure terminal`, `router ospf`, `network X area 0`, `show ip ospf neighbor`, `show ip bgp summary`, `write memory` — semua terasa seperti IOS. Konsep OSPF (area, cost, LSA), BGP (neighbor, AS_PATH, filter), dan verifikasinya sama persis. Artinya keahlian routing yang sudah dikuasai di Cisco **langsung terpakai** di Linux, tanpa mempelajari sintaks baru.
   Ini membuat Linux menjadi **router yang serius dan gratis** untuk: lab (Containerlab memakai FRR), data center (BGP unnumbered di spine-leaf), router edge, dan cloud (route server, VPN gateway). Banyak produk jaringan komersial (NVIDIA Cumulus, SONiC, VyOS) memakai FRR di bawahnya.

6. Layanan di-**`start`** tetapi tidak di-**`enable`**. `systemctl start` hanya menjalankan layanan **saat ini**; ia tidak mendaftarkannya untuk berjalan otomatis saat boot. Setelah reboot, layanan tidak dimulai.
   **Perbaikan:** `sudo systemctl enable <layanan>` (mendaftarkan untuk boot) atau `sudo systemctl enable --now <layanan>` (mendaftarkan **dan** menjalankan sekarang sekaligus). Verifikasi dengan `systemctl is-enabled <layanan>`. Kesalahan lain yang mungkin: layanan bergantung pada layanan/mount lain yang belum siap saat boot (periksa `systemctl list-dependencies` dan `Requires=`/`After=` di unit file), atau konfigurasi jaringan belum siap (gunakan `After=network-online.target`).

7. **Penyebab umum:** layanan (database) dikonfigurasi untuk **bind ke `0.0.0.0`** (semua interface) alih-alih ke alamat internal atau `127.0.0.1`, **dan** firewall tidak memblokir portnya dari WAN, **dan/atau** server punya alamat publik langsung. Banyak database (MongoDB, Redis, Elasticsearch, MySQL) di masa lalu bahkan default ke bind semua interface tanpa autentikasi — sumber banyak kebocoran data besar.
   **Memeriksa di seluruh server:**
   ```
   ss -tulnp                    # di setiap server: apa yang listening di 0.0.0.0
   ss -tulnp | grep -v 127.0.0.1   # yang TIDAK hanya loopback
   ```
   Untuk audit dari luar: pindai rentang IP publik Anda sendiri dengan nmap dan cek **Shodan** (`org:"..."`) — sering mengungkap layanan terekspos yang tidak disadari.
   **Perbaikan:** bind layanan ke `127.0.0.1` atau alamat internal saja (di konfigurasi aplikasi), aktifkan autentikasi, terapkan firewall default-deny, dan untuk cloud pakai security group yang ketat. Otomasi pemeriksaan ini dalam pipeline (mis. dengan skrip yang menjalankan `ss` di semua host).

8. Pilih **VyOS/OpenWrt** ketika: (a) Anda ingin **menghindari vendor lock-in** dan memakai perangkat keras generik (server x86, Raspberry Pi, router yang didukung OpenWrt); (b) **otomasi dan infrastructure-as-code** adalah prioritas — VyOS punya API dan konfigurasi berbasis teks yang bagus untuk Git/CI; (c) Anda menjalankan di **cloud/VM** (VyOS populer sebagai router virtual di AWS/Azure/GCP); (d) Anda ingin **CLI mirip Junos** (VyOS) atau ekosistem paket Linux terbuka; (e) untuk router rumahan/embedded, **OpenWrt** memberi SQM/CAKE (anti-bufferbloat) dan fleksibilitas tinggi pada perangkat murah.
   Pilih **MikroTik RouterOS** ketika: (a) Anda butuh **perangkat keras terintegrasi murah** dengan port dan radio bawaan (hEX, CCR, wireless) — ekosistem hardware+software yang matang; (b) Anda bekerja di **pasar ISP kecil/RT-RW Net Indonesia** di mana MikroTik dominan dan keahliannya banyak tersedia; (c) Anda ingin **WinBox GUI** dan fitur seperti hotspot/PPPoE server yang siap pakai; (d) tim Anda sudah menguasai RouterOS. Dalam praktik, banyak lingkungan memakai **keduanya** untuk peran yang berbeda.

</details>

---

## 13. Sumber

- Unbound — https://nlnetlabs.nl/documentation/unbound/
- ISC Kea — https://kea.readthedocs.io/
- nginx — https://nginx.org/en/docs/ · HAProxy — https://docs.haproxy.org/
- keepalived — https://keepalived.readthedocs.io/
- FreeRADIUS — https://freeradius.org/documentation/
- FRRouting — https://docs.frrouting.org/
- VyOS — https://docs.vyos.io/ · OpenWrt — https://openwrt.org/docs/
- chrony — https://chrony-project.org/documentation.html

---

**Berikutnya:** `14-monitoring-troubleshooting/01-metodologi.md`. Pendekatan sistematis untuk memecahkan masalah jaringan.

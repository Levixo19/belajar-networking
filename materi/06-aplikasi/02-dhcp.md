# 06.2 DHCP

> **Prasyarat:** `04-network-layer/01`, `05-transport/01`
> **Tujuan:** Anda paham proses DORA, bisa mengonfigurasi server & relay DHCP, dan mendiagnosis kegagalan alokasi alamat.

---

## 1. Masalah yang Dipecahkan

Tanpa DHCP, setiap perangkat harus dikonfigurasi manual dengan: alamat IP, subnet mask, default gateway, dan server DNS. Untuk 500 perangkat, cara ini mustahil dikelola, apalagi setiap perangkat yang berpindah harus dikonfigurasi ulang.

**DHCP** [RFC 2131] mengotomasi seluruhnya.

Pendahulunya: **RARP** → **BOOTP** → **DHCP**. DHCP kompatibel mundur dengan BOOTP (port yang sama), tetapi menambahkan konsep **lease** (peminjaman berbatas waktu) dan opsi yang jauh lebih kaya.

---

## 2. DORA (Empat Langkah)

```
Klien (belum punya IP)                       Server DHCP
        │                                          │
   1.   │───── DISCOVER (broadcast) ──────────────►│
        │      src 0.0.0.0:68 → dst 255.255.255.255:67
        │      "Ada server DHCP di sana?"
        │                                          │
   2.   │◄──── OFFER (broadcast/unicast) ──────────│
        │      "Saya tawarkan 192.168.1.50,
        │       mask /24, gw .1, dns .1, lease 8 jam"
        │                                          │
   3.   │───── REQUEST (broadcast) ────────────────►│
        │      "Saya terima tawaran dari server X"
        │      (broadcast agar server LAIN tahu tawarannya ditolak)
        │                                          │
   4.   │◄──── ACK ────────────────────────────────│
        │      "Sah. Alamat itu milikmu selama 8 jam"
        │                                          │
        │  Klien menjalankan ARP untuk memastikan
        │  alamat itu belum dipakai (conflict detection)
```

Mnemonic: **DORA** (Discover, Offer, Request, Acknowledge).

### Kenapa REQUEST dikirim sebagai broadcast?

Kalau ada **beberapa server DHCP** di jaringan, semuanya mengirim OFFER. Klien memilih satu (biasanya yang pertama tiba) dan mengirim REQUEST **secara broadcast** yang menyebutkan server mana yang dipilih. Server lain melihatnya dan **mengembalikan alamat yang mereka tawarkan** ke pool.

### Port

```
Server : UDP 67
Klien  : UDP 68
```

> [!WARNING]
> Klien belum punya IP, sehingga:
- IP sumber = `0.0.0.0`
- IP tujuan = `255.255.255.255` (limited broadcast)
- Server mengidentifikasi klien dari **MAC address** dan field **XID** (transaction ID)

---

## 3. Lease dan Pembaruan

```
Lease diberikan: 8 jam (28800 detik)

T1 = 50% lease  (4 jam)  → klien mengirim REQUEST UNICAST ke server asal
                            "boleh saya perpanjang?"
                            Server → ACK → timer direset

T2 = 87,5% lease (7 jam) → jika T1 gagal, klien BROADCAST REQUEST
                            ke server DHCP mana pun

100% lease (8 jam)       → jika gagal semua, klien MELEPAS alamat
                            dan memulai DORA dari awal
```

> [!TIP]
> Perhatikan: pembaruan pada T1 memakai **unicast** langsung ke server, bukan broadcast. Ini efisien dan tidak mengganggu perangkat lain.

### Pesan DHCP lengkap

| Pesan | Arah | Fungsi |
|---|---|---|
| **DISCOVER** | Klien → | Mencari server |
| **OFFER** | → Klien | Server menawarkan alamat |
| **REQUEST** | Klien → | Meminta/menerima/memperpanjang |
| **ACK** | → Klien | Konfirmasi |
| **NAK** | → Klien | Penolakan (mis. klien pindah subnet, alamat tidak valid lagi) |
| **DECLINE** | Klien → | "Alamat ini sudah dipakai orang lain" (ditemukan lewat ARP) |
| **RELEASE** | Klien → | "Saya tidak butuh lagi" (mis. saat shutdown) |
| **INFORM** | Klien → | "Saya punya IP statis, tapi butuh opsi lain (DNS, dll)" |

---

## 4. Opsi DHCP

Selain IP, server memberi seluruh konfigurasi jaringan lewat opsi.

| Opsi | Nama | Isi |
|---|---|---|
| **1** | Subnet Mask | `255.255.255.0` |
| **3** | Router | Default gateway |
| **6** | DNS Server | Daftar server DNS |
| **12** | Host Name | |
| **15** | Domain Name | `perusahaan.local` |
| **28** | Broadcast Address | |
| **42** | NTP Server | |
| **43** | Vendor Specific | Dipakai untuk WLC discovery, dll |
| **51** | IP Address Lease Time | Durasi lease |
| **53** | DHCP Message Type | DISCOVER/OFFER/dst |
| **54** | Server Identifier | IP server DHCP |
| **55** | Parameter Request List | Klien meminta opsi apa saja |
| **60** | Vendor Class Identifier | Identitas perangkat (mis. "Cisco AP") |
| **61** | Client Identifier | Biasanya MAC |
| **66** | TFTP Server Name | Untuk boot perangkat |
| **67** | Bootfile Name | Nama file boot (PXE) |
| **82** | Relay Agent Information | Info dari relay: circuit ID, remote ID |
| **119** | Domain Search List | Daftar search domain |
| **121** | Classless Static Route | Rute statis tambahan |
| **150** | TFTP Server (Cisco) | Untuk telepon IP Cisco |

> [!TIP]
> **Opsi 121** memungkinkan mendorong rute statis ke klien tanpa mengubah gateway. Ini berguna untuk mengarahkan subnet tertentu lewat VPN atau firewall khusus.

> [!WARNING]
> **Opsi 82** ditambahkan oleh **DHCP relay**, berisi identitas port switch tempat klien terhubung. Dengan opsi ini, server bisa memberikan alamat berdasarkan lokasi fisik. Opsi ini juga merupakan bagian dari **DHCP snooping**.

---

## 5. DHCP Relay

Masalah: DHCP DISCOVER adalah **broadcast**, dan **router tidak meneruskan broadcast**. Jadi bagaimana klien di VLAN 20 mendapat alamat dari server DHCP di VLAN 10?

**Solusi: DHCP Relay Agent** (`ip helper-address`).

```
[Klien VLAN 20] ──broadcast──► [Router/L3 SW] ──unicast──► [Server DHCP]
                                     │
                              Relay mengubah broadcast
                              menjadi unicast, dan mengisi
                              field giaddr dengan alamat
                              interface-nya di VLAN 20
```

Dari **field `giaddr` (gateway IP address)** inilah server tahu subnet mana yang harus dipakai untuk memilih pool.

```
R1(config)# interface vlan 20
R1(config-if)# ip helper-address 192.168.10.10
R1(config-if)# ip helper-address 192.168.10.11    ← bisa lebih dari satu (redundansi)
```

> [!WARNING]
> **`ip helper-address` juga meneruskan protokol UDP lain secara default**, tidak hanya DHCP:
```
TFTP (69), DNS (53), Time (37), NetBIOS NS (137),
NetBIOS DS (138), TACACS (49), BOOTP/DHCP (67/68)
```

Kalau Anda hanya ingin DHCP:
```
R1(config)# no ip forward-protocol udp domain
R1(config)# no ip forward-protocol udp tftp
R1(config)# no ip forward-protocol udp netbios-ns
R1(config)# no ip forward-protocol udp netbios-dgm
R1(config)# no ip forward-protocol udp time
R1(config)# no ip forward-protocol udp tacacs
R1(config)# ip forward-protocol udp bootps
```

Verifikasi:
```
R1# show ip interface vlan 20 | include Helper
    Helper address is 192.168.10.10
```

---

## 6. Konfigurasi Server DHCP

### Cisco IOS

```
# Kecualikan alamat yang dipakai perangkat statis
R1(config)# ip dhcp excluded-address 192.168.10.1 192.168.10.50
R1(config)# ip dhcp excluded-address 192.168.10.250 192.168.10.254

R1(config)# ip dhcp pool VLAN10-STAFF
R1(dhcp-config)# network 192.168.10.0 255.255.255.0
R1(dhcp-config)# default-router 192.168.10.1
R1(dhcp-config)# dns-server 192.168.10.10 192.168.10.11
R1(dhcp-config)# domain-name perusahaan.local
R1(dhcp-config)# lease 0 8 0                    ← 0 hari 8 jam 0 menit
R1(dhcp-config)# option 42 ip 192.168.10.5      ← NTP server

# Reservasi berdasarkan MAC (binding manual)
R1(config)# ip dhcp pool PRINTER-LT2
R1(dhcp-config)# host 192.168.10.200 255.255.255.0
R1(dhcp-config)# client-identifier 0100.1122.3344.55
   # format: 01 (tipe Ethernet) + MAC
R1(dhcp-config)# default-router 192.168.10.1

# Verifikasi
R1# show ip dhcp binding
R1# show ip dhcp pool
R1# show ip dhcp conflict
R1# show ip dhcp server statistics
R1# clear ip dhcp binding *
```

### Klien DHCP di Cisco

```
R1(config)# interface gi0/0
R1(config-if)# ip address dhcp
R1(config-if)# no shutdown
R1# show dhcp lease
```

### ISC Kea (pengganti ISC DHCP yang sudah EOL)

`/etc/kea/kea-dhcp4.conf`:
```json
{
  "Dhcp4": {
    "interfaces-config": { "interfaces": [ "eth0" ] },
    "lease-database": {
      "type": "memfile",
      "persist": true,
      "name": "/var/lib/kea/dhcp4.leases"
    },
    "valid-lifetime": 28800,
    "renew-timer": 14400,
    "rebind-timer": 25200,

    "subnet4": [
      {
        "id": 10,
        "subnet": "192.168.10.0/24",
        "pools": [ { "pool": "192.168.10.100 - 192.168.10.200" } ],
        "option-data": [
          { "name": "routers",             "data": "192.168.10.1" },
          { "name": "domain-name-servers", "data": "192.168.10.10, 192.168.10.11" },
          { "name": "domain-name",         "data": "perusahaan.local" },
          { "name": "ntp-servers",         "data": "192.168.10.5" }
        ],
        "reservations": [
          {
            "hw-address": "00:11:22:33:44:55",
            "ip-address": "192.168.10.200",
            "hostname": "printer-lt2"
          }
        ]
      },
      {
        "id": 20,
        "subnet": "192.168.20.0/24",
        "pools": [ { "pool": "192.168.20.100 - 192.168.20.200" } ],
        "option-data": [
          { "name": "routers", "data": "192.168.20.1" }
        ]
      }
    ],

    "loggers": [{
      "name": "kea-dhcp4",
      "output_options": [{ "output": "/var/log/kea-dhcp4.log" }],
      "severity": "INFO"
    }]
  }
}
```

```bash
$ sudo kea-dhcp4 -t /etc/kea/kea-dhcp4.conf      # uji konfigurasi
$ sudo systemctl enable --now kea-dhcp4-server
$ sudo cat /var/lib/kea/dhcp4.leases
```

### dnsmasq (SOHO/lab: DNS + DHCP sekaligus)

```
dhcp-range=192.168.1.100,192.168.1.200,255.255.255.0,12h
dhcp-option=option:router,192.168.1.1
dhcp-option=option:dns-server,192.168.1.1
dhcp-option=option:domain-name,rumah.lan
dhcp-option=option:ntp-server,192.168.1.1

# Reservasi
dhcp-host=00:11:22:33:44:55,192.168.1.50,nas,infinite

# Subnet berbeda per interface/tag
dhcp-range=set:vlan20,192.168.20.100,192.168.20.200,12h
dhcp-option=tag:vlan20,option:router,192.168.20.1
```

```bash
$ cat /var/lib/misc/dnsmasq.leases
```

### Klien DHCP di Linux

```bash
# Lihat lease
$ cat /var/lib/dhcp/dhclient.leases
$ nmcli -f DHCP4 device show eth0
$ resolvectl status

# Minta ulang
$ sudo dhclient -r eth0        # release
$ sudo dhclient -v eth0        # renew dengan output verbose

# NetworkManager
$ sudo nmcli device reapply eth0
$ sudo nmcli con up "Wired connection 1"
```

### Windows
```powershell
PS> ipconfig /all
PS> ipconfig /release
PS> ipconfig /renew
PS> Get-NetIPConfiguration
```

---

## 7. Redundansi DHCP

Server DHCP adalah **single point of failure**: kalau mati, perangkat baru tidak bisa terhubung sama sekali.

| Pendekatan | Cara kerja | Catatan |
|---|---|---|
| **Split scope (80/20)** | Server A memberi 80% pool, server B memberi 20% | Sederhana, tidak butuh sinkronisasi. Klasik Microsoft |
| **Split scope 50/50** | Dua server membagi rata | Untuk kegagalan yang lebih seimbang |
| **DHCP Failover** [RFC 3074] | Dua server berbagi database lease secara aktif | Kea & Windows Server mendukung; lebih kompleks tetapi tidak ada alamat terbuang |
| **Anycast DHCP** | Beberapa server dengan IP relay yang sama | Kurang umum |
| **Beberapa `ip helper-address`** | Relay mengirim ke banyak server | Wajib, apa pun metodenya |

```
# Split scope Cisco: server A
R1(config)# ip dhcp excluded-address 192.168.10.180 192.168.10.200

# Server B
R2(config)# ip dhcp excluded-address 192.168.10.100 192.168.10.179
```

---

## 8. DHCPv6

Protokol ini berbeda dari DHCPv4 dalam beberapa hal mendasar.

| | DHCPv4 | DHCPv6 |
|---|---|---|
| Port | 67/68 | **546 (klien) / 547 (server)** |
| Alamat tujuan | Broadcast `255.255.255.255` | Multicast `ff02::1:2` (all DHCP relay agents & servers) |
| Default gateway | Opsi 3 | **TIDAK ADA** (selalu dari Router Advertisement) |
| Mode | Selalu stateful | **Stateful** atau **stateless** |
| Identitas klien | MAC | **DUID** (DHCP Unique Identifier) |
| Prefix delegation | Tidak ada | **IA_PD**: memberi seluruh prefix ke router pelanggan |

### Stateful vs Stateless

Dikendalikan oleh flag di **Router Advertisement**:

```
Flag M (Managed)       = 1 → gunakan DHCPv6 untuk ALAMAT (stateful)
Flag O (Other config)  = 1 → gunakan DHCPv6 hanya untuk opsi lain (DNS, dll)
Kedua flag = 0          → SLAAC murni (alamat dibentuk sendiri)
```

> [!WARNING]
> **Default gateway IPv6 SELALU berasal dari Router Advertisement**, tidak pernah dari DHCPv6. Perbedaan konseptual ini sering membingungkan.

### Prefix Delegation (IA_PD)

ISP memberikan **seluruh prefix** (mis. `/56`) ke router pelanggan, yang lalu membagikannya ke subnet internal.

```
ISP → memberi 2001:db8:1234:5600::/56 ke router pelanggan
Router → membagi menjadi:
           2001:db8:1234:5600::/64  (LAN)
           2001:db8:1234:5601::/64  (guest)
           2001:db8:1234:5602::/64  (IoT)
```

Mekanisme ini tidak ada padanannya di IPv4, dan menjadi salah satu alasan IPv6 lebih baik untuk jaringan rumah/kantor.

Detail lengkap IPv6 di `08-ipv6/02`.

---

## 9. Keamanan DHCP

### Ancaman

**1. Rogue DHCP Server**
```
Penyerang (atau router rumahan yang salah pasang) menjawab DISCOVER lebih cepat
→ Klien mendapat gateway dan DNS milik penyerang
→ MITM sempurna: seluruh trafik lewat penyerang
```

Ini juga terjadi **tanpa niat jahat**: karyawan membawa router Wi-Fi dari rumah dan menancapkannya ke jaringan kantor.

**2. DHCP Starvation**
```
Penyerang mengirim ribuan DISCOVER dengan MAC palsu berbeda
→ Seluruh pool habis
→ Klien sah tidak bisa mendapat alamat (denial of service)
→ Sering diikuti rogue DHCP untuk mengambil alih
```

### Mitigasi: DHCP Snooping

Switch memeriksa pesan DHCP dan hanya mengizinkan OFFER/ACK dari port yang **trusted**.

```
SW1(config)# ip dhcp snooping
SW1(config)# ip dhcp snooping vlan 10,20,30

# Port menuju server DHCP / uplink = TRUSTED
SW1(config)# interface gi0/24
SW1(config-if)# ip dhcp snooping trust

# Port menuju pengguna = UNTRUSTED (default) + rate limit
SW1(config)# interface range gi0/1-20
SW1(config-if-range)# ip dhcp snooping limit rate 10

# Option 82: matikan insertion kalau relay bukan switch ini
SW1(config)# no ip dhcp snooping information option

SW1# show ip dhcp snooping
SW1# show ip dhcp snooping binding
```

**Binding table** yang dibangun DHCP snooping (MAC ↔ IP ↔ VLAN ↔ port) menjadi dasar untuk fitur keamanan lain:
- **Dynamic ARP Inspection (DAI)**: memverifikasi ARP terhadap binding table
- **IP Source Guard**: memblokir paket dengan IP sumber yang tidak sesuai binding

Detail lengkap di `12-keamanan/02`.

---

## 10. Troubleshooting DHCP

### Gejala nomor satu: alamat `169.254.x.x` (APIPA)

Ini berarti **DHCP gagal total**. Urutan pemeriksaan:

```
1. LAYER 1 & 2
   - Kabel tersambung? Lampu link menyala?
   - Port switch di VLAN yang benar?
     SW1# show interfaces gi0/5 switchport
   - Port tidak err-disabled?
     SW1# show interfaces status err-disabled

2. APAKAH DISCOVER SAMPAI KE SWITCH?
   $ sudo tcpdump -ni eth0 'udp port 67 or udp port 68' -v
   → dari sisi klien: apakah DISCOVER keluar?

3. APAKAH RELAY DIKONFIGURASI?
   R1# show ip interface vlan 20 | include Helper
   → kalau server DHCP di subnet lain, ini WAJIB ada

4. APAKAH SERVER MENERIMA?
   Di server: tcpdump port 67
   Cek log server: journalctl -u kea-dhcp4 -f

5. APAKAH POOL MASIH ADA ALAMAT?
   R1# show ip dhcp pool
   $ grep -c "lease" /var/lib/kea/dhcp4.leases

6. APAKAH DHCP SNOOPING MEMBLOKIR?
   SW1# show ip dhcp snooping
   → apakah port menuju server sudah "trusted"?

7. APAKAH ADA ROGUE SERVER?
   $ sudo nmap --script broadcast-dhcp-discover
   → berapa banyak server yang menjawab?

8. KONFLIK ALAMAT?
   R1# show ip dhcp conflict
```

### Tabel gejala → penyebab

| Gejala | Kemungkinan penyebab |
|---|---|
| `169.254.x.x` (APIPA) | DHCP gagal total; lihat alur di atas |
| Mendapat IP dari subnet yang **salah** | VLAN salah di port; **rogue DHCP server**; `giaddr` salah |
| Mendapat IP tetapi tidak ada internet | Opsi 3 (gateway) atau opsi 6 (DNS) salah/tidak ada |
| IP berubah-ubah | Lease terlalu pendek; klien berpindah antar-server (split scope) |
| Beberapa perangkat konflik IP | Pool tumpang tindih dengan alamat statis; excluded-address tidak lengkap |
| Hanya sebagian klien gagal | Pool habis; rate limit DHCP snooping; MAC randomization vs reservasi |
| Berhasil setelah beberapa kali coba | **PortFast tidak aktif**: port butuh 30 detik STP sebelum forwarding, sehingga DHCP timeout duluan |

> [!WARNING]
> **PortFast adalah penyebab yang sering terlewat.** Tanpa PortFast, port access butuh ~30 detik melewati listening dan learning sebelum meneruskan trafik. Klien mengirim DISCOVER selama masa itu, tidak mendapat jawaban, dan menyerah ke APIPA.

```
SW1(config)# interface range gi0/1-20
SW1(config-if-range)# spanning-tree portfast
SW1(config-if-range)# spanning-tree bpduguard enable
```

### Menangkap seluruh percakapan DHCP

```bash
# Di klien
$ sudo tcpdump -ni eth0 -v 'port 67 or port 68'

# Paksa proses DORA baru
$ sudo dhclient -r eth0 && sudo dhclient -v eth0

# Melihat rogue DHCP (jalankan dari jaringan Anda sendiri)
$ sudo nmap --script broadcast-dhcp-discover
$ sudo dhcpdump -i eth0
```

Wireshark filter:
```
bootp                        ← DHCPv4 (nama lamanya BOOTP)
dhcpv6
bootp.option.dhcp == 1       ← DISCOVER
bootp.option.dhcp == 2       ← OFFER
bootp.option.dhcp == 3       ← REQUEST
bootp.option.dhcp == 5       ← ACK
```

---

## MikroTik RouterOS

### DHCP Server

```
# Cara cepat (wizard interaktif)
/ip dhcp-server setup

# Cara manual (lebih terkendali)
/ip pool add name=pool-lan ranges=192.168.1.100-192.168.1.200
/ip dhcp-server add name=dhcp-lan interface=bridge-LAN address-pool=pool-lan \
    lease-time=8h disabled=no add-arp=yes
/ip dhcp-server network add address=192.168.1.0/24 gateway=192.168.1.1 \
    dns-server=192.168.1.1,1.1.1.1 domain=perusahaan.local ntp-server=192.168.1.1

# Verifikasi
/ip dhcp-server print
/ip dhcp-server lease print
/ip dhcp-server network print

# Reservasi (lease statis)
/ip dhcp-server lease add address=192.168.1.50 mac-address=00:11:22:33:44:55 \
    server=dhcp-lan comment="Printer Lantai 2"

# Ubah lease dinamis menjadi statis (praktis!)
/ip dhcp-server lease make-static [find address=192.168.1.123]

# Opsi DHCP kustom
/ip dhcp-server option add name=opt-tftp code=66 value="'192.168.1.10'"
/ip dhcp-server option add name=opt-bootfile code=67 value="'pxelinux.0'"
/ip dhcp-server option sets add name=pxe options=opt-tftp,opt-bootfile
/ip dhcp-server network set [find address=192.168.1.0/24] dhcp-option-set=pxe
```

> [!TIP]
> **`add-arp=yes`** membuat DHCP server otomatis menambahkan entri ARP statis. Dikombinasikan dengan `arp=reply-only` di interface, ini **mencegah pengguna memasang IP statis sendiri**. Teknik keamanan ini sangat umum di RT/RW-Net dan hotspot Indonesia.

### DHCP Client

```
/ip dhcp-client add interface=ether1 disabled=no \
    use-peer-dns=yes use-peer-ntp=no add-default-route=yes default-route-distance=1
/ip dhcp-client print
/ip dhcp-client release ether1
/ip dhcp-client renew ether1
```

### DHCP Relay

```
/ip dhcp-relay add name=relay-vlan20 interface=vlan20 \
    dhcp-server=192.168.1.10 local-address=192.168.20.1 disabled=no
```

### Keamanan DHCP

```
# DHCP Snooping (RouterOS v7, pada bridge)
/interface bridge set bridge-LAN dhcp-snooping=yes add-dhcp-option82=yes
/interface bridge port set [find interface=ether24] trusted=yes    ← port ke server DHCP

# Alert saat ada rogue DHCP server
/ip dhcp-server alert add interface=bridge-LAN valid-server=00:11:22:33:44:55 \
    alert-timeout=1h on-alert="/log warning \"ROGUE DHCP TERDETEKSI!\""
/ip dhcp-server alert print
```

> [!WARNING]
> **`/ip dhcp-server alert` adalah fitur khas MikroTik**: ia mendeteksi DHCP server tidak sah di jaringan dan menjalankan skrip. Tidak ada padanan langsung di Cisco.

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `ip dhcp pool` | `/ip dhcp-server` + `/ip dhcp-server network` |
| `ip dhcp excluded-address` | tentukan range di `/ip pool` |
| `default-router` | `gateway=` di `/ip dhcp-server network` |
| `dns-server` | `dns-server=` |
| `lease 0 8 0` | `lease-time=8h` |
| Reservasi (`client-identifier`) | `/ip dhcp-server lease add mac-address=` |
| `ip helper-address` | `/ip dhcp-relay` |
| `ip dhcp snooping` | `/interface bridge set X dhcp-snooping=yes` |
| `ip dhcp snooping trust` | `/interface bridge port set X trusted=yes` |
| `show ip dhcp binding` | `/ip dhcp-server lease print` |

---

## 11. Ringkasan

- **DORA**: Discover (broadcast) → Offer → Request (broadcast, agar server lain tahu) → Acknowledge.
- Port **UDP 67 (server) / 68 (klien)**; klien memakai IP sumber `0.0.0.0` dan tujuan `255.255.255.255`.
- **Lease** diperbarui pada **T1 (50%, unicast)** dan **T2 (87,5%, broadcast)**; habis → DORA ulang.
- Opsi penting: **1** mask, **3** gateway, **6** DNS, **15** domain, **51** lease, **66/67/150** boot, **82** relay info, **121** rute statis.
- **DHCP Relay** (`ip helper-address`) mengubah broadcast menjadi unicast dan mengisi **`giaddr`** yang menentukan pool.
- `ip helper-address` meneruskan **beberapa protokol UDP lain juga**; batasi dengan `no ip forward-protocol udp <x>`.
- Redundansi: split scope 80/20, atau **DHCP failover**. Selalu konfigurasikan beberapa helper-address.
- **DHCPv6**: port 546/547, multicast, **default gateway selalu dari RA** (bukan DHCPv6), mendukung **prefix delegation**.
- Ancaman: **rogue DHCP** (MITM) dan **starvation** (DoS) → mitigasi dengan **DHCP snooping** + trusted port + rate limit.
- Binding table DHCP snooping menjadi dasar **DAI** dan **IP Source Guard**.
- **`169.254.x.x` = DHCP gagal.** Periksa VLAN, relay, pool, snooping, dan **PortFast**.

---

## 12. Latihan

1. Jelaskan setiap langkah DORA beserta jenis alamat tujuannya.
2. Kenapa REQUEST dikirim sebagai broadcast, bukan unicast ke server yang dipilih?
3. Klien di VLAN 30 tidak mendapat IP; server DHCP berada di VLAN 10. Apa yang paling mungkin kurang dan bagaimana mengonfigurasinya?
4. Sebuah perangkat mendapat IP dari subnet yang sama sekali berbeda dari yang seharusnya. Apa dugaan utama Anda?
5. Apa fungsi field `giaddr` dan siapa yang mengisinya?
6. Jelaskan perbedaan DHCPv6 stateful dan stateless, dan dari mana klien IPv6 mendapat default gateway.
7. Klien kadang mendapat IP setelah dicoba beberapa kali, tetapi sering gagal pada percobaan pertama setelah kabel dicolok. Apa dugaan Anda?
8. Bagaimana DHCP snooping mencegah serangan rogue DHCP? Apa yang harus dikonfigurasi?

<details>
<summary>Jawaban</summary>

1. (a) **DISCOVER**: klien → **broadcast** `255.255.255.255:67` dari `0.0.0.0:68`, mencari server. (b) **OFFER**: server → klien, dikirim broadcast atau unicast (bergantung flag broadcast dari klien), berisi alamat yang ditawarkan beserta opsi. (c) **REQUEST**: klien → **broadcast**, menyatakan menerima tawaran dari server tertentu (disebutkan di opsi 54). (d) **ACK**: server → klien, konfirmasi final. Setelahnya klien melakukan ARP untuk mendeteksi konflik.

2. Karena mungkin ada **beberapa server DHCP** yang semuanya mengirim OFFER. Dengan mengirim REQUEST secara broadcast dan menyebutkan server mana yang dipilih (opsi 54 Server Identifier), server-server **yang tidak dipilih** mengetahui bahwa tawaran mereka ditolak dan **mengembalikan alamat itu ke pool**. Kalau REQUEST dikirim unicast, server lain akan menahan alamat yang ditawarkan sampai timeout, sehingga pool terbuang percuma.

3. Kemungkinan besar **DHCP relay (`ip helper-address`) belum dikonfigurasi** pada interface VLAN 30. Karena router tidak meneruskan broadcast, DISCOVER dari VLAN 30 tidak pernah mencapai server di VLAN 10.
   ```
   R1(config)# interface vlan 30
   R1(config-if)# ip helper-address 192.168.10.10
   ```
   Periksa juga: apakah server punya pool untuk subnet VLAN 30, apakah routing antara VLAN 30 dan VLAN 10 bekerja, dan apakah ACL memblokir UDP 67.

4. **Rogue DHCP server** di jaringan. Ini bisa berupa serangan, tetapi paling sering router Wi-Fi rumahan yang dicolokkan karyawan (dengan port LAN, bukan WAN, ke jaringan kantor). Kemungkinan lain: port switch berada di **VLAN yang salah** sehingga klien mendapat alamat dari pool VLAN lain. Deteksi: `nmap --script broadcast-dhcp-discover` untuk melihat berapa server yang menjawab; `show ip dhcp snooping binding` bila snooping aktif. Pencegahan: aktifkan **DHCP snooping** dengan trusted port hanya ke arah server sah.

5. **`giaddr` (gateway IP address)** diisi oleh **DHCP relay agent** (router/L3 switch) dengan alamat interface tempat DISCOVER diterima. Fungsinya dua: (a) memberi tahu server **subnet mana** klien berada, sehingga server memilih pool yang benar; (b) memberi tahu server **ke mana** harus mengirim balasan (unicast ke relay, yang kemudian meneruskannya ke klien).

6. **Stateful DHCPv6** (flag `M=1` di RA): server DHCPv6 memberikan alamat IPv6 dan mencatat siapa yang memakainya (mirip DHCPv4). **Stateless** (flag `M=0, O=1`): klien membentuk alamatnya sendiri lewat **SLAAC** dari prefix di RA, dan hanya memakai DHCPv6 untuk mendapat opsi tambahan (DNS, domain search, NTP) tanpa server mencatat lease.
   **Default gateway IPv6 selalu berasal dari Router Advertisement**, tidak pernah dari DHCPv6; DHCPv6 sama sekali tidak punya opsi router. Ini berarti RA wajib ada agar IPv6 berfungsi, apa pun mode DHCPv6-nya.

7. **PortFast tidak aktif** pada port access. Tanpa PortFast, port harus melewati state STP listening (15 detik) dan learning (15 detik) sebelum forwarding, total ~30 detik. Klien mengirim DISCOVER selama masa itu, tidak mendapat jawaban karena port belum meneruskan trafik, dan menyerah ke APIPA. Setelah beberapa saat klien mencoba lagi dan berhasil karena port sudah forwarding.
   Perbaikan: `spanning-tree portfast` pada semua port access (plus `spanning-tree bpduguard enable` untuk keamanan). Kemungkinan lain: negosiasi kecepatan lambat, atau 802.1X yang membutuhkan waktu autentikasi.

8. **DHCP snooping** membagi port switch menjadi **trusted** dan **untrusted**. Pesan **OFFER, ACK, dan NAK** (yang hanya boleh datang dari server sah) akan dibuang jika tiba dari port untrusted. Karena port pengguna bersifat untrusted secara default, rogue DHCP server yang dicolokkan pengguna tidak akan pernah bisa menjawab klien lain.
   **Konfigurasi:**
   ```
   SW1(config)# ip dhcp snooping
   SW1(config)# ip dhcp snooping vlan 10,20,30
   SW1(config)# interface gi0/24                    ← ke server/uplink
   SW1(config-if)# ip dhcp snooping trust
   SW1(config)# interface range gi0/1-20            ← ke pengguna
   SW1(config-if-range)# ip dhcp snooping limit rate 10   ← anti starvation
   ```
   Rate limit juga mencegah **DHCP starvation** dengan membatasi jumlah pesan DHCP per detik dari setiap port pengguna.

</details>

---

## 13. Sumber

- RFC 2131, Dynamic Host Configuration Protocol
- RFC 2132, DHCP Options and BOOTP Vendor Extensions
- RFC 3046, DHCP Relay Agent Information Option (option 82)
- RFC 3442, Classless Static Route Option (option 121)
- RFC 8415, DHCPv6
- Cisco CCNA 200-301 v1.1, topik 4.3 (peran DHCP & DNS), 4.6 (configure DHCP client & relay), 5.7 (DHCP snooping)
- ISC Kea: https://kea.readthedocs.io/

---

**Berikutnya:** `06-aplikasi/03-http.md`. Protokol yang membawa sebagian besar trafik internet.

# 03.6 CDP, LLDP, dan Protokol Layer 2 Lainnya

> **Prasyarat:** `03-data-link/01`-`05`
> **Tujuan:** Anda bisa memetakan topologi jaringan dengan CDP/LLDP, memahami risiko keamanannya, dan mengenal protokol L2 warisan yang masih Anda temui.

---

## 1. CDP (Cisco Discovery Protocol)

Protocol proprietary Cisco yang membuat perangkat saling mengumumkan identitas ke tetangga langsungnya.

- Dikirim setiap **60 detik** ke MAC multicast `01:00:0C:CC:CC:CC`
- **Holdtime 180 detik**: informasi tetangga dihapus jika tidak ada CDP selama itu
- Bekerja di layer 2 → **tidak butuh IP address**, berguna saat troubleshooting

### Informasi yang dibawa

```
SW1# show cdp neighbors detail

Device ID: SW-ACCESS-3.perusahaan.local
Entry address(es):
  IP address: 192.168.99.13
Platform: cisco WS-C2960X-48FPD-L,  Capabilities: Switch IGMP
Interface: GigabitEthernet0/24,  Port ID (outgoing port): GigabitEthernet0/49
Holdtime : 141 sec

Version :
Cisco IOS Software, C2960X Software (C2960X-UNIVERSALK9-M), Version 15.2(7)E3

advertisement version: 2
Native VLAN: 999
Duplex: full
Management address(es):
  IP address: 192.168.99.13
```

Yang bisa Anda dapatkan tanpa login ke perangkat itu:
- Hostname
- IP address manajemen
- Model perangkat & versi IOS
- Port di sisi lawan
- Native VLAN
- Duplex
- Kemampuan (switch, router, phone, dll)

### Kegunaan praktis

```
SW1# show cdp neighbors
Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge
                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone

Device ID    Local Intrfce   Holdtme  Capability  Platform   Port ID
SW-ACC-1     Gig 0/1         156      S I         WS-C2960X  Gig 0/49
SW-ACC-2     Gig 0/2         143      S I         WS-C2960X  Gig 0/49
R1           Gig 0/24        171      R S I       ISR4331    Gig 0/0/0
PHONE-1042   Gig 0/8         162      H P M       IP Phone   Port 1
```

> [!TIP]
> **Menjalankan `show cdp neighbors` di setiap switch = peta topologi lengkap.** Ini cara tercepat mendokumentasikan jaringan yang tidak terdokumentasi. Otomasinya dibahas di `15-otomasi/03`.

### Konfigurasi

```
SW1(config)# cdp run                      ← global (default aktif)
SW1(config)# no cdp run                   ← matikan global
SW1(config-if)# cdp enable                ← per interface
SW1(config-if)# no cdp enable             ← matikan per interface
SW1(config)# cdp timer 60
SW1(config)# cdp holdtime 180

SW1# show cdp
SW1# show cdp neighbors
SW1# show cdp neighbors detail
SW1# show cdp interface
SW1# show cdp entry SW-ACC-1
SW1# clear cdp table
```

### Risiko keamanan

> [!WARNING]
> CDP membocorkan informasi berharga bagi penyerang: model perangkat, versi IOS (→ mencari exploit yang diketahui), IP manajemen, native VLAN, topologi.

**Praktik yang benar:**
```
# Matikan CDP di port yang menghadap pengguna dan internet
SW1(config)# interface range gi0/1-20
SW1(config-if-range)# no cdp enable

# Biarkan aktif hanya di uplink antar-perangkat jaringan
SW1(config)# interface gi0/24
SW1(config-if)# cdp enable
```

> [!WARNING]
> **Tetapi hati-hati:** telepon IP Cisco memakai CDP untuk mengetahui voice VLAN dan menegosiasikan daya PoE. Mematikan CDP di port telepon akan membuat telepon tidak berfungsi. Untuk port telepon, gunakan LLDP-MED sebagai pengganti, atau biarkan CDP aktif hanya di port tersebut.

---

## 2. LLDP (Link Layer Discovery Protocol (IEEE 802.1AB))

Setara CDP, tetapi berupa standar terbuka yang bekerja antar-vendor.

- MAC multicast `01:80:C2:00:00:0E`
- Default: kirim setiap **30 detik**, holdtime **120 detik**
- **Tidak aktif secara default** di perangkat Cisco (berbeda dari CDP)

### Konfigurasi

```
SW1(config)# lldp run                     ← aktifkan global
SW1(config-if)# lldp transmit             ← kirim di interface ini
SW1(config-if)# lldp receive              ← terima di interface ini
SW1(config)# lldp timer 30
SW1(config)# lldp holdtime 120
SW1(config)# lldp reinit 2

SW1# show lldp
SW1# show lldp neighbors
SW1# show lldp neighbors detail
SW1# show lldp interface
```

> [!WARNING]
> Perhatikan bahwa `lldp transmit` dan `lldp receive` terpisah, jadi Anda bisa mengaktifkan hanya salah satu. Ini berguna untuk keamanan: terima informasi tetangga tanpa mengungkap milik Anda.

### LLDP-MED

Ekstensi LLDP untuk perangkat *Media Endpoint* (telepon IP, kamera, AP). Menambahkan:
- **Network policy TLV**: memberi tahu endpoint VLAN dan prioritas QoS yang harus dipakai
- **Extended power via MDI**: negosiasi daya PoE yang lebih presisi daripada klasifikasi hardware
- **Location identification**: lokasi fisik (penting untuk panggilan darurat E911)
- **Inventory**: model, serial number, firmware

```
SW1(config-if)# switchport voice vlan 110
   → LLDP-MED otomatis memberi tahu telepon untuk memakai VLAN 110
```

### CDP vs LLDP

| | CDP | LLDP |
|---|---|---|
| Standar | Proprietary Cisco | **IEEE 802.1AB** |
| Interoperabilitas | Hanya Cisco (dan beberapa vendor yang mendukungnya) | **Semua vendor** |
| Default di Cisco | **Aktif** | Nonaktif |
| Interval | 60 detik | 30 detik |
| Holdtime | 180 detik | 120 detik |
| MAC multicast | `01:00:0C:CC:CC:CC` | `01:80:C2:00:00:0E` |
| Ekstensi endpoint | CDP untuk telepon Cisco | **LLDP-MED** (multi-vendor) |

> [!TIP]
> **Praktik terbaik:** aktifkan **keduanya** di jaringan campuran. CDP untuk perangkat Cisco lama dan telepon Cisco, LLDP untuk yang lain. Matikan keduanya di port yang menghadap pengguna dan pihak eksternal.

### LLDP di Linux

```bash
$ sudo apt install lldpd        # atau: dnf install lldpd
$ sudo systemctl enable --now lldpd

$ lldpctl
Interface: eth0, via: LLDP
  Chassis:
    ChassisID:    mac 00:1a:2b:3c:4d:5e
    SysName:      SW-ACCESS-3
    SysDescr:     Cisco IOS Software, C2960X ...
    MgmtIP:       192.168.99.13
  Port:
    PortID:       ifname GigabitEthernet0/12
    PortDescr:    Server-Rack-A-Port12
    VLAN:         10, pvid: yes

$ lldpcli show neighbors detail
```

> [!TIP]
> **Berguna untuk server:** administrator server bisa langsung tahu switch dan port mana yang terhubung tanpa menelusuri kabel atau meminta bantuan tim jaringan.

---

## 3. PPP (Point-to-Point Protocol)

Protokol layer 2 untuk link point-to-point (serial WAN, DSL, dial-up). Masih relevan karena dipakai di PPPoE untuk koneksi broadband.

### Komponen

```
┌─────────────────────────────────────┐
│  NCP (Network Control Protocol)     │  ← negosiasi layer 3 (IPCP untuk IP)
├─────────────────────────────────────┤
│  Authentication (PAP / CHAP)        │  ← opsional
├─────────────────────────────────────┤
│  LCP (Link Control Protocol)        │  ← membangun & memelihara link
├─────────────────────────────────────┤
│  HDLC-like framing                  │
└─────────────────────────────────────┘
```

**Fase pembentukan koneksi PPP:**
```
1. Link Dead        → tidak ada koneksi fisik
2. Link Establish   → LCP menegosiasi: MRU, autentikasi, magic number, kompresi
3. Authenticate     → PAP atau CHAP (opsional)
4. Network          → NCP menegosiasi layer 3 (IPCP: alamat IP, DNS)
5. Link Open        → data mengalir
6. Terminate        → koneksi ditutup
```

### PAP vs CHAP

| | PAP | CHAP |
|---|---|---|
| Kepanjangan | Password Authentication Protocol | Challenge Handshake Authentication Protocol |
| Cara kerja | Kirim username & password **plaintext** | Challenge-response dengan hash MD5 |
| Keamanan | Buruk (password terlihat) | Baik (password tidak pernah dikirim) |
| Frekuensi | Sekali saat koneksi | Berulang selama koneksi |

**Cara kerja CHAP:**
```
1. Server mengirim CHALLENGE (nilai acak) ke klien
2. Klien menghitung hash = MD5(ID + password + challenge)
3. Klien mengirim hash (bukan password)
4. Server menghitung hash yang sama dan membandingkan
5. Server mengulangi challenge secara berkala selama sesi
```

```
R1(config)# username R2 password RahasiaBersama
R1(config)# interface serial0/0/0
R1(config-if)# encapsulation ppp
R1(config-if)# ppp authentication chap
R1(config-if)# ip address 10.0.0.1 255.255.255.252

R1# show interfaces serial0/0/0
R1# debug ppp authentication
```

### PPPoE

PPPoE adalah PPP di atas Ethernet. ISP DSL/fiber memakainya untuk autentikasi pelanggan dan pemberian IP.

```
[PC] ── Ethernet ── [Router] ── PPPoE ── [ISP BRAS]
```

> [!WARNING]
> **PPPoE menambah 8 byte overhead** → MTU efektif turun dari 1500 ke **1492**. Ini menyebabkan masalah MTU klasik: sebagian situs terbuka, sebagian menggantung. Solusinya **MSS clamping**:
```
R1(config-if)# ip tcp adjust-mss 1452
```
(1492 − 20 IP − 20 TCP = 1452)

### HDLC

Protokol serial sederhana. **Cisco HDLC** adalah varian proprietary yang menambahkan field protokol (agar bisa membawa banyak protokol L3). Ini adalah encapsulation default pada interface serial Cisco.

> [!WARNING]
> Cisco HDLC tidak interoperable dengan HDLC vendor lain. Untuk link antar-vendor, gunakan **PPP**.

---

## 4. Frame Relay dan ATM (Konteks Historis)

Anda tidak akan mengonfigurasinya di jaringan baru, tetapi mungkin menemuinya di dokumentasi lama atau soal ujian.

### Frame Relay

- Teknologi WAN packet-switched tahun 1990-an, menggantikan leased line yang mahal.
- Istilah yang perlu dikenal:
  - **DLCI** (*Data Link Connection Identifier*): identitas circuit virtual, bermakna lokal saja
  - **PVC** (*Permanent Virtual Circuit*): jalur virtual permanen antar-lokasi
  - **CIR** (*Committed Information Rate*): bandwidth yang dijamin
  - **LMI** (*Local Management Interface*): pensinyalan status PVC
  - **FECN/BECN**: notifikasi congestion
  - **Inverse ARP**: memetakan DLCI ke alamat IP secara otomatis
- Masalah klasik: **split horizon** pada topologi hub-and-spoke dengan interface multipoint (routing update dari satu spoke tidak diteruskan ke spoke lain) → solusinya subinterface point-to-point.

### ATM

- ATM (*Asynchronous Transfer Mode*) memakai **sel tetap 53 byte** (48 data + 5 header).
- Dirancang untuk membawa suara, video, dan data dengan QoS ketat.
- "Cell tax": overhead ~9% membuatnya tidak efisien untuk data.
- Kalah dari Ethernet + IP. Masih terpakai di sebagian backbone DSL warisan.

Keduanya menunjukkan bahwa teknologi yang secara teknis lebih canggih bisa kalah oleh yang lebih sederhana dan murah, dalam hal ini Ethernet.

---

## 5. Protokol L2 Lain yang Perlu Dikenal

### 802.1X (Port-Based Network Access Control)

Autentikasi di layer 2 sebelum port diizinkan melewatkan trafik.

```
[Supplicant]  ←EAPOL→  [Authenticator]  ←RADIUS→  [Authentication Server]
  (PC/laptop)             (switch)                    (ISE/FreeRADIUS)
```

- **EAPOL** (EtherType `0x888E`): pembawa pesan EAP di Ethernet
- Port tetap tertutup sampai autentikasi berhasil
- Bisa memberikan VLAN dinamis, dACL, dan SGT berdasarkan identitas pengguna

Dibahas lengkap di `12-keamanan/04`.

### 802.1AE (MACsec)

Enkripsi di layer 2, hop-by-hop antar-perangkat.

- Mengenkripsi seluruh frame (termasuk header L3 ke atas) di kabel
- Melindungi dari penyadapan fisik pada kabel di antara dua switch
- Berbeda dari IPsec (L3, end-to-end), MACsec hanya melindungi satu link

### LLDP-MED, CDP untuk telepon
Sudah dibahas di §1-2.

### Slow Protocols (802.3ad Annex)
MAC `01:80:C2:00:00:02`, EtherType `0x8809`. Membawa LACP dan Marker Protocol.

### VXLAN (Pengantar)

Enkapsulasi frame Ethernet (L2) ke dalam UDP (L4) sehingga bisa dibawa melintasi jaringan IP mana pun.

```
┌──────┬──────────┬─────┬────────┬─────────────────────┬─────┐
│ Eth  │ IP luar  │ UDP │ VXLAN  │  Frame Ethernet asli │ FCS │
│ luar │          │4789 │ header │  (L2 tenant)         │     │
└──────┴──────────┴─────┴────────┴─────────────────────┴─────┘
```

- **VNI** 24 bit → 16.777.216 segmen (vs 4096 VLAN)
- Memungkinkan L2 membentang lintas data center tanpa memperluas domain STP
- Overhead 50 byte → underlay harus memakai MTU besar

Dibahas lengkap di `16-datacenter-cloud-sdn/02`.

---

## 6. Praktik: Memetakan Jaringan dari Nol

Skenario nyata: Anda baru bergabung dan tidak ada dokumentasi jaringan.

```
1. Mulai dari satu switch yang Anda ketahui:
   SW1# show cdp neighbors detail
   SW1# show lldp neighbors detail

2. Catat setiap tetangga: hostname, IP, port lokal, port lawan

3. SSH ke setiap tetangga, ulangi langkah 1–2

4. Lanjutkan sampai tidak ada perangkat baru (breadth-first search)

5. Lengkapi dengan:
   SW1# show interfaces status          ← port mana yang terpakai
   SW1# show vlan brief                 ← VLAN yang ada
   SW1# show interfaces trunk           ← jalur trunk
   SW1# show spanning-tree root         ← siapa root bridge per VLAN
   SW1# show ip route                   ← topologi L3
   SW1# show ip arp                     ← perangkat yang aktif

6. Gambar diagram fisik (perangkat + kabel) dan logis (VLAN + subnet)
```

Skrip Python sederhana untuk otomasi (versi lengkap di `15-otomasi/03`):
```python
from netmiko import ConnectHandler

def crawl(ip, username, password, visited=None):
    visited = visited or set()
    if ip in visited:
        return visited
    visited.add(ip)

    conn = ConnectHandler(device_type='cisco_ios', host=ip,
                          username=username, password=password)
    neighbors = conn.send_command('show cdp neighbors detail', use_textfsm=True)
    conn.disconnect()

    for n in neighbors:
        for addr in n.get('mgmt_address', []) or []:
            crawl(addr, username, password, visited)
    return visited
```

---

## MikroTik RouterOS

### MNDP, CDP, dan LLDP

RouterOS punya protokol penemuannya sendiri, **MNDP** (MikroTik Neighbor Discovery Protocol), dan juga bisa berbicara CDP dan LLDP.

```
# Lihat tetangga (menggabungkan MNDP + CDP + LLDP)
/ip neighbor print
/ip neighbor print detail

Address    MAC-Address       Identity      Version    Board     Interface
192.168.1.2 CC:2D:E0:11:22:33 SW-ACCESS-01 7.13.2     CRS326    ether1
```

```
# Atur protokol dan interface yang dipakai
/ip neighbor discovery-settings set discover-interface-list=LAN protocol=cdp,lldp,mndp

# Matikan penemuan di interface publik (WAJIB untuk keamanan)
/interface list add name=LAN
/interface list member add list=LAN interface=bridge-LAN
/ip neighbor discovery-settings set discover-interface-list=LAN
```

> [!WARNING]
> **MNDP/CDP/LLDP membocorkan informasi berharga**: hostname, versi RouterOS (untuk mencari exploit), model perangkat, alamat IP. Selalu batasi ke interface internal saja.

### PPPoE

MikroTik sangat sering dipakai sebagai PPPoE server (ISP/RT-RW Net) maupun client.

```
# PPPoE CLIENT (menghubungkan ke ISP)
/interface pppoe-client add name=pppoe-isp interface=ether1 \
    user=pelanggan001 password=RahasiaISP \
    add-default-route=yes use-peer-dns=yes disabled=no

/interface pppoe-client print
/interface pppoe-client monitor pppoe-isp

# PPPoE SERVER (menjadi ISP)
/interface pppoe-server server add service-name=ISP-KITA interface=bridge-LAN \
    default-profile=profil-pelanggan one-session-per-host=yes disabled=no

/ppp profile add name=profil-pelanggan local-address=10.10.0.1 \
    remote-address=pool-pelanggan dns-server=10.10.0.1 \
    rate-limit=10M/10M

/ip pool add name=pool-pelanggan ranges=10.10.0.10-10.10.0.254

/ppp secret add name=pelanggan001 password=RahasiaKuat service=pppoe \
    profile=profil-pelanggan

# Lihat sesi aktif
/ppp active print
/interface pppoe-server print
```

> [!WARNING]
> **PPPoE mengurangi MTU menjadi 1492.** Aktifkan MSS clamping agar transfer besar tidak menggantung:
```
/ip firewall mangle add chain=forward protocol=tcp tcp-flags=syn \
    action=change-mss new-mss=clamp-to-pmtu passthrough=yes
```

> [!TIP]
> **`rate-limit`** di profile PPP memberi pembatasan bandwidth per pelanggan secara otomatis. Inilah alasan MikroTik dominan untuk RT/RW-Net dan ISP kecil di Indonesia. Format: `rx/tx` atau lengkap `rx/tx rx-burst/tx-burst rx-burst-threshold/tx-burst-threshold rx-burst-time/tx-burst-time priority rx-min/tx-min`.

### EoIP: Ethernet over IP

Tunnel layer 2 khas MikroTik yang membawa frame Ethernet penuh di atas IP.

```
# Router A
/interface eoip add name=eoip-cabang remote-address=203.0.113.20 tunnel-id=100
/interface bridge port add bridge=bridge-LAN interface=eoip-cabang

# Router B
/interface eoip add name=eoip-pusat remote-address=203.0.113.10 tunnel-id=100
/interface bridge port add bridge=bridge-LAN interface=eoip-pusat
```

Hasilnya: dua LAN yang terpisah secara geografis menjadi **satu broadcast domain**.

> [!WARNING]
> **EoIP memperluas domain broadcast dan STP lintas WAN.** Satu masalah di satu sisi bisa melumpuhkan sisi lain. Gunakan dengan hati-hati, dan selalu di dalam tunnel terenkripsi (IPsec atau WireGuard) karena EoIP sendiri tidak terenkripsi.

```
# EoIP dengan IPsec
/interface eoip set eoip-cabang ipsec-secret=RahasiaKuat allow-fast-path=no
```

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `show cdp neighbors` / `show lldp neighbors` | `/ip neighbor print` |
| `no cdp enable` | `/ip neighbor discovery-settings set discover-interface-list=` |
| `interface Dialer` + PPPoE | `/interface pppoe-client` |
| `bba-group pppoe` | `/interface pppoe-server server` |
| L2TPv3 / VPLS | `/interface eoip` |
| `ip tcp adjust-mss` | `/ip firewall mangle action=change-mss` |

---

## 7. Ringkasan

- **CDP** (Cisco, aktif default, 60 s/180 s) dan **LLDP** (IEEE 802.1AB, nonaktif default di Cisco, 30 s/120 s) mengumumkan identitas ke tetangga langsung.
- Keduanya bekerja di L2 → berguna untuk troubleshooting tanpa IP.
- Informasi yang dibawa berharga bagi administrator dan juga bagi penyerang, jadi matikan di port yang menghadap pengguna/eksternal.
- **LLDP-MED** memberi telepon IP informasi voice VLAN, QoS, daya PoE, dan lokasi.
- `show cdp/lldp neighbors` di setiap perangkat = peta topologi.
- **PPP** untuk link point-to-point; **CHAP** lebih aman daripada PAP. **PPPoE** mengurangi MTU ke 1492 → butuh MSS clamping.
- Frame Relay dan ATM sudah usang; kenali istilahnya (DLCI, PVC, CIR) untuk ujian dan dokumentasi lama.
- **802.1X** untuk autentikasi port; **MACsec** untuk enkripsi per-link; **VXLAN** untuk overlay L2 di atas L3.

---

## 8. Latihan

1. Apa perbedaan utama CDP dan LLDP, dan kapan Anda memakai masing-masing?
2. Anda mematikan CDP di semua port untuk keamanan. Telepon IP Cisco berhenti mendapat voice VLAN. Apa yang terjadi dan bagaimana solusinya?
3. Pelanggan PPPoE mengeluh beberapa situs terbuka tetapi beberapa lain menggantung. Apa dugaan Anda dan apa perbaikannya?
4. Jelaskan mengapa CHAP lebih aman daripada PAP.
5. Anda mendapat MAC address sebuah perangkat dari log keamanan, dan harus menemukan port fisiknya. Bagaimana CDP/LLDP membantu proses ini?
6. Kenapa VXLAN diperlukan padahal sudah ada VLAN?

<details>
<summary>Jawaban</summary>

1. CDP adalah **proprietary Cisco** dan **aktif secara default** di perangkat Cisco; LLDP adalah **standar IEEE 802.1AB** yang bekerja **antar-vendor** tetapi harus diaktifkan manual di Cisco. Gunakan CDP di lingkungan Cisco murni (dan untuk telepon Cisco lama); gunakan LLDP di lingkungan multi-vendor. Di jaringan campuran, aktifkan keduanya.

2. Telepon IP Cisco memakai **CDP** untuk mengetahui voice VLAN dan menegosiasikan daya PoE. Mematikan CDP memutus mekanisme itu. Solusi: (a) aktifkan kembali CDP hanya di port telepon, atau (b) aktifkan **LLDP-MED** yang menyediakan fungsi setara secara standar (pastikan telepon mendukungnya). Kombinasi `switchport voice vlan 110` + LLDP-MED bekerja untuk telepon multi-vendor modern.

3. **Masalah MTU.** PPPoE menambah 8 byte overhead sehingga MTU efektif 1492, bukan 1500. Situs yang mengirim paket besar dengan bit DF diset akan gagal jika ICMP "Fragmentation Needed" diblokir di suatu tempat (PMTUD gagal) → koneksi terbentuk tetapi transfer menggantung. Perbaikan: **MSS clamping** di router, yaitu `ip tcp adjust-mss 1452` pada interface yang menghadap LAN, sehingga TCP menegosiasikan segmen yang muat.

4. **PAP** mengirim username dan password dalam plaintext, sehingga siapa pun yang menyadap link bisa membacanya. **CHAP** tidak pernah mengirim password: server mengirim challenge acak, klien membalas dengan hash MD5(ID + password + challenge). Penyadap hanya melihat hash yang berbeda setiap kali, dan tidak bisa memakainya ulang karena challenge selalu baru. CHAP juga mengulang verifikasi secara berkala selama sesi, sehingga melindungi dari pembajakan sesi.

5. CDP/LLDP tidak menunjukkan MAC end device secara langsung, tetapi memberi **peta topologi** yang diperlukan untuk menelusuri. Prosesnya: (a) di switch mana pun, `show mac address-table address <MAC>` menunjukkan port tempat MAC itu terlihat; (b) jika port itu adalah **uplink**, gunakan `show cdp neighbors <port>` untuk mengetahui switch berikutnya; (c) SSH ke switch itu dan ulangi; (d) berhenti ketika MAC terlihat di port access; itulah port fisiknya.

6. Dua alasan utama: (a) **Batas skala**: VLAN ID hanya 12 bit → maksimum 4096 segmen, tidak cukup untuk cloud/data center multi-tenant. VXLAN memakai VNI 24 bit → 16 juta segmen. (b) **Batas topologi**: VLAN memerlukan jalur layer 2 yang bersambung, sehingga memperluas domain STP dan failure domain. VXLAN membawa frame L2 di dalam paket IP, sehingga bisa melintasi jaringan L3 mana pun (termasuk antar-data-center) sambil tetap memakai ECMP dan routing yang stabil, tanpa memperbesar domain STP.

</details>

---

## 9. Sumber

- IEEE 802.1AB-2016: Link Layer Discovery Protocol
- ANSI/TIA-1057: LLDP-MED
- RFC 1661: Point-to-Point Protocol (PPP)
- RFC 1994: PPP CHAP
- RFC 2516: PPPoE
- RFC 7348: VXLAN
- Cisco CCNA 200-301 v1.1, topik 2.3 (Layer 2 discovery protocols: CDP dan LLDP)

---

**Berikutnya:** `04-network-layer/01-ipv4.md`. Masuk ke Layer 3, jantung internet.

# 12.2 — Serangan Layer 2 dan Mitigasinya

> **Prasyarat:** `03-data-link/02`–`04`, `06-aplikasi/02`
> **Tujuan:** Anda bisa mengenali setiap serangan layer 2 dan mengonfigurasi seluruh fitur mitigasinya di Cisco dan MikroTik.

> ⚠️ **Layer 2 adalah lapisan yang paling sering diabaikan.** Semua enkripsi dan firewall di lapisan atas menjadi tidak berarti kalau penyerang bisa mengendalikan layer 2 — ia dapat melakukan MITM terhadap seluruh trafik sebelum enkripsi diterapkan.

---

## 1. MAC Flooding / CAM Table Overflow

### Serangan

```
1. Penyerang mengirim RIBUAN frame dengan MAC sumber PALSU yang berbeda-beda
2. MAC address table switch PENUH (kapasitas 8.000–32.000 entri)
3. Switch tidak bisa mempelajari MAC baru
4. Switch mulai MEM-FLOOD semua unicast yang tidak dikenal ke SEMUA port
5. Penyerang menangkap SELURUH trafik segmen itu
```

⚠️ Efeknya: **switch berperilaku seperti hub.** Alat seperti `macof` (bagian dari dsniff) mengirim 155.000 MAC palsu per menit.

### Mitigasi: Port Security

```
SW1(config)# interface gi0/5
SW1(config-if)# switchport mode access
SW1(config-if)# switchport port-security
SW1(config-if)# switchport port-security maximum 2
SW1(config-if)# switchport port-security mac-address sticky
SW1(config-if)# switchport port-security violation restrict
SW1(config-if)# switchport port-security aging time 60
SW1(config-if)# switchport port-security aging type inactivity
```

**Mode violation:**

| Mode | Membuang trafik | Kirim SNMP/syslog | Naikkan counter | Shutdown port |
|---|---|---|---|---|
| **protect** | ✅ | ❌ | ❌ | ❌ |
| **restrict** | ✅ | ✅ | ✅ | ❌ |
| **shutdown** (default) | ✅ | ✅ | ✅ | ✅ (err-disabled) |

💡 **`restrict` sering lebih baik daripada `shutdown` di produksi** — Anda mendapat peringatan tanpa memutus pengguna karena kesalahan kecil (mis. seseorang memindahkan laptop).

⚠️ **`maximum 1` terlalu ketat** kalau ada telepon IP dengan PC di belakangnya, atau VM di laptop. Gunakan `maximum 2` atau 3.

```
SW1# show port-security
SW1# show port-security interface gi0/5
SW1# show port-security address

# Pemulihan otomatis dari err-disabled
SW1(config)# errdisable recovery cause psecure-violation
SW1(config)# errdisable recovery interval 300
```

### MikroTik

```
# Batasi jumlah MAC per port pada bridge
/interface bridge port set [find interface=ether5] learn=yes
/interface bridge settings set max-learned-entries=100

# Atau kunci MAC secara eksplisit dengan bridge filter
/interface bridge filter add chain=forward in-interface=ether5 \
    src-mac-address=!00:11:22:33:44:55/FF:FF:FF:FF:FF:FF action=drop
```

⚠️ **RouterOS tidak punya port security selengkap Cisco.** Alternatif yang lebih baik: **DHCP snooping + ARP reply-only** (lihat §3), atau **802.1X**.

---

## 2. ARP Spoofing / ARP Poisoning

### Serangan — MITM klasik

```
Normal:
  Host A (192.168.1.10) ──→ Gateway (192.168.1.1, MAC bb:bb)

Serangan:
  1. Penyerang mengirim ARP Reply palsu (gratuitous ARP) ke Host A:
     "192.168.1.1 ada di MAC penyerang (cc:cc)"
  2. Penyerang mengirim ARP palsu ke Gateway:
     "192.168.1.10 ada di MAC penyerang (cc:cc)"
  3. Kedua pihak memperbarui ARP cache
  4. SELURUH trafik A ↔ Gateway melewati penyerang

  Host A ──→ Penyerang ──→ Gateway
         ←──           ←──
```

⚠️ **ARP tidak punya autentikasi sama sekali.** Setiap host memercayai ARP Reply apa pun yang diterimanya — bahkan yang tidak diminta.

**Dampak:** penyadapan seluruh trafik, SSL stripping, injeksi konten, pencurian kredensial, DoS.

Alat: `arpspoof`, `ettercap`, `bettercap`.

### Mitigasi: Dynamic ARP Inspection (DAI)

DAI memvalidasi setiap paket ARP terhadap **binding table DHCP snooping**.

```
SW1(config)# ip dhcp snooping                      ← WAJIB dulu!
SW1(config)# ip dhcp snooping vlan 10,20
SW1(config)# ip arp inspection vlan 10,20

# Port ke server/uplink = trusted
SW1(config)# interface gi0/24
SW1(config-if)# ip dhcp snooping trust
SW1(config-if)# ip arp inspection trust

# Port pengguna = untrusted + rate limit
SW1(config)# interface range gi0/1-20
SW1(config-if-range)# ip arp inspection limit rate 15

# Validasi tambahan
SW1(config)# ip arp inspection validate src-mac dst-mac ip
```

⚠️ **DAI BERGANTUNG pada DHCP snooping binding table.** Host dengan **IP statis** tidak ada di tabel itu → ARP-nya akan **dibuang**. Solusinya: ARP ACL.

```
SW1(config)# arp access-list SERVER-STATIS
SW1(config-arp-nacl)# permit ip host 192.168.10.50 mac host 0011.2233.4455
SW1(config)# ip arp inspection filter SERVER-STATIS vlan 10
```

```
SW1# show ip arp inspection
SW1# show ip arp inspection statistics
SW1# show ip dhcp snooping binding
```

### Mitigasi di MikroTik

```
# Teknik khas MikroTik: ARP reply-only + DHCP add-arp
/ip dhcp-server set dhcp1 add-arp=yes
/interface bridge set bridge-LAN arp=reply-only

# Untuk host statis, tambahkan entri ARP manual
/ip arp add address=192.168.10.50 mac-address=00:11:22:33:44:55 \
    interface=bridge-LAN comment="Server file"
```

💡 **Ini kombinasi yang sangat efektif dan sederhana:** router **hanya** mengenali host yang alamatnya diberikan oleh DHCP server-nya sendiri (atau didaftarkan manual). Host yang memasang IP statis sendiri atau melakukan ARP spoofing **tidak akan bisa berkomunikasi sama sekali**. Sangat umum dipakai di RT/RW-Net dan hotspot Indonesia.

⚠️ Konsekuensinya: setiap perangkat dengan IP statis (server, printer, AP) **harus** didaftarkan di `/ip arp` atau diberi lease statis di DHCP.

---

## 3. DHCP Attacks

### Serangan 1: Rogue DHCP Server

```
Penyerang menjalankan DHCP server palsu
→ menjawab DISCOVER lebih cepat daripada server sah
→ klien menerima gateway dan DNS milik penyerang
→ MITM SEMPURNA untuk seluruh trafik
```

⚠️ **Sering terjadi TANPA niat jahat** — karyawan mencolokkan router Wi-Fi rumahan dengan port LAN (bukan WAN) ke jaringan kantor. Router itu langsung menjadi DHCP server untuk seluruh segmen.

### Serangan 2: DHCP Starvation

```
Penyerang mengirim ribuan DISCOVER dengan MAC palsu berbeda
→ seluruh pool DHCP habis
→ klien sah tidak bisa mendapat alamat (DoS)
→ sering diikuti rogue DHCP untuk mengambil alih
```

Alat: `yersinia`, `dhcpstarv`.

### Mitigasi: DHCP Snooping

```
SW1(config)# ip dhcp snooping
SW1(config)# ip dhcp snooping vlan 10,20,30

# Port ke server DHCP / uplink = TRUSTED
SW1(config)# interface gi0/24
SW1(config-if)# ip dhcp snooping trust

# Port pengguna = UNTRUSTED (default) + rate limit
SW1(config)# interface range gi0/1-20
SW1(config-if-range)# ip dhcp snooping limit rate 10

# Option 82 — matikan kalau relay bukan switch ini
SW1(config)# no ip dhcp snooping information option
```

**Cara kerja:**
```
Port UNTRUSTED:
  ❌ OFFER, ACK, NAK, LEASEQUERY  → DIBUANG
  ✅ DISCOVER, REQUEST, RELEASE   → diteruskan (setelah verifikasi)

Port TRUSTED:
  ✅ Semua pesan DHCP diizinkan
```

**Binding table yang dibangun** menjadi dasar untuk **DAI** dan **IP Source Guard**:
```
SW1# show ip dhcp snooping binding
MacAddress          IpAddress        Lease(sec)  Type           VLAN  Interface
------------------  ---------------  ----------  -------------  ----  ------------
00:11:22:33:44:55   192.168.10.101   28742       dhcp-snooping   10   GigabitEthernet0/5
```

### MikroTik

```
# DHCP snooping pada bridge (RouterOS v7)
/interface bridge set bridge-LAN dhcp-snooping=yes add-dhcp-option82=yes
/interface bridge port set [find interface=ether24] trusted=yes

# Alert rogue DHCP
/ip dhcp-server alert add interface=bridge-LAN valid-server=00:11:22:33:44:55 \
    alert-timeout=1h on-alert="/log warning \"ROGUE DHCP TERDETEKSI!\""
```

---

## 4. IP Spoofing

Penyerang memalsukan alamat IP sumber.

### Mitigasi: IP Source Guard

Memvalidasi alamat IP sumber terhadap binding table DHCP snooping.

```
SW1(config)# interface gi0/5
SW1(config-if)# ip verify source                    ← periksa IP saja
SW1(config-if)# ip verify source port-security      ← periksa IP + MAC

SW1# show ip verify source
```

⚠️ Sama seperti DAI, **IP Source Guard bergantung pada DHCP snooping**. Host statis butuh entri binding manual:
```
SW1(config)# ip source binding 0011.2233.4455 vlan 10 192.168.10.50 interface gi0/6
```

### uRPF (untuk router)

**Unicast Reverse Path Forwarding** memeriksa apakah alamat sumber paket dapat dijangkau lewat interface tempat paket itu tiba.

```
R1(config-if)# ip verify unicast source reachable-via rx      ← strict mode
R1(config-if)# ip verify unicast source reachable-via any     ← loose mode
```

| Mode | Cara kerja | Kapan |
|---|---|---|
| **Strict** | Alamat sumber harus dapat dijangkau **lewat interface yang sama** | Link single-homed, edge pelanggan |
| **Loose** | Alamat sumber harus ada di routing table (interface mana pun) | Link multi-homed, asymmetric routing |

⚠️ **Strict mode merusak asymmetric routing** — gunakan loose mode kalau ada beberapa jalur.

```
# MikroTik
/ip settings set rp-filter=strict         ← atau loose
/interface set ether1 ... 
```

💡 **BCP 38** (RFC 2827) mewajibkan setiap operator memfilter paket dengan alamat sumber yang tidak sah dari jaringannya. Kalau semua operator melakukannya, **amplification attack berbasis spoofing akan hilang**. Ini bagian dari MANRS.

---

## 5. VLAN Hopping

### Serangan 1: Switch Spoofing

```
Penyerang mengirim frame DTP dari laptopnya
→ port yang dikonfigurasi "dynamic auto" atau "dynamic desirable"
  BERNEGOSIASI menjadi TRUNK
→ penyerang mendapat akses ke SEMUA VLAN
```

**Mitigasi:**
```
SW1(config-if)# switchport mode access      ← paksa mode access
SW1(config-if)# switchport nonegotiate      ← MATIKAN DTP
```

⚠️ **`switchport nonegotiate` wajib pada semua port** — access maupun trunk. DTP tidak memberi manfaat yang sepadan dengan risikonya.

### Serangan 2: Double Tagging

```
Penyerang mengirim frame dengan DUA tag VLAN:
  [Tag luar: VLAN 1 (native)] [Tag dalam: VLAN 20] [Data]

1. Switch pertama menghapus tag luar (karena native VLAN tidak bertag)
   dan meneruskan lewat trunk
2. Switch kedua melihat tag VLAN 20 → mengirim ke VLAN 20
→ Penyerang mengirim ke VLAN 20 padahal ia di VLAN 1
```

⚠️ **Serangan ini bersifat SATU ARAH** (tidak ada jalur balik), tetapi cukup untuk DoS atau injeksi.

**Mitigasi:**
```
1. Native VLAN harus VLAN yang TIDAK DIPAKAI dan tidak sama dengan VLAN akses mana pun
2. JANGAN pakai VLAN 1 untuk apa pun
3. Tag native VLAN secara eksplisit
```

```
SW1(config)# vlan 999
SW1(config-vlan)# name NATIVE-TIDAK-DIPAKAI
SW1(config-if)# switchport trunk native vlan 999
SW1(config)# vlan dot1q tag native              ← tag semua VLAN termasuk native
```

### Praktik terbaik VLAN

```
✅ Ubah native VLAN ke VLAN yang tidak dipakai
✅ JANGAN pakai VLAN 1 untuk data, native, atau manajemen
✅ Matikan DTP (switchport nonegotiate)
✅ Batasi VLAN pada trunk (switchport trunk allowed vlan)
✅ Port tidak terpakai → VLAN parkir + shutdown
✅ Tag native VLAN (vlan dot1q tag native)
```

```
SW1(config)# interface range gi0/20-24
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 999
SW1(config-if-range)# switchport nonegotiate
SW1(config-if-range)# shutdown
```

---

## 6. STP Attacks

### Serangan: Root Bridge Takeover

```
Penyerang mengirim BPDU dengan priority sangat rendah (0)
→ menjadi ROOT BRIDGE
→ SELURUH trafik antar-switch dialihkan melewatinya
→ MITM skala jaringan + DoS (topologi menjadi sangat buruk)
```

### Mitigasi

```
# BPDU Guard — port access yang menerima BPDU akan di-shutdown
SW1(config)# spanning-tree portfast bpduguard default
SW1(config-if)# spanning-tree bpduguard enable

# Root Guard — port tidak boleh menjadi jalur ke root
SW1(config-if)# spanning-tree guard root

# Loop Guard — port blocking tidak boleh forwarding kalau BPDU berhenti
SW1(config)# spanning-tree loopguard default

# BPDU Filter — HATI-HATI, mematikan deteksi loop
# (hanya untuk kasus khusus)
```

**Penerapan yang benar:**
```
Port access (ke PC)       → PortFast + BPDU Guard
Port ke switch access     → Root Guard (dari sisi distribution)
Trunk antar-switch fiber  → Loop Guard + UDLD
```

Detail lengkap di `03-data-link/04`.

### MikroTik

```
/interface bridge set bridge-LAN protocol-mode=rstp
/interface bridge port set [find interface=ether5] edge=yes-discover bpdu-guard=yes
/interface bridge port set [find interface=ether24] root-guard=yes
```

---

## 7. CDP/LLDP Reconnaissance

CDP dan LLDP membocorkan: hostname, model perangkat, **versi IOS** (untuk mencari exploit), IP manajemen, native VLAN, dan kemampuan perangkat.

```
SW1(config)# interface range gi0/1-20
SW1(config-if-range)# no cdp enable
SW1(config-if-range)# no lldp transmit
```

⚠️ **Telepon IP Cisco memerlukan CDP** untuk mengetahui voice VLAN. Untuk port telepon, biarkan CDP aktif atau gunakan **LLDP-MED**.

```
# MikroTik
/ip neighbor discovery-settings set discover-interface-list=LAN
```

---

## 8. Storm Control

Membatasi broadcast, multicast, atau unicast berlebihan.

```
SW1(config-if)# storm-control broadcast level 5.00
SW1(config-if)# storm-control multicast level 5.00
SW1(config-if)# storm-control unicast level 80.00
SW1(config-if)# storm-control action shutdown       ← atau trap

SW1# show storm-control
```

💡 Storm control adalah **jaring pengaman** untuk broadcast storm yang lolos dari STP — misalnya karena loop di perangkat downstream yang tidak menjalankan STP.

---

## 9. Port Isolation

Mencegah perangkat dalam VLAN yang sama saling berkomunikasi.

### Protected Port (sederhana, dalam satu switch)

```
SW1(config-if)# switchport protected
```
Port protected tidak bisa berkomunikasi dengan port protected lain **di switch yang sama**.

### Private VLAN (lengkap, lintas switch)

| Tipe port | Bisa bicara dengan |
|---|---|
| **Promiscuous** | Semua (biasanya gateway) |
| **Isolated** | **Hanya promiscuous** |
| **Community** | Promiscuous + community lain di grup sama |

Detail di `03-data-link/03`.

### MikroTik

```
/interface bridge port set [find interface=ether5] horizon=1
/interface bridge port set [find interface=ether6] horizon=1
   ← port dengan horizon sama tidak bisa saling berkomunikasi
```

💡 **Isolasi port sangat penting untuk jaringan tamu, hotel, apartemen, dan IoT** — mencegah satu perangkat terinfeksi menyerang tetangganya.

---

## 10. 802.1X — Kontrol Akses Berbasis Port

Solusi paling kuat untuk layer 2: **tidak ada perangkat yang bisa berkomunikasi sebelum terautentikasi**.

```
[Supplicant]  ←EAPOL→  [Authenticator]  ←RADIUS→  [Auth Server]
  (PC/laptop)             (switch)              (ISE/NPS/FreeRADIUS)
```

```
# Cisco — konfigurasi dasar
SW1(config)# aaa new-model
SW1(config)# aaa authentication dot1x default group radius
SW1(config)# aaa authorization network default group radius
SW1(config)# aaa accounting dot1x default start-stop group radius
SW1(config)# dot1x system-auth-control

SW1(config)# radius server ISE
SW1(config-radius-server)# address ipv4 192.168.99.50 auth-port 1812 acct-port 1813
SW1(config-radius-server)# key RahasiaRadius

SW1(config)# interface range gi0/1-20
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# authentication port-control auto
SW1(config-if-range)# authentication host-mode multi-domain    ← telepon + PC
SW1(config-if-range)# authentication order dot1x mab
SW1(config-if-range)# authentication priority dot1x mab
SW1(config-if-range)# mab                                       ← MAC Auth Bypass
SW1(config-if-range)# dot1x pae authenticator
SW1(config-if-range)# authentication event fail action authorize vlan 998
SW1(config-if-range)# authentication event server dead action authorize vlan 999
SW1(config-if-range)# spanning-tree portfast
```

**Fitur pendukung:**

| Fitur | Fungsi |
|---|---|
| **MAB** (MAC Auth Bypass) | Untuk perangkat tanpa supplicant (printer, kamera) — autentikasi berbasis MAC |
| **Guest VLAN** | Untuk perangkat yang tidak merespons 802.1X sama sekali |
| **Auth-fail VLAN** | Untuk yang gagal autentikasi |
| **Critical VLAN** | Kalau RADIUS server mati (fail-open terkontrol) |
| **Dynamic VLAN** | RADIUS menentukan VLAN berdasarkan identitas |
| **dACL** | RADIUS mengirimkan ACL per pengguna |

⚠️ **MAB tidak aman** — MAC address mudah dipalsukan. Ia hanya "memperlambat", bukan menghentikan. Gunakan untuk perangkat yang benar-benar tidak bisa 802.1X, dan kombinasikan dengan profiling dan segmentasi ketat.

⚠️ **Selalu konfigurasikan critical VLAN.** Kalau RADIUS server mati dan tidak ada fallback, **seluruh kantor tidak bisa terhubung ke jaringan** — outage total.

💡 **Terapkan 802.1X secara bertahap:** mulai dengan mode `monitor` (open mode) yang mencatat tetapi tidak memblokir, analisis perangkat apa saja yang ada, baru aktifkan enforcement.

```
SW1(config-if)# authentication open        ← monitor mode
```

---

## 11. Checklist Hardening Layer 2

```
□ Port security pada port access (maximum 2-3, violation restrict)
□ DHCP snooping pada semua VLAN pengguna
□ Dynamic ARP Inspection (setelah DHCP snooping)
□ IP Source Guard
□ PortFast + BPDU Guard pada semua port access
□ Root Guard pada port menghadap access
□ Loop Guard + UDLD pada trunk fiber
□ Storm control (broadcast 5%, multicast 5%)
□ Matikan DTP (switchport nonegotiate)
□ Native VLAN diubah ke VLAN tidak terpakai
□ VLAN 1 tidak dipakai untuk apa pun
□ Batasi VLAN pada trunk (allowed vlan)
□ Port tidak terpakai → VLAN parkir + shutdown
□ Matikan CDP/LLDP di port pengguna
□ Port isolation untuk tamu/IoT
□ 802.1X (target akhir)
□ Jaringan manajemen terpisah (out-of-band)
```

### Template konfigurasi lengkap

```
! ═══ GLOBAL ═══
ip dhcp snooping
ip dhcp snooping vlan 10,20,30
no ip dhcp snooping information option
ip arp inspection vlan 10,20,30
ip arp inspection validate src-mac dst-mac ip
spanning-tree portfast default
spanning-tree portfast bpduguard default
spanning-tree loopguard default
vlan dot1q tag native
errdisable recovery cause psecure-violation
errdisable recovery cause bpduguard
errdisable recovery cause dhcp-rate-limit
errdisable recovery interval 300

! ═══ PORT AKSES PENGGUNA ═══
interface range gi0/1-20
 switchport mode access
 switchport access vlan 10
 switchport voice vlan 110
 switchport nonegotiate
 switchport port-security
 switchport port-security maximum 3
 switchport port-security violation restrict
 switchport port-security mac-address sticky
 ip arp inspection limit rate 15
 ip dhcp snooping limit rate 10
 ip verify source
 storm-control broadcast level 5.00
 storm-control multicast level 5.00
 storm-control action trap
 spanning-tree portfast
 spanning-tree bpduguard enable
 no cdp enable
 no shutdown

! ═══ TRUNK KE SWITCH LAIN ═══
interface gi0/24
 switchport mode trunk
 switchport trunk native vlan 999
 switchport trunk allowed vlan 10,20,30,110
 switchport nonegotiate
 ip dhcp snooping trust
 ip arp inspection trust
 spanning-tree guard root
 udld port aggressive

! ═══ PORT TIDAK DIPAKAI ═══
interface range gi0/21-23
 switchport mode access
 switchport access vlan 999
 switchport nonegotiate
 shutdown
```

### MikroTik — padanan

```
# DHCP snooping
/interface bridge set bridge-LAN dhcp-snooping=yes add-dhcp-option82=yes
/interface bridge port set [find interface=ether24] trusted=yes

# ARP reply-only + DHCP add-arp (anti ARP spoofing)
/ip dhcp-server set dhcp1 add-arp=yes
/interface bridge set bridge-LAN arp=reply-only

# STP protection
/interface bridge set bridge-LAN protocol-mode=rstp
/interface bridge port set [find interface~"ether[1-9]"] edge=yes-discover bpdu-guard=yes
/interface bridge port set [find interface=ether24] root-guard=yes

# Port isolation
/interface bridge port set [find interface~"ether[1-9]"] horizon=1

# Batasi MAC yang dipelajari
/interface bridge settings set max-learned-entries=1000

# Matikan neighbor discovery di port pengguna
/ip neighbor discovery-settings set discover-interface-list=UPLINK

# 802.1X (RouterOS v7)
/interface dot1x server add interface=ether5 auth-types=dot1x,mac-auth
/radius add service=dot1x address=192.168.99.50 secret=RahasiaRadius
```

---

## 12. Ringkasan

- **Layer 2 adalah lapisan yang paling sering diabaikan** — menguasainya berarti MITM terhadap seluruh trafik sebelum enkripsi.
- **MAC flooding** membuat switch berperilaku seperti hub → **Port Security** (`maximum 2-3`, `violation restrict`).
- **ARP spoofing** = MITM klasik karena ARP tidak punya autentikasi → **Dynamic ARP Inspection** (butuh DHCP snooping), atau **`arp=reply-only` + `add-arp=yes`** di MikroTik.
- **Rogue DHCP** (sering tidak disengaja) dan **DHCP starvation** → **DHCP Snooping** dengan trusted port + rate limit.
- Binding table DHCP snooping menjadi dasar **DAI** dan **IP Source Guard**. Host statis butuh entri manual.
- **IP spoofing** → IP Source Guard (switch) dan **uRPF** (router); **BCP 38** adalah tanggung jawab setiap operator.
- **VLAN hopping**: switch spoofing (→ `switchport nonegotiate`) dan double tagging (→ native VLAN tidak terpakai, `vlan dot1q tag native`).
- **STP root takeover** → **BPDU Guard** (port access), **Root Guard** (menghadap access), **Loop Guard + UDLD** (trunk fiber).
- **Storm control** sebagai jaring pengaman broadcast storm.
- **Port isolation** (`switchport protected`, private VLAN, `horizon=`) untuk tamu dan IoT.
- **802.1X adalah solusi paling kuat** — terapkan bertahap dengan monitor mode. ⚠️ **Selalu konfigurasikan critical VLAN** agar RADIUS mati tidak melumpuhkan kantor.
- **MAB tidak aman** (MAC mudah dipalsukan) — hanya untuk perangkat yang benar-benar tidak bisa 802.1X.

---

## 13. Latihan

1. Jelaskan MAC flooding dan mengapa ia membuat switch berperilaku seperti hub.
2. Kenapa ARP spoofing mungkin dilakukan? Apa akar masalahnya?
3. Anda mengaktifkan DAI dan beberapa server berhenti berkomunikasi. Kenapa dan bagaimana memperbaikinya?
4. Jelaskan serangan double tagging dan tiga mitigasinya.
5. Kenapa `violation restrict` sering lebih baik daripada `shutdown` di produksi?
6. Apa yang terjadi kalau RADIUS server mati pada jaringan dengan 802.1X tanpa critical VLAN?
7. Sebutkan urutan konfigurasi yang benar untuk DHCP snooping, DAI, dan IP Source Guard. Kenapa urutannya penting?
8. Rancang hardening layer 2 untuk switch access 24 port di kantor dengan telepon IP.

<details>
<summary>Jawaban</summary>

1. **MAC flooding** mengirim ribuan frame dengan **MAC address sumber palsu yang berbeda-beda** (alat seperti `macof` mengirim >150.000 per menit). Switch mempelajari setiap MAC sumber dan memasukkannya ke **MAC address table**, yang kapasitasnya terbatas (8.000–32.000 entri).
   Ketika tabel penuh, switch **tidak bisa lagi mempelajari MAC baru**. Akibatnya, ketika frame datang untuk MAC tujuan yang tidak ada di tabel, switch melakukan **unknown unicast flooding** — mengirimkannya ke **semua port** dalam VLAN itu. Karena hampir semua MAC yang sah sudah tersingkir dari tabel, hampir semua trafik menjadi flooding. Penyerang yang terhubung di segmen itu dapat menangkap **seluruh trafik**, persis seperti pada hub.

2. **Akar masalahnya: ARP tidak punya mekanisme autentikasi sama sekali.** Protokol ini dirancang tahun 1982 untuk jaringan yang seluruhnya dipercaya. Setiap host **menerima dan memercayai ARP Reply apa pun** yang diterimanya — bahkan yang tidak pernah ia minta (gratuitous ARP), dan bahkan yang bertentangan dengan entri yang sudah ada. Tidak ada tanda tangan, tidak ada verifikasi, tidak ada state.
   Karena itu penyerang cukup mengirim ARP Reply palsu yang menyatakan "IP gateway ada di MAC saya" untuk membelokkan seluruh trafik. Perbaikan pada protokol itu sendiri (mis. S-ARP) tidak pernah diadopsi; solusinya dilakukan di **switch** lewat DAI yang memvalidasi ARP terhadap sumber kebenaran eksternal (binding table DHCP snooping).

3. Karena **DAI memvalidasi paket ARP terhadap binding table DHCP snooping**, dan server itu memakai **alamat IP statis** — sehingga tidak pernah tercatat di binding table. Semua ARP dari server tersebut dianggap tidak sah dan **dibuang**, memutus komunikasinya.
   **Perbaikan — dua pilihan:**
   (a) **ARP ACL** untuk host statis:
   ```
   arp access-list SERVER-STATIS
    permit ip host 192.168.10.50 mac host 0011.2233.4455
   ip arp inspection filter SERVER-STATIS vlan 10
   ```
   (b) **Binding statis** di tabel DHCP snooping:
   ```
   ip source binding 0011.2233.4455 vlan 10 192.168.10.50 interface gi0/6
   ```
   (c) Alternatif yang lebih baik secara operasional: **berikan alamat "statis" lewat DHCP reservation** sehingga host tetap masuk binding table secara otomatis.

4. **Double tagging:** penyerang mengirim frame dengan **dua tag VLAN** — tag luar berisi VLAN native (mis. VLAN 1), tag dalam berisi VLAN target (mis. VLAN 20). Switch pertama menerima frame di port access VLAN 1, **menghapus tag luar** karena native VLAN dikirim tanpa tag di trunk, lalu meneruskannya. Switch kedua menerima frame yang kini hanya punya tag VLAN 20 dan mengirimkannya ke VLAN 20. Penyerang berhasil mengirim ke VLAN yang seharusnya tidak dapat ia jangkau. (Serangan ini **satu arah** — tidak ada jalur balik.)
   **Mitigasi:** (a) **Ubah native VLAN ke VLAN yang tidak dipakai** (mis. 999) dan pastikan tidak ada port akses di VLAN itu; (b) **`vlan dot1q tag native`** — memaksa native VLAN juga dikirim dengan tag, sehingga trik penghapusan tag tidak berlaku; (c) **Jangan pakai VLAN 1** untuk apa pun, dan **batasi VLAN pada trunk** dengan `switchport trunk allowed vlan` sehingga VLAN target tidak diizinkan lewat kalau memang tidak perlu.

5. Karena **`shutdown` menempatkan port dalam err-disabled** dan memutus pengguna sepenuhnya sampai ada yang memulihkannya secara manual. Dalam operasi nyata, pelanggaran port security paling sering terjadi karena hal yang **tidak berbahaya**: pengguna memindahkan laptop ke meja lain, mengganti dock, menghubungkan VM dengan MAC baru, atau menancapkan mini-switch untuk perangkat tambahan. Menghukumnya dengan outage menghasilkan banyak tiket helpdesk dan tekanan untuk mematikan fitur keamanan itu sama sekali.
   **`restrict` membuang trafik dari MAC yang melanggar, tetapi tetap melayani MAC yang sah**, sambil mengirimkan syslog/SNMP dan menaikkan counter. Anda tetap mendapat **visibilitas dan perlindungan** tanpa memutus pengguna. Kalau memang ingin `shutdown`, pasangkan dengan `errdisable recovery` agar pulih otomatis.

6. **Seluruh kantor tidak bisa terhubung ke jaringan.** Tanpa RADIUS, switch tidak dapat mengautentikasi siapa pun; port tetap dalam keadaan tidak terotorisasi dan **memblokir semua trafik**. Perangkat yang sudah terautentikasi sebelumnya akan terputus saat sesi habis atau saat port di-bounce. Ini **outage total** yang disebabkan oleh kontrol keamanan itu sendiri.
   **Pencegahan — critical VLAN (inaccessible authentication bypass):**
   ```
   authentication event server dead action authorize vlan 999
   authentication event server alive action reinitialize
   ```
   Ketika switch mendeteksi RADIUS tidak responsif, port ditempatkan di VLAN darurat dengan akses terbatas, sehingga operasi dasar tetap berjalan. Setelah RADIUS pulih, port diautentikasi ulang. Selain itu: **selalu pasang minimal dua RADIUS server** di lokasi yang terpisah.

7. Urutan yang benar:
   ```
   1. ip dhcp snooping (+ vlan, + trusted port)
   2. ip arp inspection vlan ...
   3. ip verify source (IP Source Guard) pada interface
   ```
   **Kenapa urutannya penting:** **DAI dan IP Source Guard keduanya bergantung sepenuhnya pada binding table yang dibangun DHCP snooping.** Tanpa DHCP snooping aktif, binding table kosong — sehingga DAI akan membuang **semua** ARP dan IP Source Guard akan membuang **semua** paket, memutus seluruh jaringan.
   Selain itu, DHCP snooping perlu **waktu untuk mengisi tabel** — jalankan dulu selama beberapa jam/hari dan verifikasi dengan `show ip dhcp snooping binding` bahwa semua host sudah tercatat, **baru** aktifkan DAI dan IP Source Guard. Jangan lupa menandai port ke server DHCP dan uplink sebagai `trust`, serta menambahkan binding statis untuk host ber-IP statis, **sebelum** enforcement diaktifkan.

8. Konfigurasi hardening untuk switch access 24 port dengan telepon IP:
   ```
   ! ═══ GLOBAL ═══
   ip dhcp snooping
   ip dhcp snooping vlan 10,110
   no ip dhcp snooping information option
   ip arp inspection vlan 10,110
   ip arp inspection validate src-mac dst-mac ip
   spanning-tree portfast default
   spanning-tree portfast bpduguard default
   spanning-tree loopguard default
   vlan dot1q tag native
   errdisable recovery cause psecure-violation
   errdisable recovery cause bpduguard
   errdisable recovery interval 300
   no ip http server
   no ip http secure-server

   ! ═══ VLAN ═══
   vlan 10
    name DATA
   vlan 110
    name VOICE
   vlan 999
    name PARKIR-NATIVE

   ! ═══ PORT PENGGUNA (telepon + PC) gi0/1-20 ═══
   interface range gi0/1-20
    description Port pengguna
    switchport mode access
    switchport access vlan 10
    switchport voice vlan 110
    switchport nonegotiate
    switchport port-security
    switchport port-security maximum 3        ! telepon + PC + margin
    switchport port-security violation restrict
    switchport port-security mac-address sticky
    switchport port-security aging time 120
    switchport port-security aging type inactivity
    ip arp inspection limit rate 15
    ip dhcp snooping limit rate 10
    ip verify source
    storm-control broadcast level 5.00
    storm-control multicast level 5.00
    storm-control action trap
    spanning-tree portfast
    spanning-tree bpduguard enable
    no lldp transmit                          ! CDP dibiarkan untuk telepon
    auto qos voip cisco-phone                 ! trust CoS dari telepon saja
    no shutdown

   ! ═══ PORT TIDAK DIPAKAI gi0/21-23 ═══
   interface range gi0/21-23
    description TIDAK DIPAKAI
    switchport mode access
    switchport access vlan 999
    switchport nonegotiate
    shutdown

   ! ═══ UPLINK gi0/24 ═══
   interface gi0/24
    description Uplink ke distribution
    switchport mode trunk
    switchport trunk native vlan 999
    switchport trunk allowed vlan 10,110,900
    switchport nonegotiate
    ip dhcp snooping trust
    ip arp inspection trust
    spanning-tree guard root
    udld port aggressive
   ```
   Langkah berikutnya (bertahap): terapkan **802.1X dengan monitor mode**, lalu enforcement dengan MAB untuk telepon, guest VLAN, dan **critical VLAN**. Pastikan juga manajemen switch berada di VLAN terpisah dengan ACL, SSH saja, dan SNMPv3.

</details>

---

## 14. Sumber

- Cisco, *Catalyst Switch Security Configuration Guide*
- Cisco, *VLAN Security White Paper*
- RFC 2827 / BCP 38 — Network Ingress Filtering
- IEEE 802.1X-2020 — Port-Based Network Access Control
- Cisco CCNA 200-301 v1.1, topik 5.7 (Layer 2 security: DHCP snooping, dynamic ARP inspection, port security)
- MikroTik — https://help.mikrotik.com/docs/display/ROS/Bridging+and+Switching

---

**Berikutnya:** `12-keamanan/03-serangan-l3-l7.md` — serangan dari layer 3 sampai aplikasi.

# 12.5 — Hardening Perangkat dan Zero Trust

> **Prasyarat:** `12-keamanan/01`–`04`
> **Tujuan:** Anda bisa mengeraskan perangkat jaringan secara menyeluruh dan memahami arsitektur Zero Trust serta SASE.

---

## 1. Hardening Perangkat Jaringan

Perangkat jaringan adalah **target bernilai tinggi** — menguasainya berarti menguasai seluruh trafik.

### Prinsip

```
1. Matikan semua yang tidak dipakai
2. Enkripsi semua akses manajemen
3. Batasi dari mana manajemen dapat diakses
4. Autentikasi dan otorisasi yang kuat
5. Log semuanya, kirim ke tempat lain
6. Lindungi control plane
7. Pertahankan konfigurasi yang diketahui baik
```

### Checklist Cisco IOS

```
! ═══ AKSES MANAJEMEN ═══
hostname SW-ACCESS-01
ip domain-name perusahaan.local
crypto key generate rsa modulus 2048
ip ssh version 2
ip ssh time-out 60
ip ssh authentication-retries 3
ip ssh dh min size 2048

line vty 0 15
 transport input ssh              ! HANYA SSH — matikan Telnet
 access-class MGMT-ACL in         ! batasi sumber
 exec-timeout 10 0
 logging synchronous
line con 0
 exec-timeout 10 0
 logging synchronous
line aux 0
 no exec                          ! matikan port AUX
 transport input none

! ═══ PASSWORD ═══
enable algorithm-type scrypt secret RahasiaKuat
username admin privilege 15 algorithm-type scrypt secret RahasiaKuat
service password-encryption       ! obfuscation minimal untuk sisanya
security passwords min-length 12
login block-for 300 attempts 5 within 60    ! anti brute force
login on-failure log
login on-success log

! ═══ LAYANAN YANG DIMATIKAN ═══
no ip http server
no ip http secure-server          ! kalau tidak dipakai
no service pad
no service finger
no service config
no service tcp-small-servers
no service udp-small-servers
no ip bootp server
no ip source-route
no ip gratuitous-arps
no cdp run                        ! atau per-interface saja
no lldp run

! ═══ PER INTERFACE ═══
interface range gi0/1-20
 no ip redirects
 no ip proxy-arp
 no ip unreachables               ! ⚠️ hati-hati: merusak PMTUD
 no cdp enable

! ═══ LOGGING & WAKTU ═══
service timestamps log datetime msec localtime show-timezone
service timestamps debug datetime msec
service sequence-numbers
logging buffered 65536 informational
logging host 192.168.99.50 transport tcp port 6514
logging source-interface Loopback0
logging trap informational
no logging console
clock timezone WIB 7 0
ntp server 192.168.99.10 prefer
ntp authenticate
ntp authentication-key 1 md5 RahasiaNTP
ntp trusted-key 1
ntp source Loopback0

! ═══ SNMP ═══
no snmp-server community public
no snmp-server community private
snmp-server group NETMON v3 priv
snmp-server user monitoring NETMON v3 auth sha AuthPass priv aes 128 PrivPass
snmp-server host 192.168.99.50 version 3 priv monitoring
snmp-server enable traps snmp linkdown linkup
snmp-server enable traps config
snmp-server location "DC-Jakarta-Rack-A12"
snmp-server contact "noc@perusahaan.com"

! ═══ BANNER ═══
banner motd ^
================================================================
  PERANGKAT MILIK PT PERUSAHAAN
  Akses hanya untuk personel yang berwenang.
  Seluruh aktivitas dipantau dan dicatat.
  Akses tidak sah dapat dituntut sesuai hukum yang berlaku.
================================================================
^
```

⚠️ **Banner login penting secara hukum** di banyak yurisdiksi — tanpa pemberitahuan bahwa sistem dipantau, tindakan hukum terhadap penyusup bisa lebih sulit. Jangan mencantumkan "Welcome" (bisa ditafsirkan sebagai undangan) atau informasi perangkat.

⚠️ **`no ip unreachables` merusak PMTUD.** Rekomendasi hardening lama menyarankannya untuk mencegah reconnaissance, tetapi biayanya besar. Lebih baik gunakan rate limit:
```
ip icmp rate-limit unreachable 1000
```

### Checklist MikroTik

```
# ═══ IDENTITAS & USER ═══
/system identity set name=RTR-KANTOR-01
/user add name=netadmin password=RahasiaKuat group=full address=192.168.99.0/24
/user set admin disabled=yes
/user group add name=readonly policy=read,test,ssh,winbox

# ═══ LAYANAN ═══
/ip service disable telnet,ftp,api,www
/ip service set ssh port=22 address=192.168.99.0/24
/ip service set winbox address=192.168.99.0/24
/ip service set api-ssl address=192.168.99.0/24
/ip ssh set strong-crypto=yes allow-none-crypto=no host-key-size=4096

# ═══ MATIKAN YANG TIDAK DIPAKAI ═══
/tool mac-server set allowed-interface-list=MGMT
/tool mac-server mac-winbox set allowed-interface-list=MGMT
/tool mac-server ping set enabled=no
/tool bandwidth-server set enabled=no
/tool romon set enabled=no
/ip neighbor discovery-settings set discover-interface-list=MGMT
/ip proxy set enabled=no
/ip socks set enabled=no
/ip upnp set enabled=no
/ip cloud set ddns-enabled=no update-time=no
/ip firewall service-port disable sip,h323,ftp,pptp

# ═══ WAKTU & LOG ═══
/system clock set time-zone-name=Asia/Jakarta
/system ntp client set enabled=yes servers=192.168.99.10,id.pool.ntp.org
/system logging action add name=remote target=remote remote=192.168.99.50 \
    src-address=192.168.99.1
/system logging add topics=info,!debug action=remote
/system logging add topics=error,critical,warning action=remote
/system logging add topics=account action=remote

# ═══ SNMP ═══
/snmp set enabled=yes trap-version=3 contact="noc@perusahaan.com" \
    location="DC-Jakarta"
/snmp community add name=v3user security=private \
    authentication-protocol=SHA1 authentication-password=AuthPass \
    encryption-protocol=AES encryption-password=PrivPass \
    addresses=192.168.99.50/32
/snmp community remove [find name=public]

# ═══ FIREWALL INPUT (lihat 09-nat-acl-firewall/03) ═══
/ip firewall filter
add chain=input connection-state=established,related action=accept
add chain=input connection-state=invalid action=drop
add chain=input in-interface-list=MGMT src-address-list=MANAJEMEN action=accept
add chain=input in-interface-list=WAN action=drop
add chain=input action=drop

# ═══ BACKUP OTOMATIS ═══
/system scheduler add name=backup-harian interval=1d start-time=02:00:00 \
    on-event="/system backup save name=backup; /export file=config"
```

⚠️ **RouterOS punya riwayat kerentanan serius** (mis. CVE-2018-14847 yang memungkinkan pengambilalihan penuh lewat WinBox). **Selalu jalankan versi terbaru** dan **jangan pernah mengekspos WinBox (8291), API (8728), atau layanan manajemen lain ke internet.**

---

## 2. Control Plane Protection

Perangkat jaringan bisa dilumpuhkan dengan membanjiri **CPU-nya**, bukan bandwidth-nya.

```
Trafik yang diproses CPU (punted):
  - Paket ke alamat perangkat sendiri (SSH, SNMP, ping)
  - Routing protocol (OSPF, BGP)
  - ARP
  - Paket dengan IP options
  - Paket yang memicu ICMP error
  - Fitur yang tidak didukung hardware
```

### CoPP — Control Plane Policing

```
! Klasifikasi
ip access-list extended CP-ROUTING
 permit ospf any any
 permit tcp any any eq 179
 permit tcp any eq 179 any
ip access-list extended CP-MANAGEMENT
 permit tcp 192.168.99.0 0.0.0.255 any eq 22
 permit udp 192.168.99.0 0.0.0.255 any eq snmp
ip access-list extended CP-ICMP
 permit icmp any any echo
 permit icmp any any echo-reply

class-map match-all CP-ROUTING
 match access-group name CP-ROUTING
class-map match-all CP-MANAGEMENT
 match access-group name CP-MANAGEMENT
class-map match-all CP-ICMP
 match access-group name CP-ICMP

! Policy
policy-map CONTROL-PLANE-POLICY
 class CP-ROUTING
  police 1000000 conform-action transmit exceed-action transmit
 class CP-MANAGEMENT
  police 500000 conform-action transmit exceed-action drop
 class CP-ICMP
  police 100000 conform-action transmit exceed-action drop
 class class-default
  police 200000 conform-action transmit exceed-action drop

! Terapkan
control-plane
 service-policy input CONTROL-PLANE-POLICY
```

⚠️ **Hati-hati dengan CoPP.** Salah konfigurasi bisa **memutus routing protocol atau akses manajemen Anda sendiri**. Terapkan bertahap: mulai dengan `conform-action transmit exceed-action transmit` (hanya menghitung), analisis counter, baru aktifkan drop.

```
R1# show policy-map control-plane
```

### MikroTik

```
# Raw table — buang sebelum conntrack (paling efisien)
/ip firewall raw
add chain=prerouting in-interface-list=WAN src-address-list=BOGON action=drop
add chain=prerouting protocol=tcp dst-port=8291 in-interface-list=WAN action=drop

# Rate limit input ke router
/ip firewall filter
add chain=input protocol=icmp limit=10,20:packet action=accept
add chain=input protocol=icmp action=drop
add chain=input protocol=tcp dst-port=22 connection-limit=5,32 action=drop
```

---

## 3. Manajemen Konfigurasi

```
✅ Backup otomatis harian ke lokasi terpisah
✅ Version control (Git) untuk konfigurasi
✅ Golden config / template standar per jenis perangkat
✅ Deteksi config drift (bandingkan dengan baseline)
✅ Change control: rencana, review, jendela, rollback
✅ Dokumentasikan SETIAP perubahan (siapa, kapan, kenapa, tiket)
```

```
# Cisco — archive otomatis
archive
 path tftp://192.168.99.50/configs/$h-
 write-memory
 time-period 1440
 log config
  logging enable
  logging size 500
  notify syslog
  hidekeys

R1# show archive
R1# show archive config differences
R1# configure replace tftp://192.168.99.50/configs/R1-golden
```

💡 **`configure replace` memungkinkan rollback ke konfigurasi sebelumnya** tanpa reload — sangat berharga saat perubahan bermasalah.

```
# Cisco — commit dengan timer (rollback otomatis kalau tidak dikonfirmasi)
R1# configure terminal revert timer 5
R1(config)# ... perubahan berisiko ...
R1(config)# exit
R1# configure confirm          ← kalau berhasil; kalau tidak, otomatis rollback
```

⚠️ **Ini setara Safe Mode MikroTik** — gunakan setiap kali mengubah konfigurasi kritis dari jarak jauh.

```
# MikroTik — Safe Mode
[admin@MikroTik] > <Ctrl+X>
[admin@MikroTik] <SAFE> > ... perubahan ...
[admin@MikroTik] <SAFE> > <Ctrl+X>    ← konfirmasi
```

---

## 4. Zero Trust Architecture

### Perubahan paradigma

```
MODEL LAMA (castle-and-moat):
  "Di dalam perimeter = dipercaya"
  "Di luar perimeter = tidak dipercaya"

  ❌ Sekali penyerang masuk, ia bebas bergerak
  ❌ Tidak cocok untuk cloud, remote work, BYOD
  ❌ Insider threat tidak tertangani

ZERO TRUST:
  "JANGAN PERNAH percaya, SELALU verifikasi"
  "Asumsikan sudah terjadi pelanggaran"

  ✅ Setiap permintaan diverifikasi, dari mana pun asalnya
  ✅ Akses berbasis identitas + konteks, bukan lokasi jaringan
  ✅ Least privilege per-sesi
```

### NIST SP 800-207 — Model Resmi

```
       ┌──────────────────────────────────────┐
       │        CONTROL PLANE                 │
       │  ┌────────────────────────────────┐  │
       │  │  PDP (Policy Decision Point)   │  │
       │  │  ┌──────────┐  ┌────────────┐  │  │
       │  │  │  Policy  │  │   Policy   │  │  │
       │  │  │  Engine  │  │Administrator│ │  │
       │  │  └──────────┘  └────────────┘  │  │
       │  └────────────────────────────────┘  │
       └───────────────┬──────────────────────┘
                       │ keputusan
       ┌───────────────┴──────────────────────┐
       │        DATA PLANE                    │
       │  [Subjek] ──→ [PEP] ──→ [Resource]   │
       │              Policy Enforcement Point │
       └──────────────────────────────────────┘
```

| Komponen | Fungsi |
|---|---|
| **PE** (Policy Engine) | Membuat keputusan izinkan/tolak berdasarkan kebijakan dan sinyal |
| **PA** (Policy Administrator) | Membuat/memutus jalur komunikasi, mengeluarkan token |
| **PEP** (Policy Enforcement Point) | **Menegakkan** keputusan — memblokir atau meneruskan |

**Sumber sinyal untuk keputusan:**
```
- Identitas pengguna dan grup
- Postur perangkat (patch, antivirus, enkripsi disk, dikelola?)
- Lokasi dan waktu
- Perilaku (anomali dari baseline)
- Sensitivitas resource yang diminta
- Threat intelligence
```

### Tujuh Prinsip NIST SP 800-207

```
1. Semua sumber data dan layanan komputasi dianggap RESOURCE
2. Semua komunikasi diamankan, TANPA MEMANDANG lokasi jaringan
3. Akses diberikan PER-SESI
4. Akses ditentukan oleh KEBIJAKAN DINAMIS (identitas + postur + konteks)
5. Organisasi MEMANTAU integritas dan postur semua aset
6. Autentikasi dan otorisasi DINAMIS dan ketat SEBELUM akses diberikan
7. Organisasi mengumpulkan data untuk MEMPERBAIKI postur keamanan
```

⚠️ **Zero Trust bukan produk yang bisa dibeli.** Ia adalah **arsitektur dan pendekatan** yang diterapkan bertahap. Vendor yang menjual "solusi Zero Trust" hanya menyediakan **sebagian** komponennya.

### Penerapan bertahap yang realistis

```
FASE 1 — IDENTITAS (dampak tertinggi, biaya terendah)
  □ MFA di semua akses, terutama admin dan remote
  □ SSO terpusat
  □ Hapus akun bersama; setiap orang punya identitas sendiri
  □ Least privilege — audit dan kurangi hak berlebih

FASE 2 — PERANGKAT
  □ Inventaris semua perangkat
  □ Manajemen perangkat (MDM/Intune)
  □ EDR di semua endpoint
  □ Postur diperiksa sebelum akses (patch, AV, enkripsi)

FASE 3 — JARINGAN
  □ Segmentasi (VLAN, firewall antar-zona)
  □ 802.1X untuk akses kabel dan nirkabel
  □ Enkripsi di mana-mana (TLS internal juga)
  □ Hilangkan "trusted internal network"

FASE 4 — APLIKASI & DATA
  □ ZTNA menggantikan VPN akses penuh
  □ Klasifikasi data
  □ Mikrosegmentasi untuk aset kritis
  □ Kontrol akses per-aplikasi

FASE 5 — VISIBILITAS & OTOMASI
  □ Logging dan SIEM terpusat
  □ Deteksi anomali perilaku
  □ Respons otomatis (isolasi perangkat terinfeksi)
  □ Kebijakan adaptif berbasis risiko
```

💡 **Mulai dari MFA dan segmentasi.** Keduanya memberi pengurangan risiko terbesar per rupiah yang dikeluarkan, dan tidak memerlukan penggantian arsitektur.

---

## 5. Mikrosegmentasi

```
Segmentasi tradisional : per VLAN/subnet (puluhan zona)
Mikrosegmentasi        : per WORKLOAD/aplikasi (ribuan zona)
```

```
Contoh: aplikasi 3-tier
  Web  ← boleh diakses dari internet (port 443)
  App  ← HANYA boleh diakses dari Web (port 8080)
  DB   ← HANYA boleh diakses dari App (port 5432)

Tanpa mikrosegmentasi: semua di VLAN "server", bisa saling akses bebas
Dengan mikrosegmentasi: setiap komunikasi harus diizinkan eksplisit
```

**Cara implementasi:**
```
- Host-based firewall (Windows Firewall, nftables) dengan manajemen terpusat
- Hypervisor-based (VMware NSX)
- Agent-based (Illumio, Guardicore)
- Cloud security group / NSG
- Kubernetes NetworkPolicy (`16-datacenter-cloud-sdn/05`)
- Service mesh dengan mTLS
```

⚠️ **Tantangan terbesar mikrosegmentasi adalah menemukan dependensi yang sebenarnya.** Aplikasi sering berkomunikasi dengan cara yang tidak terdokumentasi. **Mulai dengan mode monitor** selama beberapa minggu untuk memetakan alur nyata, baru terapkan enforcement.

---

## 6. SASE dan SSE

```
SASE (Secure Access Service Edge) = SD-WAN + Keamanan dari cloud
SSE  (Security Service Edge)      = bagian keamanannya saja

Komponen SSE:
  SWG   (Secure Web Gateway)          → filtering web
  CASB  (Cloud Access Security Broker) → kontrol SaaS
  ZTNA  (Zero Trust Network Access)    → pengganti VPN
  FWaaS (Firewall as a Service)        → firewall di cloud
  DLP   (Data Loss Prevention)         → cegah kebocoran data
  RBI   (Remote Browser Isolation)     → isolasi browsing
```

### Kenapa SASE muncul

```
Model lama: semua trafik cabang/remote diarahkan ke data center pusat
            untuk diinspeksi, lalu keluar ke internet
            → TROMBONING, latency tinggi, bandwidth pusat jadi bottleneck

SASE: keamanan dilakukan di POP cloud yang DEKAT dengan pengguna
      → pengguna terhubung ke POP terdekat
      → inspeksi dilakukan di sana
      → langsung ke SaaS/internet
```

### ZTNA vs VPN

| | **VPN tradisional** | **ZTNA** |
|---|---|---|
| Akses yang diberikan | **Seluruh jaringan** | **Per-aplikasi** |
| Model kepercayaan | Setelah masuk = dipercaya | Verifikasi setiap permintaan |
| Visibilitas aplikasi | Terbatas | Penuh |
| Postur perangkat | Jarang diperiksa | Diperiksa terus-menerus |
| Aplikasi terekspos? | Ya (setelah VPN) | **Tidak** — tersembunyi sampai diotorisasi |
| Lateral movement | **Mungkin** | Dicegah |

💡 **Keunggulan terbesar ZTNA: aplikasi tidak terekspos sama sekali** sampai pengguna terverifikasi. Tidak ada port terbuka untuk dipindai penyerang — model "dark cloud".

⚠️ **Pertimbangan SASE/ZTNA:**
```
- Ketergantungan pada penyedia cloud (uptime, kinerja, lokasi POP)
- Semua trafik terinspeksi oleh pihak ketiga → implikasi privasi dan kepatuhan
- Biaya berlangganan berulang
- Aplikasi legacy yang bukan HTTP mungkin sulit didukung
- Perlu POP yang dekat dengan pengguna Indonesia agar latency wajar
```

---

## 7. Segmentasi — Pendekatan Praktis

Untuk sebagian besar organisasi, **segmentasi yang baik memberi manfaat keamanan terbesar** dibanding investasi lain.

### Zona minimum yang disarankan

```
1. MANAJEMEN     → perangkat jaringan, out-of-band (paling terlindungi)
2. SERVER        → aplikasi internal
3. DMZ           → layanan yang menghadap internet
4. PENGGUNA      → workstation karyawan
5. VOICE         → telepon IP
6. IoT/OT        → kamera, sensor, HVAC, mesin produksi
7. TAMU          → hanya internet, terisolasi
8. BYOD          → perangkat pribadi, akses terbatas
```

### Matriks kebijakan

```
              → MGMT  SERVER  DMZ  USER  VOICE  IoT  TAMU
MGMT            ✅     ✅      ✅   ✅     ✅     ✅   ❌
SERVER          ❌     ⚠️      ⚠️   ❌     ❌     ❌   ❌
DMZ             ❌     ⚠️      ⚠️   ❌     ❌     ❌   ❌
USER            ❌     ⚠️      ⚠️   ⚠️     ❌     ❌   ❌
VOICE           ❌     ⚠️      ❌   ❌     ✅     ❌   ❌
IoT             ❌     ⚠️      ❌   ❌     ❌     ❌   ❌
TAMU            ❌     ❌      ❌   ❌     ❌     ❌   ❌

✅ = diizinkan   ⚠️ = hanya port/host tertentu   ❌ = ditolak
```

⚠️ **Perhatikan baris DMZ dan IoT: keduanya TIDAK boleh menjangkau jaringan internal.** Ini dua sumber kompromi yang paling sering.

💡 **IoT/OT adalah zona yang paling sering diabaikan.** Kamera CCTV, printer, dan perangkat pintar sering: memakai firmware lama yang tidak pernah di-patch, punya kredensial default, dan tidak dapat menjalankan agen keamanan. **Isolasi ketat adalah satu-satunya kontrol yang efektif.**

---

## 8. Monitoring dan Respons

```
✅ Log terpusat (syslog + SIEM)
✅ NetFlow/IPFIX untuk visibilitas alur
✅ Alerting pada kejadian keamanan
✅ Baseline perilaku normal
✅ Playbook respons insiden yang teruji
✅ Latihan tabletop berkala
```

**Kejadian yang harus memicu alarm:**
```
- Login gagal berulang / berhasil dari lokasi tidak biasa
- Penggunaan akun break-glass
- Perubahan konfigurasi di luar jendela pemeliharaan
- Port security / BPDU guard violation
- Rogue DHCP / RA terdeteksi
- Perangkat baru muncul di jaringan
- Trafik ke domain berbahaya yang diketahui
- Beaconing (koneksi berkala yang teratur)
- Volume upload tidak wajar (eksfiltrasi)
- Perubahan rute BGP yang tidak diharapkan
```

---

## 9. Ringkasan

- Hardening: **matikan yang tidak dipakai**, enkripsi manajemen, **batasi sumber akses**, AAA kuat, log ke luar, lindungi control plane, kelola konfigurasi.
- **Hanya SSH** (`transport input ssh` / `/ip service disable telnet`); batasi dengan **ACL/address**.
- **`service password-encryption` (type 7) bukan enkripsi** — pakai `secret` type 8/9.
- **Banner login penting secara hukum** — jangan tulis "Welcome".
- ⚠️ **`no ip unreachables` merusak PMTUD** — pakai rate limit sebagai gantinya.
- **CoPP** melindungi CPU dari banjir trafik control plane. Terapkan bertahap (hitung dulu, baru drop).
- ⚠️ **RouterOS punya riwayat CVE serius** — selalu update, jangan pernah ekspos WinBox/API ke internet.
- Manajemen konfigurasi: backup otomatis, **Git**, golden config, **deteksi drift**, change control. Gunakan `configure replace`/`revert timer` (Cisco) atau **Safe Mode** (MikroTik).
- **Zero Trust (NIST SP 800-207)**: jangan pernah percaya, selalu verifikasi; **PDP/PEP**; akses per-sesi berbasis identitas + postur + konteks. **Bukan produk — arsitektur.**
- Penerapan bertahap: **identitas (MFA) → perangkat → jaringan → aplikasi → visibilitas**. Mulai dari MFA dan segmentasi.
- **Mikrosegmentasi** per-workload; mulai dengan **mode monitor** untuk memetakan dependensi nyata.
- **SASE/SSE** memindahkan keamanan ke cloud dekat pengguna; **ZTNA menyembunyikan aplikasi** sampai terotorisasi.
- **DMZ dan IoT tidak boleh menjangkau jaringan internal** — dua sumber kompromi tersering.

---

## 10. Latihan

1. Sebutkan lima langkah hardening paling penting untuk router yang baru dipasang.
2. Kenapa `no ip unreachables` yang direkomendasikan panduan hardening lama bisa merugikan?
3. Apa itu CoPP dan apa risikonya kalau salah dikonfigurasi?
4. Jelaskan perbedaan model castle-and-moat dan Zero Trust.
5. Apa peran PDP dan PEP dalam arsitektur Zero Trust?
6. Kenapa ZTNA lebih baik daripada VPN tradisional untuk akses jarak jauh?
7. Rancang matriks segmentasi minimum untuk kantor dengan server, DMZ, pengguna, CCTV, dan tamu.
8. Manajemen ingin "menerapkan Zero Trust" tahun ini. Apa tiga langkah pertama yang Anda sarankan dan mengapa?

<details>
<summary>Jawaban</summary>

1. (a) **Ganti semua kredensial default** dan buat akun dengan password kuat (type 8/9), nonaktifkan akun bawaan. (b) **Matikan Telnet dan semua layanan tidak terpakai**; aktifkan SSHv2 saja. (c) **Batasi akses manajemen** dengan ACL/address-list ke subnet manajemen saja, plus `exec-timeout`. (d) **Konfigurasikan NTP dan logging terpusat** dengan timestamp — tanpa waktu yang benar, log tidak berguna untuk forensik. (e) **Backup konfigurasi** dan simpan di luar perangkat. Tambahan penting: perbarui firmware/IOS ke versi terbaru yang stabil, dan aktifkan banner login.

2. Karena **ICMP unreachable (khususnya tipe 3 kode 4, "Fragmentation Needed") adalah mekanisme inti Path MTU Discovery**. Ketika router menonaktifkannya, paket yang terlalu besar dengan bit DF diset akan dibuang **tanpa memberi tahu pengirim** — pengirim tidak pernah tahu harus memperkecil paket. Hasilnya **MTU black hole**: koneksi terbentuk (paket kecil lewat) tetapi transfer data besar menggantung tanpa error.
   Rekomendasi lama itu bertujuan mencegah reconnaissance (penyerang memetakan jaringan dari pesan unreachable) dan mengurangi beban CPU. Namun biayanya jauh lebih besar daripada manfaatnya.
   **Yang lebih baik:** `ip icmp rate-limit unreachable 1000` — membatasi laju tanpa mematikan fungsinya. Untuk IPv6, mematikan ICMPv6 bahkan **mematikan IPv6 sepenuhnya**.

3. **CoPP (Control Plane Policing)** menerapkan kebijakan QoS pada trafik yang ditujukan ke **CPU perangkat** — routing protocol, manajemen, ARP, ICMP. Tujuannya melindungi CPU dari banjir trafik yang bisa melumpuhkan perangkat (dan seluruh jaringan yang bergantung padanya) meski bandwidth belum penuh.
   **Risiko salah konfigurasi:** kalau rate limit terlalu ketat atau klasifikasi salah, CoPP bisa **membuang paket routing protocol** (OSPF/BGP adjacency putus → routing runtuh) atau **memutus akses manajemen Anda sendiri** — sehingga Anda tidak bisa memperbaikinya kecuali lewat console fisik.
   **Penerapan yang aman:** mulai dengan `conform-action transmit exceed-action transmit` (hanya menghitung, tidak membuang), jalankan beberapa minggu, analisis `show policy-map control-plane` untuk mengetahui laju normal, baru naikkan ke `exceed-action drop` dengan margin yang lapang. Selalu sediakan akses out-of-band.

4. **Castle-and-moat** mengasumsikan ada **batas jelas** antara "dalam" (dipercaya) dan "luar" (tidak dipercaya). Seluruh investasi keamanan difokuskan pada perimeter (firewall, VPN); begitu seseorang berada di dalam, ia relatif bebas bergerak. Model ini runtuh karena: cloud dan SaaS berada di luar perimeter, remote work menghapus batas fisik, BYOD membawa perangkat tidak terkelola ke dalam, dan **insider serta penyerang yang sudah masuk tidak tertangani sama sekali**.
   **Zero Trust** menghapus konsep "lokasi jaringan sebagai dasar kepercayaan". Setiap permintaan akses — dari mana pun asalnya, termasuk dari dalam kantor — **diverifikasi ulang** berdasarkan identitas pengguna, postur perangkat, dan konteks. Akses diberikan **per-sesi** dan **seminimal mungkin**. Asumsinya: **pelanggaran sudah terjadi**, sehingga arsitektur harus membatasi kerusakan.

5. **PDP (Policy Decision Point)** adalah "otak" — ia terdiri dari **Policy Engine** yang membuat keputusan izinkan/tolak dengan mengevaluasi kebijakan terhadap sinyal (identitas, postur perangkat, lokasi, waktu, perilaku, sensitivitas resource), dan **Policy Administrator** yang mengeksekusi keputusan itu dengan membuat/memutus jalur komunikasi dan mengeluarkan token/kredensial sesi.
   **PEP (Policy Enforcement Point)** adalah "tangan" — komponen yang berada **di jalur trafik** dan benar-benar **menegakkan** keputusan PDP: meneruskan atau memblokir. PEP bisa berupa gateway ZTNA, proxy, firewall, agen di endpoint, atau service mesh sidecar.
   Pemisahan ini penting: keputusan terpusat dan konsisten (PDP), penegakan terdistribusi dan dekat dengan resource (PEP).

6. Beberapa keunggulan mendasar: (a) **Akses per-aplikasi, bukan per-jaringan** — VPN memberi akses ke seluruh subnet setelah terhubung; ZTNA hanya memberi akses ke aplikasi spesifik yang diotorisasi, sehingga **lateral movement dicegah**. (b) **Aplikasi tidak terekspos** — dengan ZTNA, tidak ada port yang terbuka untuk dipindai; aplikasi "tersembunyi" sampai pengguna terverifikasi (model *dark cloud*). Dengan VPN, gateway VPN itu sendiri adalah target yang terekspos dan sering menjadi jalan masuk (banyak pelanggaran besar dimulai dari VPN appliance yang belum di-patch). (c) **Verifikasi berkelanjutan** — postur perangkat dan konteks diperiksa terus-menerus, bukan hanya saat login. (d) **Visibilitas per-aplikasi** untuk audit dan deteksi. (e) **Pengalaman pengguna lebih baik** — tidak perlu menyalakan/mematikan VPN, dan trafik SaaS tidak memutar.

7. Zona: `MGMT`, `SERVER`, `DMZ`, `USER`, `CCTV`, `TAMU`.
   ```
                → MGMT  SERVER  DMZ   USER  CCTV  TAMU  INTERNET
   MGMT           ✅     ✅      ✅    ✅    ✅    ❌     ⚠️
   SERVER         ❌     ⚠️      ⚠️    ❌    ❌    ❌     ⚠️
   DMZ            ❌     ⚠️      ⚠️    ❌    ❌    ❌     ⚠️
   USER           ❌     ⚠️      ⚠️    ⚠️    ⚠️    ❌     ✅
   CCTV           ❌     ⚠️      ❌    ❌    ❌    ❌     ❌
   TAMU           ❌     ❌      ❌    ❌    ❌    ❌     ✅
   ```
   Keterangan `⚠️` (hanya port/host tertentu):
   - **USER → SERVER**: hanya port aplikasi yang diperlukan (mis. 445 ke file server, 443 ke aplikasi internal) — bukan RDP/SSH umum.
   - **USER → CCTV**: hanya dari workstation tim keamanan ke NVR, port viewer saja.
   - **DMZ → SERVER**: hanya web server ke database, port DB saja.
   - **SERVER/DMZ → INTERNET**: **firewall egress ketat** — hanya repositori paket, NTP, DNS internal, dan API yang diperlukan.
   - **CCTV → SERVER**: hanya kamera ke NVR/storage.
   - **CCTV → INTERNET**: **ditolak** (kamera tidak butuh internet; ini mencegahnya menjadi bagian botnet).
   - **MGMT → INTERNET**: hanya untuk update firmware, lewat proxy.

   Tambahan: `TAMU` dengan client isolation dan rate limit; `CCTV` di VLAN terisolasi karena firmware-nya sering tidak pernah di-patch.

8. **Tiga langkah pertama, diurutkan berdasarkan rasio dampak terhadap biaya:**
   **(1) MFA di semua akses, terutama admin dan remote.** Ini memberi pengurangan risiko terbesar per rupiah. Sebagian besar pelanggaran dimulai dari kredensial yang dicuri atau bocor; MFA menghentikan hampir semuanya. Prioritaskan MFA tahan phishing (FIDO2/passkey) untuk akun istimewa. Tidak memerlukan perubahan arsitektur jaringan.
   **(2) Segmentasi jaringan.** Zero Trust mensyaratkan hilangnya "trusted internal network". Langkah paling konkret adalah memisahkan zona (server, DMZ, pengguna, IoT, tamu, manajemen) dan menegakkan kebijakan antar-zona — terutama **DMZ dan IoT tidak boleh menjangkau internal**. Ini membatasi lateral movement, yang merupakan inti dari "asumsikan sudah terjadi pelanggaran". Sebagian besar organisasi sudah punya perangkat yang mampu melakukannya.
   **(3) Inventaris aset dan visibilitas.** Anda tidak bisa melindungi apa yang tidak Anda ketahui. Kumpulkan inventaris perangkat dan aplikasi, aktifkan logging terpusat (syslog/SIEM) dan NetFlow, dan tetapkan baseline perilaku normal. Ini menjadi fondasi untuk semua fase berikutnya (kebijakan dinamis, deteksi anomali, respons otomatis) — dan sering langsung mengungkap perangkat serta alur yang tidak diketahui.

   Sampaikan juga bahwa **Zero Trust adalah perjalanan bertahap, bukan proyek satu tahun yang selesai** — dan bahwa membeli "produk Zero Trust" tanpa tiga fondasi ini tidak akan memberi hasil.

</details>

---

## 11. Sumber

- **NIST SP 800-207 — Zero Trust Architecture**
- NIST SP 800-53 Rev.5 — Security and Privacy Controls
- CISA — *Zero Trust Maturity Model v2*
- CISA — *Journey to Zero Trust Microsegmentation Guidance*
- Cisco, *Network Device Hardening Guide*
- CIS Benchmarks (Cisco IOS, Linux) — https://www.cisecurity.org/cis-benchmarks
- Cisco CCNA 200-301 v1.1, topik 5.3 dan 5.4

---

**Berikutnya:** `12-keamanan/06-tools-keamanan.md` — alat untuk menguji dan memantau keamanan.

# 11.2 — Tunneling dan VPN

> **Prasyarat:** `11-wan-vpn/01`, `06-aplikasi/04` (kripto), `04-network-layer/04` (MTU)
> **Tujuan:** Anda bisa memilih, mengonfigurasi, dan mendiagnosis semua jenis VPN utama di Cisco, MikroTik, dan Linux.

---

## 1. Konsep Tunnel

**Tunnel** membungkus paket dari satu protokol di dalam protokol lain.

```
┌──────────────────────────────────────────────────────────┐
│ Eth │ IP luar │ Header tunnel │ IP dalam │ TCP │ DATA    │
└──────────────────────────────────────────────────────────┘
       └── underlay ──┘          └────── overlay ──────────┘
```

| Istilah | Arti |
|---|---|
| **Underlay** | Jaringan fisik yang membawa tunnel (internet, MPLS) |
| **Overlay** | Jaringan logis yang dibentuk tunnel |
| **Enkapsulasi** | Membungkus paket asli |
| **Endpoint** | Titik awal/akhir tunnel |

### ⚠️ MTU — masalah nomor satu pada tunnel

Setiap lapisan enkapsulasi mengurangi ruang untuk data.

| Tunnel | Overhead | MTU efektif (dari 1500) | MSS clamp |
|---|---|---|---|
| GRE | 24 | 1476 | 1436 |
| IPIP | 20 | 1480 | 1440 |
| IPsec ESP transport (AES) | ~38–56 | ~1444 | ~1404 |
| IPsec ESP tunnel (AES) | ~58–73 | ~1427 | ~1387 |
| GRE over IPsec | ~82 | ~1418 | ~1378 |
| **WireGuard** (IPv4) | 60 | **1440** | 1400 |
| WireGuard (IPv6) | 80 | 1420 | 1380 |
| OpenVPN (UDP) | ~69 | ~1431 | ~1391 |
| L2TP/IPsec | ~100 | ~1400 | ~1360 |
| VXLAN | 50 | 1450 | 1410 |
| PPPoE | 8 | 1492 | 1452 |

**Gejala MTU salah:**
```
✅ ping berhasil
✅ SSH login berhasil
✅ Halaman web kecil terbuka
❌ Transfer file MENGGANTUNG
❌ `ls` direktori besar via SSH macet
❌ Sebagian situs tidak terbuka
```

**Perbaikan (tiga lapis):**
```
1. Set MTU interface tunnel dengan benar
2. MSS clamping (paling andal — tidak bergantung ICMP)
3. Izinkan ICMP tipe 3 kode 4 (agar PMTUD bekerja)
```

```
# Cisco
R1(config-if)# ip mtu 1400
R1(config-if)# ip tcp adjust-mss 1360

# MikroTik
/interface wireguard set wg0 mtu=1420
/ip firewall mangle add chain=forward protocol=tcp tcp-flags=syn \
    action=change-mss new-mss=clamp-to-pmtu passthrough=yes

# Linux
$ sudo ip link set dev wg0 mtu 1420
$ sudo nft add rule inet filter forward tcp flags syn \
    tcp option maxseg size set rt mtu
```

💡 **Nilai aman universal: MTU 1400, MSS 1360.** Sedikit tidak optimal tetapi hampir selalu bekerja.

---

## 2. GRE — Generic Routing Encapsulation

Tunnel paling sederhana. **Tidak mengenkripsi** — hanya membungkus.

```
Kegunaan:
✅ Membawa multicast dan routing protocol (IPsec murni tidak bisa!)
✅ Membawa protokol non-IP
✅ Menghubungkan jaringan dengan alamat privat lewat internet
❌ TIDAK ADA enkripsi → selalu gabungkan dengan IPsec untuk data sensitif
```

```
# Cisco
R1(config)# interface tunnel 0
R1(config-if)# ip address 10.255.255.1 255.255.255.252
R1(config-if)# tunnel source gi0/0
R1(config-if)# tunnel destination 198.51.100.1
R1(config-if)# tunnel mode gre ip
R1(config-if)# ip mtu 1476
R1(config-if)# ip tcp adjust-mss 1436
R1(config-if)# keepalive 5 3

R1(config)# ip route 192.168.20.0 255.255.255.0 tunnel 0
```

```
# MikroTik
/interface gre add name=gre-cabang remote-address=198.51.100.1 \
    local-address=203.0.113.10 mtu=1476 keepalive=5s,3
/ip address add address=10.255.255.1/30 interface=gre-cabang
/ip route add dst-address=192.168.20.0/24 gateway=10.255.255.2
```

```bash
# Linux
$ sudo ip tunnel add gre1 mode gre local 203.0.113.10 remote 198.51.100.1 ttl 255
$ sudo ip link set gre1 up mtu 1476
$ sudo ip addr add 10.255.255.1/30 dev gre1
```

⚠️ **Recursive routing** — jika rute ke `tunnel destination` mengarah **melalui tunnel itu sendiri**, tunnel akan flapping terus-menerus:
```
%TUN-5-RECURDOWN: Tunnel0 temporarily disabled due to recursive routing
```
Solusi: pastikan ada rute spesifik ke endpoint tunnel lewat interface fisik.

---

## 3. IPsec

Kerangka enkripsi standar di layer 3.

### Dua protokol

| | **AH** (Authentication Header) | **ESP** (Encapsulating Security Payload) |
|---|---|---|
| Protokol IP | 51 | **50** |
| Autentikasi | ✅ (termasuk header IP) | ✅ (payload saja) |
| Enkripsi | ❌ **Tidak ada** | ✅ **Ya** |
| Melewati NAT | ❌ **Tidak bisa** | ✅ Dengan NAT-T |
| Dipakai | Praktis tidak | **Hampir selalu** |

⚠️ **AH tidak bisa melewati NAT** karena ia mengautentikasi header IP yang justru diubah NAT. **Gunakan ESP.**

### Dua mode

```
TRANSPORT MODE:
  [IP asli][ESP][TCP][Data]
  → hanya payload dienkripsi; header IP asli tetap
  → untuk host-to-host, atau di dalam GRE

TUNNEL MODE:
  [IP baru][ESP][IP asli][TCP][Data]
  → SELURUH paket asli dienkripsi dan dibungkus
  → untuk site-to-site (standar)
```

### IKE — Negosiasi Kunci

**IKEv2** [RFC 7296] adalah standar saat ini; IKEv1 sudah usang.

```
IKEv1: Phase 1 (main/aggressive mode) → Phase 2 (quick mode)
       6 atau 3 pesan + 3 pesan

IKEv2: satu pertukaran 4 pesan
       + MOBIKE (bertahan saat alamat berubah)
       + lebih tahan DoS
       + EAP untuk remote access
       + built-in NAT-T
```

**Parameter yang harus cocok di kedua sisi:**
```
Phase 1 (IKE SA):
  - Algoritma enkripsi   : AES-256-GCM atau AES-256-CBC
  - Integritas/hash      : SHA-256 atau lebih tinggi
  - DH group             : 14 (2048-bit) minimum; 19/20/21 (ECP) lebih baik
  - Autentikasi          : PSK atau sertifikat
  - Lifetime             : mis. 24 jam

Phase 2 (IPsec SA / Child SA):
  - Protokol             : ESP
  - Enkripsi             : AES-256-GCM
  - Integritas           : SHA-256 (tidak perlu jika GCM)
  - PFS group            : sama dengan DH group phase 1
  - Lifetime             : mis. 1 jam
  - Proxy ID / traffic selector : jaringan yang dilindungi
```

⚠️ **Ketidakcocokan satu parameter saja membuat tunnel gagal.** Ini penyebab masalah IPsec nomor satu.

⚠️ **JANGAN pakai DH group 1, 2, atau 5** (768/1024/1536-bit) — sudah lemah. Minimum **group 14**; sebaiknya **19/20** (ECP 256/384).

### NAT Traversal (NAT-T)

ESP adalah protokol IP 50 — **tidak punya nomor port**, sehingga NAT/PAT tidak bisa memetakannya.

**NAT-T** membungkus ESP dalam **UDP 4500**:
```
Deteksi NAT selama IKE (UDP 500)
→ jika ada NAT, beralih ke UDP 4500 dengan enkapsulasi UDP-ESP
```

```
Port yang harus dibuka untuk IPsec:
  UDP 500   — IKE
  UDP 4500  — NAT-T
  IP 50     — ESP (kalau tanpa NAT)
  IP 51     — AH (jarang)
```

### Policy-based vs Route-based

| | **Policy-based** (crypto map) | **Route-based** (VTI / tunnel interface) |
|---|---|---|
| Menentukan trafik | ACL "interesting traffic" | **Routing table** |
| Interface | Tidak ada interface tunnel | Ada (VTI/tunnel) |
| Routing dinamis | ❌ Sulit | ✅ **Bisa** (OSPF/BGP lewat tunnel) |
| Multicast | ❌ | ✅ |
| QoS per tunnel | Sulit | ✅ Mudah |
| Troubleshooting | Sulit | **Jauh lebih mudah** |
| Interop | Universal | Perlu dukungan kedua sisi |

💡 **Gunakan route-based (VTI) kalau memungkinkan.** Jauh lebih mudah dikelola, mendukung routing dinamis, dan interface tunnel memberi visibilitas (`show interface`, counter, QoS).

### Konfigurasi Cisco — Route-based (VTI)

```
! IKEv2 proposal & policy
crypto ikev2 proposal PROP-AES256
 encryption aes-gcm-256
 prf sha256
 group 19
crypto ikev2 policy POL-1
 proposal PROP-AES256

! Keyring & profile
crypto ikev2 keyring KR-1
 peer CABANG
  address 198.51.100.1
  pre-shared-key RahasiaSangatKuat123!
crypto ikev2 profile PROF-1
 match identity remote address 198.51.100.1 255.255.255.255
 authentication local pre-share
 authentication remote pre-share
 keyring local KR-1
 dpd 10 3 periodic

! IPsec transform & profile
crypto ipsec transform-set TS-AES esp-gcm 256
 mode tunnel
crypto ipsec profile IPSEC-PROF
 set transform-set TS-AES
 set pfs group19
 set ikev2-profile PROF-1

! Tunnel interface (VTI)
interface Tunnel0
 ip address 10.255.255.1 255.255.255.252
 ip mtu 1400
 ip tcp adjust-mss 1360
 tunnel source GigabitEthernet0/0
 tunnel mode ipsec ipv4
 tunnel destination 198.51.100.1
 tunnel protection ipsec profile IPSEC-PROF

! Routing lewat tunnel
ip route 192.168.20.0 255.255.255.0 Tunnel0
```

**Verifikasi:**
```
show crypto ikev2 sa
show crypto ipsec sa
show interface tunnel0
debug crypto ikev2
debug crypto ipsec
```

### Konfigurasi MikroTik — IPsec

```
# Profile (Phase 1)
/ip ipsec profile add name=prof-cabang enc-algorithm=aes-256 \
    hash-algorithm=sha256 dh-group=modp2048 lifetime=1d dpd-interval=10s

# Proposal (Phase 2)
/ip ipsec proposal add name=prop-cabang auth-algorithms=sha256 \
    enc-algorithms=aes-256-gcm pfs-group=modp2048 lifetime=1h

# Peer
/ip ipsec peer add name=cabang address=198.51.100.1 profile=prof-cabang \
    exchange-mode=ike2

# Identity (autentikasi)
/ip ipsec identity add peer=cabang auth-method=pre-shared-key \
    secret="RahasiaSangatKuat123!"

# Policy (trafik yang dilindungi)
/ip ipsec policy add peer=cabang tunnel=yes \
    src-address=192.168.10.0/24 dst-address=192.168.20.0/24 \
    proposal=prop-cabang

# ⚠️ PENTING: kecualikan trafik IPsec dari NAT
/ip firewall nat add chain=srcnat place-before=0 \
    src-address=192.168.10.0/24 dst-address=192.168.20.0/24 action=accept

# Buka port di firewall
/ip firewall filter add chain=input protocol=udp dst-port=500,4500 action=accept
/ip firewall filter add chain=input protocol=ipsec-esp action=accept

# Verifikasi
/ip ipsec active-peers print
/ip ipsec policy print
/ip ipsec installed-sa print
/log print where topics~"ipsec"
```

⚠️ **Kesalahan MikroTik paling umum: lupa mengecualikan trafik IPsec dari NAT.** Kalau aturan `masquerade` diproses lebih dulu, alamat sumber diubah sebelum dicocokkan dengan policy IPsec, sehingga tunnel tidak pernah terbentuk untuk trafik itu. **Selalu letakkan aturan `accept` sebelum `masquerade`.**

💡 **RouterOS v7 juga mendukung route-based IPsec** dengan interface IPsec, yang lebih mudah dikelola.

---

## 4. WireGuard — VPN Modern

WireGuard [RFC belum, tetapi sudah di kernel Linux sejak 5.6] jauh lebih sederhana dan cepat daripada IPsec.

```
Perbandingan:
  IPsec/OpenVPN : puluhan ribu baris kode, banyak opsi, kompleks
  WireGuard     : ~4.000 baris kode, opsi minimal, sangat mudah diaudit

Kripto tetap (tidak dinegosiasikan):
  ChaCha20 (enkripsi) + Poly1305 (autentikasi)
  Curve25519 (key exchange)
  BLAKE2s (hashing)
  SipHash24 (hashtable)
```

💡 **"Crypto agility" sengaja dihilangkan** — tidak ada negosiasi algoritma, sehingga tidak ada downgrade attack dan tidak ada kesalahan konfigurasi parameter. Kalau ada kelemahan ditemukan, versi protokol diganti seluruhnya.

### Cryptokey Routing — konsep inti

```
Setiap peer punya:
  - Kunci publik (identitas)
  - AllowedIPs (alamat yang boleh dikirim/diterima lewat peer itu)

AllowedIPs berfungsi GANDA:
  1. Sebagai routing  : paket ke alamat ini dikirim ke peer ini
  2. Sebagai firewall : paket dari peer ini HANYA diterima jika
                        alamat sumbernya ada dalam AllowedIPs
```

⚠️ **Ini konsep yang harus dipahami.** `AllowedIPs = 0.0.0.0/0` berarti "kirim semua trafik ke peer ini **dan** terima paket dengan alamat sumber apa pun dari peer ini" — hanya boleh untuk peer yang sepenuhnya dipercaya.

### Konfigurasi Linux

```bash
# Buat kunci
$ wg genkey | tee privatekey | wg pubkey > publickey

# /etc/wireguard/wg0.conf — SISI SERVER
[Interface]
PrivateKey = <private-key-server>
Address = 10.99.0.1/24
ListenPort = 51820
MTU = 1420
PostUp   = nft add rule inet filter forward iifname wg0 accept
PostDown = nft delete rule inet filter forward handle X

[Peer]
# Cabang Bandung
PublicKey = <public-key-cabang>
AllowedIPs = 10.99.0.2/32, 192.168.20.0/24
PersistentKeepalive = 25

[Peer]
# Laptop karyawan
PublicKey = <public-key-laptop>
AllowedIPs = 10.99.0.10/32
```

```bash
# SISI KLIEN
[Interface]
PrivateKey = <private-key-klien>
Address = 10.99.0.10/24
DNS = 10.0.0.10
MTU = 1420

[Peer]
PublicKey = <public-key-server>
Endpoint = vpn.perusahaan.com:51820
AllowedIPs = 0.0.0.0/0          # full tunnel
# AllowedIPs = 192.168.0.0/16   # split tunnel
PersistentKeepalive = 25
```

```bash
$ sudo wg-quick up wg0
$ sudo wg show
$ sudo systemctl enable wg-quick@wg0
```

💡 **`PersistentKeepalive = 25`** wajib jika salah satu sisi di belakang NAT — menjaga entri NAT tetap hidup. Tanpa itu, koneksi hanya bekerja satu arah setelah beberapa menit idle.

### WireGuard di MikroTik (RouterOS v7)

```
/interface wireguard add name=wg0 listen-port=51820 mtu=1420
/interface wireguard print                    ← lihat public key yang dihasilkan
/ip address add address=10.99.0.1/24 interface=wg0

/interface wireguard peers add interface=wg0 \
    public-key="<public-key-peer>" \
    allowed-address=10.99.0.2/32,192.168.20.0/24 \
    persistent-keepalive=25 \
    comment="Cabang Bandung"

/ip route add dst-address=192.168.20.0/24 gateway=wg0

# Buka port
/ip firewall filter add chain=input protocol=udp dst-port=51820 action=accept

/interface wireguard peers print
```

⚠️ **WireGuard tidak tersedia di RouterOS v6** — hanya v7 ke atas.

### Perbandingan VPN

| | IPsec | OpenVPN | WireGuard | SSTP | L2TP/IPsec |
|---|---|---|---|---|---|
| Kecepatan | Cepat (hardware) | Lambat | **Tercepat** | Sedang | Sedang |
| Kompleksitas | **Tinggi** | Sedang | **Sangat rendah** | Rendah | Sedang |
| Melewati firewall | Sulit (UDP 500/4500) | Baik (bisa TCP 443) | Sedang (UDP) | **Terbaik** (TCP 443) | Sulit |
| Mobile roaming | IKEv2/MOBIKE | Reconnect | **Sangat baik** | Reconnect | Buruk |
| Interop vendor | **Universal** | OpenVPN saja | WireGuard saja | Windows native | Universal |
| Ukuran kode | Sangat besar | Besar | **~4.000 baris** | Sedang | Besar |
| Auditability | Sulit | Sedang | **Mudah** | Sedang | Sulit |

💡 **Pilihan praktis:**
```
Site-to-site antar-vendor        → IPsec IKEv2 (route-based/VTI)
Site-to-site MikroTik/Linux      → WireGuard
Remote access modern             → WireGuard, atau IKEv2/EAP
Remote access di jaringan ketat  → SSTP atau OpenVPN over TCP 443
Interop dengan perangkat lama    → IPsec IKEv1 (terpaksa)
```

---

## 5. DMVPN — Dynamic Multipoint VPN

Memecahkan masalah hub-and-spoke: **tunnel spoke-to-spoke dibangun otomatis saat dibutuhkan**.

```
Tanpa DMVPN (hub-and-spoke statis):
  Cabang A → Pusat → Cabang B    ← tromboning

Dengan DMVPN:
  Cabang A → Pusat (awalnya)
  → NHRP memberi tahu alamat Cabang B
  → Cabang A ↔ Cabang B tunnel LANGSUNG terbentuk
```

**Komponen:**
```
mGRE (multipoint GRE) : satu interface tunnel untuk semua peer
NHRP                  : "next hop resolution" — hub sebagai database alamat
IPsec                 : enkripsi
Routing protocol      : EIGRP/OSPF/BGP di atas tunnel
```

**Fase:**
```
Phase 1 : semua trafik lewat hub (spoke-to-spoke lewat hub)
Phase 2 : spoke-to-spoke langsung, tetapi routing tetap lewat hub
Phase 3 : spoke-to-spoke langsung + NHRP shortcut (paling efisien)
```

```
! Hub
interface Tunnel0
 ip address 10.255.255.1 255.255.255.0
 ip nhrp network-id 1
 ip nhrp map multicast dynamic
 ip nhrp redirect
 tunnel source GigabitEthernet0/0
 tunnel mode gre multipoint
 tunnel key 100
 tunnel protection ipsec profile IPSEC-PROF

! Spoke
interface Tunnel0
 ip address 10.255.255.2 255.255.255.0
 ip nhrp network-id 1
 ip nhrp nhs 10.255.255.1 nbma 203.0.113.10 multicast
 ip nhrp shortcut
 tunnel source GigabitEthernet0/0
 tunnel mode gre multipoint
 tunnel key 100
 tunnel protection ipsec profile IPSEC-PROF
```

💡 **DMVPN adalah pendahulu SD-WAN** — memecahkan masalah yang sama (tunnel dinamis, hemat tunnel manual), tetapi tanpa kontrol terpusat dan application awareness.

---

## 6. Remote Access VPN

| Solusi | Protokol | Catatan |
|---|---|---|
| **Cisco AnyConnect / Secure Client** | SSL/DTLS atau IKEv2 | Standar enterprise |
| **IKEv2/EAP** | IPsec | Native di Windows, iOS, Android, macOS |
| **SSTP** | TCP 443 | Native Windows; **paling mudah melewati firewall** |
| **L2TP/IPsec** | UDP 500/4500/1701 | Native di semua OS; ⚠️ sering bermasalah dengan NAT |
| **OpenVPN** | UDP 1194 atau TCP 443 | Fleksibel, butuh klien |
| **WireGuard** | UDP 51820 | Cepat, klien ringan |
| **ZTNA** | HTTPS | Pengganti VPN modern (`12-keamanan/05`) |

⚠️ **PPTP sudah RUSAK TOTAL** — MS-CHAPv2 dapat dipecahkan dalam hitungan jam. **Jangan pernah dipakai.** MikroTik masih menyediakannya untuk kompatibilitas; nonaktifkan.

```
/interface pptp-server server set enabled=no
```

### Split Tunnel vs Full Tunnel

```
FULL TUNNEL:
  Semua trafik klien lewat VPN
  ✅ Semua trafik terinspeksi & terlindungi kebijakan perusahaan
  ✅ Klien terlihat berasal dari IP perusahaan
  ❌ Trafik internet memutar → latency, beban bandwidth pusat
  ❌ Video call jadi buruk

SPLIT TUNNEL:
  Hanya trafik ke jaringan perusahaan lewat VPN
  ✅ Internet langsung → cepat
  ✅ Beban VPN gateway jauh lebih kecil
  ❌ Trafik internet tidak terinspeksi
  ❌ Risiko: perangkat terhubung ke jaringan perusahaan DAN internet sekaligus
```

💡 **Praktik saat ini condong ke split tunnel + keamanan endpoint (EDR) + SASE** — memaksa semua trafik lewat VPN pusat tidak lagi praktis di era SaaS.

### Konfigurasi remote access di MikroTik

```
# L2TP/IPsec server
/interface l2tp-server server set enabled=yes use-ipsec=required \
    ipsec-secret="RahasiaIPsec" default-profile=vpn-profile

/ppp profile add name=vpn-profile local-address=10.99.0.1 \
    remote-address=vpn-pool dns-server=10.0.0.10 \
    change-tcp-mss=yes use-encryption=required

/ip pool add name=vpn-pool ranges=10.99.0.10-10.99.0.100

/ppp secret add name=budi password=RahasiaKuat service=l2tp profile=vpn-profile

# Buka port
/ip firewall filter add chain=input protocol=udp dst-port=500,1701,4500 action=accept
/ip firewall filter add chain=input protocol=ipsec-esp action=accept

# SSTP server (paling mudah melewati firewall)
/interface sstp-server server set enabled=yes certificate=cert-vpn \
    default-profile=vpn-profile port=443
```

---

## 7. Troubleshooting VPN

### IPsec — alur diagnosis

```
1. Apakah Phase 1 (IKE) terbentuk?
   Cisco    : show crypto ikev2 sa
   MikroTik : /ip ipsec active-peers print
   Linux    : ipsec statusall

   TIDAK terbentuk?
   → UDP 500/4500 diblokir firewall
   → Alamat peer salah
   → PSK berbeda
   → Parameter Phase 1 tidak cocok (enkripsi, hash, DH group)
   → NAT di jalur tanpa NAT-T

2. Phase 1 OK, Phase 2 gagal?
   → Parameter Phase 2 tidak cocok (transform set, PFS)
   → Proxy ID / traffic selector tidak cocok (paling sering!)
     Sisi A: 192.168.10.0/24 ↔ 192.168.20.0/24
     Sisi B: 192.168.20.0/24 ↔ 192.168.10.0/24   ← harus CERMIN

3. Tunnel UP tetapi tidak ada trafik?
   → Routing: apakah ada rute lewat tunnel?
   → NAT: apakah trafik VPN dikecualikan dari NAT? (kesalahan #1 di MikroTik)
   → Firewall: apakah trafik di dalam tunnel diizinkan?
   → Cek counter: encaps naik tapi decaps nol = trafik keluar tetapi
     tidak ada yang kembali → masalah di sisi lain atau di jalur balik

4. Trafik mengalir tetapi transfer besar menggantung?
   → MTU! Set MTU tunnel + MSS clamping
```

### Perintah diagnostik

```
# Cisco
show crypto ikev2 sa detail
show crypto ipsec sa
show crypto session
debug crypto ikev2
debug crypto ipsec
clear crypto sa
clear crypto ikev2 sa

# MikroTik
/ip ipsec active-peers print
/ip ipsec installed-sa print
/ip ipsec policy print detail          ← perhatikan flag: A=active, invalid
/log print where topics~"ipsec"
/ip ipsec statistics print

# Linux (strongSwan)
$ sudo ipsec statusall
$ sudo swanctl --list-sas
$ sudo journalctl -u strongswan -f

# WireGuard
$ sudo wg show
  peer: xxx
    endpoint: 203.0.113.10:51820
    allowed ips: 10.99.0.2/32, 192.168.20.0/24
    latest handshake: 1 minute, 23 seconds ago   ← kalau kosong = tidak pernah terhubung
    transfer: 1.23 MiB received, 4.56 MiB sent
```

⚠️ **`latest handshake` kosong pada WireGuard** berarti handshake tidak pernah berhasil — periksa: port UDP terbuka, endpoint benar, public key benar (tertukar antara sisi?), dan jam sistem (WireGuard sensitif terhadap waktu).

### Tabel gejala VPN

| Gejala | Penyebab |
|---|---|
| Phase 1 tidak terbentuk | UDP 500/4500 diblokir; PSK berbeda; parameter tidak cocok; peer address salah |
| Phase 1 OK, Phase 2 gagal | Transform set berbeda; **proxy ID tidak cermin**; PFS mismatch |
| Tunnel UP, tidak ada trafik | Routing tidak ada; **NAT tidak dikecualikan**; firewall memblokir |
| Encaps naik, decaps nol | Sisi lain tidak membalas; jalur balik bermasalah; firewall sisi lain |
| Ping jalan, transfer macet | **MTU** — set MTU + MSS clamping |
| Tunnel flapping | DPD terlalu agresif; link tidak stabil; **recursive routing** (GRE) |
| Bekerja satu arah setelah idle | NAT timeout — set `PersistentKeepalive` (WireGuard) atau DPD |
| WireGuard handshake kosong | Port tertutup; public key tertukar; endpoint salah; jam sistem salah |

---

## 8. Ringkasan

- Tunnel = enkapsulasi; **overlay** di atas **underlay**. ⚠️ **MTU adalah masalah nomor satu** — set MTU tunnel + **MSS clamping** + izinkan ICMP 3/4.
- **GRE** membungkus tanpa enkripsi; bisa membawa **multicast dan routing protocol** (IPsec murni tidak bisa). Waspadai **recursive routing**.
- **IPsec**: pakai **ESP** (protokol 50), bukan AH (tidak bisa lewat NAT). **Tunnel mode** untuk site-to-site. **NAT-T** memakai **UDP 4500**.
- **IKEv2** lebih baik daripada IKEv1. Minimum **DH group 14**; sebaiknya 19/20. Semua parameter **harus cocok** di kedua sisi.
- **Route-based (VTI) lebih baik daripada policy-based** — mendukung routing dinamis, multicast, QoS, dan jauh lebih mudah di-troubleshoot.
- ⚠️ **Kesalahan MikroTik #1: lupa mengecualikan trafik IPsec dari NAT** — letakkan aturan `accept` sebelum `masquerade`.
- **WireGuard**: ~4.000 baris kode, kripto tetap (tanpa negosiasi), **cryptokey routing** di mana `AllowedIPs` berfungsi sebagai routing **dan** firewall. Butuh `PersistentKeepalive` di belakang NAT. **Hanya RouterOS v7**.
- **DMVPN** membangun tunnel spoke-to-spoke otomatis lewat **mGRE + NHRP** — pendahulu SD-WAN.
- **PPTP rusak total** — jangan pernah dipakai. **SSTP (TCP 443)** paling mudah melewati firewall ketat.
- **Split tunnel** kini lebih umum daripada full tunnel karena era SaaS.
- Diagnosis IPsec: **Phase 1 → Phase 2 → routing/NAT → MTU**.

---

## 9. Latihan

1. Kenapa AH tidak bisa melewati NAT, sedangkan ESP bisa?
2. Tunnel IPsec UP dengan Phase 1 dan 2 terbentuk, tetapi tidak ada trafik yang mengalir. Sebutkan tiga penyebab paling mungkin.
3. Jelaskan konsep AllowedIPs pada WireGuard dan mengapa ia berfungsi ganda.
4. Kenapa route-based IPsec lebih disukai daripada policy-based?
5. VPN bekerja untuk SSH tetapi transfer file besar menggantung. Diagnosis dan tiga perbaikan.
6. Apa yang dipecahkan DMVPN dan bagaimana cara kerjanya?
7. Anda perlu VPN yang bisa melewati firewall hotel yang sangat ketat. Apa pilihan Anda?
8. WireGuard `wg show` menampilkan peer tetapi `latest handshake` kosong. Apa yang Anda periksa?

<details>
<summary>Jawaban</summary>

1. **AH mengautentikasi seluruh paket termasuk header IP** — alamat sumber, alamat tujuan, dan beberapa field lain ikut dilindungi oleh integrity check value (ICV). NAT bekerja dengan **mengubah alamat IP** di header, sehingga ICV yang dihitung penerima tidak lagi cocok dan paket ditolak sebagai tidak sah. Tidak ada cara mengatasinya — ini konflik desain yang mendasar.
   **ESP hanya mengautentikasi payload dan header ESP-nya sendiri**, tidak header IP luar. Karena itu NAT boleh mengubah alamat tanpa merusak integritas. Meski begitu ESP masih punya masalah dengan **PAT** karena protokol IP 50 tidak punya nomor port untuk dipetakan — solusinya **NAT-T** yang membungkus ESP dalam **UDP port 4500**, sehingga NAT dapat memetakannya seperti trafik UDP biasa.

2. (a) **Routing tidak ada** — tidak ada rute yang mengarahkan trafik ke tunnel (route-based) atau ACL "interesting traffic" tidak mencakup trafik yang dimaksud (policy-based). (b) **Trafik VPN tidak dikecualikan dari NAT** — aturan `masquerade`/`src-nat` diproses lebih dulu sehingga alamat sumber berubah dan tidak lagi cocok dengan policy IPsec; ini kesalahan paling umum di MikroTik. (c) **Firewall memblokir trafik di dalam tunnel** — tunnel terbentuk tetapi aturan filter tidak mengizinkan trafik antar-subnet melewatinya. (d) Tambahan: **proxy ID tidak cermin** sehingga SA terbentuk untuk selector yang salah; atau routing di sisi lawan tidak ada (periksa dengan `show crypto ipsec sa` — kalau `encaps` naik tetapi `decaps` nol, trafik keluar tetapi tidak ada yang kembali).

3. **`AllowedIPs` pada WireGuard menentukan alamat IP mana yang berasosiasi dengan sebuah peer**, dan ia dipakai dalam **dua arah**:
   - **Untuk trafik KELUAR (routing):** ketika kernel perlu mengirim paket ke alamat X, ia mencari peer yang `AllowedIPs`-nya mencakup X, lalu mengenkripsi paket dengan kunci peer itu dan mengirimkannya ke endpoint peer tersebut.
   - **Untuk trafik MASUK (firewall):** ketika paket terdekripsi diterima dari sebuah peer, WireGuard memeriksa apakah **alamat sumbernya** ada dalam `AllowedIPs` peer itu. Kalau tidak, paket **dibuang**.
   Konsep ini disebut **cryptokey routing** dan menghilangkan kebutuhan konfigurasi firewall terpisah untuk anti-spoofing: peer secara kriptografis hanya boleh mengirim atas nama alamat yang telah ditetapkan untuknya.
   ⚠️ Karena itu `AllowedIPs = 0.0.0.0/0` berarti "kirim semua ke peer ini **dan** terima paket dengan alamat sumber apa pun darinya" — hanya untuk peer yang sepenuhnya dipercaya.

4. Beberapa alasan yang saling menguatkan: (a) **mendukung routing dinamis** — OSPF/BGP/EIGRP bisa berjalan lewat interface tunnel, sehingga penambahan subnet tidak memerlukan perubahan konfigurasi VPN; pada policy-based, setiap subnet baru berarti mengubah ACL di **kedua** sisi. (b) **Mendukung multicast** — penting untuk routing protocol dan beberapa aplikasi. (c) **Visibilitas dan troubleshooting jauh lebih mudah** — ada interface nyata dengan counter, status up/down, dan bisa di-`ping`. (d) **QoS dan monitoring per tunnel** mudah diterapkan pada interface. (e) **Failover lebih bersih** — tunnel down terlihat sebagai interface down yang langsung memengaruhi routing.
   Policy-based masih dipakai terutama untuk **interoperabilitas dengan perangkat lama** atau vendor yang tidak mendukung VTI.

5. **Diagnosis: masalah MTU.** Paket kecil (SSH interaktif, ping) muat dalam MTU tunnel; paket besar (transfer file) melebihi dan dibuang, sementara ICMP "Fragmentation Needed" kemungkinan diblokir sehingga PMTUD gagal — **MTU black hole**.
   Verifikasi: `ping -M do -s <ukuran>` dengan ukuran menurun untuk menemukan MTU efektif.
   **Tiga perbaikan:** (a) **Set MTU interface tunnel** dengan nilai yang benar (mis. 1420 untuk WireGuard, 1400 sebagai nilai aman universal) di **kedua** sisi. (b) **MSS clamping** — `ip tcp adjust-mss 1360` (Cisco) atau aturan mangle `change-mss new-mss=clamp-to-pmtu` (MikroTik); ini solusi paling andal karena tidak bergantung pada ICMP. (c) **Izinkan ICMP tipe 3 kode 4** melewati firewall di kedua ujung agar PMTUD dapat bekerja untuk trafik non-TCP.

6. **DMVPN memecahkan masalah tromboning pada topologi hub-and-spoke** dan masalah skalabilitas tunnel manual. Tanpa DMVPN, trafik antar-cabang harus melewati hub (menambah latency dan membebani hub), atau Anda harus mengonfigurasi tunnel penuh secara manual — n(n−1)/2 tunnel yang tidak scalable.
   **Cara kerjanya:** setiap router memakai **mGRE** (multipoint GRE) — satu interface tunnel yang bisa berbicara dengan banyak peer. **NHRP** (Next Hop Resolution Protocol) menjadikan hub sebagai database pemetaan alamat overlay ↔ alamat publik. Ketika cabang A ingin menghubungi cabang B, trafik awalnya lewat hub; hub mengirim **NHRP redirect**, cabang A menanyakan alamat publik cabang B ke hub, lalu **membangun tunnel IPsec langsung ke cabang B** secara dinamis. Tunnel itu dihapus otomatis saat tidak dipakai. Routing protocol (EIGRP/OSPF/BGP) berjalan di atas overlay.

7. **SSTP** adalah pilihan terbaik karena berjalan di **TCP port 443** dengan TLS — bagi firewall, trafiknya terlihat seperti HTTPS biasa dan hampir selalu diizinkan. Ia juga native di Windows.
   Alternatif: **OpenVPN dalam mode TCP 443** (fleksibel, tersedia di semua platform, bisa dikombinasikan dengan `--port-share` atau stunnel agar makin menyerupai HTTPS).
   Yang **tidak** akan bekerja: IPsec (UDP 500/4500 dan protokol IP 50 sering diblokir), L2TP/IPsec (sama), dan sering juga WireGuard (UDP 51820, meski bisa dipindah ke UDP 443 dengan hasil bervariasi).
   Catatan: VPN over TCP punya masalah **TCP-over-TCP meltdown** — kalau koneksi memburuk, dua lapis retransmisi saling memperburuk. Pakai UDP kalau memungkinkan; TCP hanya sebagai fallback.

8. **`latest handshake` kosong berarti handshake WireGuard tidak pernah berhasil** — tidak ada komunikasi sama sekali dengan peer itu. Periksa:
   (a) **Port UDP terbuka** di firewall server (`51820` atau yang dikonfigurasi) — dan pada router/NAT di depannya kalau ada.
   (b) **Endpoint benar** — alamat dan port peer; kalau memakai nama domain, pastikan resolusi DNS berhasil.
   (c) **Public key tertukar** — kesalahan yang sangat umum: memasang public key sendiri sebagai peer alih-alih public key lawan. Verifikasi bahwa `PublicKey` di konfigurasi A adalah kunci publik B, dan sebaliknya.
   (d) **`AllowedIPs` tidak mencakup alamat yang diperlukan** sehingga paket tidak pernah dikirim ke peer itu.
   (e) **Jam sistem** — WireGuard memakai timestamp dalam handshake untuk mencegah replay; selisih waktu yang besar menyebabkan handshake ditolak. Periksa NTP.
   (f) **Salah satu sisi di belakang NAT tanpa port forwarding** — sisi itu harus yang memulai koneksi, dan perlu `PersistentKeepalive = 25`.

</details>

---

## 10. Sumber

- RFC 4301–4303 — IPsec Architecture, AH, ESP
- RFC 7296 — IKEv2 · RFC 3948 — UDP Encapsulation of ESP (NAT-T)
- RFC 2784 — Generic Routing Encapsulation (GRE)
- RFC 2332 — NHRP (dasar DMVPN)
- WireGuard — https://www.wireguard.com/papers/wireguard.pdf
- Cisco CCNA 200-301 v1.1, topik 5.5 (IPsec remote access dan site-to-site VPN)
- MikroTik IPsec — https://help.mikrotik.com/docs/display/ROS/IPsec

---

**Berikutnya:** `11-wan-vpn/03-qos.md` — memprioritaskan trafik saat bandwidth terbatas.

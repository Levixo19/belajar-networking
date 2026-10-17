# 08.2 NDP, SLAAC, dan DHCPv6

> **Prasyarat:** `08-ipv6/01`, `06-aplikasi/02`
> **Tujuan:** Anda paham bagaimana host IPv6 menemukan tetangga dan gateway, mengonfigurasi alamatnya sendiri, dan kapan DHCPv6 diperlukan.

---

## 1. NDP (Neighbor Discovery Protocol)

**NDP** [RFC 4861] menggantikan ARP, ICMP Router Discovery, dan ICMP Redirect dari IPv4 — sekaligus menambahkan fungsi baru. Semuanya berjalan di atas **ICMPv6**.

### Lima pesan NDP

| Tipe ICMPv6 | Pesan | Fungsi |
|---|---|---|
| **133** | **RS** (Router Solicitation) | Host: "Ada router di sini? Beri tahu saya sekarang" |
| **134** | **RA** (Router Advertisement) | Router: "Saya router, ini prefix dan parameternya" |
| **135** | **NS** (Neighbor Solicitation) | "Siapa yang punya alamat X?" (pengganti ARP request) |
| **136** | **NA** (Neighbor Advertisement) | "Saya punya X, MAC saya Y" (pengganti ARP reply) |
| **137** | **Redirect** | "Ada gateway yang lebih baik untuk tujuan itu" |

### Fungsi NDP

```
1. Address Resolution     — IPv6 → MAC (menggantikan ARP)
2. Router Discovery       — menemukan default gateway
3. Prefix Discovery       — mengetahui prefix di link ini
4. Parameter Discovery    — MTU, hop limit
5. Address Autoconfiguration (SLAAC)
6. Duplicate Address Detection (DAD)
7. Neighbor Unreachability Detection (NUD)
8. Redirect
```

---

## 2. Address Resolution: Pengganti ARP

```
Host A (2001:db8::1) ingin mengirim ke Host B (2001:db8::a1b2:c3d4)

1. Hitung alamat solicited-node dari B:
   ff02::1:ff + 24 bit terakhir → ff02::1:ffb2:c3d4

2. Kirim NEIGHBOR SOLICITATION (ICMPv6 tipe 135):
   Tujuan  : ff02::1:ffb2:c3d4    ← MULTICAST, bukan broadcast
   Isi     : "Siapa yang punya 2001:db8::a1b2:c3d4?"
   Opsi    : Source Link-Layer Address (MAC saya)

3. Hanya host yang alamat solicited-node-nya cocok yang memproses

4. Host B membalas NEIGHBOR ADVERTISEMENT (tipe 136):
   Tujuan  : 2001:db8::1 (unicast)
   Isi     : "Ya, MAC saya aa:bb:cc:dd:ee:ff"
```

### Kenapa lebih baik daripada ARP

| | ARP (IPv4) | NDP (IPv6) |
|---|---|---|
| Alamat tujuan | **Broadcast** — semua host terganggu | **Solicited-node multicast** — hampir hanya target |
| Beban CPU host lain | Setiap host memproses setiap ARP | Hanya host dengan 24 bit terakhir cocok |
| Layer | Protokol terpisah (EtherType 0x0806) | Bagian dari ICMPv6 → bisa diamankan dengan IPsec |
| Autentikasi | Tidak ada | **SEND** (RFC 3971) tersedia |

> [!TIP]
> Pada segmen dengan 500 host, satu ARP request mengganggu 500 host. Satu NS hanya mengganggu host yang 24 bit terakhir alamatnya cocok — biasanya hanya 1.

### Neighbor Cache

```bash
$ ip -6 neigh show
2001:db8::1 dev eth0 lladdr 00:11:22:33:44:55 router REACHABLE
fe80::1 dev eth0 lladdr 00:11:22:33:44:55 router STALE

# State NDP (mirip ARP di Linux):
#   INCOMPLETE — NS dikirim, menunggu NA
#   REACHABLE  — terverifikasi baru-baru ini
#   STALE      — kedaluwarsa, akan diverifikasi saat dipakai
#   DELAY      — menunggu konfirmasi
#   PROBE      — sedang mengirim NS untuk verifikasi
#   FAILED     — tidak ada jawaban
```

```
R1# show ipv6 neighbors
IPv6 Address        Age Link-layer Addr State Interface
2001:DB8:ACAD:1::10   0 0011.2233.4455  REACH Gi0/0
FE80::211:22FF:FE33:4455 0 0011.2233.4455 REACH Gi0/0
```

---

## 3. DAD (Duplicate Address Detection)

Sebelum memakai alamat apa pun (termasuk link-local), host **wajib** memverifikasi bahwa alamat itu belum dipakai.

```
1. Host membentuk alamat calon, misalnya fe80::1
2. Alamat berstatus TENTATIVE (belum bisa dipakai)
3. Kirim NS ke alamat solicited-node dari alamat calon itu
   Source: :: (unspecified — karena belum punya alamat sah)
4. Tunggu ~1 detik
5. Ada NA balasan? → alamat SUDAH DIPAKAI → tandai DUPLICATE, jangan pakai
   Tidak ada?      → alamat AMAN → berstatus PREFERRED ✅
```

> [!WARNING]
> **DAD dilakukan untuk SETIAP alamat**, termasuk yang dibentuk lewat SLAAC dan yang dikonfigurasi manual.

> [!WARNING]
> **Kalau alamat link-local duplikat, IPv6 pada interface itu DINONAKTIFKAN SEPENUHNYA.** Ini bisa terjadi kalau dua perangkat dikonfigurasi manual dengan `fe80::1` di segmen yang sama.

```
%IPV6-4-DUPLICATE: Duplicate address FE80::1 on GigabitEthernet0/0
```

```bash
# Uji DAD manual di Linux
$ sudo ip -6 addr add 2001:db8::1/64 dev eth0
$ ip -6 addr show eth0
    inet6 2001:db8::1/64 scope global tentative dadfailed   ← DUPLIKAT!
```

---

## 4. Router Advertisement: Jantung Konfigurasi IPv6

Router mengirim RA secara berkala (default setiap 200 detik pada Cisco) dan sebagai jawaban atas RS.

### Isi RA

```
- Prefix (biasanya /64) + flag A (Autonomous) dan L (On-link)
- Router lifetime (berapa lama router ini valid sebagai gateway)
- Flag M (Managed) dan O (Other config)
- Hop limit
- MTU
- Preferensi router (High/Medium/Low)
- RDNSS (server DNS) [RFC 8106]
- DNSSL (search domain)
```

### Flag M dan O: Menentukan Perilaku Host

Ini **konsep terpenting** dalam konfigurasi IPv6.

| M | O | Perilaku host | Nama |
|---|---|---|---|
| 0 | 0 | Alamat dari **SLAAC**; tidak ada DHCPv6 | **SLAAC murni** |
| 0 | 1 | Alamat dari **SLAAC**; opsi lain (DNS) dari **DHCPv6** | **Stateless DHCPv6** |
| 1 | 0/1 | Alamat **dan** opsi dari **DHCPv6** | **Stateful DHCPv6** |

```
R1(config-if)# ipv6 nd managed-config-flag       ← set M=1
R1(config-if)# ipv6 nd other-config-flag         ← set O=1
```

### Aturan yang WAJIB diingat

> **Default gateway IPv6 SELALU berasal dari Router Advertisement — TIDAK PERNAH dari DHCPv6.**

DHCPv6 **tidak punya opsi router sama sekali**. Ini keputusan desain yang disengaja: penemuan router adalah fungsi lapisan jaringan, bukan lapisan aplikasi.

**Konsekuensi praktis:** kalau RA diblokir atau tidak ada, host **tidak akan punya default gateway** — walaupun DHCPv6 berjalan sempurna dan memberi alamat.

### Konfigurasi RA di Cisco

```
R1(config)# ipv6 unicast-routing                  ← WAJIB, tanpa ini tidak ada RA

R1(config)# interface gi0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# ipv6 nd prefix 2001:db8:acad:1::/64 2592000 604800
                                                   │       └── preferred lifetime
                                                   └── valid lifetime
R1(config-if)# ipv6 nd ra interval 30
R1(config-if)# ipv6 nd ra lifetime 1800
R1(config-if)# ipv6 nd router-preference high

# Berikan DNS lewat RA (RDNSS)
R1(config-if)# ipv6 nd ra dns server 2001:4860:4860::8888 infinite

# Matikan RA (mis. pada link yang tidak boleh punya gateway)
R1(config-if)# ipv6 nd ra suppress all
```

> [!WARNING]
> **`ipv6 nd ra suppress` diperlukan pada interface yang menghadap ISP** atau segmen di mana router Anda tidak boleh menjadi gateway.

---

## 5. SLAAC (Autokonfigurasi)

Host membentuk alamatnya **sendiri** tanpa server apa pun.

```
1. Interface aktif
2. Host membentuk LINK-LOCAL (fe80:: + interface ID)
3. Jalankan DAD untuk link-local
4. Kirim ROUTER SOLICITATION ke ff02::2 (semua router)
5. Router membalas ROUTER ADVERTISEMENT berisi prefix
6. Host menggabungkan: PREFIX (dari RA) + INTERFACE ID (dibentuk sendiri)
   → alamat global
7. Jalankan DAD untuk alamat global
8. Set default gateway = alamat LINK-LOCAL router (dari RA)
9. SIAP ✅
```

**Perhatikan langkah 8:** default gateway IPv6 adalah **alamat link-local router**, bukan alamat global-nya.

```bash
$ ip -6 route show default
default via fe80::1 dev eth0 proto ra metric 100
              ^^^^^^ link-local, bukan alamat global
```

> [!TIP]
> Ini keunggulan desain: gateway tetap bekerja walaupun prefix global berubah (renumbering), karena link-local tidak pernah berubah.

### Prefix Lifetime

```
Valid lifetime     : berapa lama alamat masih SAH (default 30 hari)
Preferred lifetime : berapa lama alamat DIUTAMAKAN untuk koneksi baru (default 7 hari)

preferred < valid:
  → alamat masuk status DEPRECATED
  → koneksi lama tetap jalan, koneksi BARU memakai alamat lain
  → ini yang membuat RENUMBERING mulus
```

> [!TIP]
> **Renumbering IPv6 jauh lebih mudah daripada IPv4:** router mengumumkan prefix lama dengan lifetime pendek dan prefix baru dengan lifetime normal. Host memakai keduanya sementara, lalu prefix lama kedaluwarsa dengan sendirinya — tanpa downtime.

### Kelebihan dan Kekurangan SLAAC

| ✅ Kelebihan | ❌ Kekurangan |
|---|---|
| Tanpa server — tidak ada SPOF | Tidak ada catatan siapa memakai alamat apa |
| Sangat sederhana | Tidak bisa memberi alamat spesifik ke perangkat tertentu |
| Cepat | Opsi terbatas (DNS baru tersedia lewat RDNSS) |
| Cocok untuk jaringan kecil/IoT | Sulit diaudit untuk kepatuhan |

---

## 6. DHCPv6

| | DHCPv4 | DHCPv6 |
|---|---|---|
| Port | 67/68 | **546 (klien) / 547 (server)** |
| Tujuan | Broadcast `255.255.255.255` | Multicast **`ff02::1:2`** |
| Identitas klien | MAC address | **DUID** (DHCP Unique Identifier) |
| Default gateway | Opsi 3 | ❌ **TIDAK ADA — selalu dari RA** |
| Mode | Selalu stateful | **Stateful** atau **stateless** |
| Prefix delegation | Tidak | ✅ **IA_PD** |

### Alur DHCPv6 (mirip DORA)

```
SOLICIT   (klien → ff02::1:2)   "Ada server DHCPv6?"
ADVERTISE (server → klien)      "Saya bisa memberi alamat"
REQUEST   (klien → server)      "Saya mau alamat itu"
REPLY     (server → klien)      "Sah"
```

Ada juga jalur cepat 2 pesan: **SOLICIT (dengan Rapid Commit) → REPLY**.

### DUID

Pengenal unik klien yang **tidak berubah** walau NIC diganti atau interface berbeda.

| Tipe | Basis |
|---|---|
| **DUID-LLT** | Link-layer address + timestamp (paling umum) |
| **DUID-EN** | Enterprise number + identifier vendor |
| **DUID-LL** | Link-layer address saja |
| **DUID-UUID** | UUID sistem |

> [!WARNING]
> **DUID bisa menyulitkan reservasi.** Berbeda dari DHCPv4 yang memakai MAC (mudah diketahui dari stiker perangkat), DUID sering harus dibaca dari sistem operasi terlebih dahulu. Beberapa OS juga mengubah DUID setelah instalasi ulang.

### Konfigurasi Stateful DHCPv6 (Cisco)

```
# Server
R1(config)# ipv6 unicast-routing
R1(config)# ipv6 dhcp pool DHCPV6-VLAN10
R1(config-dhcpv6)# address prefix 2001:db8:acad:1::/64
R1(config-dhcpv6)# dns-server 2001:4860:4860::8888
R1(config-dhcpv6)# domain-name perusahaan.local

R1(config)# interface gi0/0
R1(config-if)# ipv6 address 2001:db8:acad:1::1/64
R1(config-if)# ipv6 dhcp server DHCPV6-VLAN10
R1(config-if)# ipv6 nd managed-config-flag       ← M=1: pakai DHCPv6 untuk alamat
R1(config-if)# ipv6 nd prefix 2001:db8:acad:1::/64 no-autoconfig
                                                   └── matikan flag A agar SLAAC tidak dipakai

R1# show ipv6 dhcp pool
R1# show ipv6 dhcp binding
```

### Konfigurasi Stateless DHCPv6

Alamat dari SLAAC, opsi lain dari DHCPv6.

```
R1(config)# ipv6 dhcp pool STATELESS
R1(config-dhcpv6)# dns-server 2001:4860:4860::8888
R1(config-dhcpv6)# domain-name perusahaan.local

R1(config)# interface gi0/0
R1(config-if)# ipv6 dhcp server STATELESS
R1(config-if)# ipv6 nd other-config-flag         ← O=1, M=0
```

### DHCPv6 Relay

```
R1(config-if)# ipv6 dhcp relay destination 2001:db8:acad:99::10
```

### Klien DHCPv6

```
R1(config-if)# ipv6 address dhcp
R1(config-if)# ipv6 address autoconfig            ← SLAAC
R1(config-if)# ipv6 address autoconfig default    ← SLAAC + pasang default route
```

---

## 7. Prefix Delegation (IA_PD)

Fitur yang **tidak ada padanannya di IPv4** — ISP memberikan **seluruh prefix** ke router pelanggan, yang lalu membaginya ke subnet internal.

```
ISP → 2001:db8:1234:5600::/56 ke router pelanggan

Router membagi:
  2001:db8:1234:5600::/64  → LAN
  2001:db8:1234:5601::/64  → Guest Wi-Fi
  2001:db8:1234:5602::/64  → IoT
  2001:db8:1234:5603::/64  → Lab
  ... sampai 56ff (256 subnet)
```

### Konfigurasi klien PD (router pelanggan)

```
# Interface WAN — minta prefix dari ISP
R1(config)# interface gi0/0
R1(config-if)# ipv6 address autoconfig default
R1(config-if)# ipv6 dhcp client pd PREFIX-DARI-ISP

# Interface LAN — pakai prefix yang didelegasikan
R1(config)# interface gi0/1
R1(config-if)# ipv6 address PREFIX-DARI-ISP ::1:0:0:0:1/64
                            └── nama prefix   └── bagian yang ditambahkan

R1(config)# interface gi0/2
R1(config-if)# ipv6 address PREFIX-DARI-ISP ::2:0:0:0:1/64

R1# show ipv6 dhcp interface
R1# show ipv6 general-prefix
```

### Linux (dhcpcd/systemd-networkd)

```bash
# systemd-networkd — /etc/systemd/network/10-wan.network
[Network]
DHCP=ipv6
IPv6AcceptRA=yes

[DHCPv6]
PrefixDelegationHint=::/56

# /etc/systemd/network/20-lan.network
[Network]
IPv6SendRA=yes
DHCPPrefixDelegation=yes

[DHCPPrefixDelegation]
UplinkInterface=wan0
SubnetId=1
```

> [!TIP]
> **PD adalah alasan kuat memakai IPv6 di rumah/kantor kecil** — setiap segmen mendapat prefix publik sendiri tanpa NAT, sehingga semua perangkat dapat dijangkau langsung (dengan firewall yang benar).

---

## 8. First-Hop Security IPv6

RA dan NDP tidak terautentikasi — siapa pun di segmen bisa berpura-pura menjadi router.

### Ancaman

**Rogue RA** — perangkat mengirim RA palsu.
```
Penyerang mengirim RA → host memakainya sebagai gateway
→ MITM sempurna untuk seluruh trafik IPv6
```

> [!WARNING]
> **Sering terjadi TANPA niat jahat:** Windows dengan Internet Connection Sharing, VM dengan bridge yang salah, atau perangkat dengan `net.ipv6.conf.all.forwarding=1` yang tidak sengaja aktif. Ini penyebab gangguan IPv6 yang sangat sering di jaringan kampus.

**NDP spoofing** — setara ARP spoofing.

**NDP exhaustion / scanning DoS** — penyerang memindai alamat acak dalam /64. Router harus membuat entri neighbor cache INCOMPLETE untuk setiap alamat → tabel penuh → DoS.

### Mitigasi

```
# RA Guard — blokir RA dari port yang bukan router
SW1(config)# ipv6 nd raguard policy HOST-PORTS
SW1(config-nd-raguard)# device-role host
SW1(config)# interface range gi0/1-20
SW1(config-if-range)# ipv6 nd raguard attach-policy HOST-PORTS

SW1(config)# ipv6 nd raguard policy ROUTER-PORTS
SW1(config-nd-raguard)# device-role router
SW1(config)# interface gi0/24
SW1(config-if-range)# ipv6 nd raguard attach-policy ROUTER-PORTS

# DHCPv6 Guard — blokir jawaban DHCPv6 dari port pengguna
SW1(config)# ipv6 dhcp guard policy DHCP-HOST
SW1(config-dhcp-guard)# device-role client
SW1(config-if)# ipv6 dhcp guard attach-policy DHCP-HOST

# IPv6 Snooping — bangun binding table (setara DHCP snooping)
SW1(config)# ipv6 snooping policy SNOOP
SW1(config-ipv6-snooping)# security-level guard
SW1(config-if)# ipv6 snooping attach-policy SNOOP

# IPv6 Source Guard
SW1(config-if)# ipv6 source-guard attach-policy

# Batasi neighbor cache (anti NDP exhaustion)
R1(config-if)# ipv6 nd cache expire 300
R1(config)# ipv6 nd cache interface-limit 1024
```

> [!TIP]
> **RA Guard adalah kontrol keamanan IPv6 paling penting di access layer** — setara dengan DHCP snooping di IPv4. Terapkan di semua port pengguna.

> [!WARNING]
> **RA Guard bisa dilewati** dengan RA yang difragmentasi atau memakai extension header (RFC 7113). Perangkat modern menangani ini, tetapi verifikasi platform Anda.

---

## 9. Troubleshooting

### Alur diagnosis

```
1. Apakah interface punya link-local?
   $ ip -6 addr show eth0
   → tidak ada fe80::/64 → IPv6 dinonaktifkan atau DAD gagal

2. Apakah router terlihat?
   $ ip -6 neigh show | grep router
   $ sudo rdisc6 eth0            ← paksa kirim RS

3. Apakah RA diterima?
   $ sudo tcpdump -ni eth0 'icmp6 && ip6[40] == 134'
   → tidak ada RA → router tidak mengirim, atau RA Guard memblokir,
                     atau ipv6 unicast-routing belum aktif

4. Apakah alamat global terbentuk?
   $ ip -6 addr show scope global
   → tidak ada → cek flag A di RA, cek panjang prefix (harus /64)

5. Apakah ada default route?
   $ ip -6 route show default
   → tidak ada → RA tidak diterima (default gateway HANYA dari RA)

6. Apakah bisa ping gateway?
   $ ping6 -c3 fe80::1%eth0

7. Apakah DNS memberi AAAA?
   $ dig AAAA example.com
```

### Perintah penting

```bash
# Linux
$ ip -6 addr show
$ ip -6 route show
$ ip -6 neigh show
$ sysctl net.ipv6.conf.eth0.accept_ra      # 0=tolak, 1=terima, 2=terima walau forwarding
$ sudo rdisc6 eth0                          # kirim RS manual
$ sudo ndisc6 2001:db8::1 eth0              # kirim NS manual
$ sudo tcpdump -ni eth0 icmp6 -v

# Filter Wireshark
icmpv6.type == 134     ← Router Advertisement
icmpv6.type == 133     ← Router Solicitation
icmpv6.type == 135     ← Neighbor Solicitation
icmpv6.type == 136     ← Neighbor Advertisement
dhcpv6
```

```
# Cisco
R1# show ipv6 interface gi0/0
R1# show ipv6 neighbors
R1# show ipv6 routers                      ← router lain yang terdeteksi
R1# show ipv6 dhcp binding
R1# show ipv6 dhcp interface
R1# debug ipv6 nd
R1# debug ipv6 dhcp
```

### Masalah umum

| Gejala | Penyebab |
|---|---|
| Tidak ada alamat global | RA tidak diterima; flag A=0; prefix bukan /64; `ipv6 unicast-routing` belum aktif |
| Punya alamat tetapi tidak ada gateway | **RA diblokir** — gateway HANYA dari RA, tidak pernah dari DHCPv6 |
| IPv6 mati total di interface | **Link-local duplikat** (DAD gagal) |
| Host mendapat gateway yang salah | **Rogue RA** — aktifkan RA Guard |
| DHCPv6 memberi alamat tetapi tidak ada konektivitas | Flag M=1 tetapi RA tidak dikirim → tidak ada gateway |
| Bekerja lalu berhenti setelah beberapa jam | RA lifetime habis dan RA baru tidak diterima |
| Alamat berubah-ubah | Privacy extension aktif (normal); nonaktifkan untuk server |
| Router IPv6 tidak meneruskan | `ipv6 unicast-routing` belum diaktifkan |

---

## MikroTik RouterOS

### Router Advertisement

```
# Konfigurasi RA per interface
/ipv6 nd set [find interface=bridge-LAN] \
    ra-interval=30s-60s ra-lifetime=30m \
    managed-address-configuration=no other-configuration=yes \
    advertise-dns=yes hop-limit=64

# Prefix yang diumumkan
/ipv6 nd prefix add interface=bridge-LAN prefix=2001:db8:acad:1::/64 \
    autonomous=yes valid-lifetime=30d preferred-lifetime=7d

# Server DNS lewat RA (RDNSS)
/ipv6 nd set [find interface=bridge-LAN] dns=2606:4700:4700::1111

# Matikan RA (mis. di interface WAN)
/ipv6 nd set [find interface=ether1-WAN] disabled=yes

/ipv6 nd print
/ipv6 nd prefix print
```

**Pemetaan flag:**
| Flag Cisco | MikroTik |
|---|---|
| `ipv6 nd managed-config-flag` (M=1) | `managed-address-configuration=yes` |
| `ipv6 nd other-config-flag` (O=1) | `other-configuration=yes` |
| flag A pada prefix | `autonomous=yes` |
| `ipv6 nd ra suppress` | `/ipv6 nd set ... disabled=yes` |

### DHCPv6 Server

```
/ipv6 pool add name=pool-lan prefix=2001:db8:acad:1::/64 prefix-length=64
/ipv6 dhcp-server add name=dhcpv6-lan interface=bridge-LAN address-pool=pool-lan \
    lease-time=1d
/ipv6 dhcp-server option add name=dns code=23 value="'2606:4700:4700::1111'"

/ipv6 dhcp-server print
/ipv6 dhcp-server binding print
```

### DHCPv6 Client dengan Prefix Delegation

Ini konfigurasi yang paling sering dipakai untuk pelanggan ISP IPv6.

```
# Minta prefix dari ISP
/ipv6 dhcp-client add interface=ether1-WAN request=prefix pool-name=pool-isp \
    pool-prefix-length=64 add-default-route=yes use-peer-dns=yes disabled=no

# Pakai prefix yang didelegasikan di LAN
/ipv6 address add address=::1/64 from-pool=pool-isp interface=bridge-LAN advertise=yes
/ipv6 address add address=::1/64 from-pool=pool-isp interface=vlan20 advertise=yes

# Verifikasi
/ipv6 dhcp-client print
/ipv6 pool print
/ipv6 address print
```

> [!TIP]
> **`from-pool=` dengan `address=::1/64`** adalah cara RouterOS mengambil prefix dari kolam delegasi dan menempelkan bagian host `::1`. Sangat elegan — ketika ISP mengganti prefix, alamat LAN otomatis mengikuti tanpa konfigurasi ulang.

### Keamanan IPv6 (RA Guard setara)

```
# Blokir RA dari port pengguna dengan bridge filter
/interface bridge filter add chain=forward in-interface=ether2 \
    mac-protocol=ipv6 ip-protocol=icmpv6 icmp-options=134:0-255 action=drop \
    comment="RA Guard: blokir Router Advertisement dari port pengguna"

# Atau dengan firewall IPv6
/ipv6 firewall filter add chain=input in-interface-list=LAN protocol=icmpv6 \
    icmp-options=134 action=drop
```

> [!WARNING]
> **RouterOS tidak punya fitur RA Guard bawaan seperti Cisco.** Anda harus membuatnya sendiri dengan bridge filter. Ini kelemahan nyata untuk jaringan access layer yang besar.

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `ipv6 nd prefix X/64` | `/ipv6 nd prefix add prefix=X/64` |
| `ipv6 nd managed-config-flag` | `managed-address-configuration=yes` |
| `ipv6 dhcp pool` | `/ipv6 dhcp-server` + `/ipv6 pool` |
| `ipv6 dhcp client pd X` | `/ipv6 dhcp-client request=prefix pool-name=X` |
| `ipv6 address X ::1:0:0:0:1/64` | `/ipv6 address add address=::1/64 from-pool=X` |
| `ipv6 nd raguard` | bridge filter manual |
| `show ipv6 dhcp binding` | `/ipv6 dhcp-server binding print` |

---

## 10. Ringkasan

- **NDP** (ICMPv6 tipe 133-137) menggantikan ARP, router discovery, dan redirect IPv4.
- Address resolution memakai **solicited-node multicast** (`ff02::1:ff` + 24 bit terakhir) — jauh lebih efisien daripada broadcast ARP.
- **DAD** wajib untuk setiap alamat; **link-local duplikat mematikan IPv6 di interface itu**.
- **RA adalah jantung konfigurasi IPv6.** Flag **M** (alamat dari DHCPv6) dan **O** (opsi lain dari DHCPv6) menentukan perilaku host.
- **Default gateway SELALU dari RA — DHCPv6 tidak punya opsi router sama sekali.**
- Gateway yang dipasang adalah **alamat link-local router**, bukan alamat global — sehingga tahan terhadap renumbering.
- **SLAAC**: prefix dari RA + interface ID dibentuk sendiri. Tanpa server, tetapi tanpa catatan alokasi.
- **DHCPv6**: port **546/547**, multicast `ff02::1:2`, identitas **DUID**, mendukung **prefix delegation (IA_PD)**.
- **Prefix delegation** memberi seluruh /56 atau /48 ke router pelanggan — tidak ada padanannya di IPv4.
- **Preferred vs valid lifetime** membuat renumbering mulus tanpa downtime.
- Keamanan: **RA Guard** (paling penting), DHCPv6 Guard, IPv6 Snooping, Source Guard, batasi neighbor cache.
- **Rogue RA sering tidak disengaja** (VM, ICS, forwarding yang salah aktif).

---

## 11. Latihan

1. Jelaskan langkah demi langkah bagaimana host mendapat alamat lewat SLAAC.
2. Host mendapat alamat IPv6 dari DHCPv6 tetapi tidak bisa mengakses apa pun di luar subnetnya. Apa penyebabnya?
3. Apa arti flag M=0, O=1 di RA?
4. Kenapa default gateway IPv6 memakai alamat link-local, bukan alamat global?
5. Jelaskan bagaimana NDP lebih efisien daripada ARP.
6. Seluruh IPv6 mati di sebuah interface router. `show ipv6 interface` menunjukkan link-local dalam status DUPLICATE. Apa yang terjadi?
7. Apa itu prefix delegation dan kenapa ia penting?
8. Sebuah jaringan kampus mengalami gangguan IPv6 berkala — sebagian host mendapat gateway yang salah. Apa dugaan Anda dan bagaimana mencegahnya?

<details>
<summary>Jawaban</summary>

1. (a) Interface aktif; host membentuk **alamat link-local** `fe80::` + interface ID (dari EUI-64, acak, atau stable privacy). (b) Menjalankan **DAD** untuk link-local — mengirim NS ke alamat solicited-node dengan source `::`. (c) Setelah link-local sah, host mengirim **Router Solicitation** ke `ff02::2` (semua router). (d) Router membalas dengan **Router Advertisement** berisi prefix (flag A=1), lifetime, MTU, dan opsi lain. (e) Host **menggabungkan prefix dari RA dengan interface ID yang dibentuknya sendiri** → alamat global. (f) Menjalankan DAD untuk alamat global itu. (g) Memasang **default gateway = alamat link-local router** yang mengirim RA. (h) Siap digunakan.

2. **Tidak ada default gateway**, karena RA tidak diterima. DHCPv6 memberikan alamat, DNS, dan opsi lain — tetapi **DHCPv6 tidak punya opsi router sama sekali**. Default gateway IPv6 **hanya** bisa berasal dari Router Advertisement.
   Periksa: (a) apakah router mengirim RA (`ipv6 unicast-routing` aktif? `ipv6 nd ra suppress` tidak aktif?); (b) apakah RA Guard atau ACL memblokir ICMPv6 tipe 134; (c) apakah host menerima RA (`tcpdump -ni eth0 'icmp6 && ip6[40] == 134'`); (d) apakah `accept_ra` di host bernilai 0 (atau 1 sementara forwarding aktif — butuh nilai 2).

3. **M=0, O=1** berarti **Stateless DHCPv6**: host membentuk **alamatnya sendiri lewat SLAAC** (karena M=0, tidak perlu meminta alamat dari DHCPv6), tetapi **mengambil opsi konfigurasi lain** — server DNS, domain search list, NTP — **dari server DHCPv6** (karena O=1). Ini pilihan yang umum ketika Anda ingin kesederhanaan SLAAC tetapi butuh distribusi DNS terpusat pada jaringan yang klien-kliennya belum mendukung RDNSS.

4. Karena **alamat link-local tidak pernah berubah**. Ia dibentuk otomatis saat interface aktif dan tidak bergantung pada prefix global yang diberikan ISP. Kalau default gateway memakai alamat global, maka setiap kali prefix berubah (ISP mengganti alokasi, renumbering, failover ke ISP lain), **semua host harus memperbarui gateway-nya**. Dengan link-local, gateway tetap valid apa pun yang terjadi pada prefix global — inilah yang membuat **renumbering IPv6 mulus**. Ini juga berarti host bisa berkomunikasi dengan router-nya bahkan sebelum ada alamat global sama sekali.

5. Tiga hal: (a) **ARP memakai broadcast** — setiap host di segmen menerima dan memproses setiap ARP request, membuang CPU; **NDP memakai solicited-node multicast** yang hanya diproses host yang **24 bit terakhir alamatnya cocok**, biasanya hanya satu host. Pada segmen dengan 500 host, ini perbedaan 500× dalam beban pemrosesan. (b) NDP adalah bagian dari **ICMPv6**, sehingga bisa diamankan dengan IPsec atau SEND (RFC 3971), sedangkan ARP adalah protokol terpisah tanpa mekanisme keamanan apa pun. (c) NDP menyatukan beberapa fungsi (address resolution, router discovery, prefix discovery, redirect, DAD, NUD) dalam satu protokol yang konsisten.

6. **Ada perangkat lain di segmen yang memakai alamat link-local yang sama.** DAD mendeteksinya dan menandai alamat sebagai DUPLICATE. Karena link-local adalah **prasyarat mutlak** untuk semua operasi IPv6 (NDP, RA, routing), **IPv6 dinonaktifkan sepenuhnya pada interface itu**.
   Penyebab tersering: dua router dikonfigurasi manual dengan `ipv6 address fe80::1 link-local` di segmen yang sama. Perbaikan: berikan link-local yang berbeda (`fe80::1` dan `fe80::2`), atau biarkan dibentuk otomatis dari MAC. Setelah diperbaiki, lakukan `shutdown` lalu `no shutdown` pada interface.

7. **Prefix Delegation (IA_PD)** adalah mekanisme DHCPv6 di mana ISP memberikan **seluruh blok prefix** (biasanya /56 atau /48) kepada router pelanggan, bukan sekadar satu alamat. Router pelanggan kemudian **membagi prefix itu menjadi beberapa /64** untuk setiap segmen internalnya, dan mengumumkannya lewat RA.
   **Kenapa penting:** ini menghilangkan kebutuhan NAT sepenuhnya. Setiap perangkat di setiap VLAN rumah/kantor mendapat **alamat publik yang dapat dirutekan**, sehingga konektivitas end-to-end pulih — VoIP, P2P, game, dan IoT bekerja tanpa port forwarding atau NAT traversal. Tidak ada padanannya di IPv4, di mana pelanggan hanya mendapat satu alamat publik.

8. **Rogue Router Advertisement.** Ada perangkat di jaringan yang mengirim RA — bisa jadi karena serangan, tetapi jauh lebih sering **tidak disengaja**: laptop Windows dengan Internet Connection Sharing aktif, VM dengan bridge yang salah dikonfigurasi, perangkat Linux dengan `net.ipv6.conf.all.forwarding=1` yang tidak sengaja aktif, atau router rumahan yang dicolokkan terbalik. Host yang menerima RA palsu memasangnya sebagai gateway → trafik mengalir ke perangkat yang tidak bisa merutekannya (atau ke penyerang).
   **Pencegahan:** aktifkan **RA Guard** di semua port access, dengan `device-role host` di port pengguna dan `device-role router` hanya di uplink. Tambahkan **DHCPv6 Guard** dan **IPv6 Snooping**. Deteksi: `show ipv6 routers` di router, atau `rdisc6`/`tcpdump` untuk melihat siapa yang mengirim RA.

</details>

---

## 12. Sumber

- RFC 4861 — Neighbor Discovery for IPv6
- RFC 4862 — IPv6 Stateless Address Autoconfiguration (SLAAC)
- RFC 8415 — DHCPv6
- RFC 8106 — IPv6 RA Options for DNS Configuration (RDNSS)
- RFC 6105 — IPv6 RA Guard · RFC 7113 — Implementation Advice for RA Guard
- RFC 3971 — SEcure Neighbor Discovery (SEND)
- Cisco CCNA 200-301 v1.1, topik 1.8, 1.9, 4.6

---

**Berikutnya:** `08-ipv6/03-routing-transisi-ipv6.md`. Routing IPv6 dan strategi migrasi.

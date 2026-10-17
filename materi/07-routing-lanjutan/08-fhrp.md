# 07.8 First Hop Redundancy Protocol (FHRP)

> **Prasyarat:** `04-network-layer/05`, `03-data-link/04`
> **Tujuan:** Anda paham masalah default gateway tunggal, bisa mengonfigurasi HSRP/VRRP/GLBP, dan merancang load balancing gateway per VLAN.

---

## 1. Masalah yang Dipecahkan

```
[PC] ── default gateway 192.168.1.1 ── [Router-A] ── Internet

Router-A mati:
  → PC tidak bisa mengakses apa pun di luar subnetnya
  → Meskipun ada Router-B yang sehat di segmen yang sama!
```

**Kenapa PC tidak otomatis beralih?** Karena default gateway pada host adalah **konfigurasi statis** — satu alamat IP. Host tidak menjalankan protokol routing dan tidak tahu ada router lain.

### Solusi yang tidak memadai

| Solusi | Masalah |
|---|---|
| Konfigurasi ulang manual | Butuh menyentuh setiap host — mustahil |
| Proxy ARP | Lambat (bergantung ARP timeout), tidak dapat diandalkan |
| ICMP Router Discovery (IRDP) | Dukungan host buruk, konvergensi lambat |
| DHCP dengan dua gateway | DHCP hanya memberi satu gateway; lease tidak segera diperbarui |

### Solusi FHRP

**Beberapa router berbagi satu alamat IP virtual dan MAC virtual.**

```
Router-A (aktif)  : 192.168.1.2
Router-B (standby): 192.168.1.3
Virtual IP        : 192.168.1.1   ← inilah yang dipakai host
Virtual MAC       : 0000.0c07.ac0a

Host mengirim ke 192.168.1.1 → ARP menjawab dengan MAC virtual
→ Router aktif yang memproses

Router-A mati:
→ Router-B mengambil alih IP dan MAC virtual
→ Mengirim gratuitous ARP agar switch memperbarui MAC table
→ Host TIDAK PERLU BERUBAH APA PUN
```

---

## 2. Perbandingan Protokol FHRP

| | **HSRP** | **VRRP** | **GLBP** |
|---|---|---|---|
| Standar | Cisco proprietary | **IETF RFC 5798** | Cisco proprietary |
| Peran | Active / Standby | Master / Backup | AVG / AVF |
| Load balancing | ❌ (per-VLAN saja) | ❌ (per-VLAN saja) | ✅ **Bawaan** |
| Multicast | 224.0.0.2 (v1) / **224.0.0.102** (v2) | **224.0.0.18** | 224.0.0.102 |
| Port | UDP 1985 (v1) / 1985 (v2) | Protokol IP **112** | UDP 3222 |
| Priority default | 100 | 100 | 100 |
| Preempt default | **Nonaktif** | **Aktif** | Nonaktif |
| Virtual MAC | `0000.0C07.ACxx` (v1) / `0000.0C9F.Fxxx` (v2) | `0000.5E00.01xx` | `0007.b400.xxyy` |
| Timer default | Hello 3 / Hold 10 | Advertise 1 / Down 3 | Hello 3 / Hold 10 |
| Jumlah grup | 0-255 (v1) / 0-4095 (v2) | 1-255 | 0-1023 |

> [!TIP]
> **Perbedaan preempt sangat penting:** VRRP secara default akan mengambil alih ketika router dengan priority lebih tinggi kembali online; HSRP **tidak** kecuali dikonfigurasi. Ini sering mengejutkan.

---

## 3. HSRP

### State machine

```
Initial   → baru dimulai
Learn     → belum tahu virtual IP, menunggu hello dari active
Listen    → tahu virtual IP, tetapi bukan active/standby
Speak     → berpartisipasi dalam pemilihan, mengirim hello
Standby   → kandidat untuk menggantikan active
Active    → meneruskan paket untuk virtual IP ✅
```

### Pemilihan

```
1. Priority TERTINGGI menang (default 100)
2. Kalau seri → alamat IP TERTINGGI menang
```

### Konfigurasi

```
# Router-A (utama)
R-A(config)# interface vlan 10
R-A(config-if)# ip address 192.168.10.2 255.255.255.0
R-A(config-if)# standby version 2
R-A(config-if)# standby 10 ip 192.168.10.1
R-A(config-if)# standby 10 priority 110
R-A(config-if)# standby 10 preempt delay minimum 60
R-A(config-if)# standby 10 authentication md5 key-string RahasiaKuat
R-A(config-if)# standby 10 timers 1 3
R-A(config-if)# standby 10 name VLAN10-GW

# Router-B (cadangan)
R-B(config)# interface vlan 10
R-B(config-if)# ip address 192.168.10.3 255.255.255.0
R-B(config-if)# standby version 2
R-B(config-if)# standby 10 ip 192.168.10.1
R-B(config-if)# standby 10 priority 100
R-B(config-if)# standby 10 preempt
R-B(config-if)# standby 10 authentication md5 key-string RahasiaKuat
```

> [!WARNING]
> **`preempt` harus dikonfigurasi eksplisit di HSRP.** Tanpa itu, setelah router utama pulih dari kegagalan, ia akan tetap menjadi standby — router cadangan terus menjadi active. Ini bisa menyebabkan trafik mengambil jalur yang tidak dioptimalkan tanpa disadari.

> [!TIP]
> **`preempt delay minimum 60`** memberi waktu router yang baru boot untuk menyelesaikan konvergensi routing protocol sebelum mengambil alih. Tanpa delay, router bisa menjadi active sementara ia belum punya rute ke mana pun — menciptakan black hole.

### HSRP v1 vs v2

| | v1 | v2 |
|---|---|---|
| Grup | 0-255 | **0-4095** |
| Multicast | 224.0.0.2 | **224.0.0.102** |
| Virtual MAC | 0000.0C07.AC**xx** | 0000.0C9F.F**xxx** |
| IPv6 | Tidak | Ya |
| MD5 auth | Tidak | Ya |
| Timer milidetik | Tidak | Ya |

> [!TIP]
> **Gunakan v2** kecuali ada perangkat lama yang memaksa v1. Kedua versi **tidak interoperable** — semua router dalam satu grup harus memakai versi yang sama.

---

## 4. Interface Tracking: Bagian Terpenting

Tanpa tracking, HSRP hanya bereaksi pada kegagalan router itu sendiri. Tetapi masalah yang lebih umum adalah **uplink router yang mati**.

```
Skenario tanpa tracking:
  Router-A active, uplink WAN-nya MATI
  Router-A tetap active (interface LAN masih up)
  → Semua trafik host masuk ke Router-A
  → Router-A tidak punya jalan keluar
  → BLACK HOLE ❌
```

### Tracking interface

```
R-A(config-if)# standby 10 track gi0/0 30
   ← kalau gi0/0 down, kurangi priority sebesar 30
   ← 110 − 30 = 80 < 100 (Router-B) → Router-B mengambil alih ✅
```

> [!WARNING]
> **Router-B harus punya `preempt`** agar bisa mengambil alih saat priority Router-A turun.

### Tracking dengan object tracking (lebih baik)

Tracking interface hanya mendeteksi interface down. Object tracking bisa mendeteksi kegagalan **end-to-end**.

```
# Uji konektivitas ke internet
R-A(config)# ip sla 1
R-A(config-ip-sla)# icmp-echo 8.8.8.8 source-interface gi0/0
R-A(config-ip-sla-echo)# frequency 5
R-A(config)# ip sla schedule 1 life forever start-time now

R-A(config)# track 1 ip sla 1 reachability
R-A(config-track)# delay down 10 up 30

R-A(config)# interface vlan 10
R-A(config-if)# standby 10 track 1 decrement 30
```

Sekarang HSRP bereaksi kalau internet tidak dapat dijangkau — bukan hanya kalau kabel dicabut.

### Tracking beberapa objek

```
R-A(config-if)# standby 10 track 1 decrement 30      ← uplink utama
R-A(config-if)# standby 10 track 2 decrement 20      ← rute penting
R-A(config-if)# standby 10 track gi0/1 decrement 10  ← link ke core
```

---

## 5. VRRP

Standar terbuka [RFC 5798] — bekerja antar-vendor.

```
R-A(config)# interface vlan 10
R-A(config-if)# ip address 192.168.10.2 255.255.255.0
R-A(config-if)# vrrp 10 ip 192.168.10.1
R-A(config-if)# vrrp 10 priority 110
R-A(config-if)# vrrp 10 authentication md5 key-string RahasiaKuat
R-A(config-if)# vrrp 10 timers advertise 1
R-A(config-if)# vrrp 10 track 1 decrement 30

R-A# show vrrp
R-A# show vrrp brief
```

### Perbedaan penting dari HSRP

**1. Preempt aktif secara default** — router dengan priority tertinggi selalu mengambil alih.

**2. Bisa memakai alamat IP fisik sebagai virtual IP.**
```
R-A(config-if)# ip address 192.168.10.1 255.255.255.0
R-A(config-if)# vrrp 10 ip 192.168.10.1        ← SAMA dengan IP fisik
```
Router ini otomatis menjadi **master dengan priority 255** (nilai khusus, tidak bisa dikonfigurasi manual). Ini disebut **IP address owner**.

> [!TIP]
> Keuntungan: menghemat satu alamat IP per subnet. Kerugian: router owner selalu menjadi master (priority 255 tidak bisa dikalahkan), sehingga tracking tidak bisa memaksa failover.

**3. Berjalan langsung di atas IP (protokol 112)**, bukan UDP.

> [!WARNING]
> **ACL yang memblokir protokol IP 112 akan mematikan VRRP** — sering terlewat saat hardening.

---

## 6. GLBP (Load Balancing Bawaan)

Masalah HSRP dan VRRP: hanya **satu router yang aktif**; router lain menganggur sepenuhnya.

**GLBP** membagi beban ke semua router sekaligus.

### Cara kerja

```
AVG (Active Virtual Gateway):
  - Satu router terpilih
  - Menjawab SEMUA ARP request untuk virtual IP
  - Tetapi memberikan MAC VIRTUAL YANG BERBEDA ke setiap host

AVF (Active Virtual Forwarder):
  - Setiap router (termasuk AVG) memiliki MAC virtual sendiri
  - Meneruskan trafik untuk MAC virtualnya

Hasilnya:
  Host-1 ARP → AVG menjawab MAC virtual 1 → trafik ke Router-A
  Host-2 ARP → AVG menjawab MAC virtual 2 → trafik ke Router-B
  Host-3 ARP → AVG menjawab MAC virtual 1 → trafik ke Router-A
  ...
  → SEMUA router membawa trafik ✅
```

### Konfigurasi

```
R-A(config)# interface vlan 10
R-A(config-if)# glbp 10 ip 192.168.10.1
R-A(config-if)# glbp 10 priority 110
R-A(config-if)# glbp 10 preempt
R-A(config-if)# glbp 10 load-balancing round-robin
R-A(config-if)# glbp 10 weighting 110 lower 85 upper 105
R-A(config-if)# glbp 10 weighting track 1 decrement 30
R-A(config-if)# glbp 10 authentication md5 key-string RahasiaKuat

R-A# show glbp
R-A# show glbp brief
```

### Metode load balancing

| Metode | Cara kerja |
|---|---|
| `round-robin` | Bergiliran per ARP request (default) |
| `weighted` | Sesuai bobot (`weighting`) — router lebih kuat mendapat lebih banyak |
| `host-dependent` | Host yang sama selalu mendapat MAC yang sama (konsisten) |

> [!WARNING]
> **GLBP proprietary Cisco** dan lebih kompleks. Alternatif modern yang lebih umum: **HSRP/VRRP dengan load balancing per-VLAN**, atau **anycast gateway** pada fabric VXLAN/EVPN.

---

## 7. Load Balancing per VLAN

Cara paling umum memanfaatkan kedua router tanpa GLBP.

```
VLAN 10 → Router-A active, Router-B standby
VLAN 20 → Router-B active, Router-A standby
VLAN 30 → Router-A active
VLAN 40 → Router-B active
```

```
# Router-A
R-A(config)# interface vlan 10
R-A(config-if)# standby 10 ip 192.168.10.1
R-A(config-if)# standby 10 priority 110
R-A(config-if)# standby 10 preempt

R-A(config)# interface vlan 20
R-A(config-if)# standby 20 ip 192.168.20.1
R-A(config-if)# standby 20 priority 90        ← lebih rendah

# Router-B (kebalikannya)
R-B(config)# interface vlan 10
R-B(config-if)# standby 10 ip 192.168.10.1
R-B(config-if)# standby 10 priority 90

R-B(config)# interface vlan 20
R-B(config-if)# standby 20 ip 192.168.20.1
R-B(config-if)# standby 20 priority 110
R-B(config-if)# standby 20 preempt
```

> [!WARNING]
> **Selaraskan dengan root bridge STP!** Kalau HSRP active untuk VLAN 10 ada di Router-A tetapi STP root untuk VLAN 10 ada di Router-B, trafik akan **memutar** melalui link antar-switch — membuang bandwidth dan menambah latency.

```
# Selaraskan: Router-A menjadi STP root DAN HSRP active untuk VLAN 10
R-A(config)# spanning-tree vlan 10 root primary
R-A(config)# spanning-tree vlan 20 root secondary
R-B(config)# spanning-tree vlan 20 root primary
R-B(config)# spanning-tree vlan 10 root secondary
```

> [!TIP]
> **Aturan desain: STP root, HSRP active, dan jalur routing utama untuk sebuah VLAN harus berada di router yang sama.**

---

## 8. FHRP untuk IPv6

IPv6 sebenarnya sudah punya redundansi gateway bawaan lewat **Router Advertisement** — host bisa mendengar RA dari beberapa router dan beralih otomatis. Tetapi konvergensinya bergantung pada timer RA (bisa lambat).

FHRP tetap berguna untuk failover cepat:

```
# HSRPv6
R-A(config-if)# standby version 2
R-A(config-if)# standby 10 ipv6 autoconfig
R-A(config-if)# standby 10 priority 110
R-A(config-if)# standby 10 preempt

# VRRPv3 (mendukung IPv4 dan IPv6)
R-A(config)# fhrp version vrrp v3
R-A(config-if)# vrrp 10 address-family ipv6
R-A(config-if-vrrp)# vrrp 10 priority 110
R-A(config-if-vrrp)# address FE80::1 primary
```

---

## 9. Verifikasi dan Troubleshooting

```
R-A# show standby
Vlan10 - Group 10 (version 2)
  State is Active
    2 state changes, last state change 02:15:33
  Virtual IP address is 192.168.10.1
  Active virtual MAC address is 0000.0c9f.f00a
    Local virtual MAC address is 0000.0c9f.f00a (v2 default)
  Hello time 3 sec, hold time 10 sec
    Next hello sent in 1.024 secs
  Authentication MD5, key-string
  Preemption enabled, delay min 60 secs
  Active router is local
  Standby router is 192.168.10.3, priority 100 (expires in 9.216 sec)
  Priority 110 (configured 110)
    Track object 1 state Up decrement 30
  Group name is "VLAN10-GW" (cfgd)

R-A# show standby brief
Interface Grp Pri P State   Active          Standby         Virtual IP
Vl10      10  110 P Active  local           192.168.10.3    192.168.10.1
Vl20      20   90 P Standby 192.168.20.3    local           192.168.20.1

R-A# show vrrp brief
R-A# show glbp brief
R-A# show track
R-A# debug standby events
R-A# debug standby terse
```

### Masalah umum

| Gejala | Penyebab |
|---|---|
| **Kedua router Active** (split-brain) | Hello tidak sampai: VLAN tidak melewatkan, ACL memblokir multicast, versi HSRP berbeda, autentikasi berbeda |
| Router utama tidak mengambil alih setelah pulih | **`preempt` tidak dikonfigurasi** (HSRP default nonaktif) |
| Failover terjadi tetapi trafik tetap gagal | **Tracking tidak dikonfigurasi** — router active tidak punya uplink |
| Failover lambat | Timer default (hello 3/hold 10 = ~10 detik); turunkan atau pakai BFD |
| Flapping (bolak-balik) | Link tidak stabil; tambahkan `preempt delay` dan `delay down/up` pada track |
| Trafik memutar antar-switch | **STP root dan HSRP active tidak selaras** |
| Host tidak beralih setelah failover | Gratuitous ARP tidak sampai; periksa switch dan MAC table |

> [!WARNING]
> **Split-brain (kedua router Active) adalah kondisi paling berbahaya** — kedua router menjawab ARP untuk IP virtual yang sama, menyebabkan MAC flapping di switch dan trafik yang tidak konsisten. Selalu periksa apakah hello benar-benar sampai:
```
R-A# debug standby packets
R-A# show standby | include Standby router
```

### Mempercepat failover

```
# Timer milidetik (HSRPv2)
R-A(config-if)# standby 10 timers msec 200 msec 750

# BFD (paling baik)
R-A(config-if)# standby 10 bfd
R-A(config-if)# bfd interval 50 min_rx 50 multiplier 3
```

> [!WARNING]
> Timer yang terlalu agresif meningkatkan beban CPU dan risiko false failover pada jaringan yang sedikit tidak stabil.

---

## 10. Alternatif Modern

| Teknologi | Cara kerja |
|---|---|
| **Anycast Gateway** (EVPN/VXLAN) | **Semua** leaf switch memakai IP dan MAC gateway yang sama; host selalu dilayani switch terdekat. Tidak ada active/standby sama sekali |
| **MLAG / vPC + SVI** | Dua switch tampil sebagai satu; keduanya aktif |
| **Stacking** | Beberapa switch menjadi satu logis; SVI tunggal |
| **Routed access** | Tidak ada gateway bersama; setiap access switch merutekan sendiri |

> [!TIP]
> **Anycast gateway** adalah arah modern di data center: menghilangkan konsep failover gateway sepenuhnya, karena setiap switch adalah gateway. Detail di `16-datacenter-cloud-sdn/02`.

---

## MikroTik RouterOS

RouterOS mendukung **VRRP** (standar RFC 5798) — tidak ada HSRP atau GLBP karena keduanya proprietary Cisco.

```
# Router A (utama)
/interface vrrp add name=vrrp-vlan10 interface=vlan10 vrid=10 priority=110 \
    interval=1s preemption-mode=yes \
    authentication=ah password=RahasiaKuat
/ip address add address=192.168.10.1/24 interface=vrrp-vlan10

# Router B (cadangan)
/interface vrrp add name=vrrp-vlan10 interface=vlan10 vrid=10 priority=100 \
    interval=1s preemption-mode=yes \
    authentication=ah password=RahasiaKuat
/ip address add address=192.168.10.1/24 interface=vrrp-vlan10

# Verifikasi
/interface vrrp print
/interface vrrp monitor vrrp-vlan10
     state: master
     master-priority: 110
```

> [!WARNING]
> **Perhatikan konsep berbeda dari Cisco:** di RouterOS, **alamat IP virtual dipasang pada interface VRRP**, bukan pada interface fisik. Interface fisik (`vlan10`) tetap punya alamat uniknya sendiri.

```
# Interface fisik — alamat unik per router
/ip address add address=192.168.10.2/24 interface=vlan10    ← Router A
/ip address add address=192.168.10.3/24 interface=vlan10    ← Router B

# Interface VRRP — alamat virtual (SAMA di kedua router)
/ip address add address=192.168.10.1/24 interface=vrrp-vlan10
```

### Tracking dengan Netwatch

RouterOS tidak punya `standby track` bawaan; gunakan **Netwatch** untuk menurunkan priority:

```
/tool netwatch add host=8.8.8.8 interval=5s \
  down-script="/interface vrrp set vrrp-vlan10 priority=50" \
  up-script="/interface vrrp set vrrp-vlan10 priority=110"
```

> [!TIP]
> Ini memberi fungsi setara `standby 10 track 1 decrement 60` di Cisco, dengan fleksibilitas lebih besar (bisa menguji apa pun, bukan hanya interface).

### Load balancing per VLAN

```
# Router A: master untuk VLAN 10, backup untuk VLAN 20
/interface vrrp add name=vrrp-v10 interface=vlan10 vrid=10 priority=110
/interface vrrp add name=vrrp-v20 interface=vlan20 vrid=20 priority=90

# Router B: kebalikannya
/interface vrrp add name=vrrp-v10 interface=vlan10 vrid=10 priority=90
/interface vrrp add name=vrrp-v20 interface=vlan20 vrid=20 priority=110
```

> [!WARNING]
> **Selaraskan dengan root bridge STP**, sama seperti di Cisco — kalau tidak, trafik akan memutar lewat link antar-switch.

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `standby 10 ip 192.168.10.1` | `/interface vrrp add vrid=10` + `/ip address ... interface=vrrp-X` |
| `standby 10 priority 110` | `priority=110` |
| `standby 10 preempt` | `preemption-mode=yes` (default) |
| `standby 10 timers 1 3` | `interval=1s` |
| `standby 10 track 1 decrement 30` | Netwatch dengan skrip ubah priority |
| `standby 10 authentication md5` | `authentication=ah password=X` |
| `show standby brief` | `/interface vrrp print` / `monitor` |
| HSRP / GLBP | ❌ tidak ada — gunakan VRRP |

---

## 11. Ringkasan

- FHRP memecahkan masalah **default gateway tunggal** dengan berbagi **IP virtual + MAC virtual**.
- **HSRP** (Cisco, active/standby, **preempt default OFF**), **VRRP** (RFC 5798, master/backup, **preempt default ON**, protokol IP 112), **GLBP** (Cisco, load balancing bawaan lewat AVG/AVF).
- Pemilihan: **priority tertinggi**, tie-break dengan **IP tertinggi**.
- **Tracking adalah bagian terpenting** — tanpa itu, router dengan uplink mati tetap menjadi active dan menciptakan **black hole**.
- **Object tracking + IP SLA** mendeteksi kegagalan end-to-end, bukan hanya interface down.
- **`preempt delay minimum`** mencegah router yang baru boot mengambil alih sebelum routing konvergen.
- **Load balancing per-VLAN** adalah cara paling umum memakai kedua router; **selaraskan dengan STP root**.
- **Split-brain (kedua Active)** berarti hello tidak sampai — periksa VLAN, ACL multicast, versi, dan autentikasi.
- Alternatif modern: **anycast gateway** (EVPN), MLAG/vPC, stacking, routed access.

---

## 12. Latihan

1. Kenapa host tidak otomatis beralih ke router cadangan tanpa FHRP?
2. Router-A adalah HSRP active dengan priority 110. Uplink WAN-nya mati tetapi interface LAN tetap up. Apa yang terjadi dan bagaimana memperbaikinya?
3. Setelah Router-A pulih dari reboot, Router-B tetap menjadi active. Kenapa, dan bagaimana mengubahnya?
4. Kedua router menunjukkan state `Active` untuk grup yang sama. Apa yang terjadi dan apa yang Anda periksa?
5. Apa perbedaan default preempt antara HSRP dan VRRP?
6. Jelaskan kenapa HSRP active dan STP root harus berada di router yang sama.
7. Kapan Anda memilih VRRP daripada HSRP?

<details>
<summary>Jawaban</summary>

1. Karena **default gateway pada host adalah konfigurasi statis** — satu alamat IP yang dimasukkan manual atau lewat DHCP. Host tidak menjalankan protokol routing, tidak mendengarkan pengumuman router, dan tidak punya mekanisme untuk mengetahui bahwa ada router lain yang sehat di segmen yang sama. Ketika gateway-nya mati, host akan terus mengirim paket ke MAC address gateway itu sampai entri ARP kedaluwarsa — dan bahkan setelah itu, ia tetap mencari alamat IP yang sama. (Pada IPv6, Router Advertisement memberi sebagian kemampuan ini, tetapi konvergensinya bergantung pada timer RA.)

2. **Router-A tetap menjadi HSRP active** karena HSRP hanya memantau interface tempat ia dikonfigurasi (interface LAN/VLAN), bukan uplink. Semua trafik host mengalir ke Router-A, yang tidak punya jalan keluar — **black hole**. Router-B sehat tetapi menganggur.
   **Perbaikan:** konfigurasikan **tracking**:
   ```
   R-A(config-if)# standby 10 track gi0/0 30
   ```
   Ketika gi0/0 down, priority turun dari 110 ke 80 — di bawah Router-B (100) — sehingga Router-B mengambil alih. **Router-B harus punya `preempt`** agar bisa melakukannya. Lebih baik lagi: pakai IP SLA + object tracking agar failover juga terjadi kalau internet tidak terjangkau meski interface tetap up.

3. Karena **`preempt` tidak dikonfigurasi pada Router-A**. HSRP secara default **tidak** mengambil alih peran active dari router yang sedang memegangnya, meskipun priority-nya lebih tinggi — ini disengaja untuk menghindari gangguan berulang.
   **Perbaikan:** `standby 10 preempt` pada Router-A. Tambahkan `preempt delay minimum 60` agar router yang baru boot menunggu routing protocol konvergen sebelum mengambil alih — tanpa delay, Router-A bisa menjadi active sementara ia belum punya rute, menciptakan outage singkat.

4. Ini **split-brain** — kondisi berbahaya. Kedua router mengira dirinya satu-satunya yang aktif karena **hello HSRP tidak saling sampai**. Akibatnya keduanya menjawab ARP untuk IP virtual dengan MAC virtual yang sama, menyebabkan **MAC flapping** di switch dan trafik yang tidak konsisten.
   **Periksa:** (a) apakah VLAN benar-benar melewatkan trafik antara kedua router (`show interfaces trunk`, apakah VLAN diizinkan di semua trunk di jalur); (b) apakah ada ACL yang memblokir multicast 224.0.0.102 (HSRPv2) atau UDP 1985; (c) apakah **versi HSRP sama** di kedua router (v1 dan v2 tidak interoperable); (d) apakah **autentikasi cocok** (key dan mode); (e) apakah nomor grup sama; (f) `debug standby packets` untuk melihat apakah hello benar-benar diterima.

5. **HSRP: preempt NONAKTIF secara default** — router dengan priority lebih tinggi tidak akan mengambil alih dari router yang sedang active; harus dikonfigurasi eksplisit dengan `standby X preempt`.
   **VRRP: preempt AKTIF secara default** — master dengan priority tertinggi selalu mengambil alih begitu ia tersedia; untuk menonaktifkannya perlu `no vrrp X preempt`.
   Perbedaan ini penting saat migrasi antar-protokol atau saat mendiagnosis "kenapa router utama tidak kembali menjadi gateway".

6. Karena kalau tidak selaras, **trafik akan memutar (tromboning)**. Contoh: HSRP active untuk VLAN 10 ada di Router-A, tetapi STP root untuk VLAN 10 ada di Router-B. Access switch mengirim frame ke MAC virtual gateway; STP memblokir uplink langsung ke Router-A dan hanya membuka jalur ke Router-B; frame naik ke Router-B, lalu harus menyeberang link antar-router ke Router-A (yang memegang peran active), baru diproses.
   Akibatnya: bandwidth link antar-switch terbuang, latency bertambah, dan kapasitas efektif berkurang. **Aturan desain: STP root, HSRP/VRRP active, dan jalur routing utama untuk sebuah VLAN harus berada di perangkat yang sama.**

7. Pilih **VRRP** ketika: (a) lingkungan **multi-vendor** — VRRP adalah standar IETF (RFC 5798) yang didukung Cisco, Juniper, Arista, HPE, MikroTik, dan lainnya, sedangkan HSRP hanya Cisco; (b) Anda ingin **preempt aktif secara default** tanpa konfigurasi tambahan; (c) Anda ingin **menghemat alamat IP** dengan memakai alamat fisik router sebagai virtual IP (IP address owner); (d) kebijakan organisasi mengharuskan protokol standar terbuka.
   Pilih **HSRP** ketika lingkungan sepenuhnya Cisco dan Anda menginginkan integrasi erat dengan fitur Cisco lain, atau ketika sudah ada basis konfigurasi HSRP yang besar.

</details>

---

## 13. Sumber

- RFC 5798 — VRRP Version 3 for IPv4 and IPv6
- Cisco, *HSRP Configuration Guide* · *GLBP Configuration Guide*
- Cisco CCNA 200-301 v1.1, topik 3.5 (purpose, functions, and concepts of first hop redundancy protocols)
- Cisco, *Hot Standby Router Protocol Features and Functionality* (Document ID 9234)

---

**Berikutnya:** `07-routing-lanjutan/09-multicast.md`. Pengiriman satu ke banyak.

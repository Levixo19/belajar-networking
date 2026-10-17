# 07.9 Multicast

> **Prasyarat:** `04-network-layer/01`, `07-routing-lanjutan/04`
> **Tujuan:** Anda paham model multicast, bisa mengonfigurasi IGMP snooping dan PIM, serta mendiagnosis masalah distribusi multicast.

---

## 1. Tiga Model Pengiriman

```
UNICAST   : satu pengirim → satu penerima
            100 penerima = 100 salinan dikirim dari server
            ❌ boros bandwidth di sisi pengirim

BROADCAST : satu pengirim → SEMUA di segmen
            ❌ termasuk yang tidak menginginkannya
            ❌ tidak melewati router

MULTICAST : satu pengirim → hanya yang BERLANGGANAN
            ✅ satu aliran, digandakan oleh jaringan hanya di titik percabangan
            ✅ bisa melewati router
```

### Contoh penghematan

```
Video 5 Mbps ke 100 penerima:

Unicast   : server mengirim 100 × 5 = 500 Mbps ❌
Multicast : server mengirim 1 × 5 = 5 Mbps ✅
            router menggandakan hanya di cabang yang perlu
```

### Kapan multicast dipakai

| Aplikasi | Kenapa multicast |
|---|---|
| **IPTV / video broadcast** | Ribuan penonton, konten identik |
| **Market data** (bursa) | Latency kritis, banyak konsumen |
| **Imaging / OS deployment** | Menginstal 200 PC bersamaan |
| **Konferensi video besar** | |
| **Service discovery** (mDNS, SSDP) | Menemukan perangkat di LAN |
| **Protokol routing** (OSPF, EIGRP, RIPv2) | Menjangkau router saja |
| **Cluster heartbeat** | |

> [!WARNING]
> **Multicast kompleks dan sering dihindari** kalau tidak benar-benar diperlukan. Banyak organisasi memilih unicast + CDN daripada mengelola multicast end-to-end.

---

## 2. Alamat Multicast

Rentang: **224.0.0.0-239.255.255.255** (`224.0.0.0/4`, kelas D).

| Blok | Nama | Kegunaan |
|---|---|---|
| **224.0.0.0/24** | **Link-local** | Protokol jaringan; **TTL 1, tidak dirutekan** |
| 224.0.1.0-238.255.255.255 | Globally scoped | Aplikasi internet |
| 232.0.0.0/8 | **SSM** (Source-Specific Multicast) | Satu sumber spesifik |
| 233.0.0.0/8 | GLOP | Berdasarkan nomor AS |
| **239.0.0.0/8** | **Administratively scoped** | **Privat dalam organisasi** (setara RFC 1918) |

### Alamat link-local yang wajib dikenal

```
224.0.0.1    → semua host di segmen ini
224.0.0.2    → semua router di segmen ini
224.0.0.5    → semua router OSPF
224.0.0.6    → OSPF DR/BDR
224.0.0.9    → RIPv2
224.0.0.10   → EIGRP
224.0.0.13   → PIM
224.0.0.18   → VRRP
224.0.0.22   → IGMPv3
224.0.0.102  → HSRPv2 / GLBP
224.0.0.251  → mDNS (Bonjour/Avahi)
224.0.0.252  → LLMNR
```

> [!TIP]
> **Gunakan `239.0.0.0/8` untuk aplikasi internal organisasi Anda** — ini setara RFC 1918 untuk multicast dan tidak akan bocor ke internet.

### Pemetaan ke MAC Multicast

```
IP multicast 224.0.0.0/4 → MAC 01:00:5E:xx:xx:xx

Aturan: 23 BIT TERENDAH dari IP disalin ke MAC

  IP  : 239.192.10.20
      = 11101111.11000000.00001010.00010100
                 ^ bit ke-25 dibuang (hanya 23 bit terendah dipakai)

  MAC : 01:00:5E:40:0A:14
```

> [!WARNING]
> **Ada overlap 32:1.** Karena hanya 23 dari 28 bit alamat multicast yang dipetakan, **32 alamat IP multicast berbeda memetakan ke MAC yang sama**:
```
224.1.1.1, 224.129.1.1, 225.1.1.1, 225.129.1.1, ...
   semuanya → 01:00:5E:01:01:01
```
Konsekuensi: host bisa menerima trafik multicast yang tidak diinginkan di layer 2, dan harus memfilternya di layer 3 (memakai CPU). Pilih alamat grup dengan hati-hati untuk menghindari overlap.

**IPv6:** MAC multicast = `33:33:` + **32 bit terendah** alamat IPv6 → jauh lebih sedikit overlap.

---

## 3. IGMP (Bagaimana Host Berlangganan)

**IGMP** (*Internet Group Management Protocol*) adalah cara host memberi tahu router: *"saya ingin menerima grup X."*

### Versi

| Versi | RFC | Fitur |
|---|---|---|
| **IGMPv1** | 1112 | Join saja; leave lewat timeout (lambat) |
| **IGMPv2** | 2236 | **Leave Group message** (cepat), querier election, group-specific query |
| **IGMPv3** | 3376 | **Source filtering** (INCLUDE/EXCLUDE) → mendukung **SSM** |

### Cara kerja IGMPv2

```
1. Router mengirim GENERAL QUERY ke 224.0.0.1 setiap 60 detik
   "Ada yang masih mau grup apa saja?"

2. Host yang berminat mengirim MEMBERSHIP REPORT
   "Saya mau grup 239.1.1.1"

   ⚠️ Report Suppression: kalau host lain sudah mengirim report untuk grup
      yang sama, host ini DIAM (menghemat bandwidth)

3. Host yang berhenti mengirim LEAVE GROUP ke 224.0.0.2

4. Router mengirim GROUP-SPECIFIC QUERY
   "Masih ada yang mau 239.1.1.1?"
   → kalau tidak ada jawaban, hentikan aliran ke segmen itu
```

**Querier election:** kalau ada beberapa router di segmen, yang beralamat IP **terendah** menjadi querier.

### IGMPv3 dan SSM

IGMPv3 memungkinkan host menyebut **sumber mana** yang diinginkan:
```
INCLUDE (S,G) → "saya mau grup G, TAPI hanya dari sumber S"
EXCLUDE (S,G) → "saya mau grup G, KECUALI dari sumber S"
```

Ini memungkinkan **SSM** (*Source-Specific Multicast*) di `232.0.0.0/8` — model yang jauh lebih sederhana karena tidak butuh RP (lihat §5).

---

## 4. IGMP Snooping: Wajib di Switch

### Masalah tanpa snooping

Switch adalah perangkat layer 2 dan **tidak memahami IGMP**. Bagi switch, frame dengan MAC multicast bukan unicast yang dikenal, sehingga ia **membanjirinya ke semua port** dalam VLAN — persis seperti broadcast.

```
Tanpa IGMP snooping:
  Aliran video 5 Mbps → dibanjiri ke SEMUA 48 port
  → 47 host menerima data yang tidak mereka minta
  → CPU host terbuang memproses lalu membuangnya
  → link uplink jenuh
  → dalam kasus IPTV, seluruh switch bisa lumpuh
```

### Solusi: IGMP Snooping

Switch "menguping" pesan IGMP yang lewat dan membangun tabel: **port mana yang meminta grup mana**.

```
SW1(config)# ip igmp snooping                          ← global (biasanya default ON)
SW1(config)# ip igmp snooping vlan 10
SW1(config)# ip igmp snooping vlan 10 immediate-leave  ← untuk satu host per port

# Querier di switch (kalau tidak ada router multicast di VLAN)
SW1(config)# ip igmp snooping querier
SW1(config)# ip igmp snooping vlan 10 querier address 192.168.10.1

SW1# show ip igmp snooping
SW1# show ip igmp snooping groups
SW1# show ip igmp snooping mrouter
```

> [!WARNING]
> **IGMP snooping membutuhkan QUERIER.** Tanpa ada yang mengirim query secara berkala, snooping table akan kedaluwarsa dan switch kembali membanjiri. Kalau tidak ada router multicast di VLAN, **aktifkan snooping querier di switch**.

> [!TIP]
> **Gejala klasik "multicast bekerja beberapa menit lalu berhenti"**: tidak ada querier. Tabel snooping kedaluwarsa, dan tanpa query berkala tidak ada yang memperbaruinya.

---

## 5. PIM (Routing Multicast)

**PIM** (*Protocol Independent Multicast*) membangun **distribution tree** untuk meneruskan multicast antar-subnet. Disebut "protocol independent" karena memakai routing table unicast yang sudah ada.

### RPF (Reverse Path Forwarding)

Konsep kunci untuk mencegah loop multicast.

```
Ketika paket multicast tiba, router bertanya:
  "Apakah paket ini tiba di interface yang akan saya pakai
   untuk MENGIRIM UNICAST ke alamat SUMBER-nya?"

  YA  → RPF check LULUS → teruskan ke semua interface downstream
  TIDAK → RPF check GAGAL → BUANG paket
```

Ini memastikan paket hanya mengalir menjauh dari sumber, tidak pernah berputar.

```
R1# show ip rpf 192.168.1.100
RPF information for ? (192.168.1.100)
  RPF interface: GigabitEthernet0/1
  RPF neighbor: ? (10.0.0.2)
  RPF route/mask: 192.168.1.0/24
  RPF type: unicast (ospf 1)
```

> [!WARNING]
> **RPF failure adalah penyebab masalah multicast nomor satu.** Sering terjadi pada **routing asimetris** — jalur unicast ke sumber berbeda dari jalur multicast yang sebenarnya.

### Mode PIM

**PIM Dense Mode (PIM-DM)** — "flood and prune"
```
1. Banjiri multicast ke SEMUA interface
2. Router yang tidak punya penerima mengirim PRUNE
3. Ulangi flooding setiap 3 menit

❌ Boros bandwidth
❌ Tidak scalable
→ Hanya untuk jaringan kecil dengan penerima yang sangat padat
→ Praktis TIDAK DIPAKAI lagi
```

**PIM Sparse Mode (PIM-SM)** — "explicit join" (standar)
```
1. Tidak ada yang dikirim sampai ada yang MEMINTA
2. Penerima mengirim JOIN ke arah RENDEZVOUS POINT (RP)
3. Terbentuk SHARED TREE (RPT) berakar di RP
4. Setelah aliran mengalir, router terakhir bisa beralih ke
   SHORTEST PATH TREE (SPT) langsung ke sumber

✅ Efisien
✅ Scalable
→ STANDAR untuk hampir semua deployment
```

**PIM-SSM** — Source-Specific
```
Penerima menyebut (Sumber, Grup) secara eksplisit lewat IGMPv3
→ TIDAK BUTUH RP sama sekali
→ Langsung membangun SPT
→ Paling sederhana dan paling aman
→ Ideal untuk IPTV dan aplikasi satu-sumber
```

**Bidirectional PIM (Bidir-PIM)** — untuk aplikasi many-to-many (mis. konferensi), semua trafik lewat shared tree.

### Rendezvous Point (RP)

Titik pertemuan antara sumber dan penerima pada PIM-SM.

```
Sumber → mendaftar ke RP
Penerima → mengirim join ke RP
RP menghubungkan keduanya
```

**Cara menentukan RP:**
| Metode | Cara | Catatan |
|---|---|---|
| **Static RP** | Dikonfigurasi manual di setiap router | Sederhana, tetapi harus konsisten di semua router |
| **Auto-RP** | Cisco proprietary; RP mengumumkan dirinya | Memakai 224.0.1.39/40 |
| **BSR** (Bootstrap Router) | Standar PIMv2 | Multi-vendor |
| **Anycast RP** | Beberapa RP dengan IP sama + MSDP | **Redundansi terbaik** |

```
# Static RP (paling umum di jaringan enterprise)
R1(config)# ip multicast-routing
R1(config)# ip pim rp-address 10.255.255.1
R1(config)# interface gi0/1
R1(config-if)# ip pim sparse-mode

# Di RP itu sendiri
RP(config)# interface loopback0
RP(config-if)# ip address 10.255.255.1 255.255.255.255
RP(config-if)# ip pim sparse-mode
```

### Konfigurasi lengkap PIM-SM

```
# Semua router multicast
R1(config)# ip multicast-routing

# Semua interface yang membawa multicast (termasuk ke host!)
R1(config)# interface range gi0/0-2
R1(config-if-range)# ip pim sparse-mode

# RP
R1(config)# ip pim rp-address 10.255.255.1

# IGMP versi (kalau perlu SSM)
R1(config-if)# ip igmp version 3

# SSM
R1(config)# ip pim ssm default        ← mengaktifkan SSM untuk 232.0.0.0/8
```

> [!WARNING]
> **`ip pim sparse-mode` harus ada di SETIAP interface** yang membawa multicast — termasuk interface yang menghadap host. Interface tanpa PIM tidak akan meneruskan multicast.

---

## 6. Verifikasi dan Troubleshooting

```
R1# show ip mroute
IP Multicast Routing Table
Flags: D - Dense, S - Sparse, B - Bidir Group, s - SSM Group,
       C - Connected, L - Local, P - Pruned, R - RP-bit set,
       T - SPT-bit set, J - Join SPT

(*, 239.1.1.1), 00:12:34/00:02:59, RP 10.255.255.1, flags: SC
  Incoming interface: GigabitEthernet0/0, RPF nbr 10.0.0.1
  Outgoing interface list:
    GigabitEthernet0/1, Forward/Sparse, 00:12:34/00:02:59

(192.168.1.100, 239.1.1.1), 00:05:12/00:02:45, flags: T
  Incoming interface: GigabitEthernet0/0, RPF nbr 10.0.0.1
  Outgoing interface list:
    GigabitEthernet0/1, Forward/Sparse, 00:05:12/00:02:59
```

**Membaca entri:**
- **`(*, G)`** — shared tree; "sumber mana pun" untuk grup G
- **`(S, G)`** — source tree; sumber spesifik ke grup G
- **Incoming interface** — arah RPF (menuju sumber/RP)
- **Outgoing interface list (OIL)** — ke mana diteruskan. **OIL kosong = tidak ada penerima**

### Perintah lain

```
R1# show ip pim neighbor
R1# show ip pim rp mapping
R1# show ip pim interface
R1# show ip igmp groups
R1# show ip igmp interface
R1# show ip rpf <alamat-sumber>
R1# show ip mroute count
R1# mtrace <sumber> <penerima> <grup>
R1# debug ip pim
R1# debug ip igmp
```

### Alur troubleshooting

```
1. Apakah host benar-benar join?
   SW1# show ip igmp snooping groups
   R1# show ip igmp groups
   → tidak ada? masalah di aplikasi/host atau IGMP tidak sampai

2. Apakah router tahu ada penerima?
   R1# show ip mroute
   → OIL kosong = tidak ada penerima yang terdaftar

3. Apakah RPF lulus?
   R1# show ip rpf <sumber>
   → RPF gagal = routing unicast asimetris atau tidak ada rute ke sumber

4. Apakah RP diketahui dan terjangkau?
   R1# show ip pim rp mapping
   R1# ping <ip-rp>
   → RP tidak konsisten antar-router = masalah klasik

5. Apakah PIM aktif di SEMUA interface di jalur?
   R1# show ip pim interface
   → satu interface tanpa PIM memutus seluruh jalur

6. Apakah TTL cukup?
   → aplikasi mengirim dengan TTL 1 → tidak akan melewati router
```

### Masalah umum

| Gejala | Penyebab |
|---|---|
| Multicast membanjiri seluruh VLAN | **IGMP snooping mati** atau **tidak ada querier** |
| Bekerja beberapa menit lalu berhenti | **Tidak ada querier** — tabel snooping kedaluwarsa |
| Tidak melewati router | PIM tidak aktif di interface; TTL=1; `ip multicast-routing` belum diaktifkan |
| RPF failure | Routing unicast asimetris; tidak ada rute ke sumber |
| Bekerja di satu VLAN, tidak di VLAN lain | Interface VLAN itu tidak punya `ip pim sparse-mode` |
| Sebagian penerima dapat, sebagian tidak | IGMP snooping salah konfigurasi; report suppression |
| RP tidak konsisten | Static RP berbeda antar-router; Auto-RP/BSR tidak menyebar |

---

## 7. Praktik di Linux

```bash
# Kirim multicast
$ echo "test" | socat - UDP4-DATAGRAM:239.1.1.1:5000,ip-multicast-ttl=5

# Terima multicast
$ socat UDP4-RECV:5000,ip-add-membership=239.1.1.1:eth0 -

# Lihat keanggotaan grup
$ ip maddr show
$ netstat -gn
$ cat /proc/net/igmp

# Rute multicast (butuh daemon seperti smcroute/pimd)
$ ip mroute show

# Capture
$ sudo tcpdump -ni eth0 'net 224.0.0.0/4'
$ sudo tcpdump -ni eth0 igmp

# Uji dengan iperf
$ iperf -s -u -B 239.1.1.1 -i 1          # penerima
$ iperf -c 239.1.1.1 -u -T 5 -t 30 -i 1  # pengirim (T = TTL)
```

---

## 8. Ringkasan

- Multicast mengirim **satu aliran** yang digandakan jaringan hanya di titik percabangan — jauh lebih efisien daripada unicast untuk banyak penerima.
- Rentang **224.0.0.0/4**; **224.0.0.0/24 link-local (TTL 1, tidak dirutekan)**; **239.0.0.0/8 untuk internal organisasi**.
- Pemetaan IP→MAC memakai **23 bit terendah** → **overlap 32:1** pada IPv4.
- **IGMP** = host berlangganan. v2 punya Leave message; **v3 mendukung source filtering (SSM)**.
- **IGMP snooping wajib di switch** — tanpa itu multicast dibanjiri seperti broadcast. **Butuh querier**, kalau tidak tabel kedaluwarsa.
- **PIM** membangun distribution tree memakai routing unicast. **RPF check** mencegah loop.
- **PIM-SM (sparse)** adalah standar; dense mode praktis usang; **SSM paling sederhana** (tanpa RP).
- **RP** = titik pertemuan pada PIM-SM. Static RP paling umum; **Anycast RP** untuk redundansi.
- `ip multicast-routing` global + **`ip pim sparse-mode` di SETIAP interface** di jalur.
- `(*, G)` = shared tree; `(S, G)` = source tree; **OIL kosong = tidak ada penerima**.
- **RPF failure dan tidak adanya querier** adalah dua penyebab masalah multicast paling umum.

---

## 9. Latihan

1. Hitung penghematan bandwidth mengirim aliran 8 Mbps ke 250 penerima dengan multicast dibanding unicast.
2. Kenapa alamat 224.0.0.5 tidak pernah melewati router?
3. Multicast bekerja selama 5 menit setelah dinyalakan, lalu berhenti. Apa dugaan utama Anda?
4. Jelaskan RPF check dan kenapa routing asimetris merusaknya.
5. Apa keunggulan SSM dibanding PIM-SM biasa?
6. Switch membanjiri trafik multicast ke semua port meski IGMP snooping aktif. Apa yang Anda periksa?
7. `show ip mroute` menunjukkan entri `(*, 239.1.1.1)` dengan OIL kosong. Apa artinya?

<details>
<summary>Jawaban</summary>

1. **Unicast:** server harus mengirim 250 salinan → 250 × 8 Mbps = **2.000 Mbps (2 Gbps)** dari server. **Multicast:** server mengirim **satu** aliran 8 Mbps; jaringan menggandakannya hanya di titik percabangan, sehingga setiap link membawa maksimal 8 Mbps per grup. **Penghematan di sisi server: 1.992 Mbps (99,6%).** Selain bandwidth, beban CPU server juga turun drastis karena hanya satu socket yang dikelola.

2. Karena `224.0.0.0/24` adalah blok **link-local**, dan paket ke alamat dalam blok ini **wajib dikirim dengan TTL = 1** menurut spesifikasi. Router mengurangi TTL menjadi 0 dan membuang paket. Ini disengaja: alamat-alamat itu (OSPF 224.0.0.5, EIGRP 224.0.0.10, VRRP 224.0.0.18, dsb.) hanya bermakna dalam satu segmen — protokol tetangga tidak boleh bocor ke jaringan lain.

3. **Tidak ada IGMP querier.** IGMP snooping membangun tabel berdasarkan membership report yang dikirim host **sebagai jawaban atas query**. Kalau tidak ada perangkat yang mengirim general query secara berkala, entri di tabel snooping kedaluwarsa (biasanya ~260 detik). Setelah itu switch tidak lagi tahu port mana yang berlangganan.
   Perilaku setelahnya bergantung implementasi: sebagian switch kembali membanjiri (multicast tetap sampai tetapi boros), sebagian **berhenti meneruskan sama sekali** (multicast mati) — inilah yang terjadi di sini.
   **Perbaikan:** aktifkan querier — di router multicast (`ip pim sparse-mode` pada SVI) atau di switch (`ip igmp snooping querier`).

4. **RPF (Reverse Path Forwarding) check**: ketika paket multicast tiba, router memeriksa apakah paket itu masuk lewat interface yang **akan ia gunakan untuk mengirim unicast ke alamat sumber** paket tersebut. Kalau ya, paket diteruskan; kalau tidak, **dibuang**. Ini menjamin paket hanya mengalir menjauh dari sumber, sehingga tidak mungkin terbentuk loop multicast.
   **Routing asimetris merusaknya** karena RPF bergantung sepenuhnya pada **routing table unicast**. Kalau jalur unicast ke sumber melewati interface A, tetapi multicast sebenarnya tiba lewat interface B (misalnya karena kebijakan routing, PBR, atau topologi dengan biaya tidak simetris), RPF check gagal dan paket dibuang — meski jalurnya sah. Perbaikan: samakan jalur unicast dan multicast, atau gunakan **static mroute** (`ip mroute`) untuk memberi tahu RPF jalur yang benar.

5. **SSM (Source-Specific Multicast)** memungkinkan penerima menyebut **(Sumber, Grup)** secara eksplisit lewat IGMPv3, bukan sekadar "grup G dari sumber mana pun".
   Keunggulannya: (a) **tidak butuh RP sama sekali** — menghilangkan seluruh kompleksitas Auto-RP/BSR/Anycast RP dan single point of failure-nya; (b) **langsung membangun SPT** (shortest path tree) tanpa melewati shared tree, sehingga jalur optimal sejak awal; (c) **jauh lebih aman** — sumber jahat tidak bisa menyuntikkan trafik ke grup yang sudah dipakai, karena penerima hanya menerima dari sumber yang disebutkannya; (d) konfigurasi dan troubleshooting jauh lebih sederhana.
   Cocok untuk aplikasi satu-sumber seperti IPTV, market data, dan streaming — yang mencakup mayoritas kasus multicast nyata.

6. (a) Apakah snooping **aktif untuk VLAN itu** secara spesifik — `show ip igmp snooping vlan 10`; (b) apakah ada **querier** — `show ip igmp snooping querier`; tanpa querier tabel kosong dan switch membanjiri; (c) apakah trafik itu memakai alamat **link-local `224.0.0.0/24`** — trafik ke blok ini **selalu dibanjiri** secara sengaja dan tidak di-snoop; (d) apakah ada port yang terdeteksi sebagai **mrouter port** yang menerima semua grup — `show ip igmp snooping mrouter`; (e) apakah versi IGMP host dan switch cocok (host IGMPv3 dengan switch yang hanya mendukung snooping v2); (f) apakah ada fitur seperti **flood unknown multicast** yang aktif pada platform tersebut.

7. **`(*, G)` dengan OIL (Outgoing Interface List) kosong berarti router mengetahui grup itu tetapi TIDAK ADA PENERIMA yang terdaftar di bawahnya** — sehingga tidak ada trafik yang diteruskan ke mana pun.
   Penyebab yang perlu diperiksa: (a) tidak ada host yang benar-benar melakukan IGMP join — cek `show ip igmp groups`; (b) IGMP tidak sampai ke router (VLAN salah, `ip pim sparse-mode` tidak ada di SVI, IGMP snooping menahan report); (c) host mengirim join tetapi aplikasinya sudah berhenti; (d) join terjadi di router lain di jalur, bukan di router ini. Kalau memang tidak ada penerima, ini adalah kondisi **normal** — multicast bekerja sesuai desain dengan tidak mengirimkan apa pun.

</details>

---

## 10. Sumber

- RFC 1112 — Host Extensions for IP Multicasting
- RFC 2236 — IGMPv2 · RFC 3376 — IGMPv3
- RFC 7761 — PIM Sparse Mode (PIM-SM)
- RFC 4607 — Source-Specific Multicast
- RFC 5771 — IANA Guidelines for IPv4 Multicast Address Assignments
- Cisco, *IP Multicast Technology Overview*

---

**Berikutnya:** `07-routing-lanjutan/10-isis`. IS-IS, IGP pilihan backbone operator dan fondasi Segment Routing.

# 03.5 EtherChannel / Link Aggregation

> **Prasyarat:** `03-data-link/04`
> **Tujuan:** Anda bisa mengonfigurasi EtherChannel dengan LACP, memahami mengapa satu aliran tidak bisa melebihi satu link, dan mendiagnosis kegagalan bundling.

---

## 1. Masalah yang Dipecahkan

Anda punya dua switch dan ingin uplink 2 Gbps. Anda pasang dua kabel gigabit.

**Tanpa EtherChannel:**
```
   [SW1]═══kabel 1═══[SW2]
      ╚═══kabel 2═══╝

STP mendeteksi loop → memblokir salah satu kabel
Hasil: bandwidth 1 Gbps, kabel kedua menganggur.
```

**Dengan EtherChannel:**
```
   [SW1]═══Port-channel 1═══[SW2]
         (2 kabel = 1 link logis)

STP melihat SATU link → tidak ada loop → tidak ada yang diblokir
Hasil: bandwidth agregat 2 Gbps, kedua kabel terpakai.
```

### Manfaat

1. **Bandwidth agregat**: sampai 8 link aktif (16 dikonfigurasi pada beberapa platform).
2. **Redundansi otomatis**: satu kabel putus, sisanya terus bekerja tanpa konvergensi STP.
3. **STP melihat satu link logis**: tidak ada blocking, tidak ada waktu konvergensi saat satu anggota gagal.
4. **Failover sub-detik**: jauh lebih cepat daripada STP.

Nama lain untuk hal yang sama:
- **EtherChannel** (Cisco)
- **Port Channel** (Cisco, nama interface logisnya)
- **LAG** (*Link Aggregation Group*, istilah umum)
- **Bonding / Teaming** (Linux/Windows)
- **Trunk** (HP/Aruba; hati-hati, artinya berbeda dengan trunk VLAN Cisco)

---

## 2. Batasan Penting: Satu Aliran = Satu Link

Konsep ini paling sering disalahpahami.

> **EtherChannel tidak membagi satu aliran data ke banyak link.** Ia mendistribusikan **aliran yang berbeda** ke link yang berbeda.

```
EtherChannel 4 × 1 Gbps = 4 Gbps agregat

Satu transfer file dari Server A ke Server B:
  → maksimum tetap 1 Gbps (satu aliran = satu link)

Empat transfer dari server berbeda ke tujuan berbeda:
  → bisa mencapai 4 Gbps total (jika hash mendistribusikan dengan baik)
```

**Kenapa begitu?** Kalau satu aliran TCP dipecah ke beberapa link, paket bisa tiba tidak berurutan (karena link punya latency sedikit berbeda). TCP akan menafsirkan out-of-order sebagai kehilangan paket → fast retransmit → throughput justru turun drastis. Jadi EtherChannel sengaja menjaga setiap aliran tetap di satu link.

> [!WARNING]
> **Konsekuensi praktis:** kalau Anda perlu satu aliran 10 Gbps, EtherChannel 10 × 1 Gbps tidak akan membantu. Anda butuh link fisik 10 Gbps.

---

## 3. Load Balancing Hash

Switch memutuskan link mana yang dipakai dengan menghitung **hash** dari field tertentu di frame.

```
hash(field yang dipilih) mod jumlah_link_aktif = nomor link
```

### Opsi hash pada Cisco

| Metode | Field yang di-hash | Cocok untuk |
|---|---|---|
| `src-mac` | MAC sumber | Banyak klien → satu server |
| `dst-mac` | MAC tujuan | Satu server → banyak klien |
| `src-dst-mac` | Keduanya | Umum di L2 |
| `src-ip` | IP sumber | Trafik melewati router |
| `dst-ip` | IP tujuan | |
| **`src-dst-ip`** | Keduanya | **Default & terbaik untuk banyak kasus** |
| `src-port` / `dst-port` / `src-dst-port` | Port L4 | Distribusi terbaik (jika didukung) |
| `src-dst-mixed-ip-port` | IP + port | Distribusi paling merata |

```
SW1(config)# port-channel load-balance src-dst-ip
SW1# show etherchannel load-balance
```

### Masalah distribusi tidak merata

> [!WARNING]
> **Skenario klasik:** EtherChannel antara switch dan router, hash memakai `src-dst-mac`.

```
Semua trafik dari LAN ke internet:
  MAC sumber = berbeda-beda (setiap PC)
  MAC tujuan = SELALU SAMA (MAC router)

Kalau hash memakai dst-mac saja → semua trafik masuk ke SATU link!
```

Solusi: gunakan hash berbasis IP atau IP+port, yang jauh lebih bervariasi.

> [!WARNING]
> **Skenario kedua:** hanya ada beberapa aliran besar (mis. dua server melakukan replikasi). Berapa pun metode hash-nya, dua aliran hanya bisa menempati dua link. Distribusi merata butuh banyak aliran yang beragam.

> [!WARNING]
> **Jumlah link idealnya pangkat 2** (2, 4, 8). Dengan 3 link, hash mod 3 mendistribusikan tidak merata pada banyak implementasi (beberapa link mendapat porsi lebih besar). Ini keterbatasan hardware pada sebagian platform.

### Verifikasi distribusi
```
SW1# show interfaces port-channel 1
SW1# show interfaces gi0/1 | include rate
SW1# show interfaces gi0/2 | include rate
   ← bandingkan rate tiap anggota; kalau timpang, ubah metode hash
```

---

## 4. Protokol Negosiasi

Ada tiga cara membentuk EtherChannel:

### LACP (IEEE 802.3ad / 802.1AX (standar, direkomendasikan))

Protokol terbuka; bekerja antar-vendor.

| Mode | Perilaku |
|---|---|
| **active** | Aktif mengirim LACP PDU (mengajak) |
| **passive** | Hanya merespons (menunggu diajak) |

| | active | passive |
|---|---|---|
| **active** | Terbentuk | Terbentuk |
| **passive** | Terbentuk | **Tidak terbentuk** |

> [!WARNING]
> Dua sisi `passive` tidak akan membentuk channel, sama seperti dua `dynamic auto` pada DTP.

```
SW1(config)# interface range gi0/1-2
SW1(config-if-range)# channel-group 1 mode active
SW1(config-if-range)# exit
SW1(config)# interface port-channel 1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk allowed vlan 10,20,30
```

Fitur tambahan LACP:
- **LACP fast rate**: mengirim PDU setiap 1 detik (bukan 30) → deteksi kegagalan lebih cepat.
  ```
  SW1(config-if)# lacp rate fast
  ```
- **Max bundle**: membatasi jumlah link aktif; sisanya menjadi hot standby.
  ```
  SW1(config-if)# lacp max-bundle 4
  ```
- **System priority & port priority**: menentukan link mana yang aktif jika melebihi max-bundle.

### PAgP (proprietary Cisco)

| Mode | Perilaku |
|---|---|
| **desirable** | Aktif mengajak |
| **auto** | Hanya merespons |

Sama seperti LACP: `auto` + `auto` = tidak terbentuk.

```
SW1(config-if-range)# channel-group 1 mode desirable
```

> [!TIP]
> **Gunakan LACP, bukan PAgP**, kecuali ada alasan khusus. LACP standar dan bekerja dengan semua vendor.

### Static / "on" (tanpa negosiasi)

```
SW1(config-if-range)# channel-group 1 mode on
```

> [!WARNING]
> **Berisiko.** Tidak ada verifikasi apa pun. Kalau satu sisi `on` dan sisi lain tidak dikonfigurasi (atau salah), tidak ada mekanisme yang mencegahnya → loop. Hanya gunakan jika perangkat lawan tidak mendukung LACP.

### Matriks kompatibilitas

| | on | active | passive | desirable | auto |
|---|---|---|---|---|---|
| **on** | Ya | Tidak | Tidak | Tidak | Tidak |
| **active** | Tidak | Ya | Ya | Tidak | Tidak |
| **passive** | Tidak | Ya | Tidak | Tidak | Tidak |
| **desirable** | Tidak | Tidak | Tidak | Ya | Ya |
| **auto** | Tidak | Tidak | Tidak | Ya | Tidak |

**LACP dan PAgP tidak bisa dicampur.**

---

## 5. Syarat Konsistensi

Semua port anggota harus identik dalam hal:

```
✓ Kecepatan (semua 1 G atau semua 10 G — tidak boleh campur)
✓ Duplex (semua full)
✓ Mode switchport (semua access ATAU semua trunk)
✓ VLAN access yang sama (kalau access)
✓ Allowed VLAN & native VLAN yang sama (kalau trunk)
✓ Trunk encapsulation yang sama
✓ Tipe media boleh berbeda pada beberapa platform, tetapi hindari
✓ Konfigurasi STP yang sama (cost, priority)
```

> [!WARNING]
> Kalau ada perbedaan, port akan **suspended** atau channel tidak terbentuk.

### Praktik konfigurasi yang benar

```
1. SHUTDOWN semua port anggota dulu (mencegah loop selama konfigurasi)
2. Konfigurasikan channel-group pada port fisik
3. Konfigurasikan Port-channel interface (VLAN, trunk, dll)
4. NO SHUTDOWN port anggota
```

```
SW1(config)# interface range gi0/1-2
SW1(config-if-range)# shutdown
SW1(config-if-range)# channel-group 1 mode active
SW1(config-if-range)# exit

SW1(config)# interface port-channel 1
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk allowed vlan 10,20,30
SW1(config-if)# switchport trunk native vlan 999
SW1(config-if)# exit

SW1(config)# interface range gi0/1-2
SW1(config-if-range)# no shutdown
```

> [!TIP]
> **Konfigurasikan Port-channel interface, bukan port fisik**, untuk pengaturan L2/L3. Perubahan pada Port-channel otomatis diterapkan ke semua anggota. Mengubah port fisik satu per satu justru menyebabkan inkonsistensi.

---

## 6. Layer 2 vs Layer 3 EtherChannel

### L2 EtherChannel (paling umum)
```
SW1(config)# interface port-channel 1
SW1(config-if)# switchport mode trunk
```

### L3 EtherChannel (routed)
```
SW1(config)# interface range gi0/1-2
SW1(config-if-range)# no switchport          ← ubah jadi routed DULU
SW1(config-if-range)# channel-group 1 mode active
SW1(config-if-range)# exit

SW1(config)# interface port-channel 1
SW1(config-if)# no switchport
SW1(config-if)# ip address 10.0.0.1 255.255.255.252
```

> [!WARNING]
> Urutan penting: `no switchport` harus dilakukan pada port fisik sebelum memasukkannya ke channel-group, atau channel akan terbentuk sebagai L2.

L3 EtherChannel dipakai untuk link antar-switch core/distribution dalam desain routed.

---

## 7. Verifikasi

```
SW1# show etherchannel summary

Flags:  D - down        P - bundled in port-channel
        I - stand-alone s - suspended
        H - Hot-standby (LACP only)
        R - Layer3      S - Layer2
        U - in use      f - failed to allocate aggregator
        M - not in use, minimum links not met
        u - unsuitable for bundling
        w - waiting to be aggregated
        d - default port

Number of channel-groups in use: 1
Number of aggregators:           1

Group  Port-channel  Protocol    Ports
------+-------------+-----------+-----------------------------------------
1      Po1(SU)         LACP      Gi0/1(P)  Gi0/2(P)
```

**Membaca flag** adalah keterampilan diagnostik utama:
```
Po1(SU)  → S = Layer 2, U = in Use  ✅ SEHAT
Po1(SD)  → D = Down                 ❌ channel mati
Gi0/1(P) → P = bundled (aktif)      ✅
Gi0/1(I) → I = stand-alone          ❌ tidak masuk bundle
Gi0/1(s) → s = suspended            ❌ konfigurasi tidak cocok
Gi0/1(H) → H = hot standby          (melebihi max-bundle, normal)
Gi0/1(D) → D = down                 ❌ port fisik mati
```

### Perintah lain
```
SW1# show etherchannel 1 detail
SW1# show etherchannel 1 port-channel
SW1# show etherchannel load-balance
SW1# show lacp neighbor
SW1# show lacp 1 internal
SW1# show interfaces port-channel 1
SW1# show interfaces port-channel 1 etherchannel
```

---

## 8. Troubleshooting

| Gejala | Penyebab | Perbaikan |
|---|---|---|
| Port `(I)` stand-alone | Sisi lain tidak dikonfigurasi, atau mode tidak kompatibel (passive+passive) | Periksa mode di kedua sisi |
| Port `(s)` suspended | Konfigurasi tidak konsisten (VLAN, speed, duplex, trunk) | Samakan konfigurasi |
| Channel `(SD)` down | Semua anggota down | Periksa layer 1 |
| Channel terbentuk tapi trafik timpang | Metode hash tidak cocok dengan pola trafik | Ubah `port-channel load-balance` |
| Loop terjadi setelah konfigurasi | Mode `on` di satu sisi, sisi lain tidak siap | Gunakan LACP, bukan `on` |
| `%EC-5-CANNOT_BUNDLE2` di log | Ketidakcocokan konfigurasi spesifik | Baca pesan log, yang biasanya menyebut field yang berbeda |

**Pesan log yang informatif:**
```
%EC-5-CANNOT_BUNDLE2: Gi0/2 is not compatible with Gi0/1 and will be suspended
(vlan mask is different)
```
Pesan ini langsung memberi tahu penyebabnya.

### Misconfig Guard

Cisco punya perlindungan terhadap kesalahan konfigurasi EtherChannel yang menyebabkan loop:
```
SW1(config)# spanning-tree etherchannel guard misconfig
```
Jika switch mendeteksi BPDU yang tidak konsisten dari anggota channel (tanda konfigurasi salah), port akan di-err-disable sebelum loop terjadi.

---

## 9. MLAG / vPC / VSS / Stacking: Agregasi Lintas Chassis

EtherChannel biasa hanya bisa antara dua perangkat. Bagaimana kalau ingin redundansi terhadap kegagalan switch?

```
Masalah:
   [Server] ── 2 kabel ── [SW1]  ← kalau SW1 mati, server terputus

Yang diinginkan:
              ┌── [SW1] ──┐
   [Server] ──┤           ├── (satu EtherChannel!)
              └── [SW2] ──┘
   → tapi EtherChannel normal tidak bisa ke dua switch berbeda
```

### Teknologi yang memungkinkannya

| Teknologi | Vendor | Cara kerja |
|---|---|---|
| **Stacking** (StackWise) | Cisco (Catalyst) | Beberapa switch fisik menjadi **satu switch logis** dengan satu control plane |
| **VSS** (Virtual Switching System) | Cisco (Catalyst 6500/9600) | Dua chassis menjadi satu logis |
| **vPC** (Virtual Port Channel) | Cisco (Nexus) | Dua switch tetap terpisah (control plane sendiri) tetapi tampil sebagai satu bagi perangkat di bawahnya |
| **MLAG / MC-LAG** | Arista, Juniper, dll | Konsep sama dengan vPC |
| **StackWise Virtual** | Cisco (Catalyst 9000) | Penerus VSS |

### Perbandingan

| | Stacking | vPC / MLAG |
|---|---|---|
| Control plane | **Satu** (digabung) | **Dua** (terpisah) |
| Upgrade software | Semua sekaligus (kecuali ISSU) | Bisa bergantian |
| Blast radius | Bug control plane memengaruhi semua | Lebih terisolasi |
| Kompleksitas konfigurasi | Rendah | Lebih tinggi (peer-link, keepalive, konsistensi) |
| Untuk | Access layer | Data center, distribution/core |

**Komponen vPC:**
```
peer-link       : link antar-kedua switch untuk sinkronisasi & trafik orphan
peer-keepalive  : jalur terpisah (biasanya lewat mgmt) untuk mendeteksi apakah peer hidup
                  → mencegah split-brain
vPC domain      : identitas pasangan
consistency check: memastikan konfigurasi kedua switch cocok
```

> [!WARNING]
> **Split-brain** terjadi jika peer-link putus tetapi kedua switch masih hidup. Keduanya bisa mengira yang lain mati dan mengambil alih peran yang sama → duplikasi trafik dan MAC flapping. Peer-keepalive di jalur terpisah ada untuk mencegah ini.

---

## 10. Bonding di Linux

Setara EtherChannel untuk server.

```bash
# Mode bonding
# 0 = balance-rr      (round robin — bisa out-of-order, hati-hati)
# 1 = active-backup   (hanya satu aktif, tidak butuh dukungan switch)
# 2 = balance-xor     (hash, butuh EtherChannel statis di switch)
# 4 = 802.3ad (LACP)  ← paling umum untuk server enterprise
# 5 = balance-tlb     (adaptive transmit load balancing)
# 6 = balance-alb     (adaptive load balancing, tx+rx)

# Contoh dengan nmcli (LACP)
$ sudo nmcli con add type bond con-name bond0 ifname bond0 \
    bond.options "mode=802.3ad,miimon=100,lacp_rate=fast,xmit_hash_policy=layer3+4"
$ sudo nmcli con add type ethernet con-name bond0-p1 ifname eth1 master bond0
$ sudo nmcli con add type ethernet con-name bond0-p2 ifname eth2 master bond0
$ sudo nmcli con up bond0

# Verifikasi
$ cat /proc/net/bonding/bond0
$ ip -d link show bond0
```

> [!TIP]
> **Mode 1 (active-backup) tidak memerlukan konfigurasi apa pun di switch.** Mode ini berguna kalau Anda tidak mengendalikan switch, atau kalau kedua NIC terhubung ke switch berbeda tanpa MLAG. Mode 4 (LACP) memberi bandwidth agregat tetapi harus dipasangkan dengan EtherChannel di switch (atau MLAG jika ke dua switch berbeda).

> [!WARNING]
> Mode 0 (balance-rr) memecah satu aliran ke banyak link → paket out-of-order → kinerja TCP bisa lebih buruk daripada satu link. Hindari kecuali untuk kasus khusus.

---

## MikroTik RouterOS

Link aggregation di RouterOS disebut **bonding**.

```
# Buat bonding dengan LACP (802.3ad)
/interface bonding add name=bond-uplink slaves=ether1,ether2 \
    mode=802.3ad lacp-rate=1sec transmit-hash-policy=layer-2-and-3

# Mode yang tersedia
#   balance-rr        round robin (bisa out-of-order — hati-hati)
#   active-backup     hanya satu aktif; TIDAK butuh dukungan switch
#   balance-xor       hash; butuh static LAG di switch
#   broadcast         kirim ke semua slave
#   802.3ad           LACP ← DIREKOMENDASIKAN
#   balance-tlb       adaptive transmit load balancing
#   balance-alb       adaptive load balancing (tx + rx)

# Kebijakan hash
#   layer-2            src+dst MAC
#   layer-2-and-3      src+dst MAC + IP  ← default yang baik
#   layer-3-and-4      src+dst IP + port ← distribusi terbaik

# Masukkan bonding ke bridge
/interface bridge port add bridge=bridge-LAN interface=bond-uplink

# Verifikasi
/interface bonding print detail
/interface bonding monitor bond-uplink
     mode: 802.3ad
     active-ports: ether1,ether2
     inactive-ports: 
     lacp-system-id: ...
     lacp-partner-system-id: ...
```

> [!WARNING]
> **`mode=802.3ad` memerlukan LACP dikonfigurasi di sisi lawan.** Kalau lawan tidak mendukung, gunakan `active-backup` (tidak butuh dukungan switch) atau `balance-xor` (butuh static LAG).

> [!WARNING]
> Sama seperti EtherChannel, satu aliran tetap di satu link. Bonding 2×1 Gbps tidak memberi 2 Gbps untuk satu transfer.

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `channel-group 1 mode active` | `mode=802.3ad` |
| `channel-group 1 mode on` | `mode=balance-xor` |
| `port-channel load-balance src-dst-ip` | `transmit-hash-policy=layer-2-and-3` |
| `show etherchannel summary` | `/interface bonding monitor` |
| Interface `Port-channel1` | Interface `bond-uplink` |

---

## 11. Ringkasan

- EtherChannel menggabungkan beberapa link fisik menjadi satu link logis: bandwidth agregat + redundansi + STP melihat satu link.
- **Satu aliran tetap di satu link.** EtherChannel 4×1 G tidak memberi 4 Gbps untuk satu transfer.
- Distribusi ditentukan **hash**; pilih metode yang sesuai pola trafik (`src-dst-ip` atau IP+port biasanya terbaik).
- Jumlah link idealnya pangkat 2 (2, 4, 8).
- **LACP (802.3ad)** adalah standar terbuka; gunakan ini. `active`+`passive` atau `active`+`active` membentuk channel; `passive`+`passive` tidak.
- Mode `on` berisiko loop, jadi hindari.
- Semua anggota harus **konsisten**: speed, duplex, mode switchport, VLAN.
- Konfigurasikan **Port-channel interface**, bukan port fisik. Shutdown anggota saat mengonfigurasi.
- Baca `show etherchannel summary`: flag `(P)` bundled sehat, `(I)` stand-alone, `(s)` suspended.
- **MLAG/vPC/stacking** memungkinkan EtherChannel ke dua switch berbeda; waspadai split-brain (peer-keepalive terpisah).

---

## 12. Latihan

1. Anda membuat EtherChannel 4 × 1 Gbps antara switch dan server. Server mengeluh transfer file tunggal hanya 1 Gbps. Apakah ini bug? Jelaskan.
2. Kedua sisi dikonfigurasi `channel-group 1 mode passive`. Apakah channel terbentuk?
3. `show etherchannel summary` menampilkan `Gi0/2(s)`. Apa artinya dan apa yang Anda periksa?
4. EtherChannel antara switch access dan router. Semua trafik internet keluar lewat satu link saja. Apa penyebabnya dan bagaimana memperbaikinya?
5. Kenapa mode `on` berbahaya dibandingkan LACP?
6. Server punya dua NIC yang ingin dihubungkan ke dua switch berbeda untuk redundansi, dan Anda tidak punya MLAG. Mode bonding apa yang Anda pakai?
7. Jelaskan apa itu split-brain pada vPC dan bagaimana dicegah.

<details>
<summary>Jawaban</summary>

1. **Bukan bug. Ini perilaku yang benar.** EtherChannel mendistribusikan aliran, bukan memecah satu aliran. Satu sesi TCP selalu di-hash ke satu link agar paket tidak tiba out-of-order (yang justru akan merusak kinerja TCP). Untuk mendapat 4 Gbps, dibutuhkan banyak aliran paralel, atau link fisik berkecepatan lebih tinggi (mis. 10 G).

2. **Tidak.** Mode `passive` hanya merespons LACP PDU, tidak pernah memulai. Minimal satu sisi harus `active`.

3. `(s)` = **suspended**: port tidak dimasukkan ke bundle karena konfigurasinya tidak konsisten dengan anggota lain. Periksa: kecepatan, duplex, mode switchport (access/trunk), VLAN access, allowed VLAN dan native VLAN pada trunk, serta trunk encapsulation. Log biasanya menyebutkan penyebab spesifik (`%EC-5-CANNOT_BUNDLE2: ... vlan mask is different`).

4. Kemungkinan besar metode hash memakai **MAC address tujuan** (`dst-mac` atau `src-dst-mac`). Semua trafik menuju internet punya MAC tujuan yang sama (MAC router), sehingga selalu menghasilkan hash yang sama dan masuk ke satu link. Perbaikan: ubah ke hash berbasis IP atau IP+port yang jauh lebih bervariasi: `port-channel load-balance src-dst-ip` atau `src-dst-mixed-ip-port`.

5. Mode `on` **tidak melakukan negosiasi atau verifikasi apa pun**. Jika satu sisi dikonfigurasi `on` sementara sisi lain belum siap (atau salah konfigurasi), switch tetap memperlakukan link-link itu sebagai satu bundle, sedangkan sisi lain memperlakukannya sebagai link terpisah. STP hanya melihat satu link logis, sehingga tidak memblokir apa pun → loop terbentuk. LACP mencegah ini karena channel hanya terbentuk setelah kedua sisi saling mengonfirmasi.

6. **Mode 1 (active-backup)**. Mode ini tidak memerlukan dukungan agregasi dari switch, sehingga aman digunakan saat kedua NIC menuju switch yang berbeda dan tidak ada MLAG/vPC. Hanya satu NIC aktif pada satu waktu (tidak ada bandwidth agregat), tetapi failover otomatis jika satu switch atau kabel mati. Alternatif: mode 5/6 (balance-tlb/alb) memberi sedikit load balancing tanpa dukungan switch, tetapi lebih rumit dan punya keterbatasan.

7. **Split-brain** terjadi ketika **peer-link** antara dua switch vPC putus sementara kedua switch masih hidup. Tanpa mekanisme lain, keduanya akan mengira peer-nya mati dan sama-sama mengambil peran aktif penuh. Akibatnya terjadi duplikasi frame, MAC flapping, dan trafik yang berputar. Pencegahannya: **peer-keepalive link** yang berjalan di jalur terpisah (biasanya lewat interface manajemen out-of-band). Jika peer-link putus tetapi keepalive masih hidup, switch tahu peer-nya masih ada, sehingga switch sekunder menonaktifkan port vPC-nya (suspend) untuk mencegah duplikasi.

</details>

---

## 13. Sumber

- IEEE 802.1AX-2020 (sebelumnya 802.3ad): Link Aggregation
- Cisco CCNA 200-301 v1.1, topik 2.4 (Configure and verify Layer 2/Layer 3 EtherChannel: LACP)
- Cisco, *EtherChannel Load Balancing Configuration Guide*
- Linux kernel documentation: `Documentation/networking/bonding.rst`

---

**Berikutnya:** `03-data-link/06-discovery-dan-l2-lain.md`. CDP/LLDP dan protokol layer 2 lainnya.

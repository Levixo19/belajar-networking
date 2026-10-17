# 03.1 Ethernet: Frame, MAC Address, dan Error

> **Prasyarat:** `01-model-referensi/03`, `02-layer-fisik/04`
> **Tujuan:** Anda bisa membaca setiap field frame Ethernet, memahami MAC address sampai ke tingkat bit, dan mendiagnosis error interface dengan tepat.

---

## 1. Kenapa Ethernet Menang

Tahun 1980-an ada banyak teknologi LAN: Token Ring (IBM), ARCNET, FDDI, AppleTalk. Semuanya kalah dari Ethernet.

Alasannya bukan karena Ethernet paling canggih — Token Ring bahkan lebih deterministik dan efisien pada beban tinggi. Ethernet menang karena:
- **Sederhana** → murah dibuat
- **Standar terbuka** (DIX lalu IEEE 802.3) → banyak vendor
- **Berevolusi tanpa memutus kompatibilitas** — frame yang sama dari 10 Mbps sampai 800 Gbps

Hari ini Ethernet ada di mana-mana: LAN kantor, data center, backbone metro, bahkan menggantikan protokol WAN lama.

---

## 2. Struktur Frame Ethernet

```
┌──────────┬─────┬──────────┬──────────┬───────────┬──────────────┬─────┐
│ Preamble │ SFD │ MAC Dest │ MAC Src  │ EtherType │   Payload    │ FCS │
│  7 byte  │1byte│  6 byte  │  6 byte  │  2 byte   │ 46–1500 byte │4byte│
└──────────┴─────┴──────────┴──────────┴───────────┴──────────────┴─────┘
 └── layer 1 ──┘  └────────────── FRAME (yang dihitung) ────────────────┘
```

### Field demi field

**Preamble (7 byte)** — pola `10101010` diulang 7 kali. Fungsinya membangunkan penerima dan menyinkronkan clock. Bukan bagian dari frame secara teknis.

**SFD — Start Frame Delimiter (1 byte)** — `10101011`. Dua bit `11` di akhir menandai "frame dimulai setelah ini".

**MAC Destination (6 byte)** — alamat tujuan. Diletakkan **pertama** agar switch bisa langsung mengambil keputusan forwarding tanpa menunggu seluruh frame (memungkinkan cut-through switching).

**MAC Source (6 byte)** — alamat pengirim. Dari sinilah switch belajar.

**EtherType / Length (2 byte)** — bergantung nilainya:
- Nilai **≥ 0x0600 (1536)** → ini **EtherType**, menandakan protokol payload (Ethernet II).
- Nilai **≤ 0x05DC (1500)** → ini **Length**, panjang payload (IEEE 802.3 asli, memakai LLC).

EtherType penting yang wajib dikenal:
| Nilai | Protokol |
|---|---|
| `0x0800` | IPv4 |
| `0x0806` | ARP |
| `0x86DD` | IPv6 |
| `0x8100` | VLAN tag 802.1Q |
| `0x88A8` | QinQ / 802.1ad |
| `0x8847` | MPLS unicast |
| `0x8863/0x8864` | PPPoE discovery / session |
| `0x88CC` | LLDP |
| `0x8809` | LACP / slow protocols |
| `0x888E` | 802.1X (EAPOL) |

**Payload (46-1500 byte)** — data dari layer atas (biasanya paket IP).
- **Minimum 46 byte** — kalau kurang, ditambahkan **padding**.
- **Maksimum 1500 byte** = MTU standar Ethernet.

**FCS — Frame Check Sequence (4 byte)** — CRC-32 dari seluruh frame. Penerima menghitung ulang; kalau tidak cocok, frame **dibuang** (tidak ada permintaan kirim ulang di layer 2 Ethernet — itu tugas TCP).

### Ukuran frame

```
Minimum : 64 byte   (6+6+2+46+4)
Maksimum: 1518 byte (6+6+2+1500+4)
Dengan VLAN tag: 1522 byte
Jumbo frame: sampai 9018/9022 byte
```

**Kenapa minimum 64 byte?** Warisan CSMA/CD. Frame harus cukup panjang agar pengirim masih sedang mengirim ketika sinyal tabrakan dari ujung terjauh kembali — sehingga ia tahu telah terjadi collision. Dengan jarak maksimum 2500 m dan 10 Mbps, angka itu jatuh di 512 bit = 64 byte. Meskipun CSMA/CD sudah tidak relevan, batas 64 byte tetap dipertahankan demi kompatibilitas.

**Interframe Gap (IFG)** — jeda wajib 96 bit time antar-frame (12 byte pada kecepatan berapa pun). Memberi waktu penerima memproses.

### Ethernet II vs IEEE 802.3

| | Ethernet II (DIX) | IEEE 802.3 + LLC |
|---|---|---|
| Field ke-3 | EtherType | Length |
| Identifikasi protokol | Langsung dari EtherType | Lewat header LLC (DSAP/SSAP) |
| Overhead | Lebih kecil | Lebih besar (3-8 byte LLC/SNAP) |
| Dipakai | **99% trafik hari ini** | STP, CDP, beberapa protokol lama |

> [!TIP]
> Praktisnya: kalau Anda melihat "Ethernet II" di Wireshark, itu normal. LLC/SNAP muncul untuk protokol kendali seperti STP dan CDP.

---

## 3. MAC Address

```
   MAC address: 00:1A:2B:3C:4D:5E
                └──────┘ └──────┘
                  OUI     Device ID
                 (3 byte)   (3 byte)
                24 bit      24 bit
```

- Total **48 bit** = 6 byte = 12 digit hex.
- **OUI** (*Organizationally Unique Identifier*) — dialokasikan IEEE ke produsen. `00:1A:2B` misalnya milik vendor tertentu.
- **Device ID** — ditentukan produsen, unik dalam OUI-nya.
- Disebut juga: alamat fisik, alamat hardware, BIA (*Burned-In Address*).

### Format penulisan

Semua ini menunjuk alamat yang sama:
```
00:1A:2B:3C:4D:5E     ← Unix/Linux, IEEE
00-1A-2B-3C-4D-5E     ← Windows
001A.2B3C.4D5E        ← Cisco
001a2b3c4d5e          ← tanpa pemisah
```

### Dua bit khusus di byte pertama

```
Byte pertama: 0000 0000
                     ││
                     │└── I/G bit (bit 0, LSB)
                     └─── U/L bit (bit 1)
```

**I/G bit (Individual/Group)** — bit paling kanan dari byte pertama:
- `0` = **unicast** (satu penerima)
- `1` = **multicast/broadcast** (banyak penerima)

Cara cepat: **kalau digit hex kedua dari byte pertama genap → unicast; ganjil → multicast.**
```
00:1A:2B:...  → byte pertama 0x00 = 0000 0000 → I/G=0 → UNICAST
01:00:5E:...  → byte pertama 0x01 = 0000 0001 → I/G=1 → MULTICAST
FF:FF:FF:FF:FF:FF → semua bit 1 → BROADCAST
33:33:...     → 0x33 = 0011 0011 → I/G=1 → MULTICAST IPv6
```

**U/L bit (Universal/Local)**:
- `0` = **universal** — dialokasikan IEEE (BIA asli dari pabrik)
- `1` = **local** — ditetapkan administrator/software (MAC virtual, randomized MAC, VRRP)

Contoh alamat locally administered: `02:...`, `06:...`, `0A:...`, `0E:...` (bit kedua dari kanan pada byte pertama = 1).

### Tiga jenis pengiriman di Layer 2

| Jenis | MAC tujuan | Perilaku switch |
|---|---|---|
| **Unicast** | MAC spesifik | Diteruskan ke satu port (kalau diketahui) |
| **Broadcast** | `FF:FF:FF:FF:FF:FF` | Diteruskan ke **semua** port dalam VLAN |
| **Multicast** | Diawali `01:00:5E` (IPv4) atau `33:33` (IPv6) | Semua port, kecuali ada IGMP/MLD snooping |

**MAC multicast penting:**
```
01:00:5E:xx:xx:xx  → multicast IPv4 (23 bit terendah dari IP multicast)
33:33:xx:xx:xx:xx  → multicast IPv6 (32 bit terendah dari IPv6 multicast)
01:80:C2:00:00:00  → STP BPDU
01:80:C2:00:00:0E  → LLDP
01:00:0C:CC:CC:CC  → CDP (Cisco)
01:80:C2:00:00:02  → LACP / slow protocols
```

### MAC address dalam praktik

```bash
# Linux
$ ip link show
2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500 ...
    link/ether 00:1a:2b:3c:4d:5e brd ff:ff:ff:ff:ff:ff

# Ubah MAC (locally administered)
$ sudo ip link set dev eth0 address 02:11:22:33:44:55

# Windows
PS> Get-NetAdapter | Select Name, MacAddress

# Cisco
SW1# show interfaces gi0/1 | include address
SW1# show mac address-table
```

> [!WARNING]
> **MAC address bisa diubah dengan mudah** (satu perintah). Karena itu:
- MAC filtering **bukan** kontrol keamanan yang serius.
- Port security memperlambat penyerang, tidak menghentikannya.
- Untuk keamanan sesungguhnya, gunakan **802.1X** (`12-keamanan/04`).

> [!TIP]
> **MAC randomization** — ponsel modern (iOS 14+, Android 10+) memakai MAC acak per SSID untuk privasi. Ini merusak: DHCP reservation berbasis MAC, MAC filtering, dan pelacakan perangkat. Solusinya: 802.1X, atau meminta pengguna mematikan "private address" untuk SSID korporat.

---

## 4. MTU dan Jumbo Frame

**MTU** (*Maximum Transmission Unit*) = payload terbesar yang bisa dibawa satu frame.

```
MTU Ethernet standar : 1500 byte
Frame total          : 1518 byte (1522 dengan VLAN tag)
```

### Jumbo Frame

MTU lebih besar dari 1500, biasanya **9000 byte**.

Manfaat:
```
Transfer 1 GB dengan MTU 1500:
  1.000.000.000 / 1460 ≈ 685.000 paket
  Overhead header: 685.000 × 78 byte ≈ 53 MB

Transfer 1 GB dengan MTU 9000:
  1.000.000.000 / 8960 ≈ 111.600 paket
  Overhead header: 111.600 × 78 byte ≈ 8,7 MB

Penghematan overhead: ~44 MB, ditambah CPU interrupt jauh lebih sedikit.
```

Dipakai di: storage (iSCSI, NFS), backup, replikasi VM, underlay VXLAN, HPC.

> [!WARNING]
> **Jumbo frame harus diaktifkan di SETIAP perangkat sepanjang jalur** — host, NIC, switch, router. Kalau satu perangkat masih 1500, frame besar akan dibuang tanpa pemberitahuan → **MTU black hole**: ping kecil jalan, transfer besar macet.

```
# Linux
$ sudo ip link set dev eth0 mtu 9000
$ ip link show eth0 | grep mtu

# Uji MTU sesungguhnya (DF bit, jangan fragmentasi)
$ ping -M do -s 8972 <tujuan>     # 8972 + 8 ICMP + 20 IP = 9000
```

```
# Cisco
SW1(config)# system mtu 9198          ← switch (butuh reload)
R1(config-if)# ip mtu 9000            ← per interface pada router
SW1# show system mtu
```

### Istilah ukuran frame tidak normal

| Istilah | Arti |
|---|---|
| **Runt** | Frame < 64 byte. Biasanya akibat collision atau NIC rusak |
| **Giant** | Frame > MTU maksimum yang dikonfigurasi |
| **Baby giant** | Frame sedikit di atas 1518 (mis. 1522 karena VLAN tag, atau 1526 karena MPLS). Butuh dukungan "baby giant" di switch |
| **Jabber** | Frame terlalu besar **dan** FCS salah — biasanya NIC rusak yang mengirim terus |

---

## 5. CSMA/CD dan Collision Domain

### Sejarah singkat

Di era hub dan kabel bus, semua perangkat berbagi satu media. Kalau dua perangkat mengirim bersamaan → **collision** → kedua sinyal rusak.

**CSMA/CD** (*Carrier Sense Multiple Access with Collision Detection*):
```
1. CARRIER SENSE  — dengarkan dulu. Ada yang mengirim? Tunggu.
2. MULTIPLE ACCESS— kalau sepi, kirim.
3. COLLISION DETECT — sambil mengirim, dengarkan. Sinyal tidak sesuai
                      yang dikirim? Berarti collision.
4. JAM SIGNAL     — kirim sinyal jam 32 bit agar semua tahu ada collision.
5. BACKOFF        — tunggu waktu acak (binary exponential backoff), lalu ulangi.
                    Percobaan ke-n: tunggu acak antara 0 dan 2ⁿ−1 slot time.
                    Setelah 16 kali gagal → menyerah, buang frame.
```

### Collision Domain

Area di mana collision bisa terjadi.

```
HUB   : semua port = SATU collision domain
        (10 PC di hub = semua bisa bertabrakan satu sama lain)

SWITCH: setiap port = collision domain SENDIRI
        (10 PC di switch = 10 collision domain terpisah)
```

### Kenapa CSMA/CD mati

Dengan switch dan full duplex:
- Setiap port punya jalur kirim dan terima terpisah
- Tidak ada perangkat lain di collision domain itu
- **Tidak mungkin ada collision** → CSMA/CD **dinonaktifkan**

> [!WARNING]
> **Karena itu:** melihat **collision** pada link full-duplex modern adalah **tanda masalah**, bukan hal normal. Hampir selalu berarti duplex mismatch.

> [!TIP]
> CSMA/CD masih relevan untuk memahami: (a) kenapa frame minimum 64 byte; (b) kenapa half duplex buruk; (c) kenapa Wi-Fi memakai CSMA/**CA** (Collision *Avoidance* — karena radio tidak bisa mendengar saat mengirim).

### Broadcast Domain

Area yang menerima frame broadcast.

```
SWITCH tanpa VLAN : semua port = SATU broadcast domain
SWITCH dengan VLAN: setiap VLAN = broadcast domain sendiri
ROUTER            : setiap interface = broadcast domain sendiri
                    (router TIDAK meneruskan broadcast)
```

| Perangkat | Collision domain | Broadcast domain |
|---|---|---|
| Hub | 1 (semua port) | 1 |
| Switch | 1 per port | 1 (atau 1 per VLAN) |
| Router | 1 per interface | 1 per interface |

---

## 6. Duplex Mismatch: Diagnosis Lengkap

Sudah diperkenalkan di `02-layer-fisik/04`. Di sini cara mengenalinya dari counter.

### Apa yang terjadi

```
Sisi A: FULL duplex  → "saya bisa kirim kapan saja"
Sisi B: HALF duplex  → "saya harus dengar dulu, dan deteksi collision"

A mengirim saat B sedang mengirim
→ B mendeteksi "collision" (padahal A memang boleh)
→ B mengirim jam signal & membuang frame-nya
→ A menerima frame B yang rusak → CRC error di A
→ B mencatat collision & late collision
```

### Pola counter yang khas

| Sisi | Yang terlihat |
|---|---|
| **Full duplex** | Banyak **input errors**, **CRC/FCS errors**, **runts** |
| **Half duplex** | Banyak **collisions**, terutama **late collisions** |

> [!WARNING]
> **Late collision adalah petunjuk paling kuat.** Collision normal terjadi dalam 64 byte pertama. Late collision terjadi **setelah** itu — berarti sisi lain mengirim tanpa mendengarkan (= full duplex), atau kabel terlalu panjang.

### Cara memperbaiki

```
# Pastikan KEDUA sisi sama
SW1(config-if)# speed auto
SW1(config-if)# duplex auto

# Atau hard-code KEDUA sisi (hanya untuk 10/100)
SW1(config-if)# speed 100
SW1(config-if)# duplex full
```

**Untuk 1000BASE-T ke atas: selalu auto.** Standar mewajibkannya.

---

## 7. Membaca Interface Counters

Ini keterampilan diagnostik paling berguna di layer 2.

```
SW1# show interfaces gi0/1
GigabitEthernet0/1 is up, line protocol is up
  Hardware is Gigabit Ethernet, address is 001a.2b3c.4d5e
  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec
  Full-duplex, 1000Mb/s, media type is 10/100/1000BaseTX
  ...
  5 minute input rate 12000 bits/sec, 8 packets/sec
  5 minute output rate 45000 bits/sec, 22 packets/sec
     1523847 packets input, 892374652 bytes
     Received 234 broadcasts (12 multicasts)
     0 runts, 0 giants, 0 throttles
     15 input errors, 15 CRC, 0 frame, 0 overrun, 0 ignored
     0 watchdog, 12 multicast, 0 pause input
     982374 packets output, 234987234 bytes, 0 underruns
     0 output errors, 0 collisions, 2 interface resets
     0 babbles, 0 late collision, 0 deferred
     0 lost carrier, 0 no carrier, 0 PAUSE output
```

### Arti setiap counter

| Counter | Arti | Penyebab umum |
|---|---|---|
| **CRC** | FCS tidak cocok | **Kabel/konektor rusak, EMI, duplex mismatch, SFP bermasalah** |
| **input errors** | Total semua error input | Jumlah dari CRC + frame + overrun + dll |
| **frame** | Frame dengan CRC salah **dan** panjang bukan kelipatan 8 bit | Masalah kabel serius |
| **runts** | Frame < 64 byte | Collision, NIC rusak |
| **giants** | Frame > MTU | MTU mismatch, VLAN tag tak terduga |
| **overrun** | Hardware tidak sempat memindahkan data ke buffer | Perangkat kewalahan |
| **ignored** | Buffer internal habis | Perangkat kewalahan |
| **collisions** | Collision normal (dalam 64 byte pertama) | Normal di half duplex; **abnormal di full duplex** |
| **late collision** | Collision setelah 64 byte | **Duplex mismatch** atau kabel melebihi batas |
| **deferred** | Menunda pengiriman karena media sibuk | Normal di half duplex |
| **no carrier / lost carrier** | Sinyal carrier hilang | Kabel dicabut, perangkat lawan mati |
| **babbles** | Transmisi terlalu lama | NIC rusak |
| **output errors** | Error saat mengirim | Buffer penuh, masalah hardware |
| **interface resets** | Interface di-reset | Link flapping, masalah hardware |
| **throttles** | Interface menghentikan penerimaan sementara | Kewalahan |

### Alur diagnosis dari counter

```
CRC error naik terus?
  → Duplex sama di kedua sisi? Tidak → perbaiki duplex
  → Ya → cek kabel/konektor/SFP → ganti patch cord → uji TDR/power optik

Late collision ada?
  → Hampir pasti duplex mismatch. Periksa kedua sisi.
  → Kalau duplex benar: cek panjang kabel (>100 m?)

Runts banyak?
  → Collision (half duplex) atau NIC rusak di sisi lawan

Giants banyak?
  → MTU tidak konsisten; atau frame ber-VLAN-tag masuk ke port yang tidak siap

Input drops / overrun / ignored?
  → Bukan masalah kabel; perangkat/CPU kewalahan atau buffer kecil

Interface resets sering?
  → Link flapping: kabel longgar, SFP bermasalah, masalah daya
```

### Reset counter untuk pengamatan bersih
```
SW1# clear counters gi0/1
... tunggu beberapa menit ...
SW1# show interfaces gi0/1 | include error|CRC|collision
```

> [!WARNING]
> **Selalu clear counter sebelum mendiagnosis.** Counter yang menumpuk selama 2 tahun tidak memberi tahu apakah masalahnya terjadi **sekarang**.

Di Linux:
```bash
$ ip -s link show eth0
$ ethtool -S eth0 | grep -iE 'err|crc|drop|collision'
```

---

## 8. Flow Control (Pause Frame)

IEEE 802.3x memungkinkan penerima yang kewalahan mengirim **pause frame** ke pengirim: "berhenti sebentar".

```
Pause frame: MAC tujuan 01:80:C2:00:00:01, EtherType 0x8808
Berisi: berapa lama harus berhenti (dalam quanta)
```

> [!WARNING]
> **Umumnya sebaiknya dinonaktifkan di jaringan modern.** Alasannya: pause frame menghentikan **seluruh** trafik pada link itu, termasuk trafik prioritas tinggi — menyebabkan *head-of-line blocking* yang menyebar (congestion spreading). TCP sudah punya congestion control yang lebih baik.

Pengecualian: **PFC** (*Priority Flow Control*, 802.1Qbb) yang menghentikan hanya kelas trafik tertentu — dipakai untuk RoCE/FCoE di data center yang butuh lossless.

```
SW1(config-if)# no flowcontrol receive
SW1# show interfaces gi0/1 | include pause
```

---

## MikroTik RouterOS

```
# MAC address interface
/interface ethernet print
/interface ethernet print detail
/interface print where type=ether

# Ubah MAC (locally administered)
/interface ethernet set ether1 mac-address=02:11:22:33:44:55
/interface ethernet reset-mac-address ether1

# MTU dan L2MTU — RouterOS membedakan keduanya!
/interface ethernet set ether1 mtu=1500 l2mtu=1598
/interface print detail where name=ether1

# Statistik dan error interface
/interface ethernet print stats
/interface ethernet print stats-detail       ← CRC, collision, fragment
/interface monitor-traffic ether1
/interface ethernet monitor ether1           ← speed, duplex, status link

# Uji kabel (RouterBOARD tertentu)
/interface ethernet cable-test ether1

# Paksa speed/duplex (biasanya JANGAN — biarkan auto)
/interface ethernet set ether1 auto-negotiation=no speed=100Mbps full-duplex=yes
```

> [!WARNING]
> **RouterOS membedakan `mtu` dan `l2mtu`.** `mtu` adalah payload L3 (biasanya 1500); **`l2mtu`** adalah ukuran frame L2 maksimum yang bisa ditangani hardware. Untuk VLAN, MPLS, atau tunnel, **`l2mtu` harus cukup besar** (mis. 1598) atau frame bertag akan dibuang. Ini konsep yang tidak ada di Cisco dan sering membingungkan pemula.

```
# Cek nilai l2mtu yang didukung hardware
/interface ethernet print detail
# Naikkan l2mtu pada semua ether (kalau hardware mendukung)
/interface ethernet set [find] l2mtu=1598
```

> [!TIP]
> **Jumbo frame di RouterOS:**
```
/interface ethernet set [find] mtu=9000 l2mtu=9018
/interface bridge set bridge-LAN mtu=9000
```

---

## 9. Ringkasan

- Frame Ethernet: Preamble/SFD (L1) + MAC dest + MAC src + EtherType + payload + FCS.
- Ukuran 64-1518 byte (1522 dengan VLAN tag); jumbo sampai 9000+.
- **EtherType** menentukan protokol payload: 0x0800 IPv4, 0x0806 ARP, 0x86DD IPv6, 0x8100 VLAN.
- MAC 48 bit = OUI (24 bit vendor) + device ID. **I/G bit** menentukan unicast/multicast; **U/L bit** menentukan universal/local.
- Broadcast = `FF:FF:FF:FF:FF:FF`. Multicast IPv4 = `01:00:5E:...`, IPv6 = `33:33:...`.
- MAC mudah diubah → MAC filtering bukan keamanan serius; pakai 802.1X.
- Jumbo frame harus konsisten di **seluruh** jalur, kalau tidak → MTU black hole.
- CSMA/CD mati di full duplex. **Collision di link full duplex = tanda masalah.**
- Switch memisahkan collision domain; VLAN/router memisahkan broadcast domain.
- **Late collision = duplex mismatch** (atau kabel terlalu panjang).
- Selalu `clear counters` sebelum mendiagnosis.

---

## 10. Latihan

1. Berapa ukuran total frame Ethernet yang membawa paket IP 20 byte header + 0 byte data? Jelaskan.
2. MAC `01:80:C2:00:00:00` — unicast atau multicast? Bagaimana Anda tahu? Untuk apa alamat ini?
3. Sebuah interface menunjukkan 5.000 CRC error dan 0 collision. Interface lawan menunjukkan 4.800 late collision. Apa diagnosis dan perbaikannya?
4. Anda mengaktifkan jumbo frame 9000 di dua server, tetapi transfer besar menggantung. Ping kecil berhasil. Apa yang terlewat?
5. EtherType `0x8100` muncul di sebuah frame. Apa artinya, dan apa yang ada setelah field itu?
6. Jelaskan kenapa frame Ethernet minimum 64 byte, padahal CSMA/CD sudah tidak dipakai.
7. Interface menunjukkan `giants` bertambah. Sebutkan dua kemungkinan penyebab.

<details>
<summary>Jawaban</summary>

1. Payload akan menjadi 20 byte (hanya header IP), tetapi minimum payload Ethernet adalah 46 byte → ditambahkan **padding 26 byte**. Total frame = 6 + 6 + 2 + 46 + 4 = **64 byte** (ukuran minimum). Di kabel, ditambah preamble 7 + SFD 1 + IFG 12 = 84 byte time.

2. **Multicast.** Byte pertama `0x01` = `0000 0001`; bit paling kanan (I/G) = 1 → multicast. (Cara cepat: digit hex kedua `1` adalah ganjil.) Alamat ini adalah alamat multicast untuk **STP BPDU** — dipakai bridge/switch untuk saling bertukar informasi spanning tree.

3. **Duplex mismatch.** Sisi dengan CRC error berjalan full duplex; sisi dengan late collision berjalan half duplex. Perbaikan: set kedua sisi ke `speed auto` / `duplex auto`, atau hard-code identik di kedua sisi. Setelah diperbaiki, `clear counters` dan pantau — error harus berhenti bertambah.

4. **Perangkat di antara kedua server** (switch, router) masih memakai MTU 1500. Jumbo frame harus diaktifkan di **seluruh jalur**: NIC server, semua switch, dan router yang dilewati. Verifikasi dengan `ping -M do -s 8972 <tujuan>` — kalau gagal, ada perangkat di jalur yang belum mendukung. Pada Cisco: `system mtu 9198` (perlu reload) untuk switch dan `ip mtu` untuk interface routed.

5. `0x8100` = **VLAN tag 802.1Q**. Setelah field ini terdapat 2 byte **TCI** (Tag Control Information: PCP 3 bit untuk prioritas, DEI 1 bit, VID 12 bit untuk nomor VLAN), baru kemudian EtherType yang sebenarnya (mis. `0x0800` untuk IPv4). Frame menjadi 4 byte lebih panjang (maksimum 1522).

6. Warisan CSMA/CD: frame harus cukup panjang agar sinyal collision dari ujung terjauh kembali sebelum pengirim selesai mengirim (512 bit time pada 10 Mbps dengan diameter jaringan maksimum). Batas ini **dipertahankan demi kompatibilitas mundur** — semua perangkat Ethernet sejak 1980 mengharapkan minimum 64 byte, dan mengubahnya akan memutus interoperabilitas.

7. (a) **MTU tidak konsisten** — perangkat lawan mengirim frame lebih besar dari yang dikonfigurasi di sini (mis. lawan jumbo, sini 1500). (b) **Frame ber-tag masuk ke port yang tidak mengharapkannya** — misalnya frame QinQ (double tag) atau MPLS yang menambah header, sehingga melebihi 1518 sementara switch belum dikonfigurasi menerima baby giant. (c) NIC rusak di sisi lawan.

</details>

---

## 11. Sumber

- IEEE 802.3-2022 — Ethernet standard
- IEEE 802.1Q — VLAN tagging
- IEEE Registration Authority (pencarian OUI) — https://regauth.standards.ieee.org/standards-ra-web/pub/view.html
- RFC 894 — Standard for the Transmission of IP Datagrams over Ethernet Networks
- Cisco CCNA 200-301 v1.1, topik 1.4 dan 1.13

---

**Berikutnya:** `03-data-link/02-switching.md`. Bagaimana switch benar-benar bekerja.

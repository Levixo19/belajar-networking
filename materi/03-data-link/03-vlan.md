# 03.3 — VLAN

> **Prasyarat:** `03-data-link/02`
> **Tujuan:** Anda bisa merancang, mengonfigurasi, dan mendiagnosis VLAN, trunk, dan inter-VLAN routing — termasuk memahami jebakan native VLAN dan VTP.

VLAN adalah salah satu topik yang **paling sering ditanyakan** di pekerjaan dan ujian. Kuasai ini dengan baik.

---

## 1. Masalah yang Dipecahkan VLAN

Tanpa VLAN, satu switch = satu broadcast domain. Konsekuensinya:

```
Kantor dengan 200 PC di 1 switch stack:
- Semua broadcast (ARP, DHCP, NetBIOS, mDNS) sampai ke 200 PC
- Setiap PC memproses broadcast yang tidak relevan → boros CPU
- Semua perangkat bisa saling menjangkau → tidak ada isolasi keamanan
- Satu broadcast storm melumpuhkan 200 PC
- Tamu, server, dan CCTV berada di jaringan yang sama
```

Solusi lama: **beli switch terpisah untuk setiap kelompok.** Mahal, tidak fleksibel, boros port.

Solusi VLAN: **satu switch fisik, banyak jaringan logis.**

```
        SWITCH FISIK TUNGGAL
   ┌──────────────────────────────┐
   │ VLAN 10 (Staff)              │  ← broadcast domain 1
   │   Port 1-12                  │
   ├──────────────────────────────┤
   │ VLAN 20 (Server)             │  ← broadcast domain 2
   │   Port 13-18                 │
   ├──────────────────────────────┤
   │ VLAN 30 (Tamu)               │  ← broadcast domain 3
   │   Port 19-22                 │
   ├──────────────────────────────┤
   │ VLAN 40 (CCTV)               │  ← broadcast domain 4
   │   Port 23-24                 │
   └──────────────────────────────┘

   Antar-VLAN TIDAK bisa berkomunikasi tanpa router.
```

### Manfaat VLAN

1. **Isolasi broadcast** — broadcast VLAN 10 tidak sampai ke VLAN 20.
2. **Keamanan** — pemisahan logis; trafik antar-VLAN bisa difilter di router/firewall.
3. **Fleksibilitas** — perangkat bisa pindah lokasi fisik tanpa mengubah jaringan logisnya.
4. **Manajemen** — kelompokkan berdasarkan fungsi/departemen, bukan lokasi.
5. **Efisiensi biaya** — tidak perlu switch terpisah per kelompok.
6. **QoS** — trafik suara bisa diberi prioritas terpisah.

⚠️ **Aturan penting:** satu VLAN = satu subnet IP. Ini bukan keharusan teknis mutlak, tetapi mencampur beberapa subnet dalam satu VLAN menciptakan kebingungan dan masalah routing. **Selalu petakan 1:1.**

---

## 2. Jenis Port

### Access Port

Port yang menjadi anggota **satu VLAN** dan menghubungkan **end device** (PC, printer, kamera).

- Frame yang keluar dari access port **tidak punya VLAN tag** — end device tidak tahu apa-apa tentang VLAN.
- Frame yang masuk diberi tag secara internal oleh switch.

```
SW1(config)# interface gi0/5
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10
SW1(config-if)# description PC-Finance-01
```

### Trunk Port

Port yang membawa **banyak VLAN** sekaligus. Menghubungkan switch ke switch, switch ke router, atau switch ke server/hypervisor.

- Frame diberi **tag 802.1Q** agar penerima tahu frame itu milik VLAN mana.
- Pengecualian: frame di **native VLAN** dikirim **tanpa tag**.

```
SW1(config)# interface gi0/24
SW1(config-if)# switchport trunk encapsulation dot1q   ← pada switch lama
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk allowed vlan 10,20,30
SW1(config-if)# switchport trunk native vlan 999
SW1(config-if)# description Uplink-to-SW-CORE
```

### Voice VLAN

Kasus khusus: telepon IP dengan port PC di belakangnya.

```
   [PC] ──── [IP Phone] ──── [Switch port]
```

Satu port fisik membawa dua VLAN:
- **Voice VLAN** (bertag) untuk telepon
- **Data VLAN / access VLAN** (tanpa tag) untuk PC

```
SW1(config)# interface gi0/8
SW1(config-if)# switchport mode access
SW1(config-if)# switchport access vlan 10        ← data (PC), untagged
SW1(config-if)# switchport voice vlan 110        ← voice, tagged
SW1(config-if)# spanning-tree portfast
SW1(config-if)# mls qos trust cos                ← percayai marking CoS dari telepon
```

Telepon mengetahui VLAN suaranya lewat **CDP** atau **LLDP-MED**. Ini bukan trunk penuh — hanya dua VLAN dengan perlakuan khusus.

---

## 3. 802.1Q — Tagging

Standar IEEE untuk menandai frame dengan nomor VLAN.

### Struktur tag

Tag 4 byte disisipkan **setelah MAC source**, sebelum EtherType asli:

```
Frame tanpa tag:
┌──────────┬──────────┬───────────┬─────────┬─────┐
│ MAC Dest │ MAC Src  │ EtherType │ Payload │ FCS │
└──────────┴──────────┴───────────┴─────────┴─────┘

Frame dengan tag 802.1Q:
┌──────────┬──────────┬─────────────────┬───────────┬─────────┬─────┐
│ MAC Dest │ MAC Src  │  802.1Q TAG     │ EtherType │ Payload │ FCS │
│          │          │    (4 byte)     │           │         │     │
└──────────┴──────────┴─────────────────┴───────────┴─────────┴─────┘
                       └─── TPID ─┴─ TCI ┘
                        (2 byte) (2 byte)
```

**TPID** (*Tag Protocol Identifier*) = `0x8100` — menandai "ada tag VLAN di sini".

**TCI** (*Tag Control Information*) = 16 bit:
```
┌─────────┬─────┬──────────────────┐
│ PCP     │ DEI │      VID         │
│ 3 bit   │1 bit│    12 bit        │
└─────────┴─────┴──────────────────┘
```

| Field | Bit | Fungsi |
|---|---|---|
| **PCP** (*Priority Code Point*) | 3 | Prioritas QoS layer 2 (CoS), nilai 0–7 |
| **DEI** (*Drop Eligible Indicator*) | 1 | Dulu CFI; menandai frame yang boleh dibuang duluan saat congestion |
| **VID** (*VLAN Identifier*) | 12 | Nomor VLAN, 0–4095 |

⚠️ **VID 12 bit → maksimum 4096 VLAN.** Inilah batasan mendasar yang mendorong lahirnya **VXLAN** (24 bit VNI = 16 juta segmen) untuk data center dan cloud multi-tenant (`16-datacenter-cloud-sdn/02`).

Frame dengan tag menjadi **1522 byte** (dari 1518). Switch harus mendukung "baby giant".

### Rentang VLAN ID

| Rentang | Nama | Keterangan |
|---|---|---|
| **0** | Reserved | Hanya untuk prioritas (priority tagging), bukan VLAN |
| **1** | Default VLAN | Tidak bisa dihapus atau diganti nama |
| **2–1001** | Normal range | Disimpan di `vlan.dat`, didukung VTP v1/v2 |
| 1002–1005 | Reserved | Token Ring & FDDI (warisan, tidak bisa dihapus) |
| **1006–4094** | Extended range | Disimpan di running-config, butuh VTP transparent atau v3 |
| 4095 | Reserved | — |

CCNA berfokus pada **normal range (1–1005)**.

---

## 4. Default VLAN, Native VLAN, Management VLAN

Tiga istilah yang sering tertukar. Pahami perbedaannya.

| Istilah | Arti | Default |
|---|---|---|
| **Default VLAN** | VLAN tempat semua port berada saat switch baru | VLAN 1 |
| **Native VLAN** | VLAN yang frame-nya dikirim **tanpa tag** di trunk | VLAN 1 |
| **Management VLAN** | VLAN yang dipakai untuk mengakses switch (SSH, SNMP) | VLAN 1 (sebaiknya diubah!) |

### Native VLAN — cara kerja

```
Di trunk:
  Frame VLAN 10  → dikirim DENGAN tag (VID=10)
  Frame VLAN 20  → dikirim DENGAN tag (VID=20)
  Frame VLAN 999 → dikirim TANPA tag  ← ini native VLAN
```

Kenapa ada native VLAN? Warisan dari masa ketika perangkat lama (hub, beberapa AP) tidak memahami tagging. Frame tanpa tag yang masuk trunk diasumsikan milik native VLAN.

⚠️ **Native VLAN mismatch** — jika dua sisi trunk punya native VLAN berbeda:
```
SW1 trunk: native VLAN 1
SW2 trunk: native VLAN 99

→ Frame VLAN 1 dari SW1 dikirim tanpa tag
→ SW2 menerima frame tanpa tag → memasukkannya ke VLAN 99
→ TRAFIK BOCOR ANTAR-VLAN
```

CDP akan memperingatkan:
```
%CDP-4-NATIVE_VLAN_MISMATCH: Native VLAN mismatch discovered on
GigabitEthernet0/24 (1), with SW2 GigabitEthernet0/24 (99)
```

### Praktik terbaik keamanan

```
1. JANGAN pakai VLAN 1 untuk apa pun (data, native, atau manajemen)
2. Ubah native VLAN ke VLAN yang tidak dipakai (mis. 999)
3. JANGAN izinkan native VLAN membawa trafik pengguna
4. Pindahkan port yang tidak dipakai ke VLAN "parkir" dan shutdown
5. Gunakan VLAN terpisah untuk manajemen
```

```
SW1(config)# vlan 999
SW1(config-vlan)# name PARKIR-UNUSED
SW1(config)# interface range gi0/20-24
SW1(config-if-range)# switchport mode access
SW1(config-if-range)# switchport access vlan 999
SW1(config-if-range)# shutdown

SW1(config)# interface gi0/48
SW1(config-if)# switchport trunk native vlan 998
SW1(config-if)# switchport trunk allowed vlan 10,20,30
```

Alasan menghindari VLAN 1: ia adalah default di semua perangkat, sehingga menjadi target serangan **VLAN hopping** (`12-keamanan/02`), dan protokol kendali (CDP, VTP, DTP, PAgP) berjalan di sana.

---

## 5. DTP — Dynamic Trunking Protocol

Protokol proprietary Cisco yang menegosiasikan apakah sebuah port menjadi access atau trunk secara otomatis.

| Mode | Perilaku |
|---|---|
| `dynamic auto` | Menjadi trunk **hanya jika** sisi lain meminta |
| `dynamic desirable` | **Aktif meminta** menjadi trunk |
| `trunk` | Selalu trunk, dan mengirim DTP |
| `access` | Selalu access |
| `nonegotiate` | Matikan DTP sepenuhnya |

Matriks hasil:

| | access | dynamic auto | dynamic desirable | trunk |
|---|---|---|---|---|
| **access** | access | access | access | ⚠️ salah |
| **dynamic auto** | access | **access** | trunk | trunk |
| **dynamic desirable** | access | trunk | trunk | trunk |
| **trunk** | ⚠️ salah | trunk | trunk | trunk |

⚠️ **Dua port `dynamic auto` menghasilkan ACCESS, bukan trunk** — karena tidak ada yang meminta. Ini jebakan lab yang sangat umum.

### DTP adalah risiko keamanan

Penyerang yang mencolokkan laptop ke port `dynamic auto`/`desirable` bisa mengirim frame DTP dan **memaksa port menjadi trunk** — lalu mengakses semua VLAN (serangan *switch spoofing*).

**Selalu matikan DTP:**
```
# Untuk port access
SW1(config-if)# switchport mode access
SW1(config-if)# switchport nonegotiate

# Untuk port trunk
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport nonegotiate
```

```
SW1# show interfaces gi0/24 switchport
Name: Gi0/24
Switchport: Enabled
Administrative Mode: trunk
Operational Mode: trunk
Administrative Trunking Encapsulation: dot1q
Negotiation of Trunking: Off         ← nonegotiate aktif ✅
Access Mode VLAN: 1 (default)
Trunking Native Mode VLAN: 999
Trunking VLANs Enabled: 10,20,30
```

---

## 6. Inter-VLAN Routing

VLAN memisahkan broadcast domain. Untuk berkomunikasi antar-VLAN, **wajib ada routing**.

### Metode 1: Router dengan interface terpisah (legacy)

Satu interface router per VLAN. Boros port, tidak scalable. Hanya untuk pemahaman historis.

### Metode 2: Router-on-a-Stick (ROAS)

Satu interface fisik router dibagi menjadi **subinterface**, satu per VLAN, terhubung ke trunk switch.

```
   [SW]═══trunk═══[Router]
    │
  VLAN 10, 20, 30
```

**Konfigurasi router:**
```
R1(config)# interface gi0/0
R1(config-if)# no ip address
R1(config-if)# no shutdown

R1(config)# interface gi0/0.10
R1(config-subif)# encapsulation dot1Q 10
R1(config-subif)# ip address 192.168.10.1 255.255.255.0

R1(config)# interface gi0/0.20
R1(config-subif)# encapsulation dot1Q 20
R1(config-subif)# ip address 192.168.20.1 255.255.255.0

R1(config)# interface gi0/0.999
R1(config-subif)# encapsulation dot1Q 999 native    ← untuk native VLAN
R1(config-subif)# ip address 192.168.99.1 255.255.255.0
```

**Konfigurasi switch:**
```
SW1(config)# interface gi0/24
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk allowed vlan 10,20,999
SW1(config-if)# switchport trunk native vlan 999
```

⚠️ **Kelemahan ROAS:** semua trafik antar-VLAN harus naik ke router dan turun lagi lewat **satu link fisik yang sama** — link itu menjadi bottleneck. Untuk jaringan kecil masih baik; untuk jaringan besar gunakan metode 3.

### Metode 3: Multilayer Switch dengan SVI (direkomendasikan)

Switch layer 3 melakukan routing sendiri, di hardware (ASIC) — sangat cepat, tanpa bottleneck.

```
SW1(config)# ip routing                          ← WAJIB!

SW1(config)# interface vlan 10
SW1(config-if)# ip address 192.168.10.1 255.255.255.0
SW1(config-if)# no shutdown

SW1(config)# interface vlan 20
SW1(config-if)# ip address 192.168.20.1 255.255.255.0
SW1(config-if)# no shutdown
```

Verifikasi:
```
SW1# show ip route
C    192.168.10.0/24 is directly connected, Vlan10
C    192.168.20.0/24 is directly connected, Vlan20

SW1# show ip interface brief | include Vlan
Vlan10   192.168.10.1   YES manual up    up
Vlan20   192.168.20.1   YES manual up    up
```

### Perbandingan

| | ROAS | SVI (multilayer switch) |
|---|---|---|
| Kecepatan | Terbatas link trunk & CPU router | Wire-speed (ASIC) |
| Skalabilitas | Rendah | Tinggi |
| Biaya | Router murah bisa dipakai | Butuh switch L3 |
| Untuk | Jaringan kecil, lab | **Standar enterprise** |

---

## 7. VTP — VLAN Trunking Protocol

Protokol Cisco untuk menyinkronkan database VLAN antar-switch dalam satu **domain VTP**.

### Mode

| Mode | Membuat/hapus VLAN | Meneruskan iklan | Menyimpan database |
|---|---|---|---|
| **Server** | ✅ Ya | ✅ Ya | ✅ Ya (`vlan.dat`) |
| **Client** | ❌ Tidak | ✅ Ya | ❌ Tidak (v1/v2) |
| **Transparent** | ✅ Ya (lokal saja) | ✅ Meneruskan (v2+) | ✅ Ya (running-config) |
| **Off** (v3) | ✅ Lokal | ❌ Tidak | ✅ Ya |

### Cara kerja & bahaya

Setiap perubahan VLAN menaikkan **revision number**. Switch dengan revision number **lebih tinggi** akan menimpa database switch lain dalam domain yang sama.

⚠️ **Skenario bencana yang benar-benar sering terjadi:**
```
1. Anda mengambil switch bekas dari lab (VTP domain sama, revision 150)
2. Menghubungkannya ke jaringan produksi (revision 47)
3. Switch lab punya revision LEBIH TINGGI
4. Seluruh database VLAN produksi DITIMPA oleh database lab
5. Semua VLAN hilang → seluruh jaringan mati
```

**Pencegahan sebelum menghubungkan switch apa pun:**
```
SW-BARU# show vtp status              ← periksa domain & revision
SW-BARU(config)# vtp mode transparent ← reset revision ke 0
SW-BARU(config)# vtp mode client      (kalau memang mau jadi client)
   atau: hapus vlan.dat dan reload
SW-BARU# delete flash:vlan.dat
SW-BARU# reload
```

### Rekomendasi praktik

💡 **Banyak organisasi mematikan VTP sepenuhnya** (`vtp mode transparent` atau `off`) dan mengelola VLAN lewat otomasi/konfigurasi eksplisit. Risiko VTP lebih besar daripada manfaatnya di jaringan modern yang punya otomasi.

Jika tetap memakai VTP: gunakan **VTPv3** yang punya perlindungan (primary server explicit, password, dukungan extended VLAN).

```
SW1(config)# vtp domain PERUSAHAAN
SW1(config)# vtp mode transparent
SW1(config)# vtp version 3
SW1(config)# vtp password RahasiaKuat123
SW1# show vtp status
SW1# show vtp password
```

### VTP Pruning

Fitur yang mencegah trafik broadcast VLAN dikirim ke trunk yang tidak punya port aktif di VLAN itu. Menghemat bandwidth.

```
SW1(config)# vtp pruning
```

Alternatif manual yang lebih eksplisit dan aman: `switchport trunk allowed vlan`.

---

## 8. Private VLAN (PVLAN)

Memisahkan port **di dalam satu VLAN** — berguna untuk hosting, hotel, dan DMZ di mana banyak perangkat harus mencapai gateway tetapi tidak boleh saling menjangkau.

| Jenis port | Bisa bicara dengan |
|---|---|
| **Promiscuous** | Semua port (biasanya gateway/router) |
| **Isolated** | **Hanya** promiscuous — tidak dengan isolated lain |
| **Community** | Promiscuous + community lain di grup yang sama |

```
SW1(config)# vtp mode transparent          ← PVLAN butuh transparent
SW1(config)# vlan 100
SW1(config-vlan)# private-vlan primary
SW1(config-vlan)# private-vlan association 101,102
SW1(config)# vlan 101
SW1(config-vlan)# private-vlan isolated
SW1(config)# vlan 102
SW1(config-vlan)# private-vlan community

SW1(config)# interface gi0/1
SW1(config-if)# switchport mode private-vlan promiscuous
SW1(config-if)# switchport private-vlan mapping 100 101,102

SW1(config)# interface range gi0/2-10
SW1(config-if-range)# switchport mode private-vlan host
SW1(config-if-range)# switchport private-vlan host-association 100 101
```

**Alternatif sederhana** yang cukup untuk banyak kasus:
```
SW1(config-if)# switchport protected     ← port protected tidak bisa saling bicara
```
(Berlaku hanya dalam satu switch, tidak lintas switch.)

---

## 9. Perintah Verifikasi & Troubleshooting

```
SW1# show vlan brief
VLAN Name              Status    Ports
---- ----------------- --------- -------------------------------
1    default           active    Gi0/13, Gi0/14
10   STAFF             active    Gi0/1, Gi0/2, Gi0/3
20   SERVER            active    Gi0/15, Gi0/16
999  PARKIR            active    Gi0/20, Gi0/21

SW1# show interfaces trunk
Port      Mode  Encapsulation  Status    Native vlan
Gi0/24    on    802.1q         trunking  999

Port      Vlans allowed on trunk
Gi0/24    10,20,30

Port      Vlans allowed and active in management domain
Gi0/24    10,20

Port      Vlans in spanning tree forwarding state and not pruned
Gi0/24    10,20

SW1# show interfaces gi0/5 switchport
SW1# show vlan id 10
SW1# show mac address-table vlan 10
SW1# show vtp status
```

### Membaca `show interfaces trunk` dengan benar

Empat blok output punya arti berbeda:
1. **Vlans allowed on trunk** — yang dikonfigurasi dengan `switchport trunk allowed vlan`.
2. **Vlans allowed and active** — yang ada di allowed **dan** benar-benar ada di database VLAN switch ini.
3. **Vlans in forwarding state and not pruned** — yang benar-benar melewatkan trafik saat ini (setelah STP dan pruning).

⚠️ Kalau VLAN muncul di blok 1 tetapi tidak di blok 2 → VLAN itu **belum dibuat** di switch ini. Kalau ada di blok 2 tetapi tidak di blok 3 → **STP memblok** atau **pruning** memangkasnya.

### Alur troubleshooting VLAN

```
Dua PC di VLAN yang sama tidak bisa ping:
1. show vlan brief             → apakah kedua port benar-benar di VLAN yang sama?
2. show interfaces status      → apakah kedua port up?
3. show interfaces switchport  → mode access? VLAN benar?
4. show mac address-table      → apakah MAC kedua PC terlihat?
5. Cek IP & subnet mask di PC  → apakah di subnet yang sama?
6. Cek firewall di PC          → Windows Firewall sering memblok ping

Dua PC di VLAN sama tapi switch berbeda tidak bisa ping:
1. show interfaces trunk       → apakah trunk up dan VLAN diizinkan?
2. Apakah VLAN ada di KEDUA switch? (show vlan brief di masing-masing)
3. show spanning-tree vlan 10  → apakah ada port blocking di jalur?
4. Native VLAN cocok? (show interfaces trunk, cek log CDP mismatch)

PC tidak bisa ping gateway:
1. Apakah SVI/subinterface router ada dan up?
2. Apakah VLAN diizinkan di trunk menuju router/SVI?
3. Apakah IP gateway di PC benar?
4. show ip route (di L3 switch) → apakah subnet muncul sebagai connected?
5. Apakah `ip routing` sudah diaktifkan (multilayer switch)?
```

---

## 10. Desain VLAN yang Baik

### Penomoran

Pakai skema yang bermakna dan konsisten:
```
VLAN 1     : TIDAK DIPAKAI (default, hindari)
VLAN 10    : Staff / Data
VLAN 20    : Server
VLAN 30    : Tamu (guest)
VLAN 40    : CCTV / IoT
VLAN 50    : Printer
VLAN 110   : Voice (konvensi: data VLAN + 100)
VLAN 900   : Manajemen perangkat jaringan
VLAN 998   : Native VLAN (tidak dipakai untuk trafik)
VLAN 999   : Parkir port tidak terpakai
```

Untuk jaringan multi-lantai/gedung, sebagian organisasi memakai skema berbasis lokasi:
```
VLAN 1xy : Lantai 1, kelompok y
VLAN 2xy : Lantai 2, kelompok y
```

### Prinsip

1. **Satu VLAN = satu subnet.** Selalu.
2. **Petakan VLAN ke subnet secara sistematis** agar mudah diingat:
   ```
   VLAN 10 → 192.168.10.0/24
   VLAN 20 → 192.168.20.0/24
   ```
3. **Jangan buat VLAN terlalu besar.** Sekitar 200–500 host per VLAN adalah batas nyaman; lebih dari itu, broadcast dan failure domain menjadi terlalu besar.
4. **Jangan buat VLAN terlalu banyak tanpa alasan.** Setiap VLAN menambah kompleksitas routing dan ACL.
5. **Batasi span VLAN.** VLAN yang membentang ke seluruh kampus memperbesar failure domain STP. Praktik modern: batasi VLAN pada satu switch access atau satu blok distribution (routed access design).
6. **Dokumentasikan** setiap VLAN: nomor, nama, subnet, gateway, kegunaan, siapa pemiliknya.

---

## 11. Kesalahan Umum

⚠️ **1. Lupa membuat VLAN di switch tujuan.** Trunk mengizinkan VLAN 30, tetapi VLAN 30 tidak ada di switch seberang → trafik hilang.

⚠️ **2. Native VLAN mismatch.** Trafik bocor antar-VLAN.

⚠️ **3. Membiarkan DTP aktif.** Risiko VLAN hopping.

⚠️ **4. Lupa `ip routing` di multilayer switch.** SVI ada, tetapi tidak ada routing.

⚠️ **5. Menghubungkan switch bekas tanpa mereset VTP.** Bisa menghapus seluruh database VLAN produksi.

⚠️ **6. Memakai VLAN 1 untuk manajemen atau data.** Target serangan, dan bercampur dengan protokol kendali.

⚠️ **7. `switchport trunk allowed vlan 10` menimpa daftar sebelumnya.** Gunakan `add`/`remove`:
```
SW1(config-if)# switchport trunk allowed vlan add 40
SW1(config-if)# switchport trunk allowed vlan remove 30
```
Menjalankan `switchport trunk allowed vlan 40` saja akan **menghapus** VLAN 10, 20, 30 dari trunk — outage instan.

⚠️ **8. Mengira VLAN memberi keamanan sempurna.** VLAN adalah pemisahan **logis**, bukan enkripsi. Trafik antar-VLAN harus difilter di router/firewall, dan serangan VLAN hopping tetap mungkin jika konfigurasi lemah.

---

## MikroTik RouterOS

VLAN di RouterOS bisa dikonfigurasi dengan **dua pendekatan**. Memilih yang salah adalah kesalahan pemula paling umum.

### Pendekatan 1: Bridge VLAN Filtering (DIREKOMENDASIKAN)

Ini cara modern yang setara dengan switch sungguhan dan **mendukung hardware offload**.

```
# 1. Buat bridge dengan VLAN filtering (aktifkan BELAKANGAN!)
/interface bridge add name=bridge-LAN vlan-filtering=no protocol-mode=rstp

# 2. Tambahkan semua port
/interface bridge port add bridge=bridge-LAN interface=ether2 pvid=10
/interface bridge port add bridge=bridge-LAN interface=ether3 pvid=10
/interface bridge port add bridge=bridge-LAN interface=ether4 pvid=20
/interface bridge port add bridge=bridge-LAN interface=ether5 pvid=1
   # pvid = VLAN untuk frame TANPA TAG yang masuk (= access VLAN)

# 3. Definisikan keanggotaan VLAN
/interface bridge vlan add bridge=bridge-LAN vlan-ids=10 \
    untagged=ether2,ether3 tagged=bridge-LAN,ether5
/interface bridge vlan add bridge=bridge-LAN vlan-ids=20 \
    untagged=ether4 tagged=bridge-LAN,ether5
   # ether5 = TRUNK (tagged untuk VLAN 10 dan 20)
   # bridge-LAN sendiri harus "tagged" agar router bisa ikut di VLAN itu

# 4. Buat interface VLAN untuk routing (= SVI)
/interface vlan add name=vlan10 interface=bridge-LAN vlan-id=10
/interface vlan add name=vlan20 interface=bridge-LAN vlan-id=20
/ip address add address=192.168.10.1/24 interface=vlan10
/ip address add address=192.168.20.1/24 interface=vlan20

# 5. BARU aktifkan VLAN filtering (setelah semuanya siap!)
/interface bridge set bridge-LAN vlan-filtering=yes
```

⚠️ **Aktifkan `vlan-filtering=yes` PALING AKHIR.** Kalau diaktifkan sebelum keanggotaan VLAN dan pvid dikonfigurasi, **Anda akan langsung terputus** dari perangkat. Selalu gunakan **Safe Mode (Ctrl+X)**.

⚠️ **`bridge-LAN` harus dimasukkan sebagai `tagged`** pada setiap VLAN yang perlu dirutekan router. Kalau lupa, interface VLAN tidak akan menerima trafik — gejala klasik "VLAN dibuat tapi tidak bisa ping gateway".

### Pendekatan 2: VLAN Interface Langsung (untuk router, bukan switch)

```
# VLAN langsung di atas port fisik — tanpa bridge
/interface vlan add name=vlan10 interface=ether1 vlan-id=10
/interface vlan add name=vlan20 interface=ether1 vlan-id=20
/ip address add address=192.168.10.1/24 interface=vlan10
/ip address add address=192.168.20.1/24 interface=vlan20
```

Ini setara **router-on-a-stick** di Cisco. Cocok kalau MikroTik hanya bertindak sebagai router dan switching dilakukan perangkat lain.

⚠️ **Jangan mencampur kedua pendekatan pada port yang sama** — hasilnya perilaku yang tidak terduga.

### Verifikasi

```
/interface bridge vlan print
/interface bridge port print
/interface vlan print
/interface bridge host print where vlan-id=10

# Lihat VLAN mana yang aktif di port mana
/interface bridge vlan print detail
```

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `switchport mode access` + `switchport access vlan 10` | `/interface bridge port set X pvid=10` + masuk `untagged=` |
| `switchport mode trunk` | port masuk `tagged=` pada beberapa VLAN |
| `switchport trunk allowed vlan 10,20` | `/interface bridge vlan add vlan-ids=10,20 tagged=X` |
| Native VLAN | `pvid` pada port trunk |
| `interface vlan 10` (SVI) | `/interface vlan add vlan-id=10 interface=bridge` |
| `show vlan brief` | `/interface bridge vlan print` |
| `show interfaces trunk` | `/interface bridge vlan print detail` |

💡 **Konsep `pvid` menggantikan native VLAN.** Frame tanpa tag yang masuk port diberi VLAN sesuai `pvid`; frame keluar dengan VLAN = `pvid` dikirim **tanpa tag** (kalau port terdaftar `untagged`).

⚠️ **VLAN filtering bisa mematikan hardware offload** pada beberapa model lama. Verifikasi dengan `/interface bridge port print` — cari flag `H`. Pada CRS3xx dan RB modern, VLAN filtering tetap di-offload.

---

## 12. Ringkasan

- VLAN = broadcast domain logis dalam satu switch fisik. **Satu VLAN = satu subnet.**
- **Access port** = satu VLAN, untuk end device, frame tanpa tag.
- **Trunk port** = banyak VLAN, frame bertag 802.1Q kecuali native VLAN.
- Tag 802.1Q: TPID `0x8100` + TCI (PCP 3 bit QoS, DEI 1 bit, **VID 12 bit** → maks 4096 VLAN).
- **Default VLAN** (1) ≠ **native VLAN** (tanpa tag di trunk) ≠ **management VLAN**.
- **Native VLAN harus cocok di kedua sisi trunk**, dan sebaiknya bukan VLAN 1 dan tidak membawa trafik pengguna.
- **Matikan DTP** (`switchport nonegotiate`) untuk mencegah VLAN hopping.
- Inter-VLAN routing: ROAS (subinterface, ada bottleneck) atau **SVI di multilayer switch** (wire-speed, standar enterprise). Jangan lupa `ip routing`.
- **VTP berbahaya** — revision number tinggi bisa menimpa database produksi. Reset switch bekas sebelum dihubungkan; pertimbangkan mode transparent/off.
- `switchport trunk allowed vlan X` **menimpa**; gunakan `add`/`remove`.

---

## 13. Latihan

1. Berapa VLAN maksimum secara teoretis pada 802.1Q, dan kenapa? Apa yang mengatasi batas ini di data center?
2. SW1 native VLAN 1, SW2 native VLAN 99, keduanya trunk. Apa yang terjadi pada trafik VLAN 1 dari SW1?
3. Kedua port trunk diset `dynamic auto`. Apakah trunk terbentuk? Jelaskan.
4. Anda menjalankan `switchport trunk allowed vlan 50` pada trunk yang sebelumnya mengizinkan VLAN 10,20,30. Apa akibatnya, dan bagaimana seharusnya?
5. PC di VLAN 10 tidak bisa ping gateway 192.168.10.1 yang ada di SVI switch. Sebutkan lima hal yang Anda periksa berurutan.
6. Kenapa `show interfaces trunk` bisa menampilkan VLAN di "allowed" tetapi tidak di "forwarding state"?
7. Anda diminta memasang switch bekas dari kantor cabang ke jaringan pusat. Apa yang Anda lakukan sebelum mencolokkan kabelnya?

<details>
<summary>Jawaban</summary>

1. **4096** (2¹² karena VID adalah 12 bit); praktisnya 4094 yang bisa dipakai (0 dan 4095 reserved). Di data center batas ini diatasi dengan **VXLAN** yang memakai VNI 24 bit → 16.777.216 segmen, cukup untuk multi-tenancy skala cloud.

2. Frame VLAN 1 dari SW1 dikirim **tanpa tag** (karena VLAN 1 adalah native-nya). SW2 menerima frame tanpa tag dan memasukkannya ke **VLAN 99** (native-nya). Akibatnya **trafik VLAN 1 bocor ke VLAN 99** — pelanggaran isolasi. CDP akan melaporkan `NATIVE_VLAN_MISMATCH`. Perbaikan: samakan native VLAN di kedua sisi.

3. **Tidak.** Kedua port akan menjadi **access port** di VLAN default. `dynamic auto` berarti "saya mau jadi trunk kalau diminta" — tetapi tidak ada yang meminta karena keduanya pasif. Minimal satu sisi harus `dynamic desirable` atau `trunk`.

4. Perintah itu **menimpa** daftar sebelumnya — trunk sekarang hanya mengizinkan VLAN 50, sehingga VLAN 10, 20, 30 **langsung terputus** (outage). Seharusnya: `switchport trunk allowed vlan add 50`.

5. (a) `show vlan brief` — apakah port PC benar-benar di VLAN 10? (b) `show interfaces status` — apakah port up? (c) `show ip interface brief | include Vlan10` — apakah SVI up/up? Jika down, apakah ada port aktif di VLAN 10 dan VLAN-nya ada di database? (d) `show running-config | include ip routing` — apakah routing diaktifkan (untuk komunikasi antar-VLAN; untuk ping ke SVI sendiri tidak wajib). (e) Cek konfigurasi IP di PC: alamat, mask, dan gateway benar? (f) Cek ACL pada SVI dan firewall di PC.

6. Beberapa kemungkinan: (a) VLAN itu **belum dibuat** di switch ini, sehingga tidak "active"; (b) **STP memblok** port trunk untuk VLAN tersebut (ada jalur redundan); (c) **VTP pruning** memangkasnya karena tidak ada port aktif di VLAN itu pada sisi seberang; (d) sisi lain trunk tidak mengizinkan VLAN tersebut.

7. (a) Nyalakan switch **terisolasi** (tidak terhubung ke jaringan produksi). (b) `show vtp status` — periksa domain dan **revision number**. (c) Reset database VLAN: `vtp mode transparent` (revision jadi 0), atau hapus `vlan.dat` (`delete flash:vlan.dat`) lalu `reload`. (d) Hapus konfigurasi lama (`write erase` + `reload`) dan terapkan konfigurasi baru yang sesuai standar. (e) Periksa versi IOS dan lakukan upgrade jika perlu. (f) Verifikasi konfigurasi trunk/native VLAN sebelum menyambungkan uplink.

</details>

---

## 14. Sumber

- IEEE 802.1Q-2022 — Virtual Bridged Local Area Networks
- Cisco CCNA 200-301 v1.1, topik 2.1 (VLAN normal range, access port data & voice, default VLAN, InterVLAN connectivity) dan 2.2 (trunk, 802.1Q, native VLAN)
- Cisco, *VLAN Security White Paper*
- RFC 7348 — VXLAN (solusi untuk batas 4096 VLAN)

---

**Berikutnya:** `03-data-link/04-stp.md` — mencegah loop yang bisa melumpuhkan jaringan dalam hitungan detik.

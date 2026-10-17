# 03.2 Cara Kerja Switch

> **Prasyarat:** `03-data-link/01`
> **Tujuan:** Anda bisa menjelaskan proses forwarding switch langkah demi langkah, membaca MAC address table, dan memahami keterbatasan hardware switch.

---

## 1. Lima Fungsi Dasar Switch

Setiap switch melakukan lima hal ini, dan hanya lima hal ini:

```
1. LEARNING   — mempelajari MAC address dari frame yang masuk
2. FLOODING   — mengirim ke semua port jika tujuan tidak diketahui
3. FORWARDING — mengirim ke port yang tepat jika tujuan diketahui
4. FILTERING  — TIDAK mengirim kembali ke port asal
5. AGING      — menghapus entri lama dari tabel
```

Ditambah satu fungsi kendali:
```
6. LOOP PREVENTION — menjalankan STP (dibahas di 03-data-link/04)
```

---

## 2. MAC Address Table (CAM Table)

Switch menyimpan pemetaan **MAC address → port** dalam tabel.

```
SW1# show mac address-table

          Mac Address Table
-------------------------------------------
Vlan    Mac Address       Type        Ports
----    -----------       --------    -----
  10    001a.2b3c.4d5e    DYNAMIC     Gi0/1
  10    00aa.bbcc.ddee    DYNAMIC     Gi0/2
  10    0011.2233.4455    STATIC      Gi0/24
  20    00ff.eedd.ccbb    DYNAMIC     Gi0/5
Total Mac Addresses for this criterion: 4
```

Kolom penting:
- **Vlan** — tabel dipisah per VLAN (MAC yang sama bisa ada di VLAN berbeda).
- **Type** — `DYNAMIC` (dipelajari otomatis) atau `STATIC` (dikonfigurasi manual / port security).
- **Ports** — port tempat MAC itu terlihat.

Disebut juga **CAM table** (*Content Addressable Memory*) karena memakai memori khusus yang bisa dicari berdasarkan isi, bukan alamat — sangat cepat, satu siklus clock.

---

## 3. Proses Forwarding Langkah demi Langkah

Skenario: PC-A (`aaaa.aaaa.aaaa`) di port Gi0/1 mengirim ke PC-B (`bbbb.bbbb.bbbb`) di port Gi0/2. Tabel kosong.

### Frame pertama (A → B)

```
1. Frame masuk di Gi0/1
   Source MAC: aaaa.aaaa.aaaa
   Dest MAC:   bbbb.bbbb.bbbb

2. LEARNING
   Switch mencatat: aaaa.aaaa.aaaa ada di Gi0/1, VLAN 10
   → tabel sekarang punya 1 entri

3. Cari dest MAC (bbbb.bbbb.bbbb) di tabel
   → TIDAK ADA

4. FLOODING (unknown unicast flooding)
   Kirim frame ke SEMUA port di VLAN 10, KECUALI Gi0/1 (filtering)
   → PC-B menerima ✅
   → PC lain juga menerima, tapi membuangnya karena MAC tujuan bukan miliknya
```

### Frame balasan (B → A)

```
1. Frame masuk di Gi0/2
   Source MAC: bbbb.bbbb.bbbb
   Dest MAC:   aaaa.aaaa.aaaa

2. LEARNING
   Switch mencatat: bbbb.bbbb.bbbb ada di Gi0/2
   → tabel sekarang punya 2 entri

3. Cari dest MAC (aaaa.aaaa.aaaa)
   → ADA di Gi0/1

4. FORWARDING
   Kirim HANYA ke Gi0/1 ✅
```

### Frame berikutnya

Semua frame A↔B sekarang diteruskan langsung tanpa flooding. Inilah keunggulan switch dibanding hub.

> [!TIP]
> **Poin kunci:** switch belajar dari **source MAC**, dan memutuskan berdasarkan **destination MAC**. Ini sering tertukar oleh pemula.

---

## 4. Aging

Entri dinamis punya timer. Default Cisco: **300 detik (5 menit)**.

```
Setiap frame dari MAC itu → timer direset
Tidak ada frame selama 300 detik → entri DIHAPUS
```

Kenapa perlu aging?
- Perangkat pindah port (laptop dicabut, dipasang di ruang lain)
- Perangkat dimatikan
- Tabel punya kapasitas terbatas

```
SW1(config)# mac address-table aging-time 600
SW1# show mac address-table aging-time
```

> [!WARNING]
> **Aging time terlalu lama** → tabel penuh dengan entri basi, perangkat yang pindah tidak terjangkau sampai entri kedaluwarsa.
> ⚠️ **Aging time terlalu pendek** → sering flooding, membuang bandwidth.

> [!TIP]
> **Interaksi dengan ARP cache:** ARP cache host biasanya 4 jam (Linux) atau 2 jam, sementara MAC table switch hanya 5 menit. Ini bisa menyebabkan **unicast flooding terus-menerus**: host masih tahu MAC tujuan (dari ARP cache) sehingga mengirim unicast, tetapi switch sudah melupakan port-nya sehingga harus flooding. Solusinya: samakan aging time MAC table dengan ARP timeout, atau perpendek ARP timeout.

---

## 5. MAC Move dan MAC Flapping

**MAC move** — MAC yang sama tiba-tiba terlihat di port berbeda. Switch memperbarui tabel.

Normal terjadi saat: laptop dipindah port, VM migrasi, failover NIC.

**MAC flapping** — MAC berpindah-pindah antar-port berulang kali dalam waktu singkat. **Ini abnormal.**

```
%SW_MATM-4-MACFLAP_NOTIF: Host 001a.2b3c.4d5e in vlan 10 is flapping
between port Gi0/1 and port Gi0/12
```

Penyebab:
1. **Loop layer 2** (paling sering) — frame yang sama berputar dan kembali dari dua arah
2. Dua perangkat dengan MAC yang sama (duplikasi, VM cloning yang salah)
3. Konfigurasi NIC teaming/bonding yang tidak tepat
4. Perangkat berpindah cepat (roaming wireless — bisa normal)

> [!WARNING]
> **MAC flapping adalah alarm.** Kalau muncul, curigai loop terlebih dahulu — periksa STP.

---

## 6. Metode Switching

Bagaimana switch memutuskan kapan mulai meneruskan frame?

| Metode | Kapan mulai forward | Latency | Deteksi error |
|---|---|---|---|
| **Store-and-Forward** | Setelah seluruh frame diterima & FCS diperiksa | Tertinggi | ✅ Frame rusak dibuang |
| **Cut-Through** | Setelah membaca 6 byte MAC tujuan | Terendah | ❌ Frame rusak ikut diteruskan |
| **Fragment-Free** | Setelah 64 byte pertama | Sedang | Sebagian (menangkap runt/collision) |

### Store-and-Forward
```
[Frame masuk lengkap] → [Cek FCS] → [Forward atau buang]
```
- **Wajib** kalau kecepatan port masuk ≠ port keluar (mis. 1 G ke 10 G) — switch harus menyangga.
- **Wajib** untuk QoS yang perlu memeriksa isi paket.
- **Default pada hampir semua switch modern** — latency-nya sudah sangat kecil (mikrodetik) dan manfaat membuang frame rusak lebih besar.

### Cut-Through
```
[Baca 6 byte pertama] → [Forward langsung]
```
- Latency sangat rendah (~1 µs, tidak bergantung ukuran frame).
- Dipakai di: high-frequency trading, HPC, beberapa switch data center.
- Kelemahan: menyebarkan frame rusak ke seluruh jaringan.
- Beberapa switch memakai **adaptive cut-through**: mulai cut-through, otomatis beralih ke store-and-forward jika tingkat error naik.

---

## 7. Arsitektur Hardware Switch

Memahami ini menjelaskan banyak batasan praktis.

### ASIC

Switch modern tidak memproses frame dengan CPU. Ia memakai **ASIC** (*Application-Specific Integrated Circuit*) — chip khusus yang melakukan lookup MAC dan forwarding dalam hardware.

```
CPU switch   : menjalankan STP, CLI, SNMP, routing protocol, logging
               → "control plane"
ASIC         : meneruskan frame
               → "data plane"
```

> [!WARNING]
> **Konsekuensi penting:** trafik yang harus diproses CPU (disebut *punted* atau *process-switched*) jauh lebih lambat. Contoh: ACL yang tidak didukung hardware, paket dengan IP options, trafik ke alamat switch sendiri, atau debug yang aktif. Ini bisa membuat CPU switch 100% dan seluruh manajemen tidak responsif.

### Istilah kapasitas

| Istilah | Arti |
|---|---|
| **Switching capacity / backplane** | Total bandwidth yang bisa ditangani (Gbps) |
| **Forwarding rate** | Berapa paket per detik (pps) yang bisa diproses |
| **Wire-speed / line-rate** | Mampu meneruskan pada kecepatan penuh semua port bersamaan |
| **Non-blocking** | Tidak ada port yang harus menunggu port lain |
| **Oversubscription** | Kapasitas port melebihi kapasitas backplane/uplink |

**Contoh perhitungan wire-speed:**
```
Switch 48 port × 1 Gbps + 4 port × 10 Gbps
Kapasitas maksimum = (48 × 1) + (4 × 10) = 88 Gbps
Full duplex → butuh 2 × 88 = 176 Gbps backplane untuk non-blocking

Kalau spesifikasi menyebut "Switching capacity 176 Gbps" → non-blocking ✅
Kalau menyebut "88 Gbps" → blocking pada beban penuh
```

**Forwarding rate dalam pps:**
```
1 Gbps dengan frame minimum 64 byte (+ 20 byte preamble/IFG = 84 byte):
1.000.000.000 / (84 × 8) = 1.488.095 pps per port

48 port × 1,488 Mpps = 71,4 Mpps
Kalau spesifikasi menyebut "Forwarding rate 130 Mpps" → aman ✅
```

> [!TIP]
> Vendor sering mengiklankan angka backplane yang besar tetapi forwarding rate yang rendah. Untuk trafik dengan banyak paket kecil (VoIP, telemetri, DDoS), **forwarding rate (pps) lebih menentukan daripada bandwidth (Gbps)**.

### Ukuran MAC address table

| Kelas switch | Kapasitas tipikal |
|---|---|
| SOHO / unmanaged | 1.000-8.000 |
| Access enterprise | 8.000-32.000 |
| Distribution/core | 32.000-128.000 |
| Data center | 128.000-1.000.000+ |

> [!WARNING]
> Tabel penuh → switch mulai flooding semua trafik unknown unicast → kinerja jatuh dan trafik terekspos ke semua port. Inilah dasar serangan **MAC flooding** (`12-keamanan/02`).

```
SW1# show mac address-table count
Total Mac Addresses                  : 1247
Total Mac Address Space Available    : 6913
```

### Buffer

Switch punya memori untuk menyangga frame saat port keluar sibuk.

- **Shared buffer** — kolam bersama, fleksibel.
- **Dedicated per-port buffer** — terjamin, tetapi kurang efisien.

Masalah terkait buffer:
- **Microburst** — lonjakan trafik sangat singkat (mikrodetik) yang melebihi kapasitas port. Tidak terlihat di grafik SNMP 5 menit (yang menunjukkan utilisasi 20%), tetapi menyebabkan drop nyata. Deteksi: counter `output drops` naik padahal utilisasi rata-rata rendah.
- **Incast** — banyak server mengirim ke satu server bersamaan (pola umum di Hadoop/storage) → buffer penuh → drop.
- **Head-of-line blocking** — satu frame yang macet menahan frame di belakangnya.

```
SW1# show interfaces gi0/1 | include output drops
     Output queue: 0/40 (size/max), 15234 drops
SW1# show platform hardware ... (bergantung platform)
```

---

## 8. Layer 2 vs Layer 3 Switch

| | Layer 2 switch | Layer 3 / Multilayer switch |
|---|---|---|
| Keputusan berdasarkan | MAC address | MAC **dan** IP address |
| Bisa routing? | Tidak | **Ya** |
| Punya routing table? | Tidak | Ya |
| SVI (interface VLAN) | Hanya untuk manajemen | Untuk routing antar-VLAN |
| Routed port | Tidak | Ya |
| Harga | Lebih murah | Lebih mahal |

### SVI (Switched Virtual Interface)

Interface virtual yang mewakili sebuah VLAN pada layer 3.

```
SW1(config)# ip routing                    ← WAJIB, sering terlupa
SW1(config)# interface vlan 10
SW1(config-if)# ip address 192.168.10.1 255.255.255.0
SW1(config-if)# no shutdown
SW1(config)# interface vlan 20
SW1(config-if)# ip address 192.168.20.1 255.255.255.0
SW1(config-if)# no shutdown
```

Sekarang switch bisa merutekan antara VLAN 10 dan 20 — di hardware (ASIC), sehingga sangat cepat.

> [!WARNING]
> SVI hanya **up** jika: (a) VLAN-nya ada di database VLAN, dan (b) minimal satu port aktif di VLAN itu (atau trunk yang membawa VLAN itu). Ini sumber kebingungan umum: SVI dikonfigurasi tetapi tetap `down/down`.

### Routed Port

Port fisik switch yang diubah menjadi interface layer 3 murni (seperti port router).

```
SW1(config)# interface gi0/24
SW1(config-if)# no switchport            ← ubah jadi routed port
SW1(config-if)# ip address 10.0.0.1 255.255.255.252
SW1(config-if)# no shutdown
```

Dipakai untuk link antar-switch layer 3 (routed access design, link ke core).

---

## 9. Praktik Lengkap

### Melihat pembelajaran MAC secara langsung
```
SW1# clear mac address-table dynamic
SW1# show mac address-table
   (kosong)

... lakukan ping dari PC-A ke PC-B ...

SW1# show mac address-table
   (sekarang berisi kedua MAC)
```

### Perintah penting
```
SW1# show mac address-table
SW1# show mac address-table dynamic
SW1# show mac address-table vlan 10
SW1# show mac address-table address 001a.2b3c.4d5e
SW1# show mac address-table interface gi0/1
SW1# show mac address-table count
SW1# show mac address-table aging-time

SW1(config)# mac address-table static 0011.2233.4455 vlan 10 interface gi0/5
SW1(config)# mac address-table aging-time 600
SW1# clear mac address-table dynamic [interface gi0/1 | vlan 10]
```

### Melacak perangkat berdasarkan MAC
Skenario nyata: Anda punya MAC address dan harus menemukan perangkat fisiknya.

```
1. Di switch distribution:
   SW-DIST# show mac address-table address 001a.2b3c.4d5e
   → terlihat di port Gi1/0/24 (uplink ke SW-ACCESS-3)

2. Ikuti ke switch berikutnya:
   SW-DIST# show cdp neighbors gi1/0/24
   → SW-ACCESS-3

3. Di SW-ACCESS-3:
   SW-ACCESS-3# show mac address-table address 001a.2b3c.4d5e
   → terlihat di port Gi0/12  ← INI PORT FISIKNYA

4. Konfirmasi:
   SW-ACCESS-3# show interfaces gi0/12 description
   SW-ACCESS-3# show cdp neighbors gi0/12   (kalau perangkatnya mendukung CDP)
```

Ini keterampilan harian. Otomasinya dibahas di `15-otomasi/03`.

### Di Linux (Linux bridge juga adalah switch)
```bash
$ bridge fdb show                    # MAC table
$ bridge fdb show br0
$ bridge link show
$ ip -d link show br0                # detail bridge

# Buat bridge (switch software)
$ sudo ip link add br0 type bridge
$ sudo ip link set eth1 master br0
$ sudo ip link set eth2 master br0
$ sudo ip link set br0 up
```

---

## 10. Kesalahan Umum

> [!WARNING]
> **1. Mengira switch membaca IP address.** Switch L2 hanya membaca MAC (dan tag VLAN). Ia tidak tahu apa itu subnet.

> [!WARNING]
> **2. Mengira flooding = broadcast.** Berbeda. Flooding adalah **perilaku switch** terhadap unicast yang tujuannya belum diketahui; broadcast adalah **jenis alamat tujuan**.

> [!WARNING]
> **3. Lupa `ip routing` pada multilayer switch.** SVI dikonfigurasi tetapi routing tidak jalan.

> [!WARNING]
> **4. Mengabaikan MAC flapping.** Hampir selalu berarti loop — masalah serius yang bisa melumpuhkan jaringan.

> [!WARNING]
> **5. Menilai kapasitas hanya dari Gbps.** Untuk paket kecil, **pps** yang menentukan.

> [!WARNING]
> **6. Menganggap "utilisasi 20%" berarti tidak ada congestion.** Microburst tidak terlihat di rata-rata 5 menit. Periksa `output drops`.

---

## MikroTik RouterOS

Di RouterOS, fungsi switch dilakukan oleh **bridge**. Pada perangkat dengan switch chip (CRS, hEX, RB), bridge bisa di-**offload ke hardware**.

```
# Buat bridge (= switch software/hardware)
/interface bridge add name=bridge-LAN protocol-mode=rstp

# Tambahkan port ke bridge
/interface bridge port add bridge=bridge-LAN interface=ether2
/interface bridge port add bridge=bridge-LAN interface=ether3
/interface bridge port add bridge=bridge-LAN interface=ether4

# Lihat MAC address table (= CAM table)
/interface bridge host print
/interface bridge host print where bridge=bridge-LAN
/interface bridge host print where !local        ← hanya MAC yang dipelajari

# Aging time
/interface bridge set bridge-LAN ageing-time=5m

# Cek apakah bridge di-offload ke hardware
/interface bridge port print detail
   # perhatikan kolom "hw-offload" atau "H" pada flags
```

> [!WARNING]
> **Hardware offload sangat penting untuk kinerja.** Kalau bridge tidak di-offload, setiap frame diproses **CPU** — throughput bisa turun dari gigabit menjadi puluhan Mbps. Fitur tertentu (mis. beberapa konfigurasi VLAN, bridge filter) **mematikan offload**. Selalu verifikasi:

```
/interface bridge port print
 # Flags: H - HW-OFFLOAD  ← ini yang Anda inginkan
```

```
# Statistik bridge
/interface bridge print stats
/interface bridge monitor bridge-LAN

# Bridge filter (setara ACL di layer 2)
/interface bridge filter add chain=forward src-mac-address=00:11:22:33:44:55/FF:FF:FF:FF:FF:FF action=drop

# Split-horizon (isolasi port dalam bridge, setara protected port)
/interface bridge port set [find interface=ether5] horizon=1
/interface bridge port set [find interface=ether6] horizon=1
   ← port dengan horizon sama TIDAK bisa saling berkomunikasi
```

> [!TIP]
> **`horizon`** adalah cara MikroTik melakukan port isolation — setara `switchport protected` di Cisco, tetapi lebih fleksibel karena berbasis nomor grup.

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `show mac address-table` | `/interface bridge host print` |
| `mac address-table aging-time` | `/interface bridge set X ageing-time=` |
| `switchport protected` | `/interface bridge port set X horizon=N` |
| VLAN interface (SVI) | `/interface vlan` + `/ip address` |
| `show interfaces status` | `/interface ethernet monitor` |

---

## 11. Ringkasan

- Switch: **learning** (dari source MAC), **flooding** (tujuan tidak dikenal), **forwarding** (tujuan dikenal), **filtering** (tidak balik ke port asal), **aging** (default 300 detik).
- MAC address table dipisah per VLAN; entri DYNAMIC atau STATIC.
- **Unknown unicast flooding** normal terjadi sekali, lalu berhenti setelah balasan diterima.
- **MAC flapping = curigai loop L2.**
- Store-and-forward (default, memeriksa FCS) vs cut-through (latency terendah) vs fragment-free.
- ASIC = data plane cepat; CPU = control plane. Trafik yang "punted" ke CPU jauh lebih lambat.
- Wire-speed butuh backplane = 2 × total kapasitas port (full duplex).
- Untuk paket kecil, **forwarding rate (pps)** lebih penting daripada Gbps.
- Multilayer switch merutekan di hardware lewat **SVI** (butuh `ip routing`) atau **routed port** (`no switchport`).
- Microburst & incast menyebabkan drop yang tidak terlihat di grafik rata-rata.

---

## 12. Latihan

1. PC-A mengirim frame pertama ke PC-B yang belum dikenal switch. Jelaskan langkah demi langkah apa yang dilakukan switch.
2. Switch 24 port gigabit + 2 port 10G. Berapa backplane minimum untuk non-blocking?
3. Sebuah switch mencatat `MACFLAP_NOTIF` antara Gi0/5 dan Gi0/18. Apa dugaan Anda dan apa langkah pertama?
4. Kenapa SVI bisa `down/down` walaupun sudah dikonfigurasi IP dan `no shutdown`?
5. Interface menunjukkan utilisasi rata-rata 15% tetapi `output drops` terus naik. Apa yang terjadi?
6. Jelaskan mengapa aging time MAC table yang jauh lebih pendek daripada ARP timeout host dapat menyebabkan flooding terus-menerus.
7. Kapan Anda memilih cut-through daripada store-and-forward?

<details>
<summary>Jawaban</summary>

1. (a) Frame masuk di port X. (b) **Learning**: switch mencatat source MAC PC-A pada port X di VLAN tersebut. (c) Switch mencari destination MAC PC-B di MAC address table — tidak ditemukan. (d) **Flooding**: frame dikirim ke semua port di VLAN yang sama **kecuali** port X (filtering). (e) PC-B menerima dan membalas; dari frame balasan itu switch mempelajari lokasi PC-B, sehingga frame berikutnya diteruskan langsung (forwarding).

2. Kapasitas port = (24 × 1) + (2 × 10) = 44 Gbps. Full duplex → **88 Gbps** backplane minimum untuk non-blocking.

3. **Loop layer 2.** Langkah pertama: periksa `show spanning-tree` — apakah STP berjalan dan apakah ada port yang seharusnya blocking tetapi forwarding. Periksa juga apakah ada kabel yang baru dipasang menghubungkan dua switch secara tidak sengaja, atau perangkat (mini-switch, IP phone dengan port PC) yang menciptakan jalur ganda. Kalau mendesak dan loop menyebabkan storm, matikan salah satu port untuk memutus loop, lalu investigasi. Kemungkinan lain: dua perangkat dengan MAC identik, atau NIC teaming salah konfigurasi.

4. SVI hanya naik jika: (a) VLAN-nya **ada di database VLAN** (`show vlan brief`), **dan** (b) minimal ada **satu port aktif** di VLAN itu — port access yang up, atau trunk yang membawa VLAN itu dalam keadaan forwarding. Jika semua port di VLAN tersebut down atau VLAN belum dibuat, SVI tetap down. (Pengecualian: perintah `no autostate` pada SVI.)

5. **Microburst.** Trafik datang dalam lonjakan sangat singkat (mikrodetik hingga milidetik) yang melebihi kapasitas port keluar, sehingga buffer penuh dan paket dibuang. Grafik SNMP dengan interval 5 menit merata-ratakan lonjakan ini menjadi 15%. Solusi: perbesar buffer jika memungkinkan, terapkan QoS, tingkatkan kecepatan uplink, atau distribusikan trafik. Deteksi lebih baik dengan polling interval sangat pendek atau streaming telemetry.

6. Host menyimpan pemetaan IP→MAC di ARP cache selama beberapa jam. Selama itu, host mengirim frame **unicast** langsung ke MAC tujuan tanpa ARP baru. Namun switch menghapus entri MAC tujuan setelah 300 detik jika perangkat itu **diam** (tidak mengirim apa pun). Akibatnya switch tidak tahu port tujuan dan harus **flooding setiap frame** ke seluruh VLAN — membuang bandwidth dan membocorkan trafik ke port lain. Sering terjadi pada server yang hanya menerima (mis. server backup, printer). Solusi: naikkan MAC aging time agar ≥ ARP timeout, atau perpendek ARP timeout, atau buat entri MAC statis.

7. Ketika **latency ultra-rendah lebih penting daripada integritas frame**: high-frequency trading, HPC/MPI, beberapa aplikasi real-time industri. Syaratnya: kecepatan port masuk = port keluar, dan jaringan cukup bersih sehingga frame rusak jarang terjadi. Untuk jaringan enterprise umum, store-and-forward tetap pilihan yang benar karena latency-nya sudah sangat kecil dan membuang frame rusak lebih menguntungkan.

</details>

---

## 13. Sumber

- IEEE 802.1D — MAC Bridges
- IEEE 802.1Q-2022 — Bridges and Bridged Networks
- Cisco CCNA 200-301 v1.1, topik 1.13 (switching concepts: MAC learning & aging, frame switching, frame flooding, MAC address table)
- Cisco, *Understanding and Configuring Switching Database Manager*

---

**Berikutnya:** `03-data-link/03-vlan.md`. Memisahkan satu switch fisik menjadi banyak jaringan logis.

# 03.4 — Spanning Tree Protocol (STP)

> **Prasyarat:** `03-data-link/02`, `03-data-link/03`
> **Tujuan:** Anda paham kenapa loop L2 fatal, bisa memprediksi topologi STP yang terbentuk, mengonfigurasi root bridge secara sengaja, dan menerapkan fitur perlindungan.

---

## 1. Kenapa Loop Layer 2 Sangat Fatal

Ini bukan pernyataan berlebihan. Loop layer 2 bisa **melumpuhkan seluruh jaringan dalam hitungan detik**.

### Tiga bencana yang terjadi bersamaan

Skenario: dua switch dihubungkan dengan **dua kabel** (tanpa STP), lalu PC-A mengirim satu frame broadcast.

```
        ┌─────────────┐
   [SW1]│             │[SW2]
     ║  │  dua kabel  │  ║
     ╚══┴═════════════┴══╝
```

**Bencana 1 — Broadcast Storm**
```
1. PC-A mengirim 1 frame broadcast ke SW1
2. SW1 flooding ke semua port → keluar lewat kabel 1 DAN kabel 2
3. SW2 menerima dari kabel 1 → flooding ke semua port termasuk kabel 2
4. SW2 menerima dari kabel 2 → flooding ke semua port termasuk kabel 1
5. SW1 menerima dari keduanya → flooding lagi...
6. Frame berlipat ganda EKSPONENSIAL
```

⚠️ **Tidak ada TTL di layer 2.** Header IP punya TTL yang mencegah paket berputar selamanya; header Ethernet **tidak punya mekanisme itu sama sekali**. Frame akan berputar selamanya sampai jaringan runtuh.

Dalam beberapa detik: link 100% penuh, CPU switch 100%, semua perangkat tidak responsif — termasuk akses manajemen Anda ke switch.

**Bencana 2 — MAC Table Instability (flapping)**
```
SW2 melihat MAC PC-A datang dari kabel 1 → catat di port 1
Sesaat kemudian dari kabel 2 → ubah ke port 2
Lalu dari kabel 1 lagi → ubah ke port 1
...
MAC table berubah ribuan kali per detik → switch tidak bisa forwarding dengan benar
```

**Bencana 3 — Duplikasi Frame Unicast**
Penerima mendapat salinan ganda dari frame yang sama. Aplikasi yang tidak siap (terutama protokol lama) bisa error atau berperilaku aneh.

### Kenapa loop terjadi meski tidak disengaja

- Teknisi menambahkan kabel "cadangan" tanpa tahu sudah ada jalur
- Pengguna menghubungkan dua wall jack dengan patch cord
- Mini-switch murah di bawah meja dihubungkan ke dua jack
- IP phone dengan port PC dihubungkan kembali ke switch
- Kesalahan kabel saat pemindahan rak
- Kegagalan unidirectional pada link fiber (hanya satu arah yang mati)

💡 Redundansi fisik **diperlukan** untuk keandalan. STP-lah yang membuat redundansi itu aman: ia menyediakan jalur cadangan yang **diblokir sampai dibutuhkan**.

---

## 2. Ide Dasar STP

> **STP membuat topologi bebas loop dengan memblokir port yang berlebihan, sambil menyimpannya sebagai cadangan.**

```
Topologi fisik (ada loop):        Topologi logis setelah STP (tanpa loop):

    [SW1]                              [SW1]  ← ROOT
    ╱    ╲                             ╱    ╲
 [SW2]──[SW3]                       [SW2]   [SW3]
                                        ╲   ╱
                                      (diblokir)
```

Jika link SW1–SW2 putus, STP membuka blokir link SW2–SW3 → jaringan pulih otomatis.

STP distandarkan sebagai **IEEE 802.1D**, dirancang oleh Radia Perlman (1985).

---

## 3. Empat Langkah Algoritma STP

STP menentukan topologi lewat empat keputusan berurutan:

```
1. Pilih ROOT BRIDGE            (satu untuk seluruh jaringan)
2. Pilih ROOT PORT              (satu di setiap non-root switch)
3. Pilih DESIGNATED PORT        (satu di setiap segmen)
4. Sisanya menjadi BLOCKING     (non-designated / alternate)
```

### Langkah 1: Memilih Root Bridge

Setiap switch punya **Bridge ID**:

```
┌─────────────────┬──────────────────────────┐
│ Bridge Priority │      MAC Address         │
│    (2 byte)     │        (6 byte)          │
└─────────────────┴──────────────────────────┘
```

Dengan **Extended System ID** (standar sekarang):
```
┌───────────┬──────────────┬─────────────────┐
│ Priority  │ Sys Ext ID   │  MAC Address    │
│  4 bit    │  12 bit      │    6 byte       │
│(kelipatan │  (= VLAN ID) │                 │
│  4096)    │              │                 │
└───────────┴──────────────┴─────────────────┘
```

Priority default = **32768**. Karena 12 bit berikutnya berisi VLAN ID, nilai efektifnya:
```
VLAN 1  → 32768 + 1  = 32769
VLAN 10 → 32768 + 10 = 32778
```

Priority hanya bisa diubah dalam **kelipatan 4096**: 0, 4096, 8192, 12288, 16384, 20480, 24576, 28672, 32768, ...

**Aturan pemilihan:**
```
1. Bridge Priority TERENDAH menang
2. Kalau seri → MAC address TERENDAH menang
```

⚠️ **Bahaya default:** kalau semua switch memakai priority 32768, yang menang adalah **MAC address terendah** — biasanya switch **tertua** di jaringan, yang sering kali switch access kecil di sudut ruangan, bukan core switch yang kuat. Ini menghasilkan topologi yang buruk: semua trafik memutar lewat switch lemah.

**Selalu tetapkan root bridge secara sengaja:**
```
SW-CORE1(config)# spanning-tree vlan 1-100 root primary
   (mengeset priority ke 24576, atau 4096 di bawah root saat ini)

SW-CORE2(config)# spanning-tree vlan 1-100 root secondary
   (mengeset priority ke 28672)

# Atau eksplisit:
SW-CORE1(config)# spanning-tree vlan 1-100 priority 4096
SW-CORE2(config)# spanning-tree vlan 1-100 priority 8192
```

### Langkah 2: Memilih Root Port

Setiap switch **non-root** memilih **satu** root port — port dengan jalur terbaik menuju root.

**Kriteria berurutan (tie-breaker):**
```
1. Root Path Cost TERENDAH (jumlah cost sepanjang jalur ke root)
2. Bridge ID pengirim TERENDAH (tetangga upstream)
3. Port ID pengirim TERENDAH (port priority, lalu port number)
4. Port ID lokal TERENDAH
```

**Cost berdasarkan bandwidth:**

| Bandwidth | Cost lama (802.1D-1998) | Cost baru (802.1D-2004 / long) |
|---|---|---|
| 10 Mbps | 100 | 2.000.000 |
| 100 Mbps | 19 | 200.000 |
| **1 Gbps** | **4** | 20.000 |
| 10 Gbps | 2 | 2.000 |
| 100 Gbps | — | 200 |

⚠️ Cost lama tidak bisa membedakan 10 G dan 100 G dengan baik (2 vs 1). Untuk jaringan cepat, aktifkan mode long:
```
SW1(config)# spanning-tree pathcost method long
```
Pastikan **konsisten di seluruh jaringan**, kalau tidak perhitungan jalur akan kacau.

**Cost dijumlahkan sepanjang jalur:**
```
SW3 → (1 Gbps, cost 4) → SW2 → (1 Gbps, cost 4) → ROOT
Root path cost dari SW3 lewat SW2 = 4 + 4 = 8

SW3 → (100 Mbps, cost 19) → ROOT (langsung)
Root path cost = 19

→ SW3 memilih jalur lewat SW2 (cost 8 < 19), MESKIPUN lebih banyak hop!
```
STP memilih berdasarkan **cost**, bukan jumlah hop.

### Langkah 3: Memilih Designated Port

Setiap **segmen** (link antara dua switch) punya satu designated port — port yang bertanggung jawab meneruskan trafik ke/dari segmen itu menuju root.

```
1. Semua port di root bridge adalah DESIGNATED (root selalu designated di semua port)
2. Untuk segmen lain: switch dengan root path cost terendah di segmen itu
   → port-nya menjadi designated
3. Tie-breaker: Bridge ID terendah, lalu Port ID terendah
```

### Langkah 4: Sisanya Blocking

Port yang bukan root port dan bukan designated port menjadi **blocking** (802.1D) atau **alternate/backup** (RSTP).

Port blocking:
- **Tidak** meneruskan frame data
- **Tetap mendengarkan** BPDU (agar tahu kalau topologi berubah)
- Siap diaktifkan kalau jalur utama gagal

---

## 4. Contoh Lengkap

```
Topologi:
              [SW1]
          Gi0/1  Gi0/2
            │       │
      (1G)  │       │  (1G)
            │       │
        Gi0/1     Gi0/1
         [SW2]───────[SW3]
          Gi0/2    Gi0/2
              (1G)

Bridge ID:
  SW1: priority 32768, MAC 0000.1111.1111
  SW2: priority 32768, MAC 0000.2222.2222
  SW3: priority 32768, MAC 0000.3333.3333
```

**Langkah 1 — Root bridge:**
Priority sama semua (32768) → MAC terendah menang → **SW1 adalah root**.

**Langkah 2 — Root port:**
```
SW2: Gi0/1 langsung ke SW1        → cost 4
     Gi0/2 lewat SW3 ke SW1       → cost 4 + 4 = 8
     → ROOT PORT = Gi0/1 (cost 4)

SW3: Gi0/1 langsung ke SW1        → cost 4
     Gi0/2 lewat SW2 ke SW1       → cost 4 + 4 = 8
     → ROOT PORT = Gi0/1 (cost 4)
```

**Langkah 3 — Designated port:**
```
Segmen SW1–SW2 : SW1 adalah root → SW1 Gi0/1 = DESIGNATED
Segmen SW1–SW3 : SW1 adalah root → SW1 Gi0/2 = DESIGNATED
Segmen SW2–SW3 : kedua switch punya root path cost 4 (seri)
                 → tie-breaker: Bridge ID terendah
                 → SW2 (MAC 0000.2222) < SW3 (MAC 0000.3333)
                 → SW2 Gi0/2 = DESIGNATED
```

**Langkah 4 — Blocking:**
```
SW3 Gi0/2 = bukan root port, bukan designated → BLOCKING
```

**Topologi akhir:**
```
              [SW1] ← ROOT
          D /       \ D
           /         \
        R /           \ R
      [SW2]─────────[SW3]
           D       B(blocked)

R = Root Port, D = Designated Port, B = Blocking
```

---

## 5. Port State dan Timer (802.1D Klasik)

| State | Meneruskan data? | Belajar MAC? | Memproses BPDU? | Durasi |
|---|---|---|---|---|
| **Disabled** | ❌ | ❌ | ❌ | — (admin down) |
| **Blocking** | ❌ | ❌ | ✅ | 20 detik (max age) |
| **Listening** | ❌ | ❌ | ✅ | 15 detik (forward delay) |
| **Learning** | ❌ | ✅ | ✅ | 15 detik (forward delay) |
| **Forwarding** | ✅ | ✅ | ✅ | — (normal) |

**Timer default:**
```
Hello time     : 2 detik   (interval pengiriman BPDU oleh root)
Max age        : 20 detik  (berapa lama BPDU dianggap valid)
Forward delay  : 15 detik  (durasi listening dan learning)
```

**Waktu konvergensi 802.1D:**
```
Port baru menyala        : 15 (listening) + 15 (learning) = 30 detik
Kegagalan link tak langsung: 20 (max age) + 15 + 15 = 50 detik
```

⚠️ **30–50 detik adalah keabadian** dalam istilah jaringan modern. Panggilan VoIP putus, sesi TCP timeout, aplikasi error. Inilah alasan utama RSTP diciptakan.

---

## 6. BPDU

**BPDU** (*Bridge Protocol Data Unit*) — pesan yang dipertukarkan switch untuk membangun dan memelihara topologi STP.

- Dikirim ke MAC multicast `01:80:C2:00:00:00`
- Setiap 2 detik (hello time) oleh root; switch lain meneruskannya
- Memakai format 802.3 dengan LLC (bukan Ethernet II)

**Isi Configuration BPDU:**
```
Protocol ID, Version, BPDU Type
Flags (TC, TCA)
Root Bridge ID          ← siapa yang dianggap root
Root Path Cost          ← cost dari pengirim ke root
Sender Bridge ID        ← siapa pengirimnya
Port ID                 ← port mana yang mengirim
Message Age, Max Age, Hello Time, Forward Delay
```

**TCN BPDU** (*Topology Change Notification*) — dikirim ke arah root ketika topologi berubah. Root lalu mengirim BPDU dengan flag TC diset, memerintahkan semua switch mempersingkat MAC aging time menjadi forward delay (15 detik) agar tabel cepat diperbarui.

⚠️ **Topology change berlebihan berbahaya.** Setiap TC memaksa semua switch membuang sebagian MAC table → flooding meningkat. Port access yang naik-turun (PC dinyalakan/dimatikan) akan memicu TC — kecuali port itu dikonfigurasi **PortFast**.

---

## 7. RSTP — 802.1w

Perbaikan besar dari 802.1D. Waktu konvergensi turun dari 30–50 detik menjadi **kurang dari 1 detik** pada kondisi ideal.

### Port role baru

| Role | Arti |
|---|---|
| **Root** | Jalur terbaik ke root bridge (sama seperti 802.1D) |
| **Designated** | Meneruskan ke segmen (sama) |
| **Alternate** | Jalur cadangan ke root **lewat switch lain** — bisa langsung menggantikan root port |
| **Backup** | Jalur cadangan ke segmen yang sama **lewat switch yang sama** (jarang; terjadi pada hub) |

### Port state disederhanakan

| RSTP | Setara 802.1D |
|---|---|
| **Discarding** | Disabled + Blocking + Listening |
| **Learning** | Learning |
| **Forwarding** | Forwarding |

### Kenapa RSTP jauh lebih cepat

1. **Proposal/Agreement handshake** — dua switch bertetangga langsung bernegosiasi tanpa menunggu timer:
   ```
   SW1 → SW2 : "Saya ingin port ini jadi designated & forwarding" (proposal)
   SW2       : memblokir semua port non-edge lainnya (sync)
   SW2 → SW1 : "Setuju" (agreement)
   SW1       : langsung forwarding
   ```
   Berlangsung dalam milidetik, bukan detik.

2. **Alternate port langsung mengambil alih** — tidak perlu melewati listening/learning karena sudah tahu topologinya.

3. **Semua switch bisa mengirim BPDU** (di 802.1D hanya root yang mengirim, sisanya meneruskan). Kegagalan terdeteksi lebih cepat.

4. **Kehilangan 3 BPDU berturut-turut = link dianggap mati** (6 detik), bukan menunggu max age 20 detik.

5. **Edge port** (setara PortFast) langsung forwarding.

6. **Link type** — RSTP membedakan point-to-point (full duplex, bisa cepat) dan shared (half duplex, harus lambat).

### Konfigurasi

```
SW1(config)# spanning-tree mode rapid-pvst
```

💡 **RSTP kompatibel mundur dengan 802.1D** — jika ada switch lama, port yang terhubung ke sana otomatis turun ke mode 802.1D. Tapi ini juga berarti satu switch lama bisa memperlambat sebagian jaringan.

---

## 8. Varian STP

| Varian | Standar | Instance | Karakteristik |
|---|---|---|---|
| **STP** | 802.1D | 1 untuk semua VLAN | Lambat, tidak ada load balancing |
| **PVST+** | Cisco | 1 per VLAN | Load balancing per VLAN, boros CPU |
| **RSTP** | 802.1w | 1 untuk semua VLAN | Cepat |
| **Rapid PVST+** | Cisco | 1 per VLAN | **Cepat + load balancing** ← default Cisco |
| **MSTP** | 802.1s | 1 per **grup** VLAN | Cepat, hemat CPU, skalabel |

### Rapid PVST+ (default pada switch Cisco)

Satu instance STP per VLAN. Keuntungannya: root bridge bisa berbeda per VLAN → **load balancing**.

```
SW-CORE1(config)# spanning-tree vlan 10,30,50 root primary
SW-CORE1(config)# spanning-tree vlan 20,40,60 root secondary

SW-CORE2(config)# spanning-tree vlan 20,40,60 root primary
SW-CORE2(config)# spanning-tree vlan 10,30,50 root secondary
```

Hasilnya: trafik VLAN ganjil lewat CORE1, VLAN genap lewat CORE2. Kedua uplink terpakai, bukan satu menganggur.

⚠️ Kelemahan: dengan 500 VLAN, ada 500 instance STP → beban CPU dan memori besar.

### MSTP (802.1s)

Memetakan banyak VLAN ke sedikit **instance** (MSTI).

```
SW1(config)# spanning-tree mode mst
SW1(config)# spanning-tree mst configuration
SW1(config-mst)# name PERUSAHAAN
SW1(config-mst)# revision 1
SW1(config-mst)# instance 1 vlan 10,30,50,70,90
SW1(config-mst)# instance 2 vlan 20,40,60,80,100
SW1(config-mst)# exit
SW1(config)# spanning-tree mst 1 root primary
SW1(config)# spanning-tree mst 2 root secondary
```

⚠️ **Semua switch dalam satu MST region HARUS punya name, revision, dan pemetaan VLAN→instance yang IDENTIK.** Kalau berbeda satu karakter saja, switch dianggap berada di region berbeda dan perilaku STP menjadi tidak sesuai harapan. Ini kesalahan konfigurasi MST paling umum.

```
SW1# show spanning-tree mst configuration
SW1# show spanning-tree mst configuration digest    ← bandingkan digest antar-switch
```

---

## 9. Fitur Perlindungan STP

Fitur-fitur ini **wajib** di jaringan produksi. Menghafalnya adalah bagian dari CCNA.

### PortFast

Membuat port access langsung masuk state **forwarding** tanpa listening/learning.

```
SW1(config-if)# spanning-tree portfast
# Atau untuk semua port access sekaligus:
SW1(config)# spanning-tree portfast default
```

**Manfaat:**
- PC bisa langsung dapat DHCP saat boot (tanpa PortFast, 30 detik pertama tidak ada konektivitas → DHCP timeout → PC dapat APIPA 169.254.x.x)
- Port naik-turun tidak memicu Topology Change

⚠️ **HANYA untuk port yang terhubung ke end device.** Memasang PortFast pada port yang terhubung switch lain = **loop instan** karena tidak ada jeda untuk mendeteksi.

### BPDU Guard

Mematikan port (err-disable) jika menerima BPDU. Digunakan bersama PortFast.

```
SW1(config-if)# spanning-tree bpduguard enable
# Atau global untuk semua port PortFast:
SW1(config)# spanning-tree portfast bpduguard default
```

**Logikanya:** port access seharusnya terhubung ke PC, bukan switch. PC tidak mengirim BPDU. Kalau ada BPDU masuk → seseorang mencolokkan switch/hub (sengaja atau tidak) → matikan port sebelum terjadi loop.

```
%SPANTREE-2-BLOCK_BPDUGUARD: Received BPDU on port Gi0/5 with BPDU Guard enabled. Disabling port.
%PM-4-ERR_DISABLE: bpduguard error detected on Gi0/5, putting Gi0/5 in err-disable state
```

Pemulihan otomatis:
```
SW1(config)# errdisable recovery cause bpduguard
SW1(config)# errdisable recovery interval 300
```

💡 **PortFast + BPDU Guard adalah kombinasi standar** untuk semua port access. Terapkan secara global.

### BPDU Filter

Menghentikan pengiriman/penerimaan BPDU pada port.

⚠️ **BERBAHAYA.** Jika diterapkan global pada port PortFast, port akan berhenti mengirim BPDU tetapi masih memproses BPDU masuk (dan kehilangan status PortFast). Jika diterapkan per-interface, port sepenuhnya buta terhadap BPDU → **loop tidak akan terdeteksi**.

Gunakan hanya jika Anda benar-benar paham konsekuensinya, misalnya pada port yang menghadap penyedia layanan yang tidak boleh menerima BPDU Anda.

### Root Guard

Mencegah port menjadi jalur menuju root baru. Jika menerima BPDU "superior" (dari switch yang mengklaim priority lebih baik), port masuk state **root-inconsistent** (memblokir).

```
SW-CORE(config-if)# spanning-tree guard root
```

**Kapan dipakai:** pada port yang menghadap ke bawah (arah access) atau ke jaringan mitra/pelanggan — tempat root bridge **tidak boleh** berada.

```
%SPANTREE-2-ROOTGUARD_BLOCK: Root guard blocking port GigabitEthernet0/12 on VLAN0010.
```

Port pulih otomatis begitu BPDU superior berhenti datang.

### Loop Guard

Mencegah port blocking berubah menjadi forwarding secara keliru ketika **berhenti menerima BPDU**.

Skenario yang dilindungi: kegagalan **unidirectional** — port masih bisa mengirim tetapi tidak menerima (mis. satu serat putus, atau transceiver rusak sebelah). Tanpa loop guard, port blocking yang berhenti menerima BPDU akan mengira jalur redundan sudah hilang, lalu masuk forwarding → **loop**.

```
SW1(config)# spanning-tree loopguard default
# Atau per interface:
SW1(config-if)# spanning-tree guard loop
```

Port masuk state **loop-inconsistent** alih-alih forwarding.

### UDLD — Unidirectional Link Detection

Protokol Cisco yang secara aktif mendeteksi link satu arah dengan bertukar pesan berisi identitas perangkat/port.

```
SW1(config)# udld enable            ← mode normal (hanya memberi peringatan)
SW1(config)# udld aggressive        ← mematikan port jika terdeteksi (disarankan untuk fiber)
SW1(config-if)# udld port aggressive
SW1# show udld gi0/24
```

💡 **UDLD dan Loop Guard saling melengkapi**, bukan menggantikan. UDLD mendeteksi masalah fisik; Loop Guard melindungi logika STP. Terapkan keduanya pada link fiber antar-switch.

### Ringkasan penerapan

| Jenis port | Fitur yang diterapkan |
|---|---|
| **Access (ke PC/printer)** | PortFast + BPDU Guard |
| **Trunk ke switch access (dari distribution)** | Root Guard |
| **Trunk antar-switch (fiber)** | Loop Guard + UDLD aggressive |
| **Port tidak dipakai** | Shutdown + VLAN parkir |

---

## 10. Verifikasi dan Troubleshooting

```
SW1# show spanning-tree
VLAN0010
  Spanning tree enabled protocol rstp
  Root ID    Priority    4106
             Address     0000.1111.1111
             Cost        4
             Port        1 (GigabitEthernet0/1)
             Hello Time  2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    32778  (priority 32768 sys-id-ext 10)
             Address     0000.2222.2222
             Hello Time  2 sec  Max Age 20 sec  Forward Delay 15 sec
             Aging Time  300 sec

Interface        Role Sts Cost      Prio.Nbr Type
---------------- ---- --- --------- -------- --------------------------------
Gi0/1            Root FWD 4         128.1    P2p
Gi0/2            Altn BLK 4         128.2    P2p
Gi0/5            Desg FWD 4         128.5    P2p Edge
```

Cara membaca:
- **Root ID ≠ Bridge ID** → switch ini bukan root.
- **Cost 4** → jarak ke root.
- **Port 1** → root port.
- **Role**: `Root`, `Altn` (alternate), `Desg` (designated), `Back` (backup).
- **Sts**: `FWD` (forwarding), `BLK` (blocking/discarding), `LRN` (learning).
- **Type**: `P2p` (point-to-point), `Shr` (shared), `Edge` (PortFast aktif).

### Perintah lain

```
SW1# show spanning-tree summary
SW1# show spanning-tree vlan 10
SW1# show spanning-tree root
SW1# show spanning-tree blockedports
SW1# show spanning-tree interface gi0/2 detail
SW1# show spanning-tree inconsistentports    ← port yang diblokir root/loop guard
SW1# show spanning-tree detail | include ieee|occurr|from|is exec
    ← melihat berapa kali dan dari port mana topology change terjadi
```

### Gejala dan diagnosis

| Gejala | Kemungkinan penyebab |
|---|---|
| Seluruh jaringan lambat/mati mendadak | **Broadcast storm karena loop** |
| MAC flapping di log | Loop |
| Root bridge berpindah tanpa alasan | Switch baru dengan priority lebih rendah; pakai Root Guard |
| Topology change sangat sering | Port access tanpa PortFast; kabel/perangkat flapping |
| Port di-err-disable | BPDU Guard terpicu — ada perangkat mengirim BPDU di port access |
| Port `root-inconsistent` | Root Guard memblokir BPDU superior |
| Port `loop-inconsistent` | Loop Guard mendeteksi BPDU berhenti |
| Uplink cadangan tidak aktif saat utama mati | STP tidak berjalan, atau konvergensi lambat (masih 802.1D) |

### Menangani broadcast storm yang sedang terjadi

```
1. JANGAN panik mencari akar masalah dulu — hentikan storm-nya.
2. Akses switch lewat CONSOLE (SSH kemungkinan besar tidak responsif).
3. Identifikasi port dengan trafik ekstrem:
     SW1# show interfaces | include line protocol|rate
4. Shutdown port yang mencurigakan (biasanya yang baru dipasang):
     SW1(config-if)# shutdown
5. Setelah jaringan pulih, baru investigasi:
     - show spanning-tree
     - show cdp neighbors
     - periksa perubahan kabel terakhir
6. Perbaiki akar masalah, lalu terapkan BPDU Guard agar tidak terulang.
```

💡 **Pencegahan lebih baik:** aktifkan **storm control** agar storm dibatasi otomatis.
```
SW1(config-if)# storm-control broadcast level 5.00
SW1(config-if)# storm-control multicast level 5.00
SW1(config-if)# storm-control action shutdown
SW1# show storm-control
```

---

## 11. Alternatif Modern untuk STP

STP memblokir jalur — artinya **membuang kapasitas**. Dalam topologi dengan dua uplink 10 G, hanya 10 G yang terpakai. Teknologi modern mengatasi ini:

| Teknologi | Cara kerja |
|---|---|
| **EtherChannel / LAG** | Menggabungkan beberapa link menjadi satu link logis → STP melihat satu link, semua fisik terpakai (`03-data-link/05`) |
| **Switch stacking** | Beberapa switch fisik menjadi satu switch logis |
| **MLAG / vPC / VSS** | Dua switch tampil sebagai satu bagi perangkat di bawahnya, sehingga uplink ganda menjadi satu EtherChannel |
| **Routed access (L3 sampai access)** | Tidak ada L2 antar-switch → tidak ada STP → ECMP memakai semua jalur |
| **VXLAN + EVPN** | Overlay L2 di atas underlay L3 dengan ECMP (`16-datacenter-cloud-sdn/02`) |

💡 **Arah desain modern: kurangi domain layer 2 sekecil mungkin, gunakan routing untuk redundansi.** Tetapi STP tetap harus aktif sebagai jaring pengaman — jangan pernah mematikannya di jaringan L2.

---

## MikroTik RouterOS

```
# Mode STP pada bridge
/interface bridge set bridge-LAN protocol-mode=rstp
   # pilihan: none | stp | rstp | mstp

# Priority (setara bridge priority Cisco)
/interface bridge set bridge-LAN priority=0x1000
   # 0x1000 = 4096 → jadikan root bridge

# Lihat status STP
/interface bridge monitor bridge-LAN
     state: enabled
     current-mac-address: ...
     root-bridge: yes
     root-bridge-id: 0x1000.CC:2D:E0:...
     root-path-cost: 0
     designated-port-count: 3

/interface bridge port print detail
     # perhatikan: role, edge, learning, forwarding, point-to-point

# Port cost dan priority
/interface bridge port set [find interface=ether2] path-cost=10 priority=0x80

# Edge port (setara PortFast)
/interface bridge port set [find interface=ether2] edge=yes-discover
   # auto | no | no-discover | yes | yes-discover

# BPDU Guard (setara Cisco BPDU Guard)
/interface bridge port set [find interface=ether2] bpdu-guard=yes

# Root Guard
/interface bridge port set [find interface=ether24] root-guard=yes

# MSTP
/interface bridge set bridge-LAN protocol-mode=mstp region-name=PERUSAHAAN region-revision=1
/interface bridge msti add bridge=bridge-LAN identifier=1 priority=0x1000
/interface bridge vlan set [find vlan-ids=10] ... 
```

⚠️ **`protocol-mode=none` mematikan STP sepenuhnya.** Ini default pada beberapa konfigurasi dan **sangat berbahaya** — satu kabel yang salah akan menyebabkan broadcast storm. **Selalu aktifkan minimal `rstp`** pada bridge yang punya lebih dari satu port ke perangkat lain.

💡 **`edge=yes-discover`** adalah pilihan yang aman: port berperilaku sebagai edge (langsung forwarding) tetapi tetap mendeteksi BPDU — kalau ada switch yang tercolok, ia otomatis beralih ke mode normal.

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `spanning-tree mode rapid-pvst` | `protocol-mode=rstp` |
| `spanning-tree vlan 1 priority 4096` | `/interface bridge set X priority=0x1000` |
| `spanning-tree portfast` | `edge=yes` atau `yes-discover` |
| `spanning-tree bpduguard enable` | `bpdu-guard=yes` |
| `spanning-tree guard root` | `root-guard=yes` |
| `show spanning-tree` | `/interface bridge monitor` + `/interface bridge port print detail` |

⚠️ **RSTP di RouterOS bersifat per-bridge, bukan per-VLAN.** Tidak ada padanan PVST+. Untuk load balancing per-VLAN, gunakan **MSTP**.

---

## 12. Ringkasan

- Loop L2 fatal karena **tidak ada TTL di Ethernet**: broadcast storm, MAC flapping, duplikasi frame.
- STP memblokir port berlebih dan menyimpannya sebagai cadangan.
- Empat langkah: pilih **root bridge** → **root port** (per switch) → **designated port** (per segmen) → sisanya **blocking**.
- Bridge ID = priority (kelipatan 4096) + extended system ID (VLAN) + MAC. **Priority terendah menang; seri → MAC terendah.**
- **Selalu tetapkan root bridge secara sengaja** — default memilih switch tertua.
- Cost berdasarkan bandwidth, dijumlahkan sepanjang jalur. Aktifkan `pathcost method long` untuk link cepat.
- 802.1D lambat (30–50 detik); **RSTP <1 detik** berkat proposal/agreement dan alternate port.
- Rapid PVST+ (default Cisco) = cepat + load balancing per VLAN. MSTP hemat CPU untuk banyak VLAN.
- Wajib: **PortFast + BPDU Guard** di port access, **Root Guard** menghadap access, **Loop Guard + UDLD** di trunk fiber.
- MST region butuh name, revision, dan pemetaan VLAN **identik** di semua switch.
- Saat storm terjadi: akses lewat console, shutdown port penyebab, baru investigasi.

---

## 13. Latihan

1. Tiga switch: SW-A priority 32768 MAC 000A, SW-B priority 24576 MAC 000B, SW-C priority 32768 MAC 0001. Siapa root bridge? Jelaskan.
2. Kenapa loop layer 2 jauh lebih berbahaya daripada loop layer 3?
3. Sebuah port access di-err-disable dengan pesan BPDU Guard. Apa yang terjadi dan apa langkah Anda?
4. Jelaskan skenario kegagalan yang dilindungi Loop Guard tetapi tidak oleh STP biasa.
5. Anda memasang PortFast pada port trunk antar-switch. Apa yang mungkin terjadi?
6. Kenapa RSTP bisa konvergen dalam <1 detik sementara 802.1D butuh 30–50 detik? Sebutkan tiga alasan.
7. Sebuah jaringan memakai Rapid PVST+ dengan 400 VLAN. Apa masalahnya dan apa solusinya?
8. Dua switch dalam MST region yang sama tetapi STP berperilaku seolah region berbeda. Apa yang harus Anda periksa?

<details>
<summary>Jawaban</summary>

1. **SW-B.** Pemilihan pertama berdasarkan **priority terendah**: SW-B punya 24576, lebih rendah daripada 32768. MAC address hanya menjadi tie-breaker jika priority seri — di sini tidak perlu. (Perhatikan: MAC SW-C paling rendah, tetapi itu tidak relevan karena priority-nya lebih tinggi.)

2. Karena header Ethernet **tidak punya TTL/hop count**. Paket IP yang berputar akan dibuang setelah TTL mencapai 0, sehingga loop L3 menyebabkan paket hilang tetapi jaringan tetap hidup. Frame Ethernet yang berputar tidak pernah dibuang — ia berlipat ganda setiap kali di-flood, sehingga dalam hitungan detik memenuhi seluruh bandwidth dan CPU, melumpuhkan jaringan.

3. Port menerima BPDU, artinya ada **switch, hub, atau perangkat yang menjalankan STP** dicolokkan ke port yang seharusnya untuk end device. BPDU Guard mematikan port untuk mencegah loop. Langkah: (a) periksa apa yang tercolok secara fisik; (b) kalau itu perangkat tidak sah, cabut dan edukasi pengguna; (c) kalau memang perlu switch di sana, konfigurasikan port sebagai trunk/uplink yang benar tanpa PortFast; (d) pulihkan port dengan `shutdown` lalu `no shutdown`, atau aktifkan `errdisable recovery cause bpduguard`.

4. **Kegagalan unidirectional.** Port blocking berhenti menerima BPDU (karena satu arah link mati — misalnya satu serat putus atau TX transceiver rusak), tetapi masih bisa mengirim. STP biasa menafsirkan "tidak ada BPDU" sebagai "jalur redundan hilang" dan memindahkan port ke forwarding → terbentuk **loop**, karena secara fisik link masih menyambung di arah lain. Loop Guard menempatkan port ke state `loop-inconsistent` (tetap memblokir) alih-alih forwarding.

5. **Loop.** PortFast melewati state listening dan learning, sehingga port langsung forwarding tanpa memberi STP waktu mendeteksi jalur redundan. Jika port itu terhubung ke switch lain yang menciptakan loop, storm terjadi seketika. (Perlindungan tambahan: BPDU Guard akan mematikan port begitu BPDU pertama diterima — inilah alasan keduanya selalu dipasang bersama.)

6. (a) **Proposal/Agreement handshake** — dua switch bertetangga langsung menyepakati state forwarding dalam milidetik, tanpa menunggu forward delay. (b) **Alternate port** sudah mengetahui topologi dan bisa langsung mengambil alih tanpa melewati listening/learning. (c) **Semua switch mengirim BPDU sendiri** (bukan hanya meneruskan dari root), dan kehilangan 3 BPDU (6 detik) sudah dianggap link mati — bukan menunggu max age 20 detik. (d) Tambahan: edge port langsung forwarding, dan RSTP membedakan link point-to-point yang bisa dikonvergensikan cepat.

7. Rapid PVST+ menjalankan **satu instance STP per VLAN** → 400 instance. Ini memakan CPU dan memori switch secara signifikan, memperlambat konvergensi, dan bisa membuat switch tidak stabil. Solusi: migrasi ke **MSTP (802.1s)**, memetakan 400 VLAN ke misalnya 2–4 instance saja — tetap mendapat load balancing tetapi dengan beban jauh lebih ringan. Alternatif lain: kurangi span VLAN dengan desain routed access.

8. Periksa tiga hal yang harus **identik persis** di semua switch dalam satu region: (a) **MST region name**; (b) **revision number**; (c) **pemetaan VLAN ke instance**. Perbedaan sekecil apa pun (termasuk huruf besar/kecil pada nama, atau satu VLAN yang tertinggal di pemetaan) membuat switch dianggap berada di region berbeda. Verifikasi dengan `show spanning-tree mst configuration` dan bandingkan **digest**-nya — digest yang berbeda memastikan konfigurasinya tidak sama.

</details>

---

## 14. Sumber

- IEEE 802.1D-2004 — Spanning Tree Protocol (termasuk RSTP yang diserap dari 802.1w)
- IEEE 802.1s / 802.1Q-2022 clause 13 — Multiple Spanning Tree
- Cisco CCNA 200-301 v1.1, topik 2.5 (Rapid PVST+: root port, root bridge, port states & roles, PortFast, root guard, loop guard, BPDU filter, BPDU guard)
- Cisco, *Spanning Tree Protocol Root Guard Enhancement*
- Perlman, R. (1985), *An Algorithm for Distributed Computation of a Spanning Tree in an Extended LAN*

---

**Berikutnya:** `03-data-link/05-etherchannel.md` — menggabungkan beberapa link agar semuanya terpakai.

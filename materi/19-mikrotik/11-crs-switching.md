# 19.11 — Switching CRS dan SwOS (MTCSWE)

> **Prasyarat:** `19-mikrotik/02-bridge-vlan-switching` (bridge, flag H, bridge VLAN filtering dasar), `03-data-link/04-stp` (STP/RSTP), `03-data-link/05-etherchannel` (agregasi link)
> **Tujuan:** Anda bisa menjelaskan kapan sebuah frame diproses switch chip dan kapan naik ke CPU, mengonfigurasi bridge VLAN filtering, L3 hardware offloading, isolasi port, IGMP snooping, RSTP/MSTP, dan bonding LACP di CRS3xx/CRS5xx tanpa kehilangan offload, memakai ACL dan QoS dasar switch chip, memilih antara SwOS dan RouterOS, serta mendiagnosis konfigurasi yang diam-diam membuat trafik lewat CPU.

---

## 1. Dua Jalur Forwarding: Switch Chip dan CPU

Setiap perangkat MikroTik berport banyak sebenarnya berisi dua mesin:

```
          port fisik (ether1..ether24, sfp-sfpplus1..)
     ┌──────┬──────┬──────┬──────┬──────┬──────┐
     │      │      │      │      │      │      │
┌────┴──────┴──────┴──────┴──────┴──────┴──────┴────┐
│                  SWITCH CHIP (ASIC)               │
│  tabel MAC (FDB), tabel VLAN, ACL, isolasi port,  │
│  policer/shaper, storm control, mirror, L3HW      │
└────────────────────────┬──────────────────────────┘
                         │  switch1-cpu (port internal)
┌────────────────────────┴──────────────────────────┐
│                     CPU                           │
│  RouterOS: firewall, NAT, queue, routing lunak,   │
│  PPPoE, Hotspot, DHCP, STP, IGMP snooping (kontrol)│
└───────────────────────────────────────────────────┘
```

**Switch chip** memindahkan frame antar port dengan kecepatan kabel (wire speed) tanpa melibatkan CPU. **CPU** jauh lebih fleksibel (firewall stateful, queue, NAT) tetapi jauh lebih lambat. Seri CRS (Cloud Router Switch) memasang switch chip besar dengan CPU yang relatif kecil. CPU di switch 24 port tidak dirancang untuk meneruskan 24 Gbps; tugasnya adalah bidang kendali (STP, IGMP, manajemen).

Dokumentasi RouterOS meringkas urutan kecepatan sebagai berikut: **hardware offloading > Fast Forward > Fast Path > Slow Path**. Fast Forward dan Fast Path masih dikerjakan CPU, hanya dengan jalur yang lebih ringkas.

Port internal `switch1-cpu` adalah satu-satunya pintu antara kedua mesin. Ia hanya terlihat di menu `/interface ethernet switch`, tidak bisa dimasukkan ke interface list, dan paket yang naik lewat port ini dianggap masuk dari port fisik asalnya. Menurut dokumentasi packet flow, frame naik ke CPU bila:

- MAC tujuan adalah MAC lokal (misalnya bridge atau VLAN interface yang punya IP);
- frame di-flood (broadcast, multicast, unicast tak dikenal), karena CPU adalah salah satu anggota bridge;
- switch belajar bahwa sebuah host hanya bisa dicapai lewat CPU (bridge berisi port non-HW seperti wireless atau EoIP);
- aturan sengaja menyalin atau mengalihkan paket ke CPU (ACL `copy-to-cpu`, `redirect-to-cpu`);
- fitur kontrol butuh melihat paket (DHCP snooping, IGMP snooping).

Seluruh modul ini pada dasarnya menjawab satu pertanyaan: **bagaimana menjaga trafik data tetap di chip dan hanya trafik kontrol yang naik ke CPU?**

### 1.1 Keluarga switch chip

| Keluarga | Contoh perangkat | Catatan |
|---|---|---|
| Marvell Prestera (CRS3xx, CRS5xx, CCR2116, CCR2216) | CRS326-24G-2S+, CRS317-1G-16S+, CRS328-24P-4S+, CRS354 | Fitur paling lengkap: VLAN filtering + offload, ACL, L3HW, MSTP, LACP offload, DHCP snooping di hardware. Dokumentasinya kini berjudul "Marvell Prestera switch chip features". |
| CRS1xx/CRS2xx | CRS125, CRS226 | Generasi lama. Mendukung banyak bridge offload per chip, tetapi VLAN-nya dikonfigurasi lewat menu switch khusus, bukan bridge VLAN filtering. |
| Switch chip sederhana di router | QCA8337, Atheros8327, 88E6393X, MT7621, RTL8367 | Port switching dasar. Hanya sebagian yang bisa VLAN filtering dengan offload (Marvell 88E6xxx, MT7621, RTL8367 sejak v7). |
| IPQ-PPE | sebagian router ARM baru | Dokumentasi menyebut offload bridge untuk chip ini masih dalam pengerjaan dan menyarankan bridge non-offload dengan RSTP. |

⚠️ Fitur "switch" di perangkat berbeda **tidak sama**. Sebelum mengonfigurasi, cek tabel fitur di halaman "Bridging and Switching" untuk chip Anda (`/interface ethernet switch print` menampilkan tipe chip).

---

## 2. Bridge Hardware Offloading

Sejak RouterOS 6.41, port switching dilakukan dengan bridge biasa yang portnya diberi `hw=yes`. Kolom dan flag **H** menunjukkan port benar-benar di-offload:

```routeros
/interface bridge add name=bridge1
/interface bridge port
add bridge=bridge1 interface=ether2 hw=yes
add bridge=bridge1 interface=ether3 hw=yes
```

```
[admin@MikroTik] /interface bridge port print
Flags: X - disabled, I - inactive, D - dynamic, H - hw-offload
 #     INTERFACE       BRIDGE       HW  PVID PRIORITY  PATH-COST INTERNAL-PATH-COST    HORIZON
 0   H ether2          bridge1      yes    1     0x80         10                 10       none
 1   H ether3          bridge1      yes    1     0x80         10                 10       none
```

Bedakan dua hal: kolom `HW=yes` adalah **permintaan** Anda, flag `H` adalah **kenyataan**. Bila `HW=yes` tetapi tanpa `H`, ada sesuatu yang memaksa port itu ke CPU.

### 2.1 Aturan yang perlu dihafal

1. **Satu bridge offload per switch chip.** Kecuali CRS1xx/2xx, hanya satu bridge yang bisa memakai switch chip. Bridge kedua akan diproses CPU. Untuk memisahkan jaringan, pakai satu bridge dengan banyak VLAN, bukan banyak bridge.
2. **Fitur bridge harus didukung chip.** Tabel di dokumentasi menandai fitur yang didukung (+) atau yang mematikan offload (-). Contoh untuk perangkat Marvell Prestera: STP/RSTP, MSTP, VLAN filtering, IGMP snooping, DHCP snooping, bonding, dan MLAG didukung, sedangkan **horizon tidak didukung di chip mana pun**.
3. **Sebagian perubahan me-reset switch chip.** DHCP snooping, IGMP snooping, VLAN filtering, L2MTU, flow control, dan beberapa properti lain bisa memicu reset chip yang mematikan semua port sesaat. Lakukan di jendela pemeliharaan.

### 2.2 Ketika sebagian port bukan milik switch

Beberapa perangkat punya port yang tersambung ke chip lain atau langsung ke CPU. Dokumentasi L3HW memberi contoh CRS312-4C+8XG: `ether9` ada di `switch2` (Atheros-8227), bukan di `switch1` (Marvell). Memasukkannya ke bridge utama atau ke skenario L3HW menghasilkan perilaku tak terduga. Biarkan port manajemen untuk manajemen.

```
[admin@crs312] /interface/ethernet/switch> print
# NAME     TYPE              L3-HW-OFFLOADING
0 switch1  Marvell-98DX8212  yes
1 switch2  Atheros-8227      no
```

---

## 3. Bridge VLAN Filtering di CRS3xx/CRS5xx

Dasar bridge VLAN filtering (PVID, tagged, untagged, mengaktifkan `vlan-filtering` paling akhir) sudah dibahas di `19-mikrotik/02-bridge-vlan-switching`. Di CRS3xx/CRS5xx, metode ini **sekaligus** dioffload ke switch chip, jadi ia satu-satunya metode VLAN yang Anda pakai.

Contoh switch akses RT-RW Net (potongan dari `crs3xx-fisik.rsc` di folder lab):

```routeros
/interface bridge add name=bridge1 vlan-filtering=no protocol-mode=rstp igmp-snooping=yes
/interface bridge port
add bridge=bridge1 interface=sfp-sfpplus1 frame-types=admit-only-vlan-tagged
add bridge=bridge1 interface=ether1 pvid=10 \
    frame-types=admit-only-untagged-and-priority-tagged edge=yes bpdu-guard=yes
add bridge=bridge1 interface=ether24 pvid=99 \
    frame-types=admit-only-untagged-and-priority-tagged

/interface bridge vlan
add bridge=bridge1 vlan-ids=10 tagged=sfp-sfpplus1 untagged=ether1
add bridge=bridge1 vlan-ids=99 tagged=bridge1,sfp-sfpplus1 untagged=ether24

/interface vlan add name=vlan99 interface=bridge1 vlan-id=99
/ip address add address=10.99.99.10/24 interface=vlan99

/interface bridge set bridge1 vlan-filtering=yes
```

Detail yang membedakan konfigurasi rapi dari yang "kebetulan jalan":

- **`frame-types`.** Port trunk hanya menerima frame bertag (`admit-only-vlan-tagged`), port akses hanya menerima tanpa tag. Frame yang salah jenis dibuang di ingress oleh chip.
- **`ingress-filtering`.** Sejak RouterOS v7 nilainya `yes` secara bawaan: frame dengan VLAN yang bukan anggota port dibuang saat masuk.
- **Bridge sebagai anggota tagged hanya untuk VLAN yang perlu ke CPU.** Pada contoh di atas, `bridge1` hanya tagged di VLAN 99 (manajemen). VLAN 10 pelanggan tidak perlu naik ke CPU switch, jadi `bridge1` tidak dimasukkan. Itu mengurangi trafik flood yang mengalir ke CPU.
- **Port manajemen.** Dokumentasi Marvell mengingatkan bahwa mengaktifkan `vlan-filtering` mulai menyaring trafik ke CPU; siapkan port manajemen (di sini ether24 di VLAN 99) sebelum mengaktifkannya. Kerjakan dari Safe Mode (Ctrl+X di terminal) agar perubahan dibatalkan bila koneksi Anda putus.

### 3.1 VLAN berbasis MAC atau protokol, dan QinQ

Switch chip Prestera bisa menetapkan VLAN berdasarkan MAC sumber atau EtherType lewat ACL dengan aksi `new-vlan-id` (butuh `vlan-filtering=yes`). Jumlah aturan yang muat terbatas oleh memori ACL, jadi cocok untuk segelintir perangkat khusus (misalnya telepon IP), bukan ratusan pelanggan.

QinQ (802.1ad) dikonfigurasi dengan `ether-type=0x88a8` pada bridge. Perhatikan catatan dokumentasi: chip 88E6393X, 88E6191X, dan 88E6190 tidak mendukung ether-type 0x88a8 atau 0x9100 dan tidak mendukung tag-stacking, sehingga fitur itu mematikan offload di chip tersebut. Selalu cek tabel chip.

---

## 4. L3 Hardware Offloading (L3HW)

L3HW (dokumentasi juga menyebutnya IP switching atau HW routing) memindahkan **routing** ke switch chip. Di CRS3xx/CRS5xx, routing antar-VLAN bisa berjalan dengan kecepatan kabel.

### 4.1 Mengaktifkan

Ada dua saklar yang perilakunya berbeda:

```routeros
# Saklar chip: "no" berarti semua routing oleh CPU
/interface/ethernet/switch set 0 l3-hw-offloading=yes
# Saklar per port: routing HW hanya bila port masuk DAN port keluar = yes
/interface/ethernet/switch/port set [find] l3-hw-offloading=yes
```

Aturan dari dokumentasi:

- Paket dirutekan hardware bila port masuk **dan** port keluar sama-sama `l3-hw-offloading=yes`.
- Bila keduanya `no`, paket melewati CPU dan firewall, tetapi koneksi FastTrack tetap bisa di-offload.
- Mengarahkan paket ke CPU cukup dengan `no` di port **keluar**. Menyetel `no` hanya di port masuk bisa menghasilkan perilaku tak terduga, termasuk paket yang tetap dirutekan hardware dan melewati firewall.

### 4.2 Routing antar-VLAN yang benar

L3HW berdiri di atas L2HW. VLAN interface harus dibuat **di atas bridge yang di-offload dan ber-vlan-filtering**, dan bridge harus menjadi anggota tagged setiap VLAN yang dirutekan:

```routeros
/interface/ethernet/switch set 0 l3-hw-offloading=no
/interface/bridge/port add bridge=bridge interface=ether2
/interface/bridge/vlan add bridge=bridge tagged=bridge,ether2 vlan-ids=20
/interface/vlan add interface=bridge name=vlan20 vlan-id=20
/ip/address add address=192.0.2.1/24 interface=vlan20
/interface/bridge set bridge vlan-filtering=yes
/interface/ethernet/switch set 0 l3-hw-offloading=yes
```

Pola "matikan L3HW, ubah L2, nyalakan L3HW" di atas adalah anjuran resmi setiap kali Anda menambah bridge, port, bonding, VLAN, MTU, atau alamat MAC.

### 4.3 Firewall, NAT, dan FastTrack HW

Connection tracking dan firewall stateful hanya bisa dikerjakan CPU. Maka desain yang dianjurkan untuk switch inti RT-RW Net adalah:

- Port antar-VLAN internal: `l3-hw-offloading=yes`, dirutekan hardware.
- Port uplink ke internet (WAN): `l3-hw-offloading=no`, sehingga trafik ke dan dari internet melewati firewall dan NAT di CPU.
- Koneksi yang sudah established di-FastTrack, lalu di-offload ke hardware dengan `hw-offload=yes`:

```routeros
/ip/firewall/filter
add action=fasttrack-connection chain=forward connection-state=established,related hw-offload=yes
add action=accept chain=forward connection-state=established,related
```

Memori hardware untuk koneksi FastTrack sangat terbatas dan dibagi dengan ACL. Dokumentasi memberi aturan praktis: **gunakan ACL switch bila mungkin**, karena satu aturan ACL bisa mencocokkan banyak koneksi, sedangkan setiap koneksi FastTrack memakan satu entri.

### 4.4 Memantau

```
/interface/ethernet/switch/l3hw-settings/monitor
        ipv4-routes-total: 99363
           ipv4-routes-hw: 61250
          ipv4-routes-cpu: 38112
  ipv4-shortest-hw-prefix: 24
               ipv4-hosts: 87
     fasttrack-ipv4-conns: 2031
```

Contoh dari dokumentasi ini menunjukkan **partial offload**: tabel rute terlalu besar untuk memori chip, sehingga hanya prefiks /24 dan yang lebih panjang yang ada di hardware, sisanya diproses CPU. Untuk switch yang menerima full table BGP, pakai `suppress-hw-offload=yes` (di rute atau lewat routing filter) agar hanya rute penting yang mengisi hardware. Flag `H` pada rute di `/ip route print` hanya berarti rute itu **kandidat** offload, bukan bukti bahwa ia sudah di hardware.

### 4.5 Fitur yang tidak cocok dengan L3HW

Ringkasan dari tabel dukungan fitur di dokumentasi L3HW:

| Fitur | Status |
|---|---|
| IPv4/IPv6 unicast, ECMP, blackhole, bonding (802.3ad, balance-xor) | Hardware |
| Multicast routing | CPU |
| Firewall, NAT | Butuh `l3-hw-offloading=no` di port terkait; FastTrack bisa di-offload |
| VRRP, MLAG | Tidak tersedia bersama L3HW |
| VRF | Tabel dokumentasi menyatakan tidak tersedia, tetapi changelog 7.23 dan 7.24 mencatat dukungan VRF hardware untuk sejumlah chip Prestera tertentu. Cek changelog versi Anda. |
| Traffic-Flow | Trafik yang di-offload tidak dilaporkan |
| QinQ routing | VLAN bertumpuk kehilangan L3HW |

Hardware juga hanya punya delapan profil MTU (1500 bawaan ditambah tujuh nilai lain).

---

## 5. Isolasi Port

Di RT-RW Net, pelanggan di satu VLAN sebaiknya **tidak bisa saling melihat**: tidak bisa membuka folder bersama tetangga, tidak bisa menjadi sasaran pemindaian, dan tidak bisa memalsukan gateway lewat ARP. Ada dua cara di RouterOS, dan hanya satu yang ramah switch chip.

### 5.1 Bridge horizon (perangkat lunak)

```routeros
/interface bridge port set [find interface=ether1] horizon=1
```

Port dengan nilai horizon sama tidak saling meneruskan. Sederhana, tetapi dokumentasi menegaskan: **split horizon adalah fitur perangkat lunak yang mematikan hardware offloading**. Di CRS, ini cara tercepat membuat switch 24 port kehabisan CPU.

### 5.2 Switch port isolation (perangkat keras)

```routeros
:for i from=1 to=20 do={
  /interface ethernet switch port-isolation set ("ether" . $i) forwarding-override=sfp-sfpplus1
}
```

`forwarding-override` memaksa trafik yang **masuk** ke port tersebut hanya boleh keluar lewat port yang disebut (di sini uplink). Ini pola **Private VLAN**: semua pelanggan hanya bisa berbicara ke router di uplink, dan router yang memutuskan apa yang boleh (misalnya lewat firewall atau proxy-ARP bila memang diinginkan).

Catatan dari dokumentasi:

- Isolasi hanya berlaku antar port di switch chip yang sama, dan hanya memengaruhi trafik ingress.
- Di perangkat Prestera, isolasi bisa dipakai bersama `vlan-filtering`, tetapi bekerja **per port, bukan per VLAN**.
- Bonding yang di-offload tidak muncul di menu port-isolation; atur isolasi pada tiap anggota bonding.
- (R/M)STP hanya bekerja benar dalam skenario PVLAN. Pada skenario beberapa grup terisolasi, BPDU bisa tidak sampai sehingga loop tidak terdeteksi.

---

## 6. IGMP Snooping

Tanpa snooping, switch memperlakukan multicast seperti broadcast: satu aliran IPTV atau kamera CCTV multicast membanjiri semua port di VLAN. Dengan **IGMP snooping**, bridge mendengarkan laporan keanggotaan IGMP (dan MLD untuk IPv6), membangun **MDB** (multicast database), dan hanya mengirim aliran ke port yang berlangganan.

```routeros
/interface bridge set bridge1 igmp-snooping=yes
# Bila tidak ada router multicast atau IGMP proxy di jaringan:
/interface bridge set bridge1 multicast-querier=yes
/interface bridge port set [find interface=ether5] fast-leave=yes
/interface bridge mdb print
```

Hal yang sering terlewat:

- **Butuh querier.** Dokumentasi menjelaskan bahwa tanpa querier aktif (router PIM, IGMP proxy, atau bridge yang dijadikan querier), entri MDB kedaluwarsa dan snooping tidak berfungsi benar. Bridge tidak mengirim query bila querier eksternal terdeteksi.
- **Multicast tak dikenal.** Saat snooping aktif dan querier terdeteksi, bridge otomatis berhenti membanjirkan multicast IP yang tidak dikenal. `unknown-multicast-flood=no` di port memperketat ini, termasuk untuk rentang link-local.
- **`fast-leave`** cocok untuk port yang hanya berisi satu penerima (misalnya set-top box). Jangan dipakai di port yang menuju switch lain.
- Di Prestera, snooping berjalan di hardware. Di chip yang tidak mendukungnya, menyalakan snooping mematikan offload.

---

## 7. STP, RSTP, dan MSTP di Bridge

Konsep STP dan RSTP ada di `03-data-link/04-stp`. Di RouterOS, protokol dipilih per bridge dengan `protocol-mode` (`none`, `stp`, `rstp`, `mstp`); bawaannya `rstp`.

### 7.1 Pengaturan port yang penting

| Properti port | Fungsi | Padanan Cisco |
|---|---|---|
| `priority` (0..240) dan `path-cost` | Memengaruhi pemilihan root port | `spanning-tree port-priority`, `cost` |
| `edge=yes` | Port langsung ke perangkat akhir, langsung forwarding | `spanning-tree portfast` |
| `bpdu-guard=yes` | Port dinonaktifkan bila menerima BPDU; harus dinyalakan ulang manual | `spanning-tree bpduguard enable` |
| `restricted-role=yes` | Port tidak boleh menjadi root port (root guard); untuk STP dan RSTP sejak 7.14 | `spanning-tree guard root` |
| `point-to-point` | Paksa link dianggap point-to-point untuk konvergensi cepat | `spanning-tree link-type point-to-point` |

Untuk port pelanggan RT-RW Net: `edge=yes bpdu-guard=yes`. Bila pelanggan memasang switch atau router yang mengirim BPDU (atau membuat loop), port itu mati sendiri alih-alih merusak satu RW.

### 7.2 MSTP

MSTP memetakan kelompok VLAN ke beberapa instance spanning tree, sehingga link cadangan bisa membawa sebagian VLAN alih-alih diam. Dokumentasi menyatakan **bridge VLAN filtering wajib untuk MSTP**. Lab modul ini menunjukkan konsekuensinya secara konkret: membuat bridge dengan `vlan-filtering=no protocol-mode=mstp` ditolak RouterOS 7.24.5 dengan pesan

```
failure: mstp requires vlan-filtering
```

Urutan yang berhasil: bangun bridge dengan RSTP, aktifkan `vlan-filtering`, baru pindah ke MSTP dan buat instance:

```routeros
/interface bridge set br-core vlan-filtering=yes
/interface bridge set br-core protocol-mode=mstp region-name=RTRW-CORE region-revision=1
/interface bridge msti
add bridge=br-core identifier=1 vlan-mapping=10 priority=0x1000
add bridge=br-core identifier=2 vlan-mapping=20 priority=0x2000
```

Dua switch hanya berada di **region** yang sama bila `region-name`, `region-revision`, dan pemetaan VLAN ke instance identik. RouterOS menampilkan hash konfigurasi di `mst-config-digest` pada `/interface bridge monitor`; bandingkan nilainya di semua switch. Di luar region, semua instance diperlakukan sebagai satu pohon (CST/CIST).

Hasil di lab (SW1 punya prioritas 0x1000 untuk MSTI 1, SW2 punya 0x1000 untuk MSTI 2):

```
[admin@SW2] > /interface bridge msti monitor [find] once
               identifier: 0                        1                        2
                bridge-id: 0x8000.52:54:00:0B:00:02 0x2000.52:54:00:0B:00:02 0x1000.52:54:00:0B:00:02
              root-bridge: no                       no                       yes
  regional-root-bridge-id: 0x8000.52:54:00:0A:00:02 0x1001.52:54:00:0A:00:02 0x1002.52:54:00:0B:00:02
                root-port: bond-uplink              bond-uplink              none
```

SW1 menjadi root regional untuk VLAN 10, SW2 untuk VLAN 20. Pada jaringan dengan dua uplink fisik terpisah, pembagian ini membuat masing-masing uplink aktif untuk sebagian VLAN.

💡 Loop Protect (`/interface ethernet set ether5 loop-protect=on`) mendeteksi loop dengan mengirim paket EtherType 0x9003 dan mematikan port yang menerima paketnya sendiri. Dokumentasi tetap menyarankan (R/M)STP sebagai mekanisme utama; loop protect berguna sebagai lapisan tambahan di port pelanggan.

---

## 8. Bonding dan LACP

Bonding menggabungkan beberapa link menjadi satu antarmuka logis. Mode yang tersedia: `802.3ad`, `active-backup`, `balance-alb`, `balance-rr`, `balance-tlb`, `balance-xor`, `broadcast` (bawaan `balance-rr`).

⚠️ Hanya **802.3ad (LACP), balance-xor (static LAG), dan active-backup** yang di-offload ke switch chip pada perangkat Prestera dan chip 88E6393X/88E6191X/88E6190. Mode lain berjalan di CPU. Untuk antar-switch, pakai 802.3ad.

```routeros
/interface bonding add name=bond-uplink mode=802.3ad slaves=ether2,ether3 \
    lacp-rate=1sec transmit-hash-policy=layer-2-and-3
/interface bridge port add bridge=br-core interface=bond-uplink frame-types=admit-only-vlan-tagged
```

- `lacp-rate=1sec` mempercepat deteksi anggota yang mati (bawaan `30secs`).
- `transmit-hash-policy` menentukan pemilihan link per aliran. Satu aliran tidak pernah dipecah ke dua link, jadi satu unduhan besar tetap terbatas kecepatan satu anggota. Pada perangkat Prestera, dokumentasi mencatat hash **selalu** Layer2+Layer3+Layer4 saat di-offload, dan mengubah policy tidak berefek; pada 88E6393X dan sejenisnya hanya Layer2.
- `min-links` membuat bond dianggap down bila anggota aktif kurang dari nilai itu, berguna agar routing berpindah ke jalur lain daripada memaksa trafik lewat satu link sisa.
- Jangan memasukkan port anggota bond ke bridge secara terpisah. Masukkan bond-nya.

Hasil di lab (dua CHR saling LACP):

```
[admin@SW1] > /interface bonding monitor bond-uplink once
                    mode: 802.3ad
            active-ports: ether2
                          ether3
          inactive-ports:
          lacp-system-id: 52:54:00:0A:00:02
  lacp-partner-system-id: 52:54:00:0B:00:02
```

Setelah `ether2` dimatikan, `active-ports` tinggal `ether3` dan ping antar host di VLAN 10 tetap berjalan tanpa kehilangan paket.

Satu temuan lab yang berguna: dengan NIC virtio di QEMU, link dilaporkan `full-duplex: no`, dan LACP hanya mengaktifkan satu anggota (anggota lain tidak tersinkronisasi). Setelah NIC diganti ke e1000 yang melaporkan 1 Gbps full-duplex, kedua anggota aktif. LACP (802.3ad) mensyaratkan link full-duplex; pada perangkat fisik, periksa autonegosiasi bila anggota bond tidak mau aktif.

---

## 9. ACL Switch (Switch Rules)

`/interface ethernet switch rule` adalah firewall **stateless** di switch chip: dicek untuk setiap paket yang masuk, berhenti di aturan pertama yang cocok, dan berjalan dengan kecepatan kabel.

| Kategori | Contoh properti |
|---|---|
| Pencocok L2 | `src-mac-address`, `dst-mac-address`, `mac-protocol`, `vlan-id`, `vlan-priority` |
| Pencocok L3 | `src-address`, `dst-address`, `protocol`, `dscp`, (IPv6) `src-address6`, `dst-address6` |
| Pencocok L4 | `src-port`, `dst-port` |
| Aksi | `new-dst-ports` (kosong berarti drop, atau alihkan ke port), `redirect-to-cpu`, `copy-to-cpu`, `mirror`, `new-vlan-id`, `new-vlan-priority`, `rate` |

Contoh untuk RT-RW Net:

```routeros
/interface ethernet switch rule
# Blokir DHCP server liar dari port pelanggan (paket dengan UDP port sumber 67)
add switch=switch1 ports=ether1,ether2,ether3 mac-protocol=ip protocol=udp src-port=67 \
    new-dst-ports="" comment="drop rogue DHCP"
# Tamu Wi-Fi (VLAN 30 dari AP di sfp-sfpplus1) tidak boleh ke jaringan internal
add switch=switch1 ports=sfp-sfpplus1 vlan-id=30 dst-address=10.0.0.0/8 new-dst-ports=""
```

Hal yang perlu diingat dari dokumentasi:

- Aturan tanpa aksi berarti **accept**. Setel `mac-protocol=ip` atau `ipv6` saat mencocokkan alamat IP.
- Pencocok dan aksi VLAN butuh `vlan-filtering=yes` dan port yang di-offload.
- Jumlah aturan dibatasi memori chip. Untuk chip router sederhana, dokumentasi menyebut 8 sampai 32 aturan (Atheros8316), 8 sampai 16 (Atheros8327/QCA8337), dan 42 sampai 256 (88E6393X), tergantung jenis pencocok. Aturan yang tidak muat ditandai invalid di `/interface ethernet switch rule print`.
- Fitur seperti IGMP snooping, DHCP snooping, RoMON, PTP, dan loop protect membuat **aturan ACL dinamis**. Gunakan `place-before` agar aturan Anda tidak salah urut.
- Saat aturan ditambah, dihapus, atau dipindah, semua aturan nonaktif sesaat. Ada kemungkinan "kebocoran" paket selama perubahan.

ACL tidak bisa memahami state koneksi ("izinkan balasan, tolak yang baru"). Untuk itu Anda tetap butuh firewall CPU, dan sebaiknya hanya trafik yang benar-benar perlu yang diarahkan ke sana (`redirect-to-cpu=yes` untuk subset tertentu, alih-alih mematikan L3HW di seluruh port).

---

## 10. QoS Dasar di Switch

Switch chip punya alat pembatas sederhana yang tidak memakan CPU:

```routeros
# Policer ingress dan shaper egress per port
/interface ethernet switch port set ether21 ingress-rate=200M egress-rate=100M
# Policer berbasis ACL (misalnya per VLAN)
/interface ethernet switch rule add switch=switch1 ports=ether1 vlan-id=11 rate=10M
# Storm control: batasi broadcast dan unicast tak dikenal ke 1% kecepatan link
/interface ethernet switch port set ether1 storm-rate=1 limit-broadcasts=yes limit-unknown-unicasts=yes
```

- **Ingress policer** membuang kelebihan seketika. Dokumentasi mencatat efek sampingnya terhadap kontrol kemacetan TCP: throughput yang tercapai bisa lebih rendah dari angka yang disetel. **Egress shaper** mengantrekan dulu sehingga lebih halus.
- Storm control dinyatakan dalam persen kecepatan link: di link 1 Gbps, `storm-rate=10` berarti 100 Mbps. Chip 98DX224S, 98DX226S, 98DX2528, dan 98DX3236 (misalnya CRS326-24G-2S+) tidak bisa membedakan multicast tak dikenal dari semua multicast, sehingga `limit-unknown-multicasts` akan membatasi seluruh multicast.
- Dokumentasi juga mencatat bahwa `egress-rate` dan `storm-rate` tidak bekerja benar di port 10G yang tersambung pada kecepatan lebih rendah, untuk chip-chip di atas.
- Chip Prestera mendukung delapan antrean keluaran per port, pemetaan DSCP dan 802.1p PCP, serta penjadwalan strict priority dan SDWRR. Konfigurasinya ada di halaman QoS dokumentasi switch; `new-vlan-priority` di ACL adalah cara paling sederhana untuk menandai trafik.

💡 Untuk pembagian bandwidth per pelanggan (paket 10 Mbps, 20 Mbps), switch chip bukan tempatnya. Biarkan router PPPoE atau Hotspot dengan queue HTB yang melakukannya (`19-mikrotik/04-qos-queue-hotspot`). Pakai QoS switch untuk perlindungan kasar: membatasi AP hotspot, meredam broadcast storm, dan memprioritaskan VoIP di uplink.

---

## 11. Keamanan L2 Lain: DHCP Snooping dan Mirroring

**DHCP snooping** menandai port tepercaya (tempat server DHCP sah) dan membuang balasan DHCP dari port lain:

```routeros
/interface bridge set bridge1 dhcp-snooping=yes
/interface bridge port set [find interface=sfp-sfpplus1] trusted=yes
```

Di Prestera, switch membuat aturan ACL dinamis untuk menangkap paket DHCP dan mengirimnya ke CPU. Opsi 82 (Circuit ID dan Remote ID) bisa ditambahkan; sejak 7.23 nilainya bisa disusun dari variabel seperti nama antarmuka dan VLAN, yang berguna untuk memetakan alamat ke port fisik pelanggan.

**Port mirroring** menyalin trafik ke port analisis untuk Wireshark:

```routeros
/interface ethernet switch set switch1 mirror-target=ether23
/interface ethernet switch port set sfp-sfpplus1 mirror-ingress=yes mirror-egress=yes
```

Prestera juga mendukung mirroring berbasis VLAN, MAC, atau IP lewat ACL `mirror=yes`, dan RSPAN untuk membawa salinan melewati VLAN ke switch lain. Matikan mirroring setelah selesai; port target bisa kebanjiran.

---

## 12. SwOS atau RouterOS?

**SwOS** adalah sistem operasi khusus switch MikroTik. Dokumentasinya menggambarkan fungsi switch terkelola: switching L2 wire speed, monitoring, port-to-port forwarding, storm control, ACL, VLAN, mirroring, pembatasan bandwidth, dan modifikasi sebagian header. SwOS hanya bisa dikonfigurasi lewat **browser (HTTP, IPv4)**; tidak ada konsol, API, atau antarmuka lain.

| Aspek | SwOS (CRS3xx/CSS3xx) | RouterOS (CRS3xx) |
|---|---|---|
| Antarmuka | Web saja | CLI, WinBox, WebFig, SSH, API, REST |
| Spanning tree | RSTP | STP, RSTP, MSTP |
| VLAN | Hingga 250 entri (batas SwOS) | Bridge VLAN filtering penuh |
| ACL | Hingga 32 aturan (batas SwOS) | Sesuai kapasitas chip |
| Link aggregation | LACP dan statis, hingga 16 grup, 8 anggota | Bonding dengan offload |
| Routing | Tidak ada | Routing CPU dan L3HW |
| Otomasi | Terbatas | Skrip, API, Ansible, dan lainnya |
| Default | IP 192.168.88.1, user `admin` tanpa password | Default config perangkat |

Kapan SwOS masuk akal: switch akses sederhana yang hanya butuh VLAN, RSTP, isolasi port, dan ACL dasar, dikelola oleh teknisi yang nyaman dengan antarmuka web. Kapan RouterOS: Anda butuh MSTP, L3HW, otomasi, pemantauan terpadu, atau konsistensi konfigurasi dengan router.

Perangkat CRS3xx umumnya **dual boot**. Dari RouterOS:

```routeros
/system routerboard settings set boot-os=swos
/system reboot
```

Dari SwOS, pakai tombol "Boot RouterOS" di menu System. Sejak RouterOS 7.17, device-mode membatasi perpindahan ini; dokumentasi SwOS menyebut Anda perlu `system/device-mode/update routerboard=yes` (dengan konfirmasi fisik) terlebih dulu.

⚠️ Konfigurasi SwOS dan RouterOS **tidak saling dikonversi**. Berpindah sistem berarti mengonfigurasi ulang dari awal.

---

## 13. Kesalahan Umum yang Membuat Trafik Lewat CPU

Daftar ini disusun dari catatan "typical misconfiguration" di dokumentasi bridge dan L3HW, ditambah pengalaman lab. Setiap butir membuat switch 24 port berperilaku seperti router kecil yang kewalahan.

| Kesalahan | Akibat | Perbaikan |
|---|---|---|
| Membuat lebih dari satu bridge | Hanya satu yang di-offload; di L3HW bisa menghasilkan perilaku tak terdefinisi | Satu bridge, pisahkan dengan VLAN |
| `horizon` untuk isolasi pelanggan | Offload port itu mati | `switch port-isolation` |
| VLAN interface langsung di port fisik atau bond (`/interface vlan add interface=ether2`) | L3HW gagal; paket bisa di-offload salah dan melewati firewall/NAT | VLAN interface di atas bridge, port sebagai anggota tagged |
| Bridge tidak dimasukkan ke `tagged` VLAN yang dirutekan | VLAN itu tidak dirutekan (hanya L2) | Tambahkan bridge ke tagged |
| Bonding mode `balance-rr`, `balance-tlb`, `balance-alb` | Bonding di CPU | 802.3ad, balance-xor, atau active-backup |
| `use-ip-firewall=yes` di bridge, atau aturan bridge filter/NAT | Fast Path bridge mati, FastTrack terganggu | Hapus bila tidak perlu; filter di router |
| Sniffer atau Torch dibiarkan berjalan | Fast Path mati | Hentikan setelah diagnosis |
| Fitur yang tidak didukung chip (misalnya VLAN filtering di chip lama, DHCP snooping di chip yang tidak mendukung) | Offload mati untuk port atau bridge | Cek tabel fitur chip, atau pakai metode VLAN lama di menu switch |
| `ether-type=0x88a8` di chip 88E639x/88E619x | Offload mati | Pilih perangkat yang mendukung QinQ |
| ACL `redirect-to-cpu=yes` terlalu luas | Semua trafik yang cocok ke CPU | Persempit pencocok |
| Port yang bukan milik switch chip ikut bridge (misalnya port manajemen di chip terpisah) | Forwarding lewat CPU | Biarkan port itu untuk manajemen |
| Mengandalkan FastTrack HW untuk semua trafik | Memori FastTrack penuh, koneksi lambat dirutekan CPU | Maksimalkan routing hardware dan ACL; FastTrack untuk sisanya |

### 13.1 Prosedur diagnosis

1. `/interface bridge port print`: semua port data harus berflag `H`.
2. `/interface ethernet switch print`: kenali chip dan status `l3-hw-offloading`.
3. `/system resource print` dan `/tool profile`: CPU tinggi saat trafik besar berarti ada yang lewat CPU. Pada switch yang sehat, transfer file besar antar port hampir tidak menaikkan beban CPU.
4. `/interface/ethernet/switch/l3hw-settings/monitor`: jumlah rute di HW dan CPU, koneksi FastTrack yang di-offload.
5. `/ip firewall connection print where ...`: koneksi yang di-offload ke hardware diberi flag `H`, sesuai catatan dokumentasi L3HW.
6. `/interface bridge settings print`: periksa `use-ip-firewall`.

---

## 14. Konteks RT-RW Net Indonesia

Desain yang sering dijumpai pada RT-RW Net berskala ratusan pelanggan (gambaran umum, bukan standar):

```
              Internet (ISP berizin)
                     │
            ┌────────┴────────┐
            │ Router PPPoE /  │  queue HTB per pelanggan, firewall, NAT,
            │ Hotspot (CCR/   │  RADIUS ke User Manager (19.10)
            │ RB/CHR)         │
            └────────┬────────┘
                     │ trunk VLAN 10,20,99 (LACP 2 x 10G bila perlu)
            ┌────────┴────────┐
            │ CRS inti        │  bridge VLAN filtering, MSTP/RSTP,
            │ (CRS3xx)        │  L3HW antar VLAN internal (opsional)
            └──┬──────────┬───┘
     trunk     │          │     trunk
        ┌──────┴───┐  ┌───┴──────┐
        │ CRS akses│  │ CRS akses│  port pelanggan: PVID 10, edge, bpdu-guard,
        │ RW 01    │  │ RW 02    │  port-isolation ke uplink, storm control
        └──────────┘  └──────────┘
```

Prinsipnya: switch tetap sebagai switch (semua di hardware), router melakukan pekerjaan stateful. Isolasi pelanggan dilakukan di switch akses dengan port isolation, bukan dengan horizon. Snooping DHCP di switch akses menutup kasus klasik router pelanggan yang dicolok terbalik dan membagikan DHCP ke seluruh RW.

---

## 15. Lab: Logika Switching di CHR, Offload di Perangkat Fisik

### 15.1 Batas lab virtual

CHR tidak punya switch chip. Menu `/interface ethernet switch` tidak ada (`bad command name switch`), kolom `HW` di bridge port menampilkan `yes` tetapi flag `H` tidak pernah muncul, dan semua forwarding dilakukan CPU. Jadi lab CHR melatih **logika konfigurasi** (VLAN filtering, LACP, MSTP, IGMP snooping, BPDU guard) yang sama persis dengan di CRS. **Offload hardware, L3HW, ACL switch, port isolation chip, storm control, dan mirroring hanya bisa diuji di perangkat fisik.** Berkas `crs3xx-fisik.rsc` berisi contoh untuk perangkat fisik dan belum diuji.

### 15.2 Topologi

```
   HOST1                                              HOST2
 ether2 10.10.10.11/24 (VLAN10)               ether2 10.10.10.12/24 (VLAN10)
 ether3 10.20.20.11/24 (VLAN20)               ether3 10.20.20.12/24 (VLAN20)
   │      │                                          │      │
 ether4 ether5                                     ether4 ether5
 ┌──────────────┐  ether2 ═══ LACP ═══ ether2  ┌──────────────┐
 │     SW1      │  ether3 ═══ bond ═══ ether3  │     SW2      │
 │ br-core MSTP │                              │ br-core MSTP │
 │ vlan99 .1    │                              │ vlan99 .2    │
 └──────────────┘                              └──────────────┘
```

Berkas di `materi/lab/kode/mikrotik-aaa-switching/`: `sw1.rsc`, `sw2.rsc`, `host1.rsc`, `host2.rsc`, `switching.clab.yml`.

### 15.3 Langkah

1. Jalankan empat CHR dengan containerlab (`sudo containerlab deploy -t switching.clab.yml`, image dibangun dengan vrnetlab seperti di `19-mikrotik/10-user-manager-radius`) atau dengan GNS3/QEMU. Bila memakai QEMU, beri MAC unik pada setiap NIC dan pakai model NIC yang melaporkan full-duplex (misalnya e1000) agar LACP mengaktifkan kedua anggota.
2. Impor `sw1.rsc`, `sw2.rsc`, `host1.rsc`, `host2.rsc`.
3. **Verifikasi LACP.** `/interface bonding monitor bond-uplink once` di SW1: `active-ports` berisi ether2 dan ether3, `lacp-partner-system-id` berisi MAC SW2.
4. **Verifikasi MSTP.** `/interface bridge monitor br-core once` di kedua switch: `mst-config-digest` harus sama. `/interface bridge msti monitor [find] once`: SW1 root untuk instance 1, SW2 root untuk instance 2.
5. **Verifikasi VLAN.** Dari HOST1, `/ping 10.10.10.12` dan `/ping 10.20.20.12` berhasil. `/ping 10.20.20.12 src-address=10.10.10.11` tidak akan pernah lewat switch karena VLAN berbeda dan tidak ada router di topologi.
6. **Uji failover.** Di SW1, `/interface ethernet disable ether2`. Bond tetap up dengan ether3, ping tetap berjalan. Nyalakan kembali.
7. **Uji BPDU guard.** Di HOST1, buat bridge dari ether2 dan ether3 (`/interface bridge add name=loop; /interface bridge port add bridge=loop interface=ether2; /interface bridge port add bridge=loop interface=ether3`). BPDU dari bridge itu masuk ke port edge SW1, dan port tersebut dinonaktifkan oleh BPDU guard. Periksa log SW1 dan `/interface bridge port monitor`. Hapus bridge di HOST1, lalu nonaktifkan dan aktifkan kembali port SW1.
8. **Uji urutan MSTP.** Coba di switch baru: `/interface bridge add name=x vlan-filtering=no protocol-mode=mstp`. Catat pesan galatnya.

### 15.4 Hasil yang sudah diverifikasi

Langkah 2 sampai 8 dijalankan pada 13 Oktober 2026 dengan CHR 7.24.5 di QEMU/KVM. Contoh keluaran di bagian 7 dan 8 berasal dari sesi itu. Pada langkah 7, SW1 mencatat:

```
bridge,stp,warning bpdu-guard disabling ether4 due to received bpdu
bridge,stp,warning bpdu-guard disabling ether5 due to received bpdu

[admin@SW1] > /interface bridge port print
Flags: I - INACTIVE
;;; BPDU guard changed port role to disabled due to received BPDU frame, manual
     bridge port re-enable is required
1 I ether4       br-core  yes  none  ...  yes  yes   auto    10
```

Berkas containerlab tidak diuji dengan containerlab.

### 15.5 Bila punya CRS3xx fisik

1. Terapkan `crs3xx-fisik.rsc` lewat port manajemen dalam Safe Mode, sesuaikan nama port.
2. Pastikan semua port data berflag `H` di `/interface bridge port print`.
3. Jalankan `/tool bandwidth-test` atau iperf3 antar dua PC di port berbeda pada VLAN yang sama sambil memantau `/system resource print`: CPU harus hampir diam.
4. Tambahkan `horizon=1` pada satu port pelanggan, ulangi uji, dan amati hilangnya flag `H` serta naiknya beban CPU. Kembalikan dengan menghapus horizon dan memakai `port-isolation`.

---

## 16. Tabel Padanan

| Konsep | MikroTik RouterOS (CRS3xx) | Cisco IOS / IOS XE | Linux bridge |
|---|---|---|---|
| Port akses | `pvid=10` + untagged di `/interface bridge vlan` | `switchport mode access` + `switchport access vlan 10` | `bridge vlan add dev eth1 vid 10 pvid untagged` |
| Port trunk | tagged di `/interface bridge vlan` | `switchport mode trunk` | `bridge vlan add dev eth2 vid 10` |
| Isolasi port | `/interface ethernet switch port-isolation` | `switchport protected` | `bridge link set dev eth1 isolated on` |
| LACP | `/interface bonding add mode=802.3ad` | `channel-group 1 mode active` | `ip link add bond0 type bond mode 802.3ad` |
| MSTP | `protocol-mode=mstp` + `/interface bridge msti` | `spanning-tree mode mst` + `spanning-tree mst configuration` | (mstpd, di luar kernel) |
| PortFast + BPDU guard | `edge=yes bpdu-guard=yes` | `spanning-tree portfast` + `spanning-tree bpduguard enable` | (tidak di bridge kernel bawaan) |
| Storm control | `storm-rate=1 limit-broadcasts=yes` | `storm-control broadcast level 1.00` | (tc policer) |
| Mirroring | `mirror-target`, `mirror-ingress/egress` | `monitor session 1 source ... destination ...` | `tc ... mirred` |
| IGMP snooping | `igmp-snooping=yes` | `ip igmp snooping` (aktif bawaan di banyak platform) | `ip link set br0 type bridge mcast_snooping 1` |
| Routing antar-VLAN di hardware | L3HW + VLAN interface di bridge | SVI di switch L3 | (switchdev pada NIC tertentu) |

---

## 17. Ringkasan

- Switch chip meneruskan data dengan kecepatan kabel; CPU menangani kontrol. Tujuan konfigurasi CRS adalah menjaga data tetap di chip.
- Flag `H` adalah bukti offload. Satu bridge offload per chip; horizon dan fitur yang tidak didukung chip mematikan offload; sebagian perubahan me-reset chip.
- Di CRS3xx/5xx, bridge VLAN filtering di-offload. Pakai `frame-types`, biarkan `ingress-filtering`, masukkan bridge ke tagged hanya untuk VLAN yang perlu ke CPU, siapkan port manajemen dan Safe Mode.
- L3HW: saklar chip dan per port; HW routing bila port masuk dan keluar sama-sama aktif. VLAN interface harus di atas bridge. Firewall/NAT butuh CPU; FastTrack bisa di-offload; utamakan ACL.
- Isolasi pelanggan dengan `switch port-isolation` (private VLAN), bukan horizon.
- IGMP snooping butuh querier. MSTP butuh vlan-filtering, dan region harus identik (cek `mst-config-digest`).
- LACP, balance-xor, dan active-backup yang di-offload; hash di Prestera selalu L2+L3+L4.
- ACL switch stateless, first match, terbatas memori, dan juga dipakai fitur dinamis. QoS switch untuk perlindungan kasar; bandwidth per pelanggan tetap di router.
- SwOS: web saja, RSTP, cocok untuk switch akses sederhana. RouterOS: MSTP, L3HW, otomasi. Dual boot dengan `boot-os=swos`, dibatasi device-mode sejak 7.17.

---

## 18. Latihan

1. Sebuah CRS326 dipakai sebagai switch akses 20 pelanggan. Setelah admin menambahkan `horizon=1` di semua port pelanggan, keluhan "internet lambat malam hari" meningkat dan `/system resource print` menunjukkan CPU 100%. Jelaskan penyebabnya dan konfigurasi pengganti yang tetap mengisolasi pelanggan.
2. Admin membuat `bridge-lan` untuk VLAN kantor dan `bridge-tamu` untuk VLAN tamu di CRS317 yang sama, lalu mengeluh throughput antar port di `bridge-tamu` rendah. Apa yang terjadi dan bagaimana mendesain ulang?
3. Di CRS dengan L3HW aktif, routing antara VLAN 10 dan VLAN 11 berjalan dengan kecepatan kabel, tetapi VLAN 20 tidak bisa dirutekan sama sekali. `/interface bridge vlan print` menunjukkan VLAN 20 tagged hanya di `sfp-sfpplus1`. Apa yang kurang?
4. Mengapa dokumentasi L3HW memperingatkan agar VLAN interface tidak dibuat langsung di port fisik (`/interface vlan add interface=sfp-sfpplus1 ...`) saat L3HW aktif? Apa risiko keamanannya?
5. Dua switch MSTP sudah memakai `region-name` dan `region-revision` yang sama, tetapi `/interface bridge msti monitor` menunjukkan masing-masing switch menganggap dirinya root regional untuk semua instance, dan MSTI tidak bekerja sesuai rancangan. Apa yang Anda bandingkan pertama kali, dan mengapa?
6. Teknisi membuat bonding `balance-rr` antara dua CRS untuk "menggandakan kecepatan". Apa dua masalah dengan pilihan itu di CRS3xx?
7. IGMP snooping sudah diaktifkan untuk VLAN CCTV multicast, tetapi setelah beberapa menit kamera berhenti terlihat di NVR, lalu muncul lagi ketika NVR dimulai ulang. Tidak ada router multicast di VLAN itu. Jelaskan penyebab dan perbaikannya.
8. Router pelanggan di RW 02 dipasang terbalik (port LAN ke kabel dari switch), sehingga ia membagikan DHCP ke seluruh VLAN pelanggan. Sebutkan dua fitur CRS yang bisa mencegah ini, satu berbasis bridge dan satu berbasis ACL, lengkap dengan perintahnya.
9. Kapan Anda akan memilih SwOS untuk sebuah CRS326, dan kapan RouterOS? Apa yang harus diperhatikan sebelum mengubah `boot-os` di perangkat dengan RouterOS 7.17 atau lebih baru?
10. Anda hanya punya laptop dan CHR, tanpa CRS fisik. Fitur apa dari modul ini yang bisa Anda uji dengan benar di CHR, dan mana yang tidak? Jelaskan alasannya.

<details>
<summary>Jawaban</summary>

1. Dokumentasi bridge menyatakan split horizon adalah fitur perangkat lunak yang **mematikan hardware offloading**. Dengan horizon di semua port pelanggan, seluruh trafik pelanggan naik ke CPU kecil CRS, sehingga pada jam sibuk CPU jenuh dan latensi naik. Pengganti yang tetap mengisolasi: hapus horizon, lalu pakai isolasi di switch chip, misalnya `/interface ethernet switch port-isolation set ether1 forwarding-override=sfp-sfpplus1` untuk setiap port pelanggan (pola private VLAN). Setelah itu periksa bahwa flag `H` kembali muncul di semua port.

2. Selain CRS1xx/2xx, setiap switch chip hanya mendukung **satu bridge yang di-offload**. Bridge kedua diproses CPU, sehingga throughput `bridge-tamu` terbatas kemampuan CPU. Desain ulang: satu bridge dengan `vlan-filtering=yes`, VLAN kantor dan VLAN tamu dipisahkan sebagai VLAN berbeda di `/interface bridge vlan`. Isolasi antar VLAN tetap terjaga karena frame tidak bisa menyeberang VLAN tanpa routing, dan semua port tetap di hardware.

3. Untuk routing antar-VLAN, **bridge itu sendiri harus menjadi anggota tagged** di entri `/interface bridge vlan` setiap VLAN yang dirutekan. Tanpa itu, VLAN 20 hanya diswitch di L2 dan tidak mencapai VLAN interface di bridge. Perbaiki dengan menambahkan bridge ke tagged VLAN 20, misalnya `/interface bridge vlan set [find vlan-ids=20] tagged=bridge1,sfp-sfpplus1`. Sesuai anjuran dokumentasi, matikan L3HW sebelum mengubah konfigurasi L2 dan nyalakan lagi setelahnya.

4. L3HW berdiri di atas L2HW, dan pemrosesan VLAN dilakukan oleh L2HW di bridge. VLAN interface yang dibuat langsung di port fisik atau bond tidak terhubung ke bridge yang di-offload, sehingga dokumentasi menyebut paket bisa di-offload secara salah, **melewati pemrosesan CPU seperti firewall dan NAT**, dan menghasilkan perilaku tak terdefinisi. Risiko keamanannya: aturan firewall yang Anda kira melindungi VLAN itu bisa dilompati. Perbaikannya: masukkan port ke bridge sebagai anggota tagged dan buat VLAN interface di atas bridge, atau matikan `l3-hw-offloading` di port tersebut bila konfigurasi itu memang diperlukan.

5. Bandingkan **`mst-config-digest`** di `/interface bridge monitor` kedua switch. Dua switch hanya satu region bila nama, revisi, **dan pemetaan VLAN ke instance** identik; digest adalah hash dari pemetaan itu. Bila satu switch memetakan VLAN 10 ke instance 1 dan yang lain ke instance 2, atau ada VLAN tambahan di salah satu, digest berbeda dan keduanya dianggap region terpisah: semua instance di batas region dilebur ke CIST sehingga pembagian beban per instance tidak terjadi. Samakan daftar `/interface bridge msti`.

6. (a) Hanya 802.3ad, balance-xor, dan active-backup yang di-offload ke switch chip; `balance-rr` diproses CPU, sehingga trafik antar switch justru melambat dan membebani CPU. (b) `balance-rr` mengirim paket bergantian di semua link, yang bisa membuat paket satu aliran tiba tidak berurutan dan tidak dinegosiasikan dengan pihak lain (tidak ada LACP untuk mendeteksi anggota mati atau salah kabel). Gunakan `mode=802.3ad` di kedua sisi; perhatikan bahwa satu aliran tetap terbatas kecepatan satu anggota karena hashing per aliran.

7. Snooping membangun MDB dari laporan keanggotaan IGMP, dan laporan itu biasanya dipicu query dari querier. Tanpa router multicast atau querier, laporan hanya dikirim saat penerima pertama kali bergabung, sehingga entri MDB kedaluwarsa setelah `membership-interval` (bawaan 4m20s) dan bridge berhenti meneruskan aliran ke port NVR. Saat NVR dimulai ulang, ia bergabung lagi dan entri dibuat ulang. Perbaikan: jadikan bridge querier dengan `/interface bridge set bridge1 multicast-querier=yes`, atau sediakan IGMP proxy/router PIM di VLAN itu.

8. Berbasis bridge: **DHCP snooping**, `/interface bridge set bridge1 dhcp-snooping=yes` dan tandai hanya uplink ke server sah sebagai tepercaya, `/interface bridge port set [find interface=sfp-sfpplus1] trusted=yes`. Balasan DHCP dari port pelanggan dibuang. Berbasis ACL: aturan switch yang membuang paket UDP dengan port sumber 67 dari port pelanggan, `/interface ethernet switch rule add switch=switch1 ports=ether1,ether2,... mac-protocol=ip protocol=udp src-port=67 new-dst-ports=""`. Pastikan chip Anda mendukung DHCP snooping dengan offload sebelum memakai cara pertama.

9. Pilih **SwOS** bila switch hanya butuh fungsi akses dasar (VLAN, RSTP, isolasi port, ACL sederhana di bawah batas 32 aturan, LAG), dikelola lewat web oleh teknisi, dan Anda tidak butuh MSTP, routing, atau otomasi. Pilih **RouterOS** bila butuh MSTP, L3HW, bridge VLAN filtering penuh, skrip dan API, atau konsistensi dengan router MikroTik lain. Sebelum mengubah `boot-os` di RouterOS 7.17 ke atas, periksa device-mode: dokumentasi SwOS menyebut transisi dual boot dibatasi dan perlu `system/device-mode/update routerboard=yes` dengan konfirmasi fisik. Ingat juga bahwa konfigurasi tidak dikonversi antar sistem, jadi siapkan konfigurasi pengganti dan akses ke 192.168.88.1.

10. Bisa diuji benar di CHR (karena dikerjakan bridge perangkat lunak RouterOS dengan sintaks yang sama): bridge VLAN filtering, PVID dan frame-types, VLAN interface, LACP dan bonding lainnya, STP/RSTP/MSTP termasuk region dan instance, BPDU guard dan edge, IGMP snooping (logika MDB), DHCP snooping di bridge. Tidak bisa diuji: semua yang ada di `/interface ethernet switch` (port isolation chip, ACL switch, ingress/egress rate, storm control, mirroring chip), L3HW dan FastTrack HW, serta bukti offload (flag `H`, beban CPU rendah). Alasannya, CHR tidak punya switch chip: menu switch tidak ada dan seluruh forwarding dikerjakan CPU, jadi CHR hanya memvalidasi logika, bukan perilaku hardware.

</details>

---

## 19. Sumber

- MikroTik, Bridging and Switching: https://help.mikrotik.com/docs/spaces/ROS/pages/328068/Bridging+and+Switching
- MikroTik, Marvell Prestera switch chip features (dulu "CRS3xx, CRS5xx, CCR2116, CCR2216 switch chip features"): https://help.mikrotik.com/docs/spaces/ROS/pages/30474317/Marvell+Prestera+switch+chip+features
- MikroTik, Switch Chip Features: https://help.mikrotik.com/docs/spaces/ROS/pages/15302988/Switch+Chip+Features
- MikroTik, L3 Hardware Offloading: https://help.mikrotik.com/docs/spaces/ROS/pages/62390319/L3+Hardware+Offloading
- MikroTik, Packet Flow in RouterOS: https://help.mikrotik.com/docs/spaces/ROS/pages/328227/Packet+Flow+in+RouterOS
- MikroTik, Spanning Tree Protocol: https://help.mikrotik.com/docs/spaces/ROS/pages/21725254/Spanning+Tree+Protocol
- MikroTik, Bonding: https://help.mikrotik.com/docs/spaces/ROS/pages/8323193/Bonding
- MikroTik, Bridge IGMP/MLD snooping: https://help.mikrotik.com/docs/spaces/ROS/pages/59277403/Bridge+IGMP+MLD+snooping
- MikroTik, Loop Protect: https://help.mikrotik.com/docs/display/ROS/Loop+Protect
- MikroTik, SwOS: https://help.mikrotik.com/docs/spaces/SWOS/pages/328415/SwOS
- MikroTik, SwOS CRS3xx and CSS3xx series Manual: https://help.mikrotik.com/docs/spaces/SWOS/pages/76415036/CRS3xx+and+CSS3xx+series+Manual
- MikroTik, Device-mode: https://help.mikrotik.com/docs/spaces/ROS/pages/93749258/Device-mode
- MikroTik, changelog RouterOS v7 (7.21, 7.23, 7.24): https://mikrotik.com/download/changelogs
- MikroTik, MTCSWE training outline: https://i.mt.lv/cdn/training_pdf/mtcswe_outline_202083141326.pdf
- IEEE 802.1Q (VLAN bridges, termasuk MSTP) dan IEEE 802.1AX (link aggregation): https://standards.ieee.org/
- containerlab, MikroTik RouterOS (kind mikrotik_ros): https://containerlab.dev/manual/kinds/vr-ros/

---

**Berikutnya:** `22-service-provider/01-mpls-ldp` — masuk ke jaringan service provider: MPLS dan LDP dari sudut pandang multi-vendor.

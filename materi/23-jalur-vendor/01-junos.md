# 23.1 Junos untuk Network Engineer

> **Prasyarat:** `07-routing-lanjutan/06-bgp`, `22-service-provider/01-mpls-ldp`, `07-routing-lanjutan/04-ospf`
> **Tujuan:** Anda bisa membaca dan menulis konfigurasi Junos dasar (interface, routing-instance, OSPF, eBGP, policy-options), memakai alur candidate config dengan `commit check`, `commit confirmed`, dan `rollback` tanpa mengunci diri dari perangkat, menerjemahkan konfigurasi antara Junos, Cisco IOS XE, dan MikroTik RouterOS v7, serta memetakan materi ini ke ujian JNCIA-Junos (JN0-106).

---

## 1. Pengantar: Label Pendalaman

> [!WARNING]
> **Label pendalaman.** Modul ini adalah spesialisasi vendor setelah Tahap 22. Isinya **tidak diuji** di CCNA, Network+, maupun MTCNA. Lewati dulu bila target Anda salah satu dari ketiganya, dan kembali ke sini ketika karier atau pekerjaan Anda menyentuh perangkat Juniper.

Juniper dipakai luas di backbone operator, data center, dan sebagian kampus besar. Seorang engineer yang bekerja di ISP hampir pasti bertemu Junos, termasuk di lab dan di modul 22.1 yang sudah menyebut `set protocols ldp`. Kabar baiknya: konsep routing yang Anda kenal tidak berubah. Yang berubah adalah **cara perangkat menyimpan, mengubah, dan mengesahkan konfigurasi**. Itulah inti modul ini.

Ujian yang menjadi sasaran pemetaan adalah **JNCIA-Junos, kode ujian JN0-106** (65 soal pilihan ganda, 90 menit, diselenggarakan Pearson VUE, tanpa prasyarat sertifikasi). Kode ini menggantikan JN0-105. Kode sertifikasi sering berganti, jadi selalu cek lembar ujian di situs Juniper sebelum mendaftar. Pemetaan rinci ada di bagian 12.

### Peta modul

| Bagian | Isi |
|---|---|
| 3 | Arsitektur: Routing Engine dan Packet Forwarding Engine |
| 4 sampai 6 | CLI, candidate config, commit, rollback, `set` dan `display set` |
| 7 sampai 10 | Interface, routing-instance, OSPF, BGP, policy-options |
| 11 | Tabel berdampingan Junos, Cisco IOS XE, MikroTik v7 |
| 12 | Pemetaan ke JNCIA-Junos |

---

## 2. Analogi

Bayangkan konfigurasi sebagai **naskah koran**. Di Cisco IOS dan MikroTik, setiap kalimat yang Anda ketik langsung dicetak di halaman: salah ketik berarti salah cetak, dan Anda harus mengoreksinya dengan edisi berikutnya. Di Junos Anda bekerja di **meja redaksi**: Anda menyunting salinan naskah (candidate), membandingkannya dengan edisi yang beredar (`show | compare`), meminta redaktur memeriksa (`commit check`), lalu baru menekan tombol cetak (`commit`). Ada tombol "cetak percobaan, tarik kembali otomatis jika tidak dikonfirmasi" (`commit confirmed`), dan arsip 50 edisi terakhir yang bisa dipanggil kembali (`rollback`).

---

## 3. Arsitektur Junos: Routing Engine dan Packet Forwarding Engine

Junos memisahkan dua tugas dengan tegas, dan dokumentasi Juniper menyebut pemisahan ini sebagai filosofi desain yang sama di semua perangkat Junos.

- **Routing Engine (RE)** adalah bidang kontrol. Di dalamnya berjalan sistem operasi berbasis FreeBSD dan proses-proses terpisah: `rpd` (routing protocol daemon, menjalankan OSPF, BGP, IS-IS, LDP), `mgd` (management daemon, melayani CLI dan NETCONF), `chassisd` (chassis daemon), dan lainnya. Tabel routing dibangun di sini.
- **Packet Forwarding Engine (PFE)** adalah bidang data. Ia memakai ASIC untuk switching layer 2 dan 3, lookup rute, dan penerusan paket. RE menurunkan **forwarding table** ke PFE, sehingga trafik tetap mengalir walau RE sedang sibuk.

Pada perangkat kelas atas (seri MX, PTX) pemisahan ini terjadi dalam perangkat keras: RE adalah kartu tersendiri, dan sering ada dua RE untuk redundansi. Pada perangkat kecil (misalnya SRX kecil atau vJunos di lab) pemisahan terjadi dalam perangkat lunak.

Dari sisi operasi ada beberapa akibat penting:

- Proses yang crash biasanya tidak menjatuhkan seluruh sistem: `rpd` bisa restart sendiri sementara PFE tetap meneruskan paket dengan forwarding table terakhir.
- Satu image sistem operasi dipakai di semua kelas perangkat (model "one Junos"), sehingga keterampilan CLI Anda berpindah dari router ke switch dan firewall.
- Trafik yang ditujukan **ke** router itu sendiri (SSH, BGP, ping ke loopback) dilindungi oleh **firewall filter pada `lo0`**, mirip fungsi CoPP di Cisco. Ini sebabnya filter di `lo0` termasuk keterampilan dasar Junos.

---

## 4. CLI: Mode Operasional dan Mode Konfigurasi

Junos punya dua mode dengan prompt berbeda.

| Mode | Prompt | Dipakai untuk | Masuk/keluar |
|---|---|---|---|
| **Operasional** | `user@R1>` | `show`, `ping`, `traceroute`, `monitor`, `request`, `restart` | Setelah login (root dulu masuk shell `%`, ketik `cli`) |
| **Konfigurasi** | `user@R1#` | `set`, `delete`, `edit`, `show`, `commit`, `rollback` | `configure` dari mode operasional, `exit` untuk kembali |

Beberapa kebiasaan CLI yang sering membuat pemula tersandung:

- **Spasi atau Tab** melengkapi perintah, dan `?` menampilkan opsi. Tanda `|` meneruskan keluaran ke filter seperti `match`, `except`, `count`, `no-more`, `display set`.
- Dari mode konfigurasi Anda bisa menjalankan perintah operasional dengan awalan `run`: `run show interfaces terse`.
- `show` di mode konfigurasi menampilkan **candidate**, sedangkan `show` di mode operasional menampilkan **status** yang sedang berjalan. Ini dua hal berbeda.
- `edit protocols ospf` memindahkan Anda ke tingkat hierarki itu (prompt berubah menjadi `[edit protocols ospf]`). `up`, `top`, dan `exit` menavigasi naik. Perintah `set` dan `show` sesudahnya relatif terhadap posisi saat ini.

```
user@R1> show interfaces terse
Interface               Admin Link Proto    Local                 Remote
ge-0/0/0                up    up
ge-0/0/0.0              up    up   inet     10.0.12.1/30
lo0.0                   up    up   inet     192.0.2.1            --> 0/0

user@R1> configure
[edit]
user@R1# edit protocols ospf
[edit protocols ospf]
user@R1# top
[edit]
user@R1#
```

Nama interface Junos mengikuti pola **tipe-FPC/PIC/port**: `ge-0/0/0` adalah Gigabit Ethernet pada FPC 0, PIC 0, port 0. Awalan lain: `xe-` (10GE), `et-` (40/100GE), `lo0` (loopback), `irb` (L3 untuk VLAN), `ae` (aggregated Ethernet), `fxp0` atau `em0` (management di luar bidang data).

---

## 5. Candidate Config, Commit, dan Rollback

Ini bagian terpenting modul ini. Junos menyimpan beberapa salinan konfigurasi.

- **Active (running) configuration**: yang sedang dipakai, tersimpan di `/config/juniper.conf`.
- **Candidate configuration**: salinan kerja yang Anda ubah dengan `set` dan `delete`. Tidak berpengaruh ke jaringan sampai di-commit.
- **Arsip**: setiap `commit` menyimpan versi sebelumnya sebagai `juniper.conf.1.gz` dan seterusnya. Anda bisa `rollback 1` sampai `rollback 49` (49 arsip, ditambah versi aktif sebagai nomor 0). `rollback 0` membuang perubahan candidate dan mengembalikannya ke versi aktif saat ini.
- **Rescue configuration**: konfigurasi "aman" yang Anda simpan sendiri dengan `request system configuration rescue save` dan panggil dengan `rollback rescue`.

### Alur kerja standar

```
[edit]
user@R1# set interfaces ge-0/0/1 unit 0 family inet address 10.0.23.1/30
user@R1# show | compare
[edit interfaces]
+   ge-0/0/1 {
+       unit 0 {
+           family inet {
+               address 10.0.23.1/30;
+           }
+       }
+   }
user@R1# commit check
configuration check succeeds
user@R1# commit confirmed 5
commit confirmed will be automatically rolled back in 5 minutes unless confirmed
commit complete
(uji konektivitas)
user@R1# commit
commit complete
```

| Perintah | Fungsi |
|---|---|
| `show \| compare` | Diff antara candidate dan active. Tanda `+` ditambah, `-` dihapus. Biasakan sebelum setiap commit |
| `commit check` | Memvalidasi sintaks dan konsistensi tanpa mengaktifkan |
| `commit` | Mengaktifkan candidate |
| `commit confirmed [menit]` | Mengaktifkan, tetapi **otomatis rollback** bila tidak ada `commit` kedua dalam waktu itu. Bawaan 10 menit |
| `commit comment "teks"` | Menyimpan catatan perubahan di riwayat (`show system commit`) |
| `commit and-quit` | Commit lalu keluar dari mode konfigurasi |
| `rollback N` | Memuat versi arsip ke-N ke candidate. **Belum aktif** sampai Anda `commit` |
| `load override`, `load merge`, `load set` | Memuat berkas konfigurasi penuh, menggabungkan, atau menjalankan baris `set` dari berkas/paste |
| `show system commit` | Riwayat commit, juga menampilkan jadwal rollback dari `commit confirmed` |

> [!TIP]
> **Kebiasaan emas:** setiap perubahan yang menyentuh interface manajemen, routing menuju router, atau akses SSH, gunakan `commit confirmed`. Bila perubahan memutus Anda, tunggu beberapa menit dan perangkat memulihkan dirinya sendiri. Mekanisme ini yang membuat engineer Junos tenang mengubah router jarak jauh. Juniper sendiri menjelaskannya sebagai cara memastikan perubahan tidak menutup akses manajemen, dan semua pengguna yang login menerima pesan siaran saat rollback otomatis terjadi.

> [!WARNING]
> `rollback 1` **tidak langsung mengembalikan jaringan**. Ia hanya mengisi candidate dengan versi lama. Tanpa `commit`, router tetap memakai konfigurasi yang bermasalah. Kesalahan ini sangat umum saat panik.

### Di mana ekuivalennya di platform lain

- **Cisco IOS XE:** perubahan berlaku **seketika** pada running-config, dan baru bertahan setelah reload bila Anda `write memory`. Ekuivalen kasar `commit confirmed` adalah `reload in 10` (membatalkan dengan `reload cancel`) yang dipadukan dengan konfigurasi yang belum disimpan. Fitur *configuration replace* (`configure replace flash:backup.cfg force`) menyerupai `rollback` ke berkas.
- **MikroTik RouterOS v7:** perubahan berlaku seketika. Pengaman setara adalah **Safe Mode** (tombol Safe di WinBox atau `Ctrl+X` di terminal): perubahan dibatalkan otomatis bila sesi putus sebelum Anda keluar dari Safe Mode. Cadangan memakai `/system backup save` dan `/export`.

---

## 6. Hierarki, `set`, dan `show | display set`

Konfigurasi Junos adalah **pohon hierarkis** berbentuk blok bersarang, bukan daftar baris datar seperti IOS.

```
interfaces {
    ge-0/0/0 {
        unit 0 {
            family inet {
                address 10.0.12.1/30;
            }
        }
    }
}
protocols {
    ospf {
        area 0.0.0.0 {
            interface ge-0/0/0.0;
        }
    }
}
```

Format yang sama dapat ditulis sebagai **perintah `set` satu baris**, yang jauh lebih mudah disalin, dikirim lewat chat, dan dibandingkan:

```
user@R1> show configuration | display set
set interfaces ge-0/0/0 unit 0 family inet address 10.0.12.1/30
set protocols ospf area 0.0.0.0 interface ge-0/0/0.0
```

- `set` menambah atau mengubah nilai, `delete` menghapus satu cabang (atau seluruh blok bila tidak spesifik), `deactivate` menonaktifkan cabang tanpa menghapusnya (ditandai `inactive:`), `activate` membalikkannya.
- `show configuration | display set` dan `show | display set` hanya mengubah **tampilan**. Cocok untuk otomasi: Anda bisa membuat berkas berisi baris `set`, lalu `load set terminal` atau `load set namaberkas`.
- `wildcard delete` dan `replace pattern` menolong ketika banyak baris perlu diubah sekaligus.
- Konfigurasi bisa memakai **groups** (`set groups NAMA ...` lalu `set apply-groups NAMA`) untuk templat, mirip peran `range`/template di perangkat lain.

---

## 7. Interface, Unit, dan Family

Ini perbedaan konseptual terbesar bagi pengguna Cisco: alamat IP **tidak** diletakkan pada interface fisik, melainkan pada **unit logis** di dalamnya.

```
set interfaces ge-0/0/0 description "LINK-KE-R2"
set interfaces ge-0/0/0 unit 0 family inet address 10.0.12.1/30
set interfaces ge-0/0/0 unit 0 family inet6 address 2001:db8:12::1/64
set interfaces ge-0/0/0 unit 0 family mpls
set interfaces lo0 unit 0 family inet address 192.0.2.1/32
```

- **Interface fisik** (`ge-0/0/0`) membawa properti tingkat fisik (deskripsi, MTU, VLAN tagging).
- **Unit** (`unit 0`) adalah sub-interface logis. Notasinya `ge-0/0/0.0`, dan notasi inilah yang dipakai OSPF, BGP, dan policy. Untuk VLAN Anda memakai `vlan-tagging` dan `unit 100 vlan-id 100`.
- **Family** (`inet` untuk IPv4, `inet6` untuk IPv6, `mpls`, `iso` untuk IS-IS, `ethernet-switching` untuk switching) menentukan protokol yang boleh lewat. Lupa `family mpls` adalah penyebab klasik LDP tidak naik.
- Interface baru **belum otomatis** `up` untuk alamat: pastikan tidak ada `disable` dan lihat `show interfaces terse`.

Padanannya:

| Hal | Junos | Cisco IOS XE | MikroTik v7 |
|---|---|---|---|
| Alamat IPv4 | `set interfaces ge-0/0/0 unit 0 family inet address 10.0.12.1/30` | `interface Gi0/0` lalu `ip address 10.0.12.1 255.255.255.252` | `/ip address add address=10.0.12.1/30 interface=ether1` |
| Loopback | `lo0 unit 0` | `interface Loopback0` | `/interface bridge add name=lo0` lalu alamat /32 di bridge itu |
| Sub-interface VLAN | `unit 100 vlan-id 100` | `interface Gi0/0.100` + `encapsulation dot1Q 100` | `/interface vlan add name=v100 vlan-id=100 interface=ether1` |

---

## 8. Routing-Instance

Router Junos memiliki satu **instance routing utama** (`inet.0` untuk IPv4 unicast, `inet6.0`, `mpls.0`, dan seterusnya). Untuk memisahkan tabel routing Anda membuat **routing-instance**.

```
set routing-instances CUST-A instance-type virtual-router
set routing-instances CUST-A interface ge-0/0/1.0
set routing-instances CUST-A routing-options static route 0.0.0.0/0 next-hop 172.16.1.2
```

Tabel routing instance itu bernama `CUST-A.inet.0`. Perintah verifikasinya `show route table CUST-A.inet.0` dan `ping 172.16.1.2 routing-instance CUST-A`.

| `instance-type` | Gunanya |
|---|---|
| `virtual-router` | Tabel terpisah tanpa atribut VPN. Padanan VRF-lite |
| `vrf` | VRF MPLS L3VPN: butuh `route-distinguisher` dan `vrf-target` (atau `vrf-import`/`vrf-export`) |
| `forwarding` | Untuk filter-based forwarding |
| `l2vpn`, `evpn`, `vpls` | Layanan layer 2 (modul 22.4) |

Padanannya: `ip vrf` / `vrf definition` di Cisco, dan `/ip vrf` serta `/routing table` di MikroTik v7. Di modul 22.2 Anda akan melihat `instance-type vrf` bersama RD dan RT. Perbedaannya hanya sintaks; konsepnya sama.

---

## 9. Routing Dasar: Static, OSPF, dan BGP

### Static dan router-id

```
set routing-options router-id 192.0.2.1
set routing-options autonomous-system 65001
set routing-options static route 198.51.100.0/24 next-hop 10.0.12.2
```

### Route preference (padanan administrative distance)

Junos menyebutnya **preference**, dan **angka lebih kecil menang**, sama seperti AD.

| Sumber | Preference Junos | AD Cisco |
|---|---|---|
| Direct | 0 | 0 |
| Static | 5 | 1 |
| OSPF internal | 10 | 110 |
| IS-IS Level 1 / Level 2 | 15 / 18 | 115 |
| RIP | 100 | 120 |
| OSPF external | 150 | 110 |
| BGP | 170 | 20 (eBGP) / 200 (iBGP) |

> [!WARNING]
> Dua perbedaan dengan Cisco yang sering menipu: Junos **tidak membedakan eBGP dan iBGP** pada preference bawaan (keduanya 170, sedangkan Cisco 20 dan 200), dan nilai OSPF external (150) berbeda dari OSPF internal (10). Bila Anda memindahkan desain dari Cisco ke Junos, periksa ulang rute mana yang menang.

### OSPF

```
set protocols ospf area 0.0.0.0 interface ge-0/0/0.0 interface-type p2p
set protocols ospf area 0.0.0.0 interface lo0.0 passive
```

- Area ditulis dalam **format dotted** (`0.0.0.0`).
- Interface dimasukkan **per interface** (bukan per `network` + wildcard seperti `network 10.0.0.0 0.0.0.3 area 0` di IOS). Ini mirip `ip ospf 1 area 0` di interface Cisco atau `interface-template` di MikroTik.
- Verifikasi: `show ospf neighbor`, `show ospf interface`, `show ospf database`, `show route protocol ospf`.

### BGP

```
set routing-options autonomous-system 65001
set protocols bgp group ISP type external
set protocols bgp group ISP peer-as 65002
set protocols bgp group ISP neighbor 10.0.12.2
set protocols bgp group ISP export ANNOUNCE-PREFIX
set protocols bgp group ISP import FROM-ISP
```

- Neighbor dikelompokkan dalam **group**, dan parameter umum (type, peer-as, policy) ditaruh di group, bukan per neighbor.
- Untuk iBGP: `type internal`, `local-address 192.0.2.1`, dan `family inet unicast` (family tambahan seperti `inet-vpn unicast` untuk L3VPN).
- Perilaku bawaan yang harus dipahami: Junos hanya **mengiklankan rute BGP aktif** lewat export default. Prefix dari `direct`, `static`, atau OSPF **tidak** diiklankan ke tetangga BGP sampai Anda membuat **export policy** (bagian 10). Berbeda dengan `network` di Cisco atau `output.network` di MikroTik.
- Verifikasi: `show bgp summary`, `show route receive-protocol bgp 10.0.12.2`, `show route advertising-protocol bgp 10.0.12.2`.

---

## 10. Policy-Options

Semua kendali rute di Junos (redistribusi, filter prefix, pengaturan atribut BGP) berada di satu tempat, `policy-options`, dan dipasang ke protokol sebagai **import** atau **export**.

```
set policy-options prefix-list MY-NETS 198.51.100.0/24
set policy-options policy-statement ANNOUNCE-PREFIX term OWN from prefix-list MY-NETS
set policy-options policy-statement ANNOUNCE-PREFIX term OWN then accept
set policy-options policy-statement ANNOUNCE-PREFIX term REST then reject
```

Cara membaca: `policy-statement` berisi **term** yang dievaluasi **berurutan**. Tiap term punya `from` (kondisi) dan `then` (aksi). Aksi `accept` dan `reject` menghentikan evaluasi; aksi seperti `local-preference`, `metric`, atau `community add` tidak menghentikan dan bisa digabung dengan `accept`. Jika tidak ada term yang cocok, berlakulah **kebijakan bawaan protokol** (misalnya, untuk BGP: import menerima semua rute BGP, export hanya mengiklankan rute BGP aktif).

Beberapa bentuk yang sering dipakai:

```
set policy-options policy-statement FROM-ISP term SET-LP from protocol bgp
set policy-options policy-statement FROM-ISP term SET-LP then local-preference 200
set policy-options policy-statement FROM-ISP term SET-LP then accept
set policy-options policy-statement STATIC-TO-OSPF term 1 from protocol static
set policy-options policy-statement STATIC-TO-OSPF term 1 then accept
set protocols ospf export STATIC-TO-OSPF
```

- `route-filter 198.51.100.0/24 exact` mencocokkan rute dengan panjang prefix tertentu; pilihan lain `orlonger`, `upto /28`, `prefix-length-range /24-/26`.
- `policy-statement` dapat dirantai: `export [ POLICY-A POLICY-B ]`. Dievaluasi kiri ke kanan.
- Redistribusi di Junos adalah **export policy ke protokol tujuan**, bukan perintah `redistribute` di dalam protokol. Contoh di atas "mengeluarkan" static ke OSPF.

Padanan: `route-map` + `prefix-list` + `redistribute` di Cisco; `/routing filter rule` (chain `in`/`out`, bahasa aturan) dan `output.redistribute` di MikroTik v7.

---

## 11. Perbandingan Berdampingan

| Tugas | Junos | Cisco IOS XE | MikroTik RouterOS v7 |
|---|---|---|---|
| Masuk konfigurasi | `configure` | `configure terminal` | Langsung (tidak ada mode) |
| Aktifkan perubahan | `commit` | Otomatis | Otomatis |
| Uji aman | `commit confirmed 5` | `reload in 10` | Safe Mode |
| Lihat diff | `show \| compare` | `show archive config differences` | `/export compare=...` |
| Simpan | `commit` (sekaligus) | `write memory` | Otomatis |
| Batalkan | `rollback 1` + `commit` | `configure replace` | `/system backup load` |
| Tampilan satu baris | `show \| display set` | `show running-config` | `/export` |
| OSPF di interface | `set protocols ospf area 0.0.0.0 interface ge-0/0/0.0` | `interface Gi0/0` lalu `ip ospf 1 area 0` | `/routing ospf interface-template add area=backbone interfaces=ether1` |
| eBGP | `set protocols bgp group ISP type external` ... | `router bgp 65001` lalu `neighbor 10.0.12.2 remote-as 65002` | `/routing bgp connection add remote.address=10.0.12.2 remote.as=65002 local.role=ebgp` |
| Iklankan prefix ke BGP | export policy | `network ... mask ...` | `output.network=` atau `output.redistribute=` |
| Tabel routing | `show route` | `show ip route` | `/ip route print` |
| Tetangga OSPF | `show ospf neighbor` | `show ip ospf neighbor` | `/routing ospf neighbor print` |
| Ringkasan BGP | `show bgp summary` | `show ip bgp summary` | `/routing bgp session print` |

Contoh satu skenario ditulis tiga kali: link 10.0.12.0/30, loopback 192.0.2.1/32, OSPF area 0.

```
# Junos
set interfaces ge-0/0/0 unit 0 family inet address 10.0.12.1/30
set interfaces lo0 unit 0 family inet address 192.0.2.1/32
set protocols ospf area 0.0.0.0 interface ge-0/0/0.0 interface-type p2p
set protocols ospf area 0.0.0.0 interface lo0.0 passive
commit
```

```
! Cisco IOS XE
interface GigabitEthernet0/0
 ip address 10.0.12.1 255.255.255.252
 ip ospf network point-to-point
 ip ospf 1 area 0
interface Loopback0
 ip address 192.0.2.1 255.255.255.255
 ip ospf 1 area 0
router ospf 1
 router-id 192.0.2.1
 passive-interface Loopback0
```

```
# MikroTik RouterOS v7
/ip address add address=10.0.12.1/30 interface=ether1
/interface bridge add name=lo0
/ip address add address=192.0.2.1/32 interface=lo0
/routing ospf instance add name=o1 version=2 router-id=192.0.2.1
/routing ospf area add name=backbone area-id=0.0.0.0 instance=o1
/routing ospf interface-template add area=backbone interfaces=ether1 type=ptp
/routing ospf interface-template add area=backbone interfaces=lo0 passive
```

---

## 12. Pemetaan ke JNCIA-Junos (JN0-106)

Lembar ujian Juniper membagi JN0-106 menjadi tujuh area. Tabel ini memetakan ke bagian modul dan modul lain di kurikulum ini.

| Area ujian | Contoh objektif | Dibahas di |
|---|---|---|
| Networking Fundamentals | Collision/broadcast domain, alamat L2/L3, subnetting, IPv4/IPv6, longest match | Tahap 01 sampai 04, 08 |
| Junos OS Fundamentals | Software architecture, control dan forwarding plane, RE dan PFE, candidate vs active, rollback, filtering output | Bagian 3 sampai 6 |
| User Interfaces | CLI, operasional vs konfigurasi, J-Web (hanya fungsi inti) | Bagian 4 |
| Configuration Basics | Factory-default, user account, login class, interface types, configuration groups, NTP, SNMP, syslog, arsip, rescue configuration | Bagian 5 sampai 7 |
| Operational Monitoring and Maintenance | `show`, `monitor`, statistik interface, ping/traceroute, upgrade, pemulihan password root | Bagian 4 (dasar) |
| Routing Fundamentals | Routing vs forwarding table, route preference, routing-instance, static routing, protokol dinamis | Bagian 8 dan 9 |
| Routing Policy and Firewall Filters | Import/export policy, policy flow, term, match, action, firewall filter, uRPF | Bagian 10 (policy), filter lanjutan perlu sumber Juniper |

Cakupan ujian bisa berubah. Cek lembar ujian resmi di situs Juniper untuk kode dan objektif terbaru; JN0-106 menggantikan JN0-105. Materi ini **tidak cukup** untuk lulus tanpa latihan di perangkat nyata atau vJunos/vSRX lab, serta dokumentasi Juniper TechLibrary dan jalur Juniper Learning Portal.

---

## 13. Kesalahan Umum

> [!CAUTION]
> **Lupa `commit`.** Perubahan hanya ada di candidate. Prompt `[edit]` dan peringatan "uncommitted changes" saat `exit` adalah petunjuknya.

> [!CAUTION]
> **`rollback 1` tanpa `commit`.** Hanya mengganti candidate.

> [!CAUTION]
> **Mengubah akses manajemen dengan `commit` biasa.** Pakai `commit confirmed`, dan jangan lupa konfirmasi sebelum waktunya habis bila perubahan berhasil.

> [!CAUTION]
> **BGP tidak mengiklankan prefix `direct`/`static`.** Itu perilaku bawaan, bukan bug. Buat export policy.

> [!CAUTION]
> **Lupa `family`** (`inet`, `mpls`, `iso`) pada unit. Alamat tidak jadi aktif atau LDP/IS-IS tidak naik.

> [!CAUTION]
> **Menulis interface OSPF tanpa unit** (`ge-0/0/0` bukan `ge-0/0/0.0`).

> [!TIP]
> Biasakan urutan: `show | compare`, `commit check`, `commit confirmed`, uji, `commit`. Lalu simpan `show | display set` sebagai catatan perubahan.

---

## 14. Ringkasan

- Junos memisahkan **Routing Engine** (kontrol, `rpd`, `mgd`) dan **Packet Forwarding Engine** (ASIC, forwarding table).
- Dua mode: operasional (`>`) dan konfigurasi (`#`). `run` menjalankan perintah operasional dari mode konfigurasi.
- Konfigurasi bekerja lewat **candidate**; `commit` mengaktifkannya, `commit confirmed` memberi rollback otomatis (bawaan 10 menit), `rollback N` memuat versi arsip (0 sampai 49) yang tetap perlu `commit`.
- `show | compare` memperlihatkan diff; `show | display set` mengubah blok bersarang menjadi baris `set`.
- Alamat berada di **unit** dan **family**: `ge-0/0/0 unit 0 family inet address ...`.
- `routing-instance` memisahkan tabel (`virtual-router`, `vrf`). Tabelnya bernama `NAMA.inet.0`.
- Preference: direct 0, static 5, OSPF 10, IS-IS 15/18, RIP 100, OSPF external 150, BGP 170.
- BGP: group, neighbor, dan **export policy wajib** untuk mengiklankan rute non-BGP.
- `policy-options` memuat `policy-statement` berisi term (`from`, `then`), `prefix-list`, `route-filter`.
- Ujian target: **JNCIA-Junos JN0-106**, 65 soal, 90 menit.

---

## 15. Latihan

1. Anda mengubah alamat IP interface manajemen router jarak jauh. Tulis tiga perintah berurutan yang aman dilakukan, dan jelaskan apa yang terjadi bila perubahan memutus SSH Anda.
2. Anda menjalankan `rollback 2` lalu keluar dari mode konfigurasi tanpa perintah lain. Apakah konfigurasi router berubah? Jelaskan.
3. Ubah bentuk hierarki berikut menjadi baris `set`:
   `protocols { ospf { area 0.0.0.0 { interface ge-0/0/1.0 { metric 20; } } } }`
4. Sebuah router memiliki rute ke 203.0.113.0/24 dari static, OSPF internal, dan BGP. Mana yang masuk ke forwarding table, dan apa urutan berikutnya bila rute static dihapus?
5. eBGP ke ISP sudah `Established` di `show bgp summary`, tetapi ISP tidak melihat prefix 198.51.100.0/24 milik Anda yang ada sebagai rute `static` ke `discard`. Apa penyebab dan perbaikannya (tulis konfigurasi)?
6. Sebutkan dua perbedaan antara `routing-instance` bertipe `virtual-router` dan `vrf`, dan nama tabel IPv4 untuk instance bernama `CUST-A`.
7. Terjemahkan ke Junos: pada Cisco, `router ospf 1` / `network 10.0.12.0 0.0.0.3 area 0` / `passive-interface Loopback0`. Tulis ketiga hasilnya sebagai baris `set`, dengan asumsi link di `ge-0/0/0`.
8. Pada lembar ujian JN0-106, area ujian mana yang mencakup candidate/rollback, rescue configuration, dan firewall filter? Sebutkan untuk masing-masing.

<details>
<summary>Jawaban</summary>

1. Urutannya: `set interfaces fxp0 unit 0 family inet address <alamat-baru>/<len>` (atau interface manajemen Anda), `commit confirmed 5`, lalu uji akses lewat alamat baru dan jalankan `commit` untuk mengonfirmasi. Bila SSH putus, Anda tidak perlu berbuat apa-apa: setelah 5 menit tanpa konfirmasi router otomatis memuat dan meng-commit konfigurasi sebelumnya, dan akses lama pulih. Pesan siaran dikirim ke pengguna yang login.
2. **Tidak berubah.** `rollback 2` hanya memuat versi arsip ke-2 ke dalam candidate. Tanpa `commit`, konfigurasi aktif tetap yang lama. Saat `exit`, Junos mengingatkan ada perubahan yang belum di-commit.
3. `set protocols ospf area 0.0.0.0 interface ge-0/0/1.0 metric 20`.
4. Yang menang adalah **static** (preference 5), karena paling kecil. Bila static dihapus, **OSPF internal** (10) menggantikan, lalu BGP (170) bila OSPF juga hilang. Preference menentukan rute aktif per prefix yang sama.
5. Junos tidak mengiklankan rute non-BGP ke tetangga BGP tanpa export policy. Perbaikan:
   `set policy-options prefix-list MY-NETS 198.51.100.0/24`
   `set policy-options policy-statement ANNOUNCE-PREFIX term OWN from protocol static`
   `set policy-options policy-statement ANNOUNCE-PREFIX term OWN from prefix-list MY-NETS`
   `set policy-options policy-statement ANNOUNCE-PREFIX term OWN then accept`
   `set protocols bgp group ISP export ANNOUNCE-PREFIX`
   lalu `commit`. Verifikasi dengan `show route advertising-protocol bgp <neighbor>`.
6. (a) `vrf` membutuhkan `route-distinguisher` dan `vrf-target`/policy VRF karena menjadi bagian dari MPLS L3VPN; `virtual-router` tidak punya atribut VPN dan hanya memisahkan tabel lokal. (b) `vrf` dapat ikut dipertukarkan lewat MP-BGP dengan route target, sedangkan `virtual-router` hanya bermakna lokal. Nama tabelnya `CUST-A.inet.0`.
7. `set protocols ospf area 0.0.0.0 interface ge-0/0/0.0`, `set protocols ospf area 0.0.0.0 interface lo0.0 passive`. Tiga hal: area `0.0.0.0`, interface ditambahkan per interface (bukan `network`), dan `passive` menjadi opsi pada interface itu. Alamat link ditentukan di `set interfaces ge-0/0/0 unit 0 family inet address ...`.
8. Candidate dan rollback termasuk **Junos OS Fundamentals**. Rescue configuration termasuk **Configuration Basics**. Firewall filter termasuk **Routing Policy and Firewall Filters**.

</details>

---

## 16. Sumber

- Juniper, JNCIA-Junos Exam Flyer (kode JN0-106, objektif, 65 soal, 90 menit): https://www.juniper.net/content/dam/www/assets/training/us/en/jncia-junos-exam-flyer.pdf
- Juniper, Junos Software Architecture (Routing Engine dan Packet Forwarding Engine): https://www.juniper.net/documentation/us/en/software/junos/junos-overview/topics/concept/junos-software-architecture.html
- Juniper, Commit the Configuration Only After Confirmation (`commit confirmed`, bawaan 10 menit): https://juniper.net/documentation/en_US/junos12.3/topics/task/configuration/junos-cli-configuration-activating-after-confirming.html
- Juniper, Junos OS CLI dan dokumentasi lainnya: https://www.juniper.net/documentation/
- MikroTik, REST API dan dokumentasi RouterOS v7: https://help.mikrotik.com/docs/spaces/ROS/pages/47579162/REST+API

---

**Berikutnya:** `23-jalur-vendor/02-sd-access-sd-wan`. Dari satu perangkat ke seluruh fabric: Cisco SD-Access untuk kampus dan Catalyst SD-WAN untuk cabang.

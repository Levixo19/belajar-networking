# 20.2 Babak 1: Audit Warisan (Forensik)

> **Prasyarat:** `20.1`, ditambah `03` (data link), `04` (network layer), `09` (NAT/ACL/firewall), `12` (keamanan), `13` (Linux), `19` (MikroTik)
> **Tujuan:** Membedah konfigurasi dan keluaran perintah yang sudah berjalan di BNS, menemukan cacatnya tanpa diberi petunjuk, lalu mengubah temuan mentah menjadi laporan audit yang bisa dibaca manajemen.

---

## 1. Bentuk Kerja Babak Ini

Babak ini bukan mendesain. Babak ini **mencari yang salah pada sesuatu yang "katanya sudah jalan"** — keterampilan yang paling sering dipakai di hari pertama kerja dan paling jarang dilatih di kelas.

Aturannya:

- Anda dapat lima berkas bukti: konfigurasi switch HQ, keluaran perintah pemeriksaan, konfigurasi MikroTik TPI, konfigurasi server Linux, dan hasil wawancara proses kerja.
- **Sapu semuanya sebelum menilai.** Jangan berhenti di temuan pertama yang menarik.
- Untuk setiap temuan, catat lima kolom: `ID | temuan | kategori | tingkat | kalau dibiarkan`.
- Kategori: **K** keamanan · **A** ketersediaan · **N** kinerja · **P** kepatuhan/operasional.
- Tingkat: **1** kritis (bisa merusak bisnis pekan ini) · **2** tinggi · **3** sedang · **4** rendah.
- Target realistis: **minimal 30 temuan**. Auditor berpengalaman menemukan 45+.

> [!NOTE]
> Mode Ujian: 120 menit. Mode Kilat: 45 menit, cukup kejar tingkat 1 dan 2.

> [!TIP]
> Trik profesional: baca konfigurasi **dua kali dengan pertanyaan berbeda**. Sapuan pertama: "apa yang ada di sini tapi seharusnya tidak ada?" Sapuan kedua: "apa yang tidak ada di sini tapi seharusnya ada?" Sapuan kedua selalu menghasilkan lebih banyak temuan, dan hampir selalu dilewatkan pemula.

---

## 2. Bukti A: Switch Akses HQ (`JKT-AC-SW03`)

```cisco
version 12.2
no service password-encryption
!
hostname Switch
!
enable password bahari123
username admin password 0 Bahari2019!
!
ip http server
ip http secure-server
!
vtp domain NULL
vtp mode server
!
spanning-tree mode pvst
!
interface range FastEthernet0/1 - 20
 switchport mode dynamic desirable
!
interface FastEthernet0/5
 speed 10
 duplex half
 description printer lantai 2
!
interface FastEthernet0/21
 description AP lantai 2
 switchport mode access
!
interface FastEthernet0/22
 description meja rapat tamu
 switchport mode access
!
interface range FastEthernet0/23 - 24
 description tidak dipakai
!
interface GigabitEthernet0/1
 description uplink ke core
 switchport mode dynamic desirable
!
interface Vlan1
 ip address 192.168.10.53 255.255.255.0
 no shutdown
!
ip default-gateway 192.168.10.1
!
snmp-server community public RW
snmp-server community private RW
!
line con 0
 no login
line vty 0 4
 password bahari123
 login
 transport input telnet
!
end
```

> [!WARNING]
> Konfigurasi ini pendek. Justru itu masalahnya.

---

## 3. Bukti B: Keluaran Perintah Pemeriksaan

```cisco
JKT-AC-SW03# show version
Cisco IOS Software, C2960 Software, Version 12.2(55)SE
Uptime is 3 years, 21 weeks, 4 days
System restarted at 02:14:07 UTC Mon Mar 6 2023
System returned to ROM by power-on
```

```cisco
JKT-AC-SW03# show clock
*00:41:52.109 UTC Mon Mar 1 1993
```

```cisco
JKT-AC-SW03# show interfaces status
Port      Name                Status       Vlan   Duplex  Speed Type
Fa0/5     printer lantai 2    connected    1      half    10    10/100BaseTX
Fa0/9                         connected    1      a-full  a-100 10/100BaseTX
Fa0/21    AP lantai 2         connected    1      a-full  a-100 10/100BaseTX
Fa0/22    meja rapat tamu     connected    1      a-full  a-100 10/100BaseTX
Fa0/23    tidak dipakai       connected    1      a-full  a-100 10/100BaseTX
Fa0/24    tidak dipakai       notconnect   1      auto    auto  10/100BaseTX
Gi0/1     uplink ke core      connected    trunk  a-full  a-1000 10/100/1000BaseTX
```

```cisco
JKT-AC-SW03# show interfaces counters errors
Port        Align-Err   FCS-Err  Xmit-Err   Rcv-Err  UnderSize  OutDiscards
Fa0/5              0     48211         0     48211          0            0
Gi0/1           1092     31877         0     32969          0        11204
```

```cisco
JKT-AC-SW03# show mac address-table count
Dynamic Address Count : 7940
Total Mac Address Space Available: 252
```

```cisco
JKT-AC-SW03# show spanning-tree vlan 1

VLAN0001
  Spanning tree enabled protocol ieee
  Root ID    Priority    32769
             Address     0cd9.96aa.1b40
             This bridge is the root
             Hello Time  2 sec  Max Age 20 sec  Forward Delay 15 sec

  Bridge ID  Priority    32769  (priority 32768 sys-id-ext 1)
             Address     0cd9.96aa.1b40
  Number of topology changes 41892 last change occurred 00:00:09 ago
```

```cisco
JKT-AC-SW03# show logging | include MACFLAP|LOOP|ERR
%SW_MATM-4-MACFLAP_NOTIF: Host a4b1.c1de.77f0 in vlan 1 is flapping between port Fa0/23 and port Gi0/1
%SW_MATM-4-MACFLAP_NOTIF: Host 0026.9902.aa31 in vlan 1 is flapping between port Fa0/23 and port Gi0/1
```

```cisco
JKT-AC-SW03# show cdp neighbors
Device ID    Local Intrfce   Holdtme  Capability  Platform   Port ID
JKT-CORE-01  Gig 0/1          142        R S I    WS-C3850   Gig 1/0/13
SWITCH-8P    Fas 0/23         167          S      unknown    port 1
```

---

## 4. Bukti C: MikroTik TPI-04 (`/export` disederhanakan)

```routeros
# model = RB952Ui-5ac2nD
/system identity set name=MikroTik
/system clock set time-zone-name=manual
/interface bridge add name=bridge1
/interface bridge port add bridge=bridge1 interface=ether2
/interface bridge port add bridge=bridge1 interface=ether3
/interface bridge port add bridge=bridge1 interface=ether4
/interface bridge port add bridge=bridge1 interface=wlan1
/interface bridge port add bridge=bridge1 interface=wlan2
/ip address add address=192.168.88.1/29 interface=bridge1
/ip pool add name=dhcp ranges=192.168.88.2-192.168.88.6
/ip dhcp-server add address-pool=dhcp interface=bridge1 lease-time=3d disabled=no
/ip dhcp-client add interface=lte1 disabled=no
/ip dns set servers=8.8.8.8 allow-remote-requests=yes
/ip firewall nat add chain=srcnat action=masquerade
/interface wireless security-profiles set default authentication-types=wpa-psk,wpa2-psk wpa-pre-shared-key=bahari2019 wpa2-pre-shared-key=bahari2019
/interface wireless set wlan1 disabled=no mode=ap-bridge ssid=BNS-TPI frequency=auto
/interface wireless set wlan2 disabled=no mode=ap-bridge ssid=BNS-TPI-5G frequency=auto
/interface wireguard add name=wg-hq listen-port=13231
/interface wireguard peers add interface=wg-hq public-key="..." allowed-address=10.0.0.0/8
/ip service set telnet disabled=no
/ip service set ftp disabled=no
/ip service set www disabled=no
/ip service set api disabled=no
/ip cloud set ddns-enabled=yes
/user set admin password=Bahari2019!
/system backup
```

Catatan lapangan dari teknisi: *"Konfigurasi 12 TPI disalin dari TPI-01, cuma alamat LTE-nya beda. Sensor suhu, timbangan, tablet, dan Wi-Fi tamu nelayan semuanya nyambung ke situ."*

---

## 5. Bukti D: Server Linux `jkt-nas01` (NAS + DNS + backup)

```bash
root@jkt-nas01:~# ip -brief addr
lo        UNKNOWN  127.0.0.1/8
eth0      UP       192.168.10.20/24
eth1      UP       192.168.10.21/24

root@jkt-nas01:~# nft list ruleset
table inet filter {
  chain input   { type filter hook input priority 0; policy accept; }
  chain forward { type filter hook forward priority 0; policy accept; }
  chain output  { type filter hook output priority 0; policy accept; }
}

root@jkt-nas01:~# grep -vE '^#|^$' /etc/ssh/sshd_config
Port 22
PermitRootLogin yes
PasswordAuthentication yes

root@jkt-nas01:~# cat /etc/resolv.conf
nameserver 8.8.8.8

root@jkt-nas01:~# crontab -l
0 1 * * * rsync -a /srv/erp-db/ /srv/backup/erp-db/
0 2 * * * rsync -a /srv/file/  /srv/backup/file/

root@jkt-nas01:~# timedatectl | head -3
               Local time: Sat 2026-09-12 08:19:44 +07
           Time zone: Asia/Jakarta (WIB, +0700)
 System clock synchronized: no

root@jkt-nas01:~# df -h /srv/backup
Filesystem      Size  Used Avail Use% Mounted on
/dev/md0        7.3T  7.1T  152G  98% /srv/backup

root@jkt-nas01:~# last -n 3 root
root  pts/0  103.xx.xx.41   Fri Sep 11 23:51   still logged in
root  pts/1  192.168.10.77  Fri Sep 11 09:12 - 09:40  (00:28)
root  pts/0  41.xx.xx.190   Thu Sep 10 03:22 - 04:10  (00:48)
```

Router internet HQ punya aturan *port forward* `TCP/22 → 192.168.10.20` "supaya vendor ERP bisa masuk".

---

## 6. Bukti E: Wawancara Proses Kerja

| Pertanyaan | Jawaban tim IT |
|---|---|
| Di mana cadangan konfigurasi perangkat? | "Tidak ada. Kalau rusak kami konfigurasi ulang dari ingatan." |
| Siapa yang tahu password perangkat? | "Semua orang IT. Sama semua." |
| Kalau ada perubahan, dicatat di mana? | "Di grup WhatsApp." |
| Ada diagram jaringan? | "Ada, dibuat 2019. Sudah banyak berubah." |
| Log perangkat disimpan di mana? | "Di perangkatnya masing-masing." |
| Siapa yang dihubungi saat alarm jam 2 malam? | "Tidak ada alarm. Biasanya operator produksi yang telepon." |
| Kapan terakhir uji pemulihan dari cadangan? | "Belum pernah. Cadangannya jalan kok, kelihatan di layar." |
| Ada daftar perangkat? | "Ada di Excel, terakhir diperbarui 2021." |

---

## 7. Tugas Anda

Tulis `02-temuan-audit.md` berisi:

1. **Tabel temuan** — lima kolom seperti di §1, satu baris satu temuan. Jangan gabungkan dua masalah dalam satu baris.
2. **Sepuluh besar** — urutkan sepuluh temuan paling mendesak. Urutan berdasar **risiko bisnis**, bukan berdasar "yang paling gampang diperbaiki" atau "yang paling bikin malu".
3. **Peta tiket** — untuk tiap tiket helpdesk T-881, T-902, T-915, T-930, T-944 di `20.1 §3.3`, tunjuk temuan mana yang menjelaskannya. Satu tiket boleh punya lebih dari satu penyebab, dan satu temuan boleh menjelaskan beberapa tiket.
4. **Perbaikan aman untuk pabrik** — pilih 5 temuan yang bisa diperbaiki **tanpa menghentikan produksi**, dan 5 yang **wajib jendela malam**. Bu Ratna akan menanyakan ini.
5. **Satu paragraf untuk direksi** — tanpa jargon, maksimal 120 kata, menjawab: seberapa parah, apa yang paling mungkin terjadi kalau dibiarkan, dan apa yang Anda minta.

---

## 8. Checksum Temuan

Supaya bisa menilai kelengkapan tanpa mengintip kunci, hitung sebaran temuan Anda:

| Bukti | Temuan minimum yang seharusnya ketemu |
|---|---|
| A — config switch | 14 |
| B — keluaran perintah | 8 |
| C — MikroTik TPI | 11 |
| D — Linux & router | 9 |
| E — proses kerja | 7 |

Kalau salah satu baris Anda jauh di bawah angka itu, kembali ke bukti tersebut **sebelum** membuka kunci. Biasanya yang terlewat adalah temuan jenis "seharusnya ada tapi tidak ada".

---

## 9. Ringkasan

- Audit warisan adalah pekerjaan membaca dua kali: mencari yang salah ada, lalu mencari yang benar tidak ada.
- Temuan tanpa tingkat risiko dan tanpa dampak bisnis bukan temuan audit, hanya daftar keluhan.
- Jaringan datar, kredensial seragam, waktu tidak tersinkronisasi, dan tidak adanya log terpusat adalah empat cacat yang menjelaskan sebagian besar gejala di BNS.
- Cadangan yang belum pernah diuji pulih bukan cadangan.

---

## 10. Latihan: Pembuktian Temuan

Kerjakan setelah tabel temuan Anda selesai. Soal ini menguji apakah Anda memahami **mekanismenya**, bukan hanya mengenali polanya.

1. Pada Bukti B, switch akses ini menjadi *root bridge* untuk VLAN 1 dan mencatat 41.892 perubahan topologi. Jelaskan rangkaian sebab-akibatnya sampai ke gejala yang dirasakan pengguna, dan sebutkan satu perintah konfigurasi yang mencegah perangkat liar mengambil peran root.
2. `show mac address-table count` menunjukkan 7.940 alamat dinamis dengan sisa ruang 252. Sebutkan dua penjelasan yang sangat berbeda untuk angka ini, lalu jelaskan perintah apa yang Anda pakai untuk membedakan keduanya.
3. Hubungkan tiket T-902 ("tablet TPI-04 minta login ulang, kadang gagal kirim 2 jam") dengan **dua** cacat berbeda pada Bukti C. Untuk masing-masing, jelaskan mengapa gejalanya bisa seperti itu dan bukan seperti "tidak bisa terhubung sama sekali".
4. Pada Bukti D, mengapa kombinasi `crontab` + `df -h` + jawaban wawancara terakhir membuat perusahaan ini **tidak punya perlindungan apa pun terhadap ransomware**, walaupun tim IT merasa sudah punya cadangan? Sebutkan tiga sifat yang wajib dimiliki cadangan agar layak disebut cadangan.
5. Pada Bukti C, peer WireGuard di TPI dikonfigurasi dengan `listen-port` dan tanpa `endpoint`. Jelaskan mengapa rancangan ini pasti gagal pada jalur LTE, dan bagaimana arah pembentukan terowongan seharusnya diatur untuk 20 TPI.

<details>
<summary>Jawaban</summary>

1. Rangkaiannya: semua port akses memakai `switchport mode dynamic desirable` dan tidak ada `spanning-tree portfast` maupun `bpduguard`, jadi ketika seseorang menancapkan switch 8 port tak dikenal ke Fa0/23 (terlihat di `show cdp neighbors` sebagai `SWITCH-8P`, dan Fa0/23 berlabel "tidak dipakai" tapi statusnya `connected`), switch liar itu ikut pemilihan STP. Prioritas semua perangkat masih default 32768, sehingga **pemenangnya ditentukan oleh MAC terendah** — akibatnya switch akses (atau bahkan switch liar) bisa menjadi root, dan lalu lintas antar-lantai mengambil jalur yang tidak masuk akal (melewati switch akses, bahkan lewat perangkat murah dengan uplink 100 Mbps). Lebih buruk: topologi berubah terus (41.892 kali, terakhir 9 detik lalu) sehingga setiap perubahan memicu penghapusan tabel MAC dan *flooding* — inilah yang dirasakan pengguna sebagai "jaringan lambat dan kadang putus sebentar", termasuk tiket T-930. Pesan `MACFLAP` mengonfirmasi ada jalur ganda/loop lewat Fa0/23. Pencegahan di port akses: **`spanning-tree portfast` + `spanning-tree bpduguard enable`** (atau global `spanning-tree portfast bpduguard default`) — port yang menerima BPDU langsung masuk err-disable. Lengkapi dengan `spanning-tree guard root` pada port yang tidak boleh mengarah ke root, menetapkan `spanning-tree vlan x root primary` (prioritas rendah) di switch core, dan berpindah ke `rapid-pvst` supaya konvergensi detik, bukan puluhan detik. Catatan: `switchport mode dynamic desirable` juga harus diganti menjadi `access` + `nonegotiate`, karena DTP di port pengguna membuka jalan VLAN hopping.

2. Dua penjelasan yang sangat berbeda: **(a)** ini switch kecil dengan tabel MAC terbatas yang benar-benar sedang menampung ribuan alamat karena **satu broadcast domain datar** menampung seluruh kantor (plus perangkat di balik switch liar); **(b)** ini **serangan/kegagalan MAC flooding** — perangkat terinfeksi atau alat seperti `macof` membanjiri alamat sumber palsu supaya tabel penuh, switch berubah perilaku menjadi seperti hub (*unknown unicast flooding*), sehingga penyerang bisa menyadap lalu lintas. Cara membedakan: `show mac address-table dynamic interface <port>` per port — pada kasus (a) alamat tersebar wajar di banyak port dengan jumlah masuk akal; pada kasus (b) **satu port menyumbang ribuan MAC** dan pola alamatnya acak/berurutan tidak wajar. Dukung dengan `show mac address-table count` berulang (kecepatan pertumbuhan), `show interfaces <port> counters` (laju paket tidak wajar), dan cek apakah alamat-alamat itu pernah membalas ARP. Perbaikannya berbeda pula: (a) segmentasi VLAN, (b) `switchport port-security` dengan batas jumlah MAC + `violation restrict/shutdown`, ditambah pemantauan. Poin pelajaran: satu angka bisa berarti kapasitas habis atau serangan; auditor yang baik tidak memilih tafsir paling dramatis, ia mencari data pembeda.

3. Dua cacat berbeda di Bukti C yang menghasilkan gejala T-902:
   - **Waktu tidak tersinkronisasi.** `/system clock set time-zone-name=manual` tanpa klien NTP, dan RouterOS tanpa baterai jam akan mulai dari waktu default setelah mati listrik. Tablet dan timbangan berkomunikasi lewat HTTPS; **validasi sertifikat TLS bergantung pada jam yang benar**. Jam yang salah membuat sertifikat dianggap "belum berlaku" atau "kedaluwarsa", token sesi dianggap kedaluwarsa, sehingga aplikasi meminta login ulang berkali-kali. Gejalanya bukan "tidak bisa terhubung" karena lapisan IP tetap normal — ping jalan, portal jalan, hanya autentikasi dan TLS yang gagal. Gejala ini juga naik-turun: setelah listrik mati jam mundur, kadang teknisi menyetel jam manual sehingga sempat normal beberapa hari.
   - **Tidak ada penyesuaian MSS/MTU pada jalur terowongan LTE.** Lalu lintas menuju HQ melewati WireGuard di atas LTE; MTU jalur efektif lebih kecil dari 1500 karena tambahan header terowongan, dan pada jalur seluler pesan ICMP "fragmentation needed" sering diblokir sehingga **Path MTU Discovery gagal (black hole)**. Akibatnya: pertukaran paket kecil sukses (login berhasil, ping mulus), tetapi begitu ada paket besar — unggahan batch data suhu/timbangan, handshake TLS dengan sertifikat panjang — koneksi menggantung sampai *timeout*, lalu dicoba lagi, sehingga "gagal kirim 2 jam". Perbaikan: `/ip firewall mangle` aturan `action=change-mss` `new-mss=clamp-to-pmtu` pada paket SYN di antarmuka terowongan (atau setel MTU/MSS terowongan secara eksplisit), plus izinkan ICMP tipe 3 kode 4.
   - Catatan: "sinyal LTE lemah" pada penutupan tiket adalah contoh klasik menutup tiket dengan sebab yang paling mudah dipercaya. Kedua cacat di atas menghasilkan gejala yang **tidak bergantung kekuatan sinyal**, dan itulah petunjuk bahwa tafsir lama salah.

4. Karena ketiga bukti itu bersama-sama berarti: cadangan berada di **mesin yang sama dengan data aslinya** (`/srv/erp-db` → `/srv/backup/erp-db` di host yang sama, `/dev/md0`), dicapai lewat `rsync -a` yang **menyalin keadaan terkini** sehingga file yang terenkripsi ransomware akan menimpa salinan yang masih baik pada siklus berikutnya, tidak ada versi/riwayat, mesinnya punya SSH root+password terbuka ke internet lewat *port forward* (jadi justru sasaran pertama), ruang tinggal 2% sehingga pekerjaan cadangan kemungkinan sudah gagal diam-diam, dan **pemulihannya belum pernah diuji sekali pun**. Ransomware yang mendapat root di host ini mengenkripsi data dan cadangan dalam satu langkah. Tiga sifat wajib cadangan: **(a) terpisah** — media/host/kredensial berbeda, minimal satu salinan di luar lokasi dan satu salinan yang tidak bisa ditimpa (*immutable*/WORM atau media lepas); **(b) berversi & teruji** — beberapa titik waktu, dan **uji pemulihan terjadwal** yang membuktikan datanya bisa hidup kembali, bukan hanya berkasnya ada; **(c) terpantau** — kegagalan pekerjaan cadangan memicu alarm, dan kapasitas diawasi. Aturan praktis 3-2-1-1-0: 3 salinan, 2 media, 1 di luar lokasi, 1 tidak bisa diubah, 0 kesalahan pada uji pemulihan terakhir.

5. Karena TPI terhubung lewat LTE yang hampir selalu berada di belakang **CGNAT**: alamat yang didapat antarmuka `lte1` bukan alamat publik yang bisa dituju, dan operator tidak meneruskan port masuk. Konfigurasi dengan `listen-port` tanpa `endpoint` berarti TPI **menunggu dipanggil** — model ini menuntut TPI punya alamat publik tetap yang bisa dihubungi, yang tidak dimiliki. Ditambah lagi `/ip cloud ddns-enabled=yes` memberi ilusi "ada nama yang bisa dituju", padahal nama DDNS yang menunjuk alamat CGNAT tetap tidak bisa dihubungi dari luar — sekaligus membocorkan keberadaan perangkat. Rancangan yang benar: **TPI selalu yang menginisiasi** (*dial-out*) ke satu titik pusat yang punya alamat publik tetap — di sisi TPI setel `endpoint-address` dan `endpoint-port` ke hub, `persistent-keepalive` 20-25 detik supaya pemetaan NAT operator tetap hidup, dan `allowed-address` hanya prefix yang memang perlu dijangkau (bukan `10.0.0.0/8` seluruhnya, yang membuat perutean sembarang dan menghapus batas keamanan). Di sisi hub: satu antarmuka WireGuard dengan 20 peer berbeda kunci, satu prefix unik per TPI supaya perutean dan pencatatan jelas, dan hub sebaiknya redundan (dua hub di lokasi berbeda) karena kalau hub tunggal mati, seluruh 20 TPI kehilangan jalur pelaporan suhu sekaligus. Kunci konseptualnya: **pada jaringan yang ber-NAT, arah pembentukan sesi adalah keputusan desain, bukan detail teknis.**

</details>

---

## 11. Rubrik Babak 1 (120 poin)

| Aspek | Poin | Kriteria |
|---|---|---|
| Kelengkapan temuan | 60 | 1,5 poin per temuan sah (maks 40 temuan). Temuan ganda dihitung sekali. |
| Kategori & tingkat risiko tepat | 25 | Tingkat 1 dipakai hemat dan pada yang benar-benar merusak bisnis |
| Peta ke tiket helpdesk | 20 | 4 poin per tiket yang penyebabnya ditunjuk dengan benar |
| Perbaikan yang aman untuk produksi | 15 | Memisahkan yang bisa dikerjakan siang hari dari yang wajib jendela malam, dengan alasan |

Nilai < 60 berarti kembali ke `03`, `09`, `12`, `13`, dan `19` sebelum lanjut — bukan gagal, hanya belum siap.

---

## 12. Sumber

- `03-data-link/04-stp.md`, `03-data-link/03-vlan.md` — STP, DTP, native VLAN
- `12-keamanan/02-serangan-l2.md` — MAC flooding, ARP spoofing, VLAN hopping
- `13-linux-networking` — nftables, sshd, resolusi nama
- `19-mikrotik/03-firewall-nat.md`, `19-mikrotik/06-vpn-tunnel.md` — pengamanan RouterOS & terowongan
- `referensi/cheatsheet-cisco-ios.md`, `referensi/cheatsheet-mikrotik.md`
- CIS Benchmark untuk Cisco IOS dan Linux — daftar periksa hardening yang dipakai auditor

---

**Berikutnya:** `20-proyek-akhir/03-babak-2-sidang-arsitektur.md`. Tiga vendor mengajukan proposal, Anda jadi jurinya.

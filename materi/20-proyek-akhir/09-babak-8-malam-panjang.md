# 20.9 Babak 8: Malam Panjang

> **Prasyarat:** `20.8`, ditambah `14` (metodologi troubleshooting) dan seluruh kurikulum
> **Tujuan:** Mendiagnosis lima gangguan nyata di bawah tekanan waktu, memilih pemeriksaan yang tepat alih-alih memeriksa segalanya, mengambil keputusan bisnis saat data kepatuhan hilang, lalu menulis postmortem yang tidak menyalahkan orang.

---

## 1. Bentuk Kerja Babak Ini

Babak ini **bercabang dan berbiaya waktu.** Anda tidak diberi semua bukti sekaligus. Anda diberi gejala, lalu Anda memilih pemeriksaan mana yang dilakukan — dan setiap pemeriksaan **memakan waktu simulasi**.

Aturan main:

1. Tiap tiket punya **anggaran waktu**. Setiap pemeriksaan punya biaya menit yang tertulis di judulnya.
2. **Tulis hipotesis Anda sebelum membuka pemeriksaan pertama.** Satu baris: "Saya menduga penyebabnya X karena Y."
3. Buka pemeriksaan satu per satu, catat urutannya dan total menitnya. Setelah setiap pemeriksaan, perbarui hipotesis Anda.
4. Ketika yakin, tulis akar masalah dan tindakan Anda, **baru** buka kotak *Akar Masalah*.
5. Beberapa pemeriksaan adalah **pengalih perhatian** yang menghabiskan waktu tanpa memberi informasi. Itu bagian dari ujian: memilih pemeriksaan yang membelah ruang kemungkinan paling banyak.

Yang dinilai bukan kecepatan mentah, tetapi: akar masalah benar · jumlah menit terpakai · apakah Anda memakai metode (atas-bawah, bawah-atas, atau belah-dua) atau menembak acak · dan kualitas keputusan saat tidak ada jawaban teknis yang bersih.

Catat semuanya di `13-postmortem.md` sambil berjalan. Menulis setelah semuanya selesai akan kehilangan detail yang justru paling berharga.

> [!NOTE]
> Mode Ujian: jalankan lima tiket berurutan tanpa istirahat, dan patuhi anggaran waktu. Mode Kilat: tiket 1, 4, dan 5 saja.

> [!TIP]
> Latar: ini malam Jumat ke Sabtu. Anda sendirian. Bu Ratna sedang tidak bisa dihubungi sampai pukul 06:00. Ada tiga kontainer dijadwalkan berangkat pukul 07:00.

<figure class="fig-img"><a href="/img/capstone-garis-waktu.png" target="_blank" rel="noreferrer"><img src="/img/capstone-garis-waktu.png" alt="Garis waktu lima tiket pada malam panjang beserta akar masalahnya" loading="lazy"></a><figcaption>Peta jawaban malam ini — buka hanya setelah kelima tiket selesai Anda kerjakan.</figcaption></figure>

---

## 2. Tiket 1: 22:14 · Data suhu TPI-07 berhenti masuk

> **Alarm:** `SensorSuhuDiam` · lokasi TPI-07 · data terakhir 21:50 · sudah 24 menit
> **Dampak:** celah rekaman suhu melewati batas auditor 15 menit
> **Anggaran waktu: 20 menit**

Tulis hipotesis Anda sekarang.

<details>
<summary>Pemeriksaan A (3 menit) — Ping alamat terowongan TPI-07 dari hub</summary>

```bash
root@hub-wg:~# ping -c 4 10.72.4.1
PING 10.72.4.1 (10.72.4.1) 56(84) bytes of data.
--- 10.72.4.1 ping statistics ---
4 packets transmitted, 0 received, 100% packet loss
```

</details>

<details>
<summary>Pemeriksaan B (2 menit) — Status peer WireGuard di hub</summary>

```text
peer: TPI-03   latest handshake: 47 seconds ago    transfer: 19.2 MiB / 8.1 MiB
peer: TPI-04   latest handshake: 1 minute ago      transfer: 22.8 MiB / 9.4 MiB
peer: TPI-07   latest handshake: 26 minutes ago    transfer: 14.1 MiB / 6.2 MiB
peer: TPI-11   latest handshake: 52 seconds ago    transfer: 20.5 MiB / 8.8 MiB
```

</details>

<details>
<summary>Pemeriksaan C (5 menit) — Hubungi petugas TPI-07 lewat WhatsApp</summary>

```text
22:22  Anda     : Pak, tabletnya masih bisa buka WhatsApp?
22:23  Petugas  : Bisa Pak, ini saya balas dari tablet kantor TPI.
22:23  Petugas  : Tapi aplikasi setor data ikan tidak bisa kirim dari tadi.
22:24  Anda     : Sinyal LTE berapa bar?
22:24  Petugas  : Penuh Pak, 4 bar.
```

</details>

<details>
<summary>Pemeriksaan D (6 menit) — Periksa log syslog terpusat untuk TPI-07</summary>

```text
21:47:02  TPI07-RTR01  dhcp,info  sensor-03 assigned 10.72.4.68
21:48:55  TPI07-RTR01  system,info ntp change time synchronized
21:49:31  TPI07-RTR01  dhcp,info  lease expired 10.72.4.70
(tidak ada entri setelah 21:49:31)
```

</details>

<details>
<summary>Pemeriksaan E (8 menit) — Bandingkan konfigurasi TPI-07 dengan standar</summary>

```diff
# hasil diff terhadap konfigurasi hasil templat (Babak 7)
  /interface wireguard peers add interface=wg-hq public-key="..." \
      endpoint-address=203.0.113.20 endpoint-port=51820 \
-     allowed-address=10.64.0.0/15,10.70.0.0/16 persistent-keepalive=25s
+     allowed-address=10.64.0.0/15,10.70.0.0/16
```

Catatan riwayat: TPI-07 adalah satu-satunya lokasi yang dikonfigurasi ulang dengan tangan bulan lalu, setelah perangkatnya diganti karena tersambar listrik.

</details>

<details>
<summary>Pemeriksaan F (4 menit) — Cek dasbor status jaringan operator LTE wilayah itu</summary>

```text
Tidak ada gangguan dilaporkan untuk wilayah tersebut.
Catatan teknis operator: pemeliharaan rutin pada gerbang NAT pukul 21:40–21:55.
```

</details>

<details>
<summary>Akar Masalah — Tiket 1</summary>

**Akar masalah:** TPI-07 berada di belakang CGNAT. Terowongan WireGuard hanya hidup selama **pemetaan NAT di sisi operator** masih ada. Konfigurasi TPI-07 kehilangan `persistent-keepalive` (satu-satunya lokasi yang dikonfigurasi dengan tangan setelah penggantian perangkat), sehingga ketika operator melakukan pemeliharaan gerbang NAT pukul 21:40-21:55, pemetaan lama hilang dan **tidak ada apa pun dari sisi TPI yang membangunnya kembali** — hub tidak bisa memulai karena TPI tidak punya alamat yang bisa dituju.

**Kenapa tablet tetap bisa WhatsApp:** lalu lintas itu keluar langsung ke internet, bukan melewati terowongan. Inilah yang membuat "sinyal penuh" menjadi pengalih perhatian paling meyakinkan — dan kenapa tiket T-902 dulu ditutup dengan sebab yang salah.

**Jalur pemeriksaan paling efisien:** B (2 menit) memberi paling banyak informasi sekaligus — ia menunjukkan hanya TPI-07 yang terpengaruh, jadi masalahnya bukan hub dan bukan jalur umum. Lalu E (8 menit) langsung menunjuk sebabnya. Total **10 menit**. Pemeriksaan A dan D hanya memastikan gejala yang sudah diketahui; F memberi konteks yang berguna tetapi tidak mengubah tindakan; C terasa produktif tetapi justru menanam hipotesis yang salah.

**Tindakan malam itu:** minta petugas menjalankan sesuatu yang menghasilkan lalu lintas keluar dari sisi TPI melalui terowongan (misalnya membuka aplikasi setor data, atau menyalakan ulang perangkat) sehingga pemetaan NAT terbentuk kembali; verifikasi handshake baru di hub; pastikan data tersangga terkirim dan periksa apakah ada celah.

**Tindakan permanen:** terapkan `persistent-keepalive` lewat playbook ke **semua** TPI (jangan perbaiki satu perangkat dengan tangan — itu yang menyebabkan masalah ini), tambahkan pemeriksaan "usia handshake terakhir per peer" sebagai metrik dengan alarm pada > 3 menit, dan jadikan penyimpangan konfigurasi sebagai temuan audit harian (Babak 7 Bagian D). Pelajaran struktural: **satu perangkat yang pernah disentuh tangan akan menjadi satu-satunya perangkat yang gagal.**

</details>

---

## 3. Tiket 2: 22:40 · Kantor pabrik lambat, HMI kadang tidak merespons

> **Laporan:** operator produksi menelepon — layar HMI "loading" berulang, dan komputer kantor pabrik lambat membuka berkas
> **Anggaran waktu: 25 menit**

<details>
<summary>Pemeriksaan A (4 menit) — Hitungan kesalahan antarmuka di switch akses pabrik</summary>

```cisco
SBY-ACC-01# show interfaces counters errors
Port        Align-Err   FCS-Err  Xmit-Err   Rcv-Err  UnderSize  OutDiscards
Gi1/0/9             0         0         0         0          0            0
Gi1/0/14            0         0         0         0          0            0
Po1                 0         0         0         0          0        84120
```

</details>

<details>
<summary>Pemeriksaan B (3 menit) — Spanning tree</summary>

```cisco
SBY-ACC-01# show spanning-tree vlan 10 | include Root|topology|Port
  Root ID    Priority    8202
             Address     fc:ec:da:11:98:20
             Cost        4    Port 25 (Port-channel1)
  Number of topology changes 1846 last change occurred 00:00:04 ago
```

</details>

<details>
<summary>Pemeriksaan C (2 menit) — Log switch</summary>

```text
22:31:18 %SW_MATM-4-MACFLAP_NOTIF: Host 9c:8e:99:41:0a:3b in vlan 10 is flapping between port Gi1/0/14 and port Po1
22:31:19 %SW_MATM-4-MACFLAP_NOTIF: Host 00:1a:2b:77:ee:01 in vlan 10 is flapping between port Gi1/0/14 and port Po1
22:31:22 %SW_MATM-4-MACFLAP_NOTIF: Host 9c:8e:99:41:0a:3b in vlan 10 is flapping between port Gi1/0/14 and port Po1
(berulang ratusan kali)
```

</details>

<details>
<summary>Pemeriksaan D (5 menit) — Lalu lintas broadcast pada uplink</summary>

```cisco
SBY-ACC-01# show interfaces Po1 | include broadcast|rate
  5 minute input rate 412,338,000 bits/sec, 61,204 packets/sec
     Received 48,221,904 broadcasts (47,990,118 multicasts)
```

</details>

<details>
<summary>Pemeriksaan E (6 menit) — Apa yang terpasang di Gi1/0/14?</summary>

```cisco
SBY-ACC-01# show interfaces Gi1/0/14 status
Port      Name               Status       Vlan   Duplex  Speed Type
Gi1/0/14  ruang ganti        connected    10     a-full  a-100 10/100/1000BaseTX

SBY-ACC-01# show spanning-tree interface Gi1/0/14 detail | include BPDU|guard
   BPDU: sent 42, received 9814
   (bpdu guard tidak dikonfigurasi pada antarmuka ini)
```

</details>

<details>
<summary>Pemeriksaan F (7 menit) — Tanya petugas keamanan pabrik yang sedang berjaga</summary>

```text
22:52  Satpam: "Sore tadi ada kontraktor CCTV, Pak. Pasang kamera baru di ruang ganti
        dan ruang timbang. Katanya sudah izin bagian umum. Dia bawa switch kecil hitam,
        dipasang di ruang ganti, katanya biar kabelnya cukup."
```

</details>

<details>
<summary>Akar Masalah — Tiket 2</summary>

**Akar masalah:** Kontraktor CCTV memasang switch tak terkelola di ruang ganti dan menyambungkannya ke jaringan dengan **dua kabel** (kemungkinan tidak sengaja — satu kabel sudah ada, satu ditambahkan agar "kabelnya cukup"). Itu menciptakan **loop lapisan 2**. Karena Gi1/0/14 tidak memiliki BPDU guard (port ini bagian pabrik yang belum dimigrasi — "sudah dari dulu", tepat seperti temuan Babak 1), loop tidak dipadamkan: BPDU terus diterima, topologi berubah 1.846 kali, tabel MAC dibersihkan berulang sehingga terjadi *flooding*, dan broadcast berputar sampai 412 Mbps pada uplink.

**Kenapa HMI yang paling menderita:** protokol industri berkomunikasi dengan permintaan-jawaban bertenggat pendek. Jaringan yang penuh *flooding* menyebabkan waktu jawab melampaui tenggat, sehingga HMI menampilkan "loading" — walau tidak ada satu pun perangkat OT yang rusak.

**Jalur paling efisien:** C (2 menit) hampir langsung menyelesaikan diagnosis — pesan MAC berpindah antara satu port akses dan uplink adalah tanda khas jalur ganda di lapisan 2. Lanjut E (6 menit) untuk memastikan port mana dan mengapa tidak terlindungi. Total **8 menit**. A adalah pengalih perhatian yang wajar (kesalahan fisik) tetapi bersih; D hanya mengukur besarnya akibat; F sangat berguna untuk cerita dan pencegahan, tetapi bukan untuk memadamkan.

**Tindakan malam itu:** matikan Gi1/0/14 (bukan mencabut kabel — matikan portnya supaya tercatat), verifikasi perubahan topologi berhenti dan broadcast normal, konfirmasi HMI pulih, lalu beri tahu kontraktor bahwa perangkatnya terputus.

**Tindakan permanen:** aktifkan `portfast` + `bpduguard` pada seluruh port akses pabrik (lewat playbook, global default), sediakan **proses perubahan untuk pekerjaan pihak ketiga** — tidak ada kabel masuk jaringan tanpa tiket dan tanpa port yang disiapkan — dan percepat penggantian switch tak terkelola di pabrik. Catat juga bahwa kontraktor "sudah izin bagian umum": izin fisik tanpa izin jaringan adalah celah proses, bukan celah teknis.

</details>

---

## 4. Tiket 3: 23:05 · VoIP antar-lokasi patah-patah, ERP normal

> **Laporan:** panggilan HQ-pabrik terdengar terpotong dan bergema. Pengguna ERP tidak mengeluh. Dasbor menunjukkan semua tautan **up**.
> **Anggaran waktu: 25 menit**

<details>
<summary>Pemeriksaan A (3 menit) — Ping berkelanjutan ke gateway ISP-A dari tepi HQ</summary>

```bash
root@fw-hq:~# ping -i 0.2 -c 300 203.0.113.1 | tail -3
--- 203.0.113.1 ping statistics ---
300 packets transmitted, 276 received, 8% packet loss, time 60s
rtt min/avg/max/mdev = 11.204/48.771/412.339/89.114 ms
```

</details>

<details>
<summary>Pemeriksaan B (2 menit) — Status tautan dan rute</summary>

```bash
root@fw-hq:~# ip -brief link show | grep -E 'wan'
wan-a  UP    aa:bb:cc:00:11:01 <BROADCAST,MULTICAST,UP,LOWER_UP>
wan-b  UP    aa:bb:cc:00:11:02 <BROADCAST,MULTICAST,UP,LOWER_UP>
root@fw-hq:~# ip route | head -2
default via 203.0.113.1 dev wan-a metric 100
default via 198.51.100.1 dev wan-b metric 200
```

</details>

<details>
<summary>Pemeriksaan C (5 menit) — Statistik panggilan dari server telepon</summary>

```text
Panggilan aktif: 6
MOS rata-rata 15 menit terakhir : 2,4  (normal: 4,2)
Jitter rata-rata                : 84 ms  (ambang: 30 ms)
Paket hilang                    : 7,9%   (ambang: 1%)
Semua panggilan bermasalah melewati: wan-a
```

</details>

<details>
<summary>Pemeriksaan D (6 menit) — Penandaan QoS di kedua jalur WAN</summary>

```bash
root@fw-hq:~# tc -s qdisc show dev wan-a | head -6
qdisc htb 1: root refcnt 2 r2q 10 default 0x30
 Sent 8812390421 bytes 7120394 pkt (dropped 0, overlimits 2214 requeues 0)
root@fw-hq:~# tc -s qdisc show dev wan-b | head -3
qdisc noqueue 0: root refcnt 2
```

Jalur cadangan `wan-b` tidak memiliki kebijakan antrean apa pun.

</details>

<details>
<summary>Pemeriksaan E (4 menit) — Riwayat kualitas jalur dari pemantauan</summary>

```text
22:10  wan-a  loss 0,0%  jitter 4 ms
22:40  wan-a  loss 0,1%  jitter 6 ms
22:55  wan-a  loss 3,2%  jitter 41 ms
23:00  wan-a  loss 8,1%  jitter 88 ms
23:05  wan-a  loss 8,0%  jitter 84 ms      <-- tidak ada peristiwa "tautan turun"
```

</details>

<details>
<summary>Pemeriksaan F (8 menit) — Buka tiket ke ISP-A dan tunggu jawaban</summary>

```text
23:19  ISP-A: "Terdeteksi gangguan pada salah satu segmen backbone kami.
        Perbaikan sedang berjalan, estimasi 4-6 jam. Lalu lintas Anda masih
        dilewatkan melalui jalur cadangan kami yang saat ini padat."
```

</details>

<details>
<summary>Akar Masalah — Tiket 3</summary>

**Akar masalah:** ISP-A mengalami **degradasi, bukan kegagalan**. Tautan fisik tetap `UP`, sehingga mekanisme peralihan yang hanya melihat status tautan (dan metrik rute statis) **tidak pernah terpicu**. Lalu lintas tetap dipaksa melewati jalur dengan kehilangan paket 8% dan jitter 84 ms.

**Kenapa hanya VoIP yang mengeluh:** ini inti pelajarannya. VoIP memakai UDP tanpa pengiriman ulang, dan mutu suara langsung mencerminkan kehilangan paket serta jitter — 8% hilang sudah terdengar sebagai suara terpotong. ERP memakai TCP, yang **menyembunyikan** kehilangan paket dengan mengirim ulang; pengguna hanya merasa "agak lambat" dan tidak membuat tiket. Jadi **tidak adanya keluhan bukan bukti jaringan sehat** — keluhan hanya muncul dari aplikasi yang paling tidak toleran.

**Jalur paling efisien:** A (3 menit) segera membuktikan jalur buruk walau tautan up; E (4 menit) memberi garis waktu dan menegaskan tidak ada peristiwa turun — sehingga menjelaskan mengapa peralihan tidak terjadi. Total **7 menit**. C berguna untuk mengukur dampak bisnis; D menemukan cacat nyata (jalur cadangan tanpa QoS) tetapi **itu bukan penyebab** — ia akan menjadi masalah berikutnya begitu Anda berpindah, jadi harus dicatat, bukan diabaikan; F memakan waktu paling banyak dan datang terlambat, walau wajib dilakukan untuk pertanggungjawaban.

**Tindakan malam itu:** pindahkan lalu lintas ke `wan-b` (turunkan metrik atau paksa rute untuk lalu lintas suara terlebih dahulu). **Tapi perhatikan temuan D**: jalur cadangan belum punya QoS, jadi bila seluruh lalu lintas dipindahkan, VoIP bisa kembali buruk karena kejenuhan. Urutan yang benar: pasang kebijakan antrean minimum di `wan-b` (atau setidaknya batasi lalu lintas besar seperti pencadangan dan sinkronisasi cloud), baru pindahkan; verifikasi MOS naik; lapor ke ISP-A.

**Tindakan permanen:** ganti pemicu peralihan dari "status tautan" menjadi **kualitas jalur** — probe berkala (loss/latensi/jitter) atau BFD, dengan ambang dan waktu tahan yang ditetapkan supaya tidak berpindah-pindah; **QoS harus ada di kedua jalur secara identik** (jalur cadangan bukan jalur kelas dua); pantau MOS/jitter sebagai SLI, bukan hanya status naik-turun tautan; dan tambahkan ke runbook: "up bukan berarti layak pakai".

</details>

---

## 5. Tiket 4: 01:20 · Delapan belas sensor cold storage 1 & 2 berhenti mengirim

> **Alarm:** tidak ada. Anda menemukannya sendiri saat memeriksa dasbor setelah Tiket 3.
> **Data terakhir:** 00:07. Sekarang 01:20. **Celah 73 menit.**
> **Dampak:** dua ruang beku tanpa bukti suhu. Tiga kontainer berangkat pukul 07:00.
> **Anggaran waktu: 30 menit — dan keputusan bisnis harus diambil sebelum 02:00**

<details>
<summary>Pemeriksaan A (3 menit) — Ping beberapa sensor</summary>

```bash
root@sby-collector:~# for i in 12 13 14 15; do ping -c1 -W1 10.65.70.$i >/dev/null \
  && echo "10.65.70.$i HIDUP" || echo "10.65.70.$i TIDAK MENJAWAB"; done
10.65.70.12 TIDAK MENJAWAB
10.65.70.13 TIDAK MENJAWAB
10.65.70.14 HIDUP
10.65.70.15 TIDAK MENJAWAB
```

</details>

<details>
<summary>Pemeriksaan B (4 menit) — Sewa DHCP pada VLAN sensor</summary>

```text
SBY-CORE# show ip dhcp pool sensor-vlan70
 Pool sensor-vlan70 :
  Utilization mark (high/low)    : 100 / 0
  Subnet size (first/next)       : 0 / 0
  Total addresses                : 30
  Leased addresses               : 30
  Excluded addresses             : 1
  Pending event                  : none

SBY-CORE# show ip dhcp binding | count
Number of lines which match regexp = 30
```

</details>

<details>
<summary>Pemeriksaan C (5 menit) — Siapa saja yang memegang sewa itu?</summary>

```text
IP address       Client-ID/Hardware address   Lease expiration        Type
10.65.70.11      00:1b:c5:04:aa:11            Sep 15 2026 03:12 AM    Automatic
10.65.70.12      00:1b:c5:04:aa:12            Sep 15 2026 03:14 AM    Automatic
...
10.65.70.31      3c:ef:8c:22:10:04            Sep 17 2026 11:40 PM    Automatic
10.65.70.32      3c:ef:8c:22:10:05            Sep 17 2026 11:41 PM    Automatic
10.65.70.33      3c:ef:8c:22:10:06            Sep 17 2026 11:43 PM    Automatic
(12 entri dengan prefiks MAC 3c:ef:8c — terdaftar sebagai produsen kamera IP)
```

</details>

<details>
<summary>Pemeriksaan D (3 menit) — Sinkronisasi waktu pengumpul dan sensor</summary>

```bash
root@sby-collector:~# chronyc tracking | head -3
Reference ID    : 0A464002 (10.70.64.2)
Stratum         : 3
System time     : 0.000041 seconds fast of NTP time
```

</details>

<details>
<summary>Pemeriksaan E (4 menit) — Kenapa alarm tidak berbunyi?</summary>

```yaml
# aturan yang sedang berjalan
- alert: SuhuMelewatiBatas
  expr: suhu_celsius > -18
  for: 10m
# ... dan itu satu-satunya aturan untuk rantai dingin.
```

Tidak ada aturan untuk **ketiadaan data**. Sensor yang diam tidak menghasilkan nilai, dan nilai yang tidak ada tidak pernah lebih besar dari −18.

</details>

<details>
<summary>Pemeriksaan F (6 menit) — Periksa antrean data lokal pengumpul</summary>

```bash
root@sby-collector:~# ls /var/spool/coldchain/ | wc -l
0
root@sby-collector:~# journalctl -u coldchain-collector --since 00:00 | tail -2
00:07:14 coldchain-collector: menerima 40 sampel (ruang 1,2,3)
01:19:52 coldchain-collector: menerima 22 sampel (ruang 3)
```

Pengumpul sehat. Ia hanya tidak menerima apa pun dari 18 sensor karena sensor-sensornya tidak punya alamat IP.

</details>

<details>
<summary>Akar Masalah — Tiket 4</summary>

**Akar masalah:** Kolam DHCP untuk VLAN sensor (VLAN 70) berukuran `/27` — **30 alamat** — untuk 40 sensor yang direncanakan sekarang berjumlah 18 di dua ruang ditambah 22 di ruang ketiga. Kontraktor CCTV (yang sama dengan Tiket 2) menyambungkan **12 kamera baru ke VLAN sensor** karena "port yang kosong hanya di situ". Dua belas alamat itu diambil dengan **masa sewa 3 hari**, sehingga kolam habis. Ketika sensor di ruang 1 dan 2 memperbarui sewanya, tidak ada alamat tersisa — mereka kehilangan IP dan berhenti mengirim.

Ada **kegagalan kedua yang lebih serius**: alarm tidak berbunyi. Satu-satunya aturan memantau **nilai suhu melewati batas**, sementara masalahnya adalah **tidak ada nilai sama sekali**. Sensor yang diam tidak memicu apa pun. Celah 73 menit hanya ditemukan karena Anda kebetulan melihat dasbor.

Ini akibat langsung dari tiga hal yang sudah teridentifikasi di babak sebelumnya: ukuran kolam dan masa sewa yang tidak dihitung (Babak 3, jebakan ketiga), VLAN sensor yang seharusnya tidak berbagi apa pun dengan perangkat lain (Babak 3 aturan 5), dan alarm yang harus berbasis ketiadaan data (Babak 7 §7.2).

**Jalur paling efisien:** B (4 menit) menunjukkan kolam 100% terpakai; C (5 menit) mengungkap 12 penyewa asing. Total **9 menit** untuk sebab teknis. Kemudian E (4 menit) mengungkap kegagalan yang sebenarnya lebih penting untuk ditulis di postmortem. A, D, dan F berguna untuk menyingkirkan hipotesis lain (perangkat rusak, waktu salah, pengumpul mati) tetapi tidak menunjuk sebab.

**Tindakan teknis malam itu (urutan penting):** pindahkan 12 kamera keluar dari VLAN 70 — cara tercepat dan paling aman malam itu adalah **mematikan port kamera-kamera itu** (mereka baru dipasang, belum ada yang bergantung padanya) dan membersihkan sewanya; perpendek masa sewa VLAN sensor; **perbesar subnet sensor** sesuai rencana Babak 3 (`/24` untuk 240 alamat) — tetapi perubahan subnet di tengah malam berisiko, jadi malam ini cukup bebaskan alamat dan pastikan 18 sensor kembali; verifikasi data masuk lagi; lalu ukur celah sebenarnya dari basis data.

**Keputusan bisnis yang harus Anda ambil sebelum 02:00 — dan ini bagian yang dinilai paling berat:**

- **Bukti suhu untuk 73 menit itu tidak ada, dan tidak bisa dibuat ada.** Jangan pernah mengisi data yang hilang dengan nilai perkiraan. Itu memalsukan bukti, dan bila auditor menemukannya, akibatnya jauh lebih berat daripada celah data.
- **Segera buat bukti pengganti yang sah:** kirim petugas dengan termometer terkalibrasi ke ruang 1 dan 2, catat suhu manual dengan waktu, nama pencatat, dan tanda tangan; ulangi setiap 15 menit sampai sistem kembali normal. Catatan manual adalah bukti yang diterima dalam praktik kepatuhan — asalkan jujur, terdokumentasi, dan disertai penjelasan kejadian.
- **Periksa data ruang ketiga** (yang masih mengirim) sebagai indikasi apakah sistem pendingin memang bekerja normal pada periode itu; ini bukan pengganti bukti, tetapi mendukung penjelasan.
- **Tentukan soal tiga kontainer pukul 07:00.** Ini bukan keputusan Anda sendiri. Yang harus Anda lakukan: bangunkan Bu Ratna atau siapa pun yang berwenang **sekarang**, jangan tunggu pukul 06:00 — sajikan fakta (celah 73 menit, suhu manual terukur X, produk dari ruang mana, berangkat ke mana, aturan pembeli), dan sajikan pilihan beserta risikonya: berangkat dengan lampiran penjelasan dan catatan manual · tunda pengiriman · atau ganti muatan dari ruang yang datanya utuh. **Tugas Anda adalah membuat keputusan itu bisa diambil dengan informasi lengkap — bukan mengambilnya diam-diam, dan bukan menyembunyikannya sampai pagi.**
- **Catat semuanya saat itu juga**, termasuk waktu Anda mengetahui, waktu Anda menghubungi siapa, dan apa yang diputuskan. Auditor akan menanyakan garis waktu, dan garis waktu yang ditulis belakangan selalu terlihat seperti dikarang.

**Tindakan permanen:** alarm ketiadaan data per sensor (dan alarm "jumlah sensor yang mengirim < jumlah yang terdaftar"), alarm pemakaian kolam DHCP > 80%, ukuran subnet dan masa sewa sesuai rencana, VLAN sensor tertutup bagi perangkat lain secara teknis (802.1X atau setidaknya port yang dipetakan tetap), proses perubahan untuk kontraktor, dan **uji alarm bulanan** dari Babak 7 §7.5 — yang bila sudah ada, akan menangkap kegagalan aturan alarm ini berbulan-bulan sebelum malam ini.

</details>

---

## 6. Tiket 5: 03:50 · Empat belas kamera mengirim koneksi keluar berulang

> **Alarm:** IDS — pola koneksi keluar berkala dari VLAN CCTV pabrik ke lima alamat di luar negeri
> **Anggaran waktu: 25 menit**

<details>
<summary>Pemeriksaan A (3 menit) — Ringkasan koneksi</summary>

```bash
root@sensor-ids:~# zeek-cut id.orig_h id.resp_h id.resp_p duration < conn.log \
  | grep '^10.65.60' | awk '{print $2":"$3}' | sort | uniq -c | sort -rn | head -5
   1184 45.xx.xx.19:8443
    902 185.xx.xx.77:8443
    611 91.xx.xx.203:8443
    388 45.xx.xx.19:443
    205 103.xx.xx.51:8443
```

Pola: setiap kamera menghubungi salah satu alamat itu **setiap 60 detik**, ukuran kecil dan tetap.

</details>

<details>
<summary>Pemeriksaan B (4 menit) — Identitas dan versi kamera</summary>

```text
14 kamera dengan prefiks MAC 3c:ef:8c
Firmware  : 2019-11 (tidak pernah diperbarui)
Kredensial: nama pengguna dan sandi bawaan pabrik masih aktif
Antarmuka web terbuka di port 80 tanpa HTTPS
```

Dua belas di antaranya adalah kamera yang dipasang kontraktor kemarin.

</details>

<details>
<summary>Pemeriksaan C (5 menit) — Apakah aturan keluar seharusnya memblokir ini?</summary>

```text
Zona CCTV pabrik belum dimigrasi ke rancangan baru.
Aturan yang berlaku: masquerade seluruh 192.168.1.0/24 ke internet, tanpa penyaringan keluar.
Aturan "kamera tidak boleh memulai sesi keluar" (uji T27 Babak 4) baru berlaku di HQ.
```

</details>

<details>
<summary>Pemeriksaan D (6 menit) — Apakah ada usaha bergerak ke dalam?</summary>

```bash
root@sensor-ids:~# zeek-cut id.orig_h id.resp_h id.resp_p < conn.log \
  | grep '^10.65.60' | grep -E '10\.65\.(50|70|99)\.' | awk '{print $3}' \
  | sort | uniq -c | sort -rn
    412 502
    118 22
     64 23
     41 80
```

Port 502 adalah Modbus. Tujuannya berada di rentang zona OT dan zona sensor.

</details>

<details>
<summary>Pemeriksaan E (4 menit) — Sejak kapan?</summary>

```text
Pola koneksi keluar pertama terlihat: 14 Sep 2026 17:22
(kira-kira dua jam setelah kontraktor selesai memasang kamera)
Dua kamera lama di ruang timbang: pola yang sama terlihat sejak Juni 2026.
```

</details>

<details>
<summary>Akar Masalah — Tiket 5</summary>

**Akar masalah:** Empat belas kamera IP dengan firmware 2019 dan kredensial bawaan telah dikuasai dari luar dan sedang **melapor ke pengendali** (pola ukuran kecil dan tetap setiap 60 detik adalah ciri khasnya). Dua kamera di ruang timbang sudah begitu **sejak Juni** — artinya ini bukan kejadian baru, hanya baru terlihat karena Anda kini punya pemantauan. Dua belas kamera baru memperluasnya, dan Pemeriksaan D menunjukkan hal yang paling berbahaya: **percobaan koneksi ke port 502 (Modbus) di zona OT dan ke zona sensor** — penyerang sedang meraba jaringan produksi, dan di jaringan pabrik yang masih datar, tidak ada yang menghalanginya.

**Jalur paling efisien:** A (3 menit) menetapkan pola, B (4 menit) menjelaskan mengapa mungkin, **D (6 menit) adalah pemeriksaan terpenting** karena ia mengubah kejadian ini dari "perangkat IoT terinfeksi" menjadi "ada yang mencoba masuk ke sistem kendali produksi" — dan itu mengubah tingkat kegentingan serta siapa yang harus dibangunkan. E (4 menit) memberi rentang waktu yang menentukan luas penyelidikan. Total **17 menit**, dan di sini jangan berhemat.

**Tindakan malam itu, dengan urutan yang benar:**

- **Kekang dulu jalur keluarnya, bukan kameranya:** blokir lalu lintas keluar dari segmen kamera di gerbang pabrik (dan blokir arah ke zona OT/sensor). Ini memutus kendali penyerang **tanpa** mematikan kamera — sehingga bukti visual tetap terekam, yang penting untuk kepatuhan.
- **Jangan matikan atau setel ulang kamera lebih dulu.** Menyetel ulang menghapus bukti dan tidak memperbaiki apa pun bila kredensial bawaan dipakai lagi. Awetkan dulu: catat alamat, MAC, versi firmware, dan salinan log jaringan.
- **Awetkan bukti**: simpan log koneksi (termasuk periode Juni ke belakang bila masih ada), tangkapan lalu lintas singkat, dan daftar perangkat. Buat catatan kronologis tindakan Anda.
- **Tentukan cakupan**: apakah ada perangkat lain dengan pola sama (NVR, printer label, timbangan, HMI)? Percobaan ke port 22/23 menunjukkan penyerang mencari perangkat lain.
- **Naikkan ke manajemen segera.** Percobaan menyentuh zona kendali produksi bukan urusan yang bisa ditunda sampai pagi, dan bila ada kemungkinan data pribadi tersentuh, kewajiban pelaporan UU PDP mulai berjalan dari saat Anda mengetahui.
- **Keputusan sulit yang tidak punya jawaban bersih:** bila satu-satunya cara mengekang adalah mematikan kamera di titik kritis rantai dingin, Anda menghadapi pilihan antara risiko keamanan dan hilangnya bukti kepatuhan. Sajikan pilihannya, rekomendasikan yang paling masuk akal (memblokir di gerbang lebih dulu, karena ia mengekang tanpa mengorbankan bukti), dan **minta keputusan itu dicatat oleh yang berwenang**.

**Tindakan permanen:** percepat migrasi pabrik — zona CCTV tanpa jalur keluar, sensor tersendiri, OT terkurung di balik conduit dengan bastion; ganti seluruh kredensial bawaan dan tetapkan pembaruan firmware sebagai proses (dari repositori internal, diuji dulu — lihat Babak 4 latihan 4); tidak ada perangkat pihak ketiga masuk tanpa pendaftaran dan pemeriksaan; dan pantau **koneksi keluar per zona** sebagai metrik tetap, karena perangkat yang tiba-tiba mencoba keluar adalah indikator dini yang paling murah.

</details>

---

## 7. Setelah Pagi: Postmortem

Tulis `13-postmortem.md`. Tanpa nama orang yang disalahkan — nama peran boleh.

**a. Garis waktu** — kolom: waktu · kejadian · siapa yang tahu · tindakan. Cakup dari 17:22 (pola kamera pertama terlihat) sampai penyelesaian, dan tandai **kapan Anda tahu** versus **kapan sebenarnya mulai**.

**b. Dampak** dalam bahasa bisnis: berapa lama bukti suhu hilang, berapa panggilan terganggu, berapa lama HMI tidak responsif, apa yang terjadi pada tiga kontainer, dan apa risiko yang masih berjalan.

**c. Lima kali "kenapa"** untuk Tiket 4, sampai Anda tiba pada sebab yang bersifat **sistem atau proses**, bukan orang. Petunjuk: bila jawaban terakhir Anda adalah "kontraktor salah menancapkan kabel", Anda belum sampai ke dasar.

**d. Satu akar bersama.** Tiket 2, 4, dan 5 punya satu benang merah yang sama. Temukan dan nyatakan dalam satu kalimat. Ini pertanyaan paling penting dalam babak ini.

**e. Apa yang berjalan baik.** Wajib ada minimal tiga. Postmortem yang hanya berisi kegagalan akan berhenti ditulis orang setelah dua kali.

**f. Tindakan perbaikan** — tabel: tindakan · pemilik (peran) · tenggat · bagaimana kita tahu ini selesai. Pisahkan **pencegahan** (agar tidak terjadi lagi) dari **deteksi** (agar kalau terjadi kita tahu dalam 5 menit, bukan 73 menit).

**g. Ukuran waktu Anda sendiri:** untuk tiap tiket, catat MTTD (dari mulai sampai Anda tahu) dan MTTR (dari tahu sampai pulih). Tiket 4 punya MTTD 73 menit — jelaskan bagaimana angka itu bisa menjadi 5 menit.

---

## 8. Ringkasan

- Pemeriksaan yang baik **membelah ruang kemungkinan**; pemeriksaan yang buruk hanya memastikan gejala yang sudah diketahui.
- "Sinyal penuh", "tautan up", dan "tidak ada keluhan" adalah tiga pengalih perhatian paling mahal dalam pekerjaan ini.
- Tidak ada keluhan bukan bukti sehat — TCP menyembunyikan kerusakan yang langsung terdengar di VoIP.
- Alarm yang memantau nilai tidak akan pernah menangkap ketiadaan nilai.
- Satu perangkat yang pernah dikonfigurasi dengan tangan akan menjadi satu-satunya yang gagal.
- Saat bukti kepatuhan hilang, tugas orang teknis adalah menyediakan bukti pengganti yang jujur dan memastikan keputusan bisnis diambil oleh yang berwenang — bukan menambal data.
- Insiden yang tampak terpisah sering punya satu akar proses. Menemukannya lebih berharga daripada memperbaiki lima gejala.

---

## 9. Latihan: Refleksi Malam Itu

1. Untuk Tiket 1, urutan pemeriksaan tercepat memakai 10 menit dari 20. Jelaskan prinsip pemilihan yang membuat pemeriksaan B lebih berharga daripada A, lalu rumuskan aturan umum untuk memilih pemeriksaan pertama pada gangguan apa pun.
2. Tiket 3 mengajarkan "up bukan berarti layak pakai". Sebutkan tiga contoh lain dalam kurikulum ini di mana indikator status hijau menyembunyikan kerusakan nyata, dan untuk masing-masing sebutkan metrik apa yang seharusnya dipantau.
3. Lakukan lima kali "kenapa" untuk Tiket 4 secara lengkap, dan tunjukkan pada langkah mana jawabannya berhenti menjadi masalah teknis dan mulai menjadi masalah organisasi.
4. Temukan akar bersama Tiket 2, 4, dan 5. Lalu jelaskan: kalau BNS hanya boleh menjalankan **satu** tindakan perbaikan dari seluruh malam ini, tindakan mana yang paling banyak mencegah, dan kenapa bukan tindakan teknis yang paling jelas.
5. Anda memutuskan membangunkan Bu Ratna pukul 01:40 untuk Tiket 4. Ia marah karena "itu urusan IT, kenapa saya dibangunkan". Susun jawaban Anda dalam empat kalimat, dan jelaskan prinsip yang menentukan kapan orang non-teknis **wajib** dibangunkan walau ia tidak bisa memperbaiki apa pun.

<details>
<summary>Jawaban</summary>

1. Pemeriksaan B (status semua peer di hub) lebih berharga karena ia **membandingkan yang bermasalah dengan yang sehat dalam satu tampilan**. Hasilnya langsung menyingkirkan seluruh kelas penyebab: bila hanya TPI-07 yang handshake-nya tua sementara 19 lainnya normal, maka hub sehat, kunci hub sehat, alamat publik hub sehat, aturan firewall hub sehat, dan jalur internet umum sehat — satu pemeriksaan 2 menit menghapus mungkin setengah dari daftar kemungkinan. Pemeriksaan A (ping ke TPI-07) hanya mengonfirmasi apa yang alarm sudah katakan: TPI-07 tidak terjangkau. Ia **tidak membelah** apa pun. Aturan umum untuk memilih pemeriksaan pertama: **cari pemeriksaan yang membagi ruang kemungkinan paling merata dan paling murah — biasanya pemeriksaan yang memberi Anda *pembanding*.** Turunan praktisnya: tanyakan "apa yang masih berjalan?" sebelum "apa yang rusak?"; periksa di tempat yang melihat banyak hal sekaligus (hub, inti, pengumpul, pemantauan) sebelum turun ke satu perangkat; dan jangan pernah memulai dengan pemeriksaan yang hasilnya sudah bisa Anda duga — apa pun hasilnya, ia tidak mengubah tindakan Anda, jadi ia tidak bernilai informasi.

2. Tiga contoh lain beserta metrik yang seharusnya dipantau:
   - **Pekerjaan pencadangan yang "sukses"** (Babak 1, Bukti D): status pekerjaan hijau padahal kapasitas tinggal 2%, salinan berada di host yang sama, dan pemulihan belum pernah diuji. Yang seharusnya dipantau: **hasil uji pemulihan terjadwal** (bukan status pekerjaan), usia salinan terakhir yang **terbukti bisa dipulihkan**, kapasitas tersisa dengan alarm pada 85%, dan ada-tidaknya salinan di luar lokasi yang tak bisa ditimpa.
   - **Antarmuka yang `connected` dengan negosiasi yang salah** (Babak 1, Fa0/5 setengah dupleks 10 Mb, dan uplink dengan FCS-Err puluhan ribu): lampu hijau, lalu lintas jalan, tetapi separuh bingkai rusak. Yang seharusnya dipantau: **laju kesalahan (FCS/CRC, align, late collision) per antarmuka**, ketidaksesuaian dupleks/kecepatan terhadap standar, dan buangan keluar (output discards) — bukan status naik-turun.
   - **Sensor yang terdaftar tetapi diam** (Tiket 4): dasbor menampilkan nilai terakhir yang pernah masuk, sehingga grafik tampak wajar. Yang seharusnya dipantau: **usia data terakhir per sensor** dan **jumlah sensor yang mengirim dibandingkan jumlah yang terdaftar**.
   - Contoh tambahan yang juga sah: **terowongan VPN yang "up"** sementara tidak ada lalu lintas yang benar-benar sampai (pantau usia handshake dan uji jangkauan ujung-ke-ujung); **AP yang aktif** dengan klien yang bertahan di laju terendah (pantau distribusi laju/waktu udara, bukan jumlah klien); dan **CPU/memori normal** pada perangkat yang tabel MAC atau tabel sesinya hampir penuh (pantau pemakaian tabel sebagai persentase kapasitas). Pola umumnya: **status adalah keadaan biner yang dilaporkan perangkat tentang dirinya; kesehatan adalah ukuran tentang apakah layanan benar-benar terjadi.** Pantau yang kedua.

3. Lima kali kenapa untuk Tiket 4:
   - *Kenapa 18 sensor berhenti mengirim?* Karena mereka kehilangan alamat IP saat memperbarui sewa DHCP.
   - *Kenapa mereka tidak mendapat alamat?* Karena kolam DHCP VLAN sensor (30 alamat) habis, terpakai 12 alamat oleh kamera yang bukan miliknya.
   - *Kenapa kamera bisa mengambil alamat di VLAN sensor?* Karena kontraktor menyambungkan kamera ke port yang tersedia, dan **secara teknis tidak ada yang mencegah perangkat asing masuk ke VLAN mana pun** — tidak ada 802.1X, tidak ada pemetaan port tetap, dan jaringan pabrik masih sebagian datar. Ditambah: kolam sensor diukur tanpa perhitungan pertumbuhan dan dengan masa sewa 3 hari.
   - *Kenapa tidak ada yang mencegah, dan kenapa ukuran kolam tidak dihitung?* Karena **tidak ada proses perubahan yang mengikat pekerjaan pihak ketiga** (izin fisik dari bagian umum dianggap cukup) dan karena rencana pengalamatan lama dibuat tanpa perhitungan kapasitas per VLAN — keduanya adalah keadaan yang diwarisi dan sudah tercatat sebagai temuan audit, tetapi belum diperbaiki.
   - *Kenapa temuan yang sudah diketahui belum diperbaiki, dan kenapa celahnya baru diketahui setelah 73 menit?* Karena **perbaikan bersaing dengan pekerjaan lain tanpa pemilik dan tenggat**, dan karena **pemantauan rantai dingin dibangun untuk memantau nilai, bukan untuk memantau ketiadaan nilai** — tidak ada seorang pun yang pernah menguji apakah alarm benar-benar berbunyi.
   - Jawabannya berhenti menjadi masalah teknis pada **langkah keempat**: dari titik itu ke bawah, semuanya tentang proses, kepemilikan, prioritas, dan kebiasaan verifikasi — bukan tentang DHCP, VLAN, atau alarm. Inilah gunanya lima kali kenapa: ia memaksa Anda melewati batas nyaman "ini masalah konfigurasi" menuju "ini masalah cara kami bekerja".

4. **Akar bersama Tiket 2, 4, dan 5:** *pekerjaan pihak ketiga menyentuh jaringan produksi tanpa proses perubahan, di jaringan yang secara teknis tidak bisa menolaknya.* Kontraktor CCTV yang sama menyebabkan loop lapisan 2 (Tiket 2), menghabiskan kolam alamat sensor (Tiket 4), dan menambahkan 12 perangkat tak terkelola bercelah keamanan yang langsung dikuasai dari luar (Tiket 5) — dan pada ketiganya, jaringan tidak punya satu pun mekanisme yang menghentikannya. Bila hanya **satu** tindakan perbaikan yang boleh dijalankan, pilihannya adalah **menetapkan dan menegakkan proses perubahan untuk setiap pekerjaan yang menyentuh jaringan, termasuk pihak ketiga — dengan syarat teknis yang membuatnya bisa ditegakkan: port disiapkan lebih dulu, tidak ada port akses hidup tanpa tugas, dan perangkat baru harus didaftarkan sebelum tersambung.** Kenapa bukan tindakan teknis yang paling jelas (misalnya "aktifkan BPDU guard di semua port")? Karena BPDU guard hanya mencegah Tiket 2; memperbesar kolam DHCP hanya mencegah Tiket 4; memblokir keluar hanya mencegah Tiket 5. Satu kontrol teknis menutup satu jalan, sementara **kontrol proses menutup sumber yang menciptakan ketiga jalan itu** — dan ia juga mencegah kejadian keempat yang belum kita bayangkan. Catatan penting: ini bukan alasan untuk menunda perbaikan teknis; ketiganya tetap harus dikerjakan. Yang dinyatakan di sini adalah **urutan prioritas ketika sumber daya terbatas**, dan kemampuan melihatnya adalah perbedaan antara memperbaiki gejala dan memperbaiki sistem.

5. Empat kalimat yang bisa dipakai: *"Bu, dua ruang beku tidak punya rekaman suhu selama 73 menit tadi, dan saya tidak bisa membuat data itu ada — kalau saya buat, kita memalsukan bukti ekspor."* · *"Saya sudah kirim petugas mencatat suhu manual dan sistemnya sudah jalan lagi, tapi celah itu tetap akan terlihat oleh auditor."* · *"Tiga kontainer berangkat jam 07:00, dan keputusan apakah tetap berangkat, ditunda, atau ganti muatan bukan keputusan yang boleh saya ambil sendiri — itu risiko bisnis, bukan risiko teknis."* · *"Saya membangunkan Ibu sekarang karena kalau saya menunggu jam enam, pilihan Ibu tinggal satu, dan yang satu itu yang paling mahal."* Prinsip yang menentukan: **orang non-teknis wajib dibangunkan ketika keputusan yang harus diambil bukan keputusan teknis, dan ketika menunda pemberitahuan akan mengurangi pilihan yang tersedia bagi mereka.** Kemampuan memperbaiki tidak relevan — kewenanganlah yang relevan. Uji cepatnya tiga pertanyaan: (a) Apakah ada keputusan yang harus diambil yang melampaui kewenangan saya (uang, kepatuhan, pelanggan, keselamatan, hukum)? (b) Apakah menunggu sampai pagi akan **menghapus** pilihan yang sekarang masih ada? (c) Apakah orang itu akan sangat keberatan jika baru diberi tahu setelah akibatnya terjadi? Bila salah satu jawabannya ya, bangunkan — dan terima kemarahannya, karena kemarahan karena dibangunkan selalu lebih murah daripada kemarahan karena disembunyikan. Satu hal lagi yang membedakan profesional: **jangan membangunkan orang tanpa membawa fakta, pilihan, dan rekomendasi.** Membangunkan dengan "ada masalah, bagaimana ini?" memang layak dimarahi.

</details>

---

## 10. Rubrik Babak 8 (140 poin)

| Aspek | Poin | Kriteria |
|---|---|---|
| Akar masalah lima tiket | 50 | 10 poin per tiket bila akar masalah benar (bukan gejala) |
| Efisiensi pemeriksaan | 25 | 5 poin per tiket bila total menit ≤ setengah anggaran dan urutannya beralasan |
| Hipotesis tertulis sebelum memeriksa | 10 | Ada untuk kelima tiket, dan diperbarui seiring bukti |
| Keputusan bisnis Tiket 4 | 20 | Tidak menambal data, bukti pengganti dibuat, yang berwenang dibangunkan, semuanya dicatat |
| Penanganan insiden Tiket 5 | 15 | Kekang sebelum bersihkan, bukti diawetkan, cakupan dicari, eskalasi tepat |
| Kualitas postmortem | 20 | Garis waktu, lima kenapa sampai tingkat proses, akar bersama ditemukan, tindakan punya pemilik |

---

## 11. Sumber

- `14-monitoring-troubleshooting/01-metodologi.md` — atas-bawah, bawah-atas, belah-dua
- `14-monitoring-troubleshooting/04-studi-kasus.md` — latihan pendahulu babak ini
- `21-ekosistem-profesi/03-rumpun-keamanan` (profil Incident Responder) dan NIST SP 800-61 — penanganan insiden
- Google SRE Book — bab *Postmortem Culture: Learning from Failure*
- `19-mikrotik/06-vpn-tunnel.md` — perilaku terowongan di belakang NAT

---

**Berikutnya:** `20-proyek-akhir/10-babak-9-ruang-rapat.md`. Anggaran Anda dipotong 35% dan Anda punya sepuluh menit di depan direksi.

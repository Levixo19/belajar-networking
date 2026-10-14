# 14.4 — Studi Kasus Troubleshooting Nyata

> **Prasyarat:** seluruh Tahap 14, dan konsep dari tahap-tahap sebelumnya
> **Tujuan:** Anda bisa menerapkan metodologi pada 15 skenario nyata — masing-masing menautkan gejala ke akar penyebab dengan penalaran lengkap.

> 📌 **Cara memakai modul ini:** baca gejalanya, **berhenti dan pikirkan diagnosis Anda sendiri**, baru buka penyelesaiannya. Ini melatih pola pikir, bukan hafalan.

---

## Kasus 1: "Internet Lambat" saat Ada yang Download

**Gejala:** Ping normal 20 ms saat idle, tetapi melonjak ke 1500 ms saat ada yang mengunduh file besar. Packet loss 0%. Speedtest menunjukkan kecepatan penuh.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: Bufferbloat.** Buffer besar di modem/router ISP terisi penuh saat unduhan berjalan, sehingga semua paket (termasuk ping) mengantre di belakangnya. 0% loss justru karena buffer besar — paket ditunda, bukan dibuang.

**Bukti:** latency melonjak **hanya saat ada beban**, dengan 0% loss. Speedtest hanya mengukur throughput, bukan latency di bawah beban.

**Solusi:** Pasang AQM (**fq_codel** atau **CAKE**) di router yang Anda kendalikan, dan **shape ke ~90-95% kapasitas link** sehingga antrean terbentuk di router Anda (yang punya AQM), bukan di modem ISP.
```bash
$ sudo tc qdisc replace dev eth0 root cake bandwidth 19Mbit
```
Di MikroTik: Queue dengan PCQ; di OpenWrt: paket SQM. Lihat `05-transport/04`.
</details>

---

## Kasus 2: Sebagian Situs Terbuka, Sebagian Menggantung

**Gejala:** Setelah memasang VPN, ping dan SSH bekerja, tetapi sebagian situs web menggantung dan `scp` file besar macet.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: MTU black hole.** Overhead tunnel VPN mengurangi MTU efektif. Paket kecil (ping, keystroke SSH) muat; paket besar (halaman web, transfer file) melebihi MTU dan dibuang, sementara ICMP "Fragmentation Needed" diblokir sehingga PMTUD gagal.

**Bukti:** koneksi terbentuk (paket kecil), transfer besar macet — pola klasik MTU.

**Verifikasi:**
```bash
$ ping -M do -s 1400 tujuan     # turunkan sampai berhasil → menemukan MTU
```

**Solusi:** set MTU interface tunnel + **MSS clamping** (paling andal):
```bash
$ sudo ip link set dev wg0 mtu 1420
# router: ip tcp adjust-mss 1360 (Cisco) / mangle change-mss (MikroTik)
```
Lihat `04-network-layer/04`, `11-wan-vpn/02`.
</details>

---

## Kasus 3: PC Dapat IP 169.254.x.x

**Gejala:** Satu PC tidak bisa mengakses apa pun. `ipconfig` menunjukkan alamat `169.254.88.12`.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: DHCP gagal.** Alamat APIPA (`169.254.x.x`) diberikan OS otomatis ketika tidak menerima jawaban DHCP.

**Periksa berurutan:**
1. Kabel tersambung, lampu link nyala? (L1)
2. Port switch di VLAN yang benar? (`show interfaces switchport`)
3. Server DHCP hidup dan pool belum habis? (`show ip dhcp pool`)
4. DHCP relay (`ip helper-address`) dikonfigurasi jika server di subnet lain?
5. DHCP snooping memblokir port?
6. **PortFast aktif?** — tanpa PortFast, port butuh ~30 detik STP sebelum forwarding, dan DHCP timeout lebih dulu → APIPA.

**Solusi:** bergantung temuan. Kalau intermiten setelah PC boot, curigai **PortFast** terlebih dahulu:
```
SW1(config-if)# spanning-tree portfast
```
Lihat `06-aplikasi/02`, `03-data-link/04`.
</details>

---

## Kasus 4: Ping ke IP Berhasil, ke Nama Gagal

**Gejala:** `ping 8.8.8.8` berhasil, `ping google.com` gagal. Pengguna berkata "internet mati".

<details>
<summary>Diagnosis</summary>

**Akar penyebab: DNS.** Konektivitas L1-L3 ke internet baik (ping IP berhasil); hanya resolusi nama yang gagal. **"It's always DNS."**

**Periksa:**
```bash
$ cat /etc/resolv.conf          # server DNS yang dikonfigurasi
$ dig @1.1.1.1 google.com       # uji dengan resolver lain
$ resolvectl status
```
- Kalau `dig @1.1.1.1` berhasil tetapi server default gagal → server DNS default bermasalah/tidak terjangkau.
- Kalau semua gagal → firewall memblokir port 53, atau masalah yang lebih dalam.

**Solusi:** perbaiki/ganti server DNS, periksa firewall UDP/TCP 53, periksa apakah resolver internal (mis. AD) mati. Lihat `06-aplikasi/01`.
</details>

---

## Kasus 5: Duplex Mismatch

**Gejala:** Link antara switch dan server "up" dan berfungsi, tetapi transfer file sangat lambat (10 Mbps di link gigabit). `show interfaces` menunjukkan banyak error.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: Duplex mismatch.** Satu sisi full duplex, sisi lain half duplex — biasanya karena satu sisi auto-negotiation dan sisi lain hard-coded.

**Bukti dari counter:**
- Sisi **full duplex**: banyak **CRC/FCS errors**, **runts**.
- Sisi **half duplex**: banyak **collisions**, terutama **late collisions**.

⚠️ **Late collision adalah tanda paling khas** duplex mismatch (atau kabel terlalu panjang).

**Solusi:** set **kedua sisi** ke auto-negotiation, atau hard-code **identik** di kedua sisi. Untuk gigabit, auto wajib.
```
SW1(config-if)# speed auto
SW1(config-if)# duplex auto
```
Lihat `03-data-link/01`, `02-layer-fisik/04`.
</details>

---

## Kasus 6: Broadcast Storm / Loop Layer 2

**Gejala:** Seluruh jaringan tiba-tiba sangat lambat atau mati total. CPU switch 100%. Lampu semua port berkedip serempak sangat cepat. Akses SSH ke switch tidak responsif.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: Loop layer 2.** Tanpa TTL di Ethernet, frame broadcast berputar dan berlipat ganda eksponensial. Sering karena kabel yang salah dipasang (dua jack dihubungkan, mini-switch dicolok ke dua port).

**Bukti:** log `MACFLAP_NOTIF`, CPU 100%, semua lampu berkedip serempak, jaringan lumpuh.

**Tindakan (urutan penting):**
1. **Hentikan storm dulu** — akses lewat **console** (SSH tidak responsif).
2. Identifikasi port dengan trafik ekstrem, **shutdown** port yang mencurigakan (biasanya yang baru dipasang).
3. Setelah pulih, investigasi: `show spanning-tree`, `show cdp neighbors`, periksa perubahan kabel.
4. Perbaiki akar masalah, aktifkan **BPDU Guard** + **storm control** agar tidak terulang.

**Pencegahan:** PortFast + BPDU Guard di semua port access, storm control. Lihat `03-data-link/04`.
</details>

---

## Kasus 7: Asymmetric Routing Merusak Firewall

**Gejala:** Setelah menambah link WAN kedua, sebagian koneksi tiba-tiba terputus. Ping berhasil tetapi sesi TCP putus secara acak.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: Asymmetric routing dengan firewall stateful.** Trafik pergi lewat satu jalur/firewall, balasan kembali lewat firewall yang berbeda. Firewall kedua tidak punya entri koneksi (tidak melihat SYN pergi), sehingga menganggap trafik balasan invalid dan membuangnya.

**Bukti:** ping (stateless ICMP) berhasil, tetapi TCP (stateful) putus setelah menambah jalur.

**Verifikasi:** capture di kedua firewall — trafik pergi di satu, balasan di lain.

**Solusi:**
- Pastikan trafik **simetris** (perbaiki routing agar pergi dan balik lewat jalur yang sama), atau
- Firewall cluster dengan **sinkronisasi state**, atau
- Kecualikan jalur tersebut dari inspeksi stateful.

Lihat `04-network-layer/05`, `09-nat-acl-firewall/03`.
</details>

---

## Kasus 8: DHCP Pool Habis

**Gejala:** Perangkat baru tidak bisa mendapat IP di jaringan tamu Wi-Fi, tetapi perangkat lama tetap bekerja. Terjadi sore hari saat ramai.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: Pool DHCP habis.** Terlalu banyak perangkat untuk ukuran pool, diperparah lease time yang panjang (perangkat yang pergi masih menahan alamat).

**Bukti:** `show ip dhcp pool` menunjukkan pool penuh; hanya perangkat baru yang gagal; terjadi saat ramai.

**Kemungkinan lain:** rogue DHCP, DHCP starvation attack, MAC randomization ponsel (setiap perangkat tampak sebagai perangkat baru).

**Solusi:**
- Perbesar pool (subnet lebih besar untuk tamu).
- **Perpendek lease time** untuk jaringan tamu (mis. 1-2 jam) agar alamat cepat kembali.
- Periksa DHCP starvation (rate limit + DHCP snooping).

Lihat `06-aplikasi/02`.
</details>

---

## Kasus 9: Sticky Wi-Fi Client

**Gejala:** Pengguna berjalan dari lantai 1 ke lantai 2, tetapi laptopnya tetap terhubung ke AP lantai 1 dengan sinyal −85 dBm dan sangat lambat, padahal ada AP lantai 2 dengan sinyal −45 dBm di dekatnya.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: Sticky client.** Klien yang menentukan kapan roaming, bukan AP. Algoritma roaming klien yang buruk bertahan di AP lama sampai sinyal sangat lemah.

**Bukti:** klien di AP jauh dengan sinyal buruk padahal ada AP dekat yang jauh lebih baik.

**Solusi (di sisi jaringan, karena tidak bisa mengontrol klien):**
- **Turunkan daya pancar AP** agar sel lebih kecil dan batas lebih tegas.
- Aktifkan **minimum RSSI threshold** (AP memutus klien di bawah ambang, memaksa roam).
- **Matikan rate rendah** (klien jauh tidak bisa bertahan).
- Aktifkan **802.11k/v/r** untuk fast roaming.
- Perbarui driver klien.

Lihat `10-wireless/04`.
</details>

---

## Kasus 10: BGP Session Tidak ESTABLISHED

**Gejala:** `show ip bgp summary` menunjukkan state `Active` untuk peer ISP baru.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: `Active` berarti TCP 179 gagal terbentuk** — nama yang menyesatkan.

**Periksa:**
1. `ping <peer>` (dengan source yang benar) — apakah peer terjangkau?
2. `telnet <peer> 179` — apakah TCP 179 terbuka?
3. ACL memblokir TCP 179?
4. AS number benar di kedua sisi?
5. Password BGP cocok? (kalau salah, flap antara IDLE/ACTIVE)
6. Untuk iBGP: `update-source loopback` dan rute ke loopback peer?
7. `ttl-security`/eBGP multihop kalau tidak bertetangga langsung?

**Solusi:** bergantung temuan. Untuk eBGP, penyebab umum: ACL memblokir 179, atau peer belum mengonfigurasi Anda. Lihat `07-routing-lanjutan/06`.
</details>

---

## Kasus 11: NAT Exhaustion di Proxy

**Gejala:** Server reverse proxy melaporkan error `Cannot assign requested address` saat trafik tinggi. Sebagian koneksi ke backend gagal.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: Port ephemeral habis.** Proxy membuat banyak koneksi keluar ke sedikit backend. Karena IP sumber, IP tujuan, dan port tujuan tetap, hanya port sumber yang bervariasi — dan itu habis (~28.000 di Linux default), diperparah socket TIME_WAIT.

**Bukti:** error `EADDRNOTAVAIL`, banyak socket TIME_WAIT (`ss -s`).

**Solusi:**
```bash
$ sudo sysctl -w net.ipv4.ip_local_port_range="10000 65535"
$ sudo sysctl -w net.ipv4.tcp_tw_reuse=1
```
- Aktifkan **keep-alive/connection pooling** ke backend (jangan buat koneksi baru terus).
- Tambah IP sumber atau port tujuan backend.

⚠️ Jangan pakai `tcp_tw_recycle` (dihapus dari kernel). Lihat `05-transport/01`, `05-transport/02`.
</details>

---

## Kasus 12: Sertifikat TLS Kedaluwarsa

**Gejala:** Aplikasi web tiba-tiba tidak bisa diakses. Browser menampilkan peringatan sertifikat. Terjadi tepat tengah malam.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: Sertifikat TLS kedaluwarsa.** Terjadi tepat tengah malam karena sertifikat kedaluwarsa pada waktu tertentu.

**Bukti:**
```bash
$ echo | openssl s_client -connect app.example.com:443 2>/dev/null \
    | openssl x509 -noout -dates
notAfter=... (tanggal lampau)
```

**Kemungkinan lain:** kalau bukan kedaluwarsa, periksa apakah **jam sistem salah** ("not yet valid" = jam mundur), atau **intermediate tidak dikirim** (berhasil di browser desktop, gagal di mobile/curl).

**Solusi:** perbarui sertifikat. **Otomatisasi dengan ACME/Let's Encrypt** agar tidak terulang — sertifikat 90 hari memaksa otomasi. Pantau kedaluwarsa sertifikat (alert 14 hari sebelumnya). Lihat `06-aplikasi/04`.
</details>

---

## Kasus 13: VLAN Hilang di Trunk

**Gejala:** Dua PC di VLAN 30 di switch berbeda tidak bisa saling ping. Di VLAN 10, PC di kedua switch bisa.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: VLAN 30 tidak dilewatkan di trunk, atau tidak ada di salah satu switch.**

**Periksa:**
1. `show interfaces trunk` — apakah VLAN 30 di "allowed" DAN "active"?
   - Di "allowed" tetapi tidak "active" → VLAN 30 belum dibuat di switch ini.
   - Tidak di "allowed" → `switchport trunk allowed vlan` tidak menyertakannya.
2. `show vlan brief` di **kedua** switch — apakah VLAN 30 ada di keduanya?
3. `show spanning-tree vlan 30` — apakah STP memblokir jalur?
4. Native VLAN mismatch?

**Solusi:**
```
SW1(config)# vlan 30
SW1(config-if)# switchport trunk allowed vlan add 30
```
⚠️ Ingat: `switchport trunk allowed vlan 30` **menimpa** daftar — pakai `add`. Lihat `03-data-link/03`.
</details>

---

## Kasus 14: Congestion vs Loss

**Gejala:** Aplikasi terasa lambat lintas WAN. Utilisasi link menunjukkan 60%. Tidak ada error di interface.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: bisa beberapa hal — perlu membedakan.**

**Periksa:**
1. **Latency di bawah beban** (`mtr` saat aplikasi jalan) — kalau tinggi → bufferbloat/queuing.
2. **Packet loss** (`mtr`, `iperf3 -u`) — loss kecil (0,1%) sudah merusak TCP throughput.
3. **Microburst** — utilisasi rata-rata 60% tetapi `output drops` naik → lonjakan singkat melebihi kapasitas.
4. **Window TCP vs BDP** — link long-fat, window kecil → satu koneksi tidak bisa mengisi pipa.
5. **Aplikasi chatty** — banyak round-trip kecil, latency-bound bukan bandwidth-bound.

**Bukti kunci:** utilisasi 60% dengan aplikasi lambat sering berarti masalahnya **bukan bandwidth** — melainkan latency, loss, microburst, atau window. Menambah bandwidth tidak akan membantu.

**Solusi:** bergantung temuan — QoS (bufferbloat/microburst), perbaiki loss, tuning window TCP (BDP), atau optimasi aplikasi. Lihat `05-transport/04`, `11-wan-vpn/03`.
</details>

---

## Kasus 15: "Internet Lambat" Tanpa Gejala Jelas

**Gejala:** Pengguna mengeluh "internet lambat" tetapi semua terlihat normal — utilisasi rendah, tidak ada error, ping bagus.

<details>
<summary>Diagnosis</summary>

**Akar penyebab: bisa banyak hal — pendekatan sistematis diperlukan.** Ini kasus tersulit karena gejalanya samar.

**Pendekatan:**
1. **Reproduksi** — apa persisnya "lambat"? Membuka halaman? Download? Aplikasi tertentu? Semua atau sebagian?
2. **Scope** — satu pengguna atau semua? Satu aplikasi atau semua? Kapan mulai?
3. **Ukur objektif** — bukan "terasa lambat" tetapi angka: `curl -w` untuk waktu per fase (DNS, connect, TLS, TTFB).
   ```bash
   $ curl -w "dns:%{time_namelookup} connect:%{time_connect} tls:%{time_appconnect} ttfb:%{time_starttransfer} total:%{time_total}\n" -o /dev/null -s https://situs
   ```
4. **Isolasi fase** — mana yang lambat?
   - `dns` tinggi → masalah DNS.
   - `connect` tinggi → latency jaringan/routing.
   - `tls` tinggi → masalah TLS/OCSP.
   - `ttfb` tinggi → server lambat memproses.
   - `total` tinggi tetapi lain rendah → transfer/bandwidth.
5. **Bufferbloat** — ping saat ada beban lain.
6. **Wi-Fi** — kalau via Wi-Fi, cek SNR, kanal, jumlah klien.
7. **Baseline** — bandingkan dengan data historis (monitoring).

**Pelajaran:** ubah keluhan subjektif menjadi **angka objektif per fase**, lalu isolasi. Lihat `14-monitoring-troubleshooting/01`, `02`.
</details>

---

## Pola Umum dari 15 Kasus

Setelah mengerjakan semua kasus, perhatikan pola yang berulang:

```
1. "It's always DNS" — Kasus 4 (dan sering tersembunyi di Kasus 15)

2. MTU black hole di tunnel/VPN — Kasus 2

3. Bufferbloat / microburst / queuing bukan bandwidth — Kasus 1, 14, 15

4. Layer 2 fatal (loop, duplex, VLAN) — Kasus 5, 6, 13

5. Stateful firewall + asymmetric routing — Kasus 7

6. "Up tetapi lambat" ≠ "down" — Kasus 9, 14, 15

7. Habisnya sumber daya (pool, port, tabel) — Kasus 8, 11

8. Otomatisasi yang terlupa (sertifikat, PortFast) — Kasus 3, 12

9. Nama yang menyesatkan (BGP "Active") — Kasus 10

10. Ubah subjektif menjadi objektif — Kasus 15
```

### Checklist mental untuk masalah apa pun

```
1. Scope: berapa banyak, apa, kapan, arah mana? Apa yang BERUBAH?
2. Gejala vs penyebab: jangan perbaiki gejala.
3. OSI: bottom-up, top-down, atau divide (mulai ping)?
4. Alur universal: localhost → IP → gateway → internet → DNS → port → app.
5. "It's always DNS" — cek ping IP vs nama.
6. "Up tetapi lambat" — cek latency di bawah beban, bukan cuma up/down.
7. Layer 2 dulu kalau tidak ada konektivitas (kabel, duplex, VLAN, loop).
8. Ukur objektif (curl -w, mtr, iperf3), jangan mengandalkan "terasa".
9. Capture di titik yang tepat kalau perlu bukti.
10. Dokumentasikan + RCA blameless setelah selesai.
```

---

## Ringkasan

- Troubleshooting nyata adalah **menautkan gejala ke akar penyebab dengan penalaran**, bukan hafalan.
- Pola berulang: **DNS**, **MTU black hole**, **bufferbloat/queuing (bukan bandwidth)**, **layer 2 fatal**, **asymmetric routing + firewall stateful**, **"up tetapi lambat"**, **habisnya sumber daya**, **otomasi yang terlupa**.
- **Selalu tentukan scope dulu** dan tanyakan **"apa yang berubah?"**.
- **Ubah keluhan subjektif menjadi angka objektif** (`curl -w`, `mtr`, `iperf3`) lalu isolasi per fase/lapisan.
- **"Up" ≠ sehat** — periksa kualitas (latency, loss, jitter) di bawah beban, bukan hanya status.
- Setelah selesai: **RCA blameless** dan tindakan preventif agar tidak terulang.

---

## Latihan Akhir

Untuk setiap gejala, tentukan diagnosis dan langkah pertama Anda:

1. Server database tidak bisa diakses dari aplikasi. Ping ke IP database berhasil, tetapi koneksi ke port 5432 timeout.
2. Setelah update firmware switch, beberapa server kehilangan konektivitas tetapi yang lain baik.
3. Panggilan VoIP terputus-putus hanya saat jam makan siang.
4. Website perusahaan tidak bisa diakses dari luar, tetapi bisa dari dalam kantor.
5. Kecepatan download dari server internasional sangat rendah, tetapi dari server lokal cepat.

<details>
<summary>Jawaban</summary>

1. **Firewall memblokir port 5432, atau layanan database tidak listening/bind salah.** Ping berhasil (L3 OK), tetapi port timeout. Bedakan: "timeout" berarti diblokir (firewall dengan DROP) atau tidak ada jalur balik; "refused" berarti host dijangkau tetapi tidak ada aplikasi. Langkah pertama: `nc -zv <db> 5432` untuk konfirmasi, lalu periksa (a) firewall antara aplikasi dan database (security group, iptables/nftables, firewall zona); (b) apakah database bind ke `0.0.0.0` atau hanya `127.0.0.1` (`ss -tlnp` di server DB — kesalahan sangat umum); (c) apakah layanan berjalan; (d) asymmetric routing jika ada beberapa jalur.

2. **Kemungkinan besar perubahan konfigurasi/default akibat update firmware** — "apa yang berubah?" langsung menunjuk update. Update sering mereset default (mis. VLAN, spanning-tree mode, atau perilaku port). Langkah pertama: bandingkan konfigurasi sebelum dan sesudah (`show archive config differences` atau diff dari backup), fokus pada server yang terpengaruh — kemungkinan mereka berbagi karakteristik (VLAN sama, fitur sama, port type sama). Periksa VLAN, trunk allowed VLAN, spanning-tree (mungkin port di-blok), MTU, dan apakah ada fitur yang perilakunya berubah. Kalau kritis, pertimbangkan rollback firmware sambil investigasi. Ini menegaskan pentingnya backup konfigurasi dan change management.

3. **Congestion/kapasitas saat jam sibuk** (jam makan siang = puncak pemakaian). VoIP sensitif terhadap latency, jitter, dan loss; saat link penuh, ketiganya memburuk. Langkah pertama: **ukur latency, jitter, dan loss ke tujuan VoIP saat jam makan siang** (`mtr`, atau IP SLA jitter probe), bandingkan dengan jam sepi. Periksa utilisasi link WAN pada jam itu. Kemungkinan: (a) link jenuh saat puncak → butuh **QoS** untuk memprioritaskan voice (LLQ/EF), atau bandwidth lebih; (b) bufferbloat saat beban → AQM; (c) untuk Wi-Fi: kepadatan klien saat istirahat. Solusi paling mungkin: terapkan QoS agar voice diprioritaskan saat congestion.

4. **Masalah di perimeter: NAT/port forwarding, firewall ingress, atau DNS publik.** Bisa dari dalam (langsung ke server internal) tetapi tidak dari luar. Langkah pertama: tentukan mana yang gagal — (a) **DNS publik** salah/tidak menunjuk ke IP publik yang benar (`dig @8.8.8.8 www.perusahaan.com` dari luar); (b) **port forwarding/NAT** tidak dikonfigurasi atau salah (dari luar: `nc -zv <ip-publik> 443`); (c) **firewall perimeter** memblokir; (d) ISP memblokir port; (e) sertifikat (kalau HTTPS gagal tetapi TCP tersambung). Uji dari luar (VPS/ponsel dengan data seluler) dengan `curl -v` untuk melihat di fase mana gagal. Sering: hairpin NAT membuat "dari dalam bisa" padahal "dari luar" sebenarnya juga rusak — uji betul-betul dari luar.

5. **Masalah spesifik jalur internasional: latency tinggi + window TCP, atau packet loss di jalur panjang.** Cepat ke server lokal (RTT rendah), lambat ke internasional (RTT tinggi). Langkah pertama: `mtr` ke server internasional untuk melihat **latency dan loss per hop** — di mana degradasi mulai (jalur internasional sering punya loss di titik peering/transit). Lalu: (a) **BDP vs window TCP** — RTT tinggi (mis. 200 ms) dengan window kecil membatasi satu koneksi TCP; uji dengan `iperf3 -P 8` (multi-stream) — kalau multi-stream cepat, ini masalah window/BDP satu koneksi; solusi: window scaling, tuning buffer, atau transfer paralel. (b) **Packet loss** di jalur internasional — loss 0,1% saja memotong throughput TCP drastis pada RTT tinggi. (c) Pertimbangkan **CDN** untuk konten internasional — memindahkan data lebih dekat. Ini contoh klasik di mana "lambat" bukan tentang bandwidth lokal Anda, melainkan fisika jarak + perilaku TCP.

</details>

---

## Sumber

- Semua modul yang dirujuk dalam kasus (tautan di masing-masing)
- CompTIA Network+ N10-009, Domain 5.0 — skenario troubleshooting
- Google SRE Book — studi kasus troubleshooting
- `referensi/soal-latihan.md` di repositori ini — lebih banyak skenario

---

**Berikutnya:** `15-otomasi/01-mengapa-otomasi.md` — memasuki dunia otomasi jaringan.

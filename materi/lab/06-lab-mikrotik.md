# Lab 06 — MikroTik RouterOS End-to-End

> **Prasyarat:** Tahap 19, Lab 00 (setup CHR)
> **Platform:** MikroTik CHR (VirtualBox/VMware/GNS3) + WinBox/SSH
> **Format:** TUGAS → VERIFIKASI → KRITERIA SUKSES → solusi.

💡 Semua lab pakai CHR gratis (batas 1 Mbps, cukup untuk belajar). Kelola via WinBox (GUI) atau SSH. Skenario dirancang meniru kebutuhan RT-RW-Net/ISP kecil.

---

## Lab 6.1 — Setup Awal & Keamanan Router

**TUGAS:**
1. Boot CHR, ganti password admin default, buat user admin baru.
2. Beri IP ke interface WAN & LAN.
3. Setup firewall `input` default-deny (amankan router).
4. Nonaktifkan layanan tak perlu; batasi Winbox ke subnet LAN.

**VERIFIKASI:** `/ip service print`, `/ip firewall filter print`; router hanya bisa diakses dari LAN.

**KRITERIA SUKSES:** ✅ Router ter-hardening; akses manajemen terbatas.

<details><summary>Solusi & penjelasan</summary>

```routeros
/user set admin password=KuatSekali123
/ip address add address=192.168.88.1/24 interface=ether2   (LAN)
/ip address add address=203.0.113.2/30 interface=ether1    (WAN, contoh)
/ip firewall filter
add chain=input connection-state=established,related action=accept
add chain=input connection-state=invalid action=drop
add chain=input protocol=icmp action=accept
add chain=input src-address=192.168.88.0/24 action=accept
add chain=input action=drop
/ip service set telnet disabled=yes
/ip service set ftp disabled=yes
/ip service set winbox address=192.168.88.0/24
```
Ini menerapkan hardening `19/03` & `19/01`: firewall input default-deny (terima established/related dulu, lalu spesifik, drop sisanya), matikan layanan tak terpakai, batasi Winbox. ⚠️ Router MikroTik terekspos internet tanpa ini cepat diserang. Uji dari luar subnet LAN → akses ditolak.
</details>

---

## Lab 6.2 — Bridge, VLAN & Inter-VLAN

**TUGAS:**
1. Buat bridge, tambah beberapa port.
2. Aktifkan bridge VLAN filtering: VLAN 10 (staff), VLAN 20 (tamu).
3. Buat VLAN interface + IP (gateway) tiap VLAN.
4. Uji isolasi & routing antar-VLAN (via firewall).

**VERIFIKASI:** `/interface bridge vlan print`; host VLAN dapat gateway; inter-VLAN sesuai kebijakan.

**KRITERIA SUKSES:** ✅ VLAN terisolasi, inter-VLAN routing terkontrol.

<details><summary>Solusi & penjelasan</summary>

```routeros
/interface bridge add name=bridge1 vlan-filtering=no
/interface bridge port add bridge=bridge1 interface=ether3 pvid=10
/interface bridge port add bridge=bridge1 interface=ether4 pvid=20
/interface bridge vlan add bridge=bridge1 vlan-ids=10 tagged=bridge1 untagged=ether3
/interface bridge vlan add bridge=bridge1 vlan-ids=20 tagged=bridge1 untagged=ether4
/interface vlan add name=vlan10 vlan-id=10 interface=bridge1
/interface vlan add name=vlan20 vlan-id=20 interface=bridge1
/ip address add address=10.0.10.1/24 interface=vlan10
/ip address add address=10.0.20.1/24 interface=vlan20
/interface bridge set bridge1 vlan-filtering=yes     (AKTIFKAN TERAKHIR!)
```
⚠️ **Aktifkan `vlan-filtering=yes` paling akhir** setelah semua benar — salah bisa mengunci Anda keluar (`19/02`). VLAN interface = gateway (≈SVI). Kontrol trafik antar-VLAN dengan firewall `forward` (mis. tamu tak boleh ke staff). Membuktikan `19/02`.
</details>

---

## Lab 6.3 — NAT Internet + DHCP untuk Klien

**TUGAS:**
1. Konfigurasi DHCP server untuk LAN.
2. Setup NAT masquerade agar LAN keluar ke WAN/internet.
3. Set DNS (cache) di router; klien pakai router sebagai DNS.
4. Uji: klien dapat IP otomatis & akses internet.

**VERIFIKASI:** klien dapat lease; `/ip firewall nat print`; klien ping internet.

**KRITERIA SUKSES:** ✅ Klien DHCP + akses internet via NAT.

<details><summary>Solusi & penjelasan</summary>

```routeros
/ip pool add name=dhcp-lan ranges=192.168.88.10-192.168.88.254
/ip dhcp-server add name=srv1 interface=ether2 address-pool=dhcp-lan disabled=no
/ip dhcp-server network add address=192.168.88.0/24 gateway=192.168.88.1 dns-server=192.168.88.1
/ip dns set servers=8.8.8.8 allow-remote-requests=yes
/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade
```
`allow-remote-requests=yes` menjadikan router **DNS cache** untuk klien (mempercepat, mengurangi beban upstream — `06/01`). **Masquerade** = PAT keluar (`19/03`) — banyak klien berbagi IP WAN. Klien set ke DHCP → dapat IP, gateway, DNS otomatis. ⚠️ Pastikan firewall `forward` mengizinkan LAN→WAN. Membuktikan `19/03` + `06/02`.
</details>

---

## Lab 6.4 — Bandwidth Management (Simple Queue + PCQ + Burst)

**TUGAS:**
1. Buat simple queue membatasi satu klien ke 5M/5M.
2. Buat queue dengan **burst** (puncak 10M, turun ke 5M).
3. (Lanjutan) Konfigurasi PCQ untuk membagi bandwidth adil ke banyak klien.
4. Uji dengan bandwidth-test atau unduhan.

**VERIFIKASI:** `/queue simple print` (traffic terlihat dibatasi); burst terlihat di awal transfer.

**KRITERIA SUKSES:** ✅ Bandwidth dibatasi sesuai paket; burst & pembagian adil berfungsi.

<details><summary>Solusi & penjelasan</summary>

```routeros
# Simple queue dengan burst
/queue simple add name=paket-klien target=192.168.88.10/32 \
    max-limit=5M/5M burst-limit=10M/10M burst-threshold=4M/4M burst-time=8/8

# PCQ untuk pembagian adil (definisi tipe)
/queue type add name=pcq-dl kind=pcq pcq-classifier=dst-address pcq-rate=0
/queue type add name=pcq-ul kind=pcq pcq-classifier=src-address pcq-rate=0
```
`max-limit` format **upload/download** (⚠️ jangan terbalik — `19/04`). **Burst** membuat browsing terasa cepat (sampai 10M) tapi unduhan besar turun ke 5M. **PCQ `pcq-rate=0`** membagi bandwidth rata ke semua klien aktif (anti-monopoli). Untuk RT-RW-Net, kombinasikan dengan PPPoE profile agar limit ikut paket pelanggan otomatis. Membuktikan `19/04`.
</details>

---

## Lab 6.5 — PPPoE Server (Skenario ISP)

**TUGAS:**
1. Buat IP pool + PPP profile dengan `rate-limit` per paket.
2. Aktifkan PPPoE server di interface ke pelanggan.
3. Buat akun pelanggan (PPP secret).
4. Uji dengan PPPoE client (CHR kedua / router pelanggan): dial, dapat IP & bandwidth sesuai paket.

**VERIFIKASI:** `/ppp active print` (pelanggan terhubung); klien dapat IP & bandwidth profil.

**KRITERIA SUKSES:** ✅ Pelanggan terautentikasi via PPPoE & bandwidth ikut paket otomatis.

<details><summary>Solusi & penjelasan</summary>

**Server:**
```routeros
/ip pool add name=pppoe-pool ranges=10.20.0.2-10.20.0.254
/ppp profile add name=paket-10m local-address=10.20.0.1 remote-address=pppoe-pool rate-limit=3M/10M
/interface pppoe-server server add service-name=ISP interface=ether3 default-profile=paket-10m authentication=chap,pap disabled=no
/ppp secret add name=budi password=rahasia service=pppoe profile=paket-10m
```
**Client (router pelanggan):**
```routeros
/interface pppoe-client add name=wan-pppoe interface=ether1 user=budi password=rahasia add-default-route=yes use-peer-dns=yes disabled=no
```
`rate-limit` di **profil** otomatis membatasi bandwidth pelanggan saat connect — tak perlu queue manual (`19/06`). Ini cara ISP/RT-RW-Net mengelola langganan; ganti paket = ganti profil. Skala besar → RADIUS. ⚠️ Butuh dua CHR (server+client) untuk uji penuh. `/ppp active print` menunjukkan sesi aktif.
</details>

---

## Lab 6.6 — Hotspot Voucher

**TUGAS:**
1. Jalankan `/ip hotspot setup` di interface LAN.
2. Buat user profile (paket 2 jam, kecepatan terbatas).
3. Buat voucher; tambah walled garden (situs boleh tanpa login).
4. Uji: klien di-redirect ke portal login, akses setelah login.

**VERIFIKASI:** klien tak bisa akses internet sebelum login; bisa setelah voucher valid.

**KRITERIA SUKSES:** ✅ Captive portal & voucher berfungsi; walled garden benar.

<details><summary>Solusi & penjelasan</summary>

```routeros
/ip hotspot setup       (wizard: pilih interface, pool, DNS, dst)
/ip hotspot user profile add name=paket-2jam rate-limit=2M/2M session-timeout=2h shared-users=1
/ip hotspot user add name=voucher001 password=abc123 profile=paket-2jam
/ip hotspot walled-garden add dst-host=*.pembayaran.example action=allow
```
Hotspot membuat **captive portal**: klien di-redirect ke halaman login sebelum akses. **Walled garden** mengizinkan situs tertentu tanpa login (mis. halaman pembayaran voucher — `19/04`). Cocok untuk wifi publik/kafe/RT-RW-Net voucher. Skala besar → RADIUS + billing. ⚠️ Hotspot melakukan intersepsi+NAT; hati-hati bentrok firewall/NAT lain. Membuktikan `19/04`.
</details>

---

## Lab 6.7 — VPN Site-to-Site (WireGuard) + Monitoring

**TUGAS:**
1. Antara dua CHR, buat tunnel **WireGuard**.
2. Rutekan LAN masing-masing lewat tunnel; uji ping antar-LAN.
3. Setup **netwatch** memantau gateway; log saat up/down.
4. Amati trafik dengan **torch**.

**VERIFIKASI:** LAN A ping LAN B via tunnel; netwatch log; torch menampilkan trafik.

**KRITERIA SUKSES:** ✅ VPN antar-situs jalan; monitoring & diagnostik berfungsi.

<details><summary>Solusi & penjelasan</summary>

```routeros
# Situs A
/interface wireguard add name=wg1 listen-port=13231
/interface wireguard print    (catat public-key A)
/ip address add address=10.99.0.1/24 interface=wg1
/interface wireguard peers add interface=wg1 public-key="PUBKEY_B" \
    allowed-address=10.99.0.2/32,192.168.20.0/24 endpoint-address=<IP_B> endpoint-port=13231
/ip route add dst-address=192.168.20.0/24 gateway=10.99.0.2
# netwatch
/tool netwatch add host=192.168.20.1 interval=10s \
    up-script=":log info VPN-UP" down-script=":log warning VPN-DOWN"
# torch (interaktif)
/tool torch wg1
```
(Situs B: mirror config dengan PUBKEY_A & subnet A.) WireGuard = VPN modern sederhana (`19/06`) — tukar public-key, set allowed-address (subnet yang dijangkau), tambah rute. **Netwatch** memantau & bereaksi (dasar failover — `19/07`). **Torch** menampilkan trafik live. ⚠️ Buka port UDP WireGuard di firewall input. Membuktikan `19/06-07`.
</details>

---

## Ringkasan Lab 06

Anda membangun jaringan MikroTik lengkap ala ISP/RT-RW-Net: hardening, bridge/VLAN, NAT+DHCP+DNS, bandwidth management (queue/PCQ/burst), PPPoE server, hotspot voucher, VPN WireGuard, dan monitoring. Ini mempersiapkan MTCNA (`18/05`) dan pekerjaan nyata di ISP lokal.

💡 **Proyek portofolio kuat:** gabungkan Lab 6.1-6.7 menjadi satu "RT-RW-Net simulasi" terdokumentasi (topologi, config, screenshot) di GitHub (`18/04`). Ini sangat dihargai untuk kerja di ISP Indonesia.

**Berikutnya:** `lab/07-lab-membangun-protokol` — pendalaman: membangun protokol sendiri dengan Python, dari transfer andal sampai distance-vector.

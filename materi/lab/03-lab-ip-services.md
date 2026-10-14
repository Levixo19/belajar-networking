# Lab 03 — IP Services: DHCP, DNS, NAT, ACL

> **Prasyarat:** Tahap 6, 9, Lab 02
> **Platform:** Packet Tracer / GNS3
> **Format:** TUGAS → VERIFIKASI → KRITERIA SUKSES → solusi.

---

## Lab 3.1 — DHCP Server & Relay

**Topologi:** R1 sebagai DHCP server; PC di LAN mendapat IP otomatis. Lalu tambah LAN kedua yang butuh **relay**.

**TUGAS:**
1. Konfigurasi DHCP pool di R1 untuk LAN `10.0.1.0/24` (gateway, DNS, exclude beberapa IP).
2. Set PC ke DHCP → verifikasi mendapat IP.
3. Tambah LAN kedua di interface lain; konfigurasi **ip helper-address** (relay) agar LAN itu juga dapat IP dari pool terpisah.

**VERIFIKASI:** PC menampilkan IP/gateway/DNS dari DHCP; `show ip dhcp binding`.

**KRITERIA SUKSES:** ✅ Kedua LAN mendapat IP otomatis (langsung & via relay).

<details><summary>Solusi & penjelasan</summary>

```
R1(config)# ip dhcp excluded-address 10.0.1.1 10.0.1.10
R1(config)# ip dhcp pool LAN1
R1(dhcp-config)# network 10.0.1.0 255.255.255.0
R1(dhcp-config)# default-router 10.0.1.1
R1(dhcp-config)# dns-server 8.8.8.8
```
Untuk LAN kedua yang DHCP server-nya "jauh" (beda subnet): pada interface LAN kedua, `ip helper-address <IP-server-DHCP>` — router **me-relay** broadcast DHCP (DISCOVER) sebagai unicast ke server. Ini perlu karena **broadcast DHCP tidak melewati router** (`06-aplikasi/02`). `show ip dhcp binding` menampilkan lease. ⚠️ **Exclude** gateway & IP statis agar tidak diberikan ke klien. Membuktikan DORA & relay.
</details>

---

## Lab 3.2 — DNS Sederhana

**Topologi:** server DNS + web server + PC (di PT gunakan Server device).

**TUGAS:**
1. Konfigurasi server DNS dengan record A (`www.lab.local` → IP web server).
2. Set PC memakai server DNS itu.
3. Uji: dari PC, `ping www.lab.local` dan akses web via nama.

**VERIFIKASI:** ping/akses via **nama** (bukan IP) berhasil; resolusi nama bekerja.

**KRITERIA SUKSES:** ✅ Nama domain ter-resolve ke IP; akses via nama berhasil.

<details><summary>Solusi & penjelasan</summary>

Di Server (PT): Services → DNS → On, tambah record A `www.lab.local` = IP web server. Set PC → DNS Server = IP server DNS. Dari PC, `ping www.lab.local` memicu **query DNS** (A record) → dapat IP → ping ke IP itu. Ini mendemonstrasikan peran DNS (`06-aplikasi/01`): menerjemahkan nama ke IP. ⚠️ Jika gagal: cek PC menunjuk DNS server yang benar, record ada, dan konektivitas IP ke server DNS OK (DNS tak berguna kalau IP tak nyambung). Eksperimen: tambah CNAME, amati query.
</details>

---

## Lab 3.3 — NAT/PAT ke "Internet"

**Topologi:** LAN privat `192.168.1.0/24` → R1 (NAT) → "internet" (R2 dengan IP publik simulasi).

**TUGAS:**
1. Konfigurasi PAT (overload): LAN privat keluar via satu IP publik R1.
2. Tandai interface inside & outside.
3. Uji: PC LAN bisa mencapai "internet"; amati translasi.

**VERIFIKASI:** `show ip nat translations` (banyak host privat → satu IP publik, port berbeda).

**KRITERIA SUKSES:** ✅ Host privat mencapai luar via satu IP publik; tabel NAT menunjukkan PAT.

<details><summary>Solusi & penjelasan</summary>

```
R1(config)# interface gi0/0            (ke LAN)
R1(config-if)# ip nat inside
R1(config)# interface gi0/1            (ke internet)
R1(config-if)# ip nat outside
R1(config)# access-list 1 permit 192.168.1.0 0.0.0.255
R1(config)# ip nat inside source list 1 interface gi0/1 overload
```
`overload` = **PAT** — banyak host privat berbagi satu IP publik, dibedakan **port sumber**. `show ip nat translations` menampilkan mapping (inside local → inside global:port). Ini yang memungkinkan ribuan perangkat rumah berbagi satu IP publik ISP. Membuktikan `09-nat-acl-firewall/01`. ⚠️ Interface inside/outside harus ditandai benar; ACL menentukan siapa yang di-NAT.
</details>

---

## Lab 3.4 — Standard & Extended ACL

**Topologi:** dari Lab 02/03 (beberapa LAN + server).

**TUGAS:**
1. **Standard ACL:** blokir satu subnet mengakses subnet lain, izinkan yang lain.
2. **Extended ACL:** izinkan HTTP ke server tapi blokir ICMP (ping) ke server yang sama.
3. Terapkan ACL di interface arah yang benar; uji.

**VERIFIKASI:** trafik yang diblok gagal, yang diizinkan berhasil; `show access-lists` (hit counter).

**KRITERIA SUKSES:** ✅ ACL memfilter sesuai maksud; counter bertambah pada match.

<details><summary>Solusi & penjelasan</summary>

**Standard (filter berdasarkan sumber, taruh dekat tujuan):**
```
R1(config)# access-list 10 deny 10.0.20.0 0.0.0.255
R1(config)# access-list 10 permit any
R1(config)# interface gi0/1
R1(config-if)# ip access-group 10 out
```
**Extended (sumber+tujuan+port, taruh dekat sumber):**
```
R1(config)# ip access-list extended SRV
R1(config-ext-nacl)# permit tcp any host 10.0.50.10 eq 80
R1(config-ext-nacl)# deny icmp any host 10.0.50.10
R1(config-ext-nacl)# permit ip any any
R1(config)# interface gi0/0
R1(config-if)# ip access-group SRV in
```
⚠️ **Ada `deny any` implisit di akhir setiap ACL** — selalu sertakan `permit` yang diperlukan atau semua trafik terblokir. **Standard ACL** dekat **tujuan** (hanya lihat sumber); **Extended** dekat **sumber** (efisien, buang trafik lebih awal). `show access-lists` menampilkan hit count. Membuktikan `09-nat-acl-firewall/02`. Urutan baris penting (top-down, first match).
</details>

---

## Lab 3.5 — NTP & SSH (Manajemen Aman)

**TUGAS:**
1. Konfigurasi R1 sebagai NTP client (sinkron ke server NTP).
2. Konfigurasi SSH di R1 (hostname, domain, RSA key, user lokal, VTY hanya SSH).
3. Uji SSH dari PC/router lain; pastikan Telnet ditolak.

**VERIFIKASI:** `show ntp status` (synchronized); SSH berhasil, Telnet gagal.

**KRITERIA SUKSES:** ✅ Waktu tersinkron; akses hanya via SSH (Telnet mati).

<details><summary>Solusi & penjelasan</summary>

```
R1(config)# ntp server 10.0.0.5
R1(config)# hostname R1
R1(config)# ip domain-name lab.local
R1(config)# crypto key generate rsa modulus 2048
R1(config)# username admin secret KuatSekali123
R1(config)# line vty 0 4
R1(config-line)# transport input ssh          (HANYA ssh, bukan telnet)
R1(config-line)# login local
```
NTP menjaga **waktu sinkron** — kritis untuk korelasi log & sertifikat (`06-aplikasi/05`, `14/03`). SSH mengenkripsi sesi manajemen (Telnet plaintext — `12-keamanan/05`). `transport input ssh` menonaktifkan Telnet. ⚠️ RSA key butuh hostname + domain-name lebih dulu. Membuktikan CCNA 4.2 (NTP) & 5.3/2.8 (SSH). Praktik hardening dasar.
</details>

---

## Ringkasan Lab 03

Anda mempraktikkan: DHCP (server + relay), DNS, NAT/PAT, ACL (standard & extended), NTP & SSH. Ini inti CCNA domain 4.0 (IP Services) dan bagian keamanan/manajemen.

💡 Gabungkan dengan Lab 02: bangun jaringan lengkap dengan routing + DHCP + NAT ke internet + ACL keamanan + SSH — mendekati desain nyata (`17/04`).

**Berikutnya:** `lab/04-lab-keamanan-wireless.md` — keamanan L2, port security, dan WLAN.

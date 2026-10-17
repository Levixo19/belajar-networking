# 12.3 Serangan Layer 3 sampai Layer 7

> **Prasyarat:** `12-keamanan/02`, `05-transport/02`, `06-aplikasi/01`
> **Tujuan:** Anda bisa mengenali serangan pada layer 3-7, memahami mekanismenya, dan menerapkan mitigasi yang tepat.

---

## 1. IP Spoofing

Memalsukan alamat IP sumber. Dasar dari banyak serangan lain.

```
Tujuan penyerang:
1. Menyembunyikan identitas
2. Melewati kontrol berbasis IP
3. Membelokkan balasan ke korban (amplification)
4. Membanjiri tabel state (SYN flood)
```

> [!WARNING]
> **Spoofing pada TCP sulit dieksploitasi** untuk mencuri data karena penyerang tidak menerima balasan (tidak bisa menyelesaikan handshake). Tetapi **sangat efektif untuk DoS dan amplification** yang tidak memerlukan balasan.

### Mitigasi: BCP 38 / uRPF

```
R1(config-if)# ip verify unicast source reachable-via rx    ← strict
R1(config-if)# ip verify unicast source reachable-via any   ← loose
```

```
# MikroTik
/ip settings set rp-filter=strict

# Atau eksplisit dengan firewall
/ip firewall filter add chain=input in-interface-list=WAN \
    src-address-list=BOGON action=drop
/ip firewall filter add chain=forward in-interface-list=LAN \
    src-address=!192.168.0.0/16 action=drop comment="Anti-spoofing keluar"
```

> [!TIP]
> **BCP 38 adalah tanggung jawab setiap operator**: filter paket keluar yang alamat sumbernya bukan milik jaringan Anda. Kalau semua operator menerapkannya, sebagian besar amplification attack akan hilang. Ini pilar utama **MANRS**.

---

## 2. Serangan Berbasis ICMP

| Serangan | Mekanisme | Status |
|---|---|---|
| **Ping of Death** | Paket ICMP > 65.535 byte → buffer overflow | ❌ Sudah ditambal sejak lama |
| **Smurf** | Ping ke alamat **broadcast** dengan sumber = korban → semua host membalas ke korban | ❌ Mati (directed broadcast diblokir default) |
| **ICMP flood** | Membanjiri dengan echo request | ⚠️ Masih relevan |
| **ICMP redirect abuse** | Mengarahkan trafik korban ke penyerang | ⚠️ Mitigasi: `no ip redirects` |
| **ICMP tunneling** | Eksfiltrasi data dalam payload ICMP | ⚠️ Sulit dideteksi |

```
R1(config-if)# no ip directed-broadcast    ← default sejak IOS 12.0
R1(config-if)# no ip redirects
R1(config)# ip icmp rate-limit unreachable 1000
```

> [!WARNING]
> **Jangan blokir ICMP sepenuhnya** — merusak PMTUD, dan **mematikan IPv6** (`04-network-layer/04`).

```
# Rate limit, bukan blokir
/ip firewall filter add chain=input protocol=icmp limit=10,20:packet action=accept
/ip firewall filter add chain=input protocol=icmp action=drop
```

---

## 3. Serangan TCP

### SYN Flood

```
1. Penyerang mengirim ribuan SYN dengan alamat sumber palsu
2. Server mengalokasikan struktur data untuk setiap koneksi setengah-terbuka
3. Server mengirim SYN-ACK dan menunggu ACK yang tidak pernah datang
4. Backlog queue penuh → koneksi SAH ditolak
```

**Mitigasi: SYN Cookies**
```
Server tidak mengalokasikan state sampai ACK diterima.
Sequence number diturunkan secara kriptografis dari parameter koneksi,
sehingga server bisa memverifikasi ACK tanpa menyimpan apa pun.
```

```bash
$ sudo sysctl -w net.ipv4.tcp_syncookies=1
$ sudo sysctl -w net.ipv4.tcp_max_syn_backlog=4096
$ sudo sysctl -w net.ipv4.tcp_synack_retries=2
```

```
# MikroTik
/ip settings set tcp-syncookies=yes
/ip firewall filter add chain=input protocol=tcp tcp-flags=syn \
    connection-state=new action=jump jump-target=SYN-PROTECT
/ip firewall filter add chain=SYN-PROTECT protocol=tcp tcp-flags=syn \
    limit=400,50:packet action=return
/ip firewall filter add chain=SYN-PROTECT protocol=tcp tcp-flags=syn action=drop
```

```
# Cisco — TCP Intercept
R1(config)# ip tcp intercept list 101
R1(config)# ip tcp intercept mode watch
R1(config)# ip tcp intercept watch-timeout 10
```

### RST Injection

Penyerang di jalur (atau yang bisa menebak sequence number) mengirim paket **RST** palsu untuk memutus koneksi. Dipakai untuk sensor internet dan DoS selektif.

**Mitigasi:** ISN acak [RFC 6528] membuat penebakan sulit; **TLS** melindungi integritas data (walau koneksi tetap bisa diputus); **TCP-AO** [RFC 5925] untuk sesi kritis seperti BGP.

### Session Hijacking

Mengambil alih sesi yang sudah terautentikasi — biasanya dengan mencuri **session cookie**.

**Mitigasi:** HTTPS di semua halaman, cookie dengan `Secure` + `HttpOnly` + `SameSite`, rotasi session ID setelah login, binding sesi ke atribut klien, timeout yang wajar.

---

## 4. Serangan DNS

DNS adalah target favorit karena sangat penting dan sering kurang dilindungi.

| Serangan | Mekanisme | Mitigasi |
|---|---|---|
| **Cache poisoning** | Menyuntikkan record palsu ke cache resolver | **DNSSEC**, source port randomization, 0x20 encoding |
| **DNS amplification** | Query kecil → respons besar ke korban | BCP 38, **RRL**, nonaktifkan open resolver |
| **DNS tunneling** | Eksfiltrasi data dalam subdomain | Deteksi anomali, batasi panjang query, DNS firewall |
| **NXDOMAIN flood** | Membanjiri dengan query domain tidak ada | Rate limiting, cache negatif |
| **Domain hijacking** | Mengambil alih registrasi domain | Registrar lock, MFA di akun registrar |
| **Subdomain takeover** | Record CNAME menunjuk layanan yang sudah dihapus | Audit DNS berkala |
| **Typosquatting** | Domain mirip untuk phishing | Monitoring, daftarkan variasi umum |

### DNS Amplification: contoh nyata

```
Penyerang mengirim query 60 byte dengan alamat sumber = korban
Server DNS membalas 3.000 byte ke korban
→ Faktor amplifikasi 50×

Dengan 1.000 open resolver dan 10 Mbps dari penyerang:
→ 500 Mbps menghantam korban
```

**Faktor amplifikasi berbagai protokol:**
```
DNS (ANY)     : 28–54×
NTP (monlist) : hingga 556×
memcached     : hingga 51.000×  ⚠️
SSDP          : 30×
CLDAP         : 56–70×
```

**Mitigasi:**
```
✅ BCP 38 (mencegah spoofing di sumbernya) — yang paling fundamental
✅ Jangan jalankan open resolver
✅ Response Rate Limiting (RRL)
✅ Nonaktifkan fitur berisiko: NTP monlist, DNS ANY
✅ JANGAN PERNAH ekspos memcached/Redis ke internet
```

```
# MikroTik — jangan jadi open resolver!
/ip dns set allow-remote-requests=yes
/ip firewall filter add chain=input in-interface-list=WAN protocol=udp dst-port=53 action=drop
/ip firewall filter add chain=input in-interface-list=WAN protocol=tcp dst-port=53 action=drop
```

> [!WARNING]
> **Ini kesalahan konfigurasi MikroTik yang sangat umum di Indonesia** — `allow-remote-requests=yes` tanpa memfilter WAN membuat router menjadi open resolver yang dipakai untuk menyerang orang lain, dan menghabiskan bandwidth Anda.

### DNS Tunneling

```
Data dikodekan dalam nama subdomain:
  ZGF0YSB5YW5nIGRpY3VyaQ.attacker.com
  → resolver meneruskannya ke authoritative server penyerang
  → penyerang mendekode datanya
```

Dipakai untuk **eksfiltrasi data** dan **C2 channel** yang sering lolos firewall karena DNS hampir selalu diizinkan.

**Deteksi:**
```
- Query dengan nama sangat panjang
- Banyak subdomain unik ke satu domain
- Volume DNS tidak wajar dari satu host
- Entropi tinggi pada nama subdomain
- TXT/NULL record dalam jumlah besar
```

**Mitigasi:** DNS firewall/RPZ, monitoring anomali DNS, paksa semua klien memakai resolver internal yang diawasi.

---

## 5. DDoS

### Tiga kategori

| Kategori | Target | Contoh | Ukuran tipikal |
|---|---|---|---|
| **Volumetric** | **Bandwidth** | UDP flood, amplification | Gbps-Tbps |
| **Protocol** | **State/tabel** | SYN flood, fragmented packet | Mpps |
| **Application (L7)** | **Sumber daya aplikasi** | HTTP flood, slowloris | Rps rendah tetapi mematikan |

> [!WARNING]
> **Serangan L7 paling sulit** karena trafiknya terlihat sah. 1.000 request/detik ke endpoint pencarian yang mahal bisa melumpuhkan server tanpa memakan bandwidth berarti.

### Slowloris: serangan dengan bandwidth minimal

```
1. Buka banyak koneksi HTTP
2. Kirim header SANGAT LAMBAT (satu baris setiap beberapa detik)
3. Jangan pernah selesaikan request
4. Server menahan semua koneksi menunggu → connection pool habis
→ Hanya butuh beberapa kbps untuk melumpuhkan server
```

**Mitigasi:** timeout header yang ketat, batasi koneksi per IP, reverse proxy yang menyangga request lengkap (nginx melakukannya secara default).

### Mitigasi DDoS

```
DI TEPI JARINGAN ANDA:
  ✅ Rate limiting
  ✅ Firewall raw table (buang sebelum conntrack)
  ✅ SYN cookies
  ✅ Connection limit per IP
  ✅ Blackhole (RTBH) untuk alamat target
  ✅ BGP Flowspec (kalau ISP mendukung)

DI SISI PROVIDER/CLOUD:
  ✅ Scrubbing center
  ✅ Anycast (menyebarkan serangan)
  ✅ CDN / WAF
  ✅ Layanan DDoS protection (Cloudflare, Akamai, dll)
```

> [!WARNING]
> **Serangan volumetrik besar TIDAK BISA dimitigasi di tepi jaringan Anda** — kalau 100 Gbps menghantam link 1 Gbps, link sudah penuh sebelum paket mencapai firewall Anda. **Harus dimitigasi di hulu** oleh ISP atau layanan scrubbing.

### RTBH (Remotely Triggered Black Hole)

```
1. Anda mengiklankan rute /32 alamat yang diserang lewat BGP ke ISP
   dengan community khusus (mis. 65535:666)
2. ISP membuang semua trafik ke alamat itu di JARINGAN MEREKA
3. Link Anda selamat, tetapi alamat itu menjadi tidak dapat dijangkau
```

> [!WARNING]
> **RTBH menyelesaikan serangan dengan menyelesaikan tujuan penyerang** — layanan itu memang menjadi tidak tersedia. Ia melindungi **sisa** infrastruktur Anda. Untuk melindungi layanan itu sendiri, butuh scrubbing.

```
# MikroTik — rate limit dan blackhole
/ip firewall raw add chain=prerouting src-address-list=ddos-blacklist action=drop
/ip firewall filter add chain=forward connection-limit=100,32 \
    protocol=tcp action=add-src-to-address-list address-list=ddos-blacklist \
    address-list-timeout=1h
```

---

## 6. Man-in-the-Middle

| Teknik | Layer | Mitigasi |
|---|---|---|
| **ARP spoofing** | 2 | DAI, ARP reply-only |
| **Rogue DHCP** | 2/3 | DHCP snooping |
| **Rogue RA (IPv6)** | 3 | RA Guard |
| **DNS spoofing** | 7 | DNSSEC, DoH/DoT |
| **BGP hijacking** | 3 | RPKI/ROV |
| **Evil twin (Wi-Fi)** | 2 | 802.1X, WPA3 |
| **SSL stripping** | 7 | **HSTS**, HTTPS-only |
| **Rogue certificate** | 7 | Certificate pinning, CT logs, CAA |

### SSL Stripping

```
1. Pengguna mengetik "example.com" (tanpa https)
2. Browser mengirim HTTP
3. Penyerang di jalur mencegat, terhubung ke server lewat HTTPS,
   tetapi melayani pengguna lewat HTTP
4. Pengguna tidak melihat gembok tetapi tidak menyadarinya
5. Seluruh trafik terlihat oleh penyerang
```

**Mitigasi: HSTS** — browser **menolak** koneksi HTTP ke domain itu.
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

> [!TIP]
> **HSTS preload list** yang tertanam di browser melindungi bahkan pada kunjungan **pertama** — sebelum header HSTS pernah diterima.

---

## 7. Serangan Aplikasi Web

Meski ini domain developer, network engineer perlu memahaminya untuk mengonfigurasi WAF dan memahami log.

| Serangan | Mekanisme | Mitigasi jaringan |
|---|---|---|
| **SQL Injection** | Menyuntikkan SQL lewat input | WAF, rate limiting |
| **XSS** | Menyuntikkan script ke halaman | WAF, CSP header |
| **CSRF** | Memaksa aksi atas nama korban | SameSite cookie, token CSRF |
| **SSRF** | Server dipaksa mengakses resource internal | **Segmentasi**, firewall egress, blokir metadata cloud |
| **Path traversal** | `../../etc/passwd` | WAF |
| **Command injection** | Menyuntikkan perintah OS | WAF |
| **XXE** | Entitas eksternal XML | WAF, matikan parsing entitas |
| **Deserialization** | Objek berbahaya | Patch, WAF |

> [!WARNING]
> **SSRF sangat relevan untuk network engineer** — penyerang memaksa server web mengakses `169.254.169.254` (metadata cloud) untuk mencuri kredensial IAM. **Mitigasi jaringan:** blokir akses ke alamat metadata dari aplikasi yang tidak memerlukannya, dan terapkan firewall **egress** yang ketat.

```
# Blokir metadata cloud dari container/VM aplikasi
$ sudo nft add rule inet filter output ip daddr 169.254.169.254 drop
```

> [!TIP]
> **Firewall egress (keluar) sering diabaikan** padahal sangat efektif — membatasi ke mana server boleh terhubung menghentikan C2, eksfiltrasi, dan SSRF sekaligus.

---

## 8. Reconnaissance

Tahap pertama serangan: mengumpulkan informasi.

| Teknik | Yang dicari |
|---|---|
| **Passive OSINT** | WHOIS, DNS, Certificate Transparency, LinkedIn, GitHub, Shodan |
| **DNS enumeration** | Subdomain, zone transfer, brute force |
| **Port scanning** | Layanan terbuka |
| **Service/version detection** | Versi software untuk mencari CVE |
| **OS fingerprinting** | Sistem operasi (dari TTL, TCP options) |
| **Banner grabbing** | Informasi dari respons layanan |

```bash
# Contoh (HANYA pada sistem yang Anda miliki atau punya izin tertulis!)
$ nmap -sn 192.168.1.0/24              # host discovery
$ nmap -sS -p- 192.168.1.10            # TCP SYN scan semua port
$ nmap -sV -sC 192.168.1.10            # deteksi versi + script default
$ nmap -O 192.168.1.10                 # OS fingerprinting
$ nmap -sU --top-ports 100 192.168.1.10 # UDP scan
```

> [!WARNING]
> **Pemindaian tanpa izin tertulis adalah tindakan ilegal** di banyak yurisdiksi, termasuk Indonesia (UU ITE). Selalu miliki **rules of engagement** tertulis sebelum melakukan pengujian.

### Mitigasi

```
✅ Minimalkan informasi publik (WHOIS privacy, jangan bocorkan versi)
✅ Matikan banner yang mengungkap versi
✅ Firewall default-deny
✅ Deteksi port scan (port scan detection)
✅ Honeypot untuk deteksi dini
✅ Audit permukaan serangan eksternal Anda sendiri secara berkala
```

```
# MikroTik — deteksi port scan
/ip firewall filter add chain=input protocol=tcp psd=21,3s,3,1 \
    action=add-src-to-address-list address-list=port-scanner \
    address-list-timeout=2w comment="Deteksi port scan"
/ip firewall filter add chain=input src-address-list=port-scanner action=drop
```

> [!TIP]
> **Lakukan pemindaian terhadap diri sendiri secara berkala** (dari internet) untuk mengetahui apa yang terlihat penyerang. Sering ada layanan yang terekspos tanpa disadari.

---

## 9. Serangan pada Protokol Routing

| Serangan | Dampak | Mitigasi |
|---|---|---|
| **Rute palsu (OSPF/EIGRP)** | MITM, black hole | **Autentikasi** + `passive-interface` |
| **BGP hijacking** | Membelokkan trafik internet | **RPKI/ROV**, prefix filter, MANRS |
| **Route leak** | Menjadi transit tidak sengaja | Filter `^$`, `maximum-prefix` |
| **BGP session reset** | DoS pada routing | TCP-AO/MD5, GTSM (`ttl-security`) |

```
# Autentikasi OSPF
R1(config-if)# ip ospf authentication message-digest
R1(config-if)# ip ospf message-digest-key 1 md5 RahasiaKuat

# Passive interface — WAJIB di semua interface yang menghadap pengguna
R1(config-router)# passive-interface default
R1(config-router)# no passive-interface gi0/1

# BGP
R1(config-router)# neighbor 203.0.113.1 password RahasiaKuat
R1(config-router)# neighbor 203.0.113.1 ttl-security hops 1
R1(config-router-af)# neighbor 203.0.113.1 maximum-prefix 1000000 90 restart 15
```

Detail di `07-routing-lanjutan/02` dan `07-routing-lanjutan/06`.

---

## 10. Malware dan C2

### Command and Control

Setelah masuk, malware membutuhkan kanal untuk menerima perintah.

```
Kanal C2 yang umum:
  - HTTPS ke domain yang tampak sah (paling umum)
  - DNS tunneling
  - Layanan sah yang disalahgunakan (Telegram, Discord, GitHub, Dropbox)
  - Domain generation algorithm (DGA) — ribuan domain acak
  - Beaconing dengan interval teratur
```

**Deteksi dari sisi jaringan:**
```
✅ Beaconing — koneksi berulang dengan interval sangat teratur
✅ Volume DNS tidak wajar dari satu host
✅ Koneksi ke domain yang baru terdaftar
✅ Koneksi keluar ke negara/ASN yang tidak biasa
✅ User-Agent yang tidak lazim
✅ Sertifikat TLS yang self-signed atau JA3 fingerprint yang dikenal
✅ Volume upload yang tidak wajar (eksfiltrasi)
```

**Mitigasi:**
```
✅ Firewall EGRESS yang ketat — server hanya boleh keluar ke tujuan yang diperlukan
✅ DNS filtering (blokir domain berbahaya dan yang baru terdaftar)
✅ Proxy dengan inspeksi untuk trafik keluar
✅ Threat intelligence feed
✅ Segmentasi (membatasi apa yang bisa dijangkau setelah kompromi)
✅ Monitoring NetFlow untuk pola beaconing
```

> [!TIP]
> **Firewall egress adalah kontrol yang paling kurang dimanfaatkan.** Sebagian besar organisasi memfilter trafik masuk dengan ketat tetapi mengizinkan semua yang keluar — padahal itulah jalur C2 dan eksfiltrasi.

---

## 11. Ringkasan

- **IP spoofing** adalah dasar banyak serangan → **BCP 38 / uRPF** adalah tanggung jawab setiap operator.
- **ICMP**: rate limit, jangan blokir total (merusak PMTUD dan IPv6). Matikan `ip redirects` dan `directed-broadcast`.
- **SYN flood** → **SYN cookies** + backlog besar + rate limit.
- **DNS**: cache poisoning (→ DNSSEC), **amplification** (→ jangan jadi open resolver, RRL, BCP 38), **tunneling** (→ monitoring anomali).
- **Kesalahan MikroTik umum: `allow-remote-requests=yes` tanpa memfilter WAN** → menjadi open resolver.
- **DDoS**: volumetric (bandwidth), protocol (state), **application L7 (paling sulit — trafik terlihat sah)**.
- **Serangan volumetrik besar tidak bisa dimitigasi di tepi jaringan Anda** — butuh scrubbing di hulu. **RTBH** melindungi sisa infrastruktur dengan mengorbankan satu alamat.
- **SSL stripping** → **HSTS** dengan preload.
- **SSRF** sangat relevan bagi network engineer — blokir akses ke metadata cloud dan terapkan **firewall egress**.
- **Pemindaian tanpa izin tertulis adalah ilegal.** Lakukan audit permukaan serangan terhadap diri sendiri secara berkala.
- **Protokol routing** butuh **autentikasi + passive-interface**; BGP butuh **RPKI, prefix filter, maximum-prefix, GTSM**.
- **Firewall egress adalah kontrol yang paling kurang dimanfaatkan** — ia menghentikan C2, eksfiltrasi, dan SSRF sekaligus.

---

## 12. Latihan

1. Jelaskan DNS amplification dan hitung dampak 1.000 open resolver dengan faktor amplifikasi 50× dari penyerang berbandwidth 20 Mbps.
2. Kenapa serangan L7 lebih sulit dimitigasi daripada volumetric?
3. Router MikroTik Anda dilaporkan ikut menyerang pihak lain. Apa dugaan utama dan bagaimana memperbaikinya?
4. Jelaskan slowloris dan mengapa ia efektif dengan bandwidth sangat kecil.
5. Apa itu RTBH dan apa keterbatasannya?
6. Kenapa firewall egress penting, dan tiga hal apa yang dicegahnya?
7. Sebuah server web di DMZ diretas lewat SSRF dan penyerang mencuri kredensial cloud. Bagaimana kontrol jaringan bisa mencegahnya?
8. Sebutkan indikator jaringan yang menunjukkan adanya komunikasi C2.

<details>
<summary>Jawaban</summary>

1. **DNS amplification** memanfaatkan dua hal: (a) UDP tidak memverifikasi alamat sumber, sehingga penyerang bisa **memalsukan alamat sumber menjadi alamat korban**; (b) respons DNS bisa **jauh lebih besar** daripada query (terutama query ANY atau domain dengan banyak record/DNSSEC). Penyerang mengirim query kecil ke ribuan **open resolver** dengan alamat sumber palsu; semua resolver membalas ke korban.
   **Perhitungan:** penyerang mengirim 20 Mbps query. Dengan faktor amplifikasi 50×, trafik yang menghantam korban = **20 × 50 = 1.000 Mbps (1 Gbps)**. Kalau penyerang memakai botnet dengan 100 host masing-masing 20 Mbps, hasilnya **100 Gbps** — cukup untuk melumpuhkan sebagian besar organisasi.
   Mitigasi paling fundamental adalah **BCP 38** (mencegah spoofing di sumbernya) dan **tidak menjalankan open resolver**.

2. Karena **trafik serangan L7 terlihat sah**. Serangan volumetric mudah dikenali — lonjakan trafik UDP dari ribuan alamat ke satu tujuan, dengan pola yang jelas tidak normal; scrubbing center dapat memfilternya berdasarkan tanda tangan protokol.
   Serangan L7 adalah **request HTTP yang valid**: format benar, TLS handshake normal, User-Agent wajar, dan berasal dari alamat yang mungkin sah (botnet perangkat terinfeksi atau proxy residensial). Untuk membedakan "pengguna sah" dan "penyerang", sistem harus memahami **perilaku aplikasi** — request mana yang mahal, pola akses mana yang tidak wajar. Selain itu, volumenya kecil (1.000 rps bisa cukup) sehingga tidak memicu ambang berbasis bandwidth.
   Mitigasi memerlukan WAF dengan rate limiting per-endpoint, bot detection, CAPTCHA adaptif, dan pemahaman aplikasi — jauh lebih rumit daripada memfilter paket.

3. **Router menjadi open DNS resolver** — kesalahan konfigurasi MikroTik yang sangat umum. `allow-remote-requests=yes` diaktifkan (agar klien LAN bisa memakai router sebagai DNS) tetapi **port 53 dari WAN tidak difilter**, sehingga siapa pun di internet bisa mengirim query. Penyerang memakainya untuk **DNS amplification** terhadap korban lain, memakai bandwidth Anda.
   **Perbaikan:**
   ```
   /ip firewall filter add chain=input in-interface-list=WAN protocol=udp dst-port=53 action=drop
   /ip firewall filter add chain=input in-interface-list=WAN protocol=tcp dst-port=53 action=drop
   ```
   Periksa juga apakah router menjadi **open NTP server** (`/system ntp server set enabled=no` atau filter UDP 123 dari WAN) dan apakah `/tool bandwidth-server` masih aktif. Verifikasi dengan memindai IP publik Anda dari luar.

4. **Slowloris** membuka banyak koneksi HTTP ke server, lalu **mengirim header sangat lambat** — misalnya satu baris header setiap 10-15 detik — dan **tidak pernah menyelesaikan request**. Server, yang menunggu request lengkap sebelum memprosesnya, **menahan setiap koneksi tetap terbuka**. Ketika connection pool atau worker thread habis, server tidak bisa melayani pengguna sah.
   **Efektif dengan bandwidth kecil** karena setiap koneksi hanya memerlukan beberapa byte per belasan detik. Dengan beberapa ribu koneksi dan hanya beberapa kbps total, penyerang dapat menghabiskan seluruh kapasitas server — tidak ada lonjakan trafik yang terlihat mencurigakan.
   **Mitigasi:** timeout header yang ketat (`client_header_timeout` di nginx), batasi koneksi per IP, dan **reverse proxy yang menyangga request lengkap** sebelum meneruskan ke backend (nginx melakukannya secara default, sehingga backend terlindungi).

5. **RTBH (Remotely Triggered Black Hole)** adalah mekanisme di mana Anda mengiklankan rute untuk alamat yang sedang diserang (biasanya /32) lewat **BGP ke ISP** dengan **community khusus** (mis. 65535:666). ISP mengenali community itu dan **membuang semua trafik menuju alamat tersebut di jaringan mereka** — jauh di hulu, sebelum mencapai link Anda.
   **Keterbatasannya:** RTBH **menyelesaikan serangan dengan mencapai tujuan penyerang** — alamat itu memang menjadi tidak dapat dijangkau oleh siapa pun, termasuk pengguna sah. Layanan yang diserang tetap mati.
   Nilainya adalah **melindungi sisa infrastruktur**: link Anda tidak jenuh, dan layanan lain di jaringan yang sama tetap berjalan. Untuk melindungi layanan yang diserang itu sendiri, dibutuhkan **scrubbing center** yang memfilter trafik jahat dan meneruskan yang sah, atau **BGP Flowspec** yang memungkinkan filter lebih presisi (berdasarkan port/protokol, bukan seluruh alamat).

6. **Firewall egress membatasi ke mana sistem internal boleh terhubung.** Sebagian besar organisasi memfilter trafik **masuk** dengan sangat ketat tetapi mengizinkan hampir semua trafik **keluar** — padahal setelah penyerang berhasil masuk (lewat phishing, exploit, atau supply chain), seluruh aktivitas berikutnya adalah trafik keluar.
   **Tiga hal yang dicegahnya:** (a) **Command and Control** — malware tidak bisa menghubungi server penyerang untuk menerima perintah, sehingga infeksi menjadi tidak berguna; (b) **Eksfiltrasi data** — data tidak bisa dikirim keluar ke tujuan yang tidak diizinkan; (c) **SSRF dan lateral movement ke luar** — server yang dipaksa mengakses alamat internal atau metadata cloud akan diblokir.
   Tambahan: mencegah sistem internal ikut menjadi bagian botnet/DDoS, dan mencegah pemindaian keluar.
   **Penerapan praktis:** server produksi hanya boleh keluar ke repositori paket tertentu, NTP, DNS internal, dan endpoint API yang diperlukan — bukan ke seluruh internet.

7. Beberapa lapisan kontrol jaringan yang relevan:
   (a) **Blokir akses ke alamat metadata cloud** (`169.254.169.254`) dari aplikasi yang tidak memerlukannya — ini yang paling langsung mencegah pencurian kredensial IAM lewat SSRF.
   ```
   nft add rule inet filter output ip daddr 169.254.169.254 drop
   ```
   Di cloud modern, gunakan **IMDSv2** (memerlukan token PUT, sehingga SSRF sederhana gagal) dan matikan IMDSv1.
   (b) **Firewall egress ketat** — server web hanya boleh menghubungi backend dan API yang diperlukan; percobaan koneksi ke alamat internal lain atau internet umum diblokir dan **dicatat**.
   (c) **Segmentasi** — server DMZ tidak boleh menginisiasi koneksi ke jaringan internal; SSRF yang menargetkan sistem internal gagal.
   (d) **Monitoring dan alerting** pada percobaan koneksi yang ditolak dari server ke alamat internal — indikator kuat adanya SSRF yang sedang dicoba.
   (e) **WAF** untuk memfilter pola SSRF pada input.
   Perbaikan mendasar tetap ada di aplikasi (validasi dan allowlist URL), tetapi kontrol jaringan memberi lapisan pertahanan yang efektif.

8. Indikator jaringan untuk C2:
   - **Beaconing** — koneksi keluar berulang dengan **interval sangat teratur** (mis. tepat setiap 60 detik ± jitter kecil), berbeda dari pola manusia yang tidak beraturan.
   - **Volume DNS tidak wajar** dari satu host, terutama query dengan **nama panjang, entropi tinggi, dan banyak subdomain unik** ke satu domain → indikasi DNS tunneling.
   - **Koneksi ke domain yang baru terdaftar** (newly registered domain) atau domain dengan pola **DGA** (nama acak).
   - **Koneksi keluar ke ASN/negara yang tidak biasa** untuk organisasi itu.
   - **User-Agent yang tidak lazim** atau tidak cocok dengan perangkat lunak yang seharusnya berjalan.
   - **Sertifikat TLS self-signed** atau **JA3/JA3S fingerprint** yang dikenal terkait malware.
   - **Rasio upload/download yang tidak wajar** — host yang mengirim jauh lebih banyak daripada menerima → indikasi eksfiltrasi.
   - **Koneksi ke layanan sah yang tidak biasa dipakai** (Telegram API, Discord webhook, pastebin) dari server produksi.
   - **Aktivitas di luar jam kerja** dari host yang biasanya idle.
   Deteksi terbaik dilakukan dengan **NetFlow/IPFIX + analisis perilaku**, bukan sekadar tanda tangan.

</details>

---

## 13. Sumber

- RFC 2827 / BCP 38 — Network Ingress Filtering
- RFC 4987 — TCP SYN Flooding Attacks and Common Mitigations
- RFC 5358 — Preventing Use of Recursive Nameservers in Reflector Attacks
- RFC 6528 — Defending against Sequence Number Attacks
- RFC 6797 — HSTS
- OWASP Top 10 — https://owasp.org/Top10/
- MITRE ATT&CK — https://attack.mitre.org
- UU No. 11 Tahun 2008 jo. UU No. 19 Tahun 2016 (UU ITE) — aspek hukum pemindaian dan akses tidak sah
- Cisco CCNA 200-301 v1.1, topik 5.1

---

**Berikutnya:** `12-keamanan/04-aaa-identitas.md`. Autentikasi, otorisasi, dan akuntansi.

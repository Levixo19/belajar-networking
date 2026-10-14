# 06.1 — DNS

> **Prasyarat:** `05-transport/01`, `04-network-layer/01`
> **Tujuan:** Anda paham seluruh alur resolusi DNS, bisa membaca semua record type, mendiagnosis dengan `dig`, dan membangun resolver sendiri.

> 💡 **Aturan lapangan:** *"It's always DNS."* Ketika ada masalah jaringan yang tidak jelas penyebabnya, DNS adalah tersangka nomor satu. Modul ini panjang karena DNS memang sepenting itu.

---

## 1. Masalah yang Dipecahkan DNS

Manusia mengingat nama; komputer memerlukan angka.

```
Manusia : "tokopedia.com"
Komputer: 104.18.x.x
```

**Solusi pertama (1970-an):** file `HOSTS.TXT` yang di-hosting di SRI-NIC. Setiap host mengunduhnya secara berkala.

**Kenapa gagal:**
- Satu file untuk seluruh internet → tidak scalable
- Perubahan butuh koordinasi terpusat
- Konflik nama
- Bandwidth untuk distribusi tumbuh kuadratik

**Solusi DNS (1983, Paul Mockapetris, RFC 1034/1035):** basis data **terdistribusi** dan **hierarkis** dengan **delegasi otoritas**.

💡 File hosts masih ada dan **diperiksa lebih dulu** daripada DNS:
```
Linux/macOS : /etc/hosts
Windows     : C:\Windows\System32\drivers\etc\hosts
```

---

## 2. Struktur Namespace

```
                        .  (root)
                        │
      ┌─────────┬───────┼───────┬─────────┐
     com       org      id     net       edu        ← TLD
      │                 │
   ┌──┴──┐          ┌───┴───┐
 google example    co     ac                        ← SLD (untuk ccTLD berjenjang)
   │                 │
  www            tokopedia                          ← subdomain
                     │
                    www
```

### Terminologi

| Istilah | Contoh | Arti |
|---|---|---|
| **Root** | `.` | Puncak hierarki (titik di akhir) |
| **TLD** | `com`, `org`, `id` | Top Level Domain |
| **gTLD** | `com`, `org`, `net`, `app`, `dev` | Generic TLD |
| **ccTLD** | `id`, `uk`, `jp` | Country Code TLD |
| **SLD** | `example` dalam `example.com` | Second Level Domain |
| **Subdomain** | `www` dalam `www.example.com` | Level di bawahnya |
| **FQDN** | `www.example.com.` | Fully Qualified Domain Name (dengan titik akhir) |
| **Zone** | `example.com` | Bagian namespace yang dikelola satu otoritas |
| **Label** | `www`, `example`, `com` | Satu bagian antar-titik |

⚠️ **Titik di akhir (`example.com.`) menandakan FQDN absolut.** Tanpa titik, resolver bisa menambahkan **search domain** dari konfigurasi:
```
/etc/resolv.conf:
  search perusahaan.local

Anda ketik : server1
Resolver coba: server1.perusahaan.local
```
Ini penyebab masalah yang membingungkan ketika search domain salah dikonfigurasi.

**Batasan teknis:**
- Panjang label maksimum: 63 karakter
- Panjang FQDN maksimum: 253 karakter
- Karakter: huruf, angka, tanda hubung (LDH). Nama internasional dikodekan sebagai **punycode** (`xn--...`)

---

## 3. Jenis Server DNS

| Jenis | Tugas |
|---|---|
| **Stub resolver** | Pustaka di OS/aplikasi. Mengirim query ke recursive resolver. Tidak melakukan resolusi sendiri |
| **Recursive resolver** | Melakukan seluruh proses pencarian atas nama klien. Menyimpan cache. Contoh: 8.8.8.8, 1.1.1.1, resolver ISP |
| **Root server** | 13 nama server (`a.root-servers.net` – `m`), ratusan instance **anycast**. Menunjuk ke TLD |
| **TLD server** | Otoritatif untuk `.com`, `.id`, dst. Menunjuk ke authoritative server domain |
| **Authoritative server** | Menyimpan data zona sesungguhnya. Jawabannya adalah kebenaran |
| **Forwarder** | Meneruskan query ke resolver lain alih-alih melakukan rekursi sendiri |

⚠️ **Root server ada 13 *nama*, bukan 13 mesin.** Setiap nama diumumkan lewat **anycast** dari ratusan lokasi di dunia (lebih dari 1.500 instance total). Batas 13 berasal dari ukuran maksimum respons DNS 512 byte pada masa itu.

---

## 4. Alur Resolusi Lengkap

Skenario: Anda mengetik `www.example.com` dan tidak ada cache di mana pun.

```
┌─────────┐
│ Browser │ 1. Cek cache browser sendiri
└────┬────┘
     │ 2. Cek cache OS, lalu /etc/hosts
     ▼
┌──────────────┐
│Stub resolver │ 3. Query ke recursive resolver (rekursif: "carikan untuk saya")
└──────┬───────┘
       ▼
┌───────────────────┐
│Recursive resolver │ 4. Cek cache sendiri — tidak ada
│  (mis. 1.1.1.1)   │
└─────┬─────────────┘
      │ 5. Query ITERATIF ke ROOT: "www.example.com?"
      ▼
  ┌────────┐
  │ ROOT   │ 6. "Saya tidak tahu, tapi tanya server .com ini:
  │        │     a.gtld-servers.net = 192.5.6.30"    ← REFERRAL
  └────────┘
      │ 7. Query ke server .com
      ▼
  ┌────────┐
  │  .com  │ 8. "Saya tidak tahu, tapi example.com dikelola:
  │        │     ns1.example.com = 93.184.216.5"     ← REFERRAL
  └────────┘
      │ 9. Query ke authoritative server
      ▼
  ┌──────────────┐
  │ authoritative│ 10. "www.example.com = 93.184.216.34, TTL 3600"
  │ example.com  │      ← JAWABAN OTORITATIF
  └──────────────┘
      │
      ▼ 11. Resolver menyimpan di cache selama TTL
┌──────────────┐
│Stub resolver │ 12. Menerima jawaban
└──────┬───────┘
       ▼
┌─────────┐
│ Browser │ 13. Menghubungi 93.184.216.34
└─────────┘
```

### Query Rekursif vs Iteratif

| | **Rekursif** | **Iteratif** |
|---|---|---|
| Permintaan | "Carikan jawabannya untuk saya" | "Beri tahu apa yang kamu tahu" |
| Jawaban | Jawaban final | Jawaban **atau referral** |
| Dipakai antara | Klien → recursive resolver | Recursive resolver → root/TLD/authoritative |
| Beban kerja | Di resolver | Di klien (resolver) |

⚠️ **Root dan TLD server TIDAK melakukan rekursi.** Mereka hanya memberi referral. Kalau mereka melakukan rekursi untuk semua orang, mereka akan langsung kewalahan.

### Caching

Setiap jawaban punya **TTL** (detik). Selama TTL belum habis, resolver menjawab dari cache tanpa bertanya lagi.

```
TTL 300    (5 menit)   → perubahan cepat menyebar; beban query tinggi
TTL 3600   (1 jam)     → keseimbangan umum
TTL 86400  (1 hari)    → beban rendah; perubahan lambat menyebar
```

💡 **Praktik saat migrasi:** turunkan TTL ke 300 detik **beberapa hari sebelum** perubahan, lakukan perubahan, verifikasi, lalu naikkan lagi. Kalau Anda menurunkan TTL bersamaan dengan perubahan, resolver masih memegang nilai TTL lama yang panjang.

**Negative caching** [RFC 2308] — jawaban NXDOMAIN juga di-cache, dengan durasi dari field **minimum** di record SOA.

---

## 5. Resource Record (RR)

### Format
```
NAMA              TTL   CLASS  TYPE   DATA
www.example.com.  3600  IN     A      93.184.216.34
```
`IN` = Internet class (praktis satu-satunya yang dipakai).

### Record yang wajib dikuasai

| Type | Fungsi | Contoh |
|---|---|---|
| **A** | Nama → alamat IPv4 | `www  IN A  93.184.216.34` |
| **AAAA** | Nama → alamat IPv6 | `www  IN AAAA  2606:2800:220:1:248:1893:25c8:1946` |
| **CNAME** | Alias ke nama lain | `blog  IN CNAME  www.example.com.` |
| **MX** | Mail exchanger (+ priority) | `@  IN MX 10  mail.example.com.` |
| **NS** | Name server otoritatif untuk zona | `@  IN NS  ns1.example.com.` |
| **PTR** | IP → nama (reverse DNS) | `34.216.184.93.in-addr.arpa. IN PTR www.example.com.` |
| **SOA** | Start of Authority — metadata zona | lihat di bawah |
| **TXT** | Teks bebas (SPF, DKIM, verifikasi domain) | `@  IN TXT  "v=spf1 mx -all"` |
| **SRV** | Lokasi layanan (protokol, port, prioritas) | `_sip._tcp  IN SRV 10 60 5060 sipserver.example.com.` |
| **CAA** | CA mana yang boleh menerbitkan sertifikat | `@  IN CAA 0 issue "letsencrypt.org"` |
| **DNSKEY/DS/RRSIG/NSEC** | DNSSEC | — |
| **SVCB/HTTPS** | Parameter layanan (ALPN, ECH, IP hint) | `@  IN HTTPS 1 . alpn="h3,h2"` |

### SOA — Start of Authority

```
example.com.  3600  IN  SOA  ns1.example.com. admin.example.com. (
                          2026091001  ; Serial
                          7200        ; Refresh
                          3600        ; Retry
                          1209600     ; Expire
                          300 )       ; Minimum (negative caching TTL)
```

| Field | Arti |
|---|---|
| **MNAME** | Primary name server |
| **RNAME** | Email admin (`@` diganti `.` → `admin@example.com`) |
| **Serial** | Nomor versi zona. **Harus naik setiap perubahan** |
| **Refresh** | Seberapa sering secondary memeriksa serial primary |
| **Retry** | Jika refresh gagal, coba lagi setelah ini |
| **Expire** | Setelah sekian lama tanpa kontak, secondary berhenti melayani zona |
| **Minimum** | TTL untuk negative caching (NXDOMAIN) |

⚠️ **Serial yang tidak dinaikkan adalah kesalahan paling umum** saat mengelola zona manual. Secondary tidak akan menarik perubahan. Konvensi: `YYYYMMDDNN` (mis. `2026091001`).

### Aturan CNAME yang sering dilanggar

⚠️ **1. CNAME tidak boleh berdampingan dengan record lain untuk nama yang sama.**
```
❌ SALAH:
   blog  IN CNAME  www.example.com.
   blog  IN TXT    "verifikasi"     ← KONFLIK

✅ BENAR: pilih salah satu
```

⚠️ **2. CNAME tidak boleh di apex zona (`example.com` itu sendiri).**
```
❌ example.com.  IN CNAME  target.cdn.net.
```
Karena apex **wajib** punya record SOA dan NS, sementara CNAME melarang record lain berdampingan.

**Solusi:** banyak penyedia DNS menawarkan **ALIAS**, **ANAME**, atau **CNAME flattening** — record proprietary yang berperilaku seperti CNAME di apex tetapi diselesaikan di sisi server menjadi A/AAAA.

⚠️ **3. Rantai CNAME memperlambat resolusi.** Setiap hop adalah lookup tambahan. Batasi maksimal satu tingkat.

### Reverse DNS (PTR)

```
IPv4: 93.184.216.34
  → dibalik → 34.216.184.93.in-addr.arpa

IPv6: 2001:db8::1
  → setiap nibble dibalik → 1.0.0.0.....8.b.d.0.1.0.0.2.ip6.arpa
```

**Kegunaan PTR:**
- **Reputasi email** — banyak server mail menolak koneksi dari IP tanpa PTR yang cocok (forward-confirmed reverse DNS)
- Logging dan audit yang mudah dibaca
- Beberapa layanan memverifikasinya

⚠️ **PTR dikelola oleh pemilik blok IP** (ISP/RIR), bukan pemilik domain. Untuk mengubahnya, Anda harus meminta ke ISP — kecuali Anda memiliki blok IP sendiri.

---

## 6. Zone Transfer

Cara secondary (slave) menyalin zona dari primary (master).

| | **AXFR** | **IXFR** |
|---|---|---|
| Isi | Seluruh zona | Hanya perubahan sejak serial tertentu |
| Efisiensi | Rendah untuk zona besar | Tinggi |
| Protokol | **TCP 53** | TCP 53 |

**Alur:**
```
1. Primary berubah → serial naik
2. Primary mengirim NOTIFY ke secondary
3. Secondary query SOA ke primary
4. Serial primary > serial lokal? → minta AXFR/IXFR
5. Secondary memperbarui zona
```

⚠️ **Zone transfer HARUS dibatasi.** Zona yang bisa di-transfer siapa saja membocorkan seluruh peta jaringan internal Anda kepada penyerang.

```
# BIND
allow-transfer { 192.0.2.53; key transfer-key; };

# Uji apakah zona Anda terekspos (lakukan hanya pada domain Anda sendiri)
$ dig @ns1.example.com example.com AXFR
```

Amankan dengan **TSIG** (shared secret) atau ACL berbasis IP.

---

## 7. DNSSEC

DNS asli tidak punya autentikasi — jawaban apa pun yang tiba dianggap benar. Ini memungkinkan **cache poisoning**.

**DNSSEC** menambahkan tanda tangan digital sehingga resolver bisa memverifikasi bahwa jawaban benar-benar berasal dari pemilik zona dan tidak diubah.

### Record DNSSEC

| Record | Fungsi |
|---|---|
| **DNSKEY** | Kunci publik zona (ZSK untuk record, KSK untuk menandatangani ZSK) |
| **RRSIG** | Tanda tangan untuk satu set record |
| **DS** (*Delegation Signer*) | Hash dari DNSKEY anak, **disimpan di zona induk** — inilah yang membentuk rantai |
| **NSEC / NSEC3** | Membuktikan bahwa sebuah nama **tidak ada** (authenticated denial) |

### Chain of Trust

```
Root zone (.)          ← trust anchor, kuncinya dikenal semua resolver
  │ menandatangani DS untuk .com
  ▼
.com                   ← DNSKEY-nya diverifikasi dengan DS di root
  │ menandatangani DS untuk example.com
  ▼
example.com            ← DNSKEY-nya diverifikasi dengan DS di .com
  │ menandatangani RRSIG untuk semua record-nya
  ▼
www.example.com A 93.184.216.34   ← TERVERIFIKASI ✅
```

⚠️ **DNSSEC hanya menjamin integritas dan autentisitas, BUKAN kerahasiaan.** Query dan jawaban tetap dikirim dalam plaintext. Untuk privasi, butuh DoT/DoH/DoQ.

⚠️ **DNSSEC menaikkan risiko operasional.** Kunci yang kedaluwarsa atau DS yang tidak sinkron akan membuat domain **hilang total** dari internet — bukan sekadar "peringatan". Otomasi rollover kunci sangat penting.

```bash
$ dig +dnssec example.com
$ dig +trace +dnssec example.com
$ delv example.com          # validasi DNSSEC dengan penjelasan
```

---

## 8. DNS Terenkripsi

DNS tradisional dikirim **plaintext** di UDP/TCP 53 — siapa pun di jalur bisa melihat dan memodifikasinya.

| Protokol | Port | Transport | Catatan |
|---|---|---|---|
| **Do53** | 53 | UDP/TCP | Tradisional, tanpa enkripsi |
| **DoT** (DNS over TLS) | **853** | TCP+TLS | Port khusus → mudah diidentifikasi & diblokir/diizinkan |
| **DoH** (DNS over HTTPS) | **443** | HTTPS | Menyatu dengan trafik web → sulit dibedakan |
| **DoQ** (DNS over QUIC) | **853** | QUIC | Latency lebih rendah |
| **ODoH** (Oblivious DoH) | 443 | HTTPS + proxy | Resolver tidak tahu siapa yang bertanya |

### Implikasi operasional

⚠️ **DoH menimbulkan tantangan nyata bagi jaringan perusahaan:**
- Browser bisa memakai DoH **sendiri**, mengabaikan setelan DNS jaringan
- Kebijakan filtering berbasis DNS (parental control, blokir malware) **dilewati**
- Split-horizon DNS internal tidak berfungsi → nama internal tidak resolve
- Visibilitas keamanan (deteksi C2 lewat DNS) hilang

**Mitigasi umum:**
```
1. Blokir resolver DoH publik yang dikenal (daftar IP)
2. Gunakan "canary domain" — use-application-dns.net
   → jika NXDOMAIN, Firefox otomatis menonaktifkan DoH
3. Terapkan kebijakan via Group Policy / MDM di browser
4. Sediakan DoH internal sendiri, sehingga enkripsi tetap ada
   tetapi kendali tetap di organisasi
```

---

## 9. `dig` — Alat Diagnostik DNS Utama

```bash
# Query dasar
$ dig example.com

# Ringkas
$ dig +short example.com
93.184.216.34

# Tipe record tertentu
$ dig example.com MX
$ dig example.com NS
$ dig example.com TXT
$ dig example.com AAAA
$ dig example.com SOA
$ dig example.com CAA

# Tanya server tertentu
$ dig @8.8.8.8 example.com
$ dig @ns1.example.com example.com

# LACAK seluruh jalur dari root — SANGAT BERGUNA
$ dig +trace example.com

# Jangan pakai rekursi — lihat apa yang diketahui server ini sendiri
$ dig +norecurse @8.8.8.8 example.com

# Reverse lookup
$ dig -x 93.184.216.34

# DNSSEC
$ dig +dnssec example.com
$ delv example.com

# Semua record (sering ditolak server modern)
$ dig example.com ANY

# Zone transfer (hanya domain Anda sendiri!)
$ dig @ns1.example.com example.com AXFR

# Ukur waktu resolusi
$ dig example.com | grep "Query time"
```

### Membaca output `dig`

```
; <<>> DiG 9.18.1 <<>> example.com
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 12345
;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; QUESTION SECTION:
;example.com.			IN	A

;; ANSWER SECTION:
example.com.		3600	IN	A	93.184.216.34

;; Query time: 23 msec
;; SERVER: 1.1.1.1#53(1.1.1.1)
;; WHEN: Thu Sep 10 14:22:01 WIB 2026
;; MSG SIZE  rcvd: 56
```

**Status code:**
| Status | Arti |
|---|---|
| `NOERROR` | Berhasil (walau ANSWER bisa 0 = nama ada tetapi tipe record itu tidak ada) |
| `NXDOMAIN` | **Nama tidak ada sama sekali** |
| `SERVFAIL` | Server gagal — sering karena **DNSSEC gagal validasi**, atau upstream tidak menjawab |
| `REFUSED` | Server menolak menjawab (biasanya bukan otoritatif & tidak mengizinkan rekursi dari Anda) |
| `NOTIMP` | Tipe query tidak didukung |

**Flags:**
| Flag | Arti |
|---|---|
| `qr` | Ini adalah **response** (bukan query) |
| `aa` | **Authoritative answer** — dari server otoritatif |
| `rd` | **Recursion desired** — klien meminta rekursi |
| `ra` | **Recursion available** — server menyediakan rekursi |
| `ad` | **Authenticated data** — tervalidasi DNSSEC |
| `tc` | **Truncated** — jawaban terpotong, harus diulang lewat TCP |

⚠️ **`SERVFAIL` yang paling sering** disebabkan kegagalan validasi DNSSEC. Uji dengan `dig +cd` (checking disabled) — kalau berhasil dengan `+cd`, masalahnya di DNSSEC.

---

## 10. Membangun DNS Resolver Sendiri

### Unbound (validating recursive resolver — direkomendasikan)

```bash
$ sudo apt install unbound        # atau: dnf install unbound
```

`/etc/unbound/unbound.conf`:
```yaml
server:
    interface: 0.0.0.0
    interface: ::0
    port: 53

    # Siapa yang boleh bertanya — WAJIB dibatasi!
    access-control: 127.0.0.0/8 allow
    access-control: 192.168.0.0/16 allow
    access-control: 10.0.0.0/8 allow
    access-control: 0.0.0.0/0 refuse       # tolak sisanya

    # Keamanan
    hide-identity: yes
    hide-version: yes
    harden-glue: yes
    harden-dnssec-stripped: yes
    harden-below-nxdomain: yes
    harden-referral-path: yes
    use-caps-for-id: yes                   # 0x20 encoding, anti-spoofing
    qname-minimisation: yes                # privasi: kirim label minimum

    # DNSSEC
    auto-trust-anchor-file: "/var/lib/unbound/root.key"

    # Kinerja
    num-threads: 4
    msg-cache-size: 128m
    rrset-cache-size: 256m
    cache-min-ttl: 60
    cache-max-ttl: 86400
    prefetch: yes                          # perbarui cache sebelum kedaluwarsa
    prefetch-key: yes
    serve-expired: yes                     # sajikan data basi jika upstream mati

    # Jangan resolve alamat privat dari internet (anti rebinding)
    private-address: 10.0.0.0/8
    private-address: 172.16.0.0/12
    private-address: 192.168.0.0/16
    private-address: 169.254.0.0/16
    private-address: fd00::/8
    private-address: fe80::/10

    # Zona internal
    private-domain: "perusahaan.local"
    local-zone: "perusahaan.local." transparent

    logfile: "/var/log/unbound.log"
    verbosity: 1

# Teruskan zona internal ke DNS internal (mis. Active Directory)
forward-zone:
    name: "perusahaan.local"
    forward-addr: 192.168.1.10
```

```bash
$ sudo unbound-checkconf
$ sudo systemctl enable --now unbound
$ dig @127.0.0.1 example.com
$ sudo unbound-control stats_noreset | head -20
```

### dnsmasq (ringan, untuk SOHO/lab)

`/etc/dnsmasq.conf`:
```
# Antarmuka
interface=eth0
bind-interfaces
listen-address=127.0.0.1,192.168.1.1

# Upstream
no-resolv
server=1.1.1.1
server=8.8.8.8
# Zona internal ke server tertentu
server=/perusahaan.local/192.168.1.10

# Cache
cache-size=10000

# Keamanan
domain-needed          # jangan teruskan nama tanpa domain
bogus-priv             # jangan teruskan reverse lookup untuk alamat privat
stop-dns-rebind
rebind-localhost-ok

# Record lokal
address=/nas.rumah.lan/192.168.1.100
local=/rumah.lan/
domain=rumah.lan
expand-hosts

# DHCP (opsional — dnsmasq bisa keduanya)
dhcp-range=192.168.1.100,192.168.1.200,12h
dhcp-option=option:router,192.168.1.1
dhcp-option=option:dns-server,192.168.1.1
```

### BIND9 (authoritative server)

`/etc/bind/named.conf.local`:
```
zone "example.com" {
    type master;
    file "/etc/bind/zones/db.example.com";
    allow-transfer { 192.0.2.53; };
    notify yes;
};
```

`/etc/bind/zones/db.example.com`:
```
$TTL 3600
@   IN  SOA ns1.example.com. admin.example.com. (
            2026091001  ; Serial — NAIKKAN setiap perubahan!
            7200        ; Refresh
            3600        ; Retry
            1209600     ; Expire
            300 )       ; Minimum

    IN  NS      ns1.example.com.
    IN  NS      ns2.example.com.
    IN  MX  10  mail.example.com.
    IN  A       93.184.216.34
    IN  TXT     "v=spf1 mx -all"
    IN  CAA 0   issue "letsencrypt.org"

ns1     IN  A       93.184.216.5
ns2     IN  A       93.184.216.6
www     IN  A       93.184.216.34
www     IN  AAAA    2606:2800:220:1:248:1893:25c8:1946
mail    IN  A       93.184.216.40
blog    IN  CNAME   www.example.com.

_dmarc  IN  TXT     "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"
```

```bash
$ sudo named-checkconf
$ sudo named-checkzone example.com /etc/bind/zones/db.example.com
$ sudo systemctl reload bind9
```

---

## 11. Pola DNS Lanjutan

### Split-Horizon (Split-Brain) DNS

Jawaban berbeda tergantung siapa yang bertanya.

```
Klien internal  → www.perusahaan.com = 192.168.1.50  (alamat internal)
Klien eksternal → www.perusahaan.com = 203.0.113.50  (alamat publik)
```

Kegunaan: menghindari hairpin NAT, menyembunyikan topologi internal, mempercepat akses internal.

⚠️ Tantangannya: klien VPN dan perangkat yang memakai DoH bisa mendapat jawaban yang salah.

### GeoDNS

Jawaban berbeda berdasarkan lokasi geografis penanya. Dipakai CDN untuk mengarahkan pengguna ke edge terdekat.

⚠️ Tidak selalu akurat karena resolver mungkin jauh dari pengguna. **EDNS Client Subnet (ECS)** mengirimkan sebagian prefix klien untuk memperbaiki akurasi — dengan biaya privasi.

### DNS Load Balancing (Round Robin)

```
www  IN  A  192.0.2.1
www  IN  A  192.0.2.2
www  IN  A  192.0.2.3
```
Server merotasi urutan jawaban.

⚠️ **Bukan load balancer sungguhan:** tidak ada health check (server mati tetap diberikan), cache memengaruhi distribusi, dan klien bisa memilih sendiri. Gunakan load balancer atau anycast untuk kebutuhan serius.

### Anycast DNS

Alamat IP resolver yang sama diumumkan lewat BGP dari banyak lokasi. Inilah cara 1.1.1.1 dan 8.8.8.8 bekerja, dan cara root server bertahan.

---

## 12. Troubleshooting DNS

### Alur diagnosis

```
1. Apakah ini benar-benar masalah DNS?
   $ ping 8.8.8.8              → berhasil?
   $ ping google.com           → gagal?
   → Ya, masalah DNS

2. Server DNS apa yang dipakai?
   $ cat /etc/resolv.conf
   $ resolvectl status                 (systemd-resolved)
   PS> Get-DnsClientServerAddress      (Windows)

3. Bisakah server DNS itu dijangkau?
   $ dig @<server-dns> example.com
   $ nc -zvu <server-dns> 53

4. Apakah masalahnya di resolver atau di zona?
   $ dig @1.1.1.1 example.com          # resolver publik
   $ dig @8.8.8.8 example.com          # resolver publik lain
   → berhasil di publik, gagal di internal = masalah resolver internal
   → gagal di semua = masalah zona/authoritative

5. Lacak dari root
   $ dig +trace example.com
   → lihat di titik mana rantai putus

6. Periksa authoritative langsung
   $ dig example.com NS +short
   $ dig @ns1.example.com example.com

7. Periksa DNSSEC
   $ dig +cd example.com               # checking disabled
   → berhasil dengan +cd = masalah validasi DNSSEC
```

### Masalah umum dan penyebabnya

| Gejala | Kemungkinan penyebab |
|---|---|
| `NXDOMAIN` untuk nama yang seharusnya ada | Salah ketik; record belum dibuat; zona salah; search domain menambah suffix |
| `SERVFAIL` | **Validasi DNSSEC gagal**; upstream tidak menjawab; zona rusak |
| `REFUSED` | Server bukan otoritatif dan tidak mengizinkan rekursi dari IP Anda |
| Resolusi lambat (>1 detik) | Upstream lambat; rekursi penuh tanpa cache; IPv6 timeout |
| Jawaban lama setelah perubahan | **TTL cache** belum kedaluwarsa |
| Beberapa klien bisa, sebagian tidak | Cache berbeda; split-horizon; DoH di browser |
| Nama internal tidak resolve dari VPN | Split-horizon; search domain; DNS server VPN salah |
| Record baru tidak muncul di secondary | **Serial SOA tidak dinaikkan** |
| Email masuk ke spam | SPF/DKIM/DMARC salah; PTR tidak cocok |

### Membersihkan cache

```bash
# Linux (systemd-resolved)
$ sudo resolvectl flush-caches
$ resolvectl statistics

# Linux (nscd)
$ sudo systemctl restart nscd

# Unbound
$ sudo unbound-control flush example.com
$ sudo unbound-control flush_zone example.com
$ sudo unbound-control reload

# dnsmasq
$ sudo systemctl restart dnsmasq

# macOS
$ sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Windows
PS> Clear-DnsClientCache
PS> ipconfig /flushdns
PS> Get-DnsClientCache

# Browser (Chrome)
chrome://net-internals/#dns
```

---

## MikroTik RouterOS

```
# DNS client + caching resolver
/ip dns set servers=1.1.1.1,8.8.8.8 allow-remote-requests=yes \
    cache-size=4096KiB cache-max-ttl=1d max-concurrent-queries=100

# Lihat cache
/ip dns cache print
/ip dns cache all print
/ip dns cache flush

# Static DNS (setara /etc/hosts, tetapi untuk seluruh jaringan)
/ip dns static add name=nas.rumah.lan address=192.168.1.100
/ip dns static add name=router.lan address=192.168.1.1

# Wildcard / regex — untuk memblokir domain (ad-blocking)
/ip dns static add regexp=".*doubleclick\\.net" address=0.0.0.0
/ip dns static add regexp=".*\\.ads\\..*" address=0.0.0.0

# DNS over HTTPS (RouterOS v7)
/ip dns set use-doh-server=https://cloudflare-dns.com/dns-query verify-doh-cert=yes
/certificate import file-name=cloudflare-ca.pem
```

⚠️ **`allow-remote-requests=yes` membuat router menjadi DNS resolver terbuka.** Kalau interface WAN tidak difilter, router Anda akan dipakai untuk **DNS amplification attack**. **Selalu blokir UDP/TCP 53 dari WAN:**

```
/ip firewall filter add chain=input in-interface-list=WAN protocol=udp dst-port=53 action=drop
/ip firewall filter add chain=input in-interface-list=WAN protocol=tcp dst-port=53 action=drop
```

💡 **Memaksa semua klien memakai DNS router** (mencegah bypass dengan DNS publik):
```
/ip firewall nat add chain=dstnat in-interface-list=LAN protocol=udp dst-port=53 \
    action=redirect to-ports=53 comment="Paksa DNS ke router"
/ip firewall nat add chain=dstnat in-interface-list=LAN protocol=tcp dst-port=53 \
    action=redirect to-ports=53
```
Ini teknik umum di hotspot dan jaringan sekolah untuk menegakkan filtering DNS.

⚠️ Teknik ini **tidak menghentikan DoH** — browser yang memakai DNS over HTTPS akan melewatinya. Untuk itu perlu memblokir IP resolver DoH yang dikenal.

### Address list dinamis dari DNS

```
# Buat address-list yang otomatis diisi dari resolusi DNS
/ip firewall address-list add list=SOSMED address=facebook.com
   ← RouterOS otomatis me-resolve dan memperbarui alamatnya
```

💡 Fitur ini sangat berguna untuk memblokir atau memprioritaskan layanan berdasarkan **nama domain**, bukan IP — yang berubah-ubah pada layanan besar.

### Padanan istilah

| Cisco / Linux | MikroTik |
|---|---|
| `ip name-server 1.1.1.1` | `/ip dns set servers=1.1.1.1` |
| `ip dns server` | `/ip dns set allow-remote-requests=yes` |
| `/etc/hosts` | `/ip dns static` |
| `dig`/`nslookup` | `/put [:resolve example.com]` |
| Pi-hole (ad blocking) | `/ip dns static` dengan `regexp=` |

---

## 13. Ringkasan

- DNS adalah basis data **terdistribusi & hierarkis** dengan **delegasi otoritas**: root → TLD → authoritative.
- **Rekursif** (klien→resolver, "carikan") vs **iteratif** (resolver→root/TLD, "beri tahu apa yang kamu tahu"). Root/TLD **tidak** melakukan rekursi.
- Cache dikendalikan **TTL**; negative caching memakai field `minimum` SOA. Turunkan TTL **sebelum** migrasi.
- Record inti: **A, AAAA, CNAME, MX, NS, PTR, SOA, TXT, SRV, CAA**.
- **CNAME tidak boleh berdampingan record lain**, dan tidak boleh di apex → gunakan ALIAS/ANAME.
- **Serial SOA harus dinaikkan** setiap perubahan, atau secondary tidak menarik data baru.
- Zone transfer (AXFR/IXFR) lewat **TCP 53**; **wajib dibatasi** dengan TSIG/ACL.
- **DNSSEC** memberi integritas & autentisitas (bukan kerahasiaan); kunci kedaluwarsa = domain hilang total.
- **DoT (853)**, **DoH (443)**, **DoQ** memberi kerahasiaan; DoH menyulitkan kontrol jaringan perusahaan.
- `dig +trace`, `dig +short`, `dig @server`, `dig +cd` adalah alat diagnostik utama.
- **`SERVFAIL` sering berarti DNSSEC gagal** — uji dengan `+cd`.
- Bangun resolver dengan **Unbound** (validating recursive) atau **dnsmasq** (ringan); **BIND9** untuk authoritative.

---

## 14. Latihan

1. Jelaskan urutan lengkap resolusi `www.example.co.id` dari cache kosong.
2. Kenapa CNAME tidak boleh dipakai di apex zona? Apa solusinya?
3. Anda mengubah A record tetapi sebagian pengguna masih mendapat IP lama. Kenapa dan apa yang harus dilakukan sebelum perubahan berikutnya?
4. `dig example.com` mengembalikan `SERVFAIL`. Sebutkan tiga kemungkinan penyebab dan cara membedakannya.
5. Kenapa root server hanya ada 13 nama padahal internet sebesar ini?
6. Apa perbedaan DNSSEC dan DoH? Apakah salah satu menggantikan yang lain?
7. Perusahaan Anda memakai split-horizon DNS. Pengguna yang mengaktifkan DoH di browser melapor tidak bisa mengakses aplikasi internal. Jelaskan dan berikan solusi.
8. Anda menambahkan record baru di primary tetapi secondary tidak menampilkannya. Apa yang paling mungkin terlupa?

<details>
<summary>Jawaban</summary>

1. (a) Browser cek cache internalnya; (b) OS cek cache dan `/etc/hosts`; (c) stub resolver mengirim query **rekursif** ke recursive resolver; (d) resolver cek cache — kosong; (e) resolver query **iteratif** ke **root** → root membalas referral ke server `.id`; (f) resolver query ke server `.id` → referral ke server `.co.id`; (g) query ke `.co.id` → referral ke authoritative `example.co.id`; (h) query ke authoritative → jawaban `A` dengan TTL; (i) resolver menyimpan di cache selama TTL dan mengembalikan jawaban ke klien.

2. Karena apex zona **wajib** memiliki record **SOA** dan **NS**, sedangkan aturan DNS melarang CNAME berdampingan dengan record lain untuk nama yang sama. Solusi: gunakan record proprietary **ALIAS / ANAME** atau fitur **CNAME flattening** yang ditawarkan banyak penyedia DNS — record ini berperilaku seperti CNAME bagi pengguna tetapi diselesaikan di sisi server menjadi A/AAAA sehingga tidak melanggar standar. Alternatif: pakai A/AAAA statis, atau layanan yang memberi alamat anycast tetap.

3. Karena **TTL** — resolver di seluruh dunia masih menyimpan jawaban lama di cache sampai TTL-nya habis. Tidak ada cara memaksa mereka membuangnya.
   **Sebelum perubahan berikutnya:** turunkan TTL record itu ke nilai kecil (mis. 300 detik) **beberapa hari sebelumnya** — cukup lama agar TTL lama yang panjang sudah kedaluwarsa di semua cache. Lakukan perubahan, verifikasi propagasinya, lalu naikkan TTL kembali ke nilai normal.

4. (a) **Validasi DNSSEC gagal** (tanda tangan kedaluwarsa, DS tidak sinkron) — uji dengan `dig +cd example.com`; kalau berhasil dengan `+cd`, inilah penyebabnya. (b) **Server otoritatif tidak menjawab** — uji dengan `dig +trace` untuk melihat di mana rantai putus, dan query langsung ke NS-nya. (c) **Masalah pada resolver itu sendiri** (upstream mati, konfigurasi rusak) — uji dengan resolver lain (`dig @1.1.1.1`); kalau resolver lain berhasil, masalahnya lokal. (d) Zona rusak atau melebihi batas (mis. rantai CNAME terlalu panjang).

5. Batas 13 berasal dari ukuran maksimum respons DNS **512 byte** pada UDP (sebelum EDNS0) — 13 nama server beserta alamatnya adalah jumlah terbanyak yang muat dalam satu paket priming response. Namun 13 itu adalah **nama**, bukan mesin: setiap nama diumumkan lewat **anycast** dari ratusan lokasi di seluruh dunia (total lebih dari 1.500 instance), sehingga kapasitas dan ketahanannya sangat besar. Pengguna selalu mencapai instance terdekat secara topologis.

6. **DNSSEC** memberi **integritas dan autentisitas**: memastikan jawaban benar-benar berasal dari pemilik zona dan tidak diubah di jalan. Ia **tidak mengenkripsi** — siapa pun di jalur tetap bisa membaca query dan jawabannya.
   **DoH/DoT** memberi **kerahasiaan dan integritas transport**: mengenkripsi jalur antara klien dan resolver sehingga penyadap tidak tahu apa yang Anda tanyakan. Ia **tidak memverifikasi** bahwa data zona itu asli — resolver yang jahat tetap bisa berbohong.
   Keduanya **saling melengkapi, bukan menggantikan**: DoH melindungi jalur klien→resolver; DNSSEC melindungi keaslian data dari zona sampai resolver. Konfigurasi terbaik memakai keduanya.

7. **Penyebab:** DoH di browser mengabaikan setelan DNS sistem dan mengirim query langsung ke resolver publik (mis. Cloudflare/Google). Resolver publik tidak mengetahui zona internal perusahaan, sehingga nama aplikasi internal mengembalikan NXDOMAIN atau alamat publik yang salah (pada split-horizon).
   **Solusi:** (a) sediakan **canary domain** — pastikan `use-application-dns.net` mengembalikan NXDOMAIN dari resolver perusahaan; Firefox akan otomatis menonaktifkan DoH; (b) terapkan kebijakan lewat **Group Policy/MDM** untuk menonaktifkan DoH di browser terkelola, atau mengarahkannya ke resolver DoH internal; (c) jalankan **DoH server internal** sendiri dan konfigurasikan browser memakainya — enkripsi tetap ada, kendali tetap di organisasi; (d) blokir IP resolver DoH publik yang dikenal di firewall (efektif tetapi memerlukan pemeliharaan daftar).

8. **Serial number di record SOA tidak dinaikkan.** Secondary memeriksa serial primary; jika serialnya tidak berubah, secondary menyimpulkan zona tidak berubah dan tidak menarik data baru. Perbaikan: naikkan serial (konvensi `YYYYMMDDNN`), reload zona, dan verifikasi dengan `dig @secondary example.com SOA`. Kemungkinan lain: NOTIFY tidak terkirim/diblokir, `allow-transfer` tidak mengizinkan IP secondary, atau zone transfer diblokir firewall di TCP 53.

</details>

---

## 15. Sumber

- RFC 1034 & 1035 — Domain Names: Concepts, Facilities, Implementation
- RFC 9499 — DNS Terminology (menggantikan RFC 8499)
- RFC 2308 — Negative Caching of DNS Queries
- RFC 4033/4034/4035 — DNSSEC
- RFC 7858 — DNS over TLS · RFC 8484 — DNS over HTTPS · RFC 9250 — DNS over QUIC
- RFC 7816 — QNAME Minimisation
- Cisco CCNA 200-301 v1.1, topik 4.3 (peran DHCP dan DNS)
- Unbound — https://nlnetlabs.nl/documentation/unbound/
- BIND 9 ARM — https://bind9.readthedocs.io/

---

**Berikutnya:** `06-aplikasi/02-dhcp.md` — bagaimana perangkat mendapat alamat secara otomatis.

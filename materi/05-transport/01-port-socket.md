# 05.1 — Port dan Socket

> **Prasyarat:** `04-network-layer/05`
> **Tujuan:** Anda paham bagaimana banyak aplikasi berbagi satu alamat IP, hafal port penting, dan bisa membaca output `ss`/`netstat` dengan tepat.

---

## 1. Masalah yang Dipecahkan Layer 4

IP mengantar paket ke **komputer** yang benar. Tetapi satu komputer menjalankan puluhan aplikasi jaringan sekaligus:

```
Laptop Anda (192.168.1.50) saat ini menjalankan:
  - Browser dengan 12 tab
  - Klien email
  - Spotify
  - Aplikasi chat
  - Update sistem operasi
  - Klien SSH

Semua paket masuk memiliki IP tujuan yang SAMA: 192.168.1.50
→ Bagaimana OS tahu paket ini untuk aplikasi yang mana?
```

Jawabannya: **port number**.

```
Analogi pos:
  IP address = alamat gedung apartemen
  Port       = nomor unit apartemen
```

---

## 2. Port Number

- **16 bit** → rentang **0–65535**
- Ada di header TCP maupun UDP: **port sumber** dan **port tujuan**
- Port TCP 80 dan port UDP 80 adalah **dua hal berbeda**

### Pembagian rentang (IANA)

| Rentang | Nama | Keterangan |
|---|---|---|
| **0–1023** | **Well-known / System ports** | Layanan standar. Di Unix butuh **root** untuk listening |
| **1024–49151** | **Registered ports** | Didaftarkan ke IANA oleh vendor aplikasi |
| **49152–65535** | **Dynamic / Ephemeral / Private** | Dipakai klien sebagai port sumber sementara |

⚠️ Rentang ephemeral aktual berbeda per OS:
```bash
# Linux (default 32768–60999)
$ cat /proc/sys/net/ipv4/ip_local_port_range
32768	60999

# Windows: 49152–65535
# macOS: 49152–65535
```

---

## 3. Socket dan 5-Tuple

**Socket** = kombinasi **IP + port + protokol**. Ini titik akhir komunikasi.

Sebuah **koneksi** diidentifikasi secara unik oleh **5-tuple**:

```
┌────────────┬──────────────┬───────────┬─────────────┬──────────┐
│  Protokol  │  IP sumber   │port sumber│  IP tujuan  │port tujuan│
├────────────┼──────────────┼───────────┼─────────────┼──────────┤
│    TCP     │ 192.168.1.50 │   51234   │  93.184.216.34 │   443   │
└────────────┴──────────────┴───────────┴─────────────┴──────────┘
```

**Karena inilah** Anda bisa membuka 10 tab ke situs yang sama:
```
TCP 192.168.1.50:51234 → 93.184.216.34:443    tab 1
TCP 192.168.1.50:51235 → 93.184.216.34:443    tab 2
TCP 192.168.1.50:51236 → 93.184.216.34:443    tab 3
     └── port SUMBER berbeda → koneksi berbeda
```

Dan **karena inilah** satu server bisa melayani ribuan klien di port 443 yang sama:
```
TCP 203.0.113.5:443 ← 1.2.3.4:51234
TCP 203.0.113.5:443 ← 1.2.3.4:51235      klien sama, port beda
TCP 203.0.113.5:443 ← 5.6.7.8:60001      klien beda
```

### Multiplexing dan Demultiplexing

- **Multiplexing** (di pengirim) — mengumpulkan data dari banyak aplikasi, menambahkan port, mengirim lewat satu koneksi IP.
- **Demultiplexing** (di penerima) — membaca port tujuan, menyerahkan data ke aplikasi yang tepat.

---

## 4. Bagaimana Klien Memilih Port Sumber

```
1. Aplikasi memanggil connect() tanpa menyebut port sumber
2. OS memilih port acak dari rentang ephemeral (mis. 51234)
3. OS memastikan 5-tuple ini belum dipakai
4. Koneksi dibuat
5. Saat koneksi ditutup, port dikembalikan ke pool
```

⚠️ **Port ephemeral bisa habis.** Server proxy atau load balancer yang membuat ribuan koneksi keluar ke satu backend bisa kehabisan:
```
Backend tunggal 10.0.0.5:8080
Port ephemeral tersedia: 32768–60999 = 28.232
→ maksimum ~28.000 koneksi bersamaan ke backend itu

Ditambah TIME_WAIT yang menahan port selama 60 detik
→ batas praktis jauh lebih rendah
```

Gejala: `Cannot assign requested address` atau `EADDRNOTAVAIL`.

Mitigasi:
```bash
# Perluas rentang ephemeral
$ sudo sysctl -w net.ipv4.ip_local_port_range="10000 65535"

# Izinkan reuse socket TIME_WAIT untuk koneksi keluar
$ sudo sysctl -w net.ipv4.tcp_tw_reuse=1

# Tambah IP sumber (memperbanyak 5-tuple yang tersedia)
# Tambah port tujuan backend (mis. backend listening di 8080-8090)
```

---

## 5. Daftar Port yang Wajib Hafal

Ini yang muncul di ujian dan Anda pakai setiap hari.

### Yang paling penting

| Port | Protokol | Layanan |
|---|---|---|
| **20/21** | TCP | **FTP** (20=data, 21=kontrol) |
| **22** | TCP | **SSH**, SCP, SFTP |
| **23** | TCP | **Telnet** (jangan dipakai!) |
| **25** | TCP | **SMTP** (pengiriman email antar-server) |
| **53** | **TCP & UDP** | **DNS** |
| **67/68** | UDP | **DHCP** (67=server, 68=klien) |
| **69** | UDP | **TFTP** |
| **80** | TCP | **HTTP** |
| **110** | TCP | POP3 |
| **123** | UDP | **NTP** |
| **143** | TCP | IMAP |
| **161/162** | UDP | **SNMP** (161=query, 162=trap) |
| **179** | TCP | **BGP** |
| **389** | TCP/UDP | LDAP |
| **443** | TCP **& UDP** | **HTTPS** (UDP untuk **QUIC/HTTP3**) |
| **445** | TCP | SMB / CIFS |
| **500** | UDP | **IKE** (IPsec) |
| **514** | UDP | **Syslog** |
| **520** | UDP | RIP |
| **587** | TCP | SMTP submission (klien → server) |
| **636** | TCP | LDAPS |
| **993** | TCP | IMAPS |
| **995** | TCP | POP3S |
| **1812/1813** | UDP | **RADIUS** (auth/accounting) |
| **49** | TCP | **TACACS+** |
| **3306** | TCP | MySQL / MariaDB |
| **3389** | TCP | **RDP** |
| **5432** | TCP | PostgreSQL |
| **6379** | TCP | Redis |
| **8080** | TCP | HTTP alternatif / proxy |
| **4789** | UDP | **VXLAN** |
| **51820** | UDP | WireGuard |

### Cara menghafal yang efektif

Kelompokkan berdasarkan tema:

```
WEB     : 80 (HTTP), 443 (HTTPS/QUIC), 8080 (alt)
EMAIL   : 25 (SMTP), 110 (POP3), 143 (IMAP)
        + versi aman: 465/587 (SMTP), 995 (POP3S), 993 (IMAPS)
        → pola: versi aman biasanya port berbeda, sering 9xx
REMOTE  : 22 (SSH), 23 (Telnet), 3389 (RDP), 5900 (VNC)
TRANSFER: 20/21 (FTP), 22 (SFTP), 69 (TFTP), 445 (SMB), 2049 (NFS)
INFRA   : 53 (DNS), 67/68 (DHCP), 123 (NTP), 161/162 (SNMP), 514 (Syslog)
AAA     : 49 (TACACS+), 1812/1813 (RADIUS), 389/636 (LDAP)
ROUTING : 179 (BGP TCP), 520 (RIP UDP)
VPN     : 500/4500 (IPsec IKE/NAT-T), 1194 (OpenVPN), 51820 (WireGuard)
DATABASE: 1433 (MSSQL), 3306 (MySQL), 5432 (PostgreSQL), 1521 (Oracle),
          27017 (MongoDB), 6379 (Redis)
```

💡 **Pola aman vs tidak aman:**
```
HTTP  80  → HTTPS 443
FTP   21  → FTPS  990 (atau SFTP 22)
Telnet 23 → SSH   22
LDAP  389 → LDAPS 636
IMAP  143 → IMAPS 993
POP3  110 → POP3S 995
SMTP   25 → SMTPS 465 / STARTTLS 587
```

Daftar lengkap ada di `referensi/daftar-port.md`.

### Kenapa DNS memakai TCP **dan** UDP

```
UDP 53 → query biasa (cepat, satu paket, tidak butuh handshake)
TCP 53 → jika jawaban > 512 byte (tanpa EDNS0), atau zone transfer (AXFR/IXFR)
```
Firewall yang hanya mengizinkan UDP 53 akan merusak DNSSEC dan jawaban besar.

---

## 6. Membaca `ss` dan `netstat`

`ss` adalah pengganti modern `netstat` di Linux — lebih cepat dan informatif.

```bash
$ ss -tulnp
Netid State  Recv-Q Send-Q  Local Address:Port   Peer Address:Port  Process
tcp   LISTEN 0      511           0.0.0.0:80          0.0.0.0:*      users:(("nginx",pid=1234,fd=6))
tcp   LISTEN 0      128         127.0.0.1:5432        0.0.0.0:*      users:(("postgres",pid=890,fd=5))
tcp   LISTEN 0      128           0.0.0.0:22          0.0.0.0:*      users:(("sshd",pid=677,fd=3))
udp   UNCONN 0      0       127.0.0.53%lo:53          0.0.0.0:*      users:(("systemd-resolve",pid=612,fd=13))
```

**Arti flag:**
```
-t  TCP
-u  UDP
-l  hanya yang LISTEN
-n  numerik (jangan resolve nama, jauh lebih cepat)
-p  tampilkan proses (butuh root untuk melihat proses milik user lain)
-a  semua socket
-s  ringkasan statistik
-i  info TCP internal (cwnd, rtt, retransmit)
-e  info tambahan
```

### Hal terpenting: alamat listening

```
0.0.0.0:80      → listening di SEMUA interface → bisa diakses dari luar
127.0.0.1:5432  → listening HANYA di localhost → TIDAK bisa diakses dari luar
192.168.1.50:8080 → hanya di interface itu
[::]:443        → semua interface IPv6
```

⚠️ **Ini penyebab masalah "aplikasi jalan tapi tidak bisa diakses dari luar" yang paling umum.** Aplikasi listening di `127.0.0.1` saja. Perbaikannya di konfigurasi aplikasi (`bind_address`, `listen`, `host`), bukan di firewall.

### Contoh pemakaian
```bash
# Apa yang listening
$ ss -tulnp

# Koneksi yang sedang aktif
$ ss -tn state established

# Koneksi ke port tertentu
$ ss -tn '( dport = :443 or sport = :443 )'

# Koneksi per state
$ ss -s
Total: 245
TCP:   89 (estab 34, closed 41, orphaned 0, timewait 39)

# Berapa koneksi per IP remote (deteksi anomali)
$ ss -tn state established | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head

# Info TCP detail satu koneksi
$ ss -tin dst 93.184.216.34
    cubic wscale:7,7 rto:212 rtt:11.5/2.1 mss:1448 cwnd:10
    bytes_sent:5231 bytes_acked:5231 retrans:0/0

# Windows
PS> netstat -ano | findstr LISTENING
PS> Get-NetTCPConnection -State Listen
PS> Get-Process -Id (Get-NetTCPConnection -LocalPort 443).OwningProcess
```

---

## 7. Menguji Port

```bash
# nc (netcat) — paling praktis
$ nc -zv example.com 443
Connection to example.com 443 port [tcp/https] succeeded!

$ nc -zv -w 3 example.com 8080
nc: connect to example.com port 8080 (tcp) failed: Connection refused

# Uji rentang port
$ nc -zv example.com 20-25

# UDP (kurang andal — UDP tidak menjawab jika port terbuka tapi tidak ada respons)
$ nc -zuv example.com 53

# Tanpa nc — pakai bash
$ timeout 3 bash -c 'cat < /dev/null > /dev/tcp/example.com/443' && echo OPEN || echo CLOSED

# curl untuk layanan HTTP
$ curl -Isv --connect-timeout 3 https://example.com

# nmap (hanya pada sistem yang Anda punya izin)
$ nmap -Pn -p 22,80,443 example.com
$ nmap -sU -p 53,123,161 host        # UDP scan (lambat)

# telnet (masih berguna untuk uji port)
$ telnet example.com 443
```

### Membedakan tiga hasil

| Hasil | Artinya |
|---|---|
| **Connection succeeded** | Port terbuka, ada aplikasi listening |
| **Connection refused** | Host **dapat dijangkau**, tetapi tidak ada yang listening di port itu (RST dikirim) |
| **Timeout / no route** | Paket tidak sampai — firewall drop, routing salah, atau host mati |

⚠️ Perbedaan **refused** vs **timeout** sangat informatif:
- *Refused* → jaringan sehat sampai host; masalah di aplikasi.
- *Timeout* → ada yang memblokir atau tidak ada jalur.

---

## 8. Port Sumber dalam Praktik

### Firewall dan port sumber

Aturan firewall harus mempertimbangkan bahwa port sumber klien **acak**:

```
❌ SALAH: allow src port 80 → dst port 80
✅ BENAR: allow any src port → dst port 80
          (dan biarkan stateful firewall menangani balasannya)
```

Firewall **stateful** mencatat koneksi keluar dan otomatis mengizinkan balasannya — inilah alasan Anda tidak perlu membuat aturan terpisah untuk trafik balik.

### NAT/PAT dan port

PAT (Port Address Translation) memanfaatkan port sumber untuk membedakan banyak host di balik satu IP publik:
```
192.168.1.10:51234 → 203.0.113.5:61001
192.168.1.11:51234 → 203.0.113.5:61002    ← port diubah agar unik
192.168.1.12:44000 → 203.0.113.5:61003
```
Detail di `09-nat-acl-firewall/01`.

### Port yang tidak boleh dipakai

⚠️ Jangan menjalankan layanan di port yang sudah dipakai layanan standar, walau teknis bisa. Ini membingungkan firewall, IDS, dan orang lain.

⚠️ Beberapa browser **memblokir port tertentu** untuk mencegah serangan cross-protocol (mis. port 25, 110, 143, 6667). Menjalankan web server di port itu akan gagal diakses dari browser.

---

## 9. Kesalahan Umum

⚠️ **1. Mengira port TCP dan UDP dengan nomor sama adalah hal yang sama.** TCP 53 dan UDP 53 adalah dua socket berbeda.

⚠️ **2. Lupa bahwa DNS juga memakai TCP.** Memblokir TCP 53 merusak DNSSEC dan jawaban besar.

⚠️ **3. Aplikasi listening di `127.0.0.1` lalu bingung kenapa tidak bisa diakses dari luar.** Periksa `ss -tulnp` sebelum menyalahkan firewall.

⚠️ **4. Membuat aturan firewall berdasarkan port sumber.** Port sumber klien acak.

⚠️ **5. Mengabaikan habisnya port ephemeral** pada proxy/LB dengan banyak koneksi keluar.

⚠️ **6. Menganggap `nc -zuv` andal untuk UDP.** UDP tidak wajib menjawab; hasil "open" pada UDP sering berarti "tidak ada jawaban", yang ambigu.

---

## 10. Ringkasan

- **Port** (16 bit, 0–65535) memungkinkan banyak aplikasi berbagi satu IP.
- Rentang: well-known (0–1023, butuh root), registered (1024–49151), **ephemeral** (49152+ / 32768+ di Linux).
- **Socket** = IP + port + protokol. **5-tuple** (protokol, IP src, port src, IP dst, port dst) mengidentifikasi koneksi secara unik.
- Klien memakai port sumber acak → itulah cara banyak tab ke situs yang sama bisa dibedakan.
- Hafalkan port inti: 22 SSH, 53 DNS (TCP **dan** UDP), 67/68 DHCP, 80/443 web, 123 NTP, 161/162 SNMP, 179 BGP, 389 LDAP, 514 syslog, 1812 RADIUS, 3389 RDP.
- `ss -tulnp` adalah perintah diagnostik utama. Perhatikan alamat listening: **`0.0.0.0` vs `127.0.0.1`**.
- **Connection refused** ≠ **timeout**: refused berarti jaringan sehat tetapi tidak ada aplikasi; timeout berarti ada yang memblokir.
- Port ephemeral bisa habis pada proxy/LB — perluas rentang atau tambah IP/port tujuan.

---

## 11. Latihan

1. Berapa banyak koneksi TCP simultan yang bisa dibuat satu klien ke satu server di port 443? Apa batasnya?
2. `ss -tulnp` menunjukkan `127.0.0.1:8080`. Rekan Anda tidak bisa mengakses aplikasi itu dari komputernya. Apa penyebab dan perbaikannya?
3. Apa perbedaan praktis antara "connection refused" dan "connection timeout" saat menguji port?
4. Kenapa DNS memakai UDP dan TCP? Kapan masing-masing dipakai?
5. Sebutkan port untuk: SSH, DHCP server, NTP, syslog, RADIUS auth, BGP, VXLAN, WireGuard.
6. Sebuah reverse proxy melaporkan error `Cannot assign requested address` saat trafik tinggi. Diagnosis dan solusi?
7. Sebuah aturan firewall ditulis: `permit tcp any eq 80 host 10.0.0.5 eq 80`. Apa yang salah?

<details>
<summary>Jawaban</summary>

1. Secara teori dibatasi oleh jumlah **port ephemeral** yang tersedia, karena IP sumber, IP tujuan, port tujuan, dan protokol semuanya tetap — hanya port sumber yang bervariasi. Di Linux default (32768–60999) itu **~28.232 koneksi**. Batas praktis lebih rendah karena socket dalam state `TIME_WAIT` masih menahan port selama ~60 detik. Bisa diperbesar dengan memperluas `ip_local_port_range`, mengaktifkan `tcp_tw_reuse`, atau menambah IP sumber.

2. Aplikasi **hanya listening di loopback** (`127.0.0.1`), sehingga hanya bisa diakses dari komputer itu sendiri. Ini bukan masalah firewall. Perbaikan: ubah konfigurasi aplikasi agar bind ke `0.0.0.0` (semua interface) atau ke IP spesifik yang menghadap jaringan — cari opsi seperti `bind`, `listen`, `host`, atau `--bind-address`. Setelah itu barulah periksa firewall.

3. **Connection refused** berarti paket SYN **sampai ke host** dan host membalas dengan **RST** — artinya jaringan, routing, dan firewall di jalur semuanya baik; hanya saja tidak ada aplikasi yang listening di port itu (atau aplikasi mati). **Timeout** berarti tidak ada respons sama sekali — paket dibuang di suatu tempat: firewall dengan aksi DROP, routing salah, host mati, atau tidak ada jalur balik.

4. **UDP 53** untuk query biasa: cepat, satu paket pergi-pulang, tanpa overhead handshake — cocok karena kebanyakan query DNS kecil dan sering. **TCP 53** dipakai ketika jawaban melebihi 512 byte (batas DNS klasik tanpa EDNS0) — misalnya jawaban DNSSEC yang besar atau record yang banyak — dan untuk **zone transfer** (AXFR/IXFR) yang memindahkan seluruh zona antar-server. Memblokir TCP 53 merusak DNSSEC dan sebagian resolusi.

5. SSH **22/TCP** · DHCP server **67/UDP** (klien 68/UDP) · NTP **123/UDP** · Syslog **514/UDP** · RADIUS auth **1812/UDP** (accounting 1813/UDP) · BGP **179/TCP** · VXLAN **4789/UDP** · WireGuard **51820/UDP** (default, dapat diubah).

6. **Kehabisan port ephemeral.** Proxy membuat sangat banyak koneksi keluar ke sedikit backend, sehingga kombinasi (IP src, port src, IP dst, port dst) habis — terutama karena socket `TIME_WAIT` menahan port. Solusi berlapis: (a) perluas rentang — `net.ipv4.ip_local_port_range = 10000 65535`; (b) aktifkan `net.ipv4.tcp_tw_reuse=1` agar socket TIME_WAIT dapat dipakai ulang untuk koneksi keluar; (c) aktifkan **keep-alive/connection pooling** ke backend sehingga koneksi dipakai ulang alih-alih dibuat baru; (d) tambahkan IP sumber tambahan pada proxy; (e) sebarkan backend ke lebih banyak IP/port.

7. Aturan itu mensyaratkan **port sumber = 80**, padahal klien memakai **port sumber ephemeral yang acak** (mis. 51234). Akibatnya hampir semua trafik sah akan ditolak. Yang benar: jangan batasi port sumber — `permit tcp any host 10.0.0.5 eq 80`. Trafik balasan ditangani otomatis oleh firewall stateful, atau dengan aturan balik yang memakai `established` pada ACL reflexive.

</details>

---

## 12. Sumber

- RFC 6335 — IANA Service Name and Transport Protocol Port Number Registry
- IANA Port Registry — https://www.iana.org/assignments/service-names-port-numbers/
- RFC 9293 — TCP (definisi socket & koneksi)
- `man ss`, `man nc`, `/etc/services`
- Cisco CCNA 200-301 v1.1, topik 1.5 & 4.x

---

**Berikutnya:** `05-transport/02-tcp.md` — protokol yang membawa sebagian besar trafik internet.

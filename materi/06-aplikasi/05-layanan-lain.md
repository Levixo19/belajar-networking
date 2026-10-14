# 06.5 — Email, SSH, NTP, SNMP, Syslog, dan Layanan Infrastruktur

> **Prasyarat:** `06-aplikasi/01`–`04`
> **Tujuan:** Anda menguasai layanan infrastruktur yang dipakai setiap hari oleh network engineer, dan tahu mengonfigurasi serta mendiagnosisnya.

---

## 1. Email

### Tiga protokol dengan peran berbeda

```
[Pengirim] --SMTP 587--> [Server pengirim] --SMTP 25--> [Server penerima]
                                                              │
                                                    IMAP 993 / POP3 995
                                                              ▼
                                                        [Penerima]
```

| Protokol | Port | Fungsi |
|---|---|---|
| **SMTP** | **25** | Antar-server (MTA ke MTA) |
| **SMTP Submission** | **587** | Klien → server pengirim (dengan autentikasi + STARTTLS) |
| **SMTPS** | 465 | Submission dengan TLS implisit |
| **POP3** | 110 / **995** | Unduh email, biasanya hapus dari server |
| **IMAP** | 143 / **993** | Sinkronisasi; email tetap di server, mendukung banyak perangkat |

⚠️ **Port 25 hampir selalu diblokir ISP untuk pelanggan rumahan** — untuk mencegah spam dari perangkat yang terinfeksi. Klien harus memakai **587** (submission) ke server mail mereka.

### Istilah

| Istilah | Arti |
|---|---|
| **MUA** (Mail User Agent) | Klien: Outlook, Thunderbird, aplikasi ponsel |
| **MSA** (Mail Submission Agent) | Menerima email dari MUA (port 587) |
| **MTA** (Mail Transfer Agent) | Meneruskan antar-server: Postfix, Exim, Sendmail |
| **MDA** (Mail Delivery Agent) | Menaruh email ke mailbox: Dovecot, Maildrop |
| **MIME** | Standar untuk lampiran & konten non-ASCII |

### Anti-Spoofing: SPF, DKIM, DMARC

Email asli tidak punya autentikasi — siapa pun bisa mengaku sebagai siapa pun. Tiga mekanisme DNS memperbaikinya.

**SPF (Sender Policy Framework)** — daftar server yang boleh mengirim atas nama domain.
```
example.com.  IN TXT  "v=spf1 ip4:203.0.113.0/24 include:_spf.google.com -all"
                                                                          ^^^^
                       -all = tolak yang lain (hard fail)
                       ~all = tandai mencurigakan (soft fail)
                       ?all = netral
```
⚠️ SPF punya batas **10 lookup DNS**. Terlalu banyak `include:` menyebabkan `permerror` dan SPF gagal total.

**DKIM (DomainKeys Identified Mail)** — tanda tangan kriptografis pada header dan body email.
```
selector._domainkey.example.com.  IN TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCSq..."
```
Penerima mengambil kunci publik dari DNS dan memverifikasi tanda tangan.

**DMARC** — kebijakan apa yang harus dilakukan kalau SPF/DKIM gagal, plus pelaporan.
```
_dmarc.example.com.  IN TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com; pct=100; adkim=s; aspf=s"
                                        ^^^^^^^^^^^^
                              p=none       → hanya laporkan (mulai dari sini)
                              p=quarantine → masukkan ke spam
                              p=reject     → tolak total
```

💡 **Urutan penerapan yang benar:** mulai dengan `p=none` + laporan, analisis laporan selama beberapa minggu untuk menemukan pengirim sah yang terlewat, baru naikkan ke `quarantine` lalu `reject`. Langsung ke `reject` akan memblokir email sah dari layanan pihak ketiga yang belum Anda daftarkan.

**MTA-STS** dan **DANE/TLSA** — memaksa enkripsi TLS antar-server mail.

### Diagnostik email

```bash
# Cek MX
$ dig example.com MX +short
10 mail.example.com.

# Cek SPF, DKIM, DMARC
$ dig example.com TXT +short | grep spf
$ dig selector._domainkey.example.com TXT +short
$ dig _dmarc.example.com TXT +short

# Uji koneksi SMTP manual
$ nc mail.example.com 25
220 mail.example.com ESMTP Postfix
EHLO test.example.org
250-mail.example.com
250-STARTTLS
250-AUTH PLAIN LOGIN
250 8BITMIME
QUIT

# Dengan TLS
$ openssl s_client -connect mail.example.com:587 -starttls smtp

# Cek reverse DNS (penting untuk reputasi!)
$ dig -x 203.0.113.50 +short
```

⚠️ **Reverse DNS (PTR) yang tidak cocok adalah penyebab utama email masuk spam.** Banyak MTA menolak koneksi dari IP yang PTR-nya tidak ada atau tidak "forward-confirmed" (PTR → nama → A kembali ke IP yang sama).

---

## 2. SSH

Protokol utama untuk mengelola perangkat jaringan dan server. **Ganti semua Telnet dengan SSH.**

### Cara kerja singkat

```
1. TCP connect ke port 22
2. Pertukaran versi protokol
3. Negosiasi algoritma (KEX, cipher, MAC, kompresi)
4. Key exchange (Diffie-Hellman) → kunci sesi
5. Verifikasi host key oleh klien (known_hosts)
6. Autentikasi klien (kunci publik, password, keyboard-interactive)
7. Sesi: shell, exec, port forwarding, SFTP
```

### Autentikasi kunci publik (wajib dipakai)

```bash
# Buat kunci — Ed25519 lebih baik daripada RSA
$ ssh-keygen -t ed25519 -C "budi@laptop" -f ~/.ssh/id_ed25519

# Salin ke server
$ ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server

# Manual
$ cat ~/.ssh/id_ed25519.pub | ssh user@server 'mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
```

### Port forwarding — fitur yang sangat berguna

```bash
# Local forwarding: akses layanan remote lewat port lokal
$ ssh -L 8080:internal-server:80 user@jumphost
# → localhost:8080 di laptop Anda = internal-server:80 lewat jumphost

# Remote forwarding: ekspos layanan lokal ke server remote
$ ssh -R 9000:localhost:3000 user@server
# → server:9000 = laptop Anda:3000

# Dynamic (SOCKS proxy)
$ ssh -D 1080 user@jumphost
# → set browser memakai SOCKS5 localhost:1080 → semua trafik lewat jumphost

# Jump host (ProxyJump) — melewati bastion
$ ssh -J user@bastion user@internal-server
```

### Konfigurasi klien yang memudahkan

`~/.ssh/config`:
```
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ControlMaster auto
    ControlPath ~/.ssh/cm-%r@%h:%p
    ControlPersist 10m
    HashKnownHosts yes

Host bastion
    HostName bastion.perusahaan.com
    User admin
    Port 2222
    IdentityFile ~/.ssh/id_ed25519

Host sw-*
    User netadmin
    ProxyJump bastion
    # Perangkat jaringan lama sering butuh algoritma legacy
    KexAlgorithms +diffie-hellman-group14-sha1
    HostKeyAlgorithms +ssh-rsa
    PubkeyAcceptedAlgorithms +ssh-rsa

Host sw-access-01
    HostName 192.168.99.11
```
Setelah ini cukup: `ssh sw-access-01`.

💡 **ControlMaster** membuat koneksi berikutnya ke host yang sama memakai koneksi yang sudah ada — instan, tanpa handshake ulang. Sangat mempercepat kerja dengan banyak perintah SSH (dan otomasi).

### Hardening server SSH

`/etc/ssh/sshd_config`:
```
PermitRootLogin no
PasswordAuthentication no          # HANYA kunci
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
AllowUsers admin netadmin
X11Forwarding no
ClientAliveInterval 300
ClientAliveCountMax 2

# Algoritma modern saja
KexAlgorithms curve25519-sha256,diffie-hellman-group16-sha512
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com
```

### SSH di perangkat Cisco

```
R1(config)# hostname R1
R1(config)# ip domain-name perusahaan.local
R1(config)# crypto key generate rsa modulus 2048
R1(config)# ip ssh version 2
R1(config)# ip ssh time-out 60
R1(config)# ip ssh authentication-retries 3
R1(config)# username admin privilege 15 secret RahasiaKuat123

R1(config)# line vty 0 15
R1(config-line)# transport input ssh          ← HANYA SSH, matikan Telnet
R1(config-line)# login local
R1(config-line)# exec-timeout 10 0
R1(config-line)# access-class MGMT-ACL in     ← batasi sumber

R1# show ip ssh
R1# show ssh
```

⚠️ **`crypto key generate rsa` membutuhkan hostname dan domain-name sudah diset** — kalau belum, perintahnya akan gagal.

---

## 3. NTP — Sinkronisasi Waktu

Waktu yang tidak sinkron menyebabkan masalah yang sangat sulit didiagnosis:
- Sertifikat TLS ditolak ("not yet valid")
- Kerberos/Active Directory gagal (toleransi hanya 5 menit)
- Log tidak bisa dikorelasikan antar-perangkat
- Penjadwalan dan rotasi kunci kacau
- Analisis forensik tidak mungkin dilakukan

### Hierarki Stratum

```
Stratum 0 : Sumber referensi (jam atom, GPS)   ← bukan perangkat jaringan
Stratum 1 : Server yang terhubung langsung ke stratum 0
Stratum 2 : Menyinkronkan ke stratum 1
Stratum 3 : Menyinkronkan ke stratum 2
...
Stratum 16: TIDAK TERSINKRONISASI
```

⚠️ **Stratum 16 berarti "tidak sinkron"**, bukan "sangat jauh". Kalau Anda melihat stratum 16, NTP tidak berfungsi.

### Konfigurasi Cisco

```
R1(config)# ntp server 192.168.1.5 prefer
R1(config)# ntp server 0.id.pool.ntp.org
R1(config)# ntp source loopback0
R1(config)# clock timezone WIB 7 0

# Autentikasi NTP
R1(config)# ntp authenticate
R1(config)# ntp authentication-key 1 md5 RahasiaNTP
R1(config)# ntp trusted-key 1
R1(config)# ntp server 192.168.1.5 key 1

# Jadikan router sebagai server NTP untuk perangkat lain
R1(config)# ntp master 3          ← stratum 3

# Verifikasi
R1# show ntp status
Clock is synchronized, stratum 3, reference is 192.168.1.5
R1# show ntp associations
R1# show clock detail
```

### Linux (chrony — direkomendasikan)

`/etc/chrony/chrony.conf`:
```
pool 0.id.pool.ntp.org iburst
server 192.168.1.5 iburst prefer

driftfile /var/lib/chrony/drift
makestep 1.0 3            # koreksi besar diizinkan pada 3 update pertama
rtcsync

# Jadikan server untuk LAN
allow 192.168.0.0/16
local stratum 10          # tetap melayani walau upstream hilang
```

```bash
$ chronyc sources -v
$ chronyc tracking
$ chronyc sourcestats
$ timedatectl status
```

### PTP — untuk presisi tinggi

**PTP** (IEEE 1588) memberi akurasi **sub-mikrodetik** (NTP: milidetik). Dipakai di: telekomunikasi (sinkronisasi radio 5G), finansial (timestamp transaksi), broadcast, industri.

Membutuhkan dukungan hardware di switch (**boundary clock** atau **transparent clock**) untuk mengompensasi delay antrean.

---

## 4. SNMP — Monitoring Klasik

### Konsep

```
[NMS / Manager]  ←SNMP→  [Agent di perangkat]
  (Zabbix, PRTG,           (router, switch,
   LibreNMS, Nagios)        server, printer)
```

| Operasi | Arah | Port |
|---|---|---|
| **GET / GETNEXT / GETBULK** | Manager → Agent | 161 |
| **SET** | Manager → Agent | 161 |
| **TRAP** | Agent → Manager (tanpa konfirmasi) | 162 |
| **INFORM** | Agent → Manager (dengan konfirmasi) | 162 |

### MIB dan OID

**MIB** (Management Information Base) = struktur pohon berisi definisi objek.
**OID** (Object Identifier) = alamat numerik satu objek dalam pohon itu.

```
.1.3.6.1.2.1.1.5.0  = sysName
 │ │ │ │ │ │ │ │ └── instance (0 = scalar)
 │ │ │ │ │ │ │ └──── sysName
 │ │ │ │ │ │ └────── system
 │ │ │ │ │ └──────── mib-2
 │ │ │ │ └────────── mgmt
 │ │ │ └──────────── internet
 │ │ └────────────── dod
 │ └──────────────── org
 └────────────────── iso
```

**OID yang sering dipakai:**
```
.1.3.6.1.2.1.1.3.0      sysUpTime
.1.3.6.1.2.1.1.5.0      sysName
.1.3.6.1.2.1.2.2.1.2    ifDescr        (nama interface)
.1.3.6.1.2.1.2.2.1.8    ifOperStatus   (1=up, 2=down)
.1.3.6.1.2.1.31.1.1.1.6 ifHCInOctets   (counter 64-bit masuk)
.1.3.6.1.2.1.31.1.1.1.10 ifHCOutOctets (counter 64-bit keluar)
.1.3.6.1.4.1.9.9.109.1.1.1.1.7  cpmCPUTotal5minRev (CPU Cisco)
```

⚠️ **Gunakan counter 64-bit (`ifHC*`), bukan 32-bit (`ifInOctets`).** Counter 32-bit **wrap** (kembali ke nol) setiap:
```
Link 1 Gbps  : 2^32 byte / 125 MB/s ≈ 34 detik
Link 10 Gbps : ≈ 3,4 detik
```
Kalau polling interval Anda 5 menit, counter 32-bit pada link gigabit sudah wrap berkali-kali → grafik utilisasi salah total.

### Versi SNMP

| Versi | Autentikasi | Enkripsi | Catatan |
|---|---|---|---|
| **v1** | Community string plaintext | ❌ | Usang; counter 32-bit saja |
| **v2c** | Community string plaintext | ❌ | Masih paling banyak dipakai; ada GETBULK & counter 64-bit |
| **v3** | Username + auth (SHA) | ✅ (AES) | **Satu-satunya yang aman** |

⚠️ **Community string SNMPv2c dikirim plaintext.** Siapa pun yang menyadap bisa membacanya. Community `public`/`private` yang masih default adalah kerentanan serius — dengan community RW, penyerang bisa **mengubah konfigurasi perangkat**.

### Konfigurasi

```
# SNMPv2c (read-only, dibatasi ACL) — minimum yang bisa diterima
R1(config)# access-list 20 permit 192.168.99.0 0.0.0.255
R1(config)# snmp-server community R3adOnly_K0mplex RO 20
R1(config)# snmp-server location "DC-Jakarta-Rack-A12"
R1(config)# snmp-server contact "noc@perusahaan.com"

# SNMPv3 — DIREKOMENDASIKAN
R1(config)# snmp-server group NETMON v3 priv
R1(config)# snmp-server user monitoring NETMON v3 auth sha AuthPass123 priv aes 128 PrivPass123
R1(config)# snmp-server host 192.168.99.50 version 3 priv monitoring

# Trap
R1(config)# snmp-server enable traps snmp linkdown linkup
R1(config)# snmp-server enable traps config
R1(config)# snmp-server enable traps envmon

R1# show snmp
R1# show snmp user
R1# show snmp group
```

```bash
# Klien SNMP
$ snmpwalk -v2c -c community 192.168.1.1 system
$ snmpget  -v2c -c community 192.168.1.1 .1.3.6.1.2.1.1.5.0
$ snmpwalk -v3 -l authPriv -u monitoring -a SHA -A AuthPass123 \
           -x AES -X PrivPass123 192.168.1.1 ifDescr

# Terjemahkan OID ke nama (butuh MIB terpasang)
$ snmptranslate -Of .1.3.6.1.2.1.1.5.0
```

### SNMP vs Streaming Telemetry

| | SNMP | gNMI / Streaming Telemetry |
|---|---|---|
| Model | **Pull** (polling) | **Push** (subscription) |
| Interval | 1–5 menit (beban tinggi kalau lebih cepat) | Detik atau sub-detik |
| Beban perangkat | Tinggi (setiap poll = pekerjaan CPU) | Rendah (sekali subscribe) |
| Format | ASN.1/BER | Protobuf/JSON |
| Keamanan | v3 (rumit) | TLS + gRPC |
| Skalabilitas | Terbatas | Sangat baik |

💡 **SNMP masih dominan** karena didukung semua perangkat, tetapi jaringan modern beralih ke streaming telemetry untuk visibilitas yang lebih detail dan real-time (`14-monitoring-troubleshooting/03`).

---

## 5. Syslog

Standar logging terpusat.

### Severity — hafalkan ini

| Level | Nama | Arti | Contoh |
|---|---|---|---|
| **0** | Emergency | Sistem tidak bisa dipakai | Kernel panic |
| **1** | Alert | Harus ditangani segera | Kehilangan redundansi total |
| **2** | Critical | Kondisi kritis | Kegagalan hardware, suhu berbahaya |
| **3** | **Error** | Kondisi error | Interface down, adjacency hilang |
| **4** | **Warning** | Peringatan | Ambang batas terlampaui |
| **5** | Notice | Normal tetapi signifikan | Perubahan konfigurasi |
| **6** | **Informational** | Pesan informasi | Interface up |
| **7** | Debug | Debugging | Output `debug` |

Mnemonic: **E**very **A**wesome **C**isco **E**ngineer **W**ill **N**eed **I**ce cream **D**aily.

⚠️ **Angka lebih KECIL = lebih PARAH.** Ini sering tertukar.

⚠️ Mengatur level ke `7` (debug) berarti **semua** pesan level 0–7 dikirim — bisa membanjiri jaringan dan perangkat. Level `6` (informational) adalah default yang wajar untuk produksi.

### Facility

Mengelompokkan sumber pesan: `kern`(0), `user`(1), `mail`(2), `daemon`(3), `auth`(4), `syslog`(5), `lpr`(6), `news`(7), `uucp`(8), `cron`(9), `authpriv`(10), `ftp`(11), `local0`–`local7`(16–23).

💡 Perangkat jaringan biasanya memakai `local7` secara default; gunakan `local0`–`local7` untuk memisahkan sumber di server syslog.

### Format

**RFC 3164 (BSD, lama):**
```
<134>Sep 10 14:22:01 R1 %LINK-3-UPDOWN: Interface Gi0/1, changed state to down
 │    └── timestamp   └─host  └── pesan
 └── PRI = facility × 8 + severity = 16×8 + 6 = 134
```

**RFC 5424 (modern, terstruktur):**
```
<134>1 2026-09-10T14:22:01.123Z R1 CISCO - ID47 [exampleSDID@32473 iut="3"] Interface down
      │ └── timestamp ISO 8601 dengan zona waktu
      └── versi
```
Keunggulan RFC 5424: timestamp presisi tinggi dengan zona waktu, structured data yang bisa diparsing mesin, dukungan Unicode.

### Konfigurasi Cisco

```
R1(config)# logging host 192.168.99.50
R1(config)# logging trap informational          ← level 6 dan yang lebih parah
R1(config)# logging facility local7
R1(config)# logging source-interface loopback0
R1(config)# logging buffered 32768 informational
R1(config)# service timestamps log datetime msec localtime show-timezone
R1(config)# service sequence-numbers
R1(config)# logging origin-id hostname

# Kurangi noise console
R1(config)# no logging console
R1(config)# logging monitor warning

R1# show logging
R1# show logging | include LINK-3
```

⚠️ **`service timestamps log datetime msec` sangat penting.** Tanpa itu, log Cisco hanya menampilkan uptime relatif (`00:12:34`), bukan waktu absolut — mustahil dikorelasikan dengan log perangkat lain.

### rsyslog di Linux

`/etc/rsyslog.d/50-network.conf`:
```
# Terima syslog dari jaringan
module(load="imudp")
input(type="imudp" port="514")
module(load="imtcp")
input(type="imtcp" port="514")

# Pisahkan per host pengirim
template(name="PerHost" type="string"
         string="/var/log/network/%HOSTNAME%/%$YEAR%-%$MONTH%-%$DAY%.log")

if $fromhost-ip startswith '192.168.99.' then {
    action(type="omfile" dynaFile="PerHost")
    stop
}
```

```bash
$ sudo systemctl restart rsyslog
$ sudo tail -f /var/log/network/SW-ACCESS-01/2026-09-10.log

# journald
$ journalctl -f
$ journalctl -u sshd --since "1 hour ago"
$ journalctl -p err --since today
```

⚠️ **Syslog UDP 514 tidak andal dan tidak terenkripsi.** Untuk lingkungan penting, gunakan **TCP** atau **RELP** dengan **TLS**:
```
R1(config)# logging host 192.168.99.50 transport tcp port 6514
```

---

## 6. FTP, TFTP, SFTP

| Protokol | Port | Enkripsi | Autentikasi | Catatan |
|---|---|---|---|---|
| **FTP** | 21 (kontrol), 20 (data aktif) | ❌ | Plaintext | Rumit di firewall/NAT |
| **FTPS** | 990 / 21 dengan AUTH TLS | ✅ | TLS | Masih pakai dua port |
| **SFTP** | **22** | ✅ | SSH | **Direkomendasikan** — satu port, mudah di firewall |
| **SCP** | 22 | ✅ | SSH | Lebih sederhana, kurang fitur |
| **TFTP** | **69 UDP** | ❌ | **TIDAK ADA** | Untuk boot & backup config perangkat |

### FTP: Mode Aktif vs Pasif

Ini penyebab klasik masalah firewall.

```
MODE AKTIF:
1. Klien → server:21   (koneksi kontrol)
2. Klien mengirim perintah PORT, memberi tahu port yang ia buka
3. SERVER → klien:port  (koneksi data — dari luar ke dalam!)
   ⚠️ Firewall klien memblokir koneksi masuk → GAGAL

MODE PASIF:
1. Klien → server:21   (koneksi kontrol)
2. Klien mengirim perintah PASV
3. Server memberi tahu port yang ia buka
4. KLIEN → server:port  (koneksi data — dari dalam ke luar)
   ✅ Firewall klien mengizinkan → BERHASIL
```

💡 **Selalu pakai mode pasif** dari belakang firewall/NAT. Di sisi server, batasi rentang port pasif dan buka rentang itu di firewall.

### TFTP

Sangat sederhana: tanpa autentikasi, tanpa enkripsi, tanpa listing direktori. Dipakai untuk:
- Backup dan restore konfigurasi perangkat jaringan
- Upgrade IOS
- PXE boot
- Provisioning telepon IP

```
R1# copy running-config tftp:
Address or name of remote host []? 192.168.99.50
Destination filename [r1-confg]? r1-backup-20260910

R1# copy tftp: flash:
R1# copy running-config startup-config
```

```bash
# Server TFTP di Linux
$ sudo apt install tftpd-hpa
$ sudo systemctl enable --now tftpd-hpa
# Direktori default: /srv/tftp
$ sudo chmod 777 /srv/tftp        # tftpd tidak bisa membuat file tanpa ini
```

⚠️ **TFTP tanpa autentikasi apa pun.** Jangan pernah ekspos ke jaringan yang tidak tepercaya. Batasi dengan ACL ke subnet manajemen saja. Untuk backup config produksi, gunakan **SCP/SFTP**:
```
R1# copy running-config scp://admin@192.168.99.50/backup/r1-confg
```

---

## 7. Layanan Lain yang Perlu Dikenal

### Telnet (port 23)
⚠️ **Mengirim semua data, termasuk password, dalam plaintext.** Jangan pernah dipakai untuk manajemen. Satu-satunya kegunaan sah: menguji apakah port TCP terbuka (`telnet host 443`) — dan bahkan itu lebih baik dengan `nc -zv`.

```
R1(config-line)# transport input ssh     ← matikan Telnet di semua vty
```

### Out-of-Band Management
Jaringan manajemen **terpisah** dari jaringan produksi (console server, port manajemen khusus, jalur seluler).

💡 **Sangat penting:** ketika jaringan produksi mati, Anda tetap bisa masuk untuk memperbaikinya. Tanpa OOB, kesalahan konfigurasi bisa mengunci Anda dari perangkat sendiri — dan harus datang secara fisik.

### LDAP / Active Directory (389 / 636)
Direktori pengguna terpusat. Dipakai untuk autentikasi aplikasi dan sebagai sumber identitas bagi RADIUS.

### Kerberos (88)
Autentikasi berbasis ticket di Windows/AD. ⚠️ Sangat sensitif terhadap **selisih waktu** — toleransi default hanya **5 menit**. Ini alasan lain NTP wajib benar.

### SMB/CIFS (445), NFS (2049)
Berbagi file. SMB dominan di Windows, NFS di Unix/Linux.

### iSCSI (3260)
Storage blok lewat IP. Membutuhkan jaringan berkualitas (jumbo frame, low latency, sebaiknya VLAN terpisah).

### RDP (3389), VNC (5900)
Remote desktop. ⚠️ **Jangan pernah ekspos RDP langsung ke internet** — target utama serangan brute force dan ransomware. Selalu di balik VPN atau bastion.

### mDNS (5353), SSDP (1900)
Service discovery lokal (Bonjour, Chromecast, printer, UPnP). Berbasis multicast dan **tidak melewati router** — inilah sebabnya AirPlay/Chromecast tidak bekerja lintas VLAN tanpa mDNS repeater/gateway.

⚠️ **SSDP/UPnP adalah risiko keamanan** — bisa dipakai untuk amplification attack dan membuka port firewall secara otomatis. Matikan di perimeter.

---

## MikroTik RouterOS

### SSH dan akses manajemen

```
# Layanan dan pembatasannya
/ip service print
/ip service disable telnet,ftp,api,www
/ip service set ssh port=22 address=192.168.99.0/24
/ip service set winbox address=192.168.99.0/24
/ip service set www-ssl disabled=no certificate=cert-router

# SSH key (lebih aman daripada password)
/user ssh-keys import public-key-file=id_ed25519.pub user=netadmin

# Kekuatan kripto SSH
/ip ssh set strong-crypto=yes host-key-size=4096
/ip ssh set allow-none-crypto=no

# User dan grup
/user group add name=readonly policy=read,test,winbox,ssh
/user add name=monitoring password=X group=readonly address=192.168.99.0/24
/user print
/user active print                    ← siapa yang sedang login
```

⚠️ **`address=` pada `/user` dan `/ip service` adalah kontrol keamanan penting** — membatasi dari mana user boleh login. Ini lapisan kedua di luar firewall.

### NTP

```
# Client
/system ntp client set enabled=yes servers=id.pool.ntp.org,0.pool.ntp.org
/system clock set time-zone-name=Asia/Jakarta
/system clock print
/system ntp client print

# Server (untuk perangkat lain di jaringan)
/system ntp server set enabled=yes broadcast=no multicast=no manycast=no
```

⚠️ **RouterOS v7 memisahkan NTP client dan server** ke menu berbeda dari v6. Di v6: `/system ntp client` dan `/system ntp server`.

### SNMP

```
/snmp set enabled=yes contact="noc@perusahaan.com" location="DC-Jakarta-Rack-A12"

# SNMPv2c dengan pembatasan alamat (minimum yang bisa diterima)
/snmp community set [find default=yes] name=R3adOnly_K0mplex \
    addresses=192.168.99.0/24 read-access=yes write-access=no

# SNMPv3 (DIREKOMENDASIKAN)
/snmp set enabled=yes trap-version=3
/snmp community add name=v3user security=private \
    authentication-protocol=SHA1 authentication-password=AuthPass123 \
    encryption-protocol=AES encryption-password=PrivPass123 \
    addresses=192.168.99.50/32

/snmp print
```

### Syslog

```
# Kirim log ke server terpusat
/system logging action add name=remote target=remote remote=192.168.99.50 \
    remote-port=514 src-address=192.168.99.1 bsd-syslog=no

/system logging add topics=info,!debug action=remote
/system logging add topics=error,critical,warning action=remote
/system logging add topics=firewall action=remote

# Log lokal
/system logging action set memory memory-lines=2000
/log print
/log print follow                     ← seperti tail -f
/log print where topics~"firewall"
/log print where message~"login"

# Simpan log ke disk
/system logging action add name=disk target=disk disk-file-name=log-router \
    disk-lines-per-file=10000 disk-file-count=5
```

⚠️ **Buffer log RouterOS default sangat kecil (100 baris)** dan hilang saat reboot. **Selalu kirim ke syslog server** untuk jaringan produksi.

### File transfer dan backup

```
# Backup otomatis terjadwal ke FTP/SFTP
/system scheduler add name=backup-harian interval=1d start-time=02:00:00 \
    on-event="/system backup save name=(\"backup-\" . [/system clock get date]); \
              /export file=(\"config-\" . [/system clock get date])"

# Kirim ke server
/tool fetch address=192.168.99.50 src-path=backup.backup mode=ftp \
    user=backup password=X upload=yes

# Kirim lewat email
/tool e-mail send to="noc@perusahaan.com" subject="Backup Router" \
    file=backup.backup

# Lihat file di router
/file print
/file remove [find name~"backup-2025"]
```

### Padanan istilah

| Cisco | MikroTik |
|---|---|
| `transport input ssh` | `/ip service disable telnet` |
| `access-class MGMT in` (VTY) | `/ip service set ssh address=` |
| `username X privilege 15` | `/user add name=X group=full` |
| `ntp server X` | `/system ntp client set servers=X` |
| `snmp-server community X RO 20` | `/snmp community set name=X addresses=` |
| `logging host X` | `/system logging action add target=remote remote=X` |
| `logging trap informational` | `/system logging add topics=info action=X` |
| `show logging` | `/log print` |
| `copy running-config tftp:` | `/export file=X` + `/tool fetch upload=yes` |
| `archive` + `kron` | `/system scheduler` |
| EEM applet | `/system scheduler` + `/tool netwatch` + skrip |

---

## 8. Ringkasan

- **Email**: SMTP 25 (antar-server), **587** (submission dari klien), IMAP 993, POP3 995. Port 25 diblokir ISP rumahan.
- **SPF + DKIM + DMARC** mencegah spoofing. Mulai DMARC dengan `p=none`, analisis laporan, baru naikkan.
- **PTR yang tidak cocok** adalah penyebab utama email masuk spam.
- **SSH**: pakai kunci Ed25519, matikan password auth, manfaatkan `~/.ssh/config`, ProxyJump, ControlMaster, dan port forwarding.
- **NTP**: stratum 0 (sumber) sampai 15; **stratum 16 = tidak sinkron**. Waktu salah merusak TLS, Kerberos, dan korelasi log.
- **SNMP**: OID dalam pohon MIB; **gunakan counter 64-bit (`ifHC*`)** — counter 32-bit wrap dalam 34 detik di link 1 Gbps. **v3 satu-satunya yang aman.**
- **Syslog severity 0–7, angka kecil = lebih parah.** Aktifkan `service timestamps log datetime msec`. UDP 514 tidak andal — pakai TCP/TLS untuk lingkungan penting.
- **FTP pasif** untuk melewati firewall. **SFTP (22)** direkomendasikan; **TFTP tanpa keamanan apa pun** — batasi dengan ACL.
- **Ganti Telnet dengan SSH.** Sediakan **out-of-band management**.
- **mDNS/SSDP tidak melewati router** — butuh repeater untuk lintas VLAN.

---

## 9. Latihan

1. Kenapa klien email harus memakai port 587, bukan 25?
2. Domain Anda menerapkan SPF `-all` tetapi email dari layanan newsletter pihak ketiga tertolak. Apa yang terjadi dan bagaimana memperbaikinya?
3. Sebuah switch melaporkan stratum 16. Apa artinya dan apa yang Anda periksa?
4. Grafik utilisasi interface 10 Gbps menunjukkan lonjakan aneh dan nilai negatif. Apa dugaan Anda?
5. Anda mengatur `logging trap 7`. Apa risikonya?
6. Transfer FTP gagal dengan pesan "connection refused" saat mulai mentransfer file, padahal login berhasil. Apa dugaan Anda?
7. Anda perlu mengakses web interface perangkat di `10.0.5.20:8080` yang hanya bisa dijangkau dari jump host. Bagaimana caranya dengan SSH?
8. Kenapa Chromecast tidak terdeteksi ketika laptop dan Chromecast berada di VLAN berbeda?

<details>
<summary>Jawaban</summary>

1. Port **25** ditujukan untuk transfer **antar-server (MTA ke MTA)** dan umumnya tidak memerlukan autentikasi pengirim. Karena itu port ini banyak disalahgunakan untuk mengirim spam dari perangkat yang terinfeksi, sehingga **ISP hampir selalu memblokirnya** untuk pelanggan rumahan. Port **587 (submission)** dirancang khusus untuk klien: **wajib autentikasi** dan mendukung **STARTTLS**, sehingga aman dan tidak diblokir.

2. Kebijakan `-all` (**hard fail**) memerintahkan penerima menolak email dari server mana pun yang tidak tercantum di record SPF. Server milik layanan newsletter tidak ada dalam daftar, sehingga emailnya ditolak.
   **Perbaikan:** tambahkan mekanisme `include:` milik layanan tersebut ke record SPF, mis. `v=spf1 ip4:203.0.113.0/24 include:_spf.google.com include:sendgrid.net -all`. ⚠️ Perhatikan **batas 10 lookup DNS** pada SPF — terlalu banyak `include:` menyebabkan `permerror` dan SPF gagal total. Kalau mendekati batas, gunakan SPF flattening atau kurangi jumlah pengirim. Pastikan juga DKIM dikonfigurasi untuk layanan itu agar DMARC lulus lewat jalur DKIM.

3. **Stratum 16 berarti perangkat TIDAK tersinkronisasi** dengan sumber waktu mana pun. Periksa: (a) `show ntp associations` — apakah server NTP terjangkau (`ping`)? (b) apakah ACL/firewall memblokir UDP 123? (c) apakah alamat server NTP benar? (d) kalau memakai autentikasi NTP, apakah key cocok di kedua sisi? (e) apakah `ntp source` menunjuk interface yang punya rute balik? (f) apakah baru saja di-reboot — sinkronisasi awal bisa butuh beberapa menit.

4. **Counter SNMP 32-bit yang wrap.** Pada link 10 Gbps, counter 32-bit (`ifInOctets`) penuh dalam ~3,4 detik. Dengan interval polling 5 menit, counter sudah wrap puluhan kali, sehingga sistem monitoring menghitung selisih yang salah — menghasilkan lonjakan palsu atau nilai negatif.
   **Perbaikan:** gunakan **counter 64-bit** `ifHCInOctets`/`ifHCOutOctets` (`.1.3.6.1.2.1.31.1.1.1.6` dan `.10`), yang tersedia sejak SNMPv2c. Pastikan sistem monitoring dikonfigurasi memakai HC counter, dan perangkat memakai SNMP v2c/v3 (bukan v1 yang hanya punya counter 32-bit).

5. Level 7 (**debug**) berarti **semua** pesan dari level 0 sampai 7 dikirim ke server syslog. Ini bisa: (a) menghasilkan ribuan pesan per detik pada perangkat sibuk; (b) **membanjiri CPU perangkat** karena setiap pesan harus diformat dan dikirim; (c) memenuhi bandwidth link manajemen; (d) memenuhi disk server syslog dengan sangat cepat; (e) **menyembunyikan pesan penting** di antara noise. Untuk produksi, gunakan level **6 (informational)** atau bahkan 5 (notice). Aktifkan debug hanya sementara saat troubleshooting, dan matikan setelahnya.

6. **Mode FTP aktif di belakang firewall/NAT.** Login memakai koneksi **kontrol** (klien → server:21) yang berhasil karena arahnya keluar. Ketika transfer dimulai, mode aktif membuat **server** membuka koneksi **data ke klien** — arah masuk — yang diblokir firewall/NAT klien.
   **Perbaikan:** gunakan **mode pasif** (`PASV`) di klien, sehingga koneksi data juga dibuat dari klien ke server (arah keluar). Di sisi server, tetapkan rentang port pasif tertentu dan buka rentang itu di firewall. Lebih baik lagi: beralih ke **SFTP** yang hanya memakai satu port (22) dan tidak punya masalah ini sama sekali.

7. **SSH local port forwarding:**
   ```bash
   $ ssh -L 8080:10.0.5.20:8080 user@jumphost
   ```
   Lalu buka `http://localhost:8080` di browser laptop Anda — trafik akan ditunnel lewat jumphost ke `10.0.5.20:8080`.
   Alternatif: **dynamic forwarding** (SOCKS proxy) yang lebih fleksibel karena satu tunnel melayani banyak tujuan:
   ```bash
   $ ssh -D 1080 user@jumphost
   # lalu set browser memakai SOCKS5 proxy localhost:1080
   ```

8. Chromecast (dan AirPlay, printer Bonjour, banyak perangkat IoT) memakai **mDNS** (multicast DNS, port 5353) untuk service discovery. Paket mDNS dikirim ke alamat multicast link-local `224.0.0.251`, dan **router tidak meneruskan multicast link-local antar-subnet**. Karena laptop dan Chromecast berada di VLAN berbeda (= broadcast/multicast domain berbeda), announcement tidak pernah sampai.
   **Solusi:** (a) tempatkan keduanya di VLAN yang sama; (b) jalankan **mDNS repeater/reflector** di router atau L3 switch (`service-routing mdns-sd` di Cisco, atau `avahi-daemon` dengan `enable-reflector=yes` di Linux); (c) gunakan fitur khusus vendor seperti Bonjour Gateway pada WLC. Perhatikan implikasi keamanan: repeater mDNS membuka visibilitas layanan lintas VLAN yang mungkin sengaja Anda pisahkan.

</details>

---

## 10. Sumber

- RFC 5321 — SMTP · RFC 3501 — IMAP · RFC 1939 — POP3
- RFC 7208 — SPF · RFC 6376 — DKIM · RFC 7489 — DMARC
- RFC 4251–4254 — SSH Protocol
- RFC 5905 — NTPv4 · IEEE 1588 — PTP
- RFC 3411–3418 — SNMPv3
- RFC 3164 & RFC 5424 — Syslog
- RFC 959 — FTP · RFC 1350 — TFTP
- Cisco CCNA 200-301 v1.1, topik 4.2 (NTP), 4.4 (SNMP), 4.5 (syslog facilities & severity), 4.8 (SSH), 4.9 (TFTP/FTP)

---

**Berikutnya:** `07-routing-lanjutan/01-static-routing.md` — memasuki tahap menengah.

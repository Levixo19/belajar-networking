# Daftar Port & Protokol Penting

> Port yang wajib dihafal untuk CCNA/Network+ dan operasi sehari-hari. Rentang: well-known 0–1023, registered 1024–49151, dynamic/ephemeral 49152–65535.

---

## Port Paling Penting (HAFALKAN)

| Port | Proto | Layanan | Catatan |
|---|---|---|---|
| **20/21** | TCP | FTP (data/kontrol) | 21 kontrol, 20 data (aktif); plaintext |
| **22** | TCP | SSH / SCP / SFTP | remote aman ★ |
| **23** | TCP | Telnet | ⚠️ plaintext — hindari |
| **25** | TCP | SMTP | kirim email |
| **53** | TCP/UDP | DNS | UDP query, TCP zone transfer/besar ★ |
| **67/68** | UDP | DHCP (server/client) | 67 server, 68 client ★ |
| **69** | UDP | TFTP | transfer file sederhana (upgrade IOS) |
| **80** | TCP | HTTP | web ★ |
| **110** | TCP | POP3 | ambil email |
| **123** | UDP | NTP | sinkronisasi waktu ★ |
| **143** | TCP | IMAP | ambil email (sync) |
| **161/162** | UDP | SNMP (poll/trap) | 161 query, 162 trap ★ |
| **179** | TCP | BGP | routing antar-AS ★ |
| **389** | TCP/UDP | LDAP | direktori |
| **443** | TCP | HTTPS | web aman (TLS) ★ |
| **445** | TCP | SMB | berbagi file Windows |
| **514** | UDP | Syslog | logging terpusat ★ |
| **636** | TCP | LDAPS | LDAP aman |
| **3389** | TCP | RDP | remote desktop Windows |

## Email (ringkasan)

| Port | Layanan | Enkripsi |
|---|---|---|
| 25 | SMTP (relay antar-server) | — / STARTTLS |
| 587 | SMTP submission (klien kirim) | STARTTLS ★ |
| 465 | SMTPS | TLS langsung |
| 110 | POP3 | — |
| 995 | POP3S | TLS |
| 143 | IMAP | — |
| 993 | IMAPS | TLS ★ |

## Autentikasi & Keamanan

| Port | Proto | Layanan |
|---|---|---|
| 1812/1813 | UDP | RADIUS (auth/accounting) ★ |
| 49 | TCP | TACACS+ ★ |
| 500 | UDP | IKE (IPsec fase 1) |
| 4500 | UDP | IPsec NAT-T |
| 1701 | UDP | L2TP |
| 1723 | TCP | PPTP (⚠️ usang/tak aman) |
| 51820 | UDP | WireGuard (default) |

## Database & Aplikasi (umum)

| Port | Layanan |
|---|---|
| 1433 | Microsoft SQL Server |
| 1521 | Oracle DB |
| 3306 | MySQL/MariaDB |
| 5432 | PostgreSQL |
| 6379 | Redis |
| 27017 | MongoDB |
| 8080 | HTTP alternatif / proxy |
| 8443 | HTTPS alternatif |

## Otomasi & Manajemen Jaringan

| Port | Proto | Layanan |
|---|---|---|
| 830 | TCP | NETCONF (over SSH) |
| 6513 | TCP | NETCONF over TLS |
| 9339 | TCP | gNMI/gRPC (streaming telemetry) |
| 8728/8729 | TCP | MikroTik API / API-SSL |
| 443 | TCP | RESTCONF / REST API (umum) |

## HTTP versi (untuk konteks)

```
HTTP/1.1  → TCP 80 (atau 443 dengan TLS)
HTTP/2    → TCP 443 (TLS)
HTTP/3    → UDP 443 (QUIC) ★ berbasis UDP!
```

---

## Protokol Tanpa Port (Layer 3/4 langsung)

| Protokol | Nomor (IP proto) | Fungsi |
|---|---|---|
| ICMP | 1 | ping, error (bukan TCP/UDP) |
| IGMP | 2 | manajemen grup multicast |
| TCP | 6 | transport andal |
| UDP | 17 | transport ringan |
| GRE | 47 | tunneling |
| ESP | 50 | IPsec (enkripsi payload) ★ |
| AH | 51 | IPsec (autentikasi header) |
| OSPF | 89 | routing (langsung di atas IP!) |
| VRRP | 112 | redundansi gateway |

⚠️ **ESP (50), AH (51), GRE (47), OSPF (89) bukan TCP/UDP** — mereka protokol IP tersendiri. Firewall harus mengizinkan **nomor protokol IP**, bukan port, untuk IPsec/GRE/OSPF. Ini gotcha umum: "kenapa IPsec/GRE diblokir?" → firewall hanya mengizinkan TCP/UDP.

💡 **ICMP tidak punya port** — ia protokol L3 sendiri. Karena itu "buka port untuk ping" salah; yang benar mengizinkan protokol ICMP (tipe echo-request/reply).

---

## Cara Mengingat (CCNA)

```
Kelompokkan:
  Web:    80 (HTTP), 443 (HTTPS)
  Remote: 22 (SSH), 23 (Telnet), 3389 (RDP)
  Email:  25/587 (SMTP), 110/995 (POP3), 143/993 (IMAP)
  Infra:  53 (DNS), 67/68 (DHCP), 123 (NTP), 161/162 (SNMP), 514 (syslog)
  Routing:179 (BGP), OSPF (proto 89, no port)
  AAA:    1812/1813 (RADIUS), 49 (TACACS+)
  IPsec:  500/4500 (IKE), ESP=proto50, AH=proto51

Aman vs tidak (pola +TLS):
  HTTP 80 → HTTPS 443    |  FTP 21 → FTPS/SFTP 22
  Telnet 23 → SSH 22     |  SMTP 25 → 587/465
  IMAP 143 → 993         |  POP3 110 → 995   |  LDAP 389 → 636
```

⚠️ **UDP untuk yang cepat/toleran-loss:** DNS(53), DHCP(67/68), NTP(123), SNMP(161), Syslog(514), TFTP(69), **HTTP/3/QUIC(443)**. **TCP untuk yang andal:** HTTP(S), SSH, email, BGP.

---

**Lihat juga:** `05-transport/01` (port & socket), `06-aplikasi/*`, `referensi/glosarium.md`

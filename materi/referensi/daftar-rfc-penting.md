# Daftar RFC & Standar Penting

> RFC (Request for Comments, IETF) dan standar IEEE yang mendasari jaringan. Dikelompokkan per topik. Baca yang ★ untuk pemahaman mendalam. Akses: rfc-editor.org / datatracker.ietf.org.

---

## Arsitektur & Dasar Internet

| RFC/Std | Judul |
|---|---|
| RFC 1122/1123 | Requirements for Internet Hosts (model TCP/IP) |
| RFC 791 | Internet Protocol (IPv4) ★ |
| RFC 792 | ICMP |
| RFC 826 | ARP |
| RFC 1918 | Private Address Allocation ★ |
| RFC 6598 | CGNAT (100.64.0.0/10) |
| RFC 3927 | Link-Local (169.254/16, APIPA) |

## Transport

| RFC | Judul |
|---|---|
| RFC 9293 | TCP (menggantikan 793) ★ |
| RFC 768 | UDP ★ |
| RFC 9000 | QUIC ★ |
| RFC 5681 | TCP Congestion Control |
| RFC 3168 | ECN (Explicit Congestion Notification) |
| RFC 8312 | CUBIC |
| RFC 1191 / 8899 | Path MTU Discovery / PLPMTUD |

## Routing

| RFC | Judul |
|---|---|
| RFC 2328 | OSPFv2 ★ |
| RFC 5340 | OSPFv3 (IPv6) |
| RFC 4271 | BGP-4 ★ |
| RFC 7454 | BGP Operations & Security (BCP 194) |
| RFC 2453 | RIPv2 |
| RFC 7868 | EIGRP |
| RFC 5798 | VRRPv3 |
| RFC 4760 | MP-BGP (multiprotocol) |
| RFC 8481 / 6811 | RPKI Origin Validation |

## IPv6

| RFC | Judul |
|---|---|
| RFC 8200 | IPv6 Specification ★ |
| RFC 4291 | IPv6 Addressing Architecture ★ |
| RFC 4861 | Neighbor Discovery (NDP) |
| RFC 4862 | SLAAC |
| RFC 8415 | DHCPv6 |
| RFC 4193 | Unique Local Addresses |
| RFC 6146/6147 | NAT64/DNS64 |

## Aplikasi & Layanan

| RFC | Judul |
|---|---|
| RFC 1034/1035 | DNS (concepts/implementation) ★ |
| RFC 9364 | DNSSEC (BCP) |
| RFC 8484 | DNS over HTTPS (DoH) |
| RFC 7858 | DNS over TLS (DoT) |
| RFC 2131 | DHCP ★ |
| RFC 9110/9111/9112 | HTTP Semantics/Caching/HTTP1.1 ★ |
| RFC 9113 | HTTP/2 |
| RFC 9114 | HTTP/3 |
| RFC 8446 | TLS 1.3 ★ |
| RFC 5280 | X.509 PKI Certificates |
| RFC 8555 | ACME (Let's Encrypt) |
| RFC 5321/5322 | SMTP / Internet Message Format |
| RFC 7208 / 6376 / 7489 | SPF / DKIM / DMARC |
| RFC 5905 | NTPv4 |

## Keamanan

| RFC | Judul |
|---|---|
| RFC 4301 | IPsec Architecture ★ |
| RFC 7296 | IKEv2 |
| RFC 4303 | ESP |
| RFC 2865/2866 | RADIUS / Accounting |
| RFC 8907 | TACACS+ |
| RFC 9420 | MLS (konteks kripto modern) |

## Data Center & Overlay

| RFC | Judul |
|---|---|
| RFC 7348 | VXLAN ★ |
| RFC 7432 | BGP MPLS-Based EVPN ★ |
| RFC 8365 | EVPN over VXLAN |
| RFC 3031 | MPLS Architecture |

## QoS

| RFC | Judul |
|---|---|
| RFC 2474/2475 | DiffServ (DSCP) ★ |
| RFC 3246 | Expedited Forwarding (EF) |
| RFC 2597 | Assured Forwarding (AF) |
| RFC 8290 | CAKE (AQM) |
| RFC 8033 | PIE (AQM) |

## Otomasi & Manajemen

| RFC | Judul |
|---|---|
| RFC 6241 | NETCONF ★ |
| RFC 8040 | RESTCONF |
| RFC 7950 | YANG 1.1 |
| RFC 3411-3418 | SNMPv3 |
| RFC 5424 | Syslog |
| RFC 7011 | IPFIX (NetFlow) |
| RFC 8259 | JSON ★ |

---

## Standar IEEE 802 (LAN/MAN)

| Standar | Topik |
|---|---|
| **802.1D** | Spanning Tree Protocol (STP) |
| **802.1w** | Rapid STP (RSTP) |
| **802.1s** | Multiple STP (MSTP) |
| **802.1Q** | VLAN tagging ★ |
| **802.1X** | Port-Based Network Access Control ★ |
| **802.1AB** | LLDP |
| **802.3** | Ethernet ★ |
| **802.3ad / 802.1AX** | Link Aggregation (LACP) |
| **802.3af/at/bt** | PoE / PoE+ / PoE++ |
| **802.11a/b/g/n/ac/ax/be** | Wi-Fi (Wi-Fi 4=n, 5=ac, 6=ax, 7=be) ★ |
| **802.11i** | Keamanan Wi-Fi (WPA2) |

## NIST & Kerangka Keamanan

| Dokumen | Topik |
|---|---|
| NIST SP 800-207 | Zero Trust Architecture ★ |
| NIST SP 800-63B | Digital Identity (password/MFA) |
| NIST CSF | Cybersecurity Framework |
| MITRE ATT&CK | Taksonomi teknik serangan |
| CIS Benchmarks | Baseline hardening |
| MANRS | Norma keamanan routing (BGP) |

## Regulasi Indonesia (konteks)

| Regulasi | Topik |
|---|---|
| UU No. 11/2008 jo. 19/2016 (UU ITE) | Informasi & Transaksi Elektronik |
| UU No. 27/2022 (UU PDP) | Perlindungan Data Pribadi |
| PP No. 71/2019 | Penyelenggaraan Sistem & Transaksi Elektronik (kedaulatan data) |
| Aturan Komdigi/Kominfo | Spektrum frekuensi, penyelenggaraan telekomunikasi/internet |

---

> [!TIP]
> **Cara membaca RFC:** mulai dari Abstract & Introduction; RFC "Requirements" (mis. 1122) & "Architecture" memberi gambaran besar. Kata kunci normatif: **MUST/SHOULD/MAY** (RFC 2119). Status "BCP" (Best Current Practice) & "STD" (Standard) paling matang.

> [!WARNING]
> Beberapa RFC lama sudah digantikan (obsoleted), mis. TCP RFC 793 → 9293, HTTP RFC 2616 → 9110-9112. Selalu cek "Obsoleted by" di datatracker untuk versi terkini.

**Lihat juga:** bagian "Sumber" di tiap modul, `referensi/sumber-belajar.md`

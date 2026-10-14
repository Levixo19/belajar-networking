# Sumber Belajar Lanjutan

> Referensi eksternal untuk memperdalam setiap topik. Prioritaskan sumber **primer** (RFC, dokumentasi vendor, standar) dan sumber yang terus diperbarui.

---

## Sumber Primer (Paling Otoritatif)

```
RFC/IETF     → rfc-editor.org, datatracker.ietf.org (protokol internet)
IEEE 802     → standards.ieee.org (Ethernet, VLAN, Wi-Fi, 802.1X)
Cisco docs   → cisco.com/c/en/us/support (perintah, konfigurasi, desain CVD)
MikroTik     → help.mikrotik.com (dokumentasi RouterOS lengkap)
Linux man    → man7.org/linux/man-pages (ip, nft, ss, tcpdump)
NIST         → csrc.nist.gov (SP 800-207 Zero Trust, dll)
```

## Sertifikasi — Silabus & Materi Resmi

```
CCNA 200-301 → cisco.com (blueprint), Cisco Networking Academy (netacad.com)
  - Cisco Packet Tracer (lab gratis)
  - Cisco DevNet (developer.cisco.com — sandbox, API, otomasi)
CompTIA      → comptia.org (Network+ N10-009, Security+ objectives)
MikroTik     → mikrotik.com/training (MTCNA→MTCINE)
Juniper/Aruba/Fortinet/Palo Alto → situs vendor masing-masing
```

## Buku Rekomendasi

```
FONDASI & CCNA:
  - "CCNA 200-301 Official Cert Guide" (Wendell Odom) ★ standar emas CCNA
  - "Computer Networking: A Top-Down Approach" (Kurose & Ross) ★ akademis, konsep kuat
  - "TCP/IP Illustrated Vol.1" (Stevens/Fall) — mendalam TCP/IP
  - "CompTIA Network+ Study Guide" (Sybex) / Mike Meyers

ROUTING & LANJUTAN:
  - "Routing TCP/IP Vol I & II" (Jeff Doyle) ★ referensi routing klasik
  - "BGP in the Data Center" (Dinesh Dutta, O'Reilly, gratis)
  - "Network Warrior" (Gary Donahue) — praktik lapangan

DESAIN & DATA CENTER:
  - "Top-Down Network Design" (Priscilla Oppenheimer)
  - "Data Center Fundamentals" (Cisco Press)

KEAMANAN:
  - "Network Security Assessment" (O'Reilly)
  - Materi NIST & OWASP (gratis)

OTOMASI (NetDevOps):
  - "Network Programmability and Automation" (O'Reilly) ★
  - "Automate Your Network" / dokumentasi Ansible, Nornir, Netmiko

LINUX:
  - "Linux Networking Cookbook" / dokumentasi iproute2, nftables
```

## Lab & Praktik

```
Cisco Packet Tracer   → CCNA-level, gratis (netacad)
GNS3 / EVE-NG         → gns3.com, eve-ng.net (image nyata)
Cisco CML             → cisco.com (Modeling Labs, berbayar)
Containerlab          → containerlab.dev (modern, FRR/Arista/Nokia gratis)
Cisco DevNet Sandbox  → developer.cisco.com (perangkat Cisco + API gratis)
MikroTik CHR          → mikrotik.com (RouterOS gratis di VM)
Linux namespaces      → praktik langsung (Tahap 13, Lab 05)
Kathará / mininet     → emulator jaringan berbasis container/Linux
```

## Video & Kursus (verifikasi kualitas & tanggal)

```
- Cisco Networking Academy (netacad.com) — kursus resmi terstruktur
- Jeremy's IT Lab (YouTube) — CCNA gratis lengkap, sangat direkomendasikan
- David Bombal, NetworkChuck (YouTube) — praktis, MikroTik & CCNA
- Kanal MikroTik Indonesia (banyak materi RT-RW-Net berbahasa Indonesia)
- Platform kursus (Udemy/Coursera/Pluralsight) — pilih instruktur bereputasi
```
⚠️ Video cepat usang — selalu cek **tanggal** dan cocokkan dengan blueprint/dokumentasi terbaru.

## Komunitas & Diskusi

```
- Cisco Community (community.cisco.com), MikroTik Forum (forum.mikrotik.com)
- r/networking, r/ccna, r/mikrotik (Reddit)
- NANOG (nanog.org) — operator jaringan, milis & presentasi (BGP/ISP)
- Komunitas lokal: grup Telegram/Facebook MikroTik & jaringan Indonesia
- Stack Exchange: Network Engineering, Server Fault
```

## Alat & Referensi Cepat

```
Subnet calculator     → banyak online (tapi LATIH manual untuk ujian!)
Wireshark             → wireshark.org (analisis paket, wajib dikuasai)
subnetting practice   → subnettingpractice.com, latihan berwaktu
BGP looking glass     → lihat routing internet nyata (bgp.tools, RIPEstat)
IANA registries       → iana.org (port, protokol, alokasi IP)
Hurricane Electric    → he.net (sertifikasi IPv6 gratis, BGP toolkit)
```

## Observability & Monitoring (praktik)

```
Wireshark/tshark, tcpdump  → analisis paket
Prometheus + Grafana        → metrik & dashboard modern
LibreNMS / Zabbix / Observium → NMS open-source
The Dude (MikroTik)         → NMS gratis MikroTik
ntopng, NetFlow collectors  → analisis flow
```

## Otomasi (praktik)

```
Python: Netmiko, NAPALM, Nornir, Scrapli, ncclient, Scapy, pyATS/Genie
Ansible: cisco.ios, arista.eos, community.routeros
IaC: Terraform
SoT: NetBox / Nautobot
Validasi: Batfish · Lab: Containerlab · CI/CD: GitLab CI/GitHub Actions
```

---

## Cara Belajar Efektif (saran)

```
1. Pahami KONSEP dulu (kurikulum ini) — jangan hafal perintah buta.
2. PRAKTIK segera di lab (Packet Tracer/CHR/Linux) — konfigurasikan sendiri.
3. RUSAK & PERBAIKI — troubleshooting melatih pemahaman terdalam.
4. DOKUMENTASIKAN (blog/GitHub) — mengajar = belajar; sekaligus portofolio.
5. Baca SUMBER PRIMER untuk hal yang membingungkan (RFC/dokumentasi vendor).
6. Bergabung KOMUNITAS — bertanya & menjawab mempercepat belajar.
7. Ikuti perkembangan — jaringan berevolusi (Wi-Fi 7, SDN, otomasi, cloud).
```

💡 **Kombinasi terbaik untuk pemula Indonesia:** kurikulum ini (konsep + 3 platform) → Jeremy's IT Lab (CCNA video) → Packet Tracer & MikroTik CHR (praktik) → sertifikasi (CCNA/MTCNA) → portofolio GitHub → komunitas. Fokus pemahaman + praktik, bukan mengejar banyak sertifikat.

⚠️ **Hati-hati sumber usang atau salah.** Jaringan berubah; verifikasi terhadap sumber primer & tanggal terbaru. Kurikulum ini disusun dari blueprint & standar terkini, tetapi selalu cek pembaruan resmi sebelum ujian.

---

**Lihat juga:** bagian "Sumber" & "Berikutnya" di setiap modul, `18-karier-sertifikasi/*` (peta sertifikasi & karier)

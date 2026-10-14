# 12.6 — Alat Keamanan Jaringan

> **Prasyarat:** `12-keamanan/01`–`05`, `14-monitoring-troubleshooting/02` (akan dibahas)
> **Tujuan:** Anda mengenal alat keamanan utama, tahu kapan memakainya, dan memahami batasan hukum serta etikanya.

> ⚠️ **PERINGATAN HUKUM DAN ETIKA (baca dulu):** semua alat di modul ini hanya boleh dipakai pada **sistem yang Anda miliki** atau yang Anda punya **izin tertulis** untuk mengujinya. Di Indonesia, akses tidak sah ke sistem elektronik diatur **UU ITE** (UU No. 11/2008 jo. UU No. 19/2016) dengan ancaman pidana. Pemindaian, pengujian penetrasi, dan analisis trafik terhadap sistem orang lain **tanpa izin adalah tindak pidana** — bahkan jika niatnya baik.

---

## 1. Kerangka Etika dan Legal

### Sebelum melakukan pengujian apa pun

```
1. IZIN TERTULIS — dari pemilik sistem, dengan tanda tangan yang berwenang
2. SCOPE yang jelas — sistem/alamat mana yang boleh diuji, mana yang TIDAK
3. RULES OF ENGAGEMENT — kapan, seberapa agresif, siapa dihubungi
4. WAKTU yang disepakati — hindari jam sibuk kalau ada risiko gangguan
5. KONTAK DARURAT — kalau terjadi sesuatu
6. PENANGANAN DATA — bagaimana temuan disimpan dan dilaporkan
7. BATASAN — tidak ada DoS, tidak ada modifikasi data, dst
```

### Jenis pengujian keamanan yang sah

| Jenis | Tujuan | Otorisasi |
|---|---|---|
| **Vulnerability assessment** | Menemukan kelemahan | Internal atau berizin |
| **Penetration testing** | Mengeksploitasi untuk membuktikan dampak | Kontrak + scope ketat |
| **Red team** | Simulasi serangan nyata (tersembunyi) | Manajemen puncak |
| **Bug bounty** | Menemukan bug dengan imbalan | Dalam program resmi |
| **CTF** | Latihan di lingkungan yang dirancang | Kompetisi |
| **Audit konfigurasi** | Memeriksa kepatuhan | Internal |

⚠️ **"Saya cuma iseng cek keamanan mereka" bukan pembelaan hukum.** Tanpa izin, itu tetap tindak pidana.

---

## 2. Discovery dan Scanning

### nmap — Network Mapper

Alat pemindaian jaringan yang paling penting.

```bash
# Host discovery (siapa yang hidup)
$ nmap -sn 192.168.1.0/24

# TCP SYN scan (default, cepat, "half-open")
$ sudo nmap -sS 192.168.1.10

# Semua port
$ sudo nmap -sS -p- 192.168.1.10

# Deteksi versi layanan
$ nmap -sV 192.168.1.10

# Deteksi OS
$ sudo nmap -O 192.168.1.10

# Script default (aman) + versi
$ nmap -sC -sV 192.168.1.10

# UDP scan (lambat, sering tidak akurat)
$ sudo nmap -sU --top-ports 100 192.168.1.10

# Scan agresif (semua di atas — berisik!)
$ sudo nmap -A 192.168.1.10

# Timing (T0 paling pelan/siluman, T5 paling cepat/berisik)
$ nmap -T2 192.168.1.10

# Skip host discovery (untuk host yang memblokir ping)
$ nmap -Pn 192.168.1.10

# NSE — script untuk tugas spesifik
$ nmap --script ssl-enum-ciphers -p 443 example.com
$ nmap --script smb-vuln-* 192.168.1.10
$ nmap --script broadcast-dhcp-discover        # temukan rogue DHCP
$ nmap --script dns-zone-transfer example.com
```

⚠️ **Pemindaian tidak "tak terlihat".** IDS/IPS mendeteksinya, dan pemindaian agresif bisa **mengganggu** perangkat rapuh (perangkat IoT, printer, sistem SCADA lama bisa crash). Gunakan timing yang wajar dan hindari sistem produksi kritis.

### Alat discovery lain

```bash
$ masscan -p1-65535 10.0.0.0/8 --rate=10000    # pemindai sangat cepat
$ arp-scan --localnet                           # host di LAN via ARP
$ fping -a -g 192.168.1.0/24                     # ping sweep cepat
$ netdiscover -r 192.168.1.0/24                  # discovery pasif+aktif
$ dnsrecon -d example.com                        # enumerasi DNS
$ theHarvester -d example.com -b all             # OSINT (email, subdomain)
```

💡 **Shodan** (https://shodan.io) memindai seluruh internet — cari apa yang **terekspos dari organisasi Anda sendiri**: `org:"PT Perusahaan"` atau `net:203.0.113.0/24`. Sering mengungkap layanan yang tidak seharusnya publik.

---

## 3. Vulnerability Scanning

| Alat | Jenis | Catatan |
|---|---|---|
| **OpenVAS / Greenbone** | Umum, open source | Gratis, lengkap |
| **Nessus** | Umum, komersial | Standar industri |
| **Qualys / Rapid7** | Cloud-based | Enterprise |
| **Nikto** | Web server | Cepat, banyak false positive |
| **nuclei** | Template-based | Modern, cepat, komunitas aktif |
| **testssl.sh / sslyze** | Konfigurasi TLS | Fokus SSL/TLS |

```bash
# testssl.sh — audit TLS lengkap
$ testssl.sh example.com

# nuclei — pemindaian berbasis template
$ nuclei -u https://example.com -t cves/

# Nikto — web server
$ nikto -h https://example.com
```

⚠️ **Vulnerability scanner menghasilkan banyak false positive.** Setiap temuan harus **diverifikasi manual** sebelum ditindaklanjuti. "3.000 kerentanan kritis" sering kali sebagian besar tidak relevan atau tidak dapat dieksploitasi di konteks Anda.

💡 **Prioritaskan berdasarkan risiko nyata, bukan skor CVSS mentah** — kerentanan CVSS 9.8 pada sistem internal yang tersegmentasi mungkin kurang mendesak daripada CVSS 6.5 pada server yang terekspos internet.

---

## 4. Analisis Trafik

### tcpdump

```bash
# Dasar
$ sudo tcpdump -ni eth0

# Filter BPF
$ sudo tcpdump -ni eth0 host 192.168.1.10
$ sudo tcpdump -ni eth0 'tcp port 443'
$ sudo tcpdump -ni eth0 'tcp port 443 and host 192.168.1.10'
$ sudo tcpdump -ni eth0 'tcp[tcpflags] & (tcp-syn) != 0 and tcp[tcpflags] & (tcp-ack) == 0'

# Simpan ke file untuk Wireshark
$ sudo tcpdump -ni eth0 -w capture.pcap 'port 443'
$ sudo tcpdump -r capture.pcap

# Lihat isi (hex + ASCII)
$ sudo tcpdump -ni eth0 -X 'port 80'
```

### Wireshark

Analisis mendalam dengan GUI. Detail lengkap di `14-monitoring-troubleshooting/02`.

```
Display filter untuk keamanan:
  tcp.flags.syn==1 && tcp.flags.ack==0    ← SYN scan
  tcp.analysis.retransmission             ← masalah/serangan
  dns.qry.name contains "suspicious"
  http.request.method == "POST"
  tls.handshake.type == 1                 ← ClientHello (lihat SNI)
  arp.duplicate-address-detected          ← ARP spoofing
  wlan.fc.type_subtype == 0x0c            ← deauth attack
```

⚠️ **Menangkap trafik jaringan orang lain adalah penyadapan** — ilegal tanpa izin, bahkan di jaringan yang Anda kelola (ada implikasi privasi karyawan). Punya kebijakan yang jelas dan pemberitahuan.

---

## 5. Pengujian dan Simulasi

### hping3 — pembuat paket

```bash
# Uji apakah port terbuka (TCP SYN)
$ sudo hping3 -S -p 443 -c 3 example.com

# Uji firewall (kirim flag berbeda)
$ sudo hping3 -A -p 443 example.com          # ACK — uji stateful firewall
$ sudo hping3 -F -p 443 example.com          # FIN scan

# Traceroute berbasis TCP
$ sudo hping3 -S -p 443 --traceroute example.com
```

⚠️ **hping3 juga bisa dipakai untuk SYN flood** — hanya pada sistem Anda sendiri untuk menguji ketahanan.

### iperf3 — uji kapasitas dan stress

```bash
# Server
$ iperf3 -s
# Klien
$ iperf3 -c server -t 30
$ iperf3 -c server -u -b 1G                   # UDP, uji flood/loss
```

### Scapy — pembuatan paket dengan Python

```python
from scapy.all import *

# Kirim paket ICMP kustom
send(IP(dst="192.168.1.1")/ICMP())

# Uji respons TCP
ans = sr1(IP(dst="192.168.1.10")/TCP(dport=443, flags="S"), timeout=2)
if ans and ans[TCP].flags == "SA":
    print("Port 443 terbuka")

# Analisis paket dari capture
packets = rdpcap("capture.pcap")
for p in packets:
    if p.haslayer(DNS):
        print(p[DNS].qd.qname)
```

💡 **Scapy sangat berguna untuk memahami protokol** — Anda bisa membuat paket apa pun dan melihat responsnya. Untuk network engineer, ini alat pembelajaran yang luar biasa.

---

## 6. Alat Serangan (untuk Pengujian Berizin)

⚠️ **Semua alat di bawah hanya untuk lab, CTF, atau pengujian berizin.**

| Alat | Fungsi | Kategori |
|---|---|---|
| **Metasploit** | Framework eksploitasi | Pentest |
| **Ettercap / Bettercap** | MITM, ARP spoofing | Analisis L2 |
| **aircrack-ng** | Audit Wi-Fi | Wireless |
| **hashcat / John** | Cracking password | Audit kekuatan password |
| **hydra** | Brute force login | Pentest |
| **Yersinia** | Serangan L2 (STP, DTP, DHCP) | Uji hardening L2 |
| **responder** | LLMNR/NBT-NS poisoning | Pentest AD |
| **Burp Suite** | Pengujian aplikasi web | Web pentest |
| **Kali Linux / Parrot** | Distribusi berisi semua alat | Platform pentest |

💡 **Memahami alat serangan membuat Anda pembela yang lebih baik.** Menguji hardening L2 Anda dengan Yersinia (di lab) memverifikasi bahwa DHCP snooping dan BPDU guard benar-benar bekerja.

### Contoh: menguji hardening L2 sendiri

```bash
# Di lab — uji apakah DHCP snooping bekerja
$ sudo yersinia dhcp -attack 1        # DHCP starvation
# → di switch: pool tidak boleh habis, port di-rate-limit

# Uji apakah BPDU guard bekerja
$ sudo yersinia stp -attack 4         # klaim root bridge
# → di switch: port harus err-disabled
```

---

## 7. Deteksi dan Monitoring

### IDS/IPS Open Source

```bash
# Suricata — IDS/IPS modern, multi-thread
$ suricata -c /etc/suricata/suricata.yaml -i eth0
$ tail -f /var/log/suricata/fast.log

# Snort — IDS/IPS klasik
$ snort -A console -q -c /etc/snort/snort.conf -i eth0

# Zeek (Bro) — network security monitoring (bukan signature, tetapi analisis)
$ zeek -i eth0
$ cat conn.log http.log dns.log ssl.log
```

💡 **Zeek berbeda dari Snort/Suricata** — ia tidak mencari tanda tangan serangan, melainkan **mencatat semua aktivitas jaringan secara terstruktur** (setiap koneksi, DNS query, sertifikat TLS, transfer file). Ini emas untuk investigasi dan berburu ancaman.

### Log analysis dan SIEM

```
Open source : Wazuh, Security Onion, Graylog, ELK/OpenSearch
Komersial   : Splunk, Microsoft Sentinel, IBM QRadar

Yang dikorelasikan:
  - Log perangkat jaringan (syslog)
  - Log firewall
  - Log autentikasi (RADIUS/TACACS+/AD)
  - NetFlow/IPFIX
  - Log IDS/IPS
  - Log endpoint (EDR)
  - Log DNS
```

💡 **Security Onion** adalah distribusi lengkap yang menggabungkan Suricata + Zeek + Wazuh + dashboard — titik awal yang sangat baik untuk network security monitoring.

### Analisis alur — NetFlow

```
Deteksi berbasis alur (tanpa membaca isi paket):
  - Beaconing (koneksi berkala teratur → C2)
  - Port scan (satu sumber ke banyak port/host)
  - Eksfiltrasi (volume upload tidak wajar)
  - DDoS (banyak sumber ke satu tujuan)
  - Lateral movement (koneksi antar-host internal yang tidak biasa)
```

Detail di `14-monitoring-troubleshooting/03`.

---

## 8. Alat Audit dan Kepatuhan

```bash
# Audit konfigurasi jaringan
- Cisco Config Analysis Tool / CIS-CAT
- Nipper (audit konfigurasi router/switch/firewall)
- Batfish (analisis konfigurasi jaringan sebagai kode)

# Audit host
- Lynis (audit hardening Linux)
- CIS-CAT (benchmark CIS)

# Audit cloud
- ScoutSuite, Prowler (AWS/Azure/GCP)
- kube-bench (Kubernetes)
```

💡 **Batfish** sangat menarik untuk network engineer — ia mem-parsing konfigurasi router/switch/firewall dan bisa **menjawab pertanyaan tentang jaringan tanpa menyentuh perangkat**: "apakah host A bisa mencapai host B?", "apakah ada ACL yang tumpang tindih?", "apa dampak perubahan ini?". Dipakai dalam pipeline CI/CD jaringan (`15-otomasi`).

---

## 9. Alat Bawaan MikroTik

MikroTik punya banyak alat diagnostik dan keamanan bawaan.

```
# Torch — analisis trafik real-time (siapa memakai bandwidth apa)
/tool torch interface=ether1 src-address=192.168.1.0/24

# Sniffer — capture paket, bisa dikirim ke Wireshark (protokol TZSP)
/tool sniffer set filter-interface=ether1 streaming-enabled=yes \
    streaming-server=192.168.99.50
/tool sniffer start

# Deteksi rogue DHCP
/ip dhcp-server alert add interface=bridge-LAN valid-server=00:11:22:33:44:55

# Netwatch — monitoring dengan aksi
/tool netwatch add host=192.168.1.10 interval=10s

# Profile — proses apa yang memakan CPU (deteksi anomali)
/tool profile

# Bandwidth test (uji kapasitas — matikan servernya di produksi!)
/tool bandwidth-test address=10.0.0.2

# IP scan
/tool ip-scan address-range=192.168.1.0/24
```

⚠️ **`/tool sniffer` menangkap trafik** — sama seperti Wireshark, hanya untuk jaringan yang Anda kelola dengan kebijakan yang jelas.

---

## 10. Membangun Lab yang Aman

Untuk berlatih dengan alat serangan **secara legal**, bangun lab terisolasi.

```
Pilihan lab (lihat lab/00-setup-lab.md):
  - Containerlab / GNS3 / EVE-NG (perangkat jaringan)
  - VirtualBox / KVM / Proxmox (host)
  - MikroTik CHR (gratis, batas 1 Mbps)

Target latihan yang sengaja rentan (HANYA di lab terisolasi):
  - Metasploitable 2/3
  - DVWA (Damn Vulnerable Web Application)
  - VulnHub / HackTheBox / TryHackMe (platform legal)
  - OWASP Juice Shop

Aturan lab:
  ✅ TERISOLASI dari jaringan produksi dan internet
  ✅ Jelas ini lingkungan latihan
  ❌ JANGAN pernah arahkan alat serangan ke sistem nyata
```

💡 **HackTheBox, TryHackMe, dan CTF** memberi lingkungan legal untuk mempraktikkan keterampilan ofensif. Ini cara yang tepat untuk belajar — bukan menyerang sistem orang lain.

---

## 11. Ringkasan

- ⚠️ **Semua alat ini hanya untuk sistem Anda sendiri atau dengan izin tertulis.** Akses tidak sah = pidana (UU ITE di Indonesia). "Iseng" bukan pembelaan.
- Sebelum menguji: **izin tertulis, scope, rules of engagement, waktu, kontak darurat**.
- **nmap** adalah alat discovery utama; **Shodan** untuk melihat apa yang terekspos dari organisasi Anda sendiri.
- **Vulnerability scanner banyak false positive** — verifikasi manual, prioritaskan berdasarkan risiko nyata bukan skor CVSS mentah.
- **tcpdump/Wireshark** untuk analisis trafik; menangkap trafik = penyadapan, butuh kebijakan yang jelas.
- **hping3, Scapy** untuk pengujian paket kustom; **iperf3** untuk stress test.
- **Alat serangan (Metasploit, aircrack-ng, Yersinia, dll) hanya untuk lab/CTF/pentest berizin** — tetapi memahaminya membuat Anda pembela yang lebih baik; uji hardening Anda sendiri dengannya.
- Deteksi: **Suricata/Snort** (signature), **Zeek** (analisis perilaku), **Security Onion** (paket lengkap), **SIEM** untuk korelasi.
- **Batfish** menganalisis konfigurasi jaringan sebagai kode; **Nipper/Lynis/CIS-CAT** untuk audit.
- **MikroTik** punya alat bawaan: torch, sniffer, netwatch, DHCP alert, profile, ip-scan.
- **Berlatih di lab terisolasi** (Containerlab, Metasploitable, DVWA) atau platform legal (HackTheBox, TryHackMe, CTF) — jangan pernah menyerang sistem nyata.

---

## 12. Latihan

1. Anda ingin "memeriksa keamanan" jaringan Wi-Fi tetangga karena penasaran. Apakah ini legal? Jelaskan.
2. Apa yang harus disiapkan sebelum melakukan penetration test terhadap jaringan klien?
3. Kenapa vulnerability scanner tidak boleh dipercaya sepenuhnya?
4. Bagaimana memakai nmap untuk menemukan apa yang terekspos dari organisasi Anda sendiri?
5. Apa perbedaan Zeek dan Suricata dalam pendekatan deteksi?
6. Kenapa memahami alat serangan penting bagi seorang pembela?
7. Rekan Anda menyarankan menjalankan `nmap -A -T5` ke seluruh jaringan produksi termasuk sistem SCADA pabrik. Apa kekhawatiran Anda?
8. Anda ingin belajar keterampilan ofensif secara legal. Apa pilihan Anda?

<details>
<summary>Jawaban</summary>

1. **Tidak legal.** Memindai, mencoba masuk, atau menangkap trafik jaringan Wi-Fi tetangga tanpa izin adalah **akses tidak sah ke sistem elektronik** dan **penyadapan** — keduanya diatur UU ITE di Indonesia dengan ancaman pidana. "Penasaran" atau "cuma cek" **bukan pembelaan hukum**. Bahkan menangkap trafik yang tidak terenkripsi dari udara (yang secara teknis mudah) tetap merupakan intersepsi ilegal.
   Kalau Anda ingin berlatih audit Wi-Fi, gunakan **jaringan Anda sendiri** atau lab terisolasi dengan AP yang Anda miliki.

2. **Dokumen dan kesepakatan formal:** (a) **izin tertulis** yang ditandatangani pihak yang **berwenang secara hukum** atas sistem itu (bukan sekadar admin IT) — sering disebut "authorization to test" atau "get-out-of-jail-free letter"; (b) **scope** yang eksplisit — alamat IP, domain, dan aplikasi mana yang **boleh** dan **tidak boleh** diuji; (c) **rules of engagement** — teknik apa yang diizinkan (mis. tanpa DoS, tanpa social engineering, tanpa modifikasi data), tingkat agresivitas, dan jam pengujian; (d) **kontak darurat** kedua belah pihak jika terjadi gangguan; (e) **kesepakatan penanganan data** — bagaimana temuan (yang mungkin berisi data sensitif) disimpan, dilaporkan, dan dimusnahkan; (f) **kontrak/NDA** yang mengatur tanggung jawab hukum. Tanpa semua ini, pengujian sebaik apa pun tetap berisiko pidana dan perdata.

3. Karena **vulnerability scanner menghasilkan banyak false positive** (dan kadang false negative). Ia bekerja dengan mencocokkan versi software, banner, dan pola respons terhadap basis data kerentanan — tetapi: (a) versi yang terdeteksi bisa salah atau sudah di-backport patch-nya oleh distribusi Linux tanpa mengubah nomor versi; (b) kerentanan yang "ditemukan" mungkin **tidak dapat dieksploitasi** di konfigurasi Anda (fitur yang rentan tidak aktif, atau ada mitigasi lain); (c) konteks tidak diperhitungkan — sistem internal yang tersegmentasi ketat berbeda risikonya dengan yang terekspos internet.
   Karena itu setiap temuan harus **diverifikasi manual**, dan prioritas ditentukan oleh **risiko nyata** (dapat dieksploitasi? terekspos? aset penting?) bukan sekadar skor CVSS mentah. Laporan "3.000 kerentanan kritis" yang tidak diverifikasi lebih membingungkan daripada membantu.

4. Lakukan **pemindaian eksternal terhadap rentang alamat publik milik organisasi Anda sendiri**, dari lokasi di luar jaringan (mis. VPS atau koneksi rumah):
   ```
   nmap -sS -sV --top-ports 1000 -Pn <blok-IP-publik-Anda>
   nmap -sU --top-ports 100 <blok-IP-publik-Anda>
   ```
   Tujuannya melihat **apa yang dilihat penyerang**: layanan apa yang terbuka, versi apa yang terungkap dari banner, dan apakah ada yang tidak seharusnya publik (RDP, panel admin, database, SSH ke perangkat manajemen). Lengkapi dengan **Shodan** (`net:203.0.113.0/24` atau `org:"Nama Organisasi"`) yang sudah memindai internet dan sering mengungkap sistem yang terlupakan. Ini **legal** karena sistemnya milik Anda, dan sangat berharga — banyak pelanggaran dimulai dari layanan terekspos yang tidak disadari.

5. **Suricata (dan Snort)** memakai pendekatan **signature-based / rule-based** — ia mencocokkan trafik terhadap **tanda tangan serangan yang diketahui** (pola byte, string, perilaku spesifik). Kalau cocok, ia memberi alarm atau memblokir. Kuat untuk mendeteksi serangan yang diketahui secara **akurat dan cepat**, tetapi buta terhadap serangan baru yang belum ada tanda tangannya.
   **Zeek** memakai pendekatan **network security monitoring / analisis perilaku** — ia **tidak mencari tanda tangan**, melainkan **mencatat semua aktivitas jaringan secara terstruktur**: setiap koneksi (conn.log), setiap query DNS (dns.log), setiap sertifikat TLS (ssl.log), setiap transfer file, dengan metadata kaya. Ini tidak langsung memberi "alarm serangan", tetapi memberi **visibilitas mendalam** untuk investigasi, berburu ancaman, dan mendeteksi anomali (beaconing, eksfiltrasi, domain aneh).
   Keduanya **saling melengkapi**: Suricata menangkap yang diketahui, Zeek memberi konteks dan menangkap yang tidak biasa. Security Onion menggabungkan keduanya.

6. Karena **Anda tidak bisa bertahan dari apa yang tidak Anda pahami**. Memahami cara kerja alat serangan memungkinkan Anda: (a) **memverifikasi bahwa kontrol Anda benar-benar bekerja** — menguji hardening L2 dengan Yersinia (di lab) membuktikan DHCP snooping dan BPDU guard aktif dan efektif, bukan sekadar dikonfigurasi; (b) **mengenali serangan** saat terjadi — Anda tahu seperti apa pola ARP spoofing atau SYN flood di capture; (c) **memprioritaskan pertahanan** — Anda tahu jalan masuk mana yang paling sering dan mudah dipakai penyerang; (d) **berpikir seperti penyerang** saat merancang — mengantisipasi bagaimana sistem Anda bisa disalahgunakan; (e) **berkomunikasi dengan tim keamanan** menggunakan bahasa dan konsep yang sama. Ini prinsip di balik "purple team" — menggabungkan perspektif ofensif dan defensif.

7. Beberapa kekhawatiran serius: (a) **`-T5` (timing agresif) dapat mengganggu atau meng-crash perangkat rapuh** — sistem SCADA/ICS, PLC, perangkat medis, printer, dan IoT lama sering memakai stack jaringan yang lemah dan bisa **berhenti berfungsi** ketika dibanjiri probe. Di lingkungan pabrik, ini bisa berarti **menghentikan produksi atau menciptakan bahaya keselamatan**. (b) **`-A` melakukan OS detection, version scan, dan NSE scripts** — sangat berisik dan invasif; beberapa script bisa memicu perilaku tak terduga. (c) **Sistem SCADA sering tidak boleh disentuh sama sekali** tanpa koordinasi dengan tim OT dan jendela pemeliharaan — ada standar khusus (IEC 62443) yang mengaturnya. (d) Pemindaian produksi tanpa pemberitahuan bisa **memicu respons insiden palsu** dan membuang waktu tim keamanan.
   **Yang seharusnya:** dapatkan otorisasi dan koordinasi dengan tim OT; **kecualikan sistem SCADA/ICS** dari pemindaian aktif (gunakan metode pasif untuk mereka); pakai timing konservatif (`-T2` atau `-T3`); lakukan di jendela pemeliharaan; dan mulai dari subset kecil untuk menguji dampak sebelum memperluas.

8. Pilihan yang **legal dan etis**: (a) **Platform latihan online** — HackTheBox, TryHackMe, PortSwigger Web Security Academy, PentesterLab — menyediakan target yang sengaja rentan dalam lingkungan yang legal dan dirancang untuk belajar. (b) **CTF (Capture The Flag)** — kompetisi keamanan yang legal, dari pemula sampai mahir (CTFtime.org mendaftar banyak event). (c) **Lab lokal terisolasi** — bangun sendiri dengan VirtualBox/KVM/Proxmox, isi dengan target rentan seperti Metasploitable, DVWA, OWASP Juice Shop, atau VulnHub; **isolasi dari jaringan produksi dan internet**. (d) **Bug bounty** — program resmi (HackerOne, Bugcrowd) di mana perusahaan **mengundang** Anda menguji sistem mereka dengan aturan yang jelas dan imbalan. (e) **Sertifikasi praktis** — OSCP, eJPT, PNPT memberi lab dan metodologi. (f) **Jaringan/sistem milik sendiri**. Yang **tidak** boleh: mengarahkan alat apa pun ke sistem yang bukan milik Anda dan tanpa izin — sekalipun untuk "belajar".

</details>

---

## 13. Sumber

- nmap — https://nmap.org/book/
- Wireshark — https://www.wireshark.org/docs/
- Suricata — https://suricata.io/ · Zeek — https://zeek.org/ · Security Onion — https://securityonionsolutions.com/
- Batfish — https://www.batfish.org/
- OWASP Testing Guide — https://owasp.org/www-project-web-security-testing-guide/
- UU No. 11/2008 jo. UU No. 19/2016 tentang ITE (Indonesia)
- Cisco CCNA 200-301 v1.1, topik 5.1 dan 5.6
- MikroTik Tools — https://help.mikrotik.com/docs/display/ROS/Tools

---

**Berikutnya:** `13-linux-networking/01-iproute2.md` — memasuki jaringan Linux secara praktis.

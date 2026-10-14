# 14.2 — Alat Troubleshooting dan Cara Menafsirkannya

> **Prasyarat:** `14-monitoring-troubleshooting/01`, `04-network-layer/04`, `05-transport/02`
> **Tujuan:** Anda menguasai alat diagnostik utama dan — yang lebih penting — bisa **menafsirkan hasilnya dengan benar**.

> 📌 **Yang membedakan pemula dan ahli bukan mengetahui perintahnya, tetapi tahu cara MEMBACA hasilnya.** Modul ini fokus pada penafsiran.

---

## 1. ping — dan Cara Salah Menafsirkannya

```bash
$ ping -c 5 8.8.8.8
64 bytes from 8.8.8.8: icmp_seq=1 ttl=115 time=12.3 ms
...
rtt min/avg/max/mdev = 11.8/20.4/45.2/14.2 ms
```

**Membaca dengan benar:**
```
min 11.8   → latency terbaik (mendekati propagasi murni)
avg 20.4   → rata-rata
max 45.2   → terburuk (ada queuing/beban)
mdev 14.2  → deviasi = indikator JITTER (tinggi = buruk untuk real-time)
0% loss    → bagus (tetapi lihat peringatan di bawah)
```

⚠️ **Kesalahan penafsiran ping yang umum:**

1. **"Ping gagal = host mati"** — SALAH. Firewall sering memblokir ICMP; host bisa hidup dan melayani trafik lain. Uji dengan `nc -zv host port` sebagai gantinya.

2. **"Ping tinggi ke router = router bermasalah"** — SALAH. Router sering memberi **prioritas rendah** untuk menjawab ping (control plane) sambil **meneruskan trafik dengan cepat** (data plane). Yang penting latency ke **tujuan akhir**, bukan ke router perantara.

3. **"0% loss = jaringan sehat"** — TIDAK CUKUP. **Bufferbloat** memberi 0% loss dengan latency 2000 ms. Selalu periksa latency **di bawah beban**, bukan hanya saat idle.

4. **"Latency stabil"** — periksa `mdev`. Latency rata-rata 20 ms dengan mdev 15 ms (berayun 5–45 ms) jauh lebih buruk untuk VoIP daripada latency stabil 50 ms.

```bash
# Opsi penting
$ ping -c 10 host                    # jumlah paket
$ ping -i 0.2 host                   # interval cepat
$ ping -s 1472 -M do host            # uji MTU (DF bit)
$ ping -I eth1 host                  # tentukan interface sumber
$ ping -D host                       # timestamp per baris (untuk log)
$ ping -f host                       # flood (root; hati-hati)
```

---

## 2. traceroute / mtr — dan Salah Tafsir yang Fatal

```bash
$ traceroute -n 8.8.8.8
 1  192.168.1.1      0.5 ms   0.5 ms   0.5 ms
 2  10.20.30.1       8.2 ms   8.1 ms   8.2 ms
 3  * * *
 4  103.10.20.30    12.4 ms  12.4 ms  12.4 ms
 5  103.10.20.34   450.0 ms  12.5 ms  12.5 ms
 6  8.8.8.8         12.6 ms  12.6 ms  12.6 ms
```

⚠️ **Empat kesalahan penafsiran traceroute yang FATAL:**

**1. `* * *` bukan berarti masalah.**
Router bisa: dikonfigurasi tidak mengirim ICMP Time Exceeded, melakukan rate limiting ICMP, atau berada di dalam MPLS cloud. **Kalau hop SETELAHNYA menjawab normal, jalur baik-baik saja.** Dalam contoh, hop 3 tidak menjawab tetapi hop 4–6 normal → tidak ada masalah.

**2. Latency tinggi di hop tengah bukan berarti hop itu bermasalah.**
Hop 5 menunjukkan 450 ms di kolom pertama tetapi 12,5 ms di kolom lain, dan hop 6 (tujuan) hanya 12,6 ms. Ini **normal** — router hop 5 lambat **menjawab** ICMP (prioritas rendah) tetapi **meneruskan** trafik dengan cepat. **Yang penting latency di hop TERAKHIR.**

**3. Latency yang naik dan TETAP tinggi sampai akhir = masalah nyata.**
```
 4   12 ms
 5  180 ms
 6  185 ms
 7  190 ms   ← naik di hop 5 dan tidak turun → masalah antara hop 4 dan 5
```

**4. Jalur pergi ≠ jalur pulang.**
Traceroute hanya menunjukkan jalur **pergi**. Latency tinggi bisa berasal dari jalur **pulang** yang berbeda dan tidak terlihat.

### mtr — traceroute + statistik berkelanjutan

```bash
$ mtr -n -r -c 100 8.8.8.8
HOST: laptop            Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- 192.168.1.1      0.0%   100    0.5   0.6   0.4   2.1   0.2
  2.|-- 10.20.30.1       0.0%   100    8.2   8.5   8.0  15.3   1.1
  3.|-- 103.10.20.30    12.0%   100   12.4  13.1  12.0  45.2   4.2
  4.|-- 8.8.8.8          0.0%   100   12.6  12.8  12.3  18.9   0.8
```

⚠️ **Kesalahan penafsiran mtr:**
```
Loss di hop TENGAH yang tidak muncul di hop AKHIR = NORMAL
→ hop 3 menunjukkan 12% loss, tetapi hop 4 (tujuan) 0%
→ itu ICMP rate limiting di hop 3, BUKAN packet loss sesungguhnya

Loss yang PERSISTEN dari satu hop sampai AKHIR = masalah nyata
→ kalau hop 3 dan 4 keduanya 12% loss → ada masalah mulai hop 3
```

💡 **Aturan emas traceroute/mtr: fokus pada HOP TERAKHIR (tujuan).** Hop perantara sering menampilkan angka yang menyesatkan.

```bash
$ traceroute -I 8.8.8.8              # mode ICMP (kalau UDP diblokir)
$ traceroute -T -p 443 8.8.8.8       # mode TCP SYN (paling sering lolos firewall)
$ mtr -T -P 443 8.8.8.8              # mtr mode TCP
```

---

## 3. DNS: dig / nslookup

```bash
$ dig example.com
$ dig +short example.com             # jawaban saja
$ dig +trace example.com             # LACAK dari root (sangat berguna)
$ dig +norecurse @8.8.8.8 example.com  # apa yang server ini tahu sendiri
$ dig -x 93.184.216.34               # reverse
$ dig example.com MX
$ dig +dnssec example.com
$ dig +cd example.com                # checking disabled (uji DNSSEC)
```

**Membaca status:**
```
NOERROR   → berhasil (tetapi ANSWER bisa 0 = nama ada, tipe record tidak)
NXDOMAIN  → nama TIDAK ADA
SERVFAIL  → server gagal (sering DNSSEC gagal — uji dengan +cd)
REFUSED   → server menolak (bukan otoritatif, rekursi tidak diizinkan)
```

⚠️ **`SERVFAIL` paling sering karena kegagalan validasi DNSSEC.** Uji dengan `dig +cd` — kalau berhasil dengan `+cd`, masalahnya di DNSSEC.

Detail di `06-aplikasi/01`.

---

## 4. Menguji Port dan Layanan

```bash
# nc (netcat) — paling praktis
$ nc -zv host 443
Connection to host 443 port [tcp/https] succeeded!
$ nc -zv -w 3 host 8080              # dengan timeout
$ nc -zuv host 53                    # UDP (kurang andal)

# Tanpa nc, dengan bash
$ timeout 3 bash -c 'cat < /dev/null > /dev/tcp/host/443' && echo OPEN || echo CLOSED

# curl untuk HTTP
$ curl -Isv --connect-timeout 3 https://host

# telnet (masih berguna)
$ telnet host 443
```

⚠️ **Bedakan tiga hasil (sangat informatif):**
```
"succeeded" / "connected"  → port terbuka, aplikasi listening
"Connection refused"       → host DIJANGKAU, tetapi tidak ada yang listening (RST)
"timeout" / "no route"     → paket tidak sampai (firewall drop, routing, host mati)
```

💡 **"Refused" vs "timeout" memberi tahu banyak:** refused = jaringan sehat sampai host, masalah di aplikasi; timeout = ada yang memblokir atau tidak ada jalur.

---

## 5. Melihat Socket: ss

```bash
$ ss -tulnp                          # semua yang listening
$ ss -tn state established            # koneksi aktif
$ ss -s                              # ringkasan
$ ss -tin dst 1.2.3.4                # info TCP detail (cwnd, rtt, retransmit)
```

⚠️ **Perhatikan alamat listening:**
```
0.0.0.0:80      → semua interface → bisa diakses dari luar
127.0.0.1:5432  → localhost saja → TIDAK bisa dari luar
```

💡 **"Aplikasi jalan tetapi tidak bisa diakses dari luar"** paling sering karena bind ke `127.0.0.1`. Periksa `ss -tulnp` sebelum menyalahkan firewall. Detail di `05-transport/01`.

---

## 6. tcpdump — Menangkap Paket

```bash
# Dasar
$ sudo tcpdump -ni eth0
$ sudo tcpdump -ni eth0 host 192.168.1.10
$ sudo tcpdump -ni eth0 'tcp port 443 and host 192.168.1.10'
$ sudo tcpdump -ni eth0 -e            # tampilkan MAC (untuk debug L2)
$ sudo tcpdump -ni eth0 -X 'port 80'  # hex + ASCII
$ sudo tcpdump -ni eth0 -w cap.pcap 'port 443'  # simpan untuk Wireshark

# Filter BPF berguna
$ sudo tcpdump -ni eth0 'tcp[tcpflags] & tcp-syn != 0 and tcp[tcpflags] & tcp-ack == 0'  # SYN
$ sudo tcpdump -ni eth0 'tcp[tcpflags] & tcp-rst != 0'   # RST
$ sudo tcpdump -ni eth0 icmp
$ sudo tcpdump -ni eth0 'udp port 53'
$ sudo tcpdump -ni eth0 arp
$ sudo tcpdump -ni eth0 'vlan 10'
```

### ⚠️ Menangkap di titik yang TEPAT

Ini keterampilan yang paling menentukan keberhasilan analisis paket.

```
Masalah: "Server A tidak bisa bicara dengan Server B"

Capture di A:  apakah paket KELUAR dari A?
Capture di B:  apakah paket SAMPAI ke B?

├── Keluar dari A, tidak sampai B → hilang di JALUR (firewall, routing)
├── Sampai B, B tidak membalas    → masalah di aplikasi/firewall B
├── B membalas, A tidak menerima  → jalur BALIK bermasalah
└── Tidak keluar dari A           → masalah di A (routing, firewall lokal)
```

💡 **Capture di KEDUA ujung sekaligus** mengungkap di mana paket hilang — teknik diagnosis paling kuat untuk masalah "tidak bisa terhubung".

⚠️ **Matikan offload sebelum capture untuk analisis akurat** (`ethtool -K eth0 gro off tso off`) — kalau tidak, Anda melihat "paket raksasa" yang sudah digabung NIC, bukan paket sesungguhnya di kabel.

---

## 7. Wireshark — Analisis Mendalam

### Display filter penting

```
# Umum
ip.addr == 192.168.1.10
tcp.port == 443
tcp.stream eq 5                      # satu koneksi saja

# Masalah TCP
tcp.analysis.retransmission          # retransmisi
tcp.analysis.duplicate_ack
tcp.analysis.zero_window             # penerima kewalahan
tcp.analysis.lost_segment
tcp.analysis.flags                   # SEMUA masalah TCP sekaligus
tcp.flags.reset == 1                 # RST

# Aplikasi
http.response.code >= 400
dns.flags.rcode != 0                 # error DNS
tls.handshake.type == 1              # ClientHello (lihat SNI)
tls.alert_message                    # error TLS

# Layer 2 / keamanan
arp.duplicate-address-detected       # ARP spoofing
wlan.fc.type_subtype == 0x0c         # deauth attack

# Waktu
tcp.time_delta > 1                   # jeda > 1 detik antar-paket
```

### Menu analisis yang berguna

```
Statistics → Conversations     → siapa bicara dengan siapa, berapa banyak
Statistics → Protocol Hierarchy → distribusi protokol
Statistics → IO Graph          → throughput dari waktu ke waktu
Statistics → TCP Stream Graphs → analisis kinerja TCP
Analyze → Expert Information    → ringkasan masalah otomatis
Follow → TCP/HTTP Stream        → rekonstruksi percakapan
```

### Menafsirkan temuan TCP

| Temuan | Arti |
|---|---|
| Banyak **retransmission** | Packet loss di jaringan |
| **Duplicate ACK** (3+) | Loss, segera diikuti fast retransmit |
| **Zero window** | **Aplikasi PENERIMA lambat** (bukan masalah jaringan) |
| **Out-of-order** | Load balancing per-packet; jalur berbeda; sering bukan masalah |
| **RST** di tengah sesi | Firewall/IPS memutus; aplikasi crash; timeout NAT/LB |
| **Previous segment not captured** | Paket hilang sebelum titik capture |
| Jeda besar sebelum respons | **Server lambat memproses** (bukan jaringan) |

💡 **Aturan penting: kalau retransmisi terlihat di KEDUA titik capture, loss ada di ANTARA keduanya.** Kalau hanya di sisi pengirim, loss dekat pengirim.

⚠️ **Zero window dan jeda sebelum respons menunjuk ke APLIKASI/SERVER, bukan jaringan.** Ini membantu menghentikan "menyalahkan jaringan" yang tidak perlu.

Detail di `05-transport/02`.

---

## 8. Uji Throughput: iperf3

```bash
# Server
$ iperf3 -s

# Klien — TCP
$ iperf3 -c server -t 30              # 30 detik
$ iperf3 -c server -t 30 -P 4         # 4 stream paralel (uji kapasitas jalur)
$ iperf3 -c server -R                 # arah balik (download)

# UDP — mengukur loss dan jitter
$ iperf3 -c server -u -b 100M -t 30
[  5] 0.00-30.00  357 MBytes 99.9 Mbits/s 0.089 ms  12/258402 (0.0046%)
                                          ^jitter    ^loss
```

⚠️ **Kesalahan pengukuran throughput:**

1. **Satu stream TCP menyesatkan** — sensitif terhadap loss dan window. Pakai `-P 4` untuk mengukur **kapasitas jalur** yang sebenarnya.

2. **Uji kedua arah** — banyak link asimetris (`-R` untuk arah balik).

3. **941 Mbps di link 1 Gbps adalah NORMAL** — bukan masalah. Overhead protokol membuat maksimum praktis ~94% (lihat `00-fondasi/03`).

4. **Bottleneck bisa bukan jaringan** — disk lambat, CPU enkripsi, atau aplikasi bisa menjadi batasnya. iperf3 menguji jaringan murni.

---

## 9. Perintah Cisco untuk Troubleshooting

```
! Interface
show interfaces status
show interfaces gi0/1
show interfaces gi0/1 | include error|CRC|collision|drop
show interfaces counters errors
clear counters gi0/1                 ! reset sebelum diagnosis!

! Layer 2
show mac address-table
show vlan brief
show interfaces trunk
show spanning-tree
show cdp neighbors detail

! Layer 3
show ip interface brief
show ip route
show ip route 8.8.8.8                ! rute untuk tujuan ini
show ip arp
show ip cef exact-route <src> <dst>  ! jalur nyata

! Konektivitas
ping 8.8.8.8 source gi0/0            ! tentukan sumber!
ping 8.8.8.8 size 1500 df-bit        ! uji MTU
traceroute 8.8.8.8 source gi0/0

! Kinerja perangkat
show processes cpu sorted
show processes memory sorted
show platform hardware ...           ! bergantung platform

! Capture on-box (perangkat modern)
monitor capture CAP interface gi0/1 both
monitor capture CAP match ipv4 any any
monitor capture CAP start
show monitor capture CAP buffer brief

! SPAN (mirror trafik ke analyzer)
monitor session 1 source interface gi0/1 both
monitor session 1 destination interface gi0/24
```

⚠️ **Selalu `clear counters` sebelum diagnosis** — counter yang menumpuk selama 2 tahun tidak memberi tahu apakah masalahnya terjadi **sekarang**.

⚠️ **`ping ... source` sangat penting** — tanpa menentukan sumber, router memakai IP interface keluar yang mungkin tidak punya rute balik. Banyak "ping gagal dari router tetapi PC bisa" berasal dari sini.

⚠️ **`debug` bisa melumpuhkan router** — setiap paket diproses CPU dan dicatat. Jangan pernah `debug ip packet` di produksi tanpa ACL pembatas yang sangat sempit, dan selalu siapkan `undebug all`.

---

## 10. Perintah MikroTik untuk Troubleshooting

```
# Interface
/interface print stats
/interface ethernet print stats-detail
/interface monitor-traffic ether1

# Torch — analisis trafik real-time (siapa memakai bandwidth apa)
/tool torch interface=ether1 src-address=192.168.1.0/24 port=any

# Sniffer — capture, bisa stream ke Wireshark (TZSP)
/tool sniffer set filter-interface=ether1 filter-ip-address=192.168.1.10/32 \
    streaming-enabled=yes streaming-server=192.168.99.50
/tool sniffer start
/tool sniffer stop
/tool sniffer packet print

# Konektivitas
/ping 8.8.8.8 count=5 src-address=192.168.1.1
/ping 8.8.8.8 size=1500 do-not-fragment
/tool traceroute 8.8.8.8
/tool netwatch print

# Koneksi (conntrack)
/ip firewall connection print
/ip firewall connection print where src-address~"192.168.1.50"

# Kinerja
/system resource print
/system resource cpu print
/tool profile                        ! proses yang memakan CPU

# Log
/log print
/log print follow
/log print where topics~"firewall"

# Bandwidth test (matikan server di produksi)
/tool bandwidth-test address=10.0.0.2 direction=both
```

💡 **`/tool torch` adalah alat andalan MikroTik** — menampilkan trafik real-time per alamat/port/protokol, sangat cepat menemukan "siapa yang memakan bandwidth". **`/tool profile`** menemukan proses yang membebani CPU.

💡 **`/tool sniffer` dengan streaming** mengirim paket langsung ke Wireshark di komputer Anda (protokol TZSP) — capture penuh tanpa perlu SPAN.

---

## 11. Windows

```powershell
PS> Test-NetConnection google.com -Port 443     # ping + port + trace
PS> Test-NetConnection google.com -TraceRoute
PS> Get-NetIPConfiguration
PS> Get-NetTCPConnection -State Listen
PS> Resolve-DnsName google.com
PS> Get-NetAdapter | Format-Table Name, Status, LinkSpeed
PS> Get-NetRoute
PS> pathping google.com                          # ping + traceroute gabungan
PS> Get-DnsClientCache
PS> Clear-DnsClientCache
```

---

## 12. Membangun Toolkit Diagnostik

```
Layer 1/2:
  - Cable tester, TDR, light meter (fiber)
  - ethtool, show interfaces (counter error)
  - Loopback plug

Layer 3:
  - ping, traceroute, mtr
  - ip route get, show ip route

Layer 4:
  - ss / netstat, nc, telnet
  - ip firewall connection / conntrack

Layer 7:
  - dig, curl -v, openssl s_client
  - Log aplikasi

Analisis paket:
  - tcpdump, Wireshark, tshark
  - SPAN/RSPAN/ERSPAN, MikroTik sniffer

Kinerja:
  - iperf3, speedtest
  - show processes cpu, /tool profile

Observability (14.3):
  - SNMP, NetFlow, streaming telemetry
  - Grafana, Prometheus, Zabbix
```

---

## 13. Ringkasan

- **Yang membedakan ahli adalah cara MEMBACA hasil, bukan mengetahui perintah.**
- **ping**: gagal ≠ host mati (ICMP diblokir); tinggi ke router perantara ≠ masalah; 0% loss ≠ sehat (bufferbloat); periksa `mdev` untuk jitter.
- **traceroute/mtr**: `* * *` sering normal; **latency/loss hop TENGAH sering menyesatkan** — fokus pada **hop TERAKHIR**; jalur pergi ≠ pulang.
- **`SERVFAIL` sering = DNSSEC gagal** (uji `dig +cd`); "It's always DNS".
- **nc**: "refused" (host dijangkau, tidak ada aplikasi) vs "timeout" (diblokir/tidak ada jalur) sangat informatif.
- **ss**: periksa `0.0.0.0` vs `127.0.0.1` — penyebab "jalan tapi tidak bisa diakses dari luar".
- **tcpdump**: **capture di titik yang tepat** — di kedua ujung untuk menemukan di mana paket hilang; matikan offload untuk akurasi.
- **Wireshark**: **zero window & jeda sebelum respons = masalah APLIKASI/SERVER**, bukan jaringan; retransmisi di kedua ujung = loss di antara.
- **iperf3**: pakai `-P 4` untuk kapasitas jalur; uji kedua arah; 941 Mbps di 1 Gbps normal; bottleneck bisa disk/CPU.
- **Cisco**: `clear counters` dulu; `ping source` penting; **`debug` bisa melumpuhkan** — pakai ACL sempit.
- **MikroTik**: `/tool torch` (trafik real-time), `/tool profile` (CPU), `/tool sniffer` (stream ke Wireshark).

---

## 14. Latihan

1. Ping ke server jauh gagal, tetapi Anda bisa SSH ke server itu. Apa penjelasannya?
2. Traceroute menunjukkan hop 4 dengan latency 300 ms dan 20% loss, tetapi hop terakhir (tujuan) 15 ms dan 0% loss. Apakah ada masalah?
3. `nc -zv host 8080` mengembalikan "connection refused". Apa artinya dan di mana masalahnya?
4. Wireshark menunjukkan banyak "TCP Zero Window" dari server ke klien saat download lambat. Di mana masalahnya?
5. iperf3 dengan satu stream memberi 200 Mbps di link 1 Gbps, tetapi dengan `-P 8` memberi 940 Mbps. Apa yang terjadi?
6. Anda ingin tahu apakah paket dari Server A benar-benar sampai ke Server B. Bagaimana caranya?
7. Ping dari router Cisco ke tujuan gagal, tetapi PC di LAN yang sama bisa. Apa dugaan Anda?
8. Pengguna melapor "internet lambat saat download besar, tetapi ping normal saat idle". Alat apa yang Anda pakai dan apa yang Anda cari?

<details>
<summary>Jawaban</summary>

1. **Firewall (atau host) memblokir ICMP tetapi mengizinkan TCP 22.** Ping memakai ICMP Echo, yang sangat sering diblokir sebagai kebijakan keamanan — terutama di server cloud (security group default sering memblokir ICMP) dan server Windows. Server tetap hidup dan melayani SSH dengan normal. Ini menunjukkan mengapa **ping bukan tes konektivitas yang andal** — selalu uji dengan protokol/port yang sebenarnya Anda butuhkan (`nc -zv host 22`, `curl`). Ping yang gagal hanya berarti "tidak ada balasan ICMP", bukan "host mati".

2. **Tidak ada masalah.** Latency tinggi dan loss di **hop tengah** hampir selalu menyesatkan: router di hop 4 memberi **prioritas rendah untuk menjawab ICMP** (control plane) dan/atau melakukan **rate limiting ICMP**, sementara ia **meneruskan trafik data dengan cepat** (data plane). Bukti bahwa jalur sehat: **hop terakhir (tujuan) menunjukkan 15 ms dan 0% loss** — inilah yang benar-benar penting. Kalau loss atau latency tinggi **muncul di hop 4 DAN berlanjut sampai hop terakhir**, barulah itu masalah nyata. Aturan: fokus pada hop terakhir, abaikan anomali hop perantara kecuali persisten sampai tujuan.

3. **"Connection refused" berarti paket SYN Anda SAMPAI ke host dan host membalas dengan RST** — artinya jaringan, routing, dan firewall di sepanjang jalur semuanya berfungsi; host dapat dijangkau. Yang tidak ada adalah **aplikasi yang listening di port 8080** (belum dijalankan, crash, atau bind ke alamat lain). Masalahnya **di sisi aplikasi/host tujuan**, bukan di jaringan. Kontras dengan "timeout" yang berarti paket tidak pernah mendapat balasan (diblokir firewall dengan DROP, routing salah, atau host mati). Perbaikan: periksa apakah layanan berjalan (`systemctl status`, `ss -tulnp`) dan bind ke alamat yang benar.

4. **Di aplikasi PENERIMA (klien), bukan di jaringan.** "TCP Zero Window" dari server ke klien berarti **server mengiklankan window = 0** — buffer penerimaan di sisi server penuh karena... tunggu, arahnya penting. Kalau zero window dikirim **oleh server**, artinya buffer server penuh; tetapi dalam skenario download, yang mengunduh adalah klien, jadi window yang relevan adalah **window klien**. Kalau klien mengirim zero window, berarti **aplikasi di klien terlalu lambat membaca data dari socket** (CPU sibuk, disk lambat, thread macet), sehingga buffer penerimaannya penuh dan ia menyuruh server berhenti mengirim. Intinya: **zero window menunjuk ke sisi yang mengirimnya sebagai bottleneck aplikasi** — bukan masalah bandwidth atau jaringan. Menambah bandwidth tidak akan membantu; periksa CPU/disk/aplikasi di sisi yang mengirim zero window.

5. **Satu stream TCP terbatas oleh window dan sensitif terhadap packet loss/latency**, sehingga tidak mencerminkan kapasitas jalur yang sebenarnya. Kemungkinan besar ada sedikit packet loss atau latency yang cukup tinggi (BDP besar) sehingga satu koneksi TCP tidak bisa mengisi pipa — congestion window-nya turun setiap kali ada loss. Dengan **8 stream paralel (`-P 8`)**, kehilangan pada satu stream tidak memengaruhi yang lain, dan secara agregat mereka mengisi jalur hingga 940 Mbps (mendekati maksimum praktis 1 Gbps setelah overhead). **Kesimpulan: kapasitas JALUR baik (940 Mbps); masalahnya adalah kinerja SATU koneksi TCP** — periksa packet loss (`mtr`), latency/BDP, apakah window scaling aktif (`ss -tin`), dan apakah ada middlebox yang menghapus opsi window scale. Untuk mengukur kapasitas jalur, selalu pakai multi-stream.

6. **Capture di kedua ujung secara bersamaan** dengan filter yang sama:
   ```
   # Di Server A
   sudo tcpdump -ni eth0 host <IP-B> and port <port>
   # Di Server B
   sudo tcpdump -ni eth0 host <IP-A> and port <port>
   ```
   Lalu picu trafik dari A ke B dan bandingkan:
   - **Paket keluar dari A, muncul di B** → jalur pergi baik; kalau tetap gagal, masalah di aplikasi/firewall B atau jalur balik.
   - **Keluar dari A, TIDAK muncul di B** → paket hilang di jalur (firewall di tengah, routing salah, ACL).
   - **Sampai B, B membalas, balasan TIDAK sampai A** → jalur balik bermasalah (asymmetric routing, firewall stateful, NAT).
   - **TIDAK keluar dari A sama sekali** → masalah di A (routing lokal, firewall output, aplikasi tidak mengirim).
   Ini teknik diagnosis paling kuat untuk "tidak bisa terhubung" — mengubah tebakan menjadi bukti. Ingat matikan offload NIC untuk melihat paket sesungguhnya.

7. **Router memakai alamat sumber yang tidak punya rute balik.** Saat Anda menjalankan `ping <tujuan>` dari router tanpa menentukan sumber, router memakai IP dari **interface keluar** menuju tujuan itu. Alamat itu mungkin tidak dikenal atau tidak punya rute balik di sisi tujuan/jalur — sehingga balasan tidak pernah kembali. PC di LAN bisa karena ia memakai alamat LAN yang punya rute balik (mungkin lewat NAT).
   **Perbaikan/uji:** `ping <tujuan> source <interface-yang-punya-rute-balik>`, mis. `ping 8.8.8.8 source gi0/0` (interface WAN dengan IP publik yang di-NAT) atau `source loopback0` yang diiklankan. Ini adalah salah satu jebakan troubleshooting paling umum di Cisco — **selalu tentukan `source`** saat ping/traceroute dari perangkat jaringan. Kemungkinan lain: firewall di tujuan memblokir alamat interface router tetapi mengizinkan subnet LAN.

8. **Ini adalah bufferbloat.** Alat: **ping/mtr yang berjalan SAAT ada beban**, bukan saat idle.
   ```
   # Terminal 1: mulai beban (download besar atau iperf3)
   iperf3 -c server -t 60
   # Terminal 2: ukur latency SAAT beban berjalan
   ping 8.8.8.8
   ```
   Yang dicari: **latency yang melonjak drastis saat ada transfer** (mis. dari 20 ms saat idle menjadi 800–2000 ms saat download), dengan **0% packet loss**. Itu tanda pasti bufferbloat — buffer besar di modem/router ISP terisi penuh sehingga semua paket (termasuk ping) mengantre di belakangnya.
   Alat khusus: **Waveform Bufferbloat Test** atau **DSLReports** (memberi grade A–F). Perbaikan: pasang AQM (fq_codel/CAKE) di router yang Anda kendalikan dan shape ke ~90–95% kapasitas link, sehingga antrean terbentuk di perangkat Anda (yang punya AQM) alih-alih di modem ISP. Lihat `05-transport/04`.

</details>

---

## 15. Sumber

- `man ping`, `man traceroute`, `man mtr`, `man tcpdump`, `man ss`, `man dig`
- Wireshark User's Guide — https://www.wireshark.org/docs/
- iperf3 — https://iperf.fr/
- Cisco, *Troubleshooting Commands*
- MikroTik Tools — https://help.mikrotik.com/docs/display/ROS/Tools
- CompTIA Network+ N10-009, Domain 5.0

---

**Berikutnya:** `14-monitoring-troubleshooting/03-observability.md` — memantau jaringan secara proaktif.

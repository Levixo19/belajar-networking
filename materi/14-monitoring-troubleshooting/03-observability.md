# 14.3 Observability: Monitoring Proaktif

> **Prasyarat:** `06-aplikasi/05` (SNMP, syslog), `14-monitoring-troubleshooting/01`
> **Tujuan:** Anda paham cara memantau jaringan secara proaktif, memilih metode dan alat yang tepat, dan mendesain sistem monitoring yang bermakna.

> > [!NOTE]
> > **Monitoring mengubah troubleshooting dari reaktif menjadi proaktif** — dari "kenapa ini rusak?" menjadi "ini akan bermasalah dalam seminggu, mari perbaiki sekarang". Tanpa data historis, sebagian besar masalah (terutama intermiten dan tren) tidak dapat didiagnosis.

---

## 1. Tiga Pilar Observability

```
1. METRICS  → angka dari waktu ke waktu (utilisasi, latency, error)
              → "apa yang terjadi" dan "seberapa banyak"
2. LOGS     → catatan kejadian diskret (login, perubahan, error)
              → "apa yang terjadi persisnya"
3. TRACES   → jejak permintaan melintasi sistem (lebih untuk aplikasi)
              → "di mana waktu terpakai"
```

Untuk jaringan, **metrics dan logs** adalah yang utama.

> [!WARNING]
> **Monitoring ≠ observability.** Monitoring memberi tahu **apakah** sistem sehat (dashboard, alert). Observability memungkinkan Anda **menanyakan pertanyaan baru** tentang perilaku sistem tanpa harus mendeploy ulang instrumentasi. Keduanya penting.

---

## 2. SNMP (Polling Klasik)

Sudah dibahas di `06-aplikasi/05`. Di sini fokus pada penerapan monitoring.

```
Model PULL: sistem monitoring meng-query perangkat secara berkala
  NMS → GET → Agent → response

Interval polling biasanya 1–5 menit
```

### OID penting untuk monitoring

```
sysUpTime          .1.3.6.1.2.1.1.3.0
ifDescr            .1.3.6.1.2.1.2.2.1.2      nama interface
ifOperStatus       .1.3.6.1.2.1.2.2.1.8      1=up 2=down
ifHCInOctets       .1.3.6.1.2.1.31.1.1.1.6   byte masuk (64-bit!)
ifHCOutOctets      .1.3.6.1.2.1.31.1.1.1.10  byte keluar (64-bit!)
ifInErrors         .1.3.6.1.2.1.2.2.1.14
ifOutDiscards      .1.3.6.1.2.1.2.2.1.19
cpmCPUTotal5minRev .1.3.6.1.4.1.9.9.109...    CPU Cisco
```

> [!WARNING]
> **WAJIB pakai counter 64-bit (`ifHC*`).** Counter 32-bit **wrap dalam 34 detik** di link 1 Gbps dan **3,4 detik** di 10 Gbps — dengan polling 5 menit, grafik utilisasi Anda akan salah total. Ini kesalahan monitoring paling umum.

```bash
$ snmpwalk -v3 -l authPriv -u monitoring -a SHA -A AuthPass \
    -x AES -X PrivPass 192.168.1.1 ifHCInOctets
```

> [!WARNING]
> **Gunakan SNMPv3.** SNMPv2c mengirim community string plaintext — siapa pun yang menyadap bisa membacanya, dan community RW memungkinkan **mengubah konfigurasi perangkat**.

### Cara utilisasi dihitung

```
SNMP memberi COUNTER (total byte kumulatif), bukan rate.
NMS menghitung rate dari SELISIH dua polling:

rate (bps) = (counter_baru − counter_lama) × 8 / interval_detik
utilisasi (%) = rate / bandwidth_link × 100
```

> [!WARNING]
> **Karena rate dihitung dari rata-rata interval polling, MICROBURST tidak terlihat.** Grafik menunjukkan utilisasi 20% padahal ada lonjakan mikrodetik yang menyebabkan drop. Kalau `output drops` naik padahal utilisasi rata-rata rendah, curigai microburst (lihat `03-data-link/02`).

---

## 3. Streaming Telemetry: Pengganti Modern

```
Model PUSH: perangkat MENDORONG data ke collector secara kontinu
  Agent → subscribe → stream data setiap detik/sub-detik → collector
```

| | **SNMP (pull)** | **Streaming Telemetry (push)** |
|---|---|---|
| Model | Poll berkala | Subscribe + push kontinu |
| Interval | 1-5 menit | Detik atau sub-detik |
| Beban perangkat | Tinggi (setiap poll = kerja CPU) | Rendah (sekali subscribe) |
| Granularitas | Kasar | **Halus** — menangkap microburst |
| Format | ASN.1/BER | **Protobuf/JSON** (gNMI, gRPC) |
| Skalabilitas | Terbatas | Sangat baik |
| Keamanan | v3 (rumit) | TLS + gRPC |

```
Protokol: gNMI (gRPC Network Management Interface), NETCONF, RESTCONF
Model data: OpenConfig, YANG
```

> [!TIP]
> **Streaming telemetry adalah arah masa depan** karena SNMP tidak bisa memberi granularitas detik pada skala besar. gNMI dengan model OpenConfig memungkinkan monitoring yang jauh lebih detail dan real-time — penting untuk mendeteksi microburst dan masalah transien.

> [!WARNING]
> **SNMP masih dominan** karena didukung semua perangkat dan alat monitoring. Realitanya: kebanyakan jaringan memakai SNMP, dan streaming telemetry diadopsi bertahap di perangkat/lingkungan modern.

Detail gNMI di `15-otomasi/02`.

---

## 4. Flow-Based Monitoring: NetFlow / IPFIX / sFlow

Monitoring **alur** — siapa berbicara dengan siapa, tanpa membaca isi paket.

| | **NetFlow / IPFIX** | **sFlow** |
|---|---|---|
| Metode | Melacak setiap flow, ekspor record | **Sampling** paket (1 dari N) |
| Akurasi | Akurat untuk flow | Statistik (sampling) |
| Beban | Lebih tinggi | Lebih ringan |
| Vendor | Cisco (NetFlow), standar (IPFIX) | Multi-vendor |
| Untuk | Analisis flow detail | Skala tinggi, statistik |

### Yang bisa dideteksi dari flow

```
- Top talkers (siapa memakai bandwidth terbanyak)
- Distribusi aplikasi/protokol
- Beaconing (koneksi berkala teratur → C2)
- Port scan (satu sumber ke banyak port/host)
- Eksfiltrasi (volume upload tidak wajar)
- DDoS (banyak sumber ke satu tujuan)
- Lateral movement (koneksi antar-host internal tidak biasa)
- Anomali trafik dari baseline
```

> [!TIP]
> **Flow monitoring adalah jembatan antara jaringan dan keamanan** — ia memberi visibilitas ke **pola** trafik tanpa perlu menyimpan payload (yang mahal dan sering terenkripsi). Sangat berharga untuk deteksi C2 dan eksfiltrasi.

### Field record NetFlow

```
Source/Dest IP, Source/Dest port, Protocol,
ToS/DSCP, Input/Output interface,
Byte count, Packet count, Timestamps, TCP flags
```

```
# Cisco — Flexible NetFlow
flow record REKAM
 match ipv4 source address
 match ipv4 destination address
 match transport source-port
 match transport destination-port
 match ipv4 protocol
 collect counter bytes
 collect counter packets
flow exporter EKSPOR
 destination 192.168.99.50
 transport udp 2055
flow monitor PANTAU
 record REKAM
 exporter EKSPOR
interface gi0/1
 ip flow monitor PANTAU input
 ip flow monitor PANTAU output
```

```
# MikroTik — Traffic Flow (NetFlow/IPFIX)
/ip traffic-flow set enabled=yes interfaces=all
/ip traffic-flow target add dst-address=192.168.99.50 port=2055 version=9
```

**Collector/analyzer:** nfdump/nfsen, ntopng, Elastiflow, Kentik, SolarWinds NTA.

---

## 5. Syslog Terpusat

Sudah dibahas di `06-aplikasi/05`. Prinsip monitoring:

```
✅ Semua perangkat kirim log ke SATU server terpusat
✅ Waktu tersinkronisasi (NTP) agar korelasi bermakna
✅ Timestamp presisi (service timestamps log datetime msec)
✅ TCP/TLS untuk keandalan pada lingkungan penting
✅ Retensi sesuai kebutuhan (kepatuhan sering butuh 1 tahun+)
✅ Parsing dan indexing untuk pencarian cepat
```

> [!WARNING]
> **Log yang tidak dikumpulkan terpusat hampir tidak berguna.** Saat perangkat crash atau diretas, log lokalnya hilang atau tidak dapat diakses. Dan mencari lintas 50 perangkat satu per satu saat outage tidak praktis.

### Kejadian yang harus dipantau/di-alert

```
- Interface up/down (linkdown/linkup)
- Perubahan konfigurasi (di luar jendela pemeliharaan)
- Login berhasil/gagal (terutama dari lokasi tidak biasa)
- Penggunaan akun break-glass
- Port security / BPDU guard / DHCP snooping violation
- STP topology change berlebihan
- BGP/OSPF neighbor down
- Suhu/daya/PSU (environmental)
- Rogue DHCP/RA terdeteksi
```

---

## 6. Metrik yang Harus Dipantau

### Per interface

```
- Utilisasi (in/out) — % dari bandwidth
- Error (CRC, input/output errors)
- Discard/drop
- Status (up/down)
- Duplex/speed (deteksi mismatch)
```

### Per perangkat

```
- CPU (rata-rata dan puncak)
- Memori
- Suhu, kipas, PSU (environmental)
- Uptime (deteksi reboot tak terduga)
- Tabel: MAC, ARP, routing, NAT, conntrack (deteksi mendekati penuh)
```

### Per layanan/end-to-end

```
- Latency ke tujuan penting (gateway, DNS, aplikasi kunci)
- Jitter dan packet loss
- Waktu resolusi DNS
- Waktu respons aplikasi
- Ketersediaan (uptime layanan)
- Sertifikat TLS mendekati kedaluwarsa
```

### Synthetic monitoring

Uji aktif dari sudut pandang pengguna:
```
- IP SLA (Cisco) / Netwatch (MikroTik) / probe eksternal
- Uji berkala: ping, HTTP GET, DNS query, throughput
- Dari beberapa lokasi (menangkap masalah regional)
```

```
# Cisco IP SLA
ip sla 1
 icmp-echo 8.8.8.8 source-interface gi0/0
 frequency 60
ip sla schedule 1 life forever start-time now
ip sla 2
 http get http://app.example.com/healthz
 frequency 300
```

> [!TIP]
> **Synthetic monitoring menangkap masalah SEBELUM pengguna melaporkannya** — dan memberi baseline objektif ("latency ke DNS naik dari 5 ms ke 200 ms pukul 14:00") yang jauh lebih berguna daripada laporan subjektif ("internet terasa lambat").

---

## 7. Stack Monitoring Modern: Prometheus + Grafana

```
┌──────────────┐   scrape    ┌─────────────┐   query   ┌─────────┐
│  Exporters   │◄────────────│ Prometheus  │◄──────────│ Grafana │
│ node_exporter│   (pull)    │ (TSDB +     │           │(visual +│
│ snmp_exporter│             │  alerting)  │           │ alert)  │
│ blackbox_exp │             └──────┬──────┘           └─────────┘
└──────────────┘                    │ alert
                              ┌──────┴──────┐
                              │Alertmanager │ → Slack/email/PagerDuty
                              └─────────────┘
```

| Komponen | Fungsi |
|---|---|
| **node_exporter** | Metrik sistem Linux (CPU, memori, jaringan, disk) |
| **snmp_exporter** | Menerjemahkan SNMP ke metrik Prometheus (untuk perangkat jaringan) |
| **blackbox_exporter** | Synthetic probe (HTTP, TCP, DNS, ICMP dari luar) |
| **Prometheus** | Time-series database + scraping + alerting rules |
| **Grafana** | Visualisasi dashboard + alerting |
| **Alertmanager** | Routing dan deduplikasi alert |

```yaml
# Prometheus alert rule contoh
groups:
- name: jaringan
  rules:
  - alert: InterfaceDown
    expr: ifOperStatus == 2
    for: 2m
    annotations:
      summary: "Interface {{ $labels.ifDescr }} down"
  - alert: UtilisasiTinggi
    expr: rate(ifHCInOctets[5m]) * 8 / ifHighSpeed / 1000000 > 0.9
    for: 10m
  - alert: SertifikatKedaluwarsa
    expr: probe_ssl_earliest_cert_expiry - time() < 86400 * 14
```

> [!TIP]
> **Prometheus (pull) cocok untuk metrik**; untuk jaringan tradisional, `snmp_exporter` menjembatani SNMP ke Prometheus. Grafana bisa memvisualkan dari banyak sumber (Prometheus, InfluxDB, Elasticsearch).

### Alternatif populer

```
Zabbix       → all-in-one, kuat untuk jaringan, agent + SNMP
LibreNMS     → khusus jaringan, auto-discovery, berbasis SNMP
Observium    → khusus jaringan, sederhana
Netdata      → real-time per-detik, ringan, per-host
PRTG         → komersial, mudah, populer di Windows shops
Nagios/Icinga→ klasik, berbasis check
The Dude     → gratis dari MikroTik, untuk jaringan MikroTik
```

> [!TIP]
> **Untuk jaringan yang didominasi SNMP, LibreNMS atau Zabbix adalah titik awal yang sangat baik** — auto-discovery, dashboard bawaan, dan alerting tanpa banyak konfigurasi. **The Dude** cocok untuk lingkungan MikroTik.

---

## 8. Menyusun Dashboard yang Bermakna

> [!WARNING]
> **Dashboard yang penuh grafik tanpa fokus JUSTRU mengaburkan masalah.** Rancang dengan tujuan.

```
Prinsip dashboard yang baik:
1. Yang PALING PENTING di atas (status keseluruhan, alert aktif)
2. Warna bermakna (merah = masalah, jangan warna-warni tanpa arti)
3. Baseline/threshold terlihat (garis "normal")
4. Waktu yang sama di semua panel (untuk korelasi)
5. Drill-down: overview → detail
6. Konteks bisnis (bukan cuma "CPU 80%", tetapi "layanan X terpengaruh")
```

**Hierarki dashboard:**
```
Level 1 — NOC overview     : status semua lokasi/link kritis dalam satu layar
Level 2 — Per lokasi/link  : detail utilisasi, error, latency
Level 3 — Per perangkat    : CPU, memori, semua interface, environmental
Level 4 — Investigasi      : metrik spesifik + log + flow pada garis waktu sama
```

---

## 9. Alerting: Melakukannya dengan Benar

> [!WARNING]
> **Alerting yang buruk lebih berbahaya daripada tidak ada alerting.** Terlalu banyak alert palsu → **alert fatigue** → orang mengabaikan semua alert, termasuk yang penting.

```
Prinsip alerting yang baik:
✅ Alert hanya pada yang ACTIONABLE (memerlukan tindakan)
✅ Berdasarkan GEJALA yang memengaruhi pengguna, bukan setiap metrik
✅ Threshold yang wajar (bukan CPU 80% sesaat)
✅ Durasi (for: 5m) untuk menghindari flapping
✅ Prioritas jelas (P1 outage vs P4 informasi)
✅ Runbook terhubung (apa yang harus dilakukan)
✅ Escalation kalau tidak ditanggapi
✅ Deduplikasi dan grouping (satu masalah = satu alert)
```

```
❌ JANGAN alert setiap kali CPU > 50%
❌ JANGAN alert pada setiap interface yang sedikit sibuk
❌ JANGAN kirim 100 alert untuk satu outage
❌ JANGAN alert pada hal yang tidak akan Anda tindaklanjuti pukul 3 pagi
```

> [!TIP]
> **Aturan: setiap alert harus bisa dijawab dengan "apa yang harus saya lakukan sekarang?".** Kalau jawabannya "tidak ada" atau "tunggu saja", itu bukan alert — jadikan dashboard/laporan.

### SLA, SLO, SLI

```
SLI (Indicator)  : metrik yang diukur — mis. "% request < 100 ms"
SLO (Objective)  : target internal — mis. "99,9% request < 100 ms"
SLA (Agreement)  : janji ke pelanggan (dengan konsekuensi) — mis. "99,5% uptime"

Error budget = 100% − SLO
  → berapa banyak "kegagalan" yang boleh terjadi
  → memandu keputusan: perbaiki keandalan vs kirim fitur baru
```

> [!TIP]
> **Error budget mengubah keandalan dari "sebanyak mungkin" menjadi keputusan berbasis data.** Kalau SLO 99,9% (43 menit/bulan) dan Anda sudah memakai 40 menit, jangan lakukan perubahan berisiko.

---

## 10. Capacity Planning

Monitoring bukan hanya untuk mendeteksi masalah, tetapi **mencegahnya** dengan merencanakan pertumbuhan.

```
- Trending utilisasi (link mana mendekati jenuh?)
- Proyeksi pertumbuhan (kapan perlu upgrade?)
- 95th percentile billing (banyak ISP menagih berdasarkan ini)
- Kapasitas tabel (MAC, routing, NAT, conntrack)
- Beban perangkat (CPU/memori) vs pertumbuhan
```

### 95th Percentile

```
Metode billing/kapasitas umum:
1. Ukur utilisasi setiap 5 menit selama sebulan (~8640 sampel)
2. Buang 5% sampel tertinggi (~432 sampel puncak)
3. Nilai tertinggi yang tersisa = 95th percentile

→ Mengabaikan lonjakan singkat, mencerminkan penggunaan yang berkelanjutan
```

> [!WARNING]
> **95th percentile mengabaikan burst 5% teratas** — berguna untuk billing dan kapasitas normal, tetapi **tidak menangkap microburst** yang menyebabkan drop. Untuk analisis kualitas, lihat juga puncak dan drop.

> [!TIP]
> **Rencanakan upgrade SEBELUM link mencapai jenuh.** Aturan umum: mulai rencanakan upgrade saat utilisasi puncak konsisten melewati 70–80%. Menunggu sampai 100% berarti pengguna sudah menderita sebelum Anda bertindak.

---

## 11. Monitoring Keamanan

Integrasi dengan `12-keamanan/06`:

```
- SIEM: korelasi log jaringan + firewall + auth + endpoint
- Flow analysis untuk deteksi C2, eksfiltrasi, lateral movement
- IDS/IPS alert (Suricata, Snort)
- Zeek untuk network security monitoring
- Deteksi anomali (baseline perilaku)
- Threat intelligence feed (blokir/alert domain/IP berbahaya)
- Monitoring integritas konfigurasi (config drift)
```

> [!TIP]
> **NetFlow + log DNS + log firewall yang dikorelasikan** memberi deteksi keamanan yang kuat tanpa perlu membaca payload (yang sering terenkripsi). Beaconing, koneksi ke domain baru, dan volume upload tidak wajar terlihat jelas dari metadata.

---

## 12. Kesalahan Umum Monitoring

> [!WARNING]
> **1. Counter 32-bit di link cepat** → grafik utilisasi salah (wrap). Pakai `ifHC*` 64-bit.

> [!WARNING]
> **2. Tidak ada baseline** → tidak bisa mengenali abnormal.

> [!WARNING]
> **3. Waktu tidak tersinkronisasi** → korelasi antar-perangkat mustahil.

> [!WARNING]
> **4. Log lokal, tidak terpusat** → hilang saat crash, tidak bisa dicari.

> [!WARNING]
> **5. Alert fatigue** → terlalu banyak alert palsu, yang penting terabaikan.

> [!WARNING]
> **6. Monitoring "up/down" saja** → tidak menangkap degradasi (lambat tetapi masih up).

> [!WARNING]
> **7. Interval polling terlalu panjang** → microburst dan transien tidak terlihat.

> [!WARNING]
> **8. SNMPv2c dengan community default** → risiko keamanan.

> [!WARNING]
> **9. Memantau perangkat, bukan LAYANAN** → CPU router 50% tidak berarti apa-apa bagi pengguna; latency aplikasi berarti.

> [!WARNING]
> **10. Tidak memantau sertifikat TLS** → sertifikat kedaluwarsa menyebabkan outage yang mudah dicegah.

---

## 13. Ringkasan

- **Observability** mengubah troubleshooting menjadi proaktif; tanpa data historis, masalah intermiten dan tren tidak dapat didiagnosis.
- Tiga pilar: **metrics** (angka), **logs** (kejadian), **traces** (jejak). Untuk jaringan, metrics + logs.
- **SNMP (pull)**: wajib **counter 64-bit (`ifHC*`)** — 32-bit wrap dalam 34 detik di 1 Gbps. Pakai **SNMPv3**.
- **Streaming telemetry (push, gNMI)** memberi granularitas detik dan menangkap microburst — arah masa depan, tetapi SNMP masih dominan.
- **Flow monitoring (NetFlow/IPFIX/sFlow)** memberi visibilitas pola trafik tanpa payload — jembatan ke keamanan (deteksi C2, eksfiltrasi).
- **Syslog terpusat** dengan waktu tersinkronisasi — log lokal hampir tidak berguna.
- Pantau **per interface** (utilisasi, error, drop), **per perangkat** (CPU, memori, tabel, environmental), dan **per layanan** (latency, loss, DNS, sertifikat).
- **Synthetic monitoring** (IP SLA/Netwatch/blackbox) menangkap masalah sebelum pengguna melapor dan memberi baseline objektif.
- Stack modern: **Prometheus + Grafana + Alertmanager**; alternatif jaringan: **Zabbix, LibreNMS, The Dude**.
- **Alert hanya pada yang actionable** — alert fatigue lebih berbahaya daripada tidak ada alert.
- **SLI/SLO/SLA + error budget** mengubah keandalan menjadi keputusan berbasis data.
- **95th percentile** untuk billing/kapasitas (tetapi mengabaikan microburst). Rencanakan upgrade di ~70-80% utilisasi.
- **Pantau LAYANAN, bukan hanya perangkat** — dan jangan lupa **sertifikat TLS**.

---

## 14. Latihan

1. Kenapa counter SNMP 32-bit tidak boleh dipakai untuk memantau link 10 Gbps?
2. Apa perbedaan model pull (SNMP) dan push (streaming telemetry), dan kapan masing-masing unggul?
3. Grafik utilisasi menunjukkan 20% tetapi ada packet drop. Bagaimana ini mungkin dan apa yang Anda periksa?
4. Kenapa syslog harus terpusat dan waktunya tersinkronisasi?
5. Jelaskan alert fatigue dan bagaimana mencegahnya.
6. Apa itu error budget dan bagaimana ia memandu keputusan?
7. Apa yang bisa dideteksi flow monitoring yang tidak bisa dilakukan SNMP?
8. Tim Anda memantau "up/down" semua perangkat, tetapi pengguna mengeluh aplikasi lambat padahal semua "hijau". Apa yang kurang?

<details>
<summary>Jawaban</summary>

1. Karena counter 32-bit maksimal `2^32` byte (~4,3 GB), dan pada link 10 Gbps ia terisi penuh (**wrap** kembali ke nol) dalam **~3,4 detik**. Sistem monitoring menghitung rate dari selisih dua polling; dengan interval polling 5 menit (300 detik), counter sudah wrap **puluhan kali** di antara dua polling. Sistem tidak tahu berapa kali wrap terjadi, sehingga selisih yang dihitung salah — menghasilkan grafik utilisasi yang **kacau, terlalu rendah, atau bahkan negatif**. Perbaikan: gunakan **counter 64-bit `ifHCInOctets`/`ifHCOutOctets`** (`.1.3.6.1.2.1.31.1.1.1.6` dan `.10`) yang tersedia sejak SNMPv2c dan butuh ratusan tahun untuk wrap di 10 Gbps. Pastikan perangkat memakai SNMP v2c/v3 (bukan v1 yang hanya punya counter 32-bit) dan sistem monitoring dikonfigurasi memakai HC counter.

2. **Pull (SNMP):** sistem monitoring **meminta** data dari perangkat pada interval tetap (mis. setiap 5 menit). Sederhana, didukung universal, tetapi setiap poll membebani CPU perangkat, dan granularitasnya kasar (rata-rata interval). **Push (streaming telemetry/gNMI):** perangkat **mendorong** data ke collector secara kontinu setelah sekali subscribe, pada interval detik atau sub-detik. Beban perangkat rendah, granularitas halus (menangkap microburst dan transien), dan sangat scalable.
   **Pull unggul** untuk: kompatibilitas luas (perangkat lama, semua vendor), kesederhanaan, dan monitoring tradisional yang tidak butuh granularitas tinggi. **Push unggul** untuk: skala besar (ribuan perangkat, ribuan metrik), monitoring real-time, deteksi microburst/transien, dan lingkungan modern dengan otomasi. Dalam praktik, kebanyakan jaringan memakai SNMP dan mengadopsi streaming telemetry bertahap di perangkat baru.

3. **Microburst.** Grafik utilisasi dihitung dari rata-rata interval polling (mis. 5 menit). Trafik yang datang dalam **lonjakan sangat singkat** (mikrodetik hingga milidetik) yang melebihi kapasitas port keluar akan mengisi buffer dan menyebabkan **drop**, tetapi ketika dirata-ratakan selama 5 menit, terlihat hanya 20%. Yang diperiksa: (a) counter **`output drops`/`ifOutDiscards`** pada interface — kalau naik padahal utilisasi rata-rata rendah, itu tanda microburst; (b) polling dengan **interval jauh lebih pendek** (streaming telemetry, atau SNMP interval detik) untuk melihat lonjakan sesungguhnya; (c) pola trafik yang menyebabkannya (incast dari banyak server ke satu, atau aplikasi bursty). Perbaikan: perbesar buffer kalau memungkinkan, terapkan QoS, tingkatkan kecepatan uplink, atau distribusikan beban.

4. **Terpusat:** log lokal di perangkat (a) **hilang atau tidak dapat diakses saat perangkat crash, di-reboot, atau diretas** — persis saat Anda paling membutuhkannya; (b) buffer lokal kecil dan menimpa log lama dengan cepat; (c) **mustahil dicari lintas puluhan perangkat** saat outage — Anda tidak punya waktu login ke setiap perangkat. Server terpusat menyimpan log dengan andal, retensi panjang, dan pencarian cepat.
   **Waktu tersinkronisasi (NTP):** untuk **korelasi**. Kalau jam antar-perangkat berbeda-beda, Anda tidak bisa menyusun kronologi kejadian — "interface down di switch A pukul 14:03:22, adjacency BGP putus di router B pukul 14:03:25" hanya bermakna kalau kedua jam akurat. Tanpa waktu sinkron, investigasi insiden dan forensik menjadi tebakan. (NTP yang salah juga merusak TLS dan Kerberos — lihat modul terkait.)

5. **Alert fatigue** terjadi ketika sistem menghasilkan terlalu banyak alert — terutama yang **tidak actionable, palsu, atau berulang** — sehingga operator menjadi kebal dan mulai **mengabaikan semua alert**, termasuk yang benar-benar penting. Ini lebih berbahaya daripada tidak ada alerting sama sekali, karena memberi rasa aman palsu dan menyembunyikan masalah nyata di tengah kebisingan.
   **Pencegahan:** (a) alert hanya pada yang **actionable** — setiap alert harus bisa dijawab "apa yang harus saya lakukan sekarang?"; kalau jawabannya "tidak ada", jadikan dashboard/laporan, bukan alert; (b) berbasis **gejala yang memengaruhi pengguna** (latency layanan tinggi), bukan setiap metrik mentah (CPU 60%); (c) **threshold wajar + durasi** (`for: 5m`) untuk menghindari flapping dan lonjakan sesaat; (d) **deduplikasi dan grouping** — satu outage = satu alert, bukan 100; (e) **prioritas jelas** (P1 sampai P4) dengan rute berbeda; (f) **runbook terhubung** dan escalation; (g) **review berkala** — matikan alert yang selalu palsu atau tidak pernah ditindaklanjuti.

6. **Error budget** = `100% − SLO`. Kalau SLO (target keandalan internal) adalah 99,9%, maka error budget adalah 0,1% — yaitu **berapa banyak "kegagalan" yang boleh terjadi** dalam periode tertentu (untuk 99,9%: ~43 menit downtime per bulan). Ini mengubah keandalan dari tujuan absolut "sebanyak mungkin" menjadi **anggaran yang dapat dikelola**.
   **Cara memandu keputusan:** kalau error budget masih **banyak tersisa**, tim boleh mengambil risiko — merilis fitur baru, melakukan perubahan, bereksperimen — karena ada ruang untuk kegagalan. Kalau error budget **hampir habis** (mis. sudah 40 dari 43 menit terpakai bulan ini), tim harus **membekukan perubahan berisiko** dan fokus pada stabilitas sampai periode berikutnya. Ini menyeimbangkan **inovasi vs keandalan** secara objektif berbasis data, alih-alih perdebatan subjektif. Konsep ini berasal dari Google SRE.

7. Flow monitoring memberi visibilitas ke **POLA dan HUBUNGAN trafik** — siapa berbicara dengan siapa, kapan, berapa banyak, protokol/port apa — yang tidak diberikan SNMP. SNMP hanya memberi **agregat per interface** (total byte masuk/keluar, error), tanpa tahu **percakapan individual**. Yang bisa dideteksi flow tetapi tidak SNMP: (a) **top talkers** — host mana yang memakai bandwidth terbanyak; (b) **beaconing** — koneksi berkala teratur ke satu tujuan (indikasi C2 malware); (c) **port scan** — satu sumber menghubungi banyak port/host; (d) **eksfiltrasi** — volume upload tidak wajar ke tujuan eksternal; (e) **DDoS** — banyak sumber ke satu tujuan; (f) **lateral movement** — koneksi antar-host internal yang tidak biasa; (g) **distribusi aplikasi** — berapa banyak trafik web vs backup vs VoIP. Ini menjadikan flow monitoring jembatan penting antara operasi jaringan dan keamanan, tanpa perlu menyimpan payload.

8. **Monitoring "up/down" hanya menangkap KETERSEDIAAN, bukan KUALITAS/KINERJA.** Perangkat bisa "up" (menjawab SNMP/ping) sementara layanan yang dilewatkannya **terdegradasi** — latency tinggi, packet loss, jitter, DNS lambat, atau congestion. Semua indikator biner "hijau", tetapi pengalaman pengguna buruk.
   Yang kurang: (a) **monitoring end-to-end/synthetic** yang mengukur **latency, loss, dan jitter** ke tujuan penting, bukan hanya "hidup atau mati"; (b) **monitoring LAYANAN**, bukan perangkat — waktu respons aplikasi, waktu resolusi DNS, waktu muat halaman, dari sudut pandang pengguna; (c) **baseline dan threshold pada metrik kualitas** — alert saat latency naik dari 20 ms ke 200 ms, bukan hanya saat interface mati; (d) mungkin juga **bufferbloat monitoring** (latency di bawah beban) dan **microburst detection** (`output drops`). Perbaikan: tambahkan probe synthetic (IP SLA, blackbox_exporter, atau layanan monitoring eksternal) yang mengukur pengalaman nyata, dan buat dashboard/alert berbasis metrik kualitas, bukan hanya status up/down.

</details>

---

## 15. Sumber

- RFC 3411-3418 — SNMPv3 · RFC 7011 — IPFIX · RFC 3176 — sFlow
- gNMI / OpenConfig — https://www.openconfig.net/
- Prometheus — https://prometheus.io/docs/ · Grafana — https://grafana.com/docs/
- Zabbix — https://www.zabbix.com/documentation · LibreNMS — https://docs.librenms.org/
- Google SRE Book — *Monitoring Distributed Systems*, *Service Level Objectives*
- Cisco, *IP SLAs Configuration Guide*

---

**Berikutnya:** `14-monitoring-troubleshooting/04-studi-kasus.md`. 15 skenario troubleshooting nyata dengan solusinya.

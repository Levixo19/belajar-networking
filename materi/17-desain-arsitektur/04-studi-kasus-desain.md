# 17.4 — Studi Kasus Desain End-to-End

> **Prasyarat:** `17.1–17.3` dan seluruh kurikulum
> **Tujuan:** Menerapkan semua yang dipelajari ke desain jaringan nyata dari kebutuhan sampai implementasi — latihan berpikir seperti arsitek jaringan.

---

## 1. Metodologi Desain (PPDIOO)

Cisco memakai siklus hidup **PPDIOO**:

```
Prepare  → pahami kebutuhan bisnis, anggaran, strategi
Plan     → analisis kebutuhan, audit yang ada, gap analysis
Design   → topologi, IP, VLAN, routing, keamanan, redundansi
Implement→ pasang & konfigurasi (bertahap, teruji)
Operate  → jalankan, pantau, pelihara
Optimize → tuning, perbaikan berkelanjutan → kembali ke Plan
```

💡 Kunci desain baik: **mulai dari kebutuhan (requirements), bukan dari teknologi.** Teknologi dipilih untuk memenuhi kebutuhan, bukan sebaliknya. Kumpulkan: jumlah user/situs, aplikasi kritis & kebutuhannya (bandwidth/latensi), kebutuhan keamanan/kepatuhan, anggaran, pertumbuhan, SLA.

---

## 2. Studi Kasus: PT Nusantara Jaya

**Kebutuhan bisnis:**
- Kantor pusat Jakarta (300 karyawan) + 2 cabang: Bandung (80), Surabaya (60).
- Aplikasi: ERP (di data center pusat), VoIP antar-cabang, email cloud (M365), web publik.
- Wi-Fi untuk karyawan + tamu di setiap lokasi.
- Kebutuhan: uptime tinggi untuk ERP & VoIP, keamanan (data pelanggan → UU PDP), anggaran menengah.
- Pertumbuhan: perkiraan +50% dalam 3 tahun.

### 2.1 Desain High-Level

```
        INTERNET ──────────── M365 (email cloud)
           │
     ┌─────┴──────┐              CABANG BANDUNG        CABANG SURABAYA
     │  KANTOR    │   SD-WAN      ┌──────────┐          ┌──────────┐
     │  PUSAT JKT │═══════════════│ Router   │          │ Router   │
     │            │   (MPLS +     │ Switch   │          │ Switch   │
     │ [DMZ:web]  │    internet)  │ AP       │          │ AP       │
     │ [DC:ERP]   │               └──────────┘          └──────────┘
     └────────────┘
```

**Keputusan arsitektur:**
- **Kampus pusat**: hierarki (collapsed core untuk hemat — cukup untuk 300 user), atau tiga-tier bila anggaran memungkinkan pertumbuhan.
- **WAN**: **SD-WAN** atas MPLS (utama, untuk VoIP/ERP dengan SLA) + internet (backup/offload) — redundansi transport.
- **Data center kecil** di pusat: server ERP (bisa beberapa VM di hypervisor + storage). Skala kecil → tidak perlu spine-leaf penuh; cukup pasangan switch redundan.
- **DMZ** untuk web server publik.
- **Email**: SaaS (M365) — tidak perlu server mail sendiri.

### 2.2 Pengalamatan IP (hierarkis)

```
Blok korporat: 10.0.0.0/8
  Pusat JKT :  10.1.0.0/16
  Bandung   :  10.2.0.0/16
  Surabaya  :  10.3.0.0/16
  Loopback  :  10.255.0.0/24  (/32 per perangkat)
  Link WAN  :  10.254.0.0/24  (/30 atau /31)

VLAN konsisten (contoh Pusat):
  VLAN 10 Data     10.1.10.0/24
  VLAN 20 Voice    10.1.20.0/24
  VLAN 30 Guest    10.1.30.0/24 (terisolasi)
  VLAN 50 Server   10.1.50.0/24
  VLAN 99 Mgmt     10.1.99.0/24
```
→ Setiap cabang bisa **diringkas** menjadi satu /16 ke pusat. IPv6 direncanakan paralel (mis. dari blok /48 yang dialokasikan).

### 2.3 Routing

```
- Dalam kampus pusat: OSPF area 0 (atau EIGRP) antar core/distribution
- WAN: BGP dengan provider MPLS; SD-WAN controller mengelola overlay
- Default route ke internet dari edge (dengan failover / IP SLA)
- Summarization: tiap situs iklankan /16-nya
- FHRP (HSRP/VRRP) untuk gateway redundan di distribution pusat
```

### 2.4 Keamanan (defense in depth + UU PDP)

```
- NGFW di perimeter (internet edge) + IPS
- DMZ untuk web server (isolasi dari internal)
- Segmentasi VLAN + ACL antar-zona; VLAN Guest terisolasi total
- 802.1X/NAC untuk port kabel & Wi-Fi korporat (WPA3-Enterprise)
- L2 hardening: port security, DHCP snooping, DAI, BPDU guard
- IPsec pada semua trafik WAN yang lewat internet
- Data pelanggan (ERP): enkripsi, segmen server terpisah, akses least-privilege
- Management VLAN terpisah + AAA (TACACS+/RADIUS) + logging terpusat
- UU PDP: dokumentasi aliran data, kontrol akses, audit trail, retensi
```

### 2.5 Wireless

```
- Controller-based (WLC) atau cloud-managed (Meraki) untuk kelola AP 3 lokasi terpusat
- SSID: KORP (WPA3-Ent/802.1X → VLAN sesuai user), TAMU (portal → VLAN 30 isolasi)
- Site survey per lokasi; desain kapasitas untuk area padat (aula pusat)
- Kanal non-overlap; PoE dari access switch
```

### 2.6 Redundansi & Ketersediaan

```
- Perangkat: dual core/distribution di pusat (HSRP)
- Link: EtherChannel uplink; ECMP di L3
- WAN: dua transport (MPLS + internet) via SD-WAN
- Power: dual PSU + UPS untuk core & DC
- Server ERP: cluster/HA + backup
```

### 2.7 Operasi & Manajemen

```
- Observability: syslog + SNMP/streaming telemetry ke collector; NTP tersinkron
- Config di Git; source of truth NetBox; otomasi Ansible untuk konsistensi
- Out-of-band management (console server)
- Runbook: failover WAN, tambah VLAN, ganti perangkat
- Monitoring uptime ERP/VoIP dengan alert
```

---

## 3. Proses Berpikir Arsitek

Saat mendesain, tanyakan berurutan:

```
1. Apa kebutuhan bisnis & aplikasi? (requirements dulu!)
2. Berapa skala sekarang & proyeksi tumbuh?
3. Topologi apa yang cocok? (SOHO/kampus hierarki/spine-leaf/WAN)
4. Bagaimana IP & VLAN direncanakan? (hierarkis, summarizable)
5. Routing apa? (statis/OSPF/EIGRP/BGP; failover)
6. Di mana redundansi diperlukan? (identifikasi & hilangkan SPOF kritis)
7. Bagaimana keamanan? (segmentasi, perimeter, akses, kepatuhan)
8. Wireless & WAN bagaimana?
9. Bagaimana dikelola & dipantau? (observability, otomasi, SoT)
10. Apakah desain memenuhi SLA & anggaran? (validasi trade-off)
```

⚠️ **Kesalahan pemula**: mulai dari "saya mau pakai teknologi X" alih-alih "kebutuhan menuntut apa". Selalu **requirements → desain → teknologi**. Dan selalu **validasi trade-off**: desain "sempurna" yang melebihi anggaran atau terlalu kompleks untuk dikelola tim adalah desain yang gagal.

---

## 4. Checklist Review Desain

```
□ Requirements terpenuhi (aplikasi, SLA, keamanan, kepatuhan)?
□ IP hierarkis & summarizable? Ruang tumbuh cukup? IPv6 direncanakan?
□ VLAN konsisten? Native VLAN diubah?
□ Routing konvergen & punya failover?
□ SPOF kritis dihilangkan (perangkat/link/WAN/power redundan)?
□ Segmentasi & defense-in-depth memadai? DMZ untuk publik?
□ Wireless: coverage & KAPASITAS? Guest terisolasi?
□ WAN redundan & ber-QoS?
□ Management plane terpisah? Observability & NTP siap?
□ Dokumentasi & source of truth? Otomasi untuk konsistensi?
□ Dalam anggaran? Bisa dikelola tim yang ada?
□ Skalabel untuk pertumbuhan proyeksi?
```

---

## 5. Ringkasan

- Gunakan siklus **PPDIOO** (Prepare, Plan, Design, Implement, Operate, Optimize).
- **Mulai dari requirements, bukan teknologi** — teknologi melayani kebutuhan bisnis/aplikasi.
- Desain end-to-end menyatukan: topologi (hierarki/SD-WAN/DC kecil), **IP hierarkis summarizable**, VLAN konsisten, routing + failover, **defense in depth** (NGFW/DMZ/segmentasi/802.1X/L2 hardening), wireless (kapasitas + guest terisolasi), **redundansi** (hilangkan SPOF kritis), dan **operasi** (observability, SoT, otomasi, OOB management).
- Selalu **validasi trade-off**: memenuhi SLA & keamanan **dalam anggaran** dan **dapat dikelola** tim.
- Gunakan **checklist review** untuk memastikan tidak ada yang terlewat.

---

## 6. Latihan

1. Apa arti PPDIOO dan kenapa "requirements dulu" begitu ditekankan?
2. Untuk PT Nusantara Jaya, kenapa collapsed core dipilih untuk pusat, bukan spine-leaf?
3. Kenapa email memakai SaaS (M365) alih-alih server sendiri, dan apa implikasi jaringannya?
4. Rancang segmentasi VLAN dan aturan antar-zona untuk memenuhi UU PDP pada data pelanggan.
5. Buat daftar SPOF pada desain awal dan usulkan redundansi untuk masing-masing.

<details>
<summary>Jawaban</summary>

1. **PPDIOO** = **Prepare** (pahami strategi & kebutuhan bisnis, anggaran), **Plan** (analisis kebutuhan detail, audit jaringan yang ada, gap analysis), **Design** (rancang topologi, IP, VLAN, routing, keamanan, redundansi), **Implement** (pasang dan konfigurasi secara bertahap dan teruji), **Operate** (jalankan, pantau, pelihara), **Optimize** (tuning dan perbaikan berkelanjutan, lalu kembali ke Plan) — siklus hidup jaringan Cisco. **"Requirements dulu" ditekankan** karena desain yang dimulai dari teknologi ("saya mau pakai X") cenderung salah sasaran: menghasilkan jaringan yang over-engineered (mahal, kompleks, melebihi kebutuhan) atau under-engineered (tidak memenuhi SLA/keamanan). Dengan memulai dari kebutuhan bisnis dan aplikasi (berapa user, aplikasi kritis dan kebutuhan bandwidth/latensinya, keamanan/kepatuhan, anggaran, pertumbuhan, SLA), setiap keputusan teknologi bisa **dibenarkan** oleh kebutuhan yang dilayaninya, dan trade-off bisa dievaluasi secara objektif.

2. Karena **spine-leaf dirancang untuk data center dengan trafik east-west masif** (banyak server saling berkomunikasi), sedangkan pusat PT Nusantara Jaya adalah **jaringan kampus 300 user** dengan trafik terutama **north-south** (user→server ERP, user→internet/cloud) dan hanya **data center kecil** (beberapa VM ERP). Spine-leaf akan **over-engineered** dan **boros anggaran** untuk skala ini — kompleksitas VXLAN/EVPN/BGP tidak sepadan dengan kebutuhan. **Collapsed core (dua-tier)** menggabungkan core dan distribution menjadi sepasang switch redundan — cukup untuk 300 user, hemat, lebih sederhana dikelola, dan sesuai anggaran menengah. (Untuk data center kecilnya, cukup sepasang switch redundan dengan MLAG untuk server dual-homed, bukan fabric spine-leaf.) Ini menerapkan prinsip "jangan over-engineer jaringan kecil".

3. **Email memakai SaaS (Microsoft 365)** karena: (a) menghilangkan kebutuhan membeli, mengonfigurasi, mengamankan, dan memelihara server mail sendiri (Exchange) beserta kompleksitasnya (anti-spam, backup, ketersediaan, patching); (b) skala dan keandalan dikelola vendor; (c) model OpEx sesuai anggaran menengah; (d) email modern menuntut SPF/DKIM/DMARC, reputasi IP, dan uptime tinggi yang sulit dikelola sendiri. **Implikasi jaringan:** (a) tidak perlu server mail di DMZ/DC (mengurangi permukaan serang dan beban), tetapi (b) **ketergantungan pada konektivitas internet** menjadi kritis — email kini "aplikasi cloud", jadi WAN/internet harus **redundan** (yang sudah dipenuhi SD-WAN dua transport); (c) perlu memastikan **DNS** (record MX menunjuk ke M365, plus SPF/DKIM/DMARC di DNS domain) dikonfigurasi benar; (d) trafik email keluar ke internet/cloud, bukan internal — QoS dan firewall harus mengizinkan; (e) pertimbangkan latensi/bandwidth ke region M365 terdekat.

4. (Contoh) **Segmentasi VLAN:** tempatkan server ERP berisi data pelanggan di **VLAN Server terpisah** (mis. VLAN 50, `10.1.50.0/24`) — bukan bercampur dengan VLAN user. Idealnya pisahkan lagi: **VLAN aplikasi ERP** dan **VLAN database** (data pelanggan di DB), sehingga hanya server aplikasi yang boleh mengakses DB. **Aturan antar-zona (ACL/firewall stateful):** (a) **User (VLAN 10) → ERP-App (VLAN 50)**: izinkan hanya port aplikasi ERP (mis. HTTPS 443) — user tidak boleh langsung ke database; (b) **ERP-App → Database**: izinkan hanya port DB (mis. 1521/1433/5432) dari server aplikasi tertentu; (c) **DB → mana pun**: tolak inisiasi keluar (database tidak boleh memulai koneksi); (d) **Guest (VLAN 30) → Server/DB**: **tolak total** (guest terisolasi); (e) **Voice, Mgmt**: tidak boleh mengakses DB kecuali host manajemen tertentu. **Kontrol tambahan UU PDP:** enkripsi data in-transit (TLS ke ERP) dan at-rest (di DB/storage), **akses least-privilege** dengan 802.1X/NAC dan AAA, **audit trail** (AAA accounting + syslog: siapa mengakses apa, kapan), dokumentasi aliran data pribadi, dan kebijakan retensi. Segmentasi ini memastikan data pelanggan hanya dapat diakses oleh sistem/orang yang berwenang lewat jalur yang terkontrol dan tercatat.

5. **SPOF pada desain awal dan usulan redundansi:**
   - **Core/distribution tunggal di pusat** → **dua switch core/distribution** dengan **HSRP/VRRP** (gateway redundan) dan **EtherChannel/ECMP** antar-lapisan.
   - **Uplink tunggal access→distribution** → **EtherChannel** (dua link teragregasi) atau uplink ganda ke dua distribution switch.
   - **Satu koneksi WAN** → **dua transport** (MPLS + internet) via **SD-WAN** dengan failover otomatis; idealnya dua provider berbeda.
   - **Router/edge WAN tunggal** → **dua router edge** dengan FHRP/routing failover.
   - **Catu daya tunggal pada perangkat kritis** → **dual PSU** + **UPS** (dan idealnya dua sumber listrik/genset untuk DC).
   - **Server ERP tunggal** → **cluster/HA** (beberapa VM di beberapa host hypervisor) + **backup** teratur dan rencana pemulihan.
   - **Storage tunggal** → storage redundan (RAID + kontroler ganda) atau replikasi.
   - **Satu koneksi internet untuk M365/web** → tercakup oleh redundansi WAN dua transport.
   - **Link server ke satu switch** → **dual-homing** ke dua switch dengan MLAG/vPC.
   ⚠️ Prioritaskan menghilangkan SPOF yang **dampaknya paling kritis** (ERP dan VoIP yang butuh uptime tinggi) lebih dulu, dan seimbangkan dengan anggaran — tidak setiap komponen wajib digandakan, tetapi jalur dan perangkat untuk aplikasi kritis harus punya cadangan.

</details>

---

## 7. Sumber

- Cisco PPDIOO / Cisco lifecycle services
- Cisco Validated Designs (CVD)
- *Top-Down Network Design* (Priscilla Oppenheimer, Cisco Press)
- Seluruh kurikulum ini (modul 1–16) sebagai referensi teknis

---

**Berikutnya:** `17-desain-arsitektur/05-operasi-kontinuitas` — operasi, kontinuitas bisnis, dan manajemen perubahan.

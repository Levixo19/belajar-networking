# 17.3 — Perencanaan IP, Penamaan & Dokumentasi

> **Prasyarat:** `04-network-layer/02-03` (subnetting/VLSM), `17.1–17.2`
> **Tujuan:** Anda bisa merencanakan skema pengalamatan IP yang rapi, konvensi penamaan, dan dokumentasi jaringan yang berguna.

---

## 1. Perencanaan Pengalamatan IP

Skema IP yang baik adalah **hierarkis, dapat diringkas (summarizable), dan menyisakan ruang tumbuh**.

```
BURUK (acak):
  Site A: 10.4.7.0/24, 192.168.55.0/24, 172.20.3.0/24  ← tak terpola
  → tak bisa di-summarize, sulit dibaca, sulit filter

BAIK (hierarkis):
  10.<site>.<vlan>.0/24
  Site 1: 10.1.0.0/16   → VLAN10=10.1.10.0/24, VLAN20=10.1.20.0/24
  Site 2: 10.2.0.0/16   → dapat di-summarize sebagai 10.2.0.0/16 ke core
```

**Prinsip perencanaan IP:**
- **Hierarki geografis/fungsi** — alokasikan blok per situs/region agar bisa diringkas (route summarization, `07-routing-lanjutan/07`).
- **Sisakan ruang** — jangan alokasikan mepet; sisakan blok untuk pertumbuhan.
- **Konsistensi** — pola yang sama di setiap situs (VLAN 10 selalu data, 20 selalu voice, dst.).
- **VLSM** — ukuran subnet sesuai kebutuhan (link P2P /30 atau /31, LAN /24) — lihat `04-network-layer/03`.
- **Rencanakan IPv6 sejak awal** (`08-ipv6`) — jangan ditambal belakangan.
- **Blok khusus**: manajemen, loopback (satu /32 per perangkat untuk router ID/telemetri), infrastruktur (link), server, user, guest, IoT.

💡 **Alamat loopback per perangkat** (mis. `10.255.0.1/32`, `10.255.0.2/32`, ...) memberi identitas stabil untuk router ID (OSPF/BGP), manajemen, dan telemetri — tidak terpengaruh interface fisik mana yang up/down. Praktik standar di jaringan profesional.

⚠️ **Route summarization hanya mungkin bila pengalamatan hierarkis.** Kalau subnet tersebar acak, Anda tidak bisa meringkas dan tabel routing membengkak. Rencanakan alokasi agar setiap situs/region memiliki blok kontinu yang bisa diringkas menjadi satu rute ke seluruh jaringan lain.

---

## 2. Perencanaan VLAN

```
Konvensi VLAN konsisten (contoh):
  VLAN 10  → Data (user)
  VLAN 20  → Voice
  VLAN 30  → Wireless-Guest
  VLAN 40  → Wireless-Corp
  VLAN 50  → Server
  VLAN 99  → Management
  VLAN 999 → Native (unused/blackhole)
```

⚠️ **Ubah native VLAN dari default (VLAN 1)** dan jangan pakai VLAN 1 untuk data — praktik keamanan (`03-data-link/03`, `12-keamanan/02`). Native VLAN sebaiknya VLAN "buangan" yang tidak dipakai untuk trafik apa pun.

💡 Petakan VLAN ke subnet secara konsisten (VLAN 10 = `10.x.10.0/24`) — memudahkan menghafal, troubleshooting, dan ACL.

---

## 3. Konvensi Penamaan

Nama yang konsisten mempercepat operasi dan troubleshooting.

```
Perangkat: <situs>-<peran><nomor>
  JKT-CORE-01, JKT-DIST-01, JKT-ACC-03, BDG-WAN-01, JKT-FW-01

Interface description:
  interface Gi0/1
   description ->JKT-DIST-01:Gi1/0/24 [Uplink]
  interface Gi0/2
   description ->SRV-DB-PROD-01 [VLAN50]

Hostname mencerminkan lokasi + peran + nomor.
```

**Prinsip penamaan:**
- **Konsisten & dapat diprediksi** — pola sama di seluruh jaringan.
- **Bermakna** — nama mengungkap lokasi, peran, nomor.
- **Interface description wajib** — setiap link penting diberi keterangan tujuannya. Ini menghemat waktu besar saat troubleshoot.
- Hindari nama yang membocorkan info sensitif ke luar (mis. jangan taruh model perangkat/versi di banner publik).

💡 **`description` pada setiap interface uplink dan koneksi server** adalah salah satu kebiasaan paling berharga. Saat jam 2 pagi menelusuri masalah, `show interface description` yang informatif menghemat menit-menit berharga dibanding menebak kabel mana ke mana.

---

## 4. Dokumentasi Jaringan

Dokumentasi yang berguna (bukan sekadar formalitas):

```
1. DIAGRAM TOPOLOGI
   - Fisik (perangkat, kabel, port, media)
   - Logis (VLAN, subnet, routing, L3)
   - Diperbarui saat berubah (idealnya as-code/otomatis)

2. TABEL PENGALAMATAN IP (IPAM)
   - Subnet, VLAN, gateway, rentang DHCP, alokasi statis
   - Sumber kebenaran (NetBox — 15-otomasi/04)

3. INVENTARIS PERANGKAT
   - Model, serial, versi OS, lokasi, peran, kontrak dukungan

4. KONFIGURASI (di Git — 15-otomasi/04)
   - Backup + riwayat perubahan

5. RUNBOOK / SOP
   - Prosedur umum (tambah VLAN, ganti perangkat, failover)
   - Kontak eskalasi, jendela pemeliharaan

6. DIAGRAM ALIR TRAFIK & DEPENDENSI
   - Aplikasi kritis, port, jalur, dependensi
```

⚠️ **Dokumentasi yang usang lebih berbahaya daripada tidak ada** — ia menyesatkan saat krisis. Karena itu praktik modern: **dokumentasi as-code** dan **source of truth** (NetBox) yang **otomatis** mencerminkan keadaan, plus diagram yang di-generate dari data. Lihat `15-otomasi/04`.

💡 **Diagram topologi** sebaiknya ada dua: **fisik** (apa terhubung ke apa, port berapa) untuk teknisi/kabel, dan **logis** (VLAN, subnet, routing) untuk desain/troubleshoot L3. Keduanya melayani kebutuhan berbeda.

---

## 5. Standar & Kepatuhan (Konteks Indonesia)

Dokumentasi dan desain sering harus memenuhi standar:
- **Baseline konfigurasi** — golden config yang di-audit (mis. CIS Benchmarks, `12-keamanan/05`).
- **UU PDP (UU No. 27/2022)** — bila jaringan menangani data pribadi: dokumentasikan aliran data, kontrol akses, dan retensi.
- **Sektoral** — POJK (keuangan), aturan Komdigi/Kominfo (telekomunikasi, penempatan data — `16.4`).
- **Audit trail** — perubahan tercatat (Git, AAA accounting, syslog) untuk kepatuhan.

---

## 6. Ringkasan

- **Pengalamatan IP** harus **hierarkis** (per situs/region), **dapat diringkas**, **konsisten**, memakai **VLSM**, menyisakan ruang tumbuh, dan **merencanakan IPv6 sejak awal**. Gunakan **loopback /32 per perangkat**.
- **Summarization** hanya mungkin bila alamat hierarkis — rencanakan blok kontinu per situs.
- **VLAN** konsisten (10=data, 20=voice, ...), petakan ke subnet, **ubah native VLAN** dari VLAN 1.
- **Penamaan** konsisten & bermakna (`JKT-DIST-01`); **interface description wajib** pada link penting.
- **Dokumentasi**: diagram (fisik+logis), IPAM, inventaris, config di Git, runbook/SOP, diagram alir aplikasi.
- Dokumentasi **usang menyesatkan** → praktik modern: **as-code + source of truth (NetBox) otomatis**.
- **Kepatuhan**: baseline config, UU PDP, aturan sektoral, audit trail.

---

## 7. Latihan

1. Kenapa pengalamatan IP hierarkis penting untuk route summarization?
2. Rancang skema IP untuk perusahaan dengan 3 cabang, masing-masing punya VLAN data/voice/mgmt. Jelaskan polanya.
3. Kenapa alamat loopback per perangkat berguna?
4. Kenapa interface description begitu penting dalam operasi?
5. Kenapa dokumentasi usang lebih berbahaya daripada tidak ada dokumentasi, dan apa solusinya?

<details>
<summary>Jawaban</summary>

1. **Route summarization** (agregasi rute) menggabungkan banyak subnet menjadi satu rute ringkas yang diiklankan ke bagian lain jaringan (mis. seluruh situs Jakarta `10.1.0.0/16` diiklankan sebagai satu rute ke core, bukan puluhan /24 terpisah). Ini hanya mungkin bila subnet-subnet yang diringkas **berdekatan dan kontinu dalam ruang alamat** (satu blok yang bisa dinyatakan sebagai satu prefix). Kalau pengalamatan **hierarkis** — setiap situs/region mendapat blok kontinu (Situs 1 = `10.1.0.0/16`, Situs 2 = `10.2.0.0/16`) — maka summarization mudah. Kalau subnet tersebar **acak** (subnet situs 1 berselang-seling dengan subnet situs 2 di seluruh ruang alamat), Anda tidak bisa membuat satu prefix yang mencakup persis satu situs, sehingga summarization gagal dan tabel routing membengkak (lebih banyak rute = lebih banyak memori, CPU, dan konvergensi lebih lambat). Jadi hierarki adalah **prasyarat** untuk summarization.

2. (Contoh) Pola **`10.<cabang>.<vlan>.0/24`** dalam blok `10.0.0.0/8`, dengan setiap cabang dialokasikan `/16`:
   - **Cabang 1 (Jakarta):** blok `10.1.0.0/16` → VLAN 10 (data) = `10.1.10.0/24`, VLAN 20 (voice) = `10.1.20.0/24`, VLAN 99 (mgmt) = `10.1.99.0/24`.
   - **Cabang 2 (Bandung):** blok `10.2.0.0/16` → data `10.2.10.0/24`, voice `10.2.20.0/24`, mgmt `10.2.99.0/24`.
   - **Cabang 3 (Surabaya):** blok `10.3.0.0/16` → data `10.3.10.0/24`, voice `10.3.20.0/24`, mgmt `10.3.99.0/24`.
   Nomor VLAN **konsisten** di semua cabang (10 selalu data, 20 selalu voice, 99 selalu mgmt), oktet kedua = nomor cabang, oktet ketiga = nomor VLAN. **Keuntungan:** (a) setiap cabang bisa **diringkas** menjadi satu `/16` ke core; (b) dari sebuah IP Anda langsung tahu cabang dan fungsinya (`10.2.20.5` = Bandung, voice); (c) menyisakan banyak ruang tumbuh (`/16` per cabang = 256 subnet /24). Link P2P antar-router bisa memakai blok terpisah (mis. `10.255.x.x` /30 atau /31) dan loopback `10.255.0.x/32`.

3. Alamat **loopback** adalah interface virtual yang **selalu up** selama perangkat hidup, tidak bergantung pada interface fisik mana pun. Berguna karena: (a) memberi **identitas stabil** untuk perangkat — dipakai sebagai **router ID** OSPF/BGP (yang idealnya tidak berubah); (b) menjadi **tujuan manajemen dan telemetri yang andal** — Anda bisa SSH/SNMP/mengirim telemetri ke loopback dan tetap terhubung selama *ada* jalur ke perangkat, meski satu interface fisik mati (routing akan mencari jalur lain ke loopback); (c) sumber yang konsisten untuk sesi (mis. BGP peering, syslog, NTP) sehingga tidak putus saat satu link turun. Memberi satu `/32` loopback per perangkat (mis. `10.255.0.1`, `10.255.0.2`) adalah praktik standar profesional.

4. Karena **interface description mendokumentasikan langsung di konfigurasi perangkat "apa yang terhubung ke port ini"** — tujuan link, perangkat/port di ujung lain, VLAN, atau layanan. Saat troubleshooting (sering di bawah tekanan, mis. saat outage tengah malam), `show interface description` yang informatif langsung memberi tahu Anda mana uplink ke distribution, mana ke server database, mana yang tidak dipakai — tanpa harus menelusuri kabel fisik, memeriksa CDP/LLDP satu per satu, atau menebak. Ini menghemat menit-menit kritis, mengurangi risiko salah mencabut/mematikan port yang salah, dan membuat konfigurasi menjadi dokumentasi yang hidup. Karena murah (satu baris) tetapi sangat berharga saat krisis, memberi description pada setiap link penting adalah salah satu kebiasaan operasional terbaik.

5. Dokumentasi **usang menyesatkan saat krisis**: saat terjadi outage dan Anda mengandalkan diagram/tabel yang ternyata sudah tidak sesuai kenyataan (VLAN sudah dipindah, perangkat sudah diganti, subnet sudah berubah), Anda membuat keputusan berdasarkan informasi salah — bisa mematikan port yang salah, salah mengarahkan troubleshooting, atau memperburuk keadaan. Sedangkan **tidak ada dokumentasi** setidaknya membuat Anda tahu harus memverifikasi keadaan aktual dari awal (tidak ada rasa percaya yang keliru). **Solusinya**: **dokumentasi as-code dan source of truth otomatis** — simpan konfigurasi dan definisi jaringan di Git dan sistem seperti **NetBox** yang menjadi sumber kebenaran, gunakan **otomasi** untuk menghasilkan diagram/laporan dari data aktual, dan audit **drift** (perbedaan antara niat di NetBox dan keadaan di perangkat) secara rutin. Dengan begitu dokumentasi mencerminkan kenyataan karena ia **dihasilkan dari** kenyataan/niat yang dikelola, bukan diperbarui manual (yang selalu ketinggalan). Lihat `15-otomasi/04`.

</details>

---

## 8. Sumber

- Cisco design & operations best practices
- RFC 1918 (private addressing) · RFC 7010 (IPv6 addressing plans) · RFC 4291
- NetBox documentation (IPAM/DCIM) — `15-otomasi/04`
- UU No. 27 Tahun 2022 (Perlindungan Data Pribadi)

---

**Berikutnya:** `17-desain-arsitektur/04-studi-kasus-desain.md` — studi kasus desain end-to-end.

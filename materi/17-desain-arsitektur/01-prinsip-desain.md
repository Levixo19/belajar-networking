# 17.1 — Prinsip Desain Jaringan

> **Prasyarat:** seluruh Tahap 1–16 (modul ini menyatukan semuanya)
> **Tujuan:** Anda paham prinsip desain jaringan yang baik — hierarki, redundansi, modularitas, skalabilitas — dan model arsitektur yang diuji CCNA 1.2.

---

## 1. Kenapa Desain Penting

Jaringan yang tumbuh tanpa desain ("organik") menjadi rapuh: sulit di-troubleshoot, sulit diskalakan, dan satu kegagalan bisa menjatuhkan semuanya. Desain yang baik mengejar lima tujuan:

```
1. RELIABILITY  — tetap jalan meski ada komponen gagal (redundansi)
2. SCALABILITY  — bisa tumbuh tanpa dirombak total
3. PERFORMANCE  — latensi & throughput sesuai kebutuhan aplikasi
4. SECURITY     — segmentasi, kontrol akses, defense-in-depth
5. MANAGEABILITY— mudah dipahami, dipantau, dan diubah
```

💡 **Trade-off selalu ada.** Redundansi penuh mahal; keamanan maksimal menambah kompleksitas; performa tertinggi butuh biaya. Desain yang baik menyeimbangkan kelimanya **sesuai kebutuhan bisnis dan anggaran** — bukan memaksimalkan satu aspek.

---

## 2. Model Hierarkis Tiga-Tier (CCNA 1.2.b)

Model klasik Cisco membagi jaringan kampus menjadi tiga lapisan dengan peran jelas:

```
        ┌──────── CORE ────────┐   Backbone: forwarding cepat, tak ada
        │   [Core-1] [Core-2]  │   filtering/policy rumit. Redundan penuh.
        └────┬────────────┬────┘
      ┌──────┴───┐   ┌────┴──────┐
      │DISTRIBUTION│  │DISTRIBUTION│  Kebijakan: routing antar-VLAN, ACL,
      │  [D1] [D2] │  │  [D3] [D4] │  QoS, agregasi. Batas L2/L3.
      └──┬────┬────┘  └──┬────┬────┘
      [A1][A2][A3]    [A4][A5][A6]   ACCESS: tempat endpoint nyambung.
       │   │   │        │   │   │    Port user, PoE, port security, VLAN.
     [PC][PC][AP]     [PC][IP-Phone]
```

| Lapisan | Peran | Fitur khas |
|---|---|---|
| **Core** | Backbone berkecepatan tinggi | Forwarding cepat, redundan, **tanpa** policy berat |
| **Distribution** | Agregasi & kebijakan | Inter-VLAN routing, ACL, QoS, batas L2/L3, FHRP |
| **Access** | Koneksi endpoint | Port user, PoE, port security, VLAN akses, PortFast |

⚠️ **Core harus "bodoh dan cepat".** Jangan taruh ACL/policy berat di core — itu tugas distribution. Core hanya meneruskan secepat mungkin. Menaruh kebijakan di core menambah latensi dan titik kegagalan.

---

## 3. Model Dua-Tier / Collapsed Core (CCNA 1.2.a)

Untuk jaringan lebih kecil, core dan distribution **digabung** ("collapsed core"):

```
      ┌── COLLAPSED CORE/DISTRIBUTION ──┐
      │        [CD-1]  [CD-2]           │  Core+Distribution jadi satu
      └────┬──────────────────┬────────┘
        [Access]          [Access]
```

💡 **Pilih berdasar ukuran:** **dua-tier (collapsed core)** untuk kampus kecil-menengah (hemat, cukup); **tiga-tier** untuk kampus besar dengan banyak distribution block (skalabilitas, isolasi fault). Jangan over-engineer jaringan kecil dengan tiga tier penuh.

---

## 4. Spine-Leaf (CCNA 1.2.c)

Untuk **data center** (trafik east-west), gunakan **spine-leaf**, bukan hierarki tiga-tier — sudah dibahas mendalam di `16-datacenter-cloud-sdn/01`. Ringkas: setiap leaf ke setiap spine, 2 hop konsisten, ECMP.

⚠️ **Jangan tertukar:** tiga-tier untuk **kampus** (north-south), spine-leaf untuk **data center** (east-west). CCNA menguji keduanya sebagai arsitektur topologi berbeda (1.2.b vs 1.2.c).

---

## 5. Tipe Jaringan menurut Skala (CCNA 1.2.d, 1.2.e)

```
SOHO (Small Office/Home Office)  — 1 perangkat all-in-one (router+switch+AP+FW)
LAN                              — satu lokasi (kampus, gedung)
Campus                           — beberapa gedung berdekatan
WAN                              — antar-lokasi berjauhan (lihat 11-wan-vpn)
Data Center                      — spine-leaf (lihat 16)
Cloud / Hybrid                   — on-prem + cloud (lihat 16.4)
```

- **SOHO (1.2.e):** satu perangkat menggabungkan router, switch, AP, dan firewall. Fokus kesederhanaan.
- **WAN (1.2.d):** menghubungkan lokasi berjauhan — MPLS, SD-WAN, internet+VPN (lihat `11-wan-vpn/01`).

---

## 6. Prinsip Desain Kunci

### Redundansi (hilangkan single point of failure)
```
- Perangkat ganda (dua core, dua distribution)
- Link ganda (EtherChannel, ECMP)
- Gateway redundan (HSRP/VRRP/GLBP — lihat 07-routing-lanjutan/08)
- Power ganda (dual PSU, UPS)
- Path ganda (WAN dari 2 provider)
```
⚠️ **Single Point of Failure (SPOF)** adalah komponen yang, bila gagal, menjatuhkan layanan. Desain andal mengidentifikasi dan menghilangkan SPOF — tetapi redundansi harus seimbang dengan biaya (tidak semua hal butuh redundansi penuh).

### Modularitas
Bagi jaringan menjadi blok/modul (distribution block, service block, DC block). Kegagalan atau perubahan di satu modul tidak merembet. Memudahkan skalabilitas (tambah modul) dan troubleshooting (isolasi).

### Skalabilitas
Rancang agar bisa tumbuh: sisakan ruang alamat IP (`04-network-layer`), rencanakan hierarki routing (summarization), pilih perangkat dengan kapasitas port/throughput cadangan.

### Batas L2/L3 di Distribution
```
ACCESS  — L2 (VLAN)
   │  ← trunk 802.1Q
DISTRIBUTION — batas L2↔L3: SVI/inter-VLAN routing, FHRP di sini
   │  ← L3 routed link
CORE — L3 murni (routing, ECMP)
```
💡 **Praktik modern: routed access** — dorong batas L3 sampai ke access (routing sampai access switch), menghilangkan STP antar-lapisan dan mempercepat konvergensi. Fabric SDN (SD-Access) melakukan ini.

---

## 7. Prinsip Keamanan dalam Desain

- **Defense in depth** — berlapis (perimeter firewall, segmentasi, host, aplikasi).
- **Segmentasi** — VLAN + ACL/firewall antar-segmen; mikrosegmentasi (Zero Trust, `12-keamanan/05`).
- **Least privilege** — hanya izinkan yang perlu.
- **Management plane terpisah** — jaringan/VLAN manajemen khusus, out-of-band bila mungkin.

Detail per-domain di `17.2`.

---

## 8. Ringkasan

- Desain baik menyeimbangkan **reliability, scalability, performance, security, manageability** — selalu ada trade-off, sesuaikan dengan bisnis.
- **Tiga-tier** (CCNA 1.2.b): **Core** (cepat, bodoh, redundan), **Distribution** (kebijakan, inter-VLAN, batas L2/L3, FHRP), **Access** (endpoint, PoE, port security).
- **Dua-tier/collapsed core** (1.2.a): core+distribution digabung untuk jaringan kecil-menengah.
- **Spine-leaf** (1.2.c): untuk **data center** (east-west) — jangan tertukar dengan tiga-tier (kampus, north-south).
- Skala: **SOHO** (all-in-one), LAN, campus, **WAN**, data center, cloud/hybrid.
- Prinsip: **redundansi** (hilangkan SPOF), **modularitas**, **skalabilitas**, batas **L2/L3 di distribution** (atau routed access modern).
- Keamanan: **defense in depth, segmentasi, least privilege, management plane terpisah**.

---

## 9. Latihan

1. Sebutkan lima tujuan desain jaringan dan kenapa selalu ada trade-off.
2. Jelaskan peran tiga lapisan hierarki dan kenapa core tidak boleh punya policy berat.
3. Kapan memilih collapsed core (dua-tier) dan kapan tiga-tier penuh?
4. Kenapa spine-leaf dipakai di data center, bukan hierarki tiga-tier?
5. Apa itu single point of failure dan sebutkan empat bentuk redundansi untuk menghilangkannya.

<details>
<summary>Jawaban</summary>

1. Lima tujuan: **reliability** (tahan terhadap kegagalan komponen), **scalability** (bisa tumbuh tanpa dirombak), **performance** (latensi/throughput memenuhi kebutuhan aplikasi), **security** (segmentasi, kontrol akses, berlapis), dan **manageability** (mudah dipahami, dipantau, diubah). **Selalu ada trade-off** karena memaksimalkan satu aspek biasanya mengorbankan yang lain dan/atau biaya: redundansi penuh (reliability) menggandakan biaya perangkat/link; keamanan maksimal (banyak segmentasi, inspeksi) menambah kompleksitas dan bisa menurunkan performa/manageability; performa tertinggi butuh hardware mahal. Desain yang baik **menyeimbangkan** kelimanya sesuai kebutuhan bisnis dan anggaran nyata, bukan memaksimalkan satu dimensi secara membabi buta.

2. **Core** = backbone berkecepatan tinggi yang tugas satu-satunya adalah **meneruskan trafik antar-distribution secepat mungkin**, dengan redundansi penuh. **Distribution** = titik **agregasi dan kebijakan**: inter-VLAN routing, ACL, QoS, batas L2/L3, FHRP — semua "kecerdasan" ada di sini. **Access** = tempat **endpoint terhubung**: port user, PoE untuk telepon/AP, port security, VLAN akses, PortFast. **Core tidak boleh punya policy berat** karena: (a) setiap ACL/inspeksi menambah **latensi** pada jalur yang harus paling cepat; (b) core adalah jalur semua trafik antar-blok, jadi kompleksitas di sana berdampak luas dan menambah **titik kegagalan/kesalahan**; (c) memisahkan peran (core cepat, distribution cerdas) menjaga desain modular dan mudah diskalakan. Prinsipnya: "core bodoh dan cepat, distribution cerdas".

3. Pilih **collapsed core (dua-tier)** untuk jaringan **kecil sampai menengah** — satu gedung atau kampus kecil dengan sedikit distribution block — karena menggabungkan core dan distribution menghemat biaya perangkat dan kompleksitas, dan kapasitasnya sudah cukup. Pilih **tiga-tier penuh** untuk **kampus besar** dengan **banyak distribution block/gedung**, di mana core terpisah diperlukan untuk: menghubungkan banyak distribution block tanpa mereka saling terhubung langsung (mengurangi kompleksitas mesh), skalabilitas (tambah distribution block tanpa mengganggu yang lain), dan isolasi fault. Aturan praktis: jangan over-engineer jaringan kecil dengan tiga tier; jangan memaksakan collapsed core saat jumlah blok sudah membuat core-nya menjadi bottleneck.

4. Karena data center didominasi trafik **east-west** (server↔server: microservices, replikasi, storage), sedangkan hierarki tiga-tier dioptimalkan untuk **north-south** (klien↔server/internet). Dalam tiga-tier, dua server di rak berbeda harus naik ke distribution/core lalu turun — **jumlah hop bergantung posisi** (latensi tak konsisten), dan **STP memblokir link redundan** (buang bandwidth). **Spine-leaf** memberi **jarak konsisten 2 hop** antara server mana pun, memakai routing L3 + **ECMP** sehingga **semua link aktif** (tak ada yang diblok STP), dan **skala horizontal** (tambah spine untuk bandwidth, tambah leaf untuk port). Jadi spine-leaf cocok dengan pola trafik dan kebutuhan bandwidth/latensi DC, sementara tiga-tier cocok untuk kampus.

5. **Single Point of Failure (SPOF)** adalah **satu komponen yang, bila gagal, menjatuhkan seluruh layanan** karena tidak ada cadangan — misalnya satu-satunya router, satu-satunya uplink, atau satu catu daya. Empat bentuk redundansi: **(1) perangkat ganda** (dua core, dua distribution switch); **(2) link ganda** (EtherChannel untuk agregasi, atau ECMP multi-path L3); **(3) gateway redundan** (FHRP: HSRP/VRRP/GLBP sehingga host tetap punya default gateway bila satu router mati); **(4) catu daya/jalur ganda** (dual PSU, UPS, dan untuk WAN: dua sirkuit dari dua provider berbeda). ⚠️ Redundansi harus seimbang dengan biaya — identifikasi SPOF yang dampaknya paling kritis dan lindungi itu lebih dulu, tidak semua hal perlu digandakan.

</details>

---

## 10. Sumber

- Cisco CCNA 200-301 v1.1 — topik 1.2 (two-tier, three-tier, spine-leaf, WAN, SOHO)
- Cisco Enterprise Campus Architecture / Cisco Validated Designs (CVD)
- Cisco *Borderless/SD-Access* design guides

---

**Berikutnya:** `17-desain-arsitektur/02-desain-per-domain.md` — desain per domain: kampus, WAN, DC, wireless.

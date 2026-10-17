# 16.6 SDN & Controller-Based Networking

> **Prasyarat:** `15-otomasi/01–02`, `16.1`, `07-routing-lanjutan/02` (control plane)
> **Tujuan:** Anda paham pemisahan control/data plane, jaringan berbasis controller, northbound/southbound API, dan AI/ML dalam operasi jaringan — sesuai CCNA 6.2, 6.3, dan 6.4.

---

## 1. Jaringan Tradisional vs Berbasis Controller (CCNA 6.2)

```
TRADISIONAL (terdistribusi)              BERBASIS CONTROLLER (terpusat)
Setiap perangkat punya otak sendiri      Satu controller = otak; perangkat = otot
  [R1]  [R2]  [R3]  ← masing-masing         ┌── Controller ──┐
   │     │     │      hitung sendiri          │   (otak/CP)    │
  konfigurasi per-perangkat                   └───┬───┬───┬────┘
  (CLI satu per satu)                          [SW] [SW] [SW]  ← ikuti perintah
```

| | **Tradisional** | **Berbasis Controller** |
|---|---|---|
| Control plane | Terdistribusi (tiap perangkat) | **Terpusat** (controller) |
| Konfigurasi | Per-perangkat (CLI) | Terpusat (GUI/API) |
| Kebijakan | Manual, tiap perangkat | Sekali, disebar otomatis |
| Visibilitas | Terpecah | Menyeluruh |
| Konsistensi | Rawan salah/drift | Terjamin |

> [!TIP]
> **CCNA 6.2** meminta membandingkan keduanya. Intinya: jaringan tradisional mengelola perangkat **satu per satu** dengan control plane di masing-masing; jaringan berbasis controller **memusatkan kecerdasan** sehingga Anda mengelola seluruh jaringan sebagai **satu sistem** lewat controller.

---

## 2. Pemisahan Control Plane & Data Plane (CCNA 6.3.a)

Ide inti SDN adalah **memisahkan** dua fungsi yang di router tradisional menyatu:

```
CONTROL PLANE (otak): memutuskan KE MANA trafik pergi
  - membangun tabel routing, menjalankan protokol, kebijakan
DATA PLANE (otot): benar-benar MENERUSKAN paket
  - forwarding berkecepatan tinggi berdasar tabel dari control plane
```

- **Tradisional:** control plane + data plane ada **di setiap perangkat**.
- **SDN:** control plane **dipindah ke controller terpusat**; perangkat menyisakan data plane yang menerima instruksi forwarding dari controller.

Kaitkan dengan `07-routing-lanjutan/02`: RIB dibangun control plane, FIB dipakai data plane. SDN memindahkan "pembangunan RIB" ke controller.

> [!WARNING]
> **Pemisahan ini adalah definisi inti SDN** dan pasti muncul di ujian CCNA. Perangkat SDN "murni" tidak berpikir sendiri — ia meneruskan sesuai instruksi controller. (Dalam praktik, banyak solusi bersifat *hibrida* — perangkat tetap punya sebagian control plane demi ketahanan bila controller putus.)

---

## 3. Underlay, Overlay, Fabric (CCNA 6.3)

Istilah yang sama dari `16.1`, dalam konteks SDN:

```
FABRIC   = seluruh infrastruktur SDN yang dikelola sebagai satu (underlay+overlay)
UNDERLAY = jaringan fisik (perangkat + kabel + IP routing dasar)
OVERLAY  = jaringan virtual/logis di atas underlay (mis. VXLAN tunnel yang
           dikelola controller berdasarkan kebijakan)
```

Contoh: **Cisco SD-Access** — fabric kampus dengan controller **Catalyst Center** (dulu DNA Center), underlay IS-IS, overlay VXLAN, kebijakan berbasis grup (SGT). **Cisco ACI** — versi data center (`16.1`).

---

## 4. Northbound & Southbound API (CCNA 6.3.b)

Controller berkomunikasi ke dua arah:

```
        [ Aplikasi / Otomasi / GUI / Skrip ]
                    ↕ NORTHBOUND API (REST) — ke "atas", ke aplikasi
              ┌──── CONTROLLER ────┐
                    ↕ SOUTHBOUND API — ke "bawah", ke perangkat
        [ Switch ]  [ Router ]  [ AP ]
```

| API | Arah | Menghubungkan | Contoh |
|---|---|---|---|
| **Northbound (NBI)** | Ke atas | Controller ↔ aplikasi/otomasi | **REST API** (JSON) |
| **Southbound (SBI)** | Ke bawah | Controller ↔ perangkat | **NETCONF, OpenFlow, gNMI, CLI** |

> [!TIP]
> **Cara mengingat:** **Northbound menghadap aplikasi/manusia** (biasanya REST API yang ramah developer — Anda menulis skrip yang bicara ke controller lewat sini). **Southbound menghadap perangkat** (protokol yang controller pakai untuk memerintah switch/router — NETCONF, OpenFlow). "North = ke atas ke software, South = ke bawah ke hardware."

> [!WARNING]
> **OpenFlow** adalah protokol southbound SDN klasik (memprogram tabel forwarding switch langsung), tetapi dalam praktik enterprise modern **NETCONF/gNMI** lebih umum sebagai southbound. CCNA fokus pada konsep NBI/SBI, bukan protokol spesifik.

---

## 5. Contoh Platform Controller

| Platform | Domain |
|---|---|
| **Cisco Catalyst Center** (DNA Center) | Kampus/enterprise (SD-Access) |
| **Cisco ACI / APIC** | Data center |
| **Cisco SD-WAN (vManage)** | WAN (lihat `11-wan-vpn/01`) |
| **Cisco Meraki Dashboard** | Cloud-managed (kampus/SOHO/AP) |
| **VMware NSX** | Overlay/virtualisasi jaringan |
| **OpenDaylight, ONOS** | Controller open-source |

> [!TIP]
> **Cloud-managed** (Meraki) adalah bentuk controller-based di mana controllernya **di cloud vendor** — Anda kelola lewat dashboard web, perangkat "menelepon pulang" ke cloud. CCNA 2.8 menyebut "cloud managed" sebagai salah satu metode akses/manajemen perangkat.

---

## 6. AI/ML dalam Operasi Jaringan (CCNA 6.4)

CCNA v1.1 menambahkan topik AI/ML — dua kategori:

```
PREDICTIVE AI/ML          →  memprediksi & mendeteksi dari data historis
  - deteksi anomali (trafik tak biasa = potensi serangan/kegagalan)
  - prediksi kapasitas ("link ini akan penuh bulan depan")
  - pemeliharaan prediktif (perangkat akan gagal)
  - baseline & alert cerdas (kurangi false positive)

GENERATIVE AI            →  menghasilkan konten/bantuan
  - asisten konfigurasi ("buatkan config VLAN untuk...")
  - ringkasan & penjelasan log/insiden
  - bantuan troubleshooting berbahasa alami
```

**AIOps** = penerapan AI/ML untuk operasi IT/jaringan: mengumpulkan telemetri masif (lihat `14-monitoring-troubleshooting/03`), mendeteksi pola, dan sering **bertindak otomatis** atau memberi rekomendasi.

> [!WARNING]
> **AI/ML di jaringan mengandalkan telemetri berkualitas** (streaming telemetry/gNMI, flow data). "Sampah masuk, sampah keluar" — model hanya sebaik data yang dikumpulkan. Ini menghubungkan kembali ke observability (`14.3`) dan otomasi (`15`).

> [!TIP]
> Untuk CCNA, cukup **memahami peran** AI prediktif (deteksi anomali, prediksi) vs generatif (asisten, ringkasan) dalam operasi jaringan — bukan detail algoritma. Ini topik konseptual (6.4).

---

## 7. Kenapa SDN & Otomasi Penting

```
Masalah jaringan tradisional pada skala:
  - Konfigurasi manual per-perangkat → lambat, rawan salah, tidak konsisten
  - Perubahan kebijakan = sentuh ratusan perangkat
  - Sulit dapat gambaran menyeluruh
  - Sulit merespons cepat (keamanan, kapasitas)

SDN/controller-based menjawab:
  ✅ Kebijakan sekali → disebar otomatis & konsisten
  ✅ Visibilitas & kontrol terpusat
  ✅ Programmable (API) → integrasi otomasi (15)
  ✅ Respons cepat & berbasis niat (intent-based networking)
```

**Intent-Based Networking (IBN):** Anda menyatakan **niat** ("segmen A tak boleh akses segmen B", "prioritaskan suara") dan controller menerjemahkannya menjadi konfigurasi perangkat, lalu terus **memverifikasi** bahwa niat terpenuhi. Puncak dari controller-based + otomasi + AI.

---

## 8. Ringkasan

- **Tradisional** (control plane terdistribusi, kelola per-perangkat) vs **berbasis controller** (control plane terpusat, kelola sebagai satu sistem) — CCNA 6.2.
- Inti SDN: **pisahkan control plane (otak: memutuskan ke mana) dari data plane (otot: meneruskan)** — control plane pindah ke **controller** (CCNA 6.3.a).
- **Fabric** = seluruh SDN dikelola sebagai satu; **underlay** = fisik; **overlay** = virtual (VXLAN) — CCNA 6.3.
- **Northbound API** (REST) menghadap **aplikasi/manusia**; **Southbound API** (NETCONF/OpenFlow/gNMI) menghadap **perangkat** (CCNA 6.3.b). "North = ke software, South = ke hardware."
- Platform: Catalyst Center (SD-Access), ACI/APIC (DC), SD-WAN/vManage, Meraki (cloud-managed), NSX.
- **AI/ML** (CCNA 6.4): **prediktif** (deteksi anomali, prediksi kapasitas) vs **generatif** (asisten config, ringkasan). Mengandalkan telemetri berkualitas (AIOps).
- **IBN (Intent-Based Networking)**: nyatakan niat → controller menerjemahkan & memverifikasi.

---

## 9. Latihan

1. Jelaskan perbedaan control plane dan data plane, dan bagaimana SDN mengubah letak keduanya.
2. Bandingkan jaringan tradisional dengan berbasis controller (minimal tiga aspek).
3. Apa perbedaan northbound dan southbound API? Beri contoh protokol/teknologi tiap arah.
4. Apa itu fabric, underlay, dan overlay dalam konteks SDN?
5. Jelaskan perbedaan peran AI prediktif dan generatif dalam operasi jaringan.

<details>
<summary>Jawaban</summary>

1. **Control plane** adalah "otak" yang **memutuskan ke mana trafik harus pergi** — menjalankan protokol routing, membangun tabel routing/kebijakan, memproses topologi. **Data plane** adalah "otot" yang **benar-benar meneruskan paket** dengan kecepatan tinggi berdasarkan keputusan/tabel yang dibuat control plane. Di jaringan **tradisional**, kedua plane ini berada **di setiap perangkat** (setiap router/switch berpikir sendiri dan meneruskan sendiri). **SDN memisahkannya**: control plane dipindahkan ke **controller terpusat** yang membuat keputusan untuk seluruh jaringan, sementara perangkat menyisakan **data plane** yang meneruskan paket sesuai instruksi dari controller. Ini memusatkan kecerdasan dan memungkinkan pengelolaan seluruh jaringan sebagai satu sistem.

2. (Tiga dari) **Control plane:** tradisional terdistribusi di tiap perangkat; berbasis controller terpusat. **Konfigurasi:** tradisional per-perangkat via CLI (satu per satu); berbasis controller terpusat via GUI/API dan disebar otomatis. **Kebijakan:** tradisional harus diterapkan manual di setiap perangkat (rawan tidak konsisten); berbasis controller didefinisikan sekali dan didorong konsisten ke semua. **Visibilitas:** tradisional terpecah (harus cek tiap perangkat); berbasis controller menyeluruh dari satu tempat. **Konsistensi/kesalahan:** tradisional rawan drift dan human error; berbasis controller lebih konsisten dan dapat diverifikasi.

3. **Northbound API (NBI)** menghubungkan controller **ke atas** — ke aplikasi, skrip otomasi, dan antarmuka manusia/GUI. Umumnya **REST API** (berbasis HTTP/JSON) yang ramah developer; Anda menulis program yang memberi tahu controller *apa* yang Anda inginkan. **Southbound API (SBI)** menghubungkan controller **ke bawah** — ke perangkat jaringan (switch/router/AP). Controller memakainya untuk *mengimplementasikan* keputusan pada perangkat. Contoh southbound: **NETCONF, OpenFlow, gNMI**, bahkan CLI. Cara mengingat: North menghadap software/manusia, South menghadap hardware/perangkat.

4. **Fabric** adalah keseluruhan infrastruktur SDN — kumpulan perangkat, underlay, dan overlay — yang dikelola dan diperlakukan **sebagai satu kesatuan** oleh controller. **Underlay** adalah **jaringan fisik**: perangkat, kabel, dan IP routing dasar (mis. IS-IS/OSPF) yang tugasnya menyediakan konektivitas dasar antar-perangkat. **Overlay** adalah **jaringan virtual/logis** yang dibangun di atas underlay (mis. tunnel VXLAN) tempat kebijakan dan segmentasi sebenarnya diterapkan oleh controller. Underlay menyediakan "jalan"; overlay membentuk topologi logis dan layanan di atasnya; fabric adalah keduanya dikelola bersama.

5. **AI prediktif** menganalisis data historis dan real-time untuk **memprediksi dan mendeteksi**: menemukan **anomali** (pola trafik tak biasa yang menandakan serangan atau kegagalan), **memprediksi kapasitas** (kapan sebuah link akan jenuh), **pemeliharaan prediktif** (perangkat yang cenderung gagal), dan membangun **baseline** untuk alert yang lebih cerdas (mengurangi false positive). Fokusnya: analisis dan peringatan. **AI generatif** **menghasilkan konten dan bantuan**: membuat draf konfigurasi dari deskripsi bahasa alami ("buatkan config VLAN untuk..."), **meringkas** log/insiden, menjelaskan masalah, dan membantu troubleshooting secara interaktif. Fokusnya: menghasilkan/menjelaskan. Keduanya bagian dari AIOps dan mengandalkan telemetri berkualitas; untuk CCNA cukup memahami peran masing-masing, bukan algoritmanya.

</details>

---

## 10. Sumber

- Cisco CCNA 200-301 v1.1 — topik 6.1 (dampak otomasi), 6.2 (tradisional vs controller), 6.3 (SDN/overlay/underlay/fabric/NBI-SBI), 6.4 (AI/ML)
- Cisco SD-Access, ACI, SD-WAN design guides
- ONF OpenFlow spec · OpenDaylight/ONOS docs
- *Software Defined Networks* (O'Reilly)

---

**Berikutnya:** `17-desain-arsitektur/01-prinsip-desain.md`. Menyatukan semuanya menjadi desain jaringan yang utuh.

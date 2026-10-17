# 16.1 Desain Data Center & Arsitektur Spine-Leaf

> **Prasyarat:** `03-data-link/04` (STP), `07-routing-lanjutan/04` (OSPF), `00-fondasi/05` (topologi)
> **Tujuan:** Anda paham kenapa data center modern beralih dari desain tiga-tier ke spine-leaf, dan konsep underlay/overlay — sesuai CCNA 1.2.c dan 6.3.

---

## 1. Kenapa Data Center Berbeda

Trafik di jaringan kampus tradisional sebagian besar **north-south** (klien ↔ server/internet). Data center modern didominasi trafik **east-west** (server ↔ server): microservices, replikasi database, storage terdistribusi, VM migration.

```
NORTH-SOUTH (kampus lama)          EAST-WEST (DC modern)
        Internet                    Server ←→ Server ←→ Server
           │                          │  ×  │  ×  │  ×  │
        [Core]                        semua saling bicara masif
        /    \                        (microservices, big data,
    [Server][Server]                   storage, AI training)
```

> [!WARNING]
> **Desain tiga-tier klasik (access-distribution-core) buruk untuk trafik east-west.** Dua server di rak berbeda mungkin harus naik ke distribution/core lalu turun lagi — banyak hop, latensi tak konsisten, dan **STP memblokir setengah link** sehingga bandwidth terbuang.

---

## 2. Masalah STP di Data Center

```
Dengan STP:
  [SW1]═══════[SW2]
     ║    ✗blok   ║        ← STP memblokir link redundan
  [SW3]═══════[SW4]           untuk cegah loop → 50% bandwidth mati
```

> [!WARNING]
> **STP hanya menyisakan satu jalur aktif** dan memblokir sisanya. Di DC yang butuh semua bandwidth dan banyak jalur setara, ini pemborosan besar. Konvergensi STP juga lambat untuk skala DC.

**Solusi:** hilangkan STP sebagai mekanisme utama. Gunakan **routing (Layer 3) di antara switch** dengan **ECMP (Equal-Cost Multi-Path)** — semua jalur aktif sekaligus.

---

## 3. Arsitektur Spine-Leaf (CCNA 1.2.c)

```
        [Spine-1]   [Spine-2]   [Spine-3]   [Spine-4]
         ╱ │ ╲ ╲    ╱ │ ╲ ╲     ╱ │ ╲ ╲     ╱ │ ╲
        ╱  │  ╲ ╲  ╱  │  ╲ ╲   ╱  │  ╲ ╲   ╱  │  ╲       Setiap leaf
   [Leaf-1] [Leaf-2] [Leaf-3] [Leaf-4] ... [Leaf-N]     terhubung ke
      │        │        │                                SETIAP spine
   [server] [server] [server]
```

**Aturan spine-leaf:**
- Setiap **leaf** terhubung ke **setiap spine** (full mesh bipartit).
- **Leaf tidak terhubung ke leaf.** **Spine tidak terhubung ke spine.**
- Server hanya terhubung ke leaf (disebut juga **ToR — Top of Rack**).
- Spine hanya menghubungkan leaf — tidak ada server di spine.

**Keunggulan:**

| Sifat | Manfaat |
|---|---|
| **Hop konsisten** | Server mana pun ke server mana pun = tepat **2 hop** (leaf→spine→leaf) — latensi prediktabel |
| **ECMP** | Semua uplink aktif; bandwidth = jumlah semua link (tak ada yang diblok STP) |
| **Skala horizontal** | Butuh bandwidth lebih? Tambah spine. Butuh port lebih? Tambah leaf |
| **Non-blocking** | Dengan rasio oversubscription tepat, tak ada bottleneck |
| **Fault domain kecil** | Satu spine mati → hanya kehilangan 1/N bandwidth, bukan setengah |

> [!TIP]
> **"Setiap server 2 hop dari server lain"** adalah inti spine-leaf. Latensi dan bandwidth jadi prediktabel — kritis untuk aplikasi terdistribusi. Bandingkan tiga-tier di mana jumlah hop bergantung posisi.

> [!WARNING]
> **Oversubscription ratio** adalah rasio bandwidth downlink (ke server) terhadap uplink (ke spine). Mis. leaf dengan 48×25G ke server dan 6×100G ke spine → 1200G:600G = **2:1**. Rasio 3:1 umum; 1:1 (non-blocking) mahal. Rasio terlalu tinggi = bottleneck saat trafik east-west padat.

---

## 4. Underlay dan Overlay (CCNA 6.3)

Data center modern memisahkan dua lapisan:

```
┌─────────────────────────────────────────────┐
│  OVERLAY  (jaringan virtual/logis)           │
│  VXLAN — VM/tenant seolah di satu L2 segment  │
│  meski tersebar di rak/leaf berbeda           │
├─────────────────────────────────────────────┤
│  UNDERLAY (jaringan fisik)                    │
│  Routing L3 (OSPF/BGP) + ECMP antar spine-leaf│
│  Tugasnya: kirim paket dari leaf A ke leaf B   │
└─────────────────────────────────────────────┘
```

- **Underlay** = jaringan fisik. IP routing sederhana dan cepat (OSPF atau BGP) dengan ECMP. Tugasnya hanya: bawa paket dari satu leaf ke leaf lain secepat mungkin.
- **Overlay** = jaringan virtual di atas underlay. **VXLAN** membungkus (encapsulate) frame Ethernet di dalam UDP/IP sehingga dua VM di rak berbeda merasa berada di segmen Layer 2 yang sama.

> [!TIP]
> **Analogi:** underlay adalah sistem jalan raya (fisik, stabil). Overlay adalah rute GPS yang bisa berubah-ubah di atas jalan yang sama. Anda bisa membuat ribuan jaringan virtual (overlay) tanpa mengubah kabel fisik (underlay).

Detail VXLAN/EVPN ada di modul berikutnya (`16.2`).

---

## 5. Komponen dan Istilah DC

```
ToR (Top of Rack)   = switch leaf di puncak rak, tempat server nyambung
EoR (End of Row)    = switch besar di ujung baris rak (desain alternatif)
Fabric              = keseluruhan jaringan spine-leaf sebagai satu kesatuan
Pod                 = satu blok spine-leaf; DC besar punya banyak pod
Superspine          = lapisan di atas spine untuk menghubungkan banyak pod
                      (arsitektur 3-tingkat untuk skala sangat besar)
```

```
DC SANGAT BESAR (multi-pod):
              [Superspine]
             ╱     │      ╲
        [Pod-1]  [Pod-2]  [Pod-3]     ← tiap pod = fabric spine-leaf
```

---

## 6. Fabric Terkelola: ACI dan Sejenisnya

Vendor menawarkan fabric spine-leaf yang dikelola secara terpusat oleh **controller** (bagian dari SDN, lihat `16.6`):

- **Cisco ACI (Application Centric Infrastructure)** — spine-leaf Nexus 9000 dikelola oleh controller **APIC**. Kebijakan berbasis aplikasi (endpoint group/EPG, contract).
- **Arista, Juniper, dll.** menawarkan pendekatan serupa (sering berbasis EVPN-VXLAN standar terbuka).

> [!TIP]
> **Controller memisahkan control plane (otak) dari data plane (switch),** memungkinkan Anda mengelola ratusan switch sebagai satu sistem lewat GUI/API. Ini konsep SDN yang diuji CCNA 6.2/6.3 — dibahas di `16.6`.

---

## 7. Ringkasan

- Data center modern didominasi trafik **east-west** (server↔server), bukan north-south — mengubah kebutuhan desain.
- **STP buruk untuk DC**: memblokir link redundan (buang bandwidth) dan lambat konvergen.
- **Spine-leaf** (CCNA 1.2.c): setiap leaf ke setiap spine; leaf tak ke leaf, spine tak ke spine. Server di leaf (ToR).
- Keunggulan: **2 hop konsisten**, **ECMP** (semua link aktif), skala horizontal, fault domain kecil.
- **Oversubscription ratio** (downlink:uplink) menentukan potensi bottleneck; 3:1 umum, 1:1 non-blocking (mahal).
- **Underlay** = routing L3 fisik (OSPF/BGP + ECMP); **Overlay** = jaringan virtual (VXLAN) di atasnya (CCNA 6.3).
- Istilah: ToR, fabric, pod, superspine (multi-pod).
- **Fabric terkelola** (Cisco ACI + APIC) memakai controller SDN — otak (control plane) terpisah dari switch (data plane).

---

## 8. Latihan

1. Kenapa trafik east-west membuat desain tiga-tier klasik kurang cocok untuk DC?
2. Kenapa STP merupakan masalah di data center, dan bagaimana spine-leaf mengatasinya?
3. Dalam spine-leaf, berapa hop antara dua server di rak berbeda, dan kenapa itu penting?
4. Sebuah leaf punya 48 port 25G ke server dan 8 port 100G ke spine. Berapa oversubscription ratio-nya?
5. Jelaskan perbedaan underlay dan overlay dengan analogi Anda sendiri.

<details>
<summary>Jawaban</summary>

1. Trafik **east-west** berarti server banyak berkomunikasi satu sama lain (microservices, replikasi DB, storage terdistribusi). Dalam desain tiga-tier, dua server di rak/access-switch berbeda harus mengirim trafik **naik** ke distribution lalu core, lalu **turun** lagi ke rak tujuan — banyak hop, dan jumlah hop **bergantung posisi** (server di rak berdekatan vs berjauhan berbeda latensinya). Selain itu STP memblokir jalur redundan sehingga bandwidth agregat terbatas. Untuk aplikasi terdistribusi yang butuh latensi rendah dan konsisten serta bandwidth east-west besar, ini tidak memadai.

2. **STP mencegah loop dengan memblokir semua jalur redundan kecuali satu** — sehingga setengah (atau lebih) link antar-switch tidak dipakai, membuang bandwidth mahal, dan konvergensi STP relatif lambat untuk skala DC. **Spine-leaf mengatasinya dengan memakai routing Layer 3 (OSPF/BGP) di antara switch alih-alih switching L2 + STP.** Karena setiap jalur leaf→spine adalah rute L3 yang setara, **ECMP** membuat **semua** uplink aktif sekaligus (tak ada yang diblok), dan tak ada loop L2 untuk dicegah. Bandwidth agregat = jumlah semua link.

3. Tepat **2 hop**: server → leaf sumber → spine (mana pun) → leaf tujuan → server. Ini penting karena **latensi menjadi prediktabel dan seragam** — server mana pun ke server mana pun punya jarak yang sama. Aplikasi terdistribusi (database cluster, microservices, AI training) sangat sensitif terhadap latensi yang tidak konsisten; spine-leaf menjaminnya tetap rata.

4. Downlink (ke server) = 48 × 25G = **1200G**. Uplink (ke spine) = 8 × 100G = **800G**. Rasio = 1200:800 = **1.5:1**. Artinya untuk setiap 1.5 Gbps trafik dari server, tersedia 1 Gbps uplink — cukup baik (lebih rendah dari 3:1 yang umum), bottleneck hanya terjadi kalau lebih dari ~67% trafik server serentak keluar rak.

5. (Contoh jawaban) **Underlay** ibarat jaringan pipa air fisik di sebuah kota — pipa, katup, pompa yang nyata dan jarang berubah. **Overlay** ibarat kontrak layanan air ke tiap pelanggan: Anda bisa menambah, memindah, atau menghapus pelanggan dan mengatur siapa terhubung ke siapa **tanpa menggali dan memasang pipa baru**. Underlay (routing IP fisik + ECMP) hanya bertugas mengantar paket antar-leaf secepatnya; overlay (VXLAN) membangun ribuan jaringan virtual di atasnya, membuat VM di rak berbeda seolah bertetangga di satu segmen — semua tanpa mengubah kabel fisik.

</details>

---

## 9. Sumber

- Cisco CCNA 200-301 v1.1 — topik 1.2.c (spine-leaf), 6.3 (overlay/underlay/fabric)
- Cisco *Data Center Fundamentals* / ACI docs
- RFC 7348 — VXLAN
- *BGP in the Data Center* (O'Reilly, Dinesh Dutta)

---

**Berikutnya:** `16-datacenter-cloud-sdn/02-overlay-vxlan-evpn.md`. Bagaimana overlay VXLAN/EVPN bekerja.

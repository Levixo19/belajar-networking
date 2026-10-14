# 16.2 — Overlay: VXLAN & EVPN

> **Prasyarat:** `16.1`, `03-data-link/03` (VLAN), `07-routing-lanjutan/06` (BGP)
> **Tujuan:** Anda paham bagaimana VXLAN membangun L2 di atas L3, kenapa VLAN tradisional tidak cukup untuk DC/cloud, dan peran EVPN sebagai control plane.

---

## 1. Kenapa VLAN Tidak Cukup

VLAN (802.1Q) punya batasan fundamental untuk DC dan cloud multi-tenant:

| Batasan VLAN | Dampak |
|---|---|
| **Field VLAN ID = 12 bit → max 4094** | Cloud dengan ribuan tenant kehabisan VLAN |
| **Terikat pada L2** | Segmen L2 tak bisa membentang antar-lokasi via L3 |
| **STP** | Membatasi skala dan membuang link (lihat `16.1`) |
| **Mobilitas VM** | Migrasi VM antar-rak butuh L2 yang sama — sulit di fabric L3 |

⚠️ **Batas 4094 VLAN** adalah pembunuh utama di lingkungan cloud multi-tenant. Satu penyedia cloud bisa punya puluhan ribu pelanggan yang masing-masing butuh segmen terisolasi.

---

## 2. VXLAN — L2 di Atas L3

**VXLAN (Virtual eXtensible LAN, RFC 7348)** membungkus frame Ethernet di dalam paket **UDP/IP**, sehingga segmen L2 dapat membentang di atas jaringan L3 (underlay).

```
Frame Ethernet asli (dari VM):
  [ MAC-DA | MAC-SA | 802.1Q | Payload ]

Dibungkus VXLAN saat keluar dari VTEP:
  [ IP luar | UDP | VXLAN header (VNI) | Frame Ethernet asli ]
    │                    │
    └ IP leaf sumber     └ VNI = 24 bit → 16 JUTA segmen
      ke IP leaf tujuan
```

**Istilah kunci:**
- **VTEP (VXLAN Tunnel Endpoint)** — titik yang membungkus/membuka VXLAN. Biasanya switch **leaf**. VTEP punya IP di underlay.
- **VNI (VXLAN Network Identifier)** — pengenal segmen, **24 bit = 16.777.216 segmen** (vs 4094 VLAN). Pengganti VLAN ID di dunia overlay.
- **Encapsulation/decapsulation** — VTEP sumber membungkus (encap), VTEP tujuan membuka (decap).

```
   VM-A (rak 1)                              VM-B (rak 9)
      │ frame Ethernet biasa                    │
   [Leaf-1/VTEP]                            [Leaf-9/VTEP]
      │ encap: [IP L1→L9 | UDP | VNI 5000 | frame]
      │─────────── underlay L3 (spine) ──────────│
      │                                     decap │
                VM-A dan VM-B merasa di satu LAN (VNI 5000)
```

💡 **VNI menggantikan VLAN ID di overlay** — 16 juta segmen vs 4094. VM-A dan VM-B di rak berbeda, terhubung lewat routing L3, tetapi **merasa berada di satu segmen L2 yang sama** karena VXLAN membungkus frame mereka. Inilah yang memungkinkan mobilitas VM dan multi-tenancy skala besar.

⚠️ **VXLAN menambah overhead ~50 byte** (IP+UDP+VXLAN header). Karena itu MTU underlay harus dinaikkan (jumbo frames, mis. 9000) agar frame overlay 1500 byte tidak terfragmentasi. Lupa menaikkan MTU underlay adalah penyebab umum masalah performa/PMTUD di fabric VXLAN.

---

## 3. Masalah: Bagaimana VTEP Tahu ke Mana?

VXLAN saja hanya mendefinisikan **data plane** (cara membungkus). Pertanyaannya: **bagaimana VTEP tahu MAC address mana ada di VTEP mana?**

**Cara lama (flood-and-learn):** pakai IP multicast di underlay untuk mem-flood BUM traffic (Broadcast, Unknown-unicast, Multicast). Boros dan sulit diskalakan — butuh multicast di underlay.

**Cara modern: EVPN sebagai control plane.**

---

## 4. EVPN — Control Plane untuk VXLAN

**EVPN (Ethernet VPN)** memakai **MP-BGP** (Multiprotocol BGP) untuk mendistribusikan informasi MAC dan IP antar-VTEP — sehingga tidak perlu flood-and-learn.

```
DATA PLANE   : VXLAN (bagaimana membungkus & mengirim)
CONTROL PLANE: EVPN via MP-BGP (siapa di mana — MAC/IP ke VTEP)
```

**Yang dilakukan EVPN:**
- VTEP mengiklankan (advertise) MAC dan IP host lokalnya lewat BGP EVPN ke VTEP lain.
- Setiap VTEP membangun tabel: "MAC X ada di VTEP dengan IP Y".
- **Mengurangi flooding** — VTEP tahu tujuan tanpa mem-flood.
- **ARP suppression** — VTEP bisa menjawab ARP lokal karena sudah tahu MAC/IP dari BGP, mengurangi broadcast ARP.
- Mendukung **routing antar-VNI** (integrated routing and bridging / IRB).

💡 **"VXLAN adalah amplop, EVPN adalah buku alamat."** VXLAN tahu cara membungkus dan mengirim paket; EVPN (lewat BGP) memberi tahu setiap VTEP alamat siapa ada di mana, sehingga pengiriman efisien tanpa flooding buta.

⚠️ **EVPN-VXLAN adalah standar de-facto data center modern** (menggantikan flood-and-learn dan solusi proprietary). Kombinasi ini: underlay BGP/OSPF + overlay VXLAN + control plane EVPN. Cisco, Arista, Juniper, Nokia, dan Cumulus/NVIDIA semuanya mendukungnya secara interoperabel.

---

## 5. Gambaran Utuh Fabric Modern

```
┌───────────────────────────────────────────────────────────┐
│ OVERLAY control : EVPN (MP-BGP) — distribusi MAC/IP         │
│ OVERLAY data    : VXLAN (VNI) — L2 virtual antar-leaf       │
├───────────────────────────────────────────────────────────┤
│ UNDERLAY        : BGP atau OSPF + ECMP — reachability leaf   │
│ FISIK           : spine-leaf, jumbo MTU (9000)              │
└───────────────────────────────────────────────────────────┘
```

Ini yang berjalan di balik Cisco ACI/NX-OS, Arista, dan fabric cloud. CCNA menyebutnya sebagai **overlay, underlay, dan fabric** (topik 6.3).

---

## 6. Ringkasan

- **VLAN tak cukup** untuk DC/cloud: batas **4094**, terikat L2, STP, sulit mobilitas VM.
- **VXLAN** (RFC 7348) membungkus frame Ethernet dalam **UDP/IP** → L2 membentang di atas L3.
- **VTEP** = titik encap/decap (biasanya leaf); **VNI** = pengenal segmen **24 bit = 16 juta** (pengganti VLAN ID).
- VXLAN menambah **~50 byte overhead** → underlay butuh **jumbo MTU** (mis. 9000).
- VXLAN hanya **data plane**; butuh control plane agar VTEP tahu MAC ada di mana.
- **EVPN** (via MP-BGP) = control plane: distribusi MAC/IP, kurangi flooding, ARP suppression, routing antar-VNI.
- **"VXLAN = amplop, EVPN = buku alamat."**
- **EVPN-VXLAN** = standar de-facto fabric DC modern (underlay BGP/OSPF + overlay VXLAN + EVPN).

---

## 7. Latihan

1. Sebutkan dua batasan VLAN yang membuatnya tidak cukup untuk cloud multi-tenant.
2. Apa itu VTEP dan VNI? Berapa banyak segmen yang bisa dibuat VNI dan bandingkan dengan VLAN.
3. Kenapa MTU underlay harus dinaikkan saat memakai VXLAN?
4. Apa perbedaan peran VXLAN dan EVPN? Jelaskan dengan analogi.
5. Apa keuntungan EVPN dibanding metode flood-and-learn lama?

<details>
<summary>Jawaban</summary>

1. (Dua dari) **(a) Batas 4094 VLAN** — field VLAN ID hanya 12 bit, sedangkan cloud bisa punya puluhan ribu tenant yang masing-masing butuh segmen terisolasi. **(b) Terikat pada Layer 2** — segmen VLAN tidak bisa membentang antar-lokasi yang dipisahkan routing L3, padahal DC modern memakai fabric L3 (spine-leaf). Tambahan: **(c) STP** membatasi skala dan membuang bandwidth; **(d) mobilitas VM** sulit karena migrasi antar-rak butuh segmen L2 yang sama.

2. **VTEP (VXLAN Tunnel Endpoint)** adalah titik yang membungkus (encapsulate) frame Ethernet ke dalam VXLAN saat masuk dan membukanya (decapsulate) saat keluar — biasanya switch leaf, dan punya alamat IP di underlay. **VNI (VXLAN Network Identifier)** adalah pengenal segmen overlay, analog dengan VLAN ID tetapi **24 bit**, memberi **16.777.216 (≈16 juta) segmen** dibanding hanya **4094** untuk VLAN. Jadi VNI mengatasi persis keterbatasan jumlah VLAN.

3. Karena **VXLAN menambahkan ~50 byte header** (IP luar + UDP + header VXLAN) ke setiap frame. Kalau frame overlay dari VM sudah berukuran 1500 byte (MTU Ethernet standar), setelah dibungkus menjadi ~1550 byte — melebihi MTU 1500 underlay, sehingga akan terfragmentasi atau di-drop. Dengan menaikkan MTU underlay (mis. jumbo frames 9000), frame overlay penuh dapat lewat tanpa fragmentasi. Lupa melakukan ini adalah penyebab umum masalah performa/konektivitas di fabric VXLAN.

4. **VXLAN adalah data plane** — ia mendefinisikan *bagaimana* frame dibungkus dan dikirim melintasi underlay (format amplop dan cara pengirimannya). **EVPN adalah control plane** — ia mendistribusikan informasi *siapa ada di mana* (MAC/IP host mana berada di VTEP mana) menggunakan MP-BGP. Analogi: **VXLAN adalah amplop dan sistem pos** (cara membungkus dan mengantar surat), sedangkan **EVPN adalah buku alamat** (yang memberi tahu alamat setiap penerima). Tanpa buku alamat, pos harus menebak/menyiarkan ke semua orang (flooding); dengan buku alamat, surat langsung ke tujuan.

5. Metode **flood-and-learn** lama mempelajari lokasi MAC dengan mem-flood BUM traffic (broadcast/unknown/multicast) ke semua VTEP, biasanya lewat IP multicast di underlay — boros bandwidth, butuh dukungan multicast, dan sulit diskalakan. **EVPN** mendistribusikan MAC/IP secara proaktif lewat BGP, sehingga: (a) VTEP tahu tujuan tanpa mem-flood (mengurangi trafik BUM), (b) mendukung **ARP suppression** (VTEP menjawab ARP lokal dari info BGP, mengurangi broadcast), (c) tidak butuh multicast di underlay, (d) mendukung routing antar-VNI (IRB), dan (e) konvergensi dan skalabilitas jauh lebih baik — sehingga menjadi standar de-facto.

</details>

---

## 8. Sumber

- RFC 7348 — VXLAN · RFC 7432 — BGP MPLS-Based Ethernet VPN (EVPN) · RFC 8365 — EVPN over VXLAN
- Cisco CCNA 200-301 v1.1 — topik 6.3 (overlay/underlay/fabric)
- Cisco/Arista EVPN-VXLAN design guides
- *BGP in the Data Center* (O'Reilly)

---

**Berikutnya:** `16-datacenter-cloud-sdn/03-storage-virtualisasi.md` — jaringan storage dan virtualisasi.

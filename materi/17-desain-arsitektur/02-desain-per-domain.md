# 17.2 — Desain per Domain

> **Prasyarat:** `17.1`, dan modul domain terkait (03 VLAN, 07 routing, 10 wireless, 11 WAN, 16 DC)
> **Tujuan:** Anda bisa menerapkan prinsip desain ke setiap domain: kampus, WAN, data center, wireless, dan keamanan.

---

## 1. Desain LAN Kampus

```
CORE (L3, redundan)
  │  routed links, OSPF/EIGRP, ECMP
DISTRIBUTION (batas L2/L3)
  │  - SVI per VLAN (inter-VLAN routing)
  │  - HSRP/VRRP untuk gateway redundan
  │  - ACL & QoS trust boundary
  │  - summarization ke core
ACCESS (L2)
  │  - VLAN akses (data + voice)
  │  - PortFast + BPDU Guard di port user
  │  - Port security, DHCP snooping, DAI (12-keamanan/02)
  │  - PoE untuk telepon/AP
[endpoint]
```

**Keputusan desain kampus:**
- **VLAN per fungsi**, bukan per lokasi (data, voice, guest, mgmt) — segmentasi jelas.
- **Voice VLAN** terpisah dari data (QoS + keamanan).
- **STP:** RSTP/Rapid-PVST+, root bridge di distribution (bukan access), aktifkan **Root Guard** di distribution & **BPDU Guard** di access (lihat `03-data-link/04`).
- **EtherChannel** untuk uplink access→distribution (agregasi + redundansi tanpa STP blocking).
- Pertimbangkan **routed access** (L3 sampai access) untuk konvergensi cepat.

⚠️ **Trust boundary QoS** biasanya di access (percaya marking dari IP phone via CDP/LLDP, tidak percaya dari PC). Tandai/ulang-tandai di tepi sebelum trafik masuk ke jaringan. Lihat `11-wan-vpn/03`.

---

## 2. Desain WAN

Menghubungkan lokasi berjauhan. Pilihan (lihat `11-wan-vpn/01`):

```
MPLS L3VPN     — SLA terjamin, mahal, dari provider
Internet+VPN   — murah, best-effort, IPsec
SD-WAN         — overlay cerdas atas banyak transport (MPLS+internet+LTE)
Metro-E        — Ethernet antar-lokasi dalam kota
```

**Prinsip desain WAN:**
- **Redundansi transport** — minimal dua jalur (mis. MPLS + internet), idealnya dua provider.
- **Routing WAN** — BGP dengan provider; backup dengan floating static atau IP SLA tracking.
- **QoS di WAN edge** — bandwidth WAN mahal & terbatas; prioritaskan suara/kritis (LLQ), shape ke kecepatan sirkuit.
- **Enkripsi** — IPsec untuk semua yang lewat internet.
- **DMVPN/SD-WAN** untuk topologi hub-spoke berskala dengan spoke-to-spoke dinamis.

💡 **SD-WAN** menjadi default untuk WAN multi-cabang modern: memanfaatkan internet murah dengan reliabilitas mendekati MPLS lewat pemilihan jalur dinamis, terpusat (controller), dan aman (enkripsi otomatis).

---

## 3. Desain Data Center

Lihat `16-datacenter-cloud-sdn` untuk detail. Ringkas prinsip:

```
- Spine-leaf (bukan tiga-tier) untuk east-west
- Underlay L3 (BGP/OSPF) + ECMP; overlay VXLAN + EVPN
- Oversubscription ratio terkontrol (mis. 3:1)
- Jumbo MTU (9000) untuk VXLAN & storage
- Redundansi: dual ToR (leaf), dual power, MLAG/vPC untuk server dual-homed
- Segmentasi: VRF/VNI per tenant; mikrosegmentasi (ACI EPG/NetworkPolicy)
- Storage network terpisah/QoS (16.3)
```

⚠️ **Server dual-homed** (terhubung ke dua leaf) butuh **MLAG/vPC** (Multi-chassis LACP) agar dua leaf tampak sebagai satu ke server — memberi redundansi tanpa STP blocking. Ini padanan EtherChannel yang membentang dua switch fisik.

---

## 4. Desain Wireless

Lihat `10-wireless/04` untuk detail site survey. Ringkas prinsip:

```
- Site survey (predictive + validation) → penempatan AP
- Kanal non-overlap 2.4GHz (1/6/11); lebar kanal hati-hati di 5/6GHz
- Kontrol daya TX & cell overlap 15-20% untuk roaming mulus
- Arsitektur: autonomous vs controller-based (WLC) vs cloud (Meraki)
- CAPWAP tunnel AP→WLC; pertimbangkan local vs central switching
- Kapasitas (bukan hanya coverage): hitung klien/AP untuk area padat
- Keamanan: WPA3/WPA2-Enterprise (802.1X) untuk korporat, OWE/pass untuk guest
- VLAN/SSID mapping: SSID korporat, guest (terisolasi), IoT
```

💡 **Desain untuk kapasitas, bukan hanya coverage.** Di area padat (aula, kelas), kebutuhan bukan "sinyal sampai" tetapi "cukup AP untuk jumlah klien". Satu AP melayani terbatas klien aktif — hitung kepadatan.

---

## 5. Desain Keamanan (Defense in Depth)

```
┌─ Perimeter ────────────────────────────────────┐
│  Firewall/NGFW, IPS, filter tepi (12-keamanan/03)│
│ ┌─ Segmentasi ─────────────────────────────────┐ │
│ │  VLAN + ACL/ZBF antar-zona; DMZ untuk publik  │ │
│ │ ┌─ Access control ──────────────────────────┐ │ │
│ │ │  802.1X/NAC, port security, AAA (12/04)    │ │ │
│ │ │ ┌─ Host/endpoint ─────────────────────────┐│ │ │
│ │ │ │  EDR, patching, hardening               ││ │ │
│ │ │ │ ┌─ Data ───────────────────────────────┐││ │ │
│ │ │ │ │  Enkripsi (TLS/IPsec), DLP           │││ │ │
│ │ │ │ └──────────────────────────────────────┘││ │ │
│ │ │ └──────────────────────────────────────────┘│ │ │
│ │ └────────────────────────────────────────────┘ │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Zona keamanan tipikal:**
- **Inside/Trusted** — jaringan internal (segmentasi lebih lanjut per fungsi).
- **DMZ** — server yang diakses publik (web, mail) — terisolasi dari inside.
- **Outside/Untrusted** — internet.
- **Management** — VLAN/jaringan terpisah untuk akses admin (idealnya out-of-band).
- **Guest** — terisolasi total dari internal.

⚠️ **DMZ** memisahkan server publik sehingga bila diretas, penyerang tidak langsung masuk jaringan internal. Trafik: outside→DMZ diizinkan (port layanan), DMZ→inside sangat dibatasi, inside→DMZ diizinkan. Jangan taruh server publik langsung di jaringan internal.

💡 **Menuju Zero Trust** (`12-keamanan/05`): segmentasi berbasis identitas (bukan hanya lokasi/VLAN), mikrosegmentasi, verifikasi setiap akses. Desain modern bergerak dari "perimeter keras, dalam lunak" ke "tidak percaya siapa pun secara default".

---

## 6. Manajemen & Operasi dalam Desain

Sering terlupa, tetapi kritis:
- **Out-of-band management** — jaringan manajemen terpisah (console server, port mgmt) agar tetap bisa akses perangkat saat jaringan produksi bermasalah.
- **Observability** sejak awal — SNMP/syslog/NetFlow/streaming telemetry (`14-monitoring-troubleshooting/03`), NTP tersinkron (untuk korelasi log), collector terpusat.
- **IP address management (IPAM)** & **source of truth** (NetBox, `15-otomasi/04`).
- **Dokumentasi & penamaan** konsisten (`17.3`).
- **Otomasi** (`15`) untuk konsistensi pada skala.

---

## 7. Ringkasan

- **Kampus**: hierarki (core/distribution/access), VLAN per fungsi, voice VLAN, RSTP+Root/BPDU Guard, EtherChannel uplink, trust boundary QoS di access, pertimbangkan routed access.
- **WAN**: redundansi transport (2 jalur/provider), BGP + failover, QoS di edge, IPsec, SD-WAN/DMVPN untuk skala.
- **Data center**: spine-leaf, underlay L3+ECMP, overlay VXLAN/EVPN, jumbo MTU, MLAG/vPC untuk dual-homing, segmentasi VRF/VNI.
- **Wireless**: site survey, kanal non-overlap, desain untuk **kapasitas**, WLC/cloud, WPA3/802.1X, SSID guest terisolasi.
- **Keamanan**: **defense in depth** berlapis, zona (inside/DMZ/outside/mgmt/guest), **DMZ** untuk server publik, menuju **Zero Trust**.
- **Operasi**: out-of-band management, observability sejak awal, IPAM/SoT, dokumentasi, otomasi.

---

## 8. Latihan

1. Di lapisan mana Anda menempatkan root bridge STP dan gateway HSRP di kampus, dan kenapa?
2. Sebutkan empat prinsip desain WAN.
3. Apa itu MLAG/vPC dan masalah apa yang dipecahkannya di data center?
4. Kenapa desain wireless untuk area padat harus fokus pada kapasitas, bukan coverage?
5. Apa fungsi DMZ dan bagaimana aturan trafik tipikalnya?

<details>
<summary>Jawaban</summary>

1. **Root bridge STP** ditempatkan di lapisan **distribution** (bukan access), dan sebaiknya **root primary di distribution switch yang juga aktif HSRP** agar jalur forwarding L2 dan gateway L3 selaras (menghindari trafik menyeberang link antar-distribution secara tidak perlu). **Gateway HSRP/VRRP (SVI)** juga di **distribution**, karena distribution adalah **batas L2/L3** — tempat inter-VLAN routing dan gateway default untuk VLAN berada. Alasannya: distribution adalah titik agregasi dan kebijakan; menaruh root dan gateway di sana membuat topologi forwarding predictable dan optimal, sementara access hanya L2 (menaruh root di access akan membuat jalur trafik aneh dan tidak stabil). Access mendapat **PortFast + BPDU Guard** justru untuk memastikan port user tidak pernah menjadi jalur STP/root.

2. (Empat dari) **(1) Redundansi transport** — minimal dua jalur WAN, idealnya dari dua provider berbeda, agar satu kegagalan sirkuit/provider tidak memutus lokasi. **(2) Routing dengan failover** — BGP dengan provider, atau floating static/IP SLA tracking untuk beralih ke backup otomatis. **(3) QoS di WAN edge** — karena bandwidth WAN mahal dan terbatas, prioritaskan trafik kritis (suara via LLQ) dan shape ke kecepatan sirkuit untuk menghindari drop di provider. **(4) Enkripsi** — IPsec untuk semua trafik yang melintasi internet publik. Tambahan: gunakan DMVPN/SD-WAN untuk topologi hub-spoke berskala dengan jalur spoke-to-spoke dinamis dan manajemen terpusat.

3. **MLAG (Multi-chassis Link Aggregation)** — di dunia Cisco Nexus disebut **vPC (virtual Port Channel)** — memungkinkan sebuah server (atau switch) yang terhubung ke **dua switch fisik berbeda** memperlakukan kedua uplink itu sebagai **satu EtherChannel/LACP bundle**, seolah kedua switch adalah satu perangkat logis. **Masalah yang dipecahkan:** server yang dual-homed ke dua leaf demi redundansi biasanya akan memicu **loop L2**, sehingga STP akan **memblokir salah satu link** (kehilangan setengah bandwidth dan redundansi aktif-aktif). Dengan MLAG/vPC, **kedua link aktif sekaligus** (tak ada yang diblok STP), memberikan redundansi perangkat **dan** bandwidth penuh — kalau satu leaf mati, server tetap terhubung lewat leaf lainnya tanpa gangguan STP.

4. Karena di area padat (aula, ruang kelas, stadion) tantangannya bukan "apakah sinyal Wi-Fi sampai ke seluruh area" (coverage) — itu mudah dipenuhi beberapa AP berdaya tinggi — melainkan "apakah ada **cukup kapasitas** untuk melayani banyak klien aktif secara bersamaan". Satu AP hanya bisa melayani sejumlah terbatas klien aktif dengan throughput layak (media Wi-Fi adalah **shared medium** — makin banyak klien, makin sedikit airtime per klien). Kalau didesain hanya untuk coverage, satu-dua AP mungkin "menjangkau" seluruh ruangan tetapi kewalahan saat ratusan perangkat terhubung. Desain kapasitas menghitung **jumlah klien per AP** dan menempatkan **lebih banyak AP dengan daya lebih rendah** (sel lebih kecil) sehingga klien terdistribusi merata — masing-masing AP melayani lebih sedikit klien dengan performa lebih baik.

5. **DMZ (Demilitarized Zone)** adalah zona jaringan terisolasi tempat menempatkan **server yang harus diakses dari publik/internet** (web server, mail server, DNS publik, reverse proxy). Fungsinya: **memisahkan server yang terekspos dari jaringan internal** sehingga jika server DMZ diretas, penyerang **tidak langsung** mendapat akses ke jaringan internal yang tepercaya. **Aturan trafik tipikal:** **Outside→DMZ** diizinkan tetapi hanya pada port layanan yang diperlukan (mis. 443 ke web server); **DMZ→Inside** sangat dibatasi/ditolak (server DMZ tidak boleh bebas menginisiasi koneksi ke internal — kalaupun perlu, hanya ke host/port spesifik seperti database backend); **Inside→DMZ** umumnya diizinkan (staf internal mengakses/mengelola server); **DMZ→Outside** dibatasi sesuai kebutuhan (mis. untuk update). Prinsipnya: server publik tidak pernah ditaruh langsung di jaringan internal, dan DMZ diperlakukan sebagai zona semi-tepercaya di antara outside dan inside.

</details>

---

## 9. Sumber

- Cisco CCNA 200-301 v1.1 — topik 1.2, dan desain lintas domain
- Cisco Validated Designs (CVD) — Campus, WAN, Data Center, Wireless
- Cisco SAFE (security reference architecture)

---

**Berikutnya:** `17-desain-arsitektur/03-perencanaan-dokumentasi.md` — perencanaan IP, penamaan, dan dokumentasi.

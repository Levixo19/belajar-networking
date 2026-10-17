# Lab 02: Routing

> **Prasyarat:** Tahap 4, 7, Lab 01
> **Platform:** Packet Tracer / GNS3 / Containerlab (FRR)
> **Format:** TUGAS → VERIFIKASI → KRITERIA SUKSES → solusi.

---

## Lab 2.1: Static Routing & Default Route

**Topologi:** R1 — R2 — R3 (rantai); tiap router punya LAN sendiri.
```
[LAN A 10.0.1.0/24]--R1--[10.0.12.0/30]--R2--[10.0.23.0/30]--R3--[LAN C 10.0.3.0/24]
```

**TUGAS:**
1. Konfigurasi IP semua interface.
2. Tambah static route agar LAN A bisa mencapai LAN C dan sebaliknya.
3. Di R1, tambah **default route** ke R2 (simulasi ke internet).
4. Uji ping end-to-end (host LAN A → host LAN C).

**VERIFIKASI:** `show ip route`; `traceroute` menunjukkan jalur R1→R2→R3.

**KRITERIA SUKSES:** ✅ Ping LAN A ↔ LAN C berhasil; tabel routing benar.

<details><summary>Solusi & penjelasan</summary>

```
R1(config)# ip route 10.0.3.0 255.255.255.0 10.0.12.2   (ke LAN C via R2)
R1(config)# ip route 0.0.0.0 0.0.0.0 10.0.12.2           (default route)
R2(config)# ip route 10.0.1.0 255.255.255.0 10.0.12.1
R2(config)# ip route 10.0.3.0 255.255.255.0 10.0.23.3
R3(config)# ip route 10.0.1.0 255.255.255.0 10.0.23.2
```
Setiap router hanya tahu jaringan yang **langsung terhubung** (connected) secara default; static route memberi tahu jalur ke jaringan jauh. **Routing harus dua arah** — R3 juga butuh rute balik ke LAN A, kalau tidak ping gagal separuh jalan (paket sampai tapi balasan tersesat). `traceroute` memverifikasi jalur. Membuktikan `07-routing-lanjutan/01`. ⚠️ Kesalahan umum: lupa rute balik.
</details>

---

## Lab 2.2: Floating Static (Backup Route)

**Topologi:** R1 ke R2 punya **dua jalur** (primer + backup).

**TUGAS:**
1. Buat rute utama ke suatu jaringan via jalur A (AD default 1).
2. Buat **floating static** via jalur B dengan AD lebih tinggi (mis. 10).
3. Uji: normal lewat jalur A; matikan jalur A → otomatis lewat jalur B.

**VERIFIKASI:** `show ip route` (hanya jalur A saat normal); setelah jalur A down, jalur B muncul.

**KRITERIA SUKSES:** ✅ Failover otomatis ke jalur backup saat primer putus.

<details><summary>Solusi & penjelasan</summary>

```
R1(config)# ip route 10.0.9.0 255.255.255.0 10.0.12.2         (primer, AD=1)
R1(config)# ip route 10.0.9.0 255.255.255.0 10.0.13.2 10      (backup, AD=10)
```
Angka `10` di akhir = **administrative distance**. Router memilih rute dengan **AD terendah**, jadi jalur primer (AD 1) dipakai; rute backup "mengambang" (tidak di tabel routing) sampai primer hilang. Saat primer down, backup (AD 10) masuk tabel. Ini pola failover WAN dasar (`17/02`). Membuktikan konsep AD dari `07-routing-lanjutan/02`. Kombinasikan dengan IP SLA untuk deteksi kegagalan yang lebih pintar.
</details>

---

## Lab 2.3: Inter-VLAN Routing (Router-on-a-Stick & SVI)

**Topologi:** switch dengan VLAN 10 & 20 + router (atau L3 switch).

**TUGAS (pilih satu atau keduanya):**
- **A. Router-on-a-stick:** trunk switch→router, subinterface per VLAN di router.
- **B. SVI (L3 switch):** buat interface VLAN di switch L3.
1. Konfigurasi gateway tiap VLAN.
2. Uji: PC VLAN 10 sekarang BISA ping PC VLAN 20 (lewat routing).

**VERIFIKASI:** ping antar-VLAN berhasil; `show ip route` menampilkan connected VLAN.

**KRITERIA SUKSES:** ✅ Inter-VLAN routing jalan (yang di Lab 1.2 gagal, kini berhasil).

<details><summary>Solusi & penjelasan</summary>

**A. Router-on-a-stick:**
```
R1(config)# interface gi0/0.10
R1(config-subif)# encapsulation dot1Q 10
R1(config-subif)# ip address 10.0.10.1 255.255.255.0
R1(config)# interface gi0/0.20
R1(config-subif)# encapsulation dot1Q 20
R1(config-subif)# ip address 10.0.20.1 255.255.255.0
```
(Link switch→router harus trunk.) **B. SVI di L3 switch:**
```
SW(config)# ip routing
SW(config)# interface vlan 10
SW(config-if)# ip address 10.0.10.1 255.255.255.0
SW(config)# interface vlan 20
SW(config-if)# ip address 10.0.20.1 255.255.255.0
```
Set gateway PC = IP SVI/subinterface VLAN-nya. Kini VLAN 10 & 20 terhubung via **routing L3** (yang di Lab 1.2 terisolasi). SVI lebih umum & cepat (di-hardware oleh L3 switch). Membuktikan konsep inter-VLAN & `17/01` (batas L2/L3 di distribution). ⚠️ Jangan lupa set gateway di PC.
</details>

---

## Lab 2.4: OSPF Single-Area

**Topologi:** 3 router (R1-R2-R3) + LAN di tiap router.

**TUGAS:**
1. Aktifkan OSPF area 0 di semua router.
2. Iklankan semua jaringan connected.
3. Set router-id manual (mis. 1.1.1.1, 2.2.2.2, 3.3.3.3).
4. Verifikasi adjacency terbentuk & semua LAN saling terjangkau.

**VERIFIKASI:** `show ip ospf neighbor` (FULL), `show ip route ospf` (rute O), ping end-to-end.

**KRITERIA SUKSES:** ✅ Semua neighbor FULL, rute OSPF terpelajari, konektivitas penuh.

<details><summary>Solusi & penjelasan</summary>

```
R1(config)# router ospf 1
R1(config-router)# router-id 1.1.1.1
R1(config-router)# network 10.0.1.0 0.0.0.255 area 0
R1(config-router)# network 10.0.12.0 0.0.0.3 area 0
```
(Sama di R2, R3 dengan jaringan masing-masing; ingat **wildcard mask**, bukan subnet mask — `04-network-layer/03`.) `show ip ospf neighbor` harus menunjukkan state **FULL** (adjacency terbentuk). OSPF otomatis menemukan jalur terbaik via cost (bandwidth). Tak perlu rute balik manual seperti static — OSPF mendistribusikan semua rute. Membuktikan `07-routing-lanjutan/04`. ⚠️ Adjacency tak terbentuk? Cek: area cocok, subnet link cocok, MTU cocok, tidak ada mismatch timer/tipe jaringan.
</details>

---

## Lab 2.5: OSPF DR/BDR pada Segmen Broadcast

**Topologi:** 3+ router di **satu segmen broadcast** (switch bersama).

**TUGAS:**
1. Hubungkan 3 router ke satu switch (segmen multi-access).
2. Aktifkan OSPF; amati pemilihan **DR/BDR**.
3. Pengaruhi pemilihan: set `ip ospf priority` lebih tinggi di router yang diinginkan jadi DR.
4. Identifikasi DR, BDR, dan DROther.

**VERIFIKASI:** `show ip ospf neighbor` (kolom state: DR/BDR/DROTHER).

**KRITERIA SUKSES:** ✅ DR/BDR terpilih sesuai priority; memahami peran DR.

<details><summary>Solusi & penjelasan</summary>

```
R1(config)# interface gi0/0
R1(config-if)# ip ospf priority 100      (dorong jadi DR)
# priority 0 = tidak pernah jadi DR/BDR
```
Pada segmen **broadcast/multi-access**, OSPF memilih **DR (Designated Router)** dan **BDR** untuk mengurangi flooding LSA (semua router membentuk full adjacency hanya dengan DR/BDR, bukan satu sama lain — mengurangi n² adjacency jadi linear). Pemilihan: **priority tertinggi** menang; seri → **router-id tertinggi**. ⚠️ DR/BDR **non-preemptive** — router yang sudah jadi DR tetap DR meski ada priority lebih tinggi belakangan (harus clear/restart OSPF). Membuktikan `07-routing-lanjutan/04` (CCNA 3.4.c).
</details>

---

## Lab 2.6 (Lanjutan): BGP eBGP Dua AS

**Topologi:** R1 (AS 65001) — R2 (AS 65002); simulasi dua ISP/organisasi. *(Butuh GNS3/Containerlab/FRR untuk realistis; PT terbatas.)*

**TUGAS:**
1. Konfigurasi eBGP antara R1 dan R2 (AS berbeda).
2. Iklankan sebuah jaringan lokal via BGP di tiap AS.
3. Verifikasi rute BGP dipertukarkan & jalur terbentuk.

**VERIFIKASI:** `show ip bgp summary` (neighbor Established), `show ip bgp` (rute dengan AS-path).

**KRITERIA SUKSES:** ✅ Sesi BGP Established, rute dari AS lain terlihat dengan AS-path.

<details><summary>Solusi & penjelasan</summary>

```
R1(config)# router bgp 65001
R1(config-router)# neighbor 10.0.12.2 remote-as 65002
R1(config-router)# network 10.0.1.0 mask 255.255.255.0
R2(config)# router bgp 65002
R2(config-router)# neighbor 10.0.12.1 remote-as 65001
R2(config-router)# network 10.0.2.0 mask 255.255.255.0
```
`show ip bgp summary` → state **Established** (bukan Idle/Active). `show ip bgp` menampilkan rute dengan **AS-path** (mis. rute R2 terlihat di R1 dengan path `65002`). eBGP = antar-AS (protokol internet). ⚠️ `network` di BGP harus **cocok persis** dengan rute di tabel routing (mask tepat) agar diiklankan. Membuktikan `07-routing-lanjutan/06`. Eksperimen: tambah AS ketiga, amati AS-path memanjang & path selection.
</details>

---

## Ringkasan Lab 02

Anda mempraktikkan: static routing + default + rute balik, floating static (failover/AD), inter-VLAN (RoaS & SVI), OSPF single-area + DR/BDR, dan eBGP. Ini inti CCNA domain 3.0 (IP Connectivity, 25% — terbesar).

> [!TIP]
> Eksperimen lanjutan: redistribusi static↔OSPF (`07/07`), OSPF cost manipulation, BGP path selection. Dokumentasikan untuk portofolio.

**Berikutnya:** `lab/03-lab-ip-services.md`. DHCP, DNS, NAT, ACL.

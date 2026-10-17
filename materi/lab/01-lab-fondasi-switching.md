# Lab 01: Fondasi & Switching

> **Prasyarat:** Tahap 0-3, `lab/00-setup-lab.md`, `lab/00b-panduan-packet-tracer`
> **Platform:** Packet Tracer / GNS3 (Cisco). Tugas MikroTik & Linux ada di lab tersendiri.
> **Format:** setiap lab punya TUGAS → VERIFIKASI → KRITERIA SUKSES → solusi (dalam `<details>`).

---

## Lab 1.1: Alamat IP & Konektivitas Dasar

**Topologi:** 2 PC + 1 switch (2960).

**TUGAS:**
1. Beri PC1 = `192.168.1.10/24`, PC2 = `192.168.1.20/24`.
2. Hubungkan keduanya ke switch.
3. Pastikan PC1 bisa ping PC2.

**VERIFIKASI:** `ping 192.168.1.20` dari PC1 berhasil (0% loss).

**KRITERIA SUKSES:** Ping berhasil dua arah.

<details><summary>Solusi & penjelasan</summary>

Di PC (Desktop → IP Configuration): set IP dan subnet mask. Tidak perlu gateway (satu subnet). Switch bekerja tanpa konfigurasi (semua port VLAN 1 default). Ping berhasil karena keduanya di subnet `192.168.1.0/24` yang sama, switch mem-flooding ARP lalu belajar MAC. Jika gagal: cek IP/mask benar, kabel terhubung (lampu hijau), dan firewall PC (di PT tidak ada). Ini memverifikasi pemahaman `04-network-layer/01` (IP) dan `03-data-link/02` (switching).
</details>

---

## Lab 1.2: VLAN & Access Port

**Topologi:** 4 PC + 1 switch. PC1,PC2 → VLAN 10; PC3,PC4 → VLAN 20.

**TUGAS:**
1. Buat VLAN 10 (STAFF) dan VLAN 20 (TAMU).
2. Assign port: Fa0/1-2 ke VLAN 10, Fa0/3-4 ke VLAN 20.
3. IP: PC1,2 = `10.0.10.x/24`; PC3,4 = `10.0.20.x/24`.
4. Uji: PC1 bisa ping PC2 (sama VLAN), TIDAK bisa ping PC3 (beda VLAN).

**VERIFIKASI:** `show vlan brief`; ping dalam VLAN berhasil, antar-VLAN gagal.

**KRITERIA SUKSES:** Ping intra-VLAN OK, inter-VLAN gagal (isolasi terbukti).

<details><summary>Solusi & penjelasan</summary>

```
Switch(config)# vlan 10
Switch(config-vlan)# name STAFF
Switch(config)# vlan 20
Switch(config-vlan)# name TAMU
Switch(config)# interface range fa0/1-2
Switch(config-if-range)# switchport mode access
Switch(config-if-range)# switchport access vlan 10
Switch(config)# interface range fa0/3-4
Switch(config-if-range)# switchport mode access
Switch(config-if-range)# switchport access vlan 20
```
Verifikasi: `show vlan brief` menampilkan port di VLAN masing-masing. PC1 tak bisa ping PC3 karena VLAN memisahkan broadcast domain. Tanpa router/SVI, tidak ada jalur antar-VLAN. Ini membuktikan konsep `03-data-link/03`. (Untuk menghubungkannya, Anda butuh inter-VLAN routing di Lab 2.3.)
</details>

---

## Lab 1.3: Trunk 802.1Q antar-Switch

**Topologi:** 2 switch dihubungkan; VLAN 10 & 20 ada di keduanya; PC di tiap switch.

**TUGAS:**
1. Konfigurasi VLAN 10, 20 di kedua switch.
2. Buat link antar-switch sebagai **trunk** (802.1Q), izinkan VLAN 10,20.
3. Ubah native VLAN ke 99 (praktik keamanan).
4. Uji: PC VLAN10 di SW1 bisa ping PC VLAN10 di SW2 (lewat trunk).

**VERIFIKASI:** `show interfaces trunk`; ping antar-switch dalam VLAN sama berhasil.

**KRITERIA SUKSES:** Trunk up, native VLAN 99, VLAN sama tembus antar-switch.

<details><summary>Solusi & penjelasan</summary>

```
SW1(config)# vlan 99
SW1(config)# interface gi0/1        (link ke SW2)
SW1(config-if)# switchport mode trunk
SW1(config-if)# switchport trunk native vlan 99
SW1(config-if)# switchport trunk allowed vlan 10,20,99
```
(Sama di SW2.) `show interfaces trunk` memperlihatkan trunk up, VLAN yang diizinkan, native 99. PC VLAN10 di kedua switch bisa saling ping karena trunk membawa frame ber-tag antar-switch. Mengubah native VLAN dari 1 mencegah VLAN hopping (`12-keamanan/02`). Hati-hati: native VLAN harus cocok di kedua ujung (mismatch → CDP warning + kebocoran VLAN). Membuktikan `03-data-link/03`.
</details>

---

## Lab 1.4: Amati Root Bridge & Redundansi STP

**Topologi:** 3 switch dihubungkan membentuk loop segitiga (SW1-SW2-SW3-SW1).

**TUGAS:**
1. Hubungkan 3 switch membentuk loop fisik.
2. Amati: STP otomatis memblokir satu port (cegah loop).
3. Jadikan SW1 sebagai root bridge (priority terendah).
4. Identifikasi root port, designated port, dan blocked port.
5. Matikan satu link → amati STP konvergensi (port blocked jadi forwarding).

**VERIFIKASI:** `show spanning-tree`; satu port `BLK` sebelum, konvergen setelah link putus.

**KRITERIA SUKSES:** SW1 root, satu port ter-blok saat loop, konvergensi saat failover.

<details><summary>Solusi & penjelasan</summary>

```
SW1(config)# spanning-tree vlan 1 priority 4096   (jadikan root)
SW1# show spanning-tree                            (This bridge is the root)
SW2# show spanning-tree                            (lihat Root ID = SW1, root port, blocked port)
```
Tanpa priority, root dipilih berdasarkan bridge ID terendah (priority+MAC). STP memblokir satu port dalam loop untuk mencegah broadcast storm. Link yang diblokir itu bandwidth yang terbuang, dan pemborosan inilah yang mendorong spine-leaf (`16/01`). Saat link aktif putus, STP mengaktifkan port yang tadinya blocked (konvergensi; RSTP lebih cepat dari STP klasik). Amati port states (blocking→listening→learning→forwarding untuk STP, atau langsung untuk RSTP). Membuktikan `03-data-link/04`. Untuk keamanan, aktifkan **BPDU Guard** di port access (`spanning-tree bpduguard enable`).
</details>

---

## Lab 1.5: EtherChannel (LACP)

**Topologi:** 2 switch dihubungkan dengan 2 link paralel.

**TUGAS:**
1. Gabungkan 2 link antar-switch menjadi satu **EtherChannel** dengan LACP.
2. Verifikasi channel up dan kedua link aktif (bukan diblok STP).
3. Uji: matikan satu link fisik → koneksi tetap jalan (redundansi).

**VERIFIKASI:** `show etherchannel summary` (Po1 up, 2 port bundled).

**KRITERIA SUKSES:** EtherChannel up, kedua link aktif, tahan kegagalan satu link.

<details><summary>Solusi & penjelasan</summary>

```
SW1(config)# interface range gi0/1-2
SW1(config-if-range)# channel-group 1 mode active   (active = LACP)
SW1(config)# interface port-channel 1
SW1(config-if)# switchport mode trunk
```
(Sama di SW2, `mode active`.) `show etherchannel summary` → Po1 dengan flag `(SU)` dan port `(P)` bundled. STP memperlakukan EtherChannel sebagai satu link logis, sehingga kedua link aktif sekaligus (tak ada yang diblok): bandwidth berlipat dua, ditambah redundansi. Matikan satu link → channel tetap up dengan link tersisa. Hati-hati: mode kedua ujung harus kompatibel (active-active atau active-passive untuk LACP). Membuktikan `03-data-link/05`.
</details>

---

## Ringkasan Lab 01

Anda telah mempraktikkan: konektivitas IP dasar, VLAN & isolasi, trunk 802.1Q + native VLAN, STP (root bridge, blocking, konvergensi), dan EtherChannel/LACP. Ini fondasi switching CCNA domain 2.0.

> [!TIP]
> **Simpan konfigurasi & screenshot** tiap lab untuk portofolio (`18/04`). Coba variasikan: tambah VLAN, ubah root bridge ke switch lain, tambah link ketiga ke EtherChannel.

**Berikutnya:** `lab/02-lab-routing.md`. Static routing, OSPF, inter-VLAN, dan BGP.

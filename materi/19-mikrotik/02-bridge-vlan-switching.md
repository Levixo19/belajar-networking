# 19.2 — MikroTik: Bridge, VLAN & Switching

> **Prasyarat:** `19-mikrotik/01`, `03-data-link/02-03` (switching & VLAN)
> **Tujuan:** Anda bisa mengonfigurasi bridge, VLAN, dan switching di RouterOS, memahami perbedaan bridge software vs switch chip (hardware offload).

---

## 1. Konsep Bridge di RouterOS

Berbeda dari switch Cisco (yang setiap port secara default adalah port switching), di RouterOS **setiap interface awalnya independen** (seperti router). Untuk membuat beberapa port berperilaku seperti satu switch (satu broadcast domain), Anda membuat **bridge** dan menambahkan port ke dalamnya.

```
Tanpa bridge:  ether1, ether2, ether3 = 3 interface router terpisah
Dengan bridge: ether1,2,3 → anggota bridge1 = 1 switch/broadcast domain
```

```routeros
# Buat bridge dan tambahkan port
/interface bridge add name=bridge1
/interface bridge port add bridge=bridge1 interface=ether2
/interface bridge port add bridge=bridge1 interface=ether3
/interface bridge port add bridge=bridge1 interface=ether4

# Beri IP pada bridge (bukan pada port individu)
/ip address add address=192.168.1.1/24 interface=bridge1
```

⚠️ **Beri IP pada interface bridge, bukan pada port anggota.** Port anggota bridge menjadi bagian dari L2 domain; alamat L3 diberikan ke bridge sebagai satu kesatuan (seperti SVI/VLAN interface di Cisco).

💡 **Padanan konsep:** bridge RouterOS ≈ membuat VLAN/broadcast domain + SVI di Cisco, atau `brctl`/`ip link add type bridge` di Linux (lihat `13-linux-networking/02` — RouterOS berbasis Linux, jadi konsepnya identik).

---

## 2. Hardware Offload (Switch Chip)

Perangkat MikroTik punya **switch chip** yang bisa melakukan switching pada kecepatan wire tanpa membebani CPU. Kolom **"H"** (hardware offload) pada bridge port menunjukkan port di-switch oleh chip, bukan CPU.

```routeros
/interface bridge port print
# Kolom H = hardware offloaded (bagus — switching oleh chip, CPU bebas)
```

⚠️ **Bridge software (CPU) vs hardware offload:** jika switching ditangani CPU (tanpa offload), throughput terbatas dan CPU tinggi pada trafik besar. Fitur tertentu (beberapa konfigurasi VLAN lama, beberapa filter) dapat **menonaktifkan** hardware offload. Pada RouterOS modern, konfigurasi VLAN berbasis bridge (`vlan-filtering`) mendukung offload pada banyak chip — gunakan pendekatan itu.

💡 **Selalu cek kolom `H`** setelah konfigurasi. Jika hilang pada perangkat yang seharusnya mendukung, throughput bisa anjlok. Ini gotcha khas MikroTik yang tidak ada padanannya di Cisco (di mana ASIC selalu menangani switching).

---

## 3. VLAN di RouterOS: Bridge VLAN Filtering

Cara modern dan direkomendasikan untuk VLAN di RouterOS adalah **bridge VLAN filtering** — mirip konsep VLAN Cisco (access/trunk, PVID/tagged).

```routeros
# 1. Buat bridge dengan vlan-filtering (aktifkan SETELAH konfigurasi port selesai)
/interface bridge add name=bridge1 vlan-filtering=no

# 2. Tambahkan port, tetapkan PVID (VLAN untuk trafik untagged = "access")
/interface bridge port add bridge=bridge1 interface=ether2 pvid=10   # access VLAN10
/interface bridge port add bridge=bridge1 interface=ether3 pvid=20   # access VLAN20
/interface bridge port add bridge=bridge1 interface=ether5           # akan jadi trunk

# 3. Definisikan VLAN: port mana tagged (trunk), port mana untagged (access)
/interface bridge vlan add bridge=bridge1 vlan-ids=10 \
    tagged=bridge1,ether5 untagged=ether2
/interface bridge vlan add bridge=bridge1 vlan-ids=20 \
    tagged=bridge1,ether5 untagged=ether3

# 4. AKTIFKAN vlan-filtering (baru setelah semua benar!)
/interface bridge set bridge1 vlan-filtering=yes
```

**Istilah kunci:**
- **PVID (Port VLAN ID)** = VLAN untuk trafik masuk yang untagged (setara "access VLAN" Cisco).
- **tagged** = port mengirim/menerima frame dengan tag 802.1Q (setara "trunk").
- **untagged** = port mengirim/menerima tanpa tag (setara "access").
- **bridge1 dalam daftar tagged** = agar router (CPU) bisa memproses VLAN itu (untuk L3/inter-VLAN).

⚠️ **AKTIFKAN `vlan-filtering=yes` HANYA setelah semua port & VLAN benar** — terutama pastikan port tempat Anda mengakses router (mis. via Winbox) sudah ter-tag/PVID dengan benar. **Mengaktifkan vlan-filtering tanpa konfigurasi benar bisa mengunci Anda keluar** dari router! Konfigurasikan lewat MAC-Winbox atau serial bila ragu.

---

## 4. Inter-VLAN Routing di RouterOS

Untuk routing antar-VLAN, buat **VLAN interface** di atas bridge dan beri IP (setara SVI Cisco):

```routeros
# VLAN interface di atas bridge (router-on-a-stick / SVI)
/interface vlan add name=vlan10 vlan-id=10 interface=bridge1
/interface vlan add name=vlan20 vlan-id=20 interface=bridge1

# IP gateway per VLAN
/ip address add address=10.0.10.1/24 interface=vlan10
/ip address add address=10.0.20.1/24 interface=vlan20
# Routing antar keduanya otomatis (connected routes) — seperti Cisco SVI
```

💡 Ini setara **inter-VLAN routing dengan SVI** di switch L3 Cisco. RouterOS meneruskan antar-`vlan10` dan `vlan20` via connected routes-nya. Terapkan firewall (`19.3`) untuk mengontrol trafik antar-VLAN.

---

## 5. Tabel Padanan Istilah

| Konsep | Cisco IOS | MikroTik RouterOS | Linux |
|---|---|---|---|
| Broadcast domain L2 | VLAN + `switchport` | **bridge** | `ip link add type bridge` |
| Interface L3 per VLAN | SVI (`interface Vlan10`) | `/interface vlan` di bridge | `ip link add link ... type vlan` |
| Access port | `switchport access vlan 10` | port dengan `pvid=10` | (untagged bridge vlan) |
| Trunk port | `switchport mode trunk` | port `tagged` di bridge vlan | (tagged bridge vlan) |
| Native VLAN | `native vlan` | `pvid` di port trunk | PVID |
| Aktifkan VLAN aware | (otomatis) | `vlan-filtering=yes` | `bridge vlan_filtering 1` |
| Hardware switching | ASIC (selalu) | **hardware offload (kolom H)** | (NIC/switchdev) |

---

## 6. STP di RouterOS

RouterOS mendukung STP/RSTP/MSTP pada bridge untuk mencegah loop:

```routeros
/interface bridge set bridge1 protocol-mode=rstp   # none|stp|rstp|mstp
/interface bridge print                            # cek root bridge, dll
```

Default `rstp`. Konsep sama dengan `03-data-link/04` (root bridge, port role/state). ⚠️ Jangan matikan STP kecuali yakin tidak ada loop — loop L2 melumpuhkan jaringan (broadcast storm).

---

## 7. Ringkasan

- Di RouterOS, interface **independen** secara default; buat **bridge** untuk menyatukan port jadi satu broadcast domain (≈ switch). Beri **IP pada bridge**, bukan port.
- **Hardware offload (kolom H)** = switching oleh switch chip (cepat, CPU bebas). Selalu cek `H`; beberapa konfigurasi menonaktifkannya.
- **Bridge VLAN filtering** = cara modern VLAN: **PVID** (≈access), **tagged** (≈trunk), **untagged** (≈access). Sertakan `bridge` di tagged untuk L3.
- ⚠️ **Aktifkan `vlan-filtering=yes` HANYA setelah konfigurasi benar** — salah bisa mengunci Anda keluar.
- **Inter-VLAN routing**: buat `/interface vlan` di atas bridge + IP (≈ SVI Cisco).
- **STP/RSTP** didukung (`protocol-mode`), konsep sama dengan Cisco.

---

## 8. Latihan

1. Kenapa di RouterOS Anda perlu membuat bridge, sedangkan di switch Cisco tidak?
2. Apa arti kolom "H" pada bridge port dan kenapa penting?
3. Terjemahkan ke istilah RouterOS: access port VLAN 30, dan trunk yang membawa VLAN 10,20,30.
4. Kenapa `vlan-filtering=yes` harus diaktifkan paling akhir, dan apa risikonya bila salah?
5. Bagaimana melakukan inter-VLAN routing di RouterOS, dan apa padanan Cisco-nya?

<details>
<summary>Jawaban</summary>

1. Karena **filosofi default keduanya berbeda**. Switch Cisco adalah **switch** — setiap port secara default adalah port switching L2 yang sudah tergabung dalam broadcast domain (VLAN 1), jadi port-port langsung "saling terhubung" tanpa konfigurasi. RouterOS berasal dari **router** (berbasis Linux) — setiap interface secara default **independen dan terpisah** (seperti port router yang masing-masing di segmen berbeda). Untuk membuat beberapa port berperilaku seperti satu switch (satu broadcast domain, saling meneruskan frame L2), Anda harus **secara eksplisit membuat bridge** dan menambahkan port ke dalamnya. Jadi di RouterOS "menyatukan port" adalah tindakan sadar (membuat bridge), sedangkan di switch Cisco itu perilaku bawaan. (Ini sebabnya router MikroTik yang dipakai sebagai switch selalu punya konfigurasi bridge.)

2. Kolom **"H" (hardware offload)** menunjukkan bahwa port tersebut di-switch oleh **switch chip (ASIC) perangkat**, bukan oleh CPU. **Penting** karena switching oleh chip berjalan pada **kecepatan wire tanpa membebani CPU**, sedangkan jika switching ditangani CPU (offload nonaktif), throughput menjadi terbatas dan CPU bisa melonjak tinggi pada trafik besar — menyebabkan penurunan performa drastis. Beberapa konfigurasi (fitur tertentu, cara VLAN tertentu) dapat **menonaktifkan** offload tanpa peringatan jelas, sehingga selalu **cek kolom H** setelah konfigurasi: jika hilang pada perangkat yang mendukungnya, ada yang salah dan perlu diperbaiki agar performa kembali optimal. Ini gotcha khas MikroTik yang tidak ada di switch Cisco (di mana ASIC selalu menangani switching).

3. **Access port VLAN 30:** tambahkan port ke bridge dengan `pvid=30` — mis. `/interface bridge port add bridge=bridge1 interface=ether4 pvid=30`, dan definisikan port itu sebagai **untagged** untuk VLAN 30: `/interface bridge vlan add bridge=bridge1 vlan-ids=30 untagged=ether4 tagged=bridge1,ether5`. **Trunk yang membawa VLAN 10,20,30** (mis. ether5): port ether5 harus **tagged** untuk ketiga VLAN — `/interface bridge vlan add bridge=bridge1 vlan-ids=10 tagged=bridge1,ether5 ...`, dan seterusnya untuk vlan-ids 20 dan 30, masing-masing menyertakan `ether5` (dan `bridge1` bila router perlu memprosesnya) di daftar `tagged`. Ringkasnya: **PVID** menentukan access VLAN sebuah port, **tagged** menjadikan port sebagai trunk untuk VLAN yang disebut.

4. Karena **mengaktifkan `vlan-filtering=yes` langsung mengubah cara bridge memproses semua frame** — bridge mulai menegakkan aturan VLAN (PVID, tagged/untagged) pada setiap port. Jika konfigurasi VLAN belum lengkap/benar saat diaktifkan — misalnya port tempat Anda terhubung (Winbox/SSH) belum memiliki PVID yang benar atau belum masuk daftar untagged/tagged VLAN manajemen Anda — maka **trafik Anda ke router bisa langsung terputus dan Anda terkunci keluar** dari perangkat (kehilangan akses manajemen). Karena itu urutan aman: konfigurasikan **semua** port (PVID) dan **semua** entri bridge VLAN (tagged/untagged), verifikasi terutama jalur manajemen Anda, **baru** aktifkan `vlan-filtering=yes`. Bila ragu, lakukan lewat koneksi yang tidak terpengaruh (MAC-Winbox, port serial/console, atau port yang sengaja disiapkan sebagai akses aman) sehingga jika salah, Anda masih bisa masuk untuk memperbaiki.

5. Di RouterOS, inter-VLAN routing dilakukan dengan membuat **VLAN interface di atas bridge** dan memberinya alamat IP: `/interface vlan add name=vlan10 vlan-id=10 interface=bridge1` (dan vlan20 serupa), lalu `/ip address add address=10.0.10.1/24 interface=vlan10` (dan gateway vlan20). Setiap VLAN interface menjadi **gateway** untuk subnet VLAN tersebut, dan RouterOS otomatis meneruskan trafik antar-VLAN melalui **connected routes**-nya. **Padanan Cisco:** ini setara dengan **SVI (Switched Virtual Interface)** pada switch L3 — `interface Vlan10` / `ip address ...` — di mana switch multilayer merutekan antar-VLAN lewat interface VLAN virtualnya. (Ini juga analog dengan "router-on-a-stick" bila menggunakan subinterface pada trunk, tetapi pendekatan VLAN-interface-di-atas-bridge lebih mirip SVI.) Kontrol trafik antar-VLAN dilakukan dengan firewall (`19.3`).

</details>

---

## 9. Sumber

- MikroTik documentation — Bridging and Switching, Bridge VLAN Filtering (help.mikrotik.com)
- MTCNA outline — Bridging
- `03-data-link/02-03` (konsep switching & VLAN) · `13-linux-networking/02` (bridge Linux)

---

**Berikutnya:** `19-mikrotik/03-firewall-nat.md` — firewall filter, NAT, mangle, dan connection tracking RouterOS.

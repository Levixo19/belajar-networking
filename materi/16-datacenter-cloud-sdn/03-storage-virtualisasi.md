# 16.3 — Jaringan Storage & Virtualisasi

> **Prasyarat:** `16.1`, `05-transport/02` (TCP), `03-data-link/01` (Ethernet)
> **Tujuan:** Anda paham jaringan storage (SAN/NAS, iSCSI, FC/FCoE, NVMe-oF), virtualisasi server, container, dan VRF — sesuai CCNA 1.12.

---

## 1. Virtualisasi Server (CCNA 1.12)

**Virtualisasi** memungkinkan satu server fisik menjalankan banyak **mesin virtual (VM)**, masing-masing dengan OS sendiri, dikelola oleh **hypervisor**.

```
┌──────────────────────────────────────────┐
│ VM-1    │ VM-2    │ VM-3   │  ← tiap VM: OS + app sendiri
│ (Linux) │(Windows)│(Linux) │
├──────────────────────────────────────────┤
│         HYPERVISOR                         │  ← membagi CPU/RAM/NIC ke VM
├──────────────────────────────────────────┤
│      HARDWARE FISIK (1 server)             │
└──────────────────────────────────────────┘
```

**Tipe hypervisor:**
- **Type 1 (bare-metal)** — berjalan langsung di hardware. Contoh: **VMware ESXi, KVM, Hy-V, Xen, Proxmox**. Dipakai di DC/produksi.
- **Type 2 (hosted)** — berjalan di atas OS biasa. Contoh: **VirtualBox, VMware Workstation**. Untuk desktop/lab.

**vSwitch (virtual switch):** hypervisor menjalankan switch software yang menghubungkan VM ke NIC fisik. VM terhubung ke vSwitch, vSwitch ke jaringan fisik. Contoh: VMware vSwitch/vDS, Linux bridge, Open vSwitch (OVS).

💡 **Dari sudut jaringan, VM adalah host biasa** dengan MAC dan IP sendiri. vSwitch bisa melakukan VLAN tagging, sehingga trafik VM masuk ke VLAN yang tepat di jaringan fisik. Migrasi VM (vMotion) memindahkan VM antar-host tanpa downtime — inilah yang butuh L2 membentang (VXLAN, `16.2`).

---

## 2. Container (CCNA 1.12)

**Container** memvirtualisasi pada level **OS**, bukan hardware. Semua container berbagi kernel host, hanya mengemas aplikasi + dependensinya.

```
VM                              CONTAINER
┌─────┬─────┬─────┐            ┌─────┬─────┬─────┐
│ App │ App │ App │            │ App │ App │ App │
│ OS  │ OS  │ OS  │  ← berat   │(deps│(deps│(deps│  ← ringan
├─────┴─────┴─────┤            ├─────┴─────┴─────┤
│   Hypervisor    │            │ Container Engine│  (Docker/containerd)
├─────────────────┤            ├─────────────────┤
│    Hardware     │            │   OS (1 kernel) │  ← dibagi bersama
└─────────────────┘            ├─────────────────┤
                               │    Hardware     │
                               └─────────────────┘
```

| | **VM** | **Container** |
|---|---|---|
| Isolasi | Kuat (OS terpisah) | Lebih lemah (berbagi kernel) |
| Ukuran | GB | MB |
| Boot | Detik–menit | Milidetik |
| Overhead | Tinggi | Rendah |
| Kepadatan | Puluhan/host | Ratusan–ribuan/host |

⚠️ **Container berbagi kernel host** → isolasinya lebih lemah dari VM. Untuk multi-tenant yang butuh isolasi keamanan kuat, VM (atau microVM seperti Firecracker/Kata) lebih aman. Jaringan container dibahas mendalam di `16.5` (Kubernetes).

---

## 3. VRF — Virtualisasi pada Router (CCNA 1.12)

**VRF (Virtual Routing and Forwarding)** memvirtualisasikan **tabel routing** — satu router fisik menjalankan banyak tabel routing terpisah, seolah beberapa router virtual.

```
        ┌──────── Router Fisik ────────┐
        │  VRF-A (tabel routing A)      │  ← tenant/pelanggan A
        │  VRF-B (tabel routing B)      │  ← tenant/pelanggan B
        │  VRF-GLOBAL (default)         │
        └───────────────────────────────┘
   Alamat 10.0.0.0/8 bisa ada di VRF-A DAN VRF-B
   tanpa konflik — keduanya terisolasi total
```

**Kegunaan VRF:**
- **Isolasi multi-tenant** — tiap pelanggan punya tabel routing sendiri di router yang sama.
- **Overlapping IP** — dua tenant bisa memakai `10.0.0.0/8` yang sama tanpa bentrok.
- **Pemisahan** — misalnya jaringan manajemen vs produksi vs tamu.
- Fondasi **MPLS L3VPN** (lihat `11-wan-vpn/01`).

```
! Contoh Cisco IOS
R1(config)# vrf definition PELANGGAN-A
R1(config-vrf)# address-family ipv4
R1(config)# interface Gi0/1
R1(config-if)# vrf forwarding PELANGGAN-A
R1(config-if)# ip address 10.0.0.1 255.255.255.0
```

💡 **VRF adalah "VLAN untuk Layer 3."** Sebagaimana VLAN membagi satu switch fisik menjadi banyak broadcast domain, VRF membagi satu router menjadi banyak instance routing terisolasi. CCNA 1.12 mengelompokkannya bersama virtualisasi server dan container sebagai bentuk virtualisasi.

**Padanan istilah:**

| Konsep | Cisco IOS | Linux |
|---|---|---|
| VRF | `vrf definition` | `ip vrf` / network namespace |
| Assign interface | `vrf forwarding` | `ip link set eth0 master vrf-a` |

Di Linux, **network namespace** (dibahas di `13-linux-networking/02`) memberi isolasi routing serupa (bahkan lebih lengkap — namespace mengisolasi seluruh stack jaringan).

---

## 4. Jaringan Storage: SAN vs NAS

Aplikasi butuh akses ke storage. Dua model utama:

```
NAS (Network Attached Storage) — akses FILE
   Klien ←── NFS / SMB (CIFS) ──→ [NAS]   "beri saya file /data/x.txt"
   Bekerja di atas TCP/IP jaringan biasa

SAN (Storage Area Network) — akses BLOCK
   Server ←── iSCSI / FC ──→ [Array]      "beri saya blok 4096–8192 di LUN 3"
   Server melihat storage seolah disk lokal
```

| | **NAS** | **SAN** |
|---|---|---|
| Unit akses | **File** (NFS, SMB) | **Block** (seolah disk mentah) |
| Protokol | NFS, SMB/CIFS | iSCSI, Fibre Channel, FCoE, NVMe-oF |
| Jaringan | LAN IP biasa | Sering jaringan khusus (FC) atau IP |
| Klien melihat | Share file jaringan | Disk lokal (LUN) |
| Contoh guna | File server, home directory | Database, VM datastore |

---

## 5. Protokol SAN

### iSCSI (SCSI over IP)
Membungkus perintah SCSI dalam **TCP/IP** — SAN di atas Ethernet biasa. Murah, tidak butuh hardware khusus.
- **Initiator** = klien (server yang mengakses storage).
- **Target** = server storage yang menyediakan LUN.
- **LUN (Logical Unit Number)** = "disk" virtual yang diberikan ke initiator.

⚠️ **iSCSI sensitif terhadap latensi dan packet loss** (karena SCSI mengharapkan storage lokal yang andal). Praktik terbaik: **jaringan storage terpisah/VLAN khusus**, jumbo frames, dan hindari trafik lain di jalur itu.

### Fibre Channel (FC)
Jaringan storage **khusus** dengan hardware sendiri (HBA, switch FC) — bukan Ethernet. Sangat andal, latensi rendah, mahal. Kecepatan 8/16/32/64 Gbps. Memakai **WWN (World Wide Name)** sebagai alamat (analog MAC) dan **zoning** (analog VLAN/ACL untuk membatasi siapa mengakses apa).

### FCoE (Fibre Channel over Ethernet)
Membungkus FC dalam frame **Ethernet** (bukan IP) — menyatukan LAN dan SAN di satu kabel/switch (converged). Butuh **DCB (Data Center Bridging)** — ekstensi Ethernet lossless (PFC, ETS). Kurang populer belakangan dibanding iSCSI/NVMe-oF.

### NVMe-oF (NVMe over Fabrics)
Generasi terbaru: membawa protokol **NVMe** (SSD modern) melintasi jaringan (RDMA/RoCE, TCP, atau FC). Latensi jauh lebih rendah dari iSCSI — dirancang untuk flash/NVMe berkecepatan tinggi. Semakin dominan di DC modern.

💡 **RDMA (Remote Direct Memory Access)** memungkinkan satu server membaca/menulis memori server lain **tanpa melibatkan CPU** — latensi ultra-rendah. **RoCE (RDMA over Converged Ethernet)** membawanya di atas Ethernet dan penting untuk NVMe-oF dan AI/HPC clustering.

---

## 6. Ringkasan

- **Virtualisasi server**: hypervisor (**Type 1** bare-metal: ESXi/KVM/Hyper-V; **Type 2** hosted: VirtualBox) menjalankan banyak VM. **vSwitch** menghubungkan VM ke jaringan; VM adalah host biasa dengan MAC/IP sendiri.
- **Container** memvirtualisasi di level **OS** (berbagi kernel) — ringan, cepat, padat, tetapi isolasi lebih lemah dari VM.
- **VRF** = virtualisasi tabel routing ("VLAN untuk L3"): isolasi multi-tenant, mendukung overlapping IP, fondasi MPLS L3VPN. Padanan Linux: network namespace.
- **NAS** = akses **file** (NFS/SMB) di LAN biasa; **SAN** = akses **block** (server melihat disk lokal).
- **iSCSI** = SCSI over TCP/IP (murah, butuh jaringan terpisah/jumbo); **FC** = jaringan storage khusus (andal, mahal, WWN+zoning); **FCoE** = FC di Ethernet (butuh DCB lossless); **NVMe-oF** = generasi terbaru latensi rendah (RDMA/RoCE/TCP).
- **RDMA/RoCE** = akses memori jarak jauh tanpa CPU — latensi ultra-rendah untuk storage dan AI/HPC.

---

## 7. Latihan

1. Jelaskan perbedaan hypervisor Type 1 dan Type 2 dengan contoh masing-masing.
2. Kenapa container jauh lebih ringan dari VM, dan apa trade-off-nya?
3. Apa fungsi VRF dan kenapa disebut "VLAN untuk Layer 3"? Beri satu contoh kegunaan.
4. Apa perbedaan mendasar NAS dan SAN dari sudut pandang klien?
5. Kenapa iSCSI sebaiknya di jaringan/VLAN terpisah dengan jumbo frames?

<details>
<summary>Jawaban</summary>

1. **Type 1 (bare-metal)** berjalan **langsung di atas hardware** tanpa OS host di bawahnya — hypervisor *adalah* lapisan sistem. Contoh: VMware ESXi, KVM (di Linux, secara efektif membuat kernel jadi hypervisor), Microsoft Hyper-V, Xen, Proxmox. Dipakai di data center/produksi karena performa dan efisiensi tinggi. **Type 2 (hosted)** berjalan **sebagai aplikasi di atas OS biasa** (Windows/macOS/Linux). Contoh: Oracle VirtualBox, VMware Workstation/Fusion. Dipakai di desktop/laptop untuk lab dan pengembangan — lebih mudah tetapi ada overhead OS host.

2. Container **berbagi kernel OS host** dan hanya mengemas aplikasi beserta dependensinya (library, binary), tanpa menyertakan OS lengkap sendiri seperti VM. Karena itu ukurannya MB (bukan GB), boot dalam milidetik (bukan detik/menit), overhead rendah, dan satu host bisa menjalankan ratusan–ribuan container (bukan puluhan VM). **Trade-off:** karena berbagi kernel, **isolasi keamanannya lebih lemah** — celah di kernel host bisa memengaruhi semua container, dan container tidak bisa menjalankan OS/kernel yang berbeda dari host. Untuk isolasi kuat multi-tenant, VM (atau microVM seperti Kata/Firecracker) lebih aman.

3. **VRF (Virtual Routing and Forwarding)** membuat **banyak tabel routing terpisah dalam satu router fisik**, sehingga router itu berperilaku seperti beberapa router virtual yang terisolasi. Disebut **"VLAN untuk Layer 3"** karena sebagaimana VLAN membagi satu switch fisik menjadi banyak broadcast domain L2 yang terisolasi, VRF membagi satu router menjadi banyak domain routing L3 yang terisolasi. **Contoh kegunaan:** memisahkan trafik dua pelanggan (tenant) di router penyedia yang sama — masing-masing punya tabel routing sendiri sehingga bahkan bisa memakai rentang IP yang **sama** (`10.0.0.0/8`) tanpa bentrok; atau memisahkan jaringan manajemen dari produksi dari tamu. VRF juga fondasi MPLS L3VPN.

4. Dari sudut pandang klien: dengan **NAS**, klien mengakses **file** melalui protokol berbagi file jaringan (NFS di Unix/Linux, SMB/CIFS di Windows) — klien melihat "folder jaringan" dan meminta file bernama. Dengan **SAN**, klien (server) mengakses **block storage mentah** — ia melihat storage tersebut seolah **disk lokal** (LUN) yang bisa diformat dengan filesystem apa pun, dan mengirim perintah pada level blok ("baca blok 4096–8192"). Singkatnya: NAS = "beri saya file itu", SAN = "beri saya blok-blok disk itu, saya yang atur filesystem-nya".

5. Karena **iSCSI membawa protokol SCSI yang mengharapkan storage lokal yang cepat dan andal** — ia sangat sensitif terhadap latensi dan packet loss. Kalau berbagi jaringan dengan trafik lain, lonjakan trafik bisa menyebabkan antrean/loss yang membuat storage tampak lambat atau bahkan menyebabkan timeout I/O (aplikasi/DB bisa error atau corrupt). Memisahkan iSCSI ke jaringan/VLAN khusus menjamin bandwidth dan menghindari kontensi. **Jumbo frames** (MTU 9000) mengurangi overhead per paket — blok data besar dikirim dalam lebih sedikit frame, meningkatkan throughput dan menurunkan beban CPU untuk trafik storage yang bervolume besar.

</details>

---

## 8. Sumber

- Cisco CCNA 200-301 v1.1 — topik 1.12 (server virtualization, containers, VRFs)
- RFC 7143 — iSCSI · RFC 3720
- NVM Express over Fabrics spec · T11 Fibre Channel standards
- VMware/KVM documentation

---

**Berikutnya:** `16-datacenter-cloud-sdn/04-cloud-networking.md` — jaringan di cloud publik.

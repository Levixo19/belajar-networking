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

## 6. RoCEv2 dan DCQCN: Ethernet Tanpa Rugi untuk AI dan HPC

RDMA (bagian 5) hanya menarik kalau jaringannya nyaris tidak membuang paket. NIC RDMA mengandalkan pengiriman yang hampir tanpa kehilangan; satu paket hilang memaksa pengulangan yang mahal, dan pada klaster pelatihan AI satu aliran lambat menahan ribuan GPU yang menunggu. **RoCEv2** membawa RDMA di atas UDP/IP (tujuan UDP **4791**), sehingga bisa dirutekan lewat fabric spine-leaf layer 3 seperti yang dibahas di `16-datacenter-cloud-sdn/01-desain-dc`. Yang tidak ia bawa adalah kontrol kemacetan seperti TCP, jadi fabric harus diatur agar kemacetan ditangani sebelum antrean meluap.

Dua mekanisme dipakai bersama. **PFC (Priority Flow Control, IEEE 802.1Qbb)** adalah pause per prioritas (hingga delapan kelas), bukan pause seluruh link seperti 802.3x: switch yang antreannya hampir penuh meminta pengirim berhenti untuk satu prioritas saja, sehingga kelas RoCE menjadi *lossless* sementara kelas lain berjalan normal. **ECN (RFC 3168)** memakai dua bit terakhir di octet TOS/Traffic Class IP: `00` Not-ECT, `10` ECT(0), `01` ECT(1), dan `11` CE (*Congestion Experienced*). Switch yang antreannya mulai memanjang mengubah paket ECT menjadi CE alih-alih membuangnya.

**DCQCN (Data Center Quantized Congestion Notification)** menyatukan ECN dengan kontrol laju di NIC, dan dirancang untuk RoCEv2 oleh Zhu dkk. (SIGCOMM 2015). Tiga pihak berperan. **Switch** menandai paket dengan algoritma mirip RED memakai tiga parameter: di bawah **Kmin** tidak ada penandaan, antara Kmin dan **Kmax** probabilitas naik linear sampai **Pmax**, dan di atas Kmax semua paket ditandai. **Penerima (notification point)** yang melihat paket CE mengirim **CNP (Congestion Notification Packet)** ke pengirim, paling banyak satu per selang waktu tetap per aliran. **Pengirim (reaction point)** menurunkan laju kirimnya begitu menerima CNP, lalu menaikkannya perlahan lewat penghitung dan timer saat CNP berhenti datang.

Urutannya penting: **ECN harus bereaksi lebih dulu daripada PFC**. PFC hanya cadangan terakhir ketika ECN tidak cukup cepat; ambang penandaan ECN (Kmin) harus lebih rendah daripada ambang yang memicu PFC. Menyalakan PFC saja tanpa ECN yang terkalibrasi adalah resep masalah, karena pause menyebar ke hulu (*head-of-line blocking*), bisa menyebabkan *deadlock* bila ada siklus ketergantungan buffer, dan membagi kapasitas secara tidak adil. Operator memverifikasi hal ini lewat counter ECN-marked, CNP, dan pause di switch maupun NIC; nama counter dan sintaks konfigurasi berbeda per vendor, jadi rujuk dokumentasi platform Anda.

⚠️ Untuk traffic RoCE, jangan menempatkan antrean RDMA bersama lalu lintas lain pada prioritas yang sama, dan jangan menyalakan PFC pada semua kelas. Pisahkan kelas RoCE (mis. satu prioritas khusus), aktifkan PFC dan ECN hanya di sana, dan samakan DSCP dan kelas di seluruh switch serta NIC. Satu perangkat yang salah ambang memutus jaminan seluruh fabric.

---

## 7. Ringkasan

- **Virtualisasi server**: hypervisor (**Type 1** bare-metal: ESXi/KVM/Hyper-V; **Type 2** hosted: VirtualBox) menjalankan banyak VM. **vSwitch** menghubungkan VM ke jaringan; VM adalah host biasa dengan MAC/IP sendiri.
- **Container** memvirtualisasi di level **OS** (berbagi kernel) — ringan, cepat, padat, tetapi isolasi lebih lemah dari VM.
- **VRF** = virtualisasi tabel routing ("VLAN untuk L3"): isolasi multi-tenant, mendukung overlapping IP, fondasi MPLS L3VPN. Padanan Linux: network namespace.
- **NAS** = akses **file** (NFS/SMB) di LAN biasa; **SAN** = akses **block** (server melihat disk lokal).
- **iSCSI** = SCSI over TCP/IP (murah, butuh jaringan terpisah/jumbo); **FC** = jaringan storage khusus (andal, mahal, WWN+zoning); **FCoE** = FC di Ethernet (butuh DCB lossless); **NVMe-oF** = generasi terbaru latensi rendah (RDMA/RoCE/TCP).
- **RDMA/RoCE** = akses memori jarak jauh tanpa CPU — latensi ultra-rendah untuk storage dan AI/HPC.
- **RoCEv2** = RDMA di atas UDP 4791, bisa dirutekan L3; butuh fabric hampir tanpa loss. **PFC** (802.1Qbb) = pause per prioritas, **ECN** (RFC 3168) = tanda CE di IP. **DCQCN** = switch menandai ECN (Kmin, Kmax, Pmax), penerima mengirim CNP, pengirim menurunkan laju; **ECN harus bereaksi sebelum PFC**.

---

## 8. Latihan

1. Jelaskan perbedaan hypervisor Type 1 dan Type 2 dengan contoh masing-masing.
2. Kenapa container jauh lebih ringan dari VM, dan apa trade-off-nya?
3. Apa fungsi VRF dan kenapa disebut "VLAN untuk Layer 3"? Beri satu contoh kegunaan.
4. Apa perbedaan mendasar NAS dan SAN dari sudut pandang klien?
5. Kenapa iSCSI sebaiknya di jaringan/VLAN terpisah dengan jumbo frames?
6. Sebuah switch fabric AI memakai ECN dengan Kmin = 100 KB, Kmax = 400 KB, dan Pmax = 10%. Hitung probabilitas penandaan CE saat antrean 250 KB dan saat 450 KB. Lalu jelaskan peran CNP dan mengapa Kmin harus lebih rendah dari ambang PFC.

<details>
<summary>Jawaban</summary>

1. **Type 1 (bare-metal)** berjalan **langsung di atas hardware** tanpa OS host di bawahnya — hypervisor *adalah* lapisan sistem. Contoh: VMware ESXi, KVM (di Linux, secara efektif membuat kernel jadi hypervisor), Microsoft Hyper-V, Xen, Proxmox. Dipakai di data center/produksi karena performa dan efisiensi tinggi. **Type 2 (hosted)** berjalan **sebagai aplikasi di atas OS biasa** (Windows/macOS/Linux). Contoh: Oracle VirtualBox, VMware Workstation/Fusion. Dipakai di desktop/laptop untuk lab dan pengembangan — lebih mudah tetapi ada overhead OS host.

2. Container **berbagi kernel OS host** dan hanya mengemas aplikasi beserta dependensinya (library, binary), tanpa menyertakan OS lengkap sendiri seperti VM. Karena itu ukurannya MB (bukan GB), boot dalam milidetik (bukan detik/menit), overhead rendah, dan satu host bisa menjalankan ratusan–ribuan container (bukan puluhan VM). **Trade-off:** karena berbagi kernel, **isolasi keamanannya lebih lemah** — celah di kernel host bisa memengaruhi semua container, dan container tidak bisa menjalankan OS/kernel yang berbeda dari host. Untuk isolasi kuat multi-tenant, VM (atau microVM seperti Kata/Firecracker) lebih aman.

3. **VRF (Virtual Routing and Forwarding)** membuat **banyak tabel routing terpisah dalam satu router fisik**, sehingga router itu berperilaku seperti beberapa router virtual yang terisolasi. Disebut **"VLAN untuk Layer 3"** karena sebagaimana VLAN membagi satu switch fisik menjadi banyak broadcast domain L2 yang terisolasi, VRF membagi satu router menjadi banyak domain routing L3 yang terisolasi. **Contoh kegunaan:** memisahkan trafik dua pelanggan (tenant) di router penyedia yang sama — masing-masing punya tabel routing sendiri sehingga bahkan bisa memakai rentang IP yang **sama** (`10.0.0.0/8`) tanpa bentrok; atau memisahkan jaringan manajemen dari produksi dari tamu. VRF juga fondasi MPLS L3VPN.

4. Dari sudut pandang klien: dengan **NAS**, klien mengakses **file** melalui protokol berbagi file jaringan (NFS di Unix/Linux, SMB/CIFS di Windows) — klien melihat "folder jaringan" dan meminta file bernama. Dengan **SAN**, klien (server) mengakses **block storage mentah** — ia melihat storage tersebut seolah **disk lokal** (LUN) yang bisa diformat dengan filesystem apa pun, dan mengirim perintah pada level blok ("baca blok 4096–8192"). Singkatnya: NAS = "beri saya file itu", SAN = "beri saya blok-blok disk itu, saya yang atur filesystem-nya".

5. Karena **iSCSI membawa protokol SCSI yang mengharapkan storage lokal yang cepat dan andal** — ia sangat sensitif terhadap latensi dan packet loss. Kalau berbagi jaringan dengan trafik lain, lonjakan trafik bisa menyebabkan antrean/loss yang membuat storage tampak lambat atau bahkan menyebabkan timeout I/O (aplikasi/DB bisa error atau corrupt). Memisahkan iSCSI ke jaringan/VLAN khusus menjamin bandwidth dan menghindari kontensi. **Jumbo frames** (MTU 9000) mengurangi overhead per paket — blok data besar dikirim dalam lebih sedikit frame, meningkatkan throughput dan menurunkan beban CPU untuk trafik storage yang bervolume besar.

6. Untuk antrean di antara Kmin dan Kmax, p = Pmax x (q - Kmin) / (Kmax - Kmin). Pada q = 250 KB: p = 0,10 x (250 - 100) / (400 - 100) = 0,10 x 150/300 = **0,05 (5%)**. Pada q = 450 KB (di atas Kmax): **p = 1 (100%)**, semua paket ditandai CE. CNP adalah paket yang dikirim **penerima** (NIC) ke **pengirim** ketika ia menerima paket berbendera CE; pengirim bereaksi dengan menurunkan laju kirim aliran itu, lalu menaikkannya lagi bila CNP berhenti. Kmin harus lebih rendah dari ambang PFC karena ECN adalah kontrol yang halus (memperlambat pengirim tanpa menghentikan seluruh prioritas), sedangkan PFC adalah rem darurat. Jika PFC terpicu lebih dulu, pause menyebar ke hulu, memicu head-of-line blocking, risiko deadlock, dan ketidakadilan antar-aliran.

</details>

---

## 9. Sumber

- Cisco CCNA 200-301 v1.1 — topik 1.12 (server virtualization, containers, VRFs)
- RFC 7143 — iSCSI · RFC 3720
- NVM Express over Fabrics spec · T11 Fibre Channel standards
- VMware/KVM documentation
- Zhu dkk., Congestion Control for Large-Scale RDMA Deployments (DCQCN), ACM SIGCOMM 2015: https://conferences.sigcomm.org/sigcomm/2015/pdf/papers/p523.pdf
- IEEE 802.1Qbb, Priority-based Flow Control: https://1.ieee802.org/dcb/802-1qbb/
- RFC 3168, The Addition of Explicit Congestion Notification (ECN) to IP: https://www.rfc-editor.org/rfc/rfc3168
- NVIDIA, RoCE v2 UDP Port (tujuan 4791 sesuai arahan IANA): https://networking-docs.nvidia.com/winofdocumentation/55053000/roce-v2-udp-port

---

**Berikutnya:** `16-datacenter-cloud-sdn/04-cloud-networking.md` — jaringan di cloud publik.

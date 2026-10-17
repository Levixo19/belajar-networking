# 16.4 Jaringan Cloud

> **Prasyarat:** `04-network-layer/02` (subnetting), `09-nat-acl-firewall` (NAT/ACL/firewall), `16.1`
> **Tujuan:** Anda paham model layanan cloud, jaringan virtual (VPC/VNet), konektivitas ke cloud, dan padanan konsep on-premises di cloud (sesuai CCNA 1.2.f).

---

## 1. Model Layanan Cloud

```
On-Premises   IaaS         PaaS         SaaS
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ App     │  │ App     │  │ App     │  │[App]    │ ← vendor kelola
│ Data    │  │ Data    │  │ Data    │  │[Data]   │
│ Runtime │  │ Runtime │  │[Runtime]│  │[Runtime]│
│ OS      │  │ OS      │  │[OS]     │  │[OS]     │
│ Virtual │  │[Virtual]│  │[Virtual]│  │[Virtual]│
│ Server  │  │[Server] │  │[Server] │  │[Server] │
│ Storage │  │[Storage]│  │[Storage]│  │[Storage]│
│ Network │  │[Network]│  │[Network]│  │[Network]│
└─────────┘  └─────────┘  └─────────┘  └─────────┘
 Anda kelola   [ ]=vendor kelola
```

| Model | Anda kelola | Contoh |
|---|---|---|
| **IaaS** (Infrastructure) | OS ke atas (VM, jaringan virtual) | AWS EC2, Azure VM, GCP Compute |
| **PaaS** (Platform) | Aplikasi & data saja | AWS Elastic Beanstalk, App Engine, Heroku |
| **SaaS** (Software) | Hanya pakai | Gmail, Microsoft 365, Salesforce |

**Model deployment:** **Public** (AWS/Azure/GCP), **Private** (DC sendiri), **Hybrid** (campuran on-prem + cloud), **Multi-cloud** (>1 penyedia).

> [!TIP]
> **CCNA 1.2.f** menuntut Anda membedakan on-premises vs cloud. Di cloud Anda menyewa dan mengelola lebih sedikit lapisan (dari IaaS ke SaaS makin sedikit), dengan model **pay-as-you-go** dan **elastisitas** (skala naik/turun sesuai kebutuhan).

---

## 2. Jaringan Virtual Cloud (VPC / VNet)

Setiap penyedia menyediakan jaringan virtual terisolasi:
- **AWS: VPC** (Virtual Private Cloud)
- **Azure: VNet** (Virtual Network)
- **GCP: VPC**

```
┌──────────── VPC 10.0.0.0/16 ──────────────┐
│  ┌── Subnet publik 10.0.1.0/24 ──┐          │
│  │  [Web VM] ── Internet Gateway ─┼─→ Internet
│  └────────────────────────────────┘          │
│  ┌── Subnet privat 10.0.2.0/24 ──┐          │
│  │  [DB VM] ── NAT Gateway ───────┼─→ (keluar saja)
│  └────────────────────────────────┘          │
│  Route Table · Security Group · NACL          │
└────────────────────────────────────────────┘
```

**Padanan konsep on-premises → cloud:**

| On-Premises | AWS | Fungsi |
|---|---|---|
| Rentang IP jaringan | VPC CIDR | Ruang alamat |
| VLAN/subnet | Subnet | Segmen dalam VPC |
| Router/tabel routing | Route Table | Pengarahan trafik |
| Firewall (stateful, per-host) | **Security Group** | Aturan izin per-instance (stateful) |
| ACL (stateless, per-subnet) | **Network ACL (NACL)** | Filter per-subnet (stateless) |
| Router ke internet | **Internet Gateway** | Akses internet dua arah |
| NAT (PAT keluar) | **NAT Gateway** | Instance privat keluar saja |
| Peering antar-situs | **VPC Peering / Transit Gateway** | Hubungkan VPC |
| Load balancer | ELB/ALB/NLB | Distribusi trafik |
| DNS | Route 53 | Resolusi nama |

> [!WARNING]
> **Security Group (stateful) vs NACL (stateless)** sering membingungkan. Security Group melekat pada instance, stateful (balasan otomatis diizinkan), dan hanya punya rule *allow*. NACL melekat pada subnet, stateless (harus izinkan trafik masuk DAN balasannya secara eksplisit), dan punya rule allow dan deny. Ini persis paralel dengan stateful firewall vs ACL yang Anda pelajari di `09-nat-acl-firewall`.

---

## 3. Konektivitas ke Cloud

Bagaimana menghubungkan DC/kantor on-premises ke cloud:

```
1. INTERNET + VPN (IPsec)
   Kantor ──IPsec VPN──→ VPN Gateway cloud
   Murah, cepat disiapkan, tapi lewat internet publik (latensi/bandwidth variabel)

2. DEDICATED / DIRECT CONNECT
   AWS Direct Connect / Azure ExpressRoute / GCP Interconnect
   Sirkuit privat khusus ke cloud — bandwidth terjamin, latensi rendah, lebih aman
   Lebih mahal, perlu waktu provisioning

3. SD-WAN
   Overlay yang cerdas memilih jalur ke cloud (lihat 11-wan-vpn/01)
```

> [!TIP]
> **Direct Connect/ExpressRoute** memberi koneksi privat dengan bandwidth dan latensi terjamin, cocok untuk beban kerja kritis (database, hybrid). VPN over internet cukup untuk kebutuhan umum dan backup. Banyak desain memakai keduanya: Direct Connect utama + VPN sebagai cadangan.

---

## 4. Layanan Jaringan Cloud Lain

- **Load Balancer**: Layer 4 (NLB) dan Layer 7 (ALB/Application Gateway). Auto-scaling di belakangnya.
- **DNS terkelola**: Route 53 (AWS), Cloud DNS, Azure DNS. Sering dengan health-check dan geo-routing.
- **CDN**: CloudFront, Cloud CDN, Azure CDN. Cache konten dekat pengguna.
- **Firewall/WAF**: AWS WAF, Network Firewall; kebijakan terpusat.
- **PrivateLink / Private Endpoint**: akses layanan cloud tanpa lewat internet publik.
- DNS-based service discovery, VPC endpoints, peering, dan transit gateway untuk topologi kompleks.

---

## 5. Cloud vs On-Premises: Pertimbangan

| Aspek | On-Premises | Cloud |
|---|---|---|
| Biaya | CapEx (beli di muka) | OpEx (pay-as-you-go) |
| Skala | Beli hardware, lambat | Elastis, cepat (menit) |
| Kontrol | Penuh | Terbatas (tergantung model) |
| Pemeliharaan | Tim sendiri | Vendor (sebagian) |
| Latensi ke pengguna lokal | Rendah | Tergantung region |
| Kepatuhan/kedaulatan data | Kontrol penuh | Perlu pilih region/verifikasi |

> [!WARNING]
> **Kedaulatan data (data sovereignty)** penting di Indonesia. PP No. 71/2019 dan aturan turunannya mengatur penempatan data untuk sektor tertentu (mis. data sistem elektronik publik). Untuk beban kerja yang diatur, pilih region cloud di Indonesia (AWS Jakarta `ap-southeast-3`, GCP Jakarta, Azure Indonesia Central) atau pertimbangkan private/hybrid. Verifikasi kepatuhan sektor (mis. POJK untuk keuangan).

> [!TIP]
> **Shared Responsibility Model:** vendor cloud mengamankan "keamanan DARI cloud" (infrastruktur fisik, hypervisor), Anda mengamankan "keamanan DI cloud" (konfigurasi, data, IAM, security group). Banyak insiden cloud berasal dari salah konfigurasi pelanggan (mis. S3 bucket terbuka), bukan kelemahan vendor.

---

## 6. Ringkasan

- Model layanan: **IaaS** (kelola OS ke atas), **PaaS** (kelola app+data), **SaaS** (pakai saja). Deployment: public/private/hybrid/multi-cloud.
- **VPC/VNet** = jaringan virtual terisolasi; punya CIDR, subnet, route table.
- Padanan cloud: **Security Group** (stateful, per-instance) vs **NACL** (stateless, per-subnet) = paralel stateful firewall vs ACL; **Internet Gateway** (internet dua arah), **NAT Gateway** (keluar saja).
- Konektivitas: **VPN over internet** (murah), **Direct Connect/ExpressRoute** (privat, terjamin), **SD-WAN**.
- Layanan lain: load balancer (L4/L7), DNS terkelola, CDN, WAF, PrivateLink.
- On-prem (CapEx, kontrol penuh) vs cloud (OpEx, elastis). CCNA 1.2.f menuntut pembedaan ini.
- **Kedaulatan data** (PP 71/2019) → pilih region Indonesia untuk beban kerja teregulasi.
- **Shared Responsibility Model**: vendor amankan infrastruktur, Anda amankan konfigurasi & data.

---

## 7. Latihan

1. Jelaskan perbedaan IaaS, PaaS, dan SaaS dari sisi apa yang Anda kelola.
2. Apa padanan cloud dari VLAN, router, dan firewall on-premises?
3. Jelaskan perbedaan Security Group dan NACL, dan konsep on-premises apa yang paralel dengan keduanya.
4. Kapan memilih Direct Connect/ExpressRoute dibanding VPN over internet?
5. Apa itu Shared Responsibility Model dan kenapa penting untuk keamanan cloud?

<details>
<summary>Jawaban</summary>

1. Perbedaannya pada berapa banyak lapisan yang Anda kelola. **IaaS (Infrastructure as a Service)**: vendor menyediakan infrastruktur (server virtual, storage, jaringan), Anda mengelola dari OS ke atas (OS, runtime, aplikasi, data). Contoh: AWS EC2. **PaaS (Platform as a Service)**: vendor mengelola infrastruktur DAN platform (OS, runtime, penskalaan), Anda hanya mengelola aplikasi dan data Anda. Contoh: Google App Engine, Heroku. **SaaS (Software as a Service)**: vendor mengelola semuanya; Anda hanya memakai aplikasi lewat browser/klien. Contoh: Gmail, Microsoft 365. Semakin ke SaaS, semakin sedikit yang Anda kelola (dan semakin sedikit kontrol/fleksibilitas).

2. **VLAN/subnet** → **Subnet** di dalam VPC/VNet. **Router / tabel routing** → **Route Table** VPC. **Firewall** → dua padanan: **Security Group** (firewall stateful per-instance) dan/atau **Network ACL** (filter stateless per-subnet). Tambahan: rentang IP jaringan → **VPC CIDR**; router ke internet → **Internet Gateway**; NAT keluar → **NAT Gateway**; load balancer → ELB/ALB.

3. **Security Group**: melekat pada instance (VM), bersifat stateful (jika Anda mengizinkan trafik keluar/masuk, balasannya otomatis diizinkan tanpa rule tambahan), dan hanya memiliki aturan allow (tidak ada deny eksplisit). **NACL (Network ACL)**: melekat pada subnet, bersifat stateless (Anda harus secara eksplisit mengizinkan trafik masuk dan trafik balasannya, karena tidak ada pelacakan state), dan memiliki aturan allow dan deny yang dievaluasi berurutan. Konsep on-premises yang paralel: Security Group ≈ stateful firewall (melacak koneksi, balasan otomatis diizinkan), sedangkan NACL ≈ ACL tradisional yang stateless (setiap arah harus diatur eksplisit). Ini persis pembedaan yang dipelajari di modul `09-nat-acl-firewall`.

4. Pilih **Direct Connect/ExpressRoute** (koneksi privat khusus) ketika Anda butuh: bandwidth terjamin dan konsisten, latensi rendah dan stabil (mis. untuk database hybrid, replikasi, aplikasi sensitif latensi), keamanan lebih (tidak melewati internet publik), atau volume transfer data besar (biaya per-GB bisa lebih murah dan performa lebih baik). Pilih **VPN over internet** ketika: butuh cepat disiapkan, biaya rendah, volume/kebutuhan performa moderat, atau sebagai jalur cadangan untuk Direct Connect. Banyak desain produksi memakai keduanya: Direct Connect sebagai utama dan VPN sebagai failover.

5. **Shared Responsibility Model** membagi tanggung jawab keamanan antara vendor cloud dan pelanggan. Vendor bertanggung jawab atas "keamanan DARI cloud": infrastruktur fisik, jaringan dasar, hypervisor, dan layanan terkelola. Pelanggan bertanggung jawab atas "keamanan DI cloud": konfigurasi layanan, data mereka, manajemen identitas/akses (IAM), aturan security group/firewall, enkripsi, dan patching OS (pada IaaS). Model ini penting karena kesalahpahaman tentang siapa bertanggung jawab atas apa adalah penyebab umum insiden. Mayoritas pelanggaran keamanan cloud berasal dari salah konfigurasi oleh pelanggan (mis. bucket storage yang dibuka ke publik, security group yang terlalu longgar, kredensial yang bocor), bukan dari kelemahan infrastruktur vendor. Memahami model ini memastikan Anda tidak mengira vendor mengamankan sesuatu yang sebenarnya tanggung jawab Anda.

</details>

---

## 8. Sumber

- Cisco CCNA 200-301 v1.1, topik 1.2.f (on-premises and cloud)
- AWS/Azure/GCP networking documentation
- NIST SP 800-145: The NIST Definition of Cloud Computing
- PP No. 71 Tahun 2019 (Penyelenggaraan Sistem dan Transaksi Elektronik), rujukan kedaulatan data

---

**Berikutnya:** `16-datacenter-cloud-sdn/05-container-kubernetes.md`. Jaringan container dan Kubernetes.

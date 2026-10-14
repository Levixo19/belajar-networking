# 16.5 — Jaringan Container & Kubernetes

> **Prasyarat:** `16.3` (container/virtualisasi), `13-linux-networking/02` (veth/bridge/namespace), `06-aplikasi/01` (DNS)
> **Tujuan:** Anda paham model jaringan Docker dan Kubernetes, CNI, Service, Ingress, dan network policy — jembatan antara networking dan dunia DevOps/cloud-native.

---

## 1. Jaringan Docker

Docker memakai **network namespace, veth, dan bridge** Linux (yang Anda pelajari di `13-linux-networking/02`).

```
Mode jaringan Docker:
  bridge (default) → container di bridge docker0, NAT keluar
  host             → container pakai namespace jaringan host langsung
  none             → tanpa jaringan
  overlay          → jaringan multi-host (Swarm), pakai VXLAN
  macvlan          → container dapat MAC & IP sendiri di LAN fisik
```

```
Mode bridge (default):
   [container1]      [container2]
      veth              veth
        └──── docker0 (bridge) ────┘
                 │ NAT (iptables masquerade)
              eth0 host ──→ jaringan fisik
```

⚠️ Dalam mode **bridge**, container punya IP privat (mis. `172.17.0.0/16`) dan keluar lewat **NAT**. Untuk diakses dari luar, port harus di-**publish** (`-p 8080:80` → DNAT). Ini persis konsep NAT/PAT dari `09-nat-acl-firewall/01`.

💡 Docker sebenarnya hanyalah orkestrasi rapi dari primitif Linux: setiap container = network namespace, dihubungkan ke bridge lewat pasangan veth, dengan iptables untuk NAT/port-forwarding. Kalau Anda paham `13-linux-networking`, Anda sudah paham fondasi jaringan container.

---

## 2. Model Jaringan Kubernetes

Kubernetes (K8s) mengorkestrasi container dalam **Pod** (unit terkecil, berisi 1+ container yang berbagi network namespace).

**Empat aturan fundamental jaringan K8s:**

```
1. Setiap Pod punya IP unik sendiri (IP-per-Pod)
2. Semua Pod bisa saling komunikasi TANPA NAT (flat network)
3. Semua Node bisa komunikasi dengan semua Pod tanpa NAT
4. IP yang dilihat Pod = IP yang dilihat orang lain tentang Pod itu
```

⚠️ **Model "IP-per-Pod tanpa NAT"** adalah perbedaan besar dari Docker default (yang ber-NAT). Di K8s, Pod adalah "warga kelas satu" jaringan dengan IP routable di dalam cluster — menyederhanakan model tetapi menuntut plugin jaringan (CNI) yang mengimplementasikannya.

```
Hierarki:
  Container ⊂ Pod ⊂ Node ⊂ Cluster
  - Container dalam 1 Pod: berbagi IP & namespace (bicara via localhost)
  - Pod: unit dengan IP sendiri (fana — bisa mati & lahir dengan IP baru)
  - Node: mesin (VM/fisik) yang menjalankan Pod
```

---

## 3. CNI — Container Network Interface

**CNI** adalah standar plugin yang mengimplementasikan jaringan Pod. K8s sendiri tidak menyediakan jaringan Pod — ia mendelegasikan ke plugin CNI.

| CNI | Karakteristik |
|---|---|
| **Calico** | Routing L3 (BGP), network policy kuat, populer di enterprise |
| **Cilium** | Berbasis **eBPF** — performa & observability tinggi, policy L7, tren naik |
| **Flannel** | Sederhana, overlay VXLAN, mudah dipakai |
| **Weave, Antrea, dll** | Alternatif lain |

💡 **Cilium (eBPF)** adalah tren dominan — eBPF memungkinkan pemrograman datapath kernel Linux secara aman tanpa modul kernel, memberi networking + security + observability berkinerja tinggi. Banyak layanan cloud K8s kini memakainya secara default. (eBPF juga menggantikan iptables untuk load-balancing dan policy.)

---

## 4. Service — Abstraksi Stabil

Pod bersifat **fana** (fana = sering mati dan lahir kembali dengan IP baru). **Service** memberi endpoint stabil (IP virtual + DNS) di depan sekumpulan Pod.

```
             [Service: web (ClusterIP 10.96.0.5, DNS: web.default)]
                   │ load-balance ke Pod yang sehat
        ┌──────────┼──────────┐
     [Pod-a]    [Pod-b]    [Pod-c]   ← IP berubah-ubah, Service tetap
```

**Tipe Service:**

| Tipe | Fungsi |
|---|---|
| **ClusterIP** (default) | IP virtual internal cluster — hanya diakses dari dalam |
| **NodePort** | Buka port di setiap Node (30000–32767) — akses dari luar via IP node |
| **LoadBalancer** | Provisioning load balancer cloud (ELB dsb.) — IP publik |
| **ExternalName** | Alias DNS ke layanan eksternal |
| **Headless** | Tanpa IP virtual — kembalikan IP Pod langsung (untuk stateful/DB) |

**kube-proxy** (atau eBPF di Cilium) mengimplementasikan Service dengan aturan iptables/IPVS/eBPF yang me-load-balance ClusterIP ke Pod yang sehat.

💡 **DNS internal K8s (CoreDNS)** memungkinkan Pod menghubungi Service dengan nama: `http://web.default.svc.cluster.local` (atau singkat `web` dalam namespace yang sama). Service discovery berbasis DNS — konsep DNS dari `06-aplikasi/01` yang bekerja di dalam cluster.

---

## 5. Ingress — Masuk dari Luar (L7)

**Service LoadBalancer** memberi satu IP per service (mahal, L4). **Ingress** memberi routing HTTP/HTTPS (L7) terpusat: satu titik masuk mengarahkan berdasarkan hostname/path.

```
Internet
   │
[Ingress Controller]  (nginx, Traefik, atau cloud LB)
   ├── toko.contoh.com     → Service: frontend
   ├── api.contoh.com/v1   → Service: api-v1
   └── api.contoh.com/v2   → Service: api-v2
        (terminasi TLS di sini juga)
```

- **Ingress** = objek K8s yang mendefinisikan aturan routing L7.
- **Ingress Controller** = yang mengimplementasikannya (Traefik, controller bawaan cloud, dll).
- **Gateway API** = penerus Ingress yang lebih ekspresif dan role-oriented. Untuk cluster baru, jadikan Gateway API pilihan default.

⚠️ **Ingress NGINX sudah pensiun.** Controller Ingress yang paling banyak dipakai, Ingress NGINX (proyek `kubernetes/ingress-nginx`), hanya mendapat perawatan seadanya sampai Maret 2026. Setelah itu tidak ada lagi rilis maupun perbaikan bug, termasuk perbaikan keamanan, dan repositorinya kini diarsipkan. Kubernetes SIG Network dan Security Response Committee menyarankan migrasi, dan Gateway API adalah tujuan yang mereka sarankan untuk dipertimbangkan ([pengumuman Kubernetes, 11 November 2025](https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/)). Jadi pelajari Ingress karena masih banyak dijumpai di cluster lama, tetapi rancang yang baru dengan Gateway API.

⚠️ **Ingress hanya HTTP/HTTPS (L7).** Untuk protokol TCP/UDP lain, pakai Service LoadBalancer/NodePort atau Gateway API. Terminasi TLS umumnya dilakukan di Ingress Controller.

---

## 6. Network Policy — Firewall untuk Pod

Secara default, **semua Pod bisa bicara ke semua Pod** (model flat). **NetworkPolicy** menerapkan segmentasi (mikrosegmentasi) — mirip ACL/firewall untuk Pod.

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-hanya-dari-api
spec:
  podSelector:
    matchLabels: { app: database }
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector:
            matchLabels: { app: api }   # hanya Pod berlabel app=api
      ports:
        - protocol: TCP
          port: 5432
```

⚠️ **NetworkPolicy butuh CNI yang mendukungnya** (Calico, Cilium, dll — Flannel dasar tidak). Tanpa policy, cluster "flat dan terbuka" secara internal — masalah keamanan untuk multi-tenant. Ini implementasi **Zero Trust** (lihat `12-keamanan/05`) di level Pod: default deny, izinkan eksplisit.

💡 **Cilium** memperluas ini ke **policy L7** (mis. hanya izinkan `GET /api/public`, blokir `POST`) berkat eBPF — jauh lebih granular dari NetworkPolicy standar yang berbasis L3/L4.

---

## 7. Gambaran Utuh

```
Internet → [Ingress/Gateway] → [Service (ClusterIP)] → [Pod ⟷ Pod]
                                                          │
   CNI (Calico/Cilium): IP-per-Pod, routing, policy
   CoreDNS: service discovery (nama → ClusterIP)
   NetworkPolicy: segmentasi/Zero Trust antar-Pod
   kube-proxy/eBPF: implementasi load-balancing Service
```

Ini menyatukan hampir semua yang Anda pelajari: namespace/veth/bridge (Linux), NAT, DNS, load balancing, VXLAN (overlay CNI), BGP (Calico), firewall/ACL (NetworkPolicy), dan Zero Trust.

---

## 8. Ringkasan

- **Docker** memakai primitif Linux: namespace + veth + bridge (`docker0`) + NAT/port-publish. Mode: bridge, host, none, overlay, macvlan.
- **Kubernetes**: unit = **Pod** (1+ container berbagi namespace). Aturan: **IP-per-Pod, tanpa NAT, flat**.
- **CNI** mengimplementasikan jaringan Pod: **Calico** (BGP/policy), **Cilium** (eBPF, tren), Flannel (sederhana).
- **Service** = endpoint stabil (IP virtual + DNS) di depan Pod fana. Tipe: **ClusterIP, NodePort, LoadBalancer, ExternalName, Headless**. **CoreDNS** untuk discovery.
- **Ingress** = routing HTTP/HTTPS L7 terpusat (Ingress Controller mengimplementasikan); **Gateway API** penerusnya dan pilihan default untuk cluster baru, apalagi sejak Ingress NGINX pensiun (Maret 2026).
- **NetworkPolicy** = firewall/segmentasi Pod (butuh CNI pendukung) — Zero Trust di level Pod. Cilium menambah policy L7.
- Semua ini menyatukan konsep: namespace, NAT, DNS, load balancing, VXLAN, BGP, firewall, Zero Trust.

---

## 9. Latihan

1. Apa primitif Linux yang mendasari jaringan Docker mode bridge?
2. Sebutkan empat aturan fundamental jaringan Kubernetes. Apa bedanya dengan Docker default?
3. Kenapa Service diperlukan padahal Pod sudah punya IP? Sebutkan tiga tipe Service dan fungsinya.
4. Apa perbedaan Service LoadBalancer dan Ingress?
5. Apa fungsi NetworkPolicy dan bagaimana ia mewujudkan Zero Trust di dalam cluster?

<details>
<summary>Jawaban</summary>

1. Docker mode bridge memakai: **network namespace** (setiap container mendapat namespace jaringan terisolasi dengan interface, tabel routing, dan aturan firewall sendiri), **pasangan veth (virtual ethernet)** (satu ujung di dalam namespace container sebagai `eth0`, ujung lain terhubung ke bridge di host), **bridge Linux** (`docker0`, bertindak sebagai switch virtual yang menghubungkan semua container), dan **iptables** (untuk NAT/masquerade agar container bisa keluar, dan DNAT untuk port yang di-publish). Ini persis primitif yang dipelajari di `13-linux-networking/02` — Docker hanya mengorkestrasinya secara otomatis.

2. Empat aturan: **(1)** setiap Pod punya **IP unik sendiri** (IP-per-Pod); **(2)** semua Pod bisa berkomunikasi satu sama lain **tanpa NAT** (jaringan flat/datar); **(3)** semua Node bisa berkomunikasi dengan semua Pod tanpa NAT; **(4)** IP yang dilihat Pod tentang dirinya sendiri **sama** dengan IP yang dilihat pihak lain tentang Pod itu (tidak ada penerjemahan). **Bedanya dengan Docker default:** Docker mode bridge memberi container IP privat dan menyembunyikannya di balik **NAT** (harus publish port untuk akses dari luar), sedangkan K8s menjadikan setiap Pod punya IP routable langsung di dalam cluster **tanpa NAT** — model yang lebih sederhana dan datar, tetapi menuntut plugin CNI untuk mengimplementasikannya.

3. **Pod bersifat fana** — ia sering dihentikan dan dibuat ulang (saat scaling, update, atau kegagalan node), dan setiap Pod baru mendapat **IP baru**. Kalau klien menghubungi IP Pod langsung, koneksi putus setiap kali Pod diganti. **Service** memberi **endpoint stabil** (IP virtual/ClusterIP + nama DNS tetap) di depan sekumpulan Pod, dan me-load-balance ke Pod yang sehat — sehingga klien tidak peduli Pod mana yang melayani atau IP-nya berubah. Tiga tipe: **ClusterIP** (IP internal cluster, hanya diakses dari dalam — default); **NodePort** (membuka port statik di setiap node sehingga bisa diakses dari luar via IP node:port); **LoadBalancer** (memprovisikan load balancer cloud dengan IP publik untuk akses eksternal). (Tambahan: ExternalName = alias DNS ke layanan luar; Headless = tanpa IP virtual, kembalikan IP Pod langsung untuk aplikasi stateful.)

4. **Service LoadBalancer** bekerja di **Layer 4** (TCP/UDP) dan biasanya memberi **satu IP publik per service** dengan memprovisikan load balancer cloud — sederhana tetapi bisa mahal kalau punya banyak service, dan tidak paham HTTP. **Ingress** bekerja di **Layer 7** (HTTP/HTTPS) dan menyediakan **satu titik masuk terpusat** yang mengarahkan trafik ke banyak Service berdasarkan **hostname dan/atau path** (mis. `toko.contoh.com` → frontend, `api.contoh.com/v1` → api-v1), serta umumnya menangani **terminasi TLS**. Jadi Ingress lebih hemat dan ekspresif untuk trafik web (banyak aplikasi di balik satu IP), sedangkan LoadBalancer lebih cocok untuk protokol non-HTTP atau ketika butuh IP L4 dedikasi. Ingress butuh **Ingress Controller** untuk mengimplementasikannya. Untuk desain baru, gunakan **Gateway API** sebagai penerus Ingress, karena controller Ingress NGINX yang populer sudah pensiun sejak Maret 2026.

5. **NetworkPolicy** mendefinisikan aturan yang mengontrol trafik mana yang boleh masuk (ingress) dan keluar (egress) dari sekelompok Pod (dipilih via label) — pada dasarnya **firewall/ACL untuk Pod**. Ia mewujudkan **Zero Trust** karena: secara default cluster K8s "flat dan terbuka" (semua Pod bisa bicara ke semua Pod), tetapi begitu sebuah NetworkPolicy diterapkan pada Pod, Pod itu menjadi **default-deny** untuk arah yang diatur — hanya trafik yang **secara eksplisit diizinkan** (mis. "database hanya menerima koneksi dari Pod berlabel app=api pada port 5432") yang boleh lewat. Ini persis prinsip Zero Trust: jangan percaya berdasarkan lokasi (berada di cluster yang sama tidak cukup), verifikasi dan izinkan setiap alur secara eksplisit dengan hak paling minimal (mikrosegmentasi). ⚠️ Membutuhkan CNI yang mendukung (Calico, Cilium); Cilium bahkan memperluasnya ke policy L7.

</details>

---

## 10. Sumber

- Kubernetes networking documentation — https://kubernetes.io/docs/concepts/services-networking/
- CNI spec · Calico, Cilium (eBPF) documentation
- Gateway API — https://gateway-api.sigs.k8s.io/
- Kubernetes Blog, "Ingress NGINX Retirement" (11 November 2025): https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/
- *Kubernetes Networking* (O'Reilly)

---

**Berikutnya:** `16-datacenter-cloud-sdn/06-sdn.md` — SDN, controller-based networking, dan otomasi terpusat (CCNA 6.2–6.4).

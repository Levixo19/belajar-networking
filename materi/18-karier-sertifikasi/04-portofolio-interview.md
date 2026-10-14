# 18.4 — Portofolio & Persiapan Wawancara

> **Prasyarat:** sebaiknya sudah mempraktikkan beberapa lab (`lab/`)
> **Tujuan:** Anda tahu cara membangun portofolio jaringan yang meyakinkan dan mempersiapkan wawancara teknis.

---

## 1. Kenapa Portofolio Penting

Sertifikasi mengatakan "saya lulus ujian"; **portofolio menunjukkan "saya benar-benar bisa".** Untuk peran jaringan (terutama tanpa pengalaman kerja formal), portofolio membedakan Anda dari pelamar lain yang hanya punya sertifikat.

```
Portofolio membuktikan:
  ✅ Kemampuan praktik nyata (bukan hanya teori)
  ✅ Inisiatif & passion belajar
  ✅ Kemampuan dokumentasi & komunikasi
  ✅ Familiar dengan tools industri (Git, lab, otomasi)
```

---

## 2. Membangun Home Lab

Cara paling meyakinkan menunjukkan kemampuan:

```
OPSI LAB (murah → serius):
1. Simulator/emulator (gratis):
   - Cisco Packet Tracer (CCNA-level)
   - GNS3 / Cisco CML / EVE-NG (image nyata)
   - Containerlab (modern, cloud-native)
   - MikroTik CHR (gratis, di VM)
   - Linux + network namespaces (13-linux-networking)

2. Cloud sandbox (gratis/murah):
   - Cisco DevNet Sandbox
   - AWS/Azure/GCP free tier (untuk cloud networking)

3. Hardware bekas (opsional, untuk pengalaman fisik):
   - Switch/router bekas (murah di marketplace)
   - MikroTik hAP (murah, RouterOS lengkap)
   - Raspberry Pi untuk layanan (DNS, firewall)
```

💡 **Anda tidak perlu hardware mahal.** Packet Tracer + GNS3 + MikroTik CHR + Linux VM sudah cukup untuk membangun dan mendemonstrasikan hampir semua skenario di kurikulum ini secara gratis. Yang dinilai adalah **apa yang Anda bangun dan pahami**, bukan seberapa mahal peralatannya.

---

## 3. Proyek Portofolio yang Baik

Bangun & dokumentasikan proyek yang menunjukkan berbagai skill:

```
PEMULA:
  - VLAN + inter-VLAN routing + DHCP di topologi kampus kecil
  - Subnetting sebuah perusahaan fiktif (dokumentasi IP plan)
  - Konfigurasi & verifikasi OSPF multi-router

MENENGAH:
  - Desain jaringan kampus lengkap (17.4 studi kasus) + dokumentasi
  - Site-to-site VPN (IPsec) antar-dua situs
  - MikroTik: hotspot + bandwidth management + firewall (skenario RT-RW-Net)
  - BGP lab (dua AS, peering, path selection)

LANJUTAN / MENONJOL:
  - Otomasi: skrip Python (Netmiko) backup config semua perangkat
  - Ansible playbook untuk provisioning VLAN massal
  - Lab CI/CD jaringan (Containerlab + validasi)
  - Monitoring stack (Prometheus/Grafana + SNMP/telemetri)
  - Kubernetes networking (CNI, network policy)
```

⚠️ **Dokumentasikan setiap proyek** dengan: tujuan, topologi (diagram), konfigurasi, tantangan yang dihadapi & cara mengatasinya, dan apa yang dipelajari. **Proyek tak terdokumentasi = tak terlihat.** Dokumentasi juga menunjukkan skill komunikasi yang dicari pemberi kerja.

💡 **Simpan di GitHub.** Repositori berisi konfigurasi, skrip, diagram, dan README yang menjelaskan tiap proyek adalah portofolio digital yang bisa Anda tautkan di CV/LinkedIn. Ini sekaligus menunjukkan Anda familiar dengan Git — skill NetDevOps yang bernilai (`15/04`).

---

## 4. Blog / Dokumentasi Belajar

Menulis tentang apa yang dipelajari (blog, LinkedIn, GitHub README):
- Memperkuat pemahaman Anda sendiri (mengajar = belajar).
- Menunjukkan komunikasi & pemahaman mendalam.
- Membangun kehadiran profesional.

Contoh topik: "Menjelaskan OSPF DR/BDR dengan analogi", "Setup lab BGP di GNS3", "Otomasi backup MikroTik dengan Python".

---

## 5. Persiapan Wawancara Teknis Jaringan

**Kategori pertanyaan umum:**

```
KONSEP FONDASI:
  - Jelaskan proses saat mengetik URL di browser (end-to-end) ★ klasik
  - OSI vs TCP/IP; apa terjadi di tiap layer
  - TCP vs UDP; three-way handshake
  - Apa itu ARP, dan bagaimana bekerja
  - Subnetting on the spot (siapkan!)

ROUTING & SWITCHING:
  - Bagaimana switch belajar MAC & meneruskan frame
  - VLAN & trunk; kenapa & bagaimana
  - STP: kenapa perlu, bagaimana memilih root
  - Perbedaan routing protokol (OSPF vs BGP vs static)
  - Bagaimana router memilih rute (longest match, AD, metric)

PRAKTIK & TROUBLESHOOTING:
  - "Host tak bisa akses internet — bagaimana Anda troubleshoot?" ★
  - Skenario: diberi topologi, temukan masalah
  - Tools apa yang dipakai untuk masalah X

KEAMANAN & MODERN:
  - Bagaimana mengamankan switch/port
  - Apa itu NAT, kenapa dipakai
  - Konsep VPN/IPsec
  - (Untuk peran modern) otomasi, SDN, cloud
```

💡 **"Jelaskan apa yang terjadi saat Anda mengetik URL dan menekan Enter"** adalah pertanyaan wawancara jaringan **paling klasik**. Jawaban lengkap menyentuh: DNS (resolusi nama), ARP (MAC gateway), TCP handshake, TLS, HTTP request/response, routing di sepanjang jalan, dan enkapsulasi. Ini menguji apakah Anda paham **keseluruhan sistem** — persis yang diajarkan kurikulum ini secara progresif. Latih jawaban ini sampai lancar.

⚠️ **Untuk pertanyaan troubleshooting, tunjukkan METODOLOGI, bukan tebakan.** Pewawancara ingin melihat pendekatan sistematis (bottom-up/top-down OSI, `14/01`): "Pertama saya cek layer fisik — apakah link up? Lalu IP config — apakah host punya IP/gateway benar? Lalu gateway — bisa ping gateway? Lalu DNS..." Proses berpikir lebih dinilai daripada langsung menebak jawaban.

---

## 6. Tips Wawancara

```
✅ Jujur tentang yang tidak tahu ("Saya belum pernah pakai X, tapi
   konsepnya mirip Y yang saya paham, dan saya akan pelajari cepat")
✅ Tunjukkan proses berpikir (verbalisasi saat menyelesaikan soal)
✅ Kaitkan dengan proyek lab Anda ("Saya mengonfigurasi ini di lab...")
✅ Latih subnetting & "URL to page" sampai otomatis
✅ Siapkan pertanyaan untuk pewawancara (tunjukkan minat)
✅ Untuk soal skenario: klarifikasi dulu, lalu pendekatan sistematis
⚠️ Jangan mengarang jawaban — pewawancara teknis mudah mendeteksi
```

💡 **Kejujuran + kemauan belajar** sering lebih dihargai daripada berpura-pura tahu segalanya. Tidak ada yang tahu semuanya; pemberi kerja mencari fondasi solid + kemampuan & antusiasme belajar. Kurikulum ini memberi fondasi itu.

---

## 7. Ringkasan

- **Sertifikasi mengatakan "saya lulus"; portofolio menunjukkan "saya bisa".** Portofolio membedakan Anda.
- **Home lab** tidak harus mahal: Packet Tracer, GNS3/CML, Containerlab, MikroTik CHR, Linux VM, DevNet Sandbox — semua gratis/murah.
- **Proyek portofolio** dari pemula (VLAN/OSPF) sampai menonjol (otomasi Python/Ansible, CI/CD, monitoring). **Dokumentasikan semua** dan simpan di **GitHub**.
- **Menulis/blog** tentang yang dipelajari memperkuat pemahaman & kehadiran profesional.
- **Wawancara**: siapkan konsep fondasi, routing/switching, troubleshooting **bermetodologi**, dan "URL to page" (pertanyaan klasik). Latih subnetting.
- **Tunjukkan proses berpikir, jujur, kaitkan dengan lab.** Kejujuran + kemauan belajar > berpura-pura.

---

## 8. Latihan

1. Kenapa portofolio penting selain sertifikasi, terutama tanpa pengalaman kerja?
2. Bagaimana membangun home lab tanpa hardware mahal?
3. Rancang jawaban ringkas untuk "apa yang terjadi saat mengetik URL dan menekan Enter?"
4. Untuk pertanyaan troubleshooting, kenapa metodologi lebih dinilai daripada jawaban langsung?
5. Sebutkan tiga proyek portofolio dan skill yang masing-masing tunjukkan.

<details>
<summary>Jawaban</summary>

1. Karena **sertifikasi hanya membuktikan Anda lulus ujian** (pengetahuan yang bisa saja hafalan), sedangkan **portofolio membuktikan Anda dapat benar-benar menerapkannya** — mendesain, mengonfigurasi, men-troubleshoot, dan mendokumentasikan jaringan nyata. Tanpa pengalaman kerja formal, pemberi kerja tidak punya bukti kemampuan praktik Anda; portofolio (home lab terdokumentasi, proyek di GitHub, tulisan) mengisi kekosongan itu dengan **bukti konkret**. Ia juga menunjukkan kualitas yang tidak terlihat dari sertifikat: **inisiatif dan passion** (Anda membangun ini atas kemauan sendiri), **kemampuan dokumentasi dan komunikasi** (menjelaskan proyek dengan jelas), dan **familiaritas dengan tools industri** (Git, simulator, otomasi). Dalam kolam pelamar entry-level yang semuanya punya sertifikat serupa, portofolio adalah pembeda utama.

2. Dengan memanfaatkan **simulator/emulator dan sumber gratis**: **Cisco Packet Tracer** (gratis via Networking Academy, cukup untuk sebagian besar skenario CCNA); **GNS3, Cisco CML, atau EVE-NG** (menjalankan image OS jaringan nyata untuk lab lebih realistis); **Containerlab** (topologi cloud-native modern); **MikroTik CHR** (RouterOS lengkap gratis di VM); **Linux dengan network namespaces, veth, dan bridge** (`13-linux-networking` — membangun jaringan nyata di satu laptop); dan **Cisco DevNet Sandbox** serta **cloud free tier** (AWS/Azure/GCP untuk cloud networking). Untuk pengalaman fisik opsional, hardware bekas murah (switch/router bekas, MikroTik hAP yang murah, Raspberry Pi untuk menjalankan layanan) bisa ditambahkan, tetapi **tidak wajib**. Yang dinilai adalah apa yang Anda bangun dan pahami, bukan biaya peralatan.

3. (Contoh jawaban ringkas end-to-end) "Pertama, browser perlu **IP dari nama domain**, jadi ia melakukan **DNS**: cek cache, lalu tanya resolver (biasanya lewat UDP/53, mungkin DoH). Setelah dapat IP tujuan, host menentukan apakah tujuan di subnet lokal atau perlu lewat **gateway**; untuk mengirim frame ke gateway (atau tujuan lokal), ia perlu MAC-nya lewat **ARP** (atau NDP di IPv6). Lalu terbentuk koneksi **TCP** ke port 443 lewat **three-way handshake** (SYN, SYN-ACK, ACK). Karena HTTPS, dilakukan **TLS handshake** (negosiasi versi/cipher, sertifikat server diverifikasi, kunci sesi dibuat). Setelah kanal aman, browser mengirim **HTTP request** (GET). Paket melewati banyak router yang masing-masing melakukan **keputusan forwarding** (longest prefix match) sepanjang jalan, dengan enkapsulasi/dekapsulasi di setiap hop dan mungkin **NAT** di tepi. Server merespons dengan **HTTP response** (HTML), browser merender halaman, mengambil aset tambahan (mungkin lewat HTTP/2 atau HTTP/3/QUIC), dan menampilkannya." (Sesuaikan kedalaman dengan waktu; kuncinya menunjukkan pemahaman lintas-layer: DNS → ARP → TCP → TLS → HTTP + routing/enkapsulasi.)

4. Karena pertanyaan troubleshooting menguji **cara Anda berpikir dan memecahkan masalah yang belum pernah Anda lihat**, bukan apakah Anda kebetulan menebak jawaban yang benar. Di pekerjaan nyata, masalah jarang identik dengan contoh; yang membuat seorang engineer efektif adalah **pendekatan sistematis** yang dapat diandalkan untuk mempersempit penyebab. Menunjukkan metodologi (mis. bottom-up OSI: cek fisik → link → IP/gateway → DNS → aplikasi, atau membagi masalah separuh demi separuh) membuktikan Anda bisa **mengisolasi masalah secara logis, mengumpulkan bukti, dan menghindari mengubah banyak hal sekaligus** — dan bahwa Anda akan tetap efektif pada masalah baru. Langsung menebak jawaban (meski benar) tidak meyakinkan pewawancara bahwa Anda bisa menangani skenario berbeda, dan menebak salah tanpa proses terlihat lebih buruk. Verbalisasi proses ("pertama saya akan cek...") justru sering lebih penting daripada sampai ke jawaban akhir.

5. (Tiga dari) **(1) VLAN + inter-VLAN routing + DHCP di topologi kampus kecil** — menunjukkan penguasaan switching, segmentasi, routing L3, dan layanan (DHCP); skill implementasi kampus dasar. **(2) MikroTik hotspot + bandwidth management + firewall (skenario RT-RW-Net)** — menunjukkan kemampuan pada platform yang laku di pasar ISP lokal, plus konsep QoS/queue, NAT, dan firewall terapan. **(3) Otomasi backup konfigurasi dengan Python (Netmiko) atau Ansible playbook provisioning VLAN massal** — menunjukkan skill NetDevOps yang bernilai tinggi (pemrograman + jaringan, Git, idempotensi). Tambahan: **desain jaringan kampus lengkap terdokumentasi** (skill arsitektur & dokumentasi), **site-to-site IPsec VPN** (keamanan/WAN), **BGP lab** (routing lanjutan/ISP), **monitoring stack Prometheus/Grafana** (observability). Masing-masing sebaiknya disertai diagram, konfigurasi, dan README di GitHub.

</details>

---

## 9. Sumber

- GitHub (untuk hosting portofolio) · Cisco Packet Tracer, GNS3, Containerlab
- Cisco DevNet Sandbox — https://developer.cisco.com/
- `lab/` (lab kurikulum ini sebagai bahan proyek) · `17/04` (studi kasus desain)

---

**Berikutnya:** `18-karier-sertifikasi/05-peta-mikrotik.md` — jalur sertifikasi MikroTik (MTCNA dan seterusnya).

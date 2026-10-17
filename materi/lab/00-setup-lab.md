# Lab 00: Menyiapkan Lingkungan Lab

> **Tujuan:** Menyiapkan lingkungan untuk mempraktikkan seluruh materi kurikulum, gratis dan tanpa hardware mahal.

---

## 1. Kenapa Lab Penting

Membaca teori jaringan tanpa praktik seperti membaca buku renang tanpa masuk air. Pemahaman baru menjadi solid dan siap ujian/kerja kalau Anda mengonfigurasi sendiri: mengetik perintah, melihat output, membuat kesalahan, lalu memperbaikinya.

> [!WARNING]
> Semua lab dalam kurikulum ini dirancang agar bisa dikerjakan dengan alat gratis. Anda tidak perlu membeli perangkat.

---

## 2. Pilihan Platform Lab

### A. Cisco Packet Tracer (untuk lab Cisco level CCNA): REKOMENDASI PEMULA
```
+ Gratis (via Cisco Networking Academy — daftar akun gratis)
+ Ringan, mudah, cukup untuk 90% lab CCNA
+ Simulasi visual (drag-drop perangkat)
- Bukan IOS asli (beberapa perintah tak didukung)
Unduh: Resource Hub NetAcad, halaman Lab Downloads (https://www.netacad.com/resources/lab-downloads), butuh akun gratis. Panduan lengkapnya ada di `lab/00b-panduan-packet-tracer`.
```

### B. GNS3 / EVE-NG / Cisco CML (lab realistis)
```
+ Menjalankan image OS jaringan NYATA (IOS, IOS-XE, dll)
+ Realistis untuk lab lanjutan
- Butuh image. Cisco menyediakan CML-Free tanpa biaya untuk satu pengguna dengan paling banyak 5 node berjalan sekaligus (perlu daftar dan akun Cisco); lab yang lebih besar butuh CML berlisensi. GNS3 bisa memakai image legal yang Anda miliki.
- Lebih berat (butuh RAM cukup)
```

### C. Containerlab (modern, untuk lab lanjutan/otomasi)
```
+ Topologi sebagai kode (YAML), cepat
+ Image gratis: FRR, Arista cEOS, Nokia SR Linux, Cumulus
+ Ideal untuk lab routing (BGP/OSPF) & otomasi (Tahap 15)
Instal: containerlab.dev (butuh Docker/Linux)
```

### D. MikroTik CHR (untuk lab MikroTik: Tahap 19)
```
+ RouterOS LENGKAP, GRATIS (batas 1 Mbps per interface, cukup untuk belajar)
+ Jalan di VirtualBox/VMware/GNS3/Proxmox
Unduh: mikrotik.com → Software → Cloud Hosted Router (CHR)
Kelola dengan: WinBox (GUI), WebFig (browser), atau SSH
```

### E. Linux (untuk lab Linux networking: Tahap 13)
```
+ Sudah ada di sistem Anda (atau VM Linux gratis)
+ Praktik nyata: ip, namespaces, veth, bridge, nftables, tcpdump
+ Bisa simulasi seluruh topologi dengan network namespaces (lihat 13/02)
```

> [!TIP]
> **Rekomendasi minimal untuk seluruh kurikulum:** Packet Tracer (lab Cisco/CCNA) + MikroTik CHR di VirtualBox (lab MikroTik) + Linux/VM (lab Linux & otomasi). Ketiganya gratis dan mencakup pendekatan tiga-platform kurikulum ini.

---

## 3. Setup Cepat per Platform

### Packet Tracer
```
1. Daftar akun gratis di netacad.com
2. Unduh & instal Packet Tracer
3. Login → mulai proyek baru
4. Drag perangkat (router 4321, switch 2960, PC) → hubungkan dengan kabel
5. Klik perangkat → CLI tab untuk konfigurasi
```

### MikroTik CHR di VirtualBox
```
1. Unduh CHR image (.vdi/.ova) dari mikrotik.com
2. Impor ke VirtualBox
3. Atur network adapter (host-only untuk lab isolasi, atau bridged)
4. Boot → login (admin, tanpa password awal)
5. Unduh WinBox untuk GUI, atau SSH ke IP CHR
```

### Linux network namespaces (tanpa VM tambahan)
```bash
# Simulasi 2 "host" terhubung — semua di satu Linux (lihat 13/02)
sudo ip netns add host1
sudo ip netns add host2
sudo ip link add veth1 type veth peer name veth2
sudo ip link set veth1 netns host1
sudo ip link set veth2 netns host2
sudo ip netns exec host1 ip addr add 10.0.0.1/24 dev veth1
sudo ip netns exec host2 ip addr add 10.0.0.2/24 dev veth2
sudo ip netns exec host1 ip link set veth1 up
sudo ip netns exec host2 ip link set veth2 up
sudo ip netns exec host1 ping 10.0.0.2   # uji!
```

---

## 4. Topologi Lab Standar

Banyak lab kurikulum ini memakai topologi dasar berikut. Siapkan sekali, pakai berulang:

```
        [R1]───────[R2]
         │           │
      [SW1]        [SW2]
      /   \        /   \
   [PC1][PC2]   [PC3][PC4]

R1, R2  : router (routing, OSPF, static, NAT)
SW1, SW2: switch (VLAN, trunk, STP)
PC1-4   : host (uji konektivitas, DHCP, ping)
```

Untuk lab MikroTik, ganti R1/R2 dengan CHR. Untuk lab Linux, seluruh topologi bisa dibangun dengan namespaces.

---

## 5. Cara Menggunakan Lab dalam Kurikulum

```
- Setiap Tahap punya lab terkait di folder lab/ (01-lab-... dst).
- Setiap lab: TUJUAN, TOPOLOGI, TUGAS bertahap, VERIFIKASI, dan
  KRITERIA SUKSES (graded — Anda tahu kapan berhasil).
- Kerjakan lab SETELAH membaca modul terkait.
- Jangan lihat solusi sebelum mencoba — kesalahan adalah guru terbaik.
- Dokumentasikan (screenshot/config) untuk portofolio (18/04).
```

> [!WARNING]
> **Buat, rusak, perbaiki.** Jangan takut merusak lab. Men-troubleshoot lab yang rusak justru melatih skill yang paling berharga. Reset dan ulangi sesering mungkin.

---

## 6. Verifikasi Setup Anda

Sebelum lanjut, pastikan Anda bisa:
```
□ Packet Tracer: buat 2 PC + 1 switch, keduanya bisa saling ping
□ MikroTik CHR: boot, akses via WinBox/SSH, jalankan /ip address print
□ Linux: jalankan contoh namespace di atas, ping berhasil
```

Jika ketiganya berhasil, Anda siap mengerjakan semua lab kurikulum.

---

## 7. Ringkasan

- Praktik lab wajib, karena konfigurasi sendiri membuat pemahaman solid.
- Platform gratis: Packet Tracer (Cisco/CCNA), GNS3/CML/Containerlab (realistis/lanjutan), MikroTik CHR (Tahap 19), Linux namespaces (Tahap 13/otomasi).
- Rekomendasi minimal: Packet Tracer + CHR + Linux VM (mencakup tiga platform kurikulum).
- Gunakan **topologi lab standar** (2 router, 2 switch, 4 PC) berulang.
- Setiap lab punya tujuan, tugas bertahap, verifikasi, dan kriteria sukses.
- **Buat, rusak, perbaiki**: troubleshooting lab yang rusak melatih skill terbaik.

---

**Berikutnya:** `lab/00b-panduan-packet-tracer`. Panduan lengkap Cisco Packet Tracer sebelum lab pertama.

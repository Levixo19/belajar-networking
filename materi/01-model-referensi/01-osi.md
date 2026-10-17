# 01.1 Model OSI

> **Prasyarat:** `00-fondasi/01`-`05`
> **Tujuan:** Anda bisa menyebut 7 layer dengan fungsinya, menempatkan protokol & perangkat di layer yang tepat, dan, yang terpenting, memakai OSI sebagai alat troubleshooting.

---

## 1. Kenapa Ada Model Berlayer?

Bayangkan Anda harus membangun sistem pengiriman barang internasional dari nol. Anda harus memikirkan sekaligus: bahan kardus, cara menulis alamat, rute kapal, bea cukai, bahasa dokumen, dan cara pelanggan memesan. Mustahil ditangani satu orang.

Solusinya: bagi jadi lapisan tanggung jawab. Bagian pengepakan tidak perlu tahu rute kapal. Bagian kapal tidak perlu tahu isi kardus.

Model berlayer memberi empat manfaat konkret:

1. **Modularitas**: ganti Wi-Fi jadi Ethernet tanpa mengubah browser sama sekali.
2. **Interoperabilitas**: vendor A membuat switch, vendor B membuat NIC, keduanya bekerja karena mengikuti spesifikasi antarmuka layer yang sama.
3. **Pembagian kerja**: insinyur RF tidak perlu tahu HTTP; developer web tidak perlu tahu modulasi.
4. **Troubleshooting terstruktur**: ini manfaat harian Anda. Alih-alih "internetnya rusak", Anda bisa berkata "layer 1-3 sehat, masalahnya di layer 7".

> **Yang paling penting dari modul ini adalah kebiasaan berpikir "masalah ini ada di layer berapa?", bukan hafalan 7 nama.**

---

## 2. Tujuh Layer OSI

OSI (*Open Systems Interconnection*) diterbitkan ISO tahun 1984 (ISO/IEC 7498-1).

```
┌───┬──────────────┬──────────────────────────────┬─────────────┐
│ # │ Layer        │ Tugas inti                   │ PDU         │
├───┼──────────────┼──────────────────────────────┼─────────────┤
│ 7 │ Application  │ Antarmuka ke aplikasi        │ Data        │
│ 6 │ Presentation │ Format, enkripsi, kompresi   │ Data        │
│ 5 │ Session      │ Membuka/menutup/mengelola sesi│ Data       │
│ 4 │ Transport    │ Keandalan, port, segmentasi  │ Segment/    │
│   │              │                              │ Datagram    │
│ 3 │ Network      │ Alamat logis & routing       │ Packet      │
│ 2 │ Data Link    │ Alamat fisik & akses media   │ Frame       │
│ 1 │ Physical     │ Bit menjadi sinyal           │ Bit         │
└───┴──────────────┴──────────────────────────────┴─────────────┘
```

### Cara menghafal

Dari bawah ke atas (1→7):
> **P**lease **D**o **N**ot **T**hrow **S**ausage **P**izza **A**way

Dari atas ke bawah (7→1):
> **A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing

Versi Indonesia (7→1):
> **A**yah **P**ergi **S**etiap **T**anggal **N**anti **D**apat **P**ulsa

Pilih satu, hafalkan hari ini. Anda akan memakainya seumur karier.

---

## 3. Layer 1: Physical

**Tugas:** memindahkan **bit** melalui media fisik.

Layer ini tidak tahu apa-apa tentang alamat, paket, atau siapa mengirim ke siapa. Ia hanya tahu: "ubah bit 1 menjadi tegangan +2,5 V" atau "ubah bit 0 menjadi cahaya padam".

**Yang ditentukan di layer 1:**
- Karakteristik media: jenis kabel, jarak maksimum, jenis konektor
- Level tegangan / panjang gelombang cahaya / frekuensi radio
- Encoding bit ke sinyal (NRZ, Manchester, 4B/5B, PAM4)
- Pinout konektor, susunan pin
- Sinkronisasi waktu (clock), bit rate
- Topologi fisik

**Contoh nyata:** kabel UTP Cat6, serat single-mode, konektor RJ45/LC, transceiver SFP+, sinyal radio 2,4 GHz, repeater, hub, media converter, standar 1000BASE-T.

**Gejala masalah layer 1:**
```
- Lampu link mati
- Kabel putus / konektor longgar / RJ45 crimping buruk
- Serat kotor atau tertekuk
- Panjang kabel melebihi 100 m (UTP)
- SFP tidak kompatibel / tidak terdeteksi
- Interferensi listrik (kabel data sejajar kabel listrik)
- CRC error tinggi terus-menerus
```

**Cek layer 1:**
```
SW1# show interfaces status
SW1# show interfaces gi0/1        ← lihat "line protocol is down" & counter error

$ ip link show eth0                ← state DOWN / NO-CARRIER
$ ethtool eth0                     ← Link detected: yes/no
```

> [!TIP]
> **Aturan lapangan:** ~80% masalah jaringan "aneh" berakar di layer 1. Selalu cek kabel dan lampu link sebelum menuduh routing.

---

## 4. Layer 2: Data Link

**Tugas:** mengantar **frame** antar-perangkat dalam satu segmen jaringan yang sama, dan mengatur siapa boleh memakai media kapan.

Layer 2 adalah tempat **alamat fisik (MAC)** bekerja. Ini alamat yang tertanam di kartu jaringan.

**Dua sublayer:**
- **LLC** (*Logical Link Control*, IEEE 802.2): antarmuka ke layer 3, menandai protokol apa yang dibawa. Sebagian besar sudah digantikan field EtherType di Ethernet II.
- **MAC** (*Media Access Control*): pengalamatan fisik & aturan akses media (CSMA/CD, CSMA/CA).

**Yang dilakukan layer 2:**
- Membungkus paket menjadi frame (header + trailer)
- Pengalamatan MAC (sumber & tujuan)
- Deteksi error dengan FCS/CRC (mendeteksi, bukan memperbaiki)
- Kontrol akses media
- Pembatasan collision domain (oleh switch)

**Contoh:** Ethernet (802.3), Wi-Fi (802.11), PPP, HDLC, VLAN (802.1Q), STP, MAC address, switch, bridge, NIC, ARP*.

\* ARP sering diperdebatkan: ia menerjemahkan IP (L3) ke MAC (L2), jadi ada di antara keduanya. Untuk ujian, ARP biasanya digolongkan layer 2 (Cisco), walau beberapa sumber menyebut L2,5 atau L3.

**Batas jangkauan layer 2:** frame tidak bisa melewati router. Router membuang header L2 lama dan membuat yang baru. Inilah kenapa MAC address tujuan berubah di setiap hop, sedangkan IP tujuan tidak.

**Gejala masalah layer 2:**
```
- VLAN salah / trunk tidak melewatkan VLAN
- Duplex mismatch (banyak collision & CRC error)
- STP memblok port yang seharusnya aktif
- MAC address table penuh / MAC flapping
- Broadcast storm (loop L2)
- Port security men-shutdown port
```

**Cek layer 2:**
```
SW1# show mac address-table
SW1# show vlan brief
SW1# show interfaces trunk
SW1# show spanning-tree

$ ip neigh show
$ bridge fdb show
```

---

## 5. Layer 3: Network

**Tugas:** mengantar **paket** dari jaringan mana pun ke jaringan mana pun, lintas router dan lintas negara.

Ini layer yang membuat internet mungkin. Layer 2 hanya bisa bicara dalam satu segmen; layer 3 menghubungkan segmen-segmen itu.

**Yang dilakukan layer 3:**
- Pengalamatan **logis** (IP address): bisa diubah, punya struktur hierarkis
- **Routing**: memilih jalur terbaik ke jaringan tujuan
- **Forwarding**: meneruskan paket ke next hop
- **Fragmentasi**: memecah paket yang lebih besar daripada MTU
- **TTL**: mencegah paket berputar selamanya

**Contoh:** IPv4, IPv6, ICMP, ICMPv6, IPsec, routing protocol (OSPF, EIGRP, BGP, RIP), router, layer-3 switch, firewall (sebagian fungsinya).

**Perbedaan kunci L2 vs L3:**

| | Layer 2 (MAC) | Layer 3 (IP) |
|---|---|---|
| Alamat | Flat, tanpa struktur | Hierarkis (network + host) |
| Ditetapkan oleh | Pabrik (tertanam) | Administrator / DHCP |
| Jangkauan | Satu segmen (lokal) | Global |
| Bisa dirutekan? | Tidak | Ya |
| Berubah saat transit? | Ya, setiap hop | Tidak (kecuali NAT) |
| Analogi | Nama orang | Alamat rumah lengkap |

**Gejala masalah layer 3:**
```
- Salah IP address / subnet mask
- Default gateway salah atau tidak ada
- Route tidak ada / salah next hop
- Routing loop, asymmetric routing, black hole
- ACL memblokir paket
- MTU mismatch → paket besar hilang
- Duplikasi IP address
```

**Cek layer 3:**
```
$ ip addr show
$ ip route show
$ ping <gateway>
$ traceroute -n <tujuan>

R1# show ip route
R1# show ip interface brief
R1# ping 8.8.8.8 source gi0/1
```

---

## 6. Layer 4: Transport

**Tugas:** komunikasi **antar-proses** (bukan antar-host), dan menyediakan keandalan bila diperlukan.

Layer 3 mengantar paket ke *komputer* yang benar. Layer 4 mengantarnya ke *aplikasi* yang benar di komputer itu, lewat **port number**.

**Yang dilakukan layer 4:**
- **Multiplexing/demultiplexing** dengan port (banyak aplikasi berbagi satu IP)
- **Segmentasi** data besar menjadi potongan yang muat di paket
- **Keandalan** (TCP): pengurutan ulang, deteksi kehilangan, retransmisi
- **Flow control**: jangan kirim lebih cepat daripada kemampuan penerima
- **Congestion control**: jangan kirim lebih cepat daripada kemampuan jaringan

**Dua protokol utama:**

| | TCP | UDP |
|---|---|---|
| Koneksi | Connection-oriented (handshake) | Connectionless |
| Keandalan | Dijamin, ada retransmisi | Tidak dijamin |
| Urutan | Dijaga | Tidak dijaga |
| Overhead header | 20+ byte | 8 byte |
| Kecepatan | Lebih lambat | Lebih cepat |
| Untuk | Web, email, file transfer, SSH | VoIP, video streaming, DNS, game |
| Analogi | Surat tercatat | Kartu pos |

**Contoh protokol lain:** SCTP, DCCP, dan **QUIC**. QUIC secara teknis berjalan di atas UDP tetapi menyediakan fungsi layer 4 lengkap (dan sebagian layer 5-6).

**Gejala masalah layer 4:**
```
- Port diblokir firewall → koneksi timeout / connection refused
- Aplikasi tidak listening di port yang diharapkan
- NAT/PAT kehabisan port
- Window TCP terlalu kecil untuk BDP → lambat
- Retransmisi tinggi (terlihat di Wireshark)
```

**Cek layer 4:**
```
$ ss -tulnp                       ← apa yang listening
$ nc -zv host 443                 ← apakah port terbuka
$ curl -v telnet://host:443
$ tcpdump -ni any 'tcp port 443'
```

---

## 7. Layer 5: Session

**Tugas:** membuka, mengelola, dan menutup **sesi**, yaitu dialog berkelanjutan antar-aplikasi.

Layer ini paling "kabur" karena di TCP/IP fungsinya sering menyatu ke aplikasi atau transport.

**Yang dilakukan:**
- Membangun & mengakhiri sesi
- Dialog control (siapa bicara kapan: simplex/half/full duplex di tingkat sesi)
- **Checkpointing & recovery**: kalau transfer 10 GB putus di 7 GB, lanjutkan dari sana, bukan ulang dari nol
- Sinkronisasi

**Contoh:** NetBIOS session, RPC, PPTP, SOCKS, SIP (pensinyalan panggilan VoIP), NFS (bagian sesinya), TLS session resumption.

> [!TIP]
> Contoh paling mudah dipahami: **SIP** membuka dan menutup panggilan telepon; **RTP** (layer 4/7) membawa suaranya. SIP = session layer bekerja.

---

## 8. Layer 6: Presentation

**Tugas:** memastikan data yang dikirim bisa dimengerti penerima. Urusannya format, bukan pengantaran.

**Yang dilakukan:**
- **Translasi format**: ASCII ↔ EBCDIC, endianness, tipe data
- **Enkripsi/dekripsi**: TLS/SSL secara klasik ditempatkan di sini
- **Kompresi/dekompresi**
- **Serialisasi**: JSON, XML, Protocol Buffers

**Contoh:** TLS/SSL, JPEG, GIF, PNG, MPEG, ASCII, Unicode/UTF-8, JSON, XML, Base64, gzip.

> [!WARNING]
> Penempatan TLS di layer 6 adalah konvensi pengajaran. Dalam praktik TLS berjalan di atas TCP dan di bawah HTTP, sehingga beberapa orang menyebutnya "layer 6,5" atau sekadar "di antara 4 dan 7". Yang penting Anda paham fungsinya, bukan nomornya.

---

## 9. Layer 7: Application

**Tugas:** menyediakan antarmuka jaringan untuk aplikasi.

> [!WARNING]
> **Kesalahpahaman paling umum:** Layer 7 bukan aplikasinya sendiri. Chrome bukan layer 7. HTTP adalah layer 7; Chrome adalah program yang memakainya.

**Yang dilakukan:**
- Menyediakan layanan jaringan ke proses aplikasi
- Identifikasi partner komunikasi & ketersediaan sumber daya
- Sintaks pesan aplikasi

**Contoh:** HTTP/HTTPS, FTP, SFTP, SMTP, IMAP, POP3, DNS, DHCP, SNMP, Telnet, SSH, NTP, LDAP, SMB, RDP, MQTT, gRPC.

**Gejala masalah layer 7:**
```
- Sertifikat kedaluwarsa / nama tidak cocok
- HTTP 500 / 404 / 403
- DNS mengembalikan alamat salah
- Autentikasi gagal
- Versi protokol tidak kompatibel
- Aplikasi salah konfigurasi (padahal jaringan sehat)
```

---

## 10. Perangkat Beroperasi di Layer Berapa?

| Perangkat | Layer | Keputusan berdasarkan |
|---|---|---|
| Kabel, konektor, repeater, hub | **1** | Tidak ada; sekadar meneruskan sinyal |
| NIC, bridge, switch, access point | **2** | MAC address |
| Router, layer-3 switch | **3** | IP address |
| Firewall stateful | **3-4** | IP + port + state koneksi |
| NGFW / IPS | **3-7** | Termasuk isi aplikasi |
| Load balancer L4 | **4** | IP + port |
| Load balancer L7 / reverse proxy | **7** | URL, header, cookie |
| Proxy, WAF, API gateway | **7** | Isi aplikasi |

> [!WARNING]
> Perangkat "layer N" memahami layer 1 sampai N. Router memahami L1, L2, dan L3, karena ia harus membaca frame L2 dulu untuk sampai ke paket L3 di dalamnya.

---

## 11. OSI Sebagai Alat Troubleshooting

Ini penggunaan OSI yang paling bernilai di pekerjaan nyata.

### Pendekatan Bottom-Up (dari layer 1 naik)

Terbaik untuk masalah "tidak konek sama sekali" atau saat instalasi baru.

```
L1 → Lampu link nyala? Kabel benar? SFP terdeteksi?
     $ ip link show / show interfaces status
     ↓
L2 → Ada di VLAN yang benar? MAC terlihat? STP tidak memblok?
     $ show mac address-table / show vlan brief
     ↓
L3 → Punya IP? Gateway benar? Bisa ping gateway? Ada route?
     $ ip addr / ip route / ping gateway
     ↓
L4 → Port terbuka? Firewall mengizinkan?
     $ ss -tulnp / nc -zv host port
     ↓
L7 → Layanan berjalan? Sertifikat valid? DNS benar?
     $ curl -v / dig / systemctl status
```

### Pendekatan Top-Down (dari layer 7 turun)

Terbaik saat pengguna mengeluh "aplikasi X error" tetapi hal lain jalan.

```
L7 → Aplikasi lain jalan? Situs lain terbuka? Cek log aplikasi.
L4 → Bisa buka koneksi ke port itu? (nc/telnet)
L3 → Bisa ping IP tujuan? traceroute berhenti di mana?
L2 → Ada di VLAN benar?
L1 → (jarang, kalau sampai sini)
```

### Pendekatan Divide-and-Conquer

Mulai dari layer yang paling dicurigai (biasanya L3 dengan `ping`), lalu naik atau turun sesuai hasil.

```
ping 8.8.8.8 berhasil?
├── Ya  → L1–L3 sehat. Naik ke L4/L7. Kemungkinan besar DNS atau aplikasi.
└── Tidak → ping gateway berhasil?
    ├── Ya  → masalah di luar LAN: routing, ISP, firewall.
    └── Tidak → ping IP sendiri berhasil?
        ├── Ya  → masalah L2/L3 lokal: VLAN, subnet, ARP.
        └── Tidak → masalah di host sendiri: driver, TCP/IP stack.
```

### Contoh nyata: "Internet saya mati"

```
1. Lampu link di laptop nyala?              → L1
2. Dapat IP dari DHCP? (bukan 169.254.x.x)  → L2/L3 (DHCP butuh L2 sehat)
3. ping default gateway                     → L3 lokal
4. ping 8.8.8.8                             → L3 internet
5. ping google.com                          → DNS (L7)
6. curl -v https://google.com               → L4 + TLS + L7
```

Kalau langkah 4 berhasil tapi langkah 5 gagal: **masalah DNS**, bukan "internet mati". Ini diagnosis 30 detik yang membedakan teknisi dan penebak.

---

## 12. Batasan Model OSI di Dunia Nyata

Banyak pemula bingung karena diajarkan OSI sebagai kebenaran mutlak. Padahal model ini punya batasan:

1. **OSI adalah model referensi, bukan implementasi.** Protokol OSI yang sesungguhnya (X.25, CLNP, IS-IS asli) kalah dari TCP/IP. Yang bertahan adalah kosakatanya.

2. **Banyak protokol tidak muat rapi.**
   - ARP: L2 atau L3?
   - ICMP: berjalan di dalam IP (L3), tapi melaporkan hal-hal seperti protokol L4.
   - MPLS: sering disebut "layer 2,5".
   - TLS: antara L4 dan L7.
   - QUIC: L4 + L5 + L6 sekaligus, di atas UDP.

3. **Layer 5 dan 6 hampir tidak pernah dipakai terpisah** dalam percakapan sehari-hari. Praktisi biasanya bilang "layer 7" untuk semua yang di atas TCP.

4. **Enkapsulasi bertingkat merusak nomor layer.** VXLAN membawa frame Ethernet (L2) di dalam UDP (L4) di dalam IP (L3). Menanyakan "layer berapa itu?" tidak tepat, karena ada dua tumpukan, satu di dalam yang lain.

> [!TIP]
> **Sikap yang tepat:** OSI adalah bahasa bersama dan alat berpikir, bukan hukum fisika. Pakai ketika membantu; jangan berdebat soal nomor ketika tidak membantu.

---

## 13. Praktik: Melihat Semua Layer Sekaligus

```bash
$ sudo tcpdump -ni any -c 1 -vvv 'tcp port 443' -X
```

Contoh keluaran (disederhanakan):
```
14:22:01.123 IP (tos 0x0, ttl 64, id 12345, offset 0, flags [DF],
    proto TCP (6), length 60)
    192.168.1.50.51234 > 142.250.190.78.443: Flags [S], seq 1234567,
    win 64240, options [mss 1460,sackOK,TS,nop,wscale 7], length 0
```

Baca per layer:
- **L2**: `-i any` menyembunyikannya; pakai `-e` untuk melihat MAC.
- **L3**: `IP ... ttl 64 ... proto TCP` → header IPv4, TTL, protokol berikutnya.
- **L4**: `.51234 > .443: Flags [S]` → port sumber, port tujuan, flag SYN.
- **L7**: belum ada; ini baru handshake TCP.

Dengan Wireshark, panel tengah menampilkan pohon layer secara eksplisit:
```
▶ Frame 1: 74 bytes on wire                    ← metadata capture
▶ Ethernet II, Src: .., Dst: ..                ← LAYER 2
▶ Internet Protocol Version 4, Src: .., Dst: .. ← LAYER 3
▶ Transmission Control Protocol, Src Port: ..   ← LAYER 4
▶ Transport Layer Security                      ← LAYER 6
▶ Hypertext Transfer Protocol                   ← LAYER 7
```

Lakukan ini sekarang. Melihat layer secara visual satu kali lebih berharga daripada membaca sepuluh halaman teori.

---

## 14. Kesalahan Umum

> [!WARNING]
> **1. Menghafal nama tanpa fungsi.** Yang ditanya di pekerjaan bukan "layer 4 apa?", tapi "kenapa koneksi ini timeout?".

> [!WARNING]
> **2. Mengira aplikasi = layer 7.** Chrome bukan layer 7; HTTP layer 7.

> [!WARNING]
> **3. Mengira switch tidak bisa layer 3.** Multilayer switch melakukan routing dengan ASIC, sering lebih cepat daripada router.

> [!WARNING]
> **4. Berdebat soal layer ARP/ICMP/MPLS.** Tidak produktif. Pahami fungsinya.

> [!WARNING]
> **5. Melompat ke layer atas terlalu cepat.** Sebelum menganalisis TLS, pastikan kabelnya tertancap.

> [!WARNING]
> **6. Mengira OSI = TCP/IP.** Berbeda. Dibahas di modul berikutnya.

---

## 15. Ringkasan

- OSI punya 7 layer: Physical, Data Link, Network, Transport, Session, Presentation, Application.
- PDU: bit → frame → packet → segment/datagram → data.
- L2 = MAC, lokal, berubah tiap hop. L3 = IP, global, tetap ujung ke ujung.
- L4 = port, membedakan aplikasi; TCP andal, UDP cepat.
- L5-L6 jarang dibicarakan terpisah di praktik; L7 = protokol aplikasi, bukan aplikasi.
- Switch = L2, router = L3, firewall = L3-L7.
- Manfaat terbesar OSI = kerangka troubleshooting: bottom-up, top-down, divide-and-conquer.
- OSI adalah model, bukan kenyataan mutlak. Pakai saat membantu.

---

## 16. Latihan

1. Sebutkan PDU untuk setiap layer 1-4.
2. Di layer berapa masing-masing bekerja: HTTPS, ARP, EtherChannel, BGP, RJ45, DNS, MAC address, TLS, OSPF, QUIC?
3. Pengguna bisa `ping 8.8.8.8` tetapi tidak bisa membuka situs apa pun. Layer berapa yang paling mungkin bermasalah, dan apa perintah pertama Anda?
4. Kenapa MAC address tujuan berubah di setiap hop, sedangkan IP address tujuan tidak?
5. Sebuah switch access mem-`shutdown` port karena port security. Layer berapa itu, dan bagaimana gejalanya bagi pengguna?
6. Jelaskan perbedaan troubleshooting bottom-up dan top-down, serta kapan memilih masing-masing.

<details>
<summary>Jawaban</summary>

1. L1 = **bit**; L2 = **frame**; L3 = **packet**; L4 = **segment** (TCP) atau **datagram** (UDP).

2. HTTPS = **7** (dengan TLS di 6); ARP = **2** (menjembatani ke 3); EtherChannel = **2** (bisa juga L3 EtherChannel); BGP = **7** untuk pesannya (berjalan di atas TCP 179) tetapi fungsinya routing **L3** (di ujian biasanya dijawab "protokol routing L3"); RJ45 = **1**; DNS = **7**; MAC address = **2**; TLS = **6** (konvensi); OSPF = **3** (langsung di atas IP, protokol 89); QUIC = **4** (di atas UDP, juga menjalankan fungsi 5-6).

3. **Layer 7, kemungkinan besar DNS.** Ping ke IP berhasil berarti L1-L3 sehat. Perintah pertama: `dig google.com` atau `nslookup google.com`. Kalau resolusi gagal → periksa server DNS di `/etc/resolv.conf` atau setelan DHCP. Kalau resolusi berhasil, lanjut `curl -v https://google.com` untuk memeriksa L4/TLS.

4. Karena MAC address hanya bermakna **dalam satu segmen L2**. Router membuang header L2 lama dan membuat header L2 baru untuk segmen berikutnya, dengan MAC sumber = interface router itu dan MAC tujuan = next hop. IP address adalah pengalamatan **ujung ke ujung**, jadi tetap sama sepanjang jalur (kecuali dilewatkan NAT, yang memang sengaja mengubahnya).

5. **Layer 2** (port security bekerja berdasarkan MAC address). Gejala bagi pengguna: koneksi mati total, lampu link bisa mati (err-disabled). Cek dengan `show interfaces status err-disabled` dan `show port-security interface`.

6. **Bottom-up**: mulai dari L1 naik. Dipakai saat tidak ada konektivitas sama sekali, instalasi baru, atau setelah perubahan fisik, karena kemungkinan besar penyebabnya di lapisan bawah. **Top-down**: mulai dari L7 turun. Dipakai saat sebagian besar hal berjalan normal dan hanya satu aplikasi bermasalah. Tidak masuk akal memeriksa kabel kalau aplikasi lain di komputer yang sama berfungsi.

</details>

---

## 17. Sumber

- ISO/IEC 7498-1, Basic Reference Model: The Basic Model
- RFC 1122 & 1123: Requirements for Internet Hosts (perspektif TCP/IP)
- Cisco CCNA 200-301 v1.1, topik 1.1 & 1.13
- Wireshark User's Guide: https://www.wireshark.org/docs/

---

**Berikutnya:** `01-model-referensi/02-tcp-ip.md`. Model yang benar-benar dipakai internet.

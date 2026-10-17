# 19.6 MikroTik: VPN & Tunneling

> **Prasyarat:** `19-mikrotik/03` (firewall/NAT), `11-wan-vpn/02` (tunneling & VPN), `12-keamanan/04` (RADIUS)
> **Tujuan:** Anda bisa mengonfigurasi PPPoE (server & client), IPsec, WireGuard, dan EoIP di RouterOS untuk kebutuhan ISP dan interkoneksi situs.

---

## 1. PPPoE: Inti Layanan ISP

**PPPoE (PPP over Ethernet)** adalah cara paling umum ISP mengautentikasi & mengelola pelanggan. Setiap pelanggan "dial" dengan username/password; ISP memberi IP dan menerapkan profil bandwidth.

### PPPoE Server (sisi ISP)
```routeros
# 1. IP pool untuk pelanggan
/ip pool add name=pool-pppoe ranges=10.10.0.2-10.10.0.254

# 2. PPP profile — pengaturan per-paket (bandwidth, DNS, dll)
/ppp profile
add name=paket-10mbps local-address=10.10.0.1 remote-address=pool-pppoe \
    rate-limit=3M/10M dns-server=10.10.0.1

# 3. PPPoE server di interface ke pelanggan
/interface pppoe-server server
add service-name=ISP interface=ether2 default-profile=paket-10mbps \
    authentication=pap,chap disabled=no

# 4. Buat akun pelanggan (secret)
/ppp secret
add name=pelanggan01 password=rahasia service=pppoe profile=paket-10mbps
```

> [!TIP]
> **`rate-limit` di PPP profile** otomatis menerapkan batas bandwidth ke pelanggan saat mereka terhubung, sehingga tidak perlu queue manual per-pelanggan. Untuk mengganti paket pelanggan, cukup ubah profilnya. Ini cara standar RT-RW-Net/ISP mengelola langganan.

### PPPoE Client (sisi pelanggan / router yang berlangganan)
```routeros
/interface pppoe-client
add name=pppoe-out1 interface=ether1 user=pelanggan01 \
    password=rahasia add-default-route=yes use-peer-dns=yes disabled=no
```

> [!WARNING]
> **Integrasi RADIUS** untuk skala besar: alih-alih `/ppp secret` lokal (terbatas & repot untuk ratusan pelanggan), arahkan autentikasi PPPoE ke **RADIUS server** (mis. dengan billing system seperti FreeRADIUS + aplikasi billing). Manajemen pelanggan, paket, dan penagihan jadi terpusat. Lihat `12-keamanan/04`.

---

## 2. IPsec: Site-to-Site VPN Aman

**IPsec** mengenkripsi trafik antar-situs melintasi internet (lihat `11-wan-vpn/02` untuk konsep IKE/ESP).

```routeros
# Contoh site-to-site sederhana (IKEv2)
# 1. Peer (gateway remote)
/ip ipsec peer
add name=situs-B address=203.0.113.2 exchange-mode=ike2 \
    profile=default

# 2. Identity (autentikasi — pre-shared key)
/ip ipsec identity
add peer=situs-B auth-method=pre-shared-key secret="kuncibersamayangkuat"

# 3. Policy — trafik mana yang dienkripsi (LAN A ↔ LAN B)
/ip ipsec policy
add peer=situs-B src-address=192.168.1.0/24 dst-address=192.168.2.0/24 \
    tunnel=yes proposal=default
```

> [!WARNING]
> **IPsec + NAT sering bentrok.** Bila trafik VPN juga terkena aturan masquerade, ia akan di-NAT sebelum dienkripsi → gagal. **Kecualikan trafik VPN dari NAT** dengan aturan `accept` di srcnat sebelum masquerade:
```routeros
/ip firewall nat
add chain=srcnat dst-address=192.168.2.0/24 action=accept  # SEBELUM masquerade
add chain=srcnat out-interface=ether1-wan action=masquerade
```
Ini kesalahan paling umum saat setup IPsec di MikroTik. Lihat `09-nat-acl-firewall/01` (interaksi NAT).

---

## 3. WireGuard: VPN Modern

**WireGuard** (didukung RouterOS v7+) adalah VPN modern yang cepat, sederhana, dan berkriptografi kuat (lihat `11-wan-vpn/02`).

```routeros
# 1. Buat interface WireGuard (generate key otomatis)
/interface wireguard add name=wg1 listen-port=13231
/interface wireguard print   # lihat public-key untuk dibagikan ke peer

# 2. Beri IP tunnel
/ip address add address=10.99.0.1/24 interface=wg1

# 3. Tambah peer (masukkan public-key peer & allowed-address)
/interface wireguard peers
add interface=wg1 public-key="PUBKEY_PEER..." \
    allowed-address=10.99.0.2/32,192.168.2.0/24 \
    endpoint-address=203.0.113.2 endpoint-port=13231
```

> [!TIP]
> **WireGuard jauh lebih sederhana dari IPsec**: konfigurasi minimal (interface + peer + key), performa tinggi, dan cocok untuk remote access maupun site-to-site. WireGuard semakin dipilih untuk deployment baru di RouterOS v7. Hati-hati: buka port UDP WireGuard (`listen-port`) di firewall `input`, dan pastikan `allowed-address` mencakup subnet yang ingin dijangkau lewat tunnel.

---

## 4. EoIP: Ethernet over IP (Bridging Antar-Situs)

**EoIP (Ethernet over IP)** adalah tunnel proprietary MikroTik yang membawa Layer 2 (Ethernet) melintasi jaringan L3, mirip konsep VXLAN mini (lihat `16-datacenter-cloud-sdn/02` untuk overlay L2).

```routeros
/interface eoip
add name=eoip-B remote-address=203.0.113.2 tunnel-id=100
# Lalu bridge eoip-B dengan LAN lokal → dua situs jadi satu L2 domain
/interface bridge port add bridge=bridge1 interface=eoip-B
```

> [!TIP]
> **EoIP membuat dua situs berada di broadcast domain L2 yang sama** melintasi internet. Ini berguna untuk aplikasi yang butuh L2 tembus (mis. bridging jaringan cabang). Hati-hati: EoIP tidak terenkripsi sendiri, jadi kombinasikan dengan IPsec (EoIP over IPsec) untuk keamanan. Waspadai juga risiko membentangkan broadcast domain besar antar-situs (broadcast/loop bisa menyeberang).

**Tunnel lain:** GRE (`/interface gre`, standar & interoperabel), IPIP, PPTP/L2TP/SSTP/OVPN (untuk remote access; L2TP+IPsec umum untuk klien).

---

## 5. Panduan Memilih

| Kebutuhan | Pilihan | Catatan |
|---|---|---|
| Autentikasi & kelola pelanggan ISP | **PPPoE** (+RADIUS) | inti bisnis ISP/RT-RW-Net |
| Site-to-site aman, interoperabel | **IPsec** | standar; hati-hati NAT |
| Site-to-site/remote modern, cepat | **WireGuard** | v7+, paling sederhana |
| Bridging L2 antar-situs (MikroTik) | **EoIP** (+IPsec) | proprietary, enkripsi terpisah |
| Site-to-site interoperabel non-enkripsi | **GRE** (+IPsec) | standar |
| Remote access klien (Windows dll) | **L2TP/IPsec, SSTP, OVPN** | dukungan klien luas |

> [!WARNING]
> **PPTP sudah tidak aman** (enkripsi MPPE lemah). Hindari untuk data sensitif; gunakan L2TP/IPsec, SSTP, OpenVPN, atau WireGuard.

---

## 6. Tabel Padanan

| Fungsi | Cisco | MikroTik | Linux |
|---|---|---|---|
| Autentikasi pelanggan | (BRAS/PPPoE) | **PPPoE server** + PPP secret/RADIUS | accel-ppp |
| Site-to-site enkripsi | crypto map / IKEv2 | **IPsec** peer/identity/policy | strongSwan |
| VPN modern | (FlexVPN) | **WireGuard** | wireguard |
| Tunnel L2 | L2TPv3 / VXLAN | **EoIP** | VXLAN/L2TPv3 |
| Tunnel L3 sederhana | GRE | **GRE** | ip tunnel gre |
| Kecualikan VPN dari NAT | `nat ... deny` / route-map | srcnat `accept` sebelum masquerade | -j ACCEPT sebelum MASQUERADE |

---

## 7. Ringkasan

- **PPPoE** = inti ISP: **server** (IP pool + PPP profile dengan `rate-limit` + secret/RADIUS) mengautentikasi & memberi bandwidth per-pelanggan; **client** di sisi pelanggan. Skala besar → **RADIUS + billing**.
- **IPsec** = site-to-site aman (peer + identity + policy). Kecualikan trafik VPN dari NAT (accept sebelum masquerade); lupa melakukannya adalah kesalahan tersering.
- **WireGuard** (v7+) = VPN modern, sederhana, cepat (interface + peer + key). Buka port UDP di firewall.
- **EoIP** = bridging L2 antar-situs (proprietary MikroTik); tidak terenkripsi → gabung IPsec. GRE = L3 standar.
- **PPTP tidak aman**: pakai L2TP/IPsec, SSTP, OVPN, atau WireGuard untuk remote access.

---

## 8. Latihan

1. Bagaimana PPPoE server menerapkan batas bandwidth pelanggan secara otomatis, dan kenapa RADIUS dipakai pada skala besar?
2. Kenapa trafik IPsec site-to-site harus dikecualikan dari NAT, dan bagaimana melakukannya?
3. Sebutkan keunggulan WireGuard dibanding IPsec.
4. Apa itu EoIP, kapan dipakai, dan apa peringatan keamanannya?
5. Kenapa PPTP sebaiknya dihindari, dan apa alternatifnya?

<details>
<summary>Jawaban</summary>

1. PPPoE server menerapkan batas bandwidth otomatis melalui **PPP profile**: setiap profil memiliki parameter **`rate-limit`** (format upload/download), dan setiap pelanggan (PPP secret) ditautkan ke sebuah profil sesuai paket langganannya. Ketika pelanggan terhubung/dial ke PPPoE server, RouterOS otomatis menerapkan `rate-limit` dari profil mereka pada sesi tersebut (membuat queue dinamis di belakang layar), sehingga tidak perlu membuat simple queue manual per-pelanggan. Mengubah paket pelanggan cukup dengan memindahkan mereka ke profil lain. **RADIUS dipakai pada skala besar** karena mengelola ratusan/ribuan pelanggan lewat `/ppp secret` lokal di router menjadi tidak praktis (sulit dikelola, tidak terpusat, tidak ada penagihan). Dengan mengarahkan autentikasi PPPoE ke **server RADIUS** (sering terintegrasi dengan sistem billing/manajemen pelanggan seperti FreeRADIUS + aplikasi billing), ISP mendapat: manajemen pelanggan terpusat (tambah/hapus/ubah paket dari satu sistem), penerapan atribut (bandwidth, IP, masa aktif) via RADIUS, penagihan otomatis, akuntansi penggunaan (accounting), dan kemampuan mengelola banyak router NAS sekaligus. Lihat `12-keamanan/04`.

2. Karena urutan operasi: jika trafik VPN (mis. dari LAN A `192.168.1.0/24` menuju LAN B `192.168.2.0/24`) terkena aturan masquerade/src-nat sebelum diproses IPsec, alamat sumbernya diubah menjadi IP publik router terlebih dahulu. Akibatnya, saat IPsec memeriksa policy (yang mengharapkan src `192.168.1.0/24`), trafik sudah tidak cocok dengan policy (sumbernya kini IP publik), sehingga tidak dienkripsi/tidak masuk tunnel dan VPN gagal, atau trafik keluar ter-NAT dan sisi remote tidak mengenalinya. **Solusinya: kecualikan trafik VPN dari NAT** dengan menempatkan aturan `accept` di chain srcnat **sebelum** aturan masquerade, yang mencocokkan trafik antar-LAN VPN:
   ```routeros
   /ip firewall nat
   add chain=srcnat dst-address=192.168.2.0/24 src-address=192.168.1.0/24 action=accept
   add chain=srcnat out-interface=ether1-wan action=masquerade
   ```
   Karena aturan diproses berurutan (`19.3`), trafik VPN cocok aturan `accept` lebih dulu (tidak di-NAT, alamat asli dipertahankan) sehingga IPsec policy cocok dan mengenkripsinya; trafik internet biasa lanjut ke masquerade. Ini kesalahan tersering saat setup IPsec di MikroTik.

3. Keunggulan WireGuard dibanding IPsec: **(a) Kesederhanaan**: konfigurasi WireGuard minimal (buat interface, beri IP, tambah peer dengan public-key dan allowed-address), sedangkan IPsec memerlukan konfigurasi peer, identity, proposal, dan policy yang lebih kompleks dan rawan salah (mis. mismatch proposal, masalah NAT). **(b) Performa**: WireGuard umumnya lebih cepat dengan overhead lebih rendah, memakai kriptografi modern yang efisien. **(c) Kriptografi modern dan tetap**: WireGuard memakai set algoritma modern terkini (Curve25519, ChaCha20-Poly1305) tanpa negosiasi rumit, mengurangi kesalahan konfigurasi dan permukaan serang. **(d) Basis kode kecil**: lebih mudah diaudit, lebih sedikit bug/celah. **(e) Roaming/mobilitas** yang baik (koneksi bertahan saat IP klien berubah). **(f) Model peer sederhana** yang enak untuk hub-spoke maupun mesh. Karena itu WireGuard semakin dipilih untuk deployment baru di RouterOS v7+. (IPsec tetap unggul dalam **interoperabilitas** dengan perangkat non-MikroTik/vendor lain dan lingkungan yang mewajibkan IPsec.)

4. **EoIP (Ethernet over IP)** adalah tunnel proprietary MikroTik yang membawa frame Layer 2 (Ethernet) melintasi jaringan Layer 3 (internet/WAN), sehingga secara efektif memperluas satu broadcast domain L2 ke dua lokasi yang terpisah secara geografis. **Kapan dipakai:** ketika Anda butuh dua situs berada di segmen L2 yang sama melintasi internet, misalnya mem-bridge jaringan kantor cabang agar tampak satu LAN, atau aplikasi/protokol yang mengharuskan konektivitas L2 (broadcast, non-IP). Anda mem-bridge interface EoIP dengan LAN lokal di kedua sisi. **Peringatan keamanan:** EoIP tidak terenkripsi dengan sendirinya. Trafik melintas apa adanya melalui internet sehingga bisa disadap, jadi harus dikombinasikan dengan IPsec (EoIP over IPsec) bila melewati jaringan tidak tepercaya. Peringatan tambahan: membentangkan broadcast domain L2 besar antar-situs berisiko, karena broadcast storm dan loop bisa menyeberang ke kedua situs. Gunakan dengan hati-hati (STP, batasi ukuran domain) dan hanya bila L2 benar-benar diperlukan (seringkali VPN L3 seperti IPsec/WireGuard lebih aman dan cukup).

5. **PPTP sebaiknya dihindari** karena enkripsinya lemah dan sudah dapat dibobol: PPTP mengandalkan MPPE dengan autentikasi MS-CHAPv2 yang memiliki kerentanan kriptografi serius. MS-CHAPv2 dapat dipecahkan (serangan terhadap DES/hash-nya membuat kunci dapat dipulihkan secara praktis), sehingga trafik PPTP dapat didekripsi oleh penyerang yang menangkapnya. Ia tidak lagi memberikan kerahasiaan yang memadai untuk data sensitif. **Alternatifnya:** **L2TP/IPsec** (L2TP untuk tunnel + IPsec untuk enkripsi kuat, dukungan klien luas termasuk Windows/macOS/mobile bawaan), **SSTP** (VPN over TLS, baik untuk menembus firewall karena memakai port 443, terintegrasi di Windows), **OpenVPN (OVPN)** (TLS-based, fleksibel dan aman, lintas platform), atau **WireGuard** (modern, cepat, aman; pilihan terbaik untuk deployment baru di RouterOS v7+). Untuk remote access klien, L2TP/IPsec atau SSTP umum karena dukungan klien bawaan; untuk site-to-site atau klien modern, WireGuard sangat dianjurkan.

</details>

---

## 9. Sumber

- MikroTik documentation: PPPoE, IPsec, WireGuard, EoIP, Interfaces (help.mikrotik.com)
- MTCNA outline: Tunnels · MTCUME (PPP/user management) · MTCRE (tunnel lanjutan)
- `11-wan-vpn/02` (tunneling & VPN) · `12-keamanan/04` (RADIUS) · `09-nat-acl-firewall/01` (NAT)

---

**Berikutnya:** `19-mikrotik/07-monitoring-scripting.md`. Monitoring, tools, dan scripting/otomasi RouterOS.

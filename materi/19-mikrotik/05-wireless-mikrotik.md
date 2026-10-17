# 19.5 MikroTik: Wireless (CAPsMAN & Konfigurasi)

> **Prasyarat:** `19-mikrotik/01-02`, `10-wireless/01-04` (RF, 802.11, keamanan, desain)
> **Tujuan:** Anda bisa mengonfigurasi wireless RouterOS (AP, station, security profile), memahami CAPsMAN untuk manajemen AP terpusat, dan mode wireless untuk skenario PTP/PTMP (backhaul ISP).

---

## 1. Wireless di RouterOS

RouterOS mendukung berbagai mode wireless. Perhatikan: ada dua "generasi" paket wireless:
- **paket `wireless`** (lama, tetapi masih luas dipakai; mendukung fitur khas MikroTik seperti Nstreme/Nv2).
- **paket `wifiwave2` / `wifi`** (baru, untuk perangkat Wi-Fi 5/6, konfigurasi berbeda).

> [!WARNING]
> **Perintah berbeda antara paket lama (`/interface wireless`) dan baru (`/interface wifi`).** Cek perangkat & RouterOS Anda. Modul ini memakai contoh paket `wireless` klasik (paling umum di lapangan ISP); konsepnya serupa di `wifi`.

```routeros
# Lihat interface wireless
/interface wireless print
```

---

## 2. Mode Wireless

```
ap-bridge      → Access Point (melayani banyak klien) — hotspot/wifi kantor
station        → klien (menyambung ke AP lain)
station-bridge → klien yang mendukung bridging transparan (khusus MikroTik-MikroTik)
bridge         → AP untuk SATU klien (point-to-point sederhana)
```

**Skenario khas ISP:**
```
PTP (Point-to-Point) backhaul:
   [AP: bridge/ap-bridge] ←── link nirkabel ──→ [station-bridge]
   Menghubungkan dua lokasi (mis. tower ke pelanggan jauh)

PTMP (Point-to-Multipoint):
   [AP: ap-bridge] ← melayani banyak → [station] [station] [station]
   Satu tower melayani banyak pelanggan (WISP)
```

> [!TIP]
> **station-bridge** memungkinkan bridging L2 transparan pada sisi klien (hanya antar-perangkat MikroTik) — penting untuk backhaul WISP di mana Anda ingin L2 tembus. Untuk klien non-MikroTik, keterbatasan bridging pada mode `station` biasa (karena wireless station standar tidak bisa mem-bridge banyak MAC) diatasi dengan station-bridge atau fitur seperti EoIP.

---

## 3. Konfigurasi AP Dasar

```routeros
# Security profile (WPA2)
/interface wireless security-profiles
add name=aman mode=dynamic-keys authentication-types=wpa2-psk \
    wpa2-pre-shared-key="passwordkuat123"

# Konfigurasi interface sebagai AP
/interface wireless
set wlan1 mode=ap-bridge ssid="WiFi-Kantor" band=2ghz-b/g/n \
    frequency=2412 channel-width=20mhz \
    security-profile=aman disabled=no

# Masukkan wlan1 ke bridge LAN agar klien dapat IP dari DHCP LAN
/interface bridge port add bridge=bridge1 interface=wlan1
```

> [!WARNING]
> **Pilih frekuensi/kanal non-overlap** (2.4 GHz: 1/6/11 → 2412/2437/2462 MHz) untuk menghindari interferensi — konsep dari `10-wireless/01`. Gunakan **frequency scan** dan **spectral scan** RouterOS untuk melihat kanal yang ramai sebelum memilih.

> [!TIP]
> **`band`** menentukan standar & pita (mis. `2ghz-b/g/n`, `5ghz-a/n/ac`). Sesuaikan dengan perangkat dan kebutuhan. Untuk banyak klien, 5 GHz (lebih banyak kanal non-overlap, lebih sedikit interferensi) lebih baik bila jangkauan mencukupi.

---

## 4. Security Profile

```routeros
/interface wireless security-profiles
# WPA2-PSK (paling umum)
add name=wpa2 mode=dynamic-keys authentication-types=wpa2-psk \
    wpa2-pre-shared-key="rahasia123"

# WPA2/WPA3 mixed (perangkat baru)
add name=wpa2-3 mode=dynamic-keys \
    authentication-types=wpa2-psk,wpa3-psk \
    wpa2-pre-shared-key="rahasia123" wpa3-pre-shared-key="rahasia123"

# WPA2-Enterprise (802.1X via RADIUS) untuk korporat
add name=ent mode=dynamic-keys authentication-types=wpa2-eap \
    eap-methods=passthrough    # RADIUS menangani autentikasi
```

Konsep keamanan (WPA2/WPA3, SAE, 802.1X/EAP) dijelaskan di `10-wireless/03`. ⚠️ **Jangan pakai WEP** (usang, mudah dibobol) dan hindari WPA/TKIP; gunakan minimal **WPA2-PSK (AES/CCMP)**, idealnya **WPA3** bila perangkat mendukung.

---

## 5. CAPsMAN: Manajemen AP Terpusat

**CAPsMAN (Controlled Access Point system Manager)** memusatkan manajemen banyak AP MikroTik dari satu controller — setara konsep **WLC** (`10-wireless/04`).

```
Tanpa CAPsMAN: konfigurasi tiap AP satu per satu (repot, tidak konsisten)
Dengan CAPsMAN:  1 controller → semua AP (CAP) ambil konfigurasi terpusat
```

```routeros
# Di controller (manager)
/caps-man manager set enabled=yes
/caps-man configuration
add name=cfg1 ssid="WiFi-Perusahaan" security.authentication-types=wpa2-psk \
    security.passphrase="rahasia123" datapath.bridge=bridge1
/caps-man provisioning
add action=create-dynamic-enabled master-configuration=cfg1

# Di AP (CAP) — jadikan controlled
/interface wireless cap
set enabled=yes interfaces=wlan1 discovery-interfaces=bridge1 \
    caps-man-addresses=192.168.1.1
```

> [!TIP]
> **CAPsMAN = WLC-nya MikroTik.** AP menjadi "CAP" (Controlled AP) yang mengambil konfigurasi (SSID, security, channel) dari controller terpusat — memudahkan mengelola puluhan AP secara konsisten, mendukung roaming, dan channel management otomatis. Untuk deployment banyak AP (hotel, kampus, kantor besar), CAPsMAN sangat menghemat kerja. (Paket `wifi` baru punya padanannya sendiri.)

> [!WARNING]
> **Datapath**: putuskan apakah trafik klien di-forward lokal di AP (**local forwarding**) atau di-tunnel ke controller (**central forwarding**) — pilihan yang sama seperti CAPWAP local/central switching di `10-wireless/04`. Local forwarding lebih efisien untuk trafik lokal; central untuk kebijakan terpusat.

---

## 6. Fitur Wireless Khas MikroTik (ISP)

```
Nstreme     → protokol proprietary MikroTik untuk PTP jarak jauh (polling)
Nv2 (NV2)   → TDMA-based, lebih baik untuk PTMP (banyak klien), kurangi
              masalah "hidden node", latensi lebih konsisten
Nstreme dual→ dua antena/radio untuk full-duplex PTP jarak jauh
```

> [!TIP]
> **Nv2 (TDMA)** dirancang MikroTik untuk **PTMP WISP** — memakai time-division (bukan CSMA/CA 802.11 biasa) sehingga mengurangi tabrakan dan masalah hidden node saat satu tower melayani banyak pelanggan berjauhan. ⚠️ Nstreme/Nv2 **hanya bekerja antar-perangkat MikroTik** (proprietary) — tidak kompatibel dengan klien Wi-Fi standar.

> [!WARNING]
> **Regulasi frekuensi**: daya pancar dan kanal yang boleh dipakai (terutama 5 GHz) **diatur** (di Indonesia oleh Komdigi/Kominfo — lihat `10-wireless/03`). Untuk link outdoor/WISP, patuhi batas daya dan alokasi frekuensi yang diizinkan; frekuensi tertentu perlu izin. Jangan melebihi EIRP yang diizinkan.

---

## 7. Tabel Padanan

| Konsep | Cisco | MikroTik | Catatan |
|---|---|---|---|
| Controller AP | WLC | **CAPsMAN** | manajemen terpusat |
| AP terkelola | LAP/CAPWAP AP | **CAP** | Controlled AP |
| Central/local switching | CAPWAP local/central | datapath (local/central forwarding) | pilihan sama |
| SSID + security | WLAN profile | security-profile + config | |
| WPA2-Ent (802.1X) | WPA2-Enterprise | `wpa2-eap` + RADIUS | `12-keamanan/04` |
| PTMP khusus | (Wi-Fi standar) | **Nv2 (TDMA)** | proprietary MikroTik |

---

## 8. Ringkasan

- RouterOS punya paket wireless **lama (`/interface wireless`)** dan **baru (`/interface wifi`/wifiwave2)** — perintah berbeda; cek perangkat.
- Mode: **ap-bridge** (AP banyak klien), **station**/**station-bridge** (klien; station-bridge untuk L2 transparan MikroTik), **bridge** (PTP). Skenario ISP: **PTP** (backhaul) & **PTMP** (WISP).
- **Security profile**: gunakan minimal **WPA2-PSK (AES)**, idealnya **WPA3**; **WPA2-EAP** untuk 802.1X/RADIUS. ⚠️ Jangan WEP/TKIP.
- Pilih **kanal non-overlap** (1/6/11 di 2.4 GHz); pakai frequency/spectral scan.
- **CAPsMAN** = WLC MikroTik: AP jadi **CAP** ambil konfigurasi terpusat; pilih **local vs central forwarding** (datapath).
- Fitur ISP: **Nstreme** (PTP), **Nv2/TDMA** (PTMP, kurangi hidden node) — **proprietary, antar-MikroTik saja**.
- **Perhatian:** Patuhi **regulasi frekuensi & daya** (Komdigi/Kominfo) untuk link outdoor/WISP.

---

## 9. Latihan

1. Apa perbedaan mode `ap-bridge`, `station`, dan `station-bridge`?
2. Kenapa `station-bridge` diperlukan untuk backhaul WISP MikroTik-ke-MikroTik?
3. Apa itu CAPsMAN dan konsep Cisco apa yang setara?
4. Kapan Nv2 lebih baik daripada 802.11 standar, dan apa keterbatasannya?
5. Sebutkan tiga pertimbangan keamanan dan regulasi saat membangun link wireless ISP outdoor.

<details>
<summary>Jawaban</summary>

1. **`ap-bridge`**: interface berperan sebagai **Access Point yang melayani banyak klien** sekaligus (mode AP penuh) — dipakai untuk WiFi kantor, hotspot, atau tower PTMP yang melayani banyak pelanggan. **`station`**: interface berperan sebagai **klien** yang menyambung ke sebuah AP lain (seperti laptop yang connect ke WiFi) — ia menerima IP/akses dari AP tersebut. **`station-bridge`**: seperti station (klien), tetapi mendukung **bridging L2 transparan** — memungkinkan perangkat/jaringan di belakang station diteruskan secara transparan di Layer 2 melintasi link wireless (hanya bekerja antar-perangkat MikroTik). Tambahan: `bridge` adalah mode AP untuk **satu** klien saja (PTP sederhana). Ringkasnya: `ap-bridge` = AP untuk banyak, `station` = klien biasa (routing/NAT di belakangnya), `station-bridge` = klien dengan L2 tembus.

2. Karena pada backhaul WISP, Anda sering ingin **memperluas jaringan Layer 2 secara transparan** melintasi link wireless — misalnya agar perangkat di sisi pelanggan berada di broadcast domain/VLAN yang sama dengan sisi tower, atau agar banyak MAC address di belakang station bisa tembus. **Mode `station` biasa tidak bisa mem-bridge banyak MAC** karena keterbatasan standar wireless: sebuah station 802.11 pada dasarnya mewakili **satu** MAC ke AP, sehingga tidak bisa secara transparan meneruskan frame dari banyak perangkat di belakangnya (masalah "4-address" pada WDS/bridging wireless standar). **`station-bridge`** adalah solusi MikroTik yang memungkinkan **bridging L2 transparan pada sisi klien** — semua perangkat di belakang station bisa "terlihat" melintasi link seolah terhubung langsung — sehingga cocok untuk backhaul yang membutuhkan L2 tembus. Keterbatasannya: ini **proprietary**, jadi kedua ujung (AP dan station) harus **sama-sama MikroTik**.

3. **CAPsMAN (Controlled Access Point system Manager)** adalah sistem manajemen AP **terpusat** MikroTik: satu perangkat berperan sebagai **controller/manager** yang menyimpan konfigurasi (SSID, security, channel, datapath), dan AP-AP menjadi **CAP (Controlled AP)** yang mengambil konfigurasi dari controller alih-alih dikonfigurasi satu per satu. Ini setara dengan **Wireless LAN Controller (WLC)** di dunia Cisco (`10-wireless/04`) — di mana AP menjadi lightweight/CAPWAP AP yang dikelola WLC. Keduanya memecahkan masalah yang sama: mengelola banyak AP secara **konsisten dan terpusat** (perubahan sekali → berlaku ke semua AP), mendukung roaming, dan manajemen channel/daya otomatis. Bahkan pilihan **local vs central forwarding** di CAPsMAN datapath setara dengan **local vs central switching** CAPWAP.

4. **Nv2 (TDMA — Time Division Multiple Access)** lebih baik daripada 802.11 standar (yang memakai CSMA/CA) pada skenario **PTMP (Point-to-Multipoint) jarak jauh dengan banyak klien**, seperti tower WISP yang melayani banyak pelanggan yang berjauhan. Alasannya: 802.11 CSMA/CA mengandalkan perangkat "mendengar" sebelum mengirim, tetapi pada PTMP jarak jauh muncul masalah **hidden node** (dua pelanggan di sisi berlawanan tower tidak bisa saling mendengar, sehingga bertabrakan di AP), yang menurunkan throughput drastis. **Nv2 memakai penjadwalan waktu (TDMA)** — AP mengalokasikan slot waktu untuk tiap klien, sehingga **tidak ada tabrakan**, latensi lebih konsisten, dan efisiensi jauh lebih baik saat banyak klien/jarak jauh. **Keterbatasannya:** Nv2 (dan Nstreme) bersifat **proprietary MikroTik** — hanya bekerja bila **kedua ujung adalah perangkat MikroTik**, dan **tidak kompatibel** dengan klien Wi-Fi standar (laptop/ponsel biasa tidak bisa terhubung ke AP mode Nv2). Jadi Nv2 hanya untuk backhaul/PTMP antar-MikroTik, bukan untuk melayani klien Wi-Fi umum.

5. (Tiga dari) **(1) Enkripsi/autentikasi kuat** — gunakan minimal WPA2-PSK dengan AES (idealnya WPA3), jangan pernah WEP atau WPA/TKIP; untuk link backhaul PTP/PTMP gunakan passphrase kuat dan pertimbangkan membatasi koneksi berdasarkan MAC/access-list agar hanya perangkat sah yang terhubung. **(2) Kepatuhan regulasi frekuensi dan daya** — pita dan kanal yang boleh dipakai (khususnya 5 GHz untuk outdoor) serta batas **daya pancar/EIRP** diatur oleh regulator (di Indonesia: Komdigi/Kominfo); patuhi alokasi frekuensi yang diizinkan dan jangan melebihi daya maksimum — beberapa frekuensi memerlukan izin. Melanggar bisa berakibat interferensi dan sanksi hukum. **(3) Interferensi dan pemilihan kanal** — lakukan spectral/frequency scan untuk memilih kanal yang bersih (hindari kanal ramai), gunakan kanal non-overlap, dan pertimbangkan Nv2 untuk PTMP guna mengatasi hidden node; interferensi menurunkan kualitas dan keandalan link. Tambahan: **keamanan fisik dan manajemen perangkat** (amankan akses ke router AP di tower, firewall input, nonaktifkan layanan tak perlu — `19.3`), dan **line-of-sight/Fresnel zone** untuk keandalan link jarak jauh (aspek RF dari `10-wireless/01`).

</details>

---

## 10. Sumber

- MikroTik documentation — Wireless, CAPsMAN, WifiWave2, Nv2 (help.mikrotik.com)
- MTCNA outline — Wireless · MTCWE (Wireless Engineer)
- `10-wireless/01-04` (RF, 802.11, keamanan, desain WLAN)
- Regulasi spektrum: Komdigi/Kominfo

---

**Berikutnya:** `19-mikrotik/06-vpn-tunnel.md`. VPN & tunneling RouterOS (PPPoE, IPsec, WireGuard, EoIP).

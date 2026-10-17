# Lab 04: Keamanan L2 & Wireless

> **Prasyarat:** Tahap 10, 12, Lab 01-03
> **Platform:** Packet Tracer (mendukung port security, DHCP snooping, WLC/WLAN)
> **Format:** TUGAS → VERIFIKASI → KRITERIA SUKSES → solusi.

---

## Lab 4.1: Port Security

**Topologi:** switch + PC di port access.

**TUGAS:**
1. Aktifkan port security di port access, batasi max 1 MAC.
2. Set violation mode `shutdown` dan sticky MAC learning.
3. Uji: hubungkan PC sah → OK. Ganti dengan PC/MAC lain → port err-disabled.

**VERIFIKASI:** `show port-security interface fa0/1`; port shutdown saat pelanggaran.

**KRITERIA SUKSES:** Port belajar MAC sah, memblokir/shutdown saat MAC asing.

<details><summary>Solusi & penjelasan</summary>

```
SW(config)# interface fa0/1
SW(config-if)# switchport mode access
SW(config-if)# switchport port-security
SW(config-if)# switchport port-security maximum 1
SW(config-if)# switchport port-security violation shutdown
SW(config-if)# switchport port-security mac-address sticky
```
**Sticky** mempelajari MAC pertama & menyimpannya ke running-config. Saat MAC berbeda muncul (mis. hub/switch nakal, MAC spoofing), **violation** memicu aksi: `shutdown` (err-disabled, paling aman), `restrict` (drop+log), atau `protect` (drop diam). Recover: `shutdown` lalu `no shutdown`. Melindungi dari CAM overflow & perangkat tak sah (`12-keamanan/02`). Jangan aktifkan di port trunk/uplink. CCNA 5.7.
</details>

---

## Lab 4.2: DHCP Snooping

**Topologi:** switch + DHCP server sah + PC + "rogue DHCP" (server nakal).

**TUGAS:**
1. Aktifkan DHCP snooping untuk VLAN terkait.
2. Tandai port ke DHCP server sah sebagai **trusted**; port lain untrusted.
3. Uji: DHCP dari server sah diteruskan; DHCP dari rogue (di port untrusted) diblokir.

**VERIFIKASI:** `show ip dhcp snooping`; klien hanya dapat IP dari server sah.

**KRITERIA SUKSES:** Rogue DHCP diblokir; hanya server trusted yang melayani.

<details><summary>Solusi & penjelasan</summary>

```
SW(config)# ip dhcp snooping
SW(config)# ip dhcp snooping vlan 10
SW(config)# interface gi0/1              (port ke DHCP server SAH)
SW(config-if)# ip dhcp snooping trust
# port lain tetap untrusted (default) → blokir DHCP server reply
```
DHCP snooping memblokir pesan DHCP server (OFFER/ACK) dari port untrusted, sehingga rogue DHCP tidak bisa memberi gateway/DNS palsu (→ MITM). Hanya port trusted (ke server sah) boleh mengirim reply DHCP. Ia juga membangun **binding table** (IP-MAC-port) yang dipakai DAI (Lab 4.3). Membuktikan `12-keamanan/02`. Hati-hati: uplink ke server/router DHCP harus trusted. Kalau tidak, DHCP sah ikut terblokir.
</details>

---

## Lab 4.3: Dynamic ARP Inspection (DAI)

**Topologi:** lanjutan Lab 4.2 (butuh DHCP snooping aktif).

**TUGAS:**
1. Aktifkan DAI untuk VLAN, mengandalkan binding table DHCP snooping.
2. Set port uplink trusted.
3. Uji: ARP sah lewat; ARP spoofing (MAC/IP palsu) diblokir.

**VERIFIKASI:** `show ip arp inspection`; ARP tak sah di-drop (counter).

**KRITERIA SUKSES:** ARP spoofing dicegah; hanya ARP sesuai binding yang diteruskan.

<details><summary>Solusi & penjelasan</summary>

```
SW(config)# ip arp inspection vlan 10
SW(config)# interface gi0/1
SW(config-if)# ip arp inspection trust    (uplink trusted)
```
DAI memeriksa setiap paket ARP di port untrusted terhadap binding table DHCP snooping (IP-MAC-port). ARP yang tidak cocok (mis. penyerang mengklaim MAC gateway = **ARP poisoning/MITM**) di-drop. Ini menutup salah satu serangan L2 paling berbahaya. Bergantung pada DHCP snooping (karena itu Lab 4.2 dulu). Membuktikan `12-keamanan/02` (CCNA 5.7). Tanpa DHCP snooping, DAI tak punya binding untuk divalidasi.
</details>

---

## Lab 4.4: WLAN via WLC (GUI)

**Topologi:** WLC + LAP (lightweight AP) + klien wireless (PT mendukung WLC 3504 & AP).

**TUGAS:**
1. Hubungkan WLC & AP; AP join WLC (CAPWAP).
2. Buat WLAN dengan SSID, keamanan **WPA2-PSK**.
3. Petakan WLAN ke VLAN/interface & DHCP.
4. Uji: klien wireless connect & dapat IP.

**VERIFIKASI:** klien terasosiasi ke SSID, mendapat IP, bisa ping gateway.

**KRITERIA SUKSES:** Klien terhubung via WPA2-PSK & mendapat konektivitas.

<details><summary>Solusi & penjelasan</summary>

Via GUI WLC (browser ke IP manajemen WLC): WLANs → Create New → SSID, lalu Security → Layer 2 → **WPA2 + PSK** (masukkan passphrase). Petakan ke interface/VLAN dengan DHCP. AP mendaftar ke WLC lewat **CAPWAP** (tunnel kontrol+data). Klien terasosiasi → autentikasi PSK → dapat IP dari DHCP VLAN. Ini persis yang diuji CCNA (2.9 & 5.10: konfigurasi WLAN via GUI dengan WPA2 PSK). Membuktikan `10-wireless/03-04`. Kalau AP tak join, cek apakah AP dapat IP & tahu IP WLC (via DHCP option 43/DNS). Arsitektur controller-based (`16/06`).
</details>

---

## Lab 4.5: Hardening Perangkat (Checklist)

**TUGAS:** terapkan baseline keamanan di router/switch:
1. Password enable secret (bukan password lemah).
2. Enkripsi password (`service password-encryption`).
3. Banner login peringatan.
4. SSH-only (Lab 3.5), Telnet mati.
5. Matikan layanan tak terpakai; port unused → shutdown + assign VLAN "parkir".
6. BPDU Guard + PortFast di port access.

**VERIFIKASI:** `show run` mencerminkan hardening; akses tak sah tertutup.

**KRITERIA SUKSES:** Perangkat mengikuti baseline keamanan dasar.

<details><summary>Solusi & penjelasan</summary>

```
R1(config)# enable secret KuatSekali123
R1(config)# service password-encryption
R1(config)# banner login #Akses hanya untuk yang berwenang#
R1(config)# interface range fa0/10-24     (port tak terpakai)
R1(config-if-range)# switchport access vlan 999    (VLAN parkir)
R1(config-if-range)# shutdown
SW(config)# interface range fa0/1-9
SW(config-if-range)# spanning-tree portfast
SW(config-if-range)# spanning-tree bpduguard enable
```
Ini menerapkan prinsip hardening (`12-keamanan/05`): kurangi permukaan serang (matikan port/layanan tak perlu), lindungi akses (secret, SSH, banner), amankan L2 (BPDU Guard cegah switch nakal di port access). **PortFast** mempercepat port access ke forwarding (aman karena BPDU Guard mematikannya bila menerima BPDU). `enable secret` (hash kuat) mengungguli `enable password` (lemah). Baseline yang di-audit = golden config.
</details>

---

## Ringkasan Lab 04

Anda mempraktikkan: port security, DHCP snooping, DAI, WLAN via WLC (WPA2-PSK), dan hardening perangkat. Ini inti CCNA domain 5.0 (Security Fundamentals, 15%) dan bagian wireless (domain 2.0).

> [!TIP]
> Gabungkan semua: jaringan dengan L2 security lengkap + WLAN aman + perangkat ter-hardening = postur keamanan dasar solid. Untuk portofolio, dokumentasikan sebagai "secure campus lab".

**Berikutnya:** `lab/05-lab-linux-otomasi.md`. Linux networking & otomasi.

# 19.7 MikroTik: Monitoring, Tools & Scripting

> **Prasyarat:** `19-mikrotik/01-06`, `14-monitoring-troubleshooting/02-03` (tools & observability), `15-otomasi/01` (otomasi)
> **Tujuan:** Anda bisa memantau dan men-troubleshoot RouterOS dengan tools bawaan, dan mengotomasi tugas dengan scripting & scheduler.

---

## 1. Tools Monitoring & Diagnostik Bawaan

RouterOS punya banyak tools diagnostik (setara `ping`/`traceroute`/`tcpdump`; lihat `14-monitoring-troubleshooting/02`):

```routeros
# Konektivitas dasar
/ping 8.8.8.8 count=4
/tool traceroute 8.8.8.8

# Torch — analisis trafik real-time per-interface (siapa pakai bandwidth?)
/tool torch ether1 src-address=192.168.1.0/24

# Bandwidth test antar-MikroTik
/tool bandwidth-test 192.168.1.1 direction=both

# Packet sniffer (setara tcpdump)
/tool sniffer quick interface=ether1 ip-address=192.168.1.10

# Interface monitor (lihat rate real-time)
/interface monitor-traffic ether1

# Profile — proses apa membebani CPU
/tool profile
```

> [!TIP]
> **Torch** menampilkan trafik real-time per-interface, dipecah per src/dst/protokol/port. Saat "internet lambat", torch langsung menunjukkan siapa/apa yang memakan bandwidth, jauh lebih cepat daripada menebak. Hasilnya setara analisis flow, tetapi instan.

> [!WARNING]
> **Bandwidth-test membebani CPU/link.** Jangan jalankan di jam sibuk pada router produksi; ia bisa menjenuhkan link dan CPU. Gunakan untuk uji terkontrol saja.

---

## 2. Netwatch: Pemantauan Otomatis

**Netwatch** memantau host dan menjalankan aksi saat status berubah (up/down). Fitur ini menjadi dasar untuk failover, alert, dan otomasi reaktif.

```routeros
/tool netwatch
add host=8.8.8.8 interval=10s \
    up-script="/log info \"WAN UP\"" \
    down-script="/log warning \"WAN DOWN\"; /ip route enable [find comment=backup]"
```

> [!TIP]
> **Netwatch untuk failover WAN**: pantau gateway ISP utama; bila down, jalankan skrip yang mengaktifkan rute backup (atau ubah distance). Bila up lagi, kembalikan. Ini pola failover populer di RouterOS (selain recursive routing/route with check-gateway). Bisa juga trigger notifikasi (email/Telegram via API).

---

## 3. Logging

```routeros
# Lihat log
/log print
/log print where topics~"error"

# Kirim log ke server syslog eksternal (sentralisasi — 14/03)
/system logging action
add name=remote target=remote remote=192.168.1.50 remote-port=514
/system logging
add topics=info,error,warning action=remote
```

> [!WARNING]
> **Sentralisasi log ke syslog server** (`14-monitoring-troubleshooting/03`) penting karena memori log lokal RouterOS terbatas dan hilang saat reboot. Untuk audit, troubleshooting historis, dan korelasi antar-perangkat, kirim ke collector terpusat (dan pastikan NTP sinkron agar timestamp akurat).

---

## 4. SNMP & The Dude

```routeros
# Aktifkan SNMP untuk dipantau NMS (14/03)
/snmp set enabled=yes contact="admin" location="POP-Jakarta"
/snmp community set [find default=yes] name=komunitasrahasia \
    addresses=192.168.1.50/32    # batasi ke NMS

# The Dude = NMS gratis dari MikroTik (peta jaringan, grafik, alert)
```

> [!TIP]
> **The Dude** adalah NMS (Network Management System) gratis dari MikroTik: memetakan jaringan otomatis, grafik pemakaian, dan alert bila perangkat/link down. Cocok untuk ISP kecil yang butuh monitoring visual tanpa biaya. Untuk skala lebih besar/modern, ekspor SNMP ke **Prometheus/Grafana** atau NMS lain (`14/03`).

---

## 5. Scripting RouterOS

RouterOS punya bahasa scripting sendiri untuk otomasi tugas.

```routeros
# Contoh: skrip backup + kirim ke email
/system script
add name=backup-harian source={
    :local tgl [/system clock get date];
    /system backup save name=("backup-" . $tgl);
    /export file=("config-" . $tgl);
    :log info ("Backup selesai: " . $tgl);
}

# Jalankan manual
/system script run backup-harian
```

**Elemen scripting:**
```
:local / :global   → variabel
:if ... do={...}    → kondisi
:foreach i in={...} → loop
:log info/warning   → tulis ke log
[/command get value]→ ambil nilai
[find ...]          → cari item (mengembalikan id)
```

> [!TIP]
> **Backup ada dua jenis**: `/system backup` (binary, lengkap, hanya restore ke perangkat sama) dan `/export` (teks, dapat dibaca/di-diff/di-versi di Git, portabel sebagian). Untuk version control (`15-otomasi/04`), `/export` yang berbasis teks lebih berguna karena bisa disimpan di Git dan di-diff.

---

## 6. Scheduler: Jalankan Otomatis

**Scheduler** menjalankan skrip pada waktu/interval tertentu (setara cron).

```routeros
/system scheduler
add name=backup-tiap-hari interval=1d start-time=02:00:00 \
    on-event="/system script run backup-harian"

# Reboot terjadwal, update address-list, dll juga bisa dijadwalkan
```

> [!TIP]
> **Scheduler + script** = otomasi asli RouterOS: backup terjadwal, pembersihan, update daftar blokir, cek & failover, notifikasi. Untuk otomasi multi-perangkat dan version control, gabungkan dengan pendekatan eksternal (Ansible `community.routeros`, atau skrip Python via API/SSH; lihat `15-otomasi/03-04`).

---

## 7. Otomasi Eksternal (Integrasi dengan Tahap 15)

RouterOS bisa dikelola dari luar untuk otomasi berskala:

```
API RouterOS   → port 8728 (atau 8729 API-SSL). Library Python (RouterOS-api,
                 librouteros) untuk skrip otomasi.
SSH            → Netmiko/NAPALM/Scrapli dapat mengelola via CLI (15/03).
Ansible        → collection community.routeros (15/04).
REST API       → RouterOS v7 punya REST API (/rest) untuk integrasi modern.
```

```python
# Contoh singkat: backup config semua MikroTik via SSH (Netmiko)
from netmiko import ConnectHandler
dev = {"device_type": "mikrotik_routeros", "host": "192.168.1.1",
       "username": "admin", "password": "rahasia"}
with ConnectHandler(**dev) as conn:
    out = conn.send_command("/export")
    open("192.168.1.1.rsc", "w").write(out)
```

> [!TIP]
> **Untuk ISP dengan banyak router**, otomasi eksternal (Python/Ansible + Git + NetBox, lihat Tahap 15) mengalahkan scripting per-perangkat: konfigurasi konsisten, backup terpusat ter-versi, dan perubahan massal aman. Scripting internal RouterOS untuk tugas lokal/reaktif (failover netwatch, backup lokal); otomasi eksternal untuk manajemen armada.

---

## 8. Tabel Padanan

| Fungsi | Cisco | MikroTik | Linux |
|---|---|---|---|
| Analisis trafik live | `show ... `/NetFlow | **Torch** | iftop/nload |
| Packet capture | EPC/SPAN | `/tool sniffer` | tcpdump |
| Pantau host + aksi | IP SLA + track | **Netwatch** | monitoring script |
| SNMP | `snmp-server` | `/snmp` | snmpd |
| NMS gratis | - | **The Dude** | LibreNMS/Zabbix |
| Backup teks | `show run`/archive | **`/export`** | (config files) |
| Terjadwal | kron / EEM | **scheduler** | cron |
| Otomasi eksternal | NETCONF/Ansible | API/REST/Ansible | SSH/Ansible |

---

## 9. Ringkasan

- Tools bawaan: `/ping`, `/tool traceroute`, **`/tool torch`** (trafik live per-interface: siapa makan bandwidth), `/tool sniffer` (≈tcpdump), `/tool bandwidth-test` (jangan di jam sibuk), `/interface monitor-traffic`.
- **Netwatch** pantau host + jalankan up/down-script → dasar failover WAN & alert otomatis.
- **Logging**: sentralisasi ke syslog server (memori lokal terbatas/hilang saat reboot); NTP sinkron.
- **SNMP** untuk NMS; **The Dude** = NMS gratis MikroTik (peta, grafik, alert); atau ekspor ke Prometheus/Grafana.
- **Scripting** RouterOS (`:local`, `:if`, `:foreach`, `:log`, `[find]`) + **scheduler** (≈cron) = otomasi lokal (backup, failover, notifikasi). **`/export`** (teks) lebih baik dari `/system backup` (binary) untuk Git.
- **Otomasi eksternal** (API/REST/SSH/Ansible `community.routeros`, Tahap 15) untuk manajemen armada banyak router: konsisten, ter-versi, perubahan massal aman.

---

## 10. Latihan

1. Bagaimana Torch membantu saat pelanggan mengeluh "internet lambat"?
2. Bagaimana Netwatch dipakai untuk failover WAN otomatis?
3. Kenapa log harus disentralisasi ke syslog server, dan kenapa NTP penting untuk itu?
4. Apa perbedaan `/system backup` dan `/export`, dan mana yang lebih baik untuk version control?
5. Kapan memakai scripting internal RouterOS vs otomasi eksternal (Python/Ansible)?

<details>
<summary>Jawaban</summary>

1. **Torch (`/tool torch`)** menampilkan trafik real-time yang melewati sebuah interface, dipecah berdasarkan alamat sumber/tujuan, protokol, dan port. Saat pelanggan mengeluh internet lambat, alih-alih menebak, Anda menjalankan torch pada interface yang relevan (mis. interface ke pelanggan atau uplink WAN) dan langsung melihat siapa/apa yang mengonsumsi bandwidth, misalnya satu IP sedang mengunduh besar, banyak koneksi ke port tertentu (P2P/torrent), atau lonjakan trafik dari/ke host tertentu (mungkin tanda perangkat terinfeksi atau serangan). Dengan informasi itu Anda bisa mengambil tindakan tepat: menerapkan/menyesuaikan queue (`19.4`), memblokir/membatasi trafik tertentu (`19.3`), atau mengidentifikasi anomali. Torch mengubah "internet lambat" dari tebakan menjadi diagnosis berbasis data secara instan (tanpa perlu setup flow export atau tools eksternal).

2. **Netwatch** memantau sebuah host (mis. gateway ISP utama atau alamat andal seperti 8.8.8.8 lewat jalur utama) pada interval tertentu, dan menjalankan `down-script` ketika host tidak lagi merespons serta `up-script` ketika kembali merespons. Untuk **failover WAN otomatis**: konfigurasikan netwatch memantau gateway/target melalui ISP utama; pada `down-script`, jalankan perintah yang mengalihkan trafik ke ISP backup, misalnya mengaktifkan/menurunkan distance rute backup, mengubah default route, atau mengaktifkan rute yang tadinya nonaktif; pada `up-script`, kembalikan trafik ke ISP utama (aktifkan lagi rute utama). Dengan begitu, ketika ISP utama putus, router otomatis beralih ke backup dalam hitungan detik tanpa intervensi manual, dan kembali normal saat utama pulih. (Alternatif lain: recursive routing dengan `check-gateway`, tetapi netwatch memberi fleksibilitas menjalankan skrip apa pun, termasuk notifikasi.) Netwatch juga bisa sekaligus mengirim alert (mis. via email/Telegram lewat API) saat status berubah.

3. **Sentralisasi log ke syslog server** penting karena: (a) memori log lokal RouterOS terbatas: hanya menyimpan sejumlah entri terakhir, sehingga log lama tertimpa; (b) log lokal hilang saat reboot (kecuali dikonfigurasi ke disk, yang tetap terbatas), sehingga bukti penting bisa lenyap; (c) untuk troubleshooting historis dan audit (mis. investigasi insiden keamanan atau menelusuri kapan masalah mulai) Anda butuh riwayat log yang bertahan; (d) untuk korelasi antar-perangkat, karena melihat log dari banyak router/switch di satu tempat memungkinkan memahami peristiwa yang melibatkan beberapa perangkat; (e) untuk kepatuhan yang mensyaratkan retensi log. **NTP penting** karena korelasi dan analisis log bergantung pada timestamp yang akurat dan konsisten di semua perangkat: jika jam antar-perangkat tidak sinkron, urutan peristiwa menjadi kacau dan mustahil mengaitkan kejadian di satu perangkat dengan perangkat lain secara tepat. Dengan NTP tersinkron, timestamp seluruh perangkat selaras sehingga log terpusat dapat diurutkan dan dikorelasikan dengan benar. Lihat `14-monitoring-troubleshooting/03`.

4. **`/system backup`** menghasilkan file biner lengkap yang berisi seluruh konfigurasi dan state perangkat (termasuk password, sertifikat). File ini memulihkan perangkat ke keadaan persis seperti saat backup, tetapi hanya bisa di-restore ke perangkat yang sama/serupa (versi RouterOS dan sering hardware yang cocok) dan tidak dapat dibaca/diedit manusia. **`/export`** menghasilkan file teks berisi perintah-perintah konfigurasi (script `.rsc`) yang dapat dibaca, diedit, dan di-diff manusia; ia bisa diterapkan sebagian atau ke perangkat lain (dengan penyesuaian), meski tidak menyertakan beberapa hal sensitif secara default (mis. password tidak selalu ikut). **Untuk version control (`15-otomasi/04`), `/export` jauh lebih baik** karena berbasis teks: dapat disimpan di Git, di-diff (melihat persis apa yang berubah antar-versi, untuk deteksi drift), di-review lewat pull request, dan dikelola sebagai kode. File biner `/system backup` tidak bisa di-diff secara bermakna dan tidak cocok untuk Git. Praktik umum: gunakan `/export` untuk versioning/audit konfigurasi, dan `/system backup` untuk pemulihan cepat perangkat yang sama (mis. sebelum upgrade).

5. Gunakan **scripting internal RouterOS + scheduler** untuk tugas yang bersifat lokal, reaktif, dan spesifik-perangkat: failover berbasis netwatch, backup lokal terjadwal, pembersihan/rotasi, pembaruan address-list dinamis, reboot terjadwal, notifikasi berdasarkan event di perangkat itu. Ini berjalan di dalam router, tidak bergantung sistem luar, dan ideal untuk reaksi cepat terhadap kondisi lokal. Gunakan **otomasi eksternal (Python via API/SSH, atau Ansible `community.routeros`)** untuk manajemen armada (banyak perangkat) dan hal yang menuntut konsistensi, versioning, dan perubahan massal: mengonfigurasi/memperbarui puluhan-ratusan router secara seragam, backup terpusat yang ter-versi di Git, audit kepatuhan lintas-perangkat, provisioning pelanggan/perangkat baru dari source of truth (NetBox), dan pipeline CI/CD (`15-otomasi/04`). Otomasi eksternal memberi kontrol terpusat, idempotensi, review perubahan, dan integrasi dengan alat/proses yang sama untuk semua vendor, sesuatu yang tidak dimiliki scripting per-perangkat. Aturan praktis: scripting internal untuk otomasi lokal/reaktif satu perangkat; otomasi eksternal untuk mengelola banyak perangkat secara konsisten dan ter-versi. Keduanya saling melengkapi.

</details>

---

## 11. Sumber

- MikroTik documentation: Tools (Torch, Netwatch, Sniffer), Scripting, Scheduler, SNMP, The Dude, REST API (help.mikrotik.com)
- MTCNA outline: Network Management & Tools
- `14-monitoring-troubleshooting/02-03` (tools & observability) · `15-otomasi/03-04` (Python & Ansible)

---

**Berikutnya:** `19-mikrotik/08-routing-v7`. Routing RouterOS v7 tingkat MTCRE: OSPF, BGP, VRF, dan policy routing.

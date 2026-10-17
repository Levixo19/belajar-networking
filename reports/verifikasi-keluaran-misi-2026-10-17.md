# Verifikasi format keluaran perangkat di 24 misi troubleshooting

Tanggal: 2026-10-17. Berkas yang diperiksa: `app/data/misi/dasar.json`, `jaringan.json`, `layanan.json`.
Yang diperiksa hanya FORMAT `keluaran` (susunan kolom, judul, bendera, teks pesan, label field), bukan
isi cerita. Alamat, nama antarmuka, nilai petunjuk, dugaan, dan status `berguna` tidak diubah. Tidak ada
`briefing`, `dugaan`, `makna`, topologi, id, atau lokasi yang perlu disentuh: tidak satu pun perbaikan
bertentangan dengan teks di luar `keluaran`.

## Ringkasan

| | Jumlah |
|---|---|
| Keluaran diperiksa | 220 (24 misi) |
| Sesuai sumber | 57 |
| Diperbaiki | 7 (di 6 misi) |
| Tidak bisa diverifikasi dari sumber publik | 156 |

Rincian yang tidak terverifikasi: 72 keluaran Windows (Catatan W), 59 keluaran Cisco IOS/IOS-XE
(Catatan C), 22 keluaran Linux yang tidak punya contoh resmi yang sempat dibuka (Catatan L), dan 3 kasus
khusus yang dijelaskan di barisnya. "Tidak bisa diverifikasi" artinya tidak ada contoh keluaran primer
yang bisa dibuka dalam sesi ini, BUKAN bahwa keluarannya salah. Keluaran itu tetap dibaca baris demi baris
dan diperiksa konsistensi internalnya (lihat catatan di bawah); tidak ditemukan kesalahan yang bisa
dibuktikan, jadi tidak diubah.

Keterbatasan cara kerja: kuota WebSearch sesi sudah habis sejak awal pekerjaan ini, sehingga
verifikasi memakai halaman yang alamatnya bisa dituju langsung (manual RouterOS 7.26, forum MikroTik,
beberapa dokumen dukungan Cisco, Microsoft Learn, dan kode sumber upstream alat Linux). Sebagian besar
halaman Cisco (system message guide, command reference) menjawab 403 atau 404 untuk akses otomatis.

## Perbaikan

| Misi | Langkah | Sebelum | Sesudah | Bukti |
|---|---|---|---|---|
| ospf-exstart-mtu-berbeda | batu-debug-adj | DBD dari MLG bernomor urut `0x1F4C`, padahal BATU (master, RID 10.255.0.7) mengirim `0x0B71`; baris `Retransmitting DBD` mendahului `Send DBD` | DBD dari MLG `seq 0x0B71` (slave membalas dengan nomor urut master); `Send DBD` lalu `Retransmitting DBD` | [CS-OSPFDBD]: Router 6 (slave) mengirim `seq 0x13FD flag 0x2` yang sama dengan nomor urut master, dan urutan Send lalu Retransmitting |
| ospf-timer-hello-berbeda | gdc-config-gi016 | `Current configuration : 136 bytes` | `147 bytes` | Konsistensi internal: dua keluaran `show running-config interface` lain di misi ini (166 dan 159 byte) persis sama dengan panjang blok `!` sampai `end` plus baris baru; yang ini meleset 11 byte. Cara hitung IOS sendiri tidak diverifikasi dari sumber. |
| mikrotik-masquerade-isp-baru | dns-print | `dynamic-servers: 203.0.113.53,203.0.113.54`; tanpa `address-list-extra-time` dan `mdns-repeat-ifaces` | Satu alamat per baris; dua field itu ditambahkan | [MT-DNS]: `/ip dns print` v7 mencetak daftar server satu per baris dan memuat kedua field itu |
| mikrotik-urutan-filter-input | dns-print | `servers: 203.0.113.53,203.0.113.54`; tanpa dua field yang sama | Satu alamat per baris; dua field ditambahkan | [MT-DNS] |
| mikrotik-urutan-filter-input | log-drop | Cap waktu hanya jam (` 08:52:40 firewall,info ...`) | ` 2026-10-15 08:52:40 firewall,info ...` (Kamis di briefing = 15 Oktober, sama dengan lease di `ipconfig /all`) | [MT-LOG]: `/log/print` di manual 7.26 dan contoh forum 2025-2026 memakai tanggal ISO. Contoh lama di halaman Packet Flow masih jam saja, jadi format lama itu pernah benar; yang dipilih format v7 terkini supaya sama dengan log DHCP di misi pool-dhcp-habis-kafe |
| sertifikat-internal-kedaluwarsa | status-nginx | Tanpa baris `Process:` | Ditambah `Process: 1039 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=0/SUCCESS)` dan `Process: 1041 ExecStart=...` | [NGINX-UNIT]: unit nginx Ubuntu 24.04 bertipe `forking` dengan ExecStartPre dan ExecStart itu; systemctl menampilkan proses yang sudah selesai sebagai baris `Process:` (sama seperti baris ExecStartPre di status smbd misi konflik-ip-ganda) |
| rp-filter-dua-nic | firewalld-internal | Tanpa baris `forward:` | `  forward: no` di antara `protocols:` dan `masquerade:` | [FIREWALLD]: `print_zone_policy_info()` firewalld 0.9.11 mencetak `forward:` untuk setiap zona; Rocky Linux 8 memakai firewalld 0.9.x (fitur forward intra-zona masuk di 0.9.0) |

Tidak ada perbaikan yang mengubah cara memecahkan misi. Di batu-debug-adj petunjuknya tetap baris
`mtu 1500 state EXSTART` dan `Nbr 10.255.0.1 has larger interface MTU`; di dua `dns-print` isi DNS tetap
benar (memang langkah pengecoh); di log-drop status `connection-state:established` tetap jadi bukti utama.

## Temuan yang sengaja tidak diubah

Bagian ini mencatat hal yang mungkin berbeda di perangkat sungguhan tetapi tidak bisa dibuktikan salah,
atau bergantung pada versi.

- `edge-bgp-summary` (bgp-network-tanpa-rute-cocok): IOS-XE biasanya menulis zona waktu di baris
  `1 networks peaked at 08:28:51 Oct 16 2026 (...)`. Tidak ada contoh resmi yang bisa dibuka; dibiarkan.
- `show ip route` (ospf-timer-hello-berbeda): legenda `Codes:` berbeda antar rilis IOS (misalnya
  `a - application route`, `p - overrides from PfR`); yang tertulis cocok dengan IOS 15.4 ke atas, dan
  3560-CX bisa memakai legenda yang sedikit lebih pendek.
- `show ip ospf interface`: `Index 2/2` atau `Index 3/3`; beberapa rilis IOS 15 menulis tiga angka
  (`Index 2/2/2`). Tidak diverifikasi.
- `netsh wlan show interfaces` di wifi-kanal-24ghz-sama tidak diawali baris kosong, sedangkan versi di
  pool-dhcp-habis-kafe diawali baris kosong. Perbedaan kosmetik, dibiarkan.
- `date` di sertifikat-internal-kedaluwarsa memakai format locale C/POSIX (`Fri Oct 16 07:14:05 WIB 2026`);
  dengan locale en_US glibc formatnya 12 jam dengan AM/PM. Locale laptop teknisi tidak disebut, jadi dibiarkan.
- `curl -w "%{speed_download}"` di Windows: curl lama mencetak `5912337.000`, curl baru bilangan bulat.
  Versi curl di PC admin tidak disebut; dibiarkan.
- `/log print` di pool-dhcp-habis-kafe tidak diawali spasi, sedangkan contoh manual 7.26 diawali spasi.
  Contoh forum menunjukkan keduanya (hasil salin-tempel), jadi tidak diubah.

## Pemeriksaan konsistensi yang dilakukan pada semua keluaran

- Rata-rata ping Windows (dipotong ke bawah) dan RouterOS (`min/avg/max-rtt`) dihitung ulang: semua cocok.
- Ping Windows dengan `Destination host unreachable` menghitung balasan sebagai diterima (`Received = 4,
  Lost = 0`) dan tanpa baris rtt: konsisten di semua misi.
- Indeks antarmuka Windows: `%11`/`%12` di alamat link-local cocok dengan `route print` dan
  `Interface: ... --- 0xf` di `arp -a`.
- `MSG SIZE  rcvd: 61` di dig dihitung ulang dari header, pertanyaan, jawaban A, dan OPT: 61.
- ETag nginx `"6acc4f8f-1400"` = mtime `Last-Modified` dalam heksadesimal dan ukuran 5120 byte: cocok.
- Jumlah baris `show interfaces | include is up|input rate` di loop-switch-kecil-bawah-meja cocok dengan
  Vlan1, Vlan10, FastEthernet0, lalu Gi1/0/1 sampai Gi1/0/28 di 2960-X.
- Hari dalam seminggu di semua cap waktu (`Sat 17 Oct 2026`, `Fri 16 Oct 2026`, `Mon 2026-09-28`) dan
  selisih `2 weeks 4 days ago` cocok dengan kalender 2026.
- tcpdump: 18 baris paket = `18 packets captured`; `length 556` pada ICMP frag-needed = batas 576 byte
  Linux dikurangi header IP.
- Batang sinyal `nmcli` cocok dengan ambang SIGNAL (>80 empat batang, >55 tiga, >5 satu).

## Sumber

| Kode | Sumber |
|---|---|
| MT-ROUTE | https://manual.mikrotik.com/docs/network-management/dhcp/server (contoh `/ip/route/print` dinamis `DAd`, tanpa kolom `#`), https://manual.mikrotik.com/docs/user-guides/routing-and-networking-protocols/routing-decision (bendera hanya yang tampil), https://forum.mikrotik.com/t/180226 (campuran `0  As` dan `  DAc`) |
| MT-ADDR | https://manual.mikrotik.com/docs/virtual-private-networks/zerotier (`Columns: ADDRESS, NETWORK, INTERFACE`), https://manual.mikrotik.com/docs/bridging-and-switching/ (komentar `;;;` di atas baris tabel v7) |
| MT-PING | https://manual.mikrotik.com/docs/diagnostics-monitoring-and-troubleshooting/ping |
| MT-POOL | https://manual.mikrotik.com/docs/cli-reference/ip/pool/ (field baca-saja total, used, available), https://forum.mikrotik.com/t/263080 |
| MT-DHCPSRV | https://manual.mikrotik.com/docs/cli-reference/ip/dhcp-server/, https://forum.mikrotik.com/t/151712 |
| MT-DHCPNET | https://forum.mikrotik.com/t/176634, https://forum.mikrotik.com/t/140040 |
| MT-DNSCACHE | https://manual.mikrotik.com/docs/cli-reference/ip/dns/cache/, https://forum.mikrotik.com/t/178553 |
| MT-LOG | https://manual.mikrotik.com/docs/diagnostics-monitoring-and-troubleshooting/log/, https://manual.mikrotik.com/docs/diagnostics-monitoring-and-troubleshooting/log/syslog-with-elasticsearch (pola `assigned <ip> for <mac>`), https://forum.mikrotik.com/t/183809 (`dhcp,error <server>: failed to give out IP address: pool <...> is empty`) |
| MT-DNS | https://forum.mikrotik.com/t/269992 (keluaran mentah `/ip dns print` 7.x), https://manual.mikrotik.com/docs/cli-reference/ip/dns/ |
| MT-FW | https://manual.mikrotik.com/docs/firewall-and-quality-of-service/firewall/nat (`Flags: X - disabled, I - invalid; D - dynamic`), https://manual.mikrotik.com/docs/firewall-and-quality-of-service/firewall/common-firewall-matchers-and-actions (`print stats` dengan pemisah ribuan spasi), https://manual.mikrotik.com/docs/firewall-and-quality-of-service/packet-flow-in-routeros (format pesan log firewall) |
| CS-OSPFDBD | https://www.cisco.com/c/en/us/support/docs/ip/open-shortest-path-first-ospf/13684-12.html |
| CS-AUTONEG | https://www.cisco.com/c/en/us/support/docs/lan-switching/ethernet/10561-3.html |
| CS-BGPNOAD | https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/19345-bgp-noad.html |
| MS-TNC | https://learn.microsoft.com/en-us/powershell/module/nettcpip/test-netconnection |
| IPUTILS | https://github.com/iputils/iputils (`ping/ping_output.c`, `ping/ping.c`, `arping.c`, `tracepath.c`) |
| TCPDUMP | https://github.com/the-tcpdump-group/tcpdump (`print-icmp.c`; `tcpdump.c` cabang 4.9 dan 4.99) |
| SS | https://github.com/shemminger/iproute2/blob/main/misc/ss.c (kolom `Process` tanpa pembatas kiri) |
| CHRONY | https://github.com/mlichvar/chrony/blob/master/client.c |
| WG | https://github.com/WireGuard/wireguard-tools/blob/master/src/show.c |
| TIMEDATECTL | https://github.com/systemd/systemd/blob/main/src/timedate/timedatectl.c |
| CURL | https://github.com/curl/curl/blob/master/src/tool_operate.c |
| DIG | https://gitlab.isc.org/isc-projects/bind9/-/blob/bind-9.18/bin/dig/dig.c |
| NMCLI | https://github.com/NetworkManager/NetworkManager/blob/main/src/nmcli/devices.c |
| IW | https://git.kernel.org/pub/scm/linux/kernel/git/jberg/iw.git/tree/survey.c |
| OPENSSL | https://docs.openssl.org/3.0/man1/openssl-namedisplay-options/ (bawaan `oneline` dengan `space_eq`) |
| SAMBA-UNIT | https://sources.debian.org/src/samba/2:4.17.12+dfsg-0+deb12u4/packaging/systemd/smb.service.in |
| NGINX-UNIT | https://git.launchpad.net/ubuntu/+source/nginx/tree/debian/nginx-common.nginx.service?h=ubuntu/noble |
| FIREWALLD | https://github.com/firewalld/firewalld/blob/v0.9.11/src/firewall/command.py, rilis v0.9.0 (Intra Zone Forwarding) |

Catatan W: keluaran Windows (`ping`, `ipconfig`, `nslookup`, `tracert`, `route print`, `arp -a`, `netsh`,
`curl` bawaan). Microsoft tidak menerbitkan contoh keluaran lengkap untuk perintah-perintah ini. Diperiksa
konsistensinya (indeks antarmuka, hitungan paket, rata-rata, pesan galat yang khas seperti
`Sucessfully reset the Winsock Catalog.` yang memang salah eja di Windows), tidak ditemukan yang salah.

Catatan C: keluaran Cisco IOS/IOS-XE selain yang bersumber di atas. Command reference dan system message
guide Cisco tidak bisa dibuka dalam sesi ini (403/404). Diperiksa konsistensi internalnya: nama antarmuka
per platform (2960 `Fa0/x`, 2960-X dan 9200L/9300 `Gi1/0/x`, ISR 4000 `Gi0/0/x`), lebar kolom, angka
yang saling merujuk (VLAN di `show vlan brief` dengan `show interfaces trunk`, prioritas STP 32768 + VLAN,
jumlah subnet dan mask di `show ip route`, total memori BGP), format pesan `%FACILITY-SEV-MNEMONIC`.

Catatan L: keluaran Linux tanpa contoh resmi yang sempat dibuka (`ip`, `nft`, `conntrack`, `nstat`,
`sysctl`, `uptime`, `traceroute`, header `curl -I`, `curl -v`). Diperiksa terhadap pengetahuan alatnya dan
konsistensi internal; repositori conntrack-tools menolak akses otomatis.

Berkas lain di pohon kerja (AGENTS.md, `app/src/...`, `materi/...`) tercatat berubah oleh proses lain
selama pekerjaan ini berjalan; pekerjaan ini hanya menyunting `app/data/misi/jaringan.json` dan
`app/data/misi/layanan.json`, plus laporan ini.

Build dan tes: `node scripts/build-content.mjs` keluar dengan status 0 (`OK  24 misi troubleshooting`);
`node --test tests/wawasan.test.mjs` 19 lulus, 0 gagal.

## Tabel per misi dan langkah

### `dasar.json` · duplex-mismatch-cabang-medan

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| ping-gateway | PC1 | `ping 10.20.0.1` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ipconfig-pc | PC1 | `ipconfig` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| status-port-switch | SW1 | `show interfaces status` | [CS-AUTONEG] | sesuai | Judul kolom dan awalan `a-` cocok dengan contoh Cisco. |
| error-uplink-switch | SW1 | `show interfaces GigabitEthernet0/1` | [CS-AUTONEG] | tidak bisa diverifikasi dari sumber publik | Pola galat (late collision di sisi half, CRC dan runts di sisi full) sesuai dokumen Cisco, tetapi susunan baris counter tidak ada contoh verbatim yang bisa dibuka. |
| error-lan-router | R1 | `show interfaces GigabitEthernet0/1` | [CS-AUTONEG] | tidak bisa diverifikasi dari sumber publik | Pola galat (late collision di sisi half, CRC dan runts di sisi full) sesuai dokumen Cisco, tetapi susunan baris counter tidak ada contoh verbatim yang bisa dibuka. |
| config-lan-router | R1 | `show running-config interface GigabitEthernet0/1` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| brief-router | R1 | `show ip interface brief` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| wan-router | R1 | `show interfaces GigabitEthernet0/0 \| include Duplex\|rat...` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| cpu-switch | SW1 | `show processes cpu sorted \| include CPU` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |

### `dasar.json` · gateway-salah-pc-tata-usaha

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| ping-nama-situs | PC1 | `ping rapor.example.org` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ipconfig-all-tu | PC1 | `ipconfig /all` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-printer | PC1 | `ping 192.168.10.40` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| nslookup-tu | PC1 | `nslookup rapor.example.org` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-gateway-254 | PC1 | `ping 192.168.10.254` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-router | PC1 | `ping 192.168.10.1` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ipconfig-ratna | PC2 | `ipconfig` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| flushdns | PC1 | `ipconfig /flushdns` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| route-router | R1 | `/ip route print` | [MT-ROUTE] | sesuai | Flags v7 hanya untuk bendera yang tampil; rute dinamis tanpa nomor. |
| ping-dari-router | R1 | `/ping 198.51.100.27 count=3` | [MT-PING] | sesuai | Kolom SEQ/HOST/SIZE/TTL/TIME/STATUS dan ringkasan rtt; rata-rata dihitung ulang dan cocok. |

### `dasar.json` · subnet-mask-salah-klinik

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| ping-server-apotek | PC1 | `ping 192.168.2.10` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-gateway-apotek | PC1 | `ping 192.168.1.1` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-internet-apotek | PC1 | `ping pemasok.example.com` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ipconfig-apotek | PC1 | `ipconfig` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ipconfig-kasir | PC2 | `ipconfig` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| route-print-apotek | PC1 | `route print -4` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| alamat-router | R1 | `/ip address print` | [MT-ADDR] | sesuai | Tanpa baris Flags karena tidak ada bendera; komentar `;;;` di atas baris. |
| ping-server-router | R1 | `/ping 192.168.2.10 count=3` | [MT-PING] | sesuai | Kolom SEQ/HOST/SIZE/TTL/TIME/STATUS dan ringkasan rtt; rata-rata dihitung ulang dan cocok. |
| ss-server | SRV | `sudo ss -tlnp` | [SS] | sesuai | Judul `Peer Address:PortProcess` (tanpa spasi) memang dicetak iproute2. |

### `dasar.json` · pool-dhcp-habis-kafe

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| ipconfig-all-laptop | LAP | `ipconfig /all` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| renew-laptop | LAP | `ipconfig /renew` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| wlan-laptop | LAP | `netsh wlan show interfaces` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-router-laptop | LAP | `ping 192.168.50.1` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| winsock-laptop | LAP | `netsh winsock reset` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| log-dhcp | R1 | `/log print where topics~"dhcp"` | [MT-LOG] | sesuai | Pesan `failed to give out IP address: pool <...> is empty` dan `assigned ... for ...` cocok dengan contoh nyata. |
| pool-print | R1 | `/ip pool print` | [MT-POOL] | sesuai | Kolom TOTAL, USED, AVAILABLE ada di v7. |
| dhcp-server-print | R1 | `/ip dhcp-server print` | [MT-DHCPSRV] | sesuai |  |
| ping-internet-router | R1 | `/ping 198.51.100.80 count=3` | [MT-PING] | sesuai | Kolom SEQ/HOST/SIZE/TTL/TIME/STATUS dan ringkasan rtt; rata-rata dihitung ulang dan cocok. |

### `dasar.json` · dhcp-liar-router-rumahan

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| ipconfig-all-maya | LAP1 | `ipconfig /all` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ipconfig-all-ari | PC2 | `ipconfig /all` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-nas-maya | LAP1 | `ping 10.10.10.20` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| renew-maya | LAP1 | `ipconfig /renew` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| arp-maya | LAP1 | `arp -a` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| cari-mac | SW1 | `show mac address-table address 0000.5e00.53c8` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| mac-port-17 | SW1 | `show mac address-table interface FastEthernet0/17` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| log-port-17 | SW1 | `show logging \| include 0/17` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| pool-kantor | R1 | `/ip pool print` | [MT-POOL] | sesuai | Kolom TOTAL, USED, AVAILABLE ada di v7. |

### `dasar.json` · dns-resolver-mati-warnet

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| ping-ip-game | PC7 | `ping 198.51.100.80` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-nama-game | PC7 | `ping update.example.net` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ipconfig-all-pc07 | PC7 | `ipconfig /all` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| nslookup-bawaan | PC7 | `nslookup update.example.net` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| nslookup-isp | PC7 | `nslookup update.example.net 203.0.113.53` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-server-dns | PC7 | `ping 192.168.100.5` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| flushdns | PC7 | `ipconfig /flushdns` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| renew-pc07 | PC7 | `ipconfig /renew` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| tracert-ip-game | PC7 | `tracert -d 198.51.100.80` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| dhcp-network-router | R1 | `/ip dhcp-server network print` | [MT-DHCPNET] | sesuai |  |

### `dasar.json` · cache-dns-ttl-migrasi-toko

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| nslookup-kantor | PC1 | `nslookup toko.example.com` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| dig-otoritatif | LAP | `dig toko.example.com @ns1.example.com` | [DIG] | sesuai | Baris `;; SERVER: ...(...) (UDP)`, `Query time`, `MSG SIZE  rcvd` sesuai BIND 9.18; MSG SIZE 61 dihitung ulang dan cocok. |
| dig-router | LAP | `dig toko.example.com @192.168.1.1` | [DIG] | sesuai | Baris `;; SERVER: ...(...) (UDP)`, `Query time`, `MSG SIZE  rcvd` sesuai BIND 9.18; MSG SIZE 61 dihitung ulang dan cocok. |
| dig-resolver-isp | LAP | `dig +noall +answer toko.example.com @203.0.113.53` | [DIG] | sesuai | Baris `;; SERVER: ...(...) (UDP)`, `Query time`, `MSG SIZE  rcvd` sesuai BIND 9.18; MSG SIZE 61 dihitung ulang dan cocok. |
| cache-router | R1 | `/ip dns cache print where name="toko.example.com"` | [MT-DNSCACHE] | sesuai |  |
| flushdns-pc | PC1 | `ipconfig /flushdns` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-vps-baru | PC1 | `ping 198.51.100.45` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| curl-vps-baru | LAP | `curl -sI --resolve toko.example.com:443:198.51.100.45 htt...` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |

### `dasar.json` · konflik-ip-ganda-server-berkas

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| ping-server-berkas | PC1 | `ping -n 8 192.168.20.10` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| arp-pc-ratna | PC1 | `arp -a 192.168.20.10` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| mac-asli-server | NAS | `ip -br link show enp2s0` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| arping-dad | NAS | `sudo arping -D -I enp2s0 -c 3 192.168.20.10` | [IPUTILS] | sesuai | `Unicast reply from`, `Sent N probes (N broadcast(s))` sesuai string arping. |
| cari-mac-9b | SW1 | `show mac address-table address 0000.5e00.539b` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| log-fa014 | SW1 | `show logging \| include 0/14` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| status-samba | NAS | `systemctl status smbd --no-pager` | [SAMBA-UNIT] | sesuai | Description, Docs, ExecStartPre, dan argumen ExecStart cocok dengan unit Samba 4.17 di Debian 12. |
| port-server | SW1 | `show interfaces FastEthernet0/10 \| include line protocol...` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |

### `jaringan.json` · port-akses-masih-vlan-1

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| ipconfig-pc-bambang | PC1 | `ipconfig /all` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ipconfig-laptop-sari | PC2 | `ipconfig` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-isp-dari-router | R1 | `ping 198.51.100.1` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| interface-fa014 | SW1 | `show interfaces FastEthernet0/14` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| interfaces-status | SW1 | `show interfaces status` | [CS-AUTONEG] | sesuai | Judul kolom dan awalan `a-` cocok dengan contoh Cisco. |
| mac-fa014 | SW1 | `show mac address-table interface FastEthernet0/14` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| vlan-brief | SW1 | `show vlan brief` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| switchport-fa014 | SW1 | `show interfaces FastEthernet0/14 switchport` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| config-fa013-fa014 | SW1 | `show running-config \| section FastEthernet0/1[34]` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |

### `jaringan.json` · trunk-belum-izinkan-vlan-baru

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| nvr-ping-kamera-lt2 | NVR | `ping -c 4 10.40.0.24` | [IPUTILS] | sesuai | Ringkasan `+N errors`, `pipe N`, dan baris rtt sesuai string iputils. |
| laptop-ping-kamera | LAPTOP | `ping 10.40.0.24` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| laptop-ping-gateway | LAPTOP | `ping 10.40.0.1` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| lt2-vlan-brief | LT2 | `show vlan brief` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| lt2-trunk | LT2 | `show interfaces trunk` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| lt2-stp-vlan40 | LT2 | `show spanning-tree vlan 40` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| core-trunk | CORE | `show interfaces trunk` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| core-mac-vlan40 | CORE | `show mac address-table vlan 40` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| core-svi | CORE | `show ip interface brief \| include Vlan` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |

### `jaringan.json` · native-vlan-mismatch-switch-pengganti

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| inti-log | INTI | `show logging \| include CDP\|SPANTREE` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| zabbix-ping-poli | ZBX | `ping -c 4 10.99.0.11` | [IPUTILS] | sesuai | Ringkasan `+N errors`, `pipe N`, dan baris rtt sesuai string iputils. |
| inti-trunk | INTI | `show interfaces trunk` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| inti-cdp-lobi | INTI | `show cdp neighbors GigabitEthernet1/0/24 detail` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| inti-inconsistent | INTI | `show spanning-tree inconsistentports` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| inti-int-24 | INTI | `show interfaces GigabitEthernet1/0/24 \| include line pro...` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| inti-vtp | INTI | `show vtp status` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| pc-ping-gateway | PCDAFTAR | `ping 10.10.0.1` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| lobi-trunk | LOBI | `show interfaces trunk` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |

### `jaringan.json` · loop-switch-kecil-bawah-meja

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| pc-rina-ipconfig | PCRINA | `ipconfig` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| sw-cpu | SW | `show processes cpu sorted \| exclude 0.00%  0.00%  0.00%` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| sw-uptime | SW | `show version \| include uptime` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| sw-macflap | SW | `show logging \| include MACFLAP` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| sw-input-rate | SW | `show interfaces \| include is up\|input rate` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| sw-cdp | SW | `show cdp neighbors` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| sw-mac-gi108 | SW | `show mac address-table interface GigabitEthernet1/0/8` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| sw-stp-gi107 | SW | `show spanning-tree interface GigabitEthernet1/0/7 detail` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |

### `jaringan.json` · ospf-exstart-mtu-berbeda

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| mlg-ospf-neighbor | MLG | `show ip ospf neighbor` | [CS-OSPFDBD] | sesuai | Baris judul kolom cocok dengan contoh Cisco; isi baris tidak bisa dibandingkan langsung. |
| batu-ospf-neighbor | BATU | `show ip ospf neighbor` | [CS-OSPFDBD] | sesuai | Baris judul kolom cocok dengan contoh Cisco; isi baris tidak bisa dibandingkan langsung. |
| mlg-ping-batu | MLG | `ping 10.0.17.2` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| mlg-ospf-interface | MLG | `show ip ospf interface GigabitEthernet0/2` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| batu-interfaces-mtu | BATU | `show interfaces FastEthernet0/0 \| include MTU` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| batu-ip-mtu | BATU | `show ip interface FastEthernet0/0 \| include MTU` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| mlg-ip-mtu | MLG | `show ip interface GigabitEthernet0/2 \| include MTU` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| batu-config-gi00 | BATU | `show running-config interface FastEthernet0/0` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| batu-debug-adj | BATU | `debug ip ospf adj` | [CS-OSPFDBD] | diperbaiki | Nomor urut DBD yang diterima BATU dari MLG diganti dari 0x1F4C menjadi 0x0B71: slave (MLG, RID lebih kecil) membalas dengan nomor urut milik master (BATU). Urutan baris `Send DBD` lalu `Retransmitting DBD` disamakan dengan contoh Cisco. Isi diagnosis (mtu 1500 vs 1492, "Nbr ... has larger interface MTU") tidak berubah. |
| mlg-clear-ospf | MLG | `clear ip ospf process` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |

### `jaringan.json` · ospf-timer-hello-berbeda

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| lab-ping-gateway | LAB | `ping 10.31.0.1` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| lab-tracert-siakad | LAB | `tracert -d 10.100.0.20` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| gdc-route | GDC | `show ip route` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| core-ospf-neighbor | CORE | `show ip ospf neighbor` | [CS-OSPFDBD] | sesuai | Baris judul kolom cocok dengan contoh Cisco; isi baris tidak bisa dibandingkan langsung. |
| core-ping-gdc | CORE | `ping 10.1.30.2` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| core-ospf-brief | CORE | `show ip ospf interface brief` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| core-ospf-interface | CORE | `show ip ospf interface GigabitEthernet1/1/3` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| gdc-ospf-interface | GDC | `show ip ospf interface GigabitEthernet0/16` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| gdc-config-gi016 | GDC | `show running-config interface GigabitEthernet0/16` | internal | diperbaiki | `Current configuration : 136 bytes` menjadi 147, disamakan dengan cara hitung dua keluaran `show running-config interface` lain di misi ini (panjang blok `!` sampai `end` plus baris baru). Cara hitung IOS sendiri tidak diverifikasi dari sumber. |
| gdc-ip-mtu | GDC | `show ip interface GigabitEthernet0/16 \| include MTU` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |

### `jaringan.json` · bgp-network-tanpa-rute-cocok

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| edge-bgp-summary | EDGE | `show ip bgp summary` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| noc-curl-web | NOC | `curl -sI http://203.0.113.10` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| edge-bgp-table | EDGE | `show ip bgp` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| edge-advertised | EDGE | `show ip bgp neighbors 198.51.100.9 advertised-routes` | [CS-BGPNOAD] | sesuai | `Total number of prefixes 0` cocok dengan contoh Cisco. |
| lg-prefix | UP | `show ip bgp 203.0.113.0/24` | [CS-BGPNOAD] | tidak bisa diverifikasi dari sumber publik | Dokumen Cisco menampilkan `% Network not in table` untuk `show ip route`; untuk `show ip bgp <prefix>` tidak ada contoh resmi yang terbuka. |
| edge-prefix-list | EDGE | `show ip prefix-list KE-UPSTREAM` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| edge-config-bgp | EDGE | `show running-config \| section router bgp` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| edge-route-203 | EDGE | `show ip route \| include 203.0.113` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |

### `jaringan.json` · routing-asimetris-firewall-stateful

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| pc-ping-wms | PC | `ping 10.30.0.10` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| pc-test-port | PC | `Test-NetConnection 10.30.0.10 -Port 8080` | [MS-TNC] | sesuai | Urutan field cocok dengan contoh Microsoft. |
| pc-ping-mtu | PC | `ping -f -l 1472 10.30.0.10` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| pc-tracert | PC | `tracert -d 10.30.0.10` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| wms-traceroute | WMS | `sudo traceroute -I -n 10.20.0.57` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| fw-conntrack | FW | `conntrack -L -d 10.30.0.10` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| fw-nft-forward | FW | `nft list chain inet filter forward` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| fw-ip-route | FW | `ip route` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| fw-uptime | FW | `uptime` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |

### `layanan.json` · mikrotik-masquerade-isp-baru

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| ipconfig-kasir | PC1 | `ipconfig` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-gateway | PC1 | `ping 192.168.88.1` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| nslookup-kasir | PC1 | `nslookup example.com` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-internet-pc | PC1 | `ping 192.0.2.10` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| tracert-pc | PC1 | `tracert -d 192.0.2.10` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-dari-router | R1 | `/ping 192.0.2.10 count=3` | [MT-PING] | sesuai | Kolom SEQ/HOST/SIZE/TTL/TIME/STATUS dan ringkasan rtt; rata-rata dihitung ulang dan cocok. |
| route-print | R1 | `/ip route print` | [MT-ROUTE] | sesuai | Flags v7 hanya untuk bendera yang tampil; rute dinamis tanpa nomor. |
| nat-print | R1 | `/ip firewall nat print` | [MT-FW] | sesuai | Format v7; angka besar di `print stats` memakai pemisah ribuan berupa spasi. |
| nat-stats | R1 | `/ip firewall nat print stats` | [MT-FW] | sesuai | Format v7; angka besar di `print stats` memakai pemisah ribuan berupa spasi. |
| dns-print | R1 | `/ip dns print` | [MT-DNS] | diperbaiki | `dynamic-servers` dua alamat dicetak satu per baris (bukan dipisah koma), dan ditambah baris `address-list-extra-time` serta `mdns-repeat-ifaces` yang dicetak RouterOS v7 terkini. |

### `layanan.json` · acl-implicit-deny-dns

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| ipconfig-all | PC1 | `ipconfig /all` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-nama | PC1 | `ping rme.example.net` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-ip | PC1 | `ping 192.0.2.80` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| nslookup-udp | PC1 | `nslookup rme.example.net` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| nslookup-tcp | PC1 | `nslookup -vc rme.example.net` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ip-int-brief | R1 | `show ip interface brief` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| rute-default | R1 | `show ip route \| include Gateway\|0.0.0.0` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| acl-terpasang | R1 | `show ip interface GigabitEthernet0/0/0 \| include access ...` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| isi-acl | R1 | `show ip access-lists WAN-IN` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |
| nat-udp | R1 | `show ip nat translations \| include udp` | - | tidak bisa diverifikasi dari sumber publik | Catatan C |

### `layanan.json` · pmtud-black-hole-wireguard

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| dig-portal | L1 | `dig +short portal.example.net` | [DIG] | sesuai | Baris `;; SERVER: ...(...) (UDP)`, `Query time`, `MSG SIZE  rcvd` sesuai BIND 9.18; MSG SIZE 61 dihitung ulang dan cocok. |
| ping-portal | L1 | `ping -c 3 portal.example.net` | [IPUTILS] | sesuai | Ringkasan `+N errors`, `pipe N`, dan baris rtt sesuai string iputils. |
| curl-portal | L1 | `curl -sSv --max-time 20 -o /dev/null https://portal.examp...` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| curl-berita | L1 | `curl -sS -o /dev/null -w '%{http_code} %{size_download}\n...` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| tracepath-portal | L1 | `tracepath -n 203.0.113.45` | [IPUTILS] | sesuai | `[LOCALHOST]`, `pmtu`, `no reply` sesuai string tracepath. |
| mtu-wg-medan | GWM | `ip link show wg0` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| wg-show | GWJ | `sudo wg show wg0` | [WG] | sesuai | Label `listening port`, `allowed ips`, `latest handshake`, `transfer` sesuai wireguard-tools. |
| tcpdump-jakarta | GWJ | `sudo tcpdump -ni enp1s0 host 203.0.113.45` | [TCPDUMP] | sesuai | Pesan ICMP `unreachable - need to frag (mtu N)` dan baris `listening on` sesuai versi tcpdump distro (4.9 `capture size`, 4.99 `snapshot length`). |
| nft-forward | GWJ | `sudo nft list chain inet filter forward` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| uptime-jakarta | GWJ | `uptime` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |

### `layanan.json` · wifi-kanal-24ghz-sama

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| netsh-interfaces | L1 | `netsh wlan show interfaces` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-wifi | L1 | `ping -n 10 192.168.10.1` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-kabel | PC1 | `ping -n 10 192.168.10.1` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| unduh-kabel | PC1 | `curl -s -o NUL -w "%{speed_download}\n" http://unduh.exam...` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| nslookup-sari | L1 | `nslookup example.com` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| nmcli-scan | L2 | `nmcli dev wifi list` | [NMCLI] | sesuai | Kolom IN-USE ... BARS sesuai nmcli; jumlah bar cocok dengan ambang SIGNAL. |
| survey-kanal | L2 | `iw dev wlx00c0cab1e2f3 survey dump \| grep -A5 'in use'` | [IW] | sesuai | Label survey sesuai kode iw. |

### `layanan.json` · ntp-jam-mundur-tls

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| curl-server | SRV | `curl -sS https://api.example.net/v1/status` | [CURL] | sesuai | Teks galat (60) dan paragraf `curl failed to verify ...` sesuai kode curl. |
| dig-api | SRV | `dig +short api.example.net` | [DIG] | sesuai | Baris `;; SERVER: ...(...) (UDP)`, `Query time`, `MSG SIZE  rcvd` sesuai BIND 9.18; MSG SIZE 61 dihitung ulang dan cocok. |
| ping-api | SRV | `ping -c 3 api.example.net` | [IPUTILS] | sesuai | Ringkasan `+N errors`, `pipe N`, dan baris rtt sesuai string iputils. |
| tanggal-sertifikat | SRV | `echo \| openssl s_client -connect api.example.net:443 -se...` | [OPENSSL] | sesuai | OpenSSL 3.0 memakai `oneline` sehingga `subject=CN = ...` berspasi. |
| curl-laptop | ADM | `curl -sI https://api.example.net/v1/status` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| timedatectl | SRV | `timedatectl` | [TIMEDATECTL] | sesuai | Label field sesuai systemd. |
| chrony-sources | SRV | `chronyc sources -v` | [CHRONY] | sesuai | Legenda `-v` dan judul kolom sesuai kode chronyc. |
| ping-ntp-lama | SRV | `ping -c 3 192.168.1.5` | [IPUTILS] | sesuai | Ringkasan `+N errors`, `pipe N`, dan baris rtt sesuai string iputils. |
| ip-br-a | SRV | `ip -br a` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |

### `layanan.json` · sertifikat-internal-kedaluwarsa

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| ping-absensi | L1 | `ping absensi.example.org` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| nslookup-absensi | L1 | `nslookup absensi.example.org` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| port-443 | L1 | `Test-NetConnection absensi.example.org -Port 443` | [MS-TNC] | sesuai | Urutan field cocok dengan contoh Microsoft. |
| date-teknisi | L2 | `date` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| curl-absensi | L2 | `curl -sS https://absensi.example.org/` | [CURL] | sesuai | Teks galat (60) dan paragraf `curl failed to verify ...` sesuai kode curl. |
| tanggal-sertifikat | L2 | `echo \| openssl s_client -connect absensi.example.org:443...` | [OPENSSL] | sesuai | OpenSSL 3.0 memakai `oneline` sehingga `subject=CN = ...` berspasi. |
| status-nginx | SRV | `systemctl status nginx --no-pager` | [NGINX-UNIT] | diperbaiki | Ditambah dua baris `Process:` (ExecStartPre `nginx -t -q` dan ExecStart) yang dicetak systemctl untuk unit `Type=forking` nginx di Ubuntu 24.04. |
| berkas-sertifikat | SRV | `sudo openssl x509 -in /etc/nginx/ssl/absensi.crt -noout -...` | [OPENSSL] | sesuai | OpenSSL 3.0 memakai `oneline` sehingga `subject=CN = ...` berspasi. |

### `layanan.json` · rp-filter-dua-nic

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| ping-mgmt | MON | `ping -c 3 10.20.20.15` | [IPUTILS] | sesuai | Ringkasan `+N errors`, `pipe N`, dan baris rtt sesuai string iputils. |
| ping-prod | MON | `ping -c 3 10.10.10.15` | [IPUTILS] | sesuai | Ringkasan `+N errors`, `pipe N`, dan baris rtt sesuai string iputils. |
| ping-dari-backup | BKP | `ping -c 3 10.20.20.15` | [IPUTILS] | sesuai | Ringkasan `+N errors`, `pipe N`, dan baris rtt sesuai string iputils. |
| ip-br-a | DB | `ip -br a` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| ip-route | DB | `ip route` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| tcpdump-ens224 | DB | `sudo tcpdump -ni ens224 host 10.30.0.5` | [TCPDUMP] | sesuai | Pesan ICMP `unreachable - need to frag (mtu N)` dan baris `listening on` sesuai versi tcpdump distro (4.9 `capture size`, 4.99 `snapshot length`). |
| firewalld-internal | DB | `sudo firewall-cmd --zone=internal --list-all` | [FIREWALLD] | diperbaiki | Ditambah baris `forward: no` di antara `protocols:` dan `masquerade:`; firewalld 0.9.x (Rocky Linux 8) mencetaknya untuk setiap zona. |
| agent-aktif | DB | `systemctl is-active zabbix-agent2` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| sysctl-rp-filter | DB | `sysctl net.ipv4.conf.all.rp_filter net.ipv4.conf.ens224.r...` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| route-get-iif | DB | `ip route get 10.20.20.15 from 10.30.0.5 iif ens224` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |
| nstat-rpfilter | DB | `nstat -az TcpExtIPReversePathFilter` | - | tidak bisa diverifikasi dari sumber publik | Catatan L |

### `layanan.json` · mikrotik-urutan-filter-input

| Langkah | Perangkat | Perintah | Diperiksa terhadap | Status | Catatan |
|---|---|---|---|---|---|
| ping-ip-internet | PC1 | `ping 192.0.2.10` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| nslookup-router | PC1 | `nslookup example.com` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| nslookup-isp | PC1 | `nslookup example.com 203.0.113.53` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ipconfig-staf | PC1 | `ipconfig /all` | - | tidak bisa diverifikasi dari sumber publik | Catatan W |
| ping-dari-router | R1 | `/ping 203.0.113.53 count=3` | [MT-PING] | sesuai | Kolom SEQ/HOST/SIZE/TTL/TIME/STATUS dan ringkasan rtt; rata-rata dihitung ulang dan cocok. |
| route-print | R1 | `/ip route print` | [MT-ROUTE] | sesuai | Flags v7 hanya untuk bendera yang tampil; rute dinamis tanpa nomor. |
| dns-print | R1 | `/ip dns print` | [MT-DNS] | diperbaiki | `servers` dua alamat dicetak satu per baris, ditambah `address-list-extra-time` dan `mdns-repeat-ifaces`. |
| nat-stats | R1 | `/ip firewall nat print stats` | [MT-FW] | sesuai | Format v7; angka besar di `print stats` memakai pemisah ribuan berupa spasi. |
| filter-print | R1 | `/ip firewall filter print` | [MT-FW] | sesuai | Format v7; angka besar di `print stats` memakai pemisah ribuan berupa spasi. |
| filter-stats | R1 | `/ip firewall filter reset-counters-all ; :delay 60s ; /ip...` | [MT-FW] | sesuai | Format v7; angka besar di `print stats` memakai pemisah ribuan berupa spasi. |
| log-drop | R1 | `/ip firewall filter set 0 log=yes log-prefix=WAN-DROP ; :...` | [MT-LOG] [MT-FW] | diperbaiki | Cap waktu log diberi tanggal ISO (`2026-10-15 08:52:40`), sesuai `/log print` v7 terkini dan sama dengan misi pool DHCP. Isi pesan firewall (format `in:... out:(unknown 0), connection-state:...`) sudah sesuai contoh resmi dan tidak diubah. |

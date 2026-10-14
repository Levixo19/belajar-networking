# 19.10 — User Manager dan RADIUS (MTCUME)

> **Prasyarat:** `19-mikrotik/04-qos-queue-hotspot` (hotspot, simple queue), `19-mikrotik/06-vpn-tunnel` (PPPoE server, PPP profile), `12-keamanan/04-aaa-identitas` (konsep AAA, RADIUS vs TACACS+)
> **Tujuan:** Anda bisa menjelaskan cara kerja RADIUS sampai tingkat paket (kode, authenticator, atribut, accounting, CoA/Disconnect), membangun server User Manager v7 dengan profile dan limitation, menghubungkan PPPoE server dan Hotspot ke server itu, membuat voucher dan billing sederhana untuk RT-RW Net atau kafe, memakai FreeRADIUS sebagai alternatif, mengamankan jalur RADIUS, dan mendiagnosis kegagalan autentikasi secara sistematis.

---

## 1. Kenapa AAA Harus Terpusat

Bayangkan RT-RW Net yang tumbuh dari 30 rumah menjadi 400 rumah. Awalnya satu hAP di pos ronda cukup: setiap pelanggan dibuatkan `/ppp secret`, paket ditentukan oleh `/ppp profile`, selesai. Lalu jaringan dipecah menjadi tiga router PPPoE (satu per RW) dan dua lokasi hotspot kafe. Masalah mulai bermunculan:

- Pelanggan pindah rumah dari RW 02 ke RW 05. Akunnya harus dihapus di satu router dan dibuat lagi di router lain.
- Admin menaikkan paket Bu Sari dari 10 Mbps ke 20 Mbps, tetapi lupa bahwa Bu Sari juga punya akun cadangan di router kedua.
- Tidak ada catatan berapa lama dan berapa banyak data yang dipakai tiap pelanggan, sehingga keluhan "kuota saya habis padahal jarang pakai" tidak bisa dijawab.
- Voucher kafe dibuat manual di tiap router, dan voucher yang sama bisa dipakai di dua lokasi sekaligus.

Jawaban untuk semua masalah itu adalah memindahkan basis data pengguna ke satu server dan membiarkan router hanya menjadi "penjaga pintu". Pola ini disebut **AAA**:

| Huruf | Pertanyaan | Contoh di RT-RW Net |
|---|---|---|
| **Authentication** | Siapa Anda? | Username `budi` dan password cocok |
| **Authorization** | Apa yang boleh Anda lakukan? | Kecepatan 10 Mbps, alamat dari pool tertentu, maksimal satu sesi |
| **Accounting** | Apa yang sudah Anda lakukan? | Sesi mulai 19.02, berakhir 23.40, unduh 3,2 GB |

Konsep umum AAA dan perbandingan RADIUS dengan TACACS+ sudah dibahas di `12-keamanan/04-aaa-identitas`. Modul ini fokus pada sisi operator: bagaimana RouterOS berbicara RADIUS, bagaimana User Manager v7 menyimpan "produk" yang Anda jual, dan bagaimana semua itu dihubungkan ke PPPoE dan Hotspot.

Tiga peran yang akan terus muncul:

```
 Pelanggan              NAS (router MikroTik)                Server RADIUS
 (supplicant)           (RADIUS client)                      (User Manager / FreeRADIUS)
 ┌──────────┐  PPPoE/   ┌─────────────────────┐   UDP 1812   ┌──────────────────────┐
 │ modem    │  HTTP     │ PPPoE server        │ ───────────▶ │ basis data user,     │
 │ laptop   │ ────────▶ │ Hotspot             │ ◀─────────── │ profile, limitation, │
 │ HP       │  login    │ /radius (klien)     │   UDP 1813   │ sesi, accounting     │
 └──────────┘           │ /radius incoming    │ ◀─────────── │ CoA/Disconnect       │
                        └─────────────────────┘   UDP 3799   └──────────────────────┘
```

**NAS** (Network Access Server) adalah istilah RADIUS untuk perangkat yang menerima pengguna, dalam kasus kita router MikroTik yang menjalankan PPPoE server atau Hotspot. Pelanggan tidak pernah berbicara langsung dengan server RADIUS. Ia hanya berbicara PPP atau HTTP dengan NAS, dan NAS-lah yang bertanya ke server.

---

## 2. Protokol RADIUS di Tingkat Paket

RADIUS didefinisikan di RFC 2865 (autentikasi dan otorisasi) dan RFC 2866 (accounting). Ia berjalan di atas **UDP**: port **1812** untuk autentikasi dan **1813** untuk accounting. Implementasi lama memakai 1645 dan 1646, dan RFC 2865 sendiri mencatat bahwa port lama itu bentrok dengan layanan lain sehingga 1812 menjadi port resmi.

### 2.1 Format paket

Setiap paket RADIUS punya kepala 20 oktet yang tetap, diikuti daftar atribut:

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
┌───────────────┬───────────────┬───────────────────────────────┐
│     Code      │  Identifier   │            Length             │
├───────────────┴───────────────┴───────────────────────────────┤
│                                                               │
│                Authenticator (16 oktet)                       │
│                                                               │
├───────────────┬───────────────┬───────────────────────────────┤
│  Attr Type    │  Attr Length  │  Attr Value ...               │
└───────────────┴───────────────┴───────────────────────────────┘
```

- **Code** (1 oktet): jenis paket. Nilainya ada di tabel di bawah.
- **Identifier** (1 oktet): pencocok permintaan dan balasan. Karena hanya 8 bit, satu pasangan NAS dan server hanya bisa punya 256 permintaan "terbang" per port sumber.
- **Length** (2 oktet): panjang total. RFC 2865 menetapkan minimum 20 dan maksimum 4096 oktet.
- **Authenticator** (16 oktet): di permintaan berisi angka acak (Request Authenticator); di balasan berisi tanda tangan (Response Authenticator).
- **Atribut**: format TLV (Type, Length, Value). Atribut khusus vendor memakai Type 26 (Vendor-Specific) dengan nomor vendor di dalamnya. Nomor vendor MikroTik adalah **14988**.

| Code | Nama | Arah | Sumber |
|---|---|---|---|
| 1 | Access-Request | NAS ke server | RFC 2865 |
| 2 | Access-Accept | server ke NAS | RFC 2865 |
| 3 | Access-Reject | server ke NAS | RFC 2865 |
| 4 | Accounting-Request | NAS ke server | RFC 2866 |
| 5 | Accounting-Response | server ke NAS | RFC 2866 |
| 11 | Access-Challenge | server ke NAS | RFC 2865 |
| 40 | Disconnect-Request | server ke NAS | RFC 5176 |
| 41 / 42 | Disconnect-ACK / Disconnect-NAK | NAS ke server | RFC 5176 |
| 43 | CoA-Request | server ke NAS | RFC 5176 |
| 44 / 45 | CoA-ACK / CoA-NAK | NAS ke server | RFC 5176 |

### 2.2 Shared secret dan authenticator

RADIUS tidak mengenkripsi seluruh paket. Yang dilindungi hanya dua hal, dan keduanya bergantung pada **shared secret**, yaitu string yang dikonfigurasi sama di NAS dan di server:

1. **Password PAP disembunyikan.** RFC 2865 bagian 5.2 menjelaskan: password diberi padding hingga kelipatan 16 oktet, lalu di-XOR dengan `MD5(secret + Request Authenticator)` untuk blok pertama, dan `MD5(secret + blok sandi sebelumnya)` untuk blok berikutnya. Artinya username, alamat, dan atribut lain tetap terlihat polos bagi siapa pun yang menyadap.
2. **Balasan ditandatangani.** Response Authenticator dihitung sebagai `MD5(Code + ID + Length + RequestAuth + Attributes + Secret)` (RFC 2865 bagian 3). NAS menghitung ulang nilai itu. Kalau tidak cocok, balasan dibuang.

Untuk CHAP dan MS-CHAP, password tidak dikirim sama sekali. NAS meneruskan challenge dan response yang diterimanya dari klien, dan server memverifikasinya dengan password yang ia simpan. Konsekuensinya penting untuk troubleshooting: dokumentasi RouterOS mencatat bahwa pada CHAP dan MS-CHAP, secret yang salah tidak membuat server menolak, tetapi membuat router menolak balasan server.

### 2.3 Message-Authenticator dan BlastRADIUS

RFC 3579 menambahkan atribut **Message-Authenticator** (Type 80, panjang 18 oktet) yang berisi HMAC-MD5 atas seluruh paket. Awalnya ia wajib hanya untuk EAP. Pada Juli 2024 dipublikasikan serangan yang dikenal sebagai **BlastRADIUS** (CVE-2024-3596): penyerang yang berada di tengah jalur bisa memalsukan Access-Accept dengan memanfaatkan tabrakan MD5 pada Response Authenticator. Mitigasinya adalah mewajibkan Message-Authenticator di semua paket autentikasi.

Di sisi RouterOS, changelog versi 7.15 mencatat opsi baru `require-message-auth` (mewajibkan Message-Authenticator di Access-Accept, Challenge, dan Reject yang diterima) dan bahwa Message-Authenticator kini disertakan di semua pesan RADIUS kecuali accounting. Di CHR 7.24.5 yang dipakai untuk lab modul ini, klien `/radius` punya `require-message-auth` dengan nilai bawaan `yes-for-request-resp`, dan User Manager menampilkan `require-message-auth: yes-access-request`. Efek sampingnya akan Anda lihat di bagian troubleshooting: secret yang salah kini sering tampil sebagai **timeout**, bukan sebagai balasan yang ditolak.

### 2.4 Alur satu kali login PPPoE

```
Modem budi            NAS (PPPoE server)                  User Manager
    │  PADI/PADO/PADR/PADS  │                                   │
    │◀─────────────────────▶│                                   │
    │  LCP, lalu MS-CHAPv2  │                                   │
    │  response             │                                   │
    │──────────────────────▶│ Access-Request id=16              │
    │                       │  User-Name=budi                   │
    │                       │  MS-CHAP2-Response=...            │
    │                       │  NAS-Port-Type=Ethernet(15)       │
    │                       │  Calling-Station-Id=MAC modem     │
    │                       │  Message-Authenticator=...        │
    │                       │──────────────────────────────────▶│ cek user, profile,
    │                       │                                   │ limitation, sesi aktif
    │                       │ Access-Accept                     │
    │                       │  Framed-Pool=pool-pppoe           │
    │                       │  Mikrotik-Rate-Limit=3M/10M       │
    │                       │◀──────────────────────────────────│
    │  IPCP: alamat dari    │ buat antarmuka <pppoe-budi>,      │
    │  pool-pppoe           │ queue dinamis 3M/10M              │
    │◀──────────────────────│ Accounting-Request (Start)        │
    │                       │──────────────────────────────────▶│ catat sesi
    │                       │ Accounting-Request (Interim) tiap │
    │                       │ interim-update ...                │
```

Perhatikan bahwa queue untuk pelanggan tidak Anda buat. NAS membuatnya sendiri dari atribut `Mikrotik-Rate-Limit`. Inilah inti otorisasi: server memutuskan, NAS menegakkan.

---

## 3. Atribut yang Benar-benar Dipakai di MikroTik

RouterOS mendukung puluhan atribut. Tabel ini memuat yang paling sering Anda pakai di RT-RW Net dan hotspot, diringkas dari halaman RADIUS di dokumentasi MikroTik:

| Atribut | Tipe | Efek di NAS RouterOS |
|---|---|---|
| `Framed-IP-Address` (8) | Accept | Alamat tetap untuk klien. Mengalahkan `Framed-Pool`. |
| `Framed-Pool` (88) | Accept | Nama `/ip pool` di **NAS** tempat alamat diambil. Pool harus ada di NAS. |
| `Session-Timeout` (27) | Accept | Lama maksimum sesi, menimpa `session-timeout` profil. |
| `Idle-Timeout` (28) | Accept | Putus bila tidak ada trafik selama nilai ini. |
| `Port-Limit` (62) | Accept | Jumlah sesi simultan untuk username yang sama (hotspot: menimpa `shared-users`). |
| `Class` (25) | Accept | "Cookie" dari server, dikembalikan apa adanya di accounting. |
| `Filter-Id` (11) | Accept | Nama chain firewall. NAS membuat aturan jump dinamis di chain `ppp` atau `hotspot`. |
| `Acct-Interim-Interval` (85) | Accept | Interval interim update dari server. |
| `Mikrotik-Rate-Limit` (14988:8) | Accept | Batas kecepatan, menjadi simple queue dinamis. |
| `Mikrotik-Group` (14988:3) | Accept | Nama profil lokal: PPP profile untuk PPP, user profile untuk Hotspot. |
| `Mikrotik-Address-List` (14988:19) | Accept | Memasukkan alamat klien ke address-list. |
| `Mikrotik-Recv-Limit`, `Mikrotik-Xmit-Limit` (14988:1, 2) | Accept | Batas total byte per sesi. |
| `Calling-Station-Id` (31) | Request | PPPoE dan Hotspot: MAC klien huruf kapital. |
| `Called-Station-Id` (30) | Request | PPPoE: service name. Hotspot: nama server hotspot. |
| `NAS-Port-Type` (61) | Request | PPPoE: `Ethernet`. Hotspot: sesuai `nas-port-type` di profil hotspot (bawaan `wireless-802.11`). |

### 3.1 Format Mikrotik-Rate-Limit

Format lengkapnya (sama dengan `rate-limit` di PPP profile dan hotspot user profile):

```
rx-rate[/tx-rate] [rx-burst-rate[/tx-burst-rate] [rx-burst-threshold[/tx-burst-threshold]
[rx-burst-time[/tx-burst-time] [priority] [rx-rate-min[/tx-rate-min]]]]
```

Kata kuncinya adalah **sudut pandang router**. `rx` adalah yang diterima router dari klien, jadi **upload pelanggan**. `tx` adalah yang dikirim router ke klien, jadi **download pelanggan**. Contoh:

| Nilai | Arti |
|---|---|
| `3M/10M` | upload 3 Mbps, download 10 Mbps |
| `2M/5M 4M/10M 1500k/4M 16/16` | normal 2/5 Mbps, burst sampai 4/10 Mbps selama rata-rata 16 detik di bawah 1,5/4 Mbps |
| `3M/10M 0/0 0/0 0/0 5 1M/2M` | prioritas 5 dan jaminan (limit-at) 1/2 Mbps |

Bila burst-rate diberikan tanpa threshold, rate normal dipakai sebagai threshold. Bila burst-time tidak diberikan, nilainya 1 detik. Logika burst sendiri sudah dibahas di `19-mikrotik/04-qos-queue-hotspot`.

### 3.2 Aturan prioritas di NAS

Dua aturan dari dokumentasi RouterOS ini sering menjelaskan perilaku yang membingungkan:

1. **Basis data lokal dicek lebih dulu.** RADIUS hanya ditanya bila username tidak ditemukan di `/ppp secret` atau `/ip hotspot user`. Akun lama yang tertinggal di router akan selalu menang.
2. **Atribut dari server menimpa profil default, sisanya diambil dari profil.** Kalau server tidak mengirim `Framed-Pool`, NAS memakai `remote-address` dari profil default layanan itu. Kalau profil default juga kosong, klien tidak mendapat alamat.

Untuk kecepatan, urutannya: `Mikrotik-Rate-Limit` paling kuat, lalu atribut `Ascend-Data-Rate`, lalu atribut WISPr.

---

## 4. Accounting: Siapa Memakai Apa

RFC 2866 mendefinisikan Accounting-Request dengan atribut wajib **Acct-Status-Type** (Type 40):

| Nilai | Nama | Kapan dikirim |
|---|---|---|
| 1 | Start | Sesi baru saja dibuat |
| 2 | Stop | Sesi berakhir, membawa total pemakaian dan alasan |
| 3 | Interim-Update | Berkala selama sesi hidup |
| 7 / 8 | Accounting-On / Accounting-Off | NAS menyala atau dimatikan |

Paket Stop dan Interim membawa `Acct-Session-Time`, `Acct-Input-Octets`, `Acct-Output-Octets`, serta `Acct-Input-Gigawords` dan `Acct-Output-Gigawords` untuk menampung lebih dari 4 GiB (bit 32 sampai 63). Paket Stop juga membawa `Acct-Terminate-Cause`. Dalam lab modul ini, ketika User Manager memutus pelanggan karena kuota habis, NAS mencatat `Acct-Terminate-Cause = 10`, yang di RFC 2866 berarti NAS-Request.

Dokumentasi RouterOS memberi satu peringatan arah: di paket accounting, "output" adalah trafik dari sudut pandang **klien**. Untuk pengguna VPN, output berarti upload pengguna. Jangan tertukar dengan konvensi `rx/tx` di rate-limit.

### 4.1 Mengapa interim update penting

Tanpa interim update, server hanya tahu pemakaian ketika sesi berakhir. Pelanggan PPPoE yang tersambung terus selama 20 hari akan terlihat "nol byte" sampai modemnya mati. Akibatnya:

- Limitation kuota di User Manager tidak bisa memutus pelanggan tepat waktu.
- Laporan pemakaian harian tidak bisa dibuat.
- Sesi "hantu" (NAS mati mendadak tanpa Stop) tidak bisa dideteksi dari `last-accounting-packet`.

Di RouterOS, interval diatur di tiga tempat:

```routeros
# PPP: berlaku untuk semua layanan PPP (PPPoE, L2TP, SSTP, ...)
/ppp aaa set accounting=yes interim-update=5m

# Hotspot: per profil server hotspot
/ip hotspot profile set hsprof-kafe radius-accounting=yes radius-interim-update=5m

# Atau biarkan server yang menentukan lewat Acct-Interim-Interval
/ip hotspot profile set hsprof-kafe radius-interim-update=received
```

💡 Lima menit adalah kompromi yang masuk akal untuk 100 sampai 1.000 pelanggan. Interval satu menit membuat server menerima ribuan paket per menit dan basis data User Manager di flash tumbuh cepat. Interval satu jam membuat kuota bisa terlampaui jauh sebelum pemutusan.

---

## 5. CoA dan Disconnect: Server yang Bisa Menegur

RADIUS klasik bersifat tanya-jawab: server hanya berbicara bila NAS bertanya. RFC 5176 (Dynamic Authorization Extensions) membalik arah itu. Server boleh mengirim:

- **Disconnect-Request** (Code 40): "putuskan sesi ini sekarang". Dijawab Disconnect-ACK (41) atau Disconnect-NAK (42).
- **CoA-Request** (Code 43): "ubah otorisasi sesi ini tanpa memutus". Dijawab CoA-ACK (44) atau CoA-NAK (45).

Port standar RFC 5176 adalah **UDP 3799**. Paket diidentifikasi ke sesi lewat atribut seperti `User-Name`, `Acct-Session-Id`, atau `Framed-IP-Address`.

### 5.1 Di RouterOS

Penerima CoA di RouterOS adalah menu `/radius incoming`:

```routeros
/radius incoming set accept=yes port=3799
```

⚠️ **Jangan mengandalkan nilai bawaan.** `accept` bawaan `/radius incoming` adalah `no`, jadi tanpa perintah di atas NAS mengabaikan semua CoA. Untuk port, halaman RADIUS di dokumentasi RouterOS masih menulis bawaan **1700**, tetapi router CHR 7.24.5 yang baru dipasang di lab modul ini menampilkan `port: 3799` pada `/radius incoming print`, sama dengan `coa-port` bawaan di `/user-manager router` dan dengan RFC 5176. Karena sumber resmi dan perilaku nyata tidak sama, dan perangkat lama atau server RADIUS lain bisa memakai 1700, setel port secara eksplisit di kedua sisi dan periksa dengan `/radius incoming print`. Modul ini memakai 3799.

NAS hanya menerima CoA dari alamat yang terdaftar di `/radius` dengan secret yang sama. Paket dari alamat lain dihitung sebagai `bad-requests` dan tidak dijawab.

Atribut yang boleh diubah lewat CoA menurut dokumentasi RouterOS: `Mikrotik-Group`, `Mikrotik-Recv-Limit`, `Mikrotik-Xmit-Limit`, `Mikrotik-Rate-Limit`, `Ascend-Data-Rate` dan `Ascend-Xmit-Rate` (bila Rate-Limit tidak ada), `Mikrotik-Mark-Id`, `Filter-Id`, `Mikrotik-Advertise-Url`, `Mikrotik-Advertise-Interval`, `Session-Timeout`, `Idle-Timeout`, dan `Port-Limit`. **Alamat IP, pool, dan rute tidak bisa diubah lewat CoA**; untuk itu sesi harus diputus dulu.

### 5.2 Hasil uji di lab

Dengan `radclient` (bagian dari FreeRADIUS) yang dijalankan di kontainer Alpine, CoA berikut dikirim ke NAS CHR 7.24.5 saat pelanggan `budi` sedang tersambung dengan paket 3M/10M:

```
$ echo 'User-Name=budi,Mikrotik-Rate-Limit="5M/20M"' | radclient -x 127.0.0.1:13799 coa "Lab-Rahasia-RADIUS-2026"
Sent CoA-Request Id 9 from 0.0.0.0:52067 to 127.0.0.1:13799 length 40
	User-Name = "budi"
	Mikrotik-Rate-Limit = "5M/20M"
Received CoA-ACK Id 9 from 127.0.0.1:13799 to 127.0.0.1:52067 length 38
	Message-Authenticator = 0x7764673da02fb45cd0725abfbf28895b
```

Queue dinamis di NAS langsung berubah tanpa memutus sesi:

```
[admin@NAS] > /queue simple print
Flags: D - DYNAMIC
0 D name="<pppoe-budi>" target=<pppoe-budi> parent=none packet-marks=""
    priority=8/8 queue=default-small/default-small limit-at=5M/20M
    max-limit=5M/20M burst-limit=0/0 burst-threshold=0/0 burst-time=0s/0s
```

Disconnect untuk sesi yang ada dijawab ACK. Disconnect untuk username yang tidak sedang aktif dijawab NAK:

```
Received Disconnect-ACK Id 91 ...
(0) -: Expected Disconnect-ACK got Disconnect-NAK
Received Disconnect-NAK Id 188 ...
	Error-Cause = Unsupported-Extension
```

```
[admin@NAS] > /radius incoming monitor once
      requests: 3
  bad-requests: 1
          acks: 2
          naks: 1
```

`bad-requests: 1` di atas berasal dari percobaan pertama, sebelum alamat pengirim didaftarkan di `/radius`. Itulah gejala khas CoA yang "tidak berbuat apa-apa".

💡 Pemakaian CoA yang paling berguna di RT-RW Net: menurunkan kecepatan pelanggan yang menunggak menjadi 512k/512k dan mengalihkan web-nya ke halaman tagihan (lewat `Mikrotik-Address-List` atau `Filter-Id`), tanpa harus menunggu modem pelanggan reconnect.

---

## 6. RADIUS Client di RouterOS

Satu entri `/radius` mendeskripsikan satu server. Urutan entri penting: RouterOS mencoba server sesuai urutan daftar untuk layanan yang cocok.

```routeros
/radius add address=10.99.0.2 secret="Lab-Rahasia-RADIUS-2026" \
    service=ppp,hotspot src-address=10.99.0.1 timeout=1s comment="UM"
```

| Properti | Catatan praktik |
|---|---|
| `service` | `ppp`, `hotspot`, `login`, `wireless`, `dhcp`, `ipsec`, `dot1x`. Satu entri boleh beberapa layanan. |
| `address` | Bisa ditulis `alamat@vrf` bila server ada di VRF manajemen. |
| `src-address` | Tetapkan. Tanpa ini, alamat sumber mengikuti rute keluar dan bisa berubah saat failover, lalu server menolak karena NAS tidak dikenal. |
| `timeout` | Bawaan 1100ms. Dokumentasi User Manager menyarankan 1s bila User Manager perlu memutus sesi lama sebelum menerima sesi baru. |
| `protocol` | `udp` atau `radsec`. Dengan RadSec, RouterOS memaksa secret menjadi string `radsec` (RFC 6614). |
| `accounting-backup` | Menandai server cadangan khusus accounting. |
| `realm`, `domain` | Untuk pemisahan per domain (`user@domain`). |

Setelah klien dibuat, layanan harus diminta memakainya. Tanpa langkah ini, entri `/radius` diam saja:

```routeros
/ppp aaa set use-radius=yes accounting=yes interim-update=5m
/ip hotspot profile set hsprof-kafe use-radius=yes
/user aaa set use-radius=yes default-group=read     # login admin ke router via RADIUS
```

Statistik klien adalah alat diagnosis pertama:

```
[admin@NAS] > /radius monitor 0 once
           pending: 0
          requests: 5
           accepts: 5
           rejects: 0
           resends: 0
          timeouts: 0
       bad-replies: 0
  last-request-rtt: 10ms
```

---

## 7. User Manager v7: Arsitektur

**User Manager** adalah server RADIUS buatan MikroTik yang berjalan di RouterOS sebagai paket terpisah (`user-manager-<versi>.npk`). Di RouterOS v7 ia ditulis ulang total; changelog 7.1 mencatat "completely new User Manager implementation". Dokumentasinya menyebut dukungan PAP, CHAP, MS-CHAP, MS-CHAPv2, EAP-TLS, EAP-TTLS, dan EAP-PEAP, serta RadSec sejak 7.21.

### 7.1 Model data

```
                 ┌──────────────┐
                 │   router     │  NAS yang boleh bertanya (alamat, secret, coa-port)
                 └──────────────┘
 ┌──────────────┐        ┌──────────────┐      ┌──────────────────────┐
 │ user group   │◀───────│    user      │─────▶│    user-profile      │
 │ outer/inner  │ group  │ name, pass,  │      │ user + profile,      │
 │ auth, atribut│        │ shared-users │      │ state, end-time      │
 └──────────────┘        └──────────────┘      └──────────┬───────────┘
                                │ sesi                     │ profile
                                ▼                          ▼
                         ┌──────────────┐      ┌──────────────────────┐
                         │   session    │      │       profile        │
                         │ start/interim│      │ validity, starts-when│
                         │ /stop, byte  │      │ price, name-for-users│
                         └──────────────┘      └──────────┬───────────┘
                                                          │ profile-limitation
                                                          │ (hari, jam)
                                                          ▼
                                               ┌──────────────────────┐
                                               │     limitation       │
                                               │ rate, kuota, uptime, │
                                               │ reset harian/bulanan │
                                               └──────────────────────┘
```

Cara membacanya dalam bahasa bisnis:

- **Limitation** adalah aturan teknis yang bisa dipakai ulang: "10 Mbps", "kuota 2 GB per hari", "maksimal 2 jam".
- **Profile** adalah produk yang dijual: "Paket Rumah 10 Mbps, 30 hari, Rp150.000". Satu profile bisa memakai beberapa limitation sekaligus.
- **Profile-limitation** menghubungkan keduanya, lengkap dengan hari dan jam berlaku. Inilah cara membuat "kuota terpisah untuk siang dan malam".
- **User** adalah identitas login. **User group** memberi atribut bersama (misalnya pool alamat) dan metode autentikasi yang diizinkan.
- **User-profile** adalah "pembelian": user X memegang profile Y. Satu user bisa memegang beberapa profile antre; ketika satu habis, yang berikutnya aktif tanpa memutus sesi.

### 7.2 Perbedaan dengan User Manager v6

Bila Anda membaca tutorial lama, Anda akan bertemu istilah **customer**. Di User Manager v6, customer adalah akun penyedia layanan (bertingkat, punya sub-customer, punya pengaturan PayPal dan Authorize.Net sendiri) yang login ke antarmuka web untuk mengelola user. Konsep itu **tidak ada lagi di v7**. Pengelolaan dilakukan oleh admin RouterOS biasa, sedangkan antarmuka `/um/` di v7 dipakai pelanggan untuk melihat statistik dan membeli profile.

Perintah migrasi `/user-manager database migrate-legacy-db` mengonversi users, profiles, user-profiles, limitations, profile-limitations, user-counters, routers, dan sessions dari folder `user-manager` lama. Customer tidak ada di daftar itu.

### 7.3 Batas lisensi

User Manager dibatasi tingkat lisensi RouterOS. Tabel lisensi di dokumentasi MikroTik mencantumkan jumlah **sesi aktif** User Manager per level, dan juga jumlah pengguna Hotspot aktif:

| Level lisensi | 3 | 4 | 5 | 6 |
|---|---|---|---|---|
| User Manager active sessions | 10 | 20 | 50 | tidak terbatas |
| HotSpot active users | 1 | 200 | 500 | tidak terbatas |
| PPPoE tunnels | 200 | 200 | 500 | tidak terbatas |

⚠️ Angka ini sering mengejutkan. Router level 4 (misalnya banyak seri hAP dan RB) hanya bisa melayani 20 sesi aktif User Manager. Untuk RT-RW Net 200 pelanggan, User Manager harus berjalan di perangkat level 6 (seri CCR umumnya) atau di CHR, atau Anda memakai FreeRADIUS. Dokumentasi menyatakan tabel level ini tidak berlaku untuk CHR; CHR punya skema lisensi sendiri yang membatasi kecepatan per antarmuka (free 1 Mbit, P1 1 Gbit, P10 10 Gbit, P-Unlimited tanpa batas). Selalu periksa tabel lisensi terbaru sebelum membeli perangkat.

### 7.4 Memasang paket

User Manager tidak ada di paket `routeros` dasar. Dua cara:

1. **Manual** (semua versi v7): unduh arsip "extra packages" untuk arsitektur perangkat Anda dari halaman unduhan MikroTik, unggah `user-manager-<versi>.npk` ke menu Files, lalu reboot. Versi paket harus sama persis dengan versi RouterOS.
2. **Dari router** (sejak 7.18): menu System, Packages, Check For Updates, pilih `user-manager`, Enable, lalu Apply Changes. Router akan meminta reboot.

```
[admin@UM] > /system package print
Columns: NAME, VERSION, BUILD-TIME, SIZE
# NAME          VERSION  BUILD-TIME           SIZE
0 user-manager  7.24.5   2026-09-29 14:21:27  408.1KiB
1 routeros      7.24.5   2026-09-29 14:21:27  19.9MiB
```

### 7.5 Basis data

Seluruh data User Manager (konfigurasi, sesi, pembayaran) disimpan di **SQLite terpisah di flash**, bukan di konfigurasi RouterOS. Hanya `enabled` dan `db-path` yang ikut konfigurasi utama. Konsekuensinya:

- `/system backup` dan `/export` **tidak** menyimpan user dan profile Anda. Pakai `/user-manager database save name=um-2026-10-13` (berkas `.umb`) dan `load`.
- Reset konfigurasi RouterOS tidak menghapus basis data User Manager, tetapi mematikan `enabled`.
- Flash perangkat kecil bisa penuh oleh riwayat sesi. Pantau `db-size` dan `free-disk-space` di `/user-manager database print`, dan pertimbangkan `db-path` ke penyimpanan yang lebih besar.

---

## 8. Membangun User Manager Langkah demi Langkah

Konfigurasi di bagian ini identik dengan berkas lab `materi/lab/kode/mikrotik-aaa-switching/um.rsc` yang diuji di CHR 7.24.5.

### 8.1 Aktifkan dan daftarkan NAS

```routeros
/user-manager set enabled=yes use-profiles=yes
/user-manager router add name=nas-rtrw address=10.99.0.1 \
    shared-secret="Lab-Rahasia-RADIUS-2026" coa-port=3799
```

`use-profiles=yes` menyalakan model profile dan limitation. Tanpa itu, User Manager hanya memeriksa user dan atributnya. `address` harus sama dengan alamat sumber paket dari NAS, karena itulah `src-address` di `/radius` sebaiknya ditetapkan.

### 8.2 Limitation

```routeros
/user-manager limitation
add name=lim-10m rate-limit-rx=3M rate-limit-tx=10M comment="PPPoE 10 Mbps"
add name=lim-voucher rate-limit-rx=1M rate-limit-tx=3M uptime-limit=2h \
    comment="voucher kafe 2 jam"
add name=lim-kuota-harian download-limit=2000000000 reset-counters-interval=daily \
    reset-counters-start-time="2026-01-01 00:00:00" comment="FUP 2 GB per hari"
```

Properti `rate-limit-*` disusun User Manager menjadi atribut `Mikrotik-Rate-Limit`. `rx` tetap berarti upload pelanggan. Batas byte (`download-limit`, `upload-limit`, `transfer-limit`) dan `uptime-limit` ditegakkan oleh User Manager berdasarkan accounting, sehingga butuh interim update dan `/radius incoming` yang aktif di NAS.

### 8.3 Profile dan profile-limitation

```routeros
/user-manager profile
add name=paket-10m name-for-users="Paket Rumah 10 Mbps" validity=30d \
    starts-when=assigned price=150000
add name=voucher-2jam name-for-users="Voucher 2 jam" validity=1d \
    starts-when=first-auth price=3000

/user-manager profile-limitation
add profile=paket-10m limitation=lim-10m
add profile=paket-10m limitation=lim-kuota-harian
add profile=voucher-2jam limitation=lim-voucher
```

- `validity` adalah umur profile sejak aktif.
- `starts-when=assigned` mulai menghitung ketika user-profile dibuat (cocok untuk langganan bulanan). `first-auth` mulai saat login pertama (cocok untuk voucher yang dijual jauh sebelum dipakai).
- Bila satu profile punya beberapa limitation, **semuanya harus terpenuhi** agar sesi diterima.
- `profile-limitation` punya `weekdays`, `from-time`, `till-time`. Contoh: buat limitation tanpa kuota dengan `from-time=00:00:00 till-time=06:00:00` untuk "malam bebas kuota".

Harga di sini hanya angka yang ditampilkan di halaman `/um/` dan dipakai fitur pembayaran bawaan. Angka Rp150.000 dan Rp3.000 di atas adalah ilustrasi, bukan acuan harga pasar.

### 8.4 Group, user, dan user-profile

```routeros
/user-manager user group
add name=grp-pppoe outer-auths=pap,chap,mschap1,mschap2 \
    attributes=Framed-Pool:pool-pppoe
add name=grp-hotspot outer-auths=pap,chap attributes=Mikrotik-Group:hsup-kafe

/user-manager user
add name=budi password=BudiRumah-01 group=grp-pppoe shared-users=1 comment="RT 03 rumah no 12"
add name=v001 password=kopi123 group=grp-hotspot shared-users=1 comment="voucher kafe"

/user-manager user-profile
add user=budi profile=paket-10m
add user=v001 profile=voucher-2jam
```

- `outer-auths` membatasi metode yang diizinkan. Hotspot memakai CHAP (bawaan) atau PAP, tidak bisa MS-CHAP, jadi group hotspot cukup `pap,chap`.
- `attributes` di group atau user dikirim apa adanya di Access-Accept. Formatnya `Nama:nilai`.
- `shared-users=1` adalah cara User Manager menegakkan "satu akun satu perangkat". Dokumentasi PPP mencatat `only-one` di PPP profile **diabaikan** bila autentikasi lewat RADIUS, jadi aturan ini harus ada di server.
- Untuk alamat tetap, pakai `attributes=Framed-IP-Address:100.64.10.50` dan pastikan `shared-users=1`.

### 8.5 Verifikasi di server

```
[admin@UM] > /user-manager user-profile print
0  user=budi profile=paket-10m state=running-active
   end-time=2026-11-12 08:22:27
1  user=v001 profile=voucher-2jam state=waiting end-time=not-yet-running

[admin@UM] > /user-manager user monitor [find name=budi] once
         total-uptime: 0s
       total-download: 0
         total-upload: 0
      active-sessions: 1
       actual-profile: paket-10m
   attributes-details: Framed-Pool:pool-pppoe:string:0x706F6F6C2D7070706F65
```

`state=waiting` pada voucher berarti profile `first-auth` belum pernah dipakai. Setelah login pertama, statusnya menjadi `running-active` dan `end-time` terisi.

---

## 9. Integrasi dengan PPPoE Server

Konfigurasi NAS untuk PPPoE (sesuai `nas.rsc` di lab):

```routeros
/ip address add address=10.99.0.1/30 interface=ether2 comment="link RADIUS ke UM"
/radius add address=10.99.0.2 secret="Lab-Rahasia-RADIUS-2026" \
    service=ppp,hotspot src-address=10.99.0.1 timeout=1s comment="UM"
/radius incoming set accept=yes port=3799

/ip pool add name=pool-pppoe ranges=100.64.10.2-100.64.10.254
/ppp profile add name=prof-pppoe local-address=100.64.10.1 \
    dns-server=1.1.1.1,8.8.8.8 change-tcp-mss=yes only-one=yes
/ppp aaa set use-radius=yes accounting=yes interim-update=5m
/interface pppoe-server server add service-name=rtrw interface=ether3 \
    default-profile=prof-pppoe authentication=chap,mschap2 \
    one-session-per-host=yes disabled=no
```

Beberapa keputusan desain di sini:

- **`local-address` di profil, pool dari RADIUS.** Gateway sisi NAS tetap, sedangkan pool dipilih server lewat `Framed-Pool`. Dengan begitu satu NAS bisa melayani beberapa kelompok pelanggan (misalnya pool berbeda untuk pelanggan bisnis) tanpa profil terpisah.
- **`change-tcp-mss=yes`.** MTU PPPoE 1492 (8 oktet untuk header PPPoE dan PPP). Tanpa penyesuaian MSS, sebagian situs HTTPS "loading terus" karena paket 1500 oktet dibuang dan ICMP Fragmentation Needed sering diblokir di jalan.
- **Tidak ada `rate-limit` di profil.** Kecepatan datang dari User Manager. Bila suatu saat RADIUS mati, profil ini tidak memberi batas apa pun; untuk itu lihat bagian 13.
- **Tanpa alamat IP di `ether3`.** Outline MTCUME menyebut "amankan server dengan menghapus alamat IP dari antarmuka PPPoE server". Pelanggan hanya bisa berbicara PPPoE di segmen itu, tidak bisa langsung menyerang router lewat IP.

Hasil di NAS setelah modem `budi` dial:

```
[admin@NAS] > /ppp active print detail
Flags: R - RADIUS
0  R name="budi" service=pppoe caller-id="52:54:00:12:34:57"
     address=100.64.10.254 uptime=23s encoding="" session-id=0x81000000
     limit-bytes-in=0 limit-bytes-out=0

[admin@NAS] > /queue simple print
Flags: D - DYNAMIC
0 D name="<pppoe-budi>" target=<pppoe-budi> parent=none packet-marks=""
    priority=8/8 queue=default-small/default-small limit-at=3M/10M
    max-limit=3M/10M burst-limit=0/0 burst-threshold=0/0 burst-time=0s/0s
```

Flag `R` menandakan sesi diautentikasi RADIUS. Queue dinamis `<pppoe-budi>` dibuat dari `Mikrotik-Rate-Limit`.

### 9.1 PPP profile yang lebih dalam

Outline MTCUME meminta Anda menguasai properti PPP profile berikut. Semuanya juga bisa dikirim dari RADIUS sebagai atribut, tetapi tetap berguna sebagai nilai cadangan:

| Properti | Fungsi |
|---|---|
| `address-list` | Alamat klien dimasukkan ke address-list, misalnya `pelanggan-aktif`, untuk firewall dan mangle. |
| `incoming-filter`, `outgoing-filter` | Nama chain firewall. RouterOS membuat aturan jump dinamis di chain `ppp`, jadi chain `ppp` dan jump ke sana harus Anda buat sendiri. |
| `only-one` | Satu sesi per user. Diabaikan saat memakai RADIUS. |
| `session-timeout`, `idle-timeout` | Batas waktu sesi dan diam. |
| `use-encryption` | Enkripsi MPPE untuk PPTP dan L2TP. Tidak berlaku untuk SSTP dan OVPN. |
| `on-up`, `on-down` | Skrip saat sesi naik atau turun, dengan variabel `user`, `local-address`, `remote-address`, `caller-id`, `interface`. |
| `bridge` | Memasukkan antarmuka PPP ke bridge (BCP, PPP Bridging Control Protocol). Kedua ujung harus dikonfigurasi. |
| `interface-list` | Memasukkan antarmuka PPP dinamis ke interface list, misalnya `LAN`, agar firewall berbasis list bekerja. |

---

## 10. Integrasi dengan Hotspot

Hotspot dibangun dengan profil server yang mengarahkan autentikasi ke RADIUS:

```routeros
/ip address add address=10.5.50.1/24 interface=ether4
/ip pool add name=pool-hs ranges=10.5.50.10-10.5.50.250
/ip dhcp-server add name=dhcp-hs interface=ether4 address-pool=pool-hs lease-time=1h
/ip dhcp-server network add address=10.5.50.0/24 gateway=10.5.50.1 dns-server=10.5.50.1
/ip dns set allow-remote-requests=yes
/ip hotspot profile add name=hsprof-kafe hotspot-address=10.5.50.1 \
    dns-name=login.kafe.test login-by=http-chap,http-pap \
    use-radius=yes radius-accounting=yes radius-interim-update=5m
/ip hotspot user profile add name=hsup-kafe shared-users=1 \
    rate-limit=1M/3M idle-timeout=10m
/ip hotspot add name=hs-kafe interface=ether4 address-pool=pool-hs \
    profile=hsprof-kafe disabled=no
```

Group `grp-hotspot` di User Manager mengirim `Mikrotik-Group=hsup-kafe`. Untuk pengguna hotspot, atribut ini berarti "pakai user profile lokal bernama hsup-kafe", sehingga `idle-timeout`, `address-list`, skrip `on-login`, dan sebagainya diambil dari profil lokal, sedangkan kecepatan dari limitation di server.

Hasil login dari klien:

```
[admin@NAS] > /ip hotspot active print detail
Flags: R - RADIUS
0  R server=hs-kafe user="v001" address=10.5.50.250
     mac-address=52:54:00:12:34:58 login-by="http-pap" uptime=4s
     idle-timeout=10m keepalive-timeout=2m

[admin@NAS] > /log print where topics~"hotspot"
 hotspot,info,debug v001 (10.5.50.250): trying to log in by http-pap
 hotspot,account,info,debug v001 (10.5.50.250): logged in
```

### 10.1 Metode login

| `login-by` | Cara kerja | Kapan dipakai |
|---|---|---|
| `http-chap` | Halaman login menghitung MD5 challenge di browser; password tidak lewat jaringan polos | Bawaan, cocok untuk voucher |
| `http-pap` | Password dikirim polos lewat HTTP | Hanya bila server RADIUS butuh password polos, atau untuk uji otomatis |
| `https` | Login lewat TLS, butuh `ssl-certificate` di profil | Lokasi yang serius soal privasi |
| `mac` | Klien diautentikasi dengan MAC sebagai username | Perangkat tetap (smart TV, printer) |
| `cookie`, `mac-cookie` | Login ulang otomatis selama cookie berlaku | Kenyamanan pengguna ponsel |
| `trial` | Akses gratis sementara, diatur `trial-uptime` | Promosi kafe |

⚠️ Sejak RouterOS 7.5 (changelog), Hotspot otomatis menolak permintaan HTTPS dari pengguna yang belum login. Ponsel modern mendeteksi captive portal lewat permintaan HTTP khusus atau lewat opsi DHCP captive portal (dokumentasi menyebut RFC 7710; opsi ini dikirim bila Hotspot punya `dns-name` dan sertifikat SSL yang valid). Bila pengguna mengeluh "halaman login tidak muncul", minta mereka membuka situs HTTP biasa, lalu periksa apakah DNS hotspot dan sertifikat sudah benar.

⚠️ Sejak RouterOS 7.17, perangkat baru dikirim dengan **device-mode**. Mode `home` dan `basic` mematikan Hotspot. Bila `/ip hotspot` menolak dengan "not allowed by device-mode", Anda harus menjalankan `/system device-mode update hotspot=yes` lalu mengonfirmasi dengan menekan tombol reset atau mencabut daya dalam waktu yang ditentukan. CHR yang dipakai di lab ini berjalan di mode `advanced` dengan `hotspot: yes`.

### 10.2 IP binding dan walled garden

**IP binding** (`/ip hotspot ip-binding`) adalah pengecualian berbasis MAC atau IP:

| `type` | Efek |
|---|---|
| `bypassed` | Klien lolos tanpa login. Cocok untuk komputer kasir, printer, CCTV. |
| `blocked` | Klien diblokir total. |
| `regular` | NAT satu-ke-satu ke `to-address`, klien tetap harus login. |

```routeros
/ip hotspot ip-binding add mac-address=02:00:00:00:0a:01 type=bypassed comment="kasir"
```

**Walled garden** membuka tujuan tertentu sebelum login. Ada dua menu: `/ip hotspot walled-garden` untuk HTTP dan HTTPS berdasarkan nama host, dan `/ip hotspot walled-garden ip` untuk protokol lain berdasarkan alamat.

```routeros
/ip hotspot walled-garden add dst-host=*.bayar.test action=allow
```

Pola `dst-host` mencocokkan seluruh string. `*` berarti sembarang karakter, dan nilai yang diawali titik dua (`:`) diperlakukan sebagai regex.

---

## 11. Voucher dan Billing Sederhana

### 11.1 Voucher kafe: buat, cetak, jual

User Manager bisa membuat banyak user acak sekaligus:

```routeros
/user-manager user add-batch-users number-of-users=50 \
    username-length=6 username-characters=lowercase,numbers \
    password-length=6 password-characters=numbers \
    group=grp-hotspot shared-users=1 comment=batch-okt
```

Perintah itu belum memberi profile. Pasangkan dengan loop:

```routeros
:foreach u in=[/user-manager user find where comment=batch-okt] do={
  /user-manager user-profile add user=[/user-manager user get $u name] profile=voucher-2jam
}
```

Kartu cetak dibuat dari templat bawaan:

```routeros
/user-manager advanced set web-private-username=kasir web-private-password="Ganti-Ini-2026"
/user-manager user generate-voucher voucher-template=printable_vouchers.html \
    [find where comment=batch-okt]
```

Berkas hasil ada di `um5files/PRIVATE/GENERATED/vouchers/gen_printable_vouchers.html` dan bisa dibuka lewat `http://<router>/um/PRIVATE/GENERATED/vouchers/gen_printable_vouchers.html` dengan kredensial `web-private-*`. Templat bisa disunting dengan variabel `$(username)`, `$(password)`, `$(userprofname)`, dan `$(userprofendtime)`. Templat `export.csv` atau `export.xml` menghasilkan daftar untuk diolah di spreadsheet.

Contoh hasil di lab:

```
[admin@UM] > /user-manager user print show-sensitive where comment=batch-okt
0  ;;; batch-okt
   name="mdqcom" password="204323" otp-secret="" group=grp-hotspot
   shared-users=1 attributes=""
```

Alur bisnis kafe sederhana:

```
Admin membuat 50 voucher ──▶ cetak kartu ──▶ kasir menjual Rp3.000/kartu (ilustrasi)
          │                                           │
          ▼                                           ▼
 user-profile "waiting"            pelanggan login di halaman hotspot
                                              │
                                              ▼
                          starts-when=first-auth: masa 1 hari mulai berjalan,
                          limitation 2 jam uptime dan 1M/3M ditegakkan
```

### 11.2 Langganan bulanan RT-RW Net

Untuk pelanggan tetap, polanya:

1. Satu user per rumah, `shared-users=1`, group `grp-pppoe`.
2. Profile `paket-10m` dengan `validity=30d starts-when=assigned`.
3. Saat pelanggan membayar bulan berikutnya, admin menambah **user-profile baru** sebelum yang lama habis. User Manager akan berpindah ke profile berikutnya tanpa memutus sesi.
4. Bila tidak membayar, profile habis dan login berikutnya ditolak. Untuk pemberitahuan yang lebih ramah, kirim CoA yang menurunkan kecepatan dan memasukkan pelanggan ke address-list `menunggak`, lalu arahkan HTTP mereka ke halaman tagihan.

Laporan pemakaian untuk bagian keuangan:

```routeros
/user-manager generate-report report-template=report_default.html \
    columns=username,uptime,download,upload
```

### 11.3 Batas fitur pembayaran bawaan

Fitur "beli profile" di halaman `/um/` saat ini hanya mendukung **PayPal** (dokumentasi: "currently PayPal only"). Untuk pasar Indonesia yang memakai transfer bank, dompet digital, atau QRIS, Anda tetap perlu proses di luar User Manager: kasir atau aplikasi billing pihak ketiga yang menambahkan user-profile setelah pembayaran terkonfirmasi, misalnya lewat REST API RouterOS (`19-mikrotik/07-monitoring-scripting`).

⚠️ Menjual kembali akses internet kepada tetangga atau pengunjung adalah kegiatan usaha telekomunikasi. Pastikan model usaha Anda (misalnya kemitraan dengan ISP berizin) sesuai ketentuan yang berlaku di Indonesia, dan catatan sesi yang Anda simpan diperlakukan sebagai data pribadi.

---

## 12. FreeRADIUS sebagai Alternatif

User Manager praktis untuk skala kecil dan menengah, tetapi FreeRADIUS menjadi pilihan ketika:

- jumlah sesi melampaui batas lisensi perangkat Anda;
- data pelanggan sudah ada di basis data SQL milik aplikasi billing;
- Anda butuh logika kompleks (unlang), banyak NAS dari berbagai vendor, atau replikasi server;
- Anda ingin server RADIUS di luar router, misalnya di VM Linux yang dicadangkan bersama sistem lain.

### 12.1 Konfigurasi minimum FreeRADIUS 3

Daftarkan NAS di `clients.conf`:

```
client nas-rtrw {
	ipaddr = 10.99.0.1
	secret = Lab-Rahasia-RADIUS-2026
	require_message_authenticator = yes
	shortname = nas-rtrw
}
```

Tambahkan pengguna di awal `mods-config/files/authorize` (modul `files`). Baris pertama berisi check item; baris berindentasi berisi reply item:

```
budi	Cleartext-Password := "BudiRumah-01"
	Mikrotik-Rate-Limit = "3M/10M",
	Framed-Pool = "pool-pppoe",
	Acct-Interim-Interval = 300

v002	Cleartext-Password := "teh456", Simultaneous-Use := 1
	Mikrotik-Group = "hsup-kafe",
	Session-Timeout = 7200
```

Atribut `Mikrotik-*` sudah dikenali karena FreeRADIUS membawa `dictionary.mikrotik` (vendor 14988) di distribusinya. Berkas kamus itu bahkan memberi catatan agar Anda **tidak** mengganti kamus bawaan dengan kamus contoh dari situs MikroTik.

Uji dengan `radtest`:

```
$ radtest -t pap budi BudiRumah-01 127.0.0.1 0 Lab-Rahasia-RADIUS-2026
Received Access-Accept Id 203 from 127.0.0.1:1812 to 127.0.0.1:41083 length 70
	Message-Authenticator = 0x7c3dcbb5c9f3e21bff07394b1e1314b2
	Mikrotik-Rate-Limit = "3M/10M"
	Framed-Pool = "pool-pppoe"
	Acct-Interim-Interval = 300
```

Hasil di atas berasal dari skrip `freeradius/uji-freeradius.sh` di folder lab, dijalankan dengan FreeRADIUS 3.0.27 di Alpine 3.20. `Simultaneous-Use` baru ditegakkan bila bagian `session` (radutmp atau SQL) aktif, jadi untuk produksi Anda hampir pasti membutuhkan modul `sql`.

CoA dan Disconnect dari sisi Linux dikirim dengan `radclient`, yang secara bawaan memakai port 3799 untuk perintah `coa` dan `disconnect`:

```
echo 'User-Name=budi,Mikrotik-Rate-Limit="512k/512k"' | radclient 10.99.0.1:3799 coa "Lab-Rahasia-RADIUS-2026"
echo 'User-Name=budi' | radclient 10.99.0.1:3799 disconnect "Lab-Rahasia-RADIUS-2026"
```

### 12.2 Perbandingan

| Aspek | User Manager v7 | FreeRADIUS 3 |
|---|---|---|
| Tempat jalan | Di RouterOS (perangkat atau CHR) | Linux/BSD |
| Penyimpanan | SQLite di flash router | File, SQL, LDAP, dan lainnya |
| Batas | Lisensi RouterOS | Sumber daya server |
| Profile/kuota/validity | Bawaan, tinggal isi | Dibangun sendiri (SQL + unlang + counter) |
| Voucher dan halaman pelanggan | Bawaan (`/um/`) | Butuh aplikasi tambahan |
| CoA otomatis saat kuota habis | Bawaan | Butuh logika sendiri |
| Kurva belajar | Rendah | Tinggi |

---

## 13. Keamanan Jalur AAA

1. **Secret panjang dan acak.** Keamanan PAP hiding dan Response Authenticator bergantung pada MD5 dan secret. Pakai minimal 20 karakter acak, berbeda untuk setiap NAS, dan jangan pakai ulang untuk password admin.
2. **Wajibkan Message-Authenticator.** Biarkan `require-message-auth` aktif di RouterOS 7.15 ke atas dan `require_message_authenticator = yes` di FreeRADIUS. Ini menutup jalur BlastRADIUS.
3. **Segmentasikan trafik RADIUS.** Taruh NAS dan server di VLAN manajemen atau VRF tersendiri (`address=10.99.0.2@vrf-mgmt`), jangan lewat segmen pelanggan.
4. **Firewall di kedua sisi.** Di server, izinkan UDP 1812/1813 hanya dari alamat NAS. Di NAS, izinkan port CoA hanya dari alamat server:

   ```routeros
   # di UM
   /ip firewall filter add chain=input protocol=udp dst-port=1812,1813 \
       src-address=10.99.0.1 action=accept place-before=0 comment="RADIUS dari NAS"
   # di NAS
   /ip firewall filter add chain=input protocol=udp dst-port=3799 \
       src-address=10.99.0.2 action=accept place-before=0 comment="CoA dari UM"
   ```

5. **RadSec untuk jalur yang melewati internet.** Bila NAS di lokasi kafe terhubung ke server di kantor lewat internet, pakai `protocol=radsec` (RADIUS di atas TLS, RFC 6614) atau bungkus dengan VPN (`19-mikrotik/06-vpn-tunnel`). UDP RADIUS polos di internet membocorkan username, MAC, dan alamat pelanggan.
6. **Lindungi antarmuka web `/um/`.** Ia mengikuti layanan `www` dan `www-ssl`. Batasi `address` layanan itu, pakai HTTPS, dan perbarui RouterOS: changelog 7.22 mencatat perbaikan "unauthenticated access to /PRIVATE/ userman web files".
7. **Rencanakan saat RADIUS mati.** Server tunggal adalah titik gagal tunggal. Tambahkan server kedua sebagai entri `/radius` berikutnya, atau sediakan profil default yang aman. Ingat bahwa sesi yang sudah tersambung tetap hidup; yang gagal adalah login baru.
8. **Data pelanggan adalah data pribadi.** Riwayat sesi berisi MAC, alamat IP, dan waktu pemakaian. Batasi siapa yang bisa membaca, tentukan masa simpan, dan cadangkan dengan aman.

---

## 14. Troubleshooting

### 14.1 Nyalakan log yang tepat dulu

```routeros
/system logging add topics=radius,debug action=memory
/log print where topics~"radius"
```

Log debug RADIUS menampilkan isi paket keluar dan masuk lengkap dengan atribut. Matikan lagi setelah selesai karena buffer log cepat penuh.

### 14.2 Tabel gejala

| Gejala | Kemungkinan penyebab | Cara memastikan |
|---|---|---|
| Log PPP: `authentication failed - radius timeout`, `/radius monitor` menunjukkan `timeouts` naik | Server mati, rute ke server salah, firewall memblokir 1812, **atau secret salah** (server menjatuhkan paket diam-diam karena Message-Authenticator tidak valid) | Ping ke server dari `src-address`; bandingkan secret; cek log server |
| `bad-replies` naik | Secret salah pada jalur yang tidak memakai Message-Authenticator di balasan (perilaku yang dicatat dokumentasi untuk CHAP/MS-CHAP) | Samakan secret |
| `Access-Reject` dengan `Reply-Message = "Download limit reached"` | Limitation kuota tercapai | `/user-manager user monitor`, cek limitation dan `reset-counters-interval` |
| User lama tetap memakai paket lama meski diubah di server | Username juga ada di `/ppp secret` lokal, yang selalu dicek lebih dulu | `/ppp secret print where name=...` |
| Pelanggan tidak mendapat alamat | `Framed-Pool` menunjuk pool yang tidak ada di NAS, dan profil default tidak punya `remote-address` | `/ip pool print`, log PPP |
| Kuota habis tetapi pelanggan tidak terputus | `/radius incoming` mati atau port tidak sama dengan `coa-port`, atau interim update 0 | `/radius incoming print`, `/radius incoming monitor once` |
| CoA dari server tidak berefek, `bad-requests` naik | Alamat pengirim CoA tidak terdaftar di `/radius`, atau secret beda | Tambahkan entri `/radius` untuk alamat itu |
| `Disconnect-NAK` | Sesi yang dituju tidak ada di NAS (username salah, sudah putus) | `/ppp active print`, `/ip hotspot active print` |
| Voucher baru ditolak, profile berstatus `waiting` | Normal untuk `first-auth` sebelum login. Bila ditolak, cek `outer-auths` group (Hotspot butuh `chap` atau `pap`) | `/user-manager user-profile print` |
| Halaman login hotspot tidak muncul | Pengguna membuka situs HTTPS; DNS hotspot tidak dijawab; device-mode mematikan Hotspot | Uji dengan situs HTTP, `/ip hotspot host print`, `/system device-mode print` |
| Dua sesi aktif untuk satu akun | `only-one` di PPP profile diabaikan karena RADIUS | Set `shared-users=1` di user User Manager |
| Login 2FA/TOTP selalu gagal | Jam router tidak sinkron | `/system ntp client print`, `/system clock print` |

### 14.3 Contoh nyata: secret salah di RouterOS 7.24.5

Di lab, secret di `/user-manager router` sengaja diubah menjadi `SalahKetik`. Hasilnya bukan Access-Reject dan bukan `bad-replies`, melainkan:

```
[admin@NAS] > /log print where topics~"ppp" and message~"fail"
 pppoe,ppp,error <0004>: user budi authentication failed - radius timeout

[admin@NAS] > /radius monitor 0 once
          requests: 19
           accepts: 12
           resends: 12
          timeouts: 7
       bad-replies: 0
```

User Manager tidak membalas sama sekali karena Message-Authenticator dari NAS tidak bisa diverifikasi dengan secret yang berbeda. Jadi, di RouterOS modern, **"radius timeout" tidak selalu berarti jaringan putus**. Periksa secret sebelum menyalahkan kabel.

### 14.4 Contoh nyata: pemutusan karena kuota

Limitation `lim-kuota-harian` diturunkan menjadi 300 KB, interim update di NAS dibuat 10 detik, lalu NAS mengirim trafik ke pelanggan. Di server tercatat:

```
2  user=budi acct-session-id="81000001" nas-port-type=ethernet
   status=start,stop,interim,close-acked started=2026-10-13 08:23:41
   ended=2026-10-13 08:24:01 terminate-cause=um-limits-reached uptime=20s
   download=547.3KiB upload=548.0KiB
```

Di NAS, `/radius incoming monitor once` menunjukkan `requests: 1, acks: 1`, dan percobaan login berikutnya ditolak:

```
 rx Access-Reject with id 16 from 10.99.0.2:1812
     Reply-Message = "Download limit reached"
 pppoe,ppp,error <0009>: user budi authentication failed
```

Perhatikan bahwa pemakaian sempat melewati 300 KB (547 KiB) sebelum terputus. Penegakan kuota oleh User Manager hanya seakurat interval interim update.

---

## 15. Lab: User Manager, PPPoE, dan Hotspot di CHR

### 15.1 Topologi

```
                 ┌──────────────────────┐
                 │ UM  (User Manager)   │
                 │ ether2 10.99.0.2/30  │
                 └──────────┬───────────┘
                            │ RADIUS 1812/1813, CoA 3799
                 ┌──────────┴───────────┐
                 │ NAS                  │
                 │ ether2 10.99.0.1/30  │
                 │ ether3 PPPoE server  │
                 │ ether4 Hotspot       │
                 │        10.5.50.1/24  │
                 └────┬────────────┬────┘
              PPPoE   │            │  DHCP + login HTTP
                 ┌────┴────────────┴────┐
                 │ PEL (pelanggan)      │
                 │ ether2 pppoe-budi    │
                 │ ether3 klien hotspot │
                 └──────────────────────┘
```

Berkas: `materi/lab/kode/mikrotik-aaa-switching/` berisi `um.rsc`, `nas.rsc`, `pel.rsc`, `aaa.clab.yml`, dan folder `freeradius/`.

### 15.2 Menyiapkan platform

Pilih salah satu:

- **containerlab** (Linux, Docker). Bangun image dengan vrnetlab: unduh image CHR (VMDK) dari halaman unduhan MikroTik, letakkan di folder `mikrotik/routeros` repositori vrnetlab, jalankan `make docker-image`. Hasilnya bernama `vrnetlab/mikrotik_routeros:<versi>`. Kind containerlab-nya `mikrotik_ros`; `ether1` dipakai untuk manajemen, port data mulai `ether2`, kredensial bawaan `admin:admin`. Lalu `sudo containerlab deploy -t aaa.clab.yml`. Berkas `startup-config` diimpor otomatis sebagai `config.auto.rsc`.
- **GNS3 atau QEMU langsung.** Tiga VM CHR, masing-masing dengan antarmuka manajemen plus link data sesuai gambar. Impor berkas `.rsc` lewat `/import file-name=...`. Di QEMU, beri setiap NIC alamat MAC unik; image yang sama tanpa MAC eksplisit akan memakai MAC yang sama dan merusak PPPoE maupun bridge.

Lisensi CHR free membatasi upload 1 Mbps per antarmuka. Itu cukup untuk lab ini karena yang diuji adalah logika AAA, bukan throughput.

### 15.3 Langkah

1. Boot ketiga node dan login. Di node `um`, unggah `user-manager-<versi>.npk` yang versinya sama dengan RouterOS, lalu reboot. Pastikan `/system package print` memuat `user-manager`.
2. Impor `um.rsc` di UM, `nas.rsc` di NAS, `pel.rsc` di PEL. Setiap impor harus diakhiri "Script file loaded and executed successfully".
3. **Verifikasi PPPoE.** Di PEL: `/interface pppoe-client monitor pppoe-budi once` harus `status: connected` dengan alamat `100.64.10.x`. Di NAS: `/ppp active print` menampilkan `budi` berflag `R`, dan `/queue simple print` menampilkan `<pppoe-budi>` dengan `max-limit=3M/10M`. Di UM: `/user-manager session print` menampilkan sesi aktif dari `nas-ip-address=10.99.0.1`.
4. **Verifikasi Hotspot.** Di PEL, ether3 sudah mendapat alamat 10.5.50.x dari DHCP hotspot. Login dengan:
   ```routeros
   /tool fetch url="http://10.5.50.1/login?username=v001&password=kopi123" output=user
   ```
   Keluaran harus memuat "You are logged in". Di NAS, `/ip hotspot active print` menampilkan `v001` berflag `R`; di UM, user-profile `v001` berubah dari `waiting` menjadi `running-active`.
5. **Uji pemutusan kuota.** Di UM: `/user-manager limitation set [find name=lim-kuota-harian] download-limit=300000`. Di NAS: `/ppp aaa set interim-update=10s`, putus-sambungkan klien PPPoE, lalu kirim trafik `/ping 100.64.10.254 size=1400 count=400 interval=10ms`. Dalam 10 sampai 30 detik sesi harus putus dengan `terminate-cause=um-limits-reached`, dan `/radius incoming monitor once` di NAS menunjukkan `acks: 1`. Kembalikan nilai limitation setelah selesai.
6. **Uji CoA manual (opsional).** Butuh `radclient` yang bisa menjangkau port 3799 NAS. Daftarkan alamat sumber `radclient` di `/radius` NAS dengan secret yang sama, lalu kirim CoA seperti di bagian 5.2.
7. **Uji kegagalan.** Ubah `shared-secret` di UM, sambungkan ulang PPPoE, amati `radius timeout`. Kembalikan secret.
8. **FreeRADIUS (opsional).** Dari folder `freeradius/`, jalankan `sh uji-freeradius.sh` (butuh podman atau docker). Hasil yang diharapkan: dua Access-Accept dengan atribut Mikrotik dan satu Access-Reject.

### 15.4 Yang sudah diverifikasi

Langkah 1 sampai 8 dijalankan pada 13 Oktober 2026 dengan CHR 7.24.5 di QEMU/KVM dan FreeRADIUS 3.0.27. Semua contoh keluaran di modul ini berasal dari sesi tersebut. Berkas `aaa.clab.yml` mengikuti dokumentasi kind `mikrotik_ros` containerlab tetapi tidak dijalankan dengan containerlab dalam pengujian ini.

---

## 16. Tabel Padanan

| Konsep | MikroTik RouterOS v7 | Cisco IOS XE | Linux / FreeRADIUS |
|---|---|---|---|
| Server RADIUS | `/radius add address=... secret=...` | `radius server NAMA` + `address ipv4 ...` + `key ...` | `clients.conf` di server |
| Pakai RADIUS untuk PPP | `/ppp aaa set use-radius=yes` | `aaa authentication ppp default group radius` | (sisi server) |
| Accounting | `/ppp aaa set accounting=yes interim-update=5m` | `aaa accounting network default start-stop group radius` | modul `detail`, `sql` |
| Menerima CoA | `/radius incoming set accept=yes port=3799` | `aaa server radius dynamic-author` + `client ... server-key ...` | (pengirim) `radclient ... coa` |
| Batas kecepatan per user | `Mikrotik-Rate-Limit` | atribut Cisco AVPair (policy) | reply item di `authorize` atau SQL |
| Server di router | User Manager | (tidak ada padanan langsung di router akses) | FreeRADIUS di host |

---

## 17. Ringkasan

- AAA terpusat memindahkan user, paket, dan catatan pemakaian ke satu server; router menjadi **NAS** yang menegakkan keputusan server.
- RADIUS memakai **UDP 1812/1813**, kepala 20 oktet (Code, Identifier, Length, Authenticator) dan atribut TLV. Hanya password PAP yang disembunyikan; balasan ditandatangani dengan MD5 dan shared secret. **Message-Authenticator** (Type 80) menutup serangan BlastRADIUS dan diwajibkan RouterOS sejak 7.15.
- Atribut kunci MikroTik: `Mikrotik-Rate-Limit` (rx = upload pelanggan), `Mikrotik-Group`, `Framed-Pool`, `Framed-IP-Address`, `Session-Timeout`. Basis data lokal **selalu dicek lebih dulu**.
- Accounting Start/Interim/Stop membawa byte dan alasan putus. Tanpa interim update, kuota tidak bisa ditegakkan tepat waktu.
- **CoA/Disconnect** (RFC 5176, UDP 3799) membuat server bisa mengubah atau memutus sesi. `/radius incoming` bawaan `accept=no`; nyalakan dan setel `port` eksplisit sama dengan `coa-port` User Manager (dokumentasi menyebut 1700, CHR 7.24.5 menampilkan 3799).
- User Manager v7: router, user, group, profile, limitation, profile-limitation, user-profile, session. Customer v6 sudah tidak ada. Data ada di SQLite terpisah; cadangkan dengan `database save`. Sesi aktif dibatasi lisensi (level 4 hanya 20).
- PPPoE: `Framed-Pool` dari server, `change-tcp-mss=yes`, `only-one` diabaikan bila RADIUS dipakai. Hotspot: `use-radius=yes`, `Mikrotik-Group` memilih user profile lokal, IP binding dan walled garden untuk pengecualian.
- Voucher: `add-batch-users`, loop untuk user-profile, `generate-voucher`. Pembayaran bawaan hanya PayPal.
- FreeRADIUS cocok untuk skala besar dan integrasi SQL; `dictionary.mikrotik` sudah bawaan.
- Amankan jalur: secret panjang, Message-Authenticator, segmentasi, firewall, RadSec atau VPN lewat internet.

---

## 18. Latihan

1. Seorang admin mengubah paket `sari` dari 10 Mbps ke 20 Mbps di User Manager, tetapi setelah modem Sari di-restart kecepatannya tetap 10 Mbps. `/ppp active print` menunjukkan sesi Sari **tanpa** flag `R`. Apa penyebab paling mungkin dan bagaimana memperbaikinya?
2. Jelaskan, pada tingkat paket, mengapa penyadap di jalur antara NAS dan server RADIUS tetap bisa melihat username dan alamat MAC pelanggan walaupun shared secret kuat. Apa dua cara menutup kebocoran ini?
3. Setelah memperbarui RouterOS ke 7.24, semua login PPPoE baru gagal dengan "radius timeout", padahal ping dari NAS ke server lancar dan server menyala. Sebutkan dua kemungkinan penyebab dan langkah pemeriksaan untuk masing-masing.
4. Limitation kuota 50 GB per bulan sudah dibuat dan dipasang ke profile, tetapi pelanggan yang melewati 50 GB tetap online sampai modemnya restart. Konfigurasi apa saja di NAS yang harus Anda periksa?
5. Anda mengirim CoA `Framed-IP-Address=100.64.10.99` untuk memindahkan alamat pelanggan, tetapi NAS menolak. Mengapa, dan apa cara yang benar?
6. Pemilik kafe ingin voucher dijual sebulan sebelum dipakai, berlaku 1 hari sejak dipakai, dengan total pemakaian maksimum 3 jam dan kecepatan 2 Mbps download. Tuliskan limitation, profile, dan profile-limitation User Manager yang sesuai, lalu jelaskan pilihan `starts-when`.
7. RT-RW Net Anda punya 180 pelanggan PPPoE dan berencana memasang User Manager di sebuah router hAP berlisensi level 4 yang juga menjadi NAS. Apa masalahnya, dan apa dua alternatif desain?
8. Hotspot di kafe sudah memakai RADIUS. Komputer kasir dan printer jaringan ikut tertahan di halaman login. Selain itu, pelanggan harus bisa membuka situs pembayaran sebelum login. Apa dua fitur Hotspot yang Anda pakai, dan apa bedanya?
9. Dari log FreeRADIUS terlihat Access-Accept berisi `Mikrotik-Rate-Limit = "3M/10M"`, dan di NAS queue dinamis `<pppoe-andi>` muncul dengan `max-limit=3M/10M`. Namun speedtest Andi mencapai 40 Mbps. Di NAS ternyata ada aturan `/ip firewall filter` fasttrack untuk semua koneksi established di chain forward. Jelaskan hubungan kedua hal itu dan perbaikannya.
10. Rancang segmentasi dan firewall minimum untuk tiga NAS (10.99.0.1, 10.99.0.5, 10.99.0.9) yang memakai satu User Manager di 10.99.0.2, termasuk aturan untuk CoA.

<details>
<summary>Jawaban</summary>

1. Flag `R` yang hilang berarti sesi **tidak** diautentikasi lewat RADIUS. RouterOS selalu mengecek basis data lokal lebih dulu, jadi kemungkinan besar masih ada `/ppp secret` bernama `sari` di NAS dengan profil 10 Mbps. Server tidak pernah ditanya, sehingga perubahan di User Manager tidak berefek. Periksa `/ppp secret print where name=sari`, hapus atau nonaktifkan entri itu, lalu putuskan sesi (`/ppp active remove [find name=sari]`) agar modem dial ulang dan kali ini dijawab User Manager. Pastikan juga `/ppp aaa` memiliki `use-radius=yes`.

2. RADIUS hanya menyembunyikan isi atribut `User-Password` (XOR dengan MD5 dari secret dan Request Authenticator) dan menandatangani balasan. Atribut lain, termasuk `User-Name`, `Calling-Station-Id` (MAC), `Framed-IP-Address`, dan `NAS-IP-Address`, dikirim sebagai TLV polos di dalam UDP. Dua cara menutupnya: (a) memakai **RadSec** (RADIUS di atas TLS, `protocol=radsec`) sehingga seluruh paket terenkripsi; (b) membungkus jalur RADIUS di dalam VPN (IPsec, WireGuard) atau setidaknya menaruhnya di segmen manajemen terpisah yang tidak bisa disadap pelanggan.

3. (a) **Secret tidak cocok.** Sejak 7.15, Message-Authenticator disertakan dan diwajibkan. Bila secret berbeda, server menjatuhkan paket tanpa membalas sehingga NAS melihat timeout, bukan reject. Periksa dengan menyamakan secret di `/radius` dan di server (`/user-manager router` atau `clients.conf`), lalu lihat `/radius monitor` dan log server. (b) **Server tidak mengenali NAS** karena alamat sumber berubah, misalnya `src-address` tidak ditetapkan dan setelah upgrade rute keluar berbeda. Server RADIUS diam bila paket datang dari alamat yang tidak terdaftar. Periksa dengan log debug RADIUS di NAS (alamat sumber) dan daftar router di server; tetapkan `src-address`. Kemungkinan lain yang layak dicek: firewall input server memblokir UDP 1812 dari alamat baru.

4. User Manager menegakkan kuota dari data accounting dan memutus lewat Disconnect-Request. Di NAS periksa: (a) `/ppp aaa` memiliki `accounting=yes` dan `interim-update` bukan 0, karena tanpa interim server tidak tahu pemakaian sampai sesi berakhir; (b) `/radius incoming` memiliki `accept=yes` dan `port` sama dengan `coa-port` di `/user-manager router` (nilai bawaan berbeda antara dokumentasi dan versi RouterOS, jadi setel eksplisit, misalnya 3799 di keduanya); (c) alamat server terdaftar di `/radius` dengan secret yang sama, sebab CoA dari alamat tak dikenal dihitung `bad-requests`; (d) firewall input NAS mengizinkan UDP port CoA dari server. `/radius incoming monitor once` akan menunjukkan apakah permintaan datang dan di-ACK.

5. Dokumentasi RouterOS menyatakan alamat IP, pool, dan rute **tidak bisa diubah lewat CoA**; hanya atribut seperti rate-limit, group, filter, timeout, dan port-limit. Antarmuka PPP sudah dinegosiasikan dengan alamat lama lewat IPCP. Cara yang benar: ubah atribut user di server (misalnya `Framed-IP-Address` di User Manager), lalu kirim **Disconnect-Request**. Modem akan dial ulang dan menerima alamat baru di Access-Accept berikutnya.

6. Contoh:
   ```routeros
   /user-manager limitation add name=lim-3jam uptime-limit=3h rate-limit-rx=1M rate-limit-tx=2M
   /user-manager profile add name=voucher-3jam validity=1d starts-when=first-auth price=5000
   /user-manager profile-limitation add profile=voucher-3jam limitation=lim-3jam
   ```
   `starts-when=first-auth` membuat masa berlaku 1 hari baru dihitung saat login pertama, sehingga voucher yang dicetak dan dijual sebulan sebelumnya tidak hangus di laci. Dengan `assigned`, masa 1 hari akan habis sehari setelah voucher dibuat. `uptime-limit=3h` membatasi total pemakaian, `rate-limit-tx=2M` membatasi download (tx dari sudut pandang router).

7. Tabel lisensi RouterOS membatasi **sesi aktif User Manager** pada level 4 menjadi 20. Dengan 180 pelanggan, sebagian besar login akan ditolak. Selain itu, menaruh server dan NAS di satu perangkat kecil membebani CPU dan flash. Alternatif: (a) jalankan User Manager di perangkat berlisensi level 6 atau di CHR (yang tidak memakai tabel level ini, lisensinya membatasi kecepatan antarmuka), dan jadikan hAP hanya NAS; (b) pakai FreeRADIUS di server Linux dengan backend SQL. Alternatif mana pun, cadangkan basis data dan sediakan server kedua bila memungkinkan.

8. **IP binding** dengan `type=bypassed` untuk MAC kasir dan printer: perangkat itu lolos tanpa login sama sekali, untuk semua tujuan. **Walled garden** (`/ip hotspot walled-garden add dst-host=...`) untuk situs pembayaran: semua pengguna yang belum login boleh membuka tujuan tertentu saja, sedangkan sisanya tetap diarahkan ke halaman login. Perbedaannya: IP binding membebaskan **perangkat**, walled garden membebaskan **tujuan**.

9. Queue dinamis dari `Mikrotik-Rate-Limit` adalah simple queue biasa. Dokumentasi packet flow RouterOS menyebut paket dari koneksi yang di-FastTrack berjalan lewat FastPath dan **melewati firewall, connection tracking, simple queue, dan queue tree ber-parent global** (antarmuka PPPoE termasuk yang mendukung FastPath). Karena aturan fasttrack menandai semua koneksi established, hanya paket pembuka dan sebagian kecil paket yang "sesekali" dikirim lewat slow path yang dihitung queue, sehingga batas 3M/10M praktis tidak berlaku. Perbaikan: hapus atau persempit aturan fasttrack di NAS yang menegakkan queue per pelanggan, misalnya hanya untuk trafik yang tidak berasal dari atau menuju pool pelanggan, atau pindahkan pembatasan ke tempat yang tidak dilewati FastTrack. Konsep ini dibahas lebih rinci di `19-mikrotik/03-firewall-nat` bagian packet flow.

10. Contoh desain: VLAN manajemen 99 (10.99.0.0/24) hanya untuk NAS dan server, tidak ada port pelanggan di dalamnya. Di User Manager:
    ```routeros
    /ip firewall address-list
    add list=nas address=10.99.0.1
    add list=nas address=10.99.0.5
    add list=nas address=10.99.0.9
    /ip firewall filter
    add chain=input protocol=udp dst-port=1812,1813 src-address-list=nas action=accept
    add chain=input protocol=udp dst-port=1812,1813 action=drop
    ```
    Di setiap NAS:
    ```routeros
    /ip firewall filter
    add chain=input protocol=udp dst-port=3799 src-address=10.99.0.2 action=accept
    add chain=input protocol=udp dst-port=3799 action=drop
    ```
    Setiap NAS didaftarkan di `/user-manager router` dengan secret berbeda, dan `/radius` di NAS memakai `src-address` alamat VLAN 99-nya. Aturan accept harus berada di atas aturan drop umum chain input.

</details>

---

## 19. Sumber

- RFC 2865, Remote Authentication Dial In User Service (RADIUS): https://www.rfc-editor.org/rfc/rfc2865
- RFC 2866, RADIUS Accounting: https://www.rfc-editor.org/rfc/rfc2866
- RFC 3579, RADIUS Support For EAP (Message-Authenticator): https://www.rfc-editor.org/rfc/rfc3579
- RFC 5176, Dynamic Authorization Extensions to RADIUS: https://www.rfc-editor.org/rfc/rfc5176
- RFC 6614, TLS Encryption for RADIUS (RadSec): https://www.rfc-editor.org/rfc/rfc6614
- MikroTik, User Manager: https://help.mikrotik.com/docs/spaces/ROS/pages/2555940/User+Manager
- MikroTik, RADIUS: https://help.mikrotik.com/docs/spaces/ROS/pages/328097/RADIUS
- MikroTik, HotSpot - Captive portal: https://help.mikrotik.com/docs/spaces/ROS/pages/56459266/HotSpot+-+Captive+portal
- MikroTik, PPP AAA: https://help.mikrotik.com/docs/spaces/ROS/pages/132350049/PPP+AAA
- MikroTik, PPPoE: https://help.mikrotik.com/docs/spaces/ROS/pages/2031625/PPPoE
- MikroTik, RouterOS license keys: https://help.mikrotik.com/docs/spaces/ROS/pages/328149/RouterOS+license+keys
- MikroTik, Device-mode: https://help.mikrotik.com/docs/spaces/ROS/pages/93749258/Device-mode
- MikroTik, Packages: https://help.mikrotik.com/docs/spaces/ROS/pages/40992872/Packages
- MikroTik, changelog RouterOS v7 (7.1, 7.5, 7.15, 7.18, 7.21, 7.22): https://mikrotik.com/download/changelogs
- MikroTik, MTCUME training outline: https://i.mt.lv/cdn/training_pdf/mtcume_outline_2019181161836.pdf
- FreeRADIUS, dictionary.mikrotik (v3.2.x): https://github.com/FreeRADIUS/freeradius-server/blob/v3.2.x/share/dictionary.mikrotik
- FreeRADIUS, radclient(1) dan radtest(1): https://github.com/FreeRADIUS/freeradius-server/tree/v3.2.x/man/man1
- containerlab, MikroTik RouterOS (kind mikrotik_ros): https://containerlab.dev/manual/kinds/vr-ros/
- vrnetlab, MikroTik RouterOS: https://github.com/srl-labs/vrnetlab/tree/master/mikrotik/routeros

---

**Berikutnya:** `19-mikrotik/11-crs-switching` — switch chip CRS3xx/5xx, offload L2 dan L3, isolasi port, MSTP, LACP, dan SwOS.

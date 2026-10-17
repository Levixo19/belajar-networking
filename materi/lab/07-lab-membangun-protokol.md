# Lab 07: Membangun Protokol Sendiri

> **Prasyarat:** `05-transport/02-tcp` (terutama bagian 12, prinsip transfer andal), `15-otomasi/03-python-jaringan` (Python dasar), `04-network-layer/04-arp-icmp`, `07-routing-lanjutan/02-konsep-routing-dinamis`
> **Tujuan:** Anda menulis sendiri, dalam Python, lima potong mesin jaringan: klien HTTP di atas socket mentah, protokol transfer andal (Go-Back-N dan Selective Repeat) di atas kanal rusak, traceroute, router mini dengan longest prefix match dan ARP, serta protokol distance-vector. Semuanya diuji otomatis dengan pytest dan diukur dengan angka.
> **Platform:** Linux (native, VM, atau WSL2) atau macOS dengan Python 3.10+ dan pytest. Tidak butuh root, kecuali mode raw socket opsional di Lab 7.3.
> **Format:** KONSEP → TUGAS → UJI OTOMATIS → KRITERIA SUKSES → pembahasan.

> [!TIP]
> **Ini lab pendalaman, bukan materi ujian.** Tidak ada satu pun latihan di sini yang diuji di CCNA, Network+, atau MTCNA. Lab ini ada karena orang yang pernah menulis Go-Back-N sendiri tidak akan lagi membaca "TCP Retransmission" di Wireshark sebagai hafalan. Orang yang pernah menulis LPM sendiri juga tahu persis mengapa `show ip route 10.1.1.1` memilih rute /24, bukan /16. Kerjakan setelah Tahap 15, atau lebih awal bila Python Anda sudah lancar.

---

## Lab 7.0: Persiapan

### Struktur kode

Semua kode ada di `materi/lab/kode/membangun-protokol/`:

```
membangun-protokol/
├── pytest.ini, conftest.py   konfigurasi uji (opsi --impl)
├── jalankan.py               peluncur demo dan pengukuran
├── umum/                     infrastruktur bersama, TIDAK perlu diubah
│   ├── checksum.py           Internet checksum (RFC 1071)
│   ├── paket.py              pembuat/pengurai Ethernet, ARP, IPv4, UDP, ICMP
│   ├── kanal.py              kanal rusak: simulator berwaktu virtual + adaptor UDP
│   ├── penjejak.py           backend traceroute: simulasi, IP_RECVERR, raw
│   └── simdv.py              simulator distance-vector
├── starter/                  BAGIAN ANDA: berkas berisi TODO
│   └── soket.py  rdt.py  traceroute.py  router.py  dv.py
├── referensi/                kunci jawaban (jangan dibuka sebelum mencoba)
│   └── soket.py  rdt.py  traceroute.py  router.py  dv.py
└── tests/                    uji otomatis, sama untuk starter dan referensi
```

Semua kode memakai standard library Python saja, ditambah pytest untuk menjalankan uji. Lisensinya MIT (lihat `materi/lab/kode/LICENSE`), jadi Anda bebas menyalin, mengubah, dan memakainya di portofolio.

### Menyiapkan lingkungan

```bash
$ cd materi/lab/kode/membangun-protokol
$ python3 --version              # harus 3.10 atau lebih baru
$ python3 -m venv .venv
$ source .venv/bin/activate
(.venv) $ pip install pytest
```

### Dua mode uji

```bash
# 1. Uji terhadap kode REFERENSI: memastikan lingkungan Anda beres.
(.venv) $ pytest -q
...........................................................s.......... [ 69%]
...............................                                       [100%]
SKIPPED [1] tests/test_73_traceroute.py: raw socket butuh root/CAP_NET_RAW; ...
102 passed, 1 skipped in 2.3s

# 2. Uji terhadap kode ANDA di starter/
(.venv) $ pytest --impl=starter                         # semua
(.venv) $ pytest --impl=starter tests/test_72_rdt.py    # satu latihan
(.venv) $ pytest --impl=starter -x -k gbn               # berhenti di kegagalan pertama, hanya uji "gbn"
```

Di awal, hampir semua uji starter gagal dengan `NotImplementedError: TODO 7.x...`. Itu normal: pesan tersebut menunjuk fungsi mana yang harus Anda isi. Satu uji yang selalu berjalan, `tests/test_00_api.py`, memastikan antarmuka starter dan referensi tetap sama. Jangan ubah nama atau parameter fungsi.

> [!WARNING]
> **Aturan main.** (1) Jangan membuka `referensi/` sebelum mencoba sungguh-sungguh; bacalah setelah lulus uji untuk membandingkan gaya. (2) Jangan memakai library HTTP atau library jaringan pihak ketiga. (3) Jangan "mengakali" uji, misalnya dengan mengembalikan nilai yang dihafal dari isi tes. Tujuannya pemahaman, bukan centang hijau.

### Asal-usul desain

Urutan latihan ini terinspirasi oleh lab kuliah jaringan universitas: Stanford CS144 (membangun TCP dan router IP bertahap), Berkeley CS168 (proyek traceroute dan distance-vector bertahap dengan split horizon dan poison reverse), serta Princeton COS 461 (pemrograman socket dan proxy HTTP). Repositori kode kuliah-kuliah tersebut tidak berlisensi terbuka, jadi tidak ada satu baris pun yang disalin. Desain antarmuka, format paket, simulator, dan semua kode di sini ditulis orisinal untuk kurikulum ini.

---

## Lab 7.1: Socket UDP/TCP dan Klien HTTP Mentah

**Berkas:** `starter/soket.py` · **Uji:** `tests/test_71_soket.py`

### Konsep

Socket adalah pintu antara aplikasi dan transport (`05-transport/01`). Dua perbedaan yang harus terasa di jari Anda:

| | UDP (`SOCK_DGRAM`) | TCP (`SOCK_STREAM`) |
|---|---|---|
| Satuan | Datagram: satu `sendto` = satu `recvfrom` | Aliran byte: batas `send` tidak dipertahankan |
| Keandalan | Tidak ada. Aplikasi memasang timeout dan mengulang | Dijamin kernel (bagian 4 sampai 6 di `05-transport/02-tcp`) |
| Koneksi | Tidak ada | `connect` / `listen` / `accept` |

Karena TCP adalah aliran byte, `recv(1000)` boleh mengembalikan 1 byte, 7 byte, atau 1000 byte. Aplikasi yang mengirim beberapa pesan lewat TCP wajib membuat **framing** sendiri. Teknik paling sederhana: awali setiap pesan dengan panjangnya (4 byte, big-endian).

HTTP/1.1 (RFC 9112) memakai framing berbasis teks: header diakhiri baris kosong `\r\n\r\n`. Panjang body lalu ditentukan oleh `Content-Length`, atau oleh `Transfer-Encoding: chunked` (potongan-potongan berawalan ukuran heksadesimal, diakhiri potongan berukuran 0). Respons yang tidak memakai keduanya berakhir saat koneksi ditutup.

```
GET / HTTP/1.1\r\n                       HTTP/1.1 200 OK\r\n
Host: example.com\r\n                    Transfer-Encoding: chunked\r\n
Connection: close\r\n                    \r\n
\r\n                                     5\r\nhalo \r\n
                                         5\r\ndunia\r\n
                                         0\r\n\r\n
```

### TUGAS

1. **7.1a** `udp_kirim_terima`: kirim datagram, tunggu balasan dengan timeout, ulangi sampai `ulang` kali, lalu lempar `TimeoutError`.
2. **7.1b** `terima_tepat(sock, n)`: kumpulkan tepat `n` byte meski `recv` mengembalikan potongan kecil. `recv` yang mengembalikan `b""` berarti koneksi ditutup.
3. **7.1c** `kirim_pesan` / `terima_pesan`: framing panjang-awalan 4 byte.
4. **7.1d** `tcp_echo_layani`: server yang menerima satu koneksi dan menggemakan setiap pesan.
5. **7.1e-h** `buat_request_get`, `_dekode_chunked`, `urai_respons_http`, `http_get`: klien HTTP/1.1 tanpa library HTTP.

Fungsi `udp_echo_sekali` sudah jadi sebagai contoh pola `recvfrom`/`sendto`.

### UJI OTOMATIS dan percobaan nyata

```bash
(.venv) $ pytest --impl=starter tests/test_71_soket.py -v
(.venv) $ python3 jalankan.py --impl starter http example.com
HTTP/1.1 200 OK
date: ...
content-type: text/html; charset=utf-8
transfer-encoding: chunked
...
```

Uji memakai `SoketPelit`, tiruan socket yang hanya mengembalikan 3 byte per `recv`, sehingga kode yang menganggap "satu `recv` = satu pesan" pasti gagal. Uji HTTP menjalankan server lokal di 127.0.0.1 (tidak butuh internet), termasuk server mentah yang mengirim respons chunked sepotong-sepotong 7 byte.

**KRITERIA SUKSES:** Semua uji `test_71_soket.py` lulus dengan `--impl=starter`; `jalankan.py http` berhasil mengambil sebuah situs HTTP biasa (port 80).

<details><summary>Pembahasan</summary>

Inti `terima_tepat` adalah perulangan yang menolak berasumsi:

```python
potongan = bytearray()
while len(potongan) < n:
    b = sock.recv(n - len(potongan))
    if not b:
        raise ConnectionError(...)
    potongan += b
```

Untuk HTTP, request memakai `Connection: close`, sehingga klien cukup membaca sampai `recv` mengembalikan `b""` lalu mengurai semuanya sekaligus. Klien sungguhan (browser, curl) memakai koneksi persisten dan harus berhenti membaca tepat di akhir body. Untuk itulah `Content-Length` dan chunked ada.

Kesalahan umum:
- Lupa `\r\n` (memakai `\n` saja). Banyak server menoleransinya, tetapi tidak semuanya.
- Lupa header `Host`. HTTP/1.1 mewajibkannya, karena satu IP melayani banyak situs (virtual hosting).
- Menganggap nama header peka huruf besar-kecil. Nama header HTTP tidak peka huruf, jadi simpan dalam huruf kecil.
- Menganggap `sendall` dan `send` sama. `send` boleh mengirim sebagian; `sendall` mengulang sampai semua terkirim.

> [!TIP]
> HTTPS tidak dicakup di sini. Untuk mencobanya, bungkus socket dengan `ssl.create_default_context().wrap_socket(s, server_hostname=host)`; sisa kode klien tidak berubah, karena TLS bekerja di bawah HTTP (`06-aplikasi/04-tls-pki`).
> </details>

---

## Lab 7.2: Transfer Andal di atas Kanal Rusak

**Berkas:** `starter/rdt.py` · **Uji:** `tests/test_72_rdt.py` · **Teori:** `05-transport/02-tcp` bagian 12

### Konsep: kanal rusak dan protokol "sans-IO"

`umum/kanal.py` menyediakan kanal satu arah yang bisa membuang, menduplikasi, mengacak urutan, dan membalik satu bit paket dengan peluang yang Anda atur, ditambah tunda propagasi dan laju link. Semua keacakan berasal dari satu `random.Random(seed)`, sehingga seed yang sama selalu menghasilkan kejadian yang sama. Kegagalan yang Anda lihat hari ini bisa diulang besok untuk di-debug.

Pengirim dan penerima yang Anda tulis tidak pernah menyentuh socket atau jam. Mereka hanya bereaksi:

```
pengirim.kirim(sekarang)         -> list[bytes]   paket yang ingin dikirim sekarang
pengirim.terima(paket, sekarang)                  ACK tiba
pengirim.tenggat()               -> float | None  kapan saya ingin dibangunkan (timer)
pengirim.selesai()               -> bool          semua data sudah di-ACK?
penerima.terima(paket, sekarang) -> list[bytes]   balasan (ACK)
penerima.data()                  -> bytes         data yang sudah diserahkan ke aplikasi
```

Gaya ini membuat kode yang sama bisa dijalankan di dua dunia: `simulasikan()` (waktu virtual, deterministik, ribuan paket dalam sepersekian detik) dan `jalankan_di_udp()` (dua socket UDP sungguhan di 127.0.0.1, kerusakan disuntikkan sebelum `sendto`).

Format paket yang sudah disediakan (`buat_paket`, `urai_paket`):

```
 0       1       2       3       4       5       6       7
+-------+-------+-------+-------+-------+-------+-------+-------+
| tipe  | cadang|      seq      |    panjang    |   checksum    |
+-------+-------+-------+-------+-------+-------+-------+-------+
| muatan ...                                                    |
tipe: 0 = DATA, 1 = ACK. Checksum: Internet checksum atas header + muatan.
GBN: ACK kumulatif, seq = paket BERIKUTNYA yang diharapkan (gaya TCP).
SR : ACK individual, seq = paket yang diterima.
```

`urai_paket` mengembalikan `None` untuk paket rusak. Perlakukan `None` persis seperti paket hilang.

### TUGAS

1. **7.2a** `periksa_jendela`: tolak jendela yang melanggar batas ruang nomor urut (GBN ≤ ruang−1, SR ≤ ruang/2).
2. **7.2b** `utilisasi`: rumus U = min(1, N·(L/R)/(RTT + L/R)).
3. **7.2c-d** `PengirimGBN` dan `PenerimaGBN`. Jendela 1 otomatis menjadi stop-and-wait.
4. **7.2e-f** `PengirimSR` dan `PenerimaSR`.

> [!TIP]
> Simpan indeks absolut (0, 1, 2, ...) di pengirim, dan ubah ke nomor di kabel hanya saat membuat paket (`i % ruang_seq`). Untuk menafsirkan nomor yang datang, hitung jaraknya dari base: `d = (seq - base) % ruang_seq`. Hampir semua bug wrap-around hilang dengan dua kebiasaan ini.

### UJI OTOMATIS

```bash
(.venv) $ pytest --impl=starter tests/test_72_rdt.py -v
```

Yang diperiksa, dari yang paling dasar:
- setiap kesalahan 1 bit pada paket terdeteksi checksum;
- kanal sempurna: data utuh tanpa satu pun retransmisi;
- stop-and-wait: goodput terukur cocok dengan rumus utilisasi (selisih di bawah 2%);
- pipelining: jendela 4 lebih dari 3,5 kali stop-and-wait;
- kanal rusak (10% hilang, 5% duplikat, 5% korupsi, 10% diacak) dengan 5 seed: data selalu utuh;
- SR mengirim paket kurang dari 60% jumlah paket GBN di kanal yang sama, dengan goodput lebih tinggi;
- **kegagalan diam-diam:** jendela yang melanggar batas (SR jendela 3 dengan 4 nomor urut; GBN jendela 4 dengan 4 nomor urut) membuat pengirim mengira transfer selesai padahal data di penerima salah;
- **reordering:** GBN dengan 8 nomor urut merusak data begitu kanal mengacak urutan, walau jendelanya sah; dengan 256 nomor urut aman;
- transfer yang sama di atas socket UDP sungguhan.

### Eksperimen: ukur sendiri

```bash
(.venv) $ python3 jalankan.py --impl starter rdt
Data 300000 byte, RTT 20.0 ms, laju 10.0 Mbps, hilang 0.0, duplikat 0.0, korupsi 0.0, acak 0.0
protokol   jendela  teori U      goodput   paket   retx  benar
stop&wait        1     3.9%    0.384 Mbps     300      0   True
GBN              4    15.5%    1.535 Mbps     300      0   True
GBN             16    62.0%    5.936 Mbps     300      0   True
GBN             32   100.0%    9.163 Mbps     300      0   True
GBN             64   100.0%    9.163 Mbps     300      0   True
SR               1     3.9%    0.384 Mbps     300      0   True
...

(.venv) $ python3 jalankan.py rdt --hilang 0.05 --jendela 32 --seed 1
GBN             32   100.0%    1.175 Mbps     753    453   True
SR              32   100.0%    2.364 Mbps     331     31   True
```

Angka di atas berasal dari kode referensi. Kode Anda yang benar akan memberi angka yang sama persis untuk seed yang sama, karena simulatornya deterministik. Jawab pertanyaan berikut di catatan lab Anda:

1. Mengapa goodput berhenti naik di sekitar jendela 26 paket? Hitung BDP link 10 Mbps dengan RTT 20 ms dalam satuan paket 1.008 byte.
2. Mengapa goodput maksimum 9,16 Mbps, bukan 10 Mbps? (Petunjuk: header 8 byte per 1.000 byte muatan, dan RTT pertama ketika pipa belum penuh.)
3. Dengan 5% loss, goodput GBN dan SR jauh di bawah 10 Mbps. Ubah `--rto` menjadi 0.05 dan 0.5. Apa yang terjadi, dan mengapa TCP menghitung RTO dari RTT terukur alih-alih memakai konstanta?
4. Jalankan `rdt --udp`. Mengapa hasilnya berubah sedikit setiap dijalankan, padahal seed-nya sama? (Petunjuk: penjadwalan thread dan waktu nyata. Mode UDP juga tidak memodelkan laju link, jadi kolom "teori U" tidak berlaku di sana.)

**KRITERIA SUKSES:** Semua uji `test_72_rdt.py` lulus dengan `--impl=starter`; Anda bisa menjelaskan tabel goodput dengan rumus utilisasi dan BDP.

<details><summary>Pembahasan</summary>

Inti pengirim GBN adalah dua blok: timeout mengirim ulang seluruh jendela, lalu paket baru diisi selama jendela belum penuh.

```python
if self._timer is not None and sekarang >= self._timer:
    for i in range(self._base, self._next):      # Go-Back-N: ulang SEMUA
        keluar.append(self._paket(i))
    self._timer = sekarang + self.rto
while self._next < len(self._potongan) and self._next - self._base < self.jendela:
    if self._next == self._base:                  # paket pertama di jendela kosong
        self._timer = sekarang + self.rto
    keluar.append(self._paket(self._next))
    self._next += 1
```

Saat ACK datang, `maju = (ack - base) % ruang_seq` harus berada di antara 1 dan jumlah paket yang sedang dalam perjalanan. Nilai 0 adalah duplicate ACK (bahan fast retransmit); nilai di luar rentang adalah ACK basi.

Penerima SR menerima nomor dalam jendelanya (`d < jendela`), dan tetap meng-ACK nomor dari jendela sebelumnya (`d >= ruang_seq - jendela`). Bila yang kedua dilupakan, ACK yang hilang membuat pengirim mengulang paket lama selamanya, karena penerima diam saja.

Uji "kegagalan diam-diam" adalah pelajaran terpenting lab ini: checksum hanya menjamin isi paket utuh, bukan bahwa paket itu baru. Pembedaan paket baru dari paket lama sepenuhnya tugas nomor urut, dan itu hanya berhasil bila ruang nomor urut cukup besar dibanding jendela dan dibanding lamanya paket bisa "tersesat" di jaringan. Itulah sebabnya TCP memakai 32 bit, MSL, dan PAWS.

**Tantangan tambahan (tanpa kunci jawaban):**
- RTO adaptif: ukur RTT dari ACK (abaikan paket yang dikirim ulang, sesuai algoritma Karn) dan hitung RTO = SRTT + 4·RTTVAR (RFC 6298).
- Fast retransmit di GBN: kirim ulang paket base setelah 3 duplicate ACK, lalu bandingkan goodput dengan versi tanpa fast retransmit.
- Jendela dinamis sederhana: naikkan jendela 1 setiap RTT tanpa loss, bagi dua saat loss (AIMD, `05-transport/04-congestion-control`).
</details>

---

## Lab 7.3: Traceroute Buatan Sendiri

**Berkas:** `starter/traceroute.py` · **Uji:** `tests/test_73_traceroute.py` · **Teori:** `04-network-layer/04-arp-icmp`

### Konsep

Traceroute mengeksploitasi aturan sederhana: router yang menurunkan TTL ke 0 membuang paket dan mengirim **ICMP Time Exceeded** (tipe 11, kode 0) ke pengirim. Kirim probe dengan TTL 1, 2, 3, dan seterusnya, maka setiap router di jalur memperkenalkan diri satu per satu. Probe klasik adalah datagram UDP ke port "tidak mungkin dipakai" mulai 33434. Ketika probe akhirnya sampai di tujuan, tidak ada aplikasi di port itu, sehingga tujuan membalas **ICMP Port Unreachable** (tipe 3, kode 3): tanda untuk berhenti.

Bagaimana kita tahu balasan ICMP itu milik probe yang mana? ICMP error wajib mengutip header IP paket asli ditambah 8 byte pertama muatannya (RFC 792), dan 8 byte itu tepat header UDP probe kita, lengkap dengan port tujuannya:

```
+---------------------------+
| Header IPv4 (dari router) |  sumber = router yang membuang probe
+---------------------------+
| ICMP tipe 11 / kode 0     |  + checksum + 4 byte tidak dipakai
+---------------------------+
| Kutipan: header IPv4 asli |  tujuan = target traceroute
| Kutipan: 8 byte UDP asli  |  port tujuan = 33434 + n  ← kunci pencocokan
+---------------------------+
```

Karena itu setiap probe memakai port unik. Balasan yang port-nya tidak cocok (milik probe sebelumnya yang terlambat, milik traceroute lain di mesin yang sama, atau sampah) harus diabaikan.

### Tiga cara menerima ICMP

| Mode | Butuh | Cara kerja |
|---|---|---|
| `simulasi` | Tidak ada | Jaringan tiruan berwaktu virtual: router diam, ECMP, balasan terlambat, ICMP nyasar. Untuk uji otomatis |
| `recverr` | Linux, tanpa root | Socket UDP biasa dengan opsi `IP_RECVERR`. Kernel menaruh ICMP error untuk socket kita di antrean error, dibaca dengan `recvmsg(..., MSG_ERRQUEUE)`. Pendekatan yang sama dipakai `tracepath` dari iputils |
| `raw` | Root atau `CAP_NET_RAW` | Socket `SOCK_RAW`/`IPPROTO_ICMP` menerima semua paket ICMP mentah, termasuk header IPv4. Anda mengurai semuanya sendiri |

Ketiga backend sudah tersedia di `umum/penjejak.py` dan punya antarmuka sama: `kirim_probe(ttl, port)` dan `terima(batas)`. Backend `simulasi` dan `raw` mengembalikan paket IPv4 mentah (Anda yang mengurai); backend `recverr` mengembalikan `InfoICMP` yang sudah diurai kernel.

### TUGAS

1. **7.3a** `urai_balasan_icmp(paket)`: urai IPv4 luar, ICMP, lalu kutipan IPv4 dan UDP di dalamnya. Kembalikan `InfoICMP` atau `None` untuk apa pun yang bukan balasan probe (echo reply, checksum salah, kutipan TCP, paket terpotong).
2. **7.3b** `traceroute(...)`: perulangan TTL, port unik per probe, pencocokan port dan alamat tujuan, catat `*` bila batas waktu lewat, berhenti setelah hop yang menjawab Destination Unreachable.
3. **7.3c** `format_hop(hop)`: format baris seperti traceroute Linux, termasuk alamat ECMP dan anotasi `!H`, `!N`, `!X`.

### UJI OTOMATIS dan percobaan nyata

```bash
(.venv) $ pytest --impl=starter tests/test_73_traceroute.py -v

(.venv) $ python3 jalankan.py --impl starter traceroute --mode simulasi
traceroute ke 203.0.113.5 (203.0.113.5), maks 30 hop, mode simulasi
 1  192.168.1.1  1.263 ms  1.188 ms  1.103 ms
 2  10.20.0.1  5.919 ms  5.934 ms  6.534 ms
 3  *  *  *
 4  103.28.0.5  9.854 ms  103.28.0.1  10.001 ms  103.28.0.5  8.989 ms
 5  198.51.100.9  20.117 ms  21.237 ms  23.069 ms
 6  203.0.113.5  21.264 ms  23.920 ms  22.749 ms

(.venv) $ python3 jalankan.py --impl starter traceroute 127.0.0.1 --maks-hop 3
 1  127.0.0.1  0.081 ms  0.030 ms  0.026 ms

(.venv) $ python3 jalankan.py --impl starter traceroute 1.1.1.1              # Linux, tanpa root
(.venv) $ sudo .venv/bin/python3 jalankan.py --impl starter traceroute 1.1.1.1 --mode raw
```

Uji `recverr` ke 127.0.0.1 berjalan tanpa root dan tanpa internet: kernel sendiri yang membalas Port Unreachable dari loopback, jadi jalur kode IP_RECVERR benar-benar teruji. Uji mode raw dilewati (skip) bila Anda bukan root.

Bandingkan hasil traceroute buatan Anda ke beberapa tujuan (misalnya server lokal di IIX, situs luar negeri) dengan `traceroute -n` atau `mtr -n` bawaan sistem. Jumlah hop dan alamatnya seharusnya mirip; RTT tentu berbeda sedikit.

**KRITERIA SUKSES:** Semua uji `test_73_traceroute.py` lulus dengan `--impl=starter` (yang raw boleh skip); traceroute Anda ke satu tujuan internet sesuai dengan `traceroute -n` bawaan.

<details><summary>Pembahasan</summary>

Pengurai yang benar berlapis tiga dan menyerah dengan anggun (`None`) di setiap lapis:

```python
luar = PaketIPv4.dari_bytes(paket)                 # header IP router
icmp = PaketICMP.dari_bytes(luar.muatan)           # tipe 11 atau 3, checksum valid
dalam = PaketIPv4.dari_bytes(icmp.isi)             # KUTIPAN: header IP probe kita
_, port_tujuan, _ = urai_udp(dalam.muatan)         # 8 byte UDP: port pencocokan
```

Uji `test_balasan_terlambat_tidak_tertukar` memodelkan router yang menjawab dalam 1,5 detik sementara timeout 1 detik. Implementasi yang tidak mencocokkan port akan menempelkan balasan terlambat itu ke probe berikutnya, sehingga hop 2 tampak menjawab dan RTT-nya ngawur. Bug persis seperti ini pernah membuat banyak orang salah membaca output traceroute nyata.

Hal yang perlu Anda pahami dari output traceroute sungguhan:
- **`* * *` tidak berarti putus.** Banyak router membatasi laju (rate-limit) atau tidak mengirim ICMP sama sekali, tetapi tetap meneruskan paket. Hop berikutnya yang menjawab membuktikan jalurnya hidup.
- **Alamat berganti di satu hop** berarti ECMP atau load balancing per flow. Setiap probe memakai port berbeda, sehingga hash 5-tuple berbeda dan jalurnya pun bisa berbeda. Itulah motivasi Paris traceroute yang menjaga 5-tuple tetap.
- **RTT hop tengah lebih tinggi daripada hop terakhir** sering terjadi: membuat ICMP adalah pekerjaan CPU (slow path) router, sedangkan meneruskan paket adalah pekerjaan ASIC (fast path). RTT hop tengah bukan ukuran latency jalur.
- **Jalur pulang bisa berbeda** dari jalur pergi. Traceroute hanya melihat arah pergi.
</details>

---

## Lab 7.4: Router Mini

**Berkas:** `starter/router.py` · **Uji:** `tests/test_74_router.py` · **Teori:** `04-network-layer/04-arp-icmp`, `04-network-layer/05-routing-dasar`

### Konsep

Router Anda menerima frame Ethernet mentah di sebuah antarmuka dan mengembalikan daftar `(antarmuka_keluar, frame)`. Tidak ada kernel yang membantu: Anda yang memutuskan semuanya.

```
frame masuk ──► MAC tujuan = saya / broadcast? ──tidak──► buang
                    │
           ┌────────┴────────┐
         ARP               IPv4 ──checksum salah──► buang diam-diam
           │                 │
   request untuk saya?   tujuan = IP saya? ──ya──► echo request → echo reply
   → reply, pelajari         │                     UDP/TCP → ICMP 3/3
   reply → pelajari,     TTL <= 1? ──ya──► ICMP 11/0 (time exceeded)
   kirim antrean             │
                         LPM di trie ──tidak ada──► ICMP 3/0 (net unreachable)
                             │
                         TTL − 1, hitung ulang checksum
                             │
                         next hop = gateway rute, atau tujuan bila connected
                             │
                         MAC next hop di cache ARP? ──ya──► kirim frame
                             │ tidak
                         antrekan paket, kirim ARP request (sekali)
                         ulangi tiap 1 s; setelah 3 kali → ICMP 3/1 (host unreachable)
```

**Longest prefix match dengan trie biner.** Setiap level trie memutuskan satu bit alamat, dari bit paling kiri. Prefix /n disimpan di simpul kedalaman n. Untuk mencari, telusuri bit-bit alamat dari akar sambil mengingat simpul terakhir yang menyimpan rute:

```
Rute: 0.0.0.0/0 (D), 10.0.0.0/8 (A), 10.1.0.0/16 (B)
Cari 10.1.200.1 = 00001010.00000001.11001000.00000001

akar (D) ─0─0─0─0─1─0─1─0─► kedalaman 8 (A) ─0─0─0─0─0─0─0─1─► kedalaman 16 (B) ─1─► (tidak ada anak)
          terbaik: D               terbaik: A                          terbaik: B   → jawaban B
```

Trie seperti ini paling mudah dipahami. Router sungguhan memakai struktur yang lebih padat (trie multibit, atau TCAM di perangkat keras yang membandingkan semua prefix sekaligus dalam satu siklus), tetapi jawabannya harus sama persis.

### TUGAS

1. **7.4a-b** `TrieBiner.sisip`, `hapus`, `cari`.
2. **7.4c** `CacheARP.simpan`, `cari` dengan masa berlaku.
3. **7.4d** `_tangani_arp`: jawab request untuk IP antarmuka ini, pelajari pengirim, kirim paket yang menunggu.
4. **7.4e** `_tangani_ipv4`: urutan keputusan seperti diagram.
5. **7.4f** `_untuk_saya`: ping ke router, dan UDP/TCP ke router.
6. **7.4g** `_kirim_lewat`: ARP cache, antrean, ARP request sekali per next hop.
7. **7.4h** `_icmp_error`: kutipan header asli + 8 byte; jangan membalas ICMP error dengan ICMP error, dan jangan membuat error untuk paket buatan router sendiri.
8. **7.4i** `tick`: ARP request ulang dan host unreachable.

### UJI OTOMATIS

```bash
(.venv) $ pytest --impl=starter tests/test_74_router.py -v
```

Topologi sintetis di uji:

```
                   eth0 10.0.0.1/24              eth1 172.16.0.1/30
host H1 10.0.0.10 ------------- [ ROUTER ] -------------------- R2 172.16.0.2
                                    | eth2 192.168.50.1/24
                                    +---- LAN 192.168.50.0/24
Rute: 0.0.0.0/0 via 172.16.0.2 | 198.51.100.0/24 via 172.16.0.2 | 198.51.100.128/25 via 192.168.50.254
```

Uji terpenting adalah `test_trie_sama_dengan_pencarian_linear`: 600 prefix acak yang banyak tumpang tindih di 10.0.0.0/8, 3.000 pencarian, dibandingkan dengan pencarian linear yang jelas benar. Uji lain memeriksa TTL turun tepat 1 dengan checksum yang valid, /25 menang atas /24 dan /0, kutipan ICMP berisi header asli (TTL sebelum dikurangi), dan urutan ARP request 1, 2, 3 lalu host unreachable.

**KRITERIA SUKSES:** Semua uji `test_74_router.py` lulus dengan `--impl=starter`.

<details><summary>Pembahasan</summary>

Pencarian LPM pada trie:

```python
simpul = self._akar
terbaik = (0, simpul.nilai) if simpul.ada else None
for i in range(32):
    simpul = simpul.anak[(alamat >> (31 - i)) & 1]
    if simpul is None:
        break
    if simpul.ada:
        terbaik = (i + 1, simpul.nilai)
```

Paling banyak 32 langkah, berapa pun jumlah rutenya. Bandingkan dengan pencarian linear yang memeriksa semua rute: tabel BGP penuh IPv4 kini berisi lebih dari satu juta prefix (data harian di bgp.potaroo.net), jadi perbedaan ini menentukan apakah router bisa meneruskan jutaan paket per detik.

Detail yang sering terlewat:
- **Kutipan ICMP harus dari paket asli**, sebelum TTL dikurangi. Simpan bytes yang diterima, lalu bangun ulang paket yang diteruskan secara terpisah.
- **Jangan membalas ICMP error dengan ICMP error** (RFC 1122 bagian 3.2.2). Tanpa aturan ini, dua router yang salah konfigurasi bisa saling membanjiri dengan error tentang error.
- **Satu ARP request per next hop**, bukan per paket. Seratus paket ke host yang sama tidak boleh memicu seratus broadcast.
- **Alamat sumber ICMP.** Router ini memakai IP antarmuka tempat paket masuk. RFC 1812 bagian 4.3.2.4 mensyaratkan alamat milik antarmuka tempat ICMP *dikirim keluar*. Pada topologi simetris keduanya sama; pada routing asimetris berbeda. Mengikuti RFC secara persis adalah tantangan tambahan yang baik.

**Tantangan tambahan:** tambahkan penghitung statistik per antarmuka (`ip_in_receives`, `ip_forw_datagrams`, `icmp_out_time_excds`) lalu bandingkan maknanya dengan `netstat -s` atau `nstat` di Linux; atau sambungkan router ini ke antarmuka TAP di Linux (`13-linux-networking/02-virtual-networking`) supaya bisa di-ping dari host sungguhan (butuh root).
</details>

---

## Lab 7.5: Protokol Distance-Vector

**Berkas:** `starter/dv.py` · **Uji:** `tests/test_75_dv.py` · **Teori:** `07-routing-lanjutan/02-konsep-routing-dinamis`, `07-routing-lanjutan/03-rip`

### Konsep

Setiap node menyimpan vektor jarak terakhir dari setiap tetangga dan menghitung ulang tabelnya dengan persamaan Bellman-Ford:

```
D_x(y) = min over tetangga v of ( c(x, v) + D_v(y) ),   dibatasi tak hingga (16, seperti RIP)
```

Simulator `umum/simdv.py` berjalan per **ronde**: setiap node membuat iklan untuk setiap tetangga berdasarkan keadaannya di awal ronde, lalu semua iklan dikirim sekaligus. Ini meniru pembaruan periodik RIP yang kebetulan serempak, dan cukup untuk memperlihatkan count-to-infinity secara deterministik.

Dua opsi pencegahan loop:
- **Split horizon:** jangan iklankan rute ke tetangga yang menjadi next hop rute itu.
- **Poison reverse:** iklankan rute itu ke next hop-nya dengan biaya tak hingga.

### TUGAS

1. **7.5a** `putuskan`: lupakan tetangga dan vektornya, hitung ulang.
2. **7.5b** `buat_iklan`: terapkan split horizon atau poison reverse.
3. **7.5c** `terima_iklan`: simpan vektor terbaru dari tetangga, hitung ulang.
4. **7.5d** `hitung_ulang`: Bellman-Ford dari nol. Tujuan yang tak terjangkau disimpan sebagai tak hingga (route poisoning), bukan dihapus.

> [!WARNING]
> Satu aturan yang terasa janggal tetapi wajib: bila next hop Anda sendiri melaporkan biaya naik, Anda harus ikut naik walaupun hasilnya lebih buruk. Tanpa aturan ini, node tidak akan pernah melupakan rute yang mati. Aturan yang sama inilah yang memungkinkan count-to-infinity.

### UJI OTOMATIS dan demonstrasi

```bash
(.venv) $ pytest --impl=starter tests/test_75_dv.py -v
(.venv) $ python3 jalankan.py --impl starter dv
Konvergen awal dalam 3 ronde:
A: B:1 via B, C:2 via B
B: A:1 via A, C:1 via C
C: A:2 via B, B:1 via B

Tautan B-C putus.
ronde  1: A->C=4  B->C=3
ronde  2: A->C=4  B->C=5
ronde  3: A->C=6  B->C=5
...
ronde 12: A->C=14  B->C=15
ronde 13: A->C=inf  B->C=15
ronde 14: A->C=inf  B->C=inf
Konvergen setelah 15 ronde

(.venv) $ python3 jalankan.py --impl starter dv --split-horizon
Tautan B-C putus.
ronde  1: A->C=inf  B->C=inf
ronde  2: A->C=inf  B->C=inf
Konvergen setelah 2 ronde

(.venv) $ python3 jalankan.py --impl starter dv --skenario segitiga --poison-reverse
```

Baca output pertama perlahan. Setelah B-C putus, B melihat A mengiklankan "C dengan biaya 2" (padahal rute A ke C lewat B sendiri), jadi B menyimpulkan "C lewat A, biaya 3". A melihat B naik menjadi 3, lalu naik menjadi 4. Keduanya saling percaya dan menghitung naik dua langkah setiap dua ronde sampai 16. Selama itu, paket ke C berputar-putar di antara A dan B sampai TTL-nya habis. Split horizon memutus siklus itu sejak ronde pertama, karena A tidak pernah memberi tahu B tentang rute yang ia pelajari dari B.

**KRITERIA SUKSES:** Semua uji `test_75_dv.py` lulus dengan `--impl=starter`; Anda bisa menjelaskan output skenario `segitiga` dengan kata-kata sendiri.

<details><summary>Pembahasan</summary>

**Mengapa skenario segitiga tetap menghitung sampai tak hingga, bahkan dengan poison reverse?** Topologinya A, B, C saling terhubung, dan D tergantung di C. Setelah C-D putus, C meracuni D ke A dan B. Tetapi pada ronde yang sama, A memberi tahu B "D lewat saya biaya 2" (rute A ke D lewat C, bukan lewat B, jadi split horizon tidak berlaku), dan B memberi tahu A hal yang sama. Masing-masing lalu percaya ada jalur lewat yang lain. Rute palsu itu berputar mengelilingi segitiga sambil bertambah 1 setiap ronde:

```
ronde 1: A->D=3  B->D=3  C->D=inf
ronde 2: A->D=inf  B->D=inf  C->D=4
ronde 3: A->D=inf  B->D=5  C->D=inf
...      (berputar C → B → A → C, terus naik)
ronde 14: semua inf
```

Split horizon dan poison reverse hanya mencegah loop dua node. Loop tiga node atau lebih hanya dibatasi oleh nilai tak hingga yang kecil (16 di RIP, itulah alasan RIP tidak bisa dipakai di jaringan berdiameter lebih dari 15 hop), ditambah **hold-down timer** dan **triggered update**. Uji `test_tak_hingga_lebih_kecil_mempercepat_konvergensi` memperlihatkan pertukarannya: tak hingga 8 konvergen lebih cepat daripada 16, tetapi membatasi diameter jaringan. Protokol link-state (OSPF, IS-IS) menghindari masalah ini sama sekali, karena setiap router menghitung jalur dari peta topologi lengkap, bukan dari kabar tetangga. Protokol path-vector (BGP) menghindarinya dengan membawa seluruh daftar AS di setiap rute dan menolak rute yang memuat AS-nya sendiri.

**Split horizon versus poison reverse di simulator ini.** Di sini setiap iklan *menggantikan* seluruh vektor lama dari tetangga itu, jadi rute yang tidak disebut (split horizon) langsung sama dengan rute bernilai tak hingga (poison reverse). Itulah sebabnya kedua opsi menghasilkan perilaku yang sama di semua uji. Di RIP sungguhan, update hanya memperbarui rute yang disebut di dalamnya, dan rute yang tidak lagi disebut baru dihapus setelah timer kedaluwarsa (180 detik di RIP). Poison reverse mempercepat hal ini dengan menyebut rute itu secara eksplisit sebagai tak terjangkau, dengan harga update yang lebih besar.

**Tantangan tambahan:**
- Tambahkan hold-down: setelah rute menjadi tak hingga, abaikan kabar baik tentang tujuan itu selama H ronde. Ukur pengaruhnya pada skenario segitiga.
- Bandingkan dengan RIP sungguhan: bangun tiga router FRRouting dalam network namespace (`lab/05-lab-linux-otomasi` dan `13-linux-networking/02-virtual-networking`), aktifkan RIP, putuskan satu link, dan amati `show ip rip` serta waktu konvergensinya.
</details>

---

## Ringkasan Lab 07

Anda telah menulis sendiri:
- **7.1** framing di atas aliran byte TCP dan klien HTTP/1.1 tanpa library, termasuk chunked encoding;
- **7.2** Go-Back-N dan Selective Repeat yang tetap benar di kanal yang membuang, menggandakan, mengacak, dan merusak paket, lalu mengukur bahwa stop-and-wait boros pada BDP besar dan bahwa jendela yang melanggar batas ruang nomor urut merusak data tanpa ada yang sadar;
- **7.3** traceroute yang mencocokkan balasan ICMP lewat kutipan header, dengan jalur tanpa root di Linux;
- **7.4** router dengan LPM trie, ARP cache dan antrean, penurunan TTL, serta ICMP error yang mengikuti aturan RFC;
- **7.5** distance-vector yang memperlihatkan count-to-infinity, perbaikannya dengan split horizon dan poison reverse, serta batas perbaikan itu pada loop tiga node.

> [!TIP]
> **Untuk portofolio:** simpan pekerjaan Anda di repositori Git sendiri bersama catatan eksperimen (tabel goodput, output traceroute dari jaringan Anda, penjelasan skenario segitiga). Ini bukti kemampuan yang jarang dimiliki pelamar posisi network engineer di Indonesia: mengerti mesin di balik konfigurasi yang mereka ketik. Jangan unggah output traceroute yang memuat alamat IP internal kantor Anda.

---

## Sumber

- Stanford CS144 Introduction to Computer Networking (inspirasi desain: membangun TCP dan router IP bertahap): https://cs144.github.io/
- Berkeley CS168 Project 2 Distance-Vector Routing (inspirasi tahapan split horizon, poison reverse, count-to-infinity): https://sp25.cs168.io/proj2/
- Berkeley CS168 Spring 2025, daftar proyek termasuk traceroute: https://sp25.cs168.io/
- Princeton COS 461 public assignments (inspirasi socket dan proxy HTTP): https://github.com/feamster/COS461-Public
- Computer Networks: A Systems Approach, bab 2.5 Reliable Transmission (Peterson & Davie, CC BY 4.0): https://book.systemsapproach.org/direct/reliable.html
- RFC 768, User Datagram Protocol: https://www.rfc-editor.org/rfc/rfc768
- RFC 791, Internet Protocol: https://www.rfc-editor.org/rfc/rfc791
- RFC 792, Internet Control Message Protocol: https://www.rfc-editor.org/rfc/rfc792
- RFC 826, An Ethernet Address Resolution Protocol: https://www.rfc-editor.org/rfc/rfc826
- RFC 1071, Computing the Internet Checksum: https://www.rfc-editor.org/rfc/rfc1071
- RFC 1122, Requirements for Internet Hosts: https://www.rfc-editor.org/rfc/rfc1122
- RFC 1812, Requirements for IP Version 4 Routers: https://www.rfc-editor.org/rfc/rfc1812
- RFC 2453, RIP Version 2: https://www.rfc-editor.org/rfc/rfc2453
- RFC 6298, Computing TCP's Retransmission Timer: https://www.rfc-editor.org/rfc/rfc6298
- RFC 9112, HTTP/1.1: https://www.rfc-editor.org/rfc/rfc9112
- Dokumentasi Python, modul socket: https://docs.python.org/3/library/socket.html
- Halaman manual Linux ip(7), opsi IP_RECVERR: https://man7.org/linux/man-pages/man7/ip.7.html
- iputils tracepath (contoh pemakaian IP_RECVERR): https://github.com/iputils/iputils

---

**Berikutnya:** `lab/08-lab-netdevops`. Lab NetDevOps: jaringan sebagai kode di atas containerlab.

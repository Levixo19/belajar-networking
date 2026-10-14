# Atribusi dan Lisensi Materi

Teks kurikulum di folder `materi/` dilisensikan di bawah **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**, lihat `materi/LICENSE`. Kode lab orisinal di `materi/lab/kode/` berlisensi MIT (`materi/lab/kode/LICENSE`); berkas yang diadaptasi dari proyek lain mempertahankan lisensi dan header aslinya.

Bagian berikut mengadaptasi atau mengutip karya pihak lain. Semua adaptasi telah diterjemahkan dan/atau diubah; perubahan dijelaskan per entri.

## Bagian analitis (00.3 §6, 01.2 §7, 04.5 §9, 07.2 §8)
- Larry Peterson & Bruce Davie, *Computer Networks: A Systems Approach*, © Elsevier 2012, https://github.com/SystemsApproach/book, CC BY 4.0. Diterjemahkan, diringkas, diberi contoh baru: §1.2.3 statistical multiplexing → 00.3 §6.1; §6.1 power/M/M/1 → 00.3 §6.4; §1.3 hourglass dan perspektif "HTTP is the New Narrow Waist" → 01.2 §7.3; §5.2 argumen end-to-end → 01.2 §7.1; §3.5 implementasi switch/TCAM/control-data plane → 04.5 §9.1 dan §9.4; §6.2 queuing disciplines → 04.5 §9.8; §3.4 forward search dan batas split horizon → 07.2 §8.1 dan §8.4.
- RFC 1958 (kutipan §2.1 apa adanya; §2.3 diparafrasekan), sesuai IETF Trust Legal Provisions.
## 05.2 §12 dan Lab 07
- Peterson & Davie, *Computer Networks: A Systems Approach*, CC BY 4.0: struktur dan contoh kegagalan "8 nomor urut, SWS=RWS=7, semua ACK hilang" dari §2.5 Reliable Transmission → 05.2 §12 (diterjemahkan, disusun ulang, contoh baru).
- Inspirasi desain saja (tanpa menyalin teks/kode; repo tidak berlisensi terbuka): Stanford CS144 (https://cs144.github.io/), Berkeley CS168 (https://sp25.cs168.io/), Princeton COS461-Public (https://github.com/feamster/COS461-Public). Semua kode Lab 07 orisinal, MIT.
## 07.10 IS-IS
- Peterson & Davie, *Computer Networks: A Systems Approach*, CC BY 4.0: §3.4.3 Link State (aturan reliable flooding dan algoritma forward search Confirmed/Tentative) → 07.10 §8 dan §9 (diterjemahkan, contoh diganti dengan topologi lab).
- Templat ipspace/netlab hanya dipakai untuk memeriksa sintaks (tidak ada teks/kode yang disalin).
## 22.1 MPLS dan LDP, 22.2 MPLS L3VPN
- Peterson & Davie, *Computer Networks: A Systems Approach*, §4.4 MPLS (https://book.systemsapproach.org/scaling/mpls.html), CC BY 4.0: kerangka tiga alasan MPLS tetap dipakai (perangkat non-IP, explicit routing, VPN) → 22.1 §2, ditulis ulang dengan kata-kata sendiri.
## 07.11 Interkoneksi Internet dan 07.6 §13
- Peterson & Davie, *Computer Networks: A Systems Approach*, CC BY 4.0: §4.1 "Common AS Relationships and Policies" (scaling/global.rst) → 07.11 §2.1 (diterjemahkan, diringkas, ditambah tabel ekspor dan contoh valley-free).
- RFC 8212 dan RFC 9319: kutipan pendek apa adanya di 07.6 §13.1 dan §13.3, sesuai IETF Trust Legal Provisions.
## Lab 08 NetDevOps (kode)
- srl-labs/srl-telemetry-lab, berkas `configs/gnmic/gnmic-config.yml`, © Nokia, BSD-3-Clause, https://github.com/srl-labs/srl-telemetry-lab → `materi/lab/kode/netdevops/telemetry/gnmic.yml` (struktur subscription dan processor `oper-state-to-int`). Header asli dipertahankan, perubahan dicatat di berkas, teks lisensi di `materi/lab/kode/netdevops/LICENSES/BSD-3-Clause-Nokia.txt`.
- prometheus/snmp_exporter, contoh konfigurasi Prometheus di README, Apache-2.0, https://github.com/prometheus/snmp_exporter → pola relabel di job `snmp` pada `telemetry/prometheus.yml` (disebutkan di berkas).

## Pustaka aplikasi (app/data/pustaka, app/data/pustaka-kurasi)
Pustaka hanya menyimpan judul, alamat, dan keterangan singkat; isi sumbernya tidak disalin. Daftar dari repo berlisensi terbuka diambil dengan atribusi:
- free-programming-books, EbookFoundation dan kontributornya, CC BY 4.0, https://github.com/EbookFoundation/free-programming-books → `app/data/pustaka/fpb.json` (bagian jaringan, Linux, keamanan, cloud; dikelompokkan ulang).
- awesome, Sindre Sorhus, CC0 1.0, https://github.com/sindresorhus/awesome → `awesome.json`.
- The System Design Primer, Donne Martin, CC BY 4.0, https://github.com/donnemartin/system-design-primer → `desain.json` (bagian DNS, CDN, load balancer, reverse proxy, komunikasi, ketersediaan, keamanan).
- Coding Interview University, John Washam dan kontributornya, CC BY-SA 4.0, https://github.com/jwasham/coding-interview-university → `ciu.json`, yang sebagai turunannya ikut berlisensi CC BY-SA 4.0 dan sengaja dipisah dari berkas lain.
- roadmap.sh, freeCodeCamp, getting-a-gig, dan build-your-own-x hanya ditautkan (proprietary, berhak cipta, atau tanpa lisensi).
- Data kurasi (`pustaka-kurasi/*.json`) ditulis sendiri dari hasil memeriksa tiap halaman; lisensi tiap tautan dicatat persis seperti di sumbernya beserta tanggal diperiksa.

## Rujukan tanpa adaptasi
Dokumentasi vendor (Cisco, Juniper, MikroTik, Nokia), dokumentasi FRRouting, buku mikro Systems Approach (CC BY-NC-ND), materi kursus Stanford CS144, Berkeley CS168, dan Princeton COS461, serta repo tanpa lisensi terbuka hanya dirujuk dan ditulis ulang dengan kata-kata sendiri; tidak ada teks atau kode yang disalin.

RFC dikutip sesuai IETF Trust Legal Provisions (TLP 5.0): kutipan pendek apa adanya dengan atribusi.

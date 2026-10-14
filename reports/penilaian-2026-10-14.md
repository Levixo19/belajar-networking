# Penilaian Jujur: Belajar Networking (2026-10-14)

Ditulis dari enam sudut pandang: full-stack, keamanan, UX, aksesibilitas, network
engineer, dan pendidik. Setiap temuan punya severity dan bukti `jalur:baris`.
Semua angka diukur ulang di sesi ini; angka dari audit sebelumnya yang ternyata
berbeda ditandai.

Severity: **KRITIS** (kerugian data atau keamanan nyata sekarang), **TINGGI**
(merusak pengalaman inti atau menyesatkan pelajar), **SEDANG** (cacat yang terasa),
**RENDAH** (kerapian).

## Ringkasan dalam satu paragraf

Isinya kuat: 144 modul, 883 kartu SRS, dan materi yang memang mengajarkan hal yang
dipakai di lapangan, termasuk tiga platform (Cisco, MikroTik, Linux). Aplikasinya
lebih lemah dari isinya. Server menerima tulis dan hapus dari seluruh LAN tanpa
autentikasi. Tidak ada satu tes pun. Ada bug tanggal yang memutus streak pemilik
setiap pagi sebelum pukul 08.00. Peta karier menggambar 184 hubungan sekaligus
sampai tidak terbaca, padahal datanya punya lima pasang "naik" yang saling
bertentangan. Lalu 559 "diagram" sebenarnya teks ASCII di dalam blok kode.
Pembelajar yang membuka modul secara acak punya peluang 56% (80 dari 144) mendarat
di halaman yang isinya cuma teks.

---

## 1. Keamanan

| # | Severity | Temuan | Bukti | Status |
|---|---|---|---|---|
| K1 | **KRITIS** | Server API mendengar di semua antarmuka: `app.listen(PORT)` tanpa host. Tanpa autentikasi, siapa pun di Wi-Fi yang sama bisa `DELETE /api/profiles/:id`. | `app/server/index.mjs:76` (versi lama) | **Diperbaiki** Fase 0: `listen(PORT, '127.0.0.1')` |
| K2 | **KRITIS** | MongoDB tanpa sandi dipetakan `0.0.0.0:27017`. Ini lebih buruk dari K1: database bisa dibaca dan dihapus langsung tanpa melewati API. | `app/docker-compose.yml:7`; `docker ps` menunjukkan `0.0.0.0:27017->27017/tcp` | **Diperbaiki**: `127.0.0.1:27017:27017`, kontainer dibuat ulang, data utuh (1 profil sebelum dan sesudah) |
| K3 | TINGGI | Vite `server.host: true` dan `vite preview --host` membuka proxy `/api` ke LAN, sehingga K1 tetap terbuka lewat port 5173/4173. | `app/vite.config.ts:9`, `app/package.json` skrip `preview` | **Diperbaiki** |
| K4 | TINGGI | `cors()` tanpa opsi menerima semua origin. Lebih penting lagi, tidak ada pemeriksaan Origin, jadi `<form method=post>` di situs mana pun bisa me-reset profil (CSRF). CORS saja tidak menolong, karena CORS cuma melarang MEMBACA jawaban. | `app/server/index.mjs:11` (lama) | **Diperbaiki**: Origin wajib lokal untuk POST/PUT/PATCH/DELETE |
| K5 | TINGGI | Tidak ada pemeriksaan Host, jadi DNS rebinding bisa membaca seluruh progres lewat GET walau server sudah loopback. | — | **Diperbaiki**: Host wajib `127.0.0.1`/`localhost`/`[::1]` dengan port aplikasi |
| K6 | SEDANG | Galat 500 membocorkan `e.message` (pesan Mongo bisa memuat nama koleksi atau isi kueri). | `app/server/index.mjs:14` (lama) | **Diperbaiki** |
| K7 | SEDANG | ID yang bukan ObjectId menghasilkan CastError, lalu 500. Kesalahan pemanggil dilaporkan sebagai kesalahan server. | `app/server/index.mjs:33` (lama) | **Diperbaiki**: 400 |
| K8 | SEDANG | `DELETE` selalu menjawab `{ok:true}` walau profilnya tidak ada. | `app/server/index.mjs:67` (lama) | **Diperbaiki**: 404 |
| K9 | SEDANG | `PUT /state` menyimpan tipe apa pun (`xp: "banyak"`, `progress: [1,2]`) karena `findByIdAndUpdate` tidak menjalankan validator bawaan; `name` bisa melewati `maxlength: 40`. | `app/server/index.mjs:47` (lama) | **Diperbaiki**: `periksaPatch()` + `runValidators` |
| K10 | RENDAH | `markdown-it` dengan `html: true`, lalu hasilnya lewat `dangerouslySetInnerHTML`. Aman selama `materi/` ditulis pemilik sendiri; berbahaya kalau suatu hari materi dari kontributor luar diterima tanpa ditinjau. | `app/scripts/build-content.mjs:56`, `app/src/components/RichProse.tsx:106` | Dicatat di AGENTS.md sebagai invarian |

Semua perbaikan K1–K9 dijaga `app/tests/server.test.mjs`, yang menembak dari sudut
penyerang memakai `node:http` (bukan `fetch`, karena `fetch` diam-diam membuang
header Host buatan dan membuat tes rebinding lulus karena alasan yang salah;
hal ini sempat terjadi saat tes pertama ditulis).

## 2. Kebenaran data dan logika

| # | Severity | Temuan | Bukti | Status |
|---|---|---|---|---|
| D1 | **KRITIS** | `todayStr()` memakai `toISOString()`, yaitu tanggal UTC. Pemilik ada di zona +08, jadi dari pukul 00.00 sampai 08.00 "hari ini" versi aplikasi masih kemarin. Belajar pukul 07.00 tercatat untuk kemarin, streak putus, dan kartu SRS jatuh tempo 8 jam terlambat. | `app/src/lib/srs.ts:4-7` (lama) | **Diperbaiki**: tanggal kalender lokal. Tes `todayStr memakai tanggal kalender LOKAL` gagal pada kode lama |
| D2 | TINGGI | Simpan = timpa seluruh peta (`progress`, `srs`, …). Dua tab terbuka berarti tab yang terakhir menyimpan menghapus pekerjaan tab lain tanpa jejak. | `app/src/lib/store.tsx:117-118`, `app/src/lib/api.ts:23` | **Belum**. Butuh penggabungan per kunci di server atau pemeriksaan versi; di luar cakupan Fase 0 |
| D3 | TINGGI | Lima pasang profesi saling "naik" (A naik ke B dan B naik ke A): it-operations-manager–solution-architect, it-consultant–solution-architect, it-consultant–security-architect, it-consultant–it-operations-manager, it-auditor–it-operations-manager. Tujuh "naik" turun jenjang, misalnya network-architect (senior) ke it-consultant (menengah). | `app/data/profesi/*.json`; diukur dari `src/generated/profesi.json` | Fase 2 |
| D4 | TINGGI | Perencana jalur mengabaikan arah "naik"; graf diperlakukan tak berarah. | `app/src/lib/profesi.ts:85` | Fase 2 |
| D5 | TINGGI | Kuis karier bias. Dari 4.096 kombinasi jawaban, solution-architect juara 492 kali, sedangkan system-administrator dan hardware-engineer tidak pernah juara (30 dari 32 bisa menang). | `app/src/lib/profesi.ts:155-167`; sapuan di sesi ini | Fase 2 |
| D6 | SEDANG | `/karier/xyz` diam-diam menampilkan network-engineer. | `app/src/pages/KarierPage.tsx:57` | Fase 2 |
| D7 | SEDANG | Materi menyebut "6 rumpun", UI menyebut "Tujuh rumpun". Keduanya benar menurut hitungannya sendiri (UI menghitung "inti"), dan justru karena itu membingungkan. | `materi/21-ekosistem-profesi/01-peta-ekosistem.md:4,221,449`; `app/src/pages/KarierPage.tsx:537` | Fase 2 |
| D8 | SEDANG | Gaji ada di 8 dari 32 profesi. it-consultant memakai halaman "Konsultan Teknis lintas bidang, bukan khusus TI" (konteksnya sendiri mengakuinya). it-operations-manager menggabungkan dua jabatan (IT Infrastructure Manager dan IT Manager) jadi satu rentang. Tanggal periksa terselip di dalam string `sumber`. | `app/data/profesi/tatakelola.json`, `operasi.json` | Fase 2 |
| D9 | SEDANG | Widget enrich yang anchor-nya tidak ada atau tipenya tidak dikenal hanya di-`console.warn` lalu hilang diam-diam; diagram dengan ID tak terdaftar dirender `null` tanpa pesan. | `app/scripts/build-content.mjs:194-196`, `app/src/components/RichProse.tsx:80-82` | Fase 5 (build gagal) |
| D10 | RENDAH | XP review bisa dipanen tanpa batas: setiap nilai di atas "Lagi" memberi 6 XP, termasuk kartu yang belum jatuh tempo. | `app/src/lib/store.tsx:140-143` | Dicatat |

## 3. Rekayasa (full-stack)

| # | Severity | Temuan | Bukti |
|---|---|---|---|
| R1 | TINGGI | Nol tes otomatis, nol CI. | (tidak ada `tests/`) → **Diperbaiki**: `npm test` dengan 24 tes `node:test` (srs, profesi, build konten, server) |
| R2 | SEDANG | `dist/` bisa basi terhadap `curriculum.json`: `npm run content` tidak membangun ulang bundel, sedangkan mode satu proses menyajikan `dist/`. | `docs/menjalankan-aplikasi.md` → **Diperbaiki** (didokumentasikan) |
| R3 | SEDANG | Dokumentasi menunjuk jalur lama `/home/vi/networking/app`; kontainer Mongo pun masih berlabel jalur itu. | `docs/menjalankan-aplikasi.md:7` → **Diperbaiki** |
| R4 | RENDAH | Klaim "tsc -b sering macet" **tidak terbukti**: `tsc -b` inkremental 0,35 detik, `tsc --noEmit` bersih 3,5 detik (3.221 berkas, 311 MB). | diukur di sesi ini |
| R5 | RENDAH | Kode mati: `Sidebar.tsx`, `TopBar.tsx`, `ProseView.tsx`, `ProgressRing.tsx` (cuma diimpor Sidebar), `useTicker` di `useInView.ts:22`. (`KarierTeaser.tsx` masih hidup lewat `lazy()`.) | grep impor → Fase 4 |
| R6 | RENDAH | `curriculum.json` 7,5 MB diimpor utuh ke bundel utama; setiap halaman memuat 144 modul HTML penuh. | `app/src/lib/content.ts:1` |
| R7 | RENDAH | `generatedAt` membuat keluaran build tidak deterministik, sehingga diff git atas berkas hasil selalu berubah. | `app/scripts/build-content.mjs:350` |

## 4. UX dan desain

| # | Severity | Temuan | Bukti |
|---|---|---|---|
| U1 | TINGGI | Peta karier: 184 sisi (79 naik + 105 dekat, sesudah deduplikasi) digambar sekaligus sebagai kurva-Q di atas elips. Arah naik tidak terlihat (tanpa panah). Hasilnya kabel kusut yang ditolak pemilik di dua proyek. (Audit sebelumnya menyebut 74/55; angka itu tidak cocok dengan data sekarang.) | `app/src/pages/KarierPage.tsx:137` |
| U2 | TINGGI | 80 dari 144 modul (56%) tidak punya satu pun diagram, foto, alat, game, atau kuis sisipan. Audit sebelumnya menyebut 83; selisihnya karena definisi, dan di sini kuis sisipan dihitung. | hitungan di sesi ini |
| U3 | TINGGI | 559 figur "Diagram/Skema" sebenarnya teks ASCII monospace; diagram SVG sungguhan cuma 42 yang terdaftar. (Audit sebelumnya menyebut 53.) | `app/scripts/build-content.mjs:80-115`, `app/src/diagrams/index.tsx` |
| U4 | SEDANG | Satu font (Atkinson) untuk judul DAN prosa. Keputusan itu benar untuk prosa, tapi membuat judul display terasa datar; pemilik mengeluh "terasa kosong". | `app/src/index.css:82-86` |
| U5 | SEDANG | Aplikasi dipakai HANYA di laptop, tapi ada MobileTabBar dan menu burger yang menambah kode dan kondisi tanpa pemakai. | `app/src/components/MobileTabBar.tsx` |

## 5. Aksesibilitas

| # | Severity | Temuan | Bukti |
|---|---|---|---|
| A1 | TINGGI | Lightbox diagram dan foto tanpa `role="dialog"`, tanpa `aria-modal`, tanpa fokus awal, tanpa jebakan fokus, dan tanpa pengembalian fokus. Tombol tutupnya tidak punya `onClick` sendiri (bergantung pada klik latar). | `app/src/components/RichProse.tsx:109-112`, `app/src/components/learn.tsx:161` |
| A2 | SEDANG | CommandPalette dan ProfileMenu punya `role="dialog"` tapi Tab lolos keluar dialog, dan fokus tidak kembali ke pemicunya saat ditutup. | `app/src/components/CommandPalette.tsx:52`, `app/src/components/ProfileMenu.tsx:35` |
| A3 | SEDANG | `meta theme-color` mengikuti tema SISTEM, bukan tema yang dipilih di aplikasi. | `app/index.html:8-9` |
| A4 | RENDAH | Reset profil memakai `confirm()` bawaan yang memblokir dan tidak bisa diberi gaya. | `app/src/lib/store.tsx:159` |

Kontras token diukur di Fase 4 untuk palet baru, di kedua tema.

## 6. Isi dan pedagogi (network engineer + pendidik)

| # | Severity | Temuan | Bukti |
|---|---|---|---|
| P1 | TINGGI | `materi/referensi/sumber-belajar.md` menulis semua sumber di dalam blok kode: nol tautan yang bisa diklik, padahal ada 917 URL (740 unik) di 126 modul lain. Halaman rujukan justru halaman yang paling tidak bisa dipakai merujuk. | `materi/referensi/sumber-belajar.md:9-16` |
| P2 | SEDANG | Panduan Packet Tracer cuma 5 langkah, padahal 20 lab Cisco memakainya dan Simulation Mode (alat konsep terbaik yang ada) tidak dibahas sama sekali. Ada salah ketik "proyek baba". | `materi/lab/00-setup-lab.md:63-69` |
| P3 | SEDANG | Celah kurikulum yang masih terbuka: 17.5 Operasi & Kontinuitas, 15.5 Rekayasa perangkat lunak untuk jaringan, Tahap 23, dan istilah yang muncul nol kali (XDP, 5G SA/UPF, Hubble, 400ZR, RFC 8925, DCQCN, ABR). | `reports/Celah kurikulum jaringan.md` → Fase 6 |
| P4 | RENDAH | Sintaks Cisco IOS XR dan Junos di beberapa modul belum pernah dijalankan di perangkat; Lab 08 NetDevOps baru diverifikasi statis. | catatan sesi sebelumnya |

Yang sudah bagus dan jangan dirusak: struktur baku tiap modul (Prasyarat, Tujuan,
Analogi, Praktik tiga platform, Kesalahan Umum, Latihan dengan jawaban), 1.213
rujukan antarmodul yang semuanya sah, lab 07 (102 tes pytest lulus), dan lisensi
yang dicatat dengan benar di `materi/NOTICE.md`.

---

## Yang dikerjakan di Fase 0

- `git init`, `.gitignore` diperketat (`.playwright-mcp/`, `.remember/`, `*.tar.gz`), commit dasar `d2bbdb5`.
- K1–K9 dan D1 diperbaiki, masing-masing dengan tes.
- `npm test`: 24 tes `node:test`, tanpa dependensi baru.
- Dokumentasi: jalur, loopback, `dist/` basi, cara menguji dengan database terpisah.
- `AGENTS.md` di akar proyek.

## Yang sengaja belum dikerjakan

- **D2 (dua tab saling menimpa)**: perbaikan yang benar mengubah kontrak API (penggabungan per kunci atau nomor versi), dan itu layak jadi pekerjaan tersendiri, bukan tempelan di fase pengamanan.
- **D10 (panen XP)**: soal desain gamifikasi, bukan bug keamanan; butuh keputusan pemilik.
- **A4 (`confirm()`)**: diganti dialog sendiri di Fase 4, bersama perbaikan fokus.

## Status sesudah Fase 6 (2026-10-15)

- **P2:** salah ketik "proyek baba" sudah diperbaiki. Panduan Packet Tracer (Simulation Mode, berkas .pka, batasannya) BELUM ditulis.
- **P3:** ditutup. Modul baru 15.5 dan 17.5, Tahap 23 (tiga modul), serta tujuh bagian istilah di modul yang sudah ada (XDP di 13.3, Hubble di 16.5, DCQCN di 16.3, 400ZR di 2.3, RFC 8925 di 8.3, 5G SA/UPF di 22.4, ABR di 6.3). Peta 18.2, 18.3, dan 18.5 dicek ulang terhadap halaman resmi. Kurikulum kini 149 modul, 930 kartu, dan 27 tahap.
- **P4:** tetap terbuka, dan bertambah: perintah Junos di 23.1 dan sintaks opsi DHCP 108 di 8.3 juga belum dijalankan di perangkat.

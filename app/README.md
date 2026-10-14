# Belajar Networking — Aplikasi Belajar Interaktif (MERN)

Aplikasi web untuk mempelajari jaringan komputer dari nol sampai profesional,
berbasis kurikulum di `../materi/`. Stack **MERN**: MongoDB · Express · React · Node.

## Fitur

- **144 modul** kurikulum ter-render rapi (tipografi, callout berlabel, kode ter-highlight, tabel, TOC scroll-spy).
- **Progres, XP, level, streak** — tersimpan di **MongoDB** per profil.
- **Spaced repetition** (SM-2): ~883 kartu latihan untuk active recall dengan interval bertambah.
- **Lab yang bisa dijalankan**: kode lab di `../materi/lab/kode/` (containerlab/FRR, MikroTik CHR, Python dengan pytest). Teks materi CC BY-SA 4.0, kode lab MIT; atribusi di `../materi/NOTICE.md`.
- **Peta profesi** (`/karier`): konstelasi 32 profesi di ekosistem jaringan, kesiapan pribadi dari modul yang tuntas, kuis kecocokan, dan perencana perpindahan karier. Data di `data/profesi/*.json`, divalidasi ketat saat build.
- **Pustaka** (`/pustaka`): ±1.200 tautan belajar beratribusi (buku terbuka, standar, kursus resmi, dokumentasi, lab), bisa dicari dan disaring per jenis, bahasa, sumber, dan tahap; tiap modul punya "Bacaan lanjutan". Data panen di `data/pustaka/` (dihasilkan `npm run panen`), riset tangan di `data/pustaka-kurasi/`.
- **Alat interaktif**: kalkulator subnet (visualisasi biner), konverter biner/hex, penjelajah OSI, animasi TCP handshake, simulator perjalanan paket.
- **Pencarian global** + **command palette** (Ctrl-K).
- **Multi-profil**, tema terang/gelap, responsif, jalan offline (cache lokal).

## Prasyarat

- **Node.js 22.18+** (teruji di Node 24; `npm test` butuh Node yang bisa menjalankan `.ts` langsung)
- **MongoDB** — cara termudah lewat **Docker** (skrip sudah disediakan). Alternatif: MongoDB lokal/Atlas via `MONGODB_URI`.

## Menjalankan (development)

```bash
npm install
npm run dev          # otomatis: build konten + start MongoDB (Docker) + server + client
```
Buka **http://127.0.0.1:5173** (Vite mem-proxy `/api` ke Express di 127.0.0.1:4000).

Jika tak memakai Docker, jalankan MongoDB sendiri lalu set:
```bash
MONGODB_URI="mongodb://127.0.0.1:27017/belajar_networking" npm run dev
```

## Menjalankan (satu proses)

```bash
npm run build            # build konten + client → dist/
node server/index.mjs    # Express menyajikan dist/ + API di http://127.0.0.1:4000
```

## Skrip

| Skrip | Fungsi |
|---|---|
| `npm run dev` | Build konten, nyalakan Mongo (Docker), server + client (HMR) |
| `npm run build` | Build konten + bundel produksi ke `dist/` |
| `npm run content` | Regenerasi `src/generated/curriculum.json` dari `../materi/**/*.md` (dist/ TIDAK ikut; jalankan `npm run build`) |
| `npm run panen` | Panen ulang `data/pustaka/*.json` dari repo kurasi lokal dan dari `../materi/` |
| `npm test` | Tes `node:test`: logika src/lib, skrip build, penjagaan server |
| `npm run db:up` / `db:down` | Start/stop MongoDB via Docker |
| `npm run server` | Server Express saja (watch) |
| `npm run client` | Vite saja |

## Arsitektur

```
app/
├── scripts/build-content.mjs   # pipeline: ../materi/**/*.md → curriculum.json
│                               #   (metadata, kartu latihan, kode ter-highlight)
├── data/                       # sumber pengayaan yang ditulis tangan
│   ├── enrich.json             #   penempatan diagram/foto/kuis/alat/game per modul
│   ├── profesi/*.json          #   32 profil profesi per rumpun (bersumber, divalidasi saat build)
│   └── photos.json             #   katalog foto + kredit
├── server/                     # Express + Mongoose
│   ├── index.mjs               #   listen di 127.0.0.1 saja
│   ├── app.mjs                 #   REST API + tiga lapis penjagaan (Host, Origin, ObjectId)
│   ├── db.mjs                  #   koneksi MongoDB
│   └── models/Profile.mjs      #   skema profil (progress, srs, xp, streak)
├── public/                     # aset statis (favicon, img/ — disajikan di /img/...)
├── src/
│   ├── generated/              #   HASIL BUILD — curriculum.json, jangan diedit tangan
│   ├── lib/                    #   content, store (API-backed), srs (SM-2), search, api, theme
│   ├── components/             #   PilAtas (navigasi pil), CommandPalette, RichProse, TanggaKarier, ...
│   ├── pages/                  #   Dashboard, ModulePage, ReviewPage, ToolsPage, ArenaPage
│   ├── diagrams/               #   diagram SVG interaktif
│   ├── games/                  #   permainan latihan
│   ├── tools/                  #   SubnetCalculator, OSIExplorer, PacketJourney, TcpHandshake, ...
│   └── styles/                 #   CSS pendamping (diagrams, learn)
├── tests/                      # node:test (npm test)
├── dist/                       # HASIL BUILD — bundel produksi
├── docker-compose.yml          # layanan MongoDB (volume persisten)
└── vite.config.ts              # React + Tailwind v4 + proxy /api
```

Konten kurikulum tetap di folder induk (`../materi/00-fondasi/…` s/d `../materi/referensi/…`),
ditambah `../README.md` dan `../SILABUS.md` sebagai tahap "Panduan"; jalankan
`npm run content` untuk memuat ulang setelah materi diubah.

## Data

State pengguna (progres, XP, streak, riwayat spaced-repetition) disimpan di MongoDB
(database `belajar_networking`, koleksi `profiles`), dengan cache localStorage untuk
pemuatan instan dan mode offline. Data Docker persisten di volume `bn-mongo-data`.

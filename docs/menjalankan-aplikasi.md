# Menjalankan Aplikasi Belajar

Panduan singkat menyalakan, mematikan, dan merawat aplikasi di `app/`.
Semua perintah dijalankan dari folder `app/`:

```bash
cd /home/vi/networking/app
```

---

## Mode sehari-hari (satu proses)

Paling ringan kalau tujuannya sekadar belajar — Express menyajikan hasil build
sekaligus API.

```bash
npm run db:up            # nyalakan MongoDB (hanya bila container mati)
node server/index.mjs
```

Buka **http://localhost:4000**.

## Mode pengembangan (hot-reload)

Dipakai saat mengoprek kode. Otomatis membangun konten dan menyalakan Mongo.

```bash
npm run dev
```

Buka **http://localhost:5173** (Vite mem-proxy `/api` ke Express di `:4000`).

---

## Mematikan

```bash
# hentikan server Express: Ctrl-C di terminalnya, atau
pkill -f 'node server/index.mjs'

npm run db:down          # hentikan MongoDB (data tetap aman di volume bn-mongo-data)
```

---

## Setelah laptop dimatikan

| Komponen | Setelah laptop dinyalakan lagi |
|---|---|
| MongoDB (`bn-mongo`) | **Nyala sendiri** — `docker.service` ikut boot dan container-nya `restart: unless-stopped` |
| Server Node (`node server/index.mjs`) | **Mati**, harus dijalankan manual |

Data aman. Progres, XP, streak, dan riwayat spaced-repetition tersimpan di volume
Docker `app_bn-mongo-data` yang persisten — mati listrik pun tidak hilang.

Jadi tiap habis menyalakan laptop, cukup:

```bash
node server/index.mjs
```

Kalau ternyata Mongo belum naik, tambahkan `npm run db:up` di depannya.

---

## Setelah mengubah materi `.md`

Materi ada di `materi/`. Setiap kali diubah, konten aplikasi perlu dibangun ulang:

```bash
npm run content          # materi/**/*.md → src/generated/curriculum.json
npm run build            # bundel ulang ke dist/ (hanya untuk mode satu proses)
```

Mode `npm run dev` sudah menjalankan `npm run content` otomatis di awal.

Kalau tampilan terasa "tidak berubah" setelah build, itu cache browser — muat ulang
dengan `Ctrl-Shift-R`.

---

## Opsi agar tidak mengetik tiap kali

Tiga cara, dari yang paling sederhana:

1. **Alias di `~/.bashrc`** — ketik `belajar` saja, server nyala di terminal itu.
2. **Systemd user service** — server ikut nyala tiap boot, jalan di latar belakang.
   Perlu `enable-linger` (butuh `sudo` sekali) supaya tetap hidup meski belum login ke desktop.
3. **Masukkan server ke `docker-compose.yml`** — satu paket dengan Mongo, sama-sama
   auto-restart, tanpa `sudo` sama sekali. Paling konsisten dengan yang sudah ada.

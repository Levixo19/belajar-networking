# Menjalankan Aplikasi Belajar

Panduan singkat menyalakan, mematikan, dan merawat aplikasi di `app/`.
Semua perintah dijalankan dari folder `app/`:

```bash
cd /home/vi/Projects/networking/app
```

---

## Mode sehari-hari (satu proses)

Paling ringan kalau tujuannya sekadar belajar — Express menyajikan hasil build
sekaligus API.

```bash
npm run db:up            # nyalakan MongoDB (hanya bila container mati)
node server/index.mjs
```

Buka **http://127.0.0.1:4000**.

## Mode pengembangan (hot-reload)

Dipakai saat mengoprek kode. Otomatis membangun konten dan menyalakan Mongo.

```bash
npm run dev
```

Buka **http://127.0.0.1:5173** (Vite mem-proxy `/api` ke Express di `127.0.0.1:4000`).

---

## Hanya laptop ini (loopback)

Server API, Vite dev, Vite preview, dan MongoDB **sengaja hanya mendengar di
`127.0.0.1`**. API ini tidak punya kata sandi: kalau ia terbuka ke Wi-Fi, siapa pun
di jaringan yang sama bisa membaca, menimpa, atau menghapus profil belajar.
Penjagaannya tiga lapis (bind loopback, pemeriksaan `Host`, pemeriksaan `Origin`
untuk semua permintaan yang mengubah data); alasannya ditulis di kepala
`app/server/app.mjs`. Akibatnya aplikasi ini **tidak bisa dibuka dari HP** lewat
alamat IP laptop, dan itu disengaja.

Kalau kontainer Mongo dibuat sebelum aturan ini, buat ulang sekali supaya pemetaan
port barunya berlaku (datanya aman di volume):

```bash
docker compose up -d     # "Recreate" bn-mongo; cek: docker ps → 127.0.0.1:27017
```

---

## Menguji tanpa menyentuh progres

Progres di database `belajar_networking` adalah catatan belajar sungguhan, bukan data
uji. Untuk mencoba apa pun, pakai database terpisah dan port terpisah:

```bash
MONGODB_URI="mongodb://127.0.0.1:27017/bn_uji_$(date +%F)" PORT=4100 node server/index.mjs
```

Tes otomatis:

```bash
npm test                 # node:test bawaan Node, tanpa dependensi tambahan
```

Tes integrasi server membuat database `bn_uji_tes_<pid>` lalu menghapusnya lagi, dan
menolak berjalan pada database yang namanya tidak diawali `bn_uji_`. Tanpa MongoDB
bagian itu dilewati (skip), bukan lulus palsu. `BN_TANPA_MONGO=1 npm test` melewatinya
dengan sengaja.

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
npm run build            # WAJIB untuk mode satu proses: bundel ulang ke dist/
```

**`dist/` tidak ikut berubah karena `npm run content`.** Konten dibundel ke dalam
JavaScript saat `vite build`, jadi mode satu proses (`node server/index.mjs`) tetap
menyajikan materi LAMA sampai `npm run build` dijalankan lagi. `npm run build`
sudah menjalankan `npm run content` sendiri lewat `prebuild`, jadi cukup itu saja.

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

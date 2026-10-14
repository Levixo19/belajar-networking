# Catatan untuk agen

Kurikulum jaringan komputer berbahasa Indonesia (`materi/`, 144 modul dalam 26
tahap) plus aplikasi belajar di `app/`: React 19 + Vite 8 + Tailwind v4 +
TypeScript, server Express + MongoDB, HashRouter. Pemiliknya pelajar yang memakai
aplikasi ini **hanya di laptop**.

Semua teks antarmuka, komentar baru, laporan, dan pesan commit memakai **Bahasa
Indonesia**. Ikuti gaya penamaan yang sudah ada di tiap berkas: kode React lama
memakai nama Inggris (`useStore`, `nextModule`), kode baru boleh berbahasa Indonesia
(`buatApp`, `periksaPatch`), tetapi jangan mengganti nama yang sudah dipakai di
banyak tempat cuma demi keseragaman.

Proyek kembarannya, "Belajar Ngoding" (`/home/vi/Learning/java`), adalah
implementasi rujukan untuk Pustaka, Peta Karier, sampul generatif, dan cangkang
laptop. Stack-nya berbeda (Python stdlib + vanilla JS); yang disalin KEPUTUSAN dan
POLANYA, bukan kodenya.

## Menjalankan

```bash
cd app
npm run dev              # konten + Mongo (Docker) + API :4000 + Vite :5173
npm run build            # konten + tsc + vite build -> dist/
node server/index.mjs    # satu proses: dist/ + API di http://127.0.0.1:4000
npm test                 # node:test, tanpa dependensi tambahan
```

Rincian ada di `docs/menjalankan-aplikasi.md`.

## Peta modul

| Jalur | Tanggung jawab |
|---|---|
| `materi/**/*.md` | Isi kurikulum. Teks CC BY-SA 4.0 (`materi/LICENSE`), kode lab MIT (`materi/lab/kode/LICENSE`), atribusi di `materi/NOTICE.md` |
| `SILABUS.md`, `README.md` | Ikut dibangun sebagai tahap "Panduan" |
| `app/scripts/build-content.mjs` | `materi/` → `src/generated/curriculum.json`; `data/profesi/*.json` → `src/generated/profesi.json` (divalidasi ketat) |
| `app/data/enrich.json` | Penempatan diagram/foto/kuis/alat/game per modul, tanpa mengotori `.md` |
| `app/data/profesi/*.json` | 32 profil profesi per rumpun, ditulis tangan, divalidasi build |
| `app/data/photos.json` | Katalog foto lokal di `app/public/img/` beserta kredit |
| `app/server/app.mjs` | REST API + tiga lapis penjagaan. Dipisah dari `listen` supaya bisa dites |
| `app/server/index.mjs` | `listen` di 127.0.0.1 saja |
| `app/src/lib/` | Logika murni (`srs`, `profesi`, `content`, `search`) + `store` (state + sinkron API) |
| `app/src/pages/`, `components/` | Layar dan komponen |
| `app/src/diagrams/` | Diagram SVG React; registri di `diagrams/index.tsx`, ID dipakai `enrich.json` |
| `app/src/lib/motion.ts` | SATU-SATUNYA pintu GSAP (`gsap.matchMedia` + `MOTION_OK`) |
| `app/tests/` | `node:test`. `_muat.mjs` = hook pemuat supaya `src/lib/*.ts` bisa diimpor Node |
| `reports/` | Laporan audit dan celah kurikulum |

## Invarian yang gampang dilanggar

Semuanya dijaga tes atau ditulis di sini karena pernah, atau hampir, menyakiti
pemiliknya. Kalau salah satu gagal, itu bukan tes yang cerewet.

### Data dan keamanan

**Data pemilik bukan data uji.** Progres tersimpan di MongoDB database
`belajar_networking`. Itu catatan belajar sungguhan: satu modul yang "cuma dicoba"
berarti XP, streak, dan progres yang tidak pernah ia kerjakan. Untuk mencoba
aplikasi, nyalakan server dengan database TERPISAH dan port terpisah:

```bash
MONGODB_URI="mongodb://127.0.0.1:27017/bn_uji_$(date +%F)" PORT=4100 node server/index.mjs
```

lalu buat profil uji sendiri. Jangan pernah membuat, mengubah, atau menghapus
profil di `belajar_networking`. Tes integrasi server (`tests/server.test.mjs`)
membuat `bn_uji_tes_<pid>`, menghapusnya sesudah selesai, dan MENOLAK berjalan
pada database yang namanya tidak diawali `bn_uji_`.

**Semua yang mendengar wajib loopback: API, Vite dev, Vite preview, dan Mongo.**
API ini tidak punya autentikasi. Sebelum 2026-10-14 keempatnya terbuka ke LAN
(`app.listen(PORT)`, `host: true`, `preview --host`, `"27017:27017"`), artinya
siapa pun di Wi-Fi kampus bisa menghapus profil belajar, atau langsung menghapus
databasenya tanpa melewati API. Host API sengaja TIDAK bisa diatur lewat env.
Jangan menambahkan `--host` "supaya bisa dibuka dari HP".

**Penjagaannya tiga lapis, dan ketiganya wajib ada** (kepala `server/app.mjs`):
bind loopback; `Host` wajib nama loopback dengan port aplikasi (menutup DNS
rebinding, juga untuk GET); `Origin`, kalau ada, wajib asal lokal untuk
POST/PUT/PATCH/DELETE (menutup CSRF; CORS tidak menolong karena CORS cuma melarang
MEMBACA jawaban, sedangkan permintaannya tetap sampai). `tests/server.test.mjs`
menembak ketiganya dari sudut penyerang.

**Tes server memakai `node:http`, bukan `fetch`.** `fetch` (undici) diam-diam
membuang header `Host` buatan sendiri. Versi pertama tes ini memakai `fetch`, dan
tes DNS rebinding-nya LULUS karena SEMUA permintaan ditolak oleh Host berport acak,
termasuk yang seharusnya diterima. Tes yang lulus karena alasan yang salah lebih
buruk daripada tidak ada tes.

**Galat 500 tidak membawa `e.message`; ID yang bukan ObjectId adalah 400; DELETE
profil yang tidak ada adalah 404; PUT /state lewat `periksaPatch()`.** Mongoose
tidak menjalankan validator pada `findByIdAndUpdate` secara bawaan, jadi tanpa
pemeriksaan bentuk, `xp: "banyak"` tersimpan lalu meledak di browser saat dimuat.

**Materi dirender sebagai HTML mentah** (`markdown-it` `html: true` →
`dangerouslySetInnerHTML`). Aman karena `materi/` ditulis pemilik sendiri. Kalau
suatu hari menerima materi dari luar, tinjau atau sanitasi dulu, jangan langsung
dibangun.

**"Hari ini" adalah tanggal kalender LOKAL** (`srs.todayStr()`). Versi lama memakai
`toISOString()`, yaitu UTC: di WITA hari baru dimulai pukul 08.00, sehingga belajar
pukul 07.00 tercatat untuk kemarin dan streak putus. Jangan pernah membentuk
tanggal hari dengan `toISOString().slice(0, 10)`. Dijaga
`tests/srs.test.mjs` ("todayStr memakai tanggal kalender LOKAL").

### Git dan berkas hasil

**Proyek ini repo git lokal tanpa remote. Jangan push ke mana pun.** Cadangan lama
`.backup-pre-redesign-2026-10-13.tar.gz` cuma berisi `app/`, jadi git satu-satunya
jaring pengaman untuk `materi/`. Commit per fase dengan pesan berbahasa Indonesia.

**`src/generated/` dan `dist/` DIHASILKAN dan tidak dilacak git.** `dist/` tidak
ikut berubah karena `npm run content`: kontennya dibundel ke JavaScript saat
`vite build`, jadi mode satu proses menyajikan materi LAMA sampai `npm run build`.

### Lisensi

**Lisensi menentukan apa yang boleh DISALIN; MENAUTKAN selalu sah.** Teks `materi/`
CC BY-SA 4.0, kode lab MIT. Yang boleh diadaptasi cuma sumber CC BY, CC BY-SA,
CC0, atau lisensi permisif; NC/ND dan sumber tanpa lisensi cuma boleh ditautkan.
Setiap adaptasi baru dicatat di `materi/NOTICE.md`.

**Tanpa CDN dan tanpa hotlink.** Aplikasi ini harus utuh tanpa internet: font
lewat `@fontsource`, gambar disimpan di `app/public/img` beserta kreditnya, tidak
ada picsum/unsplash yang dimuat saat runtime.

### Antarmuka

**Animasi tidak boleh jadi satu-satunya cara sebuah elemen terlihat.** Keadaan
AKHIR = keadaan alami elemen; animasi cuma berangkat dari tempat lain (`gsap.from`,
bukan `gsap.to` menuju keadaan yang benar). Kalau gerak dimatikan, dibatalkan saat
rute berganti, atau ScrollTrigger tidak pernah menyala, elemennya tetap terlihat.

**Setiap animasi menghormati `prefers-reduced-motion`**, lewat `gsap.matchMedia`
di `lib/motion.ts`. Jangan memanggil GSAP dari tempat lain tanpa penjaga itu.

**Satu properti, satu mesin.** Kalau GSAP menggerakkan `transform`/`opacity` sebuah
elemen, lepas `transition` CSS untuk properti yang sama; keduanya saling mengejar
dan menghasilkan gerak tersendat yang sulit didiagnosis.

**Yang mengukur tata letak berjalan SESUDAH elemen menempel dan punya ukuran**
(`getBoundingClientRect`, `getComputedTextLength`, ScrollTrigger). Di render
pertama ukurannya bisa nol.

**CSS komponen hidup di `@layer components`.** CSS tanpa layer mengalahkan utility
Tailwind, sehingga `mt-16` di sebuah elemen diam-diam tidak berlaku.

**HashRouter: tautan dalam halaman lewat `lib/scrollTo.ts`, bukan `href="#id"`.**
`href="#id"` mengganti RUTE, bukan menggulir.

**Semua tombol "Lanjut belajar" memakai `nextModule()`** dari `lib/content.ts`
(mengabaikan tahap panduan/referensi). Versi lama di Navbar menunjuk README.

**Tidak ada emoji dan em-dash di teks antarmuka.** Ikon lewat adapter Phosphor
`components/icons.tsx`; callout mendapat label teks dari `build-content.mjs`.

**Font baca dipilih pembaca** (`lib/bacaan.ts`, atribut `data-ba-*` di `<html>`,
localStorage `bn-baca`). Bawaannya Atkinson Hyperlegible Next; pemilik menolak
Geist karena "kaku dan melelahkan". Dasarnya Wallace dkk., ACM TOCHI 2022: tidak
ada satu font terbaik, selisih kecepatan baca antarorang sampai 35%.

### Konten dan data

**`data/profesi/*.json` divalidasi saat build dan data rusak MENGGAGALKAN build**,
bukan `console.warn`. ID profesi, tag keahlian, tautan antarprofesi, dan ID modul
harus sah.

**Tahap tanpa modul tidak boleh sampai ke UI.** `stage.modules[0]` dipakai di
banyak tempat; build melewati folder tahap yang kosong. Dijaga
`tests/konten.test.mjs`.

### Pustaka

**`app/data/pustaka/*.json` DIHASILKAN `npm run panen` (`scripts/panen-pustaka.mjs`).**
Jangan menyuntingnya dengan tangan: `tests/pustaka.test.mjs` memanen ulang dari
`/home/vi/folder_materi/materi-belajar` dan dari `materi/` lalu menuntut hasil yang
identik byte demi byte. Mengubah satu tautan di `materi/` berarti menjalankan
`npm run panen` lagi, atau tes itu merah. Kalau sebuah butir salah, perbaiki
pengurainya, bukan JSON-nya.

**Lisensi menentukan apa yang boleh disalin; tabelnya `SUMBER` di kepala pemanen.**
Repo tanpa lisensi (getting-a-gig, build-your-own-x) dan proprietary
(developer-roadmap, kurikulum freeCodeCamp) cuma boleh ditautkan, jadi yang masuk
hanya tautan ke situs/repo itu sendiri dengan keterangan yang kita tulis. Daftar
coding-interview-university (CC BY-SA 4.0) tinggal di `ciu.json` SENDIRI supaya
ShareAlike-nya tidak menular ke berkas lain. Dijaga tes "CC BY-SA ... tinggal di
berkasnya sendiri".

**`app/data/pustaka-kurasi/*.json` ditulis tangan dari hasil memeriksa halamannya
sendiri.** Setiap butir membawa `lisensi` (persis seperti di sumber), `boleh_salin`,
dan `tanggal_diperiksa`. Build GAGAL kalau `boleh_salin: true` bersanding dengan
NC/ND/tanpa lisensi, kalau URL-nya bukan https, kalau tanggalnya di masa depan,
atau kalau domainnya penyingkat tautan atau cermin PDF bajakan (`DILARANG` di
`build-content.mjs`). Hati-hati dengan bukti lisensi yang terlihat meyakinkan:
komentar MIT di HTML situs mkdocs adalah lisensi TEMA, bukan lisensi isinya (sudah
pernah salah dibaca begitu saat riset).

**`bahasa` adalah bahasa HALAMANNYA, bukan bahasa judulnya.** Judul di materi
ditulis pengarang dalam bahasa Indonesia ("FRRouting, RPKI dan BMP") walau
halamannya berbahasa Inggris. Pemanen memakai domain (`.id`, `id.`), dengan daftar
pengecualian situs `.id` yang berbahasa Inggris. Menebak dari judul pernah
menandai 83 halaman berbahasa Inggris sebagai Indonesia.

**Tahap terkait sebuah butir DIHITUNG dari `TOPIK_TAHAP`** (`src/lib/pustakaTopik.ts`),
satu-satunya tempat pemetaan itu ditulis. Butir cuma membawa topik. Tahap baru
cukup menambah satu baris di sana; tes menuntut setiap tahap belajar mendapat 4-6
bacaan lanjutan, jadi tahap yang terlupa langsung ketahuan (Layer Fisik dan Proyek
Akhir pernah kosong).

**Jumlah di samping setiap nilai segi = banyaknya hasil kalau nilai itu yang
dipilih.** `hitungSegi()` menghitung dari butir yang lolos kueri dan SEMUA saringan
lain kecuali segi itu sendiri. Angka global ("39 video di seluruh pustaka") sementara
hasilnya 6 adalah angka yang berbohong. Dijaga tes "jumlah segi jujur".

**Pustaka dimuat malas (`muatPustaka()`), tidak pernah diimpor statis.** Datanya
±480 KB; mengimpornya dari komponen yang ada di bundel utama membuat setiap halaman
memuatnya.

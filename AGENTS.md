# Catatan untuk agen

Kurikulum jaringan komputer berbahasa Indonesia (`materi/`, 149 modul dalam 27
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

### Peta Karier: data dan logika

**`data/profesi/*.json` ditulis tangan, dan build GAGAL kalau datanya berbohong.**
Selain ID, tag, dan modul yang sah, validator menolak: "naik" timbal balik (dulu 5
pasang, sehingga peta tidak bisa menggambar arah), "naik" yang turun jenjang (dulu
7 sisi, misalnya arsitek "naik" ke konsultan), array wajib yang kosong (modul kosong
= kesiapan selamanya 0%), sumber bukan https, tanggal gaji yang bukan YYYY-MM-DD,
dan `jenjang_alasan` tanpa `jenjang_sumber`. `tests/profesi.test.mjs` menyuapkan
data rusak lewat `BN_PROFESI_DIR` dan menuntut build keluar dengan status 1.

**Gaji HANYA dari halaman publik yang memang untuk peran itu, dengan
`tanggal_diperiksa` sendiri.** Halaman "Konsultan Teknis lintas bidang" dan rentang
yang menggabungkan dua jabatan sudah dibuang; lebih baik kosong daripada salah.
Angka Jobstreet berubah tiap bulan: tiga dari lima yang tercatat sudah meleset saat
diperiksa ulang 2026-10-15. Angka diambil dari kalimat utama halaman ("Gaji
rata-rata ... antara X dan Y"), bukan dari iklan yang kebetulan tampil di sana.

**Koreksi jenjang membawa alasan dan sumbernya** (`jenjang_alasan`,
`jenjang_sumber`): it-auditor dan cloud-infrastructure-engineer naik dari pemula
ke menengah karena syarat sertifikasi bakunya (CISA: lima tahun; AWS CloudOps
Engineer: sekitar satu tahun di AWS).

**Graf perpindahan BERARAH.** "naik" cuma dilalui ke arah naiknya, "dekat" dua arah,
turun jenjang hanya lewat "dekat" dan lebih mahal (`BIAYA_TURUN`), melompat dari
pemula langsung ke senior lebih mahal lagi (`BIAYA_LONCAT`), dan peran senior mahal
sebagai perantara (`BIAYA_LEWAT`). Tanpa biaya lompat, jalur terpendek IT support ke
solution architect lewat hardware engineer, padahal materi 21.6 sendiri menulis
cabang itu baru terbuka sesudah senior. Tes menuntut setiap pasangan profesi
terjangkau dan setiap langkah adalah sisi yang ada, dilalui ke arah yang sah.

**Celah sebuah jalur = bekal SEMUA profesi sesudah titik awal** (`celahJalur()`),
termasuk perantara. Membandingkan asal dengan tujuan saja menyembunyikan biaya
perantara yang wajib dilewati.

**Kuis: setiap profesi harus BISA menang.** Skor = skor mentah dibagi akar skor
tertinggi yang mungkin dicapai profesi itu. Tes menyapu seluruh 4.096 kombinasi dan
menuntut himpunan pemenang = semua 32 profesi. Kalau kuis atau tag keahlian
diubah, jalankan sapuan itu; angka pembanding tiap rumus ada di komentar
`scoreQuiz()`. Profil tanpa satu modul pun tuntas mendapat peran senior di urutan
belakang (`pemula: true`), dengan keterangan "tujuan jangka panjang".

**`/karier/<id tak dikenal>` menampilkan pesan, bukan profesi lain.** Fallback diam-diam
membuat tautan yang salah ketik terlihat berhasil.

**Hitungan rumpun: dua profesi inti + enam rumpun**, sama di materi 21 dan di UI.

### Peta Karier: gambar

**Tangga, bukan konstelasi** (`lib/tanggaKarier.ts` + `components/TanggaKarier.tsx`):
baris = rumpun, kolom = jenjang, tinggi baris dari sel terpadatnya. Pemilik sudah
melihat versi kusut di dua proyek dan menolaknya (184 sisi kurva-Q sekaligus).
Jangan kembali ke tata letak melingkar atau menggambar semua sisi.

**Dalam keadaan diam tidak ada garis.** `/karier` tanpa id = tanpa profesi terpilih
= kisi nama yang tenang plus panel sapa. Garis cuma untuk profesi yang dipilih atau
disorot, dan cuma garisnya sendiri; saringan rumpun ikut menyaring garis.

**Garis berangkat dari UJUNG LABEL yang diukur, bukan diperkirakan.**
`getComputedTextLength()` dijalankan di `useLayoutEffect` SESUDAH SVG menempel, dan
sekali lagi sesudah `document.fonts.ready` (font variabel bisa selesai dimuat
belakangan). Perkiraan per huruf dipakai untuk render pertama saja dan tidak
disimpan.

**Garis yang melompat dua kolom menyeberang lewat LAJUR di bantalan atas baris
tujuan**, bukan mendatar setinggi simpul tujuan. Pola rujukan Belajar Ngoding
mendatar setinggi simpul tujuan; di data ini kolom tengah sering punya simpul pada
ketinggian yang sama, jadi garisnya akan menembus label. `BANTALAN` menjamin lajur
itu kosong. Semua garis dari satu simpul berbagi batang di talang; garis "dekat"
memakai batang kedua yang digeser dan putus-putus.

**Label paling panjang 24 huruf dan berawal di R+13.** Lebih panjang menyentuh
talang tempat batang lewat; lebih rapat dari R+13 membuat lingkar sejajar
(putus-putus, R+9) menyentuh huruf pertamanya. Lingkar sejajar ada di LUAR cincin
kesiapan, tidak pernah di cincin itu sendiri.

**Nol garis menembus huruf, diukur, bukan dilihat.** `tests/tangga.test.mjs`
memeriksa ke-32 profesi sebagai fokus dengan kotak label perkiraan. Pemeriksaan di
browser (2026-10-15, 1440 px) mengulangnya dengan `getBBox()` dan
`getPointAtLength()`: 0 titik menembus label atau simpul untuk ke-32 profesi, jarak
awal garis ke ujung label paling sedikit 6,6 unit. Ulangi pengukuran itu setiap kali
ukuran huruf, `KIRI`, `KOLOM`, atau label diubah.

**Garis "naik" ditarik masuk lewat GSAP (`gsap.matchMedia` + `MOTION_OK`) dengan
`clearProps`**, jadi keadaan akhirnya garis utuh tanpa dasharray. Jangan memberi
`.kr-sisi` transition CSS apa pun: stroke-dashoffset-nya milik GSAP.

### Desain laptop (Fase 4, 2026-10-15)

Arah, riset, dan angka kontrasnya di `reports/rencana-desain-2026-10-15.md`.

**Cangkang = satu pil kaca melayang** (`components/PilAtas.tsx`). Bilah atas, menu
burger, dan tab bar bawah sudah dicabut (aplikasi dipakai hanya di laptop); jangan
dikembalikan. Semua tujuan, cari, XP, tema, dan profil tinggal di pil. Butir aktif
ditandai `is-on` DAN `aria-current`, keduanya dipasang dan dilepas; di halaman modul
yang aktif pemicu Kurikulum. Penanda yang meluncur digerakkan transition CSS
(transform + width) saja. Layar < 1024 px tidak dirancang, tapi tidak boleh meluber:
pil bisa digulir mendatar dan label cari/XP disembunyikan di bawah 1100 px.

**Satu layar, satu latar aksen.** `.btn-primary` (ultramarin, teks `--on-primary`)
hanya untuk tindakan utama layar itu; yang lain `.btn-ink` atau `.btn`. Widget
sisipan di modul (kuis, checkpoint, alat), tombol dialog, dan lencana jumlah memakai
tinta. Teks di atas aksen selalu `--on-primary`, tidak pernah `#fff` yang ditulis
tangan: di tema gelap aksennya terang dan teksnya harus gelap.

**Hover menyala seketika, padam `--padam` (150 ms).** Polanya: `transition` dengan
durasi `--padam` di keadaan biasa, `transition-duration: 0s` di `:hover`
(`.btn`, `.pil-item`, `.hover-padam`, `.tile`). Tekan: scale .98 dalam 100 ms.

**Huruf: Space Grotesk untuk judul dan antarmuka, Atkinson untuk prosa.** Preferensi
baca (`data-ba-font`) hanya mengubah `--font-read`; dulu ia ikut mengganti font
antarmuka, sehingga memilih Lexend untuk membaca mengubah tombol dan navigasi juga.

**Token warna lolos AA di kedua tema, dan itu dites** (`tests/kontras.test.mjs`
membaca `index.css` langsung, mengomposisikan rgba di atas latarnya). Saat menulis
tes ini dua token terang ternyata meleset tipis (`--accent` 4,42, `--border-control`
2,96 di surface-2). Mengubah token berarti tes ini harus tetap hijau.

**Setiap kelas yang dipakai punya aturan, setiap aturan kustom dipakai**
(`tests/kelas-css.test.mjs`, dua arah, terhadap CSS hasil `vite build`). Sapuan
pertamanya menemukan 21 aturan yatim dan 7 kelas tanpa gaya, termasuk dua bug
sungguhan: diagram domain broadcast memakai `r-b` yang tidak pernah didefinisikan
(dua VLAN tampil sama warnanya, padahal itu inti diagramnya), dan animasi `.pop` yang
dipakai kuis tidak pernah ada. Kelas yang cuma jadi kait selektor JS (`.pd-packet`,
`.scrub-text`) sah tanpa aturan; kelas dari highlight.js dikecualikan.

**Dialog = `useDialogFokus`** (`lib/fokus.ts`): fokus masuk, Tab berputar di dalam,
Escape menutup, fokus kembali ke pemicunya. Dipakai palet, menu profil, mega-menu
Kurikulum, dan `Lightbox` (learn.tsx, satu komponen untuk foto dan diagram). Lapisan
baru yang menutupi halaman wajib memakainya.

**Dasbor punya dua keadaan.** Profil baru (XP 0 dan nol modul tuntas) mendapat hero
dengan satu saran + semua tahap sebagai ubin yang bisa dibandingkan, bukan katalog
nol persen. Profil berjalan mendapat bento 12 kolom `grid-flow-dense` (7x2 + 5x1 +
5x1, nol sel kosong). Angka di ubin dihitung dari kurikulum, desimal memakai koma
(`toLocaleString('id')`).

**Gerak gulir Dasbor** (`useGSAP` + `gsap.matchMedia(MOTION_OK)`): kalimat menyala per
kata lewat SplitText, tumpukan kartu cara belajar. Tumpukannya `position: sticky`
(CSS), GSAP hanya mengecilkan kartu yang tertimpa dan menaikkan `--redup` (lapisan
`::after` berwarna `--bg`). Jangan menganimasikan `filter` dari `none`: hasilnya kartu
abu kotor, sudah pernah terjadi.

**Fallback SPA hanya untuk path tanpa ekstensi** (`server/app.mjs`). Aset yang tidak
ada (tab lama sesudah build ulang) dijawab 404, bukan `index.html` yang membuat
browser melapor galat MIME yang menyesatkan.

### Gambar dan bentuk (Fase 5, 2026-10-15)

**Sampul generatif** (`lib/sampul.tsx`): SVG yang dibangkitkan dari benih teks
(FNV-1a + mulberry32), lima ragam bertema jaringan (topologi, kisi, gelombang, paket,
mesh), rona per band/tahap (`ronaTahap`) atau per rumpun (`RONA_RUMPUN`), tanda per
tahap ("L2", "/24", "BGP"). Benih sama = gambar sama, jadi JANGAN memakai benih yang
berubah tiap render (tanggal, indeks acak). Warna lewat `var()` dan
`--sampul-s/--sampul-l` (tema terang digelapkan, bukan dipucatkan). Sampul selalu
`aria-hidden`, dan teks di atasnya berdiri di atas tirai pekat (akordeon: tirai ke
`--surface`; hero: tirai gelap). Satu sampul per TAHAP di kepala halaman modul.

**Diagram SVG menggantikan ASCII lewat `enrich.json`, bukan lewat `.md`.**
`{ type: "diagram", id, after, ganti: true }` membuat build MENGGANTI figur ASCII
pertama di bagian itu; berkas materi tidak disentuh. Build GAGAL kalau ID diagram
tidak terdaftar di `src/diagrams/index.tsx`, kalau jangkar tidak ada, kalau modulnya
tidak ada, atau kalau `ganti: true` menunjuk bagian tanpa figur ASCII. Aturan
terakhir sudah menangkap satu klaim keliru dari agen penulis diagram (blok kode biasa
dikira figur ASCII). Diagram baru wajib memuat SEMUA isi ASCII yang digantinya.

**Diagram diperiksa di browser, bukan dipercaya dari perkiraan lebar huruf.**
Pemeriksaan: setiap `<text>` di `svg.dg` dibandingkan kotaknya dengan teks lain dan
dengan viewBox, dalam koordinat SVG (`getScreenCTM`). `getBBox()` polos memberi
koordinat LOKAL di dalam `<g transform>`, dan pemeriksaan pertama tertipu karenanya
(semua label perangkat tampak bertumpuk di (0,30)). Hasil 2026-10-15: 70 modul
berdiagram baru, 1 tumpang-tindih nyata (ARP spoofing, sudah diperbaiki).

**Foto asli tinggal di `app/public/img/` dengan kredit di `data/photos.json`**, diambil
dari Wikimedia Commons lewat API (`extmetadata`: lisensi dan pembuat dibaca dari
metadata, bukan diketik), diunduh pada lebar 1.920 px, dan hanya CC BY, CC BY-SA, CC0,
atau domain publik. Foto yang tampil di halaman wajib menampilkan kreditnya.

### Kurikulum: tahap dan modul baru (Fase 6, 2026-10-15)

**Tahap baru wajib didaftarkan di EMPAT tempat**: `STAGE_META` (`build-content.mjs`,
judul + band), `TANDA` (`lib/sampul.tsx`), `STAGE` (`components/icons.tsx`), dan
`TOPIK_TAHAP` (`lib/pustakaTopik.ts`). Yang terakhir dijaga tes (setiap tahap belajar
4-6 bacaan lanjutan) dan validasi build (`TOPIK_TAHAP` yang menunjuk tahap tanpa modul
menggagalkan build). Dua yang tengah tidak dijaga apa pun: tanpa keduanya tahap jatuh
ke ikon dan tanda bawaan tanpa ada yang protes. Tahap 23 "Jalur Vendor Lanjutan" ada
di band `khusus` sesudah Tahap 22; 22.5 menunjuk 23.1, dan 23.3 menunjuk 21.1.

**Modul "pendalaman" diberi label itu di pengantarnya.** Tahap 23 dan bagian istilah
lanjut (XDP, Hubble, DCQCN, 400ZR, RFC 8925, 5G SA/UPF, ABR) tidak diuji di CCNA,
Network+, atau MTCNA; labelnya supaya pembelajar yang mengejar ujian tidak terseret.

**Menambah bagian di tengah modul = menggeser nomor bagian sesudahnya DAN menjaga
latihan-jawaban tetap berpasangan.** Kartu SRS diambil dari bagian Latihan; jumlah
kartu per modul harus sama dengan jumlah latihannya. ID kartu ikut nomor, jadi
menyisipkan latihan di tengah memutus jadwal review kartu sesudahnya: tambahkan di
AKHIR daftar latihan.

**Peta sertifikasi (18.2, 18.3, 18.5) diperiksa terhadap halaman resmi 2026-10-15**
dan setiap angka membawa URL buktinya. Yang TIDAK dipublikasikan penerbit (jumlah soal
dan nilai lulus CCNA) ditulis sebagai "tidak dipublikasikan", bukan angka komunitas
yang disamarkan jadi fakta. **CCNA v2.0 mulai diuji 2027-02-03**; 18.2 masih memetakan
v1.1 topik demi topik, dan pemetaan ulang ke v2.0 harus selesai sebelum tanggal itu.
MTCINE menuntut MTCRE, bukan MTCNA; ujian MikroTik di kelas, bukan daring.

**Teks materi baru ditulis sendiri, sumber hanya dirujuk.** Fase 6 tidak mengadaptasi
teks atau kode dari luar, jadi `NOTICE.md` tidak bertambah. Google SRE Book (NC-ND)
dan halaman vendor cuma boleh ditautkan.

**Diagram modul baru diperiksa di browser seperti Fase 5.** 15 diagram (o6, p7, v8):
pemeriksa kotak teks menemukan 1 tanda yang ternyata cuma kotak ascent/descent font di
dalam `Box` bersub (huruf tidak bersentuhan, dicek di tangkapan layar), dan lembar
kontak menemukan 3 masalah yang tidak tertangkap pemeriksa: label panah menempel
batas panel, panah yang berakhir di ruang kosong, label di atas garis. Pemeriksa
otomatis tidak menggantikan melihat gambarnya.

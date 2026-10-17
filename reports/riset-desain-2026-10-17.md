# Riset desain 2026-10-17: Observatorium Jaringan

Laporan riset untuk rombak desain berikutnya. Tidak ada berkas aplikasi yang disunting.
Setiap klaim tentang situs atau lisensi di bawah ini berasal dari halaman atau berkas yang
benar-benar dibuka pada 2026-10-17; cara memeriksanya ditulis di bagian 8.

Status: selesai 2026-10-17. Bagian 6 menilai keadaan sesudah commit `b77c48a`.

## 0. Ringkasan

- Penyebab rasa "kosong dan tanpa jiwa" di keadaan awal: halaman dirakit dari resep skill
  `gpt-taste` (pil kaca, hero sinematik, bento, kalimat menyala per kata, tumpukan kartu,
  marquee) dengan huruf Space Grotesk, yang oleh Anthropic sendiri disebut pilihan
  konvergen model. Tidak ada unsur yang lahir dari subjeknya (bagian 1 dan 4).
- Rombakan planisfer sudah memperbaiki inti masalahnya. Lima perbaikan P1 yang tersisa
  (bagian 6.2): hero masih bersusunan "teks kiri, gambar kanan" dengan H1 yang
  menjelaskan metafora; eyebrow dan label monospace masih ada; status bintang "menyala"
  tidak terbaca (bintang belum 2,71:1 dan garis jalur 1,94:1 di tema terang, di bawah
  3:1); kelip dan denyut tanpa akhir melanggar WCAG 2.2.2 bagi pengguna tanpa setelan OS;
  bintang latar diletakkan acak.
- Arah final "Langit di atas, Bumi di bawah": kurikulum sebagai langit (planisfer),
  jaringan Indonesia sebagai Bumi (lampu malam, kota misi, Palapa), dan keduanya menyala
  dari data progres yang sama (bagian 6.3).
- Palet: latar gelap `#0c1532` menggantikan `#070a18` yang hampir hitam; token baru
  `--pf-lampu` (`#a14f07` terang, `#f6b54a` gelap); bintang belum dan garis jalur
  dinaikkan sampai di atas 3:1; status dibedakan dengan bentuk, bukan warna (bagian 6.4).
- Gambar terbaik yang sudah diverifikasi lisensinya: `File:Lights of Java.jpg` (ISS,
  domain publik), `File:STS-7 Palapa-B1 deploy.jpg`, sampul Voyager, plat Cellarius dan
  Bayer beresolusi tinggi, peta logis ARPANET 1977, peta kabel laut 1887 dan 1896, potongan
  Black Marble Indonesia. TeleGeography: tangkapan layarnya CC BY-SA 4.0 menurut halaman
  sitasinya sendiri, tetapi datanya tertutup; tidak layak dipakai. Natural Earth domain
  publik (bagian 5).
- Momen "wow" berurutan: bintang menyala sekali saat modul tuntas; langit sungguhan malam
  ini dari katalog HYG; peta Indonesia malam di halaman Misi; satu bintang berpindah dari
  dasbor ke halaman modul lewat View Transitions; latihan dekode pesan Arecibo (bagian 6.8).
- Skill yang aman dan berguna: `greensock/gsap-skills`, `emilkowalski/skills`,
  `react-view-transitions` dari Vercel, `oklch-skill`. Hindari `gpt-taste` untuk proyek
  ini, dan `impeccable` sampai biner yang dijalankannya ditinjau (bagian 7).

## 1. Keadaan sekarang: kenapa terasa kosong

Bagian ini menilai keadaan awal hari ini (tangkapan `awal-*.png` dan `kontak-awal.png`,
sebelum commit `7ac5155` dan `b77c48a`). Keadaan sesudah rombakan dinilai di bagian 6.2.

1. Semua halaman memakai kepala yang sama: judul di kiri, sampul generatif di kanan dalam
   kartu membulat (Alat, Arena, Pustaka, Review, Modul). Halaman jadi bisa dipertukarkan;
   pindah halaman tidak terasa pindah tempat.
2. Sampulnya tidak menggambarkan apa pun yang spesifik. Ragam `kisi` dan `paket` di
   `lib/sampul.tsx` berupa kotak bundar pastel; tandanya ("TCP", "RFC", "0x", "/24") ditulis
   monospace dengan opasitas 0,1 sehingga nyaris tak terbaca. Hasilnya sapuan warna lembut,
   bukan gambar jaringan.
3. Bidang kosong yang luas tanpa isi atau tekstur: separuh kanan hero Karier, kepala
   Pustaka, kepala Review.
4. Dasbor dibangun dari resep `gpt-taste` (bagian 4.1): hero foto abu dengan tirai radial
   dan dua ajakan, gambar pil di dalam judul, kalimat yang menyala per kata, tumpukan
   kartu, akordeon, marquee, bento. Semua itu bisa dipindah ke produk lain tanpa diubah.
5. Satu-satunya foto asli di layar utama adalah rak pusat data yang dibuat abu-abu dan
   ditutup tirai gelap, jadi hampir tidak terlihat.
6. Huruf UI dan judulnya Space Grotesk, yang oleh Anthropic disebut sebagai pilihan
   konvergen keluaran model (bagian 4.1).

Ringkasnya: "tidak ada jiwanya" karena tidak ada satu pun unsur di layar yang hanya bisa
lahir dari jaringan komputer atau dari progres pembelajar ini. Rombakan planisfer
memperbaiki inti masalah itu; sisa-sisanya ada di 6.2.

## 2. Situs rujukan 2024-2026

Cara membaca kolom "Teramati": [Awwwards] = daftar "Elements" dan teknologi di halaman
penghargaannya; [kode] = ditemukan di HTML, CSS, dan JS situsnya yang diunduh hari ini
(nama huruf dari `@font-face`, pustaka dari isi bundel); [layar] = tangkapan Chrome
headless 1440 x 900 yang saya lihat sendiri. Messenger, Igloo, Portal, MindMarket,
Oryzo, dan The Race to Save Space gagal dirender headless (WebGL), jadi untuk situs itu
hanya ada [Awwwards] dan [kode]. Altis (Honorable Mention 25 Maret 2026) juga gagal dan,
karena buktinya terlalu tipis, tidak dimasukkan. Tanggal penghargaan disalin dari halaman
Awwwards masing-masing.

### 2.1 Langit, ruang angkasa, observatorium

| Situs dan penghargaan | Teramati | Pola yang dipinjam |
|---|---|---|
| Messenger (abeto), <https://messenger.abeto.co>. Awwwards SOTD 10 Nov 2025; tercantum di halaman Sites of the Year | [Awwwards] Character Navigation, NPCs, Character Configuration. [kode] three.js, Svelte, `lerp` di 70 tempat | Navigasi adalah dunianya sendiri: orang berjalan di planet kecil untuk sampai ke isi. Versi kita: planisfer kurikulum sebagai peta yang dijelajahi, dalam SVG 2D, bukan 3D |
| Auriga Space (tonik), <https://www.aurigaspace.com/>. Honorable Mention 12 Jan 2026 | [Awwwards] Preloader, Mouse Interaction, Scroll Parallax. [kode] Webflow, GSAP, ScrollTrigger, SplitText, Lenis, Rive, Lottie, `quickTo` 11 kali, `prefers-reduced-motion` 10 kali. [layar] wordmark melebar memenuhi lebar layar di atas hitam, navigasi mono kapital, satu frasa berwarna sian | Disiplin gerak-dikurangi dan `quickTo` untuk interaksi tetikus. Tampilannya justru contoh gugus (b) Anthropic: hitam, satu aksen terang, label mono. Penghargaan tidak membuat ciri itu bebas klise |
| Portal Space Systems (O0), <https://www.portalsystems.space/>. Honorable Mention 14 Agu 2025 | [kode] Webflow, GSAP, ScrollTrigger 102 kali, SplitText, Lenis, Rive, three.js, `prefers-reduced-motion` 6 kali | Rive untuk animasi berkeadaan kecil (mesin keadaan) bila suatu hari diagram butuh interaksi lebih kaya. Runtime-nya paket npm, bisa dibundel lokal |
| Faroe Islands Space Program (NORD ID untuk SKF), <https://www.skf.com/group/fighting-friction/01>. Honorable Mention 14 Apr 2025 | [Awwwards] Variable Font Animation, Interactive Scrolling Lottie Animation, Interactive Scrolling 3D Animation, Interactive Hotspots, Section Transition. [kode] GSAP, ScrollTrigger, Lenis, Lottie, View Transitions, `mix-blend-mode: difference`. [layar] Bumi malam dari orbit dengan bintang, huruf retro melebar bertekstur tembaga | Titik panas (hotspot) di atas gambar besar: klik kota di foto ISS Jawa untuk membaca soal titik pendaratan kabel. Yang tidak dipinjam: bola Bumi malam sebagai pembuka, persis klise yang disindir Dobrenko (bagian 4) |
| The Race to Save Space (Elkanodata untuk PBB), <https://www.un.org/en/content/feature/theracetosavespace/>. Nominee 9 Okt 2025 | [Awwwards] Space Debris pieces with Mouse interaction, Data Scroll; teknologi WebGL, Three.js, Nuxt.js, Data Visualization, Sound. [kode] GSAP, ScrollTrigger, Lenis, Roboto Mono | Data sebagai alur gulir. Padanannya: berapa paket yang lewat selama satu paragraf dibaca |
| Moon, Bartosz Ciechanowski, <https://ciechanow.ski/moon/>, 17 Des 2024. Bukan situs berpenghargaan, rujukan edukasi | [kode] 16.750 kata dan 79 slider di satu halaman; HTML-nya tidak memuat `<canvas>`, dan skrip khusus halamannya hanya `/js/moon.js`. Teksnya: "You can drag it around to change your point of view, and you can also use the slider to control the date and time" | Standar tertinggi untuk "visualisasi di materi": setiap konsep punya satu gambar kecil yang bisa diputar atau digeser, diletakkan di dalam alur prosa, dan prosanya menyuruh pembaca mencobanya |

### 2.2 Edukasi dan dokumentasi yang imersif

| Situs dan penghargaan | Teramati | Pola yang dipinjam |
|---|---|---|
| Anime.js (Julian Garnier), <https://animejs.com>. SOTD 6 Mei 2025 | [Awwwards] Scroll scrubber, Header animation, The complete animator's toolbox. [kode] Berkeley Mono, DIN, Digital-7; `mix-blend-mode`. [layar] latar hitam, satu dial bulat bergerigi skala seperti instrumen, matriks titik, chip `npm i animejs` yang bisa disalin | Hero adalah demo subjeknya sendiri. Dial bergerigi derajat adalah bahasa instrumen yang cocok untuk progres tahap |
| Dropbox Brand (Daybreak Studio), <https://brand.dropbox.com/>. SOTD 12 Feb 2025 | [Awwwards] Typography Widgets, Motion Easing Demo, Logo Design Breakdown, Motion Timeline, Typography Cursors, Iconography Slot Machine, Color System Showcase. [kode] Webflow, Rive, Lottie, `@media (hover: hover)` 16 kali, `prefers-reduced-motion`; Sharp Grotesk DB variable dan Atlas Grotesk. [layar] garis kisi tata letak biru muda dibiarkan terlihat di sekeliling judul | Dokumentasi yang setiap aturannya berupa widget. "Typography Cursors": kursor berubah sesuai bagian. Kisi yang terlihat sebagai ornamen struktural, padanan garis lintang pada plat bintang |
| Tracing Art (Resn untuk Getty), <https://www.getty.edu/tracingart/>. SOTD 22 Jul 2025 | [Awwwards] Main Scroll, Hover Effects, Scroll Animations, Data Visualisation. [kode] Nuxt, GSAP, ScrollTrigger, Lenis, three.js, dan `@media (pointer:fine){.navChapter:hover .navChapter__title{transform:translate(1rem)}}`; Bradford LL (serif) dan Graphik. [layar] judul serif terpusat dikelilingi benda arsip asli yang melayang di latar putih | Artefak arsip asli sebagai ornamen: plat Cellarius, peta ARPANET, foto Palapa. Efek hover dibungkus `(pointer: fine)` |
| Why Zero (Sindhur Dutta, Zero University), <https://why.zero.university/>. SOTD 7 Sep 2026 | [Awwwards] Narrative Scroll, Shader interactions, Interactive Map with Game Controls, Page Unlock, Hold to proceed. [kode] three.js, GSAP, `prefers-reduced-motion` di CSS dan JS, cek `(pointer: fine)` untuk kamera; tetapi menyuntik `*, *::before, *::after { cursor: none !important; }` ke seluruh halaman. PP Supply Mono/Sans, STK Bureau Serif. [layar] shader air beku memenuhi layar | "Tahan untuk lanjut" sebagai gerbang yang disengaja (tahan untuk mengirim paket). Contoh buruk yang jelas: menyembunyikan kursor sistem di semua elemen |
| The Shape of Intelligence (Jamie McKaye), <https://shapeofintelligence.com/>. Nominee 26 Sep 2026 | [kode] Next.js, View Transitions (10 kali), `prefers-reduced-motion` 14 kali; ABC Diatype dan Diatype Mono. [layar] judul raksasa membungkus patung jaring 3D; slider "Change the shape of an idea" (Rules, Learning, Context) di hero; kaki halaman "Chapters 01 / 08", "Sound off", "Motion on" | Sakelar "Gerak hidup/mati" yang terlihat di UI, selain pengaturan OS. Slider di hero yang mengubah ilustrasinya: konsep diajarkan sebelum orang menggulir |
| Grids (Obys, Design Education Series S03), <https://grids03.obys.agency/>. Nominee 28 Sep 2026 | [Awwwards] Grids Loading, Grids Hover; teknologi WebGL, GSAP, Locomotive Scroll. [kode] `[data-trailer]{cursor:none}` hanya di area tertentu, `mix-blend-mode:difference` di judul pembuka, kueri `prefers-reduced-motion` di pengatur gulir. [layar] huruf balok piksel, daftar 17 kuliah dengan durasi dan inden bertingkat, garis rambut | Silabus sebagai objek tipografi: halaman Kurikulum berupa daftar modul dengan waktu baca, inden mengikuti kedalaman |
| What's inside an atom (Greg Taylor), <https://whatsinsideanatom.hu/>. Nominee 29 Sep 2026 | [Awwwards] CSS, HTML5, Photoshop. [layar] teks fosfor hijau CRT, garis pindai, bingkai bintang ASCII, navigasi tombol panah, keterangan "[not to scale]" dengan garis penunjuk | Perjalanan skala nyata. Padanannya: jarak dan waktu tempuh paket Jakarta ke Singapura dibanding ke Bulan. Estetika terminal hijau sendiri sudah klise "hacker", jadi pinjam alurnya, bukan warnanya |

### 2.3 Kursor dan hover kelas atas

| Situs dan penghargaan | Teramati | Pola yang dipinjam |
|---|---|---|
| Lando Norris (OFF+BRAND), <https://landonorris.com/>. SOTD 17 Nov 2025; tercantum di halaman Sites of the Year | [kode] GSAP, ScrollTrigger, SplitText, Lenis, three.js, Rive, kata "cursor" di 108 tempat; Brier dan Mona Sans Variable; aset yang terunduh pemeriksa saya 6,4 MB tanpa model 3D. [layar] potret dengan helm rangka kawat transparan | Satu objek hero yang bereaksi pada penunjuk, bukan semua elemen. Beratnya tidak cocok untuk aplikasi belajar |
| MindMarket, <https://mindmarket.com/>. SOTD 29 Des 2025 | [Awwwards] Playful hover interaction, Path scroll with Rive animations, Cards stack on scroll. [kode] Astro, Swup, View Transitions, Rive, Lenis, Tailwind, `(hover: hover)` 24 kali; huruf Inter | Hover hanya di bawah `(hover: hover)`; transisi halaman lewat View Transitions. Catatan: memakai Inter dan tumpukan kartu dan tetap menang. Tanda AI bukan tekniknya, melainkan teknik yang dipakai tanpa alasan dari isi |
| Oryzo AI (Lusion), <https://oryzo.ai>. SOTD 13 Apr 2026 | [Awwwards] WebGL Sketches Interaction, Footer Interactive Particles, Reveal Transition, Gallery Transition. [kode] three.js, GSAP, SplitText, Rive, Astro; `cursor:none` hanya pada `#video-overlay`, dan dikembalikan ke `cursor:auto` di bawah 767,98 px; DM Mono dan Literata | `cursor: none` dibatasi pada satu permukaan imersif. Literata (sudah tersedia sebagai pilihan baca) dipakai sebagai serif tampilan oleh studio sekelas Lusion |
| Obys R-Experiment Space, <https://experiment.obys.agency/>. SOTD 28 Jul 2026 | [kode] GSAP, ScrollTrigger, three.js, Obys Sans. [layar] karya disusun pada cincin silinder 3D di sekeliling penonton, garis rambut, jam lokal di kepala halaman | Mode "ruang" sebagai tampilan alternatif, bukan tampilan utama |
| Igloo Inc (abeto), <https://www.igloo.inc/>. SOTD 23 Jul 2024; tercantum di halaman Sites of the Year | [kode] satu-satunya `@font-face` yang ditemukan: IBM Plex Mono, dihosting sendiri; Svelte. [Awwwards] Content Page, Links | Dicantumkan karena masuk daftar Sites of the Year, bukan sebagai pola yang dipinjam: buktinya tipis karena WebGL-nya tidak bisa dirender headless |

Tutorial yang dibaca untuk teknik kursor: Codrops "Building a Mouse-Following Square Lens
Effect with Three.js and GLSL" (Tomoyuki Nakata, 25 Agustus 2026,
<https://tympanus.net/codrops/2026/08/25/building-a-mouse-following-square-lens-effect-with-three-js-and-glsl/>)
memakai `this.mouseEase.lerp(this.mouse, this.pointerEase)` setiap frame untuk lensa
persegi dengan geser RGB di fragment shader. Codrops "How to Code a Crosshair Mouse
Cursor with Distortion Hover Effect" (Manoela Ilic, 26 Mei 2021,
<https://tympanus.net/codrops/2021/05/26/how-to-code-a-crosshair-mouse-cursor-with-distortion-hover-effect/>)
membangun bidikan dari dua garis DOM dengan `amt: 0.15`, menyembunyikannya dengan
`gsap.set(..., {opacity: 0})` sampai tetikus bergerak, dan memberi turbulensi SVG
(`feTurbulence`, 1 ke 0 dalam 0,5 detik) saat melewati tautan.

Galeri lain: Godly sekarang dialihkan ke Recent (<https://recent.design/?ref=godly>);
siteinspire menjawab dengan "Vercel Security Checkpoint" (HTTP 429); hasil pencarian CSS
Design Awards dan FWA dirender JavaScript dan tidak terbaca lewat curl. Jadi semua
penghargaan di atas berasal dari Awwwards.

## 3. Kursor dan hover yang tidak murahan

### 3.1 Pola yang layak, dan bukti pemakaiannya

1. Kursor sistem tetap ada; yang ditambahkan adalah pengikut sekunder (cincin, bidikan,
   lensa). Situs yang menyembunyikan kursor membatasinya pada satu permukaan: Grids
   memakai `[data-trailer]{cursor:none}`, Oryzo hanya pada `#video-overlay` dan
   mengembalikannya ke `cursor:auto` di bawah 767,98 px. Contoh buruknya Why Zero, yang
   menyuntik `*, *::before, *::after { cursor: none !important; }` ke seluruh halaman
   (bagian 2.2).
2. Pelembutan (lerp) ditulis sekali per frame, hanya lewat `transform`. Codrops memakai
   `amt: 0.15` untuk bidikan dua garis (2021) dan `Vector2.lerp` setiap frame untuk lensa
   (2026). Untuk GSAP, dokumentasi `gsap.quickTo()`
   (<https://gsap.com/docs/v3/GSAP/gsap.quickTo()>): "If you find yourself calling
   gsap.to() many times on the same numeric property of the same target, like in a
   "mousemove" event, you can boost performance by creating a quickTo() function
   instead." Di antara situs rujukan, Auriga Space menyebut `quickTo` 11 kali di kodenya;
   di situs lain kata itu hanya muncul sekali sampai empat kali, kemungkinan besar
   definisinya di dalam pustaka GSAP yang terbundel, jadi tidak saya hitung sebagai bukti
   pemakaian.
3. Status per elemen lewat atribut data, bukan logika per komponen. Pustaka
   `Cuberto/mouse-follower` (MIT, 821 bintang, didorong terakhir 31 Agustus 2026) memakai
   `data-cursor`, `data-cursor-text`, `data-cursor-icon`, dan efek tempel (`stickDelta:
   0.15`) dengan bawaan `speed: 0.55`, `ease: 'expo.out'`. Angka 0,55 itu pelajaran
   penting: pengikut yang terlalu lambat terasa seperti kursor yang tertinggal.
4. Magnet hanya untuk sasaran besar dan sedikit (tombol utama, bintang di peta), dengan
   tarikan kecil (sekitar 15 persen jarak, seperti `stickDelta` di atas). Tidak pernah
   untuk tautan di dalam prosa.
5. Sorotan tepi yang mengikuti kursor (pola `.tile::after` yang dulu ada) dipakai di satu
   jenis permukaan saja, dan punya padanan `:focus-visible` supaya pengguna papan ketik
   mendapat isyarat yang sama.
6. `mix-blend-mode: difference` hanya di atas bidang monokrom. Grids memakainya pada judul
   pembuka hitam putih. Di atas warna, hasilnya warna komplementer yang tidak dipilih
   siapa pun (cincin putih di atas ultramarin `#2a37d4` menjadi kekuningan).
7. Hover hanya untuk perangkat yang memang bisa hover. MDN
   (<https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer>): `fine` berarti
   "The primary input mechanism includes an accurate pointing device, such as a mouse";
   `@media (hover: hover)` berarti "The primary input mechanism can conveniently hover
   over elements" (<https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover>).
   Tracing Art membungkus geser judul bab dengan `@media (pointer:fine)`; Dropbox Brand
   memakai `(hover: hover)` 16 kali.

### 3.2 Syarat aksesibilitas yang berlaku

| Kriteria WCAG 2.2 | Bunyinya (halaman Understanding W3C) | Artinya di aplikasi ini |
|---|---|---|
| 2.3.3 Animation from Interactions (AAA) | "Motion animation triggered by interaction can be disabled, unless the animation is essential" | Bidikan, magnet, dan lensa mati bila gerak dikurangi. `Kursor.tsx` sudah memeriksa `MOTION_OK` |
| 2.2.2 Pause, Stop, Hide (A) | gerak yang "starts automatically, lasts more than five seconds, and is presented in parallel with other content" wajib bisa dihentikan | Kelip dan denyut tanpa akhir di peta melanggar ini bagi pengguna yang tidak menyetel OS; butuh sakelar Gerak atau tidak ada loop (6.2) |
| 1.4.13 Content on Hover or Focus (AA) | Dismissible, Hoverable, Persistent | Kartu keterangan bintang harus bisa ditutup dengan Escape, tidak hilang saat penunjuk pindah ke atasnya, dan muncul juga saat fokus papan ketik |
| 2.4.11 Focus Not Obscured (Minimum) (AA) | "the component is not entirely hidden due to author-created content" | Pil navigasi tetap di atas tidak boleh menutup elemen yang difokus; beri `scroll-padding-top` setinggi pil |
| 2.5.8 Target Size (Minimum) (AA) | "at least 24 by 24 CSS pixels", dengan pengecualian jarak | Bintang yang digambar 4 px tetap butuh area klik tak terlihat minimal 24 px (`.pf-sasaran` sudah ada; pastikan ukurannya) |
| 1.4.11 Non-text Contrast (AA) | "a contrast ratio of at least 3:1 against adjacent color(s)" | Bintang "belum" dan garis jalur saat ini di bawah 3:1 (6.2) |

Satu hal yang tidak ditulis WCAG tetapi nyata: pengguna yang membesarkan penunjuk lewat
pengaturan OS kehilangan penunjuknya sendiri bila situs menyembunyikan kursor sistem.
Itu alasan butir 1 di atas.

### 3.3 Kesalahan umum, dan catatan untuk `components/Kursor.tsx`

Kesalahan yang paling sering: pengikut yang lambat sehingga terasa tertinggal;
menyembunyikan kursor I-beam di atas teks; kursor muncul di (0,0) sebelum tetikus
bergerak; efek tetap jalan di layar sentuh; membaca tata letak di setiap `mousemove`;
memakai properti yang memicu tata letak untuk animasi; lupa iframe, input, dan seleksi
teks; tidak ada padanan untuk papan ketik.

Yang sudah benar di `Kursor.tsx`: kursor sistem tidak disembunyikan; aktif hanya bila
`(pointer: fine) and (hover: hover)` dan gerak tidak dikurangi; hanya `pointerType ===
'mouse'`; muncul pada gerakan pertama, bukan di pojok kiri atas; memudar di atas prosa.
Empat perbaikan kecil:

1. Lerp tidak bergantung laju frame. `k = 0.24` per frame berarti di layar 120 Hz
   bidikan dua kali lebih cepat. Pakai waktu: `const a = 1 - Math.pow(1 - 0.24, dt / 16.67)`
   dengan `dt` dari selisih `performance.now()`.
2. Hanya `transform`. Saat ini `width` dan `height` ditulis setiap frame. Tetapkan
   ukuran kotak, lalu geser empat sudut dengan `translate` masing-masing (atau `scale`
   pada kotak dan skala balik pada garis), supaya tidak ada kerja tata letak per frame.
3. Ukur sasaran hanya saat sasaran berganti, saat gulir, dan saat ukuran jendela berubah,
   bukan di setiap `pointermove`.
4. Padanan papan ketik (pilihan): saat elemen mendapat `:focus-visible`, bidikan yang
   sama mengunci elemen itu. Cincin fokus `--ring` tetap ada; bidikan hanya tambahan.

## 4. Tanda desain buatan AI dan cara menghindarinya

### 4.1 Apa kata sumbernya

Sumber paling tajam justru dari pembuat model sendiri, karena mereka mengukur keluaran
modelnya.

1. Anthropic, "Improving frontend design through Skills", claude.com/blog, 12 November
   2025 (<https://claude.com/blog/improving-frontend-design-through-skills>). Penyebabnya
   statistik: "During sampling, models predict tokens based on statistical patterns in
   training data" dan "Safe design choices ... dominate web training data." Daftar
   larangannya: "Never use: Inter, Roboto, Open Sans, Lato, default system fonts" dan
   "Clichéd color schemes (particularly purple gradients on white backgrounds)". Kalimat
   yang paling relevan untuk aplikasi ini: "You still tend to converge on common choices
   (Space Grotesk, for example) across generations."
2. Berkas `skills/frontend-design/SKILL.md` di repo `anthropics/skills`, versi commit
   `00756142` (4 Desember 2025): "NEVER converge on common choices (Space Grotesk, for
   example) across generations." Di keadaan awal, huruf UI dan judul aplikasi ini adalah
   Space Grotesk; commit `b77c48a` menggantinya dengan Archivo.
3. Berkas yang sama, versi terbaru `41bbe19d` (3 September 2026), memberi lima gugus yang
   menurut Anthropic menjadi ciri desain buatan AI saat ini: (a) latar krem dekat
   `#F4F1EA`, judul serif kontras tinggi, aksen terakota dekat `#D97757`; (b) latar
   hampir hitam dengan satu aksen hijau asam atau merah terang; (c) tata letak koran
   dengan garis rambut, radius nol, kolom rapat; (d) "the SaaS-card kit": kartu bundar
   identik, satu radius untuk semua, bayangan abu `rgba(0,0,0,.1)` yang sama, sapuan
   gradien sebagai hiasan; (e) "template chrome": label eyebrow huruf besar berjarak di
   atas setiap judul, metadata yang dirangkai titik tengah ("A · B · C"), label berpola
   kata lalu tanda pisah panjang lalu potongan kalimat, hitam bertinta (`#0B0B0B`, `#111`)
   sebagai pengganti hitam, huruf monospace untuk label data kecil, dan panah "→" di
   ujung teks tautan dan tombol. Gerak: "fade-and-slide-up entrances on each section and
   hover transitions on every card are the generic default and read as AI-generated".
   Hero: "a big number with a small label, supporting stats, and a gradient accent is
   the default treatment". Tipografi: menonjolkan satu kata di judul, huruf kapital untuk
   label, dan label tipografis yang tidak perlu. Penomoran 01/02/03 hanya sah bila isinya
   memang berurutan.
4. Nielsen Norman Group, Kate Kaplan, "The Proliferation and Problem of the Sparkles
   Icon", 20 September 2024 (<https://www.nngroup.com/articles/ai-sparkles-icon-problem/>):
   "What that sparkles icon means, however, differs from interface to interface", dan
   dalam riset mereka "no one attributed the concept of 'artificial intelligence' to the
   icon". Ikon kilau tidak menyampaikan apa pun; jangan dipakai untuk XP, lencana, atau
   "fitur ajaib".
5. Nielsen Norman Group, Megan Brown, "Glassmorphism: Definition and Best Practices",
   7 Juni 2024 (<https://www.nngroup.com/articles/glassmorphism/>): "textual elements can
   fall over multiple colors, which can affect readability" dan "glassmorphism is best
   when utilized sparingly to create an illusion of depth."
6. Nielsen Norman Group, Raluca Budiu, "Liquid Glass Is Cracked, and Usability Suffers in
   iOS 26", 10 Oktober 2025 (<https://www.nngroup.com/articles/liquid-glass/>): "anything
   placed on top of something else becomes harder to see", "Text on top of images is a
   bad idea because the contrast between the text and the background is often too low",
   dan "Motion for motion's sake is not usability. It's distraction with a side of
   nausea."
7. Alex Dobrenko, "Every app that adds AI looks like this", 12 Oktober 2023
   (<https://botharetrue.substack.com/p/every-app-that-adds-ai-looks-like>), satire yang
   dikirim ke Hacker News dan mendapat 583 poin: halaman pembuka produk AI yang khas
   memuat "a photo of the whole planet lit up by the 'aha' moments of everyone using AI".
   Relevan langsung untuk arah observatorium: foto Bumi malam sebagai satu bola utuh sudah
   menjadi klise produk AI.

Ditambah satu sumber lokal yang menjelaskan asal tampilan sekarang. `reports/rencana-desain-2026-10-15.md`
mencatat bahwa Fase 4 memilih komponennya lewat "Undian deterministik". Undian itu
berasal dari skill `gpt-taste` (berkas lokal
`~/.claude/plugins/marketplaces/taste-skill/skills/gpt-tasteskill/SKILL.md`), yang
mewajibkan "floating glass pill" sebagai navigasi, hero "Cinematic Center" dengan
"exactly two high-contrast CTAs" di atas "full-bleed background image with a dark radial
wash", bento `grid-flow-dense`, "Scrubbing Text Reveals" dari opasitas 0,1, "Card
Stacking", "Inline Typography Images", "Horizontal Accordions", "Infinite Marquee",
`group-hover:scale-105 transition-transform duration-700` pada setiap kartu, dan "grainy
mesh gradients". Dasbor sekarang memuat hampir semuanya. Itu inti diagnosis "tidak ada
jiwanya": susunan halaman berasal dari resep yang sama untuk semua klien, bukan dari
jaringan komputer. Skill anti-klise yang dipakai banyak orang akhirnya melahirkan klise
barunya sendiri, dan orang yang sering melihat halaman buatan agen pada 2025-2026 akan
mengenalinya.

### 4.2 Audit aplikasi terhadap tanda-tanda itu

Kolom "Awal" adalah keadaan sebelum commit `7ac5155` dan `b77c48a`; kolom "Sesudah
`b77c48a`" diperiksa dengan `grep` di pohon kerja `app/src` pada sore yang sama.

| Tanda | Awal (bukti) | Sesudah `b77c48a` | Perbaikan yang masih perlu |
|---|---|---|---|
| Huruf yang disebut Anthropic sebagai pilihan konvergen | `--font-ui: "Space Grotesk Variable"` | Diganti Archivo bersumbu lebar | Tidak ada |
| Resep `gpt-taste` utuh di Dasbor | `hero-sinema` (foto abu, tirai radial, dua ajakan), `InlineImg` di H1, `.scrub-text`, `.tumpuk-kartu`, `.hacc`, `.marquee`, `CarouselReview`, bento 7x2+5+5, `group-hover:scale-105 duration-700` | Hero, akordeon, marquee, gambar pil, bento hilang. Masih ada di `Dashboard.tsx`: `.scrub-text` dengan SplitText (baris 58-61, 122), `.tumpuk-kartu` (baris 64, 137), `CarouselReview` (baris 148) | Ganti tiga sisa itu dengan isi yang lahir dari subjek (6.8), atau hapus |
| Pil kaca melayang | `backdrop-filter: blur(20px) saturate(1.6)` di `.glass` | Kaca dicabut; pil tetap, kini bergaris ganda | Satu garis tepi saja (6.2) |
| Panah di ujung tombol dan tautan | Hampir semua tombol utama | Panah di tombol utama dibuang, tetapi `IconArrowRight` masih dirujuk 35 kali, `.btn-bubble` 11 kali, `.link-arrow` 13 kali | Sisakan panah hanya untuk navigasi sebelumnya/berikutnya dan penanda pilihan di palet perintah |
| Hitam bertinta sebagai hitam | `--bg: #0a0b0f` | `#070a18`, navy yang masih hampir hitam (L* sekitar 3) | `#0c1532` (6.4) |
| Metadata bertitik tengah | Pustaka, kredit foto | Masih, misalnya `BacaanLanjutan.tsx` baris 35 (jenis · bahasa · domain) | Kolom berlabel atau kalimat. Titik tengah di diagram (`0x0800 = IPv4 · 0x86DD = IPv6`) adalah notasi data dan boleh tetap |
| Label kapital berjarak | `.kr-kolom` | Masih (`index.css` baris 618) | `font-variant-caps: all-small-caps` atau huruf biasa |
| Eyebrow di atas judul | `.eyebrow`, "Ruang belajar Saya" | Kelas dicabut, tetapi baris tanggal dan baris hitungan monospace kini mengisi tempatnya | 6.2, baris P1 kedua |
| Angka besar dengan label kecil | `.stat-num` di bento, Arena, Review | Masih di `KarierPage.tsx` dan `KarierTeaser.tsx` | Untuk profil nol, tampilkan keadaan belum menyala, bukan angka 0 |
| Kartu identik, satu radius, satu bayangan | `--radius: 16px` di semua permukaan | Radius bertingkat 6/8/10/14 px; kartu Misi masih kisi kartu identik | 6.2, baris P2 pertama |
| Hover di setiap kartu | `.tile::after` spotlight | Dicabut | Tidak ada |
| Memudar-naik di setiap bagian | `.fade-up`, `.stagger`, `.reveal` | `.fade-up` masih dipakai 15 kali (sebagian untuk panel menu dan dialog, wajar) | Kepala halaman tanpa animasi masuk; cukup satu momen per halaman |
| Sapuan gradien dan monospace pucat sebagai hiasan | `lib/sampul.tsx` | Berkasnya sudah tidak ada | Tidak ada |
| Grain di seluruh layar | `.grain` | Dicabut | Tidak ada |

### 4.3 Cara menghindarinya, dalam bentuk aturan kerja

1. Mulai dari bahasa visual subjeknya sendiri. Frontend-design Anthropic menulis: "The
   subject's industry, subject matter, materials, and vernacular are where distinctive
   visual choices come from". Untuk jaringan, kosakatanya nyata dan jarang dipakai
   desainer: diagram ASCII di RFC, label patch panel, kode warna T568B, heksadesimal
   Wireshark, prompt konsol, tabel IANA, peta dinding NOC, peta ARPANET, peta kabel laut
   1887. Ditambah kosakata observatorium: gravir, kisi derajat, katalog bintang.
2. Satu keberanian per layar ("Spend your boldness in one place", sumber yang sama).
3. Isi sungguhan, bukan isian: foto berkredit dari bagian 5, progres pembelajar sendiri,
   artefak sejarah jaringan. Tidak ada angka hiasan.
4. Buang krom templat: panah di tombol, eyebrow, titik tengah, label kapital, penomoran
   yang bukan urutan.
5. Gerak hanya untuk menjawab tindakan, plus satu momen pembuka per halaman.
6. Ujinya sederhana: kalau halaman ini dipindah ke produk lain (aplikasi resep, SaaS
   akuntansi) dan masih terasa cocok, berarti belum lahir dari subjeknya.

## 5. Sumber gambar berlisensi bebas

Semua judul di bawah disalin dari API Wikimedia Commons (`prop=imageinfo`,
`iiprop=extmetadata|size|mime`), dan lisensinya dibaca dari `LicenseShortName`, bukan
diketik dari ingatan. Untuk berkas yang statusnya meragukan, templat lisensi di wikitext
halaman berkasnya ikut dibaca (dicatat di kolom lisensi). Resolusi adalah ukuran berkas
asli. Sesuai aturan proyek, unduh pada lebar 1.920 px (`iiurlwidth=1920`), simpan di
`app/public/img/`, dan catat kreditnya di `data/photos.json`.

Dua aturan NASA yang ikut berlaku (dibaca di
<https://www.nasa.gov/nasa-brand-center/images-and-media/>): konten NASA "generally are
not subject to copyright in the United States" dan boleh dipakai untuk pendidikan dengan
atribusi, tetapi "The NASA Insignia, Logotype, identifiers, and imagery are not in the
public domain". Jadi foto boleh, logo bola biru (meatball), logotipe cacing (worm), dan
lambang JPL tidak boleh dipakai sebagai ornamen. Pemakaian juga tidak boleh terbaca
sebagai dukungan NASA.

### 5.1 Peta bintang bergravir

| Berkas | Lisensi | Asli | Kegunaan |
|---|---|---|---|
| `File:Cellarius Harmonia Macrocosmica - Planisphaerium Copernicanum.jpg` | Public domain | 2886 x 2490 | Plat 4 (1661): orbit konsentris. Rujukan bentuk untuk peta tahap melingkar |
| `File:Cellarius Harmonia Macrocosmica - Haemisphaerium Stellatum Boreale Antiquum.jpg` | Public domain | 2884 x 2428 | Plat 24: langit utara dengan figur rasi. Latar halaman Kurikulum, dipotong dan diredupkan |
| `File:Celestial chart by Andreas Cellarius - Haemisphaerium Stellatum Boreale Antiquum.jpg` | Public domain | 13103 x 11213 (36,4 MB) | Plat yang sama, pindaian sangat besar (sumber: raremaps.com). Untuk potongan detail: garis lintang, huruf gravir, kartus |
| `File:Hæmisphærium stellatum boreale cum subiecto haemisphaerio terrestri - btv1b101003828.jpg` | Public domain (BnF, edisi 1708) | 7827 x 5490 | Langit di atas bola Bumi dalam satu plat. Metafora paling pas untuk "jaringan di atas Bumi" |
| `File:Cellarius Harmonia Macrocosmica - Corporum Coelestium Magnitudines.jpg` | Public domain | 2931 x 2468 | Plat 10: perbandingan ukuran benda langit. Pola untuk diagram skala (latensi, bandwidth, ukuran header) |
| `File:Cellarius Harmonia Macrocosmica - Scenographia Systematis Copernicani.jpg` | Public domain | 2928 x 2469 | Plat 5, pemandangan sistem Kopernikus. Cadangan untuk kepala tahap Routing atau WAN |
| `File:Uranometria orion.jpg` | Public domain (`PD-Art`, `PD-old-100`) | 5267 x 7153 | Bayer 1603, cetak 1661. Kisi derajat bergravir di tepi plat adalah sumber pola bingkai |
| `File:Cygnus Uranometria.jpg` | Public domain (pindaian e-rara) | 4560 x 3420 | Bayer 1603. Tekstur garis gravir untuk ilustrasi besar |
| `File:Lyra Uranometria.jpg` | Public domain (pindaian e-rara) | 4542 x 3407 | Bayer 1603, cadangan plat beresolusi tinggi |
| `File:Uranometria Canis Major (1603).jpg` | Public domain (pindaian e-rara) | 4576 x 3391 | Cadangan plat Bayer |
| `File:Uranometria orion-ruler detail.jpg` | Public domain | 686 x 201 | Detail mistar derajat. Terlalu kecil untuk dipakai, cukup sebagai rujukan saat menggambar ulang bingkai berskala dalam SVG |
| `File:Johannes Hevelius - Prodromus Astronomia - Volume III "Firmamentum Sobiescianum, sive uranographia" - Tavola Emisfero Boreale.jpg` | Public domain | 2239 x 1924 | Hevelius 1690, belahan utara utuh. Plat Hevelius lain di Commons rata-rata hanya sekitar 590 x 480 px |
| `File:Atlas Coelestis by John Flamsteed (1729) 036.jpg` | Public domain | 5555 x 7304 | Flamsteed 1729, pindaian besar (sumber raremaps.com). Pembanding gaya gravir abad ke-18 |

### 5.2 Pesan antarbintang: cara mendekode sinyal (Layer 1)

| Berkas | Lisensi | Asli | Kegunaan |
|---|---|---|---|
| `File:The Sounds of Earth Record Cover - GPN-2000-001978.jpg` | Public domain (NASA/JPL, 1977) | 2215 x 2215 | Sampul Voyager Golden Record: diagram pembacaan piringan, pulsar, transisi hidrogen. Pembuka tahap Layer Fisik |
| `File:Voyager Golden Record Cover Explanation.svg` | Public domain (templat `PD-self`; dikreditkan ke NASA JPL) | SVG 768 x 600 | Penjelasan tiap simbol sampul. Pola anotasi untuk diagram "baca sinyal ini" |
| `File:The Sounds of Earth - GPN-2000-001976.jpg` | Public domain | 2389 x 2388 | Piringan emasnya sendiri |
| `File:Pioneer plaque.svg` | Public domain (vektor Oona Räisänen dari citra NASA) | SVG 3063 x 2427 | Peta pulsar dan satuan panjang dari hidrogen. Contoh nyata "alamat" dan "satuan" yang dikodekan biner |
| `File:Pioneer10-plaque.jpg` | Public domain (NASA Ames, 1972) | 2891 x 2290 | Foto plakat aslinya |
| `File:Arecibo message.svg` | CC BY-SA 3.0 (Arne Nordmann) | SVG 512 x 1536 | 1.679 bit = 23 x 73, dua bilangan prima. Contoh framing yang sempurna untuk modul biner. ShareAlike: catat di `NOTICE.md` |

### 5.3 Jejak jaringan di Bumi: lampu malam Indonesia

| Berkas atau ID | Lisensi | Asli | Kegunaan |
|---|---|---|---|
| `File:Lights of Java.jpg` | Public domain (`PD-USGov-NASA-AP`, ISS056-E-6994, 9 Juni 2018) | 5011 x 3341 | Foto miring malam hari dari ISS: Jawa, Bali, NTB menyala di tepi Samudra Hindia. Kandidat terkuat untuk hero. Halamannya membawa templat penilaian Wikipedia bahasa Indonesia (2022) |
| `File:East Java NASA Earth Observatory.jpg` | Public domain (`PD-USGov-NASA`) | 3860 x 2573 | Jawa Timur malam hari dari ISS (Ekspedisi 42) |
| `File:Surabaya-iss.jpg` | Public domain | 1344 x 1260 | Surabaya dan Madura malam hari. Kecil, cukup untuk ubin |
| `File:ISS026-E-24898 - View of Java.jpg` | Public domain (JSC Gateway to Astronaut Photography) | 4256 x 2913 | Cadangan foto Jawa dari ISS |
| `File:BlackMarble20161km.jpg` | Public domain (NASA Earth Observatory) | 43200 x 21600 (279 MB) | Komposit lampu malam 2016, proyeksi equirectangular 120 px per derajat. Potongan Indonesia 95-141 BT, 6 LU-11 LS = kotak piksel (33000, 10080) sampai (38520, 12120), 5520 x 2040 px |
| `File:Black Marble - Asia and Australia (8246893143).jpg` | Public domain (NASA Goddard) | 8192 x 8192 | Komposit 2012 Asia dan Australia; lebih ringan daripada berkas global |
| `File:City Lights of Asia and Middle East 2016.png` | Public domain | 4960 x 4000 | Komposit 2016 kawasan Asia |
| `File:Power Blackout on Java in Indonesia (CIRA 2019-08-04 - 201907061756 n20-snpp viirs dnb javablackout nolabels0).png` dan `File:Power Blackout on Java in Indonesia (CIRA 2019-08-04 - 201908041806 n20-snpp viirs dnb javablackout nolabels0).png` | Public domain (CSU/CIRA dan NOAA/NESDIS) | 1920 x 1080 | Pasangan sebelum dan saat padam listrik Jawa, 4 Agustus 2019. Bahan nyata untuk modul redundansi dan titik gagal tunggal |
| NASA Image Library `iss030e015896` | Foto kru ISS (JSC); berlaku pedoman media NASA di atas | 4256 x 2832 | Jakarta malam hari dalam inframerah, 25 Desember 2011 |
| NASA Image Library `iss047e001114` | Foto kru ISS (JSC, Tim Kopra); pedoman media NASA | 4928 x 3280 | Tepi Bumi berbintang di antara Indonesia dan Australia, 2 Maret 2016 |
| NASA GIBS, lapisan WMS `VIIRS_Black_Marble` | "NASA promotes full and open sharing of data", dengan kalimat pengakuan yang diminta (lihat bawah) | bebas pilih | Diuji: `REQUEST=GetMap&LAYERS=VIIRS_Black_Marble&CRS=EPSG:4326&BBOX=-11.5,94.5,6.5,141.5&TIME=2016-01-01` mengembalikan JPEG. Cara paling ringan mendapat potongan Indonesia sekali saja saat menyiapkan aset, lalu disimpan lokal |

Kalimat pengakuan GIBS yang diminta dokumentasinya
(<https://nasa-gibs.github.io/gibs-api-docs/>): "We acknowledge the use of imagery
provided by services from NASA's Global Imagery Browse Services (GIBS), part of NASA's
Earth Science Data and Information System (ESDIS)."

### 5.4 Ruang kendali dan stasiun bumi (metafora NOC)

| Berkas | Lisensi | Asli | Kegunaan |
|---|---|---|---|
| `File:Mission Operations Control Room during Apollo 13.jpg` | Public domain | 2954 x 2172 | Ruang kendali Houston, 13 April 1970. Latar tahap Monitoring dan Troubleshooting |
| `File:Mission Operations Control Room at the conclusion of Apollo 11.jpg` | Public domain | 4656 x 3085 | Pandangan menyeluruh ruang kendali di akhir misi Apollo 11, 24 Juli 1969 |
| `File:Overall view of Mission Control on first day of Apollo 7 space mission (S68-49301).jpg` | Public domain | 4068 x 2682 | Pandangan menyeluruh ruang kendali pada hari pertama Apollo 7, 11 Oktober 1968 |
| `File:Mission Control Center (MCC) - Apollo 8 (S68-56007).jpg` | Public domain | 3991 x 2596 | Cadangan, dengan layar televisi menyala |
| `File:Eidophor display Mission Control Center Houston.jpg` | Public domain (S69-39815) | 5173 x 8110 | Tegak; layar proyeksi besar. Untuk panel samping |
| `File:Canberra Deep Dish Communications Complex - GPN-2000-000502.jpg` | Public domain | 2526 x 2394 | Antena 70 m Deep Space Network di Canberra |
| `File:DSS43 is a 70-meter-wide (230-feet-wide) radio antenna at the Deep Space Network's Canberra facility in Australia.jpg` | Public domain | 1600 x 900 | Satu-satunya antena yang bisa mengirim perintah ke Voyager 2 (keterangan berkasnya) |
| `File:Echo Station Control Room - April 1962 echo station.jpg` | Public domain | 2000 x 1605 | Ruang kendali stasiun DSS-12 Goldstone, 1962 |
| `File:Horn Antenna-in Holmdel, New Jersey.jpeg` | Public domain (NASA, Juni 1962) | 2793 x 2197 | Antena tanduk Bell Labs, dibangun untuk Echo I; antena tempat derau latar kosmik ditemukan. Cerita derau dan SNR untuk Layer 1. Foto 2012 `File:Holmdel Horn Antenna.jpg` berlisensi CC BY-SA 3.0, jadi pakai yang 1962 |

### 5.5 Satelit dan teleskop

| Berkas | Lisensi | Asli | Kegunaan |
|---|---|---|---|
| `File:STS-7 Palapa-B1 deploy.jpg` | Public domain (S83-35764) | 4144 x 4151 | Satelit komunikasi Indonesia Palapa B1 lepas dari Challenger, 19 Juni 1983. Satu-satunya satelit di daftar ini yang langsung terkait pembelajar Indonesia |
| `File:41B-33-1415 - STS-41B - View of the Palapa-B2 Indonesian satellite after deploy - DPLA - 0b3601c938022e10368bc7d2d7bcacad.jpg` | Public domain (NARA) | 5700 x 5900 | Palapa B2 sesudah dilepas dari Challenger (STS-41B), 6 Februari 1984 |
| `File:STS-41-B Palapa B-2 deployment.jpg` | Public domain | 2020 x 2020 | Cadangan Palapa B2 |
| `File:Echo - A Passive Communications Satellite - GPN-2002-000122.jpg` | Public domain | 1800 x 1366 | Echo 1 (1960), satelit komunikasi pasif berbentuk balon |
| `File:AT&T Telstar test.jpg` | Public domain (Library of Congress) | 3904 x 3158 | Foto monitor saat uji pertama Telstar 1, 11 Juli 1962 |
| `File:TDRS gen1.jpg` | Public domain | 3000 x 2220 | Ilustrasi TDRS-C, satelit relai data. Metafora router di orbit |
| `File:HST-SM4.jpeg` | Public domain | 2022 x 1518 | Hubble sesudah Servicing Mission 4, 2009 |
| `File:Arecibo Observatory Aerial View.jpg` | CC BY 4.0 (H. Schweiker/WIYN dan NOAO/AURA/NSF) | 757 x 600 | Teleskop Arecibo dari udara. Kecil; hanya untuk ubin |

### 5.6 Peta jaringan yang memang terlihat seperti rasi

| Berkas | Lisensi | Asli | Kegunaan |
|---|---|---|---|
| `File:Arpanet logical map, march 1977.png` | Public domain (`PD-US-no notice`) | 1000 x 716 | Peta logis ARPANET 1977: simpul dan garis, persis bahasa rasi. Gambar ulang sebagai SVG, jangan perbesar rasternya |
| `File:ARPA Network, Logical Map, September 1973.jpg` | Public domain (BBN) | 800 x 586 | Termasuk tautan satelit ke Hawaii dan London |
| `File:Arpanet-geographic-map-may-1977-diagram.png` | Public domain (DARPA) | 1000 x 700 | Versi geografis |
| `File:A History of the ARPANET, The First Decade, BBN Report 4799, April 1981.pdf` | Public domain | PDF | Sumber diagram asli bila perlu digambar ulang |
| `File:Internet map 1024.jpg` | CC BY 2.5 (The Opte Project) | 1280 x 1280 | Data sungguhan yang tampak seperti nebula. Sudah sangat sering dipakai artikel, jadi pakai paling banyak satu kali |

### 5.7 Peta kabel laut: lisensinya diperiksa satu per satu

| Sumber | Lisensi yang tertulis | Keputusan |
|---|---|---|
| `File:1887 Submarine cable chart of the world, showing also the seacoast stations and the principal connecting land lines; for the use of the navy and mercantile marine, from the Digital Commonwealth - commonwealth 1257b816x.jpg` | Public domain (US Hydrographic Office) | Pakai. 6496 x 4062 (33,7 MB) |
| `File:Submarine cables of the world, 1896.jpg` | Public domain (US Navy, Bureau of Navigation) | Pakai. 4961 x 3010 |
| `File:Cable map of the world - btv1b53065000s.jpg` | Public domain (BnF; War Office, London, 1911-1921) | Pakai. 12184 x 7864 |
| `File:World map of submarine cables.png` | Public domain (Rarelibra, 2007) | Boleh, tetapi datanya sudah usang |
| `File:Submarine cable map umap.png` | CC BY-SA 2.0 untuk peta OSM; data kabelnya dari Greg Mahlknecht berlisensi GPLv3 | Hindari: dua lisensi bercampur |
| `File:Palapa Ring Project.png` | Ditandai `PD-IDGov` | Hindari menyalin. Templat itu bersandar pada Pasal 43 UU 28/2014, yang menyatakan perbuatan tertentu "tidak dianggap pelanggaran" dengan pengecualian bila dinyatakan dilindungi; itu bukan pelepasan hak cipta. Gambar ulang rutenya sendiri |
| TeleGeography Submarine Cable Map | Halaman sitasinya (<https://www2.telegeography.com/cite-telegeography-map>) menulis: "Any reference to a TeleGeography map, URL, or any related screen capture is made available under the Creative Commons License: Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)". Halaman yang sama: "Access to the underlying databases remains restricted to paying subscribers" dan "TeleGeography's interactive cable map is not an embeddable resource" | Jangan dipakai. Yang bebas hanya tangkapan layar, bukan datanya; tangkapan layar ikut membawa ubin peta dasar pihak lain yang tidak bisa mereka lisensikan; ShareAlike menular ke aset turunan. Catatan: ini lebih longgar daripada dugaan "sama sekali tidak bebas", tetapi tetap tidak layak untuk aplikasi ini |
| Natural Earth | <https://www.naturalearthdata.com/about/terms-of-use/>: "All versions of Natural Earth raster + vector map data found on this website are in the public domain." dan "Crediting the authors is unnecessary." | Pakai sebagai peta dasar. Kabel dan titik pendaratan digambar tangan di atasnya sebagai skema, bukan peta presisi |

Rekomendasi pemakaian: plat gravir (5.1, 5.7) dan peta ARPANET (5.6) digambar ulang atau
diolah menjadi garis tunggal berwarna token, bukan ditempel sebagai pindaian kertas tua. Foto
(5.3-5.5) dipakai utuh dengan kredit, satu foto per layar.

## 6. Kritik arah "Observatorium Jaringan" dan arah final

Bagian ini menilai dua hal: arahnya sebagai gagasan, dan keadaan aplikasi sesudah dua
commit terakhir (`7ac5155` planisfer, kursor bidik, lencana, layar Misi; `b77c48a`
pencabutan grain, kaca, panah tombol, eyebrow, radius seragam, huruf Archivo). Bahan
penilaian: tangkapan `v6-dasbor-dark-1440.png`, `v7-dasbor-light-1440.png`,
`v7-misi-light-1440.png`, `v7-modul-light-1440.png`, serta `styles/langit.css`,
`components/Planisfer.tsx`, `components/Kursor.tsx`, dan `index.css` di pohon kerja.

### 6.1 Di mana arah observatorium bisa jatuh jadi klise

Arahnya kuat karena tumpang tindihnya nyata, bukan tempelan: jaringan dan astronomi
berbagi sinyal, antena, latensi cahaya, satelit (Palapa, TDRS), pengodean (sampul Voyager,
plakat Pioneer, pesan Arecibo adalah soal Layer 1), dan peta simpul (peta ARPANET 1977
memang tampak seperti rasi). Risikonya:

1. Latar bintang acak yang berkelip. Itu derau, bukan informasi, dan ciri halaman
   "luar angkasa" buatan AI.
2. Bola Bumi malam penuh sebagai pembuka. Sudah disindir sejak 2023 (bagian 4, butir 7)
   dan dipakai kampanye SKF (bagian 2.1).
3. Garis rasi yang menghubungkan titik sembarang. Itu efek jaring "plexus" yang dulu ada
   di ragam `mesh` sampul. Garis hanya sah bila mewakili data (prasyarat, urutan).
4. Biru tengah malam dengan emas. "Midnight blue and gold leaf" adalah deskripsi situs
   undangan pernikahan "Written in the Stars" (Awwwards, Nominee 15 September 2026). Roda
   24 sektor bernomor di tepinya juga mudah terbaca sebagai roda zodiak atau jam.
5. Kertas krem, judul serif, aksen tembaga. Atlas antik dalam palet ini jatuh tepat di
   gugus (a) Anthropic (`#F4F1EA`, `#D97757`).
6. HUD neon atau terminal hijau: klise fiksi ilmiah dan "hacker".
7. Metafora yang menggantikan kata biasa. "Rasi" di peta itu indah; "Rasi Keamanan" di
   remah roti dan "Lihat rasi Fondasi" di tombol memaksa pembelajar menerjemahkan dulu.
   Metafora untuk gambar, kata biasa untuk kontrol.

### 6.2 Kritik keadaan sekarang, urut prioritas

Yang sudah benar dan perlu dijaga: planisfer adalah data (139 modul, 25 tahap, besar
bintang mengikuti panjang modul); bintang bisa dijelajah dengan tombol panah lewat
`tabIndex` bergulir dan kartu `aria-live`; kursor sistem tidak disembunyikan kecuali di
atas peta, tempat lensa menggantikannya; grain, kaca, panah di tombol utama, dan radius
seragam sudah dicabut; label rasi bergaya italik atlas lolos kontras (8,48:1 terang, 9,54:1 gelap).

Yang masih terasa templat atau buatan AI:

| Prio | Masalah dan buktinya | Perbaikan konkret |
|---|---|---|
| P1 | Susunan hero masih resep `gpt-taste` "Editorial Split": teks kiri, gambar kanan, H1 tiga baris, subjudul berisi angka, satu tombol aksen ditambah satu tautan bergaris bawah. H1 "Setiap modul adalah satu bintang di peta ini." menjelaskan metaforanya, tanda bahwa gambarnya belum bercerita sendiri | Jadikan peta itu halamannya: planisfer selebar layar, teks pindah ke kartus (kotak judul) di sudut seperti plat Cellarius. Judul diganti keadaan pembelajar ("Berikutnya: 03.3 VLAN", peta sudah diperbesar ke sana). Satu tindakan saja; klik bintang sudah menjadi tindakan kedua |
| P1 | Di bawah planisfer, Dasbor masih memuat tiga komponen resep `gpt-taste`: kalimat yang menyala per kata (`.scrub-text` dengan SplitText), tumpukan kartu cara belajar (`.tumpuk-kartu`), dan `CarouselReview` | Hapus ketiganya. Ganti dengan satu bagian yang lahir dari subjek: "Bumi di bawah" (6.8, momen 3) atau daftar kartu jatuh tempo yang ditaruh sebagai bintang redup di peta |
| P1 | Krom templat yang tersisa: baris tanggal monospace di atas H1 ("Sabtu, 17 Oktober 2026, 19.48 WITA"), baris hitungan monospace di atas judul Misi ("23 laporan gangguan, 0 sudah Anda pecahkan"), nomor modul monospace (`.pf-label-modul`, `.pf-kartu-no`, "12.1" di atas judul modul), nomor tepi 00-23 monospace (`.pf-jam-no`). Gugus (e) Anthropic: eyebrow di atas judul dan huruf mono untuk label data kecil | Tanggal masuk ke kartus sebagai epoch peta, dan hanya bila langitnya benar-benar dihitung untuk waktu itu (P1 terakhir di tabel ini). Hitungan Misi cukup di tab saringan yang sudah ada ("Semua 23"). Nomor modul memakai angka tabular Archivo (`font-variant-numeric: tabular-nums`) atau angka gaya lama EB Garamond, seperti nomor katalog Flamsteed. Monospace hanya untuk kode dan keluaran perintah |
| P1 | Status bintang tidak terbaca sebagai "menyala". Terang: tuntas = ultramarin `#2a37d4`, belum = tinta `#0b1030`, beda luminans 2,18:1; bintang belum (`rgba(11,16,48,.42)`) hanya 2,71:1 terhadap langit `#edf0f7`, di bawah 3:1 untuk grafik bermakna (WCAG 1.4.11); garis jalur 1,94:1. Gelap: tuntas `#ffe2a8` dan dibaca `#e4e8ff` berbeda luminans 1,04:1; garis jalur 2,45:1 | Kodekan status dengan BENTUK, seperti atlas mengodekan magnitudo dan bintang variabel dengan simbol: lingkar kosong = belum, setengah terisi = dibaca, penuh dengan empat jari pendek = tuntas. Satu warna "lampu" khusus untuk tuntas di kedua tema. Nilai yang sudah dihitung ada di 6.4 |
| P1 | Gerak tanpa henti: `.pf-halo` berkelip `pfKerlip 4.5s infinite` di setiap bintang tuntas, `.pf-tuju` berdenyut `pfDenyut 2.4s infinite`. WCAG 2.2.2: gerak yang "starts automatically, lasts more than five seconds, and is presented in parallel with other content" wajib bisa dihentikan; aturan `prefers-reduced-motion` global hanya menolong yang sudah menyetel OS. Makin banyak modul tuntas, makin banyak kelip: latar bintang berkelip masuk lewat pintu belakang | Tidak ada loop tak berujung. Satu kali "penyalaan" ketika modul tuntas (6.8, momen 1), lalu diam. Sasaran berikutnya ditandai cincin diam dan label "Anda di sini". Tambahkan sakelar Gerak di menu profil, seperti "Motion on" di The Shape of Intelligence |
| P1 | Bintang latar `.pf-latar` diletakkan acak: hiasan, bukan langit | Ganti dengan langit sungguhan: HYG Database (`astronexus/HYG-Database`, berkas LICENSE: CC BY-SA 4.0), bintang sampai magnitudo sekitar 5, diproyeksikan untuk jam laptop di lintang Indonesia. Simpan di JSON sendiri supaya ShareAlike tidak menular (pola `ciu.json`) dan catat di `NOTICE.md`. Kalau tidak sempat, hapus bintang latar; langit kosong lebih jujur daripada langit palsu |
| P2 | Misi: kisi dua kolom kartu identik, tiap kartu membawa lencana bundar dengan teks melingkar kecil ("DUPLEX MISMATCH CABANG", "MISI 01") yang tidak terbaca pada ukuran sekitar 80 px. Gugus (d): kartu kit SaaS, plus ornamen berulang | Ubah menjadi buku log gangguan: kota, waktu laporan, gejala, jenjang, status. Lencana hanya muncul SESUDAH misi dipecahkan, besar, di halaman misinya. Kepala halaman Misi = peta Indonesia malam (6.8, momen 3); kota misi menyala saat dipecahkan |
| P2 | Empat keluarga huruf: Archivo (UI, judul), EB Garamond (label atlas), JetBrains Mono (angka), Atkinson (prosa). Frontend-design Anthropic: "use one family or two" | Archivo dan Atkinson untuk semua yang dibaca dan diklik; EB Garamond hanya di dalam peta dan plat; JetBrains Mono hanya untuk kode |
| P2 | Pil navigasi melayang di tengah, kini bergaris ganda: siluetnya masih navigasi wajib `gpt-taste` | Pil tetap (keputusan pemilik dan invarian Fase 4), tetapi satu garis tepi saja, tanpa cincin luar, dan rata dengan kisi konten |
| P2 | Kursor bidik: lerp tetap `k = 0.24` per frame (lebih cepat di layar 120 Hz), `width`/`height` ditulis setiap frame (memicu tata letak), `getBoundingClientRect()` di setiap `pointermove`; `mix-blend-mode: difference` di atas tombol ultramarin menghasilkan cincin kekuningan | Rincian di bagian 3.3 |
| P3 | Foto asli hilang dari layar utama, padahal modul baru `materi/11-wan-vpn/04-satelit-antarplanet.md` sedang ditulis | Pasang foto dari bagian 5 di tempat yang membawa informasi: antena DSN Canberra dan Palapa B1 di modul satelit, ruang kendali Apollo 13 di tahap Monitoring, sampul Voyager di tahap Layer Fisik |

### 6.3 Arah final: "Langit di atas, Bumi di bawah"

Judulnya diambil dari satu plat yang ada di bagian 5.1:
`File:Hæmisphærium stellatum boreale cum subiecto haemisphaerio terrestri - btv1b101003828.jpg`,
langit utara di atas belahan Bumi. Aplikasi ini punya dua peta yang menyala dari data
yang sama:

- Langit = kurikulum. Planisfer yang sudah ada: tahap sebagai rasi, modul sebagai
  bintang bernomor katalog, prasyarat sebagai garis.
- Bumi = jaringan nyata Indonesia. Lampu malam (Black Marble, foto ISS Jawa), titik
  pendaratan kabel, kota-kota Misi, satelit Palapa.
- Menuntaskan modul menyalakan bintangnya; memecahkan misi menyalakan kotanya. Itulah
  "interkoneksi antar desain" yang diminta pemilik: satu dunia, dua permukaan, satu
  sumber data progres.

Bahasa visualnya: gravir garis tunggal dalam satu tinta, angka katalog, anotasi gaya
sampul Voyager (garis penunjuk tipis dan label kecil yang menjelaskan cara membaca
gambar), dan foto arsip berkredit. Yang sengaja tidak dipakai: bintang acak, cahaya
pendar, gradien, emas foil, kertas krem, figur mitologi rasi berukuran penuh.

### 6.4 Palet: token yang diusulkan dan kontrasnya

Dihitung dengan rumus luminans WCAG 2.x; warna ber-alfa dikomposisikan dulu di atas
latarnya, sama seperti `tests/kontras.test.mjs`.

| Token | Terang | Rasio | Gelap | Rasio |
|---|---|---|---|---|
| `--bg` | `#f3f4f8` (tetap) | teks 16,7+ (sudah dites) | `#0c1532` (dari `#070a18`) | teks `#e9ecf8` 15,24; muted `#a9b0d0` 8,39; faint `#8d95bb` 6,12; primary `#8f9cff` 7,16 |
| `--pf-langit` | `#edf0f7` (tetap) | | `#0f1a3c` | label `#aeb6e0` 8,57; bintang `#e4e8ff` 14,02 |
| `--pf-bintang-redup` (belum) | `rgba(11,16,48,.6)` = `#656a80` | 4,70 (dari 2,71) | `rgba(228,232,255,.6)` | 5,79 |
| `--pf-jalur` | `rgba(42,55,212,.7)` | 3,79 (dari 1,94) | `rgba(143,156,255,.65)` | 3,64 (dari 2,45) |
| `--pf-lampu` (baru, khusus tuntas) | `#a14f07` | 5,06 di langit, 5,77 di putih, 3,22 terhadap tinta `#0b1030` | `#f6b54a` | 9,43 di langit; terhadap bintang `#e4e8ff` hanya 1,49, jadi pembeda statusnya bentuk |
| `--on-primary` di `--primary` | `#ffffff` di `#2a37d4` | 8,09 (tetap) | `#0a0b14` di `#8f9cff` | 7,81 (tetap) |

Alasan latar gelap `#0c1532`: L* sekitar 7,6, kelihatan biru tinta, bukan hitam bertinta
(`#070a18`, L* sekitar 3,0, termasuk gugus "tinted near-black" Anthropic). Alasan warna
lampu: warna lampu natrium yang memang tampak oranye di foto Black Marble dan "Lights of
Java", jadi "menyala" berarti hal yang sama di langit dan di Bumi. Mengubah token berarti
`tests/kontras.test.mjs` harus ikut diperbarui dan tetap hijau.

### 6.5 Huruf

Archivo bersumbu lebar tidak ada di daftar konvergen Anthropic dan boleh tetap untuk
judul dan UI. Atkinson Hyperlegible Next tetap untuk prosa (pilihan pemilik). EB Garamond
italik hanya di dalam peta dan plat, sesuai kebiasaan atlas yang menulis nama dengan
italik. JetBrains Mono hanya untuk kode. Jangan menambah keluarga baru. Satu catatan
untuk nanti saja: B612 (OFL, tersedia di Fontsource dengan bobot 400 dan 700, hanya
subset latin) dirancang Airbus bersama ENAC dan Intactile untuk layar kokpit, dan
namanya merujuk asteroid sang aviator Saint-Exupéry (README `polarsys/b612`). Cocok
untuk satu panel instrumen di halaman Alat bila suatu hari JetBrains Mono di sana
diganti, bukan sebagai keluarga kelima.

### 6.6 Sistem ornamen: lima unsur, tidak lebih

1. Kisi derajat dan skala bertik di tepi peta dan plat (rujukan: mistar derajat
   Uranometria, bagian 5.1). Di luar peta hanya sebagai pemisah tipis di kepala modul.
2. Gravir garis tunggal satu tinta, digambar ulang sebagai SVG dari plat domain publik;
   arsiran menggantikan gradien.
3. Angka katalog: nomor modul ("05.2") adalah penamaan bintangnya, dipakai sama di peta,
   remah roti, dan kartu.
4. Anotasi dekode bergaya sampul Voyager untuk diagram header, frame, dan sinyal.
5. Satu foto arsip berkredit per layar, dengan baris kredit di keterangannya.

Bukan ornamen dan tidak dipakai: bintang acak, pendar, gradien, grain, lencana di setiap
kartu, teks melingkar kecil.

### 6.7 Kursor dan transisi

Kursor: pertahankan kursor sistem dan bidikan yang mengunci sasaran; `cursor: none` hanya
di atas peta, tempat lensa mengambil alih (pola Oryzo dan Grids, bagian 2.3). Perbaikan
teknisnya di 3.3. Transisi halaman: View Transitions API dengan satu elemen bersama, yaitu
bintang modul yang diklik di dasbor berpindah menjadi bintang di kepala halaman modul. Di
HashRouter, bungkus navigasi dengan `document.startViewTransition` bila tersedia; tanpa
dukungan atau dengan gerak dikurangi, navigasi langsung tanpa animasi. Skill
`react-view-transitions` milik Vercel (bagian 7) membahas komponen `<ViewTransition>`
React. Hover tetap "menyala seketika, padam 150 ms".

### 6.8 Lima momen "wow" yang layak dibangun

| Urutan | Momen | Isi | Biaya dan risiko |
|---|---|---|---|
| 1 | Bintang menyala saat modul tuntas | Sekali jalan: cincin mengembang satu kali, bintang berubah bentuk menjadi "tuntas" dengan warna lampu, garis ke bintang berikutnya digambar masuk lewat GSAP (`gsap.from` dashoffset, `clearProps`), penanda "Anda di sini" pindah. Gerak dikurangi = keadaan akhir langsung | Kecil. Semua bagiannya sudah ada di planisfer; paling dekat dengan janji "progres menyalakan langit" |
| 2 | Langit sungguhan malam ini | Bintang latar dari HYG (CC BY-SA 4.0) di posisi nyata untuk jam laptop dan lintang sekitar 6 LS; rasi kurikulum dilapis di atasnya; kartus menulis epochnya. Sepenuhnya luring | Sedang: penyiapan data dan rumus waktu sideris. Lisensi ShareAlike di berkas sendiri |
| 3 | Bumi di bawah | Kepala halaman Misi berupa Indonesia malam hari (potongan `VIIRS_Black_Marble` dari GIBS, disimpan lokal, dengan kalimat pengakuan GIBS); kota-kota misi (yang terlihat di layar Misi: Medan, Yogyakarta, Makassar, Bandung, Surabaya, Pontianak) sebagai titik; misi terpecahkan menyalakan kotanya | Sedang. Proyeksi equirectangular membuat penempatan kota cukup dengan lintang dan bujur |
| 4 | Satu bintang, dua tempat | View Transition: bintang yang diklik di dasbor menjadi bintang di kepala modul, dan kembali saat pulang | Rendah sampai sedang; risikonya integrasi dengan HashRouter dan React 19 |
| 5 | Piringan dekode Layer 1 | Di tahap Fondasi dan Layer Fisik: sampul Voyager dan pesan Arecibo sebagai latihan. Pembelajar menyusun 1.679 bit menjadi 23 x 73 (keduanya prima) dan melihat gambarnya muncul; framing dan encoding dipahami dengan tangan | Sedang; lebih banyak kerja materi daripada kode. SVG Arecibo yang ada berlisensi CC BY-SA 3.0, atau gambar sendiri dari deret bitnya |

## 7. Skill dan plugin Claude Code untuk desain dan animasi

Tidak ada yang dipasang. Data repo dibaca dari API GitHub (`/repos/{repo}` untuk lisensi,
bintang, dan tanggal dorongan terakhir; `/git/trees` untuk melihat apakah ada skrip, hook,
atau paket). Daftar awalnya dari direktori "Design Agent Skills" di Recent
(<https://recent.design/skills>), penerus Godly; angka pasang di sana tampak dihitung per
repo, jadi dipakai sebagai petunjuk popularitas saja.

| Skill atau plugin | Penerbit | Gunanya untuk proyek ini | Yang dieksekusi | Lisensi, bintang, dorongan terakhir | Risiko | Luring |
|---|---|---|---|---|---|---|
| `greensock/gsap-skills` <https://github.com/greensock/gsap-skills> | GreenSock, resmi | Delapan skill: `gsap-core`, `gsap-react` ("useGSAP hook, refs, gsap.context(), cleanup"), `gsap-performance` ("prefer transforms, avoid layout thrashing"), `gsap-scrolltrigger`, `gsap-timeline`, `gsap-plugins`, `gsap-utils`, `gsap-frameworks`. Cocok dengan `lib/motion.ts` | Markdown dan contoh; ada `.claude-plugin/plugin.json` untuk dipasang sebagai plugin | MIT; 16.522; 29 Jul 2026 | Rendah. Contohnya menyarankan `npm install gsap`, yang sudah terpasang | Ya, setelah tersalin |
| `emilkowalski/skills` <https://github.com/emilkowalski/skills> | Emil Kowalski (perorangan) | `animation-performance`, `review-animations` ("Default to flagging; approval is earned"), `animation-vocabulary`, `apple-design`, `improve-animations`, `find-animation-opportunities`. Untuk meninjau gerak planisfer dan kursor | Hanya Markdown | MIT; 46.825; 11 Okt 2026 | Rendah | Ya |
| `jakubkrehel/oklch-skill` <https://github.com/jakubkrehel/oklch-skill> | Jakub Krehel (perorangan) | Menyusun palet di OKLCH supaya terang dan gelap seimbang secara persepsi. Berguna saat token 6.4 diterapkan | Hanya Markdown | MIT; 267; 7 Okt 2026 | Rendah | Ya |
| `jakubkrehel/make-interfaces-feel-better` <https://github.com/jakubkrehel/make-interfaces-feel-better> | Jakub Krehel | Detail jarak, bayangan, target klik, pembungkusan teks. Versi dengan nama yang sama sudah ada di daftar skill lokal (`ecc:make-interfaces-feel-better`) | Hanya Markdown | MIT; 3.693; 29 Agu 2026 | Rendah | Ya |
| `vercel-labs/agent-skills` <https://github.com/vercel-labs/agent-skills> | Vercel, resmi | `react-view-transitions`: "Guide for implementing smooth, native-feeling animations using React's View Transition API". Untuk momen 4 di 6.8. `web-design-guidelines` untuk audit UI | `web-design-guidelines` menyuruh agen "Fetch fresh guidelines before each review" dari `raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md` lewat WebFetch | Tanpa lisensi tingkat repo di API; 32.548; 14 Okt 2026 | `react-view-transitions` rendah. `web-design-guidelines` sedang: aturannya berubah di luar kendali kita dan teks jarak jauh itu dibaca sebagai instruksi | `react-view-transitions` ya; `web-design-guidelines` tidak |
| `anthropics/skills` (`frontend-design`, `canvas-design`) <https://github.com/anthropics/skills> | Anthropic, resmi | `frontend-design` versi `41bbe19d` (3 Sep 2026) berisi kalibrasi lima gugus desain AI di bagian 4.1; pakai sebagai daftar periksa. Salinan plugin lokal (`claude-plugins-official/plugins/frontend-design`) identik dengan versi itu (`diff` kosong); salinan di `~/.claude/skills/frontend-design/` berbeda teksnya dan tidak memuat kalibrasi gugus | Markdown; `canvas-design` membawa folder huruf | Apache-2.0 per skill (`LICENSE.txt`); repo 181.685; 9 Okt 2026 | Rendah | Ya |
| `ibelick/ui-skills` <https://github.com/ibelick/ui-skills> | Akun ibelick (perorangan) | `fixing-motion-performance` ("layout thrashing, compositor properties, scroll-linked motion, and blur effects"), `fixing-accessibility`, `baseline-ui` | Skill Markdown; repo juga memuat situs (TS, Astro, `package.json`) yang tidak perlu dijalankan | MIT; 9.819; 17 Okt 2026 | Rendah bila hanya folder skill yang disalin | Ya |
| `pbakaus/impeccable` <https://github.com/pbakaus/impeccable> | Paul Bakaus (perorangan) | Perintah desain lengkap (critique, polish, distill, quieter, audit, animate) | SKILL.md menyuruh menjalankan `scripts/impeccable context`; peluncurnya "runs a self-contained binary that ships next to it or is downloaded once on first run". Repo 4.027 berkas, CLI Rust, hook untuk Codex, Cursor, GitHub, Grok | Apache-2.0; 82.178; 17 Okt 2026 | Tinggi: biner yang diunduh dan dijalankan, plus hook. Hanya setelah sumbernya ditinjau dan versinya dikunci | Sebagian; unduhan pertama butuh internet |
| `nextlevelbuilder/ui-ux-pro-max-skill` <https://github.com/nextlevelbuilder/ui-ux-pro-max-skill> | nextlevelbuilder | Katalog gaya, palet, dan huruf berbasis CSV; sudah terpasang lokal sebagai `ui-ux-pro-max` | 107 skrip Python, `requirements.txt` | MIT; 136.715; 15 Okt 2026 | Sedang: menjalankan Python; katalognya cenderung menghasilkan pilihan "rata-rata" | Ya bila dependensinya sudah ada |
| `Leonxlnx/taste-skill` <https://github.com/Leonxlnx/taste-skill> | Leonxlnx | Sudah terpasang lokal. `gpt-taste` adalah resep yang melahirkan tampilan Fase 4 (bagian 4.1) | Markdown, `install.sh` (membuat symlink), plugin Claude dan Codex | MIT; 98.227; 14 Okt 2026 | Rendah secara keamanan, tinggi secara desain: jangan pakai `gpt-taste` untuk proyek ini | Ya |

Peralatan pemeriksaan visual yang sudah tersedia di sesi ini: MCP Playwright dan MCP Chrome
DevTools. Dua catatan dari pemakaian hari ini: MCP Playwright menulis snapshot dan log
konsol ke `/home/vi/Projects/networking/.playwright-mcp/` (di-gitignore), dan peramban
MCP dipakai bersama oleh semua agen di sesi ini, jadi satu agen yang berpindah halaman
mengganggu agen lain. Untuk tangkapan layar riset, Chrome headless terpisah dengan
`--user-data-dir` sendiri di scratchpad lebih aman.

Lima yang paling berguna dan aman, berurutan: `gsap-skills` (gsap-react, gsap-performance),
`emilkowalski/skills` (review-animations, animation-performance), `react-view-transitions`
dari Vercel, `oklch-skill`, lalu `frontend-design` versi September 2026 sebagai daftar
periksa. Semuanya Markdown, tanpa skrip, dan bekerja luring setelah disalin.

## 8. Metode, batasan, dan yang belum terverifikasi

Cara memeriksa:

- Lisensi gambar: API Wikimedia Commons (`prop=imageinfo`, `iiprop=extmetadata|size|mime`)
  untuk `LicenseShortName`, pembuat, dan ukuran; wikitext halaman berkas untuk templat
  lisensi yang meragukan (`PD-IDGov`, `PD-US-no notice`, `PD-self`, `PD-Art`). Foto NASA
  Image Library lewat `images-api.nasa.gov` dan `metadata.json` asetnya. Pedoman NASA,
  syarat Natural Earth, halaman sitasi TeleGeography, dan dokumentasi GIBS dibaca
  langsung; permintaan WMS GIBS diuji dan mengembalikan JPEG.
- Situs rujukan: halaman Awwwards diunduh dengan curl (penghargaan, tanggal, "Elements",
  teknologi, tautan situs). HTML situsnya, ditambah sampai 14 aset JS dan CSS, diunduh
  lalu dicari kata kuncinya (pustaka, nama huruf `@font-face`, kueri media). Tangkapan
  layar memakai Chrome headless terpisah dengan profil sendiri di scratchpad: 11 dari 18
  situs berhasil; Messenger, Igloo, Portal, Altis, MindMarket, Oryzo, dan The Race to
  Save Space gagal atau kosong karena WebGL.
- Kriteria aksesibilitas dari halaman Understanding W3C untuk WCAG 2.2, kueri media dari
  MDN, `quickTo` dari dokumentasi GSAP, teknik kursor dari dua artikel Codrops.
- Tanda desain AI: blog Claude, riwayat commit `skills/frontend-design/SKILL.md` di
  `anthropics/skills` (tiga versi dibandingkan), tiga artikel NN/g yang kutipannya dicocokkan
  ulang dengan teks halaman, satu satire Substack. API pencarian Hacker News (Algolia) dipakai
  untuk menemukan artikel NN/g dan Substack itu serta jumlah poinnya.
- Skill: API GitHub dan direktori Recent. Tidak ada yang dipasang atau dijalankan.
- Kontras: dihitung dengan rumus luminans WCAG 2.x, warna ber-alfa dikomposisikan dulu.

Batasan dan yang belum terverifikasi:

- Kuota WebSearch sesi ini habis di tengah riset, jadi sesudahnya hanya URL yang sudah
  diketahui atau ditemukan lewat API situs yang dibuka. FWA, siteinspire, dan CSS Design
  Awards tidak berhasil dirayapi (alasannya di akhir bagian 2).
- Unggahan Adam Wathan (Tailwind) tentang `bg-indigo-500` yang konon membuat UI buatan AI
  serba ungu tidak berhasil ditemukan sumber aslinya, jadi tidak dikutip.
- Hitungan kata kunci di kode situs adalah petunjuk, bukan bukti pemakaian; contohnya
  `quickTo`, yang bisa saja hanya definisi di dalam GSAP (sudah dikoreksi di bagian 3.1).
- Artikel "How our vibe coded website looks like a designer made it" (Yakko Majuri,
  railcode.dev, 10 Agustus 2026) dirender JavaScript dan isinya tidak terbaca, jadi tidak
  dipakai.
- Lisensi data bintang `d3-celestial` (Hipparcos) tidak diperiksa; HYG Database diperiksa
  dari berkas LICENSE-nya (CC BY-SA 4.0).
- Dua sub-agen yang semula meneliti bagian 3, 4, dan 7 gagal karena koneksi API putus;
  isinya dikerjakan ulang sendiri dari awal.

Temuan sampingan:

- `data/photos.json`, butir `router-soho`: `title` masih `File:Wireless router.jpg`,
  sedangkan `page` menunjuk `File:Mikrotik_RB951Ui-2HnD.jpg`. API mengembalikan berkas yang
  sama (5312 x 2988, Deavmi, CC BY-SA 3.0) untuk kedua judul, jadi kreditnya benar; hanya
  judulnya nama lama.
- Satu kali saya memakai peramban MCP Playwright bersama dan memindahkan tab agen lain dari
  halaman dokumentasi Cisco ke submarinecablemap.com. Tab itu langsung saya kembalikan ke
  URL semula, dan tiga berkas snapshot dan log yang tercipta di `.playwright-mcp/` saya
  hapus. Sesudah itu tidak ada lagi pemakaian peramban bersama.
- Berkas yang saya tulis: laporan ini saja di dalam proyek. Berkas sementara (skrip
  pembantu, HTML unduhan, tangkapan layar, profil Chrome) ada di
  `/tmp/claude-1000/-home-vi-Projects-networking/c9ae8158-fd11-4cd0-a2e1-2d0a4516e151/scratchpad/riset/`
  dan boleh dihapus; tangkapan layar situs rujukan ada di subfolder `shots/`.

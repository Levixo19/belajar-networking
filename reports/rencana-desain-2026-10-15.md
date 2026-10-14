# Rencana desain Fase 4 (2026-10-15)

## Riset: apa yang diambil dari situs lain, dan kenapa

Diamati langsung di browser (gaya terhitung saat runtime, 1440 px), bukan dari
ringkasan:

| Situs | Pengamatan | Yang diambil |
|---|---|---|
| Linear | Tautan nav berbentuk pil (radius 9999 px), transisi warna/latar **0,1 dtk** `cubic-bezier(.25,.46,.45,.94)`; tombol 0,16 dtk; H1 64 px, 2 baris, tracking -0,022em; nav tetap dengan `backdrop-filter: blur(20px)` | Pil, durasi pendek (hover menyala seketika, padam 150 ms), kaca hanya di navigasi |
| Vercel | H1 64 px, 2 baris, tracking **-0,06em**, berat 400 | Judul display besar tapi lebar, maksimal 2-3 baris, tracking negatif |
| Raycast | Latar `#07080a` (hitam bertinta, bukan #000), tombol 36 px radius 8, `transform 0.1s` untuk tekan | Hitam bertinta dingin, umpan balik tekan 100 ms |
| Family, Rauno | (WebFetch hanya memberi ringkasan dangkal) ritme bab lapang, satu gagasan per layar | Dasbor sebagai rangkaian bab |

Yang sengaja TIDAK diambil: cangkang IDE (ditolak pemilik), tiga kartu sama rata,
gradien ungu-biru "AI", latar foto dari layanan luar (aturan tanpa hotlink).

## Arah

Pemilik: "dinamis tapi wah, minimalis tapi keren, nyaman dipandang", menolak
flat/kaku/korporat dan menolak tampilan "full tulisan" yang kosong.

Pembacaan desain: aplikasi belajar untuk satu pelajar di laptop, dengan bahasa
editorial-teknis yang tenang, condong ke Tailwind v4 + token sendiri + GSAP yang
ditahan. Dial: VARIANCE 7, MOTION 6, DENSITY 4.

<design_plan>
1. Undian deterministik (Python sungguhan, benih = len("FASE 4: ROMBAK DESAIN TOTAL UNTUK LAPTOP")*1000 + jumlah ord mod 997 = 40734):
   hero = Cinematic Center | font = Space Grotesk | aksen = Ultramarine Link
   komponen = Infinite Marquee, Inline Typography Images, Feedback Carousel
   gsap = Scrubbing Text Reveals (wajib dari brief) + Card Stacking
   Penyesuaian karena aturan proyek menang: (a) akordeon horizontal tetap ada karena
   diwajibkan brief; (b) "Feedback Carousel" TIDAK berisi testimoni (tidak ada, dan
   testimoni karangan dilarang) melainkan kartu review yang jatuh tempo; (c) latar hero
   memakai foto lokal di app/public/img, bukan picsum; (d) Geist dan Inter dilarang
   pemilik, Cabinet Grotesk dan Satoshi tidak tersedia luring lewat fontsource.
2. AIDA: pil kaca melayang (navigasi) -> hero Cinematic Center (perhatian) -> bento
   kemajuan + tahap (minat) -> kalimat menyala tergulir + tumpukan kartu cara belajar +
   akordeon tahap yang sedang dijalani (keinginan) -> ajakan penutup besar + kaki (aksi).
3. Hero: H1 `max-w-[18ch]` pada `clamp(2.75rem,5.6vw,5.25rem)` di wadah `max-w-6xl`,
   terpusat; diukur 2 baris di 1280/1440/1920. Tanpa cap/stempel, tanpa pil tag, tanpa
   angka di hero. Dua ajakan: satu berlatar aksen, satu tautan teks.
4. Bento: kisi 12 kolom `grid-flow-dense`. Isi: A (span 7 x 2 baris), B (span 5 x 1),
   C (span 5 x 1) = baris 1: 7+5 = 12, baris 2: 7(A lanjutan)+5 = 12. Nol sel kosong.
5. Sapuan label: tidak ada "BAGIAN 01" atau "PERTANYAAN 05". Kontras tombol: teks di
   atas aksen memakai --on-primary (8,09:1 terang, 7,81:1 gelap).
</design_plan>

## Token (diukur, WCAG 2.x)

| Token | Terang | Gelap | Rasio terendah terhadap bg/surface/surface-2 |
|---|---|---|---|
| --text | #0d0f14 | #eceef4 | 14,84 |
| --text-muted | #454b57 | #a3a8b5 | 7,23 |
| --text-faint | #5d6370 | #8a8f9c | 5,28 |
| --primary | #2a37d4 | #8f9cff | 6,86 |
| --on-primary di --primary | #ffffff | #0a0b14 | 7,81 |

Dasar netral dingin (graphite, satu keluarga abu bertinta biru tipis), satu aksen.
Batas kontrol (input, kotak centang) memakai token tersendiri yang >= 3:1; garis
hiasan boleh lebih tipis.

## Aturan bentuk

- Pil untuk tombol dan tautan nav; kartu 16 px; input 10 px.
- Hover: menyala seketika (0 ms masuk), padam 150 ms. Tekan: scale .98, 100 ms.
- Satu layar, satu tindakan utama yang memakai aksen sebagai LATAR.
- Kaca hanya di pil navigasi; permukaan lain pekat.

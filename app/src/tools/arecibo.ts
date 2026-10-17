// Pesan Arecibo, 16 November 1974: deret bitnya dan fungsi murni untuk alat
// "Dekode pesan Arecibo" (Arecibo.tsx). Tidak menyentuh DOM, jadi bisa dites dengan Node.
//
// Teleskop Arecibo memancarkan 1.679 bit pada 2.380 MHz. 1.679 = 23 x 73, dua bilangan prima,
// jadi hanya ada dua persegi panjang yang pas: 23 kolom x 73 baris, atau 73 kolom x 23 baris.
// Yang pertama membentuk gambar.
//
// SUMBER DERET BIT (diperiksa 2026-10-17, dicocokkan petak demi petak; 397 bit bernilai 1):
//  1. Wikipedia bahasa Inggris, "Arecibo message", bagian "Message as binary string". Teks itu
//     mengutip Jim Brau, University of Oregon, "Arecibo Message as (73 by 23)",
//     https://pages.uoregon.edu/jimbrau/astr123/Notes/ch28/73by23.html. Keduanya identik.
//  2. Grafik Cornell News, 12 November 1999, "It's the 25th anniversary of Earth's first (and
//     only) attempt to phone E.T." (news.cornell.edu, berkas decoded.GIF). Berkas yang sama sudah
//     ada di arsip Wayback sejak 7 Oktober 2000, jadi tidak diturunkan dari Wikipedia. Gambar itu
//     dibaca ulang petak demi petak. Ia CERMIN dari susunan di sini, sesuai keterangannya sendiri
//     ("each group read from right to left"). Setelah dicerminkan, 1.679 petaknya sama persis.
//  3. AreciboMessage.svg di situs Arecibo Observatory untuk lomba "New Arecibo Message"
//     (www.naic.edu/challenge/images/, arsip Wayback 2022): sama persis. Ukurannya sama dengan
//     SVG Commons buatan Arne Nordmann (375 x 1125, skala 15), jadi kemungkinan besar turunan
//     berkas itu. Bukti utamanya tetap sumber 1 dan 2, yang garis keturunannya terpisah.
// Isi gambar cocok dengan abstrak makalah aslinya: The Staff at the National Astronomy and
// Ionosphere Center, "The Arecibo Message of November, 1974", Icarus 26 (1975) 462-466,
// doi:10.1016/0019-1035(75)90116-5. tests/arecibo.test.mjs mendekode angka-angka di dalam
// gambar (1 sampai 10, nomor atom, rumus kimia, 4.294.441.822, 14, 4.292.853.750, 2.430) dan
// mencocokkannya dengan nilai yang diterbitkan.
//
// HAK: deret ini data sebuah siaran radio 1974. Kami tidak menemukan lisensi tertulis untuk
// deret bitnya; makalah Icarus 1975 berhak cipta Academic Press. Gambar di alat ini digambar
// sendiri dari deret bit, BUKAN salinan SVG Commons (CC BY-SA 3.0).
//
// ORIENTASI: bit pertama di kiri atas, setiap baris diisi dari kiri ke kanan. Dengan susunan ini
// angka 1 ada di kiri atas, sama seperti di Wikipedia dan situs Arecibo Observatory.

/** 73 baris selebar 23 bit, urut seperti dipancarkan. */
const BARIS_GAMBAR = [
  '00000010101010000000000',
  '00101000001010000000100',
  '10001000100010010110010',
  '10101010101010100100100',
  '00000000000000000000000',
  '00000000000011000000000',
  '00000000001101000000000',
  '00000000001101000000000',
  '00000000010101000000000',
  '00000000011111000000000',
  '00000000000000000000000',
  '11000011100011000011000',
  '10000000000000110010000',
  '11010001100011000011010',
  '11111011111011111011111',
  '00000000000000000000000',
  '00010000000000000000010',
  '00000000000000000000000',
  '00001000000000000000001',
  '11111000000000000011111',
  '00000000000000000000000',
  '11000011000011100011000',
  '10000000100000000010000',
  '11010000110001110011010',
  '11111011111011111011111',
  '00000000000000000000000',
  '00010000001100000000010',
  '00000000001100000000000',
  '00001000001100000000001',
  '11111000001100000011111',
  '00000000001100000000000',
  '00100000000100000000100',
  '00010000001100000001000',
  '00001100001100000010000',
  '00000011000100001100000',
  '00000000001100110000000',
  '00000011000100001100000',
  '00001100001100000010000',
  '00010000001000000001000',
  '00100000001100000000100',
  '01000000001100000000100',
  '01000000000100000001000',
  '00100000001000000010000',
  '00010000000000001100000',
  '00001100000000110000000',
  '00100011101011000000000',
  '00100000001000000000000',
  '00100000111110000000000',
  '00100001011101001011011',
  '00000010011100100111111',
  '10111000011100000110111',
  '00000000010100000111011',
  '00100000010100000111111',
  '00100000010100000110000',
  '00100000110110000000000',
  '00000000000000000000000',
  '00111000001000000000000',
  '00111010100010101010101',
  '00111000000000101010100',
  '00000000000000101000000',
  '00000000111110000000000',
  '00000011111111100000000',
  '00001110000000111000000',
  '00011000000000001100000',
  '00110100000000010110000',
  '01100110000000110011000',
  '01000101000001010001000',
  '01000100100010010001000',
  '00000100010100010000000',
  '00000100001000010000000',
  '00000100000000010000000',
  '00000001001010000000000',
  '01111001111101001111000',
]

/** Seluruh pesan: 1.679 karakter '0' dan '1'. */
export const PESAN = BARIS_GAMBAR.join('')
export const PANJANG = PESAN.length
export const LEBAR_GAMBAR = 23
export const TINGGI_GAMBAR = 73
/** Panjang gelombang sinyal 2.380 MHz dalam cm. Pesan memakainya sebagai satuan panjang. */
export const GELOMBANG_CM = 12.6

/** Faktor prima n dari kecil ke besar, dengan pengulangan: faktorPrima(12) = [2, 2, 3]. */
export function faktorPrima(n: number): number[] {
  if (!Number.isInteger(n) || n < 2) return []
  const hasil: number[] = []
  let sisa = n
  for (let p = 2; p * p <= sisa; p++) while (sisa % p === 0) { hasil.push(p); sisa /= p }
  if (sisa > 1) hasil.push(sisa)
  return hasil
}

/** Semua pembagi n dari kecil ke besar: pembagi(1679) = [1, 23, 73, 1679]. */
export function pembagi(n: number): number[] {
  if (!Number.isInteger(n) || n < 1) return []
  const kecil: number[] = [], besar: number[] = []
  for (let d = 1; d * d <= n; d++) if (n % d === 0) { kecil.push(d); if (d * d !== n) besar.unshift(n / d) }
  return [...kecil, ...besar]
}

export interface Susunan {
  lebar: number
  /** Baris-baris bit. Baris terakhir lebih pendek kalau lebarnya tidak membagi habis. */
  baris: string[]
  /** Banyaknya baris yang terisi penuh. */
  penuh: number
  /** Banyaknya bit di baris terakhir yang tidak penuh. 0 = pas tanpa sisa. */
  sisa: number
}

/** Potong deret bit menjadi baris selebar `lebar`, persis seperti penerima menyusunnya. */
export function susun(bit: string, lebar: number): Susunan {
  const l = Math.max(1, Math.floor(lebar))
  const baris: string[] = []
  for (let i = 0; i < bit.length; i += l) baris.push(bit.slice(i, i + l))
  return { lebar: l, baris, penuh: Math.floor(bit.length / l), sisa: bit.length % l }
}

/** Petak bernilai 1 sebagai potongan mendatar [kolom, baris, panjang]. Satu <path> dari
 *  potongan ini cukup untuk menggambar 1.679 bit, berapa pun lebarnya. */
export function potonganNyala(s: Susunan): [number, number, number][] {
  const out: [number, number, number][] = []
  s.baris.forEach((r, y) => {
    for (let x = 0; x < r.length;) {
      if (r[x] !== '1') { x++; continue }
      let p = 1
      while (r[x + p] === '1') p++
      out.push([x, y, p])
      x += p
    }
  })
  return out
}

/** Apa yang terlihat penerima pada sebuah lebar baris.
 *  gambar: lebar 23. pas: membagi habis tapi bukan 23 (1, 73, 1.679).
 *  ganda: 46, 69, 92, beberapa baris asli berdampingan. miring: 19 sampai 27, hampir.
 *  derau: selain itu. */
export type Hasil = 'gambar' | 'pas' | 'ganda' | 'miring' | 'derau'

export interface Bacaan {
  lebar: number
  /** Semua baris, termasuk baris terakhir yang pendek. */
  baris: number
  penuh: number
  sisa: number
  hasil: Hasil
  /** ganda: banyaknya salinan berdampingan. miring: geser per baris, dalam bit. */
  n: number
}

export function bacaLebar(lebar: number): Bacaan {
  const l = Math.max(1, Math.floor(lebar))
  const penuh = Math.floor(PANJANG / l), sisa = PANJANG % l
  let hasil: Hasil = 'derau', n = 0
  if (l === LEBAR_GAMBAR) hasil = 'gambar'
  else if (sisa === 0) hasil = 'pas'
  else if (l % LEBAR_GAMBAR === 0 && l <= 4 * LEBAR_GAMBAR) { hasil = 'ganda'; n = l / LEBAR_GAMBAR }
  else if (Math.abs(l - LEBAR_GAMBAR) <= 4) { hasil = 'miring'; n = Math.abs(l - LEBAR_GAMBAR) }
  return { lebar: l, baris: penuh + (sisa ? 1 : 0), penuh, sisa, hasil, n }
}

const f = (x: number) => x.toLocaleString('id')

/** Kalimat status. `ringkas` untuk pengumuman pembaca layar, `rinci` untuk yang terlihat. */
export function keterangan(b: Bacaan): { ringkas: string; rinci: string } {
  const pecah = b.sisa ? `${f(b.penuh)} baris penuh, sisa ${f(b.sisa)} bit` : `${f(b.penuh)} baris, tanpa sisa`
  let rinci: string
  switch (b.hasil) {
    case 'gambar':
      rinci = 'Gambar muncul. Lebar 23 adalah lebar yang dipakai pengirim.'
      break
    case 'pas':
      rinci = b.lebar === 1 ? 'Pas tanpa sisa, tapi hanya satu kolom setinggi 1.679 bit. Tidak ada gambar.'
        : b.penuh === 1 ? 'Pas tanpa sisa, tapi hanya satu baris sepanjang 1.679 bit. Tidak ada gambar.'
        : `Pas tanpa sisa: ${f(b.lebar)} kolom × ${f(b.penuh)} baris. Tapi gambarnya tidak terbentuk. Coba faktor yang satu lagi.`
      break
    case 'ganda':
      rinci = `Lebar ini ${b.n} × 23. Tiap baris memuat ${b.n} baris asli, jadi gambarnya muncul ${b.n} kali berdampingan, gepeng.`
      break
    case 'miring':
      rinci = `Hampir. Setiap baris bergeser ${b.n} bit dari seharusnya, jadi polanya miring.`
      break
    default:
      rinci = 'Belum ada gambar. Bitnya tersusun, tapi polanya acak.'
  }
  const inti = b.hasil === 'gambar' ? 'Gambar muncul.' : b.hasil === 'ganda' ? `Gambar muncul ${b.n} kali, gepeng.` : 'Belum ada gambar.'
  return { ringkas: `Lebar ${f(b.lebar)}. ${pecah}. ${inti}`, rinci }
}

/** Deskripsi teks gambar untuk pembaca layar (isi <desc> SVG). */
export function deskripsi(b: Bacaan): string {
  if (b.hasil === 'gambar') return 'Gambar 23 kolom kali 73 baris. Dari atas ke bawah: angka 1 sampai 10; ' +
    'nomor atom hidrogen, karbon, nitrogen, oksigen, dan fosfor; rumus kimia gula, fosfat, dan empat basa DNA; ' +
    'heliks ganda DNA dengan batang angka di tengahnya; sosok manusia, dengan tinggi badan di kirinya dan jumlah ' +
    'penduduk Bumi di kanannya; Tata Surya, dengan Bumi dinaikkan satu petak ke arah sosok manusia; lalu teleskop ' +
    'Arecibo dan angka diameternya.'
  const ukuran = `${f(b.baris)} baris selebar ${f(b.lebar)} bit${b.sisa ? `, baris terakhir hanya ${f(b.sisa)} bit` : ''}.`
  const pola = b.hasil === 'ganda' ? ` Tampak ${b.n} salinan gambar yang gepeng, berdampingan.`
    : b.hasil === 'miring' ? ' Pola bergaris miring, belum membentuk gambar.'
    : ' Pola acak, belum membentuk gambar.'
  return ukuran + pola
}

/** Satu bagian gambar untuk lapisan anotasi bergaya sampul Voyager. Koordinat dalam petak
 *  susunan 23 kolom: kolom 0 di kiri, baris 0 di atas. */
export interface Bagian {
  id: string
  /** Label pendek di samping gambar, dua baris. */
  judul: string
  nilai: string
  /** Penjelasan lengkap untuk daftar di bawah gambar. */
  isi: string
  sisi: 'kiri' | 'kanan'
  /** Petak yang dicakup, inklusif: [kolom awal, baris awal, kolom akhir, baris akhir]. */
  kotak: [number, number, number, number]
  /** Tanpa `titik`: kurung di tepi luar gambar sepanjang baris kotak. Dengan `titik`
   *  [kolom, baris]: garis datar dari petak itu ke tepi sisinya. Garis itu hanya boleh
   *  melewati petak bernilai 0 (dites), supaya tidak menembus gambar. */
  titik?: [number, number]
}

export const BAGIAN: Bagian[] = [
  { id: 'angka', judul: 'Angka', nilai: '1 sampai 10', sisi: 'kiri', kotak: [0, 0, 21, 3],
    isi: 'Cara pesan ini menulis angka: biner, dibaca tegak dari atas ke bawah. Baris paling bawah menandai awal tiap angka. Angka 8, 9, dan 10 butuh kolom kedua.' },
  { id: 'atom', judul: 'Unsur DNA', nilai: 'H, C, N, O, P', sisi: 'kanan', kotak: [9, 5, 13, 9], titik: [13, 7],
    isi: 'Angka 1, 6, 7, 8, dan 15: nomor atom hidrogen, karbon, nitrogen, oksigen, dan fosfor. Kelima unsur ini menyusun DNA.' },
  { id: 'rumus', judul: 'Rumus kimia', nilai: 'gula, fosfat, basa', sisi: 'kiri', kotak: [0, 11, 22, 29],
    isi: 'Dua belas rumus kimia. Tiap rumus berisi lima angka: jumlah atom H, C, N, O, dan P. Isinya gula deoksiribosa, fosfat, dan empat basa DNA: adenin, timin, sitosin, guanin.' },
  { id: 'jumlah', judul: 'Jumlah basa', nilai: '4,29 miliar', sisi: 'kanan', kotak: [10, 26, 11, 42], titik: [11, 27],
    isi: 'Batang tegak di tengah adalah satu angka 32 bit: 4.294.441.822. Itu perkiraan jumlah pasangan basa DNA manusia pada 1974.' },
  { id: 'heliks', judul: 'Heliks DNA', nilai: 'pilin ganda', sisi: 'kiri', kotak: [1, 31, 20, 44],
    isi: 'Dua garis yang berpilin: bentuk heliks ganda DNA.' },
  { id: 'manusia', judul: 'Manusia', nilai: 'sosok pengirim', sisi: 'kanan', kotak: [6, 45, 14, 54], titik: [10, 46],
    isi: 'Sosok manusia. Ia berdiri tepat di atas planet ketiga.' },
  { id: 'tinggi', judul: 'Tinggi', nilai: '14 × 12,6 cm', sisi: 'kiri', kotak: [0, 45, 4, 54],
    isi: 'Garis tegak dan angka 14. Satuannya panjang gelombang sinyal ini, 12,6 cm: 14 × 12,6 cm = 1,76 m.' },
  { id: 'populasi', judul: 'Penduduk', nilai: '4,29 miliar', sisi: 'kanan', kotak: [16, 48, 22, 53],
    isi: 'Angka 4.292.853.750: perkiraan jumlah manusia di Bumi pada 1974.' },
  { id: 'surya', judul: 'Tata Surya', nilai: 'Matahari, 9 planet', sisi: 'kiri', kotak: [2, 56, 22, 59],
    isi: 'Matahari di kiri, lalu sembilan planet. Pada 1974 Pluto masih dihitung planet.' },
  { id: 'bumi', judul: 'Bumi', nilai: 'planet ke-3', sisi: 'kanan', kotak: [10, 56, 10, 56], titik: [10, 56],
    isi: 'Planet ketiga dinaikkan satu petak, ke arah sosok manusia. Dari planet inilah pesan dikirim.' },
  { id: 'teleskop', judul: 'Teleskop', nilai: 'Arecibo', sisi: 'kiri', kotak: [1, 60, 19, 70],
    isi: 'Piringan teleskop Arecibo yang memancarkan pesan ini.' },
  { id: 'diameter', judul: 'Diameter', nilai: '2.430 × 12,6 cm', sisi: 'kanan', kotak: [1, 71, 19, 72], titik: [12, 71],
    isi: 'Angka 2.430. Dikali 12,6 cm hasilnya sekitar 306 m, lebar piringan teleskopnya.' },
]

/** Tinggi (dalam petak) pusat label sebuah bagian: tengah kurungnya, atau baris titiknya. */
export function tinggiLabel(b: Bagian): number {
  return b.titik ? b.titik[1] + 0.5 : (b.kotak[1] + b.kotak[3] + 1) / 2
}

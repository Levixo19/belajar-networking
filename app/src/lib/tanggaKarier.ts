// Tangga Peta Karier: tata letak dan perutean garis, sebagai fungsi murni supaya
// bentuknya bisa dites tanpa browser (tests/tangga.test.mjs) dan diukur ulang dengan
// ukuran teks sungguhan di browser.
//
// BARIS = rumpun, KOLOM = jenjang (pemula, menengah, senior). Versi sebelumnya
// konstelasi elips yang menggambar 184 sisi sekaligus sebagai kurva-Q: ribuan
// persilangan, sisi yang menembus simpul dan label. Aturannya sekarang:
//   * Dalam keadaan diam tidak ada garis. Garis cuma untuk profesi yang dipilih
//     atau disorot, dan cuma garisnya sendiri.
//   * Garis berangkat dari UJUNG LABEL simpul kiri, tegak di BATANG di talang antar
//     kolom, lalu masuk dari kiri simpul kanan. Semua garis dari satu simpul berbagi
//     batang, jadi sepuluh hubungan terbaca sebagai satu pohon.
//   * Garis yang melompat dua kolom (pemula ke senior) TIDAK mendatar setinggi simpul
//     tujuan menembus kolom tengah: di situ bisa ada simpul menengah pada ketinggian
//     yang sama. Ia menyeberang lewat LAJUR di bantalan atas baris tujuan, yang
//     dijamin kosong dari label (lihat BANTALAN).
//   * Tetangga sejenjang tidak digaris; simpulnya diberi lingkar putus-putus.

export const W = 1040
export const KIRI = 214          // kolom label rumpun: muat "telekomunikasi & cloud" dalam dua baris
export const ATAS = 50           // kepala kolom
export const KOLOM = (W - KIRI) / 3
export const LANGKAH = 32        // jarak tegak antar profesi dalam satu sel
export const BANTALAN = 36       // ruang atas+bawah tiap baris; lajur hidup di separuh atasnya
export const BARIS_MIN = 80
export const R_SUDUT = 9
export const JENJANG_KOLOM = { pemula: 0, menengah: 1, senior: 2 } as const
export const UKURAN_LABEL = 14   // satuan viewBox; tampil ±11 px di 1280 dan ±13 px di 1440
const LEBAR_HURUF = 7.9          // perkiraan rata-rata lebar huruf pada UKURAN_LABEL, sebelum diukur

export interface Titik { x: number; y: number; kolom: number; R: number; baris: number }
export interface Baris { id: string; label: string; y: number; tinggi: number }
interface ProfesiMin { id: string; rumpun: string; jenjang: keyof typeof JENJANG_KOLOM }

export const xSimpul = (kolom: number) => KIRI + kolom * KOLOM + 26
/** Batas kanan kolom = garis tempat talang berada. */
export const xBatas = (kolom: number) => KIRI + (kolom + 1) * KOLOM
// R+13, bukan R+10: lingkar sejajar (R+9, putus-putus) menyentuh huruf pertama kalau lebih rapat.
export const awalLabel = (t: Titik) => t.x + t.R + 13
/** Ujung label paling jauh yang masih menyisakan talang bersih untuk batang. */
export const UJUNG_LABEL_MAKS = (kolom: number) => xBatas(kolom) - 26

export function tataLetak(profesi: ProfesiMin[], rumpun: { id: string; label: string }[]) {
  const pos = new Map<string, Titik>()
  const baris: Baris[] = []
  let y = ATAS
  rumpun.forEach((r, bi) => {
    const sel = (Object.keys(JENJANG_KOLOM) as (keyof typeof JENJANG_KOLOM)[]).map(j =>
      profesi.filter(p => p.rumpun === r.id && p.jenjang === j))
    // Tinggi baris dari sel terpadatnya, bukan dipatok.
    const tinggi = Math.max(BARIS_MIN, Math.max(...sel.map(x => x.length)) * LANGKAH + BANTALAN)
    sel.forEach((isi, j) => {
      const blok = (isi.length - 1) * LANGKAH
      isi.forEach((p, k) => pos.set(p.id, {
        x: xSimpul(j), y: y + tinggi / 2 - blok / 2 + k * LANGKAH, kolom: j, baris: bi,
        R: p.jenjang === 'senior' ? 8 : p.jenjang === 'menengah' ? 7 : 6,
      }))
    })
    baris.push({ id: r.id, label: r.label, y, tinggi })
    y += tinggi
  })
  return { pos, baris, tinggi: y + 14 }
}

/** Perkiraan ujung label sebelum SVG menempel; sesudahnya diganti getComputedTextLength. */
export const ujungPerkiraan = (t: Titik, label: string) => awalLabel(t) + label.length * LEBAR_HURUF

export type Pt = [number, number]

/**
 * Titik-titik polyline garis dari simpul KIRI ke simpul KANAN (kolom kanan > kiri).
 * `geser`: garis "dekat" memakai batang kedua yang digeser beberapa unit ke kiri,
 * dan lajur kedua yang digeser ke bawah, supaya dua jenis hubungan tidak menumpuk.
 */
export function titikGaris(kiri: Titik, ujungLabelKiri: number, kanan: Titik, barisKanan: Baris, geser = 0): Pt[] {
  const x1 = ujungLabelKiri + 10
  const x2 = kanan.x - kanan.R - 9
  const t1 = xBatas(kiri.kolom) - 8 + geser
  if (kanan.kolom - kiri.kolom <= 1) return [[x1, kiri.y], [t1, kiri.y], [t1, kanan.y], [x2, kanan.y]]
  const t2 = xBatas(kanan.kolom - 1) - 8 + geser
  const lajur = barisKanan.y + 8 - geser / 2
  return [[x1, kiri.y], [t1, kiri.y], [t1, lajur], [t2, lajur], [t2, kanan.y], [x2, kanan.y]]
}

/** Polyline -> atribut d dengan sudut membulat (radius R_SUDUT, dikecilkan bila segmennya pendek). */
export function jalurD(t: Pt[]): string {
  const f = (n: number) => n.toFixed(1)
  const bersih = t.filter((p, i) => i === 0 || Math.abs(p[0] - t[i - 1][0]) + Math.abs(p[1] - t[i - 1][1]) > 0.01)
  let d = `M${f(bersih[0][0])},${f(bersih[0][1])}`
  for (let i = 1; i < bersih.length; i++) {
    const [x, y] = bersih[i]
    if (i === bersih.length - 1) { d += ` L${f(x)},${f(y)}`; break }
    const [px, py] = bersih[i - 1], [nx, ny] = bersih[i + 1]
    const r = Math.min(R_SUDUT, Math.hypot(x - px, y - py) / 2, Math.hypot(nx - x, ny - y) / 2)
    const ux = Math.sign(x - px), uy = Math.sign(y - py), vx = Math.sign(nx - x), vy = Math.sign(ny - y)
    d += ` L${f(x - ux * r)},${f(y - uy * r)} Q${f(x)},${f(y)} ${f(x + vx * r)},${f(y + vy * r)}`
  }
  return d
}

export interface Kotak { x: number; y: number; w: number; h: number; id: string }

/**
 * Berapa titik sampel garis yang jatuh di dalam kotak label atau lingkaran simpul,
 * selain simpul ujungnya sendiri. Dipakai tes (kotak perkiraan) dan pemeriksaan di
 * browser (kotak getBBox sungguhan). Harus 0.
 */
export function tabrakan(garis: { titik: Pt[]; dari: string; ke: string }[], label: Kotak[], simpul: { id: string; x: number; y: number; R: number }[]): string[] {
  const kena: string[] = []
  for (const g of garis) {
    for (let i = 1; i < g.titik.length; i++) {
      const [ax, ay] = g.titik[i - 1], [bx, by] = g.titik[i]
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 2))
      for (let k = 0; k <= n; k++) {
        const x = ax + (bx - ax) * k / n, y = ay + (by - ay) * k / n
        for (const b of label) if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) kena.push(`${g.dari}->${g.ke} menembus label ${b.id}`)
        for (const s of simpul) if (s.id !== g.dari && s.id !== g.ke && Math.hypot(x - s.x, y - s.y) < s.R + 3) kena.push(`${g.dari}->${g.ke} menembus simpul ${s.id}`)
      }
    }
  }
  return [...new Set(kena)]
}

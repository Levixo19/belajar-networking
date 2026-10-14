// Logika Pustaka: menyaring, menghitung segi, mengurutkan, dan memilih bacaan per tahap.
// Semuanya fungsi murni atas data yang dihasilkan build (src/generated/pustaka.json),
// supaya bisa dites tanpa browser. Datanya dimuat MALAS lewat muatPustaka(): ±1.000
// tautan tidak perlu ikut bundel utama.

export interface ButirPustaka {
  id: string; judul: string; url: string; jenis: string; bahasa: 'id' | 'en'
  sumber: string; lisensi: string; boleh_salin: boolean
  topik: string[]; tahap: string[]; modul: string[]; catatan: string
  tanggal_diperiksa?: string; juga_di: string[]
}
export interface SumberPustaka {
  kunci: string; nama: string; pemilik: string; repo: string; lisensi: string
  boleh_salin: boolean | null; atribusi: string; commit: string; kurasi: boolean; jumlah: number
}
export interface DataPustaka { sumber: SumberPustaka[]; entri: ButirPustaka[] }

let janji: Promise<DataPustaka> | null = null
export function muatPustaka(): Promise<DataPustaka> {
  janji ??= import('../generated/pustaka.json').then(m => (m.default ?? m) as unknown as DataPustaka)
  return janji
}

export type Segi = 'jenis' | 'bahasa' | 'sumber' | 'tahap'
export interface Saringan { q: string; jenis: string[]; bahasa: string[]; sumber: string[]; tahap: string[] }
export const SARINGAN_KOSONG: Saringan = { q: '', jenis: [], bahasa: [], sumber: [], tahap: [] }

const normal = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Setiap kata kueri harus muncul di judul, catatan, URL, atau topik (AND, bukan OR). */
function cocokKueri(e: ButirPustaka, kata: string[]): boolean {
  if (!kata.length) return true
  const teks = normal(`${e.judul} ${e.catatan} ${e.url} ${e.topik.join(' ')}`)
  return kata.every(k => teks.includes(k))
}

function cocokSegi(e: ButirPustaka, s: Saringan, kecuali?: Segi): boolean {
  if (kecuali !== 'jenis' && s.jenis.length && !s.jenis.includes(e.jenis)) return false
  if (kecuali !== 'bahasa' && s.bahasa.length && !s.bahasa.includes(e.bahasa)) return false
  if (kecuali !== 'sumber' && s.sumber.length && !s.sumber.includes(e.sumber) && !e.juga_di.some(x => s.sumber.includes(x))) return false
  if (kecuali !== 'tahap' && s.tahap.length && !e.tahap.some(t => s.tahap.includes(t))) return false
  return true
}

const kataDari = (q: string) => normal(q).split(/\s+/).filter(Boolean)

/** Hasil saringan, sudah diurutkan (lihat urutkan()). */
export function saring(entri: ButirPustaka[], s: Saringan): ButirPustaka[] {
  const kata = kataDari(s.q)
  return urutkan(entri.filter(e => cocokKueri(e, kata) && cocokSegi(e, s)))
}

/**
 * Jumlah per nilai segi yang JUJUR: dihitung dari butir yang lolos kueri dan SEMUA
 * saringan lain, kecuali saringan segi itu sendiri. Jadi angka di samping "Video"
 * selalu sama dengan banyaknya hasil kalau "Video" diklik sekarang, bukan jumlah
 * video di seluruh pustaka. Nilai yang sudah dipilih tetap muncul walau jumlahnya 0,
 * supaya pilihannya bisa dilepas lagi.
 */
export function hitungSegi(entri: ButirPustaka[], s: Saringan, segi: Segi): Map<string, number> {
  const kata = kataDari(s.q)
  const n = new Map<string, number>()
  for (const v of s[segi]) n.set(v, 0)
  for (const e of entri) {
    if (!cocokKueri(e, kata) || !cocokSegi(e, s, segi)) continue
    const nilai = segi === 'tahap' ? e.tahap : segi === 'sumber' ? [e.sumber, ...e.juga_di] : [e[segi]]
    for (const v of new Set(nilai)) n.set(v, (n.get(v) || 0) + 1)
  }
  return n
}

// Kurasi dan materi sendiri lebih dulu daripada hasil panen massal: butir kurasi
// membawa lisensi dan tanggal periksa per butir, materi membawa modul asalnya.
const BOBOT_SUMBER = (k: string) => (k.startsWith('kurasi-') ? 0 : k === 'materi' ? 1 : 2)
const BOBOT_JENIS: Record<string, number> = { buku: 0, kursus: 1, dokumentasi: 2, lab: 3, standar: 4, alat: 5, video: 6, daftar: 7, artikel: 8 }

/** Indonesia lebih dulu (sumbernya langka), lalu kurasi > materi > panen, lalu jenis, lalu judul. */
export function urutkan(entri: ButirPustaka[]): ButirPustaka[] {
  return [...entri].sort((a, b) =>
    (a.bahasa === 'id' ? 0 : 1) - (b.bahasa === 'id' ? 0 : 1) ||
    BOBOT_SUMBER(a.sumber) - BOBOT_SUMBER(b.sumber) ||
    (BOBOT_JENIS[a.jenis] ?? 9) - (BOBOT_JENIS[b.jenis] ?? 9) ||
    a.judul.localeCompare(b.judul, 'id'))
}

/**
 * 4-6 bacaan lanjutan untuk satu tahap, deterministik. Yang dicari keragaman, bukan
 * enam RFC berderet: paling banyak dua butir per jenis, Indonesia dan kurasi lebih
 * dulu.
 */
export function bacaanUntukTahap(entri: ButirPustaka[], tahap: string, maks = 6): ButirPustaka[] {
  const calon = urutkan(entri.filter(e => e.tahap.includes(tahap)))
  const pilih: ButirPustaka[] = []
  const perJenis = new Map<string, number>()
  for (const e of calon) {
    if (pilih.length >= maks) break
    if ((perJenis.get(e.jenis) || 0) >= 2) continue
    perJenis.set(e.jenis, (perJenis.get(e.jenis) || 0) + 1)
    pilih.push(e)
  }
  // Tahap yang sumbernya tidak beragam (mis. referensi, isinya RFC semua) tetap
  // diisi sampai batas, karena empat RFC lebih berguna daripada bagian kosong.
  for (const e of calon) { if (pilih.length >= maks) break; if (!pilih.includes(e)) pilih.push(e) }
  return pilih
}

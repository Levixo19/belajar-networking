// Planisfer kurikulum: tata letak peta langit yang DIHITUNG dari kurikulum.
//
// Kurikulum ini punya tepat 24 tahap bernomor (00 sampai 23), jadi setiap tahap
// menempati satu "jam" bujur langit seperti pada planisfer sungguhan: 15 derajat per
// tahap, tahap 00 di puncak, naik searah jarum jam. Setiap modul adalah satu bintang;
// besarnya (magnitudo) mengikuti panjang modul. Lintasan belajar adalah spiral satu
// putaran dari dekat pusat (tahap 00) ke tepi (tahap 23). Panduan adalah bintang kutub
// di pusat, dan Lab Praktik adalah rasi sirkumpolar yang mengelilinginya.
//
// Semua posisi deterministik: benih teks yang sama memberi langit yang sama, jadi
// peta di dasbor, kepala modul, dan menu Kurikulum selalu cocok satu sama lain.
// Satuan koordinat: lingkaran berjari-jari 1 dengan pusat (0, 0), y ke bawah.

export interface ModulLangit { id: string; num: string; title: string; words: number }
export interface TahapLangit { id: string; title: string; modules: ModulLangit[] }

/** Nama di peta: atlas menyingkat nama rasi yang panjang supaya tidak menimpa rasi lain.
 *  Judul lengkap tetap dipakai di kartu bintang, daftar, dan pembaca layar. */
export const NAMA_PETA: Record<string, string> = {
  '06-aplikasi': 'Aplikasi', '07-routing-lanjutan': 'Routing', '09-nat-acl-firewall': 'Firewall',
  '13-linux-networking': 'Linux', '14-monitoring-troubleshooting': 'Monitoring', '16-datacenter-cloud-sdn': 'Data Center',
  '17-desain-arsitektur': 'Desain', '18-karier-sertifikasi': 'Sertifikasi', '19-mikrotik': 'MikroTik',
  '21-ekosistem-profesi': 'Profesi', '22-service-provider': 'Service Provider', '23-jalur-vendor': 'Jalur Vendor',
}

export interface Bintang {
  id: string; num: string; title: string; tahap: string
  x: number; y: number; r: number      // r: jari-jari gambar dalam satuan peta (sebelum skala)
  urut: number                          // urutan dalam tahap, mulai 0
}
export interface Rasi {
  id: string; title: string; jam: number | null   // null: rasi sirkumpolar (Lab)
  sudut: number                                    // sudut tengah sektor (derajat, searah jarum jam dari atas)
  nama: string                                     // nama di peta (lihat NAMA_PETA)
  label: { x: number; y: number }                  // titik jangkar nama rasi
  /** Nama rasi ditulis searah jari-jari (seperti planisfer cetak): 'luar' memanjang ke arah
   *  cincin dari jangkar, 'dalam' memanjang ke arah pusat. null: mendatar (rasi Lab). */
  labelArah: 'luar' | 'dalam' | null
  bintang: Bintang[]
  /** Garis asterisme: pohon rentang minimum atas bintang rasi ini (pasangan indeks).
   *  Pohon rentang minimum di bidang datar tidak pernah bersilang, seperti rasi sungguhan;
   *  urutan belajar sudah dibawa nomor modul, spiral, dan bintang yang menyala. */
  garis: [number, number][]
}
export interface Langit {
  rasi: Rasi[]
  bintang: Bintang[]            // semua bintang modul, urut kurikulum
  latar: { x: number; y: number; r: number; o: number }[]   // bintang latar (hiasan, bukan data)
  spiral: string                // path SVG lintasan belajar (satuan peta)
  kutub: { x: number; y: number; id: string | null }
}

/** FNV-1a 32 bit: benih stabil dari teks. */
export function benih(teks: string): number {
  let h = 2166136261
  for (let i = 0; i < teks.length; i++) { h ^= teks.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
/** mulberry32: PRNG kecil berbenih. */
export function acak(awal: number) {
  let a = awal || 1
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RAD = Math.PI / 180
/** Sudut searah jarum jam dari atas (derajat) dan jari-jari -> x, y (y ke bawah). */
export function kutubKeXY(sudut: number, r: number) { return { x: r * Math.sin(sudut * RAD), y: -r * Math.cos(sudut * RAD) } }

export const R_DALAM = 0.34   // jari-jari spiral di awal tahap 00
export const R_LUAR = 0.86    // jari-jari spiral di akhir tahap 23
const LEBAR_PITA = 0.1        // separuh lebar pita radial tempat bintang satu tahap ditebar
/** Jari-jari spiral pada sudut a (0..360): satu putaran dari R_DALAM ke R_LUAR. */
export const jariSpiral = (a: number) => R_DALAM + (R_LUAR - R_DALAM) * (a / 360)

/** Nomor jam (0..23) dari ID tahap "07-routing-lanjutan"; null untuk tahap tanpa nomor. */
export function jamTahap(id: string): number | null {
  const m = id.match(/^(\d{2})-/)
  if (!m) return null
  const n = Number(m[1])
  return n >= 0 && n <= 23 ? n : null
}

/** Magnitudo: modul 1.000 kata kecil, modul 6.000+ kata terang. */
function jariBintang(words: number) {
  const t = Math.min(1, Math.sqrt(Math.max(0, words) / 7000))
  return 0.0042 + 0.0068 * t
}

export function bangunLangit(tahap: TahapLangit[], opsi: { latar?: number } = {}): Langit {
  const rasi: Rasi[] = []
  const semua: Bintang[] = []

  const bernomor = tahap.filter(t => jamTahap(t.id) !== null).sort((a, b) => jamTahap(a.id)! - jamTahap(b.id)!)
  for (const t of bernomor) {
    const jam = jamTahap(t.id)!
    const rnd = acak(benih('rasi:' + t.id))
    const awal = jam * 15, akhir = awal + 15
    const n = t.modules.length
    const bintang: Bintang[] = t.modules.map((m, i) => {
      // Sudut naik searah urutan modul (asterisme terbaca kiri ke kanan sepanjang spiral),
      // jari-jari zig-zag di sekitar spiral supaya garisnya membentuk rasi, bukan garis lurus.
      const u = n === 1 ? 0.5 : 0.12 + 0.76 * (i / (n - 1))
      const a = awal + 15 * u + (rnd() - 0.5) * (6 / Math.max(2, n))
      const zig = Math.sin(i * 2.1 + rnd() * 1.4) * 0.72 + (rnd() - 0.5) * 0.36
      const r = jariSpiral(a) + LEBAR_PITA * Math.max(-1, Math.min(1, zig))
      const p = kutubKeXY(a, r)
      return { id: m.id, num: m.num, title: m.title, tahap: t.id, x: p.x, y: p.y, r: jariBintang(m.words), urut: i }
    })
    renggangkan(bintang, 0.03)
    // Nama rasi di sisi LUAR pita selama masih ada ruang sebelum cincin; tahap paling luar
    // menaruhnya di sisi dalam. Spiral hanya satu putaran, jadi sisi luar pita selalu kosong.
    const tengah = (awal + akhir) / 2
    const rl = jariSpiral(tengah)
    // Panjang perkiraan nama (kapital kecil berjarak, 12,5 px pada skala hero) dalam satuan peta.
    const nama = NAMA_PETA[t.id] ?? t.title
    const panjang = nama.length * 0.0175
    const keluar = rl + LEBAR_PITA + 0.05 + panjang < 0.97
    const label = kutubKeXY(tengah, keluar ? rl + LEBAR_PITA + 0.05 : rl - LEBAR_PITA - 0.05)
    rasi.push({ id: t.id, title: t.title, nama, jam, sudut: tengah, label, labelArah: keluar ? 'luar' : 'dalam', bintang, garis: pohonRentang(bintang) })
    semua.push(...bintang)
  }

  // Rasi sirkumpolar: Lab Praktik melingkari kutub.
  const lab = tahap.find(t => t.id === 'lab')
  if (lab) {
    const rnd = acak(benih('rasi:lab'))
    const n = lab.modules.length
    const bintang: Bintang[] = lab.modules.map((m, i) => {
      const a = (i / n) * 360 + 200 + (rnd() - 0.5) * 8
      const r = 0.15 + (rnd() - 0.5) * 0.04
      const p = kutubKeXY(a, r)
      return { id: m.id, num: m.num, title: m.title, tahap: lab.id, x: p.x, y: p.y, r: jariBintang(m.words) * 0.9, urut: i }
    })
    renggangkan(bintang, 0.028)
    rasi.push({ id: lab.id, title: lab.title, nama: lab.title, jam: null, sudut: 200, label: kutubKeXY(180, 0.235), labelArah: null, bintang, garis: pohonRentang(bintang) })
    semua.push(...bintang)
  }

  // Bintang latar: hiasan, sengaja samar. Dua pertiga menyebar rata, sepertiga mengikuti
  // pita lengkung tipis seperti Bima Sakti di peta bintang cetak.
  const rl = acak(benih('latar'))
  const latar: Langit['latar'] = []
  const jumlah = opsi.latar ?? 420
  for (let i = 0; i < jumlah; i++) {
    let x: number, y: number
    if (i % 3 === 2) {
      const s = rl() * 2 - 1
      const t = Math.sin(s * 2.2) * 0.32 + (rl() + rl() + rl() - 1.5) * 0.11
      x = s * 0.98; y = t - 0.18 * s
    } else {
      const a = rl() * 360, r = Math.sqrt(rl()) * 0.99
      ;({ x, y } = kutubKeXY(a, r))
    }
    if (x * x + y * y > 0.98) continue
    latar.push({ x, y, r: 0.0011 + rl() * 0.0026, o: 0.25 + rl() * 0.5 })
  }

  // Lintasan belajar: spiral satu putaran, ditulis sebagai rangkaian titik halus.
  const titik: string[] = []
  for (let a = 0; a <= 360; a += 2) {
    const p = kutubKeXY(a, jariSpiral(a))
    titik.push(`${a === 0 ? 'M' : 'L'}${p.x.toFixed(4)} ${p.y.toFixed(4)}`)
  }

  const panduan = tahap.find(t => t.id === 'panduan')
  return {
    rasi, bintang: semua, latar, spiral: titik.join(' '),
    kutub: { x: 0, y: 0, id: panduan?.modules[0]?.id ?? null },
  }
}

/** Pohon rentang minimum (Prim, O(n^2): rasi paling banyak belasan bintang). */
export function pohonRentang(b: { x: number; y: number }[]): [number, number][] {
  if (b.length < 2) return []
  const masuk = new Set([0]), garis: [number, number][] = []
  while (masuk.size < b.length) {
    let terbaik: [number, number] | null = null, d0 = Infinity
    for (const i of masuk) for (let j = 0; j < b.length; j++) {
      if (masuk.has(j)) continue
      const d = Math.hypot(b[i].x - b[j].x, b[i].y - b[j].y)
      if (d < d0) { d0 = d; terbaik = [i, j] }
    }
    if (!terbaik) break
    garis.push(terbaik); masuk.add(terbaik[1])
  }
  return garis
}

/** Dorong bintang yang terlalu rapat sampai berjarak minimal `jarak` (beberapa putaran). */
function renggangkan(b: Bintang[], jarak: number) {
  for (let iter = 0; iter < 24; iter++) {
    let geser = false
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
      const dx = b[j].x - b[i].x, dy = b[j].y - b[i].y
      const d = Math.hypot(dx, dy) || 1e-6
      if (d < jarak) {
        const k = (jarak - d) / 2 / d
        b[i].x -= dx * k; b[i].y -= dy * k; b[j].x += dx * k; b[j].y += dy * k
        geser = true
      }
    }
    if (!geser) break
  }
}

/** Kotak pembatas sekumpulan bintang (untuk memotong peta jadi "plat rasi"). */
export function kotakRasi(r: Rasi, tepi = 0.06) {
  const xs = r.bintang.map(b => b.x), ys = r.bintang.map(b => b.y)
  xs.push(r.label.x); ys.push(r.label.y)
  const x0 = Math.min(...xs) - tepi, x1 = Math.max(...xs) + tepi
  const y0 = Math.min(...ys) - tepi, y1 = Math.max(...ys) + tepi
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}

/** Bintang terdekat dari titik (satuan peta) dalam radius tertentu, atau null. */
export function bintangTerdekat(semua: Bintang[], x: number, y: number, radius: number): Bintang | null {
  let terbaik: Bintang | null = null, d0 = radius
  for (const b of semua) {
    const d = Math.hypot(b.x - x, b.y - y)
    if (d < d0) { d0 = d; terbaik = b }
  }
  return terbaik
}

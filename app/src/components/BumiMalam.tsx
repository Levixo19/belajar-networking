import { useMemo } from 'react'
import fotoMentah from '../../data/photos.json'
import { TandaBintang } from './Planisfer'

/** "Bumi di bawah": Indonesia pada malam hari (citra lampu malam NASA, proyeksi
 *  equirectangular) dengan kota-kota tempat laporan gangguan Misi berasal. Kota yang
 *  gangguannya sudah Anda pecahkan menyala dengan warna lampu yang sama dengan bintang
 *  tuntas di peta langit: satu dunia, dua permukaan, satu sumber progres.
 *  Equirectangular = lintang dan bujur linier, jadi penempatan titik cukup dengan
 *  x = (bujur - barat) / (timur - barat), y = (utara - lintang) / (utara - selatan). */

interface Batas { barat: number; timur: number; utara: number; selatan: number }
interface FotoPeta { src: string; credit: string; page: string; title: string; batas?: Batas }
export interface TitikMisi { id: string; judul: string; lokasi?: { kota: string; lat: number; lon: number } }

const base = import.meta.env.BASE_URL
const FOTO = (fotoMentah as unknown as Record<string, FotoPeta>)['indonesia-malam']

export default function BumiMalam({ misi, dipecahkan, className = '' }: { misi: TitikMisi[]; dipecahkan: Set<string>; className?: string }) {
  const kota = useMemo(() => {
    const m = new Map<string, { kota: string; lat: number; lon: number; jumlah: number; menyala: number }>()
    for (const x of misi) {
      if (!x.lokasi) continue
      const k = x.lokasi.kota
      const t = m.get(k) ?? { ...x.lokasi, jumlah: 0, menyala: 0 }
      t.jumlah++; if (dipecahkan.has(x.id)) t.menyala++
      m.set(k, t)
    }
    return [...m.values()].sort((a, b) => a.lon - b.lon)
  }, [misi, dipecahkan])

  if (!FOTO?.batas || !kota.length) return null
  const { barat, timur, utara, selatan } = FOTO.batas
  const W = 1000, H = Math.round(W * (utara - selatan) / (timur - barat))
  const keXY = (lat: number, lon: number) => ({ x: ((lon - barat) / (timur - barat)) * W, y: ((utara - lat) / (utara - selatan)) * H })
  const semua = kota.map(k => ({ ...k, ...keXY(k.lat, k.lon) }))
  // Peta sisipan Jawa dan Bali: kota di Jawa terlalu rapat untuk diberi label di peta utama.
  const a0 = keXY(SISIP.utara, SISIP.barat), a1 = keXY(SISIP.selatan, SISIP.timur)
  const wil = { x0: a0.x, y0: a0.y, x1: a1.x, y1: a1.y }
  const diSisip = (t: { x: number; y: number }) => t.x >= wil.x0 && t.x <= wil.x1 && t.y >= wil.y0 && t.y <= wil.y1
  const sw = (wil.x1 - wil.x0) * ZOOM, sh = (wil.y1 - wil.y0) * ZOOM
  const sx = W - sw - 12, sy = 12
  const utama = tataTitik(semua.filter(t => !diSisip(t)), { x0: 0, y0: 0, x1: W, y1: H }, 1, [{ x0: sx - 4, y0: sy - 4, x1: W, y1: sy + sh + 22 }])
  const sisip = tataTitik(semua.filter(diSisip), wil, 1 / ZOOM)
  const menyala = kota.filter(k => k.menyala > 0).length
  const src = base + FOTO.src.replace(/^\//, '')

  return (
    <figure className={`bumi bingkai-atlas ${className}`}>
      <div className="bumi-peta" style={{ aspectRatio: `${W} / ${H}` }}>
        <img src={src} alt="" className="bumi-foto" loading="lazy" decoding="async" />
        <svg viewBox={`0 0 ${W} ${H}`} className="bumi-titik" aria-hidden="true">
          {semua.filter(diSisip).map(t => <TitikKota key={t.kota} x={t.x} y={t.y} menyala={t.menyala > 0} s={0.75} />)}
          <rect x={wil.x0} y={wil.y0} width={wil.x1 - wil.x0} height={wil.y1 - wil.y0} className="bumi-sisip-wilayah" />
          {utama.map(t => <TitikKota key={t.nama} {...t} menyala={t.menyala > 0} />)}
          <svg x={sx} y={sy} width={sw} height={sh} viewBox={`${wil.x0} ${wil.y0} ${wil.x1 - wil.x0} ${wil.y1 - wil.y0}`}>
            <image href={src} x={0} y={0} width={W} height={H} preserveAspectRatio="none" />
            {sisip.map(t => <TitikKota key={t.nama} {...t} menyala={t.menyala > 0} s={1 / ZOOM} />)}
          </svg>
          <rect x={sx} y={sy} width={sw} height={sh} className="bumi-sisip-bingkai" />
          <text x={sx + sw} y={sy + sh + 17} textAnchor="end" className="bumi-sisip-judul">Jawa dan Bali, diperbesar 1,8 kali</text>
        </svg>
      </div>
      <figcaption className="bumi-keterangan">
        <span>
          Indonesia pada malam hari. Setiap titik adalah kota asal laporan gangguan;{' '}
          <span className="bumi-legenda"><TandaBintang status="tuntas" size={13} /> menyala</span> bila gangguannya sudah Anda pecahkan,{' '}
          <span className="bumi-legenda"><TandaBintang status="baru" size={13} /> masih menunggu</span>.
          {' '}{menyala} dari {kota.length} kota menyala.
        </span>
        <a href={FOTO.page} target="_blank" rel="noopener noreferrer" className="bumi-kredit">{FOTO.credit}</a>
      </figcaption>
    </figure>
  )
}

const SISIP = { barat: 105.6, timur: 115.9, utara: -5.6, selatan: -9.1 }
const ZOOM = 1.8

/** Satu kota: lampu menyala (bentuk "tuntas" bintang) atau lingkar menunggu, label, dan
 *  garis penunjuk bila ada. s = skala balik di dalam peta sisipan supaya huruf dan titik
 *  tampil sama besar dengan di peta utama. */
function TitikKota({ x, y, menyala, nama, lx = 0, ly = 0, jangkar = 'middle', garis, s = 1 }: {
  x: number; y: number; menyala: boolean; nama?: string; lx?: number; ly?: number; jangkar?: 'start' | 'middle' | 'end'; garis?: [number, number, number, number]; s?: number
}) {
  return (
    <g className={`bumi-kota ${menyala ? 'menyala' : ''}`} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
      {menyala
        ? <><circle r={4.2 * s} className="bumi-inti" /><path d={`M0 ${-11.5 * s}V${-6.8 * s}M0 ${6.8 * s}V${11.5 * s}M${-11.5 * s} 0H${-6.8 * s}M${6.8 * s} 0H${11.5 * s}`} className="bumi-sinar" /></>
        : <circle r={4.6 * s} className="bumi-lingkar" />}
      {garis && <line x1={garis[0]} y1={garis[1]} x2={garis[2]} y2={garis[3]} className="bumi-penunjuk" />}
      {nama && <text x={lx} y={ly} textAnchor={jangkar} className="bumi-label" style={s !== 1 ? { fontSize: `${HURUF * s}px` } : undefined}>{nama}</text>}
    </g>
  )
}

/** Kota yang lebih dekat dari GABUNG unit (Sleman dan Yogyakarta hanya ~2 unit, sekitar
 *  10 km) menjadi satu titik berlabel ganda. Label lalu ditempatkan rakus: atas, bawah, kanan,
 *  kiri; kalau semuanya menabrak, label turun atau naik dengan garis penunjuk tegak, gaya
 *  anotasi sampul Voyager. Lebar huruf diperkirakan: 13 unit, kira-kira 0,6 em per huruf
 *  untuk Archivo tebal. s = skala (1/ZOOM di peta sisipan); halangan = kotak yang harus
 *  dihindari (bingkai sisipan di peta utama). */
const GABUNG = 6, HURUF = 13
type Kotak = { x0: number; y0: number; x1: number; y1: number }
interface Calon { lx: number; ly: number; jangkar: 'start' | 'middle' | 'end'; k: Kotak; garis?: [number, number, number, number] }
function tataTitik(kota: { kota: string; x: number; y: number; menyala: number }[], batas: Kotak, s = 1, halangan: Kotak[] = []) {
  const kelompok: { nama: string[]; x: number; y: number; menyala: number; n: number }[] = []
  for (const k of kota) {
    const g = kelompok.find(c => Math.hypot(c.x - k.x, c.y - k.y) < GABUNG * s)
    if (g) { g.nama.push(k.kota); g.x = (g.x * g.n + k.x) / (g.n + 1); g.y = (g.y * g.n + k.y) / (g.n + 1); g.n++; g.menyala += k.menyala }
    else kelompok.push({ nama: [k.kota], x: k.x, y: k.y, menyala: k.menyala, n: 1 })
  }
  const h = HURUF * s, tepi = 4 * s
  const terpakai: Kotak[] = [...halangan, ...kelompok.map(c => ({ x0: c.x - 7 * s, y0: c.y - 7 * s, x1: c.x + 7 * s, y1: c.y + 7 * s }))]
  const tabrak = (a: Kotak) => a.x0 < batas.x0 + tepi || a.x1 > batas.x1 - tepi || a.y0 < batas.y0 + tepi || a.y1 > batas.y1 - tepi
    || terpakai.some(b => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0)
  const tengah = (x: number, y: number, w: number): Kotak => ({ x0: x - w / 2 - 2 * s, y0: y - h, x1: x + w / 2 + 2 * s, y1: y + 3 * s })
  return kelompok.map(c => {
    const nama = c.nama.join(', ')
    const w = nama.length * h * 0.6
    const calon: Calon[] = [
      { lx: 0, ly: -13 * s, jangkar: 'middle', k: tengah(c.x, c.y - 13 * s, w) },
      { lx: 0, ly: 23 * s, jangkar: 'middle', k: tengah(c.x, c.y + 23 * s, w) },
      { lx: 11 * s, ly: 4.5 * s, jangkar: 'start', k: { x0: c.x + 11 * s, y0: c.y + 4.5 * s - h, x1: c.x + 13 * s + w, y1: c.y + 7.5 * s } },
      { lx: -11 * s, ly: 4.5 * s, jangkar: 'end', k: { x0: c.x - 13 * s - w, y0: c.y + 4.5 * s - h, x1: c.x - 11 * s, y1: c.y + 7.5 * s } },
    ]
    for (const arah of [1, -1]) for (let t = 1; t <= 6; t++) {
      const ly = (arah > 0 ? 23 + t * 17 : -13 - t * 17) * s
      calon.push({ lx: 0, ly, jangkar: 'middle', k: tengah(c.x, c.y + ly, w), garis: [0, arah * 6 * s, 0, arah > 0 ? ly - h + s : ly + 4 * s] })
    }
    const bebas = (p: Calon) => !tabrak(p.k) && (!p.garis || !garisTabrak(c.x, c.y, p.garis, terpakai, s))
    const pilih = calon.find(bebas) ?? calon[0]
    terpakai.push(pilih.k)
    return { nama, x: c.x, y: c.y, menyala: c.menyala, lx: pilih.lx, ly: pilih.ly, jangkar: pilih.jangkar, garis: pilih.garis }
  })
}
/** Garis penunjuk tidak boleh menembus label atau titik lain (dicuplik per 4 unit). */
function garisTabrak(x: number, y: number, [x1, y1, x2, y2]: [number, number, number, number], kotak: Kotak[], s: number) {
  const n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / (4 * s)))
  for (let i = 1; i < n; i++) {
    const px = x + x1 + (x2 - x1) * i / n, py = y + y1 + (y2 - y1) * i / n
    if (kotak.some(b => px > b.x0 && px < b.x1 && py > b.y0 && py < b.y1 && !(Math.abs(px - x) < 8 * s && Math.abs(py - y) < 8 * s))) return true
  }
  return false
}

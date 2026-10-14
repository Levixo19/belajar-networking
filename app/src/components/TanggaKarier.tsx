import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { PROFESI, RUMPUN, LABEL_GRAF, byId, edges, neighbors, type Rumpun } from '../lib/profesi'
import { tataLetak, titikGaris, jalurD, ujungPerkiraan, xSimpul, W, KIRI, KOLOM, UKURAN_LABEL } from '../lib/tanggaKarier'
import { gsap, MOTION_OK } from '../lib/motion'

const label = (id: string) => LABEL_GRAF[id] ?? byId.get(id)!.nama
const KOLOM_JUDUL = ['Pemula', 'Menengah', 'Senior']

/** Nama rumpun panjang dipecah dua baris di batas kata terdekat dari tengahnya. */
function pecahDua(teks: string): [string, string?] {
  if (teks.length <= 18) return [teks]
  const kata = teks.split(' ')
  let terbaik = 1, skor = Infinity
  for (let i = 1; i < kata.length; i++) {
    const s = Math.max(kata.slice(0, i).join(' ').length, kata.slice(i).join(' ').length)
    if (s < skor) { skor = s; terbaik = i }
  }
  return [kata.slice(0, terbaik).join(' '), kata.slice(terbaik).join(' ')]
}

/**
 * Tangga karier: baris = rumpun, kolom = jenjang. Garis hanya untuk profesi yang
 * dipilih atau disorot (aturan lengkapnya di kepala lib/tanggaKarier.ts).
 */
export default function TanggaKarier({ pilihan, onPilih, saring, siap }: {
  pilihan: string | null
  onPilih: (id: string) => void
  saring: Rumpun | 'semua'
  siap: Map<string, number>
}) {
  const [sorot, setSorot] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const { pos, baris, tinggi: H } = useMemo(() => tataLetak(PROFESI, RUMPUN), [])
  const jenis = useMemo(() => new Map(edges().flatMap(e => [[`${e.a}|${e.b}`, e.kind], [`${e.b}|${e.a}`, e.kind]] as const)), [])

  // Ujung label diukur dari teksnya sendiri SESUDAH SVG menempel. Render pertama
  // memakai perkiraan per huruf yang TIDAK disimpan; begitu ukurannya ada, garis
  // digambar ulang. Tanpa itu garis pertama bisa menempel ke huruf terakhir label.
  const [ujung, setUjung] = useState<Map<string, number> | null>(null)
  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const ukur = () => {
      const m = new Map<string, number>()
      svg.querySelectorAll<SVGTextElement>('text[data-label]').forEach(t => {
        const id = t.dataset.label!, p = pos.get(id)!
        const n = t.getComputedTextLength()
        if (n > 0) m.set(id, p.x + p.R + 13 + n)
      })
      if (m.size === PROFESI.length) setUjung(m)
    }
    ukur()
    // Font variabel bisa selesai dimuat SESUDAH render pertama; ukur ulang saat itu.
    document.fonts?.ready.then(ukur)
  }, [pos])
  const ujungDari = (id: string) => ujung?.get(id) ?? ujungPerkiraan(pos.get(id)!, label(id))

  const fokus = sorot ?? pilihan
  const dekat = useMemo(() => (fokus ? neighbors(fokus) : new Set<string>()), [fokus])
  const tersaring = (r: string) => saring !== 'semua' && r !== saring

  const garis = useMemo(() => {
    if (!fokus) return []
    const out: { key: string; d: string; kind: 'naik' | 'dekat'; ujungX: number; ujungY: number }[] = []
    for (const lain of [...dekat].sort()) {
      const a = pos.get(fokus)!, b = pos.get(lain)!
      if (a.kolom === b.kolom) continue // sejenjang: lingkar, bukan garis
      if (tersaring(byId.get(lain)!.rumpun)) continue // saringan rumpun ikut menyaring garis
      const [kiri, kanan] = a.kolom < b.kolom ? [fokus, lain] : [lain, fokus]
      const kind = (jenis.get(`${fokus}|${lain}`) ?? 'dekat') as 'naik' | 'dekat'
      const t = titikGaris(pos.get(kiri)!, ujungDari(kiri), pos.get(kanan)!, baris[pos.get(kanan)!.baris], kind === 'naik' ? 0 : -8)
      const akhir = t[t.length - 1]
      out.push({ key: `${kiri}|${kanan}`, d: jalurD(t), kind, ujungX: akhir[0], ujungY: akhir[1] })
    }
    return out
  }, [fokus, dekat, ujung, saring]) // eslint-disable-line

  // Garis "naik" ditarik dari kiri ke kanan. Keadaan akhirnya keadaan alami (garis
  // utuh tanpa dasharray), jadi gerak yang dimatikan tidak menyembunyikan apa pun.
  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg || !garis.length) return
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.fromTo(svg.querySelectorAll('.kr-sisi-naik'), { strokeDasharray: 1, strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.42, ease: 'power2.out', stagger: 0.02, clearProps: 'strokeDasharray,strokeDashoffset' })
    })
    return () => mm.revert()
  }, [fokus, saring])

  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPilih(id) }
  }

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="kr-graf block h-auto w-full min-w-[760px]" role="group"
      aria-label="Tangga karier: baris adalah rumpun, kolom adalah jenjang. Pilih satu profesi untuk melihat rinciannya.">
      {baris.map((r, i) => (
        <rect key={r.id} x={0} y={r.y} width={W} height={r.tinggi} className={`kr-pita ${i % 2 ? 'kr-pita-genap' : ''} ${tersaring(r.id) ? 'redup' : ''}`} />
      ))}
      {KOLOM_JUDUL.map((j, i) => (
        <text key={j} x={xSimpul(i) - 10} y={28} className="kr-kolom">{j}</text>
      ))}
      <g className="kr-arah" aria-hidden="true">
        <text x={W - 16} y={28} textAnchor="end" className="kr-arah-teks">Makin ke kanan, makin senior</text>
      </g>
      {[1, 2].map(i => <line key={i} x1={KIRI + i * KOLOM} x2={KIRI + i * KOLOM} y1={40} y2={H - 8} className="kr-batas" />)}
      {baris.map(r => {
        const [a, b] = pecahDua(r.label)
        const y = r.y + r.tinggi / 2
        return (
          <text key={r.id} x={20} y={b ? y - 9 : y} dy="0.35em" className={`kr-rumpun ${tersaring(r.id) ? 'redup' : ''}`}>
            <tspan x={20}>{a}</tspan>
            {b && <tspan x={20} dy="1.25em">{b}</tspan>}
          </text>
        )
      })}

      <g className="kr-lapis-garis" aria-hidden="true">
        {garis.map(g => <path key={g.key + g.kind} d={g.d} pathLength={1} className={`kr-sisi kr-sisi-${g.kind}`} />)}
        {garis.map(g => <circle key={'u' + g.key} cx={g.ujungX} cy={g.ujungY} r={2.6} className={`kr-ujung kr-ujung-${g.kind}`} />)}
      </g>

      {PROFESI.map(p => {
        const t = pos.get(p.id)!
        const pct = siap.get(p.id) ?? 0
        const keliling = 2 * Math.PI * (t.R + 4)
        const ini = p.id === fokus, dipilih = p.id === pilihan
        const jauh = (!!fokus && !ini && !dekat.has(p.id)) || tersaring(p.rumpun)
        const sejajar = !!fokus && dekat.has(p.id) && pos.get(fokus)!.kolom === t.kolom
        return (
          <g key={p.id} transform={`translate(${t.x},${t.y})`} tabIndex={0} role="button" aria-pressed={dipilih}
            aria-label={`${p.nama}, ${KOLOM_JUDUL[t.kolom].toLowerCase()}, kesiapan ${Math.round(pct * 100)} persen`}
            className={`kr-simpul ${jauh ? 'redup' : ''} ${dipilih ? 'dipilih' : ''} ${sejajar ? 'sejajar' : ''} ${ini || dekat.has(p.id) ? 'tampak' : ''}`}
            onClick={() => onPilih(p.id)} onKeyDown={e => onKey(e, p.id)}
            onPointerEnter={() => setSorot(p.id)} onPointerLeave={() => setSorot(null)}
            onFocus={() => setSorot(p.id)} onBlur={() => setSorot(null)}>
            <rect x={-t.R - 8} y={-14} width={KOLOM - 28} height={28} rx={8} className="kr-sasaran" />
            <circle r={t.R + 9} className="kr-halo" />
            <circle r={t.R + 4} className="kr-cincin-alas" />
            {pct > 0 && <circle r={t.R + 4} className="kr-cincin-isi" strokeDasharray={`${(keliling * pct).toFixed(2)} ${keliling.toFixed(2)}`} transform="rotate(-90)" />}
            <circle r={t.R} className="kr-inti" />
            <text data-label={p.id} x={t.R + 13} dy="0.35em" className="kr-label" fontSize={UKURAN_LABEL}>{label(p.id)}</text>
          </g>
        )
      })}
    </svg>
  )
}

import { useId } from 'react'
import { acak, benih, pohonRentang } from '../lib/langit'

/**
 * Lencana: emblem melingkar ala lencana misi (tradisi bordir lencana misi antariksa),
 * dibangkitkan dari benih teks. Nama ditulis melingkar di cincin luar, di tengahnya
 * rasi kecil yang garisnya pohon rentang minimum (tidak pernah bersilang), dan di bawah
 * rasi sederet bintang penanda tingkat. Benih sama = lencana sama, jadi lencana sebuah
 * misi atau profesi selalu sama di semua layar. Selalu aria-hidden: namanya juga ditulis
 * sebagai teks biasa di sebelahnya.
 */
export default function Lencana({ benih: teks, nama, tingkat = 0, ukuran = 96, nyala = false, kode, className = '' }: {
  benih: string; nama: string; tingkat?: 0 | 1 | 2 | 3; ukuran?: number; nyala?: boolean; kode?: string; className?: string
}) {
  const id = useId().replace(/:/g, '')
  const rnd = acak(benih('lencana:' + teks))
  // 5-7 bintang di dalam lingkaran dalam, cukup renggang supaya terbaca di ukuran kecil.
  const n = 5 + Math.floor(rnd() * 3)
  const titik: { x: number; y: number; r: number }[] = []
  for (let i = 0; titik.length < n && i < 200; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 23
    const p = { x: 50 + Math.cos(a) * r, y: 46 + Math.sin(a) * r * 0.8, r: 1.1 + rnd() * 1.6 }
    if (titik.every(q => Math.hypot(q.x - p.x, q.y - p.y) > 9)) titik.push(p)
  }
  const garis = pohonRentang(titik)
  const teksCincin = nama.toUpperCase()
  return (
    <svg viewBox="0 0 100 100" width={ukuran} height={ukuran} aria-hidden="true" className={`lencana ${nyala ? 'nyala' : ''} ${className}`}>
      <defs>
        <path id={`${id}-atas`} d="M 13 50 A 37 37 0 0 1 87 50" />
        <path id={`${id}-bawah`} d="M 15 50 A 35 35 0 0 0 85 50" />
      </defs>
      <circle cx="50" cy="50" r="48" className="lc-tepi" />
      <circle cx="50" cy="50" r="44.5" className="lc-cincin" />
      <circle cx="50" cy="50" r="31" className="lc-piring" />
      {Array.from({ length: 48 }, (_, i) => {
        const a = (i / 48) * Math.PI * 2, r0 = 31, r1 = i % 4 === 0 ? 34 : 32.6
        return <line key={i} x1={50 + Math.cos(a) * r0} y1={50 + Math.sin(a) * r0} x2={50 + Math.cos(a) * r1} y2={50 + Math.sin(a) * r1} className="lc-tik" />
      })}
      <text className="lc-nama"><textPath href={`#${id}-atas`} startOffset="50%" textAnchor="middle">{teksCincin.length > 30 ? teksCincin.slice(0, 29) + '.' : teksCincin}</textPath></text>
      {kode && <text className="lc-kode"><textPath href={`#${id}-bawah`} startOffset="50%" textAnchor="middle">{kode}</textPath></text>}
      {garis.map(([i, j]) => <line key={`${i}-${j}`} x1={titik[i].x} y1={titik[i].y} x2={titik[j].x} y2={titik[j].y} className="lc-garis" />)}
      {titik.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} className="lc-bintang" />)}
      {tingkat > 0 && Array.from({ length: tingkat }, (_, i) => {
        const x = 50 + (i - (tingkat - 1) / 2) * 7
        return <path key={i} d={`M${x} 67.5 l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z`} className="lc-tingkat" />
      })}
    </svg>
  )
}

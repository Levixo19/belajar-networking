// Sampul: gambar SVG yang DIBANGKITKAN dari sebuah teks benih (pola sampul.js di
// Belajar Ngoding, ditulis ulang untuk React dan untuk jaringan).
//
// Pemilik meminta gambar ("no one wants to see website full tulisan"), dan aplikasi
// ini wajib utuh tanpa internet, jadi gambarnya tidak diambil dari mana pun. Benih
// yang sama selalu menghasilkan gambar yang sama (FNV-1a + mulberry32), jadi sampul
// tahap Transport hari ini sama dengan bulan depan, dan dua tahap bertetangga tetap
// berbeda. Satu sampul per TAHAP: pindah tahap terasa pindah ruang.
//
// Warna: satu rona identitas per band (dan sedikit bergeser per tahap), ditemani
// aksen aplikasi (--primary) dan latar permukaan. Semua warna lewat var(), jadi
// sampul ikut tema tanpa digambar ulang; saturasi dan kecerahan rona dibaca dari
// --sampul-s / --sampul-l (tema terang digelapkan supaya tidak pudar jadi krem).
//
// HIASAN: aria-hidden, tidak bisa difokus, tidak pernah satu-satunya pembawa
// informasi. Teks yang ditaruh di atasnya wajib berdiri di atas lapisan pekat.
import { useId, type ReactNode } from 'react'

/** Rona dasar per band kurikulum (derajat HSL). Tahap dalam satu band bergeser beberapa derajat. */
const RONA_BAND: Record<string, number> = {
  panduan: 220, dasar: 196, menengah: 232, lanjut: 168, profesional: 205,
  khusus: 28, karier: 340, penunjang: 145, proyek: 12,
}
/** Tanda per tahap: isyarat pendek yang membuat sampul "terbaca" sebelum judulnya. */
const TANDA: Record<string, string> = {
  panduan: 'ABC', '00-fondasi': 'net', '01-model-referensi': 'OSI', '02-layer-fisik': 'L1', '03-data-link': 'L2',
  '04-network-layer': '/24', '05-transport': 'TCP', '06-aplikasi': 'DNS', '07-routing-lanjutan': 'BGP', '08-ipv6': 'v6',
  '09-nat-acl-firewall': 'ACL', '10-wireless': '802.11', '11-wan-vpn': 'VPN', '12-keamanan': 'sec', '13-linux-networking': 'ip a',
  '14-monitoring-troubleshooting': 'ping', '15-otomasi': 'API', '16-datacenter-cloud-sdn': 'SDN', '17-desain-arsitektur': 'HLD',
  '18-karier-sertifikasi': 'CCNA', '19-mikrotik': 'ROS', '20-proyek-akhir': 'v1.0', '21-ekosistem-profesi': 'role',
  '22-service-provider': 'MPLS', '23-jalur-vendor': 'Junos', lab: 'lab', referensi: 'RFC',
}
/** Rona per rumpun profesi, untuk panel profesi. */
export const RONA_RUMPUN: Record<string, number> = {
  inti: 196, infrastruktur: 205, keamanan: 350, operasi: 168, devops: 262, dukungan: 28, tatakelola: 45,
}

export function benih(teks: string): number {
  let h = 2166136261
  for (let i = 0; i < teks.length; i++) { h ^= teks.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}
/** mulberry32: PRNG kecil berbenih, cukup untuk tata letak hiasan. */
export function acak(awal: number) {
  let a = awal || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const r1 = (n: number) => Math.round(n * 10) / 10
const warnaRona = (h: number) => `hsl(${h} var(--sampul-s) var(--sampul-l))`

/** Rona tahap: rona band-nya + geser kecil dari urutan tahap, supaya tetangga tidak kembar. */
export function ronaTahap(tahap: string, band?: string): number {
  const dasar = RONA_BAND[band ?? ''] ?? benih(tahap) % 360
  return (dasar + ((benih(tahap) % 5) - 2) * 7 + 360) % 360
}
export const tandaTahap = (tahap: string) => TANDA[tahap]

type Ragam = 'topologi' | 'kisi' | 'gelombang' | 'paket' | 'mesh'
export const RAGAM: Ragam[] = ['topologi', 'kisi', 'gelombang', 'paket', 'mesh']

/** Lima ragam komposisi bertema jaringan. Sedikit bentuk besar: yang ramai berhenti terbaca sebagai satu benda. */
function gambar(ragam: Ragam, rng: () => number, w: number, h: number, utama: string): ReactNode[] {
  const out: ReactNode[] = []
  const m = Math.min(w, h)
  if (ragam === 'topologi') {
    // Topologi bintang: satu hub, beberapa simpul di cincin, satu jalur beraksen.
    const cx = w * (0.55 + rng() * 0.25), cy = h * (0.4 + rng() * 0.25)
    const n = 6 + Math.floor(rng() * 4)
    for (let i = 3; i >= 1; i--) out.push(<circle key={'c' + i} cx={r1(cx)} cy={r1(cy)} r={r1(m * 0.16 * i)} fill="none" style={{ stroke: utama }} strokeWidth={1} opacity={0.18 + 0.12 * (3 - i)} />)
    const aksen = Math.floor(rng() * n)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rng() * 0.4, r = m * (0.24 + rng() * 0.22)
      const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r
      out.push(<line key={'l' + i} x1={r1(cx)} y1={r1(cy)} x2={r1(x)} y2={r1(y)} style={{ stroke: i === aksen ? 'var(--primary)' : utama }} strokeWidth={i === aksen ? 2.4 : 1.2} opacity={i === aksen ? 0.95 : 0.5} />)
      out.push(<circle key={'n' + i} cx={r1(x)} cy={r1(y)} r={r1(4 + rng() * 5)} style={{ fill: i === aksen ? 'var(--primary)' : utama }} opacity={i === aksen ? 1 : 0.7} />)
    }
    out.push(<circle key="hub" cx={r1(cx)} cy={r1(cy)} r={r1(m * 0.07)} style={{ fill: utama }} />)
  } else if (ragam === 'kisi') {
    // Kisi sel: blok alamat atau port switch; beberapa menyala.
    const kolom = 9 + Math.floor(rng() * 5), s = w / kolom, baris = Math.ceil(h / s)
    for (let y = 0; y < baris; y++) for (let x = 0; x < kolom; x++) {
      const p = rng()
      if (p < 0.5) continue
      const nyala = p > 0.94
      out.push(<rect key={`${x}-${y}`} x={r1(x * s + s * 0.14)} y={r1(y * s + s * 0.14)} width={r1(s * 0.72)} height={r1(s * 0.72)} rx={r1(s * 0.18)}
        style={{ fill: nyala ? 'var(--primary)' : utama }} opacity={nyala ? 0.95 : r1(0.12 + (p - 0.5) * 1.1)} />)
    }
  } else if (ragam === 'gelombang') {
    // Gelombang sinyal berlapis: modulasi, frekuensi, kanal.
    const lapis = 5 + Math.floor(rng() * 3)
    for (let i = 0; i < lapis; i++) {
      const dasar = h * (0.25 + (i / lapis) * 0.8), amp = h * (0.05 + rng() * 0.09), fase = rng() * Math.PI * 2, frek = 1 + rng() * 2
      let d = `M0,${r1(dasar)}`
      for (let x = 0; x <= w; x += w / 32) d += ` L${r1(x)},${r1(dasar + Math.sin((x / w) * Math.PI * 2 * frek + fase) * amp)}`
      const aksen = i === lapis - 2
      out.push(<path key={i} d={d} fill="none" style={{ stroke: aksen ? 'var(--primary)' : utama }} strokeWidth={aksen ? 2.6 : 1.4} opacity={aksen ? 0.9 : 0.25 + i * 0.08} />)
    }
  } else if (ragam === 'paket') {
    // Paket yang melintas: persegi bersudut membulat, sebagian bertumpuk.
    const n = 6 + Math.floor(rng() * 4)
    for (let i = 0; i < n; i++) {
      const pw = w * (0.12 + rng() * 0.22), ph = pw * (0.45 + rng() * 0.3)
      const x = rng() * (w - pw * 0.4), y = rng() * (h - ph * 0.4)
      const aksen = i === n - 1
      out.push(<rect key={i} x={r1(x)} y={r1(y)} width={r1(pw)} height={r1(ph)} rx={r1(ph * 0.22)}
        transform={`rotate(${Math.round((rng() - 0.5) * 24)} ${r1(x + pw / 2)} ${r1(y + ph / 2)})`}
        style={{ fill: aksen ? 'var(--primary)' : utama }} opacity={aksen ? 0.9 : r1(0.16 + rng() * 0.34)} />)
    }
  } else {
    // Mesh: simpul acak yang terhubung ke dua tetangga terdekatnya.
    const n = 14 + Math.floor(rng() * 8)
    const p = Array.from({ length: n }, () => [rng() * w, rng() * h] as [number, number])
    const aksen = Math.floor(rng() * n)
    p.forEach(([x, y], i) => {
      const dekat = p.map((q, j) => [j, Math.hypot(q[0] - x, q[1] - y)] as const).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 2)
      for (const [j] of dekat)
        out.push(<line key={`e${i}-${j}`} x1={r1(x)} y1={r1(y)} x2={r1(p[j][0])} y2={r1(p[j][1])} style={{ stroke: i === aksen || j === aksen ? 'var(--primary)' : utama }} strokeWidth={i === aksen || j === aksen ? 2 : 1.1} opacity={i === aksen || j === aksen ? 0.9 : 0.45} />)
    })
    p.forEach(([x, y], i) => out.push(<circle key={'v' + i} cx={r1(x)} cy={r1(y)} r={i === aksen ? 6 : r1(2.5 + rng() * 3)} style={{ fill: i === aksen ? 'var(--primary)' : utama }} opacity={i === aksen ? 1 : 0.75} />))
  }
  return out
}

export interface SampulProps {
  /** Teks benih, mis. id tahap "05-transport" atau "profesi:network-engineer". */
  benih: string
  /** Rona identitas (derajat). Tanpa ini: rona dari benih. */
  rona?: number
  ragam?: Ragam
  /** Isyarat pendek di sudut ("L2", "/24", "BGP"). */
  tanda?: string
  lebar?: number
  tinggi?: number
  className?: string
}

/** SVG yang mengisi wadahnya (preserveAspectRatio slice). Hiasan saja. */
export function Sampul({ benih: teks, rona, ragam, tanda, lebar: w = 640, tinggi: h = 360, className = '' }: SampulProps) {
  const s = benih(teks)
  const rng = acak(s)
  const hue = rona ?? s % 360
  const pilih = ragam ?? RAGAM[s % RAGAM.length]
  // useId: dua sampul berbenih sama di satu halaman tetap punya alamat url(#..) berbeda.
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className={`sampul ${className}`} aria-hidden="true" focusable="false" data-ragam={pilih}>
      <defs>
        <linearGradient id={id + 'l'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: warnaRona(hue), stopOpacity: 0.32 }} />
          <stop offset="1" style={{ stopColor: 'var(--primary)', stopOpacity: 0.1 }} />
        </linearGradient>
        <filter id={id + 'b'} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 .08 0" />
        </filter>
      </defs>
      <rect width={w} height={h} style={{ fill: 'var(--surface-2)' }} />
      <rect width={w} height={h} fill={`url(#${id}l)`} />
      {gambar(pilih, rng, w, h, warnaRona(hue))}
      {tanda && <text x={r1(w * 0.05)} y={r1(h * 0.88)} className="sampul-tanda" fontSize={r1(h * 0.3)}>{tanda}</text>}
      <rect width={w} height={h} filter={`url(#${id}b)`} />
    </svg>
  )
}

/** Sampul satu tahap kurikulum: benih, rona, dan tanda dari tahapnya. */
export function SampulTahap({ tahap, band, tanpaTanda, ...lain }: { tahap: string; band?: string; tanpaTanda?: boolean } & Omit<SampulProps, 'benih' | 'rona' | 'tanda'>) {
  return <Sampul benih={tahap} rona={ronaTahap(tahap, band)} tanda={tanpaTanda ? undefined : tandaTahap(tahap)} {...lain} />
}

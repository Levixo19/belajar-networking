import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { stages, stageOfModule, linearModules } from '../lib/content'
import { bangunLangit, kotakRasi, bintangTerdekat, kutubKeXY, jariSpiral, type Bintang, type Langit } from '../lib/langit'
import { gsap, useGSAP, MOTION_OK } from '../lib/motion'

// Satu langit untuk seluruh aplikasi: dihitung sekali dari kurikulum.
let _langit: Langit | null = null
export function langitKurikulum(): Langit {
  if (!_langit) _langit = bangunLangit(stages.map(s => ({ id: s.id, title: s.title, modules: s.modules.map(m => ({ id: m.id, num: m.num, title: m.title, words: m.words })) })))
  return _langit
}

/** Kode pendek per tahap di cincin jam (sama dengan tanda sampul lama: L2, /24, BGP). */
export const KODE_TAHAP: Record<string, string> = {
  '00-fondasi': 'net', '01-model-referensi': 'OSI', '02-layer-fisik': 'L1', '03-data-link': 'L2', '04-network-layer': '/24',
  '05-transport': 'TCP', '06-aplikasi': 'DNS', '07-routing-lanjutan': 'BGP', '08-ipv6': 'v6', '09-nat-acl-firewall': 'ACL',
  '10-wireless': '802.11', '11-wan-vpn': 'VPN', '12-keamanan': 'sec', '13-linux-networking': 'ip a', '14-monitoring-troubleshooting': 'ping',
  '15-otomasi': 'API', '16-datacenter-cloud-sdn': 'SDN', '17-desain-arsitektur': 'HLD', '18-karier-sertifikasi': 'CCNA', '19-mikrotik': 'ROS',
  '20-proyek-akhir': 'v1.0', '21-ekosistem-profesi': 'role', '22-service-provider': 'MPLS', '23-jalur-vendor': 'Junos',
}

const S = 500                 // satuan peta -> unit viewBox
const LENSA = 74              // jari-jari lensa (unit viewBox)
const sudutDari = (x: number, y: number) => { let a = Math.atan2(x, -y) * 180 / Math.PI; return a < 0 ? a + 360 : a }

type Status = 'tuntas' | 'dibaca' | 'baru'
export interface PlanisferProps {
  progress: Record<string, string>
  /** Modul yang sedang dituju (bintang berikutnya): diberi cincin denyut. */
  tuju?: string
  /** 'penuh' = peta interaktif dengan lensa; 'mini' = peta kecil tanpa teks; 'plat' = potongan satu rasi. */
  mode?: 'penuh' | 'mini' | 'plat'
  /** Tahap yang disorot (mode mini) atau dipotong (mode plat). */
  sorot?: string | null
  /** Modul yang diberi tanda "Anda di sini" (mode plat). */
  sini?: string
  /** Bintang yang disorot (mis. modul dengan kartu jatuh tempo, modul yang punya alat). */
  terang?: string[]
  className?: string
  judul?: string
}

export default function Planisfer({ progress, tuju, mode = 'penuh', sorot = null, sini, terang, className = '', judul }: PlanisferProps) {
  const sorotan = useMemo(() => new Set(terang ?? []), [terang])
  const L = langitKurikulum()
  const nav = useNavigate()
  const svg = useRef<SVGSVGElement>(null)
  const lensa = useRef<SVGGElement>(null)
  const potong = useRef<SVGCircleElement>(null)
  const posLensa = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const kartu = useRef<HTMLDivElement>(null)
  const [dekat, setDekat] = useState<Bintang | null>(null)
  const [aktif, setAktif] = useState<string | null>(null)   // bintang yang fokus keyboard
  // u = unit viewBox per piksel layar. Huruf, bintang, dan cincin ditulis dalam PIKSEL
  // layar dikali u, jadi peta penuh, plat yang diperbesar, dan peta mini sama-sama tajam.
  // Diukur sesudah elemen menempel; tebakan awal dipakai untuk render pertama saja.
  const [u, setU] = useState(mode === 'mini' ? 5 : mode === 'plat' ? 0.3 : 1.35)

  const status = useCallback((id: string): Status => progress[id] === 'done' ? 'tuntas' : progress[id] ? 'dibaca' : 'baru', [progress])
  const bintangTuju = useMemo(() => L.bintang.find(b => b.id === tuju) ?? null, [L, tuju])

  // Sudut sejauh mana lintasan sudah ditempuh: sampai bintang yang dituju.
  const sudutJejak = useMemo(() => {
    if (!bintangTuju) return 0
    const r = L.rasi.find(x => x.id === bintangTuju.tahap)
    return r?.jam == null ? 0 : sudutDari(bintangTuju.x, bintangTuju.y)
  }, [L, bintangTuju])
  const jejak = useMemo(() => {
    const t: string[] = []
    for (let a = 0; a <= sudutJejak; a += 2) { const p = kutubKeXY(a, jariSpiral(a)); t.push(`${a === 0 ? 'M' : 'L'}${(p.x * S).toFixed(1)} ${(p.y * S).toFixed(1)}`) }
    return t.join(' ')
  }, [sudutJejak])

  // ---------- viewBox per mode
  const plat = mode === 'plat' && sorot ? L.rasi.find(r => r.id === sorot) : null
  const vb = useMemo(() => {
    if (plat) {
      const k = kotakRasi(plat, 0.07)
      // Rasio tetap 16:7 supaya kepala modul tidak melompat tinggi antar tahap.
      const cx = (k.x + k.w / 2) * S, cy = (k.y + k.h / 2) * S
      let w = k.w * S, h = k.h * S
      if (w / h < 16 / 7) w = h * 16 / 7; else h = w * 7 / 16
      return `${(cx - w / 2).toFixed(1)} ${(cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`
    }
    return '-585 -585 1170 1170'
  }, [plat])

  useLayoutEffect(() => {
    const el = svg.current
    if (!el) return
    const lebarVb = Number(vb.split(' ')[2])
    const ukur = () => { const w = el.getBoundingClientRect().width; if (w > 0) setU(lebarVb / w) }
    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(el)
    return () => ro.disconnect()
  }, [vb])

  // ---------- lensa: mengikuti kursor dengan pelembutan, parkir di bintang tujuan
  const interaktif = mode === 'penuh'
  useEffect(() => {
    if (!interaktif) return
    const el = svg.current
    if (!el) return
    const halus = window.matchMedia(MOTION_OK).matches
    const parkir = bintangTuju ?? L.bintang[0]
    const p = posLensa.current
    p.tx = parkir.x * S; p.ty = parkir.y * S
    if (!halus) { p.x = p.tx; p.y = p.ty }
    let raf = 0, jalan = true
    // Skala dan posisi layar peta di-cache; diukur ulang saat ukuran atau gulir berubah.
    let skala = 1, kiri = 0, atas = 0
    const ukur = () => { const r = el.getBoundingClientRect(); skala = r.width / 1170; kiri = r.left; atas = r.top }
    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(el)
    window.addEventListener('scroll', ukur, { passive: true })
    const tulis = () => {
      lensa.current?.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`)
      potong.current?.setAttribute('cx', p.x.toFixed(1)); potong.current?.setAttribute('cy', p.y.toFixed(1))
      // Kartu bintang menempel di samping lensa seperti label pada jendela bidik;
      // pindah ke kiri lensa bila mendekati tepi kanan layar. Kartu hidup di body
      // (portal, position: fixed) supaya tidak tertutup tirai teks hero.
      const k = kartu.current
      if (k) {
        const cx = kiri + (p.x + 585) * skala, cy = atas + (p.y + 585) * skala, jarak = LENSA * skala + 18
        const keKanan = cx + jarak + k.offsetWidth < window.innerWidth - 24
        const x = keKanan ? cx + jarak : cx - jarak - k.offsetWidth
        k.style.transform = `translate3d(${x.toFixed(1)}px, ${(cy - 34).toFixed(1)}px, 0)`
      }
    }
    const langkah = () => {
      if (!jalan) return
      p.x += (p.tx - p.x) * 0.16; p.y += (p.ty - p.y) * 0.16
      tulis()
      raf = requestAnimationFrame(langkah)
    }
    tulis()
    if (halus) raf = requestAnimationFrame(langkah)
    let terakhir: Bintang | null = null
    const keTitik = (e: PointerEvent) => {
      const m = el.getScreenCTM()
      if (!m) return null
      const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
      return { x: q.x, y: q.y }
    }
    const gerak = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const q = keTitik(e)
      if (!q) return
      // Lensa tidak keluar dari piringan peta.
      const r = Math.hypot(q.x, q.y), batas = S * 1.02
      const k = r > batas ? batas / r : 1
      p.tx = q.x * k; p.ty = q.y * k
      if (!halus) { p.x = p.tx; p.y = p.ty; tulis() }
      const b = bintangTerdekat(L.bintang, p.tx / S, p.ty / S, (LENSA - 4) / S)
      if (b !== terakhir) { terakhir = b; setDekat(b) }
    }
    const keluar = () => { p.tx = parkir.x * S; p.ty = parkir.y * S; terakhir = bintangTuju; setDekat(bintangTuju) }
    el.addEventListener('pointermove', gerak)
    el.addEventListener('pointerleave', keluar)
    setDekat(bintangTuju)
    return () => {
      jalan = false; cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('scroll', ukur)
      el.removeEventListener('pointermove', gerak); el.removeEventListener('pointerleave', keluar)
    }
  }, [interaktif, L, bintangTuju])

  // Fokus keyboard: lensa melompat ke bintang yang fokus.
  useEffect(() => {
    if (!aktif || !interaktif) return
    const b = L.bintang.find(x => x.id === aktif)
    if (!b) return
    posLensa.current.tx = b.x * S; posLensa.current.ty = b.y * S
    setDekat(b)
  }, [aktif, interaktif, L])

  const urutan = useMemo(() => L.bintang.map(b => b.id), [L])
  const tombolPanah = (e: React.KeyboardEvent) => {
    const kini = aktif ?? tuju ?? urutan[0]
    const i = urutan.indexOf(kini)
    let j = i
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = Math.min(urutan.length - 1, i + 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = Math.max(0, i - 1)
    else if (e.key === 'Home') j = 0
    else if (e.key === 'End') j = urutan.length - 1
    else return
    e.preventDefault()
    setAktif(urutan[j])
    requestAnimationFrame(() => svg.current?.querySelector<SVGAElement>(`[data-bintang="${CSS.escape(urutan[j])}"]`)?.focus())
  }

  // ---------- gerak masuk (keadaan akhir = keadaan alami; tanpa gerak, peta langsung utuh)
  useGSAP(() => {
    if (mode !== 'penuh') return
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      tl.from('.pf-kisi > *', { opacity: 0, duration: 0.9, stagger: 0.05 })
        .from('.pf-cincin-tik', { opacity: 0, duration: 0.6, stagger: { each: 0.004, from: 'start' } }, 0.1)
        .from('.pf-bintang-dot', { scale: 0, transformOrigin: '50% 50%', transformBox: 'fill-box', duration: 0.5, stagger: { each: 0.006, from: 'random' } }, 0.35)
        .from('.pf-jalur, .pf-jejak', { opacity: 0, duration: 1.2 }, 0.6)
        .from('.pf-label-rasi', { opacity: 0, y: 6, duration: 0.6, stagger: 0.03 }, 0.9)
    })
    return () => mm.revert()
  }, { scope: svg, dependencies: [mode] })

  const label = judul ?? 'Peta langit kurikulum'
  const ringkas = `${linearModules.filter(m => progress[m.id] === 'done').length} modul tuntas`

  return (
    <div className={`pf pf-${mode} ${className}`}>
      <svg ref={svg} viewBox={vb} className="pf-svg" role={interaktif ? 'group' : 'img'} style={{ ['--u' as string]: u }}
        aria-label={interaktif ? `${label}. ${ringkas}. Gunakan tombol panah untuk berpindah bintang, Enter untuk membuka modul.` : `${label}. ${ringkas}.`}
        onKeyDown={interaktif ? tombolPanah : undefined}
        onClick={interaktif ? e => {
          if ((e.target as Element).closest('a')) return
          if (dekat) nav(`/m/${encodeURI(dekat.id)}`)
        } : undefined}
        data-kursor={interaktif ? 'lensa' : undefined}>
        <defs>
          <radialGradient id="pf-cahaya">
            <stop offset="0" stopColor="var(--pf-nyala)" stopOpacity=".55" />
            <stop offset="1" stopColor="var(--pf-nyala)" stopOpacity="0" />
          </radialGradient>
          {interaktif && <clipPath id="pf-potong-lensa"><circle ref={potong} r={LENSA - 3} /></clipPath>}
        </defs>

        {/* Piringan dan kisi deklinasi/jam */}
        <circle r={S} className="pf-piring" />
        <g className="pf-kisi" aria-hidden="true">
          {[0.25, 0.5, 0.75].map(k => <circle key={k} r={S * k} className="pf-dek" />)}
          {Array.from({ length: 24 }, (_, j) => {
            const a = j * 15, p0 = kutubKeXY(a, 0.12), p1 = kutubKeXY(a, 1)
            return <line key={j} x1={p0.x * S} y1={p0.y * S} x2={p1.x * S} y2={p1.y * S} className={j % 6 === 0 ? 'pf-jam pf-jam-kuat' : 'pf-jam'} />
          })}
        </g>

        {/* Sorotan sektor (menu Kurikulum) */}
        {mode === 'mini' && sorot && (() => {
          const r = L.rasi.find(x => x.id === sorot)
          if (!r || r.jam == null) return null
          const a0 = r.jam * 15, a1 = a0 + 15, p0 = kutubKeXY(a0, 1), p1 = kutubKeXY(a1, 1)
          return <path d={`M0 0 L${p0.x * S} ${p0.y * S} A${S} ${S} 0 0 1 ${p1.x * S} ${p1.y * S} Z`} className="pf-sektor" />
        })()}

        {/* Bintang latar (hiasan) */}
        <g className="pf-latar" aria-hidden="true">
          {L.latar.map((b, i) => <circle key={i} cx={b.x * S} cy={b.y * S} r={Math.max(0.6, b.r * S)} opacity={b.o} />)}
        </g>

        {/* Cincin derajat: tik 1/5/15 derajat, nomor jam, kode tahap */}
        {mode !== 'plat' && (
          <g className="pf-cincin" aria-hidden="true">
            <circle r={S} className="pf-tepi" />
            <circle r={S + 34} className="pf-tepi" />
            {Array.from({ length: 360 }, (_, d) => {
              const pjg = d % 15 === 0 ? 16 : d % 5 === 0 ? 9 : 4
              const p0 = kutubKeXY(d, (S + 34) / S), p1 = kutubKeXY(d, (S + 34 - pjg) / S)
              return <line key={d} x1={p0.x * S} y1={p0.y * S} x2={p1.x * S} y2={p1.y * S} className={`pf-cincin-tik ${d % 15 === 0 ? 'kuat' : ''}`} />
            })}
            {mode === 'penuh' && L.rasi.filter(r => r.jam != null).map(r => {
              const p = kutubKeXY(r.sudut, (S + 52) / S)
              const q = kutubKeXY(r.sudut, (S + 17) / S)
              return (
                <g key={r.id}>
                  <text x={p.x * S} y={p.y * S} className="pf-jam-no" textAnchor="middle" dominantBaseline="central">{String(r.jam).padStart(2, '0')}</text>
                  <text x={q.x * S} y={q.y * S} className="pf-jam-kode" textAnchor="middle" dominantBaseline="central"
                    transform={`rotate(${r.sudut > 90 && r.sudut < 270 ? r.sudut + 180 : r.sudut} ${q.x * S} ${q.y * S})`}>{KODE_TAHAP[r.id]}</text>
                </g>
              )
            })}
          </g>
        )}

        {/* Lintasan belajar: spiral putus-putus; bagian yang sudah ditempuh tebal */}
        <path d={L.spiral.replace(/(-?\d+\.\d+) (-?\d+\.\d+)/g, (_, x, y) => `${(Number(x) * S).toFixed(1)} ${(Number(y) * S).toFixed(1)}`)} className="pf-jalur" />
        {jejak && <path d={jejak} className="pf-jejak" />}

        {/* Rasi: garis asterisme lalu bintangnya */}
        {L.rasi.map(r => {
          const redup = (mode === 'mini' || mode === 'plat') && sorot && r.id !== sorot
          return (
            <g key={r.id} className={`pf-rasi ${redup ? 'redup' : ''} ${sorot === r.id ? 'sorot' : ''}`}>
              {r.garis.map(([i, j]) => {
                const a = r.bintang[i], b = r.bintang[j]
                const nyala = status(a.id) === 'tuntas' && status(b.id) === 'tuntas'
                return <line key={`${i}-${j}`} x1={a.x * S} y1={a.y * S} x2={b.x * S} y2={b.y * S} className={nyala ? 'pf-asterisme pf-asterisme-nyala' : 'pf-asterisme'} />
              })}
              {r.bintang.map(b => {
                const st = status(b.id)
                // b.r*S/1,2 = jari-jari layar 1,8 sampai 4,6 px; plat sedikit lebih besar.
                const cx = b.x * S, cy = b.y * S, rr = (b.r * S / 1.2) * u * (mode === 'plat' ? 1.35 : 1)
                const isi = (
                  <>
                    {st === 'tuntas' && <circle cx={cx} cy={cy} r={rr * 4.2} fill="url(#pf-cahaya)" className="pf-halo" style={{ ['--d' as string]: `${(b.x * 7 + b.y * 3) % 4}s` }} />}
                    <circle cx={cx} cy={cy} r={rr} className={`pf-bintang-dot ${st}`} />
                    {b.id === tuju && mode !== 'mini' && <circle cx={cx} cy={cy} r={rr + 6 * u} className="pf-tuju" />}
                    {b.id === sini && <circle cx={cx} cy={cy} r={rr + 7 * u} className="pf-sini" />}
                    {sorotan.has(b.id) && <circle cx={cx} cy={cy} r={rr + 4.5 * u} className="pf-terang" />}
                  </>
                )
                if (!interaktif) return <g key={b.id}>{isi}</g>
                const st2 = st === 'tuntas' ? 'sudah tuntas' : st === 'dibaca' ? 'sedang dibaca' : 'belum dibaca'
                return (
                  <a key={b.id} href={`#/m/${encodeURI(b.id)}`} data-bintang={b.id} className="pf-bintang"
                    tabIndex={(aktif ?? tuju ?? urutan[0]) === b.id ? 0 : -1}
                    aria-label={`Modul ${b.num || ''} ${b.title}, ${r.title}, ${st2}`}
                    onFocus={() => setAktif(b.id)}>
                    <circle cx={cx} cy={cy} r={Math.max(9 * u, rr + 5 * u)} className="pf-sasaran" />
                    {isi}
                  </a>
                )
              })}
              {(mode === 'penuh' || (mode === 'plat' && r.id === sorot)) && <LabelRasi r={r} />}
            </g>
          )
        })}

        {/* Bintang kutub: Panduan */}
        {mode !== 'plat' && (
          <g className="pf-kutub" aria-hidden={!interaktif}>
            <path d="M0 -13 V13 M-13 0 H13" className="pf-kutub-silang" />
            <circle r={3.4 * u} className="pf-kutub-dot" />
            {mode === 'penuh' && <text y={-22} className="pf-label-rasi kecil" textAnchor="middle">Panduan</text>}
          </g>
        )}

        {/* Plat: nomor modul di samping setiap bintang rasi, judul penuh untuk "Anda di sini" */}
        {plat && plat.bintang.map(b => (
          <text key={b.id} x={b.x * S + (b.r * S / 1.2) * u * 1.35 + 7 * u} y={b.y * S} dominantBaseline="central" className={`pf-label-modul ${b.id === sini ? 'sini' : ''}`}>
            {b.num}
          </text>
        ))}

        {/* Lensa teleskop: label modul hanya tampak di dalam lensa */}
        {interaktif && (
          <>
            <g clipPath="url(#pf-potong-lensa)" className="pf-detail" aria-hidden="true">
              {Array.from({ length: 72 }, (_, j) => {
                const a = j * 5, p0 = kutubKeXY(a, 0.12), p1 = kutubKeXY(a, 1)
                return <line key={j} x1={p0.x * S} y1={p0.y * S} x2={p1.x * S} y2={p1.y * S} className="pf-jam-halus" />
              })}
              {[0.125, 0.375, 0.625, 0.875].map(k => <circle key={k} r={S * k} className="pf-dek-halus" />)}
              {L.bintang.map(b => (
                <text key={b.id} x={b.x * S + b.r * S + 6} y={b.y * S + 3.5} className="pf-label-modul">{b.num || b.title.slice(0, 14)}</text>
              ))}
            </g>
            <g ref={lensa} className="pf-lensa" aria-hidden="true">
              <circle r={LENSA} className="pf-lensa-kaca" />
              <circle r={LENSA} className="pf-lensa-tepi" />
              {[0, 90, 180, 270].map(a => {
                const p0 = kutubKeXY(a, (LENSA - 2) / S), p1 = kutubKeXY(a, (LENSA - 16) / S)
                return <line key={a} x1={p0.x * S} y1={p0.y * S} x2={p1.x * S} y2={p1.y * S} className="pf-lensa-tik" />
              })}
              {Array.from({ length: 36 }, (_, j) => {
                const a = j * 10, p0 = kutubKeXY(a, LENSA / S), p1 = kutubKeXY(a, (LENSA + (j % 3 === 0 ? 7 : 4)) / S)
                return <line key={j} x1={p0.x * S} y1={p0.y * S} x2={p1.x * S} y2={p1.y * S} className="pf-lensa-skala" />
              })}
            </g>
          </>
        )}
      </svg>

      {/* Kartu bintang: apa yang sedang ditunjuk lensa */}
      {interaktif && createPortal(<KartuBintang ref={kartu} b={dekat} status={dekat ? status(dekat.id) : 'baru'} tuju={!!dekat && dekat.id === tuju} />, document.body)}
    </div>
  )
}

/** Nama rasi searah jari-jari. Separuh kanan peta dibaca ke arah luar, separuh kiri ke
 *  arah dalam, supaya teks tidak pernah terbalik. Jangkar memilih start/end sehingga nama
 *  selalu menempati sisi yang kosong (luar atau dalam pita bintangnya). */
function LabelRasi({ r }: { r: { nama: string; sudut: number; label: { x: number; y: number }; labelArah: 'luar' | 'dalam' | null } }) {
  const x = r.label.x * S, y = r.label.y * S
  if (!r.labelArah) return <text x={x} y={y} className="pf-label-rasi" textAnchor="middle" dominantBaseline="central">{r.nama}</text>
  const kanan = r.sudut > 0 && r.sudut < 180
  const putar = kanan ? r.sudut - 90 : r.sudut + 90
  const jangkar = kanan !== (r.labelArah === 'dalam') ? 'start' : 'end'
  return (
    <text x={x} y={y} className="pf-label-rasi" textAnchor={jangkar} dominantBaseline="central" transform={`rotate(${putar.toFixed(2)} ${x.toFixed(1)} ${y.toFixed(1)})`}>
      {r.nama}
    </text>
  )
}

function KartuBintang({ b, status, tuju, ref }: { b: Bintang | null; status: Status; tuju: boolean; ref: React.Ref<HTMLDivElement> }) {
  if (!b) return <div ref={ref} className="pf-kartu" hidden />
  const m = linearModules.find(x => x.id === b.id)
  const st = stageOfModule.get(b.id)
  const ket = status === 'tuntas' ? 'Sudah tuntas' : status === 'dibaca' ? 'Sedang dibaca' : tuju ? 'Bintang berikutnya' : 'Belum dibaca'
  return (
    <div ref={ref} className="pf-kartu" aria-live="polite">
      <div className="pf-kartu-atas">
        <span className={`pf-kartu-titik ${status}`} aria-hidden="true" />
        <span>{ket}</span>
        {st && <span className="pf-kartu-rasi">{st.title}</span>}
      </div>
      <div className="pf-kartu-judul">{b.num && <span className="pf-kartu-no">{b.num}</span>} {b.title}</div>
      {m && <div className="pf-kartu-meta">{m.readMin} menit baca, {m.cards.length} kartu latihan</div>}
    </div>
  )
}

/** Tanda status modul yang sama dengan bintang di peta: tuntas (penuh), dibaca (bercincin), belum (redup). */
export function TandaBintang({ status, size = 12 }: { status: 'tuntas' | 'dibaca' | 'baru'; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" className={`tanda-bintang ${status}`}>
      {status === 'tuntas' && <circle cx="6" cy="6" r="5.4" className="tb-halo" />}
      <circle cx="6" cy="6" r={status === 'baru' ? 2.2 : 3} className="tb-inti" />
      {status === 'dibaca' && <circle cx="6" cy="6" r="5" className="tb-cincin" />}
    </svg>
  )
}

import type { ReactNode } from 'react'
import { useInView } from '../lib/useInView'

/* Pembungkus diagram: kartu bergaya + judul + SVG responsif + animasi masuk. */
export function Fig({ title, sub, w, h, children, tall }: {
  title?: string; sub?: string; w: number; h: number; children: ReactNode; tall?: boolean
}) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <figure ref={ref} className={`dg-fig ${inView ? 'dg-in' : ''}`}>
      {title && <figcaption className="dg-cap"><span className="dg-cap-t">{title}</span>{sub && <span className="dg-cap-s">{sub}</span>}</figcaption>}
      <div className="dg-canvas" style={tall ? undefined : { maxHeight: 'none' }}>
        <svg className="dg" viewBox={`0 0 ${w} ${h}`} width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label={title || 'diagram'}>
          <defs>
            {/* gP/gC dipertahankan sebagai id, tapi isinya warna datar (tanpa gradient dekoratif) */}
            <linearGradient id="gP" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--primary)" /><stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
            <linearGradient id="gC" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--accent)" /><stop offset="100%" stopColor="var(--accent)" />
            </linearGradient>
            <linearGradient id="gA" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--accent)" /><stop offset="100%" stopColor="var(--accent-2)" />
            </linearGradient>
            <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
            </marker>
          </defs>
          {children}
        </svg>
      </div>
    </figure>
  )
}

/* Kotak berlabel. */
export function Box({ x, y, w, h, label, sub, tone = 'n', r = 10, fs = 12, onClick, active }: {
  x: number; y: number; w: number; h: number; label?: string; sub?: string
  tone?: 'n' | 'p' | 'a' | 'ok' | 'warn' | 'no' | 'grad' | 'dark'; r?: number; fs?: number
  onClick?: () => void; active?: boolean
}) {
  const cx = x + w / 2
  return (
    <g className={`dg-box t-${tone} ${onClick ? 'dg-click' : ''} ${active ? 'dg-active' : ''}`} onClick={onClick}>
      <rect x={x} y={y} width={w} height={h} rx={r} />
      {label && <text x={cx} y={sub ? y + h / 2 - 5 : y + h / 2} className="dg-lb" style={{ fontSize: fs, textAnchor: 'middle' }}>{label}</text>}
      {sub && <text x={cx} y={y + h / 2 + 11} className="dg-sb">{sub}</text>}
    </g>
  )
}

/* Garis panah lurus / siku. */
export function Arrow({ d, tone = 'p', dash, anim, label, lx, ly, both }: {
  d: string; tone?: 'p' | 'a' | 'n' | 'ok' | 'no' | 'warn'; dash?: boolean; anim?: boolean
  label?: string; lx?: number; ly?: number; both?: boolean
}) {
  return (
    <g className={`dg-arr a-${tone}`}>
      <path d={d} markerEnd="url(#ar)" markerStart={both ? 'url(#ar)' : undefined}
        className={`${dash ? 'dg-dash' : ''} ${anim ? 'dg-flow' : ''}`} />
      {label && <text x={lx} y={ly} className="dg-sb dg-arr-lb">{label}</text>}
    </g>
  )
}

/* Teks bebas. */
export function T({ x, y, children, cls = '', anchor = 'middle', size }: {
  x: number; y: number; children: ReactNode; cls?: string; anchor?: 'start' | 'middle' | 'end'; size?: number
}) {
  return <text x={x} y={y} className={`dg-tx ${cls}`} style={{ textAnchor: anchor, ...(size ? { fontSize: size } : {}) }}>{children}</text>
}

/* Ikon perangkat sederhana (vektor, bukan emoji) di titik tengah (cx, cy). */
export function Device({ cx, cy, kind, label, s = 1 }: {
  cx: number; cy: number; kind: 'pc' | 'laptop' | 'server' | 'router' | 'switch' | 'ap' | 'cloud' | 'phone' | 'firewall'; label?: string; s?: number
}) {
  const g = (inner: ReactNode) => (
    <g className={`dg-dev dev-${kind}`} transform={`translate(${cx} ${cy}) scale(${s})`}>{inner}
      {label && <text x={0} y={30} className="dg-sb">{label}</text>}
    </g>
  )
  switch (kind) {
    case 'pc': return g(<><rect x={-20} y={-18} width={40} height={28} rx={4} /><rect x={-8} y={10} width={16} height={4} rx={1.5} className="dg-fill-2" /><rect x={-14} y={-13} width={28} height={18} rx={2} className="dg-screen" /></>)
    case 'laptop': return g(<><path d="M-20-16h40v24h-40z" rx={3} /><path d="M-26 8h52l3 6h-58z" className="dg-fill-2" /><rect x={-16} y={-12} width={32} height={16} rx={2} className="dg-screen" /></>)
    case 'phone': return g(<><rect x={-11} y={-19} width={22} height={38} rx={5} /><rect x={-8} y={-15} width={16} height={27} rx={2} className="dg-screen" /><circle cx={0} cy={15} r={2} className="dg-fill-2" /></>)
    case 'server': return g(<><rect x={-15} y={-22} width={30} height={44} rx={4} /><rect x={-10} y={-17} width={20} height={5} rx={1.5} className="dg-fill-2" /><rect x={-10} y={-8} width={20} height={5} rx={1.5} className="dg-fill-2" /><rect x={-10} y={1} width={20} height={5} rx={1.5} className="dg-fill-2" /><circle cx={0} cy={14} r={2.5} className="dg-led" /></>)
    case 'router': return g(<><circle cx={0} cy={0} r={20} /><path d="M-9-4h18M-9 4h18M-5-9l-4 5 4 5M5 9l4-5-4-5" className="dg-glyph" /></>)
    case 'switch': return g(<><rect x={-24} y={-11} width={48} height={22} rx={5} /><path d="M-12-4h24M-12 4h24" className="dg-glyph" /><circle cx={-16} cy={0} r={2} className="dg-led" /></>)
    case 'firewall': return g(<><path d="M0-22 18-14v13c0 9-8 16-18 21-10-5-18-12-18-21v-13z" /><path d="M-7 0l5 5 9-10" className="dg-glyph" /></>)
    case 'ap': return g(<><rect x={-16} y={2} width={32} height={12} rx={4} /><path d="M-14-4a19 19 0 0 1 28 0M-8-10a11 11 0 0 1 16 0" className="dg-wave" /><circle cx={0} cy={8} r={2} className="dg-led" /></>)
    case 'cloud': return g(<><path d="M-30 10a12 12 0 0 1 3-23 17 17 0 0 1 32-5 13 13 0 0 1 4 25z" /></>)
  }
}

/* Baris label kiri (untuk stack layer). */
export function Rows({ x, y, w, rh, gap = 6, items, onPick, active }: {
  x: number; y: number; w: number; rh: number; gap?: number
  items: { label: string; sub?: string; tone?: any }[]
  onPick?: (i: number) => void; active?: number
}) {
  return <>{items.map((it, i) => (
    <Box key={i} x={x} y={y + i * (rh + gap)} w={w} h={rh} label={it.label} sub={it.sub}
      tone={it.tone} onClick={onPick ? () => onPick(i) : undefined} active={active === i} />
  ))}</>
}

/**
 * `track` dan `bar` hanya perlu diisi kalau cincinnya dipasang di atas
 * permukaan berwarna — di hero, misalnya, warna bawaan yang mengambil
 * --primary tenggelam di dalam gradient yang juga ungu.
 */
export default function ProgressRing({ value, size = 40, stroke = 4, children,
  track = 'var(--surface-3)', bar = 'var(--primary)' }:
  { value: number; size?: number; stroke?: number; children?: React.ReactNode
    track?: string; bar?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.max(0, Math.min(1, value)))
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={bar} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset .5s cubic-bezier(.2,.7,.3,1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{children}</div>
    </div>
  )
}

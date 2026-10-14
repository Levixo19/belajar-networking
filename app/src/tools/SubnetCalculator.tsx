import { useMemo, useState } from 'react'

function parseIp(s: string): number | null {
  const p = s.trim().split('.')
  if (p.length !== 4) return null
  let n = 0
  for (const o of p) {
    if (!/^\d{1,3}$/.test(o)) return null
    const v = parseInt(o, 10)
    if (v > 255) return null
    n = (n << 8) | v
  }
  return n >>> 0
}
const toIp = (n: number) => [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.')
const toBin = (n: number) => [24, 16, 8, 0].map(s => ((n >>> s) & 255).toString(2).padStart(8, '0')).join('.')

export default function SubnetCalculator() {
  const [ip, setIp] = useState('192.168.10.75')
  const [prefix, setPrefix] = useState(26)

  const res = useMemo(() => {
    const addr = parseIp(ip)
    if (addr === null) return null
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
    const network = (addr & mask) >>> 0
    const broadcast = (network | (~mask >>> 0)) >>> 0
    const total = prefix >= 31 ? (prefix === 31 ? 2 : 1) : Math.pow(2, 32 - prefix)
    const usable = prefix >= 31 ? total : Math.max(0, total - 2)
    const first = prefix >= 31 ? network : (network + 1) >>> 0
    const last = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0
    return { addr, mask, network, broadcast, total, usable, first, last }
  }, [ip, prefix])

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-[17px] font-semibold tracking-[-0.02em]">Kalkulator Subnet</h3>
        <span className="text-[12px] text-faint">IPv4 · CIDR</span>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-5">
        <label className="flex-1 min-w-[180px]">
          <span className="text-[12px] font-medium text-faint">Alamat IP</span>
          <input value={ip} onChange={e => setIp(e.target.value)}
            className={`mt-1 w-full bg-surface-2 border rounded-lg px-3 py-2 font-mono text-sm outline-none focus:border-[var(--primary)] ${res ? 'border-app' : 'border-[var(--no)]'}`} />
        </label>
        <label className="w-full sm:w-auto">
          <span className="text-[12px] font-medium text-faint">Prefix /{prefix}</span>
          <div className="flex items-center gap-3 mt-1">
            <input type="range" min={0} max={32} value={prefix} onChange={e => setPrefix(+e.target.value)}
              className="w-40 accent-[var(--primary)]" />
            <span className="font-mono text-sm w-8 tabular-nums">/{prefix}</span>
          </div>
        </label>
      </div>

      {!res ? (
        <div className="text-[13px] text-[var(--no)]">Format IP tidak valid (contoh: 192.168.1.10).</div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
            <Stat label="Network" value={toIp(res.network)} accent />
            <Stat label="Broadcast" value={toIp(res.broadcast)} />
            <Stat label="Host pertama" value={toIp(res.first)} />
            <Stat label="Host terakhir" value={toIp(res.last)} />
            <Stat label="Subnet mask" value={toIp(res.mask)} />
            <Stat label="Wildcard" value={toIp(~res.mask >>> 0)} />
            <Stat label="Total alamat" value={res.total.toLocaleString('id')} />
            <Stat label="Host usable" value={res.usable.toLocaleString('id')} highlight />
          </div>

          <div className="rounded-lg border border-[color-mix(in_srgb,var(--text)_10%,transparent)] bg-[var(--hl-bg)] p-3 overflow-x-auto">
            <div className="mb-2 text-[12px] text-[#8a8a8a]">Biner: <span className="text-[var(--hl-str)]">bit network ({prefix})</span>, <span className="text-[var(--hl-num)]">bit host ({32 - prefix})</span></div>
            <BinaryView value={res.addr} prefix={prefix} />
            <div className="mt-1 text-[11px] text-[#8a8a8a]">alamat</div>
            <div className="mt-2"><BinaryView value={res.mask} prefix={prefix} maskMode /></div>
            <div className="mt-1 text-[11px] text-[#8a8a8a]">mask</div>
          </div>
          <div className="mt-3 text-[13px] text-muted">
            Subnet berikutnya mulai di <span className="font-mono">{toIp((res.broadcast + 1) >>> 0)}</span>.
          </div>
        </>
      )}
    </div>
  )
}

function BinaryView({ value, prefix, maskMode }: { value: number; prefix: number; maskMode?: boolean }) {
  const bits = toBin(value).split('')
  let bitIdx = 0
  return (
    <div className="font-mono text-[13px] sm:text-sm flex flex-wrap gap-x-0.5">
      {bits.map((ch, i) => {
        if (ch === '.') return <span key={i} className="text-[#6b6b6b]">.</span>
        const isNet = bitIdx < prefix
        bitIdx++
        return <span key={i} style={{ color: maskMode ? (isNet ? 'var(--hl-str)' : '#6b6b6b') : (isNet ? 'var(--hl-str)' : 'var(--hl-num)') }}>{ch}</span>
      })}
    </div>
  )
}

function Stat({ label, value, accent, highlight }: { label: string; value: string; accent?: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-2.5 border ${highlight ? 'bg-[var(--primary-soft)] border-transparent' : 'bg-surface-2 border-app'}`}>
      <div className="text-[12px] font-medium text-faint">{label}</div>
      <div className={`font-mono text-[13px] sm:text-sm mt-0.5 truncate ${accent ? 'font-semibold' : highlight ? 'text-primary font-semibold' : ''}`}>{value}</div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { LaptopIcon, ShareNetworkIcon, HardDrivesIcon, GlobeHemisphereWestIcon, DesktopTowerIcon, CaretLeftIcon, CaretRightIcon, type Icon } from '@phosphor-icons/react'

interface Step { node: number; title: string; desc: string; stack: string[] }
const NODES: { Icon: Icon; label: string }[] = [
  { Icon: LaptopIcon, label: 'PC' }, { Icon: ShareNetworkIcon, label: 'Switch' }, { Icon: HardDrivesIcon, label: 'Router A' },
  { Icon: GlobeHemisphereWestIcon, label: 'Internet' }, { Icon: HardDrivesIcon, label: 'Router B' }, { Icon: DesktopTowerIcon, label: 'Server' },
]
const STEPS: Step[] = [
  { node: 0, title: 'L7 · Aplikasi', desc: 'Browser membuat permintaan HTTP GET (data mentah).', stack: ['HTTP data'] },
  { node: 0, title: 'L4 · Transport', desc: 'TCP menambahkan header (port sumber, tujuan 443, seq). Jadi segment.', stack: ['TCP', 'HTTP data'] },
  { node: 0, title: 'L3 · Network', desc: 'IP menambah header (IP sumber & tujuan server). Jadi packet.', stack: ['IP', 'TCP', 'HTTP data'] },
  { node: 0, title: 'L2 · Data Link', desc: 'Ethernet menambah header MAC (tujuan = MAC gateway, dari ARP). Jadi frame.', stack: ['Eth', 'IP', 'TCP', 'HTTP data'] },
  { node: 1, title: 'Switch', desc: 'Switch membaca MAC tujuan, meneruskan frame ke port gateway (tak sentuh IP).', stack: ['Eth', 'IP', 'TCP', 'HTTP data'] },
  { node: 2, title: 'Router A', desc: 'Router buka L2, baca IP tujuan → pilih rute (longest prefix match), TTL−1, bungkus L2 baru untuk hop berikut.', stack: ['Eth*', 'IP', 'TCP', 'HTTP data'] },
  { node: 3, title: 'Internet', desc: 'Melintasi banyak router; tiap hop mengganti header L2 & TTL−1. IP tujuan tetap.', stack: ['Eth*', 'IP', 'TCP', 'HTTP data'] },
  { node: 4, title: 'Router B', desc: 'Router terakhir meneruskan ke jaringan server.', stack: ['Eth*', 'IP', 'TCP', 'HTTP data'] },
  { node: 5, title: 'Server · dekapsulasi', desc: 'Server membuka tiap lapisan (L2→L3→L4→L7) dan menyerahkan HTTP ke aplikasi web.', stack: ['HTTP data'] },
]
// Warna data per header: satu warna per lapisan, aman di kedua tema (teks memakai --fg-contrast)
const COLORS: Record<string, string> = { 'Eth': 'var(--primary)', 'Eth*': 'var(--primary)', 'IP': 'var(--accent)', 'TCP': 'var(--warn)', 'HTTP data': 'var(--text-muted)' }

export default function PacketJourney() {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const step = STEPS[i]

  useEffect(() => {
    if (!playing) return
    if (i >= STEPS.length - 1) { setPlaying(false); return }
    const t = setTimeout(() => setI(x => x + 1), 1900)
    return () => clearTimeout(t)
  }, [playing, i])

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h3 className="text-[17px] font-semibold tracking-[-0.02em]">Perjalanan Paket & Enkapsulasi</h3>
        <span className="text-[12px] text-faint">langkah {i + 1}/{STEPS.length}</span>
      </div>
      <div className="text-[13px] text-primary font-semibold mb-4">{step.title}</div>

      {/* Jalur node */}
      <div className="relative rounded-lg bg-surface-2 border border-app p-4 mb-4">
        <div className="flex justify-between items-center">
          {NODES.map((n, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 relative z-10" style={{ flex: 1 }}>
              <div className={`w-11 h-11 rounded-[10px] grid place-items-center border transition duration-300 ${
                idx === step.node ? 'scale-110 border-[var(--primary)] bg-[var(--primary-soft)] text-primary' :
                idx < step.node ? 'border-[var(--primary-border)] bg-surface text-[var(--text)]' : 'border-app bg-surface text-faint'}`}>
                <n.Icon size={20} weight="regular" aria-hidden="true" />
              </div>
              <span className="text-[10px] sm:text-[11px] text-faint text-center">{n.label}</span>
            </div>
          ))}
          <div className="absolute top-[26px] left-[8%] right-[8%] h-0.5 bg-[var(--border-strong)] -z-0" />
        </div>
      </div>

      {/* Stack enkapsulasi */}
      <div className="grid grid-cols-2 gap-4 items-center">
        <div>
          <div className="text-[12px] font-medium text-faint mb-2">Isi paket sekarang</div>
          <div className="flex items-stretch rounded-lg overflow-hidden border border-app text-[11px] font-mono font-semibold text-[var(--fg-contrast)]">
            {step.stack.map((h, k) => (
              <div key={k} className="px-2 py-2 whitespace-nowrap" style={{ background: COLORS[h] || 'var(--text-faint)' }}>{h}</div>
            ))}
          </div>
          <div className="text-[11px] text-faint mt-1">header ditambah dari kiri saat turun stack; dibuka saat naik</div>
        </div>
        <p className="text-[13px] text-muted leading-relaxed">{step.desc}</p>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button className="btn" onClick={() => { setI(0); setPlaying(false) }}>Reset</button>
        <button className="btn btn-icon" aria-label="Langkah sebelumnya" disabled={i === 0} onClick={() => setI(x => Math.max(0, x - 1))}><CaretLeftIcon size={16} /></button>
        <button className="btn btn-primary flex-1" onClick={() => { if (i >= STEPS.length - 1) setI(0); setPlaying(p => !p) }}>
          {playing ? 'Jeda' : i >= STEPS.length - 1 ? 'Ulangi' : 'Putar'}
        </button>
        <button className="btn btn-icon" disabled={i >= STEPS.length - 1} aria-label="Langkah berikutnya" onClick={() => setI(x => Math.min(STEPS.length - 1, x + 1))}><CaretRightIcon size={16} /></button>
      </div>
    </div>
  )
}

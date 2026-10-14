import { useEffect, useState } from 'react'
import { LaptopIcon, DesktopTowerIcon } from '@phosphor-icons/react'

interface Step { dir: 'r' | 'l'; label: string; note: string; cState: string; sState: string }
const STEPS: Step[] = [
  { dir: 'r', label: 'SYN · seq=0',         note: 'Klien memulai: kirim SYN dengan sequence number awal (ISN).', cState: 'SYN-SENT', sState: 'LISTEN' },
  { dir: 'l', label: 'SYN-ACK · seq=0 ack=1', note: 'Server balas SYN-ACK: mengakui SYN klien & kirim ISN sendiri.', cState: 'SYN-SENT', sState: 'SYN-RCVD' },
  { dir: 'r', label: 'ACK · ack=1',          note: 'Klien mengakui SYN server. Koneksi terjalin (ESTABLISHED).', cState: 'ESTABLISHED', sState: 'ESTABLISHED' },
  { dir: 'r', label: 'DATA + ACK',           note: 'Pertukaran data. Tiap segmen di-ACK (andal, berurutan).', cState: 'ESTABLISHED', sState: 'ESTABLISHED' },
  { dir: 'r', label: 'FIN',                  note: 'Klien selesai: mulai penutupan dengan FIN.', cState: 'FIN-WAIT', sState: 'CLOSE-WAIT' },
  { dir: 'l', label: 'ACK',                  note: 'Server mengakui FIN klien.', cState: 'FIN-WAIT-2', sState: 'CLOSE-WAIT' },
  { dir: 'l', label: 'FIN',                  note: 'Server juga selesai: kirim FIN.', cState: 'TIME-WAIT', sState: 'LAST-ACK' },
  { dir: 'r', label: 'ACK',                  note: 'Klien mengakui FIN server. Koneksi ditutup.', cState: 'CLOSED', sState: 'CLOSED' },
]

export default function TcpHandshake() {
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  const step = STEPS[i]

  useEffect(() => {
    if (!playing) return
    if (i >= STEPS.length - 1) { setPlaying(false); return }
    const t = setTimeout(() => setI(x => Math.min(STEPS.length - 1, x + 1)), 1600)
    return () => clearTimeout(t)
  }, [playing, i])

  const phase = i <= 2 ? 'Membuka koneksi (3-way handshake)' : i === 3 ? 'Transfer data' : 'Menutup koneksi (4-way)'

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h3 className="text-[17px] font-semibold tracking-[-0.02em]">Animasi Koneksi TCP</h3>
        <span className="text-[12px] text-faint">langkah {i + 1}/{STEPS.length}</span>
      </div>
      <div className="text-[13px] text-primary font-semibold mb-4">{phase}</div>

      {/* Diagram */}
      <div className="relative rounded-lg bg-surface-2 border border-app p-4 sm:p-6 overflow-hidden">
        <div className="flex justify-between text-center text-[13px] font-semibold mb-2">
          <div className="w-24"><LaptopIcon size={26} className="mx-auto mb-1" aria-hidden="true" />Klien</div>
          <div className="w-24"><DesktopTowerIcon size={26} className="mx-auto mb-1" aria-hidden="true" />Server</div>
        </div>
        {/* Lintasan paket */}
        <div className="relative h-14 my-2">
          <div className="absolute top-1/2 left-14 right-14 h-px bg-[var(--border-strong)]" />
          <div key={i} className="absolute top-1/2 -translate-y-1/2 transition duration-1000 ease-in-out"
            style={{
              left: step.dir === 'r' ? 'calc(3.5rem)' : 'calc(100% - 3.5rem)',
              transform: `translate(${step.dir === 'r' ? '0' : '-100%'}, -50%)`,
              animation: 'tcpSlide 1.1s ease',
            }}>
            <div className="px-2.5 py-1 rounded-md text-[var(--fg-contrast)] text-[11px] font-semibold font-mono whitespace-nowrap"
              style={{ background: step.label.includes('FIN') ? 'var(--no)' : step.label.includes('DATA') ? 'var(--ok)' : 'var(--primary)' }}>
              {step.dir === 'r' ? '' : '◀ '}{step.label}{step.dir === 'r' ? ' ▶' : ''}
            </div>
          </div>
        </div>
        <div className="flex justify-between text-center text-[11px] font-mono">
          <div className="w-24"><span className="chip !text-[10px]">{step.cState}</span></div>
          <div className="w-24"><span className="chip !text-[10px]">{step.sState}</span></div>
        </div>
      </div>

      <p className="text-[13.5px] text-muted leading-relaxed mt-4 min-h-[3rem]">{step.note}</p>

      <div className="flex items-center gap-2 mt-3">
        <button className="btn" onClick={() => { setI(0); setPlaying(false) }}>Reset</button>
        <button className="btn" disabled={i === 0} onClick={() => setI(x => Math.max(0, x - 1))}>◀</button>
        <button className="btn btn-ink flex-1" onClick={() => { if (i >= STEPS.length - 1) setI(0); setPlaying(p => !p) }}>
          {playing ? 'Jeda' : i >= STEPS.length - 1 ? 'Ulangi' : 'Putar'}
        </button>
        <button className="btn" disabled={i >= STEPS.length - 1} onClick={() => setI(x => Math.min(STEPS.length - 1, x + 1))}>▶</button>
      </div>
      <style>{`@keyframes tcpSlide{from{opacity:.3}to{opacity:1}}`}</style>
    </div>
  )
}

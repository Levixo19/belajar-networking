import { useState } from 'react'

const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1]

export default function BaseConverter() {
  const [bits, setBits] = useState<number[]>([1, 1, 0, 0, 0, 0, 0, 0]) // 192
  const val = bits.reduce((a, b, i) => a + b * WEIGHTS[i], 0)
  const setVal = (v: number) => {
    v = Math.max(0, Math.min(255, Math.floor(v || 0)))
    setBits(WEIGHTS.map(w => (v & w ? 1 : 0)))
  }
  const toggle = (i: number) => setBits(b => b.map((x, j) => (j === i ? (x ? 0 : 1) : x)))
  const hex = val.toString(16).toUpperCase().padStart(2, '0')
  const bin = bits.join('')

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-[17px] font-semibold tracking-[-0.02em]">Konverter Biner ↔ Desimal ↔ Hex</h3>
        <span className="text-[12px] text-faint">satu oktet (0-255)</span>
      </div>

      {/* Bit toggles */}
      <div className="grid grid-cols-8 gap-1.5 sm:gap-2 mb-3">
        {bits.map((b, i) => (
          <button key={i} onClick={() => toggle(i)}
            className={`aspect-square rounded-lg font-mono font-semibold text-lg sm:text-xl transition border ${
              b ? 'bg-[var(--fg)] text-[var(--fg-contrast)] border-transparent' : 'bg-surface-2 text-faint border-app hover:border-[var(--border-strong)]'}`}>
            {b}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-1.5 sm:gap-2 mb-5 text-center">
        {WEIGHTS.map(w => <div key={w} className="text-[10px] sm:text-[11px] text-faint font-mono tabular-nums">{w}</div>)}
      </div>

      {/* Readout */}
      <div className="grid grid-cols-3 gap-3">
        <Field label="Desimal" value={String(val)} onChange={s => setVal(parseInt(s.replace(/\D/g, '') || '0', 10))} mono />
        <Field label="Biner" value={bin} readOnly mono />
        <Field label="Heksadesimal" value={'0x' + hex} readOnly mono />
      </div>

      <div className="mt-4 text-[13px] text-muted leading-relaxed">
        Klik tiap bit untuk menyalakannya. Nilai = jumlah bobot bit yang menyala
        ({bits.map((b, i) => b ? WEIGHTS[i] : null).filter(Boolean).join(' + ') || '0'} = <b>{val}</b>).
        Ini dasar subnetting. Latih sampai instan.
      </div>
    </div>
  )
}

function Field({ label, value, onChange, readOnly, mono }:
  { label: string; value: string; onChange?: (s: string) => void; readOnly?: boolean; mono?: boolean }) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-faint">{label}</span>
      <input value={value} readOnly={readOnly} onChange={e => onChange?.(e.target.value)}
        className={`mt-1 w-full bg-surface-2 border border-app rounded-lg px-3 py-2 text-sm ${mono ? 'font-mono' : ''} ${readOnly ? 'text-muted' : ''} outline-none focus:border-[var(--primary)]`} />
    </label>
  )
}

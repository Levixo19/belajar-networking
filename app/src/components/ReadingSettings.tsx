import { useEffect, useRef, useState } from 'react'
import { FONT_BACA, usePrefBaca, type UkuranBaca, type SpasiBaca } from '../lib/bacaan'
import { IconCheck } from './icons'

const UKURAN: { id: UkuranBaca; label: string }[] = [
  { id: 's', label: 'Kecil' }, { id: 'm', label: 'Sedang' }, { id: 'l', label: 'Besar' },
]
const SPASI: { id: SpasiBaca; label: string }[] = [
  { id: 'normal', label: 'Normal' }, { id: 'lega', label: 'Lega' },
]

/** Tombol "Aa" + panel untuk memilih font, ukuran teks, dan jarak baris. */
export default function ReadingSettings() {
  const { pref, ubah, reset } = usePrefBaca()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const klik = (e: MouseEvent) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false) }
    window.addEventListener('keydown', key)
    document.addEventListener('mousedown', klik)
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('mousedown', klik) }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-app bg-surface px-3 text-[13px] text-muted transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
      >
        <span className="text-[15px] font-semibold leading-none" aria-hidden="true">Aa</span>
        Tampilan baca
      </button>

      {open && (
        <div role="dialog" aria-label="Pengaturan tampilan baca"
          className="menu-panel fade-up absolute left-0 top-full z-30 mt-2 w-[min(92vw,24rem)] p-2">
          <fieldset className="p-2">
            <legend className="mb-2 text-[12.5px] font-medium text-faint">Font</legend>
            <div className="space-y-1">
              {FONT_BACA.map(f => {
                const on = pref.font === f.id
                return (
                  <button key={f.id} role="radio" aria-checked={on} onClick={() => ubah({ font: f.id })}
                    className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      on ? 'bg-[var(--surface-2)]' : 'hover:bg-[var(--surface-2)]'}`}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15.5px] font-medium leading-snug" style={{ fontFamily: f.css }}>{f.nama}</span>
                      <span className="mt-0.5 block text-[13.5px] text-muted" style={{ fontFamily: f.css }}>
                        Router Il1 O0 10.0.0.1 Gi0/1
                      </span>
                      <span className="mt-1 block text-[12px] leading-snug text-faint">{f.ket}</span>
                    </span>
                    <span className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                      on ? 'border-[var(--fg)] bg-[var(--fg)] text-[var(--fg-contrast)]' : 'border-[var(--border-strong)]'}`}>
                      {on && <IconCheck size={12} />}
                    </span>
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3 border-t border-app p-2 pt-3">
            <Pilihan label="Ukuran teks" items={UKURAN} value={pref.ukuran} onChange={v => ubah({ ukuran: v })} />
            <Pilihan label="Jarak baris" items={SPASI} value={pref.spasi} onChange={v => ubah({ spasi: v })} />
          </div>

          <div className="flex items-center justify-between border-t border-app px-2 pb-1 pt-2.5">
            <span className="text-[12px] text-faint">Tersimpan di perangkat ini</span>
            <button onClick={reset} className="text-[12.5px] text-muted underline underline-offset-2 hover:text-[var(--text)]">
              Kembalikan bawaan
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Pilihan<T extends string>({ label, items, value, onChange }: {
  label: string; items: { id: T; label: string }[]; value: T; onChange: (v: T) => void
}) {
  return (
    <div>
      <div className="mb-1.5 text-[12.5px] font-medium text-faint">{label}</div>
      <div role="radiogroup" aria-label={label} className="flex rounded-lg border border-app bg-surface p-0.5">
        {items.map(i => (
          <button key={i.id} role="radio" aria-checked={value === i.id} onClick={() => onChange(i.id)}
            className={`h-7 flex-1 rounded-md text-[12.5px] transition-colors ${
              value === i.id ? 'bg-[var(--surface-3)] font-medium text-[var(--text)]' : 'text-muted hover:text-[var(--text)]'}`}>
            {i.label}
          </button>
        ))}
      </div>
    </div>
  )
}

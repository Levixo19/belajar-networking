import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { search as doSearch } from '../lib/search'
import { stageOfModule } from '../lib/content'
import { IconSearch, IconHome, IconCards, IconTools, IconZap, IconArrowRight, IconUsers, StageIcon } from './icons'

const ACTIONS = [
  { id: 'go-home', label: 'Buka dasbor', to: '/', icon: <IconHome size={16} /> },
  { id: 'go-review', label: 'Mulai review kartu', to: '/review', icon: <IconCards size={16} /> },
  { id: 'go-tools', label: 'Buka alat interaktif', to: '/tools', icon: <IconTools size={16} /> },
  { id: 'go-arena', label: 'Buka arena latihan', to: '/arena', icon: <IconZap size={16} /> },
  { id: 'go-karier', label: 'Jelajahi peta profesi', to: '/karier', icon: <IconUsers size={16} /> },
]

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const nav = useNavigate()

  useEffect(() => {
    if (open) {
      setQ('')
      setSel(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const hits = useMemo(() => (q.trim() ? doSearch(q, 24) : []), [q])
  const items = useMemo(() => {
    if (!q.trim()) return ACTIONS.map(a => ({ type: 'action' as const, ...a }))
    return hits.map(h => ({ type: 'module' as const, ...h }))
  }, [q, hits])

  useEffect(() => { setSel(0) }, [q])

  const go = (i: number) => {
    const it = items[i]
    if (!it) return
    if (it.type === 'action') nav(it.to)
    else nav(`/m/${encodeURI(it.doc.id)}`)
    onClose()
  }

  if (!open) return null
  return (
    <div
      className="fade-in fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[14vh] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cari materi"
        className="menu-panel fade-up w-full max-w-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex h-14 items-center gap-3 border-b border-app px-4">
          <IconSearch size={17} className="shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Cari modul, protokol, atau perintah"
            aria-label="Kata kunci"
            role="combobox"
            aria-expanded="true"
            aria-controls="palet-hasil"
            aria-activedescendant={items[sel] ? `palet-${sel}` : undefined}
            className="flex-1 bg-transparent text-[15px] text-[var(--text)] outline-none placeholder:text-[var(--text-faint)]"
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(items.length - 1, s + 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(0, s - 1)) }
              if (e.key === 'Enter') { e.preventDefault(); go(sel) }
              if (e.key === 'Escape') onClose()
            }}
          />
          <kbd>Esc</kbd>
        </div>

        <div id="palet-hasil" role="listbox" className="max-h-[52vh] overflow-y-auto p-1.5">
          {!q.trim() && <div className="px-3 pb-1 pt-2 text-[12px] text-faint">Pintasan</div>}
          {items.length === 0 && (
            <div className="px-4 py-12 text-center">
              <div className="text-[14px] font-medium">Tidak ada yang cocok dengan &ldquo;{q}&rdquo;.</div>
              <div className="mt-1 text-[13px] text-faint">Coba kata yang lebih umum, misalnya &ldquo;subnet&rdquo; atau &ldquo;ospf&rdquo;.</div>
            </div>
          )}
          {items.map((it, i) => {
            const st = it.type === 'module' ? stageOfModule.get(it.doc.id) : undefined
            return (
              <button
                key={it.type === 'action' ? it.id : it.doc.id}
                id={`palet-${i}`}
                role="option"
                aria-selected={i === sel}
                onMouseEnter={() => setSel(i)}
                onClick={() => go(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  i === sel ? 'bg-[var(--surface-2)]' : ''
                }`}
              >
                {it.type === 'action' ? (
                  <>
                    <span className="text-faint">{it.icon}</span>
                    <span className="flex-1 text-[14px]">{it.label}</span>
                  </>
                ) : (
                  <>
                    <span className="road-ico !h-8 !w-8 shrink-0">{st && <StageIcon id={st.id} size={15} />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        {it.doc.num && <span className="shrink-0 text-[12px] tabular-nums text-faint">{it.doc.num}</span>}
                        <span className="truncate text-[14px] font-medium">{it.doc.title}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-faint">
                        {it.doc.stageTitle}. {it.snippet}
                      </span>
                    </span>
                  </>
                )}
                {i === sel && <IconArrowRight size={15} className="shrink-0 text-faint" />}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-app bg-[var(--surface-2)] px-4 py-2.5 text-[12px] text-faint">
          <span className="flex items-center gap-1.5"><kbd>↑</kbd><kbd>↓</kbd> pilih</span>
          <span className="flex items-center gap-1.5"><kbd>Enter</kbd> buka</span>
        </div>
      </div>
    </div>
  )
}

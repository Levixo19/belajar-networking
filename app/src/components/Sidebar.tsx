import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { stagesByBand, type Stage } from '../lib/content'
import { useStore } from '../lib/store'
import { isDue } from '../lib/srs'
import ProgressRing from './ProgressRing'
import ProfileMenu from './ProfileMenu'
import { IconHome, IconCards, IconTools, IconZap, IconChevron, IconCheck, IconClose } from './icons'

function decodeId(pathname: string): string | null {
  const m = pathname.match(/^\/m\/(.+)$/)
  return m ? decodeURIComponent(m[1]) : null
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useStore()
  const loc = useLocation()
  const currentId = decodeId(loc.pathname)
  const groups = useMemo(() => stagesByBand(), [])

  const dueCount = useMemo(
    () => Object.values(store.srs).filter(s => isDue(s)).length,
    [store.srs]
  )

  return (
    <aside className={`fixed z-40 top-0 left-0 h-screen w-[300px] bg-surface border-r border-app flex flex-col
      transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-app shrink-0">
        <div className="w-8 h-8 rounded-lg grid place-items-center text-white font-black text-sm shrink-0"
          style={{ background: 'linear-gradient(135deg,var(--primary),var(--accent))' }}>N</div>
        <div className="min-w-0">
          <div className="font-bold text-[15px] leading-tight truncate">Belajar Networking</div>
          <div className="text-[11px] text-faint leading-tight">nol → profesional</div>
        </div>
        <button className="btn btn-ghost p-1.5 ml-auto lg:hidden" onClick={onClose} aria-label="Tutup"><IconClose size={18} /></button>
      </div>

      {/* Nav utama */}
      <nav className="px-2.5 py-3 space-y-0.5 shrink-0">
        <NavItem to="/" icon={<IconHome size={18} />} label="Dasbor" end />
        <NavItem to="/review" icon={<IconCards size={18} />} label="Review"
          badge={dueCount > 0 ? String(dueCount) : undefined} />
        <NavItem to="/tools" icon={<IconTools size={18} />} label="Alat Interaktif" />
        <NavItem to="/arena" icon={<IconZap size={18} />} label="Arena Latihan" />
      </nav>

      <div className="px-4 pb-1 text-[11px] font-semibold text-faint uppercase tracking-wider">Kurikulum</div>
      {/* Pohon kurikulum */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-6 space-y-3">
        {groups.map(g => (
          <div key={g.band}>
            <div className="px-2 pt-2 pb-1 text-[11px] font-semibold text-faint uppercase tracking-wider">{g.label}</div>
            {g.stages.map(s => (
              <StageRow key={s.id} stage={s} currentId={currentId} progress={store.progress} />
            ))}
          </div>
        ))}
      </div>
      <ProfileMenu />
    </aside>
  )
}

function NavItem({ to, icon, label, badge, end }: { to: string; icon: React.ReactNode; label: string; badge?: string; end?: boolean }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'nav-on font-semibold' : 'hover:bg-surface-2 text-muted'}`}>
      {icon}<span>{label}</span>
      {badge && <span className="ml-auto chip chip-primary !py-0.5 !px-2">{badge}</span>}
    </NavLink>
  )
}

function StageRow({ stage, currentId, progress }: { stage: Stage; currentId: string | null; progress: Record<string, string> }) {
  const hasCurrent = stage.modules.some(m => m.id === currentId)
  const [open, setOpen] = useState(hasCurrent)
  const done = stage.modules.filter(m => progress[m.id] === 'done').length
  const total = stage.modules.length
  const pct = total ? done / total : 0

  return (
    <div>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-2 text-left group">
        <IconChevron size={14} className={`text-faint transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} />
        <span className="text-base shrink-0">{stage.icon}</span>
        <span className="text-[13px] font-medium truncate flex-1">{stage.title}</span>
        {done === total && total > 0
          ? <IconCheck size={14} className="text-[var(--ok)] shrink-0" />
          : <span className="text-[10px] text-faint tabular-nums shrink-0">{done}/{total}</span>}
        <ProgressRing value={pct} size={18} stroke={3} />
      </button>
      {open && (
        <div className="ml-4 pl-2 border-l border-app mt-0.5 mb-1 space-y-0.5">
          {stage.modules.map(m => {
            const st = progress[m.id]
            const active = m.id === currentId
            return (
              <NavLink key={m.id} to={`/m/${encodeURI(m.id)}`}
                className={`flex items-center gap-2 pl-2 pr-2 py-1.5 rounded-md text-[12.5px] transition-colors ${
                  active ? 'nav-on font-semibold' : 'hover:bg-surface-2 text-muted'}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  st === 'done' ? 'bg-[var(--ok)]' : st === 'reading' ? 'bg-[var(--warn)]' : 'bg-[var(--border-strong)]'}`} />
                <span className="truncate">{m.num && <span className="text-faint tabular-nums mr-1">{m.num}</span>}{m.title}</span>
              </NavLink>
            )
          })}
        </div>
      )}
    </div>
  )
}

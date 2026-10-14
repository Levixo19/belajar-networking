import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { stagesByBand, learnModules, nextModule, type Stage } from '../lib/content'
import { useStore } from '../lib/store'
import { isDue } from '../lib/srs'
import ProfileMenu from './ProfileMenu'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'
import { IconChevron, IconCheck, IconSearch, IconArrowRight, StageIcon } from './icons'

function decodeId(pathname: string): string | null {
  const m = pathname.match(/^\/m\/(.+)$/)
  return m ? decodeURIComponent(m[1]) : null
}

export default function Navbar({ onSearch }: { onSearch: () => void }) {
  const store = useStore()
  const loc = useLocation()
  const currentId = decodeId(loc.pathname)
  const groups = useMemo(() => stagesByBand(), [])
  const [kurikulumOpen, setKurikulumOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const dueCount = useMemo(() => Object.values(store.srs).filter(s => isDue(s)).length, [store.srs])
  const lanjut = useMemo(() => nextModule(store.progress), [store.progress])

  useEffect(() => { setKurikulumOpen(false); setMenuOpen(false) }, [loc.pathname])
  useEffect(() => {
    if (!kurikulumOpen && !menuOpen) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setKurikulumOpen(false); setMenuOpen(false) } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [kurikulumOpen, menuOpen])

  const kurikulumAktif = loc.pathname.startsWith('/m/')

  return (
    <header className="glass sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="mr-3 flex shrink-0 items-center gap-2.5" aria-label="Belajar Networking, ke dasbor">
          <Logo size={26} />
          <span className="hidden text-[15px] font-semibold tracking-[-0.02em] sm:block">Belajar Networking</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Utama">
          <NavLink to="/" end className="nav-link">Dasbor</NavLink>
          <div className="relative">
            <button
              onClick={() => setKurikulumOpen(o => !o)}
              aria-expanded={kurikulumOpen}
              aria-haspopup="true"
              className={`nav-link ${kurikulumAktif || kurikulumOpen ? 'is-on' : ''}`}
            >
              Kurikulum
              <IconChevron size={12} className={`transition-transform duration-200 ${kurikulumOpen ? 'rotate-90' : ''}`} />
            </button>
            {kurikulumOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setKurikulumOpen(false)} aria-hidden="true" />
                <div className="menu-panel fade-up absolute left-0 top-full z-20 mt-2 w-[min(88vw,980px)] overflow-hidden">
                  <div className="grid max-h-[68vh] grid-cols-2 gap-x-8 gap-y-7 overflow-y-auto p-6 xl:grid-cols-3">
                    {groups.map(g => (
                      <div key={g.band}>
                        <div className="mb-2 px-2 text-[12px] font-medium text-faint">{g.label}</div>
                        <div className="space-y-px">
                          {g.stages.map(s => (
                            <StageLink key={s.id} stage={s} currentId={currentId} progress={store.progress} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-app bg-[var(--surface-2)] px-6 py-3.5">
                    <span className="text-[13px] text-muted">
                      {learnModules.filter(m => store.progress[m.id] === 'done').length} dari {learnModules.length} modul tuntas
                    </span>
                    <Link to={`/m/${encodeURI(lanjut.id)}`} className="link-arrow">
                      Lanjut ke {lanjut.num ? `modul ${lanjut.num}` : lanjut.title}
                      <IconArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
          <NavLink to="/review" className="nav-link">
            Review
            {dueCount > 0 && <span className="badge-count" aria-label={`${dueCount} kartu jatuh tempo`}>{dueCount}</span>}
          </NavLink>
          <NavLink to="/tools" className="nav-link">Alat</NavLink>
          <NavLink to="/arena" className="nav-link">Arena</NavLink>
          <NavLink to="/karier" className="nav-link">Karier</NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onSearch}
            className="hidden h-8 w-56 items-center gap-2 rounded-lg border border-app bg-surface px-2.5 text-[13px] text-faint transition-colors hover:border-[var(--border-strong)] md:flex"
            aria-label="Cari modul dan perintah"
          >
            <IconSearch size={14} />
            <span className="flex-1 text-left">Cari materi</span>
            <kbd>Ctrl K</kbd>
          </button>
          <button onClick={onSearch} className="btn btn-ghost btn-icon md:!hidden" aria-label="Cari">
            <IconSearch size={17} />
          </button>
          <div className="hidden xl:block"><ThemeToggle /></div>
          <ProfileMenu compact />
          <Link to={`/m/${encodeURI(lanjut.id)}`} className="btn btn-primary !hidden !h-8 xl:!inline-flex">
            Lanjut belajar
          </Link>
          <button
            className="btn btn-ghost btn-icon lg:!hidden"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
          >
            <span className={`burger ${menuOpen ? 'open' : ''}`} aria-hidden="true"><i /><i /><i /></span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fade-in border-t border-app bg-[var(--bg)] lg:hidden">
          <div className="max-h-[78dvh] space-y-6 overflow-y-auto px-4 py-5">
            <nav className="menu-stagger grid gap-px" aria-label="Utama (seluler)">
              <MobileLink to="/" end label="Dasbor" />
              <MobileLink to="/review" label="Review" badge={dueCount || undefined} />
              <MobileLink to="/tools" label="Alat interaktif" />
              <MobileLink to="/arena" label="Arena latihan" />
              <MobileLink to="/karier" label="Peta profesi" />
            </nav>
            <Link to={`/m/${encodeURI(lanjut.id)}`} className="btn btn-primary btn-lg w-full">
              Lanjut belajar
              <IconArrowRight size={16} />
            </Link>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted">Tema</span>
              <ThemeToggle />
            </div>
            <div className="space-y-5 border-t border-app pt-5">
              {groups.map(g => (
                <div key={g.band}>
                  <div className="mb-1.5 px-2 text-[12px] font-medium text-faint">{g.label}</div>
                  <div className="space-y-px">
                    {g.stages.map(s => (
                      <StageLink key={s.id} stage={s} currentId={currentId} progress={store.progress} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function MobileLink({ to, label, badge, end }: { to: string; label: string; badge?: number; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex h-11 items-center justify-between rounded-lg px-3 text-[15px] transition-colors ${
          isActive ? 'bg-[var(--surface-2)] font-medium text-[var(--text)]' : 'text-muted hover:text-[var(--text)]'
        }`
      }
    >
      <span>{label}</span>
      {badge ? <span className="badge-count">{badge}</span> : null}
    </NavLink>
  )
}

function StageLink({ stage, currentId, progress }: {
  stage: Stage; currentId: string | null; progress: Record<string, string>
}) {
  const done = stage.modules.filter(m => progress[m.id] === 'done').length
  const total = stage.modules.length
  const aktif = stage.modules.some(m => m.id === currentId)
  const tujuan = stage.modules.find(m => m.id === currentId)
    ?? stage.modules.find(m => progress[m.id] !== 'done')
    ?? stage.modules[0]
  const tuntas = done === total && total > 0

  return (
    <Link
      to={`/m/${encodeURI(tujuan.id)}`}
      aria-current={aktif ? 'true' : undefined}
      className={`group flex h-9 items-center gap-2.5 rounded-lg px-2 transition-colors ${
        aktif ? 'bg-[var(--surface-2)] text-[var(--text)]' : 'text-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
      }`}
    >
      <StageIcon id={stage.id} size={16} className={tuntas ? 'text-primary' : 'text-faint group-hover:text-[var(--text)]'} />
      <span className="flex-1 truncate text-[13.5px]">{stage.title}</span>
      {tuntas ? (
        <IconCheck size={14} className="shrink-0 text-primary" />
      ) : (
        <span className="shrink-0 text-[12px] tabular-nums text-faint">{done}/{total}</span>
      )}
    </Link>
  )
}

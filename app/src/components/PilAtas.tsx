import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { stagesByBand, learnModules, nextModule, type Stage } from '../lib/content'
import { useStore } from '../lib/store'
import { isDue } from '../lib/srs'
import { useDialogFokus } from '../lib/fokus'
import ProfileMenu from './ProfileMenu'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'
import Planisfer from './Planisfer'
import { IconChevron, IconCheck, IconSearch, IconArrowRight, StageIcon } from './icons'

const TUJUAN = [
  { to: '/', label: 'Dasbor', end: true },
  { to: '/review', label: 'Review' },
  { to: '/tools', label: 'Alat' },
  { to: '/misi', label: 'Misi' },
  { to: '/arena', label: 'Arena' },
  { to: '/karier', label: 'Karier' },
  { to: '/pustaka', label: 'Pustaka' },
] as const

/**
 * Cangkang laptop: SATU panel navigasi melayang di tengah atas berisi semua tujuan, dan
 * satu kanvas lapang di bawahnya. Bentuk ini menggantikan bilah atas + menu burger +
 * tab bar bawah (aplikasi ini dipakai hanya di laptop).
 *
 * Penanda aktif yang meluncur diletakkan di bawah butir aktif. Butir aktif ditandai
 * DUA kali: kelas `is-on` untuk tampilan dan `aria-current` untuk pembaca layar,
 * keduanya dipasang DAN dilepas saat rute berganti (warna tidak dibacakan). Di
 * halaman modul yang aktif adalah pemicu Kurikulum, yang tidak punya rutenya sendiri.
 */
export default function PilAtas({ onSearch }: { onSearch: () => void }) {
  const store = useStore()
  const loc = useLocation()
  const groups = useMemo(() => stagesByBand(), [])
  const [kurOpen, setKurOpen] = useState(false)
  const pil = useRef<HTMLElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [penanda, setPenanda] = useState<{ x: number; w: number } | null>(null)
  const [sorotTahap, setSorotTahap] = useState<string | null>(null)

  const dueCount = useMemo(() => Object.values(store.srs).filter(s => isDue(s)).length, [store.srs])
  const lanjut = useMemo(() => nextModule(store.progress), [store.progress])
  const diModul = loc.pathname.startsWith('/m/')
  const currentId = diModul ? decodeURIComponent(loc.pathname.slice(3)) : null

  useEffect(() => { setKurOpen(false) }, [loc.pathname])
  useDialogFokus(panel, kurOpen, () => setKurOpen(false))

  // Penanda diukur SESUDAH butir menempel, dan diukur ulang saat lebar pil berubah
  // (font variabel selesai dimuat, jendela diubah ukurannya).
  useLayoutEffect(() => {
    const el = pil.current
    if (!el) return
    const ukur = () => {
      const aktif = el.querySelector<HTMLElement>('[data-pil-item].is-on')
      if (!aktif || !aktif.offsetWidth) { setPenanda(null); return }
      setPenanda({ x: aktif.offsetLeft, w: aktif.offsetWidth })
    }
    ukur()
    const ro = new ResizeObserver(ukur)
    ro.observe(el)
    document.fonts?.ready.then(ukur)
    return () => ro.disconnect()
  }, [loc.pathname, dueCount])

  return (
    <header className="pil-wadah">
      <nav ref={pil} className="pil" aria-label="Utama">
        <span aria-hidden="true" className="pil-penanda" style={penanda ? { transform: `translateX(${penanda.x}px)`, width: penanda.w } : { opacity: 0 }} />
        <Link to="/" className="pil-logo" aria-label="Belajar Networking, ke dasbor"><Logo size={22} /></Link>

        <NavLink to="/" end data-pil-item className={({ isActive }) => `pil-item ${isActive ? 'is-on' : ''}`}>Dasbor</NavLink>
        <button type="button" data-pil-item onClick={() => setKurOpen(o => !o)}
          aria-expanded={kurOpen} aria-haspopup="dialog" aria-current={diModul ? 'true' : undefined}
          className={`pil-item ${diModul ? 'is-on' : ''}`}>
          Kurikulum <IconChevron size={11} className={`transition-transform duration-150 ${kurOpen ? 'rotate-90' : ''}`} />
        </button>
        {TUJUAN.slice(1).map(t => (
          <NavLink key={t.to} to={t.to} data-pil-item className={({ isActive }) => `pil-item ${isActive ? 'is-on' : ''}`}>
            {t.label}
            {t.to === '/review' && dueCount > 0 && <span className="badge-count" aria-label={`${dueCount} kartu jatuh tempo`}>{dueCount}</span>}
          </NavLink>
        ))}

        <span className="pil-sekat" aria-hidden="true" />
        <button type="button" onClick={onSearch} className="pil-cari" aria-label="Cari modul dan perintah (Ctrl K)">
          <IconSearch size={14} /> <span className="pil-cari-teks">Cari</span> <kbd>Ctrl K</kbd>
        </button>
        <span className="pil-xp" title={`Level ${store.level}`}>
          <span className="sr-only">Level {store.level}, </span>{store.xp.toLocaleString('id')} XP
        </span>
        <ThemeToggle />
        <ProfileMenu compact />

        {/* Garis progres baca: hanya di halaman modul, di kaki pil, digerakkan scroll-timeline CSS. */}
        {diModul && <span className="pil-progres" aria-hidden="true" />}
      </nav>

      {kurOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setKurOpen(false)} aria-hidden="true" />
          <div ref={panel} role="dialog" aria-label="Kurikulum" tabIndex={-1} className="menu-panel fade-up pil-mega">
            <div className="flex">
              <div className="grid max-h-[66vh] flex-1 grid-cols-3 gap-x-8 gap-y-7 overflow-y-auto p-6" onMouseLeave={() => setSorotTahap(null)}>
                {groups.map(g => (
                  <div key={g.band}>
                    <div className="mb-2 px-2 text-[12px] font-medium text-faint">{g.label}</div>
                    <div className="space-y-px">
                      {g.stages.map(s => <StageLink key={s.id} stage={s} currentId={currentId} progress={store.progress} onSorot={setSorotTahap} />)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pil-mega-peta" aria-hidden="true">
                <Planisfer mode="mini" progress={store.progress} sorot={sorotTahap ?? (currentId ? currentId.split('/')[0] : lanjut.stage)} judul="Peta langit kurikulum" />
                <p className="pil-mega-peta-ket">{groups.flatMap(g => g.stages).find(x => x.id === (sorotTahap ?? (currentId ? currentId.split('/')[0] : lanjut.stage)))?.title ?? 'Peta langit kurikulum'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-app bg-[var(--surface-2)] px-6 py-3.5">
              <span className="text-[13px] text-muted">
                {learnModules.filter(m => store.progress[m.id] === 'done').length} dari {learnModules.length} modul tuntas
              </span>
              <Link to={`/m/${encodeURI(lanjut.id)}`} className="link-arrow">
                Lanjut ke {lanjut.num ? `modul ${lanjut.num}` : lanjut.title} <IconArrowRight size={14} />
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  )
}

function StageLink({ stage, currentId, progress, onSorot }: { stage: Stage; currentId: string | null; progress: Record<string, string>; onSorot: (id: string) => void }) {
  const done = stage.modules.filter(m => progress[m.id] === 'done').length
  const total = stage.modules.length
  const aktif = stage.modules.some(m => m.id === currentId)
  const tujuan = stage.modules.find(m => m.id === currentId) ?? stage.modules.find(m => progress[m.id] !== 'done') ?? stage.modules[0]
  const tuntas = done === total && total > 0
  return (
    <Link to={`/m/${encodeURI(tujuan.id)}`} aria-current={aktif ? 'true' : undefined}
      onMouseEnter={() => onSorot(stage.id)} onFocus={() => onSorot(stage.id)}
      className={`group flex h-9 items-center gap-2.5 rounded-full px-2.5 ${aktif ? 'bg-[var(--surface-2)] text-[var(--text)]' : 'hover-padam text-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]'}`}>
      <StageIcon id={stage.id} size={16} className={tuntas ? 'text-primary' : 'text-faint group-hover:text-[var(--text)]'} />
      <span className="flex-1 truncate text-[13.5px]">{stage.title}</span>
      {tuntas ? <IconCheck size={14} className="shrink-0 text-primary" /> : <span className="shrink-0 text-[12px] tabular-nums text-faint">{done}/{total}</span>}
    </Link>
  )
}

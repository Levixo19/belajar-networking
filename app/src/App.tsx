import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './components/Navbar'
import CommandPalette from './components/CommandPalette'
import Logo from './components/Logo'
import MobileTabBar from './components/MobileTabBar'
import { useStore } from './lib/store'
import { installSpotlight } from './lib/spotlight'

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const store = useStore()

  useEffect(() => installSpotlight(), [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  if (store.status === 'loading' && !store.profileId) return <Splash />

  return (
    <div className="relative min-h-[100dvh] text-default">
      <a href="#konten" className="skip-link">Lewati ke konten</a>
      <div className="ambient" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <Navbar onSearch={() => setPaletteOpen(true)} />
      <main id="konten" className="mx-auto w-full max-w-full overflow-x-clip">
        <Outlet />
      </main>
      <MobileTabBar />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      {store.offline && (
        <div role="status" className="menu-panel fade-up fixed bottom-24 left-1/2 z-40 lg:bottom-5 flex -translate-x-1/2 items-center gap-2.5 px-4 py-2 text-[13px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--warn)]" aria-hidden="true" />
          <span className="text-muted">Mode offline. Perubahan disimpan di perangkat dan disinkron saat tersambung.</span>
        </div>
      )}
    </div>
  )
}

function Splash() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <div className="fade-in flex flex-col items-center gap-4 text-center">
        <Logo size={44} />
        <div>
          <div className="text-[15px] font-semibold tracking-tight">Belajar Networking</div>
          <div className="mt-1 text-[13px] text-faint">Memuat ruang belajar</div>
        </div>
        <div className="h-0.5 w-28 overflow-hidden rounded-full bg-[var(--surface-3)]" aria-hidden="true">
          <div className="h-full w-1/3 animate-[slide_1.2s_ease-in-out_infinite] rounded-full bg-[var(--text)]" />
        </div>
      </div>
    </div>
  )
}

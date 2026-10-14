import { useStore } from '../lib/store'
import ThemeToggle from './ThemeToggle'
import { IconMenu, IconSearch, IconFlame, IconZap } from './icons'

export default function TopBar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const { streak, level, xp } = useStore()
  return (
    <header className="sticky top-0 z-20 h-14 flex items-center gap-3 px-4 bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-md border-b border-app">
      <button className="btn btn-ghost p-2 lg:hidden" onClick={onMenu} aria-label="Menu"><IconMenu /></button>

      <button onClick={onSearch}
        className="flex items-center gap-2 text-sm text-faint bg-surface-2 border border-app rounded-lg px-3 h-9 min-w-0 flex-1 max-w-md hover:border-[var(--border-strong)] transition-colors">
        <IconSearch size={16} />
        <span className="truncate">Cari modul, konsep, perintah…</span>
        <kbd className="ml-auto hidden sm:inline text-[10px] font-semibold bg-surface border border-app rounded px-1.5 py-0.5">Ctrl K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden sm:flex items-center gap-1.5 chip" title={`${streak} hari beruntun`}>
          <IconFlame size={14} className={streak > 0 ? 'text-[var(--warn)]' : 'text-faint'} />
          <span className="tabular-nums font-semibold">{streak}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 chip chip-primary" title={`${xp} XP total`}>
          <IconZap size={14} />
          <span className="tabular-nums font-semibold">Lv {level}</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}

import { useTheme, type ThemePref } from '../lib/theme'
import { IconSun, IconMoon, IconSystem } from './icons'

const OPTIONS: { v: ThemePref; label: string; Icon: typeof IconSun }[] = [
  { v: 'system', label: 'Ikuti sistem', Icon: IconSystem },
  { v: 'light', label: 'Terang', Icon: IconSun },
  { v: 'dark', label: 'Gelap', Icon: IconMoon },
]

/** Pilihan tema tiga posisi. */
export default function ThemeToggle() {
  const { pref, setPref } = useTheme()
  return (
    <div role="radiogroup" aria-label="Tema tampilan"
      className="inline-flex h-8 items-center gap-0.5 rounded-full border border-app bg-surface p-0.5">
      {OPTIONS.map(({ v, label, Icon }) => (
        <button
          key={v}
          role="radio"
          aria-checked={pref === v}
          title={label}
          aria-label={label}
          onClick={() => setPref(v)}
          className={`grid h-6 w-6 place-items-center rounded-full transition-colors duration-150 ${
            pref === v ? 'bg-[var(--surface-3)] text-[var(--text)]' : 'text-faint hover:text-[var(--text)]'
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}

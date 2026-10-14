/** Nada avatar monokrom. Nilai lama (emoji) tetap valid dan jatuh ke nada bawaan. */
export const TONES = ['ink', 'stone', 'mint', 'line', 'mid'] as const
export type Tone = typeof TONES[number]

const STYLE: Record<Tone, string> = {
  ink: 'bg-[var(--fg)] text-[var(--fg-contrast)]',
  stone: 'bg-[var(--surface-3)] text-[var(--text)]',
  mint: 'bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-inset ring-[var(--primary-border)]',
  line: 'bg-[var(--surface)] text-[var(--text)] ring-1 ring-inset ring-[var(--border-strong)]',
  mid: 'bg-[#6b6b6b] text-white',
}

export function toneOf(avatar: string | undefined): Tone {
  const t = avatar?.startsWith('tone:') ? avatar.slice(5) : ''
  return (TONES as readonly string[]).includes(t) ? (t as Tone) : 'ink'
}

export default function Avatar({ name, avatar, size = 32 }: { name: string; avatar?: string; size?: number }) {
  const initial = (name.trim()[0] || 'S').toUpperCase()
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-[30%] font-semibold ${STYLE[toneOf(avatar)]}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}

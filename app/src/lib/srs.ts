// Spaced repetition ringan (varian SM-2). Grade: 0=lagi, 1=sulit, 2=bagus, 3=mudah.
export interface SrsState { ease: number; interval: number; reps: number; due: string; lapses: number }

const DAY = 86400000
export function todayStr(offset = 0): string {
  const d = new Date(Date.now() + offset * DAY)
  return d.toISOString().slice(0, 10)
}
export function isDue(s: SrsState | undefined, today = todayStr()): boolean {
  if (!s) return true
  return s.due <= today
}
export function freshCard(): SrsState {
  return { ease: 2.5, interval: 0, reps: 0, due: todayStr(), lapses: 0 }
}
export function review(prev: SrsState | undefined, grade: number): SrsState {
  const s = prev ? { ...prev } : freshCard()
  if (grade === 0) {
    s.reps = 0; s.interval = 0; s.lapses += 1
    s.ease = Math.max(1.3, s.ease - 0.2)
    s.due = todayStr(0) // ulang hari ini
    return s
  }
  s.reps += 1
  s.ease = Math.max(1.3, s.ease + (0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02)))
  if (s.reps === 1) s.interval = grade === 3 ? 3 : 1
  else if (s.reps === 2) s.interval = grade === 1 ? 3 : 6
  else s.interval = Math.round(s.interval * s.ease * (grade === 1 ? 0.7 : grade === 3 ? 1.3 : 1))
  s.interval = Math.max(1, s.interval)
  s.due = todayStr(s.interval)
  return s
}
export const GRADES = [
  { g: 0, label: 'Lagi', hint: 'Belum ingat', color: 'var(--no)' },
  { g: 1, label: 'Sulit', hint: 'Ingat, susah', color: 'var(--warn)' },
  { g: 2, label: 'Bagus', hint: 'Ingat', color: 'var(--primary)' },
  { g: 3, label: 'Mudah', hint: 'Sangat mudah', color: 'var(--ok)' },
]

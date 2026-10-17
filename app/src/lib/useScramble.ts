import { useEffect, useRef } from 'react'
import { gerakDikurangi } from './gerak'

const GLYPHS = '01<>/[]{}#=+:.'

/**
 * Teks "didekode" seperti paket yang sedang dirakit ulang, lalu berhenti di nilai akhirnya.
 * Menulis langsung ke textContent (bukan state React) agar tidak memicu render per frame.
 * Bila gerak dikurangi (sistem atau menu profil), teks langsung tampil apa adanya.
 */
export function useScramble<T extends HTMLElement>(text: string, ms = 520) {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (gerakDikurangi()) { el.textContent = text; return }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms)
      const fixed = Math.floor(text.length * k)
      let out = text.slice(0, fixed)
      for (let i = fixed; i < text.length; i++) out += text[i] === ' ' ? ' ' : GLYPHS[(i * 7 + Math.floor(now / 40)) % GLYPHS.length]
      el.textContent = out
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); el.textContent = text }
  }, [text, ms])
  return ref
}

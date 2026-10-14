import { useEffect, useState } from 'react'
export type Theme = 'light' | 'dark'
export type ThemePref = Theme | 'system'
const KEY = 'bn-theme'

const media = () => window.matchMedia('(prefers-color-scheme: dark)')
const resolve = (p: ThemePref): Theme => (p === 'system' ? (media().matches ? 'dark' : 'light') : p)

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {}
  return 'system'
}

/** Preferensi tema: sistem (default), terang, atau gelap. Atribut data-theme selalu terisi nilai final. */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readPref)
  const [theme, setTheme] = useState<Theme>(() => resolve(readPref()))

  useEffect(() => {
    const apply = () => {
      const t = resolve(pref)
      setTheme(t)
      document.documentElement.dataset.theme = t
      // Bilah judul/tab browser ikut tema aplikasi; nilainya = --bg tema itu.
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0a0b0f' : '#f6f7f9')
    }
    apply()
    try { localStorage.setItem(KEY, pref) } catch {}
    if (pref !== 'system') return
    const m = media()
    m.addEventListener('change', apply)
    return () => m.removeEventListener('change', apply)
  }, [pref])

  const toggle = () => setPref(theme === 'dark' ? 'light' : 'dark')
  return { theme, pref, setPref, toggle, setTheme: setPref }
}

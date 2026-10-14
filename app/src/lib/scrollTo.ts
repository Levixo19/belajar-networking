import type { MouseEvent } from 'react'

/**
 * HashRouter memakai fragmen URL sebagai route, jadi <a href="#id"> akan berpindah halaman.
 * Handler ini menggulir ke elemen tujuan tanpa menyentuh route.
 */
export function scrollToId(id: string) {
  return (e: MouseEvent) => {
    const el = document.getElementById(id)
    if (!el) return
    e.preventDefault()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }
}

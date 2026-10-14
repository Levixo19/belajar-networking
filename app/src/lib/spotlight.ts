/**
 * Satu listener terdelegasi untuk efek spotlight di .tile / .spot.
 * Posisi kursor ditulis ke variabel CSS elemen yang sedang disorot, dibatasi satu kali per frame.
 */
export function installSpotlight() {
  if (typeof window === 'undefined' || !window.matchMedia('(hover: hover)').matches) return () => {}
  let raf = 0, last: PointerEvent | null = null
  const run = () => {
    raf = 0
    const e = last
    if (!e) return
    const el = (e.target as Element | null)?.closest?.('.tile') as HTMLElement | null
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--sx', `${e.clientX - r.left}px`)
    el.style.setProperty('--sy', `${e.clientY - r.top}px`)
  }
  const on = (e: PointerEvent) => { last = e; if (!raf) raf = requestAnimationFrame(run) }
  document.addEventListener('pointermove', on, { passive: true })
  return () => { document.removeEventListener('pointermove', on); if (raf) cancelAnimationFrame(raf) }
}

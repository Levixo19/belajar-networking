import { useEffect, useRef, useState } from 'react'

/** Aktif saat elemen masuk viewport — dipakai untuk memicu animasi diagram. */
export function useInView<T extends HTMLElement = HTMLDivElement>(opts?: { once?: boolean; margin?: string }) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return }
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); if (opts?.once !== false) obs.disconnect() }
      else if (opts?.once === false) setInView(false)
    }, { rootMargin: opts?.margin ?? '0px 0px -12% 0px', threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, []) // eslint-disable-line
  return { ref, inView }
}

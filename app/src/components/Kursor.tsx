import { useEffect, useRef } from 'react'
import { MOTION_OK } from '../lib/motion'

/**
 * Kursor bidik. Kursor sistem TIDAK disembunyikan (teks tetap bisa diseleksi dengan
 * presisi); yang ditambahkan hanya sebuah cincin kecil yang membuntuti dengan
 * pelembutan. Di atas sesuatu yang bisa diklik, cincin berubah menjadi empat sudut
 * jendela bidik yang mengunci bentuk elemennya, seperti teleskop yang menemukan
 * sasarannya. Di atas peta langit (data-kursor="lensa") bidikan menyingkir karena
 * peta punya lensanya sendiri; di atas prosa ia memudar supaya tidak mengganggu baca.
 *
 * Hanya aktif untuk mouse (pointer: fine, hover: hover) dan bila pengguna tidak minta
 * gerak dikurangi. Satu properti, satu mesin: posisi dan ukuran ditulis JS tiap frame,
 * CSS hanya mengurus opacity.
 */
const SASARAN = 'a[href], button:not(:disabled), [role="button"], summary, select, label[for], input[type="checkbox"], input[type="radio"], [data-kursor="kunci"]'

export default function Kursor() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const mq = window.matchMedia(`(pointer: fine) and (hover: hover) and ${MOTION_OK}`)
    if (!mq.matches) return
    document.documentElement.classList.add('ada-kursor')
    const s = { x: -100, y: -100, w: 22, h: 22, tx: -100, ty: -100, tw: 22, th: 22, kunci: false, tampak: false }
    let target: Element | null = null
    let raf = 0

    const ukurSasaran = () => {
      if (!target) return
      const r = target.getBoundingClientRect()
      const besar = r.width > 640 || r.height > 420
      if (besar || !r.width) { s.kunci = false; return }
      const pad = r.height < 40 ? 6 : 8
      s.kunci = true
      s.tx = r.left - pad; s.ty = r.top - pad; s.tw = r.width + pad * 2; s.th = r.height + pad * 2
    }

    const langkah = () => {
      const k = 0.24
      s.x += (s.tx - s.x) * k; s.y += (s.ty - s.y) * k
      s.w += (s.tw - s.w) * k; s.h += (s.th - s.h) * k
      el.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0)`
      el.style.width = `${s.w.toFixed(2)}px`; el.style.height = `${s.h.toFixed(2)}px`
      raf = requestAnimationFrame(langkah)
    }

    const gerak = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (!s.tampak) { s.tampak = true; s.x = e.clientX - 11; s.y = e.clientY - 11; el.dataset.tampak = '1' }
      const t = e.target as Element | null
      const lensa = t?.closest?.('[data-kursor="lensa"]')
      const baru = lensa ? null : t?.closest?.(SASARAN) ?? null
      if (baru !== target) target = baru
      el.dataset.mode = lensa ? 'lensa' : baru ? 'kunci' : t?.closest?.('.prose p, .prose li, .prose td, input, textarea') ? 'baca' : 'bebas'
      if (target) ukurSasaran()
      if (!target || !s.kunci) { s.kunci = false; s.tx = e.clientX - 11; s.ty = e.clientY - 11; s.tw = 22; s.th = 22 }
      el.dataset.kunci = s.kunci ? '1' : ''
    }
    const gulir = () => { if (target) ukurSasaran() }
    const keluar = () => { s.tampak = false; el.dataset.tampak = '' }
    const tekan = () => { el.dataset.tekan = '1' }
    const lepas = () => { el.dataset.tekan = '' }

    raf = requestAnimationFrame(langkah)
    window.addEventListener('pointermove', gerak, { passive: true })
    window.addEventListener('scroll', gulir, { passive: true, capture: true })
    document.addEventListener('pointerleave', keluar)
    window.addEventListener('blur', keluar)
    window.addEventListener('pointerdown', tekan)
    window.addEventListener('pointerup', lepas)
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('ada-kursor')
      window.removeEventListener('pointermove', gerak)
      window.removeEventListener('scroll', gulir, { capture: true } as EventListenerOptions)
      document.removeEventListener('pointerleave', keluar)
      window.removeEventListener('blur', keluar)
      window.removeEventListener('pointerdown', tekan)
      window.removeEventListener('pointerup', lepas)
    }
  }, [])

  return (
    <div ref={root} className="kursor" aria-hidden="true">
      <span className="kursor-cincin" />
      <span className="kursor-sudut kiri-atas" /><span className="kursor-sudut kanan-atas" />
      <span className="kursor-sudut kiri-bawah" /><span className="kursor-sudut kanan-bawah" />
    </div>
  )
}

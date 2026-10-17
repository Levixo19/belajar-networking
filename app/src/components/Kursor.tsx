import { useEffect, useRef } from 'react'
import { gerakDikurangi, useGerak } from '../lib/gerak'

/**
 * Kursor bidik. Kursor sistem TIDAK disembunyikan (teks tetap bisa diseleksi dengan
 * presisi); yang ditambahkan hanya sebuah cincin kecil yang membuntuti dengan
 * pelembutan. Di atas sesuatu yang bisa diklik, cincin berubah menjadi empat sudut
 * jendela bidik yang mengunci bentuk elemennya, seperti teleskop yang menemukan
 * sasarannya. Di atas peta langit (data-kursor="lensa") bidikan menyingkir karena
 * peta punya lensanya sendiri; di atas prosa ia memudar supaya tidak mengganggu baca.
 * Fokus papan ketik (:focus-visible) dikunci dengan bidikan yang sama, sebagai tambahan
 * di atas cincin fokus, bukan penggantinya.
 *
 * Hanya aktif untuk mouse (pointer: fine, hover: hover) dan bila pengguna tidak minta
 * gerak dikurangi, lewat sistem atau lewat menu profil (efek dipasang ulang saat pilihan berubah). Tiap frame hanya menulis transform (titik pusat dan empat sudut),
 * tidak pernah width/height, jadi tidak ada kerja tata letak per frame. Sasaran diukur
 * saat berganti, saat digulir, dan saat ukuran jendela berubah, bukan di setiap gerak.
 * Pelembutan dihitung dari waktu, bukan per frame: di layar 120 Hz kecepatannya sama.
 */
const SASARAN = 'a[href], button:not(:disabled), [role="button"], summary, select, label[for], input[type="checkbox"], input[type="radio"], [data-kursor="kunci"]'
const DASAR = 22      // ukuran cincin bebas (px)
const SUDUT = 9       // panjang kaki sudut bidik (px)
const LAJU = 0.24     // porsi jarak yang ditempuh per 1/60 detik

export default function Kursor() {
  const root = useRef<HTMLDivElement>(null)
  const gerak = useGerak()

  useEffect(() => {
    const el = root.current
    if (!el) return
    const mq = window.matchMedia('(pointer: fine) and (hover: hover)')
    if (!mq.matches || gerakDikurangi()) return
    document.documentElement.classList.add('ada-kursor')
    const sudut = Array.from(el.querySelectorAll<HTMLElement>('.kursor-sudut'))
    // x, y = pusat; w, h = ukuran kotak bidik. t* = sasaran.
    const s = { x: -100, y: -100, w: DASAR, h: DASAR, tx: -100, ty: -100, tw: DASAR, th: DASAR, kunci: false, tampak: false }
    const kursorTetikus = { x: -100, y: -100 }
    let target: Element | null = null
    let raf = 0, sebelum = performance.now()

    const lepasKunci = () => { s.kunci = false; s.tx = kursorTetikus.x; s.ty = kursorTetikus.y; s.tw = DASAR; s.th = DASAR }
    const ukurSasaran = () => {
      if (!target) { lepasKunci(); return }
      const r = target.getBoundingClientRect()
      if (r.width > 640 || r.height > 420 || !r.width) { lepasKunci(); return }
      const pad = r.height < 40 ? 6 : 8
      s.kunci = true
      s.tx = r.left + r.width / 2; s.ty = r.top + r.height / 2; s.tw = r.width + pad * 2; s.th = r.height + pad * 2
    }
    const tandai = () => { el.dataset.kunci = s.kunci ? '1' : '' }

    const langkah = (kini: number) => {
      const dt = Math.min(64, kini - sebelum); sebelum = kini
      const a = 1 - Math.pow(1 - LAJU, dt / 16.67)
      s.x += (s.tx - s.x) * a; s.y += (s.ty - s.y) * a
      s.w += (s.tw - s.w) * a; s.h += (s.th - s.h) * a
      el.style.transform = `translate3d(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px, 0)`
      const kx = s.w / 2, ky = s.h / 2
      sudut[0].style.transform = `translate3d(${(-kx).toFixed(2)}px, ${(-ky).toFixed(2)}px, 0)`
      sudut[1].style.transform = `translate3d(${(kx - SUDUT).toFixed(2)}px, ${(-ky).toFixed(2)}px, 0)`
      sudut[2].style.transform = `translate3d(${(-kx).toFixed(2)}px, ${(ky - SUDUT).toFixed(2)}px, 0)`
      sudut[3].style.transform = `translate3d(${(kx - SUDUT).toFixed(2)}px, ${(ky - SUDUT).toFixed(2)}px, 0)`
      raf = requestAnimationFrame(langkah)
    }

    const gerak = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      kursorTetikus.x = e.clientX; kursorTetikus.y = e.clientY
      if (!s.tampak) { s.tampak = true; s.x = e.clientX; s.y = e.clientY; el.dataset.tampak = '1' }
      const t = e.target as Element | null
      const lensa = t?.closest?.('[data-kursor="lensa"]')
      const baru = lensa ? null : t?.closest?.(SASARAN) ?? null
      el.dataset.mode = lensa ? 'lensa' : baru ? 'kunci' : t?.closest?.('.prose p, .prose li, .prose td, input, textarea') ? 'baca' : 'bebas'
      if (baru !== target) { target = baru; ukurSasaran(); tandai() }
      if (!s.kunci) { s.tx = e.clientX; s.ty = e.clientY }
    }
    // Padanan papan ketik: elemen yang mendapat :focus-visible dikunci bidikan yang sama.
    const fokus = (e: FocusEvent) => {
      const t = e.target as Element | null
      if (!t?.matches?.(':focus-visible') || t.closest('[data-kursor="lensa"]')) return
      target = t; el.dataset.mode = 'kunci'
      if (!s.tampak) { s.tampak = true; el.dataset.tampak = '1' }
      ukurSasaran()
      if (!s.kunci) { target = null; el.dataset.mode = 'bebas' }
      tandai()
    }
    const ukurUlang = () => { if (target) { ukurSasaran(); tandai() } }
    const keluar = () => { s.tampak = false; el.dataset.tampak = '' }
    const tekan = () => { el.dataset.tekan = '1' }
    const lepas = () => { el.dataset.tekan = '' }

    raf = requestAnimationFrame(langkah)
    window.addEventListener('pointermove', gerak, { passive: true })
    window.addEventListener('scroll', ukurUlang, { passive: true, capture: true })
    window.addEventListener('resize', ukurUlang, { passive: true })
    document.addEventListener('focusin', fokus)
    document.addEventListener('pointerleave', keluar)
    window.addEventListener('blur', keluar)
    window.addEventListener('pointerdown', tekan)
    window.addEventListener('pointerup', lepas)
    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('ada-kursor')
      window.removeEventListener('pointermove', gerak)
      window.removeEventListener('scroll', ukurUlang, { capture: true } as EventListenerOptions)
      window.removeEventListener('resize', ukurUlang)
      document.removeEventListener('focusin', fokus)
      document.removeEventListener('pointerleave', keluar)
      window.removeEventListener('blur', keluar)
      window.removeEventListener('pointerdown', tekan)
      window.removeEventListener('pointerup', lepas)
    }
  }, [gerak])

  return (
    <div ref={root} className="kursor" aria-hidden="true">
      <span className="kursor-cincin" />
      <span className="kursor-sudut kiri-atas" /><span className="kursor-sudut kanan-atas" />
      <span className="kursor-sudut kiri-bawah" /><span className="kursor-sudut kanan-bawah" />
    </div>
  )
}

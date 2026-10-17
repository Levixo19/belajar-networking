import { gsap } from './motion'
import { gerakDikurangi } from './gerak'

/**
 * Bintang yang diklik di peta dasbor terbang ke tempatnya di plat kepala modul, supaya
 * terlihat bahwa kedua gambar itu langit yang sama. Yang terbang adalah titik HTML
 * berposisi fixed di <body>, bukan bintang SVG itu sendiri: elemen anak SVG belum bisa
 * diandalkan untuk View Transition, dan halaman lama sudah dilepas saat halaman baru
 * menempel. Kotak asal diukur sebelum navigasi, kotak tujuan sesudah plat menempel.
 *
 * Navigasi tidak pernah menunggu animasi ini. Kalau gerak dikurangi, bintang asal tidak
 * ditemukan, atau plat tujuan tidak muncul dalam ±0,5 detik, tidak ada yang terbang dan
 * halaman tetap berpindah seperti biasa. Kedua bintang tetap dalam keadaan alaminya.
 */
const TITIK = 12      // diameter titik terbang (px), harus sama dengan .bintang-terbang
const TUNGGU = 30     // batas frame menunggu plat tujuan menempel

export const bentukBintang = (id: string) =>
  document.querySelector(`[data-bintang="${CSS.escape(id)}"] .pf-bentuk`)

export function terbangkanBintang(asal: Element | null, id: string) {
  if (!asal || gerakDikurangi()) return
  const a = asal.getBoundingClientRect()
  if (!a.width) return
  const ax = a.left + a.width / 2, ay = a.top + a.height / 2

  const titik = document.createElement('div')
  titik.className = 'bintang-terbang'
  titik.setAttribute('aria-hidden', 'true')
  titik.style.left = `${ax}px`
  titik.style.top = `${ay}px`
  document.body.appendChild(titik)

  let frame = 0
  const cari = () => {
    const tujuan = document.querySelector(`.plat-modul [data-sini="${CSS.escape(id)}"] .pf-bentuk`)
    if (!tujuan) {
      if (++frame < TUNGGU) requestAnimationFrame(cari)
      else titik.remove()
      return
    }
    const b = tujuan.getBoundingClientRect()
    const dx = b.left + b.width / 2 - ax, dy = b.top + b.height / 2 - ay
    const skalaAsal = Math.max(1, Math.max(a.width, a.height) / TITIK)
    const skalaTujuan = Math.max(0.6, Math.max(b.width, b.height) / TITIK)
    // x dan y diberi kurva berbeda supaya lintasannya melengkung, bukan garis lurus.
    gsap.timeline({ onComplete: () => titik.remove() })
      .fromTo(titik, { x: 0, scale: skalaAsal, opacity: 1 }, { x: dx, scale: skalaTujuan, duration: 0.75, ease: 'power2.inOut' }, 0)
      .fromTo(titik, { y: 0 }, { y: dy, duration: 0.75, ease: 'power3.in' }, 0)
      .to(titik, { scale: skalaTujuan * 3, opacity: 0, duration: 0.45, ease: 'power2.out' })
  }
  requestAnimationFrame(cari)
}

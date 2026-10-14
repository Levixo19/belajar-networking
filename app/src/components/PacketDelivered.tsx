import { useRef } from 'react'
import { gsap, useGSAP, MOTION_OK } from '../lib/motion'

/**
 * Umpan balik saat modul ditandai selesai: rute tergambar, paket meluncur ke tujuan,
 * lalu centang muncul. Keadaan akhir sudah tergambar di markup, jadi tanpa animasi
 * (atau dengan reduced motion) yang terlihat adalah hasil akhirnya.
 */
export default function PacketDelivered({ xp = 40 }: { xp?: number }) {
  const root = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const tl = gsap.timeline()
      tl.fromTo('.pd-route', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.out' })
        .fromTo('.pd-packet', { opacity: 1 }, {
          duration: 0.75, ease: 'power2.inOut',
          motionPath: { path: '.pd-route', align: '.pd-route', alignOrigin: [0.5, 0.5] },
        }, '-=0.15')
        .to('.pd-packet', { opacity: 0, duration: 0.15 })
        .fromTo('.pd-dest', { scale: 0.6, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.45, ease: 'back.out(2.2)' }, '-=0.1')
        .fromTo('.pd-check', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' }, '-=0.25')
        .fromTo('.pd-text', { opacity: 0, x: -6 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' }, '-=0.15')
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <div ref={root} role="status" className="flex items-center gap-4 rounded-[var(--radius)] border border-[var(--primary-border)] bg-[var(--primary-soft)] px-4 py-3">
      <svg width="148" height="36" viewBox="0 0 148 36" aria-hidden="true" className="shrink-0 overflow-visible">
        <circle cx="12" cy="18" r="6" fill="var(--surface)" stroke="var(--text-faint)" strokeWidth="1.5" />
        <path className="pd-route" pathLength={1} strokeDasharray="1" d="M18 18 C 50 2, 92 34, 122 18"
          fill="none" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" />
        <circle className="pd-packet" cx="18" cy="18" r="3.5" fill="var(--primary)" opacity="0" />
        <g className="pd-dest">
          <circle cx="134" cy="18" r="12" fill="var(--primary)" />
          <path className="pd-check" pathLength={1} strokeDasharray="1" d="M128.5 18.5 l3.6 3.6 l7.4 -7.6"
            fill="none" stroke="var(--fg-contrast)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
      <div className="pd-text text-[14px]">
        <span className="font-medium">Paket terkirim.</span>{' '}
        <span className="text-muted">Modul tercatat tuntas, +{xp} XP.</span>
      </div>
    </div>
  )
}

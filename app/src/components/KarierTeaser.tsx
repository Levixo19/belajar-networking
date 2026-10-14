import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { PROFESI, readiness } from '../lib/profesi'
import { IconArrowRight } from './icons'

/** Tiga profesi terdekat dengan progres pengguna; tanpa progres, tampilkan pintu masuk untuk pemula. */
export default function KarierTeaser() {
  const s = useStore()
  if (!PROFESI.length) return null
  const scored = PROFESI.map(p => ({ p, r: readiness(p, s.progress) }))
  const adaProgres = scored.some(x => x.r.pct > 0)
  const top = adaProgres
    ? [...scored].sort((a, b) => b.r.pct - a.r.pct).slice(0, 3)
    : scored.filter(x => x.p.jenjang === 'pemula').slice(0, 3)

  return (
    <section className="border-t border-app" aria-labelledby="judul-teaser-karier">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 md:py-32 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h2 id="judul-teaser-karier" className="reveal max-w-[18ch] text-[clamp(1.9rem,3.2vw,2.75rem)] font-semibold leading-[1.08]">
            {adaProgres ? 'Profesi yang paling dekat dengan Anda.' : 'Ke mana fondasi ini membawa.'}
          </h2>
          <Link to="/karier" className="link-arrow shrink-0">Lihat {PROFESI.length} profesi</Link>
        </div>
        <div className="reveal mt-12 grid divide-y divide-[var(--border)] border-y border-app md:grid-cols-3 md:divide-x md:divide-y-0">
          {top.map(({ p, r }) => (
            <Link key={p.id} to={`/karier/${p.id}`} className="group flex flex-col gap-6 py-8 transition-colors hover:bg-[color-mix(in_srgb,var(--text)_2.5%,transparent)] md:px-8 md:first:pl-0">
              {adaProgres
                ? <span className="stat-num">{Math.round(r.pct * 100)}<span className="text-faint">%</span></span>
                : <span className="stat-num">{r.total}<span className="ml-2 align-middle text-[14px] font-medium tracking-normal text-faint">modul bekal</span></span>}
              <span>
                <span className="block text-[17px] font-medium tracking-[-0.02em]">{p.nama}</span>
                <span className="mt-1.5 block text-[13.5px] leading-relaxed text-muted">{p.ringkas}</span>
              </span>
              <span className="mt-auto inline-flex items-center gap-1.5 text-[13px] text-faint group-hover:text-[var(--text)]">
                {adaProgres ? `${r.done} dari ${r.total} modul bekal` : 'Bisa dimulai dari nol'} <span className="btn-bubble"><IconArrowRight size={14} /></span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

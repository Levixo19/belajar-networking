import { useParams, Link, Navigate } from 'react-router-dom'
import { GAMES } from '../games'
import { useStore } from '../lib/store'
import DetailShell from '../components/DetailShell'
import { IconArrowRight, IconTrophy } from '../components/icons'

export default function ArenaPage() {
  const { game } = useParams()
  const store = useStore()

  if (game) {
    const g = GAMES.find(x => x.slug === game)
    if (!g) return <Navigate to="/arena" replace />
    const Comp = g.Comp
    return (
      <DetailShell back="/arena" backLabel="Semua latihan" name={g.name} desc={g.desc} Icon={g.Icon} related={g.related}>
        <Comp />
      </DetailShell>
    )
  }

  const total = GAMES.reduce((a, g) => a + (store.games[g.slug] || 0), 0)
  const dimainkan = GAMES.filter(g => store.games[g.slug]).length

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 pt-12 sm:px-6 md:pt-20 lg:px-8">
      <header className="fade-up grid items-end gap-10 md:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <h1 className="max-w-[16ch] text-[clamp(2.2rem,4.5vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.045em]">
            Hitungan cepat, sampai jadi insting.
          </h1>
          <p className="mt-5 max-w-[54ch] text-[17px] leading-relaxed text-muted">
            Subnet, biner, port, dan urutan OSI. Hal yang harus terjawab dalam detik saat troubleshooting.
          </p>
        </div>
        <div className="flex items-center gap-4 md:justify-end">
          <IconTrophy size={22} className="text-faint" />
          <div>
            <div className="stat-num !text-[2.4rem]">{total.toLocaleString('id')}</div>
            <div className="mt-1 text-[13px] text-faint">
              {dimainkan ? `Total rekor dari ${dimainkan} latihan` : 'Belum ada rekor. Mulai dari mana saja.'}
            </div>
          </div>
        </div>
      </header>

      <ol className="road stagger mt-16 border-t border-app">
        {GAMES.map(g => {
          const best = store.games[g.slug] || 0
          return (
            <li key={g.slug}>
              <Link to={`/arena/${g.slug}`} className="road-item group !grid-cols-[2.5rem_minmax(0,1fr)_auto] !py-6">
                <span className="road-ico"><g.Icon size={17} /></span>
                <span className="min-w-0">
                  <span className="block text-[18px] font-medium tracking-[-0.02em]">{g.name}</span>
                  <span className="mt-1 block text-[14px] text-muted">{g.desc}</span>
                </span>
                <span className="flex items-center gap-5">
                  <span className="text-right">
                    <span className={`block text-[22px] font-semibold tabular-nums tracking-[-0.03em] ${best ? '' : 'text-faint'}`}>
                      {best ? best.toLocaleString('id') : '0'}
                    </span>
                    <span className="block text-[12px] text-faint">rekor</span>
                  </span>
                  <span className="btn-bubble text-faint group-hover:text-[var(--text)]"><IconArrowRight size={16} /></span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

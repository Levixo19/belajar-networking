import { useParams, Link, Navigate } from 'react-router-dom'
import { GAMES } from '../games'
import { useStore } from '../lib/store'
import DetailShell from '../components/DetailShell'
import KepalaHalaman from '../components/KepalaHalaman'
import Lencana from '../components/Lencana'

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
      <KepalaHalaman
        catatan={dimainkan ? `Total rekor ${total.toLocaleString('id')} dari ${dimainkan} latihan` : 'Belum ada rekor. Mulai dari mana saja.'}
        judul="Arena latihan cepat"
        visual={<div className="lencana-deret">{GAMES.map(g => <Lencana key={g.slug} benih={'arena:' + g.slug} nama={g.name} ukuran={124} nyala={!!store.games[g.slug]} />)}</div>}>
        <p className="kepala-lead">
          Latihan berwaktu untuk subnet, bilangan biner, urutan layer OSI, nomor port, dan prefix CIDR. Saat troubleshooting, hitungan seperti ini harus terjawab dalam hitungan detik.
        </p>
      </KepalaHalaman>

      <ol className="road mt-16 border-t border-app">
        {GAMES.map(g => {
          const best = store.games[g.slug] || 0
          return (
            <li key={g.slug}>
              <Link to={`/arena/${g.slug}`} className="road-item group !grid-cols-[minmax(0,1fr)_auto] !gap-6 !py-6">
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
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

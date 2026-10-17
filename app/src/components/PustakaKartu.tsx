import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { muatPustaka, type DataPustaka } from '../lib/pustaka'
import { JENIS } from '../lib/pustakaTopik'
import { IconArrowRight } from './icons'

/** Satu kartu Pustaka di dasbor: berapa yang ada, dari mana, dan pintu ke halamannya. */
export default function PustakaKartu() {
  const [data, setData] = useState<DataPustaka | null>(null)
  useEffect(() => { muatPustaka().then(setData, () => {}) }, [])
  if (!data) return null

  const id = data.entri.filter(e => e.bahasa === 'id').length
  const perJenis = ['buku', 'kursus', 'dokumentasi', 'video'].map(j => [j, data.entri.filter(e => e.jenis === j).length] as const)

  return (
    <section className="border-t border-app" aria-labelledby="judul-pustaka">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 md:py-28 lg:px-8">
        <Link to="/pustaka" className="tile group grid gap-10 !p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:!p-10">
          <div>
            <h2 id="judul-pustaka" className="max-w-[20ch] text-[clamp(1.7rem,2.8vw,2.4rem)] font-semibold leading-[1.1]">
              Pustaka: {data.entri.length.toLocaleString('id')} bacaan, terhubung ke tiap tahap.
            </h2>
            <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-muted">
              Buku terbuka, standar, kursus resmi, dan dokumentasi vendor dari {data.sumber.length} sumber beratribusi.
              {id > 0 && ` ${id} di antaranya berbahasa Indonesia dan tampil lebih dulu.`}
            </p>
            <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
              {perJenis.map(([j, n]) => (
                <div key={j}>
                  <dt className="text-[12.5px] text-faint">{JENIS[j]}</dt>
                  <dd className="text-[20px] font-semibold tabular-nums tracking-[-0.02em]">{n.toLocaleString('id')}</dd>
                </div>
              ))}
            </dl>
          </div>
          <span className="inline-flex items-center gap-2 text-[14px] font-medium">
            Buka Pustaka
          </span>
        </Link>
      </div>
    </section>
  )
}

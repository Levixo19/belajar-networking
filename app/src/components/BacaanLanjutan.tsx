import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { muatPustaka, bacaanUntukTahap, type ButirPustaka } from '../lib/pustaka'
import { JENIS } from '../lib/pustakaTopik'
import { IconArrowRight, IconBook } from './icons'

/** 4-6 tautan Pustaka untuk tahap sebuah modul. Data dimuat malas; selama memuat tidak ada yang digambar. */
export default function BacaanLanjutan({ tahap, judulTahap }: { tahap: string; judulTahap: string }) {
  const [butir, setButir] = useState<ButirPustaka[] | null>(null)
  useEffect(() => {
    let hidup = true
    muatPustaka().then(d => { if (hidup) setButir(bacaanUntukTahap(d.entri, tahap)) }, () => { if (hidup) setButir([]) })
    return () => { hidup = false }
  }, [tahap])
  if (!butir || butir.length === 0) return null
  // Kisi dua kolom: jumlah ganjil meninggalkan satu sel kosong, jadi dibulatkan ke genap.
  const tampil = butir.length > 1 ? butir.slice(0, butir.length - (butir.length % 2)) : butir

  return (
    <section className="mt-16" aria-labelledby="judul-bacaan">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="judul-bacaan" className="inline-flex items-center gap-2 text-[18px] font-semibold tracking-[-0.02em]">
          <IconBook size={18} className="text-faint" /> Bacaan lanjutan
        </h2>
        <Link to={`/pustaka?tahap=${encodeURIComponent(tahap)}`} className="link-arrow text-[13.5px]">
          Semua bacaan {judulTahap} <IconArrowRight size={13} />
        </Link>
      </div>
      <ul className="mt-4 grid gap-px overflow-hidden rounded-[var(--radius)] border border-app bg-[var(--border)] sm:grid-cols-2">
        {tampil.map(e => (
          <li key={e.id} className="bg-surface">
            <a href={e.url} target="_blank" rel="noopener noreferrer" className="group block h-full p-4 transition-colors hover:bg-[var(--surface-2)]">
              <span className="block text-[14.5px] font-medium leading-snug group-hover:underline group-hover:underline-offset-2">{e.judul}</span>
              <span className="mt-1.5 block text-[12.5px] text-faint">
                {JENIS[e.jenis] || e.jenis} · {e.bahasa === 'id' ? 'Indonesia' : 'Inggris'} · {new URL(e.url).hostname.replace(/^www\./, '')}
              </span>
              <span className="sr-only">(membuka situs lain)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

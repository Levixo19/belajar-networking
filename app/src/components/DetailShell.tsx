import type { FC, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { getModule } from '../lib/content'
import { IconArrowLeft } from './icons'

/** Kerangka halaman detail alat/game: kembali, judul, instrumen, modul teori terkait. */
export default function DetailShell({ back, backLabel, name, desc, Icon, related, children }: {
  back: string; backLabel: string; name: string; desc: string; Icon: FC<{ size?: number; className?: string }>
  related?: string; children: ReactNode
}) {
  const rel = related ? getModule(related) : undefined
  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6 md:pt-14 lg:px-8">
      <Link to={back} className="inline-flex items-center gap-1.5 text-[13px] text-faint transition-colors hover:text-[var(--text)]">
        <IconArrowLeft size={14} /> {backLabel}
      </Link>
      <header className="mb-10 mt-8">
        <span className="road-ico mb-5 !h-10 !w-10"><Icon size={19} /></span>
        <h1 className="text-[clamp(1.9rem,3.6vw,2.6rem)] font-semibold leading-[1.08]">{name}</h1>
        <p className="mt-3 max-w-[60ch] text-[16px] leading-relaxed text-muted">{desc}</p>
      </header>
      <div className="card p-5 sm:p-7">{children}</div>
      {rel && (
        <Link to={`/m/${encodeURI(rel.id)}`} className="tile group mt-4 flex items-center justify-between gap-4 !p-5">
          <span>
            <span className="block text-[12.5px] text-faint">Teori di balik alat ini</span>
            <span className="mt-1 block text-[15px] font-medium">{rel.title}</span>
          </span>
        </Link>
      )}
    </div>
  )
}

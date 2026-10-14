import { useParams, Link, Navigate } from 'react-router-dom'
import { TOOLS } from '../tools'
import { photo } from '../lib/photos'
import DetailShell from '../components/DetailShell'
import { IconArrowRight, IconTerminal } from '../components/icons'

export default function ToolsPage() {
  const { tool } = useParams()

  if (tool) {
    const t = TOOLS.find(x => x.slug === tool)
    if (!t) return <Navigate to="/tools" replace />
    const Comp = t.Comp
    return (
      <DetailShell back="/tools" backLabel="Semua alat" name={t.name} desc={t.desc} Icon={t.Icon} related={t.related}>
        <Comp />
      </DetailShell>
    )
  }

  const terminal = TOOLS.filter(t => t.slug.startsWith('cli-'))
  const sim = TOOLS.filter(t => !t.slug.startsWith('cli-'))
  const [utama, ...lain] = sim
  const foto = photo('patch-panel')

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-12 sm:px-6 md:pt-20 lg:px-8">
      <header className="fade-up max-w-3xl">
        <h1 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.045em]">
          Konsep abstrak, dibuat bisa disentuh.
        </h1>
        <p className="mt-5 max-w-[56ch] text-[17px] leading-relaxed text-muted">
          Simulator untuk subnetting, biner, model OSI, dan perjalanan paket. Semua berjalan di browser.
        </p>
      </header>

      {/* Bento: md 2 kolom (2+6=8 sel), lg 4 kolom (2+6=8 sel). Tidak ada sel kosong. */}
      <div className="bento stagger mt-14 md:!grid-cols-2 lg:!grid-cols-4">
        {utama && (
          <Link to={`/tools/${utama.slug}`} className="tile group flex min-h-[18rem] flex-col justify-end !border-transparent !p-7 text-white md:col-span-2">
            <img src={foto.url} alt="" className="absolute inset-0 h-full w-full object-cover grayscale transition-transform duration-700 ease-out group-hover:scale-105" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,.15),rgba(10,10,10,.88))]" />
            <div className="relative">
              <utama.Icon size={22} />
              <div className="mt-4 text-[24px] font-semibold tracking-[-0.03em]">{utama.name}</div>
              <p className="mt-1.5 max-w-[46ch] text-[14px] leading-relaxed text-white/75">{utama.desc}</p>
            </div>
          </Link>
        )}
        {lain.map(t => (
          <Link key={t.slug} to={`/tools/${t.slug}`} className="tile group flex min-h-[13rem] flex-col justify-between gap-6">
            <div className="flex items-start justify-between">
              <span className="road-ico"><t.Icon size={17} /></span>
              <span className="btn-bubble text-faint group-hover:text-[var(--text)]"><IconArrowRight size={16} /></span>
            </div>
            <div>
              <div className="text-[16px] font-medium tracking-[-0.015em]">{t.name}</div>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{t.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {terminal.length > 0 && (
        <section className="mt-24 grid gap-10 lg:grid-cols-12" aria-labelledby="judul-terminal">
          <div className="lg:col-span-4">
            <IconTerminal size={22} className="text-faint" />
            <h2 id="judul-terminal" className="reveal mt-4 text-[clamp(1.6rem,2.6vw,2.1rem)] font-semibold leading-[1.1]">
              Terminal tiga platform.
            </h2>
            <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-muted">
              Ketik perintah Cisco IOS, MikroTik RouterOS, dan Linux untuk tugas yang sama, lalu bandingkan.
            </p>
          </div>
          <ul className="road reveal border-app lg:col-span-8 lg:border-t">
            {terminal.map(t => (
              <li key={t.slug}>
                <Link to={`/tools/${t.slug}`} className="road-item group">
                  <span className="road-ico"><IconTerminal size={17} /></span>
                  <span className="min-w-0">
                    <span className="block text-[16px] font-medium tracking-[-0.015em]">{capitalize(t.name.replace(/^Terminal\s*[:\-]\s*/, ''))}</span>
                    <span className="mt-0.5 block text-[13.5px] text-muted">{t.desc}</span>
                  </span>
                  <span className="btn-bubble text-faint group-hover:text-[var(--text)]"><IconArrowRight size={16} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

const capitalize = (x: string) => x.charAt(0).toUpperCase() + x.slice(1)

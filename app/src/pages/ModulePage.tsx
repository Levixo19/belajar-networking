import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { getModule, neighbors, stageOfModule } from '../lib/content'
import { useStore } from '../lib/store'
import RichProse from '../components/RichProse'
import PacketDelivered from '../components/PacketDelivered'
import ReadingSettings from '../components/ReadingSettings'
import BacaanLanjutan from '../components/BacaanLanjutan'
import { scrollToId } from '../lib/scrollTo'
import { linkModuleRefs } from '../lib/modRefs'
import Planisfer from '../components/Planisfer'
import { Intinya, KasusNyata, Tantangan } from '../components/Wawasan'
import { toolForModule } from '../tools'
import { IconCheck, IconArrowRight, IconArrowLeft, IconClock, IconBook, IconCards, IconFlask, StageIcon } from '../components/icons'

export default function ModulePage() {
  const loc = useLocation()
  const id = decodeURIComponent(loc.pathname.replace(/^\/m\//, ''))
  const mod = getModule(id)
  const store = useStore()
  const [activeToc, setActiveToc] = useState('')
  const [terkirim, setTerkirim] = useState<string | null>(null)
  const [tawarLanjut, setTawarLanjut] = useState(false)
  const posisi = useRef(0)

  useEffect(() => { window.scrollTo(0, 0); setTerkirim(null) }, [id])

  // Posisi baca: ditawarkan saat modul dibuka, disimpan sekali saat modul ditinggalkan
  useEffect(() => {
    const tersimpan = store.scroll[id] || 0
    setTawarLanjut(tersimpan > 600 && store.progress[id] !== 'done')
    posisi.current = 0
    return () => { if (posisi.current > 400) store.saveScroll(id, posisi.current) }
  }, [id]) // eslint-disable-line
  useEffect(() => { if (mod) store.markReading(mod.id) }, [id]) // eslint-disable-line

  // Scroll-spy daftar isi
  useEffect(() => {
    if (!mod) return
    const heads = Array.from(document.querySelectorAll('#intinya, .prose h2, .prose h3, #kasus-nyata, #tantangan')) as HTMLElement[]
    if (!heads.length) return
    const obs = new IntersectionObserver(
      entries => {
        const vis = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (vis[0]) { setActiveToc((vis[0].target as HTMLElement).id); posisi.current = window.scrollY; setTawarLanjut(false) }
      },
      { rootMargin: '-90px 0px -70% 0px', threshold: 0 }
    )
    heads.forEach(h => obs.observe(h))
    return () => obs.disconnect()
  }, [id, mod])

  const { prev, next } = useMemo(() => neighbors(id), [id])
  const stage = stageOfModule.get(id)
  const EmbeddedTool = toolForModule(id)

  if (!mod) {
    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-start justify-center px-4 py-20">
        <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-tight">Modul tidak ditemukan.</h1>
        <p className="mt-3 text-muted">Tautannya mungkin sudah berubah. Cari lewat palet perintah atau kembali ke dasbor.</p>
        <Link to="/" className="btn btn-primary mt-8">Kembali ke dasbor</Link>
      </div>
    )
  }

  const done = store.progress[mod.id] === 'done'
  const w = mod.wawasan
  // Daftar isi: bagian materi, diapit lapis wawasan bila ada.
  const daftarIsi = [
    ...(w?.intinya ? [{ id: 'intinya', text: 'Intinya', level: 2 }] : []),
    ...mod.toc,
    ...(w?.kasus ? [{ id: 'kasus-nyata', text: 'Kasus nyata', level: 2 }] : []),
    ...(w?.tantangan ? [{ id: 'tantangan', text: 'Tantangan', level: 2 }] : []),
  ]

  return (
    <>
      {/* Garis progres baca kini di kaki pil atas (PilAtas, .pil-progres). */}

      <div className="mx-auto flex max-w-[1200px] gap-16 px-4 pb-24 pt-10 sm:px-6 md:pt-16 lg:px-8">
        <article className="min-w-0 flex-1">
          <div className="mx-auto max-w-[44rem]">
            <header className="mb-12">
              {/* Plat rasi tahap ini: bintang modul ini ditandai "Anda di sini", sama dengan peta di dasbor. */}
              {stage && stage.id !== 'panduan' && stage.id !== 'referensi' && (
                <figure className="plat-modul bingkai-atlas mb-9">
                  <Planisfer mode="plat" sorot={stage.id} sini={mod.id} progress={store.progress} judul={`Peta tahap ${stage.title}`} />
                </figure>
              )}
              {stage && (
                <nav aria-label="Lokasi" className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-faint">
                  <Link to="/" className="hover:text-[var(--text)]">Dasbor</Link>
                  <span aria-hidden="true">/</span>
                  <Link to={`/m/${encodeURI(stage.modules[0].id)}`} className="inline-flex items-center gap-1.5 hover:text-[var(--text)]">
                    <StageIcon id={stage.id} size={14} />
                    <span>{stage.title}</span>
                  </Link>
                  {mod.num && (<><span aria-hidden="true">/</span><span className="tabular-nums">Modul {mod.num}</span></>)}
                </nav>
              )}
              <h1 className="judul-modul">
                {mod.num && <span className="judul-modul-no">{mod.num}</span>}
                {mod.title}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-faint">
                <span className="inline-flex items-center gap-1.5"><IconClock size={15} /> {mod.readMin} menit baca</span>
                <span className="inline-flex items-center gap-1.5"><IconBook size={15} /> {mod.words.toLocaleString('id')} kata</span>
                {mod.cards.length > 0 && (
                  <span className="inline-flex items-center gap-1.5"><IconCards size={15} /> {mod.cards.length} kartu latihan</span>
                )}
                {done && <span className="chip chip-primary"><IconCheck size={12} /> Tuntas</span>}
              </div>
              {stage && stage.modules.length > 1 && (() => {
                const idx = stage.modules.findIndex(x => x.id === mod.id)
                return (
                  <div className="mt-6 max-w-sm">
                    <div className="mb-2 text-[12.5px] text-faint">Modul {idx + 1} dari {stage.modules.length} di {stage.title}</div>
                    <nav className="stage-steps" aria-label={`Modul di tahap ${stage.title}`}>
                      {stage.modules.map((x, i) => (
                        <Link key={x.id} to={`/m/${encodeURI(x.id)}`} title={x.title} aria-label={x.title}
                          aria-current={i === idx ? 'page' : undefined}
                          className={i === idx ? 'is-now' : store.progress[x.id] === 'done' ? 'is-done' : ''} />
                      ))}
                    </nav>
                  </div>
                )
              })()}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <ReadingSettings />
                {tawarLanjut && (
                  <button onClick={() => {
                      const y = store.scroll[mod.id] || 0
                      window.scrollTo({ top: y, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
                      setTawarLanjut(false)
                    }}
                    className="fade-in inline-flex h-8 items-center gap-2 rounded-lg bg-[var(--fg)] px-3 text-[13px] font-medium text-[var(--fg-contrast)] transition-transform active:scale-[0.98]">
                    Lanjutkan dari terakhir dibaca
                  </button>
                )}
              </div>
            </header>

            {(mod.prasyarat || mod.tujuan) && (
              <div className="mb-14 grid gap-px overflow-hidden rounded-[var(--radius)] border border-app bg-[var(--border)] sm:grid-cols-2">
                {mod.prasyarat && <MetaBlock label="Sebelum mulai" html={mod.prasyarat} />}
                {mod.tujuan && <MetaBlock label="Setelah modul ini Anda bisa" html={mod.tujuan} />}
              </div>
            )}

            {w?.intinya && <Intinya w={w.intinya} />}

            <RichProse html={mod.bodyHtml} moduleId={mod.id} />

            {EmbeddedTool && (
              <section className="card mt-16 overflow-hidden" aria-label="Alat interaktif terkait">
                <div className="flex items-center gap-2 border-b border-app px-5 py-3.5 text-[13.5px] font-medium">
                  <IconFlask size={16} className="text-faint" />
                  Coba langsung
                </div>
                <div className="p-5 sm:p-6"><EmbeddedTool /></div>
              </section>
            )}

            {w?.kasus && <KasusNyata k={w.kasus} />}
            {w?.tantangan && <Tantangan t={w.tantangan} moduleId={mod.id} />}

            {stage && <BacaanLanjutan tahap={stage.id} judulTahap={stage.title} />}

            <section className="mt-20 border-t border-app pt-10" aria-label="Selesaikan modul">
              <h2 className="text-[22px] font-semibold tracking-[-0.03em]">
                {done ? 'Modul ini sudah tuntas.' : 'Sudah menangkap intinya?'}
              </h2>
              <p className="mt-2 max-w-[52ch] text-[15px] text-muted">
                {done
                  ? 'Progres tersimpan di profilmu. Kartu latihannya akan muncul lagi di review sesuai jadwal.'
                  : 'Tandai selesai untuk menyalakan bintang modul ini di peta. Anda mendapat 40 XP, dan kartu latihannya masuk antrean review.'}
              </p>
              {terkirim === mod.id && done && <div className="mt-6"><PacketDelivered /></div>}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                <button
                  onClick={() => { setTerkirim(done ? null : mod.id); store.toggleDone(mod.id) }}
                  className={`btn btn-lg ${done ? '' : 'btn-primary'}`}
                >
                  <IconCheck size={16} />
                  {done ? 'Tandai belum selesai' : 'Tandai selesai'}
                </button>
                {mod.cards.length > 0 && (
                  <Link to="/review" className="link-arrow">Buka review</Link>
                )}
              </div>
            </section>

            <nav className="mt-16 grid gap-3 sm:grid-cols-2" aria-label="Modul sebelum dan sesudah">
              {prev ? (
                <Link to={`/m/${encodeURI(prev.id)}`} className="tile group !p-5">
                  <span className="flex items-center gap-1.5 text-[12.5px] text-faint">
                    <IconArrowLeft size={14} /> Sebelumnya
                  </span>
                  <span className="mt-2 block text-[15px] font-medium leading-snug">{prev.title}</span>
                </Link>
              ) : <span className="hidden sm:block" />}
              {next && (
                <Link to={`/m/${encodeURI(next.id)}`} className="tile group !p-5 text-right">
                  <span className="flex items-center justify-end gap-1.5 text-[12.5px] text-faint">
                    Berikutnya <IconArrowRight size={14} />
                  </span>
                  <span className="mt-2 block text-[15px] font-medium leading-snug">{next.title}</span>
                </Link>
              )}
            </nav>
          </div>
        </article>

        {daftarIsi.length > 1 && (
          <aside className="hidden w-56 shrink-0 xl:block" aria-label="Daftar isi">
            <div className="sticky top-28">
              <div className="mb-3 text-[13px] font-medium">Di halaman ini</div>
              <nav className="lintasan max-h-[calc(100dvh-12rem)] overflow-y-auto">
                {daftarIsi.map(t => (
                  <a key={t.id} href={`#${t.id}`} onClick={scrollToId(t.id)}
                    className={`toc-link ${t.level === 3 ? '!pl-6' : ''} ${activeToc === t.id ? 'is-on' : ''}`}>
                    {t.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>
    </>
  )
}

function MetaBlock({ label, html }: { label: string; html: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { if (ref.current) linkModuleRefs(ref.current) }, [html])
  return (
    <div className="bg-surface p-5">
      <div className="mb-2 text-[13px] font-medium">{label}</div>
      <div
        ref={ref}
        className="text-[14px] leading-relaxed text-muted [&_a.mod-ref]:no-underline [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-[var(--surface-2)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

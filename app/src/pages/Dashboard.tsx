import { lazy, Suspense, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { stagesByBand, learnModules, nextModule, stages, meta, BUKAN_MATERI } from '../lib/content'
import { isDue } from '../lib/srs'
import { photo } from '../lib/photos'
import { scrollToId } from '../lib/scrollTo'
import { gsap, useGSAP, MOTION_OK } from '../lib/motion'
import { IconArrowRight, IconCards, IconFlame, IconCheck, IconClock, StageIcon } from '../components/icons'
import { TOOLS } from '../tools'
import { GAMES } from '../games'

const KarierTeaser = lazy(() => import('../components/KarierTeaser'))

const MANIFESTO =
  'Jaringan bukan hafalan perintah. Ini soal memahami ke mana sebuah paket pergi, kenapa ia berhenti, dan bagaimana membuatnya sampai. Setiap modul di sini menambah satu lapis pemahaman itu.'

export default function Dashboard() {
  const s = useStore()
  const root = useRef<HTMLDivElement>(null)

  const modules = learnModules
  const jalur = useMemo(() => stagesByBand().filter(g => !BUKAN_MATERI.includes(g.band)), [])
  const selesai = modules.filter(m => s.progress[m.id] === 'done').length
  const lanjut = nextModule(s.progress)
  const review = Object.values(s.srs).filter(x => isDue(x)).length
  const persen = modules.length ? selesai / modules.length : 0
  const sudahMulai = selesai > 0 || s.xp > 0
  const lanjutStage = stages.find(x => x.id === lanjut?.stage)

  const fotoHero = photo('patch-panel')
  const fotoRj = photo('rj45-plug')
  const fotoFiber = photo('fiber-connector')
  const fotoStreak = photo('fiber-strands')
  const fotoLebar = photo('sfp-module')
  const praktik = [
    { to: '/tools', title: 'Alat interaktif', desc: `${TOOLS.length} simulator: subnet, OSI, TCP handshake, VLAN, dan terminal tiga platform.`, img: photo('router-soho') },
    { to: '/arena', title: 'Arena latihan', desc: `${GAMES.length} drill berwaktu supaya subnet, biner, dan port jadi refleks.`, img: photo('cable-tester') },
    { to: firstOf('lab'), title: 'Lab praktik', desc: 'Skenario lab bertahap yang bisa diulang di Packet Tracer, GNS3, atau perangkat asli.', img: photo('mikrotik') },
    { to: firstOf('20-proyek-akhir'), title: 'Proyek akhir', desc: 'Rancang dan dokumentasikan jaringan kantor cabang dari nol sampai serah terima.', img: photo('access-point') },
  ]
  const kredit = [fotoHero, fotoRj, fotoFiber, fotoStreak, fotoLebar, ...praktik.map(p => p.img)]

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      // Paragraf manifesto: tiap kata menyala berurutan mengikuti scroll
      gsap.fromTo('.scrub-text .w', { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.08,
        scrollTrigger: { trigger: '.scrub-text', start: 'top 78%', end: 'bottom 42%', scrub: true },
      })
      // Foto lebar: membesar saat masuk, meredup saat keluar
      const tl = gsap.timeline({
        scrollTrigger: { trigger: '.wide-media', start: 'top bottom', end: 'bottom top', scrub: true },
      })
      tl.fromTo('.wide-media img', { scale: 0.84, opacity: 0.55 }, { scale: 1, opacity: 1, ease: 'none', duration: 1 })
        .to('.wide-media img', { opacity: 0.2, ease: 'none', duration: 0.8 })
      // Bar progres tiap tahap tumbuh sekali saat terlihat
      gsap.utils.toArray<HTMLElement>('.road-bar').forEach(bar => {
        gsap.fromTo(bar, { scaleX: 0 }, {
          scaleX: Number(bar.dataset.v || 0), duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: bar, start: 'top 92%', once: true },
        })
      })
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <div ref={root} className="overflow-x-hidden">
      {/* Perhatian: hero editorial terbelah */}
      <section className="mx-auto max-w-[1280px] px-4 pb-20 pt-12 sm:px-6 md:pb-28 md:pt-20 lg:px-8" aria-labelledby="judul-hero">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="fade-up lg:col-span-7">
            <span className="eyebrow mb-5">
              {s.profileName ? `Ruang belajar ${s.profileName}` : 'Kurikulum jaringan komputer'}
            </span>
            <h1 id="judul-hero" className="hero-title max-w-[17ch]">
              {sudahMulai ? (
                <>Lanjutkan dari <InlineImg url={fotoRj.url} /> titik terakhirmu.</>
              ) : (
                <>Pahami jaringan dari <InlineImg url={fotoRj.url} /> kabel sampai <InlineImg url={fotoFiber.url} /> cloud.</>
              )}
            </h1>
            <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-muted">
              Kurikulum berurutan untuk Cisco, MikroTik, dan Linux. Satu konsep, tiga platform, tanpa lompatan.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
              {lanjut && (
                <Link to={`/m/${encodeURI(lanjut.id)}`} className="btn btn-primary btn-lg group">
                  Lanjut belajar
                  <span className="btn-bubble"><IconArrowRight size={16} /></span>
                </Link>
              )}
              <a href="#peta" onClick={scrollToId('peta')} className="link-arrow">Lihat kurikulum</a>
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="hero-media fade-up aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]" style={{ animationDelay: '120ms' }}>
              <img src={fotoHero.url} alt="Switch rackmount 19 inci dan patch panel dengan kabel ethernet terpasang" fetchPriority="high" />
            </div>
            {lanjut && (
              <Link
                to={`/m/${encodeURI(lanjut.id)}`}
                className="menu-panel fade-up group absolute -bottom-8 left-4 right-4 flex items-center gap-4 p-4 sm:left-auto sm:right-6 sm:w-[22rem] lg:-left-10 lg:right-auto"
                style={{ animationDelay: '260ms' }}
              >
                <span className="road-ico shrink-0">
                  {lanjutStage && <StageIcon id={lanjutStage.id} size={17} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] text-faint">
                    {sudahMulai ? 'Berikutnya' : 'Mulai di sini'}{lanjut.num ? `, modul ${lanjut.num}` : ''}
                  </span>
                  <span className="mt-0.5 block truncate text-[14.5px] font-medium">{lanjut.title}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-[12px] text-faint">
                    <IconClock size={13} /> {lanjut.readMin} menit baca
                  </span>
                </span>
                <span className="btn-bubble text-faint group-hover:text-[var(--text)]"><IconArrowRight size={16} /></span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Marquee tahap kurikulum: satu-satunya marquee di halaman */}
      <section className="border-y border-app py-6" aria-label="Tahap kurikulum">
        <div className="marquee">
          <div className="marquee-track">
            {[0, 1].map(dup => (
              <div key={dup} className="flex shrink-0 items-center gap-12" aria-hidden={dup === 1}>
                {stages.filter(x => !BUKAN_MATERI.includes(x.id)).map(st => (
                  <Link
                    key={st.id}
                    to={`/m/${encodeURI(st.modules[0].id)}`}
                    tabIndex={dup === 1 ? -1 : undefined}
                    className="flex items-center gap-2.5 whitespace-nowrap text-[17px] font-medium tracking-[-0.02em] text-faint transition-colors hover:text-[var(--text)]"
                  >
                    <StageIcon id={st.id} size={18} />
                    {st.title}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Minat: bento progres. Grid 4x2: A(2x2) + B(2x1) + C(1x1) + D(1x1) = 8 sel */}
      <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 md:py-32 lg:px-8" aria-labelledby="judul-progres">
        <h2 id="judul-progres" className="reveal max-w-[20ch] text-[clamp(1.9rem,3.2vw,2.75rem)] font-semibold leading-[1.08]">
          {sudahMulai ? 'Progresmu sejauh ini.' : 'Semua progres tercatat di sini.'}
        </h2>
        <div className="bento reveal mt-10">
          <div className="tile flex flex-col justify-between gap-8 md:col-span-2 md:row-span-2 md:p-8">
            {selesai > 0 ? (
              <div>
                <div className="stat-num">{Math.round(persen * 100)}<span className="text-faint">%</span></div>
                <p className="mt-3 text-[14.5px] text-muted">
                  {selesai} dari {modules.length} modul tuntas. Tiap kotak di bawah adalah satu modul.
                </p>
              </div>
            ) : (
              <div>
                <div className="text-[clamp(1.6rem,2.6vw,2.1rem)] font-semibold leading-[1.1]">Perjalanan dimulai di sini.</div>
                <p className="mt-3 max-w-[44ch] text-[14.5px] text-muted">
                  {modules.length} modul menunggu, satu kotak untuk tiap modul. Kotak pertama terisi begitu Anda menuntaskan modul pembuka.
                </p>
                {lanjut && (
                  <Link to={`/m/${encodeURI(lanjut.id)}`} className="link-arrow mt-5">
                    {lanjut.title} ({lanjut.readMin} menit) <IconArrowRight size={14} />
                  </Link>
                )}
              </div>
            )}
            <div className="space-y-4">
              {jalur.map(g => {
                const bagian = g.stages.flatMap(x => x.modules)
                return (
                  <div key={g.band} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3">
                    <span className="truncate text-[12.5px] text-faint">{g.label.replace('Tahap ', '')}</span>
                    <span className="flex flex-wrap gap-[3px]" aria-label={`${g.label}: ${bagian.filter(m => s.progress[m.id] === 'done').length} dari ${bagian.length}`}>
                      {bagian.map(m => (
                        <i key={m.id} title={m.title}
                          className={`block h-2.5 w-2.5 rounded-[3px] ${
                            s.progress[m.id] === 'done' ? 'bg-[var(--primary)]'
                              : s.progress[m.id] ? 'bg-[var(--border-strong)]' : 'bg-[var(--surface-3)]'
                          }`} />
                      ))}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <Link to="/review" className="tile tile-ink group flex flex-col justify-between gap-6 md:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <IconCards size={22} />
              <span className="btn-bubble"><IconArrowRight size={18} /></span>
            </div>
            <div>
              <div className="text-[22px] font-semibold tracking-[-0.03em]">
                {review ? `${review} kartu siap diulang` : 'Antrean review kosong'}
              </div>
              <p className="mt-1 text-[14px] text-muted">
                {review ? 'Ulang sekarang, tepat sebelum lupa.' : 'Kartu baru muncul setelah kamu menyelesaikan modul.'}
              </p>
            </div>
          </Link>

          <div className="tile tile-tint flex flex-col justify-between gap-6">
            <span className="text-[13px] text-muted">Level</span>
            <div>
              <div className="stat-num !text-[2.5rem]">{s.level}</div>
              <div className="mt-2 text-[13px] tabular-nums text-faint">{s.xp.toLocaleString('id')} XP</div>
            </div>
          </div>

          <div className="tile flex flex-col justify-between gap-6 !border-transparent text-white">
            <img src={fotoStreak.url} alt="" className="absolute inset-0 h-full w-full object-cover grayscale" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,.35),rgba(10,10,10,.82))]" />
            <span className="relative flex items-center gap-1.5 text-[13px] text-white/75">
              <IconFlame size={15} /> Beruntun
            </span>
            <div className="relative">
              <div className="stat-num !text-[2.5rem]">{s.streak}</div>
              <div className="mt-2 text-[13px] text-white/70">hari berturut-turut</div>
            </div>
          </div>
        </div>
      </section>

      {/* Keinginan: peta perjalanan, judul menempel di kiri */}
      <section id="peta" className="scroll-mt-20 border-t border-app" aria-labelledby="judul-peta">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-4 py-20 sm:px-6 md:py-32 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <h2 id="judul-peta" className="reveal text-[clamp(1.9rem,3.2vw,2.75rem)] font-semibold leading-[1.08]">
                Peta perjalanan.
              </h2>
              <p className="mt-4 max-w-[38ch] text-[15px] leading-relaxed text-muted">
                Tujuh tahap berurutan. Tiap tahap mengandalkan tahap sebelumnya, jadi urutannya sengaja tidak diacak.
              </p>
            </div>
          </div>
          <ol className="road border-app lg:col-span-8 lg:border-t">
            {jalur.map(g => {
              const bagian = g.stages.flatMap(x => x.modules)
              const tuntas = bagian.filter(x => s.progress[x.id] === 'done').length
              const isDone = tuntas === bagian.length && bagian.length > 0
              const tujuan = bagian.find(x => s.progress[x.id] !== 'done') ?? bagian[0]
              const pct = bagian.length ? tuntas / bagian.length : 0
              return (
                <li key={g.band} className="reveal">
                  <Link to={`/m/${encodeURI(tujuan.id)}`} className={`road-item group ${isDone ? 'is-done' : ''}`}>
                    <span className="road-ico">
                      {isDone ? <IconCheck size={16} /> : <StageIcon id={g.stages[0].id} size={17} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[16px] font-medium tracking-[-0.015em]">{g.label}</span>
                      <span className="mt-0.5 block truncate text-[13px] text-faint">
                        {g.stages.map(x => x.title).join(', ')}
                      </span>
                      <span className="mt-3 block w-full max-w-[16rem]">
                        <span className="road-bar block" data-v={pct} style={{ transform: `scaleX(${pct})` }} />
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-[13px] tabular-nums text-faint">{tuntas}/{bagian.length}</span>
                      <span className="btn-bubble text-faint group-hover:text-[var(--text)]"><IconArrowRight size={16} /></span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* Paragraf yang menyala saat di-scroll + foto lebar */}
      <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 md:py-32 lg:px-8" aria-label="Cara belajar">
        <p className="scrub-text mx-auto max-w-[30ch] text-center">
          {MANIFESTO.split(' ').map((w, i) => <span key={i} className="w">{w} </span>)}
        </p>
        <figure className="wide-media mt-16 md:mt-24">
          <img src={fotoLebar.url} alt="Modul transceiver SFP+ 10GBASE-SR" loading="lazy"
            className="block aspect-[21/9] w-full rounded-[var(--radius-xl)] object-cover grayscale-[.6] will-change-transform" />
        </figure>
      </section>

      {/* Arah karier: data profesi dimuat terpisah */}
      <Suspense fallback={null}><KarierTeaser /></Suspense>

      {/* Praktik: akordeon horizontal */}
      <section className="border-t border-app" aria-labelledby="judul-praktik">
        <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 md:py-32 lg:px-8">
          <h2 id="judul-praktik" className="reveal max-w-[22ch] text-[clamp(1.9rem,3.2vw,2.75rem)] font-semibold leading-[1.08]">
            Teori dibaca, sisanya dipraktikkan.
          </h2>
          <div className="hacc reveal mt-10">
            {praktik.map(p => (
              <Link key={p.title} to={p.to} className="hacc-item group">
                <img src={p.img.url} alt="" loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-90 grayscale transition-transform duration-700 ease-out group-hover:scale-105" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,.2),rgba(10,10,10,.55)_45%,rgba(10,10,10,.9))]" />
                <span className="hacc-label absolute bottom-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[15px] font-medium text-white lg:block">
                  {p.title}
                </span>
                <div className="hacc-body relative flex h-full min-h-[15rem] flex-col justify-end p-6 text-white lg:min-h-0">
                  <div className="text-[22px] font-semibold tracking-[-0.03em]">{p.title}</div>
                  <p className="mt-2 max-w-[36ch] text-[14px] leading-relaxed text-white/75">{p.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium">
                    Buka <span className="btn-bubble"><IconArrowRight size={15} /></span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Aksi: CTA penutup dan footer */}
      <footer className="border-t border-app">
        <div className="mx-auto max-w-[1280px] px-4 pb-10 pt-20 sm:px-6 md:pt-32 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
            <h2 className="reveal max-w-[14ch] text-[clamp(2.4rem,5.5vw,4.5rem)] font-semibold leading-[1] tracking-[-0.05em]">
              Satu modul lagi hari ini.
            </h2>
            {lanjut && (
              <Link to={`/m/${encodeURI(lanjut.id)}`} className="btn btn-primary btn-lg group shrink-0">
                Lanjut belajar
                <span className="btn-bubble"><IconArrowRight size={16} /></span>
              </Link>
            )}
          </div>
          <div className="mt-20 grid gap-8 border-t border-app pt-8 text-[13px] text-faint md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <p>{meta.totalModules} modul dan {meta.totalCards} kartu latihan. Progres tersimpan per profil.</p>
              <p className="max-w-[80ch] leading-relaxed">
                Foto: {kredit.filter((p, i, a) => a.findIndex(q => q.src === p.src) === i).map((p, i, a) => (
                  <span key={p.src}>
                    <a href={p.page} target="_blank" rel="noreferrer" className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--text)]">{p.credit}</a>
                    {i < a.length - 1 ? ', ' : ''}
                  </span>
                ))}. Wikimedia Commons.
              </p>
            </div>
            <nav className="flex gap-5" aria-label="Footer">
              <Link to="/review" className="hover:text-[var(--text)]">Review</Link>
              <Link to="/tools" className="hover:text-[var(--text)]">Alat</Link>
              <Link to="/arena" className="hover:text-[var(--text)]">Arena</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}

function InlineImg({ url }: { url: string }) {
  return <span className="inline-img" style={{ backgroundImage: `url(${url})` }} aria-hidden="true" />
}

function firstOf(stageId: string) {
  const st = stages.find(x => x.id === stageId)
  return st ? `/m/${encodeURI(st.modules[0].id)}` : '/'
}

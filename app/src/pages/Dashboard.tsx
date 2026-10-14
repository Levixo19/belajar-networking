import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { learnModules, nextModule, stages, meta, BUKAN_MATERI, BAND_LABEL, allCards, type Module, type Stage } from '../lib/content'
import { isDue } from '../lib/srs'
import { photo } from '../lib/photos'
import { scrollToId } from '../lib/scrollTo'
import { gsap, useGSAP, MOTION_OK, SplitText } from '../lib/motion'
import { IconArrowRight, IconArrowLeft, IconCards, IconFlame, IconClock, IconBook, IconFlask, IconTools, StageIcon } from '../components/icons'
import PustakaKartu from '../components/PustakaKartu'
import { SampulTahap } from '../lib/sampul'

const KarierTeaser = lazy(() => import('../components/KarierTeaser'))

const MANIFESTO =
  'Jaringan bukan hafalan perintah. Ini soal memahami ke mana sebuah paket pergi, kenapa ia berhenti, dan bagaimana membuatnya sampai. Setiap modul di sini menambah satu lapis pemahaman itu.'

const CARA = [
  { judul: 'Baca konsepnya', isi: 'Setiap modul mulai dari analogi, lalu turun ke paket, header, dan perintah. Tidak ada lompatan yang menuntut Anda sudah tahu.', Icon: IconBook },
  { judul: 'Coba langsung', isi: 'Kalkulator subnet, penjelajah OSI, dan simulator handshake membuat yang abstrak bisa disentuh tanpa perangkat apa pun.', Icon: IconTools },
  { judul: 'Ulang tepat sebelum lupa', isi: 'Kartu latihan tiap modul masuk antrean review berjarak. Yang mudah muncul makin jarang, yang sulit makin sering.', Icon: IconCards },
  { judul: 'Praktikkan di lab', isi: 'Skenario lab bertahap untuk Packet Tracer, MikroTik CHR, dan Linux. Rusak, lalu perbaiki: itu cara belajar yang paling melekat.', Icon: IconFlask },
]

const tautan = (m: Module) => `/m/${encodeURI(m.id)}`
const belajar = stages.filter(x => !BUKAN_MATERI.includes(x.id))

export default function Dashboard() {
  const s = useStore()
  const root = useRef<HTMLDivElement>(null)

  const selesai = learnModules.filter(m => s.progress[m.id] === 'done').length
  const lanjut = nextModule(s.progress)
  const baru = s.xp === 0 && selesai === 0
  const lanjutStage = stages.find(x => x.id === lanjut.stage)
  const due = useMemo(() => allCards.filter(c => s.srs[c.id] && isDue(s.srs[c.id])), [s.srs])

  // Tahap yang sedang dijalani: tahap modul berikutnya dan tiga sesudahnya.
  const sedang = useMemo(() => {
    const i = Math.max(0, belajar.findIndex(x => x.id === lanjut.stage))
    return belajar.slice(i, i + 4)
  }, [lanjut.stage])

  const fotoHero = photo('dc-racks')
  const fotoRj = photo('rj45-plug')
  const fotoFiber = photo('fiber-connector')
  const kredit = [fotoHero, fotoRj, fotoFiber]

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      // Kalimat yang menyala kata demi kata mengikuti gulir. Keadaan alaminya teks
      // utuh: kalau gerak dikurangi, blok ini tidak pernah dijalankan.
      const split = SplitText.create('.scrub-text', { type: 'words', wordsClass: 'w' })
      gsap.fromTo(split.words, { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.08,
        scrollTrigger: { trigger: '.scrub-text', start: 'top 78%', end: 'bottom 45%', scrub: true },
      })
      // Tumpukan kartu: kartu yang tertimpa mengecil dan meredup. Penempelannya CSS
      // (sticky), jadi tanpa gerak kartu tetap tertumpuk rapi.
      const kartu = gsap.utils.toArray<HTMLElement>('.tumpuk-kartu')
      kartu.forEach((el, i) => {
        if (i === kartu.length - 1) return
        // Yang digerakkan --redup (lapisan ::after berwarna --bg), bukan `filter`: tween
        // filter dari "none" sempat menggelapkan kartu jadi abu kotor.
        gsap.fromTo(el, { scale: 1, '--redup': 0 }, {
          scale: 0.94, '--redup': 0.5, ease: 'none',
          scrollTrigger: { trigger: kartu[i + 1], start: 'top bottom', end: 'top 30%', scrub: true },
        })
      })
      return () => split.revert()
    })
    return () => mm.revert()
  }, { scope: root })

  return (
    <div ref={root} className="overflow-x-hidden">
      {/* Perhatian: hero sinematik di tengah, foto penuh di belakang lapisan pekat */}
      <section className="hero-sinema" aria-labelledby="judul-hero">
        <img src={fotoHero.url} alt="" className="hero-sinema-foto" fetchPriority="high" />
        <div className="hero-sinema-tirai" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[86dvh] max-w-6xl flex-col items-center justify-center px-6 pb-20 pt-28 text-center">
          <p className="fade-up text-[14px] font-medium text-white/70">
            {s.profileName ? `Ruang belajar ${s.profileName}` : 'Kurikulum jaringan komputer'}
          </p>
          <h1 id="judul-hero" className="hero-title fade-up mt-5 max-w-[18ch] text-white">
            {baru
              ? <>Pahami jaringan dari <InlineImg url={fotoRj.url} /> kabel sampai <InlineImg url={fotoFiber.url} /> cloud.</>
              : <>Lanjutkan dari <InlineImg url={fotoRj.url} /> titik terakhirmu.</>}
          </h1>
          <p className="fade-up mt-6 max-w-[54ch] text-[17px] leading-relaxed text-white/75">
            {baru
              ? `Mulai dari modul ${lanjut.num || 'pertama'}, ${lanjut.title}. ${lanjut.readMin} menit, tanpa perlu memasang apa pun.`
              : `Berikutnya: ${lanjut.num ? `modul ${lanjut.num}, ` : ''}${lanjut.title}${lanjutStage ? ` di tahap ${lanjutStage.title}` : ''}.`}
          </p>
          <div className="fade-up mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
            {/* Satu-satunya tombol berlatar aksen di layar ini. */}
            <Link to={tautan(lanjut)} className="btn btn-primary btn-lg group">
              {baru ? 'Mulai modul pertama' : 'Lanjut belajar'} <span className="btn-bubble"><IconArrowRight size={16} /></span>
            </Link>
            <a href="#tahap" onClick={scrollToId('tahap')} className="hero-tautan">{baru ? 'Lihat semua tahap' : 'Lihat progres'}</a>
          </div>
        </div>
      </section>

      {/* Minat. Profil baru: semua tahap sebagai ubin yang bisa dibandingkan, bukan
          katalog nol persen. Profil berjalan: bento progres. */}
      <section id="tahap" className="bab scroll-mt-24" aria-labelledby="judul-tahap">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          {baru ? <UbinTahap /> : (
            <>
              <h2 id="judul-tahap" className="judul-bab max-w-[22ch]">Progresmu sejauh ini.</h2>
              <BentoProgres selesai={selesai} due={due.length} lanjut={lanjut} />
            </>
          )}
        </div>
      </section>

      {/* Keinginan 1: kalimat yang menyala saat digulir */}
      <section className="bab" aria-label="Cara pandang kurikulum">
        <p className="scrub-text mx-auto max-w-[30ch] px-6 text-center">{MANIFESTO}</p>
      </section>

      {/* Keinginan 2: tumpukan kartu cara belajar */}
      <section className="bab border-t border-app" aria-labelledby="judul-cara">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <h2 id="judul-cara" className="judul-bab">Empat kebiasaan, satu siklus.</h2>
              <p className="mt-4 max-w-[36ch] text-[15.5px] leading-relaxed text-muted">
                Setiap modul dirancang untuk dilewati dengan urutan ini. Gulir untuk melihat siklusnya.
              </p>
            </div>
          </div>
          <ol className="lg:col-span-8">
            {CARA.map((c, i) => (
              <li key={c.judul} className="tumpuk-kartu" style={{ top: `calc(7.5rem + ${i * 1.4}rem)` }}>
                <span className="tumpuk-nomor">{i + 1}</span>
                <c.Icon size={22} className="text-primary" />
                <h3 className="mt-6 text-[clamp(1.5rem,2.4vw,2.1rem)] font-semibold leading-tight">{c.judul}</h3>
                <p className="mt-3 max-w-[48ch] text-[15.5px] leading-relaxed text-muted">{c.isi}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Keinginan 3: akordeon horizontal tahap yang sedang dijalani */}
      <section className="bab border-t border-app" aria-labelledby="judul-sedang">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 id="judul-sedang" className="judul-bab max-w-[20ch]">{baru ? 'Empat tahap pertama.' : 'Tahap yang sedang dijalani.'}</h2>
            <p className="max-w-[40ch] text-[15px] text-muted">Arahkan kursor ke satu tahap untuk melihat isinya.</p>
          </div>
          <div className="hacc mt-12">
            {sedang.map(st => <IrisanTahap key={st.id} st={st} progress={s.progress} />)}
          </div>
        </div>
      </section>

      {/* Keinginan 4: carousel kartu review yang jatuh tempo */}
      {!baru && <CarouselReview due={due} />}

      <Suspense fallback={null}><KarierTeaser /></Suspense>
      <PustakaKartu />

      {/* Marquee kurikulum: satu-satunya marquee di halaman */}
      <section className="border-y border-app py-7" aria-label="Semua tahap kurikulum">
        <div className="marquee">
          <div className="marquee-track">
            {[0, 1].map(dup => (
              <div key={dup} className="flex shrink-0 items-center gap-14" aria-hidden={dup === 1}>
                {belajar.map(st => (
                  <Link key={st.id} to={tautan(st.modules[0])} tabIndex={dup === 1 ? -1 : undefined}
                    className="hover-padam flex items-center gap-2.5 whitespace-nowrap text-[19px] font-medium tracking-[-0.02em] text-faint hover:text-[var(--text)]">
                    <StageIcon id={st.id} size={19} /> {st.title}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Aksi: ajakan penutup besar. Tombolnya tinta, bukan aksen: aksen sudah dipakai di hero. */}
      <footer className="bab-penutup">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
            <h2 className="max-w-[13ch] text-[clamp(2.75rem,6.2vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
              Satu modul lagi hari ini.
            </h2>
            <Link to={tautan(lanjut)} className="btn btn-ink btn-lg group shrink-0">
              {lanjut.num ? `Buka modul ${lanjut.num}` : 'Lanjut belajar'} <span className="btn-bubble"><IconArrowRight size={16} /></span>
            </Link>
          </div>
          <div className="mt-24 grid gap-8 border-t border-app pt-8 text-[13px] text-faint md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <p>{meta.totalModules} modul dan {meta.totalCards} kartu latihan. Progres tersimpan per profil, di laptop ini saja.</p>
              <p className="max-w-[80ch] leading-relaxed">
                Foto: {kredit.filter((p, i, a) => a.findIndex(q => q.src === p.src) === i).map((p, i, a) => (
                  <span key={p.src}>
                    <a href={p.page} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--text)]">{p.credit}</a>
                    {i < a.length - 1 ? ', ' : ''}
                  </span>
                ))}. Wikimedia Commons.
              </p>
            </div>
            <nav className="flex gap-5" aria-label="Kaki halaman">
              <Link to="/review" className="hover:text-[var(--text)]">Review</Link>
              <Link to="/tools" className="hover:text-[var(--text)]">Alat</Link>
              <Link to="/pustaka" className="hover:text-[var(--text)]">Pustaka</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------ Profil baru */
/** Semua tahap sebagai ubin yang bisa dibandingkan: jenjang, jumlah modul, waktu baca,
 *  dan kartu latihan. Angkanya dihitung dari kurikulum, tidak diketik. */
function UbinTahap() {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h2 id="judul-tahap" className="judul-bab max-w-[22ch]">{belajar.length} tahap, dari kabel sampai karier.</h2>
        <p className="max-w-[44ch] text-[15px] leading-relaxed text-muted">
          Urutannya sengaja tidak diacak: tiap tahap memakai tahap sebelumnya. Bandingkan ukurannya sebelum mulai.
        </p>
      </div>
      <ol className="mt-12 grid grid-flow-dense grid-cols-2 gap-3 lg:grid-cols-4">
        {belajar.map((st, i) => {
          const menit = st.modules.reduce((a, m) => a + m.readMin, 0)
          const kartu = st.modules.reduce((a, m) => a + m.cards.length, 0)
          return (
            <li key={st.id} className="min-w-0">
              <Link to={tautan(st.modules[0])} className="tile group flex h-full flex-col gap-5 !p-0">
                <span className="block h-20 overflow-hidden border-b border-app"><SampulTahap tahap={st.id} band={st.band} lebar={360} tinggi={110} /></span>
                <span className="flex flex-1 flex-col gap-5 px-5 pb-5">
                <span className="flex items-center justify-between text-faint">
                  <StageIcon id={st.id} size={19} />
                  <span className="text-[12px] tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                </span>
                <span>
                  <span className="block text-[16.5px] font-semibold leading-snug tracking-[-0.02em]">{st.title}</span>
                  <span className="mt-1 block text-[12.5px] text-faint">{BAND_LABEL[st.band]}</span>
                </span>
                <span className="mt-auto grid grid-cols-3 gap-2 border-t border-app pt-3 text-[12px] text-faint">
                  <span><b className="block text-[15px] font-semibold tabular-nums text-[var(--text)]">{st.modules.length}</b>modul</span>
                  <span><b className="block text-[15px] font-semibold tabular-nums text-[var(--text)]">{(menit / 60).toLocaleString('id', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</b>jam baca</span>
                  <span><b className="block text-[15px] font-semibold tabular-nums text-[var(--text)]">{kartu}</b>kartu</span>
                </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </>
  )
}

/* --------------------------------------------------------- Profil berjalan */
/** Kisi 12 kolom grid-flow-dense: A 7x2, B 5x1, C 5x1 = (7+5) + (7+5), nol sel kosong. */
function BentoProgres({ selesai, due, lanjut }: { selesai: number; due: number; lanjut: Module }) {
  const s = useStore()
  const persen = learnModules.length ? selesai / learnModules.length : 0
  const jalur = Object.entries(BAND_LABEL).filter(([b]) => !BUKAN_MATERI.includes(b))
    .map(([band, label]) => ({ band, label, mods: belajar.filter(x => x.band === band).flatMap(x => x.modules) }))
    .filter(g => g.mods.length)
  return (
    <div className="mt-12 grid grid-flow-dense grid-cols-1 gap-3 md:grid-cols-12">
      <div className="tile flex flex-col justify-between gap-10 md:col-span-7 md:row-span-2 md:!p-8">
        <div>
          <div className="stat-num">{Math.round(persen * 100)}<span className="text-faint">%</span></div>
          <p className="mt-3 text-[15px] text-muted">{selesai} dari {learnModules.length} modul tuntas. Tiap kotak satu modul.</p>
        </div>
        <div className="space-y-4">
          {jalur.map(g => (
            <div key={g.band} className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-3">
              <span className="truncate text-[12.5px] text-faint">{g.label.replace('Tahap ', '')}</span>
              <span className="flex flex-wrap gap-[3px]" aria-label={`${g.label}: ${g.mods.filter(m => s.progress[m.id] === 'done').length} dari ${g.mods.length}`}>
                {g.mods.map(m => (
                  <i key={m.id} title={m.title} className={`block h-2.5 w-2.5 rounded-[3px] ${
                    s.progress[m.id] === 'done' ? 'bg-[var(--primary)]' : s.progress[m.id] ? 'bg-[var(--border-control)]' : 'bg-[var(--surface-3)]'}`} />
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Kartu Lanjutkan: pita sampul tahapnya mengisi ruang sisa kartu, tidak ada rongga. */}
      <Link to={tautan(lanjut)} className="tile group grid grid-cols-[minmax(0,1fr)_40%] !p-0 md:col-span-5">
        <span className="flex flex-col justify-between gap-5 p-6">
          <span className="text-[13px] text-faint">Lanjutkan{lanjut.num ? `, modul ${lanjut.num}` : ''}</span>
          <span>
            <span className="block text-[20px] font-semibold leading-snug tracking-[-0.02em]">{lanjut.title}</span>
            <span className="mt-2 flex items-center gap-1.5 text-[13px] text-faint"><IconClock size={14} /> {lanjut.readMin} menit baca</span>
          </span>
        </span>
        <span className="relative border-l border-app"><SampulTahap tahap={lanjut.stage} band={stages.find(x => x.id === lanjut.stage)?.band} lebar={260} tinggi={240} /></span>
      </Link>
      <Link to="/review" className="tile tile-ink group flex flex-col justify-between gap-5 md:col-span-5">
        <span className="flex items-start justify-between gap-4"><IconCards size={22} /><span className="btn-bubble"><IconArrowRight size={18} /></span></span>
        <span className="flex items-end justify-between gap-6">
          <span>
            <span className="block text-[22px] font-semibold tracking-[-0.03em]">{due ? `${due} kartu siap diulang` : 'Antrean review kosong'}</span>
            <span className="mt-1 block text-[13.5px] text-muted">{due ? 'Ulang sekarang, tepat sebelum lupa.' : 'Kartu baru masuk setelah Anda menuntaskan modul.'}</span>
          </span>
          <span className="shrink-0 text-right">
            <span className="flex items-center justify-end gap-1.5 text-[12.5px] text-muted"><IconFlame size={14} /> {s.streak} hari</span>
            <span className="mt-1 block text-[13px] font-semibold tabular-nums">Level {s.level}, {s.xp.toLocaleString('id')} XP</span>
          </span>
        </span>
      </Link>
    </div>
  )
}

/* ---------------------------------------------------------- Akordeon tahap */
function IrisanTahap({ st, progress }: { st: Stage; progress: Record<string, string> }) {
  const tuntas = st.modules.filter(m => progress[m.id] === 'done').length
  const tujuan = st.modules.find(m => progress[m.id] !== 'done') ?? st.modules[0]
  return (
    <Link to={tautan(tujuan)} className="hacc-item group" aria-label={`${st.title}: ${tuntas} dari ${st.modules.length} modul tuntas. Buka ${tujuan.title}`}>
      <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"><SampulTahap tahap={st.id} band={st.band} lebar={520} tinggi={520} /></div>
      <div className="hacc-tirai" aria-hidden="true" />
      <span className="hacc-label absolute bottom-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[15px] font-semibold lg:block">{st.title}</span>
      <div className="hacc-body relative flex h-full min-h-[15rem] flex-col justify-end p-7 lg:min-h-0">
        <StageIcon id={st.id} size={22} />
        <div className="mt-4 text-[24px] font-semibold tracking-[-0.03em]">{st.title}</div>
        <p className="mt-2 text-[14px] text-muted">{tuntas} dari {st.modules.length} modul tuntas</p>
        <ul className="mt-4 space-y-1 text-[13.5px] text-muted">
          {st.modules.slice(0, 4).map(m => <li key={m.id} className="truncate">{m.num} {m.title}</li>)}
        </ul>
        <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-medium">
          <IconClock size={14} /> Buka {tujuan.num || tujuan.title} <span className="btn-bubble"><IconArrowRight size={15} /></span>
        </span>
      </div>
    </Link>
  )
}

/* -------------------------------------------------------- Carousel review */
/** Kartu yang jatuh tempo, digeser dengan dua tombol. Bukan testimoni: proyek ini tidak
 *  punya testimoni, dan testimoni karangan dilarang. */
function CarouselReview({ due }: { due: typeof allCards }) {
  const [i, setI] = useState(0)
  const kartu = due.slice(0, 8)
  if (!kartu.length) return null
  const geser = (d: number) => setI(x => Math.min(Math.max(0, x + d), kartu.length - 1))
  return (
    <section className="bab border-t border-app" aria-labelledby="judul-carousel" aria-roledescription="carousel">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="judul-carousel" className="judul-bab max-w-[20ch]">Yang hampir terlupa hari ini.</h2>
          <div className="flex items-center gap-2">
            <span className="mr-2 text-[13px] tabular-nums text-faint" aria-live="polite">{i + 1} dari {kartu.length}</span>
            <button type="button" className="btn btn-icon" onClick={() => geser(-1)} disabled={i === 0} aria-label="Kartu sebelumnya"><IconArrowLeft size={16} /></button>
            <button type="button" className="btn btn-icon" onClick={() => geser(1)} disabled={i === kartu.length - 1} aria-label="Kartu berikutnya"><IconArrowRight size={16} /></button>
          </div>
        </div>
        <div className="mt-10 overflow-hidden">
          <ol className="carousel-jalur" style={{ transform: `translateX(calc(${-i} * (min(36rem, 86vw) + 1rem)))` }}>
            {kartu.map((c, k) => (
              <li key={c.id} className="carousel-kartu" aria-hidden={k !== i} aria-roledescription="slide">
                <span className="text-[12.5px] text-faint">Kartu {c.n}</span>
                <p className="mt-4 text-[clamp(1.2rem,1.8vw,1.5rem)] font-medium leading-snug" dangerouslySetInnerHTML={{ __html: c.q }} />
                <Link to="/review" tabIndex={k === i ? 0 : -1} className="link-arrow mt-8">Jawab di review <IconArrowRight size={14} /></Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function InlineImg({ url }: { url: string }) {
  return <span className="inline-img" style={{ backgroundImage: `url(${url})` }} aria-hidden="true" />
}

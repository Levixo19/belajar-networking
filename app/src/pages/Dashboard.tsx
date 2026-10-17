import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { learnModules, nextModule, stageOfModule, allCards, BAND_LABEL, BUKAN_MATERI, stages, type Module } from '../lib/content'
import { isDue } from '../lib/srs'
import { scrollToId } from '../lib/scrollTo'
import { gsap, useGSAP, MOTION_OK, SplitText } from '../lib/motion'
import { IconArrowRight, IconArrowLeft, IconCards, IconBook, IconFlask, IconTools, IconTarget } from '../components/icons'
import Planisfer, { langitKurikulum, TandaBintang } from '../components/Planisfer'
import { jamTahap } from '../lib/langit'
import PustakaKartu from '../components/PustakaKartu'

const KarierTeaser = lazy(() => import('../components/KarierTeaser'))

const PERJALANAN =
  'Saat Anda membuka sebuah situs, permintaannya melewati Wi-Fi atau kabel tembaga, lalu serat optik, lalu belasan router, dan kembali dalam hitungan milidetik. Kurikulum ini menjelaskan setiap langkah perjalanan itu.'

const CARA = [
  { judul: 'Baca konsepnya', isi: 'Setiap modul mulai dari ringkasan untuk pemula dan analogi, lalu turun ke paket, header, dan perintah. Istilah dijelaskan saat pertama muncul.', Icon: IconBook },
  { judul: 'Coba langsung', isi: 'Kalkulator subnet, penjelajah OSI, dan simulator handshake berjalan di browser. Anda bisa mencoba tanpa perangkat apa pun.', Icon: IconTools },
  { judul: 'Pecahkan misi', isi: 'Misi adalah laporan gangguan: Anda menjalankan perintah diagnosis, membaca keluarannya, lalu menentukan akar masalahnya.', Icon: IconTarget },
  { judul: 'Ulang sebelum lupa', isi: 'Kartu latihan tiap modul masuk antrean review berjarak. Kartu yang mudah muncul makin jarang, yang sulit makin sering.', Icon: IconCards },
  { judul: 'Praktikkan di lab', isi: 'Lab bertahap untuk Packet Tracer, MikroTik CHR, dan Linux. Setiap lab punya kriteria sukses, jadi Anda tahu kapan konfigurasinya benar.', Icon: IconFlask },
]

const tautan = (m: Module) => `/m/${encodeURI(m.id)}`

/** "Jumat, 17 Oktober 2026, 18.42 WITA": catatan waktu pengamatan, dari jam laptop. */
function catatanWaktu(d = new Date()) {
  const zona = { [-420]: 'WIB', [-480]: 'WITA', [-540]: 'WIT' }[d.getTimezoneOffset()] ?? ''
  const tgl = d.toLocaleDateString('id', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const jam = d.toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' })
  return `${tgl}, ${jam}${zona ? ' ' + zona : ''}`
}
function sapaan(d = new Date()) {
  const j = d.getHours()
  return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 19 ? 'Selamat sore' : 'Selamat malam'
}

export default function Dashboard() {
  const s = useStore()
  const root = useRef<HTMLDivElement>(null)
  const L = langitKurikulum()

  const selesai = learnModules.filter(m => s.progress[m.id] === 'done').length
  const lanjut = nextModule(s.progress)
  const baru = s.xp === 0 && selesai === 0
  const tahapLanjut = stageOfModule.get(lanjut.id)
  const due = useMemo(() => allCards.filter(c => s.srs[c.id] && isDue(s.srs[c.id])), [s.srs])
  const menyala = L.bintang.filter(b => s.progress[b.id] === 'done').length
  const waktu = useMemo(() => catatanWaktu(), [])

  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      gsap.from('.langit-hero-isi > *', { opacity: 0, y: 14, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: 0.25 })
      // Kalimat yang menyala kata demi kata mengikuti gulir. Keadaan alaminya teks utuh.
      const split = SplitText.create('.scrub-text', { type: 'words', wordsClass: 'w' })
      gsap.fromTo(split.words, { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.08,
        scrollTrigger: { trigger: '.scrub-text', start: 'top 78%', end: 'bottom 45%', scrub: true },
      })
      // Tumpukan kartu: yang tertimpa mengecil dan meredup lewat --redup (bukan filter).
      const kartu = gsap.utils.toArray<HTMLElement>('.tumpuk-kartu')
      kartu.forEach((el, i) => {
        if (i === kartu.length - 1) return
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
    <div ref={root} className="overflow-x-clip">
      {/* Hero: planisfer kurikulum. Setiap titik adalah modul sungguhan. */}
      <section className="langit-hero" aria-labelledby="judul-hero">
        <div className="langit-hero-peta">
          <Planisfer progress={s.progress} tuju={lanjut.id} judul="Peta langit kurikulum" />
        </div>
        <div className="langit-hero-isi">
          <p className="log-waktu">{waktu}</p>
          <h1 id="judul-hero" className="langit-judul">
            {baru
              ? <>Setiap modul adalah satu bintang di peta ini.</>
              : <>{sapaan()}{s.profileName ? `, ${s.profileName}` : ''}. {menyala} bintang sudah menyala.</>}
          </h1>
          <p className="langit-lead">
            {baru
              ? <>Ada {L.bintang.length} modul di {L.rasi.length} rasi. Anda mulai di dekat pusat, modul {lanjut.num}, lalu bergerak keluar mengikuti spiral.</>
              : <>Berikutnya modul {lanjut.num} {lanjut.title}{tahapLanjut ? `, di rasi ${tahapLanjut.title}` : ''}. Sekitar {lanjut.readMin} menit.</>}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
            {/* Satu-satunya tombol berlatar aksen di layar ini. */}
            <Link to={tautan(lanjut)} className="btn btn-primary btn-lg group">
              {baru ? `Mulai modul ${lanjut.num}` : `Lanjutkan modul ${lanjut.num}`}
            </Link>
            <a href="#rasi" onClick={scrollToId('rasi')} className="link-arrow">Lihat rasi {tahapLanjut?.title}</a>
          </div>
          {!baru && (
            <dl className="instrumen">
              <div><dt>XP</dt><dd>{s.xp.toLocaleString('id')}</dd></div>
              <div><dt>Beruntun</dt><dd>{s.streak} hari</dd></div>
              <div><dt>Kartu menunggu</dt><dd>{due.length}</dd></div>
            </dl>
          )}
          <p className="legenda-peta">
            <span><TandaBintang status="tuntas" /> tuntas</span>
            <span><TandaBintang status="dibaca" /> dibaca</span>
            <span><TandaBintang status="baru" /> belum</span>
            <span>Besar bintang mengikuti panjang modul. Arahkan kursor ke peta untuk membaca nama modul.</span>
          </p>
        </div>
      </section>

      {tahapLanjut && <RasiSekarang tahapId={tahapLanjut.id} sini={lanjut.id} />}

      <section className="bab" aria-label="Perjalanan sebuah permintaan">
        <p className="scrub-text mx-auto max-w-[32ch] px-6 text-center">{PERJALANAN}</p>
      </section>

      <section className="bab border-t border-app" aria-labelledby="judul-cara">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-32">
              <h2 id="judul-cara" className="judul-bab">Lima kebiasaan, satu siklus.</h2>
              <p className="mt-4 max-w-[36ch] text-[15.5px] leading-relaxed text-muted">
                Setiap modul dirancang untuk dilewati dengan urutan ini.
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

      {!baru && <CarouselReview due={due} />}

      <Suspense fallback={null}><KarierTeaser /></Suspense>
      <PustakaKartu />

      <footer className="bab-penutup">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
            <h2 className="max-w-[14ch] text-[clamp(2.75rem,6.2vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
              Satu bintang lagi hari ini.
            </h2>
            <Link to={tautan(lanjut)} className="btn btn-ink btn-lg group shrink-0">
              Buka modul {lanjut.num}
            </Link>
          </div>
          <div className="mt-24 grid gap-8 border-t border-app pt-8 text-[13px] text-faint md:grid-cols-[1fr_auto]">
            <p>{learnModules.length} modul belajar dan {allCards.length} kartu latihan. Progres tersimpan per profil, di laptop ini saja.</p>
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

/* ------------------------------------------------- Rasi yang sedang dijelajahi */
function RasiSekarang({ tahapId, sini }: { tahapId: string; sini: string }) {
  const s = useStore()
  const st = stages.find(x => x.id === tahapId)!
  const tuntas = st.modules.filter(m => s.progress[m.id] === 'done').length
  const jam = jamTahap(st.id)
  const wilayah = useMemo(() => Object.entries(BAND_LABEL).filter(([b]) => !BUKAN_MATERI.includes(b))
    .map(([band, label]) => {
      const mods = stages.filter(x => x.band === band).flatMap(x => x.modules)
      return { band, label, n: mods.length, t: mods.filter(m => s.progress[m.id] === 'done').length }
    }).filter(w => w.n), [s.progress])
  return (
    <section id="rasi" className="bab scroll-mt-20" aria-labelledby="judul-rasi">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-7">
          <figure className="plat-rasi bingkai-atlas">
            <Planisfer mode="plat" sorot={st.id} sini={sini} progress={s.progress} judul={`Rasi ${st.title}`} />
            <figcaption className="plat-keterangan">
              Rasi {st.title}{jam !== null ? `, jam ${String(jam).padStart(2, '0')}` : ''}. {tuntas} dari {st.modules.length} bintang menyala; lingkaran putus-putus menandai modul berikutnya.
            </figcaption>
          </figure>
        </div>
        <div className="lg:col-span-5">
          <h2 id="judul-rasi" className="judul-bab">Rasi {st.title}</h2>
          <ol className="daftar-rasi mt-8">
            {st.modules.map(m => {
              const status = s.progress[m.id] === 'done' ? 'tuntas' : s.progress[m.id] ? 'dibaca' : 'baru'
              return (
                <li key={m.id}>
                  <Link to={`/m/${encodeURI(m.id)}`} className={`daftar-rasi-butir ${m.id === sini ? 'sini' : ''}`} aria-current={m.id === sini ? 'step' : undefined}>
                    <TandaBintang status={status} size={14} />
                    <span className="daftar-rasi-no">{m.num}</span>
                    <span className="min-w-0 flex-1 truncate">{m.title}</span>
                    <span className="daftar-rasi-menit">{m.readMin} mnt</span>
                  </Link>
                </li>
              )
            })}
          </ol>
          <dl className="wilayah mt-10">
            {wilayah.map(w => (
              <div key={w.band}>
                <dt>{w.label.replace('Tahap ', '')}</dt>
                <dd><span className="wilayah-batang" style={{ ['--isi' as string]: w.n ? w.t / w.n : 0 }} /> {w.t}/{w.n}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------- Carousel review */
/** Kartu yang jatuh tempo, digeser dengan dua tombol. */
function CarouselReview({ due }: { due: typeof allCards }) {
  const [i, setI] = useState(0)
  const kartu = due.slice(0, 8)
  if (!kartu.length) return null
  const geser = (d: number) => setI(x => Math.min(Math.max(0, x + d), kartu.length - 1))
  return (
    <section className="bab border-t border-app" aria-labelledby="judul-carousel" aria-roledescription="carousel">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="judul-carousel" className="judul-bab max-w-[20ch]">Kartu yang jatuh tempo hari ini.</h2>
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

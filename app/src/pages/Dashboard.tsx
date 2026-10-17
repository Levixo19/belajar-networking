import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { learnModules, nextModule, stageOfModule, allCards, BAND_LABEL, BUKAN_MATERI, stages, type Module } from '../lib/content'
import { isDue } from '../lib/srs'
import Planisfer, { langitKurikulum, TandaBintang, useLangitNyata } from '../components/Planisfer'
import { jamTahap } from '../lib/langit'
import PustakaKartu from '../components/PustakaKartu'
import BumiMalam, { type TitikMisi } from '../components/BumiMalam'

const KarierTeaser = lazy(() => import('../components/KarierTeaser'))

const tautan = (m: Module) => `/m/${encodeURI(m.id)}`

/** "Sabtu, 17 Oktober 2026, 21.50 WITA": epoch peta, karena langitnya memang dihitung untuk
 *  saat itu di kota pengamat. */
function epoch(d: Date) {
  const zona = { [-420]: 'WIB', [-480]: 'WITA', [-540]: 'WIT' }[d.getTimezoneOffset()] ?? ''
  const tgl = d.toLocaleDateString('id', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const jam = d.toLocaleTimeString('id', { hour: '2-digit', minute: '2-digit' })
  return `${tgl}, ${jam}${zona ? ' ' + zona : ''}`
}

function sapaan(d = new Date()) {
  const j = d.getHours()
  return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 19 ? 'Selamat sore' : 'Selamat malam'
}

/** Bintang yang tuntas sejak langit terakhir dilihat di laptop ini, per profil. Dibaca saat
 *  render (supaya penyalaan masuk ke timeline intro yang sama), ditulis sesudahnya. Kalau
 *  belum ada catatan sama sekali, tidak ada yang dinyalakan: catatannya dibuat dari keadaan
 *  sekarang. localStorage cuma kenyamanan per penampil; tanpa itu peta tetap benar. */
function useMenyalaBaru(profileId: string | null, tuntas: string[]) {
  const kunci = tuntas.join(' ')
  const baru = useMemo(() => {
    if (!profileId) return []
    try {
      const lama = JSON.parse(localStorage.getItem(`bn-langit:${profileId}`) || 'null')
      if (!Array.isArray(lama)) return []
      const sudah = new Set(lama)
      return tuntas.filter(id => !sudah.has(id))
    } catch { return [] }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, kunci])
  useEffect(() => {
    if (!profileId) return
    try { localStorage.setItem(`bn-langit:${profileId}`, JSON.stringify(tuntas)) } catch { /* mode privat */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, kunci])
  return baru
}

export default function Dashboard() {
  const s = useStore()
  const L = langitKurikulum()

  const selesai = learnModules.filter(m => s.progress[m.id] === 'done').length
  const lanjut = nextModule(s.progress)
  const baru = s.xp === 0 && selesai === 0
  const tahapLanjut = stageOfModule.get(lanjut.id)
  const due = useMemo(() => allCards.filter(c => s.srs[c.id] && isDue(s.srs[c.id])), [s.srs])
  const tuntas = useMemo(() => L.bintang.filter(b => s.progress[b.id] === 'done').map(b => b.id), [L, s.progress])
  const menyalaBaru = useMenyalaBaru(s.status === 'ready' ? s.profileId : null, tuntas)
  const inti = lanjut.wawasan?.intinya?.satuKalimat
  const nyata = useLangitNyata()

  return (
    <div className="overflow-x-clip">
      {/* Hero = satu plat atlas. Setiap titik di peta adalah modul sungguhan; kartus di
          sudut plat membawa keadaan pembelajar, bukan slogan. */}
      <section className="plat-langit" aria-labelledby="judul-hero">
        <div className="plat-langit-bingkai bingkai-atlas">
          <div className="plat-langit-peta">
            <Planisfer progress={s.progress} tuju={lanjut.id} menyalaBaru={menyalaBaru} judul="Peta langit kurikulum" />
          </div>

          <div className="kartus kartus-judul">
            <p className="kartus-nama">Planisfer kurikulum</p>
            {nyata && <p className="kartus-epoch">Langit di atas {nyata.lokasi.kota}, {epoch(nyata.waktu)}</p>}
            <h1 id="judul-hero" className="kartus-h1">
              <span className="kartus-label">{baru ? 'Mulai dari sini:' : 'Berikutnya:'}</span>{' '}
              <span className="kartus-no">{lanjut.num}</span> {lanjut.title}
            </h1>
            {inti
              ? <p className="kartus-teks" dangerouslySetInnerHTML={{ __html: inti }} />
              : <p className="kartus-teks">Sekitar {lanjut.readMin} menit baca dan {lanjut.cards.length} kartu latihan.</p>}
            <p className="kartus-meta">
              {tahapLanjut ? `Tahap ${tahapLanjut.title}, ` : ''}sekitar {lanjut.readMin} menit
            </p>
            {/* Satu-satunya tombol berlatar aksen di layar ini; klik bintang adalah jalan kedua. */}
            <Link to={tautan(lanjut)} className="btn btn-primary kartus-tombol">
              {baru ? 'Mulai membaca' : 'Lanjutkan membaca'}
            </Link>
          </div>

          {!baru && (
            <div className="kartus kartus-instrumen">
              <p className="kartus-sapa">{sapaan()}{s.profileName ? `, ${s.profileName}` : ''}.</p>
              <dl className="instrumen">
                <div><dt>Bintang menyala</dt><dd>{tuntas.length.toLocaleString('id')} <span>dari {L.bintang.length.toLocaleString('id')}</span></dd></div>
                <div><dt>Kartu menunggu</dt><dd>{due.length ? <Link to="/review">{due.length.toLocaleString('id')}</Link> : 0}</dd></div>
                <div><dt>Hari beruntun</dt><dd>{s.streak.toLocaleString('id')}</dd></div>
              </dl>
            </div>
          )}

          <div className="kartus kartus-legenda">
            <p className="kartus-nama">Cara membaca</p>
            <ul className="legenda-peta">
              <li><TandaBintang status="baru" size={14} /> belum dibaca</li>
              <li><TandaBintang status="dibaca" size={14} /> sedang dibaca</li>
              <li><TandaBintang status="tuntas" size={14} /> tuntas</li>
            </ul>
            <p className="kartus-kecil">
              Setiap bintang berbentuk adalah satu modul; besarnya mengikuti panjang modul. Garis titik-titik adalah
              urutan belajar, dari pusat ke tepi. Arahkan kursor ke peta, atau tekan Tab lalu tombol panah.
            </p>
            {nyata && (
              <p className="kartus-kecil">
                Titik polos di belakangnya adalah bintang sungguhan sampai magnitudo 5. Garis titik-strip adalah
                cakrawala di {nyata.lokasi.kota} saat ini; bintang yang lebih terang sedang di atas cakrawala.{' '}
                <a href="https://codeberg.org/astronexus/hyg" target="_blank" rel="noopener noreferrer" className="kartus-kredit">HYG Database v4.4, David Nash, CC BY-SA 4.0</a>
              </p>
            )}
          </div>
        </div>
      </section>

      {tahapLanjut && <RasiSekarang tahapId={tahapLanjut.id} sini={lanjut.id} />}
      <BumiDiBawah />

      <Suspense fallback={null}><KarierTeaser /></Suspense>
      <PustakaKartu />

      <footer className="bab-penutup">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
            <h2 className="max-w-[14ch] text-[clamp(2.75rem,6.2vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
              Satu bintang lagi hari ini.
            </h2>
            <Link to={tautan(lanjut)} className="btn btn-ink btn-lg shrink-0">
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

/* -------------------------------------------- Tahap yang sedang dijelajahi */
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
            <Planisfer mode="plat" sorot={st.id} sini={sini} progress={s.progress} judul={`Peta tahap ${st.title}`} />
            <figcaption className="plat-keterangan">
              Rasi {st.title}{jam !== null ? `, jam ${String(jam).padStart(2, '0')}` : ''}. {tuntas} dari {st.modules.length} bintang menyala; lingkaran putus-putus menandai modul berikutnya.
            </figcaption>
          </figure>
        </div>
        <div className="lg:col-span-5">
          <h2 id="judul-rasi" className="judul-bab">
            {jam !== null && <span className="judul-bab-no">Tahap {String(jam).padStart(2, '0')}</span>} {st.title}
          </h2>
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

/* ------------------------------------------- Bumi di bawah: kota-kota misi */
/** Langit di atas (kurikulum), Bumi di bawah (gangguan nyata di kota Indonesia). Progres yang
 *  sama menyalakan keduanya dengan warna lampu yang sama. Data misi dimuat malas, chunk yang
 *  sama dengan layar Misi. */
function BumiDiBawah() {
  const s = useStore()
  const [misi, setMisi] = useState<TitikMisi[] | null>(null)
  useEffect(() => {
    let hidup = true
    import('../generated/misi.json').then(m => { if (hidup) setMisi(m.default as unknown as TitikMisi[]) })
    return () => { hidup = false }
  }, [])
  const dipecahkan = useMemo(() => new Set((misi ?? []).filter(m => (s.games['misi:' + m.id] || 0) > 0).map(m => m.id)), [misi, s.games])
  if (!misi) return null
  const kota = new Set(misi.flatMap(m => m.lokasi ? [m.lokasi.kota] : [])).size
  return (
    <section className="bab border-t border-app" aria-labelledby="judul-bumi">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <h2 id="judul-bumi" className="judul-bab lg:col-span-7">{misi.length} laporan gangguan dari {kota} kota</h2>
          <div className="lg:col-span-5">
            <p className="max-w-[52ch] text-[15.5px] leading-relaxed text-muted">
              Setiap misi troubleshooting dimulai dari laporan di kota sungguhan. Memecahkannya menyalakan kotanya, dengan
              lampu yang sama dengan bintang modul yang tuntas di peta langit.
            </p>
            <Link to="/misi" className="link-arrow mt-4">Buka buku log misi</Link>
          </div>
        </div>
        <BumiMalam misi={misi} dipecahkan={dipecahkan} className="mt-10" />
      </div>
    </section>
  )
}

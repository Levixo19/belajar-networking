import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getModule } from '../lib/content'
import {
  PROFESI, byId, RUMPUN, rumpunMeta, readiness, shortestPath, gapModules,
  QUIZ, scoreQuiz, celahJalur, KEAHLIAN_LABEL, JENJANG_LABEL, type Profesi, type Rumpun,
} from '../lib/profesi'
import TanggaKarier from '../components/TanggaKarier'
import Lencana from '../components/Lencana'
import { useScramble } from '../lib/useScramble'
import { scrollToId } from '../lib/scrollTo'
import { IconArrowRight, IconCheck, IconRetry, IconBook } from '../components/icons'

const pendek = (nama: string) => nama.replace(/\s*\(.*?\)\s*/g, ' ').trim()
const keAtas = () => document.getElementById('judul-karier')?.scrollIntoView({
  behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start',
})

/* ------------------------------------------------------------------ Halaman */
/** /karier/<id> dengan id yang tidak dikenal menampilkan pesan. Versi lama diam-diam
 *  menampilkan network-engineer, jadi tautan yang salah ketik terlihat "berhasil". */
export default function KarierPage() {
  const { id } = useParams()
  if (id && !byId.has(id)) return <ProfesiTakDikenal id={id} />
  return <PetaKarier />
}

function ProfesiTakDikenal({ id }: { id: string }) {
  return (
    <div className="mx-auto flex min-h-[60dvh] max-w-xl flex-col items-start justify-center px-4 py-20">
      <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-tight">Profesi itu tidak ada di peta.</h1>
      <p className="mt-3 text-muted">
        Tidak ada profesi berkode <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 font-mono text-[0.9em]">{id}</code> di
        antara {PROFESI.length} profesi yang dipetakan. Tautannya mungkin salah ketik atau sudah berubah.
      </p>
      <Link to="/karier" className="btn btn-primary mt-8">Buka peta karier</Link>
    </div>
  )
}

function PetaKarier() {
  const { id } = useParams()
  const nav = useNavigate()
  const s = useStore()
  const [filter, setFilter] = useState<Rumpun | 'semua'>('semua')
  const ready = useMemo(() => new Map(PROFESI.map(p => [p.id, readiness(p, s.progress)])), [s.progress])
  const siap = useMemo(() => new Map([...ready].map(([k, r]) => [k, r.pct])), [ready])

  // Tanpa id = keadaan diam: tidak ada profesi terpilih, jadi tidak ada garis.
  const selected = id ? byId.get(id)! : null
  const select = (pid: string) => nav(`/karier/${pid}`, { replace: true, preventScrollReset: true })

  if (!PROFESI.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24">
        <h1 className="text-[2rem] font-semibold">Peta profesi sedang disiapkan.</h1>
        <p className="mt-3 text-muted">Data profesi belum dibangun. Jalankan <code>npm run content</code> lalu muat ulang.</p>
      </div>
    )
  }

  const paling = [...PROFESI].sort((a, b) => ready.get(b.id)!.pct - ready.get(a.id)!.pct)[0]

  return (
    <div className="overflow-x-hidden">
      <section className="mx-auto max-w-[1440px] px-4 pt-12 sm:px-6 md:pt-16 lg:px-8" aria-labelledby="judul-karier">
        <div className="fade-up max-w-3xl">
          <span className="eyebrow mb-5">Ekosistem profesi jaringan</span>
          <h1 id="judul-karier" className="hero-title max-w-[16ch] scroll-mt-24">Peta {PROFESI.length} profesi di sekitar jaringan</h1>
          <p className="mt-6 max-w-[56ch] text-[17px] leading-relaxed text-muted">
            Tiap baris satu rumpun, tiap kolom satu jenjang. Arahkan kursor ke sebuah profesi untuk melihat ke mana ia naik
            dan dengan siapa keahliannya beririsan. Kesiapan dihitung dari modul yang sudah Anda tuntaskan.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href="#cocok" onClick={scrollToId('cocok')} className="btn btn-primary btn-lg group">
              Cari yang cocok <span className="btn-bubble"><IconArrowRight size={16} /></span>
            </a>
            {paling && ready.get(paling.id)!.pct > 0 && (
              <button onClick={() => select(paling.id)} className="link-arrow">
                Paling siap: {pendek(paling.nama)} ({Math.round(ready.get(paling.id)!.pct * 100)}%)
              </button>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Saring rumpun">
          {(['semua', ...RUMPUN.map(r => r.id)] as const).map(r => (
            <button key={r} role="radio" aria-checked={filter === r} onClick={() => setFilter(r)}
              className={`h-8 rounded-full border px-3.5 text-[13px] transition-colors ${
                filter === r ? 'border-[var(--fg)] bg-[var(--fg)] text-[var(--fg-contrast)]' : 'border-app text-muted hover:text-[var(--text)]'}`}>
              {r === 'semua' ? 'Semua' : rumpunMeta(r).pendek}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <figure className="relative m-0 min-w-0 overflow-hidden rounded-[var(--radius-xl)] border border-app bg-surface">
            <div className="overflow-x-auto overscroll-x-contain">
              <TanggaKarier pilihan={selected?.id ?? null} onPilih={select} saring={filter} siap={siap} />
            </div>
            <figcaption className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-app px-5 py-3 text-[12.5px] text-faint">
              <span className="inline-flex items-center gap-2"><i className="inline-block h-0.5 w-6 rounded bg-[var(--primary)]" /> Jalur naik</span>
              <span className="inline-flex items-center gap-2"><i className="inline-block w-6 border-t border-dashed border-[var(--text-faint)]" /> Keahlian beririsan</span>
              <span className="inline-flex items-center gap-2"><i className="inline-block h-3 w-3 rounded-full border border-dashed border-[var(--text-faint)]" /> Sejenjang dan beririsan</span>
              <span className="inline-flex items-center gap-2"><i className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[var(--primary)]" /> Kesiapan Anda</span>
            </figcaption>
          </figure>

          {selected
            ? <DetailPanel p={selected} progress={s.progress} onSelect={select} />
            : <PanelSapa onSelect={select} />}
        </div>
      </section>

      <QuizSection pemula={!Object.values(s.progress).includes('done')} onSelect={pid => { select(pid); keAtas() }} />
      <TransisiSection progress={s.progress} target={selected ?? byId.get('network-engineer')!} onSelect={select} />
      <RumpunIndex onSelect={pid => { select(pid); keAtas() }} />
    </div>
  )
}

/** Panel saat belum ada profesi terpilih: pintu masuk, bukan profil kosong. */
function PanelSapa({ onSelect }: { onSelect: (id: string) => void }) {
  const pintu = PROFESI.filter(p => p.jenjang === 'pemula').slice(0, 5)
  return (
    <aside className="card overflow-hidden lg:sticky lg:top-24" aria-label="Mulai menjelajah">
      <div className="panel-lencana"><Lencana benih="profesi:sapa" nama="Peta karier" ukuran={84} /></div>
      <div className="p-6">
      <h2 className="text-[1.25rem] font-semibold leading-snug tracking-[-0.02em]">Pilih satu profesi di tangga.</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-muted">
        Rinciannya muncul di sini: pekerjaan sehari-hari, modul bekal, sertifikasi, dan ke mana ia bisa naik.
        Kalau belum tahu harus mulai dari mana, ini peran yang bisa dimasuki dari nol:
      </p>
      <ul className="mt-4 space-y-1">
        {pintu.map(p => (
          <li key={p.id}>
            <button onClick={() => onSelect(p.id)} className="group flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-[14px] hover:bg-[var(--surface-2)]">
              {p.nama} <IconArrowRight size={14} className="shrink-0 text-faint group-hover:text-[var(--text)]" />
            </button>
          </li>
        ))}
      </ul>
      </div>
    </aside>
  )
}

/* -------------------------------------------------------------- Panel detail */
function DetailPanel({ p, progress, onSelect }: { p: Profesi; progress: Record<string, string>; onSelect: (id: string) => void }) {
  const nameRef = useScramble<HTMLHeadingElement>(p.nama)
  const r = readiness(p, progress)
  const certs = ['pemula', 'menengah', 'senior']
    .map(t => ({ t, list: p.sertifikasi.filter(c => (c.tingkat || 'menengah') === t) }))
    .filter(x => x.list.length)
  return (
    <aside className="card overflow-hidden lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto" aria-live="polite" aria-label={`Profil ${p.nama}`}>
      <div className="panel-lencana"><Lencana benih={'profesi:' + p.id} nama={p.nama} tingkat={p.jenjang === 'pemula' ? 1 : p.jenjang === 'menengah' ? 2 : 3} ukuran={84} nyala={readiness(p, progress).pct >= 1} /></div>
      <div className="border-b border-app p-6">
        <div className="text-[12.5px] text-faint">{rumpunMeta(p.rumpun).label}</div>
        <h2 ref={nameRef} className="mt-1.5 min-h-[2.4em] text-[1.45rem] font-semibold leading-[1.15] tracking-[-0.03em]">{p.nama}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{p.ringkas}</p>
        <div className="mt-3 text-[12.5px] text-faint">{JENJANG_LABEL[p.jenjang]}</div>
      </div>

      <div className="border-b border-app p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-medium">Kesiapan Anda</span>
          <span className="stat-num !text-[1.75rem]">{Math.round(r.pct * 100)}<span className="text-faint">%</span></span>
        </div>
        <ul className="mt-4 space-y-1">
          {r.mods.map(m => {
            const mod = getModule(m)!
            const ok = progress[m] === 'done'
            return (
              <li key={m}>
                <Link to={`/m/${encodeURI(m)}`} className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-[13.5px] hover:bg-[var(--surface-2)]">
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${ok ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]' : 'border-[var(--border-control)]'}`}>
                    {ok && <IconCheck size={12} />}
                  </span>
                  <span className={`flex-1 truncate ${ok ? 'text-faint line-through decoration-[var(--border-strong)]' : ''}`}>{mod.title}</span>
                  <span className="text-[12px] tabular-nums text-faint">{mod.num}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <Block title="Sehari-hari">
        <ul className="space-y-1.5 text-[13.5px] leading-relaxed text-muted">
          {p.harian.map(h => <li key={h} className="flex gap-2"><span className="text-faint">-</span>{h}</li>)}
        </ul>
      </Block>

      <Block title="Keahlian">
        <div className="flex flex-wrap gap-1.5">
          {p.keahlian.map(k => <span key={k} className="chip">{KEAHLIAN_LABEL[k] || k}</span>)}
        </div>
        {p.alat.length > 0 && <p className="mt-3 text-[13px] leading-relaxed text-faint">Alat: {p.alat.join(', ')}</p>}
      </Block>

      {certs.length > 0 && (
        <Block title="Sertifikasi">
          <div className="space-y-3">
            {certs.map(c => (
              <div key={c.t}>
                <div className="mb-1 text-[12px] capitalize text-faint">{c.t}</div>
                <ul className="space-y-1 text-[13.5px]">
                  {c.list.map(x => <li key={x.nama}>{x.nama} <span className="text-faint">({x.penerbit})</span></li>)}
                </ul>
              </div>
            ))}
          </div>
        </Block>
      )}

      {(p.naik.length > 0 || p.dekat.length > 0) && (
        <Block title="Ke mana selanjutnya">
          {p.naik.length > 0 && <Chips label="Naik ke" ids={p.naik} onSelect={onSelect} />}
          {p.dekat.length > 0 && <Chips label="Bersebelahan" ids={p.dekat} onSelect={onSelect} />}
        </Block>
      )}

      <Block title="Cara masuk">
        <p className="text-[13.5px] leading-relaxed text-muted">{p.masuk}</p>
        {p.gaji && (
          <p className="mt-3 text-[13.5px]">
            <span className="font-medium">{p.gaji.rentang}</span>
            {p.gaji.konteks && <span className="text-faint"> ({p.gaji.konteks})</span>}
            <br />
            <a href={p.gaji.url} target="_blank" rel="noreferrer" className="text-[12.5px] text-faint underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--text)]">
              Sumber: {p.gaji.sumber}
            </a>
          </p>
        )}
      </Block>

      {p.proyek.length > 0 && (
        <Block title="Proyek portofolio">
          <ul className="space-y-1.5 text-[13.5px] leading-relaxed text-muted">
            {p.proyek.map(x => <li key={x} className="flex gap-2"><span className="text-faint">-</span>{x}</li>)}
          </ul>
        </Block>
      )}

      <div className="p-6">
        {p.bacaan && (
          <Link to={`/m/${encodeURI(p.bacaan)}`} className="btn btn-ink w-full">
            <IconBook size={16} /> Baca profil lengkap
          </Link>
        )}
        {p.sumber.length > 0 && (
          <details className="mt-4 text-[12.5px] text-faint">
            <summary className="cursor-pointer select-none hover:text-[var(--text)]">Sumber ({p.sumber.length})</summary>
            <ul className="mt-2 space-y-1">
              {p.sumber.map(x => (
                <li key={x.url}>
                  <a href={x.url} target="_blank" rel="noreferrer" className="underline decoration-[var(--border-strong)] underline-offset-2 hover:text-[var(--text)]">{x.judul}</a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </aside>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-app p-6">
      <div className="mb-3 text-[13px] font-medium">{title}</div>
      {children}
    </div>
  )
}

function Chips({ label, ids, onSelect }: { label: string; ids: string[]; onSelect: (id: string) => void }) {
  const list = ids.map(i => byId.get(i)).filter((x): x is Profesi => !!x)
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 text-[12px] text-faint">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {list.map(q => (
          <button key={q.id} onClick={() => onSelect(q.id)} className="chip transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]">
            {pendek(q.nama)}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- Kuis kecocokan */
function QuizSection({ onSelect, pemula }: { onSelect: (id: string) => void; pemula: boolean }) {
  const [picks, setPicks] = useState<(number | null)[]>(() => QUIZ.map(() => null))
  const [step, setStep] = useState(0)
  const done = step >= QUIZ.length
  const hasil = useMemo(() => (done ? scoreQuiz(picks, { pemula }) : []), [done, picks, pemula])
  const pick = (i: number) => {
    setPicks(p => p.map((v, k) => (k === step ? i : v)))
    setStep(x => x + 1)
  }
  const ulang = () => { setPicks(QUIZ.map(() => null)); setStep(0) }
  const q = QUIZ[Math.min(step, QUIZ.length - 1)]

  return (
    <section id="cocok" className="scroll-mt-20 border-t border-app" aria-labelledby="judul-cocok">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-4 py-20 sm:px-6 md:py-32 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <h2 id="judul-cocok" className="reveal text-[clamp(1.9rem,3.2vw,2.75rem)] font-semibold leading-[1.08]">Mana yang cocok dengan Anda?</h2>
          <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-muted">
            Enam pertanyaan tentang cara Anda suka bekerja. Tidak ada jawaban salah; hasilnya titik awal untuk dijelajahi.
          </p>
          <div className="mt-8 flex gap-1.5" aria-hidden="true">
            {QUIZ.map((_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < step ? 'bg-[var(--primary)]' : 'bg-[var(--surface-3)]'}`} />
            ))}
          </div>
          <div className="mt-2 text-[12.5px] tabular-nums text-faint">{Math.min(step, QUIZ.length)} dari {QUIZ.length}</div>
        </div>

        <div className="lg:col-span-7">
          {!done ? (
            <div key={step} className="fade-up">
              <p className="text-[1.35rem] font-medium leading-snug tracking-[-0.02em]">{q.q}</p>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {q.opts.map((o, i) => (
                  <button key={o.label} onClick={() => pick(i)}
                    className="tile group !p-5 text-left text-[14.5px] leading-snug transition-transform active:scale-[0.98]">
                    <span className="mb-3 block text-[12px] tabular-nums text-faint">{'ABCD'[i]}</span>
                    {o.label}
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button onClick={() => setStep(x => x - 1)} className="mt-5 text-[13px] text-faint underline underline-offset-2 hover:text-[var(--text)]">
                  Kembali ke pertanyaan sebelumnya
                </button>
              )}
            </div>
          ) : (
            <div className="fade-up" aria-live="polite">
              {hasil.length ? (
                <ol className="space-y-3">
                  {hasil.map((h, i) => (
                    <li key={h.p.id}>
                      <button onClick={() => onSelect(h.p.id)}
                        className={`tile group flex w-full items-start gap-5 text-left ${i === 0 ? 'tile-tint' : ''}`}>
                        <span className="stat-num !text-[2rem] text-faint">{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[18px] font-medium tracking-[-0.02em]">{h.p.nama}</span>
                          {pemula && h.p.jenjang === 'senior' && <span className="mt-1 block text-[12.5px] text-faint">Tujuan jangka panjang: peran senior, biasanya setelah beberapa tahun di peran lain.</span>}
                          <span className="mt-1 block text-[13.5px] text-muted">{h.p.ringkas}</span>
                          <span className="mt-3 flex flex-wrap gap-1.5">
                            {h.hits.slice(0, 4).map(k => <span key={k} className="chip">{KEAHLIAN_LABEL[k] || k}</span>)}
                          </span>
                        </span>
                        <span className="btn-bubble mt-1 text-faint group-hover:text-[var(--text)]"><IconArrowRight size={16} /></span>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-muted">Jawaban Anda belum cukup untuk dicocokkan. Coba ulangi.</p>
              )}
              <button onClick={ulang} className="btn mt-6"><IconRetry size={15} /> Ulangi</button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------- Perencana transisi */
function TransisiSection({ progress, target, onSelect }: { progress: Record<string, string>; target: Profesi; onSelect: (id: string) => void }) {
  const defaultFrom = byId.has('it-support-technician') ? 'it-support-technician' : PROFESI[0].id
  const [from, setFrom] = useState(defaultFrom)
  const to = target.id
  const path = useMemo(() => shortestPath(from, to), [from, to])
  const fromP = byId.get(from) ?? PROFESI[0]
  // Celah dihitung atas SELURUH jalur, termasuk bekal profesi perantara.
  const gap = path ? celahJalur(path) : gapModules(fromP, target)
  const sisa = gap.filter(m => progress[m] !== 'done')

  return (
    <section className="border-t border-app" aria-labelledby="judul-transisi">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 md:py-32 lg:px-8">
        <h2 id="judul-transisi" className="reveal max-w-[20ch] text-[clamp(1.9rem,3.2vw,2.75rem)] font-semibold leading-[1.08]">Rencanakan perpindahan.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium">Posisi Anda sekarang</span>
            <ProfesiSelect value={fromP.id} onChange={setFrom} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium">Tujuan</span>
            <ProfesiSelect value={to} onChange={onSelect} />
          </label>
        </div>

        <div className="mt-10">
          {path ? (
            <ol className="flex flex-wrap items-center gap-x-3 gap-y-3" aria-label="Jalur perpindahan">
              {path.map((pid, i) => (
                <li key={pid} className="flex items-center gap-3">
                  <button onClick={() => onSelect(pid)}
                    className={`rounded-full border px-4 py-2 text-[14px] transition-colors ${
                      i === path.length - 1 ? 'border-[var(--fg)] bg-[var(--fg)] text-[var(--fg-contrast)]'
                        : i === 0 ? 'border-[var(--border-strong)] bg-surface' : 'border-app bg-[var(--surface-2)] text-muted hover:text-[var(--text)]'}`}>
                    {pendek(byId.get(pid)?.nama ?? pid)}
                  </button>
                  {i < path.length - 1 && <IconArrowRight size={16} className="text-faint" />}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-muted">Tidak ada jalur realistis dari {pendek(fromP.nama)} ke {pendek(target.nama)} di peta ini.</p>
          )}
          {path && path.length > 1 && (
            <p className="mt-4 text-[13.5px] text-faint">{path.length - 1} langkah. Tiap langkah biasanya butuh pengalaman nyata, bukan sekadar sertifikat.</p>
          )}
        </div>

        {fromP.id !== to && (
          <div className="mt-12 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="stat-num">{sisa.length}</div>
              <p className="mt-2 max-w-[32ch] text-[14px] text-muted">
                modul bekal tambahan yang belum Anda tuntaskan untuk menempuh jalur ini sampai menjadi {pendek(target.nama)}.
              </p>
            </div>
            <ul className="road border-app lg:col-span-8 lg:border-t">
              {gap.length === 0 && <li className="py-5 text-[14px] text-muted">Bekal kurikulumnya sudah tercakup. Yang tersisa adalah pengalaman dan sertifikasi.</li>}
              {gap.map(m => {
                const mod = getModule(m)!
                const ok = progress[m] === 'done'
                return (
                  <li key={m}>
                    <Link to={`/m/${encodeURI(m)}`} className={`road-item group ${ok ? 'is-done' : ''}`}>
                      <span className="road-ico">{ok ? <IconCheck size={16} /> : <span className="text-[12px] tabular-nums">{mod.num}</span>}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-medium">{mod.title}</span>
                        <span className="mt-0.5 block text-[12.5px] text-faint">{ok ? 'Sudah tuntas' : `${mod.readMin} menit baca`}</span>
                      </span>
                      <span className="btn-bubble text-faint group-hover:text-[var(--text)]"><IconArrowRight size={16} /></span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function ProfesiSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="h-11 w-full rounded-lg border border-[var(--border-strong)] bg-surface px-3 text-[14.5px] text-[var(--text)] outline-none focus:shadow-[var(--ring)]">
      {RUMPUN.map(r => {
        const list = PROFESI.filter(p => p.rumpun === r.id)
        if (!list.length) return null
        return (
          <optgroup key={r.id} label={r.label}>
            {list.map(p => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </optgroup>
        )
      })}
    </select>
  )
}

/* ------------------------------------------------------------ Indeks rumpun */
function RumpunIndex({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <section className="border-t border-app" aria-labelledby="judul-rumpun">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6 md:py-32 lg:px-8">
        <h2 id="judul-rumpun" className="reveal max-w-[20ch] text-[clamp(1.9rem,3.2vw,2.75rem)] font-semibold leading-[1.08]">Dua profesi inti, enam rumpun.</h2>
        {/* 2 kolom: inti melebar 2 + 6 rumpun = 8 sel = 2x4, tanpa sel kosong */}
        <div className="bento reveal mt-10 md:!grid-cols-2">
          {RUMPUN.map(r => {
            const list = PROFESI.filter(p => p.rumpun === r.id)
            if (!list.length) return null
            const bacaan = list[0].bacaan
            const ink = r.id === 'inti'
            return (
              <div key={r.id} className={`tile flex flex-col gap-5 ${ink ? 'tile-ink md:col-span-2' : ''}`}>
                <div>
                  <div className="text-[20px] font-semibold tracking-[-0.025em]">{r.label}</div>
                  <p className="mt-1.5 max-w-[52ch] text-[14px] text-muted">{r.desc}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map(p => (
                    <button key={p.id} onClick={() => onSelect(p.id)}
                      className={`chip transition-colors ${ink ? '!border-[color-mix(in_srgb,var(--fg-contrast)_25%,transparent)] !bg-transparent !text-[var(--fg-contrast)]' : 'hover:border-[var(--border-strong)] hover:text-[var(--text)]'}`}>
                      {pendek(p.nama)}
                    </button>
                  ))}
                </div>
                {bacaan && (
                  <Link to={`/m/${encodeURI(bacaan)}`} className="group mt-auto inline-flex items-center gap-1.5 text-[13.5px] font-medium">
                    Baca modulnya <span className="btn-bubble"><IconArrowRight size={14} /></span>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

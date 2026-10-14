import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'
import { linearModules } from '../lib/content'
import { isDue, GRADES } from '../lib/srs'
import type { CSSProperties, ReactNode } from 'react'
import { IconCards, IconCheck, IconArrowRight } from '../components/icons'

interface QCard {
  id: string
  q: string
  aHtml: string
  moduleId: string
  moduleTitle: string
  num: string
}
const NEW_LIMIT = 15

function buildCandidates(): QCard[] {
  return linearModules.flatMap(m =>
    m.cards.map(c => ({
      id: c.id,
      q: c.q,
      aHtml: c.aHtml,
      moduleId: m.id,
      moduleTitle: m.title,
      num: m.num,
    }))
  )
}

export default function ReviewPage() {
  const s = useStore()
  const candidates = useMemo(buildCandidates, [])
  const studied = useMemo(() => new Set(Object.keys(s.progress)), [s.progress])

  const [scope, setScope] = useState<'studied' | 'all'>('studied')
  const [phase, setPhase] = useState<'setup' | 'active' | 'done'>('setup')
  const [queue, setQueue] = useState<QCard[]>([])
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [stats, setStats] = useState({ reviewed: 0, again: 0, xp: 0 })

  const pools = useMemo(() => {
    const inScope = (c: QCard) => scope === 'all' || studied.has(c.moduleId)
    const due = candidates.filter(c => inScope(c) && s.srs[c.id] && isDue(s.srs[c.id]))
    const fresh = candidates.filter(c => inScope(c) && !s.srs[c.id])
    return { due, fresh }
  }, [candidates, studied, scope, s.srs])

  const studiedCount = candidates.filter(c => studied.has(c.moduleId)).length

  function start() {
    const q = [...pools.due, ...pools.fresh.slice(0, NEW_LIMIT)]
    if (!q.length) return
    setQueue(q)
    setIdx(0)
    setRevealed(false)
    setStats({ reviewed: 0, again: 0, xp: 0 })
    setPhase('active')
  }

  function grade(g: number) {
    const card = queue[idx]
    if (!card) return
    s.reviewCard(card.id, g)
    setStats(p => ({
      reviewed: p.reviewed + 1,
      again: p.again + (g === 0 ? 1 : 0),
      xp: p.xp + (g > 0 ? 6 : 0),
    }))
    let nq = queue
    if (g === 0) nq = [...queue, card] // Ulangi di akhir sesi
    const next = idx + 1
    if (next >= nq.length) {
      setQueue(nq)
      setPhase('done')
      return
    }
    setQueue(nq)
    setIdx(next)
    setRevealed(false)
  }

  // Keyboard: spasi buka, 1-4 nilai
  useEffect(() => {
    if (phase !== 'active') return
    const h = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (!revealed) setRevealed(true)
      } else if (revealed && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault()
        grade(Number(e.key) - 1)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [phase, revealed, idx, queue]) // eslint-disable-line

  // -------- Setup Phase --------
  if (phase === 'setup') {
    const total = pools.due.length + Math.min(pools.fresh.length, NEW_LIMIT)
    const modulPertama = linearModules.find(m => m.cards.length > 0) ?? linearModules[0]
    return (
      <div className="fade-up mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-24">
        <h1 className="text-[clamp(2.25rem,4.5vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.045em]">Review</h1>
        <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-muted">
          Coba jawab di kepala sebelum membuka kartu. Penilaianmu menentukan kapan kartu itu muncul lagi.
        </p>

        <div role="radiogroup" aria-label="Cakupan kartu"
          className="mt-10 inline-flex h-9 items-center gap-0.5 rounded-[10px] border border-app bg-surface p-0.5">
          {([['studied', 'Modul yang dibuka'], ['all', 'Seluruh kurikulum']] as const).map(([v, label]) => (
            <button
              key={v}
              role="radio"
              aria-checked={scope === v}
              onClick={() => setScope(v)}
              className={`h-full rounded-lg px-3.5 text-[13.5px] font-medium transition-colors duration-150 ${
                scope === v ? 'bg-[var(--surface-3)] text-[var(--text)]' : 'text-muted hover:text-[var(--text)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {scope === 'studied' && studiedCount === 0 ? (
          <div className="mt-8 rounded-[var(--radius)] border border-app bg-surface p-8 sm:p-10">
            <span className="grid h-11 w-11 place-items-center rounded-[var(--radius)] border border-app bg-[var(--surface-2)]">
              <IconCards size={20} />
            </span>
            <h2 className="mt-6 text-[20px] font-semibold tracking-[-0.025em]">Belum ada kartu dari modul yang kamu buka</h2>
            <p className="mt-2 max-w-[48ch] text-[14.5px] leading-relaxed text-muted">
              Kartu latihan muncul setelah kamu membuka modul. Mulai dari modul pertama, atau latih semua materi sekaligus.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link to={`/m/${encodeURI(modulPertama.id)}`} className="btn btn-primary">
                Buka modul pertama
                <span className="btn-bubble"><IconArrowRight size={15} /></span>
              </Link>
              <button onClick={() => setScope('all')} className="link-arrow">Pakai seluruh kurikulum</button>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[var(--radius)] border border-app bg-surface">
            <dl className="grid grid-cols-3 divide-x divide-[var(--border)]">
              <Metric value={pools.due.length} label="Jatuh tempo" />
              <Metric value={Math.min(pools.fresh.length, NEW_LIMIT)} label="Kartu baru" />
              <Metric value={total} label="Sesi ini" strong />
            </dl>
            <div className="border-t border-app p-5 sm:p-6">
              <button onClick={start} disabled={total === 0} className="btn btn-primary btn-lg group w-full">
                {total === 0 ? 'Tidak ada kartu untuk diulang' : (
                  <>
                    Mulai review {total} kartu
                    <span className="btn-bubble"><IconArrowRight size={16} /></span>
                  </>
                )}
              </button>
              {total === 0 && (
                <p className="mt-3 text-center text-[13px] text-faint">
                  Semua kartu sudah dijadwalkan. Kembali lagi nanti saat ada yang jatuh tempo.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-faint">
          <span className="flex items-center gap-2"><kbd>Space</kbd> buka jawaban</span>
          <span className="flex items-center gap-2"><kbd>1</kbd><kbd>4</kbd> beri nilai</span>
        </div>
      </div>
    )
  }

  // -------- Done Phase --------
  if (phase === 'done') {
    return (
      <div className="fade-up mx-auto max-w-xl px-4 py-16 text-center sm:px-6 md:py-24">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-[var(--radius)] border border-[var(--primary-border)] bg-[var(--primary-soft)] text-primary">
          <IconCheck size={22} />
        </span>
        <h1 className="mt-6 text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.05] tracking-[-0.045em]">Sesi selesai.</h1>
        <p className="mx-auto mt-3 max-w-[44ch] text-[15px] leading-relaxed text-muted">
          Kartu yang sulit dijadwalkan ulang lebih cepat. Yang lancar akan muncul lagi dengan jeda lebih panjang.
        </p>
        <dl className="mt-10 grid grid-cols-3 divide-x divide-[var(--border)] rounded-[var(--radius)] border border-app bg-surface">
          <Metric value={stats.reviewed} label="Ditinjau" />
          <Metric value={stats.again} label="Diulang" />
          <Metric value={`+${stats.xp}`} label="XP" strong />
        </dl>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button onClick={() => setPhase('setup')} className="btn btn-primary">Sesi berikutnya</button>
          <Link to="/" className="btn">Ke dasbor</Link>
        </div>
      </div>
    )
  }

  // -------- Active Review Phase --------
  const card = queue[idx]
  const progress = queue.length ? idx / queue.length : 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 md:py-16">
      <div className="mb-8 flex items-center gap-4">
        <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]" role="progressbar"
          aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={idx} aria-label="Progres sesi">
          <div className="h-full origin-left bg-[var(--text)] transition-transform duration-300"
            style={{ transform: `scaleX(${progress})` }} />
        </div>
        <span className="text-[13px] tabular-nums text-faint">{idx + 1} / {queue.length}</span>
      </div>

      <article className="flex min-h-[340px] flex-col justify-between rounded-[var(--radius)] border border-app bg-surface p-6 sm:p-9" key={card?.id + String(idx)}>
        <div>
          <Link to={`/m/${encodeURI(card.moduleId)}`}
            className="inline-flex items-center gap-1.5 text-[13px] text-faint transition-colors hover:text-[var(--text)]">
            {card.num && <span className="tabular-nums">{card.num}</span>}
            <span>{card.moduleTitle}</span>
          </Link>
          <div className="mt-5 text-[clamp(1.2rem,2.4vw,1.45rem)] font-medium leading-snug tracking-[-0.02em]"
            dangerouslySetInnerHTML={{ __html: card.q }} />

          {revealed && (
            <div className="fade-in mt-8 border-t border-app pt-7">
              <div className="mb-3 text-[13px] font-medium text-faint">Jawaban</div>
              <div className="prose !max-w-none !text-[15.5px]" dangerouslySetInnerHTML={{ __html: card.aHtml }} />
            </div>
          )}
        </div>

        {!revealed && (
          <button onClick={() => setRevealed(true)} className="btn btn-primary btn-lg mt-10 w-full">
            Buka jawaban
            <kbd className="!border-transparent !bg-[color-mix(in_srgb,var(--fg-contrast)_14%,transparent)] !text-[var(--fg-contrast)]">Space</kbd>
          </button>
        )}
      </article>

      {revealed && (
        <div className="fade-up mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {GRADES.map((g, gIdx) => (
            <button
              key={g.g}
              onClick={() => grade(g.g)}
              style={{ '--gc': g.color } as CSSProperties}
              className="group flex flex-col items-center gap-1 rounded-[var(--radius-sm)] border border-app bg-surface px-3 py-3.5 transition-colors duration-150 hover:border-[var(--gc)] active:scale-[0.98]"
            >
              <span className="text-[14.5px] font-medium transition-colors group-hover:text-[var(--gc)]">{g.label}</span>
              <span className="text-[12px] text-faint">{g.hint}</span>
              <kbd className="mt-1">{gIdx + 1}</kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Metric({ value, label, strong }: { value: ReactNode; label: string; strong?: boolean }) {
  return (
    <div className="flex flex-col-reverse px-4 py-6 text-center sm:py-7">
      <dt className="mt-2 text-[13px] text-faint">{label}</dt>
      <dd className={`text-[clamp(1.75rem,3.5vw,2.25rem)] font-semibold leading-none tracking-[-0.04em] tabular-nums ${strong ? 'text-[var(--text)]' : 'text-muted'}`}>
        {value}
      </dd>
    </div>
  )
}

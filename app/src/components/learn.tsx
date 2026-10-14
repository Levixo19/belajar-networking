import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../lib/store'
import { getModule } from '../lib/content'
import { IconCheck, IconCards, IconTrophy, IconRetry, IconBrain, IconExpand, IconClose } from './icons'

/* ---------------------------------------------------------------- Kuis sisipan */
export interface QuizItem { q: string; opts: string[]; a: number; why?: string }

export function InlineQuiz({ id, items }: { id: string; items: QuizItem[] }) {
  const store = useStore()
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const it = items[idx]
  const qid = `${id}#${idx}`
  const seenBefore = items.every((_, i) => store.quiz[`${id}#${i}`] !== undefined)

  function pick(i: number) {
    if (picked !== null) return
    setPicked(i)
    const ok = i === it.a
    if (ok) setScore(s => s + 1)
    store.answerQuiz(qid, ok)
  }
  function next() {
    if (idx + 1 >= items.length) { setDone(true); return }
    setIdx(idx + 1); setPicked(null)
  }
  function restart() { setIdx(0); setPicked(null); setScore(0); setDone(false) }

  if (done) {
    const pct = Math.round((score / items.length) * 100)
    return (
      <div className="lz lz-done pop">
        <div className="lz-badge" aria-hidden="true">{pct === 100 ? <IconTrophy size={22} /> : pct >= 60 ? <IconCheck size={22} /> : <IconRetry size={22} />}</div>
        <div className="lz-done-t">{score} dari {items.length} benar</div>
        <p className="lz-done-s">
          {pct === 100 ? 'Sempurna. Bagian ini sudah nempel, lanjut baca.'
            : pct >= 60 ? 'Sudah lumayan. Baca ulang sekilas bagian yang tadi salah, lalu lanjut.'
            : 'Masih goyah. Gulir ke atas, baca ulang sub-bab ini pelan-pelan, lalu ulangi kuisnya.'}
        </p>
        <button onClick={restart} className="btn mt-1">Ulangi kuis</button>
      </div>
    )
  }

  return (
    <div className="lz">
      <div className="lz-head">
        <span className="lz-tag">Cek pemahaman</span>
        <span className="lz-prog">
          {items.map((_, i) => <i key={i} className={`lz-dot ${i < idx ? 'past' : ''} ${i === idx ? 'now' : ''}`} />)}
        </span>
        <span className="lz-count">{idx + 1}/{items.length}</span>
        {seenBefore && <span className="lz-seen">pernah dikerjakan</span>}
      </div>
      <p className="lz-q" dangerouslySetInnerHTML={{ __html: it.q }} />
      <div className="lz-opts">
        {it.opts.map((o, i) => {
          const state = picked === null ? '' : i === it.a ? 'ok' : i === picked ? 'no' : 'off'
          return (
            <button key={i} onClick={() => pick(i)} disabled={picked !== null} className={`lz-opt ${state}`}>
              <span className="lz-key">{'ABCD'[i]}</span>
              <span dangerouslySetInnerHTML={{ __html: o }} />
              {state === 'ok' && <IconCheck size={16} />}
            </button>
          )
        })}
      </div>
      {picked !== null && (
        <div className={`lz-fb ${picked === it.a ? 'ok' : 'no'} fade-in`}>
          <strong>{picked === it.a ? 'Benar' : 'Belum tepat'}</strong>
          {it.why && <span dangerouslySetInnerHTML={{ __html: '. ' + it.why }} />}
          <button onClick={next} className="btn btn-primary !h-8 ml-auto shrink-0">
            {idx + 1 >= items.length ? 'Lihat hasil' : 'Lanjut'}
          </button>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------- Checkpoint kartu (dari materi) */
export function CardCheckpoint({ moduleId, from, count = 2 }: { moduleId: string; from: number; count?: number }) {
  const mod = getModule(moduleId)
  const cards = useMemo(() => (mod?.cards || []).slice(from, from + count), [moduleId, from, count])
  const store = useStore()
  const [i, setI] = useState(0)
  const [show, setShow] = useState(false)
  const [finished, setFinished] = useState(false)
  if (!cards.length) return null
  const c = cards[i]

  function grade(g: number) {
    store.reviewCard(c.id, g)
    if (i + 1 >= cards.length) { setFinished(true); return }
    setI(i + 1); setShow(false)
  }

  if (finished) return (
    <div className="lz lz-done pop">
      <div className="lz-badge" aria-hidden="true"><IconBrain size={22} /></div>
      <div className="lz-done-t">Checkpoint selesai</div>
      <p className="lz-done-s">Kartu-kartu ini masuk antrean review terjadwal. Sistem akan memunculkannya lagi tepat sebelum kamu lupa.</p>
    </div>
  )

  return (
    <div className="lz lz-cp">
      <div className="lz-head">
        <span className="lz-tag alt"><IconCards size={13} />Jeda sejenak, coba ingat</span>
        <span className="lz-count">{i + 1}/{cards.length}</span>
      </div>
      <p className="lz-q" dangerouslySetInnerHTML={{ __html: c.q }} />
      {!show ? (
        <>
          <p className="lz-hint">Jawab dulu di kepala, jangan langsung dibuka. Usaha mengingat itulah yang membangun ingatan.</p>
          <button onClick={() => setShow(true)} className="btn btn-primary">Lihat jawaban</button>
        </>
      ) : (
        <>
          <div className="lz-ans fade-in" dangerouslySetInnerHTML={{ __html: c.aHtml }} />
          <div className="lz-grade">
            <span className="lz-hint !mb-0">Seberapa lancar tadi?</span>
            <button onClick={() => grade(0)} className="btn lz-g no">Lupa</button>
            <button onClick={() => grade(1)} className="btn lz-g mid">Ragu</button>
            <button onClick={() => grade(2)} className="btn lz-g ok">Lancar</button>
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------- Foto */
export function PhotoFig({ src, caption, credit, href }: { src: string; caption?: string; credit?: string; href?: string }) {
  const [zoom, setZoom] = useState(false)
  useEffect(() => {
    if (!zoom) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoom(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [zoom])
  return (
    <>
      <figure className="ph-fig">
        <button className="ph-btn" onClick={() => setZoom(true)} aria-label="Perbesar gambar">
          <img src={src} alt={caption || ''} loading="lazy" />
          <span className="ph-zoom" aria-hidden="true"><IconExpand size={15} /></span>
        </button>
        {(caption || credit) && (
          <figcaption className="ph-cap">
            {caption}
            {credit && <span className="ph-credit">{href ? <a href={href} target="_blank" rel="noreferrer">{credit}</a> : credit}</span>}
          </figcaption>
        )}
      </figure>
      {zoom && createPortal(
        <div className="lb" onClick={() => setZoom(false)}>
          <img src={src} alt={caption || ''} />
          <button className="lb-x" aria-label="Tutup"><IconClose size={18} /></button>
          {caption && <div className="lb-cap">{caption}{credit ? `. ${credit}` : ''}</div>}
        </div>, document.body)}
    </>
  )
}

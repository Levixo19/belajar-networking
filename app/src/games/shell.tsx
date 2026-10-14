import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckIcon, XIcon } from '@phosphor-icons/react'
import { useStore } from '../lib/store'

export interface GameApi {
  running: boolean; left: number; score: number; combo: number; best: number
  start: () => void; stop: () => void
  hit: (points?: number) => void
  miss: () => void
}

/** Mesin mini-game berwaktu: skor, combo, rekor tersimpan per profil. */
export function useGame(slug: string, seconds = 60): GameApi {
  const store = useStore()
  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(seconds)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const scoreRef = useRef(0)
  const best = store.games[slug] || 0

  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => setLeft(l => {
      if (l <= 1) { clearInterval(iv); setRunning(false); store.recordGame(slug, scoreRef.current); return 0 }
      return l - 1
    }), 1000)
    return () => clearInterval(iv)
  }, [running]) // eslint-disable-line

  // Berpindah halaman di tengah permainan tetap menyimpan skor yang sudah didapat.
  const runRef = useRef(running)
  useEffect(() => { runRef.current = running }, [running])
  useEffect(() => () => { if (runRef.current && scoreRef.current > 0) store.recordGame(slug, scoreRef.current) }, []) // eslint-disable-line

  const start = useCallback(() => { scoreRef.current = 0; setScore(0); setCombo(0); setLeft(seconds); setRunning(true) }, [seconds])
  const stop = useCallback(() => { setRunning(false); store.recordGame(slug, scoreRef.current) }, [slug]) // eslint-disable-line
  const hit = useCallback((points = 10) => {
    setCombo(c => {
      const nc = c + 1
      const gained = points + Math.min(20, (nc - 1) * 2)
      scoreRef.current += gained
      setScore(scoreRef.current)
      return nc
    })
  }, [])
  const miss = useCallback(() => setCombo(0), [])
  return { running, left, score, combo, best, start, stop, hit, miss }
}

export function GameFrame({ g, title, desc, howto, children }: {
  g: GameApi; title: string; desc: string; howto?: string; children: ReactNode
}) {
  const pct = g.running ? (g.left / 60) * 100 : 100
  return (
    <div className="gm">
      <div className="gm-top">
        <div className="min-w-0">
          <div className="gm-title">{title}</div>
          <div className="gm-desc">{desc}</div>
        </div>
        <div className="gm-stats">
          <Stat v={g.score} l="skor" />
          <Stat v={g.combo > 1 ? `×${g.combo}` : '-'} l="combo" hot={g.combo > 2} />
          <Stat v={g.best} l="rekor" />
          <Stat v={g.running ? `${g.left}s` : '-'} l="sisa" warn={g.running && g.left <= 10} />
        </div>
      </div>
      {g.running && <div className="gm-bar"><i style={{ width: `${pct}%` }} /></div>}
      <div className="gm-body">
        {g.running ? children : (
          <div className="gm-idle">
            {howto && <p className="gm-howto">{howto}</p>}
            <button onClick={g.start} className="btn btn-primary !px-6 !py-2.5">
              {g.best ? 'Main lagi' : 'Mulai'}, 60 detik
            </button>
            {g.score > 0 && <p className="gm-last">Skor terakhir: <b>{g.score}</b>{g.score >= g.best && g.best > 0 ? '. Rekor baru.' : ''}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ v, l, hot, warn }: { v: ReactNode; l: string; hot?: boolean; warn?: boolean }) {
  return (
    <div className={`gm-stat ${hot ? 'hot' : ''} ${warn ? 'warn' : ''}`}>
      <div className="gm-stat-v">{v}</div><div className="gm-stat-l">{l}</div>
    </div>
  )
}

/** Umpan balik benar/salah sesaat. */
export function Flash({ kind, text }: { kind: 'ok' | 'no' | null; text?: string }) {
  if (!kind) return <div className="gm-flash ph" />
  return <div className={`gm-flash ${kind} pop`}>{kind === 'ok' ? <CheckIcon size={14} aria-hidden="true" /> : <XIcon size={14} aria-hidden="true" />}{text}</div>
}

export const rnd = (n: number) => Math.floor(Math.random() * n)
export function shuffle<T>(a: T[]): T[] {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]] }
  return b
}

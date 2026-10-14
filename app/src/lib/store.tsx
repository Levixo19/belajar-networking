import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import { type SrsState, review as srsReview, todayStr } from './srs'
import { api, type ProfileSummary } from './api'

type ProgressState = 'reading' | 'done'
interface Persisted {
  progress: Record<string, ProgressState>
  srs: Record<string, SrsState>
  xp: number; streak: number; bestStreak: number; lastActive: string
  scroll: Record<string, number>
  quiz: Record<string, boolean>        // {quizId: benar?}
  games: Record<string, number>        // {gameSlug: skor terbaik}
}
const emptyState: Persisted = { progress: {}, srs: {}, xp: 0, streak: 0, bestStreak: 0, lastActive: '', scroll: {}, quiz: {}, games: {} }
const PID_KEY = 'bn-profile-id'
const XP_MODULE = 40, XP_CARD = 6, XP_QUIZ = 10

function cacheKey(id: string) { return `bn-cache-${id}` }
function readCache(id: string): Persisted | null {
  try { const s = localStorage.getItem(cacheKey(id)); return s ? { ...emptyState, ...JSON.parse(s) } : null } catch { return null }
}

function levelFromXp(xp: number) {
  let lvl = 1, need = 100, acc = 0
  while (xp >= acc + need) { acc += need; lvl++; need = Math.round(need * 1.35) }
  return { level: lvl, xpInLevel: xp - acc, xpForNext: need }
}

interface StoreCtx extends Persisted {
  status: 'loading' | 'ready'
  offline: boolean
  profileId: string | null
  profileName: string
  avatar: string
  profiles: ProfileSummary[]
  markReading: (id: string) => void
  markDone: (id: string) => void
  toggleDone: (id: string) => void
  reviewCard: (id: string, grade: number) => void
  answerQuiz: (id: string, correct: boolean) => void
  recordGame: (slug: string, score: number) => void
  saveScroll: (id: string, y: number) => void
  reset: () => void
  createProfile: (name: string, avatar: string) => Promise<void>
  switchProfile: (id: string) => void
  refreshProfiles: () => void
  level: number; levelProgress: number; xpInLevel: number; xpForNext: number
}
const Ctx = createContext<StoreCtx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')
  const [offline, setOffline] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profileName, setProfileName] = useState('')
  const [avatar, setAvatar] = useState('tone:ink')
  const [profiles, setProfiles] = useState<ProfileSummary[]>([])
  const [state, setState] = useState<Persisted>(emptyState)
  const booted = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)

  // Bootstrap: pilih/buat profil lalu muat state
  useEffect(() => {
    if (booted.current) return
    booted.current = true
    ;(async () => {
      try {
        const list = await api.listProfiles()
        setProfiles(list)
        let id = localStorage.getItem(PID_KEY)
        if (!id || !list.find(p => p.id === id)) id = list[0]?.id || null
        if (!id) {
          const created = await api.createProfile('Saya', 'tone:ink')
          setProfiles([created]); id = created.id
        }
        localStorage.setItem(PID_KEY, id)
        await loadProfile(id)
        setOffline(false)
      } catch {
        // Server tidak tersedia → mode offline dari cache
        setOffline(true)
        const id = localStorage.getItem(PID_KEY)
        if (id) { const c = readCache(id); if (c) { setProfileId(id); setState(c) } }
        setStatus('ready')
      }
    })()
  }, []) // eslint-disable-line

  async function loadProfile(id: string) {
    setStatus('loading')
    const cached = readCache(id)
    if (cached) setState(cached)
    try {
      const full = await api.getState(id)
      setProfileId(id); setProfileName(full.name); setAvatar(full.avatar)
      const st: Persisted = {
        progress: (full.progress || {}) as Record<string, ProgressState>, srs: full.srs || {}, scroll: full.scroll || {},
        quiz: full.quiz || {}, games: full.games || {},
        xp: full.xp || 0, streak: full.streak || 0, bestStreak: full.bestStreak || 0, lastActive: full.lastActive || '',
      }
      setState(st)
      localStorage.setItem(cacheKey(id), JSON.stringify(st))
      localStorage.setItem(PID_KEY, id)
      setOffline(false)
    } catch {
      setOffline(true); setProfileId(id)
    } finally { setStatus('ready') }
  }

  // Simpan ter-debounce ke server + cache
  useEffect(() => {
    if (status !== 'ready' || !profileId) return
    if (!dirty.current) return
    localStorage.setItem(cacheKey(profileId), JSON.stringify(state))
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      api.saveState(profileId, state).then(() => setOffline(false)).catch(() => setOffline(true))
    }, 600)
  }, [state, profileId, status])

  const mutate = useCallback((fn: (s: Persisted) => Persisted) => {
    dirty.current = true
    setState(fn)
  }, [])

  const touchStreak = (s: Persisted): Persisted => {
    const today = todayStr()
    if (s.lastActive === today) return s
    const streak = s.lastActive === todayStr(-1) ? s.streak + 1 : 1
    return { ...s, lastActive: today, streak, bestStreak: Math.max(s.bestStreak, streak) }
  }

  const markReading = useCallback((id: string) => mutate(s => s.progress[id] ? s : touchStreak({ ...s, progress: { ...s.progress, [id]: 'reading' } })), [mutate])
  const markDone = useCallback((id: string) => mutate(s => s.progress[id] === 'done' ? s : touchStreak({ ...s, progress: { ...s.progress, [id]: 'done' }, xp: s.xp + XP_MODULE })), [mutate])
  const toggleDone = useCallback((id: string) => mutate(s => {
    if (s.progress[id] === 'done') { const p = { ...s.progress }; p[id] = 'reading'; return { ...s, progress: p, xp: Math.max(0, s.xp - XP_MODULE) } }
    return touchStreak({ ...s, progress: { ...s.progress, [id]: 'done' }, xp: s.xp + XP_MODULE })
  }), [mutate])
  const reviewCard = useCallback((id: string, grade: number) => mutate(s => {
    const next = srsReview(s.srs[id], grade)
    return touchStreak({ ...s, srs: { ...s.srs, [id]: next }, xp: grade > 0 ? s.xp + XP_CARD : s.xp })
  }), [mutate])
  const saveScroll = useCallback((id: string, y: number) => mutate(s => ({ ...s, scroll: { ...s.scroll, [id]: y } })), [mutate])
  // Kuis sisipan: XP hanya diberi sekali, saat pertama kali benar.
  const answerQuiz = useCallback((id: string, correct: boolean) => mutate(s => {
    const already = s.quiz[id]
    if (already === true) return { ...s, quiz: { ...s.quiz, [id]: correct } }
    return touchStreak({ ...s, quiz: { ...s.quiz, [id]: correct }, xp: correct ? s.xp + XP_QUIZ : s.xp })
  }), [mutate])
  // Mini-game: simpan skor terbaik, beri XP atas selisih peningkatan.
  const recordGame = useCallback((slug: string, score: number) => mutate(s => {
    const best = s.games[slug] || 0
    if (score <= best) return s
    return touchStreak({ ...s, games: { ...s.games, [slug]: score }, xp: s.xp + Math.min(60, score - best) })
  }), [mutate])

  const reset = useCallback(() => {
    if (!confirm('Reset semua progres, XP, dan riwayat review profil ini?')) return
    dirty.current = false
    setState({ ...emptyState })
    if (profileId) { localStorage.setItem(cacheKey(profileId), JSON.stringify(emptyState)); api.reset(profileId).catch(() => setOffline(true)) }
  }, [profileId])

  const refreshProfiles = useCallback(() => { api.listProfiles().then(setProfiles).catch(() => {}) }, [])
  const createProfile = useCallback(async (name: string, av: string) => {
    const p = await api.createProfile(name, av)
    setProfiles(prev => [p, ...prev])
    dirty.current = false
    await loadProfile(p.id)
  }, [])
  const switchProfile = useCallback((id: string) => {
    if (id === profileId) return
    dirty.current = false
    loadProfile(id)
    refreshProfiles()
  }, [profileId, refreshProfiles])

  const { level, xpInLevel, xpForNext } = levelFromXp(state.xp)
  const value: StoreCtx = {
    ...state, status, offline, profileId, profileName, avatar, profiles,
    markReading, markDone, toggleDone, reviewCard, answerQuiz, recordGame, saveScroll, reset,
    createProfile, switchProfile, refreshProfiles,
    level, xpInLevel, xpForNext, levelProgress: xpForNext ? xpInLevel / xpForNext : 0,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): StoreCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore di luar provider')
  return c
}

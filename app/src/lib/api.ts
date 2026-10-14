// Klien API (Express + MongoDB). Semua state pengguna disimpan di server.
export interface ProfileSummary { id: string; name: string; avatar: string; xp: number; streak: number; done: number; updatedAt: string }
export interface FullState {
  id: string; name: string; avatar: string
  progress: Record<string, string>
  srs: Record<string, any>
  scroll: Record<string, number>
  quiz: Record<string, boolean>
  games: Record<string, number>
  xp: number; streak: number; bestStreak: number; lastActive: string
}

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`)
  return res.json()
}

export const api = {
  health: () => fetch('/api/health').then(j<{ ok: boolean }>),
  listProfiles: () => fetch('/api/profiles').then(j<ProfileSummary[]>),
  createProfile: (name: string, avatar: string) =>
    fetch('/api/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, avatar }) }).then(j<ProfileSummary>),
  getState: (id: string) => fetch(`/api/profiles/${id}`).then(j<FullState>),
  saveState: (id: string, patch: Partial<FullState>) =>
    fetch(`/api/profiles/${id}/state`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).then(j<{ ok: boolean }>),
  reset: (id: string) => fetch(`/api/profiles/${id}/reset`, { method: 'POST' }).then(j<{ ok: boolean }>),
  remove: (id: string) => fetch(`/api/profiles/${id}`, { method: 'DELETE' }).then(j<{ ok: boolean }>),
}

import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { connectDB } from './db.mjs'
import { Profile } from './models/Profile.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json({ limit: '4mb' }))

const wrap = fn => (req, res) => fn(req, res).catch(e => { console.error(e); res.status(500).json({ error: e.message }) })

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Daftar profil (ringkasan)
app.get('/api/profiles', wrap(async (_req, res) => {
  const list = await Profile.find().sort({ updatedAt: -1 })
  res.json(list.map(p => p.summary()))
}))

// Buat profil
app.post('/api/profiles', wrap(async (req, res) => {
  const name = (req.body?.name || '').trim() || 'Saya'
  const avatar = req.body?.avatar || '🧑‍💻'
  const p = await Profile.create({ name, avatar })
  res.status(201).json(p.summary())
}))

// Ambil state penuh satu profil
app.get('/api/profiles/:id', wrap(async (req, res) => {
  const p = await Profile.findById(req.params.id)
  if (!p) return res.status(404).json({ error: 'Profil tidak ditemukan' })
  res.json({
    id: p._id, name: p.name, avatar: p.avatar,
    progress: p.progress || {}, srs: p.srs || {}, scroll: p.scroll || {}, quiz: p.quiz || {}, games: p.games || {},
    xp: p.xp, streak: p.streak, bestStreak: p.bestStreak, lastActive: p.lastActive,
  })
}))

// Simpan state (replace)
app.put('/api/profiles/:id/state', wrap(async (req, res) => {
  const b = req.body || {}
  const upd = {}
  for (const k of ['progress', 'srs', 'scroll', 'quiz', 'games', 'xp', 'streak', 'bestStreak', 'lastActive', 'name', 'avatar'])
    if (b[k] !== undefined) upd[k] = b[k]
  const p = await Profile.findByIdAndUpdate(req.params.id, upd, { new: true })
  if (!p) return res.status(404).json({ error: 'Profil tidak ditemukan' })
  res.json({ ok: true, updatedAt: p.updatedAt })
}))

// Reset state
app.post('/api/profiles/:id/reset', wrap(async (req, res) => {
  const p = await Profile.findByIdAndUpdate(req.params.id,
    { progress: {}, srs: {}, scroll: {}, quiz: {}, games: {}, xp: 0, streak: 0, bestStreak: 0, lastActive: '' }, { new: true })
  if (!p) return res.status(404).json({ error: 'Profil tidak ditemukan' })
  res.json({ ok: true })
}))

// Hapus profil
app.delete('/api/profiles/:id', wrap(async (req, res) => {
  await Profile.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
}))

// Sajikan client hasil build bila ada (opsional, untuk 1-proses lokal)
const dist = path.resolve(__dirname, '..', 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

const PORT = process.env.PORT || 4000
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 API Belajar Networking di http://localhost:${PORT}`))
})

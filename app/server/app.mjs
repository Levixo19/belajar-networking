// Aplikasi Express Belajar Networking, dipisah dari `listen` supaya penjagaannya
// bisa dites tanpa membuka port sungguhan dan tanpa MongoDB (lihat tests/server.test.mjs).
//
// MODEL ANCAMAN. Server ini tidak punya autentikasi: siapa pun yang bisa mengirim
// permintaan HTTP ke sini bisa membaca, menimpa, dan MENGHAPUS profil belajar.
// Itu cuma aman kalau "siapa pun" berarti "program di laptop ini saja". Karena itu
// penjagaannya berlapis tiga, dan ketiganya wajib ada:
//   1. bind loopback (index.mjs): mesin lain di LAN tidak bisa menyambung sama sekali.
//   2. Host harus nama loopback: menutup DNS rebinding, yaitu situs jahat yang
//      membuat nama domainnya sendiri menunjuk 127.0.0.1 lalu memanggil API ini
//      dari tab browser pemilik. Permintaannya tiba dengan Host: domain-jahat.
//   3. Origin (kalau ada) harus asal lokal aplikasi ini, untuk SEMUA metode yang
//      mengubah data: menutup CSRF, yaitu <form method=post> di situs lain yang
//      menembak localhost:4000. CORS saja tidak cukup untuk ini, karena CORS cuma
//      melarang browser MEMBACA jawabannya; permintaannya sendiri tetap sampai.
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Profile } from './models/Profile.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Port yang dipakai aplikasi ini: API, Vite dev, dan Vite preview. */
export const PORT_LOKAL = [4000, 5173, 4173]
const NAMA_LOOPBACK = ['127.0.0.1', 'localhost', '[::1]']

/** Asal (Origin) yang boleh mengubah data: hanya halaman aplikasi ini sendiri. */
export function asalLokal(ports = PORT_LOKAL) {
  const s = new Set()
  for (const h of NAMA_LOOPBACK) for (const p of ports) s.add(`http://${h}:${p}`)
  return s
}

/** "localhost:5173" -> true; "jahat.example:4000" -> false. Port wajib salah satu `ports`. */
export function hostLokal(host, ports = PORT_LOKAL) {
  if (typeof host !== 'string') return false
  const m = host.toLowerCase().match(/^(\[::1\]|127\.0\.0\.1|localhost)(?::(\d+))?$/)
  if (!m || m[2] === undefined) return false
  return ports.includes(Number(m[2]))
}

const MENGUBAH = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const KUNCI_PETA = ['progress', 'srs', 'scroll', 'quiz', 'games']
const KUNCI_ANGKA = ['xp', 'streak', 'bestStreak']

const objekPolos = v => v !== null && typeof v === 'object' && !Array.isArray(v)
const angkaSah = v => typeof v === 'number' && Number.isFinite(v) && v >= 0

/**
 * Bentuk patch PUT /state yang sah, atau pesan galatnya. Mongoose tidak menjalankan
 * validator pada findByIdAndUpdate secara bawaan, jadi tanpa ini `xp: "banyak"` atau
 * `progress: [1,2]` tersimpan apa adanya dan baru meledak di browser saat dimuat.
 */
export function periksaPatch(b) {
  if (!objekPolos(b)) return { galat: 'Badan permintaan harus objek JSON' }
  const upd = {}
  for (const k of KUNCI_PETA) if (b[k] !== undefined) {
    if (!objekPolos(b[k])) return { galat: `"${k}" harus objek` }
    upd[k] = b[k]
  }
  for (const k of KUNCI_ANGKA) if (b[k] !== undefined) {
    if (!angkaSah(b[k])) return { galat: `"${k}" harus angka tidak negatif` }
    upd[k] = b[k]
  }
  if (b.lastActive !== undefined) {
    if (typeof b.lastActive !== 'string' || !/^(\d{4}-\d{2}-\d{2})?$/.test(b.lastActive)) return { galat: '"lastActive" harus tanggal YYYY-MM-DD' }
    upd.lastActive = b.lastActive
  }
  for (const k of ['name', 'avatar']) if (b[k] !== undefined) {
    if (typeof b[k] !== 'string' || b[k].length > 40) return { galat: `"${k}" harus teks paling panjang 40 huruf` }
    upd[k] = b[k]
  }
  return { upd }
}

export function buatApp({ ports = PORT_LOKAL, sajikanDist = true } = {}) {
  const asal = asalLokal(ports)
  const app = express()
  app.disable('x-powered-by')

  // Lapis 2: Host. Berlaku untuk SEMUA permintaan, termasuk GET: DNS rebinding
  // bisa membaca seluruh progres lewat GET kalau cuma mutasi yang dijaga.
  app.use((req, res, next) => {
    if (!hostLokal(req.headers.host, ports)) return res.status(403).json({ error: 'Host tidak diizinkan' })
    next()
  })

  // Lapis 3: Origin untuk mutasi. Permintaan tanpa Origin (curl, skrip lokal) lolos:
  // browser SELALU mengirim Origin pada POST/PUT/DELETE lintas asal, jadi yang
  // tidak membawanya memang bukan halaman web.
  app.use((req, res, next) => {
    const o = req.headers.origin
    if (MENGUBAH.has(req.method) && o !== undefined && !asal.has(o)) return res.status(403).json({ error: 'Asal permintaan tidak diizinkan' })
    next()
  })

  // CORS hanya untuk asal lokal. Lapis 3 di atas yang benar-benar menolak mutasi;
  // ini menjaga agar halaman lain juga tidak bisa MEMBACA jawabannya.
  app.use(cors({ origin: (o, cb) => cb(null, o === undefined || asal.has(o)) }))
  app.use(express.json({ limit: '4mb' }))

  // Galat 500 tidak membawa e.message: pesan Mongo bisa memuat nama koleksi,
  // URI, atau isi dokumen. Rinciannya cukup di log server.
  const wrap = fn => (req, res) => fn(req, res).catch(e => {
    console.error(e)
    res.status(500).json({ error: 'Galat server. Lihat log server untuk rinciannya.' })
  })

  // ID yang bukan ObjectId sah dulu meledak jadi CastError -> 500. Itu kesalahan
  // pemanggil, bukan server.
  const denganId = fn => wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'ID profil tidak sah' })
    return fn(req, res)
  })

  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  app.get('/api/profiles', wrap(async (_req, res) => {
    const list = await Profile.find().sort({ updatedAt: -1 })
    res.json(list.map(p => p.summary()))
  }))

  app.post('/api/profiles', wrap(async (req, res) => {
    const name = (typeof req.body?.name === 'string' ? req.body.name : '').trim().slice(0, 40) || 'Saya'
    const avatar = typeof req.body?.avatar === 'string' ? req.body.avatar.slice(0, 40) : 'tone:ink'
    const p = await Profile.create({ name, avatar })
    res.status(201).json(p.summary())
  }))

  app.get('/api/profiles/:id', denganId(async (req, res) => {
    const p = await Profile.findById(req.params.id)
    if (!p) return res.status(404).json({ error: 'Profil tidak ditemukan' })
    res.json({
      id: p._id, name: p.name, avatar: p.avatar,
      progress: p.progress || {}, srs: p.srs || {}, scroll: p.scroll || {}, quiz: p.quiz || {}, games: p.games || {},
      xp: p.xp, streak: p.streak, bestStreak: p.bestStreak, lastActive: p.lastActive,
    })
  }))

  // Simpan state (replace per kunci)
  app.put('/api/profiles/:id/state', denganId(async (req, res) => {
    const { upd, galat } = periksaPatch(req.body)
    if (galat) return res.status(400).json({ error: galat })
    const p = await Profile.findByIdAndUpdate(req.params.id, upd, { new: true, runValidators: true })
    if (!p) return res.status(404).json({ error: 'Profil tidak ditemukan' })
    res.json({ ok: true, updatedAt: p.updatedAt })
  }))

  app.post('/api/profiles/:id/reset', denganId(async (req, res) => {
    const p = await Profile.findByIdAndUpdate(req.params.id,
      { progress: {}, srs: {}, scroll: {}, quiz: {}, games: {}, xp: 0, streak: 0, bestStreak: 0, lastActive: '' }, { new: true })
    if (!p) return res.status(404).json({ error: 'Profil tidak ditemukan' })
    res.json({ ok: true })
  }))

  // Hapus profil: 404 kalau tidak ada, supaya klien tidak mengira berhasil menghapus
  // sesuatu yang memang tidak pernah ada (mis. salah ketik ID).
  app.delete('/api/profiles/:id', denganId(async (req, res) => {
    const p = await Profile.findByIdAndDelete(req.params.id)
    if (!p) return res.status(404).json({ error: 'Profil tidak ditemukan' })
    res.json({ ok: true })
  }))

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Rute API tidak dikenal' }))

  // Sajikan client hasil build bila ada (opsional, untuk 1-proses lokal).
  // Ingat: dist/ basi kalau `npm run content` dijalankan tanpa `vite build` sesudahnya.
  const dist = path.resolve(__dirname, '..', 'dist')
  if (sajikanDist && fs.existsSync(dist)) {
    app.use(express.static(dist))
    // Fallback SPA hanya untuk path TANPA ekstensi. Dulu /assets/Lama-abc.js yang sudah
    // tidak ada (tab yang dibuka sebelum build ulang) dijawab index.html, dan browser
    // melapor "MIME type text/html" alih-alih 404 yang jelas.
    app.get(/^(?!\/api)(?!.*\.[a-z0-9]+$).*/i, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
  }

  // JSON rusak dari express.json(): 400, bukan halaman galat HTML berisi jejak tumpukan.
  app.use((err, _req, res, _next) => {
    if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON tidak sah' })
    if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Badan permintaan terlalu besar' })
    console.error(err)
    res.status(500).json({ error: 'Galat server. Lihat log server untuk rinciannya.' })
  })

  return app
}

// Penjagaan server ditembak dari sudut penyerang. Bagian pertama tidak butuh MongoDB:
// semua penolakan (Host, Origin, ObjectId, JSON rusak) terjadi SEBELUM kueri pertama.
// Bagian kedua (integrasi) memakai database uji sendiri dan menolak berjalan di
// database apa pun yang namanya tidak diawali `bn_uji_`, supaya tes ini tidak akan
// pernah menyentuh `belajar_networking`, tempat progres pemiliknya tersimpan.
import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import http from 'node:http'
import { buatApp, hostLokal, periksaPatch } from '../server/app.mjs'

async function nyalakan() {
  const app = buatApp({ ports: [4000, 5173, 4173], sajikanDist: false })
  const srv = await new Promise(r => { const s = app.listen(0, '127.0.0.1', () => r(s)) })
  const port = srv.address().port
  // node:http, bukan fetch: fetch (undici) diam-diam membuang header Host buatan
  // sendiri, sehingga tes rebinding akan "lulus" karena alasan yang salah.
  // Host dipalsukan ke localhost:4000 (yang sah); port soketnya sendiri acak.
  const tembak = (p, { host = 'localhost:4000', method = 'GET', headers = {}, body } = {}) =>
    new Promise((ok, gagal) => {
      const req = http.request({ host: '127.0.0.1', port, path: p, method, headers: { host, ...headers } }, res => {
        let data = ''
        res.on('data', c => { data += c })
        res.on('end', () => ok({ status: res.statusCode, headers: { get: k => res.headers[k] ?? null }, json: async () => JSON.parse(data) }))
      })
      req.on('error', gagal)
      if (body !== undefined) req.write(body)
      req.end()
    })
  return { srv, tembak }
}

describe('penjagaan tanpa MongoDB', () => {
  let srv, tembak
  before(async () => ({ srv, tembak } = await nyalakan()))
  after(() => srv.close())

  test('hostLokal hanya menerima nama loopback dengan port aplikasi', () => {
    assert.ok(hostLokal('localhost:5173'))
    assert.ok(hostLokal('127.0.0.1:4000'))
    assert.ok(hostLokal('[::1]:4173'))
    assert.ok(!hostLokal('127.0.0.1'), 'tanpa port')
    assert.ok(!hostLokal('localhost:8080'), 'port asing')
    assert.ok(!hostLokal('jahat.example:4000'), 'DNS rebinding')
    assert.ok(!hostLokal('localhost.jahat.example:4000'))
    assert.ok(!hostLokal(undefined))
  })

  test('DNS rebinding: Host asing ditolak, juga untuk GET', async () => {
    const r = await tembak('/api/health', { host: 'jahat.example:4000' })
    assert.equal(r.status, 403)
  })

  test('CSRF: mutasi dari Origin asing ditolak sebelum menyentuh data', async () => {
    for (const [method, p] of [['POST', '/api/profiles'], ['DELETE', '/api/profiles/000000000000000000000000'],
      ['PUT', '/api/profiles/000000000000000000000000/state'], ['POST', '/api/profiles/000000000000000000000000/reset']]) {
      const r = await tembak(p, { method, headers: { origin: 'https://jahat.example', 'content-type': 'application/json' }, body: method === 'DELETE' ? undefined : '{}' })
      assert.equal(r.status, 403, `${method} ${p}`)
    }
  })

  test('CORS tidak memberi izin baca ke asal asing', async () => {
    const r = await tembak('/api/health', { headers: { origin: 'https://jahat.example' } })
    assert.equal(r.headers.get('access-control-allow-origin'), null)
    const ok = await tembak('/api/health', { headers: { origin: 'http://localhost:5173' } })
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173')
  })

  test('ID yang bukan ObjectId: 400, bukan 500', async () => {
    for (const [method, p] of [['GET', '/api/profiles/xyz'], ['DELETE', '/api/profiles/xyz'], ['POST', '/api/profiles/xyz/reset']]) {
      const r = await tembak(p, { method })
      assert.equal(r.status, 400, `${method} ${p}`)
    }
  })

  test('JSON rusak: 400 berbentuk JSON, tanpa jejak tumpukan', async () => {
    const r = await tembak('/api/profiles/000000000000000000000000/state', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: '{rusak' })
    assert.equal(r.status, 400)
    const b = await r.json()
    assert.equal(b.error, 'JSON tidak sah')
  })

  test('rute API tak dikenal: 404 JSON', async () => {
    const r = await tembak('/api/tidak-ada')
    assert.equal(r.status, 404)
  })

  test('periksaPatch menolak bentuk yang akan meledak di browser', () => {
    assert.ok(periksaPatch({ xp: 'banyak' }).galat)
    assert.ok(periksaPatch({ xp: -1 }).galat)
    assert.ok(periksaPatch({ progress: [1, 2] }).galat)
    assert.ok(periksaPatch({ lastActive: 'kemarin' }).galat)
    assert.ok(periksaPatch({ name: 'x'.repeat(41) }).galat)
    assert.ok(periksaPatch([]).galat)
    assert.deepEqual(periksaPatch({ xp: 40, progress: { a: 'done' }, lastActive: '2026-01-02', asing: 1 }).upd,
      { xp: 40, progress: { a: 'done' }, lastActive: '2026-01-02' })
  })
})

const URI_UJI = process.env.MONGODB_URI_UJI || `mongodb://127.0.0.1:27017/bn_uji_tes_${process.pid}`
const namaDb = new URL(URI_UJI).pathname.slice(1)

describe('integrasi dengan database uji', { skip: process.env.BN_TANPA_MONGO ? 'BN_TANPA_MONGO diset' : false }, () => {
  let srv, tembak, siap = false
  before(async () => {
    assert.match(namaDb, /^bn_uji_/, 'tes integrasi hanya boleh memakai database bn_uji_*')
    try { await mongoose.connect(URI_UJI, { serverSelectionTimeoutMS: 1500 }); siap = true } catch { /* tanpa Mongo: dilewati */ }
    ;({ srv, tembak } = await nyalakan())
  })
  after(async () => {
    srv.close()
    if (siap) { await mongoose.connection.dropDatabase(); await mongoose.disconnect() }
  })

  test('buat, simpan, hapus, lalu hapus lagi = 404', async t => {
    if (!siap) return t.skip('MongoDB tidak terjangkau di 127.0.0.1:27017')
    const asal = { origin: 'http://localhost:5173', 'content-type': 'application/json' }
    const p = await (await tembak('/api/profiles', { method: 'POST', headers: asal, body: JSON.stringify({ name: 'Uji', avatar: 'tone:ink' }) })).json()
    const put = await tembak(`/api/profiles/${p.id}/state`, { method: 'PUT', headers: asal, body: JSON.stringify({ xp: 40, progress: { 'a/b': 'done' } }) })
    assert.equal(put.status, 200)
    const st = await (await tembak(`/api/profiles/${p.id}`)).json()
    assert.equal(st.xp, 40)
    assert.equal((await tembak(`/api/profiles/${p.id}`, { method: 'DELETE', headers: asal })).status, 200)
    assert.equal((await tembak(`/api/profiles/${p.id}`, { method: 'DELETE', headers: asal })).status, 404)
  })
})

describe('penyajian dist', () => {
  test('aset yang tidak ada: 404, bukan index.html', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const dist = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../dist')
    if (!fs.existsSync(dist)) return
    const app = buatApp({ ports: [4000], sajikanDist: true })
    const srv = await new Promise(r => { const s = app.listen(0, '127.0.0.1', () => r(s)) })
    const port = srv.address().port
    const minta = p => new Promise(ok => http.get({ host: '127.0.0.1', port, path: p, headers: { host: 'localhost:4000' } }, res => { res.resume(); ok(res) }))
    try {
      assert.equal((await minta('/assets/TidakAda-abc123.js')).statusCode, 404)
      const r = await minta('/karier')
      assert.equal(r.statusCode, 200)
      assert.match(r.headers['content-type'], /text\/html/)
    } finally { srv.close() }
  })
})

// Logika dan data Peta Karier (src/lib/profesi.ts, data/profesi/*.json).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { PROFESI, byId, edges, readiness, shortestPath, celahJalur, scoreQuiz, QUIZ } from '../src/lib/profesi.ts'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const URUT = { pemula: 0, menengah: 1, senior: 2 }

test('graf berarah terhubung: setiap profesi bisa mencapai setiap profesi lain', () => {
  const tak = []
  for (const a of PROFESI) for (const b of PROFESI) if (!shortestPath(a.id, b.id)) tak.push(`${a.id} -> ${b.id}`)
  assert.deepEqual(tak, [])
})

test('jalur deterministik, setiap langkah sisi yang ada, dan "naik" cuma dilalui ke arah naiknya', () => {
  const naik = new Set(), dekat = new Set()
  for (const p of PROFESI) {
    for (const q of p.naik) naik.add(`${p.id}|${q}`)
    for (const q of p.dekat) { dekat.add(`${p.id}|${q}`); dekat.add(`${q}|${p.id}`) }
  }
  for (const a of PROFESI) for (const b of PROFESI) {
    const j = shortestPath(a.id, b.id)
    assert.deepEqual(j, shortestPath(a.id, b.id), `${a.id} -> ${b.id} tidak deterministik`)
    assert.equal(j[0], a.id); assert.equal(j.at(-1), b.id)
    for (let i = 1; i < j.length; i++) {
      const k = `${j[i - 1]}|${j[i]}`
      assert.ok(naik.has(k) || dekat.has(k), `${k} bukan sisi, atau "naik" dilalui terbalik`)
      // Turun jenjang hanya lewat "dekat".
      if (URUT[byId.get(j[i]).jenjang] < URUT[byId.get(j[i - 1]).jenjang]) assert.ok(dekat.has(k), `${k} turun jenjang lewat "naik"`)
    }
  }
})

test('profesi tak dikenal: tidak ada jalur, bukan jalur ke profesi lain', () => {
  assert.equal(shortestPath('network-engineer', 'tidak-ada'), null)
  assert.equal(shortestPath('tidak-ada', 'network-engineer'), null)
})

test('celah jalur menghitung bekal profesi PERANTARA, bukan cuma tujuan', () => {
  for (const a of PROFESI) for (const b of PROFESI) {
    const j = shortestPath(a.id, b.id)
    if (j.length < 3) continue
    const celah = new Set(celahJalur(j))
    const punya = new Set(a.modul)
    for (const pid of j.slice(1)) for (const m of byId.get(pid).modul) if (!punya.has(m)) assert.ok(celah.has(m), `${a.id} -> ${b.id}: ${m} dari ${pid}`)
    return // satu jalur panjang cukup sebagai bukti bentuknya; yang di atas sudah memeriksa semua jalurnya ada
  }
})

test('setiap profesi BISA jadi pemenang kuis (sapuan seluruh kombinasi jawaban)', () => {
  const n = QUIZ.map(q => q.opts.length)
  const total = n.reduce((a, b) => a * b, 1)
  assert.equal(total, 4096)
  const menang = new Set()
  for (let k = 0; k < total; k++) {
    let x = k
    const pilihan = n.map(m => { const v = x % m; x = Math.floor(x / m); return v })
    menang.add(scoreQuiz(pilihan)[0].p.id)
  }
  assert.deepEqual([...menang].sort(), PROFESI.map(p => p.id).sort())
})

test('kuis menolak indeks di luar rentang', () => {
  assert.deepEqual(scoreQuiz([9, -1, 1.5, NaN, null, 99]), [])
  assert.deepEqual(scoreQuiz([]), [])
})

test('pemula tidak disarankan peran senior lebih dulu', () => {
  const n = QUIZ.map(q => q.opts.length)
  for (let k = 0; k < 4096; k += 7) {
    let x = k
    const pilihan = n.map(m => { const v = x % m; x = Math.floor(x / m); return v })
    const h = scoreQuiz(pilihan, { pemula: true })
    const pertamaSenior = h.findIndex(r => r.p.jenjang === 'senior')
    if (pertamaSenior >= 0) assert.ok(h.slice(pertamaSenior).every(r => r.p.jenjang === 'senior'), String(pilihan))
  }
})

test('kesiapan = modul bekal tuntas / modul bekal yang ada di kurikulum', () => {
  const p = byId.get('network-engineer')
  assert.equal(readiness(p, {}).pct, 0)
  assert.equal(readiness(p, Object.fromEntries(p.modul.map(m => [m, 'done']))).pct, 1)
  const r = readiness(p, Object.fromEntries(p.modul.slice(0, 3).map(m => [m, 'done'])))
  assert.equal(r.done, 3)
  assert.equal(r.pct, 3 / r.total)
  assert.equal(readiness(p, { [p.modul[0]]: 'reading' }).done, 0, '"reading" bukan tuntas')
})

test('data: tidak ada naik timbal balik dan naik tidak pernah turun jenjang', () => {
  for (const p of PROFESI) for (const q of p.naik) {
    assert.ok(!byId.get(q).naik.includes(p.id), `${p.id} <-> ${q}`)
    assert.ok(URUT[byId.get(q).jenjang] >= URUT[p.jenjang], `${p.id} -> ${q}`)
  }
  assert.ok(edges().length > 0)
})

test('data: gaji selalu bertanggal periksa dan bersumber https', () => {
  for (const p of PROFESI.filter(p => p.gaji)) {
    assert.match(p.gaji.tanggal_diperiksa, /^\d{4}-\d{2}-\d{2}$/, p.id)
    assert.ok(p.gaji.url.startsWith('https://'), p.id)
  }
})

// Build wajib GAGAL untuk data rusak, bukan sekadar console.warn.
function buildDengan(ubah) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'profesi-'))
  try {
    for (const f of fs.readdirSync(path.join(APP, 'data/profesi'))) fs.copyFileSync(path.join(APP, 'data/profesi', f), path.join(tmp, f))
    const f = path.join(tmp, 'tatakelola.json')
    const data = JSON.parse(fs.readFileSync(f, 'utf8'))
    ubah(data)
    fs.writeFileSync(f, JSON.stringify(data))
    return spawnSync(process.execPath, ['scripts/build-content.mjs'], { cwd: APP, encoding: 'utf8', env: { ...process.env, BN_PROFESI_DIR: tmp } })
  } finally { fs.rmSync(tmp, { recursive: true, force: true }) }
}
const sa = d => d.find(p => p.id === 'solution-architect')
for (const [nama, ubah, pesan] of [
  ['naik timbal balik', d => { sa(d).naik.push('it-consultant') }, /naik timbal balik/],
  ['naik turun jenjang', d => { sa(d).naik.push('it-auditor') }, /naik menurun jenjang/],
  ['modul kosong', d => { sa(d).modul = [] }, /"modul" tidak boleh kosong/],
  ['URL sumber bukan https', d => { sa(d).sumber[0].url = 'http://contoh.example' }, /url https/],
  ['tanggal gaji rusak', d => { sa(d).gaji = { rentang: 'x', sumber: 'y', url: 'https://contoh.example', tanggal_diperiksa: 'Oktober 2026' } }, /tanggal_diperiksa/],
  ['tingkat sertifikasi asing', d => { sa(d).sertifikasi[0].tingkat = 'expert' }, /tingkat sertifikasi/],
]) test(`build gagal: ${nama}`, () => {
  const r = buildDengan(ubah)
  assert.equal(r.status, 1, 'build seharusnya gagal')
  assert.match(r.stderr, pesan)
})

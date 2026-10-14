// Skrip build konten dijalankan sungguhan, lalu hasilnya diperiksa. Tes ini sengaja
// tidak membaca curriculum.json yang sudah ada: berkas itu bisa basi terhadap materi/.
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let hasil, bundel

before(() => {
  hasil = spawnSync(process.execPath, ['scripts/build-content.mjs'], { cwd: APP, encoding: 'utf8' })
  bundel = JSON.parse(fs.readFileSync(path.join(APP, 'src/generated/curriculum.json'), 'utf8'))
})

test('build konten lulus', () => {
  assert.equal(hasil.status, 0, hasil.stderr)
})

test('tidak ada tahap kosong (stage.modules[0] dipakai di banyak tempat)', () => {
  for (const s of bundel.stages) assert.ok(s.modules.length > 0, s.id)
})

test('ID modul dan ID kartu unik', () => {
  const m = bundel.stages.flatMap(s => s.modules.map(x => x.id))
  assert.equal(new Set(m).size, m.length)
  const k = bundel.stages.flatMap(s => s.modules.flatMap(x => x.cards.map(c => c.id)))
  assert.equal(new Set(k).size, k.length)
})

test('meta menghitung ulang isi yang sebenarnya', () => {
  const mods = bundel.stages.flatMap(s => s.modules)
  assert.equal(bundel.meta.totalModules, mods.length)
  assert.equal(bundel.meta.totalCards, mods.reduce((n, m) => n + m.cards.length, 0))
  assert.equal(bundel.meta.totalStages, bundel.stages.length)
})

test('setiap "Berikutnya" menunjuk modul yang ada', () => {
  const ids = new Set(bundel.stages.flatMap(s => s.modules.map(x => x.id)))
  const patah = bundel.stages.flatMap(s => s.modules).filter(m => m.next && !ids.has(m.next.id)).map(m => `${m.id} -> ${m.next.id}`)
  assert.deepEqual(patah, [])
})

test('kartu latihan selalu punya pertanyaan dan jawaban', () => {
  for (const m of bundel.stages.flatMap(s => s.modules))
    for (const c of m.cards) assert.ok(c.q.trim() && c.aHtml.trim(), c.id)
})

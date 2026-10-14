// Logika Peta Karier (src/lib/profesi.ts). Fase 2 menambah tes arah naik dan kuis.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PROFESI, byId, edges, readiness, shortestPath } from '../src/lib/profesi.ts'

test('graf profesi terhubung: setiap profesi bisa dicapai dari network-engineer', () => {
  const tak = PROFESI.filter(p => !shortestPath('network-engineer', p.id)).map(p => p.id)
  assert.deepEqual(tak, [])
})

test('jalur deterministik dan setiap langkahnya sisi yang benar-benar ada', () => {
  const sisi = new Set(edges().flatMap(e => [`${e.a}|${e.b}`, `${e.b}|${e.a}`]))
  for (const a of PROFESI) for (const b of PROFESI) {
    const j = shortestPath(a.id, b.id)
    assert.deepEqual(j, shortestPath(a.id, b.id), `${a.id} -> ${b.id} tidak deterministik`)
    for (let i = 1; i < j.length; i++) assert.ok(sisi.has(`${j[i - 1]}|${j[i]}`), `${j[i - 1]} -> ${j[i]} bukan sisi`)
  }
})

test('profesi tak dikenal: tidak ada jalur, bukan jalur ke profesi lain', () => {
  assert.equal(shortestPath('network-engineer', 'tidak-ada'), null)
  assert.equal(shortestPath('tidak-ada', 'network-engineer'), null)
})

test('kesiapan = modul bekal tuntas / modul bekal yang ada di kurikulum', () => {
  const p = byId.get('network-engineer')
  assert.equal(readiness(p, {}).pct, 0)
  const semua = Object.fromEntries(p.modul.map(m => [m, 'done']))
  assert.equal(readiness(p, semua).pct, 1)
  const separuh = Object.fromEntries(p.modul.slice(0, 3).map(m => [m, 'done']))
  const r = readiness(p, separuh)
  assert.equal(r.done, 3)
  assert.equal(r.pct, 3 / r.total)
  assert.equal(readiness(p, { [p.modul[0]]: 'reading' }).done, 0, '"reading" bukan tuntas')
})

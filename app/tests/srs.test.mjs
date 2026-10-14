import { test } from 'node:test'
import assert from 'node:assert/strict'
import { review, isDue, freshCard, todayStr } from '../src/lib/srs.ts'

test('kartu baru jatuh tempo hari ini', () => {
  assert.equal(isDue(undefined), true)
  assert.equal(isDue(freshCard()), true)
})

test('"Lagi" mengulang hari ini dan menurunkan ease, tapi tidak di bawah 1,3', () => {
  let s = freshCard()
  for (let i = 0; i < 20; i++) s = review(s, 0)
  assert.equal(s.ease, 1.3)
  assert.equal(s.interval, 0)
  assert.equal(s.lapses, 20)
  assert.equal(s.due, todayStr(0))
})

test('interval naik bertahap: 1, 6, lalu dikali ease', () => {
  let s = review(undefined, 2)
  assert.equal(s.interval, 1)
  s = review(s, 2)
  assert.equal(s.interval, 6)
  const ease = s.ease
  s = review(s, 2)
  assert.equal(s.interval, Math.round(6 * ease))
  assert.equal(isDue(s), false)
})

test('"Mudah" pada ulangan pertama melompat ke 3 hari', () => {
  assert.equal(review(undefined, 3).interval, 3)
})

test('todayStr memakai tanggal kalender LOKAL, bukan UTC', t => {
  const tzLama = process.env.TZ
  process.env.TZ = 'Asia/Makassar' // WITA, +08
  // 2026-01-01 17:00 UTC = 2026-01-02 01:00 WITA. Versi UTC lama menjawab "2026-01-01".
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 0, 1, 17, 0) })
  try {
    assert.equal(todayStr(), '2026-01-02')
    assert.equal(todayStr(-1), '2026-01-01')
    assert.equal(todayStr(30), '2026-02-01', 'melintasi akhir bulan')
  } finally {
    t.mock.timers.reset()
    if (tzLama === undefined) delete process.env.TZ; else process.env.TZ = tzLama
  }
})

// Pustaka: data hasil panen, data kurasi, dan logika saring/segi (src/lib/pustaka.ts).
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { TOPIK, TOPIK_TAHAP } from '../src/lib/pustakaTopik.ts'
import { saring, hitungSegi, bacaanUntukTahap, SARINGAN_KOSONG } from '../src/lib/pustaka.ts'
import { panen, AKAR_BAWAAN, kunciUrl } from '../scripts/panen-pustaka.mjs'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR_PANEN = path.join(APP, 'data/pustaka')
const DIR_KURASI = path.join(APP, 'data/pustaka-kurasi')
const bacaJson = p => JSON.parse(fs.readFileSync(p, 'utf8'))
const berkas = dir => fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()
let data, tahapAda

before(() => {
  const r = spawnSync(process.execPath, ['scripts/build-content.mjs'], { cwd: APP, encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  data = bacaJson(path.join(APP, 'src/generated/pustaka.json'))
  tahapAda = new Set(bacaJson(path.join(APP, 'src/generated/curriculum.json')).stages.map(s => s.id))
})

test('pemanen deterministik: memanen ulang memberi berkas yang identik byte demi byte', { skip: !fs.existsSync(AKAR_BAWAAN) && `${AKAR_BAWAAN} tidak ada` }, () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'panen-'))
  try {
    panen(AKAR_BAWAAN, tmp, { diam: true })
    assert.deepEqual(berkas(tmp), berkas(DIR_PANEN))
    for (const f of berkas(tmp))
      assert.equal(fs.readFileSync(path.join(tmp, f), 'utf8'), fs.readFileSync(path.join(DIR_PANEN, f), 'utf8'),
        `${f} berbeda dari hasil panen: berkas data/pustaka/ DIHASILKAN, jangan disunting tangan`)
  } finally { fs.rmSync(tmp, { recursive: true, force: true }) }
})

test('skema setiap butir hasil build lengkap', () => {
  for (const e of data.entri) {
    for (const k of ['id', 'judul', 'url', 'jenis', 'bahasa', 'sumber', 'lisensi']) assert.ok(typeof e[k] === 'string' && e[k], `${e.id}: ${k}`)
    assert.equal(typeof e.boleh_salin, 'boolean', e.id)
    assert.ok(e.topik.length > 0 && e.topik.every(t => TOPIK[t]), `${e.id}: topik`)
    assert.ok(e.tahap.length > 0, `${e.id}: tidak terhubung ke tahap mana pun`)
    assert.ok(e.tahap.every(t => tahapAda.has(t)), `${e.id}: tahap tak dikenal`)
  }
})

test('tidak ada id ganda dan tidak ada URL ganda di seluruh Pustaka', () => {
  const ids = data.entri.map(e => e.id)
  assert.equal(new Set(ids).size, ids.length)
  const urls = data.entri.map(e => kunciUrl(e.url))
  assert.equal(new Set(urls).size, urls.length)
})

test('tidak ada URL ganda dalam satu sumber (data mentah, sebelum digabung)', () => {
  for (const dir of [DIR_PANEN, DIR_KURASI]) for (const f of berkas(dir)) {
    const u = bacaJson(path.join(dir, f)).entri.map(e => kunciUrl(e.url))
    assert.equal(new Set(u).size, u.length, f)
  }
})

test('boleh_salin=false pada data panen hanya berasal dari sumber tautan-saja, dan sebaliknya', () => {
  for (const f of berkas(DIR_PANEN)) {
    const { sumber } = bacaJson(path.join(DIR_PANEN, f))
    assert.equal(sumber.boleh_salin, sumber.lisensi !== 'tautan saja', `${f}: lisensi "${sumber.lisensi}"`)
  }
  const tautanSaja = new Set(data.sumber.filter(s => s.boleh_salin === false).map(s => s.kunci))
  for (const e of data.entri.filter(e => !e.sumber.startsWith('kurasi-')))
    assert.equal(e.boleh_salin, !tautanSaja.has(e.sumber), `${e.id} (${e.sumber})`)
})

test('data kurasi: boleh_salin=true hanya untuk lisensi terbuka, tanggal diperiksa ada', () => {
  const terbuka = /CC BY|CC0|Creative Commons (Attribution|Zero)|MIT|BSD|Apache|domain publik/i
  const tertutup = /\b(NC|ND)\b|NonCommercial|NoDerivatives|tanpa lisensi|tautan saja/i
  for (const f of berkas(DIR_KURASI)) for (const e of bacaJson(path.join(DIR_KURASI, f)).entri) {
    assert.match(e.tanggal_diperiksa, /^\d{4}-\d{2}-\d{2}$/, `${f}: ${e.url}`)
    assert.ok(e.url.startsWith('https://'), `${f}: ${e.url} bukan https`)
    if (e.boleh_salin) assert.ok(terbuka.test(e.lisensi) && !tertutup.test(e.lisensi), `${f}: ${e.url} "${e.lisensi}"`)
    if (tertutup.test(e.lisensi)) assert.equal(e.boleh_salin, false, `${f}: ${e.url}`)
  }
})

test('CC BY-SA dari coding-interview-university tinggal di berkasnya sendiri', () => {
  const ciu = bacaJson(path.join(DIR_PANEN, 'ciu.json'))
  assert.equal(ciu.sumber.lisensi_berkas, 'CC BY-SA 4.0')
  for (const f of berkas(DIR_PANEN).filter(f => f !== 'ciu.json'))
    assert.ok(!bacaJson(path.join(DIR_PANEN, f)).entri.some(e => e.id.startsWith('ciu-')), f)
})

test('TOPIK_TAHAP: setiap topik punya baris, setiap tahap yang ditunjuk ada', () => {
  assert.deepEqual(Object.keys(TOPIK).sort(), Object.keys(TOPIK_TAHAP).sort())
  for (const [t, st] of Object.entries(TOPIK_TAHAP)) for (const x of st) assert.ok(tahapAda.has(x), `${t} -> ${x}`)
})

test('jumlah segi jujur: angka di samping sebuah nilai = banyaknya hasil kalau HANYA nilai itu yang dipilih di segi tersebut', () => {
  // Di dalam satu segi pilihan bersifat ATAU, jadi pembandingnya mengganti pilihan
  // segi itu dengan nilai tunggal, sementara segi lain dan kueri tetap.
  const contoh = [SARINGAN_KOSONG, { ...SARINGAN_KOSONG, q: 'bgp' }, { ...SARINGAN_KOSONG, bahasa: ['id'] },
    { ...SARINGAN_KOSONG, jenis: ['video'], tahap: ['05-transport'] }]
  for (const s of contoh) for (const segi of ['jenis', 'bahasa', 'sumber', 'tahap'])
    for (const [v, n] of hitungSegi(data.entri, s, segi))
      assert.equal(n, saring(data.entri, { ...s, [segi]: [v] }).length, `${JSON.stringify(s)} ${segi}=${v}`)
})

test('Indonesia tampil lebih dulu di hasil tanpa saringan', () => {
  const h = saring(data.entri, SARINGAN_KOSONG)
  const pertamaEn = h.findIndex(e => e.bahasa === 'en')
  assert.ok(h.slice(pertamaEn).every(e => e.bahasa === 'en'))
})

test('setiap tahap belajar mendapat 4-6 bacaan lanjutan', () => {
  for (const t of tahapAda) {
    if (t === 'panduan') continue
    const b = bacaanUntukTahap(data.entri, t)
    assert.ok(b.length >= 4 && b.length <= 6, `${t}: ${b.length}`)
    assert.equal(new Set(b.map(e => e.id)).size, b.length)
  }
})

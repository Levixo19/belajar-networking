// Validator data/kasus (Intinya, Kasus nyata, Tantangan) dan data/misi (simulasi
// troubleshooting) di scripts/build-content.mjs: data rusak MENGGAGALKAN build, bukan
// console.warn. Kasus tanpa sumber https bukan kasus nyata, tanggal tidak boleh di masa
// depan, prosa bebas em-dash dan emoji, dan setiap misi harus bisa dipecahkan.
// Data rusak hanya ditulis ke SALINAN di direktori sementara (BN_KASUS_DIR, BN_MISI_DIR).
import { test, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bangun = env => spawnSync(process.execPath, ['scripts/build-content.mjs'], { cwd: APP, encoding: 'utf8', env: { ...process.env, ...env } })

/** Salin data/<jenis> ke direktori sementara, ubah berkas pertama, lalu bangun dengannya. */
function bangunDengan(jenis, ubah) {
  const asal = path.join(APP, 'data', jenis)
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `bn-${jenis}-`))
  try {
    const berkas = fs.readdirSync(asal).filter(f => f.endsWith('.json')).sort()
    for (const f of berkas) fs.copyFileSync(path.join(asal, f), path.join(tmp, f))
    const baca = f => JSON.parse(fs.readFileSync(path.join(tmp, f), 'utf8'))
    const data = baca(berkas[0])
    ubah(data, baca(berkas[1]))
    fs.writeFileSync(path.join(tmp, berkas[0]), JSON.stringify(data))
    return bangun({ [jenis === 'kasus' ? 'BN_KASUS_DIR' : 'BN_MISI_DIR']: tmp })
  } finally { fs.rmSync(tmp, { recursive: true, force: true }) }
}

// Build yang gagal di tengah (misi) sudah sempat menulis curriculum.json; build yang lulus
// dengan data uji menulis misi.json versi uji. Bangun ulang dari data asli sesudahnya.
after(() => { assert.equal(bangun({}).status, 0, 'build ulang dari data asli gagal') })

const pertama = d => d[Object.keys(d).find(k => !k.startsWith('_'))]
for (const [nama, ubah, pesan] of [
  ['em-dash di prosa', d => { pertama(d).intinya.satu_kalimat += ' — tambahan' }, /memuat em-dash, en-dash, atau emoji/],
  ['emoji di judul kasus', d => { pertama(d).kasus.judul += ' \u{1F680}' }, /memuat em-dash, en-dash, atau emoji/],
  ['kasus tanpa sumber', d => { pertama(d).kasus.sumber = [] }, /kasus tanpa sumber bukan kasus nyata/],
  ['sumber bukan https', d => { pertama(d).kasus.sumber[0].url = 'http://contoh.example/laporan' }, /sumber\.url harus https/],
  ['sumber lewat penyingkat tautan', d => { pertama(d).kasus.sumber[0].url = 'https://bit.ly/abc' }, /domain dilarang/],
  ['peristiwa di masa depan', d => { pertama(d).kasus.kapan = '2999-01-01' }, /kasus\.kapan .* tidak di masa depan/],
  ['diperiksa di masa depan', d => { pertama(d).kasus.diperiksa = '2999-01-01' }, /kasus\.diperiksa .* tidak di masa depan/],
  ['modul tidak ada', d => { d['99-tidak-ada/01-contoh'] = structuredClone(pertama(d)) }, /modul tidak ada di kurikulum/],
  ['satu modul diisi dua berkas', (d, lain) => { d[Object.keys(lain).find(k => !k.startsWith('_'))] = structuredClone(pertama(d)) }, /ganda \(sudah diisi berkas lain\)/],
  ['tantangan tanpa petunjuk', d => { pertama(d).tantangan.petunjuk = [] }, /tantangan\.petunjuk harus 1-4 butir/],
]) test(`kasus: build gagal untuk ${nama}`, () => {
  const r = bangunDengan('kasus', ubah)
  assert.equal(r.status, 1, 'build seharusnya gagal')
  assert.match(r.stderr, pesan)
})

for (const [nama, ubah, pesan] of [
  ['dua dugaan benar', d => { for (const x of d[0].dugaan) x.benar = true }, /dugaan benar harus tepat satu/],
  ['tanpa langkah pengecoh', d => { for (const l of d[0].langkah) l.berguna = true }, /minimal 2 langkah pengecoh/],
  ['langkah di perangkat yang tidak ada di topologi', d => { d[0].langkah[0].perangkat = 'TIDAK-ADA' }, /bukan simpul topologi/],
  ['sisi topologi ke simpul yang tidak ada', d => { d[0].topologi.sisi[0].ke = 'TIDAK-ADA' }, /menunjuk simpul yang tidak ada/],
  ['modul tidak ada', d => { d[0].modul = ['99-tidak-ada/01-contoh'] }, /modul "99-tidak-ada\/01-contoh" tidak ada/],
  ['id ganda', d => { d.push(structuredClone(d[0])) }, /id ganda/],
  ['em-dash di briefing', d => { d[0].briefing += ' — tambahan' }, /"briefing" memuat em-dash/],
  // Kesalahan paling mungkin saat mengetik koordinat: lintang dan bujur tertukar.
  ['lintang dan bujur tertukar', d => { d[0].lokasi = { kota: 'Medan', lat: 98.674, lon: 3.589 } }, /lokasi harus \{kota, lat/],
]) test(`misi: build gagal untuk ${nama}`, () => {
  const r = bangunDengan('misi', ubah)
  assert.equal(r.status, 1, 'build seharusnya gagal')
  assert.match(r.stderr, pesan)
})

test('misi: keluaran perangkat boleh memuat apa saja yang dicetak perangkat sungguhan', () => {
  // Contoh: garis pemisah tabel atau nama antarmuka yang memuat tanda pisah.
  const r = bangunDengan('misi', d => { d[0].langkah[0].keluaran += '\n—— akhir keluaran ——' })
  assert.equal(r.status, 0, r.stderr)
})

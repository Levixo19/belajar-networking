// Planisfer kurikulum (src/lib/langit.ts): peta langit DIHITUNG dari kurikulum, jadi
// sifatnya bisa diperiksa tanpa browser. Deterministik (dasbor, kepala modul, dan menu
// Kurikulum menggambar langit yang sama), setiap bintang ada di sektor jam tahapnya,
// garis rasi tidak bersilang, dan nama rasi tidak masuk ke lingkar Lab di dekat pusat.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { bangunLangit, bintangTerdekat, jamTahap, pohonRentang } from '../src/lib/langit.ts'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const KUR = path.join(APP, 'src/generated/curriculum.json')
if (!fs.existsSync(KUR)) spawnSync(process.execPath, ['scripts/build-content.mjs'], { cwd: APP })
const { stages } = JSON.parse(fs.readFileSync(KUR, 'utf8'))
const TAHAP = stages.map(s => ({ id: s.id, title: s.title, modules: s.modules.map(m => ({ id: m.id, num: m.num, title: m.title, words: m.words })) }))
const langit = bangunLangit(TAHAP)

const jari = p => Math.hypot(p.x, p.y)
/** Sudut searah jarum jam dari atas, 0..360 (kebalikan kutubKeXY). */
const sudut = p => (Math.atan2(p.x, -p.y) * 180 / Math.PI + 360) % 360
/** Panjang perkiraan nama rasi dalam satuan peta, rumus yang sama dengan bangunLangit. */
const panjangNama = nama => nama.length * 0.0175

test('deterministik: kurikulum yang sama memberi langit yang sama', () => {
  assert.deepEqual(bangunLangit(TAHAP), langit)
})

test('setiap tahap bernomor jadi satu rasi pada jamnya, setiap modulnya jadi satu bintang', () => {
  const bernomor = TAHAP.filter(t => jamTahap(t.id) !== null)
  assert.equal(bernomor.length, 24, 'planisfer dirancang untuk tepat 24 tahap bernomor (00 sampai 23)')
  for (const t of bernomor) {
    const r = langit.rasi.find(x => x.id === t.id)
    assert.ok(r, `${t.id} tidak punya rasi`)
    assert.equal(r.jam, jamTahap(t.id))
    assert.deepEqual(r.bintang.map(b => b.id), t.modules.map(m => m.id), `${t.id}: bintang tidak sama dengan modulnya`)
  }
  const lab = TAHAP.find(t => t.id === 'lab')
  assert.equal(langit.bintang.length, bernomor.reduce((n, t) => n + t.modules.length, 0) + (lab?.modules.length ?? 0))
})

test('bintang di dalam piringan dan lebih dekat ke sektornya sendiri daripada sektor mana pun', () => {
  const salah = []
  for (const r of langit.rasi.filter(r => r.jam !== null)) for (const b of r.bintang) {
    if (jari(b) > 0.97) salah.push(`${b.id} keluar piringan (r=${jari(b).toFixed(3)})`)
    // Pusat sektor terdekat (jarak sudut melingkar) harus sektor tahapnya sendiri.
    const a = sudut(b)
    const terdekat = langit.rasi.filter(x => x.jam !== null)
      .map(x => ({ id: x.id, d: Math.abs(((a - x.sudut + 540) % 360) - 180) }))
      .sort((p, q) => p.d - q.d)[0]
    if (terdekat.id !== r.id) salah.push(`${b.id} di ${a.toFixed(1)} derajat terbaca sebagai rasi ${terdekat.id}`)
  }
  assert.deepEqual(salah, [])
})

/** Dua ruas bersilang di bagian dalam (ujung bersama tidak dihitung). */
function bersilang(p1, p2, p3, p4) {
  const arah = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
  const d1 = arah(p3, p4, p1), d2 = arah(p3, p4, p2), d3 = arah(p1, p2, p3), d4 = arah(p1, p2, p4)
  return d1 * d2 < 0 && d3 * d4 < 0
}

test('garis rasi = pohon rentang: n-1 garis, semua bintang terhubung, tidak ada yang bersilang', () => {
  for (const r of langit.rasi) {
    const n = r.bintang.length
    assert.equal(r.garis.length, Math.max(0, n - 1), r.id)
    const induk = [...Array(n).keys()]
    const akar = i => (induk[i] === i ? i : (induk[i] = akar(induk[i])))
    for (const [i, j] of r.garis) induk[akar(i)] = akar(j)
    assert.equal(new Set(r.bintang.map((_, i) => akar(i))).size, Math.min(1, n), `${r.id} tidak terhubung`)
    for (let a = 0; a < r.garis.length; a++) for (let b = a + 1; b < r.garis.length; b++) {
      const [i, j] = r.garis[a], [k, l] = r.garis[b]
      if (new Set([i, j, k, l]).size < 4) continue
      assert.ok(!bersilang(r.bintang[i], r.bintang[j], r.bintang[k], r.bintang[l]), `${r.id}: garis ${i}-${j} memotong ${k}-${l}`)
    }
  }
})

test('pohonRentang: kasus tepi', () => {
  assert.deepEqual(pohonRentang([]), [])
  assert.deepEqual(pohonRentang([{ x: 0, y: 0 }]), [])
  assert.deepEqual(pohonRentang([{ x: 0, y: 0 }, { x: 1, y: 0 }]), [[0, 1]])
})

test('nama rasi tidak masuk lingkar Lab (r < 0,3) dan tidak menabrak cincin jam (r > 0,97)', () => {
  const salah = []
  for (const r of langit.rasi.filter(r => r.labelArah)) {
    const awal = jari(r.label)
    const ujung = r.labelArah === 'luar' ? awal + panjangNama(r.nama) : awal - panjangNama(r.nama)
    for (const [nama, v] of [['jangkar', awal], ['ujung', ujung]]) if (v < 0.3 || v > 0.97) salah.push(`${r.id} ${nama} r=${v.toFixed(3)}`)
  }
  assert.deepEqual(salah, [])
})

test('bintangTerdekat: bintang di bawah kursor ditemukan, ruang kosong memberi null', () => {
  const b = langit.bintang[Math.floor(langit.bintang.length / 2)]
  assert.equal(bintangTerdekat(langit.bintang, b.x + 0.002, b.y - 0.002, 0.02)?.id, b.id)
  // Kutub (pusat) adalah bintang Panduan, bukan bintang modul; lingkar Lab ada di r 0,13-0,17.
  assert.equal(bintangTerdekat(langit.bintang, 0, 0, 0.05), null)
})

test('jamTahap: hanya tahap 00-23 yang punya jam', () => {
  assert.equal(jamTahap('00-fondasi'), 0)
  assert.equal(jamTahap('23-jalur-vendor'), 23)
  for (const id of ['lab', 'panduan', 'referensi', '24-tahap-baru']) assert.equal(jamTahap(id), null, id)
})

test('magnitudo mengikuti panjang modul', () => {
  const urut = TAHAP.flatMap(t => t.modules).sort((a, b) => a.words - b.words)
  const r = id => langit.bintang.find(b => b.id === id)?.r
  const pendek = urut.find(m => r(m.id)), panjang = urut.findLast(m => r(m.id))
  assert.ok(r(panjang.id) > r(pendek.id), `${panjang.id} (${panjang.words} kata) tidak lebih terang dari ${pendek.id} (${pendek.words} kata)`)
})

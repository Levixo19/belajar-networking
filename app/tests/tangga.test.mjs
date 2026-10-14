// Tangga Peta Karier (src/lib/tanggaKarier.ts): tidak ada garis yang menembus huruf
// atau simpul, untuk SETIAP profesi sebagai fokus. Di sini ukuran label diperkirakan
// (lebar huruf rata-rata); pemeriksaan di browser mengulang hitungan yang sama
// dengan getBBox sungguhan.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PROFESI, RUMPUN, LABEL_GRAF, byId, neighbors, edges } from '../src/lib/profesi.ts'
import { tataLetak, titikGaris, tabrakan, ujungPerkiraan, awalLabel, UJUNG_LABEL_MAKS, KIRI, LANGKAH, BANTALAN, BARIS_MIN } from '../src/lib/tanggaKarier.ts'

const { pos, baris } = tataLetak(PROFESI, RUMPUN)
const label = id => LABEL_GRAF[id] ?? byId.get(id).nama
const jenis = new Map(edges().flatMap(e => [[`${e.a}|${e.b}`, e.kind], [`${e.b}|${e.a}`, e.kind]]))

/** Garis untuk satu fokus, persis aturan komponen: cuma tetangga beda kolom. */
function garisUntuk(fokus) {
  const out = []
  for (const lain of neighbors(fokus)) {
    const a = pos.get(fokus), b = pos.get(lain)
    if (a.kolom === b.kolom) continue
    const [kiri, kanan] = a.kolom < b.kolom ? [fokus, lain] : [lain, fokus]
    const geser = jenis.get(`${fokus}|${lain}`) === 'naik' ? 0 : -8
    out.push({ dari: kiri, ke: kanan, titik: titikGaris(pos.get(kiri), ujungPerkiraan(pos.get(kiri), label(kiri)), pos.get(kanan), baris[pos.get(kanan).baris], geser) })
  }
  return out
}
const kotakLabel = PROFESI.map(p => {
  const t = pos.get(p.id)
  return { id: p.id, x: awalLabel(t) - 1, y: t.y - 8, w: ujungPerkiraan(t, label(p.id)) - awalLabel(t) + 2, h: 16 }
})
const simpul = PROFESI.map(p => ({ id: p.id, ...pos.get(p.id) }))

test('setiap profesi punya tempat, dan tidak ada dua simpul berimpit', () => {
  assert.equal(pos.size, PROFESI.length)
  const titik = new Set([...pos.values()].map(t => `${t.x}|${t.y}`))
  assert.equal(titik.size, PROFESI.length)
})

test('tinggi baris dihitung dari sel terpadatnya', () => {
  for (const b of baris) {
    const terpadat = Math.max(...[0, 1, 2].map(k => PROFESI.filter(p => p.rumpun === b.id && pos.get(p.id).kolom === k).length))
    assert.equal(b.tinggi, Math.max(BARIS_MIN, terpadat * LANGKAH + BANTALAN), b.id)
  }
})

test('setiap label muat di kolomnya dan tidak menyentuh talang', () => {
  for (const p of PROFESI) {
    const t = pos.get(p.id)
    assert.ok(label(p.id).length <= 24, `${p.id}: label "${label(p.id)}" lebih dari 24 huruf`)
    assert.ok(ujungPerkiraan(t, label(p.id)) <= UJUNG_LABEL_MAKS(t.kolom), `${p.id}: label menyentuh talang`)
  }
})

test('nama rumpun yang dibungkus dua baris muat di kolom label', () => {
  for (const r of RUMPUN) {
    const kata = r.label.split(' ')
    // Dibungkus di batas kata terdekat dari tengah, sama seperti komponennya.
    let terbaik = Infinity
    for (let i = 1; i <= kata.length; i++) terbaik = Math.min(terbaik, Math.max(kata.slice(0, i).join(' ').length, kata.slice(i).join(' ').length))
    assert.ok(terbaik * 7.6 <= KIRI - 40, `${r.id}: "${r.label}" terlalu panjang untuk dua baris`)
  }
})

test('tidak ada garis yang menembus label atau simpul, untuk setiap profesi sebagai fokus', () => {
  const kena = PROFESI.flatMap(p => tabrakan(garisUntuk(p.id), kotakLabel, simpul))
  assert.deepEqual(kena, [])
})

test('profesi berderajat tertinggi benar-benar punya garis yang diperiksa', () => {
  for (const id of ['solution-architect', 'network-engineer', 'it-operations-manager'])
    assert.ok(garisUntuk(id).length >= 4, `${id}: ${garisUntuk(id).length} garis`)
})

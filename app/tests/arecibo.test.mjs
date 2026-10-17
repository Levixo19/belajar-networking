// Pesan Arecibo (src/tools/arecibo.ts): deret bitnya diperiksa dengan MENDEKODE isinya, bukan
// dengan membandingkan ke salinan lain. Angka 1 sampai 10, nomor atom, rumus kimia DNA, dan
// angka-angka besarnya harus keluar persis seperti yang diterbitkan (abstrak Icarus 1975,
// keterangan Arecibo Observatory, Wikipedia). Satu bit salah di bagian itu langsung ketahuan.
// Selain itu: faktor 1.679, susunan per lebar, dan garis anotasi yang tidak menembus gambar.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PESAN, PANJANG, LEBAR_GAMBAR, TINGGI_GAMBAR, BAGIAN,
  faktorPrima, pembagi, susun, potonganNyala, bacaLebar, keterangan, deskripsi, tinggiLabel,
} from '../src/tools/arecibo.ts'

const G = susun(PESAN, LEBAR_GAMBAR).baris
const nyala = (kolom, baris) => G[baris][kolom] === '1'
/** Angka tegak: bit di `kolom` dari baris r0 sampai r1, bit terbesar di atas. */
const tegak = (kolom, r0, r1) => parseInt(G.slice(r0, r1 + 1).map(r => r[kolom]).join(''), 2)

test('1.679 bit, hanya 0 dan 1, dan 397 di antaranya bernilai 1 (sama dengan ketiga sumber)', () => {
  assert.equal(PESAN.length, 1679)
  assert.equal(PANJANG, 1679)
  assert.match(PESAN, /^[01]+$/)
  assert.equal([...PESAN].filter(b => b === '1').length, 397)
  assert.equal(LEBAR_GAMBAR * TINGGI_GAMBAR, PANJANG)
})

test('faktor: 1.679 = 23 × 73, keduanya prima, dan pembaginya hanya 1, 23, 73, 1.679', () => {
  assert.deepEqual(faktorPrima(1679), [23, 73])
  assert.deepEqual(faktorPrima(23), [23])
  assert.deepEqual(faktorPrima(73), [73])
  assert.deepEqual(pembagi(1679), [1, 23, 73, 1679])
  // Kasus umum supaya fungsinya tidak cuma benar untuk 1.679.
  assert.deepEqual(faktorPrima(12), [2, 2, 3])
  assert.deepEqual(faktorPrima(1), [])
  assert.deepEqual(pembagi(36), [1, 2, 3, 4, 6, 9, 12, 18, 36])
  assert.deepEqual(pembagi(1), [1])
  // Dari semua lebar yang mungkin, hanya empat yang pas tanpa sisa.
  const pas = []
  for (let l = 1; l <= PANJANG; l++) if (bacaLebar(l).sisa === 0) pas.push(l)
  assert.deepEqual(pas, [1, 23, 73, 1679])
})

test('baris atas: angka 1 sampai 10 dalam biner tegak, penanda awal angka di baris ke-4', () => {
  assert.equal(G[0], '00000010101010000000000')
  const penanda = [...G[3]].flatMap((b, k) => (b === '1' ? [k] : []))
  assert.equal(penanda.length, 10)
  // Angka 1 sampai 7 muat dalam tiga bit. 8, 9, dan 10 meminjam kolom kanannya (bagian tinggi).
  const angka = penanda.map((k, i) => {
    const akhir = penanda[i + 1] ?? LEBAR_GAMBAR
    let nilai = 0
    for (let j = k; j < akhir; j++) nilai += tegak(j, 0, 2) << (3 * (j - k))
    return nilai
  })
  assert.deepEqual(angka, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
})

test('nomor atom hidrogen, karbon, nitrogen, oksigen, fosfor: 1, 6, 7, 8, 15', () => {
  assert.deepEqual([9, 10, 11, 12, 13].map(k => tegak(k, 5, 8)), [1, 6, 7, 8, 15])
  assert.equal(G[9].slice(9, 14), '11111', 'penanda di bawah kelima angka')
})

test('rumus kimia nukleotida: [H, C, N, O, P] untuk gula, fosfat, dan empat basa', () => {
  const rumus = (r0, k0) => [0, 1, 2, 3, 4].map(i => tegak(k0 + i, r0, r0 + 2))
  const DEOKSIRIBOSA = [7, 5, 0, 1, 0], FOSFAT = [0, 0, 0, 4, 1]
  assert.deepEqual([0, 6, 12, 18].map(k => rumus(11, k)), [DEOKSIRIBOSA, [4, 5, 5, 0, 0], [5, 5, 2, 2, 0], DEOKSIRIBOSA], 'deoksiribosa, adenin, timin, deoksiribosa')
  assert.deepEqual([0, 18].map(k => rumus(16, k)), [FOSFAT, FOSFAT])
  assert.deepEqual([0, 6, 12, 18].map(k => rumus(21, k)), [DEOKSIRIBOSA, [4, 4, 3, 1, 0], [4, 5, 5, 1, 0], DEOKSIRIBOSA], 'deoksiribosa, sitosin, guanin, deoksiribosa')
  assert.deepEqual([0, 18].map(k => rumus(26, k)), [FOSFAT, FOSFAT])
})

test('angka besar: pasangan basa 4.294.441.822, tinggi 14, penduduk 4.292.853.750, diameter 2.430', () => {
  // Batang DNA: kolom kanan dulu dari atas ke bawah, lalu kolom kiri. Penanda di bawah kolom kiri.
  const kanan = G.slice(26, 42).map(r => r[11]).join(''), kiri = G.slice(26, 42).map(r => r[10]).join('')
  assert.equal(parseInt(kanan + kiri, 2), 4294441822)
  assert.ok(nyala(10, 42) && !nyala(11, 42))
  // Tinggi manusia: penanda di kolom 0, bit terkecil di kolom 1, membesar ke kanan.
  assert.equal(G[50].slice(0, 5), '10111')
  assert.equal(parseInt([...G[50].slice(1, 5)].reverse().join(''), 2), 14)
  // Penduduk: penanda di kiri atas, bit membesar ke kanan lalu ke bawah.
  assert.ok(nyala(16, 48))
  const penduduk = G.slice(48, 54).map(r => r.slice(17, 23)).join('')
  assert.equal(parseInt([...penduduk].reverse().join(''), 2), 4292853750)
  // Diameter teleskop: dua baris di dasar gambar, penanda di kanan bawah.
  assert.equal(parseInt(G[71].slice(7, 13) + G[72].slice(7, 13), 2), 2430)
  assert.ok(nyala(13, 72))
})

test('Tata Surya: Matahari 3 × 3 petak, sembilan planet, hanya Bumi yang dinaikkan', () => {
  for (let r = 56; r <= 58; r++) for (let k = 2; k <= 4; k++) assert.ok(nyala(k, r), `Matahari ${k},${r}`)
  const planet = [6, 8, 10, 12, 14, 16, 18, 20, 22]
  const puncak = planet.map(k => [56, 57, 58, 59].find(r => nyala(k, r)))
  assert.deepEqual(puncak, [57, 57, 56, 57, 57, 57, 57, 57, 57], 'planet ke-3 satu baris lebih tinggi')
})

test('struktur tegak terkuat muncul di lebar 23, bukan di lebar lain', () => {
  // Bagian petak 1 yang tetangga bawahnya juga 1. Gambar punya banyak garis tegak; derau tidak.
  const skor = l => {
    let n = 0, s = 0
    for (let i = 0; i + l < PANJANG; i++) if (PESAN[i] === '1') { n++; if (PESAN[i + l] === '1') s++ }
    return s / n
  }
  let terbaik = 2
  for (let l = 2; l <= 200; l++) if (skor(l) > skor(terbaik)) terbaik = l
  assert.equal(terbaik, 23)
  assert.ok(skor(23) > skor(73) * 1.8, 'susunan 73 kolom tidak membentuk gambar')
})

test('susun: baris terakhir pendek, sisa = 1.679 mod lebar, urutan bit tidak berubah', () => {
  for (const l of [1, 7, 22, 23, 24, 46, 73, 100, 1679]) {
    const s = susun(PESAN, l)
    assert.equal(s.baris.join(''), PESAN, `lebar ${l}`)
    assert.equal(s.sisa, PANJANG % l)
    assert.equal(s.penuh, Math.floor(PANJANG / l))
    assert.ok(s.baris.slice(0, s.penuh).every(r => r.length === l))
    assert.equal(s.baris.length, s.penuh + (s.sisa ? 1 : 0))
    if (s.sisa) assert.equal(s.baris.at(-1).length, s.sisa)
  }
  assert.equal(susun(PESAN, 22).sisa, 7)
  assert.equal(susun(PESAN, 0).lebar, 1, 'lebar tak sah dijepit ke 1')
})

test('potonganNyala: tepat 397 petak, tiap potongan di dalam barisnya dan hanya berisi 1', () => {
  for (const l of [1, 5, 22, 23, 73, 97, 1679]) {
    const s = susun(PESAN, l)
    const pot = potonganNyala(s)
    assert.equal(pot.reduce((n, [, , p]) => n + p, 0), 397, `lebar ${l}`)
    for (const [x, y, p] of pot) {
      assert.ok(x + p <= s.baris[y].length)
      assert.match(s.baris[y].slice(x, x + p), /^1+$/)
      assert.notEqual(s.baris[y][x + p], '1', 'potongan berhenti di petak 0 atau ujung baris')
    }
  }
})

test('bacaLebar: gambar hanya di 23; pas di 1, 73, 1.679; ganda di kelipatan 23; miring di dekat 23', () => {
  assert.equal(bacaLebar(23).hasil, 'gambar')
  for (const l of [1, 73, 1679]) assert.equal(bacaLebar(l).hasil, 'pas', `lebar ${l}`)
  assert.deepEqual([46, 69, 92].map(l => [bacaLebar(l).hasil, bacaLebar(l).n]), [['ganda', 2], ['ganda', 3], ['ganda', 4]])
  assert.deepEqual([19, 22, 24, 27].map(l => [bacaLebar(l).hasil, bacaLebar(l).n]), [['miring', 4], ['miring', 1], ['miring', 1], ['miring', 4]])
  assert.equal(bacaLebar(16).hasil, 'derau')
  assert.equal(bacaLebar(115).hasil, 'derau', '5 × 23 sudah terlalu gepeng untuk disebut gambar')
  const b = bacaLebar(16)
  assert.deepEqual([b.penuh, b.sisa, b.baris], [104, 15, 105])
})

test('teks: angka berformat Indonesia, tanpa tanda pisah panjang', () => {
  assert.equal(keterangan(bacaLebar(23)).ringkas, 'Lebar 23. 73 baris, tanpa sisa. Gambar muncul.')
  assert.equal(keterangan(bacaLebar(22)).ringkas, 'Lebar 22. 76 baris penuh, sisa 7 bit. Belum ada gambar.')
  assert.match(keterangan(bacaLebar(1679)).ringkas, /^Lebar 1\.679\. 1 baris, tanpa sisa\./)
  assert.match(deskripsi(bacaLebar(23)), /angka 1 sampai 10/)
  assert.match(deskripsi(bacaLebar(46)), /2 salinan gambar/)
  const semua = [
    ...BAGIAN.flatMap(b => [b.judul, b.nilai, b.isi]),
    ...Array.from({ length: 200 }, (_, i) => i + 1).concat(1679).flatMap(l => {
      const k = keterangan(bacaLebar(l))
      return [k.ringkas, k.rinci, deskripsi(bacaLebar(l))]
    }),
  ]
  for (const t of semua) assert.doesNotMatch(t, /[\u2013\u2014]/, t) // tanda pisah pendek dan panjang
})

test('anotasi: kotak pas dengan gambar, garis datar hanya melewati petak 0, label tidak bertumpuk', () => {
  assert.equal(new Set(BAGIAN.map(b => b.id)).size, BAGIAN.length)
  for (const b of BAGIAN) {
    const [k0, r0, k1, r1] = b.kotak
    assert.ok(k0 >= 0 && k1 < LEBAR_GAMBAR && r0 >= 0 && r1 < TINGGI_GAMBAR && k0 <= k1 && r0 <= r1, b.id)
    // Kotak = batas petak 1 di dalamnya, tidak lebih longgar: salah ketik koordinat ketahuan.
    const isi = []
    for (let r = r0; r <= r1; r++) for (let k = k0; k <= k1; k++) if (nyala(k, r)) isi.push([k, r])
    assert.ok(isi.length > 0, `${b.id} kosong`)
    assert.deepEqual([Math.min(...isi.map(p => p[0])), Math.min(...isi.map(p => p[1])), Math.max(...isi.map(p => p[0])), Math.max(...isi.map(p => p[1]))], b.kotak, `${b.id}: kotak tidak rapat`)
    if (b.titik) {
      const [k, r] = b.titik
      assert.ok(nyala(k, r), `${b.id}: titik harus menunjuk petak bernilai 1`)
      assert.ok(k >= k0 && k <= k1 && r >= r0 && r <= r1, `${b.id}: titik di luar kotaknya`)
      const lewat = b.sisi === 'kanan' ? G[r].slice(k + 1) : G[r].slice(0, k)
      assert.match(lewat, /^0*$/, `${b.id}: garis ke ${b.sisi} menembus gambar di baris ${r}`)
    }
  }
  for (const sisi of ['kiri', 'kanan']) {
    const y = BAGIAN.filter(b => b.sisi === sisi).map(tinggiLabel).sort((a, b) => a - b)
    // Satu label = judul + nilai, sekitar 3,6 petak tingginya pada ukuran huruf di arecibo.css.
    for (let i = 1; i < y.length; i++) assert.ok(y[i] - y[i - 1] >= 4, `label ${sisi} terlalu rapat: ${y[i - 1]} dan ${y[i]}`)
    assert.ok(y[0] >= 1.5 && y.at(-1) <= TINGGI_GAMBAR - 1, `label ${sisi} keluar dari tinggi gambar`)
  }
})

// Langit sungguhan (src/lib/langitNyata.ts + data/langit/bintang-hyg.json). Waktu sideris
// dan ketinggian dibandingkan dengan IAU SOFA, proyeksinya dengan kutubKeXY di langit.ts,
// cakrawala dan status tampak dengan rumus vektor yang ditulis terpisah di berkas ini,
// dan datanya dengan syarat lisensi CC BY-SA 4.0 dari HYG.
//
// Nilai acuan SOFA: nilai uji iauGmst82 di t_sofa_c.c (rilis 2023-10-11,
// https://www.iausofa.org/2023-10-11c), lalu iauGmst82 dan iauAtco13 dari rilis yang sama,
// dikompilasi dan dijalankan lokal pada 2026-10-17 untuk tanggal-tanggal di bawah.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DEC_TEPI, cakrawala, jariDeklinasi, keXY, ketinggian, langitMalamIni, lokasiPengamat, waktuSiderisLokal,
} from '../src/lib/langitNyata.ts'
import { kutubKeXY } from '../src/lib/langit.ts'
import { todayStr } from '../src/lib/srs.ts'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BERKAS = path.join(APP, 'data/langit/bintang-hyg.json')
const { _sumber: SUMBER, bintang: BINTANG } = JSON.parse(fs.readFileSync(BERKAS, 'utf8'))

const RAD = Math.PI / 180
const jari = p => Math.hypot(p.x, p.y)
/** Selisih dua jam pada lingkaran 24 jam. */
const selisihJam = (a, b) => Math.abs(((a - b) % 24 + 36) % 24 - 12)

/** Ketinggian lewat hasil kali titik dua vektor satuan, terpisah dari rumus modul:
 *  sin(tinggi) = arah bintang . arah zenit, dan zenit berada di ra = LST, dec = lintang. */
function tinggiVektor(raJam, decDer, lstJam, lintangDer) {
  const a = raJam * 15 * RAD, d = decDer * RAD, t = lstJam * 15 * RAD, f = lintangDer * RAD
  const s = Math.cos(d) * Math.cos(a) * Math.cos(f) * Math.cos(t) + Math.cos(d) * Math.sin(a) * Math.cos(f) * Math.sin(t) + Math.sin(d) * Math.sin(f)
  return Math.asin(Math.max(-1, Math.min(1, s))) / RAD
}
/** Kebalikan proyeksi, ditulis ulang dari definisinya: sudut searah jarum jam dari atas = ra x 15,
 *  r = (90 - dec) / (90 - DEC_TEPI). */
function dariXY({ x, y }) {
  return { ra: ((Math.atan2(x, -y) / RAD + 360) % 360) / 15, dec: 90 - Math.hypot(x, y) * (90 - DEC_TEPI) }
}
/** Baris data terdekat dari posisi katalog (toleransi pembulatan berkas). */
function cari(ra, dec) {
  const b = BINTANG.find(([r, d]) => Math.abs(r - ra) < 2e-3 && Math.abs(d - dec) < 2e-2)
  assert.ok(b, `tidak ada bintang di ra ${ra}, dec ${dec}`)
  return b
}

// ---------- waktu sideris

test('GMST sama dengan nilai uji resmi iauGmst82 di IAU SOFA (2006-01-01 00.00 UT1)', () => {
  // t_sofa_c.c: iauGmst82(2400000.5, 53736.0) = 1.754174981860675096 rad.
  const harap = 1.754174981860675096 * 12 / Math.PI
  assert.ok(selisihJam(waktuSiderisLokal(new Date(Date.UTC(2006, 0, 1)), 0), harap) < 1e-6)
})

test('GMST sama dengan iauGmst82 di tanggal lain, termasuk contoh 12.a dan 12.b di Meeus', () => {
  const acuan = [
    ['J2000.0', Date.UTC(2000, 0, 1, 12), 18.697374558333],
    ['1987-04-10 00.00 UT (Meeus 12.a: 13j10m46,3668d)', Date.UTC(1987, 3, 10), 13.179546340864],
    ['1987-04-10 19.21 UT (Meeus 12.b: 8j34m57,0896d)', Date.UTC(1987, 3, 10, 19, 21), 8.582524886692],
    ['17 Oktober 2026 03.00 WIB', Date.UTC(2026, 9, 16, 20), 21.689911630201],
    ['17 Oktober 2026 20.00 WIB', Date.UTC(2026, 9, 17, 13), 14.736456089316],
    ['1 Juni 2035 06.30 UTC', Date.UTC(2035, 5, 1, 6, 30), 23.138898161218],
  ]
  for (const [nama, ms, harap] of acuan) {
    const kini = waktuSiderisLokal(new Date(ms), 0)
    assert.ok(selisihJam(kini, harap) < 1e-6, `${nama}: ${kini} jam, SOFA ${harap} jam`)
  }
})

test('waktu sideris lokal = GMST + bujur / 15, selalu di 0..24', () => {
  const t = new Date(Date.UTC(2026, 9, 17, 13))
  const gmst = waktuSiderisLokal(t, 0)
  for (const bujur of [106.8269, 140.7045, -74, -179.9, 179.9]) {
    const lst = waktuSiderisLokal(t, bujur)
    assert.ok(lst >= 0 && lst < 24, `${bujur}: ${lst}`)
    assert.ok(selisihJam(lst, gmst + bujur / 15) < 1e-9, `${bujur}`)
  }
})

// ---------- proyeksi

test('ra 6 jam = sudut 90 derajat (kanan), dan sudut = ra x 15 sama dengan kutubKeXY di langit.ts', () => {
  const p = keXY(6, 0)
  assert.ok(p.x > 0 && Math.abs(p.y) < 1e-12, JSON.stringify(p))
  assert.ok(Math.abs(Math.atan2(p.x, -p.y) / RAD - 90) < 1e-9)
  assert.ok(Math.abs(keXY(0, 20).x) < 1e-12 && keXY(0, 20).y < 0, 'ra 0 di atas')
  assert.ok(Math.abs(keXY(12, 20).x) < 1e-12 && keXY(12, 20).y > 0, 'ra 12 di bawah')
  assert.ok(keXY(18, 20).x < 0 && Math.abs(keXY(18, 20).y) < 1e-12, 'ra 18 di kiri')
  for (const [ra, dec] of [[0, 89], [3.5, 40], [6, -16.7], [13.25, -60], [23.99, -71.9], [25, 10]]) {
    const q = kutubKeXY((ra % 24) * 15, jariDeklinasi(dec)), k = keXY(ra, dec)
    assert.ok(Math.abs(k.x - q.x) < 1e-12 && Math.abs(k.y - q.y) < 1e-12, `${ra}, ${dec}`)
  }
  assert.equal(jariDeklinasi(90), 0)
  assert.equal(jariDeklinasi(DEC_TEPI), 1)
})

test('setiap bintang berasensio rekta h jam jatuh di sektor tahap h', () => {
  const salah = []
  for (const [ra, dec] of BINTANG) {
    if (Math.abs(ra - Math.round(ra)) < 1e-6) continue   // tepat di garis sektor
    const sudut = (Math.atan2(keXY(ra, dec).x, -keXY(ra, dec).y) / RAD + 360) % 360
    if (Math.floor(sudut / 15) !== Math.floor(ra)) salah.push(`${ra}, ${dec} di sudut ${sudut.toFixed(3)}`)
  }
  assert.deepEqual(salah, [])
})

test('Polaris dekat pusat, dan dari Jakarta tidak pernah terbit (cocok dengan iauAtco13)', () => {
  const [ra, dec] = cari(2.5298, 89.264)
  assert.ok(jari(keXY(ra, dec)) < 0.01, `r = ${jari(keXY(ra, dec))}`)
  const jkt = lokasiPengamat(-420)
  for (let jam = 0; jam < 24; jam++) {
    const lst = waktuSiderisLokal(new Date(Date.UTC(2026, 9, 17, jam)), jkt.bujur)
    assert.ok(ketinggian(ra, dec, lst, jkt.lintang) < 0, `${jam}.00 UTC`)
  }
  // iauAtco13 (tanpa refraksi) 17 Oktober 2026 pukul 00, 06, 12, 18 UTC.
  for (const [jam, sofa] of [[0, -6.1224], [6, -6.7984], [12, -6.2221], [18, -5.5518]]) {
    const lst = waktuSiderisLokal(new Date(Date.UTC(2026, 9, 17, jam)), jkt.bujur)
    assert.ok(Math.abs(ketinggian(ra, dec, lst, jkt.lintang) - sofa) < 0.5, `${jam}.00 UTC`)
  }
})

test('tidak tercermin: segitiga bintang berputar ke arah yang sama dengan langit dilihat dari Bumi', () => {
  // Hasil kali tripel tiga vektor arah positif = segitiga berlawanan jarum jam bila bola
  // langit dilihat dari LUAR (seperti globe). Dilihat dari dalam, dari Bumi, arahnya terbalik.
  // Peta yang bukan cermin harus memberi arah pandangan dari dalam: tanda luas di layar
  // (y dibalik ke atas) berlawanan dengan tanda hasil kali tripel. Segitiga bernama harus
  // GEMUK (semua sudutnya jauh dari 0 dan 180 derajat): proyeksi ini melengkungkan lingkaran
  // besar, jadi segitiga tipis seperti Dschubba, Antares, Shaula (sudut 166 derajat di
  // Antares) bisa terbalik walaupun petanya tidak tercermin.
  const vektor = ([ra, dec]) => [Math.cos(dec * RAD) * Math.cos(ra * 15 * RAD), Math.cos(dec * RAD) * Math.sin(ra * 15 * RAD), Math.sin(dec * RAD)]
  const tripel = (a, b, c) => a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])
  const luasAtas = (a, b, c) => {
    const [p, q, s] = [a, b, c].map(([ra, dec]) => keXY(ra, dec))
    return (q.x - p.x) * (p.y - s.y) - (p.y - q.y) * (s.x - p.x)
  }
  const segitiga = {
    'Orion (Betelgeuse, Rigel, Bellatrix)': [cari(5.9195, 7.407), cari(5.2423, -8.202), cari(5.4189, 6.35)],
    'Gubuk Penceng (Acrux, Gacrux, Mimosa)': [cari(12.4433, -63.099), cari(12.5194, -57.113), cari(12.7954, -59.689)],
    'Segitiga Selatan (Atria, Beta TrA, Gamma TrA), dekat tepi': [cari(16.8111, -69.028), cari(15.9191, -63.431), cari(15.3152, -68.68)],
  }
  for (const [nama, [a, b, c]] of Object.entries(segitiga))
    assert.equal(Math.sign(luasAtas(a, b, c)), -Math.sign(tripel(vektor(a), vektor(b), vektor(c))), nama)
  // Sapuan: segitiga kecil di seluruh piringan, jadi tidak ada wilayah yang tercermin.
  for (let ra = 0.25; ra < 24; ra += 1.5) for (let dec = -70; dec <= 85; dec += 7.5) {
    const a = [ra, dec], b = [ra + 0.1, dec], c = [ra, dec + 1]
    assert.equal(Math.sign(luasAtas(a, b, c)), -Math.sign(tripel(vektor(a), vektor(b), vektor(c))), `${ra}, ${dec}`)
  }
})

test('bintang selatan yang penting bagi pengamat Indonesia muat di piringan dengan jarak dari tepi', () => {
  const selatan = {
    'Acrux (Gubuk Penceng)': [12.4433, -63.099], Mimosa: [12.7954, -59.689], Gacrux: [12.5194, -57.113], Imai: [12.2524, -58.749],
    'Rigil Kentaurus': [14.6608, -60.834], Hadar: [14.0637, -60.373], Canopus: [6.3992, -52.696], Achernar: [1.6286, -57.237],
    Atria: [16.8111, -69.028], Miaplacidus: [9.22, -69.717],
  }
  for (const [nama, [ra0, dec0]] of Object.entries(selatan)) {
    const [ra, dec] = cari(ra0, dec0)
    assert.ok(dec >= DEC_TEPI && jari(keXY(ra, dec)) < 0.99, `${nama}: r = ${jari(keXY(ra, dec)).toFixed(4)}`)
  }
})

// ---------- cakrawala dan bintang yang tampak

test('cakrawala: setiap titik berketinggian 0, satu ruas dari Indonesia, ujungnya tepat di tepi piringan', () => {
  for (const zona of [-420, -480, -540]) {
    const { kota, lintang } = lokasiPengamat(zona)
    for (const lst of [0, 4.8117, 13.5, 21.8582]) {
      const ruas = cakrawala(lst, lintang)
      assert.equal(ruas.length, 1, `${kota} lst ${lst}`)
      for (const r of ruas) {
        for (const p of r) {
          assert.ok(jari(p) <= 1 + 1e-12, `${kota}: titik di luar piringan`)
          const { ra, dec } = dariXY(p)
          assert.ok(Math.abs(tinggiVektor(ra, dec, lst, lintang)) < 1e-6, `${kota} lst ${lst}: tinggi ${tinggiVektor(ra, dec, lst, lintang)}`)
        }
        for (const ujung of [r[0], r.at(-1)]) assert.ok(Math.abs(jari(ujung) - 1) < 1e-9, `${kota}: ujung r = ${jari(ujung)}`)
        // Tidak ada lompatan yang akan tergambar sebagai tali busur memotong peta.
        for (let i = 1; i < r.length; i++) assert.ok(Math.hypot(r[i].x - r[i - 1].x, r[i].y - r[i - 1].y) < 0.05, `${kota}: lompatan di titik ${i}`)
      }
    }
  }
  assert.ok(cakrawala(4.8, -6.1753, 0.5)[0].length > cakrawala(4.8, -6.1753, 2)[0].length, 'langkah lebih kecil, titik lebih banyak')
  // Di lintang 18 derajat atau lebih seluruh cakrawala ada di dalam piringan: satu lingkaran tertutup.
  const utuh = cakrawala(3, 30)
  assert.equal(utuh.length, 1)
  assert.deepEqual(utuh[0][0], utuh[0].at(-1))
})

test('Sirius tampak pukul 03.00 dan tidak tampak pukul 20.00, 17 Oktober 2026, cocok dengan iauAtco13', () => {
  const [ra, dec, mag] = BINTANG[0]
  assert.equal(mag, -1.44, 'baris pertama (paling terang) harus Sirius')
  // [zona getTimezoneOffset, waktu setempat, ketinggian iauAtco13 tanpa refraksi (derajat)]
  const kasus = [
    [-420, '2026-10-17T03:00:00+07:00', 59.3556],    // Jakarta, WIB: tinggi di timur sebelum fajar
    [-420, '2026-10-17T20:00:00+07:00', -38.818],    // Jakarta, WIB: belum terbit
    [-480, '2026-10-17T03:00:00+08:00', 56.7002],    // Makassar, WITA
    [-540, '2026-10-17T20:00:00+09:00', -36.9437],   // Jayapura, WIT
  ]
  for (const [zona, waktu, sofa] of kasus) {
    const lokasi = lokasiPengamat(zona), t = new Date(waktu)
    const lst = waktuSiderisLokal(t, lokasi.bujur)
    const tinggi = ketinggian(ra, dec, lst, lokasi.lintang)
    // Presesi sejak J2000 dan aberasi yang diabaikan modul bernilai sekitar 0,3 derajat di sini.
    assert.ok(Math.abs(tinggi - sofa) < 0.5, `${lokasi.kota} ${waktu}: ${tinggi.toFixed(3)}, SOFA ${sofa}`)
    assert.ok(Math.abs(tinggi - tinggiVektor(ra, dec, lst, lokasi.lintang)) < 1e-9, `${lokasi.kota}: rumus vektor`)
    const sirius = langitMalamIni(t, lokasi, BINTANG)[0]
    assert.equal(sirius.mag, -1.44)
    assert.equal(sirius.tampak, sofa > 0, `${lokasi.kota} ${waktu}`)
  }
})

test('langitMalamIni: membuang bintang di luar piringan, menjaga urutan, tampak = di atas cakrawala', () => {
  const lokasi = lokasiPengamat(-480), t = new Date('2026-10-17T22:00:00+08:00')
  const lst = waktuSiderisLokal(t, lokasi.bujur)
  const hasil = langitMalamIni(t, lokasi, BINTANG)
  const masuk = BINTANG.filter(([, dec]) => dec >= DEC_TEPI)
  assert.equal(hasil.length, masuk.length)
  assert.ok(hasil.length < BINTANG.length, 'ada bintang di selatan DEC_TEPI yang dibuang')
  hasil.forEach((b, i) => {
    const [ra, dec, mag] = masuk[i]
    assert.equal(b.mag, mag)
    assert.ok(jari(b) <= 1, `${ra}, ${dec}`)
    const tinggi = tinggiVektor(ra, dec, lst, lokasi.lintang)
    if (Math.abs(tinggi) > 1e-6) assert.equal(b.tampak, tinggi > 0, `${ra}, ${dec}: tinggi ${tinggi}`)
  })
  const tampak = hasil.filter(b => b.tampak).length / hasil.length
  assert.ok(tampak > 0.3 && tampak < 0.7, `porsi tampak ${tampak}`)
})

test('lokasiPengamat: WIB Jakarta, WITA Makassar, WIT Jayapura, zona lain Jakarta', () => {
  assert.equal(lokasiPengamat(-420).kota, 'Jakarta')
  assert.equal(lokasiPengamat(-480).kota, 'Makassar')
  assert.equal(lokasiPengamat(-540).kota, 'Jayapura')
  for (const z of [0, 420, 480, -330, -600, -419, NaN]) assert.equal(lokasiPengamat(z).kota, 'Jakarta', String(z))
  for (const z of [-420, -480, -540]) {
    const { lintang, bujur } = lokasiPengamat(z)
    assert.ok(lintang > -11 && lintang < 6 && bujur > 95 && bujur < 141, `${z}: di luar Indonesia`)
  }
  const a = lokasiPengamat(-420)
  a.lintang = 0
  assert.equal(lokasiPengamat(-420).lintang, -6.1753, 'hasil adalah salinan, bukan objek bersama')
})

// ---------- data dan lisensi

test('data HYG: header lisensi CC BY-SA 4.0 dan atribusi lengkap', () => {
  assert.equal(SUMBER.lisensi, 'CC BY-SA 4.0')
  assert.equal(SUMBER.lisensi_berkas, 'CC BY-SA 4.0', 'berkas turunan ikut berlisensi CC BY-SA 4.0')
  assert.match(SUMBER.url, /^https:\/\//)
  assert.match(SUMBER.versi, /v4\.\d+.*\b[0-9a-f]{40}\b/, 'versi menyebut nomor rilis dan commit')
  assert.match(SUMBER.sha256, /^[0-9a-f]{64}$/)
  for (const kata of ['HYG', 'David Nash', 'CC BY-SA 4.0', SUMBER.url, 'creativecommons.org/licenses/by-sa/4.0', 'Diubah'])
    assert.ok(SUMBER.atribusi.includes(kata), `atribusi tanpa "${kata}"`)
  assert.match(SUMBER.diambil, /^\d{4}-\d{2}-\d{2}$/)
  assert.ok(SUMBER.diambil <= todayStr(), `diambil ${SUMBER.diambil} di masa depan`)
  assert.deepEqual(SUMBER.kolom, ['ra_jam', 'dec_derajat', 'mag'])
})

test('data HYG: jumlah dalam rentang, semua mag <= batas, urut dari yang paling terang, tanpa Matahari', () => {
  assert.ok(BINTANG.length >= 1000 && BINTANG.length <= 1700, `${BINTANG.length} bintang`)
  assert.equal(BINTANG.length, SUMBER.jumlah)
  assert.ok(fs.statSync(BERKAS).size < 60 * 1024, 'berkas >= 60 KB')
  const batas = SUMBER.batas_magnitudo
  assert.ok(batas >= 4.8 && batas <= 5.0, `batas ${batas}`)
  BINTANG.forEach((b, i) => {
    assert.equal(b.length, 3, `baris ${i}`)
    const [ra, dec, mag] = b
    assert.ok(mag <= batas, `baris ${i}: mag ${mag}`)
    assert.ok(mag > -2, `baris ${i}: mag ${mag} (Matahari -26,7 tidak boleh ada)`)
    if (i > 0) assert.ok(mag >= BINTANG[i - 1][2], `baris ${i}: tidak urut`)
    assert.ok(ra >= 0 && ra < 24 && dec >= -90 && dec <= 90, `baris ${i}: ${ra}, ${dec}`)
    assert.equal(Number(ra.toFixed(4)), ra, `baris ${i}: ra lebih dari 4 desimal`)
    assert.equal(Number(dec.toFixed(3)), dec, `baris ${i}: dec lebih dari 3 desimal`)
    assert.equal(Number(mag.toFixed(2)), mag, `baris ${i}: mag lebih dari 2 desimal`)
  })
  assert.deepEqual(BINTANG[0], [6.7525, -16.716, -1.44], 'Sirius paling terang')
})

test('CC BY-SA dari HYG tinggal di berkasnya sendiri: baris bintangnya tidak ada di berkas data atau kode lain', () => {
  // Menautkan HYG di berkas lain sah; yang dijaga adalah DATANYA, yaitu baris [ra, dec] yang
  // disalin keluar dari bintang-hyg.json. Sepuluh bintang paling terang sebagai jejak.
  const jejak = BINTANG.slice(0, 10).map(([ra, dec]) => new RegExp(`${String(ra).replace('.', '\\.')}\\s*,\\s*${String(dec).replace('.', '\\.')}`))
  const telusuri = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return p === path.join(APP, 'src/generated') ? [] : telusuri(p)
    return /\.(json|ts|tsx|mjs|js|css)$/.test(e.name) && p !== BERKAS ? [p] : []
  })
  const bocor = []
  for (const f of [...telusuri(path.join(APP, 'data')), ...telusuri(path.join(APP, 'src'))]) {
    const isi = fs.readFileSync(f, 'utf8')
    if (jejak.some(r => r.test(isi))) bocor.push(path.relative(APP, f))
  }
  assert.deepEqual(bocor, [])
})

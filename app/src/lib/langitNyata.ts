// Langit sungguhan untuk planisfer kurikulum: bintang HYG di posisi nyatanya, garis
// cakrawala, dan bintang mana yang sedang di atas cakrawala untuk jam laptop di kota
// pengamat. Semua fungsi murni (tanpa DOM, tanpa membaca jam sistem sendiri), jadi bisa
// dites tanpa browser. Datanya dikirim pemanggil: `data/langit/bintang-hyg.json`
// (CC BY-SA 4.0, berkas sendiri supaya ShareAlike-nya tidak menular, atribusi di
// `_sumber` berkas itu dan di `materi/NOTICE.md`).
//
// Peta yang sama dengan langit.ts: piringan berjari-jari 1, pusat (0, 0) = kutub utara
// langit, y ke bawah, sudut searah jarum jam dari atas (`kutubKeXY`). Tahap kurikulum
// bernomor h menempati sektor [15h, 15h + 15) derajat, jadi tahap = jam asensio rekta:
// bintang berasensio rekta 3,5 jam jatuh di sektor tahap 03.
//
// Arah putar, dan mudah terbalik. Asensio rekta naik ke timur. Sudut = ra x 15 searah
// jarum jam berarti asensio rekta naik searah jarum jam mengelilingi kutub utara. Itulah
// langit sebagaimana TERLIHAT DARI BUMI oleh pengamat yang menghadap kutub utara langit:
// bintang beredar berlawanan jarum jam mengelilingi kutub, dan bintang berasensio rekta
// lebih besar tertinggal di belakangnya, yaitu searah jarum jam. Bila peta diputar
// sehingga arah ke pusat (utara) menunjuk ke atas, timur ada di KIRI, sama dengan
// planisfer dan atlas bintang modern. Globe langit menggambar bola langit dari LUAR; di
// sana, dilihat dari atas kutub utara, asensio rekta naik berlawanan jarum jam dan
// rasinya tercermin. Peta ini BUKAN cermin (dijaga tes "tidak tercermin" di
// tests/langit-nyata.test.mjs).
//
// Proyeksi: azimut berjarak sama dari kutub utara langit. Jari-jari sebanding dengan
// jarak sudut dari kutub, r = (90 - dec) / (90 - DEC_TEPI), jadi lingkar deklinasi
// berjarak sama. Harganya: rasi selatan melebar ke arah keliling. Pada dec -60 skala
// keliling sekitar 5,2 kali skala jari-jari, jadi Salib Selatan (Gubuk Penceng) tampil
// pipih, seperti di setiap peta kutub utara yang menjangkau langit selatan.
//
// Ketelitian: posisi HYG adalah J2000.0, jadi peta ini peta J2000. Presesi sejak 2000
// (sekitar 0,37 derajat pada 2026), nutasi, aberasi, dan refraksi diabaikan. Dibanding IAU
// SOFA (iauAtco13, posisi teramati yang ketat tanpa refraksi), ketinggian Sirius dari
// Jakarta meleset sekitar 0,3 derajat, dan garis cakrawala bergeser terhadap bintang 2
// sampai 5 unit di piringan berjari-jari 500 unit (diukur untuk ketiga kota pada 17
// Oktober 2026; paling jauh di dekat tepi, tempat skala keliling paling besar). Status
// `tampak` hanya bisa keliru untuk bintang yang kurang dari sekitar 0,4 derajat dari
// cakrawala, lebih kecil daripada refraksi di cakrawala (sekitar 0,57 derajat) yang juga
// diabaikan; bintang redup di sana memang tertelan atmosfer. Kalau suatu hari perlu lebih
// teliti: putar zenit (LST, lintang) dari ekuinoks tanggal itu ke J2000 dengan matriks
// presesi, lalu pakai hasilnya sebagai lstJam dan lintangDerajat di ketinggian() dan
// cakrawala(). Keduanya hanya bergantung pada arah zenit.

import { kutubKeXY } from './langit'

/** Satu baris `bintang` di bintang-hyg.json: [ra_jam, dec_derajat, mag]. */
export type BarisBintang = readonly number[]
export interface Titik { x: number; y: number }
export interface Lokasi { kota: string; lintang: number; bujur: number }
export interface BintangNyata { x: number; y: number; mag: number; tampak: boolean }

/**
 * Deklinasi di tepi piringan (r = 1). -72 memuat semua bintang selatan yang penting bagi
 * pengamat Indonesia dengan jarak dari tepi: Salib Selatan (Gubuk Penceng, -57 sampai
 * -63, r 0,91 sampai 0,95), Alfa dan Beta Centauri (-61, r 0,93), Canopus dan Achernar
 * (-53 dan -57, r 0,88 dan 0,91), serta dua bintang paling terang di selatan -64,
 * Miaplacidus (-69,7, magnitudo 1,7) dan Atria (-69,0, magnitudo 1,9), di r 0,986 dan
 * 0,982. Dengan -70 keduanya jatuh di r 0,998 dan 0,994, tepat di garis tepi. Yang
 * terpotong: langit di selatan -72 (Beta Hydri -77, sekitar kutub selatan), yang dari
 * Jakarta pun hanya terlihat rendah (Beta Hydri paling tinggi sekitar 19 derajat).
 */
export const DEC_TEPI = -72

const RAD = Math.PI / 180
/** Sisa bagi yang selalu di [0, n), juga untuk bilangan negatif. */
const modulo = (a: number, n: number) => ((a % n) + n) % n
const jepit = (v: number) => Math.max(-1, Math.min(1, v))

/** Jari-jari lingkar deklinasi di piringan: 0 di kutub utara, 1 di DEC_TEPI. */
export function jariDeklinasi(decDerajat: number): number {
  return (90 - decDerajat) / (90 - DEC_TEPI)
}

/**
 * Waktu sideris lokal rata-rata, jam 0..24. GMST memakai model IAU 1982 dalam bentuk
 * Meeus, Astronomical Algorithms edisi 2, persamaan 12.4, berbasis hari Julian:
 *   GMST = 280,46061837 + 360,98564736629 d + 0,000387933 T^2 - T^3 / 38710000 (derajat)
 * dengan d = JD - 2451545,0 dan T = d / 36525. Modelnya sama dengan iauGmst82 di IAU
 * SOFA, dan dites terhadapnya. Date dianggap UT1: selisih UT1 - UTC di bawah 0,9 detik.
 * bujurDerajat positif ke timur (Jakarta +106,8).
 */
export function waktuSiderisLokal(tanggal: Date, bujurDerajat: number): number {
  const jd = tanggal.getTime() / 86400000 + 2440587.5   // 1970-01-01 00.00 UTC = JD 2440587,5
  const d = jd - 2451545.0
  const t = d / 36525
  const gmst = 280.46061837 + 360.98564736629 * d + 0.000387933 * t * t - (t * t * t) / 38710000
  return modulo(modulo(gmst, 360) / 15 + bujurDerajat / 15, 24)
}

/** Ketinggian di atas cakrawala (derajat; negatif = di bawah cakrawala), tanpa refraksi. */
export function ketinggian(raJam: number, decDerajat: number, lstJam: number, lintangDerajat: number): number {
  const h = (lstJam - raJam) * 15 * RAD   // sudut jam, positif ke barat
  const d = decDerajat * RAD, f = lintangDerajat * RAD
  return Math.asin(jepit(Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(h))) / RAD
}

/**
 * Posisi di piringan satuan (lihat arah putar dan proyeksi di kepala berkas). Bintang di
 * selatan DEC_TEPI mendapat r > 1; `langitMalamIni` membuangnya.
 */
export function keXY(raJam: number, decDerajat: number): Titik {
  return kutubKeXY(modulo(raJam, 24) * 15, jariDeklinasi(decDerajat))
}

/** Titik cakrawala pada azimut A (derajat, dari utara ke timur), dalam ra (jam) dan dec. */
function titikCakrawala(azimut: number, lstJam: number, lintangDerajat: number) {
  const a = azimut * RAD, f = lintangDerajat * RAD
  // Vektor arah di kerangka sudut jam: x ke titik ekuator di meridian, y ke titik timur,
  // z ke kutub utara langit. Pada ketinggian 0: x = -cos A sin f, y = sin A, z = cos A cos f.
  const x = -Math.cos(a) * Math.sin(f), y = Math.sin(a), z = Math.cos(a) * Math.cos(f)
  const sudutJam = Math.atan2(-y, x) / RAD / 15
  return { ra: modulo(lstJam - sudutJam, 24), dec: Math.asin(jepit(z)) / RAD }
}

/**
 * Garis "cakrawala malam ini": titik-titik berketinggian 0 di piringan, untuk digambar
 * sebagai polyline. Cakrawala adalah lingkaran besar; bagian yang lebih selatan dari
 * DEC_TEPI keluar piringan, jadi hasilnya berupa ruas-ruas (dari Indonesia selalu satu
 * ruas) yang ujungnya tepat di tepi piringan. Lingkaran utuh (pengamat di lintang 18
 * derajat atau lebih, utara maupun selatan) diberikan sebagai satu ruas yang titik
 * akhirnya sama dengan titik awalnya.
 * langkah = selang azimut antartitik, derajat.
 */
export function cakrawala(lstJam: number, lintangDerajat: number, langkah = 2): Titik[][] {
  const n = Math.max(12, Math.ceil(360 / Math.max(0.05, langkah)))
  const selang = 360 / n
  const dalam = (az: number) => titikCakrawala(az, lstJam, lintangDerajat).dec >= DEC_TEPI
  const xy = (az: number) => { const p = titikCakrawala(az, lstJam, lintangDerajat); return keXY(p.ra, p.dec) }
  // Azimut tepat tempat cakrawala memotong tepi, dicari dengan bagi dua di antara sampel
  // di dalam dan di luar piringan. Yang dikembalikan sisi dalamnya, jadi r <= 1.
  const potong = (a0: number, a1: number): Titik => {
    let masuk = a0, keluar = a1
    if (!dalam(a0)) { masuk = a1; keluar = a0 }
    for (let k = 0; k < 50; k++) {
      const m = (masuk + keluar) / 2
      if (dalam(m)) masuk = m; else keluar = m
    }
    return xy(masuk)
  }

  const diDalam = Array.from({ length: n }, (_, i) => dalam(i * selang))
  if (diDalam.every(Boolean)) {
    const ruas = diDalam.map((_, i) => xy(i * selang))
    return [[...ruas, ruas[0]]]
  }
  // Mulai dari sampel di luar piringan, supaya tidak ada ruas yang terbelah di titik awal.
  const awal = diDalam.indexOf(false)
  const hasil: Titik[][] = []
  let ruas: Titik[] = []
  for (let k = 1; k <= n; k++) {
    const j = awal + k                      // indeks tak dibungkus; azimut j * selang boleh lewat 360
    const kini = diDalam[j % n], sebelum = diDalam[(j - 1) % n]
    if (kini && !sebelum) ruas = [potong((j - 1) * selang, j * selang)]
    if (kini) ruas.push(xy(j * selang))
    if (!kini && sebelum) { ruas.push(potong((j - 1) * selang, j * selang)); hasil.push(ruas); ruas = [] }
  }
  return hasil
}

// Kota acuan per zona waktu Indonesia. Koordinat dari Wikidata, properti P625 (coordinate
// location), diperiksa 2026-10-17, dibulatkan ke 4 desimal (sekitar 11 m): Jakarta Q3630
// (revisi 2540534195), Makassar Q14634 (revisi 2555889124), Jayapura Q27860 (revisi
// 2555889299). Data Wikidata berlisensi CC0.
const KOTA: Record<number, Lokasi> = {
  [-420]: { kota: 'Jakarta', lintang: -6.1753, bujur: 106.8269 },    // WIB, UTC+7
  [-480]: { kota: 'Makassar', lintang: -5.1331, bujur: 119.4136 },   // WITA, UTC+8
  [-540]: { kota: 'Jayapura', lintang: -2.5425, bujur: 140.7045 },   // WIT, UTC+9
}

/**
 * Kota pengamat dari zona waktu laptop. offsetMenitZona = nilai
 * `Date.prototype.getTimezoneOffset()`, yaitu menit DI BELAKANG UTC: WIB -420, WITA -480,
 * WIT -540. Zona lain (laptop di luar Indonesia, atau nilai yang tidak dikenal) memakai Jakarta.
 */
export function lokasiPengamat(offsetMenitZona: number): Lokasi {
  return { ...(KOTA[offsetMenitZona] ?? KOTA[-420]) }
}

/**
 * Bintang latar untuk saat `tanggal` dilihat dari `lokasi`: posisi di piringan (tetap,
 * epoch J2000) dan apakah sedang di atas cakrawala. Bintang di selatan DEC_TEPI dibuang;
 * urutan masukan dipertahankan (data HYG sudah urut dari yang paling terang).
 */
export function langitMalamIni(tanggal: Date, lokasi: Lokasi, daftarBintang: readonly BarisBintang[]): BintangNyata[] {
  const lst = waktuSiderisLokal(tanggal, lokasi.bujur)
  const hasil: BintangNyata[] = []
  for (const [ra, dec, mag] of daftarBintang) {
    if (dec < DEC_TEPI) continue
    const p = keXY(ra, dec)
    hasil.push({ x: p.x, y: p.y, mag, tampak: ketinggian(ra, dec, lst, lokasi.lintang) > 0 })
  }
  return hasil
}

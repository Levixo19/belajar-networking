// Penjaga suntingan PROSA di materi/: membandingkan berkas .md dengan versinya di
// git (bawaan HEAD) dan menolak suntingan yang mengubah lebih dari gaya bahasa.
// Dipakai saat merapikan tulisan (membuang em-dash, emoji, pola tulisan mesin):
// kalimat boleh berubah, FAKTA tidak.
//
//   node scripts/cek-suntingan-materi.mjs                 # semua .md yang berubah
//   node scripts/cek-suntingan-materi.mjs materi/x/y.md   # berkas tertentu
//   BN_REF=59efa64 node scripts/cek-suntingan-materi.mjs  # banding dengan commit lain
//
// Yang wajib SAMA PERSIS dengan versi git: blok kode, kode sebaris, tautan (teks dan
// alamatnya), judul bagian, multiset angka, baris tabel, penanda alert, jumlah soal
// dan jawaban latihan, serta baris Prasyarat/Tujuan/Berikutnya. Yang wajib HILANG dari
// prosa: em-dash, en-dash, dan emoji. Jumlah kata boleh bergeser -15% s.d. +8%.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..')
const REF = process.env.BN_REF || 'HEAD'
const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8', maxBuffer: 64 << 20 })

const argv = process.argv.slice(2)
const berkas = argv.length
  ? argv.map(f => path.relative(REPO, path.resolve(process.cwd(), f)))
  : git('diff', '--name-only', REF, '--', 'materi', 'README.md', 'SILABUS.md').split('\n').filter(f => f.endsWith('.md'))

function pisah(md) {
  const kode = [], prosa = []
  let dalam = false, buf = []
  for (const line of md.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      if (dalam) { buf.push(line); kode.push(buf.join('\n')); buf = [] } else buf = [line]
      dalam = !dalam
      continue
    }
    if (dalam) buf.push(line); else prosa.push(line)
  }
  return { kode, prosa: prosa.join('\n') }
}
const urut = a => [...a].sort()
const sama = (a, b) => JSON.stringify(a) === JSON.stringify(b)
function selisih(a, b) {
  const hitung = arr => arr.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map())
  const ma = hitung(a), mb = hitung(b), out = []
  for (const [k, n] of ma) if ((mb.get(k) || 0) < n) out.push(`-${k}`)
  for (const [k, n] of mb) if ((ma.get(k) || 0) < n) out.push(`+${k}`)
  return out.slice(0, 8).join(' ')
}
function ciri(md) {
  const { kode, prosa } = pisah(md)
  const tanpaKode = prosa.replace(/`[^`\n]*`/g, ' ')
  const latihan = (prosa.split(/\n(?=##\s)/).find(s => /^##\s+(?:\d+\.\s+)?Latihan\b/.test(s)) || '')
  return {
    kode,
    kodeSebaris: urut(prosa.match(/`[^`\n]*`/g) || []),
    tautan: urut([...prosa.matchAll(/\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)].map(m => `${m[1]} -> ${m[2]}`)),
    url: urut(tanpaKode.match(/https?:\/\/[^\s)>\]]+/g) || []),
    judul: prosa.split('\n').filter(l => /^#{1,6}\s/.test(l)),
    angka: urut(tanpaKode.match(/\d+(?:[.,]\d+)*/g) || []),
    tabel: prosa.split('\n').filter(l => /^\s*\|/.test(l)).length,
    alert: (prosa.match(/^(?:>\s*)+\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gm) || []).length,
    details: (prosa.match(/<details>/g) || []).length,
    soal: (latihan.split(/<details>/)[0].match(/^\s{0,3}\d+\.\s/gm) || []).length,
    // Baris tetap dibandingkan tanpa tanda baca: em-dash di dalamnya boleh (dan harus) dibuang.
    tetap: prosa.split('\n').filter(l => /^>\s*\*\*(Prasyarat|Tujuan):\*\*|^\*\*Berikutnya:\*\*/.test(l))
      .map(l => l.replace(/[\u2014\u2013,:;.()\-]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()),
    kata: tanpaKode.split(/\s+/).filter(Boolean).length,
    tandaPisah: (tanpaKode.match(/[—–]/g) || []).length,
    emoji: (tanpaKode.match(/\p{Emoji_Presentation}|️/gu) || []).length,
  }
}

let gagal = 0
for (const f of berkas) {
  const abs = path.join(REPO, f)
  if (!fs.existsSync(abs)) { console.log(`LEWAT  ${f} (dihapus)`); continue }
  let lama
  try { lama = git('show', `${REF}:${f}`) } catch { console.log(`BARU   ${f} (tidak ada di ${REF}, tidak dibandingkan)`); continue }
  const a = ciri(lama), b = ciri(fs.readFileSync(abs, 'utf8'))
  const masalah = []
  if (!sama(a.kode, b.kode)) masalah.push(`blok kode berubah (${a.kode.length} -> ${b.kode.length} blok)`)
  if (!sama(a.kodeSebaris, b.kodeSebaris)) masalah.push(`kode sebaris berubah: ${selisih(a.kodeSebaris, b.kodeSebaris)}`)
  if (!sama(a.tautan, b.tautan)) masalah.push(`tautan berubah: ${selisih(a.tautan, b.tautan)}`)
  if (!sama(a.url, b.url)) masalah.push(`URL berubah: ${selisih(a.url, b.url)}`)
  if (!sama(a.judul, b.judul)) masalah.push('judul bagian berubah (judul tidak boleh disunting: jangkar diagram bergantung padanya)')
  if (!sama(a.angka, b.angka)) masalah.push(`angka berubah: ${selisih(a.angka, b.angka)}`)
  if (a.tabel !== b.tabel) masalah.push(`baris tabel ${a.tabel} -> ${b.tabel}`)
  if (a.alert !== b.alert) masalah.push(`penanda alert ${a.alert} -> ${b.alert}`)
  if (a.details !== b.details || a.soal !== b.soal) masalah.push(`latihan berubah (soal ${a.soal} -> ${b.soal}, details ${a.details} -> ${b.details})`)
  if (!sama(a.tetap, b.tetap)) masalah.push('baris Prasyarat/Tujuan/Berikutnya berubah')
  const r = b.kata / Math.max(1, a.kata)
  if (r < 0.85 || r > 1.08) masalah.push(`jumlah kata ${a.kata} -> ${b.kata} (${Math.round((r - 1) * 100)}%)`)
  if (b.tandaPisah) masalah.push(`masih ada ${b.tandaPisah} em-dash/en-dash di prosa`)
  if (b.emoji) masalah.push(`masih ada ${b.emoji} emoji di prosa`)
  if (masalah.length) { gagal++; console.log(`GAGAL  ${f}\n  - ${masalah.join('\n  - ')}`) }
  else console.log(`OK     ${f}  (tanda pisah ${a.tandaPisah} -> 0, emoji ${a.emoji} -> 0, kata ${a.kata} -> ${b.kata})`)
}
if (!berkas.length) console.log('Tidak ada berkas materi yang berubah.')
process.exit(gagal ? 1 : 0)

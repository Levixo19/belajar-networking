// Sapuan kelas CSS dua arah:
//   1. setiap kelas yang dipakai komponen (className, classList, class="") punya aturan
//      di CSS hasil build: entah utility Tailwind yang benar-benar dihasilkan, entah
//      aturan kustom. Salah ketik utility tidak menghasilkan error apa pun, cuma gaya
//      yang diam-diam tidak berlaku.
//   2. setiap kelas di CSS kustom (src/index.css, src/styles/*.css) dipakai di suatu
//      tempat: komponen, string di kode, atau HTML hasil build materi. CSS yatim
//      (.double-bezel, .grad-text, .burger, ...) pernah menumpuk tanpa ada yang tahu.
import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const semua = (dir, ext) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
  d.isDirectory() ? (d.name === 'generated' ? [] : semua(path.join(dir, d.name), ext)) : ext.test(d.name) ? [path.join(dir, d.name)] : [])
const KODE = [...semua(path.join(APP, 'src'), /\.(tsx?|mjs)$/), path.join(APP, 'scripts/build-content.mjs')]
const CSS_KUSTOM = [path.join(APP, 'src/index.css'), ...semua(path.join(APP, 'src/styles'), /\.css$/)]

let cssBuild = ''
before(() => {
  const keluar = fs.mkdtempSync(path.join(os.tmpdir(), 'kelas-'))
  const r = spawnSync(path.join(APP, 'node_modules/.bin/vite'), ['build', '--outDir', keluar, '--emptyOutDir', '--logLevel', 'error'], { cwd: APP, encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  const dir = path.join(keluar, 'assets')
  cssBuild = fs.readdirSync(dir).filter(f => f.endsWith('.css')).map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
  fs.rmSync(keluar, { recursive: true, force: true })
})

/** Isi string/template literal di dalam sebuah ekspresi. `${...}` memecah templat jadi
 *  potongan, dan isi `${...}` itu sendiri ikut disapu (di sanalah kelas bersyarat tinggal).
 *  Literal yang sedang DIBANDINGKAN (`=== 'done'`) bukan kelas, jadi dilewati. */
function literal(expr) {
  const out = []
  for (const m of expr.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`((?:[^`\\]|\\.)*)`/g)) {
    const sebelum = expr.slice(Math.max(0, m.index - 4), m.index)
    if (/[!=]==?\s*$/.test(sebelum)) continue
    if (m[3] !== undefined) {
      const isi = [...m[3].matchAll(/\$\{((?:[^{}]|\{[^{}]*\})*)\}/g)].map(x => x[1])
      for (const e of isi) out.push(...literal(e))
      out.push(...m[3].split(/\$\{(?:[^{}]|\{[^{}]*\})*\}/).map((p, i, a) => ({ teks: p, potongKanan: i < a.length - 1, potongKiri: i > 0 })))
    } else out.push({ teks: m[1] ?? m[2], potongKanan: false, potongKiri: false })
  }
  return out
}
/** Ekspresi className={...} dengan kurung kurawal berimbang. */
function ekspresiKelas(src) {
  const hasil = []
  for (const m of src.matchAll(/className=(?:"([^"]*)"|\{)/g)) {
    if (m[1] !== undefined) { hasil.push(`"${m[1]}"`); continue }
    let i = m.index + m[0].length, d = 1
    const awal = i
    for (; i < src.length && d; i++) { if (src[i] === '{') d++; else if (src[i] === '}') d-- }
    hasil.push(src.slice(awal, i - 1))
  }
  for (const m of src.matchAll(/(?:classList\.(?:add|toggle|remove)\(|\.className\s*=\s*)((?:'[^']*'|"[^"]*")(?:\s*,\s*(?:'[^']*'|"[^"]*"))*)/g)) hasil.push(m[1])
  // class="..." di string HTML (build-content, modRefs): dibungkus backtick supaya
  // `callout-${kind}` terbaca sebagai awalan, bukan kelas utuh.
  for (const m of src.matchAll(/class=\\?"([^"\\]*)\\?"/g)) hasil.push('`' + m[1] + '`')
  return hasil
}

const dipakai = new Set(), awalan = new Set()
for (const f of KODE) for (const e of ekspresiKelas(fs.readFileSync(f, 'utf8')))
  for (const { teks, potongKanan, potongKiri } of literal(e)) {
    const token = teks.split(/\s+/).filter(Boolean)
    token.forEach((t, i) => {
      if (potongKanan && i === token.length - 1 && !/\s$/.test(teks)) awalan.add(t)
      else if (!(potongKiri && i === 0 && !/^\s/.test(teks))) dipakai.add(t)
    })
  }

// Kelas yang dipakai sebagai KAIT selektor JS (querySelector, target GSAP) sah tanpa
// aturan CSS: tugasnya menandai elemen, bukan menggayakannya.
const kait = new Set()
for (const f of KODE) for (const m of fs.readFileSync(f, 'utf8').matchAll(/['"`](?:[^'"`]*\s)?\.([a-z][\w-]*)(?=[\s.,:'"`\[>])/g)) kait.add(m[1])
// Kelas yang dihasilkan pustaka luar ke dalam HTML materi (highlight.js) tergantung isi
// kode di materi, jadi tidak semuanya muncul sekarang.
const DARI_PUSTAKA = /^hljs(-|$)/

const esc = t => t.replace(/[^a-zA-Z0-9_-]/g, '\\$&')
const adaDiBuild = t => new RegExp(`\\.${esc(t).replace(/[\\]/g, '\\\\').replace(/[$()*+.?[\]^{|}]/g, '\\$&')}(?![\\w-])`).test(cssBuild)

test('setiap kelas yang dipakai komponen punya aturan CSS di hasil build', () => {
  assert.ok(dipakai.size > 300, `hanya ${dipakai.size} kelas terkumpul: pengumpulnya rusak?`)
  const tanpa = [...dipakai].filter(t => /^[!a-z-]/.test(t) && !t.startsWith('group') && t !== 'peer' && !kait.has(t) && !DARI_PUSTAKA.test(t) && !adaDiBuild(t))
  assert.deepEqual(tanpa.sort(), [])
})

test('setiap kelas di CSS kustom dipakai di suatu tempat', () => {
  // Pemakaian longgar: kelas boleh tinggal di string mana pun di kode (konstanta,
  // objek opsi SplitText) atau di HTML hasil build materi (hljs-*, callout-*, fig-*).
  const semuaString = new Set()
  for (const f of KODE) for (const { teks } of literal(fs.readFileSync(f, 'utf8'))) for (const t of teks.split(/\s+/)) if (t) semuaString.add(t)
  const html = fs.readFileSync(path.join(APP, 'src/generated/curriculum.json'), 'utf8')
  for (const m of html.matchAll(/class=\\"([^"\\]*)\\"/g)) for (const t of m[1].split(/\s+/)) semuaString.add(t)
  const kustom = new Set()
  for (const f of CSS_KUSTOM) {
    const isi = fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/url\([^)]*\)/g, '').replace(/^@import[^;]*;/gm, '')
    for (const sel of isi.split('{').map(x => x.slice(x.lastIndexOf('}') + 1)))
      if (!/^\s*@(keyframes|font-face)/.test(sel)) for (const m of sel.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) kustom.add(m[1])
  }
  const yatim = [...kustom].filter(k => !semuaString.has(k) && !DARI_PUSTAKA.test(k) && ![...awalan].some(a => k.startsWith(a)))
  assert.deepEqual(yatim.sort(), [])
})

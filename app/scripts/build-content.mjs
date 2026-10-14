// Pipeline konten: baca semua .md kurikulum di materi/ → src/generated/curriculum.json
// Ekstrak: metadata (judul, prasyarat, tujuan), body HTML (kode ter-highlight,
// tabel, callout), TOC, kartu latihan (untuk spaced repetition), indeks pencarian.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import { TOPIK, TOPIK_TAHAP, JENIS } from '../src/lib/pustakaTopik.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP_DIR = path.resolve(__dirname, '..')                  // <repo>/app
const REPO_ROOT = path.resolve(APP_DIR, '..')                  // <repo>
const CONTENT_ROOT = path.join(REPO_ROOT, 'materi')            // <repo>/materi — semua tahap kurikulum
const OUT_DIR = path.join(APP_DIR, 'src', 'generated')
const EXTRA_DIR = path.join(APP_DIR, 'data')

// Berkas pengaya: menempatkan diagram, foto, kuis, alat, dan game ke posisi
// tertentu di dalam materi tanpa mengotori berkas .md kurikulum.
let ENRICH = {}
try {
  // BN_ENRICH cuma untuk tes: menyuapkan enrich rusak dan menuntut build GAGAL.
  ENRICH = JSON.parse(fs.readFileSync(process.env.BN_ENRICH || path.join(EXTRA_DIR, 'enrich.json'), 'utf8'))
} catch { console.warn('  (data/enrich.json tidak ada — lewati pengayaan manual)') }

// Registri diagram dibaca dari src/diagrams/index.tsx (kunci 'id': Komponen). Dulu ID
// yang salah ketik di enrich.json dirender null tanpa satu pun pesan, dan modulnya
// diam-diam kehilangan diagram. Sekarang build GAGAL (lihat ENRICH_GALAT di bawah).
const DIAGRAM_ID = new Set([...fs.readFileSync(path.join(APP_DIR, 'src', 'diagrams', 'index.tsx'), 'utf8')
  .matchAll(/^\s*'([a-z0-9-]+)':\s*[A-Za-z0-9_.]+,?\s*$/gm)].map(m => m[1]))
const ENRICH_GALAT = []

// --- Peta judul & ikon per tahap -------------------------------------------
const STAGE_META = {
  '00-fondasi': { title: 'Fondasi', icon: '🌱', band: 'dasar' },
  '01-model-referensi': { title: 'Model Referensi', icon: '🧭', band: 'dasar' },
  '02-layer-fisik': { title: 'Layer Fisik', icon: '🔌', band: 'dasar' },
  '03-data-link': { title: 'Data Link', icon: '🔗', band: 'dasar' },
  '04-network-layer': { title: 'Network Layer', icon: '📦', band: 'dasar' },
  '05-transport': { title: 'Transport', icon: '🚚', band: 'dasar' },
  '06-aplikasi': { title: 'Aplikasi & Layanan', icon: '🌐', band: 'dasar' },
  '07-routing-lanjutan': { title: 'Routing Lanjutan', icon: '🗺️', band: 'menengah' },
  '08-ipv6': { title: 'IPv6', icon: '🆕', band: 'menengah' },
  '09-nat-acl-firewall': { title: 'NAT, ACL & Firewall', icon: '🛂', band: 'menengah' },
  '10-wireless': { title: 'Wireless', icon: '📶', band: 'menengah' },
  '11-wan-vpn': { title: 'WAN & VPN', icon: '🛰️', band: 'menengah' },
  '12-keamanan': { title: 'Keamanan', icon: '🛡️', band: 'lanjut' },
  '13-linux-networking': { title: 'Linux Networking', icon: '🐧', band: 'lanjut' },
  '14-monitoring-troubleshooting': { title: 'Monitoring & Troubleshooting', icon: '🔍', band: 'lanjut' },
  '15-otomasi': { title: 'Otomasi', icon: '🤖', band: 'lanjut' },
  '16-datacenter-cloud-sdn': { title: 'Data Center, Cloud & SDN', icon: '☁️', band: 'profesional' },
  '17-desain-arsitektur': { title: 'Desain & Arsitektur', icon: '📐', band: 'profesional' },
  '18-karier-sertifikasi': { title: 'Karier & Sertifikasi', icon: '🎓', band: 'profesional' },
  '19-mikrotik': { title: 'MikroTik RouterOS', icon: '🧿', band: 'khusus' },
  '22-service-provider': { title: 'Jaringan Service Provider', icon: '🏗️', band: 'khusus' },
  '21-ekosistem-profesi': { title: 'Ekosistem Profesi', icon: '🧑‍💼', band: 'karier' },
  'lab': { title: 'Lab Praktik', icon: '🧪', band: 'penunjang' },
  'referensi': { title: 'Referensi', icon: '📚', band: 'penunjang' },
  '20-proyek-akhir': { title: 'Proyek Akhir', icon: '🏁', band: 'proyek' },
}
const STAGE_ORDER = Object.keys(STAGE_META)

// --- markdown-it dengan highlight -------------------------------------------
const md = new MarkdownIt({
  html: true, linkify: true, typographer: false,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>'
      } catch { }
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
  },
})

// Tambah id ke heading + kumpulkan TOC (dipakai per-render via closure)
function slugify(s) {
  return s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\w\s-]/g, '')
    .trim().replace(/\s+/g, '-').slice(0, 60)
}

// Blok kode tanpa bahasa yang isinya gambar kotak-kotak dianggap diagram ASCII
// dan dinaikkan derajatnya jadi <figure> bergaya, lengkap dengan tombol perbesar.
const BOX_CHARS = /[\u2500-\u257F]/
// Baris yang berbau sesi terminal — bukan gambar, walau memuat panah anotasi.
const SHELLY = /^\s*(\$|#|>|PS )|^\s*[A-Za-z0-9_.()\[\]@/-]+\s*(#|>|\$)\s|^\s*(sudo|ip|ping|show|set|add|traceroute|dig|ssh|cat|grep|ethtool|tcpdump|iperf3|nft|iptables)\b/
function diagramKind(text) {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 3) return null
  const boxy = lines.filter(l => BOX_CHARS.test(l)).length
  if (boxy >= 3) return 'Diagram'
  const ascii = lines.filter(l => /[+|][-=+|]{2,}/.test(l) || /^\s*[|+].*[|+]\s*$/.test(l)).length
  if (ascii >= 3) return 'Diagram'
  // Panah saja hanya dihitung bila blok tidak terlihat seperti sesi terminal
  if (lines.some(l => SHELLY.test(l))) return null
  const arrows = lines.filter(l => /(-->|<--|=>|\u2192|\u2190)/.test(l)).length
  return (arrows >= 2 && lines.length >= 4) ? 'Skema' : null
}
function wrapAsciiFigures(html) {
  const open = '<pre class="hljs"><code>', close = '</code></pre>'
  let out = '', i = 0
  for (; ;) {
    const a = html.indexOf(open, i)
    if (a < 0) { out += html.slice(i); break }
    const b = html.indexOf(close, a)
    if (b < 0) { out += html.slice(i); break }
    const inner = html.slice(a + open.length, b)
    const text = inner.replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    out += html.slice(i, a)
    const kind = diagramKind(text)
    if (kind) {
      out += '<figure class="fig-ascii"><div class="fig-tools"><span class="fig-lb">' + kind + '</span>' +
        '<button type="button" class="fig-zoom" title="Perbesar diagram">Perbesar</button></div>' +
        open + inner + close + '</figure>'
    } else {
      out += open + inner + close
    }
    i = b + close.length
  }
  return out
}

function postProcess(html) {
  // Bungkus tabel agar bisa di-scroll horizontal
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>')
  html = wrapAsciiFigures(html)
  // Ubah paragraf yang diawali ⚠️ / 💡 menjadi callout berstyle
  html = html.replace(/<p>(⚠️|💡|✅|❌)\s*([\s\S]*?)<\/p>/g, (m, ico, body) => {
    const kind = ico === '⚠️' ? 'warn' : ico === '💡' ? 'tip' : ico === '✅' ? 'ok' : 'no'
    const label = { warn: 'Perhatian', tip: 'Tips', ok: 'Benar', no: 'Hindari' }[kind]
    return `<div class="callout callout-${kind}"><div class="callout-body"><span class="callout-label">${label}</span> ${body}</div></div>`
  })
  return html
}

function renderBody(markdown) {
  const toc = []
  const env = {}
  const tokens = md.parse(markdown, env)
  const seen = {}
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (t.type === 'heading_open' && (t.tag === 'h2' || t.tag === 'h3')) {
      const inline = tokens[i + 1]
      const text = inline ? inline.content : ''
      let id = slugify(text) || 'sec'
      if (seen[id]) { seen[id]++; id = id + '-' + seen[id] } else seen[id] = 1
      t.attrSet('id', id)
      toc.push({ id, text: text.replace(/^\d+\.\s*/, ''), level: t.tag === 'h2' ? 2 : 3 })
    }
  }
  const html = postProcess(md.renderer.render(tokens, md.options, env))
  return { html, toc }
}


// --- Penanaman widget interaktif -------------------------------------------
function attr(v) {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
const WIDGET = {
  diagram: w => `<div data-widget="diagram" data-id="${attr(w.id)}"></div>`,
  quiz: w => `<div data-widget="quiz" data-id="${attr(w.id)}" data-payload="${encodeURIComponent(JSON.stringify(w.items || []))}"></div>`,
  checkpoint: w => `<div data-widget="checkpoint" data-from="${Number(w.from) || 0}" data-count="${Number(w.count) || 2}"></div>`,
  photo: w => `<div data-widget="photo" data-src="${attr(w.src)}" data-caption="${attr(w.caption)}" data-credit="${attr(w.credit)}" data-href="${attr(w.href)}"></div>`,
  tool: w => `<div data-widget="tool" data-slug="${attr(w.slug)}"></div>`,
  game: w => `<div data-widget="game" data-slug="${attr(w.slug)}"></div>`,
}

// Petakan tiap heading ke rentang byte-nya dalam HTML hasil render.
function headingIndex(html) {
  const re = /<h([23])\s+id="([^"]+)"[^>]*>/g
  const list = []
  let m
  while ((m = re.exec(html))) {
    const lvl = Number(m[1])
    list.push({ level: lvl, id: m[2], start: m.index, headEnd: html.indexOf(`</h${lvl}>`, m.index) + 5 })
  }
  for (let i = 0; i < list.length; i++) {
    let end = html.length
    for (let j = i + 1; j < list.length; j++) if (list[j].level <= list[i].level) { end = list[j].start; break }
    list[i].end = end
  }
  return list
}

const SKIP_SECTION = /^(\d+[-.]?)?(ringkasan|latihan|sumber|kesalahan-umum|praktik)/

function injectWidgets(html, id, cards) {
  const heads = headingIndex(html)
  if (!heads.length) return html
  const byId = new Map(heads.map(h => [h.id, h]))
  const ins = []
  const used = new Set()

  // 1. Penempatan manual dari enrich.json. Jangkar yang hilang, tipe asing, dan ID
  //    diagram tak terdaftar dikumpulkan sebagai GALAT (build gagal di akhir).
  const ganti = []
  for (const w of ENRICH[id] || []) {
    const anchor = w.after || w.end
    const h = byId.get(anchor)
    if (!h) { ENRICH_GALAT.push(`${id}: jangkar "${anchor}" tidak ada`); continue }
    const make = WIDGET[w.type]
    if (!make) { ENRICH_GALAT.push(`${id}: tipe widget "${w.type}" tidak dikenal`); continue }
    if (w.type === 'diagram' && !DIAGRAM_ID.has(w.id)) { ENRICH_GALAT.push(`${id}: diagram "${w.id}" tidak terdaftar di src/diagrams/index.tsx`); continue }
    // `ganti: true`: diagram SVG MENGGANTIKAN figur ASCII pertama di bagian itu,
    // bukan ditambahkan di sampingnya. Berkas .md tidak disentuh.
    if (w.ganti) {
      const a = html.indexOf('<figure class="fig-ascii">', h.headEnd)
      if (a < 0 || a >= h.end) { ENRICH_GALAT.push(`${id}: diagram "${w.id}" ganti=true, tapi bagian "${anchor}" tidak punya figur ASCII`); continue }
      ganti.push({ a, b: html.indexOf('</figure>', a) + '</figure>'.length, html: make(w) })
    } else ins.push({ pos: w.after ? h.headEnd : h.end, html: make(w) })
    used.add(h.id)
  }

  // 2. Checkpoint otomatis dari kartu latihan modul — berlaku untuk semua modul
  //    yang punya cukup kartu, supaya tiap materi tetap ada jeda aktif.
  const h2 = heads.filter(h => h.level === 2 && !SKIP_SECTION.test(h.id) && !used.has(h.id))
  if (cards.length >= 2 && h2.length >= 4) {
    const spots = [Math.floor(h2.length * 0.4), Math.floor(h2.length * 0.78)]
    let from = 0
    for (const si of [...new Set(spots)]) {
      const h = h2[si]
      if (!h || from + 2 > cards.length) continue
      ins.push({ pos: h.end, html: WIDGET.checkpoint({ from, count: 2 }) })
      from += 2
    }
  }

  // Sisipan dan penggantian diterapkan dari belakang supaya posisi yang lebih awal tetap sah.
  const semua = [...ins.map(x => ({ a: x.pos, b: x.pos, html: x.html })), ...ganti].sort((x, y) => y.a - x.a)
  let out = html
  for (const x of semua) out = out.slice(0, x.a) + x.html + out.slice(x.b)
  return out
}

// --- Parsing satu file ------------------------------------------------------
function parseFile(absPath, stageId, order, base = CONTENT_ROOT) {
  let raw = fs.readFileSync(absPath, 'utf8')
  // id = jalur relatif terhadap base — dipakai sebagai rute URL, jadi harus stabil.
  const id = path.relative(base, absPath).replace(/\\/g, '/').replace(/\.md$/, '')
  // rel = jalur relatif terhadap akar repo, untuk menunjuk berkas sumbernya.
  const rel = path.relative(REPO_ROOT, absPath).replace(/\\/g, '/')

  // Judul (H1)
  let title = path.basename(absPath, '.md'), num = ''
  const h1 = raw.match(/^#\s+(.+)$/m)
  if (h1) {
    const m = h1[1].match(/^([\d.]+)\s*[—–-]\s*(.+)$/)
    if (m) { num = m[1]; title = m[2].trim() } else { title = h1[1].trim() }
  }

  // Prasyarat & Tujuan (blockquote di awal)
  let prasyarat = '', tujuan = ''
  const pm = raw.match(/^>\s*\*\*Prasyarat:\*\*\s*(.+)$/m)
  const tm = raw.match(/^>\s*\*\*Tujuan:\*\*\s*(.+)$/m)
  if (pm) prasyarat = md.renderInline(pm[1].trim())
  if (tm) tujuan = md.renderInline(tm[1].trim())

  // "Berikutnya"
  let next = null
  const nm = raw.match(/\*\*Berikutnya:\*\*\s*`([^`]+)`\s*[—–-]?\s*(.*)$/m)
  if (nm) {
    const p = nm[1].trim().replace(/\.md$/, '')
    next = { id: p, teaser: (nm[2] || '').trim() }
  }

  // Kartu latihan (untuk spaced repetition / kuis) — dari bagian "## ... Latihan"
  const cards = []
  const sections = raw.split(/\n(?=##\s)/)
  const latSection = sections.find(s => /^##\s+(?:\d+\.\s+)?Latihan\b/.test(s))
  if (latSection) {
    const block = latSection.replace(/^##\s+.*\n/, '')
    const detIdx = block.search(/<details>/)
    const qPart = detIdx >= 0 ? block.slice(0, detIdx) : block
    const aMatch = block.match(/<details>[\s\S]*?<summary>[\s\S]*?<\/summary>([\s\S]*?)<\/details>/)
    const aPart = aMatch ? aMatch[1] : ''
    const questions = splitNumbered(qPart)
    const answers = splitNumbered(aPart)
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      const a = answers[i] || ''
      if (q && a) cards.push({ id: id + '#' + (i + 1), n: i + 1, q: md.renderInline(oneLine(q)), aHtml: md.render(a) })
    }
  }

  // Body untuk dibaca: buang H1 + blockquote prasyarat/tujuan + baris Berikutnya + hr penutup
  let body = raw
    .replace(/^#\s+.+$/m, '')
    .replace(/^>\s*\*\*Prasyarat:\*\*.*$/m, '')
    .replace(/^>\s*\*\*Tujuan:\*\*.*$/m, '')
    .replace(/\n---\n\s*\*\*Berikutnya:\*\*.*$/s, '')
    .replace(/\*\*Berikutnya:\*\*.*$/s, '')
    .trim()

  const { html: rawHtml, toc } = renderBody(body)
  const html = injectWidgets(rawHtml, id, cards)
  const plain = body.replace(/<[^>]+>/g, ' ').replace(/[#>*`_|]/g, ' ').replace(/\s+/g, ' ').trim()
  const words = plain.split(' ').length
  return {
    id, rel, stage: stageId, order, num, title,
    prasyarat, tujuan, next, bodyHtml: html, toc, cards,
    words, readMin: Math.max(1, Math.round(words / 200)),
    searchText: plain.slice(0, 4000),
  }
}

function splitNumbered(text) {
  if (!text) return []
  const lines = text.split('\n')
  const items = []
  let cur = null, expected = 1
  for (const line of lines) {
    const m = line.match(/^\s{0,3}(\d+)\.\s+(.*)$/)
    if (m && Number(m[1]) === expected) {
      if (cur !== null) items.push(cur.trim())
      cur = m[2]; expected++
    } else if (cur !== null) {
      cur += '\n' + line
    }
  }
  if (cur !== null) items.push(cur.trim())
  return items
}
function oneLine(s) { return s.replace(/\s+/g, ' ').trim() }

// --- Bangun -----------------------------------------------------------------
for (const k of Object.keys(ENRICH)) if (!k.startsWith('_') && !fs.existsSync(path.join(CONTENT_ROOT, k + '.md')) && !fs.existsSync(path.join(REPO_ROOT, k + '.md')))
  ENRICH_GALAT.push(`enrich.json: modul "${k}" tidak ada`)
const stages = []
for (const stageId of STAGE_ORDER) {
  const dir = path.join(CONTENT_ROOT, stageId)
  if (!fs.existsSync(dir)) continue
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort()
  if (!files.length) continue // tahap tanpa modul tidak boleh sampai ke UI (stage.modules[0] dipakai di banyak tempat)
  const modules = files.map((f, i) => parseFile(path.join(dir, f), stageId, i))
  const meta = STAGE_META[stageId]
  stages.push({
    id: stageId, title: meta.title, icon: meta.icon, band: meta.band,
    num: STAGE_ORDER.indexOf(stageId),
    modules,
  })
}

// Modul root (README, SILABUS) sebagai stage "panduan"
const rootDocs = ['README.md', 'SILABUS.md'].filter(f => fs.existsSync(path.join(REPO_ROOT, f)))
if (rootDocs.length) {
  const modules = rootDocs.map((f, i) => parseFile(path.join(REPO_ROOT, f), 'panduan', i, REPO_ROOT))
  stages.unshift({ id: 'panduan', title: 'Panduan', icon: '📖', band: 'panduan', num: -1, modules })
}

const search = []
let totalModules = 0, totalCards = 0
for (const s of stages) for (const m of s.modules) {
  totalModules++; totalCards += m.cards.length
  search.push({ id: m.id, title: m.title, num: m.num, stage: s.id, stageTitle: s.title, text: m.searchText })
}

const bundle = {
  stages: stages.map(s => ({
    id: s.id, title: s.title, icon: s.icon, band: s.band, num: s.num,
    modules: s.modules.map(m => {
      const { searchText, ...rest } = m
      return rest
    }),
  })),
  search,
  meta: { totalModules, totalCards, totalStages: stages.length, generatedAt: new Date().toISOString() },
}

if (ENRICH_GALAT.length) {
  console.error('GAGAL validasi enrich.json:\n  ' + ENRICH_GALAT.join('\n  '))
  process.exit(1)
}
fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(path.join(OUT_DIR, 'curriculum.json'), JSON.stringify(bundle))

// --- Data profesi (data/profesi/*.json) → src/generated/profesi.json --------
// Divalidasi ketat: ID profesi, rumpun, tag keahlian, tautan antarprofesi, dan ID modul
// harus sah. Data yang rusak menggagalkan build, bukan meledak di browser.
const PROFESI_ID = {
  inti: ['network-engineer', 'network-administrator'],
  infrastruktur: ['network-architect', 'cloud-network-engineer', 'wireless-network-engineer', 'telecom-engineer', 'voip-engineer', 'data-center-engineer', 'noc-technician'],
  keamanan: ['network-security-engineer', 'cybersecurity-analyst', 'penetration-tester', 'security-architect', 'incident-responder'],
  operasi: ['system-administrator', 'database-administrator', 'storage-administrator', 'system-engineer', 'it-operations-manager'],
  devops: ['devops-engineer', 'site-reliability-engineer', 'cloud-infrastructure-engineer', 'automation-engineer'],
  dukungan: ['it-support-technician', 'field-network-technician', 'hardware-engineer', 'it-asset-manager'],
  tatakelola: ['it-consultant', 'it-auditor', 'disaster-recovery-specialist', 'solution-architect', 'scrum-master-infrastruktur'],
}
const KEAHLIAN = new Set(('fundamental-jaringan routing-switching wireless-rf telekomunikasi voip-uc kabel-fisik data-center-fasilitas ' +
  'cloud virtualisasi container-kubernetes linux windows-server scripting-python otomasi-iac ci-cd keamanan-jaringan keamanan-ofensif ' +
  'analisis-log-siem respons-insiden kriptografi-pki identitas-akses monitoring-observability troubleshooting database storage-backup ' +
  'hardware-elektronika manajemen-aset itsm-itil manajemen-proyek-agile arsitektur-desain tata-kelola-kepatuhan kelangsungan-bisnis ' +
  'layanan-pelanggan komunikasi-dokumentasi manajemen-tim konsultasi-bisnis').split(' '))
const RUMPUN_MODUL = {
  inti: '01-peta-ekosistem', infrastruktur: '02-rumpun-infrastruktur', keamanan: '03-rumpun-keamanan',
  operasi: '04-rumpun-operasi-sistem-data', devops: '05-rumpun-devops-sre', dukungan: '06-rumpun-dukungan-lapangan',
  tatakelola: '07-rumpun-tata-kelola-konsultasi',
}
{
  // BN_PROFESI_DIR cuma untuk tes: menyuapkan data rusak dan menuntut build GAGAL.
  const dir = process.env.BN_PROFESI_DIR || path.join(EXTRA_DIR, 'profesi')
  const allIds = new Set(Object.values(PROFESI_ID).flat())
  const moduleIds = new Set(stages.flatMap(s => s.modules.map(m => m.id)))
  const profesi = [], errors = [], warns = []
  const JENJANG = ['pemula', 'menengah', 'senior']
  const https = u => typeof u === 'string' && /^https:\/\/[^\s]+$/.test(u)
  for (const rumpun of Object.keys(PROFESI_ID)) {
    const f = path.join(dir, rumpun + '.json')
    if (!fs.existsSync(f)) { warns.push(`data/profesi/${rumpun}.json belum ada`); continue }
    let arr
    try { arr = JSON.parse(fs.readFileSync(f, 'utf8')) } catch (e) { errors.push(`${rumpun}.json bukan JSON valid: ${e.message}`); continue }
    if (!Array.isArray(arr)) { errors.push(`${rumpun}.json harus berupa array`); continue }
    for (const p of arr) {
      const at = `${rumpun}.json:${p?.id}`
      if (!PROFESI_ID[rumpun].includes(p?.id)) { errors.push(`${at} ID tidak dikenal untuk rumpun ini`); continue }
      for (const k of ['nama', 'ringkas', 'masuk']) if (typeof p[k] !== 'string' || !p[k].trim()) errors.push(`${at} field "${k}" wajib`)
      for (const k of ['harian', 'keahlian', 'alat', 'modul', 'naik', 'dekat', 'proyek', 'sertifikasi', 'sumber'])
        if (!Array.isArray(p[k])) { errors.push(`${at} field "${k}" harus array`); p[k] = [] }
      for (const t of p.keahlian) if (!KEAHLIAN.has(t)) errors.push(`${at} tag keahlian "${t}" tidak ada di kosakata`)
      for (const r of [...p.naik, ...p.dekat]) if (!allIds.has(r)) errors.push(`${at} tautan ke profesi "${r}" tidak dikenal`)
      for (const m of p.modul) if (!moduleIds.has(m)) errors.push(`${at} modul "${m}" tidak ada di kurikulum`)
      if (!JENJANG.includes(p.jenjang)) errors.push(`${at} jenjang harus pemula|menengah|senior`)
      // Array kosong bukan "belum diisi" yang aman: modul kosong berarti kesiapan
      // selamanya 0%, sumber kosong berarti klaim tanpa bukti.
      for (const k of ['harian', 'keahlian', 'alat', 'modul', 'sertifikasi', 'sumber', 'proyek'])
        if (Array.isArray(p[k]) && !p[k].length) errors.push(`${at} "${k}" tidak boleh kosong`)
      for (const c of p.sertifikasi) {
        if (typeof c?.nama !== 'string' || !c.nama.trim() || typeof c?.penerbit !== 'string' || !c.penerbit.trim()) errors.push(`${at} sertifikasi harus {nama, penerbit, tingkat?}`)
        if (c?.tingkat !== undefined && !JENJANG.includes(c.tingkat)) errors.push(`${at} tingkat sertifikasi "${c.tingkat}" bukan pemula|menengah|senior`)
      }
      for (const r of p.sumber) if (typeof r?.judul !== 'string' || !r.judul.trim() || !https(r?.url)) errors.push(`${at} sumber harus {judul, url https}: ${r?.url}`)
      if (p.gaji !== undefined) {
        const g = p.gaji
        if (!g || typeof g.rentang !== 'string' || typeof g.sumber !== 'string' || !https(g.url)) errors.push(`${at} gaji harus {rentang, sumber, url https, tanggal_diperiksa}`)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(g?.tanggal_diperiksa || '') || Number.isNaN(Date.parse(g?.tanggal_diperiksa))) errors.push(`${at} gaji.tanggal_diperiksa harus YYYY-MM-DD`)
      }
      if ((p.jenjang_alasan === undefined) !== (p.jenjang_sumber === undefined)) errors.push(`${at} jenjang_alasan dan jenjang_sumber harus berpasangan`)
      if (p.jenjang_sumber !== undefined && !https(p.jenjang_sumber)) errors.push(`${at} jenjang_sumber harus https`)
      profesi.push({ ...p, rumpun, bacaan: `21-ekosistem-profesi/${RUMPUN_MODUL[rumpun]}` })
    }
  }
  const seen = new Set()
  for (const p of profesi) { if (seen.has(p.id)) errors.push(`profesi "${p.id}" ganda`); seen.add(p.id) }
  // Tautan ke profesi yang datanya belum ditulis: dibuang dari output agar UI tidak menunjuk kekosongan
  for (const p of profesi) {
    const lost = [...p.naik, ...p.dekat].filter(r => !seen.has(r))
    if (lost.length) errors.push(`${p.id}: tautan ke profesi tanpa data (${lost.join(', ')})`)
    p.naik = [...new Set(p.naik)].filter(r => seen.has(r) && r !== p.id)
    p.dekat = [...new Set(p.dekat)].filter(r => seen.has(r) && r !== p.id && !p.naik.includes(r))
    p.modul = [...new Set(p.modul)]
    if (!moduleIds.has(p.bacaan)) p.bacaan = null
  }
  // Arah "naik" harus berarti sesuatu: tidak boleh timbal balik, dan tidak boleh
  // turun jenjang. Keduanya dulu ada (5 pasang dan 7 sisi), sehingga peta tidak bisa
  // menggambar arah dan perencana jalur menyarankan "naik" ke peran yang lebih junior.
  const perId = new Map(profesi.map(p => [p.id, p]))
  for (const p of profesi) for (const q of p.naik) {
    const t = perId.get(q)
    if (!t) continue
    if (t.naik.includes(p.id)) errors.push(`naik timbal balik: ${p.id} <-> ${q} (jadikan salah satunya "dekat")`)
    if (JENJANG.indexOf(t.jenjang) < JENJANG.indexOf(p.jenjang)) errors.push(`naik menurun jenjang: ${p.id} (${p.jenjang}) -> ${q} (${t.jenjang})`)
  }
  for (const w of warns) console.warn('  peringatan profesi: ' + w)
  if (errors.length) {
    console.error('GAGAL validasi data profesi:\n  ' + errors.join('\n  '))
    process.exit(1)
  }
  fs.writeFileSync(path.join(OUT_DIR, 'profesi.json'), JSON.stringify(profesi))
  console.log(`OK  ${profesi.length} profesi → src/generated/profesi.json`)
}
console.log(`OK  ${totalModules} modul, ${totalCards} kartu latihan, ${stages.length} tahap → src/generated/curriculum.json`)

// --- Pustaka: data/pustaka/*.json (hasil panen) + data/pustaka-kurasi/*.json (riset) ---
// → src/generated/pustaka.json. Data yang rusak MENGGAGALKAN build. Tahap terkait tiap
// butir DIHITUNG di sini dari TOPIK_TAHAP (src/lib/pustakaTopik.ts), satu-satunya
// tempat pemetaan itu ditulis; butir sendiri cuma membawa topik.
{
  const stageIds = new Set(stages.map(s => s.id))
  const moduleIds = new Set(stages.flatMap(s => s.modules.map(m => m.id)))
  const errors = []
  // Pola yang DILARANG apa pun lisensinya: penyingkat tautan menyembunyikan tujuan,
  // dan situs-situs ini dikenal sebagai cermin buku berhak cipta.
  const DILARANG = /(^|\.)(bit\.ly|tinyurl\.com|t\.co|goo\.gl|s\.id|ow\.ly|is\.gd|cutt\.ly|scribd\.com|pdfdrive\.com|libgen\.[a-z]+|z-lib\.[a-z]+|dokumen\.pub|vdoc\.pub|epdf\.pub|studylib\.net|pdfcoffee\.com|dokumen\.tips|idoc\.pub)$/i
  // "hak cipta" sengaja TIDAK ada di TIDAK_BEBAS: setiap lisensi CC diberikan oleh
  // pemegang hak cipta, jadi "CC BY-SA 3.0 (hak cipta 2014 Bonaventure)" itu sah.
  const BISA_DISALIN = /\b(CC BY(?:-SA)?(?: \d\.\d)?|CC0|Creative Commons (?:Attribution|Zero)|MIT|BSD|Apache|domain publik|public domain)\b/i
  const TIDAK_BEBAS = /\b(NC|ND)\b|NonCommercial|Non-Commercial|NoDerivatives|NoDerivs|tanpa lisensi|tautan saja|tidak disebutkan|proprietary/i
  const tanggalSah = t => /^\d{4}-\d{2}-\d{2}$/.test(t) && !Number.isNaN(Date.parse(t)) && t <= new Date().toISOString().slice(0, 10) + 'Z'

  const kunciUrl = u => { const p = new URL(u); return `${p.protocol}//${p.host.toLowerCase()}${p.pathname === '/' ? '' : p.pathname.replace(/\/$/, '')}${p.search}` }
  const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 } return h.toString(16).padStart(8, '0') }

  function bacaFolder(dir) {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().map(f => {
      try { return { f, isi: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) } }
      catch (e) { errors.push(`${f} bukan JSON valid: ${e.message}`); return null }
    }).filter(Boolean)
  }

  const sumberList = [], semua = []
  // Kurasi dulu, lalu materi sendiri, lalu hasil panen: kalau satu URL ada di beberapa
  // sumber, yang menang yang paling banyak membawa keterangan (lisensi per butir).
  const urutan = [
    ...bacaFolder(path.join(EXTRA_DIR, 'pustaka-kurasi')).map(x => ({ ...x, kurasi: true })),
    ...bacaFolder(path.join(EXTRA_DIR, 'pustaka')).sort((a, b) => (a.f === 'materi.json' ? -1 : b.f === 'materi.json' ? 1 : 0)),
  ]
  for (const { f, isi, kurasi } of urutan) {
    const s = isi?.sumber
    if (!s || typeof s.kunci !== 'string' || !Array.isArray(isi.entri)) { errors.push(`${f}: harus {sumber:{kunci,...}, entri:[...]}`); continue }
    if (s.kunci + '.json' !== f) errors.push(`${f}: sumber.kunci "${s.kunci}" tidak sama dengan nama berkas`)
    for (const k of ['nama', 'atribusi']) if (typeof s[k] !== 'string' || !s[k].trim()) errors.push(`${f}: sumber.${k} wajib`)
    if (!kurasi && typeof s.boleh_salin !== 'boolean') errors.push(`${f}: sumber.boleh_salin wajib boolean`)
    const urlTerlihat = new Set()
    let n = 0
    for (const e of isi.entri) {
      const at = `${f}:${e?.url}`
      if (typeof e?.judul !== 'string' || !e.judul.trim()) { errors.push(`${at} judul wajib`); continue }
      let u
      try { u = new URL(e.url) } catch { errors.push(`${at} URL tidak sah`); continue }
      if (!/^https?:$/.test(u.protocol)) errors.push(`${at} skema URL harus http(s)`)
      if (kurasi && u.protocol !== 'https:') errors.push(`${at} data kurasi wajib https`)
      if (DILARANG.test(u.hostname)) errors.push(`${at} domain dilarang (penyingkat tautan atau cermin bajakan)`)
      const ku = kunciUrl(e.url)
      if (urlTerlihat.has(ku)) errors.push(`${at} URL ganda dalam satu sumber`)
      urlTerlihat.add(ku)
      if (!JENIS[e.jenis]) errors.push(`${at} jenis "${e.jenis}" tidak dikenal`)
      if (!['id', 'en'].includes(e.bahasa)) errors.push(`${at} bahasa harus id|en`)
      if (!Array.isArray(e.topik) || !e.topik.length) errors.push(`${at} topik wajib array tidak kosong`)
      for (const t of e.topik || []) if (!TOPIK[t]) errors.push(`${at} topik "${t}" tidak ada di kosakata`)
      for (const t of e.tahap || []) if (!stageIds.has(t)) errors.push(`${at} tahap "${t}" tidak ada`)
      for (const m of e.modul || []) if (!moduleIds.has(m)) errors.push(`${at} modul "${m}" tidak ada`)
      let lisensi = s.lisensi, bolehSalin = s.boleh_salin
      if (kurasi) {
        lisensi = e.lisensi; bolehSalin = e.boleh_salin
        if (typeof lisensi !== 'string' || !lisensi.trim()) errors.push(`${at} lisensi wajib (persis dari sumber)`)
        if (typeof bolehSalin !== 'boolean') errors.push(`${at} boleh_salin wajib boolean`)
        if (bolehSalin && (!BISA_DISALIN.test(lisensi) || TIDAK_BEBAS.test(lisensi))) errors.push(`${at} boleh_salin=true tapi lisensinya "${lisensi}"`)
        if (!tanggalSah(e.tanggal_diperiksa || '')) errors.push(`${at} tanggal_diperiksa harus YYYY-MM-DD dan tidak di masa depan`)
      } else if (!new RegExp(`^${s.kunci}-[0-9a-f]{8}$`).test(e.id || '')) errors.push(`${at} id "${e.id}" bukan bentuk <kunci>-<hash>`)
      const tahap = new Set([...(e.tahap || [])])
      for (const t of e.topik || []) for (const st of TOPIK_TAHAP[t] || []) tahap.add(st)
      for (const m of e.modul || []) tahap.add(m.split('/')[0])
      semua.push({
        id: kurasi ? `${s.kunci}-${fnv(ku)}` : e.id, ku, judul: e.judul.trim(), url: e.url, jenis: e.jenis, bahasa: e.bahasa,
        sumber: s.kunci, lisensi, boleh_salin: bolehSalin, topik: e.topik || [],
        tahap: [...tahap].filter(t => stageIds.has(t)), modul: e.modul || [], catatan: e.catatan || '',
        ...(e.tanggal_diperiksa ? { tanggal_diperiksa: e.tanggal_diperiksa } : {}),
      })
      n++
    }
    sumberList.push({ kunci: s.kunci, nama: s.nama, pemilik: s.pemilik || '', repo: s.repo || '', lisensi: s.lisensi || 'per butir',
      boleh_salin: s.boleh_salin ?? null, atribusi: s.atribusi, commit: s.commit || '', kurasi: !!kurasi, jumlah: n })
  }
  for (const [t, st] of Object.entries(TOPIK_TAHAP)) {
    if (!TOPIK[t]) errors.push(`TOPIK_TAHAP: topik "${t}" tidak ada di TOPIK`)
    for (const x of st) if (!stageIds.has(x)) errors.push(`TOPIK_TAHAP.${t}: tahap "${x}" tidak ada di kurikulum`)
  }
  for (const t of Object.keys(TOPIK)) if (!TOPIK_TAHAP[t]) errors.push(`topik "${t}" tidak punya baris di TOPIK_TAHAP`)

  // Satu URL satu butir di seluruh Pustaka: yang pertama (urutan prioritas di atas) menang,
  // sumber lain tercatat di `juga_di` supaya atribusinya tidak hilang.
  const perUrl = new Map(), entri = []
  for (const e of semua) {
    const ada = perUrl.get(e.ku)
    if (ada) {
      if (!ada.juga_di.includes(e.sumber)) ada.juga_di.push(e.sumber)
      for (const t of e.topik) if (!ada.topik.includes(t)) ada.topik.push(t)
      for (const t of e.tahap) if (!ada.tahap.includes(t)) ada.tahap.push(t)
      for (const m of e.modul) if (!ada.modul.includes(m)) ada.modul.push(m)
      continue
    }
    const { ku, ...rest } = e
    const b = { ...rest, juga_di: [] }
    perUrl.set(ku, b); entri.push(b)
  }
  const ids = new Set()
  for (const e of entri) { if (ids.has(e.id)) errors.push(`id pustaka ganda: ${e.id}`); ids.add(e.id) }

  if (errors.length) {
    console.error('GAGAL validasi pustaka:\n  ' + errors.slice(0, 60).join('\n  ') + (errors.length > 60 ? `\n  ... dan ${errors.length - 60} lagi` : ''))
    process.exit(1)
  }
  fs.writeFileSync(path.join(OUT_DIR, 'pustaka.json'), JSON.stringify({ sumber: sumberList, entri }))
  console.log(`OK  ${entri.length} tautan pustaka dari ${sumberList.length} sumber → src/generated/pustaka.json`)
}

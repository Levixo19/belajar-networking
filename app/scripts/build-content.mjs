// Pipeline konten: baca semua .md kurikulum di materi/ → src/generated/curriculum.json
// Ekstrak: metadata (judul, prasyarat, tujuan), body HTML (kode ter-highlight,
// tabel, callout), TOC, kartu latihan (untuk spaced repetition), indeks pencarian.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

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
  ENRICH = JSON.parse(fs.readFileSync(path.join(EXTRA_DIR, 'enrich.json'), 'utf8'))
} catch { console.warn('  (data/enrich.json tidak ada — lewati pengayaan manual)') }

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

  // 1. Penempatan manual dari enrich.json
  for (const w of ENRICH[id] || []) {
    const anchor = w.after || w.end
    const h = byId.get(anchor)
    if (!h) { console.warn(`  ! anchor "${anchor}" tidak ada di ${id}`); continue }
    const make = WIDGET[w.type]
    if (!make) { console.warn(`  ! tipe widget "${w.type}" tidak dikenal`); continue }
    ins.push({ pos: w.after ? h.headEnd : h.end, html: make(w) })
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

  ins.sort((a, b) => b.pos - a.pos)
  let out = html
  for (const x of ins) out = out.slice(0, x.pos) + x.html + out.slice(x.pos)
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
  const dir = path.join(EXTRA_DIR, 'profesi')
  const allIds = new Set(Object.values(PROFESI_ID).flat())
  const moduleIds = new Set(stages.flatMap(s => s.modules.map(m => m.id)))
  const profesi = [], errors = [], warns = []
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
      if (p.gaji && !(p.gaji.sumber && p.gaji.url)) errors.push(`${at} gaji tanpa sumber/url (hapus atau lengkapi)`)
      if (!['pemula', 'menengah', 'senior'].includes(p.jenjang)) errors.push(`${at} jenjang harus pemula|menengah|senior`)
      profesi.push({ ...p, rumpun, bacaan: `21-ekosistem-profesi/${RUMPUN_MODUL[rumpun]}` })
    }
  }
  const seen = new Set()
  for (const p of profesi) { if (seen.has(p.id)) errors.push(`profesi "${p.id}" ganda`); seen.add(p.id) }
  // Tautan ke profesi yang datanya belum ditulis: dibuang dari output agar UI tidak menunjuk kekosongan
  for (const p of profesi) {
    const lost = [...p.naik, ...p.dekat].filter(r => !seen.has(r))
    if (lost.length) warns.push(`${p.id}: tautan ke profesi tanpa data dilewati (${lost.join(', ')})`)
    p.naik = [...new Set(p.naik)].filter(r => seen.has(r) && r !== p.id)
    p.dekat = [...new Set(p.dekat)].filter(r => seen.has(r) && r !== p.id && !p.naik.includes(r))
    p.modul = [...new Set(p.modul)]
    if (!moduleIds.has(p.bacaan)) p.bacaan = null
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

// Memanen tautan belajar jaringan dari repo kurasi lokal dan dari materi sendiri
// menjadi data Pustaka.
//
//     node scripts/panen-pustaka.mjs [folder materi-belajar] [folder keluaran]
//
// Hasilnya satu berkas JSON per sumber di app/data/pustaka/, ditulis ulang UTUH
// setiap kali skrip ini jalan. Berkas itu DIHASILKAN, bukan diketik: kalau ada yang
// salah, perbaiki pengurai di sini lalu jalankan ulang. Jangan menyunting JSON-nya
// dengan tangan, karena panen berikutnya menimpanya diam-diam, dan
// tests/pustaka.test.mjs memanen ulang lalu menuntut hasil yang identik.
//
// Pola dan keputusannya disalin dari alat/panen_pustaka.py di Belajar Ngoding;
// yang berbeda cuma cakupannya: hanya bagian yang menyangkut jaringan, Linux,
// keamanan, cloud/DC, otomasi, dan sistem.
//
// LISENSI menentukan apa yang boleh diambil, bukan selera. Tabelnya `SUMBER` di
// bawah, dan aturannya dua:
//   * Menautkan selalu sah; MENYALIN daftar tunduk pada lisensi. Repo tanpa lisensi
//     (getting-a-gig, build-your-own-x) dan repo proprietary (developer-roadmap)
//     tidak disalin daftarnya: yang masuk cuma tautan ke situs/repo itu sendiri,
//     dengan keterangan yang ditulis di sini. Isi kurikulum freeCodeCamp berhak
//     cipta freeCodeCamp.org (BSD-3 cuma untuk kodenya), jadi cuma tautan.
//   * coding-interview-university berlisensi CC BY-SA 4.0. Daftarnya ditaruh di
//     berkasnya SENDIRI (ciu.json) yang ikut berlisensi CC BY-SA 4.0, supaya
//     ShareAlike-nya tidak menular ke seluruh data lain.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { topikUntukTahap } from '../src/lib/pustakaTopik.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.resolve(__dirname, '..')
const REPO = path.resolve(APP, '..')
export const AKAR_BAWAAN = '/home/vi/folder_materi/materi-belajar'
export const KELUAR_BAWAAN = path.join(APP, 'data', 'pustaka')

export const SUMBER = {
  fpb: {
    nama: 'free-programming-books', pemilik: 'EbookFoundation',
    repo: 'https://github.com/EbookFoundation/free-programming-books',
    lisensi: 'CC BY 4.0', boleh_salin: true, folder: '01-free-programming-books',
    atribusi: 'Daftar dari free-programming-books oleh EbookFoundation dan kontributornya, CC BY 4.0. Disaring ke bagian jaringan, Linux, keamanan, dan cloud; dikelompokkan ulang.',
  },
  awesome: {
    nama: 'awesome', pemilik: 'Sindre Sorhus', repo: 'https://github.com/sindresorhus/awesome',
    lisensi: 'CC0 1.0', boleh_salin: true, folder: '05-awesome',
    atribusi: 'Daftar dari awesome oleh Sindre Sorhus, CC0 1.0. Disaring ke daftar yang menyangkut jaringan, keamanan, dan infrastruktur.',
  },
  desain: {
    nama: 'system-design-primer', pemilik: 'Donne Martin', repo: 'https://github.com/donnemartin/system-design-primer',
    lisensi: 'CC BY 4.0', boleh_salin: true, folder: '08-system-design-primer',
    atribusi: 'Bacaan dari The System Design Primer oleh Donne Martin, CC BY 4.0. Hanya bagian DNS, CDN, load balancer, reverse proxy, komunikasi, ketersediaan, dan keamanan.',
  },
  peta: {
    nama: 'roadmap.sh', pemilik: 'roadmap.sh', repo: 'https://roadmap.sh',
    lisensi: 'tautan saja', boleh_salin: false, folder: '09-developer-roadmap',
    atribusi: 'Tautan ke peta belajar di roadmap.sh. Isinya hak cipta roadmap.sh dan tidak disalin; lisensinya hanya mengizinkan membagikan tautan.',
  },
  ciu: {
    nama: 'coding-interview-university', pemilik: 'John Washam',
    repo: 'https://github.com/jwasham/coding-interview-university',
    lisensi: 'CC BY-SA 4.0', boleh_salin: true, folder: '10-coding-interview-university',
    lisensi_berkas: 'CC BY-SA 4.0',
    atribusi: 'Daftar dari bagian Networking di Coding Interview University oleh John Washam dan kontributornya, CC BY-SA 4.0. Berkas data ini (ciu.json), sebagai turunannya, juga berlisensi CC BY-SA 4.0.',
  },
  fcc: {
    nama: 'freeCodeCamp', pemilik: 'freeCodeCamp.org', repo: 'https://www.freecodecamp.org/learn',
    lisensi: 'tautan saja', boleh_salin: false, folder: '07-freeCodeCamp',
    atribusi: 'Tautan ke sertifikasi gratis freeCodeCamp.org. Isi kurikulumnya berhak cipta freeCodeCamp.org dan tidak disalin. Tidak ada dukungan resmi dari freeCodeCamp.',
  },
  rujukan: {
    nama: 'Repo tanpa lisensi terbuka', pemilik: '-', repo: '',
    lisensi: 'tautan saja', boleh_salin: false, folder: null,
    atribusi: 'Dua repo yang tidak mencantumkan lisensi, sehingga isinya hak cipta penuh penulisnya. Hanya tautan ke repo itu sendiri yang dicantumkan.',
  },
  materi: {
    nama: 'Materi Belajar Networking', pemilik: 'kurikulum ini', repo: '',
    lisensi: 'CC BY-SA 4.0', boleh_salin: true, folder: null,
    atribusi: 'Tautan yang dirujuk modul-modul kurikulum ini sendiri, dikumpulkan dari materi/**/*.md beserta modul asalnya. Teks materi CC BY-SA 4.0; yang dikumpulkan hanya judul dan alamatnya.',
  },
}

// Bagian free-programming-books yang dipanen: [berkas, heading, jenis, bahasa, topik].
const FPB_BAGIAN = [
  ['books/free-programming-books-subjects.md', 'Networking', 'buku', 'en', ['fondasi']],
  ['books/free-programming-books-subjects.md', 'Security & Privacy', 'buku', 'en', ['keamanan']],
  ['books/free-programming-books-subjects.md', 'Cloud Computing', 'buku', 'en', ['cloud']],
  ['books/free-programming-books-subjects.md', 'Containers', 'buku', 'en', ['container']],
  ['books/free-programming-books-subjects.md', 'Operating Systems', 'buku', 'en', ['linux']],
  ['books/free-programming-books-langs.md', 'Linux', 'buku', 'en', ['linux']],
  ['courses/free-courses-en.md', 'Networking', 'kursus', 'en', ['fondasi']],
  ['courses/free-courses-en.md', 'Security', 'kursus', 'en', ['keamanan']],
  ['courses/free-courses-en.md', 'Linux', 'kursus', 'en', ['linux']],
  ['courses/free-courses-en.md', 'Cloud Computing', 'kursus', 'en', ['cloud']],
  ['courses/free-courses-en.md', 'DevOps', 'kursus', 'en', ['otomasi']],
  ['courses/free-courses-en.md', 'Docker', 'kursus', 'en', ['container']],
  ['courses/free-courses-en.md', 'Kubernetes', 'kursus', 'en', ['container']],
  ['courses/free-courses-id.md', 'Linux', 'kursus', 'id', ['linux']],
  ['courses/free-courses-id.md', 'Docker', 'kursus', 'id', ['container']],
  ['courses/free-courses-id.md', 'Kubernetes', 'kursus', 'id', ['container']],
  ['casts/free-podcasts-screencasts-en.md', 'Cloud computing', 'video', 'en', ['cloud']],
  ['casts/free-podcasts-screencasts-en.md', 'DevOps', 'video', 'en', ['otomasi']],
  ['more/free-programming-cheatsheets.md', 'Information Security', 'artikel', 'en', ['keamanan']],
  ['more/free-programming-cheatsheets.md', 'Shell Scripting', 'artikel', 'en', ['linux']],
  ['more/free-programming-interactive-tutorials-en.md', 'Bash', 'kursus', 'en', ['linux']],
]
// Judul di dalam bagian di atas yang BUKAN bahan belajar jaringan, walau ditaruh
// pemelihara repo di sana (Kafka dan ZeroMQ di "Networking", sains jejaring sosial).
const FPB_TOLAK = /kafka|zeromq|zguide|network science|wealth of networks|distributed systems for fun/i

// awesome: dua bagian utuh + butir terpilih dari bagian lain.
const AWESOME_BAGIAN = [['Networking', ['fondasi']], ['Security', ['keamanan']]]
// Butir keamanan yang tidak berhubungan dengan jaringan atau infrastruktur.
const AWESOME_TOLAK = /lockpicking|vehicle|evm|android security|gdpr|prompt injection|card games|hacking spots|executable packing/i
const AWESOME_PILIH = [
  [/^eBPF$/, ['linux', 'monitoring']], [/^Cloudflare$/, ['aplikasi', 'keamanan']],
  [/^Docker$/, ['container']], [/^Kubernetes$/, ['container']], [/^Terraform$/, ['otomasi']],
  [/^Ansible$/, ['otomasi']], [/^Vagrant$/, ['lab']], [/^Shell$/, ['linux']],
  [/^Prometheus$/, ['monitoring']], [/^Network Analysis$/, ['analisis-paket']],
  [/^Raspberry Pi$/, ['lab']],
]

// system-design-primer: heading -> topik.
const DESAIN_BAGIAN = [
  ['Latency vs throughput', ['desain', 'fondasi']], ['Availability patterns', ['desain']],
  ['Domain name system', ['aplikasi']], ['Content delivery network', ['aplikasi', 'provider']],
  ['Load balancer', ['desain', 'datacenter']], ['Reverse proxy (web server)', ['aplikasi', 'desain']],
  ['Communication', ['transport', 'aplikasi']], ['Security', ['keamanan']],
]

// roadmap.sh: hanya peta yang bersinggungan dengan kurikulum ini.
const PETA = [
  ['network-engineer', 'Network Engineer', ['fondasi', 'karier']], ['cyber-security', 'Cyber Security', ['keamanan', 'karier']],
  ['linux', 'Linux', ['linux']], ['devops', 'DevOps', ['otomasi', 'karier']], ['docker', 'Docker', ['container']],
  ['kubernetes', 'Kubernetes', ['container']], ['aws', 'AWS', ['cloud']], ['cloudflare', 'Cloudflare', ['aplikasi', 'cloud']],
  ['terraform', 'Terraform', ['otomasi']], ['shell-bash', 'Shell / Bash', ['linux']], ['system-design', 'System Design', ['desain']],
]

// Kata di judul yang menambah topik yang lebih tajam (deterministik, berlaku untuk semua sumber).
const KATA_TOPIK = [
  [/\bipv6\b/i, 'ipv6'], [/wi-?fi|wireless|802\.11/i, 'wireless'], [/\bsocket|network programming/i, 'pemrograman-jaringan'],
  [/\btcp\b|\budp\b|quic/i, 'transport'], [/\bhttps?\b|\btls\b|\bssl\b|\bdns\b/i, 'aplikasi'], [/\bbgp\b|\bospf\b|routing/i, 'routing'],
  [/wireshark|pcap|packet capture|tcpdump/i, 'analisis-paket'], [/\bvpn\b|ipsec|wireguard/i, 'wan-vpn'], [/firewall|iptables|nftables/i, 'firewall-nat'],
  [/kubernetes|docker|container/i, 'container'], [/\blinux\b|\bbash\b|\bshell\b/i, 'linux'], [/ansible|terraform|automation|netmiko/i, 'otomasi'],
  [/mikrotik|routeros/i, 'mikrotik'], [/cisco|ccna/i, 'cisco'], [/juniper|junos/i, 'juniper'], [/\brfc\b/i, 'standar'],
]

// ------------------------------------------------------------------ utilitas teks

const URL_RE = /https?:\/\/(?:[^\s()<>`]|\([^\s()<>]*\))+/
const KEPALA = /^(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/
const BUTIR = /^(\s*)(?:[*-]|\d+\.)\s+(.*)$/

function rapikan(t) {
  t = t.replace(/ /g, ' ').replace(/<a\s+[^>]*>\s*<\/a>|<a\s+[^>]*>|<\/a>/gi, '')
  for (const c of '|#[]_*()`') t = t.split('\\' + c).join(c)
  return t.replace(/\s+/g, ' ').trim()
}

/** '[judul](url) sisa' -> {judul, url, sisa} atau null. Kurung siku dihitung berimbang. */
function ambilTautan(t) {
  if (!t.startsWith('[')) return null
  let dalam = 0, i = 0, lolos = false
  for (; i < t.length; i++) {
    const c = t[i]
    if (lolos) { lolos = false; continue }
    if (c === '\\') { lolos = true; continue }
    if (c === '[') dalam++
    else if (c === ']' && --dalam === 0) break
  }
  if (i >= t.length) return null
  const judulMentah = t.slice(1, i)
  const sisa = t.slice(i + 1)
  if (!sisa.startsWith('(')) return null
  let awal = 1
  while (sisa[awal] === ' ') awal++
  const m = URL_RE.exec(sisa.slice(awal))
  if (!m || m.index !== 0) return null
  let ujung = awal + m[0].length
  while (sisa[ujung] === ' ') ujung++
  if (sisa[ujung] !== ')') return null
  const judul = rapikan(judulMentah.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')).replace(/\*\*/g, '').replace(/`/g, '')
  return { judul, url: m[0], sisa: sisa.slice(ujung + 1) }
}

function catatan(sisa) {
  sisa = sisa.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/:[a-z0-9_+-]+:/g, '')
    .replace(/(^|[^\w])(\*\*|\*|__|_)(\S.*?\S|\S)\2(?!\w)/g, '$1$3').replace(/[`*]/g, '')
    .replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')
  sisa = rapikan(sisa).replace(/^[-–—:,]\s*/, '')
  return sisa.length > 220 ? sisa.slice(0, 217).trimEnd() + '...' : sisa
}

/** Kunci pembanding URL: skema+host kecil, garis miring ujung dibuang. */
export function kunciUrl(u) {
  const p = new URL(u.trim())
  const jalur = p.pathname === '/' ? '' : p.pathname.replace(/\/$/, '')
  return `${p.protocol}//${p.host.toLowerCase()}${jalur}${p.search}`
}

/** FNV-1a 32 bit, heksadesimal 8 digit. Id stabil selama URL-nya sama. */
export function fnv1a(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16).padStart(8, '0')
}

function tambahTopik(judul, topik) {
  const s = new Set(topik)
  for (const [re, t] of KATA_TOPIK) if (re.test(judul)) s.add(t)
  return [...s]
}

/**
 * Butir daftar di bawah heading bernama `kepala`, sampai heading lain yang setingkat
 * atau lebih tinggi. Sub-heading di dalamnya ikut (mis. "### Linux" > "#### Debian").
 */
function butirDiBawah(teks, kepala) {
  const baris = teks.split('\n')
  const hasil = []
  let tingkat = 0
  for (const b of baris) {
    // CIU memakai "- ### Networking": heading yang ditulis sebagai butir daftar.
    const k = KEPALA.exec(b) || /^-\s+(#{1,6})\s+(.*)$/.exec(b)
    if (k) {
      const nama = rapikan(k[2]).replace(/:$/, '')
      if (tingkat && k[1].length <= tingkat) tingkat = 0
      if (!tingkat && nama.toLowerCase() === kepala.toLowerCase()) tingkat = k[1].length
      continue
    }
    if (!tingkat) continue
    const m = BUTIR.exec(b)
    if (!m) continue
    const isi = m[2].trim().replace(/^\[[ xX]\]\s+/, '')
    if (isi.startsWith('[') && isi.slice(0, 300).includes('](#')) continue
    const t = ambilTautan(isi)
    if (t && t.judul && t.judul !== t.url) hasil.push(t)
  }
  return hasil
}

const baca = p => fs.readFileSync(p, 'utf8')

// ------------------------------------------------------------------ tiap sumber

function panenFpb(akar) {
  const out = []
  for (const [berkas, kepala, jenis, bahasa, topik] of FPB_BAGIAN) {
    for (const t of butirDiBawah(baca(path.join(akar, berkas)), kepala)) {
      if (FPB_TOLAK.test(t.judul) || FPB_TOLAK.test(t.url)) continue
      out.push({ judul: t.judul, url: t.url, jenis, bahasa, topik: tambahTopik(t.judul, topik), catatan: catatan(t.sisa) })
    }
  }
  return out
}

function panenAwesome(akar) {
  const teks = baca(path.join(akar, 'readme.md'))
  const out = []
  for (const [kepala, topik] of AWESOME_BAGIAN)
    for (const t of butirDiBawah(teks, kepala)) {
      if (AWESOME_TOLAK.test(t.judul)) continue
      out.push({ judul: 'Awesome ' + t.judul, url: t.url, jenis: 'daftar', bahasa: 'en', topik: tambahTopik(t.judul, topik), catatan: catatan(t.sisa) })
    }
  for (const b of teks.split('\n')) {
    const m = BUTIR.exec(b)
    const t = m && ambilTautan(m[2].trim())
    if (!t) continue
    const pilih = AWESOME_PILIH.find(([re]) => re.test(t.judul))
    if (pilih) out.push({ judul: 'Awesome ' + t.judul, url: t.url, jenis: 'daftar', bahasa: 'en', topik: pilih[1], catatan: catatan(t.sisa) })
  }
  return out
}

function panenDesain(akar) {
  const teks = baca(path.join(akar, 'README.md'))
  // Daftar isi di kepala README memuat judul yang sama dengan bagiannya; mulai
  // memanen sesudah "System design topics: start here" supaya tidak terhitung dua kali.
  const mulai = teks.indexOf('## System design topics: start here')
  const badan = mulai >= 0 ? teks.slice(mulai) : teks
  const out = []
  for (const [kepala, topik] of DESAIN_BAGIAN)
    for (const t of butirDiBawah(badan, kepala))
      out.push({ judul: t.judul, url: t.url, jenis: 'artikel', bahasa: 'en', topik: tambahTopik(t.judul, topik), catatan: catatan(t.sisa) })
  return out
}

function panenPeta(akar) {
  const ada = new Set(fs.readdirSync(path.join(akar, 'roadmaps')))
  return PETA.filter(([slug]) => ada.has(slug)).map(([slug, nama, topik]) => ({
    judul: 'Peta belajar ' + nama, url: 'https://roadmap.sh/' + slug, jenis: 'daftar', bahasa: 'en', topik,
    catatan: 'Peta topik interaktif di roadmap.sh, berbahasa Inggris. Isinya tidak disalin ke sini.',
  }))
}

function panenCiu(akar) {
  return butirDiBawah(baca(path.join(akar, 'README.md')), 'Networking').map(t => ({
    judul: t.judul, url: t.url, jenis: /\(video\)/i.test(t.judul) || /youtube\.com/.test(t.url) ? 'video' : 'artikel',
    bahasa: 'en', topik: tambahTopik(t.judul, ['fondasi']), catatan: catatan(t.sisa),
  }))
}

function panenFcc(akar) {
  // Hanya sertifikasi yang memuat baris perintah Linux dan Bash; sertifikasi lain
  // (web, JavaScript, bahasa) di luar cakupan kurikulum jaringan.
  const re = /\[([^\]]+)\]\((https:\/\/www\.freecodecamp\.org\/learn\/relational-databases[^)\s]*)\)/
  for (const b of baca(path.join(akar, 'README.md')).split('\n')) {
    const m = re.exec(b)
    if (m) return [{
      judul: 'freeCodeCamp: ' + rapikan(m[1]), url: m[2], jenis: 'kursus', bahasa: 'en', topik: ['linux'],
      catatan: 'Kursus interaktif gratis bersertifikat; separuh awalnya latihan Bash dan terminal Linux. Isinya tidak disalin ke sini.',
    }]
  }
  return []
}

function panenRujukan() {
  return [
    { judul: 'Build Your Own X', url: 'https://github.com/codecrafters-io/build-your-own-x', jenis: 'daftar', bahasa: 'en', topik: ['pemrograman-jaringan', 'lab'],
      catatan: 'Tutorial membangun ulang teknologi dari nol; bagian "Network Stack" relevan untuk tahap transport. Repo tanpa lisensi, jadi dibuka langsung di GitHub.' },
    { judul: 'Getting a Gig', url: 'https://github.com/cassidoo/getting-a-gig', jenis: 'daftar', bahasa: 'en', topik: ['karier'],
      catatan: 'Kumpulan tautan tentang CV, portofolio, dan wawancara oleh Cassidy Williams. Repo tanpa lisensi, jadi dibuka langsung di GitHub.' },
  ]
}

// ---------------------------------------------------------- tautan dari materi sendiri

// Alamat contoh di dalam materi (perintah lab, dokumentasi alamat) bukan bacaan.
const BUKAN_BACAAN = /^(?:example\.(?:com|org|net)|[a-z0-9.-]*\.example|localhost|google\.com|www\.google\.com|get\.containerlab\.dev|\d{1,3}(?:\.\d{1,3}){3})$/i
const HOST_STANDAR = /(^|\.)(rfc-editor\.org|ietf\.org|ieee\.org|nist\.gov|iso\.org|itu\.int|3gpp\.org|cisecurity\.org|iana\.org)$/i
const HOST_VIDEO = /(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/i
const HOST_BUKU = /(^|\.)(book\.systemsapproach\.org|computer-networking\.info|intronetworks\.cs\.luc\.edu|beej\.us|hpbn\.co)$/i
const HOST_KURSUS = /(^|\.)(netacad\.com|skillsforall\.com|coursera\.org|edx\.org|ocw\.mit\.edu|skillbuilder\.aws|training\.linuxfoundation\.org)$/i
// `bahasa` = bahasa HALAMANNYA, bukan bahasa judul: judul di materi ditulis pengarang
// kurikulum dalam bahasa Indonesia ("FRRouting, RPKI dan BMP") walau halamannya
// berbahasa Inggris. Jadi yang dipakai domain: .id dan id.<situs> berarti Indonesia,
// kecuali situs .id yang terverifikasi berbahasa Inggris.
const HOST_ID = /\.id$|^id\./i
const HOST_ID_BERBAHASA_INGGRIS = /(^|\.)michaelpage\.co\.id$/i
const bahasaDari = host => HOST_ID.test(host) && !HOST_ID_BERBAHASA_INGGRIS.test(host) ? 'id' : 'en'

function jenisDariUrl(u) {
  const { hostname: h, pathname: p } = new URL(u)
  if (HOST_STANDAR.test(h)) return 'standar'
  if (HOST_VIDEO.test(h)) return 'video'
  if (HOST_BUKU.test(h)) return 'buku'
  if (HOST_KURSUS.test(h)) return 'kursus'
  if (/(^|\.)github\.com$/.test(h)) return /awesome/i.test(p) ? 'daftar' : 'alat'
  if (/^(docs|help|manual|wiki|documentation|man7|learn)\./.test(h) || /\/docs?\//.test(p) || /man7\.org$/.test(h)) return 'dokumentasi'
  return 'artikel'
}

function semuaMd(dir) {
  const out = []
  for (const n of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, n.name)
    if (n.isDirectory()) { if (n.name !== 'kode') out.push(...semuaMd(p)) }
    else if (n.name.endsWith('.md') && !['LICENSE.md', 'NOTICE.md'].includes(n.name)) out.push(p)
  }
  return out
}

/** Butir daftar ber-URL di luar blok kode dan di luar `kode sebaris`, beserta modul asalnya. */
export function panenMateri(akarMateri = path.join(REPO, 'materi')) {
  const perKunci = new Map()
  for (const berkas of semuaMd(akarMateri)) {
    const modul = path.relative(akarMateri, berkas).replace(/\\/g, '/').replace(/\.md$/, '')
    const tahap = modul.split('/')[0]
    let diKode = false
    for (const b of baca(berkas).split('\n')) {
      // Pagar juga dikenali bila menempel pada penanda daftar ("2. ```").
      if (/^\s*(?:(?:\d+[.)]|[-*+])\s+)?(```|~~~)/.test(b)) { diKode = !diKode; continue }
      if (diKode) continue
      const m = BUTIR.exec(b)
      if (!m) continue
      const isi = m[2].replace(/`[^`]*`/g, ' ')
      const u = URL_RE.exec(isi)
      if (!u) continue
      const url = u[0].replace(/[.,;:]+$/, '')
      let host
      try { host = new URL(url).hostname } catch { continue }
      if (BUKAN_BACAAN.test(host)) continue
      const md = /\[([^\]]+)\]\(\s*https?:/.exec(isi)
      let judul = md ? md[1] : isi.slice(0, u.index)
      judul = rapikan(judul.replace(/\*\*/g, '').replace(/[*_]/g, '')).replace(/\s*[:—–(-]+\s*$/, '').trim()
      if (judul.length < 3) judul = host.replace(/^www\./, '') + new URL(url).pathname.replace(/\/$/, '')
      if (judul.length > 160) continue // kalimat prosa yang kebetulan memuat URL, bukan butir rujukan
      const k = kunciUrl(url)
      const ada = perKunci.get(k)
      if (ada) { if (!ada.modul.includes(modul)) ada.modul.push(modul); continue }
      perKunci.set(k, {
        judul, url, jenis: jenisDariUrl(url), bahasa: bahasaDari(host),
        topik: tambahTopik(judul, topikUntukTahap(tahap)), catatan: '', modul: [modul],
      })
    }
  }
  return [...perKunci.values()]
}

// ------------------------------------------------------------------------ utama

const PEMANEN = {
  fpb: panenFpb, awesome: panenAwesome, desain: panenDesain, peta: panenPeta,
  ciu: panenCiu, fcc: panenFcc, rujukan: panenRujukan, materi: () => panenMateri(),
}

function commit(folder) {
  try { return execFileSync('git', ['-C', folder, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() }
  catch { return '' }
}

/** Satu URL satu butir per sumber; topik dari kemunculan lain digabung. */
function gabungKembar(entri) {
  const per = new Map()
  for (const e of entri) {
    const k = kunciUrl(e.url)
    const ada = per.get(k)
    if (!ada) { per.set(k, e); continue }
    for (const t of e.topik) if (!ada.topik.includes(t)) ada.topik.push(t)
    if (!ada.catatan && e.catatan) ada.catatan = e.catatan
  }
  return [...per.values()]
}

export function panen(akarMateri = AKAR_BAWAAN, keluar = KELUAR_BAWAAN, { diam = false } = {}) {
  fs.mkdirSync(keluar, { recursive: true })
  let total = 0
  for (const [kunci, fn] of Object.entries(PEMANEN)) {
    const { folder, ...meta } = SUMBER[kunci]
    const akar = folder ? path.join(akarMateri, folder) : akarMateri
    const entri = gabungKembar(fn(akar)).map(e => ({ id: `${kunci}-${fnv1a(kunciUrl(e.url))}`, ...e }))
    const ids = new Set(entri.map(e => e.id))
    if (ids.size !== entri.length) throw new Error(`${kunci}: tabrakan id (dua URL berbeda dengan hash sama)`)
    const isi = { sumber: { kunci, ...meta, commit: folder ? commit(akar) : '' }, entri }
    fs.writeFileSync(path.join(keluar, kunci + '.json'), JSON.stringify(isi, null, 1) + '\n')
    total += entri.length
    if (!diam) console.log(`${kunci.padEnd(8)} ${String(entri.length).padStart(5)} entri`)
  }
  if (!diam) console.log(`total    ${String(total).padStart(5)} entri -> ${path.relative(process.cwd(), keluar) || keluar}/`)
  return total
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const akar = process.argv[2] || AKAR_BAWAAN
  if (!fs.existsSync(akar)) { console.error(`folder materi-belajar tidak ada: ${akar}`); process.exit(2) }
  panen(akar, process.argv[3] || KELUAR_BAWAAN)
}

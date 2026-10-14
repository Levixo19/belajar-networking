import raw from '../generated/profesi.json'
import { getModule } from './content'

export type Rumpun = 'inti' | 'infrastruktur' | 'keamanan' | 'operasi' | 'devops' | 'dukungan' | 'tatakelola'
export interface Sertifikasi { nama: string; penerbit: string; tingkat?: string }
export interface Profesi {
  id: string; nama: string; rumpun: Rumpun; ringkas: string; jenjang: 'pemula' | 'menengah' | 'senior'
  harian: string[]; keahlian: string[]; alat: string[]; sertifikasi: Sertifikasi[]
  masuk: string; naik: string[]; dekat: string[]; modul: string[]; proyek: string[]
  gaji?: { rentang: string; konteks?: string; sumber: string; url: string }
  sumber: { judul: string; url: string }[]
  bacaan: string | null
}

export const PROFESI = raw as unknown as Profesi[]
export const byId = new Map(PROFESI.map(p => [p.id, p]))

export const RUMPUN: { id: Rumpun; label: string; pendek: string; desc: string }[] = [
  { id: 'inti', label: 'Inti jaringan', pendek: 'Inti', desc: 'Network engineer dan administrator, titik tumpu seluruh ekosistem.' },
  { id: 'infrastruktur', label: 'Jaringan, telekomunikasi & cloud', pendek: 'Infrastruktur', desc: 'Merancang dan menjalankan jalur yang dilewati semua data.' },
  { id: 'keamanan', label: 'Keamanan jaringan & siber', pendek: 'Keamanan', desc: 'Menjaga batas, mendeteksi ancaman, dan memulihkan setelah serangan.' },
  { id: 'operasi', label: 'Administrasi sistem & data', pendek: 'Operasi', desc: 'Server, basis data, dan penyimpanan yang hidup di atas jaringan.' },
  { id: 'devops', label: 'DevOps, SRE & otomasi', pendek: 'DevOps', desc: 'Menulis kode agar infrastruktur dapat diandalkan dan diulang.' },
  { id: 'dukungan', label: 'Dukungan teknis & lapangan', pendek: 'Dukungan', desc: 'Garis depan: pengguna, kabel, perangkat, dan aset.' },
  { id: 'tatakelola', label: 'Tata kelola & konsultasi', pendek: 'Tata kelola', desc: 'Menerjemahkan bisnis, aturan, dan risiko menjadi keputusan teknis.' },
]
export const rumpunMeta = (r: Rumpun) => RUMPUN.find(x => x.id === r)!

/** Label ringkas untuk graf, agar tidak bertabrakan di kanvas. */
export const LABEL_GRAF: Record<string, string> = {
  'network-engineer': 'Network Engineer', 'network-administrator': 'Network Admin',
  'network-architect': 'Network Architect', 'cloud-network-engineer': 'Cloud Network', 'wireless-network-engineer': 'Wireless',
  'telecom-engineer': 'Telekomunikasi', 'voip-engineer': 'VoIP', 'data-center-engineer': 'Data Center', 'noc-technician': 'NOC',
  'network-security-engineer': 'Network Security', 'cybersecurity-analyst': 'Cyber Analyst', 'penetration-tester': 'Pentester',
  'security-architect': 'Security Architect', 'incident-responder': 'Incident Response',
  'system-administrator': 'SysAdmin', 'database-administrator': 'DBA', 'storage-administrator': 'Storage Admin',
  'system-engineer': 'System Engineer', 'it-operations-manager': 'IT Ops Manager',
  'devops-engineer': 'DevOps', 'site-reliability-engineer': 'SRE', 'cloud-infrastructure-engineer': 'Cloud Infra',
  'automation-engineer': 'Automation', 'it-support-technician': 'IT Support', 'field-network-technician': 'Teknisi Lapangan',
  'hardware-engineer': 'Hardware', 'it-asset-manager': 'IT Asset', 'it-consultant': 'Konsultan TI', 'it-auditor': 'Auditor TI',
  'disaster-recovery-specialist': 'DR Specialist', 'solution-architect': 'Solution Architect', 'scrum-master-infrastruktur': 'Scrum Master',
}

export const JENJANG_LABEL = { pemula: 'Bisa dimulai dari nol', menengah: 'Butuh pengalaman 2-4 tahun', senior: 'Peran senior' } as const

/** Sisi graf tak berarah tanpa duplikat. kind 'naik' menang atas 'dekat'. */
export function edges(): { a: string; b: string; kind: 'naik' | 'dekat' }[] {
  const out = new Map<string, { a: string; b: string; kind: 'naik' | 'dekat' }>()
  for (const p of PROFESI) {
    for (const [list, kind] of [[p.naik, 'naik'], [p.dekat, 'dekat']] as const) {
      for (const q of list) {
        if (!byId.has(q) || q === p.id) continue
        const key = [p.id, q].sort().join('|')
        const cur = out.get(key)
        if (!cur || (cur.kind === 'dekat' && kind === 'naik')) out.set(key, { a: p.id, b: q, kind })
      }
    }
  }
  return [...out.values()]
}

export function neighbors(id: string): Set<string> {
  const s = new Set<string>()
  for (const e of edges()) { if (e.a === id) s.add(e.b); if (e.b === id) s.add(e.a) }
  return s
}

/** Kesiapan: proporsi modul prasyarat yang sudah tuntas. */
export function readiness(p: Profesi, progress: Record<string, string>) {
  const mods = p.modul.filter(m => getModule(m))
  const done = mods.filter(m => progress[m] === 'done')
  return { pct: mods.length ? done.length / mods.length : 0, done: done.length, total: mods.length, mods }
}

/**
 * Jalur perpindahan paling realistis (Dijkstra berbobot). Melewati peran senior sebagai
 * perantara diberi biaya tambahan, karena orang jarang menjadi arsitek hanya untuk pindah
 * ke peran lain. Relasi "naik" sedikit lebih murah daripada "dekat".
 */
export function shortestPath(from: string, to: string): string[] | null {
  if (from === to) return [from]
  if (!byId.has(from) || !byId.has(to)) return null
  const adj = new Map<string, { n: string; w: number }[]>()
  const add = (a: string, b: string, w: number) => adj.set(a, [...(adj.get(a) || []), { n: b, w }])
  for (const e of edges()) { const w = e.kind === 'naik' ? 1 : 1.2; add(e.a, e.b, w); add(e.b, e.a, w) }
  const lewat = (id: string) => { const j = byId.get(id)?.jenjang; return j === 'senior' ? 2.5 : j === 'menengah' ? 0.4 : 0 }
  const dist = new Map<string, number>([[from, 0]])
  const prev = new Map<string, string>()
  const open = new Set([from])
  while (open.size) {
    let cur = '', best = Infinity
    for (const n of open) { const d = dist.get(n)!; if (d < best) { best = d; cur = n } }
    open.delete(cur)
    if (cur === to) break
    for (const { n, w } of adj.get(cur) || []) {
      const d = best + w + (n === to ? 0 : lewat(n))
      if (d < (dist.get(n) ?? Infinity)) { dist.set(n, d); prev.set(n, cur); open.add(n) }
    }
  }
  if (!dist.has(to)) return null
  const path = [to]
  while (path[0] !== from) path.unshift(prev.get(path[0])!)
  return path
}

/** Modul yang dibutuhkan profesi tujuan tetapi tidak termasuk bekal profesi asal. */
export function gapModules(from: Profesi, to: Profesi): string[] {
  const have = new Set(from.modul)
  return to.modul.filter(m => !have.has(m) && getModule(m))
}

/* ---------------------------------------------------------------- Kuis cocok */
export interface QuizOpt { label: string; w: Partial<Record<string, number>> }
export interface QuizQ { q: string; opts: QuizOpt[] }

export const QUIZ: QuizQ[] = [
  { q: 'Hari kerja ideal Anda paling banyak dihabiskan untuk apa?', opts: [
    { label: 'Merancang sesuatu di papan tulis sebelum dibangun', w: { 'arsitektur-desain': 3, 'konsultasi-bisnis': 1 } },
    { label: 'Mengetik perintah dan melihat sistem berubah', w: { 'routing-switching': 2, linux: 2, troubleshooting: 1 } },
    { label: 'Menulis skrip supaya pekerjaan berulang hilang', w: { 'scripting-python': 3, 'otomasi-iac': 2, 'ci-cd': 1 } },
    { label: 'Turun ke lokasi, memegang kabel dan perangkat', w: { 'kabel-fisik': 3, 'hardware-elektronika': 2, 'wireless-rf': 1 } },
  ] },
  { q: 'Saat ada insiden jam dua pagi, peran apa yang paling Anda nikmati?', opts: [
    { label: 'Mencari jejak penyerang di log', w: { 'analisis-log-siem': 3, 'respons-insiden': 3 } },
    { label: 'Memulihkan layanan secepat mungkin', w: { 'monitoring-observability': 2, troubleshooting: 3 } },
    { label: 'Menenangkan pengguna dan menjelaskan apa yang terjadi', w: { 'layanan-pelanggan': 3, 'komunikasi-dokumentasi': 2 } },
    { label: 'Memastikan rencana cadangan memang jalan', w: { 'kelangsungan-bisnis': 3, 'storage-backup': 2 } },
  ] },
  { q: 'Masalah mana yang paling membuat penasaran?', opts: [
    { label: 'Kenapa sinyal Wi-Fi drop di lantai tiga', w: { 'wireless-rf': 3, telekomunikasi: 1 } },
    { label: 'Bagaimana penyerang bisa lolos dari firewall', w: { 'keamanan-jaringan': 2, 'keamanan-ofensif': 3 } },
    { label: 'Kenapa query lambat padahal jaringan sehat', w: { database: 3, 'storage-backup': 1, linux: 1 } },
    { label: 'Bagaimana aplikasi tetap hidup saat satu region cloud mati', w: { cloud: 3, 'container-kubernetes': 2, 'kelangsungan-bisnis': 1 } },
  ] },
  { q: 'Bagaimana Anda paling suka bekerja dengan orang lain?', opts: [
    { label: 'Memimpin tim dan mengatur prioritas', w: { 'manajemen-tim': 3, 'manajemen-proyek-agile': 2 } },
    { label: 'Memberi saran ke klien atau manajemen', w: { 'konsultasi-bisnis': 3, 'komunikasi-dokumentasi': 1 } },
    { label: 'Fokus sendiri, lalu menyerahkan hasil yang rapi', w: { 'otomasi-iac': 1, 'routing-switching': 1, 'scripting-python': 1 } },
    { label: 'Membantu banyak orang dengan masalah kecil setiap hari', w: { 'layanan-pelanggan': 3, 'itsm-itil': 2 } },
  ] },
  { q: 'Dokumen mana yang paling tidak membuat Anda bosan?', opts: [
    { label: 'Standar dan regulasi, lalu memeriksa kepatuhannya', w: { 'tata-kelola-kepatuhan': 3, 'kelangsungan-bisnis': 1 } },
    { label: 'Diagram topologi dan rencana kapasitas', w: { 'arsitektur-desain': 2, 'fundamental-jaringan': 2 } },
    { label: 'Runbook dan postmortem insiden', w: { 'monitoring-observability': 2, 'respons-insiden': 1, 'itsm-itil': 1 } },
    { label: 'Inventaris perangkat dan lisensi', w: { 'manajemen-aset': 3, 'itsm-itil': 1 } },
  ] },
  { q: 'Teknologi mana yang ingin Anda kuasai lima tahun lagi?', opts: [
    { label: 'Jaringan operator: fiber, 5G, satelit', w: { telekomunikasi: 3, 'wireless-rf': 1, 'kabel-fisik': 1 } },
    { label: 'Platform cloud dan Kubernetes', w: { cloud: 2, 'container-kubernetes': 3, 'ci-cd': 1 } },
    { label: 'Keamanan berbasis zero trust dan identitas', w: { 'identitas-akses': 3, 'keamanan-jaringan': 2, 'kriptografi-pki': 1 } },
    { label: 'Pusat data, listrik, dan pendingin', w: { 'data-center-fasilitas': 3, virtualisasi: 1, 'storage-backup': 1 } },
  ] },
]

export function scoreQuiz(picks: (number | null)[]) {
  const w: Record<string, number> = {}
  QUIZ.forEach((q, i) => {
    const o = picks[i] == null ? null : q.opts[picks[i]!]
    if (o) for (const [k, v] of Object.entries(o.w)) w[k] = (w[k] || 0) + (v || 0)
  })
  const ranked = PROFESI.map(p => {
    const hits = p.keahlian.filter(k => w[k])
    const score = hits.reduce((a, k) => a + w[k], 0) / Math.sqrt(p.keahlian.length || 1)
    return { p, score, hits }
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score)
  return ranked.slice(0, 3)
}

export const KEAHLIAN_LABEL: Record<string, string> = {
  'fundamental-jaringan': 'Fundamental jaringan', 'routing-switching': 'Routing & switching', 'wireless-rf': 'Wireless & RF',
  telekomunikasi: 'Telekomunikasi', 'voip-uc': 'VoIP & unified comms', 'kabel-fisik': 'Kabel & instalasi fisik',
  'data-center-fasilitas': 'Fasilitas data center', cloud: 'Cloud', virtualisasi: 'Virtualisasi',
  'container-kubernetes': 'Container & Kubernetes', linux: 'Linux', 'windows-server': 'Windows Server',
  'scripting-python': 'Scripting & Python', 'otomasi-iac': 'Otomasi & IaC', 'ci-cd': 'CI/CD',
  'keamanan-jaringan': 'Keamanan jaringan', 'keamanan-ofensif': 'Keamanan ofensif', 'analisis-log-siem': 'Analisis log & SIEM',
  'respons-insiden': 'Respons insiden', 'kriptografi-pki': 'Kriptografi & PKI', 'identitas-akses': 'Identitas & akses',
  'monitoring-observability': 'Monitoring & observability', troubleshooting: 'Troubleshooting', database: 'Basis data',
  'storage-backup': 'Storage & backup', 'hardware-elektronika': 'Hardware & elektronika', 'manajemen-aset': 'Manajemen aset',
  'itsm-itil': 'ITSM & ITIL', 'manajemen-proyek-agile': 'Proyek & agile', 'arsitektur-desain': 'Arsitektur & desain',
  'tata-kelola-kepatuhan': 'Tata kelola & kepatuhan', 'kelangsungan-bisnis': 'Kelangsungan bisnis',
  'layanan-pelanggan': 'Layanan pelanggan', 'komunikasi-dokumentasi': 'Komunikasi & dokumentasi', 'manajemen-tim': 'Memimpin tim',
  'konsultasi-bisnis': 'Konsultasi bisnis',
}

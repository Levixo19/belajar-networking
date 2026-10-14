import { bundle, type SearchDoc } from './content'

export interface Hit { doc: SearchDoc; score: number; snippet: string }

const docs = bundle.search
const lower = docs.map(d => ({ d, t: d.title.toLowerCase(), num: d.num, text: d.text.toLowerCase() }))

function escapeRe(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

export function search(qRaw: string, limit = 20): Hit[] {
  const q = qRaw.trim().toLowerCase()
  if (!q) return []
  const terms = q.split(/\s+/).filter(Boolean)
  const hits: Hit[] = []
  for (const { d, t, num, text } of lower) {
    let score = 0
    for (const term of terms) {
      if (t.includes(term)) score += 12
      if (num.includes(term)) score += 8
      if (t.startsWith(term)) score += 6
      if (text.indexOf(term) >= 0) score += 3
    }
    if (terms.every(term => t.includes(term))) score += 10
    if (score > 0) hits.push({ doc: d, score, snippet: makeSnippet(d.text, terms) })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

function makeSnippet(text: string, terms: string[]): string {
  const low = text.toLowerCase()
  let pos = -1
  for (const term of terms) { const i = low.indexOf(term); if (i >= 0 && (pos < 0 || i < pos)) pos = i }
  if (pos < 0) return text.slice(0, 120) + '…'
  const start = Math.max(0, pos - 40)
  return (start > 0 ? '…' : '') + text.slice(start, start + 150) + '…'
}

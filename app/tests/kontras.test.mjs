// Kontras token warna (WCAG 2.x), dibaca langsung dari src/index.css untuk KEDUA tema.
// Teks >= 4,5:1; batas kontrol dan ikon >= 3:1. Warna rgba dikomposisikan di atas
// latarnya lebih dulu, karena itulah yang benar-benar dilihat mata.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CSS = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/index.css'), 'utf8')
function blok(sel) {
  const i = CSS.indexOf(sel + ' {')
  assert.ok(i >= 0, sel)
  const isi = CSS.slice(i, CSS.indexOf('\n}', i))
  return Object.fromEntries([...isi.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]))
}
const terang = blok(':root')
const gelap = { ...terang, ...blok(':root[data-theme="dark"]') }

function rgba(v) {
  let m = v.match(/^#([0-9a-f]{6})$/i)
  if (m) return [...m[1].match(/../g).map(h => parseInt(h, 16)), 1]
  m = v.match(/^rgba?\(([^)]+)\)$/)
  if (m) { const p = m[1].split(',').map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
  throw new Error('warna tak dikenal: ' + v)
}
const atas = (fg, bg) => { const [r, g, b, a] = rgba(fg), [R, G, B] = rgba(bg); return [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a), 1] }
const lum = c => { const [r, g, b] = c.slice(0, 3).map(x => x / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const rasio = (fg, bg) => { const a = lum(atas(fg, bg)), b = lum(rgba(bg)); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }

for (const [nama, t] of [['terang', terang], ['gelap', gelap]]) {
  const latar = ['bg', 'surface', 'surface-2']
  test(`${nama}: token teks >= 4,5:1 di bg, surface, surface-2`, () => {
    for (const f of ['text', 'text-muted', 'text-faint', 'primary', 'ok', 'warn', 'no', 'accent'])
      for (const b of latar) assert.ok(rasio(t[f], t[b]) >= 4.5, `--${f} di --${b}: ${rasio(t[f], t[b]).toFixed(2)}`)
  })
  test(`${nama}: teks di atas aksen dan tinta >= 4,5:1`, () => {
    assert.ok(rasio(t['on-primary'], t.primary) >= 4.5, `on-primary: ${rasio(t['on-primary'], t.primary).toFixed(2)}`)
    assert.ok(rasio(t['on-primary'], t['primary-hover']) >= 4.5, 'on-primary di primary-hover')
    assert.ok(rasio(t['fg-contrast'], t.fg) >= 4.5, 'fg-contrast di fg')
    assert.ok(rasio(t['fg-contrast'], t.no) >= 4.5, 'tombol hapus: fg-contrast di --no')
  })
  test(`${nama}: label callout terbaca di latar lembutnya`, () => {
    for (const k of ['ok', 'warn', 'no']) {
      const lembut = rgba(t[`${k}-soft`])[3] < 1 ? `rgb(${atas(t[`${k}-soft`], t.surface).slice(0, 3).map(Math.round).join(',')})` : t[`${k}-soft`]
      assert.ok(rasio(t[k], lembut) >= 4.5, `--${k} di --${k}-soft: ${rasio(t[k], lembut).toFixed(2)}`)
    }
  })
  test(`${nama}: batas kontrol >= 3:1`, () => {
    for (const b of latar) assert.ok(rasio(t['border-control'], t[b]) >= 3, `--border-control di --${b}: ${rasio(t['border-control'], t[b]).toFixed(2)}`)
  })
}

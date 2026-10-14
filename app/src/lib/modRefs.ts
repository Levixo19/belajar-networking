import { moduleById, linearModules } from './content'

const RE = /^((?:\d\d-[a-z0-9-]+|lab|referensi)\/[0-9a-z][0-9a-z-]*?)(?:\.md)?$/

/** Cari modul dari rujukan teks: ID lengkap (`05-transport/02-tcp`) atau bentuk pendek (`05-transport/02`). */
export function resolveModRef(text: string) {
  const m = text.trim().match(RE)
  if (!m) return null
  const ref = m[1]
  if (/\/\d\d-\d\d$/.test(ref)) return null // rentang seperti 01-03, bukan satu modul
  const exact = moduleById.get(ref)
  if (exact) return exact
  const [stage, file] = ref.split('/')
  if (!/^\d+$/.test(file)) return null
  return linearModules.find(x => x.stage === stage && x.id.split('/')[1].startsWith(file + '-')) ?? null
}

/**
 * Ubah <code> berisi ID modul menjadi tautan ke modul itu (judul sebagai tooltip).
 * Kode di dalam blok <pre> tidak disentuh. Aman dipanggil berulang.
 */
export function linkModuleRefs(root: HTMLElement) {
  root.querySelectorAll('code').forEach(code => {
    if (code.closest('pre, a')) return
    const mod = resolveModRef(code.textContent || '')
    if (!mod) return
    const a = document.createElement('a')
    a.href = '#/m/' + encodeURI(mod.id)
    a.className = 'mod-ref'
    a.title = (mod.num ? mod.num + ' ' : '') + mod.title
    code.replaceWith(a)
    a.appendChild(code)
  })
}

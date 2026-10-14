// Hook pemuat untuk `node --test`: membuat kode src/lib (yang ditulis untuk Vite)
// bisa diimpor langsung oleh Node tanpa bundler dan tanpa dependensi tambahan.
// Node 24 sudah membuang anotasi tipe dari .ts sendiri; yang tidak ia lakukan adalah
// (1) menebak ekstensi dari `import './srs'` dan (2) menerima `import x from './a.json'`
// tanpa atribut `with { type: 'json' }`. Dua hal itu saja yang ditambal di sini.
import { register } from 'node:module'

register('data:text/javascript,' + encodeURIComponent(`
  import { existsSync } from 'node:fs'
  import { fileURLToPath } from 'node:url'
  export async function resolve(spec, ctx, next) {
    const relatif = spec.startsWith('./') || spec.startsWith('../')
    if (relatif && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec) && ctx.parentURL?.startsWith('file:')) {
      for (const ext of ['.ts', '.tsx', '/index.ts']) {
        const url = new URL(spec + ext, ctx.parentURL)
        if (existsSync(fileURLToPath(url))) return next(url.href, ctx)
      }
    }
    if (spec.endsWith('.json')) {
      const r = await next(spec, ctx)
      return { ...r, importAttributes: { type: 'json' } }
    }
    return next(spec, ctx)
  }
`))

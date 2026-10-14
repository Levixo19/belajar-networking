import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { getDiagram } from '../diagrams'
import { InlineQuiz, CardCheckpoint, PhotoFig, Lightbox, type QuizItem } from './learn'
import { toolBySlug } from '../tools'
import { gameBySlug } from '../games'
import { linkModuleRefs } from '../lib/modRefs'

interface Slot { el: HTMLElement; node: ReactNode; key: string }

/**
 * Merender HTML materi lalu menanam komponen React interaktif pada
 * placeholder <div data-widget="..."> yang dihasilkan build-content.mjs.
 */
export default function RichProse({ html, moduleId }: { html: string; moduleId: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [zoomFig, setZoomFig] = useState<string | null>(null)

  // Rujukan modul (`05-transport/02`) menjadi tautan
  useEffect(() => { if (ref.current) linkModuleRefs(ref.current) }, [html])

  // Tombol salin pada blok kode
  useEffect(() => {
    const root = ref.current
    if (!root) return
    root.querySelectorAll('pre').forEach(pre => {
      const p = pre as HTMLElement
      if (p.dataset.copyReady || p.closest('.fig-ascii')) return
      p.dataset.copyReady = '1'
      const code = pre.querySelector('code')
      const text = code ? (code as HTMLElement).innerText : p.innerText
      const btn = document.createElement('button')
      btn.className = 'copy-btn'; btn.type = 'button'; btn.textContent = 'Salin'
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(text).then(() => {
          btn.textContent = 'Tersalin'
          setTimeout(() => { btn.textContent = 'Salin' }, 1300)
        })
      })
      pre.appendChild(btn)
    })
  }, [html])

  // Perbesar diagram ASCII
  useEffect(() => {
    const root = ref.current
    if (!root) return
    const figs = Array.from(root.querySelectorAll('.fig-ascii')) as HTMLElement[]
    const offs: (() => void)[] = []
    figs.forEach(f => {
      const pre = f.querySelector('pre')
      if (!pre) return
      const h = () => setZoomFig(pre.textContent || '')
      f.querySelector('.fig-zoom')?.addEventListener('click', h)
      offs.push(() => f.querySelector('.fig-zoom')?.removeEventListener('click', h))
    })
    return () => offs.forEach(o => o())
  }, [html])

  // Kumpulkan placeholder widget → portal
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) { setSlots([]); return }
    const found: Slot[] = []
    const els = Array.from(root.querySelectorAll('[data-widget]')) as HTMLElement[]
    els.forEach((el, i) => {
      const kind = el.dataset.widget
      const key = `${moduleId}:${kind}:${el.dataset.id || el.dataset.slug || i}:${i}`
      let node: ReactNode = null
      if (kind === 'diagram') {
        const D = getDiagram(el.dataset.id || '')
        if (D) node = <D />
      } else if (kind === 'quiz') {
        try {
          const items = JSON.parse(decodeURIComponent(el.dataset.payload || '[]')) as QuizItem[]
          if (items.length) node = <InlineQuiz id={`${moduleId}#${el.dataset.id}`} items={items} />
        } catch { /* payload rusak — lewati */ }
      } else if (kind === 'checkpoint') {
        node = <CardCheckpoint moduleId={moduleId} from={Number(el.dataset.from || 0)} count={Number(el.dataset.count || 2)} />
      } else if (kind === 'photo') {
        node = <PhotoFig src={el.dataset.src || ''} caption={el.dataset.caption} credit={el.dataset.credit} href={el.dataset.href} />
      } else if (kind === 'tool') {
        const T = toolBySlug(el.dataset.slug || '')
        if (T) node = <div className="wg-tool"><div className="wg-lb">Coba langsung</div><T /></div>
      } else if (kind === 'game') {
        const G = gameBySlug(el.dataset.slug || '')
        if (G) node = <div className="wg-tool"><div className="wg-lb">Latihan cepat</div><G /></div>
      }
      if (node) found.push({ el, node, key })
    })
    setSlots(found)
  }, [html, moduleId])

  return (
    <>
      <div ref={ref} className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      {slots.map(s => createPortal(s.node, s.el, s.key))}
      {zoomFig !== null && (
        <Lightbox label="Diagram diperbesar" onTutup={() => setZoomFig(null)}>
          <pre className="lb-ascii" onClick={e => e.stopPropagation()}>{zoomFig}</pre>
        </Lightbox>
      )}
    </>
  )
}

import { useEffect, useRef } from 'react'

export default function ProseView({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    root.querySelectorAll('pre').forEach(pre => {
      if ((pre as HTMLElement).dataset.copyReady) return
      ;(pre as HTMLElement).dataset.copyReady = '1'
      const code = pre.querySelector('code')
      const text = code ? (code as HTMLElement).innerText : (pre as HTMLElement).innerText
      const btn = document.createElement('button')
      btn.className = 'copy-btn'
      btn.type = 'button'
      btn.textContent = 'Salin'
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(text).then(() => {
          btn.textContent = 'Tersalin ✓'
          setTimeout(() => { btn.textContent = 'Salin' }, 1300)
        })
      })
      pre.appendChild(btn)
    })
  }, [html])
  return <div ref={ref} className="prose" dangerouslySetInnerHTML={{ __html: html }} />
}

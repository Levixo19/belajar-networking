import type { ReactNode } from 'react'
import { Sampul, type SampulProps } from '../lib/sampul'

/** Kepala halaman: judul dan pengantar di kiri, sampul generatif di kanan. Sampulnya
 *  hiasan (aria-hidden); semua informasi ada di teks kiri. */
export default function KepalaBersampul({ sampul, children }: { sampul: SampulProps; children: ReactNode }) {
  return (
    <header className="kepala-bersampul fade-up">
      <div className="min-w-0">{children}</div>
      <div className="kepala-sampul"><Sampul lebar={560} tinggi={400} {...sampul} /></div>
    </header>
  )
}

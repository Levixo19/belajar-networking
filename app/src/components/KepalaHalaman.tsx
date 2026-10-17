import type { ReactNode } from 'react'

/** Kepala halaman: judul, catatan kecil, dan pengantar di kiri; visual yang BERMAKNA di
 *  kanan (peta, lencana, kartu katalog), bukan hiasan acak. Visualnya aria-hidden bila
 *  isinya sudah tertulis di teks; yang membawa data sendiri memberi label sendiri. */
export default function KepalaHalaman({ catatan, judul, children, visual }: {
  catatan?: ReactNode; judul: ReactNode; children?: ReactNode; visual?: ReactNode
}) {
  return (
    <header className={`kepala-halaman ${visual ? '' : 'tanpa-visual'}`}>
      <div className="min-w-0">
        <h1 className="kepala-judul">{judul}</h1>
        {/* Catatan di BAWAH judul, bukan label kecil di atasnya (pola eyebrow templat). */}
        {catatan && <p className="kepala-catatan">{catatan}</p>}
        {children}
      </div>
      {visual && <div className="kepala-visual">{visual}</div>}
    </header>
  )
}

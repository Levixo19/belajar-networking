/** Tumpukan kartu katalog perpustakaan berisi entri pustaka SUNGGUHAN: nomor panggil,
 *  judul, jenis, bahasa, lisensi. Garis baris, lubang tali di kaki kartu, dan ketikan
 *  mesin tik: artefak dari dunia perpustakaan, bukan hiasan generatif. */
export default function KartuKatalog({ entri }: { entri: { id: string; judul: string; jenis: string; bahasa: string; lisensi?: string; sumber?: string }[] }) {
  const tiga = entri.slice(0, 3)
  return (
    <div className="katalog" aria-hidden="true">
      {tiga.map((e, i) => (
        <div key={e.id} className="katalog-kartu" style={{ ['--i' as string]: i }}>
          <div className="katalog-baris katalog-no">{e.id.toUpperCase()}</div>
          <div className="katalog-baris katalog-judul">{e.judul}</div>
          <div className="katalog-baris">{e.jenis} . {e.bahasa === 'id' ? 'Indonesia' : 'Inggris'}</div>
          <div className="katalog-baris">{e.lisensi || e.sumber || ''}</div>
          <span className="katalog-lubang" />
        </div>
      ))}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { Wawasan } from '../lib/content'
import { linkModuleRefs } from '../lib/modRefs'

// Tiga lapis di sekitar materi untuk pembaca awam. Isinya dari data/kasus/*.json,
// divalidasi saat build: kasus tanpa sumber tidak pernah sampai ke sini.

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
/** "2021-10-04" -> "4 Oktober 2021"; "2021-10" -> "Oktober 2021"; "2021" -> "2021". */
export function tanggalKasus(t: string) {
  const [y, m, d] = t.split('-').map(Number)
  if (d) return `${d} ${BULAN[m - 1]} ${y}`
  if (m) return `${BULAN[m - 1]} ${y}`
  return String(y)
}

const Html = ({ html, as: Tag = 'p', className }: { html: string; as?: 'p' | 'span' | 'div' | 'dd'; className?: string }) =>
  <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />

export function Intinya({ w }: { w: NonNullable<Wawasan['intinya']> }) {
  return (
    <section id="intinya" className="intinya" aria-labelledby="judul-intinya">
      <h2 id="judul-intinya" className="label-atlas">Intinya</h2>
      <Html html={w.satuKalimat} className="intinya-kalimat" />
      <div className="intinya-dua">
        <div>
          <h3 className="intinya-sub">Bayangkan</h3>
          <Html html={w.analogi} />
        </div>
        <div>
          <h3 className="intinya-sub">Di mana Anda menemuinya</h3>
          <Html html={w.kenapaPenting} />
        </div>
      </div>
      <dl className="istilah">
        {w.istilah.map(t => (
          <div key={t.kata}>
            <dt>{t.kata}</dt>
            <Html as="dd" html={t.arti} />
          </div>
        ))}
      </dl>
    </section>
  )
}

export function KasusNyata({ k }: { k: NonNullable<Wawasan['kasus']> }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => { if (ref.current) linkModuleRefs(ref.current) }, [k])
  return (
    <section ref={ref} id="kasus-nyata" className="kasus sudut-plat" aria-labelledby="judul-kasus">
      <div className="kasus-atas">
        <span className="kasus-jenis">{k.jenis === 'insiden' ? 'Insiden nyata' : 'Praktik nyata'}</span>
        <span className="kasus-tempat">{k.diMana}, {tanggalKasus(k.kapan)}</span>
      </div>
      <h2 id="judul-kasus" className="kasus-judul">{k.judul}</h2>
      <Html html={k.ringkas} className="kasus-ringkas" />

      <ol className="kronologi" aria-label="Kronologi">
        {k.kronologi.map((e, i) => (
          <li key={i}>
            <span className="kronologi-waktu">{e.waktu}</span>
            <Html html={e.peristiwa} />
          </li>
        ))}
      </ol>

      <div className="kasus-dua">
        <div>
          <h3 className="kasus-sub">Akar masalah</h3>
          <Html html={k.akarMasalah} />
        </div>
        <div>
          <h3 className="kasus-sub">Kaitannya dengan modul ini</h3>
          <Html html={k.kaitan} />
        </div>
      </div>

      <h3 className="kasus-sub mt-8">Pelajarannya</h3>
      <ul className="kasus-pelajaran">
        {k.pelajaran.map((p, i) => <li key={i} dangerouslySetInnerHTML={{ __html: p }} />)}
      </ul>

      <footer className="kasus-sumber">
        <span className="kasus-sumber-label">Sumber</span>
        <ul>
          {k.sumber.map(s => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.judul}</a>
              <span className="text-faint">, {s.penerbit}</span>
            </li>
          ))}
        </ul>
        <span className="kasus-diperiksa">Diperiksa {tanggalKasus(k.diperiksa)}</span>
      </footer>
    </section>
  )
}

export function Tantangan({ t, moduleId }: { t: NonNullable<Wawasan['tantangan']>; moduleId: string }) {
  const [terbuka, setTerbuka] = useState(0)
  const [jawab, setJawab] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { setTerbuka(0); setJawab(false) }, [moduleId])
  useEffect(() => { if (jawab && ref.current) linkModuleRefs(ref.current) }, [jawab])
  return (
    <section id="tantangan" className="tantangan" aria-labelledby="judul-tantangan">
      <h2 id="judul-tantangan" className="label-atlas">Tantangan</h2>
      <Html html={t.soal} className="tantangan-soal" />
      <p className="tantangan-saran">Coba jawab sendiri dulu. Buka petunjuk satu per satu hanya kalau buntu.</p>
      {terbuka > 0 && (
        <ol className="tantangan-petunjuk">
          {t.petunjuk.slice(0, terbuka).map((p, i) => (
            <li key={i} className="pop"><span className="tantangan-no">Petunjuk {i + 1}</span> <span dangerouslySetInnerHTML={{ __html: p }} /></li>
          ))}
        </ol>
      )}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {terbuka < t.petunjuk.length && (
          <button type="button" className="btn" onClick={() => setTerbuka(n => n + 1)}>
            Tampilkan petunjuk {terbuka + 1} dari {t.petunjuk.length}
          </button>
        )}
        <button type="button" className="btn btn-ink" aria-expanded={jawab} aria-controls="pembahasan-tantangan" onClick={() => setJawab(j => !j)}>
          {jawab ? 'Sembunyikan pembahasan' : 'Lihat pembahasan'}
        </button>
      </div>
      {jawab && <div id="pembahasan-tantangan" ref={ref} className="tantangan-jawaban pop" dangerouslySetInnerHTML={{ __html: t.jawabanHtml }} />}
    </section>
  )
}

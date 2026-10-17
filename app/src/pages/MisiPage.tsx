import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useStore } from '../lib/store'
import { getModule } from '../lib/content'
import { linkModuleRefs } from '../lib/modRefs'
import { Device } from '../diagrams/primitives'
import Lencana from '../components/Lencana'
import { IconArrowLeft, IconArrowRight, IconCheck, IconTerminal } from '../components/icons'

// Misi troubleshooting: laporan gangguan yang dipecahkan dengan menjalankan perintah
// diagnosis lalu menentukan akar masalahnya. Data dari data/misi/*.json, divalidasi
// build (tepat satu dugaan benar, minimal tiga langkah berguna dan dua pengecoh).

interface Simpul { id: string; label: string; jenis: string; x: number; y: number; info?: string }
interface Langkah { id: string; label: string; perangkat: string; perintah: string; keluaran: string; makna: string; berguna: boolean }
interface Dugaan { id: string; teks: string; benar: boolean; umpan: string }
export interface Misi {
  id: string; judul: string; tingkat: 'pemula' | 'menengah' | 'lanjut'; modul: string[]; gejala: string
  briefingHtml: string; topologi: { simpul: Simpul[]; sisi: { dari: string; ke: string; label?: string }[] }
  langkah: Langkah[]; dugaan: Dugaan[]; pembahasanHtml: string
  perbaikan: { penjelasan: string; perintah: string }; sumber: { judul: string; url: string }[]
}

const TINGKAT = { pemula: 1, menengah: 2, lanjut: 3 } as const
const LABEL_TINGKAT = { pemula: 'Pemula', menengah: 'Menengah', lanjut: 'Lanjut' }
const slug = (id: string) => 'misi:' + id
/** Teks cincin lencana: tiga kata pertama ID misi ("gateway-salah-pc-tata-usaha" -> "gateway salah pc"). */
const namaLencana = (id: string) => id.split('-').slice(0, 3).join(' ')

let _data: Promise<Misi[]> | null = null
const muatMisi = () => (_data ??= import('../generated/misi.json').then(m => m.default as unknown as Misi[]))

export default function MisiPage() {
  const { id } = useParams()
  const [data, setData] = useState<Misi[] | null>(null)
  useEffect(() => { muatMisi().then(setData) }, [])
  if (!data) return <div className="mx-auto max-w-[1280px] px-6 pt-16 text-muted" aria-busy="true">Memuat misi</div>
  if (id) {
    const i = data.findIndex(m => m.id === id)
    if (i < 0) return <TakDikenal />
    return <PemainMisi key={id} m={data[i]} berikut={data[i + 1] ?? null} />
  }
  return <DaftarMisi data={data} />
}

function TakDikenal() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24">
      <h1 className="text-[2rem] font-semibold tracking-[-0.03em]">Misi ini tidak ditemukan.</h1>
      <p className="mt-3 text-muted">Tautannya mungkin salah ketik. Pilih misi dari daftar.</p>
      <Link to="/misi" className="btn btn-ink mt-8">Buka daftar misi</Link>
    </div>
  )
}

/* ------------------------------------------------------------------ Daftar */
function DaftarMisi({ data }: { data: Misi[] }) {
  const s = useStore()
  const [saring, setSaring] = useState<'semua' | Misi['tingkat']>('semua')
  const tampil = data.filter(m => saring === 'semua' || m.tingkat === saring)
  const selesai = data.filter(m => (s.games[slug(m.id)] || 0) > 0).length
  return (
    <div className="mx-auto max-w-[1280px] px-6 pb-28 pt-14 lg:px-8">
      <header className="grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="log-waktu">{data.length} laporan gangguan, {selesai} sudah Anda pecahkan</p>
          <h1 className="langit-judul !max-w-[18ch]">Misi troubleshooting</h1>
        </div>
        <p className="max-w-[46ch] text-[15.5px] leading-relaxed text-muted lg:col-span-5">
          Setiap misi dimulai dari laporan pengguna. Jalankan perintah di perangkat yang tepat, baca keluarannya,
          lalu tentukan akar masalahnya. Perintah yang tidak membantu mengurangi skor, jadi pikirkan dulu sebelum mengetik.
        </p>
      </header>

      <div className="mt-12 flex flex-wrap items-center gap-2" role="group" aria-label="Saring menurut tingkat">
        {(['semua', 'pemula', 'menengah', 'lanjut'] as const).map(t => (
          <button key={t} type="button" onClick={() => setSaring(t)} aria-pressed={saring === t}
            className={`chip !h-8 !px-3.5 !text-[13px] ${saring === t ? 'chip-aktif' : ''}`}>
            {t === 'semua' ? 'Semua' : LABEL_TINGKAT[t]} <span className="tabular-nums text-faint">{t === 'semua' ? data.length : data.filter(m => m.tingkat === t).length}</span>
          </button>
        ))}
      </div>

      <ol className="misi-kisi mt-8">
        {tampil.map(m => {
          const skor = s.games[slug(m.id)] || 0
          const no = data.indexOf(m) + 1
          return (
            <li key={m.id}>
              <Link to={`/misi/${m.id}`} className="misi-kartu group">
                <Lencana benih={m.id} nama={namaLencana(m.id)} tingkat={TINGKAT[m.tingkat]} kode={`MISI ${String(no).padStart(2, '0')}`} ukuran={84} nyala={skor > 0} />
                <span className="min-w-0">
                  <span className="misi-kartu-atas">
                    <span>{LABEL_TINGKAT[m.tingkat]}</span>
                    {skor > 0 && <span className="misi-skor"><IconCheck size={12} /> Skor {skor}</span>}
                  </span>
                  <span className="misi-kartu-judul">{m.judul}</span>
                  <span className="misi-kartu-gejala">{m.gejala}</span>
                </span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ------------------------------------------------------------------ Pemain */
function promptUntuk(s: Simpul | undefined, perintah: string) {
  const nama = (s?.label || 'host').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (perintah.startsWith('/')) return `[admin@${nama}] >`
  if (/^(show|ping|traceroute|debug|clear|conf)/.test(perintah) && (s?.jenis === 'router' || s?.jenis === 'switch' || s?.jenis === 'firewall')) return `${nama}#`
  if (/^(ipconfig|nslookup|tracert|netsh|route print|arp -a)/i.test(perintah)) return 'C:\\>'
  return `${nama}$`
}

function PemainMisi({ m, berikut }: { m: Misi; berikut: Misi | null }) {
  const s = useStore()
  const [jalan, setJalan] = useState<string[]>([])
  const [fokus, setFokus] = useState<string | null>(null)
  const [pilih, setPilih] = useState<string | null>(null)
  const [salah, setSalah] = useState<string[]>([])
  const [beres, setBeres] = useState<{ skor: number; xp: number } | null>(null)
  const konsol = useRef<HTMLDivElement>(null)
  const bahas = useRef<HTMLDivElement>(null)
  const simpul = useMemo(() => new Map(m.topologi.simpul.map(x => [x.id, x])), [m])

  useEffect(() => { window.scrollTo(0, 0) }, [m.id])
  useEffect(() => { const el = konsol.current; if (el) el.scrollTop = el.scrollHeight }, [jalan.length])
  useEffect(() => { if (beres && bahas.current) linkModuleRefs(bahas.current) }, [beres])

  const pengecoh = jalan.filter(id => !m.langkah.find(l => l.id === id)?.berguna).length
  const jalankan = (id: string) => { if (!jalan.includes(id) && !beres) setJalan(j => [...j, id]) }
  const kunci = () => {
    const d = m.dugaan.find(x => x.id === pilih)
    if (!d) return
    if (!d.benar) { setSalah(x => x.includes(d.id) ? x : [...x, d.id]); return }
    const skor = Math.max(10, 100 - pengecoh * 8 - salah.length * 20)
    const lama = s.games[slug(m.id)] || 0
    s.recordGame(slug(m.id), skor)
    setBeres({ skor, xp: Math.max(0, Math.min(60, skor - lama)) })
    requestAnimationFrame(() => document.getElementById('pembahasan')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }))
  }

  const daftarLangkah = m.langkah.filter(l => !fokus || l.perangkat === fokus)
  const dugaanTerpilih = m.dugaan.find(x => x.id === pilih)

  return (
    <div className="mx-auto max-w-[1320px] px-6 pb-28 pt-10 lg:px-8">
      <Link to="/misi" className="link-arrow !text-[13px] text-faint"><IconArrowLeft size={14} /> Semua misi</Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-12">
        {/* Kiri: laporan dan topologi */}
        <aside className="lg:col-span-5">
          <div className="flex items-start gap-5">
            <Lencana benih={m.id} nama={namaLencana(m.id)} tingkat={TINGKAT[m.tingkat]} ukuran={92} nyala={!!beres} />
            <div className="min-w-0">
              <p className="log-waktu">{LABEL_TINGKAT[m.tingkat]}</p>
              <h1 className="mt-1 text-[clamp(1.6rem,2.4vw,2.1rem)] font-semibold leading-[1.12] tracking-[-0.03em]">{m.judul}</h1>
            </div>
          </div>
          <section className="misi-tiket mt-8" aria-labelledby="judul-tiket">
            <h2 id="judul-tiket" className="label-atlas">Laporan</h2>
            <div className="misi-tiket-isi" dangerouslySetInnerHTML={{ __html: m.briefingHtml }} />
          </section>
          <section className="mt-8" aria-labelledby="judul-topologi">
            <h2 id="judul-topologi" className="label-atlas">Topologi</h2>
            <p className="mt-2 text-[13px] text-faint">Klik perangkat untuk menyaring perintah yang bisa dijalankan di sana.</p>
            <Topologi m={m} fokus={fokus} onPilih={id => setFokus(f => f === id ? null : id)} />
            {m.topologi.simpul.some(x => x.info) && (
              <dl className="misi-info">
                {m.topologi.simpul.filter(x => x.info).map(x => (
                  <div key={x.id}><dt>{x.label}</dt><dd>{x.info}</dd></div>
                ))}
              </dl>
            )}
          </section>
        </aside>

        {/* Kanan: konsol, perintah, dan keputusan */}
        <div className="lg:col-span-7">
          <section className="misi-konsol" aria-labelledby="judul-konsol">
            <div className="misi-konsol-kepala">
              <IconTerminal size={15} /> <h2 id="judul-konsol">Konsol</h2>
              <span className="ml-auto tabular-nums">{jalan.length} perintah dijalankan</span>
            </div>
            <div ref={konsol} className="misi-konsol-isi" aria-live="polite">
              {!jalan.length && <p className="misi-konsol-kosong">Belum ada perintah. Pilih perintah di bawah untuk mulai mendiagnosis.</p>}
              {jalan.map(id => {
                const l = m.langkah.find(x => x.id === id)!
                return (
                  <div key={id} className="misi-keluaran pop">
                    <div className="misi-prompt"><span>{promptUntuk(simpul.get(l.perangkat), l.perintah)}</span> {l.perintah}</div>
                    <pre>{l.keluaran}</pre>
                    <p className={`misi-makna ${l.berguna ? 'berguna' : ''}`}>
                      <b>{l.berguna ? 'Petunjuk' : 'Tidak banyak membantu'}:</b> <span dangerouslySetInnerHTML={{ __html: l.makna }} />
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="mt-6" aria-labelledby="judul-perintah">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 id="judul-perintah" className="label-atlas flex-1">Perintah{fokus ? ` di ${simpul.get(fokus)?.label}` : ''}</h2>
              {fokus && <button type="button" className="link-arrow !text-[13px]" onClick={() => setFokus(null)}>Tampilkan semua perangkat</button>}
            </div>
            <ul className="misi-perintah mt-4">
              {daftarLangkah.map(l => {
                const sudah = jalan.includes(l.id)
                return (
                  <li key={l.id}>
                    <button type="button" disabled={sudah || !!beres} onClick={() => jalankan(l.id)} className={`misi-perintah-butir ${sudah ? 'sudah' : ''}`}>
                      <span className="misi-perintah-alat">{simpul.get(l.perangkat)?.label}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14.5px] font-medium text-[var(--text)]">{l.label}</span>
                        <code className="misi-perintah-kode">{l.perintah}</code>
                      </span>
                      {sudah ? <IconCheck size={15} className="text-primary" /> : <span className="misi-jalankan">Jalankan</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="mt-10" aria-labelledby="judul-putuskan">
            <h2 id="judul-putuskan" className="label-atlas">Apa akar masalahnya?</h2>
            <fieldset className="mt-4 grid gap-2" disabled={!!beres}>
              <legend className="sr-only">Pilih satu dugaan</legend>
              {m.dugaan.map(d => (
                <label key={d.id} className={`misi-dugaan ${pilih === d.id ? 'dipilih' : ''} ${salah.includes(d.id) ? 'salah' : ''} ${beres && d.benar ? 'benar' : ''}`}>
                  <input type="radio" name={`dugaan-${m.id}`} value={d.id} checked={pilih === d.id} onChange={() => setPilih(d.id)} />
                  <span dangerouslySetInnerHTML={{ __html: d.teks }} />
                </label>
              ))}
            </fieldset>
            {dugaanTerpilih && salah.includes(dugaanTerpilih.id) && !beres && (
              <p className="misi-umpan salah pop" role="status"><b>Belum tepat.</b> <span dangerouslySetInnerHTML={{ __html: dugaanTerpilih.umpan }} /></p>
            )}
            {!beres && (
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <button type="button" className="btn btn-primary" disabled={!pilih || !jalan.length} onClick={kunci}>Kunci jawaban</button>
                {!jalan.length && <span className="text-[13px] text-faint">Jalankan minimal satu perintah dulu.</span>}
              </div>
            )}
          </section>

          {beres && (
            <section id="pembahasan" ref={bahas} className="misi-pembahasan pop scroll-mt-24" aria-labelledby="judul-pembahasan">
              <div className="misi-hasil">
                <span className="misi-hasil-skor">{beres.skor}</span>
                <span>
                  <span className="block font-semibold">Misi selesai.</span>
                  <span className="block text-[13.5px] text-muted">
                    {pengecoh} perintah pengecoh, {salah.length} dugaan salah{beres.xp > 0 ? `. +${beres.xp} XP` : '. Skor terbaik Anda tidak berubah'}.
                  </span>
                </span>
              </div>
              {dugaanTerpilih && <p className="misi-umpan benar" dangerouslySetInnerHTML={{ __html: dugaanTerpilih.umpan }} />}
              <h2 id="judul-pembahasan" className="label-atlas mt-8">Pembahasan</h2>
              <div className="misi-teks" dangerouslySetInnerHTML={{ __html: m.pembahasanHtml }} />
              <h3 className="kasus-sub mt-8">Perbaikan</h3>
              <p className="misi-teks-p" dangerouslySetInnerHTML={{ __html: m.perbaikan.penjelasan }} />
              {m.perbaikan.perintah && <pre className="misi-perbaikan">{m.perbaikan.perintah}</pre>}
              <h3 className="kasus-sub mt-8">Pelajari di modul</h3>
              <ul className="mt-2 grid gap-1.5">
                {m.modul.map(id => { const mod = getModule(id); return mod && (
                  <li key={id}><Link to={`/m/${encodeURI(id)}`} className="link-arrow">{mod.num} {mod.title} <IconArrowRight size={14} /></Link></li>
                ) })}
              </ul>
              {m.sumber.length > 0 && (
                <div className="kasus-sumber">
                  <span className="kasus-sumber-label">Sumber</span>
                  <ul>{m.sumber.map(x => <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.judul}</a></li>)}</ul>
                </div>
              )}
              <div className="mt-10 flex flex-wrap gap-3">
                {berikut && <Link to={`/misi/${berikut.id}`} className="btn btn-ink">Misi berikutnya <IconArrowRight size={15} /></Link>}
                <Link to="/misi" className="btn">Kembali ke daftar</Link>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Topologi */
const JENIS_DEVICE: Record<string, 'pc' | 'laptop' | 'server' | 'router' | 'switch' | 'ap' | 'cloud' | 'phone' | 'firewall'> = {
  pc: 'pc', laptop: 'laptop', ponsel: 'phone', router: 'router', switch: 'switch', server: 'server', firewall: 'firewall', ap: 'ap', cloud: 'cloud', isp: 'cloud',
}
function Topologi({ m, fokus, onPilih }: { m: Misi; fokus: string | null; onPilih: (id: string) => void }) {
  const W = 640, H = 300, px = (x: number) => 36 + (x / 100) * (W - 72), py = (y: number) => 34 + (y / 100) * (H - 80)
  const pos = new Map(m.topologi.simpul.map(s => [s.id, { x: px(s.x), y: py(s.y) }]))
  const adaPerintah = new Set(m.langkah.map(l => l.perangkat))
  return (
    <svg className="dg misi-topologi mt-4" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Topologi: ${m.topologi.simpul.map(s => s.label).join(', ')}`}>
      {m.topologi.sisi.map((e, i) => {
        const a = pos.get(e.dari)!, b = pos.get(e.ke)!
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="misi-kabel" />
            {e.label && <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 7} className="dg-note" textAnchor="middle">{e.label}</text>}
          </g>
        )
      })}
      {m.topologi.simpul.map(s => {
        const p = pos.get(s.id)!
        const bisa = adaPerintah.has(s.id)
        return (
          <g key={s.id} className={`misi-simpul ${fokus === s.id ? 'fokus' : ''} ${bisa ? 'bisa' : ''}`}
            role={bisa ? 'button' : undefined} tabIndex={bisa ? 0 : undefined}
            aria-label={bisa ? `${s.label}: saring perintah` : undefined} aria-pressed={bisa ? fokus === s.id : undefined}
            onClick={bisa ? () => onPilih(s.id) : undefined}
            onKeyDown={bisa ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPilih(s.id) } } : undefined}>
            <circle cx={p.x} cy={p.y} r={32} className="misi-simpul-latar" />
            <Device cx={p.x} cy={p.y} kind={JENIS_DEVICE[s.jenis] ?? 'pc'} s={0.85} />
            <text x={p.x} y={p.y + 36} className="dg-sb" textAnchor="middle">{s.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

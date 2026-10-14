import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { stages } from '../lib/content'
import { muatPustaka, saring, hitungSegi, type DataPustaka, type ButirPustaka, type Saringan, type Segi } from '../lib/pustaka'
import { JENIS, TOPIK } from '../lib/pustakaTopik'
import { IconSearch, IconClose, IconArrowRight } from '../components/icons'
import KepalaBersampul from '../components/KepalaBersampul'
import { Sampul } from '../lib/sampul'

const BAHASA: Record<string, string> = { id: 'Indonesia', en: 'Inggris' }
const SEGI: Segi[] = ['jenis', 'bahasa', 'tahap', 'sumber']
const JUDUL_SEGI: Record<Segi, string> = { jenis: 'Jenis', bahasa: 'Bahasa', tahap: 'Tahap kurikulum', sumber: 'Sumber' }
const PER_HALAMAN = 40
const judulTahap = new Map(stages.map(s => [s.id, s.title]))

/** Saringan tinggal di URL (?q=&jenis=a,b), jadi "Lihat semua" dari halaman modul bisa menautkannya. */
function dariUrl(p: URLSearchParams): Saringan {
  const daftar = (k: string) => (p.get(k) || '').split(',').filter(Boolean)
  return { q: p.get('q') || '', jenis: daftar('jenis'), bahasa: daftar('bahasa'), sumber: daftar('sumber'), tahap: daftar('tahap') }
}
function keUrl(s: Saringan): URLSearchParams {
  const p = new URLSearchParams()
  if (s.q) p.set('q', s.q)
  for (const k of SEGI) if (s[k].length) p.set(k, s[k].join(','))
  return p
}

export default function PustakaPage() {
  const [data, setData] = useState<DataPustaka | null>(null)
  const [gagal, setGagal] = useState(false)
  const [params, setParams] = useSearchParams()
  const [batas, setBatas] = useState(PER_HALAMAN)
  const s = useMemo(() => dariUrl(params), [params])

  useEffect(() => { muatPustaka().then(setData, () => setGagal(true)) }, [])
  useEffect(() => { setBatas(PER_HALAMAN) }, [params])

  const ubah = (u: Partial<Saringan>) => setParams(keUrl({ ...s, ...u }), { replace: true })
  const alih = (segi: Segi, v: string) => ubah({ [segi]: s[segi].includes(v) ? s[segi].filter(x => x !== v) : [...s[segi], v] })

  const hasil = useMemo(() => (data ? saring(data.entri, s) : []), [data, s])
  const segi = useMemo(() => (data ? Object.fromEntries(SEGI.map(k => [k, hitungSegi(data.entri, s, k)])) as Record<Segi, Map<string, number>> : null), [data, s])
  const namaSumber = useMemo(() => new Map((data?.sumber || []).map(x => [x.kunci, x.nama])), [data])
  const adaSaringan = !!s.q || SEGI.some(k => s[k].length)

  const label = (k: Segi, v: string) =>
    k === 'jenis' ? JENIS[v] || v : k === 'bahasa' ? BAHASA[v] || v : k === 'tahap' ? judulTahap.get(v) || v : namaSumber.get(v) || v

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-12 sm:px-6 md:pt-20 lg:px-8">
      <KepalaBersampul sampul={{ benih: 'pustaka', rona: 145, ragam: 'paket', tanda: 'RFC' }}>
        <h1 className="text-[clamp(2.2rem,4.5vw,3.5rem)] font-semibold leading-[1.04] tracking-[-0.045em]">
          Pustaka bacaan jaringan.
        </h1>
        <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-muted">
          {data ? `${data.entri.length.toLocaleString('id')} tautan` : 'Tautan'} buku terbuka, standar, kursus resmi, dokumentasi, dan lab,
          terhubung ke tahap kurikulum. Sumber berbahasa Indonesia tampil lebih dulu. Lisensi tiap sumber tercatat di bawah.
        </p>
      </KepalaBersampul>

      {gagal && <p role="alert" className="mt-10 text-[15px] text-[var(--no)]">Data pustaka gagal dimuat. Muat ulang halaman ini.</p>}
      {!data && !gagal && (
        <div className="mt-12 grid gap-3" aria-busy="true" aria-label="Memuat pustaka">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-20 animate-pulse rounded-[var(--radius)] bg-[var(--surface-2)]" />)}
        </div>
      )}

      {data && segi && (
        <div className="mt-12 grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <aside aria-label="Saring pustaka" className="min-w-0 space-y-7 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
            <label className="relative block">
              <span className="sr-only">Cari di pustaka</span>
              <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input type="search" value={s.q} onChange={e => ubah({ q: e.target.value })} placeholder="Cari: bgp, subnetting, wireshark"
                className="h-10 w-full rounded-lg border border-app bg-surface pl-9 pr-3 text-[14px] outline-none focus-visible:border-[var(--border-strong)] focus-visible:shadow-[var(--ring)]" />
            </label>
            {SEGI.map(k => {
              const nilai = [...segi[k].entries()].filter(([v, n]) => n > 0 || s[k].includes(v))
              if (k === 'tahap') nilai.sort((a, b) => stages.findIndex(x => x.id === a[0]) - stages.findIndex(x => x.id === b[0]))
              else nilai.sort((a, b) => b[1] - a[1] || label(k, a[0]).localeCompare(label(k, b[0]), 'id'))
              return (
                <fieldset key={k}>
                  <legend className="mb-2.5 text-[12.5px] font-medium text-faint">{JUDUL_SEGI[k]}</legend>
                  <div className="flex flex-wrap gap-1.5">
                    {nilai.map(([v, n]) => {
                      const on = s[k].includes(v)
                      return (
                        <button key={v} type="button" aria-pressed={on} onClick={() => alih(k, v)}
                          className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] transition-colors ${
                            on ? 'border-[var(--fg)] bg-[var(--fg)] text-[var(--fg-contrast)]' : 'border-app bg-surface text-muted hover:border-[var(--border-strong)] hover:text-[var(--text)]'}`}>
                          {label(k, v)}
                          <span className={`tabular-nums ${on ? 'opacity-70' : 'text-faint'}`}>{n}</span>
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              )
            })}
          </aside>

          <section aria-label="Hasil" className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-app pb-3">
              <p className="text-[14px] text-muted" aria-live="polite">
                <span className="font-medium tabular-nums text-[var(--text)]">{hasil.length.toLocaleString('id')}</span> tautan
                {adaSaringan ? ' cocok dengan saringan' : ''}
              </p>
              {adaSaringan && (
                <button type="button" onClick={() => setParams(new URLSearchParams(), { replace: true })}
                  className="inline-flex items-center gap-1.5 text-[13px] text-muted underline underline-offset-2 hover:text-[var(--text)]">
                  <IconClose size={13} /> Hapus saringan
                </button>
              )}
            </div>

            {hasil.length === 0 ? (
              <div className="rounded-[var(--radius)] border border-dashed border-app px-6 py-12 text-center">
                <div className="mx-auto mb-5 h-16 w-28 overflow-hidden rounded-[var(--radius-md)]"><Sampul benih={'kosong:' + s.q} ragam="mesh" lebar={224} tinggi={128} /></div>
                <p className="text-[15px] font-medium">Tidak ada tautan yang cocok.</p>
                <p className="mt-1.5 text-[14px] text-muted">Coba kata lain, atau lepas salah satu saringan di kiri.</p>
              </div>
            ) : (
              <ol className="divide-y divide-[var(--border)]">
                {hasil.slice(0, batas).map(e => <Baris key={e.id} e={e} namaSumber={namaSumber} />)}
              </ol>
            )}
            {hasil.length > batas && (
              <button type="button" onClick={() => setBatas(b => b + PER_HALAMAN)} className="btn mt-6 w-full justify-center">
                Tampilkan {Math.min(PER_HALAMAN, hasil.length - batas)} lagi
                <span className="text-faint">({(hasil.length - batas).toLocaleString('id')} tersisa)</span>
              </button>
            )}
          </section>
        </div>
      )}

      {data && (
        <section aria-labelledby="judul-atribusi" className="mt-24 border-t border-app pt-12">
          <h2 id="judul-atribusi" className="text-[22px] font-semibold tracking-[-0.03em]">Sumber dan lisensi</h2>
          <p className="mt-2 max-w-[70ch] text-[14.5px] leading-relaxed text-muted">
            Menautkan selalu sah; menyalin tunduk pada lisensi. Daftar dari sumber berlisensi terbuka disalin dengan atribusi di bawah ini.
            Sumber tanpa lisensi terbuka hanya ditautkan, isinya tidak disalin. Data kurasi mencatat lisensi dan tanggal periksa per tautan.
          </p>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-[var(--radius)] border border-app bg-[var(--border)] md:grid-cols-2">
            {data.sumber.map(x => (
              <li key={x.kunci} className="bg-surface p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span className="text-[15px] font-medium">
                    {x.repo ? <a href={x.repo} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">{x.nama}</a> : x.nama}
                  </span>
                  <span className="text-[12.5px] tabular-nums text-faint">{x.jumlah.toLocaleString('id')} tautan</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="chip">{x.lisensi}</span>
                  {x.boleh_salin === false && <span className="chip">tautan saja</span>}
                  {x.commit && <span className="chip font-mono">{x.commit}</span>}
                </div>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted">{x.atribusi}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Baris({ e, namaSumber }: { e: ButirPustaka; namaSumber: Map<string, string> }) {
  return (
    <li className="py-4">
      <a href={e.url} target="_blank" rel="noopener noreferrer"
        className="group inline-flex items-baseline gap-1.5 text-[15.5px] font-medium leading-snug hover:underline hover:underline-offset-2">
        {e.judul}
        <IconArrowRight size={13} className="shrink-0 -rotate-45 text-faint transition-colors group-hover:text-[var(--text)]" />
        <span className="sr-only">(membuka situs lain)</span>
      </a>
      <div className="mt-1 truncate text-[12.5px] text-faint">{new URL(e.url).hostname.replace(/^www\./, '')}</div>
      {e.catatan && <p className="mt-1.5 max-w-[75ch] text-[14px] leading-relaxed text-muted">{e.catatan}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px]">
        <span className="chip">{JENIS[e.jenis] || e.jenis}</span>
        <span className="chip">{BAHASA[e.bahasa]}</span>
        {e.topik.slice(0, 2).map(t => <span key={t} className="chip">{TOPIK[t] || t}</span>)}
        <span className="text-faint">
          {namaSumber.get(e.sumber) || e.sumber}{e.juga_di.length ? ` + ${e.juga_di.length} sumber lain` : ''} · {e.lisensi}
          {e.tanggal_diperiksa ? ` · diperiksa ${e.tanggal_diperiksa}` : ''}
        </span>
      </div>
      {e.modul.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px]">
          <span className="text-faint">Dirujuk di</span>
          {e.modul.slice(0, 4).map(m => (
            <Link key={m} to={`/m/${encodeURI(m)}`} className="text-muted underline underline-offset-2 hover:text-[var(--text)]">{m}</Link>
          ))}
          {e.modul.length > 4 && <span className="text-faint">+{e.modul.length - 4} modul</span>}
        </div>
      )}
    </li>
  )
}

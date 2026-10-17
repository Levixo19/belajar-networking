// Alat "Dekode pesan Arecibo": pembelajar mengatur lebar baris dan melihat 1.679 bit tersusun
// ulang secara langsung. Pada lebar yang salah tampak derau miring; pada 23 gambarnya muncul.
// Data dan semua hitungannya ada di ./arecibo (fungsi murni, dites tests/arecibo.test.mjs).
// Gambar digambar sendiri dari deret bit sebagai satu <path>; warna hanya lewat token CSS.
import { useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/arecibo.css'
import { getModule } from '../lib/content'
import {
  PESAN, PANJANG, LEBAR_GAMBAR, TINGGI_GAMBAR, BAGIAN, type Bagian,
  faktorPrima, pembagi, susun, potonganNyala, bacaLebar, keterangan, deskripsi, tinggiLabel,
} from './arecibo'

/** Penggeser cukup sampai 100 (memuat 23, 46, 69, 73, 92). Lebar lebih besar lewat kotak angka. */
const GESER_MAKS = 100
/** Tebakan pertama "dua byte per baris": wajar bagi orang komputer, dan jelas salah. */
const AWAL = 16
/** Bit pertama yang diperlihatkan sebagai deret yang tiba: tiga baris asli. */
const ALIRAN = 69
/** Satu petak = 10 satuan SVG, supaya ukuran huruf label tidak pecahan kecil. */
const P = 10
/** Ruang label di kiri dan kanan gambar 23 kolom, dalam petak. Disediakan juga saat anotasi
 *  mati, supaya gambar tidak melompat ketika anotasi dinyalakan. */
const TEPI = 18
const MODUL_FRAME = '03-data-link/01-ethernet-frame-mac'

const f = (x: number) => x.toLocaleString('id')

export default function Arecibo() {
  const id = useId()
  const [lebar, setLebar] = useState(AWAL)
  const [ketik, setKetik] = useState(String(AWAL))
  const [anotasi, setAnotasi] = useState(false)
  const [sorot, setSorot] = useState<string | null>(null)
  const [disentuh, setDisentuh] = useState(false)
  const [umum, setUmum] = useState('')

  const atur = (v: number) => {
    const l = Math.min(PANJANG, Math.max(1, Math.round(v)))
    setLebar(l)
    setKetik(String(l))
    setDisentuh(true)
  }

  const baca = bacaLebar(lebar)
  const ket = keterangan(baca)
  const gambar = baca.hasil === 'gambar'
  const tampakAnotasi = gambar && anotasi
  const susunan = useMemo(() => susun(PESAN, lebar), [lebar])
  const jalur = useMemo(() => potonganNyala(susunan)
    .map(([x, y, p]) => `M${x * P} ${y * P}h${p * P}v${P}h${-p * P}z`).join(''), [susunan])
  const aliran = useMemo(() => susun(PESAN.slice(0, ALIRAN), lebar).baris, [lebar])

  // Pengumuman pembaca layar ditunda sebentar: menggeser cepat tidak boleh membanjiri pembaca
  // layar dengan belasan kalimat. Belum diumumkan apa pun sebelum pembelajar menyentuh kontrol.
  useEffect(() => {
    if (!disentuh) return
    const t = setTimeout(() => setUmum(ket.ringkas), 350)
    return () => clearTimeout(t)
  }, [ket.ringkas, disentuh])

  const vb = gambar
    ? `${-TEPI * P} ${-0.5 * P} ${(LEBAR_GAMBAR + 2 * TEPI) * P} ${(TINGGI_GAMBAR + 2) * P}`
    : `${-P} ${-P} ${(susunan.lebar + 2) * P} ${(baca.baris + 2) * P}`
  const faktor = faktorPrima(PANJANG)
  const modulFrame = getModule(MODUL_FRAME)

  return (
    <div className="card arc p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="m-0 text-[17px] font-semibold tracking-[-0.02em]">Dekode pesan Arecibo</h3>
        <span className="text-[12px] text-faint">1.679 bit, 16 November 1974</span>
      </div>
      <p className="m-0 mt-2 max-w-[62ch] text-[14px] leading-relaxed text-muted">
        Teleskop radio Arecibo di Puerto Rico memancarkan 1.679 bit ke gugus bintang M13. Tidak ada
        keterangan lain, hanya deretan 0 dan 1. Bit itu baru bermakna kalau penerima tahu di mana
        harus memotongnya menjadi baris. Atur lebar baris di bawah sampai Anda melihat gambarnya.
      </p>

      {/* Deret yang tiba, dipotong sesuai lebar: framing yang terlihat */}
      <div className="mt-4">
        <p className="m-0 text-[12px] font-medium text-faint">Bit pertama yang tiba, dipotong tiap {f(lebar)} bit:</p>
        <p className="arc-aliran m-0 mt-1.5" role="img" aria-label={`${f(ALIRAN)} bit pertama, dipotong menjadi ${aliran.length} potongan`}>
          {aliran.map((potong, i) => <span key={i} className="arc-potong">{potong}</span>)}
          <span className="arc-lanjut">dan {f(PANJANG - ALIRAN)} bit lagi</span>
        </p>
      </div>

      <div className="arc-kendali mt-5">
        <div>
          <label htmlFor={`${id}geser`} className="block text-[12px] font-medium text-faint">Lebar baris (bit per baris)</label>
          <div className="mt-1.5 flex items-center gap-2">
            <button type="button" className="btn btn-icon" onClick={() => atur(lebar - 1)} disabled={lebar <= 1}
              aria-label="Kurangi lebar satu bit">−</button>
            <input id={`${id}geser`} type="range" min={1} max={GESER_MAKS} step={1} value={Math.min(lebar, GESER_MAKS)}
              onChange={e => atur(Number(e.target.value))} aria-valuetext={`${f(lebar)} bit per baris`}
              aria-describedby={`${id}hitung`} className="arc-geser" />
            <button type="button" className="btn btn-icon" onClick={() => atur(lebar + 1)} disabled={lebar >= PANJANG}
              aria-label="Tambah lebar satu bit">+</button>
            <input type="number" min={1} max={PANJANG} step={1} inputMode="numeric" value={ketik}
              aria-label="Lebar baris dalam bit, ketik angka 1 sampai 1.679" className="arc-angka"
              onChange={e => {
                setKetik(e.target.value)
                const v = Number(e.target.value)
                if (Number.isInteger(v) && v >= 1 && v <= PANJANG) atur(v)
              }}
              onBlur={() => setKetik(String(lebar))} />
          </div>
          <p id={`${id}hitung`} className="arc-hitung m-0 mt-3">
            1.679 : {f(lebar)} = {f(baca.penuh)} baris{baca.sisa ? <>, sisa <b>{f(baca.sisa)}</b> bit</> : ', tanpa sisa'}
          </p>
          <p className="m-0 mt-1 text-[13.5px] leading-relaxed text-muted">{ket.rinci}</p>
          <p className="sr-only" aria-live="polite">{umum}</p>
        </div>

        <div className="arc-faktor">
          <p className="arc-rumus m-0">{f(PANJANG)} = {faktor.join(' × ')}</p>
          <p className="m-0 mt-1 text-[13px] leading-relaxed text-muted">
            {faktor.join(' dan ')} bilangan prima. Jadi hanya empat lebar yang membagi 1.679 tanpa sisa:
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Lebar yang membagi 1.679 tanpa sisa">
            {pembagi(PANJANG).map(p => (
              <button key={p} type="button" className="btn arc-pembagi" aria-pressed={lebar === p} onClick={() => atur(p)}>
                {f(p)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <figure className="arc-panel m-0 mt-5">
        <div className="arc-panel-atas">
          <span className="text-[12.5px] text-muted">
            {f(susunan.lebar)} kolom × {f(baca.baris)} baris
          </span>
          {gambar && <span className="chip pop">Gambar muncul</span>}
          <span className="ml-auto flex items-center gap-2">
            <span className="text-[12px] text-faint">
              {!gambar ? 'Anotasi tersedia setelah gambar muncul' : !anotasi ? 'Nyalakan untuk membaca tiap bagian' : null}
            </span>
            <button type="button" className="btn arc-sakelar" aria-pressed={tampakAnotasi} disabled={!gambar}
              onClick={() => setAnotasi(a => !a)}>Anotasi</button>
          </span>
        </div>
        <svg viewBox={vb} className="arc-svg" role="img" aria-labelledby={`${id}judul`} aria-describedby={`${id}desk`}
          preserveAspectRatio="xMidYMid meet">
          <title id={`${id}judul`}>{`Pesan Arecibo disusun ${f(susunan.lebar)} bit per baris`}</title>
          <desc id={`${id}desk`}>{deskripsi(baca)}</desc>
          <rect className="arc-latar" x={0} y={0} width={susunan.lebar * P} height={baca.baris * P} />
          {baca.sisa > 0 && (
            <rect className="arc-sisa" x={baca.sisa * P} y={(baca.baris - 1) * P} width={(susunan.lebar - baca.sisa) * P} height={P} />
          )}
          <path className="arc-bit" d={jalur} />
          <rect className={`arc-bingkai${gambar ? ' arc-bingkai-pas' : ''}`} x={0} y={0} width={susunan.lebar * P} height={baca.baris * P} />
          {tampakAnotasi && <Anotasi sorot={sorot} setSorot={setSorot} />}
        </svg>
        {baca.sisa > 0 && (
          <figcaption className="arc-catatan">
            Kotak bergaris putus di ujung bawah: baris terakhir hanya terisi {f(baca.sisa)} dari {f(susunan.lebar)} bit.
          </figcaption>
        )}
      </figure>

      {tampakAnotasi && (
        <ol className="arc-daftar m-0 mt-4 list-none p-0" aria-label="Bagian-bagian gambar">
          {BAGIAN.map(b => (
            <li key={b.id} className={`arc-butir m-0 px-2.5 py-1.5${sorot === b.id ? ' arc-butir-sorot' : ''}`}
              onMouseEnter={() => setSorot(b.id)} onMouseLeave={() => setSorot(null)}>
              <b>{b.judul}</b> <span className="text-faint">({b.nilai})</span>. {b.isi}
            </li>
          ))}
        </ol>
      )}

      <div className="arc-pelajaran mt-6">
        <p className="m-0 text-[15px] font-semibold tracking-[-0.01em]">Apa hubungannya dengan jaringan?</p>
        <p className="m-0 mt-2">
          Kabel dan gelombang radio hanya membawa bit. Bit tidak membawa petunjuk di mana sebuah pesan
          mulai dan berhenti. Menandai batas itu disebut <b>framing</b>.
        </p>
        <p className="m-0 mt-2">
          Pesan Arecibo tidak punya penanda batas. Penerimanya harus menebak lebar baris dari angka 1.679
          saja. Untung 1.679 hanya punya dua faktor prima, jadi tebakannya cuma dua: 23 atau 73.
        </p>
        <p className="m-0 mt-2">
          Jaringan sungguhan tidak mau menebak. Sebelum setiap frame Ethernet dikirim <b>preamble</b>: tujuh
          byte pola <span className="font-mono">10101010</span> untuk menyelaraskan jam penerima. Lalu satu
          byte penanda awal frame (SFD), <span className="font-mono">10101011</span>, yang berarti: frame
          mulai sesudah ini. Sesudahnya datang <b>header</b>: alamat tujuan, alamat asal, dan jenis isi. Di
          ujung frame ada FCS, angka pemeriksa untuk mendeteksi bit yang rusak.
        </p>
        {modulFrame && (
          <p className="m-0 mt-3">
            <Link to={`/m/${encodeURI(modulFrame.id)}`} className="link-arrow">
              Frame Ethernet dibahas di modul {modulFrame.num}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

/** Lapisan anotasi bergaya sampul Voyager: garis tipis dan label kecil di kiri dan kanan.
 *  Dekoratif bagi pembaca layar (isi yang sama ada di daftar di bawah gambar). */
function Anotasi({ sorot, setSorot }: { sorot: string | null; setSorot: (id: string | null) => void }) {
  return (
    <g aria-hidden="true">
      {BAGIAN.map(b => (
        <g key={b.id} className={sorot === b.id ? 'arc-tanda arc-tanda-sorot' : 'arc-tanda'}
          onMouseEnter={() => setSorot(b.id)} onMouseLeave={() => setSorot(null)}>
          <Tanda b={b} disorot={sorot === b.id} />
        </g>
      ))}
    </g>
  )
}

function Tanda({ b, disorot }: { b: Bagian; disorot: boolean }) {
  const kanan = b.sisi === 'kanan'
  const arah = kanan ? 1 : -1
  const y = tinggiLabel(b) * P
  const tepi = (kanan ? LEBAR_GAMBAR + 0.8 : -0.8) * P
  const xTeks = (kanan ? LEBAR_GAMBAR + 2 : -2) * P
  const [k0, r0, k1, r1] = b.kotak
  let garis: string
  let titik: [number, number] | null = null
  if (b.titik) {
    // Garis datar dari petak yang ditunjuk ke tepi gambar, lalu menerus ke label.
    const [k, r] = b.titik
    const x0 = (kanan ? k + 1.3 : k - 0.3) * P
    titik = [x0, (r + 0.5) * P]
    garis = `M${x0} ${y}H${xTeks - arah * 0.5 * P}`
  } else {
    // Kurung sepanjang baris bagiannya, dengan kait kecil ke arah gambar dan tangkai ke label.
    const atas = (r0 + 0.15) * P, bawah = (r1 + 0.85) * P, kait = 0.45 * P
    garis = `M${tepi - arah * kait} ${atas}H${tepi}V${bawah}H${tepi - arah * kait}M${tepi} ${y}H${xTeks - arah * 0.5 * P}`
  }
  return (
    <>
      {/* Sorotan: kotak sedikit lebih longgar dari bagiannya, dijepit di dalam tepi gambar
          supaya tidak menyentuh kurung di sisi luar. */}
      {disorot && <rect className="arc-kotak" x={Math.max(k0 - 0.3, -0.25) * P} y={(r0 - 0.3) * P}
        width={(Math.min(k1 + 1.3, LEBAR_GAMBAR + 0.25) - Math.max(k0 - 0.3, -0.25)) * P} height={(r1 - r0 + 1.6) * P} />}
      <path className="arc-garis" d={garis} />
      {titik && <circle className="arc-titik" cx={titik[0]} cy={titik[1]} r={0.24 * P} />}
      {/* Garis menunjuk tengah judul; nilai di baris kedua. */}
      <text className="arc-label" x={xTeks} y={y + 0.4 * P} textAnchor={kanan ? 'start' : 'end'}>{b.judul}</text>
      <text className="arc-label-nilai" x={xTeks} y={y + 2.15 * P} textAnchor={kanan ? 'start' : 'end'}>{b.nilai}</text>
    </>
  )
}

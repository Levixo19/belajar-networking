import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '../lib/store'
import { useDialogFokus } from '../lib/fokus'
import { simpanGerak, sistemMintaKurang, useGerak, type Gerak } from '../lib/gerak'
import Avatar, { TONES, toneOf } from './Avatar'
import { IconChevron, IconCheck, IconPlus } from './icons'

const PILIHAN_GERAK: { id: Gerak; label: string }[] = [
  { id: 'sistem', label: 'Ikuti sistem' },
  { id: 'kurangi', label: 'Kurangi' },
]

/**
 * Menu profil. Di pil (compact) panelnya dirender lewat portal ke <body> dengan posisi
 * fixed yang diukur dari tombolnya: pil memakai overflow-x: auto supaya bisa digulir di
 * layar sempit, dan overflow itu memotong panel yang tinggal di dalamnya. Lebih buruk
 * lagi, saat useDialogFokus memindah fokus ke panel, browser menggulir isi pil supaya
 * elemen terfokus kelihatan, sehingga semua butir navigasi tergeser keluar.
 */
export default function ProfileMenu({ compact = false }: { compact?: boolean }) {
  const s = useStore()
  const gerak = useGerak()
  const pemicu = useRef<HTMLButtonElement>(null)
  const [letak, setLetak] = useState<{ top: number; right: number } | null>(null)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [name, setName] = useState('')
  const [tone, setTone] = useState<string>('tone:ink')
  const [error, setError] = useState('')

  const close = () => { setOpen(false); setCreating(false); setConfirmReset(false); setError('') }
  const dialog = useRef<HTMLDivElement>(null)
  useDialogFokus(dialog, open, close)

  const create = async () => {
    const n = name.trim()
    if (!n) { setError('Nama profil wajib diisi.'); return }
    try {
      await s.createProfile(n, tone)
      setName(''); close()
    } catch {
      setError('Profil gagal dibuat. Coba lagi saat tersambung.')
    }
  }

  const displayName = s.profileName || 'Saya'

  // Diukur di handler klik (sebelum setOpen), bukan di efek: useDialogFokus membaca ref
  // panel di commit yang sama dengan `open`, jadi panel harus sudah ada di commit itu.
  // Pil berposisi fixed, jadi sesudahnya cukup diukur ulang saat jendela berubah ukuran.
  const ukurLetak = () => {
    const r = pemicu.current?.getBoundingClientRect()
    if (r) setLetak({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) })
  }
  useEffect(() => {
    if (!open || !compact) return
    window.addEventListener('resize', ukurLetak)
    return () => window.removeEventListener('resize', ukurLetak)
  }, [open, compact])

  const lapisan = open && (!compact || letak) && (
    <>
      <div className={`fixed inset-0 ${compact ? 'z-[45]' : 'z-10'}`} onClick={close} aria-hidden="true" />
      <div
        ref={dialog}
        role="dialog"
        aria-label="Profil"
        style={compact && letak ? { top: letak.top, right: letak.right } : undefined}
        className={`menu-panel fade-up w-72 p-1.5 ${
          compact ? 'fixed z-50' : 'absolute bottom-full left-2.5 z-30 mb-2'
        }`}
      >
        <div className="flex items-center gap-3 px-2.5 pb-3 pt-2">
          <Avatar name={displayName} avatar={s.avatar} size={36} />
          <div className="min-w-0">
            <div className="truncate text-[14px] font-medium">{displayName}</div>
            <div className="text-[12.5px] tabular-nums text-faint">Level {s.level}, {s.xp.toLocaleString('id')} XP</div>
          </div>
        </div>

        <div className="border-t border-app pt-1.5">
          <div className="px-2.5 pb-1 pt-1 text-[12px] text-faint">Ganti profil</div>
          <div className="max-h-48 space-y-px overflow-y-auto">
            {s.profiles.map(p => (
              <button
                key={p.id}
                onClick={() => { s.switchProfile(p.id); close() }}
                className={`flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px] transition-colors ${
                  p.id === s.profileId ? 'bg-[var(--surface-2)] font-medium' : 'text-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                }`}
              >
                <Avatar name={p.name} avatar={p.avatar} size={22} />
                <span className="flex-1 truncate">{p.name}</span>
                {p.id === s.profileId
                  ? <IconCheck size={14} />
                  : <span className="text-[12px] tabular-nums text-faint">{p.done} tuntas</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-app px-2.5 pb-2.5 pt-2">
          <div id="gerak-judul" className="pb-1.5 text-[12px] text-faint">Gerak antarmuka</div>
          <div role="group" aria-labelledby="gerak-judul" className="grid grid-cols-2 gap-1">
            {PILIHAN_GERAK.map(g => (
              <button
                key={g.id}
                type="button"
                aria-pressed={gerak === g.id}
                onClick={() => simpanGerak(g.id)}
                className={`h-8 rounded-lg text-[13px] transition-colors ${
                  gerak === g.id ? 'bg-[var(--surface-2)] font-medium' : 'text-muted hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-faint">
            {gerak === 'sistem' && sistemMintaKurang()
              ? 'Sistem Anda sudah meminta gerak dikurangi, jadi animasi sudah mati.'
              : 'Kurangi mematikan animasi pembuka, penyalaan bintang, transisi halaman, dan kursor bidik.'}
          </p>
        </div>

        {creating ? (
          <form
            className="mt-1.5 space-y-3 border-t border-app p-2.5"
            onSubmit={e => { e.preventDefault(); create() }}
          >
            <div className="space-y-1.5">
              <label htmlFor="nama-profil" className="block text-[12.5px] font-medium">Nama profil</label>
              <input
                id="nama-profil"
                autoFocus
                value={name}
                onChange={e => { setName(e.target.value); setError('') }}
                aria-invalid={!!error}
                aria-describedby={error ? 'nama-profil-err' : undefined}
                className="h-9 w-full rounded-lg border border-[var(--border-strong)] bg-surface px-2.5 text-[13.5px] text-[var(--text)] outline-none transition-shadow focus:shadow-[var(--ring)]"
              />
              {error && <p id="nama-profil-err" className="text-[12.5px] text-[var(--no)]">{error}</p>}
            </div>
            <fieldset>
              <legend className="mb-1.5 text-[12.5px] font-medium">Warna</legend>
              <div className="flex gap-2">
                {TONES.map(t => (
                  <button
                    type="button"
                    key={t}
                    onClick={() => setTone(`tone:${t}`)}
                    aria-pressed={toneOf(tone) === t}
                    aria-label={`Warna ${t}`}
                    className={`rounded-[30%] p-0.5 transition-shadow ${toneOf(tone) === t ? 'shadow-[var(--ring)]' : ''}`}
                  >
                    <Avatar name={name || 'A'} avatar={`tone:${t}`} size={26} />
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex gap-2">
              <button type="submit" className="btn btn-ink flex-1 !h-8">Simpan</button>
              <button type="button" className="btn flex-1 !h-8" onClick={() => { setCreating(false); setError('') }}>Batal</button>
            </div>
          </form>
        ) : (
          <div className="mt-1.5 space-y-px border-t border-app pt-1.5">
            <button
              className="flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[13.5px] hover:bg-[var(--surface-2)]"
              onClick={() => setCreating(true)}
            >
              <IconPlus size={15} /> Profil baru
            </button>
            {confirmReset ? (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-[var(--no-soft)] px-2.5 py-2">
                <span className="text-[12.5px] text-[var(--no)]">Hapus semua progres profil ini?</span>
                <span className="flex shrink-0 gap-1">
                  <button className="btn !h-7 !px-2 text-[12px]" onClick={() => setConfirmReset(false)}>Batal</button>
                  <button className="btn !h-7 !border-[var(--no)] !bg-[var(--no)] !px-2 text-[12px] !text-[var(--fg-contrast)]"
                    onClick={() => { s.reset(); close() }}>Hapus</button>
                </span>
              </div>
            ) : (
              <button
                className="flex h-9 w-full items-center rounded-lg px-2.5 text-left text-[13.5px] text-[var(--no)] hover:bg-[var(--no-soft)]"
                onClick={() => setConfirmReset(true)}
              >
                Reset progres
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className={compact ? 'relative shrink-0' : 'relative shrink-0 border-t border-app p-2.5'}>
      {compact ? lapisan && createPortal(lapisan, document.body) : lapisan}

      <button
        ref={pemicu}
        onClick={() => { if (compact) ukurLetak(); setOpen(o => !o); s.refreshProfiles() }}
        aria-label={`Profil ${displayName}`}
        aria-expanded={open}
        className={compact
          ? 'grid h-8 w-8 place-items-center rounded-[30%] transition-transform active:scale-95'
          : 'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[var(--surface-2)]'}
      >
        {compact ? (
          <Avatar name={displayName} avatar={s.avatar} size={30} />
        ) : (
          <>
            <Avatar name={displayName} avatar={s.avatar} size={30} />
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-sm font-medium">{displayName}</div>
              <div className="text-[12px] text-faint">Level {s.level}</div>
            </div>
            <IconChevron size={14} className={`text-faint transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
          </>
        )}
      </button>
    </div>
  )
}

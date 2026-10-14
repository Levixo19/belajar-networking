import { useEffect, useRef, type RefObject } from 'react'

const BISA_DIFOKUS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Perilaku dialog yang benar untuk papan ketik, dipakai SEMUA lapisan yang menutupi
 * halaman (palet perintah, menu profil, mega-menu kurikulum, lightbox):
 *   1. saat dibuka, fokus pindah ke dalam (elemen `[data-autofocus]` atau yang pertama);
 *   2. Tab dan Shift+Tab berputar di dalamnya, tidak lolos ke halaman di belakang;
 *   3. Escape menutup;
 *   4. saat ditutup, fokus KEMBALI ke elemen yang membukanya.
 * Tanpa poin 4, orang yang menutup palet dengan Escape mendarat di <body> dan harus
 * menekan Tab puluhan kali untuk kembali ke tempatnya.
 */
export function useDialogFokus(ref: RefObject<HTMLElement | null>, aktif: boolean, onTutup: () => void) {
  const tutup = useRef(onTutup)
  tutup.current = onTutup

  useEffect(() => {
    if (!aktif) return
    const asal = document.activeElement as HTMLElement | null
    const el = ref.current
    // Ditunda satu frame: isi dialog bisa baru menempel sesudah efek ini berjalan.
    const t = requestAnimationFrame(() => {
      const awal = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>(BISA_DIFOKUS)
      ;(awal ?? el)?.focus()
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); tutup.current(); return }
      if (e.key !== 'Tab' || !el) return
      const daftar = [...el.querySelectorAll<HTMLElement>(BISA_DIFOKUS)].filter(x => x.offsetParent !== null || x === document.activeElement)
      if (!daftar.length) { e.preventDefault(); el.focus(); return }
      const pertama = daftar[0], terakhir = daftar[daftar.length - 1]
      if (e.shiftKey && (document.activeElement === pertama || !el.contains(document.activeElement))) { e.preventDefault(); terakhir.focus() }
      else if (!e.shiftKey && (document.activeElement === terakhir || !el.contains(document.activeElement))) { e.preventDefault(); pertama.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(t)
      document.removeEventListener('keydown', onKey)
      // Hanya kembalikan fokus kalau ia masih ada di dalam dialog atau di body;
      // kalau pengguna sudah mengeklik tempat lain, jangan rebut.
      const kini = document.activeElement
      if (asal && document.contains(asal) && (!kini || kini === document.body || el?.contains(kini))) asal.focus()
    }
  }, [aktif, ref])
}

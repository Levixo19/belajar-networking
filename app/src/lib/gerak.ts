import { useSyncExternalStore } from 'react'
import { aturMotionOk } from './motion'

/**
 * Preferensi gerak milik pembaca, di atas preferensi sistem. "Ikuti sistem" menuruti
 * prefers-reduced-motion; "Kurangi" mematikan gerak walau sistem tidak memintanya
 * (misalnya laptop sekolah yang pengaturannya tidak bisa diubah). Tidak ada pilihan
 * "selalu bergerak": permintaan sistem untuk mengurangi gerak tidak pernah ditimpa.
 *
 * Satu sumber untuk tiga mesin: atribut data-gerak di <html> dibaca CSS, MOTION_OK di
 * lib/motion.ts dibaca gsap.matchMedia, dan gerakDikurangi() dibaca kode yang
 * menggulir atau menganimasikan sendiri. Animasi yang SUDAH berjalan tidak ditarik;
 * pilihan berlaku untuk gerak berikutnya, dan CSS langsung berhenti.
 */
export type Gerak = 'sistem' | 'kurangi'

const KUNCI = 'bn-gerak'
const PERISTIWA = 'bn-gerak'
const KUERI_KURANG = '(prefers-reduced-motion: reduce)'

export function bacaGerak(): Gerak {
  try { return localStorage.getItem(KUNCI) === 'kurangi' ? 'kurangi' : 'sistem' } catch { return 'sistem' }
}

export function terapkanGerak(g: Gerak) {
  const d = document.documentElement.dataset
  if (g === 'kurangi') d.gerak = 'kurangi'
  else delete d.gerak
  aturMotionOk(g === 'kurangi')
}

export function simpanGerak(g: Gerak) {
  try { localStorage.setItem(KUNCI, g) } catch {}
  terapkanGerak(g)
  window.dispatchEvent(new Event(PERISTIWA))
}

export const sistemMintaKurang = () => window.matchMedia(KUERI_KURANG).matches

/** Benar bila pembaca ATAU sistemnya meminta gerak dikurangi. */
export const gerakDikurangi = () => document.documentElement.dataset.gerak === 'kurangi' || sistemMintaKurang()

const langgan = (beri: () => void) => {
  window.addEventListener(PERISTIWA, beri)
  return () => window.removeEventListener(PERISTIWA, beri)
}

export const useGerak = () => useSyncExternalStore(langgan, bacaGerak)

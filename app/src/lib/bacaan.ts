import { useEffect, useState } from 'react'

/**
 * Preferensi tampilan baca. Riset (Wallace dkk., ACM TOCHI 2022) menunjukkan font tercepat
 * berbeda per orang (selisih kecepatan baca hingga 35%), jadi pembaca boleh memilih sendiri.
 * Disimpan per perangkat; atribut data-ba-* di <html> dibaca oleh CSS.
 */
export type FontBaca = 'atkinson' | 'lexend' | 'source' | 'literata' | 'geist'
export type UkuranBaca = 's' | 'm' | 'l'
export type SpasiBaca = 'normal' | 'lega'
export interface PrefBaca { font: FontBaca; ukuran: UkuranBaca; spasi: SpasiBaca }

export const FONT_BACA: { id: FontBaca; nama: string; css: string; ket: string }[] = [
  { id: 'atkinson', nama: 'Atkinson Hyperlegible', css: '"Atkinson Hyperlegible Next Variable"', ket: 'Paling jelas. Huruf mirip seperti I l 1 dan 0 O dibedakan tegas.' },
  { id: 'lexend', nama: 'Lexend', css: '"Lexend Variable"', ket: 'Huruf dan spasi lebih lebar, terasa lapang dan santai.' },
  { id: 'source', nama: 'Source Sans 3', css: '"Source Sans 3 Variable"', ket: 'Humanis dan netral, nyaman untuk bacaan panjang.' },
  { id: 'literata', nama: 'Literata', css: '"Literata Variable"', ket: 'Serif untuk membaca berjam-jam, seperti buku.' },
  { id: 'geist', nama: 'Geist', css: '"Geist Variable"', ket: 'Rapat dan modern (tampilan sebelumnya).' },
]

const KEY = 'bn-baca'
export const BAWAAN: PrefBaca = { font: 'atkinson', ukuran: 'm', spasi: 'normal' }

export function bacaPref(): PrefBaca {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (v && FONT_BACA.some(f => f.id === v.font) && ['s', 'm', 'l'].includes(v.ukuran) && ['normal', 'lega'].includes(v.spasi)) return v
  } catch {}
  return BAWAAN
}

function terapkan(p: PrefBaca) {
  const d = document.documentElement.dataset
  d.baFont = p.font; d.baUkuran = p.ukuran; d.baSpasi = p.spasi
}

export function usePrefBaca() {
  const [pref, setPref] = useState<PrefBaca>(bacaPref)
  useEffect(() => {
    terapkan(pref)
    try { localStorage.setItem(KEY, JSON.stringify(pref)) } catch {}
  }, [pref])
  const ubah = (sebagian: Partial<PrefBaca>) => setPref(p => ({ ...p, ...sebagian }))
  return { pref, ubah, reset: () => setPref(BAWAAN) }
}

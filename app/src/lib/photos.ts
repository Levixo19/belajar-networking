import raw from '../../data/photos.json'

export interface Photo { src: string; credit: string; page: string; title: string }
const all = raw as unknown as Record<string, Photo>
const base = import.meta.env.BASE_URL

/** Foto perangkat jaringan (Wikimedia Commons). Path dibuat relatif terhadap BASE_URL. */
export function photo(key: string): Photo & { url: string } {
  const p = all[key]
  return { ...p, url: base + p.src.replace(/^\//, '') }
}

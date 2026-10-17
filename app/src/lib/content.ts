import raw from '../generated/curriculum.json'

export interface TocItem { id: string; text: string; level: number }
export interface Card { id: string; n: number; q: string; aHtml: string }
export interface NextRef { id: string; teaser: string }
/** Lapis untuk pembaca awam (data/kasus/*.json, divalidasi build). Teks sudah HTML sebaris. */
export interface Wawasan {
  intinya?: { satuKalimat: string; analogi: string; kenapaPenting: string; istilah: { kata: string; arti: string }[] }
  kasus?: {
    jenis: 'insiden' | 'praktik'; judul: string; kapan: string; diMana: string; ringkas: string
    kronologi: { waktu: string; peristiwa: string }[]; akarMasalah: string; kaitan: string
    pelajaran: string[]; sumber: { judul: string; url: string; penerbit: string }[]; diperiksa: string
  }
  tantangan?: { soal: string; petunjuk: string[]; jawabanHtml: string }
}
export interface Module {
  id: string; rel: string; stage: string; order: number; num: string; title: string
  prasyarat: string; tujuan: string; next: NextRef | null
  bodyHtml: string; toc: TocItem[]; cards: Card[]; words: number; readMin: number
  wawasan?: Wawasan
}
export interface Stage {
  id: string; title: string; icon: string; band: string; num: number; modules: Module[]
}
export interface SearchDoc { id: string; title: string; num: string; stage: string; stageTitle: string; text: string }

interface Bundle {
  stages: Stage[]
  search: SearchDoc[]
  meta: { totalModules: number; totalCards: number; totalStages: number; generatedAt: string }
}

export const bundle = raw as unknown as Bundle
export const stages = bundle.stages
export const meta = bundle.meta

// Peta modul & daftar linear (untuk prev/next global)
export const moduleById = new Map<string, Module>()
export const stageOfModule = new Map<string, Stage>()
export const linearModules: Module[] = []
for (const s of stages) {
  for (const m of s.modules) {
    moduleById.set(m.id, m)
    stageOfModule.set(m.id, s)
    linearModules.push(m)
  }
}

export function getModule(id: string): Module | undefined { return moduleById.get(id) }
export function neighbors(id: string): { prev?: Module; next?: Module } {
  const i = linearModules.findIndex(m => m.id === id)
  if (i < 0) return {}
  return { prev: linearModules[i - 1], next: linearModules[i + 1] }
}

// Kelompok band untuk sidebar
export const BAND_LABEL: Record<string, string> = {
  panduan: 'Panduan', dasar: 'Tahap Dasar', menengah: 'Tahap Menengah',
  lanjut: 'Tahap Lanjut', profesional: 'Tahap Profesional',
  khusus: 'Jalur Khusus', penunjang: 'Penunjang',
  karier: 'Ekosistem Profesi', proyek: 'Proyek Akhir',
}
export const BANDS = ['panduan', 'dasar', 'menengah', 'lanjut', 'profesional', 'khusus', 'karier', 'penunjang', 'proyek']

export function stagesByBand(): { band: string; label: string; stages: Stage[] }[] {
  return BANDS.map(band => ({
    band, label: BAND_LABEL[band],
    stages: stages.filter(s => s.band === band),
  })).filter(g => g.stages.length > 0)
}

export const allCards: Card[] = linearModules.flatMap(m =>
  m.cards.map(c => ({ ...c, _module: m.id } as Card & { _module: string }))
) as Card[]

// Tahap yang bukan materi belajar inti (pengantar & rujukan), tidak dihitung dalam progres
export const BUKAN_MATERI = ['panduan', 'referensi']
export const learnModules: Module[] = linearModules.filter(m => !BUKAN_MATERI.includes(m.stage))

/** Modul inti pertama yang belum tuntas: tujuan semua tombol "Lanjut belajar". */
export function nextModule(progress: Record<string, string>): Module {
  return learnModules.find(m => progress[m.id] !== 'done') ?? learnModules[0]
}

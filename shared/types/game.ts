export type Category = 'Calm' | 'Speed' | 'Words' | 'Memory' | 'Focus' | 'Body'
export type Level = 'Easy' | 'Medium' | 'Hard'
export type TileSize = 'normal' | 'wide' | 'tall' | 'big'

/** One score band. `at` is the minimum score (or the maximum when lowerIsBetter). null = no limit (Infinity). */
export interface Band {
  at: number | null
  range: string
  label: string
  message: string
}

export interface GameDef {
  id: string
  order: number
  component: string
  name: string
  category: Category
  level: Level
  size: TileSize
  blurb: string
  trains: string
  durationSec: number | null
  unit: string
  lowerIsBetter: boolean
  steps: string[]
  demo: { scene: string; caption: string }[]
  bands: Band[]
  science: string
  tip: string
  icon: { viewBox: string; svg: string }
}

export interface CategoryDef {
  tint: 'mint' | 'peach' | 'rose' | 'lilac' | 'sky' | 'sun'
  description: string
}

export interface HistoryEntry {
  id: string
  s: number
  d: string
  t: number
}
export interface Progress {
  name: string
  av: string
  best: Record<string, number>
  hist: HistoryEntry[]
  days: string[]
  xp: number
  theme: 'auto' | 'light' | 'dark'
}

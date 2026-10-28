import type { HistoryEntry } from '~~/shared/types/game'

const DAY = 86400000
const utc = (date: string) => Date.parse(`${date}T00:00:00Z`)
const pad = (n: number) => String(n).padStart(2, '0')

export function bestStreak(days: string[]): number {
  const sorted = [...new Set(days)].sort()
  let best = 0
  let run = 0
  sorted.forEach((d, i) => {
    run = i > 0 && utc(d) - utc(sorted[i - 1]!) === DAY ? run + 1 : 1
    best = Math.max(best, run)
  })
  return best
}

export const monthPlayed = (days: string[], month: string) => days.filter(d => d.startsWith(month)).length

export function favourite(hist: HistoryEntry[]): { id: string; count: number } | null {
  const counts = new Map<string, number>()
  hist.forEach(h => counts.set(h.id, (counts.get(h.id) ?? 0) + 1))
  let top: { id: string; count: number } | null = null
  for (const [id, count] of counts) if (!top || count > top.count) top = { id, count }
  return top
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y!, m! - 1 + delta, 1))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
}

export function monthGrid(month: string): { offset: number; dates: string[] } {
  const [y, m] = month.split('-').map(Number)
  const count = new Date(Date.UTC(y!, m!, 0)).getUTCDate()
  const offset = (new Date(Date.UTC(y!, m! - 1, 1)).getUTCDay() + 6) % 7
  return { offset, dates: Array.from({ length: count }, (_, i) => `${month}-${pad(i + 1)}`) }
}

export function growthSeries(xpDays: Record<string, number>, month: string, today: string) {
  const keys = Object.keys(xpDays).sort()
  const valueAt = (date: string) => {
    const k = keys.filter(x => x <= date).at(-1)
    return k == null ? null : xpDays[k]!
  }
  const values = monthGrid(month).dates.map(d => (d > today ? null : valueAt(d)))
  const before = keys.filter(k => k < `${month}-01`).at(-1)
  const known = values.filter((v): v is number => v != null)
  const start = before != null ? xpDays[before]! : (known[0] ?? null)
  const end = known.at(-1) ?? null
  let bestDay: string | null = null
  let bestGain = 0
  let prev = start
  values.forEach((v, i) => {
    if (v == null || prev == null) return
    if (v - prev > bestGain) {
      bestGain = v - prev
      bestDay = `${month}-${pad(i + 1)}`
    }
    prev = v
  })
  return { values, start, end, bestDay }
}

export const litNeurons = (played: number, total = 72) =>
  played <= 0 ? 0 : Math.min(total, 1 + Math.floor(played / 2))

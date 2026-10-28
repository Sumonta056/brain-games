import type { Progress, GameDef } from '~~/shared/types/game'

const KEY = 'bgarden'
const LEVELS = [
  ['🌱', 'Seed'],
  ['🌿', 'Sprout'],
  ['🪴', 'Young plant'],
  ['🌼', 'In bloom'],
  ['🌳', 'Strong tree'],
  ['🌲', 'Evergreen'],
  ['🏞️', 'Whole garden']
] as const
const blank = (): Progress => ({ name: '', av: '🦉', best: {}, hist: [], days: [], xp: 0, theme: 'auto' })
const body = (p: Progress) => JSON.stringify({ ...p, updatedAt: undefined })
let last: { obj: Progress; body: string; at?: number } | undefined
const mark = (p: Progress) => (last = { obj: p, body: body(p), at: p.updatedAt })

/** Single source of truth for the player's profile and scores. Persists to localStorage (same key as design.html). */
export function useProgress() {
  const state = useState<Progress>('progress', () => {
    if (import.meta.client) {
      try {
        return { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }
      } catch {
        /* ignore */
      }
    }
    return blank()
  })

  const persist = () => {
    const p = state.value
    if (!p) return
    if (last?.obj === p && p.updatedAt === last.at && body(p) !== last.body) p.updatedAt = Date.now()
    mark(p)
    try {
      localStorage.setItem(KEY, JSON.stringify(state.value))
    } catch {
      /* storage blocked */
    }
  }
  if (state.value && last?.obj !== state.value) mark(state.value)
  watch(state, persist, { deep: true })

  const streak = computed(() => {
    const set = new Set(state.value.days)
    let n = 0
    const d = new Date()
    if (!set.has(todayKey(d))) d.setDate(d.getDate() - 1)
    while (set.has(todayKey(d))) {
      n++
      d.setDate(d.getDate() - 1)
    }
    return n
  })
  const level = computed(() => {
    const i = Math.min(LEVELS.length - 1, Math.floor(state.value.xp / 120))
    return {
      i,
      emoji: LEVELS[i]![0],
      name: LEVELS[i]![1],
      pct: i === LEVELS.length - 1 ? 100 : ((state.value.xp % 120) / 120) * 100
    }
  })
  const playedToday = (id: string) => state.value.hist.some(x => x.id === id && x.d === todayKey())

  /** Record a finished game. Returns what the result screen needs. */
  function record(game: GameDef, score: number) {
    const p = state.value
    const key = bestKey(game)
    const prev = p.best[key]
    const isPB = prev == null || (game.lowerIsBetter ? score < prev : score > prev)
    if (isPB) p.best[key] = score
    const l = game.difficulty && game.difficulty !== 'medium' ? game.difficulty : undefined
    p.played = (p.played ?? p.hist.length) + 1
    if (!p.xpDays) {
      const last = p.days
        .filter(d => d < todayKey())
        .sort()
        .at(-1)
      const playedToday = p.hist.filter(h => h.d === todayKey()).length
      p.xpDays = last ? { [last]: p.xp - 10 * playedToday } : {}
    }
    p.hist.unshift({ id: game.id, s: score, d: todayKey(), t: Date.now(), ...(l && { l }) })
    p.hist = p.hist.slice(0, 60)
    if (!p.days.includes(todayKey())) p.days.push(todayKey())
    p.days = p.days.slice(-120)
    p.xp += 10 + (isPB && prev != null ? 5 : 0)
    p.xpDays[todayKey()] = p.xp
    p.xpDays = Object.fromEntries(
      Object.entries(p.xpDays)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-120)
    )
    const band = bandIndex(game, score)
    const mastered = isMastery(game, band)
    const masteryKey = `${game.id}@${game.difficulty}`
    const list = Array.isArray(p.mastered) ? p.mastered : []
    const firstMastery = mastered && !list.includes(masteryKey)
    if (firstMastery) p.mastered = [...list, masteryKey]
    p.updatedAt = Date.now()
    return { prev: prev ?? null, isPB, band, mastered, firstMastery }
  }
  const reset = () => {
    const now = Date.now()
    state.value = { ...blank(), updatedAt: now, resetAt: now }
  }

  return { progress: state, streak, level, playedToday, record, reset }
}

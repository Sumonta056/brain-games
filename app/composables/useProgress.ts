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
    try {
      localStorage.setItem(KEY, JSON.stringify(state.value))
    } catch {
      /* storage blocked */
    }
  }
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
    const prev = p.best[game.id]
    const isPB = prev == null || (game.lowerIsBetter ? score < prev : score > prev)
    if (isPB) p.best[game.id] = score
    p.hist.unshift({ id: game.id, s: score, d: todayKey(), t: Date.now() })
    p.hist = p.hist.slice(0, 60)
    if (!p.days.includes(todayKey())) p.days.push(todayKey())
    p.days = p.days.slice(-120)
    p.xp += 10 + (isPB && prev != null ? 5 : 0)
    return { prev: prev ?? null, isPB, band: bandIndex(game, score) }
  }
  const reset = () => {
    state.value = blank()
  }

  return { progress: state, streak, level, playedToday, record, reset }
}

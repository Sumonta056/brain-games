import type { HistoryEntry, Progress } from '~~/shared/types/game'

const THEMES = ['auto', 'light', 'dark']

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const mapOf = (v: unknown, ok: (x: unknown) => boolean) => isObj(v) && Object.values(v).every(ok)
const listOf = (v: unknown, ok: (x: unknown) => boolean) => Array.isArray(v) && v.every(ok)
const isEntry = (v: unknown) => isObj(v) && isStr(v.id) && isNum(v.s) && isStr(v.d) && isNum(v.t)

const OPTIONAL: Record<string, (v: unknown) => boolean> = {
  diff: v => mapOf(v, isStr),
  mastered: v => listOf(v, isStr),
  played: isNum,
  xpDays: v => mapOf(v, isNum),
  updatedAt: isNum,
  resetAt: isNum
}

const clean = (p: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)) as unknown as Progress

export function parseProgress(value: unknown): Progress | null {
  if (!isObj(value)) return null
  const v = value
  const required =
    isStr(v.name) &&
    isStr(v.av) &&
    mapOf(v.best, isNum) &&
    listOf(v.hist, isEntry) &&
    listOf(v.days, isStr) &&
    isNum(v.xp) &&
    THEMES.includes(v.theme as string)
  if (!required) return null
  if (Object.entries(OPTIONAL).some(([k, ok]) => v[k] !== undefined && !ok(v[k]))) return null
  return JSON.parse(
    JSON.stringify({
      name: v.name,
      av: v.av,
      best: v.best,
      hist: v.hist,
      days: v.days,
      xp: v.xp,
      theme: v.theme,
      ...Object.fromEntries(Object.keys(OPTIONAL).map(k => [k, v[k]]))
    })
  )
}

const lowerIsBetter = (key: string) => useGames().byId(key.split('@')[0]!)?.lowerIsBetter ?? false

function mergeBest(a: Record<string, number>, b: Record<string, number>) {
  const out = { ...a }
  for (const [k, s] of Object.entries(b)) {
    const prev = out[k]
    if (prev == null || (lowerIsBetter(k) ? s < prev : s > prev)) out[k] = s
  }
  return out
}

function mergeHist(a: HistoryEntry[], b: HistoryEntry[]) {
  const byT = new Map<number, HistoryEntry>()
  for (const h of [...a, ...b]) if (!byT.has(h.t)) byT.set(h.t, { ...h })
  return [...byT.values()].sort((x, y) => y.t - x.t).slice(0, 60)
}

function mergeXpDays(a?: Record<string, number>, b?: Record<string, number>) {
  if (!a && !b) return undefined
  const out: Record<string, number> = { ...a }
  for (const [d, x] of Object.entries(b ?? {})) out[d] = Math.max(out[d] ?? x, x)
  return Object.fromEntries(
    Object.entries(out)
      .sort(([x], [y]) => x.localeCompare(y))
      .slice(-120)
  )
}

const maxOpt = (a?: number, b?: number) => (a == null && b == null ? undefined : Math.max(a ?? 0, b ?? 0))

function sinceReset(p: Progress, resetAt: number): Progress {
  if ((p.resetAt ?? 0) >= resetAt) return p
  const hist = p.hist.filter(h => h.t > resetAt)
  return {
    name: p.name,
    av: p.av,
    theme: p.theme,
    diff: p.diff,
    best: {},
    hist,
    days: [...new Set(hist.map(h => h.d))],
    xp: 0
  }
}

export function mergeProgress(local: Progress, cloud: Progress): Progress {
  const resetAt = maxOpt(local.resetAt, cloud.resetAt)
  const a = sinceReset(local, resetAt ?? 0)
  const b = sinceReset(cloud, resetAt ?? 0)
  const [older, newer] = (local.updatedAt ?? 0) > (cloud.updatedAt ?? 0) ? [b, a] : [a, b]
  const mastered = a.mastered || b.mastered ? [...new Set([...(a.mastered ?? []), ...(b.mastered ?? [])])] : undefined
  return clean({
    name: newer.name || older.name,
    av: newer.av || older.av,
    theme: newer.theme || older.theme,
    best: mergeBest(a.best, b.best),
    hist: mergeHist(a.hist, b.hist),
    days: [...new Set([...a.days, ...b.days])].sort().slice(-120),
    xp: Math.max(a.xp, b.xp),
    diff: a.diff || b.diff ? { ...older.diff, ...newer.diff } : undefined,
    mastered,
    played: maxOpt(a.played, b.played),
    xpDays: mergeXpDays(a.xpDays, b.xpDays),
    updatedAt: maxOpt(local.updatedAt, cloud.updatedAt),
    resetAt
  })
}

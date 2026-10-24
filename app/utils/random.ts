export const ri = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a
export const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)]!
export function shuffle<T>(a: readonly T[]): T[] {
  const r = a.slice()
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j]!, r[i]!]
  }
  return r
}
/** Deterministic PRNG so "Today's five" is the same all day. */
export function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}
export const dayNum = () => Math.floor(Date.now() / 864e5)
export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10)

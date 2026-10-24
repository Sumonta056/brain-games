import { describe, expect, it } from 'vitest'
import { pick, ri, seeded, shuffle, todayKey } from '~/utils/random'

describe('random utils', () => {
  it('ri stays inside the inclusive range', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) seen.add(ri(3, 5))
    expect([...seen].sort()).toEqual([3, 4, 5])
  })

  it('pick returns an item from the list', () => {
    const list = ['a', 'b', 'c']
    for (let i = 0; i < 50; i++) expect(list).toContain(pick(list))
  })

  it('shuffle keeps every item and does not change the input', () => {
    const input = [1, 2, 3, 4, 5, 6]
    const out = shuffle(input)
    expect(out.slice().sort()).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('seeded gives the same sequence for the same seed', () => {
    const a = seeded(42)
    const b = seeded(42)
    const c = seeded(43)
    const seqA = [a(), a(), a()]
    expect([b(), b(), b()]).toEqual(seqA)
    expect([c(), c(), c()]).not.toEqual(seqA)
    seqA.forEach(n => {
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
    })
  })

  it('todayKey formats as YYYY-MM-DD', () => {
    expect(todayKey(new Date('2026-03-04T10:00:00Z'))).toBe('2026-03-04')
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mergeProgress, parseProgress } from '~/utils/mergeProgress'
import { makeProgress } from '../fixtures'

const REQUIRED = ['av', 'best', 'days', 'hist', 'name', 'theme', 'xp']

const valid = () => ({
  name: 'Ana',
  av: '🐼',
  best: { math: 12, 'pairs@hard': 30 },
  hist: [{ id: 'math', s: 12, d: '2026-05-10', t: 100, l: 'easy' }],
  days: ['2026-05-10'],
  xp: 40,
  theme: 'dark',
  diff: { math: 'hard' },
  mastered: ['math@hard'],
  played: 4,
  xpDays: { '2026-05-10': 40 },
  updatedAt: 1000,
  resetAt: 10
})

const dateKey = (i: number) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10)
const entry = (t: number) => ({ id: 'math', s: t, d: '2026-05-10', t })

describe('parseProgress', () => {
  it('accepts a valid progress object with all optional fields', () => {
    expect(parseProgress(valid())).toEqual(valid())
  })

  it('accepts a progress object with only the required fields and holds no other key', () => {
    const { name, av, best, hist, days, xp, theme } = valid()
    const result = parseProgress({ name, av, best, hist, days, xp, theme })
    expect(result).not.toBeNull()
    expect(Object.keys(result!).sort()).toEqual(REQUIRED)
  })

  it('never holds a key whose value is undefined', () => {
    const result = parseProgress({ ...valid(), diff: undefined, mastered: undefined, updatedAt: undefined })
    expect(result).not.toBeNull()
    expect(Object.entries(result!).filter(([, v]) => v === undefined)).toEqual([])
  })

  it('drops unknown keys', () => {
    const result = parseProgress({ ...valid(), admin: true, __proto__x: 1 })
    expect(Object.keys(result!).sort()).toEqual(Object.keys(valid()).sort())
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'progress'],
    ['a number', 7],
    ['an array', [valid()]]
  ])('rejects %s', (_, value) => {
    expect(parseProgress(value)).toBeNull()
  })

  it.each([
    ['name is not a string', { name: 5 }],
    ['av is not a string', { av: null }],
    ['best is missing', { best: undefined }],
    ['best holds a string', { best: { math: '12' } }],
    ['best is an array', { best: [12] }],
    ['hist is not an array', { hist: {} }],
    ['a hist entry has a number id', { hist: [{ id: 1, s: 1, d: '2026-05-10', t: 1 }] }],
    ['a hist entry has a string score', { hist: [{ id: 'math', s: '1', d: '2026-05-10', t: 1 }] }],
    ['a hist entry has no date', { hist: [{ id: 'math', s: 1, t: 1 }] }],
    ['a hist entry has no time', { hist: [{ id: 'math', s: 1, d: '2026-05-10' }] }],
    ['a hist entry is not an object', { hist: ['math'] }],
    ['days holds a number', { days: [20260510] }],
    ['xp is a string', { xp: '40' }],
    ['theme is unknown', { theme: 'blue' }],
    ['diff holds a number', { diff: { math: 2 } }],
    ['mastered is not an array', { mastered: 'math@hard' }],
    ['mastered holds a number', { mastered: [1] }],
    ['played is a string', { played: '4' }],
    ['xpDays holds a string', { xpDays: { '2026-05-10': '40' } }],
    ['updatedAt is a string', { updatedAt: 'now' }],
    ['resetAt is a string', { resetAt: 'now' }]
  ])('rejects a document where %s', (_, patch) => {
    expect(parseProgress({ ...valid(), ...patch })).toBeNull()
  })
})

describe('mergeProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-05-10T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('keeps the higher best for a higher-is-better game', () => {
    expect(mergeProgress(makeProgress({ best: { math: 9 } }), makeProgress({ best: { math: 12 } })).best.math).toBe(12)
    expect(mergeProgress(makeProgress({ best: { math: 15 } }), makeProgress({ best: { math: 12 } })).best.math).toBe(15)
  })

  it('keeps the lower best for lower-is-better games', () => {
    const local = makeProgress({ best: { pairs: 30, reaction: 250 } })
    const cloud = makeProgress({ best: { pairs: 24, reaction: 300 } })
    expect(mergeProgress(local, cloud).best).toEqual({ pairs: 24, reaction: 250 })
  })

  it('reads lowerIsBetter from the game id of an id@level key', () => {
    const local = makeProgress({ best: { 'pairs@hard': 40, 'math@easy': 20 } })
    const cloud = makeProgress({ best: { 'pairs@hard': 35, 'math@easy': 18 } })
    expect(mergeProgress(local, cloud).best).toEqual({ 'pairs@hard': 35, 'math@easy': 20 })
  })

  it('keeps bests found on only one side', () => {
    const merged = mergeProgress(makeProgress({ best: { math: 9 } }), makeProgress({ best: { reaction: 280 } }))
    expect(merged.best).toEqual({ math: 9, reaction: 280 })
  })

  it('joins hist by t, newest first, with each t once', () => {
    const local = makeProgress({ hist: [entry(5), entry(3), entry(1)] })
    const cloud = makeProgress({ hist: [entry(4), entry(3), entry(2)] })
    expect(mergeProgress(local, cloud).hist.map(h => h.t)).toEqual([5, 4, 3, 2, 1])
  })

  it('keeps the 60 newest hist entries', () => {
    const local = makeProgress({ hist: Array.from({ length: 40 }, (_, i) => entry(40 - i)) })
    const cloud = makeProgress({ hist: Array.from({ length: 40 }, (_, i) => entry(80 - i)) })
    const t = mergeProgress(local, cloud).hist.map(h => h.t)
    expect(t).toHaveLength(60)
    expect(t[0]).toBe(80)
    expect(t.at(-1)).toBe(21)
  })

  it('joins days, sorted, each once', () => {
    const local = makeProgress({ days: ['2026-05-03', '2026-05-01'] })
    const cloud = makeProgress({ days: ['2026-05-02', '2026-05-03'] })
    expect(mergeProgress(local, cloud).days).toEqual(['2026-05-01', '2026-05-02', '2026-05-03'])
  })

  it('keeps the 120 newest days', () => {
    const local = makeProgress({ days: Array.from({ length: 100 }, (_, i) => dateKey(i)) })
    const cloud = makeProgress({ days: Array.from({ length: 100 }, (_, i) => dateKey(i + 50)) })
    expect(mergeProgress(local, cloud).days).toEqual(Array.from({ length: 120 }, (_, i) => dateKey(i + 30)))
  })

  it('joins xpDays with the higher value per date', () => {
    const local = makeProgress({ xpDays: { '2026-05-01': 10, '2026-05-02': 50 } })
    const cloud = makeProgress({ xpDays: { '2026-05-02': 40, '2026-05-03': 60 } })
    expect(mergeProgress(local, cloud).xpDays).toEqual({ '2026-05-01': 10, '2026-05-02': 50, '2026-05-03': 60 })
  })

  it('keeps the 120 newest xpDays dates', () => {
    const local = makeProgress({ xpDays: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [dateKey(i), i])) })
    const cloud = makeProgress({
      xpDays: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [dateKey(i + 50), i + 50]))
    })
    const dates = Object.keys(mergeProgress(local, cloud).xpDays!).sort()
    expect(dates).toEqual(Array.from({ length: 120 }, (_, i) => dateKey(i + 30)))
  })

  it('joins mastered, each key once', () => {
    const local = makeProgress({ mastered: ['math@hard', 'pairs@easy'] })
    const cloud = makeProgress({ mastered: ['pairs@easy', 'schulte@beast'] })
    expect([...mergeProgress(local, cloud).mastered!].sort()).toEqual(['math@hard', 'pairs@easy', 'schulte@beast'])
  })

  it('keeps the higher xp and played', () => {
    expect(mergeProgress(makeProgress({ xp: 50, played: 3 }), makeProgress({ xp: 40, played: 9 }))).toMatchObject({
      xp: 50,
      played: 9
    })
    expect(mergeProgress(makeProgress({ xp: 10, played: 7 }), makeProgress({ xp: 90, played: 2 }))).toMatchObject({
      xp: 90,
      played: 7
    })
  })

  it('lets the newer copy win the difficulty per game and keeps games found on one side', () => {
    const local = makeProgress({ diff: { math: 'easy', pairs: 'hard' }, updatedAt: 1 })
    const cloud = makeProgress({ diff: { math: 'beast', schulte: 'easy' }, updatedAt: 2 })
    expect(mergeProgress(local, cloud).diff).toEqual({ math: 'beast', pairs: 'hard', schulte: 'easy' })
    expect(mergeProgress({ ...local, updatedAt: 3 }, cloud).diff).toEqual({
      math: 'easy',
      pairs: 'hard',
      schulte: 'easy'
    })
  })

  it('takes the name, avatar and theme from the newer copy', () => {
    const local = makeProgress({ name: 'Ana', av: '🦉', theme: 'light', updatedAt: 1 })
    const cloud = makeProgress({ name: 'Bo', av: '🐼', theme: 'dark', updatedAt: 2 })
    expect(mergeProgress(local, cloud)).toMatchObject({ name: 'Bo', av: '🐼', theme: 'dark' })
    expect(mergeProgress({ ...local, updatedAt: 3 }, cloud)).toMatchObject({ name: 'Ana', av: '🦉', theme: 'light' })
  })

  it('keeps the other name and avatar when the newer ones are empty', () => {
    const local = makeProgress({ name: 'Ana', av: '🦉', updatedAt: 1 })
    const cloud = makeProgress({ name: '', av: '', updatedAt: 2 })
    expect(mergeProgress(local, cloud)).toMatchObject({ name: 'Ana', av: '🦉' })
  })

  it('keeps the newer updatedAt', () => {
    expect(mergeProgress(makeProgress({ updatedAt: 5 }), makeProgress({ updatedAt: 9 })).updatedAt).toBe(9)
    expect(mergeProgress(makeProgress({ updatedAt: 9 }), makeProgress({})).updatedAt).toBe(9)
  })

  it('drops a copy made before the other copy was reset', () => {
    const old = makeProgress({
      name: 'Ana',
      best: { math: 30 },
      hist: [entry(100)],
      days: ['2026-05-01'],
      xp: 90,
      mastered: ['math@hard'],
      played: 9,
      xpDays: { '2026-05-01': 90 },
      updatedAt: 100
    })
    const reset = makeProgress({ name: 'Ana', resetAt: 500, updatedAt: 500 })
    const merged = mergeProgress(old, reset)
    expect(merged).toMatchObject({ best: {}, hist: [], days: [], xp: 0, resetAt: 500 })
    expect(merged.mastered ?? []).toEqual([])
    expect(merged.played ?? 0).toBe(0)
    expect(merged.xpDays ?? {}).toEqual({})
    expect(mergeProgress(reset, old)).toMatchObject({ best: {}, hist: [], xp: 0, resetAt: 500 })
  })

  it('keeps the games a stale copy played after the reset, and drops the rest', () => {
    const stale = makeProgress({
      best: { math: 30 },
      hist: [{ id: 'math', s: 5, d: '2026-05-09', t: 900 }, entry(100)],
      days: ['2026-05-01', '2026-05-09'],
      xp: 90,
      updatedAt: 900
    })
    const reset = makeProgress({ resetAt: 500, updatedAt: 500 })
    const merged = mergeProgress(stale, reset)
    expect(merged.hist.map(h => h.t)).toEqual([900])
    expect(merged.days).toEqual(['2026-05-09'])
    expect(merged.best).toEqual({})
    expect(merged.resetAt).toBe(500)
  })

  it('keeps everything from two copies that share the same reset', () => {
    const a = makeProgress({ best: { math: 9 }, hist: [entry(600)], resetAt: 500, updatedAt: 600 })
    const b = makeProgress({ best: { math: 12 }, hist: [entry(700)], resetAt: 500, updatedAt: 700 })
    const merged = mergeProgress(a, b)
    expect(merged.best).toEqual({ math: 12 })
    expect(merged.hist.map(h => h.t)).toEqual([700, 600])
  })

  it('does not change its inputs', () => {
    const local = makeProgress({
      name: 'Ana',
      best: { math: 9, pairs: 30 },
      hist: [entry(3), entry(1)],
      days: ['2026-05-02'],
      xp: 20,
      diff: { math: 'easy' },
      mastered: ['math@easy'],
      played: 2,
      xpDays: { '2026-05-02': 20 },
      updatedAt: 1
    })
    const cloud = makeProgress({
      name: 'Bo',
      best: { math: 12, pairs: 24 },
      hist: [entry(2)],
      days: ['2026-05-01'],
      xp: 30,
      diff: { math: 'hard' },
      mastered: ['pairs@hard'],
      played: 3,
      xpDays: { '2026-05-01': 30 },
      updatedAt: 2
    })
    const before = [structuredClone(local), structuredClone(cloud)]
    mergeProgress(local, cloud)
    expect([local, cloud]).toEqual(before)
  })
})

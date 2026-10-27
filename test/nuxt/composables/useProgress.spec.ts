import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { clearNuxtState } from '#imports'
import { useProgress } from '~/composables/useProgress'
import { mathGame, reactionGame, tieredAs } from '../fixtures'

const KEY = 'bgarden'

function fresh() {
  clearNuxtState('progress')
  return useProgress()
}

describe('useProgress', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-05-10T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts blank with the auto theme', () => {
    const { progress } = fresh()
    expect(progress.value).toMatchObject({ best: {}, hist: [], days: [], xp: 0, theme: 'auto' })
  })

  it('loads saved progress from the bgarden key', () => {
    localStorage.setItem(KEY, JSON.stringify({ name: 'Ana', xp: 50 }))
    const { progress } = fresh()
    expect(progress.value.name).toBe('Ana')
    expect(progress.value.xp).toBe(50)
    expect(progress.value.hist).toEqual([])
  })

  it('falls back to blank when stored JSON is broken', () => {
    localStorage.setItem(KEY, '{nope')
    const { progress } = fresh()
    expect(progress.value.xp).toBe(0)
  })

  it('persists changes to the bgarden key', async () => {
    const { record } = fresh()
    record(mathGame, 10)
    await nextTick()
    expect(JSON.parse(localStorage.getItem(KEY)!).best.math).toBe(10)
  })

  describe('record', () => {
    it('sets the first best and gives 10 XP', () => {
      const { record, progress } = fresh()
      expect(record(mathGame, 8)).toEqual({ prev: null, isPB: true, band: 1 })
      expect(progress.value.best.math).toBe(8)
      expect(progress.value.xp).toBe(10)
    })

    it('gives 15 XP when a previous best is beaten (higher is better)', () => {
      const { record, progress } = fresh()
      record(mathGame, 8)
      expect(record(mathGame, 12)).toMatchObject({ prev: 8, isPB: true })
      expect(progress.value.xp).toBe(25)
    })

    it('keeps the best when the score is not better', () => {
      const { record, progress } = fresh()
      record(mathGame, 12)
      expect(record(mathGame, 12)).toMatchObject({ prev: 12, isPB: false })
      expect(progress.value.best.math).toBe(12)
      expect(progress.value.xp).toBe(20)
    })

    it('treats a lower score as better when lowerIsBetter', () => {
      const { record, progress } = fresh()
      record(reactionGame, 320)
      expect(record(reactionGame, 280)).toMatchObject({ prev: 320, isPB: true })
      expect(record(reactionGame, 300)).toMatchObject({ isPB: false })
      expect(progress.value.best.reaction).toBe(280)
    })

    it('adds history to the start and keeps 60 entries', () => {
      const { record, progress } = fresh()
      for (let i = 0; i < 65; i++) record(mathGame, i)
      expect(progress.value.hist).toHaveLength(60)
      expect(progress.value.hist[0]).toMatchObject({ id: 'math', s: 64, d: '2026-05-10' })
    })

    it('adds today once to days and keeps 120 entries', () => {
      const { record, progress } = fresh()
      progress.value.days = Array.from({ length: 120 }, (_, i) => `2025-01-${String(i).padStart(3, '0')}`)
      record(mathGame, 1)
      record(mathGame, 2)
      expect(progress.value.days).toHaveLength(120)
      expect(progress.value.days.filter(d => d === '2026-05-10')).toHaveLength(1)
      expect(progress.value.days.at(-1)).toBe('2026-05-10')
    })
  })

  describe('record with a difficulty (functional-requirements §3.1)', () => {
    it('keeps the medium best under the plain game id', () => {
      const { record, progress } = fresh()
      record(tieredAs('medium'), 9)
      expect(progress.value.best.tiered).toBe(9)
      expect(Object.keys(progress.value.best)).toEqual(['tiered'])
    })

    it('stores the easy and hard bests under id@easy and id@hard', () => {
      const { record, progress } = fresh()
      record(tieredAs('easy'), 14)
      record(tieredAs('hard'), 5)
      expect(progress.value.best).toEqual({ 'tiered@easy': 14, 'tiered@hard': 5 })
    })

    it('compares a score only with the best of the same difficulty', () => {
      const { record, progress } = fresh()
      record(tieredAs('hard'), 30)
      expect(record(tieredAs('medium'), 5)).toMatchObject({ prev: null, isPB: true })
      expect(record(tieredAs('hard'), 12)).toMatchObject({ prev: 30, isPB: false })
      expect(record(tieredAs('easy'), 2)).toMatchObject({ prev: null, isPB: true })
      expect(progress.value.best).toEqual({ 'tiered@hard': 30, tiered: 5, 'tiered@easy': 2 })
    })

    it('gives the 5 XP bonus only for beating the best of the same difficulty', () => {
      const { record, progress } = fresh()
      record(tieredAs('hard'), 3)
      record(tieredAs('medium'), 9)
      expect(progress.value.xp).toBe(20)
      record(tieredAs('hard'), 4)
      expect(progress.value.xp).toBe(35)
    })

    it('returns the band from the bands of the difficulty', () => {
      const { record } = fresh()
      expect(record(tieredAs('hard'), 9).band).toBe(2)
      expect(record(tieredAs('easy'), 9).band).toBe(0)
      expect(record(tieredAs('medium'), 9).band).toBe(1)
    })

    it('stores easy and hard in the history entry as l', () => {
      const { record, progress } = fresh()
      record(tieredAs('easy'), 1)
      record(tieredAs('hard'), 2)
      expect(progress.value.hist[0]).toMatchObject({ id: 'tiered', s: 2, l: 'hard' })
      expect(progress.value.hist[1]).toMatchObject({ id: 'tiered', s: 1, l: 'easy' })
    })

    it('keeps the plain game id in the history entry', () => {
      const { record, progress } = fresh()
      record(tieredAs('hard'), 2)
      expect(progress.value.hist[0]!.id).toBe('tiered')
    })

    it('marks a medium history entry as medium or leaves l out', () => {
      const { record, progress } = fresh()
      record(tieredAs('medium'), 4)
      expect('l' in progress.value.hist[0]!).toBe(false)
    })

    it('leaves l out for a game without difficulties', () => {
      const { record, progress } = fresh()
      record(mathGame, 4)
      expect(progress.value.hist[0]!.l).toBeUndefined()
    })

    it('does not store the chosen difficulty when recording', () => {
      const { record, progress } = fresh()
      record(tieredAs('hard'), 4)
      expect(progress.value.diff?.tiered).toBeUndefined()
    })

    it('persists the difficulty best to the bgarden key', async () => {
      const { record } = fresh()
      record(tieredAs('hard'), 7)
      await nextTick()
      const saved = JSON.parse(localStorage.getItem(KEY)!)
      expect(saved.best['tiered@hard']).toBe(7)
      expect(saved.hist[0].l).toBe('hard')
    })

    it('loads old stored progress that has no diff and no l', () => {
      localStorage.setItem(
        KEY,
        JSON.stringify({ best: { math: 12 }, hist: [{ id: 'math', s: 12, d: '2026-05-09', t: 1 }], xp: 10 })
      )
      const { progress, record } = fresh()
      expect(progress.value.best.math).toBe(12)
      expect(progress.value.hist[0]!.l).toBeUndefined()
      expect(record(mathGame, 14)).toMatchObject({ prev: 12, isPB: true })
    })

    it('loads stored difficulty choices and bests', () => {
      localStorage.setItem(KEY, JSON.stringify({ best: { 'pairs@hard': 30 }, diff: { pairs: 'hard' } }))
      const { progress } = fresh()
      expect(progress.value.diff).toEqual({ pairs: 'hard' })
      expect(progress.value.best['pairs@hard']).toBe(30)
    })
  })

  describe('streak', () => {
    it('counts consecutive days back from today', () => {
      const { progress, streak } = fresh()
      progress.value.days = ['2026-05-07', '2026-05-08', '2026-05-09', '2026-05-10']
      expect(streak.value).toBe(4)
    })

    it('counts from yesterday when nothing is played today', () => {
      const { progress, streak } = fresh()
      progress.value.days = ['2026-05-08', '2026-05-09']
      expect(streak.value).toBe(2)
    })

    it('stops at a gap', () => {
      const { progress, streak } = fresh()
      progress.value.days = ['2026-05-06', '2026-05-09', '2026-05-10']
      expect(streak.value).toBe(2)
    })

    it('is 0 with no recent days', () => {
      const { progress, streak } = fresh()
      progress.value.days = ['2026-05-01']
      expect(streak.value).toBe(0)
    })
  })

  it('reports playedToday per game', () => {
    const { record, playedToday } = fresh()
    record(mathGame, 3)
    expect(playedToday('math')).toBe(true)
    expect(playedToday('reaction')).toBe(false)
  })

  it('reset clears everything', () => {
    const { record, reset, progress } = fresh()
    record(mathGame, 3)
    reset()
    expect(progress.value.xp).toBe(0)
    expect(progress.value.hist).toEqual([])
  })
})

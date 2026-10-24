import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { clearNuxtState } from '#imports'
import { useProgress } from '~/composables/useProgress'
import { mathGame, reactionGame } from '../fixtures'

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

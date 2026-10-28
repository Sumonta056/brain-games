import { describe, expect, it } from 'vitest'
import { bestStreak, favourite, growthSeries, litNeurons, monthGrid, monthPlayed, shiftMonth } from '~/utils/stats'
import type { HistoryEntry } from '~~/shared/types/game'

const entry = (id: string, t: number): HistoryEntry => ({ id, s: 1, d: '2026-10-01', t })
const oct = (day: number) => `2026-10-${String(day).padStart(2, '0')}`

describe('bestStreak', () => {
  it('is 0 for no days', () => {
    expect(bestStreak([])).toBe(0)
  })

  it('is 1 for a single day', () => {
    expect(bestStreak(['2026-10-05'])).toBe(1)
  })

  it('finds the longest run of consecutive dates', () => {
    expect(bestStreak(['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-09'])).toBe(3)
  })

  it('ignores order and duplicates', () => {
    expect(bestStreak(['2026-05-03', '2026-05-01', '2026-05-02', '2026-05-02', '2026-05-10', '2026-05-01'])).toBe(3)
  })

  it('counts a run across a month end', () => {
    expect(bestStreak(['2026-04-29', '2026-04-30', '2026-05-01'])).toBe(3)
  })

  it('counts a run across a year end', () => {
    expect(bestStreak(['2026-01-01', '2025-12-31', '2025-12-30', '2026-01-02'])).toBe(4)
  })

  it('does not join dates one day apart in different years', () => {
    expect(bestStreak(['2025-10-05', '2026-10-06'])).toBe(1)
  })
})

describe('monthPlayed', () => {
  it('counts the dates in the month', () => {
    const days = ['2025-10-30', '2026-09-30', '2026-10-01', '2026-10-15', '2026-10-31', '2026-11-01']
    expect(monthPlayed(days, '2026-10')).toBe(3)
  })

  it('is 0 when no date is in the month', () => {
    expect(monthPlayed(['2026-01-10', '2025-10-10'], '2026-10')).toBe(0)
    expect(monthPlayed([], '2026-10')).toBe(0)
  })
})

describe('favourite', () => {
  it('is null for an empty history', () => {
    expect(favourite([])).toBeNull()
  })

  it('returns the most frequent id and its count', () => {
    const hist = [entry('math', 6), entry('pairs', 5), entry('math', 4), entry('odd', 3), entry('math', 2)]
    expect(favourite(hist)).toEqual({ id: 'math', count: 3 })
  })

  it('breaks a tie with the id played most recently', () => {
    const hist = [entry('pairs', 4), entry('math', 3), entry('math', 2), entry('pairs', 1)]
    expect(favourite(hist)).toEqual({ id: 'pairs', count: 2 })
  })

  it('breaks a tie with the newest entry even when the other id appears first in a count', () => {
    const hist = [entry('odd', 5), entry('math', 4), entry('math', 3), entry('odd', 2)]
    expect(favourite(hist)).toEqual({ id: 'odd', count: 2 })
    const flipped = [entry('math', 5), entry('odd', 4), entry('odd', 3), entry('math', 2)]
    expect(favourite(flipped)).toEqual({ id: 'math', count: 2 })
  })
})

describe('shiftMonth', () => {
  it.each([
    ['2026-01', -1, '2025-12'],
    ['2025-12', 1, '2026-01'],
    ['2026-10', 0, '2026-10'],
    ['2026-10', -1, '2026-09'],
    ['2026-09', 1, '2026-10'],
    ['2026-10', -13, '2025-09'],
    ['2026-10', 15, '2028-01']
  ])('shifts %s by %i to %s', (month, delta, expected) => {
    expect(shiftMonth(month, delta)).toBe(expected)
  })
})

describe('monthGrid', () => {
  it('starts October 2026 on a Thursday: 3 blanks, 31 dates', () => {
    const { offset, dates } = monthGrid('2026-10')
    expect(offset).toBe(3)
    expect(dates).toHaveLength(31)
    expect(dates[0]).toBe('2026-10-01')
    expect(dates.at(-1)).toBe('2026-10-31')
  })

  it('puts 6 blanks before a month that starts on a Sunday', () => {
    const { offset, dates } = monthGrid('2026-02')
    expect(offset).toBe(6)
    expect(dates).toHaveLength(28)
  })

  it('puts no blank before a month that starts on a Monday', () => {
    const { offset, dates } = monthGrid('2026-06')
    expect(offset).toBe(0)
    expect(dates).toHaveLength(30)
    expect(dates[0]).toBe('2026-06-01')
  })

  it('lists every date in order, including a leap day', () => {
    const { dates } = monthGrid('2028-02')
    expect(dates).toEqual(Array.from({ length: 29 }, (_, i) => `2028-02-${String(i + 1).padStart(2, '0')}`))
  })
})

describe('growthSeries', () => {
  const today = '2026-10-28'

  it('carries values forward from before the month and stops after today', () => {
    const xpDays = { '2026-10-08': 90, '2026-09-20': 40, '2026-10-03': 60, '2026-10-10': 100 }
    const r = growthSeries(xpDays, '2026-10', today)
    expect(r.values).toHaveLength(31)
    const expected = Array.from({ length: 31 }, (_, i) => {
      const day = i + 1
      if (day > 28) return null
      if (day >= 10) return 100
      if (day >= 8) return 90
      if (day >= 3) return 60
      return 40
    })
    expect(r.values).toEqual(expected)
    expect(r.start).toBe(40)
    expect(r.end).toBe(100)
    expect(r.bestDay).toBe(oct(8))
  })

  it('has no value before the first entry and starts from the first value in the month', () => {
    const r = growthSeries({ '2026-10-05': 10, '2026-10-07': 30 }, '2026-10', today)
    expect(r.values.slice(0, 4)).toEqual([null, null, null, null])
    expect(r.values.slice(4, 7)).toEqual([10, 10, 30])
    expect(r.values[27]).toBe(30)
    expect(r.values.slice(28)).toEqual([null, null, null])
    expect(r.start).toBe(10)
    expect(r.end).toBe(30)
    expect(r.bestDay).toBe(oct(7))
  })

  it('measures the gain of a first-ever value from the start, so it is no gain', () => {
    const r = growthSeries({ '2026-10-05': 10 }, '2026-10', today)
    expect(r.start).toBe(10)
    expect(r.end).toBe(10)
    expect(r.bestDay).toBeNull()
  })

  it('counts the gain on day 1 over the value before the month', () => {
    const r = growthSeries({ '2026-09-30': 10, '2026-10-01': 50, '2026-10-02': 60 }, '2026-10', today)
    expect(r.start).toBe(10)
    expect(r.values.slice(0, 3)).toEqual([50, 60, 60])
    expect(r.bestDay).toBe(oct(1))
  })

  it('gives the best day to the first of two equal gains', () => {
    const r = growthSeries({ '2026-09-30': 10, '2026-10-02': 20, '2026-10-04': 30 }, '2026-10', today)
    expect(r.bestDay).toBe(oct(2))
  })

  it('has a null best day when nothing grew in the month', () => {
    const r = growthSeries({ '2026-08-31': 5 }, '2026-09', today)
    expect(r.values).toEqual(Array.from({ length: 30 }, () => 5))
    expect(r.start).toBe(5)
    expect(r.end).toBe(5)
    expect(r.bestDay).toBeNull()
  })

  it('is all null when there is no value', () => {
    const r = growthSeries({}, '2026-10', today)
    expect(r.values).toEqual(Array.from({ length: 31 }, () => null))
    expect(r).toMatchObject({ start: null, end: null, bestDay: null })
  })

  it('is all null when every entry comes after the month', () => {
    const r = growthSeries({ '2026-10-03': 20 }, '2026-09', today)
    expect(r.values.every(v => v === null)).toBe(true)
    expect(r).toMatchObject({ start: null, end: null, bestDay: null })
  })

  it('has no value at all for a month after today', () => {
    const r = growthSeries({ '2026-10-03': 20 }, '2026-11', today)
    expect(r.values.every(v => v === null)).toBe(true)
    expect(r.end).toBeNull()
  })
})

describe('litNeurons', () => {
  it.each([
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 2],
    [4, 3],
    [141, 71],
    [142, 72],
    [143, 72],
    [1000, 72]
  ])('lights %i games as %i of 72 neurons', (played, lit) => {
    expect(litNeurons(played)).toBe(lit)
  })

  it('caps at a different total when given one', () => {
    expect(litNeurons(1000, 10)).toBe(10)
    expect(litNeurons(5, 10)).toBe(3)
  })
})

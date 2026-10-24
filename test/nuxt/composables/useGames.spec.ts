import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useGames } from '~/composables/useGames'

describe('useGames', () => {
  afterEach(() => vi.useRealTimers())

  it('lists all 15 games sorted by order', () => {
    const { games } = useGames()
    expect(games).toHaveLength(15)
    const orders = games.map(g => g.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it('finds a game by id and returns undefined for unknown ids', () => {
    const { byId } = useGames()
    expect(byId('math')?.name).toBe('Mental math')
    expect(byId('nope')).toBeUndefined()
  })

  it('maps each category to its tint variables', () => {
    const { tintVars, fg } = useGames()
    expect(tintVars('Calm')).toEqual({ '--tbg': 'var(--mint-bg)', '--tfg': 'var(--mint-fg)' })
    expect(tintVars('Speed')).toEqual({ '--tbg': 'var(--peach-bg)', '--tfg': 'var(--peach-fg)' })
    expect(fg('Words')).toBe('var(--rose-fg)')
    expect(fg('Memory')).toBe('var(--lilac-fg)')
    expect(fg('Focus')).toBe('var(--sky-fg)')
    expect(fg('Body')).toBe('var(--sun-fg)')
  })

  describe('todaysFive', () => {
    beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }))

    it('returns 5 unique known games', () => {
      vi.setSystemTime(new Date('2026-05-10T08:00:00Z'))
      const { todaysFive, games } = useGames()
      const five = todaysFive()
      expect(five).toHaveLength(5)
      expect(new Set(five.map(g => g.id)).size).toBe(5)
      for (const g of five) expect(games).toContain(g)
    })

    it('is the same all day', () => {
      const { todaysFive } = useGames()
      vi.setSystemTime(new Date('2026-05-10T00:00:01Z'))
      const morning = todaysFive().map(g => g.id)
      vi.setSystemTime(new Date('2026-05-10T23:59:59Z'))
      expect(todaysFive().map(g => g.id)).toEqual(morning)
    })

    it('changes across days', () => {
      const { todaysFive } = useGames()
      const sets = new Set<string>()
      for (let d = 1; d <= 7; d++) {
        vi.setSystemTime(new Date(`2026-05-0${d}T12:00:00Z`))
        sets.add(
          todaysFive()
            .map(g => g.id)
            .join()
        )
      }
      expect(sets.size).toBeGreaterThan(1)
    })
  })
})

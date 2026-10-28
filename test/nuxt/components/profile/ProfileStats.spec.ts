import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import ProfileStats from '~/components/profile/ProfileStats.vue'
import copy from '~/data/copy.json'
import { useGames } from '~/composables/useGames'
import { fill } from '../../fixtures'

const s = copy.profile.stats
const mounted: { unmount: () => void }[] = []

async function stats(progress: object) {
  localStorage.setItem('bgarden', JSON.stringify(progress))
  clearNuxtState('progress')
  const w = await mountSuspended(ProfileStats)
  mounted.push(w)
  return w
}

type Wrapper = Awaited<ReturnType<typeof stats>>

function tile(w: Wrapper, label: string) {
  const t = w.findAll('[data-testid="stat"]').find(x => x.text().includes(label))
  if (!t) throw new Error(`No stat labelled ${label}`)
  return { value: t.get('b').text(), sub: t.get('[data-testid="stat-sub"]').text(), el: t }
}

describe('ProfileStats', () => {
  const totalGames = useGames().games.length

  beforeEach(() => {
    localStorage.clear()
    clearNuxtState('progress')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-28T12:00:00Z'))
  })
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    clearNuxtState('progress')
    localStorage.clear()
    vi.useRealTimers()
  })

  it('shows four tiles in order: streak, games played, this month, personal bests', async () => {
    const w = await stats({})
    const tiles = w.findAll('[data-testid="stat"]')
    expect(tiles).toHaveLength(4)
    expect(tiles[0]!.text()).toContain(s.streak)
    expect(tiles[1]!.text()).toContain(s.played)
    expect(tiles[2]!.text()).toContain(s.month)
    expect(tiles[3]!.text()).toContain(s.bests)
  })

  it('shows zeros for a new player', async () => {
    const w = await stats({})
    expect(tile(w, s.streak)).toMatchObject({ value: '0', sub: fill(s.best, { n: 0 }) })
    expect(tile(w, s.played)).toMatchObject({ value: '0', sub: fill(s.tried, { n: 0, total: totalGames }) })
    expect(tile(w, s.month)).toMatchObject({ value: fill(s.monthValue, { n: 0 }) })
    expect(tile(w, s.bests)).toMatchObject({ value: '0', sub: fill(s.mastered, { n: 0 }) })
  })

  it('shows the current streak with the best run of days', async () => {
    const w = await stats({
      days: [
        '2026-09-30',
        '2026-10-01',
        '2026-10-02',
        '2026-10-03',
        '2026-10-04',
        '2026-10-26',
        '2026-10-27',
        '2026-10-28'
      ]
    })
    expect(tile(w, s.streak)).toMatchObject({ value: '3', sub: fill(s.best, { n: 5 }) })
  })

  it('shows the streak as the best when it is the longest run', async () => {
    const w = await stats({ days: ['2026-10-10', '2026-10-25', '2026-10-26', '2026-10-27'] })
    expect(tile(w, s.streak)).toMatchObject({ value: '3', sub: fill(s.best, { n: 3 }) })
  })

  it('reads games played from played, not the 60 kept in history', async () => {
    const hist = Array.from({ length: 60 }, (_, i) => ({ id: 'math', s: 1, d: '2026-10-20', t: i }))
    const w = await stats({ played: 75, hist })
    expect(tile(w, s.played).value).toBe('75')
  })

  it('falls back to hist.length when played is missing', async () => {
    const hist = Array.from({ length: 4 }, (_, i) => ({ id: 'math', s: 1, d: '2026-10-20', t: i }))
    const w = await stats({ hist })
    expect(tile(w, s.played).value).toBe('4')
  })

  it('counts each game id once in games tried', async () => {
    const w = await stats({ best: { math: 3, 'math@hard': 4, 'pairs@easy': 9, reaction: 300 } })
    expect(tile(w, s.played).sub).toBe(fill(s.tried, { n: 3, total: totalGames }))
  })

  it('counts this month’s days with a meter of days out of the month', async () => {
    const w = await stats({
      days: ['2025-10-05', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-15', '2026-10-27', '2026-10-28']
    })
    const t = tile(w, s.month)
    expect(t.value).toBe(fill(s.monthValue, { n: 5 }))
    const width = (t.el.get('[data-testid="stat-meter"]').element as HTMLElement).style.width
    expect(parseFloat(width)).toBeCloseTo((5 / 31) * 100, 1)
    expect(width.endsWith('%')).toBe(true)
  })

  it('counts personal bests and levels mastered', async () => {
    const w = await stats({
      best: { math: 3, 'math@hard': 4, 'pairs@easy': 9, reaction: 300 },
      mastered: ['pairs@easy', 'math@hard']
    })
    expect(tile(w, s.bests)).toMatchObject({ value: '4', sub: fill(s.mastered, { n: 2 }) })
  })
})

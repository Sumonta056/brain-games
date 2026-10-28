import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import GrowthCard from '~/components/profile/GrowthCard.vue'
import copy from '~/data/copy.json'
import { fill } from '../../fixtures'

const p = copy.profile
const mounted: { unmount: () => void }[] = []

const progress = {
  days: ['2026-09-30', '2026-10-01', '2026-10-08', '2026-10-28'],
  xpDays: { '2026-10-08': 90, '2026-09-30': 40, '2026-10-01': 50, '2026-10-28': 100 }
}

async function growth(month: string, seed: object = progress) {
  localStorage.setItem('bgarden', JSON.stringify(seed))
  clearNuxtState('progress')
  const w = await mountSuspended(GrowthCard, { props: { month } })
  mounted.push(w)
  return w
}

type Wrapper = Awaited<ReturnType<typeof growth>>
const cols = (w: Wrapper) => w.findAll('[data-testid="growth-col"]')

describe('GrowthCard', () => {
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

  it('has one column per date, carrying values forward and empty after today', async () => {
    const w = await growth('2026-10')
    expect(w.find('[data-testid="growth"]').exists()).toBe(true)
    const values = cols(w).map(c => c.attributes('data-value'))
    const expected = Array.from({ length: 31 }, (_, i) => {
      const day = i + 1
      if (day > 28) return ''
      if (day === 28) return '100'
      if (day >= 8) return '90'
      return '50'
    })
    expect(values).toEqual(expected)
  })

  it('marks the dates whose value grew, the first one over the value before the month', async () => {
    const w = await growth('2026-10')
    const up = cols(w)
      .map((c, i) => (c.attributes('data-state') === 'up' ? i + 1 : 0))
      .filter(Boolean)
    expect(up).toEqual([1, 8, 28])
  })

  it('shows the points grown in the month', async () => {
    const w = await growth('2026-10')
    expect(w.get('[data-testid="growth-gain"]').text()).toBe(fill(p.growthGain, { n: 60, month: 'October' }))
  })

  it('leaves dates before the first value empty and does not mark a first-ever value', async () => {
    const w = await growth('2026-09')
    const c = cols(w)
    expect(c).toHaveLength(30)
    expect(c.slice(0, 29).every(x => x.attributes('data-value') === '')).toBe(true)
    expect(c[29]!.attributes('data-value')).toBe('40')
    expect(c.some(x => x.attributes('data-state') === 'up')).toBe(false)
    expect(w.get('[data-testid="growth-gain"]').text()).toBe(fill(p.growthGain, { n: 0, month: 'September' }))
  })

  it('shows the empty message and no columns for a month with no values', async () => {
    const w = await growth('2026-08')
    expect(w.get('[data-testid="growth-empty"]').text()).toBe(p.growthEmpty)
    expect(cols(w)).toHaveLength(0)
  })

  it('shows the empty message for a new player', async () => {
    const w = await growth('2026-10', {})
    expect(w.get('[data-testid="growth-empty"]').text()).toBe(p.growthEmpty)
    expect(cols(w)).toHaveLength(0)
  })
})

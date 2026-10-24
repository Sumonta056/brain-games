import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import HomeHero from '~/components/home/HomeHero.vue'
import copy from '~/data/copy.json'
import { dayNum } from '~/utils/random'
import { iconNames } from '../../fixtures'

const mounted: { unmount: () => void }[] = []

async function heroAt(date: Date) {
  vi.setSystemTime(date)
  const w = await mountSuspended(HomeHero)
  mounted.push(w)
  return w
}

const at = (day: number, hour: number) => new Date(2026, 4, day, hour, 30)

describe('HomeHero', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtState('progress')
    vi.useFakeTimers({ toFake: ['Date'] })
  })
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    clearNuxtState('progress')
    localStorage.clear()
    vi.useRealTimers()
  })

  const greetingFor = (hour: number) => copy.greetings.find(g => g.before > hour)!.text

  it.each([2, 4, 5, 10, 11, 12, 15, 16, 17, 20, 23])('greets with the copy.json greeting for %i:30', async hour => {
    const w = await heroAt(at(10, hour))
    expect(w.get('h1').text()).toBe(greetingFor(hour))
  })

  it.each([
    [4, 'Still awake'],
    [10, 'Good morning'],
    [15, 'Good afternoon'],
    [20, 'Good evening']
  ])('reads the %i:30 greeting from copy.json as %s', async (hour, text) => {
    expect(greetingFor(hour)).toBe(text)
    const w = await heroAt(at(10, hour))
    expect(w.get('h1').text()).toBe(text)
  })

  it('adds the name when it is set', async () => {
    localStorage.setItem('bgarden', JSON.stringify({ name: 'Ana' }))
    const w = await heroAt(at(10, 9))
    expect(w.get('h1').text()).toBe('Good morning, Ana')
  })

  it('shows an affirmation that stays the same all day and rotates by day', async () => {
    const morning = (await heroAt(new Date('2026-05-10T00:10:00Z'))).get('[data-testid="affirmation"]').text()
    const night = (await heroAt(new Date('2026-05-10T23:50:00Z'))).get('[data-testid="affirmation"]').text()
    const next = (await heroAt(new Date('2026-05-11T12:00:00Z'))).get('[data-testid="affirmation"]').text()
    expect(morning.length).toBeGreaterThan(0)
    expect(night).toBe(morning)
    expect(next).not.toBe(morning)
  })

  it.each(['2026-05-10T12:00:00Z', '2026-05-11T12:00:00Z', '2026-05-16T12:00:00Z'])(
    'shows the affirmation for the day from copy.json on %s',
    async iso => {
      const w = await heroAt(new Date(iso))
      expect(w.get('[data-testid="affirmation"]').text()).toBe(copy.affirmations[dayNum() % copy.affirmations.length])
    }
  )

  it('shows the decorative neurons illustration from the brand icons', async () => {
    const w = await heroAt(at(10, 9))
    const neurons = w.findAllComponents({ name: 'NuxtIcon' }).filter(c => c.props('name') === 'bg:brand-neurons')
    expect(neurons).toHaveLength(1)
    expect(neurons[0]!.attributes('data-testid')).toBe('neurons')
    expect(neurons[0]!.attributes('aria-hidden')).toBe('true')
    expect(iconNames(w, '[data-testid="hero-card"]')[0]).toBe('bg:brand-neurons')
  })

  it('includes today’s five and the mood check', async () => {
    const w = await heroAt(at(10, 9))
    expect(w.text()).toContain('Today’s five')
    expect(w.text()).toContain('How’s your brain feeling?')
  })
})

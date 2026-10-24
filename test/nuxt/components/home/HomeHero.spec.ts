import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import HomeHero from '~/components/home/HomeHero.vue'

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

  it.each([
    [2, 'Still awake'],
    [4, 'Still awake'],
    [5, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [16, 'Good afternoon'],
    [17, 'Good evening'],
    [23, 'Good evening']
  ])('greets with the time of day at %i:30', async (hour, greeting) => {
    const w = await heroAt(at(10, hour))
    expect(w.get('h1').text()).toBe(greeting)
  })

  it('adds the name when it is set', async () => {
    localStorage.setItem('bgarden', JSON.stringify({ name: 'Ana' }))
    const w = await heroAt(at(10, 9))
    expect(w.get('h1').text()).toBe('Good morning, Ana')
  })

  it('shows an affirmation that stays the same all day and rotates by day', async () => {
    const morning = (await heroAt(new Date('2026-05-10T00:10:00Z'))).get('.aff').text()
    const night = (await heroAt(new Date('2026-05-10T23:50:00Z'))).get('.aff').text()
    const next = (await heroAt(new Date('2026-05-11T12:00:00Z'))).get('.aff').text()
    expect(morning.length).toBeGreaterThan(0)
    expect(night).toBe(morning)
    expect(next).not.toBe(morning)
  })

  it('includes today’s five and the mood check', async () => {
    const w = await heroAt(at(10, 9))
    expect(w.text()).toContain('Today’s five')
    expect(w.text()).toContain('How’s your brain feeling?')
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import FavouriteGame from '~/components/profile/FavouriteGame.vue'
import copy from '~/data/copy.json'
import pairs from '~/data/games/pairs.json'
import { fill, iconNames, mathGame } from '../../fixtures'

const mounted: { unmount: () => void }[] = []
const entry = (id: string, t: number) => ({ id, s: 1, d: '2026-10-20', t })

async function favourite(progress: object) {
  localStorage.setItem('bgarden', JSON.stringify(progress))
  clearNuxtState('progress')
  const w = await mountSuspended(FavouriteGame)
  mounted.push(w)
  return w
}

describe('FavouriteGame', () => {
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

  it('shows the most played game with its icon, name and count', async () => {
    const w = await favourite({
      hist: [entry('pairs', 5), entry('math', 4), entry('math', 3), entry('odd', 2), entry('math', 1)]
    })
    const card = w.get('[data-testid="favourite"]')
    expect(card.text()).toContain(copy.profile.favourite)
    expect(card.text()).toContain(mathGame.name)
    expect(card.text()).toContain(fill(copy.profile.favouriteCount, { n: 3 }))
    expect(iconNames(w, '[data-testid="favourite"]')).toEqual([`bg:games-${mathGame.icon}`])
  })

  it('gives a tie to the game played most recently', async () => {
    const w = await favourite({ hist: [entry('pairs', 4), entry('math', 3), entry('math', 2), entry('pairs', 1)] })
    const card = w.get('[data-testid="favourite"]')
    expect(card.text()).toContain(pairs.name)
    expect(card.text()).not.toContain(mathGame.name)
    expect(card.text()).toContain(fill(copy.profile.favouriteCount, { n: 2 }))
  })

  it('renders nothing when the history is empty', async () => {
    const w = await favourite({})
    expect(w.find('[data-testid="favourite"]').exists()).toBe(false)
    expect(w.text()).not.toContain(copy.profile.favourite)
  })

  it('renders nothing when the favourite id is not a known game', async () => {
    const w = await favourite({ hist: [entry('gone', 3), entry('gone', 2), entry('math', 1)] })
    expect(w.find('[data-testid="favourite"]').exists()).toBe(false)
  })
})

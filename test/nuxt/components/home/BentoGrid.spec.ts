import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import BentoGrid from '~/components/home/BentoGrid.vue'
import { useGames } from '~/composables/useGames'

const mounted: { unmount: () => void }[] = []

async function grid(props: { title?: string } = {}) {
  const w = await mountSuspended(BentoGrid, { props })
  mounted.push(w)
  return w
}

const { games } = useGames()
const sizeOf = (a: { classes: () => string[] }) =>
  (['big', 'wide', 'tall'] as const).find(s => a.classes().includes(s)) ?? 'normal'

describe('BentoGrid', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtState('progress')
  })
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    clearNuxtState('progress')
  })

  it('uses Pick a game as the default title and accepts a custom one', async () => {
    expect((await grid()).get('h2').text()).toBe('Pick a game')
    expect((await grid({ title: 'All games' })).get('h2').text()).toBe('All games')
  })

  it('offers All plus every category as filter chips, with All pressed', async () => {
    const w = await grid()
    const chips = w.findAll('button.chip')
    expect(chips.map(c => c.text())).toEqual(['All', 'Calm', 'Speed', 'Words', 'Memory', 'Focus', 'Body'])
    expect(chips.map(c => c.attributes('aria-pressed'))).toEqual(['true', ...Array(6).fill('false')])
  })

  it('shows every game in order with its own size under All', async () => {
    const w = await grid()
    const tiles = w.findAll('a.tile')
    expect(tiles.map(t => t.attributes('href'))).toEqual(games.map(g => `/games/${g.id}`))
    expect(tiles.map(sizeOf)).toEqual(games.map(g => g.size))
  })

  it('filters by category and presses only that chip', async () => {
    const w = await grid()
    await w
      .findAll('button.chip')
      .find(c => c.text() === 'Speed')!
      .trigger('click')
    const speed = games.filter(g => g.category === 'Speed')
    expect(w.findAll('a.tile').map(t => t.attributes('href'))).toEqual(speed.map(g => `/games/${g.id}`))
    const pressed = w.findAll('button.chip').filter(c => c.attributes('aria-pressed') === 'true')
    expect(pressed.map(c => c.text())).toEqual(['Speed'])
  })

  it('turns big tiles wide and others normal while filtered', async () => {
    const w = await grid()
    await w
      .findAll('button.chip')
      .find(c => c.text() === 'Speed')!
      .trigger('click')
    const speed = games.filter(g => g.category === 'Speed')
    expect(speed.some(g => g.size === 'big')).toBe(true)
    expect(w.findAll('a.tile').map(sizeOf)).toEqual(speed.map(g => (g.size === 'big' ? 'wide' : 'normal')))
  })

  it('goes back to every game when All is picked again', async () => {
    const w = await grid()
    await w
      .findAll('button.chip')
      .find(c => c.text() === 'Calm')!
      .trigger('click')
    await w
      .findAll('button.chip')
      .find(c => c.text() === 'All')!
      .trigger('click')
    expect(w.findAll('a.tile')).toHaveLength(games.length)
  })
})

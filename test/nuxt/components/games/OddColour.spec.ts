import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { clearNuxtState } from '#imports'
import OddColour from '~/components/games/OddColour.vue'
import odd from '~/data/games/odd.json'
import type { GameDef } from '~~/shared/types/game'
import { seeded } from '~/utils/random'

const oddGame = odd as GameDef

type Wrapper = VueWrapper

const tiles = (w: Wrapper) => w.findAll('[aria-label="Tile"]')

function oddIndex(w: Wrapper) {
  const styles = tiles(w).map(t => t.attributes('style') ?? '')
  const idx = styles.findIndex(s => styles.filter(x => x === s).length === 1)
  if (idx < 0) throw new Error('No odd tile found')
  return idx
}

async function solve(w: Wrapper, times: number) {
  for (let i = 0; i < times; i++) await tiles(w)[oddIndex(w)]!.trigger('click')
}

function sizeFor(level: number) {
  return Math.min(7, 2 + Math.floor(level / 3)) ** 2
}

describe('OddColour', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearNuxtState('cheers')
    vi.spyOn(Math, 'random').mockImplementation(seeded(7))
  })
  afterEach(() => vi.useRealTimers())

  it('starts with a 2×2 grid of tile buttons with exactly one odd shade', async () => {
    const wrapper = await mountSuspended(OddColour, { props: { game: oddGame } })
    expect(tiles(wrapper)).toHaveLength(4)
    for (const t of tiles(wrapper)) expect(t.element.tagName).toBe('BUTTON')
    const styles = tiles(wrapper).map(t => t.attributes('style'))
    expect(new Set(styles).size).toBe(2)
    expect(wrapper.text()).toContain('Tap the different tile')
    expect(wrapper.text()).toContain('Score 0')
  })

  it('levels up and deals a new grid when the odd tile is tapped', async () => {
    const wrapper = await mountSuspended(OddColour, { props: { game: oddGame } })
    await solve(wrapper, 1)
    expect(wrapper.text()).toContain('Score 1')
    expect(tiles(wrapper)).toHaveLength(4)
    expect(tiles(wrapper).some(t => t.attributes('data-state') === 'miss')).toBe(false)
  })

  it('grows the grid every 3 levels up to 7×7', async () => {
    const wrapper = await mountSuspended(OddColour, { props: { game: oddGame } })
    for (const level of [2, 3, 6, 9, 12, 15, 18, 21]) {
      await solve(wrapper, level - Number(wrapper.text().match(/Score (\d+)/)![1]))
      expect(tiles(wrapper)).toHaveLength(sizeFor(level))
    }
    expect(tiles(wrapper)).toHaveLength(49)
  })

  it('marks a wrong tile without changing the level', async () => {
    const wrapper = await mountSuspended(OddColour, { props: { game: oddGame } })
    const wrong = (oddIndex(wrapper) + 1) % 4
    const before = tiles(wrapper).map(t => t.attributes('style'))
    await tiles(wrapper)[wrong]!.trigger('click')
    expect(tiles(wrapper)[wrong]!.attributes('data-state')).toBe('miss')
    expect(wrapper.text()).toContain('Score 0')
    expect(tiles(wrapper).map(t => t.attributes('style'))).toEqual(before)
  })

  it('cheers every 4 levels', async () => {
    const wrapper = await mountSuspended(OddColour, { props: { game: oddGame } })
    await solve(wrapper, 3)
    expect(useCheer().cheers.value).toHaveLength(0)
    await solve(wrapper, 1)
    expect(useCheer().cheers.value).toHaveLength(1)
    await solve(wrapper, 4)
    expect(useCheer().cheers.value).toHaveLength(2)
  })

  it('finishes with the levels reached when the 60 seconds run out', async () => {
    const wrapper = await mountSuspended(OddColour, { props: { game: oddGame } })
    await solve(wrapper, 5)
    await vi.advanceTimersByTimeAsync((oddGame.durationSec ?? 0) * 1000 - 1000)
    expect(wrapper.emitted('finish')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(1200)
    expect(wrapper.emitted('finish')).toEqual([[5]])
  })

  it('leaves no timer running after unmount', async () => {
    const wrapper = await mountSuspended(OddColour, { props: { game: oddGame } })
    await solve(wrapper, 1)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('sets the odd tile 22 points lighter at level 0 and only 3 points at level 25', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const wrapper = await mountSuspended(OddColour, { props: { game: oddGame } })
    const lightness = (i: number) => {
      const m = (tiles(wrapper)[i]!.attributes('style') ?? '').match(/hsl\(0,? 45%,? (\d+)%\)/)
      return m ? Number(m[1]) : NaN
    }
    expect(lightness(0) - lightness(1)).toBe(22)
    await solve(wrapper, 25)
    expect(lightness(0) - lightness(1)).toBe(3)
  })
})

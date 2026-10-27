import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { clearNuxtState } from '#imports'
import OddColour from '~/components/games/OddColour.vue'
import odd from '~/data/games/odd.json'
import type { GameDef } from '~~/shared/types/game'
import { seeded } from '~/utils/random'
import { resolvedGame } from '../../fixtures'

const oddGame = resolvedGame(odd as GameDef, 'medium', { start: 0, deltaStep: 0.8 })
const easyGame = resolvedGame(odd as GameDef, 'easy', { start: 0, deltaStep: 0.4 })
const hardGame = resolvedGame(odd as GameDef, 'hard', { start: 3, deltaStep: 1.2 })

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

function scoreOf(w: Wrapper) {
  return Number(w.text().match(/Score (\d+)/)![1])
}

function lightness(w: Wrapper, i: number) {
  const m = (tiles(w)[i]!.attributes('style') ?? '').match(/hsl\(0,? 45%,? ([\d.]+)%\)/)
  return m ? Number(m[1]) : NaN
}

async function deltaAt(w: Wrapper, level: number) {
  await solve(w, level - scoreOf(w))
  return lightness(w, 0) - lightness(w, 1)
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

  it('starts a hard game on a 3×3 grid with the score at 0', async () => {
    const wrapper = await mountSuspended(OddColour, { props: { game: hardGame } })
    expect(tiles(wrapper)).toHaveLength(9)
    expect(scoreOf(wrapper)).toBe(0)
  })

  it('grows the hard grid from start 3 plus the level', async () => {
    const wrapper = await mountSuspended(OddColour, { props: { game: hardGame } })
    for (const level of [2, 3, 5, 6, 9, 12, 15]) {
      await solve(wrapper, level - scoreOf(wrapper))
      expect(tiles(wrapper)).toHaveLength(sizeFor(3 + level))
    }
    expect(tiles(wrapper)).toHaveLength(49)
  })

  it('grows the easy grid every 3 levels from 2×2', async () => {
    const wrapper = await mountSuspended(OddColour, { props: { game: easyGame } })
    expect(tiles(wrapper)).toHaveLength(4)
    for (const level of [2, 3, 6, 15]) {
      await solve(wrapper, level - scoreOf(wrapper))
      expect(tiles(wrapper)).toHaveLength(sizeFor(level))
    }
  })

  it('shrinks the easy colour delta by 0.4 per level down to 3', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const wrapper = await mountSuspended(OddColour, { props: { game: easyGame } })
    expect(await deltaAt(wrapper, 0)).toBeCloseTo(22, 5)
    expect(await deltaAt(wrapper, 10)).toBeCloseTo(18, 5)
    expect(await deltaAt(wrapper, 45)).toBeCloseTo(4, 5)
    expect(await deltaAt(wrapper, 48)).toBeCloseTo(3, 5)
  })

  it('shrinks the medium colour delta by 0.8 per level', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const wrapper = await mountSuspended(OddColour, { props: { game: oddGame } })
    expect(await deltaAt(wrapper, 10)).toBeCloseTo(14, 5)
    expect(await deltaAt(wrapper, 20)).toBeCloseTo(6, 5)
  })

  it('starts the hard colour delta at 18.4 and shrinks it by 1.2 per level down to 3', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const wrapper = await mountSuspended(OddColour, { props: { game: hardGame } })
    expect(await deltaAt(wrapper, 0)).toBeCloseTo(18.4, 5)
    expect(await deltaAt(wrapper, 5)).toBeCloseTo(12.4, 5)
    expect(await deltaAt(wrapper, 12)).toBeCloseTo(4, 5)
    expect(await deltaAt(wrapper, 13)).toBeCloseTo(3, 5)
  })

  it('finishes a hard game with the levels cleared in this run, not counting the start', async () => {
    const wrapper = await mountSuspended(OddColour, { props: { game: hardGame } })
    await solve(wrapper, 4)
    expect(scoreOf(wrapper)).toBe(4)
    await vi.advanceTimersByTimeAsync((hardGame.durationSec ?? 0) * 1000 + 200)
    expect(wrapper.emitted('finish')).toEqual([[4]])
  })
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import type { TileSize } from '~~/shared/types/game'
import GameTile from '~/components/home/GameTile.vue'
import { iconNames, mathGame, reactionGame, tieredGame } from '../../fixtures'

const mounted: { unmount: () => void }[] = []

async function tile(size: TileSize = 'normal', game = mathGame) {
  const w = await mountSuspended(GameTile, { props: { game, size } })
  mounted.push(w)
  return w
}

describe('GameTile', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtState('progress')
  })
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    clearNuxtState('progress')
    localStorage.clear()
  })

  it('links to the game page with a descriptive label', async () => {
    const w = await tile()
    const a = w.get('a')
    expect(a.attributes('href')).toBe('/games/math')
    expect(a.attributes('aria-label')).toBe(`${mathGame.name}: ${mathGame.blurb}`)
  })

  it('shows the name, blurb and level', async () => {
    const w = await tile()
    expect(w.text()).toContain(mathGame.name)
    expect(w.text()).toContain(mathGame.blurb)
    expect(w.text()).toContain(mathGame.level)
  })

  it('shows the game icon as the badge and as the faded background', async () => {
    const w = await tile('normal', reactionGame)
    expect(iconNames(w, '[data-testid="tile-icon"]')).toEqual(['bg:games-reaction'])
    const ghost = w.findAllComponents({ name: 'NuxtIcon' }).filter(c => c.attributes('data-testid') === 'ghost-icon')
    expect(ghost).toHaveLength(1)
    expect(ghost[0]!.props('name')).toBe('bg:games-reaction')
    expect(ghost[0]!.attributes('aria-hidden')).toBe('true')
  })

  it('says not played yet when there is no best', async () => {
    const w = await tile()
    expect(w.text()).toContain('Speed · not played yet')
  })

  it('shows the best score with its band label', async () => {
    localStorage.setItem('bgarden', JSON.stringify({ best: { math: 12 } }))
    const w = await tile()
    expect(w.text()).toContain('Best 12 solved · Sharp')
    expect(w.text()).not.toContain('not played yet')
  })

  it('shows the best of the hardest difficulty played, with its bands and name', async () => {
    localStorage.setItem('bgarden', JSON.stringify({ best: { tiered: 12, 'tiered@hard': 9 } }))
    const w = await tile('normal', tieredGame)
    expect(w.text()).toContain('Best 9 solved · Hard star · Hard')
    expect(w.text()).not.toContain('not played yet')
  })

  it('counts a game played only on easy as played', async () => {
    localStorage.setItem('bgarden', JSON.stringify({ best: { 'tiered@easy': 12 } }))
    const w = await tile('normal', tieredGame)
    expect(w.text()).toContain('Best 12 solved · Easy steady · Easy')
  })

  it('uses the lower-is-better band for reaction time', async () => {
    localStorage.setItem('bgarden', JSON.stringify({ best: { reaction: 320 } }))
    const w = await tile('normal', reactionGame)
    expect(w.text()).toContain(`Best 320 ${reactionGame.unit} · Relaxed`)
  })

  it.each(['wide', 'tall', 'big'] as const)('marks the tile with the %s size', async size => {
    const w = await tile(size)
    expect(w.get('a[data-testid="tile"]').attributes('data-size')).toBe(size)
  })

  it('adds no size marker for normal tiles', async () => {
    const w = await tile('normal')
    expect(w.get('a[data-testid="tile"]').attributes('data-size')).toBeUndefined()
  })

  it('shows Play now only on big tiles', async () => {
    expect((await tile('big')).text()).toContain('Play now')
    expect((await tile('wide')).text()).not.toContain('Play now')
  })

  it('is tinted by its category', async () => {
    const w = await tile()
    const style = w.get('a').attributes('style')
    expect(style).toContain('--tbg: var(--peach-bg)')
    expect(style).toContain('--tfg: var(--peach-fg)')
  })
})

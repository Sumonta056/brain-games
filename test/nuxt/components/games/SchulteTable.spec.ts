import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { clearNuxtState } from '#imports'
import SchulteTable from '~/components/games/SchulteTable.vue'
import schulte from '~/data/games/schulte.json'
import type { GameDef } from '~~/shared/types/game'
import { seeded } from '~/utils/random'
import { resolvedGame } from '../../fixtures'

const schulteGame = resolvedGame(schulte as GameDef, 'medium', { size: 5 })
const easyGame = resolvedGame(schulte as GameDef, 'easy', { size: 4 })
const hardGame = resolvedGame(schulte as GameDef, 'hard', { size: 6 })

type Wrapper = VueWrapper

const cells = (w: Wrapper) => w.findAll('button').filter(b => /^\d+$/.test(b.text().trim()))
const cell = (w: Wrapper, n: number) => {
  const match = cells(w).find(b => b.text().trim() === String(n))
  if (!match) throw new Error(`No cell ${n}`)
  return match
}

async function tapInOrder(w: Wrapper, from: number, to: number, gapMs: number) {
  for (let n = from; n <= to; n++) {
    await vi.advanceTimersByTimeAsync(gapMs)
    await cell(w, n).trigger('click')
  }
}

describe('SchulteTable', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'] })
    clearNuxtState('cheers')
    vi.spyOn(Math, 'random').mockImplementation(seeded(3))
  })
  afterEach(() => vi.useRealTimers())

  it('shows the numbers 1 to 25 as shuffled buttons', async () => {
    const wrapper = await mountSuspended(SchulteTable, { props: { game: schulteGame } })
    const numbers = cells(wrapper).map(b => Number(b.text().trim()))
    expect(numbers).toHaveLength(25)
    expect([...numbers].sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1))
    expect(numbers).not.toEqual(Array.from({ length: 25 }, (_, i) => i + 1))
    expect(wrapper.text()).toContain('Find 1')
  })

  it('marks a correct tap as done and asks for the next number', async () => {
    const wrapper = await mountSuspended(SchulteTable, { props: { game: schulteGame } })
    await cell(wrapper, 1).trigger('click')
    expect(cell(wrapper, 1).attributes('data-state')).toBe('done')
    expect(wrapper.text()).toContain('Find 2')
  })

  it('flashes a wrong tap for 250ms without moving on', async () => {
    const wrapper = await mountSuspended(SchulteTable, { props: { game: schulteGame } })
    await cell(wrapper, 2).trigger('click')
    expect(cell(wrapper, 2).attributes('data-state')).toBe('miss')
    expect(wrapper.text()).toContain('Find 1')
    await vi.advanceTimersByTimeAsync(249)
    expect(cell(wrapper, 2).attributes('data-state')).toBe('miss')
    await vi.advanceTimersByTimeAsync(1)
    expect(cell(wrapper, 2).attributes('data-state')).not.toBe('miss')
    expect(cell(wrapper, 2).attributes('data-state')).not.toBe('done')
  })

  it('lays the medium grid out in 5 columns', async () => {
    const wrapper = await mountSuspended(SchulteTable, { props: { game: schulteGame } })
    expect(wrapper.get('[data-testid="board"]').attributes('data-cols')).toBe('5')
  })

  it('cheers Halfway! after 12 is found', async () => {
    const wrapper = await mountSuspended(SchulteTable, { props: { game: schulteGame } })
    await tapInOrder(wrapper, 1, 11, 0)
    expect(useCheer().cheers.value).toHaveLength(0)
    await cell(wrapper, 12).trigger('click')
    expect(useCheer().cheers.value.map(c => c.text)).toEqual(['Halfway!'])
  })

  it('updates the live timer every 100ms', async () => {
    const wrapper = await mountSuspended(SchulteTable, { props: { game: schulteGame } })
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.text()).toContain('1.0 s')
    await vi.advanceTimersByTimeAsync(300)
    expect(wrapper.text()).toContain('1.3 s')
  })

  it('finishes with the elapsed seconds, to one decimal, 400ms after 25', async () => {
    const wrapper = await mountSuspended(SchulteTable, { props: { game: schulteGame } })
    await tapInOrder(wrapper, 1, 25, 400)
    expect(wrapper.text()).toContain('Done')
    await vi.advanceTimersByTimeAsync(399)
    expect(wrapper.emitted('finish')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.emitted('finish')).toEqual([[10.4]])
  })

  it('gives a slower search a higher time', async () => {
    const wrapper = await mountSuspended(SchulteTable, { props: { game: schulteGame } })
    await tapInOrder(wrapper, 1, 25, 1220)
    await vi.advanceTimersByTimeAsync(400)
    expect(wrapper.emitted('finish')).toEqual([[30.9]])
  })

  it('cells are native buttons for keyboard play', async () => {
    const wrapper = await mountSuspended(SchulteTable, { props: { game: schulteGame } })
    for (const c of cells(wrapper)) expect(c.element.tagName).toBe('BUTTON')
  })

  it('leaves no timer running after unmount', async () => {
    const wrapper = await mountSuspended(SchulteTable, { props: { game: schulteGame } })
    await vi.advanceTimersByTimeAsync(500)
    await cell(wrapper, 3).trigger('click')
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  describe.each([
    ['easy', easyGame, 4],
    ['hard', hardGame, 6]
  ] as const)('on %s', (_, game, size) => {
    const last = size * size
    const oneTo = (n: number) => Array.from({ length: n }, (_, i) => i + 1)

    it(`shows the numbers 1 to ${last} as shuffled buttons`, async () => {
      const wrapper = await mountSuspended(SchulteTable, { props: { game } })
      const numbers = cells(wrapper).map(b => Number(b.text().trim()))
      expect(numbers).toHaveLength(last)
      expect([...numbers].sort((a, b) => a - b)).toEqual(oneTo(last))
      expect(numbers).not.toEqual(oneTo(last))
      expect(wrapper.text()).toContain('Find 1')
    })

    it(`lays the grid out in ${size} columns`, async () => {
      const wrapper = await mountSuspended(SchulteTable, { props: { game } })
      expect(wrapper.get('[data-testid="board"]').attributes('data-cols')).toBe(String(size))
    })

    it(`cheers Halfway! after ${Math.ceil(last / 2) - 1} is found`, async () => {
      const wrapper = await mountSuspended(SchulteTable, { props: { game } })
      const half = Math.ceil(last / 2) - 1
      await tapInOrder(wrapper, 1, half - 1, 0)
      expect(useCheer().cheers.value).toHaveLength(0)
      await cell(wrapper, half).trigger('click')
      expect(useCheer().cheers.value.map(c => c.text)).toEqual(['Halfway!'])
    })

    it(`asks for ${last} after ${last - 1} and does not finish early`, async () => {
      const wrapper = await mountSuspended(SchulteTable, { props: { game } })
      await tapInOrder(wrapper, 1, last - 1, 0)
      expect(wrapper.text()).toContain(`Find ${last}`)
      await vi.advanceTimersByTimeAsync(1000)
      expect(wrapper.emitted('finish')).toBeUndefined()
    })

    it(`finishes once with the elapsed seconds 400ms after ${last}`, async () => {
      const wrapper = await mountSuspended(SchulteTable, { props: { game } })
      await tapInOrder(wrapper, 1, last, 400)
      expect(wrapper.text()).toContain('Done')
      await vi.advanceTimersByTimeAsync(399)
      expect(wrapper.emitted('finish')).toBeUndefined()
      await vi.advanceTimersByTimeAsync(1)
      expect(wrapper.emitted('finish')).toEqual([[Number(((last * 400 + 400) / 1000).toFixed(1))]])
    })
  })
})

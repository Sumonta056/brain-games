import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import MemoryPairs from '~/components/games/MemoryPairs.vue'
import pairs from '~/data/games/pairs.json'
import type { GameDef } from '~~/shared/types/game'
import { seeded } from '~/utils/random'

const emojis = ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍒']
const pairsGame = { ...pairs, content: { emojis } } as GameDef

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

const cards = (w: Wrapper) => w.findAll('[data-testid="card"]')

async function flip(w: Wrapper, i: number) {
  await cards(w)[i]!.trigger('click')
  return cards(w)[i]!.text().trim()
}

async function learnDeck(w: Wrapper) {
  const faces: string[] = []
  let lucky = 0
  for (let i = 0; i < 16; i += 2) {
    const a = await flip(w, i)
    const b = await flip(w, i + 1)
    faces.push(a, b)
    if (a === b) lucky++
    await vi.advanceTimersByTimeAsync(800)
  }
  return { faces, lucky }
}

async function finishFromKnown(w: Wrapper, faces: string[]) {
  for (const e of new Set(faces)) {
    const [i, j] = faces.flatMap((f, k) => (f === e ? [k] : []))
    if (cards(w)[i!]!.attributes('data-state') === 'got') continue
    await flip(w, i!)
    await flip(w, j!)
  }
}

describe('MemoryPairs', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearNuxtState('cheers')
    vi.spyOn(Math, 'random').mockImplementation(seeded(42))
  })
  afterEach(() => vi.useRealTimers())

  it('deals 16 face-down card buttons and shows the move counter', async () => {
    const wrapper = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    const all = cards(wrapper)
    expect(all).toHaveLength(16)
    for (const c of all) {
      expect(c.element.tagName).toBe('BUTTON')
      expect(c.attributes('aria-label')).toBe('Card')
      expect(c.attributes('data-state')).toBe('down')
      expect(c.text().trim()).toBe('')
    }
    expect(wrapper.text()).toContain('Find all 8 pairs')
    expect(wrapper.text()).toContain('Moves 0')
  })

  it('flips a card to show an emoji from the game content without counting a move', async () => {
    const wrapper = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    const face = await flip(wrapper, 0)
    expect(emojis).toContain(face)
    expect(cards(wrapper)[0]!.attributes('data-state')).toBe('up')
    expect(wrapper.text()).toContain('Moves 0')
  })

  it('deals each content emoji exactly twice', async () => {
    const wrapper = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    const { faces } = await learnDeck(wrapper)
    expect([...faces].sort()).toEqual([...emojis, ...emojis].sort())
  })

  it('counts a move for each pair of flips', async () => {
    const wrapper = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    await flip(wrapper, 0)
    await flip(wrapper, 1)
    expect(wrapper.text()).toContain('Moves 1')
    await vi.advanceTimersByTimeAsync(800)
    await flip(wrapper, 2)
    await flip(wrapper, 3)
    expect(wrapper.text()).toContain('Moves 2')
  })

  it('ignores a tap on a card that is already open', async () => {
    const wrapper = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    await flip(wrapper, 0)
    await flip(wrapper, 0)
    expect(wrapper.text()).toContain('Moves 0')
    expect(cards(wrapper)[0]!.attributes('data-state')).toBe('up')
  })

  it('flips a mismatched pair back after 800ms and locks input meanwhile', async () => {
    const first = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    const { faces } = await learnDeck(first)
    first.unmount()
    vi.spyOn(Math, 'random').mockImplementation(seeded(42))
    const wrapper = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    const j = faces.findIndex(f => f !== faces[0])
    const k = faces.findIndex((f, idx) => idx !== 0 && idx !== j)
    await flip(wrapper, 0)
    await flip(wrapper, j)
    expect(wrapper.text()).toContain('Moves 1')
    await cards(wrapper)[k]!.trigger('click')
    expect(cards(wrapper)[k]!.attributes('data-state')).toBe('down')
    await vi.advanceTimersByTimeAsync(799)
    expect(cards(wrapper)[0]!.attributes('data-state')).toBe('up')
    expect(cards(wrapper)[j]!.attributes('data-state')).toBe('up')
    await vi.advanceTimersByTimeAsync(1)
    expect(cards(wrapper)[0]!.attributes('data-state')).toBe('down')
    expect(cards(wrapper)[j]!.attributes('data-state')).toBe('down')
    expect(cards(wrapper)[0]!.text().trim()).toBe('')
    expect(cards(wrapper)[j]!.text().trim()).toBe('')
    await flip(wrapper, k)
    expect(cards(wrapper)[k]!.attributes('data-state')).toBe('up')
  })

  it('keeps a matched pair open and cheers', async () => {
    const first = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    const { faces } = await learnDeck(first)
    first.unmount()
    clearNuxtState('cheers')
    vi.spyOn(Math, 'random').mockImplementation(seeded(42))
    const wrapper = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    const twin = faces.findIndex((f, idx) => idx !== 0 && f === faces[0])
    await flip(wrapper, 0)
    await flip(wrapper, twin)
    expect(wrapper.text()).toContain('Moves 1')
    await vi.advanceTimersByTimeAsync(800)
    expect(cards(wrapper)[0]!.attributes('data-state')).toBe('got')
    expect(cards(wrapper)[twin]!.attributes('data-state')).toBe('got')
    expect(cards(wrapper)[0]!.text().trim()).toBe(faces[0])
    expect(useCheer().cheers.value).toHaveLength(1)
  })

  it('finishes with the move count 700ms after the last pair', async () => {
    const wrapper = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    const { faces, lucky } = await learnDeck(wrapper)
    await finishFromKnown(wrapper, faces)
    const moves = 8 + (8 - lucky)
    expect(wrapper.text()).toContain(`Moves ${moves}`)
    await vi.advanceTimersByTimeAsync(699)
    expect(wrapper.emitted('finish')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.emitted('finish')).toEqual([[moves]])
  })

  it('scores a perfect game as 8 moves, the lowest possible', async () => {
    const first = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    const { faces } = await learnDeck(first)
    first.unmount()
    vi.spyOn(Math, 'random').mockImplementation(seeded(42))
    const wrapper = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    await finishFromKnown(wrapper, faces)
    await vi.advanceTimersByTimeAsync(700)
    expect(wrapper.emitted('finish')).toEqual([[8]])
  })

  it('leaves no timer running after unmount', async () => {
    const first = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    const { faces } = await learnDeck(first)
    first.unmount()
    vi.spyOn(Math, 'random').mockImplementation(seeded(42))
    const wrapper = await mountSuspended(MemoryPairs, { props: { game: pairsGame } })
    await vi.advanceTimersByTimeAsync(2000)
    const j = faces.findIndex(f => f !== faces[0])
    await flip(wrapper, 0)
    await flip(wrapper, j)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

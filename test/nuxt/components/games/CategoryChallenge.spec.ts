import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import type { GameDef } from '~~/shared/types/game'
import CategoryChallenge from '~/components/games/CategoryChallenge.vue'
import { useCheer } from '~/composables/useCheer'
import category from '~/data/games/category.json'

type CategoryGame = GameDef & { content: { categories: string[] } }
const categoryGame = category as unknown as CategoryGame
const withCategories = (categories: string[]): CategoryGame => ({ ...categoryGame, content: { categories } })

async function mountWith(categories = ['Fruits']) {
  return mountSuspended(CategoryChallenge, { props: { game: withCategories(categories) } })
}

type Mounted = Awaited<ReturnType<typeof mountWith>>

async function enter(wrapper: Mounted, value: string) {
  const input = wrapper.get('input[aria-label="Your answer"]')
  await input.setValue(value)
  await input.trigger('keydown', { key: 'Enter' })
}

const feedback = (wrapper: Mounted) => wrapper.get('[data-testid="feedback"]')
const itemTexts = (wrapper: Mounted) => wrapper.findAll('[data-testid="item"]').map(i => i.text())

describe('CategoryChallenge', () => {
  beforeEach(() => {
    clearNuxtState('cheers')
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('shows a category taken from the game content', async () => {
    const wrapper = await mountSuspended(CategoryChallenge, { props: { game: categoryGame } })
    expect(categoryGame.content.categories).toContain(wrapper.get('[data-testid="prompt"]').text())
  })

  it('picks the category at random from the content list', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const wrapper = await mountWith(['Fruits', 'Jobs', 'Sports'])
    expect(wrapper.get('[data-testid="prompt"]').text()).toBe('Sports')
  })

  it('adds an item when Enter is pressed', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, ' Apple ')
    expect(itemTexts(wrapper)).toEqual(['apple'])
    expect(feedback(wrapper).text()).toBe('Added')
    expect(feedback(wrapper).attributes('data-state')).toBe('ok')
    expect(wrapper.get('[data-testid="score"]').text()).toMatch(/\b1\b/)
  })

  it('accepts a two-letter item', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'ox')
    expect(itemTexts(wrapper)).toEqual(['ox'])
  })

  it('asks for a longer answer under 2 letters', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'a')
    expect(feedback(wrapper).text()).toBe('A little longer, please')
    expect(feedback(wrapper).attributes('data-state')).toBe('error')
    expect(itemTexts(wrapper)).toEqual([])
  })

  it('accepts multi-word items', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'Passion Fruit')
    expect(itemTexts(wrapper)).toEqual(['passion fruit'])
  })

  it('does not count a repeat', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'pear')
    await enter(wrapper, 'Pear')
    expect(feedback(wrapper).text()).toBe('You already have that one')
    expect(itemTexts(wrapper)).toEqual(['pear'])
  })

  it('shows the newest item first', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'pear')
    await enter(wrapper, 'plum')
    expect(itemTexts(wrapper)).toEqual(['plum', 'pear'])
  })

  it('cheers after every 5th item', async () => {
    const wrapper = await mountWith()
    const { cheers } = useCheer()
    for (const w of ['pear', 'plum', 'fig', 'lime']) await enter(wrapper, w)
    expect(cheers.value).toHaveLength(0)
    await enter(wrapper, 'kiwi')
    expect(cheers.value).toHaveLength(1)
  })

  it('uses game.durationSec for the time limit', async () => {
    const wrapper = await mountSuspended(CategoryChallenge, {
      props: { game: { ...withCategories(['Fruits']), durationSec: 90 } }
    })
    vi.advanceTimersByTime(89_000)
    expect(wrapper.emitted('finish')).toBeUndefined()
    vi.advanceTimersByTime(1200)
    expect(wrapper.emitted('finish')).toEqual([[0]])
  })

  it('finishes once with the item count after the game duration', async () => {
    const wrapper = await mountWith()
    for (const w of ['pear', 'a', 'plum', 'pear']) await enter(wrapper, w)
    vi.advanceTimersByTime((categoryGame.durationSec ?? 0) * 1000 - 1000)
    expect(wrapper.emitted('finish')).toBeUndefined()
    vi.advanceTimersByTime(1200)
    expect(wrapper.emitted('finish')).toEqual([[2]])
  })

  it('leaves no timer running after unmount', async () => {
    const wrapper = await mountWith()
    for (const w of ['pear', 'plum', 'fig', 'lime', 'kiwi']) await enter(wrapper, w)
    wrapper.unmount()
    vi.advanceTimersByTime(1200)
    expect(vi.getTimerCount()).toBe(0)
  })
})

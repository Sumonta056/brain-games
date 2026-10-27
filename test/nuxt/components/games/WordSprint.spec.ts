import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import type { GameDef } from '~~/shared/types/game'
import WordSprint from '~/components/games/WordSprint.vue'
import { useCheer } from '~/composables/useCheer'
import words from '~/data/games/words.json'

type WordsGame = GameDef & { content: { letters: string[] } }
const wordsGame = words as unknown as WordsGame
const withLetters = (letters: string[]): WordsGame => ({ ...wordsGame, content: { letters } })

async function mountWith(letters = ['S']) {
  return mountSuspended(WordSprint, { props: { game: withLetters(letters) } })
}

type Mounted = Awaited<ReturnType<typeof mountWith>>

async function enter(wrapper: Mounted, value: string) {
  const input = wrapper.get('input[aria-label="Your answer"]')
  await input.setValue(value)
  await input.trigger('keydown', { key: 'Enter' })
}

const feedback = (wrapper: Mounted) => wrapper.get('[data-testid="feedback"]')
const itemTexts = (wrapper: Mounted) => wrapper.findAll('[data-testid="item"]').map(i => i.text())

describe('WordSprint', () => {
  beforeEach(() => {
    clearNuxtState('cheers')
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('shows a start letter taken from the game content', async () => {
    const wrapper = await mountSuspended(WordSprint, { props: { game: wordsGame } })
    const prompt = wrapper.get('[data-testid="prompt"]').text()
    const match = prompt.match(/^Words starting with ([A-Z])$/)
    expect(match).not.toBeNull()
    expect(wordsGame.content.letters).toContain(match![1])
  })

  it('picks the letter at random from the content list', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const wrapper = await mountWith(['B', 'M', 'T'])
    expect(wrapper.get('[data-testid="prompt"]').text()).toBe('Words starting with T')
  })

  it('adds a word that starts with the letter when Enter is pressed', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'Sun')
    expect(itemTexts(wrapper)).toEqual(['sun'])
    expect(feedback(wrapper).text()).toBe('Added')
    expect(feedback(wrapper).attributes('data-state')).toBe('ok')
    expect(wrapper.get('[data-testid="score"]').text()).toMatch(/\b1\b/)
  })

  it('clears the input after Enter', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'sun')
    expect((wrapper.get('input[aria-label="Your answer"]').element as HTMLInputElement).value).toBe('')
  })

  it('does not add anything before Enter', async () => {
    const wrapper = await mountWith()
    await wrapper.get('input[aria-label="Your answer"]').setValue('sun')
    expect(itemTexts(wrapper)).toEqual([])
  })

  it('shows the newest word first', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'sun')
    await enter(wrapper, 'sea')
    expect(itemTexts(wrapper)).toEqual(['sea', 'sun'])
  })

  it('asks for letters only', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 's4m')
    expect(feedback(wrapper).text()).toBe('Letters only, please')
    expect(feedback(wrapper).attributes('data-state')).toBe('error')
    expect(itemTexts(wrapper)).toEqual([])
  })

  it('accepts a contraction with an apostrophe', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, "shan't")
    expect(itemTexts(wrapper)).toEqual(["shan't"])
  })

  it('gives no point for a hyphenated word', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'sister-in-law')
    expect(feedback(wrapper).text()).toBe('I do not know that one yet. Try another')
    expect(itemTexts(wrapper)).toEqual([])
  })

  it('gives no point for a word it does not know', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'sxqz')
    expect(feedback(wrapper).text()).toBe('I do not know that one yet. Try another')
    expect(feedback(wrapper).attributes('data-state')).toBe('error')
    expect(itemTexts(wrapper)).toEqual([])
    expect(wrapper.get('[data-testid="score"]').text()).toMatch(/\b0\b/)
  })

  it('accepts a real word after an unknown one', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'sxqz')
    await enter(wrapper, 'smiled')
    expect(itemTexts(wrapper)).toEqual(['smiled'])
    expect(feedback(wrapper).attributes('data-state')).toBe('ok')
  })

  it('asks for 3 letters or more', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'so')
    expect(feedback(wrapper).text()).toBe('Try 3 letters or more')
    expect(itemTexts(wrapper)).toEqual([])
  })

  it('names the letter when a word starts with another one', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'moon')
    expect(feedback(wrapper).text()).toBe('That one needs to start with S')
    expect(itemTexts(wrapper)).toEqual([])
  })

  it('does not count a repeat', async () => {
    const wrapper = await mountWith()
    await enter(wrapper, 'sun')
    await enter(wrapper, 'SUN')
    expect(feedback(wrapper).text()).toBe('You already have that one')
    expect(itemTexts(wrapper)).toEqual(['sun'])
  })

  it('cheers after every 5th word', async () => {
    const wrapper = await mountWith()
    const { cheers } = useCheer()
    for (const w of ['sun', 'sea', 'sky', 'sand']) await enter(wrapper, w)
    expect(cheers.value).toHaveLength(0)
    await enter(wrapper, 'salt')
    expect(cheers.value).toHaveLength(1)
  })

  it('finishes once with the word count after the game duration', async () => {
    const wrapper = await mountWith()
    for (const w of ['sun', 'sea', 'moon', 'sky', 'sun']) await enter(wrapper, w)
    vi.advanceTimersByTime((wordsGame.durationSec ?? 0) * 1000 - 1000)
    expect(wrapper.emitted('finish')).toBeUndefined()
    vi.advanceTimersByTime(1200)
    expect(wrapper.emitted('finish')).toEqual([[3]])
    vi.advanceTimersByTime(5000)
    expect(wrapper.emitted('finish')).toHaveLength(1)
  })

  it('leaves no timer running after unmount', async () => {
    const wrapper = await mountWith()
    for (const w of ['sun', 'sea', 'sky', 'sand', 'salt']) await enter(wrapper, w)
    wrapper.unmount()
    vi.advanceTimersByTime(1200)
    expect(vi.getTimerCount()).toBe(0)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import type { GameDef } from '~~/shared/types/game'
import WordSprint from '~/components/games/WordSprint.vue'
import { loadWordList } from '~/utils/wordlist'
import words from '~/data/games/words.json'

vi.mock('~/utils/wordlist', async importOriginal => {
  const actual = await importOriginal<typeof import('~/utils/wordlist')>()
  return { ...actual, loadWordList: vi.fn() }
})

type WordsGame = GameDef & { content: { letters: string[] } }
const sGame: WordsGame = { ...(words as unknown as WordsGame), content: { letters: ['S'] } }
const durationMs = (sGame.durationSec ?? 0) * 1000

function deferred() {
  let resolve!: (v: Set<string>) => void
  const promise = new Promise<Set<string>>(r => {
    resolve = r
  })
  return { promise, resolve }
}

describe('WordSprint word list loading', () => {
  beforeEach(() => {
    clearNuxtState('cheers')
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('loads the list for its own letter only', async () => {
    vi.mocked(loadWordList).mockResolvedValue(new Set(['sun']))
    await mountSuspended(WordSprint, { props: { game: sGame } })
    expect(loadWordList).toHaveBeenCalledTimes(1)
    expect(String(vi.mocked(loadWordList).mock.calls[0]![0]).toLowerCase()).toBe('s')
  })

  it('starts the countdown only after the list loads', async () => {
    const list = deferred()
    vi.mocked(loadWordList).mockReturnValue(list.promise)
    const mounting = mountSuspended(WordSprint, { props: { game: sGame } })
    await vi.advanceTimersByTimeAsync(durationMs + 5000)
    list.resolve(new Set(['sun']))
    const wrapper = await mounting
    expect(wrapper.emitted('finish')).toBeUndefined()
    expect(wrapper.find('input[aria-label="Your answer"]').exists()).toBe(true)
    vi.advanceTimersByTime(durationMs - 1000)
    expect(wrapper.emitted('finish')).toBeUndefined()
    vi.advanceTimersByTime(1200)
    expect(wrapper.emitted('finish')).toEqual([[0]])
  })

  it('checks words against the loaded list', async () => {
    vi.mocked(loadWordList).mockResolvedValue(new Set(['sun']))
    const wrapper = await mountSuspended(WordSprint, { props: { game: sGame } })
    const input = wrapper.get('input[aria-label="Your answer"]')
    await input.setValue('sea')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.get('[data-testid="feedback"]').text()).toBe('I do not know that one yet. Try another')
    await input.setValue('sun')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.findAll('[data-testid="item"]').map(i => i.text())).toEqual(['sun'])
  })

  it('still plays and counts words when the list fails to load', async () => {
    vi.mocked(loadWordList).mockRejectedValue(new Error('offline'))
    const wrapper = await mountSuspended(WordSprint, { props: { game: sGame } })
    const input = wrapper.get('input[aria-label="Your answer"]')
    await input.setValue('sxqz')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.findAll('[data-testid="item"]').map(i => i.text())).toEqual(['sxqz'])
  })
})

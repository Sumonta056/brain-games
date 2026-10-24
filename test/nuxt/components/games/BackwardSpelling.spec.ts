import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import { clearNuxtState } from '#imports'
import type { GameDef } from '~~/shared/types/game'
import BackwardSpelling from '~/components/games/BackwardSpelling.vue'
import backward from '~/data/games/backward.json'

type BackwardGame = GameDef & { content: { pools: string[][] } }
const backwardGame = backward as unknown as BackwardGame
const POOLS = [['cat'], ['plant'], ['garden'], ['blanket'], ['umbrella']]
const fixedGame: BackwardGame = { ...backwardGame, content: { pools: POOLS } }

async function mountWith(game: BackwardGame = fixedGame) {
  return mountSuspended(BackwardSpelling, { props: { game } })
}

type Mounted = Awaited<ReturnType<typeof mountWith>>

const input = (wrapper: Mounted) => wrapper.get('input[aria-label="Word spelled backwards"]')
const shown = (wrapper: Mounted) => wrapper.get('[data-testid="word"]').text()
const feedback = (wrapper: Mounted) => wrapper.get('[data-testid="feedback"]')
const reversed = (w: string) => w.split('').reverse().join('')
const showMs = (w: string) => 1800 + w.length * 220

async function advance(ms: number) {
  vi.advanceTimersByTime(ms)
  await nextTick()
}

async function enter(wrapper: Mounted, value: string) {
  await input(wrapper).setValue(value)
  await input(wrapper).trigger('keydown', { key: 'Enter' })
}

async function playRound(wrapper: Mounted, right: boolean) {
  const word = shown(wrapper).toLowerCase()
  await advance(showMs(word))
  await enter(wrapper, right ? reversed(word) : 'nope')
  await advance(1200)
  return word
}

describe('BackwardSpelling', () => {
  beforeEach(() => {
    clearNuxtState('cheers')
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('shows a word from the first pool in capitals with the input disabled', async () => {
    const wrapper = await mountWith(backwardGame)
    const word = shown(wrapper)
    expect(word).toBe(word.toUpperCase())
    expect(backwardGame.content.pools[0]).toContain(word.toLowerCase())
    expect(input(wrapper).attributes('disabled')).toBeDefined()
    expect(feedback(wrapper).text()).toBe('Memorise it')
    expect(wrapper.get('[data-testid="round"]').text()).toBe('Round 1 of 8')
  })

  it('hides the word after 1800ms plus 220ms per letter and enables the input', async () => {
    const wrapper = await mountWith()
    expect(shown(wrapper)).toBe('CAT')
    await advance(showMs('cat') - 1)
    expect(shown(wrapper)).toBe('CAT')
    expect(input(wrapper).attributes('disabled')).toBeDefined()
    await advance(1)
    expect(shown(wrapper)).toBe('• • •')
    expect(input(wrapper).attributes('disabled')).toBeUndefined()
    expect(feedback(wrapper).text()).toBe('Now type it backwards')
  })

  it('ignores Enter while the word is still shown', async () => {
    const wrapper = await mountWith()
    await input(wrapper).trigger('keydown', { key: 'Enter' })
    expect(feedback(wrapper).text()).toBe('Memorise it')
    await advance(showMs('cat'))
    expect(wrapper.get('[data-testid="score"]').text()).toMatch(/\b0\b/)
  })

  it('scores the word typed backwards on Enter, ignoring case and spaces', async () => {
    const wrapper = await mountWith()
    await advance(showMs('cat'))
    await enter(wrapper, ' TAC ')
    expect(feedback(wrapper).text()).toBe('Correct: tac')
    expect(feedback(wrapper).attributes('data-state')).toBe('ok')
    expect(wrapper.get('[data-testid="score"]').text()).toMatch(/\b1\b/)
    expect(input(wrapper).attributes('disabled')).toBeDefined()
  })

  it('shows the reversed word kindly after a wrong answer', async () => {
    const wrapper = await mountWith()
    await advance(showMs('cat'))
    await enter(wrapper, 'cat')
    expect(feedback(wrapper).text()).toBe('It was tac. Next one!')
    expect(feedback(wrapper).attributes('data-state')).not.toBe('ok')
    expect(wrapper.get('[data-testid="score"]').text()).toMatch(/\b0\b/)
  })

  it('starts the next round 1200ms after an answer', async () => {
    const wrapper = await mountWith()
    await advance(showMs('cat'))
    await enter(wrapper, 'tac')
    await advance(1199)
    expect(wrapper.get('[data-testid="round"]').text()).toBe('Round 1 of 8')
    await advance(1)
    expect(wrapper.get('[data-testid="round"]').text()).toBe('Round 2 of 8')
    expect(shown(wrapper)).toBe('CAT')
    expect(feedback(wrapper).text()).toBe('Memorise it')
  })

  it('moves to longer word pools as the rounds go on', async () => {
    const wrapper = await mountWith()
    const seen: string[] = []
    for (let r = 0; r < 8; r++) seen.push(await playRound(wrapper, true))
    expect(seen).toEqual(['cat', 'cat', 'plant', 'plant', 'garden', 'blanket', 'blanket', 'umbrella'])
  })

  it('finishes once with the number right after 8 rounds', async () => {
    const wrapper = await mountWith()
    const plan = [true, false, true, true, false, true, false, true]
    for (let r = 0; r < 7; r++) await playRound(wrapper, plan[r]!)
    expect(wrapper.emitted('finish')).toBeUndefined()
    const word = shown(wrapper).toLowerCase()
    await advance(showMs(word))
    await enter(wrapper, reversed(word))
    await advance(1199)
    expect(wrapper.emitted('finish')).toBeUndefined()
    await advance(1)
    expect(wrapper.emitted('finish')).toEqual([[5]])
    await advance(10_000)
    expect(wrapper.emitted('finish')).toHaveLength(1)
  })

  it('leaves no timer running after unmount', async () => {
    const wrapper = await mountWith()
    await playRound(wrapper, true)
    wrapper.unmount()
    vi.advanceTimersByTime(1200)
    expect(vi.getTimerCount()).toBe(0)
  })
})

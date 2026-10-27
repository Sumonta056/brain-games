import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import DigitSpan from '~/components/games/DigitSpan.vue'
import { useCheer } from '~/composables/useCheer'
import type { GameDef } from '~~/shared/types/game'
import digits from '~/data/games/digits.json'
import { resolvedGame } from '../../fixtures'

const digitsGame = resolvedGame(digits as GameDef, 'medium', { start: 3, stepMs: 900 })
const easyGame = resolvedGame(digits as GameDef, 'easy', { start: 3, stepMs: 1100 })
const hardGame = resolvedGame(digits as GameDef, 'hard', { start: 5, stepMs: 700 })

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

const display = (w: Wrapper) => w.get('[data-testid="digit"]').text().trim()
const input = (w: Wrapper) => w.get('input[aria-label="Digits"]')
const feedback = (w: Wrapper) => w.get('[data-testid="feedback"]').text().trim()

async function watchRound(w: Wrapper, len: number, stepMs = 900) {
  let seq = ''
  await vi.advanceTimersByTimeAsync(100)
  for (let i = 0; i < len; i++) {
    if (i > 0) await vi.advanceTimersByTimeAsync(stepMs)
    seq += display(w)
  }
  await vi.advanceTimersByTimeAsync(stepMs + 100)
  return seq
}

async function expectTiming(w: Wrapper, len: number, stepMs: number) {
  const hold = stepMs - 250
  for (let i = 0; i < len; i++) {
    await vi.advanceTimersByTimeAsync(i === 0 ? 0 : stepMs - hold)
    expect(display(w)).toMatch(/^\d$/)
    await vi.advanceTimersByTimeAsync(hold - 1)
    expect(display(w)).toMatch(/^\d$/)
    await vi.advanceTimersByTimeAsync(1)
    expect(display(w)).toBe('')
  }
}

async function expectUnlockAt(w: Wrapper, len: number, stepMs: number) {
  await vi.advanceTimersByTimeAsync(len * stepMs + 199)
  expect(input(w).attributes('disabled')).toBeDefined()
  await vi.advanceTimersByTimeAsync(1)
  expect(input(w).attributes('disabled')).toBeUndefined()
  expect(display(w)).toBe('?')
  expect(feedback(w)).toBe(`Type all ${len} digits`)
}

async function answer(w: Wrapper, value: string) {
  await input(w).setValue(value)
  await input(w).trigger('keydown', { key: 'Enter' })
}

const wrongOf = (seq: string) => String((Number(seq[0]) + 1) % 10) + seq.slice(1)

describe('DigitSpan', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearNuxtState('cheers')
  })
  afterEach(() => vi.useRealTimers())

  it('starts at length 3 with the input locked while digits play', async () => {
    const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
    expect(wrapper.text()).toContain('Length 3')
    expect(wrapper.text()).toContain('Score 0')
    expect(input(wrapper).attributes('disabled')).toBeDefined()
    expect(feedback(wrapper)).toBe('Watch…')
  })

  it('shows each digit 900ms apart and hides it after 650ms', async () => {
    const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
    await vi.advanceTimersByTimeAsync(100)
    expect(display(wrapper)).toMatch(/^\d$/)
    await vi.advanceTimersByTimeAsync(600)
    expect(display(wrapper)).toBe('')
    await vi.advanceTimersByTimeAsync(300)
    expect(display(wrapper)).toMatch(/^\d$/)
    await vi.advanceTimersByTimeAsync(650)
    expect(display(wrapper)).toBe('')
    await vi.advanceTimersByTimeAsync(250)
    expect(display(wrapper)).toMatch(/^\d$/)
  })

  it('unlocks the input at len*900+200ms and asks for all digits', async () => {
    const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
    await vi.advanceTimersByTimeAsync(3 * 900 + 199)
    expect(input(wrapper).attributes('disabled')).toBeDefined()
    await vi.advanceTimersByTimeAsync(1)
    expect(input(wrapper).attributes('disabled')).toBeUndefined()
    expect(display(wrapper)).toBe('?')
    expect(feedback(wrapper)).toBe('Type all 3 digits')
  })

  it('ignores Enter while the digits are still playing', async () => {
    const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
    await vi.advanceTimersByTimeAsync(100)
    await input(wrapper).trigger('keydown', { key: 'Enter' })
    expect(feedback(wrapper)).toBe('Watch…')
    expect(wrapper.text()).toContain('Score 0')
  })

  it('adds a digit and cheers after a correct answer, then replays after 1000ms', async () => {
    const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
    const { cheers } = useCheer()
    const seq = await watchRound(wrapper, 3)
    await answer(wrapper, seq)
    expect(feedback(wrapper)).toBe('Correct! One more digit.')
    expect(wrapper.text()).toContain('Score 3')
    expect(cheers.value).toHaveLength(1)
    expect(input(wrapper).attributes('disabled')).toBeDefined()
    await vi.advanceTimersByTimeAsync(999)
    expect(feedback(wrapper)).toBe('Correct! One more digit.')
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.text()).toContain('Length 4')
    expect(feedback(wrapper)).toBe('Watch…')
    expect((await watchRound(wrapper, 4)).length).toBe(4)
    expect(feedback(wrapper)).toBe('Type all 4 digits')
  })

  it('strips non-digit characters from the answer', async () => {
    const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
    const seq = await watchRound(wrapper, 3)
    await answer(wrapper, ` ${seq[0]}-${seq[1]} ${seq[2]}.`)
    expect(feedback(wrapper)).toBe('Correct! One more digit.')
  })

  it('shows the right digits kindly after a miss and retries the same length after 1700ms', async () => {
    const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
    const seq = await watchRound(wrapper, 3)
    await answer(wrapper, wrongOf(seq))
    expect(feedback(wrapper)).toBe(`It was ${seq}. One more try at this length.`)
    expect(wrapper.text()).toContain('Score 0')
    await vi.advanceTimersByTimeAsync(1699)
    expect(feedback(wrapper)).toBe(`It was ${seq}. One more try at this length.`)
    await vi.advanceTimersByTimeAsync(1)
    expect(feedback(wrapper)).toBe('Watch…')
    expect(wrapper.text()).toContain('Length 3')
    expect(wrapper.emitted('finish')).toBeUndefined()
  })

  it('finishes with the longest span 1500ms after two misses in a row', async () => {
    const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
    await answer(wrapper, await watchRound(wrapper, 3))
    await vi.advanceTimersByTimeAsync(1000)
    await answer(wrapper, wrongOf(await watchRound(wrapper, 4)))
    await vi.advanceTimersByTimeAsync(1700)
    const seq = await watchRound(wrapper, 4)
    await answer(wrapper, wrongOf(seq))
    expect(feedback(wrapper)).toBe(`It was ${seq}`)
    await vi.advanceTimersByTimeAsync(1499)
    expect(wrapper.emitted('finish')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.emitted('finish')).toEqual([[3]])
    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.emitted('finish')).toEqual([[3]])
  })

  it('finishes with 0 when the first two tries miss', async () => {
    const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
    await answer(wrapper, wrongOf(await watchRound(wrapper, 3)))
    await vi.advanceTimersByTimeAsync(1700)
    await answer(wrapper, wrongOf(await watchRound(wrapper, 3)))
    await vi.advanceTimersByTimeAsync(1500)
    expect(wrapper.emitted('finish')).toEqual([[0]])
  })

  it('clears the miss count after a success', async () => {
    const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
    await answer(wrapper, wrongOf(await watchRound(wrapper, 3)))
    await vi.advanceTimersByTimeAsync(1700)
    await answer(wrapper, await watchRound(wrapper, 3))
    await vi.advanceTimersByTimeAsync(1000)
    const seq = await watchRound(wrapper, 4)
    await answer(wrapper, wrongOf(seq))
    expect(feedback(wrapper)).toBe(`It was ${seq}. One more try at this length.`)
    await vi.advanceTimersByTimeAsync(3000)
    expect(wrapper.emitted('finish')).toBeUndefined()
  })

  it('uses a numeric keyboard on the answer input', async () => {
    const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
    expect(input(wrapper).attributes('inputmode')).toBe('numeric')
  })

  it('leaves no timer running after unmount', async () => {
    const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
    await vi.advanceTimersByTimeAsync(1000)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps the length label until the next round starts', async () => {
    const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
    const seq = await watchRound(wrapper, 3)
    await answer(wrapper, seq)
    expect(wrapper.text()).toContain('Length 3')
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.text()).toContain('Length 4')
  })

  describe('difficulty settings', () => {
    it('starts hard at length 5 and shows 5 digits', async () => {
      const wrapper = await mountSuspended(DigitSpan, { props: { game: hardGame } })
      expect(wrapper.text()).toContain('Length 5')
      const seq = await watchRound(wrapper, 5, 700)
      expect(seq).toMatch(/^\d{5}$/)
      expect(feedback(wrapper)).toBe('Type all 5 digits')
    })

    it('shows each hard digit for 450ms, one every 700ms', async () => {
      const wrapper = await mountSuspended(DigitSpan, { props: { game: hardGame } })
      await expectTiming(wrapper, 5, 700)
    })

    it('unlocks the hard input at 5*700+200ms', async () => {
      const wrapper = await mountSuspended(DigitSpan, { props: { game: hardGame } })
      await expectUnlockAt(wrapper, 5, 700)
    })

    it('starts easy at length 3 and shows 3 digits', async () => {
      const wrapper = await mountSuspended(DigitSpan, { props: { game: easyGame } })
      expect(wrapper.text()).toContain('Length 3')
      const seq = await watchRound(wrapper, 3, 1100)
      expect(seq).toMatch(/^\d{3}$/)
      expect(feedback(wrapper)).toBe('Type all 3 digits')
    })

    it('shows each easy digit for 850ms, one every 1100ms', async () => {
      const wrapper = await mountSuspended(DigitSpan, { props: { game: easyGame } })
      await expectTiming(wrapper, 3, 1100)
    })

    it('unlocks the easy input at 3*1100+200ms', async () => {
      const wrapper = await mountSuspended(DigitSpan, { props: { game: easyGame } })
      await expectUnlockAt(wrapper, 3, 1100)
    })

    it('unlocks the medium input at 3*900+200ms', async () => {
      const wrapper = await mountSuspended(DigitSpan, { props: { game: digitsGame } })
      await expectUnlockAt(wrapper, 3, 900)
    })

    it('adds one digit after a hard success and scores the span', async () => {
      const wrapper = await mountSuspended(DigitSpan, { props: { game: hardGame } })
      await answer(wrapper, await watchRound(wrapper, 5, 700))
      expect(wrapper.text()).toContain('Score 5')
      await vi.advanceTimersByTimeAsync(1000)
      expect(wrapper.text()).toContain('Length 6')
      expect(await watchRound(wrapper, 6, 700)).toMatch(/^\d{6}$/)
      expect(feedback(wrapper)).toBe('Type all 6 digits')
    })

    it('finishes hard with 0 when the first length fails twice', async () => {
      const wrapper = await mountSuspended(DigitSpan, { props: { game: hardGame } })
      const first = await watchRound(wrapper, 5, 700)
      expect(feedback(wrapper)).toBe('Type all 5 digits')
      await answer(wrapper, wrongOf(first))
      expect(feedback(wrapper)).toBe(`It was ${first}. One more try at this length.`)
      await vi.advanceTimersByTimeAsync(1700)
      expect(wrapper.text()).toContain('Length 5')
      const second = await watchRound(wrapper, 5, 700)
      await answer(wrapper, wrongOf(second))
      expect(feedback(wrapper)).toBe(`It was ${second}`)
      await vi.advanceTimersByTimeAsync(1500)
      expect(wrapper.emitted('finish')).toEqual([[0]])
    })
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import DigitSpan from '~/components/games/DigitSpan.vue'
import { useCheer } from '~/composables/useCheer'
import type { GameDef } from '~~/shared/types/game'
import digits from '~/data/games/digits.json'

const digitsGame = digits as GameDef

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

const display = (w: Wrapper) => w.get('[data-testid="digit"]').text().trim()
const input = (w: Wrapper) => w.get('input[aria-label="Digits"]')
const feedback = (w: Wrapper) => w.get('[data-testid="feedback"]').text().trim()

async function watchRound(w: Wrapper, len: number) {
  let seq = ''
  await vi.advanceTimersByTimeAsync(100)
  for (let i = 0; i < len; i++) {
    if (i > 0) await vi.advanceTimersByTimeAsync(900)
    seq += display(w)
  }
  await vi.advanceTimersByTimeAsync(1000)
  return seq
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
})

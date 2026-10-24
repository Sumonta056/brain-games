import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import SequenceMemory from '~/components/games/SequenceMemory.vue'
import sequence from '~/data/games/sequence.json'
import type { GameDef } from '~~/shared/types/game'
import { seeded } from '~/utils/random'

const sequenceGame = sequence as GameDef

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

const square = (w: Wrapper, i: number) => w.get(`[aria-label="Square ${i + 1}"]`)
const litSquares = (w: Wrapper) =>
  Array.from({ length: 9 }, (_, i) => i).filter(i => square(w, i).attributes('data-state') === 'on')

async function watchLevel(w: Wrapper, len: number) {
  const seq: number[] = []
  let t = 0
  for (let i = 0; i < len; i++) {
    await vi.advanceTimersByTimeAsync(i * 650 + 500 - t)
    t = i * 650 + 500
    const lit = litSquares(w)
    expect(lit).toHaveLength(1)
    seq.push(lit[0]!)
  }
  await vi.advanceTimersByTimeAsync(len * 650 + 550 - t)
  return seq
}

async function repeat(w: Wrapper, seq: number[]) {
  for (const k of seq) await square(w, k).trigger('click')
}

async function clearLevels(w: Wrapper, levels: number) {
  let seq: number[] = []
  for (let len = 1; len <= levels; len++) {
    seq = await watchLevel(w, len)
    await repeat(w, seq)
    await vi.advanceTimersByTimeAsync(700)
  }
  return seq
}

describe('SequenceMemory', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearNuxtState('cheers')
    vi.spyOn(Math, 'random').mockImplementation(seeded(11))
  })
  afterEach(() => vi.useRealTimers())

  it('shows 9 square buttons and starts at level 1', async () => {
    const wrapper = await mountSuspended(SequenceMemory, { props: { game: sequenceGame } })
    for (let i = 0; i < 9; i++) expect(square(wrapper, i).element.tagName).toBe('BUTTON')
    expect(wrapper.text()).toContain('Level 1')
    expect(wrapper.text()).toContain('Watch…')
  })

  it('lights each step from i×650+500ms to i×650+950ms', async () => {
    const wrapper = await mountSuspended(SequenceMemory, { props: { game: sequenceGame } })
    await vi.advanceTimersByTimeAsync(499)
    expect(litSquares(wrapper)).toEqual([])
    await vi.advanceTimersByTimeAsync(1)
    expect(litSquares(wrapper)).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(449)
    expect(litSquares(wrapper)).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(litSquares(wrapper)).toEqual([])
  })

  it('hands over with Your turn at length×650+550ms', async () => {
    const wrapper = await mountSuspended(SequenceMemory, { props: { game: sequenceGame } })
    await vi.advanceTimersByTimeAsync(1199)
    expect(wrapper.text()).not.toContain('Your turn')
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.text()).toContain('Your turn')
  })

  it('ignores taps during playback', async () => {
    const wrapper = await mountSuspended(SequenceMemory, { props: { game: sequenceGame } })
    await vi.advanceTimersByTimeAsync(500)
    const shown = litSquares(wrapper)[0]!
    const wrong = (shown + 1) % 9
    await square(wrapper, wrong).trigger('click')
    expect(square(wrapper, wrong).attributes('data-state')).not.toBe('miss')
    await vi.advanceTimersByTimeAsync(2000)
    expect(wrapper.text()).not.toContain('Nice run!')
    expect(wrapper.emitted('finish')).toBeUndefined()
  })

  it('scores the length and adds one step 700ms after a correct repeat', async () => {
    const wrapper = await mountSuspended(SequenceMemory, { props: { game: sequenceGame } })
    const first = await watchLevel(wrapper, 1)
    await repeat(wrapper, first)
    expect(wrapper.text()).toContain('Score 1')
    await vi.advanceTimersByTimeAsync(699)
    expect(wrapper.text()).toContain('Level 1')
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.text()).toContain('Level 2')
    const second = await watchLevel(wrapper, 2)
    expect(second[0]).toBe(first[0])
  })

  it('cheers every 3 levels', async () => {
    const wrapper = await mountSuspended(SequenceMemory, { props: { game: sequenceGame } })
    await clearLevels(wrapper, 2)
    expect(useCheer().cheers.value).toHaveLength(0)
    const seq = await watchLevel(wrapper, 3)
    await repeat(wrapper, seq)
    expect(useCheer().cheers.value).toHaveLength(1)
  })

  it('ends kindly on a wrong tap and finishes with the last full level after 1000ms', async () => {
    const wrapper = await mountSuspended(SequenceMemory, { props: { game: sequenceGame } })
    await clearLevels(wrapper, 2)
    const seq = await watchLevel(wrapper, 3)
    const wrong = (seq[0]! + 1) % 9
    await square(wrapper, wrong).trigger('click')
    expect(square(wrapper, wrong).attributes('data-state')).toBe('miss')
    expect(wrapper.text()).toContain('Nice run!')
    await vi.advanceTimersByTimeAsync(999)
    expect(wrapper.emitted('finish')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.emitted('finish')).toEqual([[2]])
  })

  it('finishes with 0 when the first level is missed', async () => {
    const wrapper = await mountSuspended(SequenceMemory, { props: { game: sequenceGame } })
    const seq = await watchLevel(wrapper, 1)
    await square(wrapper, (seq[0]! + 4) % 9).trigger('click')
    await square(wrapper, seq[0]!).trigger('click')
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.emitted('finish')).toEqual([[0]])
  })

  it('leaves no timer running after unmount', async () => {
    const wrapper = await mountSuspended(SequenceMemory, { props: { game: sequenceGame } })
    await vi.advanceTimersByTimeAsync(600)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('leaves no timer running after unmount mid-input', async () => {
    const wrapper = await mountSuspended(SequenceMemory, { props: { game: sequenceGame } })
    const seq = await watchLevel(wrapper, 1)
    await square(wrapper, seq[0]!).trigger('click')
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

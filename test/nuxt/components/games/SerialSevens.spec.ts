import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import type { GameDef } from '~~/shared/types/game'
import SerialSevens from '~/components/games/SerialSevens.vue'
import { useCheer } from '~/composables/useCheer'
import serial7 from '~/data/games/serial7.json'

const serialGame = serial7 as GameDef

async function mountGame() {
  return mountSuspended(SerialSevens, { props: { game: serialGame } })
}

type Mounted = Awaited<ReturnType<typeof mountGame>>

const input = (wrapper: Mounted) => wrapper.get('input[aria-label="Next number"]')
const current = (wrapper: Mounted) => wrapper.get('[data-testid="current"]').text()
const feedback = (wrapper: Mounted) => wrapper.get('[data-testid="feedback"]')

async function enter(wrapper: Mounted, value: string | number) {
  await input(wrapper).setValue(String(value))
  await input(wrapper).trigger('keydown', { key: 'Enter' })
}

async function stepRight(wrapper: Mounted, times: number) {
  for (let i = 0; i < times; i++) await enter(wrapper, Number(current(wrapper)) - 7)
}

describe('SerialSevens', () => {
  beforeEach(() => {
    clearNuxtState('cheers')
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })
  afterEach(() => vi.useRealTimers())

  it('starts from a random number of 100 or more', async () => {
    const wrapper = await mountGame()
    expect(current(wrapper)).toBe('100')
    expect(feedback(wrapper).text()).toBe('Press Enter after each number')
  })

  it('starts from a different number when the random value changes', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const wrapper = await mountGame()
    expect(current(wrapper)).toBe('150')
  })

  it('scores a correct step on Enter and moves on from it', async () => {
    const wrapper = await mountGame()
    await enter(wrapper, 93)
    expect(feedback(wrapper).text()).toBe('Correct')
    expect(feedback(wrapper).attributes('data-state')).toBe('ok')
    expect(current(wrapper)).toBe('93')
    expect(wrapper.get('[data-testid="score"]').text()).toMatch(/\b1\b/)
    expect((input(wrapper).element as HTMLInputElement).value).toBe('')
  })

  it('does nothing until Enter is pressed', async () => {
    const wrapper = await mountGame()
    await input(wrapper).setValue('93')
    expect(current(wrapper)).toBe('100')
    expect(feedback(wrapper).text()).toBe('Press Enter after each number')
  })

  it('ignores Enter on an empty input', async () => {
    const wrapper = await mountGame()
    await enter(wrapper, '  ')
    expect(current(wrapper)).toBe('100')
    expect(feedback(wrapper).text()).toBe('Press Enter after each number')
  })

  it('shows the right number kindly after a wrong one and carries on from it', async () => {
    const wrapper = await mountGame()
    await enter(wrapper, 90)
    expect(feedback(wrapper).text()).toBe('It was 93. No worries, carry on from there.')
    expect(feedback(wrapper).attributes('data-state')).not.toBe('ok')
    expect(current(wrapper)).toBe('93')
    expect(wrapper.get('[data-testid="score"]').text()).toMatch(/\b0\b/)
    await enter(wrapper, 86)
    expect(feedback(wrapper).text()).toBe('Correct')
  })

  it('gives a fresh start number when the count drops below 7', async () => {
    const wrapper = await mountGame()
    await stepRight(wrapper, 13)
    expect(current(wrapper)).toBe('9')
    await enter(wrapper, 2)
    expect(feedback(wrapper).text()).toBe('Correct Fresh start number!')
    expect(current(wrapper)).toBe('100')
    expect(wrapper.get('[data-testid="score"]').text()).toMatch(/\b14\b/)
  })

  it('adds the fresh start note after a wrong answer too', async () => {
    const wrapper = await mountGame()
    await stepRight(wrapper, 13)
    await enter(wrapper, 5)
    expect(feedback(wrapper).text()).toBe('It was 2. No worries, carry on from there. Fresh start number!')
    expect(current(wrapper)).toBe('100')
  })

  it('cheers every 4 correct steps', async () => {
    const wrapper = await mountGame()
    const { cheers } = useCheer()
    await stepRight(wrapper, 3)
    await enter(wrapper, 1)
    expect(cheers.value).toHaveLength(0)
    await stepRight(wrapper, 1)
    expect(cheers.value).toHaveLength(1)
  })

  it('uses game.durationSec for the time limit', async () => {
    const wrapper = await mountSuspended(SerialSevens, { props: { game: { ...serialGame, durationSec: 90 } } })
    vi.advanceTimersByTime(89_000)
    expect(wrapper.emitted('finish')).toBeUndefined()
    vi.advanceTimersByTime(1200)
    expect(wrapper.emitted('finish')).toEqual([[0]])
  })

  it('finishes once with the number of correct steps after the game duration', async () => {
    const wrapper = await mountGame()
    await stepRight(wrapper, 2)
    await enter(wrapper, 1)
    await stepRight(wrapper, 1)
    vi.advanceTimersByTime((serialGame.durationSec ?? 0) * 1000 - 1000)
    expect(wrapper.emitted('finish')).toBeUndefined()
    vi.advanceTimersByTime(1200)
    expect(wrapper.emitted('finish')).toEqual([[3]])
    vi.advanceTimersByTime(5000)
    expect(wrapper.emitted('finish')).toHaveLength(1)
  })

  it('leaves no timer running after unmount', async () => {
    const wrapper = await mountGame()
    await stepRight(wrapper, 4)
    wrapper.unmount()
    vi.advanceTimersByTime(1200)
    expect(vi.getTimerCount()).toBe(0)
  })
})

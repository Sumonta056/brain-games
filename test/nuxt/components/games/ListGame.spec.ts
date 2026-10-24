import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import ListGame from '~/components/games/ListGame.vue'

const mountList = (check: (w: string) => string | null = () => null) =>
  mountSuspended(ListGame, { props: { title: 'Fruits', seconds: 10, check } })

describe('ListGame', () => {
  beforeEach(() => {
    clearNuxtState('cheers')
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('shows the title it is given', async () => {
    const wrapper = await mountList()
    expect(wrapper.get('[data-testid="prompt"]').text()).toBe('Fruits')
  })

  it('submits on Enter, clears the input and lists the item', async () => {
    const wrapper = await mountList()
    const input = wrapper.get('input[aria-label="Your answer"]')
    await input.setValue('Mango')
    await input.trigger('keydown', { key: 'Enter' })
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(wrapper.findAll('[data-testid="item"]').map(i => i.text())).toEqual(['mango'])
    expect(wrapper.get('[data-testid="feedback"]').attributes('data-state')).toBe('ok')
    expect(wrapper.get('[data-testid="score"]').text()).toBe('Score 1')
  })

  it('shows the check message as an error and adds nothing', async () => {
    const wrapper = await mountList(() => 'Nope')
    const input = wrapper.get('input[aria-label="Your answer"]')
    await input.setValue('x')
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.get('[data-testid="feedback"]').text()).toBe('Nope')
    expect(wrapper.get('[data-testid="feedback"]').attributes('data-state')).toBe('error')
    expect(wrapper.findAll('[data-testid="item"]')).toHaveLength(0)
  })

  it('emits finish with the item count when time runs out', async () => {
    const wrapper = await mountList()
    const input = wrapper.get('input[aria-label="Your answer"]')
    await input.setValue('kiwi')
    await input.trigger('keydown', { key: 'Enter' })
    await vi.advanceTimersByTimeAsync(10_100)
    expect(wrapper.emitted('finish')).toEqual([[1]])
  })

  it('leaves no timers after unmount', async () => {
    const wrapper = await mountList()
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

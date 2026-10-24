import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BoxBreathing from '~/games/BoxBreathing.vue'
import { breathGame } from '../fixtures'

describe('BoxBreathing', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('finishes with 4 rounds after the full exercise', async () => {
    const wrapper = await mountSuspended(BoxBreathing, { props: { game: breathGame } })
    await vi.advanceTimersByTimeAsync(1200 + 16 * 4000)
    expect(wrapper.emitted('finish')).toEqual([[4]])
    expect(wrapper.text()).toContain('4 of 4 rounds')
  })

  it('walks through the 4 phases', async () => {
    const wrapper = await mountSuspended(BoxBreathing, { props: { game: breathGame } })
    expect(wrapper.text()).toContain('Get ready')
    const labels: string[] = []
    await vi.advanceTimersByTimeAsync(1200)
    for (let i = 0; i < 4; i++) {
      labels.push(wrapper.get('.breath span').text().replace(/\d/g, '').trim())
      await vi.advanceTimersByTimeAsync(4000)
    }
    expect(labels).toEqual(['Breathe in', 'Hold', 'Breathe out', 'Hold'])
    expect(wrapper.text()).toContain('1 of 4 rounds')
  })

  it('finishes early with the completed rounds', async () => {
    const wrapper = await mountSuspended(BoxBreathing, { props: { game: breathGame } })
    await vi.advanceTimersByTimeAsync(1200 + 4 * 4000)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('finish')).toEqual([[1]])
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReactionTime from '~/games/ReactionTime.vue'
import { reactionGame } from '../fixtures'

const MIN_WAIT = 1200

describe('ReactionTime', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] }))
  afterEach(() => vi.useRealTimers())

  async function playRound(target: Awaited<ReturnType<typeof mountSuspended>>, ms: number) {
    await vi.advanceTimersByTimeAsync(MIN_WAIT)
    expect(target.get('.react').classes()).toContain('go2')
    vi.advanceTimersByTime(ms)
    await target.get('.react').trigger('keydown', { key: ' ' })
  }

  it('averages 5 rounds and finishes with the mean in ms', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const wrapper = await mountSuspended(ReactionTime, { props: { game: reactionGame } })
    for (const ms of [200, 250, 300, 250, 200]) {
      await playRound(wrapper, ms)
      await vi.advanceTimersByTimeAsync(1000)
    }
    expect(wrapper.emitted('finish')).toEqual([[240]])
  })

  it('restarts the round with a kind message after an early tap', async () => {
    const wrapper = await mountSuspended(ReactionTime, { props: { game: reactionGame } })
    await wrapper.get('.react').trigger('keydown', { key: 'Enter' })
    expect(wrapper.get('.react').text()).toContain('A little early')
    expect(wrapper.text()).toContain('Round 1 of 5')
    expect(wrapper.emitted('finish')).toBeUndefined()
  })

  it('is focusable for keyboard play', async () => {
    const wrapper = await mountSuspended(ReactionTime, { props: { game: reactionGame } })
    expect(wrapper.get('.react').attributes('tabindex')).toBe('0')
  })
})

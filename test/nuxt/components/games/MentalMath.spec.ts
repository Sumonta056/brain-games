import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MentalMath from '~/components/games/MentalMath.vue'
import { mathGame } from '../../fixtures'

function solve(q: string) {
  const [a, op, b] = q.trim().split(' ')
  const x = Number(a)
  const y = Number(b)
  return op === '+' ? x + y : op === '−' ? x - y : x * y
}

describe('MentalMath', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('scores each correct answer and finishes when time runs out', async () => {
    const wrapper = await mountSuspended(MentalMath, { props: { game: mathGame } })
    const input = wrapper.get('input')
    for (let i = 0; i < 3; i++) {
      await input.setValue(String(solve(wrapper.get('[data-testid="question"]').text())))
    }
    expect(wrapper.text()).toContain('Score 3')
    vi.advanceTimersByTime((mathGame.durationSec ?? 60) * 1000 + 200)
    expect(wrapper.emitted('finish')).toEqual([[3]])
  })

  it('does not score a wrong answer', async () => {
    const wrapper = await mountSuspended(MentalMath, { props: { game: mathGame } })
    const question = wrapper.get('[data-testid="question"]').text()
    await wrapper.get('input').setValue(String(solve(question) + 1))
    expect(wrapper.text()).toContain('Score 0')
    expect(wrapper.get('[data-testid="question"]').text()).toBe(question)
  })

  it('labels the answer input for screen readers', async () => {
    const wrapper = await mountSuspended(MentalMath, { props: { game: mathGame } })
    expect(wrapper.get('input').attributes('aria-label')).toBe('Answer')
  })
})

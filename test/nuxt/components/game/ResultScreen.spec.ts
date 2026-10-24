import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ResultScreen from '~/components/game/ResultScreen.vue'
import { mathGame, reactionGame } from '../../fixtures'

const { confettiSpy } = vi.hoisted(() => ({ confettiSpy: vi.fn() }))
vi.mock('~/utils/confetti', () => ({ confetti: confettiSpy }))

type Result = { prev: number | null; isPB: boolean; band: number }

function mountResult(score: number, result: Result, game = mathGame) {
  return mountSuspended(ResultScreen, { props: { game, score, result } })
}

describe('ResultScreen', () => {
  beforeEach(() => confettiSpy.mockReset())

  it('shows the score, unit, band label and message', async () => {
    const wrapper = await mountResult(12, { prev: null, isPB: true, band: 2 })
    expect(wrapper.get('.score').text()).toBe('12')
    expect(wrapper.get('.unit').text()).toBe('solved')
    expect(wrapper.get('h2').text()).toBe('Sharp')
    expect(wrapper.text()).toContain(mathGame.bands[2]!.message)
  })

  it.each([
    [0, '🌱'],
    [2, '🌼'],
    [4, '🏆']
  ])('picks the emoji for band %i', async (band, emoji) => {
    const wrapper = await mountResult(1, { prev: null, isPB: true, band })
    expect(wrapper.get('.emo').text()).toBe(emoji)
  })

  it('celebrates a first score without confetti', async () => {
    const wrapper = await mountResult(4, { prev: null, isPB: true, band: 0 })
    expect(wrapper.get('.pbtag').text()).toBe('First score planted 🌱')
    expect(confettiSpy).not.toHaveBeenCalled()
  })

  it('announces a new personal best with confetti', async () => {
    const wrapper = await mountResult(15, { prev: 9, isPB: true, band: 2 })
    expect(wrapper.get('.pbtag').text()).toBe('New personal best! Up from 9')
    expect(confettiSpy).toHaveBeenCalledOnce()
  })

  it('says "So close!" when one point short of the best', async () => {
    const wrapper = await mountResult(11, { prev: 12, isPB: false, band: 2 })
    expect(wrapper.find('.pbtag').exists()).toBe(false)
    expect(wrapper.text()).toContain('Your best is 12. So close!')
    expect(confettiSpy).not.toHaveBeenCalled()
  })

  it('stays encouraging when far from the best', async () => {
    const wrapper = await mountResult(3, { prev: 20, isPB: false, band: 0 })
    expect(wrapper.text()).toContain('Your best is 20. Every round still counts.')
    expect(wrapper.text()).not.toMatch(/wrong|fail/i)
  })

  it('allows a closer margin for lower-is-better games', async () => {
    const wrapper = await mountResult(252, { prev: 250, isPB: false, band: 2 }, reactionGame)
    expect(wrapper.text()).toContain('Your best is 250. So close!')
    expect(wrapper.get('.unit').text()).toBe(reactionGame.unit)
  })

  it('emits again from Play again and links to more games', async () => {
    const wrapper = await mountResult(5, { prev: null, isPB: true, band: 0 })
    const again = wrapper.get('button.go')
    expect(again.text()).toBe('Play again')
    await again.trigger('click')
    expect(wrapper.emitted('again')).toHaveLength(1)
    const more = wrapper.get('a.ghost')
    expect(more.text()).toBe('More games')
    expect(more.attributes('href')).toBe('/games')
  })

  it('focuses Play again so Enter replays', async () => {
    const wrapper = await mountSuspended(ResultScreen, {
      props: { game: mathGame, score: 5, result: { prev: null, isPB: true, band: 0 } },
      attachTo: document.body
    })
    expect(document.activeElement).toBe(wrapper.get('button.go').element)
    wrapper.unmount()
  })
})

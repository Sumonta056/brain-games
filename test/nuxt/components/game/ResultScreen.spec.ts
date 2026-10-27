import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ResultScreen from '~/components/game/ResultScreen.vue'
import copy from '~/data/copy.json'
import type { Difficulty } from '~~/shared/types/game'
import { buttonNamed, mathGame, reactionGame } from '../../fixtures'

const { confettiSpy } = vi.hoisted(() => ({ confettiSpy: vi.fn() }))
vi.mock('~/utils/confetti', () => ({ confetti: confettiSpy }))

type Result = { prev: number | null; isPB: boolean; band: number; mastered?: boolean; firstMastery?: boolean }

function mountResult(score: number, result: Result, game = mathGame, next?: Difficulty | null) {
  return mountSuspended(ResultScreen, {
    props: { game, score, result: { mastered: false, firstMastery: false, ...result }, next }
  })
}

const tryHard = copy.levelUp.tryNext.replace('{next}', copy.difficulty.hard)

describe('ResultScreen', () => {
  beforeEach(() => confettiSpy.mockReset())

  it('shows the score, unit, band label and message', async () => {
    const wrapper = await mountResult(12, { prev: null, isPB: true, band: 2 })
    expect(wrapper.get('[data-testid="score"]').text()).toBe('12')
    expect(wrapper.get('[data-testid="unit"]').text()).toBe('solved')
    expect(wrapper.get('h2').text()).toBe('Sharp')
    expect(wrapper.text()).toContain(mathGame.bands[2]!.message)
  })

  it.each([
    [0, '🌱'],
    [2, '🌼'],
    [4, '🏆']
  ])('picks the emoji for band %i', async (band, emoji) => {
    const wrapper = await mountResult(1, { prev: null, isPB: true, band })
    expect(wrapper.get('[data-testid="emoji"]').text()).toBe(emoji)
  })

  it('celebrates a first score without confetti', async () => {
    const wrapper = await mountResult(4, { prev: null, isPB: true, band: 0 })
    expect(wrapper.get('[data-testid="pb-tag"]').text()).toBe('First score planted 🌱')
    expect(confettiSpy).not.toHaveBeenCalled()
  })

  it('announces a new personal best with confetti', async () => {
    const wrapper = await mountResult(15, { prev: 9, isPB: true, band: 2 })
    expect(wrapper.get('[data-testid="pb-tag"]').text()).toBe('New personal best! Up from 9')
    expect(confettiSpy).toHaveBeenCalledOnce()
  })

  it('says "So close!" when one point short of the best', async () => {
    const wrapper = await mountResult(11, { prev: 12, isPB: false, band: 2 })
    expect(wrapper.find('[data-testid="pb-tag"]').exists()).toBe(false)
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
    expect(wrapper.get('[data-testid="unit"]').text()).toBe(reactionGame.unit)
  })

  it('emits again from Play again and links to more games', async () => {
    const wrapper = await mountResult(5, { prev: null, isPB: true, band: 0 })
    const again = buttonNamed(wrapper, 'Play again')
    expect(again.text()).toBe('Play again')
    await again.trigger('click')
    expect(wrapper.emitted('again')).toHaveLength(1)
    const more = wrapper.get('a[href="/games"]')
    expect(more.text()).toBe('More games')
    expect(more.attributes('href')).toBe('/games')
  })

  it('focuses Play again so Enter replays', async () => {
    const wrapper = await mountSuspended(ResultScreen, {
      props: {
        game: mathGame,
        score: 5,
        result: { prev: null, isPB: true, band: 0, mastered: false, firstMastery: false }
      },
      attachTo: document.body
    })
    expect(document.activeElement).toBe(buttonNamed(wrapper, 'Play again').element)
    wrapper.unmount()
  })

  describe('level up (functional-requirements §3.3)', () => {
    it('shows Try Hard on a later mastery when a next difficulty exists', async () => {
      const wrapper = await mountResult(25, { prev: 25, isPB: false, band: 4, mastered: true }, mathGame, 'hard')
      const button = wrapper.get('[data-testid="try-next"]')
      expect(button.element.tagName).toBe('BUTTON')
      expect(button.text()).toBe(tryHard)
      expect(tryHard).toBe('Try Hard')
    })

    it('emits next from Try Hard', async () => {
      const wrapper = await mountResult(25, { prev: 25, isPB: false, band: 4, mastered: true }, mathGame, 'hard')
      await wrapper.get('[data-testid="try-next"]').trigger('click')
      expect(wrapper.emitted('next')).toHaveLength(1)
      expect(wrapper.emitted('again')).toBeUndefined()
    })

    it('keeps Play again next to Try Hard', async () => {
      const wrapper = await mountResult(25, { prev: 25, isPB: false, band: 4, mastered: true }, mathGame, 'hard')
      expect(buttonNamed(wrapper, 'Play again').exists()).toBe(true)
      expect(buttonNamed(wrapper, tryHard).exists()).toBe(true)
    })

    it('shows Try Hard on a first mastery too, for after the popup closes', async () => {
      const wrapper = await mountResult(
        25,
        { prev: null, isPB: true, band: 4, mastered: true, firstMastery: true },
        mathGame,
        'hard'
      )
      expect(wrapper.get('[data-testid="try-next"]').text()).toBe('Try Hard')
    })

    it('hides Try Hard when the result does not master the difficulty', async () => {
      const wrapper = await mountResult(12, { prev: 20, isPB: false, band: 2 }, mathGame, 'hard')
      expect(wrapper.find('[data-testid="try-next"]').exists()).toBe(false)
    })

    it('hides the try button when there is no next difficulty', async () => {
      const wrapper = await mountResult(25, { prev: 25, isPB: false, band: 4, mastered: true }, mathGame, null)
      expect(wrapper.find('[data-testid="try-next"]').exists()).toBe(false)
    })
  })
})

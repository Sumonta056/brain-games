import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import ReadyScreen from '~/components/game/ReadyScreen.vue'
import type { GameDef } from '~~/shared/types/game'
import { breathGame, buttonNamed, mathGame, reactionGame, tieredGame, type Tier } from '../../fixtures'

const mounted: { unmount: () => void }[] = []

async function mountReady(game: GameDef = mathGame, difficulty?: Tier) {
  const props = difficulty ? { game, difficulty } : { game }
  const wrapper = await mountSuspended(ReadyScreen, { props, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

describe('ReadyScreen', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    vi.useRealTimers()
  })

  it('shows Ready? with the game blurb', async () => {
    const wrapper = await mountReady()
    expect(wrapper.get('h2').text()).toBe('Ready?')
    expect(wrapper.text()).toContain(`${mathGame.blurb} Watch the demo, then jump in.`)
    expect(wrapper.text()).not.toContain('..')
  })

  it('starts on the first demo frame with one dot per frame', async () => {
    const wrapper = await mountReady()
    expect(wrapper.get('[data-testid="scene"]').html()).toContain(mathGame.demo[0]!.scene)
    expect(wrapper.get('[data-testid="caption"]').text()).toBe(mathGame.demo[0]!.caption)
    expect(wrapper.findAll('[data-testid="dots"] > *')).toHaveLength(3)
    expect(wrapper.findAll('[data-testid="dots"] > *')[0]!.attributes('data-state')).toBe('on')
  })

  it('auto-plays the demo every 2.2 seconds and loops', async () => {
    const wrapper = await mountReady(breathGame)
    for (const i of [1, 2, 0]) {
      await vi.advanceTimersByTimeAsync(2200)
      expect(wrapper.get('[data-testid="caption"]').text()).toBe(breathGame.demo[i]!.caption)
      expect(wrapper.findAll('[data-testid="dots"] > *')[i]!.attributes('data-state')).toBe('on')
    }
  })

  it('emits start from the Start button', async () => {
    const wrapper = await mountReady()
    await buttonNamed(wrapper, 'Start ▸').trigger('click')
    expect(wrapper.emitted('start')).toHaveLength(1)
  })

  it('focuses Start and also starts on Enter', async () => {
    const wrapper = await mountReady()
    expect(document.activeElement).toBe(buttonNamed(wrapper, 'Start ▸').element)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))
    expect(wrapper.emitted('start')).toHaveLength(1)
  })

  it('stops listening for Enter after unmount', async () => {
    const wrapper = await mountReady()
    mounted.splice(0).forEach(w => w.unmount())
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(wrapper.emitted('start')).toBeUndefined()
  })

  describe('difficulty selector (functional-requirements §3.1)', () => {
    type Wrapper = Awaited<ReturnType<typeof mountReady>>
    const group = (w: Wrapper) => w.get('[data-testid="difficulty"]')
    const radios = (w: Wrapper) => group(w).findAll('[role="radio"]')
    const radio = (w: Wrapper, label: string) => {
      const r = radios(w).find(x => x.text().trim() === label)
      if (!r) throw new Error(`No radio ${label}`)
      return r
    }
    const checked = (w: Wrapper) =>
      radios(w)
        .filter(r => r.attributes('aria-checked') === 'true')
        .map(r => r.text().trim())

    it('shows a radio group with Easy, Medium and Hard for a game with difficulties', async () => {
      const wrapper = await mountReady(tieredGame, 'medium')
      expect(group(wrapper).attributes('role')).toBe('radiogroup')
      expect(radios(wrapper).map(r => r.text().trim())).toEqual(['Easy', 'Medium', 'Hard'])
      radios(wrapper).forEach(r => expect(r.element.tagName).toBe('BUTTON'))
    })

    it('checks only the given difficulty', async () => {
      const wrapper = await mountReady(tieredGame, 'hard')
      expect(checked(wrapper)).toEqual(['Hard'])
      expect(radio(wrapper, 'Easy').attributes('aria-checked')).toBe('false')
      expect(radio(wrapper, 'Medium').attributes('aria-checked')).toBe('false')
    })

    it('follows a new difficulty prop', async () => {
      const wrapper = await mountReady(tieredGame, 'medium')
      await wrapper.setProps({ difficulty: 'easy' })
      expect(checked(wrapper)).toEqual(['Easy'])
    })

    it('emits update:difficulty when a choice is clicked', async () => {
      const wrapper = await mountReady(tieredGame, 'medium')
      await radio(wrapper, 'Easy').trigger('click')
      await radio(wrapper, 'Hard').trigger('click')
      expect(wrapper.emitted('update:difficulty')).toEqual([['easy'], ['hard']])
      expect(wrapper.emitted('start')).toBeUndefined()
    })

    it.each([
      ['medium', 'ArrowRight', 'hard'],
      ['easy', 'ArrowRight', 'medium'],
      ['hard', 'ArrowRight', 'easy'],
      ['medium', 'ArrowLeft', 'easy'],
      ['hard', 'ArrowLeft', 'medium'],
      ['easy', 'ArrowLeft', 'hard']
    ] as [Tier, string, Tier][])('moves from %s with %s to %s', async (from, key, to) => {
      const wrapper = await mountReady(tieredGame, from)
      const label = from[0]!.toUpperCase() + from.slice(1)
      await radio(wrapper, label).trigger('keydown', { key })
      expect(wrapper.emitted('update:difficulty')).toEqual([[to]])
      expect(wrapper.emitted('start')).toBeUndefined()
    })

    it('keeps only the checked radio in the tab order', async () => {
      const wrapper = await mountReady(tieredGame, 'hard')
      expect(radios(wrapper).map(r => r.attributes('tabindex'))).toEqual(['-1', '-1', '0'])
    })

    it('moves focus to the newly checked radio after an arrow key', async () => {
      const wrapper = await mountSuspended(ReadyScreen, {
        props: {
          game: tieredGame,
          difficulty: 'medium' as Tier,
          'onUpdate:difficulty': (d: Tier) => wrapper.setProps({ difficulty: d })
        },
        attachTo: document.body
      })
      mounted.push(wrapper)
      await radio(wrapper, 'Medium').trigger('keydown', { key: 'ArrowRight' })
      await flushPromises()
      expect(document.activeElement).toBe(radio(wrapper, 'Hard').element)
    })

    it('still starts on Enter with the selector shown', async () => {
      const wrapper = await mountReady(tieredGame, 'medium')
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      expect(wrapper.emitted('start')).toHaveLength(1)
      expect(wrapper.emitted('update:difficulty')).toBeUndefined()
    })

    it('still starts from the Start button with the selector shown', async () => {
      const wrapper = await mountReady(tieredGame, 'hard')
      await buttonNamed(wrapper, 'Start ▸').trigger('click')
      expect(wrapper.emitted('start')).toHaveLength(1)
    })

    it.each([
      ['reaction', reactionGame],
      ['breath', breathGame]
    ])('shows no selector for %s, which has no difficulties', async (_, game) => {
      const wrapper = await mountReady(game)
      expect(wrapper.find('[data-testid="difficulty"]').exists()).toBe(false)
      expect(wrapper.find('[role="radiogroup"]').exists()).toBe(false)
    })
  })
})

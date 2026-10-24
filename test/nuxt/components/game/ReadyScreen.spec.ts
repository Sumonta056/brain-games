import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReadyScreen from '~/components/game/ReadyScreen.vue'
import { breathGame, mathGame } from '../../fixtures'

const mounted: { unmount: () => void }[] = []

async function mountReady(game = mathGame) {
  const wrapper = await mountSuspended(ReadyScreen, { props: { game }, attachTo: document.body })
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
    expect(wrapper.text()).toContain(`${mathGame.blurb}. Watch the demo, then jump in.`)
  })

  it('starts on the first demo frame with one dot per frame', async () => {
    const wrapper = await mountReady()
    expect(wrapper.get('.scene').html()).toContain(mathGame.demo[0]!.scene)
    expect(wrapper.get('.cap').text()).toBe(mathGame.demo[0]!.caption)
    expect(wrapper.findAll('.dots i')).toHaveLength(3)
    expect(wrapper.findAll('.dots i')[0]!.classes()).toContain('on')
  })

  it('auto-plays the demo every 2.2 seconds and loops', async () => {
    const wrapper = await mountReady(breathGame)
    for (const i of [1, 2, 0]) {
      await vi.advanceTimersByTimeAsync(2200)
      expect(wrapper.get('.cap').text()).toBe(breathGame.demo[i]!.caption)
      expect(wrapper.findAll('.dots i')[i]!.classes()).toContain('on')
    }
  })

  it('emits start from the Start button', async () => {
    const wrapper = await mountReady()
    await wrapper.get('button.go').trigger('click')
    expect(wrapper.emitted('start')).toHaveLength(1)
  })

  it('focuses Start and also starts on Enter', async () => {
    const wrapper = await mountReady()
    expect(document.activeElement).toBe(wrapper.get('button.go').element)
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
})

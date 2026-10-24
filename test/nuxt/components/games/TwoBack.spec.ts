import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import TwoBack from '~/components/games/TwoBack.vue'
import type { GameDef } from '~~/shared/types/game'
import nback from '~/data/games/nback.json'
import { seeded } from '~/utils/random'

const nbackGame = nback as unknown as GameDef & { content: { letters: string[] } }

const N = 24
const STEP = 2400
const SHOW = 250

type Wrapper = VueWrapper

const letter = (w: Wrapper) => w.get('[data-testid="letter"]').text().trim()
const feedback = (w: Wrapper) => w.get('[data-testid="feedback"]').text().trim()
const matchButton = (w: Wrapper) => {
  const b = w.findAll('button').find(x => x.text().trim() === 'Match')
  if (!b) throw new Error('No Match button')
  return b
}
const pressSpace = () => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))

async function play(
  w: Wrapper,
  shouldPress: (seen: string[], i: number) => boolean,
  press = () => matchButton(w).trigger('click')
) {
  const seen: string[] = []
  const pressed: boolean[] = []
  await vi.advanceTimersByTimeAsync(SHOW)
  for (let i = 0; i < N; i++) {
    if (i > 0) await vi.advanceTimersByTimeAsync(STEP)
    seen.push(letter(w))
    pressed.push(shouldPress(seen, i))
    if (pressed[i]) await press()
  }
  await vi.advanceTimersByTimeAsync(STEP - SHOW)
  return { seen, pressed }
}

function expectedScore(seen: string[], pressed: boolean[]) {
  let ok = 0
  for (let k = 2; k < N; k++) if ((seen[k] === seen[k - 2]) === pressed[k]) ok++
  return Math.round((ok / (N - 2)) * 100)
}

describe('TwoBack', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('reads its letters from game content', () => {
    expect(nbackGame.content.letters.length).toBeGreaterThan(2)
  })

  it('shows each letter 250ms after its step and moves on every 2400ms', async () => {
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    expect(wrapper.text()).toContain('Letter 1 of 24')
    await vi.advanceTimersByTimeAsync(SHOW - 1)
    expect(letter(wrapper)).toBe('')
    await vi.advanceTimersByTimeAsync(1)
    expect(nbackGame.content.letters).toContain(letter(wrapper))
    await vi.advanceTimersByTimeAsync(STEP - SHOW)
    expect(wrapper.text()).toContain('Letter 2 of 24')
    expect(letter(wrapper)).toBe('')
    await vi.advanceTimersByTimeAsync(SHOW)
    expect(nbackGame.content.letters).toContain(letter(wrapper))
  })

  it('shows 24 letters, all from game content, then finishes once', async () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(7))
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    const { seen } = await play(wrapper, () => false)
    expect(seen).toHaveLength(N)
    seen.forEach(l => expect(nbackGame.content.letters).toContain(l))
    expect(wrapper.emitted('finish')).toHaveLength(1)
  })

  it('finishes exactly when the 24th step ends', async () => {
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    await vi.advanceTimersByTimeAsync(N * STEP - 1)
    expect(wrapper.emitted('finish')).toBeUndefined()
    await vi.advanceTimersByTimeAsync(1)
    expect(wrapper.emitted('finish')).toHaveLength(1)
  })

  it('makes a letter a match when the random draw is under 0.3', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.29)
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    const { seen } = await play(wrapper, () => false)
    for (let k = 2; k < N; k++) expect(seen[k]).toBe(seen[k - 2])
  })

  it('scores 100 when every match is pressed', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.29)
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    await play(wrapper, (_, i) => i >= 2)
    expect(wrapper.emitted('finish')).toEqual([[100]])
  })

  it('scores 0 when every match is missed', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.29)
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    await play(wrapper, () => false)
    expect(wrapper.emitted('finish')).toEqual([[0]])
  })

  it('scores the share of right decisions over letters 3 to 24', async () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(42))
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    const { seen, pressed } = await play(wrapper, (_, i) => i % 3 === 0)
    const matches = seen.filter((l, k) => k >= 2 && l === seen[k - 2]).length
    expect(matches).toBeGreaterThan(0)
    expect(matches).toBeLessThan(N - 2)
    expect(wrapper.emitted('finish')).toEqual([[expectedScore(seen, pressed)]])
  })

  it('says Match! and adds a hit when the letter matches 2 back', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.29)
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    await vi.advanceTimersByTimeAsync(2 * STEP + SHOW)
    await matchButton(wrapper).trigger('click')
    expect(feedback(wrapper)).toBe('Match!')
    expect(wrapper.text()).toContain('Score 1')
  })

  it('says Not this time when the letter does not match', async () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(42))
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    const seen: string[] = []
    await vi.advanceTimersByTimeAsync(SHOW)
    seen.push(letter(wrapper))
    for (let i = 1; i < N; i++) {
      await vi.advanceTimersByTimeAsync(STEP)
      seen.push(letter(wrapper))
      if (i >= 2 && seen[i] !== seen[i - 2]) break
    }
    await matchButton(wrapper).trigger('click')
    expect(feedback(wrapper)).toBe('Not this time')
    expect(wrapper.text()).toContain('Score 0')
  })

  it('ignores a press on the first two letters', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.29)
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    await vi.advanceTimersByTimeAsync(SHOW)
    await matchButton(wrapper).trigger('click')
    await vi.advanceTimersByTimeAsync(STEP)
    await matchButton(wrapper).trigger('click')
    expect(feedback(wrapper)).not.toBe('Match!')
    expect(feedback(wrapper)).not.toBe('Not this time')
    expect(wrapper.text()).toContain('Score 0')
  })

  it('counts only the first press on a letter', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.29)
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    await vi.advanceTimersByTimeAsync(2 * STEP + SHOW)
    await matchButton(wrapper).trigger('click')
    await matchButton(wrapper).trigger('click')
    expect(wrapper.text()).toContain('Score 1')
  })

  it('presses Match with the Space key', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.29)
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    await vi.advanceTimersByTimeAsync(2 * STEP + SHOW)
    pressSpace()
    await wrapper.vm.$nextTick()
    expect(feedback(wrapper)).toBe('Match!')
    expect(wrapper.text()).toContain('Score 1')
  })

  it('scores Space presses like button presses', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.29)
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    await play(
      wrapper,
      (_, i) => i >= 2,
      async () => {
        pressSpace()
      }
    )
    expect(wrapper.emitted('finish')).toEqual([[100]])
  })

  it('removes its key listener and timers on unmount', async () => {
    const added: [EventTarget, EventListenerOrEventListenerObject][] = []
    const removed: [EventTarget, EventListenerOrEventListenerObject][] = []
    for (const target of [window, document]) {
      const add = target.addEventListener.bind(target)
      const remove = target.removeEventListener.bind(target)
      vi.spyOn(target, 'addEventListener').mockImplementation(
        (type: string, fn: EventListenerOrEventListenerObject | null, opts?: boolean | EventListenerOptions) => {
          if (type === 'keydown' && fn) added.push([target, fn])
          if (fn) add(type, fn, opts)
        }
      )
      vi.spyOn(target, 'removeEventListener').mockImplementation(
        (type: string, fn: EventListenerOrEventListenerObject | null, opts?: boolean | EventListenerOptions) => {
          if (type === 'keydown' && fn) removed.push([target, fn])
          if (fn) remove(type, fn, opts)
        }
      )
    }
    const wrapper = await mountSuspended(TwoBack, { props: { game: nbackGame } })
    expect(added.length).toBeGreaterThan(0)
    await vi.advanceTimersByTimeAsync(2 * STEP + SHOW)
    wrapper.unmount()
    for (const [target, fn] of added) {
      expect(removed.some(([t, f]) => t === target && f === fn)).toBe(true)
    }
    expect(vi.getTimerCount()).toBe(0)
    expect(() => pressSpace()).not.toThrow()
    expect(wrapper.emitted('finish')).toBeUndefined()
  })
})

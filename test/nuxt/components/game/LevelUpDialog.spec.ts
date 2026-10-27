import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import LevelUpDialog from '~/components/game/LevelUpDialog.vue'
import type { Difficulty } from '~~/shared/types/game'
import copy from '~/data/copy.json'
import { buttonNamed } from '../../fixtures'

const { confettiSpy } = vi.hoisted(() => ({ confettiSpy: vi.fn() }))
vi.mock('~/utils/confetti', () => ({ confetti: confettiSpy }))

let wrapper: VueWrapper | null = null

async function mountDialog(level: Difficulty, next: Difficulty | null) {
  wrapper = await mountSuspended(LevelUpDialog, {
    props: { level, next },
    attachTo: document.body
  })
  return wrapper
}

function buttons(w: VueWrapper) {
  return w.findAll('button')
}

describe('LevelUpDialog', () => {
  beforeEach(() => confettiSpy.mockReset())

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
  })

  it('is a labelled modal dialog', async () => {
    const w = await mountDialog('easy', 'medium')
    const root = w.get('[data-testid="level-up"]')
    expect(root.attributes('role')).toBe('dialog')
    expect(root.attributes('aria-modal')).toBe('true')
    const labelId = root.attributes('aria-labelledby')
    expect(labelId).toBeTruthy()
    const heading = document.getElementById(labelId!)
    expect(heading).not.toBeNull()
    expect(heading!.textContent!.trim()).toBe('You mastered Easy!')
  })

  it('asks about the next difficulty', async () => {
    const w = await mountDialog('easy', 'medium')
    expect(w.text()).toContain('You mastered Easy!')
    expect(w.text()).toContain('Ready for Medium?')
  })

  it('fills the names for a hard mastery', async () => {
    const w = await mountDialog('hard', 'beast')
    expect(w.text()).toContain('You mastered Hard!')
    expect(w.text()).toContain('Ready for Beast?')
    expect(buttonNamed(w, 'Play Beast').exists()).toBe(true)
    expect(buttonNamed(w, 'Stay on Hard').exists()).toBe(true)
  })

  it('offers Play and Stay as real buttons, Play first', async () => {
    const w = await mountDialog('easy', 'medium')
    const all = buttons(w)
    expect(all).toHaveLength(2)
    expect(all[0]!.text().trim()).toBe('Play Medium')
    expect(all[1]!.text().trim()).toBe('Stay on Easy')
  })

  it('emits play from Play Medium', async () => {
    const w = await mountDialog('easy', 'medium')
    await buttonNamed(w, 'Play Medium').trigger('click')
    expect(w.emitted('play')).toHaveLength(1)
    expect(w.emitted('close')).toBeUndefined()
  })

  it('emits close from Stay on Easy', async () => {
    const w = await mountDialog('easy', 'medium')
    await buttonNamed(w, 'Stay on Easy').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
    expect(w.emitted('play')).toBeUndefined()
  })

  it('shows the top message with one Done button on Beast', async () => {
    const w = await mountDialog('beast', null)
    const root = w.get('[data-testid="level-up"]')
    const heading = document.getElementById(root.attributes('aria-labelledby')!)
    expect(heading!.textContent!.trim()).toBe('You tamed Beast!')
    expect(w.text()).toContain('That is the hardest level there is. Amazing work.')
    expect(w.text()).not.toContain('Ready for')
    const all = buttons(w)
    expect(all).toHaveLength(1)
    expect(all[0]!.text().trim()).toBe('Done')
  })

  it('emits close from Done', async () => {
    const w = await mountDialog('beast', null)
    await buttonNamed(w, 'Done').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
    expect(w.emitted('play')).toBeUndefined()
  })

  it('fires confetti once on mount', async () => {
    await mountDialog('easy', 'medium')
    expect(confettiSpy).toHaveBeenCalledOnce()
  })

  it('fires confetti on Beast too', async () => {
    await mountDialog('beast', null)
    expect(confettiSpy).toHaveBeenCalledOnce()
  })

  it('focuses the first button on open', async () => {
    const w = await mountDialog('easy', 'medium')
    expect(document.activeElement).toBe(buttonNamed(w, 'Play Medium').element)
  })

  it('focuses Done on open on Beast', async () => {
    const w = await mountDialog('beast', null)
    expect(document.activeElement).toBe(buttonNamed(w, 'Done').element)
  })

  it('emits close on Escape', async () => {
    const w = await mountDialog('easy', 'medium')
    await w.get('[data-testid="level-up"]').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('close')).toHaveLength(1)
    expect(w.emitted('play')).toBeUndefined()
  })

  it('emits close on Escape from a focused button', async () => {
    const w = await mountDialog('beast', null)
    await buttonNamed(w, 'Done').trigger('keydown', { key: 'Escape' })
    expect(w.emitted('close')).toHaveLength(1)
  })

  const tab = (el: Element, shiftKey = false) => {
    const e = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true })
    el.dispatchEvent(e)
    return e
  }

  it('wraps Tab from the last button to the first and stops the browser default', async () => {
    const w = await mountDialog('easy', 'medium')
    const stay = buttonNamed(w, 'Stay on Easy')
    ;(stay.element as HTMLElement).focus()
    expect(tab(stay.element).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(buttonNamed(w, 'Play Medium').element)
  })

  it('wraps Shift+Tab from the first button to the last and stops the browser default', async () => {
    const w = await mountDialog('easy', 'medium')
    const play = buttonNamed(w, 'Play Medium')
    ;(play.element as HTMLElement).focus()
    expect(tab(play.element, true).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(buttonNamed(w, 'Stay on Easy').element)
  })

  it('leaves Tab alone between two inner buttons', async () => {
    const w = await mountDialog('easy', 'medium')
    const play = buttonNamed(w, 'Play Medium')
    ;(play.element as HTMLElement).focus()
    expect(tab(play.element).defaultPrevented).toBe(false)
  })

  it('keeps focus on Done when tabbing with one button', async () => {
    const w = await mountDialog('beast', null)
    const done = buttonNamed(w, 'Done')
    ;(done.element as HTMLElement).focus()
    expect(tab(done.element).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(done.element)
    expect(tab(done.element, true).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(done.element)
  })

  it('shows the emoji from copy.json', async () => {
    expect((await mountDialog('easy', 'medium')).text()).toContain(copy.levelUp.emoji)
    expect((await mountDialog('beast', null)).text()).toContain(copy.levelUp.topEmoji)
  })

  it('never says Wrong', async () => {
    const w = await mountDialog('medium', 'hard')
    expect(w.text()).not.toMatch(/wrong|fail/i)
  })
})

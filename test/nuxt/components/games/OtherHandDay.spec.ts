import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { clearNuxtState } from '#imports'
import OtherHandDay from '~/components/games/OtherHandDay.vue'
import { useCheer } from '~/composables/useCheer'
import { dayNum, seeded } from '~/utils/random'
import type { GameDef } from '~~/shared/types/game'
import hand from '~/data/games/hand.json'

const handGame = hand as unknown as GameDef & { content: { tasks: string[] } }

type Wrapper = VueWrapper

function todaysTasks() {
  const r = seeded(dayNum() * 7 + 3)
  return handGame.content.tasks
    .slice()
    .sort(() => r() - 0.5)
    .slice(0, 4)
}

const boxes = (w: Wrapper) => w.findAll('input[type="checkbox"]')
const taskLabels = (w: Wrapper) =>
  boxes(w).map(b => (b.element as HTMLInputElement).closest('label')?.textContent?.trim() ?? '')
const button = (w: Wrapper, text: string) => {
  const b = w.findAll('button').find(x => x.text().trim() === text)
  if (!b) throw new Error(`No button ${text}`)
  return b
}

describe('OtherHandDay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-24T09:00:00Z'))
    clearNuxtState('cheers')
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })
  afterEach(() => vi.useRealTimers())

  it('reads at least 4 tasks from game content', () => {
    expect(handGame.content.tasks.length).toBeGreaterThanOrEqual(4)
  })

  it("shows today's 4 date-seeded tasks as checkboxes", async () => {
    const wrapper = await mountSuspended(OtherHandDay, { props: { game: handGame } })
    expect(boxes(wrapper)).toHaveLength(4)
    expect(taskLabels(wrapper)).toEqual(todaysTasks())
  })

  it('keeps the same tasks all day', async () => {
    const morning = await mountSuspended(OtherHandDay, { props: { game: handGame } })
    const first = taskLabels(morning)
    morning.unmount()
    vi.setSystemTime(new Date('2026-10-24T23:30:00Z'))
    const night = await mountSuspended(OtherHandDay, { props: { game: handGame } })
    expect(taskLabels(night)).toEqual(first)
  })

  it("follows the next day's seed tomorrow", async () => {
    vi.setSystemTime(new Date('2026-10-25T09:00:00Z'))
    const wrapper = await mountSuspended(OtherHandDay, { props: { game: handGame } })
    expect(taskLabels(wrapper)).toEqual(todaysTasks())
  })

  it('cheers when a task is ticked, not when it is unticked', async () => {
    const wrapper = await mountSuspended(OtherHandDay, { props: { game: handGame } })
    const { cheers } = useCheer()
    await boxes(wrapper)[0]!.setValue(true)
    expect(cheers.value).toHaveLength(1)
    await boxes(wrapper)[0]!.setValue(false)
    expect(cheers.value).toHaveLength(1)
  })

  it('finishes with the number of ticked tasks', async () => {
    const wrapper = await mountSuspended(OtherHandDay, { props: { game: handGame } })
    await boxes(wrapper)[0]!.setValue(true)
    await boxes(wrapper)[2]!.setValue(true)
    await boxes(wrapper)[3]!.setValue(true)
    await boxes(wrapper)[3]!.setValue(false)
    await button(wrapper, 'Finish').trigger('click')
    expect(wrapper.emitted('finish')).toEqual([[2]])
  })

  it('finishes with 0 when nothing is ticked', async () => {
    const wrapper = await mountSuspended(OtherHandDay, { props: { game: handGame } })
    await button(wrapper, 'Finish').trigger('click')
    expect(wrapper.emitted('finish')).toEqual([[0]])
  })

  it('finishes with 4 when every task is ticked', async () => {
    const wrapper = await mountSuspended(OtherHandDay, { props: { game: handGame } })
    for (const b of boxes(wrapper)) await b.setValue(true)
    await button(wrapper, 'Finish').trigger('click')
    expect(wrapper.emitted('finish')).toEqual([[4]])
  })

  it('has a drawing pad and a Clear pad button that work without a 2D context', async () => {
    const wrapper = await mountSuspended(OtherHandDay, { props: { game: handGame } })
    const pad = wrapper.get('canvas[data-testid="pad"]')
    expect(pad.attributes('aria-label')).toBeTruthy()
    await pad.trigger('pointerdown', { pointerId: 1, offsetX: 5, offsetY: 5 })
    await pad.trigger('pointermove', { pointerId: 1, offsetX: 20, offsetY: 20 })
    await pad.trigger('pointerup', { pointerId: 1 })
    await button(wrapper, 'Clear pad').trigger('click')
    expect(wrapper.emitted('finish')).toBeUndefined()
  })

  it('uses real buttons and checkboxes for keyboard play', async () => {
    const wrapper = await mountSuspended(OtherHandDay, { props: { game: handGame } })
    expect(button(wrapper, 'Finish').element.tagName).toBe('BUTTON')
    expect(button(wrapper, 'Clear pad').element.tagName).toBe('BUTTON')
    expect(boxes(wrapper).every(b => b.element.tagName === 'INPUT')).toBe(true)
  })

  it('leaves no timer running after unmount', async () => {
    const wrapper = await mountSuspended(OtherHandDay, { props: { game: handGame } })
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('draws a line on the pad in the accent colour', async () => {
    const ctx = {
      setTransform: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: ''
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D)
    document.documentElement.style.setProperty('--accent', '#123456')
    const wrapper = await mountSuspended(OtherHandDay, { props: { game: handGame } })
    const pad = wrapper.get('canvas[data-testid="pad"]')
    await pad.trigger('pointerdown', { pointerId: 1 })
    await pad.trigger('pointermove', { pointerId: 1 })
    await pad.trigger('pointerup', { pointerId: 1 })
    await pad.trigger('pointermove', { pointerId: 1 })
    expect(ctx.beginPath).toHaveBeenCalledTimes(1)
    expect(ctx.lineTo).toHaveBeenCalledTimes(1)
    expect(ctx.stroke).toHaveBeenCalledTimes(1)
    expect(ctx.strokeStyle).toBe('#123456')
    document.documentElement.style.removeProperty('--accent')
  })
})

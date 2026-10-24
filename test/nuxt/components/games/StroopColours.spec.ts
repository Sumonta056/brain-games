import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import { clearNuxtState } from '#imports'
import StroopColours from '~/components/games/StroopColours.vue'
import { useCheer } from '~/composables/useCheer'
import type { GameDef } from '~~/shared/types/game'
import stroop from '~/data/games/stroop.json'

type Colour = { name: string; token: string }
const stroopGame = stroop as unknown as GameDef & { content: { colours: Colour[] } }
const NAMES = ['Red', 'Blue', 'Green', 'Yellow']

type Wrapper = VueWrapper

const tokenIn = (style: string | undefined) => style?.match(/var\(--(stroop-[a-z]+)\)/)?.[1]
const word = (w: Wrapper) => w.get('[data-testid="word"]')
const inkToken = (w: Wrapper) => tokenIn(word(w).attributes('style'))
const colourButtons = (w: Wrapper) => w.findAll('[data-testid="colour-buttons"] button')
const buttonFor = (w: Wrapper, t: string) => {
  const b = colourButtons(w).find(x => tokenIn(x.attributes('style')) === t)
  if (!b) throw new Error(`No button for ${t}`)
  return b
}
const tapRight = (w: Wrapper) => buttonFor(w, inkToken(w)!).trigger('click')
const tapWrong = (w: Wrapper) => {
  const ink = inkToken(w)
  const b = colourButtons(w).find(x => tokenIn(x.attributes('style')) !== ink)!
  return b.trigger('click')
}

describe('StroopColours', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearNuxtState('cheers')
  })
  afterEach(() => vi.useRealTimers())

  it('defines the four stroop ink tokens in tokens.css (§6)', () => {
    const css = readFileSync(resolve(process.cwd(), 'app/assets/css/tokens.css'), 'utf8')
    expect(css).toMatch(/--stroop-red:\s*#E04848/i)
    expect(css).toMatch(/--stroop-blue:\s*#2F80E8/i)
    expect(css).toMatch(/--stroop-green:\s*#2E9E5B/i)
    expect(css).toMatch(/--stroop-yellow:\s*#E8A800/i)
  })

  it('reads four colours from game content, each pointing at a stroop token', () => {
    expect(stroopGame.content.colours).toEqual(NAMES.map(name => ({ name, token: `stroop-${name.toLowerCase()}` })))
  })

  it('renders one button per colour, named and filled with its token', async () => {
    const wrapper = await mountSuspended(StroopColours, { props: { game: stroopGame } })
    const buttons = colourButtons(wrapper)
    expect(buttons.map(b => b.text().trim())).toEqual(stroopGame.content.colours.map(c => c.name))
    buttons.forEach((b, i) => {
      expect(b.element.tagName).toBe('BUTTON')
      expect(tokenIn(b.attributes('style'))).toBe(stroopGame.content.colours[i]!.token)
    })
  })

  it('shows a colour name in capitals, inked in a different colour', async () => {
    const wrapper = await mountSuspended(StroopColours, { props: { game: stroopGame } })
    const names = stroopGame.content.colours.map(c => c.name.toUpperCase())
    for (let round = 0; round < 25; round++) {
      const text = word(wrapper).text().trim()
      expect(names).toContain(text)
      const wordToken = stroopGame.content.colours.find(c => c.name.toUpperCase() === text)!.token
      const ink = inkToken(wrapper)
      expect(stroopGame.content.colours.map(c => c.token)).toContain(ink)
      expect(ink).not.toBe(wordToken)
      await tapRight(wrapper)
    }
  })

  it('adds a point for the ink colour and takes one away for any other', async () => {
    const wrapper = await mountSuspended(StroopColours, { props: { game: stroopGame } })
    expect(wrapper.text()).toContain('Score 0')
    await tapRight(wrapper)
    await tapRight(wrapper)
    expect(wrapper.text()).toContain('Score 2')
    await tapWrong(wrapper)
    expect(wrapper.text()).toContain('Score 1')
    await tapWrong(wrapper)
    await tapWrong(wrapper)
    expect(wrapper.text()).toContain('Score -1')
  })

  it('does not count tapping the colour the word names', async () => {
    const wrapper = await mountSuspended(StroopColours, { props: { game: stroopGame } })
    const text = word(wrapper).text().trim()
    const wordToken = stroopGame.content.colours.find(c => c.name.toUpperCase() === text)!.token
    await buttonFor(wrapper, wordToken).trigger('click')
    expect(wrapper.text()).toContain('Score -1')
  })

  it('cheers on every 8 right in a row', async () => {
    const wrapper = await mountSuspended(StroopColours, { props: { game: stroopGame } })
    const { cheers } = useCheer()
    for (let i = 0; i < 7; i++) await tapRight(wrapper)
    expect(cheers.value).toHaveLength(0)
    await tapRight(wrapper)
    expect(cheers.value).toHaveLength(1)
  })

  it('resets the streak after a wrong tap', async () => {
    const wrapper = await mountSuspended(StroopColours, { props: { game: stroopGame } })
    const { cheers } = useCheer()
    for (let i = 0; i < 7; i++) await tapRight(wrapper)
    await tapWrong(wrapper)
    await tapRight(wrapper)
    expect(cheers.value).toHaveLength(0)
    for (let i = 0; i < 7; i++) await tapRight(wrapper)
    expect(cheers.value).toHaveLength(1)
  })

  it('finishes with the score when 45 seconds run out', async () => {
    const wrapper = await mountSuspended(StroopColours, { props: { game: stroopGame } })
    for (let i = 0; i < 4; i++) await tapRight(wrapper)
    await tapWrong(wrapper)
    vi.advanceTimersByTime((stroopGame.durationSec ?? 45) * 1000 - 500)
    expect(wrapper.emitted('finish')).toBeUndefined()
    vi.advanceTimersByTime(700)
    expect(wrapper.emitted('finish')).toEqual([[3]])
  })

  it('never finishes below 0', async () => {
    const wrapper = await mountSuspended(StroopColours, { props: { game: stroopGame } })
    await tapWrong(wrapper)
    await tapWrong(wrapper)
    vi.advanceTimersByTime((stroopGame.durationSec ?? 45) * 1000 + 200)
    expect(wrapper.emitted('finish')).toEqual([[0]])
  })

  it('uses game.durationSec for the time limit', async () => {
    const wrapper = await mountSuspended(StroopColours, { props: { game: { ...stroopGame, durationSec: 10 } } })
    vi.advanceTimersByTime(10_200)
    expect(wrapper.emitted('finish')).toEqual([[0]])
  })

  it('leaves no timer running after unmount', async () => {
    const wrapper = await mountSuspended(StroopColours, { props: { game: stroopGame } })
    vi.advanceTimersByTime(1000)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('gives Yellow dark text and the other buttons white text that does not change with the theme', async () => {
    const wrapper = await mountSuspended(StroopColours, { props: { game: stroopGame } })
    for (const b of colourButtons(wrapper)) {
      const token = tokenIn(b.attributes('style'))
      expect(b.attributes('style')).toContain(`color: var(--${token}-text, var(--stroop-text))`)
    }
    const tokensCss = readFileSync(resolve(process.cwd(), 'app/assets/css/tokens.css'), 'utf8')
    expect(tokensCss).toMatch(/--stroop-text:\s*#fff(fff)?;/i)
    expect(tokensCss).toMatch(/--stroop-yellow-text:\s*#2b1d2f;/i)
    expect([...tokensCss.matchAll(/--(stroop-[a-z]+)-text:/g)].map(m => m[1])).toEqual(['stroop-yellow'])
    const stroopDecls = [...tokensCss.matchAll(/--(stroop-[a-z-]+):/g)].map(m => m[1])
    expect(stroopDecls).toHaveLength(new Set(stroopDecls).size)
  })
})

import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MoodCheck from '~/components/home/MoodCheck.vue'
import { useGames } from '~/composables/useGames'
import copy from '~/data/copy.json'

const { byId } = useGames()
const MOODS: [string, string[], string][] = copy.moods.map(m => [m.label, m.ids, m.msg])

const button = (w: VueWrapper, label: string) => w.findAll('button').find(b => b.text().includes(label))!

describe('MoodCheck', () => {
  it('asks how you feel and offers four moods, none picked', async () => {
    const w = await mountSuspended(MoodCheck)
    expect(w.get('h2').text()).toBe('How’s your brain feeling?')
    const buttons = w.findAll('button')
    expect(buttons).toHaveLength(copy.moods.length)
    expect(buttons.map(b => b.get('b').text())).toEqual(copy.moods.map(m => m.emoji))
    expect(buttons.map(b => b.text().slice(b.get('b').text().length).trim())).toEqual(copy.moods.map(m => m.label))
    expect(buttons.every(b => b.attributes('aria-pressed') === 'false')).toBe(true)
    expect(w.text()).toContain('Pick one and we’ll suggest games.')
    expect(w.findAll('a')).toHaveLength(0)
  })

  it.each(MOODS)('suggests the copy.json games and message for %s', async (mood, ids, msg) => {
    const w = await mountSuspended(MoodCheck)
    await button(w, mood).trigger('click')
    const links = w.findAll('a')
    expect(links.map(a => a.attributes('href'))).toEqual(ids.map(id => `/games/${id}`))
    expect(links.map(a => a.text())).toEqual(ids.map(id => byId(id)!.name))
    expect(button(w, mood).attributes('aria-pressed')).toBe('true')
    expect(w.text()).not.toContain('Pick one')
    expect(w.text()).toContain(msg)
  })

  it('switches suggestions when another mood is picked', async () => {
    const w = await mountSuspended(MoodCheck)
    const [first, last] = [copy.moods[0]!, copy.moods.at(-1)!]
    await button(w, first.label).trigger('click')
    await button(w, last.label).trigger('click')
    expect(w.findAll('a').map(a => a.attributes('href'))).toEqual(last.ids.map(id => `/games/${id}`))
    expect(button(w, first.label).attributes('aria-pressed')).toBe('false')
  })
})

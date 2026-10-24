import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { VueWrapper } from '@vue/test-utils'
import MoodCheck from '~/components/home/MoodCheck.vue'
import { useGames } from '~/composables/useGames'

const { byId } = useGames()
const MOODS: [string, string[]][] = [
  ['Calm', ['breath', 'pairs', 'odd']],
  ['Tired', ['breath', 'sequence', 'category']],
  ['Stressed', ['breath', 'odd', 'hand']],
  ['Energised', ['reaction', 'math', 'stroop']]
]

const button = (w: VueWrapper, label: string) => w.findAll('button').find(b => b.text().includes(label))!

describe('MoodCheck', () => {
  it('asks how you feel and offers four moods, none picked', async () => {
    const w = await mountSuspended(MoodCheck)
    expect(w.get('h2').text()).toBe('How’s your brain feeling?')
    const buttons = w.findAll('button')
    expect(buttons.map(b => b.text().slice(b.get('b').text().length).trim())).toEqual(MOODS.map(m => m[0]))
    expect(buttons.every(b => b.attributes('aria-pressed') === 'false')).toBe(true)
    expect(w.text()).toContain('Pick one and we’ll suggest games.')
    expect(w.findAll('a')).toHaveLength(0)
  })

  it.each(MOODS)('suggests the right three games for %s', async (mood, ids) => {
    const w = await mountSuspended(MoodCheck)
    await button(w, mood).trigger('click')
    const links = w.findAll('a')
    expect(links.map(a => a.attributes('href'))).toEqual(ids.map(id => `/games/${id}`))
    expect(links.map(a => a.text())).toEqual(ids.map(id => byId(id)!.name))
    expect(button(w, mood).attributes('aria-pressed')).toBe('true')
    expect(w.text()).not.toContain('Pick one')
  })

  it('switches suggestions when another mood is picked', async () => {
    const w = await mountSuspended(MoodCheck)
    await button(w, 'Calm').trigger('click')
    await button(w, 'Energised').trigger('click')
    expect(w.findAll('a').map(a => a.attributes('href'))).toEqual(['/games/reaction', '/games/math', '/games/stroop'])
    expect(button(w, 'Calm').attributes('aria-pressed')).toBe('false')
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import DailyFive from '~/components/home/DailyFive.vue'
import { useGames } from '~/composables/useGames'
import { useProgress } from '~/composables/useProgress'

const mounted: { unmount: () => void }[] = []

async function daily() {
  const w = await mountSuspended(DailyFive)
  mounted.push(w)
  return w
}

describe('DailyFive', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtState('progress')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-05-10T12:00:00Z'))
  })
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    clearNuxtState('progress')
    localStorage.clear()
    vi.useRealTimers()
  })

  it('links to today’s five games with a 0/5 counter', async () => {
    const five = useGames().todaysFive()
    const w = await daily()
    const links = w.findAll('a')
    expect(links.map(a => a.attributes('href'))).toEqual(five.map(g => `/games/${g.id}`))
    expect(links.map(a => a.get('span').text())).toEqual(five.map(g => g.name))
    expect(w.get('.lbl').text()).toBe('Today’s five · 0/5')
    expect(links.some(a => a.classes().includes('done'))).toBe(false)
  })

  it('marks a game played today and counts it', async () => {
    const five = useGames().todaysFive()
    const w = await daily()
    useProgress().record(five[1]!, 3)
    await nextTick()
    expect(w.get('.lbl').text()).toBe('Today’s five · 1/5')
    expect(w.findAll('a').map(a => a.classes().includes('done'))).toEqual([false, true, false, false, false])
  })

  it('does not count games played on another day or outside the five', async () => {
    const five = useGames().todaysFive()
    const other = useGames().games.find(g => !five.includes(g))!
    localStorage.setItem(
      'bgarden',
      JSON.stringify({
        hist: [
          { id: five[0]!.id, s: 1, d: '2026-05-09', t: 0 },
          { id: other.id, s: 1, d: '2026-05-10', t: 0 }
        ]
      })
    )
    const w = await daily()
    expect(w.get('.lbl').text()).toBe('Today’s five · 0/5')
  })

  it('celebrates when all five are done', async () => {
    const five = useGames().todaysFive()
    const w = await daily()
    const { record } = useProgress()
    five.forEach(g => record(g, 1))
    await nextTick()
    expect(w.get('.lbl').text()).toBe('Today’s five: all done 🌸')
    expect(w.findAll('a.done')).toHaveLength(5)
  })
})

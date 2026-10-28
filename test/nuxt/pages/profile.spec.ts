import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import ProfilePage from '~/pages/profile.vue'
import { useProgress } from '~/composables/useProgress'
import copy from '~/data/copy.json'
import pairs from '~/data/games/pairs.json'
import type { Band } from '~~/shared/types/game'
import { bandIndex } from '~/utils/bands'
import { buttonNamed, fill, iconNames, type TieredGame } from '../fixtures'

const pairsGame = pairs as unknown as TieredGame
const labelFor = (bands: Band[], s: number) => bands[bandIndex({ ...pairsGame, bands }, s)]!.label

const mounted: { unmount: () => void }[] = []

function seed(progress: object) {
  localStorage.setItem('bgarden', JSON.stringify(progress))
}

async function mountProfile() {
  const wrapper = await mountSuspended(ProfilePage, { route: '/profile' })
  mounted.push(wrapper)
  return wrapper
}

const labels = copy.profile.stats
const tried = (n: number) => fill(labels.tried, { n, total: 15 })

function statTile(wrapper: Awaited<ReturnType<typeof mountProfile>>, label: string) {
  const tile = wrapper.findAll('[data-testid="stat"]').find(s => s.text().includes(label))
  if (!tile) throw new Error(`No stat labelled ${label}`)
  return tile
}

function stat(wrapper: Awaited<ReturnType<typeof mountProfile>>, label: string) {
  return statTile(wrapper, label).get('b').text()
}

function statSub(wrapper: Awaited<ReturnType<typeof mountProfile>>, label: string) {
  return statTile(wrapper, label).get('[data-testid="stat-sub"]').text()
}

describe('pages/profile', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtState(['progress'])
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-05-10T12:00:00'))
  })
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows an empty profile for a new player', async () => {
    const wrapper = await mountProfile()
    expect(wrapper.get('[data-testid="avatar"]').text()).toBe('🦉')
    expect(wrapper.get('[data-testid="plant"] b').text()).toBe('Seed')
    expect(stat(wrapper, labels.streak)).toBe('0')
    expect(stat(wrapper, labels.played)).toBe('0')
    expect(statSub(wrapper, labels.played)).toBe(tried(0))
    expect(wrapper.text()).toContain('No games yet. Your first one plants the seed 🌱')
    expect(wrapper.findAll('[data-testid="skill"] small').every(s => s.text() === 'not yet')).toBe(true)
  })

  it('shows stats, level, week and recent games from stored progress', async () => {
    seed({
      xp: 130,
      best: { math: 12, reaction: 240 },
      days: ['2026-05-09', '2026-05-10'],
      hist: [
        { id: 'math', s: 12, d: '2026-05-10', t: 2 },
        { id: 'reaction', s: 240, d: '2026-05-09', t: 1 },
        { id: 'gone', s: 1, d: '2026-05-09', t: 0 }
      ]
    })
    const wrapper = await mountProfile()
    expect(wrapper.get('[data-testid="plant"] b').text()).toBe('Sprout')
    expect(wrapper.text()).toContain('130 growth points')
    expect(stat(wrapper, labels.streak)).toBe('2')
    expect(stat(wrapper, labels.played)).toBe('3')
    expect(statSub(wrapper, labels.played)).toBe(tried(2))
    expect(wrapper.findAll('[data-testid="week-day"]').map(d => d.attributes('data-state') === 'on')).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
      true
    ])
    const rows = wrapper.findAll('[data-testid="history"] li')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.text()).toContain('Mental math')
    expect(rows[0]!.text()).toContain('Sharp')
    expect(rows[0]!.text()).toContain('12 solved')
    expect(rows[1]!.text()).toContain('Reaction time')
    expect(rows[1]!.text()).toContain('Fast')
  })

  it('shows the game icon on each recent game', async () => {
    seed({
      hist: [
        { id: 'math', s: 12, d: '2026-05-10', t: 2 },
        { id: 'reaction', s: 240, d: '2026-05-09', t: 1 }
      ]
    })
    const wrapper = await mountProfile()
    expect(iconNames(wrapper, '[data-testid="history"]')).toEqual(['bg:games-math', 'bg:games-reaction'])
  })

  it('shows at most 10 recent games', async () => {
    seed({ hist: Array.from({ length: 12 }, (_, i) => ({ id: 'math', s: i, d: '2026-05-10', t: i })) })
    const wrapper = await mountProfile()
    expect(wrapper.findAll('[data-testid="history"] li')).toHaveLength(10)
  })

  it('averages band position per category for brain skills', async () => {
    seed({ best: { math: 12, reaction: 240 } })
    const wrapper = await mountProfile()
    const speed = wrapper.findAll('[data-testid="skill"]').find(s => s.get('b').text() === 'Speed')!
    expect(speed.get('small').text()).toBe('70%')
  })

  it('counts a game played only on hard in brain skills, with its hard bands', async () => {
    seed({ best: { 'schulte@hard': 12.3 } })
    const wrapper = await mountProfile()
    const focus = wrapper.findAll('[data-testid="skill"]').find(s => s.get('b').text() === 'Focus')!
    expect(focus.get('small').text()).toBe('100%')
  })

  it('offers every avatar from copy.json in order', async () => {
    const wrapper = await mountProfile()
    const buttons = wrapper.findAll('[data-testid="avatars"] button')
    expect(buttons.map(b => b.text())).toEqual(copy.avatars)
    expect(buttons.map(b => b.attributes('aria-label'))).toEqual(copy.avatars.map(a => `Choose ${a}`))
  })

  it('changes the avatar and name', async () => {
    const wrapper = await mountProfile()
    await wrapper.get('button[aria-label="Choose 🐼"]').trigger('click')
    expect(wrapper.get('[data-testid="avatar"]').text()).toBe('🐼')
    expect(wrapper.get('button[aria-label="Choose 🐼"]').attributes('aria-pressed')).toBe('true')
    const name = wrapper.get('input[aria-label="Your name"]')
    expect(name.attributes('maxlength')).toBe('24')
    await name.setValue('  Ana  ')
    expect(useProgress().progress.value.name).toBe('Ana')
    await flushPromises()
    expect(JSON.parse(localStorage.getItem('bgarden')!).av).toBe('🐼')
  })

  it('resets all progress after confirmation', async () => {
    seed({ xp: 50, best: { math: 12 }, hist: [{ id: 'math', s: 12, d: '2026-05-10', t: 1 }] })
    const confirm = vi.fn(() => true)
    vi.stubGlobal('confirm', confirm)
    const wrapper = await mountProfile()
    await buttonNamed(wrapper, 'Reset all progress').trigger('click')
    expect(confirm).toHaveBeenCalledWith('Clear your profile and all scores in this browser?')
    expect(useProgress().progress.value).toMatchObject({ xp: 0, best: {}, hist: [] })
    expect(stat(wrapper, labels.played)).toBe('0')
  })

  it('keeps progress when reset is cancelled', async () => {
    seed({ xp: 50, best: { math: 12 } })
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false)
    )
    const wrapper = await mountProfile()
    await buttonNamed(wrapper, 'Reset all progress').trigger('click')
    expect(useProgress().progress.value.xp).toBe(50)
    expect(statSub(wrapper, labels.played)).toBe(tried(1))
  })

  describe('profile cards (functional-requirements §2.4)', () => {
    const rich = {
      xp: 100,
      played: 90,
      best: { math: 12 },
      days: ['2026-04-20', '2026-05-09', '2026-05-10'],
      xpDays: { '2026-04-01': 10, '2026-04-20': 40, '2026-05-09': 80, '2026-05-10': 100 },
      hist: [
        { id: 'math', s: 12, d: '2026-05-10', t: 3 },
        { id: 'math', s: 10, d: '2026-05-09', t: 2 },
        { id: 'reaction', s: 240, d: '2026-04-20', t: 1 }
      ]
    }

    it('replaces the old three stat tiles with the four new ones', async () => {
      const wrapper = await mountProfile()
      const tiles = wrapper.findAll('[data-testid="stat"]')
      expect(tiles).toHaveLength(4)
      expect(
        tiles.map(t => [labels.streak, labels.played, labels.month, labels.bests].findIndex(l => t.text().includes(l)))
      ).toEqual([0, 1, 2, 3])
    })

    it('shows the brain, stats, favourite, week, month and growth cards in that order', async () => {
      seed(rich)
      const wrapper = await mountProfile()
      const order = [
        '[data-testid="brain"]',
        '[data-testid="stat"]',
        '[data-testid="favourite"]',
        '[data-testid="week-day"]',
        '[data-testid="month-title"]',
        '[data-testid="growth"]',
        '[data-testid="skill"]',
        '[data-testid="history"]'
      ].map(sel => wrapper.get(sel).element)
      order.slice(1).forEach((el, i) => {
        expect(order[i]!.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING, `${i}`).toBeTruthy()
      })
    })

    it('reads games played from played when it is stored', async () => {
      seed(rich)
      const wrapper = await mountProfile()
      expect(stat(wrapper, labels.played)).toBe('90')
      expect(wrapper.get('[data-testid="brain-caption"]').text()).toBe(
        fill(copy.profile.brainCaption, { lit: 46, total: 72, played: 90 })
      )
    })

    it('starts the month and growth cards on the current month', async () => {
      seed(rich)
      const wrapper = await mountProfile()
      expect(wrapper.get('[data-testid="month-title"]').text()).toBe('May 2026')
      expect(wrapper.get('[data-testid="growth-gain"]').text()).toBe(
        fill(copy.profile.growthGain, { n: 60, month: 'May' })
      )
      expect(wrapper.findAll('[data-testid="growth-col"]')).toHaveLength(31)
    })

    it('moves the month and growth cards together with the month buttons', async () => {
      seed(rich)
      const wrapper = await mountProfile()
      await wrapper.get(`button[aria-label="${copy.profile.prevMonth}"]`).trigger('click')
      expect(wrapper.get('[data-testid="month-title"]').text()).toBe('April 2026')
      expect(wrapper.get('[data-testid="growth-gain"]').text()).toBe(
        fill(copy.profile.growthGain, { n: 30, month: 'April' })
      )
      expect(wrapper.findAll('[data-testid="growth-col"]')).toHaveLength(30)
      expect(wrapper.findAll('[data-testid="day"]')).toHaveLength(30)
      await wrapper.get(`button[aria-label="${copy.profile.nextMonth}"]`).trigger('click')
      expect(wrapper.get('[data-testid="month-title"]').text()).toBe('May 2026')
      expect(wrapper.findAll('[data-testid="growth-col"]')).toHaveLength(31)
    })

    it('hides the favourite card for a new player', async () => {
      const wrapper = await mountProfile()
      expect(wrapper.find('[data-testid="favourite"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="brain"]').exists()).toBe(true)
    })
  })

  describe('difficulty (functional-requirements §3.1)', () => {
    it('labels a recent game with the bands of its difficulty', async () => {
      const hard = pairsGame.difficulties?.hard?.bands
      const easy = pairsGame.difficulties?.easy?.bands
      expect(hard, 'pairs.json difficulties.hard.bands').toBeDefined()
      expect(easy, 'pairs.json difficulties.easy.bands').toBeDefined()
      const scores = Array.from({ length: 80 }, (_, i) => i + 1)
      const sHard = scores.find(s => labelFor(hard!, s) !== labelFor(pairsGame.bands, s))!
      const sEasy = scores.find(s => labelFor(easy!, s) !== labelFor(pairsGame.bands, s))!
      expect(sHard).toBeDefined()
      expect(sEasy).toBeDefined()
      seed({
        hist: [
          { id: 'pairs', s: sHard, d: '2026-05-10', t: 3, l: 'hard' },
          { id: 'pairs', s: sEasy, d: '2026-05-10', t: 2, l: 'easy' },
          { id: 'pairs', s: sHard, d: '2026-05-10', t: 1 }
        ]
      })
      const wrapper = await mountProfile()
      const rows = wrapper.findAll('[data-testid="history"] li').map(r => r.get('small').text())
      expect(rows).toEqual([labelFor(hard!, sHard), labelFor(easy!, sEasy), labelFor(pairsGame.bands, sHard)])
    })

    it('counts each game id once in games tried, whatever its difficulties', async () => {
      seed({ best: { pairs: 20, 'pairs@hard': 30, 'pairs@easy': 12, 'schulte@easy': 10 } })
      const wrapper = await mountProfile()
      expect(statSub(wrapper, labels.played)).toBe(tried(2))
    })

    it('counts a game played only on hard as tried', async () => {
      seed({ best: { 'nback@hard': 80 } })
      const wrapper = await mountProfile()
      expect(statSub(wrapper, labels.played)).toBe(tried(1))
    })
  })
})

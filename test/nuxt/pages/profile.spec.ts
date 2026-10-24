import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import ProfilePage from '~/pages/profile.vue'
import { useProgress } from '~/composables/useProgress'

const mounted: { unmount: () => void }[] = []

function seed(progress: object) {
  localStorage.setItem('bgarden', JSON.stringify(progress))
}

async function mountProfile() {
  const wrapper = await mountSuspended(ProfilePage, { route: '/profile' })
  mounted.push(wrapper)
  return wrapper
}

function stat(wrapper: Awaited<ReturnType<typeof mountProfile>>, label: string) {
  return wrapper
    .findAll('.stat')
    .find(s => s.text().includes(label))!
    .get('b')
    .text()
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
    expect(wrapper.get('.avatar').text()).toBe('🦉')
    expect(wrapper.get('.plant b').text()).toBe('Seed')
    expect(stat(wrapper, 'day streak')).toBe('🔥 0')
    expect(stat(wrapper, 'games played')).toBe('0')
    expect(stat(wrapper, 'games tried')).toBe('0 / 15')
    expect(wrapper.text()).toContain('No games yet. Your first one plants the seed 🌱')
    expect(wrapper.findAll('.skill small').every(s => s.text() === 'not yet')).toBe(true)
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
    expect(wrapper.get('.plant b').text()).toBe('Sprout')
    expect(wrapper.text()).toContain('130 growth points')
    expect(stat(wrapper, 'day streak')).toBe('🔥 2')
    expect(stat(wrapper, 'games played')).toBe('3')
    expect(stat(wrapper, 'games tried')).toBe('2 / 15')
    expect(wrapper.findAll('.week i').map(i => i.classes().includes('on'))).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
      true
    ])
    const rows = wrapper.findAll('.hist li')
    expect(rows).toHaveLength(2)
    expect(rows[0]!.text()).toContain('Mental math')
    expect(rows[0]!.text()).toContain('Sharp')
    expect(rows[0]!.text()).toContain('12 solved')
    expect(rows[1]!.text()).toContain('Reaction time')
    expect(rows[1]!.text()).toContain('Fast')
  })

  it('shows at most 10 recent games', async () => {
    seed({ hist: Array.from({ length: 12 }, (_, i) => ({ id: 'math', s: i, d: '2026-05-10', t: i })) })
    const wrapper = await mountProfile()
    expect(wrapper.findAll('.hist li')).toHaveLength(10)
  })

  it('averages band position per category for brain skills', async () => {
    seed({ best: { math: 12, reaction: 240 } })
    const wrapper = await mountProfile()
    const speed = wrapper.findAll('.skill').find(s => s.get('b').text() === 'Speed')!
    expect(speed.get('small').text()).toBe('70%')
  })

  it('changes the avatar and name', async () => {
    const wrapper = await mountProfile()
    await wrapper.get('button[aria-label="Choose 🐼"]').trigger('click')
    expect(wrapper.get('.avatar').text()).toBe('🐼')
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
    await wrapper.get('button.ghost').trigger('click')
    expect(confirm).toHaveBeenCalledWith('Clear your profile and all scores in this browser?')
    expect(useProgress().progress.value).toMatchObject({ xp: 0, best: {}, hist: [] })
    expect(stat(wrapper, 'games played')).toBe('0')
  })

  it('keeps progress when reset is cancelled', async () => {
    seed({ xp: 50, best: { math: 12 } })
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false)
    )
    const wrapper = await mountProfile()
    await wrapper.get('button.ghost').trigger('click')
    expect(useProgress().progress.value.xp).toBe(50)
    expect(stat(wrapper, 'games tried')).toBe('1 / 15')
  })
})

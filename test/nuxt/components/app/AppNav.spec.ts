import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import AppNav from '~/components/app/AppNav.vue'

const mounted: { unmount: () => void }[] = []

async function mountAt(route: string) {
  const w = await mountSuspended(AppNav, { route })
  mounted.push(w)
  return w
}

function save(p: object) {
  localStorage.setItem('bgarden', JSON.stringify(p))
}

const tab = (w: Awaited<ReturnType<typeof mountAt>>, label: string) => w.get(`nav a[aria-label="${label}"]`)

describe('AppNav', () => {
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

  it('links the logo home', async () => {
    const w = await mountAt('/')
    const logo = w.get('a[aria-label="Brain Garden home"]')
    expect(logo.attributes('href')).toBe('/')
    expect(logo.text()).toContain('Brain Garden')
  })

  it('has Home, Games and Profile tabs', async () => {
    const w = await mountAt('/')
    const tabs = w.findAll('nav a')
    expect(tabs.map(t => t.text())).toEqual(['Home', 'Games', 'Profile'])
    expect(tabs.map(t => t.attributes('href'))).toEqual(['/', '/games', '/profile'])
  })

  it.each([
    ['/', 'Home'],
    ['/games', 'Games'],
    ['/games/math', 'Games'],
    ['/profile', 'Profile']
  ])('marks only the active tab on %s', async (route, active) => {
    const w = await mountAt(route)
    for (const label of ['Home', 'Games', 'Profile']) {
      expect(tab(w, label).attributes('aria-current'), label).toBe(label === active ? 'page' : undefined)
    }
  })

  it('shows the current streak', async () => {
    save({ days: ['2026-05-08', '2026-05-09', '2026-05-10'] })
    const w = await mountAt('/')
    expect(w.get('.streak').text()).toBe('3')
  })

  it('cycles the theme Auto → Light → Dark → Auto on click', async () => {
    const w = await mountAt('/')
    const btn = () => w.get('button')
    expect(btn().attributes('aria-label')).toBe('Theme: auto. Click to change')
    await btn().trigger('click')
    expect(btn().attributes('aria-label')).toBe('Theme: light. Click to change')
    await btn().trigger('click')
    expect(btn().attributes('aria-label')).toBe('Theme: dark. Click to change')
    await btn().trigger('click')
    expect(btn().attributes('aria-label')).toBe('Theme: auto. Click to change')
    expect(JSON.parse(localStorage.getItem('bgarden')!).theme).toBe('auto')
  })

  it('links the avatar to the profile with a fallback name and level emoji', async () => {
    const w = await mountAt('/')
    const me = w.get('a[aria-label="Open your profile"]')
    expect(me.attributes('href')).toBe('/profile')
    expect(me.text()).toContain('🦉')
    expect(me.text()).toContain('Profile · 🌱')
  })

  it('shows the saved name, avatar and level', async () => {
    save({ name: 'Ana', av: '🦊', xp: 250 })
    const w = await mountAt('/')
    const me = w.get('a[aria-label="Open your profile"]')
    expect(me.text()).toContain('🦊')
    expect(me.text()).toContain('Ana · 🪴')
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState, useState } from '#imports'
import AppNav from '~/components/app/AppNav.vue'
import copy from '~/data/copy.json'
import { iconNames, signedInUser } from '../../fixtures'

const nav = copy.account.nav
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
    clearNuxtState(['progress', 'auth-user', 'auth-error', 'auth-ready', 'cloud-status'])
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
    const logo = w.get('a[aria-label="Brain Games home"]')
    expect(logo.attributes('href')).toBe('/')
    expect(logo.text()).toContain('Brain Games')
  })

  it('shows the brain logo icon in the home link', async () => {
    const w = await mountAt('/')
    expect(iconNames(w, 'a[aria-label="Brain Games home"]')).toEqual(['bg:brand-logo'])
  })

  it('shows a home, games and user icon on the tabs', async () => {
    const w = await mountAt('/')
    expect(['Home', 'Games', 'Profile'].map(label => iconNames(w, `nav a[aria-label="${label}"]`))).toEqual([
      ['bg:nav-home'],
      ['bg:nav-games'],
      ['bg:nav-user']
    ])
  })

  it('shows a flame icon next to the streak', async () => {
    const w = await mountAt('/')
    expect(iconNames(w, '[data-testid="streak"]')).toEqual(['bg:nav-flame'])
  })

  it('shows the auto, sun and moon icon for the auto, light and dark themes', async () => {
    const w = await mountAt('/')
    const btnIcon = () => iconNames(w, 'button')
    expect(btnIcon()).toEqual(['bg:nav-auto'])
    await w.get('button').trigger('click')
    expect(btnIcon()).toEqual(['bg:nav-sun'])
    await w.get('button').trigger('click')
    expect(btnIcon()).toEqual(['bg:nav-moon'])
  })

  it('keeps every nav icon decorative', async () => {
    const w = await mountAt('/')
    const icons = w.findAllComponents({ name: 'NuxtIcon' })
    expect(icons).toHaveLength(7)
    icons.forEach(i => expect(i.attributes('aria-hidden')).toBe('true'))
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
    expect(w.get('[data-testid="streak"]').text()).toBe('3')
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

  it('renders the account menu in the bar', async () => {
    const w = await mountAt('/')
    expect(w.find('header [data-testid="account-menu"]').exists()).toBe(true)
  })

  describe('account', () => {
    beforeEach(() => {
      useState('auth-ready').value = true
    })

    it('has the Profile tab as the only profile link for a guest', async () => {
      const w = await mountAt('/')
      const links = w.findAll('a[href="/profile"]')
      expect(links).toHaveLength(1)
      expect(links[0]!.element.closest('nav')).not.toBeNull()
    })

    it('has the Profile tab as the only profile link when signed in', async () => {
      useState('auth-user').value = signedInUser
      const w = await mountAt('/')
      const links = w.findAll('a[href="/profile"]')
      expect(links).toHaveLength(1)
      expect(links[0]!.element.closest('nav')).not.toBeNull()
    })

    it('puts no sign-in button in the bar for a guest while the panel is closed', async () => {
      const w = await mountAt('/')
      const signIns = w
        .findAll('button')
        .filter(b => b.attributes('aria-label') === nav.signInLabel || b.text().includes(nav.signInLabel))
      expect(signIns).toHaveLength(0)
    })

    it('keeps the cloud badge inside the account menu when signed in', async () => {
      useState('auth-user').value = signedInUser
      const w = await mountAt('/')
      const badges = w.findAll('[data-testid="cloud-badge"]')
      expect(badges).toHaveLength(1)
      expect(badges[0]!.element.closest('[data-testid="account-menu"]')).not.toBeNull()
    })
  })
})

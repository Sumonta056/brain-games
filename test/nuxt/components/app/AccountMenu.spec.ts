import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { clearNuxtState, useRouter, useState } from '#imports'
import AccountMenu from '~/components/app/AccountMenu.vue'
import copy from '~/data/copy.json'
import { fill, iconNames, photoUser, signedInUser } from '../../fixtures'

const sync = await vi.hoisted(async () => (await import('../../fixtures')).cloudSyncSpies())
const initializeApp = vi.hoisted(() => vi.fn(() => ({})))

vi.mock('firebase/app', () => ({ initializeApp, getApps: () => [], getApp: () => ({}) }))

mockNuxtImport('useCloudSync', () => () => sync)

const nav = copy.account.nav
const mounted: { unmount: () => void }[] = []

async function mountMenu(route = '/') {
  const wrapper = await mountSuspended(AccountMenu, { route, attachTo: document.body })
  mounted.push(wrapper)
  return wrapper
}

type Menu = Awaited<ReturnType<typeof mountMenu>>

const chip = (w: Menu) => w.get('[data-testid="account-chip"]')
const panel = (w: Menu) => w.find('[data-testid="account-panel"]')

function save(p: object) {
  localStorage.setItem('bgarden', JSON.stringify(p))
}

async function outside(type: string) {
  document.body.dispatchEvent(new Event(type, { bubbles: true }))
  await nextTick()
}

describe('AccountMenu', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtState(['progress', 'auth-user', 'auth-error', 'auth-ready'])
    useState('auth-ready').value = true
    sync.status.value = ''
    Object.values(sync).forEach(f => (typeof f === 'function' ? f.mockClear() : undefined))
    initializeApp.mockClear()
  })
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    clearNuxtState('progress')
    localStorage.clear()
  })

  it('renders the menu root with the chip as a real button', async () => {
    const w = await mountMenu()
    expect(w.find('[data-testid="account-menu"]').exists()).toBe(true)
    expect(chip(w).element.tagName).toBe('BUTTON')
  })

  describe('while the session restores', () => {
    beforeEach(() => {
      useState('auth-ready').value = false
    })

    it('shows the avatar emoji with the loading label', async () => {
      save({ av: '🦊' })
      const w = await mountMenu()
      expect(chip(w).attributes('data-state')).toBe('loading')
      expect(chip(w).attributes('aria-label')).toBe(nav.chipLoading)
      expect(chip(w).text()).toContain('🦊')
      expect(chip(w).text()).not.toContain(nav.guest)
    })
  })

  describe('as a guest', () => {
    it('shows the avatar emoji and Guest with the guest label, not the Profile tab icon', async () => {
      save({ av: '🐼' })
      const w = await mountMenu()
      expect(chip(w).attributes('data-state')).toBe('guest')
      expect(chip(w).attributes('aria-label')).toBe(nav.chipGuest)
      expect(chip(w).text()).toContain(nav.guest)
      expect(chip(w).text()).toContain('🐼')
      expect(iconNames(w, '[data-testid="account-chip"]')).not.toContain('bg:nav-user')
    })

    it('shows a hollow guest dot', async () => {
      const w = await mountMenu()
      expect(w.get('[data-testid="cloud-badge"]').attributes('data-state')).toBe('guest')
    })
  })

  describe('when signed in', () => {
    beforeEach(() => {
      useState('auth-user').value = signedInUser
    })

    it('shows the first name and labels the chip as saved', async () => {
      const w = await mountMenu()
      expect(chip(w).attributes('data-state')).toBe('signed-in')
      expect(chip(w).attributes('aria-label')).toBe(fill(nav.chipSignedIn, { name: 'Ana' }))
      expect(chip(w).text()).toContain('Ana')
      expect(chip(w).text()).not.toContain('Lima')
    })

    it('falls back to the profile name when the Google name is empty', async () => {
      useState('auth-user').value = { ...signedInUser, name: '' }
      save({ name: 'Bo' })
      const w = await mountMenu()
      expect(chip(w).attributes('aria-label')).toBe(fill(nav.chipSignedIn, { name: 'Bo' }))
      expect(chip(w).text()).toContain('Bo')
    })

    it('falls back to the email name when there is no Google or profile name', async () => {
      useState('auth-user').value = { ...signedInUser, name: '' }
      const w = await mountMenu()
      expect(chip(w).attributes('aria-label')).toBe(fill(nav.chipSignedIn, { name: 'ana' }))
      expect(chip(w).text()).toContain('ana')
      expect(chip(w).text()).not.toContain('@')
    })

    it('shows the avatar emoji and no photo when there is no photo', async () => {
      save({ av: '🦊' })
      const w = await mountMenu()
      expect(w.find('[data-testid="account-photo"]').exists()).toBe(false)
      expect(chip(w).text()).toContain('🦊')
    })

    it('shows the Google photo as a decorative image without a referrer', async () => {
      useState('auth-user').value = photoUser
      const w = await mountMenu()
      const img = chip(w).get('img[data-testid="account-photo"]')
      expect(img.attributes('src')).toBe(photoUser.photo)
      expect(img.attributes('alt')).toBe('')
      expect(img.attributes('referrerpolicy')).toBe('no-referrer')
    })

    it('swaps a photo that fails to load for the avatar emoji', async () => {
      useState('auth-user').value = photoUser
      save({ av: '🦊' })
      const w = await mountMenu()
      expect(chip(w).text()).not.toContain('🦊')
      await chip(w).get('[data-testid="account-photo"]').trigger('error')
      expect(w.find('[data-testid="account-photo"]').exists()).toBe(false)
      expect(chip(w).text()).toContain('🦊')
    })

    it('shows a synced status dot', async () => {
      const w = await mountMenu()
      expect(w.get('[data-testid="cloud-badge"]').attributes('data-state')).toBe('synced')
    })

    it('shows an error dot and the not-synced label when the last sync failed', async () => {
      sync.status.value = 'sync'
      const w = await mountMenu()
      expect(w.get('[data-testid="cloud-badge"]').attributes('data-state')).toBe('error')
      expect(chip(w).attributes('aria-label')).toBe(fill(nav.chipError, { name: 'Ana' }))
    })

    it('keeps the synced dot and label when only a delete failed', async () => {
      sync.status.value = 'deleteFailed'
      const w = await mountMenu()
      expect(w.get('[data-testid="cloud-badge"]').attributes('data-state')).toBe('synced')
      expect(chip(w).attributes('aria-label')).toBe(fill(nav.chipSignedIn, { name: 'Ana' }))
    })
  })

  describe('the panel', () => {
    it('is closed at first', async () => {
      const w = await mountMenu()
      expect(chip(w).attributes('aria-expanded')).toBe('false')
      expect(panel(w).exists()).toBe(false)
    })

    it('opens on click inside the element the chip controls, and closes on a second click', async () => {
      const w = await mountMenu()
      await chip(w).trigger('click')
      expect(chip(w).attributes('aria-expanded')).toBe('true')
      const id = chip(w).attributes('aria-controls')
      expect(id).toBeTruthy()
      const region = w.get(`[id="${id}"]`)
      expect(region.find('[data-testid="account-panel"]').exists()).toBe(true)
      await chip(w).trigger('click')
      expect(chip(w).attributes('aria-expanded')).toBe('false')
      expect(panel(w).exists()).toBe(false)
    })

    it('shows the guest panel for a guest', async () => {
      const w = await mountMenu()
      await chip(w).trigger('click')
      expect(panel(w).attributes('data-state')).toBe('guest')
    })

    it('shows the signed-in panel when signed in', async () => {
      useState('auth-user').value = signedInUser
      const w = await mountMenu()
      await chip(w).trigger('click')
      expect(panel(w).attributes('data-state')).toBe('signed-in')
    })

    it('closes on Escape and returns focus to the chip', async () => {
      const w = await mountMenu()
      await chip(w).trigger('click')
      ;(w.get('[data-testid="account-panel"] a[href="/profile"]').element as HTMLElement).focus()
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      await nextTick()
      expect(panel(w).exists()).toBe(false)
      expect(chip(w).attributes('aria-expanded')).toBe('false')
      expect(document.activeElement).toBe(chip(w).element)
    })

    it('closes on a click outside the menu', async () => {
      const w = await mountMenu()
      await chip(w).trigger('click')
      await outside('pointerdown')
      await outside('click')
      expect(panel(w).exists()).toBe(false)
      expect(chip(w).attributes('aria-expanded')).toBe('false')
    })

    it('stays open on a click inside the panel', async () => {
      const w = await mountMenu()
      await chip(w).trigger('click')
      const el = w.get('[data-testid="account-panel"]')
      await el.trigger('pointerdown')
      await el.trigger('click')
      expect(panel(w).exists()).toBe(true)
    })

    it('closes when the route changes', async () => {
      const w = await mountMenu('/')
      await chip(w).trigger('click')
      await useRouter().push('/games')
      await flushPromises()
      expect(panel(w).exists()).toBe(false)
    })

    it('closes when a link in the panel is clicked', async () => {
      const w = await mountMenu('/profile')
      await chip(w).trigger('click')
      await w.get('[data-testid="account-panel"] a[href="/profile"]').trigger('click')
      await flushPromises()
      expect(panel(w).exists()).toBe(false)
      expect(chip(w).attributes('aria-expanded')).toBe('false')
    })
  })

  describe('review fixes', () => {
    it('stops listening to the document after unmount', async () => {
      const w = await mountMenu()
      await chip(w).trigger('click')
      const off = vi.spyOn(document, 'removeEventListener')
      w.unmount()
      mounted.splice(mounted.indexOf(w), 1)
      const types = off.mock.calls.map(c => c[0])
      expect(types).toEqual(expect.arrayContaining(['keydown', 'pointerdown']))
    })

    it('shows a new photo again after an earlier photo failed to load', async () => {
      useState('auth-user').value = photoUser
      const w = await mountMenu()
      await chip(w).get('[data-testid="account-photo"]').trigger('error')
      useState('auth-user').value = { ...photoUser, photo: 'https://example.com/new.png' }
      await nextTick()
      expect(chip(w).get('[data-testid="account-photo"]').attributes('src')).toBe('https://example.com/new.png')
    })

    it('labels the chip Account when no name, profile name or email is known', async () => {
      useState('auth-user').value = { uid: 'u3', name: '', email: '', photo: '' }
      const w = await mountMenu()
      expect(chip(w).attributes('aria-label')).toBe(nav.menuLabel)
    })

    it('points aria-controls at the panel only while it is open', async () => {
      const w = await mountMenu()
      expect(chip(w).attributes('aria-controls')).toBeUndefined()
      await chip(w).trigger('click')
      expect(chip(w).attributes('aria-controls')).toBeTruthy()
    })

    it('returns focus to the chip after Sign out in the panel', async () => {
      useState('auth-user').value = signedInUser
      const w = await mountMenu()
      await chip(w).trigger('click')
      const out = w.findAll('[data-testid="account-panel"] button').find(b => b.text().trim() === copy.account.signOut)!
      await out.trigger('click')
      await flushPromises()
      expect(panel(w).exists()).toBe(false)
      expect(document.activeElement).toBe(chip(w).element)
    })
  })

  describe('focus leaving the menu', () => {
    it('closes the panel when focus moves to something outside the menu', async () => {
      const w = await mountMenu()
      await chip(w).trigger('click')
      const outsideButton = document.createElement('button')
      document.body.appendChild(outsideButton)
      await w.get('[data-testid="account-menu"]').trigger('focusout', { relatedTarget: outsideButton })
      expect(panel(w).exists()).toBe(false)
      outsideButton.remove()
    })

    it('stays open when focus moves inside the menu', async () => {
      const w = await mountMenu()
      await chip(w).trigger('click')
      const inside = w.get('[data-testid="account-panel"] a[href="/profile"]').element
      await w.get('[data-testid="account-menu"]').trigger('focusout', { relatedTarget: inside })
      expect(panel(w).exists()).toBe(true)
    })
  })
})

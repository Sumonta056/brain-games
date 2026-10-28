import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { clearNuxtState, useState } from '#imports'
import AccountPanel from '~/components/app/AccountPanel.vue'
import copy from '~/data/copy.json'
import { buttonNamed, photoUser, signedInUser } from '../../fixtures'

const sync = await vi.hoisted(async () => (await import('../../fixtures')).cloudSyncSpies())
const initializeApp = vi.hoisted(() => vi.fn(() => ({})))

vi.mock('firebase/app', () => ({ initializeApp, getApps: () => [], getApp: () => ({}) }))

mockNuxtImport('useCloudSync', () => () => sync)

const nav = copy.account.nav
const a = copy.account
const mounted: { unmount: () => void }[] = []

async function mountPanel() {
  const wrapper = await mountSuspended(AccountPanel, { route: '/profile' })
  mounted.push(wrapper)
  return wrapper
}

type Panel = Awaited<ReturnType<typeof mountPanel>>

const root = (w: Panel) => w.get('[data-testid="account-panel"]')
const profileLink = (w: Panel) => w.get('a[href="/profile"]')

describe('AccountPanel', () => {
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
  })

  describe('as a guest', () => {
    it('says the player is a guest and the garden lives only in this browser', async () => {
      const w = await mountPanel()
      expect(root(w).attributes('data-state')).toBe('guest')
      expect(root(w).text()).toContain(nav.guestTitle)
      expect(root(w).text()).toContain(nav.guestBody)
    })

    it('offers Sign in with Google as a real button with a decorative Google icon', async () => {
      const w = await mountPanel()
      const button = buttonNamed(w, nav.signInLabel)
      expect(button.element.tagName).toBe('BUTTON')
      const icons = w.findAllComponents({ name: 'NuxtIcon' }).filter(i => button.element.contains(i.element))
      expect(icons.map(i => i.props('name'))).toEqual(['bg:brand-google'])
      expect(icons[0]!.element.closest('[aria-hidden="true"]')).not.toBeNull()
    })

    it('signs in through cloud sync on click', async () => {
      const w = await mountPanel()
      await buttonNamed(w, nav.signInLabel).trigger('click')
      expect(sync.signIn).toHaveBeenCalledTimes(1)
    })

    it('loads no Firebase when the panel only shows', async () => {
      await mountPanel()
      await flushPromises()
      expect(initializeApp).not.toHaveBeenCalled()
    })

    it('loads Firebase when the player focuses the sign-in button', async () => {
      const w = await mountPanel()
      await buttonNamed(w, nav.signInLabel).trigger('focus')
      await vi.waitFor(() => expect(initializeApp).toHaveBeenCalled())
    })

    it('loads Firebase when the player points at the sign-in button', async () => {
      const w = await mountPanel()
      await buttonNamed(w, nav.signInLabel).trigger('pointerenter')
      await vi.waitFor(() => expect(initializeApp).toHaveBeenCalled())
    })

    it('shows no alert when sign-in has no error', async () => {
      const w = await mountPanel()
      expect(w.find('[role="alert"]').exists()).toBe(false)
    })

    it('shows the sign-in error in an alert', async () => {
      useState('auth-error').value = a.errors.popup
      const w = await mountPanel()
      expect(w.get('[role="alert"]').text()).toBe(a.errors.popup)
    })

    it('links to the profile and asks to close when the link is clicked', async () => {
      const w = await mountPanel()
      expect(profileLink(w).text().trim()).toBe(nav.profile)
      await profileLink(w).trigger('click')
      expect(w.emitted('close')).toHaveLength(1)
    })

    it('does not offer sign out', async () => {
      const w = await mountPanel()
      expect(w.findAll('button').map(b => b.text().trim())).not.toContain(a.signOut)
    })
  })

  describe('when signed in', () => {
    beforeEach(() => {
      useState('auth-user').value = signedInUser
    })

    it('shows the full name, the email and that the garden is saved', async () => {
      const w = await mountPanel()
      expect(root(w).attributes('data-state')).toBe('signed-in')
      expect(root(w).text()).toContain(signedInUser.name)
      expect(root(w).text()).toContain(signedInUser.email)
      expect(root(w).text()).toContain(nav.synced)
      expect(w.find('[role="alert"]').exists()).toBe(false)
    })

    it('does not offer sign in', async () => {
      const w = await mountPanel()
      expect(w.findAll('button').map(b => b.text().trim())).not.toContain(nav.signInLabel)
    })

    it('shows no photo when there is none', async () => {
      const w = await mountPanel()
      expect(w.find('[data-testid="account-photo"]').exists()).toBe(false)
    })

    it('shows the Google photo as a decorative image without a referrer', async () => {
      useState('auth-user').value = photoUser
      const w = await mountPanel()
      const img = w.get('img[data-testid="account-photo"]')
      expect(img.attributes('src')).toBe(photoUser.photo)
      expect(img.attributes('alt')).toBe('')
      expect(img.attributes('referrerpolicy')).toBe('no-referrer')
    })

    it('shows the sync error as plain text in place of Garden saved, so the profile card holds the only alert', async () => {
      sync.status.value = 'sync'
      const w = await mountPanel()
      expect(root(w).text()).toContain(a.errors.sync)
      expect(root(w).text()).not.toContain(nav.synced)
      expect(w.find('[role="alert"]').exists()).toBe(false)
    })

    it('keeps Garden saved and shows no error when only a delete failed', async () => {
      sync.status.value = 'deleteFailed'
      const w = await mountPanel()
      expect(root(w).text()).toContain(nav.synced)
      expect(root(w).text()).not.toContain(a.errors.sync)
    })

    it('links to the profile and asks to close when the link is clicked', async () => {
      const w = await mountPanel()
      expect(profileLink(w).text().trim()).toBe(nav.profile)
      await profileLink(w).trigger('click')
      expect(w.emitted('close')).toHaveLength(1)
    })

    it('signs out through cloud sync and asks to close', async () => {
      const w = await mountPanel()
      await buttonNamed(w, a.signOut).trigger('click')
      await flushPromises()
      expect(sync.signOut).toHaveBeenCalledTimes(1)
      expect(w.emitted('close')).toHaveLength(1)
    })
  })

  describe('while the session restores', () => {
    it('shows neither the guest text nor a sign-in button, only the Profile link', async () => {
      useState('auth-ready').value = false
      const w = await mountPanel()
      expect(root(w).attributes('data-state')).toBe('loading')
      expect(root(w).text()).not.toContain(nav.guestTitle)
      expect(w.findAll('button').map(b => b.text().trim())).not.toContain(nav.signInLabel)
      expect(w.find('a[href="/profile"]').exists()).toBe(true)
    })
  })
})

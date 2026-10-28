import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { clearNuxtState, useState } from '#imports'
import AccountCard from '~/components/profile/AccountCard.vue'
import copy from '~/data/copy.json'
import { buttonNamed, fill, photoUser, signedInUser } from '../../fixtures'

const sync = await vi.hoisted(async () => (await import('../../fixtures')).cloudSyncSpies())
const initializeApp = vi.hoisted(() => vi.fn(() => ({})))

vi.mock('firebase/app', () => ({ initializeApp, getApps: () => [], getApp: () => ({}) }))

mockNuxtImport('useCloudSync', () => () => sync)

const mounted: { unmount: () => void }[] = []

async function mountCard() {
  const wrapper = await mountSuspended(AccountCard)
  mounted.push(wrapper)
  return wrapper
}

const card = '[data-testid="account-card"]'
const a = copy.account

describe('AccountCard', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtState(['auth-user', 'auth-error', 'auth-ready'])
    useState('auth-ready').value = true
    sync.status.value = ''
    Object.values(sync).forEach(f => (typeof f === 'function' ? f.mockClear() : undefined))
    initializeApp.mockClear()
  })
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    vi.unstubAllGlobals()
  })

  describe('as a guest', () => {
    it('shows the guest state with the title, intro and every benefit', async () => {
      const wrapper = await mountCard()
      const el = wrapper.get(card)
      expect(el.attributes('data-state')).toBe('guest')
      expect(el.findAll('h1, h2, h3, h4').map(h => h.text())).toContain(a.title)
      expect(el.text()).toContain(a.guestIntro)
      for (const b of a.benefits) expect(el.text()).toContain(b)
    })

    it('signs in through cloud sync', async () => {
      const wrapper = await mountCard()
      await buttonNamed(wrapper, a.signIn).trigger('click')
      expect(sync.signIn).toHaveBeenCalledTimes(1)
    })

    it('hides the sign-in button until the session restore ends', async () => {
      useState('auth-ready').value = false
      const wrapper = await mountCard()
      expect(wrapper.findAll('button').map(b => b.text().trim())).not.toContain(a.signIn)
    })

    it('loads no Firebase when the card only shows', async () => {
      await mountCard()
      await new Promise(r => setTimeout(r, 0))
      expect(initializeApp).not.toHaveBeenCalled()
    })

    it('loads Firebase when the player points at or focuses the sign-in button', async () => {
      const wrapper = await mountCard()
      const button = buttonNamed(wrapper, a.signIn)
      await button.trigger('focus')
      await vi.waitFor(() => expect(initializeApp).toHaveBeenCalled())
    })

    it('shows no alert when there is no error', async () => {
      const wrapper = await mountCard()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })

    it('shows the sign-in error as an alert after its own sign-in button was used', async () => {
      const wrapper = await mountCard()
      await buttonNamed(wrapper, a.signIn).trigger('click')
      useState('auth-error').value = a.errors.popup
      await nextTick()
      expect(wrapper.get('[role="alert"]').text()).toBe(a.errors.popup)
    })

    it('leaves a sign-in error from the navbar panel to the panel', async () => {
      useState('auth-error').value = a.errors.popup
      const wrapper = await mountCard()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })

    it('links to the privacy page', async () => {
      const wrapper = await mountCard()
      expect(wrapper.get('a[href="/privacy"]').text()).toBe(a.privacyLink)
    })

    it('does not offer sign out or delete', async () => {
      const wrapper = await mountCard()
      const names = wrapper.findAll('button').map(b => b.text().trim())
      expect(names).not.toContain(a.signOut)
      expect(names).not.toContain(a.delete)
    })
  })

  describe('when signed in', () => {
    beforeEach(() => {
      useState('auth-user').value = signedInUser
    })

    it('shows the name, the email and that the garden is saved', async () => {
      const wrapper = await mountCard()
      const el = wrapper.get(card)
      expect(el.attributes('data-state')).toBe('signed-in')
      expect(el.text()).toContain(fill(a.signedInAs, { name: signedInUser.name }))
      expect(el.text()).toContain(signedInUser.email)
      expect(el.text()).toContain(a.synced)
      expect(wrapper.findAll('button').map(b => b.text().trim())).not.toContain(a.signIn)
    })

    it('shows the Google photo as a decorative image without a referrer', async () => {
      useState('auth-user').value = photoUser
      const wrapper = await mountCard()
      const img = wrapper.get('img[data-testid="account-photo"]')
      expect(img.attributes('src')).toBe(photoUser.photo)
      expect(img.attributes('alt')).toBe('')
      expect(img.attributes('referrerpolicy')).toBe('no-referrer')
    })

    it('shows no photo when the account has none', async () => {
      const wrapper = await mountCard()
      expect(wrapper.find('[data-testid="account-photo"]').exists()).toBe(false)
    })

    it('signs out through cloud sync', async () => {
      const wrapper = await mountCard()
      await buttonNamed(wrapper, a.signOut).trigger('click')
      expect(sync.signOut).toHaveBeenCalledTimes(1)
    })

    it('asks before deleting the cloud data and keeps it when cancelled', async () => {
      const confirm = vi.fn(() => false)
      vi.stubGlobal('confirm', confirm)
      const wrapper = await mountCard()
      await buttonNamed(wrapper, a.delete).trigger('click')
      expect(confirm).toHaveBeenCalledWith(a.deleteConfirm)
      expect(sync.deleteCloud).not.toHaveBeenCalled()
    })

    it('deletes the cloud data after confirmation', async () => {
      vi.stubGlobal(
        'confirm',
        vi.fn(() => true)
      )
      const wrapper = await mountCard()
      await buttonNamed(wrapper, a.delete).trigger('click')
      expect(sync.deleteCloud).toHaveBeenCalledTimes(1)
    })

    it('links to the privacy page', async () => {
      const wrapper = await mountCard()
      expect(wrapper.get('a[href="/privacy"]').text()).toBe(a.privacyLink)
    })
  })

  describe('sync status', () => {
    it('shows the sync error in place of the saved line', async () => {
      useState('auth-user').value = signedInUser
      sync.status.value = 'sync'
      const wrapper = await mountCard()
      expect(wrapper.get('[role="alert"]').text()).toBe(a.errors.sync)
      expect(wrapper.text()).not.toContain(a.synced)
    })

    it('shows the delete error', async () => {
      useState('auth-user').value = signedInUser
      sync.status.value = 'deleteFailed'
      const wrapper = await mountCard()
      expect(wrapper.get('[role="alert"]').text()).toBe(a.errors.deleteFailed)
    })
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import HomePage from '~/pages/index.vue'
import copy from '~/data/copy.json'

describe('pages/index', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtState(['auth-user'])
  })

  it('shows the hero, the game grid and the privacy footer', async () => {
    const wrapper = await mountSuspended(HomePage, { route: '/' })
    expect(wrapper.find('[data-testid="hero"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Pick a game')
    expect(wrapper.findAll('a[href="/games/math"]').length).toBeGreaterThan(0)
    expect(wrapper.get('footer').text()).toContain('Scores live only in this browser.')
    await vi.waitFor(() => expect(document.title).toBe('Brain Games | Relax and sharpen your mind'))
  })

  it('shows the guest notice to a guest', async () => {
    const wrapper = await mountSuspended(HomePage, { route: '/' })
    expect(wrapper.get('[data-testid="guest-notice"]').text()).toContain(copy.account.notice)
    wrapper.unmount()
  })
})

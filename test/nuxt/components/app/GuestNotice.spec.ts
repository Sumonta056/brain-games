import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState, useState } from '#imports'
import GuestNotice from '~/components/app/GuestNotice.vue'
import copy from '~/data/copy.json'
import { signedInUser } from '../../fixtures'

const mounted: { unmount: () => void }[] = []

async function mountNotice() {
  const wrapper = await mountSuspended(GuestNotice)
  mounted.push(wrapper)
  return wrapper
}

const notice = '[data-testid="guest-notice"]'

describe('GuestNotice', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtState(['auth-user', 'auth-error'])
  })
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
  })

  it('tells a guest where their progress lives', async () => {
    const wrapper = await mountNotice()
    const el = wrapper.get(notice)
    expect(el.attributes('role')).toBe('note')
    expect(el.text()).toContain(copy.account.notice)
  })

  it('has a labelled close button', async () => {
    const wrapper = await mountNotice()
    const close = wrapper.get(`${notice} button[aria-label="${copy.account.noticeClose}"]`)
    expect(close.element.tagName).toBe('BUTTON')
  })

  it('hides after close and remembers it in this browser', async () => {
    const wrapper = await mountNotice()
    await wrapper.get(`button[aria-label="${copy.account.noticeClose}"]`).trigger('click')
    expect(wrapper.find(notice).exists()).toBe(false)
    expect(localStorage.getItem('bgarden-notice')).toBe('1')
  })

  it('stays hidden when it was closed before', async () => {
    localStorage.setItem('bgarden-notice', '1')
    const wrapper = await mountNotice()
    expect(wrapper.find(notice).exists()).toBe(false)
  })

  it('is hidden when the player is signed in', async () => {
    useState('auth-user').value = signedInUser
    const wrapper = await mountNotice()
    expect(wrapper.find(notice).exists()).toBe(false)
  })

  it('hides as soon as the player signs in', async () => {
    const wrapper = await mountNotice()
    expect(wrapper.find(notice).exists()).toBe(true)
    useState('auth-user').value = signedInUser
    await nextTick()
    expect(wrapper.find(notice).exists()).toBe(false)
  })
})

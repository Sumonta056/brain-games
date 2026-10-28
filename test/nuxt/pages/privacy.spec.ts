import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PrivacyPage from '~/pages/privacy.vue'
import copy from '~/data/copy.json'

const p = copy.account.privacy
const mounted: { unmount: () => void }[] = []

async function mountPrivacy() {
  const wrapper = await mountSuspended(PrivacyPage, { route: '/privacy' })
  mounted.push(wrapper)
  return wrapper
}

describe('pages/privacy', () => {
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
  })

  it('sets the page title', async () => {
    await mountPrivacy()
    await vi.waitFor(() => expect(document.title).toBe('Privacy | Brain Games'))
  })

  it('shows the title and the intro', async () => {
    const wrapper = await mountPrivacy()
    expect(wrapper.get('h1').text()).toBe(p.title)
    expect(wrapper.text()).toContain(p.intro)
  })

  it('shows every section heading as an h2 with its body', async () => {
    const wrapper = await mountPrivacy()
    expect(wrapper.findAll('h2').map(h => h.text())).toEqual(p.sections.map(s => s.heading))
    for (const s of p.sections) expect(wrapper.text()).toContain(s.body)
  })

  it('links back to the profile', async () => {
    const wrapper = await mountPrivacy()
    expect(wrapper.get('a[href="/profile"]').text()).toBe(p.back)
  })
})

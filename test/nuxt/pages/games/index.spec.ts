import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import GamesPage from '~/pages/games/index.vue'

describe('pages/games/index', () => {
  it('lists all 15 games under "All games"', async () => {
    const wrapper = await mountSuspended(GamesPage, { route: '/games' })
    expect(wrapper.get('h2').text()).toBe('All games')
    const links = wrapper.findAll('a[href^="/games/"]').map(a => a.attributes('href'))
    expect(new Set(links).size).toBe(15)
    expect(links).toContain('/games/math')
    await vi.waitFor(() => expect(document.title).toBe('All games | Brain Games'))
  })
})

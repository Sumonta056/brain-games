import { afterEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearError, useError } from '#imports'
import GamePage from '~/pages/games/[id].vue'

describe('pages/games/[id]', () => {
  afterEach(() => clearError())

  it('renders the game shell for a known id', async () => {
    const wrapper = await mountSuspended(GamePage, { route: '/games/math' })
    expect(wrapper.find('[data-testid="game-page"]').exists()).toBe(true)
    expect(wrapper.get('h1').text()).toBe('Mental math')
    expect(wrapper.text()).toContain('Ready?')
    await vi.waitFor(() => expect(document.title).toBe('Mental math — Brain Games'))
  })

  it('throws a 404 for an unknown id', async () => {
    const wrapper = await mountSuspended(GamePage, { route: '/games/nope' })
    expect(wrapper.find('[data-testid="game-page"]').exists()).toBe(false)
    expect(useError().value).toMatchObject({ statusCode: 404, statusMessage: 'Game not found', fatal: true })
  })
})

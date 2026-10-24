import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ComingSoon from '~/games/ComingSoon.vue'
import { makeGame } from '../fixtures'

describe('ComingSoon', () => {
  it('names the design.html logic to port', async () => {
    const wrapper = await mountSuspended(ComingSoon, { props: { game: makeGame([0]) } })
    expect(wrapper.text()).toContain('Coming soon')
    expect(wrapper.get('code').text()).toBe('RUN.fixture')
  })

  it('finishes with a score of 0 on Skip', async () => {
    const wrapper = await mountSuspended(ComingSoon, { props: { game: makeGame([0]) } })
    const skip = wrapper.get('button')
    expect(skip.text()).toBe('Skip')
    await skip.trigger('click')
    expect(wrapper.emitted('finish')).toEqual([[0]])
  })
})

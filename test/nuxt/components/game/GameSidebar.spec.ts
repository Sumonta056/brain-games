import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import GameSidebar from '~/components/game/GameSidebar.vue'
import { mathGame, reactionGame } from '../../fixtures'

describe('GameSidebar', () => {
  it('lists the numbered how-to-play steps', async () => {
    const wrapper = await mountSuspended(GameSidebar, { props: { game: mathGame, here: -1 } })
    expect(wrapper.findAll('ol li').map(li => li.text())).toEqual(mathGame.steps)
  })

  it('shows every band with its range', async () => {
    const wrapper = await mountSuspended(GameSidebar, { props: { game: mathGame, here: -1 } })
    const rows = wrapper.findAll('[data-testid="bands"] > *')
    expect(rows).toHaveLength(mathGame.bands.length)
    expect(rows[4]!.text()).toBe('Lightning25+')
  })

  it('prompts to play once when there is no score', async () => {
    const wrapper = await mountSuspended(GameSidebar, { props: { game: mathGame, here: -1 } })
    expect(wrapper.find('[aria-current="true"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Play once to see where you land.')
  })

  it('highlights the current band', async () => {
    const wrapper = await mountSuspended(GameSidebar, { props: { game: mathGame, here: 3 } })
    expect(wrapper.findAll('[aria-current="true"]')).toHaveLength(1)
    expect(wrapper.get('[aria-current="true"]').text()).toContain('Quick')
    expect(wrapper.text()).toContain('Highlighted: where your score sits.')
  })

  it('says lower is better only for lower-is-better games', async () => {
    const reaction = await mountSuspended(GameSidebar, { props: { game: reactionGame, here: -1 } })
    expect(reaction.text()).toContain('Lower is better.')
    const math = await mountSuspended(GameSidebar, { props: { game: mathGame, here: -1 } })
    expect(math.text()).not.toContain('Lower is better.')
  })

  it('shows the science note and tip', async () => {
    const wrapper = await mountSuspended(GameSidebar, { props: { game: mathGame, here: -1 } })
    expect(wrapper.text()).toContain(mathGame.science)
    expect(wrapper.text()).toContain(`Tip: ${mathGame.tip}`)
  })
})

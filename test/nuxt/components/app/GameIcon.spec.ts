import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import GameIcon from '~/components/app/GameIcon.vue'
import { breathGame, iconNames, mathGame } from '../../fixtures'

describe('GameIcon', () => {
  it('renders the game icon file named after the game', async () => {
    const math = await mountSuspended(GameIcon, { props: { game: mathGame } })
    const calm = await mountSuspended(GameIcon, { props: { game: breathGame } })
    expect(iconNames(math)).toEqual(['bg:games-math'])
    expect(iconNames(calm)).toEqual(['bg:games-breath'])
  })

  it('draws the shapes from the game icon file', async () => {
    const w = await mountSuspended(GameIcon, { props: { game: mathGame } })
    const svg = w.get('svg')
    expect(svg.attributes('viewBox')).toBe('0 0 48 48')
    expect(svg.html()).toContain('M28 28l9 9M37 28l-9 9')
  })

  it('is decorative', async () => {
    const w = await mountSuspended(GameIcon, { props: { game: mathGame } })
    expect(w.findComponent({ name: 'NuxtIcon' }).exists()).toBe(true)
    expect(w.attributes('aria-hidden')).toBe('true')
  })

  it('is tinted with the category foreground colour', async () => {
    const speed = await mountSuspended(GameIcon, { props: { game: mathGame } })
    const calm = await mountSuspended(GameIcon, { props: { game: breathGame } })
    expect(speed.findComponent({ name: 'NuxtIcon' }).attributes('style')).toContain('var(--peach-fg)')
    expect(calm.findComponent({ name: 'NuxtIcon' }).attributes('style')).toContain('var(--mint-fg)')
  })
})

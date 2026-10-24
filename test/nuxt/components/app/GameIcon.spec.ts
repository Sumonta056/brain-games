import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import GameIcon from '~/components/app/GameIcon.vue'
import { breathGame, mathGame } from '../../fixtures'

describe('GameIcon', () => {
  it('renders the game icon markup with its viewBox', async () => {
    const w = await mountSuspended(GameIcon, { props: { game: mathGame } })
    const svg = w.get('svg')
    expect(svg.attributes('viewBox')).toBe(mathGame.icon.viewBox)
    expect(svg.element.innerHTML).not.toBe('')
    expect(svg.element.innerHTML.replace(/\s/g, '')).toBe(
      new DOMParser()
        .parseFromString(`<svg>${mathGame.icon.svg}</svg>`, 'image/svg+xml')
        .documentElement.innerHTML.replace(/\s/g, '')
    )
  })

  it('is decorative', async () => {
    const w = await mountSuspended(GameIcon, { props: { game: mathGame } })
    expect(w.get('svg').attributes('aria-hidden')).toBe('true')
  })

  it('is tinted with the category foreground colour', async () => {
    const speed = await mountSuspended(GameIcon, { props: { game: mathGame } })
    const calm = await mountSuspended(GameIcon, { props: { game: breathGame } })
    expect(speed.get('svg').attributes('style')).toContain('var(--peach-fg)')
    expect(calm.get('svg').attributes('style')).toContain('var(--mint-fg)')
  })
})

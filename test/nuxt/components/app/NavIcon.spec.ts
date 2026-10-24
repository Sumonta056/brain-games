import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import NavIcon from '~/components/app/NavIcon.vue'

const NAMES = ['home', 'games', 'user', 'sun', 'moon', 'auto', 'back', 'flame']

describe('NavIcon', () => {
  it('is decorative and 20px by default', async () => {
    const w = await mountSuspended(NavIcon, { props: { name: 'home' } })
    const svg = w.get('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('width')).toBe('20')
    expect(svg.attributes('height')).toBe('20')
    expect(svg.attributes('stroke')).toBe('currentColor')
  })

  it('accepts a custom size', async () => {
    const w = await mountSuspended(NavIcon, { props: { name: 'flame', size: 18 } })
    expect(w.get('svg').attributes('width')).toBe('18')
    expect(w.get('svg').attributes('height')).toBe('18')
  })

  it('draws a distinct shape for every icon the app uses', async () => {
    const shapes = new Set<string>()
    for (const name of NAMES) {
      const w = await mountSuspended(NavIcon, { props: { name } })
      const inner = w.get('svg').element.innerHTML
      expect(inner, name).not.toBe('')
      shapes.add(inner)
    }
    expect(shapes.size).toBe(NAMES.length)
  })

  it('renders an empty svg for an unknown name', async () => {
    const w = await mountSuspended(NavIcon, { props: { name: 'nope' } })
    expect(w.get('svg').element.innerHTML).toBe('')
  })
})

import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BrainLogo from '~/components/app/BrainLogo.vue'

describe('BrainLogo', () => {
  it('is a decorative square svg', async () => {
    const w = await mountSuspended(BrainLogo)
    const svg = w.get('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
    expect(svg.attributes('viewBox')).toBe('0 0 48 48')
    expect(w.findAll('path').length).toBeGreaterThan(0)
  })

  it('takes its colours from theme variables so both themes work', async () => {
    const w = await mountSuspended(BrainLogo)
    for (const p of w.findAll('path')) {
      for (const attr of ['fill', 'stroke']) {
        const v = p.attributes(attr)
        if (v && v !== 'none') expect(v).toMatch(/^var\(--/)
      }
    }
  })
})

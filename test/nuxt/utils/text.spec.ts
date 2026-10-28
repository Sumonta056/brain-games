import { describe, expect, it } from 'vitest'
import { fill, fillParts } from '~/utils/text'

describe('fillParts', () => {
  it('splits a template into text and filled value parts', () => {
    expect(fillParts('{n} / {total} games tried', { n: 6, total: 15 })).toEqual([
      { text: '6', value: true },
      { text: ' / ', value: false },
      { text: '15', value: true },
      { text: ' games tried', value: false }
    ])
  })

  it('joins back to the same text as fill', () => {
    const t = 'Best {n} days'
    expect(
      fillParts(t, { n: 9 })
        .map(x => x.text)
        .join('')
    ).toBe(fill(t, { n: 9 }))
  })
})

describe('fill', () => {
  it('replaces every named placeholder', () => {
    expect(fill('{lit} of {total} lit by {lit}', { lit: 3, total: 72 })).toBe('3 of 72 lit by 3')
  })

  it('keeps a placeholder that has no value', () => {
    expect(fill('+{n} in {month}', { n: 5 })).toBe('+5 in {month}')
  })
})

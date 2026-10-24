import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearNuxtState } from '#imports'
import { useCheer } from '~/composables/useCheer'
import copy from '~/data/copy.json'

describe('useCheer', () => {
  beforeEach(() => {
    clearNuxtState('cheers')
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('shows the given text', () => {
    const { cheer, cheers } = useCheer()
    cheer('Level up!')
    expect(cheers.value.map(c => c.text)).toEqual(['Level up!'])
  })

  it('picks a non-empty praise when no text is given', () => {
    const { cheer, cheers } = useCheer()
    cheer()
    expect(cheers.value).toHaveLength(1)
    expect(cheers.value[0]!.text.length).toBeGreaterThan(0)
  })

  it('picks every praise from copy.json and nothing else', () => {
    const { cheer, cheers } = useCheer()
    const n = copy.praise.length
    const random = vi.spyOn(Math, 'random')
    for (let i = 0; i < n; i++) {
      random.mockReturnValue((i + 0.5) / n)
      cheer()
    }
    expect(cheers.value.map(c => c.text)).toEqual(copy.praise)
  })

  it('removes each cheer after 1100ms', () => {
    const { cheer, cheers } = useCheer()
    cheer('one')
    vi.advanceTimersByTime(500)
    cheer('two')
    vi.advanceTimersByTime(599)
    expect(cheers.value.map(c => c.text)).toEqual(['one', 'two'])
    vi.advanceTimersByTime(1)
    expect(cheers.value.map(c => c.text)).toEqual(['two'])
    vi.advanceTimersByTime(500)
    expect(cheers.value).toEqual([])
  })

  it('shares cheers between callers', () => {
    useCheer().cheer('shared')
    expect(useCheer().cheers.value.map(c => c.text)).toEqual(['shared'])
  })

  it('gives each cheer a unique id', () => {
    const { cheer, cheers } = useCheer()
    cheer('a')
    cheer('a')
    expect(new Set(cheers.value.map(c => c.id)).size).toBe(2)
  })
})

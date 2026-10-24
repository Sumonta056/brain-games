import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { useListGame } from '~/composables/useListGame'
import { useCheer } from '~/composables/useCheer'

async function withSetup<T>(setup: () => T) {
  let result!: T
  const wrapper = await mountSuspended(
    defineComponent({
      setup() {
        result = setup()
        return () => h('div')
      }
    })
  )
  return { result, wrapper }
}

const noRule = () => null

describe('useListGame', () => {
  beforeEach(() => {
    clearNuxtState('cheers')
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('adds a trimmed, lowercased entry and says Added', async () => {
    const { result } = await withSetup(() => useListGame(noRule, 60, vi.fn()))
    result.submit('  Apple ')
    expect(result.items.value).toEqual(['apple'])
    expect(result.feedback.value).toEqual({ text: 'Added', ok: true })
  })

  it('puts the newest entry first', async () => {
    const { result } = await withSetup(() => useListGame(noRule, 60, vi.fn()))
    result.submit('one')
    result.submit('two')
    result.submit('three')
    expect(result.items.value).toEqual(['three', 'two', 'one'])
  })

  it('ignores an empty or blank entry', async () => {
    const check = vi.fn(noRule)
    const { result } = await withSetup(() => useListGame(check, 60, vi.fn()))
    result.submit('')
    result.submit('   ')
    expect(result.items.value).toEqual([])
    expect(check).not.toHaveBeenCalled()
  })

  it('passes the cleaned entry to check', async () => {
    const check = vi.fn(noRule)
    const { result } = await withSetup(() => useListGame(check, 60, vi.fn()))
    result.submit(' BaNaNa ')
    expect(check).toHaveBeenCalledWith('banana')
  })

  it('shows the check message and does not add the entry', async () => {
    const { result } = await withSetup(() => useListGame(() => 'Try 3 letters or more', 60, vi.fn()))
    result.submit('ab')
    expect(result.items.value).toEqual([])
    expect(result.feedback.value).toEqual({ text: 'Try 3 letters or more', ok: false })
  })

  it('refuses a repeat, ignoring case and spaces', async () => {
    const { result } = await withSetup(() => useListGame(noRule, 60, vi.fn()))
    result.submit('apple')
    result.submit(' APPLE ')
    expect(result.items.value).toEqual(['apple'])
    expect(result.feedback.value).toEqual({ text: 'You already have that one', ok: false })
  })

  it('cheers on every 5th entry only', async () => {
    const { result } = await withSetup(() => useListGame(noRule, 60, vi.fn()))
    const { cheers } = useCheer()
    for (const w of ['a1', 'a2', 'a3', 'a4']) result.submit(w)
    expect(cheers.value).toHaveLength(0)
    result.submit('a5')
    expect(cheers.value).toHaveLength(1)
    for (const w of ['a6', 'a7', 'a8', 'a9']) result.submit(w)
    expect(cheers.value).toHaveLength(1)
    result.submit('a10')
    expect(cheers.value).toHaveLength(2)
  })

  it('does not cheer when an entry is refused', async () => {
    const { result } = await withSetup(() => useListGame(noRule, 60, vi.fn()))
    const { cheers } = useCheer()
    for (const w of ['a1', 'a2', 'a3', 'a4']) result.submit(w)
    result.submit('a4')
    expect(cheers.value).toHaveLength(0)
  })

  it('calls onEnd once with the number of entries when time runs out', async () => {
    const onEnd = vi.fn()
    const { result } = await withSetup(() => useListGame(noRule, 60, onEnd))
    result.start()
    result.submit('one')
    result.submit('two')
    result.submit('two')
    vi.advanceTimersByTime(59_000)
    expect(onEnd).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1200)
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(onEnd).toHaveBeenCalledWith(2)
    vi.advanceTimersByTime(5000)
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('uses the given number of seconds', async () => {
    const onEnd = vi.fn()
    const { result } = await withSetup(() => useListGame(noRule, 10, onEnd))
    result.start()
    vi.advanceTimersByTime(10_200)
    expect(onEnd).toHaveBeenCalledWith(0)
  })

  it('runs the timer fraction from 1 down to 0', async () => {
    const { result } = await withSetup(() => useListGame(noRule, 60, vi.fn()))
    expect(result.fraction.value).toBe(1)
    result.start()
    vi.advanceTimersByTime(30_000)
    expect(result.fraction.value).toBeCloseTo(0.5, 1)
    vi.advanceTimersByTime(30_200)
    expect(result.fraction.value).toBe(0)
  })

  it('stops the timer on unmount', async () => {
    const onEnd = vi.fn()
    const { result, wrapper } = await withSetup(() => useListGame(noRule, 60, onEnd))
    result.start()
    wrapper.unmount()
    vi.advanceTimersByTime(61_000)
    expect(onEnd).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})

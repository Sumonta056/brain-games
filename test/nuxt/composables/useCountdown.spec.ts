import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useCountdown, useTimeouts } from '~/composables/useCountdown'

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

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('counts the fraction from 1 to 0 and calls onEnd once', async () => {
    const onEnd = vi.fn()
    const { result } = await withSetup(() => useCountdown(2, onEnd))
    result.start()
    vi.advanceTimersByTime(1000)
    expect(result.fraction.value).toBeCloseTo(0.5, 1)
    vi.advanceTimersByTime(1100)
    expect(result.fraction.value).toBe(0)
    expect(onEnd).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(5000)
    expect(onEnd).toHaveBeenCalledTimes(1)
  })

  it('stop prevents onEnd', async () => {
    const onEnd = vi.fn()
    const { result } = await withSetup(() => useCountdown(1, onEnd))
    result.start()
    result.stop()
    vi.advanceTimersByTime(2000)
    expect(onEnd).not.toHaveBeenCalled()
  })

  it('clears the timer on unmount', async () => {
    const onEnd = vi.fn()
    const { result, wrapper } = await withSetup(() => useCountdown(1, onEnd))
    result.start()
    wrapper.unmount()
    vi.advanceTimersByTime(2000)
    expect(onEnd).not.toHaveBeenCalled()
  })
})

describe('useTimeouts', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('runs callbacks after the delay', async () => {
    const fn = vi.fn()
    const { result } = await withSetup(() => useTimeouts())
    result.later(fn, 500)
    vi.advanceTimersByTime(499)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('clearAll cancels pending callbacks', async () => {
    const fn = vi.fn()
    const { result } = await withSetup(() => useTimeouts())
    result.later(fn, 500)
    result.clearAll()
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
  })

  it('cancels pending callbacks on unmount', async () => {
    const fn = vi.fn()
    const { result, wrapper } = await withSetup(() => useTimeouts())
    result.later(fn, 500)
    wrapper.unmount()
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
  })
})

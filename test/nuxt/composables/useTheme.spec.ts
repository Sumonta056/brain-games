import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { useTheme } from '~/composables/useTheme'

const mounted: { unmount: () => void }[] = []

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
  mounted.push(wrapper)
  return { result, wrapper }
}

async function flush() {
  await nextTick()
  await new Promise(r => setTimeout(r, 20))
}

const htmlTheme = () => document.documentElement.getAttribute('data-theme')

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtState('progress')
  })
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    localStorage.clear()
    clearNuxtState('progress')
  })

  it('starts on auto', async () => {
    const { result } = await withSetup(() => useTheme())
    expect(result.theme.value).toBe('auto')
  })

  it('cycles auto → light → dark → auto', async () => {
    const { result } = await withSetup(() => useTheme())
    const seen = []
    for (let i = 0; i < 3; i++) {
      result.cycle()
      seen.push(result.theme.value)
    }
    expect(seen).toEqual(['light', 'dark', 'auto'])
  })

  it('stores the chosen theme in bgarden', async () => {
    const { result } = await withSetup(() => useTheme())
    result.cycle()
    await nextTick()
    expect(JSON.parse(localStorage.getItem('bgarden')!).theme).toBe('light')
  })

  it('restores a saved theme', async () => {
    localStorage.setItem('bgarden', JSON.stringify({ theme: 'dark' }))
    const { result } = await withSetup(() => useTheme())
    expect(result.theme.value).toBe('dark')
  })

  it('sets data-theme on <html> for light and dark and removes it for auto', async () => {
    const { result } = await withSetup(() => useTheme())
    result.cycle()
    await flush()
    expect(htmlTheme()).toBe('light')
    result.cycle()
    await flush()
    expect(htmlTheme()).toBe('dark')
    result.cycle()
    await flush()
    expect(htmlTheme()).toBeNull()
  })
})

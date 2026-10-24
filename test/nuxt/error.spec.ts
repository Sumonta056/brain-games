import { describe, expect, it, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { createError } from '#imports'
import ErrorPage from '~/error.vue'

const { clearErrorSpy } = vi.hoisted(() => ({ clearErrorSpy: vi.fn() }))
mockNuxtImport('clearError', () => clearErrorSpy)

describe('error page', () => {
  it('shows a gentle message for a missing game', async () => {
    const wrapper = await mountSuspended(ErrorPage, { props: { error: createError({ statusCode: 404 }) } })
    expect(wrapper.text()).toContain('That game wandered off 🌱')
  })

  it('shows a generic message for other errors', async () => {
    const wrapper = await mountSuspended(ErrorPage, { props: { error: createError({ statusCode: 500 }) } })
    expect(wrapper.text()).toContain('Something went wrong')
    expect(wrapper.text()).not.toContain('wandered off')
  })

  it('clears the error and goes back to games', async () => {
    const wrapper = await mountSuspended(ErrorPage, { props: { error: createError({ statusCode: 404 }) } })
    await wrapper.get('button').trigger('click')
    expect(clearErrorSpy).toHaveBeenCalledWith({ redirect: '/games' })
  })
})

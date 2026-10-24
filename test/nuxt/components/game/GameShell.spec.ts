import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import GameShell from '~/components/game/GameShell.vue'
import { useProgress } from '~/composables/useProgress'
import { buttonNamed, iconNames, mathGame, reactionGame } from '../../fixtures'

const stub = vi.hoisted(() => ({ score: 0 }))

vi.mock('~/components/games/MentalMath.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    __esModule: true,
    default: defineComponent({
      props: { game: { type: Object, required: true } },
      emits: ['finish'],
      setup(_, { emit }) {
        return () => h('button', { class: 'stub-finish', onClick: () => emit('finish', stub.score) }, 'stub game')
      }
    })
  }
})

vi.mock('~/utils/confetti', () => ({ confetti: vi.fn() }))

const mounted: { unmount: () => void }[] = []

async function mountShell(game = mathGame) {
  const wrapper = await mountSuspended(GameShell, { props: { game } })
  mounted.push(wrapper)
  return wrapper
}

async function startGame(wrapper: Awaited<ReturnType<typeof mountShell>>) {
  await buttonNamed(wrapper, 'Start ▸').trigger('click')
  await vi.waitFor(async () => {
    await flushPromises()
    expect(wrapper.find('[data-testid="ready"]').exists()).toBe(false)
    expect(wrapper.find('.stub-finish, [data-testid="coming-soon"]').exists()).toBe(true)
  })
}

async function finishWith(wrapper: Awaited<ReturnType<typeof mountShell>>, score: number) {
  stub.score = score
  await wrapper.get('.stub-finish').trigger('click')
  await flushPromises()
}

describe('GameShell', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtState(['progress', 'cheers'])
  })
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
  })

  it('shows the header with name, category line, back link and no best yet', async () => {
    const wrapper = await mountShell()
    expect(wrapper.get('h1').text()).toBe('Mental math')
    expect(wrapper.text()).toContain('Speed · Medium · trains processing speed and working memory')
    const back = wrapper.get('a[aria-label="Back to games"]')
    expect(back.attributes('href')).toBe('/games')
    expect(wrapper.get('[data-testid="pb"] b').text()).toBe('—')
  })

  it('shows a back icon on the back link and the game icon in the header', async () => {
    const wrapper = await mountShell(reactionGame)
    expect(iconNames(wrapper, 'a[aria-label="Back to games"]')).toEqual(['bg:nav-back'])
    expect(iconNames(wrapper, '[data-testid="game-icon"]')).toEqual(['bg:games-reaction'])
  })

  it('starts on the ready screen and renders the sidebar', async () => {
    const wrapper = await mountShell()
    expect(wrapper.find('[data-testid="ready"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Ready?')
    expect(wrapper.find('aside').exists()).toBe(true)
    expect(wrapper.find('[data-testid="bands"] [aria-current="true"]').exists()).toBe(false)
  })

  it('plays the registered game after Start', async () => {
    const wrapper = await mountShell()
    await startGame(wrapper)
    expect(wrapper.find('.stub-finish').exists()).toBe(true)
    expect(wrapper.find('[data-testid="result"]').exists()).toBe(false)
  })

  it('shows the result with the right band and records progress on finish', async () => {
    const wrapper = await mountShell()
    await startGame(wrapper)
    await finishWith(wrapper, 12)
    expect(wrapper.find('[data-testid="result"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="result"] [data-testid="score"]').text()).toBe('12')
    expect(wrapper.get('[data-testid="result"] h2').text()).toBe('Sharp')
    const { progress } = useProgress()
    expect(progress.value.best.math).toBe(12)
    expect(progress.value.hist[0]).toMatchObject({ id: 'math', s: 12 })
    expect(progress.value.xp).toBe(10)
    expect(wrapper.get('[data-testid="pb"] b').text()).toBe('12')
    expect(wrapper.get('[data-testid="bands"] [aria-current="true"]').text()).toContain('Sharp')
  })

  it('records every round and keeps the best when replaying', async () => {
    const wrapper = await mountShell()
    await startGame(wrapper)
    await finishWith(wrapper, 20)
    await buttonNamed(wrapper.get('[data-testid="result"]'), 'Play again').trigger('click')
    await vi.waitFor(async () => {
      await flushPromises()
      expect(wrapper.find('.stub-finish').exists()).toBe(true)
    })
    await finishWith(wrapper, 3)
    const { progress } = useProgress()
    expect(progress.value.hist.map(h => h.s)).toEqual([3, 20])
    expect(progress.value.best.math).toBe(20)
    expect(wrapper.get('[data-testid="result"] h2').text()).toBe('Warming up')
    expect(wrapper.text()).toContain('Your best is 20.')
  })

  it('highlights the band of the stored best before playing', async () => {
    localStorage.setItem('bgarden', JSON.stringify({ best: { math: 17 } }))
    const wrapper = await mountShell()
    expect(wrapper.get('[data-testid="pb"] b').text()).toBe('17')
    expect(wrapper.get('[data-testid="bands"] [aria-current="true"]').text()).toContain('Quick')
  })

  it('falls back to Coming soon for an unregistered component', async () => {
    const ghost = { ...mathGame, id: 'ghost', component: 'NotRegistered' }
    const wrapper = await mountShell(ghost)
    await startGame(wrapper)
    expect(wrapper.text()).toContain('Coming soon')
    expect(wrapper.text()).toContain('RUN.ghost')
    await buttonNamed(wrapper.get('[data-testid="coming-soon"]'), 'Skip').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="result"]').exists()).toBe(true)
    expect(useProgress().progress.value.best.ghost).toBe(0)
  })

  it('renders cheer messages on the stage', async () => {
    const wrapper = await mountShell()
    useCheer().cheer('On a roll!')
    await flushPromises()
    expect(wrapper.get('[data-testid="cheer"]').text()).toBe('On a roll!')
  })

  it('tells the player lower is better for reaction scores', async () => {
    const wrapper = await mountShell(reactionGame)
    expect(wrapper.text()).toContain('Lower is better.')
    expect(wrapper.find('[data-testid="bands"] [aria-current="true"]').exists()).toBe(false)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import GameShell from '~/components/game/GameShell.vue'
import { useProgress } from '~/composables/useProgress'
import copy from '~/data/copy.json'
import type { GameDef } from '~~/shared/types/game'
import {
  beastBands,
  buttonNamed,
  easyBands,
  hardBands,
  hardScience,
  iconNames,
  mathGame,
  reactionGame,
  tieredGame,
  type TieredGame
} from '../../fixtures'

const stub = vi.hoisted(() => ({ score: 0, game: null as unknown }))

vi.mock('~/components/games/MentalMath.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    __esModule: true,
    default: defineComponent({
      props: { game: { type: Object, required: true } },
      emits: ['finish'],
      setup(props, { emit }) {
        stub.game = props.game
        return () => h('button', { class: 'stub-finish', onClick: () => emit('finish', stub.score) }, 'stub game')
      }
    })
  }
})

vi.mock('~/utils/confetti', () => ({ confetti: vi.fn() }))

const slow = vi.hoisted(() => ({ release: () => {} }))

vi.mock('~/components/games/ReactionTime.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    __esModule: true,
    default: defineComponent({
      props: { game: { type: Object, required: true } },
      emits: ['finish'],
      async setup() {
        await new Promise<void>(r => {
          slow.release = r
        })
        return () => h('p', { 'data-testid': 'slow-game' }, 'slow game')
      }
    })
  }
})

const mounted: { unmount: () => void }[] = []

async function mountShell(game: GameDef = mathGame, attach = false) {
  const wrapper = await mountSuspended(GameShell, { props: { game }, ...(attach && { attachTo: document.body }) })
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

  it('shows the loading line until a slow game is ready', async () => {
    const wrapper = await mountShell(reactionGame)
    await buttonNamed(wrapper, 'Start ▸').trigger('click')
    await vi.waitFor(async () => {
      await flushPromises()
      expect(wrapper.find('[data-testid="game-loading"]').exists()).toBe(true)
    })
    expect(wrapper.get('[data-testid="game-loading"]').text()).toBe(copy.loading)
    expect(wrapper.find('[data-testid="slow-game"]').exists()).toBe(false)
    slow.release()
    await vi.waitFor(async () => {
      await flushPromises()
      expect(wrapper.find('[data-testid="slow-game"]').exists()).toBe(true)
    })
    expect(wrapper.find('[data-testid="game-loading"]').exists()).toBe(false)
  })

  describe('difficulty (functional-requirements §3.1)', () => {
    type Wrapper = Awaited<ReturnType<typeof mountShell>>
    const radio = (w: Wrapper, label: string) => {
      const r = w
        .get('[data-testid="difficulty"]')
        .findAll('[role="radio"]')
        .find(x => x.text().trim() === label)
      if (!r) throw new Error(`No radio ${label}`)
      return r
    }
    const checked = (w: Wrapper) =>
      w
        .get('[data-testid="difficulty"]')
        .findAll('[role="radio"]')
        .filter(r => r.attributes('aria-checked') === 'true')
        .map(r => r.text().trim())
    const bandLabels = (w: Wrapper) => w.findAll('[data-testid="bands"] > *').map(b => b.text())
    const choose = async (w: Wrapper, label: string) => {
      await radio(w, label).trigger('click')
      await flushPromises()
    }

    it('selects Medium by default', async () => {
      const wrapper = await mountShell(tieredGame)
      expect(checked(wrapper)).toEqual(['Medium'])
    })

    it('selects Medium when the stored difficulty is not a known one', async () => {
      localStorage.setItem('bgarden', JSON.stringify({ diff: { tiered: 'expert' } }))
      const wrapper = await mountShell(tieredGame)
      expect(checked(wrapper)).toEqual(['Medium'])
      await startGame(wrapper)
      expect((stub.game as TieredGame).settings).toEqual({ n: 2 })
    })

    it('selects the difficulty stored for this game', async () => {
      localStorage.setItem('bgarden', JSON.stringify({ diff: { tiered: 'hard' } }))
      const wrapper = await mountShell(tieredGame)
      expect(checked(wrapper)).toEqual(['Hard'])
    })

    it('stores the chosen difficulty for this game', async () => {
      const wrapper = await mountShell(tieredGame)
      await choose(wrapper, 'Easy')
      expect(checked(wrapper)).toEqual(['Easy'])
      expect(useProgress().progress.value.diff?.tiered).toBe('easy')
      expect(JSON.parse(localStorage.getItem('bgarden')!).diff.tiered).toBe('easy')
    })

    it('shows no selector for a game without difficulties', async () => {
      const wrapper = await mountShell(reactionGame)
      expect(wrapper.find('[data-testid="difficulty"]').exists()).toBe(false)
    })

    it('shows the bands and science of the chosen difficulty in the sidebar', async () => {
      const wrapper = await mountShell(tieredGame)
      expect(bandLabels(wrapper).some(t => t.includes(mathGame.bands[0]!.label))).toBe(true)
      await choose(wrapper, 'Hard')
      const labels = bandLabels(wrapper)
      expect(labels).toHaveLength(hardBands.length)
      hardBands.forEach((b, i) => expect(labels[i]).toContain(b.label))
      expect(wrapper.get('aside').text()).toContain(hardScience)
      await choose(wrapper, 'Easy')
      easyBands.forEach((b, i) => expect(bandLabels(wrapper)[i]).toContain(b.label))
    })

    it('gives the game component the resolved game', async () => {
      const wrapper = await mountShell(tieredGame)
      await choose(wrapper, 'Hard')
      await startGame(wrapper)
      const game = stub.game as TieredGame
      expect(game.id).toBe('tiered')
      expect(game.difficulty).toBe('hard')
      expect(game.settings).toEqual({ n: 3 })
      expect(game.bands).toEqual(hardBands)
    })

    it('gives the game component the medium settings by default', async () => {
      const wrapper = await mountShell(tieredGame)
      await startGame(wrapper)
      const game = stub.game as TieredGame
      expect(game.difficulty).toBe('medium')
      expect(game.settings).toEqual({ n: 2 })
    })

    it('records a hard round under id@hard and shows its band', async () => {
      const wrapper = await mountShell(tieredGame)
      await choose(wrapper, 'Hard')
      await startGame(wrapper)
      await finishWith(wrapper, 9)
      const { progress } = useProgress()
      expect(progress.value.best['tiered@hard']).toBe(9)
      expect(progress.value.best.tiered).toBeUndefined()
      expect(progress.value.hist[0]).toMatchObject({ id: 'tiered', s: 9, l: 'hard' })
      expect(wrapper.get('[data-testid="result"] h2').text()).toBe('Hard star')
      expect(wrapper.get('[data-testid="bands"] [aria-current="true"]').text()).toContain('Hard star')
      expect(wrapper.get('[data-testid="pb"] b').text()).toBe('9')
    })

    it('names the selected difficulty in the header', async () => {
      const wrapper = await mountShell(tieredGame)
      expect(wrapper.text()).toContain('Speed · Medium · trains')
      await choose(wrapper, 'Hard')
      expect(wrapper.text()).toContain('Speed · Hard · trains')
    })

    it('shows only the best of the selected difficulty in the header', async () => {
      localStorage.setItem('bgarden', JSON.stringify({ best: { tiered: 12, 'tiered@hard': 30 } }))
      const wrapper = await mountShell(tieredGame)
      expect(wrapper.get('[data-testid="pb"] b').text()).toBe('12')
      await choose(wrapper, 'Hard')
      expect(wrapper.get('[data-testid="pb"] b').text()).toBe('30')
      await choose(wrapper, 'Easy')
      expect(wrapper.get('[data-testid="pb"] b').text()).toBe('—')
    })

    it('highlights the band of the selected difficulty best', async () => {
      localStorage.setItem('bgarden', JSON.stringify({ best: { 'tiered@hard': 5 } }))
      const wrapper = await mountShell(tieredGame)
      expect(wrapper.find('[data-testid="bands"] [aria-current="true"]').exists()).toBe(false)
      await choose(wrapper, 'Hard')
      expect(wrapper.get('[data-testid="bands"] [aria-current="true"]').text()).toContain('Hard steady')
    })

    it('compares the result only with the best of the same difficulty', async () => {
      localStorage.setItem('bgarden', JSON.stringify({ best: { tiered: 3 } }))
      const wrapper = await mountShell(tieredGame)
      await choose(wrapper, 'Hard')
      await startGame(wrapper)
      await finishWith(wrapper, 2)
      expect(wrapper.text()).not.toContain('Your best is 3.')
      expect(useProgress().progress.value.best).toEqual({ tiered: 3, 'tiered@hard': 2 })
    })

    describe('level up (functional-requirements §3.3)', () => {
      const name = (d: 'easy' | 'medium' | 'hard' | 'beast') => copy.difficulty[d]
      const fill = (t: string, level: string, next?: string) =>
        t.replace('{level}', level).replace('{next}', next ?? '')
      const dialog = (w: Wrapper) => w.get('[data-testid="level-up"]')
      const hasDialog = (w: Wrapper) => w.find('[data-testid="level-up"]').exists()
      const playing = async (w: Wrapper) => {
        await vi.waitFor(async () => {
          await flushPromises()
          expect(w.find('.stub-finish').exists()).toBe(true)
        })
      }
      const masterEasy = async (attach = false) => {
        const wrapper = await mountShell(tieredGame, attach)
        await choose(wrapper, 'Easy')
        await startGame(wrapper)
        await finishWith(wrapper, easyBands[easyBands.length - 1]!.at!)
        return wrapper
      }

      it('opens the level-up dialog on the first mastery of a difficulty', async () => {
        const wrapper = await masterEasy()
        const d = dialog(wrapper)
        expect(d.attributes('role')).toBe('dialog')
        expect(d.attributes('aria-modal')).toBe('true')
        expect(d.text()).toContain(fill(copy.levelUp.title, name('easy')))
        expect(d.text()).toContain(fill(copy.levelUp.ask, name('easy'), name('medium')))
        expect(d.text()).toContain('You mastered Easy!')
        expect(buttonNamed(d, 'Play Medium').exists()).toBe(true)
        expect(buttonNamed(d, 'Stay on Easy').exists()).toBe(true)
        expect(useProgress().progress.value.mastered).toContain('tiered@easy')
      })

      it('selects the next difficulty and starts a round from Play Medium', async () => {
        const wrapper = await masterEasy()
        stub.game = null
        await buttonNamed(dialog(wrapper), fill(copy.levelUp.play, name('easy'), name('medium'))).trigger('click')
        await playing(wrapper)
        expect(hasDialog(wrapper)).toBe(false)
        expect(wrapper.find('[data-testid="result"]').exists()).toBe(false)
        expect(useProgress().progress.value.diff?.tiered).toBe('medium')
        expect((stub.game as TieredGame).difficulty).toBe('medium')
        expect((stub.game as TieredGame).settings).toEqual({ n: 2 })
        expect(wrapper.text()).toContain('Speed · Medium · trains')
      })

      it('closes the dialog and stays on the result from Stay on Easy', async () => {
        const wrapper = await masterEasy()
        await buttonNamed(dialog(wrapper), fill(copy.levelUp.stay, name('easy'))).trigger('click')
        await flushPromises()
        expect(hasDialog(wrapper)).toBe(false)
        expect(wrapper.find('[data-testid="result"]').exists()).toBe(true)
        expect(wrapper.find('.stub-finish').exists()).toBe(false)
        expect(useProgress().progress.value.diff?.tiered).toBe('easy')
        expect(wrapper.get('[data-testid="try-next"]').text()).toBe(fill(copy.levelUp.tryNext, '', name('medium')))
      })

      it('hides Try while the dialog is open', async () => {
        const wrapper = await masterEasy()
        expect(hasDialog(wrapper)).toBe(true)
        expect(wrapper.find('[data-testid="try-next"]').exists()).toBe(false)
      })

      it('puts focus on the dialog, not on Play again behind it', async () => {
        const wrapper = await masterEasy(true)
        await flushPromises()
        expect(document.activeElement).toBe(
          buttonNamed(dialog(wrapper), fill(copy.levelUp.play, '', name('medium'))).element
        )
      })

      it('returns focus to Play again after Stay', async () => {
        const wrapper = await masterEasy(true)
        await buttonNamed(dialog(wrapper), fill(copy.levelUp.stay, name('easy'))).trigger('click')
        await flushPromises()
        expect(document.activeElement).toBe(buttonNamed(wrapper.get('[data-testid="result"]'), 'Play again').element)
      })

      it('closes the dialog on Escape and keeps the result', async () => {
        const wrapper = await masterEasy(true)
        await dialog(wrapper).trigger('keydown', { key: 'Escape' })
        await flushPromises()
        expect(hasDialog(wrapper)).toBe(false)
        expect(wrapper.find('[data-testid="result"]').exists()).toBe(true)
        expect(document.activeElement).toBe(buttonNamed(wrapper.get('[data-testid="result"]'), 'Play again').element)
      })

      it('offers Hard after the first mastery of Medium', async () => {
        const wrapper = await mountShell(tieredGame)
        await startGame(wrapper)
        await finishWith(wrapper, mathGame.bands[mathGame.bands.length - 1]!.at!)
        const d = dialog(wrapper)
        expect(d.text()).toContain('You mastered Medium!')
        expect(d.text()).toContain('Ready for Hard?')
        await buttonNamed(d, 'Play Hard').trigger('click')
        await playing(wrapper)
        expect(useProgress().progress.value.diff?.tiered).toBe('hard')
        expect((stub.game as TieredGame).difficulty).toBe('hard')
      })

      it('shows Try Medium instead of the dialog on a later mastery', async () => {
        localStorage.setItem('bgarden', JSON.stringify({ mastered: ['tiered@easy'], diff: { tiered: 'easy' } }))
        const wrapper = await mountShell(tieredGame)
        await startGame(wrapper)
        await finishWith(wrapper, easyBands[easyBands.length - 1]!.at!)
        expect(hasDialog(wrapper)).toBe(false)
        const tryNext = wrapper.get('[data-testid="result"] [data-testid="try-next"]')
        expect(tryNext.text()).toBe(fill(copy.levelUp.tryNext, name('easy'), name('medium')))
        stub.game = null
        await tryNext.trigger('click')
        await playing(wrapper)
        expect(useProgress().progress.value.diff?.tiered).toBe('medium')
        expect((stub.game as TieredGame).difficulty).toBe('medium')
        expect(wrapper.find('[data-testid="result"]').exists()).toBe(false)
      })

      it('shows the Beast dialog with only Done on mastering Beast', async () => {
        const wrapper = await mountShell(tieredGame)
        await choose(wrapper, 'Beast')
        await startGame(wrapper)
        await finishWith(wrapper, beastBands[beastBands.length - 1]!.at!)
        const d = dialog(wrapper)
        expect(d.text()).toContain(copy.levelUp.topTitle)
        expect(d.findAll('button').map(b => b.text().trim())).toEqual([copy.levelUp.done])
        await buttonNamed(d, 'Done').trigger('click')
        await flushPromises()
        expect(hasDialog(wrapper)).toBe(false)
        expect(wrapper.find('[data-testid="result"]').exists()).toBe(true)
        expect(wrapper.find('[data-testid="try-next"]').exists()).toBe(false)
        expect(useProgress().progress.value.diff?.tiered).toBe('beast')
      })

      it('shows no Try button on a later mastery of Beast', async () => {
        localStorage.setItem('bgarden', JSON.stringify({ mastered: ['tiered@beast'], diff: { tiered: 'beast' } }))
        const wrapper = await mountShell(tieredGame)
        await startGame(wrapper)
        await finishWith(wrapper, beastBands[beastBands.length - 1]!.at!)
        expect(wrapper.find('[data-testid="result"]').exists()).toBe(true)
        expect(hasDialog(wrapper)).toBe(false)
        expect(wrapper.find('[data-testid="try-next"]').exists()).toBe(false)
      })

      it('shows neither the dialog nor Try on a result that does not master', async () => {
        const wrapper = await mountShell(tieredGame)
        await choose(wrapper, 'Easy')
        await startGame(wrapper)
        await finishWith(wrapper, easyBands[1]!.at!)
        expect(wrapper.find('[data-testid="result"]').exists()).toBe(true)
        expect(hasDialog(wrapper)).toBe(false)
        expect(wrapper.find('[data-testid="try-next"]').exists()).toBe(false)
        expect(useProgress().progress.value.mastered ?? []).not.toContain('tiered@easy')
      })
    })
  })
})

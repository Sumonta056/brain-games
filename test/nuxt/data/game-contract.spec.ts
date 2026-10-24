import { describe, expect, it } from 'vitest'
import type { GameDef } from '~~/shared/types/game'
import categories from '~/data/categories.json'
import { gameComponents } from '~/components/games/registry'

const modules = import.meta.glob<GameDef>('~/data/games/*.json', { eager: true, import: 'default' })
const iconFiles = import.meta.glob<string>('~/assets/icons/games/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true
})
const iconFile = (name: string) =>
  Object.entries(iconFiles).find(([path]) => path.endsWith(`/icons/games/${name}.svg`))?.[1]
const games = Object.entries(modules).map(([path, game]) => ({ file: path.split('/').pop()!, game }))

const LEVELS = ['Easy', 'Medium', 'Hard']
const SIZES = ['normal', 'wide', 'tall', 'big']
const STRING_FIELDS = ['name', 'blurb', 'trains', 'unit', 'science', 'tip'] as const

describe('game JSON contract (functional-requirements §4)', () => {
  it('has 15 games with unique ids and orders', () => {
    expect(games).toHaveLength(15)
    expect(new Set(games.map(g => g.game.id)).size).toBe(15)
    expect(new Set(games.map(g => g.game.order)).size).toBe(15)
  })

  describe.each(games)('$file', ({ file, game }) => {
    it('file name matches the id', () => {
      expect(file).toBe(`${game.id}.json`)
    })

    it('has valid enum fields', () => {
      expect(Object.keys(categories)).toContain(game.category)
      expect(LEVELS).toContain(game.level)
      expect(SIZES).toContain(game.size)
      expect(typeof game.lowerIsBetter).toBe('boolean')
      expect(game.durationSec === null || game.durationSec > 0).toBe(true)
    })

    it('has non-empty copy', () => {
      for (const key of STRING_FIELDS) expect(game[key].trim(), key).not.toBe('')
    })

    it('has 3 steps and 3 demo frames', () => {
      expect(game.steps).toHaveLength(3)
      expect(game.demo).toHaveLength(3)
      game.demo.forEach(f => {
        expect(f.scene.trim()).not.toBe('')
        expect(f.caption.trim()).not.toBe('')
      })
    })

    it('orders bands from lowest to highest performance', () => {
      expect(game.bands.length).toBeGreaterThanOrEqual(2)
      const at = game.bands.map(b => b.at)
      if (game.lowerIsBetter) {
        expect(at[0]).toBeNull()
        const rest = at.slice(1) as number[]
        rest.forEach((v, i) => i && expect(v).toBeLessThan(rest[i - 1]!))
      } else {
        expect(at[0]).toBe(0)
        at.forEach((v, i) => i && expect(v).toBeGreaterThan(at[i - 1]!))
      }
      game.bands.forEach(b => expect(b.label.trim()).not.toBe(''))
    })

    it('names its icon file by the game id', () => {
      expect(typeof game.icon).toBe('string')
      expect(game.icon).toBe(game.id)
    })

    it('has a 48×48 icon file that uses currentColor', () => {
      const svg = iconFile(String(game.icon))
      expect(svg, `app/assets/icons/games/${game.icon}.svg`).toBeDefined()
      expect(svg).toMatch(/^\s*<svg[\s>]/)
      expect(svg).toContain('viewBox="0 0 48 48"')
      expect(svg).toContain('currentColor')
    })

    it('has an icon file with no scripts or event handlers', () => {
      const svg = iconFile(String(game.icon))
      expect(svg).toBeDefined()
      expect(svg).not.toMatch(/<script/i)
      expect(svg).not.toMatch(/\son[a-z]+\s*=/i)
    })

    it('keeps no inline svg markup in the JSON', () => {
      const keys: string[] = []
      JSON.stringify(game, (key, value) => (keys.push(key), value))
      expect(keys).not.toContain('svg')
    })
  })

  it('registers ComingSoon as the fallback component', () => {
    expect(gameComponents.ComingSoon).toBeDefined()
  })

  it('registers only components that a game JSON names, plus ComingSoon', () => {
    const named = new Set(games.map(g => g.game.component))
    for (const key of Object.keys(gameComponents)) {
      if (key !== 'ComingSoon') expect(named, key).toContain(key)
    }
  })

  it('registers the ported games under their JSON component name', () => {
    for (const id of ['math', 'reaction', 'breath']) {
      const game = games.find(g => g.game.id === id)!.game
      expect(gameComponents[game.component], game.component).toBeDefined()
    }
  })

  it('loads the matching component file for each registered name', async () => {
    for (const [key, comp] of Object.entries(gameComponents)) {
      const loaded = await (comp as unknown as { __asyncLoader: () => Promise<{ __name?: string }> }).__asyncLoader()
      expect(loaded.__name, key).toBe(key)
    }
  })
})

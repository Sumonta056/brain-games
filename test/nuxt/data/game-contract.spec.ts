import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
const tokensCss = readFileSync(resolve(process.cwd(), 'app/assets/css/tokens.css'), 'utf8')
const wordlistPath = (letter: string) => resolve(process.cwd(), `app/data/wordlists/${letter}.txt`)
const wordlistLines = (letter: string) =>
  existsSync(wordlistPath(letter))
    ? readFileSync(wordlistPath(letter), 'utf8')
        .split('\n')
        .filter(w => w !== '')
    : []
const games = Object.entries(modules).map(([path, game]) => ({ file: path.split('/').pop()!, game }))

type Content = Record<string, unknown>
const contentOf = (id: string) => (games.find(g => g.game.id === id)?.game as GameDef & { content?: Content })?.content
const isText = (v: unknown) => typeof v === 'string' && v.trim() !== ''
const isTextList = (v: unknown, min = 1) => Array.isArray(v) && v.length >= min && v.every(isText)

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

  it('has a one-sentence blurb that ends with a single full stop', () => {
    for (const { game } of games) {
      expect(game.blurb, game.id).toMatch(/[^.]\.$/)
      expect(game.blurb.slice(0, -1), game.id).not.toMatch(/[.!?]\s/)
    }
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

describe('game content (functional-requirements §4 content table)', () => {
  it('pairs has 8 distinct emojis', () => {
    const emojis = contentOf('pairs')?.emojis as string[]
    expect(isTextList(emojis)).toBe(true)
    expect(emojis).toHaveLength(8)
    expect(new Set(emojis).size).toBe(8)
  })

  it('words has distinct single capital start letters', () => {
    const letters = contentOf('words')?.letters as string[]
    expect(isTextList(letters)).toBe(true)
    letters.forEach(l => expect(l).toMatch(/^[A-Z]$/))
    expect(new Set(letters).size).toBe(letters.length)
  })

  it('has a word list for every words start letter', () => {
    const letters = contentOf('words')?.letters as string[]
    letters.forEach(l => {
      const file = wordlistPath(l.toLowerCase())
      expect(existsSync(file), file).toBe(true)
      expect(wordlistLines(l.toLowerCase()).length, file).toBeGreaterThan(0)
    })
  })

  it.each([...'abcdefghijklmnopqrstuvwxyz'])('word list %s.txt holds lowercase words starting with %s', letter => {
    const file = wordlistPath(letter)
    expect(existsSync(file), file).toBe(true)
    const lines = wordlistLines(letter)
    expect(lines.length).toBeGreaterThan(0)
    expect(lines.filter(w => !/^[a-z']+$/.test(w))).toEqual([])
    expect(lines.filter(w => !w.startsWith(letter))).toEqual([])
  })

  it('ships the word list copyright notice', () => {
    for (const path of ['app/data/wordlists/COPYRIGHT', 'public/licenses/scowl.txt']) {
      const file = resolve(process.cwd(), path)
      expect(existsSync(file), path).toBe(true)
      expect(readFileSync(file, 'utf8').trim(), path).not.toBe('')
    }
  })

  it('category has distinct non-empty categories', () => {
    const categories = contentOf('category')?.categories as string[]
    expect(isTextList(categories)).toBe(true)
    expect(new Set(categories).size).toBe(categories.length)
  })

  it('backward has 5 pools of lowercase words, shortest words first', () => {
    const pools = contentOf('backward')?.pools as string[][]
    expect(Array.isArray(pools)).toBe(true)
    expect(pools).toHaveLength(5)
    pools.forEach(pool => {
      expect(isTextList(pool)).toBe(true)
      pool.forEach(w => expect(w).toMatch(/^[a-z]+$/))
    })
    for (let i = 1; i < pools.length; i++) {
      const prevLongest = Math.max(...pools[i - 1]!.map(w => w.length))
      const shortest = Math.min(...pools[i]!.map(w => w.length))
      expect(shortest).toBeGreaterThanOrEqual(prevLongest)
    }
  })

  it('nback has at least 2 distinct single capital letters', () => {
    const letters = contentOf('nback')?.letters as string[]
    expect(isTextList(letters, 2)).toBe(true)
    letters.forEach(l => expect(l).toMatch(/^[A-Z]$/))
    expect(new Set(letters).size).toBe(letters.length)
  })

  it('stroop has 4 named colours whose tokens exist in tokens.css', () => {
    const colours = contentOf('stroop')?.colours as { name: string; token: string }[]
    expect(Array.isArray(colours)).toBe(true)
    expect(colours).toHaveLength(4)
    expect(tokensCss).toMatch(/--accent\s*:/)
    colours.forEach(c => {
      expect(isText(c.name)).toBe(true)
      expect(isText(c.token)).toBe(true)
      expect(tokensCss, `--${c.token}`).toMatch(new RegExp(`--${c.token}\\s*:`))
    })
    expect(new Set(colours.map(c => c.name)).size).toBe(4)
    expect(new Set(colours.map(c => c.token)).size).toBe(4)
  })

  it('hand has at least 4 tasks', () => {
    expect(isTextList(contentOf('hand')?.tasks, 4)).toBe(true)
  })
})

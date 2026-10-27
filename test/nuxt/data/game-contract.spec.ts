import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Band, GameDef } from '~~/shared/types/game'
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

function expectOrderedBands(bands: Band[], lowerIsBetter: boolean) {
  expect(bands.length).toBeGreaterThanOrEqual(2)
  const at = bands.map(b => b.at)
  if (lowerIsBetter) {
    expect(at[0]).toBeNull()
    const rest = at.slice(1) as number[]
    rest.forEach((v, i) => i && expect(v).toBeLessThan(rest[i - 1]!))
  } else {
    expect(at[0]).toBe(0)
    at.forEach((v, i) => i && expect(v).toBeGreaterThan(at[i - 1]!))
  }
  bands.forEach(b => expect(b.label.trim()).not.toBe(''))
}

type DifficultyBlock = { settings?: Record<string, unknown>; durationSec?: number; bands?: Band[]; science?: string }
type WithDifficulties = GameDef & { difficulties?: Record<string, DifficultyBlock> }
const tiered = games.filter(g => (g.game as WithDifficulties).difficulties)
const gameById = (id: string) => games.find(g => g.game.id === id)!.game as WithDifficulties

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
      expectOrderedBands(game.bands, game.lowerIsBetter)
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
  it('pairs has at least 12 distinct emojis, enough for 10 pairs on hard', () => {
    const emojis = contentOf('pairs')?.emojis as string[]
    expect(isTextList(emojis)).toBe(true)
    expect(emojis.length).toBeGreaterThanOrEqual(12)
    expect(new Set(emojis).size).toBe(emojis.length)
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

describe('game difficulties (functional-requirements §3.1 and §4)', () => {
  it.each([
    ['pairs', 'pairs', [6, 8, 10, 12]],
    ['pairs', 'flipMs', [800, 800, 800, 500]],
    ['schulte', 'size', [4, 5, 6, 6]],
    ['schulte', 'penaltySec', [0, 0, 0, 2]],
    ['nback', 'n', [1, 2, 3, 4]],
    ['odd', 'start', [0, 0, 3, 9]],
    ['odd', 'deltaStep', [0.4, 0.8, 1.2, 1.6]],
    ['math', 'minLevel', [0, 0, 2, 3]],
    ['math', 'maxLevel', [0, 3, 3, 3]],
    ['backward', 'minPool', [0, 0, 2, 4]],
    ['backward', 'maxPool', [2, 4, 4, 4]],
    ['backward', 'showMs', [1800, 1800, 1800, 1000]],
    ['backward', 'letterMs', [220, 220, 220, 150]],
    ['digits', 'start', [3, 3, 5, 7]],
    ['digits', 'stepMs', [1100, 900, 700, 500]],
    ['sequence', 'stepMs', [800, 650, 450, 300]]
  ] as const)('%s has easy, medium, hard and beast %s settings', (id, key, values) => {
    const d = gameById(id).difficulties
    expect(d, `${id}.difficulties`).toBeDefined()
    expect(d!.easy?.settings?.[key]).toBe(values[0])
    expect(d!.medium?.settings?.[key]).toBe(values[1])
    expect(d!.hard?.settings?.[key]).toBe(values[2])
    expect(d!.beast?.settings?.[key]).toBe(values[3])
  })

  it.each([
    ['serial7', 90, 60, 40, 25],
    ['words', 90, 60, 40, 25],
    ['category', 90, 60, 40, 25],
    ['stroop', 90, 45, 30, 25]
  ] as const)('%s gives easy %is, medium %is, hard %is and beast %is', (id, easy, medium, hard, beast) => {
    const game = gameById(id)
    expect(game.difficulties?.easy?.durationSec).toBe(easy)
    expect(game.durationSec).toBe(medium)
    expect(game.difficulties?.medium?.durationSec).toBeUndefined()
    expect(game.difficulties?.hard?.durationSec).toBe(hard)
    expect(game.difficulties?.beast?.durationSec).toBe(beast)
  })

  it.each(['reaction', 'breath', 'hand'])('%s has no difficulties', id => {
    expect(gameById(id).difficulties).toBeUndefined()
  })

  it('names the nback game N-back', () => {
    expect(gameById('nback').name).toBe('N-back')
  })

  it('gives every game except reaction, breath and hand difficulties', () => {
    expect(tiered.map(g => g.game.id).sort()).toEqual(
      games
        .map(g => g.game.id)
        .filter(id => !['reaction', 'breath', 'hand'].includes(id))
        .sort()
    )
  })

  describe.each(tiered)('$file difficulties', ({ game }) => {
    const d = (game as WithDifficulties).difficulties!

    it('has exactly easy, medium, hard and beast', () => {
      expect(Object.keys(d).sort()).toEqual(['beast', 'easy', 'hard', 'medium'])
    })

    it('gives each difficulty numeric settings', () => {
      for (const key of ['easy', 'medium', 'hard', 'beast']) {
        const settings = d[key]!.settings
        expect(settings, key).toBeDefined()
        Object.values(settings!).forEach(v => expect(typeof v, key).toBe('number'))
      }
    })

    it('gives easy, hard and beast a time limit only in a timed game', () => {
      for (const key of ['easy', 'hard', 'beast']) {
        if (game.durationSec === null) expect(d[key]!.durationSec, key).toBeUndefined()
        else if (d[key]!.durationSec !== undefined) expect(d[key]!.durationSec, key).toBeGreaterThan(0)
      }
    })

    it('uses the same setting names in every difficulty', () => {
      const names = Object.keys(d.medium!.settings!).sort()
      expect(Object.keys(d.easy!.settings!).sort()).toEqual(names)
      expect(Object.keys(d.hard!.settings!).sort()).toEqual(names)
      expect(Object.keys(d.beast!.settings!).sort()).toEqual(names)
    })

    it('keeps medium on the top-level bands and science', () => {
      expect(d.medium!.bands).toBeUndefined()
      expect(d.medium!.science).toBeUndefined()
    })

    it.each(['easy', 'hard', 'beast'])('orders the %s bands like the top-level bands', key => {
      expect(d[key]!.bands, `${key}.bands`).toBeDefined()
      expectOrderedBands(d[key]!.bands!, game.lowerIsBetter)
    })

    it.each(['easy', 'hard', 'beast'])('says the %s bands are a Brain Games guide', key => {
      expect(isText(d[key]!.science)).toBe(true)
      expect(d[key]!.science).toContain('Brain Games guide')
    })
  })
})

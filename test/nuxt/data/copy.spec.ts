import { describe, expect, it } from 'vitest'
import type { GameDef } from '~~/shared/types/game'
import copy from '~/data/copy.json'

const gameIds = Object.values(import.meta.glob<GameDef>('~/data/games/*.json', { eager: true, import: 'default' })).map(
  g => g.id
)

const sources = import.meta.glob<string>(
  [
    '~/components/home/HomeHero.vue',
    '~/components/home/MoodCheck.vue',
    '~/pages/profile.vue',
    '~/composables/useCheer.ts'
  ],
  { query: '?raw', import: 'default', eager: true }
)

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(strings)
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings)
  return []
}

describe('copy.json contract', () => {
  it('has exactly the seven copy groups', () => {
    expect(Object.keys(copy).sort()).toEqual([
      'affirmations',
      'avatars',
      'difficulty',
      'greetings',
      'loading',
      'moods',
      'praise'
    ])
  })

  it('names the difficulty group and the three difficulties', () => {
    expect(copy.difficulty).toEqual({ label: 'Difficulty', easy: 'Easy', medium: 'Medium', hard: 'Hard' })
  })

  it('has a non-empty loading line', () => {
    expect((copy as { loading?: unknown }).loading).toEqual(expect.any(String))
    expect(String((copy as { loading?: unknown }).loading).trim()).not.toBe('')
  })

  it('has greetings sorted by hour, ending before 24, with text', () => {
    const before = copy.greetings.map(g => g.before)
    expect(before.length).toBeGreaterThan(0)
    before.forEach((b, i) => i && expect(b).toBeGreaterThan(before[i - 1]!))
    expect(before.at(-1)).toBe(24)
    copy.greetings.forEach(g => expect(g.text.trim()).not.toBe(''))
  })

  it('greets by the hour limits from the design', () => {
    expect(copy.greetings).toEqual([
      { before: 5, text: 'Still awake' },
      { before: 12, text: 'Good morning' },
      { before: 17, text: 'Good afternoon' },
      { before: 24, text: 'Good evening' }
    ])
  })

  it('suggests the games from functional-requirements §2.2 for each mood', () => {
    expect(copy.moods.map(m => [m.label, m.ids])).toEqual([
      ['Calm', ['breath', 'pairs', 'odd']],
      ['Tired', ['breath', 'sequence', 'category']],
      ['Stressed', ['breath', 'odd', 'hand']],
      ['Energised', ['reaction', 'math', 'stroop']]
    ])
  })

  it('has 7 non-empty affirmations', () => {
    expect(copy.affirmations).toHaveLength(7)
    copy.affirmations.forEach(a => expect(a.trim()).not.toBe(''))
  })

  it('has 4 moods, each with an emoji, label, message and 3 real game ids', () => {
    expect(copy.moods).toHaveLength(4)
    for (const m of copy.moods) {
      expect(m.emoji.trim()).not.toBe('')
      expect(m.label.trim()).not.toBe('')
      expect(m.msg.trim()).not.toBe('')
      expect(m.ids).toHaveLength(3)
      m.ids.forEach(id => expect(gameIds, id).toContain(id))
    }
    expect(new Set(copy.moods.map(m => m.label)).size).toBe(4)
  })

  it('has 10 unique avatars', () => {
    expect(copy.avatars).toHaveLength(10)
    expect(new Set(copy.avatars).size).toBe(10)
    copy.avatars.forEach(a => expect(a.trim()).not.toBe(''))
  })

  it('has non-empty praise strings', () => {
    expect(copy.praise.length).toBeGreaterThan(0)
    copy.praise.forEach(p => {
      expect(typeof p).toBe('string')
      expect(p.trim()).not.toBe('')
    })
  })

  it('stays positive: no "Wrong" or "Fail" anywhere', () => {
    for (const s of strings(copy)) expect(s).not.toMatch(/wrong|fail/i)
  })
})

describe('copy is not hard-coded in components', () => {
  it('finds all four sources', () => {
    expect(Object.keys(sources)).toHaveLength(4)
  })

  it.each([
    ['HomeHero.vue', 'Mistakes are just your brain finding the edges'],
    ['HomeHero.vue', 'Good afternoon'],
    ['MoodCheck.vue', 'Keep the peace:'],
    ['MoodCheck.vue', 'Use that spark:'],
    ['profile.vue', '🦉'],
    ['profile.vue', '🍀'],
    ['useCheer.ts', 'Brain on fire'],
    ['useCheer.ts', 'On a roll!']
  ])('%s does not contain %s', (file, literal) => {
    const source = Object.entries(sources).find(([path]) => path.endsWith(`/${file}`))?.[1]
    expect(source, file).toBeDefined()
    expect(source).not.toContain(literal)
  })
})

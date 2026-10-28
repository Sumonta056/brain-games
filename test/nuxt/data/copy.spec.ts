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
    '~/composables/useCheer.ts',
    '~/components/profile/BrainCard.vue',
    '~/components/profile/ProfileStats.vue',
    '~/components/profile/FavouriteGame.vue',
    '~/components/profile/MonthCard.vue',
    '~/components/profile/GrowthCard.vue',
    '~/components/app/GuestNotice.vue',
    '~/components/profile/AccountCard.vue',
    '~/pages/privacy.vue',
    '~/composables/useAuth.ts',
    '~/components/app/AccountMenu.vue',
    '~/components/app/AccountPanel.vue',
    '~/components/app/AppNav.vue'
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
  it('has exactly the ten copy groups', () => {
    expect(Object.keys(copy).sort()).toEqual([
      'account',
      'affirmations',
      'avatars',
      'difficulty',
      'greetings',
      'levelUp',
      'loading',
      'moods',
      'praise',
      'profile'
    ])
  })

  it('has the level-up copy with its placeholders', () => {
    const l = copy.levelUp
    expect(l.title).toContain('{level}')
    expect(l.ask).toContain('{next}')
    expect(l.play).toContain('{next}')
    expect(l.stay).toContain('{level}')
    expect(l.tryNext).toContain('{next}')
    for (const v of Object.values(l)) expect(v.trim()).not.toBe('')
    expect(l.emoji).toBeTruthy()
    expect(l.topEmoji).toBeTruthy()
  })

  it('names the difficulty group and the four difficulties', () => {
    expect(copy.difficulty).toEqual({
      label: 'Difficulty',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      beast: 'Beast'
    })
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

  it('has the profile copy with its placeholders', () => {
    const p = copy.profile
    expect(p.brainCaption).toContain('{lit}')
    expect(p.brainCaption).toContain('{total}')
    expect(p.brainCaption).toContain('{played}')
    expect(p.brainNext).toContain('{n}')
    expect(p.stats.best).toContain('{n}')
    expect(p.stats.tried).toContain('{n}')
    expect(p.stats.tried).toContain('{total}')
    expect(p.stats.monthValue).toContain('{n}')
    expect(p.stats.mastered).toContain('{n}')
    expect(p.favouriteCount).toContain('{n}')
    expect(p.growthGain).toContain('{n}')
    expect(p.growthGain).toContain('{month}')
    expect(p.weekdays).toHaveLength(7)
    for (const s of strings(p)) expect(s.trim()).not.toBe('')
  })

  it('has brain stages from 0 upward, ending where every neuron is lit', () => {
    const at = copy.profile.brainStages.map(s => s.at)
    expect(at[0]).toBe(0)
    at.forEach((a, i) => i && expect(a).toBeGreaterThan(at[i - 1]!))
    expect(at.at(-1)).toBe(142)
  })

  it('has the account copy with its placeholder, three benefits and the privacy sections', () => {
    const a = copy.account
    expect(a.signedInAs).toContain('{name}')
    expect(a.benefits).toHaveLength(3)
    expect(a.privacy.sections.length).toBeGreaterThan(0)
    for (const section of a.privacy.sections) {
      expect(section.heading.trim()).not.toBe('')
      expect(section.body.trim()).not.toBe('')
    }
    for (const s of strings(a)) expect(s.trim()).not.toBe('')
  })

  it('has the nav account copy for the account chip and panel', () => {
    const n = copy.account.nav
    expect(Object.keys(n).sort()).toEqual([
      'chipError',
      'chipGuest',
      'chipLoading',
      'chipSignedIn',
      'guest',
      'guestBody',
      'guestTitle',
      'menuLabel',
      'profile',
      'signInLabel',
      'synced'
    ])
    expect(n.chipSignedIn).toContain('{name}')
    expect(n.chipError).toContain('{name}')
    for (const v of Object.values(n)) expect(v.trim()).not.toBe('')
  })

  it('stays positive: no "Wrong" or "Fail" anywhere', () => {
    for (const s of strings(copy)) expect(s).not.toMatch(/wrong|fail/i)
  })
})

describe('copy is not hard-coded in components', () => {
  it('finds all sixteen sources', () => {
    expect(Object.keys(sources)).toHaveLength(16)
  })

  it.each([
    ['HomeHero.vue', 'Mistakes are just your brain finding the edges'],
    ['HomeHero.vue', 'Good afternoon'],
    ['MoodCheck.vue', 'Keep the peace:'],
    ['MoodCheck.vue', 'Use that spark:'],
    ['profile.vue', '🦉'],
    ['profile.vue', '🍀'],
    ['useCheer.ts', 'Brain on fire'],
    ['useCheer.ts', 'On a roll!'],
    ['BrainCard.vue', 'neurons lit by'],
    ['BrainCard.vue', 'A quiet seed'],
    ['BrainCard.vue', 'Every neuron is lit'],
    ['ProfileStats.vue', 'Day streak'],
    ['ProfileStats.vue', 'games tried'],
    ['ProfileStats.vue', 'levels mastered'],
    ['FavouriteGame.vue', 'Favourite game'],
    ['MonthCard.vue', 'Previous month'],
    ['MonthCard.vue', 'rest day'],
    ['MonthCard.vue', 'points grown'],
    ['GrowthCard.vue', 'Growth points'],
    ['GrowthCard.vue', 'Your growth shows'],
    ['GuestNotice.vue', 'You are playing as a guest'],
    ['GuestNotice.vue', 'Close the guest notice'],
    ['AccountCard.vue', 'Sign in with Google'],
    ['AccountCard.vue', 'Delete my cloud data'],
    ['AccountCard.vue', 'How we use your data'],
    ['privacy.vue', 'What we store'],
    ['privacy.vue', 'Back to your profile'],
    ['profile.vue', 'Clear your profile and all scores'],
    ['useAuth.ts', 'Allow the popup and try again'],
    ['useAuth.ts', 'Sign-in did not work'],
    ['AccountMenu.vue', 'Playing as a guest'],
    ['AccountMenu.vue', 'Sign in with Google'],
    ['AccountMenu.vue', 'Garden saved'],
    ['AccountPanel.vue', 'Playing as a guest'],
    ['AccountPanel.vue', 'Sign in with Google'],
    ['AccountPanel.vue', 'Garden saved'],
    ['AppNav.vue', 'Open your profile. Signed in']
  ])('%s does not contain %s', (file, literal) => {
    const source = Object.entries(sources).find(([path]) => path.endsWith(`/${file}`))?.[1]
    expect(source, file).toBeDefined()
    expect(source).not.toContain(literal)
  })
})

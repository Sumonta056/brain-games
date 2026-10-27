import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, bestKey, setting, topBest, withDifficulty } from '~/utils/difficulty'
import {
  easyBands,
  easyScience,
  hardBands,
  hardScience,
  mathGame,
  reactionGame,
  tieredGame,
  type TieredGame
} from '../fixtures'

describe('utils/difficulty', () => {
  it('lists the three difficulties from easy to hard', () => {
    expect([...DIFFICULTIES]).toEqual(['easy', 'medium', 'hard'])
  })

  describe('withDifficulty', () => {
    it('uses the easy bands, science and settings for easy', () => {
      const g = withDifficulty(tieredGame, 'easy') as TieredGame
      expect(g.bands).toEqual(easyBands)
      expect(g.science).toBe(easyScience)
      expect(g.settings).toEqual({ n: 1 })
      expect(g.difficulty).toBe('easy')
    })

    it('uses the hard bands, science and settings for hard', () => {
      const g = withDifficulty(tieredGame, 'hard') as TieredGame
      expect(g.bands).toEqual(hardBands)
      expect(g.science).toBe(hardScience)
      expect(g.settings).toEqual({ n: 3 })
      expect(g.difficulty).toBe('hard')
    })

    it('keeps the top-level bands and science for medium', () => {
      const g = withDifficulty(tieredGame, 'medium') as TieredGame
      expect(g.bands).toEqual(mathGame.bands)
      expect(g.science).toBe(mathGame.science)
      expect(g.settings).toEqual({ n: 2 })
      expect(g.difficulty).toBe('medium')
    })

    it('keeps the rest of the game the same', () => {
      const g = withDifficulty(tieredGame, 'hard')
      expect(g.id).toBe('tiered')
      expect(g.name).toBe(mathGame.name)
      expect(g.lowerIsBetter).toBe(mathGame.lowerIsBetter)
      expect(g.steps).toEqual(mathGame.steps)
    })

    it('does not change the game it is given', () => {
      const before = JSON.stringify(tieredGame)
      withDifficulty(tieredGame, 'hard')
      withDifficulty(tieredGame, 'easy')
      expect(JSON.stringify(tieredGame)).toBe(before)
      expect(tieredGame.difficulty).toBeUndefined()
      expect(tieredGame.settings).toBeUndefined()
    })

    it('returns a game without difficulties unchanged', () => {
      const g = withDifficulty(reactionGame, 'hard') as TieredGame
      expect(g).toEqual(reactionGame)
      expect(g.difficulty).toBeUndefined()
    })
  })

  describe('bestKey', () => {
    it('uses the plain id for a game without a difficulty', () => {
      expect(bestKey(reactionGame)).toBe('reaction')
    })

    it('uses the plain id for medium', () => {
      expect(bestKey(withDifficulty(tieredGame, 'medium'))).toBe('tiered')
    })

    it('adds @easy and @hard for easy and hard', () => {
      expect(bestKey(withDifficulty(tieredGame, 'easy'))).toBe('tiered@easy')
      expect(bestKey(withDifficulty(tieredGame, 'hard'))).toBe('tiered@hard')
    })
  })

  describe('topBest', () => {
    it('picks the best of the hardest difficulty played', () => {
      const top = topBest(tieredGame, { tiered: 12, 'tiered@hard': 5, 'tiered@easy': 30 })
      expect(top?.score).toBe(5)
      expect(top?.game.difficulty).toBe('hard')
      expect(top?.game.bands).toEqual(hardBands)
    })

    it('falls back to medium, then easy', () => {
      expect(topBest(tieredGame, { tiered: 9, 'tiered@easy': 3 })?.game.difficulty).toBe('medium')
      expect(topBest(tieredGame, { 'tiered@easy': 3 })).toMatchObject({ score: 3, game: { difficulty: 'easy' } })
    })

    it('returns null when nothing was played', () => {
      expect(topBest(tieredGame, { math: 4 })).toBeNull()
    })

    it('uses the plain best for a game without difficulties', () => {
      expect(topBest(reactionGame, { reaction: 240 })).toEqual({ game: reactionGame, score: 240 })
    })
  })

  describe('setting', () => {
    it('reads a setting of the resolved game', () => {
      expect(setting(withDifficulty(tieredGame, 'easy'), 'n')).toBe(1)
      expect(setting(withDifficulty(tieredGame, 'hard'), 'n')).toBe(3)
    })

    it('throws when the setting is missing', () => {
      expect(() => setting(withDifficulty(tieredGame, 'hard'), 'size')).toThrow(Error)
    })

    it('throws when the game has no settings', () => {
      expect(() => setting(reactionGame, 'n')).toThrow(Error)
    })
  })
})

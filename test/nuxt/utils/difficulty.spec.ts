import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, bestKey, isMastery, nextDifficulty, setting, topBest, withDifficulty } from '~/utils/difficulty'
import { bandIndex } from '~/utils/bands'
import {
  easyBands,
  easyScience,
  hardBands,
  hardScience,
  beastBands,
  beastScience,
  makeGame,
  mathGame,
  reactionGame,
  tieredAs,
  tieredGame,
  type TieredGame
} from '../fixtures'

describe('utils/difficulty', () => {
  it('lists the four difficulties from easy to beast', () => {
    expect([...DIFFICULTIES]).toEqual(['easy', 'medium', 'hard', 'beast'])
  })

  describe('withDifficulty', () => {
    it('uses beast bands, science and settings and keys the best as id@beast', () => {
      const g = withDifficulty(tieredGame, 'beast')
      expect(g.settings).toEqual({ n: 4 })
      expect(g.bands).toEqual(beastBands)
      expect(g.science).toBe(beastScience)
      expect(bestKey(g)).toBe('tiered@beast')
    })

    it('takes durationSec from the difficulty, else keeps the top-level one', () => {
      const timed: TieredGame = {
        ...tieredGame,
        durationSec: 60,
        difficulties: {
          ...tieredGame.difficulties!,
          easy: { ...tieredGame.difficulties!.easy, durationSec: 90 },
          hard: { ...tieredGame.difficulties!.hard, durationSec: 30 }
        }
      }
      expect(withDifficulty(timed, 'easy').durationSec).toBe(90)
      expect(withDifficulty(timed, 'medium').durationSec).toBe(60)
      expect(withDifficulty(timed, 'hard').durationSec).toBe(30)
      expect(withDifficulty(tieredGame, 'hard').durationSec).toBe(tieredGame.durationSec)
    })

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
    it('picks a beast best over every other difficulty', () => {
      const top = topBest(tieredGame, { tiered: 12, 'tiered@hard': 5, 'tiered@beast': 1 })
      expect(top).toMatchObject({ score: 1, game: { difficulty: 'beast' } })
    })

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

  describe('nextDifficulty (functional-requirements §3.3)', () => {
    it('goes from easy to medium', () => {
      expect(nextDifficulty('easy')).toBe('medium')
    })

    it('goes from medium to hard', () => {
      expect(nextDifficulty('medium')).toBe('hard')
    })

    it('goes from hard to beast', () => {
      expect(nextDifficulty('hard')).toBe('beast')
    })

    it('has nothing after beast', () => {
      expect(nextDifficulty('beast')).toBeNull()
    })
  })

  describe('isMastery (functional-requirements §3.3)', () => {
    it('masters only with the top band by default', () => {
      const hard = tieredAs('hard')
      expect(isMastery(hard, 2)).toBe(true)
      expect(isMastery(hard, 1)).toBe(false)
      expect(isMastery(hard, 0)).toBe(false)
    })

    it('uses the bands of the difficulty, so medium needs the top of five bands', () => {
      const medium = tieredAs('medium')
      expect(isMastery(medium, 4)).toBe(true)
      expect(isMastery(medium, 3)).toBe(false)
      expect(isMastery(medium, 2)).toBe(false)
    })

    it('masters with the top two bands when mastery is 2', () => {
      const easy = { ...tieredAs('easy'), mastery: 2 }
      expect(isMastery(easy, 2)).toBe(true)
      expect(isMastery(easy, 1)).toBe(true)
      expect(isMastery(easy, 0)).toBe(false)
    })

    it('masters with the best (lowest) scores when lower is better', () => {
      const game = { ...makeGame([null, 400, 300, 250], true), difficulty: 'hard' as const }
      expect(isMastery(game, bandIndex(game, 240))).toBe(true)
      expect(isMastery(game, bandIndex(game, 280))).toBe(false)
      expect(isMastery(game, bandIndex(game, 500))).toBe(false)
      expect(isMastery({ ...game, mastery: 2 }, bandIndex(game, 280))).toBe(true)
      expect(isMastery({ ...game, mastery: 2 }, bandIndex(game, 350))).toBe(false)
    })

    it('never masters a game without a difficulty', () => {
      expect(isMastery(reactionGame, reactionGame.bands.length - 1)).toBe(false)
      expect(isMastery(mathGame, mathGame.bands.length - 1)).toBe(false)
      expect(isMastery(tieredGame, tieredGame.bands.length - 1)).toBe(false)
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

import { describe, expect, it } from 'vitest'
import { bandIndex } from '~/utils/bands'
import { makeGame, mathGame, reactionGame } from '../fixtures'

describe('bandIndex', () => {
  describe('higher is better', () => {
    const game = makeGame([0, 6, 11])

    it.each([
      [0, 0],
      [5, 0],
      [6, 1],
      [10, 1],
      [11, 2],
      [99, 2]
    ])('score %i falls in band %i', (score, band) => {
      expect(bandIndex(game, score)).toBe(band)
    })
  })

  describe('lower is better', () => {
    const game = makeGame([null, 400, 300], true)

    it.each([
      [1000, 0],
      [401, 0],
      [400, 1],
      [301, 1],
      [300, 2],
      [120, 2]
    ])('score %i falls in band %i', (score, band) => {
      expect(bandIndex(game, score)).toBe(band)
    })
  })

  it('uses the real math bands', () => {
    expect(bandIndex(mathGame, 25)).toBe(mathGame.bands.length - 1)
    expect(bandIndex(mathGame, 0)).toBe(0)
  })

  it('uses the real reaction bands', () => {
    expect(bandIndex(reactionGame, 180)).toBe(reactionGame.bands.length - 1)
    expect(bandIndex(reactionGame, 900)).toBe(0)
  })
})

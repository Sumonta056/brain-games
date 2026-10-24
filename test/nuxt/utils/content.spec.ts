import { describe, expect, it } from 'vitest'
import type { GameDef } from '~~/shared/types/game'
import { gameContent } from '~/utils/content'
import nback from '~/data/games/nback.json'

const game = nback as unknown as GameDef

describe('gameContent', () => {
  it('returns the list from the game content', () => {
    expect(gameContent(game, 'letters')).toEqual(game.content!.letters)
  })

  it('throws a clear error when the list is missing', () => {
    expect(() => gameContent({ ...game, content: undefined }, 'letters')).toThrow('nback: content.letters is missing')
  })

  it('throws when the list is empty', () => {
    expect(() => gameContent({ ...game, content: { letters: [] } }, 'letters')).toThrow('content.letters')
  })
})

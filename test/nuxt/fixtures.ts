import type { Band, GameDef } from '~~/shared/types/game'
import math from '~/data/games/math.json'
import reaction from '~/data/games/reaction.json'
import breath from '~/data/games/breath.json'

export const mathGame = math as GameDef
export const reactionGame = reaction as GameDef
export const breathGame = breath as GameDef

export function makeGame(bands: Band['at'][], lowerIsBetter = false): GameDef {
  return {
    ...mathGame,
    id: 'fixture',
    lowerIsBetter,
    bands: bands.map((at, i) => ({ at, range: '', label: `b${i}`, message: '' }))
  }
}

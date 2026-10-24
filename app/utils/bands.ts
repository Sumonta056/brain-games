import type { GameDef } from '~~/shared/types/game'

/** Index of the band a score falls in (0 = lowest performance). */
export function bandIndex(game: GameDef, score: number): number {
  let k = 0
  game.bands.forEach((b, i) => {
    const at = b.at ?? Infinity
    if (game.lowerIsBetter ? score <= at : score >= at) k = i
  })
  return k
}

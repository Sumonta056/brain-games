import type { Difficulty, GameDef } from '~~/shared/types/game'

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const satisfies readonly Difficulty[]

export function withDifficulty(game: GameDef, difficulty: Difficulty): GameDef {
  const def = game.difficulties?.[difficulty]
  if (!def) return game
  return {
    ...game,
    bands: def.bands ?? game.bands,
    science: def.science ?? game.science,
    settings: def.settings,
    durationSec: def.durationSec ?? game.durationSec,
    difficulty
  }
}

export function bestKey(game: GameDef): string {
  return !game.difficulty || game.difficulty === 'medium' ? game.id : `${game.id}@${game.difficulty}`
}

export function topBest(game: GameDef, best: Record<string, number>) {
  for (const d of [...DIFFICULTIES].reverse()) {
    const resolved = withDifficulty(game, d)
    const score = best[bestKey(resolved)]
    if (score != null) return { game: resolved, score }
  }
  return null
}

export function setting(game: GameDef, key: string): number {
  const value = game.settings?.[key]
  if (value == null) throw new Error(`${game.id}: setting ${key} is missing`)
  return value
}

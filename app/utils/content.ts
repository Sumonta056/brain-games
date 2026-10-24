import type { GameContent, GameDef } from '~~/shared/types/game'

export function gameContent<K extends keyof GameContent>(game: GameDef, key: K): NonNullable<GameContent[K]> {
  const value = game.content?.[key]
  if (!value?.length) throw new Error(`${game.id}: content.${key} is missing`)
  return value as NonNullable<GameContent[K]>
}

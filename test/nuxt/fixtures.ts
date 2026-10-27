import type { DOMWrapper } from '@vue/test-utils'
import type { Band, Difficulty, DifficultyDef, GameDef } from '~~/shared/types/game'
import math from '~/data/games/math.json'
import reaction from '~/data/games/reaction.json'
import breath from '~/data/games/breath.json'

export const mathGame = math as GameDef
export const reactionGame = reaction as GameDef
export const breathGame = breath as GameDef

export type Tier = Difficulty
export type TieredGame = GameDef & { difficulties?: Record<Tier, DifficultyDef> }

const band = (at: Band['at'], label: string): Band => ({ at, range: `${at}+`, label, message: `${label} message` })

export const easyBands: Band[] = [band(0, 'Easy start'), band(10, 'Easy steady'), band(20, 'Easy star')]
export const hardBands: Band[] = [band(0, 'Hard start'), band(4, 'Hard steady'), band(8, 'Hard star')]
export const easyScience = 'Easy bands are a Brain Games guide for the easy setting.'
export const hardScience = 'Hard bands are a Brain Games guide for the hard setting.'
export const beastBands: Band[] = [band(0, 'Beast start'), band(2, 'Beast steady'), band(4, 'Beast star')]
export const beastScience = 'Beast bands are a Brain Games guide for the beast setting.'

export const tieredGame: TieredGame = {
  ...mathGame,
  id: 'tiered',
  difficulties: {
    easy: { settings: { n: 1 }, bands: easyBands, science: easyScience },
    medium: { settings: { n: 2 } },
    hard: { settings: { n: 3 }, bands: hardBands, science: hardScience },
    beast: { settings: { n: 4 }, bands: beastBands, science: beastScience }
  }
}

export function resolvedGame(game: GameDef, difficulty: Tier, settings: Record<string, number>): TieredGame {
  return { ...game, difficulty, settings }
}

export function tieredAs(difficulty: Tier): TieredGame {
  const def = tieredGame.difficulties![difficulty]
  return {
    ...tieredGame,
    bands: def.bands ?? tieredGame.bands,
    science: def.science ?? tieredGame.science,
    settings: def.settings,
    difficulty
  }
}

export function makeGame(bands: Band['at'][], lowerIsBetter = false): GameDef {
  return {
    ...mathGame,
    id: 'fixture',
    lowerIsBetter,
    bands: bands.map((at, i) => ({ at, range: '', label: `b${i}`, message: '' }))
  }
}

type IconHost = {
  element: Element
  findAllComponents: (selector: { name: string }) => { element: Element; props: (key: string) => unknown }[]
}

export function iconNames(wrapper: IconHost, within?: string): string[] {
  const scope = within ? wrapper.element.querySelector(within) : wrapper.element
  if (!scope) throw new Error(`No element matches ${within}`)
  return wrapper
    .findAllComponents({ name: 'NuxtIcon' })
    .filter(c => scope.contains(c.element))
    .map(c => c.props('name') as string)
}

type ButtonHost = { findAll: (selector: string) => DOMWrapper<Element>[] }

export function buttonNamed(host: ButtonHost, text: string): DOMWrapper<Element> {
  const match = host.findAll('button').find(b => b.text().trim() === text)
  if (!match) throw new Error(`No button named ${text}`)
  return match
}

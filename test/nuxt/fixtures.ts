import type { DOMWrapper } from '@vue/test-utils'
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

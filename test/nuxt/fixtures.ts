import { ref } from 'vue'
import { vi } from 'vitest'
import type { DOMWrapper } from '@vue/test-utils'
import type { Band, Difficulty, DifficultyDef, GameDef, Progress } from '~~/shared/types/game'
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
  const scope = !within || wrapper.element.matches(within) ? wrapper.element : wrapper.element.querySelector(within)
  if (!scope) throw new Error(`No element matches ${within}`)
  return wrapper
    .findAllComponents({ name: 'NuxtIcon' })
    .filter(c => scope.contains(c.element))
    .map(c => c.props('name') as string)
}

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k]))
}

type ButtonHost = { findAll: (selector: string) => DOMWrapper<Element>[] }

export function buttonNamed(host: ButtonHost, text: string): DOMWrapper<Element> {
  const match = host.findAll('button').find(b => b.text().trim() === text)
  if (!match) throw new Error(`No button named ${text}`)
  return match
}

export function makeProgress(overrides: Partial<Progress> = {}): Progress {
  return { name: '', av: '🦉', best: {}, hist: [], days: [], xp: 0, theme: 'auto', ...overrides }
}

export interface FakeUser {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
}

export class FakeGoogleProvider {
  addScope = vi.fn()
  setCustomParameters = vi.fn()
}

export function createFirebaseFakes() {
  const app = { name: 'fake-app' }
  const auth = {
    currentUser: null as FakeUser | null,
    authStateReady: vi.fn(async () => {})
  }
  const db = { name: 'fake-db' }
  const store = new Map<string, unknown>()
  const docRef = (path: string) => ({ path, id: path.split('/').at(-1) })
  const fakes = {
    app,
    auth,
    db,
    store,
    initializeApp: vi.fn(() => app),
    getAuth: vi.fn(() => auth),
    initializeFirestore: vi.fn(() => db),
    getFirestore: vi.fn(() => db),
    persistentLocalCache: vi.fn(() => ({})),
    signInWithPopup: vi.fn(async (_auth: unknown, _provider: unknown) => ({ user: auth.currentUser })),
    signOut: vi.fn(async () => {
      auth.currentUser = null
    }),
    doc: vi.fn((_db: unknown, ...segments: string[]) => docRef(segments.join('/'))),
    getDoc: vi.fn(async (ref: { path: string }) => ({
      id: ref.path.split('/').at(-1),
      exists: () => store.has(ref.path),
      data: () => store.get(ref.path)
    })),
    setDoc: vi.fn(async (ref: { path: string }, data: unknown) => {
      store.set(ref.path, data)
    }),
    deleteDoc: vi.fn(async (ref: { path: string }) => {
      store.delete(ref.path)
    }),
    runTransaction: vi.fn()
  }
  fakes.runTransaction.mockImplementation(transact(fakes))
  return fakes
}

function transact(f: {
  getDoc: (ref: { path: string }) => Promise<unknown>
  setDoc: (ref: { path: string }, data: unknown) => Promise<void>
}) {
  return async (_db: unknown, fn: (tx: unknown) => Promise<unknown>) => {
    const writes: [{ path: string }, unknown][] = []
    const result = await fn({
      get: (ref: { path: string }) => f.getDoc(ref),
      set: (ref: { path: string }, data: unknown) => writes.push([ref, data])
    })
    for (const [ref, data] of writes) await f.setDoc(ref, data)
    return result
  }
}

export type FirebaseFakes = ReturnType<typeof createFirebaseFakes>

export function resetFirebaseFakes(fb: FirebaseFakes) {
  fb.auth.currentUser = null
  fb.store.clear()
  const fns = [
    fb.auth.authStateReady,
    fb.initializeApp,
    fb.getAuth,
    fb.initializeFirestore,
    fb.getFirestore,
    fb.persistentLocalCache,
    fb.signInWithPopup,
    fb.signOut,
    fb.doc,
    fb.getDoc,
    fb.setDoc,
    fb.deleteDoc,
    fb.runTransaction
  ]
  fns.forEach(f => f.mockClear())
  fb.runTransaction.mockImplementation(transact(fb))
}

export function authError(code: string) {
  return Object.assign(new Error(code), { code, name: 'FirebaseError' })
}

export const signedInUser = { uid: 'u1', name: 'Ana Lima', email: 'ana@example.com', photo: '' }

export const photoUser = { ...signedInUser, photo: 'https://example.com/ana.png' }

export function cloudSyncSpies() {
  return {
    status: ref<'' | 'sync' | 'deleteFailed'>(''),
    start: vi.fn(),
    signIn: vi.fn(async () => {}),
    save: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
    deleteCloud: vi.fn(async () => {})
  }
}

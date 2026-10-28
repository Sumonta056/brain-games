import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'

let env: RulesTestEnvironment

const garden = () => ({
  name: 'Ana',
  av: '🦉',
  best: { math: 12 },
  hist: [{ id: 'math', s: 12, d: '2026-10-28', t: 1 }],
  days: ['2026-10-28'],
  xp: 10,
  theme: 'auto',
  diff: { math: 'hard' },
  mastered: ['math@hard'],
  played: 1,
  xpDays: { '2026-10-28': 10 },
  updatedAt: 1,
  resetAt: 1
})

const as = (uid: string) => env.authenticatedContext(uid).firestore()

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-brain-games',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') }
  })
})
beforeEach(() => env.clearFirestore())
afterAll(() => env.cleanup())

describe('brainGames/{uid} rules', () => {
  it('lets the owner create, read, update and delete their garden', async () => {
    const ref = doc(as('ana'), 'brainGames', 'ana')
    await assertSucceeds(setDoc(ref, garden()))
    await assertSucceeds(getDoc(ref))
    await assertSucceeds(setDoc(ref, { ...garden(), xp: 20 }))
    await assertSucceeds(deleteDoc(ref))
  })

  it('blocks another signed-in user from reading or writing the garden', async () => {
    await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'brainGames', 'ana'), garden()))
    const ref = doc(as('bob'), 'brainGames', 'ana')
    await assertFails(getDoc(ref))
    await assertFails(setDoc(ref, garden()))
    await assertFails(deleteDoc(ref))
  })

  it('blocks a signed-out visitor', async () => {
    const ref = doc(env.unauthenticatedContext().firestore(), 'brainGames', 'ana')
    await assertFails(getDoc(ref))
    await assertFails(setDoc(ref, garden()))
  })

  it('rejects an unknown field', async () => {
    await assertFails(setDoc(doc(as('ana'), 'brainGames', 'ana'), { ...garden(), admin: true }))
  })

  it('rejects a name longer than 24 characters', async () => {
    await assertFails(setDoc(doc(as('ana'), 'brainGames', 'ana'), { ...garden(), name: 'x'.repeat(25) }))
  })

  it('rejects xp that is not a whole number', async () => {
    await assertFails(setDoc(doc(as('ana'), 'brainGames', 'ana'), { ...garden(), xp: 'lots' }))
    await assertFails(setDoc(doc(as('ana'), 'brainGames', 'ana'), { ...garden(), xp: 1.5 }))
  })

  const day = (i: number) => new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10)
  const hist = (n: number) => Array.from({ length: n }, (_, t) => ({ id: 'math', s: t, d: '2026-10-28', t }))
  const days = (n: number) => Array.from({ length: n }, (_, i) => day(i))
  const xpDays = (n: number) => Object.fromEntries(days(n).map((d, i) => [d, i]))

  it('accepts the largest garden the app can make', async () => {
    const big = { ...garden(), hist: hist(60), days: days(120), xpDays: xpDays(120) }
    await assertSucceeds(setDoc(doc(as('ana'), 'brainGames', 'ana'), big))
  })

  it.each([
    ['61 hist entries', { hist: hist(61) }],
    ['121 days', { days: days(121) }],
    ['121 xpDays dates', { xpDays: xpDays(121) }],
    ['hist that is not a list', { hist: {} }],
    ['days that is not a list', { days: 'today' }]
  ])('rejects %s', async (_, patch) => {
    await assertFails(setDoc(doc(as('ana'), 'brainGames', 'ana'), { ...garden(), ...patch }))
  })

  it('denies every other collection', async () => {
    await assertFails(setDoc(doc(as('ana'), 'users', 'ana'), garden()))
  })
})

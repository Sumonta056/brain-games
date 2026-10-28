import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import BrainCard from '~/components/profile/BrainCard.vue'
import copy from '~/data/copy.json'
import brain from '~/data/brain.json'
import { fill } from '../../fixtures'

const total = brain.neurons.length
const p = copy.profile
const mounted: { unmount: () => void }[] = []

const expectLit = (played: number) => (played === 0 ? 0 : Math.min(total, 1 + Math.floor(played / 2)))
const expectStage = (played: number) => [...p.brainStages].reverse().find(s => s.at <= played)!.label
const hist = (n: number) => Array.from({ length: n }, (_, i) => ({ id: 'math', s: 1, d: '2026-10-20', t: i }))

async function card(progress: object) {
  localStorage.setItem('bgarden', JSON.stringify(progress))
  clearNuxtState('progress')
  const w = await mountSuspended(BrainCard)
  mounted.push(w)
  return w
}

describe('BrainCard', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtState('progress')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-28T12:00:00Z'))
  })
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    clearNuxtState('progress')
    localStorage.clear()
    vi.useRealTimers()
  })

  it('draws every neuron and link of brain.json inside a hidden layer', async () => {
    const w = await card({})
    const neurons = w.findAll('[data-testid="neuron"]')
    const links = w.findAll('[data-testid="link"]')
    expect(neurons).toHaveLength(total)
    expect(links).toHaveLength(brain.links.length)
    expect([...neurons, ...links].every(n => n.element.closest('[aria-hidden="true"]'))).toBe(true)
    expect(w.get('[data-testid="brain"]').attributes('aria-hidden')).toBeUndefined()
  })

  it('lights nothing and invites a first game when no game is played', async () => {
    const w = await card({})
    expect(w.findAll('[data-testid="neuron"]').filter(n => n.attributes('data-state'))).toHaveLength(0)
    expect(w.findAll('[data-testid="link"]').filter(n => n.attributes('data-state'))).toHaveLength(0)
    expect(w.get('[data-testid="brain-caption"]').text()).toBe(p.brainEmpty)
    expect(w.get('[data-testid="brain-stage"]').text()).toBe(expectStage(0))
    expect(w.get('[data-testid="brain-next"]').text()).toBe(fill(p.brainNext, { n: 1 }))
  })

  it.each([1, 2, 3, 9, 10, 41, 80, 141])('lights neurons centre-out for %i games played', async played => {
    const w = await card({ played })
    const lit = expectLit(played)
    const states = w.findAll('[data-testid="neuron"]').map(n => n.attributes('data-state'))
    expect(states).toEqual(
      Array.from({ length: total }, (_, i) => (i < lit - 1 ? 'lit' : i === lit - 1 ? 'new' : undefined))
    )
  })

  it.each([3, 10, 80])('lights a link only when both of its neurons are lit (%i games)', async played => {
    const w = await card({ played })
    const lit = expectLit(played)
    const states = w.findAll('[data-testid="link"]').map(n => n.attributes('data-state'))
    expect(states).toEqual(brain.links.map(([a, b]) => (a! < lit && b! < lit ? 'lit' : undefined)))
  })

  it.each([1, 9, 10, 40, 79, 80, 120, 141])('shows the caption, stage and next step for %i games', async played => {
    const w = await card({ played })
    const lit = expectLit(played)
    expect(w.get('[data-testid="brain-caption"]').text()).toBe(fill(p.brainCaption, { lit, total, played }))
    expect(w.get('[data-testid="brain-stage"]').text()).toBe(expectStage(played))
    expect(w.get('[data-testid="brain-next"]').text()).toBe(fill(p.brainNext, { n: 2 - (played % 2) }))
  })

  it.each([142, 143, 1000])('shows every neuron lit for %i games', async played => {
    const w = await card({ played })
    const states = w.findAll('[data-testid="neuron"]').map(n => n.attributes('data-state'))
    expect(states.filter(s => s === 'lit' || s === 'new')).toHaveLength(total)
    expect(w.findAll('[data-testid="link"]').every(l => l.attributes('data-state') === 'lit')).toBe(true)
    expect(w.get('[data-testid="brain-caption"]').text()).toBe(fill(p.brainCaption, { lit: total, total, played }))
    expect(w.get('[data-testid="brain-stage"]').text()).toBe(p.brainStages.at(-1)!.label)
    expect(w.get('[data-testid="brain-next"]').text()).toBe(p.brainDone)
  })

  it('falls back to hist.length when played is missing', async () => {
    const w = await card({ hist: hist(5) })
    const lit = expectLit(5)
    expect(w.get('[data-testid="brain-caption"]').text()).toBe(fill(p.brainCaption, { lit, total, played: 5 }))
    expect(w.findAll('[data-testid="neuron"]')[lit - 1]!.attributes('data-state')).toBe('new')
  })

  it('prefers played over hist.length', async () => {
    const w = await card({ played: 90, hist: hist(60) })
    expect(w.get('[data-testid="brain-caption"]').text()).toBe(
      fill(p.brainCaption, { lit: expectLit(90), total, played: 90 })
    )
    expect(w.get('[data-testid="brain-stage"]').text()).toBe(expectStage(90))
  })
})

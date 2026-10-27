import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MentalMath from '~/components/games/MentalMath.vue'
import { seeded } from '~/utils/random'
import { mathGame, resolvedGame } from '../../fixtures'

const easy = resolvedGame(mathGame, 'easy', { minLevel: 0, maxLevel: 0 })
const medium = resolvedGame(mathGame, 'medium', { minLevel: 0, maxLevel: 3 })
const hard = resolvedGame(mathGame, 'hard', { minLevel: 2, maxLevel: 3 })

function parse(q: string) {
  const [a, op, b] = q.trim().split(' ')
  return { a: Number(a), op: op!, b: Number(b) }
}

function solve(q: string) {
  const { a, op, b } = parse(q)
  return op === '+' ? a + b : op === '−' ? a - b : a * b
}

function withinLevel(q: string, level: number) {
  const { a, op, b } = parse(q)
  if (op === '×') return a >= 2 && a <= 9 + level * 3 && b >= 2 && b <= 9 + level
  return a >= 10 * (level + 1) && a <= 60 * (level + 1) && b >= 4 && b <= 40 * (level + 1)
}

type Wrapper = Awaited<ReturnType<typeof mountSuspended>>

const questionOf = (wrapper: Wrapper) => wrapper.get('[data-testid="question"]').text()

async function solveMany(wrapper: Wrapper, count: number) {
  const seen: string[] = []
  for (let i = 0; i < count; i++) {
    const q = questionOf(wrapper)
    seen.push(q)
    await wrapper.get('input').setValue(String(solve(q)))
  }
  return seen
}

describe('MentalMath', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('scores each correct answer and finishes when time runs out', async () => {
    const wrapper = await mountSuspended(MentalMath, { props: { game: medium } })
    const input = wrapper.get('input')
    for (let i = 0; i < 3; i++) {
      await input.setValue(String(solve(questionOf(wrapper))))
    }
    expect(wrapper.text()).toContain('Score 3')
    vi.advanceTimersByTime((medium.durationSec ?? 60) * 1000 + 200)
    expect(wrapper.emitted('finish')).toEqual([[3]])
  })

  it('does not score a wrong answer', async () => {
    const wrapper = await mountSuspended(MentalMath, { props: { game: medium } })
    const question = questionOf(wrapper)
    await wrapper.get('input').setValue(String(solve(question) + 1))
    expect(wrapper.text()).toContain('Score 0')
    expect(questionOf(wrapper)).toBe(question)
  })

  it('labels the answer input for screen readers', async () => {
    const wrapper = await mountSuspended(MentalMath, { props: { game: medium } })
    expect(wrapper.get('input').attributes('aria-label')).toBe('Answer')
  })

  it('on medium keeps × out for the first 5 sums and allows it from the 6th', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const wrapper = await mountSuspended(MentalMath, { props: { game: medium } })
    const seen = await solveMany(wrapper, 6)
    expect(seen.slice(0, 5).map(q => parse(q).op)).toEqual(['−', '−', '−', '−', '−'])
    expect(parse(seen[5]!).op).toBe('×')
  })

  it('on easy keeps every sum within level 0 and never shows × after 15 or more solved', async () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(7))
    const wrapper = await mountSuspended(MentalMath, { props: { game: easy } })
    const seen = await solveMany(wrapper, 30)
    const late = seen.slice(15)
    expect(late.filter(q => !withinLevel(q, 0))).toEqual([])
    expect(seen.filter(q => parse(q).op === '×')).toEqual([])
  })

  it('on easy keeps the lowest +/− sum at level 0 once 15 are solved', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const wrapper = await mountSuspended(MentalMath, { props: { game: easy } })
    await solveMany(wrapper, 15)
    expect(questionOf(wrapper)).toBe('10 + 4')
  })

  it('on easy picks − and not × at the top of the random range once 15 are solved', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const wrapper = await mountSuspended(MentalMath, { props: { game: easy } })
    await solveMany(wrapper, 15)
    expect(parse(questionOf(wrapper)).op).toBe('−')
  })

  it('on hard starts at level 2 from the first question', async () => {
    vi.spyOn(Math, 'random').mockImplementation(seeded(11))
    const wrapper = await mountSuspended(MentalMath, { props: { game: hard } })
    const seen = await solveMany(wrapper, 5)
    expect(seen.filter(q => !withinLevel(q, 2))).toEqual([])
    const plusMinus = seen.map(parse).filter(q => q.op !== '×')
    expect(plusMinus.length).toBeGreaterThan(0)
    for (const q of plusMinus) {
      expect(q.a).toBeGreaterThanOrEqual(30)
      expect(q.a).toBeLessThanOrEqual(180)
    }
  })

  it('on hard gives the lowest first +/− sum at level 2', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const wrapper = await mountSuspended(MentalMath, { props: { game: hard } })
    expect(questionOf(wrapper)).toBe('30 + 4')
  })

  it('on hard can show × on the first question', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99)
    const wrapper = await mountSuspended(MentalMath, { props: { game: hard } })
    expect(parse(questionOf(wrapper)).op).toBe('×')
  })

  it('on hard reaches level 3 after 5 solved', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const wrapper = await mountSuspended(MentalMath, { props: { game: hard } })
    await solveMany(wrapper, 5)
    expect(questionOf(wrapper)).toBe('40 + 4')
  })

  it('on hard never goes above level 3', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const wrapper = await mountSuspended(MentalMath, { props: { game: hard } })
    await solveMany(wrapper, 20)
    expect(questionOf(wrapper)).toBe('40 + 4')
  })
})

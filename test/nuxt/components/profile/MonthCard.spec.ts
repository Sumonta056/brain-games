import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import MonthCard from '~/components/profile/MonthCard.vue'
import copy from '~/data/copy.json'

const p = copy.profile
const mounted: { unmount: () => void }[] = []

const played = {
  days: ['2026-08-15', '2026-10-01', '2026-10-08', '2026-10-28'],
  xpDays: { '2026-09-30': 40, '2026-10-01': 50, '2026-10-08': 90, '2026-10-28': 100 }
}

async function monthCard(month: string, progress: object = played) {
  mounted.splice(0).forEach(w => w.unmount())
  localStorage.setItem('bgarden', JSON.stringify(progress))
  clearNuxtState('progress')
  const w = await mountSuspended(MonthCard, { props: { month } })
  mounted.push(w)
  return w
}

type Wrapper = Awaited<ReturnType<typeof monthCard>>

const prev = (w: Wrapper) => w.get(`button[aria-label="${p.prevMonth}"]`)
const next = (w: Wrapper) => w.get(`button[aria-label="${p.nextMonth}"]`)
const days = (w: Wrapper) => w.findAll('[data-testid="day"]')

describe('MonthCard', () => {
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

  it('titles the shown month', async () => {
    expect((await monthCard('2026-10')).get('[data-testid="month-title"]').text()).toBe('October 2026')
    expect((await monthCard('2026-09')).get('[data-testid="month-title"]').text()).toBe('September 2026')
  })

  it('shows the weekday names Monday first', async () => {
    const w = await monthCard('2026-10')
    const text = w.text()
    const at = p.weekdays.map(d => text.indexOf(d))
    expect(at.every(i => i >= 0)).toBe(true)
    expect([...at].sort((a, b) => a - b)).toEqual(at)
  })

  it('has one cell per date after the blank cells before day 1', async () => {
    const w = await monthCard('2026-10')
    const cells = days(w)
    expect(cells).toHaveLength(31)
    let blanks = 0
    let el = cells[0]!.element.previousElementSibling
    while (el) {
      if ((el.textContent ?? '').trim() === '') blanks++
      el = el.previousElementSibling
    }
    expect(blanks).toBe(3)
  })

  it('puts no blank before a month that starts on a Monday', async () => {
    const w = await monthCard('2026-06')
    const cells = days(w)
    expect(cells).toHaveLength(30)
    let blanks = 0
    let el = cells[0]!.element.previousElementSibling
    while (el) {
      if ((el.textContent ?? '').trim() === '') blanks++
      el = el.previousElementSibling
    }
    expect(blanks).toBe(0)
  })

  it('fills played dates, dashes dates after today and rings today', async () => {
    const w = await monthCard('2026-10')
    const states = days(w).map(d => d.attributes('data-state'))
    const expected = Array.from({ length: 31 }, (_, i) => {
      const day = i + 1
      if ([1, 8, 28].includes(day)) return 'on'
      if (day > 28) return 'future'
      return undefined
    })
    expect(states).toEqual(expected)
    const today = days(w)
      .map((d, i) => (d.attributes('data-today') !== undefined ? i + 1 : 0))
      .filter(Boolean)
    expect(today).toEqual([28])
  })

  it('does not ring any date in a past month', async () => {
    const w = await monthCard('2026-09')
    expect(days(w).some(d => d.attributes('data-today') !== undefined)).toBe(false)
    expect(days(w).some(d => d.attributes('data-state') === 'future')).toBe(false)
  })

  it('labels each date as played or a rest day', async () => {
    const w = await monthCard('2026-10')
    const labels = days(w).map(d => d.attributes('aria-label') ?? '')
    expect(new Set(labels).size).toBe(31)
    expect(labels[0]!.endsWith(`, ${p.played}`)).toBe(true)
    expect(labels[1]!.endsWith(`, ${p.rest}`)).toBe(true)
    expect(labels[7]!.endsWith(`, ${p.played}`)).toBe(true)
    expect(labels[27]!.endsWith(`, ${p.played}`)).toBe(true)
    expect(labels.filter(l => l.endsWith(`, ${p.played}`))).toHaveLength(3)
    expect(labels[7]).toMatch(/October/)
    expect(labels[7]).toMatch(/\b8\b/)
    expect(labels[7]).toMatch(/2026/)
  })

  it('sums up the current month: days played up to today, points grown, best day', async () => {
    const w = await monthCard('2026-10')
    const summary = w.get('[data-testid="month-summary"]').text()
    expect(summary).toContain('3 / 28')
    expect(summary).toContain(p.daysPlayed)
    expect(summary).toContain('+60')
    expect(summary).toContain(p.pointsGrown)
    expect(summary).toContain('Oct 8')
    expect(summary).toContain(p.bestDay)
  })

  it('sums up a past month over all its dates, with no gain and no best day', async () => {
    const w = await monthCard('2026-09')
    const summary = w.get('[data-testid="month-summary"]').text()
    expect(summary).toContain('0 / 30')
    expect(summary).toContain('+0')
    expect(summary).toContain('–')
  })

  it('shows +0 and – for a month with no growth values', async () => {
    const w = await monthCard('2026-08')
    const summary = w.get('[data-testid="month-summary"]').text()
    expect(summary).toContain('1 / 31')
    expect(summary).toContain('+0')
    expect(summary).toContain('–')
  })

  it('asks for the previous month', async () => {
    const w = await monthCard('2026-10')
    await prev(w).trigger('click')
    expect(w.emitted('update:month')).toEqual([['2026-09']])
  })

  it('asks for the next month, across a year end', async () => {
    const w = await monthCard('2025-12', { days: ['2025-11-03'] })
    await next(w).trigger('click')
    expect(w.emitted('update:month')).toEqual([['2026-01']])
  })

  it('disables next on the current month only', async () => {
    expect(next(await monthCard('2026-10')).attributes('disabled')).toBeDefined()
    expect(next(await monthCard('2026-09')).attributes('disabled')).toBeUndefined()
  })

  it('disables previous on the month of the oldest played date only', async () => {
    expect(prev(await monthCard('2026-08')).attributes('disabled')).toBeDefined()
    expect(prev(await monthCard('2026-09')).attributes('disabled')).toBeUndefined()
    expect(prev(await monthCard('2026-10')).attributes('disabled')).toBeUndefined()
  })

  it('shows a legend for played and rest days', async () => {
    const legend = (await monthCard('2026-10')).get('[data-testid="month-legend"]').text()
    expect(legend).toContain(p.legendPlayed)
    expect(legend).toContain(p.legendRest)
  })

  it('moves focus to the other month button when the focused one becomes disabled', async () => {
    mounted.splice(0).forEach(w => w.unmount())
    localStorage.setItem('bgarden', JSON.stringify(played))
    clearNuxtState('progress')
    const w = await mountSuspended(MonthCard, { props: { month: '2026-09' }, attachTo: document.body })
    mounted.push(w)
    ;(prev(w).element as HTMLButtonElement).focus()
    await prev(w).trigger('click')
    await w.setProps({ month: w.emitted<[string]>('update:month')![0]![0] })
    expect(prev(w).attributes('disabled')).toBeDefined()
    expect(document.activeElement).toBe(next(w).element)
  })

  it('disables both buttons on the current month when nothing is played', async () => {
    const w = await monthCard('2026-10', {})
    expect(prev(w).attributes('disabled')).toBeDefined()
    expect(next(w).attributes('disabled')).toBeDefined()
  })
})

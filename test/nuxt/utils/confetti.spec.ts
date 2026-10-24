import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { confetti } from '~/utils/confetti'

function fakeCtx() {
  return {
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: ''
  }
}

function setMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((q: string) => ({ matches: reduce && q.includes('reduce'), media: q }))
  )
}

function addCanvas(ctx: ReturnType<typeof fakeCtx> | null) {
  const cv = document.createElement('canvas')
  cv.id = 'confetti'
  const getContext = vi.fn(() => ctx)
  Object.defineProperty(cv, 'getContext', { value: getContext })
  document.body.appendChild(cv)
  return { cv, getContext }
}

describe('confetti', () => {
  let frames: FrameRequestCallback[]
  beforeEach(() => {
    frames = []
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb))
  })
  afterEach(() => {
    document.getElementById('confetti')?.remove()
    vi.unstubAllGlobals()
  })

  function runFrames() {
    let count = 0
    while (frames.length) {
      frames.shift()!(0)
      count++
    }
    return count
  }

  it('does nothing when the user prefers reduced motion', () => {
    setMotion(true)
    const ctx = fakeCtx()
    const { getContext } = addCanvas(ctx)
    confetti()
    expect(getContext).not.toHaveBeenCalled()
    expect(ctx.fillRect).not.toHaveBeenCalled()
    expect(frames).toHaveLength(0)
  })

  it('does not throw when the canvas is missing', () => {
    setMotion(false)
    expect(() => confetti()).not.toThrow()
    expect(frames).toHaveLength(0)
  })

  it('does not throw when the canvas has no 2d context', () => {
    setMotion(false)
    addCanvas(null)
    expect(() => confetti()).not.toThrow()
    expect(frames).toHaveLength(0)
  })

  it('sizes the canvas to the window and draws particles', () => {
    setMotion(false)
    const ctx = fakeCtx()
    const { cv } = addCanvas(ctx)
    confetti()
    expect(cv.width).toBe(window.innerWidth)
    expect(cv.height).toBe(window.innerHeight)
    expect(ctx.fillRect).toHaveBeenCalledTimes(120)
  })

  it('stops after a short burst and leaves the canvas clear', () => {
    setMotion(false)
    const ctx = fakeCtx()
    addCanvas(ctx)
    confetti()
    const scheduled = runFrames()
    expect(scheduled).toBe(119)
    expect(frames).toHaveLength(0)
    const lastClear = ctx.clearRect.mock.invocationCallOrder.at(-1)!
    const lastDraw = ctx.fillRect.mock.invocationCallOrder.at(-1)!
    expect(lastClear).toBeGreaterThan(lastDraw)
  })
})

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState, useState } from '#imports'
import { useCloudSync } from '~/composables/useCloudSync'
import { useAuth } from '~/composables/useAuth'
import { useProgress } from '~/composables/useProgress'
import type { Progress } from '~~/shared/types/game'
import { authError, makeProgress, resetFirebaseFakes } from '../fixtures'

const fb = await vi.hoisted(async () => (await import('../fixtures')).createFirebaseFakes())

vi.mock('firebase/app', () => ({ initializeApp: fb.initializeApp, getApps: () => [], getApp: () => fb.app }))
vi.mock('firebase/auth', async importOriginal => ({
  ...(await importOriginal<object>()),
  getAuth: fb.getAuth,
  signInWithPopup: fb.signInWithPopup,
  signOut: fb.signOut
}))
vi.mock('firebase/firestore', async importOriginal => ({
  ...(await importOriginal<object>()),
  initializeFirestore: fb.initializeFirestore,
  getFirestore: fb.getFirestore,
  persistentLocalCache: fb.persistentLocalCache,
  doc: fb.doc,
  getDoc: fb.getDoc,
  setDoc: fb.setDoc,
  deleteDoc: fb.deleteDoc,
  runTransaction: fb.runTransaction
}))

const DOC = 'brainGames/u1'
const FIVE_MINUTES = 5 * 60 * 1000
const ana = { uid: 'u1', displayName: 'Ana Lima', email: 'ana@example.com', photoURL: '' }

const local = (): Progress =>
  makeProgress({
    name: 'Ana',
    av: '🦉',
    best: { math: 9, pairs: 30 },
    hist: [{ id: 'math', s: 9, d: '2026-05-09', t: 100 }],
    days: ['2026-05-09'],
    xp: 30,
    updatedAt: 2000
  })

const cloud = (): Progress =>
  makeProgress({
    name: 'Bo',
    av: '🐼',
    best: { math: 12, pairs: 40 },
    hist: [{ id: 'pairs', s: 40, d: '2026-05-08', t: 50 }],
    days: ['2026-05-08'],
    xp: 50,
    theme: 'dark',
    updatedAt: 1000
  })

const mounted: { unmount: () => void }[] = []

async function settle() {
  for (let i = 0; i < 10; i++) await flushPromises()
}

async function mountSync(start = false) {
  let sync!: ReturnType<typeof useCloudSync>
  const wrapper = await mountSuspended(
    defineComponent({
      setup() {
        sync = useCloudSync()
        if (start) sync.start()
        return () => h('div')
      }
    })
  )
  mounted.push(wrapper)
  await settle()
  return { sync, wrapper }
}

function signedInSession(cloudDoc?: unknown) {
  localStorage.setItem('bgarden-auth', '1')
  fb.auth.currentUser = ana
  if (cloudDoc !== undefined) fb.store.set(DOC, cloudDoc)
}

function popupSignsIn() {
  fb.signInWithPopup.mockImplementationOnce(async () => {
    fb.auth.currentUser = ana
    return { user: ana }
  })
}

function setVisibility(state: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state })
  document.dispatchEvent(new Event('visibilitychange'))
}

function change() {
  useProgress().progress.value.xp += 7
}

const written = () => fb.setDoc.mock.calls.map(([ref, data]) => [(ref as { path: string }).path, data])

describe('useCloudSync', () => {
  beforeAll(async () => {
    await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')])
  })
  beforeEach(async () => {
    clearNuxtState()
    await nextTick()
    localStorage.clear()
    localStorage.setItem('bgarden', JSON.stringify(local()))
    resetFirebaseFakes(fb)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
    vi.setSystemTime(new Date('2026-05-10T12:00:00Z'))
  })
  afterEach(() => {
    mounted.splice(0).forEach(w => w.unmount())
    Reflect.deleteProperty(document, 'visibilityState')
    vi.useRealTimers()
  })

  describe('a guest', () => {
    it('makes no Firebase call on start, triggers or save', async () => {
      const { sync } = await mountSync(true)
      change()
      setVisibility('hidden')
      window.dispatchEvent(new Event('pagehide'))
      vi.advanceTimersByTime(FIVE_MINUTES * 2)
      await sync.save()
      await settle()
      expect(fb.initializeApp).not.toHaveBeenCalled()
      expect(fb.auth.authStateReady).not.toHaveBeenCalled()
      expect(fb.getDoc).not.toHaveBeenCalled()
      expect(fb.setDoc).not.toHaveBeenCalled()
    })
  })

  describe('start with a session', () => {
    it('writes the local copy once when the cloud document is missing', async () => {
      signedInSession()
      await mountSync(true)
      expect(fb.getDoc).toHaveBeenCalledTimes(1)
      expect(written()).toEqual([[DOC, expect.objectContaining({ name: 'Ana', xp: 30, best: local().best })]])
    })

    it('merges with an older cloud copy: the local name wins and the games join', async () => {
      signedInSession({ ...cloud(), updatedAt: 1000 })
      await mountSync(true)
      expect(useProgress().progress.value).toMatchObject({ name: 'Ana', xp: 50, best: { math: 12, pairs: 30 } })
      expect(written()).toEqual([[DOC, expect.objectContaining({ name: 'Ana', xp: 50 })]])
    })

    it('merges with a newer cloud copy: the cloud name wins and no local game is lost', async () => {
      signedInSession({ ...cloud(), updatedAt: 5000 })
      await mountSync(true)
      expect(useProgress().progress.value).toMatchObject({
        name: 'Bo',
        av: '🐼',
        xp: 50,
        best: { math: 12, pairs: 30 }
      })
      expect(useProgress().progress.value.hist.map(h => h.t)).toEqual([100, 50])
      expect(written()).toEqual([[DOC, expect.objectContaining({ name: 'Bo', best: { math: 12, pairs: 30 } })]])
    })

    it('does not write when the cloud already holds the merged copy', async () => {
      signedInSession(local())
      await mountSync(true)
      expect(fb.runTransaction).toHaveBeenCalledTimes(1)
      expect(fb.setDoc).not.toHaveBeenCalled()
    })

    it('never overwrites a cloud document that is not valid progress', async () => {
      const broken = { name: 42, best: 'none' }
      signedInSession(broken)
      const { sync } = await mountSync(true)
      expect(useProgress().progress.value).toMatchObject({ name: 'Ana', xp: 30 })
      expect(useState('cloud-status').value).toBe('sync')
      change()
      setVisibility('hidden')
      window.dispatchEvent(new Event('pagehide'))
      vi.advanceTimersByTime(FIVE_MINUTES)
      await sync.save()
      await sync.signOut()
      await settle()
      expect(fb.setDoc).not.toHaveBeenCalled()
      expect(fb.store.get(DOC)).toEqual(broken)
    })
  })

  describe('batched saves', () => {
    async function synced() {
      signedInSession(local())
      const result = await mountSync(true)
      fb.setDoc.mockClear()
      return result
    }

    it('writes once when the tab is hidden after a change', async () => {
      await synced()
      change()
      setVisibility('hidden')
      await settle()
      expect(written()).toEqual([[DOC, expect.objectContaining({ xp: 37 })]])
      setVisibility('hidden')
      await settle()
      expect(fb.setDoc).toHaveBeenCalledTimes(1)
    })

    it('does not write when the tab becomes visible', async () => {
      await synced()
      change()
      setVisibility('visible')
      await settle()
      expect(fb.setDoc).not.toHaveBeenCalled()
    })

    it('writes once on pagehide after a change', async () => {
      await synced()
      change()
      window.dispatchEvent(new Event('pagehide'))
      await settle()
      expect(written()).toEqual([[DOC, expect.objectContaining({ xp: 37 })]])
    })

    it('writes once 5 minutes after a change', async () => {
      await synced()
      change()
      vi.advanceTimersByTime(FIVE_MINUTES - 1000)
      await settle()
      expect(fb.setDoc).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1000)
      await settle()
      expect(written()).toEqual([[DOC, expect.objectContaining({ xp: 37 })]])
      vi.advanceTimersByTime(FIVE_MINUTES)
      await settle()
      expect(fb.setDoc).toHaveBeenCalledTimes(1)
    })

    it('does not write when nothing changed', async () => {
      const { sync } = await synced()
      setVisibility('hidden')
      window.dispatchEvent(new Event('pagehide'))
      vi.advanceTimersByTime(FIVE_MINUTES * 2)
      await sync.save()
      await settle()
      expect(fb.setDoc).not.toHaveBeenCalled()
    })

    it('does nothing on save when signed out', async () => {
      const { sync } = await mountSync()
      change()
      await sync.save()
      await settle()
      expect(fb.setDoc).not.toHaveBeenCalled()
      expect(fb.initializeApp).not.toHaveBeenCalled()
    })

    it('stops listening and saving after unmount', async () => {
      const { wrapper } = await synced()
      wrapper.unmount()
      change()
      setVisibility('hidden')
      window.dispatchEvent(new Event('pagehide'))
      vi.advanceTimersByTime(FIVE_MINUTES * 2)
      await settle()
      expect(fb.setDoc).not.toHaveBeenCalled()
    })
  })

  describe('signIn', () => {
    it('writes the local copy once when the cloud document is missing', async () => {
      popupSignsIn()
      const { sync } = await mountSync()
      await sync.signIn()
      await settle()
      expect(fb.getDoc).toHaveBeenCalledTimes(1)
      expect(written()).toEqual([[DOC, expect.objectContaining({ name: 'Ana', xp: 30 })]])
    })

    it('merges the cloud copy into the local one and writes the result once', async () => {
      fb.store.set(DOC, cloud())
      popupSignsIn()
      const { sync } = await mountSync()
      await sync.signIn()
      await settle()
      const merged = { name: 'Ana', av: '🦉', theme: 'auto', xp: 50, best: { math: 12, pairs: 30 } }
      expect(useProgress().progress.value).toMatchObject(merged)
      expect(useProgress().progress.value.hist.map(h => h.t)).toEqual([100, 50])
      expect(useProgress().progress.value.days).toEqual(['2026-05-08', '2026-05-09'])
      expect(written()).toEqual([[DOC, expect.objectContaining(merged)]])
    })

    it('keeps the local copy and does not write when the cloud document is not valid', async () => {
      fb.store.set(DOC, { xp: 'lots' })
      popupSignsIn()
      const { sync } = await mountSync()
      await sync.signIn()
      await settle()
      expect(useProgress().progress.value).toMatchObject({ name: 'Ana', xp: 30 })
      expect(fb.setDoc).not.toHaveBeenCalled()
    })

    it('opens one popup when sign-in is pressed again while the first popup is open', async () => {
      let open!: () => void
      fb.signInWithPopup.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            open = () => {
              fb.auth.currentUser = ana
              resolve({ user: ana })
            }
          })
      )
      const { sync } = await mountSync()
      const first = sync.signIn()
      await vi.waitFor(() => expect(fb.signInWithPopup).toHaveBeenCalledTimes(1))
      const second = sync.signIn()
      await settle()
      open()
      await Promise.all([first, second])
      await settle()
      expect(fb.signInWithPopup).toHaveBeenCalledTimes(1)
      expect(useAuth().error.value).toBe('')
      expect(useAuth().user.value?.uid).toBe('u1')
    })

    it('reads and writes nothing when the popup is closed', async () => {
      fb.signInWithPopup.mockRejectedValueOnce(authError('auth/popup-closed-by-user'))
      const { sync } = await mountSync()
      await sync.signIn()
      await settle()
      expect(fb.getDoc).not.toHaveBeenCalled()
      expect(fb.setDoc).not.toHaveBeenCalled()
    })
  })

  describe('signOut', () => {
    it('writes the last change once, then signs out and keeps the local copy', async () => {
      signedInSession(local())
      const { sync } = await mountSync(true)
      fb.setDoc.mockClear()
      change()
      await sync.signOut()
      await settle()
      expect(written()).toEqual([[DOC, expect.objectContaining({ xp: 37 })]])
      expect(fb.signOut).toHaveBeenCalledTimes(1)
      expect(fb.setDoc.mock.invocationCallOrder[0]).toBeLessThan(fb.signOut.mock.invocationCallOrder[0]!)
      expect(useAuth().user.value).toBeNull()
      expect(useProgress().progress.value).toMatchObject({ name: 'Ana', xp: 37 })
    })

    it('signs out without a write when nothing changed', async () => {
      signedInSession(local())
      const { sync } = await mountSync(true)
      fb.setDoc.mockClear()
      await sync.signOut()
      await settle()
      expect(fb.setDoc).not.toHaveBeenCalled()
      expect(fb.signOut).toHaveBeenCalledTimes(1)
    })
  })

  describe('deleteCloud', () => {
    it('deletes the document and signs out without a save, keeping the local copy', async () => {
      signedInSession(local())
      const { sync } = await mountSync(true)
      fb.setDoc.mockClear()
      change()
      await sync.deleteCloud()
      await settle()
      expect(fb.deleteDoc).toHaveBeenCalledTimes(1)
      expect((fb.deleteDoc.mock.calls[0]![0] as { path: string }).path).toBe(DOC)
      expect(fb.store.has(DOC)).toBe(false)
      expect(fb.signOut).toHaveBeenCalledTimes(1)
      expect(fb.setDoc).not.toHaveBeenCalled()
      expect(useAuth().user.value).toBeNull()
      expect(localStorage.getItem('bgarden-auth')).toBeNull()
      expect(useProgress().progress.value).toMatchObject({ name: 'Ana', xp: 37 })
    })
  })

  describe('review fixes', () => {
    it('gives another account its own cloud garden, not the local one', async () => {
      localStorage.setItem('bgarden-owner', 'u9')
      fb.store.set(DOC, cloud())
      popupSignsIn()
      const { sync } = await mountSync()
      await sync.signIn()
      await settle()
      expect(useProgress().progress.value).toMatchObject({ name: 'Bo', xp: 50, best: cloud().best })
      expect(useProgress().progress.value.hist.map(h => h.t)).toEqual([50])
      expect(fb.setDoc).not.toHaveBeenCalled()
      expect(localStorage.getItem('bgarden-owner')).toBe('u1')
    })

    it('merges guest data into the first account and marks it as the owner', async () => {
      fb.store.set(DOC, cloud())
      popupSignsIn()
      const { sync } = await mountSync()
      await sync.signIn()
      await settle()
      expect(useProgress().progress.value.hist.map(h => h.t)).toEqual([100, 50])
      expect(localStorage.getItem('bgarden-owner')).toBe('u1')
    })

    it('keeps the cloud copy when a transaction fails, and tries again on the next trigger', async () => {
      signedInSession(cloud())
      fb.runTransaction.mockRejectedValueOnce(new Error('unavailable'))
      await mountSync(true)
      expect(useState('cloud-status').value).toBe('sync')
      expect(fb.store.get(DOC)).toEqual(cloud())
      setVisibility('hidden')
      await settle()
      expect(useState('cloud-status').value).toBe('')
      expect(written()).toEqual([[DOC, expect.objectContaining({ best: { math: 12, pairs: 30 } })]])
    })

    it('runs one sync when hidden and pagehide fire together', async () => {
      signedInSession(local())
      await mountSync(true)
      fb.runTransaction.mockClear()
      change()
      setVisibility('hidden')
      window.dispatchEvent(new Event('pagehide'))
      await settle()
      expect(fb.runTransaction).toHaveBeenCalledTimes(1)
    })

    it('keeps a game played while a sync runs', async () => {
      signedInSession(cloud())
      let release!: () => void
      fb.getDoc.mockImplementationOnce(async ref => {
        await new Promise<void>(r => (release = r))
        return { id: 'u1', exists: () => true, data: () => fb.store.get(ref.path) }
      })
      await mountSync(true)
      useProgress().progress.value.hist.unshift({ id: 'math', s: 4, d: '2026-05-10', t: 999 })
      release()
      await settle()
      expect(useProgress().progress.value.hist.map(h => h.t)).toEqual([999, 100, 50])
    })

    it('signs out after 4 seconds when the sync hangs offline', async () => {
      signedInSession(local())
      const { sync } = await mountSync(true)
      fb.runTransaction.mockImplementationOnce(() => new Promise(() => {}))
      change()
      const done = sync.signOut()
      await settle()
      expect(fb.signOut).not.toHaveBeenCalled()
      vi.advanceTimersByTime(4000)
      await done
      expect(fb.signOut).toHaveBeenCalledTimes(1)
      expect(useAuth().user.value).toBeNull()
      vi.advanceTimersByTime(10000)
      await settle()
      expect(useState('cloud-status').value).toBe('sync')
    })

    it('stays signed in and reports when the delete fails', async () => {
      signedInSession(local())
      const { sync } = await mountSync(true)
      fb.deleteDoc.mockRejectedValueOnce(new Error('unavailable'))
      await sync.deleteCloud()
      expect(fb.signOut).not.toHaveBeenCalled()
      expect(useAuth().user.value).not.toBeNull()
      expect(useState('cloud-status').value).toBe('deleteFailed')
    })

    it('sends a reset to the cloud so the old garden does not come back', async () => {
      signedInSession(local())
      const { sync } = await mountSync(true)
      vi.setSystemTime(new Date('2026-05-10T13:00:00Z'))
      useProgress().reset()
      await sync.save()
      await settle()
      expect(fb.store.get(DOC)).toMatchObject({ best: {}, hist: [], xp: 0, resetAt: Date.now() })
    })
  })
})

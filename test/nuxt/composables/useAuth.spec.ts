import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearNuxtState } from '#imports'
import { useAuth } from '~/composables/useAuth'
import copy from '~/data/copy.json'
import { authError, FakeGoogleProvider, resetFirebaseFakes } from '../fixtures'

const fb = await vi.hoisted(async () => (await import('../fixtures')).createFirebaseFakes())

vi.mock('firebase/app', () => ({ initializeApp: fb.initializeApp, getApps: () => [], getApp: () => fb.app }))
vi.mock('firebase/auth', async importOriginal => ({
  ...(await importOriginal<object>()),
  getAuth: fb.getAuth,
  GoogleAuthProvider: FakeGoogleProvider,
  signInWithPopup: fb.signInWithPopup,
  signOut: fb.signOut
}))
vi.mock('firebase/firestore', async importOriginal => ({
  ...(await importOriginal<object>()),
  initializeFirestore: fb.initializeFirestore,
  getFirestore: fb.getFirestore,
  persistentLocalCache: fb.persistentLocalCache
}))

const HINT = 'bgarden-auth'
const ana = { uid: 'u1', displayName: 'Ana Lima', email: 'ana@example.com', photoURL: 'https://example.com/ana.png' }
const anaUser = { uid: 'u1', name: 'Ana Lima', email: 'ana@example.com', photo: 'https://example.com/ana.png' }

function fresh() {
  clearNuxtState(['auth-user', 'auth-error', 'auth-ready'])
  return useAuth()
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    resetFirebaseFakes(fb)
  })

  describe('a failed Firebase start', () => {
    it('shows the generic message on sign-in and does not throw', async () => {
      fb.initializeApp.mockImplementationOnce(() => {
        throw new Error('auth/invalid-api-key')
      })
      const { signIn, error, user } = fresh()
      await expect(signIn()).resolves.toBeNull()
      expect(error.value).toBe(copy.account.errors.generic)
      expect(user.value).toBeNull()
    })
  })

  describe('restore', () => {
    it('returns null and loads no Firebase when there is no session hint', async () => {
      const { restore, user } = fresh()
      expect(await restore()).toBeNull()
      expect(user.value).toBeNull()
      expect(fb.initializeApp).not.toHaveBeenCalled()
      expect(fb.getAuth).not.toHaveBeenCalled()
      expect(fb.auth.authStateReady).not.toHaveBeenCalled()
    })

    it('waits for the auth state and restores the signed-in user when the hint is set', async () => {
      localStorage.setItem(HINT, '1')
      fb.auth.currentUser = ana
      const { restore, user } = fresh()
      expect(await restore()).toEqual(anaUser)
      expect(fb.auth.authStateReady).toHaveBeenCalled()
      expect(user.value).toEqual(anaUser)
    })

    it('turns missing name, email and photo into empty strings', async () => {
      localStorage.setItem(HINT, '1')
      fb.auth.currentUser = { uid: 'u2', displayName: null, email: null, photoURL: null }
      const { restore, user } = fresh()
      await restore()
      expect(user.value).toEqual({ uid: 'u2', name: '', email: '', photo: '' })
    })

    it('removes the hint and returns null when the session has ended', async () => {
      localStorage.setItem(HINT, '1')
      const { restore, user } = fresh()
      expect(await restore()).toBeNull()
      expect(user.value).toBeNull()
      expect(localStorage.getItem(HINT)).toBeNull()
    })
  })

  describe('signIn', () => {
    it('opens the Google popup and stores the user and the session hint', async () => {
      fb.signInWithPopup.mockImplementationOnce(async () => {
        fb.auth.currentUser = ana
        return { user: ana }
      })
      const { signIn, user, error } = fresh()
      expect(await signIn()).toEqual(anaUser)
      expect(fb.signInWithPopup).toHaveBeenCalledWith(fb.auth, expect.any(FakeGoogleProvider))
      expect(user.value).toEqual(anaUser)
      expect(error.value).toBe('')
      expect(localStorage.getItem(HINT)).toBe('1')
    })

    it('asks to allow the popup when the browser blocks it', async () => {
      fb.signInWithPopup.mockRejectedValueOnce(authError('auth/popup-blocked'))
      const { signIn, user, error } = fresh()
      expect(await signIn()).toBeNull()
      expect(error.value).toBe(copy.account.errors.popup)
      expect(user.value).toBeNull()
      expect(localStorage.getItem(HINT)).toBeNull()
    })

    it.each(['auth/popup-closed-by-user', 'auth/cancelled-popup-request'])(
      'shows no error when the player closes the popup (%s)',
      async code => {
        fb.signInWithPopup.mockRejectedValueOnce(authError(code))
        const { signIn, user, error } = fresh()
        expect(await signIn()).toBeNull()
        expect(error.value).toBe('')
        expect(user.value).toBeNull()
      }
    )

    it('shows the generic message for any other error', async () => {
      fb.signInWithPopup.mockRejectedValueOnce(authError('auth/network-request-failed'))
      const { signIn, user, error } = fresh()
      expect(await signIn()).toBeNull()
      expect(error.value).toBe(copy.account.errors.generic)
      expect(user.value).toBeNull()
    })

    it('clears an earlier error after a successful sign-in', async () => {
      fb.signInWithPopup.mockRejectedValueOnce(authError('auth/popup-blocked'))
      const { signIn, error } = fresh()
      await signIn()
      expect(error.value).toBe(copy.account.errors.popup)
      fb.signInWithPopup.mockImplementationOnce(async () => {
        fb.auth.currentUser = ana
        return { user: ana }
      })
      await signIn()
      expect(error.value).toBe('')
    })
    it('clears an earlier error as soon as a new sign-in starts', async () => {
      fb.signInWithPopup.mockRejectedValueOnce(authError('auth/popup-blocked'))
      const { signIn, error } = fresh()
      await signIn()
      expect(error.value).toBe(copy.account.errors.popup)
      let block!: (e: unknown) => void
      fb.signInWithPopup.mockImplementationOnce(() => new Promise((_, reject) => (block = reject)))
      const second = signIn()
      await vi.waitFor(() => expect(fb.signInWithPopup).toHaveBeenCalledTimes(2))
      expect(error.value).toBe('')
      block(authError('auth/popup-blocked'))
      await second
      expect(error.value).toBe(copy.account.errors.popup)
    })
  })

  describe('ready', () => {
    it('is ready at once for a guest', async () => {
      const { restore, ready } = fresh()
      await restore()
      expect(ready.value).toBe(true)
    })

    it('is not ready until the session restore ends', async () => {
      localStorage.setItem(HINT, '1')
      fb.auth.currentUser = ana
      let finish!: () => void
      fb.auth.authStateReady.mockImplementationOnce(() => new Promise<void>(r => (finish = r)))
      const { restore, ready } = fresh()
      const done = restore()
      await new Promise(r => setTimeout(r, 0))
      expect(ready.value).toBe(false)
      finish()
      await done
      expect(ready.value).toBe(true)
    })
  })

  describe('signOut', () => {
    it('signs out of Firebase, clears the user and removes the hint', async () => {
      localStorage.setItem(HINT, '1')
      fb.auth.currentUser = ana
      const { restore, signOut, user } = fresh()
      await restore()
      expect(user.value).toEqual(anaUser)
      await signOut()
      expect(fb.signOut).toHaveBeenCalledWith(fb.auth)
      expect(user.value).toBeNull()
      expect(localStorage.getItem(HINT)).toBeNull()
    })
  })

  it('shares the user between callers', async () => {
    localStorage.setItem(HINT, '1')
    fb.auth.currentUser = ana
    await fresh().restore()
    expect(useAuth().user.value).toEqual(anaUser)
  })
})

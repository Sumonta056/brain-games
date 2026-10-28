import { describe, expect, it, vi } from 'vitest'
import { useNuxtApp, useRuntimeConfig } from '#imports'

const fb = vi.hoisted(() => {
  const app = { name: 'fake-app' }
  const auth = { name: 'fake-auth' }
  const db = { name: 'fake-db' }
  const cache = { kind: 'persistent' }
  return {
    app,
    auth,
    db,
    cache,
    initializeApp: vi.fn(() => app),
    getAuth: vi.fn(() => auth),
    initializeFirestore: vi.fn(() => db),
    persistentLocalCache: vi.fn(() => cache)
  }
})

vi.mock('firebase/app', () => ({ initializeApp: fb.initializeApp, getApps: () => [], getApp: () => fb.app }))
vi.mock('firebase/auth', async importOriginal => ({
  ...(await importOriginal<object>()),
  getAuth: fb.getAuth
}))
vi.mock('firebase/firestore', async importOriginal => ({
  ...(await importOriginal<object>()),
  initializeFirestore: fb.initializeFirestore,
  persistentLocalCache: fb.persistentLocalCache
}))

type FirebaseGetter = () => Promise<{ auth: unknown; db: unknown }>

const getter = () => (useNuxtApp() as unknown as { $firebase?: FirebaseGetter }).$firebase

describe('plugins/firebase.client', () => {
  it('provides $firebase without starting Firebase', () => {
    expect(getter()).toBeTypeOf('function')
    expect(fb.initializeApp).not.toHaveBeenCalled()
    expect(fb.getAuth).not.toHaveBeenCalled()
    expect(fb.initializeFirestore).not.toHaveBeenCalled()
  })

  it('starts again after a failed start, then starts Firebase once, with the public runtime config and the persistent offline cache', async () => {
    const get = getter()!
    fb.initializeApp.mockImplementationOnce(() => {
      throw new Error('auth/invalid-api-key')
    })
    await expect(get()).rejects.toThrow('auth/invalid-api-key')
    fb.initializeApp.mockClear()
    const [a, b] = await Promise.all([get(), get()])
    const c = await get()
    expect(a).toEqual({ auth: fb.auth, db: fb.db })
    expect(b).toEqual(a)
    expect(c).toEqual(a)
    expect(fb.initializeApp).toHaveBeenCalledTimes(1)
    expect(fb.getAuth).toHaveBeenCalledTimes(1)
    expect(fb.initializeFirestore).toHaveBeenCalledTimes(1)
    expect(fb.initializeApp).toHaveBeenCalledWith(useRuntimeConfig().public.firebase)
    expect(fb.getAuth).toHaveBeenCalledWith(fb.app)
    expect(fb.persistentLocalCache).toHaveBeenCalled()
    const [app, settings] = fb.initializeFirestore.mock.calls[0] as unknown as [unknown, { localCache?: unknown }]
    expect(app).toBe(fb.app)
    expect(settings.localCache).toBe(fb.cache)
  })
})

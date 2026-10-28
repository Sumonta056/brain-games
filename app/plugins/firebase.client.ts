import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

export interface FirebaseHandles {
  auth: Auth
  db: Firestore
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.firebase
  let started: Promise<FirebaseHandles> | undefined

  async function start(): Promise<FirebaseHandles> {
    const [{ initializeApp }, { getAuth }, fs] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore')
    ])
    const app = initializeApp(config)
    const db = fs.initializeFirestore(app, {
      localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() })
    })
    return { auth: getAuth(app), db }
  }

  const firebase = () =>
    (started ??= start().catch(e => {
      started = undefined
      throw e
    }))
  return { provide: { firebase } }
})

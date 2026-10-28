const FIVE_MINUTES = 5 * 60 * 1000
const WAIT = 4000
const LIMIT = 10000
const OWNER = 'bgarden-owner'

type Status = '' | 'sync' | 'deleteFailed'

let queue: Promise<void> = Promise.resolve()
let signingIn: Promise<void> | undefined

const norm = (p: unknown) => JSON.stringify(parseProgress(p))
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

function owner(uid?: string) {
  try {
    if (uid) localStorage.setItem(OWNER, uid)
    return localStorage.getItem(OWNER)
  } catch {
    return null
  }
}

export function useCloudSync() {
  const auth = useAuth()
  const { progress } = useProgress()
  const { $firebase } = useNuxtApp()
  const saved = useState<string>('cloud-saved', () => '')
  const status = useState<Status>('cloud-status', () => '')

  async function run(uid: string) {
    const { db } = await $firebase()
    const fs = await import('firebase/firestore')
    const ref = fs.doc(db, 'brainGames', uid)
    const before = norm(progress.value)
    const merged = await fs.runTransaction(db, async tx => {
      const local = parseProgress(progress.value)
      if (!local) throw new Error('invalid local progress')
      const snap = await tx.get(ref)
      if (!snap.exists()) {
        tx.set(ref, local)
        return local
      }
      const cloud = parseProgress(snap.data())
      if (!cloud) throw new Error('invalid cloud progress')
      const next = mergeProgress(local, cloud)
      if (norm(next) !== norm(cloud)) tx.set(ref, next)
      return next
    })
    progress.value = norm(progress.value) === before ? merged : mergeProgress(progress.value, merged)
    saved.value = norm(merged)
    owner(uid)
  }

  function sync(force = false) {
    queue = queue.then(async () => {
      const uid = auth.user.value?.uid
      if (!uid || (!force && norm(progress.value) === saved.value)) return
      try {
        await Promise.race([run(uid), wait(LIMIT).then(() => Promise.reject(new Error('timeout')))])
        status.value = ''
      } catch {
        status.value = 'sync'
      }
    })
    return queue
  }

  function adopt(uid: string) {
    const prev = owner()
    if (!prev || prev === uid) return
    progress.value = { name: '', av: '🦉', best: {}, hist: [], days: [], xp: 0, theme: progress.value.theme }
    saved.value = ''
  }

  function signIn() {
    signingIn ??= (async () => {
      const user = await auth.signIn()
      if (!user) return
      adopt(user.uid)
      await sync(true)
    })().finally(() => (signingIn = undefined))
    return signingIn
  }

  const save = () => sync()

  async function signOut() {
    await Promise.race([sync(), wait(WAIT)])
    try {
      await auth.signOut()
    } finally {
      saved.value = ''
      status.value = ''
    }
  }

  async function deleteCloud() {
    const uid = auth.user.value?.uid
    if (!uid) return
    try {
      const { db } = await $firebase()
      const fs = await import('firebase/firestore')
      const removed = fs.deleteDoc(fs.doc(db, 'brainGames', uid))
      await Promise.race([removed, wait(WAIT).then(() => Promise.reject(new Error('timeout')))])
      await auth.signOut()
      saved.value = ''
      status.value = ''
    } catch {
      status.value = 'deleteFailed'
    }
  }

  function start() {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') sync()
    }
    const onLeave = () => sync()
    let timer: ReturnType<typeof setInterval> | undefined
    onMounted(async () => {
      document.addEventListener('visibilitychange', onHidden)
      window.addEventListener('pagehide', onLeave)
      timer = setInterval(onLeave, FIVE_MINUTES)
      const user = await auth.restore()
      if (!user) return
      adopt(user.uid)
      await sync(true)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('visibilitychange', onHidden)
      window.removeEventListener('pagehide', onLeave)
      clearInterval(timer)
    })
  }

  return { status, start, signIn, save, signOut, deleteCloud }
}

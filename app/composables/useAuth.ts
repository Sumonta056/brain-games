import type { User } from 'firebase/auth'
import copy from '~/data/copy.json'

export interface AuthUser {
  uid: string
  name: string
  email: string
  photo: string
}

const HINT = 'bgarden-auth'
const QUIET = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request']

const toUser = (u: User): AuthUser => ({
  uid: u.uid,
  name: u.displayName ?? '',
  email: u.email ?? '',
  photo: u.photoURL ?? ''
})

function hint(on?: boolean) {
  try {
    if (on === undefined) return localStorage.getItem(HINT) === '1'
    if (on) localStorage.setItem(HINT, '1')
    else localStorage.removeItem(HINT)
  } catch {
    /* storage blocked */
  }
  return false
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const error = useState<string>('auth-error', () => '')
  const ready = useState<boolean>('auth-ready', () => false)
  const { $firebase } = useNuxtApp()

  async function restore() {
    try {
      if (!hint()) return null
      const { auth } = await $firebase()
      await auth.authStateReady()
      user.value = auth.currentUser ? toUser(auth.currentUser) : null
      if (!user.value) hint(false)
      return user.value
    } catch {
      return null
    } finally {
      ready.value = true
    }
  }

  async function signIn() {
    error.value = ''
    try {
      const { auth } = await $firebase()
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
      const result = await signInWithPopup(auth, new GoogleAuthProvider())
      user.value = toUser(result.user)
      error.value = ''
      hint(true)
      return user.value
    } catch (e) {
      const code = (e as { code?: string }).code ?? ''
      error.value = QUIET.includes(code)
        ? ''
        : code === 'auth/popup-blocked'
          ? copy.account.errors.popup
          : copy.account.errors.generic
      return null
    }
  }

  async function signOut() {
    const { auth } = await $firebase()
    const { signOut: fbSignOut } = await import('firebase/auth')
    await fbSignOut(auth)
    user.value = null
    hint(false)
  }

  const preload = () => $firebase().catch(() => undefined)

  return { user, error, ready, restore, signIn, signOut, preload }
}

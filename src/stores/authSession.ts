import { createRoot } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { UserDTO } from '../types/api'

/** フロントエンドが保持する認証セッションの解決状態。 */
export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated' | 'error'

type AuthState = {
  status: AuthStatus
  user: UserDTO | null
}

export const [authSession, setAuthSession] = createRoot(() =>
  createStore<AuthState>({ status: 'unknown', user: null })
)

export const getAuthStatus = (): AuthStatus => authSession.status

export const getAuthenticatedUser = (): UserDTO | null => authSession.user

export const setAuthenticatedUser = (user: UserDTO) => {
  setAuthSession({ status: 'authenticated', user })
}

export const clearAuthenticatedUser = () => {
  setAuthSession({ status: 'unauthenticated', user: null })
}

/**
 * 既知ユーザーを保持したまま、APIによる認証再検証が必要な状態へ移す。
 *
 * @returns なし。
 */
export const setAuthSessionError = () => {
  setAuthSession({ status: 'error' })
}

export const resetAuthSession = () => {
  setAuthSession({ status: 'unknown', user: null })
}

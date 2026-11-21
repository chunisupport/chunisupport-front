import { createRoot } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { UserDTO } from '../types/api'

/** フロントエンドが保持する認証セッションの解決状態 */
export type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated' | 'error'

type AuthState = {
  status: AuthStatus
  user: UserDTO | null
}

export const [authSession, setAuthSession] = createRoot(() =>
  createStore<AuthState>({ status: 'unknown', user: null })
)

let sessionRevision = 0

/** @returns 認証確認中に別の操作で状態が変わったかを照合する世代。 */
export const getSessionRevision = (): number => sessionRevision

/** 強制再確認の開始時に旧応答を無効にし、取得共有に使う新しい世代を返す。 */
export const advanceSessionRevision = (): number => ++sessionRevision

export const getAuthStatus = (): AuthStatus => authSession.status

export const getAuthenticatedUser = (): UserDTO | null => authSession.user

export const setAuthenticatedUser = (user: UserDTO) => {
  sessionRevision++
  setAuthSession({ status: 'authenticated', user })
}

export const clearAuthenticatedUser = () => {
  sessionRevision++
  setAuthSession({ status: 'unauthenticated', user: null })
}

/**
 * 既知ユーザーを保持したまま、APIによる認証再検証が必要な状態へ移す。
 *
 * @returns なし。
 */
export const setAuthSessionError = () => {
  sessionRevision++
  setAuthSession({ status: 'error' })
}

export const resetAuthSession = () => {
  sessionRevision++
  setAuthSession({ status: 'unknown', user: null })
}

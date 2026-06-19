import {
  clearAuthenticatedUser,
  getAuthStatus,
  setAuthenticatedUser,
  setAuthSessionError,
} from '../../stores/authSession.ts'
import type { UserDTO } from '../../types/api.ts'

export type AuthResolution = 'authenticated' | 'unauthenticated' | 'error'
export type FetchCurrentUser = () => Promise<UserDTO>
type ResolveAuthSessionOptions = {
  forceRefresh?: boolean
}

// fetchWithAuth が付与する status/code プロパティで 401 系エラーを判定する
const AUTH_ERROR_CODES = [
  'unauthorized',
  'invalid_token',
  'token_expired',
  'missing_token',
] as const

const isAuthError = (error: unknown): boolean => {
  const e = error as Partial<{ status: number; code: string }>
  if (typeof e?.status === 'number' && e.status === 401) return true
  return typeof e?.code === 'string' && (AUTH_ERROR_CODES as readonly string[]).includes(e.code)
}

let inFlightResolution: Promise<AuthResolution> | null = null

const resolveWithFetcher = async (fetchCurrentUser: FetchCurrentUser): Promise<AuthResolution> => {
  try {
    const user = await fetchCurrentUser()
    setAuthenticatedUser(user)
    return 'authenticated'
  } catch (error) {
    if (isAuthError(error)) {
      clearAuthenticatedUser()
      return 'unauthenticated'
    }
    // ネットワーク障害・5xx などの一時的なエラーはセッション状態をクリアしない
    setAuthSessionError()
    return 'error'
  }
}

export const resolveAuthSession = (
  fetchCurrentUser: FetchCurrentUser,
  options: ResolveAuthSessionOptions = {}
): Promise<AuthResolution> => {
  if (!options.forceRefresh) {
    const authStatus = getAuthStatus()
    if (authStatus === 'authenticated' || authStatus === 'unauthenticated') {
      return Promise.resolve(authStatus)
    }

    if (inFlightResolution) {
      return inFlightResolution
    }
  }

  const resolution = resolveWithFetcher(fetchCurrentUser).finally(() => {
    if (inFlightResolution === resolution) {
      inFlightResolution = null
    }
  })

  inFlightResolution = resolution
  return resolution
}

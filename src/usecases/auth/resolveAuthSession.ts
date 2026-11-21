import {
  clearAuthenticatedUser,
  getAuthStatus,
  getSessionRevision,
  setAuthenticatedUser,
  setAuthSessionError,
} from '../../stores/authSession.ts'
import type { UserDTO } from '../../types/api.ts'

export type AuthResolution = 'authenticated' | 'unauthenticated' | 'error'
export type FetchCurrentUser = () => Promise<UserDTO>
type ResolveAuthSessionOptions = {
  forceRefresh?: boolean
  /** 自分の応答が破棄された場合に、遷移など要求固有の後続処理を取り消す。 */
  onSuperseded?: () => void
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
let inFlightRevision = 0

/** 認証確認を共有し、強制再確認やログアウト以前の応答を破棄する。
 * @param fetchCurrentUser - 本人情報の取得処理。
 * @param options - 強制再確認の指定。
 * @returns 最新の認証判定。
 */
export const resolveAuthSession = (
  fetchCurrentUser: FetchCurrentUser,
  options: ResolveAuthSessionOptions = {}
): Promise<AuthResolution> => {
  const revision = getSessionRevision()
  if (!options.forceRefresh) {
    if (inFlightResolution && inFlightRevision === revision) return inFlightResolution
    const status = getAuthStatus()
    if (status === 'authenticated' || status === 'unauthenticated') return Promise.resolve(status)
  }

  const isCurrent = () => inFlightResolution === resolution && getSessionRevision() === revision
  const latest = (): AuthResolution | Promise<AuthResolution> => {
    options.onSuperseded?.()
    if (inFlightResolution && inFlightResolution !== resolution) return inFlightResolution
    const status = getAuthStatus()
    return status === 'unknown' ? 'error' : status
  }

  const resolution: Promise<AuthResolution> = Promise.resolve()
    .then(async (): Promise<AuthResolution> => {
      try {
        const user = await fetchCurrentUser()
        if (!isCurrent()) return latest()
        setAuthenticatedUser(user)
        return 'authenticated'
      } catch (error) {
        if (!isCurrent()) return latest()
        if (isAuthError(error)) {
          clearAuthenticatedUser()
          return 'unauthenticated'
        }
        setAuthSessionError()
        return 'error'
      }
    })
    .finally(() => {
      if (inFlightResolution === resolution) {
        inFlightResolution = null
      }
    })

  inFlightRevision = revision
  inFlightResolution = resolution
  return resolution
}

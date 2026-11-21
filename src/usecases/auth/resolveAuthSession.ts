import { appQueryClient } from '../../lib/queryClient'
import { authSessionQueryOptions, pendingAuthResolution } from '../../queries/authSession'
import {
  advanceSessionRevision,
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

/** 認証確認を共有し、強制再確認やログアウト以前の応答を破棄する。
 * @param fetchCurrentUser - 本人情報の取得処理。
 * @param options - 強制再確認の指定。
 * @returns 最新の認証判定。
 */
export const resolveAuthSession = async (
  fetchCurrentUser: FetchCurrentUser,
  options: ResolveAuthSessionOptions = {}
): Promise<AuthResolution> => {
  const revision = options.forceRefresh ? advanceSessionRevision() : getSessionRevision()
  const pending = pendingAuthResolution(revision)
  const status = getAuthStatus()
  if (
    !options.forceRefresh &&
    !pending &&
    (status === 'authenticated' || status === 'unauthenticated')
  )
    return status

  const applied = await (pending ??
    appQueryClient.fetchQuery(
      authSessionQueryOptions(revision, async () => {
        try {
          const user = await fetchCurrentUser()
          if (getSessionRevision() !== revision) return revision
          setAuthenticatedUser(user)
        } catch (error) {
          if (getSessionRevision() !== revision) return revision
          if (isAuthError(error)) clearAuthenticatedUser()
          else setAuthSessionError()
        }
        return getSessionRevision()
      })
    ))
  if (applied !== getSessionRevision()) {
    options.onSuperseded?.()
    // 旧要求の呼び出し元にも、後続の強制再確認が確定した状態を返す。
    let next = pendingAuthResolution(getSessionRevision())
    while (next) {
      await next
      next = pendingAuthResolution(getSessionRevision())
    }
  }
  const resolved = getAuthStatus()
  return resolved === 'unknown' ? 'error' : resolved
}

import { LOGIN_PATH } from '../constants/routes'
import { auth } from '../lib/firebase'
import { clearAuthenticatedUser } from '../stores/authSession'
import { type ErrorCode, type ErrorResponse, getErrorMessage } from '../types/api'
import { buildLoginRedirectPath } from '../usecases/auth/redirectPath'
import { buildCurrentPath } from '../utils/currentPath'

type FetchWithAuthOptions = RequestInit & {
  requireAuthentication?: boolean
  redirectOnUnauthorized?: boolean
  suppressUnauthorizedRedirectForCodes?: readonly ErrorCode[]
}

const AUTH_ERROR_CODES: ErrorCode[] = [
  'unauthorized',
  'invalid_token',
  'token_expired',
  'missing_token',
]

const shouldRedirectToLogin = (status: number, error?: ErrorResponse): boolean => {
  const code = error?.error?.code as ErrorCode | undefined
  return status === 401 || (typeof code !== 'undefined' && AUTH_ERROR_CODES.includes(code))
}

export const shouldClearSessionOnUnauthorized = (
  status: number,
  error?: ErrorResponse,
  options: Pick<
    FetchWithAuthOptions,
    'redirectOnUnauthorized' | 'suppressUnauthorizedRedirectForCodes'
  > = {}
): boolean => {
  const { redirectOnUnauthorized = true, suppressUnauthorizedRedirectForCodes = [] } = options
  const errorCode = error?.error?.code as ErrorCode | undefined
  const shouldSuppressUnauthorizedRedirect =
    typeof errorCode !== 'undefined' && suppressUnauthorizedRedirectForCodes.includes(errorCode)

  return (
    redirectOnUnauthorized &&
    !shouldSuppressUnauthorizedRedirect &&
    shouldRedirectToLogin(status, error)
  )
}

const redirectToLogin = () => {
  if (typeof window === 'undefined' || window.location.pathname === LOGIN_PATH) {
    return
  }

  const currentPath = buildCurrentPath(window.location)
  window.location.replace(buildLoginRedirectPath(currentPath))
}

const getFirebaseIdToken = async (): Promise<string | null> => {
  await auth.authStateReady()
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

/**
 * Firebase 認証トークンを付与して API を呼び出す。
 *
 * @param input - リクエスト先。
 * @param init - fetch オプションと認証エラー時の挙動。
 * @returns API レスポンス。
 */
export const fetchWithAuth = async (
  input: string | URL,
  init: FetchWithAuthOptions = {}
): Promise<Response> => {
  const {
    requireAuthentication = false,
    redirectOnUnauthorized = true,
    suppressUnauthorizedRedirectForCodes = [],
    ...requestInit
  } = init

  const token = await getFirebaseIdToken()
  if (requireAuthentication && !token) {
    clearAuthenticatedUser()
    if (redirectOnUnauthorized) {
      redirectToLogin()
    }

    const error = new Error(getErrorMessage({ error: { code: 'missing_token' } })) as Error & {
      status?: number
      code?: string
    }
    error.status = 401
    error.code = 'missing_token'
    throw error
  }

  const headers = new Headers(requestInit.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(input, {
    ...requestInit,
    headers,
  })

  if (!response.ok) {
    let error: ErrorResponse | undefined

    try {
      error = (await response.json()) as ErrorResponse
    } catch {
      // ignore
    }

    if (
      shouldClearSessionOnUnauthorized(response.status, error, {
        redirectOnUnauthorized,
        suppressUnauthorizedRedirectForCodes,
      })
    ) {
      clearAuthenticatedUser()
      redirectToLogin()
    }

    const apiError = new Error(
      error ? getErrorMessage(error) : 'リクエストに失敗しました'
    ) as Error & {
      status?: number
      code?: string
    }
    apiError.status = response.status
    apiError.code = error?.error?.code
    throw apiError
  }

  return response
}

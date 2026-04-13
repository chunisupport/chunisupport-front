import { auth } from '../lib/firebase'
import { clearAuthenticatedUser } from '../stores/authSession'
import { type ErrorCode, type ErrorResponse, getErrorMessage } from '../types/api'

type FetchWithAuthOptions = RequestInit & {
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
  if (typeof window === 'undefined' || window.location.pathname === '/login') {
    return
  }

  window.location.replace('/login')
}

const getFirebaseIdToken = async (): Promise<string | null> => {
  await auth.authStateReady()
  const user = auth.currentUser
  if (!user) return null
  return user.getIdToken()
}

export const fetchWithAuth = async (
  input: string | URL,
  init: FetchWithAuthOptions = {}
): Promise<Response> => {
  const {
    redirectOnUnauthorized = true,
    suppressUnauthorizedRedirectForCodes = [],
    ...requestInit
  } = init

  const token = await getFirebaseIdToken()
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
      error ? getErrorMessage(error) : response.statusText || `HTTP ${response.status}`
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

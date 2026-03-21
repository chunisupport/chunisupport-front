import { getErrorMessage, type ErrorCode, type ErrorResponse } from '../types/api'
import { clearAuthenticatedUser } from '../stores/authSession'
import { clearAllUserProfileCacheStorage } from '../utils/userProfileCacheStorage'

type FetchWithAuthOptions = RequestInit & {
  redirectOnUnauthorized?: boolean
}

const AUTH_ERROR_CODES: ErrorCode[] = [
  'unauthorized',
  'invalid_token',
  'token_expired',
  'missing_token',
  'invalid_session',
]

const shouldRedirectToLogin = (status: number, error?: ErrorResponse): boolean => {
  const code = error?.error?.code as ErrorCode | undefined
  return status === 401 || (typeof code !== 'undefined' && AUTH_ERROR_CODES.includes(code))
}

const redirectToLogin = () => {
  if (typeof window === 'undefined' || window.location.pathname === '/login') {
    return
  }

  window.location.replace('/login')
}

export const fetchWithAuth = async (
  input: string | URL,
  init: FetchWithAuthOptions = {}
): Promise<Response> => {
  const { redirectOnUnauthorized = true, ...requestInit } = init
  const response = await fetch(input, {
    ...requestInit,
    credentials: 'include',
  })

  if (!response.ok) {
    let error: ErrorResponse | undefined

    try {
      error = (await response.json()) as ErrorResponse
    } catch {
      // ignore
    }

    if (redirectOnUnauthorized && shouldRedirectToLogin(response.status, error)) {
      clearAuthenticatedUser()
      clearAllUserProfileCacheStorage()
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

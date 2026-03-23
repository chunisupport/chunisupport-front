import type { UserDTO } from '../types/api'

type AuthStatus = 'unknown' | 'authenticated' | 'unauthenticated'

let authStatus: AuthStatus = 'unknown'
let authenticatedUser: UserDTO | null = null

export const getAuthStatus = (): AuthStatus => authStatus

export const getAuthenticatedUser = (): UserDTO | null => authenticatedUser

export const setAuthenticatedUser = (user: UserDTO) => {
  authStatus = 'authenticated'
  authenticatedUser = user
}

export const clearAuthenticatedUser = () => {
  authStatus = 'unauthenticated'
  authenticatedUser = null
}

export const resetAuthSession = () => {
  authStatus = 'unknown'
  authenticatedUser = null
}

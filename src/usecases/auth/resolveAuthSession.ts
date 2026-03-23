import {
  clearAuthenticatedUser,
  getAuthStatus,
  setAuthenticatedUser,
} from '../../stores/authSession.ts'
import type { UserDTO } from '../../types/api.ts'

export type AuthResolution = 'authenticated' | 'unauthenticated'
export type FetchCurrentUser = () => Promise<UserDTO>
type ResolveAuthSessionOptions = {
  forceRefresh?: boolean
}

let inFlightResolution: Promise<AuthResolution> | null = null

const resolveWithFetcher = async (fetchCurrentUser: FetchCurrentUser): Promise<AuthResolution> => {
  try {
    const user = await fetchCurrentUser()
    setAuthenticatedUser(user)
    return 'authenticated'
  } catch {
    clearAuthenticatedUser()
    return 'unauthenticated'
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

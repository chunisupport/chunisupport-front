import { type FetchUserProfileOptions, fetchUserProfile, fetchUserUpdatedAt } from '../api/users'
import { getAuthenticatedUser } from '../stores/authSession'
import type { UserProfileWithRecordsDTO } from '../types/api'
import { createLocalStorageCache } from './cache/createLocalStorageCache'
import {
  clearAllUserProfileCacheStorage,
  clearLegacyUserProfileCacheStorage,
  USER_PROFILE_CACHE_NAMESPACE,
  USER_PROFILE_CACHE_VERSION,
} from './userProfileCacheStorage'

type UserProfileCacheArg = {
  authenticatedUsername: string
  username: string
  options?: FetchUserProfileOptions
}

const getUserProfileCacheKeyParts = (
  authenticatedUsername: string,
  username: string,
  options: FetchUserProfileOptions = {}
): string[] => {
  const view = options.view ?? 'default'
  const includeNoPlay = options.includeNoPlay ? 'with-noplay' : 'without-noplay'

  return [authenticatedUsername, 'self', username, view, includeNoPlay]
}

const userProfileCache = createLocalStorageCache<UserProfileCacheArg, UserProfileWithRecordsDTO>({
  namespace: USER_PROFILE_CACHE_NAMESPACE,
  version: USER_PROFILE_CACHE_VERSION,
  getKey: ({ authenticatedUsername, username, options = {} }) =>
    getUserProfileCacheKeyParts(authenticatedUsername, username, options),
  fetcher: ({ username, options = {} }) => fetchUserProfile(username, options),
  shouldUseCache: (entry) => Boolean(entry.data?.updated_at),
  revalidate: async (entry, { username }) => {
    const latest = await fetchUserUpdatedAt(username)
    return entry.data.updated_at === latest.updated_at
  },
})

clearLegacyUserProfileCacheStorage()

export const clearCachedUserProfiles = (username?: string): void => {
  if (username) {
    userProfileCache.invalidateByPartialKey([username])
    return
  }

  userProfileCache.invalidateAll()
  clearAllUserProfileCacheStorage()
}

export const fetchUserProfileWithCache = async (
  username: string,
  options: FetchUserProfileOptions = {}
): Promise<UserProfileWithRecordsDTO> => {
  const authenticatedUsername = getAuthenticatedUser()?.username

  if (!authenticatedUsername || authenticatedUsername !== username) {
    return fetchUserProfile(username, options)
  }

  return userProfileCache.get({ authenticatedUsername, username, options })
}

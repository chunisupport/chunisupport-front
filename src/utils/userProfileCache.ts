import { type FetchUserProfileOptions, fetchUserProfile, fetchUserUpdatedAt } from '../api/users'
import type { UserProfileWithRecordsDTO } from '../types/api'
import { createLocalStorageCache } from './cache/createLocalStorageCache'

type UserProfileCacheArg = {
  username: string
  options?: FetchUserProfileOptions
}

const getUserProfileCacheKeyParts = (
  username: string,
  options: FetchUserProfileOptions = {}
): string[] => {
  const view = options.view ?? 'default'
  const includeNoPlay = options.includeNoPlay ? 'with-noplay' : 'without-noplay'

  return [username, view, includeNoPlay]
}

const userProfileCache = createLocalStorageCache<UserProfileCacheArg, UserProfileWithRecordsDTO>({
  namespace: 'user_profile_cache',
  version: 1,
  getKey: ({ username, options = {} }) => getUserProfileCacheKeyParts(username, options),
  fetcher: ({ username, options = {} }) => fetchUserProfile(username, options),
  shouldUseCache: (entry) => Boolean(entry.data?.updated_at),
  revalidate: async (entry, { username }) => {
    const latest = await fetchUserUpdatedAt(username)
    return entry.data.updated_at === latest.updated_at
  },
})

export const clearCachedUserProfiles = (username?: string): void => {
  if (username) {
    userProfileCache.invalidateByPartialKey([username])
    return
  }

  userProfileCache.invalidateAll()
}

export const fetchUserProfileWithCache = async (
  username: string,
  options: FetchUserProfileOptions = {}
): Promise<UserProfileWithRecordsDTO> => {
  return userProfileCache.get({ username, options })
}

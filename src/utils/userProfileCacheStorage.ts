import { localStorageStore } from './storage/localStorageStore'

export const USER_PROFILE_CACHE_NAMESPACE = 'user_profile_cache'
export const USER_PROFILE_CACHE_VERSION = 2

const buildNamespacePrefix = (version: number): string =>
  `${USER_PROFILE_CACHE_NAMESPACE}:v${version}`

const removeNamespace = (version: number): void => {
  const namespacePrefix = buildNamespacePrefix(version)
  localStorageStore.removeByPrefix(`${namespacePrefix}:`)
  localStorageStore.removeItem(namespacePrefix)
}

export const clearAllUserProfileCacheStorage = (): void => {
  removeNamespace(1)
  removeNamespace(USER_PROFILE_CACHE_VERSION)
}

export const clearLegacyUserProfileCacheStorage = (): void => {
  removeNamespace(1)
}
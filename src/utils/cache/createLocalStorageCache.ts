import { localStorageStore } from '../storage/localStorageStore'
import type { CacheEnvelope, CacheKeyPart, CachePolicy, LocalStorageCache } from './types'

const encodeCacheKeyPart = (part: CacheKeyPart): string => encodeURIComponent(String(part))

const buildNamespacePrefix = (namespace: string, version: number): string =>
  `${namespace}:v${version}`

const isCacheEnvelope = <T>(value: unknown, version: number): value is CacheEnvelope<T> => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<CacheEnvelope<T>>
  return (
    typeof candidate.cachedAt === 'number' &&
    typeof candidate.version === 'number' &&
    candidate.version === version &&
    'data' in candidate
  )
}

export const createLocalStorageCache = <TArg, TData>(
  policy: CachePolicy<TArg, TData>
): LocalStorageCache<TArg, TData> => {
  const namespacePrefix = buildNamespacePrefix(policy.namespace, policy.version)

  const buildCacheKeyFromParts = (parts: CacheKeyPart[]): string => {
    const encodedParts = parts.map(encodeCacheKeyPart)
    return [namespacePrefix, ...encodedParts].join(':')
  }

  const getCacheKey = (arg: TArg): string => buildCacheKeyFromParts(policy.getKey(arg))

  const readEntry = (arg: TArg): CacheEnvelope<TData> | null => {
    const cacheKey = getCacheKey(arg)
    const value = localStorageStore.getItem<CacheEnvelope<TData>>(cacheKey)

    if (!isCacheEnvelope<TData>(value, policy.version)) {
      if (value !== null) {
        localStorageStore.removeItem(cacheKey)
      }
      return null
    }

    return value
  }

  const isExpired = (entry: CacheEnvelope<TData>): boolean => {
    if (typeof policy.ttlMs === 'undefined') {
      return false
    }

    return Date.now() - entry.cachedAt > policy.ttlMs
  }

  const writeEntry = (arg: TArg, data: TData): void => {
    const cacheKey = getCacheKey(arg)
    const entry: CacheEnvelope<TData> = {
      data,
      cachedAt: Date.now(),
      version: policy.version,
    }

    const didWrite = localStorageStore.setItem(cacheKey, entry)
    if (!didWrite) {
      policy.onWriteError?.(new Error(`Failed to write cache entry: ${cacheKey}`))
    }
  }

  return {
    async get(arg: TArg): Promise<TData> {
      const entry = readEntry(arg)

      if (entry && !isExpired(entry) && (policy.shouldUseCache?.(entry, arg) ?? true)) {
        if (!policy.revalidate) {
          return entry.data
        }

        try {
          if (await policy.revalidate(entry, arg)) {
            return entry.data
          }
        } catch {
          return entry.data
        }
      }

      const freshData = await policy.fetcher(arg)
      writeEntry(arg, freshData)
      return freshData
    },

    peek(arg: TArg): TData | null {
      const entry = readEntry(arg)
      if (!entry || isExpired(entry)) {
        return null
      }

      if (policy.shouldUseCache && !policy.shouldUseCache(entry, arg)) {
        return null
      }

      return entry.data
    },

    set(arg: TArg, data: TData): void {
      writeEntry(arg, data)
    },

    invalidate(arg: TArg): void {
      localStorageStore.removeItem(getCacheKey(arg))
    },

    invalidateAll(): void {
      localStorageStore.removeByPrefix(`${namespacePrefix}:`)
      localStorageStore.removeItem(namespacePrefix)
    },

    invalidateByPartialKey(parts: CacheKeyPart[]): void {
      if (parts.length === 0) {
        this.invalidateAll()
        return
      }

      localStorageStore.removeByPrefix(`${buildCacheKeyFromParts(parts)}:`)
      localStorageStore.removeItem(buildCacheKeyFromParts(parts))
    },

    getCacheKey,
  }
}

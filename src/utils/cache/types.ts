export type CacheKeyPart = string | number | boolean | null | undefined

export type CacheEnvelope<T> = {
  data: T
  cachedAt: number
  version: number
}

export type CachePolicy<TArg, TData> = {
  namespace: string
  version: number
  getKey: (arg: TArg) => CacheKeyPart[]
  fetcher: (arg: TArg) => Promise<TData>
  ttlMs?: number
  shouldUseCache?: (entry: CacheEnvelope<TData>, arg: TArg) => boolean
  revalidate?: (entry: CacheEnvelope<TData>, arg: TArg) => Promise<boolean>
  onWriteError?: (error: unknown) => void
}

export type LocalStorageCache<TArg, TData> = {
  get: (arg: TArg) => Promise<TData>
  peek: (arg: TArg) => TData | null
  set: (arg: TArg, data: TData) => void
  invalidate: (arg: TArg) => void
  invalidateAll: () => void
  invalidateByPartialKey: (parts: CacheKeyPart[]) => void
  getCacheKey: (arg: TArg) => string
}

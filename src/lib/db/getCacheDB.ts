import type { CacheDB } from './cacheSchema'

/**
 * フロントエンドキャッシュ用 IndexedDB を取得する。
 * Dexie を初期バンドルから外すため、初回のキャッシュ読み書き時に動的 import する。
 *
 * @returns Dexie インスタンス。
 */
export const getCacheDB = async (): Promise<CacheDB> => (await import('./cacheDB')).db

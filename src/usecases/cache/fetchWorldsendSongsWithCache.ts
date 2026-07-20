import { fetchSongsUpdatedAt, fetchWorldsendSongs } from '../../api/songs'
import {
  getSongCacheGeneration,
  readCachedWorldsendSongs,
  replaceCachedWorldsendSongs,
} from '../../repositories/songCacheRepository'
import type { WorldsendSongDTO } from '../../types/api'

type WorldsendSongsResponse = { songs: WorldsendSongDTO[] }

/** WORLD'S END 楽曲取得時の IndexedDB キャッシュ利用方法。 */
type FetchWorldsendSongsWithCacheOptions = {
  /** IndexedDB の既存キャッシュを参照せず API から再取得するか。 */
  forceRefresh?: boolean
}

/**
 * WORLD'S END 楽曲一覧を IndexedDB キャッシュ判定付きで取得する。
 *
 * @param options - キャッシュ利用方法。
 * @returns キャッシュ、または API から取得した WORLD'S END 楽曲一覧レスポンス。
 */
export const fetchWorldsendSongsWithCache = async (
  options: FetchWorldsendSongsWithCacheOptions = {}
): Promise<WorldsendSongsResponse> => {
  const cacheGeneration = getSongCacheGeneration()
  let songsUpdatedAt: string | null

  try {
    songsUpdatedAt = (await fetchSongsUpdatedAt()).updated_at
  } catch {
    return fetchWorldsendSongs()
  }

  if (!options.forceRefresh) {
    try {
      const cachedSongs = await readCachedWorldsendSongs(songsUpdatedAt)
      if (cachedSongs) {
        return { songs: cachedSongs }
      }
    } catch {
      return fetchWorldsendSongs()
    }
  }

  const response = await fetchWorldsendSongs()

  try {
    await replaceCachedWorldsendSongs(response.songs, songsUpdatedAt, cacheGeneration)
  } catch {
    // IndexedDB への保存失敗は画面表示を止めない。
  }

  return response
}

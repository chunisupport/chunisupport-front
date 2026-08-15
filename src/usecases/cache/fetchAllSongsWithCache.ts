import { fetchAllSongs, fetchSongsUpdatedAt } from '../../api/songs'
import {
  getSongCacheGeneration,
  readCachedSongs,
  replaceCachedSongs,
} from '../../repositories/songCacheRepository'
import type { SongDTO } from '../../types/api'

type AllSongsResponse = { songs: SongDTO[] }

/** 通常楽曲取得時の IndexedDB キャッシュ利用方法。 */
type FetchAllSongsWithCacheOptions = {
  /** IndexedDB の既存キャッシュを参照せず API から再取得するか。 */
  forceRefresh?: boolean
}

/**
 * 通常楽曲一覧を IndexedDB キャッシュ判定付きで取得する。
 *
 * @param options - キャッシュ利用方法。
 * @returns キャッシュ、または API から取得した通常楽曲一覧レスポンス。
 */
export const fetchAllSongsWithCache = async (
  options: FetchAllSongsWithCacheOptions = {}
): Promise<AllSongsResponse> => {
  const cacheGeneration = getSongCacheGeneration()
  let songsUpdatedAt: string | null

  try {
    songsUpdatedAt = (await fetchSongsUpdatedAt()).updated_at
  } catch {
    return fetchAllSongs()
  }

  if (!options.forceRefresh) {
    try {
      const cachedSongs = await readCachedSongs(songsUpdatedAt)
      if (cachedSongs) {
        return { songs: cachedSongs }
      }
    } catch {
      return fetchAllSongs()
    }
  }

  const response = await fetchAllSongs()

  try {
    await replaceCachedSongs(response.songs, songsUpdatedAt, cacheGeneration)
  } catch {
    // IndexedDB への保存失敗は画面表示を止めない。
  }

  return response
}

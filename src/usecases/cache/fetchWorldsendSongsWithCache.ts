import { fetchWorldsendSongs } from '../../api/songs'
import { fetchSongsUpdatedAt } from '../../queries/masterData'
import {
  getSongCacheGeneration,
  readCachedWorldsendSongs,
  replaceCachedWorldsendSongs,
} from '../../repositories/songCacheRepository'
import type { WorldsendSongDTO } from '../../types/api'

type WorldsendSongsResponse = { songs: WorldsendSongDTO[] }

/** WORLD'S END 楽曲取得時の IndexedDB キャッシュ利用方法 */
type FetchWorldsendSongsWithCacheOptions = {
  /** IndexedDB の既存キャッシュを参照せず API から再取得するか */
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
  let songsRevision: number

  try {
    songsRevision = (await fetchSongsUpdatedAt()).revision
  } catch {
    return fetchWorldsendSongs()
  }

  if (!options.forceRefresh) {
    try {
      const cachedSongs = await readCachedWorldsendSongs(songsRevision)
      if (cachedSongs) {
        return { songs: cachedSongs }
      }
    } catch {
      return fetchWorldsendSongs()
    }
  }

  const response = await fetchWorldsendSongs()

  try {
    await replaceCachedWorldsendSongs(response.songs, songsRevision, cacheGeneration)
  } catch {
    // IndexedDB への保存失敗は画面表示を止めない。
  }

  return response
}

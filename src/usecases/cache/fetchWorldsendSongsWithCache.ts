import { fetchWorldsendSongs } from '../../api/songs'
import { fetchSongsUpdatedAt } from '../../queries/masterData'
import {
  getSongCacheGeneration,
  readCachedWorldsendSongsSnapshot,
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
 * 変更世代の確認とキャッシュ読み込みは並行して行い、変更世代が一致すればキャッシュを返す。
 *
 * @param options - キャッシュ利用方法。
 * @returns キャッシュ、または API から取得した WORLD'S END 楽曲一覧レスポンス。
 */
export const fetchWorldsendSongsWithCache = async (
  options: FetchWorldsendSongsWithCacheOptions = {}
): Promise<WorldsendSongsResponse> => {
  const cacheGeneration = getSongCacheGeneration()
  const cachedSongsRequest = options.forceRefresh
    ? null
    : readCachedWorldsendSongsSnapshot().catch(() => null)
  const songsCacheState = await fetchSongsUpdatedAt().catch(() => undefined)
  // 更新確認の失敗時は、IndexedDB が開けず止まっている場合に備えて読み込みを待たない。
  if (!songsCacheState) return fetchWorldsendSongs()

  const cachedSongs = await cachedSongsRequest
  const songsRevision = songsCacheState.revision
  if (cachedSongs?.revision === songsRevision && cacheGeneration === getSongCacheGeneration()) {
    return { songs: cachedSongs.songs }
  }

  const response = await fetchWorldsendSongs()

  try {
    await replaceCachedWorldsendSongs(response.songs, songsRevision, cacheGeneration)
  } catch {
    // IndexedDB への保存失敗は画面表示を止めない。
  }

  return response
}

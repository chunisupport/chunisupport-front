import { fetchSongsUpdatedAt, fetchWorldsendSongs } from '../../api/songs'
import {
  readCachedWorldsendSongs,
  replaceCachedWorldsendSongs,
} from '../../repositories/songCacheRepository'
import type { WorldsendSongDTO } from '../../types/api'

type WorldsendSongsResponse = { songs: WorldsendSongDTO[] }

/**
 * WORLD'S END 楽曲一覧を IndexedDB キャッシュ判定付きで取得する。
 *
 * @returns キャッシュ、または API から取得した WORLD'S END 楽曲一覧レスポンス。
 */
export const fetchWorldsendSongsWithCache = async (): Promise<WorldsendSongsResponse> => {
  let songsUpdatedAt: string | null

  try {
    songsUpdatedAt = (await fetchSongsUpdatedAt()).updated_at
  } catch {
    return fetchWorldsendSongs()
  }

  try {
    const cachedSongs = await readCachedWorldsendSongs(songsUpdatedAt)
    if (cachedSongs) {
      return { songs: cachedSongs }
    }
  } catch {
    return fetchWorldsendSongs()
  }

  const response = await fetchWorldsendSongs()

  try {
    await replaceCachedWorldsendSongs(response.songs, songsUpdatedAt)
  } catch {
    // IndexedDB への保存失敗は画面表示を止めない。
  }

  return response
}

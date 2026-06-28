import { fetchAllSongs, fetchSongsUpdatedAt } from '../../api/songs.ts'
import { readCachedSongs, replaceCachedSongs } from '../../repositories/songCacheRepository.ts'
import type { SongDTO } from '../../types/api.ts'

type AllSongsResponse = { songs: SongDTO[] }

/**
 * 通常楽曲一覧を IndexedDB キャッシュ判定付きで取得する。
 *
 * @returns キャッシュ、または API から取得した通常楽曲一覧レスポンス。
 */
export const fetchAllSongsWithCache = async (): Promise<AllSongsResponse> => {
  let songsUpdatedAt: string | null

  try {
    songsUpdatedAt = (await fetchSongsUpdatedAt()).updated_at
  } catch {
    return fetchAllSongs()
  }

  try {
    const cachedSongs = await readCachedSongs(songsUpdatedAt)
    if (cachedSongs) {
      return { songs: cachedSongs }
    }
  } catch {
    return fetchAllSongs()
  }

  const response = await fetchAllSongs()

  try {
    await replaceCachedSongs(response.songs, songsUpdatedAt)
  } catch {
    // IndexedDB への保存失敗は画面表示を止めない。
  }

  return response
}

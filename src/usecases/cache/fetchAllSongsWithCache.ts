import { fetchAllSongs, fetchSongsUpdatedAt } from '../../api/songs'
import {
  getSongCacheGeneration,
  readCachedSongs,
  replaceCachedSongs,
} from '../../repositories/songCacheRepository'
import type { SongDTO } from '../../types/api'

type AllSongsResponse = { songs: SongDTO[] }

/** 通常楽曲取得時の IndexedDB キャッシュ利用方法 */
type FetchAllSongsWithCacheOptions = {
  /** IndexedDB の既存キャッシュを参照せず API から再取得するか */
  forceRefresh?: boolean
  /** 鮮度確認前のキャッシュを先行表示する通知。強制取得時は呼び出さない。 */
  onCached?: (response: AllSongsResponse) => void
}

/**
 * 通常楽曲一覧を取得し、任意の通知先にはキャッシュを鮮度確認より先に渡す。
 * キャッシュがない場合は更新日時と一覧を並列取得する。
 *
 * @param options - キャッシュ利用方法。
 * @returns キャッシュ、または API から取得した通常楽曲一覧レスポンス。
 */
export const fetchAllSongsWithCache = async (
  options: FetchAllSongsWithCacheOptions = {}
): Promise<AllSongsResponse> => {
  const cacheGeneration = getSongCacheGeneration()
  // 拒否を直ちに処理し、IndexedDB 読み込み中の未処理 rejection を防ぐ。
  let confirmedUpdatedAt: string | null | undefined
  const updatedAtRequest = fetchSongsUpdatedAt()
    .then((response) => {
      confirmedUpdatedAt = response.updated_at
      return response
    })
    .catch(() => undefined)
  const cachedSongs = options.forceRefresh ? null : await readCachedSongs().catch(() => null)
  if (cachedSongs && cacheGeneration === getSongCacheGeneration()) {
    options.onCached?.({ songs: cachedSongs })
  }

  // キャッシュがなければ鮮度確認を待たずに本体を取得する。
  const updatedAtBeforeFetch = confirmedUpdatedAt
  const songsRequest = cachedSongs ? undefined : fetchAllSongs()
  const [updatedAt, initialResponse] = await Promise.all([updatedAtRequest, songsRequest])
  if (updatedAt && cachedSongs) {
    const freshSongs = await readCachedSongs(updatedAt.updated_at).catch(() => null)
    if (freshSongs) {
      return { songs: freshSongs }
    }
  }

  const response = initialResponse ?? (await fetchAllSongs())
  if (updatedAt) {
    try {
      // 並列取得では一覧より後の更新日時を結び付けない。未確認として保存し、次回再検証する。
      const cacheUpdatedAt = songsRequest ? updatedAtBeforeFetch : updatedAt.updated_at
      await replaceCachedSongs(response.songs, cacheUpdatedAt, cacheGeneration)
    } catch {
      // IndexedDB への保存失敗は画面表示を止めない。
    }
  }
  return response
}

import { fetchAllSongs } from '../../api/songs'
import { fetchSongsUpdatedAt } from '../../queries/masterData'
import {
  getSongCacheGeneration,
  readCachedSongs,
  readCachedSongsWithoutFreshnessCheck,
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
 * キャッシュの鮮度は楽曲データの変更世代 (revision) の一致で判定し、キャッシュがない場合は変更世代と一覧を並列取得する。
 *
 * @param options - キャッシュ利用方法。
 * @returns キャッシュ、または API から取得した通常楽曲一覧レスポンス。
 */
export const fetchAllSongsWithCache = async (
  options: FetchAllSongsWithCacheOptions = {}
): Promise<AllSongsResponse> => {
  const cacheGeneration = getSongCacheGeneration()
  // 拒否を直ちに処理し、IndexedDB 読み込み中の未処理 rejection を防ぐ。
  let confirmedRevision: number | undefined
  const songsCacheStateRequest = fetchSongsUpdatedAt()
    .then((response) => {
      confirmedRevision = response.revision
      return response
    })
    .catch(() => undefined)
  const cachedSongs = options.forceRefresh
    ? null
    : await readCachedSongsWithoutFreshnessCheck().catch(() => null)
  if (cachedSongs && cacheGeneration === getSongCacheGeneration()) {
    options.onCached?.({ songs: cachedSongs })
  }

  // キャッシュがなければ鮮度確認を待たずに本体を取得する。
  const revisionBeforeFetch = confirmedRevision
  const songsRequest = cachedSongs ? undefined : fetchAllSongs()
  const [songsCacheState, initialResponse] = await Promise.all([
    songsCacheStateRequest,
    songsRequest,
  ])
  if (songsCacheState && cachedSongs) {
    const freshSongs = await readCachedSongs(songsCacheState.revision).catch(() => null)
    if (freshSongs) {
      return { songs: freshSongs }
    }
  }

  const response = initialResponse ?? (await fetchAllSongs())
  if (songsCacheState) {
    try {
      // 並列取得では一覧より後の変更世代を結び付けない。未確認として保存し、次回再検証する。
      const cacheRevision = songsRequest ? revisionBeforeFetch : songsCacheState.revision
      await replaceCachedSongs(response.songs, cacheRevision, cacheGeneration)
    } catch {
      // IndexedDB への保存失敗は画面表示を止めない。
    }
  }
  return response
}

import { createResource, createRoot, createSignal, untrack } from 'solid-js'
import { invalidateSongsUpdatedAtCache } from '../api/songs'
import { clearCachedSongData } from '../repositories/songCacheRepository'
import type { SongDTO, WorldsendSongDTO } from '../types/api'
import { fetchAllSongsWithCache } from '../usecases/cache/fetchAllSongsWithCache'
import { fetchWorldsendSongsWithCache } from '../usecases/cache/fetchWorldsendSongsWithCache'
import { compareSongsByReading } from '../utils/songTitleSorting'

/**
 * 楽曲 CRUD 後にメモリと IndexedDB の楽曲キャッシュを無効化する。
 *
 * @returns 無効化処理完了後に解決される Promise。
 */
const invalidateSongsDataCache = async (): Promise<void> => {
  invalidateSongsUpdatedAtCache()
  try {
    await clearCachedSongData()
  } catch {
    // IndexedDB の削除失敗時も、強制再取得と更新日時の再検証を継続する。
  }
}

/**
 * 共有楽曲データの遅延ロード・再取得状態を作成する。
 *
 * @returns 通常楽曲と WORLD'S END 楽曲の共有 resource と操作関数。
 */
const createSongsStore = () => {
  const [songsRequested, setSongsRequested] = createSignal(false)
  const [worldsendSongsRequested, setWorldsendSongsRequested] = createSignal(false)
  const [songsMustRefresh, setSongsMustRefresh] = createSignal(false)
  const [worldsendSongsMustRefresh, setWorldsendSongsMustRefresh] = createSignal(false)

  const [songsResponse, { refetch: refetchSongs }] = createResource<{ songs: SongDTO[] }, true>(
    () => (songsRequested() ? true : undefined),
    async (_requested, info) => {
      const response = await fetchAllSongsWithCache({
        forceRefresh: untrack(songsMustRefresh) || Boolean(info.refetching),
      })
      setSongsMustRefresh(false)
      return response
    }
  )
  const [worldsendSongsResponse, { refetch: refetchWorldsendSongs }] = createResource<
    { songs: WorldsendSongDTO[] },
    true
  >(
    () => (worldsendSongsRequested() ? true : undefined),
    async (_requested, info) => {
      const response = await fetchWorldsendSongsWithCache({
        forceRefresh: untrack(worldsendSongsMustRefresh) || Boolean(info.refetching),
      })
      setWorldsendSongsMustRefresh(false)
      return response
    }
  )

  /** 通常楽曲が未要求の場合に初回ロードを開始する。 */
  const ensureSongsLoaded = (): void => {
    setSongsRequested(true)
  }

  /** WORLD'S END 楽曲が未要求の場合に初回ロードを開始する。 */
  const ensureWorldsendSongsLoaded = (): void => {
    setWorldsendSongsRequested(true)
  }

  /** @returns 通常楽曲の初回要求前または取得中の場合は true。 */
  const isSongsLoading = (): boolean => !songsRequested() || songsResponse.loading

  /** @returns WORLD'S END 楽曲の初回要求前または取得中の場合は true。 */
  const isWorldsendSongsLoading = (): boolean =>
    !worldsendSongsRequested() || worldsendSongsResponse.loading

  /**
   * 楽曲 CRUD 後に通常楽曲キャッシュを無効化し、利用済みならサーバーから再取得する。
   *
   * @returns 再取得または無効化完了後に解決される Promise。
   */
  const refreshSongs = async (): Promise<void> => {
    setSongsMustRefresh(true)
    await invalidateSongsDataCache()

    if (songsRequested()) {
      await refetchSongs()
    }
  }

  /**
   * 楽曲 CRUD 後に WORLD'S END 楽曲キャッシュを無効化し、利用済みなら再取得する。
   *
   * @returns 再取得または無効化完了後に解決される Promise。
   */
  const refreshWorldsendSongs = async (): Promise<void> => {
    setWorldsendSongsMustRefresh(true)
    await invalidateSongsDataCache()

    if (worldsendSongsRequested()) {
      await refetchWorldsendSongs()
    }
  }

  return {
    songsResponse,
    worldsendSongsResponse,
    ensureSongsLoaded,
    ensureWorldsendSongsLoaded,
    refreshSongs,
    refreshWorldsendSongs,
    isSongsLoading,
    isWorldsendSongsLoading,
  }
}

/**
 * 楽曲一覧のデフォルト表示用に、楽曲配列をリリース日降順 + official_idx の数値降順でソートする。
 *
 * - リリース日が新しい順（降順）。リリース日が無効/未設定の曲は末尾へ寄せる。
 * - 同一リリース日内では official_idx を数値として降順。非数値の idx は数値より後ろ（末尾寄せ）。
 * - 最終タイブレークはタイトルの辞書順（昇順）。
 *
 * @param songs - ソート対象の楽曲配列（SongDTO など、official_idx/release/title を持つオブジェクト）
 * @returns ソート済みの新しい配列（元の配列は変更しない）
 */
export const sortSongsByReleaseDescAndIdxDesc = <
  T extends { official_idx?: string; title: string; release?: string | null },
>(
  songs: T[]
): T[] => {
  const keyed = songs.map((song) => {
    const parsedIdx = song.official_idx?.trim() ? Number(song.official_idx) : NaN
    const parsedRelease = Date.parse(song.release ?? '')

    // 降順ソートのため、無効値は「最小値」相当の sentinel として扱い、末尾へ寄せる
    return {
      song,
      idx: Number.isFinite(parsedIdx) ? parsedIdx : -1,
      releaseTime: Number.isFinite(parsedRelease) ? parsedRelease : -1,
    }
  })

  keyed.sort((left, right) => {
    // リリース日 降順（新しい順）
    if (left.releaseTime !== right.releaseTime) {
      return right.releaseTime - left.releaseTime
    }

    // idx 数値降順（大きい順）。-1（無効）は数値より後ろ
    if (left.idx !== right.idx) {
      return right.idx - left.idx
    }

    // 最終タイブレーク: 読み昇順
    return compareSongsByReading(left.song, right.song)
  })

  return keyed.map(({ song }) => song)
}

/**
 * 楽曲を reading の日本語辞書順でソートする。
 *
 * @param songs - ソート対象の楽曲配列。
 * @returns ソート済みの新しい配列。
 */
export const sortSongsByTitle = <T extends { title: string; reading?: string | null }>(
  songs: T[]
): T[] => [...songs].sort(compareSongsByReading)

let songsStore: ReturnType<typeof createSongsStore> | undefined

export const useSongsData = () => {
  songsStore ??= createRoot(createSongsStore)
  return songsStore
}

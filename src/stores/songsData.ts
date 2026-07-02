import { createResource, createRoot, createSignal } from 'solid-js'
import { fetchAllSongsWithCache } from '../usecases/cache/fetchAllSongsWithCache'
import { fetchWorldsendSongsWithCache } from '../usecases/cache/fetchWorldsendSongsWithCache'
import { compareSongsByReading } from '../utils/songTitleSorting'

const createSongsStore = () => {
  const [songsRequested, setSongsRequested] = createSignal(false)
  const [worldsendSongsRequested, setWorldsendSongsRequested] = createSignal(false)

  const [songsResponse] = createResource(
    () => (songsRequested() ? true : undefined),
    fetchAllSongsWithCache
  )
  const [worldsendSongsResponse] = createResource(
    () => (worldsendSongsRequested() ? true : undefined),
    fetchWorldsendSongsWithCache
  )

  const ensureSongsLoaded = () => {
    setSongsRequested(true)
  }

  const ensureWorldsendSongsLoaded = () => {
    setWorldsendSongsRequested(true)
  }

  const isSongsLoading = () => !songsRequested() || songsResponse.loading
  const isWorldsendSongsLoading = () => !worldsendSongsRequested() || worldsendSongsResponse.loading

  return {
    songsResponse,
    worldsendSongsResponse,
    ensureSongsLoaded,
    ensureWorldsendSongsLoaded,
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

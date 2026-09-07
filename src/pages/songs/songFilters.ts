import type { SongDTO, VersionSummaryDTO } from '../../types/api'
import { parseOptionalRangeNumberInput } from '../../utils/rangeInput'
import { resolveVersionNameByReleaseDate } from '../../utils/versionConverter'

export type SongFilters = {
  bpmMin: string
  bpmMax: string
  releaseMin: string
  releaseMax: string
  genres: string[] | null
  versions: string[] | null
}

export const SONG_FILTER_LABELS = {
  title: 'フィルター',
  cancel: 'キャンセル',
  apply: '適用',
  active: 'フィルター適用中',
  unselected: '未選択',
  bpm: 'BPM',
  bpmMin: 'BPM 下限',
  bpmMax: 'BPM 上限',
  release: '追加日',
  releaseMin: '追加日 開始',
  releaseMax: '追加日 終了',
  rangeError: '下限は上限以下にしてください。',
} as const

/** 楽曲フィルタの範囲入力欄に適用する共通スタイル。 */
export const SONG_FILTER_INPUT_CLASS =
  'w-full min-w-0 rounded border border-border-strong bg-surface px-3 py-2 text-sm font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

/**
 * 未指定の楽曲フィルタを生成する。
 * @returns 独立した初期フィルタ。
 */
export const createSongFilters = (): SongFilters => ({
  bpmMin: '',
  bpmMax: '',
  releaseMin: '',
  releaseMax: '',
  genres: null,
  versions: null,
})

/**
 * BPM入力を有限の非負数に変換する。
 * @param value - 入力値。
 * @returns 未指定の場合はnull、それ以外はBPM。
 */
export const parseBpmFilter = (value: string): number | null =>
  parseOptionalRangeNumberInput(value, { min: 0, max: Number.MAX_VALUE })

/**
 * 楽曲属性の条件をすべて満たす楽曲を抽出する。
 * @param songs - 文字列検索後の楽曲。
 * @param filters - 各属性の絞り込み条件。
 * @param versions - 追加日からのバージョン判定用一覧。
 * @returns 元の順序を保持した検索結果。
 */
export const filterSongs = <T extends Pick<SongDTO, 'bpm' | 'release'> & { genre: string | null }>(
  songs: T[],
  filters: SongFilters,
  versions: readonly VersionSummaryDTO[]
): T[] => {
  const min = parseBpmFilter(filters.bpmMin)
  const max = parseBpmFilter(filters.bpmMax)
  return songs.filter((song) => {
    if (min !== null && (song.bpm === null || song.bpm < min)) return false
    if (max !== null && (song.bpm === null || song.bpm > max)) return false
    const release = song.release?.slice(0, 10)
    if (filters.releaseMin && (!release || release < filters.releaseMin)) return false
    if (filters.releaseMax && (!release || release > filters.releaseMax)) return false
    if (filters.genres !== null && (song.genre === null || !filters.genres.includes(song.genre)))
      return false
    if (
      filters.versions !== null &&
      !filters.versions.includes(resolveVersionNameByReleaseDate(song.release, versions))
    )
      return false
    return true
  })
}

import type { SongDTO } from '../../../types/api'
import { hasSameFilterValues } from '../utils/filterValue'

/** 楽曲選択ダイアログで共通利用するジャンル・バージョンフィルター。 */
export type SongSelectionFilter = {
  genres: string[]
  versions: string[]
}

/**
 * 楽曲選択フィルターの初期値を生成する。
 *
 * @param genres - 全ジャンル。
 * @param versions - 全バージョン。
 * @returns 全項目を選択したフィルター。
 */
export const buildDefaultSongSelectionFilter = (
  genres: string[],
  versions: string[]
): SongSelectionFilter => ({ genres, versions })

/**
 * 楽曲選択フィルターが既定値から変わっているか判定する。
 *
 * @param current - 現在のフィルター。
 * @param defaultFilter - 既定のフィルター。
 * @returns 差分があればtrue。
 */
export const hasSongSelectionFilterChanges = (
  current: SongSelectionFilter,
  defaultFilter: SongSelectionFilter
): boolean =>
  !hasSameFilterValues(current.genres, defaultFilter.genres) ||
  !hasSameFilterValues(current.versions, defaultFilter.versions)

/**
 * 楽曲をリリース日、公式番号の新しい順で安定ソートする。
 *
 * @param songs - ソート対象楽曲。
 * @returns 新しい順へ並べた楽曲。
 */
export const sortSongSelectionCandidates = (songs: SongDTO[]): SongDTO[] =>
  songs
    .map((song, index) => ({ song, index }))
    .sort((left, right) => {
      const leftRelease = Date.parse(left.song.release ?? '')
      const rightRelease = Date.parse(right.song.release ?? '')
      const releaseOrder =
        (Number.isFinite(rightRelease) ? rightRelease : Number.NEGATIVE_INFINITY) -
        (Number.isFinite(leftRelease) ? leftRelease : Number.NEGATIVE_INFINITY)
      const leftOfficialIdx = Number(left.song.official_idx)
      const rightOfficialIdx = Number(right.song.official_idx)
      const officialIdxOrder =
        (Number.isFinite(rightOfficialIdx) ? rightOfficialIdx : Number.NEGATIVE_INFINITY) -
        (Number.isFinite(leftOfficialIdx) ? leftOfficialIdx : Number.NEGATIVE_INFINITY)
      return releaseOrder || officialIdxOrder || left.index - right.index
    })
    .map(({ song }) => song)

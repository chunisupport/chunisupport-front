import type { PlayerDataSongRecordChange } from '../../types/api'
import type { SortDirection } from '../../utils/sortingQuery'
import {
  REGISTER_SCORE_PRIMARY_SORT_LABELS,
  REGISTER_SCORE_SORT_DIRECTION_LABELS,
} from './constants'

/** 更新差分の主ソートキー。`none` はAPIの現在順を表す。 */
export type RegisterScorePrimarySortKey = 'none' | 'level' | 'singleRating'

/** 更新差分の楽曲カードに適用するソート設定。 */
export type RegisterScoreSortSettings = {
  primaryKey: RegisterScorePrimarySortKey
  primaryDirection: SortDirection
}

/** 更新差分の楽曲カードをソートするために解決済みの数値。 */
export type RegisterScoreSongSortValues = {
  level: number | null
  singleRating: number | null
}

/** 更新差分の主ソート選択肢。 */
export type RegisterScorePrimarySortOption = {
  value: RegisterScorePrimarySortKey
  label: string
}

/** 更新差分のソート方向選択肢。 */
export type RegisterScoreSortDirectionOption = {
  value: SortDirection
  label: string
}

/** 更新差分レポートで最初に適用するソート設定。 */
export const DEFAULT_REGISTER_SCORE_SORT_SETTINGS: RegisterScoreSortSettings = {
  primaryKey: 'none',
  primaryDirection: 'asc',
}

/** レベルまたは単曲レーティングのソート選択肢。ラベルは表示文言集約ファイルで管理する。 */
export const REGISTER_SCORE_PRIMARY_SORT_OPTIONS: RegisterScorePrimarySortOption[] = [
  { value: 'none', label: REGISTER_SCORE_PRIMARY_SORT_LABELS.none },
  { value: 'level', label: REGISTER_SCORE_PRIMARY_SORT_LABELS.level },
  { value: 'singleRating', label: REGISTER_SCORE_PRIMARY_SORT_LABELS.singleRating },
]

/** ソート方向の選択肢。昇順を初期選択にする。ラベルは表示文言集約ファイルで管理する。 */
export const REGISTER_SCORE_SORT_DIRECTION_OPTIONS: RegisterScoreSortDirectionOption[] = [
  { value: 'asc', label: REGISTER_SCORE_SORT_DIRECTION_LABELS.asc },
  { value: 'desc', label: REGISTER_SCORE_SORT_DIRECTION_LABELS.desc },
]

type SortableRegisterScoreChange = {
  change: PlayerDataSongRecordChange
  index: number
  values: RegisterScoreSongSortValues
}

/**
 * 数値の未設定値を方向に関係なく末尾へ置いて比較する。
 *
 * @param left - 左側の比較値。
 * @param right - 右側の比較値。
 * @param direction - 昇順または降順を表す係数。
 * @returns ソート順に応じた比較結果。
 */
const compareNullableNumber = (
  left: number | null,
  right: number | null,
  direction: 1 | -1
): number => {
  const leftMissing = left === null
  const rightMissing = right === null

  if (leftMissing && rightMissing) return 0
  if (leftMissing) return 1
  if (rightMissing) return -1

  return (left - right) * direction
}

/**
 * 指定したソート設定で更新差分の楽曲カードを安定ソートする。
 *
 * @param changes - APIの順番で並んだ楽曲差分。
 * @param sortSettings - レベルまたは単曲レーティングの主ソート設定。
 * @param resolveSortValues - 各差分のレベルと単曲レーティングを解決する関数。
 * @returns 指定した順番で並んだ楽曲差分。比較値が同じ場合は入力順を維持する。
 */
export const sortRegisterScoreChanges = (
  changes: PlayerDataSongRecordChange[],
  sortSettings: RegisterScoreSortSettings,
  resolveSortValues: (change: PlayerDataSongRecordChange) => RegisterScoreSongSortValues
): PlayerDataSongRecordChange[] => {
  if (sortSettings.primaryKey === 'none') return changes

  const primaryDirection = sortSettings.primaryDirection === 'asc' ? 1 : -1

  return changes
    .map(
      (change, index): SortableRegisterScoreChange => ({
        change,
        index,
        values: resolveSortValues(change),
      })
    )
    .sort((left, right) => {
      if (sortSettings.primaryKey === 'level') {
        const comparison = compareNullableNumber(
          left.values.level,
          right.values.level,
          primaryDirection
        )
        if (comparison !== 0) return comparison
      }

      if (sortSettings.primaryKey === 'singleRating') {
        const comparison = compareNullableNumber(
          left.values.singleRating,
          right.values.singleRating,
          primaryDirection
        )
        if (comparison !== 0) return comparison
      }

      return left.index - right.index
    })
    .map(({ change }) => change)
}

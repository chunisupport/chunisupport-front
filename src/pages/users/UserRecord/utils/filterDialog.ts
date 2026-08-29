import type { FilterState } from '../../../../types/recordFilter'
import { hasSameFilterValues } from '../../utils/filterValue'

export {
  hasSameFilterValues,
  parseNumberInput,
  parseOptionalRangeNumberInput,
  toggleArray,
  updateOptionalNumberRange,
} from '../../utils/filterValue'

/**
 * JUSTICE数フィルターが有効かを判定する。
 *
 * @param filter - 判定対象のフィルター状態。
 * @returns JUSTICE数の下限または上限が指定されている場合はtrue。
 */
export function hasJusticeCountFilter(filter: FilterState): boolean {
  return filter.justiceCount.min !== null || filter.justiceCount.max !== null
}

/**
 * OVER POWERフィルターが有効かを判定する。
 *
 * @param filter - 判定対象のフィルター状態。
 * @returns OVER POWERの下限または上限が指定されている場合はtrue。
 */
export function hasOverPowerFilter(filter: FilterState): boolean {
  return filter.overPower.min !== null || filter.overPower.max !== null
}

/**
 * 通常レコードフィルターのうち、検索文字列以外が既定値から変更されているか判定する。
 *
 * @param current - 現在のフィルター状態。
 * @param defaultFilter - 比較対象の既定フィルター状態。
 * @returns 検索文字列以外の条件に差分がある場合は true。
 */
export function isRecordFilterOptionsChanged(
  current: FilterState,
  defaultFilter: FilterState
): boolean {
  return (
    current.opTargetOnly !== defaultFilter.opTargetOnly ||
    ((current.opTargetOnly || defaultFilter.opTargetOnly) &&
      current.opTargetType !== defaultFilter.opTargetType) ||
    current.favoriteSongsOnly !== defaultFilter.favoriteSongsOnly ||
    current.excludeLockedSongs !== defaultFilter.excludeLockedSongs ||
    current.constFilterMode !== defaultFilter.constFilterMode ||
    current.scoreFilterMode !== defaultFilter.scoreFilterMode ||
    current.excludeNoPlay !== defaultFilter.excludeNoPlay ||
    current.const.min !== defaultFilter.const.min ||
    current.const.max !== defaultFilter.const.max ||
    current.score.min !== defaultFilter.score.min ||
    current.score.max !== defaultFilter.score.max ||
    current.justiceCount.min !== defaultFilter.justiceCount.min ||
    current.justiceCount.max !== defaultFilter.justiceCount.max ||
    current.overPower.min !== defaultFilter.overPower.min ||
    current.overPower.max !== defaultFilter.overPower.max ||
    !hasSameFilterValues(current.difficulties, defaultFilter.difficulties) ||
    !hasSameFilterValues(current.genres, defaultFilter.genres) ||
    !hasSameFilterValues(current.versions, defaultFilter.versions) ||
    !hasSameFilterValues(current.combo_lamp, defaultFilter.combo_lamp) ||
    !hasSameFilterValues(current.chain_lamp, defaultFilter.chain_lamp) ||
    !hasSameFilterValues(current.hard_lamp, defaultFilter.hard_lamp) ||
    current.updatedAt.min !== defaultFilter.updatedAt.min ||
    current.updatedAt.max !== defaultFilter.updatedAt.max
  )
}

/**
 * 通常レコードフィルターが検索文字列を除いて難易度選択だけ既定値から変更されているか判定する。
 *
 * @param current - 現在のフィルター状態。
 * @param defaultFilter - 比較対象の既定フィルター状態。
 * @returns 検索文字列以外では難易度選択だけに差分がある場合は true。
 */
export function isRecordDifficultyFilterOnlyChanged(
  current: FilterState,
  defaultFilter: FilterState
): boolean {
  return (
    current.opTargetOnly === defaultFilter.opTargetOnly &&
    (!current.opTargetOnly || current.opTargetType === defaultFilter.opTargetType) &&
    current.favoriteSongsOnly === defaultFilter.favoriteSongsOnly &&
    current.excludeLockedSongs === defaultFilter.excludeLockedSongs &&
    current.constFilterMode === defaultFilter.constFilterMode &&
    current.scoreFilterMode === defaultFilter.scoreFilterMode &&
    current.excludeNoPlay === defaultFilter.excludeNoPlay &&
    current.const.min === defaultFilter.const.min &&
    current.const.max === defaultFilter.const.max &&
    current.score.min === defaultFilter.score.min &&
    current.score.max === defaultFilter.score.max &&
    current.justiceCount.min === defaultFilter.justiceCount.min &&
    current.justiceCount.max === defaultFilter.justiceCount.max &&
    current.overPower.min === defaultFilter.overPower.min &&
    current.overPower.max === defaultFilter.overPower.max &&
    !hasSameFilterValues(current.difficulties, defaultFilter.difficulties) &&
    hasSameFilterValues(current.genres, defaultFilter.genres) &&
    hasSameFilterValues(current.versions, defaultFilter.versions) &&
    hasSameFilterValues(current.combo_lamp, defaultFilter.combo_lamp) &&
    hasSameFilterValues(current.chain_lamp, defaultFilter.chain_lamp) &&
    hasSameFilterValues(current.hard_lamp, defaultFilter.hard_lamp) &&
    current.updatedAt.min === defaultFilter.updatedAt.min &&
    current.updatedAt.max === defaultFilter.updatedAt.max
  )
}

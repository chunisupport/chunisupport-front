import { hasSameFilterValues } from '../../utils/filterValue'
import type { WorldsendFilterState } from '../types/filterTypes'

/**
 * WORLD'S END の★レベル表示を返す。
 *
 * @param levelStar - レベルの星数。未設定の場合はnull。
 * @returns フィルター表示用の★レベル文字列。
 */
export function formatWorldsendLevelStar(levelStar: number | null): string {
  return levelStar === null ? '不明' : `★${levelStar}`
}

/**
 * WORLD'S END の属性表示を返す。
 *
 * @param attribute - 属性。未設定の場合はnull。
 * @returns フィルター表示用の属性文字列。
 */
export function formatWorldsendAttribute(attribute: string | null): string {
  return attribute ?? '不明'
}

/**
 * WORLD'S END の JUSTICE数フィルターが有効か判定する。
 *
 * @param filter - 判定対象の WORLD'S END フィルター。
 * @returns JUSTICE数の下限または上限が指定されている場合はtrue。
 */
export function hasWorldsendJusticeCountFilter(filter: WorldsendFilterState): boolean {
  return filter.justiceCount.min !== null || filter.justiceCount.max !== null
}

/**
 * WORLD'S END レコードフィルターのうち、検索文字列以外が既定値から変更されているか判定する。
 *
 * @param current - 現在の WORLD'S END フィルター状態。
 * @param defaultFilter - 比較対象の既定フィルター状態。
 * @returns 検索文字列以外の条件に差分がある場合は true。
 */
export function isWorldsendFilterOptionsChanged(
  current: WorldsendFilterState,
  defaultFilter: WorldsendFilterState
): boolean {
  return (
    current.scoreFilterMode !== defaultFilter.scoreFilterMode ||
    current.excludeNoPlay !== defaultFilter.excludeNoPlay ||
    current.levelStarRange.min !== defaultFilter.levelStarRange.min ||
    current.levelStarRange.max !== defaultFilter.levelStarRange.max ||
    current.score.min !== defaultFilter.score.min ||
    current.score.max !== defaultFilter.score.max ||
    current.justiceCount.min !== defaultFilter.justiceCount.min ||
    current.justiceCount.max !== defaultFilter.justiceCount.max ||
    !hasSameFilterValues(current.attributes, defaultFilter.attributes) ||
    !hasSameFilterValues(current.genres, defaultFilter.genres) ||
    !hasSameFilterValues(current.versions, defaultFilter.versions) ||
    !hasSameFilterValues(current.combo_lamp, defaultFilter.combo_lamp) ||
    !hasSameFilterValues(current.chain_lamp, defaultFilter.chain_lamp) ||
    !hasSameFilterValues(current.hard_lamp, defaultFilter.hard_lamp) ||
    current.updatedAt.min !== defaultFilter.updatedAt.min ||
    current.updatedAt.max !== defaultFilter.updatedAt.max
  )
}

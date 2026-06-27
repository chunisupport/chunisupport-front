import {
  SCORE_MIN,
  WORLDSEND_LEVEL_STAR_MAX,
  WORLDSEND_LEVEL_STAR_MIN,
} from '../../../../constants/chart'
import { MAX_SCORE } from '../../../../utils/scoreRank'
import { formatFullChainLampLabel } from '../../utils/fullChainDisplay'
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
 * 2つの WORLD'S END フィルター配列が順序に依存せず同じ値を持つか判定する。
 *
 * @param left - 比較元の値配列。
 * @param right - 比較先の値配列。
 * @returns 2つの配列が同じ値集合の場合は true。
 */
export function hasSameWorldsendFilterValues<T>(left: T[], right: T[]): boolean {
  if (left.length !== right.length) return false

  const rightValues = new Set(right)
  return left.every((value) => rightValues.has(value))
}

/**
 * WORLD'S END レコードフィルターが既定値から変更されているか判定する。
 *
 * @param current - 現在の WORLD'S END フィルター状態。
 * @param defaultFilter - 比較対象の既定フィルター状態。
 * @returns 既定値との差分がある場合は true。
 */
export function isWorldsendFilterChanged(
  current: WorldsendFilterState,
  defaultFilter: WorldsendFilterState
): boolean {
  return (
    current.title !== defaultFilter.title ||
    current.scoreFilterMode !== defaultFilter.scoreFilterMode ||
    current.excludeNoPlay !== defaultFilter.excludeNoPlay ||
    current.levelStarRange.min !== defaultFilter.levelStarRange.min ||
    current.levelStarRange.max !== defaultFilter.levelStarRange.max ||
    current.score.min !== defaultFilter.score.min ||
    current.score.max !== defaultFilter.score.max ||
    current.justiceCount.min !== defaultFilter.justiceCount.min ||
    current.justiceCount.max !== defaultFilter.justiceCount.max ||
    !hasSameWorldsendFilterValues(current.attributes, defaultFilter.attributes) ||
    !hasSameWorldsendFilterValues(current.genres, defaultFilter.genres) ||
    !hasSameWorldsendFilterValues(current.versions, defaultFilter.versions) ||
    !hasSameWorldsendFilterValues(current.combo_lamp, defaultFilter.combo_lamp) ||
    !hasSameWorldsendFilterValues(current.chain_lamp, defaultFilter.chain_lamp) ||
    !hasSameWorldsendFilterValues(current.hard_lamp, defaultFilter.hard_lamp)
  )
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
    !hasSameWorldsendFilterValues(current.attributes, defaultFilter.attributes) ||
    !hasSameWorldsendFilterValues(current.genres, defaultFilter.genres) ||
    !hasSameWorldsendFilterValues(current.versions, defaultFilter.versions) ||
    !hasSameWorldsendFilterValues(current.combo_lamp, defaultFilter.combo_lamp) ||
    !hasSameWorldsendFilterValues(current.chain_lamp, defaultFilter.chain_lamp) ||
    !hasSameWorldsendFilterValues(current.hard_lamp, defaultFilter.hard_lamp)
  )
}

/**
 * WORLD'S END フィルター条件を保存ダイアログ用の要約へ変換する。
 *
 * @param filter - 要約対象の WORLD'S END フィルター。
 * @returns 画面表示用のフィルター要約。
 */
export function formatWorldsendFilterSummary(filter: WorldsendFilterState): string {
  const parts: string[] = []
  if (filter.excludeNoPlay) parts.push('未プレイ譜面を除外')
  if (filter.attributes.length > 0) {
    parts.push(`属性: ${filter.attributes.map(formatWorldsendAttribute).join(',')}`)
  }
  if (
    filter.levelStarRange.min !== WORLDSEND_LEVEL_STAR_MIN ||
    filter.levelStarRange.max !== WORLDSEND_LEVEL_STAR_MAX
  ) {
    parts.push(
      `レベル: ${formatWorldsendLevelStar(filter.levelStarRange.min)}-${formatWorldsendLevelStar(
        filter.levelStarRange.max
      )}`
    )
  }
  if (filter.score.min !== SCORE_MIN || filter.score.max !== MAX_SCORE) {
    parts.push(`スコア: ${filter.score.min}-${filter.score.max}`)
  }
  if (filter.justiceCount.min !== null || filter.justiceCount.max !== null) {
    parts.push(`JUSTICE数: ${filter.justiceCount.min ?? ''}-${filter.justiceCount.max ?? ''}`)
  }
  if (filter.genres.length > 0) parts.push(`ジャンル: ${filter.genres.join(',')}`)
  if (filter.combo_lamp.length > 0) {
    parts.push(`コンボランプ: ${filter.combo_lamp.map((lamp) => lamp ?? 'なし').join(',')}`)
  }
  if (filter.chain_lamp.length > 0) {
    parts.push(`FULL CHAIN: ${filter.chain_lamp.map(formatFullChainLampLabel).join(',')}`)
  }
  if (filter.hard_lamp.length > 0) {
    parts.push(`ハードランプ: ${filter.hard_lamp.map((lamp) => lamp ?? 'なし').join(',')}`)
  }
  if (filter.versions.length > 0) parts.push(`バージョン: ${filter.versions.join(',')}`)
  return parts.join('\n')
}

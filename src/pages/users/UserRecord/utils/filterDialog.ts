import { CHART_CONST_MAX, CHART_CONST_MIN, SCORE_MIN } from '../../../../constants/chart'
import { MAX_SCORE } from '../../../../utils/scoreRank'
import { hasSameFilterValues } from '../../utils/filterValue'
import { formatFullChainLampLabel } from '../../utils/fullChainDisplay'
import type { FilterState } from '../types/types'

export {
  hasSameFilterValues,
  parseNumberInput,
  parseOptionalRangeNumberInput,
  toggleArray,
  updateOptionalNumberRange,
} from '../../utils/filterValue'

/**
 * 現在のフィルター条件を表示用の要約文字列に変換する。
 * @param filter - 要約対象のフィルター状態
 * @returns 画面に表示するフィルター条件の要約
 */
export function formatFilterSummary(filter: FilterState): string {
  const parts: string[] = []
  if (filter.excludeNoPlay) parts.push('未プレイ譜面を除外')
  if (filter.difficulties.length > 0) parts.push(`難易度: ${filter.difficulties.join(',')}`)
  if (filter.currentOpTargetOnly) parts.push('OP対象の楽曲のみ')
  if (filter.const.min !== CHART_CONST_MIN || filter.const.max !== CHART_CONST_MAX)
    parts.push(`定数: ${filter.const.min}-${filter.const.max}`)
  if (filter.score.min !== SCORE_MIN || filter.score.max !== MAX_SCORE)
    parts.push(`スコア: ${filter.score.min}-${filter.score.max}`)
  if (filter.justiceCount.min !== null || filter.justiceCount.max !== null) {
    parts.push(
      `JUSTICE数: ${formatOptionalNumberRange(filter.justiceCount.min, filter.justiceCount.max)}`
    )
  }
  if (filter.overPower.min !== null || filter.overPower.max !== null) {
    parts.push(
      `OVER POWER: ${formatOptionalNumberRange(filter.overPower.min, filter.overPower.max)}`
    )
  }
  if (filter.genres.length > 0) parts.push(`ジャンル: ${filter.genres.join(',')}`)
  if (filter.combo_lamp.length > 0)
    parts.push(`コンボランプ: ${filter.combo_lamp.map((lamp) => lamp ?? 'なし').join(',')}`)
  if (filter.chain_lamp.length > 0)
    parts.push(`FULL CHAIN: ${filter.chain_lamp.map(formatFullChainLampLabel).join(',')}`)
  if (filter.hard_lamp.length > 0)
    parts.push(`ハードランプ: ${filter.hard_lamp.map((lamp) => lamp ?? 'なし').join(',')}`)
  if (filter.versions.length > 0) parts.push(`バージョン: ${filter.versions.join(',')}`)
  return parts.join('\n')
}

/**
 * 空欄を許す数値範囲を表示用の文字列に整形する。
 *
 * @param min - 範囲の下限値。未指定の場合はnull。
 * @param max - 範囲の上限値。未指定の場合はnull。
 * @returns 下限と上限をハイフンでつないだ表示文字列。
 */
export function formatOptionalNumberRange(min: number | null, max: number | null): string {
  return `${min ?? ''}-${max ?? ''}`
}

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
 * 通常レコードフィルターが既定値から変更されているか判定する。
 *
 * @param current - 現在のフィルター状態。
 * @param defaultFilter - 比較対象の既定フィルター状態。
 * @returns 既定値との差分がある場合は true。
 */
export function isRecordFilterChanged(current: FilterState, defaultFilter: FilterState): boolean {
  return (
    current.title !== defaultFilter.title ||
    current.currentOpTargetOnly !== defaultFilter.currentOpTargetOnly ||
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
    !hasSameFilterValues(current.hard_lamp, defaultFilter.hard_lamp)
  )
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
    current.currentOpTargetOnly !== defaultFilter.currentOpTargetOnly ||
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
    !hasSameFilterValues(current.hard_lamp, defaultFilter.hard_lamp)
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
    current.currentOpTargetOnly === defaultFilter.currentOpTargetOnly &&
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
    hasSameFilterValues(current.hard_lamp, defaultFilter.hard_lamp)
  )
}

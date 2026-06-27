import { CHART_CONST_MAX, CHART_CONST_MIN, SCORE_MIN } from '../../../../constants/chart'
import { MAX_SCORE } from '../../../../utils/scoreRank'
import { formatFullChainLampLabel } from '../../utils/fullChainDisplay'
import type { FilterState } from '../types/types'

type OptionalNumberRange = {
  min: number | null
  max: number | null
}

type OptionalRangeInputOptions = {
  min: number
  max: number
  integer?: boolean
  decimalPlaces?: number
}

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
 * 数値入力欄の文字列を数値へ変換する。
 *
 * @param value - 入力欄から受け取った文字列。
 * @returns 確定した数値。空欄や未確定の小数はundefined。
 */
export function parseNumberInput(value: string): number | undefined {
  if (value === '' || value === '.') return undefined
  if (/^\.\d+$/.test(value)) return parseFloat(`0${value}`)
  if (/^\d+\.$/.test(value)) return undefined // 末尾ドットは未確定
  const num = Number(value)
  return Number.isNaN(num) ? undefined : num
}

/**
 * 空欄を許す範囲入力値をフィルター用の数値へ正規化する。
 *
 * @param value - 入力欄から受け取った文字列。
 * @param options - 許可範囲、整数指定、小数桁数の設定。
 * @returns 正規化済みの数値。空欄または不正値の場合はnull。
 */
export function parseOptionalRangeNumberInput(
  value: string,
  options: OptionalRangeInputOptions
): number | null {
  const parsed = parseNumberInput(value)
  if (parsed === undefined) return null
  if (options.integer && !Number.isInteger(parsed)) return null
  if (!Number.isFinite(parsed)) return null

  const normalized = Math.max(options.min, Math.min(parsed, options.max))
  if (typeof options.decimalPlaces === 'number') {
    const factor = 10 ** options.decimalPlaces
    return Math.round(normalized * factor) / factor
  }

  return normalized
}

/**
 * 範囲の片側入力を更新した次の範囲値を返す。
 *
 * @param current - 現在の範囲値。
 * @param key - 更新対象の範囲端。
 * @param value - 入力欄から受け取った文字列。
 * @param options - 許可範囲、整数指定、小数桁数の設定。
 * @returns 更新後の範囲値。
 */
export function updateOptionalNumberRange(
  current: OptionalNumberRange,
  key: keyof OptionalNumberRange,
  value: string,
  options: OptionalRangeInputOptions
): OptionalNumberRange {
  return {
    ...current,
    [key]: parseOptionalRangeNumberInput(value, options),
  }
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
 * 2つの配列が順序に依存せず同じ値を持つか判定する。
 *
 * @param left - 比較元の値配列。
 * @param right - 比較先の値配列。
 * @returns 2つの配列が同じ値集合の場合は true。
 */
export function hasSameFilterValues<T>(left: T[], right: T[]): boolean {
  if (left.length !== right.length) return false

  const rightValues = new Set(right)
  return left.every((value) => rightValues.has(value))
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
 * 配列内の値をトグルした新しい配列を返す。
 *
 * @param arr - 現在の配列。
 * @param value - 追加または削除する値。
 * @returns トグル後の配列。
 */
export function toggleArray<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
}

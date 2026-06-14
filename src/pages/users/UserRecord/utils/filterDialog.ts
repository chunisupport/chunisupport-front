import { MAX_SCORE } from '../../../../utils/scoreRank'
import { formatFullChainLampLabel } from '../../utils/fullChainDisplay'
import { CONST_MAX } from '../constants/constRange'
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
  if (filter.constMin !== 0.0 || filter.constMax !== CONST_MAX)
    parts.push(`定数: ${filter.constMin}-${filter.constMax}`)
  if (filter.scoreMin !== 0 || filter.scoreMax !== MAX_SCORE)
    parts.push(`スコア: ${filter.scoreMin}-${filter.scoreMax}`)
  if (filter.justiceCountMin !== null || filter.justiceCountMax !== null) {
    parts.push(
      `JUSTICE数: ${formatOptionalNumberRange(filter.justiceCountMin, filter.justiceCountMax)}`
    )
  }
  if (filter.overPowerMin !== null || filter.overPowerMax !== null) {
    parts.push(`OVER POWER: ${formatOptionalNumberRange(filter.overPowerMin, filter.overPowerMax)}`)
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
  return filter.justiceCountMin !== null || filter.justiceCountMax !== null
}

/**
 * OVER POWERフィルターが有効かを判定する。
 *
 * @param filter - 判定対象のフィルター状態。
 * @returns OVER POWERの下限または上限が指定されている場合はtrue。
 */
export function hasOverPowerFilter(filter: FilterState): boolean {
  return filter.overPowerMin !== null || filter.overPowerMax !== null
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

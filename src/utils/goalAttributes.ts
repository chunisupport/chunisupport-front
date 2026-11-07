import { CHART_CONST_MAX, CHART_CONST_MIN } from '../constants/chart'
import type { GoalAttributes, GoalConstFilterMode } from '../types/api'
import type { NumericRangeFilter } from '../types/record'
import { isChartLevelFilterRange } from './chartLevel'

/**
 * 目標属性で扱う単一IDまたはID配列の保存形式。
 */
type GoalAttributeIdValue = number | number[] | undefined

/**
 * 単一値または配列で保持された目標属性IDを条件ID配列へ正規化する。
 *
 * @param value - 目標属性に保存されたID。
 * @returns 未指定なら undefined、有効な整数ID指定なら配列。
 */
export const normalizeGoalAttributeIds = (value: GoalAttributeIdValue): number[] | undefined => {
  if (typeof value === 'number') return [value]
  if (Array.isArray(value)) {
    return value.filter((id): id is number => Number.isInteger(id))
  }
  return undefined
}

/**
 * 単一コードまたはコード配列で保持された目標属性の楽曲名順フォルダを配列へ正規化する。
 *
 * @param value - 目標属性に保存された楽曲名順フォルダのコード。
 * @returns 未指定なら undefined、指定ありならコード配列。
 */
export const normalizeGoalNameFolderCodes = (
  value: string | string[] | undefined
): string[] | undefined => {
  if (typeof value === 'string') return [value]
  return value
}

/**
 * 楽曲の楽曲名順フォルダが目標属性の条件に一致するか判定する。
 *
 * @param nameFolderCode - 楽曲の楽曲名順フォルダのコード。楽曲が解決できない場合は undefined。
 * @param nameFolderCodes - 正規化済みの対象コード。未指定なら undefined。
 * @returns 条件未指定、または楽曲のコードが対象に含まれる場合は true。
 */
export const isGoalNameFolderMatched = (
  nameFolderCode: string | undefined,
  nameFolderCodes: readonly string[] | undefined
): boolean =>
  !nameFolderCodes || (nameFolderCode !== undefined && nameFolderCodes.includes(nameFolderCode))

/** 目標属性から復元した譜面定数範囲と入力方法 */
export type GoalConstSelection = {
  constFilterMode: GoalConstFilterMode
  constRange: NumericRangeFilter
}

/**
 * 目標属性から譜面定数範囲と入力方法を復元する。
 * 入力方法を持たない目標は譜面定数で入力されたものとして数値指定にする。
 * レベル指定でも範囲がレベル境界と一致しない場合は、範囲を変えないよう数値指定にする。
 *
 * @param attributes - 目標に保存された対象条件。
 * @returns 未指定の端点を全範囲の端点で補った範囲と、表示に使う入力方法。
 */
export const resolveGoalConstSelection = (attributes: GoalAttributes): GoalConstSelection => {
  const constRange = {
    min: attributes.const?.min ?? CHART_CONST_MIN,
    max: attributes.const?.max ?? CHART_CONST_MAX,
  }
  return {
    constFilterMode:
      attributes.const_filter_mode === 'level' && isChartLevelFilterRange(constRange)
        ? 'level'
        : 'number',
    constRange,
  }
}

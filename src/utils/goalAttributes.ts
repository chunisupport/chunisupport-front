import { CHART_CONST_MAX, CHART_CONST_MIN } from '../constants/chart'
import { normalizePlayerDataDifficulty } from '../constants/difficulty'
import type { GoalAttributes, GoalConstFilterMode, PlayerDataDifficulty } from '../types/api'
import type { NumericRangeFilter } from '../types/record'
import { isChartLevelFilterRange } from './chartLevel'

/**
 * 単一値または配列で保持された目標属性の公開識別子を条件配列へ正規化する。
 * 難易度・ジャンルは名前、バージョンは公開ID、楽曲名順フォルダはコードで保存される。
 *
 * @param value - 目標属性に保存された識別子。
 * @returns 未指定なら undefined、指定ありなら文字列の識別子配列。
 */
export const normalizeGoalAttributeValues = (
  value: string | readonly string[] | undefined
): string[] | undefined => {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  return undefined
}

/**
 * 目標属性の難易度名をレコードの難易度表記へ正規化した集合にする。
 *
 * @param difficultyNames - 目標属性に保存された難易度名。
 * @returns 正規化できた難易度名の集合。
 */
export const normalizeGoalDifficultyNames = (
  difficultyNames: readonly string[]
): Set<PlayerDataDifficulty> =>
  new Set(
    difficultyNames.flatMap((name) => {
      const normalized = normalizePlayerDataDifficulty(name)
      return normalized ? [normalized] : []
    })
  )

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

import type { NumericRangeFilter } from '../../../types/record'

/**
 * プレイ済みレコードの上位%を、指定された下限・上限を含めて比較する。
 *
 * @param record - プレイ状態と集計済みの上位%を持つレコード。
 * @param range - 上位%の範囲。両端が null の場合は全レコードが一致する。
 * @returns 範囲条件に一致するか。
 */
export function matchesTopPercentRange(
  record: { is_played: boolean; top_percent?: number | null },
  range: NumericRangeFilter<number | null>
): boolean {
  const { min, max } = range
  if (min === null && max === null) return true

  const value = record.top_percent
  if (!record.is_played || typeof value !== 'number' || !Number.isFinite(value)) return false
  return (min === null || value >= min) && (max === null || value <= max)
}

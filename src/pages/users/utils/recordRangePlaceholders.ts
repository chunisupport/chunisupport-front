import type { PlayerRecordDTO, WorldsendRecordDTO } from '../../../types/api'
import type { NumericRangeFilter } from '../../../types/record'

type CommonRecord = Pick<
  WorldsendRecordDTO,
  'is_played' | 'top_percent' | 'combo_lamp' | 'justice_count'
>
type StandardRecord = CommonRecord &
  Pick<PlayerRecordDTO, 'rating' | 'is_const_unknown' | 'overpower'>

/** 各レコードフィルターに表示できる実測範囲。 */
export type RecordRangePlaceholders = Partial<
  Record<'topPercent' | 'rating' | 'justiceCount' | 'overPower', NumericRangeFilter>
>

/**
 * 有効な数値を実測範囲に含める。
 *
 * @param ranges - 集計中の範囲。
 * @param key - 更新するフィルター項目。
 * @param value - レコードの実測値。
 */
function includeValue(
  ranges: RecordRangePlaceholders,
  key: keyof RecordRangePlaceholders,
  value: number | null | undefined
): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) return

  const range = ranges[key]
  if (range) {
    range.min = Math.min(range.min, value)
    range.max = Math.max(range.max, value)
  } else {
    ranges[key] = { min: value, max: value }
  }
}

/**
 * 絞り込み前のプレイ済みレコードから、数値フィルターの参考範囲を求める。
 *
 * @param records - 通常または WORLD'S END のレコード一覧。
 * @returns 実測値がある項目の最小値と最大値。
 */
export function getRecordRangePlaceholders(
  records: readonly (StandardRecord | CommonRecord)[]
): RecordRangePlaceholders {
  const ranges: RecordRangePlaceholders = {}
  for (const record of records) {
    if (!record.is_played) continue

    includeValue(ranges, 'topPercent', record.top_percent)
    if (record.combo_lamp === 'ALL JUSTICE') {
      includeValue(ranges, 'justiceCount', record.justice_count)
    }
    if ('rating' in record) {
      if (!record.is_const_unknown) includeValue(ranges, 'rating', record.rating)
      includeValue(ranges, 'overPower', record.overpower)
    }
  }
  return ranges
}

import type { PlayerRecordDTO } from '../../../../types/api'

export type Difficulty = PlayerRecordDTO['difficulty']
export type ComboLamp = PlayerRecordDTO['combo_lamp']
export type ChainLamp = PlayerRecordDTO['full_chain']
export type HardLamp = PlayerRecordDTO['clear_lamp']
export type RecordSortKey =
  | 'title'
  | 'difficulty'
  | 'const'
  | 'rating'
  | 'score'
  | 'justiceCount'
  | 'overpower'
  | 'overpowerPercent'
  | 'updatedAt'
  | 'lamp'
  | 'hardLamp'
  | 'fullChain'
export type RecordColumnId =
  | 'title'
  | 'difficulty'
  | 'const'
  | 'score'
  | 'rating'
  | 'lamp'
  | 'hardLamp'
  | 'fullChain'
  | 'justiceCount'
  | 'overpower'
  | 'overpowerPercent'
  | 'updatedAt'
export type SortDirection = 'asc' | 'desc'
/**
 * レコード一覧のソート条件。
 *
 * @property key - ソート対象の列キー。
 * @property direction - ソート方向。
 */
export type RecordSortCondition = {
  key: RecordSortKey
  direction: SortDirection
}

/**
 * 数値範囲フィルターの型定義。
 *
 * @property min - 範囲の下限値。
 * @property max - 範囲の上限値。
 */
export type NumericRangeFilter<T extends number | null = number> = {
  min: T
  max: T
}

/** フィルターの型定義。 */
export interface FilterState {
  title: string
  difficulties: Difficulty[]
  /** 現在のOVER POWER集計対象譜面だけを表示するか。 */
  currentOpTargetOnly: boolean
  genres: string[]
  versions: string[]
  const: NumericRangeFilter
  constFilterMode: 'level' | 'number'
  score: NumericRangeFilter
  scoreFilterMode: 'number' | 'rank'
  justiceCount: NumericRangeFilter<number | null>
  overPower: NumericRangeFilter<number | null>
  combo_lamp: ComboLamp[]
  chain_lamp: ChainLamp[]
  hard_lamp: HardLamp[]
  excludeNoPlay: boolean
}

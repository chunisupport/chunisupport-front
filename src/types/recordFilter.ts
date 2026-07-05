import type { SortCondition } from '../utils/sortConditions'
import type { ChainLamp, ComboLamp, Difficulty, HardLamp, NumericRangeFilter } from './record'

export type { ChainLamp, ComboLamp, Difficulty, HardLamp, NumericRangeFilter }
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

/** レコード一覧のソート条件。 */
export type RecordSortCondition = SortCondition<RecordSortKey>

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

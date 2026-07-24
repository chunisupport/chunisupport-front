import type { WorldsendRecordDTO } from './api'
import type {
  ChainLamp,
  ComboLampFilter,
  DateRangeFilter,
  HardLamp,
  NumericRangeFilter,
} from './record'

/** WORLD'S END レコードで扱う属性。 */
export type WorldsendAttribute = WorldsendRecordDTO['attribute']

/** WORLD'S END レコードで扱う★レベル。 */
export type WorldsendLevelStar = WorldsendRecordDTO['level_star']

/** WORLD'S END レコード一覧で永続化する列ID。 */
export type WorldsendRecordColumnId =
  | 'title'
  | 'attribute'
  | 'level'
  | 'score'
  | 'lamp'
  | 'hardLamp'
  | 'fullChain'
  | 'justiceCount'
  | 'updatedAt'

/** WORLD'S END レコード一覧で扱うソートキー。 */
export type WorldsendRecordSortKey = WorldsendRecordColumnId

/** WORLD'S END レコードフィルターの状態。 */
export interface WorldsendFilterState {
  title: string
  attributes: WorldsendAttribute[]
  levelStarRange: NumericRangeFilter
  genres: string[]
  versions: string[]
  score: NumericRangeFilter
  scoreFilterMode: 'number' | 'rank'
  justiceCount: NumericRangeFilter<number | null>
  combo_lamp: ComboLampFilter[]
  chain_lamp: ChainLamp[]
  hard_lamp: HardLamp[]
  excludeNoPlay: boolean
  /** 最終更新日の範囲フィルター。空文字列は未指定を意味する。 */
  updatedAt: DateRangeFilter
}

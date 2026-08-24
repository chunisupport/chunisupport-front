import type { SortCondition } from '../utils/sortConditions'
import type {
  ChainLamp,
  ComboLamp,
  ComboLampFilter,
  DateRangeFilter,
  Difficulty,
  HardLamp,
  NumericRangeFilter,
} from './record'

export type {
  ChainLamp,
  ComboLamp,
  ComboLampFilter,
  DateRangeFilter,
  Difficulty,
  HardLamp,
  NumericRangeFilter,
}
/** 通常レコード一覧で選択できるソートキー */
export type RecordSortKey =
  | 'title'
  | 'difficulty'
  | 'level'
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
/** 通常レコード一覧で表示を切り替えられる列ID */
export type RecordColumnId =
  | 'title'
  | 'difficulty'
  | 'level'
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

/** レコード一覧のソート条件 */
export type RecordSortCondition = SortCondition<RecordSortKey>

/** OP対象譜面フィルターで選択できる対象種別 */
export type OpTargetType = 'current' | 'theoretical'

/** フィルターの型定義 */
export interface FilterState {
  title: string
  difficulties: Difficulty[]
  /** OVER POWER対象譜面だけを表示するか */
  opTargetOnly: boolean
  /** OVER POWER対象譜面を現在の集計対象と理論値対象のどちらで判定するか */
  opTargetType: OpTargetType
  /** お気に入り登録済みの楽曲だけを表示するか */
  favoriteSongsOnly: boolean
  genres: string[]
  versions: string[]
  const: NumericRangeFilter
  constFilterMode: 'level' | 'number'
  score: NumericRangeFilter
  scoreFilterMode: 'number' | 'rank'
  justiceCount: NumericRangeFilter<number | null>
  overPower: NumericRangeFilter<number | null>
  combo_lamp: ComboLampFilter[]
  chain_lamp: ChainLamp[]
  hard_lamp: HardLamp[]
  excludeNoPlay: boolean
  /** 最終更新日の範囲フィルター。空文字列は未指定を意味する */
  updatedAt: DateRangeFilter
}

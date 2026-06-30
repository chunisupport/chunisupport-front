import type { WorldsendRecordDTO } from '../../../../types/api'
import type { ChainLamp, ComboLamp, HardLamp, NumericRangeFilter } from '../../../../types/record'

export type WorldsendAttribute = WorldsendRecordDTO['attribute']
export type WorldsendLevelStar = WorldsendRecordDTO['level_star']

/** 楽曲マスタ由来の補足情報を付与した WORLD'S END レコード。 */
export interface WorldsendRecordWithSongMeta extends WorldsendRecordDTO {
  genre: string | null
  reading: string | null
  release: string | null
  release_version: string
}

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
  combo_lamp: ComboLamp[]
  chain_lamp: ChainLamp[]
  hard_lamp: HardLamp[]
  excludeNoPlay: boolean
}

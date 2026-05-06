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
export type RecordColumnId =
  | 'title'
  | 'difficulty'
  | 'const'
  | 'score'
  | 'rating'
  | 'lamp'
  | 'justiceCount'
  | 'overpower'
  | 'overpowerPercent'
  | 'updatedAt'
export type SortDirection = 'asc' | 'desc'

/** フィルターの型定義 */
export interface FilterState {
  title: string
  difficulties: Difficulty[]
  genres: string[]
  versions: string[]
  constMin: number
  constMax: number
  constFilterMode: 'level' | 'number'
  scoreMin: number
  scoreMax: number
  scoreFilterMode: 'number' | 'rank'
  combo_lamp: ComboLamp[]
  chain_lamp: ChainLamp[]
  hard_lamp: HardLamp[]
  excludeNoPlay: boolean
}

import type { PlayerRecordDTO } from '../../../../types/api'

export type Difficulty = PlayerRecordDTO['difficulty']
export type ComboLamp = PlayerRecordDTO['combo_lamp']
export type RecordSortKey = 'title' | 'difficulty' | 'const' | 'rating' | 'score' | 'lamp'
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
  lamps: ComboLamp[]
  excludeNoPlay: boolean
}

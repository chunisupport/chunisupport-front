import type { MasterDataDTO, MasterItemDTO, VersionSummaryDTO } from '../../../../types/api'
import { MAX_SCORE } from '../../../../utils/scoreRank'
import type { ComboLamp, FilterState } from '../types/types'

/** ランプの選択肢 */
export const LAMP_OPTIONS: (ComboLamp | null)[] = ['ALL JUSTICE', 'FULL COMBO', null]

/** フィルターのデフォルト値 */
export const DEFAULT_FILTER: FilterState = {
  title: '',
  difficulties: ['MASTER', 'ULTIMA'],
  genres: [],
  versions: [],
  constMin: 1.0,
  constMax: 15.9,
  constFilterMode: 'level',
  scoreMin: 0,
  scoreMax: MAX_SCORE,
  scoreFilterMode: 'rank',
  lamps: ['ALL JUSTICE', 'FULL COMBO', null],
  excludeNoPlay: false,
}

/** マスタデータに依存するデフォルト値 */
export const getMasterDataDefaults = (
  masterData?: MasterDataDTO,
  versions?: VersionSummaryDTO[]
) => ({
  genres: masterData?.genres?.map((g: MasterItemDTO) => g.name) ?? [],
  versions: versions?.map((version) => version.name) ?? [],
})

/** フィルターのデフォルト値を取得する */
export const buildDefaultFilter = (
  masterData?: MasterDataDTO,
  versions?: VersionSummaryDTO[]
): FilterState => ({
  ...DEFAULT_FILTER,
  ...getMasterDataDefaults(masterData, versions),
  lamps: [...LAMP_OPTIONS],
})

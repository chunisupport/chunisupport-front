import type { MasterDataDTO, MasterItemDTO } from '../../../../types/api'
import { CHUNITHM_VERSIONS } from '../../../../utils/versionConverter'
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
  scoreMax: 1010000,
  scoreFilterMode: 'rank',
  lamps: ['ALL JUSTICE', 'FULL COMBO', null],
  excludeNoPlay: false,
}

/** マスタデータに依存するデフォルト値 */
export const getMasterDataDefaults = (masterData?: MasterDataDTO) => ({
  genres: masterData?.genres?.map((g: MasterItemDTO) => g.name) ?? [],
  versions: [...CHUNITHM_VERSIONS],
})

/** フィルターのデフォルト値を取得する */
export const buildDefaultFilter = (masterData?: MasterDataDTO): FilterState => ({
  ...DEFAULT_FILTER,
  ...getMasterDataDefaults(masterData),
  lamps: [...LAMP_OPTIONS],
})

import type { MasterDataDTO, MasterItemDTO, VersionSummaryDTO } from '../../../../types/api'
import { sortMasterItemsBySortOrder } from '../../../../utils/masterData'
import { MAX_SCORE } from '../../../../utils/scoreRank'
import { getShortVersionName } from '../../../../utils/versionConverter'
import { CONST_MAX, CONST_MIN } from '../constants/constRange'
import type { ChainLamp, ComboLamp, FilterState, HardLamp } from '../types/types'

// TODO: これらの定数がハードコードされていていいのか？サーバから取ってこなくていいのか？

/** ランプの選択肢 */
export const COMBO_LAMP_OPTIONS: ComboLamp[] = ['ALL JUSTICE', 'FULL COMBO', null]
export const CHAIN_LAMP_OPTIONS: ChainLamp[] = ['FULL CHAIN PLATINUM', 'FULL CHAIN GOLD', null] // TODO: 名前変える
export const HARD_LAMP_OPTIONS: HardLamp[] = [
  'CATASTROPHY',
  'ABSOLUTE',
  'BRAVE',
  'HARD',
  'CLEAR',
  'FAILED',
  null,
]

/** フィルターのデフォルト値 */
export const DEFAULT_FILTER: FilterState = {
  title: '',
  difficulties: ['MASTER', 'ULTIMA'],
  genres: [],
  versions: [],
  constMin: CONST_MIN,
  constMax: CONST_MAX,
  constFilterMode: 'level',
  scoreMin: 0,
  scoreMax: MAX_SCORE,
  scoreFilterMode: 'rank',
  combo_lamp: [...COMBO_LAMP_OPTIONS],
  chain_lamp: [...CHAIN_LAMP_OPTIONS],
  hard_lamp: [...HARD_LAMP_OPTIONS],
  excludeNoPlay: false,
}

/** マスタデータに依存するデフォルト値 */
export const getMasterDataDefaults = (
  masterData?: MasterDataDTO,
  versions?: VersionSummaryDTO[]
) => ({
  genres: sortMasterItemsBySortOrder(masterData?.genres ?? []).map((g: MasterItemDTO) => g.name),
  versions: versions?.map((version) => getShortVersionName(version.name)) ?? [],
})

/** フィルターのデフォルト値を取得する */
export const buildDefaultFilter = (
  masterData?: MasterDataDTO,
  versions?: VersionSummaryDTO[]
): FilterState => ({
  ...DEFAULT_FILTER,
  ...getMasterDataDefaults(masterData, versions),
  combo_lamp: [...COMBO_LAMP_OPTIONS],
  chain_lamp: [...CHAIN_LAMP_OPTIONS],
  hard_lamp: [...HARD_LAMP_OPTIONS],
})

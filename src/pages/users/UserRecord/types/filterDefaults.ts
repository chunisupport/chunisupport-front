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
  currentOpTargetOnly: false,
  genres: [],
  versions: [],
  const: {
    min: CONST_MIN,
    max: CONST_MAX,
  },
  constFilterMode: 'level',
  score: {
    min: 0,
    max: MAX_SCORE,
  },
  scoreFilterMode: 'rank',
  justiceCount: {
    min: null,
    max: null,
  },
  overPower: {
    min: null,
    max: null,
  },
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
  const: { ...DEFAULT_FILTER.const },
  score: { ...DEFAULT_FILTER.score },
  justiceCount: { ...DEFAULT_FILTER.justiceCount },
  overPower: { ...DEFAULT_FILTER.overPower },
  combo_lamp: [...COMBO_LAMP_OPTIONS],
  chain_lamp: [...CHAIN_LAMP_OPTIONS],
  hard_lamp: [...HARD_LAMP_OPTIONS],
})

/**
 * 保存済みフィルターなどの部分的なフィルター情報を現行のFilterStateへ補完する。
 *
 * @param filter - 補完対象のフィルター情報。
 * @returns 現行フィールドをすべて持つフィルター状態。
 */
export const normalizeFilterState = (filter: Partial<FilterState>): FilterState => ({
  ...DEFAULT_FILTER,
  ...filter,
  const: filter.const ?? { ...DEFAULT_FILTER.const },
  score: filter.score ?? { ...DEFAULT_FILTER.score },
  justiceCount: filter.justiceCount ?? { ...DEFAULT_FILTER.justiceCount },
  overPower: filter.overPower ?? { ...DEFAULT_FILTER.overPower },
  currentOpTargetOnly: filter.currentOpTargetOnly ?? DEFAULT_FILTER.currentOpTargetOnly,
  combo_lamp: filter.combo_lamp ?? [...COMBO_LAMP_OPTIONS],
  chain_lamp: filter.chain_lamp ?? [...CHAIN_LAMP_OPTIONS],
  hard_lamp: filter.hard_lamp ?? [...HARD_LAMP_OPTIONS],
})

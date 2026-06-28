import { CHART_CONST_MAX, CHART_CONST_MIN, SCORE_MIN } from '../../../../constants/chart.ts'
import type { MasterDataDTO, MasterItemDTO, VersionSummaryDTO } from '../../../../types/api.ts'
import { sortMasterItemsBySortOrder } from '../../../../utils/masterData.ts'
import { MAX_SCORE } from '../../../../utils/scoreRank.ts'
import { getShortVersionName } from '../../../../utils/versionConverter.ts'
import {
  RECORD_CHAIN_LAMP_OPTIONS,
  RECORD_COMBO_LAMP_OPTIONS,
  RECORD_HARD_LAMP_OPTIONS,
} from '../../constants/recordFilterOptions.ts'
import type { FilterState } from '../types/types.ts'

/** フィルターのデフォルト値 */
export const DEFAULT_FILTER: FilterState = {
  title: '',
  difficulties: ['MASTER', 'ULTIMA'],
  currentOpTargetOnly: false,
  genres: [],
  versions: [],
  const: {
    min: CHART_CONST_MIN,
    max: CHART_CONST_MAX,
  },
  constFilterMode: 'level',
  score: {
    min: SCORE_MIN,
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
  combo_lamp: [...RECORD_COMBO_LAMP_OPTIONS],
  chain_lamp: [...RECORD_CHAIN_LAMP_OPTIONS],
  hard_lamp: [...RECORD_HARD_LAMP_OPTIONS],
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
  combo_lamp: [...RECORD_COMBO_LAMP_OPTIONS],
  chain_lamp: [...RECORD_CHAIN_LAMP_OPTIONS],
  hard_lamp: [...RECORD_HARD_LAMP_OPTIONS],
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
  combo_lamp: filter.combo_lamp ?? [...RECORD_COMBO_LAMP_OPTIONS],
  chain_lamp: filter.chain_lamp ?? [...RECORD_CHAIN_LAMP_OPTIONS],
  hard_lamp: filter.hard_lamp ?? [...RECORD_HARD_LAMP_OPTIONS],
})

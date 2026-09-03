import { CHART_CONST_MAX, CHART_CONST_MIN, SCORE_MIN } from '../constants/chart'
import {
  RECORD_CHAIN_LAMP_OPTIONS,
  RECORD_COMBO_LAMP_OPTIONS,
  RECORD_HARD_LAMP_OPTIONS,
} from '../constants/recordFilterOptions'
import type { MasterDataDTO, MasterItemDTO, VersionSummaryDTO } from '../types/api'
import type { FilterState } from '../types/recordFilter'
import { sortMasterItemsBySortOrder } from './masterData'
import { MAX_SCORE } from './scoreRank'
import { filterReleasedVersions, getShortVersionName } from './versionConverter'

/** フィルターのデフォルト値 */
export const DEFAULT_FILTER: FilterState = {
  title: '',
  difficulties: ['MASTER', 'ULTIMA'],
  opTargetOnly: false,
  opTargetType: 'current',
  favoriteSongsOnly: false,
  excludeLockedSongs: false,
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
  updatedAt: {
    min: '',
    max: '',
  },
}

/**
 * マスタデータに依存するフィルター初期値を作成する。
 *
 * @param masterData - ジャンルなどのマスタデータ。
 * @param versions - バージョン一覧。未来分は除外して初期値にする。
 * @param referenceDate - 公開済み判定に使うYYYY-MM-DD形式の基準日。既定はJST今日。
 * @returns マスタデータから作成したジャンルとバージョンの初期値。
 */
export const getMasterDataDefaults = (
  masterData?: MasterDataDTO,
  versions?: VersionSummaryDTO[],
  referenceDate?: string
) => ({
  genres: sortMasterItemsBySortOrder(masterData?.genres ?? []).map((g: MasterItemDTO) => g.name),
  versions: filterReleasedVersions(versions ?? [], referenceDate).map((version) =>
    getShortVersionName(version.name)
  ),
})

/**
 * レコードフィルターのデフォルト状態を作成する。
 *
 * @param masterData - ジャンルなどのマスタデータ。
 * @param versions - バージョン一覧。未来分は除外して初期値にする。
 * @param referenceDate - 公開済み判定に使うYYYY-MM-DD形式の基準日。既定はJST今日。
 * @returns 配列と範囲条件を複製したレコードフィルターの初期状態。
 */
export const buildDefaultFilter = (
  masterData?: MasterDataDTO,
  versions?: VersionSummaryDTO[],
  referenceDate?: string
): FilterState => ({
  ...DEFAULT_FILTER,
  ...getMasterDataDefaults(masterData, versions, referenceDate),
  const: { ...DEFAULT_FILTER.const },
  score: { ...DEFAULT_FILTER.score },
  justiceCount: { ...DEFAULT_FILTER.justiceCount },
  overPower: { ...DEFAULT_FILTER.overPower },
  combo_lamp: [...RECORD_COMBO_LAMP_OPTIONS],
  chain_lamp: [...RECORD_CHAIN_LAMP_OPTIONS],
  hard_lamp: [...RECORD_HARD_LAMP_OPTIONS],
  updatedAt: { ...DEFAULT_FILTER.updatedAt },
})

/**
 * 保存済みフィルターなどの部分的なフィルター情報を現行のFilterStateへ補完する。
 *
 * @param filter - 補完対象のフィルター情報。
 * @returns 現行フィールドをすべて持つフィルター状態。
 */
export const normalizeFilterState = (
  filter: Partial<FilterState> & { currentOpTargetOnly?: boolean }
): FilterState => {
  const { currentOpTargetOnly, ...currentFilter } = filter

  return {
    ...DEFAULT_FILTER,
    ...currentFilter,
    const: filter.const ?? { ...DEFAULT_FILTER.const },
    score: filter.score ?? { ...DEFAULT_FILTER.score },
    justiceCount: filter.justiceCount ?? { ...DEFAULT_FILTER.justiceCount },
    overPower: filter.overPower ?? { ...DEFAULT_FILTER.overPower },
    opTargetOnly: filter.opTargetOnly ?? currentOpTargetOnly ?? DEFAULT_FILTER.opTargetOnly,
    opTargetType: filter.opTargetType ?? DEFAULT_FILTER.opTargetType,
    favoriteSongsOnly: filter.favoriteSongsOnly ?? DEFAULT_FILTER.favoriteSongsOnly,
    excludeLockedSongs: filter.excludeLockedSongs ?? DEFAULT_FILTER.excludeLockedSongs,
    combo_lamp: filter.combo_lamp ?? [...RECORD_COMBO_LAMP_OPTIONS],
    chain_lamp: filter.chain_lamp ?? [...RECORD_CHAIN_LAMP_OPTIONS],
    hard_lamp: filter.hard_lamp ?? [...RECORD_HARD_LAMP_OPTIONS],
    updatedAt: filter.updatedAt ?? { ...DEFAULT_FILTER.updatedAt },
  }
}

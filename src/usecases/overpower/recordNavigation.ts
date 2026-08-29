import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import type { FilterState } from '../../types/recordFilter'
import { type ChartLevelLabel, getChartLevelConstRange } from '../../utils/chartLevel'
import { OVER_POWER_MASTER_ULTIMA_DIFFICULTIES, OVER_POWER_MASTER_ULTIMA_TARGET } from './constants'
import type { OverPowerAggregationTarget } from './types'

/** OVER POWERサマリーから通常レコードへ引き継げる分類軸 */
export type OverPowerRecordFilterDimension = 'all' | 'genre' | 'level' | 'version'

type BuildOverPowerRecordFilterParams = {
  defaultFilter: FilterState
  dimension: OverPowerRecordFilterDimension
  rowLabel: string
  aggregationTarget: OverPowerAggregationTarget
  excludeLockedSongs: boolean
}

/**
 * OVER POWERの集計対象を通常レコードの難易度・OP対象条件へ変換する。
 *
 * @param target - OVER POWER画面で選択中の集計対象。
 * @returns 通常レコードで選択する難易度とOP対象条件。
 */
const resolveAggregationTargetFilter = (
  target: OverPowerAggregationTarget
): Pick<FilterState, 'difficulties' | 'opTargetOnly' | 'opTargetType'> => {
  if (target === 'OP_TARGET') {
    return {
      difficulties: [...PLAYER_DATA_DIFFICULTIES],
      opTargetOnly: true,
      opTargetType: 'current',
    }
  }

  if (target === 'ALL') {
    return {
      difficulties: [...PLAYER_DATA_DIFFICULTIES],
      opTargetOnly: false,
      opTargetType: 'current',
    }
  }

  if (target === OVER_POWER_MASTER_ULTIMA_TARGET) {
    return {
      difficulties: [...OVER_POWER_MASTER_ULTIMA_DIFFICULTIES],
      opTargetOnly: false,
      opTargetType: 'current',
    }
  }

  return {
    difficulties: [target],
    opTargetOnly: false,
    opTargetType: 'current',
  }
}

/**
 * OVER POWERサマリーの行と集計対象から通常レコード用フィルターを作る。
 *
 * @param params - 既定フィルター、分類軸、行ラベル、集計対象、未解禁曲除外状態。
 * @returns OVER POWER画面の表示条件を反映した通常レコードフィルター。
 */
export const buildOverPowerRecordFilter = (
  params: BuildOverPowerRecordFilterParams
): FilterState => {
  const targetFilter = resolveAggregationTargetFilter(params.aggregationTarget)
  const filter: FilterState = {
    ...params.defaultFilter,
    ...targetFilter,
    excludeLockedSongs: params.excludeLockedSongs,
  }

  switch (params.dimension) {
    case 'genre':
      return { ...filter, genres: [params.rowLabel] }
    case 'level':
      return {
        ...filter,
        const: getChartLevelConstRange(params.rowLabel as ChartLevelLabel),
        constFilterMode: 'level',
      }
    case 'version':
      return { ...filter, versions: [params.rowLabel] }
    case 'all':
      return filter
  }
}

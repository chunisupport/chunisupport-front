import { MASTER_ULTIMA_DIFFICULTIES, MASTER_ULTIMA_FILTER } from '../../constants/chart'
import type { PlayerDataDifficulty } from '../../types/api'

/** MASTERとULTIMAを譜面単位で合算する集計対象ID */
export const OVER_POWER_MASTER_ULTIMA_TARGET = MASTER_ULTIMA_FILTER

/** MASTERとULTIMAの合算対象となる難易度 */
export const OVER_POWER_MASTER_ULTIMA_DIFFICULTIES: readonly PlayerDataDifficulty[] =
  MASTER_ULTIMA_DIFFICULTIES

/** 楽曲マスタの理論値OP対象譜面だけを曲ごとに集計する集計対象ID */
export const OVER_POWER_THEORETICAL_TARGET = 'THEORETICAL_OP_TARGET' as const

/** MASTERとULTIMAを譜面単位で合算する集計対象の型 */
export type OverPowerMasterUltimaTarget = typeof OVER_POWER_MASTER_ULTIMA_TARGET

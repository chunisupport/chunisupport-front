import type { PlayerDataDifficulty } from '../../types/api'

/** MASTERとULTIMAを譜面単位で合算する集計対象ID。 */
export const OVER_POWER_MASTER_ULTIMA_TARGET = 'MASTER_ULTIMA' as const

/** MASTERとULTIMAの合算対象となる難易度。 */
export const OVER_POWER_MASTER_ULTIMA_DIFFICULTIES = [
  'MASTER',
  'ULTIMA',
] as const satisfies readonly PlayerDataDifficulty[]

/** MASTERとULTIMAを譜面単位で合算する集計対象の型。 */
export type OverPowerMasterUltimaTarget = typeof OVER_POWER_MASTER_ULTIMA_TARGET

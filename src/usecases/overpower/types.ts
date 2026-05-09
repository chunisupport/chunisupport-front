import type { PlayerRecordDTO } from '../../types/api'
import type { ChartLevelLabel } from '../../utils/chartLevel'

export type OverPowerCategory = 'genre' | 'level' | 'version' | 'difficulty'

export type OverPowerSummaryRow = {
  id: string
  label: string
  current: number
  max: number
  percent: number
  count: number
}

export type OverPowerLevelSummaryRow = OverPowerSummaryRow & {
  level: ChartLevelLabel
  isLowLevel: boolean
}

export type OverPowerSummary = {
  all: OverPowerSummaryRow
  genres: OverPowerSummaryRow[]
  levels: OverPowerLevelSummaryRow[]
  versions: OverPowerSummaryRow[]
  difficulties: OverPowerSummaryRow[]
}

export type OverPowerDifficulty = PlayerRecordDTO['difficulty']

export type OverPowerLockedSong = {
  display_id: string
  is_ultima: boolean
}

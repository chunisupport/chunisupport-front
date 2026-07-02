import type { PlayerRecordDTO, SongDTO } from '../../types/api'
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
}

export type OverPowerDifficulty = PlayerRecordDTO['difficulty']

/** OVER POWER画面で選択できる集計対象。 */
export type OverPowerAggregationTarget = OverPowerDifficulty | 'OP_TARGET' | 'ALL'

export type OverPowerLockedSong = {
  display_id: string
  is_ultima: boolean
}

/** 楽曲マスタを基準に生成した譜面単位の集計エントリ。 */
export type OverPowerChartEntry = {
  song: SongDTO
  difficulty: OverPowerDifficulty
  chartConst: number
  maxOverPower: number
  level: ChartLevelLabel
  versionName: string | null
  record: PlayerRecordDTO | null
}

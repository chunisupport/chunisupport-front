import type { OverPowerSummaryRow } from '../../../usecases/overpower/types'

export type OverPowerSummaryTab = 'genres' | 'difficulties' | 'levels' | 'versions'

export type OverPowerSummaryOption = {
  value: OverPowerSummaryTab
  label: string
}

export type OverPowerSummaryViewMode = 'table' | 'graph'

export type OverPowerScoreBand = 'MAX' | 'SSS+' | 'SSS' | 'SS+' | 'SS' | 'S+' | 'S' | 'OTHER'

export type OverPowerComboBand = 'ALL JUSTICE' | 'FULL COMBO' | 'OTHER'

export type OverPowerBandCount<T extends string> = {
  label: T
  count: number
}

export type OverPowerGraphRow = {
  summary: OverPowerSummaryRow
  scoreBands: OverPowerBandCount<OverPowerScoreBand>[]
  comboBands: OverPowerBandCount<OverPowerComboBand>[]
}

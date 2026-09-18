import type { PlayerRecordDTO, SongDTO, VersionSummaryDTO } from '../../types/api'
import { formatTruncatedFixed } from '../../utils/numberFormat'
import { formatOverPowerPercent, formatOverPowerValue } from '../../utils/overPowerFormat'
import { buildOverPowerSummary } from './overpowerSummary'
import type { OverPowerLockedSong } from './types'

/** 公式OVER POWER / 公式OP%の小数点以下桁数 */
export const OFFICIAL_OVER_POWER_DECIMAL_PLACES = 2

/** 未解禁設定の下書きに対する公式値と計算値の照合結果 */
export type LockedSongsOpComparisonResult = {
  /** CHUNITHM-NETから取得した公式OVER POWER */
  officialOverPower: number
  /** CHUNITHM-NETから取得した公式OP%。記録開始前はnull */
  officialOverPowerPercent: number | null
  /** 未解禁設定を反映した計算OVER POWER */
  calculatedOverPower: number
  /** 未解禁設定を反映した計算OP% */
  calculatedOverPowerPercent: number
  /** 公式OPと計算OPが筐体表示桁で一致するか */
  overPowerMatched: boolean
  /** 公式OP%と計算OP%が筐体表示桁で一致するか。公式OP%が無い場合はnull */
  percentMatched: boolean | null
  /** OPが一致し、公式OP%がある場合はOP%も一致するか */
  matched: boolean
}

/**
 * 計算値を公式表示と同じ小数第2位へ切り捨てた文字列へ整形する。
 *
 * @param value - 整形するOVER POWERまたはOP%。
 * @returns 小数第2位に0埋めした表示文字列。
 */
export const formatOfficialOverPowerDisplay = (value: number): string =>
  formatTruncatedFixed(value, OFFICIAL_OVER_POWER_DECIMAL_PLACES)

/**
 * 計算値が公式値の筐体表示と一致するか判定する。
 *
 * @param calculated - ChuniSupport側の計算値。
 * @param official - CHUNITHM-NETから取得した公式値。
 * @returns 小数第2位へ切り捨てた表示が一致する場合はtrue。
 */
export const matchesOfficialOverPowerDisplay = (calculated: number, official: number): boolean =>
  formatOfficialOverPowerDisplay(calculated) === formatOfficialOverPowerDisplay(official)

/**
 * 符号付き差分文字列を生成する。
 *
 * @param delta - 計算値から公式値を引いた差分。
 * @param formatMagnitude - 絶対値を表示文字列へ変換する関数。
 * @returns 符号付き差分。
 */
const formatSignedDelta = (delta: number, formatMagnitude: (value: number) => string): string => {
  const sign = delta > 0 ? '+' : delta < 0 ? '-' : ''
  return `${sign}${formatMagnitude(Math.abs(delta))}`
}

/**
 * 計算OPと公式OPの差を計算値と同じ桁で符号付き表示する。
 *
 * @param calculated - ChuniSupport側の計算OP。
 * @param official - CHUNITHM-NETから取得した公式OP。
 * @returns 小数第3位の符号付き差分。
 */
export const formatLockedSongsOverPowerDelta = (calculated: number, official: number): string =>
  formatSignedDelta(calculated - official, formatOverPowerValue)

/**
 * 計算OP%と公式OP%の差を計算値と同じ桁で符号付き表示する。
 *
 * @param calculated - ChuniSupport側の計算OP%。
 * @param official - CHUNITHM-NETから取得した公式OP%。
 * @returns 小数第5位の符号付き差分。
 */
export const formatLockedSongsOverPowerPercentDelta = (
  calculated: number,
  official: number
): string => `${formatSignedDelta(calculated - official, formatOverPowerPercent)}%`

/**
 * 未解禁設定を反映した計算OP/OP%と公式値を照合する。
 *
 * @param input - 楽曲・レコード・未解禁設定と公式OP/OP%。
 * @returns 公式値、計算値、および筐体表示桁での一致判定。
 */
export const buildLockedSongsOpComparison = (input: {
  songs: SongDTO[]
  records: PlayerRecordDTO[]
  versions: VersionSummaryDTO[]
  lockedSongs: OverPowerLockedSong[]
  officialOverPower: number
  officialOverPowerPercent: number | null
}): LockedSongsOpComparisonResult => {
  const summary = buildOverPowerSummary(
    input.songs,
    input.records,
    input.versions,
    input.lockedSongs
  ).all
  const overPowerMatched = matchesOfficialOverPowerDisplay(summary.current, input.officialOverPower)
  const percentMatched =
    input.officialOverPowerPercent === null
      ? null
      : matchesOfficialOverPowerDisplay(summary.percent, input.officialOverPowerPercent)

  return {
    officialOverPower: input.officialOverPower,
    officialOverPowerPercent: input.officialOverPowerPercent,
    calculatedOverPower: summary.current,
    calculatedOverPowerPercent: summary.percent,
    overPowerMatched,
    percentMatched,
    matched: overPowerMatched && percentMatched !== false,
  }
}

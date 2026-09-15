import type { ChartStats } from '../../../types/chartStats'
import { calculateChartStatsPercent, isWorldsendChartStats } from '../../../utils/chartStats'
import { getConstDisplay } from '../../../utils/constDisplay'
import { formatInteger, formatTruncatedFixed } from '../../../utils/numberFormat'
import type { ChartStatsValueMode } from './constants'

const GENERATED_AT_FORMATTER = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Tokyo',
})

/**
 * 統計値を人数または達成率として表示用に整形する。
 *
 * @param count - 表示する人数。
 * @param playerCount - 集計対象プレイヤー数。
 * @param mode - 人数または割合の表示形式。
 * @returns 桁区切り人数、百分率、または算出不能を表すハイフン。
 */
export const formatChartStatsValue = (
  count: number,
  playerCount: number,
  mode: ChartStatsValueMode
): string => {
  if (mode === 'count') return formatInteger(count)
  const percent = calculateChartStatsPercent(count, playerCount)
  return percent === null ? '-' : `${formatTruncatedFixed(percent, 2)}%`
}

/**
 * 通常譜面の定数またはWORLD'S ENDの星数と属性を表示用に整形する。
 *
 * @param chart - 表示する譜面統計。
 * @returns 譜面のレベル情報。
 */
export const formatChartStatsLevel = (chart: ChartStats): string => {
  if (!isWorldsendChartStats(chart)) {
    const display = getConstDisplay(chart.const, chart.is_const_unknown)
    return `${display.valueText}${display.markerText ?? ''}`
  }
  const level = chart.level_star === null ? '★-' : `★${chart.level_star}`
  return chart.attribute ? `${level} ${chart.attribute}` : level
}

/**
 * 譜面のレベル情報へ適用する既存の定数表示色を取得する。
 *
 * @param chart - 表示する譜面統計。
 * @returns 未判明定数または通常値に対応する文字色クラス。
 */
export const getChartStatsLevelClass = (chart: ChartStats): string =>
  isWorldsendChartStats(chart)
    ? 'text-text-muted'
    : getConstDisplay(chart.const, chart.is_const_unknown).className

/**
 * 静的統計JSONの生成日時を日本時間の表示へ整形する。
 *
 * @param value - ISO 8601形式の生成日時。
 * @returns 日本時間の日時。不正な値の場合はハイフン。
 */
export const formatChartStatsGeneratedAt = (value: string): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : GENERATED_AT_FORMATTER.format(date)
}

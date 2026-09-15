import type {
  ChartStats,
  ChartStatsClear,
  ChartStatsCombo,
  ChartStatsRank,
  WorldsendChartStats,
} from '../types/chartStats'
import { normalizeForSearch } from './searchUtils'

/** レコード統計で切り替える集計カテゴリ */
export type ChartStatsCategory = 'rank' | 'combo' | 'clear'

/** グラフまたは表へ表示する統計値 */
export type ChartStatsMetricValue = {
  key: string
  label: string
  count: number
}

/** スコアランク分布の表示順とJSONキー */
const RANK_DISTRIBUTION_DEFINITIONS = [
  ['max', 'MAX'],
  ['sssp', 'SSS+'],
  ['sss', 'SSS'],
  ['ssp', 'SS+'],
  ['ss', 'SS'],
  ['sp', 'S+'],
  ['s', 'S'],
  ['aaal', '～AAA'],
] as const satisfies readonly (readonly [keyof ChartStatsRank, string])[]

/** コンボランプ分布の表示順とJSONキー */
const COMBO_DISTRIBUTION_DEFINITIONS = [
  ['ajc', 'AJC'],
  ['aj', 'AJ'],
  ['fc', 'FC'],
  ['none', 'なし'],
] as const satisfies readonly (readonly [keyof ChartStatsCombo, string])[]

/** クリアランプ分布の表示順とJSONキー */
const CLEAR_DISTRIBUTION_DEFINITIONS = [
  ['catastrophy', 'CATASTROPHY'],
  ['absolute', 'ABSOLUTE'],
  ['brave', 'BRAVE'],
  ['hard', 'HARD'],
  ['clear', 'CLEAR'],
  ['failed', 'FAILED'],
] as const satisfies readonly (readonly [keyof ChartStatsClear, string])[]

/**
 * WORLD'S END譜面統計か判定する。
 *
 * @param chart - 判定する譜面統計。
 * @returns WORLD'S END固有フィールドを持つ場合はtrue。
 */
export const isWorldsendChartStats = (chart: ChartStats): chart is WorldsendChartStats =>
  'level_star' in chart

/**
 * 排他的なJSON件数を積み上げグラフ用の表示順へ変換する。
 *
 * @param chart - 変換する譜面統計。
 * @param category - 表示する集計カテゴリ。
 * @returns 高い達成段階から未達成段階までの排他的件数。
 */
export const buildChartStatsDistribution = (
  chart: ChartStats,
  category: ChartStatsCategory
): ChartStatsMetricValue[] => {
  if (category === 'rank') {
    return RANK_DISTRIBUTION_DEFINITIONS.map(([key, label]) => ({
      key,
      label,
      count: chart.rank[key],
    }))
  }
  if (category === 'combo') {
    return COMBO_DISTRIBUTION_DEFINITIONS.map(([key, label]) => ({
      key,
      label,
      count: chart.combo[key],
    }))
  }
  return CLEAR_DISTRIBUTION_DEFINITIONS.map(([key, label]) => ({
    key,
    label,
    count: chart.clear[key],
  }))
}

/**
 * 排他的なJSON件数から表へ表示する累積達成人数を算出する。
 *
 * @param chart - 変換する譜面統計。
 * @param category - 表示する集計カテゴリ。
 * @returns 各到達条件以上の累積人数。
 */
export const buildChartStatsCumulativeValues = (
  chart: ChartStats,
  category: ChartStatsCategory
): ChartStatsMetricValue[] => {
  if (category === 'rank') {
    const { max, sssp, sss, ssp, ss, sp, s } = chart.rank
    return [
      { key: 'max', label: 'MAX', count: max },
      { key: 'sssp', label: 'SSS+', count: max + sssp },
      { key: 'sss', label: 'SSS', count: max + sssp + sss },
      { key: 'ssp', label: 'SS+', count: max + sssp + sss + ssp },
      { key: 'ss', label: 'SS', count: max + sssp + sss + ssp + ss },
      { key: 's', label: 'S', count: max + sssp + sss + ssp + ss + sp + s },
    ]
  }
  if (category === 'combo') {
    const { ajc, aj, fc } = chart.combo
    return [
      { key: 'ajc', label: 'AJC', count: ajc },
      { key: 'aj', label: 'AJ', count: ajc + aj },
      { key: 'fc', label: 'FC', count: ajc + aj + fc },
    ]
  }

  const { catastrophy, absolute, brave, hard, clear } = chart.clear
  return [
    { key: 'catastrophy', label: 'CATASTROPHY', count: catastrophy },
    { key: 'absolute', label: 'ABSOLUTE', count: catastrophy + absolute },
    { key: 'brave', label: 'BRAVE', count: catastrophy + absolute + brave },
    { key: 'hard', label: 'HARD', count: catastrophy + absolute + brave + hard },
    {
      key: 'clear',
      label: 'CLEAR',
      count: catastrophy + absolute + brave + hard + clear,
    },
  ]
}

/**
 * プレイヤー数を分母として達成率を算出する。
 *
 * @param count - 達成人数。
 * @param playerCount - 集計対象プレイヤー数。
 * @returns 百分率。プレイヤーが0人の場合はnull。
 */
export const calculateChartStatsPercent = (count: number, playerCount: number): number | null =>
  playerCount > 0 ? (count / playerCount) * 100 : null

/**
 * 曲名が検索文字列に一致する譜面統計だけを取得する。
 *
 * @param charts - 検索対象の譜面統計。
 * @param query - 曲名検索文字列。
 * @returns 元の順序を保った絞り込み結果。
 */
export const filterChartStatsByTitle = (
  charts: readonly ChartStats[],
  query: string
): ChartStats[] => {
  const normalizedQuery = normalizeForSearch(query)
  if (!normalizedQuery) return [...charts]
  return charts.filter((chart) => normalizeForSearch(chart.title).includes(normalizedQuery))
}

/**
 * 譜面統計を指定ページの範囲へ切り出す。
 *
 * @param charts - ページング対象の譜面統計。
 * @param page - 1始まりのページ番号。
 * @param pageSize - 1ページに表示する件数。
 * @returns 指定ページに含まれる譜面統計。
 */
export const paginateChartStats = (
  charts: readonly ChartStats[],
  page: number,
  pageSize: number
): ChartStats[] => {
  const start = (Math.max(1, page) - 1) * Math.max(1, pageSize)
  return charts.slice(start, start + Math.max(1, pageSize))
}

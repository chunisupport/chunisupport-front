import type {
  ChartStats,
  ChartStatsClear,
  ChartStatsCombo,
  ChartStatsRank,
  WorldsendChartStats,
} from '../types/chartStats'
import { normalizeForSearch } from './searchUtils'
import { compareSongsByReading } from './songTitleSorting'
import type { SortDirection } from './sortingQuery'

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

/** WORLD'S ENDの属性比較に使う日本語照合 */
const CHART_STATS_ATTRIBUTE_COLLATOR = new Intl.Collator('ja')

/**
 * WORLD'S END譜面統計か判定する。
 *
 * @param chart - 判定する譜面統計。
 * @returns WORLD'S END固有フィールドを持つ場合はtrue。
 */
export const isWorldsendChartStats = (chart: ChartStats): chart is WorldsendChartStats =>
  'level_star' in chart

/**
 * 定数またはWORLD'S ENDの星数と属性を比較する。
 * 星数と属性の欠損値はソート方向に関わらず末尾へ回す。
 *
 * @param left - 左側の譜面統計。
 * @param right - 右側の譜面統計。
 * @param direction - 昇順は1、降順は-1。
 * @returns 左が先なら負、右が先なら正、同順なら0。
 */
const compareChartStatsLevel = (left: ChartStats, right: ChartStats, direction: 1 | -1): number => {
  const leftWorldsend = isWorldsendChartStats(left)
  const rightWorldsend = isWorldsendChartStats(right)
  if (!leftWorldsend && !rightWorldsend) {
    return (left.const - right.const) * direction
  }
  if (leftWorldsend && rightWorldsend) {
    const leftStar = left.level_star
    const rightStar = right.level_star
    if (leftStar === null && rightStar === null) {
      // 属性の比較へ進む
    } else if (leftStar === null) {
      return 1
    } else if (rightStar === null) {
      return -1
    } else if (leftStar !== rightStar) {
      return (leftStar - rightStar) * direction
    }
    const leftAttribute = left.attribute ?? ''
    const rightAttribute = right.attribute ?? ''
    if (leftAttribute === '' && rightAttribute === '') return 0
    if (leftAttribute === '') return 1
    if (rightAttribute === '') return -1
    return CHART_STATS_ATTRIBUTE_COLLATOR.compare(leftAttribute, rightAttribute) * direction
  }
  return leftWorldsend ? 1 : -1
}

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
      { key: 'sp', label: 'S+', count: max + sssp + sss + ssp + ss + sp },
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
 * 譜面統計を指定列で安定ソートする。
 *
 * ソートキーには `title`（曲名）、`level`（定数または星数と属性）、`player_count`（人数）、
 * または集計カテゴリに対応する累積指標キー（`buildChartStatsCumulativeValues` のキー）を指定する。
 * 同順の譜面は曲名の読み順、元の順序の順で確定する。
 *
 * @param charts - ソート対象の譜面統計。
 * @param sortKey - ソート対象列。未指定なら元の順序を保った複製を返す。
 * @param sortDirection - 昇順または降順。未指定なら元の順序を保った複製を返す。
 * @param category - 累積指標キーを解決する集計カテゴリ。
 * @returns ソート済みの新しい譜面統計配列。
 */
export const sortChartStats = (
  charts: readonly ChartStats[],
  sortKey: string | null,
  sortDirection: SortDirection | null,
  category: ChartStatsCategory
): ChartStats[] => {
  if (!sortKey || !sortDirection) return [...charts]
  const direction = sortDirection === 'asc' ? 1 : -1
  const cumulativeCounts =
    sortKey === 'title' || sortKey === 'level' || sortKey === 'player_count'
      ? null
      : new Map(
          charts.map(
            (chart) =>
              [
                chart,
                new Map(
                  buildChartStatsCumulativeValues(chart, category).map(
                    (metric) => [metric.key, metric.count] as const
                  )
                ),
              ] as const
          )
        )

  return charts
    .map((chart, index) => ({ chart, index }))
    .sort((left, right) => {
      let comparison = 0
      if (sortKey === 'title') {
        comparison = compareSongsByReading(left.chart, right.chart) * direction
      } else if (sortKey === 'level') {
        comparison = compareChartStatsLevel(left.chart, right.chart, direction)
      } else if (sortKey === 'player_count') {
        comparison = (left.chart.player_count - right.chart.player_count) * direction
      } else {
        comparison =
          ((cumulativeCounts?.get(left.chart)?.get(sortKey) ?? 0) -
            (cumulativeCounts?.get(right.chart)?.get(sortKey) ?? 0)) *
          direction
      }
      if (comparison !== 0) return comparison
      if (sortKey !== 'title') {
        const titleComparison = compareSongsByReading(left.chart, right.chart)
        if (titleComparison !== 0) return titleComparison
      }
      return left.index - right.index
    })
    .map(({ chart }) => chart)
}

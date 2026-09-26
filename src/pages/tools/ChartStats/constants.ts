import { localizedCopy } from '../../../i18n'
import type { ChartStatsDifficulty } from '../../../types/chartStats'
import type { ChartStatsCategory } from '../../../utils/chartStats'

/** レコード統計の表示文言 */
const CHART_STATS_TEXT = localizedCopy('tools.chartStats')

/** レコード統計ページの表示形式 */
export type ChartStatsViewMode = 'graph' | 'table'

/** レコード統計の数値表示形式 */
export type ChartStatsValueMode = 'count' | 'percent'

/** 難易度タブの表示情報 */
export type ChartStatsDifficultyOption = {
  value: ChartStatsDifficulty
  label: string
}

/** レコード統計ページに表示する難易度 */
export const CHART_STATS_DIFFICULTY_OPTIONS: readonly ChartStatsDifficultyOption[] = [
  { value: 'BASIC', label: 'BASIC' },
  { value: 'ADVANCED', label: 'ADVANCED' },
  { value: 'EXPERT', label: 'EXPERT' },
  { value: 'MASTER', label: 'MASTER' },
  { value: 'ULTIMA', label: 'ULTIMA' },
  { value: "WORLD'S END", label: "WORLD'S END" },
]

/** 初期表示する難易度 */
export const CHART_STATS_DEFAULT_DIFFICULTY: ChartStatsDifficulty = 'MASTER'

/** ヒートマップで最も濃いセルへ混ぜるアクセント色の割合 */
export const CHART_STATS_HEATMAP_MAX_MIX_PERCENT = 55

/** 表示形式の選択肢 */
export const CHART_STATS_VIEW_OPTIONS: readonly {
  value: ChartStatsViewMode
  label: string
}[] = [
  { value: 'graph', label: CHART_STATS_TEXT.graphLabel },
  { value: 'table', label: CHART_STATS_TEXT.tableLabel },
]

/** 集計カテゴリの選択肢 */
export const CHART_STATS_CATEGORY_OPTIONS: readonly {
  value: ChartStatsCategory
  label: string
}[] = [
  { value: 'rank', label: 'RANK' },
  { value: 'combo', label: 'COMBO' },
  { value: 'clear', label: 'HARD' },
]

/** 件数と割合の選択肢 */
export const CHART_STATS_VALUE_OPTIONS: readonly {
  value: ChartStatsValueMode
  label: string
}[] = [
  { value: 'count', label: CHART_STATS_TEXT.countLabel },
  { value: 'percent', label: CHART_STATS_TEXT.percentLabel },
]

/** レコード統計ページの表示文言。タイトルと説明文はツール一覧の定義を参照すること。 */
export const CHART_STATS_COPY = localizedCopy('tools.chartStats.chartStatsCopy')

import type { ChartStatsDifficulty } from '../../../types/chartStats'
import type { ChartStatsCategory } from '../../../utils/chartStats'

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
  { value: 'graph', label: 'グラフ' },
  { value: 'table', label: '表' },
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
  { value: 'count', label: '人数' },
  { value: 'percent', label: '割合' },
]

/** レコード統計ページの表示文言 */
export const CHART_STATS_COPY = {
  title: 'レコード統計',
  description: '全プレイヤーの記録から、譜面ごとの達成状況を確認できます。',
  generatedAt: '最終更新',
  searchLabel: '曲名検索',
  searchPlaceholder: '曲名で検索',
  resultSuffix: '譜面',
  level: '定数',
  worldsendLevel: 'Lv./属性',
  playerCount: '人数',
  heatmap: 'ヒートマップ',
  empty: '条件に一致する譜面がありません。',
  graphTableCaption: '譜面ごとの達成状況を1行1グラフで示した表',
  tableCaption: '譜面ごとの累積達成人数または達成率',
} as const

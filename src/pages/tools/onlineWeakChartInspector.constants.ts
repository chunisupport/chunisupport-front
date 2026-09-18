import { THEORETICAL_OVER_POWER_TARGET_LABEL } from '../../constants/chart'
import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import {
  ONLINE_WEAK_CHART_OP_TARGET_FILTER,
  ONLINE_WEAK_CHART_TABLE_FILTER,
  type OnlineWeakChartDifficulty,
  type OnlineWeakChartTableFilter,
} from '../../utils/onlineWeakChartInspector'

/** 苦手譜面インスペクター Online の画面文言。タイトルと説明文はツール一覧の定義を参照すること。 */
export const ONLINE_WEAK_CHART_COPY = {
  ratingBand: '比較するレート帯',
  difficulty: '難易度',
  chartTitle: '平均スコアとの差',
  chartLabel: '横軸が譜面定数、縦軸が自分のスコアから同レート帯の平均スコアを引いた値の散布図',
  tableTitle: '平均との比較一覧',
  tableCaption: '自分のスコアと同レート帯の平均スコアの比較',
  tableFilterLabel: '比較結果の絞り込み',
  tableFilterAll: 'すべて',
  tableFilterAboveAverage: '平均以上',
  tableFilterBelowAverage: '平均未満',
  tableFilterEmpty: 'この条件に一致する譜面がありません。',
  empty: '比較できるプレイ済み譜面がありません。',
  ownScore: 'スコア',
  averageScore: '平均',
  difference: '点差',
  settingsTitle: '表示・集計範囲',
  settingsOpen: '表示・集計範囲を開く',
  displayScoreRange: '表示スコア範囲',
  filterUnselected: '未選択',
  chartConstRange: '譜面定数',
  chartConstMin: '譜面定数 最小',
  chartConstMax: '譜面定数 最大',
  reset: '初期値に戻す',
  cancel: 'キャンセル',
  apply: '適用',
  lowerDataset: '平均より低い',
  higherDataset: '平均以上',
  songTitle: '曲名',
  chartConst: '定数',
} as const

/** 苦手譜面インスペクター Online の比較表で選択できる平均との比較条件 */
export const ONLINE_WEAK_CHART_TABLE_FILTER_OPTIONS: readonly {
  /** 比較条件の値 */
  value: OnlineWeakChartTableFilter
  /** 比較条件の表示名 */
  label: string
}[] = [
  {
    value: ONLINE_WEAK_CHART_TABLE_FILTER.all,
    label: ONLINE_WEAK_CHART_COPY.tableFilterAll,
  },
  {
    value: ONLINE_WEAK_CHART_TABLE_FILTER.aboveAverage,
    label: ONLINE_WEAK_CHART_COPY.tableFilterAboveAverage,
  },
  {
    value: ONLINE_WEAK_CHART_TABLE_FILTER.belowAverage,
    label: ONLINE_WEAK_CHART_COPY.tableFilterBelowAverage,
  },
]

/** 散布図の譜面定数座標をずらす最大単位 */
export const ONLINE_WEAK_CHART_POINT_JITTER = 0.012

/** Online の表示・集計範囲の初期値 */
export const ONLINE_WEAK_CHART_FILTER_DEFAULT = {
  difficulties: ['MASTER', 'ULTIMA'],
  displayScoreRange: 10000,
  constMin: 1,
  constMax: 16,
  genres: null,
  versions: null,
} as const

/** Online の表示スコア範囲に指定できる最小値 */
export const ONLINE_WEAK_CHART_DISPLAY_SCORE_RANGE_MIN = 1

/** 苦手譜面インスペクター Online の難易度選択肢 */
export const ONLINE_WEAK_CHART_DIFFICULTY_OPTIONS: readonly {
  /** 選択状態で保持する値 */
  value: OnlineWeakChartDifficulty
  /** チェックボックスに表示する名前 */
  label: string
}[] = [
  {
    value: ONLINE_WEAK_CHART_OP_TARGET_FILTER,
    label: THEORETICAL_OVER_POWER_TARGET_LABEL,
  },
  ...PLAYER_DATA_DIFFICULTIES.map((difficulty) => ({
    value: difficulty,
    label: difficulty,
  })),
]

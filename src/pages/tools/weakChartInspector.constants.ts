import { CHART_COPY } from '../../constants/chart'
import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import { localizedCopy } from '../../i18n'
import {
  WEAK_CHART_OP_TARGET_FILTER,
  type WeakChartAggregationDifficulty,
} from '../../utils/weakChartInspector'

/** 苦手譜面インスペクターの画面表示文言。タイトルと説明文はツール一覧の定義を参照すること。 */
export const WEAK_CHART_INSPECTOR_COPY = localizedCopy(
  'tools.weakChartInspector.weakChartInspectorCopy'
)

/** Chart.jsへ渡すCSSカスタムプロパティ名 */
export const WEAK_CHART_INSPECTOR_COLORS = {
  text: '--cs-color-text-muted',
  grid: '--cs-color-border',
  point: '--cs-color-weak-chart-point',
  outlier: '--cs-color-weak-chart-outlier',
} as const

/** スコア点を重ねる際の横方向の最大ずらし幅 */
export const WEAK_CHART_POINT_JITTER = 0.035

/** 散布図のスコア軸目盛り間隔 */
export const WEAK_CHART_SCORE_TICK_INTERVAL = 1000

/** 下部ナビゲーションで表示できる最大幅を基準にした散布図の最小幅 */
export const WEAK_CHART_MIN_WIDTH_CLASS = 'min-w-[44rem]'

/** グラフ設定画面の表示文言 */
export const WEAK_CHART_SETTINGS_COPY = localizedCopy(
  'tools.weakChartInspector.weakChartSettingsCopy'
)

/** グラフ軸設定（表示の絞り込み）の初期値 */
export const WEAK_CHART_AXIS_SETTINGS_DEFAULT = {
  yMin: 1000000,
  yMax: 1010000,
  xMin: 10.0,
  xMax: 16.0,
} as const

/** グラフ集計対象設定（集計対象の絞り込み）の初期値 */
export const WEAK_CHART_AGGREGATION_SETTINGS_DEFAULT = {
  scoreMin: 0,
  scoreMax: 1010000,
  constMin: 1.0,
  constMax: 16.0,
} as const

/** 苦手譜面インスペクターの集計対象難易度選択肢 */
export const WEAK_CHART_AGGREGATION_DIFFICULTY_OPTIONS: readonly {
  /** 選択状態で保持する値 */
  value: WeakChartAggregationDifficulty
  /** チェックボックスに表示する名前 */
  label: string
}[] = [
  {
    value: WEAK_CHART_OP_TARGET_FILTER,
    label: CHART_COPY.opTarget,
  },
  ...PLAYER_DATA_DIFFICULTIES.map((difficulty) => ({
    value: difficulty,
    label: difficulty,
  })),
]

/** 集計対象とする初期難易度 */
export const WEAK_CHART_AGGREGATION_DIFFICULTIES_DEFAULT: readonly WeakChartAggregationDifficulty[] =
  ['MASTER', 'ULTIMA']

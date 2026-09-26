import { CHART_COPY } from '../../constants/chart'
import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import { localizedCopy } from '../../i18n'
import {
  ONLINE_WEAK_CHART_OP_TARGET_FILTER,
  ONLINE_WEAK_CHART_TABLE_FILTER,
  type OnlineWeakChartDifficulty,
  type OnlineWeakChartTableFilter,
} from '../../utils/onlineWeakChartInspector'

/** 苦手譜面インスペクター Online の画面文言。タイトルと説明文はツール一覧の定義を参照すること。 */
export const ONLINE_WEAK_CHART_COPY = localizedCopy(
  'tools.onlineWeakChartInspector.onlineWeakChartCopy'
)

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
    label: CHART_COPY.opTarget,
  },
  ...PLAYER_DATA_DIFFICULTIES.map((difficulty) => ({
    value: difficulty,
    label: difficulty,
  })),
]

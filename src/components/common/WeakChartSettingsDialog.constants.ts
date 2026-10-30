import {
  CHART_CONST_MAX,
  CHART_CONST_MIN,
  THEORETICAL_OVER_POWER_TARGET_LABEL,
  WEAK_CHART_INSPECTOR_DIFFICULTIES,
} from '../../constants/chart'
import { PLAYER_DATA_DIFFICULTIES } from '../../constants/difficulty'
import {
  ONLINE_WEAK_CHART_OP_TARGET_FILTER,
  type OnlineWeakChartDifficulty,
  type WeakChartSettings,
} from '../../utils/onlineWeakChartInspector'

/** 苦手譜面インスペクターの表示・集計範囲ダイアログの文言。 */
export const WEAK_CHART_SETTINGS_COPY = {
  title: '表示・集計範囲',
  open: '表示・集計範囲を開く',
  difficulty: '難易度',
  filterUnselected: '未選択',
  chartConstRange: '譜面定数',
  chartConstMin: '譜面定数 最小',
  chartConstMax: '譜面定数 最大',
  reset: '初期値に戻す',
  cancel: 'キャンセル',
  apply: '適用',
} as const

/** 表示・集計範囲の初期値。難易度は MASTER と ULTIMA、その他は全範囲。 */
export const WEAK_CHART_SETTINGS_DEFAULT: WeakChartSettings = {
  difficulties: [...WEAK_CHART_INSPECTOR_DIFFICULTIES],
  constMin: CHART_CONST_MIN,
  constMax: CHART_CONST_MAX,
  genres: null,
  versions: null,
  nameFolders: null,
}

/** 表示・集計範囲で選択できる難易度。理論値OVER POWER対象を先頭に置く。 */
export const WEAK_CHART_SETTINGS_DIFFICULTY_OPTIONS: readonly {
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

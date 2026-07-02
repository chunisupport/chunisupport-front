import type { OverPowerSubPage } from '../UserPage/profilePageQuery'
import type {
  OverPowerAggregationTargetOption,
  OverPowerComboBand,
  OverPowerScoreBand,
  OverPowerSummaryOption,
  OverPowerSummaryTab,
  OverPowerSummaryViewMode,
} from './types'

/** OVERPOWERサマリーを開いたときに最初に表示する表示形式。 */
export const DEFAULT_OVER_POWER_SUMMARY_VIEW_MODE: OverPowerSummaryViewMode = 'graph'

/** レベル別集計で初期状態では折りたたむ低レベル帯の表示名。 */
export const LOW_LEVEL_SUMMARY_LABEL = 'Lv.1-9+'

/** OVER POWERサマリーの表示軸選択肢。 */
export const OVER_POWER_SUMMARY_OPTIONS: OverPowerSummaryOption[] = [
  { value: 'genres', label: 'ジャンル' },
  { value: 'levels', label: 'レベル' },
  { value: 'versions', label: 'バージョン' },
]

/** OVER POWERサマリーの集計対象選択肢。 */
export const OVER_POWER_AGGREGATION_TARGET_OPTIONS: OverPowerAggregationTargetOption[] = [
  { value: 'OP_TARGET', label: 'OVER POWER対象' },
  { value: 'BASIC', label: 'BASIC' },
  { value: 'ADVANCED', label: 'ADVANCED' },
  { value: 'EXPERT', label: 'EXPERT' },
  { value: 'MASTER', label: 'MASTER' },
  { value: 'ULTIMA', label: 'ULTIMA' },
  { value: 'ALL', label: '全難易度' },
]

/** OVER POWER集計画面で表示する達成率の小数点以下桁数。 */
export const OVER_POWER_SUMMARY_PERCENT_DECIMAL_PLACES = 5

/** 未解禁曲を集計対象から除外する操作の表示名。 */
export const OVER_POWER_LOCKED_SONG_EXCLUSION_LABEL = '未解禁曲除外'

/** OVER POWER画面の操作ラベル。 */
export const OVER_POWER_CONTROL_LABELS = {
  aggregationTarget: '集計対象',
  lockedSongs: '未解禁曲',
  lockedSongsSettings: '未解禁楽曲設定',
  songCount: '曲数',
  chartCount: '譜面数',
  graph: 'グラフ',
  table: 'テーブル',
} as const

/** URLサブページからOVER POWERサマリーの表示軸へ変換する対応表。 */
export const overPowerSummaryTabBySubPage: Record<OverPowerSubPage, OverPowerSummaryTab> = {
  genre: 'genres',
  level: 'levels',
  version: 'versions',
}

/** OVER POWERサマリーの表示軸からURLサブページへ変換する対応表。 */
export const overPowerSubPageBySummaryTab: Record<OverPowerSummaryTab, OverPowerSubPage> = {
  genres: 'genre',
  levels: 'level',
  versions: 'version',
}

/** OVER POWERグラフで表示するスコア帯の順序。 */
export const OVER_POWER_SCORE_BANDS: OverPowerScoreBand[] = [
  'MAX',
  'SSS+',
  'SSS',
  'SS+',
  'SS',
  'S+',
  'S',
  'OTHER',
]

/** OVER POWERグラフで表示するコンボ帯の順序。 */
export const OVER_POWER_COMBO_BANDS: OverPowerComboBand[] = ['ALL JUSTICE', 'FULL COMBO', 'OTHER']

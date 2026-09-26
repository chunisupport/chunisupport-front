import { localizedCopy, withLocalizedLabels } from '../../../i18n'
import { OVER_POWER_MASTER_ULTIMA_TARGET } from '../../../usecases/overpower/constants'
import type { OverPowerRecordFilterDimension } from '../../../usecases/overpower/recordNavigation'
import type { OverPowerSubPage } from '../../../utils/userProfileRoute'
import type {
  OverPowerAggregationTargetOption,
  OverPowerComboBand,
  OverPowerScoreBand,
  OverPowerSummaryOption,
  OverPowerSummaryTab,
  OverPowerSummaryViewMode,
} from './types'

/** OVER POWER画面全体の表示文言 */
const OVER_POWER_COPY_ROOT = localizedCopy('users.overPower')

/** OVER POWER画面の表示文言 */
export const OVER_POWER_COPY = localizedCopy('users.overPower.page')

/** OVERPOWERサマリーを開いたときに最初に表示する表示形式 */
export const DEFAULT_OVER_POWER_SUMMARY_VIEW_MODE: OverPowerSummaryViewMode = 'graph'

/** レベル別集計で初期状態では折りたたむ低レベル帯の表示名 */
export const LOW_LEVEL_SUMMARY_LABEL = 'Lv.1-9+'

/** OVER POWERサマリーの表示軸選択肢 */
export const OVER_POWER_SUMMARY_OPTIONS: OverPowerSummaryOption[] = withLocalizedLabels(
  [
  { value: 'genres' },
  { value: 'levels' },
  { value: 'versions' },
],
  OVER_POWER_COPY_ROOT.summaryOptions
)

/** OVER POWERサマリーの集計対象選択肢 */
export const OVER_POWER_AGGREGATION_TARGET_OPTIONS: OverPowerAggregationTargetOption[] = [
  { value: 'OP_TARGET', label: OVER_POWER_COPY_ROOT.aggregationTargets.opTarget },
  { value: 'BASIC', label: 'BASIC' },
  { value: 'ADVANCED', label: 'ADVANCED' },
  { value: 'EXPERT', label: 'EXPERT' },
  { value: 'MASTER', label: 'MASTER' },
  { value: 'ULTIMA', label: 'ULTIMA' },
  { value: OVER_POWER_MASTER_ULTIMA_TARGET, label: 'MASTER + ULTIMA' },
  { value: 'ALL', label: OVER_POWER_COPY_ROOT.aggregationTargets.all },
]

/** OVER POWER集計画面で表示する達成率の小数点以下桁数 */
export const OVER_POWER_SUMMARY_PERCENT_DECIMAL_PLACES = 5

/** 未解禁楽曲設定ダイアログのプレイ状況フィルター */
export type LockedSongsPlayStatus = 'played' | 'unplayed'

/** 未解禁楽曲設定ダイアログのプレイ状況フィルター選択肢 */
export const LOCKED_SONG_PLAY_STATUS_OPTIONS = withLocalizedLabels(
  [
  { value: 'unplayed' },
  { value: 'played' },
] as const,
  OVER_POWER_COPY_ROOT.playStatuses
)

/** 未解禁楽曲設定ダイアログのプレイ状況フィルター表示文言 */
export const LOCKED_SONG_PLAY_STATUS_FILTER_COPY = localizedCopy('users.overPower.playStatusFilter')

/** 未解禁楽曲設定ダイアログで公式値と計算値を見比べる表示の文言 */
export const LOCKED_SONGS_OP_COMPARISON_COPY = localizedCopy('users.overPower.opComparison')

/** OVER POWER画面の操作ラベル */
export const OVER_POWER_CONTROL_LABELS = localizedCopy('users.overPower.controls')

/** URLサブページからOVER POWERサマリーの表示軸へ変換する対応表 */
export const overPowerSummaryTabBySubPage: Record<OverPowerSubPage, OverPowerSummaryTab> = {
  genre: 'genres',
  level: 'levels',
  version: 'versions',
}

/** OVER POWERサマリーの表示軸からURLサブページへ変換する対応表 */
export const overPowerSubPageBySummaryTab: Record<OverPowerSummaryTab, OverPowerSubPage> = {
  genres: 'genre',
  levels: 'level',
  versions: 'version',
}

/** OVER POWERの表示軸から通常レコードへ引き継ぐ分類軸への対応 */
export const overPowerRecordFilterDimensionBySummaryTab: Record<
  OverPowerSummaryTab,
  OverPowerRecordFilterDimension
> = {
  genres: 'genre',
  levels: 'level',
  versions: 'version',
}

/** OVER POWERグラフで表示するスコア帯の順序 */
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

/** OVER POWERグラフで表示するコンボ帯の順序 */
export const OVER_POWER_COMBO_BANDS: OverPowerComboBand[] = ['ALL JUSTICE', 'FULL COMBO', 'OTHER']

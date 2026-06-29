import type { OverPowerSubPage } from '../UserPage/profilePageQuery'
import type {
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

/** OVER POWERサマリーの集計軸選択肢。 */
export const OVER_POWER_SUMMARY_OPTIONS: OverPowerSummaryOption[] = [
  { value: 'genres', label: 'ジャンル' },
  { value: 'difficulties', label: '難易度' },
  { value: 'levels', label: 'レベル' },
  { value: 'versions', label: 'バージョン' },
]

/** URLサブページからOVER POWERサマリーの集計軸へ変換する対応表。 */
export const overPowerSummaryTabBySubPage: Record<OverPowerSubPage, OverPowerSummaryTab> = {
  genre: 'genres',
  diff: 'difficulties',
  level: 'levels',
  version: 'versions',
}

/** OVER POWERサマリーの集計軸からURLサブページへ変換する対応表。 */
export const overPowerSubPageBySummaryTab: Record<OverPowerSummaryTab, OverPowerSubPage> = {
  genres: 'genre',
  difficulties: 'diff',
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

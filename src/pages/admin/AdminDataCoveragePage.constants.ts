import type { AppTabOption } from '../../components/common/AppTabs'
import type { ChartMetadataCoverageField } from './dataCoverage'

/** データ充足状況画面のタブ値 */
export type DataCoverageTab = 'chartConstant' | ChartMetadataCoverageField

/** データ充足状況画面のタブ */
export const DATA_COVERAGE_TABS: readonly AppTabOption<DataCoverageTab>[] = [
  { value: 'chartConstant', label: '譜面定数' },
  { value: 'notes', label: 'ノーツ数' },
  { value: 'notesDesigner', label: 'NOTES DESIGNER' },
]

/** データ充足状況画面に表示する文言 */
export const ADMIN_DATA_COVERAGE_COPY = {
  pageTitle: 'データ充足状況',
  heading: 'データ充足状況',
  levelColumn: 'Lv',
  totalColumn: '全体',
  songColumn: '曲名',
  difficultyColumn: '難易度',
  unavailablePercentage: '—',
  countSuffix: '件',
  loadError: '楽曲データを取得できませんでした。',
  worldsendDifficulty: "WORLD'S END",
  chartConstant: {
    overallHeading: '譜面定数の総合充足率',
    matrixHeading: '難易度・レベル別',
    matrixCaption: 'レベル10以上の難易度とレベル別の譜面定数充足状況',
    allLevelsRowAriaLabel: 'レベル10以上の合計',
    missingHeading: '未判明譜面',
    missingCaption: 'レベル10以上で譜面定数が未判明の通常譜面一覧',
    noMissingCharts: '未判明の譜面定数はありません。',
  },
  notes: {
    overallHeading: 'ノーツ数の総合充足率',
    difficultyHeading: '難易度別',
    difficultyCaption: "難易度別の通常譜面とWORLD'S END譜面のノーツ数充足状況",
    missingHeading: 'ノーツ数未登録譜面',
    missingCaption: "ノーツ数が未登録の通常譜面とWORLD'S END譜面一覧",
    noMissingCharts: 'ノーツ数が未登録の譜面はありません。',
  },
  notesDesigner: {
    overallHeading: 'NOTES DESIGNERの総合充足率',
    difficultyHeading: '難易度別',
    difficultyCaption: "EXPERT以上の通常譜面とWORLD'S END譜面のNOTES DESIGNER充足状況",
    missingHeading: 'NOTES DESIGNER未登録譜面',
    missingCaption: "NOTES DESIGNERが未登録のEXPERT以上の通常譜面とWORLD'S END譜面一覧",
    noMissingCharts: 'NOTES DESIGNERが未登録の譜面はありません。',
  },
} as const

/** 充足率表示で使用する小数点以下の桁数 */
export const DATA_COVERAGE_PERCENT_DECIMAL_PLACES = 2

/** 難易度・レベル別表のレベル列幅 */
export const DATA_COVERAGE_LEVEL_COLUMN_CLASS = 'w-24'

/** 難易度・レベル別表と難易度別表で難易度列と全体列に共通適用する列幅 */
export const DATA_COVERAGE_VALUE_COLUMN_CLASS = 'w-52'

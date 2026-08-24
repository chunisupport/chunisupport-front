/** データ充足状況画面に表示する文言 */
export const ADMIN_DATA_COVERAGE_COPY = {
  pageTitle: 'データ充足状況',
  heading: 'データ充足状況',
  overallHeading: '譜面定数の総合充足率',
  matrixHeading: '難易度・レベル別',
  matrixCaption: 'レベル10以上の難易度とレベル別の譜面定数充足状況',
  levelColumn: 'Lv',
  totalColumn: '全体',
  allLevelsRowAriaLabel: 'レベル10以上の合計',
  unknownHeading: '未判明譜面',
  unknownCountSuffix: '件',
  unknownCaption: 'レベル10以上で譜面定数が未判明の通常譜面一覧',
  songColumn: '楽曲',
  difficultyColumn: '難易度',
  unavailablePercentage: '—',
  noUnknownCharts: '未判明の譜面定数はありません。',
  loadError: '楽曲データを取得できませんでした。',
} as const

/** 充足率表示で使用する小数点以下の桁数 */
export const DATA_COVERAGE_PERCENT_DECIMAL_PLACES = 2

/** 難易度・レベル別表のレベル列幅 */
export const DATA_COVERAGE_LEVEL_COLUMN_CLASS = 'w-24'

/** 難易度・レベル別表で難易度列と全体列に共通適用する列幅 */
export const DATA_COVERAGE_VALUE_COLUMN_CLASS = 'w-52'

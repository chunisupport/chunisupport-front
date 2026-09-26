import { localizedCopy } from '../../i18n'
import type { AppTabOption } from '../../components/common/AppTabs'
import type { ChartMetadataCoverageField } from './dataCoverage'

/** データ充足状況画面の表示文言 */
const ADMIN_DATA_COVERAGE_TEXT = localizedCopy('admin.dataCoverage')

/** データ充足状況画面のタブ値 */
export type DataCoverageTab = 'chartConstant' | ChartMetadataCoverageField

/** データ充足状況画面のタブ */
export const DATA_COVERAGE_TABS: readonly AppTabOption<DataCoverageTab>[] = [
  { value: 'chartConstant', label: ADMIN_DATA_COVERAGE_TEXT.chartConstantLabel },
  { value: 'notes', label: ADMIN_DATA_COVERAGE_TEXT.notesLabel },
  { value: 'notesDesigner', label: 'NOTES DESIGNER' },
]

/** データ充足状況画面に表示する文言 */
export const ADMIN_DATA_COVERAGE_COPY = localizedCopy('admin.dataCoverage.adminDataCoverageCopy')

/** 充足率表示で使用する小数点以下の桁数 */
export const DATA_COVERAGE_PERCENT_DECIMAL_PLACES = 2

/** 難易度・レベル別表のレベル列幅 */
export const DATA_COVERAGE_LEVEL_COLUMN_CLASS = 'w-24'

/** 難易度・レベル別表と難易度別表で難易度列と全体列に共通適用する列幅 */
export const DATA_COVERAGE_VALUE_COLUMN_CLASS = 'w-52'

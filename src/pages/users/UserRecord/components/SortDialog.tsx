import type { Component } from 'solid-js'
import {
  type SortConditionColumnOption,
  SortConditionsDialog,
} from '../../components/SortConditionsDialog'
import type { RecordSortCondition, RecordSortKey } from '../types/types'
import { RECORD_COLUMN_DEFINITIONS } from '../utils/columns'
import { DEFAULT_RECORD_SORT_CONDITIONS, normalizeRecordSortConditions } from '../utils/sorting'

type SortDialogProps = {
  open: boolean
  sortConditions: RecordSortCondition[]
  onOpenChange: (open: boolean) => void
  onApply: (sortConditions: RecordSortCondition[]) => void
}

/** ソート列の選択肢。 */
const SORT_COLUMN_OPTIONS: SortConditionColumnOption<RecordSortKey>[] =
  RECORD_COLUMN_DEFINITIONS.map((definition) => ({
    value: definition.sortKey,
    label: definition.label,
  }))

/**
 * 通常レコード一覧のソート条件を編集するダイアログを表示する。
 *
 * @param props - 開閉状態、適用済みソート条件、開閉・適用ハンドラー。
 * @returns ソート条件を編集するダイアログUI。
 */
const SortDialog: Component<SortDialogProps> = (props) => (
  <SortConditionsDialog<RecordSortKey>
    open={props.open}
    onOpenChange={props.onOpenChange}
    sortConditions={props.sortConditions}
    defaultSortConditions={DEFAULT_RECORD_SORT_CONDITIONS}
    columnOptions={SORT_COLUMN_OPTIONS}
    fixedLastConditionLabel="曲名（昇順）で固定"
    normalizeSortConditions={normalizeRecordSortConditions}
    onApply={props.onApply}
  />
)

export default SortDialog

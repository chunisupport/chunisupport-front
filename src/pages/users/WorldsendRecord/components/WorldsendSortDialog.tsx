import type { Component } from 'solid-js'
import {
  type SortConditionColumnOption,
  SortConditionsDialog,
} from '../../components/SortConditionsDialog.tsx'
import {
  WORLDSEND_RECORD_COLUMN_DEFINITIONS,
  type WorldsendRecordSortKey,
} from '../utils/columns.ts'
import {
  DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS,
  normalizeWorldsendRecordSortConditions,
  type WorldsendRecordSortCondition,
} from '../utils/sorting.ts'

type WorldsendSortDialogProps = {
  open: boolean
  sortConditions: WorldsendRecordSortCondition[]
  onOpenChange: (open: boolean) => void
  onApply: (sortConditions: WorldsendRecordSortCondition[]) => void
}

/** WORLD'S END ソート列の選択肢。 */
const WORLDSEND_SORT_COLUMN_OPTIONS: SortConditionColumnOption<WorldsendRecordSortKey>[] =
  WORLDSEND_RECORD_COLUMN_DEFINITIONS.map((definition) => ({
    value: definition.sortKey,
    label: definition.label,
  }))

/**
 * WORLD'S END レコード一覧のソート条件を編集するダイアログを表示する。
 *
 * @param props - 開閉状態、適用済みソート条件、開閉・適用ハンドラー。
 * @returns WORLD'S END 用のソート条件を編集するダイアログUI。
 */
const WorldsendSortDialog: Component<WorldsendSortDialogProps> = (props) => (
  <SortConditionsDialog<WorldsendRecordSortKey>
    open={props.open}
    onOpenChange={props.onOpenChange}
    sortConditions={props.sortConditions}
    defaultSortConditions={DEFAULT_WORLDSEND_RECORD_SORT_CONDITIONS}
    columnOptions={WORLDSEND_SORT_COLUMN_OPTIONS}
    fixedLastConditionLabel="曲名（昇順）で固定"
    normalizeSortConditions={normalizeWorldsendRecordSortConditions}
    onApply={props.onApply}
  />
)

export default WorldsendSortDialog

import type { Component } from 'solid-js'
import type { EditingFilter } from '../../../../components/SavedRecordFiltersDialog.tsx'
import { SavedRecordFiltersDialog } from '../../../../components/SavedRecordFiltersDialog.tsx'
import type { FilterState } from '../../../types/types.ts'
import {
  deleteFilter,
  loadSavedFilters,
  SAVED_FILTER_SCHEMA_VERSION,
  saveNewFilter,
  updateSavedFilter,
} from '../../../utils/storage.ts'

type SavedFiltersDialogProps = {
  open: boolean
  currentFilters: FilterState
  onApplyFilter: (filter: FilterState) => void
  onEditFilter: (filter: FilterState) => void
  onEditingChange?: (editing: EditingFilter | null) => void
  editedFilterName?: string
}

/**
 * 通常レコードフィルター条件の保存と呼び出しを行うダイアログを表示する。
 *
 * @param props - 現在のフィルター、保存済みフィルター適用ハンドラー、編集中状態の通知コールバック。
 * @returns 保存フィルターダイアログの JSX 要素。
 */
const SavedFiltersDialog: Component<SavedFiltersDialogProps> = (props) => (
  <SavedRecordFiltersDialog
    open={props.open}
    currentFilters={props.currentFilters}
    schemaVersion={SAVED_FILTER_SCHEMA_VERSION}
    onApplyFilter={props.onApplyFilter}
    onEditFilter={props.onEditFilter}
    onEditingChange={props.onEditingChange}
    editedFilterName={props.editedFilterName}
    loadFilters={loadSavedFilters}
    createFilter={saveNewFilter}
    updateFilter={updateSavedFilter}
    deleteFilter={deleteFilter}
  />
)

export default SavedFiltersDialog

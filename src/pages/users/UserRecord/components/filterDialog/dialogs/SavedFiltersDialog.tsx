import type { Component } from 'solid-js'
import { SavedRecordFiltersDialog } from '../../../../components/SavedRecordFiltersDialog'
import type { FilterState } from '../../../types/types'
import {
  deleteFilter,
  loadSavedFilters,
  SAVED_FILTER_SCHEMA_VERSION,
  saveNewFilter,
  updateSavedFilter,
} from '../../../utils/storage'

type SavedFiltersDialogProps = {
  open: boolean
  currentFilters: FilterState
  onApplyFilter: (filter: FilterState) => void
  onEditFilter: (filter: FilterState) => void
}

/**
 * 通常レコードフィルター条件の保存と呼び出しを行うダイアログを表示する。
 *
 * @param props - 現在のフィルターと保存済みフィルター適用ハンドラー。
 * @returns 保存フィルターダイアログの JSX 要素。
 */
const SavedFiltersDialog: Component<SavedFiltersDialogProps> = (props) => (
  <SavedRecordFiltersDialog
    open={props.open}
    currentFilters={props.currentFilters}
    schemaVersion={SAVED_FILTER_SCHEMA_VERSION}
    onApplyFilter={props.onApplyFilter}
    onEditFilter={props.onEditFilter}
    loadFilters={loadSavedFilters}
    createFilter={saveNewFilter}
    updateFilter={updateSavedFilter}
    deleteFilter={deleteFilter}
  />
)

export default SavedFiltersDialog

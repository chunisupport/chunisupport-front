import type { Component } from 'solid-js'
import { SavedRecordFiltersDialog } from '../../../../components/SavedRecordFiltersDialog'
import type { FilterState } from '../../../types/types'
import { formatFilterSummary } from '../../../utils/filterDialog'
import {
  deleteFilter,
  loadSavedFilters,
  saveNewFilter,
  updateSavedFilter,
} from '../../../utils/storage'

type SavedFiltersDialogProps = {
  currentFilters: FilterState
  onApplyFilter: (filter: FilterState) => void
}

/**
 * 通常レコードフィルター条件の保存と呼び出しを行うダイアログを表示する。
 *
 * @param props - 現在のフィルターと保存済みフィルター適用ハンドラー。
 * @returns 保存フィルターダイアログの JSX 要素。
 */
const SavedFiltersDialog: Component<SavedFiltersDialogProps> = (props) => (
  <SavedRecordFiltersDialog
    currentFilters={props.currentFilters}
    onApplyFilter={props.onApplyFilter}
    loadFilters={loadSavedFilters}
    createFilter={saveNewFilter}
    updateFilter={updateSavedFilter}
    deleteFilter={deleteFilter}
    formatSummary={formatFilterSummary}
  />
)

export default SavedFiltersDialog

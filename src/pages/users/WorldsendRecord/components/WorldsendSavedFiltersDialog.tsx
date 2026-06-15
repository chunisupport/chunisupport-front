import type { Component } from 'solid-js'
import { SavedRecordFiltersDialog } from '../../components/SavedRecordFiltersDialog'
import type { WorldsendFilterState } from '../types/filterTypes'
import { formatWorldsendFilterSummary } from '../utils/filterDialog'
import {
  deleteWorldsendFilter,
  loadSavedWorldsendFilters,
  saveNewWorldsendFilter,
  updateSavedWorldsendFilter,
} from '../utils/storage'

type WorldsendSavedFiltersDialogProps = {
  currentFilters: WorldsendFilterState
  onApplyFilter: (filter: WorldsendFilterState) => void
}

/**
 * WORLD'S END フィルター条件の保存と呼び出しを行うダイアログを表示する。
 *
 * @param props - 現在のフィルターと保存済みフィルター適用ハンドラー。
 * @returns 保存フィルターダイアログの JSX 要素。
 */
const WorldsendSavedFiltersDialog: Component<WorldsendSavedFiltersDialogProps> = (props) => (
  <SavedRecordFiltersDialog
    currentFilters={props.currentFilters}
    onApplyFilter={props.onApplyFilter}
    loadFilters={loadSavedWorldsendFilters}
    createFilter={saveNewWorldsendFilter}
    updateFilter={updateSavedWorldsendFilter}
    deleteFilter={deleteWorldsendFilter}
    formatSummary={formatWorldsendFilterSummary}
  />
)

export default WorldsendSavedFiltersDialog

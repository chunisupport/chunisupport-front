import type { Component } from 'solid-js'
import { SavedRecordFiltersDialog } from '../../components/SavedRecordFiltersDialog.tsx'
import type { WorldsendFilterState } from '../types/filterTypes.ts'
import {
  deleteWorldsendFilter,
  loadSavedWorldsendFilters,
  SAVED_WORLDSEND_FILTER_SCHEMA_VERSION,
  saveNewWorldsendFilter,
  updateSavedWorldsendFilter,
} from '../utils/storage.ts'

type WorldsendSavedFiltersDialogProps = {
  open: boolean
  currentFilters: WorldsendFilterState
  onApplyFilter: (filter: WorldsendFilterState) => void
  onEditFilter: (filter: WorldsendFilterState) => void
}

/**
 * WORLD'S END フィルター条件の保存と呼び出しを行うダイアログを表示する。
 *
 * @param props - 現在のフィルターと保存済みフィルター適用ハンドラー。
 * @returns 保存フィルターダイアログの JSX 要素。
 */
const WorldsendSavedFiltersDialog: Component<WorldsendSavedFiltersDialogProps> = (props) => (
  <SavedRecordFiltersDialog
    open={props.open}
    currentFilters={props.currentFilters}
    schemaVersion={SAVED_WORLDSEND_FILTER_SCHEMA_VERSION}
    onApplyFilter={props.onApplyFilter}
    onEditFilter={props.onEditFilter}
    loadFilters={loadSavedWorldsendFilters}
    createFilter={saveNewWorldsendFilter}
    updateFilter={updateSavedWorldsendFilter}
    deleteFilter={deleteWorldsendFilter}
  />
)

export default WorldsendSavedFiltersDialog

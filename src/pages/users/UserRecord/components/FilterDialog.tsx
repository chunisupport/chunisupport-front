import { Dialog } from '@kobalte/core/dialog'
import type { Component } from 'solid-js'
import { createEffect, createSignal } from 'solid-js'
import type { MasterDataDTO } from '../../../../types/api'
import type { FilterState } from '../types/types'
import FilterResetDialog from './filterDialog/dialogs/FilterResetDialog'
import SavedFiltersDialog from './filterDialog/dialogs/SavedFiltersDialog'
import FilterSelectionPanel from './filterDialog/FilterSelectionPanel'

interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: FilterState
  onChange: (filters: FilterState) => void
  masterData?: MasterDataDTO
  defaultFilter: FilterState
  onTrackingChange?: () => void
  setSavedFilters?: (filters: import('../utils/storage').SavedFilter[]) => void
}

export const FilterDialog: Component<FilterDialogProps> = (props) => {
  // 現在のフィルター状態
  const [filters, setFilters] = createSignal<FilterState>({ ...props.filters })
  const [resetKey, setResetKey] = createSignal(0)

  // フィルターダイアログが開かれた時にフィルター状態を同期
  createEffect(() => {
    if (props.open) {
      setFilters({ ...props.filters })
    }
  })

  /** ダイアログの開閉変更処理 */
  const handleOpenChange = (open: boolean) => {
    props.onOpenChange(open)
  }

  /** フィルター適用処理 */
  const handleApply = () => {
    props.onChange(filters())
    props.onOpenChange(false)
  }

  /** フィルターリセット処理 */
  const handleReset = () => {
    const def = props.defaultFilter
    setFilters({ ...def })
    setResetKey((prev) => prev + 1)
  }

  /** 保存済みフィルター適用処理 */
  const handleApplySavedFilter = (filter: FilterState) => {
    props.onChange(filter)
    props.onOpenChange(false)
  }

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/30 z-40" />
        <Dialog.Content class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-md max-h-11/12 flex flex-col">
          <div class="flex items-center justify-between mb-4 shrink-0">
            <Dialog.Title class="text-lg font-bold">フィルター</Dialog.Title>
            <FilterResetDialog onReset={handleReset} />
          </div>
          {/* メインのフィルター選択部分 */}
          <FilterSelectionPanel
            open={props.open}
            filters={filters()}
            setFilters={setFilters}
            masterData={props.masterData}
            defaultFilter={props.defaultFilter}
            resetKey={resetKey()}
          />
          <div class="flex justify-between mt-6">
            <SavedFiltersDialog
              currentFilters={filters()}
              onApplyFilter={handleApplySavedFilter}
              onTrackingChange={props.onTrackingChange}
              setSavedFilters={props.setSavedFilters}
            />
            <div class="flex gap-2">
              <button
                type="button"
                class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => props.onOpenChange(false)}
              >
                キャンセル
              </button>
              <button
                type="button"
                class="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700"
                onClick={handleApply}
              >
                適用
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default FilterDialog

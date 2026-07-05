import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import type { Component } from 'solid-js'
import { createEffect, createSignal } from 'solid-js'
import type { MasterDataDTO, VersionSummaryDTO } from '../../../../types/api'
import type { FilterState } from '../../../../types/recordFilter'
import { normalizeFilterState } from '../../../../utils/recordFilterDefaults'
import type { EditingFilter } from '../../components/SavedRecordFiltersDialog'
import FilterResetDialog from './filterDialog/dialogs/FilterResetDialog'
import SavedFiltersDialog from './filterDialog/dialogs/SavedFiltersDialog'
import FilterSelectionPanel from './filterDialog/FilterSelectionPanel'

/** フィルターダイアログで表示する文言。 */
const FILTER_DIALOG_TEXT = {
  title: 'フィルター',
  cancel: 'キャンセル',
  apply: '適用',
} as const

/** フィルターダイアログの操作ボタンで使う Tailwind クラス。 */
const FILTER_DIALOG_BUTTON_CLASS = {
  secondary:
    'px-4 py-2 rounded bg-action-secondary text-text-muted hover:bg-action-secondary-hover',
  primary: 'px-4 py-2 rounded bg-action-primary text-text-inverse hover:bg-action-primary-hover',
} as const

interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: FilterState
  onChange: (filters: FilterState) => void
  masterData?: MasterDataDTO
  versions?: VersionSummaryDTO[]
  defaultFilter: FilterState
}

/**
 * 通常レコードの絞り込み条件を編集するダイアログを表示する。
 *
 * @param props - 開閉状態、現在のフィルター、変更ハンドラー、初期値。
 * @returns フィルターダイアログの JSX 要素。
 */
export const FilterDialog: Component<FilterDialogProps> = (props) => {
  // 現在のフィルター状態
  const [filters, setFilters] = createSignal<FilterState>(normalizeFilterState(props.filters))
  const [resetKey, setResetKey] = createSignal(0)
  const [editingFilter, setEditingFilter] = createSignal<EditingFilter | null>(null)

  // フィルターダイアログが開かれた時にフィルター状態を同期
  createEffect(() => {
    if (props.open) {
      setFilters(normalizeFilterState(props.filters))
    }
  })

  /**
   * ダイアログの開閉変更を親へ通知する。
   *
   * @param open - 次の開閉状態。
   * @returns なし。
   */
  const handleOpenChange = (open: boolean) => {
    props.onOpenChange(open)
  }

  /**
   * 編集中のフィルターを適用してダイアログを閉じる。
   *
   * @returns なし。
   */
  const handleApply = () => {
    props.onChange(filters())
    props.onOpenChange(false)
  }

  /**
   * フィルターを既定値へ戻して選択パネルを再初期化する。
   *
   * @returns なし。
   */
  const handleReset = () => {
    const def = props.defaultFilter
    setFilters({ ...def })
    setResetKey((prev) => prev + 1)
  }

  /**
   * 保存済みフィルターを適用してダイアログを閉じる。
   *
   * @param filter - 適用する保存済みフィルター。
   * @returns なし。
   */
  const handleApplySavedFilter = (filter: FilterState) => {
    props.onChange(normalizeFilterState(filter))
    props.onOpenChange(false)
  }

  /**
   * 保存済みフィルターを編集対象として読み込み、選択パネルへ反映する。
   *
   * @param filter - 編集対象として読み込む保存済みフィルター。
   * @returns なし。
   */
  const handleEditSavedFilter = (filter: FilterState) => {
    setFilters(normalizeFilterState(filter))
    setResetKey((prev) => prev + 1)
  }

  /**
   * 保存済みフィルターダイアログからの編集中状態の変更を反映する。
   *
   * @param editing - 現在の編集中フィルター情報。null の場合は編集中でない。
   * @returns なし。
   */
  const handleEditingChange = (editing: EditingFilter | null) => {
    setEditingFilter(editing)
  }

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-overlay z-40" />
        <Dialog.Content class="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-lg shadow-lg p-6 w-[90vw] max-w-md max-h-11/12 flex flex-col select-none">
          <div class="flex items-center justify-between mb-4 shrink-0">
            <Dialog.Title class="text-lg font-bold">{FILTER_DIALOG_TEXT.title}</Dialog.Title>
            <FilterResetDialog onReset={handleReset} />
          </div>
          <div class="mb-4">
            <SavedFiltersDialog
              open={props.open}
              currentFilters={filters()}
              onApplyFilter={handleApplySavedFilter}
              onEditFilter={handleEditSavedFilter}
              onEditingChange={handleEditingChange}
              editedFilterName={editingFilter()?.name}
            />
          </div>
          {/* メインのフィルター選択部分 */}
          <FilterSelectionPanel
            open={props.open}
            filters={filters()}
            setFilters={setFilters}
            masterData={props.masterData}
            versions={props.versions}
            defaultFilter={props.defaultFilter}
            resetKey={resetKey()}
            editingFilterName={editingFilter()?.name ?? null}
            onEditingFilterNameChange={(name) =>
              setEditingFilter((prev) => (prev ? { ...prev, name } : null))
            }
          />
          <div class="flex justify-end mt-6">
            <div class="flex gap-2">
              <Button
                type="button"
                class={FILTER_DIALOG_BUTTON_CLASS.secondary}
                onClick={() => props.onOpenChange(false)}
              >
                {FILTER_DIALOG_TEXT.cancel}
              </Button>
              <Button
                type="button"
                class={FILTER_DIALOG_BUTTON_CLASS.primary}
                onClick={handleApply}
              >
                {FILTER_DIALOG_TEXT.apply}
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default FilterDialog

import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import type { Component } from 'solid-js'
import { createEffect, createSignal } from 'solid-js'
import FilterResetDialog from '../../UserRecord/components/filterDialog/dialogs/FilterResetDialog'
import { normalizeWorldsendFilterState } from '../types/filterDefaults'
import type { WorldsendFilterState } from '../types/filterTypes'
import WorldsendFilterSelectionPanel from './WorldsendFilterSelectionPanel'
import WorldsendSavedFiltersDialog from './WorldsendSavedFiltersDialog'

type WorldsendFilterDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: WorldsendFilterState
  onChange: (filters: WorldsendFilterState) => void
  defaultFilter: WorldsendFilterState
}

/**
 * WORLD'S END レコード用フィルターダイアログを表示する。
 *
 * @param props - 開閉状態、フィルター状態、適用ハンドラー、初期値。
 * @returns WORLD'S END フィルターダイアログの JSX 要素。
 */
const WorldsendFilterDialog: Component<WorldsendFilterDialogProps> = (props) => {
  const [filters, setFilters] = createSignal<WorldsendFilterState>(
    normalizeWorldsendFilterState(props.filters)
  )

  createEffect(() => {
    if (props.open) {
      setFilters(normalizeWorldsendFilterState(props.filters))
    }
  })

  /**
   * 編集中の WORLD'S END フィルターを親へ適用する。
   *
   * @returns なし。
   */
  const handleApply = () => {
    props.onChange(filters())
    props.onOpenChange(false)
  }

  /**
   * WORLD'S END フィルターを初期値へ戻す。
   *
   * @returns なし。
   */
  const handleReset = () => {
    setFilters({
      ...props.defaultFilter,
      score: { ...props.defaultFilter.score },
      justiceCount: { ...props.defaultFilter.justiceCount },
      attributes: [...props.defaultFilter.attributes],
      levelStarRange: { ...props.defaultFilter.levelStarRange },
      genres: [...props.defaultFilter.genres],
      versions: [...props.defaultFilter.versions],
      combo_lamp: [...props.defaultFilter.combo_lamp],
      chain_lamp: [...props.defaultFilter.chain_lamp],
      hard_lamp: [...props.defaultFilter.hard_lamp],
    })
  }

  /**
   * 保存済み WORLD'S END フィルターを適用する。
   *
   * @param filter - 適用する保存済み WORLD'S END フィルター。
   * @returns なし。
   */
  const handleApplySavedFilter = (filter: WorldsendFilterState) => {
    props.onChange(normalizeWorldsendFilterState(filter))
    props.onOpenChange(false)
  }

  /**
   * 保存済み WORLD'S END フィルターを編集対象として読み込む。
   *
   * @param filter - 編集対象として読み込む保存済み WORLD'S END フィルター。
   * @returns なし。
   */
  const handleEditSavedFilter = (filter: WorldsendFilterState) => {
    setFilters(normalizeWorldsendFilterState(filter))
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed left-1/2 top-1/2 z-50 flex max-h-11/12 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 select-none flex-col rounded-lg bg-surface p-6 shadow-lg">
          <div class="mb-4 flex shrink-0 items-center justify-between">
            <Dialog.Title class="text-lg font-bold">フィルター</Dialog.Title>
            <FilterResetDialog onReset={handleReset} />
          </div>
          <WorldsendFilterSelectionPanel
            open={props.open}
            filters={filters()}
            setFilters={setFilters}
            defaultFilter={props.defaultFilter}
          />
          <div class="mt-6 flex justify-between">
            <WorldsendSavedFiltersDialog
              open={props.open}
              currentFilters={filters()}
              onApplyFilter={handleApplySavedFilter}
              onEditFilter={handleEditSavedFilter}
            />
            <div class="flex gap-2">
              <Button
                type="button"
                class="rounded bg-action-secondary px-4 py-2 text-text-muted hover:bg-action-secondary-hover"
                onClick={() => props.onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                class="rounded bg-action-primary px-4 py-2 text-text-inverse hover:bg-action-primary-hover"
                onClick={handleApply}
              >
                適用
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default WorldsendFilterDialog

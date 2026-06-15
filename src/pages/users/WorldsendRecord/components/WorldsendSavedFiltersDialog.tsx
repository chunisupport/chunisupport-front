import { Dialog } from '@kobalte/core/dialog'
import { Popover } from '@kobalte/core/popover'
import { TextField } from '@kobalte/core/text-field'
import { EllipsisVertical, Save } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createSignal, For } from 'solid-js'
import type { WorldsendFilterState } from '../types/filterTypes'
import { formatWorldsendFilterSummary } from '../utils/filterDialog'
import {
  deleteWorldsendFilter,
  loadSavedWorldsendFilters,
  saveNewWorldsendFilter,
} from '../utils/storage'

type WorldsendSavedFiltersDialogProps = {
  currentFilters: WorldsendFilterState
  onApplyFilter: (filter: WorldsendFilterState) => void
}

const SAVED_FILTER_NAME_INPUT_CLASS =
  'w-full rounded border border-border-strong bg-surface px-2 py-1 text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

/**
 * WORLD'S END フィルター条件の保存と呼び出しを行うダイアログを表示する。
 *
 * @param props - 現在のフィルターと保存済みフィルター適用ハンドラー。
 * @returns 保存フィルターダイアログの JSX 要素。
 */
const WorldsendSavedFiltersDialog: Component<WorldsendSavedFiltersDialogProps> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [saveName, setSaveName] = createSignal('')
  const [filtersList, setFiltersList] = createSignal(loadSavedWorldsendFilters())

  /**
   * 保存済みフィルターを適用してダイアログを閉じる。
   *
   * @param filter - 適用する保存済み WORLD'S END フィルター。
   * @returns なし。
   */
  const handleApplySavedFilter = (filter: WorldsendFilterState) => {
    props.onApplyFilter(filter)
    setOpen(false)
  }

  /**
   * 保存済みフィルターを削除して一覧を更新する。
   *
   * @param id - 削除対象の保存済みフィルターID。
   * @returns なし。
   */
  const handleDeleteSavedFilter = (id: string) => {
    deleteWorldsendFilter(id)
    setFiltersList(loadSavedWorldsendFilters())
  }

  /**
   * 現在の WORLD'S END フィルターを新規保存する。
   *
   * @returns なし。
   */
  const handleSaveNewFilter = () => {
    const name = saveName().trim()
    if (!name) return
    saveNewWorldsendFilter(name, props.currentFilters)
    setSaveName('')
    setFiltersList(loadSavedWorldsendFilters())
  }

  return (
    <>
      <button
        type="button"
        class="rounded bg-action-secondary px-4 py-2 text-text-muted hover:bg-action-secondary-hover"
        onClick={() => setOpen(true)}
      >
        <div class="mb-0.5 flex items-center justify-center text-sm">
          <Save class="mr-1 h-4 w-4" />
          <div>保存</div>
        </div>
      </button>
      <Dialog open={open()} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 z-60 bg-overlay" />
          <Dialog.Content class="fixed left-1/2 top-1/2 z-70 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border-strong bg-surface p-6 shadow-lg">
            <Dialog.Title class="mb-2 font-bold">フィルター条件の保存・呼出</Dialog.Title>
            <div class="mb-4">
              <div class="mb-1 text-xs text-text-subtle">保存した条件</div>
              <div class="max-h-80 min-h-80 overflow-y-auto rounded border border-border-strong bg-surface-muted px-3 py-2">
                <For each={filtersList()}>
                  {(item) => (
                    <div class="flex items-center justify-between border-b border-border-strong py-1">
                      <div class="min-w-0 flex-1">
                        <div class="truncate">{item.name}</div>
                      </div>
                      <Popover>
                        <Popover.Trigger>
                          <EllipsisVertical class="h-5 w-5 cursor-pointer text-text-subtle" />
                        </Popover.Trigger>
                        <Popover.Portal>
                          <Popover.Content class="z-80 rounded border border-border-strong bg-surface p-4 shadow">
                            <Popover.Arrow />
                            <div class="mb-4">
                              <div class="mb-2 text-sm font-sm text-text-muted">
                                フィルターの詳細
                              </div>
                              <div class="max-w-xs whitespace-pre-line text-xs text-text-muted">
                                {formatWorldsendFilterSummary(item.filter) || '（条件なし）'}
                              </div>
                            </div>
                            <div class="flex justify-end">
                              <button
                                type="button"
                                class="px-2 py-1 text-danger underline hover:bg-danger-bg"
                                onClick={() => handleDeleteSavedFilter(item.id)}
                              >
                                フィルターを削除
                              </button>
                            </div>
                          </Popover.Content>
                        </Popover.Portal>
                      </Popover>
                      <button
                        type="button"
                        class="ml-2 rounded bg-action-primary px-2 py-1 text-text-inverse hover:bg-action-primary-hover"
                        onClick={() => handleApplySavedFilter(item.filter)}
                      >
                        呼出
                      </button>
                    </div>
                  )}
                </For>
                {filtersList().length === 0 && (
                  <div class="mt-2 w-full text-center text-xs text-text-subtle">
                    保存された条件はありません
                  </div>
                )}
              </div>
            </div>
            <div class="mb-6">
              <div class="mb-1 text-xs text-text-subtle">現在の条件を保存</div>
              <TextField class="mb-2">
                <TextField.Input
                  class={SAVED_FILTER_NAME_INPUT_CLASS}
                  placeholder="フィルターの名前を入力..."
                  value={saveName()}
                  onInput={(event) => setSaveName(event.currentTarget.value)}
                />
              </TextField>
              <div class="flex justify-end space-x-2">
                <button
                  type="button"
                  class="rounded bg-action-primary px-2 py-1 text-text-inverse hover:bg-action-primary-hover disabled:opacity-50"
                  onClick={handleSaveNewFilter}
                  disabled={!saveName().trim()}
                >
                  保存
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between space-x-2">
              <Dialog.Description class="flex-1 text-xs text-text-subtle">
                フィルター条件はブラウザに保存されます。
              </Dialog.Description>
              <button
                type="button"
                class="shrink-0 rounded bg-action-secondary px-4 py-2 text-text-muted hover:bg-action-secondary-hover"
                onClick={() => setOpen(false)}
              >
                戻る
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}

export default WorldsendSavedFiltersDialog

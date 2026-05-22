import { Dialog } from '@kobalte/core/dialog'
import { Popover } from '@kobalte/core/popover'
import { TextField } from '@kobalte/core/text-field'
import { EllipsisVertical, Save } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createSignal, For } from 'solid-js'
import type { FilterState } from '../../../types/types'
import { formatFilterSummary } from '../../../utils/filterDialog'
import {
  deleteFilter,
  loadSavedFilters,
  type SavedFilter,
  saveNewFilter,
} from '../../../utils/storage'

type SavedFiltersDialogProps = {
  currentFilters: FilterState
  onApplyFilter: (filter: FilterState) => void
  setSavedFilters?: (filters: SavedFilter[]) => void
}

const SavedFiltersDialog: Component<SavedFiltersDialogProps> = (props) => {
  // このダイアログの開閉状態
  const [open, setOpen] = createSignal(false)

  // 保存するフィルターの名前
  const [saveName, setSaveName] = createSignal('')

  // 保存済みフィルターの一覧
  const [filtersList, setFiltersList] = createSignal<SavedFilter[]>(loadSavedFilters())

  /** 保存済みフィルター適用処理 */
  const handleApplySavedFilter = (filter: FilterState) => {
    props.onApplyFilter(filter)
    setOpen(false)
  }

  /** 保存済みフィルター削除処理 */
  const handleDeleteSavedFilter = (id: string) => {
    deleteFilter(id)
    const updated = loadSavedFilters()
    setFiltersList(updated)
    props.setSavedFilters?.(updated)
  }

  /** 新しいフィルターを保存する処理 */
  const handleSaveNewFilter = () => {
    const name = saveName().trim()
    if (!name) return
    saveNewFilter(name, props.currentFilters)
    setSaveName('')
    const updated = loadSavedFilters()
    setFiltersList(updated)
    props.setSavedFilters?.(updated)
  }

  return (
    <>
      <button
        type="button"
        class="px-4 py-2 rounded bg-action-secondary text-text-muted hover:bg-action-secondary-hover"
        onClick={() => setOpen(true)}
      >
        <div class="flex justify-center items-center text-sm mb-0.5">
          <Save class="w-4 h-4 mr-1" />
          <div>保存</div>
        </div>
      </button>
      <Dialog open={open()} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class="fixed inset-0 bg-overlay z-60" />
          <Dialog.Content class="fixed z-70 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-lg shadow-lg p-6 w-[90vw] max-w-md border border-border-strong">
            <Dialog.Title class="font-bold mb-2">フィルター条件の保存・呼出</Dialog.Title>
            {/* 保存済みフィルター一覧 */}
            <div class="mb-4">
              <div class="text-xs text-text-subtle mb-1">保存した条件</div>
              <div class="border border-border-strong rounded bg-surface-muted px-3 py-2 min-h-80 max-h-80 overflow-y-auto">
                <For each={filtersList()}>
                  {(item) => (
                    <div class="flex items-center justify-between border-b border-border-strong py-1">
                      <div class="flex-1 min-w-0">
                        <div class="truncate">{item.name}</div>
                      </div>
                      <Popover>
                        <Popover.Trigger>
                          <EllipsisVertical class="w-5 h-5 text-text-subtle cursor-pointer" />
                        </Popover.Trigger>
                        <Popover.Portal>
                          <Popover.Content class="z-80 border border-border-strong rounded bg-surface shadow p-4">
                            <Popover.Arrow />
                            <div class="mb-4">
                              <div class="text-sm font-sm text-text-muted mb-2">
                                フィルターの詳細
                              </div>
                              <div class="text-xs text-text-muted max-w-xs whitespace-pre-line">
                                {formatFilterSummary(item.filter) || '（条件なし）'}
                              </div>
                            </div>
                            <div class="flex justify-end">
                              <button
                                type="button"
                                class="text-danger hover:bg-danger-bg px-2 py-1 underline"
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
                        class="ml-2 px-2 py-1 rounded bg-action-primary text-text-inverse hover:bg-action-primary-hover"
                        onClick={() => handleApplySavedFilter(item.filter)}
                      >
                        呼出
                      </button>
                    </div>
                  )}
                </For>
                {filtersList().length === 0 && (
                  <div class="w-full text-center text-xs text-text-subtle mt-2">
                    保存された条件はありません
                  </div>
                )}
              </div>
            </div>
            <div class="mb-6">
              <div class="text-xs text-text-subtle mb-1">現在の条件を保存</div>
              <TextField class="mb-2">
                <TextField.Input
                  class="w-full rounded border border-border-strong px-2 py-1 focus:border-focus-ring"
                  placeholder="フィルターの名前を入力..."
                  value={saveName()}
                  onInput={(event) => setSaveName(event.currentTarget.value)}
                />
              </TextField>
              <div class="flex space-x-2 justify-end">
                <button
                  type="button"
                  class="px-2 py-1 rounded bg-action-primary text-text-inverse hover:bg-action-primary-hover"
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
                class="shrink-0 px-4 py-2 rounded bg-action-secondary text-text-muted hover:bg-action-secondary-hover"
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

export default SavedFiltersDialog

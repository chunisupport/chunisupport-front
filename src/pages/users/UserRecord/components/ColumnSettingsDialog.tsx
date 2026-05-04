import { Dialog } from '@kobalte/core/dialog'
import { Select } from '@kobalte/core/select'
import { Check, ChevronsUpDown } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'
import type { RecordColumnId } from '../types/types'
import { RECORD_COLUMN_DEFINITIONS, sortVisibleColumnIdsByDefinitionOrder } from '../utils/columns'

type ColumnSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  visibleColumnIds: RecordColumnId[]
  onApply: (visibleColumnIds: RecordColumnId[]) => void
}

type ColumnOption = {
  id: RecordColumnId
  label: string
}

const COLUMN_OPTIONS: ColumnOption[] = RECORD_COLUMN_DEFINITIONS.map((column) => ({
  id: column.id,
  label: column.label,
}))

const ColumnSettingsDialog: Component<ColumnSettingsDialogProps> = (props) => {
  const [selectedColumnIds, setSelectedColumnIds] = createSignal<RecordColumnId[]>(
    props.visibleColumnIds
  )

  const selectedOptions = createMemo(() => {
    const selectedIdSet = new Set(selectedColumnIds())
    return COLUMN_OPTIONS.filter((option) => selectedIdSet.has(option.id))
  })

  const selectedIdSet = createMemo(() => new Set(selectedColumnIds()))

  createEffect(() => {
    if (props.open) {
      setSelectedColumnIds(props.visibleColumnIds)
    }
  })

  const handleOpenChange = (open: boolean) => {
    props.onOpenChange(open)
  }

  const handleChange = (options: ColumnOption[]) => {
    const nextIds = sortVisibleColumnIdsByDefinitionOrder(options.map((option) => option.id))
    setSelectedColumnIds(nextIds)
  }

  const handleApply = () => {
    if (selectedIdSet().size === 0) {
      return
    }

    const nextVisibleColumnIds = RECORD_COLUMN_DEFINITIONS.map((column) => column.id).filter((id) =>
      selectedIdSet().has(id)
    )
    props.onApply(nextVisibleColumnIds)
    props.onOpenChange(false)
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content class="fixed z-50 left-1/2 top-1/2 max-h-[90vh] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <Dialog.Title class="mb-4 text-lg font-bold">列設定</Dialog.Title>
          <p class="mb-3 text-xs text-gray-500">表示する列を選択してください（1列以上必須）</p>

          <Select<ColumnOption>
            multiple
            options={COLUMN_OPTIONS}
            optionValue="id"
            optionTextValue="label"
            value={selectedOptions()}
            onChange={handleChange}
            placeholder="表示列を選択"
            itemComponent={(props) => (
              <Select.Item
                item={props.item}
                class="cursor-pointer px-3 py-2 text-gray-800 hover:bg-green-50 data-[selected]:bg-green-50"
              >
                <div class="flex items-center gap-2">
                  <span class="inline-flex w-4 justify-center text-green-700">
                    <Select.ItemIndicator>
                      <Check size={14} />
                    </Select.ItemIndicator>
                  </span>
                  <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
                </div>
              </Select.Item>
            )}
          >
            <Select.Trigger class="flex w-full items-center rounded border border-gray-300 px-3 py-2 text-left">
              <div class="flex min-h-6 flex-1 flex-wrap gap-1" aria-live="polite">
                <Show
                  when={selectedOptions().length > 0}
                  fallback={<span class="text-gray-400">表示列を選択</span>}
                >
                  <For each={selectedOptions()}>
                    {(option) => (
                      <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                        {option.label}
                      </span>
                    )}
                  </For>
                </Show>
              </div>
              <span class="text-gray-500" aria-hidden="true">
                <ChevronsUpDown size={16} />
              </span>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content class="z-50 mt-1 max-h-64 w-[--kb-select-content-width] overflow-auto rounded border border-gray-200 bg-white shadow-md">
                <Select.Listbox />
              </Select.Content>
            </Select.Portal>
          </Select>

          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              onClick={() => props.onOpenChange(false)}
            >
              キャンセル
            </button>
            <button
              type="button"
              class="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              onClick={handleApply}
              disabled={selectedColumnIds().length === 0}
            >
              適用
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default ColumnSettingsDialog

import { Dialog } from '@kobalte/core/dialog'
import type { Component } from 'solid-js'
import { createMemo, createSignal, For } from 'solid-js'
import type { RecordColumnId } from '../types/types'
import { RECORD_COLUMN_DEFINITIONS, sortVisibleColumnIdsByDefinitionOrder } from '../utils/columns'

type ColumnSettingsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  visibleColumnIds: RecordColumnId[]
  onApply: (visibleColumnIds: RecordColumnId[]) => void
}

const ColumnSettingsDialog: Component<ColumnSettingsDialogProps> = (props) => {
  const [selectedColumnIds, setSelectedColumnIds] = createSignal<RecordColumnId[]>(
    props.visibleColumnIds
  )

  const selectedIdSet = createMemo(() => new Set(selectedColumnIds()))

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedColumnIds(props.visibleColumnIds)
    }
    props.onOpenChange(open)
  }

  const toggleColumn = (columnId: RecordColumnId) => {
    setSelectedColumnIds((prev) => {
      if (prev.includes(columnId)) {
        if (prev.length === 1) {
          return prev
        }
        return prev.filter((id) => id !== columnId)
      }
      return [...prev, columnId]
    })
  }

  const handleApply = () => {
    props.onApply(sortVisibleColumnIdsByDefinitionOrder(selectedColumnIds()))
    props.onOpenChange(false)
  }

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-black/30" />
        <Dialog.Content class="fixed z-50 left-1/2 top-1/2 max-h-11/12 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <Dialog.Title class="mb-4 text-lg font-bold">列設定</Dialog.Title>
          <p class="mb-3 text-xs text-gray-500">表示する列を選択してください（1列以上必須）</p>
          <div class="space-y-2">
            <For each={RECORD_COLUMN_DEFINITIONS}>
              {(column) => (
                <label class="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-3 py-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedIdSet().has(column.id)}
                    onChange={() => toggleColumn(column.id)}
                  />
                  <span>{column.label}</span>
                </label>
              )}
            </For>
          </div>
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
              class="rounded bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
              onClick={handleApply}
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

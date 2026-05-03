import { Combobox } from '@kobalte/core/combobox'
import { Dialog } from '@kobalte/core/dialog'
import { ChevronsUpDown } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createMemo, createSignal } from 'solid-js'
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

  const selectedLabelsText = createMemo(() =>
    selectedOptions()
      .map((option) => option.label)
      .join(' / ')
  )

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedColumnIds(props.visibleColumnIds)
    }
    props.onOpenChange(open)
  }

  const handleChange = (options: ColumnOption[]) => {
    const nextIds = sortVisibleColumnIdsByDefinitionOrder(options.map((option) => option.id))
    setSelectedColumnIds(nextIds)
  }

  const handleApply = () => {
    if (selectedColumnIds().length === 0) {
      return
    }

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

          <Combobox<ColumnOption>
            multiple
            options={COLUMN_OPTIONS}
            optionValue="id"
            optionTextValue="label"
            value={selectedOptions()}
            onChange={handleChange}
            placeholder="表示列を選択"
            itemComponent={(props) => (
              <Combobox.Item
                item={props.item}
                class="cursor-pointer px-3 py-2 text-gray-800 hover:bg-gray-100"
              >
                <Combobox.ItemLabel>{props.item.rawValue.label}</Combobox.ItemLabel>
              </Combobox.Item>
            )}
          >
            <Combobox.Control class="flex items-center rounded border border-gray-300 px-3 py-2">
              <Combobox.Input
                class="w-full bg-transparent outline-none"
                value={selectedLabelsText()}
                placeholder="表示列を選択"
              />
              <Combobox.Trigger class="text-gray-500" aria-label="列選択を開く">
                <ChevronsUpDown size={16} />
              </Combobox.Trigger>
            </Combobox.Control>
            <Combobox.Portal>
              <Combobox.Content class="z-50 mt-1 max-h-64 w-[--kb-combobox-content-width] overflow-auto rounded border border-gray-200 bg-white shadow-md">
                <Combobox.Listbox />
              </Combobox.Content>
            </Combobox.Portal>
          </Combobox>

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

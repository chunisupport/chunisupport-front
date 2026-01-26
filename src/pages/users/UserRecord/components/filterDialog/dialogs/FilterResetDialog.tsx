import { AlertDialog } from '@kobalte/core/alert-dialog'
import { RotateCcw } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createSignal } from 'solid-js'

type FilterResetDialogProps = {
  onReset: () => void
}

const FilterResetDialog: Component<FilterResetDialogProps> = (props) => {
  const [resetDialogOpen, setResetDialogOpen] = createSignal(false)

  return (
    <AlertDialog open={resetDialogOpen()} onOpenChange={setResetDialogOpen}>
      <AlertDialog.Trigger>
        <div class="p-2 rounded bg-red-100 border border-red-500">
          <RotateCcw class="w-5 h-5 text-gray-600 cursor-pointer" />
        </div>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay class="fixed inset-0 bg-black/30 z-50" />
        <AlertDialog.Content class="fixed z-60 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-md">
          <AlertDialog.Title class="text-lg font-bold mb-2">
            フィルターをリセットしますか？
          </AlertDialog.Title>
          <AlertDialog.Description class="mb-4 text-sm text-gray-600">
            すべてのフィルター設定が初期値に戻ります。
          </AlertDialog.Description>
          <div class="flex justify-end gap-2">
            <AlertDialog.CloseButton
              as="button"
              class="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              キャンセル
            </AlertDialog.CloseButton>
            <button
              type="button"
              class="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                props.onReset()
                setResetDialogOpen(false)
              }}
            >
              リセット
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}

export default FilterResetDialog

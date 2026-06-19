import { AlertDialog } from '@kobalte/core/alert-dialog'
import { Button } from '@kobalte/core/button'
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
        <div class="p-2 rounded bg-danger-bg border border-danger-border">
          <RotateCcw class="w-5 h-5 text-text-muted cursor-pointer" />
        </div>
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay class="fixed inset-0 bg-overlay z-50" />
        <AlertDialog.Content class="fixed z-60 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-lg shadow-lg p-6 w-[90vw] max-w-md">
          <AlertDialog.Title class="text-lg font-bold mb-2">
            フィルターをリセットしますか？
          </AlertDialog.Title>
          <AlertDialog.Description class="mb-4 text-sm text-text-muted">
            すべてのフィルター設定が初期値に戻ります。
          </AlertDialog.Description>
          <div class="flex justify-end gap-2">
            <AlertDialog.CloseButton
              as="button"
              class="px-4 py-2 rounded bg-action-secondary text-text-muted hover:bg-action-secondary-hover"
            >
              キャンセル
            </AlertDialog.CloseButton>
            <Button.Root
              type="button"
              class="px-4 py-2 rounded bg-danger text-text-inverse hover:bg-danger-hover"
              onClick={() => {
                props.onReset()
                setResetDialogOpen(false)
              }}
            >
              リセット
            </Button.Root>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}

export default FilterResetDialog

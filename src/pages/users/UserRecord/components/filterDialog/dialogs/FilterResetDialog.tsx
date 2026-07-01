import { AlertDialog } from '@kobalte/core/alert-dialog'
import { RotateCcw } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createSignal } from 'solid-js'
import {
  AppButton,
  getAppButtonClass,
  getAppIconButtonClass,
} from '../../../../../../components/common/AppButton'

type FilterResetDialogProps = {
  onReset: () => void
}

/**
 * フィルター条件を初期状態へ戻す確認ダイアログを表示する。
 *
 * @param props - リセット確定時のハンドラー。
 * @returns フィルターリセット操作の JSX 要素。
 */
const FilterResetDialog: Component<FilterResetDialogProps> = (props) => {
  const [resetDialogOpen, setResetDialogOpen] = createSignal(false)

  return (
    <AlertDialog open={resetDialogOpen()} onOpenChange={setResetDialogOpen}>
      <AlertDialog.Trigger
        as="button"
        type="button"
        class={getAppIconButtonClass({ tone: 'danger' })}
        aria-label="フィルターをリセット"
        title="フィルターをリセット"
      >
        <RotateCcw class="h-5 w-5" aria-hidden="true" />
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
              class={getAppButtonClass({ variant: 'secondary' })}
            >
              キャンセル
            </AlertDialog.CloseButton>
            <AppButton
              variant="danger"
              onClick={() => {
                props.onReset()
                setResetDialogOpen(false)
              }}
            >
              リセット
            </AppButton>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}

export default FilterResetDialog

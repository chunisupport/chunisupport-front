import { AlertDialog } from '@kobalte/core/alert-dialog'
import type { Component } from 'solid-js'
import type { GoalDTO } from '../../../../types/api'

interface GoalDeleteDialogProps {
  open: boolean
  goal?: GoalDTO
  isDeleting: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

/**
 * 目標削除の確認ダイアログを表示する。
 *
 * @param props - ダイアログの表示状態、削除対象、削除ハンドラ。
 * @returns 目標削除確認ダイアログの JSX 要素。
 */
const GoalDeleteDialog: Component<GoalDeleteDialogProps> = (props) => {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay class="fixed inset-0 bg-overlay z-40" />
        <AlertDialog.Content class="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg">
          <AlertDialog.Title class="text-lg font-bold">目標を削除しますか？</AlertDialog.Title>
          <AlertDialog.Description class="mt-2 text-sm text-text-muted">
            「{props.goal?.title ?? 'この目標'}」を削除します。この操作は取り消せません。
          </AlertDialog.Description>

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded bg-action-secondary px-4 py-2 text-sm text-text-muted hover:bg-action-secondary-hover"
              disabled={props.isDeleting}
              onClick={() => props.onOpenChange(false)}
            >
              キャンセル
            </button>
            <button
              type="button"
              class="rounded bg-danger px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-danger-hover disabled:opacity-60"
              disabled={props.isDeleting}
              onClick={props.onConfirm}
            >
              {props.isDeleting ? '削除中...' : '削除する'}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}

export default GoalDeleteDialog

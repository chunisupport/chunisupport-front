import { AlertDialog } from '@kobalte/core/alert-dialog'
import type { JSX } from 'solid-js'
import { AppButton, type AppButtonVariant } from './AppButton'

type AppConfirmDialogProps = {
  /** ダイアログを開いている場合はtrue */
  open: boolean
  /** 開閉状態の変更要求。送信中の閉鎖要求は通知しない */
  onOpenChange: (open: boolean) => void
  /** ダイアログの見出し */
  title: string
  /** 操作の影響を示す内容 */
  description: JSX.Element
  /** 説明の下へ追加表示する内容。長い場合は本文領域だけがスクロールする */
  children?: JSX.Element
  /** キャンセルボタンの文言 */
  cancelLabel: string
  /** 確定ボタンの文言 */
  confirmLabel: string
  /** 確定ボタンの見た目 */
  confirmVariant: AppButtonVariant
  /** 確定操作を送信中の場合はtrue。両方のボタンを無効化し、ダイアログを閉じさせない */
  pending: boolean
  /** 入力内容などにより確定できない場合はtrue */
  confirmDisabled?: boolean
  /** 確定ボタンが押されたときの処理 */
  onConfirm: () => void
}

/**
 * 取り消しにくい操作の前に内容を確認するダイアログを表示する。
 *
 * @param props - 見出し、説明、ボタン文言、送信状態と操作ハンドラー。
 * @returns Kobalte AlertDialog による確認ダイアログ。
 */
export const AppConfirmDialog = (props: AppConfirmDialogProps): JSX.Element => {
  /**
   * Esc、オーバーレイ、キャンセルボタンからの開閉要求を、送信中を除いて呼び出し側へ通知する。
   *
   * @param open - ダイアログを開く場合はtrue。
   * @returns なし。
   */
  const requestOpenChange = (open: boolean): void => {
    if (!open && props.pending) return
    props.onOpenChange(open)
  }

  return (
    <AlertDialog open={props.open} onOpenChange={requestOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <AlertDialog.Content class="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg bg-surface p-5 shadow-lg sm:p-6">
          <AlertDialog.Title class="shrink-0 text-lg font-bold text-text">
            {props.title}
          </AlertDialog.Title>

          <div class="min-h-0 overflow-y-auto">
            <AlertDialog.Description class="mt-2 text-sm text-text-muted">
              {props.description}
            </AlertDialog.Description>
            {props.children}
          </div>

          <div class="mt-5 flex shrink-0 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AppButton disabled={props.pending} onClick={() => requestOpenChange(false)}>
              {props.cancelLabel}
            </AppButton>
            <AppButton
              variant={props.confirmVariant}
              disabled={props.pending || props.confirmDisabled}
              aria-busy={props.pending}
              onClick={() => props.onConfirm()}
            >
              {props.confirmLabel}
            </AppButton>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}

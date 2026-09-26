import { AlertDialog } from '@kobalte/core/alert-dialog'
import { Funnel, RotateCcw } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createSignal, Show } from 'solid-js'
import { t } from '../../i18n'
import { AppButton, getAppButtonClass, getAppIconButtonClass } from './AppButton'

type FilterResetDialogProps = {
  onReset: () => void
  triggerLabel?: string
  title?: string
  /** 長押しリセットが利用可能な画面で操作ヒントを表示するか */
  showShortcutHint?: boolean
}

/**
 * フィルターやソート条件を初期状態へ戻す確認ダイアログを表示する。
 *
 * @param props - 表示文言とリセット確定時のハンドラー。
 * @returns リセット操作の JSX 要素。
 */
const FilterResetDialog: Component<FilterResetDialogProps> = (props) => {
  const [resetDialogOpen, setResetDialogOpen] = createSignal(false)
  /**
   * リセット操作トリガーの表示名を返す。
   *
   * @returns トリガーのアクセシブル名とタイトル。
   */
  const triggerLabel = () => props.triggerLabel ?? t('filterReset.trigger')
  /**
   * リセット確認ダイアログの見出しを返す。
   *
   * @returns ダイアログタイトル。
   */
  const title = () => props.title ?? t('filterReset.title')

  return (
    <AlertDialog open={resetDialogOpen()} onOpenChange={setResetDialogOpen}>
      <AlertDialog.Trigger
        as="button"
        type="button"
        class={getAppIconButtonClass({ tone: 'danger' })}
        aria-label={triggerLabel()}
        title={triggerLabel()}
      >
        <RotateCcw class="h-5 w-5" aria-hidden="true" />
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay class="fixed inset-0 bg-overlay z-50" />
        <AlertDialog.Content class="fixed z-60 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface rounded-lg shadow-lg p-6 w-[90vw] max-w-md">
          <AlertDialog.Title class="text-lg font-bold mb-2">{title()}</AlertDialog.Title>
          <Show when={props.showShortcutHint ?? true}>
            <AlertDialog.Description class="mb-4 text-sm text-text-muted">
              {t('filterReset.hintPrefix')}
              <Funnel class="mx-1 inline-block h-4 w-4 align-[-0.125em]" aria-hidden="true" />
              {t('filterReset.hintSuffix')}
            </AlertDialog.Description>
          </Show>
          <div class="flex justify-end gap-2">
            <AlertDialog.CloseButton
              as="button"
              type="button"
              class={getAppButtonClass({ variant: 'secondary' })}
            >
              {t('common.cancel')}
            </AlertDialog.CloseButton>
            <AppButton
              variant="danger"
              onClick={() => {
                props.onReset()
                setResetDialogOpen(false)
              }}
            >
              {t('common.reset')}
            </AppButton>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog>
  )
}

export default FilterResetDialog

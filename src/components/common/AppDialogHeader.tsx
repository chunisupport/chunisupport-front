import { Dialog } from '@kobalte/core/dialog'
import { X } from 'lucide-solid'
import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import { getAppIconButtonClass } from './AppButton'

type AppDialogHeaderProps = {
  /** ダイアログのタイトル */
  title: string
  /** タイトル下の補足 */
  description?: string
  /** 閉じるボタンのアクセシブルな名前 */
  closeLabel: string
  /** 閉じるボタンを無効にするか */
  closeDisabled?: boolean
}

/**
 * タイトルと右上の閉じるボタンを並べたダイアログヘッダーを表示する。
 * Kobalte Dialog の Dialog.Content 内で使う。
 *
 * @param props - タイトル、補足、閉じるボタンの名前と無効状態。
 * @returns ダイアログヘッダー。
 */
export const AppDialogHeader: Component<AppDialogHeaderProps> = (props) => (
  <div class="flex shrink-0 items-start justify-between gap-4">
    <div class="min-w-0">
      <Dialog.Title class="text-lg font-bold text-text">{props.title}</Dialog.Title>
      <Show when={props.description}>
        {(description) => (
          <Dialog.Description class="mt-1 text-sm text-text-muted">
            {description()}
          </Dialog.Description>
        )}
      </Show>
    </div>
    <Dialog.CloseButton
      class={getAppIconButtonClass({ tone: 'ghost', class: 'shrink-0' })}
      aria-label={props.closeLabel}
      disabled={props.closeDisabled}
    >
      <X class="h-5 w-5" aria-hidden="true" />
    </Dialog.CloseButton>
  </div>
)

import { Button } from '@kobalte/core/button'
import type { Component } from 'solid-js'
import { Show } from 'solid-js'

interface GoalFormFooterProps {
  errorMessage: string
  isSaving: boolean
  onCancel: () => void
  onSave: () => void
}

/**
 * 目標フォームダイアログのフッターを描画する。
 *
 * @param props - エラー表示、保存状態、キャンセル/保存ハンドラ。
 * @returns フッター操作領域の JSX 要素。
 */
export const GoalFormFooter: Component<GoalFormFooterProps> = (props) => (
  <div class="mt-6">
    <Show when={props.errorMessage}>
      <p class="text-sm text-danger -mt-4 mb-2">{props.errorMessage}</p>
    </Show>
    <div class="flex shrink-0 justify-end gap-2">
      <Button
        type="button"
        class="rounded bg-action-secondary px-4 py-2 text-sm text-text-muted hover:bg-action-secondary-hover"
        onClick={props.onCancel}
        disabled={props.isSaving}
      >
        キャンセル
      </Button>
      <Button
        type="button"
        class="rounded bg-action-primary px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-action-primary-hover disabled:opacity-60"
        onClick={props.onSave}
        disabled={props.isSaving}
      >
        {props.isSaving ? '保存中...' : '保存する'}
      </Button>
    </div>
  </div>
)

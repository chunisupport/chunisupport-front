import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import { AppButton } from '../../../../../components/common/AppButton'

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
      <AppButton onClick={props.onCancel} disabled={props.isSaving}>
        キャンセル
      </AppButton>
      <AppButton variant="primary" onClick={props.onSave} disabled={props.isSaving}>
        {props.isSaving ? '保存中...' : '保存する'}
      </AppButton>
    </div>
  </div>
)

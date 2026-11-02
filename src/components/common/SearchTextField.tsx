import { TextField } from '@kobalte/core/text-field'
import { Search } from 'lucide-solid'
import type { Component } from 'solid-js'
import { Show } from 'solid-js'
import { createComposingSearchInput } from '../../hooks/createComposingSearchInput'
import {
  getSearchTextFieldFrameStateClass,
  getSearchTextFieldIconClass,
} from './searchTextFieldStyles'

type SearchTextFieldProps = {
  /** 入力欄の id */
  id?: string
  /** 表示ラベル */
  label?: string
  /** 表示ラベルがない場合に使うスクリーンリーダー向けラベル */
  ariaLabel: string
  /** 現在の検索文字列 */
  value: string
  /** 未入力時に表示する文言 */
  placeholder: string
  /** 検索文字列が入力済みの状態として強調するか */
  active?: boolean
  /** ルートへ追加で適用する Tailwind クラス */
  class?: string
  /** 外枠へ追加で適用する Tailwind クラス */
  frameClass?: string
  /** ラベルへ追加で適用する Tailwind クラス */
  labelClass?: string
  /** 検索文字列の変更通知先 */
  onChange: (value: string) => void
}

const SEARCH_TEXT_FIELD_FRAME_BASE_CLASS =
  'flex min-w-0 items-center gap-2 border bg-surface px-2 transition-colors focus-within:ring-2 focus-within:ring-inset focus-within:ring-focus-ring'

const SEARCH_TEXT_FIELD_INPUT_CLASS =
  'min-w-0 flex-1 bg-transparent py-2 font-sans text-sm outline-none'

/**
 * アプリ内で使う検索入力欄を共通スタイルで描画する。
 * IME変換中は未確定の全文を表示し、検索値だけ末尾の全角英字を外して通知する。
 *
 * @param props - ラベル、入力値、強調状態、変更ハンドラーを含む表示設定。
 * @returns Kobalte TextField を使った検索入力欄。
 */
export const SearchTextField: Component<SearchTextFieldProps> = (props) => {
  const composition = createComposingSearchInput({
    value: () => props.value,
    onChange: (value) => props.onChange(value),
  })

  return (
    <TextField
      class={props.class}
      value={composition.displayedValue()}
      onChange={composition.handleChange}
    >
      <Show when={props.label}>
        {(label) => (
          <TextField.Label
            class={`mb-1 block text-sm font-medium text-text-muted ${props.labelClass ?? ''}`}
            for={props.id}
          >
            {label()}
          </TextField.Label>
        )}
      </Show>
      <div
        class={`${SEARCH_TEXT_FIELD_FRAME_BASE_CLASS} ${getSearchTextFieldFrameStateClass(
          Boolean(props.active)
        )} ${props.frameClass ?? 'rounded-md'}`}
      >
        <Search
          class={`h-4 w-4 shrink-0 ${getSearchTextFieldIconClass(Boolean(props.active))}`}
          aria-hidden="true"
        />
        <TextField.Input
          id={props.id}
          type="search"
          class={SEARCH_TEXT_FIELD_INPUT_CLASS}
          aria-label={props.label ? undefined : props.ariaLabel}
          placeholder={props.placeholder}
          onCompositionStart={(event) => composition.beginComposition(event.currentTarget.value)}
          onCompositionEnd={(event) => composition.endComposition(event.currentTarget.value)}
        />
      </div>
    </TextField>
  )
}

import { Select } from '@kobalte/core/select'
import { Check, ChevronsUpDown } from 'lucide-solid'
import type { JSX } from 'solid-js'
import { createMemo, createSignal, For, Show } from 'solid-js'
import { AppButton } from './AppButton'

export type AppMultiSelectValue = string | number | null

export type AppMultiSelectOption<TValue extends AppMultiSelectValue> = {
  /** 選択値として扱う値 */
  value: TValue
  /** 画面に表示するラベル */
  label: string
}

export type AppMultiSelectProps<TValue extends AppMultiSelectValue> = {
  /** 複数選択で表示する選択肢 */
  options: readonly AppMultiSelectOption<TValue>[]
  /** 現在選択されている値 */
  selected: readonly TValue[]
  /** 未選択時に表示するプレースホルダー */
  placeholder: string
  /** 選択状態が変更されたときの通知先 */
  onChange: (selected: TValue[]) => void
  /** Select のポータルコンテンツに適用する z-index クラス */
  contentZIndexClass?: string
  /** トリガー内に表示する選択済み項目数の上限 */
  selectedPreviewLimit?: number
  /** 操作を無効化するかどうか */
  disabled?: boolean
  /** Select.Trigger へ追加で適用する Tailwind クラス */
  triggerClass?: string
}

export type MultiSelectFieldProps<TValue extends AppMultiSelectValue> =
  AppMultiSelectProps<TValue> & {
    /** 入力欄上部に表示するラベル */
    label?: string
    /** 全選択ボタンの表示文言 */
    selectAllLabel?: string
    /** 全選択ボタンで選択する値。未指定時は全選択肢を使う */
    selectAllValues?: readonly TValue[]
    /** 全解除ボタンの表示文言 */
    clearLabel?: string
    /** ラベルへ追加で適用する Tailwind クラス */
    labelClass?: string
  }

const MULTI_SELECT_CONTENT_BASE_CLASS =
  'max-h-64 w-[--kb-select-content-width] overflow-auto rounded border border-border bg-surface shadow-md'

const DEFAULT_MULTI_SELECT_CONTENT_Z_INDEX_CLASS = 'z-60'

const MULTI_SELECT_TRIGGER_CLASS =
  'flex w-full items-center rounded border border-border-strong bg-surface px-3 py-2 text-left text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-60'

/** AppMultiSelect の選択肢に適用する状態別スタイル */
const MULTI_SELECT_ITEM_CLASS =
  'cursor-pointer px-3 py-2 text-sm text-text transition-colors [&:not([data-selected]):hover]:bg-surface-muted [&:not([data-selected])[data-highlighted]]:bg-surface-muted data-[selected]:bg-action-primary-muted data-[selected]:font-medium data-[selected]:text-action-primary [&[data-selected]:hover]:bg-select-selected-hover-bg [&[data-selected][data-highlighted]]:bg-select-selected-hover-bg'

const SELECT_ALL_LABEL = 'すべて選択'
const CLEAR_LABEL = 'すべて解除'

/**
 * 値配列を AppMultiSelect 用の選択肢配列へ変換する。
 *
 * @param values - 選択肢として扱う値。
 * @param formatLabel - 値を表示ラベルへ変換する処理。
 * @returns AppMultiSelectOption 配列。
 */
export const toMultiSelectOptions = <TValue extends AppMultiSelectValue>(
  values: readonly TValue[],
  formatLabel?: (value: TValue) => string
): AppMultiSelectOption<TValue>[] =>
  values.map((value) => ({ value, label: formatLabel?.(value) ?? String(value) }))

/**
 * 複数選択用のプルダウン式チェックリストを表示する。
 *
 * @param props - 選択肢、選択状態、表示文言、更新ハンドラーを含む設定。
 * @returns 複数選択 Select の JSX 要素。
 */
export const AppMultiSelect = <TValue extends AppMultiSelectValue>(
  props: AppMultiSelectProps<TValue>
): JSX.Element => {
  const [contentRef, setContentRef] = createSignal<HTMLElement>()
  const optionValues = createMemo(() => props.options.map((option) => option.value))
  const labelByValue = createMemo(
    () => new Map(props.options.map((option) => [option.value, option.label]))
  )
  const selectedOptions = createMemo(() =>
    optionValues().filter((option) => props.selected.includes(option))
  )
  const visibleSelectedOptions = createMemo(() =>
    typeof props.selectedPreviewLimit === 'number'
      ? selectedOptions().slice(0, props.selectedPreviewLimit)
      : selectedOptions()
  )
  const hiddenSelectedCount = createMemo(
    () => selectedOptions().length - visibleSelectedOptions().length
  )

  /**
   * 選択値の表示ラベルを取得する。
   *
   * @param value - 表示対象の選択値。
   * @returns 選択肢で定義されたラベル。
   */
  const formatLabel = (value: TValue): string => labelByValue().get(value) ?? String(value)

  return (
    <Select<TValue>
      multiple
      options={optionValues()}
      value={selectedOptions()}
      onChange={props.onChange}
      placeholder={props.placeholder}
      disabled={props.disabled}
      gutter={0}
      itemComponent={(itemProps) => (
        <Select.Item item={itemProps.item} class={MULTI_SELECT_ITEM_CLASS}>
          <div class="flex items-center gap-2">
            <span class="inline-flex w-4 justify-center text-action-primary">
              <Select.ItemIndicator>
                <Check size={14} aria-hidden="true" />
              </Select.ItemIndicator>
            </span>
            <Select.ItemLabel>{formatLabel(itemProps.item.rawValue)}</Select.ItemLabel>
          </div>
        </Select.Item>
      )}
    >
      <Select.Trigger class={`${MULTI_SELECT_TRIGGER_CLASS} ${props.triggerClass ?? ''}`}>
        <div class="flex min-h-6 flex-1 flex-wrap gap-1" aria-live="polite">
          <Show
            when={selectedOptions().length > 0}
            fallback={<span class="text-text-subtle">{props.placeholder}</span>}
          >
            <For each={visibleSelectedOptions()}>
              {(option) => (
                <span class="rounded-full bg-action-primary-muted px-2 py-0.5 text-xs text-action-primary">
                  {formatLabel(option)}
                </span>
              )}
            </For>
            <Show when={hiddenSelectedCount() > 0}>
              <span class="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text-muted">
                +{hiddenSelectedCount()}
              </span>
            </Show>
          </Show>
        </div>
        <span class="text-text-subtle" aria-hidden="true">
          <ChevronsUpDown size={16} />
        </span>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          ref={setContentRef}
          class={`${props.contentZIndexClass ?? DEFAULT_MULTI_SELECT_CONTENT_Z_INDEX_CLASS} ${MULTI_SELECT_CONTENT_BASE_CLASS}`}
        >
          <Select.Listbox scrollRef={contentRef} />
        </Select.Content>
      </Select.Portal>
    </Select>
  )
}

/**
 * ラベルと全選択/解除ボタンを含む複数選択フィールドを表示する。
 *
 * @param props - ラベル、選択肢、選択状態、更新ハンドラーを含む設定。
 * @returns フォーム向け複数選択フィールド。
 */
export const MultiSelectField = <TValue extends AppMultiSelectValue>(
  props: MultiSelectFieldProps<TValue>
): JSX.Element => (
  <div>
    <Show when={props.label}>
      {(label) => (
        <span class={`mb-1 block text-sm font-medium text-text-muted ${props.labelClass ?? ''}`}>
          {label()}
        </span>
      )}
    </Show>
    <div class="mb-1 flex gap-2">
      <AppButton
        size="xs"
        disabled={props.disabled}
        onClick={() =>
          props.onChange([
            ...(props.selectAllValues ?? props.options.map((option) => option.value)),
          ])
        }
      >
        {props.selectAllLabel ?? SELECT_ALL_LABEL}
      </AppButton>
      <AppButton size="xs" disabled={props.disabled} onClick={() => props.onChange([])}>
        {props.clearLabel ?? CLEAR_LABEL}
      </AppButton>
    </div>
    <AppMultiSelect
      options={props.options}
      selected={props.selected}
      placeholder={props.placeholder}
      onChange={props.onChange}
      contentZIndexClass={props.contentZIndexClass}
      selectedPreviewLimit={props.selectedPreviewLimit}
      disabled={props.disabled}
      triggerClass={props.triggerClass}
    />
  </div>
)

import { Button } from '@kobalte/core/button'
import { Select } from '@kobalte/core/select'
import { Check, ChevronsUpDown } from 'lucide-solid'
import { createMemo, For, Show } from 'solid-js'

type MultiSelectDropdownProps<T extends string | number | null> = {
  /** 複数選択で表示する選択肢。 */
  options: T[]
  /** 現在選択されている値。 */
  selected: T[]
  /** 未選択時に表示するプレースホルダー。 */
  placeholder: string
  /** 選択肢の値を表示用ラベルへ変換する処理。 */
  formatLabel?: (value: T) => string
  /** 選択状態を切り替える処理。 */
  onToggle: (value: T) => void
  /** すべての選択肢を選択する処理。 */
  onSelectAll: () => void
  /** 選択をすべて解除する処理。 */
  onClear: () => void
  /** Select のポータルコンテンツに適用する z-index クラス。 */
  contentZIndexClass?: string
}

/** Select の選択肢ポータルに共通で適用する Tailwind クラス。 */
const MULTI_SELECT_CONTENT_BASE_CLASS =
  '-mt-2 -mb-2 max-h-64 w-[--kb-select-content-width] overflow-auto rounded border border-border bg-surface shadow-md'

/** Select の選択肢ポータルを通常のダイアログ上に表示するための既定 z-index クラス。 */
const DEFAULT_MULTI_SELECT_CONTENT_Z_INDEX_CLASS = 'z-60'

/** 複数選択 Select のトリガーに適用する Tailwind クラス。 */
const MULTI_SELECT_TRIGGER_CLASS =
  'flex w-full items-center rounded border border-border-strong bg-surface px-3 py-2 text-left text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

/** 複数選択 Select の選択肢に適用する Tailwind クラス。 */
const MULTI_SELECT_ITEM_CLASS =
  'cursor-pointer px-3 py-2 text-sm text-text hover:bg-success-bg data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg'

/**
 * 複数選択用のプルダウン式チェックリストを表示する。
 *
 * @param props - 選択肢、選択状態、表示文言、更新ハンドラーを含む設定。
 * @returns 複数選択 Select の JSX 要素。
 */
const MultiSelectDropdown = <T extends string | number | null>(
  props: MultiSelectDropdownProps<T>
) => {
  /**
   * 選択肢の値を Select 上の表示名へ変換する。
   *
   * @param value - 選択肢の生値。
   * @returns 画面に表示するラベル。
   */
  const formatLabel = (value: T): string => props.formatLabel?.(value) ?? String(value)

  const selectedOptions = createMemo(() =>
    props.options.filter((option) => props.selected.includes(option))
  )

  /**
   * 複数選択 Select の変更結果を呼び出し元の選択状態へ反映する。
   *
   * @param nextSelected - Select で選択された次の値配列。
   * @returns なし。
   */
  const handleChange = (nextSelected: T[]): void => {
    for (const option of props.options) {
      if (props.selected.includes(option) !== nextSelected.includes(option)) {
        props.onToggle(option)
      }
    }
  }

  return (
    <div>
      <div class="mb-1 flex gap-2">
        <Button
          type="button"
          class="rounded bg-action-secondary px-2 py-1 text-xs text-text-muted hover:bg-action-secondary-hover"
          onClick={props.onSelectAll}
        >
          すべて選択
        </Button>
        <Button
          type="button"
          class="rounded bg-action-secondary px-2 py-1 text-xs text-text-muted hover:bg-action-secondary-hover"
          onClick={props.onClear}
        >
          すべて解除
        </Button>
      </div>
      <Select<T>
        multiple
        options={props.options}
        value={selectedOptions()}
        onChange={handleChange}
        placeholder={props.placeholder}
        itemComponent={(itemProps) => (
          <Select.Item item={itemProps.item} class={MULTI_SELECT_ITEM_CLASS}>
            <div class="flex items-center gap-2">
              <span class="inline-flex w-4 justify-center text-success">
                <Select.ItemIndicator>
                  <Check size={14} />
                </Select.ItemIndicator>
              </span>
              <Select.ItemLabel>{formatLabel(itemProps.item.rawValue)}</Select.ItemLabel>
            </div>
          </Select.Item>
        )}
      >
        <Select.Trigger class={MULTI_SELECT_TRIGGER_CLASS}>
          <div class="flex min-h-6 flex-1 flex-wrap gap-1" aria-live="polite">
            <Show
              when={selectedOptions().length > 0}
              fallback={<span class="text-text-subtle">{props.placeholder}</span>}
            >
              <For each={selectedOptions()}>
                {(option) => (
                  <span class="rounded-full bg-success-bg px-2 py-0.5 text-xs text-success">
                    {formatLabel(option)}
                  </span>
                )}
              </For>
            </Show>
          </div>
          <span class="text-text-subtle" aria-hidden="true">
            <ChevronsUpDown size={16} />
          </span>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            class={`${props.contentZIndexClass ?? DEFAULT_MULTI_SELECT_CONTENT_Z_INDEX_CLASS} ${MULTI_SELECT_CONTENT_BASE_CLASS}`}
          >
            <Select.Listbox />
          </Select.Content>
        </Select.Portal>
      </Select>
    </div>
  )
}

export default MultiSelectDropdown

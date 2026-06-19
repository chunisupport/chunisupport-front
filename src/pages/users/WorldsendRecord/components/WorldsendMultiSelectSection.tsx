import { Button } from '@kobalte/core/button'
import { Select } from '@kobalte/core/select'
import { Check, ChevronsUpDown } from 'lucide-solid'
import { createMemo, For, Show } from 'solid-js'

type WorldsendMultiSelectSectionProps<T extends string | number | null> = {
  title: string
  idPrefix: string
  options: T[]
  selected: T[]
  formatLabel: (value: T) => string
  onToggle: (value: T) => void
  onSelectAll: () => void
  onClear: () => void
}

const WORLDSEND_FILTER_MULTI_SELECT_TRIGGER_CLASS =
  'flex w-full items-center rounded border border-border-strong bg-surface px-3 py-2 text-left hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

const WORLDSEND_FILTER_MULTI_SELECT_ITEM_CLASS =
  'cursor-pointer px-3 py-2 text-text hover:bg-success-bg-hover data-[highlighted]:bg-success-bg-hover data-[selected]:bg-success-bg data-[selected]:hover:bg-success-bg-hover data-[selected]:data-[highlighted]:bg-success-bg-hover'

/**
 * WORLD'S END フィルター用の複数選択セクションを表示する。
 *
 * @param props - 選択肢、選択状態、更新ハンドラーを含む表示設定。
 * @returns チェックボックス一覧の JSX 要素。
 */
const WorldsendMultiSelectSection = <T extends string | number | null>(
  props: WorldsendMultiSelectSectionProps<T>
) => {
  const selectedOptions = createMemo(() =>
    props.options.filter((option) => props.selected.includes(option))
  )

  /**
   * 複数選択 Select の変更結果をフィルター状態へ反映する。
   *
   * @param nextSelectedOptions - Select で選択された次の値配列。
   * @returns なし。
   */
  const handleChange = (nextSelectedOptions: T[]) => {
    for (const option of props.options) {
      if (props.selected.includes(option) !== nextSelectedOptions.includes(option)) {
        props.onToggle(option)
      }
    }
  }

  return (
    <div>
      <span class="mb-1 block text-sm font-medium">{props.title}</span>
      <div class="mb-1 flex gap-2">
        <Button.Root
          type="button"
          class="rounded bg-action-secondary px-2 py-1 text-xs text-text-muted hover:bg-action-secondary-hover"
          onClick={props.onSelectAll}
        >
          すべて選択
        </Button.Root>
        <Button.Root
          type="button"
          class="rounded bg-action-secondary px-2 py-1 text-xs text-text-muted hover:bg-action-secondary-hover"
          onClick={props.onClear}
        >
          すべて解除
        </Button.Root>
      </div>
      <Select<T>
        multiple
        options={props.options}
        value={selectedOptions()}
        onChange={handleChange}
        placeholder={`${props.title}を選択`}
        itemComponent={(itemProps) => (
          <Select.Item item={itemProps.item} class={WORLDSEND_FILTER_MULTI_SELECT_ITEM_CLASS}>
            <div class="flex items-center gap-2">
              <span class="inline-flex w-4 justify-center text-success">
                <Select.ItemIndicator>
                  <Check size={14} />
                </Select.ItemIndicator>
              </span>
              <Select.ItemLabel>{props.formatLabel(itemProps.item.rawValue)}</Select.ItemLabel>
            </div>
          </Select.Item>
        )}
      >
        <Select.Trigger class={WORLDSEND_FILTER_MULTI_SELECT_TRIGGER_CLASS}>
          <div class="flex min-h-6 flex-1 flex-wrap gap-1" aria-live="polite">
            <Show
              when={selectedOptions().length > 0}
              fallback={<span class="text-text-subtle">{props.title}を選択</span>}
            >
              <For each={selectedOptions()}>
                {(option) => (
                  <span class="rounded-full bg-success-bg px-2 py-0.5 text-xs text-success">
                    {props.formatLabel(option)}
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
          <Select.Content class="z-60 mt-1 max-h-64 w-[--kb-select-content-width] overflow-auto rounded border border-border bg-surface shadow-md">
            <Select.Listbox />
          </Select.Content>
        </Select.Portal>
      </Select>
    </div>
  )
}

export default WorldsendMultiSelectSection

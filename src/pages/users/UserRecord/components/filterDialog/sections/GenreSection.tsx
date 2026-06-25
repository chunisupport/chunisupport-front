import { Button } from '@kobalte/core/button'
import { Select } from '@kobalte/core/select'
import { Check, ChevronsUpDown } from 'lucide-solid'
import type { Component } from 'solid-js'
import { createMemo, For, Show } from 'solid-js'
import {
  DEFAULT_MULTI_SELECT_CONTENT_Z_INDEX_CLASS,
  MULTI_SELECT_CONTENT_BASE_CLASS,
} from './multiSelectSectionClasses'

type GenreSectionProps = {
  /** ジャンルの選択肢。 */
  genres: string[]
  /** 現在選択されているジャンル。 */
  selected: string[]
  /** ジャンルの選択状態を切り替える処理。 */
  onToggle: (genre: string) => void
  /** すべてのジャンルを選択する処理。 */
  onSelectAll: () => void
  /** ジャンルの選択をすべて解除する処理。 */
  onClear: () => void
  /** Select のポータルコンテンツに適用する z-index クラス。 */
  contentZIndexClass?: string
}

const MULTI_SELECT_TRIGGER_CLASS =
  'flex w-full items-center rounded border border-border-strong bg-surface px-3 py-2 text-left text-sm hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'

const MULTI_SELECT_ITEM_CLASS =
  'cursor-pointer px-3 py-2 text-sm text-text hover:bg-success-bg data-[highlighted]:bg-success-bg data-[selected]:bg-success-bg'

/**
 * ジャンルの複数選択フィルターをプルダウン式チェックリストで表示する。
 *
 * @param props - 選択肢、選択状態、更新ハンドラーを含む表示設定。
 * @returns ジャンル選択の JSX 要素。
 */
const GenreSection: Component<GenreSectionProps> = (props) => {
  const selectedOptions = createMemo(() =>
    props.genres.filter((genre) => props.selected.includes(genre))
  )

  /**
   * 複数選択 Select の変更結果をフィルター状態へ反映する。
   *
   * @param nextSelected - Select で選択された次の値配列。
   */
  const handleChange = (nextSelected: string[]) => {
    for (const genre of props.genres) {
      if (props.selected.includes(genre) !== nextSelected.includes(genre)) {
        props.onToggle(genre)
      }
    }
  }

  return (
    <div>
      <span class="mb-1 block text-sm font-medium">ジャンル</span>
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
      <Select<string>
        multiple
        options={props.genres}
        value={selectedOptions()}
        onChange={handleChange}
        placeholder="ジャンルを選択"
        itemComponent={(itemProps) => (
          <Select.Item item={itemProps.item} class={MULTI_SELECT_ITEM_CLASS}>
            <div class="flex items-center gap-2">
              <span class="inline-flex w-4 justify-center text-success">
                <Select.ItemIndicator>
                  <Check size={14} />
                </Select.ItemIndicator>
              </span>
              <Select.ItemLabel>{itemProps.item.rawValue}</Select.ItemLabel>
            </div>
          </Select.Item>
        )}
      >
        <Select.Trigger class={MULTI_SELECT_TRIGGER_CLASS}>
          <div class="flex min-h-6 flex-1 flex-wrap gap-1" aria-live="polite">
            <Show
              when={selectedOptions().length > 0}
              fallback={<span class="text-text-subtle">ジャンルを選択</span>}
            >
              <For each={selectedOptions()}>
                {(genre) => (
                  <span class="rounded-full bg-success-bg px-2 py-0.5 text-xs text-success">
                    {genre}
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

export default GenreSection

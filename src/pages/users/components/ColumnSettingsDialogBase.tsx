import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { Select } from '@kobalte/core/select'
import { Check, ChevronsUpDown } from 'lucide-solid'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'
import type { ColumnDefinitionBase } from '../utils/recordTableColumns'

const COLUMN_SETTINGS_TITLE = '列設定'
const COLUMN_SETTINGS_DESCRIPTION = '表示する列を選択してください（1列以上必須）'
const COLUMN_SETTINGS_PLACEHOLDER = '表示列を選択'
const CANCEL_LABEL = 'キャンセル'
const APPLY_LABEL = '適用'
/**
 * 列選択トリガーのフォーカス表示を要素内側に収める共通スタイル。
 */
const COLUMN_SETTINGS_SELECT_TRIGGER_CLASS =
  'flex w-full items-center rounded border border-border-strong bg-surface px-3 py-2 text-left hover:border-input-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring'
/**
 * 目的: 列設定リストのチェック済み色とフォーカス中のホバー色を分ける共通スタイル。
 */
const COLUMN_SETTINGS_SELECT_ITEM_CLASS =
  'cursor-pointer px-3 py-2 text-text hover:bg-success-bg-hover data-[highlighted]:bg-success-bg-hover data-[selected]:bg-success-bg data-[selected]:hover:bg-success-bg-hover data-[selected]:data-[highlighted]:bg-success-bg-hover'

type ColumnOption<TColumnId extends string> = {
  id: TColumnId
  label: string
}

type ColumnSettingsDialogBaseProps<TColumnId extends string, TSortKey extends string> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  visibleColumnIds: TColumnId[]
  columnDefinitions: ColumnDefinitionBase<TColumnId, TSortKey>[]
  sortVisibleColumnIdsByDefinitionOrder: (visibleColumnIds: TColumnId[]) => TColumnId[]
  onApply: (visibleColumnIds: TColumnId[]) => void
}

/**
 * 目的: 列定義から列設定で使う選択肢を生成します。
 * 引数: columnDefinitions - 表示対象の列定義配列。
 * 返り値: Kobalte Select に渡す列選択肢配列。
 */
const createColumnOptions = <TColumnId extends string, TSortKey extends string>(
  columnDefinitions: ColumnDefinitionBase<TColumnId, TSortKey>[]
): ColumnOption<TColumnId>[] =>
  columnDefinitions.map((column) => ({
    id: column.id,
    label: column.label,
  }))

/**
 * 目的: standard と WORLD'S END で共通利用する列設定ダイアログを表示します。
 * 引数: props - 開閉状態、列定義、表示列ID、適用時のコールバック。
 * 返り値: 列の表示状態を変更するダイアログUI。
 */
const ColumnSettingsDialogBase = <TColumnId extends string, TSortKey extends string>(
  props: ColumnSettingsDialogBaseProps<TColumnId, TSortKey>
) => {
  const columnOptions = createMemo(() => createColumnOptions(props.columnDefinitions))
  const [selectedColumnIds, setSelectedColumnIds] = createSignal<TColumnId[]>(
    props.visibleColumnIds
  )

  const selectedOptions = createMemo(() => {
    const idSet = new Set(selectedColumnIds())
    return columnOptions().filter((option) => idSet.has(option.id))
  })

  createEffect(() => {
    if (props.open) {
      setSelectedColumnIds(props.visibleColumnIds)
    }
  })

  const handleChange = (options: ColumnOption<TColumnId>[]) => {
    setSelectedColumnIds(
      props.sortVisibleColumnIdsByDefinitionOrder(options.map((option) => option.id))
    )
  }

  const handleApply = () => {
    if (selectedColumnIds().length === 0) {
      return
    }

    props.onApply(selectedColumnIds())
    props.onOpenChange(false)
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed z-50 left-1/2 top-1/2 max-h-[90vh] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg">
          <Dialog.Title class="mb-4 text-lg font-bold">{COLUMN_SETTINGS_TITLE}</Dialog.Title>
          <p class="mb-3 text-xs text-text-subtle">{COLUMN_SETTINGS_DESCRIPTION}</p>

          <Select<ColumnOption<TColumnId>>
            multiple
            options={columnOptions()}
            optionValue="id"
            optionTextValue="label"
            value={selectedOptions()}
            onChange={handleChange}
            placeholder={COLUMN_SETTINGS_PLACEHOLDER}
            itemComponent={(props) => (
              <Select.Item item={props.item} class={COLUMN_SETTINGS_SELECT_ITEM_CLASS}>
                <div class="flex items-center gap-2">
                  <span class="inline-flex w-4 justify-center text-success">
                    <Select.ItemIndicator>
                      <Check size={14} />
                    </Select.ItemIndicator>
                  </span>
                  <Select.ItemLabel>{props.item.rawValue.label}</Select.ItemLabel>
                </div>
              </Select.Item>
            )}
          >
            <Select.Trigger class={COLUMN_SETTINGS_SELECT_TRIGGER_CLASS}>
              <div class="flex min-h-6 flex-1 flex-wrap gap-1" aria-live="polite">
                <Show
                  when={selectedOptions().length > 0}
                  fallback={<span class="text-text-subtle">{COLUMN_SETTINGS_PLACEHOLDER}</span>}
                >
                  <For each={selectedOptions()}>
                    {(option) => (
                      <span class="rounded-full bg-success-bg px-2 py-0.5 text-xs text-success">
                        {option.label}
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
              <Select.Content class="z-50 mt-1 max-h-64 w-[--kb-select-content-width] overflow-auto rounded border border-border bg-surface shadow-md">
                <Select.Listbox />
              </Select.Content>
            </Select.Portal>
          </Select>

          <div class="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              class="rounded bg-action-secondary px-4 py-2 text-text-muted hover:bg-action-secondary-hover"
              onClick={() => props.onOpenChange(false)}
            >
              {CANCEL_LABEL}
            </Button>
            <Button
              type="button"
              class="rounded bg-action-primary px-4 py-2 text-text-inverse hover:bg-action-primary-hover disabled:cursor-not-allowed disabled:bg-action-secondary-hover"
              onClick={handleApply}
              disabled={selectedColumnIds().length === 0}
            >
              {APPLY_LABEL}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default ColumnSettingsDialogBase

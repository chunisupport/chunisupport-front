import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { Select } from '@kobalte/core/select'
import * as Tabs from '@kobalte/core/tabs'
import { Check, ChevronDown } from 'lucide-solid'
import { createEffect, createMemo, createSignal, For } from 'solid-js'
import type { SortDirection } from '../recordTable/sortingQuery'
import {
  FILTER_DIALOG_SELECT_ITEM_CLASS,
  FILTER_DIALOG_SELECT_TRIGGER_CLASS,
} from './filter/styles'

/** 複数条件ソートで使う1行分のソート条件。 */
export type SortCondition<TSortKey extends string> = {
  key: TSortKey
  direction: SortDirection
}

/** 複数条件ソートで選択できる列の表示項目。 */
export type SortConditionColumnOption<TSortKey extends string> = {
  value: TSortKey
  label: string
}

type SortDirectionOption = {
  value: SortDirection
  label: string
}

type SortDialogViewMode = 'standard' | 'detail'

type SortConditionsDialogProps<TSortKey extends string> = {
  open: boolean
  sortConditions: SortCondition<TSortKey>[]
  defaultSortConditions: SortCondition<TSortKey>[]
  columnOptions: SortConditionColumnOption<TSortKey>[]
  fixedLastConditionLabel: string
  onOpenChange: (open: boolean) => void
  onApply: (sortConditions: SortCondition<TSortKey>[]) => void
  normalizeSortConditions: (sortConditions: SortCondition<TSortKey>[]) => SortCondition<TSortKey>[]
}

/** ソート方向の選択肢。 */
const SORT_DIRECTION_OPTIONS: SortDirectionOption[] = [
  { value: 'desc', label: '降順' },
  { value: 'asc', label: '昇順' },
]

/** ソートダイアログの操作ボタンで使う Tailwind クラス。 */
const SORT_DIALOG_BUTTON_CLASS = {
  secondary:
    'rounded bg-action-secondary px-4 py-2 text-sm text-text-muted hover:bg-action-secondary-hover',
  primary:
    'rounded bg-action-primary px-4 py-2 text-sm text-text-inverse hover:bg-action-primary-hover',
} as const

/** ソート表示モード切り替えタブの表示クラス。 */
const SORT_VIEW_TAB_TRIGGER_CLASS =
  'rounded-md px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-action-secondary hover:text-text data-selected:bg-action-primary data-selected:text-text-inverse data-selected:shadow-sm data-selected:hover:bg-action-primary data-selected:hover:text-text-inverse focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring'

/** 詳細ソート行の番号バッジ表示クラス。 */
const SORT_CONDITION_BADGE_CLASS =
  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-sm font-bold text-text-muted'

/**
 * ソート方向の表示名を取得する。
 *
 * @param direction - ソート方向。
 * @returns 方向の表示名。
 */
const getSortDirectionLabel = (direction: SortDirection): string =>
  direction === 'asc' ? '昇順' : '降順'

/**
 * ソート方向に対応する選択肢を取得する。
 *
 * @param direction - ソート方向。
 * @returns 対応する選択肢。
 */
const getSortDirectionOption = (direction: SortDirection): SortDirectionOption =>
  SORT_DIRECTION_OPTIONS.find((option) => option.value === direction) ?? SORT_DIRECTION_OPTIONS[0]

/**
 * タブの値がソート表示モードか判定する。
 *
 * @param value - Kobalte Tabs から渡されるタブ値。
 * @returns ソート表示モードとして扱える場合は true。
 */
const isSortDialogViewMode = (value: string): value is SortDialogViewMode =>
  value === 'standard' || value === 'detail'

/**
 * 複数条件ソートの編集ダイアログを表示する。
 *
 * @param props - 開閉状態、ソート条件、列選択肢、正規化関数、開閉・適用ハンドラー。
 * @returns 複数条件ソートを編集するダイアログUI。
 */
export function SortConditionsDialog<TSortKey extends string>(
  props: SortConditionsDialogProps<TSortKey>
) {
  const [draftSortConditions, setDraftSortConditions] = createSignal<SortCondition<TSortKey>[]>(
    props.normalizeSortConditions(props.sortConditions)
  )
  const [viewMode, setViewMode] = createSignal<SortDialogViewMode>('standard')
  const sortConditionIndices = createMemo(() =>
    props.defaultSortConditions.map((_, index) => index)
  )
  const fixedLastSortIndex = () => props.defaultSortConditions.length - 1
  let wasOpen = false

  createEffect(() => {
    if (props.open && !wasOpen) {
      setDraftSortConditions(props.normalizeSortConditions(props.sortConditions))
    }
    wasOpen = props.open
  })

  /**
   * ソートキーに対応する列選択肢を取得する。
   *
   * @param key - ソートキー。
   * @returns 対応する列選択肢。
   */
  const getSortColumnOption = (key: TSortKey): SortConditionColumnOption<TSortKey> =>
    props.columnOptions.find((option) => option.value === key) ?? props.columnOptions[0]

  /**
   * 指定行のソート列を更新する。
   *
   * @param rowIndex - 更新対象の行番号。
   * @param key - 次に指定するソートキー。
   * @returns なし。
   */
  const updateDraftSortKey = (rowIndex: number, key: TSortKey): void => {
    setDraftSortConditions((currentDraftSortConditions) =>
      currentDraftSortConditions.map((draftSortCondition, index) =>
        index === rowIndex ? { ...draftSortCondition, key } : draftSortCondition
      )
    )
  }

  /**
   * 指定行のソート方向を更新する。
   *
   * @param rowIndex - 更新対象の行番号。
   * @param direction - 次に指定するソート方向。
   * @returns なし。
   */
  const updateDraftSortDirection = (rowIndex: number, direction: SortDirection): void => {
    setDraftSortConditions((currentDraftSortConditions) =>
      currentDraftSortConditions.map((draftSortCondition, index) =>
        index === rowIndex ? { ...draftSortCondition, direction } : draftSortCondition
      )
    )
  }

  /**
   * 下書き中のソート条件を一覧へ適用する。
   *
   * @returns なし。
   */
  const applySortConditions = (): void => {
    props.onApply(props.normalizeSortConditions(draftSortConditions()))
    props.onOpenChange(false)
  }

  /**
   * ソート表示モードを切り替える。
   *
   * @param value - Kobalte Tabs から渡されるタブ値。
   * @returns なし。
   */
  const handleViewModeChange = (value: string): void => {
    if (isSortDialogViewMode(value)) {
      setViewMode(value)
    }
  }

  /**
   * ソート条件1行分の入力UIを表示する。
   *
   * @param rowIndex - 表示対象のソート条件番号。
   * @param showBadge - 詳細表示用の番号バッジを表示するか。
   * @returns ソート列セレクトと方向セレクト、または固定ソートの表示。
   */
  const renderSortConditionRow = (rowIndex: number, showBadge: boolean) => {
    const draftSortCondition = () => draftSortConditions()[rowIndex]
    const selectedKey = () => draftSortCondition()?.key ?? props.defaultSortConditions[rowIndex].key
    const selectedDirection = () =>
      draftSortCondition()?.direction ?? props.defaultSortConditions[rowIndex].direction
    const isFixedLastSort = () => rowIndex === fixedLastSortIndex()

    if (isFixedLastSort()) {
      return (
        <div class="flex items-baseline gap-2">
          {showBadge ? (
            <span class={SORT_CONDITION_BADGE_CLASS} aria-hidden="true">
              {rowIndex + 1}
            </span>
          ) : null}
          <div class="min-h-9.5 min-w-0 flex-1 px-1 py-2 text-text-muted">
            {props.fixedLastConditionLabel}
          </div>
        </div>
      )
    }

    return (
      <div class="flex items-center gap-2">
        {showBadge ? (
          <span class={SORT_CONDITION_BADGE_CLASS} aria-hidden="true">
            {rowIndex + 1}
          </span>
        ) : null}
        <div class="min-w-0 flex-1">
          <Select<SortConditionColumnOption<TSortKey>>
            options={props.columnOptions}
            optionValue="value"
            optionTextValue="label"
            value={getSortColumnOption(selectedKey())}
            onChange={(option) => {
              if (option) updateDraftSortKey(rowIndex, option.value)
            }}
            gutter={0}
            itemComponent={(itemProps) => (
              <Select.Item item={itemProps.item} class={FILTER_DIALOG_SELECT_ITEM_CLASS}>
                <Select.ItemLabel>{itemProps.item.rawValue.label}</Select.ItemLabel>
                <Select.ItemIndicator class="indicator h-5 w-5 inline-flex items-center justify-center">
                  <Check class="h-4 w-4" />
                </Select.ItemIndicator>
              </Select.Item>
            )}
          >
            <Select.Label class="sr-only">第{rowIndex + 1}ソート 列</Select.Label>
            <Select.Trigger class={FILTER_DIALOG_SELECT_TRIGGER_CLASS}>
              <Select.Value<
                SortConditionColumnOption<TSortKey>
              > class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-text-placeholder">
                {(state) => state.selectedOption()?.label}
              </Select.Value>
              <Select.Icon class="h-5 w-5 flex items-center justify-center">
                <ChevronDown class="h-4 w-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content class="z-60 bg-surface rounded-md border border-border-strong shadow-lg">
                <Select.Listbox class="max-h-90 overflow-y-auto p-2" />
              </Select.Content>
            </Select.Portal>
          </Select>
        </div>
        <div class="w-24 shrink-0">
          <Select<SortDirectionOption>
            options={SORT_DIRECTION_OPTIONS}
            optionValue="value"
            optionTextValue="label"
            value={getSortDirectionOption(selectedDirection())}
            onChange={(option) => {
              if (option) updateDraftSortDirection(rowIndex, option.value)
            }}
            gutter={0}
            itemComponent={(itemProps) => (
              <Select.Item item={itemProps.item} class={FILTER_DIALOG_SELECT_ITEM_CLASS}>
                <Select.ItemLabel>{itemProps.item.rawValue.label}</Select.ItemLabel>
                <Select.ItemIndicator class="indicator h-5 w-5 inline-flex items-center justify-center">
                  <Check class="h-4 w-4" />
                </Select.ItemIndicator>
              </Select.Item>
            )}
          >
            <Select.Label class="sr-only">
              第{rowIndex + 1}ソート {getSortDirectionLabel(selectedDirection())}
            </Select.Label>
            <Select.Trigger class={FILTER_DIALOG_SELECT_TRIGGER_CLASS}>
              <Select.Value<SortDirectionOption> class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-text-placeholder">
                {(state) => state.selectedOption()?.label}
              </Select.Value>
              <Select.Icon class="h-5 w-5 flex items-center justify-center">
                <ChevronDown class="h-4 w-4" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content class="z-60 bg-surface rounded-md border border-border-strong shadow-lg">
                <Select.Listbox class="p-2" />
              </Select.Content>
            </Select.Portal>
          </Select>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed left-1/2 top-1/2 z-50 flex max-h-[80dvh] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-surface p-6 shadow-lg">
          <div class="mb-4 shrink-0">
            <Dialog.Title class="text-lg font-bold">ソート</Dialog.Title>
          </div>

          <Tabs.Root value={viewMode()} onChange={handleViewModeChange}>
            <Tabs.List class="mb-4 inline-flex gap-1 rounded-lg bg-surface-hover p-1">
              <Tabs.Trigger value="standard" class={SORT_VIEW_TAB_TRIGGER_CLASS}>
                通常
              </Tabs.Trigger>
              <Tabs.Trigger value="detail" class={SORT_VIEW_TAB_TRIGGER_CLASS}>
                詳細
              </Tabs.Trigger>
            </Tabs.List>

            <div class="min-h-0 flex-1 overflow-y-auto pr-1 text-sm">
              <Tabs.Content value="standard">{renderSortConditionRow(0, false)}</Tabs.Content>
              <Tabs.Content value="detail" class="space-y-3">
                <For each={sortConditionIndices()}>
                  {(rowIndex) => renderSortConditionRow(rowIndex, true)}
                </For>
              </Tabs.Content>
            </div>
          </Tabs.Root>

          <div class="mt-6 flex shrink-0 justify-end gap-2">
            <Dialog.CloseButton class={SORT_DIALOG_BUTTON_CLASS.secondary}>
              閉じる
            </Dialog.CloseButton>
            <Button
              type="button"
              class={SORT_DIALOG_BUTTON_CLASS.primary}
              onClick={applySortConditions}
            >
              適用
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

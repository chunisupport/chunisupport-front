import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { Select } from '@kobalte/core/select'
import { Check, ChevronDown, CircleSlash2 } from 'lucide-solid'
import { type Component, createEffect, createSignal, For } from 'solid-js'
import type { RecordSortCondition, RecordSortKey, SortDirection } from '../types/types'
import { RECORD_COLUMN_DEFINITIONS } from '../utils/columns'
import {
  FILTER_DIALOG_SELECT_ITEM_CLASS,
  FILTER_DIALOG_SELECT_TRIGGER_CLASS,
} from './filterDialog/styles'

type AdvancedSortDialogProps = {
  open: boolean
  sortConditions: RecordSortCondition[]
  onOpenChange: (open: boolean) => void
  onApply: (sortConditions: RecordSortCondition[]) => void
}

type DraftSortCondition = {
  key: RecordSortKey | null
  direction: SortDirection
}

type SortColumnOption = {
  value: RecordSortKey
  label: string
}

type SortDirectionOption = {
  value: SortDirection
  label: string
}

/** 高度ソートで指定できる最大条件数。 */
const MAX_SORT_CONDITION_COUNT = 3

/** ソート指定行の番号。 */
const SORT_CONDITION_INDICES = Array.from({ length: MAX_SORT_CONDITION_COUNT }, (_, index) => index)

/** ソート列の選択肢。 */
const SORT_COLUMN_OPTIONS: SortColumnOption[] = RECORD_COLUMN_DEFINITIONS.map((definition) => ({
  value: definition.sortKey,
  label: definition.label,
}))

/** ソート方向の選択肢。 */
const SORT_DIRECTION_OPTIONS: SortDirectionOption[] = [
  { value: 'asc', label: '昇順' },
  { value: 'desc', label: '降順' },
]

/** 高度ソートダイアログの操作ボタンで使う Tailwind クラス。 */
const ADVANCED_SORT_DIALOG_BUTTON_CLASS = {
  secondary:
    'rounded bg-action-secondary px-4 py-2 text-sm text-text-muted hover:bg-action-secondary-hover',
  primary:
    'rounded bg-action-primary px-4 py-2 text-sm text-text-inverse hover:bg-action-primary-hover',
} as const

/**
 * 空のソート下書き行を生成する。
 *
 * @returns 未指定状態のソート下書き行。
 */
const createEmptyDraftSortCondition = (): DraftSortCondition => ({
  key: null,
  direction: 'asc',
})

/**
 * 適用済みソート条件を3行分の下書きに変換する。
 *
 * @param sortConditions - 適用済みのソート条件。
 * @returns ダイアログで編集する3行分の下書き。
 */
const toDraftSortConditions = (sortConditions: RecordSortCondition[]): DraftSortCondition[] => {
  const draftSortConditions = sortConditions
    .slice(0, MAX_SORT_CONDITION_COUNT)
    .map((sortCondition) => ({ ...sortCondition }))

  while (draftSortConditions.length < MAX_SORT_CONDITION_COUNT) {
    draftSortConditions.push(createEmptyDraftSortCondition())
  }

  return draftSortConditions
}

/**
 * 下書きソート条件から適用可能な条件だけを優先順に取り出す。
 *
 * @param draftSortConditions - ダイアログで編集したソート下書き。
 * @returns 重複列を除外した適用用ソート条件。
 */
const compactDraftSortConditions = (
  draftSortConditions: DraftSortCondition[]
): RecordSortCondition[] => {
  const usedKeys = new Set<RecordSortKey>()
  const sortConditions: RecordSortCondition[] = []

  for (const draftSortCondition of draftSortConditions) {
    if (!draftSortCondition.key || usedKeys.has(draftSortCondition.key)) {
      continue
    }

    usedKeys.add(draftSortCondition.key)
    sortConditions.push({
      key: draftSortCondition.key,
      direction: draftSortCondition.direction,
    })
  }

  return sortConditions
}

/**
 * ソートキーに対応する列選択肢を取得する。
 *
 * @param key - ソートキー。
 * @returns 対応する列選択肢。未指定の場合は null。
 */
const getSortColumnOption = (key: RecordSortKey | null): SortColumnOption | null =>
  SORT_COLUMN_OPTIONS.find((option) => option.value === key) ?? null

/**
 * ソート方向に対応する選択肢を取得する。
 *
 * @param direction - ソート方向。
 * @returns 対応する方向選択肢。
 */
const getSortDirectionOption = (direction: SortDirection): SortDirectionOption =>
  SORT_DIRECTION_OPTIONS.find((option) => option.value === direction) ?? SORT_DIRECTION_OPTIONS[0]

/**
 * 通常レコード一覧の高度ソート条件を編集するダイアログを表示する。
 *
 * @param props - 開閉状態、適用済みソート条件、開閉・適用ハンドラー。
 * @returns 高度ソート条件を編集するダイアログUI。
 */
const AdvancedSortDialog: Component<AdvancedSortDialogProps> = (props) => {
  const [draftSortConditions, setDraftSortConditions] = createSignal<DraftSortCondition[]>(
    toDraftSortConditions(props.sortConditions)
  )
  let wasOpen = false

  createEffect(() => {
    if (props.open && !wasOpen) {
      setDraftSortConditions(toDraftSortConditions(props.sortConditions))
    }
    wasOpen = props.open
  })

  /**
   * 指定行のソート列を更新する。
   *
   * @param rowIndex - 更新対象の行番号。
   * @param key - 次に指定するソートキー。
   * @returns なし。
   */
  const updateDraftSortKey = (rowIndex: number, key: RecordSortKey | null): void => {
    setDraftSortConditions((currentDraftSortConditions) =>
      currentDraftSortConditions.map((draftSortCondition, index) => {
        if (index === rowIndex) {
          return { ...draftSortCondition, key }
        }

        if (key !== null && draftSortCondition.key === key) {
          return createEmptyDraftSortCondition()
        }

        return draftSortCondition
      })
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
   * 指定行のソート条件を解除する。
   *
   * @param rowIndex - 解除対象の行番号。
   * @returns なし。
   */
  const clearDraftSortCondition = (rowIndex: number): void => {
    setDraftSortConditions((currentDraftSortConditions) =>
      currentDraftSortConditions.map((draftSortCondition, index) =>
        index === rowIndex ? createEmptyDraftSortCondition() : draftSortCondition
      )
    )
  }

  /**
   * 下書き中のソート条件を一覧へ適用する。
   *
   * @returns なし。
   */
  const applySortConditions = (): void => {
    props.onApply(compactDraftSortConditions(draftSortConditions()))
    props.onOpenChange(false)
  }

  /**
   * すべてのソート条件を解除して一覧へ適用する。
   *
   * @returns なし。
   */
  const clearSortConditions = (): void => {
    const emptyDraftSortConditions = toDraftSortConditions([])
    setDraftSortConditions(emptyDraftSortConditions)
    props.onApply([])
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed inset-x-4 top-1/2 z-50 flex max-h-[80dvh] -translate-y-1/2 flex-col rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:w-[90vw] sm:max-w-xl sm:-translate-x-1/2 sm:p-6">
          <div class="mb-4 flex shrink-0 items-center justify-between gap-3">
            <Dialog.Title class="text-lg font-bold">ソート</Dialog.Title>
            <Button
              type="button"
              class={ADVANCED_SORT_DIALOG_BUTTON_CLASS.secondary}
              onClick={clearSortConditions}
            >
              解除
            </Button>
          </div>

          <div class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
            <For each={SORT_CONDITION_INDICES}>
              {(rowIndex) => {
                const draftSortCondition = () => draftSortConditions()[rowIndex]
                const selectedKey = () => draftSortCondition()?.key ?? null
                const selectedDirection = () => draftSortCondition()?.direction ?? 'asc'

                return (
                  <div class="flex flex-wrap items-end gap-2">
                    <span class="w-[4.5rem] pb-2 text-sm font-medium">第{rowIndex + 1}ソート</span>
                    <div class="min-w-[9rem] flex-1">
                      <Select<SortColumnOption>
                        options={SORT_COLUMN_OPTIONS}
                        optionValue="value"
                        optionTextValue="label"
                        value={getSortColumnOption(selectedKey())}
                        onChange={(option) => updateDraftSortKey(rowIndex, option?.value ?? null)}
                        placeholder="列を選択"
                        gutter={0}
                        itemComponent={(itemProps) => (
                          <Select.Item
                            item={itemProps.item}
                            class={FILTER_DIALOG_SELECT_ITEM_CLASS}
                          >
                            <Select.ItemLabel>{itemProps.item.rawValue.label}</Select.ItemLabel>
                            <Select.ItemIndicator class="indicator h-5 w-5 inline-flex items-center justify-center">
                              <Check class="h-4 w-4" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        )}
                      >
                        <Select.Label class="sr-only">第{rowIndex + 1}ソート 列</Select.Label>
                        <Select.Trigger class={FILTER_DIALOG_SELECT_TRIGGER_CLASS}>
                          <Select.Value<SortColumnOption> class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-text-placeholder">
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

                    <div class="w-[6.5rem]">
                      <Select<SortDirectionOption>
                        options={SORT_DIRECTION_OPTIONS}
                        optionValue="value"
                        optionTextValue="label"
                        value={getSortDirectionOption(selectedDirection())}
                        onChange={(option) => {
                          if (option) updateDraftSortDirection(rowIndex, option.value)
                        }}
                        disabled={selectedKey() === null}
                        gutter={0}
                        itemComponent={(itemProps) => (
                          <Select.Item
                            item={itemProps.item}
                            class={FILTER_DIALOG_SELECT_ITEM_CLASS}
                          >
                            <Select.ItemLabel>{itemProps.item.rawValue.label}</Select.ItemLabel>
                            <Select.ItemIndicator class="indicator h-5 w-5 inline-flex items-center justify-center">
                              <Check class="h-4 w-4" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        )}
                      >
                        <Select.Label class="sr-only">第{rowIndex + 1}ソート 方向</Select.Label>
                        <Select.Trigger
                          class={`${FILTER_DIALOG_SELECT_TRIGGER_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          <Select.Value<SortDirectionOption> class="overflow-hidden text-ellipsis whitespace-nowrap data-placeholder-shown:text-text-placeholder">
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

                    <Button
                      type="button"
                      class="flex h-9.5 w-9.5 items-center justify-center rounded border border-border-strong text-text-muted hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`第${rowIndex + 1}ソートを解除`}
                      title={`第${rowIndex + 1}ソートを解除`}
                      disabled={selectedKey() === null}
                      onClick={() => clearDraftSortCondition(rowIndex)}
                    >
                      <CircleSlash2 size={20} aria-hidden="true" />
                    </Button>
                  </div>
                )
              }}
            </For>
          </div>

          <div class="mt-6 flex shrink-0 justify-end gap-2">
            <Dialog.CloseButton class={ADVANCED_SORT_DIALOG_BUTTON_CLASS.secondary}>
              閉じる
            </Dialog.CloseButton>
            <Button
              type="button"
              class={ADVANCED_SORT_DIALOG_BUTTON_CLASS.primary}
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

export default AdvancedSortDialog

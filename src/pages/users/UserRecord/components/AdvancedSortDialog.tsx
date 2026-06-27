import { Button } from '@kobalte/core/button'
import { Dialog } from '@kobalte/core/dialog'
import { Select } from '@kobalte/core/select'
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Check, ChevronDown } from 'lucide-solid'
import { type Component, createEffect, createSignal, For } from 'solid-js'
import type { RecordSortCondition, RecordSortKey, SortDirection } from '../types/types'
import { RECORD_COLUMN_DEFINITIONS } from '../utils/columns'
import { DEFAULT_RECORD_SORT_CONDITIONS, normalizeRecordSortConditions } from '../utils/sorting'
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
  key: RecordSortKey
  direction: SortDirection
}

type SortColumnOption = {
  value: RecordSortKey
  label: string
}

/** 高度ソートで指定できる最大条件数。 */
const MAX_SORT_CONDITION_COUNT = 4

/** 曲名固定にするソート行の番号。 */
const FIXED_TITLE_SORT_INDEX = MAX_SORT_CONDITION_COUNT - 1

/** ソート指定行の番号。 */
const SORT_CONDITION_INDICES = Array.from({ length: MAX_SORT_CONDITION_COUNT }, (_, index) => index)

/** ソート列の選択肢。 */
const SORT_COLUMN_OPTIONS: SortColumnOption[] = RECORD_COLUMN_DEFINITIONS.map((definition) => ({
  value: definition.sortKey,
  label: definition.label,
}))

/** 高度ソートダイアログの操作ボタンで使う Tailwind クラス。 */
const ADVANCED_SORT_DIALOG_BUTTON_CLASS = {
  secondary:
    'rounded bg-action-secondary px-4 py-2 text-sm text-text-muted hover:bg-action-secondary-hover',
  primary:
    'rounded bg-action-primary px-4 py-2 text-sm text-text-inverse hover:bg-action-primary-hover',
} as const

/**
 * 適用済みソート条件を4行分の下書きに変換する。
 *
 * @param sortConditions - 適用済みのソート条件。
 * @returns ダイアログで編集する4行分の下書き。
 */
const toDraftSortConditions = (sortConditions: RecordSortCondition[]): DraftSortCondition[] => {
  return normalizeRecordSortConditions(sortConditions)
}

/**
 * 下書きソート条件から4件の適用用ソート条件を取り出す。
 *
 * @param draftSortConditions - ダイアログで編集したソート下書き。
 * @returns 重複を維持した適用用ソート条件。
 */
const toAppliedSortConditions = (
  draftSortConditions: DraftSortCondition[]
): RecordSortCondition[] => normalizeRecordSortConditions(draftSortConditions)

/**
 * ソートキーに対応する列選択肢を取得する。
 *
 * @param key - ソートキー。
 * @returns 対応する列選択肢。
 */
const getSortColumnOption = (key: RecordSortKey): SortColumnOption =>
  SORT_COLUMN_OPTIONS.find((option) => option.value === key) ?? SORT_COLUMN_OPTIONS[0]

/**
 * ソート方向の表示名を取得する。
 *
 * @param direction - ソート方向。
 * @returns 方向の表示名。
 */
const getSortDirectionLabel = (direction: SortDirection): string =>
  direction === 'asc' ? '昇順' : '降順'

/**
 * 次のソート方向を取得する。
 *
 * @param direction - 現在のソート方向。
 * @returns 切り替え後のソート方向。
 */
const nextSortDirection = (direction: SortDirection): SortDirection =>
  direction === 'asc' ? 'desc' : 'asc'

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
  const updateDraftSortKey = (rowIndex: number, key: RecordSortKey): void => {
    setDraftSortConditions((currentDraftSortConditions) =>
      currentDraftSortConditions.map((draftSortCondition, index) =>
        index === rowIndex ? { ...draftSortCondition, key } : draftSortCondition
      )
    )
  }

  /**
   * 指定行のソート方向を昇順・降順で切り替える。
   *
   * @param rowIndex - 更新対象の行番号。
   * @returns なし。
   */
  const toggleDraftSortDirection = (rowIndex: number): void => {
    setDraftSortConditions((currentDraftSortConditions) =>
      currentDraftSortConditions.map((draftSortCondition, index) =>
        index === rowIndex
          ? { ...draftSortCondition, direction: nextSortDirection(draftSortCondition.direction) }
          : draftSortCondition
      )
    )
  }

  /**
   * 下書き中のソート条件を一覧へ適用する。
   *
   * @returns なし。
   */
  const applySortConditions = (): void => {
    props.onApply(toAppliedSortConditions(draftSortConditions()))
    props.onOpenChange(false)
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed inset-x-4 top-1/2 z-50 flex max-h-[80dvh] -translate-y-1/2 flex-col rounded-lg bg-surface p-4 shadow-lg sm:left-1/2 sm:right-auto sm:w-[90vw] sm:max-w-xl sm:-translate-x-1/2 sm:p-6">
          <div class="mb-4 shrink-0">
            <Dialog.Title class="text-lg font-bold">ソート</Dialog.Title>
          </div>

          <div class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-sm">
            <For each={SORT_CONDITION_INDICES}>
              {(rowIndex) => {
                const draftSortCondition = () => draftSortConditions()[rowIndex]
                const selectedKey = () =>
                  draftSortCondition()?.key ?? DEFAULT_RECORD_SORT_CONDITIONS[rowIndex].key
                const selectedDirection = () => draftSortCondition()?.direction ?? 'asc'
                const isFixedTitleSort = () => rowIndex === FIXED_TITLE_SORT_INDEX
                const sortLabel = () =>
                  isFixedTitleSort()
                    ? `第${rowIndex + 1}ソート(項目固定)`
                    : `第${rowIndex + 1}ソート`
                const nextDirectionLabel = () =>
                  getSortDirectionLabel(nextSortDirection(selectedDirection()))

                return (
                  <div class="space-y-1">
                    <span class="block text-sm">{sortLabel()}</span>
                    <div class="flex items-center gap-2">
                      <div class="min-w-0 flex-1">
                        <Select<SortColumnOption>
                          options={SORT_COLUMN_OPTIONS}
                          optionValue="value"
                          optionTextValue="label"
                          value={getSortColumnOption(selectedKey())}
                          onChange={(option) => {
                            if (option) updateDraftSortKey(rowIndex, option.value)
                          }}
                          disabled={isFixedTitleSort()}
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
                          <Select.Trigger
                            class={`${FILTER_DIALOG_SELECT_TRIGGER_CLASS} disabled:cursor-not-allowed disabled:opacity-60`}
                          >
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
                      <Button
                        type="button"
                        class="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded border border-border-strong text-text-muted transition-colors hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        aria-label={`${sortLabel()}を${nextDirectionLabel()}にする`}
                        title={`${getSortDirectionLabel(selectedDirection())}。クリックで${nextDirectionLabel()}に切り替え`}
                        onClick={() => toggleDraftSortDirection(rowIndex)}
                      >
                        {selectedDirection() === 'asc' ? (
                          <ArrowUpNarrowWide size={22} aria-hidden="true" />
                        ) : (
                          <ArrowDownWideNarrow size={22} aria-hidden="true" />
                        )}
                      </Button>
                    </div>
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

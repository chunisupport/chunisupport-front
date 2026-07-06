import { Dialog } from '@kobalte/core/dialog'
import { createEffect, createMemo, createSignal } from 'solid-js'
import { AppButton } from '../../../components/common/AppButton'
import {
  AppMultiSelect,
  type AppMultiSelectOption,
} from '../../../components/common/AppMultiSelect'
import type { ColumnDefinitionBase } from '../utils/recordTableColumns'

const COLUMN_SETTINGS_TITLE = '列設定'
const COLUMN_SETTINGS_DESCRIPTION = '表示する列を選択してください（1列以上必須）'
const COLUMN_SETTINGS_PLACEHOLDER = '表示列を選択'
const CANCEL_LABEL = 'キャンセル'
const APPLY_LABEL = '適用'

type ColumnSettingsDialogBaseProps<TColumnId extends string, TSortKey extends string> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  visibleColumnIds: TColumnId[]
  columnDefinitions: ColumnDefinitionBase<TColumnId, TSortKey>[]
  sortVisibleColumnIdsByDefinitionOrder: (visibleColumnIds: TColumnId[]) => TColumnId[]
  onApply: (visibleColumnIds: TColumnId[]) => void
}

/**
 * 列定義から列設定で使う選択肢を生成する。
 *
 * @param columnDefinitions - 表示対象の列定義配列。
 * @returns AppMultiSelect に渡す列選択肢配列。
 */
const createColumnOptions = <TColumnId extends string, TSortKey extends string>(
  columnDefinitions: ColumnDefinitionBase<TColumnId, TSortKey>[]
): AppMultiSelectOption<TColumnId>[] =>
  columnDefinitions.map((column) => ({
    value: column.id,
    label: column.label,
  }))

/**
 * standard と WORLD'S END で共通利用する列設定ダイアログを表示する。
 *
 * @param props - 開閉状態、列定義、表示列ID、適用時のコールバック。
 * @returns 列の表示状態を変更するダイアログUI。
 */
const ColumnSettingsDialogBase = <TColumnId extends string, TSortKey extends string>(
  props: ColumnSettingsDialogBaseProps<TColumnId, TSortKey>
) => {
  const columnOptions = createMemo(() => createColumnOptions(props.columnDefinitions))
  const [selectedColumnIds, setSelectedColumnIds] = createSignal<TColumnId[]>(
    props.visibleColumnIds
  )

  createEffect(() => {
    if (props.open) {
      setSelectedColumnIds(props.visibleColumnIds)
    }
  })

  /**
   * 列選択を定義順へ整えて一時状態へ反映する。
   *
   * @param columnIds - AppMultiSelect から受け取った選択済み列ID。
   * @returns なし。
   */
  const handleChange = (columnIds: TColumnId[]) => {
    setSelectedColumnIds(props.sortVisibleColumnIdsByDefinitionOrder(columnIds))
  }

  /**
   * 一時選択中の表示列を適用してダイアログを閉じる。
   *
   * @returns なし。
   */
  const handleApply = () => {
    if (selectedColumnIds().length === 0) {
      return
    }

    props.onApply(selectedColumnIds())
    props.onOpenChange(false)
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange} preventScroll={false}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-overlay" />
        <Dialog.Content class="fixed z-50 left-1/2 top-1/2 max-h-[90vh] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-surface p-6 shadow-lg">
          <Dialog.Title class="mb-4 text-lg font-bold">{COLUMN_SETTINGS_TITLE}</Dialog.Title>
          <p class="mb-3 text-xs text-text-subtle">{COLUMN_SETTINGS_DESCRIPTION}</p>

          <AppMultiSelect<TColumnId>
            options={columnOptions()}
            selected={selectedColumnIds()}
            onChange={handleChange}
            placeholder={COLUMN_SETTINGS_PLACEHOLDER}
            contentZIndexClass="z-50"
          />

          <div class="mt-6 flex justify-end gap-2">
            <AppButton onClick={() => props.onOpenChange(false)}>{CANCEL_LABEL}</AppButton>
            <AppButton
              variant="primary"
              onClick={handleApply}
              disabled={selectedColumnIds().length === 0}
            >
              {APPLY_LABEL}
            </AppButton>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

export default ColumnSettingsDialogBase

import type { JSX } from 'solid-js'
import { createMemo, For, Show } from 'solid-js'
import {
  type ColumnRenderer,
  RECORD_ROW_HEIGHT,
  RECORD_ROW_HOVER_CLASS,
  RecordHeaderButton,
} from '../../../components/common/record/RecordDisplayParts'
import { createGridTemplateColumns } from '../utils/recordColumnDefinitions'
import type { ColumnDefinitionBase } from '../utils/recordTableColumns'
import { createRecordTableVirtualizer } from './createRecordTableVirtualizer'

type SortDirection = 'asc' | 'desc' | null

type RecordDataTableProps<TRecord, TColumnId extends string, TSortKey extends string> = {
  /** 表示するレコード配列。 */
  records: TRecord[]
  /** 表示対象の列定義。 */
  columns: ColumnDefinitionBase<TColumnId, TSortKey>[]
  /** 現在第1ソートに指定されているキー。 */
  sortKey: TSortKey | null
  /** 現在第1ソートに指定されている方向。 */
  sortDirection: SortDirection
  /** データが空のときに表示する文言。 */
  emptyMessage: string
  /** テーブル外枠に適用するクラス。 */
  wrapperClass?: string
  /** 仮想スクロール位置の再計算トリガー。 */
  resetDeps?: unknown
  /** 列IDからセルレンダラーを取得する処理。 */
  getColumnRenderer: (columnId: TColumnId) => ColumnRenderer<TRecord>
  /** ヘッダークリック時にソートキーを通知する処理。 */
  onSortChange: (key: TSortKey) => void
  /** 行番号ごとの追加クラスを返す処理。 */
  getRowClass?: (rowIndex: number) => string
}

/**
 * レコード配列を仮想スクロール付きのデータテーブルとして表示する。
 *
 * @template TRecord - 1行分のレコード型。
 * @template TColumnId - 表示列IDの型。
 * @template TSortKey - ソートキーの型。
 * @param props - レコード、列定義、ソート状態、セル描画処理を含む表示設定。
 * @returns レコードテーブルまたは空状態メッセージ。
 */
export function RecordDataTable<TRecord, TColumnId extends string, TSortKey extends string>(
  props: RecordDataTableProps<TRecord, TColumnId, TSortKey>
): JSX.Element {
  let tableContainerRef: HTMLDivElement | undefined
  let tableBodyRef: HTMLDivElement | undefined

  const virtualizedTable = createRecordTableVirtualizer({
    rowHeight: RECORD_ROW_HEIGHT,
    rowCount: () => props.records.length,
    containerRef: () => tableContainerRef,
    bodyRef: () => tableBodyRef,
    resetDeps: () => props.resetDeps,
  })

  const gridTemplateColumns = createMemo(() => createGridTemplateColumns(props.columns))
  const getRowClass = (rowIndex: number): string =>
    props.getRowClass?.(rowIndex) ?? RECORD_ROW_HOVER_CLASS

  return (
    <div class={props.wrapperClass ?? 'w-full'}>
      <Show
        when={props.records.length > 0}
        fallback={<p class="py-6 text-center text-text-subtle">{props.emptyMessage}</p>}
      >
        <div
          ref={tableContainerRef}
          class="select-none overflow-x-auto overflow-y-hidden rounded-md border border-border"
        >
          <div class="w-fit min-w-full">
            <div class="border-b border-border bg-surface-muted">
              <div
                class="grid px-2 text-xs font-semibold"
                style={{ 'grid-template-columns': gridTemplateColumns() }}
              >
                <For each={props.columns}>
                  {(column) => (
                    <RecordHeaderButton
                      label={column.label}
                      active={props.sortKey === column.sortKey}
                      direction={props.sortDirection}
                      align={column.align ?? 'center'}
                      class={column.align === 'start' ? 'justify-start' : 'justify-center'}
                      onClick={() => props.onSortChange(column.sortKey)}
                    />
                  )}
                </For>
              </div>
            </div>

            <div
              ref={tableBodyRef}
              class="relative"
              style={{ height: `${virtualizedTable.getTotalSize()}px` }}
            >
              <For each={virtualizedTable.virtualRows()}>
                {(virtualRow) => {
                  const record = createMemo(() => props.records[virtualRow.index])

                  return (
                    <Show when={record()} keyed>
                      {(currentRecord) => (
                        <div
                          class={`absolute left-0 top-0 grid w-full border-b border-border px-2 text-xs ${getRowClass(virtualRow.index)}`}
                          style={{
                            'grid-template-columns': gridTemplateColumns(),
                            transform: `translateY(${virtualRow.start - virtualizedTable.scrollMargin()}px)`,
                          }}
                        >
                          <For each={props.columns}>
                            {(column) => props.getColumnRenderer(column.id)(currentRecord)}
                          </For>
                        </div>
                      )}
                    </Show>
                  )
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default RecordDataTable

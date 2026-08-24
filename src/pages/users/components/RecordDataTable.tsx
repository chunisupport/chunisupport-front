import type { JSX } from 'solid-js'
import { createMemo, For, Show } from 'solid-js'
import { createWindowVirtualTable } from '../../../components/common/createWindowVirtualTable'
import {
  type ColumnRenderer,
  RECORD_ROW_HEIGHT,
  RECORD_ROW_HOVER_CLASS,
  RECORD_ROW_HOVER_WITH_TOP_BORDER_CLASS,
  RecordHeaderButton,
} from '../../../components/common/record/RecordDisplayParts'
import {
  getSortAriaValue,
  type SortDirection,
} from '../../../components/common/SortableTableHeader'
import { createGridTemplateColumns } from '../utils/recordColumnDefinitions'
import type { ColumnDefinitionBase } from '../utils/recordTableColumns'

type RecordDataTableProps<TRecord, TColumnId extends string, TSortKey extends string> = {
  /** 表示するレコード配列 */
  records: TRecord[]
  /** 表示対象の列定義 */
  columns: ColumnDefinitionBase<TColumnId, TSortKey>[]
  /** 現在第1ソートに指定されているキー */
  sortKey: TSortKey | null
  /** 現在第1ソートに指定されている方向 */
  sortDirection: SortDirection
  /** データが空のときに表示する文言 */
  emptyMessage: string
  /** 支援技術へ伝えるレコード表の名前 */
  ariaLabel?: string
  /** テーブル外枠に適用するクラス */
  wrapperClass?: string
  /** 仮想スクロール位置の再計算トリガー */
  resetDeps?: unknown
  /** 列IDからセルレンダラーを取得する処理 */
  getColumnRenderer: (columnId: TColumnId) => ColumnRenderer<TRecord>
  /** ヘッダークリック時にソートキーを通知する処理 */
  onSortChange: (key: TSortKey) => void
}

/** 共通レコード表の既定アクセシブル名 */
const DEFAULT_RECORD_TABLE_ARIA_LABEL = 'レコード一覧'

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
  const virtualizedTable = createWindowVirtualTable<HTMLDivElement, HTMLDivElement>({
    rowHeight: RECORD_ROW_HEIGHT,
    rowCount: () => props.records.length,
    resetOnRowCountChange: true,
    layoutDeps: () => props.resetDeps,
  })

  const gridTemplateColumns = createMemo(() => createGridTemplateColumns(props.columns))
  /**
   * 行番号に応じた背景と補助線のクラスを返す。
   *
   * @param rowIndex - 0始まりのレコード行番号。
   * @returns 共通のレコード行クラス。
   */
  const getRowClass = (rowIndex: number): string =>
    rowIndex === 0 ? RECORD_ROW_HOVER_CLASS : RECORD_ROW_HOVER_WITH_TOP_BORDER_CLASS

  return (
    <div class={props.wrapperClass ?? 'w-full'}>
      <Show
        when={props.records.length > 0}
        fallback={<p class="py-6 text-center text-text-subtle">{props.emptyMessage}</p>}
      >
        {/* biome-ignore lint/a11y/useSemanticElements: 仮想スクロール表はtable要素へ置換できないためARIA tableを使う。 */}
        <div
          ref={virtualizedTable.setTableContainerRef}
          class="select-none overflow-x-auto overflow-y-hidden rounded-md border border-border bg-surface"
          role="table"
          aria-label={props.ariaLabel ?? DEFAULT_RECORD_TABLE_ARIA_LABEL}
          aria-rowcount={props.records.length + 1}
          aria-colcount={props.columns.length}
        >
          <div class="w-fit min-w-full" role="presentation">
            {/* biome-ignore lint/a11y/useSemanticElements: 仮想スクロール表のヘッダーグループとしてARIA roleを使う。 */}
            <div class="border-b border-border bg-surface-muted" role="rowgroup">
              {/* biome-ignore lint/a11y/useFocusableInteractive lint/a11y/useSemanticElements: div gridの仮想テーブルなのでtrへ置換できない。 */}
              <div
                class="grid px-2 text-xs font-semibold"
                style={{ 'grid-template-columns': gridTemplateColumns() }}
                role="row"
                aria-rowindex={1}
              >
                <For each={props.columns}>
                  {(column, columnIndex) => (
                    // biome-ignore lint/a11y/useFocusableInteractive lint/a11y/useSemanticElements: div gridの仮想テーブルなのでthへ置換できない。
                    <div
                      role="columnheader"
                      aria-colindex={columnIndex() + 1}
                      aria-sort={getSortAriaValue(
                        props.sortKey === column.sortKey,
                        props.sortDirection
                      )}
                    >
                      <RecordHeaderButton
                        label={column.label}
                        active={props.sortKey === column.sortKey}
                        direction={props.sortDirection}
                        align={column.align ?? 'center'}
                        class={column.align === 'start' ? 'justify-start' : 'justify-center'}
                        onClick={() => props.onSortChange(column.sortKey)}
                      />
                    </div>
                  )}
                </For>
              </div>
            </div>

            {/* biome-ignore lint/a11y/useSemanticElements: 仮想行の絶対配置を維持するためtbodyへ置換できない。 */}
            <div
              ref={virtualizedTable.setTableBodyRef}
              class="relative"
              style={{ height: `${virtualizedTable.getTotalSize()}px` }}
              role="rowgroup"
            >
              <For each={virtualizedTable.virtualRows()}>
                {(virtualRow) => {
                  const record = createMemo(() => props.records[virtualRow.index])

                  return (
                    <Show when={record()} keyed>
                      {(currentRecord) => (
                        // biome-ignore lint/a11y/useFocusableInteractive lint/a11y/useSemanticElements: div gridの仮想テーブルなのでtrへ置換できない。
                        <div
                          class={`absolute left-0 top-0 grid w-full px-2 text-xs ${getRowClass(virtualRow.index)}`}
                          style={{
                            'grid-template-columns': gridTemplateColumns(),
                            transform: `translateY(${virtualRow.start - virtualizedTable.scrollMargin()}px)`,
                          }}
                          role="row"
                          aria-rowindex={virtualRow.index + 2}
                        >
                          <For each={props.columns}>
                            {(column, columnIndex) => (
                              // biome-ignore lint/a11y/useSemanticElements: 共通セル描画を保持する仮想テーブルなのでtdへ置換できない。
                              <div class="min-w-0" role="cell" aria-colindex={columnIndex() + 1}>
                                {props.getColumnRenderer(column.id)(currentRecord)}
                              </div>
                            )}
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

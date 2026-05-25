import { type Component, createMemo, For, Show } from 'solid-js'
import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger'
import { createRecordTableVirtualizer } from '../../components/createRecordTableVirtualizer'
import {
  RECORD_ROW_HEIGHT,
  RECORD_ROW_HOVER_CLASS,
  RECORD_ROW_HOVER_WITH_TOP_BORDER_CLASS,
  RecordHeaderButton,
} from '../../components/SharedRecordTableColumns'
import type { RecordColumnId, RecordSortKey, SortDirection } from '../types/types'
import { getRecordColumnRenderer } from '../utils/columnRenderers'
import { createGridTemplateColumns, getVisibleColumns } from '../utils/columns'

interface RecordTableProps {
  records: PlayerRecordWithSongMeta[]
  statsOpen: boolean
  sortKey: RecordSortKey | null
  sortDirection: SortDirection | null
  visibleColumnIds: RecordColumnId[]
  onSortChange: (key: RecordSortKey) => void
}

/**
 * ユーザーレコードを仮想スクロール付きの一覧表として表示する。
 * @param props - 表示対象レコード、表示列、ソート状態、ソート変更ハンドラ。
 * @returns レコード表または空状態メッセージを表すJSX要素。
 */
export const RecordTable: Component<RecordTableProps> = (props) => {
  let tableContainerRef: HTMLDivElement | undefined
  let tableBodyRef: HTMLDivElement | undefined

  const virtualizedTable = createRecordTableVirtualizer({
    rowHeight: RECORD_ROW_HEIGHT,
    rowCount: () => props.records.length,
    containerRef: () => tableContainerRef,
    bodyRef: () => tableBodyRef,
    resetDeps: () => props.statsOpen,
  })

  const visibleColumns = createMemo(() => getVisibleColumns(props.visibleColumnIds))
  const gridTemplateColumns = createMemo(() => createGridTemplateColumns(visibleColumns()))

  return (
    <div class="w-full">
      <Show
        when={props.records.length > 0}
        fallback={<p class="py-6 text-center text-text-subtle">データがありません</p>}
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
                <For each={visibleColumns()}>
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
                  const rowHoverClass =
                    virtualRow.index === 0
                      ? RECORD_ROW_HOVER_CLASS
                      : RECORD_ROW_HOVER_WITH_TOP_BORDER_CLASS

                  return (
                    <Show when={record()} keyed>
                      {(currentRecord) => (
                        <div
                          class={`absolute left-0 top-0 grid w-full border-b border-border px-2 text-xs ${rowHoverClass}`}
                          style={{
                            'grid-template-columns': gridTemplateColumns(),
                            transform: `translateY(${virtualRow.start - virtualizedTable.scrollMargin()}px)`,
                          }}
                        >
                          <For each={visibleColumns()}>
                            {(column) => getRecordColumnRenderer(column.id)(currentRecord)}
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

export default RecordTable

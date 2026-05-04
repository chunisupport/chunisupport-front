import { createVirtualizer } from '@tanstack/solid-virtual'
import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger'
import {
  RECORD_ROW_HOVER_CLASS,
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

const ROW_HEIGHT = 34
export const RecordTable: Component<RecordTableProps> = (props) => {
  let tableContainerRef: HTMLDivElement | undefined
  let tableBodyRef: HTMLDivElement | undefined
  let layoutResizeObserver: ResizeObserver | undefined
  const getScrollElement = () => document.getElementById('app-main') as HTMLDivElement | null

  const [scrollMargin, setScrollMargin] = createSignal(0)

  const rowVirtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
    get count() {
      return props.records.length
    },
    getScrollElement,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    get scrollMargin() {
      return scrollMargin()
    },
  })

  const updateScrollMargin = () => {
    const scrollElement = getScrollElement()
    const tableBodyElement = tableBodyRef
    if (!scrollElement || !tableBodyElement) return

    const scrollRect = scrollElement.getBoundingClientRect()
    const tableBodyRect = tableBodyElement.getBoundingClientRect()
    const next = tableBodyRect.top - scrollRect.top + scrollElement.scrollTop
    if (Math.abs(next - scrollMargin()) >= 1) {
      setScrollMargin(next)
    }
  }

  onMount(() => {
    updateScrollMargin()

    // レイアウト変化で本文開始位置が変わるため、親要素とスクロール要素を監視する
    if (tableContainerRef && typeof ResizeObserver !== 'undefined') {
      layoutResizeObserver = new ResizeObserver(() => {
        queueMicrotask(updateScrollMargin)
      })

      layoutResizeObserver.observe(tableContainerRef)

      const scrollElement = getScrollElement()
      if (scrollElement) {
        layoutResizeObserver.observe(scrollElement)
      }
    }

    window.addEventListener('resize', updateScrollMargin)
  })

  onCleanup(() => {
    layoutResizeObserver?.disconnect()
    window.removeEventListener('resize', updateScrollMargin)
  })

  createEffect(() => {
    props.records.length
    queueMicrotask(() => {
      updateScrollMargin()
      rowVirtualizer.scrollToIndex(0)
    })
  })

  createEffect(() => {
    props.statsOpen

    // 統計表示の開閉でレイアウトが動くため、次フレームでも再計測する
    queueMicrotask(updateScrollMargin)
    requestAnimationFrame(() => {
      updateScrollMargin()
    })
  })

  const virtualRows = createMemo(() =>
    rowVirtualizer.getVirtualItems().filter((virtualRow) => virtualRow.index < props.records.length)
  )
  const visibleColumns = createMemo(() => getVisibleColumns(props.visibleColumnIds))
  const gridTemplateColumns = createMemo(() => createGridTemplateColumns(visibleColumns()))

  return (
    <div class="w-full">
      <Show
        when={props.records.length > 0}
        fallback={<p class="py-6 text-center text-gray-400">データがありません</p>}
      >
        <div
          ref={tableContainerRef}
          class="select-none overflow-x-auto overflow-y-hidden rounded-md border border-gray-200"
        >
          <div class="w-fit min-w-full">
            <div class="border-b border-gray-200 bg-white">
              <div
                class="grid text-xs font-semibold"
                style={{ 'grid-template-columns': gridTemplateColumns() }}
              >
                <For each={visibleColumns()}>
                  {(column) => (
                    <RecordHeaderButton
                      label={column.label}
                      active={props.sortKey === column.sortKey}
                      direction={props.sortDirection}
                      align={column.align ?? 'center'}
                      class={`${column.align === 'start' ? 'justify-start pl-2' : 'justify-center'} ${column.id === 'updatedAt' ? 'pr-2' : ''}`}
                      onClick={() => props.onSortChange(column.sortKey)}
                    />
                  )}
                </For>
              </div>
            </div>

            <div
              ref={tableBodyRef}
              class="relative"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              <For each={virtualRows()}>
                {(virtualRow) => {
                  const record = createMemo(() => props.records[virtualRow.index])

                  return (
                    <Show when={record()} keyed>
                      {(currentRecord) => (
                        <div
                          class={`absolute left-0 top-0 grid w-full border-b border-gray-200 text-xs ${RECORD_ROW_HOVER_CLASS}`}
                          style={{
                            'grid-template-columns': gridTemplateColumns(),
                            transform: `translateY(${virtualRow.start - scrollMargin()}px)`,
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

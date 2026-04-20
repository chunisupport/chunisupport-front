import { A } from '@solidjs/router'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-solid'
import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  type JSX,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import {
  difficultyBadgeClass,
  difficultyShort,
  difficultyToQueryValue,
} from '../../../../utils/difficultyUtils'
import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger'
import type { RecordColumnId, RecordSortKey, SortDirection } from '../types/types'
import { createGridTemplateColumns, getVisibleColumns } from '../utils/columns'
import { formatUpdatedAt } from '../utils/updatedAt'

interface RecordTableProps {
  records: PlayerRecordWithSongMeta[]
  statsOpen: boolean
  sortKey: RecordSortKey | null
  sortDirection: SortDirection | null
  visibleColumnIds: RecordColumnId[]
  onSortChange: (key: RecordSortKey) => void
}

const ROW_HEIGHT = 34
const HEADER_BUTTON_CLASS =
  'flex min-h-[34px] w-full items-center gap-1 text-center whitespace-nowrap transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset'
const SORT_ICON_CLASS = 'h-3 w-3 shrink-0'
const SORT_ICON_WRAPPER_CLASS = 'inline-flex h-3 w-3 shrink-0 items-center justify-center'
const DIFFICULTY_BADGE_CLASS =
  'inline-flex h-6 w-7 items-center justify-center rounded-lg px-1 text-sm font-bold leading-none'
const ALPHANUMERIC_COLUMN_CLASS = 'text-xs'
const DIFFICULTY_COLUMN_CLASS = 'font-oswald text-sm font-semibold'
const LAMP_COLUMN_CLASS = 'font-oswald text-sm font-semibold'
const assertNever = (value: never): never => {
  throw new Error(`Unhandled RecordColumnId: ${String(value)}`)
}

const lampBadge = (lamp: string | null) => {
  if (lamp === 'FULL COMBO')
    return (
      <span class="rounded-lg bg-orange-200 px-2 py-1 text-sm font-extrabold text-orange-900">
        FC
      </span>
    )
  if (lamp === 'ALL JUSTICE')
    return (
      <span class="rounded-lg bg-yellow-200 px-2 py-1 text-sm font-extrabold text-yellow-900">
        AJ
      </span>
    )
  return <span class="px-2 py-1 text-sm font-semibold">-</span>
}

const unplayedBadge = () => (
  <span class="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-400">NoPlay</span>
)

const sortIndicator = (active: boolean, direction: SortDirection | null) => {
  if (!active || !direction) {
    return (
      <span class={SORT_ICON_WRAPPER_CLASS} aria-hidden="true">
        <ArrowUpDown class={`${SORT_ICON_CLASS} text-gray-300`} />
      </span>
    )
  }

  return direction === 'asc' ? (
    <span class={SORT_ICON_WRAPPER_CLASS} aria-hidden="true">
      <ArrowUp class={`${SORT_ICON_CLASS} text-sky-600`} />
    </span>
  ) : (
    <span class={SORT_ICON_WRAPPER_CLASS} aria-hidden="true">
      <ArrowDown class={`${SORT_ICON_CLASS} text-sky-600`} />
    </span>
  )
}

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
  const renderCell = (
    columnId: RecordColumnId,
    currentRecord: PlayerRecordWithSongMeta
  ): JSX.Element | null => {
    switch (columnId) {
      case 'title':
        return (
          <div class="flex min-h-[34px] min-w-0 items-center" title={currentRecord.title}>
            <A
              href={`/songs/${encodeURIComponent(currentRecord.id)}?diff=${encodeURIComponent(difficultyToQueryValue(currentRecord.difficulty))}`}
              class="font-sans block pl-2 w-full truncate text-inherit hover:underline"
            >
              {currentRecord.title}
            </A>
          </div>
        )
      case 'difficulty':
        return (
          <div
            class={`flex min-h-[34px] items-center justify-center whitespace-nowrap ${DIFFICULTY_COLUMN_CLASS}`}
          >
            <span
              class={`${DIFFICULTY_BADGE_CLASS} ${difficultyBadgeClass(currentRecord.difficulty)}`}
            >
              {difficultyShort(currentRecord.difficulty)}
            </span>
          </div>
        )
      case 'const':
        return (
          <div
            class={`flex min-h-[34px] items-center justify-center text-center whitespace-nowrap ${ALPHANUMERIC_COLUMN_CLASS}`}
          >
            <span class="inline-block w-full text-center leading-none">
              {currentRecord.const.toFixed(1)}
            </span>
          </div>
        )
      case 'score':
        return (
          <div
            class={`flex min-h-[34px] items-center justify-center whitespace-nowrap ${ALPHANUMERIC_COLUMN_CLASS}`}
          >
            {!currentRecord.is_played ? unplayedBadge() : currentRecord.score.toLocaleString()}
          </div>
        )
      case 'rating':
        return (
          <div
            class={`flex min-h-[34px] items-center justify-center text-center whitespace-nowrap ${ALPHANUMERIC_COLUMN_CLASS}`}
          >
            <span class="inline-block w-full text-center leading-none">
              {!currentRecord.is_played ? '-' : currentRecord.rating.toFixed(2)}
            </span>
          </div>
        )
      case 'lamp':
        return (
          <div
            class={`flex min-h-[34px] items-center justify-center whitespace-nowrap ${LAMP_COLUMN_CLASS}`}
          >
            {!currentRecord.is_played ? (
              <span class="px-2 py-1 text-sm font-semibold">-</span>
            ) : (
              lampBadge(currentRecord.combo_lamp)
            )}
          </div>
        )
      case 'updatedAt':
        return (
          <div
            class={`flex min-h-[34px] items-center justify-center text-center whitespace-nowrap ${ALPHANUMERIC_COLUMN_CLASS}`}
          >
            <span class="inline-block w-full text-center leading-none">
              {formatUpdatedAt(currentRecord.updated_at)}
            </span>
          </div>
        )
      default:
        return assertNever(columnId)
    }
  }

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
          <div class="min-w-[35.35rem]">
            <div class="border-b border-gray-200 bg-white">
              <div
                class="grid pr-2 text-xs font-semibold"
                style={{ 'grid-template-columns': gridTemplateColumns() }}
              >
                <For each={visibleColumns()}>
                  {(column) => (
                    <button
                      type="button"
                      class={`${HEADER_BUTTON_CLASS} ${column.align === 'start' ? 'justify-start pl-2' : 'justify-center'}`}
                      onClick={() => props.onSortChange(column.sortKey)}
                    >
                      <span>{column.label}</span>
                      {sortIndicator(props.sortKey === column.sortKey, props.sortDirection)}
                    </button>
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
                    <Show when={record()}>
                      {(currentRecord) => (
                        <div
                          class="absolute left-0 top-0 grid w-full border-b border-gray-200 pr-2 text-xs hover:bg-gray-100"
                          style={{
                            'grid-template-columns': gridTemplateColumns(),
                            transform: `translateY(${virtualRow.start - scrollMargin()}px)`,
                          }}
                        >
                          <For each={visibleColumns()}>
                            {(column) => renderCell(column.id, currentRecord())}
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

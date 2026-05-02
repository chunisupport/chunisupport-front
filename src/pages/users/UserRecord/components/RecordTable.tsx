import { createVirtualizer } from '@tanstack/solid-virtual'
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
import {
  RECORD_ALPHANUMERIC_COLUMN_CLASS,
  RECORD_ROW_HOVER_CLASS,
  RecordHeaderButton,
  RecordLampCell,
  RecordScoreCell,
  RecordTitleCell,
  RecordUpdatedAtCell,
} from '../../components/SharedRecordTableColumns'
import type { RecordColumnId, RecordSortKey, SortDirection } from '../types/types'
import { createGridTemplateColumns, getVisibleColumns } from '../utils/columns'
import { getConstDisplay, getRatingDisplay } from '../utils/constDisplay'
import { calcJusticeCountForAj } from '../utils/justiceCount'
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
const DIFFICULTY_BADGE_CLASS =
  'inline-flex h-6 w-7 items-center justify-center rounded-lg px-1 text-sm font-bold leading-none'
const DIFFICULTY_COLUMN_CLASS = 'font-oswald text-sm font-semibold'
const assertNever = (value: never): never => {
  throw new Error(`Unhandled RecordColumnId: ${String(value)}`)
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
          <RecordTitleCell
            href={`/songs/${encodeURIComponent(currentRecord.id)}?diff=${encodeURIComponent(difficultyToQueryValue(currentRecord.difficulty))}`}
            title={currentRecord.title}
          />
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
      case 'const': {
        const constDisplay = getConstDisplay(currentRecord.const, currentRecord.is_const_unknown)

        return (
          <div
            class={`flex min-h-[34px] items-center justify-center text-center whitespace-nowrap ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}
          >
            <span class={`inline-block w-full text-center leading-none ${constDisplay.className}`}>
              {constDisplay.valueText}
              <Show when={constDisplay.markerText}>
                {(markerText) => <sup class="align-super text-[0.7em]">{markerText()}</sup>}
              </Show>
            </span>
          </div>
        )
      }
      case 'score':
        return <RecordScoreCell record={currentRecord} />
      case 'rating': {
        const ratingDisplay = getRatingDisplay(
          currentRecord.rating,
          currentRecord.is_played,
          currentRecord.is_const_unknown
        )

        return (
          <div
            class={`flex min-h-[34px] items-center justify-center text-center whitespace-nowrap ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}
          >
            <span class={`inline-block w-full text-center leading-none ${ratingDisplay.className}`}>
              {ratingDisplay.text}
            </span>
          </div>
        )
      }
      case 'lamp':
        return <RecordLampCell record={currentRecord} />

      case 'justiceCount': {
        const justiceCount = calcJusticeCountForAj({
          comboLamp: currentRecord.combo_lamp,
          score: currentRecord.score,
          notes: currentRecord.notes,
        })

        return (
          <div
            class={`flex min-h-[34px] items-center justify-end pr-1 text-right whitespace-nowrap ${RECORD_ALPHANUMERIC_COLUMN_CLASS}`}
          >
            <span class="inline-block w-full text-right leading-none">
              {justiceCount === '' ? '' : justiceCount}
            </span>
          </div>
        )
      }

      case 'updatedAt':
        return <RecordUpdatedAtCell record={currentRecord} formatUpdatedAt={formatUpdatedAt} />
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
                            {(column) => renderCell(column.id, currentRecord)}
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

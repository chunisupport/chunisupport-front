import { A } from '@solidjs/router'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-solid'
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
import {
  difficultyBadgeClass,
  difficultyShort,
  difficultyToQueryValue,
} from '../../../../utils/difficultyUtils'
import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger'
import { formatRecordAddedDate } from '../../UserPage/recordAddedDate'
import type { RecordSortKey, SortDirection } from '../types/types'

interface RecordTableProps {
  records: PlayerRecordWithSongMeta[]
  statsOpen: boolean
  sortKey: RecordSortKey | null
  sortDirection: SortDirection | null
  onSortChange: (key: RecordSortKey) => void
}

// 列幅は曲名以外は固定、曲名は残りスペースを全て使う
const GRID_COLUMNS = 'minmax(11.25rem,1fr) 2.5rem 3.1rem 3.6rem 3.5rem 3.5rem 3.6rem'

const ROW_HEIGHT = 34
const HEADER_BUTTON_CLASS =
  'flex min-h-[34px] w-full items-center justify-center gap-1 text-center whitespace-nowrap transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset'
const SORT_ICON_CLASS = 'h-3 w-3 shrink-0'
const SORT_ICON_WRAPPER_CLASS = 'inline-flex h-3 w-3 shrink-0 items-center justify-center'
const DIFFICULTY_BADGE_CLASS =
  'inline-flex h-6 w-7 items-center justify-center rounded-lg px-1 text-xs font-bold leading-none'

const lampBadge = (lamp: string | null) => {
  if (lamp === 'FULL COMBO')
    return (
      <span class="rounded-lg bg-orange-200 px-2 py-1 text-xs font-bold text-orange-900">FC</span>
    )
  if (lamp === 'ALL JUSTICE')
    return (
      <span class="rounded-lg bg-yellow-200 px-2 py-1 text-xs font-bold text-yellow-900">AJ</span>
    )
  return <span class="px-2 py-1 text-xs">-</span>
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

  return (
    <div class="w-full">
      <Show
        when={props.records.length > 0}
        fallback={<p class="py-6 text-center text-gray-400">データがありません</p>}
      >
        <div
          ref={tableContainerRef}
          class="overflow-x-auto overflow-y-hidden rounded-md border border-gray-200"
        >
          <div class="min-w-[35.35rem]">
            <div class="border-b border-gray-200 bg-white">
              <div
                class="grid text-xs font-semibold"
                style={{ 'grid-template-columns': GRID_COLUMNS }}
              >
                <button
                  type="button"
                  class={`${HEADER_BUTTON_CLASS} justify-start pl-2`}
                  onClick={() => props.onSortChange('title')}
                >
                  <span>曲名</span>
                  {sortIndicator(props.sortKey === 'title', props.sortDirection)}
                </button>
                <button
                  type="button"
                  class={HEADER_BUTTON_CLASS}
                  onClick={() => props.onSortChange('difficulty')}
                >
                  <span>難</span>
                  {sortIndicator(props.sortKey === 'difficulty', props.sortDirection)}
                </button>
                <button
                  type="button"
                  class={HEADER_BUTTON_CLASS}
                  onClick={() => props.onSortChange('const')}
                >
                  <span>定数</span>
                  {sortIndicator(props.sortKey === 'const', props.sortDirection)}
                </button>
                <button
                  type="button"
                  class={HEADER_BUTTON_CLASS}
                  onClick={() => props.onSortChange('score')}
                >
                  <span>スコア</span>
                  {sortIndicator(props.sortKey === 'score', props.sortDirection)}
                </button>
                <button
                  type="button"
                  class={HEADER_BUTTON_CLASS}
                  onClick={() => props.onSortChange('rating')}
                >
                  <span>レート</span>
                  {sortIndicator(props.sortKey === 'rating', props.sortDirection)}
                </button>
                <button
                  type="button"
                  class={HEADER_BUTTON_CLASS}
                  onClick={() => props.onSortChange('lamp')}
                >
                  <span>ランプ</span>
                  {sortIndicator(props.sortKey === 'lamp', props.sortDirection)}
                </button>
                <div class="flex min-h-[34px] items-center justify-center text-center whitespace-nowrap">
                  <span>追加日</span>
                </div>
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
                          class="absolute left-0 top-0 grid w-full border-b border-gray-200 text-xs hover:bg-gray-100"
                          style={{
                            'grid-template-columns': GRID_COLUMNS,
                            transform: `translateY(${virtualRow.start - scrollMargin()}px)`,
                          }}
                        >
                          <div
                            class="flex min-h-[34px] min-w-0 items-center"
                            title={currentRecord().title}
                          >
                            <A
                              href={`/songs/${encodeURIComponent(currentRecord().id)}?diff=${encodeURIComponent(difficultyToQueryValue(currentRecord().difficulty))}`}
                              class="block pl-2 w-full truncate text-inherit hover:underline"
                            >
                              {currentRecord().title}
                            </A>
                          </div>
                          <div class="flex min-h-[34px] items-center justify-center whitespace-nowrap">
                            <div class="flex w-full justify-center">
                              <span
                                class={`${DIFFICULTY_BADGE_CLASS} ${difficultyBadgeClass(currentRecord().difficulty)}`}
                              >
                                {difficultyShort(currentRecord().difficulty)}
                              </span>
                            </div>
                          </div>
                          <div class="flex min-h-[34px] items-center justify-center text-center whitespace-nowrap">
                            <span class="inline-block w-full text-center leading-none">
                              {currentRecord().const.toFixed(1)}
                            </span>
                          </div>
                          <div class="flex min-h-[34px] items-center justify-center whitespace-nowrap">
                            <div class="flex w-full justify-center">
                              {!currentRecord().is_played
                                ? unplayedBadge()
                                : currentRecord().score.toLocaleString()}
                            </div>
                          </div>
                          <div class="flex min-h-[34px] items-center justify-center text-center whitespace-nowrap">
                            <span class="inline-block w-full text-center leading-none">
                              {!currentRecord().is_played ? '-' : currentRecord().rating.toFixed(2)}
                            </span>
                          </div>
                          <div class="flex min-h-[34px] items-center justify-center whitespace-nowrap">
                            <div class="flex w-full justify-center">
                              {!currentRecord().is_played ? (
                                <span class="px-2 py-1 text-xs">-</span>
                              ) : (
                                lampBadge(currentRecord().combo_lamp)
                              )}
                            </div>
                          </div>
                          <div class="flex min-h-[34px] items-center justify-center text-center whitespace-nowrap">
                            <span class="inline-block w-full text-center leading-none">
                              {formatRecordAddedDate(currentRecord().release)}
                            </span>
                          </div>
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

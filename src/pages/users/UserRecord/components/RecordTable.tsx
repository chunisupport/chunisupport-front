import { A } from '@solidjs/router'
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

interface RecordTableProps {
  records: PlayerRecordWithSongMeta[]
  statsOpen: boolean
}

import {
  difficultyColor,
  difficultyShort,
  difficultyToQueryValue,
} from '../../../../utils/difficultyUtils'

const GRID_COLUMNS = 'minmax(0,1fr) 3rem 3.5rem 3.7rem 3rem'
const ROW_HEIGHT = 34

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
    queueMicrotask(updateScrollMargin)
  })

  createEffect(() => {
    props.statsOpen

    // 統計表示の開閉でレイアウトが動くため、次フレームでも再計測する
    queueMicrotask(updateScrollMargin)
    requestAnimationFrame(() => {
      updateScrollMargin()
    })
  })

  const virtualRows = createMemo(() => rowVirtualizer.getVirtualItems())

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
          <div class="min-w-[28rem]">
            <div class="border-b border-gray-200 bg-white">
              <div
                class="grid text-xs font-semibold"
                style={{ 'grid-template-columns': GRID_COLUMNS }}
              >
                <div class="flex min-h-[34px] items-center px-2 py-1 text-center whitespace-nowrap">
                  曲名
                </div>
                <div class="flex min-h-[34px] items-center justify-center px-2 py-1 text-center whitespace-nowrap">
                  難易度
                </div>
                <div class="flex min-h-[34px] items-center justify-center px-2 py-1 text-center whitespace-nowrap">
                  定数
                </div>
                <div class="flex min-h-[34px] items-center justify-center px-2 py-1 text-center whitespace-nowrap">
                  スコア
                </div>
                <div class="flex min-h-[34px] items-center justify-center px-2 py-1 text-center whitespace-nowrap">
                  ランプ
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
                  const record = props.records[virtualRow.index]
                  if (!record) return null

                  return (
                    <div
                      class="absolute left-0 top-0 grid w-full border-b border-gray-200 text-xs hover:bg-gray-100"
                      style={{
                        'grid-template-columns': GRID_COLUMNS,
                        transform: `translateY(${virtualRow.start - scrollMargin()}px)`,
                      }}
                    >
                      <div
                        class="flex min-h-[34px] min-w-0 items-center px-2 py-1"
                        title={record.title}
                      >
                        <A
                          href={`/songs/${encodeURIComponent(record.id)}?diff=${encodeURIComponent(difficultyToQueryValue(record.difficulty))}`}
                          class="block w-full truncate text-inherit hover:underline"
                        >
                          {record.title}
                        </A>
                      </div>
                      <div class="flex min-h-[34px] items-center justify-center px-2 py-1 whitespace-nowrap">
                        <div class="flex w-full justify-center">
                          <span
                            class={`rounded-lg px-2 py-1 text-xs font-bold ${difficultyColor(record.difficulty)}`}
                          >
                            {difficultyShort(record.difficulty)}
                          </span>
                        </div>
                      </div>
                      <div class="flex min-h-[34px] items-center justify-center px-2 py-1 text-center whitespace-nowrap">
                        <span class="inline-block w-full text-center leading-none">
                          {record.const.toFixed(1)}
                        </span>
                      </div>
                      <div class="flex min-h-[34px] items-center justify-center px-2 py-1 whitespace-nowrap">
                        <div class="flex w-full justify-center">
                          {'is_played' in record && !record.is_played
                            ? unplayedBadge()
                            : record.score.toLocaleString()}
                        </div>
                      </div>
                      <div class="flex min-h-[34px] items-center justify-center px-2 py-1 whitespace-nowrap">
                        <div class="flex w-full justify-center">
                          {'is_played' in record && !record.is_played ? (
                            <span class="px-2 py-1 text-xs">-</span>
                          ) : (
                            lampBadge(record.combo_lamp)
                          )}
                        </div>
                      </div>
                    </div>
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

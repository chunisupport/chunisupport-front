import { A } from '@solidjs/router'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, type Component, Show } from 'solid-js'
import type { PlayerRecordWithSongMeta } from '../../../../utils/recordMerger'

interface RecordTableProps {
  records: PlayerRecordWithSongMeta[]
}

import { difficultyColor, difficultyShort } from '../../../../utils/difficultyUtils'

const lampBadge = (lamp: string | null) => {
  if (lamp === 'FULL COMBO')
    return (
      <span class="px-2 py-1 rounded-lg bg-orange-200 text-orange-900 text-xs font-bold">FC</span>
    )
  if (lamp === 'ALL JUSTICE')
    return (
      <span class="px-2 py-1 rounded-lg bg-yellow-200 text-yellow-900 text-xs font-bold">AJ</span>
    )
  return <span class="px-2 py-1 text-xs">-</span>
}

const unplayedBadge = () => (
  <span class="px-2 py-1 rounded-lg bg-gray-100 text-gray-400 text-xs">NoPlay</span>
)

export const RecordTable: Component<RecordTableProps> = (props) => {
  let tableContainerRef: HTMLDivElement | undefined
  const getScrollElement = () => document.getElementById('app-main') as HTMLDivElement | null

  const [scrollMargin, setScrollMargin] = createSignal(0)

  const rowVirtualizer = createVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    get count() {
      return props.records.length
    },
    getScrollElement,
    estimateSize: () => 34,
    overscan: 12,
    get scrollMargin() {
      return scrollMargin()
    },
  })

  const updateScrollMargin = () => {
    const scrollElement = getScrollElement()
    const tableElement = tableContainerRef
    if (!scrollElement || !tableElement) return

    const scrollRect = scrollElement.getBoundingClientRect()
    const tableRect = tableElement.getBoundingClientRect()
    const next = tableRect.top - scrollRect.top + scrollElement.scrollTop
    if (Math.abs(next - scrollMargin()) >= 1) {
      setScrollMargin(next)
    }
  }

  onMount(() => {
    updateScrollMargin()
    window.addEventListener('resize', updateScrollMargin)
  })

  onCleanup(() => {
    window.removeEventListener('resize', updateScrollMargin)
  })

  createEffect(() => {
    props.records.length
    queueMicrotask(updateScrollMargin)
  })

  const virtualRows = createMemo(() => rowVirtualizer.getVirtualItems())
  const paddingTop = createMemo(() => {
    const firstRow = virtualRows()[0]
    if (!firstRow) return 0
    // scrollMargin はスクロール親内でのテーブル開始位置なので、tbody の先頭余白には含めない
    return Math.max(firstRow.start - scrollMargin(), 0)
  })
  const paddingBottom = createMemo(() => {
    const rows = virtualRows()
    const lastRow = rows[rows.length - 1]
    if (!lastRow) return 0
    return rowVirtualizer.getTotalSize() - lastRow.end
  })

  return (
    <div class="w-full">
      <Show
        when={props.records.length > 0}
        fallback={<p class="py-6 text-center text-gray-400">データがありません</p>}
      >
        <div ref={tableContainerRef} class="overflow-x-auto rounded-md border border-gray-200">
          <table class="w-full table-auto border-collapse" aria-label="レコード一覧">
            <colgroup>
              <col />
              <col class="w-px" />
              <col class="w-px" />
              <col class="w-px" />
              <col class="w-px" />
            </colgroup>
            <thead>
              <tr class="border-b border-gray-200 bg-white text-xs font-semibold">
                <th class="px-2 py-1 text-left">曲名</th>
                <th class="px-2 py-1 text-right whitespace-nowrap">難易度</th>
                <th class="px-2 py-1 text-right whitespace-nowrap">定数</th>
                <th class="px-2 py-1 text-right whitespace-nowrap">スコア</th>
                <th class="px-2 py-1 text-right whitespace-nowrap">ランプ</th>
              </tr>
            </thead>

            <tbody>
              <Show when={paddingTop() > 0}>
                <tr aria-hidden="true">
                  <td colSpan={5} style={{ height: `${paddingTop()}px` }} />
                </tr>
              </Show>

              <For each={virtualRows()}>
                {(virtualRow) => {
                  const record = props.records[virtualRow.index]
                  if (!record) return null

                  return (
                    <tr
                      ref={rowVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      class="border-b border-gray-200 text-xs hover:bg-gray-100"
                    >
                      <td class="px-2 py-1" title={record.title}>
                        <A
                          href={`/songs/${encodeURIComponent(record.id)}`}
                          class="block truncate text-inherit hover:underline"
                        >
                          {record.title}
                        </A>
                      </td>
                      <td class="px-2 py-1 text-right whitespace-nowrap">
                        <span
                          class={`px-2 py-1 rounded-lg ${difficultyColor(record.difficulty)} text-xs font-bold`}
                        >
                          {difficultyShort(record.difficulty)}
                        </span>
                      </td>
                      <td class="px-2 py-1 text-right whitespace-nowrap">{record.const.toFixed(1)}</td>
                      <td class="px-2 py-1 text-right whitespace-nowrap">
                        {'is_played' in record && !record.is_played
                          ? unplayedBadge()
                          : record.score.toLocaleString()}
                      </td>
                      <td class="px-2 py-1 text-right whitespace-nowrap">
                        {'is_played' in record && !record.is_played ? (
                          <span class="px-2 py-1 text-xs">-</span>
                        ) : (
                          lampBadge(record.combo_lamp)
                        )}
                      </td>
                    </tr>
                  )
                }}
              </For>

              <Show when={paddingBottom() > 0}>
                <tr aria-hidden="true">
                  <td colSpan={5} style={{ height: `${paddingBottom()}px` }} />
                </tr>
              </Show>
            </tbody>
          </table>
        </div>
      </Show>
    </div>
  )
}

export default RecordTable

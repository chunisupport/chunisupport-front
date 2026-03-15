import { A } from '@solidjs/router'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { createEffect, For, type Component, Show } from 'solid-js'
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
  let scrollParentRef: HTMLDivElement | undefined

  const rowVirtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
    get count() {
      return props.records.length
    },
    getScrollElement: () => scrollParentRef ?? null,
    estimateSize: () => 32,
  })

  createEffect(() => {
    props.records

    const scrollElement = scrollParentRef
    if (!scrollElement) return

    scrollElement.scrollTop = 0
    if (props.records.length > 0) {
      rowVirtualizer.scrollToIndex(0)
    }
  })

  return (
    <div class="w-full">
      <Show
        when={props.records.length > 0}
        fallback={<p class="py-6 text-center text-gray-400">データがありません</p>}
      >
        <div
          ref={scrollParentRef}
          class="h-[60dvh] min-h-80 overflow-y-auto rounded-md border border-gray-200"
          role="table"
          aria-label="レコード一覧"
        >
          <div
            role="row"
            class="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_72px_64px_120px_72px] border-b border-gray-200 bg-white text-xs font-semibold"
          >
            <div role="columnheader" class="px-2 py-1 text-left">
              曲名
            </div>
            <div role="columnheader" class="px-2 py-1 text-center">
              難易度
            </div>
            <div role="columnheader" class="px-2 py-1 text-right">
              定数
            </div>
            <div role="columnheader" class="px-2 py-1 text-right">
              スコア
            </div>
            <div role="columnheader" class="px-2 py-1 text-center">
              ランプ
            </div>
          </div>

          <div class="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
            <For each={rowVirtualizer.getVirtualItems()}>
              {(virtualRow) => {
                const record = props.records[virtualRow.index]
                if (!record) return null

                return (
                  <div
                    ref={rowVirtualizer.measureElement}
                    data-index={virtualRow.index}
                    role="row"
                    class="absolute left-0 top-0 grid w-full grid-cols-[minmax(0,1fr)_72px_64px_120px_72px] border-b border-gray-200 text-xs hover:bg-gray-100"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    <div role="cell" class="truncate px-2 py-1" title={record.title}>
                      <A
                        href={`/songs/${encodeURIComponent(record.id)}`}
                        class="text-inherit hover:underline"
                      >
                        {record.title}
                      </A>
                    </div>
                    <div role="cell" class="px-2 py-1 text-center">
                      <span
                        class={`px-2 py-1 rounded-lg ${difficultyColor(record.difficulty)} text-xs font-bold`}
                      >
                        {difficultyShort(record.difficulty)}
                      </span>
                    </div>
                    <div role="cell" class="px-2 py-1 text-right">
                      {record.const.toFixed(1)}
                    </div>
                    <div role="cell" class="px-2 py-1 text-right">
                      {'is_played' in record && !record.is_played
                        ? unplayedBadge()
                        : record.score.toLocaleString()}
                    </div>
                    <div role="cell" class="px-2 py-1 text-center">
                      {'is_played' in record && !record.is_played ? (
                        <span class="px-2 py-1 text-xs">-</span>
                      ) : (
                        lampBadge(record.combo_lamp)
                      )}
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default RecordTable

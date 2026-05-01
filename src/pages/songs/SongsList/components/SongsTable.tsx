import { A } from '@solidjs/router'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import type { SongDTO } from '../../../../types/api'

const chartOrder = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'] as const
const ROW_HEIGHT = 37
const GRID_TEMPLATE_COLUMNS =
  'minmax(15rem, 1fr) minmax(15rem, 1fr) 8.1rem 3.75rem repeat(5, 3.4rem)'
const DIFFICULTY_SHORT_NAMES: Record<(typeof chartOrder)[number], string> = {
  BASIC: 'BAS',
  ADVANCED: 'ADV',
  EXPERT: 'EXP',
  MASTER: 'MAS',
  ULTIMA: 'ULT',
}
const HEADER_CELL_CLASS = 'px-3 py-2 text-left font-semibold whitespace-nowrap'
const CELL_CLASS = 'flex h-[37px] items-center px-3 whitespace-nowrap'
const DIFFICULTY_CELL_CLASS: Record<(typeof chartOrder)[number], string> = {
  BASIC: 'bg-[#00ab84] text-white',
  ADVANCED: 'bg-[#ff7e00] text-white',
  EXPERT: 'bg-[#f12929] text-white',
  MASTER: 'bg-[#8e1be5] text-white',
  ULTIMA: 'bg-[#000000] text-white',
}

type Props = {
  songs: SongDTO[]
}

const SongsTable = (props: Props) => {
  let tableContainerRef: HTMLDivElement | undefined
  let tableBodyRef: HTMLTableSectionElement | undefined
  let layoutResizeObserver: ResizeObserver | undefined
  const getScrollElement = () => document.getElementById('app-main') as HTMLDivElement | null

  const [scrollMargin, setScrollMargin] = createSignal(0)

  const rowVirtualizer = createVirtualizer<HTMLDivElement, HTMLTableRowElement>({
    get count() {
      return props.songs.length
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
    props.songs.length
    queueMicrotask(() => {
      updateScrollMargin()
      rowVirtualizer.scrollToIndex(0)
    })
  })

  const virtualRows = createMemo(() =>
    rowVirtualizer.getVirtualItems().filter((virtualRow) => virtualRow.index < props.songs.length)
  )

  return (
    <div
      ref={tableContainerRef}
      class="overflow-x-auto overflow-y-hidden rounded-md border border-gray-200 bg-white"
    >
      <table class="block min-w-[45rem] text-sm" aria-rowcount={props.songs.length}>
        <thead class="block bg-gray-50">
          <tr class="grid" style={{ 'grid-template-columns': GRID_TEMPLATE_COLUMNS }}>
            <th class={`${HEADER_CELL_CLASS} min-w-[15rem]`} scope="col">
              タイトル
            </th>
            <th class={`${HEADER_CELL_CLASS} min-w-[15rem]`} scope="col">
              アーティスト
            </th>
            <th class={HEADER_CELL_CLASS} scope="col">
              ジャンル
            </th>
            <th class={HEADER_CELL_CLASS} scope="col">
              BPM
            </th>
            <For each={chartOrder}>
              {(difficulty) => (
                <th class={`${HEADER_CELL_CLASS} bg-gray-50 text-center`} scope="col">
                  {DIFFICULTY_SHORT_NAMES[difficulty]}
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody
          ref={tableBodyRef}
          class="relative block"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          <For each={virtualRows()}>
            {(virtualRow) => {
              const song = createMemo(() => props.songs[virtualRow.index])

              return (
                <Show when={song()} keyed>
                  {(currentSong) => (
                    <tr
                      class="absolute left-0 top-0 grid w-full border-y border-white"
                      style={{
                        'grid-template-columns': GRID_TEMPLATE_COLUMNS,
                        transform: `translateY(${virtualRow.start - scrollMargin()}px)`,
                      }}
                      aria-rowindex={virtualRow.index + 2}
                    >
                      <td class={`${CELL_CLASS} min-w-0`}>
                        <A
                          href={`/songs/${encodeURIComponent(currentSong.id)}`}
                          class="block min-w-0 truncate font-sans text-primary-600 hover:underline"
                          title={currentSong.title}
                        >
                          {currentSong.title}
                        </A>
                      </td>
                      <td class={`${CELL_CLASS} min-w-0 font-sans`}>
                        <span class="block min-w-0 truncate" title={currentSong.artist}>
                          {currentSong.artist}
                        </span>
                      </td>
                      <td class={`${CELL_CLASS} overflow-hidden`}>
                        <span class="block w-full truncate" title={currentSong.genre}>
                          {currentSong.genre}
                        </span>
                      </td>
                      <td class={CELL_CLASS}>{currentSong.bpm ?? '-'}</td>
                      <For each={chartOrder}>
                        {(difficulty) => {
                          const chart = currentSong.charts[difficulty]

                          return (
                            <td
                              class={`${CELL_CLASS} justify-center font-medium ${DIFFICULTY_CELL_CLASS[difficulty]} ${chart?.is_const_unknown ? 'opacity-50' : ''}`}
                            >
                              {chart ? (
                                <>
                                  <span>{chart.const.toFixed(1)}</span>
                                  {chart.is_const_unknown ? (
                                    <sub class="text-[0.65em] leading-none">?</sub>
                                  ) : null}
                                </>
                              ) : null}
                            </td>
                          )
                        }}
                      </For>
                    </tr>
                  )}
                </Show>
              )
            }}
          </For>
        </tbody>
      </table>
    </div>
  )
}

export default SongsTable

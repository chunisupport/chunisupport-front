import { A } from '@solidjs/router'
import { createVirtualizer } from '@tanstack/solid-virtual'
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import type { SongDTO } from '../../../../types/api'
import { DIFFICULTY_SHORT_NAME_MAP, difficultyBadgeClass } from '../../../../utils/difficultyUtils'

const chartOrder = ['BASIC', 'ADVANCED', 'EXPERT', 'MASTER', 'ULTIMA'] as const
const ROW_HEIGHT = 37
const GRID_TEMPLATE_COLUMNS =
  'minmax(15rem, 1fr) minmax(15rem, 1fr) 8.1rem 5.2rem 3.75rem repeat(5, 3.4rem)'
const HEADER_CELL_CLASS = 'px-3 py-2 font-semibold whitespace-nowrap bg-gray-50'
const CELL_CLASS = 'flex h-[37px] items-center px-3 whitespace-nowrap'
type Props = {
  songs: SongDTO[]
}

const formatAddedDate = (release: string | null): string => {
  if (!release) return '-'

  const matched = release.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!matched) return '-'

  const [, year, month, day] = matched
  return `${year.slice(-2)}/${month}/${day}`
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
        <thead class="block">
          <tr class="grid" style={{ 'grid-template-columns': GRID_TEMPLATE_COLUMNS }}>
            <th class={`${HEADER_CELL_CLASS} min-w-[15rem] text-left`} scope="col">
              タイトル
            </th>
            <th class={`${HEADER_CELL_CLASS} min-w-[15rem] text-left`} scope="col">
              アーティスト
            </th>
            <th class={`${HEADER_CELL_CLASS} text-center`} scope="col">
              ジャンル
            </th>
            <th class={`${HEADER_CELL_CLASS} text-center`} scope="col">
              追加日
            </th>
            <th class={`${HEADER_CELL_CLASS} text-center`} scope="col">
              BPM
            </th>
            <For each={chartOrder}>
              {(difficulty) => (
                <th class={`${HEADER_CELL_CLASS} text-center`} scope="col">
                  {DIFFICULTY_SHORT_NAME_MAP[difficulty]}
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody
          ref={tableBodyRef}
          class="relative block min-w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          <For each={virtualRows()}>
            {(virtualRow) => {
              const song = createMemo(() => props.songs[virtualRow.index])

              return (
                <Show when={song()} keyed>
                  {(currentSong) => (
                    <tr
                      class="absolute left-0 top-0 grid min-w-full border-t border-gray-100"
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
                      <td class={`${CELL_CLASS} justify-center overflow-hidden`}>
                        <span class="block w-full truncate text-center" title={currentSong.genre}>
                          {currentSong.genre}
                        </span>
                      </td>
                      <td class={`${CELL_CLASS} justify-center`}>
                        {formatAddedDate(currentSong.release)}
                      </td>
                      <td class={`${CELL_CLASS} justify-center`}>{currentSong.bpm ?? '-'}</td>
                      <For each={chartOrder}>
                        {(difficulty) => {
                          const chart = currentSong.charts[difficulty]

                          return (
                            <td
                              class={`${CELL_CLASS} justify-center font-medium ${chart ? difficultyBadgeClass(difficulty) : 'bg-white text-gray-700'} ${chart?.is_const_unknown ? 'opacity-50' : ''}`}
                            >
                              {chart ? (
                                <>
                                  <span>{chart.const.toFixed(1)}</span>
                                  {chart.is_const_unknown ? (
                                    <sup class="text-[0.65em] leading-none">?</sup>
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

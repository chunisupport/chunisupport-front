import { createVirtualizer } from '@tanstack/solid-virtual'
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import type { WorldsendSongDTO } from '../../../../types/api'
import { renderSortIndicator } from '../../../users/components/RecordTableUiParts'
import type { SortDirection } from '../../../users/recordTable/sortingQuery'
import {
  SongListAddedDateCell,
  SongListArtistCell,
  SongListBpmCell,
  SongListGenreCell,
  SongListTitleCell,
} from '../../components/SongListMetaCells'
import type { WorldsendSongSortKey } from '../utils/sorting'

const ROW_HEIGHT = 37
const GRID_TEMPLATE_COLUMNS =
  'minmax(15rem, 1fr) minmax(15rem, 1fr) 8.1rem 5.2rem 3.75rem 4.8rem 4.8rem'
const HEADER_CELL_CLASS = 'font-semibold whitespace-nowrap bg-gray-50'
const COMMON_CELL_STYLE = "flex items-center px-3 whitespace-nowrap"
const HEADER_BUTTON_CLASS = COMMON_CELL_STYLE + " min-h-[" + ROW_HEIGHT + "px] w-full py-2 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset"
const CELL_CLASS = COMMON_CELL_STYLE + " h-[" + ROW_HEIGHT + "px]"

type Props = {
  songs: WorldsendSongDTO[]
  sortKey: WorldsendSongSortKey | null
  sortDirection: SortDirection | null
  onSortChange: (key: WorldsendSongSortKey) => void
}

type HeaderButtonProps = {
  label: string
  active: boolean
  direction: SortDirection | null
  align?: 'start' | 'center'
  onClick: () => void
}

const sortAriaValue = (
  active: boolean,
  direction: SortDirection | null
): 'ascending' | 'descending' | 'none' => {
  if (!active || !direction) return 'none'
  return direction === 'asc' ? 'ascending' : 'descending'
}

const WorldsendHeaderButton = (props: HeaderButtonProps) => (
  <th
    class={HEADER_CELL_CLASS}
    scope="col"
    aria-sort={sortAriaValue(props.active, props.direction)}
  >
    <button
      type="button"
      class={`${HEADER_BUTTON_CLASS} ${props.align === 'start' ? 'justify-start' : 'justify-center'}`}
      onClick={props.onClick}
    >
      <span
        class={`flex flex-col ${props.align === 'start' ? 'items-start' : 'items-center'} justify-center gap-0.5 leading-none`}
      >
        <span>{props.label}</span>
        {renderSortIndicator(props.active, props.direction)}
      </span>
    </button>
  </th>
)

const StarLevel = (props: { level: number | null | undefined }) => {
  if (props.level == null) {
    return <span>-</span>
  }
  return <span>★{props.level}</span>
}

const WorldsendSongsTable = (props: Props) => {
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
            <WorldsendHeaderButton
              label="タイトル"
              active={props.sortKey === 'title'}
              direction={props.sortDirection}
              align="start"
              onClick={() => props.onSortChange('title')}
            />
            <WorldsendHeaderButton
              label="アーティスト"
              active={props.sortKey === 'artist'}
              direction={props.sortDirection}
              align="start"
              onClick={() => props.onSortChange('artist')}
            />
            <WorldsendHeaderButton
              label="ジャンル"
              active={props.sortKey === 'genre'}
              direction={props.sortDirection}
              onClick={() => props.onSortChange('genre')}
            />
            <WorldsendHeaderButton
              label="追加日"
              active={props.sortKey === 'release'}
              direction={props.sortDirection}
              onClick={() => props.onSortChange('release')}
            />
            <WorldsendHeaderButton
              label="BPM"
              active={props.sortKey === 'bpm'}
              direction={props.sortDirection}
              onClick={() => props.onSortChange('bpm')}
            />
            <WorldsendHeaderButton
              label="属性"
              active={props.sortKey === 'attribute'}
              direction={props.sortDirection}
              onClick={() => props.onSortChange('attribute')}
            />
            <WorldsendHeaderButton
              label="レベル"
              active={props.sortKey === 'level'}
              direction={props.sortDirection}
              onClick={() => props.onSortChange('level')}
            />
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
                  {(currentSong) => {
                    const chart = currentSong.charts?.WORLDSEND
                    return (
                      <tr
                        class="absolute left-0 top-0 grid min-w-full border-t border-gray-100"
                        style={{
                          'grid-template-columns': GRID_TEMPLATE_COLUMNS,
                          transform: `translateY(${virtualRow.start - scrollMargin()}px)`,
                        }}
                        aria-rowindex={virtualRow.index + 2}
                      >
                        <SongListTitleCell
                          href={`/songs/worldsend/${encodeURIComponent(currentSong.id)}`}
                          title={currentSong.title}
                          class={`${CELL_CLASS} min-w-0`}
                        />
                        <SongListArtistCell
                          artist={currentSong.artist}
                          class={`${CELL_CLASS} min-w-0 font-sans`}
                        />
                        <SongListGenreCell
                          genre={currentSong.genre}
                          class={`${CELL_CLASS} justify-center overflow-hidden`}
                        />
                        <SongListAddedDateCell
                          release={currentSong.release}
                          class={`${CELL_CLASS} justify-center`}
                        />
                        <SongListBpmCell
                          bpm={currentSong.bpm}
                          class={`${CELL_CLASS} justify-center`}
                        />
                        <td class={`${CELL_CLASS} justify-center`}>{chart?.attribute ?? '-'}</td>
                        <td class={`${CELL_CLASS} justify-center`}>
                          <StarLevel level={chart?.level_star} />
                        </td>
                      </tr>
                    )
                  }}
                </Show>
              )
            }}
          </For>
        </tbody>
      </table>
    </div>
  )
}

export default WorldsendSongsTable

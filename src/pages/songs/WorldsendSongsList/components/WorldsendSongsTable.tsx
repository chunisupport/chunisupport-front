import { createMemo, For, Show } from 'solid-js'
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
import { createVirtualizedSongsTable, sortAriaValue } from '../../components/virtualizedSongsTable'
import type { WorldsendSongSortKey } from '../utils/sorting'

const ROW_HEIGHT = 37
const GRID_TEMPLATE_COLUMNS =
  'minmax(15rem, 1fr) minmax(15rem, 1fr) 8.1rem 5.2rem 3.75rem 4.8rem 4.8rem'
const HEADER_CELL_CLASS = 'font-semibold whitespace-nowrap bg-gray-50'
const COMMON_CELL_STYLE = 'flex items-center px-3 whitespace-nowrap'
const HEADER_BUTTON_CLASS = `${COMMON_CELL_STYLE} min-h-[${ROW_HEIGHT}px] w-full py-2 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset`
const CELL_CLASS = `${COMMON_CELL_STYLE} h-[${ROW_HEIGHT}px]`

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
  const virtualizedTable = createVirtualizedSongsTable({
    getCount: () => props.songs.length,
    rowHeight: ROW_HEIGHT,
  })

  const handleSortChange = (key: WorldsendSongSortKey) => {
    props.onSortChange(key)
    virtualizedTable.resetToTop()
  }

  const virtualRows = createMemo(() => virtualizedTable.virtualRows())

  return (
    <div
      ref={virtualizedTable.setTableContainerRef}
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
              onClick={() => handleSortChange('title')}
            />
            <WorldsendHeaderButton
              label="アーティスト"
              active={props.sortKey === 'artist'}
              direction={props.sortDirection}
              align="start"
              onClick={() => handleSortChange('artist')}
            />
            <WorldsendHeaderButton
              label="ジャンル"
              active={props.sortKey === 'genre'}
              direction={props.sortDirection}
              onClick={() => handleSortChange('genre')}
            />
            <WorldsendHeaderButton
              label="追加日"
              active={props.sortKey === 'release'}
              direction={props.sortDirection}
              onClick={() => handleSortChange('release')}
            />
            <WorldsendHeaderButton
              label="BPM"
              active={props.sortKey === 'bpm'}
              direction={props.sortDirection}
              onClick={() => handleSortChange('bpm')}
            />
            <WorldsendHeaderButton
              label="属性"
              active={props.sortKey === 'attribute'}
              direction={props.sortDirection}
              onClick={() => handleSortChange('attribute')}
            />
            <WorldsendHeaderButton
              label="レベル"
              active={props.sortKey === 'level'}
              direction={props.sortDirection}
              onClick={() => handleSortChange('level')}
            />
          </tr>
        </thead>
        <tbody
          ref={virtualizedTable.setTableBodyRef}
          class="relative block min-w-full"
          style={{ height: `${virtualizedTable.getTotalSize()}px` }}
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
                          transform: `translateY(${virtualRow.start - virtualizedTable.scrollMargin()}px)`,
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

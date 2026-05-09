import { For } from 'solid-js'
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
  class: string
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
  <th class={props.class} scope="col" aria-sort={sortAriaValue(props.active, props.direction)}>
    <button
      type="button"
      class={`flex min-h-[37px] w-full items-center px-3 py-2 text-center whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset ${props.align === 'start' ? 'justify-start' : 'justify-center'}`}
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
  return (
    <div class="overflow-x-auto rounded-md border border-gray-200 bg-white">
      <table class="w-full max-w-full text-sm">
        <thead class="bg-gray-50 text-left">
          <tr>
            <WorldsendHeaderButton
              label="タイトル"
              class="w-1/2 min-w-[15rem] font-semibold whitespace-nowrap"
              active={props.sortKey === 'title'}
              direction={props.sortDirection}
              align="start"
              onClick={() => props.onSortChange('title')}
            />
            <WorldsendHeaderButton
              label="アーティスト"
              class="w-1/2 min-w-[15rem] font-semibold whitespace-nowrap"
              active={props.sortKey === 'artist'}
              direction={props.sortDirection}
              align="start"
              onClick={() => props.onSortChange('artist')}
            />
            <WorldsendHeaderButton
              label="ジャンル"
              class="w-px font-semibold whitespace-nowrap text-center"
              active={props.sortKey === 'genre'}
              direction={props.sortDirection}
              onClick={() => props.onSortChange('genre')}
            />
            <WorldsendHeaderButton
              label="追加日"
              class="w-px font-semibold whitespace-nowrap text-center"
              active={props.sortKey === 'release'}
              direction={props.sortDirection}
              onClick={() => props.onSortChange('release')}
            />
            <WorldsendHeaderButton
              label="BPM"
              class="w-px font-semibold whitespace-nowrap text-center"
              active={props.sortKey === 'bpm'}
              direction={props.sortDirection}
              onClick={() => props.onSortChange('bpm')}
            />
            <WorldsendHeaderButton
              label="属性"
              class="w-px font-semibold whitespace-nowrap text-center"
              active={props.sortKey === 'attribute'}
              direction={props.sortDirection}
              onClick={() => props.onSortChange('attribute')}
            />
            <WorldsendHeaderButton
              label="レベル"
              class="w-px font-semibold whitespace-nowrap text-center"
              active={props.sortKey === 'level'}
              direction={props.sortDirection}
              onClick={() => props.onSortChange('level')}
            />
          </tr>
        </thead>
        <tbody>
          <For each={props.songs}>
            {(song) => {
              const chart = song.charts?.WORLDSEND
              return (
                <tr class="border-t border-gray-100 align-top">
                  <SongListTitleCell
                    href={`/songs/worldsend/${encodeURIComponent(song.id)}`}
                    title={song.title}
                    class="px-3 py-2 max-w-0"
                  />
                  <SongListArtistCell artist={song.artist} class="font-sans px-3 py-2 max-w-0" />
                  <SongListGenreCell
                    genre={song.genre}
                    class="px-3 py-2 whitespace-nowrap text-center"
                  />
                  <SongListAddedDateCell
                    release={song.release}
                    class="px-3 py-2 whitespace-nowrap text-center"
                  />
                  <SongListBpmCell bpm={song.bpm} class="px-3 py-2 whitespace-nowrap text-center" />
                  <td class="px-3 py-2 whitespace-nowrap text-center">{chart?.attribute ?? '-'}</td>
                  <td class="px-3 py-2 whitespace-nowrap text-center">
                    <StarLevel level={chart?.level_star} />
                  </td>
                </tr>
              )
            }}
          </For>
        </tbody>
      </table>
    </div>
  )
}

export default WorldsendSongsTable
